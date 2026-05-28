/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 6: AI PROCUREMENT CONTEXT — AI-Ready PO Packaging            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function toAIRecord(po) {
  return {
    id: po.poNumber,
    type: 'purchase_order',
    embedding_text: generateEmbeddingText(po),
    structured: {
      vendor: po.vendor.name,
      vendorCode: po.vendor.code,
      buyer: po.buyer.name,
      department: po.buyer.department,
      lineItemCount: po.lineItems.length,
      totalAmount: po.totals.totalAmount,
      status: po.status,
      orderDate: po.terms.orderDate,
      requiredDate: po.terms.requiredDate,
    },
    metadata: { createdAt: po.audit.createdAt, confidence: po.audit.confidence },
    signals: extractSignals(po),
  };
}

function generateEmbeddingText(po) {
  const items = po.lineItems.map(li => `${li.description} (qty:${li.quantity}, $${li.unitPrice}/${li.unit})`).join('; ');
  return [
    `Purchase Order ${po.poNumber} from ${po.vendor.name}`,
    `Buyer: ${po.buyer.name}, Dept: ${po.buyer.department}`,
    `Items: ${items}`,
    `Total: $${po.totals.totalAmount}, Terms: ${po.terms.paymentTerms}`,
    `Status: ${po.status}, Order Date: ${po.terms.orderDate}`,
  ].join('. ');
}

function extractSignals(po) {
  const signals = [];
  if (po.status === 'pending-approval') signals.push({ signal: 'awaiting_approval', severity: 'info' });
  if (po.totals.totalAmount > 50000) signals.push({ signal: 'high_value_po', severity: 'medium' });
  if (po.terms.requiredDate) {
    const daysUntil = Math.ceil((new Date(po.terms.requiredDate) - new Date()) / (24 * 60 * 60 * 1000));
    if (daysUntil < 0) signals.push({ signal: 'overdue', severity: 'critical' });
    else if (daysUntil <= 7) signals.push({ signal: 'due_soon', severity: 'warning' });
  }
  const partialReceived = po.lineItems.some(li => (li.receivedQty || 0) > 0 && (li.receivedQty || 0) < li.quantity);
  if (partialReceived) signals.push({ signal: 'partial_receipt', severity: 'info' });
  return signals;
}

function buildSpendContext(purchaseOrders) {
  const total = purchaseOrders.reduce((s, po) => s + po.totals.totalAmount, 0);
  return {
    totalOrders: purchaseOrders.length,
    totalSpend: Math.round(total * 100) / 100,
    byStatus: purchaseOrders.reduce((acc, po) => { acc[po.status] = (acc[po.status] || 0) + 1; return acc; }, {}),
    uniqueVendors: new Set(purchaseOrders.map(po => po.vendor.code)).size,
    avgOrderValue: purchaseOrders.length > 0 ? Math.round(total / purchaseOrders.length * 100) / 100 : 0,
    pendingValue: Math.round(purchaseOrders.filter(po => ['pending-approval', 'approved', 'ordered'].includes(po.status)).reduce((s, po) => s + po.totals.totalAmount, 0) * 100) / 100,
  };
}

function approvalContext(po) {
  return {
    poNumber: po.poNumber,
    vendor: po.vendor.name,
    amount: po.totals.totalAmount,
    department: po.buyer.department,
    lineItems: po.lineItems.length,
    existingApprovals: po.approvals.filter(a => a.status === 'approved').length,
    prompt: `PO ${po.poNumber} from ${po.vendor.name} for $${po.totals.totalAmount} ` +
      `(${po.lineItems.length} items) requested by ${po.buyer.name} in ${po.buyer.department}. ` +
      `Payment terms: ${po.terms.paymentTerms}. Required by: ${po.terms.requiredDate || 'not specified'}. ` +
      `Recommend approval action.`,
  };
}

module.exports = { toAIRecord, generateEmbeddingText, extractSignals, buildSpendContext, approvalContext };
