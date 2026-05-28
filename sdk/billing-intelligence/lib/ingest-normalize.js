/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 1: INGEST-NORMALIZE — Raw Billing Data Standardizer          ║
 * ║                                                                            ║
 * ║  Cleans and standardizes raw billing text, notes, and structured inputs    ║
 * ║  into the canonical InvoiceSchema format.                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');
const { createBlankInvoice } = require('./schema');

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT CLEANING
// ═══════════════════════════════════════════════════════════════════════════════

function cleanText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

function normalizeCurrency(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeDate(input) {
  if (!input) return '';
  // Handle "May 31, 2026" style
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return '';
}

function normalizeTime(input) {
  if (!input) return '';
  // Handle "7:00 AM" style
  const match = input.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '';
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3];
  if (period) {
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED INPUT INGESTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ingest a structured object (like parsed from the reference code) into schema format
 */
function ingestStructured(data) {
  const invoice = createBlankInvoice(data.invoiceNumber || data.invoiceId);

  // Client
  if (data.billTo || data.client) {
    invoice.client.name = data.billTo || data.client || '';
    invoice.client.code = (data.billTo || data.client || '').replace(/\s+/g, '-').toUpperCase();
  }

  // Project
  if (data.project) {
    invoice.project.name = data.project;
    invoice.project.description = data.description || data.project;
  }
  if (data.servicePeriod) {
    const period = parseServicePeriod(data.servicePeriod);
    invoice.project.servicePeriodStart = period.start;
    invoice.project.servicePeriodEnd = period.end;
  }

  // Rates
  if (data.billRate || data.hourlyRate || data.rate) {
    invoice.rates.hourlyRate = normalizeCurrency(data.billRate || data.hourlyRate || data.rate);
  }
  invoice.rates.currency = data.currency || 'USD';
  if (data.taxRate !== undefined) invoice.rates.taxRate = data.taxRate;

  // Terms
  invoice.terms.paymentTerms = data.terms || data.paymentTerms || 'Net 30';
  invoice.terms.invoiceDate = normalizeDate(data.invoiceDate || '');
  invoice.terms.notes = data.notes || '';

  // Audit
  invoice.audit.createdAt = new Date().toISOString();
  invoice.audit.sourceHash = hashInput(JSON.stringify(data));
  invoice.audit.confidence = 1.0;

  return invoice;
}

/**
 * Ingest raw text notes and attempt structured extraction
 */
function ingestRawText(text) {
  const cleaned = cleanText(text);
  const invoice = createBlankInvoice();

  // Try to extract invoice number
  const invMatch = cleaned.match(/Invoice\s*(?:No\.?|Number|#)\s*:?\s*([A-Z0-9\-]+)/i);
  if (invMatch) invoice.invoiceId = invMatch[1];

  // Try to extract client
  const billToMatch = cleaned.match(/Bill\s*To\s*:?\s*(.+)/i);
  if (billToMatch) {
    invoice.client.name = billToMatch[1].trim();
    invoice.client.code = invoice.client.name.replace(/\s+/g, '-').toUpperCase();
  }

  // Try to extract project
  const projMatch = cleaned.match(/Project\s*:?\s*(.+)/i);
  if (projMatch) invoice.project.name = projMatch[1].trim();

  // Try to extract rate
  const rateMatch = cleaned.match(/\$\s*([\d,.]+)\s*(?:per|\/)\s*(?:labor\s*)?hour/i);
  if (rateMatch) invoice.rates.hourlyRate = normalizeCurrency(rateMatch[1]);

  // Try to extract total
  const totalMatch = cleaned.match(/Total\s*(?:Due)?\s*:?\s*\$\s*([\d,.]+)/i);
  if (totalMatch) invoice.totals.totalDue = normalizeCurrency(totalMatch[1]);

  // Try to extract terms
  const termsMatch = cleaned.match(/Terms?\s*:?\s*(Net\s*\d+|Due\s*on\s*Receipt)/i);
  if (termsMatch) invoice.terms.paymentTerms = termsMatch[1];

  // Date extraction
  const dateMatch = cleaned.match(/Invoice\s*Date\s*:?\s*(.+)/i);
  if (dateMatch) invoice.terms.invoiceDate = normalizeDate(dateMatch[1].trim());

  invoice.audit.sourceHash = hashInput(text);
  invoice.audit.confidence = computeConfidence(invoice);
  invoice.audit.createdBy = 'ingest-normalize/raw-text';

  return invoice;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function parseServicePeriod(str) {
  // "May 23 - May 27, 2026" or "2026-05-23 to 2026-05-27"
  const parts = str.split(/\s*[-–to]+\s*/);
  if (parts.length >= 2) {
    return { start: normalizeDate(parts[0].trim()), end: normalizeDate(parts[parts.length - 1].trim()) };
  }
  return { start: '', end: '' };
}

function hashInput(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function computeConfidence(invoice) {
  let score = 0;
  let checks = 0;
  const check = (val) => { checks++; if (val) score++; };

  check(invoice.invoiceId && invoice.invoiceId !== invoice.invoiceId.startsWith('INV-'));
  check(invoice.client.name);
  check(invoice.project.name);
  check(invoice.rates.hourlyRate > 0);
  check(invoice.terms.invoiceDate);
  check(invoice.totals.totalDue > 0);

  return checks > 0 ? Math.round((score / checks) * 100) / 100 : 0;
}

module.exports = {
  cleanText,
  normalizeCurrency,
  normalizeDate,
  normalizeTime,
  ingestStructured,
  ingestRawText,
  parseServicePeriod,
  hashInput,
  computeConfidence,
};
