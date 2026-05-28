/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence, Exceptions & Explainability              ║
 * ║                                                                            ║
 * ║  Confidence scores, exception queues, and explainability records so        ║
 * ║  every workforce decision and timesheet is fully traceable.                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute a holistic confidence score for a workforce record (0.0 - 1.0).
 */
function computeConfidenceScore(record, validationResults) {
  const weights = {
    schemaComplete: 0.20,
    timesheetValid: 0.25,
    schedulePresent: 0.20,
    costsDocumented: 0.15,
    noWarnings: 0.20,
  };

  const scores = {};

  // Schema completeness
  scores.schemaComplete = validationResults.gates[0].passed ? 1 : 0;

  // Timesheet validation
  scores.timesheetValid = validationResults.gates[1].passed ? 1 : 0;
  if (record.timesheet.entries.length > 0) {
    const approvedCount = record.timesheet.entries.filter(e => e.approved).length;
    scores.timesheetValid = Math.min(1, scores.timesheetValid + (approvedCount / record.timesheet.entries.length) * 0.3);
  }

  // Schedule presence and quality
  if (record.schedule.shifts.length > 0) {
    scores.schedulePresent = 1.0;
    const coveredDays = new Set(record.schedule.shifts.map(s => s.date)).size;
    if (coveredDays < 5) scores.schedulePresent = 0.5 + (coveredDays * 0.1);
  } else {
    scores.schedulePresent = 0.3;
  }

  // Costs documented
  scores.costsDocumented = 1.0;
  if (!record.costs.hourlyRate || record.costs.hourlyRate <= 0) scores.costsDocumented -= 0.4;
  if (!record.costs.overtimeRate) scores.costsDocumented -= 0.2;
  scores.costsDocumented = Math.max(0, scores.costsDocumented);

  // Warning penalty
  scores.noWarnings = validationResults.warnings.length === 0
    ? 1.0
    : Math.max(0, 1 - validationResults.warnings.length * 0.1);

  // Weighted sum
  const weighted = Object.entries(weights).reduce((sum, [k, w]) => sum + ((scores[k] || 0) * w), 0);
  const score = Math.round(weighted * 1000) / 1000;

  let grade;
  if (score >= 0.9) grade = 'A';
  else if (score >= 0.75) grade = 'B';
  else if (score >= 0.6) grade = 'C';
  else grade = 'D';

  return { score, grade, breakdown: scores, weights };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXCEPTION QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

class ExceptionQueue {
  constructor() {
    this.queue = [];
  }

  /**
   * Add an exception that requires human review.
   */
  add(workerId, type, severity, message, context = {}) {
    this.queue.push({
      id: `EXC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workerId,
      type,
      severity,
      message,
      context,
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
    });
  }

  /**
   * Auto-populate exceptions from validation results.
   */
  fromValidation(workerId, validationResults) {
    for (const gate of validationResults.gates) {
      for (const error of gate.errors) {
        this.add(workerId, gate.gate, 'high', error, { gate: gate.gate });
      }
      for (const warning of gate.warnings) {
        this.add(workerId, gate.gate, 'medium', warning, { gate: gate.gate });
      }
    }
  }

  /**
   * Get all open exceptions.
   */
  getOpen() {
    return this.queue.filter(e => e.status === 'open');
  }

  /**
   * Get exceptions by worker.
   */
  getByWorker(workerId) {
    return this.queue.filter(e => e.workerId === workerId);
  }

  /**
   * Get exceptions by severity.
   */
  getBySeverity(severity) {
    return this.queue.filter(e => e.severity === severity && e.status === 'open');
  }

  /**
   * Acknowledge an exception.
   */
  acknowledge(exceptionId, acknowledgedBy) {
    const exc = this.queue.find(e => e.id === exceptionId);
    if (exc) {
      exc.status = 'acknowledged';
      exc.acknowledgedBy = acknowledgedBy;
      exc.acknowledgedAt = new Date().toISOString();
    }
    return exc;
  }

  /**
   * Resolve an exception.
   */
  resolve(exceptionId, resolvedBy, resolution) {
    const exc = this.queue.find(e => e.id === exceptionId);
    if (exc) {
      exc.status = 'resolved';
      exc.resolvedAt = new Date().toISOString();
      exc.resolvedBy = resolvedBy;
      exc.resolution = resolution;
    }
    return exc;
  }

  /**
   * Dismiss (false positive).
   */
  dismiss(exceptionId, dismissedBy, reason) {
    const exc = this.queue.find(e => e.id === exceptionId);
    if (exc) {
      exc.status = 'dismissed';
      exc.resolvedAt = new Date().toISOString();
      exc.resolvedBy = dismissedBy;
      exc.resolution = `Dismissed: ${reason}`;
    }
    return exc;
  }

  /**
   * Summary stats.
   */
  stats() {
    const byStatus = {};
    const bySeverity = {};
    const byType = {};
    for (const e of this.queue) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    return { total: this.queue.length, byStatus, bySeverity, byType };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLAINABILITY RECORDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a complete explainability record for a workforce record.
 */
function generateExplainability(record, validationResults, confidenceResult) {
  return {
    workerId: record.workerId,
    generatedAt: new Date().toISOString(),
    summary: {
      name: record.worker.name,
      department: record.worker.department,
      role: record.worker.role,
      status: record.worker.status,
      totalHours: record.timesheet.totalHours,
      confidence: confidenceResult ? confidenceResult.score : null,
      grade: confidenceResult ? confidenceResult.grade : 'N/A',
      validationPassed: validationResults ? validationResults.passed : null,
    },
    dataLineage: {
      sourceHash: record.audit.sourceHash,
      createdBy: record.audit.createdBy,
      createdAt: record.audit.createdAt,
      lastModified: record.audit.modifiedAt || null,
    },
    timesheetProof: {
      entries: record.timesheet.entries.length,
      totalHours: record.timesheet.totalHours,
      approvedEntries: record.timesheet.entries.filter(e => e.approved).length,
      pendingEntries: record.timesheet.entries.filter(e => !e.approved).length,
      overtimeHours: record.timesheet.entries.reduce((s, e) => {
        const net = e.netHours || 0;
        return s + Math.max(0, net - 8);
      }, 0),
    },
    scheduleProof: {
      shifts: record.schedule.shifts.length,
      uniqueDays: new Set(record.schedule.shifts.map(s => s.date)).size,
    },
    costProof: {
      hourlyRate: record.costs.hourlyRate,
      overtimeRate: record.costs.overtimeRate || 0,
      estimatedCost: Math.round(record.timesheet.totalHours * record.costs.hourlyRate * 100) / 100,
    },
    validationGates: validationResults ? validationResults.gates.map(g => ({
      gate: g.gate,
      passed: g.passed,
      errors: g.errors.length,
      warnings: g.warnings.length,
    })) : [],
    warnings: validationResults ? validationResults.warnings : [],
  };
}

module.exports = {
  computeConfidenceScore,
  ExceptionQueue,
  generateExplainability,
};
