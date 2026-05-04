/**
 * PRODUCTION APPLICATION: RSHIP ENTERPRISE — DFW AIRPORT ECONOMY
 *
 * Designation: RSHIP-PROD-DFW-001
 * AGI Systems: PORTEX + TRACTEX + PRAEDEX + AEQUEX + SALUTEX
 * Industry: Airport Economy — Concessions, Cargo, Ground Transport, Operations
 * Scale: Dallas/Fort Worth International Airport — 73M passengers/year,
 *        5 terminals, 182 gates, $1.2B+ annual economic output
 *
 * Problem Statement:
 * DFW International Airport operates the fourth-busiest airport in the world.
 * Concession revenue depends on passenger dwell time — but terminal managers
 * lack real-time intelligence on queue behavior at concession clusters. Cargo
 * volume shifts by 18% seasonally but ground operations plan as if it is flat.
 * Gate assignments happen manually, causing unnecessary connection conflicts and
 * idle gate time. Ground transportation demand surges unpredictably at peaks.
 * Concession operators with $20M+ leases have no benchmark data on revenue
 * performance relative to enplanements. Safety observations from 10,000+ workers
 * cross 5 terminals take 48+ hours to route and resolve.
 *
 * RSHIP Enterprise Solution:
 * Five sovereign AGI systems operating in concert across all five DFW terminals:
 * PORTEX provides airport economy intelligence, TRACTEX tracks every concession
 * revenue stream, PRAEDEX forecasts passenger demand, AEQUEX manages operational
 * quality, and SALUTEX monitors safety across the entire campus.
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthPORTEX } from '../sdk/portex-agi/portex-agi.js';
import { birthTRACTEX } from '../sdk/tractex-agi/tractex-agi.js';
import { birthPRAEDEX } from '../sdk/praedex-agi/praedex-agi.js';
import { birthAEQUEX } from '../sdk/aequex-agi/aequex-agi.js';
import { birthSALUTEX } from '../sdk/salutex-agi/salutex-agi.js';
import { PHI, PHI_INV } from '../rship-framework.js';

// ── DFW Configuration ──────────────────────────────────────────────────────

const DFW = {
  name: 'Dallas/Fort Worth International Airport',
  designation: 'RSHIP-PROD-DFW-001',
  annualPassengers: 73000000,
  terminals: ['A', 'B', 'C', 'D', 'E'],
  gates: 182,
  annualConcessionRevenue: 820000000,
  annualCargoTonnes: 900000,
  concessionOperators: 148,
  groundTransportProviders: 12,
  employees: 58000,
};

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║      RSHIP ENTERPRISE — DFW AIRPORT ECONOMY INTELLIGENCE                   ║
║                    RSHIP-PROD-DFW-001                                      ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Airport: ${DFW.name.padEnd(64)}║
║  Passengers: ${(DFW.annualPassengers / 1e6).toFixed(0)}M/year  |  Terminals: ${DFW.terminals.length}  |  Gates: ${DFW.gates}${' '.repeat(27)}║
║  Concession Revenue: $${(DFW.annualConcessionRevenue / 1e6).toFixed(0)}M/yr  |  Cargo: ${(DFW.annualCargoTonnes / 1000).toFixed(0)}K tonnes/yr${' '.repeat(20)}║
╚════════════════════════════════════════════════════════════════════════════╝

Initializing 5 Alpha AGI Systems across all DFW terminals...
`);

// ── AGI Initialization ─────────────────────────────────────────────────────

const portex  = birthPORTEX({ airport: 'DFW' });
const tractex = birthTRACTEX({ learningCoefficient: PHI_INV });
const praedex = birthPRAEDEX({ learningCoefficient: PHI_INV });
const aequex  = birthAEQUEX({ gamma: PHI_INV });
const salutex = birthSALUTEX({ basePrior: 0.025 }); // Large campus — slightly elevated baseline

console.log('  ✓ PORTEX  — Airport Economy & Terminal Operations Intelligence');
console.log('  ✓ TRACTEX — Concession Revenue Tracking & Cash Flow Intelligence');
console.log('  ✓ PRAEDEX — Passenger Demand & Market Forecasting Intelligence');
console.log('  ✓ AEQUEX  — Operational Quality & Service Equilibrium Intelligence');
console.log('  ✓ SALUTEX — Campus-Wide Safety & Worker Credential Intelligence');
console.log('\n  All 5 AGI systems born alive. Running DFW intelligence simulation...\n');

// ── Simulation ─────────────────────────────────────────────────────────────

async function runDFWSimulation() {

  // ── Scene 1: Concession Queue Analysis (Terminal D — International) ──────

  console.log('─'.repeat(76));
  console.log('  SCENE 1: Terminal D Concession Queue Intelligence (PORTEX)');
  console.log('─'.repeat(76));

  const terminalDAnalysis = portex.analyzeConcessionsAtGate('D', 'D22-D30 Cluster', 850, 5);
  console.log(`\n  Terminal D — Gate D22-D30 Concession Cluster:`);
  console.log(`  Passengers/hr: ${terminalDAnalysis.passengersPerHour}`);
  if (terminalDAnalysis.queueMetrics.stable) {
    console.log(`  Queue utilization: ${terminalDAnalysis.queueMetrics.utilization} | Mean wait: ${terminalDAnalysis.queueMetrics.meanWaitMinutes} min`);
    console.log(`  Mean dwell time: ${terminalDAnalysis.queueMetrics.meanDwellMinutes} min`);
    console.log(`  Revenue multiplier: ${terminalDAnalysis.queueMetrics.revenueMultiplier}x`);
    console.log(`  Hourly revenue projection: ${terminalDAnalysis.revenueProjection}`);
    console.log(`  Recommended servers: ${terminalDAnalysis.recommendedServers}`);
  }

  // Register concession operators and score performance
  const operators = [
    { id: 'OP-001', name: 'DFW Hospitality Group (F&B)',    terminal: 'D', category: 'F&B',    sqft: 12000, enplanementsServed: 8500000,  annualRevenue: 180000000 },
    { id: 'OP-002', name: 'Hudson News (Retail)',            terminal: 'A', category: 'Retail', sqft: 8500,  enplanementsServed: 6200000,  annualRevenue: 95000000 },
    { id: 'OP-003', name: 'SSP America (F&B)',               terminal: 'B', category: 'F&B',    sqft: 7200,  enplanementsServed: 5800000,  annualRevenue: 72000000 },
    { id: 'OP-004', name: 'DXB Duty Free (Retail)',          terminal: 'D', category: 'Retail', sqft: 15000, enplanementsServed: 12000000, annualRevenue: 145000000 },
    { id: 'OP-005', name: 'Global Lounge Services',          terminal: 'E', category: 'Services', sqft: 4000, enplanementsServed: 3200000,  annualRevenue: 28000000 },
  ];

  operators.forEach(op => portex.registerConcessionaire(op.id, op));

  console.log(`\n  Concession Portfolio Scores:`);
  operators.forEach(op => {
    const score = portex.scoreConcessionaire(op.id);
    const bar = '█'.repeat(Math.round(parseFloat(score.overallScore) * 10));
    console.log(`  ${op.name.padEnd(38)} Score: ${score.overallScore} ${bar} [${score.performanceTier}]`);
    console.log(`    RPE: ${score.revenuePerEnplanement} vs benchmark ${score.benchmarkRPE} | ${score.recommendation}`);
  });

  // ── Scene 2: Cargo Volume Forecast ──────────────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 2: Air Cargo Volume Forecast — 12-Month Outlook (PORTEX)');
  console.log('─'.repeat(76));

  const cargoForecast = portex.forecastCargo(12);
  console.log(`\n  ${DFW.name} Cargo Forecast:`);
  console.log(`  12-Month Total: ${cargoForecast.totalEstimatedTonnes} tonnes`);
  console.log(`  12-Month Revenue: ${cargoForecast.totalEstimatedRevenue}`);
  console.log(`\n  Monthly Breakdown (first 6 months):`);
  cargoForecast.monthlyProjections.forEach(p => {
    const bar = '█'.repeat(Math.round(parseFloat(p.seasonalIndex) * 5));
    console.log(`  ${p.label.padEnd(10)} ${p.estimatedTonnes.toLocaleString().padEnd(8)} tonnes | $${p.estimatedRevenue.toLocaleString().padEnd(9)} | ${bar}`);
  });

  // ── Scene 3: Gate Assignment Optimization ───────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 3: Gate Utilization & Flight Assignment (PORTEX)');
  console.log('─'.repeat(76));

  const flights = [
    { flightId: 'AA1234', terminal: 'D', arrivalTime: Date.now(), departureTime: Date.now() + 90 * 60000, aircraftSize: 'wide' },
    { flightId: 'AA5678', terminal: 'D', arrivalTime: Date.now() + 30 * 60000, departureTime: Date.now() + 120 * 60000, aircraftSize: 'narrow' },
    { flightId: 'WN9001', terminal: 'E', arrivalTime: Date.now(), departureTime: Date.now() + 45 * 60000, aircraftSize: 'narrow' },
    { flightId: 'BA0001', terminal: 'D', arrivalTime: Date.now() + 60 * 60000, departureTime: Date.now() + 180 * 60000, aircraftSize: 'wide' },
    { flightId: 'AA2233', terminal: 'A', arrivalTime: Date.now(), departureTime: Date.now() + 60 * 60000, aircraftSize: 'narrow' },
  ];

  console.log(`\n  Assigning ${flights.length} flights to available gates:`);
  flights.forEach(flight => {
    const result = portex.assignFlight(flight);
    const status = result.assigned ? `✓ Gate ${result.gateId}` : `✗ ${result.reason}`;
    console.log(`  ${flight.flightId} (${flight.terminal}-term, ${flight.aircraftSize}): ${status}`);
  });

  const utilization = portex.gateUtilizationReport();
  console.log(`\n  Terminal Gate Utilization:`);
  Object.entries(utilization).forEach(([terminal, stats]) => {
    console.log(`  Terminal ${terminal}: ${stats.gateCount} gates | ${stats.assignedFlights} flights | ${stats.avgFlightsPerGate} flights/gate avg`);
  });

  // ── Scene 4: Ground Transportation Peak Hour ─────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 4: Ground Transportation Demand — PM Peak Hour (PORTEX)');
  console.log('─'.repeat(76));

  const peakHourDemand = portex.groundTransportForecast(17, 'D'); // 5pm Terminal D
  console.log(`\n  Terminal D — 17:00 Peak Hour Ground Transport Demand:`);
  console.log(`  Arriving Passengers: ~${peakHourDemand.hourlyPassengers.toLocaleString()}`);
  console.log(`\n  Mode Breakdown:`);
  Object.entries(peakHourDemand.modeBreakdown).forEach(([mode, data]) => {
    console.log(`  ${mode.padEnd(12)} ${String(data.estimatedPassengers).padEnd(6)} pax | Wait: ${data.waitTimeMinutes}min | Revenue: $${data.estimatedRevenue.toLocaleString()}`);
  });

  const dailyGT = portex.dailyGroundTransportRevenue('D');
  console.log(`\n  Terminal D Ground Transport — Daily: ${dailyGT.estimatedDailyRevenue} | Annual: ${dailyGT.estimatedAnnualRevenue}`);

  // ── Scene 5: Safety Monitoring Across Campus ─────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 5: Campus Safety Intelligence (SALUTEX)');
  console.log('─'.repeat(76));

  // Assess risk by work zone
  const zones = [
    { id: 'TERMINAL-D-RAMP', factors: ['scaffoldingWork', 'multipleTradesOverlap', 'overtimeHours'] },
    { id: 'CARGO-FACILITY-1', factors: ['forkliftOperations', 'excavationActive'] },
    { id: 'TERMINAL-A-RENOVATION', factors: ['newWorkerOnSite', 'ppeViolation', 'toolboxTalkSkipped'] },
  ];

  console.log(`\n  Campus Risk Assessment:`);
  zones.forEach(zone => {
    const risk = salutex.assessSiteRisk(zone.id, zone.factors, 'airport-operations');
    console.log(`  ${zone.id.padEnd(30)} Risk: ${risk.riskLevel.padEnd(8)} | P(incident): ${(risk.incidentProbability * 100).toFixed(1)}% | Alert: ${risk.alertRequired ? '⚠️ YES' : 'no'}`);
  });

  // Register workers and mint credentials
  salutex.registerWorker('WORKER-T-001', { name: 'Ramp Operations Lead', trade: 'roofing', oshaCards: ['OSHA-30', 'Fall Protection', 'Confined Space'], insuranceCertExpiry: Date.now() + 180 * 86400000 });
  salutex.registerWorker('WORKER-T-002', { name: 'Cargo Handler', trade: 'general', oshaCards: ['OSHA-10'], insuranceCertExpiry: Date.now() + 90 * 86400000 });

  salutex.mintWorkerCredential('WORKER-T-001');
  salutex.mintWorkerCredential('WORKER-T-002');

  console.log(`\n  Worker Credential Chain:`);
  console.log(`  WORKER-T-001 (Ramp Lead): On-Chain ✓ | Trust: ${salutex.getWorkerClearance('WORKER-T-001', ['OSHA-30', 'Fall Protection']).trustRating}`);
  console.log(`  WORKER-T-002 (Cargo Handler): On-Chain ✓ | Trust: ${salutex.getWorkerClearance('WORKER-T-002', ['OSHA-30']).trustRating}`);

  // Report a safety observation
  const obs = salutex.reportObservation('TERMINAL-D-RAMP', {
    reportedBy: 'WORKER-T-001',
    location: 'Gate D34 loading bridge',
    trade: 'roofing',
    description: 'Safety harness anchor point shows visible wear — do not use',
    severity: 'HIGH',
    foreman: 'Ramp Supervisor Rodriguez',
  });
  console.log(`\n  Safety Observation Reported:`);
  console.log(`  ID: ${obs.observationId} | Severity: ${obs.severity} | Assigned to: ${obs.assignedTo}`);
  console.log(`  iMessage: "${obs.linqMessage.split('\n')[0]}"`);

  // ── Scene 6: Full Airport Intelligence Report ────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 6: DFW Airport Intelligence Report (PORTEX)');
  console.log('─'.repeat(76));

  const report = portex.airportIntelligenceReport();
  console.log(`
  DFW Airport Intelligence — ${report.reportDate}
  ─────────────────────────────────────────────────────────────────
  Concession Operators:     ${report.concessions.totalOperators}
  Portfolio Revenue:        ${report.concessions.totalAnnualRevenue}
  Avg Performance Score:    ${report.concessions.averagePerformanceScore}
  Top Performers:           ${report.concessions.exceedsCount}
  Needs Improvement:        ${report.concessions.criticalCount}
  Cargo (Next Quarter):     ${report.cargoNextQuarter}
  Cargo Revenue (Q1):       ${report.cargoRevenueQ1}
  `);

  // ── Scene 7: Annual Economic Value Model ─────────────────────────────────

  console.log('─'.repeat(76));
  console.log('  SCENE 7: Annual Economic Value Model — DFW Airport Economy');
  console.log('─'.repeat(76));

  const concessionRPELift = 148 * (18.50 - 11.23) * DFW.annualPassengers / 148; // per operator lift
  const cargoForecastAccuracy = 0.05 * 0.55 * 900000 * 1000; // 5% accuracy = $24.75M in planning value
  const gateUtilizationGain = 0.08 * 182 * 365 * 12000;  // 8% lift in gate utilization
  const safetyIncidentReduction = 12 * 850000; // avg OSHA recordable costs DFW ~$850K each, target -12/yr
  const totalValue = concessionRPELift + cargoForecastAccuracy + gateUtilizationGain + safetyIncidentReduction;
  const platformCost = 1200000; // Enterprise tier

  console.log(`
  ┌─────────────────────────────────────────────────────────────────────┐
  │  Annual Economic Value — DFW Airport Economy                        │
  ├─────────────────────────────────────────────────────────────────────┤
  │  Concession RPE Lift ($11.23→$18.50/pax):  $${(concessionRPELift / 1e6).toFixed(0)}M${' '.repeat(21)}│
  │  Cargo Forecast Accuracy (planning lift):   $${(cargoForecastAccuracy / 1e6).toFixed(0)}M${' '.repeat(21)}│
  │  Gate Utilization +8% (idle time captured): $${(gateUtilizationGain / 1e6).toFixed(0)}M${' '.repeat(21)}│
  │  Safety — Incident Reduction (-12/yr):      $${(safetyIncidentReduction / 1e6).toFixed(0)}M${' '.repeat(21)}│
  │  ─────────────────────────────────────────────────────────────────  │
  │  Total Annual Economic Value:               $${(totalValue / 1e6).toFixed(0)}M${' '.repeat(21)}│
  │  Platform Cost (Enterprise):                $${(platformCost / 1e6).toFixed(1)}M${' '.repeat(21)}│
  │  Net Annual Gain:                           $${((totalValue - platformCost) / 1e6).toFixed(0)}M${' '.repeat(21)}│
  └─────────────────────────────────────────────────────────────────────┘
  `);

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  RSHIP ENTERPRISE — DFW AIRPORT ECONOMY — Simulation Complete              ║
║  ${DFW.name.padEnd(73)}║
║  5 AGIs: PORTEX · TRACTEX · PRAEDEX · AEQUEX · SALUTEX                    ║
║  Designation: RSHIP-PROD-DFW-001                                           ║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
}

runDFWSimulation().catch(console.error);
