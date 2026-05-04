/**
 * TECHEX AGI — Airport Technology & IT Systems Intelligence
 * RSHIP-2026-TECHEX-001
 *
 * Domain: Airport Technology & IT Systems
 * Latin: technicus from Greek technikos — "of art, skilled in art"
 *   technikos (skilled) elevates technology management from maintenance to strategic art.
 *   Modern airports run on AODB, FIDS, BHS, SCADA — systems whose uptime directly impacts
 *   passenger experience and safety. TECHEX applies NIST, earned value, and Bayesian inference
 *   to transform IT operations into intelligence.
 *
 * Theory: SLA/ITIL framework, NIST CSF v1.1, Earned Value Management (PMI), TCO modeling,
 *   Bayesian inference, PHI-compounding IT intelligence (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Airport Technology Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const SYSTEM_SLA_TARGETS = {
  AODB:           { uptime: 0.9999, label: 'Airport Operational Database' },
  FIDS:           { uptime: 0.9990, label: 'Flight Information Display System' },
  BHS:            { uptime: 0.9995, label: 'Baggage Handling System' },
  SCADA:          { uptime: 0.9995, label: 'SCADA / Building Systems' },
  checkin_kiosks: { uptime: 0.9990, label: 'Check-in Kiosks' },
  access_control: { uptime: 0.9990, label: 'Access Control' },
  biometric_gates:{ uptime: 0.9985, label: 'Biometric Gates' },
};

const NIST_CSF_FUNCTIONS = {
  Identify: ['Asset Management','Business Environment','Governance','Risk Assessment','Risk Management Strategy','Supply Chain Risk'],
  Protect:  ['Identity Mgmt & Access Control','Awareness & Training','Data Security','Info Protection Processes','Maintenance','Protective Technology'],
  Detect:   ['Anomalies & Events','Security Continuous Monitoring','Detection Processes'],
  Respond:  ['Response Planning','Communications','Analysis','Mitigation','Improvements'],
  Recover:  ['Recovery Planning','Improvements','Communications'],
};

const IT_ASSET_LIFECYCLE = {
  servers:         { years: 5,  annualSupportEscalation: 0.15 },
  network_equip:   { years: 7,  annualSupportEscalation: 0.10 },
  workstations:    { years: 4,  annualSupportEscalation: 0.12 },
  software_licenses:{ years: 1, annualSupportEscalation: 0.08 },
};

// ── TECHEX Core ──
class TECHEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-TECHEX-001';
    this.domain      = 'Airport Technology & IT Systems';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: System Uptime Monitoring ──
  monitorSystemUptime(systemLogs = []) {
    const results = systemLogs.map(log => {
      const { systemId, downtimeMinutes, periodMinutes, incidentCount, totalRepairMinutes } = log;
      const slaTarget   = SYSTEM_SLA_TARGETS[systemId] || { uptime: 0.9990, label: systemId };
      const uptime      = periodMinutes > 0 ? (periodMinutes - downtimeMinutes) / periodMinutes : 1;
      const slaCompliant = uptime >= slaTarget.uptime;
      const slaGap       = +(slaTarget.uptime - uptime).toFixed(6);

      // MTTR: mean time to repair
      const mttr = incidentCount > 0 ? +(totalRepairMinutes / incidentCount).toFixed(2) : 0;
      // MTBF: mean time between failures
      const mtbf = incidentCount > 0 ? +((periodMinutes - totalRepairMinutes) / incidentCount).toFixed(2) : periodMinutes;

      // PHI-severity: breach magnitude compounds via phi
      const breachPct     = slaGap / (1 - slaTarget.uptime);
      const phiSeverity   = !slaCompliant ? +(Math.pow(this.phi, Math.min(breachPct, 5)) - 1).toFixed(4) : 0;

      return {
        systemId,
        label:       slaTarget.label,
        uptime:      +uptime.toFixed(6),
        uptimePct:   +(uptime * 100).toFixed(4),
        slaTarget:   slaTarget.uptime,
        slaCompliant,
        slaGap:      +slaGap.toFixed(6),
        mttr,
        mtbf,
        phiSeverity,
        status:      slaCompliant ? 'COMPLIANT' : phiSeverity > 1 ? 'CRITICAL-BREACH' : 'SLA-BREACH',
      };
    });

    const compliantCount = results.filter(r => r.slaCompliant).length;
    this._log('monitorSystemUptime', { systemCount: systemLogs.length, compliantCount });
    return { systems: results, compliantCount, breachCount: results.length - compliantCount, overallHealth: compliantCount === results.length ? 'GREEN' : 'AT-RISK' };
  }

  // ── Method 2: NIST CSF Posture Scoring ──
  scoreNISTPosture(assessmentData = {}) {
    const functionScores = {};
    let totalCategories  = 0;
    let totalScore       = 0;

    Object.entries(NIST_CSF_FUNCTIONS).forEach(([fn, categories]) => {
      const catScores = categories.map(cat => {
        const maturity = Math.min(Math.max(assessmentData[cat] || 1, 1), 5);
        totalScore    += maturity;
        totalCategories++;
        return { category: cat, maturity, gap: 5 - maturity };
      });

      const fnAvg = catScores.reduce((s, c) => s + c.maturity, 0) / catScores.length;
      // PHI-weighted function score: higher function weights get phi-boost
      const fnWeight = { Identify: 1.0, Protect: PHI_LOCAL, Detect: 1.2, Respond: PHI_LOCAL / 1.2, Recover: 1.1 };
      const weighted  = fnAvg * (fnWeight[fn] || 1.0);

      functionScores[fn] = {
        categories:   catScores,
        averageMaturity: +fnAvg.toFixed(3),
        weightedScore:   +weighted.toFixed(3),
        maturityLevel:   fnAvg >= 4.5 ? 'Adaptive' : fnAvg >= 3.5 ? 'Defined' : fnAvg >= 2.5 ? 'Repeatable' : 'Partial',
      };
    });

    const overallAvg    = totalCategories > 0 ? +(totalScore / totalCategories).toFixed(3) : 0;
    const weightedTotal = Object.values(functionScores).reduce((s, f) => s + f.weightedScore, 0);
    const phiPostureScore = +(weightedTotal / Object.keys(functionScores).length * this.phiInv).toFixed(4);

    this._log('scoreNISTPosture', { totalCategories, overallAvg });
    return {
      functionScores,
      overallAverageMaturity: overallAvg,
      phiPostureScore,
      postureTier: overallAvg >= 4 ? 'Advanced' : overallAvg >= 3 ? 'Intermediate' : 'Foundational',
      targetMaturity: 4,
      gap: +(4 - overallAvg).toFixed(3),
    };
  }

  // ── Method 3: Earned Value Management (EVM) ──
  earnedValueAnalysis(projectPortfolio = []) {
    const results = projectPortfolio.map(proj => {
      const { projectId, name, budgetAtCompletion, plannedValue, earnedValue, actualCost } = proj;

      // Core EVM metrics
      const cpi  = actualCost  > 0 ? +(earnedValue / actualCost).toFixed(4)  : null;
      const spi  = plannedValue > 0 ? +(earnedValue / plannedValue).toFixed(4) : null;
      const cv   = +(earnedValue - actualCost).toFixed(2);    // Cost Variance
      const sv   = +(earnedValue - plannedValue).toFixed(2);  // Schedule Variance

      // Forecasts
      const eac  = cpi !== null && cpi > 0
        ? +(actualCost + (budgetAtCompletion - earnedValue) / cpi).toFixed(2)
        : budgetAtCompletion;
      const etc  = +(eac - actualCost).toFixed(2);
      const vac  = +(budgetAtCompletion - eac).toFixed(2);
      const tcpi = (budgetAtCompletion - earnedValue) !== 0
        ? +((budgetAtCompletion - earnedValue) / (budgetAtCompletion - actualCost)).toFixed(4)
        : null;

      // PHI performance index: CPI × SPI, normalized by phi
      const phiPerformance = cpi !== null && spi !== null
        ? +(cpi * spi * this.phiInv).toFixed(4)
        : null;

      return {
        projectId,
        name,
        budgetAtCompletion,
        plannedValue,
        earnedValue,
        actualCost,
        cpi, spi, cv, sv, eac, etc, vac, tcpi,
        phiPerformance,
        costStatus:     cv >= 0 ? 'under-budget' : 'over-budget',
        scheduleStatus: sv >= 0 ? 'ahead'        : 'behind',
        health: cpi !== null && spi !== null
          ? (cpi >= 1 && spi >= 1 ? 'GREEN' : cpi >= 0.9 && spi >= 0.9 ? 'YELLOW' : 'RED')
          : 'UNKNOWN',
      };
    });

    const redProjects = results.filter(r => r.health === 'RED').length;
    this._log('earnedValueAnalysis', { projectCount: projectPortfolio.length, redProjects });
    return { projects: results, portfolioHealth: { red: redProjects, yellow: results.filter(r => r.health === 'YELLOW').length, green: results.filter(r => r.health === 'GREEN').length } };
  }

  // ── Method 4: Technology Refresh Cycle Planning (TCO) ──
  planTechRefresh(assetInventory = []) {
    const currentYear = new Date().getFullYear();

    const results = assetInventory.map(asset => {
      const { assetId, assetType, purchaseYear, purchaseCost, annualSupportCost } = asset;
      const lifecycle   = IT_ASSET_LIFECYCLE[assetType] || IT_ASSET_LIFECYCLE['workstations'];
      const age         = currentYear - (purchaseYear || currentYear);
      const remainingLife = Math.max(lifecycle.years - age, 0);

      // TCO with escalating support costs
      let supportTCO = 0;
      for (let y = 0; y <= age; y++) {
        supportTCO += annualSupportCost * Math.pow(1 + lifecycle.annualSupportEscalation, y);
      }

      const totalTCO      = purchaseCost + supportTCO;
      const tcoPerYear    = age > 0 ? +(totalTCO / age).toFixed(2) : totalTCO;

      // PHI-refresh threshold: age > lifecycle.years / phi = optimal refresh window
      const phiThreshold  = lifecycle.years / this.phi;
      const refreshNow    = age >= phiThreshold || remainingLife === 0;

      // Next 3-year support cost if not refreshed (escalating)
      const futureSupport = Array.from({ length: 3 }, (_, i) =>
        +(annualSupportCost * Math.pow(1 + lifecycle.annualSupportEscalation, age + i + 1)).toFixed(2)
      );

      return {
        assetId,
        assetType,
        purchaseYear,
        age,
        remainingLife,
        totalTCO: +totalTCO.toFixed(2),
        tcoPerYear,
        phiThreshold: +phiThreshold.toFixed(2),
        refreshNow,
        futureAnnualSupport: futureSupport,
        priority: age > lifecycle.years ? 'OVERDUE' : refreshNow ? 'REFRESH-SOON' : 'CURRENT',
      };
    });

    results.sort((a, b) => b.age - a.age);
    this._log('planTechRefresh', { assetCount: assetInventory.length, overdueCount: results.filter(r => r.priority === 'OVERDUE').length });
    return { assets: results, overdueCount: results.filter(r => r.priority === 'OVERDUE').length, refreshSoonCount: results.filter(r => r.priority === 'REFRESH-SOON').length };
  }

  // ── Method 5: Bayesian SLA Breach Prediction ──
  predictSLABreach(vendorData = []) {
    const results = vendorData.map(vendor => {
      const { vendorId, vendorName, systemId, priorBreachCount, totalPeriods, recentTicketVolume, avgResponseTimeMinutes } = vendor;

      // Prior breach probability: Beta-Binomial (conjugate prior)
      const alpha = (priorBreachCount || 0) + 1;  // prior successes (breaches) + 1
      const beta  = (totalPeriods || 12) - (priorBreachCount || 0) + 1;  // prior failures + 1
      const priorP = alpha / (alpha + beta);

      // Likelihood adjustment: ticket volume and response time are leading indicators
      const sla      = SYSTEM_SLA_TARGETS[systemId] || { uptime: 0.999 };
      const normalRT = 30;  // normal avg response minutes
      const rtRatio  = avgResponseTimeMinutes > 0 ? avgResponseTimeMinutes / normalRT : 1;
      const ticketFactor = Math.log1p(recentTicketVolume || 0) / Math.log1p(10);

      // Posterior update via likelihood scaling
      const likelihoodRatio = Math.min(rtRatio * (1 + ticketFactor * 0.5), 5);
      const posteriorP      = Math.min(priorP * likelihoodRatio, 0.99);

      // PHI-confidence interval: posterior ± phi-scaled std error
      const stdError    = Math.sqrt((posteriorP * (1 - posteriorP)) / Math.max(totalPeriods, 1));
      const phiCI       = +(stdError * this.phi).toFixed(4);
      const ciLow       = +Math.max(posteriorP - phiCI, 0).toFixed(4);
      const ciHigh      = +Math.min(posteriorP + phiCI, 1).toFixed(4);

      return {
        vendorId,
        vendorName,
        systemId,
        priorBreachProbability: +priorP.toFixed(4),
        posteriorBreachProbability: +posteriorP.toFixed(4),
        confidenceInterval: { low: ciLow, high: ciHigh },
        phiCI,
        riskLevel: posteriorP > 0.5 ? 'HIGH' : posteriorP > 0.25 ? 'MODERATE' : 'LOW',
        action: posteriorP > 0.5 ? 'ESCALATE-TO-VENDOR' : posteriorP > 0.25 ? 'INCREASED-MONITORING' : 'ROUTINE',
      };
    });

    this._log('predictSLABreach', { vendorCount: vendorData.length, highRisk: results.filter(r => r.riskLevel === 'HIGH').length });
    return { vendors: results, highRiskCount: results.filter(r => r.riskLevel === 'HIGH').length };
  }

  // ── Utility: IT Risk Score ──
  computeITRiskScore(uptimeResults = [], postureResult = {}, projectResults = []) {
    const uptimeRisk    = uptimeResults.length > 0
      ? uptimeResults.reduce((s, r) => s + (r.phiSeverity || 0), 0) / uptimeResults.length
      : 0;
    const postureRisk   = postureResult.overallAverageMaturity
      ? Math.max(4 - postureResult.overallAverageMaturity, 0) * this.phiInv
      : 0;
    const evmRisk       = projectResults.filter(p => p.health === 'RED').length * 0.5;

    const totalRisk     = +(uptimeRisk + postureRisk + evmRisk).toFixed(4);
    // PHI-composite risk: scores compound toward critical via phi
    const phiRisk       = +(totalRisk * this.phi).toFixed(4);

    return {
      uptimeRisk: +uptimeRisk.toFixed(4),
      postureRisk: +postureRisk.toFixed(4),
      evmRisk: +evmRisk.toFixed(4),
      totalRisk,
      phiRisk,
      level: phiRisk > 3 ? 'CRITICAL' : phiRisk > 1.5 ? 'HIGH' : phiRisk > 0.5 ? 'MODERATE' : 'LOW',
    };
  }

  // ── Utility: Patch Coverage Scoring ──
  scorePatchCoverage(assetInventory = []) {
    const patched   = assetInventory.filter(a => a.patchCurrent).length;
    const total     = assetInventory.length;
    const coverage  = total > 0 ? patched / total : 0;

    // PHI-threshold: coverage < 1/phi ≈ 0.618 is below "golden minimum"
    const goldenMin = this.phiInv;
    const belowGolden = coverage < goldenMin;

    return {
      totalAssets:  total,
      patchedCount: patched,
      coveragePct:  +(coverage * 100).toFixed(2),
      goldenMinPct: +(goldenMin * 100).toFixed(2),
      belowGolden,
      phiCoverage:  +(coverage * this.phi).toFixed(4),
      status: coverage >= 0.99 ? 'FULL' : coverage >= goldenMin ? 'ADEQUATE' : 'DEFICIENT',
    };
  }

  // ── Utility: Incident MTTR Trend ──
  analyzeMTTRTrend(incidentHistory = []) {
    if (incidentHistory.length === 0) return { trend: 'no-data' };
    const sorted    = [...incidentHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const mttrValues = sorted.map(i => i.resolutionMinutes || 0);
    const avg        = mttrValues.reduce((s, v) => s + v, 0) / mttrValues.length;
    const mid        = Math.floor(mttrValues.length / 2);
    const firstHalf  = mttrValues.slice(0, mid).reduce((s, v) => s + v, 0) / Math.max(mid, 1);
    const secondHalf = mttrValues.slice(mid).reduce((s, v) => s + v, 0) / Math.max(mttrValues.length - mid, 1);
    const trendRatio = firstHalf > 0 ? secondHalf / firstHalf : 1;
    // PHI-improvement: if MTTR declining and ratio < 1/phi = significant improvement
    const significantImprovement = trendRatio < this.phiInv;

    return {
      averageMTTR:         +avg.toFixed(2),
      firstHalfAvg:        +firstHalf.toFixed(2),
      secondHalfAvg:       +secondHalf.toFixed(2),
      trendRatio:          +trendRatio.toFixed(4),
      trend:               trendRatio < 0.9 ? 'improving' : trendRatio > 1.1 ? 'worsening' : 'stable',
      significantImprovement,
    };
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
        'Airport IT System Uptime Monitoring (SLA)',
        'Cybersecurity Posture Scoring (NIST CSF)',
        'IT Project Portfolio EVM (CPI/SPI/EAC)',
        'Technology Refresh Cycle Planning (TCO)',
        'Vendor SLA Breach Prediction (Bayesian)',
      ],
      systemSLATargets:  SYSTEM_SLA_TARGETS,
      nistFunctions:     Object.keys(NIST_CSF_FUNCTIONS),
      itAssetLifecycle:  IT_ASSET_LIFECYCLE,
      memoryLog:         this.memoryLog,
      createdAt:         this.createdAt,
      framework:         'RSHIP',
    };
  }
}

export function birthTECHEX(config = {}) { return new TECHEX(config); }
export { TECHEX };
export default TECHEX;
