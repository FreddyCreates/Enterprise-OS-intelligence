/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       PROCUREMENT INTELLIGENCE — CANONICAL SCHEMA v1.0.0                   ║
 * ║                                                                            ║
 * ║  Single source-of-truth data model for all procurement intelligence ops.   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} poNumber - Unique PO identifier
 * @property {string} version - Schema version
 * @property {VendorInfo} vendor - Supplier details
 * @property {BuyerInfo} buyer - Internal buyer/department
 * @property {LineItem[]} lineItems - What's being purchased
 * @property {POTerms} terms - Payment and delivery terms
 * @property {POTotals} totals - Financial totals
 * @property {ApprovalChain[]} approvals - Approval workflow
 * @property {AuditRecord} audit - Metadata
 * @property {string} status - draft | pending-approval | approved | ordered | received | closed | cancelled
 */

/**
 * @typedef {Object} VendorInfo
 * @property {string} name - Vendor company name
 * @property {string} code - Internal vendor code
 * @property {string} [contact] - Primary contact name
 * @property {string} [email] - Contact email
 * @property {string} [phone] - Contact phone
 * @property {string} [category] - Vendor category (materials, services, MRO, etc.)
 * @property {number} [rating] - Vendor performance rating 0-5
 */

/**
 * @typedef {Object} BuyerInfo
 * @property {string} name - Buyer name
 * @property {string} department - Department
 * @property {string} [costCenter] - Cost center code
 * @property {string} [project] - Project allocation
 */

/**
 * @typedef {Object} LineItem
 * @property {number} lineNumber - Line sequence
 * @property {string} description - Item/service description
 * @property {string} [partNumber] - Part number or SKU
 * @property {number} quantity - Ordered quantity
 * @property {string} unit - Unit of measure
 * @property {number} unitPrice - Price per unit
 * @property {number} lineTotal - quantity × unitPrice
 * @property {string} [category] - Spend category
 * @property {string} [deliveryDate] - Expected delivery ISO date
 * @property {number} [receivedQty] - Quantity received so far
 */

/**
 * @typedef {Object} POTerms
 * @property {string} paymentTerms - Net 30, Net 60, etc.
 * @property {string} orderDate - ISO date
 * @property {string} requiredDate - ISO date needed by
 * @property {string} [shippingMethod] - Shipping preference
 * @property {string} [fob] - FOB terms
 * @property {string} [currency] - Currency code
 */

/**
 * @typedef {Object} ApprovalChain
 * @property {string} approver - Who approved
 * @property {string} role - Their role
 * @property {string} status - pending | approved | rejected
 * @property {string} [timestamp] - When they approved
 * @property {string} [comment] - Any comments
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function createBlankPO(poNumber) {
  return {
    poNumber: poNumber || `PO-${Date.now()}`,
    version: '1.0.0',
    vendor: { name: '', code: '', contact: '', email: '', phone: '', category: '', rating: 0 },
    buyer: { name: '', department: '', costCenter: '', project: '' },
    lineItems: [],
    terms: { paymentTerms: 'Net 30', orderDate: '', requiredDate: '', shippingMethod: '', fob: '', currency: 'USD' },
    totals: { subtotal: 0, tax: 0, shipping: 0, discount: 0, totalAmount: 0 },
    approvals: [],
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

function createLineItem(lineNumber, description, quantity, unitPrice, unit) {
  return {
    lineNumber,
    description,
    partNumber: '',
    quantity,
    unit: unit || 'each',
    unitPrice,
    lineTotal: Math.round(quantity * unitPrice * 100) / 100,
    category: '',
    deliveryDate: '',
    receivedQty: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const REQUIRED_FIELDS = ['poNumber', 'vendor.name', 'buyer.name', 'buyer.department', 'terms.orderDate'];

function validateSchema(po) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const parts = field.split('.');
    let val = po;
    for (const p of parts) { val = val ? val[p] : undefined; }
    if (val === undefined || val === '' || val === null) {
      errors.push({ field, message: `Required field "${field}" is missing or empty` });
    }
  }
  if (po.lineItems.length === 0) {
    errors.push({ field: 'lineItems', message: 'Purchase order has no line items' });
  }
  for (let i = 0; i < po.lineItems.length; i++) {
    const li = po.lineItems[i];
    if (li.quantity <= 0) errors.push({ field: `lineItems[${i}].quantity`, message: 'Quantity must be positive' });
    if (li.unitPrice < 0) errors.push({ field: `lineItems[${i}].unitPrice`, message: 'Unit price cannot be negative' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { createBlankPO, createLineItem, validateSchema, REQUIRED_FIELDS };
