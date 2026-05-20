/**
 * BOOKEX AGI — Booking & GDS Distribution Intelligence
 * RSHIP-2026-BOOKEX-001
 *
 * Domain: Travel Booking & GDS Intelligence AGI
 * Latin: reservare — "to reserve, to keep back, to save"
 *   Full: BOOKing EXecutive — from Old English bōcian (to reserve, to grant by charter)
 *   + Latin ex (intensive prefix) = the intelligence that ensures every booking creates maximum value.
 *   reservare connotes deliberate preservation: the act of holding back capacity for the right
 *   traveler at the right moment, transforming distribution into a competitive weapon.
 *
 * Theory: EMSR-b Seat Inventory Optimization, Holt-Winters Triple Exponential Smoothing,
 *   Bayesian Logistic Cancellation Model, NDC Offer Ranking (φ-weighted),
 *   OTA Funnel z-test Significance, Corporate Policy Compliance Scoring,
 *   RSHIP Framework (AURUM — Paper XXII)
 *
 * Applications: GDS yield optimization, OTA funnel analytics, corporate travel compliance,
 *   NDC distribution intelligence, forward booking demand forecasting
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Local PHI Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

// ── GDS Booking Class Fare Buckets (IATA standard cabin hierarchy) ──
const FARE_BUCKETS = [
  { class: 'Y', rank: 1,  type: 'Full Fare Economy',      relativeFare: 1.00 },
  { class: 'B', rank: 2,  type: 'Flex Economy',           relativeFare: 0.88 },
  { class: 'H', rank: 3,  type: 'Semi-Flex Economy',      relativeFare: 0.76 },
  { class: 'K', rank: 4,  type: 'Standard Economy',       relativeFare: 0.65 },
  { class: 'M', rank: 5,  type: 'Saver Economy',          relativeFare: 0.55 },
  { class: 'L', rank: 6,  type: 'Low Saver',              relativeFare: 0.47 },
  { class: 'V', rank: 7,  type: 'Advance Purchase',       relativeFare: 0.40 },
  { class: 'S', rank: 8,  type: 'Super Saver',            relativeFare: 0.34 },
  { class: 'N', rank: 9,  type: 'Low Advance Purchase',   relativeFare: 0.29 },
  { class: 'Q', rank: 10, type: 'Deep Saver',             relativeFare: 0.24 },
  { class: 'O', rank: 11, type: 'Ultra Low',              relativeFare: 0.19 },
  { class: 'G', rank: 12, type: 'Group/Promo',            relativeFare: 0.15 },
];

// ── OTA Funnel Conversion Benchmarks (industry averages) ──
const FUNNEL_BENCHMARKS = {
  SEARCH:   1.00,
  COMPARE:  0.45,
  SELECT:   0.28,
  CHECKOUT: 0.18,
  CONFIRM:  0.15,
};

// ── Corporate Travel Policy Categories ──
const POLICY_DIMENSIONS = {
  advancePurchase:   { weight: 0.20, description: '≥14 days advance booking' },
  preferredCarrier:  { weight: 0.20, description: 'Use approved airline program' },
  hotelTier:         { weight: 0.15, description: 'Approved hotel tier compliance' },
  classOfService:    { weight: 0.20, description: 'Economy/Business as per policy' },
  outOfPolicyRate:   { weight: 0.15, description: 'Rate within cap threshold' },
  expenseApproval:   { weight: 0.10, description: 'Pre-trip approval obtained' },
};

// ── NDC Capability Tiers (IATA standard) ──
const NDC_TIERS = {
  0: { label: 'None',        description: 'No NDC capability, pure EDIFACT GDS' },
  1: { label: 'NDC Basic',   description: 'Offer request/response (shopping only)' },
  2: { label: 'NDC Level 2', description: 'Order creation and management' },
  3: { label: 'NDC Level 3', description: 'Full servicing: change, cancel, seat, bag' },
  4: { label: 'NDC Level 4', description: 'Full retail with loyalty, ancillary, bundles' },
};

// ── Holt-Winters Smoothing Parameters (calibrated for air bookings) ──
const HW_PARAMS = {
  alpha: 0.35,    // level smoothing
  beta:  0.12,    // trend smoothing
  gamma: 0.28,    // seasonal smoothing
  seasonLength: 52,  // weekly seasonality
};

// ── GDS System Market Shares ──
const GDS_SYSTEMS = {
  Sabre:     { marketShare: 0.36, averageSegmentFee: 3.50 },
  Amadeus:   { marketShare: 0.40, averageSegmentFee: 3.25 },
  Travelport:{ marketShare: 0.24, averageSegmentFee: 3.75 },
};

// ── BOOKEX Core ──
class BOOKEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-BOOKEX-001';
    this.domain      = 'Travel Booking & GDS Intelligence AGI';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: GDS Yield Optimization ──
  gdsYieldOptimization(fareData = {}) {
    const {
      flightId      = 'FL-001',
      totalSeats    = 150,
      baseFare      = 420,      // Y-class full fare ($)
      gdsSystem     = 'Amadeus',
      buckets       = [],       // [{ class, booked, available, fare }]
    } = fareData;

    // Build bucket inventory with fares if not supplied
    const inventory = FARE_BUCKETS.map(fb => {
      const supplied = buckets.find(b => b.class === fb.class) || {};
      const fare     = supplied.fare || +(baseFare * fb.relativeFare).toFixed(2);
      const available = supplied.available !== undefined ? supplied.available : Math.floor(totalSeats / 12);
      const booked   = supplied.booked || 0;
      return { ...fb, fare, available, booked, remaining: Math.max(available - booked, 0) };
    });

    // EMSR-b (Expected Marginal Seat Revenue - b) model
    // Protect k seats in a higher class if EMV(k) ≥ lowestFare × PHI
    // EMV(k) = integral of demand * fare for seats k+1..available using exponential demand
    // Simplified: protect seats where expected_revenue_per_seat ≥ PHI × next_lower_fare
    const emsrResults = inventory.map((bucket, idx) => {
      if (idx === inventory.length - 1) {
        return { ...bucket, protect: 0, emsrSignal: 'lowest-class', emv: bucket.fare };
      }
      const nextLowerFare = inventory[idx + 1].fare;
      // Exponential demand model: E[demand above k] = λ × e^(-k/scale)
      const lambda  = bucket.available * 0.6;    // expected bookings
      const scale   = bucket.available / 2;
      const emvPerSeat = bucket.fare * (1 - Math.exp(-lambda / scale));
      const protectThreshold = nextLowerFare * PHI_LOCAL;
      const protect  = emvPerSeat >= protectThreshold ? Math.ceil(bucket.available * PHI_INV_LOCAL) : 0;

      return {
        ...bucket,
        protect,
        emsrSignal: emvPerSeat >= protectThreshold ? 'protect' : 'open',
        emv: +emvPerSeat.toFixed(2),
        protectThreshold: +protectThreshold.toFixed(2),
      };
    });

    // Yield = Revenue / Available Seat Miles proxy (per seat)
    const totalRevenue = emsrResults.reduce((s, b) => s + b.booked * b.fare, 0);
    const totalBooked  = emsrResults.reduce((s, b) => s + b.booked, 0);
    const yieldPerSeat = totalBooked > 0 ? totalRevenue / totalBooked : 0;
    const loadFactor   = totalSeats > 0 ? totalBooked / totalSeats : 0;
    const rasm         = totalSeats > 0 ? totalRevenue / totalSeats : 0;

    // Spoilage risk: seats remaining in lower classes as departure nears
    const spoilageRisk = emsrResults.filter(b => b.emsrSignal === 'open' && b.remaining > 0)
      .reduce((s, b) => s + b.remaining * b.fare, 0);

    const gds = GDS_SYSTEMS[gdsSystem] || GDS_SYSTEMS['Amadeus'];
    const gdsDistributionCost = totalBooked * gds.averageSegmentFee;

    this._log('gdsYieldOptimization', { flightId, totalBooked, yieldPerSeat: +yieldPerSeat.toFixed(2) });
    return {
      flightId,
      gdsSystem,
      inventory:       emsrResults,
      yield: {
        revenueTotal:         +totalRevenue.toFixed(2),
        yieldPerBookedSeat:   +yieldPerSeat.toFixed(2),
        loadFactor:           +(loadFactor * 100).toFixed(2),
        rasm:                 +rasm.toFixed(2),
      },
      emsb: {
        protectedClasses:     emsrResults.filter(b => b.protect > 0).map(b => b.class),
        totalProtectedSeats:  emsrResults.reduce((s, b) => s + b.protect, 0),
        spoilageExposure:     +spoilageRisk.toFixed(2),
      },
      distribution: {
        gdsSystem,
        segmentFee:           gds.averageSegmentFee,
        totalDistributionCost: +gdsDistributionCost.toFixed(2),
        netRevenue:           +(totalRevenue - gdsDistributionCost).toFixed(2),
      },
    };
  }

  // ── Method 2: OTA Conversion Funnel Intelligence ──
  otaConversionFunnel(funnelData = {}) {
    const {
      searches    = 10000,
      compares    = 4200,
      selects     = 2600,
      checkouts   = 1650,
      confirms    = 1350,
      avgBookingValue = 485,
      abTests     = [],   // [{ variant, n, conversions }]
    } = funnelData;

    // Stage-by-stage conversion rates
    const stages = [
      { stage: 'SEARCH',   count: searches,  benchmark: FUNNEL_BENCHMARKS.SEARCH },
      { stage: 'COMPARE',  count: compares,  benchmark: FUNNEL_BENCHMARKS.COMPARE },
      { stage: 'SELECT',   count: selects,   benchmark: FUNNEL_BENCHMARKS.SELECT },
      { stage: 'CHECKOUT', count: checkouts, benchmark: FUNNEL_BENCHMARKS.CHECKOUT },
      { stage: 'CONFIRM',  count: confirms,  benchmark: FUNNEL_BENCHMARKS.CONFIRM },
    ];

    const stageAnalysis = stages.map((s, idx) => {
      const conversionFromSearch = searches > 0 ? s.count / searches : 0;
      const conversionFromPrev   = idx > 0 && stages[idx - 1].count > 0
        ? s.count / stages[idx - 1].count : 1;
      const benchmarkFromSearch  = s.benchmark;
      const dropoffVsBenchmark   = conversionFromSearch - benchmarkFromSearch;
      const dropoffPct           = idx > 0
        ? +(( 1 - conversionFromPrev) * 100).toFixed(2)
        : 0;
      const dropoffCauses = this._diagnoseDropoff(s.stage, conversionFromPrev, benchmarkFromSearch / (idx > 0 ? stages[idx - 1].benchmark : 1));

      return {
        stage:                  s.stage,
        visitors:               s.count,
        conversionFromSearch:   +(conversionFromSearch * 100).toFixed(2),
        conversionFromPrev:     +(conversionFromPrev * 100).toFixed(2),
        benchmark:              +(benchmarkFromSearch * 100).toFixed(1),
        dropoffVsBenchmark:     +(dropoffVsBenchmark * 100).toFixed(2),
        dropoffPct,
        primaryDropoffCause:    dropoffCauses,
      };
    });

    // Revenue per visitor
    const overallConversionRate = searches > 0 ? confirms / searches : 0;
    const revenuePerVisitor     = overallConversionRate * avgBookingValue;
    const benchmarkRPV          = FUNNEL_BENCHMARKS.CONFIRM * avgBookingValue;

    // A/B Test significance analysis
    const abAnalysis = abTests.map(test => {
      const control  = abTests[0];
      if (!control || test === control) return null;
      const p1       = control.conversions / control.n;
      const p2       = test.conversions / test.n;
      const pBar     = (control.conversions + test.conversions) / (control.n + test.n);
      const se       = Math.sqrt(pBar * (1 - pBar) * (1 / control.n + 1 / test.n));
      const zScore   = se > 0 ? (p2 - p1) / se : 0;
      const pValue   = 2 * (1 - this._normalCDF(Math.abs(zScore)));
      const uplift   = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
      return {
        variant:         test.variant,
        controlRate:     +(p1 * 100).toFixed(2),
        variantRate:     +(p2 * 100).toFixed(2),
        upliftPct:       +uplift.toFixed(2),
        zScore:          +zScore.toFixed(4),
        pValue:          +pValue.toFixed(4),
        significant:     pValue < 0.05,
        recommendation:  uplift > 0 && pValue < 0.05 ? 'Deploy variant' : 'Continue testing',
      };
    }).filter(Boolean);

    // Revenue opportunity if funnel matches benchmark
    const revenueGap = (FUNNEL_BENCHMARKS.CONFIRM - overallConversionRate) * searches * avgBookingValue;

    this._log('otaConversionFunnel', { overallConversion: +(overallConversionRate * 100).toFixed(2), revenuePerVisitor: +revenuePerVisitor.toFixed(2) });
    return {
      funnelStages:     stageAnalysis,
      metrics: {
        overallConversionRate:    +(overallConversionRate * 100).toFixed(3),
        revenuePerVisitor:        +revenuePerVisitor.toFixed(2),
        benchmarkRPV:             +benchmarkRPV.toFixed(2),
        revenueOpportunity:       +revenueGap.toFixed(2),
        totalBookingRevenue:      +(confirms * avgBookingValue).toFixed(2),
      },
      abTests:          abAnalysis,
    };
  }

  // ── Method 3: Corporate Travel Compliance ──
  corporateTravelCompliance(bookings = [], policy = {}) {
    const policyConfig = { ...Object.fromEntries(Object.keys(POLICY_DIMENSIONS).map(k => [k, true])), ...policy };

    // Per-booking compliance scoring
    const bookingScores = bookings.map(b => {
      const scores = {};
      let weightedSum  = 0;
      let totalWeight  = 0;

      Object.entries(POLICY_DIMENSIONS).forEach(([dim, meta]) => {
        const compliant = b[dim] !== undefined ? !!b[dim] : true;
        scores[dim] = {
          compliant,
          weight: meta.weight,
          description: meta.description,
        };
        weightedSum += meta.weight * (compliant ? 1 : 0);
        totalWeight += meta.weight;
      });

      const complianceScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
      const outOfPolicy     = complianceScore < 80;

      // Savings leakage: out-of-policy bookings cost 23-31% more on average
      const leakagePremium  = outOfPolicy ? b.fare * 0.27 : 0;   // 27% = midpoint of 23-31% range

      return {
        bookingId:        b.id || `BK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        traveler:         b.traveler || 'Unknown',
        fare:             b.fare || 0,
        complianceScore:  +complianceScore.toFixed(1),
        outOfPolicy,
        policyDetails:    scores,
        leakagePremium:   +leakagePremium.toFixed(2),
      };
    });

    const totalSpend        = bookingScores.reduce((s, b) => s + b.fare, 0);
    const outOfPolicyCount  = bookingScores.filter(b => b.outOfPolicy).length;
    const totalLeakage      = bookingScores.reduce((s, b) => s + b.leakagePremium, 0);
    const avgCompliance     = bookingScores.length > 0
      ? bookingScores.reduce((s, b) => s + b.complianceScore, 0) / bookingScores.length
      : 0;

    // Top violators (lowest compliance)
    const topViolators = [...bookingScores]
      .filter(b => b.outOfPolicy)
      .sort((a, b) => a.complianceScore - b.complianceScore)
      .slice(0, 5);

    // Per-dimension compliance rates
    const dimensionCompliance = Object.keys(POLICY_DIMENSIONS).map(dim => {
      const compliantCount = bookingScores.filter(b => b.policyDetails[dim]?.compliant).length;
      const rate = bookings.length > 0 ? (compliantCount / bookings.length) * 100 : 0;
      return { dimension: dim, complianceRate: +rate.toFixed(1), weight: POLICY_DIMENSIONS[dim].weight };
    });

    // TMC performance score: service × savings × compliance (scaled 0-100)
    const tmcSavingsRate     = totalSpend > 0 ? 1 - totalLeakage / totalSpend : 1;
    const tmcServiceLevel    = policy.tmcServiceLevel || 0.87;   // input or default
    const tmcComplianceRate  = avgCompliance / 100;
    const tmcScore           = +((tmcServiceLevel * 33.3 + tmcSavingsRate * 33.3 + tmcComplianceRate * 33.4)).toFixed(1);

    this._log('corporateTravelCompliance', { bookingCount: bookings.length, avgCompliance: +avgCompliance.toFixed(1), totalLeakage: +totalLeakage.toFixed(2) });
    return {
      bookingScores,
      summary: {
        totalBookings:          bookings.length,
        totalSpend:             +totalSpend.toFixed(2),
        avgComplianceScore:     +avgCompliance.toFixed(1),
        outOfPolicyCount,
        outOfPolicyRate:        bookings.length > 0 ? +((outOfPolicyCount / bookings.length) * 100).toFixed(1) : 0,
        totalSavingsLeakage:    +totalLeakage.toFixed(2),
        leakageAsPctOfSpend:    totalSpend > 0 ? +((totalLeakage / totalSpend) * 100).toFixed(2) : 0,
      },
      topViolators,
      dimensionCompliance,
      tmcPerformance: {
        score:          tmcScore,
        serviceLevel:   +(tmcServiceLevel * 100).toFixed(1),
        savingsDelivery: +(tmcSavingsRate * 100).toFixed(1),
        complianceRate: +avgCompliance.toFixed(1),
        rating:         tmcScore >= 85 ? 'excellent' : tmcScore >= 70 ? 'good' : tmcScore >= 55 ? 'acceptable' : 'review-required',
      },
    };
  }

  // ── Method 4: NDC Distribution Intelligence ──
  ndcDistributionIntelligence(ndcOffers = []) {
    // ndcOffers: [{ airline, offerType, ndcTier, price, seat, bag, meal, loyaltyPoints, legacyGDSFare }]
    const analyzed = ndcOffers.map(offer => {
      const tier        = NDC_TIERS[offer.ndcTier] || NDC_TIERS[0];

      // Content richness index: % of optional attributes present
      const attributes   = ['seat', 'bag', 'meal', 'loyaltyPoints'];
      const richCount    = attributes.filter(a => offer[a] !== undefined && offer[a] !== null && offer[a] !== false).length;
      const contentScore = richCount / attributes.length;  // 0.0 – 1.0

      // Ancillary revenue attribution
      const ancillaryValue = (offer.seat || 0) + (offer.bag || 0) + (offer.meal || 0) + ((offer.loyaltyPoints || 0) * 0.01);
      const totalValue     = (offer.price || 0) + ancillaryValue;

      // NDC vs legacy savings
      const legacySavings = offer.legacyGDSFare ? offer.legacyGDSFare - offer.price : 0;
      const savingsPct    = offer.legacyGDSFare ? (legacySavings / offer.legacyGDSFare) * 100 : 0;

      // φ-weighted offer rank: price PHI_INV + content_richness PHI
      // Lower price = better; higher content = better
      const priceNorm  = offer.price > 0 ? 1000 / offer.price : 0;   // invert so cheaper = higher score
      const phiRank    = +(priceNorm * PHI_INV_LOCAL + contentScore * 100 * PHI_LOCAL).toFixed(4);

      // Retailer capability scoring: tier × airline program adoption (0-1 input)
      const adoptionRate   = offer.airlineAdoption || 0.5;
      const retailerScore  = +((offer.ndcTier / 4) * adoptionRate * 100).toFixed(2);

      return {
        airline:         offer.airline,
        offerType:       offer.offerType || 'standard',
        ndcTier:         offer.ndcTier,
        tierLabel:       tier.label,
        price:           offer.price,
        ancillaryValue:  +ancillaryValue.toFixed(2),
        totalValue:      +totalValue.toFixed(2),
        contentScore:    +(contentScore * 100).toFixed(1),
        legacyGDSFare:   offer.legacyGDSFare || null,
        legacySavings:   +legacySavings.toFixed(2),
        savingsPct:      +savingsPct.toFixed(2),
        phiRank,
        retailerScore,
      };
    });

    analyzed.sort((a, b) => b.phiRank - a.phiRank);

    const totalNDCRevenue   = analyzed.reduce((s, o) => s + o.totalValue, 0);
    const totalSavings      = analyzed.reduce((s, o) => s + o.legacySavings, 0);
    const avgContentScore   = analyzed.length > 0
      ? analyzed.reduce((s, o) => s + o.contentScore, 0) / analyzed.length : 0;

    // Ancillary attach rates by type
    const attachRates = {
      seat:          analyzed.filter(o => o.ancillaryValue > 0).length / Math.max(analyzed.length, 1),
      bag:           analyzed.filter(o => (ndcOffers.find(r => r.airline === o.airline)?.bag || 0) > 0).length / Math.max(analyzed.length, 1),
      meal:          analyzed.filter(o => (ndcOffers.find(r => r.airline === o.airline)?.meal || 0) > 0).length / Math.max(analyzed.length, 1),
    };

    this._log('ndcDistributionIntelligence', { offerCount: ndcOffers.length, avgContentScore: +avgContentScore.toFixed(1) });
    return {
      offers:         analyzed,
      bestOffer:      analyzed[0] || null,
      summary: {
        offerCount:             ndcOffers.length,
        avgContentScore:        +avgContentScore.toFixed(1),
        totalAncillaryRevenue:  +analyzed.reduce((s, o) => s + o.ancillaryValue, 0).toFixed(2),
        totalLegacySavings:     +totalSavings.toFixed(2),
        ndcPenetrationRate:     analyzed.filter(o => o.ndcTier >= 2).length / Math.max(analyzed.length, 1),
      },
      ancillaryAttachRates: {
        seat:  +(attachRates.seat * 100).toFixed(1),
        bag:   +(attachRates.bag  * 100).toFixed(1),
        meal:  +(attachRates.meal * 100).toFixed(1),
      },
      tierDistribution: [0, 1, 2, 3, 4].map(t => ({
        tier:  t,
        label: NDC_TIERS[t].label,
        count: analyzed.filter(o => o.ndcTier === t).length,
      })),
    };
  }

  // ── Method 5: Demand Forecasting Engine ──
  demandForecastingEngine(historicalBookings = [], marketSignals = {}) {
    const { seasonalityFactor = 1.0, competitorCapacityChange = 0, specialEventMultiplier = 1.0 } = marketSignals;

    // Holt-Winters triple exponential smoothing
    // Ft = α×xt + (1-α)×(Ft-1 + Tt-1)×St-L
    const { alpha, beta, gamma, seasonLength } = HW_PARAMS;
    const n = historicalBookings.length;

    if (n < seasonLength * 2) {
      // Insufficient data: use simple exponential smoothing fallback
      return this._simpleExpSmoothing(historicalBookings, marketSignals);
    }

    // Initialize: level = mean of first season, trend = avg growth, seasonal indices
    const L = seasonLength;
    let level  = historicalBookings.slice(0, L).reduce((s, x) => s + x, 0) / L;
    let trend  = (historicalBookings.slice(L, 2 * L).reduce((s, x) => s + x, 0) / L
                 - historicalBookings.slice(0, L).reduce((s, x) => s + x, 0) / L) / L;
    const seasonal = new Array(L).fill(0).map((_, i) => {
      const seasonalAvg = historicalBookings.slice(0, L).reduce((s, x) => s + x, 0) / L;
      return seasonalAvg > 0 ? historicalBookings[i] / seasonalAvg : 1;
    });

    const fitted = [];
    for (let t = 0; t < n; t++) {
      const s = t >= L ? seasonal[t % L] : seasonal[t];
      const xt = historicalBookings[t];
      const prevLevel = level;
      const prevTrend = trend;
      level   = alpha * (xt / (s || 1)) + (1 - alpha) * (prevLevel + prevTrend);
      trend   = beta  * (level - prevLevel) + (1 - beta) * prevTrend;
      seasonal[t % L] = gamma * (xt / (level || 1)) + (1 - gamma) * s;
      fitted.push(+(level * s).toFixed(1));
    }

    // Forecast 90 days (≈ 13 weeks)
    const forecastHorizon = 90;
    const forecast90 = [];
    for (let h = 1; h <= forecastHorizon; h++) {
      const s = seasonal[(n + h - 1) % L];
      const fVal = (level + trend * h) * (s || 1) * seasonalityFactor * specialEventMultiplier;
      forecast90.push(+Math.max(fVal, 0).toFixed(1));
    }

    // Booking Curve Pace (BCP): current vs. historical average at same point-in-time
    const recentWindow   = Math.min(14, n);
    const currentPace    = historicalBookings.slice(-recentWindow).reduce((s, x) => s + x, 0) / recentWindow;
    const historicalPace = historicalBookings.slice(0, recentWindow).reduce((s, x) => s + x, 0) / recentWindow;
    const bcp            = historicalPace > 0 ? currentPace / historicalPace : 1.0;

    // Price signal: trigger if BCP deviates > PHI_INV from 1.0
    const bcpDeviation   = Math.abs(bcp - 1.0);
    const triggerPricing = bcpDeviation > PHI_INV_LOCAL;
    const priceSignal    = triggerPricing
      ? (bcp > 1 ? 'RAISE — demand outpacing history' : 'LOWER — demand lagging history')
      : 'HOLD — within normal pace band';

    // Cancellation risk model (logistic regression)
    // P(cancel) = logistic(β₀ + β₁×lead_time + β₂×fare_class_rank + β₃×season_factor)
    const cancelLogits = [30, 60, 90].map(lead => {
      const fareClassRank  = 6;   // midpoint M-class
      const seasonFactor   = seasonalityFactor;
      const logit          = -1.85 + 0.018 * lead + 0.12 * fareClassRank - 0.42 * seasonFactor;
      return { leadDays: lead, pCancel: +(1 / (1 + Math.exp(-logit))).toFixed(4) };
    });

    // Segment forecasts: 30 / 60 / 90 day totals
    const f30 = forecast90.slice(0,  30).reduce((s, x) => s + x, 0);
    const f60 = forecast90.slice(0,  60).reduce((s, x) => s + x, 0);
    const f90 = forecast90.slice(0,  90).reduce((s, x) => s + x, 0);

    this._log('demandForecastingEngine', { bcp: +bcp.toFixed(4), triggerPricing, f30: +f30.toFixed(0) });
    return {
      holtwinters: {
        finalLevel:  +level.toFixed(4),
        finalTrend:  +trend.toFixed(4),
        fitted:      fitted.slice(-30),
      },
      bookingPaceIndex: {
        bcp:              +bcp.toFixed(4),
        bcpDeviation:     +bcpDeviation.toFixed(4),
        paceStatus:       bcp > 1.1 ? 'ahead' : bcp < 0.9 ? 'behind' : 'on-pace',
        triggerThreshold: +PHI_INV_LOCAL.toFixed(4),
        triggerPricing,
        priceSignal,
      },
      demandForecast: {
        next30Days:  +f30.toFixed(0),
        next60Days:  +f60.toFixed(0),
        next90Days:  +f90.toFixed(0),
        dailySeries: forecast90,
      },
      cancellationRisk:   cancelLogits,
      marketSignals:      marketSignals,
    };
  }

  // ── Internal Helpers ──
  _simpleExpSmoothing(data = [], signals = {}) {
    // Fallback when insufficient history for Holt-Winters
    const alpha = HW_PARAMS.alpha;
    let level   = data[0] || 100;
    data.forEach(x => { level = alpha * x + (1 - alpha) * level; });
    const forecast = Array.from({ length: 90 }, (_, i) =>
      +(level * (1 + (signals.seasonalityFactor - 1) * Math.sin(i / 14)) * (signals.specialEventMultiplier || 1)).toFixed(1)
    );
    const f30 = forecast.slice(0, 30).reduce((s, x) => s + x, 0);
    const f60 = forecast.slice(0, 60).reduce((s, x) => s + x, 0);
    const f90 = forecast.reduce((s, x) => s + x, 0);
    return {
      holtwinters:      { note: 'Insufficient history — simple smoothing used', finalLevel: +level.toFixed(2) },
      bookingPaceIndex: { bcp: 1.0, triggerPricing: false, priceSignal: 'HOLD — insufficient history' },
      demandForecast:   { next30Days: +f30.toFixed(0), next60Days: +f60.toFixed(0), next90Days: +f90.toFixed(0), dailySeries: forecast },
      cancellationRisk: [],
      marketSignals:    signals,
    };
  }

  _diagnoseDropoff(stage, conversionFromPrev, benchmarkRatio) {
    const gap = (benchmarkRatio || 1) - conversionFromPrev;
    if (gap <= 0.02) return 'within-benchmark';
    const causes = {
      COMPARE:  'price-shock',
      SELECT:   'trust-gap',
      CHECKOUT: 'payment-friction',
      CONFIRM:  'ux-failure',
    };
    return causes[stage] || 'unknown';
  }

  // Cumulative standard normal CDF (Hart approximation)
  _normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const pdf  = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    const cdf  = 1 - pdf * poly;
    return z >= 0 ? cdf : 1 - cdf;
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
      latin:        'reservare — to reserve, to keep back, to save',
      capabilities: [
        'GDS Yield Optimization (EMSR-b)',
        'OTA Conversion Funnel Intelligence',
        'Corporate Travel Compliance',
        'NDC Distribution Intelligence',
        'Demand Forecasting Engine (Holt-Winters)',
      ],
      constants: {
        fareBuckets:       FARE_BUCKETS,
        funnelBenchmarks:  FUNNEL_BENCHMARKS,
        policyDimensions:  POLICY_DIMENSIONS,
        ndcTiers:          NDC_TIERS,
        hwParams:          HW_PARAMS,
        gdsSystems:        GDS_SYSTEMS,
      },
      memoryLog:   this.memoryLog,
      createdAt:   this.createdAt,
      framework:   'RSHIP',
    };
  }
}

export function birthBOOKEX(config = {}) { return new BOOKEX(config); }
export { BOOKEX };
export default BOOKEX;
