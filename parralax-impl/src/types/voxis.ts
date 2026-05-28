/**
 * VoxisAuthority — the doctrine block field of every PARRALAX agent.
 *
 * This is the TypeScript instantiation of AGENT_AUTHORITY_CHARTER.md § 2.
 *
 * The block is:
 *   - written at construction
 *   - frozen (Object.freeze on read)
 *   - signature-verified on every heartbeat
 *   - never mutated by any code path
 *
 * If signature verification fails, the agent halts and writes a
 * `voxis_doctrine_violation` CHRONO entry. No exception.
 */

import type {
  VoxisId,
  MandateId,
  PrincipalId,
  Signature,
  Iso8601,
  DecimalUsd,
  RiskTier,
  Sha256,
} from './common.js';

// ── Authority level — Charter § 18.3 / AGENT_AUTHORITY_CHARTER § 1 ──
export const Level = {
  Observer:           0,
  Analyst:            1,
  Simulator:          2,
  Proposer:           3,
  GuardedExecutor:    4,
  GovernedOperator:   5,
  RestrictedSovereign:6,
} as const;
export type Level = typeof Level[keyof typeof Level];

// ── Capabilities — exhaustive enumeration; no wildcards ──
export const Capability = {
  MarketRead:           'market:read',
  MarketReadL2:         'market:read.l2',
  MemoryWriteSelf:      'memory:write.self',
  SignalEmit:           'signal:emit',
  RecommendationEmit:   'recommendation:emit',
  PaperOrderPlace:      'paper:order.place',
  PaperOrderCancel:     'paper:order.cancel',
  ProposalSubmit:       'proposal:submit',
  OrderPlaceLive:       'order:place.live',
  OrderCancelLive:      'order:cancel.live',
  OrderModifyLive:      'order:modify.live',
  PositionCloseLive:    'position:close.live',
  StrategyActivate:     'strategy:activate',
  StrategyDeactivate:   'strategy:deactivate',
  CapitalReallocate:    'capital:reallocate',
  ChildSpawn:           'child:spawn',
  KillTrip:             'kill:trip',
  // INTENTIONAL OMISSIONS — these capabilities do not exist:
  //   'kill:reset'   — reset is council-only, outside Capability entirely
  //   'level:raise'  — no agent raises its own level
  //   'mandate:edit' — no agent edits its own mandate
  //   'withdraw'     — no agent withdraws funds at any level
} as const;
export type Capability = typeof Capability[keyof typeof Capability];

// ── Default capability grants per level (Authority Charter § 3.2) ──
export const DEFAULT_GRANTS: Readonly<Record<Level, ReadonlyArray<Capability>>> = Object.freeze({
  [Level.Observer]:           [Capability.MarketRead, Capability.MemoryWriteSelf],
  [Level.Analyst]:            [Capability.MarketRead, Capability.MemoryWriteSelf, Capability.MarketReadL2, Capability.SignalEmit, Capability.RecommendationEmit],
  [Level.Simulator]:          [Capability.MarketRead, Capability.MemoryWriteSelf, Capability.MarketReadL2, Capability.SignalEmit, Capability.RecommendationEmit, Capability.PaperOrderPlace, Capability.PaperOrderCancel],
  [Level.Proposer]:           [Capability.MarketRead, Capability.MemoryWriteSelf, Capability.MarketReadL2, Capability.SignalEmit, Capability.RecommendationEmit, Capability.PaperOrderPlace, Capability.PaperOrderCancel, Capability.ProposalSubmit],
  [Level.GuardedExecutor]:    [Capability.MarketRead, Capability.MemoryWriteSelf, Capability.MarketReadL2, Capability.SignalEmit, Capability.RecommendationEmit, Capability.PaperOrderPlace, Capability.PaperOrderCancel, Capability.ProposalSubmit, Capability.OrderPlaceLive, Capability.OrderCancelLive, Capability.PositionCloseLive, Capability.KillTrip],
  [Level.GovernedOperator]:   [Capability.MarketRead, Capability.MemoryWriteSelf, Capability.MarketReadL2, Capability.SignalEmit, Capability.RecommendationEmit, Capability.PaperOrderPlace, Capability.PaperOrderCancel, Capability.ProposalSubmit, Capability.OrderPlaceLive, Capability.OrderCancelLive, Capability.PositionCloseLive, Capability.KillTrip, Capability.OrderModifyLive, Capability.StrategyActivate, Capability.StrategyDeactivate],
  [Level.RestrictedSovereign]:[Capability.MarketRead, Capability.MemoryWriteSelf, Capability.MarketReadL2, Capability.SignalEmit, Capability.RecommendationEmit, Capability.PaperOrderPlace, Capability.PaperOrderCancel, Capability.ProposalSubmit, Capability.OrderPlaceLive, Capability.OrderCancelLive, Capability.PositionCloseLive, Capability.KillTrip, Capability.OrderModifyLive, Capability.StrategyActivate, Capability.StrategyDeactivate, Capability.CapitalReallocate, Capability.ChildSpawn],
});

