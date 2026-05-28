# Inventory Intelligence SDK v1.0.0

Enterprise inventory data pipeline — ingest raw warehouse data, classify items, track stock movements, forecast demand, validate, store versioned records, and package everything for AI consumption.

## Architecture

```
Raw Data (text/structured/CSV)
    │
    ▼
┌─────────────────────────┐
│  1. ingest-normalize     │  ← Clean & standardize inputs
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  2. item-classification  │  ← ABC, velocity, perishability, hazard
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  3. stock-tracking       │  ← Movements, levels, reorder alerts
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  4. demand-forecast      │  ← Patterns, trends, predictions
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  validation-gates        │  ← Quality checks before finalization
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  5. inventory-ledger     │  ← Versioned storage + cycle counts
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  6. ai-inventory-ctx     │  ← AI-ready records, embeddings, signals
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  output-formats          │  ← JSON, CSV, API, embeddings
└─────────────────────────┘
```

## Quick Start

```js
const inventory = require('@medina/inventory-intelligence');

const result = inventory.processPipeline(
  {
    warehouse: { name: 'Austin DC-1', code: 'ATX-DC1', zone: 'A', type: 'general' },
    items: [
      { sku: 'WDG-001', name: 'Steel Widget', category: 'hardware', unit: 'each', unitCost: 12.50 },
      { sku: 'BLT-003', name: 'Hex Bolt M10', category: 'fasteners', unit: 'box', unitCost: 8.75 },
    ],
    levels: { onHand: 1500, allocated: 200, inTransit: 500 },
    reorder: { reorderPoint: 300, reorderQuantity: 1000, safetyStock: 100, leadTimeDays: 7 },
  },
  [
    { sku: 'WDG-001', type: 'outbound', quantity: 50, timestamp: '2026-05-20T10:00:00Z', performedBy: 'system' },
    { sku: 'WDG-001', type: 'inbound', quantity: 200, timestamp: '2026-05-21T08:00:00Z', performedBy: 'receiving' },
  ]
);

console.log(result.record.levels.available);      // Current available stock
console.log(result.classification);                // ABC/velocity breakdown
console.log(result.confidence.grade);              // A, B, C, or D
console.log(result.aiRecord.embedding_text);       // For vector DB
console.log(result.outputs.csv);                   // CSV export
```

## Libraries

### 1. ingest-normalize
Cleans raw text, normalizes SKUs/units/quantities, ingests structured or free-text warehouse data.

### 2. item-classification
ABC analysis (Pareto), velocity classification, perishability tracking, hazard detection, custom taxonomy.

### 3. stock-tracking
Processes movements (inbound/outbound/transfer/adjustment), computes real-time levels, detects anomalies, triggers reorder alerts.

### 4. demand-forecast
Computes daily/weekly demand patterns, detects seasonality, provides simple exponential-smoothing forecasts, calculates optimal reorder points.

### 5. inventory-ledger
Versioned record store with full audit trail, periodic snapshots, cycle-count reconciliation.

### 6. ai-inventory-context
Packages records into AI-ready format with embedding text, structured signals, forecast context, and replenishment prompts.

## Validation Gates

1. **schema_completeness** — Required fields present
2. **level_consistency** — Available = OnHand - Allocated
3. **item_integrity** — No duplicate SKUs, valid costs
4. **reorder_logic** — Sensible reorder parameters
5. **expiry_check** — Flag expired items
