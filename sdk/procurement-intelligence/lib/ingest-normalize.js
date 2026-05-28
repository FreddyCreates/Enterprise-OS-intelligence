/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 1: INGEST-NORMALIZE — Raw Procurement Data Standardizer      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');
const { createBlankPO, createLineItem } = require('./schema');

function cleanText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').replace(/^\s+|\s+$/gm, '').trim();
}

function normalizeCurrency(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const num = parseFloat(value.replace(/[$,\s]/g, ''));
  return isNaN(num) ? 0 : num;
}

function normalizeDate(input) {
  if (!input) return '';
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return '';
}

function ingestStructured(data) {
  const po = createBlankPO(data.poNumber || data.po || data.id);

  // Vendor
  if (data.vendor || data.supplier) {
    const v = data.vendor || data.supplier || {};
    if (typeof v === 'string') {
      po.vendor.name = v;
      po.vendor.code = v.replace(/\s+/g, '-').toUpperCase();
    } else {
      po.vendor.name = v.name || '';
      po.vendor.code = v.code || po.vendor.name.replace(/\s+/g, '-').toUpperCase();
      po.vendor.contact = v.contact || '';
      po.vendor.email = v.email || '';
      po.vendor.category = v.category || '';
      po.vendor.rating = v.rating || 0;
    }
  }

  // Buyer
  if (data.buyer || data.requestor) {
    const b = data.buyer || data.requestor || {};
    if (typeof b === 'string') {
      po.buyer.name = b;
    } else {
      po.buyer.name = b.name || '';
      po.buyer.department = b.department || data.department || '';
      po.buyer.costCenter = b.costCenter || data.costCenter || '';
      po.buyer.project = b.project || data.project || '';
    }
  }

  // Line items
  if (Array.isArray(data.lineItems || data.items || data.lines)) {
    const items = data.lineItems || data.items || data.lines;
    po.lineItems = items.map((item, i) => createLineItem(
      item.lineNumber || i + 1,
      item.description || item.name || '',
      parseFloat(item.quantity || item.qty || 0) || 0,
      normalizeCurrency(item.unitPrice || item.price || item.cost || 0),
      item.unit || 'each'
    ));
    // Enrich with additional fields
    po.lineItems.forEach((li, i) => {
      const src = items[i];
      li.partNumber = src.partNumber || src.sku || '';
      li.category = src.category || '';
      li.deliveryDate = normalizeDate(src.deliveryDate || src.needBy || '');
    });
  }

  // Terms
  po.terms.paymentTerms = data.paymentTerms || data.terms || 'Net 30';
  po.terms.orderDate = normalizeDate(data.orderDate || data.date || '');
  po.terms.requiredDate = normalizeDate(data.requiredDate || data.needBy || '');
  po.terms.shippingMethod = data.shippingMethod || '';
  po.terms.currency = data.currency || 'USD';

  // Compute totals
  po.totals.subtotal = po.lineItems.reduce((s, li) => s + li.lineTotal, 0);
  po.totals.tax = normalizeCurrency(data.tax || 0);
  po.totals.shipping = normalizeCurrency(data.shipping || data.freight || 0);
  po.totals.discount = normalizeCurrency(data.discount || 0);
  po.totals.totalAmount = po.totals.subtotal + po.totals.tax + po.totals.shipping - po.totals.discount;

  po.status = data.status || 'draft';
  po.audit.createdAt = new Date().toISOString();
  po.audit.sourceHash = hashInput(JSON.stringify(data));
  po.audit.confidence = 1.0;

  return po;
}

function ingestRawText(text) {
  const cleaned = cleanText(text);
  const po = createBlankPO();

  const poMatch = cleaned.match(/(?:PO|Purchase Order)\s*(?:No\.?|Number|#)\s*:?\s*([A-Z0-9\-]+)/i);
  if (poMatch) po.poNumber = poMatch[1];

  const vendorMatch = cleaned.match(/(?:Vendor|Supplier)\s*:?\s*(.+)/i);
  if (vendorMatch) { po.vendor.name = vendorMatch[1].trim(); po.vendor.code = po.vendor.name.replace(/\s+/g, '-').toUpperCase(); }

  const buyerMatch = cleaned.match(/(?:Buyer|Requestor|Ordered By)\s*:?\s*(.+)/i);
  if (buyerMatch) po.buyer.name = buyerMatch[1].trim();

  const deptMatch = cleaned.match(/(?:Department|Dept)\s*:?\s*(.+)/i);
  if (deptMatch) po.buyer.department = deptMatch[1].trim();

  const totalMatch = cleaned.match(/Total\s*(?:Amount)?\s*:?\s*\$?\s*([\d,.]+)/i);
  if (totalMatch) po.totals.totalAmount = normalizeCurrency(totalMatch[1]);

  po.audit.sourceHash = hashInput(text);
  po.audit.confidence = computeConfidence(po);
  po.audit.createdBy = 'ingest-normalize/raw-text';

  return po;
}

function hashInput(str) { return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16); }

function computeConfidence(po) {
  let score = 0, checks = 0;
  const check = (val) => { checks++; if (val) score++; };
  check(po.vendor.name);
  check(po.buyer.name);
  check(po.lineItems.length > 0);
  check(po.totals.totalAmount > 0);
  check(po.terms.orderDate);
  return checks > 0 ? Math.round((score / checks) * 100) / 100 : 0;
}

module.exports = { cleanText, normalizeCurrency, normalizeDate, ingestStructured, ingestRawText, hashInput, computeConfidence };
