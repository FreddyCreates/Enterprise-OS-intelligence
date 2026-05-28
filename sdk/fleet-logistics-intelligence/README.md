# Fleet Logistics Intelligence SDK v1.0.0

Enterprise logistics data pipeline — ingest raw shipment/transport data, route optimization, shipment tracking, fleet management, validate, store versioned records, and package for AI consumption.

## Architecture

```
Raw Data (BOL/TMS/dispatch notes)
    │
    ▼
┌─────────────────────────┐
│  1. ingest-normalize     │  ← Clean & standardize inputs
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  2. route-intelligence   │  ← Distance, ETA, optimization, cost
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  3. shipment-tracking    │  ← Timeline events, delays, performance
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  4. fleet-management     │  ← Vehicles, utilization, maintenance
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  validation-gates        │  ← Quality checks
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  5. logistics-ledger     │  ← Versioned store + POD
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  6. ai-logistics-ctx     │  ← AI-ready records, dispatch context
└─────────────────────────┘
```

## Quick Start

```js
const logistics = require('@medina/fleet-logistics-intelligence');

const result = logistics.processPipeline({
  shipmentId: 'SHP-2026-0531',
  carrierName: 'Southwest Express',
  driver: 'Carlos Mendez',
  origin: { name: 'Austin DC', address: '1000 Logistics Dr, Austin TX', lat: 30.267, lng: -97.743 },
  destination: { name: 'Dallas Hub', address: '500 Commerce St, Dallas TX', lat: 32.777, lng: -96.797 },
  cargo: { description: 'Palletized electronics', weight: 12000, pieces: 8, type: 'fragile' },
  costs: { baseCost: 850, fuelSurcharge: 125, accessorials: 50 },
  vehicle: { vehicleId: 'TRK-042', type: 'truck', capacity: 44000 },
});

console.log(result.travelEstimate.totalHours);  // Estimated transit time
console.log(result.routeRisk.overallRisk);       // low/medium/high
console.log(result.costAnalysis.costPerMile);    // $/mile
console.log(result.aiRecord.embedding_text);     // For vector DB
```

## Libraries

### 1. ingest-normalize
Cleans raw text, normalizes weights/distances/addresses from BOLs, TMS exports, and dispatch notes.

### 2. route-intelligence
Haversine distance, travel time estimation (with HOS compliance), multi-stop optimization, cost-per-mile analysis, carrier rate comparison, route risk assessment.

### 3. shipment-tracking
Status lifecycle management, ETA computation, delay detection, delivery performance metrics, carrier scorecards.

### 4. fleet-management
Vehicle utilization tracking, capacity analysis, maintenance scheduling, fuel efficiency metrics.

### 5. logistics-ledger
Versioned shipment store with proof-of-delivery (POD) recording.

### 6. ai-logistics-context
AI-ready records with embedding text, signals, fleet context, and dispatch prompts.
