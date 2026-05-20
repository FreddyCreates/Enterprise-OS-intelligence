/**
 * PROTO-022: Crisis Intelligence Protocol (CIP)  (Medina)
 *
 * Multi-stakeholder crisis detection, escalation, and response coordination.
 *
 * Monitors 8 crisis categories: Weather Disruption, Security Incident, System
 * Failure, Medical Emergency, Civil Unrest, PR Crisis, Supply Disruption,
 * Regulatory Action. A Bayesian network combines prior threat signals with
 * real-time sensor evidence to compute posterior crisis probability × impact.
 * Escalates through NOTIFY → ASSESS → RESPOND → RECOVER → LEARN lifecycle.
 * φ-weighted severity scoring ensures high-impact, high-probability events
 * always surface above noise.
 *
 * Engines wired: CrisisIntelligenceEngine + BayesianThreatModel + ResponseCoordinator
 * Ring: Sovereign Ring
 * Wire: intelligence-wire/cip
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const CRISIS_CATEGORIES = [
  'weather_disruption', 'security_incident', 'system_failure', 'medical_emergency',
  'civil_unrest', 'pr_crisis', 'supply_disruption', 'regulatory_action',
];

const LIFECYCLE_STAGES = ['monitor', 'notify', 'assess', 'respond', 'recover', 'learn', 'closed'];

// φ-weighted category severity priors (higher = more inherently severe)
const CATEGORY_SEVERITY = {
  weather_disruption:  1.0,
  security_incident:   PHI * PHI,
  system_failure:      PHI,
  medical_emergency:   PHI * PHI,
  civil_unrest:        PHI,
  pr_crisis:           PHI_INV,
  supply_disruption:   PHI_INV * PHI_INV,
  regulatory_action:   1.0,
};

const ESCALATE_THRESHOLD   = 0.55;  // posterior probability × impact to escalate
const NOTIFY_THRESHOLD     = 0.30;
const AUTO_RESPOND_THRESH  = 0.80;

// ── Bayesian Threat Model ──────────────────────────────────────────────────────

class BayesianThreatModel {
  constructor() {
    // Priors: P(crisis | category) — baseline from historical data
    this.priors = {};
    for (const cat of CRISIS_CATEGORIES) this.priors[cat] = 0.05;
  }

  setPrior(category, prior) {
    this.priors[category] = Math.min(1, Math.max(0, prior));
  }

  // Bayesian update: P(H|E) = P(E|H)*P(H) / [P(E|H)*P(H) + P(E|¬H)*(1-P(H))]
  posterior(category, likelihoodTrue, likelihoodFalse = 0.1) {
    const prior = this.priors[category] || 0.05;
    const numerator = likelihoodTrue * prior;
    const denominator = numerator + likelihoodFalse * (1 - prior);
    return denominator > 0 ? Math.round((numerator / denominator) * 1e4) / 1e4 : 0;
  }

  updatePrior(category, posterior) {
    // Online Bayesian update: new prior ← exponential moving average
    this.priors[category] = Math.round((PHI_INV * this.priors[category] + (1 - PHI_INV) * posterior) * 1e4) / 1e4;
  }

  phiSeverity(category, posterior, impactScore) {
    const severity = CATEGORY_SEVERITY[category] || 1;
    return Math.round(posterior * impactScore * severity * PHI * 1e4) / 1e4;
  }
}

// ── Response Coordinator ──────────────────────────────────────────────────────

class ResponseCoordinator {
  constructor() {
    this.incidents = new Map();
    this.nextId = 1;
  }

  open(category, phiSeverity, stakeholders = []) {
    const id = `CIP-${String(this.nextId++).padStart(5, '0')}`;
    const stage = phiSeverity >= AUTO_RESPOND_THRESH * PHI ? 'respond'
                : phiSeverity >= ESCALATE_THRESHOLD * PHI  ? 'assess'
                : phiSeverity >= NOTIFY_THRESHOLD * PHI    ? 'notify'
                : 'monitor';
    this.incidents.set(id, { id, category, phiSeverity, stage, stageHistory: [{ stage, ts: Date.now() }], stakeholders, actions: [], openedAt: Date.now(), closedAt: null });
    return id;
  }

  advance(incidentId) {
    const inc = this.incidents.get(incidentId);
    if (!inc || inc.stage === 'closed') return null;
    const idx = LIFECYCLE_STAGES.indexOf(inc.stage);
    if (idx < LIFECYCLE_STAGES.length - 1) {
      inc.stage = LIFECYCLE_STAGES[idx + 1];
      inc.stageHistory.push({ stage: inc.stage, ts: Date.now() });
      if (inc.stage === 'closed') inc.closedAt = Date.now();
    }
    return inc;
  }

  logAction(incidentId, actor, action) {
    const inc = this.incidents.get(incidentId);
    if (inc) inc.actions.push({ actor, action, ts: Date.now() });
  }

  active() {
    return [...this.incidents.values()].filter(i => i.stage !== 'closed');
  }
}

// ── Crisis Intelligence Engine ────────────────────────────────────────────────

class CrisisIntelligenceEngine {
  constructor(config = {}) {
    this.entityId = config.entityId || 'AIRPORT-001';
    this.model = new BayesianThreatModel();
    this.coordinator = new ResponseCoordinator();
    this.signalLog = [];
    this.runCount = 0;
  }

  ingestSignal(category, likelihoodTrue, impactScore, stakeholders = []) {
    if (!CRISIS_CATEGORIES.includes(category)) throw new Error(`Unknown category: ${category}`);
    const posterior = this.model.posterior(category, likelihoodTrue);
    const severity = this.model.phiSeverity(category, posterior, impactScore);
    this.model.updatePrior(category, posterior);
    const incidentId = this.coordinator.open(category, severity, stakeholders);
    const signal = { category, likelihoodTrue, impactScore, posterior, severity, incidentId, ts: Date.now() };
    this.signalLog.push(signal);
    return signal;
  }

  advance(incidentId) {
    return this.coordinator.advance(incidentId);
  }

  logAction(incidentId, actor, action) {
    this.coordinator.logAction(incidentId, actor, action);
  }

  threatLandscape() {
    const landscape = {};
    for (const cat of CRISIS_CATEGORIES) {
      landscape[cat] = { prior: this.model.priors[cat], severity: CATEGORY_SEVERITY[cat] };
    }
    return landscape;
  }

  run() {
    this.runCount++;
    const active = this.coordinator.active();
    const bySeverity = active.sort((a, b) => b.phiSeverity - a.phiSeverity);
    return {
      protocol: 'PROTO-022',
      entityId: this.entityId,
      runCount: this.runCount,
      activeIncidents: active.length,
      signalsIngested: this.signalLog.length,
      escalateThreshold: ESCALATE_THRESHOLD,
      topIncidents: bySeverity.slice(0, 5).map(i => ({ id: i.id, category: i.category, stage: i.stage, phiSeverity: i.phiSeverity })),
      threatLandscape: this.threatLandscape(),
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createCrisisIntelligenceProtocol(config = {}) {
  return new CrisisIntelligenceEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  CRISIS_CATEGORIES,
  LIFECYCLE_STAGES,
  CATEGORY_SEVERITY,
  ESCALATE_THRESHOLD,
  NOTIFY_THRESHOLD,
  AUTO_RESPOND_THRESH,
  BayesianThreatModel,
  ResponseCoordinator,
  CrisisIntelligenceEngine,
  createCrisisIntelligenceProtocol,
};
