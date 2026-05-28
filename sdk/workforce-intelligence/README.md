# Workforce Intelligence SDK v1.0.0

Enterprise workforce data pipeline — ingest raw HR/scheduling/timesheet data, analyze schedules, compute labor costs, plan workforce capacity, validate, and package for AI consumption.

## Architecture

```
Raw Data (HR systems/timesheets/schedules)
    │
    ▼
┌─────────────────────────┐
│  1. ingest-normalize     │  ← Clean & standardize inputs
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  2. schedule-intelligence│  ← Conflicts, compliance, optimization
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  3. timesheet-analytics  │  ← Hours, overtime, costs, anomalies
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  4. workforce-planning   │  ← Capacity, utilization, skills gaps
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  validation-gates        │  ← Quality checks
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  5. workforce-ledger     │  ← Versioned store + approvals
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  6. ai-workforce-ctx     │  ← AI-ready records, scheduling prompts
└─────────────────────────┘
```

## Quick Start

```js
const workforce = require('@medina/workforce-intelligence');

const result = workforce.processPipeline({
  name: 'Maria Garcia',
  employeeId: 'EMP-042',
  department: 'Operations',
  role: 'Crew Lead',
  skills: ['forklift', 'hazmat', 'team-lead'],
  hourlyRate: 28.50,
  shifts: [
    { date: '2026-05-26', startTime: '7:00 AM', endTime: '3:30 PM' },
    { date: '2026-05-27', startTime: '7:00 AM', endTime: '4:00 PM' },
  ],
  timesheet: [
    { date: '2026-05-26', clockIn: '6:55 AM', clockOut: '3:35 PM', breakMinutes: 30 },
    { date: '2026-05-27', clockIn: '7:02 AM', clockOut: '4:05 PM', breakMinutes: 30 },
  ],
});

console.log(result.record.timesheet.totalHours);  // Net hours worked
console.log(result.confidence.grade);              // A, B, C, D
console.log(result.aiRecord.embedding_text);       // For vector DB
```

## Libraries

### 1. ingest-normalize
Standardizes worker/schedule/timesheet data from HR systems and free-text.

### 2. schedule-intelligence
Schedule metrics, conflict detection, labor compliance checks, basic schedule optimization.

### 3. timesheet-analytics
Hours computation with OT rules, labor cost calculation, anomaly detection, attendance reports.

### 4. workforce-planning
Workforce capacity, utilization analysis, skills gap analysis, headcount forecasting, overtime analysis.

### 5. workforce-ledger
Versioned worker records with timesheet approval workflow.

### 6. ai-workforce-context
AI-ready records, workforce context aggregation, scheduling prompts for AI assistants.
