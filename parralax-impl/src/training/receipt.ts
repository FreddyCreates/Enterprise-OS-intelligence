/**
 * Training receipt helpers.
 *
 * Per TRAINING_DOCTRINE § 4, every training run writes a session_started
 * and a session_ended receipt at minimum. This module gives typed payload
 * shapes for the five training receipt classes and thin helpers to write
 * them via the existing ChronoWriter.
 *
 * Note that these are payload types, not new CHRONO classes at the writer
 * level — the CHRONO substrate accepts arbitrary payloads under fixed
 * ReceiptClass tags. The tags TrainingSessionStarted / TrainingObservation /
 * TrainingOutcome / TrainingSessionEnded / TrainingStagePromotion are
 * added to types/chrono.ts in the same commit.
 */

import type {
  VoxisId,
  Sha256,
  Iso8601,
  PrincipalId,
} from '../types/common.js';
import type { ChronoWriter } from '../chrono/receipt.js';
import type { ChronoEntry } from '../types/chrono.js';
import { ReceiptClass } from '../types/chrono.js';

// ── Stages ──────────────────────────────────────────────────────────────────
export const TrainingStage = {
  T1: 'T1',   // doctrine-compliance
  T2: 'T2',   // deterministic paper
  T3: 'T3',   // adversarial synthetic
  T4: 'T4',   // historical replay
  T5: 'T5',   // live-shadow (propose, no execute)
} as const;
export type TrainingStage = typeof TrainingStage[keyof typeof TrainingStage];

// ── Payload shapes ──────────────────────────────────────────────────────────

export interface TrainingSessionStartedPayload extends Record<string, unknown> {
  readonly sessionId:         string;    // ULID
  readonly agentVoxisId:      VoxisId;
  readonly stage:             TrainingStage;
  readonly replayId:          string;
  readonly seed:              number;
  readonly ticks:             number;
  readonly mandateSignature:  string;   // proof that doctrine block is intact
  readonly operator:          PrincipalId;
  readonly paramsHash:        Sha256;
  readonly simulated:         true;     // ALWAYS true; T1..T4 all simulated
  readonly startedAt:         Iso8601;
}

export interface TrainingOutcomePayload extends Record<string, unknown> {
  readonly sessionId:      string;
  readonly outcomeId:      string;      // ULID
  readonly agentVoxisId:   VoxisId;
  readonly signalIndex:    number;      // 0-based ordinal within session
  readonly outcomeScore:   number;      // ∈ [0, 1]
  readonly priorReputation: number;
  readonly newReputation:  number;
  readonly reputationDelta: number;
  readonly simulatedPnLUsd: number;     // sim-only; NEVER aggregated with real PnL
  readonly resolvedAt:     Iso8601;
  readonly simulated:      true;
}

export interface TrainingSessionEndedPayload extends Record<string, unknown> {
  readonly sessionId:           string;
  readonly agentVoxisId:        VoxisId;
  readonly ticksProcessed:      number;
  readonly outcomesRecorded:    number;
  readonly finalReputation:     number;
  readonly outcomeManifestHash: Sha256;   // Merkle-ish root over outcome hashes
  readonly endedAt:             Iso8601;
  readonly simulated:           true;
}

export interface TrainingStagePromotionPayload extends Record<string, unknown> {
  readonly agentVoxisId:        VoxisId;
  readonly fromStage:           TrainingStage;
  readonly toStage:             TrainingStage;
  readonly evidenceManifestHash: Sha256;
  readonly operator:            PrincipalId;
  readonly councilSigners:      ReadonlyArray<PrincipalId>;   // empty until T4→T5+
  readonly at:                  Iso8601;
  // Notice what is NOT in this payload: no `newLevel`, no `capabilities`.
  // Training stage promotion is DISTINCT from authority promotion.
  // The absence of those fields here is the doctrine written in a type.
}

// ── Writers ─────────────────────────────────────────────────────────────────

export interface WriteSessionStartArgs {
  readonly writer:   ChronoWriter;
  readonly chainId:  string;
  readonly payload:  TrainingSessionStartedPayload;
  readonly voxisId:  VoxisId;
}

export function writeSessionStarted(a: WriteSessionStartArgs): Promise<ChronoEntry<TrainingSessionStartedPayload>> {
  return a.writer.write<TrainingSessionStartedPayload>({
    chainId:      a.chainId,
    receiptClass: ReceiptClass.TrainingSessionStarted,
    voxisId:      a.voxisId,
    payload:      a.payload,
  });
}

export function writeTrainingOutcome(
  writer: ChronoWriter,
  chainId: string,
  payload: TrainingOutcomePayload,
): Promise<ChronoEntry<TrainingOutcomePayload>> {
  return writer.write<TrainingOutcomePayload>({
    chainId,
    receiptClass: ReceiptClass.TrainingOutcome,
    voxisId:      payload.agentVoxisId,
    payload,
  });
}

export function writeSessionEnded(
  writer: ChronoWriter,
  chainId: string,
  payload: TrainingSessionEndedPayload,
): Promise<ChronoEntry<TrainingSessionEndedPayload>> {
  return writer.write<TrainingSessionEndedPayload>({
    chainId,
    receiptClass: ReceiptClass.TrainingSessionEnded,
    voxisId:      payload.agentVoxisId,
    payload,
  });
}

export function writeStagePromotion(
  writer: ChronoWriter,
  chainId: string,
  payload: TrainingStagePromotionPayload,
): Promise<ChronoEntry<TrainingStagePromotionPayload>> {
  return writer.write<TrainingStagePromotionPayload>({
    chainId,
    receiptClass: ReceiptClass.TrainingStagePromotion,
    voxisId:      payload.agentVoxisId,
    payload,
  });
}
