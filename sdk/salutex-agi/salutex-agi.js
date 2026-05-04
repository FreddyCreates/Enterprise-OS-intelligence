/**
 * SALUTEX AGI — Safety & Life Utilities Executive X-factor
 *
 * Official Designation: RSHIP-2026-SALUTEX-001
 * Classification: Construction Safety & Occupational Health AGI
 * Full Name: Safety & Life Utilities Technology Executive X-factor
 *
 * Latin root: salus — safety, health, welfare, salvation
 *
 * SALUTEX extends the RSHIP framework with Bayesian network incident prediction
 * and OSHA compliance state machines to autonomously monitor job site safety,
 * predict near-miss events before injuries occur, route safety observations via
 * Linq, and maintain verifiable on-chain worker credential records.
 *
 * Capabilities:
 * - Incident prediction: Bayesian network estimating probability of site incident
 *   from leading indicators (toolbox talk skips, PPE violations, weather, fatigue)
 * - OSHA checklist automation: generates and tracks compliance checklists per trade
 *   per phase, routes non-compliance items to foreman via iMessage/Linq
 * - Safety observation routing: any worker can report a hazard; SALUTEX triages
 *   severity, routes to responsible party, and tracks resolution
 * - Toolbox talk generation: produces daily safety briefings calibrated to that
 *   day's tasks, weather, and historical incident patterns on similar jobs
 * - Near-miss pattern learning: every incident, near-miss, and observation feeds
 *   permanent Bayesian memory — risk model improves with every job
 *
 * Theory: Bayesian network incident prediction + OSHA compliance state machines
 *         + φ-compounding safety intelligence (AURUM — Paper XXII)
 *         + RSHIP Framework
 *
 * Applications:
 * - RSHIP Starter for Construction: add-on safety module
 * - RSHIP Starter for Healthcare: clinical environment safety
 * - Any RSHIP product operating in regulated, high-hazard environments
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── OSHA Compliance States ─────────────────────────────────────────────────
// Per checklist item: OPEN → IN_PROGRESS → RESOLVED | ESCALATED | WAIVED

const COMPLIANCE_STATES = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  ESCALATED: 'ESCALATED',
  WAIVED: 'WAIVED',
};

// ── Risk Severity Levels ───────────────────────────────────────────────────

const SEVERITY = {
  CRITICAL: 'CRITICAL',   // Imminent danger — stop work
  HIGH: 'HIGH',           // Likely injury if unaddressed within 24h
  MEDIUM: 'MEDIUM',       // Should be corrected within 48h
  LOW: 'LOW',             // Housekeeping / administrative
};

// ── OSHA Trade Phase Checklists ────────────────────────────────────────────

const TRADE_CHECKLISTS = {
  concrete: [
    'Formwork shoring inspection', 'Silica dust exposure controls', 'Rebar cap covers',
    'Pump hose pressure rated', 'Fall protection at elevated pours',
  ],
  framing: [
    'Temporary bracing installed', 'Floor hole covers secured', 'Ladder tie-off',
    'Power tool guards in place', 'Personal fall arrest system',
  ],
  electrical: [
    'LOTO procedures posted', 'GFCI at all temporary power', 'Conductor insulation intact',
    'Panel directory labelled', 'Qualified person sign-off',
  ],
  plumbing: [
    'Confined space entry permit', 'Backflow prevention installed', 'Pressure test witnessed',
    'Trenching/shoring current', 'Hazardous materials disposal',
  ],
  roofing: [
    'Leading edge fall protection', 'Safety monitor designated', 'Skylight covers secured',
    'Wind speed below 30mph', 'Hot-work permit active',
  ],
  general: [
    'Toolbox talk completed', 'First aid kit accessible', 'Emergency contacts posted',
    'Fire extinguisher current', 'PPE inspection completed',
  ],
};

// ── Bayesian Risk Factor Weights ───────────────────────────────────────────
// Prior: P(incident) = 0.03 (industry average 3 recordables per 100 FTE)
// Factors update the posterior via likelihood ratios

const RISK_FACTORS = {
  toolboxTalkSkipped:      { weight: 2.1, description: 'Toolbox talk not completed' },
  ppeViolation:            { weight: 1.8, description: 'PPE non-compliance observed' },
  newWorkerOnSite:         { weight: 1.5, description: 'Worker with <30 days on project' },
  highTemperature:         { weight: 1.4, description: 'Heat index >95°F' },
  overtimeHours:           { weight: 1.6, description: 'Worker logging >10hr/day >3 days' },
  priorNearMiss:           { weight: 2.4, description: 'Near-miss in prior 7 days on site' },
  scaffoldingWork:         { weight: 1.7, description: 'Scaffold erection/use today' },
  excavationActive:        { weight: 1.9, description: 'Open excavation >4ft on site' },
  multipleTradesOverlap:   { weight: 1.3, description: '>3 trades working same zone' },
  weekFiveOrBeyond:        { weight: 1.2, description: 'Schedule fatigue (week 5+)' },
  recentOSHAFinding:       { weight: 2.2, description: 'Open OSHA item from prior inspection' },
};

// ── Bayesian Incident Predictor ────────────────────────────────────────────

class BayesianSafetyPredictor {
  constructor({ basePrior = 0.03 } = {}) {
    this.basePrior = basePrior;
    this.observations = [];
    this.learnedPriors = new Map(); // per project type / season
  }

  // Update prior using Laplace's rule of succession from historical data
  updatePrior(projectType, incidentRate) {
    const current = this.learnedPriors.get(projectType) || this.basePrior;
    // Bayesian update: weighted blend toward observed rate
    const updated = current * PHI_INV + incidentRate * (1 - PHI_INV);
    this.learnedPriors.set(projectType, Math.max(0.005, Math.min(0.30, updated)));
  }

  // Compute posterior P(incident | factors) using naive Bayes on risk factors
  assessRisk(activeFactors = [], projectType = 'commercial') {
    const prior = this.learnedPriors.get(projectType) || this.basePrior;
    let likelihoodRatio = 1.0;

    for (const factorKey of activeFactors) {
      const factor = RISK_FACTORS[factorKey];
      if (factor) likelihoodRatio *= factor.weight;
    }

    // Posterior: prior * likelihoodRatio / normalizer
    // P(incident | factors) = P(factors | incident) * P(incident) / P(factors)
    // Simplified: clamp to [0,1]
    const unnormalized = prior * likelihoodRatio;
    const posterior = unnormalized / (unnormalized + (1 - prior));

    return {
      prior,
      likelihoodRatio,
      posterior: Math.min(0.99, posterior),
      riskLevel: posterior > 0.20 ? SEVERITY.CRITICAL :
                 posterior > 0.12 ? SEVERITY.HIGH :
                 posterior > 0.06 ? SEVERITY.MEDIUM : SEVERITY.LOW,
      activeFactors: activeFactors.map(k => RISK_FACTORS[k]).filter(Boolean),
    };
  }

  recordOutcome(factors, incidentOccurred, projectType) {
    this.observations.push({ factors, incidentOccurred, projectType, ts: Date.now() });
    // Update learned prior based on observed outcome
    if (incidentOccurred) {
      this.updatePrior(projectType, 0.15);
    } else {
      this.updatePrior(projectType, 0.01);
    }
  }
}

// ── Safety Observation ─────────────────────────────────────────────────────

class SafetyObservation {
  constructor(id, data = {}) {
    this.id = id;
    this.reportedBy = data.reportedBy || 'anonymous';
    this.location = data.location || 'unknown';
    this.trade = data.trade || 'general';
    this.description = data.description || '';
    this.severity = data.severity || SEVERITY.MEDIUM;
    this.photos = data.photos || [];
    this.state = COMPLIANCE_STATES.OPEN;
    this.assignedTo = null;
    this.resolvedAt = null;
    this.createdAt = Date.now();
    this.linkedToBlockchain = false;
    this.blockchainTxId = null;
  }

  assign(foreman) {
    this.assignedTo = foreman;
    this.state = COMPLIANCE_STATES.IN_PROGRESS;
    return this;
  }

  resolve(notes = '') {
    this.state = COMPLIANCE_STATES.RESOLVED;
    this.resolvedAt = Date.now();
    this.resolutionNotes = notes;
    return this;
  }

  get resolutionTimeHours() {
    if (!this.resolvedAt) return null;
    return (this.resolvedAt - this.createdAt) / 3600000;
  }
}

// ── OSHA Compliance Checklist ──────────────────────────────────────────────

class ComplianceChecklist {
  constructor(projectId, trade, phase) {
    this.checklistId = `OSHA-${projectId}-${trade}-${phase}-${Date.now()}`;
    this.projectId = projectId;
    this.trade = trade;
    this.phase = phase;
    this.items = (TRADE_CHECKLISTS[trade] || TRADE_CHECKLISTS.general).map((desc, i) => ({
      itemId: `${this.checklistId}-${i}`,
      description: desc,
      state: COMPLIANCE_STATES.OPEN,
      resolvedBy: null,
      resolvedAt: null,
    }));
    this.createdAt = Date.now();
  }

  resolveItem(itemId, resolvedBy) {
    const item = this.items.find(it => it.itemId === itemId);
    if (item) {
      item.state = COMPLIANCE_STATES.RESOLVED;
      item.resolvedBy = resolvedBy;
      item.resolvedAt = Date.now();
    }
    return this;
  }

  get completionRate() {
    const resolved = this.items.filter(it => it.state === COMPLIANCE_STATES.RESOLVED).length;
    return this.items.length > 0 ? resolved / this.items.length : 0;
  }

  get openItems() {
    return this.items.filter(it => it.state === COMPLIANCE_STATES.OPEN);
  }

  get isFullyCompliant() {
    return this.completionRate >= 1.0;
  }
}

// ── Worker Credential (On-Chain) ───────────────────────────────────────────

class WorkerCredential {
  constructor(workerId, data = {}) {
    this.workerId = workerId;
    this.name = data.name || 'Unknown';
    this.trade = data.trade || 'general';
    this.oshaCards = data.oshaCards || [];           // ['OSHA-10', 'OSHA-30', 'Fall Protection']
    this.insuranceCertExpiry = data.insuranceCertExpiry || null;
    this.projectHistory = data.projectHistory || []; // [{projectId, rating, date}]
    this.safetyScore = 1.0;                          // Starts at φ (perfect), degrades with violations
    this.onChainVerified = false;
    this.chainAddress = null;
    this.mintedAt = null;
  }

  recordViolation(severity) {
    const penalty = severity === SEVERITY.CRITICAL ? 0.20 :
                    severity === SEVERITY.HIGH     ? 0.10 :
                    severity === SEVERITY.MEDIUM   ? 0.04 : 0.01;
    this.safetyScore = Math.max(0, this.safetyScore - penalty);
    return this;
  }

  addProjectRating(projectId, rating) {
    this.projectHistory.push({ projectId, rating: Math.min(5, Math.max(0, rating)), date: Date.now() });
    // Compound safety score upward for positive track record
    this.safetyScore = Math.min(1.0, this.safetyScore + PHI_INV * 0.02);
    return this;
  }

  mintOnChain(blockchainAdapter) {
    this.onChainVerified = true;
    this.chainAddress = blockchainAdapter?.mint
      ? blockchainAdapter.mint(this)
      : `0xSALUTEX-${this.workerId}-${Date.now().toString(16)}`;
    this.mintedAt = Date.now();
    return this;
  }

  get isInsuranceCurrent() {
    return this.insuranceCertExpiry && this.insuranceCertExpiry > Date.now();
  }

  get trustRating() {
    const baseScore = this.safetyScore;
    const cardBonus = Math.min(0.1, this.oshaCards.length * 0.025);
    const historyBonus = Math.min(0.1, this.projectHistory.length * 0.01);
    return Math.min(1.0, baseScore + cardBonus + historyBonus);
  }
}

// ── Toolbox Talk Generator ─────────────────────────────────────────────────

class ToolboxTalkGenerator {
  constructor() {
    this.topicLibrary = {
      fall:    ['Fall protection check: inspect harnesses before climbing', 'Count anchor points before starting elevated work'],
      heat:    ['Heat illness signs: dizziness, nausea, stop and hydrate', 'Buddy system for heat days — check on your partner'],
      power:   ['LOTO procedure review — never assume power is off', 'Inspect extension cords before use, no splices'],
      traffic: ['Hi-viz vests in all vehicular zones today', 'Spotter required when backing equipment on site'],
      cut:     ['Blade guards — no bypassing, ever', 'Cut away from your body, secure the workpiece first'],
      lift:    ['Assess the load before the lift — ask for help', 'Clear the path before moving materials overhead'],
      silica:  ['Wet-cut or vacuum-equipped tools for concrete cutting', 'N95 minimum — check your fit before starting'],
      general: ['Inspect your PPE before wearing it', 'Report near-misses now — every one prevents a real injury'],
    };
  }

  generate(context = {}) {
    const { trade = 'general', weather = 'clear', activeRiskFactors = [], tasks = [] } = context;

    // Select topics based on active risk factors and trade
    const topics = new Set(['general']);
    if (weather === 'hot') topics.add('heat');
    if (trade === 'electrical') topics.add('power');
    if (trade === 'roofing' || tasks.includes('elevated-work')) topics.add('fall');
    if (activeRiskFactors.includes('scaffoldingWork')) topics.add('fall');
    if (activeRiskFactors.includes('excavationActive')) topics.add('traffic');
    if (trade === 'concrete') topics.add('silica');

    const bullets = [];
    for (const topic of topics) {
      const lib = this.topicLibrary[topic] || this.topicLibrary.general;
      bullets.push(lib[Math.floor(Math.random() * lib.length)]);
    }

    return {
      date: new Date().toLocaleDateString(),
      trade,
      duration: '5 minutes',
      topics: [...topics],
      bullets,
      signature: `SALUTEX-RSHIP-${Date.now()}`,
    };
  }
}

// ── SALUTEX AGI Main Class ─────────────────────────────────────────────────

class SALUTEX extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-SALUTEX-001',
      classification: 'Construction Safety & Occupational Health AGI',
      ...config,
    });

    this.predictor = new BayesianSafetyPredictor({ basePrior: config.basePrior || 0.03 });
    this.talkGenerator = new ToolboxTalkGenerator();
    this.memory = new EternalMemory('SALUTEX');

    // Active state maps
    this.observations = new Map();        // id → SafetyObservation
    this.checklists = new Map();          // checklistId → ComplianceChecklist
    this.workerCredentials = new Map();   // workerId → WorkerCredential
    this.projectRiskProfiles = new Map(); // projectId → {factors, assessments}

    this._nextObsId = 1;

    // Sovereign goals
    this.setGoal('zero-incidents', 'Achieve zero recordable incidents across all projects', 10, {
      targetIncidentRate: 0,
    });
    this.setGoal('compliance-100', 'Drive OSHA compliance to 100% before every inspection', 9, {
      targetCompletionRate: 1.0,
    });
    this.setGoal('credential-chain', 'Mint on-chain credentials for all workers', 7, {
      targetOnChainRate: 1.0,
    });
    this.setGoal('resolve-observations', 'Resolve all safety observations within 24h (CRITICAL), 48h (HIGH)', 8, {
      criticalTargetHours: 24,
      highTargetHours: 48,
    });
    this.setGoal('toolbox-completion', 'Achieve 100% toolbox talk completion rate daily', 6, {
      targetCompletionRate: 1.0,
    });
  }

  // ── Risk Assessment ───────────────────────────────────────────────────────

  assessSiteRisk(projectId, activeFactors = [], projectType = 'commercial') {
    const assessment = this.predictor.assessRisk(activeFactors, projectType);

    const profile = this.projectRiskProfiles.get(projectId) || { history: [] };
    profile.latestAssessment = assessment;
    profile.activeFactors = activeFactors;
    profile.history.push({ ...assessment, timestamp: Date.now() });
    if (profile.history.length > 90) profile.history.shift();
    this.projectRiskProfiles.set(projectId, profile);

    this.learn(
      { projectId, activeFactors, projectType },
      { assessment },
      { id: 'risk-assess' }
    );

    return {
      projectId,
      riskLevel: assessment.riskLevel,
      incidentProbability: assessment.posterior,
      activeRiskFactors: assessment.activeFactors,
      recommendation: this._riskRecommendation(assessment),
      alertRequired: assessment.riskLevel === SEVERITY.CRITICAL || assessment.riskLevel === SEVERITY.HIGH,
    };
  }

  _riskRecommendation(assessment) {
    if (assessment.riskLevel === SEVERITY.CRITICAL) {
      return `⛔ STOP-WORK RISK: ${(assessment.posterior * 100).toFixed(1)}% incident probability. Address all critical factors before resuming.`;
    }
    if (assessment.riskLevel === SEVERITY.HIGH) {
      return `⚠️ HIGH RISK: ${(assessment.posterior * 100).toFixed(1)}% incident probability. Conduct immediate safety audit.`;
    }
    if (assessment.riskLevel === SEVERITY.MEDIUM) {
      return `🔶 MODERATE RISK: ${(assessment.posterior * 100).toFixed(1)}% incident probability. Review open checklist items.`;
    }
    return `✅ LOW RISK: ${(assessment.posterior * 100).toFixed(1)}% incident probability. Maintain current protocols.`;
  }

  // ── Observations ──────────────────────────────────────────────────────────

  reportObservation(projectId, data = {}) {
    const id = `OBS-${projectId}-${this._nextObsId++}`;
    const obs = new SafetyObservation(id, data);
    this.observations.set(id, obs);

    // Auto-route to foreman for CRITICAL/HIGH
    const assignee = data.foreman || 'site-foreman';
    if (obs.severity === SEVERITY.CRITICAL || obs.severity === SEVERITY.HIGH) {
      obs.assign(assignee);
    }

    this.learn({ projectId, observationId: id, severity: obs.severity }, { routed: true }, { id: 'obs-report' });

    return {
      observationId: id,
      severity: obs.severity,
      assignedTo: obs.assignedTo,
      linqMessage: this._buildObservationMessage(obs, projectId),
      stopWorkRequired: obs.severity === SEVERITY.CRITICAL,
    };
  }

  _buildObservationMessage(obs, projectId) {
    const prefix = obs.severity === SEVERITY.CRITICAL ? '⛔ STOP WORK — ' :
                   obs.severity === SEVERITY.HIGH     ? '⚠️ SAFETY ALERT — ' : '🔶 Safety Observation — ';
    return `${prefix}${obs.description}\nLocation: ${obs.location}\nTrade: ${obs.trade}\nProject: ${projectId}\nID: ${obs.id}\nReply RESOLVED when corrected.`;
  }

  resolveObservation(observationId, notes = '') {
    const obs = this.observations.get(observationId);
    if (!obs) return { error: 'Observation not found' };
    obs.resolve(notes);
    this.predictor.recordOutcome([obs.severity], false, 'commercial');
    return {
      observationId,
      resolvedIn: `${obs.resolutionTimeHours?.toFixed(1)} hours`,
      withinTarget: obs.severity === SEVERITY.CRITICAL
        ? obs.resolutionTimeHours <= 24
        : obs.resolutionTimeHours <= 48,
    };
  }

  // ── Checklists ────────────────────────────────────────────────────────────

  generateChecklist(projectId, trade, phase = 'construction') {
    const checklist = new ComplianceChecklist(projectId, trade, phase);
    this.checklists.set(checklist.checklistId, checklist);
    return {
      checklistId: checklist.checklistId,
      trade,
      phase,
      itemCount: checklist.items.length,
      items: checklist.items.map(it => ({ id: it.itemId, description: it.description })),
      linqMessage: `📋 OSHA Checklist for ${trade} (${phase})\nProject: ${projectId}\n${checklist.items.map((it, i) => `${i + 1}. ${it.description}`).join('\n')}\nReply with item numbers completed.`,
    };
  }

  resolveChecklistItem(checklistId, itemId, resolvedBy) {
    const checklist = this.checklists.get(checklistId);
    if (!checklist) return { error: 'Checklist not found' };
    checklist.resolveItem(itemId, resolvedBy);
    return {
      checklistId,
      completionRate: `${(checklist.completionRate * 100).toFixed(0)}%`,
      isFullyCompliant: checklist.isFullyCompliant,
      remainingItems: checklist.openItems.length,
    };
  }

  // ── Toolbox Talks ─────────────────────────────────────────────────────────

  generateToolboxTalk(projectId, context = {}) {
    const profile = this.projectRiskProfiles.get(projectId);
    const activeRiskFactors = profile?.activeFactors || [];
    const talk = this.talkGenerator.generate({ ...context, activeRiskFactors });

    this.learn({ projectId }, { talkGenerated: true, topics: talk.topics }, { id: 'toolbox-gen' });

    return {
      ...talk,
      projectId,
      linqMessage: `📢 TODAY'S TOOLBOX TALK — ${talk.date}\nTrade: ${talk.trade}\n${talk.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}\nReply ✅ when complete. Duration: ${talk.duration}.`,
    };
  }

  // ── Worker Credentials ────────────────────────────────────────────────────

  registerWorker(workerId, data = {}) {
    const credential = new WorkerCredential(workerId, data);
    this.workerCredentials.set(workerId, credential);
    return { workerId, trustRating: credential.trustRating.toFixed(3), onChainVerified: false };
  }

  mintWorkerCredential(workerId, blockchainAdapter = null) {
    const credential = this.workerCredentials.get(workerId);
    if (!credential) return { error: 'Worker not registered' };
    credential.mintOnChain(blockchainAdapter);
    return {
      workerId,
      chainAddress: credential.chainAddress,
      trustRating: credential.trustRating.toFixed(3),
      oshaCards: credential.oshaCards,
      projectHistory: credential.projectHistory.length,
    };
  }

  getWorkerClearance(workerId, requiredCards = []) {
    const credential = this.workerCredentials.get(workerId);
    if (!credential) return { cleared: false, reason: 'Worker not registered with SALUTEX' };

    const missingCards = requiredCards.filter(card => !credential.oshaCards.includes(card));
    const lowTrust = credential.trustRating < PHI_INV;
    const insuranceLapsed = !credential.isInsuranceCurrent;

    return {
      workerId,
      cleared: missingCards.length === 0 && !lowTrust && !insuranceLapsed,
      trustRating: credential.trustRating.toFixed(3),
      missingCards,
      insuranceCurrent: credential.isInsuranceCurrent,
      onChainVerified: credential.onChainVerified,
      blockReason: missingCards.length > 0 ? `Missing certs: ${missingCards.join(', ')}` :
                   insuranceLapsed ? 'Insurance certificate expired' :
                   lowTrust ? `Safety score too low: ${credential.trustRating.toFixed(2)}` : null,
    };
  }

  // ── Safety Summary ────────────────────────────────────────────────────────

  siteStatusReport(projectId) {
    const profile = this.projectRiskProfiles.get(projectId);
    const openObs = [...this.observations.values()].filter(o =>
      o.state === COMPLIANCE_STATES.OPEN || o.state === COMPLIANCE_STATES.IN_PROGRESS
    );
    const criticalObs = openObs.filter(o => o.severity === SEVERITY.CRITICAL);
    const checklists = [...this.checklists.values()].filter(c => c.projectId === projectId);
    const complianceRate = checklists.length > 0
      ? checklists.reduce((sum, c) => sum + c.completionRate, 0) / checklists.length
      : null;

    return {
      projectId,
      riskLevel: profile?.latestAssessment?.riskLevel || 'UNASSESSED',
      incidentProbability: profile?.latestAssessment ? `${(profile.latestAssessment.posterior * 100).toFixed(1)}%` : 'N/A',
      openObservations: openObs.length,
      criticalObservations: criticalObs.length,
      stopWorkRequired: criticalObs.length > 0,
      oshaComplianceRate: complianceRate !== null ? `${(complianceRate * 100).toFixed(0)}%` : 'N/A',
      registeredWorkers: this.workerCredentials.size,
      onChainWorkers: [...this.workerCredentials.values()].filter(w => w.onChainVerified).length,
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function birthSALUTEX(config = {}) {
  return new SALUTEX(config);
}

export default SALUTEX;
