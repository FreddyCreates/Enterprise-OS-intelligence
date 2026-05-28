/**
 * KillSwitchState — the canonical state holder.
 *
 * Per KILL_SWITCH_DOCTRINE § 3:
 *   - State lives in exactly one place (a Durable Object in production,
 *     an in-memory cell for tests).
 *   - No agent caches.
 *   - Unreachable canonical state → treat as tripped (fail closed).
 */

import type {
  PrincipalId,
  Signature,
  Iso8601,
  Sha256,
} from '../types/common.js';

// ── Scope union ──
export const ScopeKind = {
  System:       'system',
  Agent:        'agent',
  Strategy:     'strategy',
  Asset:        'asset',
  Venue:        'venue',
  Chain:        'chain',
  Counterparty: 'counterparty',
} as const;
export type ScopeKind = typeof ScopeKind[keyof typeof ScopeKind];

export interface Scope {
  readonly kind: ScopeKind;
  readonly ref:  string | null;   // null only for kind = 'system'
}

// ── Trigger sources (Charter 10 + derived 3) ──
export const TriggerSource = {
  Loss:               'trip.loss',
  Volatility:         'trip.volatility',
  Exchange:           'trip.exchange',
  Api:                'trip.api',
  Chain:              'trip.chain',
  Agent:              'trip.agent',
  Frequency:          'trip.frequency',
  Drift:              'trip.drift',
  Unauthorised:       'trip.unauthorised',
  Operator:           'trip.operator',
  SystemFailureRate:  'trip.system_failure_rate',
  Council:            'trip.council',
  Substrate:          'trip.substrate',
} as const;
export type TriggerSource = typeof TriggerSource[keyof typeof TriggerSource];

// ── Switch state ──
export type SwitchPhase = 'set' | 'tripped';

export interface KillSwitchState {
  readonly scope:      Scope;
  readonly phase:      SwitchPhase;
  readonly trippedAt:  Iso8601 | null;
  readonly trippedBy:  PrincipalId | null;
  readonly tripSource: TriggerSource | null;
  readonly cooldownUntil: Iso8601 | null;
}

// ── Trip / reset payloads ──
export interface TripPayload {
  readonly scope:          Scope;
  readonly trigger:        TriggerSource;
  readonly triggerDetails: Record<string, unknown>;
  readonly trippedBy:      PrincipalId;
  readonly signature:      Signature;
}

export interface ResetPayload {
  readonly scope:           Scope;
  readonly resetBy:         ReadonlyArray<PrincipalId>;
  readonly signatures:      ReadonlyArray<Signature>;
  readonly reason:          string;
  readonly priorTripHash:   Sha256;
}

// ── Cooldown defaults (KILL_SWITCH § 6.4) ──
export const COOLDOWN_HOURS: Readonly<Record<ScopeKind, number>> = Object.freeze({
  [ScopeKind.Agent]:        1,
  [ScopeKind.Strategy]:     4,
  [ScopeKind.Asset]:        24,
  [ScopeKind.Venue]:        24,
  [ScopeKind.Chain]:        24,
  [ScopeKind.Counterparty]: 24,
  [ScopeKind.System]:       72,
});

// ── The canonical-store contract ──
//
// Every implementation (in-memory, Durable Object, ICP canister) honours
// this interface. Agents query through the store; never cache.
export interface KillSwitchStore {
  /** Get the current state of a scope. */
  get(scope: Scope): Promise<KillSwitchState>;

  /**
   * Trip a scope. Asymmetric — any signed trigger is accepted.
   * The store writes the trip receipt as part of this call.
   */
  trip(payload: TripPayload): Promise<KillSwitchState>;

  /**
   * Reset a scope. Asymmetric — the store enforces that:
   *   - The required number of signatures is present (3-of-5 for most scopes;
   *     additional operator hardware-signer for system scope).
   *   - The priorTripHash matches the most recent trip on this scope.
   *   - A `reason` is provided (non-empty).
   * The store writes the reset receipt and the cooldown-start entry.
   */
  reset(payload: ResetPayload): Promise<KillSwitchState>;

  /** Returns true if any switch covering ANY of the resources is tripped. */
  isAnyTripped(
    resources: ReadonlyArray<Scope>,
  ): Promise<{ readonly tripped: boolean; readonly which: Scope | null }>;
}

// ── Agent-side helper: "may I act?" against multiple scopes ──
export async function gateAction(
  store:    KillSwitchStore,
  resources: ReadonlyArray<Scope>,
): Promise<{ readonly allowed: boolean; readonly blocker: Scope | null }> {
  try {
    const r = await store.isAnyTripped(resources);
    return { allowed: !r.tripped, blocker: r.which };
  } catch (e) {
    // Unreachable canonical state — fail closed (KILL_SWITCH § 3).
    // The caller must additionally write a `gate_unreachable` CHRONO entry.
    return { allowed: false, blocker: { kind: ScopeKind.System, ref: null } };
  }
}

/** Capabilities that exist for switches. */
//
// Notice what is NOT exported: there is no `resetSwitch` capability anywhere.
// Reset is a STORE-level operation that requires the signatures inline.
// No agent capability triggers it — by design (KILL_SWITCH § 11).
//
// The trip capability IS exposed; `kill:trip` exists in the Capability
// enumeration (see src/types/voxis.ts).
