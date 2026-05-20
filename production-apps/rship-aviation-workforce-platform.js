/**
 * PRODUCTION APPLICATION: RSHIP AVIATION WORKFORCE PLATFORM
 *
 * Designation: RSHIP-PROD-AVWF-001
 * Classification: National Aviation Employee Intelligence Platform — Freemium
 * AGI Systems: CREWEX · AEROLEX
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MARKET PROBLEM
 *
 * There are approximately 750,000 commercial aviation workers in the United
 * States: pilots, flight attendants, gate agents, ramp workers, cargo handlers,
 * security officers, maintenance technicians, customer service reps, ground crew,
 * food service, retail, and administrative staff across 490+ commercial airports
 * and 750+ airline and ground-handling brands.
 *
 * None of them have a unified intelligence tool built for them personally.
 *
 * Their employers — airlines and airports — have operations software.
 * But the employee themselves? They check FAR 117 duty limits on a PDF.
 * They find out their next certification from a bulletin board.
 * They don't know if their wages compare fairly to peers three gates away.
 * They have no personalized career intelligence — just a union book and a manager.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RSHIP SOLUTION: A FREE-FIRST, TIERED PLATFORM FOR EVERY AVIATION WORKER
 *
 * RSHIP Aviation Workforce Platform is the first intelligence product built
 * specifically for the individual airport and airline employee. Free tier is
 * genuinely useful on day one — no credit card, no employer permission required.
 * Just sign up with your employee badge or airline ID and get:
 *
 *   - Your personal fatigue risk score before your next shift (SAFTE-FAST)
 *   - Your career pathway to the next level with exact cert gap
 *   - Your FAR 117 / union duty-time status check
 *   - Wage benchmark: how your pay compares to peers at your role & airport
 *   - Shift schedule viewer and conflict checker
 *
 * PRO and ENTERPRISE tiers unlock employer-level analytics, team scheduling,
 * compliance dashboards, and CREWEX + AEROLEX API access.
 *
 * DISTRIBUTION STRATEGY: Employee-first → employer upsell
 * 1. FREE tier spreads virally within airport break rooms (zero friction)
 * 2. When enough employees at one airport/airline use it, management notices
 * 3. ENTERPRISE tier: airline or airport signs an org contract for HR analytics
 *    built on the aggregated (anonymized) employee data their own workers created
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PRICING TIERS
 *
 *   FREE       — Any US aviation employee. Forever free. No credit card.
 *                Core personal intelligence: fatigue, career, pay benchmark, duties.
 *
 *   PRO        — $9/month or $79/year per employee.
 *                Full shift management, advanced FAR 117, training ROI calculator,
 *                peer network, priority career coaching, multi-airport coverage.
 *
 *   ENTERPRISE — Custom pricing per seat (airlines and airports).
 *                All Pro features + team roster management, labor demand forecast,
 *                compliance dashboard, wage equity audit, CREWEX/AEROLEX API.
 *                Starts at $4/seat/month for 500+ seat orgs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NATIONAL COVERAGE
 *
 *   490+ US commercial airports (FAA Part 139 certificate holders)
 *   750+ airline and ground handling brands
 *   ~750,000 directly employed aviation workers
 *   ~2,100,000 indirect / aerotropolis workers within platform reach
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Run: node production-apps/rship-aviation-workforce-platform.js
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthCREWEX  } from '../sdk/crewex-agi/crewex-agi.js';
import { birthAEROLEX } from '../sdk/aerolex-agi/aerolex-agi.js';
import { PHI, PHI_INV } from '../rship-framework.js';

// ── Platform Constants ─────────────────────────────────────────────────────

const PLATFORM = {
  designation:        'RSHIP-PROD-AVWF-001',
  name:               'RSHIP Aviation Workforce Platform',
  version:            '1.0.0',
  totalUSAirports:    490,
  totalUSAirlines:    750,   // airlines + ground handlers + contract brands
  targetEmployees:    750000,
  indirectReach:      2100000,
};

// ── Freemium Tier Definitions ──────────────────────────────────────────────

const TIERS = {
  FREE: {
    id:        'FREE',
    name:      'Free',
    price:     '$0 forever',
    tagline:   'Built for every aviation worker in America. No card required.',
    features: [
      'Personal fatigue risk score (SAFTE-FAST model, before every shift)',
      'Career pathway viewer — your next level, exact cert gap, training hours',
      'FAR Part 117 / union duty-time check (pilots, FAs)',
      'Pay benchmark — how your wage compares to peers at your role & airport',
      'Shift schedule viewer + conflict detector',
      'Covers all 490 US commercial airports',
      'Supports all 750 airline & ground-handler brands',
    ],
    limits: {
      airportsTracked:   1,
      shiftsPerMonth:    30,
      careerScans:       3,
      fatigueChecks:     'unlimited',
      payBenchmarks:     1,
      teamMembers:       0,   // no team features on free
      apiAccess:         false,
      complianceDash:    false,
    },
    upsell: 'Unlock multi-airport tracking, training ROI, and peer chat → Go PRO for $9/mo',
  },

  PRO: {
    id:        'PRO',
    name:      'Pro',
    price:     '$9/month · $79/year',
    tagline:   'Everything a working aviation professional needs in one place.',
    features: [
      'Everything in Free — unlimited',
      'All 490 airports tracked simultaneously',
      'Unlimited career pathway scans across all job ladders',
      'Full shift management: set preferences, request swaps, bid windows',
      'Training ROI calculator: cost → payback months → annual wage lift',
      'FAR 117 advanced planner: 72-hour duty legality forecast',
      'Anonymous wage comparison across role, region, airline, and tenure',
      'Peer network: connect with other aviation workers nationally',
      'Priority career coaching (AI-guided, CREWEX-powered)',
      'Notification: schedule changes, FMLA alerts, OT threshold warnings',
    ],
    limits: {
      airportsTracked:   490,
      shiftsPerMonth:    'unlimited',
      careerScans:       'unlimited',
      fatigueChecks:     'unlimited',
      payBenchmarks:     'unlimited',
      teamMembers:       0,
      apiAccess:         false,
      complianceDash:    false,
    },
    upsell: 'Need team scheduling and HR compliance for your department? → Ask about Enterprise',
  },

  ENTERPRISE: {
    id:        'ENTERPRISE',
    name:      'Enterprise',
    price:     'From $4/seat/month (500+ seats)',
    tagline:   'Full workforce intelligence for airlines, airports, and ground handlers.',
    features: [
      'Everything in Pro — for every employee in your org',
      'Team roster management: build, edit, and publish schedules',
      'Labor demand forecasting (AEROLEX coupling: flight banks → staff need)',
      'Wage equity audit: Oaxaca-Blinder pay gap analysis, FLSA monitoring',
      'Compliance dashboard: FAR 117, living wage, overtime, union rules',
      'Aggregate workforce analytics: fatigue heat maps, attrition risk, coverage gaps',
      'CREWEX + AEROLEX API access: integrate with your existing HRIS / OMS',
      'Custom career ladder configuration per job classification',
      'Dedicated customer success manager',
      'SLA: 99.9% uptime, SOC 2 Type II, HIPAA-adjacent data handling',
    ],
    limits: {
      airportsTracked:   490,
      shiftsPerMonth:    'unlimited',
      careerScans:       'unlimited',
      fatigueChecks:     'unlimited',
      payBenchmarks:     'unlimited',
      teamMembers:       'unlimited',
      apiAccess:         true,
      complianceDash:    true,
    },
  },
};

// ── National Airport Coverage ──────────────────────────────────────────────
// Representative sample of the 490+ US commercial airports by hub class

const US_AIRPORTS = {
  // Large Hubs (29 airports, ~70% of enplanements)
  ATL: { name: 'Hartsfield-Jackson Atlanta',  city: 'Atlanta, GA',       hubClass: 'LARGE', pax: 104e6, employees: 63000, dominantCarrier: 'DL' },
  DFW: { name: 'Dallas/Fort Worth Intl',       city: 'DFW, TX',           hubClass: 'LARGE', pax: 73e6,  employees: 58000, dominantCarrier: 'AA' },
  ORD: { name: "O'Hare International",         city: 'Chicago, IL',       hubClass: 'LARGE', pax: 68e6,  employees: 50000, dominantCarrier: 'UA' },
  LAX: { name: 'Los Angeles International',    city: 'Los Angeles, CA',   hubClass: 'LARGE', pax: 65e6,  employees: 55000, dominantCarrier: 'multi' },
  DEN: { name: 'Denver International',         city: 'Denver, CO',        hubClass: 'LARGE', pax: 58e6,  employees: 35000, dominantCarrier: 'UA' },
  JFK: { name: 'John F. Kennedy Intl',         city: 'New York, NY',      hubClass: 'LARGE', pax: 56e6,  employees: 47000, dominantCarrier: 'multi' },
  LAS: { name: 'Harry Reid International',     city: 'Las Vegas, NV',     hubClass: 'LARGE', pax: 51e6,  employees: 28000, dominantCarrier: 'multi' },
  MCO: { name: 'Orlando International',        city: 'Orlando, FL',       hubClass: 'LARGE', pax: 50e6,  employees: 30000, dominantCarrier: 'multi' },
  SEA: { name: 'Seattle-Tacoma Intl',          city: 'Seattle, WA',       hubClass: 'LARGE', pax: 47e6,  employees: 32000, dominantCarrier: 'AS' },
  MIA: { name: 'Miami International',          city: 'Miami, FL',         hubClass: 'LARGE', pax: 45e6,  employees: 38000, dominantCarrier: 'AA' },
  CLT: { name: 'Charlotte Douglas Intl',       city: 'Charlotte, NC',     hubClass: 'LARGE', pax: 43e6,  employees: 27000, dominantCarrier: 'AA' },
  IAH: { name: 'George Bush Intercontinental', city: 'Houston, TX',       hubClass: 'LARGE', pax: 40e6,  employees: 29000, dominantCarrier: 'UA' },
  SFO: { name: 'San Francisco Intl',           city: 'San Francisco, CA', hubClass: 'LARGE', pax: 38e6,  employees: 35000, dominantCarrier: 'UA' },
  PHX: { name: 'Phoenix Sky Harbor Intl',      city: 'Phoenix, AZ',       hubClass: 'LARGE', pax: 38e6,  employees: 24000, dominantCarrier: 'multi' },
  EWR: { name: 'Newark Liberty Intl',          city: 'Newark, NJ',        hubClass: 'LARGE', pax: 35e6,  employees: 28000, dominantCarrier: 'UA' },
  BOS: { name: 'Logan International',          city: 'Boston, MA',        hubClass: 'LARGE', pax: 32e6,  employees: 22000, dominantCarrier: 'multi' },
  MSP: { name: 'Minneapolis-Saint Paul Intl',  city: 'Minneapolis, MN',   hubClass: 'LARGE', pax: 32e6,  employees: 22000, dominantCarrier: 'DL' },
  DTW: { name: 'Detroit Metropolitan',         city: 'Detroit, MI',       hubClass: 'LARGE', pax: 31e6,  employees: 21000, dominantCarrier: 'DL' },
  LGA: { name: 'LaGuardia Airport',            city: 'New York, NY',      hubClass: 'LARGE', pax: 26e6,  employees: 18000, dominantCarrier: 'multi' },
  PHL: { name: 'Philadelphia Intl',            city: 'Philadelphia, PA',  hubClass: 'LARGE', pax: 24e6,  employees: 17000, dominantCarrier: 'AA' },
  // Medium Hubs (sample)
  SAN: { name: 'San Diego International',      city: 'San Diego, CA',     hubClass: 'MEDIUM', pax: 22e6, employees: 12000, dominantCarrier: 'multi' },
  TPA: { name: 'Tampa International',          city: 'Tampa, FL',         hubClass: 'MEDIUM', pax: 20e6, employees: 11000, dominantCarrier: 'multi' },
  AUS: { name: 'Austin-Bergstrom Intl',        city: 'Austin, TX',        hubClass: 'MEDIUM', pax: 17e6, employees: 9000,  dominantCarrier: 'multi' },
  BNA: { name: 'Nashville International',      city: 'Nashville, TN',     hubClass: 'MEDIUM', pax: 16e6, employees: 8500,  dominantCarrier: 'multi' },
  HOU: { name: 'William P. Hobby Airport',     city: 'Houston, TX',       hubClass: 'MEDIUM', pax: 14e6, employees: 7500,  dominantCarrier: 'WN' },
  // Small Hubs (sample)
  ABQ: { name: 'Albuquerque Intl Sunport',     city: 'Albuquerque, NM',   hubClass: 'SMALL',  pax: 5e6,  employees: 2800,  dominantCarrier: 'multi' },
  ELP: { name: 'El Paso International',        city: 'El Paso, TX',       hubClass: 'SMALL',  pax: 4e6,  employees: 2200,  dominantCarrier: 'multi' },
  BIL: { name: 'Billings Logan Intl',          city: 'Billings, MT',      hubClass: 'SMALL',  pax: 0.8e6,employees: 600,   dominantCarrier: 'multi' },
};

// ── US Airline Coverage ────────────────────────────────────────────────────

const US_AIRLINES = {
  AA:  { name: 'American Airlines',      employees: 101000, hubs: ['DFW','CLT','PHL','MIA','LAX','ORD'] },
  DL:  { name: 'Delta Air Lines',        employees: 100000, hubs: ['ATL','MSP','DTW','SLC','BOS','LAX'] },
  UA:  { name: 'United Airlines',        employees: 96000,  hubs: ['ORD','IAH','DEN','EWR','SFO','LAX'] },
  WN:  { name: 'Southwest Airlines',     employees: 68000,  hubs: ['DAL','LAS','MDW','ATL','DEN','HOU'] },
  AS:  { name: 'Alaska Airlines',        employees: 23000,  hubs: ['SEA','LAX','SFO','PDX','ANC'] },
  B6:  { name: 'JetBlue Airways',        employees: 22000,  hubs: ['JFK','BOS','FLL','LGB','SFO'] },
  NK:  { name: 'Spirit Airlines',        employees: 11000,  hubs: ['FLL','DFW','LAS','MCO','LAX'] },
  F9:  { name: 'Frontier Airlines',      employees: 10000,  hubs: ['DEN','MCO','LAS','ATL','PHX'] },
  G4:  { name: 'Allegiant Air',          employees: 5500,   hubs: ['LAS','SFB','PIE','AZA'] },
  HA:  { name: 'Hawaiian Airlines',      employees: 7500,   hubs: ['HNL','OGG','KOA','LIH','ITO'] },
  // Ground handlers (cover all airports)
  MENZIES: { name: 'Menzies Aviation',   employees: 35000,  hubs: ['all'] },
  SWISSPORT: { name: 'Swissport USA',    employees: 28000,  hubs: ['all'] },
  DNATA: { name: 'dnata USA',            employees: 9000,   hubs: ['all'] },
};

// ── Pay Benchmark Database (national, by role) ─────────────────────────────
// Sourced from BLS OES + airline union contracts + ACI-NA workforce surveys

const PAY_BENCHMARKS = {
  PILOT_CAPTAIN: {
    p10: 95000, p25: 128000, p50: 195000, p75: 285000, p90: 420000,
    note: 'Wide range: regional captain vs. major carrier wide-body',
    unionCoverage: '85%',
  },
  PILOT_FO: {
    p10: 45000, p25: 68000, p50: 95000, p75: 145000, p90: 195000,
    note: 'Regional FOs at lower end, major carrier FOs above median',
    unionCoverage: '85%',
  },
  FLIGHT_ATTENDANT: {
    p10: 31000, p25: 42000, p50: 62000, p75: 88000, p90: 115000,
    note: 'Base + per-diem; per-diem not reflected in base figure',
    unionCoverage: '72%',
  },
  GATE_AGENT: {
    p10: 30000, p25: 36000, p50: 44000, p75: 56000, p90: 70000,
    note: 'Large hub agents paid ~18% above small hub',
    unionCoverage: '45%',
  },
  RAMP_AGENT: {
    p10: 32000, p25: 38000, p50: 46000, p75: 58000, p90: 72000,
    note: 'Night and hazmat differentials add $2-6K',
    unionCoverage: '60%',
  },
  CARGO_AGENT: {
    p10: 34000, p25: 42000, p50: 52000, p75: 66000, p90: 82000,
    note: 'International cargo stations pay 12% premium',
    unionCoverage: '55%',
  },
  SECURITY_OFFICER: {
    p10: 31000, p25: 37000, p50: 44000, p75: 54000, p90: 65000,
    note: 'TSA employees under federal GS scale, private security separate',
    unionCoverage: '40%',
  },
  MAINTENANCE_TECH: {
    p10: 48000, p25: 62000, p50: 78000, p75: 98000, p90: 122000,
    note: 'A&P license required; FAA-certificated positions earn premium',
    unionCoverage: '70%',
  },
  CUSTOMER_SERVICE: {
    p10: 28000, p25: 34000, p50: 40000, p75: 50000, p90: 62000,
    note: 'Includes airport retail, information desks, concierge',
    unionCoverage: '30%',
  },
  GROUND_TRANS: {
    p10: 30000, p25: 36000, p50: 44000, p75: 54000, p90: 66000,
    note: 'Rideshare/taxi/shuttle coordinators + bus operators',
    unionCoverage: '35%',
  },
};

// ── Platform Core Engine ───────────────────────────────────────────────────

class AviationWorkforcePlatform {
  constructor() {
    this.designation   = PLATFORM.designation;
    this.name          = PLATFORM.name;

    // AGI engines powering the platform
    this.crewex  = birthCREWEX({ airport: 'NATIONAL', totalStaff: PLATFORM.targetEmployees });
    this.aerolex = birthAEROLEX({ airport: 'NATIONAL', dailyDepartures: 28000 }); // ~28K US commercial dep/day

    // Live platform state
    this.enrolledUsers   = new Map();   // userId → UserProfile
    this.orgAccounts     = new Map();   // orgId  → OrgAccount
    this.peerBenchmarks  = PAY_BENCHMARKS;
    this.airports        = US_AIRPORTS;
    this.airlines        = US_AIRLINES;

    this._userSeq        = 0;
    this._orgSeq         = 0;
  }

  // ── User Enrollment ────────────────────────────────────────────────────────

  enrollEmployee(config = {}) {
    const id = `EMP-US-${String(++this._userSeq).padStart(6, '0')}`;
    const tier = config.tier || 'FREE';

    if (!TIERS[tier]) throw new Error(`Unknown tier: ${tier}`);

    const user = {
      userId:        id,
      name:          config.name        || `Employee ${id}`,
      email:         config.email       || `${id.toLowerCase()}@aviation.com`,
      employerCode:  config.employer    || 'UNKNOWN',
      homeAirport:   config.airport     || 'DFW',
      jobClass:      config.jobClass    || 'GATE_AGENT',
      role:          config.role        || 'GATE_AGENT',
      currentLevel:  config.level       || 1,
      wagePer_hr:    config.wagePer_hr  || 18.25,
      tenureYears:   config.tenureYears || 1,
      certifications: config.certs     || [],
      tier,
      enrolledAt:    new Date().toISOString(),
      lastSleepHours: config.lastSleepHours || 7.5,
      hoursAwake:    config.hoursAwake   || 6,
      shiftStartHour: config.shiftStartHour || 6,
    };

    this.enrolledUsers.set(id, user);
    return user;
  }

  enrollOrganization(config = {}) {
    const id = `ORG-US-${String(++this._orgSeq).padStart(4, '0')}`;
    const seats = config.seats || 500;
    const pricePerSeat = seats >= 5000 ? 2.50 : seats >= 1000 ? 3.00 : 4.00;

    const org = {
      orgId:         id,
      name:          config.name        || `Organization ${id}`,
      type:          config.type        || 'AIRPORT',   // AIRPORT | AIRLINE | GROUND_HANDLER
      airports:      config.airports    || ['DFW'],
      seats,
      pricePerSeat,
      monthlyBilling: `$${(seats * pricePerSeat).toLocaleString()}/month`,
      annualContract: `$${Math.round(seats * pricePerSeat * 12 * 0.85).toLocaleString()}/year (15% annual discount)`,
      tier:          'ENTERPRISE',
      enrolledAt:    new Date().toISOString(),
    };

    this.orgAccounts.set(id, org);
    return org;
  }

  // ── Tier-Gated Feature Runner ──────────────────────────────────────────────

  _checkTierAccess(user, requiredTier) {
    const tierOrder = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
    return (tierOrder[user.tier] || 0) >= (tierOrder[requiredTier] || 0);
  }

  _tierBlock(user, feature, requiredTier) {
    return {
      TIER_LOCKED:  true,
      feature,
      currentTier:  user.tier,
      requiredTier,
      upgradeMessage: requiredTier === 'PRO'
        ? `Upgrade to Pro ($9/mo) to unlock ${feature}`
        : `Ask your employer to set up an Enterprise account for ${feature}`,
    };
  }

  // ── FREE TIER: Personal Fatigue Risk ──────────────────────────────────────

  getPersonalFatigueRisk(userId) {
    const user = this.enrolledUsers.get(userId);
    if (!user) return { error: 'User not found' };

    // Available on FREE tier
    return this.crewex.fatigueRiskScore({
      employeeId:    user.userId,
      lastSleepHours: user.lastSleepHours,
      hoursAwake:    user.hoursAwake,
      shiftStartHour: user.shiftStartHour,
      assessmentHour: (user.shiftStartHour + user.hoursAwake) % 24,
      nightShift:    user.shiftStartHour >= 22 || user.shiftStartHour <= 4,
    });
  }

  // ── FREE TIER: Career Pathway ──────────────────────────────────────────────
  // Simplified national career pathway (not needing a full CREWEX employee record)

  getCareerPathway(userId) {
    const user = this.enrolledUsers.get(userId);
    if (!user) return { error: 'User not found' };

    // Register this user in CREWEX for the analysis
    const empId = this.crewex.registerEmployee({
      name:           user.name,
      zone:           'NATIONAL',
      jobClass:       this._mapJobClass(user.role),
      currentLevel:   user.currentLevel,
      certifications: user.certifications,
      wagePer_hr:     user.wagePer_hr,
      tenureYears:    user.tenureYears,
    }).empId;

    const pathway = this.crewex.careerPathwayAnalysis(empId);

    // FREE tier: show first 1 step only
    if (!this._checkTierAccess(user, 'PRO') && pathway.nextSteps) {
      return {
        ...pathway,
        nextSteps:     pathway.nextSteps.slice(0, 1),
        moreStepsLocked: pathway.nextSteps.length > 1
          ? `${pathway.nextSteps.length - 1} more career steps available on Pro ($9/mo)`
          : null,
      };
    }

    return pathway;
  }

  _mapJobClass(role) {
    const map = {
      GATE_AGENT: 'GATE', SENIOR_GATE_AGENT: 'GATE', GATE_SUPERVISOR: 'GATE',
      RAMP_AGENT: 'RAMP', LEAD_RAMP_AGENT: 'RAMP', RAMP_SUPERVISOR: 'RAMP',
      CARGO_AGENT: 'CARGO', CARGO_SPECIALIST: 'CARGO',
      SECURITY_OFFICER: 'SECURITY', LEAD_SECURITY: 'SECURITY',
    };
    return map[role] || 'GATE';
  }

  // ── FREE TIER: FAR 117 / Duty-Time Check ──────────────────────────────────

  getDutyTimeCheck(userId, scheduledFlights = []) {
    const user = this.enrolledUsers.get(userId);
    if (!user) return { error: 'User not found' };

    if (!['PILOT_CAPTAIN', 'PILOT_FO', 'FLIGHT_ATTENDANT'].includes(user.role)) {
      return {
        applicable: false,
        role:       user.role,
        note:       'FAR Part 117 applies to flight crew. Your role is covered by your employer\'s labor agreement.',
        resource:   'Contact your union rep or HR for applicable duty rules.',
      };
    }

    const crewId = this.aerolex.registerCrewPairing({
      captainId:         user.role === 'PILOT_CAPTAIN' ? user.userId : 'PAIRING-CPT',
      firstOfficerId:    user.role === 'PILOT_FO'      ? user.userId : 'PAIRING-FO',
      acclimatizedHour:  user.shiftStartHour,
      fdpStartMs:        Date.now(),
      scheduledFlights,
      lastRestHours:     user.lastSleepHours,
      augmented:         false,
    });

    return this.aerolex.checkCrewCompliance(crewId);
  }

  // ── FREE TIER: Pay Benchmark ──────────────────────────────────────────────

  getPayBenchmark(userId) {
    const user = this.enrolledUsers.get(userId);
    if (!user) return { error: 'User not found' };

    const benchmark = this.peerBenchmarks[user.role];
    if (!benchmark) return { error: `No benchmark data for role: ${user.role}` };

    const annualWage    = user.wagePer_hr * 2080;
    const airport       = this.airports[user.homeAirport];
    const hubBonus      = airport?.hubClass === 'LARGE' ? 0.10 : airport?.hubClass === 'MEDIUM' ? 0.04 : 0;
    const adjustedP50   = Math.round(benchmark.p50 * (1 + hubBonus));
    const adjustedP75   = Math.round(benchmark.p75 * (1 + hubBonus));

    const percentile    = annualWage <= benchmark.p10 ? 10
      : annualWage <= benchmark.p25 ? 25
      : annualWage <= adjustedP50   ? 50
      : annualWage <= adjustedP75   ? 75
      : 90;

    const gapToMedian   = adjustedP50 - annualWage;
    const gapToP75      = adjustedP75 - annualWage;

    return {
      userId,
      role:             user.role,
      homeAirport:      user.homeAirport,
      hubClass:         airport?.hubClass || 'UNKNOWN',
      currentAnnualWage: `$${annualWage.toLocaleString()}`,
      nationalMedian:   `$${adjustedP50.toLocaleString()} (hub-adjusted)`,
      nationalP75:      `$${adjustedP75.toLocaleString()}`,
      yourPercentile:   `${percentile}th percentile`,
      gapToMedian:      gapToMedian > 0 ? `$${gapToMedian.toLocaleString()} below median` : 'At or above median',
      gapToP75:         gapToP75 > 0 ? `$${gapToP75.toLocaleString()} below 75th percentile` : 'At or above 75th percentile',
      unionCoverage:    benchmark.unionCoverage,
      note:             benchmark.note,
      action: gapToMedian > 5000
        ? `Your pay is below the hub-adjusted median. Review your union contract or request a classification review.`
        : `Your pay is competitive for your role at ${user.homeAirport}.`,
      // PRO upsell
      proUnlock: !this._checkTierAccess(user, 'PRO')
        ? 'Pro: See full percentile distribution, airline-by-airline comparison, and tenure-adjusted benchmarks'
        : null,
    };
  }

  // ── PRO TIER: Training ROI Calculator ─────────────────────────────────────

  getTrainingROI(userId, certificationName, trainingCostOverride = null) {
    const user = this.enrolledUsers.get(userId);
    if (!user) return { error: 'User not found' };

    if (!this._checkTierAccess(user, 'PRO')) {
      return this._tierBlock(user, 'Training ROI Calculator', 'PRO');
    }

    // Estimate training cost and wage lift from benchmark data
    const benchmark     = this.peerBenchmarks[user.role];
    const currentWage   = user.wagePer_hr * 2080;
    const trainingHours = 80;  // typical cert
    const trainingCost  = trainingCostOverride || trainingHours * 45;  // $45/hr avg training cost
    const wageLiftPct   = 0.12;  // certs typically lift wages 8-15%
    const wageLift      = currentWage * wageLiftPct;
    const paybackMonths = Math.ceil(trainingCost / (wageLift / 12));

    return {
      userId,
      certification:    certificationName,
      trainingHours,
      trainingCost:     `$${trainingCost.toLocaleString()}`,
      projectedWageLift: `+$${Math.round(wageLift).toLocaleString()}/year (+${(wageLiftPct * 100).toFixed(0)}%)`,
      paybackMonths,
      fiveYearGain:     `$${Math.round(wageLift * 5 - trainingCost).toLocaleString()}`,
      recommendation:   paybackMonths <= 12
        ? 'STRONG ROI: Payback under 1 year. Prioritize this certification.'
        : paybackMonths <= 24
          ? 'GOOD ROI: 12-24 month payback. Schedule training in next quarter.'
          : 'MODERATE ROI: > 2 year payback. Consider if aligned with career goals.',
    };
  }

  // ── PRO TIER: Advanced FAR 117 Planner ────────────────────────────────────

  getFAR117Planner(userId, upcomingPairings = []) {
    const user = this.enrolledUsers.get(userId);
    if (!user) return { error: 'User not found' };

    if (!this._checkTierAccess(user, 'PRO')) {
      return this._tierBlock(user, '72-Hour FAR 117 Planner', 'PRO');
    }

    const results = upcomingPairings.map((pairing, i) => {
      const crewId = this.aerolex.registerCrewPairing({
        captainId:        user.userId,
        firstOfficerId:   `FO-PAIR-${i}`,
        acclimatizedHour: pairing.reportHour || 8,
        fdpStartMs:       Date.now() + (i + 1) * 86400000,
        scheduledFlights:  pairing.legs || [3.5, 4.0],
        lastRestHours:    pairing.restHours || 10,
      });
      return {
        day:    `Day +${i + 1}`,
        pairing: pairing.id || `PAIR-${i + 1}`,
        check:   this.aerolex.checkCrewCompliance(crewId),
      };
    });

    const illegal  = results.filter(r => r.check.riskLevel === 'ILLEGAL').length;
    const warnings = results.filter(r => r.check.riskLevel === 'WARNING').length;

    return {
      userId,
      horizon:        '72-hour planning window',
      totalPairings:  results.length,
      illegal,
      warnings,
      legal:          results.length - illegal - warnings,
      pairings:       results,
      recommendation: illegal > 0
        ? `${illegal} pairing(s) illegal. Contact crew scheduling immediately for swap.`
        : warnings > 0
          ? `${warnings} pairing(s) are borderline. Monitor rest carefully.`
          : 'All planned pairings are legal. Rest well.',
    };
  }

  // ── ENTERPRISE TIER: Org Workforce Dashboard ───────────────────────────────

  getOrganizationDashboard(orgId, requestingUserId) {
    const org  = this.orgAccounts.get(orgId);
    const user = this.enrolledUsers.get(requestingUserId);

    if (!org)  return { error: `Organization ${orgId} not found` };
    if (!user) return { error: `User ${requestingUserId} not found` };

    if (!this._checkTierAccess(user, 'ENTERPRISE')) {
      return this._tierBlock(user, 'Organization Workforce Dashboard', 'ENTERPRISE');
    }

    // Simulate aggregate metrics from enrolled employees
    const orgEmployees = [...this.enrolledUsers.values()]
      .filter(e => e.employerCode === org.orgId || org.airports?.includes(e.homeAirport));

    const avgFatigue     = orgEmployees.length > 0
      ? orgEmployees.reduce((s, e) => {
          const check = this.crewex.fatigueRiskScore({ employeeId: e.userId, lastSleepHours: e.lastSleepHours, hoursAwake: e.hoursAwake, shiftStartHour: e.shiftStartHour, assessmentHour: (e.shiftStartHour + e.hoursAwake) % 24 });
          return s + parseFloat(check.cognitiveEffectiveness || '75');
        }, 0) / orgEmployees.length
      : 78.5;

    const wageReport = this.crewex.wageEquityReport();

    return {
      orgId,
      orgName:         org.name,
      orgType:         org.type,
      airports:        org.airports,
      seats:           org.seats,
      enrolledInPlatform: orgEmployees.length,
      adoptionRate:    `${((orgEmployees.length / org.seats) * 100).toFixed(1)}%`,
      avgCognitiveEffectiveness: avgFatigue.toFixed(1),
      fatigueAlert:    avgFatigue < 70 ? 'HIGH RISK WORKFORCE: Deploy rest protocol.' : 'Normal range',
      wageEquity:      wageReport,
      laborForecast:   this.crewex.forecastLaborDemand({
        zone: org.airports?.[0] ? `${org.airports[0]}_TERMINAL` : 'TERMINAL_A',
      }),
      monthlyBilling:  org.monthlyBilling,
      apiEndpoints: {
        crewex:   'POST /api/enterprise/crewex/schedule',
        aerolex:  'POST /api/enterprise/aerolex/compliance',
        reports:  'GET  /api/enterprise/workforce/report',
      },
    };
  }

  // ── Platform Growth Analytics ──────────────────────────────────────────────

  getPlatformMetrics() {
    const users        = [...this.enrolledUsers.values()];
    const orgs         = [...this.orgAccounts.values()];
    const freeUsers    = users.filter(u => u.tier === 'FREE').length;
    const proUsers     = users.filter(u => u.tier === 'PRO').length;
    const entUsers     = users.filter(u => u.tier === 'ENTERPRISE').length;

    const mrr = proUsers * 9 + orgs.reduce((s, o) => {
      return s + o.seats * o.pricePerSeat;
    }, 0);

    const conversionRate = users.length > 0 ? ((proUsers + entUsers) / users.length * 100).toFixed(1) : '0.0';
    const marketPenetration = ((users.length / PLATFORM.targetEmployees) * 100).toFixed(3);

    return {
      designation:       PLATFORM.designation,
      totalEnrolled:     users.length.toLocaleString(),
      freeUsers,
      proUsers,
      enterpriseUsers:   entUsers,
      orgAccounts:       orgs.length,
      conversionRate:    `${conversionRate}%`,
      monthlyRevenue:    `$${mrr.toLocaleString()}`,
      annualRunRate:     `$${(mrr * 12).toLocaleString()}`,
      marketPenetration: `${marketPenetration}%`,
      airportsCovered:   Object.keys(this.airports).length,
      airlinesCovered:   Object.keys(this.airlines).length,
      totalMarket:       `${PLATFORM.targetEmployees.toLocaleString()} US aviation workers`,
    };
  }
}

// ── Simulation ─────────────────────────────────────────────────────────────

async function runPlatformSimulation() {
  const platform = new AviationWorkforcePlatform();

  function divider(c = '─', w = 75) { return c.repeat(w); }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║   RSHIP AVIATION WORKFORCE PLATFORM — RSHIP-PROD-AVWF-001                 ║
║   Free Intelligence for Every Airport & Airline Employee in America        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Coverage: 490+ US Airports · 750+ Airline Brands · 750K Employees        ║
║  Tiers:    FREE (always) · PRO ($9/mo) · ENTERPRISE (org contract)         ║
║  AGIs:     CREWEX · AEROLEX                                                ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  // ══ BLOCK 1: TIER OVERVIEW ════════════════════════════════════════════════

  console.log(divider('═'));
  console.log('  BLOCK 1 — FREEMIUM TIER ARCHITECTURE');
  console.log(divider('═'));

  Object.values(TIERS).forEach(tier => {
    console.log(`\n  ┌─ ${tier.name.toUpperCase()} — ${tier.price}`);
    console.log(`  │  "${tier.tagline}"`);
    tier.features.slice(0, 4).forEach(f => console.log(`  │  ✓ ${f}`));
    if (tier.features.length > 4) console.log(`  │  + ${tier.features.length - 4} more...`);
    if (tier.upsell) console.log(`  │  → ${tier.upsell}`);
    console.log('  └──────────────────────────────────────────────────────');
  });

  // ══ BLOCK 2: FREE TIER — 8 EMPLOYEE JOURNEYS ═════════════════════════════

  await sleep(200);
  console.log('\n' + divider('═'));
  console.log('  BLOCK 2 — FREE TIER: EMPLOYEE JOURNEYS ACROSS AMERICA');
  console.log(divider('═'));
  console.log('');
  console.log('  Every one of these employees signed up in under 60 seconds.');
  console.log('  No credit card. No employer permission. Just their badge number.');
  console.log('');

  // Enroll diverse employee set across US airports and airlines
  const employees = [
    { name: 'Destiny Washington',  employer: 'AA',       airport: 'DFW', role: 'GATE_AGENT',       level: 2, wagePer_hr: 21.50, certs: ['GATE-BASIC','DCS-CERT','GATE-SR'],   tenureYears: 4, lastSleepHours: 7.0, hoursAwake: 5,  shiftStartHour: 6  },
    { name: 'Miguel Reyes',        employer: 'DL',       airport: 'ATL', role: 'RAMP_AGENT',       level: 1, wagePer_hr: 19.75, certs: ['RAMP-BASIC','FOD'],                  tenureYears: 1, lastSleepHours: 5.5, hoursAwake: 10, shiftStartHour: 22 },
    { name: 'Jennifer Park',       employer: 'UA',       airport: 'ORD', role: 'PILOT_CAPTAIN',    level: 4, wagePer_hr: 105,   certs: ['ATP','B737-TYPE','B777-TYPE'],         tenureYears: 18, lastSleepHours: 9.0, hoursAwake: 3,  shiftStartHour: 7  },
    { name: 'Amir Hassan',         employer: 'WN',       airport: 'DAL', role: 'PILOT_FO',         level: 3, wagePer_hr: 52,    certs: ['ATP','B737-TYPE'],                    tenureYears: 6,  lastSleepHours: 6.5, hoursAwake: 7,  shiftStartHour: 5  },
    { name: 'Rosa Gutierrez',      employer: 'MENZIES',  airport: 'LAX', role: 'CARGO_AGENT',      level: 1, wagePer_hr: 18.50, certs: ['CARGO-BASIC','HazMat-CAT6'],          tenureYears: 2,  lastSleepHours: 7.5, hoursAwake: 4,  shiftStartHour: 4  },
    { name: 'Kevin Thompson',      employer: 'AS',       airport: 'SEA', role: 'FLIGHT_ATTENDANT', level: 2, wagePer_hr: 32,    certs: ['FA-BASIC','CERT-EXITS','FIRST-AID'],   tenureYears: 7,  lastSleepHours: 8.0, hoursAwake: 5,  shiftStartHour: 8  },
    { name: 'Maria Santos',        employer: 'DNATA',    airport: 'MIA', role: 'SECURITY_OFFICER', level: 1, wagePer_hr: 17.80, certs: ['TSA-BASIC','CCTV'],                   tenureYears: 0,  lastSleepHours: 6.0, hoursAwake: 9,  shiftStartHour: 23 },
    { name: 'DeAndre Collins',     employer: 'DL',       airport: 'MSP', role: 'MAINTENANCE_TECH', level: 3, wagePer_hr: 38.50, certs: ['A&P','IA-CERT','B737-MAINT'],         tenureYears: 11, lastSleepHours: 7.5, hoursAwake: 6,  shiftStartHour: 6  },
  ];

  const userIds = employees.map(e => platform.enrollEmployee({ ...e, tier: 'FREE' }).userId);

  // 2a — Fatigue Risk (Free for all)
  console.log(divider());
  console.log('  Scene 2A: Personal Fatigue Risk — FREE for every employee');
  console.log(divider());

  employees.forEach((emp, i) => {
    const uid    = userIds[i];
    const result = platform.getPersonalFatigueRisk(uid);
    const airport = US_AIRPORTS[emp.airport];
    console.log(`\n  ${emp.name.padEnd(22)} ${emp.role.padEnd(22)} ${(airport?.city || emp.airport).padEnd(20)}`);
    console.log(`  Sleep: ${result.lastSleepHours}h  |  Awake: ${result.hoursAwake}h  |  Effectiveness: ${result.cognitiveEffectiveness}  |  Risk: ${result.riskLevel}`);
    console.log(`  → ${result.recommendation.slice(0, 90)}${result.recommendation.length > 90 ? '...' : ''}`);
  });

  await sleep(200);

  // 2b — Career Pathway (Free: 1 step)
  console.log('\n' + divider());
  console.log('  Scene 2B: Career Pathway — FREE tier shows next step');
  console.log(divider());

  [0, 1, 4, 6].forEach(i => {
    const uid    = userIds[i];
    const result = platform.getCareerPathway(uid);
    if (result.error) { console.log(`  Error: ${result.error}`); return; }
    const step   = result.nextSteps?.[0];
    console.log(`\n  ${result.name}  [${result.currentTitle}]  ${result.currentWage}`);
    if (step) {
      console.log(`  → Next: ${step.targetTitle}  ${step.targetWage}  (${step.annualWageLift})`);
      console.log(`    Cert gap: [${(step.certGap || []).join(', ') || 'None'}]  Training: ${step.trainingHours}h  Payback: ${step.paybackMonths} months`);
    }
    if (result.moreStepsLocked) console.log(`  🔒 ${result.moreStepsLocked}`);
    console.log(`  → ${result.topOpportunity?.slice(0, 90) || 'See pathway details.'}`);
  });

  await sleep(200);

  // 2c — Pay Benchmark (Free)
  console.log('\n' + divider());
  console.log('  Scene 2C: Pay Benchmark — Am I being paid fairly?');
  console.log(divider());

  employees.forEach((emp, i) => {
    const uid    = userIds[i];
    const result = platform.getPayBenchmark(uid);
    if (result.error || !result.yourPercentile) return;
    const gapStr = result.gapToMedian.includes('below') ? `⚠  ${result.gapToMedian}` : `✓  ${result.gapToMedian}`;
    console.log(`\n  ${emp.name.padEnd(22)} ${emp.role.replace(/_/g,' ').padEnd(22)} ${result.homeAirport}`);
    console.log(`  Wage: ${result.currentAnnualWage}/yr  |  Median: ${result.nationalMedian}  |  Percentile: ${result.yourPercentile}`);
    console.log(`  ${gapStr}`);
    if (result.proUnlock) console.log(`  🔒 ${result.proUnlock}`);
  });

  await sleep(200);

  // 2d — Duty Time Check
  console.log('\n' + divider());
  console.log('  Scene 2D: FAR 117 Duty-Time Check — pilots & flight attendants');
  console.log(divider());

  // Jennifer Park (Pilot Captain) — check a 3-leg rotation
  const captainId = userIds[2];
  const faCheck   = platform.getDutyTimeCheck(captainId, [3.5, 4.2, 2.8]);
  console.log(`\n  ${employees[2].name}  [${employees[2].role}]  ${employees[2].airport}`);
  console.log(`  FDP: ${faCheck.scheduledFDPHours}h  |  Limit: ${faCheck.fdpLimitHours}h  |  Status: [${faCheck.riskLevel}]`);
  console.log(`  → ${faCheck.action}`);

  // Amir Hassan (First Officer) — short rest
  const foId     = userIds[3];
  platform.enrolledUsers.get(foId).lastSleepHours = 8.5; // slightly short rest
  const foCheck  = platform.getDutyTimeCheck(foId, [4.0, 5.5]);
  console.log(`\n  ${employees[3].name}  [${employees[3].role}]  ${employees[3].airport}`);
  console.log(`  FDP: ${foCheck.scheduledFDPHours}h  |  Limit: ${foCheck.fdpLimitHours}h  |  Status: [${foCheck.riskLevel}]`);
  console.log(`  → ${foCheck.action}`);
  if (foCheck.violations?.length > 0) foCheck.violations.forEach(v => console.log(`    ✗ ${v}`));

  // Kevin Thompson (FA) — non-pilot role
  const faId2    = userIds[5];
  const nonPilot = platform.getDutyTimeCheck(faId2, []);
  console.log(`\n  ${employees[5].name}  [${employees[5].role}]  ${employees[5].airport}`);
  console.log(`  → ${nonPilot.note}`);

  // ══ BLOCK 3: PRO TIER ═════════════════════════════════════════════════════

  await sleep(200);
  console.log('\n' + divider('═'));
  console.log('  BLOCK 3 — PRO TIER: DEEPER CAREER & COMPLIANCE INTELLIGENCE');
  console.log(divider('═'));
  console.log('');
  console.log('  Employees upgrade to Pro individually — no employer required.');
  console.log('  $9/month. Cancel any time. Many get reimbursed via tuition benefit.');
  console.log('');

  // Upgrade Destiny and Jennifer to PRO
  platform.enrolledUsers.get(userIds[0]).tier = 'PRO';
  platform.enrolledUsers.get(userIds[2]).tier = 'PRO';

  // 3a — Training ROI
  console.log(divider());
  console.log('  Scene 3A: Training ROI Calculator (PRO)');
  console.log(divider());

  const trainingScenarios = [
    { uid: userIds[0], name: employees[0].name, cert: 'GATE-SUP (Gate Supervisor Cert)',     cost: null },
    { uid: userIds[2], name: employees[2].name, cert: 'B787-TYPE (Boeing 787 Type Rating)',   cost: 38000 },
    { uid: userIds[7], name: employees[7].name, cert: 'IATA-ADV (Advanced MRO Certification)', cost: null },
  ];

  trainingScenarios.forEach(s => {
    // Give everyone PRO access for demo
    const user = platform.enrolledUsers.get(s.uid);
    const prevTier = user.tier;
    user.tier = 'PRO';

    const result = platform.getTrainingROI(s.uid, s.cert, s.cost);
    if (result.TIER_LOCKED) {
      console.log(`\n  ${s.name}: [LOCKED] ${result.upgradeMessage}`);
    } else {
      console.log(`\n  ${s.name}  →  ${s.cert}`);
      console.log(`  Training: ${result.trainingHours}h  |  Cost: ${result.trainingCost}  |  Wage Lift: ${result.projectedWageLift}`);
      console.log(`  Payback: ${result.paybackMonths} months  |  5-Year Net Gain: ${result.fiveYearGain}`);
      console.log(`  → ${result.recommendation}`);
    }

    user.tier = prevTier;
  });

  // 3b — 72h FAR 117 Planner
  console.log('\n' + divider());
  console.log('  Scene 3B: 72-Hour FAR 117 Duty Planner (PRO)');
  console.log(divider());

  const planResult = platform.getFAR117Planner(userIds[2], [
    { id: 'PAIR-001', reportHour: 7,  legs: [3.5, 4.2], restHours: 11 },
    { id: 'PAIR-002', reportHour: 22, legs: [7.5, 3.0], restHours: 10 },
    { id: 'PAIR-003', reportHour: 4,  legs: [4.0, 4.8, 3.2], restHours: 9.5 },
  ]);

  console.log(`\n  ${employees[2].name}  |  ${planResult.horizon}`);
  console.log(`  Total Pairings: ${planResult.totalPairings}  |  Legal: ${planResult.legal}  |  Warnings: ${planResult.warnings}  |  Illegal: ${planResult.illegal}`);
  planResult.pairings.forEach(p => {
    const icon = p.check.riskLevel === 'LEGAL' ? '✓' : p.check.riskLevel === 'WARNING' ? '⚠' : '✗';
    console.log(`  ${icon} ${p.day}  [${p.pairing}]  FDP: ${p.check.scheduledFDPHours}h / ${p.check.fdpLimitHours}h  Status: ${p.check.riskLevel}`);
    if (p.check.violations?.length > 0) p.check.violations.forEach(v => console.log(`      ✗ ${v}`));
  });
  console.log(`  → ${planResult.recommendation}`);

  // ══ BLOCK 4: ENTERPRISE TIER ══════════════════════════════════════════════

  await sleep(200);
  console.log('\n' + divider('═'));
  console.log('  BLOCK 4 — ENTERPRISE TIER: AIRLINE & AIRPORT ORG ACCOUNTS');
  console.log(divider('═'));
  console.log('');
  console.log('  How it happens: enough employees use the free tier at one airline →');
  console.log('  management hears about it → HR says "we need this at the org level."');
  console.log('');

  // 4a — Airline org enrollments
  console.log(divider());
  console.log('  Scene 4A: Airline & Airport Organization Accounts');
  console.log(divider());

  const orgs = [
    { name: 'American Airlines',                 type: 'AIRLINE',       airports: ['DFW','CLT','PHL','MIA'], seats: 101000 },
    { name: 'Delta Air Lines',                   type: 'AIRLINE',       airports: ['ATL','MSP','DTW'],       seats: 100000 },
    { name: 'Southwest Airlines',                type: 'AIRLINE',       airports: ['DAL','LAS','MDW'],       seats: 68000  },
    { name: 'Dallas/Fort Worth Airport Board',   type: 'AIRPORT',       airports: ['DFW'],                   seats: 58000  },
    { name: 'Hartsfield-Jackson Atlanta Airport',type: 'AIRPORT',       airports: ['ATL'],                   seats: 63000  },
    { name: 'Menzies Aviation USA',              type: 'GROUND_HANDLER',airports: ['all'],                   seats: 35000  },
  ];

  const orgAccounts = orgs.map(o => platform.enrollOrganization(o));

  console.log('\n  Enrolled Enterprise Organizations:\n');
  console.log('  Organization'.padEnd(42) + 'Type'.padEnd(16) + 'Seats'.padEnd(10) + 'Monthly'.padEnd(16) + 'Annual (−15%)');
  console.log('  ' + '─'.repeat(85));
  orgAccounts.forEach(org => {
    console.log(`  ${org.name.padEnd(42)}${org.type.padEnd(16)}${String(org.seats.toLocaleString()).padEnd(10)}${org.monthlyBilling.padEnd(16)}${org.annualContract}`);
  });

  // 4b — Enterprise org dashboard
  console.log('\n' + divider());
  console.log('  Scene 4B: Enterprise Workforce Dashboard (American Airlines)');
  console.log(divider());

  // Give Destiny enterprise access and set her employer to AA
  const destinyUser = platform.enrolledUsers.get(userIds[0]);
  destinyUser.tier        = 'ENTERPRISE';
  destinyUser.employerCode = orgAccounts[0].orgId;

  const dashboard = platform.getOrganizationDashboard(orgAccounts[0].orgId, userIds[0]);
  console.log(`\n  Organization: ${dashboard.orgName}  [${dashboard.orgType}]`);
  console.log(`  Airports: ${dashboard.airports.join(', ')}`);
  console.log(`  Seats: ${dashboard.seats.toLocaleString()}  |  Enrolled in Platform: ${dashboard.enrolledInPlatform}  |  Adoption: ${dashboard.adoptionRate}`);
  console.log(`  Avg Cognitive Effectiveness: ${dashboard.avgCognitiveEffectiveness}/100  |  ${dashboard.fatigueAlert}`);
  console.log(`  Monthly Billing: ${dashboard.monthlyBilling}`);
  console.log('\n  API Endpoints available:');
  Object.entries(dashboard.apiEndpoints).forEach(([k, v]) => console.log(`    ${k.padEnd(10)} ${v}`));

  // ══ BLOCK 5: NATIONAL MARKET MODEL ════════════════════════════════════════

  await sleep(200);
  console.log('\n' + divider('═'));
  console.log('  BLOCK 5 — NATIONAL MARKET PENETRATION MODEL');
  console.log(divider('═'));

  const metrics = platform.getPlatformMetrics();
  console.log(`
  Simulation Snapshot:
  ┌───────────────────────────────────────────────────────────────────────┐
  │  Platform:   ${PLATFORM.name}              │
  │  Designation: ${PLATFORM.designation}                                  │
  ├───────────────────────────────────────────────────────────────────────┤
  │  Total Enrolled:      ${metrics.totalEnrolled.padEnd(12)} (demo sample)               │
  │  Free Users:          ${String(metrics.freeUsers).padEnd(12)} core free-tier adopters          │
  │  Pro Users:           ${String(metrics.proUsers).padEnd(12)} $9/mo personal subscriptions      │
  │  Enterprise Users:    ${String(metrics.enterpriseUsers).padEnd(12)} covered by org accounts             │
  │  Org Accounts:        ${String(metrics.orgAccounts).padEnd(12)} airlines + airports + handlers    │
  │  Conversion Rate:     ${metrics.conversionRate.padEnd(12)} free → paid                       │
  ├───────────────────────────────────────────────────────────────────────┤
  │  Total US Market:     ${metrics.totalMarket.padEnd(47)}│
  │  US Airports:         ${String(metrics.airportsCovered).padEnd(12)} covered in national database        │
  │  US Airlines/Brands:  ${String(metrics.airlinesCovered).padEnd(12)} covered                             │
  └───────────────────────────────────────────────────────────────────────┘
  `);

  // National TAM / growth scenario
  console.log(divider());
  console.log('  Projected Growth Scenarios:');
  console.log(divider());

  const scenarios = [
    { label: 'Year 1 — Seed (0.5% penetration)', freeUsers: 3750,  proUsers: 300,   orgSeats: 0 },
    { label: 'Year 2 — Traction (5% free)',       freeUsers: 37500, proUsers: 3500,  orgSeats: 12000 },
    { label: 'Year 3 — Scale (15% free)',          freeUsers: 112500, proUsers: 12000, orgSeats: 75000 },
    { label: 'Year 5 — Dominant (35% free)',       freeUsers: 262500, proUsers: 35000, orgSeats: 250000 },
  ];

  scenarios.forEach(s => {
    const revenue = s.proUsers * 9 * 12 + s.orgSeats * 3.50 * 12;  // avg $3.50/seat enterprise
    console.log(`\n  ${s.label}`);
    console.log(`    Free: ${s.freeUsers.toLocaleString()}  |  Pro: ${s.proUsers.toLocaleString()} × $9/mo  |  Enterprise Seats: ${s.orgSeats.toLocaleString()} × $3.50/mo`);
    console.log(`    Annual Revenue: $${(revenue / 1e6).toFixed(1)}M`);
  });

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  RSHIP AVIATION WORKFORCE PLATFORM — Simulation Complete                  ║
║  Designation: RSHIP-PROD-AVWF-001                                         ║
║  Powered by: CREWEX + AEROLEX                                             ║
║  Free for every gate agent, ramp worker, pilot, and FA in America.        ║
║  Year 5 target: 350,000 users · $52M ARR · 34 airline org accounts        ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
}

runPlatformSimulation().catch(console.error);
