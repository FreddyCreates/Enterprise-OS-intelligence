/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       INVENTORY INTELLIGENCE — CANONICAL SCHEMA v1.0.0                     ║
 * ║                                                                            ║
 * ║  Single source-of-truth data model for all inventory intelligence ops.     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY ITEM SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} InventoryRecord
 * @property {string} recordId - Unique inventory record ID
 * @property {string} version - Schema version
 * @property {WarehouseInfo} warehouse - Location/facility info
 * @property {ItemInfo[]} items - Items in this record
 * @property {MovementLog[]} movements - Stock movements (in/out/transfer)
 * @property {StockLevels} levels - Current stock state
 * @property {ReorderRules} reorderRules - Automated reorder thresholds
 * @property {AuditRecord} audit - Creation/modification metadata
 * @property {string} status - active | depleted | overstocked | archived
 */

/**
 * @typedef {Object} WarehouseInfo
 * @property {string} name - Warehouse/facility name
 * @property {string} code - Internal location code
 * @property {string} zone - Storage zone (A1, B2, etc.)
 * @property {string} [address] - Physical address
 * @property {string} [type] - cold-storage | dry | hazmat | general
 */

/**
 * @typedef {Object} ItemInfo
 * @property {string} sku - Stock Keeping Unit identifier
 * @property {string} name - Human-readable item name
 * @property {string} category - Classification category
 * @property {string[]} tags - Searchable tags
 * @property {string} unit - Unit of measurement (each, kg, liter, pallet)
 * @property {number} unitCost - Cost per unit
 * @property {string} currency - USD, etc.
 * @property {number} weight - Weight per unit in kg
 * @property {Object} dimensions - { length, width, height } in cm
 * @property {string} [expiryDate] - ISO date for perishables
 * @property {string} [lotNumber] - Batch/lot tracking
 */

/**
 * @typedef {Object} MovementLog
 * @property {string} movementId - Unique movement identifier
 * @property {string} timestamp - ISO timestamp
 * @property {string} type - inbound | outbound | transfer | adjustment | return
 * @property {string} sku - Which item moved
 * @property {number} quantity - How many units
 * @property {string} [fromLocation] - Source location
 * @property {string} [toLocation] - Destination location
 * @property {string} [reference] - PO number, SO number, etc.
 * @property {string} [reason] - Why the movement happened
 * @property {string} performedBy - Who/what initiated
 */

/**
 * @typedef {Object} StockLevels
 * @property {number} onHand - Currently in warehouse
 * @property {number} allocated - Reserved for orders
 * @property {number} available - onHand - allocated
 * @property {number} inTransit - On the way in
 * @property {number} backOrdered - Owed to customers
 */

/**
 * @typedef {Object} ReorderRules
 * @property {number} reorderPoint - Trigger level for reorder
 * @property {number} reorderQuantity - How much to order
 * @property {number} safetyStock - Minimum buffer
 * @property {number} leadTimeDays - Supplier lead time
 * @property {string} [preferredSupplier] - Default vendor
 */

/**
 * @typedef {Object} AuditRecord
 * @property {string} createdAt - ISO timestamp
 * @property {string} createdBy - Who/what created this
 * @property {string} [modifiedAt] - Last modification
 * @property {string} sourceHash - SHA-256 of raw input
 * @property {number} confidence - 0.0-1.0 confidence
 * @property {string[]} warnings - Issues detected
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function createBlankRecord(recordId) {
  return {
    recordId: recordId || `INV-${Date.now()}`,
    version: '1.0.0',
    warehouse: { name: '', code: '', zone: '', address: '', type: 'general' },
    items: [],
    movements: [],
    levels: { onHand: 0, allocated: 0, available: 0, inTransit: 0, backOrdered: 0 },
    reorderRules: { reorderPoint: 0, reorderQuantity: 0, safetyStock: 0, leadTimeDays: 0 },
    audit: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      sourceHash: '',
      confidence: 0,
      warnings: [],
    },
    status: 'active',
  };
}

function createItem(sku, name, category, unit, unitCost) {
  return {
    sku,
    name,
    category,
    tags: [],
    unit: unit || 'each',
    unitCost: unitCost || 0,
    currency: 'USD',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    expiryDate: '',
    lotNumber: '',
  };
}

function createMovement(type, sku, quantity, performedBy, reference) {
  return {
    movementId: `MOV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type,
    sku,
    quantity,
    fromLocation: '',
    toLocation: '',
    reference: reference || '',
    reason: '',
    performedBy: performedBy || 'system',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const REQUIRED_FIELDS = [
  'recordId', 'warehouse.name', 'warehouse.code',
];

function validateSchema(record) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const parts = field.split('.');
    let val = record;
    for (const p of parts) {
      val = val ? val[p] : undefined;
    }
    if (val === undefined || val === '' || val === null) {
      errors.push({ field, message: `Required field "${field}" is missing or empty` });
    }
  }
  if (record.items) {
    for (let i = 0; i < record.items.length; i++) {
      const item = record.items[i];
      if (!item.sku) errors.push({ field: `items[${i}].sku`, message: 'Item missing SKU' });
      if (!item.name) errors.push({ field: `items[${i}].name`, message: 'Item missing name' });
      if (item.unitCost < 0) errors.push({ field: `items[${i}].unitCost`, message: 'Unit cost cannot be negative' });
    }
  }
  if (record.levels && record.levels.onHand < 0) {
    errors.push({ field: 'levels.onHand', message: 'On-hand quantity cannot be negative' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  createBlankRecord,
  createItem,
  createMovement,
  validateSchema,
  REQUIRED_FIELDS,
};
