/**
 * PRODUCTION APPLICATION: RSHIP ENTERPRISE — DFW AIRLINES, TOURISM & WORKFORCE
 *
 * Designation: RSHIP-PROD-DFW-AERO-001
 * AGI Systems: AEROLEX + VISITEX + CREWEX
 * Industry: Airport Intelligence — Airline Operations, Visitor Experience, Workforce
 * Scale: Dallas/Fort Worth International Airport
 *        450+ daily departures · 14 airlines · 73M passengers/year
 *        58,000+ direct employees · 2.4M loyalty members
 *
 * Problem Statement:
 * DFW's three most underserved constituencies — airlines, passengers, and employees
 * — all lack dedicated intelligence systems. Airlines manage gate turnarounds on
 * paper clipboards, losing 4-8 minutes per turn that compound into $120M+ in annual
 * delay costs. 73 million passengers navigate five terminals with no personalization,
 * missing concessions they'd love, failing accessibility needs, and leaving loyalty
 * value unrealized. 58,000 employees are scheduled on spreadsheets, fatigued without
 * anyone knowing, and advancing careers through informal mentorship instead of
 * structured skill gap analysis.
 *
 * RSHIP Solution:
 * Three sovereign AGI systems that together cover the full DFW stakeholder map:
 * AEROLEX brings Breguet fuel analytics, FAR 117 crew compliance, Markov delay
 * prediction, and gate turnaround CPM to every airline operations center at DFW.
 * VISITEX gives every passenger a personalized terminal journey — wayfinding,
 * concession recommendations, accessibility routing, and loyalty CLV recovery.
 * CREWEX makes every one of DFW's 58,000 employees visible — shift coverage,
 * fatigue risk, career pathways, and wage equity — turning the workforce from a
 * cost variable into a strategic intelligence asset.
 *
 * Who uses this:
 * - American Airlines DFW Hub Ops Center — AEROLEX turnaround + GDP + delay
 * - Southwest Airlines Terminal E — AEROLEX slots + CREWEX scheduling
 * - DFW Airport Guest Services — VISITEX wayfinding + accessibility
 * - DFW Concessions Management — VISITEX recommendations + NPS analytics
 * - DFW Human Resources & Workforce Development — CREWEX scheduling + equity
 * - Airport Employee Unions — CREWEX wage equity + fatigue compliance
 *
 * Run: node production-apps/rship-dfw-airlines-tourism.js
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthAEROLEX } from '../sdk/aerolex-agi/aerolex-agi.js';
import { birthVISITEX } from '../sdk/visitex-agi/visitex-agi.js';
import { birthCREWEX  } from '../sdk/crewex-agi/crewex-agi.js';
import { PHI, PHI_INV } from '../rship-framework.js';

// ── DFW Aero Configuration ─────────────────────────────────────────────────

const DFW_AERO = {
  designation:       'RSHIP-PROD-DFW-AERO-001',
  airport:           'Dallas/Fort Worth International Airport',
  dailyDepartures:   450,
  annualPassengers:  73000000,
  directEmployees:   58000,
  loyaltyMembers:    2400000,
  airlines:          14,
  primaryHub:        'American Airlines',
};

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║   RSHIP ENTERPRISE — DFW AIRLINES, TOURISM & WORKFORCE INTELLIGENCE       ║
║                   RSHIP-PROD-DFW-AERO-001                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Airport:     ${DFW_AERO.airport.padEnd(59)}║
║  Daily Deps:  ${DFW_AERO.dailyDepartures} ops/day  |  ${DFW_AERO.annualPassengers/1e6}M pax/yr  |  ${DFW_AERO.directEmployees.toLocaleString()} employees        ║
║  AGI Stack:   AEROLEX · VISITEX · CREWEX                                  ║
╚═══════════════════════════════════════════════════════════════════════════╝

  Initializing 3 Alpha AGI Systems...
`);

// ── AGI Initialization ─────────────────────────────────────────────────────

const aerolex = birthAEROLEX({ airport: 'DFW', primaryAirline: 'AA', dailyDepartures: 450 });
const visitex = birthVISITEX({ airport: 'DFW', annualPassengers: 73000000, loyaltyMembers: 2400000 });
const crewex  = birthCREWEX ({ airport: 'DFW', totalStaff: 58000, annualPayroll: 2800000000 });

console.log('  ✓ AEROLEX — Airline & Flight Operations Intelligence  born alive');
console.log('  ✓ VISITEX — Visitor & Tourist Experience Intelligence born alive');
console.log('  ✓ CREWEX  — Crew & Workforce Experience Intelligence  born alive');

// ── Simulation ─────────────────────────────────────────────────────────────

async function runAeroTourismSimulation() {
  function divider(c = '─', w = 75) { return c.repeat(w); }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ══ BLOCK 1: AEROLEX — AIRLINE OPERATIONS INTELLIGENCE ═══════════════════

  console.log('\n' + divider('═'));
  console.log('  BLOCK 1 — AIRLINE OPERATIONS INTELLIGENCE (AEROLEX)');
  console.log(divider('═'));
  console.log('');
  console.log('  Problem: Airlines lose 4-8 minutes per gate turn through invisible');
  console.log('  bottlenecks. A GDP can cost $3M+ in delay if sequenced poorly.');
  console.log('  Crew illegals discovered at briefing cause ground stops.');
  console.log('');

  // 1a — Gate Turnaround Critical-Path Analysis
  console.log(divider());
  console.log('  Scene 1A: Gate Turnaround Critical-Path Analysis');
  console.log(divider());

  const turns = [
    { aircraftType: 'B737-MAX8', terminal: 'A', airline: 'AA', shortTurn: false, staffVariance: 1.0, label: 'AA B737MAX Terminal A (nominal staffing)' },
    { aircraftType: 'B737-800',  terminal: 'E', airline: 'WN', shortTurn: true,  staffVariance: 1.0, label: 'WN B737 Terminal E (25-min quick turn)' },
    { aircraftType: 'A321neo',   terminal: 'D', airline: 'AA', shortTurn: false, staffVariance: 0.75, label: 'AA A321neo Terminal D (short-staffed)' },
  ];

  turns.forEach(t => {
    const result = aerolex.analyzeTurnaround(t);
    const riskBar = '█'.repeat(Math.round(parseFloat(result.delayRiskScore) * 15));
    console.log(`\n  ${t.label}`);
    console.log(`  Minimum Turn Time: ${result.minimumTurnMinutes} min  |  Delay Risk: ${result.delayRiskScore}  ${riskBar}`);
    console.log(`  Critical Path: ${result.criticalPathLabel}`);
    console.log(`  → ${result.recommendation}`);
    result.taskDetail
      .filter(td => td.critical)
      .forEach(td => console.log(`    ★ CRITICAL: ${td.label.padEnd(28)} ${td.effectiveMinutes} min`));
  });

  await sleep(200);

  // 1b — GDP Slot Scheduling
  console.log('\n' + divider());
  console.log('  Scene 1B: Ground Delay Program (GDP) Slot Scheduling');
  console.log(divider());
  console.log('  FAA issues GDP for KDFW — accepted rate: 18 dep/hr for next 3 hours');

  const departuresToSequence = [
    { flightId: 'AA-2847', airline: 'AA', destination: 'LAX', scheduledDep: Date.now() + 30 * 60000,  routeRevenue: 82000, connectingPax: 140, payload: 0.91 },
    { flightId: 'AA-1103', airline: 'AA', destination: 'JFK', scheduledDep: Date.now() + 45 * 60000,  routeRevenue: 95000, connectingPax: 95,  payload: 0.88 },
    { flightId: 'AA-3201', airline: 'AA', destination: 'MIA', scheduledDep: Date.now() + 20 * 60000,  routeRevenue: 71000, connectingPax: 82,  payload: 0.85 },
    { flightId: 'WN-1452', airline: 'WN', destination: 'MDW', scheduledDep: Date.now() + 15 * 60000,  routeRevenue: 38000, connectingPax: 0,   payload: 0.92 },
    { flightId: 'AA-4412', airline: 'AA', destination: 'LHR', scheduledDep: Date.now() + 60 * 60000,  routeRevenue: 180000, connectingPax: 220, payload: 0.94 },
    { flightId: 'DL-2211', airline: 'DL', destination: 'ATL', scheduledDep: Date.now() + 35 * 60000,  routeRevenue: 52000, connectingPax: 110, payload: 0.87 },
    { flightId: 'UA-3388', airline: 'UA', destination: 'ORD', scheduledDep: Date.now() + 55 * 60000,  routeRevenue: 61000, connectingPax: 75,  payload: 0.83 },
    { flightId: 'AA-5592', airline: 'AA', destination: 'BCN', scheduledDep: Date.now() + 70 * 60000,  routeRevenue: 155000, connectingPax: 180, payload: 0.90 },
  ];

  const gdp = aerolex.scheduleGDP(departuresToSequence, { acceptedRate: 18, durationHours: 3 });
  console.log(`\n  GDP Result: ${gdp.program}  |  Rate: ${gdp.acceptedRate}  |  Slots: ${gdp.slotsAssigned}`);
  console.log(`  Avg Delay: ${gdp.avgDelayMinutes} min  |  Total Delay Cost: ${gdp.totalDelayCost}`);
  console.log('');
  console.log('  EDCT Sequence (φ-priority ranked, highest value first):');
  gdp.slots.slice(0, 6).forEach((slot, i) => {
    console.log(`  ${String(i+1).padEnd(3)} ${slot.flightId.padEnd(10)} → ${slot.destination.padEnd(5)} EDCT: ${slot.edct.padEnd(8)} Delay: ${String(slot.delayMinutes + 'min').padEnd(7)} φ: ${slot.phi_priority}  Cost: ${slot.delayCost}`);
  });

  await sleep(200);

  // 1c — Fuel Efficiency Analytics
  console.log('\n' + divider());
  console.log('  Scene 1C: Breguet Fuel Efficiency Analytics');
  console.log(divider());

  const fuelRoutes = [
    { flightId: 'AA-2847', aircraftType: 'B737-MAX8', routeNm: 1240, windKts: 25,  actualFuelLbs: 23000, label: 'DFW→LAX (headwind)' },
    { flightId: 'AA-4412', aircraftType: 'B777-200',  routeNm: 4755, windKts: -30, actualFuelLbs: 132000, label: 'DFW→LHR (jet stream tailwind)' },
    { flightId: 'AA-1103', aircraftType: 'A321neo',   routeNm: 1389, windKts: 15,  actualFuelLbs: 29500, label: 'DFW→JFK (+15% over optimal)' },
    { flightId: 'WN-1452', aircraftType: 'B737-800',  routeNm: 802,  windKts: -10, actualFuelLbs: 17200, label: 'DFW→MDW (on target)' },
  ];

  fuelRoutes.forEach(route => {
    const result = aerolex.fuelEfficiencyAnalysis(route);
    const flagIcon = result.flag === 'FUEL_AUDIT' ? '⚠ ' : '✓ ';
    console.log(`\n  ${flagIcon}${route.label}`);
    console.log(`  Aircraft: ${route.aircraftType.padEnd(12)} Distance: ${result.routeNm.padEnd(10)} Wind: ${result.windCondition}`);
    console.log(`  Optimal Block Fuel: ${result.optimalBlockFuelLbs} lbs  |  Actual: ${result.actualBlockFuelLbs} lbs  |  Variance: ${result.variancePct}`);
    console.log(`  Annual Leakage: ${result.annualLeakage}`);
    console.log(`  → ${result.recommendation}`);
  });

  await sleep(200);

  // 1d — Crew Duty-Time Compliance
  console.log('\n' + divider());
  console.log('  Scene 1D: FAR Part 117 Crew Duty-Time Compliance');
  console.log(divider());

  const crewConfigs = [
    { captainId: 'CPT-Johnson', firstOfficerId: 'FO-Martinez', acclimatizedHour: 6, scheduledFlights: [3.5, 4.2, 2.8], lastRestHours: 11, label: 'AA DFW→LAX→SFO→DFW' },
    { captainId: 'CPT-Williams', firstOfficerId: 'FO-Chen',    acclimatizedHour: 22, scheduledFlights: [7.5, 3.2],        lastRestHours: 9.5, label: 'AA DFW→LHR (night departure)' },
    { captainId: 'CPT-Davis',   firstOfficerId: 'FO-Park',     acclimatizedHour: 3,  scheduledFlights: [4.0, 4.5, 3.8],   lastRestHours: 8.5, label: 'WN red-eye rotation (3AM report)' },
  ];

  crewConfigs.forEach(cfg => {
    const crewId = aerolex.registerCrewPairing(cfg);
    const result = aerolex.checkCrewCompliance(crewId);
    const icon   = result.riskLevel === 'LEGAL' ? '✓' : result.riskLevel === 'WARNING' ? '⚠' : '✗';
    console.log(`\n  ${icon} ${cfg.label}`);
    console.log(`  ${result.captainId} | ${result.firstOfficerId}  Report: ${result.reportHour}`);
    console.log(`  FDP: ${result.scheduledFDPHours}h  |  Limit: ${result.fdpLimitHours}h  |  Last Rest: ${result.lastRestHours}h  |  Block In: ${result.projectedBlockIn}`);
    console.log(`  Status: [${result.riskLevel}]  ${result.action}`);
    if (result.violations.length > 0) {
      result.violations.forEach(v => console.log(`    ✗ ${v}`));
    }
  });

  await sleep(200);

  // 1e — Markov Delay Prediction
  console.log('\n' + divider());
  console.log('  Scene 1E: Markov Cascading Delay Prediction');
  console.log(divider());

  const delayScenarios = [
    { flightId: 'AA-2847', airline: 'AA', destination: 'LAX', initialDelayMin: 38, rotations: 3 },
    { flightId: 'AA-4412', airline: 'AA', destination: 'LHR', initialDelayMin: 12, rotations: 2 },
    { flightId: 'WN-1452', airline: 'WN', destination: 'MDW', initialDelayMin: 55, rotations: 3 },
  ];

  const delayReport = aerolex.predictDelayPropagation(delayScenarios);
  console.log(`\n  Analyzing ${delayReport.flightsAnalyzed} flights  |  At-risk (OTP < 70%): ${delayReport.atRisk}`);
  delayReport.predictions.forEach(pred => {
    const otpBar = '█'.repeat(Math.round(parseFloat(pred.onTimeProbability) / 10));
    console.log(`\n  ${pred.flightId} → ${pred.destination}  Initial delay: ${pred.initialDelay}  [${pred.initialState}]`);
    console.log(`  On-Time Probability: ${pred.onTimeProbability}  ${otpBar}  Est. Delay Cost: ${pred.estimatedDelayCost}`);
    console.log(`  → ${pred.recommendation}`);
  });

  // ══ BLOCK 2: VISITEX — VISITOR EXPERIENCE INTELLIGENCE ═══════════════════

  await sleep(300);
  console.log('\n' + divider('═'));
  console.log('  BLOCK 2 — VISITOR & TOURIST EXPERIENCE INTELLIGENCE (VISITEX)');
  console.log(divider('═'));
  console.log('');
  console.log('  Problem: 73M passengers navigate DFW with no personalization.');
  console.log('  Accessibility requests take 15+ minutes. NPS lags by 90 days.');
  console.log('  $2.8B in loyalty CLV at risk from churn and lapsed members.');
  console.log('');

  // 2a — Dijkstra Wayfinding
  console.log(divider());
  console.log('  Scene 2A: Terminal Wayfinding — Dijkstra Shortest Path');
  console.log(divider());

  const routes = [
    { from: 'A-CHECKIN',  to: 'D-GATES', congestionMap: { 'SKYLINK-C': 2.1, 'C-SECURITY': 1.8 }, accessibility: false, label: 'Arriving at Terminal A → Departing from Terminal D (congested Skylink C)' },
    { from: 'E-SECURITY', to: 'D-GATES', congestionMap: {},                                         accessibility: false, label: 'Southwest check-in → International Terminal D' },
    { from: 'D-CUSTOMS',  to: 'B-GATES', congestionMap: {},                                         accessibility: true,  label: 'International arrival → Terminal B (wheelchair accessible)' },
  ];

  routes.forEach(r => {
    const result = visitex.routeVisitor(r);
    const accIcon = r.accessibility ? '♿ ' : '';
    console.log(`\n  ${accIcon}${r.label}`);
    console.log(`  Route: ${result.pathLabel}`);
    console.log(`  Travel Time: ${result.travelMinutes} min${result.congested ? '  [CONGESTION APPLIED]' : ''}`);
    console.log(`  → ${result.recommendation}`);
  });

  await sleep(200);

  // 2b — Personalized Concession Recommendations
  console.log('\n' + divider());
  console.log('  Scene 2B: Personalized Concession Recommendations');
  console.log(divider());

  const concessions = [
    { name: 'Morales Family Kitchen', category: 'F&B',    terminal: 'D', nearestGate: 'D38', avgCheck: 22, dietary: ['any'], premium: false },
    { name: 'Texas Land & Cattle',    category: 'F&B',    terminal: 'D', nearestGate: 'D40', avgCheck: 45, dietary: ['any'], premium: true  },
    { name: 'Aisha Fresh Juice Bar',  category: 'F&B',    terminal: 'C', nearestGate: 'C30', avgCheck: 14, dietary: ['vegan', 'gluten-free'], premium: false },
    { name: 'DFW Tech Accessories',   category: 'Retail', terminal: 'D', nearestGate: 'D32', avgCheck: 38, dietary: [],      premium: false },
    { name: 'Lone Star Gifts',        category: 'Retail', terminal: 'D', nearestGate: 'D35', avgCheck: 24, dietary: [],      premium: false },
    { name: 'Admirals Club Lounge',   category: 'Lounge', terminal: 'D', nearestGate: 'D30', avgCheck: 75, dietary: ['any'], premium: true  },
  ];

  const visitorProfiles = [
    { visitorType: 'BUSINESS_FIRST',  loyaltyTier: 'PLATINUM', dwellBudgetMin: 60, pastCategories: ['Lounge', 'F&B'], label: 'Platinum Business First' },
    { visitorType: 'LEISURE_FAMILY',  loyaltyTier: 'SILVER',   dwellBudgetMin: 90, pastCategories: ['Retail'],        label: 'Silver Leisure Family' },
    { visitorType: 'SOLO_BACKPACKER', loyaltyTier: 'BASIC',    dwellBudgetMin: 25, dietary: 'budget',                 label: 'Budget Solo Traveler' },
  ];

  visitorProfiles.forEach(profile => {
    const recs = visitex.recommendConcessions(profile, concessions);
    console.log(`\n  ${profile.label} (${profile.loyaltyTier} | ${profile.dwellBudgetMin}min dwell budget):`);
    recs.topPicks.forEach((pick, i) => {
      console.log(`    ${i+1}. ${pick.name.padEnd(28)} [${pick.category}]  Avg: ${pick.avgCheck}  Score: ${pick.relevance}  → ${pick.why}`);
    });
  });

  await sleep(200);

  // 2c — Accessibility Routing
  console.log('\n' + divider());
  console.log('  Scene 2C: Accessibility Routing — RedCoat Assignment');
  console.log(divider());

  const accessRequests = [
    { passengerId: 'PAX-WC-001', assistType: 'WHEELCHAIR',  currentLocation: 'A-CHECKIN', destinationGate: 'D-GATES', flightDeadline: Date.now() + 75 * 60000 },
    { passengerId: 'PAX-VIS-002', assistType: 'VISUAL',     currentLocation: 'E-SECURITY', destinationGate: 'E-GATES', flightDeadline: Date.now() + 40 * 60000 },
    { passengerId: 'PAX-MOB-003', assistType: 'CART',       currentLocation: 'D-CUSTOMS',  destinationGate: 'B-GATES', flightDeadline: Date.now() + 55 * 60000 },
  ];

  accessRequests.forEach(req => {
    const result = visitex.submitAccessibilityRequest(req);
    const urgIcon = result.urgentFlag ? '🚨 URGENT' : '  OK    ';
    console.log(`\n  ${urgIcon}  ${result.passengerId}  [${result.assistType}]  Gate: ${result.destinationGate}`);
    console.log(`  ${result.minutesUntilFlight}min until flight  |  Assigned: ${result.assignedRedCoat}  |  ETA: ${result.estimatedArrivalMin} min`);
    console.log(`  Route: ${result.route.pathLabel}  (${result.route.travelMinutes} min accessible)`);
    console.log(`  → ${result.message}`);
  });

  await sleep(200);

  // 2d — NPS Driver Analysis
  console.log('\n' + divider());
  console.log('  Scene 2D: NPS Driver Analysis — Experience Intelligence');
  console.log(divider());

  // Simulated recent NPS survey batch (100 responses)
  const surveys = Array.from({ length: 100 }, (_, i) => ({
    WAYFINDING:    6.2 + Math.random() * 2.5,
    SECURITY_WAIT: 5.8 + Math.random() * 3.0,
    CONCESSION:    7.2 + Math.random() * 2.0,
    CLEANLINESS:   8.0 + Math.random() * 1.5,
    STAFF_HELPFUL: 7.8 + Math.random() * 1.8,
    GATE_INFO:     6.9 + Math.random() * 2.2,
    WIFI:          5.5 + Math.random() * 3.5,
    BAGGAGE:       6.8 + Math.random() * 2.5,
  }));

  const nps = visitex.analyzeNPS(surveys);
  console.log(`\n  ${nps.surveysAnalyzed} surveys analyzed  |  Overall Score: ${nps.overallScore}/10  |  NPS Estimate: ${nps.npsEstimate}`);
  console.log(`  Top Opportunity: "${nps.topOpportunity}"`);
  console.log(`  Top Strength:    "${nps.topStrength}"`);
  console.log('\n  NPS Driver Breakdown (worst gaps first):');
  nps.drivers.forEach(d => {
    const gapBar = d.gap < 0 ? '▼'.repeat(Math.min(5, Math.abs(Math.round(d.gap * 2)))) : '▲'.repeat(Math.min(5, Math.round(d.gap * 2)));
    const icon   = d.status === 'BELOW' ? '⚠' : d.status === 'ABOVE' ? '✓' : '→';
    console.log(`  ${icon} ${d.driver.padEnd(38)} Score: ${d.score.padEnd(5)} vs ${d.benchmark.toFixed(1)}  Gap: ${String(d.gap).padEnd(6)} ${gapBar}  [${d.weight}]`);
  });
  console.log(`\n  Action: ${nps.action}`);

  await sleep(200);

  // 2e — Loyalty CLV Cohort Modeling
  console.log('\n' + divider());
  console.log('  Scene 2E: Loyalty CLV Cohort Modeling — 2.4M Members');
  console.log(divider());

  const loyalty = visitex.buildLoyaltyCohorts();
  console.log(`\n  Total Loyalty Members: ${loyalty.totalLoyaltyMembers}  |  Total Portfolio CLV: ${loyalty.totalPortfolioValue}`);
  console.log('\n  Cohort Breakdown:');
  loyalty.cohorts.forEach(c => {
    const barLen = Math.round(parseFloat(c.shareOfTotal) * 20);
    const bar = '█'.repeat(barLen);
    console.log(`\n  ${c.cohortId.padEnd(12)} ${c.label}`);
    console.log(`  Members: ${c.memberCount.padEnd(12)} Share: ${c.shareOfTotal.padEnd(6)} CLV: ${c.estimatedCLV.padEnd(10)} Cohort Value: ${c.totalCohortValue}  ${bar}`);
    console.log(`  → ${c.action}`);
  });

  // ══ BLOCK 3: CREWEX — WORKFORCE EXPERIENCE INTELLIGENCE ══════════════════

  await sleep(300);
  console.log('\n' + divider('═'));
  console.log('  BLOCK 3 — CREW & WORKFORCE EXPERIENCE INTELLIGENCE (CREWEX)');
  console.log(divider('═'));
  console.log('');
  console.log('  Problem: 58,000 employees scheduled on spreadsheets. Fatigue');
  console.log('  undetected. Career paths informal. Wage gaps invisible.');
  console.log('');

  // 3a — Register employees and schedule coverage
  console.log(divider());
  console.log('  Scene 3A: Constraint-Based Shift Scheduling');
  console.log(divider());

  // Register a sample workforce for Terminal D
  const employeeSamples = [
    { name: 'Maria Gonzalez', zone: 'TERMINAL_D', jobClass: 'GATE',     currentLevel: 2, certifications: ['GATE-BASIC','DCS-CERT','GATE-SR'], availability: [0,1,2,3,4], hoursThisWeek: 24, wagePer_hr: 21.50, gender: 'F', tenureYears: 3 },
    { name: 'James Wilson',   zone: 'TERMINAL_D', jobClass: 'GATE',     currentLevel: 1, certifications: ['GATE-BASIC','DCS-CERT'],            availability: [1,2,3,4,5], hoursThisWeek: 16, wagePer_hr: 18.25, gender: 'M', tenureYears: 1 },
    { name: 'Priya Sharma',   zone: 'TERMINAL_D', jobClass: 'RAMP',     currentLevel: 1, certifications: ['RAMP-BASIC','FOD'],                  availability: [0,1,2,3,4], hoursThisWeek: 32, wagePer_hr: 19.75, gender: 'F', tenureYears: 2 },
    { name: 'DeShawn Carter', zone: 'TERMINAL_D', jobClass: 'RAMP',     currentLevel: 2, certifications: ['RAMP-BASIC','FOD','RAMP-LEAD'],       availability: [0,2,3,4,6], hoursThisWeek: 28, wagePer_hr: 23.00, gender: 'M', tenureYears: 4 },
    { name: 'Ana Torres',     zone: 'TERMINAL_D', jobClass: 'GATE',     currentLevel: 3, certifications: ['GATE-BASIC','DCS-CERT','GATE-SR','GATE-SUP','IROPS-BASIC'], availability: [0,1,2,3,4,5], hoursThisWeek: 20, wagePer_hr: 28.50, gender: 'F', tenureYears: 7 },
    { name: 'Kevin Nguyen',   zone: 'TERMINAL_D', jobClass: 'SECURITY', currentLevel: 1, certifications: ['TSA-BASIC','CCTV'],                   availability: [1,2,3,4,5], hoursThisWeek: 36, wagePer_hr: 18.75, gender: 'M', tenureYears: 1 },
    { name: 'Rachel Kim',     zone: 'CARGO_COMPLEX', jobClass: 'CARGO', currentLevel: 2, certifications: ['CARGO-BASIC','HazMat-CAT6','CARGO-SPEC'], availability: [0,1,2,3,4], hoursThisWeek: 30, wagePer_hr: 24.50, gender: 'F', tenureYears: 5 },
    { name: 'Marcus Brown',   zone: 'TERMINAL_D', jobClass: 'GATE',     currentLevel: 1, certifications: ['GATE-BASIC'],                          availability: [0,1,3,4,5], hoursThisWeek: 8,  wagePer_hr: 17.80, gender: 'M', tenureYears: 0 },
  ];

  const empIds = employeeSamples.map(e => crewex.registerEmployee(e).empId);

  // Schedule Terminal D Wednesday (day 2) — hourly requirements
  const hourlyReqs = { 6: 3, 7: 5, 8: 7, 9: 6, 10: 5, 11: 6, 12: 7, 13: 6, 14: 5, 15: 6, 16: 8, 17: 7, 18: 6, 19: 4 };
  const schedule = crewex.scheduleCoverage('TERMINAL_D', 2, hourlyReqs);

  console.log(`\n  Terminal D — Wednesday Shift Schedule`);
  console.log(`  Total Required: ${schedule.totalRequired} shift-hours  |  Assigned: ${schedule.assigned}  |  Coverage: ${schedule.coveragePct}`);
  if (schedule.gaps.length > 0) {
    console.log(`  Coverage Gaps:`);
    schedule.gaps.forEach(g => console.log(`    ${String(g.hour).padStart(2,'0')}:00  Need ${g.required}, have ${g.available}  (gap: ${g.gap})`));
  }
  console.log(`  → ${schedule.recommendation}`);

  await sleep(200);

  // 3b — Fatigue Risk Assessment
  console.log('\n' + divider());
  console.log('  Scene 3B: SAFTE-FAST Biomathematical Fatigue Risk Assessment');
  console.log(divider());

  const fatigueAssessments = [
    { employeeId: empIds[0], lastSleepHours: 7.5, hoursAwake: 4,  shiftStartHour: 6,  assessmentHour: 10, nightShift: false, label: 'Maria — morning shift (4h in)' },
    { employeeId: empIds[2], lastSleepHours: 5.5, hoursAwake: 10, shiftStartHour: 22, assessmentHour: 4,  nightShift: true,  label: 'Priya — overnight ramp shift (night)' },
    { employeeId: empIds[5], lastSleepHours: 4.0, hoursAwake: 14, shiftStartHour: 20, assessmentHour: 3,  nightShift: true,  label: 'Kevin — security graveyard (4AM check)' },
  ];

  fatigueAssessments.forEach(cfg => {
    const result = crewex.fatigueRiskScore(cfg);
    console.log(`\n  ${cfg.label}`);
    console.log(`  Last Sleep: ${result.lastSleepHours}h  |  Hours Awake: ${result.hoursAwake}h  |  Assessment: ${result.assessmentHour}`);
    console.log(`  Cognitive Effectiveness: ${result.cognitiveEffectiveness}  |  Risk: ${result.riskLevel}`);
    console.log(`  → ${result.recommendation}`);
  });

  await sleep(200);

  // 3c — Career Pathway Analysis
  console.log('\n' + divider());
  console.log('  Scene 3C: Skill-Gap Career Pathway Engine');
  console.log(divider());

  const careerEmployees = [empIds[0], empIds[1], empIds[3]]; // Maria, James, DeShawn
  careerEmployees.forEach(empId => {
    const result = crewex.careerPathwayAnalysis(empId);
    if (result.error) { console.log(`  Error: ${result.error}`); return; }
    console.log(`\n  ${result.name}  [${result.currentTitle}]  ${result.currentWage}  (${result.tenureYears}yr)`);
    console.log(`  Certifications: ${result.certifications.join(', ') || 'None'}`);
    result.nextSteps.slice(0, 2).forEach(step => {
      console.log(`\n    → ${step.targetTitle}  ${step.targetWage}  (+${step.annualWageLift})`);
      console.log(`      Cert Gap: [${step.certGap.join(', ') || 'None'}]  Training: ${step.trainingHours}h  Cost: ${step.trainingCost}`);
      console.log(`      ROI: ${step.annualROI}  Payback: ${step.paybackMonths} months`);
    });
    console.log(`  → ${result.topOpportunity}`);
  });

  await sleep(200);

  // 3d — Labor Demand Forecasting
  console.log('\n' + divider());
  console.log('  Scene 3D: Real-Time Labor Demand Forecasting (AEROLEX coupling)');
  console.log(divider());

  // Simulate AEROLEX flight bank signals coupling into CREWEX
  const flightBankSignal = { 6: 8, 7: 18, 8: 35, 9: 42, 10: 28, 11: 24, 12: 30, 13: 38, 14: 32, 15: 28, 16: 45, 17: 48, 18: 35, 19: 22, 20: 14, 21: 8, 22: 4, 23: 2 };
  const passengerSignal  = { 6: 1800, 7: 4200, 8: 8500, 9: 10200, 10: 7800, 11: 6900, 12: 7200, 13: 9100, 14: 8400, 15: 7600, 16: 11200, 17: 12000, 18: 9500, 19: 6200, 20: 3800, 21: 2400, 22: 1200, 23: 800 };

  const laborForecast = crewex.forecastLaborDemand({
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    zone: 'TERMINAL_D',
    departuresByHour: flightBankSignal,
    passengersByHour: passengerSignal,
  });

  console.log(`\n  ${laborForecast.date}  |  Zone: ${laborForecast.zoneLabel}`);
  console.log(`  Understaffed Hours: ${laborForecast.understaffedHours}  |  Max Gap: ${laborForecast.maxStaffingGap} staff`);
  console.log('');
  console.log('  Hour  Pax      Departures  Required  Current  Gap   Status');
  laborForecast.forecast
    .filter(f => [6,8,10,12,14,16,17,19,21].includes(parseInt(f.hour)))
    .forEach(f => {
      const statusIcon = f.status === 'UNDERSTAFFED' ? '⚠' : f.status === 'OVERSTAFFED' ? '↓' : '✓';
      console.log(`  ${f.hour}  ${String(f.pax).padEnd(9)} ${String(f.departures).padEnd(12)} ${String(f.required).padEnd(10)} ${String(f.current).padEnd(9)} ${String(f.gap).padEnd(6)} ${statusIcon} ${f.status}`);
    });
  console.log(`\n  → ${laborForecast.recommendation}`);

  await sleep(200);

  // 3e — Wage Equity Report
  console.log('\n' + divider());
  console.log('  Scene 3E: Wage Equity & Compliance Analytics');
  console.log(divider());

  const wageReport = crewex.wageEquityReport();
  console.log(`\n  ${wageReport.employeesAnalyzed} employees analyzed  |  Status: ${wageReport.complianceStatus}`);
  console.log('\n  Gender Pay Equity:');
  wageReport.genderPayEquity.forEach(g => {
    const icon = g.gapFlag === 'REVIEW' ? '⚠' : '✓';
    console.log(`    ${icon} ${g.gender.padEnd(12)} ${g.count} employees  Avg: ${g.avgWage}  Gap: ${g.payGapPct}`);
  });
  console.log(`\n  Overtime Exposure:  ${wageReport.overtimeEmployees} employees  Est. Cost: ${wageReport.estimatedOvertimeCost}`);
  console.log(`  Below Living Wage:  ${wageReport.belowLivingWage} employees  Target: ${wageReport.livingWageTarget}`);
  if (wageReport.recommendations.length > 0) {
    console.log('\n  Recommendations:');
    wageReport.recommendations.forEach(r => console.log(`  → ${r}`));
  }

  // ══ BLOCK 4: ANNUAL ECONOMIC VALUE MODEL ═════════════════════════════════

  await sleep(200);
  console.log('\n' + divider('═'));
  console.log('  BLOCK 4 — ANNUAL ECONOMIC VALUE MODEL');
  console.log(divider('═'));

  const turnaroundSavings     = 450 * 365 * 5 * 85;        // 5 min saved/turn × $85/min × 450 dep/day × 365
  const fuelLeakRecovery      = 4 * 45000;                  // 4 flagged routes × avg $45K/year savings
  const crewIllegalAvoidance  = 12 * 15000;                 // 12 illegal pairings/year × $15K avg delay cost
  const visitorWalletCapture  = 0.03 * 73000000 * 38;       // 3% more visitors buy, avg $38 incremental
  const accessSatisfaction    = 240 * 365 * 8;              // 240 assists/day × 365 × $8 NPS impact value
  const workforceRetention    = 5800 * 12000;               // 10% churn reduction, $12K avg replacement cost
  const wageLiftProductivity  = 58000 * 0.06 * 45000;       // 6% wage-driven productivity gain
  const trainingROI           = 2000 * 52000 * 0.11;        // 2K trained × $52K wage × 11% productivity gain

  const totalValue   = turnaroundSavings + fuelLeakRecovery + crewIllegalAvoidance +
                       visitorWalletCapture + accessSatisfaction + workforceRetention +
                       wageLiftProductivity + trainingROI;
  const platformCost = 960000;  // DFW Aero edition (AEROLEX + VISITEX + CREWEX)
  const roi          = ((totalValue - platformCost) / platformCost * 100).toFixed(0);

  console.log(`
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  RSHIP DFW Airlines, Tourism & Workforce — Annual Economic Value          │
  ├──────────────────────────────────────────────────────────────────────────┤
  │  AEROLEX: Gate Turnaround Savings (5min/turn × 450/day)   $${(turnaroundSavings/1e6).toFixed(0)}M    │
  │  AEROLEX: Fuel Leak Recovery (4 routes audited)           $${(fuelLeakRecovery/1e6).toFixed(1)}M      │
  │  AEROLEX: Crew Illegal Prevention (12 pairings/year)      $${(crewIllegalAvoidance/1e6).toFixed(1)}M      │
  │  VISITEX: Visitor Wallet Capture (3% lift × 73M pax)      $${(visitorWalletCapture/1e6).toFixed(0)}M    │
  │  VISITEX: Accessibility NPS Impact (240 assists/day)      $${(accessSatisfaction/1e6).toFixed(0)}M      │
  │  CREWEX:  Workforce Retention (5,800 hires avoided)       $${(workforceRetention/1e6).toFixed(0)}M     │
  │  CREWEX:  Wage-Lift Productivity (6%, 58K workers)        $${(wageLiftProductivity/1e6).toFixed(0)}M    │
  │  CREWEX:  Training ROI (2K trained, 11% gain)             $${(trainingROI/1e6).toFixed(0)}M     │
  │  ─────────────────────────────────────────────────────────────────────  │
  │  Total Annual Value:                                      $${(totalValue/1e6).toFixed(0)}M    │
  │  Platform Cost (AEROLEX + VISITEX + CREWEX):             $${(platformCost/1e6).toFixed(1)}M      │
  │  Net Annual Gain:                                         $${((totalValue-platformCost)/1e6).toFixed(0)}M    │
  │  ROI:                                                     ${roi}%      │
  └──────────────────────────────────────────────────────────────────────────┘
  `);

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  RSHIP ENTERPRISE — DFW Airlines, Tourism & Workforce — Simulation Done   ║
║  Designation: RSHIP-PROD-DFW-AERO-001                                     ║
║  3 AGIs: AEROLEX · VISITEX · CREWEX                                       ║
║  Full DFW Stack (10 AGIs total):                                           ║
║    PORTEX · TRACTEX · PRAEDEX · AEQUEX · SALUTEX · SECUREX · COMMUNEX    ║
║    AEROLEX · VISITEX · CREWEX                                              ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
}

runAeroTourismSimulation().catch(console.error);
