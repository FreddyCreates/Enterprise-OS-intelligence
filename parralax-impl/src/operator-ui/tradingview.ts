/**
 * TradingView operator overlay — types and shape.
 *
 * Per TESTING_DOCTRINE § 3 (ratified May 2026): TradingView is a
 * read-only operator overlay. NEVER an execution layer. NEVER a
 * kill-switch trigger. NEVER a strategy-parameter store.
 *
 * This module specifies the JSON shape PARRALAX exposes at the
 * authenticated overlay endpoint. TradingView (or any other charting
 * tool) is a renderer of this shape; nothing it sends comes back.
 *
 * Per SECURITY.md and the journal's "no third-party telemetry" doctrine:
 *   - The overlay endpoint is hosted by PARRALAX (operator infra).
 *   - HTTPS only; operator-issued bearer token; rotated regularly.
 *   - No public read; no anonymous read.
 *   - No webhook back into PARRALAX from TradingView is implemented.
 *   - Token never appears in TradingView config saved to TV servers.
 *
 * The endpoint is implemented elsewhere (in the operator-private
 * deployment); this module is the shape both producer and renderer
 * agree on.
 */

import type {
  AssetId,
  VenueId,
  VoxisId,
  StrategyId,
  Iso8601,
  DecimalUsd,
} from '../types/common.js';
import type { Side, DecimalString } from '../types/market.js';
import type { ScopeKind } from '../killswitch/state.js';

// ── Per-position view ───────────────────────────────────────────────────────
export interface OverlayPosition {
  readonly venue:            VenueId;
  readonly asset:            AssetId;
  readonly side:             Side;
  readonly qty:              DecimalString;
  readonly avgPrice:         DecimalString;
  readonly unrealisedPnLUsd: DecimalUsd;
  readonly riskTier:         'STRICT' | 'STANDARD' | 'WIDE';
}

// ── Per-signal view ─────────────────────────────────────────────────────────
export type SignalStatus =
  | 'emitted'           // raw signal
  | 'validated'         // schema + sanity check passed
  | 'risk_passed'       // CUSTOS gates cleared
  | 'authorised'        // ARCHON authorisation receipt written
  | 'placed'            // order at venue
  | 'filled'            // venue confirmed fill
  | 'reconciled'        // settled in CHRONO
  | 'rejected'          // any gate refused
  | 'cancelled';

export interface OverlaySignal {
  readonly agentId:    VoxisId;
  readonly strategyId: StrategyId;
  readonly asset:      AssetId;
  readonly score:      number;        // 0..1, AUGUR confidence
  readonly side:       Side;
  readonly status:     SignalStatus;
  readonly emittedAt:  Iso8601;
}

// ── Per-fill view (most-recent N) ───────────────────────────────────────────
export interface OverlayFill {
  readonly venue:     VenueId;
  readonly asset:     AssetId;
  readonly side:      Side;
  readonly qty:       DecimalString;
  readonly price:     DecimalString;
  readonly feesUsd:   DecimalUsd;
  readonly filledAt:  Iso8601;
  readonly venueTxRef: string;
}

// ── Per-strategy gate state ─────────────────────────────────────────────────
export type GateStatus = 'pass' | 'fail' | 'unevaluated';

export interface StrategyGateStates {
  readonly capital:             GateStatus;
  readonly exposure:            GateStatus;
  readonly leverage:            GateStatus;
  readonly volatility:          GateStatus;
  readonly drawdown:            GateStatus;
  readonly liquidity:           GateStatus;
  readonly slippage:            GateStatus;
  readonly venue:               GateStatus;
  readonly chain:               GateStatus;
  readonly smartContract:       GateStatus;
  readonly counterparty:        GateStatus;
  readonly modelConfidence:     GateStatus;
  readonly strategyConsistency: GateStatus;
  readonly humanOverride:       GateStatus;
}

// ── Kill-switch state per active scope ──────────────────────────────────────
export interface OverlayKillSwitch {
  readonly scope:           ScopeKind;
  readonly scopeRef:        string | null;
  readonly phase:           'set' | 'tripped';
  readonly trippedSinceMs:  number | null;
}

// ── Drawdown view per strategy ──────────────────────────────────────────────
export interface OverlayDrawdown {
  readonly strategyId:      StrategyId;
  readonly dailyPct:        number;
  readonly weeklyPct:       number;
  readonly maxDailyPct:     number;
  readonly maxWeeklyPct:    number;
}

// ── The 873 ms heartbeat ────────────────────────────────────────────────────
export interface OverlayHeartbeat {
  readonly beat:    number;        // ticks since genesis
  readonly builtAt: Iso8601;       // build time of the publishing endpoint
}

// ── The full overlay payload ────────────────────────────────────────────────
export interface OperatorOverlay {
  readonly asOf:       Iso8601;
  readonly positions:  ReadonlyArray<OverlayPosition>;
  readonly signals:    ReadonlyArray<OverlaySignal>;
  readonly fills:      ReadonlyArray<OverlayFill>;          // most-recent N
  readonly gates:      Readonly<Record<StrategyId, StrategyGateStates>>;
  readonly killSwitch: ReadonlyArray<OverlayKillSwitch>;
  readonly drawdown:   ReadonlyArray<OverlayDrawdown>;
  readonly heartbeat:  OverlayHeartbeat;
}

// ── The empty overlay — fallback if no data available ───────────────────────
export function emptyOverlay(asOf: Iso8601): OperatorOverlay {
  return {
    asOf,
    positions:  [],
    signals:    [],
    fills:      [],
    gates:      {},
    killSwitch: [],
    drawdown:   [],
    heartbeat:  { beat: 0, builtAt: asOf },
  };
}

// ── Validation helpers ─────────────────────────────────────────────────────
//
// The overlay endpoint validates its own output before serving — invalid
// shape is a bug, not a recoverable state. These helpers exist for tests
// and for the endpoint's pre-serve assertion.

export function isValidOverlay(o: unknown): o is OperatorOverlay {
  if (!o || typeof o !== 'object') return false;
  const x = o as Partial<OperatorOverlay>;
  return (
    typeof x.asOf === 'string' &&
    Array.isArray(x.positions) &&
    Array.isArray(x.signals) &&
    Array.isArray(x.fills) &&
    typeof x.gates === 'object' && x.gates !== null &&
    Array.isArray(x.killSwitch) &&
    Array.isArray(x.drawdown) &&
    typeof x.heartbeat === 'object' && x.heartbeat !== null
  );
}

// ── What this module DOES NOT export ────────────────────────────────────────
//
// There is no `signOrder`, `placeOrder`, `tripKillSwitch`, or any function
// that triggers a side effect inside PARRALAX from a TradingView caller.
// By design.
//
// If a future change adds such a function, it has wandered from the
// doctrine. TESTING_DOCTRINE § 3.2 is unambiguous: TradingView is a
// renderer, not an authority.
