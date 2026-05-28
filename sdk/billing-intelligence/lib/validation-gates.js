/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       VALIDATION GATES — Pre-Finalization Integrity Checks                 ║
 * ║                                                                            ║
 * ║  Missing fields, inconsistent hours, duplicate entries, and total          ║
 * ║  mismatches — caught before billing finalization.                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { validateSchema } = require('./schema');
const { verifyHours, detectAnomalies } = require('./labor-intel');
const { verifyTotal } = require('./contract-pricing');

// ═══════════════════════════════════════════════════════════════════════════════
// GATE RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run all validation gates on an invoice. Returns pass/fail with detailed findings.
 */
function runAllGates(invoice) {
  const results = {
    passed: true,
    gates: [],
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString(),
  };

  // Gate 1: Schema completeness
  const schemaResult = gateSchemaComplete(invoice);
  results.gates.push(schemaResult);
  if (!schemaResult.passed) {
    results.passed = false;
    results.errors.push(...schemaResult.findings.map(f => f.message));
  }

  // Gate 2: Hours consistency
  const hoursResult = gateHoursConsistent(invoice);
  results.gates.push(hoursResult);
  if (!hoursResult.passed) {
    results.passed = false;
    results.errors.push(...hoursResult.findings.map(f => f.message));
  }

  // Gate 3: Total accuracy
  const totalResult = gateTotalAccurate(invoice);
  results.gates.push(totalResult);
  if (!totalResult.passed) {
    results.passed = false;
    results.errors.push(...totalResult.findings.map(f => f.message));
  }

  // Gate 4: Duplicate detection
  const dupeResult = gateDuplicates(invoice);
  results.gates.push(dupeResult);
  if (!dupeResult.passed) {
    results.warnings.push(...dupeResult.findings.map(f => f.message));
  }

  // Gate 5: Labor anomalies
  const anomalyResult = gateLaborAnomalies(invoice);
  results.gates.push(anomalyResult);
  if (!anomalyResult.passed) {
    results.warnings.push(...anomalyResult.findings.map(f => f.message));
  }

  // Gate 6: Date sanity
  const dateResult = gateDateSanity(invoice);
  results.gates.push(dateResult);
  if (!dateResult.passed) {
    results.warnings.push(...dateResult.findings.map(f => f.message));
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL GATES
// ═══════════════════════════════════════════════════════════════════════════════

function gateSchemaComplete(invoice) {
  const { valid, errors } = validateSchema(invoice);
  return {
    name: 'schema_completeness',
    passed: valid,
    findings: errors.map(e => ({ field: e.field, message: e.message, severity: 'error' })),
  };
}

function gateHoursConsistent(invoice) {
  const findings = [];
  if (!invoice.laborLogs || invoice.laborLogs.length === 0) {
    return { name: 'hours_consistency', passed: true, findings: [] };
  }

  // Check each day's entries sum to dayTotalHours
  for (const log of invoice.laborLogs) {
    const computed = log.entries.reduce((sum, e) => sum + e.hours, 0);
    const rounded = Math.round(computed * 100) / 100;
    if (Math.abs(rounded - log.dayTotalHours) > 0.01) {
      findings.push({
        severity: 'error',
        message: `Day ${log.date}: entries sum to ${rounded}h but dayTotalHours is ${log.dayTotalHours}h`,
      });
    }
  }

  // Check total hours matches sum of day totals
  const allDaysTotal = invoice.laborLogs.reduce((sum, l) => sum + l.dayTotalHours, 0);
  if (invoice.totals.totalHours > 0 && Math.abs(allDaysTotal - invoice.totals.totalHours) > 0.01) {
    findings.push({
      severity: 'error',
      message: `Labor logs total ${allDaysTotal}h but invoice totalHours is ${invoice.totals.totalHours}h`,
    });
  }

  return { name: 'hours_consistency', passed: findings.length === 0, findings };
}

function gateTotalAccurate(invoice) {
  const findings = [];
  if (!invoice.laborLogs || invoice.laborLogs.length === 0 || !invoice.rates.hourlyRate) {
    return { name: 'total_accuracy', passed: true, findings: [] };
  }

  const verification = verifyTotal(invoice);
  if (!verification.match) {
    findings.push({
      severity: 'error',
      message: `Total mismatch: computed $${verification.expected} vs stated $${verification.actual} (discrepancy: $${verification.discrepancy})`,
    });
  }

  return { name: 'total_accuracy', passed: findings.length === 0, findings };
}

function gateDuplicates(invoice) {
  const findings = [];
  if (!invoice.laborLogs) return { name: 'duplicate_detection', passed: true, findings: [] };

  // Check for duplicate dates
  const dates = invoice.laborLogs.map(l => l.date);
  const seen = new Set();
  for (const d of dates) {
    if (seen.has(d)) {
      findings.push({
        severity: 'warning',
        message: `Duplicate labor log for date ${d}`,
      });
    }
    seen.add(d);
  }

  // Check for duplicate entries within a day
  for (const log of invoice.laborLogs) {
    const entryKeys = log.entries.map(e => `${e.worker}|${e.startTime}|${e.endTime}`);
    const entrySeen = new Set();
    for (const key of entryKeys) {
      if (entrySeen.has(key)) {
        findings.push({
          severity: 'warning',
          message: `Duplicate entry on ${log.date}: ${key}`,
        });
      }
      entrySeen.add(key);
    }
  }

  return { name: 'duplicate_detection', passed: findings.length === 0, findings };
}

function gateLaborAnomalies(invoice) {
  if (!invoice.laborLogs) return { name: 'labor_anomalies', passed: true, findings: [] };
  const anomalies = detectAnomalies(invoice.laborLogs);
  return {
    name: 'labor_anomalies',
    passed: anomalies.filter(a => a.severity === 'high').length === 0,
    findings: anomalies.map(a => ({ severity: a.severity, message: a.message })),
  };
}

function gateDateSanity(invoice) {
  const findings = [];

  // Invoice date should not be in the future (by more than 7 days)
  if (invoice.terms.invoiceDate) {
    const invDate = new Date(invoice.terms.invoiceDate);
    const futureLimit = new Date();
    futureLimit.setDate(futureLimit.getDate() + 7);
    if (invDate > futureLimit) {
      findings.push({
        severity: 'warning',
        message: `Invoice date ${invoice.terms.invoiceDate} is more than 7 days in the future`,
      });
    }
  }

  // Service period end should be before or on invoice date
  if (invoice.project.servicePeriodEnd && invoice.terms.invoiceDate) {
    if (invoice.project.servicePeriodEnd > invoice.terms.invoiceDate) {
      findings.push({
        severity: 'warning',
        message: `Service period ends ${invoice.project.servicePeriodEnd} which is after invoice date ${invoice.terms.invoiceDate}`,
      });
    }
  }

  return { name: 'date_sanity', passed: findings.length === 0, findings };
}

module.exports = {
  runAllGates,
  gateSchemaComplete,
  gateHoursConsistent,
  gateTotalAccurate,
  gateDuplicates,
  gateLaborAnomalies,
  gateDateSanity,
};
