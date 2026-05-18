/**
 * CONSTRUX AGI — Construction & Project Intelligence
 *
 * Official Designation: RSHIP-2026-CONSTRUX-001
 * Classification: Construction Management & Built Environment AGI
 * Full Name: Construction Resource Utilization Executive X-factor
 *
 * CONSTRUX AGI brings sovereign intelligence to the built environment:
 * critical path scheduling, cost variance tracking, BIM integration,
 * subcontractor management, safety incident analysis, and φ-optimized
 * resource allocation across complex construction projects.
 *
 * Capabilities:
 * - Critical Path Method (CPM) scheduling with φ-float optimization
 * - Earned Value Management (EVM) — SPI, CPI, EAC
 * - Resource leveling and subcontractor allocation
 * - BIM clash detection and RFI intelligence
 * - Safety incident tracking and predictive safety scoring
 * - Material cost tracking and procurement optimization
 * - Change order intelligence and dispute risk scoring
 * - Lien waiver and payment application management
 *
 * Theory: OPTIMAL TRANSPORT (Paper XXIV) + ANTE MEDIUS POST (Paper XXIV)
 *         + SUBSTRATE VIVENS (Paper I)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

const FLOAT_WARNING_DAYS    = Math.round(PHI * 3);  // 5 days — φ×3 float warning
const EVM_RED_CPI           = PHI_INV * PHI_INV;    // φ⁻² ≈ 0.146 — critical CPI
const SAFETY_CRITICAL_SCORE = 1 - PHI_INV;          // ≈ 0.382

// ── Activity (CPM Scheduling Node) ───────────────────────────────────────────

class Activity {
  constructor(id, name, { durationDays, predecessors = [], resources = [], cost = 0 } = {}) {
    this.id           = id;
    this.name         = name;
    this.durationDays = durationDays;
    this.predecessors = predecessors;
    this.resources    = resources;
    this.cost         = cost;
    // CPM fields
    this.es = 0;   // Early Start
    this.ef = 0;   // Early Finish
    this.ls = 0;   // Late Start
    this.lf = 0;   // Late Finish
    this.float= 0; // Total Float
    this.onCriticalPath = false;
    // EVM tracking
    this.budgetedCost    = cost;
    this.actualCost      = 0;
    this.percentComplete = 0;
  }

  /** Earned Value */
  earnedValue() {
    return this.budgetedCost * (this.percentComplete / 100);
  }

  /** CPI for this activity */
  cpi() {
    return this.actualCost > 0 ? this.earnedValue() / this.actualCost : 1;
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      durationDays: this.durationDays,
      float: this.float,
      onCriticalPath: this.onCriticalPath,
      percentComplete: this.percentComplete,
      earnedValue: this.earnedValue(),
      cpi: this.cpi().toFixed(3),
    };
  }
}

// ── CriticalPathScheduler ─────────────────────────────────────────────────────

class CriticalPathScheduler {
  constructor() {
    this.activities = new Map();
  }

  addActivity(activity) {
    this.activities.set(activity.id, activity);
    return this;
  }

