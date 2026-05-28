/**
 * CUSTOS — the thirteen-gate evaluation engine.
 *
 * Per RISK_CHARTER § 5, gates run in this fixed order:
 *   1. human_override          (cheapest, most decisive)
 *   2. capital
 *   3. exposure
 *   4. leverage
 *   5. strategy_consistency
 *   6. model_confidence
 *   7. drawdown
 *   8. volatility
 *   9. liquidity
 *  10. slippage
 *  11. chain                   (only for on-chain actions)
 *  12. smartcontract           (only for smart-contract actions)
 *  13. venue                   (last — most expensive)
 *  14. counterparty            (last alongside venue)
 *
 * First failure halts. Every gate writes a receipt regardless.
 *
 * Prediction-market actions additionally pass through:
 *   gate.event_concentration
 *   gate.resolution_window
 *   gate.oracle_reliability
 * (defined in custos/prediction-gates.ts in a later commit)
 */

import type {
  AssetId,
  VenueId,
  VoxisId,
  DecimalUsd,
  Iso8601,
} from '../types/common.js';
import type { OrderRequest } from '../types/market.js';
import type { ChronoEntry, ReceiptClass } from '../types/chrono.js';

// ── The proposed action seen by CUSTOS ──
export interface ProposedAction {
  readonly voxisId:    VoxisId;
  readonly request:    OrderRequest;
  readonly intent: {
    readonly strategyId:   string;
    readonly signalScore:  number;        // 0..1
    readonly modelVersion: string;
    readonly priorActionHash: string | null;
  };
}

// ── Market context provided to gates ──
export interface MarketContext {
  readonly asOf:              Iso8601;
  readonly currentBookDepthUsd: Record<VenueId, DecimalUsd>;
  readonly currentMidPrice:   Record<AssetId, string>;
  readonly venueHealth:       Record<VenueId, VenueHealth>;
  // ... extended as gates require more inputs
}

export interface VenueHealth {
  readonly p99OrderLatencyMs: number;
  readonly recentFailureRate: number;
  readonly marketDataAgeMs:   number;
}

// ── Gate result ──
export interface GateResult {
  readonly gateId:        ReceiptClass;
  readonly passed:        boolean;
  readonly failureReason: string | null;
  readonly observed:      Record<string, unknown>;
}

// ── Each gate is a pure function from (action, context, params) to result.
// Pure for testability; the receipt-writing is the engine's responsibility.
export interface Gate<P> {
  readonly id: ReceiptClass;
  evaluate(
    action: ProposedAction,
    ctx:    MarketContext,
    params: P,
  ): GateResult;
}

// ── The thirteen gates' parameter shapes (operator-provided per tier) ──

export interface CapitalGateParams {
  readonly perOrderMax:  DecimalUsd;
  readonly perDayMax:    DecimalUsd;
  readonly perAssetMax:  DecimalUsd;
  readonly aggregateMax: DecimalUsd;
}

export interface ExposureGateParams {
  readonly perAssetMaxOpen:        DecimalUsd;
  readonly perStrategyMaxOpen:     DecimalUsd;
  readonly perVenueMaxOpen:        DecimalUsd;
  readonly perChainMaxOpen:        DecimalUsd;
  readonly netDirectionalMaxLong:  DecimalUsd;
  readonly netDirectionalMaxShort: DecimalUsd;
}

export interface LeverageGateParams {
  readonly systemMax:      number;
  readonly perStrategyMax: number;
  readonly perAssetMax:    number;
  readonly perPositionMax: number;
}

export interface VolatilityGateParams {
  readonly rvWindowSeconds:   number;
  readonly rvMax:             number;
  readonly ivMax:             number;
  readonly regimeChangeBlock: boolean;
}

export type DrawdownHaltMode = 'no_new_open' | 'no_new_open_or_add' | 'reduce_only';

