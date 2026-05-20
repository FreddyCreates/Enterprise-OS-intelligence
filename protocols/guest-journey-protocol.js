/**
 * PROTO-018: Guest Journey Protocol (GJP)  (Medina)
 *
 * Full end-to-end orchestration of the airport guest experience.
 *
 * Models the passenger journey as a 7-stage Markov chain:
 *   ARRIVAL → CHECK_IN → SECURITY → WAYFINDING → DWELL → BOARDING → DEPARTURE
 * At each stage a dwell time, NPS impact, and intervention priority are
 * computed. φ-weighted stage importance drives the journey satisfaction score.
 * Live anomalies (excessive dwell, low NPS) trigger intervention actions.
 *
 * Engines wired: GuestJourneyEngine + MarkovTransitionModel + InterventionQueue
 * Ring: Intelligence Ring
 * Wire: intelligence-wire/gjp
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const STAGES = ['ARRIVAL', 'CHECK_IN', 'SECURITY', 'WAYFINDING', 'DWELL', 'BOARDING', 'DEPARTURE'];

// φ-weighted stage importance (most impactful = SECURITY and BOARDING)
const STAGE_WEIGHTS = {
  ARRIVAL:    PHI_INV * PHI_INV * PHI_INV,
  CHECK_IN:   PHI_INV * PHI_INV,
  SECURITY:   PHI,
  WAYFINDING: PHI_INV,
  DWELL:      1.0,
  BOARDING:   PHI,
  DEPARTURE:  PHI_INV * PHI_INV,
};

const WEIGHT_SUM = Object.values(STAGE_WEIGHTS).reduce((a, b) => a + b, 0);

// Normalise
for (const k of Object.keys(STAGE_WEIGHTS)) {
  STAGE_WEIGHTS[k] = STAGE_WEIGHTS[k] / WEIGHT_SUM;
}

const NPS_DWELL_PENALTY = 0.5;  // NPS points lost per minute over target dwell
const INTERVENTION_NPS_THRESH = 6.5; // NPS below this triggers intervention

// ── Markov Transition Model ───────────────────────────────────────────────────

const TRANSITIONS = {
  ARRIVAL:    { next: 'CHECK_IN', targetDwellMin: 5 },
  CHECK_IN:   { next: 'SECURITY', targetDwellMin: 10 },
  SECURITY:   { next: 'WAYFINDING', targetDwellMin: 15 },
  WAYFINDING: { next: 'DWELL', targetDwellMin: 3 },
  DWELL:      { next: 'BOARDING', targetDwellMin: 45 },
  BOARDING:   { next: 'DEPARTURE', targetDwellMin: 20 },
  DEPARTURE:  { next: null, targetDwellMin: 0 },
};

class MarkovTransitionModel {
  nextStage(current) {
    return TRANSITIONS[current] ? TRANSITIONS[current].next : null;
  }

  targetDwell(stage) {
    return TRANSITIONS[stage] ? TRANSITIONS[stage].targetDwellMin : 0;
  }

  npsImpact(stage, actualDwellMin) {
    const target = this.targetDwell(stage);
    const overrun = Math.max(0, actualDwellMin - target);
    const baseNPS = stage === 'DWELL' ? 9.0 : 8.5;
    return Math.max(0, baseNPS - overrun * NPS_DWELL_PENALTY);
  }
}

// ── Intervention Queue ────────────────────────────────────────────────────────

class InterventionQueue {
  constructor() {
    this.queue = [];
  }

  push(guestId, stage, nps, reason) {
    this.queue.push({ guestId, stage, nps, reason, priority: Math.round((INTERVENTION_NPS_THRESH - nps) * STAGE_WEIGHTS[stage] * PHI * 100) / 100, ts: Date.now() });
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  pop() {
    return this.queue.shift() || null;
  }

  peek(n = 5) {
    return this.queue.slice(0, n);
  }

  get size() { return this.queue.length; }
}

// ── Guest Journey Engine ──────────────────────────────────────────────────────

class GuestJourneyEngine {
  constructor(config = {}) {
    this.facilityId = config.facilityId || 'AIRPORT-001';
    this.model = new MarkovTransitionModel();
    this.interventions = new InterventionQueue();
    this.guests = new Map();   // guestId → { stage, stageLog, satisfactionScore }
    this.completedJourneys = 0;
    this.totalNPS = 0;
  }

  admit(guestId) {
    this.guests.set(guestId, { guestId, stage: 'ARRIVAL', stageLog: [], satisfactionScore: null });
    return guestId;
  }

  advance(guestId, actualDwellMin) {
    const g = this.guests.get(guestId);
    if (!g || g.stage === 'DEPARTURE') return null;
    const nps = this.model.npsImpact(g.stage, actualDwellMin);
    g.stageLog.push({ stage: g.stage, dwellMin: actualDwellMin, nps });
    if (nps < INTERVENTION_NPS_THRESH) {
      this.interventions.push(guestId, g.stage, nps, `NPS ${nps.toFixed(1)} below threshold at ${g.stage}`);
    }
    const next = this.model.nextStage(g.stage);
    g.stage = next || 'DEPARTURE';
    if (g.stage === 'DEPARTURE') {
      g.satisfactionScore = this._journeyScore(g.stageLog);
      this.completedJourneys++;
      this.totalNPS += g.satisfactionScore;
    }
    return { guestId, newStage: g.stage, nps };
  }

  _journeyScore(log) {
    let score = 0;
    for (const entry of log) {
      score += entry.nps * (STAGE_WEIGHTS[entry.stage] || 0);
    }
    return Math.round(score * 100) / 100;
  }

  facilityNPS() {
    return this.completedJourneys > 0 ? Math.round((this.totalNPS / this.completedJourneys) * 100) / 100 : null;
  }

  run() {
    return {
      protocol: 'PROTO-018',
      facilityId: this.facilityId,
      activeGuests: this.guests.size - this.completedJourneys,
      completedJourneys: this.completedJourneys,
      facilityNPS: this.facilityNPS(),
      interventionQueueSize: this.interventions.size,
      topInterventions: this.interventions.peek(3),
      stageWeights: STAGE_WEIGHTS,
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createGuestJourneyProtocol(config = {}) {
  return new GuestJourneyEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  STAGES,
  STAGE_WEIGHTS,
  TRANSITIONS,
  INTERVENTION_NPS_THRESH,
  MarkovTransitionModel,
  InterventionQueue,
  GuestJourneyEngine,
  createGuestJourneyProtocol,
};
