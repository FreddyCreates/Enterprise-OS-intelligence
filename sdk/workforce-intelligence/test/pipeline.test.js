/**
 * Workforce Intelligence SDK — Pipeline Integration Test
 */

'use strict';

const { processPipeline, schema, ingest, scheduling, timesheet, payroll, WorkforceLedger, aiContext, validation, observability, output } = require('../index');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

const sampleTimesheetData = {
  employee: { id: 'EMP-4421', name: 'Carlos Martinez', department: 'Warehouse', role: 'Forklift Operator', payRate: 28.50, overtimeRate: 42.75 },
  period: { start: '2026-05-18', end: '2026-05-24', weekNumber: 21, year: 2026 },
  entries: [
    { date: '2026-05-18', clockIn: '06:00', clockOut: '14:30', breakMinutes: 30, regularHours: 8, overtimeHours: 0, code: 'REG' },
    { date: '2026-05-19', clockIn: '06:00', clockOut: '15:00', breakMinutes: 30, regularHours: 8, overtimeHours: 0.5, code: 'REG' },
    { date: '2026-05-20', clockIn: '06:00', clockOut: '16:00', breakMinutes: 30, regularHours: 8, overtimeHours: 1.5, code: 'REG' },
    { date: '2026-05-21', clockIn: '06:00', clockOut: '14:30', breakMinutes: 30, regularHours: 8, overtimeHours: 0, code: 'REG' },
    { date: '2026-05-22', clockIn: '06:00', clockOut: '14:30', breakMinutes: 30, regularHours: 8, overtimeHours: 0, code: 'REG' },
  ],
  totals: { regularHours: 40, overtimeHours: 2, totalHours: 42, regularPay: 1140.00, overtimePay: 85.50, grossPay: 1225.50 },
  approvals: [
    { approver: 'David Kim', role: 'Supervisor', status: 'approved', timestamp: '2026-05-25T09:00:00Z' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

function testIngest() {
  const ts = ingest.ingestStructured(sampleTimesheetData);
  assert(ts.timesheetId, 'Should generate timesheetId');
  assert(ts.employee.name === 'Carlos Martinez', 'Employee name preserved');
  assert(ts.entries.length === 5, 'Entries preserved');
  assert(ts.totals.grossPay === 1225.50, 'Gross pay preserved');
  assert(ts.audit.createdAt, 'Audit timestamp set');
  console.log('  ✓ ingest-normalize');
}

function testScheduling() {
  const shift = scheduling.buildShift('2026-05-25', '06:00', '14:30', 30);
  assert(shift.durationHours === 8, 'Shift is 8 hours');
  assert(shift.breakMinutes === 30, 'Break preserved');
  console.log('  ✓ scheduling');
}

function testTimesheet() {
  const ts = ingest.ingestStructured(sampleTimesheetData);
  const analysis = timesheet.analyzeEntries(ts.entries);
  assert(analysis.totalDays === 5, 'Five working days');
  assert(analysis.avgHoursPerDay > 8, 'Above 8 hrs avg (has OT)');
  console.log('  ✓ timesheet-intel');
}

function testPayroll() {
  const ts = ingest.ingestStructured(sampleTimesheetData);
  const calc = payroll.calculateGross(ts.entries, ts.employee.payRate, ts.employee.overtimeRate);
  assert(calc.regularPay === 1140.00, 'Regular pay correct');
  assert(calc.overtimePay === 85.50, 'OT pay correct');
  assert(calc.grossPay === 1225.50, 'Gross pay correct');
  console.log('  ✓ payroll-compute');
}

function testValidation() {
  const ts = ingest.ingestStructured(sampleTimesheetData);
  const results = validation.runAllGates(ts);
  assert(results.gates, 'Has gates array');
  assert(typeof results.passed === 'boolean', 'Has passed boolean');
  assert(Array.isArray(results.warnings), 'Has warnings array');
  console.log('  ✓ validation-gates');
}

function testObservability() {
  const ts = ingest.ingestStructured(sampleTimesheetData);
  const valResults = validation.runAllGates(ts);
  const confidence = observability.computeConfidenceScore(ts, valResults);
  assert(confidence.score >= 0 && confidence.score <= 1, 'Score in range');
  assert(confidence.grade, 'Has grade');
  assert(confidence.breakdown, 'Has breakdown');

  const explain = observability.generateExplainability(ts, valResults, confidence);
  assert(explain.timesheetId, 'Explainability has timesheetId');
  assert(explain.summary.employee === 'Carlos Martinez', 'Summary has employee');
  assert(explain.timesheetProof, 'Has timesheet proof');

  // Test ExceptionQueue
  const queue = new observability.ExceptionQueue();
  queue.add('TS-001', 'overtime_excess', 'medium', 'Overtime exceeds threshold');
  queue.add('TS-002', 'missing_clockout', 'high', 'Missing clock-out entry');
  assert(queue.getOpen().length === 2, 'Queue has two open exceptions');
  queue.acknowledge(queue.queue[0].id, 'supervisor');
  assert(queue.queue[0].status === 'acknowledged', 'Exception acknowledged');
  queue.resolve(queue.queue[0].id, 'supervisor', 'OT pre-approved');
  assert(queue.getOpen().length === 1, 'One resolved');
  console.log('  ✓ observability (confidence + ExceptionQueue + explainability)');
}

function testLedger() {
  const ledger = new WorkforceLedger();
  const ts = ingest.ingestStructured(sampleTimesheetData);
  ts.status = 'pending';

  const result = ledger.commit(ts, 'employee');
  assert(result.version === 1, 'First version');
  assert(result.hash, 'Has hash');

  const retrieved = ledger.get(ts.timesheetId);
  assert(retrieved, 'Can retrieve committed timesheet');
  assert(retrieved.employee.name === 'Carlos Martinez', 'Data preserved');

  // Approve
  const approval = ledger.approveTimesheet(ts.timesheetId, 'David Kim', 'Supervisor', 'Looks good');
  assert(approval.success === true, 'Approval succeeds');
  assert(ledger.get(ts.timesheetId).status === 'approved', 'Status updated to approved');

  // Add entry
  const addResult = ledger.addEntry(ts.timesheetId, { date: '2026-05-25', clockIn: '06:00', clockOut: '10:00', breakMinutes: 0, regularHours: 4, overtimeHours: 0, code: 'SAT' }, 'employee');
  assert(addResult.success === true, 'Entry added');

  // Run payroll
  const payrollResult = ledger.runPayroll(ts.timesheetId, ts.employee.payRate, ts.employee.overtimeRate, 'payroll-system');
  assert(payrollResult.success === true, 'Payroll runs');
  assert(payrollResult.payroll.grossPay > 0, 'Gross pay calculated');

  // Diff
  const history = ledger.getHistory(ts.timesheetId);
  assert(history.length >= 3, 'Multiple versions');
  const diff = ledger.diff(ts.timesheetId, 1, 2);
  assert(diff.changes.length > 0, 'Diff shows changes');

  // Summary
  const summary = ledger.summary();
  assert(summary.totalTimesheets >= 1, 'Summary has timesheets');
  assert(summary.payrollRuns === 1, 'One payroll run');

  console.log('  ✓ workforce-ledger (commit, approve, addEntry, payroll, diff)');
}

function testOutputFormats() {
  const ts = ingest.ingestStructured(sampleTimesheetData);

  const json = output.toJSON(ts, { pretty: true });
  assert(json.includes(ts.timesheetId), 'JSON contains timesheetId');

  const compact = output.toJSON(ts, { compact: true });
  assert(compact.includes('Carlos Martinez'), 'Compact has employee');

  const csv = output.toCSV(ts);
  assert(csv.includes('timesheet_id'), 'CSV has header');

  const schedCsv = output.scheduleToCSV(ts);
  assert(schedCsv.includes('date'), 'Schedule CSV has header');
  assert(schedCsv.includes('06:00'), 'Has clock-in time');

  const api = output.toAPIPayload(ts);
  assert(api.event === 'timesheet.updated', 'API event type');
  assert(api.data.timesheet_id === ts.timesheetId, 'API has timesheetId');

  const md = output.toMarkdown(ts);
  assert(md.includes('# Timesheet'), 'Markdown has title');
  assert(md.includes('Carlos Martinez'), 'Markdown has employee');

  const blocks = output.toEmbeddingBlocks(ts);
  assert(blocks.length >= 3, 'Has multiple embedding blocks');
  assert(blocks[0].blockType === 'overview', 'First block is overview');

  console.log('  ✓ output-formats (JSON, CSV, API, Markdown, embeddings)');
}

function testFullPipeline() {
  const result = processPipeline(sampleTimesheetData);
  assert(result.timesheet, 'Pipeline returns timesheet');
  assert(result.validation, 'Pipeline returns validation');
  assert(result.confidence, 'Pipeline returns confidence');
  assert(result.outputs, 'Pipeline returns outputs');
  console.log('  ✓ full pipeline integration');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

function run() {
  console.log('\n👷 Workforce Intelligence SDK — Test Suite\n');
  try {
    testIngest();
    testScheduling();
    testTimesheet();
    testPayroll();
    testValidation();
    testObservability();
    testLedger();
    testOutputFormats();
    testFullPipeline();
    console.log('\n✅ All tests passed.\n');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}\n`);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
