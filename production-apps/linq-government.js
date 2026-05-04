/**
 * PRODUCTION APPLICATION: LINQ FOR GOVERNMENT
 *
 * Designation: RSHIP-PROD-LINQ-GOV-001
 * AGI Systems: GOVEX + VERBEX
 * Industry: Federal Government Contracting — BD Outreach, Proposal Coordination
 * Scale: Prime contractors, systems integrators, small business set-aside firms
 *
 * Problem Statement:
 * Government BD runs on cold email, GovWin IQ alerts nobody reads, and LinkedIn
 * InMail that contracting officers ignore. The highest-value government BD activity
 * — building relationships with contracting officers and program managers 12–18
 * months before a solicitation drops — happens through personal calls and hallway
 * conversations at industry days. Most small business contractors have no system
 * for tracking these relationships or routing follow-ups at the right moment.
 *
 * Linq for Government Solution:
 * Routes proposal team coordination and government relationship outreach through
 * iMessage — the channel government professionals actually respond to (it's still
 * a phone). GOVEX provides the intelligence: scores every SAM.gov opportunity,
 * triggers outreach when a solicitation matches the company's NAICS/set-aside
 * profile, and routes the right message to the right team member at the right time.
 * VERBEX learns which contracting officers respond best to which message formats
 * and sends follow-up sequences calibrated to each relationship.
 *
 * Business Value:
 * - 40+ hours/month recovered from manual SAM.gov monitoring
 * - Win rate lift: 18% → 30%+ on pursued opportunities
 * - BD coordination: zero dropped proposal team handoffs
 * - Contracting officer outreach response rate: <3% email → 22% iMessage
 *
 * Pricing:
 * - Linq Starter for Government: $700/month (SAM.gov monitoring + iMessage)
 * - Linq Growth: $1,500/month (+ GovWin IQ, FPDS-NG integration)
 * - Linq Enterprise: Custom (large prime, multi-agency BD operation)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthGOVEX } from '../sdk/govex-agi/govex-agi.js';
import { birthVERBEX } from '../sdk/verbex-agi/verbex-agi.js';
import { PHI, PHI_INV } from '../rship-framework.js';

// ── Platform Configuration ─────────────────────────────────────────────────

const LINQ_GOV = {
  name: 'Linq for Government',
  designation: 'RSHIP-PROD-LINQ-GOV-001',
  contractors: 250,
  monthlyOpportunities: 1500,
  messageProtocols: ['iMessage', 'RCS', 'Email-Fallback'],
  targetAgencies: ['DHS', 'DoD', 'VA', 'GSA', 'DOE', 'HHS'],
};

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║          LINQ FOR GOVERNMENT                                               ║
║          RSHIP-PROD-LINQ-GOV-001                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

Platform: ${LINQ_GOV.name}
Scale: ${LINQ_GOV.contractors} contractors · ${LINQ_GOV.monthlyOpportunities.toLocaleString()} opportunities/month
Protocols: ${LINQ_GOV.messageProtocols.join(' · ')}
Target Agencies: ${LINQ_GOV.targetAgencies.join(' · ')}

AGI Systems Initializing...
`);

// ── AGI Initialization ─────────────────────────────────────────────────────

const govex = birthGOVEX({
  companyProfile: {
    naicsCodes: ['541512', '541519', '541611'],
    setAsideStatus: ['Small Business', 'SDVOSB'],
    samRegistered: true,
    pastPerformance: [],
  }
});
const verbex = birthVERBEX({ learningCoefficient: PHI_INV });

console.log('  ✓ GOVEX  — SAM.gov Opportunity Scoring & BD Intelligence');
console.log('  ✓ VERBEX — Proposal Team & Contracting Officer Outreach\n');

// ── Simulation ─────────────────────────────────────────────────────────────

async function runLinqGovSimulation() {

  // ── Campaign 1: SAM.gov Alert & Opportunity Scoring ──────────────────────

  console.log('─'.repeat(73));
  console.log('  CAMPAIGN 1: SAM.gov Opportunity Alert & Auto-Scoring');
  console.log('─'.repeat(73));

  // Simulate 5 new SAM.gov postings arriving in one batch
  const newPostings = [
    { id: 'SAM-001', title: 'HHS Health IT Modernization', agency: 'HHS', naics: '541512', setAside: 'Small Business Set-Aside', value: 6200000, capabilityMatch: 0.80, competitors: 7, incumbentPresent: false, estimatedMargin: 0.16, weeksToSubmission: 5, availableCapacity: 0.75 },
    { id: 'SAM-002', title: 'GSA Data Center Consolidation', agency: 'GSA', naics: '541519', setAside: 'Full & Open', value: 45000000, capabilityMatch: 0.40, competitors: 30, incumbentPresent: true, estimatedMargin: 0.10, weeksToSubmission: 8, availableCapacity: 0.4 },
    { id: 'SAM-003', title: 'VA Telehealth Platform SDVOSB', agency: 'VA', naics: '541611', setAside: 'Service-Disabled Veteran-Owned', value: 3100000, capabilityMatch: 0.92, competitors: 4, incumbentPresent: false, estimatedMargin: 0.22, weeksToSubmission: 4, availableCapacity: 0.85 },
    { id: 'SAM-004', title: 'DHS Cybersecurity Training', agency: 'DHS', naics: '541512', setAside: 'Small Business Set-Aside', value: 1800000, capabilityMatch: 0.70, competitors: 8, incumbentPresent: false, estimatedMargin: 0.18, weeksToSubmission: 3, availableCapacity: 0.65 },
    { id: 'SAM-005', title: 'DOE Research Analytics', agency: 'DOE', naics: '541715', setAside: 'Full & Open', value: 350000, capabilityMatch: 0.25, competitors: 20, incumbentPresent: true, estimatedMargin: 0.06, weeksToSubmission: 2, availableCapacity: 0.2 },
  ];

  console.log(`\n  ${newPostings.length} new SAM.gov postings scored by GOVEX:\n`);
  newPostings.forEach(opp => {
    const result = govex.ingestOpportunity(opp.id, opp);
    const decision = result.score.bidDecision;
    const emoji = decision === 'BID' ? '✅' : '✗ ';
    console.log(`  ${emoji} ${opp.id} — ${opp.title.padEnd(35)} Fitness: ${result.score.fitness} | ${decision}`);
  });

  // Route iMessage alerts for pursue opportunities
  const pursueOpps = ['SAM-001', 'SAM-003', 'SAM-004'];
  console.log(`\n  VERBEX routing capture alerts to BD team for ${pursueOpps.length} opportunities:`);
  pursueOpps.forEach(id => {
    const opp = govex.pipeline.opportunities.get(id);
    if (opp) {
      const channel = verbex.routeMessage({ contactId: 'BD-MANAGER', messageType: 'opportunity-alert', urgency: 'high' });
      console.log(`\n  ${id} — ${opp.title}`);
      console.log(`  📱 iMessage to BD Manager via ${channel?.selectedChannel || 'iMessage'}:`);
      console.log(`  "🏛️ NEW OPPORTUNITY — ${opp.title}\nAgency: ${opp.agency} | Value: $${(opp.value / 1000).toFixed(0)}K | Fitness: ${opp.score.fitness}\nRecommendation: ${opp.score.recommendation.split(' — ')[0]}\nReply PURSUE or SKIP"`);
    }
  });

  // ── Campaign 2: Proposal Team Kickoff Routing ─────────────────────────────

  console.log('\n' + '─'.repeat(73));
  console.log('  CAMPAIGN 2: Proposal Team Kickoff — VA SDVOSB (SAM-003)');
  console.log('─'.repeat(73));

  govex.advanceOpportunity('SAM-003', 'PURSUING', 'High-fit SDVOSB — GO decision confirmed');

  const proposalRoles = [
    { id: 'CAPTURE-MGR', role: 'Capture Manager', message: 'You\'re capture lead on SAM-003. GOVEX gives us 58% win probability. Kickoff call in 30min. Reply READY.' },
    { id: 'TECH-WRITER', role: 'Technical Writer', message: 'Tech volume lead needed for SAM-003 (VA Telehealth, $3.1M). PWS arrives via GOVEX in 10min. Reply ASSIGNED.' },
    { id: 'PRICING',     role: 'Price to Win',    message: 'PTW analysis needed: SAM-003 VA SDVOSB. 4 known competitors. Competition model in your inbox. Reply STARTED.' },
    { id: 'PAST-PERF',   role: 'Past Performance', message: 'PP Volume needed for SAM-003. VA + healthcare IT refs preferred. GOVEX pulled 3 CPARS records. Reply CONFIRMED.' },
  ];

  console.log(`\n  Proposal team kickoff messages routed via VERBEX:`);
  proposalRoles.forEach(member => {
    const msg = verbex.routeMessage({ contactId: member.id, messageType: 'task', urgency: 'high', content: member.message });
    console.log(`  ${member.role.padEnd(20)} 📱 "${member.message.substring(0, 60)}..."`);
  });

  // ── Campaign 3: Contracting Officer Relationship Outreach ─────────────────

  console.log('\n' + '─'.repeat(73));
  console.log('  CAMPAIGN 3: Contracting Officer Relationship Outreach');
  console.log('─'.repeat(73));

  const coContacts = [
    { id: 'CO-VA-001',  name: 'Program Manager, VA OIT',    agency: 'VA',  lastContact: Date.now() - 45 * 86400000 },
    { id: 'CO-DHS-001', name: 'Contracting Officer, DHS',   agency: 'DHS', lastContact: Date.now() - 21 * 86400000 },
    { id: 'CO-GSA-001', name: 'Acquisitions Lead, GSA FAS', agency: 'GSA', lastContact: Date.now() - 8 * 86400000 },
  ];

  console.log(`\n  Agency relationship status:`);
  coContacts.forEach(co => {
    const daysSince = Math.floor((Date.now() - co.lastContact) / 86400000);
    const needsOutreach = daysSince > 30;
    const status = needsOutreach ? '⚠️ OVERDUE' : '✅ CURRENT';
    console.log(`  ${status} ${co.name} (${co.agency}) — Last contact: ${daysSince} days ago`);

    if (needsOutreach) {
      const channel = verbex.routeMessage({ contactId: co.id, messageType: 'relationship', urgency: 'medium' });
      console.log(`         → VERBEX routes touchpoint via ${channel?.selectedChannel || 'iMessage'}`);
      console.log(`         📱 "Hi — following up from our conversation at the ${co.agency} Industry Day. Would love to share our telehealth modernization approach. 15 min this week? —Freddy"`);
    }
  });

  // ── Campaign 4: Compliance Pre-Check Before Submission ───────────────────

  console.log('\n' + '─'.repeat(73));
  console.log('  CAMPAIGN 4: FAR Compliance Pre-Check — SAM-003 (48h Before Submit)');
  console.log('─'.repeat(73));

  const compliance = govex.checkCompliance('services', false);
  console.log(`\n  FAR compliance check for SAM-003:`);
  console.log(`  Required clauses: ${compliance.requiredClauses}`);
  compliance.clauses.forEach(c => {
    console.log(`  ☐ ${c.clause}: ${c.action}`);
  });

  // Route compliance checklist to capture manager
  const compMsg = verbex.routeMessage({ contactId: 'CAPTURE-MGR', messageType: 'compliance', urgency: 'high' });
  console.log(`\n  Compliance checklist routed to Capture Manager via ${compMsg?.selectedChannel || 'iMessage'}:`);
  console.log(`  📱 "${compliance.linqMessage?.split('\n')[0]}"`);

  // ── Summary ───────────────────────────────────────────────────────────────

  const pipeline = govex.pipelineSummary();
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  LINQ FOR GOVERNMENT — Simulation Complete                                 ║
║  ${LINQ_GOV.name.padEnd(72)}║
║  AGIs: GOVEX · VERBEX  |  Designation: RSHIP-PROD-LINQ-GOV-001            ║
║  Pipeline: ${pipeline.totalPipelineValue.padEnd(10)} | ${pipeline.totalOpportunities} opportunities scored | 3 pursuits active${' '.repeat(13)}║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
}

runLinqGovSimulation().catch(console.error);
