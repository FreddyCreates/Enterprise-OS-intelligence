/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 4: WORKFORCE PLANNING — Capacity & Demand Forecasting        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function computeWorkforceCapacity(records) {
  const active = records.filter(r => r.worker.status === 'active');
  const byDept = {};

  for (const r of active) {
    const dept = r.worker.department || 'unassigned';
    if (!byDept[dept]) byDept[dept] = { department: dept, headcount: 0, totalHoursAvailable: 0, skills: new Set() };
    byDept[dept].headcount++;
    byDept[dept].totalHoursAvailable += 40; // Standard 40hr/week
    for (const skill of r.worker.skills) byDept[dept].skills.add(skill);
  }

  return {
    totalHeadcount: active.length,
    totalCapacityHours: active.length * 40,
    byDepartment: Object.values(byDept).map(d => ({ ...d, skills: [...d.skills] })),
    skillsCoverage: [...new Set(active.flatMap(r => r.worker.skills))],
  };
}

function computeUtilization(records, periodStart, periodEnd) {
  return records.filter(r => r.worker.status === 'active').map(record => {
    const entries = record.timesheet.entries.filter(e => e.date >= periodStart && e.date <= periodEnd);
    const hoursWorked = entries.reduce((s, e) => s + e.netHours, 0);
    const hoursAvailable = 40; // Weekly capacity
    const utilizationRate = hoursAvailable > 0 ? Math.round((hoursWorked / hoursAvailable) * 10000) / 100 : 0;

    return {
      workerId: record.workerId,
      name: record.worker.name,
      department: record.worker.department,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      hoursAvailable,
      utilizationRate,
      status: utilizationRate > 100 ? 'overloaded' : utilizationRate >= 80 ? 'optimal' : utilizationRate >= 50 ? 'underutilized' : 'idle',
    };
  });
}

function skillsGapAnalysis(records, requiredSkills) {
  const available = {};
  for (const r of records.filter(r => r.worker.status === 'active')) {
    for (const skill of r.worker.skills) {
      available[skill] = (available[skill] || 0) + 1;
    }
  }

  return requiredSkills.map(req => {
    const have = available[req.skill] || 0;
    const need = req.count || 1;
    return {
      skill: req.skill,
      required: need,
      available: have,
      gap: Math.max(0, need - have),
      surplus: Math.max(0, have - need),
      covered: have >= need,
    };
  });
}

function headcountForecast(records, growthRate = 0.1, months = 6) {
  const current = records.filter(r => r.worker.status === 'active').length;
  const monthly = [];
  let projected = current;

  for (let i = 1; i <= months; i++) {
    projected = Math.ceil(projected * (1 + growthRate / 12));
    monthly.push({ month: i, headcount: projected, newHires: projected - (monthly[i - 2] ? monthly[i - 2].headcount : current) });
  }

  return { currentHeadcount: current, growthRate, projectedMonths: months, projections: monthly };
}

function overtimeAnalysis(records, periodStart, periodEnd) {
  const results = records.map(record => {
    const entries = record.timesheet.entries.filter(e => e.date >= periodStart && e.date <= periodEnd);
    const totalHours = entries.reduce((s, e) => s + e.netHours, 0);
    const otHours = Math.max(0, totalHours - 40);

    return {
      workerId: record.workerId,
      name: record.worker.name,
      department: record.worker.department,
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: Math.min(totalHours, 40),
      overtimeHours: Math.round(otHours * 100) / 100,
      overtimeCost: Math.round(otHours * (record.costs.overtimeRate || record.costs.hourlyRate * 1.5) * 100) / 100,
    };
  }).filter(r => r.overtimeHours > 0);

  return {
    workersWithOT: results.length,
    totalOTHours: Math.round(results.reduce((s, r) => s + r.overtimeHours, 0) * 100) / 100,
    totalOTCost: Math.round(results.reduce((s, r) => s + r.overtimeCost, 0) * 100) / 100,
    details: results.sort((a, b) => b.overtimeHours - a.overtimeHours),
  };
}

module.exports = { computeWorkforceCapacity, computeUtilization, skillsGapAnalysis, headcountForecast, overtimeAnalysis };
