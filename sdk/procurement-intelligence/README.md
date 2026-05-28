# Procurement Intelligence SDK v1.0.0

Enterprise procurement data pipeline — ingest raw PO/vendor data, score suppliers, manage PO lifecycle, analyze spend, validate, store versioned records, and package for AI consumption.

## Architecture

```
Raw Data (PO forms/ERP exports/text)
    │
    ▼
┌─────────────────────────┐
│  1. ingest-normalize     │  ← Clean & standardize inputs
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  2. vendor-intelligence  │  ← Score, risk-assess, compare vendors
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  3. purchase-orders      │  ← Lifecycle, 3-way matching, fulfillment
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  4. spend-analytics      │  ← Category/vendor/dept spend + anomalies
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  validation-gates        │  ← Quality checks
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  5. procurement-ledger   │  ← Versioned store + approval workflow
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  6. ai-procurement-ctx   │  ← AI-ready records, spend context, prompts
└─────────────────────────┘
```

## Quick Start

```js
const procurement = require('@medina/procurement-intelligence');

const result = procurement.processPipeline({
  poNumber: 'PO-2026-0042',
  vendor: { name: 'Acme Supplies', code: 'ACME', category: 'materials' },
  buyer: { name: 'John Smith', department: 'Operations', costCenter: 'CC-100' },
  lineItems: [
    { description: 'Steel Bolts M10', quantity: 500, unitPrice: 0.45, unit: 'each', category: 'fasteners' },
    { description: 'Safety Gloves', quantity: 50, unitPrice: 12.99, unit: 'pair', category: 'PPE' },
  ],
  orderDate: '2026-05-28',
  requiredDate: '2026-06-15',
  paymentTerms: 'Net 30',
});

console.log(result.po.totals.totalAmount);       // Computed total
console.log(result.confidence.grade);             // A, B, C, D
console.log(result.aiRecord.embedding_text);      // For vector DB
```

## Libraries

### 1. ingest-normalize
Standardizes raw PO data from ERP exports, forms, and free-text.

### 2. vendor-intelligence
Vendor scoring (delivery, quality, price, responsiveness), risk assessment, comparison.

### 3. purchase-orders
PO lifecycle management, three-way matching (PO/Receipt/Invoice), fulfillment tracking.

### 4. spend-analytics
Spend aggregation by vendor/category/dept/month, anomaly detection, budget tracking.

### 5. procurement-ledger
Versioned PO store with approval workflow (approve/reject).

### 6. ai-procurement-context
AI-ready records, spend context, approval prompts.
