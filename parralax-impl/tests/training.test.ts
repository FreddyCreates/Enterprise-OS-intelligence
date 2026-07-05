import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

import { HistoricalReplay } from '../src/training/replay.js';
import {
  ReputationLedger,
  PHI_INV,
  INITIAL_SCORE,
} from '../src/training/reputation.js';
import { TrainingSession } from '../src/training/session.js';
import type { TrainableAgent, AgentSignal } from '../src/training/session.js';
import { AugurAgent } from '../src/agents/augur.js';
import {
  ChronoWriter,
  InMemoryChronoStore,
  TestSigner,
} from '../src/chrono/receipt.js';
import { ReceiptClass } from '../src/types/chrono.js';
import {
  Level,
  Capability,
  DEFAULT_GRANTS,
} from '../src/types/voxis.js';
import type { VoxisAuthority } from '../src/types/voxis.js';
import {
  computeBlockHash,
  PlaceholderVerifier,
} from '../src/voxis/authority.js';
import type {
  AssetId,
  VenueId,
  VoxisId,
  MandateId,
  PrincipalId,
  Iso8601,
  DecimalUsd,
  Signature,
} from '../src/types/common.js';
import { RiskTier } from '../src/types/common.js';

const ASSET = 'equity:tsla' as AssetId;
const VENUE = 'paper'       as VenueId;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeAuthority(voxisId: VoxisId, level = Level.Simulator): VoxisAuthority {
  const base = {
    voxisId,
    level,
    mandateId:    'mandate-augur-test' as MandateId,
    capabilities: DEFAULT_GRANTS[level],
    walletScope:  { fiatAccounts: [], cryptoWallets: [], exchangeKeys: [], internalUnits: [] },
    capitalLimitsUsd: {
      perOrderMax: '0' as DecimalUsd, perDayMax: '0' as DecimalUsd,
      perAssetMax: '0' as DecimalUsd, aggregateMax: '0' as DecimalUsd,
    },
    positionLimits: { maxConcurrentOpen: 0, maxLeverage: 1.0 },
    riskTier:       RiskTier.Strict,
    killSwitchGroup: 'test',
    audit: { chronoChainId: 'test-chain', parentVoxisId: null },
    promotion: {
      issuedAt:    '2026-05-28T00:00:00.000Z' as Iso8601,
      issuedBy:    'operator' as PrincipalId,
      expiresAt:   null,
      revocableBy: ['operator' as PrincipalId],
    },
  };
  const blockHash = computeBlockHash(base);
  const signature = createHash('sha256').update(blockHash + 'parralax-placeholder-pepper').digest('hex') as Signature;
  return { ...base, blockHash, signature };
}

function makeAugur(voxisId: VoxisId): AugurAgent {
  return new AugurAgent(
    makeAuthority(voxisId, Level.Simulator),
    { verifier: new PlaceholderVerifier(), heartbeatMs: 873 },
    { shortWindow: 5, longWindow: 21, orderSize: '10', asset: ASSET },
  );
}

// ── HistoricalReplay determinism ───────────────────────────────────────────

describe('HistoricalReplay — deterministic seeded price series', () => {
  it('produces identical ticks for identical seeds', () => {
    const a = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 42, ticks: 200, startPrice: 100 }).toArray();
    const b = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 42, ticks: 200, startPrice: 100 }).toArray();
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(b[i]!.price).toBe(a[i]!.price);
      expect(b[i]!.regime).toBe(a[i]!.regime);
      expect(b[i]!.quote.bid).toBe(a[i]!.quote.bid);
      expect(b[i]!.quote.ask).toBe(a[i]!.quote.ask);
    }
  });

  it('produces different ticks for different seeds', () => {
    const a = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 1, ticks: 200, startPrice: 100 }).toArray();
    const b = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 2, ticks: 200, startPrice: 100 }).toArray();
    // Cannot assert every tick differs, but at least half of them should.
    let differ = 0;
    for (let i = 0; i < a.length; i++) if (b[i]!.price !== a[i]!.price) differ++;
    expect(differ / a.length).toBeGreaterThan(0.5);
  });

  it('cycles through every regime in the default program', () => {
    const ticks = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 7, ticks: 2000, startPrice: 100 }).toArray();
    const seenRegimes = new Set(ticks.map((t) => t.regime));
    expect(seenRegimes.has('calm')).toBe(true);
    expect(seenRegimes.has('trending')).toBe(true);
    expect(seenRegimes.has('choppy')).toBe(true);
    expect(seenRegimes.has('crash')).toBe(true);
    expect(seenRegimes.has('recovery')).toBe(true);
  });

  it('rejects non-integer seeds', () => {
    expect(() => new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 1.5, ticks: 10, startPrice: 100 })).toThrow();
  });
});

