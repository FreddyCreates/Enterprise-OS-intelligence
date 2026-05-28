/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OBSERVABILITY — Confidence, Exceptions & Explainability              ║
 * ║                                                                            ║
 * ║  Confidence scores, exception queues, and explainability records so        ║
 * ║  every compliance assessment and finding is fully traceable.               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute a holistic confidence score for a compliance record (0.0 - 1.0).
 */
function computeConfidenceScore(record, validationResults) {
  const weights = {
    schemaComplete: 0.15,
    findingsDocumented: 0.25,
    controlsMapped: 0.25,
    evidencePresent: 0.20,
    noWarnings: 0.15,
  };

  const scores = {};

  // Schema completeness
  scores.schemaComplete = validationResults.gates[0].passed ? 1 : 0;

  // Findings documented
  if (record.assessment.findings.length > 0) {
    scores.findingsDocumented = 1.0;
    const documentedFindings = record.assessment.findings.filter(f => f.title && f.severity);
    scores.findingsDocumented = documentedFindings.length / record.assessment.findings.length;
  } else {
    scores.findingsDocumented = 0.5; // No findings could mean compliant or not assessed
  }

  // Controls mapped
  if (record.assessment.controls.length > 0) {
    scores.controlsMapped = 1.0;
    const effectiveControls = record.assessment.controls.filter(c => c.effectiveness && c.effectiveness > 50);
    scores.controlsMapped = Math.min(1, 0.5 + (effectiveControls.length / record.assessment.controls.length) * 0.5);
  } else {
    scores.controlsMapped = 0.3;
  }

  // Evidence present
  if (record.evidence.length > 0) {
    scores.evidencePresent = Math.min(1, 0.5 + (record.evidence.length * 0.1));
  } else {
    scores.evidencePresent = 0.2;
  }

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
  add(recordId, type, severity, message, context = {}) {
    this.queue.push({
      id: `EXC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recordId,
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
  fromValidation(recordId, validationResults) {
    for (const gate of validationResults.gates) {
      for (const error of gate.errors) {
        this.add(recordId, gate.gate, 'high', error, { gate: gate.gate });
      }
      for (const warning of gate.warnings) {
        this.add(recordId, gate.gate, 'medium', warning, { gate: gate.gate });
      }
    }
  }

  /**
   * Add exceptions from high-risk findings.
   */
  fromFindings(recordId, findings) {
    for (const finding of findings) {
      if (finding.severity === 'critical' || finding.severity === 'high') {
        this.add(
          recordId,
          'compliance_finding',
          finding.severity === 'critical' ? 'critical' : 'high',
          `${finding.title}: ${finding.description || 'No description'}`,
          { findingId: finding.findingId, regulation: finding.regulation }
        );
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
   * Get exceptions by record.
   */
  getByRecord(recordId) {
    return this.queue.filter(e => e.recordId === recordId);
  }

  /**
   * Get exceptions by severity.
   */
  getBySeverity(severity) {
    return this.queue.filter(e => e.severity === severity && e.status === 'open');
  }

  /**
   * Get critical exceptions (regulatory urgency).
   */
  getCritical() {
    return this.queue.filter(e => e.severity === 'critical' && e.status === 'open');
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
   * Dismiss (false positive / accepted risk).
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
 * Generate a complete explainability record for a compliance assessment.
 */
function generateExplainability(record, validationResults, confidenceResult) {
  return {
    recordId: record.recordId,
    generatedAt: new Date().toISOString(),
    summary: {
      entity: record.entity.name,
      regulation: record.regulation.name,
      category: record.regulation.category,
      status: record.assessment.status,
      score: record.assessment.score,
      riskLevel: record.riskProfile.level,
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
    assessmentProof: {
      totalFindings: record.assessment.findings.length,
      openFindings: record.assessment.findings.filter(f => f.status === 'open').length,
      criticalFindings: record.assessment.findings.filter(f => f.severity === 'critical').length,
      highFindings: record.assessment.findings.filter(f => f.severity === 'high').length,
      controls: record.assessment.controls.length,
      avgControlEffectiveness: record.assessment.controls.length > 0
        ? Math.round(record.assessment.controls.reduce((s, c) => s + (c.effectiveness || 0), 0) / record.assessment.controls.length)
        : 0,
    },
    riskProof: {
      inherentRisk: record.riskProfile.inherentRisk || null,
      residualRisk: record.riskProfile.residualRisk || null,
      level: record.riskProfile.level,
      factors: record.riskProfile.factors || [],
    },
    evidenceChain: record.evidence.map(e => ({
      type: e.type,
      description: e.description,
      source: e.source,
      collectedAt: e.collectedAt,
    })),
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
