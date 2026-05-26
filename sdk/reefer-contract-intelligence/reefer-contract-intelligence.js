/**
 * Reefer Contract Intelligence — Enterprise app core for reefer 18-wheelers.
 *
 * Capabilities:
 * - Domain model for operations, contracts, risk, and compliance
 * - Contract intelligence MVP (ingest, classify, score, obligations, redlines)
 * - Internal dashboards (ops, legal, finance, executive)
 * - External intelligence pipelines (market, weather, compliance, partner)
 * - Closed-loop orchestration with human approvals and outcomes
 * - Tenant isolation, RBAC, immutable audit trail, retention controls
 */

import { RSHIPCore, PHI_INV } from '../../rship-framework.js';

const SOURCE_TYPES = new Set(['pdf', 'text', 'email']);
const CONTRACT_LIFECYCLE = ['draft', 'review', 'negotiation', 'active', 'renewal', 'termination'];
const INTELLIGENCE_LIFECYCLE = ['ingest', 'classify', 'score', 'alert', 'resolve'];

const CONTRACT_TRANSITIONS = {
  draft: new Set(['review']),
  review: new Set(['negotiation', 'draft']),
  negotiation: new Set(['review', 'active', 'termination']),
  active: new Set(['renewal', 'termination']),
  renewal: new Set(['active', 'termination']),
  termination: new Set(),
};

const EVENT_TRANSITIONS = {
  ingest: new Set(['classify']),
  classify: new Set(['score']),
  score: new Set(['alert', 'resolve']),
  alert: new Set(['resolve']),
  resolve: new Set(),
};

const CATEGORY_RULES = [
  { category: 'rates', severity: 'medium', patterns: [/rate card/i, /\brate\b/i, /linehaul/i, /fuel surcharge/i], exposureFactor: 1.1 },
  { category: 'detention', severity: 'high', patterns: [/detention/i, /wait time/i, /hourly charge/i], exposureFactor: 1.4 },
  { category: 'temperature_liability', severity: 'critical', patterns: [/temperature/i, /reefer/i, /cold chain/i, /excursion/i], exposureFactor: 1.9 },
  { category: 'claims', severity: 'high', patterns: [/claim/i, /cargo damage/i, /loss/i], exposureFactor: 1.5 },
  { category: 'penalties', severity: 'high', patterns: [/penalt/i, /chargeback/i, /liquidated damages/i], exposureFactor: 1.6 },
  { category: 'force_majeure', severity: 'medium', patterns: [/force majeure/i, /act of god/i], exposureFactor: 1.0 },
  { category: 'insurance', severity: 'medium', patterns: [/insurance/i, /coverage/i, /liability policy/i], exposureFactor: 1.2 },
  { category: 'jurisdiction', severity: 'medium', patterns: [/governing law/i, /jurisdiction/i, /venue/i, /arbitration/i], exposureFactor: 1.1 },
];

const SEVERITY_SCORE = {
  low: 20,
  medium: 45,
  high: 70,
  critical: 90,
};

const ROLE_POLICY = {
  admin: new Set(['ingest', 'review', 'approve', 'dispatch', 'finance', 'legal', 'risk', 'dashboard']),
  legal: new Set(['ingest', 'review', 'approve', 'legal', 'risk', 'dashboard']),
  dispatch: new Set(['dispatch', 'dashboard']),
  finance: new Set(['finance', 'dashboard', 'review']),
  risk: new Set(['risk', 'dashboard', 'review']),
  analyst: new Set(['dashboard', 'review']),
  viewer: new Set(['dashboard']),
};

const PHASES = {
  phase1: {
    name: 'Phase 1',
    scope: ['contract_ingestion', 'clause_risk', 'obligations', 'basic_dashboard'],
  },
  phase2: {
    name: 'Phase 2',
    scope: ['external_signal_fusion', 'predictive_risk', 'action_routing'],
  },
  phase3: {
    name: 'Phase 3',
    scope: ['enterprise_integrations', 'optimization', 'board_reporting'],
  },
};

let idCounter = 0;

