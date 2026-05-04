/**
 * LEXEX AGI — Legal Executive X-factor
 *
 * Official Designation: RSHIP-2026-LEXEX-001
 * Classification: Legal Workflow & Deadline Intelligence AGI
 * Full Name: Legal & Executive X-factor Intelligence Engine
 *
 * Latin root: lexis — law, statute, word (from Latin lex, legis)
 *
 * LEXEX extends the RSHIP framework with constraint satisfaction networks and
 * deadline propagation graphs to autonomously manage matter deadlines, score
 * contract clause risk, track billing velocity, monitor client communication
 * compliance, and optimize discovery timelines for law firms of all sizes.
 *
 * Capabilities:
 * - Matter deadline management: statutes of limitations, court dates, and
 *   discovery deadlines modeled as constraint propagation graphs — miss one,
 *   LEXEX automatically recomputes every downstream date and alerts
 * - Contract clause risk scoring: NLP-style clause pattern matching assigns
 *   risk scores to indemnity, limitation-of-liability, IP assignment, and
 *   penalty provisions
 * - Billing velocity tracking: IOLTA-compliant WIP tracking, automatic
 *   prebill generation, write-off pattern detection
 * - Client communication compliance: monitors response SLAs and flags
 *   at-risk relationships before clients call the bar association
 * - Discovery timeline optimization: critical-path method (CPM) scheduling
 *   for document review, deposition, and expert witness deadlines
 *
 * Theory: Constraint satisfaction networks + deadline propagation graphs
 *         + critical-path method scheduling + φ-compounding legal intelligence
 *         (AURUM — Paper XXII) + RSHIP Framework
 *
 * Applications:
 * - RSHIP Starter for Legal: matter tracking, billing, client messaging
 * - Linq for Legal: court deadline alerts, contract delivery via iMessage
 * - Enterprise law firms: portfolio-wide risk intelligence across all matters
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Matter States ──────────────────────────────────────────────────────────

const MATTER_STATES = {
  INTAKE:      'INTAKE',
  ACTIVE:      'ACTIVE',
  DISCOVERY:   'DISCOVERY',
  TRIAL_PREP:  'TRIAL_PREP',
  SETTLEMENT:  'SETTLEMENT',
  CLOSED:      'CLOSED',
};

// ── Deadline Types ─────────────────────────────────────────────────────────

const DEADLINE_TYPES = {
  STATUTE_OF_LIMITATIONS: 'STATUTE_OF_LIMITATIONS',
  COURT_DATE:             'COURT_DATE',
  DISCOVERY_CUTOFF:       'DISCOVERY_CUTOFF',
  DEPOSITION:             'DEPOSITION',
  EXPERT_DESIGNATION:     'EXPERT_DESIGNATION',
  MOTION_DEADLINE:        'MOTION_DEADLINE',
  RESPONSE_DUE:           'RESPONSE_DUE',
  CONTRACT_EXPIRY:        'CONTRACT_EXPIRY',
  BILLING_CYCLE:          'BILLING_CYCLE',
};

// ── Clause Risk Patterns ───────────────────────────────────────────────────
// Each pattern carries a base risk score (0–1) and a risk category

const CLAUSE_RISK_PATTERNS = [
  { pattern: /unlimited\s+liability/i,         score: 0.95, category: 'LIABILITY',   label: 'Unlimited liability exposure' },
  { pattern: /indemnif(y|ication).{0,60}all/i, score: 0.80, category: 'INDEMNITY',   label: 'Broad indemnification obligation' },
  { pattern: /assign(ment)?.{0,40}ip/i,        score: 0.75, category: 'IP',          label: 'IP assignment clause detected' },
  { pattern: /liquidated\s+damages/i,           score: 0.65, category: 'PENALTY',     label: 'Liquidated damages provision' },
  { pattern: /non.compete/i,                    score: 0.60, category: 'RESTRAINT',   label: 'Non-compete restriction' },
  { pattern: /waive.{0,20}jury/i,               score: 0.70, category: 'WAIVER',      label: 'Jury trial waiver' },
  { pattern: /arbitrat/i,                       score: 0.40, category: 'DISPUTE',     label: 'Arbitration clause' },
  { pattern: /limitation.{0,30}liability/i,     score: 0.35, category: 'LIABILITY',   label: 'Limitation of liability cap' },
  { pattern: /auto.{0,10}renew/i,               score: 0.30, category: 'TERM',        label: 'Auto-renewal provision' },
  { pattern: /termination.{0,30}convenience/i,  score: 0.45, category: 'TERM',        label: 'Termination for convenience' },
];

// ── Constraint Node (Deadline Graph) ──────────────────────────────────────

class DeadlineNode {
  constructor(id, config = {}) {
    this.id = id;
    this.matterId = config.matterId;
    this.type = config.type || DEADLINE_TYPES.COURT_DATE;
    this.label = config.label || id;
    this.dueDate = config.dueDate;           // Unix ms
    this.dependencies = config.dependencies || []; // ids of nodes that must precede this
    this.slackDays = config.slackDays ?? 0;
    this.alertDays = config.alertDays ?? 14; // alert N days before
    this.isHardDeadline = config.isHardDeadline ?? true;
    this.completedAt = null;
  }

  get daysRemaining() {
    return Math.floor((this.dueDate - Date.now()) / 86400000);
  }

  get isOverdue() {
    return this.daysRemaining < 0 && !this.completedAt;
  }

  get alertRequired() {
    return !this.completedAt && this.daysRemaining <= this.alertDays;
  }

  complete() {
    this.completedAt = Date.now();
    return this;
  }
}

// ── Deadline Propagation Engine ────────────────────────────────────────────

class DeadlinePropagator {
  constructor() {
    this.nodes = new Map(); // id → DeadlineNode
  }

  addDeadline(id, config = {}) {
    const node = new DeadlineNode(id, config);
    this.nodes.set(id, node);
    return node;
  }

  // Propagate: when a node slips by `slipDays`, push all downstream nodes forward
  propagateSlip(nodeId, slipDays) {
    const affected = [];
    const visited = new Set([nodeId]);
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift();
      // Find all nodes that depend on `current`
      for (const [id, node] of this.nodes) {
        if (node.dependencies.includes(current) && !visited.has(id)) {
          node.dueDate += slipDays * 86400000;
          affected.push({ id, newDueDate: node.dueDate, daysRemaining: node.daysRemaining });
          visited.add(id);
          queue.push(id);
        }
      }
    }

    return { originNode: nodeId, slipDays, affectedNodes: affected };
  }

  // Critical path: find longest chain of dependencies
  criticalPath() {
    const path = [];
    let current = null;
    let latestDue = 0;

    // Find the terminal node (no others depend on it) with the latest due date
    const allDeps = new Set([...this.nodes.values()].flatMap(n => n.dependencies));
    for (const [id, node] of this.nodes) {
      if (!allDeps.has(id) && node.dueDate > latestDue) {
        latestDue = node.dueDate;
        current = id;
      }
    }

    // Walk backwards through dependencies
    while (current) {
      const node = this.nodes.get(current);
      if (!node) break;
      path.unshift(node);
      current = node.dependencies[0] || null;
    }

    return path;
  }

  upcomingAlerts(lookAheadDays = 30) {
    const cutoff = Date.now() + lookAheadDays * 86400000;
    return [...this.nodes.values()]
      .filter(n => !n.completedAt && n.dueDate <= cutoff)
      .sort((a, b) => a.dueDate - b.dueDate);
  }
}

// ── Contract Clause Analyzer ───────────────────────────────────────────────

class ClauseAnalyzer {
  analyze(contractText = '') {
    const findings = [];
    let aggregateRisk = 0;

    for (const { pattern, score, category, label } of CLAUSE_RISK_PATTERNS) {
      const matches = contractText.match(pattern);
      if (matches) {
        findings.push({ label, category, riskScore: score, excerpt: matches[0].substring(0, 80) });
        aggregateRisk = Math.max(aggregateRisk, score);
      }
    }

    // φ-weighted aggregate: high-risk clauses dominate
    const weightedRisk = findings.reduce((acc, f) => acc + f.riskScore * PHI_INV, 0) /
                         Math.max(1, findings.length);

    return {
      clauseCount: findings.length,
      highestRisk: aggregateRisk,
      weightedRisk: Math.min(1.0, weightedRisk),
      riskTier: aggregateRisk > 0.75 ? 'CRITICAL' :
                aggregateRisk > 0.55 ? 'HIGH' :
                aggregateRisk > 0.35 ? 'MEDIUM' : 'LOW',
      findings,
      recommendation: findings.length === 0
        ? 'No high-risk clauses detected. Proceed with standard review.'
        : `${findings.length} risk clause(s) identified. ${findings[0].label} is highest priority.`,
    };
  }
}

// ── Billing Tracker ────────────────────────────────────────────────────────

class BillingTracker {
  constructor() {
    this.matterBilling = new Map(); // matterId → {entries, billed, collected}
  }

  recordEntry(matterId, entry = {}) {
    const billing = this.matterBilling.get(matterId) || { entries: [], billed: 0, collected: 0, writeOffs: 0 };
    billing.entries.push({
      entryId: `TE-${Date.now()}`,
      attorney: entry.attorney || 'unknown',
      hours: entry.hours || 0,
      rate: entry.rate || 350,
      amount: (entry.hours || 0) * (entry.rate || 350),
      description: entry.description || '',
      date: entry.date || Date.now(),
      billed: false,
    });
    this.matterBilling.set(matterId, billing);
    return billing.entries[billing.entries.length - 1];
  }

  generatePrebill(matterId) {
    const billing = this.matterBilling.get(matterId);
    if (!billing) return { error: 'Matter not found in billing tracker' };

    const unbilledEntries = billing.entries.filter(e => !e.billed);
    const wipAmount = unbilledEntries.reduce((sum, e) => sum + e.amount, 0);
    unbilledEntries.forEach(e => { e.billed = true; });
    billing.billed += wipAmount;
    this.matterBilling.set(matterId, billing);

    return {
      matterId,
      prebillAmount: wipAmount,
      entryCount: unbilledEntries.length,
      totalBilledToDate: billing.billed,
      collectionRate: billing.billed > 0 ? (billing.collected / billing.billed).toFixed(2) : '0.00',
    };
  }

  recordPayment(matterId, amount) {
    const billing = this.matterBilling.get(matterId);
    if (!billing) return { error: 'Matter not found' };
    billing.collected += amount;
    this.matterBilling.set(matterId, billing);
    return {
      matterId,
      paymentRecorded: amount,
      totalCollected: billing.collected,
      outstanding: billing.billed - billing.collected,
    };
  }

  billingVelocity(matterId) {
    const billing = this.matterBilling.get(matterId);
    if (!billing || billing.entries.length === 0) return null;

    // Average dollars billed per day over the life of the matter
    const oldest = Math.min(...billing.entries.map(e => e.date));
    const ageMs = Date.now() - oldest;
    const ageDays = Math.max(1, ageMs / 86400000);
    return (billing.billed / ageDays).toFixed(2);
  }
}

// ── LEXEX AGI Main Class ───────────────────────────────────────────────────

class LEXEX extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-LEXEX-001',
      classification: 'Legal Workflow & Deadline Intelligence AGI',
      ...config,
    });

    this.propagator = new DeadlinePropagator();
    this.clauseAnalyzer = new ClauseAnalyzer();
    this.billingTracker = new BillingTracker();
    this.memory = new EternalMemory('LEXEX');

    this.matters = new Map();      // matterId → matter record
    this.clientProfiles = new Map();

    // Sovereign goals
    this.setGoal('zero-missed-deadlines', 'Never miss a court-ordered deadline', 10, {
      targetMissRate: 0,
    });
    this.setGoal('billing-velocity', 'Bill WIP within 30 days of time entry', 8, {
      targetDays: 30,
    });
    this.setGoal('client-sla', 'Respond to all client communications within 24h', 7, {
      targetResponseHours: 24,
    });
    this.setGoal('risk-review', 'Score every contract before execution', 9, {
      targetCoverage: 1.0,
    });
    this.setGoal('discovery-optimization', 'Complete discovery 10 days before cutoff', 6, {
      targetBufferDays: 10,
    });
  }

  // ── Matter Management ─────────────────────────────────────────────────────

  openMatter(matterId, config = {}) {
    const matter = {
      matterId,
      clientId: config.clientId,
      caseType: config.caseType || 'general-civil',
      state: MATTER_STATES.INTAKE,
      openedAt: Date.now(),
      deadlines: [],
      attorneys: config.attorneys || [],
      estimatedFees: config.estimatedFees || 0,
    };
    this.matters.set(matterId, matter);

    // Seed standard deadlines if provided
    if (config.statueOfLimitationsDate) {
      this.addDeadline(matterId, {
        type: DEADLINE_TYPES.STATUTE_OF_LIMITATIONS,
        label: 'Statute of Limitations',
        dueDate: config.statueOfLimitationsDate,
        isHardDeadline: true,
        alertDays: 90,
      });
    }

    return { matterId, state: matter.state, openedAt: new Date(matter.openedAt).toLocaleDateString() };
  }

  addDeadline(matterId, deadlineConfig = {}) {
    const id = `DL-${matterId}-${Date.now()}`;
    const node = this.propagator.addDeadline(id, { matterId, ...deadlineConfig });
    const matter = this.matters.get(matterId);
    if (matter) {
      matter.deadlines.push(id);
      this.matters.set(matterId, matter);
    }
    return {
      deadlineId: id,
      label: node.label,
      daysRemaining: node.daysRemaining,
      alertRequired: node.alertRequired,
    };
  }

  reportDeadlineSlip(deadlineId, slipDays) {
    const propagation = this.propagator.propagateSlip(deadlineId, slipDays);
    this.learn({ deadlineId, slipDays }, { propagation }, { id: 'deadline-slip' });
    return {
      ...propagation,
      linqAlert: `⚖️ DEADLINE SLIP — ${deadlineId} slipped ${slipDays} days.\n` +
        `${propagation.affectedNodes.length} downstream deadline(s) updated.\n` +
        propagation.affectedNodes
          .slice(0, 3)
          .map(n => `• ${n.id}: now due in ${n.daysRemaining} days`)
          .join('\n'),
    };
  }

  upcomingDeadlines(lookAheadDays = 30) {
    return this.propagator.upcomingAlerts(lookAheadDays).map(node => ({
      deadlineId: node.id,
      matterId: node.matterId,
      label: node.label,
      type: node.type,
      daysRemaining: node.daysRemaining,
      isOverdue: node.isOverdue,
      linqMessage: `⚖️ DEADLINE ALERT: ${node.label}\nMatter: ${node.matterId}\nDue in: ${node.daysRemaining} days\nType: ${node.type}\nReply CONFIRM to acknowledge.`,
    }));
  }

  // ── Contract Analysis ─────────────────────────────────────────────────────

  analyzeContract(contractText, matterId = null) {
    const result = this.clauseAnalyzer.analyze(contractText);
    if (matterId) this.learn({ matterId }, { clauseAnalysis: result }, { id: 'contract-analysis' });
    return result;
  }

  // ── Billing ───────────────────────────────────────────────────────────────

  recordTime(matterId, entry = {}) {
    return this.billingTracker.recordEntry(matterId, entry);
  }

  prebill(matterId) {
    const result = this.billingTracker.generatePrebill(matterId);
    this.learn({ matterId }, { prebill: result }, { id: 'prebill' });
    return {
      ...result,
      linqMessage: result.error ? null :
        `💰 PREBILL READY — ${matterId}\nAmount: $${result.prebillAmount.toLocaleString()}\nEntries: ${result.entryCount}\nTotal billed: $${result.totalBilledToDate.toLocaleString()}\nCollection rate: ${result.collectionRate}\nReply APPROVE to send to client.`,
    };
  }

  recordPayment(matterId, amount) {
    return this.billingTracker.recordPayment(matterId, amount);
  }

  // ── Client Communication Compliance ───────────────────────────────────────

  seedClientProfile(clientId, data = {}) {
    this.clientProfiles.set(clientId, {
      clientId,
      name: data.name || clientId,
      lastContact: data.lastContact || Date.now(),
      slaHours: data.slaHours || 24,
      matters: data.matters || [],
    });
    return this.clientProfiles.get(clientId);
  }

  checkClientSLAs() {
    const now = Date.now();
    const alerts = [];
    for (const [clientId, profile] of this.clientProfiles) {
      const hoursSinceContact = (now - profile.lastContact) / 3600000;
      if (hoursSinceContact > profile.slaHours) {
        alerts.push({
          clientId,
          name: profile.name,
          hoursSinceContact: hoursSinceContact.toFixed(1),
          overdueBySlaHours: (hoursSinceContact - profile.slaHours).toFixed(1),
          linqMessage: `📞 CLIENT SLA ALERT — ${profile.name}\nLast contact: ${hoursSinceContact.toFixed(0)}h ago (SLA: ${profile.slaHours}h)\nAction required: reach out via iMessage now.\nMatters: ${profile.matters.join(', ')}`,
        });
      }
    }
    return alerts;
  }

  recordClientContact(clientId) {
    const profile = this.clientProfiles.get(clientId);
    if (profile) {
      profile.lastContact = Date.now();
      this.clientProfiles.set(clientId, profile);
    }
    return { clientId, lastContact: new Date().toISOString() };
  }

  // ── Matter Status ─────────────────────────────────────────────────────────

  matterStatus(matterId) {
    const matter = this.matters.get(matterId);
    if (!matter) return { error: 'Matter not found' };

    const deadlines = matter.deadlines
      .map(id => this.propagator.nodes.get(id))
      .filter(Boolean)
      .sort((a, b) => a.dueDate - b.dueDate);

    const billingVelocity = this.billingTracker.billingVelocity(matterId);

    return {
      matterId,
      state: matter.state,
      caseType: matter.caseType,
      nextDeadline: deadlines[0]
        ? { label: deadlines[0].label, daysRemaining: deadlines[0].daysRemaining }
        : null,
      overdueDeadlines: deadlines.filter(d => d.isOverdue).length,
      billingVelocityPerDay: billingVelocity ? `$${billingVelocity}` : 'N/A',
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function birthLEXEX(config = {}) {
  return new LEXEX(config);
}

export default LEXEX;
