/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 2: REGULATION ENGINE — Requirements & Gap Analysis           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/**
 * Common regulatory frameworks with their requirement categories
 */
const FRAMEWORKS = {
  'SOC2': { name: 'SOC 2', categories: ['security', 'availability', 'processing-integrity', 'confidentiality', 'privacy'] },
  'ISO27001': { name: 'ISO 27001', categories: ['context', 'leadership', 'planning', 'support', 'operation', 'performance', 'improvement'] },
  'HIPAA': { name: 'HIPAA', categories: ['privacy-rule', 'security-rule', 'breach-notification', 'enforcement'] },
  'PCI-DSS': { name: 'PCI DSS', categories: ['network-security', 'data-protection', 'vulnerability-mgmt', 'access-control', 'monitoring', 'security-policy'] },
  'GDPR': { name: 'GDPR', categories: ['lawfulness', 'data-subject-rights', 'data-protection', 'breach-notification', 'dpo', 'international-transfers'] },
  'OSHA': { name: 'OSHA', categories: ['general-duty', 'recordkeeping', 'hazard-communication', 'ppe', 'emergency-plans'] },
};

function getFrameworkInfo(code) {
  return FRAMEWORKS[code.toUpperCase()] || null;
}

/**
 * Evaluate compliance gap between requirements and implemented controls
 */
function gapAnalysis(requirements, controls) {
  const results = requirements.map(req => {
    const matchingControls = controls.filter(c =>
      c.name.toLowerCase().includes(req.toLowerCase()) ||
      (c.tags && c.tags.some(t => req.toLowerCase().includes(t.toLowerCase())))
    );

    let coverage = 'not-addressed';
    let effectiveness = 0;

    if (matchingControls.length > 0) {
      const implemented = matchingControls.filter(c => c.status === 'implemented');
      if (implemented.length > 0) {
        effectiveness = Math.round(implemented.reduce((s, c) => s + c.effectiveness, 0) / implemented.length);
        coverage = effectiveness >= 80 ? 'fully-addressed' : effectiveness >= 50 ? 'partially-addressed' : 'weakly-addressed';
      } else {
        coverage = 'planned';
      }
    }

    return { requirement: req, coverage, effectiveness, controlCount: matchingControls.length };
  });

  const addressed = results.filter(r => r.coverage === 'fully-addressed').length;
  const partial = results.filter(r => r.coverage === 'partially-addressed' || r.coverage === 'weakly-addressed').length;
  const gaps = results.filter(r => r.coverage === 'not-addressed').length;

  return {
    totalRequirements: requirements.length,
    fullyAddressed: addressed,
    partiallyAddressed: partial,
    gaps,
    coveragePercent: requirements.length > 0 ? Math.round((addressed / requirements.length) * 10000) / 100 : 0,
    details: results,
  };
}

/**
 * Check if a compliance record meets minimum thresholds
 */
function checkComplianceThresholds(record, thresholds = {}) {
  const minScore = thresholds.minScore || 70;
  const maxOpenFindings = thresholds.maxOpenFindings || 5;
  const maxCriticalFindings = thresholds.maxCriticalFindings || 0;

  const issues = [];
  if (record.assessment.score < minScore) {
    issues.push({ type: 'low_score', actual: record.assessment.score, threshold: minScore });
  }

  const openFindings = record.assessment.findings.filter(f => f.status === 'open');
  if (openFindings.length > maxOpenFindings) {
    issues.push({ type: 'too_many_open_findings', actual: openFindings.length, threshold: maxOpenFindings });
  }

  const criticalFindings = openFindings.filter(f => f.severity === 'critical');
  if (criticalFindings.length > maxCriticalFindings) {
    issues.push({ type: 'critical_findings', actual: criticalFindings.length, threshold: maxCriticalFindings });
  }

  return { compliant: issues.length === 0, issues };
}

/**
 * Generate remediation priorities from findings
 */
function prioritizeRemediation(findings) {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };
  const open = findings.filter(f => f.status === 'open');

  return open.sort((a, b) => {
    const sev = (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
    if (sev !== 0) return sev;
    // Then by due date
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  }).map((f, i) => ({ ...f, priority: i + 1 }));
}

module.exports = { FRAMEWORKS, getFrameworkInfo, gapAnalysis, checkComplianceThresholds, prioritizeRemediation };
