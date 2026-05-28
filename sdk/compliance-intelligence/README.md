# Compliance Intelligence SDK v1.0.0

Enterprise compliance data pipeline — ingest raw regulatory/audit data, map regulations, maintain audit trails, compute risk scores, validate, and package for AI consumption.

## Architecture

```
Raw Data (audit reports/assessments/policies)
    │
    ▼
┌─────────────────────────┐
│  1. ingest-normalize     │  ← Clean & standardize inputs
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  2. regulation-engine    │  ← Framework mapping, gap analysis
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  3. audit-trail          │  ← Immutable event log, chain integrity
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  4. risk-scoring         │  ← Multi-factor risk computation
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  validation-gates        │  ← Quality checks
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  5. compliance-ledger    │  ← Versioned store
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  6. ai-compliance-ctx    │  ← AI-ready records, remediation prompts
└─────────────────────────┘
```

## Quick Start

```js
const compliance = require('@medina/compliance-intelligence');

const result = compliance.processPipeline({
  entity: { name: 'Medina Corp', department: 'Engineering', jurisdiction: 'US' },
  regulation: { code: 'SOC2', name: 'SOC 2 Type II', category: 'security', authority: 'AICPA' },
  assessment: { status: 'partial', score: 72, date: '2026-04-15', assessedBy: 'External Auditor' },
  findings: [
    { title: 'Incomplete access reviews', severity: 'high', description: 'Quarterly access reviews not performed for Q1' },
    { title: 'Missing encryption at rest', severity: 'critical', description: 'PII data in staging not encrypted' },
  ],
  controls: [
    { name: 'Access Review Process', type: 'detective', status: 'implemented', effectiveness: 60 },
    { name: 'Data Encryption', type: 'preventive', status: 'missing', effectiveness: 0 },
  ],
});

console.log(result.riskAssessment.level);          // critical/high/medium/low
console.log(result.confidence.grade);               // A, B, C, D
console.log(result.aiRecord.embedding_text);        // For vector DB
```

## Libraries

### 1. ingest-normalize
Standardizes compliance data from audit reports, assessment tools, and free-text.

### 2. regulation-engine
Framework definitions (SOC2, ISO27001, HIPAA, PCI-DSS, GDPR, OSHA), gap analysis, threshold checks, remediation prioritization.

### 3. audit-trail
Immutable event log with chain integrity verification, snapshots, and actor tracking.

### 4. risk-scoring
Multi-factor risk computation (findings, controls, staleness, evidence), risk heatmaps, trend analysis.

### 5. compliance-ledger
Versioned compliance records with regulation and entity filtering.

### 6. ai-compliance-context
AI-ready records, compliance posture context, remediation prompts.
