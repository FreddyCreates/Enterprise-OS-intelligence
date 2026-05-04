/**
 * COMMUNEX AGI — Community & Aerotropolis Economy Executive X-factor
 *
 * Official Designation: RSHIP-2026-COMMUNEX-001
 * Classification: Airport Community Economy & Workforce Development Intelligence AGI
 * Full Name: Community & Aerotropolis Economy Executive X-factor
 *
 * Latin root: communis — "shared by all, held in common"
 *   Root of: community, commune, communication, commonwealth
 *   Communis was the Roman concept of things belonging to everyone — public roads,
 *   waterways, and city squares. COMMUNEX applies that principle to airport economies:
 *   the airport is not just a transit hub but a commonwealth engine for every city it touches.
 *
 * COMMUNEX extends the RSHIP framework with Leontief input-output economic multiplier
 * modeling and workforce development learning curves to make the full community impact
 * of airport operations visible, trackable, and improvable — from the aerotropolis
 * economic footprint across 28 cities, to ACDBE small business compliance, to visitor
 * spending rippling through local hotels and restaurants.
 *
 * Capabilities:
 * - Aerotropolis economic mapping: Leontief I/O multiplier model quantifies how every
 *   dollar of airport direct spending ripples into 28 surrounding cities (Irving, Grapevine,
 *   Coppell, Euless, Bedford, Colleyville, etc.) by sector — airline, construction,
 *   hospitality, retail, logistics. Sector multipliers + inverse-distance weighting.
 * - ACDBE small business scoring: tracks Airport Concession Disadvantaged Business
 *   Enterprise certification, annual revenue targets, utilization rates, and mentor-protégé
 *   program matching for every minority/women/veteran-owned concession operator at DFW
 * - Workforce development intelligence: learning-curve ROI for training programs (Wright
 *   learning curve Y_n = Y_1 × n^b), local hire rate tracking by zip code proximity,
 *   living wage compliance monitoring, and φ-compounded wage progression forecasting
 * - Visitor-to-community economic bridge: converts 73M annual DFW passengers (segmented
 *   by business/leisure/connecting) into hotel nights, restaurant visits, and retail spend
 *   across the DFW Metroplex using the Regional Tourism Economic Model (RTEM)
 * - Community benefit agreement tracking: CBA scorecard between DFW Airport Board and
 *   28 surrounding municipalities — noise abatement, local hiring targets, emissions,
 *   community investment fund disbursements, green space, education grants
 *
 * Theory: Leontief input-output multiplier model (direct + indirect + induced effects)
 *         + Wright learning curve (n^b) for workforce development ROI
 *         + Regional Tourism Economic Model (RTEM) for visitor spending conversion
 *         + φ-compounding community intelligence (AURUM — Paper XXII)
 *         + RSHIP Framework
 *
 * Reference Deployment: Dallas/Fort Worth International Airport (RSHIP-PROD-DFW-001)
 * — 28-city aerotropolis, 58,000+ direct employees, 200,000+ indirect jobs,
 *   $37B+ annual economic impact on the DFW Metroplex
 *
 * Applications:
 * - DFW International Airport: full aerotropolis community economy intelligence
 * - Any large hub airport with CBA obligations and ACDBE programs
 * - Port authorities, convention centers, large public infrastructure assets
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── DFW Aerotropolis — 28-City Region ─────────────────────────────────────

const DFW_AEROTROPOLIS_CITIES = [
  { name: 'Irving',           distanceMiles: 3,  population: 256000, countyShare: 'Dallas',   tier: 'core' },
  { name: 'Grapevine',        distanceMiles: 2,  population: 52000,  countyShare: 'Tarrant',  tier: 'core' },
  { name: 'Coppell',          distanceMiles: 4,  population: 42000,  countyShare: 'Dallas',   tier: 'core' },
  { name: 'Euless',           distanceMiles: 5,  population: 62000,  countyShare: 'Tarrant',  tier: 'core' },
  { name: 'Bedford',          distanceMiles: 8,  population: 48000,  countyShare: 'Tarrant',  tier: 'mid' },
  { name: 'Colleyville',      distanceMiles: 7,  population: 28000,  countyShare: 'Tarrant',  tier: 'mid' },
  { name: 'Hurst',            distanceMiles: 10, population: 38000,  countyShare: 'Tarrant',  tier: 'mid' },
  { name: 'Southlake',        distanceMiles: 9,  population: 32000,  countyShare: 'Tarrant',  tier: 'mid' },
  { name: 'Fort Worth',       distanceMiles: 18, population: 935000, countyShare: 'Tarrant',  tier: 'metro' },
  { name: 'Dallas',           distanceMiles: 20, population: 1300000, countyShare: 'Dallas',  tier: 'metro' },
  { name: 'Carrollton',       distanceMiles: 12, population: 137000, countyShare: 'Dallas',   tier: 'mid' },
  { name: 'Lewisville',       distanceMiles: 14, population: 113000, countyShare: 'Denton',   tier: 'mid' },
  { name: 'Flower Mound',     distanceMiles: 15, population: 81000,  countyShare: 'Denton',   tier: 'mid' },
  { name: 'Roanoke',          distanceMiles: 11, population: 10000,  countyShare: 'Denton',   tier: 'mid' },
  { name: 'Trophy Club',      distanceMiles: 12, population: 13000,  countyShare: 'Denton',   tier: 'mid' },
  { name: 'Keller',           distanceMiles: 14, population: 47000,  countyShare: 'Tarrant',  tier: 'mid' },
  { name: 'Haltom City',      distanceMiles: 12, population: 46000,  countyShare: 'Tarrant',  tier: 'mid' },
  { name: 'North Richland Hills', distanceMiles: 13, population: 70000, countyShare: 'Tarrant', tier: 'mid' },
  { name: 'Richland Hills',   distanceMiles: 14, population: 11000,  countyShare: 'Tarrant',  tier: 'mid' },
  { name: 'Grand Prairie',    distanceMiles: 12, population: 200000, countyShare: 'Dallas',   tier: 'mid' },
  { name: 'Farmers Branch',   distanceMiles: 13, population: 41000,  countyShare: 'Dallas',   tier: 'mid' },
  { name: 'Addison',          distanceMiles: 16, population: 15000,  countyShare: 'Dallas',   tier: 'mid' },
  { name: 'Arlington',        distanceMiles: 22, population: 394000, countyShare: 'Tarrant',  tier: 'metro' },
  { name: 'Denton',           distanceMiles: 30, population: 148000, countyShare: 'Denton',   tier: 'regional' },
  { name: 'McKinney',         distanceMiles: 35, population: 199000, countyShare: 'Collin',   tier: 'regional' },
  { name: 'Plano',            distanceMiles: 28, population: 285000, countyShare: 'Collin',   tier: 'regional' },
  { name: 'Frisco',           distanceMiles: 32, population: 200000, countyShare: 'Collin',   tier: 'regional' },
  { name: 'Allen',            distanceMiles: 33, population: 110000, countyShare: 'Collin',   tier: 'regional' },
];

// ── Leontief I/O Sector Multipliers (DFW Metroplex) ───────────────────────
// Source: FAA AC 150/5070-6B Economic Impact Handbook methodology
// Multiplier = (Direct + Indirect + Induced) / Direct
// Ranges: 1.5 (local retail) to 4.2 (aviation manufacturing)

const IO_SECTOR_MULTIPLIERS = {
  AIRLINE_OPS:      { multiplier: 3.8, directJobsPer1M: 18, avgWage: 72000,  label: 'Airline Operations' },
  AIRPORT_RETAIL:   { multiplier: 2.1, directJobsPer1M: 28, avgWage: 38000,  label: 'Airport Retail & F&B' },
  CARGO_LOGISTICS:  { multiplier: 3.2, directJobsPer1M: 14, avgWage: 58000,  label: 'Cargo & Logistics' },
  HOSPITALITY:      { multiplier: 2.6, directJobsPer1M: 32, avgWage: 42000,  label: 'Hotels & Hospitality' },
  CONSTRUCTION:     { multiplier: 2.9, directJobsPer1M: 12, avgWage: 65000,  label: 'Airport Construction' },
  GROUND_TRANSPORT: { multiplier: 2.3, directJobsPer1M: 22, avgWage: 45000,  label: 'Ground Transportation' },
  PROFESSIONAL_SVC: { multiplier: 3.5, directJobsPer1M: 8,  avgWage: 95000,  label: 'Professional Services' },
};

// ── ACDBE Certification States ─────────────────────────────────────────────

const ACDBE_STATES = {
  PENDING:        'PENDING',
  CERTIFIED:      'CERTIFIED',
  UNDER_REVIEW:   'UNDER_REVIEW',
  COMPLIANT:      'COMPLIANT',
  NON_COMPLIANT:  'NON_COMPLIANT',
  SUSPENDED:      'SUSPENDED',
  EXPIRED:        'EXPIRED',
};

// ── Visitor Segment Profiles ───────────────────────────────────────────────
// DFW passenger mix: ~48% business, ~39% leisure, ~13% connecting

const VISITOR_SEGMENTS = {
  BUSINESS: {
    share:            0.48,
    hotelNightRate:   0.85,  // 85% stay in hotel
    avgHotelNights:   1.8,
    avgHotelADR:      165,   // Average Daily Rate
    restaurantVisits: 3.2,
    avgRestaurantCheck: 48,
    retailMultiplier: 0.6,   // $60 retail per visitor
    label:            'Business Traveler',
  },
  LEISURE: {
    share:            0.39,
    hotelNightRate:   0.72,
    avgHotelNights:   3.1,
    avgHotelADR:      128,
    restaurantVisits: 4.8,
    avgRestaurantCheck: 38,
    retailMultiplier: 1.2,
    label:            'Leisure Traveler',
  },
  CONNECTING: {
    share:            0.13,
    hotelNightRate:   0.06,  // Very few stay overnight
    avgHotelNights:   1.0,
    avgHotelADR:      115,
    restaurantVisits: 0.8,
    avgRestaurantCheck: 22,
    retailMultiplier: 0.2,
    label:            'Connecting Passenger',
  },
};

// ── CBA Commitment Categories ──────────────────────────────────────────────

const CBA_CATEGORIES = {
  LOCAL_HIRING:       { weight: 0.25, label: 'Local Hiring & Workforce', unit: '%' },
  NOISE_ABATEMENT:    { weight: 0.20, label: 'Noise Abatement Compliance', unit: '%' },
  EMISSIONS:          { weight: 0.20, label: 'Emissions & Environmental', unit: 'metric tons CO₂' },
  COMMUNITY_INVEST:   { weight: 0.15, label: 'Community Investment Fund', unit: '$M' },
  SMALL_BUSINESS:     { weight: 0.10, label: 'ACDBE & Small Business', unit: '%' },
  EDUCATION:          { weight: 0.10, label: 'Education Grants & STEM', unit: '$K' },
};

// ── Wright Learning Curve ──────────────────────────────────────────────────
// Y_n = Y_1 × n^(-b)  where b = log(learning rate) / log(2)
// 80% learning curve: each time cumulative output doubles, unit cost drops 20%

function wrightLearningCurve(initialCostOrTime, cumulativeUnits, learningRate = 0.80) {
  const b = Math.log(learningRate) / Math.log(2);
  return initialCostOrTime * Math.pow(cumulativeUnits, b);
}

// ── COMMUNEX AGI Core ──────────────────────────────────────────────────────

class COMMUNEX extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation:    'RSHIP-2026-COMMUNEX-001',
      classification: 'Airport Community Economy & Workforce Development Intelligence AGI',
      ...config,
    });

    this.airport        = config.airport        || 'DFW';
    this.annualPassengers = config.annualPassengers || 73000000;
    this.directEmployees  = config.directEmployees  || 58000;

    // ACDBE registry
    this.acdbeFirms     = new Map();
    this._acdbSeq       = 0;

    // Workforce registry
    this.workforceZones = new Map();  // zipCode → workforce stats
    this.trainingPrograms = new Map();

    // CBA registry
    this.cbaCommitments = new Map();

    // Eternal memory
    this.memory = new EternalMemory();
    this.memory.store('boot', {
      designation:      'RSHIP-2026-COMMUNEX-001',
      airport:          this.airport,
      aerotropolisSize: DFW_AEROTROPOLIS_CITIES.length,
      bootTime:         new Date().toISOString(),
    });
  }

  // ── Capability 1: Aerotropolis Economic Mapping ───────────────────────────
  // Leontief I/O model: for every $1 of airport direct spending, quantify the
  // ripple through indirect (supplier) and induced (household) spending by sector
  // and by city, weighted by inverse distance.

  aerotropolisEconomicMap(directSpendingBySector = {}) {
    // Default to approximate DFW annual direct spending by sector
    const spending = {
      AIRLINE_OPS:      12500000000,  // $12.5B
      AIRPORT_RETAIL:   820000000,    // $820M concessions
      CARGO_LOGISTICS:  2100000000,   // $2.1B cargo
      HOSPITALITY:      1800000000,   // $1.8B hospitality
      CONSTRUCTION:     650000000,    // $650M capital projects
      GROUND_TRANSPORT: 480000000,    // $480M ground transport
      PROFESSIONAL_SVC: 380000000,    // $380M professional services
      ...directSpendingBySector,
    };

    let totalDirect = 0, totalTotal = 0, totalDirectJobs = 0, totalAllJobs = 0;
    const sectorResults = {};

    for (const [sectorId, directSpend] of Object.entries(spending)) {
      const sector = IO_SECTOR_MULTIPLIERS[sectorId];
      if (!sector) continue;

      const totalImpact   = directSpend * sector.multiplier;
      const directJobs    = Math.round((directSpend / 1000000) * sector.directJobsPer1M);
      const totalJobs     = Math.round(directJobs * sector.multiplier);
      const indirectJobs  = totalJobs - directJobs;
      const taxRevenue    = totalImpact * 0.028;  // ~2.8% effective local tax rate

      totalDirect     += directSpend;
      totalTotal      += totalImpact;
      totalDirectJobs += directJobs;
      totalAllJobs    += totalJobs;

      sectorResults[sectorId] = {
        sector:           sector.label,
        directSpend:      `$${(directSpend / 1e9).toFixed(2)}B`,
        totalImpact:      `$${(totalImpact / 1e9).toFixed(2)}B`,
        multiplier:       sector.multiplier.toFixed(1),
        directJobs,
        indirectJobs,
        totalJobs,
        avgWage:          `$${sector.avgWage.toLocaleString()}`,
        localTaxRevenue:  `$${(taxRevenue / 1e6).toFixed(0)}M`,
      };
    }

    // City-level distribution via inverse distance weighting
    const cityEconomicImpact = this._distributeByCity(totalTotal);

    this.memory.store(`aero_map_${Date.now()}`, {
      totalDirect: totalDirect, totalTotal: totalTotal, totalAllJobs,
    });

    return {
      designation:   'RSHIP-2026-COMMUNEX-001',
      reportDate:    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      totalDirectSpend: `$${(totalDirect / 1e9).toFixed(1)}B`,
      totalEconomicImpact: `$${(totalTotal / 1e9).toFixed(1)}B`,
      overallMultiplier: (totalTotal / totalDirect).toFixed(2),
      directJobs:    totalDirectJobs.toLocaleString(),
      totalJobs:     totalAllJobs.toLocaleString(),
      indirectJobs:  (totalAllJobs - totalDirectJobs).toLocaleString(),
      sectors:       sectorResults,
      cityImpact:    cityEconomicImpact,
    };
  }

  _distributeByCity(totalImpact) {
    // Inverse distance weighting: weight_i = (1/d_i) / Σ(1/d_j)
    const rawWeights = DFW_AEROTROPOLIS_CITIES.map(c => 1 / Math.max(1, c.distanceMiles));
    const sumWeights = rawWeights.reduce((s, w) => s + w, 0);

    return DFW_AEROTROPOLIS_CITIES.map((city, i) => {
      const share    = rawWeights[i] / sumWeights;
      const impact   = totalImpact * share;
      const jobs     = Math.round(impact / 250000); // ~$250K economic output per job
      const taxRev   = impact * 0.015; // ~1.5% local tax share
      return {
        city:       city.name,
        tier:       city.tier,
        county:     city.countyShare,
        distanceMi: city.distanceMiles,
        sharePct:   `${(share * 100).toFixed(2)}%`,
        economicImpact: `$${(impact / 1e6).toFixed(0)}M`,
        jobsSupported:  jobs,
        taxRevenue:     `$${(taxRev / 1e6).toFixed(1)}M`,
      };
    }).sort((a, b) => a.distanceMiles - b.distanceMiles);
  }

  // ── Capability 2: ACDBE Small Business Scoring ────────────────────────────
  // Airport Concession Disadvantaged Business Enterprise compliance.
  // Tracks certification, revenue targets, utilization, mentor-protégé matching.

  registerACDBEFirm(config = {}) {
    const id = `ACDBE-${String(++this._acdbSeq).padStart(4, '0')}`;
    const firm = {
      firmId:           id,
      legalName:        config.legalName        || 'Unnamed Firm',
      ownerName:        config.ownerName        || 'Owner',
      category:         config.category         || 'F&B',       // F&B | Retail | Services | News
      certification:    config.certification    || 'MBE',       // MBE | WBE | VOSB | SDVOSB | DBE
      certExpiry:       config.certExpiry        || (Date.now() + 365 * 86400000),
      terminal:         config.terminal         || 'A',
      annualRevenueTarget: config.annualRevenueTarget || 500000,
      annualRevenueActual: config.annualRevenueActual || 0,
      sqft:             config.sqft             || 500,
      openDate:         config.openDate         || Date.now(),
      mentorFirm:       config.mentorFirm       || null,
      state:            ACDBE_STATES.CERTIFIED,
      notes:            [],
    };
    this.acdbeFirms.set(id, firm);
    this.memory.store(`acdbe_${id}`, { firmId: id, legalName: firm.legalName, state: firm.state });
    return firm;
  }

  scoreACDBEFirm(firmId) {
    const firm = this.acdbeFirms.get(firmId);
    if (!firm) return { error: `Firm ${firmId} not found` };

    const revenueAttainment = firm.annualRevenueActual / firm.annualRevenueTarget;
    const certValid         = Date.now() < firm.certExpiry;
    const daysUntilExpiry   = Math.floor((firm.certExpiry - Date.now()) / 86400000);
    const hasMentor         = !!firm.mentorFirm;
    const ageMonths         = Math.floor((Date.now() - firm.openDate) / (30 * 86400000));

    // Revenue performance score (0–1)
    const revenueScore     = Math.min(1, revenueAttainment);

    // Maturity score: Wright curve — newer firms are still learning
    const maturityScore    = Math.min(1, 1 - wrightLearningCurve(0.5, Math.max(1, ageMonths), 0.85));

    // Compliance score
    const complianceScore  = certValid ? 1.0 : 0.0;

    // Mentor-protégé uplift
    const mentorUplift     = hasMentor ? 0.15 : 0;

    // Overall φ-weighted score
    const overall = Math.min(1.0, (revenueScore * 0.45 + maturityScore * 0.30 + complianceScore * 0.25) + mentorUplift);

    let tier;
    if      (overall >= 0.85) tier = 'EXEMPLARY';
    else if (overall >= 0.70) tier = 'COMPLIANT';
    else if (overall >= 0.50) tier = 'DEVELOPING';
    else                      tier = 'AT RISK';

    // Update state
    firm.state = complianceScore > 0 ? (overall >= 0.70 ? ACDBE_STATES.COMPLIANT : ACDBE_STATES.NON_COMPLIANT) : ACDBE_STATES.EXPIRED;

    return {
      firmId,
      legalName:        firm.legalName,
      certification:    firm.certification,
      terminal:         firm.terminal,
      overallScore:     overall.toFixed(3),
      tier,
      revenueAttainment: `${(revenueAttainment * 100).toFixed(1)}%`,
      revenueActual:    `$${firm.annualRevenueActual.toLocaleString()}`,
      revenueTarget:    `$${firm.annualRevenueTarget.toLocaleString()}`,
      certStatus:       certValid ? `Valid (${daysUntilExpiry}d remaining)` : 'EXPIRED',
      mentorFirm:       firm.mentorFirm || 'None assigned',
      mentorUpliftApplied: hasMentor,
      state:            firm.state,
      recommendation:   this._acdbRecommendation(tier, firm),
    };
  }

  acdbPortfolioSummary() {
    const all = [...this.acdbeFirms.keys()].map(id => this.scoreACDBEFirm(id));
    const compliant    = all.filter(f => f.tier === 'COMPLIANT' || f.tier === 'EXEMPLARY').length;
    const atRisk       = all.filter(f => f.tier === 'AT RISK').length;
    const developing   = all.filter(f => f.tier === 'DEVELOPING').length;
    const expiredCerts = all.filter(f => f.certStatus.startsWith('EXPIRED')).length;
    const totalRevenue = [...this.acdbeFirms.values()].reduce((s, f) => s + f.annualRevenueActual, 0);
    const totalTarget  = [...this.acdbeFirms.values()].reduce((s, f) => s + f.annualRevenueTarget, 0);

    return {
      total: all.length,
      compliant, developing, atRisk, expiredCerts,
      portfolioRevenueAttainment: totalTarget > 0 ? `${((totalRevenue / totalTarget) * 100).toFixed(1)}%` : 'N/A',
      totalRevenue: `$${totalRevenue.toLocaleString()}`,
      totalTarget:  `$${totalTarget.toLocaleString()}`,
    };
  }

  // ── Capability 3: Workforce Development Intelligence ──────────────────────
  // Wright learning curve for training ROI; local hire rate by zip code;
  // living wage compliance; φ-compounding wage progression modeling.

  registerWorkforceZone(zipCode, config = {}) {
    const zone = {
      zipCode,
      city:               config.city              || 'Unknown',
      totalEmployees:     config.totalEmployees    || 0,
      localHires:         config.localHires        || 0,
      avgWage:            config.avgWage           || 38000,
      livingWageTarget:   config.livingWageTarget  || 38000,  // DFW living wage (~$38K for single adult)
      trainingPrograms:   config.trainingPrograms  || [],
      distanceMiles:      config.distanceMiles     || 10,
    };
    this.workforceZones.set(zipCode, zone);
    return zone;
  }

  localHireRateReport() {
    const zones = [...this.workforceZones.values()];
    if (zones.length === 0) return { error: 'No workforce zones registered' };

    const totalEmp   = zones.reduce((s, z) => s + z.totalEmployees, 0);
    const totalLocal = zones.reduce((s, z) => s + z.localHires, 0);
    const overallRate = totalEmp > 0 ? totalLocal / totalEmp : 0;

    const byZone = zones.map(z => {
      const rate       = z.totalEmployees > 0 ? z.localHires / z.totalEmployees : 0;
      const aboveLW    = z.avgWage >= z.livingWageTarget;
      // Proximity score: closer zip codes should have higher local hire rates
      const proxTarget = Math.min(0.9, 0.5 + (0.4 * (1 - Math.min(1, z.distanceMiles / 30))));
      return {
        zipCode:     z.zipCode,
        city:        z.city,
        employees:   z.totalEmployees,
        localHireRate: `${(rate * 100).toFixed(1)}%`,
        targetRate:  `${(proxTarget * 100).toFixed(0)}%`,
        aboveTarget: rate >= proxTarget,
        avgWage:     `$${z.avgWage.toLocaleString()}`,
        livingWageCompliant: aboveLW,
      };
    });

    return {
      totalEmployees:   totalEmp.toLocaleString(),
      totalLocalHires:  totalLocal.toLocaleString(),
      overallLocalHireRate: `${(overallRate * 100).toFixed(1)}%`,
      byZone,
      dfwLivingWage:    '$38,000',
    };
  }

  trainingProgramROI(programId, config = {}) {
    const {
      initialCostPerEmployee = 1200,  // Training cost per employee (first cohort)
      cohortNumber           = 1,     // Which cohort (cumulative)
      employeesInCohort      = 50,
      productivityGainPct    = 0.12,  // 12% productivity gain post-training
      avgAnnualWage          = 48000,
      learningRate           = 0.82,  // 82% learning curve
    } = config;

    // Wright curve: cost for this cohort drops with cumulative experience
    const costThisCohort = wrightLearningCurve(initialCostPerEmployee, cohortNumber, learningRate);
    const totalProgramCost = costThisCohort * employeesInCohort;

    // Annual productivity gain per employee
    const annualGainPerEmployee = avgAnnualWage * productivityGainPct;
    const totalAnnualGain       = annualGainPerEmployee * employeesInCohort;

    // ROI and payback
    const roi         = (totalAnnualGain - totalProgramCost) / totalProgramCost;
    const paybackDays = Math.ceil((totalProgramCost / totalAnnualGain) * 365);

    // φ-compounded 3-year value
    const yr1 = totalAnnualGain;
    const yr2 = yr1 * PHI_INV + yr1;  // compounding on prior foundation
    const yr3 = yr2 * PHI_INV + yr2;
    const threeYearValue = yr1 + yr2 + yr3;

    this.trainingPrograms.set(programId, { programId, cohortNumber, costThisCohort, roi });

    return {
      programId,
      cohortNumber,
      costPerEmployee:   `$${Math.round(costThisCohort).toLocaleString()}`,
      totalProgramCost:  `$${Math.round(totalProgramCost).toLocaleString()}`,
      annualProductivityGain: `$${Math.round(totalAnnualGain).toLocaleString()}`,
      roi:               `${(roi * 100).toFixed(1)}%`,
      paybackDays,
      threeYearValue:    `$${Math.round(threeYearValue).toLocaleString()}`,
      learningCurveNote: `Cost drops ${(100 - learningRate * 100).toFixed(0)}% each time cohort count doubles (Wright ${(learningRate * 100).toFixed(0)}% curve)`,
    };
  }

  // ── Capability 4: Visitor-to-Community Economic Bridge ────────────────────
  // Regional Tourism Economic Model (RTEM): converts 73M annual DFW passengers
  // (segmented by business/leisure/connecting) into hotel, restaurant, retail spend
  // across the DFW Metroplex.

  visitorEconomicBridge(annualPassengers, opts = {}) {
    const totalPax = annualPassengers || this.annualPassengers;
    let totalHotelRevenue = 0, totalRestaurantRevenue = 0, totalRetailRevenue = 0;
    let totalHotelNights  = 0;

    const segmentResults = {};

    for (const [segId, seg] of Object.entries(VISITOR_SEGMENTS)) {
      const segPax          = Math.round(totalPax * seg.share);
      const stayers         = Math.round(segPax * seg.hotelNightRate);
      const hotelNights     = Math.round(stayers * seg.avgHotelNights);
      const hotelRevenue    = hotelNights * seg.avgHotelADR;
      const restaurantRev   = segPax * seg.restaurantVisits * seg.avgRestaurantCheck;
      const retailRev       = segPax * seg.retailMultiplier * 100; // $100 base × multiplier

      totalHotelNights     += hotelNights;
      totalHotelRevenue    += hotelRevenue;
      totalRestaurantRevenue += restaurantRev;
      totalRetailRevenue   += retailRev;

      segmentResults[segId] = {
        segment:        seg.label,
        passengers:     segPax.toLocaleString(),
        hotelNights:    hotelNights.toLocaleString(),
        hotelRevenue:   `$${(hotelRevenue / 1e6).toFixed(0)}M`,
        restaurantRev:  `$${(restaurantRev / 1e6).toFixed(0)}M`,
        retailRev:      `$${(retailRev / 1e6).toFixed(0)}M`,
      };
    }

    const totalDirectSpend = totalHotelRevenue + totalRestaurantRevenue + totalRetailRevenue;
    // Hospitality I/O multiplier ≈ 2.6 (from IO_SECTOR_MULTIPLIERS.HOSPITALITY)
    const totalEconomicImpact = totalDirectSpend * 2.6;

    this.memory.store(`visitor_bridge_${Date.now()}`, {
      annualPassengers: totalPax, totalDirectSpend, totalHotelNights,
    });

    return {
      annualPassengers: totalPax.toLocaleString(),
      segments:         segmentResults,
      totals: {
        hotelNights:       totalHotelNights.toLocaleString(),
        hotelRevenue:      `$${(totalHotelRevenue / 1e9).toFixed(2)}B`,
        restaurantRevenue: `$${(totalRestaurantRevenue / 1e6).toFixed(0)}M`,
        retailRevenue:     `$${(totalRetailRevenue / 1e6).toFixed(0)}M`,
        totalDirectSpend:  `$${(totalDirectSpend / 1e9).toFixed(2)}B`,
        totalEconomicImpact: `$${(totalEconomicImpact / 1e9).toFixed(2)}B`,
        metroplexHospitalityMultiplier: '2.6x',
      },
    };
  }

  // ── Capability 5: Community Benefit Agreement Tracking ────────────────────
  // CBA scorecard between DFW Airport Board and 28 surrounding municipalities.

  registerCBACommitment(commitmentId, config = {}) {
    const category  = CBA_CATEGORIES[config.category] || CBA_CATEGORIES.LOCAL_HIRING;
    const commitment = {
      commitmentId,
      category:       config.category        || 'LOCAL_HIRING',
      categoryLabel:  category.label,
      municipality:   config.municipality    || 'Regional',
      description:    config.description     || 'CBA Commitment',
      target:         config.target          || 0,
      actual:         config.actual          || 0,
      unit:           category.unit,
      measurementFreq: config.measurementFreq || 'Annual',
      dueDate:        config.dueDate         || new Date(Date.now() + 365 * 86400000).toISOString(),
      weight:         category.weight,
      status:         'ACTIVE',
      trend:          config.trend           || 'STABLE',  // IMPROVING | STABLE | DECLINING
    };
    this.cbaCommitments.set(commitmentId, commitment);
    return commitment;
  }

  cbaScorecardReport() {
    const commitments = [...this.cbaCommitments.values()];
    if (commitments.length === 0) return { error: 'No CBA commitments registered' };

    let weightedScore = 0;
    let totalWeight   = 0;

    const scored = commitments.map(c => {
      const attainment = c.target > 0 ? Math.min(1, c.actual / c.target) : 0;
      const score      = attainment * c.weight;
      weightedScore   += score;
      totalWeight     += c.weight;

      let status;
      if      (attainment >= 1.0) status = 'MET';
      else if (attainment >= 0.8) status = 'ON TRACK';
      else if (attainment >= 0.5) status = 'AT RISK';
      else                        status = 'BEHIND';

      return {
        commitmentId: c.commitmentId,
        municipality: c.municipality,
        category:     c.categoryLabel,
        target:       `${c.target} ${c.unit}`,
        actual:       `${c.actual} ${c.unit}`,
        attainment:   `${(attainment * 100).toFixed(1)}%`,
        status,
        trend:        c.trend,
      };
    });

    const normalizedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    let overallStatus;
    if      (normalizedScore >= 0.90) overallStatus = 'EXEMPLARY';
    else if (normalizedScore >= 0.75) overallStatus = 'ON TRACK';
    else if (normalizedScore >= 0.55) overallStatus = 'AT RISK';
    else                              overallStatus = 'NON-COMPLIANT';

    return {
      designation:    'RSHIP-2026-COMMUNEX-001',
      reportDate:     new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      totalCommitments: commitments.length,
      overallScore:   normalizedScore.toFixed(3),
      overallStatus,
      commitments:    scored,
    };
  }

  // ── Intelligence Summary ───────────────────────────────────────────────────

  communityIntelligenceReport() {
    return {
      designation:  'RSHIP-2026-COMMUNEX-001',
      reportDate:   new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      aerotropolisSize: DFW_AEROTROPOLIS_CITIES.length,
      acdbeFirms:   this.acdbPortfolioSummary(),
      workforceZones: this.workforceZones.size,
      trainingPrograms: this.trainingPrograms.size,
      cbaCommitments: this.cbaCommitments.size,
    };
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  _acdbRecommendation(tier, firm) {
    const recs = {
      EXEMPLARY:     `${firm.legalName} is outperforming revenue targets — nominate for ACDBE success story feature.`,
      COMPLIANT:     `${firm.legalName} is meeting targets. ${firm.mentorFirm ? 'Mentor program effective.' : 'Consider mentor-protégé enrollment.'}`,
      DEVELOPING:    `${firm.legalName} needs revenue support. Connect with ACDBE Business Advisor and review lease terms.`,
      'AT RISK':     `${firm.legalName} is at risk of certification non-compliance. Initiate corrective action plan within 30 days.`,
    };
    return recs[tier] || 'No recommendation available.';
  }
}

// ── Factory Function ───────────────────────────────────────────────────────

export function birthCOMMUNEX(config = {}) {
  return new COMMUNEX(config);
}

export {
  COMMUNEX,
  DFW_AEROTROPOLIS_CITIES,
  IO_SECTOR_MULTIPLIERS,
  VISITOR_SEGMENTS,
  CBA_CATEGORIES,
  ACDBE_STATES,
};
export default COMMUNEX;