// ── Wallet scope — what credentials an agent may touch (§ 3.3) ──
export type WalletRole = 'read' | 'sign-limited' | 'sign-broad' | 'trade';
//                                                                 ^^^^^^
// NB: 'withdraw' is intentionally NOT in this union. Withdraw is operator-only,
// hardware-signed, and outside the agent capability surface entirely.

export interface FiatAccountRef {
  readonly id:       string;
  readonly broker:   string;
  readonly currency: string;
  readonly role:     'read' | 'trade';
}
export interface CryptoWalletRef {
  readonly address: string;
  readonly chain:   string;
  readonly role:    'read' | 'sign-limited' | 'sign-broad';
}
export interface ExchangeKeyRef {
  readonly exchange: string;
  readonly keyAlias: string;
  readonly scope:    'read' | 'trade';   // NEVER 'withdraw'
}
export interface InternalUnitRef {
  readonly tokenId: string;
  readonly role:    'read' | 'transfer' | 'mint';
}

export interface WalletScope {
  readonly fiatAccounts:  ReadonlyArray<FiatAccountRef>;
  readonly cryptoWallets: ReadonlyArray<CryptoWalletRef>;
  readonly exchangeKeys:  ReadonlyArray<ExchangeKeyRef>;
  readonly internalUnits: ReadonlyArray<InternalUnitRef>;
}

// ── Capital + position limits ──
export interface CapitalLimitsUsd {
  readonly perOrderMax:  DecimalUsd;
  readonly perDayMax:    DecimalUsd;
  readonly perAssetMax:  DecimalUsd;
  readonly aggregateMax: DecimalUsd;
}

export interface PositionLimits {
  readonly maxConcurrentOpen: number;
  readonly maxLeverage:       number;   // 1.0 = no leverage
}

// ── Promotion provenance ──
export interface PromotionProvenance {
  readonly issuedAt:    Iso8601;
  readonly issuedBy:    PrincipalId;
  readonly expiresAt:   Iso8601 | null;
  readonly revocableBy: ReadonlyArray<PrincipalId>;
}

// ── Audit anchor ──
export interface AuditAnchor {
  readonly chronoChainId: string;       // namespaces this agent's CHRONO entries
  readonly parentVoxisId: VoxisId | null;
}

// ── The doctrine block itself ──
export interface VoxisAuthority {
  readonly voxisId:          VoxisId;
  readonly level:            Level;
  readonly mandateId:        MandateId;
  readonly capabilities:     ReadonlyArray<Capability>;
  readonly walletScope:      WalletScope;
  readonly capitalLimitsUsd: CapitalLimitsUsd;
  readonly positionLimits:   PositionLimits;
  readonly riskTier:         RiskTier;
  readonly killSwitchGroup:  string;
  readonly audit:            AuditAnchor;
  readonly promotion:        PromotionProvenance;
  readonly signature:        Signature;       // signs hash of everything above
  readonly blockHash:        Sha256;          // SHA-256(JSON of fields above signature)
}
