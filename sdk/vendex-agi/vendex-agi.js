/**
 * VENDEX AGI — Airport Vendor Intelligence
 * RSHIP-2026-VENDEX-001
 *
 * Domain: Vendor & Concession Management
 * Latin: vendo — "to sell, to trade"
 *   From vendo (to sell), cognate with English "vend."
 *   In airports, vendors operate under complex lease structures requiring continuous financial intelligence.
 *   VENDEX monitors every financial obligation tying a vendor to the airport authority.
 *
 * Theory: MAG lease structures, Revenue benchmarking, Flight-coupled demand forecasting,
 *   Health code compliance (FDA Food Code), PHI-compounding (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Vendor & Concession Constants ──
const PHI_LOCAL = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const REVENUE_BENCHMARKS = {
  'food_beverage': { low: 800,  high: 1200, unit: '$/sqft/yr' },
  'retail':        { low: 600,  high: 900,  unit: '$/sqft/yr' },
  'news_gift':     { low: 700,  high: 1000, unit: '$/sqft/yr' },
  'services':      { low: 400,  high: 600,  unit: '$/sqft/yr' },
};

const HEALTH_VIOLATION_WEIGHTS = {
  critical: 10,   // immediate closure risk
  major:    4,    // significant compliance gap
  minor:    1,    // administrative deficiency
};

const FLIGHT_BANK_PEAKS = [
  { bank: '06:00', label: 'EarlyMorning', multiplier: 1.8 },
  { bank: '11:00', label: 'MidMorning',   multiplier: 2.4 },
  { bank: '15:00', label: 'Afternoon',    multiplier: 2.1 },
  { bank: '19:00', label: 'Evening',      multiplier: 1.9 },
];

const MAG_PENALTY_RATE  = 0.015;  // 1.5% per month shortfall
const RENEWAL_LEAD_DAYS = 90;     // days before expiry to begin renewal

// ── VENDEX Core ──
class VENDEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-VENDEX-001';
    this.domain      = 'Vendor & Concession Management';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: MAG Compliance Tracking ──
  trackMAGCompliance(vendorData = []) {
    const today = new Date();
    const results = vendorData.map(v => {
      const { vendorId, vendorName, annualMAG, paymentsToDate, monthsElapsed, totalMonths } = v;

      const expectedPace    = totalMonths > 0 ? (monthsElapsed / totalMonths) * annualMAG : 0;
      const shortfall       = Math.max(expectedPace - paymentsToDate, 0);
      const overage         = Math.max(paymentsToDate - expectedPace, 0);
      const shortfallPct    = expectedPace > 0 ? (shortfall / expectedPace) * 100 : 0;

      // Monthly penalty accrues on shortfall amount
      const penaltyAccrued  = shortfall * MAG_PENALTY_RATE * monthsElapsed;

      // PHI-weighted risk: shortfall compounds by phi as severity increases
      const riskBands       = [6.18, 16.18, 26.18];
      let riskTier          = 0;
      riskBands.forEach((band, i) => { if (shortfallPct >= band) riskTier = i + 1; });
      const phiRiskScore    = riskTier > 0 ? +(Math.pow(this.phi, riskTier) * (shortfallPct / 100)).toFixed(4) : 0;

      // Year-end projection: linear pace
      const projectedYearEnd = monthsElapsed > 0 ? (paymentsToDate / monthsElapsed) * totalMonths : 0;
      const yearEndGap       = annualMAG - projectedYearEnd;

      return {
        vendorId,
        vendorName,
        annualMAG,
        paymentsToDate,
        expectedPace: +expectedPace.toFixed(2),
        shortfall: +shortfall.toFixed(2),
        overage: +overage.toFixed(2),
        shortfallPct: +shortfallPct.toFixed(2),
        penaltyAccrued: +penaltyAccrued.toFixed(2),
        riskTier,
        phiRiskScore,
        projectedYearEnd: +projectedYearEnd.toFixed(2),
        yearEndGap: +yearEndGap.toFixed(2),
        status: shortfall > 0 ? 'shortfall' : 'compliant',
      };
    });

    const totalShortfall   = results.reduce((s, r) => s + r.shortfall, 0);
    const totalPenalty     = results.reduce((s, r) => s + r.penaltyAccrued, 0);
    const atRiskVendors    = results.filter(r => r.riskTier > 0).length;

    this._log('trackMAGCompliance', { vendorCount: vendorData.length, atRiskVendors });
    return { results, summary: { totalShortfall: +totalShortfall.toFixed(2), totalPenalty: +totalPenalty.toFixed(2), atRiskVendors } };
  }

  // ── Method 2: Revenue per Sq-Ft Benchmarking ──
  benchmarkRevenue(vendorMetrics = []) {
    const results = vendorMetrics.map(v => {
      const { vendorId, vendorName, annualRevenue, sqft, category } = v;
      const revenuePerSqft = sqft > 0 ? annualRevenue / sqft : 0;
      const bench          = REVENUE_BENCHMARKS[category] || { low: 500, high: 800 };
      const midBench       = (bench.low + bench.high) / 2;

      // Relative score: 1.0 = at midpoint benchmark
      const relativeScore  = midBench > 0 ? revenuePerSqft / midBench : 0;
      // PHI-normalised: scale around phi so >phi = outperformer
      const phiScore       = +(relativeScore * this.phi).toFixed(4);

      let performance = 'at-benchmark';
      if (revenuePerSqft < bench.low)        performance = 'underperformer';
      else if (revenuePerSqft > bench.high)  performance = 'outperformer';

      const gapToMid   = +(revenuePerSqft - midBench).toFixed(2);
      const gapToMin   = +(revenuePerSqft - bench.low).toFixed(2);

      return {
        vendorId,
        vendorName,
        category,
        annualRevenue,
        sqft,
        revenuePerSqft: +revenuePerSqft.toFixed(2),
        benchmarkLow: bench.low,
        benchmarkHigh: bench.high,
        performance,
        relativeScore: +relativeScore.toFixed(4),
        phiScore,
        gapToMid,
        gapToMin,
        recommendation: performance === 'underperformer'
          ? `Improve revenue by $${Math.abs(gapToMin).toFixed(0)}/sqft to reach minimum benchmark`
          : performance === 'outperformer'
            ? 'Consider expansion or relocation to higher-traffic zone'
            : 'Performance within benchmark band',
      };
    });

    this._log('benchmarkRevenue', { vendorCount: vendorMetrics.length });
    return {
      results,
      underperformers: results.filter(r => r.performance === 'underperformer').length,
      outperformers:   results.filter(r => r.performance === 'outperformer').length,
    };
  }

  // ── Method 3: Concession Permit Renewal Calendar ──
  renewalCalendar(permits = []) {
    const today = new Date();
    const items = permits.map(p => {
      const expiryDate      = new Date(p.expiryDate);
      const daysToExpiry    = Math.round((expiryDate - today) / 86400000);
      const renewalWindowOpen = daysToExpiry <= RENEWAL_LEAD_DAYS;
      const overdue           = daysToExpiry < 0;
      const lapseRisk         = daysToExpiry < 14;

      // PHI urgency: inverse — smaller days → higher urgency via phi scaling
      const urgencyDenominator = Math.max(Math.abs(daysToExpiry), 1);
      const phiUrgency = +(this.phi * RENEWAL_LEAD_DAYS / urgencyDenominator).toFixed(4);

      return {
        permitId:          p.permitId,
        vendorName:        p.vendorName,
        category:          p.category,
        expiryDate:        expiryDate.toISOString().split('T')[0],
        daysToExpiry,
        renewalWindowOpen,
        overdue,
        lapseRisk,
        phiUrgency,
        processingLeadDays: RENEWAL_LEAD_DAYS,
        status: overdue ? 'EXPIRED' : lapseRisk ? 'CRITICAL' : renewalWindowOpen ? 'RENEW-NOW' : 'ACTIVE',
      };
    });

    items.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
    this._log('renewalCalendar', { permitCount: permits.length, expired: items.filter(i => i.overdue).length });
    return {
      permits: items,
      summary: {
        total:    items.length,
        expired:  items.filter(i => i.overdue).length,
        critical: items.filter(i => i.lapseRisk && !i.overdue).length,
        renewNow: items.filter(i => i.renewalWindowOpen && !i.lapseRisk).length,
      },
    };
  }

  // ── Method 4: Inventory Demand Forecasting (Flight Bank Coupling) ──
  forecastInventory(flightSchedule = [], vendorCategory = 'food_beverage') {
    // Aggregate departures per hour from flight schedule
    const hourlyFlights = Array(24).fill(0);
    flightSchedule.forEach(f => {
      const hour = parseInt(f.departureTime?.split(':')[0] || '0', 10);
      if (hour >= 0 && hour < 24) hourlyFlights[hour]++;
    });

    // Apply flight bank peak multipliers by proximity to bank times
    const bankHours = FLIGHT_BANK_PEAKS.map(b => ({ hour: parseInt(b.bank.split(':')[0], 10), mult: b.multiplier }));

    const hourlyDemand = hourlyFlights.map((flights, hour) => {
      // Find nearest bank multiplier via weighted decay
      const nearest    = bankHours.reduce((best, bk) => {
        const dist = Math.abs(hour - bk.hour);
        return dist < best.dist ? { dist, mult: bk.mult } : best;
      }, { dist: 999, mult: 1.0 });

      // PHI-decayed multiplier: further from bank = less influence
      const decayedMult = nearest.mult * Math.pow(this.phiInv, nearest.dist);
      const demand      = +(flights * decayedMult).toFixed(2);
      return { hour, flights, multiplier: +decayedMult.toFixed(4), demandUnits: demand };
    });

    const totalDailyDemand = hourlyDemand.reduce((s, h) => s + h.demandUnits, 0);
    const peakHour         = hourlyDemand.reduce((a, b) => a.demandUnits > b.demandUnits ? a : b);
    const reorderPoint     = +(totalDailyDemand * 1.2).toFixed(2); // 20% safety stock

    this._log('forecastInventory', { flightCount: flightSchedule.length, vendorCategory });
    return {
      vendorCategory,
      hourlyDemand,
      totalDailyDemand: +totalDailyDemand.toFixed(2),
      peakHour: peakHour.hour,
      peakDemand: peakHour.demandUnits,
      reorderPoint,
      safetyStockPct: 20,
    };
  }

  // ── Method 5: Health Inspection Readiness Scoring ──
  scoreHealthReadiness(inspectionData = {}) {
    const { criticalViolations = [], majorViolations = [], minorViolations = [] } = inspectionData;

    const maxScore   = 150;
    const critDeduct = criticalViolations.length * HEALTH_VIOLATION_WEIGHTS.critical;
    const majDeduct  = majorViolations.length  * HEALTH_VIOLATION_WEIGHTS.major;
    const minDeduct  = minorViolations.length  * HEALTH_VIOLATION_WEIGHTS.minor;
    const rawScore   = Math.max(maxScore - critDeduct - majDeduct - minDeduct, 0);

    // PHI-normalised score: 150 / PHI ≈ 92.7 as "gold standard" threshold
    const goldThreshold = +(maxScore / this.phi).toFixed(1);
    const phiScore      = +(rawScore / goldThreshold).toFixed(4);

    let grade = 'A';
    if (rawScore < 70)      grade = 'F';
    else if (rawScore < 80) grade = 'D';
    else if (rawScore < 90) grade = 'C';
    else if (rawScore < goldThreshold) grade = 'B';

    const closureRisk  = criticalViolations.length > 0;
    const passFailResult = rawScore >= 70 && !closureRisk ? 'PASS' : 'FAIL';

    this._log('scoreHealthReadiness', { rawScore, grade, closureRisk });
    return {
      rawScore,
      maxScore,
      phiScore,
      goldThreshold,
      grade,
      passFailResult,
      closureRisk,
      criticalViolations: criticalViolations.length,
      majorViolations:    majorViolations.length,
      minorViolations:    minorViolations.length,
      deductions: { critical: critDeduct, major: majDeduct, minor: minDeduct },
      priority:   criticalViolations.length > 0 ? 'IMMEDIATE-ACTION' : majorViolations.length > 2 ? 'URGENT' : 'ROUTINE',
    };
  }

  // ── Utility: Category Sales Mix Analysis ──
  analyzeCategoryMix(vendorSalesData = []) {
    const totalRevenue = vendorSalesData.reduce((s, v) => s + v.revenue, 0);
    const results = vendorSalesData.map(v => {
      const sharePct   = totalRevenue > 0 ? v.revenue / totalRevenue * 100 : 0;
      // PHI-mix: healthy category share ≈ 100/phi ≈ 61.8% max for any single category
      const phiMaxShare = 100 * this.phiInv;
      const concentrated = sharePct > phiMaxShare;
      return {
        category:      v.category,
        revenue:       v.revenue,
        sharePct:      +sharePct.toFixed(2),
        phiMaxShare:   +phiMaxShare.toFixed(2),
        concentrated,
        status: concentrated ? 'OVER-CONCENTRATED' : 'BALANCED',
      };
    });
    return { categories: results, totalRevenue, diversificationScore: +(1 - Math.max(...results.map(r => r.sharePct)) / 100).toFixed(4) };
  }


  projectMAGPenalties(vendorId, annualMAG, currentPayments, monthsElapsed, totalMonths) {
    const projections = [];
    const baseShortfall = Math.max((monthsElapsed / totalMonths) * annualMAG - currentPayments, 0);
    for (let m = 1; m <= (totalMonths - monthsElapsed); m++) {
      const expectedByM    = ((monthsElapsed + m) / totalMonths) * annualMAG;
      const runRatePayment = monthsElapsed > 0 ? (currentPayments / monthsElapsed) * m : 0;
      const shortfallAtM   = Math.max(expectedByM - (currentPayments + runRatePayment), 0);
      const penalty        = +(shortfallAtM * MAG_PENALTY_RATE * (monthsElapsed + m)).toFixed(2);
      // PHI-compound: each month of shortfall escalates by phi-weighted factor
      const phiCompound    = +(penalty * Math.pow(this.phi, m / totalMonths)).toFixed(2);
      projections.push({ month: monthsElapsed + m, projectedShortfall: +shortfallAtM.toFixed(2), penalty, phiCompound });
    }
    return { vendorId, baseShortfall: +baseShortfall.toFixed(2), projections };
  }

  // ── Utility: Vendor Risk Summary ──
  summarizeVendorRisk(vendorId, magResult, revenueResult, renewalResult, healthResult) {
    const riskFactors = [];
    if (magResult?.riskTier > 0)          riskFactors.push({ factor: 'MAG Shortfall',       score: magResult.phiRiskScore });
    if (revenueResult?.performance === 'underperformer') riskFactors.push({ factor: 'Revenue Underperformance', score: revenueResult.phiScore });
    if (renewalResult?.status === 'CRITICAL' || renewalResult?.status === 'EXPIRED')
      riskFactors.push({ factor: 'Permit Lapse Risk', score: renewalResult.phiUrgency });
    if (healthResult?.closureRisk)        riskFactors.push({ factor: 'Health Closure Risk',  score: 5.0 });

    const totalRisk    = riskFactors.reduce((s, f) => s + f.score, 0);
    const phiRiskTotal = +(totalRisk * this.phi).toFixed(4);

    return {
      vendorId,
      riskFactors,
      totalRiskScore: +totalRisk.toFixed(4),
      phiRiskTotal,
      riskLevel: phiRiskTotal > 10 ? 'CRITICAL' : phiRiskTotal > 5 ? 'HIGH' : phiRiskTotal > 1 ? 'MODERATE' : 'LOW',
    };
  }

  _log(method, meta = {}) {
    this.memoryLog.push({ ts: new Date().toISOString(), method, ...meta });
  }

  // ── Intelligence Report ──
  intelligenceReport() {
    return {
      designation:  this.designation,
      domain:       this.domain,
      phi:          this.phi,
      capabilities: [
        'MAG Compliance Tracking',
        'Revenue per Sq-Ft Benchmarking',
        'Permit Renewal Calendar',
        'Flight-Coupled Inventory Forecasting',
        'Health Inspection Readiness Scoring',
      ],
      revenueBenchmarks: REVENUE_BENCHMARKS,
      flightBankPeaks:   FLIGHT_BANK_PEAKS,
      memoryLog:         this.memoryLog,
      createdAt:         this.createdAt,
      framework:         'RSHIP',
    };
  }
}

export function birthVENDEX(config = {}) { return new VENDEX(config); }
export { VENDEX };
export default VENDEX;
