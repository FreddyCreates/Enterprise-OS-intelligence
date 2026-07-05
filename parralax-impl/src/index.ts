/**
 * @medina/parralax-aihftfund — public exports.
 *
 * The implementation scaffold's surface area. Each export honours one of the
 * charter documents at /parralax-aihftfund/.
 */

// ── Types ──
export * from './types/common.js';
export * from './types/voxis.js';
export * from './types/chrono.js';
export * from './types/market.js';

// ── VOXIS (Authority Charter) ──
export {
  PlaceholderVerifier,
  computeBlockHash,
  readDoctrine,
} from './voxis/authority.js';
export type { SignatureVerifier } from './voxis/authority.js';

// ── CHRONO (audit substrate) ──
export {
  ChronoWriter,
  InMemoryChronoStore,
  TestSigner,
  verifyChain,
} from './chrono/receipt.js';
export type { ChronoStore, ChronoSigner, WriteParams } from './chrono/receipt.js';

// ── CUSTOS (Risk Charter) ──
export * from './custos/gates.js';

// ── KILL SWITCH (Kill Switch Doctrine) ──
export * from './killswitch/state.js';

// ── Venues (Testing Doctrine § 2 — adapter contract + paper + Alpaca stub) ──
export * from './venues/types.js';
export { PaperVenue } from './venues/paper.js';
export type { PaperVenueConfig } from './venues/paper.js';
export { AlpacaPaperVenue, NotImplementedError } from './venues/alpaca-paper.js';
export type { AlpacaPaperConfig } from './venues/alpaca-paper.js';

// ── Operator UI shapes (Testing Doctrine § 3 — TradingView overlay) ──
export * from './operator-ui/tradingview.js';

// ── Training (Training Doctrine) ──
export { HistoricalReplay } from './training/replay.js';
export type { Regime, ReplayTick, ReplayConfig } from './training/replay.js';

export {
  ReputationLedger,
  PHI_INV,
  INITIAL_SCORE,
} from './training/reputation.js';
export type { Reputation, ReputationDelta } from './training/reputation.js';

export {
  TrainingSession,
} from './training/session.js';
export type {
  AgentSignal,
  SignalSide,
  TrainableAgent,
  TrainingSessionConfig,
  TrainingSessionResult,
} from './training/session.js';

export {
  TrainingStage,
  writeSessionStarted,
  writeTrainingOutcome,
  writeSessionEnded,
  writeStagePromotion,
} from './training/receipt.js';
export type {
  TrainingSessionStartedPayload,
  TrainingOutcomePayload,
  TrainingSessionEndedPayload,
  TrainingStagePromotionPayload,
} from './training/receipt.js';

// ── Agents (behaviour-bearing; the rest are stubs) ──
export { AugurAgent } from './agents/augur.js';
export type { AugurConfig } from './agents/augur.js';
export { VigilAgent } from './agents/vigil.js';
export type { VigilConfig, VigilObservation } from './agents/vigil.js';

// ── Models (MODEL_WEIGHTS_DOCTRINE + MODEL_ARCHITECTURES) ──
export * from './models/types.js';
export {
  countParameters,
  verifyEstimatedParams,
  verifySizeLabel,
  estimateFp16Bytes,
} from './models/param-count.js';
export type { ParamCountBreakdown } from './models/param-count.js';
export {
  VATES_8B,
  AUSPEX_14B,
  ORACULUM_20B,
  PARRALAX_ARCHITECTURES,
  architectureByName,
} from './models/architectures.js';
export type { ArchitectureName } from './models/architectures.js';
export {
  enumerateTensorDescriptors,
  describeModel,
  verifyDescriptorTotal,
} from './models/init.js';
export {
  MissingLoader,
  ModelLoadError,
  NotImplementedError as CheckpointNotImplementedError,
  prepareLoad,
  sha256Of,
} from './models/checkpoint.js';
export type { CheckpointLoader, LoadedModel } from './models/checkpoint.js';