function safeId(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}_${uuid}`;
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

function splitClauses(text = '') {
  return text
    .split(/\n{2,}|(?=\b\d+\.\s+[A-Z])/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function findDates(text = '') {
  const results = [];
  const re = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
  for (const match of text.matchAll(re)) results.push(match[0]);
  return [...new Set(results)];
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class ReeferContractIntelligence extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: config.designation || 'RSHIP-2026-REEFER-CONTRACT-001',
      classification: 'Reefer Contract Intelligence',
    });

    this.product = {
      name: 'Reefer Contract Intelligence',
      outcomes: {
        internal: ['fleet_ops', 'dispatch', 'legal', 'finance', 'risk', 'maintenance'],
        external: ['shipper_contracts', 'lane_markets', 'weather', 'fuel', 'compliance', 'partner_performance'],
      },
    };

    this.adapters = {
      paralegal: config.paralegalAI || null,
      analyst: config.analystAI || null,
      logistex: config.logistexAGI || null,
      integration: config.enterpriseIntegration || null,
    };

    this.retentionDays = config.retentionDays ?? 365;
    this.tenants = new Map();
    this.metrics = new Map();
    this.externalSignals = new Map();
    this.phaseStatus = deepClone(PHASES);

    this.setGoal('reefer-contract-risk-reduction', 'Reduce contractual risk and financial exposure across reefer operations', 10, {
      contractReviewTimeReduction: 0,
      claimsPenaltyReduction: 0,
      marginLiftReeferLanes: 0,
      slaComplianceImprovement: 0,
      alertPrecisionAndCompletionRate: 0,
    });
  }

  setAdapters(adapters = {}) {
    this.adapters = { ...this.adapters, ...adapters };
  }

  initializeTenant(tenantId, config = {}) {
    if (!tenantId) throw new Error('tenantId is required');
    if (this.tenants.has(tenantId)) return this.tenants.get(tenantId);

    const tenant = {
      tenantId,
      createdAt: new Date().toISOString(),
      encryption: {
        atRest: config.encryptionAtRest ?? true,
        inTransit: config.encryptionInTransit ?? true,
      },
      entities: {
        fleets: new Map(),
        reeferUnits: new Map(),
        drivers: new Map(),
        lanes: new Map(),
        shipments: new Map(),
        contracts: new Map(),
        clauses: new Map(),
        rateCards: new Map(),
        slas: new Map(),
        temperatureEvents: new Map(),
        claims: new Map(),
      },
      intelligenceEvents: new Map(),
      redlines: new Map(),
      obligations: new Map(),
      tasks: [],
      outcomes: [],
      auditLog: [],
      provenance: [],
      roleAssignments: new Map(Object.entries(config.roleAssignments || {})),
      retentionDays: config.retentionDays ?? this.retentionDays,
    };

    this.tenants.set(tenantId, tenant);
    this._appendAudit(tenantId, 'tenant_initialized', { retentionDays: tenant.retentionDays });
    return tenant;
  }

  assignRole(tenantId, userId, role) {
    const tenant = this._tenant(tenantId);
    if (!ROLE_POLICY[role]) throw new Error(`Unsupported role: ${role}`);
    tenant.roleAssignments.set(userId, role);
    this._appendAudit(tenantId, 'role_assigned', { userId, role });
    return { userId, role };
  }

  _authorize(tenantId, userId, action) {
    const tenant = this._tenant(tenantId);
    const role = tenant.roleAssignments.get(userId);
    if (!role || !ROLE_POLICY[role]?.has(action)) {
      throw new Error(`RBAC_DENIED: user "${userId}" cannot perform "${action}"`);
    }
  }

  createEntity(tenantId, entityType, payload = {}, context = {}) {
    const tenant = this._tenant(tenantId);
    const table = tenant.entities[entityType];
    if (!table || !(table instanceof Map)) throw new Error(`Unknown entityType: ${entityType}`);
    const id = payload.id || safeId(entityType.slice(0, 4));
    const record = Object.freeze({
      id,
      ...payload,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    table.set(id, record);
    this._appendProvenance(tenantId, 'entity_created', { entityType, id, context });
    this._appendAudit(tenantId, 'entity_created', { entityType, id });
    return record;
  }

  transitionContractState(tenantId, contractId, nextState, userId) {
    this._authorize(tenantId, userId, 'review');
    if (!CONTRACT_LIFECYCLE.includes(nextState)) throw new Error(`Invalid contract state: ${nextState}`);

    const tenant = this._tenant(tenantId);
    const current = tenant.entities.contracts.get(contractId);
    if (!current) throw new Error(`Contract not found: ${contractId}`);

    const fromState = current.state || 'draft';
    const allowed = CONTRACT_TRANSITIONS[fromState] || new Set();
    if (!allowed.has(nextState)) {
      throw new Error(`Invalid transition ${fromState} -> ${nextState}`);
    }

    const updated = Object.freeze({
      ...current,
      state: nextState,
      updatedAt: new Date().toISOString(),
    });
    tenant.entities.contracts.set(contractId, updated);

    this._appendAudit(tenantId, 'contract_state_changed', { contractId, fromState, toState: nextState, userId });
    this._appendProvenance(tenantId, 'contract_state_changed', { contractId, fromState, toState: nextState });
    return updated;
  }

  transitionIntelligenceEvent(tenantId, eventId, nextState) {
    if (!INTELLIGENCE_LIFECYCLE.includes(nextState)) throw new Error(`Invalid intelligence state: ${nextState}`);

    const tenant = this._tenant(tenantId);
    const event = tenant.intelligenceEvents.get(eventId);
    if (!event) throw new Error(`Intelligence event not found: ${eventId}`);

    const allowed = EVENT_TRANSITIONS[event.state] || new Set();
    if (!allowed.has(nextState)) throw new Error(`Invalid transition ${event.state} -> ${nextState}`);

    const updated = Object.freeze({
      ...event,
      state: nextState,
      updatedAt: new Date().toISOString(),
    });
    tenant.intelligenceEvents.set(eventId, updated);
    this._appendAudit(tenantId, 'intelligence_state_changed', { eventId, fromState: event.state, toState: nextState });
    return updated;
  }

  ingestContract({ tenantId, userId, sourceType, content, metadata = {}, contract = {} }) {
    this._authorize(tenantId, userId, 'ingest');
    if (!SOURCE_TYPES.has(sourceType)) throw new Error(`Unsupported sourceType: ${sourceType}`);
    if (!content || typeof content !== 'string') throw new Error('Contract content must be a non-empty string');

    const tenant = this._tenant(tenantId);
    const contractId = contract.contractId || safeId('contract');

    const normalizedContent = this._normalizeContent(sourceType, content);
    const contractRecord = this.createEntity(tenantId, 'contracts', {
      id: contractId,
      title: contract.title || metadata.subject || `Contract ${contractId}`,
      sourceType,
      state: contract.state || 'draft',
      customer: contract.customer || metadata.sender || null,
      laneId: contract.laneId || null,
      effectiveDate: contract.effectiveDate || null,
      renewalDate: contract.renewalDate || null,
      text: normalizedContent,
      metadata,
    }, { sourceType });

    const clauses = this.extractAndClassifyClauses(tenantId, contractId, normalizedContent);
    const risk = this.scoreContractRisk(tenantId, contractId, clauses);
    const obligations = this.extractObligations(tenantId, contractId, normalizedContent);
    const redline = this.createRedlineRecommendationWorkflow({ tenantId, userId, contractId, clauses, risk });

    const external = this._createIntelligenceEvent(tenantId, {
      type: 'contract_ingestion',
      state: 'ingest',
      contractId,
      sourceType,
      riskScore: risk.totalRiskScore,
    });
    this.transitionIntelligenceEvent(tenantId, external.id, 'classify');
    this.transitionIntelligenceEvent(tenantId, external.id, 'score');
    if (risk.totalRiskScore >= 70) this.transitionIntelligenceEvent(tenantId, external.id, 'alert');
    else this.transitionIntelligenceEvent(tenantId, external.id, 'resolve');

    const ai = this._runAIAugmentations(normalizedContent);
    this._appendAudit(tenantId, 'contract_ingested', { contractId, sourceType, clauses: clauses.length, risk: risk.totalRiskScore });

    return {
      contract: contractRecord,
      clauses,
      risk,
      obligations,
      redlineWorkflow: redline,
      aiAugmentation: ai,
    };
  }

  extractAndClassifyClauses(tenantId, contractId, text) {
    const tenant = this._tenant(tenantId);
    const chunks = splitClauses(text);
    const clauses = [];

    chunks.forEach((chunk, index) => {
      const matchedRules = CATEGORY_RULES.filter((rule) => rule.patterns.some((p) => p.test(chunk)));
      if (matchedRules.length === 0) return;
      for (const rule of matchedRules) {
        const clause = Object.freeze({
          id: safeId('clause'),
          contractId,
          order: index + 1,
          category: rule.category,
          severity: rule.severity,
          text: chunk.slice(0, 1200),
          exposureFactor: rule.exposureFactor,
          createdAt: new Date().toISOString(),
        });
        clauses.push(clause);
        tenant.entities.clauses.set(clause.id, clause);
      }
    });

    if (clauses.length === 0) {
      const fallback = Object.freeze({
        id: safeId('clause'),
        contractId,
        order: 1,
        category: 'general',
        severity: 'low',
        text: text.slice(0, 1200),
        exposureFactor: 0.7,
        createdAt: new Date().toISOString(),
      });
      clauses.push(fallback);
      tenant.entities.clauses.set(fallback.id, fallback);
    }

    this._appendAudit(tenantId, 'clauses_classified', { contractId, clauses: clauses.length });
    return clauses;
  }

  scoreContractRisk(tenantId, contractId, clauses = []) {
    const tenant = this._tenant(tenantId);
    const contract = tenant.entities.contracts.get(contractId);
    if (!contract) throw new Error(`Contract not found: ${contractId}`);

    const baseContractValue = Number(contract.metadata?.contractValue || contract.metadata?.estimatedValue || 100000);
    const detail = clauses.map((c) => {
      const severity = SEVERITY_SCORE[c.severity] ?? 20;
      const financialExposure = Math.round(baseContractValue * 0.02 * c.exposureFactor);
      const weighted = Math.min(100, Math.round(severity * c.exposureFactor));
      return {
        clauseId: c.id,
        category: c.category,
        severity: c.severity,
        weightedScore: weighted,
        financialExposure,
      };
    });

    const totalRiskScore = Math.round(detail.reduce((sum, d) => sum + d.weightedScore, 0) / Math.max(1, detail.length));
    const totalExposure = detail.reduce((sum, d) => sum + d.financialExposure, 0);
    const riskBand = totalRiskScore >= 85 ? 'critical' : totalRiskScore >= 70 ? 'high' : totalRiskScore >= 45 ? 'medium' : 'low';

    const score = Object.freeze({
      contractId,
      totalRiskScore,
      riskBand,
      totalExposure,
      detail,
      computedAt: new Date().toISOString(),
    });

    this._appendAudit(tenantId, 'contract_scored', { contractId, totalRiskScore, riskBand, totalExposure });
    this.learn({ contractId, clauses: clauses.length }, { success: true, totalRiskScore, totalExposure }, { id: 'reefer-risk-score' });
    return score;
  }

  extractObligations(tenantId, contractId, text) {
    const tenant = this._tenant(tenantId);
    const lower = text.toLowerCase();
    const obligations = [];

    const obligationPatterns = [
      { kind: 'notice_window', re: /(\d{1,3})\s+days?\s+(?:written\s+)?notice/i },
      { kind: 'renewal', re: /auto[-\s]?renew|renewal/i },
      { kind: 'audit_period', re: /audit(?:ed)?\s+(?:period|window)?\s*(\d{1,3})?\s*days?/i },
      { kind: 'payment_due', re: /pay(?:ment)?\s+within\s+(\d{1,3})\s+days?/i },
      { kind: 'temperature_requirement', re: /(maintain|hold|keep)\s+.*\b(?:°f|°c|fahrenheit|celsius)\b/i },
    ];

    for (const p of obligationPatterns) {
      const match = text.match(p.re);
      if (!match) continue;
      obligations.push({
        id: safeId('obg'),
        contractId,
        kind: p.kind,
        value: match[1] ? Number(match[1]) : true,
        excerpt: match[0],
      });
    }

    findDates(text).forEach((d) => {
      obligations.push({
        id: safeId('obg'),
        contractId,
        kind: 'date_deadline',
        value: d,
        excerpt: d,
      });
    });

    if (lower.includes('temperature') && !obligations.some((o) => o.kind === 'temperature_requirement')) {
      obligations.push({
        id: safeId('obg'),
        contractId,
        kind: 'temperature_requirement',
        value: 'review_required',
        excerpt: 'Temperature reference detected',
      });
    }

    obligations.forEach((o) => tenant.obligations.set(o.id, Object.freeze({ ...o, createdAt: new Date().toISOString() })));
    this._appendAudit(tenantId, 'obligations_extracted', { contractId, count: obligations.length });
    return obligations;
  }

  createRedlineRecommendationWorkflow({ tenantId, userId, contractId, clauses = [], risk }) {
    this._authorize(tenantId, userId, 'legal');
    const tenant = this._tenant(tenantId);
    const workflowId = safeId('redline');
    const highRisk = clauses.filter((c) => ['critical', 'high'].includes(c.severity));

    const recommendations = highRisk.map((c) => ({
      recommendationId: safeId('rec'),
      clauseId: c.id,
      category: c.category,
      action: 'revise_clause',
      suggestedText: this._suggestRedline(c.category),
      approvalRequired: c.severity === 'critical' || risk.totalRiskScore >= 70,
      status: 'pending',
    }));

    const workflow = Object.freeze({
      workflowId,
      contractId,
      createdBy: userId,
      status: recommendations.some((r) => r.approvalRequired) ? 'pending_approval' : 'ready_for_issue',
      recommendations,
      approvals: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    tenant.redlines.set(workflowId, workflow);
    this._appendAudit(tenantId, 'redline_workflow_created', { workflowId, contractId, recommendations: recommendations.length });
    return workflow;
  }

  approveRedlineRecommendation({ tenantId, userId, workflowId, recommendationId, approved, notes = '' }) {
    this._authorize(tenantId, userId, 'approve');
    const tenant = this._tenant(tenantId);
    const workflow = tenant.redlines.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    const nextRecommendations = workflow.recommendations.map((r) => {
      if (r.recommendationId !== recommendationId) return r;
      return {
        ...r,
        status: approved ? 'approved' : 'rejected',
        decisionAt: new Date().toISOString(),
      };
    });

    const approvals = [
      ...workflow.approvals,
      { recommendationId, approved: !!approved, approvedBy: userId, notes, ts: new Date().toISOString() },
    ];

    const remaining = nextRecommendations.some((r) => r.approvalRequired && r.status === 'pending');
    const updated = Object.freeze({
      ...workflow,
      recommendations: nextRecommendations,
      approvals,
      status: remaining ? 'pending_approval' : 'approved',
      updatedAt: new Date().toISOString(),
    });

    tenant.redlines.set(workflowId, updated);
    this._appendAudit(tenantId, 'redline_recommendation_decided', { workflowId, recommendationId, approved: !!approved, userId });
    return updated;
  }

  ingestExternalSignals(tenantId, payload = {}) {
    const tenant = this._tenant(tenantId);
    const signalId = safeId('signal');
    const signal = Object.freeze({
      id: signalId,
      tenantId,
      market: payload.market || null,
      weather: payload.weather || null,
      compliance: payload.compliance || null,
      fuel: payload.fuel || null,
      partnerPerformance: payload.partnerPerformance || null,
      createdAt: new Date().toISOString(),
    });

    if (!this.externalSignals.has(tenantId)) this.externalSignals.set(tenantId, []);
    this.externalSignals.get(tenantId).push(signal);
    this._appendAudit(tenantId, 'external_signal_ingested', { signalId });

    const anomalies = this.detectExternalAnomalies(tenantId, signal);
    if (anomalies.length) {
      this._createIntelligenceEvent(tenantId, {
        type: 'external_signal_anomaly',
        state: 'alert',
        sourceId: signalId,
        anomalies,
      });
    }
    return { signal, anomalies };
  }

  detectExternalAnomalies(tenantId, signal) {
    this._tenant(tenantId);
    const anomalies = [];

    if (signal.market?.laneVolatility >= 0.7) anomalies.push({ kind: 'lane_volatility', severity: 'high' });
    if (signal.weather?.coldChainRisk >= 0.6) anomalies.push({ kind: 'weather_cold_chain_disruption', severity: 'critical' });
    if (signal.compliance?.riskLevel >= 0.6) anomalies.push({ kind: 'regional_compliance_risk', severity: 'high' });
    if (signal.partnerPerformance?.anomalyScore >= 0.6) anomalies.push({ kind: 'partner_performance_anomaly', severity: 'medium' });
    if (signal.fuel?.spikePct >= 8) anomalies.push({ kind: 'fuel_cost_spike', severity: 'medium' });

    return anomalies;
  }

  orchestrateAlerts(tenantId) {
    const tenant = this._tenant(tenantId);
    const events = [...tenant.intelligenceEvents.values()].filter((e) => e.state === 'alert');
    const tasks = [];

    for (const event of events) {
      const severity = event.riskScore >= 85 ? 'critical' : event.riskScore >= 70 ? 'high' : 'medium';
      const requiresApproval = severity === 'critical' || event.type === 'external_signal_anomaly';

      const target = event.type.includes('contract') ? ['legal', 'finance', 'risk'] : ['dispatch', 'maintenance', 'risk'];
      for (const owner of target) {
        tasks.push({
          taskId: safeId('task'),
          eventId: event.id,
          owner,
          status: requiresApproval ? 'awaiting_human_approval' : 'queued',
          severity,
          createdAt: new Date().toISOString(),
        });
      }
    }

    tenant.tasks.push(...tasks);
    this._appendAudit(tenantId, 'alert_orchestration_completed', { tasksCreated: tasks.length, alerts: events.length });
    return tasks;
  }

  recordOutcome(tenantId, outcome = {}) {
    const tenant = this._tenant(tenantId);
    const captured = Object.freeze({
      id: safeId('outcome'),
      accepted: !!outcome.accepted,
      rejected: !!outcome.rejected,
      recoveredRevenue: Number(outcome.recoveredRevenue || 0),
      avoidedPenalties: Number(outcome.avoidedPenalties || 0),
      contractReviewMinutes: Number(outcome.contractReviewMinutes || 0),
      source: outcome.source || 'manual',
      ts: new Date().toISOString(),
    });
    tenant.outcomes.push(captured);
    this._appendAudit(tenantId, 'outcome_recorded', captured);
    this.recalibrateFromOutcomes(tenantId);
    return captured;
  }

  recalibrateFromOutcomes(tenantId) {
    const tenant = this._tenant(tenantId);
    if (!tenant.outcomes.length) return { recalibrated: false, reason: 'no_outcomes' };

    const acceptedRate = tenant.outcomes.filter((o) => o.accepted).length / tenant.outcomes.length;
    const recovery = tenant.outcomes.reduce((sum, o) => sum + o.recoveredRevenue + o.avoidedPenalties, 0);

    const goal = this.goals.get('reefer-contract-risk-reduction');
    if (goal) {
      goal.progress = Math.min(1, goal.progress + acceptedRate * PHI_INV * 0.1);
    }

    this.learn(
      { tenantId, outcomes: tenant.outcomes.length },
      { success: true, acceptedRate, recovery },
      { id: 'outcome-recalibration' },
    );

    return { recalibrated: true, acceptedRate, recovery };
  }

  updateAcceptanceMetrics(tenantId, metrics = {}) {
    this._tenant(tenantId);
    const normalized = {
      contractReviewTimeReduction: Number(metrics.contractReviewTimeReduction || 0),
      claimsPenaltyReduction: Number(metrics.claimsPenaltyReduction || 0),
      marginLiftReeferLanes: Number(metrics.marginLiftReeferLanes || 0),
      slaComplianceImprovement: Number(metrics.slaComplianceImprovement || 0),
      alertPrecisionAndCompletionRate: Number(metrics.alertPrecisionAndCompletionRate || 0),
      updatedAt: new Date().toISOString(),
    };
    this.metrics.set(tenantId, normalized);
    this._appendAudit(tenantId, 'acceptance_metrics_updated', normalized);
    return normalized;
  }

  getInternalDashboards(tenantId) {
    const tenant = this._tenant(tenantId);
    const contracts = [...tenant.entities.contracts.values()];
    const obligations = [...tenant.obligations.values()];
    const claims = [...tenant.entities.claims.values()];
    const tempEvents = [...tenant.entities.temperatureEvents.values()];
    const shipments = [...tenant.entities.shipments.values()];

    const legalHeatmap = [...tenant.entities.clauses.values()].reduce((acc, clause) => {
      acc[clause.category] = (acc[clause.category] || 0) + 1;
      return acc;
    }, {});

    const operational = {
      loadStatus: {
        totalShipments: shipments.length,
        delayed: shipments.filter((s) => s.status === 'delayed').length,
        onTimePct: shipments.length ? Number((((shipments.length - shipments.filter((s) => s.status === 'delayed').length) / shipments.length) * 100).toFixed(2)) : 100,
      },
      temperatureExcursions: tempEvents.filter((e) => e.excursion === true).length,
      routeExceptions: shipments.filter((s) => s.routeException).length,
    };

    const legal = {
      clauseRiskHeatmap: legalHeatmap,
      pendingObligations: obligations.filter((o) => o.kind !== 'date_deadline').length,
      renewalCalendar: contracts.filter((c) => c.renewalDate).map((c) => ({ contractId: c.id, renewalDate: c.renewalDate })),
    };

    const finance = {
      marginByLane: this._marginByLane(shipments),
      claimLeakage: claims.reduce((sum, c) => sum + Number(c.amount || 0), 0),
      penaltyExposure: claims.filter((c) => c.type === 'penalty').reduce((sum, c) => sum + Number(c.amount || 0), 0),
    };

    const executive = {
      enterpriseRiskPosture: this._riskPosture(tenantId),
      topActionQueue: tenant.tasks
        .filter((t) => ['awaiting_human_approval', 'queued'].includes(t.status))
        .slice(0, 10),
    };

    return { operations: operational, legalContract: legal, finance, executive };
  }

  getExternalDashboard(tenantId) {
    const signals = this.externalSignals.get(tenantId) || [];
    const latest = signals[signals.length - 1] || null;
    return {
      signalCount: signals.length,
      latest,
      currentAnomalies: latest ? this.detectExternalAnomalies(tenantId, latest) : [],
    };
  }

  getPhaseStatus() {
    return deepClone(this.phaseStatus);
  }

  markPhaseCapability(phaseKey, capability, completed = true) {
    const phase = this.phaseStatus[phaseKey];
    if (!phase) throw new Error(`Unknown phase: ${phaseKey}`);
    if (!phase.completed) phase.completed = {};
    phase.completed[capability] = !!completed;
    return this.getPhaseStatus();
  }

  enforceRetention(tenantId, now = Date.now()) {
    const tenant = this._tenant(tenantId);
    const cutoff = now - tenant.retentionDays * 86400000;

    tenant.tasks = tenant.tasks.filter((t) => Date.parse(t.createdAt || t.ts || now) >= cutoff);
    tenant.outcomes = tenant.outcomes.filter((o) => Date.parse(o.ts || now) >= cutoff);
    tenant.auditLog = tenant.auditLog.filter((a) => Date.parse(a.ts || now) >= cutoff);

    this._appendAudit(tenantId, 'retention_enforced', { retentionDays: tenant.retentionDays });
    return {
      tasks: tenant.tasks.length,
      outcomes: tenant.outcomes.length,
      auditLog: tenant.auditLog.length,
    };
  }

  _runAIAugmentations(contractText) {
    const result = {
      paralegal: null,
      analyst: null,
      logistex: null,
      integration: null,
    };

    if (this.adapters.paralegal?.analyze) {
      try { result.paralegal = this.adapters.paralegal.analyze(contractText); } catch { result.paralegal = { error: 'paralegal_analyze_failed' }; }
    }
    if (this.adapters.analyst?.brief) {
      try { result.analyst = this.adapters.analyst.brief(contractText); } catch { result.analyst = { error: 'analyst_brief_failed' }; }
    }
    if (this.adapters.logistex?.status) {
      try { result.logistex = this.adapters.logistex.status(); } catch { result.logistex = { error: 'logistex_status_failed' }; }
    }
    if (this.adapters.integration?.healthCheck) {
      try { result.integration = this.adapters.integration.healthCheck(); } catch { result.integration = { error: 'integration_health_failed' }; }
    }

    return result;
  }

  _normalizeContent(sourceType, content) {
    if (sourceType === 'email') {
      return content.replace(/^from:.*$/gim, '').replace(/^to:.*$/gim, '').trim();
    }
    if (sourceType === 'pdf') {
      return content.replace(/\s{2,}/g, ' ').trim();
    }
    return content.trim();
  }

  _suggestRedline(category) {
    const suggestions = {
      temperature_liability: 'Carrier liability for temperature excursions is limited to verified negligence and capped at agreed cargo value.',
      detention: 'Detention charges apply only after a mutually agreed free-time threshold and documented arrival/departure timestamps.',
      penalties: 'Penalty clauses require objective service-level proof and cure period before assessment.',
      claims: 'Claims must be submitted within a defined window with supporting evidence and mitigation obligations by both parties.',
      rates: 'Rate revisions require 30-day written notice and documented market-index basis.',
      insurance: 'Insurance requirements align to commercially reasonable coverage levels and do not impose duplicative obligations.',
      jurisdiction: 'Disputes resolve through mutually agreed arbitration venue with good-faith escalation first.',
    };
    return suggestions[category] || 'Revise this clause to balance risk allocation and measurable obligations for both parties.';
  }

  _marginByLane(shipments = []) {
    const laneStats = {};
    for (const s of shipments) {
      const lane = s.laneId || 'unknown';
      if (!laneStats[lane]) laneStats[lane] = { revenue: 0, cost: 0 };
      laneStats[lane].revenue += Number(s.revenue || 0);
      laneStats[lane].cost += Number(s.cost || 0);
    }
    return Object.fromEntries(Object.entries(laneStats).map(([lane, v]) => {
      const margin = v.revenue - v.cost;
      return [lane, { ...v, margin, marginPct: v.revenue ? Number(((margin / v.revenue) * 100).toFixed(2)) : 0 }];
    }));
  }

  _riskPosture(tenantId) {
    const tenant = this._tenant(tenantId);
    const events = [...tenant.intelligenceEvents.values()];
    const high = events.filter((e) => e.state === 'alert').length;
    const resolved = events.filter((e) => e.state === 'resolve').length;
    const ratio = events.length ? high / events.length : 0;
    const band = ratio >= 0.5 ? 'high' : ratio >= 0.25 ? 'medium' : 'low';
    return { band, alerts: high, resolved, totalEvents: events.length };
  }

  _createIntelligenceEvent(tenantId, payload = {}) {
    const tenant = this._tenant(tenantId);
    const event = Object.freeze({
      id: safeId('evt'),
      tenantId,
      state: payload.state || 'ingest',
      type: payload.type || 'unknown',
      riskScore: Number(payload.riskScore || 0),
      contractId: payload.contractId || null,
      sourceId: payload.sourceId || null,
      anomalies: payload.anomalies || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    tenant.intelligenceEvents.set(event.id, event);
    this._appendAudit(tenantId, 'intelligence_event_created', { eventId: event.id, type: event.type, state: event.state });
    return event;
  }

  _appendAudit(tenantId, action, payload = {}) {
    const tenant = this._tenant(tenantId);
    tenant.auditLog.push(Object.freeze({
      id: safeId('audit'),
      tenantId,
      action,
      payload,
      ts: new Date().toISOString(),
    }));
  }

  _appendProvenance(tenantId, action, payload = {}) {
    const tenant = this._tenant(tenantId);
    tenant.provenance.push(Object.freeze({
      id: safeId('prov'),
      tenantId,
      action,
      payload,
      immutable: true,
      ts: new Date().toISOString(),
    }));
  }

  _tenant(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error(`Tenant not initialized: ${tenantId}`);
    return tenant;
  }
}

export function birthReeferContractIntelligence(config = {}) {
  return new ReeferContractIntelligence(config);
}

export default ReeferContractIntelligence;
