/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OUTPUT FORMATS — Multi-Format Export for Procurement Data            ║
 * ║                                                                            ║
 * ║  JSON, CSV, API payloads, markdown reports, and embeddings-ready text      ║
 * ║  blocks for downstream intelligence systems.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// JSON OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export PO as clean JSON.
 */
function toJSON(po, options = {}) {
  const data = options.compact ? {
    poNumber: po.poNumber,
    vendor: po.vendor.name,
    buyer: po.buyer.name,
    department: po.buyer.department,
    total: po.totals.totalAmount,
    status: po.status,
    lineItems: po.lineItems.length,
    orderDate: po.terms.orderDate,
  } : JSON.parse(JSON.stringify(po));

  return options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export POs as CSV rows.
 */
function toCSV(pos, options = {}) {
  const arr = Array.isArray(pos) ? pos : [pos];
  const delimiter = options.delimiter || ',';

  const headers = [
    'po_number', 'vendor', 'vendor_code', 'buyer', 'department',
    'line_items', 'subtotal', 'tax', 'shipping', 'total_amount',
    'status', 'order_date', 'required_date', 'payment_terms', 'confidence',
  ];

  const rows = arr.map(po => [
    po.poNumber,
    escapeCSV(po.vendor.name),
    po.vendor.code || '',
    escapeCSV(po.buyer.name),
    escapeCSV(po.buyer.department),
    po.lineItems.length,
    po.totals.subtotal,
    po.totals.tax,
    po.totals.shipping || 0,
    po.totals.totalAmount,
    po.status,
    po.terms.orderDate,
    po.terms.requiredDate || '',
    po.terms.paymentTerms || '',
    po.audit.confidence || '',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export line items as CSV.
 */
function lineItemsToCSV(po, options = {}) {
  const delimiter = options.delimiter || ',';
  const headers = [
    'po_number', 'line', 'description', 'part_number', 'category',
    'quantity', 'unit', 'unit_price', 'line_total', 'received_qty', 'status',
  ];

  const rows = po.lineItems.map(li => [
    po.poNumber,
    li.lineNumber,
    escapeCSV(li.description),
    li.partNumber || '',
    escapeCSV(li.category || ''),
    li.quantity,
    li.unit || 'EA',
    li.unitPrice,
    li.lineTotal,
    li.receivedQty || 0,
    li.status || 'open',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export vendor performance as CSV.
 */
function vendorToCSV(vendors, options = {}) {
  const arr = Array.isArray(vendors) ? vendors : [vendors];
  const delimiter = options.delimiter || ',';

  const headers = ['vendor_code', 'vendor_name', 'category', 'score', 'on_time_pct', 'quality_pct', 'total_orders', 'total_spend'];
  const rows = arr.map(v => [
    v.code,
    escapeCSV(v.name),
    escapeCSV(v.category || ''),
    v.score || '',
    v.onTimePercent || '',
    v.qualityPercent || '',
    v.totalOrders || 0,
    v.totalSpend || 0,
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// API PAYLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate an API-ready payload (for webhooks, integrations, ERP systems).
 */
function toAPIPayload(po, options = {}) {
  return {
    event: options.event || 'purchase_order.updated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      po_number: po.poNumber,
      vendor: {
        name: po.vendor.name,
        code: po.vendor.code,
      },
      buyer: {
        name: po.buyer.name,
        department: po.buyer.department,
        email: po.buyer.email || '',
      },
      totals: {
        subtotal: po.totals.subtotal,
        tax: po.totals.tax,
        shipping: po.totals.shipping || 0,
        total_amount: po.totals.totalAmount,
        currency: po.totals.currency || 'USD',
      },
      line_items: po.lineItems.length,
      status: po.status,
      terms: {
        order_date: po.terms.orderDate,
        required_date: po.terms.requiredDate || null,
        payment_terms: po.terms.paymentTerms,
      },
      approvals: po.approvals.length,
      metadata: {
        confidence: po.audit.confidence,
        source_hash: po.audit.sourceHash,
        warnings: po.audit.warnings || [],
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN REPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a human-readable markdown report for a PO.
 */
function toMarkdown(po) {
  const lines = [
    `# Purchase Order ${po.poNumber}`,
    '',
    `**Status:** ${po.status}`,
    `**Order Date:** ${po.terms.orderDate}`,
    `**Required Date:** ${po.terms.requiredDate || 'TBD'}`,
    '',
    '## Vendor',
    `- **Name:** ${po.vendor.name}`,
    `- **Code:** ${po.vendor.code || 'N/A'}`,
    `- **Contact:** ${po.vendor.contact || 'N/A'}`,
    '',
    '## Buyer',
    `- **Name:** ${po.buyer.name}`,
    `- **Department:** ${po.buyer.department}`,
    '',
    '## Line Items',
    '| # | Description | Part # | Qty | Unit Price | Total |',
    '|:---|:---|:---|---:|---:|---:|',
  ];

  for (const li of po.lineItems) {
    lines.push(`| ${li.lineNumber} | ${li.description} | ${li.partNumber || ''} | ${li.quantity} | $${li.unitPrice} | $${li.lineTotal} |`);
  }

  lines.push('');
  lines.push('## Totals');
  lines.push(`| Item | Amount |`);
  lines.push(`|:---|---:|`);
  lines.push(`| Subtotal | $${po.totals.subtotal} |`);
  lines.push(`| Tax | $${po.totals.tax} |`);
  lines.push(`| Shipping | $${po.totals.shipping || 0} |`);
  lines.push(`| **Total** | **$${po.totals.totalAmount}** |`);
  lines.push('');
  lines.push('## Approvals');

  if (po.approvals.length > 0) {
    lines.push('| Approver | Role | Status | Date |');
    lines.push('|:---|:---|:---|:---|');
    for (const a of po.approvals) {
      lines.push(`| ${a.approver} | ${a.role} | ${a.status} | ${a.timestamp} |`);
    }
  } else {
    lines.push('_No approvals recorded._');
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDINGS-READY TEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate text blocks optimized for vector embedding systems.
 */
function toEmbeddingBlocks(po) {
  const blocks = [];

  // Block 1: Overview
  blocks.push({
    blockType: 'overview',
    text: `Purchase Order ${po.poNumber} from vendor ${po.vendor.name} (${po.vendor.code || 'N/A'}). ` +
      `Total: $${po.totals.totalAmount}. Status: ${po.status}. ` +
      `Buyer: ${po.buyer.name}, dept: ${po.buyer.department}. ` +
      `${po.lineItems.length} line items. Order date: ${po.terms.orderDate}.`,
    metadata: { poNumber: po.poNumber, section: 'overview' },
  });

  // Block 2: Line items detail
  if (po.lineItems.length > 0) {
    blocks.push({
      blockType: 'items',
      text: po.lineItems.map(li =>
        `Line ${li.lineNumber}: ${li.description} (${li.partNumber || 'no part#'}) qty:${li.quantity} @$${li.unitPrice} = $${li.lineTotal}`
      ).join('. '),
      metadata: { poNumber: po.poNumber, section: 'items' },
    });
  }

  // Block 3: Terms and approvals
  blocks.push({
    blockType: 'terms',
    text: `Payment: ${po.terms.paymentTerms || 'N/A'}. Order date: ${po.terms.orderDate}. ` +
      `Required: ${po.terms.requiredDate || 'TBD'}. ` +
      `Approvals: ${po.approvals.length > 0 ? po.approvals.map(a => `${a.approver} (${a.status})`).join(', ') : 'none'}.`,
    metadata: { poNumber: po.poNumber, section: 'terms' },
  });

  return blocks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

module.exports = {
  toJSON,
  toCSV,
  lineItemsToCSV,
  vendorToCSV,
  toAPIPayload,
  toMarkdown,
  toEmbeddingBlocks,
};
