/**
 * CHRONO entry types — the immutable hash-chained audit substrate.
 *
 * Every action in PARRALAX writes a CHRONO entry. Every entry links to the
 * SHA-256 of the prior. Tampering with any entry breaks every entry after
 * it. The chain is the proof.
 */

import type {
  Sha256,
  Iso8601,
  PrincipalId,
  Signature,
  VoxisId,
} from './common.js';

/** The fixed receipt classes — extensible only by an explicit PR. */
export const ReceiptClass = {
  // ── Doctrine / authority ──
  PromotionReceipt:           'promotion',
  GateViolationDemotion:      'gate_violation_demotion',
  KillSwitchDemotion:         'kill_switch_demotion',
  DoctrineViolationDemotion:  'doctrine_violation_demotion',
  DriftDemotion:              'drift_demotion',
  MandateExpiryDemotion:      'mandate_expiry_demotion',
  OperatorDemotion:           'operator_demotion',
  CouncilDemotion:            'council_demotion',
  CascadeDemotion:            'cascade_demotion',
  VoxisDoctrineViolation:     'voxis_doctrine_violation',
  ActionAuthorised:           'action_authorised',
  GateViolation:              'gate_violation',

  // ── Risk gates ──
  GateCapital:                'gate.capital',
  GateExposure:               'gate.exposure',
  GateLeverage:               'gate.leverage',
  GateVolatility:             'gate.volatility',
  GateDrawdown:               'gate.drawdown',
  GateLiquidity:              'gate.liquidity',
  GateSlippage:               'gate.slippage',
  GateVenue:                  'gate.venue',
  GateChain:                  'gate.chain',
  GateSmartContract:          'gate.smartcontract',
  GateCounterparty:           'gate.counterparty',
  GateModelConfidence:        'gate.model_confidence',
  GateStrategyConsistency:    'gate.strategy_consistency',
  GateHumanOverride:          'gate.human_override',
  GateEventConcentration:     'gate.event_concentration',
  GateResolutionWindow:       'gate.resolution_window',
  GateOracleReliability:      'gate.oracle_reliability',
  GateUnreachable:            'gate_unreachable',
  ComplianceAlert:            'compliance_alert',

  // ── Kill switch ──
  TripLoss:                   'trip.loss',
  TripVolatility:             'trip.volatility',
  TripExchange:               'trip.exchange',
  TripApi:                    'trip.api',
  TripChain:                  'trip.chain',
  TripAgent:                  'trip.agent',
  TripFrequency:              'trip.frequency',
  TripDrift:                  'trip.drift',
  TripUnauthorised:           'trip.unauthorised',
  TripOperator:               'trip.operator',
  TripSystemFailureRate:      'trip.system_failure_rate',
  TripCouncil:                'trip.council',
  TripSubstrate:              'trip.substrate',
  ResetAgent:                 'reset.agent',
  ResetStrategy:              'reset.strategy',
  ResetAsset:                 'reset.asset',
  ResetVenue:                 'reset.venue',
  ResetChain:                 'reset.chain',
  ResetCounterparty:          'reset.counterparty',
  ResetSystem:                'reset.system',
  CooldownStart:              'cooldown.start',
  CooldownEnd:                'cooldown.end',

  // ── Trades ──
  SignalEmitted:              'trade.signal_emitted',
  SignalValidated:            'trade.signal_validated',
  RiskPassed:                 'trade.risk_passed',
  OrderAuthorised:            'trade.order_authorised',
  OrderPlaced:                'trade.order_placed',
  FillReceived:               'trade.fill_received',
  SettledReconciled:          'trade.settled_reconciled',
  Resolving:                  'trade.resolving',          // prediction markets
  Disputed:                   'trade.disputed',           // prediction markets

  // ── Incidents ──
  IncidentKeyLeak:            'incident.key_leak',
  IncidentReview:             'incident.review',

  // ── Training (TRAINING_DOCTRINE) ──
  // Note: NO TrainingLevelPromotion class exists. Training-stage
  // promotion (T1→T5) is DISTINCT from authority-level promotion (0→6),
  // which lives in the doctrine-side receipt classes above.
  TrainingSessionStarted:     'training.session_started',
  TrainingObservation:        'training.observation_processed',
  TrainingBatch:              'training.batch_processed',
  TrainingOutcome:            'training.outcome_recorded',
  TrainingSessionEnded:       'training.session_ended',
  TrainingStagePromotion:     'training.stage_promotion',
} as const;
export type ReceiptClass = typeof ReceiptClass[keyof typeof ReceiptClass];

/**
 * Every CHRONO entry has the same envelope. Payloads vary by ReceiptClass.
 */
export interface ChronoEntry<P = Record<string, unknown>> {
  readonly entryId:       string;            // ULID
  readonly chainId:       string;            // namespace (per-VOXIS or per-system)
  readonly receiptClass:  ReceiptClass;
  readonly writtenAt:     Iso8601;
  readonly writtenBy:     PrincipalId;       // could be 'auto:custos.engine'
  readonly voxisId:       VoxisId | null;    // null for system-scope entries
  readonly priorHash:     Sha256;            // SHA-256 of prior entry (zeros for genesis)
  readonly payload:       P;
  readonly signature:     Signature;
  readonly selfHash:      Sha256;            // SHA-256 of everything above signature
}

/** The empty 64-zero hash used by genesis entries (no prior). */
export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000' as Sha256;
