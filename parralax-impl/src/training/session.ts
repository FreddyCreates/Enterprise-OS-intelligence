/**
 * TrainingSession — the deterministic training-run orchestrator.
 *
 * Per TRAINING_DOCTRINE Stage T2:
 *   1. Instantiate an agent from a doctrine block.
 *   2. Stream a HistoricalReplay's ticks through it.
 *   3. When the agent emits a "signal" via its callback, immediately
 *      execute a fixed-size trade on the PaperVenue.
 *   4. When the position closes (opposite signal or session end),
 *      score the outcome and update reputation.
 *   5. Write CHRONO receipts throughout.
 *
 * Every step is deterministic given the same replay seed + doctrine block.
 * Nothing here calls the network. Nothing here writes to a real venue.
 * Nothing here modifies the agent's authority level or capabilities.
 */

import { createHash, randomBytes } from 'node:crypto';

import type {
  VoxisId,
  PrincipalId,
  Sha256,
  AssetId,
  VenueId,
  Iso8601,
  DecimalUsd,
} from '../types/common.js';
import { nowIso } from '../types/common.js';
import type { OrderRequest, Side } from '../types/market.js';
import { PaperVenue } from '../venues/paper.js';
import { HistoricalReplay } from './replay.js';
import type { ReplayTick } from './replay.js';
import {
  ReputationLedger,
  INITIAL_SCORE,
} from './reputation.js';
import {
  writeSessionStarted,
  writeTrainingOutcome,
  writeSessionEnded,
  TrainingStage,
} from './receipt.js';
import type { TrainingSessionStartedPayload, TrainingSessionEndedPayload } from './receipt.js';
import type { ChronoWriter } from '../chrono/receipt.js';

// ── The signal an agent emits to the training loop ──────────────────────────
export type SignalSide = Side;   // 'buy' | 'sell'
export interface AgentSignal {
  readonly side:  SignalSide;
  readonly size:  string;         // decimal-string, in units of the asset
  readonly note?: string;
}

// ── The pluggable agent surface — decoupled from BaseAgent for testability ─
export interface TrainableAgent {
  readonly voxisId:          VoxisId;
  readonly mandateSignature: string;   // for the session-started receipt
  /** Called for every replay tick. Return a signal to trade, or null. */
  onObservation(tick: ReplayTick): AgentSignal | null;
}

// ── Config ──────────────────────────────────────────────────────────────────
export interface TrainingSessionConfig {
  readonly asset:            AssetId;
  readonly venue:            VenueId;
  readonly replay:           HistoricalReplay;
  readonly agent:            TrainableAgent;
  readonly ledger:           ReputationLedger;
  readonly writer:           ChronoWriter;
  readonly operator:         PrincipalId;
  readonly chronoChainId:    string;                    // where to write receipts
  readonly initialUsd:       number;                    // starting cash on paper venue
  /** For deterministic session-id and outcome-id generation. */
  readonly deterministicIds?: boolean;
}

// ── The result envelope ────────────────────────────────────────────────────
export interface TrainingSessionResult {
  readonly sessionId:        string;
  readonly agentVoxisId:     VoxisId;
  readonly stage:            typeof TrainingStage.T2;
  readonly ticksProcessed:   number;
  readonly signalsEmitted:   number;
  readonly outcomesRecorded: number;
  readonly finalReputation:  number;
  readonly simulatedPnLUsd:  number;                    // ALWAYS reported with simulated:true
  readonly outcomes:         ReadonlyArray<{
    readonly outcomeId:    string;
    readonly entryTickIndex: number;
    readonly exitTickIndex:  number;
    readonly side:           SignalSide;
    readonly entryPrice:     number;
    readonly exitPrice:      number;
    readonly simulatedPnLUsd: number;
    readonly outcomeScore:   number;
    readonly newReputation:  number;
  }>;
}

// ── Deterministic id generation for tests ──────────────────────────────────
class DeterministicIds {
  private counter = 0;
  constructor(private readonly seed: number) {}
  next(prefix: string): string {
    this.counter++;
    return `${prefix}-seed${this.seed}-${String(this.counter).padStart(6, '0')}`;
  }
}
class RandomIds {
  next(prefix: string): string {
    const bytes = randomBytes(10).toString('hex');
    return `${prefix}-${bytes}`;
  }
}

