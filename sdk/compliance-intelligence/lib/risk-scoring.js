/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 4: RISK SCORING — Compliance Risk Assessment                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const SEVERITY_WEIGHTS = { critical: 10, high: 7, medium: 4, low: 2, informational: 1 };

/**
 * Compute overall compliance risk score (0-100, higher = more risk)
 */
function computeRiskScore(record) {
  const factors = [];

  // Finding-based risk
  const openFindings = record.assessment.findings.filter(f => f.status === 'open');
  const findingRisk = openFindings.reduce((s, f) => s + (SEVERITY_WEIGHTS[f.severity] || 2), 0);
  factors.push({ factor: 'open_findings', rawScore: findingRisk, weight: 0.40 });

  // Control effectiveness risk (inverse)
  const controls = record.assessment.controls;
  const avgEffectiveness = controls.length > 0
    ? controls.reduce((s, c) => s + c.effectiveness, 0) / controls.length
    : 0;
  const controlRisk = 100 - avgEffectiveness;
  factors.push({ factor: 'control_gaps', rawScore: controlRisk, weight: 0.30 });

  // Assessment staleness risk
  const daysSinceAssessment = record.assessment.lastAssessedAt
    ? Math.ceil((Date.now() - new Date(record.assessment.lastAssessedAt).getTime()) / (24 * 60 * 60 * 1000))
    : 365;
  const stalenessRisk = Math.min(100, daysSinceAssessment / 3.65); // 365 days = 100 risk
  factors.push({ factor: 'assessment_staleness', rawScore: Math.round(stalenessRisk), weight: 0.15 });

  // Evidence coverage risk
  const evidenceRisk = record.evidence.length > 0 ? Math.max(0, 50 - record.evidence.length * 10) : 80;
  factors.push({ factor: 'evidence_coverage', rawScore: evidenceRisk, weight: 0.15 });

  // Weighted total
  const weighted = factors.reduce((sum, f) => sum + (Math.min(100, f.rawScore) * f.weight), 0);
  const score = Math.round(Math.min(100, weighted));

  let level;
  if (score >= 75) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 25) level = 'medium';
  else level = 'low';

  return { score, level, factors, maxScore: 100 };
}

/**
 * Compare risk across multiple compliance records
 */
function riskHeatmap(records) {
  return records.map(record => {
    const risk = computeRiskScore(record);
    return {
      recordId: record.recordId,
      entity: record.entity.name,
      regulation: record.regulation.name,
      riskScore: risk.score,
      riskLevel: risk.level,
      openFindings: record.assessment.findings.filter(f => f.status === 'open').length,
      criticalFindings: record.assessment.findings.filter(f => f.status === 'open' && f.severity === 'critical').length,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Identify risk trends over time from assessment history
 */
function riskTrend(assessmentHistory) {
  if (assessmentHistory.length < 2) return { trend: 'insufficient-data', dataPoints: assessmentHistory.length };

  const scores = assessmentHistory.map(a => a.score || 0);
  const recent = scores.slice(-3);
  const older = scores.slice(0, -3);

  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((s, v) => s + v, 0) / older.length : recentAvg;

  let trend = 'stable';
  const change = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  if (change > 0.1) trend = 'improving';
  else if (change < -0.1) trend = 'deteriorating';

  return { trend, recentAvg: Math.round(recentAvg), historicalAvg: Math.round(olderAvg), changePercent: Math.round(change * 100) };
}

module.exports = { SEVERITY_WEIGHTS, computeRiskScore, riskHeatmap, riskTrend };
