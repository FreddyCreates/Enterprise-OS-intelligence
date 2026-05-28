/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 3: PURCHASE ORDERS — PO Lifecycle & Matching                 ║
 * ║                                                                            ║
 * ║  Manages PO workflow, three-way matching (PO vs receipt vs invoice),       ║
 * ║  and fulfillment tracking.                                                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// PO LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_FLOW = ['draft', 'pending-approval', 'approved', 'ordered', 'partially-received', 'received', 'closed', 'cancelled'];

function advanceStatus(po, newStatus, actor) {
  const currentIdx = STATUS_FLOW.indexOf(po.status);
  const newIdx = STATUS_FLOW.indexOf(newStatus);

  if (newStatus === 'cancelled') {
    po.status = 'cancelled';
    po.audit.modifiedAt = new Date().toISOString();
    po.audit.modifiedBy = actor;
    return { success: true, previousStatus: po.status, newStatus };
  }

  if (newIdx <= currentIdx && newStatus !== 'cancelled') {
    return { success: false, error: `Cannot move from "${po.status}" to "${newStatus}"` };
  }

  const previousStatus = po.status;
  po.status = newStatus;
  po.audit.modifiedAt = new Date().toISOString();
  po.audit.modifiedBy = actor;

  return { success: true, previousStatus, newStatus };
}

// ═══════════════════════════════════════════════════════════════════════════════
// THREE-WAY MATCHING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Three-way match: PO ↔ Receipt ↔ Invoice
 * @param {Object} po - Purchase order
 * @param {Object} receipt - Goods receipt (items received with quantities)
 * @param {Object} invoice - Vendor invoice
 * @returns {Object} Match results with discrepancies
 */
function threeWayMatch(po, receipt, invoice) {
  const results = {
    poNumber: po.poNumber,
    matched: true,
    discrepancies: [],
    lineResults: [],
  };

  for (const poLine of po.lineItems) {
    const receiptLine = receipt.lines ? receipt.lines.find(r => r.lineNumber === poLine.lineNumber || r.partNumber === poLine.partNumber) : null;
    const invoiceLine = invoice.lines ? invoice.lines.find(i => i.lineNumber === poLine.lineNumber || i.partNumber === poLine.partNumber) : null;

    const lineResult = {
      lineNumber: poLine.lineNumber,
      description: poLine.description,
      poQty: poLine.quantity,
      poPrice: poLine.unitPrice,
      receivedQty: receiptLine ? receiptLine.quantity : 0,
      invoicedQty: invoiceLine ? invoiceLine.quantity : 0,
      invoicedPrice: invoiceLine ? invoiceLine.unitPrice : 0,
      issues: [],
    };

    // Quantity match
    if (receiptLine && receiptLine.quantity !== poLine.quantity) {
      lineResult.issues.push({
        type: 'quantity_mismatch',
        expected: poLine.quantity,
        actual: receiptLine.quantity,
        variance: receiptLine.quantity - poLine.quantity,
      });
      results.matched = false;
    }

    // Price match (allow 1% tolerance)
    if (invoiceLine && Math.abs(invoiceLine.unitPrice - poLine.unitPrice) / poLine.unitPrice > 0.01) {
      lineResult.issues.push({
        type: 'price_mismatch',
        expected: poLine.unitPrice,
        actual: invoiceLine.unitPrice,
        variance: invoiceLine.unitPrice - poLine.unitPrice,
        variancePercent: Math.round((invoiceLine.unitPrice - poLine.unitPrice) / poLine.unitPrice * 10000) / 100,
      });
      results.matched = false;
    }

    // Missing receipt
    if (!receiptLine) {
      lineResult.issues.push({ type: 'not_received' });
      results.matched = false;
    }

    // Missing invoice
    if (!invoiceLine) {
      lineResult.issues.push({ type: 'not_invoiced' });
    }

    results.lineResults.push(lineResult);
    if (lineResult.issues.length > 0) {
      results.discrepancies.push(...lineResult.issues.map(i => ({ ...i, lineNumber: poLine.lineNumber })));
    }
  }

  // Check totals
  if (invoice.totalAmount && Math.abs(invoice.totalAmount - po.totals.totalAmount) > 0.01) {
    results.discrepancies.push({
      type: 'total_mismatch',
      expected: po.totals.totalAmount,
      actual: invoice.totalAmount,
      variance: invoice.totalAmount - po.totals.totalAmount,
    });
    results.matched = false;
  }

  results.matchScore = results.lineResults.filter(lr => lr.issues.length === 0).length / Math.max(results.lineResults.length, 1);

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULFILLMENT TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Record receipt of goods against a PO
 */
function recordReceipt(po, lineNumber, receivedQty, receivedBy) {
  const line = po.lineItems.find(li => li.lineNumber === lineNumber);
  if (!line) return { success: false, error: `Line ${lineNumber} not found` };

  line.receivedQty = (line.receivedQty || 0) + receivedQty;

  // Update PO status
  const allReceived = po.lineItems.every(li => (li.receivedQty || 0) >= li.quantity);
  const anyReceived = po.lineItems.some(li => (li.receivedQty || 0) > 0);

  if (allReceived) po.status = 'received';
  else if (anyReceived) po.status = 'partially-received';

  po.audit.modifiedAt = new Date().toISOString();
  po.audit.modifiedBy = receivedBy;

  return {
    success: true,
    lineNumber,
    ordered: line.quantity,
    totalReceived: line.receivedQty,
    remaining: Math.max(0, line.quantity - line.receivedQty),
    overReceived: line.receivedQty > line.quantity,
    poStatus: po.status,
  };
}

/**
 * Get fulfillment status for all lines
 */
function fulfillmentStatus(po) {
  return {
    poNumber: po.poNumber,
    status: po.status,
    lines: po.lineItems.map(li => ({
      lineNumber: li.lineNumber,
      description: li.description,
      ordered: li.quantity,
      received: li.receivedQty || 0,
      percentComplete: li.quantity > 0 ? Math.round(((li.receivedQty || 0) / li.quantity) * 10000) / 100 : 0,
      outstanding: Math.max(0, li.quantity - (li.receivedQty || 0)),
    })),
    overallPercent: po.lineItems.length > 0
      ? Math.round(po.lineItems.reduce((s, li) => s + Math.min(1, (li.receivedQty || 0) / li.quantity), 0) / po.lineItems.length * 10000) / 100
      : 0,
  };
}

module.exports = { STATUS_FLOW, advanceStatus, threeWayMatch, recordReceipt, fulfillmentStatus };