// ── ReputationLedger φ-EMA math ────────────────────────────────────────────

describe('ReputationLedger — φ-EMA math', () => {
  it('initialises newly-tracked agents at 0.5 (neutral)', () => {
    const l = new ReputationLedger();
    const r = l.get('vox-1' as VoxisId);
    expect(r.score).toBe(INITIAL_SCORE);
    expect(r.outcomeCount).toBe(0);
  });

  it('updates according to newRep = PHI_INV · outcome + (1 - PHI_INV) · oldRep', () => {
    const l = new ReputationLedger();
    const v = 'vox-2' as VoxisId;
    const d1 = l.update(v, 1.0);
    // 0.618 * 1.0 + 0.382 * 0.5 = 0.618 + 0.191 = 0.809
    expect(d1.newScore).toBeCloseTo(PHI_INV * 1.0 + (1 - PHI_INV) * 0.5, 10);
    expect(d1.priorScore).toBe(0.5);
    expect(d1.outcome).toBe(1.0);

    const d2 = l.update(v, 0.0);
    // 0.618 * 0.0 + 0.382 * 0.809 = 0.309
    expect(d2.newScore).toBeCloseTo(PHI_INV * 0.0 + (1 - PHI_INV) * d1.newScore, 10);
  });

  it('is bounded in [0, 1] for any legal outcome', () => {
    const l = new ReputationLedger();
    const v = 'vox-3' as VoxisId;
    for (let i = 0; i < 200; i++) {
      const outcome = (i % 2 === 0) ? 1.0 : 0.0;
      const r = l.update(v, outcome);
      expect(r.newScore).toBeGreaterThanOrEqual(0);
      expect(r.newScore).toBeLessThanOrEqual(1);
    }
  });

  it('converges geometrically to a constant outcome stream', () => {
    const l = new ReputationLedger();
    const v = 'vox-4' as VoxisId;
    let last = 0.5;
    for (let i = 0; i < 60; i++) {
      const r = l.update(v, 1.0);
      last = r.newScore;
    }
    expect(last).toBeGreaterThan(0.999);   // converged toward 1
  });

  it('rejects out-of-range outcomes rather than silently clamping', () => {
    const l = new ReputationLedger();
    expect(() => l.update('vox-5' as VoxisId, 1.5)).toThrow();
    expect(() => l.update('vox-5' as VoxisId, -0.1)).toThrow();
    expect(() => l.update('vox-5' as VoxisId, Number.NaN)).toThrow();
  });

  it('reset() forces score back to 0.5 and zeros the outcome count', () => {
    const l = new ReputationLedger();
    const v = 'vox-6' as VoxisId;
    for (let i = 0; i < 10; i++) l.update(v, 1.0);
    const before = l.get(v);
    expect(before.score).toBeGreaterThan(0.9);
    expect(before.outcomeCount).toBe(10);

    const after = l.reset(v);
    expect(after.score).toBe(INITIAL_SCORE);
    expect(after.outcomeCount).toBe(0);
  });
});

// ── Doctrine preservation: reputation NEVER updates authority ──────────────

