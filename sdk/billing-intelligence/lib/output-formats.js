/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OUTPUT FORMATS — Multi-Format Export Engine                           ║
 * ║                                                                            ║
 * ║  JSON, CSV, API payloads, and embeddings-ready text blocks for             ║
 * ║  downstream intelligence systems.                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { toAIRecord, generateEmbeddingText } = require('./ai-billing-context');

// ═══════════════════════════════════════════════════════════════════════════════
// JSON OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export invoice as clean JSON (for API consumption or storage).
 */
function toJSON(invoice, options = {}) {
  const output = options.compact
    ? {
        id: invoice.invoiceId,
        client: invoice.client.name,
        project: invoice.project.name,
        period: `${invoice.project.servicePeriodStart} to ${invoice.project.servicePeriodEnd}`,
        hours: invoice.totals.totalHours,
        rate: invoice.rates.hourlyRate,
        total: invoice.totals.totalDue,
        status: invoice.status,
        date: invoice.terms.invoiceDate,
      }
    : JSON.parse(JSON.stringify(invoice));

  return options.pretty
    ? JSON.stringify(output, null, 2)
    : JSON.stringify(output);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export invoice as CSV rows (header + data).
 */
function toCSV(invoices, options = {}) {
  if (!Array.isArray(invoices)) invoices = [invoices];
  const delimiter = options.delimiter || ',';

  const headers = [
    'invoice_id', 'client', 'client_code', 'project', 'service_start', 'service_end',
    'total_hours', 'hourly_rate', 'subtotal', 'tax', 'total_due', 'status',
    'invoice_date', 'payment_terms', 'labor_days', 'confidence',
  ];

  const rows = invoices.map(inv => [
    inv.invoiceId,
    escapeCSV(inv.client.name),
    inv.client.code,
    escapeCSV(inv.project.name),
    inv.project.servicePeriodStart,
    inv.project.servicePeriodEnd,
    inv.totals.totalHours,
    inv.rates.hourlyRate,
    inv.totals.subtotal,
    inv.totals.taxAmount,
    inv.totals.totalDue,
    inv.status,
    inv.terms.invoiceDate,
    inv.terms.paymentTerms,
    inv.laborLogs.length,
    inv.audit.confidence,
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }

  return lines.join('\n');
}

/**
 * Export labor details as CSV.
 */
function laborToCSV(invoices, options = {}) {
  if (!Array.isArray(invoices)) invoices = [invoices];
  const delimiter = options.delimiter || ',';

  const headers = [
    'invoice_id', 'date', 'day_of_week', 'worker', 'crew_count',
    'start_time', 'end_time', 'hours', 'day_total',
  ];

  const rows = [];
  for (const inv of invoices) {
    for (const log of inv.laborLogs) {
      for (const entry of log.entries) {
        rows.push([
          inv.invoiceId, log.date, log.dayOfWeek, entry.worker, entry.count,
          entry.startTime, entry.endTime, entry.hours, log.dayTotalHours,
        ]);
      }
    }
  }

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
 * Generate an API-ready payload (for webhooks, integrations, CRMs).
 */
function toAPIPayload(invoice, options = {}) {
  return {
    event: options.event || 'invoice.created',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      invoice_id: invoice.invoiceId,
      client: {
        name: invoice.client.name,
        code: invoice.client.code,
        email: invoice.client.billingEmail,
      },
      project: {
        name: invoice.project.name,
        description: invoice.project.description,
        period_start: invoice.project.servicePeriodStart,
        period_end: invoice.project.servicePeriodEnd,
      },
      billing: {
        total_hours: invoice.totals.totalHours,
        hourly_rate: invoice.rates.hourlyRate,
        currency: invoice.rates.currency,
        subtotal: invoice.totals.subtotal,
        tax: invoice.totals.taxAmount,
        total_due: invoice.totals.totalDue,
      },
      terms: {
        payment_terms: invoice.terms.paymentTerms,
        invoice_date: invoice.terms.invoiceDate,
        due_date: invoice.terms.dueDate,
      },
      status: invoice.status,
      metadata: {
        confidence: invoice.audit.confidence,
        source_hash: invoice.audit.sourceHash,
        warnings: invoice.audit.warnings,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDINGS-READY TEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate text blocks optimized for vector embedding systems.
 */
function toEmbeddingBlocks(invoice) {
  const blocks = [];

  // Block 1: Summary (for broad semantic search)
  blocks.push({
    type: 'summary',
    text: generateEmbeddingText(invoice),
    metadata: { invoiceId: invoice.invoiceId, section: 'summary' },
  });

  // Block 2: Labor detail (for shift/crew queries)
  if (invoice.laborLogs.length > 0) {
    const laborText = invoice.laborLogs.map(log => {
      const entries = log.entries.map(e =>
        `${e.worker === 'crew' ? `${e.count} crew` : e.worker}: ${e.startTime}-${e.endTime}, ${e.hours} hours`
      ).join('. ');
      return `${log.dayOfWeek} ${log.date}: ${entries}. Day total: ${log.dayTotalHours} hours.`;
    }).join(' ');
    blocks.push({
      type: 'labor_detail',
      text: laborText,
      metadata: { invoiceId: invoice.invoiceId, section: 'labor' },
    });
  }

  // Block 3: Financial (for cost/billing queries)
  const financialText = [
    `Invoice ${invoice.invoiceId}: ${invoice.totals.totalHours} labor hours at $${invoice.rates.hourlyRate}/hour.`,
    `Subtotal: $${invoice.totals.subtotal}. Tax: $${invoice.totals.taxAmount}. Total due: $${invoice.totals.totalDue}.`,
    `Payment terms: ${invoice.terms.paymentTerms}. Status: ${invoice.status}.`,
  ].join(' ');
  blocks.push({
    type: 'financial',
    text: financialText,
    metadata: { invoiceId: invoice.invoiceId, section: 'financial' },
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
  laborToCSV,
  toAPIPayload,
  toEmbeddingBlocks,
};