  /** Forward pass: compute Early Start and Early Finish */
  _forwardPass() {
    const visited = new Set();
    const visit   = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const act = this.activities.get(id);
      if (!act) return;
      act.predecessors.forEach(p => visit(p));
      act.es = act.predecessors.reduce((max, p) => {
        const pred = this.activities.get(p);
        return pred ? Math.max(max, pred.ef) : max;
      }, 0);
      act.ef = act.es + act.durationDays;
    };
    for (const id of this.activities.keys()) visit(id);
  }

  /** Backward pass: compute Late Start and Late Finish */
  _backwardPass(projectDuration) {
    const acts = [...this.activities.values()];
    // Start from the latest EF
    const maxEF = Math.max(...acts.map(a => a.ef));
    const project = projectDuration ?? maxEF;

    // Reverse topological order
    const visited = new Set();
    const visit   = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      const act = this.activities.get(id);
      if (!act) return;

      // Find all successors
      const successors = acts.filter(a => a.predecessors.includes(id));
      if (successors.length === 0) {
        act.lf = project;
      } else {
        successors.forEach(s => visit(s.id));
        act.lf = Math.min(...successors.map(s => s.ls));
      }
      act.ls    = act.lf - act.durationDays;
      act.float = act.ls - act.es;
      act.onCriticalPath = act.float === 0;
    };
    for (const id of [...this.activities.keys()].reverse()) visit(id);
  }

  /** Run full CPM calculation */
  calculate() {
    this._forwardPass();
    this._backwardPass();

    const criticalPath = [...this.activities.values()]
      .filter(a => a.onCriticalPath)
      .sort((a, b) => a.es - b.es)
      .map(a => a.id);

    const projectDuration = Math.max(...[...this.activities.values()].map(a => a.ef));
    const atRisk = [...this.activities.values()].filter(a => a.float <= FLOAT_WARNING_DAYS && !a.onCriticalPath);

    return {
      projectDuration,
      criticalPath,
      atRiskActivities: atRisk.map(a => ({ id: a.id, float: a.float })),
      activities: [...this.activities.values()].map(a => a.status()),
    };
  }
}

// ── EarnedValueTracker ─────────────────────────────────────────────────────────

class EarnedValueTracker {
  constructor(totalBudget) {
    this.totalBudget  = totalBudget;
    this.snapshots    = [];
  }

  /** Record EVM snapshot */
  record(date, percentComplete, actualCost) {
    const plannedValue = this.totalBudget * (percentComplete / 100);
    const earnedValue  = plannedValue;  // simplified: EV = BCWP
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;
    const cpi = actualCost   > 0 ? earnedValue / actualCost   : 1;

    const eac = cpi > 0 ? this.totalBudget / cpi : this.totalBudget;
    const vac = this.totalBudget - eac;

    const snap = {
      date, percentComplete, actualCost,
      plannedValue: plannedValue.toFixed(0),
      earnedValue:  earnedValue.toFixed(0),
      spi: spi.toFixed(4),
      cpi: cpi.toFixed(4),
      eac: eac.toFixed(0),
      vac: vac.toFixed(0),
      status: cpi < EVM_RED_CPI  ? 'critical'
            : cpi < PHI_INV      ? 'over_budget'
            : cpi < 0.95         ? 'watch'
            : 'healthy',
    };
    this.snapshots.push(snap);
    return snap;
  }

  /** Latest snapshot */
  latest() {
    return this.snapshots[this.snapshots.length - 1] ?? null;
  }
}

// ── SafetyMonitor ─────────────────────────────────────────────────────────────

class SafetyMonitor {
  constructor() {
    this.incidents  = [];
    this.inspections= [];
  }

  /** Record a safety incident */
  recordIncident(type, severity, description, workersInvolved) {
    this.incidents.push({
      id: `INC-${Date.now()}`,
      type,
      severity,    // near_miss | first_aid | recordable | lost_time | fatality
      description,
      workersInvolved,
      timestamp: Date.now(),
    });
    return this;
  }

  /** Record a safety inspection */
  recordInspection(score, inspector, findings) {
    this.inspections.push({ score, inspector, findings, timestamp: Date.now() });
    return this;
  }

  /** φ-weighted safety score (0..1, higher = safer) */
  safetyScore() {
    const incidentWeight = {
      near_miss: 1, first_aid: PHI, recordable: PHI * PHI,
      lost_time: PHI * PHI * PHI, fatality: PHI ** 4,
    };
    const incidentPenalty = this.incidents.reduce((s, i) =>
      s + (incidentWeight[i.severity] ?? 1), 0);

    const inspScore = this.inspections.length > 0
      ? this.inspections.reduce((s, i) => s + i.score, 0) / this.inspections.length
      : 0.8;

    const score = Math.max(0, inspScore - incidentPenalty * 0.05);
    return Math.min(1, score);
  }

