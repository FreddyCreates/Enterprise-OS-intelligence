/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          WORKFORCE INTELLIGENCE SDK v1.0.0                                 ║
 * ║                                                                            ║
 * ║  Enterprise workforce data pipeline — ingest, schedule, timesheet,         ║
 * ║  workforce planning, validate, store, and AI-context packaging.            ║
 * ║                                                                            ║
 * ║  © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const schema = require('./lib/schema');
const ingest = require('./lib/ingest-normalize');
const schedule = require('./lib/schedule-intelligence');
const timesheet = require('./lib/timesheet-analytics');
const planning = require('./lib/workforce-planning');
const { WorkforceLedger } = require('./lib/workforce-ledger');
const aiContext = require('./lib/ai-workforce-context');
const validation = require('./lib/validation-gates');
const observability = require('./lib/observability');
const output = require('./lib/output-formats');

function processPipeline(rawData, options = {}) {
  const record = ingest.ingestStructured(rawData);

  // Schedule analysis
  if (record.schedule.shifts.length > 0) {
    const scheduleMetrics = schedule.computeScheduleMetrics(record.schedule.shifts);
    record._scheduleMetrics = scheduleMetrics;
    const conflicts = schedule.detectScheduleConflicts(record.schedule.shifts);
    if (conflicts.length > 0) record.audit.warnings.push(...conflicts.map(c => `Schedule conflict: ${c.type} on ${c.shift1 ? c.shift1.date : c.date}`));
  }

  // Timesheet totals
  if (record.timesheet.entries.length > 0) {
    const totals = timesheet.computeTimesheetTotals(record.timesheet.entries, options.otRules);
    record.timesheet.totalHours = totals.totalHours;
    record.timesheet.overtimeHours = totals.overtimeHours;
  }

  // Validate
  const validationResults = validation.runAllGates(record);
  record.audit.warnings.push(...validationResults.warnings);

  // Confidence
  const confidence = observability.computeConfidenceScore(record, validationResults);
  record.audit.confidence = confidence.score;

  // AI context
  const aiRecord = aiContext.toAIRecord(record);
  const embeddingBlocks = output.toEmbeddingBlocks(record);
  const explainability = observability.generateExplainability(record, validationResults, confidence);

  return {
    record,
    validation: validationResults,
    confidence,
    aiRecord,
    embeddingBlocks,
    explainability,
    outputs: {
      json: output.toJSON(record, { pretty: true }),
      csv: output.toCSV(record),
      timesheetCSV: output.timesheetToCSV(record),
      apiPayload: output.toAPIPayload(record),
    },
  };
}

module.exports = {
  processPipeline,
  schema,
  ingest,
  schedule,
  timesheet,
  planning,
  WorkforceLedger,
  aiContext,
  validation,
  observability,
  output,
  VERSION: '1.0.0',
};
