/**
 * VIGIL — market observer (real behaviour).
 *
 * Latin: vigil — watchman. Reads price action; classifies the regime;
 * publishes its observation for downstream agents (AUGUR, ARCHON, others)
 * to consume through the training or production observation bus.
 *
 * VIGIL does not trade. Its outputs are observations, not signals.
 * The distinction is doctrinal — AUGUR turns observations into signals;
 * VIGIL turns market state into observations. Each agent does one thing.
 *
 * Implementation: rolling volatility over a short window, comparison
 * against a longer-window baseline, regime classification into five
 * buckets matching the HistoricalReplay regime taxonomy (calm, trending,
 * choppy, crash, recovery). Fully deterministic given the same input
 * sequence.
 *
 * Consumes: replay ticks (in training) or live quotes (in production).
 * Produces: VigilObservation per tick.
 * Doctrine invariants:
 *   \u2022 No wallet-touching code.
 *   \u2022 No Level-changing code.
 *   \u2022 No transaction signing.
 *   \u2022 Observations are pure functions of the input sequence.
 */

import { BaseAgent } from './base.js';
import type { AgentContext } from './base.js';
import type { VoxisAuthority } from '../types/voxis.js';
import type { AssetId, VoxisId, Iso8601 } from '../types/common.js';
import type { ReplayTick, Regime } from '../training/replay.js';

// ── Configuration ──────────────────────────────────────────────────────────
export interface VigilConfig {
  readonly shortWindow: number;     // e.g. 8 ticks — the volatility measurement window
  readonly longWindow:  number;     // e.g. 34 ticks — the baseline reference
  readonly asset:       AssetId;
  /** Realised-vol thresholds (annualised-agnostic; per-tick stdev in return space). */
  readonly thresholds?: {
    readonly crashRet:     number;   // negative return per tick that flags crash
    readonly recoveryRet:  number;   // positive return per tick that flags recovery
    readonly choppyVolMul: number;   // short-vol / long-vol ratio above this = choppy
    readonly trendingRet:  number;   // sustained abs return per tick above this = trending
  };
}

const DEFAULT_THRESHOLDS = Object.freeze({
  crashRet:     -0.005,
  recoveryRet:   0.003,
  choppyVolMul:  1.5,
  trendingRet:   0.0006,
});

// ── The observation VIGIL publishes ────────────────────────────────────────
export interface VigilObservation {
  readonly asset:            AssetId;
  readonly observedAt:       Iso8601;
  readonly midPrice:         number;
  readonly shortVol:         number;    // per-tick stdev of log-returns
  readonly longVol:          number;
  readonly volRatio:         number;    // shortVol / longVol
  readonly momentumShort:    number;    // avg log-return over short window
  readonly regime:           Regime;
  /** True iff the classifier's confidence is high (state stable across last 3 ticks). */
  readonly stable:           boolean;
}

// ── The agent ──────────────────────────────────────────────────────────────
export class VigilAgent extends BaseAgent {
  private readonly cfg: VigilConfig;
  private readonly priceWindow: number[] = [];
  private readonly regimeHistory: Regime[] = [];
  private readonly maxHistory: number;

  constructor(authority: VoxisAuthority, ctx: AgentContext, cfg: VigilConfig) {
    super(authority, ctx);
    if (cfg.shortWindow < 3)                       throw new Error('vigil: shortWindow must be >= 3');
    if (cfg.longWindow <= cfg.shortWindow)         throw new Error('vigil: longWindow must exceed shortWindow');
    this.cfg = cfg;
    this.maxHistory = cfg.longWindow;
  }

  get voxisId(): VoxisId { return this.initialAuthority.voxisId; }
  get mandateSignature(): string { return this.initialAuthority.signature; }

  /**
   * Called by the training loop (or the production observation bus) for
   * each incoming tick. Returns an observation, or null if the agent has
   * not yet accumulated enough history to publish one.
   */
  observe(tick: ReplayTick): VigilObservation | null {
    if (tick.quote.asset !== this.cfg.asset) return null;

    const mid = (Number(tick.quote.bid) + Number(tick.quote.ask)) / 2;
    this.priceWindow.push(mid);
    if (this.priceWindow.length > this.maxHistory) this.priceWindow.shift();
    if (this.priceWindow.length < this.cfg.longWindow) return null;

    const t = this.cfg.thresholds ?? DEFAULT_THRESHOLDS;

    // Log-returns
    const returns: number[] = [];
    for (let i = 1; i < this.priceWindow.length; i++) {
      const a = this.priceWindow[i - 1]!;
      const b = this.priceWindow[i]!;
      returns.push(Math.log(b / a));
    }
    const shortReturns = returns.slice(-this.cfg.shortWindow);
    const longReturns  = returns;

    const shortVol      = stdev(shortReturns);
    const longVol       = stdev(longReturns);
    const volRatio      = longVol > 0 ? shortVol / longVol : 1;
    const momentumShort = mean(shortReturns);

    // Regime classification (in decreasing severity):
    //   crash    — mean return over short window is deeply negative
    //   recovery — sustained bounce off a recent crash regime
    //   choppy   — short vol substantially exceeds long vol without directional bias
    //   trending — sustained abs return above threshold
    //   calm     — the residual
    let regime: Regime = 'calm';
    const recentWasCrash = this.regimeHistory.length > 0 && this.regimeHistory[this.regimeHistory.length - 1] === 'crash';

    if (momentumShort <= t.crashRet) regime = 'crash';
    else if (recentWasCrash && momentumShort >= t.recoveryRet) regime = 'recovery';
    else if (volRatio >= t.choppyVolMul && Math.abs(momentumShort) < t.trendingRet) regime = 'choppy';
    else if (Math.abs(momentumShort) >= t.trendingRet) regime = 'trending';
    else regime = 'calm';

    this.regimeHistory.push(regime);
    if (this.regimeHistory.length > 3) this.regimeHistory.shift();

    const stable = this.regimeHistory.length === 3
      && this.regimeHistory[0] === this.regimeHistory[1]
      && this.regimeHistory[1] === this.regimeHistory[2];

    return {
      asset:            this.cfg.asset,
      observedAt:       tick.asAt,
      midPrice:         mid,
      shortVol,
      longVol,
      volRatio,
      momentumShort,
      regime,
      stable,
    };
  }

  // Production path deferred; observation-bus wiring is a separate commit.
  protected async onBeat(): Promise<void> {
    // In production this reads from the shared quote bus and calls
    // observe() with the latest tick. Deferred until the bus lands.
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let ss = 0;
  for (const x of xs) ss += (x - m) * (x - m);
  return Math.sqrt(ss / (xs.length - 1));
}
