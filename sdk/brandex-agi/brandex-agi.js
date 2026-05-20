/**
 * BRANDEX AGI — Retail Brand & Experience Intelligence
 * RSHIP-2026-BRANDEX-001
 *
 * Domain: Retail Brand & Experience
 * Latin: brandus from Old Norse brandr — "a burning, a mark burned in"
 *   brandr (burning mark) is the origin of "brand" — an identity seared into memory.
 *   Airport retail brands compete for 47 minutes of average dwell time; every minute
 *   is a conversion opportunity. BRANDEX turns foot traffic and loyalty data into
 *   brand performance intelligence.
 *
 * Theory: Markov chain (stochastic processes), Pareto/NBD CLV model (Fader & Hardie),
 *   NPS methodology, PHI-weighted brand scoring (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Retail Brand Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const SALES_SQFT_BENCHMARKS = {
  food_beverage: { topQuartile: 1400, median: 1050, bottomQuartile: 700 },
  retail:        { topQuartile: 1100, median: 825,  bottomQuartile: 550 },
  news_gift:     { topQuartile: 900,  median: 675,  bottomQuartile: 450 },
  services:      { topQuartile: 700,  median: 525,  bottomQuartile: 350 },
};

const MARKOV_STATES     = ['Pass', 'Browse', 'Consider', 'Purchase', 'Depart'];
// Default transition matrix: rows = from-state, cols = to-state [Pass, Browse, Consider, Purchase, Depart]
const DEFAULT_TRANSITION = [
  [0.60, 0.25, 0.00, 0.00, 0.15],  // Pass
  [0.20, 0.30, 0.35, 0.00, 0.15],  // Browse
  [0.05, 0.10, 0.30, 0.45, 0.10],  // Consider
  [0.00, 0.00, 0.00, 0.80, 0.20],  // Purchase (absorbing tendencies)
  [0.00, 0.00, 0.00, 0.00, 1.00],  // Depart   (absorbing)
];

const NPS_SERVICE_FACTORS = [
  'product_quality', 'staff_friendliness', 'wait_time', 'cleanliness',
  'value', 'selection', 'speed', 'ease',
];

const AVG_DWELL_MINUTES = 47;
const CLV_DISCOUNT_RATE = 0.10;  // annual discount for CLV model

// ── BRANDEX Core ──
class BRANDEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-BRANDEX-001';
    this.domain      = 'Retail Brand & Experience';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: Brand Performance Benchmarking ──
  benchmarkBrandPerformance(brandData = [], category = 'retail') {
    const bench = SALES_SQFT_BENCHMARKS[category] || SALES_SQFT_BENCHMARKS['retail'];

    const results = brandData.map(brand => {
      const { brandId, name, annualSales, sqft } = brand;
      const salesPerSqft = sqft > 0 ? annualSales / sqft : 0;

      // Position in benchmark distribution
      const gapToTopQ  = bench.topQuartile - salesPerSqft;
      const gapToMedian = salesPerSqft - bench.median;

      let quartile = 'bottom';
      if (salesPerSqft >= bench.topQuartile)    quartile = 'top';
      else if (salesPerSqft >= bench.median)    quartile = 'upper-mid';
      else if (salesPerSqft >= bench.bottomQuartile) quartile = 'lower-mid';

      // PHI performance index: score relative to median, scaled by phi
      const performanceIndex = bench.median > 0 ? +(salesPerSqft / bench.median * this.phi).toFixed(4) : 0;

      return {
        brandId,
        name,
        annualSales,
        sqft,
        salesPerSqft:    +salesPerSqft.toFixed(2),
        quartile,
        gapToTopQuartile: +gapToTopQ.toFixed(2),
        gapToMedian:      +gapToMedian.toFixed(2),
        performanceIndex,
        action: quartile === 'bottom' ? 'STRATEGIC-REVIEW' : quartile === 'lower-mid' ? 'IMPROVEMENT-PLAN' : 'MAINTAIN',
      };
    });

    results.sort((a, b) => b.salesPerSqft - a.salesPerSqft);
    this._log('benchmarkBrandPerformance', { brandCount: brandData.length, category });
    return { results, category, benchmarks: bench, topQuartileCount: results.filter(r => r.quartile === 'top').length };
  }

  // ── Method 2: Dwell-Time Conversion Modeling (Markov Chain) ──
  modelDwellConversion(dwellData = {}) {
    const transitionMatrix = dwellData.transitionMatrix || DEFAULT_TRANSITION;
    const initialState     = dwellData.initialState || [1, 0, 0, 0, 0]; // all start at Pass

    // Run Markov chain for avgDwellMinutes / 5 steps (~10 steps for 50 min dwell)
    const steps = Math.round(AVG_DWELL_MINUTES / 5);
    let state   = [...initialState];

    const trajectory = [{ step: 0, stateProbabilities: { ...Object.fromEntries(MARKOV_STATES.map((s, i) => [s, state[i]])) } }];

    for (let t = 1; t <= steps; t++) {
      const next = Array(MARKOV_STATES.length).fill(0);
      state.forEach((prob, i) => {
        transitionMatrix[i].forEach((trans, j) => { next[j] += prob * trans; });
      });
      state = next;
      trajectory.push({ step: t, stateProbabilities: Object.fromEntries(MARKOV_STATES.map((s, i) => [s, +state[i].toFixed(4)])) });
    }

    const purchaseProbability = state[MARKOV_STATES.indexOf('Purchase')];
    const browseProbability   = state[MARKOV_STATES.indexOf('Browse')];

    // PHI-conversion potential: purchase prob × phi = golden threshold
    const phiConversionTarget = +(purchaseProbability * this.phi).toFixed(4);
    const conversionRate      = +purchaseProbability.toFixed(4);

    this._log('modelDwellConversion', { steps, conversionRate });
    return {
      trajectory,
      finalStateProbabilities: Object.fromEntries(MARKOV_STATES.map((s, i) => [s, +state[i].toFixed(4)])),
      conversionRate,
      browseProbability: +browseProbability.toFixed(4),
      phiConversionTarget,
      dwellMinutesModeled: AVG_DWELL_MINUTES,
      recommendation: conversionRate > 0.25 ? 'Strong conversion — maximize upsell' : conversionRate > 0.12 ? 'Moderate — improve consideration triggers' : 'Low — review browse-to-consider barriers',
    };
  }

  // ── Method 3: CLV Analysis (Pareto/NBD approximation) ──
  analyzeCLV(loyaltyData = []) {
    const results = loyaltyData.map(customer => {
      const { customerId, purchaseCount, totalSpend, observationPeriodMonths, recencyMonths } = customer;

      // Pareto/NBD approximation: estimate future purchase rate (lambda)
      const lambda = observationPeriodMonths > 0 ? purchaseCount / observationPeriodMonths : 0;

      // Survival probability (still active): exponential decay based on recency
      const mu      = recencyMonths > 0 ? 1 / recencyMonths : 0.1;
      const pAlive  = Math.exp(-mu * recencyMonths) * (lambda / (lambda + mu));
      const pAliveClipped = Math.min(Math.max(pAlive, 0), 1);

      // Expected future transactions (24-month horizon)
      const horizon = 24;
      const expTransactions = lambda * horizon * pAliveClipped;

      // Average order value
      const aov = purchaseCount > 0 ? totalSpend / purchaseCount : 0;

      // CLV: PV of future spend discounted monthly
      const monthlyRate = CLV_DISCOUNT_RATE / 12;
      const clv = expTransactions * aov / (1 + monthlyRate * horizon / 2);

      // Value decile (assigned below based on portfolio sort)
      const phiLTV = +(clv * this.phiInv).toFixed(4);

      return {
        customerId,
        purchaseCount,
        totalSpend,
        avgOrderValue: +aov.toFixed(2),
        lambda: +lambda.toFixed(4),
        pAlive: +pAliveClipped.toFixed(4),
        expectedFutureTransactions: +expTransactions.toFixed(2),
        clv: +clv.toFixed(2),
        phiLTV,
      };
    });

    // Assign value deciles
    const sorted = [...results].sort((a, b) => b.clv - a.clv);
    results.forEach(r => {
      const rank = sorted.findIndex(s => s.customerId === r.customerId);
      r.valueDecile = 10 - Math.floor((rank / sorted.length) * 10);
    });

    const totalCLV  = results.reduce((s, r) => s + r.clv, 0);
    const top20pct  = sorted.slice(0, Math.ceil(sorted.length * 0.2)).reduce((s, r) => s + r.clv, 0);
    const paretoRatio = totalCLV > 0 ? +(top20pct / totalCLV * 100).toFixed(2) : 0;

    this._log('analyzeCLV', { customerCount: loyaltyData.length, totalCLV: +totalCLV.toFixed(2), paretoRatio });
    return { customers: results, totalPortfolioCLV: +totalCLV.toFixed(2), paretoRatio, top20PctContribution: +top20pct.toFixed(2) };
  }

  // ── Method 4: Brand Placement Optimization ──
  optimizePlacement(locationData = [], brandAffinityProfile = {}) {
    const results = locationData.map(loc => {
      const { locationId, name, dailyPassengerFlow, category, concourse, currentBrand } = loc;

      // Affinity score: how well brand's profile matches location category/passenger type
      const affinity = brandAffinityProfile[category] || brandAffinityProfile['default'] || 0.5;

      // Traffic value: flow × affinity
      const rawScore = dailyPassengerFlow * affinity;

      // PHI-scaled placement index: normalise to phi-ratio for golden placement scoring
      const placementIndex = +(rawScore * this.phiInv / 1000).toFixed(4);

      return {
        locationId,
        name,
        concourse,
        category,
        dailyPassengerFlow,
        affinityScore: +affinity.toFixed(4),
        rawScore: +rawScore.toFixed(2),
        placementIndex,
        currentBrand: currentBrand || 'vacant',
      };
    });

    results.sort((a, b) => b.placementIndex - a.placementIndex);

    // Rank locations
    results.forEach((r, i) => { r.rank = i + 1; });

    this._log('optimizePlacement', { locationCount: locationData.length });
    return {
      rankedLocations: results,
      topRecommendation: results[0] || null,
      summary: {
        totalLocations:   results.length,
        topQuartileCount: results.filter((_, i) => i < results.length / 4).length,
      },
    };
  }

  // ── Method 5: NPS Driver Regression ──
  regressNPSDrivers(surveyData = []) {
    if (surveyData.length === 0) return { error: 'No survey data' };

    // Multiple linear regression via OLS normal equations: β = (X'X)^-1 X'y
    const n = surveyData.length;
    const k = NPS_SERVICE_FACTORS.length;

    // Build design matrix X (n × k+1 with intercept) and y vector
    const X = surveyData.map(s => [1, ...NPS_SERVICE_FACTORS.map(f => s[f] || 3)]);
    const y = surveyData.map(s => s.nps || 0);

    // Compute X'X and X'y
    const XtX = this._matMul(this._transpose(X), X);
    const Xty = this._matVec(this._transpose(X), y);

    // Solve via Gaussian elimination
    const beta = this._gaussianElim(XtX, Xty);

    // Coefficients for each factor
    const factorCoefficients = Object.fromEntries(NPS_SERVICE_FACTORS.map((f, i) => [f, +beta[i + 1].toFixed(4)]));

    // R² calculation
    const yMean  = y.reduce((s, v) => s + v, 0) / n;
    const yHat   = X.map(row => row.reduce((s, x, i) => s + x * beta[i], 0));
    const ssTot  = y.reduce((s, v) => s + Math.pow(v - yMean, 2), 0);
    const ssRes  = y.reduce((s, v, i) => s + Math.pow(v - yHat[i], 2), 0);
    const rSquared = ssTot > 0 ? +(1 - ssRes / ssTot).toFixed(4) : 0;

    // PHI-weighted driver importance: abs coefficient × phi normalised
    const drivers = Object.entries(factorCoefficients)
      .map(([f, coeff]) => ({ factor: f, coefficient: coeff, absCoeff: Math.abs(coeff), phiImportance: +(Math.abs(coeff) * this.phi).toFixed(4) }))
      .sort((a, b) => b.absCoeff - a.absCoeff);

    this._log('regressNPSDrivers', { surveyCount: surveyData.length, rSquared });
    return { factorCoefficients, intercept: +beta[0].toFixed(4), rSquared, topDrivers: drivers.slice(0, 3), allDrivers: drivers };
  }

  // ── Matrix Math Helpers ──
  _transpose(M) {
    return M[0].map((_, j) => M.map(row => row[j]));
  }

  _matMul(A, B) {
    return A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
  }

  _matVec(A, v) {
    return A.map(row => row.reduce((s, val, j) => s + val * v[j], 0));
  }

  _gaussianElim(A, b) {
    const n  = b.length;
    const M  = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
      }
      [M[col], M[maxRow]] = [M[maxRow], M[col]];
      if (Math.abs(M[col][col]) < 1e-12) { M[col][col] = 1e-12; }
      for (let row = col + 1; row < n; row++) {
        const f = M[row][col] / M[col][col];
        for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k];
      }
    }
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = M[i][n] / M[i][i];
      for (let k = i - 1; k >= 0; k--) M[k][n] -= M[k][i] * x[i];
    }
    return x;
  }

  // ── Utility: Brand Loyalty Retention Curve ──
  modelRetentionCurve(cohortData = [], periods = 12) {
    // Exponential retention decay: R(t) = R0 × e^(-λt)
    // Estimate λ from cohort data
    if (cohortData.length < 2) return { error: 'Need at least 2 cohort periods' };
    const r0 = cohortData[0].retentionRate || 1;
    const rLast = cohortData[cohortData.length - 1].retentionRate || 0.1;
    const t     = cohortData.length - 1;
    const lambda = t > 0 ? -Math.log(rLast / r0) / t : 0.1;

    const curve = Array.from({ length: periods }, (_, i) => {
      const retention = +(r0 * Math.exp(-lambda * i)).toFixed(4);
      // PHI-golden retention: retention decays to 1/phi ≈ 0.618 = natural loyalty halflife
      const phiRetention = +(retention * this.phi).toFixed(4);
      return { period: i, retentionRate: Math.min(retention, 1), phiRetention };
    });

    const halflivePoint = curve.findIndex(c => c.retentionRate <= this.phiInv);
    return { curve, lambda: +lambda.toFixed(4), goldenHalflife: halflivePoint >= 0 ? halflivePoint : periods, phiLoyaltyThreshold: +this.phiInv.toFixed(4) };
  }

  // ── Utility: Promotion Effectiveness Scoring ──
  scorePromotionEffectiveness(promotionData = []) {
    return promotionData.map(promo => {
      const { promoId, name, baselineSales, promotionSales, cost, durationDays } = promo;
      const lift          = promotionSales - baselineSales;
      const liftPct       = baselineSales > 0 ? lift / baselineSales : 0;
      const costPerLift   = lift > 0 ? cost / lift : null;
      const roi           = cost > 0 ? (lift - cost) / cost : null;
      const dailyLift     = durationDays > 0 ? lift / durationDays : lift;

      // PHI-effectiveness: liftPct × phi if positive ROI
      const phiEffectiveness = roi !== null && roi > 0
        ? +(liftPct * this.phi).toFixed(4)
        : +(liftPct * this.phiInv).toFixed(4);

      return {
        promoId,
        name,
        lift: +lift.toFixed(2),
        liftPct: +(liftPct * 100).toFixed(2),
        costPerLift: costPerLift !== null ? +costPerLift.toFixed(2) : null,
        roi:         roi !== null ? +(roi * 100).toFixed(2) : null,
        dailyLift:   +dailyLift.toFixed(2),
        phiEffectiveness,
        verdict: roi !== null && roi > 1 ? 'EXCELLENT' : roi !== null && roi > 0 ? 'POSITIVE' : 'INEFFECTIVE',
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
        'Brand Performance Benchmarking (Sales/SqFt)',
        'Dwell-Time Conversion Modeling (Markov Chain)',
        'Customer Lifetime Value Analysis (Pareto/NBD)',
        'Brand Placement Optimization (Traffic × Affinity)',
        'NPS Driver Regression (8 Service Factors)',
      ],
      salesBenchmarks:  SALES_SQFT_BENCHMARKS,
      npsServiceFactors: NPS_SERVICE_FACTORS,
      avgDwellMinutes:  AVG_DWELL_MINUTES,
      memoryLog:        this.memoryLog,
      createdAt:        this.createdAt,
      framework:        'RSHIP',
    };
  }
}

export function birthBRANDEX(config = {}) { return new BRANDEX(config); }
export { BRANDEX };
export default BRANDEX;
