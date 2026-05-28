/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 2: SCHEDULE INTELLIGENCE — Shift & Availability Mgmt         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function computeScheduleMetrics(shifts) {
  if (!shifts || shifts.length === 0) return { totalShifts: 0, totalHours: 0 };

  const totalHours = shifts.reduce((s, sh) => s + (sh.hours || 0), 0);
  const byDay = {};
  for (const sh of shifts) {
    byDay[sh.date] = (byDay[sh.date] || 0) + sh.hours;
  }

  return {
    totalShifts: shifts.length,
    totalHours: Math.round(totalHours * 100) / 100,
    avgShiftLength: Math.round(totalHours / shifts.length * 100) / 100,
    uniqueDays: Object.keys(byDay).length,
    longestShift: Math.max(...shifts.map(s => s.hours)),
    shortestShift: Math.min(...shifts.map(s => s.hours)),
  };
}

function detectScheduleConflicts(shifts) {
  const conflicts = [];
  const sorted = [...shifts].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].date === sorted[i - 1].date) {
      // Same day — check overlap
      if (sorted[i].startTime < sorted[i - 1].endTime) {
        conflicts.push({
          type: 'overlap',
          shift1: sorted[i - 1],
          shift2: sorted[i],
          overlapStart: sorted[i].startTime,
          overlapEnd: sorted[i - 1].endTime,
        });
      }
    }
  }

  // Check for excessive hours in a day
  const byDay = {};
  for (const sh of shifts) {
    byDay[sh.date] = (byDay[sh.date] || 0) + sh.hours;
  }
  for (const [date, hours] of Object.entries(byDay)) {
    if (hours > 12) {
      conflicts.push({ type: 'excessive_hours', date, hours, threshold: 12 });
    }
  }

  return conflicts;
}

function checkCompliance(shifts, rules = {}) {
  const violations = [];
  const maxDailyHours = rules.maxDailyHours || 12;
  const maxWeeklyHours = rules.maxWeeklyHours || 40;
  const minRestBetweenShifts = rules.minRestHours || 8;

  // Daily hours check
  const byDay = {};
  for (const sh of shifts) {
    byDay[sh.date] = (byDay[sh.date] || 0) + sh.hours;
  }
  for (const [date, hours] of Object.entries(byDay)) {
    if (hours > maxDailyHours) {
      violations.push({ rule: 'max_daily_hours', date, actual: hours, limit: maxDailyHours });
    }
  }

  // Weekly hours
  const totalHours = shifts.reduce((s, sh) => s + sh.hours, 0);
  if (totalHours > maxWeeklyHours) {
    violations.push({ rule: 'max_weekly_hours', actual: totalHours, limit: maxWeeklyHours });
  }

  // Rest between shifts
  const sorted = [...shifts].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = new Date(`${sorted[i - 1].date}T${sorted[i - 1].endTime}`);
    const currStart = new Date(`${sorted[i].date}T${sorted[i].startTime}`);
    const restHours = (currStart - prevEnd) / (60 * 60 * 1000);
    if (restHours >= 0 && restHours < minRestBetweenShifts) {
      violations.push({ rule: 'min_rest_between_shifts', between: [sorted[i - 1].date, sorted[i].date], restHours: Math.round(restHours * 100) / 100, required: minRestBetweenShifts });
    }
  }

  return { compliant: violations.length === 0, violations };
}

function optimizeSchedule(workers, requiredCoverage) {
  // Simple greedy assignment based on availability and skills
  const assignments = [];

  for (const slot of requiredCoverage) {
    const available = workers.filter(w =>
      w.worker.status === 'active' &&
      (!slot.requiredSkill || w.worker.skills.includes(slot.requiredSkill))
    );

    if (available.length > 0) {
      // Pick worker with fewest assigned hours
      const sorted = available.sort((a, b) =>
        (a.schedule.shifts.reduce((s, sh) => s + sh.hours, 0)) -
        (b.schedule.shifts.reduce((s, sh) => s + sh.hours, 0))
      );
      assignments.push({ slot, assignedWorker: sorted[0].worker.name, workerId: sorted[0].workerId });
    } else {
      assignments.push({ slot, assignedWorker: null, unfilledReason: 'no_available_workers' });
    }
  }

  return {
    filled: assignments.filter(a => a.assignedWorker).length,
    unfilled: assignments.filter(a => !a.assignedWorker).length,
    assignments,
  };
}

module.exports = { computeScheduleMetrics, detectScheduleConflicts, checkCompliance, optimizeSchedule };
