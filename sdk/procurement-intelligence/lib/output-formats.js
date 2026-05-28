'use strict';

function toJSON(po, options = {}) { return options.pretty ? JSON.stringify(po, null, 2) : JSON.stringify(po); }

function toCSV(pos) {
  const arr = Array.isArray(pos) ? pos : [pos];
  const header = 'po_number,vendor,buyer,department,line_items,subtotal,tax,total,status,order_date';
  const rows = arr.map(po => `${po.poNumber},${po.vendor.name},${po.buyer.name},${po.buyer.department},${po.lineItems.length},${po.totals.subtotal},${po.totals.tax},${po.totals.totalAmount},${po.status},${po.terms.orderDate}`);
  return [header, ...rows].join('\n');
}

function lineItemsToCSV(po) {
  const header = 'line,description,part_number,qty,unit,unit_price,line_total,category,received';
  const rows = po.lineItems.map(li => `${li.lineNumber},${li.description},${li.partNumber},${li.quantity},${li.unit},${li.unitPrice},${li.lineTotal},${li.category},${li.receivedQty || 0}`);
  return [header, ...rows].join('\n');
}

function toAPIPayload(po) {
  return {
    type: 'purchase_order_update',
    version: '1.0',
    timestamp: new Date().toISOString(),
    payload: { poNumber: po.poNumber, vendor: po.vendor.name, status: po.status, total: po.totals.totalAmount, lineItems: po.lineItems.length },
  };
}

function toEmbeddingBlocks(po) {
  return [
    { blockType: 'overview', text: `PO ${po.poNumber} from ${po.vendor.name} for $${po.totals.totalAmount}. Status: ${po.status}. Dept: ${po.buyer.department}.` },
    { blockType: 'items', text: po.lineItems.map(li => `${li.description} qty:${li.quantity} @$${li.unitPrice}`).join('. ') },
    { blockType: 'terms', text: `Payment: ${po.terms.paymentTerms}. Order date: ${po.terms.orderDate}. Required: ${po.terms.requiredDate || 'TBD'}.` },
  ];
}

module.exports = { toJSON, toCSV, lineItemsToCSV, toAPIPayload, toEmbeddingBlocks };
