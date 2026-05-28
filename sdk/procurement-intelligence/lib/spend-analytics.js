/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 4: SPEND ANALYTICS — Category & Trend Intelligence           ║
 * ║                                                                            ║
 * ║  Aggregates spend by vendor, category, department, and time period.        ║
 * ║  Detects anomalies and provides budget context for AI optimization.        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// SPEND AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════════

function spendByVendor(purchaseOrders) {
  const byVendor = {};
  for (const po of purchaseOrders) {
    const code = po.vendor.code || po.vendor.name;
    if (!byVendor[code]) byVendor[code] = { name: po.vendor.name, code, total: 0, orders: 0 };
    byVendor[code].total += po.totals.totalAmount;
    byVendor[code].orders++;
  }
  return Object.values(byVendor).sort((a, b) => b.total - a.total);
}

function spendByCategory(purchaseOrders) {
  const byCategory = {};
  for (const po of purchaseOrders) {
    for (const li of po.lineItems) {
      const cat = li.category || 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { category: cat, total: 0, items: 0 };
      byCategory[cat].total += li.lineTotal;
      byCategory[cat].items++;
    }
  }
  return Object.values(byCategory).sort((a, b) => b.total - a.total);
}

function spendByDepartment(purchaseOrders) {
  const byDept = {};
  for (const po of purchaseOrders) {
    const dept = po.buyer.department || 'unassigned';
    if (!byDept[dept]) byDept[dept] = { department: dept, total: 0, orders: 0 };
    byDept[dept].total += po.totals.totalAmount;
    byDept[dept].orders++;
  }
  return Object.values(byDept).sort((a, b) => b.total - a.total);
}

function spendByMonth(purchaseOrders) {
  const byMonth = {};
  for (const po of purchaseOrders) {
    if (!po.terms.orderDate) continue;
    const month = po.terms.orderDate.slice(0, 7); // YYYY-MM
    if (!byMonth[month]) byMonth[month] = { month, total: 0, orders: 0 };
    byMonth[month].total += po.totals.totalAmount;
    byMonth[month].orders++;
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPEND ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

function detectSpendAnomalies(purchaseOrders, options = {}) {
  const anomalies = [];
  const threshold = options.threshold || 3; // Standard deviations

  // Check for unusually large POs
  const amounts = purchaseOrders.map(po => po.totals.totalAmount).filter(a => a > 0);
  if (amounts.length >= 5) {
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length);

    for (const po of purchaseOrders) {
      if (po.totals.totalAmount > avg + threshold * stdDev) {
        anomalies.push({
          type: 'unusually_large_po',
          poNumber: po.poNumber,
          amount: po.totals.totalAmount,
          expectedMax: Math.round((avg + threshold * stdDev) * 100) / 100,
          deviation: stdDev > 0 ? Math.round((po.totals.totalAmount - avg) / stdDev * 100) / 100 : 0,
          severity: 'high',
        });
      }
    }
  }

  // Check for duplicate POs (same vendor + similar amount + same date)
  for (let i = 0; i < purchaseOrders.length; i++) {
    for (let j = i + 1; j < purchaseOrders.length; j++) {
      const a = purchaseOrders[i];
      const b = purchaseOrders[j];
      if (a.vendor.code === b.vendor.code &&
        a.terms.orderDate === b.terms.orderDate &&
        Math.abs(a.totals.totalAmount - b.totals.totalAmount) < 1) {
        anomalies.push({
          type: 'potential_duplicate',
          poNumbers: [a.poNumber, b.poNumber],
          vendor: a.vendor.name,
          amount: a.totals.totalAmount,
          severity: 'medium',
        });
      }
    }
  }

  return anomalies;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUDGET TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

function budgetStatus(purchaseOrders, budgets) {
  // budgets: { department: amount } or { category: amount }
  const spentByDept = spendByDepartment(purchaseOrders);
  const results = [];

  for (const [key, budget] of Object.entries(budgets)) {
    const spent = spentByDept.find(d => d.department === key);
    const spentAmount = spent ? spent.total : 0;
    const remaining = budget - spentAmount;
    const utilizationPercent = budget > 0 ? Math.round((spentAmount / budget) * 10000) / 100 : 0;

    results.push({
      key,
      budget,
      spent: Math.round(spentAmount * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      utilizationPercent,
      status: utilizationPercent >= 100 ? 'over-budget' : utilizationPercent >= 90 ? 'near-limit' : 'within-budget',
    });
  }

  return results.sort((a, b) => b.utilizationPercent - a.utilizationPercent);
}

function spendSummary(purchaseOrders) {
  const total = purchaseOrders.reduce((s, po) => s + po.totals.totalAmount, 0);
  return {
    totalSpend: Math.round(total * 100) / 100,
    orderCount: purchaseOrders.length,
    avgOrderValue: purchaseOrders.length > 0 ? Math.round(total / purchaseOrders.length * 100) / 100 : 0,
    uniqueVendors: new Set(purchaseOrders.map(po => po.vendor.code)).size,
    topVendors: spendByVendor(purchaseOrders).slice(0, 5),
    topCategories: spendByCategory(purchaseOrders).slice(0, 5),
  };
}

module.exports = { spendByVendor, spendByCategory, spendByDepartment, spendByMonth, detectSpendAnomalies, budgetStatus, spendSummary };