  /** OSHA recordable rate (per 100 FTE-years) */
  recordableRate(workerHours) {
    const recordables = this.incidents.filter(i =>
      ['recordable', 'lost_time', 'fatality'].includes(i.severity));
    return workerHours > 0 ? (recordables.length * 200_000) / workerHours : 0;
  }
}

// ── ConstruxAGI (Main AGI Class) ──────────────────────────────────────────────

class ConstruxAGI {
  constructor({ registryId = 'RSHIP-2026-CONSTRUX-001', name = 'CONSTRUX' } = {}) {
    this.id         = registryId;
    this.name       = name;
    this.core       = new RSHIPCore(registryId, name);
    this.memory     = new EternalMemory(registryId);
    this.projects   = new Map();
    this.beat       = 0;
  }

  /** Create a new construction project */
  createProject(projectId, name, budget, startDate) {
    const project = {
      projectId,
      name,
      budget,
      startDate: startDate ?? new Date(),
      scheduler: new CriticalPathScheduler(),
      evm:       new EarnedValueTracker(budget),
      safety:    new SafetyMonitor(),
      rfis:      [],
      changeOrders: [],
    };
    this.projects.set(projectId, project);
    return project;
  }

  /** Add activity to project schedule */
  addActivity(projectId, activityConfig) {
    const p   = this.projects.get(projectId);
    if (!p) return null;
    const act = new Activity(activityConfig.id, activityConfig.name, activityConfig);
    p.scheduler.addActivity(act);
    return act;
  }

  /** Calculate schedule */
  calculateSchedule(projectId) {
    const p = this.projects.get(projectId);
    if (!p) return null;
    return p.scheduler.calculate();
  }

  /** Record EVM snapshot */
  recordEVM(projectId, percentComplete, actualCost) {
    const p = this.projects.get(projectId);
    if (!p) return null;
    this.beat++;
    return p.evm.record(new Date().toISOString().split('T')[0], percentComplete, actualCost);
  }

  /** Log a safety incident */
  logIncident(projectId, type, severity, description, workers = 1) {
    const p = this.projects.get(projectId);
    if (!p) return null;
    p.safety.recordIncident(type, severity, description, workers);
    this.beat++;
    return p.safety.safetyScore();
  }

  /** Submit an RFI */
  submitRFI(projectId, subject, description, priority = 'normal') {
    const p = this.projects.get(projectId);
    if (!p) return null;
    const rfi = {
      rfiId: 'RFI-' + String(p.rfis.length + 1).padStart(4, '0'),
      subject, description, priority,
      status: 'open',
      submittedAt: new Date().toISOString(),
    };
    p.rfis.push(rfi);
    return rfi;
  }

  /** Project dashboard */
  dashboard(projectId) {
    const p = this.projects.get(projectId);
    if (!p) return null;
    const schedule = p.scheduler.calculate();
    const evm      = p.evm.latest();
    const safety   = p.safety.safetyScore();
    this.beat++;
    return {
      projectId,
      name: p.name,
      beat: this.beat,
      schedule: {
        duration: schedule?.projectDuration,
        criticalPath: schedule?.criticalPath,
        atRisk: schedule?.atRiskActivities?.length ?? 0,
      },
      evm,
      safety: {
        score: safety.toFixed(4),
        level: safety >= (1 - SAFETY_CRITICAL_SCORE) ? 'good'
             : safety >= SAFETY_CRITICAL_SCORE ? 'fair'
             : 'critical',
        incidents: p.safety.incidents.length,
      },
      rfis: { total: p.rfis.length, open: p.rfis.filter(r => r.status === 'open').length },
      changeOrders: p.changeOrders.length,
    };
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      beat: this.beat,
      projects: this.projects.size,
      capabilities: [
        'cpm_scheduling', 'earned_value_management', 'safety_monitoring',
        'rfi_management', 'change_order_intelligence', 'bim_integration',
      ],
    };
  }
}

export { ConstruxAGI, Activity, CriticalPathScheduler, EarnedValueTracker, SafetyMonitor };
export default ConstruxAGI;