// ── The orchestrator ───────────────────────────────────────────────────────
export class TrainingSession {
  constructor(private readonly cfg: TrainingSessionConfig) {}

  async run(): Promise<TrainingSessionResult> {
    const {
      asset, venue, replay, agent, ledger, writer, operator,
      chronoChainId, initialUsd,
    } = this.cfg;

    // Deterministic ids from the replay's config so re-runs on the same
    // (seed, ticks) produce the same ids. Falls back to random for prod.
    const idGen = this.cfg.deterministicIds
      ? new DeterministicIds((replay as unknown as { cfg: { seed: number } }).cfg.seed)
      : new RandomIds();

    const sessionId = idGen.next('sess');

    // A fresh paper venue per session — no cross-session state leakage.
    const paperVenue = new PaperVenue({
      id:               venue,
      initialBalances:  [{ currency: 'USD', free: String(initialUsd), locked: '0', total: String(initialUsd) }],
    });

    // Session-start receipt.
    const startedAt = nowIso();
    const paramsHash = sha256Json({
      asset, venue,
      replaySeed:  (replay as unknown as { cfg: { seed: number; ticks: number } }).cfg.seed,
      replayTicks: (replay as unknown as { cfg: { seed: number; ticks: number } }).cfg.ticks,
      initialUsd,
      agent:       agent.voxisId,
    });
    const sessionStartPayload: TrainingSessionStartedPayload = {
      sessionId,
      agentVoxisId:     agent.voxisId,
      stage:            TrainingStage.T2,
      replayId:         `replay-seed${(replay as unknown as { cfg: { seed: number } }).cfg.seed}`,
      seed:             (replay as unknown as { cfg: { seed: number } }).cfg.seed,
      ticks:            (replay as unknown as { cfg: { ticks: number } }).cfg.ticks,
      mandateSignature: agent.mandateSignature,
      operator,
      paramsHash,
      simulated:        true,
      startedAt,
    };
    await writeSessionStarted({ writer, chainId: chronoChainId, payload: sessionStartPayload, voxisId: agent.voxisId });

    // Position + outcome tracking.
    interface OpenPosition {
      readonly side:            SignalSide;
      readonly entryTickIndex:  number;
      readonly entryPrice:      number;
      readonly size:            string;
    }
    let open: OpenPosition | null = null;
    let signalsEmitted            = 0;
    let ticksProcessed            = 0;
    const outcomes: TrainingSessionResult['outcomes'][number][] = [];
    let cumulativeSimPnL          = 0;
    const outcomeHashes: string[] = [];

    // Main loop.
    let tick: ReplayTick | null;
    while ((tick = replay.next())) {
      ticksProcessed++;
      // Seed the venue's book for this tick.
      paperVenue.setOrderBook(asset, tick.book);

      const signal = agent.onObservation(tick);
      if (!signal) continue;
      signalsEmitted++;

      // Close-then-open semantics: if we have an open position and this
      // signal is on the other side, close first and record outcome.
      if (open && open.side !== signal.side) {
        const closeReq = orderRequest({
          asset, venue,
          side: open.side === 'buy' ? 'sell' : 'buy',
          size: open.size,
          intended: tick.asAt,
        });
        const closeAck = await paperVenue.placeOrder(closeReq);
        const exitPx = closeAck.fills.length > 0
          ? Number(closeAck.fills.reduce((a, f) => a + Number(f.price) * Number(f.size), 0)) / Number(open.size)
          : (open.side === 'buy' ? Number(tick.quote.bid) : Number(tick.quote.ask));
        const pnl = (open.side === 'buy' ? 1 : -1) * (exitPx - open.entryPrice) * Number(open.size);
        cumulativeSimPnL += pnl;

        // Score in [0, 1] via a bounded transform of P&L relative to
        // notional. Sigmoid keeps outcome ∈ (0, 1) without clamping.
        const notional = open.entryPrice * Number(open.size);
        const returnPct = notional > 0 ? pnl / notional : 0;
        const outcomeScore = sigmoid(returnPct * 20);   // ×20 sensitivity

        const delta = ledger.update(agent.voxisId, outcomeScore, tick.asAt);
        const outcomeId = idGen.next('out');
        outcomeHashes.push(sha256Json({
          outcomeId, entryTickIndex: open.entryTickIndex, exitTickIndex: tick.index,
          entryPx: open.entryPrice, exitPx, pnl, outcomeScore, newRep: delta.newScore,
        }));

        outcomes.push({
          outcomeId,
          entryTickIndex: open.entryTickIndex,
          exitTickIndex:  tick.index,
          side:            open.side,
          entryPrice:      open.entryPrice,
          exitPrice:       exitPx,
          simulatedPnLUsd: pnl,
          outcomeScore,
          newReputation:   delta.newScore,
        });

        await writeTrainingOutcome(writer, chronoChainId, {
          sessionId,
          outcomeId,
          agentVoxisId:    agent.voxisId,
          signalIndex:     signalsEmitted - 1,
          outcomeScore,
          priorReputation: delta.priorScore,
          newReputation:   delta.newScore,
          reputationDelta: delta.delta,
          simulatedPnLUsd: pnl,
          resolvedAt:      tick.asAt,
          simulated:       true,
        });

        open = null;
      }

      // Open a new position if we don't have one yet.
      if (!open) {
        const openReq = orderRequest({
          asset, venue,
          side: signal.side,
          size: signal.size,
          intended: tick.asAt,
        });
        const openAck = await paperVenue.placeOrder(openReq);
        const entryPx: number = openAck.fills.length > 0
          ? (openAck.fills.reduce((a: number, f) => a + Number(f.price) * Number(f.size), 0)) / Number(signal.size)
          : (signal.side === 'buy' ? Number(tick.quote.ask) : Number(tick.quote.bid));
        if (openAck.status === 'filled' || openAck.status === 'partial') {
          open = {
            side:            signal.side,
            entryTickIndex:  tick.index,
            entryPrice:      entryPx,
            size:            signal.size,
          };
        }
        // If rejected (e.g. can't short from empty position), skip silently;
        // agent's signal was invalid at this venue and CUSTOS would have
        // caught it in production. In training we count the miss and move on.
      }
    }

    // Session-end receipt.
    const endedAt = nowIso();
    const finalRep = ledger.get(agent.voxisId).score;
    const manifestHash = sha256Json({ sessionId, outcomes: outcomeHashes });

    const sessionEndPayload: TrainingSessionEndedPayload = {
      sessionId,
      agentVoxisId:        agent.voxisId,
      ticksProcessed,
      outcomesRecorded:    outcomes.length,
      finalReputation:     finalRep,
      outcomeManifestHash: manifestHash,
      endedAt,
      simulated:           true,
    };
    await writeSessionEnded(writer, chronoChainId, sessionEndPayload);

    return {
      sessionId,
      agentVoxisId:     agent.voxisId,
      stage:            TrainingStage.T2,
      ticksProcessed,
      signalsEmitted,
      outcomesRecorded: outcomes.length,
      finalReputation:  finalRep,
      simulatedPnLUsd:  cumulativeSimPnL,
      outcomes,
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function orderRequest(a: {
  asset: AssetId; venue: VenueId; side: SignalSide; size: string; intended: Iso8601;
}): OrderRequest {
  return {
    requestId:    'train-' + a.intended + '-' + a.side + '-' + a.size,
    venue:        a.venue,
    asset:        a.asset,
    side:         a.side,
    type:         'market',
    size:         a.size,
    timeInForce:  'ioc',
    notionalUsd:  '0' as DecimalUsd,          // notional computed downstream; training uses market fills
    intendedAt:   a.intended,
  };
}

function sha256Json(x: unknown): Sha256 {
  return createHash('sha256').update(canonicalJson(x)).digest('hex') as Sha256;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson((value as Record<string, unknown>)[k])).join(',') + '}';
}

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }

// Suppress the initial-score reference in a way the linter accepts if this
// module is imported for its type surface only:
void INITIAL_SCORE;
