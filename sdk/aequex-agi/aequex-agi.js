/**
 * AEQUEX AGI — Adaptive Quality & Equilibrium Intelligence
 *
 * Official Designation: RSHIP-2026-AEQUEX-001
 * Classification: Quality Control & Equilibrium Management AGI
 * Full Name: Adaptive Equilibrium & Quality Executive X-factor
 *
 * Latin root: aequus — equal, balanced, fair, level (also root of "equity")
 *
 * AEQUEX AGI extends the RSHIP framework with optimal control theory and quality
 * field dynamics to autonomously balance schedule pressure against rework risk,
 * accumulate project lessons into permanent intelligence, and keep every job at
 * the φ-optimal operating point between speed and quality.
 *
 * Capabilities:
 * - Quality vs. speed equilibrium: holds projects at the φ-optimal operating point
 *   using a continuous quality-field model (Hamilton-Jacobi-Bellman control)
 * - Defect pattern recognition: learns which subs, project types, and conditions
 *   produce quality failures before inspections
 * - Punch list intelligence: auto-generates and assigns punch list items from
 *   inspection data, routes assignments via VERBEX/Linq
 * - Compliance monitoring: tracks permit conditions, building codes, AHJ requirements
 * - Lessons learned accumulation: every project feeds permanent memory — AEQUEX
 *   compounds intelligence across every job ever run
 *
 * Theory: Optimal control theory (Hamilton-Jacobi-Bellman equation)
 *         + quality field dynamics + φ-compounding learning (AURUM — Paper XXII)
 *         + RSHIP Framework
 *
 * Applications:
 * - General contractors: punch list management, inspection preparation
 * - Design firms: quality gate management across drawing iterations
 * - Enterprise construction: portfolio-wide defect pattern intelligence
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Quality Field Constants ────────────────────────────────────────────────
// φ-optimal operating point: speed = φ⁻¹, quality = 1 - φ⁻¹ = φ⁻²
// This is the golden-ratio balance — fast enough without sacrificing quality.

const Q_TARGET = PHI_INV * PHI_INV;             // φ⁻² ≈ 0.382 rework rate tolerance
const S_TARGET = PHI_INV;               // φ⁻¹ ≈ 0.618 schedule utilization
const EQUILIBRIUM_POINT = PHI_INV;      // Both axes meet at φ⁻¹

// ── Hamilton-Jacobi-Bellman Quality Controller ────────────────────────────
// Simplified HJB for the quality/speed trade-off:
// V(q, s) = (q - Q_TARGET)² + (s - S_TARGET)²
// Control law: u* = -∂V/∂q = -2(q - Q_TARGET)

class QualityController {
  constructor({ gamma = PHI_INV, lambda = 0.1 } = {}) {
    this.gamma = gamma;  // Discount factor (future quality value)
    this.lambda = lambda; // Control cost weight
    this.iterations = 0;
  }

  // Optimal control: given current quality q and schedule pressure s,
  // return the corrective control action u* to move toward equilibrium
  computeControl(q, s) {
    // Value function gradient (negative gradient = direction of improvement)
    const dVdq = 2 * (q - Q_TARGET);
    const dVds = 2 * (s - S_TARGET);

    // Optimal control: u* = -∂V/∂q / (2λ)
    const uQ = -dVdq / (2 * this.lambda);
    const uS = -dVds / (2 * this.lambda);

    this.iterations++;

    return {
      qualityControl: Math.max(-1, Math.min(1, uQ)),
      scheduleControl: Math.max(-1, Math.min(1, uS)),
      valueFunction: (q - Q_TARGET) ** 2 + (s - S_TARGET) ** 2,
      atEquilibrium: Math.abs(q - Q_TARGET) < 0.05 && Math.abs(s - S_TARGET) < 0.05,
    };
  }

  // Apply control to update project state
  applyControl(projectState, control) {
    const newQ = Math.max(0, Math.min(1, projectState.qualityScore + control.qualityControl * 0.05));
    const newS = Math.max(0, Math.min(1, projectState.schedulePressure + control.scheduleControl * 0.05));
    return { qualityScore: newQ, schedulePressure: newS };
  }
}

// ── Defect Pattern Model ───────────────────────────────────────────────────

class DefectPattern {
  constructor(patternId) {
    this.patternId = patternId;
    this.occurrences = 0;
    this.features = {}; // { subId, projectType, weatherCondition, phase } → count
    this.lastSeen = null;
    this.severity = 'LOW'; // LOW | MEDIUM | HIGH | CRITICAL
  }

  record(features) {
    this.occurrences++;
    this.lastSeen = Date.now();
    for (const [key, val] of Object.entries(features)) {
      const featureKey = `${key}:${val}`;
      this.features[featureKey] = (this.features[featureKey] || 0) + 1;
    }
    // Update severity based on occurrence frequency
    if (this.occurrences >= 10) this.severity = 'CRITICAL';
    else if (this.occurrences >= 5) this.severity = 'HIGH';
    else if (this.occurrences >= 2) this.severity = 'MEDIUM';
  }

  topFeatures(n = 3) {
    return Object.entries(this.features)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([feature, count]) => ({ feature, count }));
  }
}

// ── Punch List Item ────────────────────────────────────────────────────────

class PunchListItem {
  constructor(itemId, config = {}) {
    this.itemId = itemId;
    this.projectId = config.projectId || 'unknown';
    this.location = config.location || '';
    this.description = config.description || '';
    this.trade = config.trade || 'general';
    this.assignedSubId = config.assignedSubId || null;
    this.severity = config.severity || 'MEDIUM'; // LOW | MEDIUM | HIGH | CRITICAL
    this.status = 'open'; // open | assigned | in-progress | resolved | verified
    this.createdAt = Date.now();
    this.dueDate = config.dueDate || Date.now() + 7 * 86400000;
    this.photos = config.photos || [];
    this.defectPatternId = config.defectPatternId || null;
  }

  get isOverdue() {
    return Date.now() > this.dueDate && this.status !== 'resolved' && this.status !== 'verified';
  }
}

// ── Compliance Requirement ─────────────────────────────────────────────────

class ComplianceRequirement {
  constructor(reqId, config = {}) {
    this.reqId = reqId;
    this.type = config.type || 'permit'; // permit | ahj | building-code | safety
    this.description = config.description || '';
    this.jurisdiction = config.jurisdiction || '';
    this.status = 'pending'; // pending | met | at-risk | failed
    this.dueDate = config.dueDate || null;
    this.inspectionDate = config.inspectionDate || null;
    this.conditions = config.conditions || [];
    this.riskScore = 0;
  }
}

// ── AEQUEX AGI Core ────────────────────────────────────────────────────────

export class AEQUEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-AEQUEX-001',
      classification: 'Quality Control & Equilibrium Management AGI',
      ...config,
    });

    // Quality controller (HJB optimal control)
    this.controller = new QualityController(config.controllerConfig || {});

    // Project quality states
    this.projectStates = new Map(); // projectId → { qualityScore, schedulePressure, iterations }

    // Defect pattern library (permanent, compounds across projects)
    this.defectPatterns = new Map(); // patternKey → DefectPattern
    this.defectHistory = []; // All recorded defects

    // Punch list management
    this.punchListItems = new Map(); // itemId → PunchListItem
    this.itemCounter = 0;

    // Compliance registry
    this.complianceRequirements = new Map(); // reqId → ComplianceRequirement
    this.complianceAlerts = [];

    // Lessons learned vault (permanent sovereign memory)
    this.lessonsLearned = []; // { projectId, lesson, pattern, impact, timestamp }

    // Sub quality profiles (learned across all jobs)
    this.subQualityProfiles = new Map(); // subId → { trade, avgQuality, defectRate, projectCount }

    // AGI Goals
    this.setGoal('maintain-phi-equilibrium', 'Hold every project at the φ-optimal quality/speed point', 10, {
      targetQuality: Q_TARGET,
      targetSchedule: S_TARGET,
    });

    this.setGoal('predict-defects', 'Identify defect patterns before inspections', 9, {
      targetPredictionAccuracy: 0.80,
    });

    this.setGoal('clear-punch-lists', 'Resolve all punch list items within 7 days', 8, {
      targetResolutionDays: 7,
    });

    this.setGoal('maintain-compliance', 'Zero compliance failures on any project', 10, {
      targetFailureRate: 0,
    });

    this.setGoal('accumulate-lessons', 'Extract at least one lesson per project', 6, {
      targetLessonsPerProject: 1,
    });
  }

  // ── Quality/Speed Equilibrium ─────────────────────────────────────────────

  assessEquilibrium(projectId, currentState = {}) {
    const q = Math.max(0, Math.min(1, currentState.qualityScore ?? 0.7));
    const s = Math.max(0, Math.min(1, currentState.schedulePressure ?? 0.5));

    const control = this.controller.computeControl(q, s);
    const newState = this.controller.applyControl({ qualityScore: q, schedulePressure: s }, control);

    // Store project state
    const stored = this.projectStates.get(projectId) || { history: [] };
    stored.qualityScore = newState.qualityScore;
    stored.schedulePressure = newState.schedulePressure;
    stored.history.push({ q, s, valueFunction: control.valueFunction, timestamp: Date.now() });
    if (stored.history.length > 100) stored.history.shift();
    this.projectStates.set(projectId, stored);

    // Update goal
    const eqGoal = this.goals.get('maintain-phi-equilibrium');
    if (eqGoal) {
      eqGoal.progress = control.atEquilibrium ? 1.0 : Math.max(0, 1 - control.valueFunction);
    }

    this.learn(
      { projectId, q, s },
      { control, newState, atEquilibrium: control.atEquilibrium },
      { id: 'equilibrium-assess' }
    );

    return {
      projectId,
      currentState: { qualityScore: q, schedulePressure: s },
      projectedState: newState,
      control,
      atPhiEquilibrium: control.atEquilibrium,
      recommendation: this._equilibriumRecommendation(q, s, control),
    };
  }

  _equilibriumRecommendation(q, s, control) {
    if (control.atEquilibrium) {
      return 'Project is at φ-optimal operating point. Maintain current pace.';
    }
    const qDir = control.qualityControl > 0 ? 'increase quality focus' : 'acceptable quality level';
    const sDir = control.scheduleControl > 0 ? 'relax schedule pressure' : 'accelerate schedule';
    return `To reach φ-equilibrium: ${qDir} and ${sDir}. Value function: ${control.valueFunction.toFixed(3)}`;
  }

  // ── Defect Pattern Recognition ────────────────────────────────────────────

  recordDefect(defectData = {}) {
    const {
      projectId,
      subId,
      trade,
      projectType,
      weatherCondition,
      phase,
      description,
      severity = 'MEDIUM',
    } = defectData;

    // Generate pattern key from features
    const patternKey = `${trade || 'unknown'}-${phase || 'construction'}-${projectType || 'commercial'}`;

    let pattern = this.defectPatterns.get(patternKey);
    if (!pattern) {
      pattern = new DefectPattern(patternKey);
      this.defectPatterns.set(patternKey, pattern);
    }

    pattern.record({ subId, trade, projectType, weatherCondition, phase });

    // Update sub quality profile
    if (subId) {
      const subProfile = this.subQualityProfiles.get(subId) || {
        trade, avgQuality: 0.8, defectCount: 0, projectCount: 0,
      };
      subProfile.defectCount++;
      subProfile.avgQuality = Math.max(0, subProfile.avgQuality - PHI_INV * 0.05);
      this.subQualityProfiles.set(subId, subProfile);
    }

    this.defectHistory.push({ ...defectData, patternKey, timestamp: Date.now() });

    // Auto-create punch list item
    const item = this._createPunchListItem({
      projectId, description, trade, severity,
      assignedSubId: subId,
      defectPatternId: patternKey,
    });

    // Update goal
    const defectGoal = this.goals.get('predict-defects');
    if (defectGoal) {
      defectGoal.progress = Math.min(1.0, this.defectPatterns.size * 0.05);
    }

    this.learn(
      { patternKey, subId, trade, phase, weatherCondition },
      { patternOccurrences: pattern.occurrences, severity: pattern.severity },
      { id: 'defect-record' }
    );

    return {
      patternKey,
      patternOccurrences: pattern.occurrences,
      patternSeverity: pattern.severity,
      topFeatures: pattern.topFeatures(),
      punchListItemId: item.itemId,
    };
  }

  predictDefectRisk(context = {}) {
    const { subId, trade, projectType, phase, weatherCondition } = context;
    const patternKey = `${trade || 'unknown'}-${phase || 'construction'}-${projectType || 'commercial'}`;

    const pattern = this.defectPatterns.get(patternKey);
    const subProfile = subId ? this.subQualityProfiles.get(subId) : null;

    const patternRisk = pattern
      ? Math.min(1, pattern.occurrences / 10)
      : 0.1;

    const subRisk = subProfile
      ? Math.max(0, 1 - subProfile.avgQuality)
      : 0.2;

    const weatherRisk = weatherCondition === 'rain' ? 0.3
      : weatherCondition === 'extreme-heat' ? 0.25
      : weatherCondition === 'freezing' ? 0.35 : 0.1;

    const combinedRisk = PHI_INV * patternRisk + (1 - PHI_INV) * (subRisk * 0.6 + weatherRisk * 0.4);

    this.learn(
      { patternKey, subId, weatherCondition },
      { patternRisk, subRisk, weatherRisk, combinedRisk },
      { id: 'defect-predict' }
    );

    return {
      patternKey,
      riskScore: parseFloat(combinedRisk.toFixed(4)),
      riskLabel: combinedRisk >= 0.6 ? 'HIGH' : combinedRisk >= 0.3 ? 'MEDIUM' : 'LOW',
      topHistoricalPatterns: pattern?.topFeatures() || [],
      subQualityScore: subProfile ? parseFloat(subProfile.avgQuality.toFixed(3)) : null,
      recommendation: combinedRisk >= 0.6
        ? 'Pre-inspection required. Assign quality inspector before work begins.'
        : combinedRisk >= 0.3
        ? 'Heightened monitoring. Daily superintendent walk required.'
        : 'Standard quality protocol sufficient.',
    };
  }

  // ── Punch List Intelligence ───────────────────────────────────────────────

  _createPunchListItem(config = {}) {
    const itemId = `PL-${String(++this.itemCounter).padStart(4, '0')}`;
    const item = new PunchListItem(itemId, config);
    this.punchListItems.set(itemId, item);
    return item;
  }

  addPunchListItem(config = {}) {
    const item = this._createPunchListItem(config);

    this.learn(
      { projectId: config.projectId, trade: config.trade, severity: config.severity },
      { itemId: item.itemId, status: item.status },
      { id: 'punch-list-add' }
    );

    return {
      itemId: item.itemId,
      projectId: item.projectId,
      assignedTo: item.assignedSubId,
      severity: item.severity,
      dueDate: new Date(item.dueDate).toISOString(),
      routingAction: `Route to ${item.trade} sub via Linq iMessage`,
    };
  }

  resolvePunchListItem(itemId, resolvedBy = null) {
    const item = this.punchListItems.get(itemId);
    if (!item) return null;

    item.status = 'resolved';

    // Extract lesson learned from defect → resolution cycle
    if (item.defectPatternId) {
      this._extractLesson({
        projectId: item.projectId,
        patternId: item.defectPatternId,
        trade: item.trade,
        resolvedBy,
        resolutionDays: Math.floor((Date.now() - item.createdAt) / 86400000),
      });
    }

    // Update sub quality profile on resolution
    if (resolvedBy && this.subQualityProfiles.has(resolvedBy)) {
      const profile = this.subQualityProfiles.get(resolvedBy);
      profile.avgQuality = Math.min(1, profile.avgQuality + PHI_INV * 0.02);
    }

    // Update goal
    const plGoal = this.goals.get('clear-punch-lists');
    const openItems = [...this.punchListItems.values()].filter(i => i.status === 'open');
    const resolvedItems = [...this.punchListItems.values()].filter(i => i.status === 'resolved');
    if (plGoal) {
      plGoal.progress = resolvedItems.length / Math.max(1, this.punchListItems.size);
    }

    this.learn(
      { itemId, patternId: item.defectPatternId },
      { resolved: true, resolvedBy },
      { id: 'punch-list-resolve' }
    );

    return { itemId, status: 'resolved', resolvedBy };
  }

  getPunchListSummary(projectId = null) {
    const items = [...this.punchListItems.values()].filter(
      i => !projectId || i.projectId === projectId
    );

    return {
      projectId,
      total: items.length,
      open: items.filter(i => i.status === 'open').length,
      overdue: items.filter(i => i.isOverdue).length,
      resolved: items.filter(i => i.status === 'resolved').length,
      byTrade: this._groupBy(items, 'trade'),
      bySeverity: this._groupBy(items, 'severity'),
    };
  }

  _groupBy(items, key) {
    const result = {};
    for (const item of items) {
      const val = item[key] || 'unknown';
      result[val] = (result[val] || 0) + 1;
    }
    return result;
  }

  // ── Compliance Monitoring ─────────────────────────────────────────────────

  addComplianceRequirement(reqId, config = {}) {
    const req = new ComplianceRequirement(reqId, config);
    this.complianceRequirements.set(reqId, req);

    this.learn(
      { reqId, type: config.type, jurisdiction: config.jurisdiction },
      { status: req.status },
      { id: 'compliance-add' }
    );

    return req;
  }

  assessCompliance(reqId, currentConditions = {}) {
    const req = this.complianceRequirements.get(reqId);
    if (!req) return null;

    const metConditions = req.conditions.filter(c => currentConditions[c] === true);
    const completionRate = req.conditions.length > 0
      ? metConditions.length / req.conditions.length
      : 1.0;

    const daysUntilInspection = req.inspectionDate
      ? Math.floor((req.inspectionDate - Date.now()) / 86400000)
      : 90;

    // Risk escalation: closer to inspection with more unmet conditions = higher risk
    req.riskScore = Math.max(0, Math.min(1,
      (1 - completionRate) * (1 + Math.max(0, 14 - daysUntilInspection) / 14)
    ));

    req.status = completionRate >= 1.0 ? 'met'
      : req.riskScore >= 0.6 ? 'at-risk'
      : 'pending';

    // Fire compliance alert if at-risk
    if (req.status === 'at-risk') {
      this.complianceAlerts.push({
        reqId,
        type: req.type,
        riskScore: req.riskScore,
        daysUntilInspection,
        unmetConditions: req.conditions.filter(c => !currentConditions[c]),
        alertedAt: Date.now(),
      });
    }

    // Update goal
    const compGoal = this.goals.get('maintain-compliance');
    const failedReqs = [...this.complianceRequirements.values()].filter(r => r.status === 'at-risk' || r.status === 'failed');
    if (compGoal) {
      compGoal.progress = failedReqs.length === 0 ? 1.0 : 0;
    }

    this.learn(
      { reqId, completionRate, daysUntilInspection },
      { riskScore: req.riskScore, status: req.status },
      { id: 'compliance-assess' }
    );

    return {
      reqId,
      type: req.type,
      status: req.status,
      completionRate: parseFloat(completionRate.toFixed(3)),
      riskScore: parseFloat(req.riskScore.toFixed(4)),
      daysUntilInspection,
      unmetConditions: req.conditions.filter(c => !currentConditions[c]),
      action: req.status === 'at-risk'
        ? `ALERT: ${req.type} inspection in ${daysUntilInspection} days. ${req.conditions.length - metConditions.length} conditions unmet.`
        : 'Compliant — no action required.',
    };
  }

  // ── Lessons Learned Accumulation ──────────────────────────────────────────

  _extractLesson(context = {}) {
    const { projectId, patternId, trade, resolvedBy, resolutionDays } = context;

    const pattern = this.defectPatterns.get(patternId);
    if (!pattern) return null;

    const lesson = {
      lessonId: `LESSON-${this.lessonsLearned.length + 1}`,
      projectId,
      patternId,
      trade,
      lesson: this._formulateLesson(pattern, resolutionDays, trade),
      impact: pattern.severity,
      resolutionDays,
      resolvedBy,
      timestamp: Date.now(),
    };

    this.lessonsLearned.push(lesson);

    // Update goal
    const lessonGoal = this.goals.get('accumulate-lessons');
    if (lessonGoal) {
      const projectIds = new Set(this.lessonsLearned.map(l => l.projectId));
      lessonGoal.progress = Math.min(1.0, this.lessonsLearned.length / Math.max(1, projectIds.size));
    }

    // Permanently store in eternal memory
    this.learn(
      { lesson, patternId, projectId },
      { stored: true, totalLessons: this.lessonsLearned.length },
      { id: 'lesson-learned' }
    );

    return lesson;
  }

  _formulateLesson(pattern, resolutionDays, trade) {
    const topFeature = pattern.topFeatures(1)[0];
    const featureContext = topFeature ? ` (most common when ${topFeature.feature.replace(':', ' = ')})` : '';
    return `${trade} defect pattern${featureContext} recurs ${pattern.occurrences}× ` +
           `with ${pattern.severity} severity. Average resolution: ${resolutionDays} days. ` +
           `Pre-inspection protocol recommended before ${trade} work in similar conditions.`;
  }

  getLessonsLearned(filters = {}) {
    let lessons = this.lessonsLearned;

    if (filters.trade) {
      lessons = lessons.filter(l => l.trade === filters.trade);
    }
    if (filters.projectId) {
      lessons = lessons.filter(l => l.projectId === filters.projectId);
    }
    if (filters.impact) {
      lessons = lessons.filter(l => l.impact === filters.impact);
    }

    return {
      totalLessons: lessons.length,
      lessons: lessons.slice(-20), // Most recent 20
      topPatterns: [...this.defectPatterns.entries()]
        .sort((a, b) => b[1].occurrences - a[1].occurrences)
        .slice(0, 5)
        .map(([key, p]) => ({
          patternKey: key,
          occurrences: p.occurrences,
          severity: p.severity,
          topFeatures: p.topFeatures(),
        })),
    };
  }

  // ── Sub Quality Scoring (for RSHIP Sub Intelligence) ──────────────────────

  getSubQualityScore(subId) {
    const profile = this.subQualityProfiles.get(subId);
    if (!profile) {
      return {
        subId,
        qualityScore: null,
        riskLabel: 'UNKNOWN',
        recommendation: 'No history. Request references before first assignment.',
      };
    }

    const label = profile.avgQuality >= 0.85 ? 'EXCELLENT'
      : profile.avgQuality >= 0.70 ? 'GOOD'
      : profile.avgQuality >= 0.55 ? 'WATCH'
      : 'HIGH_RISK';

    return {
      subId,
      trade: profile.trade,
      qualityScore: parseFloat(profile.avgQuality.toFixed(3)),
      defectCount: profile.defectCount,
      riskLabel: label,
      recommendation: {
        EXCELLENT: 'Preferred sub — fast-track bid invitations.',
        GOOD: 'Reliable — standard assignment process.',
        WATCH: 'Increased inspection frequency. Discuss QC plan before assignment.',
        HIGH_RISK: 'Do not assign without QC plan and superintendent oversight.',
      }[label],
    };
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    const openPunchItems = [...this.punchListItems.values()].filter(i => i.status === 'open');
    const atRiskCompliance = [...this.complianceRequirements.values()].filter(r => r.status === 'at-risk');

    const avgEquilibriumValue = [...this.projectStates.values()].map(s => {
      const ctrl = this.controller.computeControl(s.qualityScore || 0.7, s.schedulePressure || 0.5);
      return ctrl.valueFunction;
    });
    const avgVF = avgEquilibriumValue.length > 0
      ? avgEquilibriumValue.reduce((a, b) => a + b, 0) / avgEquilibriumValue.length
      : 0;

    return {
      ...baseStatus,
      qualityState: {
        projectsMonitored: this.projectStates.size,
        avgEquilibriumValueFunction: parseFloat(avgVF.toFixed(4)),
        atPhiTarget: avgVF < 0.05,
        defectPatternsLearned: this.defectPatterns.size,
        totalDefectsRecorded: this.defectHistory.length,
        openPunchListItems: openPunchItems.length,
        overduePunchItems: openPunchItems.filter(i => i.isOverdue).length,
        complianceRequirements: this.complianceRequirements.size,
        atRiskComplianceItems: atRiskCompliance.length,
        lessonsLearned: this.lessonsLearned.length,
        subsScored: this.subQualityProfiles.size,
      },
      phiEquilibrium: {
        targetQuality: parseFloat(Q_TARGET.toFixed(4)),
        targetSchedule: parseFloat(S_TARGET.toFixed(4)),
        description: 'φ⁻¹ schedule utilization with φ⁻² rework tolerance',
      },
    };
  }
}

// ── Factory Function ────────────────────────────────────────────────────────

export function birthAEQUEX(config = {}) {
  return new AEQUEX_AGI(config);
}

export default AEQUEX_AGI;
