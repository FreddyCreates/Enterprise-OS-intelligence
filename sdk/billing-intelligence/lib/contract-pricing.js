/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 3: CONTRACT-PRICING — Rate Engine & Calculation Tracer       ║
 * ║                                                                            ║
 * ║  Applies billing rules, tax, overtime/threshold logic, and generates       ║
 * ║  transparent calculation traces for every billed amount.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// RATE APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Apply rate card to labor logs and produce a TotalsBlock with full trace.
 */
function calculateTotals(laborLogs, rateCard) {
  const trace = [];
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;

  // Step 1: Compute hours per day, split regular vs overtime
  for (const log of laborLogs) {
    if (rateCard.overtimeThresholdHours) {
      const regular = Math.min(log.dayTotalHours, rateCard.overtimeThresholdHours);
      const overtime = Math.max(0, log.dayTotalHours - rateCard.overtimeThresholdHours);
      totalRegularHours += regular;
      totalOvertimeHours += overtime;
    } else {
      totalRegularHours += log.dayTotalHours;
    }
  }

  const totalHours = totalRegularHours + totalOvertimeHours;
  trace.push({
    step: 'Hours computation',
    formula: `regular=${totalRegularHours} + overtime=${totalOvertimeHours}`,
    result: totalHours,
  });

  // Step 2: Apply base rate
  const regularAmount = totalRegularHours * rateCard.hourlyRate;
  trace.push({
    step: 'Regular labor',
    formula: `${totalRegularHours} hours × $${rateCard.hourlyRate}/hr`,
    result: Math.round(regularAmount * 100) / 100,
  });

  // Step 3: Apply overtime rate
  const overtimeMultiplier = rateCard.overtimeMultiplier || 1.5;
  const overtimeAmount = totalOvertimeHours * rateCard.hourlyRate * overtimeMultiplier;
  if (totalOvertimeHours > 0) {
    trace.push({
      step: 'Overtime labor',
      formula: `${totalOvertimeHours} hours × $${rateCard.hourlyRate}/hr × ${overtimeMultiplier}`,
      result: Math.round(overtimeAmount * 100) / 100,
    });
  }

  // Step 4: Minimum billing check
  let subtotal = regularAmount + overtimeAmount;
  if (rateCard.minimumHours && totalHours < rateCard.minimumHours) {
    const minimumAmount = rateCard.minimumHours * rateCard.hourlyRate;
    trace.push({
      step: 'Minimum billing adjustment',
      formula: `Minimum ${rateCard.minimumHours} hours × $${rateCard.hourlyRate}/hr (actual: ${totalHours}h)`,
      result: minimumAmount,
    });
    subtotal = minimumAmount;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  trace.push({ step: 'Subtotal', formula: 'regular + overtime (or minimum)', result: subtotal });

  // Step 5: Discounts
  let discountAmount = 0;
  if (rateCard.discounts && rateCard.discounts.length > 0) {
    for (const discount of rateCard.discounts) {
      let amt = 0;
      if (discount.type === 'percent') {
        amt = subtotal * (discount.value / 100);
      } else if (discount.type === 'flat') {
        amt = discount.value;
      }
      discountAmount += amt;
      trace.push({
        step: `Discount: ${discount.reason || 'applied'}`,
        formula: discount.type === 'percent' ? `${discount.value}% of $${subtotal}` : `flat $${discount.value}`,
        result: -Math.round(amt * 100) / 100,
      });
    }
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const afterDiscount = subtotal - discountAmount;

  // Step 6: Tax
  const taxRate = rateCard.taxRate || 0;
  const taxAmount = Math.round(afterDiscount * taxRate * 100) / 100;
  if (taxRate > 0) {
    trace.push({
      step: 'Tax',
      formula: `$${afterDiscount} × ${(taxRate * 100).toFixed(2)}%`,
      result: taxAmount,
    });
  }

  // Step 7: Total
  const totalDue = Math.round((afterDiscount + taxAmount) * 100) / 100;
  trace.push({ step: 'Total due', formula: 'subtotal - discounts + tax', result: totalDue });

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    regularHours: Math.round(totalRegularHours * 100) / 100,
    overtimeHours: Math.round(totalOvertimeHours * 100) / 100,
    subtotal,
    discountAmount,
    taxAmount,
    totalDue,
    trace,
  };
}

/**
 * Verify an invoice total against expected calculation.
 */
function verifyTotal(invoice) {
  const recalc = calculateTotals(invoice.laborLogs, invoice.rates);
  const match = Math.abs(recalc.totalDue - invoice.totals.totalDue) < 0.01;
  return {
    match,
    expected: recalc.totalDue,
    actual: invoice.totals.totalDue,
    discrepancy: Math.round((invoice.totals.totalDue - recalc.totalDue) * 100) / 100,
    recalculatedTrace: recalc.trace,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE CARD MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a standard rate card.
 */
function createRateCard(hourlyRate, options = {}) {
  return {
    hourlyRate,
    currency: options.currency || 'USD',
    overtimeMultiplier: options.overtimeMultiplier || null,
    overtimeThresholdHours: options.overtimeThresholdHours || null,
    minimumHours: options.minimumHours || null,
    taxRate: options.taxRate || 0,
    discounts: options.discounts || [],
    effectiveDate: options.effectiveDate || new Date().toISOString().split('T')[0],
    expiresDate: options.expiresDate || null,
    clientCode: options.clientCode || null,
    contractRef: options.contractRef || null,
  };
}

/**
 * Look up the applicable rate card for a client/date from a list of rate cards.
 */
function resolveRateCard(rateCards, clientCode, date) {
  const applicable = rateCards.filter(rc => {
    if (rc.clientCode && rc.clientCode !== clientCode) return false;
    if (rc.effectiveDate && date < rc.effectiveDate) return false;
    if (rc.expiresDate && date > rc.expiresDate) return false;
    return true;
  });

  // Most specific (client-specific) wins, then most recent
  applicable.sort((a, b) => {
    if (a.clientCode && !b.clientCode) return -1;
    if (!a.clientCode && b.clientCode) return 1;
    return (b.effectiveDate || '').localeCompare(a.effectiveDate || '');
  });

  return applicable[0] || null;
}

/**
 * Generate a pricing breakdown summary (human-readable).
 */
function pricingSummary(totals) {
  const lines = [];
  for (const step of totals.trace) {
    lines.push(`  ${step.step}: ${step.formula} = $${step.result.toFixed(2)}`);
  }
  return lines.join('\n');
}

module.exports = {
  calculateTotals,
  verifyTotal,
  createRateCard,
  resolveRateCard,
  pricingSummary,
};
