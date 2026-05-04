/**
 * PRODUCTION APPLICATION: RSHIP ENTERPRISE — DFW AIRPORT COMMUNITY ECONOMY
 *
 * Designation: RSHIP-PROD-DFW-COMMUNITY-001
 * AGI Systems: COMMUNEX + PORTEX + TRACTEX
 * Industry: Airport Community Economy — Aerotropolis Impact, ACDBE Small Business,
 *           Workforce Development, Visitor Economic Bridge, Community Benefit Agreements
 * Scale: Dallas/Fort Worth International Airport — 28-city aerotropolis,
 *        58,000+ direct employees, 200,000+ indirect jobs, $37B+ annual regional impact
 *
 * Problem Statement:
 * DFW International Airport generates $37B+ in annual regional economic impact —
 * but the 28 surrounding cities have no real-time window into their share of that
 * wealth. ACDBE small business operators lack performance benchmarks. The airport's
 * 58,000-strong workforce skews toward low wages and distant zip codes despite
 * living-wage targets. 73 million annual passengers spend billions in the DFW
 * Metroplex, but no tool bridges that spending to the neighborhoods that host it.
 * Community Benefit Agreements with 28 municipalities go untracked between annual
 * reviews, making compliance reactive rather than proactive.
 *
 * RSHIP Community Solution:
 * Three sovereign AGI systems delivering aerotropolis-scale community intelligence:
 * COMMUNEX maps the Leontief I/O economic ripple across 28 cities, scores every
 * ACDBE firm, tracks workforce development ROI via Wright learning curves, converts
 * 73M passengers into hotel nights and restaurant visits across the Metroplex, and
 * maintains a live CBA scorecard across all municipal commitments. PORTEX provides
 * concession revenue benchmarks for ACDBE context. TRACTEX tracks community
 * investment fund cash flows.
 *
 * Who uses this:
 * - DFW Airport Board of Directors: community benefit reporting
 * - DFW Government Relations team: 28-city CBA stakeholder management
 * - Dallas County / Tarrant County Economic Development offices
 * - ACDBE program administrators and small business advisors
 * - Workforce development directors and training program managers
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthCOMMUNEX } from '../sdk/communex-agi/communex-agi.js';
import { birthPORTEX  }  from '../sdk/portex-agi/portex-agi.js';
import { birthTRACTEX }  from '../sdk/tractex-agi/tractex-agi.js';
import { PHI, PHI_INV }  from '../rship-framework.js';

// ── DFW Community Configuration ───────────────────────────────────────────

const DFW_COMMUNITY = {
  airport:            'Dallas/Fort Worth International Airport',
  designation:        'RSHIP-PROD-DFW-COMMUNITY-001',
  aerotropolisSize:   28,         // cities in the aerotropolis
  directEmployees:    58000,
  annualPassengers:   73000000,
  annualEconomicImpact: 37000000000, // $37B
  acdbeFirmsTotal:    42,         // total ACDBE operators at DFW
  cbaPartners:        28,         // municipalities with active CBAs
  communityFundAnnual: 12000000,  // $12M annual community investment fund
};

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║     RSHIP ENTERPRISE — DFW AIRPORT COMMUNITY ECONOMY INTELLIGENCE          ║
║                 RSHIP-PROD-DFW-COMMUNITY-001                               ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Airport:     ${DFW_COMMUNITY.airport.padEnd(60)}║
║  Aerotropolis: ${DFW_COMMUNITY.aerotropolisSize} Cities  |  Direct Jobs: ${DFW_COMMUNITY.directEmployees.toLocaleString()}  |  Pax: ${(DFW_COMMUNITY.annualPassengers / 1e6).toFixed(0)}M/yr${' '.repeat(14)}║
║  Annual Regional Impact: $${(DFW_COMMUNITY.annualEconomicImpact / 1e9).toFixed(0)}B  |  ACDBE Operators: ${DFW_COMMUNITY.acdbeFirmsTotal}${' '.repeat(26)}║
╚════════════════════════════════════════════════════════════════════════════╝

Initializing 3 Alpha AGI Systems for DFW Community Economy Intelligence...
`);

// ── AGI Initialization ─────────────────────────────────────────────────────

const communex = birthCOMMUNEX({
  airport:          'DFW',
  annualPassengers: DFW_COMMUNITY.annualPassengers,
  directEmployees:  DFW_COMMUNITY.directEmployees,
});
const portex   = birthPORTEX({ airport: 'DFW' });
const tractex  = birthTRACTEX({ learningCoefficient: PHI_INV });

console.log('  ✓ COMMUNEX — Community & Aerotropolis Economy Intelligence');
console.log('  ✓ PORTEX   — Airport Economy & Concession Revenue Intelligence');
console.log('  ✓ TRACTEX  — Revenue Tracking & Community Investment Cash Flow');
console.log('\n  All 3 AGI systems born alive. Running community economy simulation...\n');

// ── Simulation ─────────────────────────────────────────────────────────────

async function runCommunitySimulation() {

  // ── Scene 1: Aerotropolis Economic Map ────────────────────────────────────

  console.log('─'.repeat(76));
  console.log('  SCENE 1: Aerotropolis Economic Impact Map (COMMUNEX)');
  console.log('─'.repeat(76));

  const ecoMap = communex.aerotropolisEconomicMap();
  console.log(`
  Dallas/Fort Worth Aerotropolis — Economic Ripple Analysis
  ─────────────────────────────────────────────────────────────────────
  Direct Airport Spending:  ${ecoMap.totalDirectSpend}
  Total Economic Impact:    ${ecoMap.totalEconomicImpact}  (Leontief I/O multiplier: ${ecoMap.overallMultiplier}x)
  Direct Jobs Created:      ${ecoMap.directJobs}
  Total Jobs Supported:     ${ecoMap.totalJobs}  (includes indirect & induced)
  Indirect/Induced Jobs:    ${ecoMap.indirectJobs}
  `);

  console.log('  Sector-by-Sector Economic Breakdown:');
  Object.values(ecoMap.sectors).forEach(s => {
    const bar = '█'.repeat(Math.round(parseFloat(s.multiplier) * 2));
    console.log(`  ${s.sector.padEnd(26)} Direct: ${s.directSpend.padEnd(7)} → Total: ${s.totalImpact.padEnd(8)} [${s.multiplier}x] ${bar}`);
    console.log(`    Direct Jobs: ${String(s.directJobs).padEnd(6)} Total: ${String(s.totalJobs).padEnd(7)} Avg Wage: ${s.avgWage}  Tax Rev: ${s.localTaxRevenue}`);
  });

  console.log('\n  Top 10 Cities by Aerotropolis Economic Share:');
  ecoMap.cityImpact
    .sort((a, b) => parseInt(b.economicImpact) - parseInt(a.economicImpact))
    .slice(0, 10)
    .forEach(c => {
      console.log(`  ${c.city.padEnd(22)} ${c.tier.padEnd(10)} Impact: ${c.economicImpact.padEnd(8)} Jobs: ${String(c.jobsSupported).padEnd(6)} Tax: ${c.taxRevenue}`);
    });

  // ── Scene 2: ACDBE Small Business Portfolio ───────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 2: ACDBE Small Business Portfolio (COMMUNEX)');
  console.log('─'.repeat(76));
  console.log('\n  Registering Airport Concession Disadvantaged Business Enterprise firms...');

  // Register a cross-section of ACDBE operators at DFW
  const acdbeFirms = [
    { legalName: "Morales Family Kitchen",      ownerName: "Maria Morales",   category: 'F&B',     certification: 'WBE',   terminal: 'D', annualRevenueTarget: 1200000, annualRevenueActual: 1380000, sqft: 1400, openDate: Date.now() - 24 * 30 * 86400000, mentorFirm: 'SSP America' },
    { legalName: "DFW Veterans Gifts & News",   ownerName: "James Thornton",  category: 'Retail',  certification: 'SDVOSB', terminal: 'A', annualRevenueTarget: 680000,  annualRevenueActual: 520000,  sqft: 800,  openDate: Date.now() - 8 * 30 * 86400000,  mentorFirm: null },
    { legalName: "Aisha's Fresh Juice Bar",     ownerName: "Aisha Okafor",    category: 'F&B',     certification: 'MBE',   terminal: 'C', annualRevenueTarget: 540000,  annualRevenueActual: 610000,  sqft: 600,  openDate: Date.now() - 36 * 30 * 86400000, mentorFirm: 'DFW Hospitality Group' },
    { legalName: "Lone Star Tech Accessories",  ownerName: "David Kim",       category: 'Retail',  certification: 'MBE',   terminal: 'B', annualRevenueTarget: 420000,  annualRevenueActual: 185000,  sqft: 450,  openDate: Date.now() - 4 * 30 * 86400000,  mentorFirm: null },
    { legalName: "Flores & Flores Flowers",     ownerName: "Elena Flores",    category: 'Retail',  certification: 'WBE',   terminal: 'E', annualRevenueTarget: 290000,  annualRevenueActual: 305000,  sqft: 320,  openDate: Date.now() - 18 * 30 * 86400000, mentorFirm: null },
    { legalName: "Singh Express Grab & Go",     ownerName: "Priya Singh",     category: 'F&B',     certification: 'MBE',   terminal: 'A', annualRevenueTarget: 780000,  annualRevenueActual: 720000,  sqft: 950,  openDate: Date.now() - 30 * 30 * 86400000, mentorFirm: 'SSP America' },
  ];

  const acdbIds = acdbeFirms.map(f => communex.registerACDBEFirm(f));

  console.log('\n  ACDBE Firm Performance Scores:');
  acdbIds.forEach(firm => {
    const score = communex.scoreACDBEFirm(firm.firmId);
    const scoreBar = '█'.repeat(Math.round(parseFloat(score.overallScore) * 12));
    console.log(`\n  ${score.legalName} (${score.certification})`);
    console.log(`  Terminal ${score.terminal}  Score: ${score.overallScore}  ${scoreBar}  [${score.tier}]`);
    console.log(`  Revenue: ${score.revenueActual} vs target ${score.revenueTarget}  (${score.revenueAttainment} attainment)`);
    console.log(`  Cert: ${score.certStatus}  |  Mentor: ${score.mentorFirm}`);
    console.log(`  → ${score.recommendation}`);
  });

  const portfolio = communex.acdbPortfolioSummary();
  console.log(`\n  ACDBE Portfolio Summary:`);
  console.log(`  Total Firms: ${portfolio.total}  |  Compliant/Exemplary: ${portfolio.compliant}  |  Developing: ${portfolio.developing}  |  At Risk: ${portfolio.atRisk}`);
  console.log(`  Portfolio Revenue: ${portfolio.totalRevenue} vs target ${portfolio.totalTarget}  (${portfolio.portfolioRevenueAttainment} attainment)`);

  // Benchmark ACDBE F&B against PORTEX concession scores
  console.log('\n  PORTEX Concession Benchmarks (for ACDBE context):');
  const acdbeConcessions = acdbeFirms
    .filter(f => f.category === 'F&B')
    .slice(0, 3)
    .map((f, i) => {
      const opId = `ACDBE-OP-${String(i + 1).padStart(3, '0')}`;
      portex.registerConcessionaire(opId, {
        id: opId, name: f.legalName, terminal: f.terminal, category: f.category,
        sqft: f.sqft, enplanementsServed: 2000000, annualRevenue: f.annualRevenueActual,
      });
      return portex.scoreConcessionaire(opId);
    });
  acdbeConcessions.forEach(s => {
    console.log(`  ${s.legalName.padEnd(36)} RPE: ${s.revenuePerEnplanement} vs benchmark ${s.benchmarkRPE}`);
  });

  // ── Scene 3: Workforce Development Intelligence ───────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 3: Workforce Development Intelligence (COMMUNEX)');
  console.log('─'.repeat(76));
  console.log('\n  Local hire rate by zip code proximity to DFW:');

  // Register workforce zones (zip codes near DFW)
  const workforceZones = [
    { zip: '75062', city: 'Irving (closest)',       totalEmployees: 8200, localHires: 6890, avgWage: 52000, distanceMiles: 3  },
    { zip: '76051', city: 'Grapevine',              totalEmployees: 3100, localHires: 2480, avgWage: 48000, distanceMiles: 2  },
    { zip: '75019', city: 'Coppell',                totalEmployees: 2400, localHires: 1680, avgWage: 58000, distanceMiles: 4  },
    { zip: '76039', city: 'Euless',                 totalEmployees: 4200, localHires: 2940, avgWage: 41000, distanceMiles: 5  },
    { zip: '76022', city: 'Bedford',                totalEmployees: 1800, localHires: 1080, avgWage: 44000, distanceMiles: 8  },
    { zip: '75001', city: 'Addison (distant)',      totalEmployees: 900,  localHires: 360,  avgWage: 72000, distanceMiles: 16 },
  ];

  workforceZones.forEach(z => communex.registerWorkforceZone(z.zip, {
    city: z.city, totalEmployees: z.totalEmployees, localHires: z.localHires,
    avgWage: z.avgWage, distanceMiles: z.distanceMiles, livingWageTarget: 38000,
  }));

  const wfReport = communex.localHireRateReport();
  console.log(`  Overall Local Hire Rate: ${wfReport.overallLocalHireRate}  |  Total Employees: ${wfReport.totalEmployees}  |  Local Hires: ${wfReport.totalLocalHires}`);
  console.log(`  DFW Living Wage Target: ${wfReport.dfwLivingWage}/yr\n`);
  wfReport.byZone.forEach(z => {
    const lw = z.livingWageCompliant ? '✓' : '⚠';
    const target = z.aboveTarget ? '✓' : '↑';
    console.log(`  ${z.zipCode}  ${z.city.padEnd(28)} LocalHire: ${z.localHireRate.padEnd(7)} [target: ${z.targetRate}] ${target}  Wage: ${z.avgWage} ${lw}`);
  });

  // Training program ROI using Wright learning curve
  console.log('\n  Training Program ROI — Wright Learning Curve Analysis:');
  const programs = [
    { id: 'PROG-RAMP-001',   label: 'Ramp Safety & Operations Training',  cohort: 1, employees: 120, initCost: 1400, wage: 52000, gain: 0.13 },
    { id: 'PROG-RAMP-001-2', label: 'Ramp Safety & Operations (Cohort 2)', cohort: 2, employees: 120, initCost: 1400, wage: 52000, gain: 0.13 },
    { id: 'PROG-CARGO-001',  label: 'Cargo Handling Certification',        cohort: 1, employees: 80,  initCost: 1800, wage: 58000, gain: 0.11 },
    { id: 'PROG-HOSP-001',   label: 'Hospitality & Customer Excellence',   cohort: 1, employees: 200, initCost: 600,  wage: 42000, gain: 0.09 },
  ];

  programs.forEach(p => {
    const roi = communex.trainingProgramROI(p.id, {
      initialCostPerEmployee: p.initCost, cohortNumber: p.cohort,
      employeesInCohort: p.employees, avgAnnualWage: p.wage,
      productivityGainPct: p.gain, learningRate: 0.82,
    });
    console.log(`\n  ${p.label}`);
    console.log(`  Cost/Employee: ${roi.costPerEmployee}  |  Total Cost: ${roi.totalProgramCost}  |  Annual Gain: ${roi.annualProductivityGain}`);
    console.log(`  ROI: ${roi.roi}  |  Payback: ${roi.paybackDays} days  |  3-Year Value: ${roi.threeYearValue}`);
    console.log(`  ${roi.learningCurveNote}`);
  });

  // ── Scene 4: Visitor-to-Community Economic Bridge ─────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 4: Visitor-to-Community Economic Bridge (COMMUNEX)');
  console.log('─'.repeat(76));
  console.log('\n  Converting 73M annual passengers into DFW Metroplex community spend...');

  const bridge = communex.visitorEconomicBridge(DFW_COMMUNITY.annualPassengers);

  console.log(`\n  73M Annual Passengers → DFW Metroplex Economic Activity:`);
  console.log(`  ─────────────────────────────────────────────────────────────`);
  Object.values(bridge.segments).forEach(seg => {
    console.log(`  ${seg.segment.padEnd(24)} ${seg.passengers.padEnd(10)} pax | Hotels: ${seg.hotelNights.padEnd(10)} nights ${seg.hotelRevenue}`);
    console.log(`  ${' '.repeat(24)}               | Restaurants: ${seg.restaurantRev.padEnd(6)}  Retail: ${seg.retailRev}`);
  });

  const t = bridge.totals;
  console.log(`
  ┌────────────────────────────────────────────────────────────────────┐
  │  DFW Metroplex Visitor Economic Bridge — Annual Summary             │
  ├────────────────────────────────────────────────────────────────────┤
  │  Total Hotel Nights Generated:   ${t.hotelNights.padEnd(36)}│
  │  Hotel Revenue (ADR × nights):   ${t.hotelRevenue.padEnd(36)}│
  │  Restaurant Revenue:             ${t.restaurantRevenue.padEnd(36)}│
  │  Retail Revenue:                 ${t.retailRevenue.padEnd(36)}│
  │  ──────────────────────────────────────────────────────────────    │
  │  Total Direct Visitor Spend:     ${t.totalDirectSpend.padEnd(36)}│
  │  Total Economic Impact (${t.metroplexHospitalityMultiplier}):  ${t.totalEconomicImpact.padEnd(36)}│
  └────────────────────────────────────────────────────────────────────┘`);

  // ── Scene 5: Community Benefit Agreement Scorecard ────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 5: Community Benefit Agreement Scorecard (COMMUNEX)');
  console.log('─'.repeat(76));
  console.log('\n  Registering CBA commitments across 28-city aerotropolis...');

  const cbaItems = [
    { id: 'CBA-HIRING-2025',   category: 'LOCAL_HIRING',     municipality: 'Regional',   description: 'Minimum 65% of new hires from aerotropolis zip codes', target: 65,   actual: 71,   trend: 'IMPROVING' },
    { id: 'CBA-NOISE-2025',    category: 'NOISE_ABATEMENT',  municipality: 'Grapevine',  description: 'Night flight restriction compliance ≥97%', target: 97,   actual: 98.2, trend: 'STABLE'   },
    { id: 'CBA-NOISE-2025-B',  category: 'NOISE_ABATEMENT',  municipality: 'Irving',     description: 'Ground run curfew compliance ≥95%',       target: 95,   actual: 94,   trend: 'STABLE'   },
    { id: 'CBA-EMISSIONS-2025',category: 'EMISSIONS',        municipality: 'Regional',   description: 'Annual carbon reduction vs 2022 baseline (metric tons)', target: 15000, actual: 12800, trend: 'IMPROVING' },
    { id: 'CBA-INVEST-2025',   category: 'COMMUNITY_INVEST', municipality: 'Dallas Co.', description: 'Community Investment Fund annual disbursement ($M)', target: 12,   actual: 11.2, trend: 'STABLE'   },
    { id: 'CBA-ACDBE-2025',    category: 'SMALL_BUSINESS',   municipality: 'Regional',   description: 'ACDBE gross receipts as % of total concession revenue', target: 25,   actual: 22.1, trend: 'IMPROVING' },
    { id: 'CBA-EDUC-2025',     category: 'EDUCATION',        municipality: 'Tarrant Co.','description': 'STEM education grants to Title I schools ($K)', target: 850,  actual: 920,  trend: 'IMPROVING' },
  ];

  cbaItems.forEach(c => communex.registerCBACommitment(c.id, c));

  const cba = communex.cbaScorecardReport();
  console.log(`\n  CBA Overall Score: ${cba.overallScore}  |  Status: ${cba.overallStatus}  |  Commitments: ${cba.totalCommitments}`);
  console.log('\n  Commitment Scorecard:');
  cba.commitments.forEach(c => {
    const icon = c.status === 'MET' ? '✓' : c.status === 'ON TRACK' ? '~' : '⚠';
    const trend = c.trend === 'IMPROVING' ? '↑' : c.trend === 'DECLINING' ? '↓' : '→';
    console.log(`  ${icon} ${c.commitmentId.padEnd(22)} ${c.municipality.padEnd(14)} ${c.status.padEnd(10)} ${c.attainment.padEnd(8)} ${trend}`);
    console.log(`    ${c.category}: ${c.actual} vs target ${c.target}`);
  });

  // ── Scene 6: Community Investment Cash Flow (TRACTEX) ─────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 6: Community Investment Fund Cash Flow (TRACTEX)');
  console.log('─'.repeat(76));
  console.log('\n  Tracking $12M annual community investment fund disbursements...');

  const cbaInvoices = [
    { id: 'CIF-2025-001', desc: 'Irving STEM Education Grant Q1',   amount: 212500, recipient: 'Irving ISD' },
    { id: 'CIF-2025-002', desc: 'Grapevine Park Restoration',       amount: 185000, recipient: 'City of Grapevine Parks' },
    { id: 'CIF-2025-003', desc: 'ACDBE Business Development Fund',  amount: 350000, recipient: 'DFW ACDBE Advisory Office' },
    { id: 'CIF-2025-004', desc: 'Euless Job Training Partnership',  amount: 280000, recipient: 'Tarrant County College' },
    { id: 'CIF-2025-005', desc: 'Colleyville Noise Mitigation',     amount: 95000,  recipient: 'City of Colleyville' },
  ];

  cbaInvoices.forEach(inv => {
    tractex.createInvoice(inv.id, {
      clientId:  inv.recipient,
      projectId: 'CBA-COMMUNITY-FUND-2025',
      amount:    inv.amount,
      type:      'progress',
    });
  });

  const totalDisbursed = cbaInvoices.reduce((s, i) => s + i.amount, 0);
  console.log(`\n  Community Investment Disbursements (Q1 2025):`);
  cbaInvoices.forEach(inv => {
    console.log(`  ${inv.id}  $${inv.amount.toLocaleString().padEnd(10)} → ${inv.recipient}  |  ${inv.desc}`);
  });
  console.log(`\n  Q1 Total Disbursed: $${totalDisbursed.toLocaleString()} of $${(DFW_COMMUNITY.communityFundAnnual / 4).toLocaleString()} Q1 budget`);
  console.log(`  YTD Pacing: ${((totalDisbursed / (DFW_COMMUNITY.communityFundAnnual / 4)) * 100).toFixed(1)}%`);

  // ── Scene 7: Annual Community Economic Value Model ────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 7: Annual Community Economic Value Model');
  console.log('─'.repeat(76));

  const aerotropolisImpact    = 37000000000;              // $37B total regional impact (COMMUNEX model)
  const acdbeLift             = 42 * 180000;              // ACDBE revenue uplift: avg $180K per firm enabled
  const workforceWageLift     = 58000 * 0.08 * 45000;    // 8% wage progression for 58K workers
  const trainingROI           = 400 * 52000 * 0.12;       // 400 trained workers × $52K wage × 12% gain
  const communityFundValue    = DFW_COMMUNITY.communityFundAnnual; // $12M direct community investment
  const visitorBridgeCapture  = 0.02 * 3400000000;        // 2% incremental capture of $3.4B visitor spend

  const totalCommunityValue   = acdbeLift + workforceWageLift + trainingROI + communityFundValue + visitorBridgeCapture;
  const platformCost          = 480000; // Community tier — lower than full enterprise

  console.log(`
  ┌────────────────────────────────────────────────────────────────────┐
  │  Annual Community Economic Value — DFW Aerotropolis                │
  ├────────────────────────────────────────────────────────────────────┤
  │  ACDBE Firm Revenue Uplift (42 firms):      $${(acdbeLift / 1e6).toFixed(1)}M${' '.repeat(23)}│
  │  Workforce Wage Progression (58K workers):  $${(workforceWageLift / 1e6).toFixed(0)}M${' '.repeat(23)}│
  │  Training Program ROI (400 workers):        $${(trainingROI / 1e6).toFixed(1)}M${' '.repeat(23)}│
  │  Community Investment Fund (direct):        $${(communityFundValue / 1e6).toFixed(0)}M${' '.repeat(23)}│
  │  Visitor Economic Bridge (incremental):     $${(visitorBridgeCapture / 1e6).toFixed(0)}M${' '.repeat(23)}│
  │  ─────────────────────────────────────────────────────────────     │
  │  Total Annual Community Value:              $${(totalCommunityValue / 1e6).toFixed(0)}M${' '.repeat(23)}│
  │  Platform Cost (Community Edition):         $${(platformCost / 1e6).toFixed(1)}M${' '.repeat(23)}│
  │  Net Annual Gain:                           $${((totalCommunityValue - platformCost) / 1e6).toFixed(0)}M${' '.repeat(23)}│
  └────────────────────────────────────────────────────────────────────┘

  Aerotropolis Total Economic Impact (background):  $${(aerotropolisImpact / 1e9).toFixed(0)}B/year
  RSHIP makes that number visible, trackable, and improvable — in real time.
  `);

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  RSHIP ENTERPRISE — DFW COMMUNITY ECONOMY — Simulation Complete            ║
║  ${DFW_COMMUNITY.airport.padEnd(73)}║
║  3 AGIs: COMMUNEX · PORTEX · TRACTEX                                       ║
║  Designation: RSHIP-PROD-DFW-COMMUNITY-001                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
}

runCommunitySimulation().catch(console.error);
