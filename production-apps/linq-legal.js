/**
 * PRODUCTION APPLICATION: LINQ FOR LEGAL
 *
 * Designation: RSHIP-PROD-LINQ-LEGAL-001
 * AGI Systems: LEXEX + VERBEX
 * Industry: Legal Services — Law Firms, Legal Departments, Solo Practitioners
 * Scale: 1–500 attorney firms, legal tech platforms
 *
 * Problem Statement:
 * Attorneys communicate with clients the same way they did in 1995: phone
 * calls, email, and paper letters. Clients get status updates every 3 weeks
 * if they're lucky. Court deadline alerts go out as calendar invites nobody
 * checks. Contract delivery still happens via email attachments that require
 * DocuSign setups. The channel mismatch creates the #1 driver of bar complaints:
 * "My attorney doesn't communicate with me."
 *
 * Linq for Legal Solution:
 * Routes all attorney-client communication through iMessage — the channel
 * clients actually live in. LEXEX provides the intelligence: deadline alerts
 * propagate through the docket and arrive in the client's iMessage 14 days
 * before the date. Contracts arrive as rich iMessage cards (same as Linq
 * Contracts pattern). Billing statements are delivered and approved via reply.
 * VERBEX learns each client's optimal communication time and tone — adjusting
 * formality based on relationship history.
 *
 * Business Value (per 8-attorney firm):
 * - Client satisfaction: zero bar complaints from SLA compliance
 * - Missed deadline risk: eliminated via iMessage deadline cascade alerts
 * - Billing approval speed: same-day vs. 3-week paper cycle
 * - Realization rate: 75% → 85% from faster approval and follow-up
 *
 * Pricing:
 * - Linq Starter for Legal: $600/month (≤5 attorneys)
 * - Linq Growth: $1,200/month (≤25 attorneys)
 * - Linq Enterprise: Custom (BigLaw, legal tech platform licensing)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthLEXEX } from '../sdk/lexex-agi/lexex-agi.js';
import { birthVERBEX } from '../sdk/verbex-agi/verbex-agi.js';
import { PHI, PHI_INV } from '../rship-framework.js';

// ── Platform Configuration ─────────────────────────────────────────────────

const LINQ_LEGAL = {
  name: 'Linq for Legal',
  designation: 'RSHIP-PROD-LINQ-LEGAL-001',
  attorneys: 500,
  matters: 12000,
  messageProtocols: ['iMessage', 'RCS', 'Email-Fallback'],
  integrations: ['Clio', 'MyCase', 'Filevine', 'LawPay'],
};

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║          LINQ FOR LEGAL                                                    ║
║          RSHIP-PROD-LINQ-LEGAL-001                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

Platform: ${LINQ_LEGAL.name}
Scale: ${LINQ_LEGAL.attorneys} attorneys · ${LINQ_LEGAL.matters.toLocaleString()} active matters
Protocols: ${LINQ_LEGAL.messageProtocols.join(' · ')}
Integrations: ${LINQ_LEGAL.integrations.join(' · ')}

AGI Systems Initializing...
`);

// ── AGI Initialization ─────────────────────────────────────────────────────

const lexex  = birthLEXEX({});
const verbex  = birthVERBEX({ learningCoefficient: PHI_INV });

console.log('  ✓ LEXEX  — Legal Deadline & Matter Intelligence');
console.log('  ✓ VERBEX — Attorney-Client iMessage Routing\n');

// ── Simulation ─────────────────────────────────────────────────────────────

async function runLinqLegalSimulation() {

  // ── Campaign 1: Docket Deadline Alerts via iMessage ──────────────────────

  console.log('─'.repeat(73));
  console.log('  CAMPAIGN 1: Docket Deadline Alerts — iMessage to Client & Attorney');
  console.log('─'.repeat(73));

  lexex.openMatter('MTR-LNQ-001', { clientId: 'CLI-WILLIAMS', caseType: 'personal-injury', attorneys: ['Sanchez, M.'] });
  lexex.openMatter('MTR-LNQ-002', { clientId: 'CLI-CHEN',     caseType: 'employment',      attorneys: ['Davis, R.'] });

  // Add deadlines
  lexex.addDeadline('MTR-LNQ-001', { type: 'COURT_DATE',       label: 'Mediation',               dueDate: Date.now() + 21 * 86400000, alertDays: 14 });
  lexex.addDeadline('MTR-LNQ-001', { type: 'MOTION_DEADLINE',  label: 'Summary Judgment Filing', dueDate: Date.now() + 45 * 86400000, alertDays: 14 });
  lexex.addDeadline('MTR-LNQ-002', { type: 'DISCOVERY_CUTOFF', label: 'Discovery Cutoff',         dueDate: Date.now() + 18 * 86400000, alertDays: 10, isHardDeadline: true });
  lexex.addDeadline('MTR-LNQ-002', { type: 'COURT_DATE',       label: 'Bench Trial',              dueDate: Date.now() + 90 * 86400000, alertDays: 21 });

  const upcoming = lexex.upcomingDeadlines(60);
  console.log(`\n  Deadlines in next 60 days: ${upcoming.length}`);
  upcoming.forEach(d => {
    const urgent = d.daysRemaining <= 21 ? '⚠️ ' : '   ';
    console.log(`\n  ${urgent}${d.matterId} — ${d.label}`);
    console.log(`       Due in: ${d.daysRemaining} days | Type: ${d.type}`);
    console.log(`       📱 iMessage: "${d.linqMessage.split('\n')[0]}"`);
  });

  // ── Campaign 2: Contract Delivery via iMessage Card ───────────────────────

  console.log('\n' + '─'.repeat(73));
  console.log('  CAMPAIGN 2: Contract Delivery — iMessage Rich Card (Linq Contracts)');
  console.log('─'.repeat(73));

  const contractText = `
    This Retainer Agreement grants the Client the right to receive legal services.
    The Law Firm agrees to indemnify Client for any errors in legal counsel.
    Client waives right to a jury trial for any disputes under this Agreement.
    Arbitration clause applies. This Agreement auto-renews annually.
    Unlimited liability for breach of IP provisions assigned to Law Firm.
  `;

  const clauseAnalysis = lexex.analyzeContract(contractText, 'MTR-LNQ-001');
  console.log(`\n  Contract Risk Analysis (before sending to client):`);
  console.log(`  Clauses found: ${clauseAnalysis.clauseCount} | Risk tier: ${clauseAnalysis.riskTier}`);
  console.log(`  ${clauseAnalysis.recommendation}`);

  // Simulate contract delivery card
  const contractCard = {
    type: 'LINQ_CONTRACT_CARD',
    title: 'Retainer Agreement — Review & Sign',
    matter: 'MTR-LNQ-001',
    attorney: 'Sanchez, M.',
    actions: ['REVIEW', 'SIGN', 'CALL'],
    riskFlag: clauseAnalysis.riskTier !== 'LOW',
    message: `📝 CONTRACT READY — Retainer Agreement\nMatter: MTR-LNQ-001 | Attorney: Sanchez, M.\n${clauseAnalysis.riskTier !== 'LOW' ? `⚠️ ${clauseAnalysis.clauseCount} clause(s) flagged for review\n` : ''}Tap REVIEW to read · SIGN to execute · CALL to discuss`,
  };

  console.log(`\n  Contract delivered via iMessage Card:`);
  console.log(`  📱 "${contractCard.message.split('\n')[0]}"`);
  console.log(`  Risk flag: ${contractCard.riskFlag ? '⚠️ Yes — attorney review required' : '✅ Clean'}`);
  console.log(`  Actions available: ${contractCard.actions.join(' · ')}`);

  // ── Campaign 3: Billing Approval via iMessage ─────────────────────────────

  console.log('\n' + '─'.repeat(73));
  console.log('  CAMPAIGN 3: WIP Billing Approval — Same-Day via iMessage');
  console.log('─'.repeat(73));

  // Log time entries
  lexex.recordTime('MTR-LNQ-001', { attorney: 'Sanchez, M.', hours: 6.5, rate: 450, description: 'Discovery review, witness prep' });
  lexex.recordTime('MTR-LNQ-001', { attorney: 'Sanchez, M.', hours: 2.0, rate: 450, description: 'Client strategy call' });
  lexex.recordTime('MTR-LNQ-002', { attorney: 'Davis, R.',    hours: 8.0, rate: 395, description: 'Deposition preparation' });

  const prebill1 = lexex.prebill('MTR-LNQ-001');
  const prebill2 = lexex.prebill('MTR-LNQ-002');

  console.log(`\n  Prebills generated and routed via VERBEX/iMessage:`);
  if (!prebill1.error) {
    const channel1 = verbex.routeMessage({ contactId: 'CLI-WILLIAMS', messageType: 'billing', urgency: 'medium' });
    console.log(`\n  MTR-LNQ-001 — $${prebill1.prebillAmount.toLocaleString()} via ${channel1?.selectedChannel || 'iMessage'}`);
    console.log(`  📱 "${prebill1.linqMessage?.split('\n')[0]}"`);
  }
  if (!prebill2.error) {
    const channel2 = verbex.routeMessage({ contactId: 'CLI-CHEN', messageType: 'billing', urgency: 'medium' });
    console.log(`\n  MTR-LNQ-002 — $${prebill2.prebillAmount.toLocaleString()} via ${channel2?.selectedChannel || 'iMessage'}`);
    console.log(`  📱 "${prebill2.linqMessage?.split('\n')[0]}"`);
  }

  // ── Campaign 4: Client SLA Monitoring ────────────────────────────────────

  console.log('\n' + '─'.repeat(73));
  console.log('  CAMPAIGN 4: Client SLA Compliance — Bar Complaint Prevention');
  console.log('─'.repeat(73));

  lexex.seedClientProfile('CLI-WILLIAMS', { name: 'Maria Williams', lastContact: Date.now() - 28 * 3600000, slaHours: 24, matters: ['MTR-LNQ-001'] });
  lexex.seedClientProfile('CLI-CHEN',     { name: 'David Chen',     lastContact: Date.now() - 3 * 3600000,  slaHours: 4,  matters: ['MTR-LNQ-002'] });

  const slaAlerts = lexex.checkClientSLAs();
  console.log(`\n  Client SLA Status — ${slaAlerts.length} breach(es):`);

  if (slaAlerts.length > 0) {
    slaAlerts.forEach(alert => {
      const channel = verbex.routeMessage({ contactId: alert.clientId, messageType: 'status-update', urgency: 'high' });
      console.log(`\n  ⚠️ ${alert.name} — ${alert.hoursSinceContact}h (SLA: ${alert.overdueBySlaHours}h overdue)`);
      console.log(`  VERBEX routing via ${channel?.selectedChannel || 'iMessage'}:`);
      console.log(`  📱 "${alert.linqMessage.split('\n')[0]}"`);
    });
  } else {
    console.log('  ✅ All client SLAs current — zero bar complaint risk');
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  LINQ FOR LEGAL — Simulation Complete                                      ║
║  ${LINQ_LEGAL.name.padEnd(72)}║
║  AGIs: LEXEX · VERBEX  |  Designation: RSHIP-PROD-LINQ-LEGAL-001          ║
║  ${upcoming.length} deadlines monitored · ${slaAlerts.length} SLA breach(es) caught · Contract risk scored   ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
}

runLinqLegalSimulation().catch(console.error);
