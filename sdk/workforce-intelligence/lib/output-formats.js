'use strict';

function toJSON(record, options = {}) { return options.pretty ? JSON.stringify(record, null, 2) : JSON.stringify(record); }

function toCSV(records) {
  const arr = Array.isArray(records) ? records : [records];
  const header = 'worker_id,name,department,role,status,total_hours,hourly_rate,shifts';
  const rows = arr.map(r => `${r.workerId},${r.worker.name},${r.worker.department},${r.worker.role},${r.worker.status},${r.timesheet.totalHours},${r.costs.hourlyRate},${r.schedule.shifts.length}`);
  return [header, ...rows].join('\n');
}

function timesheetToCSV(record) {
  const header = 'date,clock_in,clock_out,break_min,net_hours,approved';
  const rows = record.timesheet.entries.map(e => `${e.date},${e.clockIn},${e.clockOut},${e.breakMinutes},${e.netHours},${e.approved}`);
  return [header, ...rows].join('\n');
}

function toAPIPayload(record) {
  return {
    type: 'workforce_update',
    version: '1.0',
    timestamp: new Date().toISOString(),
    payload: { workerId: record.workerId, name: record.worker.name, department: record.worker.department, totalHours: record.timesheet.totalHours, status: record.worker.status },
  };
}

function toEmbeddingBlocks(record) {
  return [
    { blockType: 'overview', text: `Worker ${record.worker.name} (${record.workerId}) in ${record.worker.department} as ${record.worker.role}. Status: ${record.worker.status}. Skills: ${record.worker.skills.join(', ') || 'none'}.` },
    { blockType: 'hours', text: `Total hours: ${record.timesheet.totalHours}. Entries: ${record.timesheet.entries.length}. Rate: $${record.costs.hourlyRate}/hr.` },
    { blockType: 'schedule', text: `${record.schedule.shifts.length} shifts scheduled. ` + record.schedule.shifts.slice(0, 5).map(s => `${s.date} ${s.startTime}-${s.endTime}`).join(', ') },
  ];
}

module.exports = { toJSON, toCSV, timesheetToCSV, toAPIPayload, toEmbeddingBlocks };
