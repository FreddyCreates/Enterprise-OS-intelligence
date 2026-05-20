/**
 * MANAGEX AGI — Airport Operations Manager Intelligence
 * RSHIP-2026-MANAGEX-001
 *
 * Domain: Airport Operations Management
 * Latin: manager from manus (hand) + agere (to drive) — "to drive by hand"
 *   manus (hand) connotes direct control; agere (to drive) implies purposeful direction.
 *   Together they define the hands-on orchestration of complex airport operations.
 *
 * Theory: CPM/PERT (Project Management), Variance Analysis,
 *   PHI-compounding workforce intelligence (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Airport Operations Constants ──
const PHI_LOCAL = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const VARIANCE_BANDS = {
  low:    PHI_LOCAL * 3.82,   // ~6.18%
  medium: PHI_LOCAL * 10.0,   // ~16.18%
  high:   PHI_LOCAL * 16.18,  // ~26.18%
};

const KPI_BENCHMARKS = {
  otp:            { target: 85,  unit: '%',   direction: 'gte' },
  tsaWaitTime:    { target: 15,  unit: 'min', direction: 'lte' },
  baggageClaim:   { target: 20,  unit: 'min', direction: 'lte' },
  gateUtilization:{ target: 75,  unit: '%',   direction: 'gte' },
  csat:           { target: 4.2, unit: '/5',  direction: 'gte' },
};

const FAA_PART139 = {
  'Wildlife Hazard Assessment': { frequencyDays: 365, category: 'Part 139.337' },
  'Self-Inspection'           : { frequencyDays: 12,  category: 'Part 139.327' },
  'ARFF Equipment Check'      : { frequencyDays: 1,   category: 'Part 139.315' },
  'Movement Area Inspection'  : { frequencyDays: 1,   category: 'Part 139.327' },
  'Pavement Condition Report' : { frequencyDays: 365, category: 'Part 139.305' },
};

const TSA_1542 = {
  'Access Control Audit'      : { frequencyDays: 365, type: 'Regulatory' },
  'Personnel Identification'  : { frequencyDays: 180, type: 'Compliance' },
  'Perimeter Security Review' : { frequencyDays: 365, type: 'Regulatory' },
  'Vendor Escort Procedures'  : { frequencyDays: 90,  type: 'Operational' },
};

const LABOR_BENCHMARKS = {
  laborRevenueRatioTarget: 0.28,
  overtimeThresholdPct:    0.10,
  shiftEfficiencyTarget:   0.85,
};

// ── MANAGEX Core ──
class MANAGEX {
  constructor(config = {}) {
    this.designation   = 'RSHIP-2026-MANAGEX-001';
    this.domain        = 'Airport Operations Management';
    this.phi           = PHI_LOCAL;
    this.phiInv        = PHI_INV_LOCAL;
    this.config        = config;
    this.createdAt     = new Date().toISOString();
    this.memoryLog     = [];
  }

  // ── Method 1: Budget Variance Tracking ──
  trackBudgetVariance(budgetData = []) {
    const results = budgetData.map(item => {
      const { costCenter, budget, actual } = item;
      const variance    = actual - budget;
      const variancePct = budget !== 0 ? (variance / budget) * 100 : 0;
      const absVpct     = Math.abs(variancePct);

      let severity = 'nominal';
      let band     = 0;
      if (absVpct >= VARIANCE_BANDS.high) {
        severity = 'critical';
        band     = 3;
      } else if (absVpct >= VARIANCE_BANDS.medium) {
        severity = 'elevated';
        band     = 2;
      } else if (absVpct >= VARIANCE_BANDS.low) {
        severity = 'watch';
        band     = 1;
      }

      // PHI-weighted severity score: higher band compounds via PHI
      const phiScore = band > 0 ? Math.pow(this.phi, band) * (absVpct / 100) : 0;

      return {
        costCenter,
        budget,
        actual,
        variance,
        variancePct: +variancePct.toFixed(2),
        severity,
        phiSeverityScore: +phiScore.toFixed(4),
        direction: variance >= 0 ? 'over' : 'under',
      };
    });

    const totalBudget  = budgetData.reduce((s, i) => s + i.budget, 0);
    const totalActual  = budgetData.reduce((s, i) => s + i.actual, 0);
    const totalVarPct  = totalBudget ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
    const criticalCount = results.filter(r => r.severity === 'critical').length;

    this._log('trackBudgetVariance', { itemCount: budgetData.length, criticalCount });
    return { results, summary: { totalBudget, totalActual, totalVariancePct: +totalVarPct.toFixed(2), criticalCount } };
  }

  // ── Method 2: CPM/PERT Scheduling ──
  scheduleCPMPERT(activities = []) {
    // PERT expected duration: (O + 4M + P) / 6; std dev: (P - O) / 6
    const nodes = {};
    activities.forEach(a => {
      const te    = (a.optimistic + 4 * a.mostLikely + a.pessimistic) / 6;
      const sigma = (a.pessimistic - a.optimistic) / 6;
      nodes[a.id] = { ...a, te: +te.toFixed(3), sigma: +sigma.toFixed(3), ES: 0, EF: 0, LS: 0, LF: 0, float: 0 };
    });

    // Forward pass — topological order via simple iteration
    const sorted = this._topoSort(activities);
    sorted.forEach(id => {
      const n = nodes[id];
      const predFinish = (n.predecessors || []).map(pid => nodes[pid]?.EF || 0);
      n.ES = predFinish.length ? Math.max(...predFinish) : 0;
      n.EF = +(n.ES + n.te).toFixed(3);
    });

    const projectEnd = Math.max(...sorted.map(id => nodes[id].EF));

    // Backward pass
    [...sorted].reverse().forEach(id => {
      const n = nodes[id];
      const successors = sorted.filter(sid => (nodes[sid].predecessors || []).includes(id));
      n.LF = successors.length ? Math.min(...successors.map(sid => nodes[sid].LS)) : projectEnd;
      n.LS = +(n.LF - n.te).toFixed(3);
      n.float = +(n.LS - n.ES).toFixed(3);
    });

    const criticalPath = sorted.filter(id => nodes[id].float === 0);
    const criticalDuration = criticalPath.reduce((s, id) => s + nodes[id].te, 0);

    // PHI-weighted project complexity score
    const avgSigma = sorted.reduce((s, id) => s + nodes[id].sigma, 0) / sorted.length;
    const complexityScore = +(criticalPath.length * this.phi * avgSigma).toFixed(4);

    this._log('scheduleCPMPERT', { activityCount: activities.length, criticalPathLength: criticalPath.length });
    return {
      activities: Object.values(nodes),
      criticalPath,
      projectDuration: +criticalDuration.toFixed(3),
      complexityScore,
      projectEnd: +projectEnd.toFixed(3),
    };
  }

  // ── Method 3: KPI Dashboard Monitoring ──
  monitorKPIs(kpiData = {}) {
    const report = {};
    Object.entries(KPI_BENCHMARKS).forEach(([kpiKey, bench]) => {
      const value = kpiData[kpiKey];
      if (value === undefined) return;

      const gap = bench.direction === 'gte' ? value - bench.target : bench.target - value;
      const gapPct = bench.target !== 0 ? Math.abs(gap / bench.target) * 100 : 0;

      let status = 'green';
      let alertLevel = 0;
      if (gap < 0) {
        const absPct = gapPct;
        if (absPct >= VARIANCE_BANDS.high)       { status = 'red';    alertLevel = 3; }
        else if (absPct >= VARIANCE_BANDS.medium) { status = 'orange'; alertLevel = 2; }
        else                                       { status = 'yellow'; alertLevel = 1; }
      }

      // PHI-ratio alert band widths scale exponentially
      const phiAlertScore = alertLevel > 0 ? +(Math.pow(this.phi, alertLevel) * (gapPct / 100)).toFixed(4) : 0;

      report[kpiKey] = {
        value,
        target: bench.target,
        unit: bench.unit,
        gap: +gap.toFixed(3),
        gapPct: +gapPct.toFixed(2),
        status,
        alertLevel,
        phiAlertScore,
      };
    });

    const alerts = Object.entries(report).filter(([, v]) => v.alertLevel > 0).map(([k, v]) => ({ kpi: k, ...v }));
    this._log('monitorKPIs', { kpiCount: Object.keys(report).length, alertCount: alerts.length });
    return { kpiReport: report, alerts, overallHealth: alerts.length === 0 ? 'healthy' : 'at-risk' };
  }

  // ── Method 4: Regulatory Compliance Calendar ──
  complianceCalendar(facilityData = {}) {
    const today = new Date();
    const items = [];

    const addItems = (registry, source) => {
      Object.entries(registry).forEach(([name, meta]) => {
        const lastDate   = facilityData[name] ? new Date(facilityData[name]) : new Date(today - meta.frequencyDays * 86400000 * 1.1);
        const nextDue    = new Date(lastDate.getTime() + meta.frequencyDays * 86400000);
        const daysToExpiry = Math.round((nextDue - today) / 86400000);
        const overdue    = daysToExpiry < 0;
        const urgencyScore = overdue
          ? +(this.phi * Math.abs(daysToExpiry) / meta.frequencyDays * 10).toFixed(3)
          : +(this.phiInv * (meta.frequencyDays / Math.max(daysToExpiry, 1))).toFixed(3);

        items.push({
          name,
          source,
          category: meta.category || meta.type,
          lastCompleted: lastDate.toISOString().split('T')[0],
          nextDue: nextDue.toISOString().split('T')[0],
          daysToExpiry,
          overdue,
          urgencyScore,
          frequencyDays: meta.frequencyDays,
        });
      });
    };

    addItems(FAA_PART139, 'FAA Part 139');
    addItems(TSA_1542,    'TSA 1542');

    items.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    const overdueCount = items.filter(i => i.overdue).length;
    const dueInWeek    = items.filter(i => i.daysToExpiry >= 0 && i.daysToExpiry <= 7).length;

    this._log('complianceCalendar', { totalItems: items.length, overdueCount, dueInWeek });
    return { items, summary: { totalItems: items.length, overdueCount, dueInWeek } };
  }

  // ── Method 5: Labor/Ops Cost Optimization ──
  optimizeLaborCosts(laborData = {}) {
    const { shifts = [], totalRevenue = 0 } = laborData;

    const shiftAnalysis = shifts.map(shift => {
      const regularHours  = Math.min(shift.hoursWorked, 8) * shift.headcount;
      const overtimeHours = Math.max(shift.hoursWorked - 8, 0) * shift.headcount;
      const regularCost   = regularHours * shift.hourlyRate;
      const overtimeCost  = overtimeHours * shift.hourlyRate * 1.5;
      const totalCost     = regularCost + overtimeCost;
      const overtimePct   = regularCost + overtimeCost > 0 ? overtimeCost / (regularCost + overtimeCost) : 0;

      // PHI-weighted shift efficiency: penalizes overtime disproportionately
      const efficiencyScore = +(1 - overtimePct * this.phi).toFixed(4);

      return {
        shiftId: shift.id,
        headcount: shift.headcount,
        regularCost: +regularCost.toFixed(2),
        overtimeCost: +overtimeCost.toFixed(2),
        totalCost: +totalCost.toFixed(2),
        overtimePct: +overtimePct.toFixed(4),
        overtimeFlag: overtimePct > LABOR_BENCHMARKS.overtimeThresholdPct,
        efficiencyScore,
      };
    });

    const totalLaborCost = shiftAnalysis.reduce((s, sh) => s + sh.totalCost, 0);
    const laborRevenueRatio = totalRevenue > 0 ? totalLaborCost / totalRevenue : null;
    const laborFlag  = laborRevenueRatio !== null && laborRevenueRatio > LABOR_BENCHMARKS.laborRevenueRatioTarget;
    const excessCost = laborFlag ? +(totalLaborCost - totalRevenue * LABOR_BENCHMARKS.laborRevenueRatioTarget).toFixed(2) : 0;

    this._log('optimizeLaborCosts', { shiftCount: shifts.length, laborFlag });
    return {
      shiftAnalysis,
      totalLaborCost: +totalLaborCost.toFixed(2),
      laborRevenueRatio: laborRevenueRatio !== null ? +laborRevenueRatio.toFixed(4) : null,
      laborFlag,
      excessCost,
      recommendation: laborFlag
        ? `Reduce labor cost by $${excessCost} — target ratio ${(LABOR_BENCHMARKS.laborRevenueRatioTarget * 100).toFixed(0)}%`
        : 'Labor cost within target band.',
    };
  }

  // ── Internal helpers ──
  _topoSort(activities) {
    const inDegree = {};
    const adjList  = {};
    activities.forEach(a => {
      inDegree[a.id] = inDegree[a.id] || 0;
      adjList[a.id]  = adjList[a.id]  || [];
      (a.predecessors || []).forEach(pid => {
        inDegree[a.id] = (inDegree[a.id] || 0) + 1;
        adjList[pid]   = adjList[pid] || [];
        adjList[pid].push(a.id);
      });
    });
    const queue  = activities.filter(a => (inDegree[a.id] || 0) === 0).map(a => a.id);
    const sorted = [];
    while (queue.length) {
      const id = queue.shift();
      sorted.push(id);
      (adjList[id] || []).forEach(nid => {
        inDegree[nid]--;
        if (inDegree[nid] === 0) queue.push(nid);
      });
    }
    return sorted;
  }

  // ── Utility: PERT Risk Analysis ──
  pertRiskAnalysis(activities = []) {
    // Compute project variance and 90% confidence duration
    const critPath = this.scheduleCPMPERT(activities);
    const critIds  = critPath.criticalPath || [];
    const actMap   = {};
    activities.forEach(a => { actMap[a.id] = a; });

    const pathVariance = critIds.reduce((s, id) => {
      const a = actMap[id];
      if (!a) return s;
      const sigma = (a.pessimistic - a.optimistic) / 6;
      return s + Math.pow(sigma, 2);
    }, 0);

    const stdDev90 = Math.sqrt(pathVariance) * 1.282;  // 90th percentile Z
    const dur90    = +(critPath.projectDuration + stdDev90).toFixed(3);

    // PHI-risk buffer: add phi-weighted contingency beyond 90%
    const phiBuffer = +(stdDev90 * (this.phi - 1)).toFixed(3);
    const dur95phi  = +(dur90 + phiBuffer).toFixed(3);

    return {
      expectedDuration:    critPath.projectDuration,
      pathStdDev:          +Math.sqrt(pathVariance).toFixed(3),
      duration90thPct:     dur90,
      phiContingencyBuffer: phiBuffer,
      duration95phiTarget: dur95phi,
      criticalPathLength:  critIds.length,
    };
  }

  // ── Utility: Staffing Sensitivity Model ──
  staffingSensitivity(baseRevenue, headcountVariants = []) {
    return headcountVariants.map(v => {
      const laborCost    = v.headcount * v.hoursPerDay * v.hourlyRate * 365;
      const laborRatio   = baseRevenue > 0 ? laborCost / baseRevenue : null;
      const targetRatio  = LABOR_BENCHMARKS.laborRevenueRatioTarget;
      const delta        = laborRatio !== null ? laborRatio - targetRatio : 0;
      // PHI-sensitivity: deviation from target amplified by phi
      const phiSensitivity = +(Math.abs(delta) * this.phi).toFixed(4);
      return {
        scenario:    v.label || `${v.headcount} staff`,
        headcount:   v.headcount,
        laborCost:   +laborCost.toFixed(2),
        laborRatio:  laborRatio !== null ? +laborRatio.toFixed(4) : null,
        delta:       +delta.toFixed(4),
        phiSensitivity,
        overTarget:  delta > 0,
      };
    });
  }

  _log(method, meta = {}) {
    this.memoryLog.push({ ts: new Date().toISOString(), method, ...meta });
  }

  // ── Intelligence Report ──
  intelligenceReport() {
    return {
      designation: this.designation,
      domain:      this.domain,
      phi:         this.phi,
      capabilities: [
        'Budget Variance Tracking',
        'CPM/PERT Scheduling',
        'KPI Dashboard Monitoring',
        'Regulatory Compliance Calendar',
        'Labor/Ops Cost Optimization',
      ],
      kpiBenchmarks:   KPI_BENCHMARKS,
      varianceBands:   VARIANCE_BANDS,
      laborBenchmarks: LABOR_BENCHMARKS,
      memoryLog:       this.memoryLog,
      createdAt:       this.createdAt,
      framework:       'RSHIP',
    };
  }
}

export function birthMANAGEX(config = {}) { return new MANAGEX(config); }
export { MANAGEX };
export default MANAGEX;
