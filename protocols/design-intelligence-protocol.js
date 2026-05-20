/**
 * PROTO-020: Design Intelligence Protocol (DIP)  (Medina)
 *
 * Intelligence layer for commercial space design project lifecycle management.
 *
 * Manages the full AIA design lifecycle through 6 phases: Programming →
 * Schematic Design → Design Development → Construction Documents →
 * Construction Administration → Occupancy. Tracks budget variance, schedule
 * slippage, client NPS, FF&E spec compliance, and LEED/WELL milestones.
 * φ-weighted health scoring surfaces client-risk flags before they become
 * relationship issues. Phase gate scoring enforces quality before advancing.
 *
 * Engines wired: DesignIntelligenceEngine + PhaseGateScorer + ClientRiskMonitor
 * Ring: Intelligence Ring
 * Wire: intelligence-wire/dip
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const PHASES = ['PROGRAMMING', 'SCHEMATIC_DESIGN', 'DESIGN_DEVELOPMENT', 'CONSTRUCTION_DOCUMENTS', 'CONSTRUCTION_ADMIN', 'OCCUPANCY'];

// φ-weights for health score components
const HEALTH_WEIGHTS = {
  budgetAdherence:   PHI * PHI,       // most critical
  scheduleAdherence: PHI,
  clientNPS:         1.0,
  ffeCompliance:     PHI_INV,
  leedProgress:      PHI_INV * PHI_INV,
};
const HEALTH_WEIGHT_SUM = Object.values(HEALTH_WEIGHTS).reduce((a, b) => a + b, 0);

const CLIENT_RISK_THRESHOLD = 0.60;  // health score below this triggers risk flag
const GATE_PASS_THRESHOLD   = 0.72;  // minimum health score to advance phase

// ── Phase Gate Scorer ─────────────────────────────────────────────────────────

class PhaseGateScorer {
  score(metrics) {
    const { budgetAdherence = 1, scheduleAdherence = 1, clientNPS = 10, ffeCompliance = 1, leedProgress = 0 } = metrics;
    const normalised = {
      budgetAdherence:   Math.min(1, budgetAdherence),
      scheduleAdherence: Math.min(1, scheduleAdherence),
      clientNPS:         Math.min(1, clientNPS / 10),
      ffeCompliance:     Math.min(1, ffeCompliance),
      leedProgress:      Math.min(1, leedProgress),
    };
    let weighted = 0;
    for (const [k, w] of Object.entries(HEALTH_WEIGHTS)) {
      weighted += (normalised[k] || 0) * w;
    }
    return Math.round((weighted / HEALTH_WEIGHT_SUM) * 1e4) / 1e4;
  }

  canAdvance(metrics) {
    return this.score(metrics) >= GATE_PASS_THRESHOLD;
  }
}

// ── Client Risk Monitor ────────────────────────────────────────────────────────

class ClientRiskMonitor {
  constructor() {
    this.flags = [];
  }

  evaluate(projectId, phase, healthScore, metrics) {
    const risks = [];
    if (healthScore < CLIENT_RISK_THRESHOLD) risks.push({ type: 'low_health', healthScore });
    if (metrics.clientNPS < 7) risks.push({ type: 'low_nps', nps: metrics.clientNPS });
    if (metrics.budgetAdherence < 0.85) risks.push({ type: 'budget_overrun', adherence: metrics.budgetAdherence });
    if (metrics.scheduleAdherence < 0.80) risks.push({ type: 'schedule_slip', adherence: metrics.scheduleAdherence });
    if (risks.length) {
      const flag = { projectId, phase, healthScore, risks, ts: Date.now() };
      this.flags.push(flag);
      return flag;
    }
    return null;
  }

  recentFlags(n = 10) {
    return this.flags.slice(-n);
  }
}

// ── Design Intelligence Engine ────────────────────────────────────────────────

class DesignIntelligenceEngine {
  constructor(config = {}) {
    this.firmId = config.firmId || 'FIRM-001';
    this.projects = new Map();   // projectId → project record
    this.scorer = new PhaseGateScorer();
    this.riskMonitor = new ClientRiskMonitor();
    this.nextId = 1;
  }

  createProject(clientName, projectName, budgetUsd, targetCompletionMs) {
    const id = `DIP-${String(this.nextId++).padStart(4, '0')}`;
    this.projects.set(id, {
      id, clientName, projectName, budgetUsd, targetCompletionMs,
      currentPhase: 'PROGRAMMING', phaseIndex: 0,
      metrics: { budgetAdherence: 1, scheduleAdherence: 1, clientNPS: 9, ffeCompliance: 1, leedProgress: 0 },
      healthScore: 1, phaseHistory: [], riskFlags: [],
    });
    return id;
  }

  updateMetrics(projectId, metrics) {
    const p = this.projects.get(projectId);
    if (!p) return null;
    Object.assign(p.metrics, metrics);
    p.healthScore = this.scorer.score(p.metrics);
    const flag = this.riskMonitor.evaluate(projectId, p.currentPhase, p.healthScore, p.metrics);
    if (flag) p.riskFlags.push(flag);
    return { projectId, healthScore: p.healthScore, flag };
  }

  advancePhase(projectId) {
    const p = this.projects.get(projectId);
    if (!p) return null;
    if (!this.scorer.canAdvance(p.metrics)) {
      return { ok: false, reason: 'gate_not_passed', healthScore: p.healthScore, required: GATE_PASS_THRESHOLD };
    }
    if (p.phaseIndex >= PHASES.length - 1) {
      return { ok: false, reason: 'already_at_final_phase' };
    }
    p.phaseHistory.push({ phase: p.currentPhase, completedAt: Date.now(), healthScore: p.healthScore });
    p.phaseIndex++;
    p.currentPhase = PHASES[p.phaseIndex];
    return { ok: true, newPhase: p.currentPhase, healthScore: p.healthScore };
  }

  portfolioHealth() {
    const scores = [...this.projects.values()].map(p => p.healthScore);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return Math.round(avg * 1e4) / 1e4;
  }

  run() {
    const projects = [...this.projects.values()].map(p => ({
      id: p.id, clientName: p.clientName, currentPhase: p.currentPhase,
      healthScore: p.healthScore, riskFlagCount: p.riskFlags.length,
      canAdvance: this.scorer.canAdvance(p.metrics),
    }));
    return {
      protocol: 'PROTO-020',
      firmId: this.firmId,
      projectCount: this.projects.size,
      portfolioHealth: this.portfolioHealth(),
      atRisk: projects.filter(p => p.healthScore < CLIENT_RISK_THRESHOLD).length,
      recentRiskFlags: this.riskMonitor.recentFlags(5),
      projects,
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createDesignIntelligenceProtocol(config = {}) {
  return new DesignIntelligenceEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  PHASES,
  HEALTH_WEIGHTS,
  CLIENT_RISK_THRESHOLD,
  GATE_PASS_THRESHOLD,
  PhaseGateScorer,
  ClientRiskMonitor,
  DesignIntelligenceEngine,
  createDesignIntelligenceProtocol,
};
