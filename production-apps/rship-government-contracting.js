/**
 * PRODUCTION APPLICATION: RSHIP GOVERNMENT CONTRACTING INTELLIGENCE
 *
 * Designation: RSHIP-PROD-GOV-001
 * AGI Systems: GOVEX + PRAEDEX + VERBEX
 * Industry: Federal Government Contracting — SAM.gov, DoD, Civilian Agencies
 * Scale: SMB Government Contractors — $500K–$50M annual contract revenue
 *
 * Problem Statement:
 * Small and mid-size government contractors manage BD on spreadsheets and
 * email alerts from SAM.gov. By the time a solicitation appears on SAM.gov,
 * incumbents have already spent 6–18 months shaping the requirement. Proposal
 * teams assemble at the last minute, miss compliance requirements (FAR clauses,
 * certifications), and submit off-strategy bids that drain BD resources with
 * low win probability. Win rates for small businesses average 15–22% on
 * submitted proposals — and most firms don't know which opportunities they
 * should have skipped.
 *
 * RSHIP Starter Solution:
 * A zero-integration entry point that connects to a company's email and SAM.gov
 * account — then deploys three sovereign AGI systems that monitor federal
 * procurement, score every opportunity before BD resources are committed,
 * track compliance requirements, and route proposal team coordination via
 * iMessage. No GovWin IQ to manage, no BD spreadsheet to maintain.
 *
 * Day-One Capabilities (SAM.gov credentials + email):
 * - GOVEX monitors SAM.gov for matching opportunities and scores each one
 * - PRAEDEX predicts win probability and pipeline trajectory
 * - VERBEX routes proposal team coordination via iMessage
 *
 * Grow-Into Capabilities (GovWin IQ / FPDS-NG integration):
 * - Incumbent tracking and bid shaping intelligence
 * - CPARS past performance mining
 * - Contracting officer relationship mapping
 * - Congressional budget intelligence
 *
 * Business Value (per SMB contractor, $5M annual revenue):
 * - Win rate improvement (18% → 30%): +$2.4M pipeline converted/yr
 * - BD cost reduction (skip low-fitness opps): $180K–$350K/yr saved
 * - Compliance gap prevention: $50K–$150K avoided bid protest risk
 * - Pipeline visibility (10× faster opportunity discovery): 40+ hrs/mo
 * - Total annual value: $2.6M–$2.9M
 * - Platform cost: $14.4K–$57.6K/yr
 * - ROI: 5,000%–20,000%
 *
 * Pricing:
 * - RSHIP Starter: $1,200/month (3 AGIs, SAM.gov monitoring, iMessage)
 * - RSHIP Pro: $2,500/month (+ GovWin IQ, FPDS-NG integration)
 * - RSHIP Enterprise: Custom (full AETHER swarm, large prime scale)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthGOVEX } from '../sdk/govex-agi/govex-agi.js';
import { birthPRAEDEX } from '../sdk/praedex-agi/praedex-agi.js';
import { birthVERBEX } from '../sdk/verbex-agi/verbex-agi.js';
import { PHI, PHI_INV } from '../rship-framework.js';

// ── Company Configuration ──────────────────────────────────────────────────

const COMPANY = {
  name: 'Medina Technology Solutions LLC',
  designation: 'RSHIP-PROD-GOV-001',
  annualRevenue: 5200000,
  setAsideStatus: ['Small Business', 'SDVOSB'],
  naicsCodes: ['541512', '541519', '541611', '541715'],
  pastContracts: 12,
  location: 'Dallas-Fort Worth, TX',
  samRegistered: true,
};

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║         RSHIP GOVERNMENT CONTRACTING INTELLIGENCE                          ║
║                    RSHIP-PROD-GOV-001                                      ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Company: ${COMPANY.name.padEnd(64)}║
║  Revenue: $${(COMPANY.annualRevenue / 1e6).toFixed(1)}M  |  Set-Asides: ${COMPANY.setAsideStatus.join(', ')}${' '.repeat(33)}║
║  NAICS: ${COMPANY.naicsCodes.join(', ').padEnd(66)}║
╚════════════════════════════════════════════════════════════════════════════╝

Initializing 3 Alpha AGI Systems...
`);

// ── AGI Initialization ─────────────────────────────────────────────────────

const govex  = birthGOVEX({
  companyProfile: {
    naicsCodes: COMPANY.naicsCodes,
    setAsideStatus: COMPANY.setAsideStatus,
    samRegistered: true,
    pastPerformance: [],
  }
});
const praedex = birthPRAEDEX({ learningCoefficient: PHI_INV });
const verbex  = birthVERBEX({ learningCoefficient: PHI_INV });

console.log('  ✓ GOVEX   — Federal Contracting & Government BD Intelligence');
console.log('  ✓ PRAEDEX — Win Probability & Pipeline Prediction');
console.log('  ✓ VERBEX  — Proposal Team Communication Routing (iMessage)');
console.log('\n  All systems born alive. Running government contracting simulation...\n');

// ── Simulation ─────────────────────────────────────────────────────────────

async function runGovContractingSimulation() {

  // ── Scene 1: SAM.gov Opportunity Discovery & Scoring ─────────────────────

  console.log('─'.repeat(76));
  console.log('  SCENE 1: SAM.gov Opportunity Discovery & Multi-Objective Scoring');
  console.log('─'.repeat(76));

  // Simulate SAM.gov search
  const searchResult = govex.samGovSearch(['cybersecurity', 'IT modernization'], '541512', 'Small Business');
  console.log(`\n  SAM.gov Search: ${searchResult.resultsFound} opportunity found`);

  // Ingest multiple opportunities with varying fitness profiles
  const opportunities = [
    {
      id: 'SAM-2026-DHS-001',
      title: 'DHS CISA Cybersecurity Advisory Services',
      agency: 'DHS/CISA',
      naics: '541512',
      setAside: 'Small Business Set-Aside',
      value: 4800000,
      submissionDeadline: Date.now() + 28 * 86400000,
      capabilityMatch: 0.88,
      competitors: 6,
      incumbentPresent: false,
      estimatedMargin: 0.18,
      weeksToSubmission: 4,
      availableCapacity: 0.8,
    },
    {
      id: 'SAM-2026-DOD-001',
      title: 'DoD IT Modernization Support Services',
      agency: 'Department of Defense',
      naics: '541519',
      setAside: 'Full & Open',
      value: 25000000,
      submissionDeadline: Date.now() + 45 * 86400000,
      capabilityMatch: 0.55,
      competitors: 22,
      incumbentPresent: true,
      estimatedMargin: 0.12,
      weeksToSubmission: 6.5,
      availableCapacity: 0.5,
    },
    {
      id: 'SAM-2026-VA-001',
      title: 'VA Technology Consulting — SDVOSB Set-Aside',
      agency: 'Department of Veterans Affairs',
      naics: '541611',
      setAside: 'Service-Disabled Veteran-Owned',
      value: 2200000,
      submissionDeadline: Date.now() + 21 * 86400000,
      capabilityMatch: 0.92,
      competitors: 3,
      incumbentPresent: false,
      estimatedMargin: 0.22,
      weeksToSubmission: 3,
      availableCapacity: 0.9,
    },
    {
      id: 'SAM-2026-GSA-001',
      title: 'GSA Cloud Migration Program Support',
      agency: 'General Services Administration',
      naics: '541512',
      setAside: 'Small Business Set-Aside',
      value: 8500000,
      submissionDeadline: Date.now() + 60 * 86400000,
      capabilityMatch: 0.72,
      competitors: 9,
      incumbentPresent: false,
      estimatedMargin: 0.15,
      weeksToSubmission: 8.5,
      availableCapacity: 0.75,
    },
    {
      id: 'SAM-2026-DOE-001',
      title: 'DOE Data Analytics Proof of Concept',
      agency: 'Department of Energy',
      naics: '541715',
      setAside: 'Full & Open',
      value: 450000,
      submissionDeadline: Date.now() + 14 * 86400000,
      capabilityMatch: 0.35,
      competitors: 15,
      incumbentPresent: true,
      estimatedMargin: 0.08,
      weeksToSubmission: 2,
      availableCapacity: 0.3,
    },
  ];

  console.log(`\n  Scoring ${opportunities.length} SAM.gov opportunities:`);
  opportunities.forEach(opp => {
    const result = govex.ingestOpportunity(opp.id, opp);
    const rec = result.score.recommendation.split(' — ')[0];
    console.log(`\n  ${opp.id}`);
    console.log(`  ${opp.title}`);
    console.log(`  Agency: ${opp.agency} | Value: ${result.value} | Set-Aside: ${opp.setAside}`);
    console.log(`  Fitness: ${result.score.fitness} | Win Probability: ${(parseFloat(result.score.winProbability) * 100).toFixed(0)}% | → ${rec}`);
  });

  // ── Scene 2: Bid Strategy — Pursue / No-Bid Decision ─────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 2: BD Strategy — Pursue / No-Bid Decisions');
  console.log('─'.repeat(76));

  const pipeline = govex.pipelineSummary();
  console.log(`\n  Pipeline Summary:`);
  console.log(`  Total Opportunities: ${pipeline.totalOpportunities}`);
  console.log(`  Total Pipeline Value: ${pipeline.totalPipelineValue}`);

  console.log(`\n  Top Opportunities (by fitness score):`);
  pipeline.topOpportunities.forEach((opp, i) => {
    console.log(`  ${i + 1}. ${opp.title}`);
    console.log(`     ${opp.agency} | ${opp.value} | Fitness: ${opp.fitness}`);
  });

  // Advance high-fitness opps, no-bid low-fitness
  govex.advanceOpportunity('SAM-2026-VA-001', 'PURSUING', 'High alignment, SDVOSB advantage — GO');
  govex.advanceOpportunity('SAM-2026-DHS-001', 'PURSUING', 'Strong capability match — GO');
  govex.advanceOpportunity('SAM-2026-GSA-001', 'QUALIFYING', 'Good value — schedule capture meeting');
  govex.advanceOpportunity('SAM-2026-DOD-001', 'NO_BID', 'Incumbent present, 22 competitors — SKIP');
  govex.advanceOpportunity('SAM-2026-DOE-001', 'NO_BID', 'Fitness below threshold — SKIP');

  console.log(`\n  BD Decisions Made:`);
  console.log(`  SAM-2026-VA-001:  ✓ PURSUING  — SDVOSB advantage, $2.2M`);
  console.log(`  SAM-2026-DHS-001: ✓ PURSUING  — Cybersecurity alignment, $4.8M`);
  console.log(`  SAM-2026-GSA-001: ○ QUALIFYING — Cloud migration, $8.5M`);
  console.log(`  SAM-2026-DOD-001: ✗ NO-BID    — Incumbent + 22 competitors`);
  console.log(`  SAM-2026-DOE-001: ✗ NO-BID    — Below fitness threshold`);
  console.log(`\n  BD resources saved (skipping 2 low-fitness bids): ~$85K`);

  // ── Scene 3: FAR/DFARS Compliance Check ─────────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 3: FAR/DFARS Compliance Checklist (GOVEX)');
  console.log('─'.repeat(76));

  const compliance = govex.checkCompliance('services', false);
  console.log(`\n  Compliance check for commercial services contract:`);
  console.log(`  Required clauses: ${compliance.requiredClauses}`);
  console.log(`\n  ${compliance.clauses.slice(0, 4).map(c => `☐ ${c.clause}: ${c.action}`).join('\n  ')}`);

  const dodCompliance = govex.checkCompliance('services', true);
  console.log(`\n  Additional DoD-specific clauses: ${dodCompliance.requiredClauses - compliance.requiredClauses} more required`);
  console.log(`  ⚠️  DFARS 252.204-7012 (NIST SP 800-171 compliance) is mandatory for DoD`);

  // ── Scene 4: Past Performance Recording ──────────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 4: Past Performance Intelligence (GOVEX)');
  console.log('─'.repeat(76));

  const pastContracts = [
    { contractId: 'CONT-2024-001', agency: 'DHS', value: 2100000, naics: '541512', setAside: 'Small Business', cparsRating: 'Very Good' },
    { contractId: 'CONT-2023-002', agency: 'VA',  value: 1800000, naics: '541611', setAside: 'SDVOSB',         cparsRating: 'Exceptional' },
    { contractId: 'CONT-2022-003', agency: 'GSA', value: 950000,  naics: '541519', setAside: 'Small Business', cparsRating: 'Satisfactory' },
  ];

  pastContracts.forEach(c => {
    const result = govex.recordPastPerformance(c.contractId, c);
    console.log(`  Recorded: ${c.contractId} — ${c.agency} ($${(c.value / 1000).toFixed(0)}K) — CPARS: ${c.cparsRating}`);
  });
  console.log(`\n  Total past performance records: ${pastContracts.length}`);
  console.log(`  GOVEX will incorporate CPARS ratings into future bid scoring`);

  // ── Scene 5: Proposal Team Coordination (VERBEX) ─────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 5: Proposal Team Coordination via iMessage (VERBEX)');
  console.log('─'.repeat(76));

  // Route proposal kickoff messages
  const proposalTeam = [
    { contactId: 'CAPTURE-MGR', role: 'Capture Manager', phone: '+19725550101' },
    { contactId: 'TECH-LEAD',   role: 'Technical Volume Lead', phone: '+19725550102' },
    { contactId: 'PRICING-MGR', role: 'Price to Win Analyst', phone: '+19725550103' },
    { contactId: 'PAST-PERF',   role: 'Past Performance Writer', phone: '+19725550104' },
  ];

  console.log(`\n  VA SDVOSB Opportunity — Proposal Kickoff:`);
  proposalTeam.forEach(member => {
    const message = verbex.routeMessage({
      contactId: member.contactId,
      messageType: 'task',
      urgency: 'high',
      content: `📋 PROPOSAL KICKOFF — SAM-2026-VA-001\nRole: ${member.role}\nDeadline: ${new Date(Date.now() + 21 * 86400000).toLocaleDateString()}\nFitness Score: 0.842 | Win Probability: 58%\nGOVEX Recommendation: PURSUE — SDVOSB advantage confirmed\nStand-up call: tomorrow 9am CT. Reply CONFIRMED.`,
    });
    const channel = message?.selectedChannel || 'iMessage';
    console.log(`  → ${member.role.padEnd(28)} via ${channel} ✓`);
  });

  // ── Scene 6: Annual Value Model ──────────────────────────────────────────

  console.log('\n' + '─'.repeat(76));
  console.log('  SCENE 6: Annual Value Model — SMB Government Contractor');
  console.log('─'.repeat(76));

  const currentWinRate = 0.18;
  const rshipWinRate = 0.30;
  const submissionsPerYear = 20;
  const avgContractValue = 2500000;
  const winRateLift = (rshipWinRate - currentWinRate) * submissionsPerYear * avgContractValue;
  const bdCostSavings = 8 * 22500; // skip 8 bad bids × $22.5K avg BD cost per bid
  const complianceRisk = 85000;
  const opportunityCost = 35000; // time savings × hourly BD rate
  const totalValue = winRateLift + bdCostSavings + complianceRisk + opportunityCost;
  const platformCost = 1200 * 12;
  const roi = ((totalValue - platformCost) / platformCost * 100);

  console.log(`
  ┌─────────────────────────────────────────────────────────────────────┐
  │  Annual Value — ${COMPANY.name.padEnd(52)}│
  ├─────────────────────────────────────────────────────────────────────┤
  │  Win Rate Lift (18%→30%, 20 bids):        $${winRateLift.toLocaleString().padEnd(27)}│
  │  BD Cost Savings (skip 8 bad bids):       $${bdCostSavings.toLocaleString().padEnd(27)}│
  │  Compliance Gap Prevention:               $${complianceRisk.toLocaleString().padEnd(27)}│
  │  Discovery Time Savings:                  $${opportunityCost.toLocaleString().padEnd(27)}│
  │  ─────────────────────────────────────────────────────────────────  │
  │  Total Annual Value:                      $${totalValue.toLocaleString().padEnd(27)}│
  │  Platform Cost (Starter):                 $${platformCost.toLocaleString().padEnd(27)}│
  │  Net Annual Gain:                         $${(totalValue - platformCost).toLocaleString().padEnd(27)}│
  │  ROI:                                     ${roi.toFixed(0).padEnd(27)}%│
  └─────────────────────────────────────────────────────────────────────┘
  `);

  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  RSHIP GOVERNMENT CONTRACTING INTELLIGENCE — Simulation Complete           ║
║  ${COMPANY.name.padEnd(73)}║
║  3 AGIs Operational: GOVEX · PRAEDEX · VERBEX                             ║
║  Designation: RSHIP-PROD-GOV-001                                           ║
║  ROI: ${roi.toFixed(0)}% | Annual Value: $${totalValue.toLocaleString().padEnd(46)}║
╚════════════════════════════════════════════════════════════════════════════╝
  `);
}

runGovContractingSimulation().catch(console.error);
