'use strict';

const { validateSchema } = require('./schema');

function gateSchemaCompleteness(record) {
  const result = validateSchema(record);
  return { gate: 'schema_completeness', passed: result.valid, errors: result.errors, warnings: [] };
}

function gateTimesheetConsistency(record) {
  const errors = [];
  const warnings = [];
  for (const entry of record.timesheet.entries) {
    if (entry.netHours < 0) errors.push(`Negative hours on ${entry.date}`);
    if (entry.netHours > 16) warnings.push(`Excessive hours (${entry.netHours}) on ${entry.date}`);
    if (entry.breakMinutes < 0) errors.push(`Negative break on ${entry.date}`);
  }
  return { gate: 'timesheet_consistency', passed: errors.length === 0, errors, warnings };
}

function gateScheduleValidity(record) {
  const warnings = [];
  const shifts = record.schedule.shifts;
  for (const shift of shifts) {
    if (shift.hours <= 0) warnings.push(`Zero/negative hours shift on ${shift.date}`);
    if (shift.hours > 14) warnings.push(`Very long shift (${shift.hours}h) on ${shift.date}`);
  }
  return { gate: 'schedule_validity', passed: true, errors: [], warnings };
}

function gateCostValidity(record) {
  const warnings = [];
  if (record.costs.hourlyRate > 0 && record.costs.overtimeRate < record.costs.hourlyRate) {
    warnings.push('Overtime rate is less than regular rate');
  }
  return { gate: 'cost_validity', passed: true, errors: [], warnings };
}

function runAllGates(record) {
  const gates = [gateSchemaCompleteness(record), gateTimesheetConsistency(record), gateScheduleValidity(record), gateCostValidity(record)];
  return { passed: gates.every(g => g.passed), gates, errors: gates.flatMap(g => g.errors), warnings: gates.flatMap(g => g.warnings) };
}

module.exports = { gateSchemaCompleteness, gateTimesheetConsistency, gateScheduleValidity, gateCostValidity, runAllGates };