describe('DOCTRINE — reputation and authority are decoupled', () => {
  it('the ReputationLedger module exposes NO method that changes VOXIS Level or Capability', async () => {
    const mod = await import('../src/training/reputation.js');
    const forbiddenNames = [
      'promote', 'promoteAgent', 'raiseLevel', 'grantCapability',
      'addCapability', 'setLevel', 'mint', 'authorise', 'authorize',
    ];
    for (const name of forbiddenNames) {
      expect(name in mod).toBe(false);
    }
    // Positive side: what IS exported.
    expect('ReputationLedger' in mod).toBe(true);
    expect('PHI_INV' in mod).toBe(true);
    expect('INITIAL_SCORE' in mod).toBe(true);
  });

  it('the training module exposes NO Level-changing or Capability-granting API', async () => {
    const mod = await import('../src/training/session.js');
    const forbidden = [
      'promote', 'promoteAgent', 'raiseLevel', 'grantCapability',
      'setCapability', 'authorise', 'authorize', 'grantAuthority',
      'transferReputation',
    ];
    for (const name of forbidden) expect(name in mod).toBe(false);
  });

  it('the training receipt module has NO receipt class that raises an agent level', async () => {
    const receiptMod = await import('../src/types/chrono.js');
    const values = Object.values(receiptMod.ReceiptClass);
    // No receipt class combines 'training' + a level change; the closest
    // is TrainingStagePromotion which is stage T1..T5, NOT Level 0..6.
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const isTrainingClass  = value.startsWith('training.');
      const suggestsLevelChange = /(?:level|authority)/i.test(value);
      expect(isTrainingClass && suggestsLevelChange).toBe(false);
    }
  });

  it('AugurAgent has no code path that raises its own level', () => {
    // Verified by BOTH: the class does not export any level-changing API,
    // AND its own initialAuthority is not mutable from within.
    const augur = makeAugur('vox-augur-1' as VoxisId);
    const initial = augur['initialAuthority'] as VoxisAuthority;
    expect(initial.level).toBe(Level.Simulator);
    // No method should exist that changes this. Runtime attempt to mutate
    // returns silently in non-strict / throws in strict — either way,
    // deep-freeze would prevent it once .beat() runs. Here we assert the
    // shape of the API, not attempt runtime mutation.
    expect(typeof (augur as unknown as Record<string, unknown>)['promote']).toBe('undefined');
    expect(typeof (augur as unknown as Record<string, unknown>)['setLevel']).toBe('undefined');
  });
});

// ── TrainingSession end-to-end ─────────────────────────────────────────────

