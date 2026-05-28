# @medina/reefer-contract-intelligence — v1.0.0

Enterprise app core for **reefer 18-wheeler contract intelligence**.

## What it delivers

- **Internal intelligence:** fleet ops, dispatch, legal, finance, risk, maintenance
- **External intelligence:** shipper contracts, lane markets, weather, fuel, compliance, partner performance
- Domain model for: Fleet, Reefer Unit, Driver, Lane, Shipment, Contract, Clause, Rate Card, SLA, Temperature Events, Claims, Audit Logs
- Contract lifecycle: `draft → review → negotiation → active → renewal/termination`
- Intelligence lifecycle: `ingest → classify → score → alert → resolve`

## Install

```bash
npm install @medina/reefer-contract-intelligence
```

## Quick Start

```js
import { birthReeferContractIntelligence } from '@medina/reefer-contract-intelligence';

const app = birthReeferContractIntelligence();

app.initializeTenant('tenant-acme');
app.assignRole('tenant-acme', 'u-legal-1', 'legal');
app.assignRole('tenant-acme', 'u-admin-1', 'admin');

const result = app.ingestContract({
  tenantId: 'tenant-acme',
  userId: 'u-legal-1',
  sourceType: 'text',
  content: `
  MASTER CARRIER AGREEMENT
  Rate card applies by lane and fuel surcharge table.
  Detention applies after 2 hours.
  Carrier responsible for reefer temperature excursion losses.
  Claims must be filed within 30 days written notice.
  Governing law: Texas.
  `,
  metadata: { contractValue: 320000 },
  contract: { title: 'Acme Reefer MSA', state: 'draft' },
});

console.log(result.risk.totalRiskScore);
console.log(result.obligations.length);

const dashboards = app.getInternalDashboards('tenant-acme');
console.log(dashboards.executive.enterpriseRiskPosture);
```

## MVP APIs

- `initializeTenant(tenantId, config?)`
- `assignRole(tenantId, userId, role)`
- `createEntity(tenantId, entityType, payload)`
- `ingestContract({ tenantId, userId, sourceType, content, metadata, contract })`
- `extractAndClassifyClauses(tenantId, contractId, text)`
- `scoreContractRisk(tenantId, contractId, clauses)`
- `extractObligations(tenantId, contractId, text)`
- `createRedlineRecommendationWorkflow(...)`
- `approveRedlineRecommendation(...)`

## Dashboards and Pipelines

- Internal dashboards: `getInternalDashboards(tenantId)`
- External intelligence pipelines: `ingestExternalSignals(tenantId, payload)` + `getExternalDashboard(tenantId)`
- Orchestration: `orchestrateAlerts(tenantId)`, `recordOutcome(tenantId, outcome)`, `recalibrateFromOutcomes(tenantId)`

## Enterprise Controls

- Tenant isolation by design
- RBAC checks for ingest/review/approve/ops actions
- Immutable audit/provenance event trails
- Encryption flags at rest/in transit
- Retention controls: `enforceRetention(tenantId)`

## Reuse of Existing Modules

You can inject existing modules as adapters:

- `paralegalAI` (`@medina/paralegal-ai`) for legal risk/redline augmentation
- `analystAI` (`@medina/analyst-ai`) for executive briefing
- `logistexAGI` (`@medina/logistex-agi`) for logistics intelligence context
- `enterpriseIntegration` (`@medina/enterprise-integration-sdk`) for connector health/integration pathways

Pass them in constructor:

```js
const app = birthReeferContractIntelligence({
  paralegalAI,
  analystAI,
  logistexAGI,
  enterpriseIntegration,
});
```

## Phased Release Tracking

- `getPhaseStatus()`
- `markPhaseCapability(phaseKey, capability, completed?)`

Phases:
- Phase 1: ingestion + clause risk + obligations + basic dashboard
- Phase 2: external signal fusion + predictive risk + action routing
- Phase 3: full integrations + optimization + board-level reporting

## Acceptance Metrics Tracking

Use `updateAcceptanceMetrics(tenantId, metrics)` for:

- Contract review time reduction
- Claims/penalty reduction
- Margin lift on reefer lanes
- SLA compliance improvement
- Alert precision and action completion rate
