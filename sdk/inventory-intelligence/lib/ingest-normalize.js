/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 1: INGEST-NORMALIZE — Raw Inventory Data Standardizer        ║
 * ║                                                                            ║
 * ║  Cleans and standardizes raw inventory data from warehouse systems,        ║
 * ║  spreadsheets, and free-text logs into canonical schema format.            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');
const { createBlankRecord, createItem, createMovement } = require('./schema');

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

function normalizeQuantity(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const cleaned = value.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeSKU(input) {
  if (!input) return '';
  return input.toString().toUpperCase().replace(/\s+/g, '-').trim();
}

function normalizeUnit(input) {
  if (!input) return 'each';
  const map = {
    'ea': 'each', 'each': 'each', 'pc': 'each', 'pcs': 'each', 'piece': 'each',
    'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
    'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
    'l': 'liter', 'liter': 'liter', 'liters': 'liter', 'lt': 'liter',
    'gal': 'gallon', 'gallon': 'gallon', 'gallons': 'gallon',
    'pallet': 'pallet', 'pallets': 'pallet', 'plt': 'pallet',
    'case': 'case', 'cases': 'case', 'cs': 'case',
    'box': 'box', 'boxes': 'box', 'bx': 'box',
  };
  const lower = input.toString().toLowerCase().trim();
  return map[lower] || lower;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED INPUT INGESTION
// ═══════════════════════════════════════════════════════════════════════════════

function ingestStructured(data) {
  const record = createBlankRecord(data.recordId || data.id);

  // Warehouse
  if (data.warehouse || data.location || data.facility) {
    const wh = data.warehouse || {};
    record.warehouse.name = wh.name || data.location || data.facility || '';
    record.warehouse.code = wh.code || record.warehouse.name.replace(/\s+/g, '-').toUpperCase();
    record.warehouse.zone = wh.zone || data.zone || '';
    record.warehouse.type = wh.type || data.storageType || 'general';
  }

  // Items
  if (Array.isArray(data.items)) {
    record.items = data.items.map(item => ({
      ...createItem(normalizeSKU(item.sku), item.name, item.category, normalizeUnit(item.unit), item.unitCost || item.cost || 0),
      tags: item.tags || [],
      weight: item.weight || 0,
      dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
      expiryDate: item.expiryDate || item.expiry || '',
      lotNumber: item.lotNumber || item.lot || item.batch || '',
    }));
  }

  // Stock levels
  if (data.levels || data.stock) {
    const lvl = data.levels || data.stock || {};
    record.levels.onHand = normalizeQuantity(lvl.onHand || lvl.qty || lvl.quantity || 0);
    record.levels.allocated = normalizeQuantity(lvl.allocated || lvl.reserved || 0);
    record.levels.available = record.levels.onHand - record.levels.allocated;
    record.levels.inTransit = normalizeQuantity(lvl.inTransit || lvl.incoming || 0);
    record.levels.backOrdered = normalizeQuantity(lvl.backOrdered || lvl.backordered || 0);
  }

  // Reorder rules
  if (data.reorder || data.reorderRules) {
    const r = data.reorder || data.reorderRules || {};
    record.reorderRules.reorderPoint = r.reorderPoint || r.rop || 0;
    record.reorderRules.reorderQuantity = r.reorderQuantity || r.roq || r.qty || 0;
    record.reorderRules.safetyStock = r.safetyStock || r.safety || 0;
    record.reorderRules.leadTimeDays = r.leadTimeDays || r.leadTime || 0;
    record.reorderRules.preferredSupplier = r.preferredSupplier || r.supplier || '';
  }

  // Audit
  record.audit.createdAt = new Date().toISOString();
  record.audit.sourceHash = hashInput(JSON.stringify(data));
  record.audit.confidence = 1.0;

  return record;
}

/**
 * Ingest raw text (warehouse reports, spreadsheet dumps, etc.)
 */
function ingestRawText(text) {
  const cleaned = cleanText(text);
  const record = createBlankRecord();

  // Try to extract warehouse/location
  const locMatch = cleaned.match(/(?:Warehouse|Location|Facility)\s*:?\s*(.+)/i);
  if (locMatch) {
    record.warehouse.name = locMatch[1].trim();
    record.warehouse.code = record.warehouse.name.replace(/\s+/g, '-').toUpperCase();
  }

  // Try to extract SKU lines: "SKU-123 | Widget | 500 ea | $12.50"
  const skuLines = cleaned.match(/([A-Z0-9\-]+)\s*[|,]\s*(.+?)\s*[|,]\s*(\d+)\s*(\w+)\s*[|,]?\s*\$?([\d.]+)?/gm);
  if (skuLines) {
    for (const line of skuLines) {
      const parts = line.split(/\s*[|,]\s*/);
      if (parts.length >= 3) {
        const item = createItem(
          normalizeSKU(parts[0]),
          parts[1] || '',
          '',
          normalizeUnit(parts[3] || 'each'),
          parseFloat(parts[4]) || 0
        );
        record.items.push(item);
      }
    }
  }

  // Try to extract quantities
  const qtyMatch = cleaned.match(/(?:On[\s-]?Hand|Quantity|Stock)\s*:?\s*([\d,]+)/i);
  if (qtyMatch) record.levels.onHand = normalizeQuantity(qtyMatch[1]);

  record.audit.sourceHash = hashInput(text);
  record.audit.confidence = computeConfidence(record);
  record.audit.createdBy = 'ingest-normalize/raw-text';

  return record;
}

/**
 * Ingest CSV rows into inventory records
 */
function ingestCSVRows(rows, columnMap = {}) {
  const skuCol = columnMap.sku || 'sku';
  const nameCol = columnMap.name || 'name';
  const qtyCol = columnMap.quantity || 'quantity';
  const costCol = columnMap.cost || 'unit_cost';
  const catCol = columnMap.category || 'category';
  const unitCol = columnMap.unit || 'unit';

  return rows.map(row => createItem(
    normalizeSKU(row[skuCol]),
    row[nameCol] || '',
    row[catCol] || 'uncategorized',
    normalizeUnit(row[unitCol]),
    parseFloat(row[costCol]) || 0
  ));
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function hashInput(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

function computeConfidence(record) {
  let score = 0;
  let checks = 0;
  const check = (val) => { checks++; if (val) score++; };

  check(record.warehouse.name);
  check(record.warehouse.code);
  check(record.items.length > 0);
  check(record.levels.onHand > 0);

  return checks > 0 ? Math.round((score / checks) * 100) / 100 : 0;
}

module.exports = {
  cleanText,
  normalizeQuantity,
  normalizeSKU,
  normalizeUnit,
  ingestStructured,
  ingestRawText,
  ingestCSVRows,
  hashInput,
  computeConfidence,
};
