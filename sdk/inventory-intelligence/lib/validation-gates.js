/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       VALIDATION GATES — Inventory Data Quality Checks                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { validateSchema } = require('./schema');

// ═══════════════════════════════════════════════════════════════════════════════
// GATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

function gateSchemaCompleteness(record) {
  const result = validateSchema(record);
  return { gate: 'schema_completeness', passed: result.valid, errors: result.errors, warnings: [] };
}

function gateLevelConsistency(record) {
  const warnings = [];
  const errors = [];

  if (record.levels.available !== record.levels.onHand - record.levels.allocated) {
    errors.push('Available != OnHand - Allocated');
  }
  if (record.levels.onHand < 0) errors.push('Negative on-hand quantity');
  if (record.levels.allocated < 0) errors.push('Negative allocated quantity');
  if (record.levels.allocated > record.levels.onHand) {
    warnings.push('Allocated exceeds on-hand (over-allocation)');
  }

  return { gate: 'level_consistency', passed: errors.length === 0, errors, warnings };
}

function gateItemIntegrity(record) {
  const warnings = [];
  const errors = [];
  const skus = new Set();

  for (const item of record.items) {
    if (skus.has(item.sku)) errors.push(`Duplicate SKU: ${item.sku}`);
    skus.add(item.sku);
    if (item.unitCost < 0) errors.push(`Negative cost for ${item.sku}`);
    if (item.weight < 0) warnings.push(`Negative weight for ${item.sku}`);
  }

  return { gate: 'item_integrity', passed: errors.length === 0, errors, warnings };
}

function gateReorderLogic(record) {
  const warnings = [];
  const rules = record.reorderRules;

  if (rules.reorderPoint > 0 && rules.safetyStock > rules.reorderPoint) {
    warnings.push('Safety stock exceeds reorder point');
  }
  if (rules.reorderQuantity > 0 && rules.reorderQuantity < rules.safetyStock) {
    warnings.push('Reorder quantity less than safety stock');
  }
  if (rules.leadTimeDays < 0) {
    warnings.push('Negative lead time');
  }

  return { gate: 'reorder_logic', passed: true, errors: [], warnings };
}

function gateExpiryCheck(record) {
  const warnings = [];
  const now = new Date();

  for (const item of record.items) {
    if (item.expiryDate) {
      const expiry = new Date(item.expiryDate);
      if (expiry < now) warnings.push(`${item.sku} is expired (${item.expiryDate})`);
    }
  }

  return { gate: 'expiry_check', passed: true, errors: [], warnings };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN ALL GATES
// ═══════════════════════════════════════════════════════════════════════════════

function runAllGates(record) {
  const gates = [
    gateSchemaCompleteness(record),
    gateLevelConsistency(record),
    gateItemIntegrity(record),
    gateReorderLogic(record),
    gateExpiryCheck(record),
  ];

  const allErrors = gates.flatMap(g => g.errors);
  const allWarnings = gates.flatMap(g => g.warnings);
  const passed = gates.every(g => g.passed);

  return { passed, gates, errors: allErrors, warnings: allWarnings };
}

module.exports = {
  gateSchemaCompleteness,
  gateLevelConsistency,
  gateItemIntegrity,
  gateReorderLogic,
  gateExpiryCheck,
  runAllGates,
};
