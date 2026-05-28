/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          BILLING INTELLIGENCE — CANONICAL SCHEMA v1.0.0                    ║
 * ║                                                                            ║
 * ║  Single source-of-truth data model for all billing intelligence ops.       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// INVOICE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} InvoiceSchema
 * @property {string} invoiceId - Unique invoice identifier (e.g. "MW-MAY-2026-001")
 * @property {string} version - Schema version for migrations
 * @property {ClientInfo} client - Who is being billed
 * @property {ProjectInfo} project - What project this covers
 * @property {LaborLog[]} laborLogs - Day-level labor entries
 * @property {RateCard} rates - Billing rate configuration
 * @property {TermsInfo} terms - Payment terms and conditions
 * @property {TotalsBlock} totals - Computed totals with audit trace
 * @property {AuditRecord} audit - Creation/modification metadata
 * @property {string} status - draft | validated | finalized | paid | disputed
 */

/**
 * @typedef {Object} ClientInfo
 * @property {string} name - Client display name
 * @property {string} code - Internal client code
 * @property {string} [billingEmail] - Where to send invoices
 * @property {string} [address] - Billing address
 */

/**
 * @typedef {Object} ProjectInfo
 * @property {string} name - Project name (e.g. "Relocation Labor")
 * @property {string} [code] - Internal project code
 * @property {string} description - What was done
 * @property {string} servicePeriodStart - ISO date
 * @property {string} servicePeriodEnd - ISO date
 */

/**
 * @typedef {Object} LaborEntry
 * @property {string} worker - Worker name or "crew"
 * @property {number} count - Number of workers (1 for named, N for crew)
 * @property {string} startTime - HH:MM (24h)
 * @property {string} endTime - HH:MM (24h)
 * @property {number} hours - Computed decimal hours
 * @property {string} [note] - Additional context
 */

/**
 * @typedef {Object} LaborLog
 * @property {string} date - ISO date (YYYY-MM-DD)
 * @property {string} dayOfWeek - Monday, Tuesday, etc.
 * @property {LaborEntry[]} entries - Individual worker/crew entries
 * @property {number} dayTotalHours - Sum of all entry hours for this day
 */

/**
 * @typedef {Object} RateCard
 * @property {number} hourlyRate - Base rate per hour in dollars
 * @property {string} currency - USD, etc.
 * @property {number} [overtimeMultiplier] - e.g. 1.5 for time-and-a-half
 * @property {number} [overtimeThresholdHours] - Hours per day before OT kicks in
 * @property {number} [minimumHours] - Minimum billable hours per call-out
 * @property {number} [taxRate] - Tax rate as decimal (0.0825 = 8.25%)
 * @property {Object[]} [discounts] - Applied discounts
 */

/**
 * @typedef {Object} TermsInfo
 * @property {string} paymentTerms - "Net 30", "Due on Receipt", etc.
 * @property {string} invoiceDate - ISO date when invoice was issued
 * @property {string} dueDate - ISO date when payment is due
 * @property {string} [notes] - Free-text notes for recipient
 */

/**
 * @typedef {Object} TotalsBlock
 * @property {number} totalHours - Sum of all labor hours
 * @property {number} subtotal - hours × rate
 * @property {number} taxAmount - Computed tax
 * @property {number} discountAmount - Sum of discounts applied
 * @property {number} totalDue - Final amount owed
 * @property {CalculationTrace[]} trace - Step-by-step computation log
 */

/**
 * @typedef {Object} CalculationTrace
 * @property {string} step - Human-readable step name
 * @property {string} formula - How it was computed
 * @property {number} result - Numeric result of this step
 */

/**
 * @typedef {Object} AuditRecord
 * @property {string} createdAt - ISO timestamp
 * @property {string} createdBy - Who/what created this
 * @property {string} [modifiedAt] - Last modification ISO timestamp
 * @property {string} [modifiedBy] - Who/what last modified
 * @property {string} sourceHash - SHA-256 of raw input data
 * @property {number} confidence - 0.0-1.0 confidence in data accuracy
 * @property {string[]} warnings - Any issues detected during processing
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function createBlankInvoice(invoiceId) {
  return {
    invoiceId: invoiceId || `INV-${Date.now()}`,
    version: '1.0.0',
    client: { name: '', code: '', billingEmail: '', address: '' },
    project: { name: '', code: '', description: '', servicePeriodStart: '', servicePeriodEnd: '' },
    laborLogs: [],
    rates: { hourlyRate: 0, currency: 'USD', taxRate: 0 },
    terms: { paymentTerms: 'Net 30', invoiceDate: '', dueDate: '', notes: '' },
    totals: { totalHours: 0, subtotal: 0, taxAmount: 0, discountAmount: 0, totalDue: 0, trace: [] },
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      sourceHash: '',
      confidence: 0,
      warnings: [],
    },
    status: 'draft',
  };
}

function createLaborEntry(worker, count, startTime, endTime, hours, note) {
  return { worker, count, startTime, endTime, hours, note: note || '' };
}

function createLaborLog(date, dayOfWeek, entries) {
  const dayTotalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  return { date, dayOfWeek, entries, dayTotalHours };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const REQUIRED_FIELDS = [
  'invoiceId', 'client.name', 'project.name', 'project.servicePeriodStart',
  'project.servicePeriodEnd', 'rates.hourlyRate', 'terms.paymentTerms', 'terms.invoiceDate',
];

function validateSchema(invoice) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const parts = field.split('.');
    let val = invoice;
    for (const p of parts) {
      val = val ? val[p] : undefined;
    }
    if (val === undefined || val === '' || val === null) {
      errors.push({ field, message: `Required field "${field}" is missing or empty` });
    }
  }
  if (invoice.rates && invoice.rates.hourlyRate < 0) {
    errors.push({ field: 'rates.hourlyRate', message: 'Hourly rate cannot be negative' });
  }
  if (invoice.laborLogs) {
    for (let i = 0; i < invoice.laborLogs.length; i++) {
      const log = invoice.laborLogs[i];
      if (!log.date) errors.push({ field: `laborLogs[${i}].date`, message: 'Labor log missing date' });
      if (!log.entries || log.entries.length === 0) {
        errors.push({ field: `laborLogs[${i}].entries`, message: 'Labor log has no entries' });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  createBlankInvoice,
  createLaborEntry,
  createLaborLog,
  validateSchema,
  REQUIRED_FIELDS,
};
