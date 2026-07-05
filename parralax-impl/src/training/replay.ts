/**
 * HistoricalReplay — deterministic seeded price replay.
 *
 * Per TRAINING_DOCTRINE Stage T2: agents train against synthetic price
 * series with a fixed seed. Same seed produces the same series produces
 * the same agent behaviour produces the same outcomes. This is what
 * makes CI-runnable training possible.
 *
 * The synthesis is a regime-changing random walk:
 *
 *   price[t+1] = price[t] * (1 + drift + noise)
 *
 * Where `drift` is the regime's expected return per step and `noise` is
 * drawn from a Gaussian with the regime's volatility. Regimes flip at
 * seed-determined tick counts so a single replay carries multiple
 * scenarios (calm / trending / choppy / crash / recovery) — enough
 * variety that a trained agent has met most of what markets throw.
 *
 * NO EXTERNAL DATA. NO NETWORK. Everything is generated from the seed.
 * Bundled or vendor-attested historical data is a Stage T4 concern and
 * belongs in a separate module with its own provenance receipts.
 */

import type { AssetId, VenueId, Iso8601 } from '../types/common.js';
import type {
  OrderBook,
  OrderBookLevel,
  Quote,
} from '../types/market.js';

// ── Regime types ────────────────────────────────────────────────────────────
export type Regime = 'calm' | 'trending' | 'choppy' | 'crash' | 'recovery';

interface RegimeParams {
  readonly meanDrift:   number;   // per-step expected log-return
  readonly volatility:  number;   // per-step stdev of log-return
  readonly bookSpreadBps: number;
}

const REGIME_PARAMS: Readonly<Record<Regime, RegimeParams>> = Object.freeze({
  calm:      { meanDrift:  0.00001, volatility: 0.0004, bookSpreadBps:  4 },
  trending:  { meanDrift:  0.00012, volatility: 0.0006, bookSpreadBps:  5 },
  choppy:    { meanDrift:  0.00000, volatility: 0.0018, bookSpreadBps: 10 },
  crash:     { meanDrift: -0.00080, volatility: 0.0060, bookSpreadBps: 25 },
  recovery:  { meanDrift:  0.00040, volatility: 0.0020, bookSpreadBps: 12 },
});

// ── The replay tick ─────────────────────────────────────────────────────────
export interface ReplayTick {
  readonly index:      number;
  readonly asAt:       Iso8601;
  readonly regime:     Regime;
  readonly price:      number;
  readonly quote:      Quote;
  readonly book:       OrderBook;
}

export interface ReplayConfig {
  readonly asset:        AssetId;
  readonly venue:        VenueId;
  readonly seed:         number;      // integer
  readonly ticks:        number;      // total ticks to generate
  readonly startPrice:   number;      // e.g. 100.00
  /** Optional explicit regime program; if omitted, generated from seed. */
  readonly regimeProgram?: ReadonlyArray<{ readonly startAt: number; readonly regime: Regime }>;
  /** Optional starting time; defaults to a fixed epoch for determinism. */
  readonly startAt?:     Iso8601;
  /** Per-side book depth to synthesise around top-of-book. */
  readonly bookDepth?:   number;      // default 8
}

// ── The replay itself ───────────────────────────────────────────────────────
export class HistoricalReplay {
  private readonly cfg:        Required<Omit<ReplayConfig, 'regimeProgram'>> & { readonly regimeProgram: ReadonlyArray<{ readonly startAt: number; readonly regime: Regime }> };
  private readonly rng:        Prng;
  private readonly bookDepth:  number;
  private ticksIssued          = 0;
  private currentPrice:        number;

  constructor(cfg: ReplayConfig) {
    if (!Number.isInteger(cfg.seed))     throw new Error('replay: seed must be an integer');
    if (cfg.ticks < 1)                   throw new Error('replay: ticks must be >= 1');
    if (cfg.startPrice <= 0)             throw new Error('replay: startPrice must be > 0');

    const startAt   = (cfg.startAt ?? '2026-01-01T00:00:00.000Z') as Iso8601;
    const bookDepth = cfg.bookDepth ?? 8;

    // The regime program: either user-supplied or seed-derived.
    // Seed-derived: switch regimes every ~120 ticks through a fixed sequence
    // that guarantees the agent meets every scenario at least once.
    const program = cfg.regimeProgram ?? generateRegimeProgram(cfg.seed, cfg.ticks);

    this.cfg = {
      asset:         cfg.asset,
      venue:         cfg.venue,
      seed:          cfg.seed,
      ticks:         cfg.ticks,
      startPrice:    cfg.startPrice,
      startAt,
      bookDepth,
      regimeProgram: program,
    };
    this.bookDepth    = bookDepth;
    this.rng          = new Prng(cfg.seed);
    this.currentPrice = cfg.startPrice;
  }

