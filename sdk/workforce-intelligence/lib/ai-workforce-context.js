'use strict';

function toAIRecord(record) {
  return {
    id: record.workerId,
    type: 'workforce_record',
    embedding_text: generateEmbeddingText(record),
    structured: {
      name: record.worker.name,
      department: record.worker.department,
      role: record.worker.role,
      team: record.worker.team,
      status: record.worker.status,
      skills: record.worker.skills,
      totalHours: record.timesheet.totalHours,
      hourlyRate: record.costs.hourlyRate,
      shiftsScheduled: record.schedule.shifts.length,
    },
    metadata: { createdAt: record.audit.createdAt, confidence: record.audit.confidence },
    signals: extractSignals(record),
  };
}

function generateEmbeddingText(record) {
  return [
    `Worker ${record.worker.name} (${record.worker.employeeId || record.workerId})`,
    `Department: ${record.worker.department}, Role: ${record.worker.role}`,
    `Team: ${record.worker.team || 'unassigned'}, Status: ${record.worker.status}`,
    `Skills: ${record.worker.skills.join(', ') || 'none listed'}`,
    `Hours this period: ${record.timesheet.totalHours}`,
    `Rate: $${record.costs.hourlyRate}/hr`,
    `Shifts scheduled: ${record.schedule.shifts.length}`,
  ].join('. ');
}

function extractSignals(record) {
  const signals = [];
  if (record.timesheet.totalHours > 50) signals.push({ signal: 'high_hours', severity: 'warning' });
  if (record.timesheet.overtimeHours > 10) signals.push({ signal: 'significant_overtime', severity: 'warning' });
  if (record.worker.status === 'inactive') signals.push({ signal: 'inactive_worker', severity: 'info' });
  if (record.timesheet.entries.some(e => !e.approved)) signals.push({ signal: 'unapproved_timesheet', severity: 'info' });
  if (record.schedule.shifts.length === 0) signals.push({ signal: 'no_shifts_scheduled', severity: 'warning' });
  return signals;
}

function buildWorkforceContext(records) {
  const active = records.filter(r => r.worker.status === 'active');
  return {
    totalWorkers: records.length,
    activeWorkers: active.length,
    totalHours: Math.round(active.reduce((s, r) => s + r.timesheet.totalHours, 0) * 100) / 100,
    totalLaborCost: Math.round(active.reduce((s, r) => s + r.timesheet.totalHours * r.costs.hourlyRate, 0) * 100) / 100,
    byDepartment: active.reduce((acc, r) => { const d = r.worker.department; acc[d] = (acc[d] || 0) + 1; return acc; }, {}),
    skillsCoverage: [...new Set(active.flatMap(r => r.worker.skills))],
    alerts: active.filter(r => r.timesheet.totalHours > 50).map(r => ({ workerId: r.workerId, name: r.worker.name, hours: r.timesheet.totalHours })),
  };
}

function schedulingContext(record, openShifts) {
  return {
    workerId: record.workerId,
    name: record.worker.name,
    skills: record.worker.skills,
    currentHours: record.timesheet.totalHours,
    scheduledShifts: record.schedule.shifts.length,
    availableForShifts: openShifts.filter(s => !s.requiredSkill || record.worker.skills.includes(s.requiredSkill)),
    prompt: `Worker ${record.worker.name} in ${record.worker.department} with skills [${record.worker.skills.join(', ')}]. ` +
      `Currently ${record.timesheet.totalHours} hours this period. ` +
      `${openShifts.length} open shifts available. Recommend scheduling action.`,
  };
}

module.exports = { toAIRecord, generateEmbeddingText, extractSignals, buildWorkforceContext, schedulingContext };
