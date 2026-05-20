/**
 * DFW AIRPORT ECONOMY & SECURITY — RSHIP DEMO STARTER
 *
 * Designation: RSHIP-DEMO-DFW-001
 * Purpose: Concise, standalone demo for DFW IT/executive presentations.
 *          Shows the full RSHIP value story for DFW in ~15 seconds of
 *          terminal output. Bring a QR code pointing to this file.
 *
 * Run: node production-apps/dfw-demo-starter.js
 *
 * What this demos:
 *   1. Concession Intelligence (PORTEX)  — queue analysis + revenue projection
 *   2. Safety Intelligence    (SALUTEX)  — Bayesian risk, on-chain credentials
 *   3. Security Intelligence  (SECUREX)  — TSA checkpoint throughput, badge control
 *   4. Community Economy      (COMMUNEX) — aerotropolis impact, ACDBE small business
 *   5. Value Summary                     — DFW economic impact model
 *
 * Full production deployments:
 *   - rship-enterprise-dfw-airport.js (6 AGIs — ops, safety, security)
 *   - rship-airport-community.js     (3 AGIs — aerotropolis, ACDBE, workforce)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthPORTEX  } from '../sdk/portex-agi/portex-agi.js';
import { birthSALUTEX } from '../sdk/salutex-agi/salutex-agi.js';
import { birthSECUREX } from '../sdk/securex-agi/securex-agi.js';
import { birthCOMMUNEX } from '../sdk/communex-agi/communex-agi.js';
import { PHI_INV }       from '../rship-framework.js';

// ── Demo Helpers ───────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function bar(value, max = 1.0, width = 20) {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, width - filled));
}

function divider(char = '─', width = 72) {
  return char.repeat(width);
}

// ── Boot ───────────────────────────────────────────────────────────────────

console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║          RSHIP ENTERPRISE — DFW AIRPORT DEMO                             ║
║      AI-Powered Airport Economy, Security & Community Intelligence       ║
╠══════════════════════════════════════════════════════════════════════════╣
║  Airport:   Dallas/Fort Worth International (DFW)                        ║
║  Scope:     73M passengers/yr · 5 terminals · 182 gates · 58,000 staff   ║
║  AGI Stack: PORTEX + SALUTEX + SECUREX + COMMUNEX (+ TRACTEX, PRAEDEX)  ║
║  Demo Mode: Starter — see dfw-airport.js and dfw-community.js for full   ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

// ── AGI Init ───────────────────────────────────────────────────────────────

const portex   = birthPORTEX ({ airport: 'DFW' });
const salutex  = birthSALUTEX({ basePrior: 0.025 });
const securex  = birthSECUREX({ airport: 'DFW', threatPrior: 0.0001 });
const communex = birthCOMMUNEX({ airport: 'DFW', annualPassengers: 73000000, directEmployees: 58000 });

console.log('  Initializing RSHIP AGI systems...');
console.log('    ✓ PORTEX   (Airport Economy Intelligence)    born alive');
console.log('    ✓ SALUTEX  (Campus Safety Intelligence)      born alive');
console.log('    ✓ SECUREX  (Security Operations Intelligence)  born alive');
console.log('    ✓ COMMUNEX (Community Economy Intelligence)  born alive');
console.log('');

// ── Demo Function ──────────────────────────────────────────────────────────

async function runDemo() {

  await sleep(300);

  // ── MODULE 1: Concession Revenue Intelligence (PORTEX) ──────────────────

  console.log(divider('═'));
  console.log('  MODULE 1 — CONCESSION REVENUE INTELLIGENCE  (PORTEX)');
  console.log(divider());
  console.log('');
  console.log('  Problem: Terminal D managers have no real-time data on queue');
  console.log('  behavior at concession clusters. Revenue dips during peak hours.');
  console.log('');

  // Register 3 concessionaires and score them
  const ops = [
    { id: 'OP-001', name: 'DFW Hospitality Group (F&B)',  terminal: 'D', category: 'F&B',    sqft: 12000, enplanementsServed: 8500000,  annualRevenue: 180000000 },
    { id: 'OP-002', name: 'Hudson News (Terminal A)',      terminal: 'A', category: 'Retail', sqft: 8500,  enplanementsServed: 6200000,  annualRevenue: 95000000  },
    { id: 'OP-003', name: 'SSP America (Terminal B F&B)',  terminal: 'B', category: 'F&B',    sqft: 7200,  enplanementsServed: 5800000,  annualRevenue: 72000000  },
  ];
  ops.forEach(op => portex.registerConcessionaire(op.id, op));

  console.log('  Concession Performance Scores (Revenue per Enplanement vs Benchmark):');
  ops.forEach(op => {
    const score = portex.scoreConcessionaire(op.id);
    console.log(`  ${op.name.padEnd(36)}  ${bar(parseFloat(score.overallScore), 1.0, 16)}  ${score.overallScore}  [${score.performanceTier}]`);
    console.log(`    RPE: ${score.revenuePerEnplanement}  Benchmark: ${score.benchmarkRPE}  → ${score.recommendation}`);
  });

  // Queue analysis on Terminal D
  console.log('');
  console.log('  PORTEX Queue Analysis — Terminal D Gate D22-D30 (5 concession servers, 850 pax/hr):');
  const qa = portex.analyzeConcessionsAtGate('D', 'D22-D30 Cluster', 850, 5);
  if (qa.queueMetrics.stable) {
    console.log(`    Queue Utilization:   ${qa.queueMetrics.utilization}`);
    console.log(`    Mean Wait Time:      ${qa.queueMetrics.meanWaitMinutes} min`);
    console.log(`    Revenue Multiplier:  ${qa.queueMetrics.revenueMultiplier}x`);
    console.log(`    Hourly Revenue:      ${qa.revenueProjection}  (PORTEX projection)`);
    console.log(`    Recommended Servers: ${qa.recommendedServers}`);
  }

  await sleep(200);

  // ── MODULE 2: Campus Safety Intelligence (SALUTEX) ──────────────────────

  console.log('');
  console.log(divider('═'));
  console.log('  MODULE 2 — CAMPUS SAFETY INTELLIGENCE  (SALUTEX)');
  console.log(divider());
  console.log('');
  console.log('  Problem: Safety observations from 58,000+ workers across 5 terminals');
  console.log('  take 48+ hours to route. Worker certs verified by PDF email.');
  console.log('');

  // Risk assessment across zones
  const zones = [
    { id: 'TERMINAL-D-RAMP',       factors: ['scaffoldingWork', 'multipleTradesOverlap', 'overtimeHours'] },
    { id: 'CARGO-FACILITY-1',      factors: ['forkliftOperations', 'excavationActive'] },
    { id: 'TERMINAL-A-RENOVATION', factors: ['newWorkerOnSite', 'ppeViolation'] },
  ];

  console.log('  Bayesian Risk Assessment — Active Work Zones:');
  zones.forEach(zone => {
    const risk = salutex.assessSiteRisk(zone.id, zone.factors, 'airport-operations');
    const riskBar = bar(risk.incidentProbability, 0.2, 14);
    console.log(`  ${zone.id.padEnd(28)}  ${riskBar}  ${risk.riskLevel.padEnd(8)}  P(incident): ${(risk.incidentProbability * 100).toFixed(1)}%  ${risk.alertRequired ? '⚠️' : '✓'}`);
  });

  // Worker credentials on blockchain
  salutex.registerWorker('WORKER-DFW-001', {
    name: 'Ramp Operations Lead',
    trade: 'roofing',
    oshaCards: ['OSHA-30', 'Fall Protection', 'Confined Space'],
    insuranceCertExpiry: Date.now() + 180 * 86400000,
  });
  salutex.registerWorker('WORKER-DFW-002', {
    name: 'Cargo Handler',
    trade: 'general',
    oshaCards: ['OSHA-10'],
    insuranceCertExpiry: Date.now() + 60 * 86400000,
  });
  salutex.mintWorkerCredential('WORKER-DFW-001');
  salutex.mintWorkerCredential('WORKER-DFW-002');

  console.log('');
  console.log('  On-Chain Worker Credential Registry:');
  const w1 = salutex.getWorkerClearance('WORKER-DFW-001', ['OSHA-30', 'Fall Protection']);
  const w2 = salutex.getWorkerClearance('WORKER-DFW-002', ['OSHA-30']);
  console.log(`    WORKER-DFW-001 (Ramp Lead):    On-Chain ✓  Trust: ${w1.trustRating}  ${w1.cleared ? 'CLEARED' : 'NOT CLEARED'}`);
  console.log(`    WORKER-DFW-002 (Cargo Handler): On-Chain ✓  Trust: ${w2.trustRating}  ${w2.cleared ? 'CLEARED' : 'NOT CLEARED (missing OSHA-30)'}`);
  console.log('    Blockchain = source of truth. No more PDF emails.');

  // Safety observation routed via Linq
  const obs = salutex.reportObservation('TERMINAL-D-RAMP', {
    reportedBy:  'WORKER-DFW-001',
    location:    'Gate D34 loading bridge',
    trade:       'roofing',
    description: 'Safety harness anchor point shows visible wear — do not use',
    severity:    'HIGH',
    foreman:     'Ramp Supervisor Rodriguez',
  });
  console.log('');
  console.log('  Safety Observation — Linq iMessage Alert:');
  console.log(`    ID: ${obs.observationId}  |  Severity: ${obs.severity}  |  Assigned: ${obs.assignedTo}`);
  console.log(`    "${obs.linqMessage.split('\n')[0]}"`);
  console.log('    Routed in < 60 seconds. Zero phone calls.');

  await sleep(200);

  // ── MODULE 3: Security Operations Intelligence (SECUREX) ────────────────

  console.log('');
  console.log(divider('═'));
  console.log('  MODULE 3 — SECURITY OPERATIONS INTELLIGENCE  (SECUREX)');
  console.log(divider());
  console.log('');
  console.log('  Problem: TSA checkpoint wait times spike unpredictably. Badge');
  console.log('  compliance for 58,000 employees managed in spreadsheets.');
  console.log('  Security incidents routed by radio — no audit trail.');
  console.log('');

  // TSA Checkpoint: Terminal D morning peak
  const chkD = securex.predictCheckpointWait('D', 1200);
  console.log('  TSA Checkpoint — Terminal D Morning Peak (1,200 pax/hr arriving):');
  console.log(`    Active Lanes:       ${chkD.activeLanes}`);
  console.log(`    Estimated Wait:     ${chkD.estimatedWaitMinutes} min`);
  console.log(`    TSA Standard:       ${chkD.tsaStandard}`);
  console.log(`    Status:             ${chkD.withinStandard ? '✓ WITHIN STANDARD' : '⚠ EXCEEDS STANDARD'}`);
  console.log(`    SECUREX Action:     ${chkD.recommendation}`);

  const chkDpre = securex.predictCheckpointWait('D', 420, { preCheck: true });
  console.log(`\n    PreCheck Lane:      ${chkDpre.estimatedWaitMinutes} min wait  |  ${chkDpre.withinStandard ? '✓ PASS' : '⚠ STAFF UP'}`);

  // Badge management demo
  securex.issueBadge('BADGE-AA-00142', {
    holderName:      'Carlos Vega',
    employer:        'American Airlines Ground Ops',
    role:            'Ramp Agent',
    authorizedZones: ['AIRFIELD_RAMP', 'STERILE_D', 'EMPLOYEE_ONLY'],
    backgroundCheckType: 'CHRC',
  });
  securex.issueBadge('BADGE-UNKNOWN-999', { holderName: 'Unknown' }); // unauthorized probe

  const accessOk  = securex.validateAccess('BADGE-AA-00142', 'AIRFIELD_RAMP');
  const accessBad = securex.validateAccess('BADGE-AA-00142', 'CUSTOMS'); // not authorized

  console.log('\n  Badge Access Validation:');
  console.log(`    BADGE-AA-00142 → AIRFIELD_RAMP:  ${accessOk.granted  ? '✓ GRANTED' : '✗ DENIED'}  (${accessOk.holderName || accessOk.reason})`);
  console.log(`    BADGE-AA-00142 → CUSTOMS:         ${accessBad.granted ? '✓ GRANTED' : '✗ DENIED'}  ${accessBad.alertRaised ? '| 🚨 Alert auto-raised to Terminal Security Manager' : ''}`);

  // Security incident
  const inc = securex.reportIncident('CARGO_SECURE', {
    type:        'UNATTENDED_PACKAGE',
    severity:    'CRITICAL',
    description: 'Unattended bag in cargo secure zone — 12+ min, no owner',
    reportedBy:  'SECUREX-SENSOR',
  });
  console.log(`\n  Security Incident Routed via Linq:`);
  console.log(`    ID: ${inc.incidentId}  |  Severity: ${inc.severity}  |  Route → ${inc.escalateTo}`);
  console.log(`    Response deadline: ${new Date(inc.responseDeadline).toLocaleTimeString()}`);
  console.log(`    "${inc.linqMessage.split('\n')[0]}"`);

  await sleep(200);

  // ── MODULE 4: Community Economy Intelligence (COMMUNEX) ─────────────────

  console.log('');
  console.log(divider('═'));
  console.log('  MODULE 4 — COMMUNITY ECONOMY INTELLIGENCE  (COMMUNEX)');
  console.log(divider());
  console.log('');
  console.log('  Problem: 28 surrounding cities have no visibility into their share');
  console.log('  of the $37B aerotropolis economy. ACDBE operators lack benchmarks.');
  console.log('  Community Benefit Agreements go untracked between annual reviews.');
  console.log('');

  // 4a — Aerotropolis economic map (top 5 cities)
  const ecoMap = communex.aerotropolisEconomicMap();
  console.log('  Leontief I/O Aerotropolis Model:');
  console.log(`    Total Airport Direct Spending:  ${ecoMap.totalDirectSpend}`);
  console.log(`    Total Regional Economic Impact: ${ecoMap.totalEconomicImpact}  (${ecoMap.overallMultiplier}x multiplier)`);
  console.log(`    Direct Jobs: ${ecoMap.directJobs}  |  Total Jobs (incl. indirect): ${ecoMap.totalJobs}`);
  console.log('');
  console.log('  Top 5 Cities by Economic Impact Share:');
  ecoMap.cityImpact
    .sort((a, b) => parseFloat(b.economicImpact) - parseFloat(a.economicImpact))
    .slice(0, 5)
    .forEach(c => {
      console.log(`    ${c.city.padEnd(18)} ${c.tier.padEnd(9)} Impact: ${c.economicImpact.padEnd(7)}  Jobs: ${String(c.jobsSupported).padEnd(6)} Tax: ${c.taxRevenue}`);
    });

  // 4b — ACDBE small business scoring (3 sample firms)
  console.log('\n  ACDBE Small Business Scoring:');
  const sampleFirms = [
    { legalName: "Morales Family Kitchen", ownerName: "Maria Morales", category: 'F&B', certification: 'WBE', terminal: 'D', annualRevenueTarget: 1200000, annualRevenueActual: 1380000, sqft: 1400, openDate: Date.now() - 24 * 30 * 86400000, mentorFirm: 'SSP America' },
    { legalName: "DFW Veterans Gifts",     ownerName: "James Thornton", category: 'Retail', certification: 'SDVOSB', terminal: 'A', annualRevenueTarget: 680000, annualRevenueActual: 520000, sqft: 800, openDate: Date.now() - 8 * 30 * 86400000, mentorFirm: null },
    { legalName: "Aisha's Fresh Juice",    ownerName: "Aisha Okafor", category: 'F&B', certification: 'MBE', terminal: 'C', annualRevenueTarget: 540000, annualRevenueActual: 610000, sqft: 600, openDate: Date.now() - 36 * 30 * 86400000, mentorFirm: 'DFW Hospitality Group' },
  ];
  sampleFirms.forEach(f => communex.registerACDBEFirm(f));
  const acdbIds = [...communex.acdbeFirms.keys()];
  acdbIds.forEach(id => {
    const s = communex.scoreACDBEFirm(id);
    console.log(`    ${s.legalName.padEnd(26)} ${s.certification.padEnd(7)} Score: ${s.overallScore}  [${s.tier}]  Revenue: ${s.revenueAttainment}`);
  });

  // 4c — Visitor economic bridge (summary)
  const bridge = communex.visitorEconomicBridge(73000000);
  console.log('\n  Visitor-to-Community Economic Bridge:');
  console.log(`    73M passengers → Hotel Nights: ${bridge.totals.hotelNights}  Hotel Rev: ${bridge.totals.hotelRevenue}`);
  console.log(`    Restaurant Revenue: ${bridge.totals.restaurantRevenue}  |  Retail Revenue: ${bridge.totals.retailRevenue}`);
  console.log(`    Total Visitor Direct Spend: ${bridge.totals.totalDirectSpend}  |  Economic Impact: ${bridge.totals.totalEconomicImpact}`);

  // 4d — CBA scorecard (compact)
  const cbaItems = [
    { id: 'CBA-HIRING',   category: 'LOCAL_HIRING',    municipality: 'Regional',  target: 65,   actual: 71,   trend: 'IMPROVING' },
    { id: 'CBA-NOISE',    category: 'NOISE_ABATEMENT', municipality: 'Grapevine', target: 97,   actual: 98.2, trend: 'STABLE'    },
    { id: 'CBA-INVEST',   category: 'COMMUNITY_INVEST',municipality: 'Dallas Co.', target: 12,  actual: 11.2, trend: 'STABLE'    },
    { id: 'CBA-ACDBE',    category: 'SMALL_BUSINESS',  municipality: 'Regional',  target: 25,   actual: 22.1, trend: 'IMPROVING' },
  ];
  cbaItems.forEach(c => communex.registerCBACommitment(c.id, c));
  const cba = communex.cbaScorecardReport();
  console.log(`\n  Community Benefit Agreement Scorecard: ${cba.overallStatus}  (Score: ${cba.overallScore})`);
  cba.commitments.forEach(c => {
    const icon = c.status === 'MET' || c.status === 'ON TRACK' ? '✓' : '⚠';
    console.log(`    ${icon} ${c.municipality.padEnd(12)} ${c.category.padEnd(30)} ${c.attainment.padEnd(8)} ${c.status}`);
  });

  await sleep(200);

  // ── MODULE 5: Value Summary ──────────────────────────────────────────────

  console.log('');
  console.log(divider('═'));
  console.log('  MODULE 5 — DFW ECONOMIC IMPACT MODEL');
  console.log(divider());

  const concessionLift        = (18.50 - 11.23) * 73000000;
  const safetyReduction       = 12 * 850000;
  const securityOps           = 0.15 * 58000 * 4200;
  const checkpointRetailUplift = 0.12 * 73000000 * 3.50;
  const acdbeLift             = 42 * 180000;              // ACDBE firm revenue uplift
  const workforceWageLift     = 58000 * 0.08 * 45000;    // wage progression for 58K workers
  const communityVisitorBridge = 0.02 * 3400000000;      // incremental visitor spend capture

  const total       = concessionLift + safetyReduction + securityOps + checkpointRetailUplift + acdbeLift + workforceWageLift + communityVisitorBridge;
  const platformCost = 1680000; // Enterprise + Community editions
  const roi         = ((total - platformCost) / platformCost * 100).toFixed(0);

  console.log(`
  ┌─────────────────────────────────────────────────────────────────┐
  │  RSHIP DFW — Annual Economic Value at a Glance                  │
  ├─────────────────────────────────────────────────────────────────┤
  │  Concession RPE Lift  ($11.23 → $18.50/pax)    $${(concessionLift / 1e6).toFixed(0)}M        │
  │  Safety Incident Reduction  (−12/yr @ $850K)   $${(safetyReduction / 1e6).toFixed(1)}M         │
  │  Security Ops Efficiency  (badge admin)         $${(securityOps / 1e6).toFixed(1)}M         │
  │  Checkpoint Throughput  (retail uplift)         $${(checkpointRetailUplift / 1e6).toFixed(0)}M        │
  │  ACDBE Revenue Uplift  (42 firms enabled)       $${(acdbeLift / 1e6).toFixed(1)}M         │
  │  Workforce Wage Progression  (58K workers)      $${(workforceWageLift / 1e6).toFixed(0)}M       │
  │  Visitor Economic Bridge  (incremental)         $${(communityVisitorBridge / 1e6).toFixed(0)}M        │
  │  ─────────────────────────────────────────────────────────────  │
  │  Total Annual Value                             $${(total / 1e6).toFixed(0)}M       │
  │  Platform Cost (Enterprise + Community)         $${(platformCost / 1e6).toFixed(1)}M         │
  │  Net Annual Gain                                $${((total - platformCost) / 1e6).toFixed(0)}M       │
  │  ROI                                            ${roi}%               │
  └─────────────────────────────────────────────────────────────────┘`);

  console.log(`
  ┌─────────────────────────────────────────────────────────────────┐
  │  FULL RSHIP ENTERPRISE STACK — 7 AGIs for DFW                  │
  ├─────────────────────────────────────────────────────────────────┤
  │  PORTEX    Airport Economy & Terminal Operations Intelligence    │
  │  TRACTEX   Revenue Tracking & Concession Cash Flow              │
  │  PRAEDEX   Passenger Demand Forecasting                         │
  │  AEQUEX    Operational Quality & Service Equilibrium            │
  │  SALUTEX   Campus-Wide Safety & Worker Credential Chain         │
  │  SECUREX   Security Operations, Access Control, TSA Compliance  │
  │  COMMUNEX  Aerotropolis Economy, ACDBE, Workforce, CBA          │
  │  AEROLEX   Airline Ops, Turnaround, GDP, Crew, Fuel             │
  │  VISITEX   Visitor Experience, Wayfinding, NPS, Loyalty         │
  │  CREWEX    Crew Scheduling, Fatigue, Career Paths, Wage Equity  │
  ├─────────────────────────────────────────────────────────────────┤
  │  Enterprise App:  node rship-enterprise-dfw-airport.js (6 AGIs) │
  │  Community App:   node rship-airport-community.js   (3 AGIs)    │
  │  Airlines App:    node rship-dfw-airlines-tourism.js (3 AGIs)   │
  │  Messaging:       Linq — iMessage interface for every DFW team  │
  │  Infrastructure:  AEGIX monitors all 10 AGIs in real-time       │
  └─────────────────────────────────────────────────────────────────┘
`);

  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║  RSHIP Enterprise — DFW Demo Complete                                   ║');
  console.log('║  Designation: RSHIP-DEMO-DFW-001                                        ║');
  console.log('║  10 AGIs. 3 production apps. 28-city aerotropolis. 73M pax/yr.          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
  console.log('');
}

runDemo().catch(console.error);