  /** Number of ticks this replay will produce in total. */
  get totalTicks(): number { return this.cfg.ticks; }

  /** Number of ticks issued so far. */
  get consumed(): number { return this.ticksIssued; }

  /** Regime for a given tick index. Public so tests can verify. */
  regimeAt(index: number): Regime {
    let current: Regime = 'calm';
    for (const change of this.cfg.regimeProgram) {
      if (change.startAt <= index) current = change.regime;
      else break;
    }
    return current;
  }

  /** Produce the next tick. Deterministic per seed. */
  next(): ReplayTick | null {
    if (this.ticksIssued >= this.cfg.ticks) return null;

    const index  = this.ticksIssued;
    const regime = this.regimeAt(index);
    const params = REGIME_PARAMS[regime];

    // Log-return draw. Box-Muller for a Gaussian from two uniforms.
    const u1  = Math.max(this.rng.uniform(), 1e-12);
    const u2  = this.rng.uniform();
    const z   = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const ret = params.meanDrift + params.volatility * z;

    this.currentPrice = Math.max(0.01, this.currentPrice * (1 + ret));

    // Time — one minute per tick by default (arbitrary but deterministic).
    const start = new Date(this.cfg.startAt).getTime();
    const asAt  = new Date(start + index * 60_000).toISOString() as Iso8601;

    const half = (this.currentPrice * (params.bookSpreadBps / 2)) / 10_000;
    const bid  = round(this.currentPrice - half, 4);
    const ask  = round(this.currentPrice + half, 4);

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    for (let i = 0; i < this.bookDepth; i++) {
      const tickSize = (this.currentPrice * (params.bookSpreadBps / 4)) / 10_000;
      const size     = String(50 + i * 25);
      bids.push({ price: String(round(bid - i * tickSize, 4)), size });
      asks.push({ price: String(round(ask + i * tickSize, 4)), size });
    }

    const quote: Quote = {
      venue:      this.cfg.venue,
      asset:      this.cfg.asset,
      bid:        String(bid),
      ask:        String(ask),
      bidSize:    bids[0]!.size,
      askSize:    asks[0]!.size,
      observedAt: asAt,
    };
    const book: OrderBook = {
      venue:      this.cfg.venue,
      asset:      this.cfg.asset,
      bids,
      asks,
      observedAt: asAt,
    };

    this.ticksIssued++;
    return { index, asAt, regime, price: round(this.currentPrice, 4), quote, book };
  }

  /** Convenience: consume all ticks into an array. Caller controls memory. */
  toArray(): ReplayTick[] {
    const out: ReplayTick[] = [];
    let t: ReplayTick | null;
    while ((t = this.next())) out.push(t);
    return out;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Splitmix64-based PRNG — deterministic, fast, no crypto pretensions. */
class Prng {
  private state: bigint;
  constructor(seed: number) {
    // Fold the (possibly negative) seed to a positive BigInt.
    this.state = BigInt(seed >>> 0) | (BigInt(Math.abs(Math.floor(seed / 0x100000000))) << 32n);
    if (this.state === 0n) this.state = 0x9E3779B97F4A7C15n;   // avoid zero-state degenerate
  }
  private nextU64(): bigint {
    this.state = (this.state + 0x9E3779B97F4A7C15n) & 0xffffffffffffffffn;
    let z = this.state;
    z = ((z ^ (z >> 30n)) * 0xBF58476D1CE4E5B9n) & 0xffffffffffffffffn;
    z = ((z ^ (z >> 27n)) * 0x94D049BB133111EBn) & 0xffffffffffffffffn;
    return z ^ (z >> 31n);
  }
  /** Uniform in [0, 1). */
  uniform(): number {
    const u = this.nextU64();
    // Take top 53 bits and scale.
    return Number(u >> 11n) / 2 ** 53;
  }
}

function generateRegimeProgram(seed: number, ticks: number): ReadonlyArray<{ startAt: number; regime: Regime }> {
  // Deterministic sequence: calm → trending → choppy → crash → recovery → repeat.
  // Segment lengths vary with seed so different seeds give different exposure.
  const sequence: Regime[] = ['calm', 'trending', 'choppy', 'crash', 'recovery'];
  const rng = new Prng(seed ^ 0xdeadbeef);
  const program: Array<{ startAt: number; regime: Regime }> = [];
  let pos = 0;
  let seg = 0;
  while (pos < ticks) {
    program.push({ startAt: pos, regime: sequence[seg % sequence.length]! });
    const segLen = 80 + Math.floor(rng.uniform() * 120);   // 80..200 ticks per regime
    pos += segLen;
    seg++;
  }
  return program;
}

function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}