export interface DrawdownGateParams {
  readonly perStrategyDailyMaxPct:   number;
  readonly perStrategyWeeklyMaxPct:  number;
  readonly perStrategyMonthlyMaxPct: number;
  readonly systemDailyMaxPct:        number;
  readonly systemWeeklyMaxPct:       number;
  readonly haltOnExceed:             DrawdownHaltMode;
}

export interface LiquidityGateParams {
  readonly maxOrderPctOfDv:    number;
  readonly maxOrderPctOfTopN:  number;
  readonly minBookDepthUsd:    DecimalUsd;
  readonly topNLevels:         number;
  readonly zeroLiquidityBlock: boolean;
}

export interface SlippageGateParams {
  readonly maxBpsFromMid:      number;
  readonly maxBpsFromIntended: number;
  readonly blockOnInversion:   boolean;
}

export interface VenueGateParams {
  readonly maxOrderApiLatencyMs:    number;
  readonly maxOrderFailureRatePct:  number;
  readonly minMarketDataFreshnessMs: number;
  readonly outageBlock:             boolean;
}

export interface ChainGateParams {
  readonly maxGasGwei:               string;
  readonly maxPendingNonceGap:       number;
  readonly minPeerConfirmations:     number;
  readonly contractAllowlist:        ReadonlyArray<string>;
  readonly contractBlocklist:        ReadonlyArray<string>;
  readonly blockOnReorg:             boolean;
}

export interface SmartContractGateParams {
  readonly minAuditFreshnessDays:   number;
  readonly minTvlUsd:               DecimalUsd;
  readonly maxRecentExploitProximity: number;
  readonly permittedRoles:          ReadonlyArray<string>;
}

export interface CounterpartyGateParams {
  readonly perCounterpartyMaxExposureUsd: DecimalUsd;
  readonly minCreditRating:               string;
  readonly outageBlockSeconds:            number;
  readonly blockOnSanctionsFlag:          boolean;
}

export interface ModelConfidenceGateParams {
  readonly minSignalConfidence:    number;
  readonly minCouncilAgreement:    number;
  readonly rejectOnStaleModel:     boolean;
  readonly maxModelStalenessDays:  number;
}

export interface StrategyConsistencyGateParams {
  readonly expectedAssetSet:        ReadonlyArray<AssetId>;
  readonly expectedVenueSet:        ReadonlyArray<VenueId>;
  readonly expectedHoldingWindow:   { readonly minSeconds: number; readonly maxSeconds: number };
  readonly expectedFrequencyPerDay: { readonly min: number; readonly max: number };
  readonly driftToleranceCycles:   number;
}

export interface HumanOverrideRules {
  readonly paused: {
    readonly agents:     ReadonlyArray<VoxisId>;
    readonly strategies: ReadonlyArray<string>;
    readonly assets:     ReadonlyArray<AssetId>;
    readonly venues:     ReadonlyArray<VenueId>;
    readonly chains:     ReadonlyArray<string>;
  };
  readonly pausedUntil: Iso8601 | null;
}

// ── The complete tier parameter set ──
export interface RiskTierParams {
  readonly capital:             CapitalGateParams;
  readonly exposure:            ExposureGateParams;
  readonly leverage:            LeverageGateParams;
  readonly volatility:          VolatilityGateParams;
  readonly drawdown:            DrawdownGateParams;
  readonly liquidity:           LiquidityGateParams;
  readonly slippage:            SlippageGateParams;
  readonly venue:               VenueGateParams;
  readonly chain:               ChainGateParams;
  readonly smartContract:       SmartContractGateParams;
  readonly counterparty:        CounterpartyGateParams;
  readonly modelConfidence:     ModelConfidenceGateParams;
  readonly strategyConsistency: StrategyConsistencyGateParams;
  readonly humanOverride:       HumanOverrideRules;
}

// ── The engine result envelope ──
export interface EvaluationResult {
  readonly passed:        boolean;
  readonly firstFailure:  GateResult | null;
  readonly receipts:      ReadonlyArray<ChronoEntry>;
}
