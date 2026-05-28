/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OUTPUT FORMATS — Multi-Format Export for Workforce Data              ║
 * ║                                                                            ║
 * ║  JSON, CSV, API payloads, markdown reports, and embeddings-ready text      ║
 * ║  blocks for downstream intelligence systems.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// JSON OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export workforce record as clean JSON.
 */
function toJSON(record, options = {}) {
  const data = options.compact ? {
    workerId: record.workerId,
    name: record.worker.name,
    department: record.worker.department,
    role: record.worker.role,
    status: record.worker.status,
    totalHours: record.timesheet.totalHours,
    shifts: record.schedule.shifts.length,
  } : JSON.parse(JSON.stringify(record));

  return options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export workforce records as CSV rows.
 */
function toCSV(records, options = {}) {
  const arr = Array.isArray(records) ? records : [records];
  const delimiter = options.delimiter || ',';

  const headers = [
    'worker_id', 'name', 'department', 'role', 'status', 'hire_date',
    'total_hours', 'overtime_hours', 'hourly_rate', 'overtime_rate',
    'shifts_scheduled', 'skills', 'confidence',
  ];

  const rows = arr.map(r => [
    r.workerId,
    escapeCSV(r.worker.name),
    escapeCSV(r.worker.department),
    escapeCSV(r.worker.role),
    r.worker.status,
    r.worker.hireDate || '',
    r.timesheet.totalHours,
    r.timesheet.entries.reduce((s, e) => s + Math.max(0, (e.netHours || 0) - 8), 0),
    r.costs.hourlyRate,
    r.costs.overtimeRate || '',
    r.schedule.shifts.length,
    escapeCSV((r.worker.skills || []).join('; ')),
    r.audit.confidence || '',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export timesheet entries as CSV.
 */
function timesheetToCSV(record, options = {}) {
  const delimiter = options.delimiter || ',';
  const headers = [
    'worker_id', 'date', 'day_of_week', 'clock_in', 'clock_out',
    'break_minutes', 'gross_hours', 'net_hours', 'overtime', 'approved', 'status',
  ];

  const rows = record.timesheet.entries.map(e => {
    const netHours = e.netHours || 0;
    const overtime = Math.max(0, netHours - 8);
    return [
      record.workerId,
      e.date,
      e.dayOfWeek || '',
      e.clockIn,
      e.clockOut,
      e.breakMinutes || 0,
      e.grossHours || netHours,
      netHours,
      overtime,
      e.approved ? 'yes' : 'no',
      e.status || 'pending',
    ];
  });

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export schedule as CSV.
 */
function scheduleToCSV(record, options = {}) {
  const delimiter = options.delimiter || ',';
  const headers = ['worker_id', 'date', 'start_time', 'end_time', 'shift_type', 'location', 'hours'];

  const rows = record.schedule.shifts.map(s => [
    record.workerId,
    s.date,
    s.startTime,
    s.endTime,
    s.shiftType || 'regular',
    escapeCSV(s.location || ''),
    s.hours || '',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// API PAYLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate an API-ready payload (for webhooks, HRIS, payroll systems).
 */
function toAPIPayload(record, options = {}) {
  return {
    event: options.event || 'workforce.updated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      worker_id: record.workerId,
      worker: {
        name: record.worker.name,
        department: record.worker.department,
        role: record.worker.role,
        status: record.worker.status,
        skills: record.worker.skills || [],
      },
      timesheet: {
        total_hours: record.timesheet.totalHours,
        entries: record.timesheet.entries.length,
        approved: record.timesheet.entries.filter(e => e.approved).length,
        pending: record.timesheet.entries.filter(e => !e.approved).length,
      },
      schedule: {
        shifts: record.schedule.shifts.length,
        next_shift: record.schedule.shifts.find(s => new Date(s.date) >= new Date()) || null,
      },
      costs: {
        hourly_rate: record.costs.hourlyRate,
        overtime_rate: record.costs.overtimeRate || 0,
        currency: record.costs.currency || 'USD',
      },
      metadata: {
        confidence: record.audit.confidence,
        source_hash: record.audit.sourceHash,
        warnings: record.audit.warnings || [],
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN REPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a human-readable markdown report for a workforce record.
 */
function toMarkdown(record) {
  const lines = [
    `# Workforce Record: ${record.worker.name}`,
    '',
    `**Worker ID:** ${record.workerId}`,
    `**Department:** ${record.worker.department}`,
    `**Role:** ${record.worker.role}`,
    `**Status:** ${record.worker.status}`,
    `**Skills:** ${(record.worker.skills || []).join(', ') || 'None listed'}`,
    '',
    '## Timesheet Summary',
    `- **Total Hours:** ${record.timesheet.totalHours}`,
    `- **Entries:** ${record.timesheet.entries.length}`,
    `- **Approved:** ${record.timesheet.entries.filter(e => e.approved).length}`,
    `- **Pending:** ${record.timesheet.entries.filter(e => !e.approved).length}`,
    '',
    '### Recent Entries',
    '| Date | In | Out | Net Hours | Status |',
    '|:---|:---|:---|---:|:---|',
  ];

  const recent = record.timesheet.entries.slice(-7);
  for (const e of recent) {
    lines.push(`| ${e.date} | ${e.clockIn} | ${e.clockOut} | ${e.netHours} | ${e.approved ? '✅' : '⏳'} |`);
  }

  lines.push('');
  lines.push('## Schedule');
  lines.push(`- **Upcoming Shifts:** ${record.schedule.shifts.length}`);
  lines.push('');

  if (record.schedule.shifts.length > 0) {
    lines.push('| Date | Start | End | Type |');
    lines.push('|:---|:---|:---|:---|');
    for (const s of record.schedule.shifts.slice(0, 7)) {
      lines.push(`| ${s.date} | ${s.startTime} | ${s.endTime} | ${s.shiftType || 'regular'} |`);
    }
  }

  lines.push('');
  lines.push('## Compensation');
  lines.push(`- **Hourly Rate:** $${record.costs.hourlyRate}`);
  lines.push(`- **Overtime Rate:** $${record.costs.overtimeRate || 'N/A'}`);

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDINGS-READY TEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate text blocks optimized for vector embedding systems.
 */
function toEmbeddingBlocks(record) {
  const blocks = [];

  // Block 1: Overview
  blocks.push({
    blockType: 'overview',
    text: `Worker ${record.worker.name} (${record.workerId}) in ${record.worker.department} as ${record.worker.role}. ` +
      `Status: ${record.worker.status}. Skills: ${(record.worker.skills || []).join(', ') || 'none listed'}. ` +
      `Rate: $${record.costs.hourlyRate}/hr.`,
    metadata: { workerId: record.workerId, section: 'overview' },
  });

  // Block 2: Hours and timesheet
  blocks.push({
    blockType: 'hours',
    text: `Total hours logged: ${record.timesheet.totalHours}. ${record.timesheet.entries.length} timesheet entries. ` +
      `${record.timesheet.entries.filter(e => e.approved).length} approved, ` +
      `${record.timesheet.entries.filter(e => !e.approved).length} pending approval. ` +
      `Hourly rate: $${record.costs.hourlyRate}. Overtime rate: $${record.costs.overtimeRate || 'N/A'}.`,
    metadata: { workerId: record.workerId, section: 'hours' },
  });

  // Block 3: Schedule
  blocks.push({
    blockType: 'schedule',
    text: `${record.schedule.shifts.length} shifts scheduled. ` +
      (record.schedule.shifts.length > 0
        ? record.schedule.shifts.slice(0, 5).map(s =>
            `${s.date} ${s.startTime}-${s.endTime} (${s.shiftType || 'regular'})`
          ).join(', ')
        : 'No upcoming shifts.'),
    metadata: { workerId: record.workerId, section: 'schedule' },
  });

  return blocks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

module.exports = {
  toJSON,
  toCSV,
  timesheetToCSV,
  scheduleToCSV,
  toAPIPayload,
  toMarkdown,
  toEmbeddingBlocks,
};
