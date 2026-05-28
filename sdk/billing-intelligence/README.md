# Billing Intelligence SDK v1.0.0

Enterprise billing data pipeline — ingest raw billing notes, parse labor data, apply pricing rules, validate, store versioned records, and package everything for AI consumption.

## Architecture

```
Raw Data (text/structured)
    │
    ▼
┌─────────────────────┐
│  1. ingest-normalize │  ← Clean & standardize inputs
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  2. labor-intel      │  ← Extract shifts, crews, hours
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  3. contract-pricing │  ← Apply rates, tax, overtime + trace
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  validation-gates    │  ← Catch errors before finalization
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  4. billing-ledger   │  ← Versioned storage + reconciliation
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  5. ai-billing-ctx   │  ← AI-ready records, forecasting, anomaly detection
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  output-formats      │  ← JSON, CSV, API, embeddings
└─────────────────────┘
```

## Quick Start

```js
const billing = require('@medina/billing-intelligence');

// Full pipeline from raw data
const result = billing.processPipeline(
  {
    invoiceNumber: 'MW-MAY-2026-001',
    billTo: 'MoveWorks',
    project: 'Relocation Labor',
    servicePeriod: 'May 23 - May 27, 2026',
    invoiceDate: 'May 31, 2026',
    billRate: '$25.00',
    terms: 'Net 30',
  },
  [
    'Saturday, May 23: 10 crew, 7:00 AM - 6:30 PM, totaling 109.25 labor hours.',
    'Tuesday, May 26: 8 crew, 8:00 AM - 4:30 PM, totaling 68.00 labor hours.',
    'Wednesday, May 27: 7 crew from 8:30 AM - 5:00 PM totaling 56.00 labor hours; Diego from 8:00 AM - 7:00 PM totaling 10.50 labor hours; plus 2 crew from 4:00 PM - 7:00 PM totaling 6.00 labor hours.',
  ],
  { year: 2026 }
);

console.log(result.invoice.totals.totalDue);    // 6243.75
console.log(result.confidence.grade);           // A or B
console.log(result.validation.passed);          // true/false
console.log(result.outputs.json);               // Full JSON
console.log(result.outputs.csv);                // CSV export
console.log(result.aiRecord.embedding_text);    // For vector DB
```

## Libraries

### 1. ingest-normalize
Cleans raw text, normalizes dates/times/currency, ingests structured or free-text billing data.

```js
const { ingest } = require('@medina/billing-intelligence');
const invoice = ingest.ingestStructured({ billTo: 'Client', ... });
const invoice2 = ingest.ingestRawText("Invoice No.: 123\nBill To: Acme...");
```

### 2. labor-intel
Parses operational notes into structured shift/crew/hours records.

```js
const { labor } = require('@medina/billing-intelligence');
const { logs, totalsInfo } = labor.parseLaborSummary(bullets, 2026);
const stats = labor.computeLaborStats(logs);
const anomalies = labor.detectAnomalies(logs);
```

### 3. contract-pricing
Applies rate cards with overtime, minimums, discounts, tax — with full calculation trace.

```js
const { pricing } = require('@medina/billing-intelligence');
const rateCard = pricing.createRateCard(25.00, { taxRate: 0, overtimeThresholdHours: 10 });
const totals = pricing.calculateTotals(laborLogs, rateCard);
console.log(pricing.pricingSummary(totals));
```

### 4. billing-ledger
Versioned invoice store with reconciliation history.

```js
const { BillingLedger } = require('@medina/billing-intelligence');
const ledger = new BillingLedger();
ledger.commit(invoice, 'system');
ledger.finalize('MW-MAY-2026-001', 'admin');
ledger.reconcile('MW-MAY-2026-001', 6243.75, 6243.75, 'Matches PO');
```

### 5. ai-billing-context
Packages invoices into AI-ready records for embeddings, forecasting, and anomaly detection.

```js
const { aiContext } = require('@medina/billing-intelligence');
const record = aiContext.toAIRecord(invoice);
const forecast = aiContext.buildForecastContext([inv1, inv2, inv3]);
const anomalies = aiContext.detectBillingAnomalies(newInvoice, forecast);
const draft = aiContext.autoDraftContext('MOVEWORKS', forecast);
```

## Validation Gates

Six gates run before finalization:
1. **schema_completeness** — All required fields present
2. **hours_consistency** — Entry hours sum to day totals, day totals sum to invoice total
3. **total_accuracy** — Recalculated total matches stated total
4. **duplicate_detection** — No duplicate dates or entries
5. **labor_anomalies** — No impossible shifts (>16h) or hours mismatches
6. **date_sanity** — Invoice date not far-future, service period precedes invoice date

## Observability

- **Confidence scores** (0-1, graded A-D) with weighted breakdown
- **Exception queue** for items requiring human review
- **Explainability records** linking every number to source data and calculation trace

## Output Formats

- `toJSON(invoice, { compact, pretty })` — JSON for APIs/storage
- `toCSV(invoices)` — Tabular export
- `laborToCSV(invoices)` — Detailed labor rows
- `toAPIPayload(invoice)` — Webhook/integration payloads
- `toEmbeddingBlocks(invoice)` — Chunked text for vector databases
