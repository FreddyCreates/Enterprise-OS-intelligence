/**
 * SUPPLEX AGI — Aviation Supply Chain & Procurement Intelligence
 * RSHIP-2026-SUPPLEX-001
 *
 * Domain: Aviation Supply Chain & Procurement
 * Latin: supplico — "to supply, to provide, to furnish"
 *   supplico (to supply/provide) connects directly to the procurement function — the act of
 *   furnishing what is needed. US airlines and airports collectively spend $50B+ annually on
 *   supply chain; procurement intelligence is a competitive weapon. SUPPLEX integrates vendor
 *   scorecards, demand forecasting, and contract compliance into a unified procurement brain.
 *
 * Theory: Vendor scorecard methodology, Pareto analysis (80/20 rule),
 *   Holt-Winters triple exponential smoothing, Herfindahl-Hirschman Index (HHI),
 *   MWBE compliance, PHI-compounding procurement intelligence (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Supply Chain & Procurement Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const SCORECARD_WEIGHTS = {
  otd:           0.35,
  quality:       0.30,
  price:         0.20,
  sustainability: 0.15,
};

const OTD_BENCHMARKS = {
  worldClass:  0.98,
  acceptable:  0.95,
  poor:        0.90,
};

const HOLT_WINTERS_DEFAULTS = {
  alpha: 0.3,   // level smoothing
  beta:  0.1,   // trend smoothing
  gamma: 0.2,   // seasonal smoothing
};

const HHI_THRESHOLDS = {
  competitive:     1500,
  moderate:        2500,
};

const MWBE_TARGETS = {
  construction:     0.30,
  goods_services:   0.25,
  professional_svcs: 0.20,
  it_technology:    0.18,
};

// ── SUPPLEX Core ──
class SUPPLEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-SUPPLEX-001';
    this.domain      = 'Aviation Supply Chain & Procurement';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: Vendor Scorecard ──
  scoreVendors(vendorData = []) {
    const results = vendorData.map(v => {
      const { vendorId, vendorName, otdRate, qualityScore, priceScore, sustainabilityScore, spend } = v;

      // Raw composite: weighted sum 0-100
      const rawComposite =
        (otdRate          || 0) * 100 * SCORECARD_WEIGHTS.otd           +
        (qualityScore     || 0)       * SCORECARD_WEIGHTS.quality        +
        (priceScore       || 0)       * SCORECARD_WEIGHTS.price          +
        (sustainabilityScore || 0)    * SCORECARD_WEIGHTS.sustainability;

      // PHI normalisation: scale so phi×50 ≈ 80.9 is the "gold standard"
      const phiGold     = this.phi * 50;
      const phiNormScore = +(rawComposite / phiGold * 100).toFixed(4);

      // Tier classification based on PHI-normalised score
      let tier = 'Tier-3';
      if (phiNormScore >= 100) tier = 'Tier-1-Elite';
      else if (phiNormScore >= 85)  tier = 'Tier-1';
      else if (phiNormScore >= 70)  tier = 'Tier-2';

      // OTD flag
      const otdFlag = (otdRate || 0) < OTD_BENCHMARKS.poor;

      return {
        vendorId,
        vendorName,
        spend: spend || 0,
        rawComposite:    +rawComposite.toFixed(4),
        phiNormScore,
        tier,
        otdRate,
        qualityScore,
        priceScore,
        sustainabilityScore,
        otdFlag,
        action: tier === 'Tier-3' ? 'PERFORMANCE-REVIEW' : tier === 'Tier-2' ? 'DEVELOPMENT-PLAN' : 'PREFERRED',
      };
    });

    results.sort((a, b) => b.phiNormScore - a.phiNormScore);
    const tierCounts = { 'Tier-1-Elite': 0, 'Tier-1': 0, 'Tier-2': 0, 'Tier-3': 0 };
    results.forEach(r => { if (tierCounts[r.tier] !== undefined) tierCounts[r.tier]++; });

    this._log('scoreVendors', { vendorCount: vendorData.length, tier1Count: tierCounts['Tier-1'] + tierCounts['Tier-1-Elite'] });
    return { vendors: results, tierCounts };
  }

  // ── Method 2: Spend Pareto Analysis ──
  analyzeSpendPareto(spendData = []) {
    const sorted = [...spendData].sort((a, b) => b.annualSpend - a.annualSpend);
    const totalSpend = sorted.reduce((s, v) => s + v.annualSpend, 0);

    let cumulativeSpend = 0;
    const results = sorted.map((v, i) => {
      cumulativeSpend += v.annualSpend;
      const spendShare    = totalSpend > 0 ? v.annualSpend / totalSpend : 0;
      const cumulativeShare = totalSpend > 0 ? cumulativeSpend / totalSpend : 0;
      const vendorShare   = (i + 1) / sorted.length;

      // Pareto segment: top 20% vendors → ~80% spend
      const inPareto20 = vendorShare <= 0.20;
      const isStrategic = inPareto20 && cumulativeShare <= 0.80;

      // Single-source risk: if vendor has >30% of category spend
      const singleSourceRisk = spendShare > 0.30;

      // PHI-strategic value: spend share × phi for top vendors
      const phiStrategicValue = +(spendShare * (isStrategic ? this.phi : this.phiInv)).toFixed(4);

      return {
        vendorId:        v.vendorId,
        vendorName:      v.vendorName,
        annualSpend:     v.annualSpend,
        spendShare:      +spendShare.toFixed(4),
        cumulativeShare: +cumulativeShare.toFixed(4),
        rank:            i + 1,
        inPareto20,
        isStrategic,
        singleSourceRisk,
        phiStrategicValue,
        segment: isStrategic ? 'STRATEGIC' : inPareto20 ? 'IMPORTANT' : cumulativeShare <= 0.95 ? 'TACTICAL' : 'TAIL',
      };
    });

    const strategicCount  = results.filter(r => r.isStrategic).length;
    const top20spend      = results.filter(r => r.inPareto20).reduce((s, r) => s + r.annualSpend, 0);
    const paretoRatio     = totalSpend > 0 ? +(top20spend / totalSpend * 100).toFixed(2) : 0;

    this._log('analyzeSpendPareto', { vendorCount: spendData.length, strategicCount, paretoRatio });
    return { vendors: results, totalSpend, strategicCount, paretoRatio, top20spendShare: paretoRatio };
  }

  // ── Method 3: MRO Demand Forecasting (Holt-Winters) ──
  forecastMRODemand(historicalData = [], horizon = 12) {
    if (historicalData.length < 4) return { error: 'Insufficient data: need at least 4 periods' };

    const { alpha, beta, gamma } = { ...HOLT_WINTERS_DEFAULTS, ...this.config.holtwinters };
    const m = 12;  // seasonal period (monthly data, annual cycle)

    // Initialize: level = mean of first cycle, trend = 0, seasonal indices = 1
    const seasonLen = Math.min(m, historicalData.length);
    let level = historicalData.slice(0, seasonLen).reduce((s, d) => s + d.demand, 0) / seasonLen;
    let trend = 0;
    const seasonal = Array(m).fill(1);

    // Calibrate seasonals from data if enough history
    if (historicalData.length >= m) {
      const yearMean = historicalData.slice(0, m).reduce((s, d) => s + d.demand, 0) / m;
      historicalData.slice(0, m).forEach((d, i) => {
        seasonal[i] = yearMean > 0 ? d.demand / yearMean : 1;
      });
    }

    // Holt-Winters triple exponential smoothing
    const fitted = [];
    historicalData.forEach((d, t) => {
      const s  = seasonal[t % m];
      const prevLevel = level;
      level = alpha * (d.demand / (s || 1)) + (1 - alpha) * (level + trend);
      trend = beta  * (level - prevLevel)   + (1 - beta)  * trend;
      seasonal[t % m] = gamma * (d.demand / (level || 1)) + (1 - gamma) * s;
      fitted.push({ period: t + 1, actual: d.demand, fitted: +(level * seasonal[t % m]).toFixed(2) });
    });

    // Generate forward forecast
    const forecast = [];
    for (let h = 1; h <= horizon; h++) {
      const forecastValue = +((level + h * trend) * seasonal[(historicalData.length + h - 1) % m]).toFixed(2);
      // PHI confidence band: ±phi% grows with horizon
      const bandWidth     = +(forecastValue * this.phiInv * 0.05 * Math.sqrt(h)).toFixed(2);
      forecast.push({
        period:        historicalData.length + h,
        forecastDemand: Math.max(forecastValue, 0),
        lower:          Math.max(forecastValue - bandWidth, 0),
        upper:          forecastValue + bandWidth,
        phiBandWidth:   bandWidth,
      });
    }

    this._log('forecastMRODemand', { histPeriods: historicalData.length, horizon });
    return { fitted, forecast, finalLevel: +level.toFixed(2), finalTrend: +trend.toFixed(4), seasonalIndices: seasonal.map(s => +s.toFixed(4)) };
  }

  // ── Method 4: Sole-Source Risk Flagging (HHI) ──
  flagSoleSourceRisk(supplyData = []) {
    // supplyData: array of { itemId, itemName, category, vendors: [{ vendorId, spend }] }
    const results = supplyData.map(item => {
      const { itemId, itemName, category, vendors = [] } = item;
      const totalSpend = vendors.reduce((s, v) => s + v.spend, 0);

      // HHI = Σ (market_share_i × 100)²
      const hhi = vendors.reduce((s, v) => {
        const share = totalSpend > 0 ? (v.spend / totalSpend) * 100 : 0;
        return s + Math.pow(share, 2);
      }, 0);

      let concentration = 'competitive';
      if (hhi > HHI_THRESHOLDS.moderate)       concentration = 'highly-concentrated';
      else if (hhi > HHI_THRESHOLDS.competitive) concentration = 'moderately-concentrated';

      const singleSource   = vendors.length === 1;
      const dominantVendor = vendors.reduce((a, b) => a.spend > b.spend ? a : b, { vendorId: null, spend: 0 });
      const dominantShare  = totalSpend > 0 ? +(dominantVendor.spend / totalSpend * 100).toFixed(2) : 0;

      // PHI-risk score: higher HHI compounds risk via phi
      const normalizedHHI  = hhi / 10000;  // 0–1 scale
      const phiRiskScore   = +(normalizedHHI * Math.pow(this.phi, singleSource ? 2 : 1)).toFixed(4);

      return {
        itemId,
        itemName,
        category,
        vendorCount:    vendors.length,
        hhi:            +hhi.toFixed(2),
        concentration,
        singleSource,
        dominantVendorId: dominantVendor.vendorId,
        dominantShare,
        phiRiskScore,
        riskLevel:    singleSource ? 'CRITICAL' : concentration === 'highly-concentrated' ? 'HIGH' : concentration === 'moderately-concentrated' ? 'MODERATE' : 'LOW',
        recommendation: singleSource ? 'IMMEDIATE-DUAL-SOURCE' : concentration !== 'competitive' ? 'DIVERSIFY-SUPPLY-BASE' : 'MAINTAIN',
      };
    });

    const criticalItems = results.filter(r => r.riskLevel === 'CRITICAL').length;
    this._log('flagSoleSourceRisk', { itemCount: supplyData.length, criticalItems });
    return { items: results, criticalItems, highRiskItems: results.filter(r => r.riskLevel === 'HIGH').length };
  }

  // ── Method 5: Contract Compliance Monitoring ──
  monitorContractCompliance(contractData = [], invoiceData = []) {
    // Build invoice lookup by vendor+category
    const invoiceMap = {};
    invoiceData.forEach(inv => {
      const key = `${inv.vendorId}:${inv.contractId}`;
      if (!invoiceMap[key]) invoiceMap[key] = { totalBilled: 0, mwbeBilled: 0 };
      invoiceMap[key].totalBilled  += inv.amount;
      invoiceMap[key].mwbeBilled   += inv.mwbeAmount || 0;
    });

    const results = contractData.map(contract => {
      const { contractId, vendorId, vendorName, contractValue, agreedUnitPrices, contractType, mwbeTarget } = contract;
      const key    = `${vendorId}:${contractId}`;
      const inv    = invoiceMap[key] || { totalBilled: 0, mwbeBilled: 0 };

      // Pricing compliance: check if billed per-unit matches agreed prices
      const pricingAnomalies = [];
      if (agreedUnitPrices && inv.totalBilled > 0) {
        // Simulate: if total billed > contractValue × 1.05 it's a pricing anomaly
        const priceTolerance = contractValue * 1.05;
        if (inv.totalBilled > priceTolerance) {
          pricingAnomalies.push({
            type: 'over-billing',
            excess: +(inv.totalBilled - contractValue).toFixed(2),
            excessPct: +((inv.totalBilled - contractValue) / contractValue * 100).toFixed(2),
          });
        }
      }

      // MWBE tracking
      const mwbeRequired = MWBE_TARGETS[contractType] || 0.20;
      const mwbeTarget_  = mwbeTarget || mwbeRequired;
      const mwbeActualPct = inv.totalBilled > 0 ? inv.mwbeBilled / inv.totalBilled : 0;
      const mwbeGap       = +(mwbeActualPct - mwbeTarget_).toFixed(4);
      const mwbeCompliant = mwbeGap >= 0;

      // PHI compliance score: 1.0 = fully compliant; decays by phi on gap magnitude
      const pricingOK   = pricingAnomalies.length === 0;
      const complianceScore = +(
        (pricingOK ? 0.5 : 0) +
        (mwbeCompliant ? 0.5 : 0.5 * Math.pow(this.phiInv, Math.abs(mwbeGap) * 10))
      ).toFixed(4);

      return {
        contractId,
        vendorId,
        vendorName,
        contractValue,
        totalBilled:    +inv.totalBilled.toFixed(2),
        mwbeBilledPct:  +mwbeActualPct.toFixed(4),
        mwbeTargetPct:  mwbeTarget_,
        mwbeGap,
        mwbeCompliant,
        pricingAnomalies,
        pricingCompliant: pricingOK,
        complianceScore,
        status: complianceScore >= 0.9 ? 'COMPLIANT' : complianceScore >= 0.6 ? 'NEEDS-ATTENTION' : 'NON-COMPLIANT',
      };
    });

    const nonCompliantCount = results.filter(r => r.status === 'NON-COMPLIANT').length;
    this._log('monitorContractCompliance', { contractCount: contractData.length, nonCompliantCount });
    return { contracts: results, nonCompliantCount, mwbeBreachCount: results.filter(r => !r.mwbeCompliant).length };
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
        'Vendor Scorecard (PHI-Normalised Composite)',
        'Spend Pareto Analysis (20/80 Rule)',
        'MRO Demand Forecasting (Holt-Winters Triple Smoothing)',
        'Sole-Source Risk Flagging (HHI Concentration Index)',
        'Contract Compliance Monitoring (Pricing + MWBE)',
      ],
      scorecardWeights: SCORECARD_WEIGHTS,
      otdBenchmarks:    OTD_BENCHMARKS,
      hhiThresholds:    HHI_THRESHOLDS,
      mwbeTargets:      MWBE_TARGETS,
      memoryLog:        this.memoryLog,
      createdAt:        this.createdAt,
      framework:        'RSHIP',
    };
  }
}

export function birthSUPPLEX(config = {}) { return new SUPPLEX(config); }
export { SUPPLEX };
export default SUPPLEX;