describe('TrainingSession — deterministic end-to-end run', () => {
  async function runSession(seed: number) {
    const chainId = `train-${seed}`;
    const store   = new InMemoryChronoStore();
    const signer  = new TestSigner('operator-test' as PrincipalId);
    const writer  = new ChronoWriter(store, signer);
    const ledger  = new ReputationLedger();
    const replay  = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed, ticks: 500, startPrice: 100 });
    const agent   = makeAugur(('vox-augur-' + seed) as VoxisId);
    const session = new TrainingSession({
      asset:            ASSET,
      venue:            VENUE,
      replay,
      agent,
      ledger,
      writer,
      operator:         'operator-test' as PrincipalId,
      chronoChainId:    chainId,
      initialUsd:       100_000,
      deterministicIds: true,
    });
    const result = await session.run();
    return { result, store, chainId, ledger, agent };
  }

  it('writes a session_started receipt, a session_ended receipt, and correctly links the chain', async () => {
    const { result, store, chainId } = await runSession(101);
    const entries = store.all(chainId);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries[0]!.receiptClass).toBe(ReceiptClass.TrainingSessionStarted);
    expect(entries[entries.length - 1]!.receiptClass).toBe(ReceiptClass.TrainingSessionEnded);

    // Every outcome writes a receipt too.
    const outcomeReceipts = entries.filter((e) => e.receiptClass === ReceiptClass.TrainingOutcome);
    expect(outcomeReceipts.length).toBe(result.outcomesRecorded);
  });

  it('marks every training receipt with simulated:true', async () => {
    const { store, chainId } = await runSession(202);
    const entries = store.all(chainId);
    for (const e of entries) {
      if (typeof e.receiptClass === 'string' && e.receiptClass.startsWith('training.')) {
        const payload = e.payload as Record<string, unknown>;
        expect(payload['simulated']).toBe(true);
      }
    }
  });

  it('produces identical results across two runs with the same seed', async () => {
    const a = await runSession(303);
    const b = await runSession(303);
    expect(b.result.ticksProcessed).toBe(a.result.ticksProcessed);
    expect(b.result.signalsEmitted).toBe(a.result.signalsEmitted);
    expect(b.result.outcomesRecorded).toBe(a.result.outcomesRecorded);
    expect(b.result.finalReputation).toBeCloseTo(a.result.finalReputation, 12);
    expect(b.result.simulatedPnLUsd).toBeCloseTo(a.result.simulatedPnLUsd, 8);
  });

  it('the agent DOES trade — a nontrivial number of signals emitted over 500 ticks', async () => {
    const { result } = await runSession(404);
    expect(result.signalsEmitted).toBeGreaterThan(0);
    // At most one per tick.
    expect(result.signalsEmitted).toBeLessThanOrEqual(500);
  });

  it('reputation moves in response to outcomes; final score reflects the run', async () => {
    const { result, agent, ledger } = await runSession(505);
    if (result.outcomesRecorded > 0) {
      const finalRep = ledger.get(agent.voxisId).score;
      expect(finalRep).toBeGreaterThanOrEqual(0);
      expect(finalRep).toBeLessThanOrEqual(1);
      expect(finalRep).toBe(result.finalReputation);
    }
  });

  it('the agent voxisId in the session_started payload matches the training agent', async () => {
    const { store, chainId, agent } = await runSession(606);
    const entries = store.all(chainId);
    const startPayload = entries[0]!.payload as { agentVoxisId: string };
    expect(startPayload.agentVoxisId).toBe(agent.voxisId);
  });

  it('trainable-agent surface exposes the doctrine block mandate signature', async () => {
    const augur = makeAugur('vox-augur-x' as VoxisId);
    expect(typeof augur.mandateSignature).toBe('string');
    expect(augur.mandateSignature.length).toBeGreaterThan(0);
  });
});

// ── AUGUR unit tests ───────────────────────────────────────────────────────

describe('AugurAgent — momentum signal (behavioural)', () => {
  it('does not signal before enough observations to fill the long window', () => {
    const augur = makeAugur('vox-augur-warmup' as VoxisId);
    const replay = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 1, ticks: 20, startPrice: 100 });
    const ticks = replay.toArray();
    // longWindow = 21 in the test config; first 20 ticks: no signal.
    for (const t of ticks) {
      expect(augur.onObservation(t)).toBeNull();
    }
  });

  it('emits signals only on cross events (no chatter within same regime)', () => {
    const augur = makeAugur('vox-augur-cross' as VoxisId);
    const replay = new HistoricalReplay({ asset: ASSET, venue: VENUE, seed: 999, ticks: 800, startPrice: 100 });
    const ticks = replay.toArray();
    let lastSignalSide: 'buy' | 'sell' | null = null;
    let sameSideRepeat = 0;
    for (const t of ticks) {
      const s: AgentSignal | null = augur.onObservation(t);
      if (!s) continue;
      if (lastSignalSide === s.side) sameSideRepeat++;
      lastSignalSide = s.side;
    }
    // Successive signals should alternate side. Same-side repeats == 0.
    expect(sameSideRepeat).toBe(0);
  });

  it('honours the TrainableAgent interface at the type level', () => {
    const augur = makeAugur('vox-augur-iface' as VoxisId);
    const contract: TrainableAgent = augur;   // structural check
    expect(contract.voxisId).toBeDefined();
    expect(contract.mandateSignature).toBeDefined();
    expect(typeof contract.onObservation).toBe('function');
  });
});
