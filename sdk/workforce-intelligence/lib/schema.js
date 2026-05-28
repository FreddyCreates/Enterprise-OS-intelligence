/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       WORKFORCE INTELLIGENCE — CANONICAL SCHEMA v1.0.0                     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function createBlankWorkerRecord(workerId) {
  return {
    workerId: workerId || `WRK-${Date.now()}`,
    version: '1.0.0',
    worker: { name: '', employeeId: '', department: '', role: '', team: '', status: 'active', hireDate: '', skills: [] },
    schedule: { shifts: [], availability: [], preferences: {} },
    timesheet: { entries: [], period: { start: '', end: '' }, totalHours: 0, overtimeHours: 0 },
    performance: { rating: 0, attendance: 0, certifications: [], notes: [] },
    costs: { hourlyRate: 0, overtimeRate: 0, benefits: 0, totalCost: 0, currency: 'USD' },
    audit: { createdAt: new Date().toISOString(), createdBy: 'system', sourceHash: '', confidence: 0, warnings: [] },
    status: 'active',
  };
}

function createShift(date, startTime, endTime, role, location) {
  const hours = computeShiftHours(startTime, endTime);
  return { date, startTime, endTime, hours, role: role || '', location: location || '', status: 'scheduled', breaks: [] };
}

function createTimesheetEntry(date, clockIn, clockOut, breakMinutes) {
  const rawHours = computeShiftHours(clockIn, clockOut);
  const netHours = Math.max(0, rawHours - (breakMinutes || 0) / 60);
  return { date, clockIn, clockOut, breakMinutes: breakMinutes || 0, rawHours, netHours, status: 'pending', approved: false };
}

function computeShiftHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let hours = (eh * 60 + em - sh * 60 - sm) / 60;
  if (hours < 0) hours += 24; // Overnight shift
  return Math.round(hours * 100) / 100;
}

const REQUIRED_FIELDS = ['workerId', 'worker.name', 'worker.department'];

function validateSchema(record) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    const parts = field.split('.');
    let val = record;
    for (const p of parts) { val = val ? val[p] : undefined; }
    if (val === undefined || val === '' || val === null) {
      errors.push({ field, message: `Required field "${field}" is missing or empty` });
    }
  }
  if (record.costs && record.costs.hourlyRate < 0) {
    errors.push({ field: 'costs.hourlyRate', message: 'Hourly rate cannot be negative' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { createBlankWorkerRecord, createShift, createTimesheetEntry, computeShiftHours, validateSchema, REQUIRED_FIELDS };
