/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 3: TIMESHEET ANALYTICS — Hours & Cost Intelligence           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function computeTimesheetTotals(entries, rules = {}) {
  const dailyOTThreshold = rules.dailyOTThreshold || 8;
  const weeklyOTThreshold = rules.weeklyOTThreshold || 40;

  let totalRegular = 0;
  let totalOvertime = 0;
  const byDay = {};

  for (const entry of entries) {
    if (!byDay[entry.date]) byDay[entry.date] = 0;
    byDay[entry.date] += entry.netHours;
  }

  // Compute daily OT
  for (const [date, hours] of Object.entries(byDay)) {
    if (hours > dailyOTThreshold) {
      totalRegular += dailyOTThreshold;
      totalOvertime += hours - dailyOTThreshold;
    } else {
      totalRegular += hours;
    }
  }

  // Weekly OT check (if regular exceeds weekly threshold)
  if (totalRegular > weeklyOTThreshold) {
    const weeklyOT = totalRegular - weeklyOTThreshold;
    totalRegular = weeklyOTThreshold;
    totalOvertime += weeklyOT;
  }

  return {
    totalEntries: entries.length,
    totalDays: Object.keys(byDay).length,
    totalHours: Math.round((totalRegular + totalOvertime) * 100) / 100,
    regularHours: Math.round(totalRegular * 100) / 100,
    overtimeHours: Math.round(totalOvertime * 100) / 100,
    avgDailyHours: Object.keys(byDay).length > 0 ? Math.round(Object.values(byDay).reduce((s, h) => s + h, 0) / Object.keys(byDay).length * 100) / 100 : 0,
  };
}

function computeLaborCost(entries, costs, rules = {}) {
  const totals = computeTimesheetTotals(entries, rules);
  const regularCost = totals.regularHours * costs.hourlyRate;
  const overtimeCost = totals.overtimeHours * (costs.overtimeRate || costs.hourlyRate * 1.5);
  const benefitsCost = costs.benefits || 0;
  const totalCost = regularCost + overtimeCost + benefitsCost;

  return {
    ...totals,
    hourlyRate: costs.hourlyRate,
    overtimeRate: costs.overtimeRate || costs.hourlyRate * 1.5,
    regularCost: Math.round(regularCost * 100) / 100,
    overtimeCost: Math.round(overtimeCost * 100) / 100,
    benefitsCost: Math.round(benefitsCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerHour: totals.totalHours > 0 ? Math.round(totalCost / totals.totalHours * 100) / 100 : 0,
  };
}

function detectTimesheetAnomalies(entries) {
  const anomalies = [];

  for (const entry of entries) {
    if (entry.netHours > 16) {
      anomalies.push({ type: 'excessive_hours', date: entry.date, hours: entry.netHours, threshold: 16, severity: 'high' });
    }
    if (entry.netHours < 0) {
      anomalies.push({ type: 'negative_hours', date: entry.date, hours: entry.netHours, severity: 'critical' });
    }
    if (entry.clockIn && entry.clockOut && entry.clockIn === entry.clockOut) {
      anomalies.push({ type: 'zero_duration', date: entry.date, severity: 'medium' });
    }
    if (entry.breakMinutes > 120) {
      anomalies.push({ type: 'excessive_break', date: entry.date, breakMinutes: entry.breakMinutes, severity: 'low' });
    }
  }

  // Check for duplicate dates
  const dates = entries.map(e => e.date);
  const duplicates = dates.filter((d, i) => dates.indexOf(d) !== i);
  for (const dup of [...new Set(duplicates)]) {
    anomalies.push({ type: 'duplicate_date', date: dup, severity: 'medium' });
  }

  return anomalies;
}

function attendanceReport(records, periodStart, periodEnd) {
  const report = records.map(record => {
    const entries = record.timesheet.entries.filter(e => e.date >= periodStart && e.date <= periodEnd);
    const scheduled = record.schedule.shifts.filter(s => s.date >= periodStart && s.date <= periodEnd);

    const daysWorked = new Set(entries.map(e => e.date)).size;
    const daysScheduled = new Set(scheduled.map(s => s.date)).size;
    const attendanceRate = daysScheduled > 0 ? Math.round((daysWorked / daysScheduled) * 10000) / 100 : 100;

    return {
      workerId: record.workerId,
      name: record.worker.name,
      department: record.worker.department,
      daysScheduled,
      daysWorked,
      daysAbsent: Math.max(0, daysScheduled - daysWorked),
      attendanceRate,
      totalHours: Math.round(entries.reduce((s, e) => s + e.netHours, 0) * 100) / 100,
    };
  });

  return report.sort((a, b) => a.attendanceRate - b.attendanceRate);
}

module.exports = { computeTimesheetTotals, computeLaborCost, detectTimesheetAnomalies, attendanceReport };
