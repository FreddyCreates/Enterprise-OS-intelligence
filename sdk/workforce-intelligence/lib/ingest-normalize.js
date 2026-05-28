/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 1: INGEST-NORMALIZE — Raw Workforce Data Standardizer        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const crypto = require('crypto');
const { createBlankWorkerRecord, createShift, createTimesheetEntry } = require('./schema');

function cleanText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
}

function normalizeTime(input) {
  if (!input) return '';
  const match = input.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '';
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3];
  if (period) {
    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function normalizeDate(input) {
  if (!input) return '';
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

function ingestStructured(data) {
  const record = createBlankWorkerRecord(data.workerId || data.employeeId || data.id);

  // Worker info
  const w = data.worker || data;
  record.worker.name = w.name || data.name || '';
  record.worker.employeeId = w.employeeId || data.employeeId || '';
  record.worker.department = w.department || data.department || '';
  record.worker.role = w.role || w.position || data.role || data.position || '';
  record.worker.team = w.team || data.team || '';
  record.worker.status = w.status || data.status || 'active';
  record.worker.hireDate = normalizeDate(w.hireDate || data.hireDate || '');
  record.worker.skills = w.skills || data.skills || [];

  // Schedule
  if (Array.isArray(data.shifts || data.schedule)) {
    const shifts = data.shifts || data.schedule;
    record.schedule.shifts = shifts.map(s => createShift(
      normalizeDate(s.date), normalizeTime(s.startTime || s.start), normalizeTime(s.endTime || s.end), s.role, s.location
    ));
  }

  // Timesheet
  if (Array.isArray(data.timesheet || data.entries || data.timecards)) {
    const entries = data.timesheet || data.entries || data.timecards;
    record.timesheet.entries = entries.map(e => createTimesheetEntry(
      normalizeDate(e.date), normalizeTime(e.clockIn || e.in || e.start), normalizeTime(e.clockOut || e.out || e.end), e.breakMinutes || e.break || 0
    ));
    record.timesheet.totalHours = record.timesheet.entries.reduce((s, e) => s + e.netHours, 0);
  }
  if (data.period) {
    record.timesheet.period.start = normalizeDate(data.period.start || '');
    record.timesheet.period.end = normalizeDate(data.period.end || '');
  }

  // Costs
  if (data.costs || data.rate || data.hourlyRate) {
    const c = data.costs || {};
    record.costs.hourlyRate = parseFloat(c.hourlyRate || data.hourlyRate || data.rate || 0) || 0;
    record.costs.overtimeRate = parseFloat(c.overtimeRate || 0) || record.costs.hourlyRate * 1.5;
    record.costs.benefits = parseFloat(c.benefits || 0) || 0;
  }

  record.audit.createdAt = new Date().toISOString();
  record.audit.sourceHash = hashInput(JSON.stringify(data));
  record.audit.confidence = 1.0;
  return record;
}

function ingestRawText(text) {
  const cleaned = cleanText(text);
  const record = createBlankWorkerRecord();

  const nameMatch = cleaned.match(/(?:Employee|Worker|Name)\s*:?\s*(.+)/i);
  if (nameMatch) record.worker.name = nameMatch[1].trim();

  const deptMatch = cleaned.match(/(?:Department|Dept)\s*:?\s*(.+)/i);
  if (deptMatch) record.worker.department = deptMatch[1].trim();

  const roleMatch = cleaned.match(/(?:Role|Position|Title)\s*:?\s*(.+)/i);
  if (roleMatch) record.worker.role = roleMatch[1].trim();

  const rateMatch = cleaned.match(/\$\s*([\d.]+)\s*(?:per|\/)\s*(?:hour|hr)/i);
  if (rateMatch) record.costs.hourlyRate = parseFloat(rateMatch[1]);

  const hoursMatch = cleaned.match(/(?:Total\s*)?Hours?\s*:?\s*([\d.]+)/i);
  if (hoursMatch) record.timesheet.totalHours = parseFloat(hoursMatch[1]);

  record.audit.sourceHash = hashInput(text);
  record.audit.confidence = computeConfidence(record);
  record.audit.createdBy = 'ingest-normalize/raw-text';
  return record;
}

function hashInput(str) { return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16); }

function computeConfidence(record) {
  let score = 0, checks = 0;
  const check = (val) => { checks++; if (val) score++; };
  check(record.worker.name);
  check(record.worker.department);
  check(record.timesheet.totalHours > 0 || record.timesheet.entries.length > 0);
  check(record.costs.hourlyRate > 0);
  return checks > 0 ? Math.round((score / checks) * 100) / 100 : 0;
}

module.exports = { cleanText, normalizeTime, normalizeDate, ingestStructured, ingestRawText, hashInput, computeConfidence };
