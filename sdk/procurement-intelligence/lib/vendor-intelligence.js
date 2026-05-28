/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 2: VENDOR INTELLIGENCE — Supplier Analysis & Scoring         ║
 * ║                                                                            ║
 * ║  Scores vendors on delivery, quality, pricing, and responsiveness.         ║
 * ║  Provides risk assessment and recommendation context for AI.               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// VENDOR SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute vendor performance score from PO history
 */
function scoreVendor(vendorCode, purchaseOrders) {
  const vendorPOs = purchaseOrders.filter(po => po.vendor.code === vendorCode);
  if (vendorPOs.length === 0) return { vendorCode, score: 0, grade: 'N/A', poCount: 0 };

  const metrics = {
    deliveryOnTime: computeDeliveryScore(vendorPOs),
    qualityScore: computeQualityScore(vendorPOs),
    priceCompetitiveness: computePriceScore(vendorPOs),
    responsiveness: computeResponsivenessScore(vendorPOs),
  };

  const weights = { deliveryOnTime: 0.35, qualityScore: 0.30, priceCompetitiveness: 0.20, responsiveness: 0.15 };
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + (metrics[key] * weight), 0);
  const score = Math.round(weighted * 100) / 100;
  const grade = score >= 4.5 ? 'A+' : score >= 4.0 ? 'A' : score >= 3.5 ? 'B' : score >= 3.0 ? 'C' : 'D';

  return { vendorCode, score, grade, metrics, poCount: vendorPOs.length, weights };
}

function computeDeliveryScore(pos) {
  const received = pos.filter(po => po.status === 'received' || po.status === 'closed');
  if (received.length === 0) return 3.0;

  let onTime = 0;
  for (const po of received) {
    // Simplified: if status is received/closed, assume delivered
    // Better metric would compare actual vs required date
    if (po.terms.requiredDate) {
      const required = new Date(po.terms.requiredDate);
      const closed = po.audit.modifiedAt ? new Date(po.audit.modifiedAt) : new Date();
      if (closed <= new Date(required.getTime() + 2 * 24 * 60 * 60 * 1000)) onTime++;
    } else {
      onTime++; // No required date = assume on time
    }
  }

  return Math.round((onTime / received.length) * 5 * 100) / 100;
}

function computeQualityScore(pos) {
  // Based on returns/rejections in audit warnings
  const withIssues = pos.filter(po => po.audit.warnings.some(w => w.includes('quality') || w.includes('defect') || w.includes('reject')));
  const issueRate = pos.length > 0 ? withIssues.length / pos.length : 0;
  return Math.round((1 - issueRate) * 5 * 100) / 100;
}

function computePriceScore(pos) {
  // Price consistency and no unexpected increases
  if (pos.length < 2) return 4.0;
  const totals = pos.map(po => po.totals.totalAmount).filter(t => t > 0);
  if (totals.length < 2) return 4.0;
  const avg = totals.reduce((s, t) => s + t, 0) / totals.length;
  const variance = totals.reduce((s, t) => s + Math.pow(t - avg, 2), 0) / totals.length;
  const cv = Math.sqrt(variance) / avg; // Coefficient of variation
  return Math.round(Math.max(1, 5 - cv * 5) * 100) / 100;
}

function computeResponsivenessScore(pos) {
  // Based on how quickly POs move from ordered to received
  return 4.0; // Default baseline
}

// ═══════════════════════════════════════════════════════════════════════════════
// VENDOR RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════════

function assessVendorRisk(vendorCode, purchaseOrders, options = {}) {
  const vendorPOs = purchaseOrders.filter(po => po.vendor.code === vendorCode);
  const risks = [];

  // Single source risk
  if (options.totalSpend && options.vendorSpend) {
    const concentration = options.vendorSpend / options.totalSpend;
    if (concentration > 0.5) risks.push({ factor: 'concentration', severity: 'high', detail: `${Math.round(concentration * 100)}% of spend` });
    else if (concentration > 0.3) risks.push({ factor: 'concentration', severity: 'medium', detail: `${Math.round(concentration * 100)}% of spend` });
  }

  // Late delivery history
  const lateCount = vendorPOs.filter(po => po.audit.warnings.some(w => w.includes('late') || w.includes('delay'))).length;
  if (lateCount > vendorPOs.length * 0.3) {
    risks.push({ factor: 'delivery_reliability', severity: 'high', detail: `${lateCount}/${vendorPOs.length} late deliveries` });
  }

  // No recent orders (vendor going inactive)
  if (vendorPOs.length > 0) {
    const lastOrder = vendorPOs.sort((a, b) => new Date(b.terms.orderDate) - new Date(a.terms.orderDate))[0];
    const daysSinceOrder = (Date.now() - new Date(lastOrder.terms.orderDate).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceOrder > 180) risks.push({ factor: 'inactive', severity: 'low', detail: `${Math.round(daysSinceOrder)} days since last order` });
  }

  const overallRisk = risks.some(r => r.severity === 'high') ? 'high' :
    risks.some(r => r.severity === 'medium') ? 'medium' : 'low';

  return { vendorCode, overallRisk, factors: risks };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VENDOR COMPARISON
// ═══════════════════════════════════════════════════════════════════════════════

function compareVendors(vendorCodes, purchaseOrders) {
  return vendorCodes.map(code => scoreVendor(code, purchaseOrders))
    .sort((a, b) => b.score - a.score);
}

function vendorSummary(vendorCode, purchaseOrders) {
  const pos = purchaseOrders.filter(po => po.vendor.code === vendorCode);
  const totalSpend = pos.reduce((s, po) => s + po.totals.totalAmount, 0);

  return {
    vendorCode,
    vendorName: pos[0] ? pos[0].vendor.name : vendorCode,
    totalOrders: pos.length,
    totalSpend: Math.round(totalSpend * 100) / 100,
    avgOrderValue: pos.length > 0 ? Math.round(totalSpend / pos.length * 100) / 100 : 0,
    categories: [...new Set(pos.flatMap(po => po.lineItems.map(li => li.category).filter(Boolean)))],
    statuses: pos.reduce((acc, po) => { acc[po.status] = (acc[po.status] || 0) + 1; return acc; }, {}),
  };
}

module.exports = { scoreVendor, assessVendorRisk, compareVendors, vendorSummary };
