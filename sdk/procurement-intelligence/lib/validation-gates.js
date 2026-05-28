/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       VALIDATION GATES — Procurement Data Quality Checks                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { validateSchema } = require('./schema');

function gateSchemaCompleteness(po) {
  const result = validateSchema(po);
  return { gate: 'schema_completeness', passed: result.valid, errors: result.errors, warnings: [] };
}

function gateTotalAccuracy(po) {
  const errors = [];
  const computed = po.lineItems.reduce((s, li) => s + li.lineTotal, 0);
  const expectedTotal = computed + po.totals.tax + po.totals.shipping - po.totals.discount;
  if (Math.abs(expectedTotal - po.totals.totalAmount) > 0.01) {
    errors.push(`Computed total ($${expectedTotal.toFixed(2)}) != stated total ($${po.totals.totalAmount.toFixed(2)})`);
  }
  for (const li of po.lineItems) {
    const expectedLine = Math.round(li.quantity * li.unitPrice * 100) / 100;
    if (Math.abs(expectedLine - li.lineTotal) > 0.01) {
      errors.push(`Line ${li.lineNumber}: qty(${li.quantity}) × price($${li.unitPrice}) = $${expectedLine} but lineTotal = $${li.lineTotal}`);
    }
  }
  return { gate: 'total_accuracy', passed: errors.length === 0, errors, warnings: [] };
}

function gateDuplicateDetection(po, existingPOs = []) {
  const warnings = [];
  for (const existing of existingPOs) {
    if (existing.poNumber === po.poNumber) continue;
    if (existing.vendor.code === po.vendor.code &&
      existing.terms.orderDate === po.terms.orderDate &&
      Math.abs(existing.totals.totalAmount - po.totals.totalAmount) < 1) {
      warnings.push(`Potential duplicate of ${existing.poNumber} (same vendor, date, and amount)`);
    }
  }
  return { gate: 'duplicate_detection', passed: true, errors: [], warnings };
}

function gateApprovalChain(po) {
  const warnings = [];
  if (po.totals.totalAmount > 10000 && po.approvals.filter(a => a.status === 'approved').length === 0 && po.status !== 'draft') {
    warnings.push('High-value PO ($10k+) without approval');
  }
  if (po.totals.totalAmount > 50000 && po.approvals.filter(a => a.status === 'approved').length < 2 && po.status !== 'draft') {
    warnings.push('Very high-value PO ($50k+) with less than 2 approvals');
  }
  return { gate: 'approval_chain', passed: true, errors: [], warnings };
}

function runAllGates(po, existingPOs = []) {
  const gates = [
    gateSchemaCompleteness(po),
    gateTotalAccuracy(po),
    gateDuplicateDetection(po, existingPOs),
    gateApprovalChain(po),
  ];
  return { passed: gates.every(g => g.passed), gates, errors: gates.flatMap(g => g.errors), warnings: gates.flatMap(g => g.warnings) };
}

module.exports = { gateSchemaCompleteness, gateTotalAccuracy, gateDuplicateDetection, gateApprovalChain, runAllGates };
