/**
 * PROPEX AGI — Commercial Property & Space Intelligence
 * RSHIP-2026-PROPEX-001
 *
 * Domain: Commercial Property & Space Management
 * Latin: proprius — "one's own, particular, belonging to"
 *   proprius (one's own) grounds PROPEX in ownership intelligence — every square foot has
 *   an owner, a value, a lease. Airport commercial real estate generates billions in
 *   non-aeronautical revenue; space intelligence drives board strategy. PROPEX aligns
 *   master plan, lease portfolio, and capital deployment into a unified intelligence layer.
 *
 * Theory: DCF/IRR (Finance), Lease renewal probability modeling,
 *   Airport master planning (FAA AC 150/5070-6B), Comparable market analysis,
 *   PHI-compounding property intelligence (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Commercial Property Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const AIRPORT_HUB_TIERS = {
  large:    { label: 'Large Hub',  enplanementPct: '>1%',       revPerSqft: { low: 900,  high: 1400 } },
  medium:   { label: 'Medium Hub', enplanementPct: '0.25-1%',   revPerSqft: { low: 700,  high: 1100 } },
  small:    { label: 'Small Hub',  enplanementPct: '0.05-0.25%',revPerSqft: { low: 500,  high: 800  } },
  nonhub:   { label: 'Non-Hub',    enplanementPct: '<0.05%',    revPerSqft: { low: 300,  high: 550  } },
};

const DISCOUNT_RATES = { conservative: 0.05, moderate: 0.065, aggressive: 0.08 };

const LEASE_RENEWAL_BASE = {
  anchor_tenant:    0.82,
  food_beverage:    0.74,
  retail:           0.66,
  services:         0.71,
  news_gift:        0.60,
};

const MASTER_PLAN_DIMENSIONS = [
  'landside_capacity',    'terminal_capacity',   'airside_capacity',
  'ground_transportation','utilities_infra',     'environmental_sustainability',
  'security_integration', 'commercial_revenue',
];

// ── PROPEX Core ──
class PROPEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-PROPEX-001';
    this.domain      = 'Commercial Property & Space Management';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: Leasable Space Utilization Heatmap ──
  heatmapSpaceUtilization(spaceData = []) {
    const results = spaceData.map(space => {
      const { spaceId, name, sqft, annualRevenue, category, terminal, level } = space;
      const revenuePerSqft = sqft > 0 ? annualRevenue / sqft : 0;

      // Percentile rank among all spaces — computed below after mapping
      return { spaceId, name, sqft, annualRevenue, category, terminal, level, revenuePerSqft: +revenuePerSqft.toFixed(2) };
    });

    // Compute percentile ranks
    const sorted = [...results].sort((a, b) => a.revenuePerSqft - b.revenuePerSqft);
    results.forEach(r => {
      const rank       = sorted.findIndex(s => s.spaceId === r.spaceId);
      r.percentileRank = +((rank / sorted.length) * 100).toFixed(1);

      // PHI-density score: high performer if > phi × median
      const median    = sorted[Math.floor(sorted.length / 2)]?.revenuePerSqft || 0;
      r.phiDensity    = median > 0 ? +(r.revenuePerSqft / (median * this.phi)).toFixed(4) : 0;
      r.heatZone      = r.percentileRank >= 75 ? 'hot' : r.percentileRank >= 40 ? 'warm' : 'cold';
      r.action        = r.heatZone === 'cold' ? 'Review tenant mix or repurpose' : r.heatZone === 'hot' ? 'Priority renewal / expand' : 'Monitor';
    });

    const totalRevenue   = results.reduce((s, r) => s + r.annualRevenue, 0);
    const totalSqft      = results.reduce((s, r) => s + r.sqft, 0);
    const avgRevPerSqft  = totalSqft > 0 ? +(totalRevenue / totalSqft).toFixed(2) : 0;

    this._log('heatmapSpaceUtilization', { spaceCount: spaceData.length, avgRevPerSqft });
    return { spaces: results, totalRevenue, totalSqft, averageRevenuePerSqft: avgRevPerSqft, hotSpaces: results.filter(r => r.heatZone === 'hot').length };
  }

  // ── Method 2: Lease Expiration Risk Scoring ──
  scoreLeaseRisk(leasePortfolio = []) {
    const today = new Date();

    const results = leasePortfolio.map(lease => {
      const { leaseId, tenantName, category, sqft, annualRent, expiryDate, tenantHealthScore, marketRentPerSqft } = lease;
      const expiry       = new Date(expiryDate);
      const daysToExpiry = Math.round((expiry - today) / 86400000);

      // Renewal probability: base × health × market adjustment
      const baseProbability   = LEASE_RENEWAL_BASE[category] || 0.65;
      const healthAdjustment  = ((tenantHealthScore || 70) - 70) / 100 * 0.2;
      const currentRentPerSqft = sqft > 0 ? annualRent / sqft : 0;
      const marketRatio        = marketRentPerSqft > 0 ? currentRentPerSqft / marketRentPerSqft : 1;
      const marketAdjustment   = (1 - marketRatio) * 0.15;

      const renewalProb = Math.min(Math.max(baseProbability + healthAdjustment + marketAdjustment, 0.05), 0.98);

      // PHI-weighted risk: low probability + near expiry compounds risk
      const timeRiskFactor = daysToExpiry < 90 ? this.phi : daysToExpiry < 180 ? 1.2 : 1.0;
      const phiRiskScore   = +((1 - renewalProb) * timeRiskFactor * (1 / Math.max(daysToExpiry, 1) * 365)).toFixed(4);

      return {
        leaseId,
        tenantName,
        category,
        sqft,
        annualRent,
        daysToExpiry,
        renewalProbability: +renewalProb.toFixed(4),
        phiRiskScore,
        expiryDate: expiry.toISOString().split('T')[0],
        atRisk: renewalProb < 0.5 || daysToExpiry < 60,
        action: daysToExpiry < 60 ? 'URGENT-ENGAGE' : renewalProb < 0.5 ? 'PROACTIVE-OUTREACH' : 'MONITOR',
      };
    });

    // Concentration risk: top 3 tenants % of total rent
    const totalRent = results.reduce((s, r) => s + r.annualRent, 0);
    const top3      = [...results].sort((a, b) => b.annualRent - a.annualRent).slice(0, 3);
    const top3Pct   = totalRent > 0 ? +(top3.reduce((s, r) => s + r.annualRent, 0) / totalRent * 100).toFixed(2) : 0;

    this._log('scoreLeaseRisk', { leaseCount: leasePortfolio.length, atRisk: results.filter(r => r.atRisk).length });
    return { leases: results, concentrationRisk: { top3Pct, concentrated: top3Pct > 50 }, summary: { atRisk: results.filter(r => r.atRisk).length, totalRent } };
  }

  // ── Method 3: CAPEX Project DCF + IRR Analysis ──
  analyzeCapex(project = {}) {
    const { name, initialInvestment, cashFlows = [], discountRate, terminalValueMultiple } = project;
    const rate = discountRate || DISCOUNT_RATES.moderate;

    // DCF: NPV = Σ CF_t / (1+r)^t - InitialInvestment
    let npv = -initialInvestment;
    const discountedFlows = cashFlows.map((cf, t) => {
      const discounted = cf / Math.pow(1 + rate, t + 1);
      npv += discounted;
      return { year: t + 1, cashFlow: cf, discountedCashFlow: +discounted.toFixed(2) };
    });

    // Terminal value
    const lastCF = cashFlows[cashFlows.length - 1] || 0;
    const tv     = lastCF * (terminalValueMultiple || 8);
    const tvDisc = tv / Math.pow(1 + rate, cashFlows.length);
    npv += tvDisc;

    // IRR: Newton-Raphson approximation
    const irr = this._calcIRR(initialInvestment, cashFlows);

    // PHI-weighted opportunity score: positive NPV amplified by phi if IRR > discount rate
    const phiOpportunityScore = npv > 0 && irr > rate
      ? +(npv / initialInvestment * this.phi).toFixed(4)
      : 0;

    // Sensitivity: vary occupancy ±10%
    const optimistic  = this._npv(-initialInvestment * 0.95, cashFlows.map(cf => cf * 1.1), rate);
    const pessimistic = this._npv(-initialInvestment * 1.05, cashFlows.map(cf => cf * 0.9), rate);

    this._log('analyzeCapex', { project: name, npv: +npv.toFixed(2), irr: +irr.toFixed(4) });
    return {
      projectName: name,
      initialInvestment,
      npv: +npv.toFixed(2),
      irr: +(irr * 100).toFixed(2),
      discountRate: rate,
      terminalValue: +tv.toFixed(2),
      discountedFlows,
      phiOpportunityScore,
      recommendation: npv > 0 && irr > rate ? 'PROCEED' : npv > 0 ? 'MARGINAL' : 'REJECT',
      sensitivity: {
        optimisticNPV:  +optimistic.toFixed(2),
        pessimisticNPV: +pessimistic.toFixed(2),
      },
    };
  }

  // ── Method 4: Master Plan Alignment Scoring ──
  scoreMasterPlanAlignment(developmentPlan = {}, masterPlanData = {}) {
    const scores = {};
    let totalScore = 0;

    MASTER_PLAN_DIMENSIONS.forEach(dim => {
      const planScore  = Math.min(developmentPlan[dim] || 0, 100);
      const masterReq  = masterPlanData[dim]  || 60;  // minimum required score
      const gap        = planScore - masterReq;
      const pct        = +(planScore / 100).toFixed(4);

      // PHI-alignment: 1.0 at masterReq, scales by phi above
      const phiAlignment = planScore >= masterReq
        ? +(1 + (planScore - masterReq) / 100 * (this.phi - 1)).toFixed(4)
        : +(planScore / masterReq).toFixed(4);

      scores[dim]  = { planScore, required: masterReq, gap, pct, phiAlignment, compliant: planScore >= masterReq };
      totalScore  += planScore;
    });

    const avgScore      = +(totalScore / MASTER_PLAN_DIMENSIONS.length).toFixed(2);
    const compliantDims = Object.values(scores).filter(s => s.compliant).length;
    const alignmentPct  = +(compliantDims / MASTER_PLAN_DIMENSIONS.length * 100).toFixed(2);

    this._log('scoreMasterPlanAlignment', { avgScore, alignmentPct });
    return { dimensionScores: scores, averageScore: avgScore, alignmentPct, compliantDimensions: compliantDims, totalDimensions: MASTER_PLAN_DIMENSIONS.length };
  }

  // ── Method 5: Comparable Market Analysis ──
  comparableMarketAnalysis(subjectAirport = {}, compDatabase = []) {
    const tier = subjectAirport.hubTier || 'medium';
    const bench = AIRPORT_HUB_TIERS[tier] || AIRPORT_HUB_TIERS['medium'];

    // Filter comps to same tier
    const peers = compDatabase.filter(c => c.hubTier === tier);
    if (peers.length === 0) return { error: 'No comparable airports found for tier' };

    const peerMetrics = peers.map(p => ({
      airportId: p.airportId,
      name:      p.name,
      revPerSqft: p.revPerSqft,
      occupancy:  p.occupancy,
      avgRent:    p.avgRent,
    }));

    const peerAvgRevPerSqft = peerMetrics.reduce((s, p) => s + p.revPerSqft, 0) / peerMetrics.length;
    const peerAvgOccupancy  = peerMetrics.reduce((s, p) => s + p.occupancy,  0) / peerMetrics.length;
    const peerAvgRent       = peerMetrics.reduce((s, p) => s + p.avgRent,    0) / peerMetrics.length;

    const subjectRevPerSqft = subjectAirport.revPerSqft || 0;
    const revGap            = +(subjectRevPerSqft - peerAvgRevPerSqft).toFixed(2);
    const revGapPct         = peerAvgRevPerSqft > 0 ? +((revGap / peerAvgRevPerSqft) * 100).toFixed(2) : 0;

    // PHI position: where does subject sit in the peer distribution?
    const sortedByRev = [...peerMetrics].sort((a, b) => a.revPerSqft - b.revPerSqft);
    const percentile  = sortedByRev.filter(p => p.revPerSqft <= subjectRevPerSqft).length / sortedByRev.length * 100;
    const phiPosition = +(percentile / 100 * this.phi).toFixed(4);

    this._log('comparableMarketAnalysis', { tier, peerCount: peers.length, revGapPct });
    return {
      subject: subjectAirport,
      tier,
      tierBenchmark: bench,
      peerCount: peers.length,
      peerAverages: {
        revPerSqft: +peerAvgRevPerSqft.toFixed(2),
        occupancy:  +peerAvgOccupancy.toFixed(4),
        avgRent:    +peerAvgRent.toFixed(2),
      },
      subjectVsPeers: { revGap, revGapPct, percentile: +percentile.toFixed(1), phiPosition },
      peers: peerMetrics,
      recommendation: revGapPct < -10 ? 'Underperforming peers — strategic repricing required' : revGapPct > 10 ? 'Outperforming — benchmark best practices' : 'In-line with peer group',
    };
  }

  // ── Financial Helpers ──
  _npv(initialCF, cashFlows, rate) {
    return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t + 1), initialCF);
  }

  _calcIRR(investment, cashFlows, maxIter = 100) {
    let rate = 0.1;
    for (let i = 0; i < maxIter; i++) {
      const npv  = this._npv(-investment, cashFlows, rate);
      const dnpv = cashFlows.reduce((s, cf, t) => s - (t + 1) * cf / Math.pow(1 + rate, t + 2), 0);
      const step = npv / dnpv;
      rate -= step;
      if (Math.abs(step) < 1e-8) break;
    }
    return isFinite(rate) ? Math.max(Math.min(rate, 10), -1) : 0;
  }

  // ── Utility: Lease Portfolio Concentration Index ──
  concentrationIndex(leasePortfolio = []) {
    const totalRent  = leasePortfolio.reduce((s, l) => s + l.annualRent, 0);
    if (totalRent === 0) return { hhi: 0, risk: 'unknown' };

    // HHI for rent concentration
    const hhi = leasePortfolio.reduce((s, l) => {
      const share = (l.annualRent / totalRent) * 100;
      return s + Math.pow(share, 2);
    }, 0);

    // PHI-adjusted risk: HHI normalized × phi for above-moderate concentration
    const phiHHI     = hhi > 2500 ? +(hhi / 10000 * this.phi).toFixed(4) : +(hhi / 10000).toFixed(4);
    const riskLabel  = hhi > 2500 ? 'highly-concentrated' : hhi > 1500 ? 'moderate' : 'competitive';

    return { hhi: +hhi.toFixed(2), phiHHI, riskLabel, tenantCount: leasePortfolio.length, totalRent };
  }

  // ── Utility: Revenue Compound Growth Rate (CAGR) ──
  computeCAGR(startRevenue, endRevenue, years) {
    if (startRevenue <= 0 || years <= 0) return null;
    const cagr = Math.pow(endRevenue / startRevenue, 1 / years) - 1;
    // PHI benchmark: CAGR above phiInv×8% ≈ 4.9% is "golden growth"
    const goldenGrowth = this.phiInv * 0.08;
    return {
      cagr:           +cagr.toFixed(6),
      cagrPct:        +(cagr * 100).toFixed(3),
      goldenGrowthPct: +(goldenGrowth * 100).toFixed(3),
      aboveGolden:     cagr > goldenGrowth,
      years,
      startRevenue,
      endRevenue,
    };
  }

  // ── Utility: Space Payback Analysis ──
  spacePaybackAnalysis(spaceId, renovationCost, currentRevPerSqft, projectedRevPerSqft, sqft) {
    const annualLift  = (projectedRevPerSqft - currentRevPerSqft) * sqft;
    const paybackYears = annualLift > 0 ? +(renovationCost / annualLift).toFixed(2) : null;
    // PHI payback benchmark: payback < phi^2 ≈ 2.6 years = excellent
    const phiBenchmark = Math.pow(this.phi, 2);
    return {
      spaceId, sqft, renovationCost, currentRevPerSqft, projectedRevPerSqft,
      annualRevenueLift: +annualLift.toFixed(2),
      paybackYears,
      phiBenchmarkYears: +phiBenchmark.toFixed(3),
      rating: paybackYears !== null && paybackYears < phiBenchmark ? 'EXCELLENT' : paybackYears !== null && paybackYears < 5 ? 'GOOD' : 'MARGINAL',
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
        'Space Utilization Heatmap (Revenue Density)',
        'Lease Expiration Risk Scoring & Renewal Probability',
        'CAPEX Project DCF + IRR Analysis',
        'Airport Master Plan Alignment Scoring',
        'Comparable Market Analysis (Peer Benchmarking)',
      ],
      hubTiers:         AIRPORT_HUB_TIERS,
      discountRates:    DISCOUNT_RATES,
      leaserenewalBase: LEASE_RENEWAL_BASE,
      masterPlanDims:   MASTER_PLAN_DIMENSIONS,
      memoryLog:        this.memoryLog,
      createdAt:        this.createdAt,
      framework:        'RSHIP',
    };
  }
}

export function birthPROPEX(config = {}) { return new PROPEX(config); }
export { PROPEX };
export default PROPEX;
