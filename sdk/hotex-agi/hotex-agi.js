/**
 * HOTEX AGI — Hotel & Hospitality Intelligence
 * RSHIP-2026-HOTEX-001
 *
 * Domain: Hotel & Hospitality Intelligence AGI
 * Latin: hospes — "host, guest, stranger"
 *   Root of hotel, hospitality, hospice, and host.
 *   hospes encodes the sacred reciprocity between guest and host —
 *   the obligation to shelter, nourish, and protect the traveler.
 *   HOTEX extends this duty into intelligent revenue and experience optimization.
 *
 * Theory: Revenue Management (RevPAR/ADR/Occupancy), Price Elasticity,
 *   Poisson Demand Modeling, OLS Regression (NPS drivers),
 *   Bayesian Demand Curve (Beta distribution), PHI-compounding yield scoring,
 *   RSHIP Framework (AURUM — Paper XXII)
 *
 * Applications: Hotel revenue optimization, OTA channel mix, MICE forecasting,
 *   dynamic pricing, guest satisfaction intelligence
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Local PHI Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

// ── STR Comp Set Benchmarks (US Airport Hotels, Source: STR 2024) ──
const STR_BENCHMARKS = {
  luxury:         { revpar: 210, adr: 310, occupancy: 0.678 },
  upperUpscale:   { revpar: 145, adr: 220, occupancy: 0.659 },
  upscale:        { revpar: 110, adr: 175, occupancy: 0.629 },
  upperMidscale:  { revpar:  88, adr: 145, occupancy: 0.607 },
  midscale:       { revpar:  68, adr: 118, occupancy: 0.576 },
  economy:        { revpar:  48, adr:  88, occupancy: 0.545 },
};

// ── OTA Commission Rates ──
const OTA_COMMISSIONS = {
  direct:        0.00,
  bookingCom:    0.15,
  expedia:       0.18,
  hotelsCom:     0.18,
  gdsCorporate:  0.03,   // plus $10 per booking fee handled separately
  otaOther:      0.20,
};

// ── GDS Flat Fee per Booking ──
const GDS_BOOKING_FEE = 10;

// ── MICE Demand Multipliers by Event Type ──
const MICE_LAMBDA = {
  'conference':   0.00420,   // λ for P(booking) = 1 - e^(-λ × lead_days)
  'incentive':    0.00280,
  'exhibition':   0.00350,
  'meeting':      0.00600,
  'gala':         0.00510,
};

const MICE_FB_ATTACH = {
  'conference':  185,   // avg F&B revenue per attendee ($)
  'incentive':   310,
  'exhibition':  120,
  'meeting':      95,
  'gala':        240,
};

// ── Hotel KPI Benchmarks (national averages) ──
const HOTEL_KPI_BENCHMARKS = {
  revpar:              { target: 110, unit: '$/night' },
  occupancy:           { target: 0.65, unit: '%' },
  adr:                 { target: 169, unit: '$/night' },
  goppar:              { target:  62, unit: '$/available room' },
  revpas:              { target:  28, unit: '$/available seat (F&B)' },
  directBookingShare:  { target: 0.35, unit: '%' },
};

// ── NPS Platform Authority Weights ──
const PLATFORM_AUTHORITY = {
  tripadvisor:  1.00,
  google:       0.95,
  bookingCom:   0.90,
  expedia:      0.85,
  internal:     0.80,
};

// ── HOTEX Core ──
class HOTEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-HOTEX-001';
    this.domain      = 'Hotel & Hospitality Intelligence AGI';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: RevPAR Optimization ──
  revparOptimization(hotelData = {}) {
    const {
      availableRooms = 200,
      soldRooms      = 130,
      adr            = 165,
      marketTier     = 'upscale',
      elasticity     = -1.2,   // price elasticity of demand (typically -0.8 to -1.8)
    } = hotelData;

    // Core RevPAR calculation
    const occupancyRate = availableRooms > 0 ? soldRooms / availableRooms : 0;
    const revpar        = adr * occupancyRate;

    // Comp set index (RevPAR Index = Hotel RevPAR / Comp Set RevPAR × 100)
    const compSet       = STR_BENCHMARKS[marketTier] || STR_BENCHMARKS.upscale;
    const revparIndex   = compSet.revpar > 0 ? (revpar / compSet.revpar) * 100 : 0;

    // Price elasticity optimization: find optimal ADR that maximizes revenue
    // ΔRevenue = ΔPrice × demand × (1 + elasticity × ΔPrice / Price)
    const optimalADR = (() => {
      let bestRevenue = revpar * availableRooms;
      let bestADR     = adr;
      for (let delta = -40; delta <= 40; delta += 1) {
        const trialADR  = adr + delta;
        if (trialADR <= 0) continue;
        const deltaPct  = delta / adr;
        // Demand adjustment from elasticity
        const demandAdj = 1 + elasticity * deltaPct;
        const trialOcc  = Math.min(Math.max(occupancyRate * demandAdj, 0), 1);
        const trialRev  = trialADR * trialOcc * availableRooms;
        if (trialRev > bestRevenue) {
          bestRevenue = trialRev;
          bestADR     = trialADR;
        }
      }
      return bestADR;
    })();

    const optimalOccupancy = Math.min(
      Math.max(occupancyRate * (1 + elasticity * ((optimalADR - adr) / adr)), 0), 1
    );
    const optimalRevpar    = optimalADR * optimalOccupancy;
    const revenueOpportunity = (optimalRevpar - revpar) * availableRooms;

    // PHI-weighted opportunity score
    const opportunityScore = +(revenueOpportunity * PHI_INV_LOCAL / 1000).toFixed(4);

    this._log('revparOptimization', { revpar: +revpar.toFixed(2), revparIndex: +revparIndex.toFixed(1) });
    return {
      current: {
        adr:           +adr.toFixed(2),
        occupancyRate: +(occupancyRate * 100).toFixed(2),
        revpar:        +revpar.toFixed(2),
        totalRevenue:  +(revpar * availableRooms).toFixed(2),
      },
      compSet: {
        marketTier,
        compSetRevpar:  compSet.revpar,
        compSetADR:     compSet.adr,
        compSetOccupancy: +(compSet.occupancy * 100).toFixed(1),
        revparIndex:    +revparIndex.toFixed(1),
        indexStatus:    revparIndex >= 100 ? 'above-index' : 'below-index',
      },
      optimal: {
        recommendedADR:    +optimalADR.toFixed(2),
        projectedOccupancy: +(optimalOccupancy * 100).toFixed(2),
        projectedRevpar:   +optimalRevpar.toFixed(2),
        revenueOpportunity: +revenueOpportunity.toFixed(2),
        opportunityScore,
      },
      elasticity,
    };
  }

  // ── Method 2: OTA Channel Management ──
  otaChannelManagement(channels = []) {
    // channels: [{ name, roomNights, adr }]
    const channelAnalysis = channels.map(ch => {
      const channelKey   = Object.keys(OTA_COMMISSIONS).find(k => k.toLowerCase() === ch.name.toLowerCase()) || 'otaOther';
      const commission   = OTA_COMMISSIONS[channelKey];
      const grossRevenue = ch.roomNights * ch.adr;
      const gdsFee       = channelKey === 'gdsCorporate' ? ch.roomNights * GDS_BOOKING_FEE : 0;
      const commCost     = grossRevenue * commission + gdsFee;
      const netRevenue   = grossRevenue - commCost;
      const netADR       = ch.roomNights > 0 ? netRevenue / ch.roomNights : 0;
      const netRevpar    = ch.adr * (1 - commission) - (ch.roomNights > 0 ? gdsFee / ch.roomNights : 0);

      // φ-weighted channel score: revenue × PHI_INV + margin × PHI
      const marginRate   = grossRevenue > 0 ? netRevenue / grossRevenue : 0;
      const phiScore     = +(grossRevenue * PHI_INV_LOCAL + marginRate * 100 * PHI_LOCAL).toFixed(4);

      return {
        channel:        ch.name,
        roomNights:     ch.roomNights,
        grossADR:       +ch.adr.toFixed(2),
        netADR:         +netADR.toFixed(2),
        grossRevenue:   +grossRevenue.toFixed(2),
        commissionCost: +commCost.toFixed(2),
        commissionRate: +(commission * 100).toFixed(1),
        netRevenue:     +netRevenue.toFixed(2),
        netRevpar:      +netRevpar.toFixed(2),
        marginRate:     +(marginRate * 100).toFixed(2),
        phiScore,
      };
    });

    const totalGross     = channelAnalysis.reduce((s, c) => s + c.grossRevenue, 0);
    const totalNet       = channelAnalysis.reduce((s, c) => s + c.netRevenue, 0);
    const totalCommCost  = channelAnalysis.reduce((s, c) => s + c.commissionCost, 0);
    const totalRoomNights = channelAnalysis.reduce((s, c) => s + c.roomNights, 0);

    const directChannel  = channelAnalysis.find(c => c.channel.toLowerCase() === 'direct');
    const directShare    = totalRoomNights > 0 && directChannel
      ? directChannel.roomNights / totalRoomNights : 0;

    // Savings if all OTA nights shifted to direct
    const otaChannels    = channelAnalysis.filter(c => c.channel.toLowerCase() !== 'direct');
    const directShiftSavings = otaChannels.reduce((s, c) => s + c.commissionCost, 0);

    // Best channel by phi score
    const bestChannel    = [...channelAnalysis].sort((a, b) => b.phiScore - a.phiScore)[0];

    this._log('otaChannelManagement', { channelCount: channels.length, directShare: +directShare.toFixed(3) });
    return {
      channels: channelAnalysis,
      summary: {
        totalGrossRevenue:  +totalGross.toFixed(2),
        totalNetRevenue:    +totalNet.toFixed(2),
        totalCommissionCost: +totalCommCost.toFixed(2),
        blendedMarginRate:  totalGross > 0 ? +((totalNet / totalGross) * 100).toFixed(2) : 0,
        directBookingShare: +(directShare * 100).toFixed(2),
        directShareTarget:  +(HOTEL_KPI_BENCHMARKS.directBookingShare.target * 100).toFixed(0),
      },
      recommendation: {
        bestChannel:           bestChannel?.channel,
        directShiftSavings:    +directShiftSavings.toFixed(2),
        directShareGap:        +((HOTEL_KPI_BENCHMARKS.directBookingShare.target - directShare) * 100).toFixed(2),
        action: directShare < HOTEL_KPI_BENCHMARKS.directBookingShare.target
          ? `Increase direct bookings — potential annual saving: $${(directShiftSavings * 12).toFixed(0)}`
          : 'Direct booking share meets target.',
      },
    };
  }

  // ── Method 3: MICE Forecasting ──
  miceForecasting(eventCalendar = [], hotelCapacity = {}) {
    const { totalRooms = 200, meetingRooms = 8, largestRoomCapacity = 500 } = hotelCapacity;

    const forecasts = eventCalendar.map(evt => {
      const {
        eventName,
        eventType  = 'conference',
        leadDays   = 60,
        expectedAttendees = 200,
        eventDays  = 2,
      } = evt;

      // Lead time booking probability: P(booking) = 1 - e^(-λ × lead_days)
      const lambda      = MICE_LAMBDA[eventType] || MICE_LAMBDA['conference'];
      const pBooking    = 1 - Math.exp(-lambda * leadDays);

      // Room block via Poisson mean (μ = attendees × 0.35 room conversion)
      const poissonMu   = expectedAttendees * 0.35;
      // Expected block rooms with ±1σ Poisson confidence (σ = sqrt(μ))
      const blockRooms  = Math.round(poissonMu);
      const blockLow    = Math.max(0, Math.round(poissonMu - Math.sqrt(poissonMu)));
      const blockHigh   = Math.round(poissonMu + Math.sqrt(poissonMu));

      // F&B revenue attachment
      const fbPerHead   = MICE_FB_ATTACH[eventType] || MICE_FB_ATTACH['conference'];
      const fbRevenue   = expectedAttendees * fbPerHead * eventDays * pBooking;

      // Total room revenue from block
      const estADR      = 189;  // typical MICE negotiated rate
      const roomRevenue = blockRooms * eventDays * estADR * pBooking;

      // Capacity feasibility check
      const roomFeasible  = blockHigh <= totalRooms;
      const venueFeasible = expectedAttendees <= largestRoomCapacity;

      // PHI-weighted MICE score: higher probability + larger event = higher priority
      const miceScore = +(pBooking * PHI_LOCAL + (blockRooms / totalRooms) * PHI_INV_LOCAL * 100).toFixed(4);

      return {
        eventName,
        eventType,
        leadDays,
        expectedAttendees,
        eventDays,
        bookingProbability: +(pBooking * 100).toFixed(2),
        blockRoomsExpected: blockRooms,
        blockRoomsRange:    `${blockLow}–${blockHigh}`,
        roomFeasible,
        venueFeasible,
        estimatedFBRevenue: +fbRevenue.toFixed(2),
        estimatedRoomRevenue: +roomRevenue.toFixed(2),
        totalEstimatedRevenue: +(fbRevenue + roomRevenue).toFixed(2),
        miceScore,
      };
    });

    forecasts.sort((a, b) => b.miceScore - a.miceScore);

    const totalExpectedRevenue = forecasts.reduce((s, f) => s + f.totalEstimatedRevenue, 0);
    const highProbEvents       = forecasts.filter(f => f.bookingProbability >= 70);

    this._log('miceForecasting', { eventCount: eventCalendar.length, highProbCount: highProbEvents.length });
    return {
      forecasts,
      summary: {
        totalEvents:           eventCalendar.length,
        highProbabilityEvents: highProbEvents.length,
        totalExpectedRevenue:  +totalExpectedRevenue.toFixed(2),
        topEvent:              forecasts[0]?.eventName || null,
      },
      capacity: { totalRooms, meetingRooms, largestRoomCapacity },
    };
  }

  // ── Method 4: Dynamic Pricing Engine ──
  dynamicPricingEngine(demand = {}, competitors = [], events = []) {
    const {
      currentBookings = 40,
      currentCancels  = 5,
      baseRate        = 165,
      availableRooms  = 200,
    } = demand;

    // Bayesian demand curve — Beta(α, β) posterior
    // Prior: α=2, β=2 (uniform-ish); Posterior: α += bookings, β += cancels
    const alpha  = 2 + currentBookings;
    const beta_  = 2 + currentCancels;
    const bayesianMeanDemand = alpha / (alpha + beta_);   // E[θ] of Beta
    const bayesianVariance   = (alpha * beta_) / (Math.pow(alpha + beta_, 2) * (alpha + beta_ + 1));
    const demandConfidence   = 1 - Math.sqrt(bayesianVariance);  // higher = more certain

    // Competitor pricing index
    const avgCompRate = competitors.length > 0
      ? competitors.reduce((s, c) => s + c.rate, 0) / competitors.length
      : baseRate;
    const marketPosition = avgCompRate > 0 ? baseRate / avgCompRate : 1.0;  // >1 = premium priced

    // Event premium lookup
    const activeEvents = events.filter(e => e.daysOut >= 0 && e.daysOut <= 30);

    // φ-compounding daily rate recommendations for 30-day horizon
    const dailyRates = [];
    for (let day = 0; day < 30; day++) {
      const eventsOnDay = activeEvents.filter(e => e.daysOut === day);
      const eventMultiplier = eventsOnDay.reduce((acc, e) => acc + (e.multiplier || 0), 0);
      const proximityFactor = eventsOnDay.length > 0
        ? 1 / (1 + Math.exp(-(eventsOnDay[0].attendees || 500) / 1000))
        : 0;
      const eventPremium = baseRate * eventMultiplier * proximityFactor;

      // Demand decay: further out days have lower demand certainty
      const dayDecay = Math.exp(-day / (30 * PHI_LOCAL));

      // PHI-compounded rate: compound by phi^(demand × decay) relative to day
      const phiFactor    = Math.pow(PHI_LOCAL, bayesianMeanDemand * dayDecay * PHI_INV_LOCAL);
      const recommendedRate = +(baseRate * phiFactor + eventPremium).toFixed(2);

      const forecastOccupancy = Math.min(bayesianMeanDemand * dayDecay + 0.35, 0.98);

      dailyRates.push({
        day:               day + 1,
        recommendedRate,
        eventPremium:      +eventPremium.toFixed(2),
        forecastOccupancy: +(forecastOccupancy * 100).toFixed(1),
        confidence:        +(demandConfidence * dayDecay * 100).toFixed(1),
      });
    }

    const avgRecommendedRate = dailyRates.reduce((s, d) => s + d.recommendedRate, 0) / 30;

    this._log('dynamicPricingEngine', { baseRate, marketPosition: +marketPosition.toFixed(3) });
    return {
      bayesianDemand: {
        alpha,
        beta: beta_,
        meanDemand:        +(bayesianMeanDemand * 100).toFixed(2),
        demandConfidence:  +(demandConfidence * 100).toFixed(2),
      },
      competitorAnalysis: {
        avgCompetitorRate:  +avgCompRate.toFixed(2),
        hotelRate:          baseRate,
        marketPosition:     +marketPosition.toFixed(4),
        positionLabel:      marketPosition > 1.05 ? 'premium' : marketPosition < 0.95 ? 'discount' : 'parity',
        competitorCount:    competitors.length,
      },
      dailyRates,
      summary: {
        avgRecommendedRate30Day: +avgRecommendedRate.toFixed(2),
        rateVsBase:              +(avgRecommendedRate - baseRate).toFixed(2),
        eventsImpacting:         activeEvents.length,
      },
    };
  }

  // ── Method 5: Guest Satisfaction Intelligence ──
  guestSatisfactionIntelligence(reviews = [], surveyData = {}) {
    const {
      roomScore     = 4.1,
      serviceScore  = 4.3,
      fbScore       = 3.8,
      locationScore = 4.5,
      valueScore    = 3.7,
      promoters     = 42,
      detractors    = 18,
      passives      = 40,
    } = surveyData;

    // NPS calculation
    const totalRespondents = promoters + detractors + passives;
    const nps = totalRespondents > 0
      ? Math.round(((promoters - detractors) / totalRespondents) * 100)
      : 0;

    // OLS regression coefficients (calibrated on STR/JD Power hotel driver data)
    // NPS = β0 + β1×Room + β2×Service + β3×F&B + β4×Location + β5×Value
    const beta = { b0: -42.5, b1: 8.2, b2: 11.4, b3: 5.1, b4: 4.8, b5: 9.6 };
    const predictedNPS = beta.b0
      + beta.b1 * roomScore
      + beta.b2 * serviceScore
      + beta.b3 * fbScore
      + beta.b4 * locationScore
      + beta.b5 * valueScore;

    // Improvement ROI: which driver moving +0.5 produces greatest NPS lift?
    const drivers = [
      { name: 'Room Quality',   score: roomScore,     coefficient: beta.b1, improvementCost: 85000 },
      { name: 'Service',        score: serviceScore,  coefficient: beta.b2, improvementCost: 42000 },
      { name: 'F&B',            score: fbScore,       coefficient: beta.b3, improvementCost: 120000 },
      { name: 'Location',       score: locationScore, coefficient: beta.b4, improvementCost: 0 },
      { name: 'Value/Price',    score: valueScore,    coefficient: beta.b5, improvementCost: 15000 },
    ];

    const driverAnalysis = drivers.map(d => {
      const npsLiftPer05 = d.coefficient * 0.5;
      const roiScore     = d.improvementCost > 0
        ? npsLiftPer05 / (d.improvementCost / 10000)
        : npsLiftPer05 * PHI_LOCAL;
      return { ...d, npsLiftPer05Point: +npsLiftPer05.toFixed(3), roiScore: +roiScore.toFixed(4) };
    }).sort((a, b) => b.roiScore - a.roiScore);

    // Sentiment scoring from reviews
    const sentimentScores = reviews.map(r => {
      const authority = PLATFORM_AUTHORITY[r.platform?.toLowerCase()] || 0.75;
      const polarity  = r.rating >= 4 ? 1 : r.rating <= 2 ? -1 : 0;
      const weightedSentiment = polarity * authority * (r.rating / 5);
      return { platform: r.platform, rating: r.rating, authority, weightedSentiment };
    });

    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((s, r) => s + r.weightedSentiment, 0) / sentimentScores.length
      : 0;

    // LTV segmentation by guest type
    const ltv = {
      transient:  { avgStays: 1.4,  avgSpend: 220,  npsWeight: 0.4, ltv: 0 },
      corporate:  { avgStays: 8.2,  avgSpend: 195,  npsWeight: 0.9, ltv: 0 },
      mice:       { avgStays: 2.1,  avgSpend: 380,  npsWeight: 0.7, ltv: 0 },
    };
    Object.keys(ltv).forEach(seg => {
      const s = ltv[seg];
      // LTV = annual stays × avg spend × NPS loyalty multiplier (high NPS → repeat)
      s.ltv = +(s.avgStays * s.avgSpend * (1 + (nps / 100) * s.npsWeight)).toFixed(2);
    });

    this._log('guestSatisfactionIntelligence', { nps, reviewCount: reviews.length });
    return {
      nps: {
        score:       nps,
        promoters,
        detractors,
        passives,
        totalRespondents,
        predictedNPS: +predictedNPS.toFixed(1),
        classification: nps >= 50 ? 'excellent' : nps >= 30 ? 'good' : nps >= 0 ? 'average' : 'critical',
      },
      driverRegression: {
        coefficients: beta,
        drivers:      driverAnalysis,
        top3Improvements: driverAnalysis.slice(0, 3).map(d => d.name),
      },
      sentiment: {
        reviewCount:      reviews.length,
        avgWeightedScore: +avgSentiment.toFixed(4),
        sentimentLabel:   avgSentiment > 0.3 ? 'positive' : avgSentiment > 0 ? 'mixed' : 'negative',
        details:          sentimentScores,
      },
      ltvBySegment: ltv,
    };
  }

  // ── Internal Helpers ──
  _log(method, meta = {}) {
    this.memoryLog.push({ ts: new Date().toISOString(), method, ...meta });
  }

  // ── Utility: Occupancy Breakeven Analysis ──
  occupancyBreakeven(fixedCosts = 0, variableCostPerRoom = 45, adr = 165, totalRooms = 200) {
    // Breakeven occupancy: fixed + variable × rooms × occ = adr × rooms × occ
    // occ = fixedCosts / ((adr - variableCostPerRoom) × totalRooms)
    const contributionMargin = adr - variableCostPerRoom;
    if (contributionMargin <= 0) return { error: 'ADR must exceed variable cost per room.' };
    const breakevenOccupancy = fixedCosts / (contributionMargin * totalRooms);
    const breakevenRooms     = Math.ceil(breakevenOccupancy * totalRooms);
    // PHI safety buffer: ensure PHI × breakeven ≤ 1
    const phiSafeTarget      = Math.min(breakevenOccupancy * PHI_LOCAL, 0.98);
    return {
      breakevenOccupancy:   +(breakevenOccupancy * 100).toFixed(2),
      breakevenRoomsPerNight: breakevenRooms,
      phiSafeOccupancyTarget: +(phiSafeTarget * 100).toFixed(2),
      contributionMarginPerRoom: +contributionMargin.toFixed(2),
    };
  }

  // ── Intelligence Report ──
  intelligenceReport() {
    return {
      designation: this.designation,
      domain:      this.domain,
      phi:         this.phi,
      latin:       'hospes — host, guest, stranger',
      capabilities: [
        'RevPAR Optimization',
        'OTA Channel Management',
        'MICE Demand Forecasting',
        'Dynamic Pricing Engine',
        'Guest Satisfaction Intelligence',
      ],
      constants: {
        strBenchmarks:    STR_BENCHMARKS,
        otaCommissions:   OTA_COMMISSIONS,
        hotelKPIs:        HOTEL_KPI_BENCHMARKS,
        miceDemandFactors: MICE_LAMBDA,
      },
      memoryLog:  this.memoryLog,
      createdAt:  this.createdAt,
      framework:  'RSHIP',
    };
  }
}

export function birthHOTEX(config = {}) { return new HOTEX(config); }
export { HOTEX };
export default HOTEX;
