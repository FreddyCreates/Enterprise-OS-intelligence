import { describe, it, expect } from 'vitest';
import {
  ScopeKind,
  TriggerSource,
  gateAction,
} from '../src/killswitch/state.js';
import type {
  KillSwitchState,
  KillSwitchStore,
  Scope,
  TripPayload,
  ResetPayload,
} from '../src/killswitch/state.js';

/** Minimal in-memory store for the asymmetry test. */
class InMemoryKillStore implements KillSwitchStore {
  private states = new Map<string, KillSwitchState>();

  private key(s: Scope): string { return `${s.kind}:${s.ref ?? ''}`; }

  async get(scope: Scope): Promise<KillSwitchState> {
    return this.states.get(this.key(scope)) ?? {
      scope, phase: 'set', trippedAt: null, trippedBy: null,
      tripSource: null, cooldownUntil: null,
    };
  }

  async trip(p: TripPayload): Promise<KillSwitchState> {
    const next: KillSwitchState = {
      scope:       p.scope,
      phase:       'tripped',
      trippedAt:   new Date().toISOString() as unknown as never,
      trippedBy:   p.trippedBy,
      tripSource:  p.trigger,
      cooldownUntil: null,
    };
    this.states.set(this.key(p.scope), next);
    return next;
  }

  async reset(p: ResetPayload): Promise<KillSwitchState> {
    // Asymmetry: enforce minimum signature count.
    const minSigs = p.scope.kind === ScopeKind.System ? 4 : 3;
    if (p.signatures.length < minSigs) {
      throw new Error(`reset: insufficient signatures (need ${minSigs}, got ${p.signatures.length})`);
    }
    if (!p.reason || p.reason.trim().length === 0) {
      throw new Error('reset: reason is mandatory');
    }
    const next: KillSwitchState = {
      scope:       p.scope,
      phase:       'set',
      trippedAt:   null,
      trippedBy:   null,
      tripSource:  null,
      cooldownUntil: null,
    };
    this.states.set(this.key(p.scope), next);
    return next;
  }

  async isAnyTripped(resources: ReadonlyArray<Scope>): Promise<
    { readonly tripped: boolean; readonly which: Scope | null }
  > {
    for (const r of resources) {
      const s = await this.get(r);
      if (s.phase === 'tripped') return { tripped: true, which: r };
    }
    return { tripped: false, which: null };
  }
}

describe('KillSwitch — asymmetric stop/start', () => {
  it('any single signer can trip', async () => {
    const store: KillSwitchStore = new InMemoryKillStore();
    const scope: Scope = { kind: ScopeKind.Agent, ref: 'voxis-x' };
    const result = await store.trip({
      scope,
      trigger:        TriggerSource.Loss,
      triggerDetails: { drawdownPct: 0.04 },
      trippedBy:      ('council-member-1' as unknown as never),
      signature:      ('0'.repeat(64) as unknown as never),
    });
    expect(result.phase).toBe('tripped');
  });

  it('a single signer CANNOT reset (3-of-5 required for non-system)', async () => {
    const store = new InMemoryKillStore();
    const scope: Scope = { kind: ScopeKind.Strategy, ref: 'strat-1' };
    await store.trip({
      scope,
      trigger: TriggerSource.Drift,
      triggerDetails: {},
      trippedBy: ('council-1' as unknown as never),
      signature: ('a'.repeat(64) as unknown as never),
    });

    await expect(
      store.reset({
        scope,
        resetBy:        [('council-1' as unknown as never)],
        signatures:     [('a'.repeat(64) as unknown as never)],
        reason:         'enough already',
        priorTripHash:  ('0'.repeat(64) as unknown as never),
      }),
    ).rejects.toThrow(/insufficient signatures/);
  });

  it('3 signers can reset a non-system scope', async () => {
    const store = new InMemoryKillStore();
    const scope: Scope = { kind: ScopeKind.Strategy, ref: 'strat-1' };
    await store.trip({
      scope,
      trigger: TriggerSource.Drift,
      triggerDetails: {},
      trippedBy: ('council-1' as unknown as never),
      signature: ('a'.repeat(64) as unknown as never),
    });

    const result = await store.reset({
      scope,
      resetBy: [
        ('council-1' as unknown as never),
        ('council-2' as unknown as never),
        ('council-3' as unknown as never),
      ],
      signatures: [
        ('a'.repeat(64) as unknown as never),
        ('b'.repeat(64) as unknown as never),
        ('c'.repeat(64) as unknown as never),
      ],
      reason: 'post-mortem complete, strategy parameters tightened',
      priorTripHash: ('0'.repeat(64) as unknown as never),
    });
    expect(result.phase).toBe('set');
  });

  it('system scope reset requires more signatures than non-system', async () => {
    const store = new InMemoryKillStore();
    const scope: Scope = { kind: ScopeKind.System, ref: null };
    await store.trip({
      scope,
      trigger: TriggerSource.Substrate,
      triggerDetails: {},
      trippedBy: ('auto:custos' as unknown as never),
      signature: ('a'.repeat(64) as unknown as never),
    });

    // 3 sigs is enough for non-system but NOT for system.
    await expect(
      store.reset({
        scope,
        resetBy: ['c1','c2','c3'].map((x) => x as unknown as never),
        signatures: ['a','b','c'].map((x) => x.repeat(64) as unknown as never),
        reason: 'tested',
        priorTripHash: ('0'.repeat(64) as unknown as never),
      }),
    ).rejects.toThrow(/insufficient signatures/);
  });

  it('reset requires a non-empty reason', async () => {
    const store = new InMemoryKillStore();
    const scope: Scope = { kind: ScopeKind.Agent, ref: 'v-1' };
    await store.trip({
      scope, trigger: TriggerSource.Agent, triggerDetails: {},
      trippedBy: ('auto:custos' as unknown as never),
      signature: ('a'.repeat(64) as unknown as never),
    });

    await expect(
      store.reset({
        scope,
        resetBy: ['c1','c2','c3'].map((x) => x as unknown as never),
        signatures: ['a','b','c'].map((x) => x.repeat(64) as unknown as never),
        reason: '',
        priorTripHash: ('0'.repeat(64) as unknown as never),
      }),
    ).rejects.toThrow(/reason is mandatory/);
  });

  it('gateAction fails closed when the store throws', async () => {
    const broken: KillSwitchStore = {
      get:          async () => { throw new Error('substrate unreachable'); },
      trip:         async () => { throw new Error('substrate unreachable'); },
      reset:        async () => { throw new Error('substrate unreachable'); },
      isAnyTripped: async () => { throw new Error('substrate unreachable'); },
    };
    const result = await gateAction(broken, [{ kind: ScopeKind.Agent, ref: 'v-1' }]);
    expect(result.allowed).toBe(false);
  });
});
