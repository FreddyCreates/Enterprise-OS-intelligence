/**
 * AUGUR — signal diviner.
 *
 * Latin: augur — Roman priest who read signs from natural phenomena to
 * counsel the state. Here: the agent that reads market signs and emits
 * proposals to the training loop (or, in production under sufficient
 * authority, to the execution pipeline through the governance filter).
 *
 * This implementation is intentionally simple: rolling-mean momentum with
 * a short and a long window. Emits a buy signal when short-mean crosses
 * above long-mean; emits a sell signal on the reverse cross. Between
 * crosses, returns null (no signal).
 *
 * The strategy is not the point. AUGUR-as-scaffold-for-training is the
 * point. Replacing this behaviour with a smarter one is a straightforward
 * commit that leaves the doctrine block, the capability grants, and the
 * training pipeline unchanged.
 *
 * Doctrine invariants honoured:
 *   - Under BaseAgent, doctrine block is re-verified every beat.
 *   - `onBeat()` runs only after the block is verified.
 *   - This class has NO `Level`-changing code path. Never.
 *   - This class has NO wallet-touching code path. Signals go up; they
 *     do not sign or transact.
 *   - Simulated P&L (from training) is quarantined by the TrainableAgent
 *     shape (see src/training/session.ts) — the onObservation() path is
 *     distinct from the onBeat() path so training can drive it without
 *     wiring it to a real venue.
 */

import { BaseAgent } from './base.js';
import type { AgentContext } from './base.js';
import type { VoxisAuthority } from '../types/voxis.js';
import type { AssetId, VoxisId } from '../types/common.js';
import type { TrainableAgent, AgentSignal } from '../training/session.js';
import type { ReplayTick } from '../training/replay.js';

// ── Config ──────────────────────────────────────────────────────────────────
export interface AugurConfig {
  readonly shortWindow: number;    // ticks; e.g. 8
  readonly longWindow:  number;    // ticks; e.g. 34  (φ² × short-ish; Fibonacci-ish)
  readonly orderSize:   string;    // decimal-string; e.g. '10' shares per signal
  readonly asset:       AssetId;   // the asset this AUGUR trades
}

// ── The agent ──────────────────────────────────────────────────────────────
export class AugurAgent extends BaseAgent implements TrainableAgent {
  private readonly cfg: AugurConfig;
  private readonly window: number[] = [];
  private lastCross: 'up' | 'down' | 'none' = 'none';

  constructor(authority: VoxisAuthority, ctx: AgentContext, cfg: AugurConfig) {
    super(authority, ctx);
    if (cfg.shortWindow < 2)                        throw new Error('augur: shortWindow must be >= 2');
    if (cfg.longWindow <= cfg.shortWindow)          throw new Error('augur: longWindow must exceed shortWindow');
    this.cfg = cfg;
  }

  // ── TrainableAgent surface ───────────────────────────────────────────────
  //
  // Exposes the doctrine block's mandate signature so the training session
  // can record it in `session_started` receipts — training proves the
  // doctrine block was intact at session start.

  get voxisId(): VoxisId { return this.initialAuthority.voxisId; }

  get mandateSignature(): string {
    return this.initialAuthority.signature;
  }

  /**
   * Called by TrainingSession for each replay tick.
   *
   * NOTE: this method does not read `this.doctrine` because in training
   * mode the agent's beat() loop is not running. The mandate signature
   * IS captured in the session receipt so the training-time doctrine
   * state is auditable after the fact.
   *
   * In production, an AUGUR wired to a live data feed would receive
   * observations through onBeat() (which re-verifies the doctrine),
   * with the momentum computation identical to this path.
   */
  onObservation(tick: ReplayTick): AgentSignal | null {
    if (tick.quote.asset !== this.cfg.asset) return null;

    // Use mid price for the momentum computation.
    const mid = (Number(tick.quote.bid) + Number(tick.quote.ask)) / 2;
    this.window.push(mid);
    if (this.window.length > this.cfg.longWindow) this.window.shift();
    if (this.window.length < this.cfg.longWindow) return null;

    const shortMean = mean(this.window.slice(-this.cfg.shortWindow));
    const longMean  = mean(this.window);

    // Deadband to prevent chatter: don't cross-signal on ties.
    if (Math.abs(shortMean - longMean) < mid * 1e-6) return null;

    const cross: 'up' | 'down' = shortMean > longMean ? 'up' : 'down';
    if (cross === this.lastCross) return null;   // no new information
    this.lastCross = cross;

    return {
      side: cross === 'up' ? 'buy' : 'sell',
      size: this.cfg.orderSize,
      note: `augur: short(${this.cfg.shortWindow})=${round(shortMean, 4)} vs long(${this.cfg.longWindow})=${round(longMean, 4)}`,
    };
  }

  // ── Production onBeat() — deferred to the wire-up commit ─────────────────
  protected async onBeat(): Promise<void> {
    // In production this would:
    //   1. Query market data through VIGIL's shared observation bus.
    //   2. Call the same momentum computation as onObservation().
    //   3. If a signal emerges, submit a `proposal` through the governance
    //      filter (Layer 5 of the COGNOVEX stack) which passes it through
    //      CUSTOS' 13 gates before it becomes an order.
    //
    // The production wire-up is a separate commit per the phased plan.
    // Training mode drives onObservation() directly and skips onBeat().
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}
