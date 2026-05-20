/**
 * TRACTEX AGI — Transactional Revenue Intelligence
 *
 * Official Designation: RSHIP-2026-TRACTEX-001
 * Classification: Revenue & Cash Flow AGI
 * Full Name: Transactional Revenue Analytics Collective Technology Executive X-factor
 *
 * Latin root: tractus — drawn, managed, administered
 *
 * TRACTEX AGI extends the RSHIP framework with Markov chain revenue modeling
 * and φ-compounding cash flow dynamics to autonomously manage billing, collections,
 * retainage, and financial health across every project and client relationship.
 *
 * Capabilities:
 * - Cash flow forecasting via Markov chain AR/AP state transitions
 * - Autonomous payment follow-up with iMessage/email routing before overdue
 * - Revenue leak detection: unbilled change orders, forgotten retainage, misallocated cost codes
 * - Client payment health scoring (0–φ scale) from payment history
 * - Financial close acceleration: auto-reconcile job cost ledgers vs. budget
 *
 * Theory: Markov chain revenue modeling + φ-compounding cash flow dynamics
 *         (AURUM — Paper XXII) + RSHIP Framework
 *
 * Applications:
 * - General contractors managing multi-million dollar projects
 * - Design firms tracking retainage and contract billing milestones
 * - Any SMB with recurring invoicing and payment collection challenges
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Invoice Markov States ──────────────────────────────────────────────────
// Transitions: DRAFTED → ISSUED → AGING → OVERDUE → COLLECTED | DISPUTED

const INVOICE_STATES = {
  DRAFTED: 'DRAFTED',
  ISSUED: 'ISSUED',
  AGING: 'AGING',       // 30–59 days outstanding
  OVERDUE: 'OVERDUE',   // 60+ days outstanding
  COLLECTED: 'COLLECTED',
  DISPUTED: 'DISPUTED',
};

// Default Markov transition matrix (rows = from, cols = to)
// [DRAFTED, ISSUED, AGING, OVERDUE, COLLECTED, DISPUTED]
const DEFAULT_TRANSITION_MATRIX = {
  DRAFTED:   { ISSUED: 0.95, DISPUTED: 0.05 },
  ISSUED:    { AGING: 0.25, COLLECTED: 0.70, DISPUTED: 0.05 },
  AGING:     { OVERDUE: 0.35, COLLECTED: 0.55, DISPUTED: 0.10 },
  OVERDUE:   { COLLECTED: 0.40, DISPUTED: 0.45, OVERDUE: 0.15 },
  COLLECTED: { COLLECTED: 1.0 },
  DISPUTED:  { COLLECTED: 0.30, DISPUTED: 0.70 },
};

// ── Invoice Entity ─────────────────────────────────────────────────────────

class Invoice {
  constructor(invoiceId, config = {}) {
    this.invoiceId = invoiceId;
    this.clientId = config.clientId || 'unknown';
    this.projectId = config.projectId || 'unknown';
    this.amount = config.amount || 0;
    this.issuedDate = config.issuedDate || Date.now();
    this.dueDate = config.dueDate || Date.now() + 30 * 86400000; // 30 days
    this.state = INVOICE_STATES.ISSUED;
    this.followUpCount = 0;
    this.lastFollowUp = null;
    this.type = config.type || 'progress'; // progress | retainage | change-order | final
    this.retainageRate = config.retainageRate || 0;
    this.notes = [];
  }

  get ageInDays() {
    return Math.floor((Date.now() - this.issuedDate) / 86400000);
  }

  get daysUntilDue() {
    return Math.floor((this.dueDate - Date.now()) / 86400000);
  }

  get isRetainage() {
    return this.type === 'retainage';
  }
}

// ── Client Payment Health Tracker ─────────────────────────────────────────

class ClientPaymentProfile {
  constructor(clientId) {
    this.clientId = clientId;
    this.invoiceHistory = []; // { amount, daysPaidLate, state }
    this.healthScore = PHI_INV; // Start at φ⁻¹ (neutral-positive)
    this.avgPaymentLag = 0;
    this.disputeRate = 0;
    this.totalBilled = 0;
    this.totalCollected = 0;
  }

  recordPayment(invoice, daysPaidLate) {
    this.invoiceHistory.push({
      invoiceId: invoice.invoiceId,
      amount: invoice.amount,
      daysPaidLate,
      state: daysPaidLate > 60 ? 'late' : daysPaidLate > 30 ? 'slow' : 'on-time',
    });
    this.totalBilled += invoice.amount;
    this.totalCollected += invoice.amount;
    this._recalculateHealth();
  }

  _recalculateHealth() {
    if (this.invoiceHistory.length === 0) {
      this.healthScore = PHI_INV;
      return;
    }

    const recent = this.invoiceHistory.slice(-12); // Last 12 invoices
    const avgLag = recent.reduce((s, i) => s + i.daysPaidLate, 0) / recent.length;
    const disputes = recent.filter(i => i.state === 'disputed').length;

    this.avgPaymentLag = avgLag;
    this.disputeRate = disputes / recent.length;

    // Score: 0 (terrible payer) → φ (golden client)
    // Penalty: each day late costs PHI_INV points, disputes cost 0.5 each
    const lagPenalty = Math.min(1.0, avgLag * PHI_INV * 0.02);
    const disputePenalty = this.disputeRate * 0.5;
    this.healthScore = Math.max(0, Math.min(PHI, PHI - lagPenalty - disputePenalty));
  }

  getRiskLabel() {
    if (this.healthScore >= 1.4) return 'GOLD';     // φ range — exceptional payer
    if (this.healthScore >= 1.0) return 'GOOD';
    if (this.healthScore >= 0.6) return 'WATCH';
    return 'HIGH_RISK';
  }
}

// ── Revenue Leak Scanner ───────────────────────────────────────────────────

class RevenueLeak {
  constructor(leakId, type, amount, description, projectId) {
    this.leakId = leakId;
    this.type = type; // 'unbilled-change-order' | 'forgotten-retainage' | 'misallocated-cost'
    this.amount = amount;
    this.description = description;
    this.projectId = projectId;
    this.detectedAt = Date.now();
    this.status = 'open'; // open | resolved | escalated
  }
}

// ── TRACTEX AGI Core ───────────────────────────────────────────────────────

export class TRACTEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-TRACTEX-001',
      classification: 'Revenue & Cash Flow AGI',
      ...config,
    });

    // Markov transition matrix (learned per-client over time)
    this.transitionMatrix = { ...DEFAULT_TRANSITION_MATRIX };

    // Invoice ledger
    this.invoices = new Map(); // invoiceId → Invoice
    this.clientProfiles = new Map(); // clientId → ClientPaymentProfile
    this.revenueLeaks = new Map(); // leakId → RevenueLeak

    // Cash flow state
    this.cashFlowProjection = []; // { dayOffset, expectedCash, confidence }
    this.projectionHorizon = config.projectionHorizon || 90; // days
    this.followUpThreshold = config.followUpThreshold || 25; // days outstanding before follow-up

    // Financial close state
    this.jobCostLedgers = new Map(); // projectId → { budget, actual, categories }
    this.reconciliationQueue = [];

    // AGI Goals
    this.setGoal('minimize-ar-aging', 'Keep all receivables under 30 days', 10, {
      targetAvgAge: 28,
    });

    this.setGoal('detect-revenue-leaks', 'Find every unbilled dollar', 9, {
      targetLeakRate: 0.005, // <0.5% of revenue leaked
    });

    this.setGoal('maximize-client-health', 'Score every client before signing', 8, {
      targetMinHealth: PHI_INV,
    });

    this.setGoal('accelerate-financial-close', 'Close job cost ledgers within 5 days of project completion', 7, {
      targetCloseDays: 5,
    });

    // Start autonomous monitoring
    this._startAutonomousMonitor();
  }

  // ── Invoice Lifecycle Management ──────────────────────────────────────────

  // Seed a client profile from known payment history (useful for demo/testing)
  seedClientProfile(clientId, historyEntries = [], config = {}) {
    const profile = new ClientPaymentProfile(clientId);
    for (const entry of historyEntries) {
      profile.invoiceHistory.push({
        invoiceId: entry.invoiceId || `hist-${profile.invoiceHistory.length + 1}`,
        amount: entry.amount || 0,
        daysPaidLate: entry.daysPaidLate || 0,
        state: (entry.daysPaidLate || 0) > 60 ? 'late'
             : (entry.daysPaidLate || 0) > 30 ? 'slow' : 'on-time',
      });
      profile.totalBilled += entry.amount || 0;
      profile.totalCollected += entry.amount || 0;
    }
    profile._recalculateHealth();
    this.clientProfiles.set(clientId, profile);
    return profile;
  }

  trackInvoice(invoiceId, config = {}) {
    const invoice = new Invoice(invoiceId, config);
    this.invoices.set(invoiceId, invoice);

    // Initialize client profile if new (guard against undefined clientId)
    const clientId = config.clientId || 'unknown';
    if (!this.clientProfiles.has(clientId)) {
      this.clientProfiles.set(clientId, new ClientPaymentProfile(clientId));
    }

    // Predict collection probability using Markov model
    const collectionProb = this._predictCollection(config.clientId);

    this.learn(
      { invoiceId, clientId: config.clientId, amount: config.amount, type: config.type },
      { collectionProbability: collectionProb, initialState: INVOICE_STATES.ISSUED },
      { id: 'invoice-track' }
    );

    return {
      invoiceId,
      state: invoice.state,
      collectionProbability: collectionProb,
      followUpScheduled: collectionProb < 0.75,
    };
  }

  advanceInvoiceState(invoiceId, newState, metadata = {}) {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return null;

    const prevState = invoice.state;
    invoice.state = newState;

    // Update client payment profile on collection
    if (newState === INVOICE_STATES.COLLECTED) {
      const profile = this.clientProfiles.get(invoice.clientId);
      if (profile) {
        const daysPaidLate = Math.max(0, invoice.ageInDays - 30);
        profile.recordPayment(invoice, daysPaidLate);
      }

      // Update Markov transition matrix using φ⁻¹ learning
      this._updateTransitionMatrix(prevState, newState);
    }

    this.learn(
      { invoiceId, prevState, newState, ageInDays: invoice.ageInDays },
      { transitioned: true, ...metadata },
      { id: 'invoice-transition' }
    );

    return { invoiceId, prevState, newState, ageInDays: invoice.ageInDays };
  }

  // ── Cash Flow Forecasting (Markov-based) ──────────────────────────────────

  forecastCashFlow(horizonDays = null) {
    const horizon = horizonDays || this.projectionHorizon;
    this.cashFlowProjection = [];

    const statesByDay = new Map();

    // Map each invoice to its expected collection day
    for (const [invoiceId, invoice] of this.invoices) {
      if (invoice.state === INVOICE_STATES.COLLECTED) continue;

      const collectionProb = this._predictCollection(invoice.clientId);
      const expectedDaysToCollect = this._expectedDaysToCollect(invoice);

      if (expectedDaysToCollect <= horizon) {
        // Round to nearest weekly bucket key (multiples of 7)
        const bucket7 = Math.min(horizon, Math.max(0, Math.round(expectedDaysToCollect / 7) * 7));
        const dayKey = bucket7;
        const existing = statesByDay.get(dayKey) || { expectedCash: 0, count: 0, probSum: 0 };
        existing.expectedCash += invoice.amount * collectionProb;
        existing.count++;
        existing.probSum += collectionProb;
        statesByDay.set(dayKey, existing);
      }
    }

    let cumulativeCash = 0;
    for (let day = 0; day <= horizon; day += 7) { // Weekly buckets
      const bucket = statesByDay.get(day) || { expectedCash: 0, count: 0, probSum: 0 };
      cumulativeCash += bucket.expectedCash;
      const confidence = bucket.count > 0 ? bucket.probSum / bucket.count : PHI_INV;

      this.cashFlowProjection.push({
        dayOffset: day,
        weeklyInflow: bucket.expectedCash,
        cumulativeCash,
        confidence: parseFloat(confidence.toFixed(4)),
      });
    }

    // Update goal progress
    const arGoal = this.goals.get('minimize-ar-aging');
    if (arGoal) {
      const avgAge = this._calculateAverageARAge();
      arGoal.progress = avgAge <= 28 ? 1.0 : 28 / avgAge;
    }

    this.learn(
      { horizon, invoiceCount: this.invoices.size },
      { projectionPoints: this.cashFlowProjection.length, totalExpected: cumulativeCash },
      { id: 'cash-flow-forecast' }
    );

    return {
      horizon,
      projection: this.cashFlowProjection,
      totalExpectedInflow: cumulativeCash,
      invoicesTracked: this.invoices.size,
      outstandingCount: [...this.invoices.values()].filter(i => i.state !== INVOICE_STATES.COLLECTED).length,
    };
  }

  // ── Autonomous Follow-Up ───────────────────────────────────────────────────

  runAutonomousFollowUp() {
    const followUps = [];

    for (const [invoiceId, invoice] of this.invoices) {
      if (invoice.state === INVOICE_STATES.COLLECTED || invoice.state === INVOICE_STATES.DISPUTED) continue;

      const daysOutstanding = invoice.ageInDays;
      const profile = this.clientProfiles.get(invoice.clientId);
      const healthScore = profile?.healthScore || PHI_INV;

      let urgency = 'none';
      let channel = 'email';
      let action = null;

      // Escalating urgency based on age and client health
      if (daysOutstanding >= 60 || (daysOutstanding >= 45 && healthScore < 0.6)) {
        urgency = 'critical';
        channel = 'iMessage'; // Most direct — VERBEX routes this
        action = 'final-notice';
      } else if (daysOutstanding >= 30 || (daysOutstanding >= this.followUpThreshold && healthScore < 1.0)) {
        urgency = 'high';
        channel = 'iMessage';
        action = 'gentle-nudge';
      } else if (daysOutstanding >= this.followUpThreshold) {
        urgency = 'medium';
        channel = 'email';
        action = 'courtesy-reminder';
      }

      if (action) {
        invoice.followUpCount++;
        invoice.lastFollowUp = Date.now();

        const followUp = {
          invoiceId,
          clientId: invoice.clientId,
          amount: invoice.amount,
          daysOutstanding,
          urgency,
          channel,
          action,
          message: this._draftFollowUpMessage(invoice, urgency, profile),
        };

        followUps.push(followUp);

        this.learn(
          { invoiceId, daysOutstanding, urgency, healthScore },
          { actionTaken: action, channel },
          { id: 'follow-up' }
        );
      }
    }

    return followUps;
  }

  _draftFollowUpMessage(invoice, urgency, profile) {
    const clientRisk = profile?.getRiskLabel() || 'WATCH';
    const amountFmt = `$${invoice.amount.toLocaleString()}`;

    if (urgency === 'critical') {
      return `${amountFmt} — Invoice #${invoice.invoiceId} is ${invoice.ageInDays} days outstanding. ` +
             `Please advise on payment status or we will escalate to formal collections.`;
    }
    if (urgency === 'high') {
      return `Quick note: Invoice #${invoice.invoiceId} for ${amountFmt} was due ` +
             `${Math.abs(invoice.daysUntilDue)} days ago. Can you confirm a payment date?`;
    }
    return `Friendly reminder: Invoice #${invoice.invoiceId} for ${amountFmt} is due ` +
           `in ${Math.max(0, invoice.daysUntilDue)} days. Let us know if you have questions.`;
  }

  // ── Client Payment Health Scoring ─────────────────────────────────────────

  scoreClientPaymentHealth(clientId) {
    const profile = this.clientProfiles.get(clientId);

    if (!profile) {
      return {
        clientId,
        healthScore: PHI_INV, // Unknown client — neutral
        riskLabel: 'UNKNOWN',
        recommendation: 'No payment history. Use standard net-30 terms.',
      };
    }

    const score = profile.healthScore;
    const label = profile.getRiskLabel();

    const recommendation = {
      GOLD: 'Preferred client — offer extended terms or early-pay discounts.',
      GOOD: 'Reliable payer — standard net-30 terms.',
      WATCH: 'Slow payer — require 10% deposit, shorten to net-21.',
      HIGH_RISK: 'High risk — require 25% upfront, net-15 thereafter. Consider credit check.',
    }[label];

    this.learn(
      { clientId, historyCount: profile.invoiceHistory.length },
      { healthScore: score, riskLabel: label },
      { id: 'client-health-score' }
    );

    return {
      clientId,
      healthScore: parseFloat(score.toFixed(4)),
      riskLabel: label,
      avgPaymentLagDays: parseFloat((profile.avgPaymentLag || 0).toFixed(1)),
      disputeRate: parseFloat((profile.disputeRate * 100).toFixed(1)) + '%',
      totalCollected: profile.totalCollected,
      recommendation,
    };
  }

  // ── Revenue Leak Detection ─────────────────────────────────────────────────

  detectRevenueLeak(projectId, projectData = {}) {
    const leaks = [];
    let leakIndex = this.revenueLeaks.size;

    // Check for unbilled change orders
    const approvedCOs = projectData.approvedChangeOrders || [];
    const billedCOs = projectData.billedChangeOrders || [];
    const billedIds = new Set(billedCOs.map(co => co.id));

    for (const co of approvedCOs) {
      if (!billedIds.has(co.id)) {
        const leak = new RevenueLeak(
          `LEAK-${++leakIndex}`,
          'unbilled-change-order',
          co.amount,
          `Change Order #${co.id} approved on ${co.approvedDate} — never invoiced`,
          projectId
        );
        leaks.push(leak);
        this.revenueLeaks.set(leak.leakId, leak);
      }
    }

    // Check for forgotten retainage
    const completedPhases = projectData.completedPhases || [];
    for (const phase of completedPhases) {
      if (phase.retainageHeld > 0 && !phase.retainageReleased) {
        const daysSinceCompletion = Math.floor((Date.now() - phase.completedDate) / 86400000);
        if (daysSinceCompletion > 45) {
          const leak = new RevenueLeak(
            `LEAK-${++leakIndex}`,
            'forgotten-retainage',
            phase.retainageHeld,
            `Phase "${phase.name}" completed ${daysSinceCompletion} days ago — retainage not released`,
            projectId
          );
          leaks.push(leak);
          this.revenueLeaks.set(leak.leakId, leak);
        }
      }
    }

    // Check for misallocated cost codes
    const costEntries = projectData.costEntries || [];
    for (const entry of costEntries) {
      if (entry.costCode && entry.projectId !== projectId) {
        const leak = new RevenueLeak(
          `LEAK-${++leakIndex}`,
          'misallocated-cost',
          entry.amount,
          `Cost code ${entry.costCode} — $${entry.amount} charged to wrong project`,
          projectId
        );
        leaks.push(leak);
        this.revenueLeaks.set(leak.leakId, leak);
      }
    }

    const totalLeaked = leaks.reduce((s, l) => s + l.amount, 0);

    // Update goal progress
    const leakGoal = this.goals.get('detect-revenue-leaks');
    if (leakGoal) {
      const leakRate = totalLeaked / Math.max(1, projectData.totalContractValue || 1);
      leakGoal.progress = leakRate <= 0.005 ? 1.0 : 0.005 / leakRate;
    }

    this.learn(
      { projectId, approvedCOs: approvedCOs.length, completedPhases: completedPhases.length },
      { leaksFound: leaks.length, totalLeaked },
      { id: 'revenue-leak-scan' }
    );

    return {
      projectId,
      leaksFound: leaks.length,
      totalLeaked,
      leaks: leaks.map(l => ({
        leakId: l.leakId,
        type: l.type,
        amount: l.amount,
        description: l.description,
      })),
    };
  }

  // ── Financial Close Acceleration ───────────────────────────────────────────

  accelerateFinancialClose(projectId, ledgerData = {}) {
    const budget = ledgerData.budget || {};
    const actual = ledgerData.actual || {};
    const mismatches = [];

    for (const [costCode, budgetAmount] of Object.entries(budget)) {
      const actualAmount = actual[costCode] || 0;
      const variance = actualAmount - budgetAmount;
      const variancePct = budgetAmount > 0 ? variance / budgetAmount : 0;

      if (Math.abs(variancePct) > 0.05) { // >5% variance flagged
        mismatches.push({
          costCode,
          budgetAmount,
          actualAmount,
          variance,
          variancePct: parseFloat((variancePct * 100).toFixed(1)) + '%',
          severity: Math.abs(variancePct) > 0.15 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // Store in reconciliation queue
    const reconciliation = {
      projectId,
      timestamp: Date.now(),
      mismatchCount: mismatches.length,
      mismatches,
      status: mismatches.length === 0 ? 'CLEAN' : 'NEEDS_REVIEW',
    };

    this.reconciliationQueue.push(reconciliation);
    this.jobCostLedgers.set(projectId, { budget, actual, mismatches });

    // Update goal
    const closeGoal = this.goals.get('accelerate-financial-close');
    if (closeGoal) {
      closeGoal.progress = mismatches.length === 0 ? 1.0 : Math.max(0, 1 - mismatches.length * 0.1);
    }

    this.learn(
      { projectId, costCodes: Object.keys(budget).length },
      { mismatchCount: mismatches.length, status: reconciliation.status },
      { id: 'financial-close' }
    );

    return reconciliation;
  }

  // ── Markov Model Internals ─────────────────────────────────────────────────

  _predictCollection(clientId) {
    const profile = this.clientProfiles.get(clientId);
    const healthFactor = profile ? profile.healthScore / PHI : PHI_INV;

    // Walk Markov chain from ISSUED state, 10-step horizon
    const stateVector = { ISSUED: 1.0 };

    for (let step = 0; step < 10; step++) {
      const next = {};
      for (const [fromState, prob] of Object.entries(stateVector)) {
        if (prob < 1e-6) continue;
        const transitions = this.transitionMatrix[fromState] || {};
        for (const [toState, tProb] of Object.entries(transitions)) {
          next[toState] = (next[toState] || 0) + prob * tProb;
        }
      }
      Object.assign(stateVector, next);
    }

    // Combine Markov probability with client health
    const markovProb = stateVector[INVOICE_STATES.COLLECTED] || 0.5;
    return parseFloat(Math.max(0, Math.min(1, PHI_INV * markovProb + (1 - PHI_INV) * healthFactor)).toFixed(4));
  }

  _expectedDaysToCollect(invoice) {
    const profile = this.clientProfiles.get(invoice.clientId);
    const baseExpected = 35; // days
    const lagBonus = profile ? profile.avgPaymentLag : 0;
    return Math.round(invoice.ageInDays + baseExpected + lagBonus);
  }

  _updateTransitionMatrix(fromState, toState) {
    // φ⁻¹ Bayesian update of transition probability
    // Guard: fromState must be a known invoice state before any matrix access
    const knownStates = new Set(Object.values(INVOICE_STATES));
    if (!knownStates.has(fromState) || !knownStates.has(toState)) return;

    const transitions = this.transitionMatrix[fromState];
    if (!transitions) return;

    const updated = {};
    for (const [state, prob] of Object.entries(transitions)) {
      if (!knownStates.has(state)) continue; // Skip any unexpected keys
      if (state === toState) {
        updated[state] = Math.min(0.99, prob + PHI_INV * (1 - prob));
      } else {
        updated[state] = Math.max(0.01, prob * (1 - PHI_INV * 0.1));
      }
    }

    // Normalize and replace the entire inner row atomically using a
    // prototype-less object — eliminates all computed property write risk
    const total = Object.values(updated).reduce((s, p) => s + p, 0);
    const newRow = Object.create(null);
    for (const state of knownStates) {
      if (Object.prototype.hasOwnProperty.call(updated, state)) {
        newRow[state] = updated[state] / total;
      }
    }
    this.transitionMatrix[fromState] = newRow;
  }

  _calculateAverageARAge() {
    const open = [...this.invoices.values()].filter(
      i => i.state !== INVOICE_STATES.COLLECTED && i.state !== INVOICE_STATES.DISPUTED
    );
    if (open.length === 0) return 0;
    return open.reduce((s, i) => s + i.ageInDays, 0) / open.length;
  }

  // ── Autonomous Monitor ─────────────────────────────────────────────────────

  _startAutonomousMonitor() {
    // Check for aging invoices every hour (simulated as every 3600 ticks)
    setInterval(() => {
      for (const [, invoice] of this.invoices) {
        if (invoice.state === INVOICE_STATES.ISSUED && invoice.ageInDays >= 30) {
          this.advanceInvoiceState(invoice.invoiceId, INVOICE_STATES.AGING);
        }
        if (invoice.state === INVOICE_STATES.AGING && invoice.ageInDays >= 60) {
          this.advanceInvoiceState(invoice.invoiceId, INVOICE_STATES.OVERDUE);
        }
      }
    }, 3600000);
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    const openInvoices = [...this.invoices.values()].filter(
      i => i.state !== INVOICE_STATES.COLLECTED
    );
    const totalAR = openInvoices.reduce((s, i) => s + i.amount, 0);
    const avgAge = this._calculateAverageARAge();

    return {
      ...baseStatus,
      revenueState: {
        totalInvoicesTracked: this.invoices.size,
        openReceivables: openInvoices.length,
        totalAROutstanding: totalAR,
        averageARAgeDays: parseFloat(avgAge.toFixed(1)),
        clientsScored: this.clientProfiles.size,
        revenueLeaksDetected: this.revenueLeaks.size,
        totalLeakedAmount: [...this.revenueLeaks.values()].reduce((s, l) => s + l.amount, 0),
        reconciliationsRun: this.reconciliationQueue.length,
      },
      cashFlowProjection: this.cashFlowProjection.slice(0, 4), // Next 4 weeks
    };
  }
}

// ── Factory Function ────────────────────────────────────────────────────────

export function birthTRACTEX(config = {}) {
  return new TRACTEX_AGI(config);
}

export default TRACTEX_AGI;
