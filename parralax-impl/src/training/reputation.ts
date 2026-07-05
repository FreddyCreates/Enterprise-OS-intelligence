/**
 * ReputationLedger — φ-EMA per-agent reputation.
 *
 * Per TRAINING_DOCTRINE § 5:
 *
 *   newRep = PHI_INV · outcome + (1 - PHI_INV) · oldRep
 *
 * Where PHI_INV = 1/φ = 0.6180339887…
 *
 * Properties this class guarantees:
 *   - score ∈ [0, 1] at all times
 *   - monotonic response to `outcome`
 *   - convergence to a constant outcome stream
 *   - initial score = 0.5 (neutral)
 *   - reset() forces score back to 0.5 (used on agent demotion)
 *   - update() never modifies any VOXIS Level or Capability
 *
 * What this class does NOT do:
 *   - grant any capability
 *   - raise any authority level
 *   - transfer any score between agents
 *   - export any score externally
 */

import type { VoxisId, Iso8601 } from '../types/common.js';
import { nowIso } from '../types/common.js';

export const PHI_INV = 0.6180339887498948;
export const INITIAL_SCORE = 0.5;

export interface Reputation {
  readonly voxisId:       VoxisId;
  readonly score:         number;      // ∈ [0, 1]
  readonly outcomeCount:  number;
  readonly lastUpdatedAt: Iso8601;
}

export interface ReputationDelta {
  readonly voxisId:    VoxisId;
  readonly outcome:    number;         // ∈ [0, 1]
  readonly priorScore: number;
  readonly newScore:   number;
  readonly delta:      number;
  readonly at:         Iso8601;
}

export class ReputationLedger {
  private readonly store = new Map<VoxisId, Reputation>();

  /**
   * Return the current reputation for an agent, creating a neutral entry
   * if the agent is not yet tracked.
   */
  get(voxisId: VoxisId): Reputation {
    const existing = this.store.get(voxisId);
    if (existing) return existing;
    const created: Reputation = {
      voxisId,
      score:         INITIAL_SCORE,
      outcomeCount:  0,
      lastUpdatedAt: nowIso(),
    };
    this.store.set(voxisId, created);
    return created;
  }

  /**
   * Update an agent's reputation on a new outcome ∈ [0, 1].
   * Returns the delta as a receipt-friendly record.
   *
   * Throws if outcome is out of range — never silently clamp; that would
   * let a bug in an upstream scorer silently distort the ledger.
   */
  update(voxisId: VoxisId, outcome: number, at: Iso8601 = nowIso()): ReputationDelta {
    if (!Number.isFinite(outcome) || outcome < 0 || outcome > 1) {
      throw new Error(`reputation.update: outcome must be finite in [0, 1]; got ${outcome}`);
    }
    const prior    = this.get(voxisId);
    const newScore = PHI_INV * outcome + (1 - PHI_INV) * prior.score;
    // Numerical clamp — bounded-in guarantees bounded-out mathematically, but
    // rounding can nudge past bounds by ε. Clamp to preserve the invariant.
    const clamped  = Math.min(1, Math.max(0, newScore));
    const updated: Reputation = {
      voxisId,
      score:         clamped,
      outcomeCount:  prior.outcomeCount + 1,
      lastUpdatedAt: at,
    };
    this.store.set(voxisId, updated);
    return {
      voxisId,
      outcome,
      priorScore: prior.score,
      newScore:   clamped,
      delta:      clamped - prior.score,
      at,
    };
  }

  /**
   * Reset an agent's reputation to neutral. Used ONLY on agent demotion
   * (AGENT_AUTHORITY_CHARTER § 5). A reset writes back to INITIAL_SCORE
   * and zeros the outcome count — this is a start-over signal.
   */
  reset(voxisId: VoxisId, at: Iso8601 = nowIso()): Reputation {
    const created: Reputation = {
      voxisId,
      score:         INITIAL_SCORE,
      outcomeCount:  0,
      lastUpdatedAt: at,
    };
    this.store.set(voxisId, created);
    return created;
  }

  /** Test / audit helper: enumerate every tracked agent. */
  snapshot(): ReadonlyArray<Reputation> {
    return Object.freeze([...this.store.values()]);
  }
}
