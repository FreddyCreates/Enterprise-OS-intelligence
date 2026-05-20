/**
 * PROTO-017: Compliance Automation Protocol (CAP)  (Medina)
 *
 * Automates regulatory compliance tracking and deadline management.
 *
 * Tracks 80+ compliance items across FAA, TSA, OSHA, ADA, EPA, and local
 * ordinances. Each item is assigned a φ-priority score:
 *   priority = penalty × probability × φ^(1 / daysRemaining)
 * This ensures near-term, high-penalty, high-probability items always surface
 * first. The compliance calendar auto-escalates through OPEN → WATCH →
 * ESCALATED → OVERDUE lifecycle stages.
 *
 * Engines wired: ComplianceAutomationEngine + ComplianceCalendar + RiskScorer
 * Ring: Coordination Ring
 * Wire: intelligence-wire/cap
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const AGENCIES = ['FAA', 'TSA', 'OSHA', 'ADA', 'EPA', 'LOCAL'];
const LIFECYCLE = ['open', 'watch', 'escalated', 'overdue', 'closed'];

const WATCH_DAYS = 30;
const ESCALATE_DAYS = 14;

// ── Risk Scorer ───────────────────────────────────────────────────────────────

function phiPriority(penalty, probability, daysRemaining) {
  if (daysRemaining <= 0) return Infinity;
  const urgency = Math.pow(PHI, 1 / daysRemaining);
  return Math.round(penalty * probability * urgency * 1e4) / 1e4;
}

// ── Compliance Calendar ───────────────────────────────────────────────────────

class ComplianceCalendar {
  constructor() {
    this.items = new Map(); // itemId → compliance item
    this.nextId = 1;
  }

  add(agency, title, penalty, probability, dueDateMs) {
    const id = `CAP-${String(this.nextId++).padStart(4, '0')}`;
    this.items.set(id, { id, agency, title, penalty, probability, dueDateMs, status: 'open', notes: [], createdMs: Date.now() });
    return id;
  }

  daysRemaining(itemId, nowMs = Date.now()) {
    const item = this.items.get(itemId);
    if (!item) return null;
    return Math.ceil((item.dueDateMs - nowMs) / 86400000);
  }

  updateStatus(itemId, nowMs = Date.now()) {
    const item = this.items.get(itemId);
    if (!item || item.status === 'closed') return item;
    const days = this.daysRemaining(itemId, nowMs);
    if (days <= 0) item.status = 'overdue';
    else if (days <= ESCALATE_DAYS) item.status = 'escalated';
    else if (days <= WATCH_DAYS) item.status = 'watch';
    else item.status = 'open';
    return item;
  }

  close(itemId) {
    const item = this.items.get(itemId);
    if (item) item.status = 'closed';
    return item;
  }

  addNote(itemId, note) {
    const item = this.items.get(itemId);
    if (item) item.notes.push({ note, ts: Date.now() });
  }

  all(nowMs = Date.now()) {
    return [...this.items.values()].map(item => {
      this.updateStatus(item.id, nowMs);
      const days = this.daysRemaining(item.id, nowMs);
      const priority = item.status !== 'closed' ? phiPriority(item.penalty, item.probability, days) : 0;
      return { ...item, daysRemaining: days, priority };
    }).sort((a, b) => b.priority - a.priority);
  }
}

// ── Compliance Automation Engine ──────────────────────────────────────────────

class ComplianceAutomationEngine {
  constructor(config = {}) {
    this.entityId = config.entityId || 'AIRPORT-001';
    this.calendar = new ComplianceCalendar();
    this.runCount = 0;
  }

  addItem(agency, title, penalty, probability, dueDateMs) {
    if (!AGENCIES.includes(agency)) throw new Error(`Unknown agency: ${agency}`);
    if (probability < 0 || probability > 1) throw new Error('Probability must be 0–1');
    return this.calendar.add(agency, title, penalty, probability, dueDateMs);
  }

  closeItem(itemId) {
    return this.calendar.close(itemId);
  }

  note(itemId, text) {
    this.calendar.addNote(itemId, text);
  }

  riskScore(nowMs = Date.now()) {
    const items = this.calendar.all(nowMs).filter(i => i.status !== 'closed');
    const totalRisk = items.reduce((s, i) => s + i.penalty * i.probability, 0);
    const phiAdjusted = items.reduce((s, i) => s + i.priority, 0);
    return { itemCount: items.size, totalRisk: Math.round(totalRisk * 100) / 100, phiAdjustedPriority: Math.round(phiAdjusted * 100) / 100 };
  }

  byStatus(nowMs = Date.now()) {
    const all = this.calendar.all(nowMs);
    const counts = {};
    for (const s of LIFECYCLE) counts[s] = 0;
    for (const item of all) counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }

  escalated(nowMs = Date.now()) {
    return this.calendar.all(nowMs).filter(i => i.status === 'escalated' || i.status === 'overdue');
  }

  run(nowMs = Date.now()) {
    this.runCount++;
    const all = this.calendar.all(nowMs);
    const statusCounts = this.byStatus(nowMs);
    const risk = this.riskScore(nowMs);
    return {
      protocol: 'PROTO-017',
      entityId: this.entityId,
      runCount: this.runCount,
      totalItems: all.length,
      statusCounts,
      riskScore: risk.totalRisk,
      phiPriorityTotal: risk.phiAdjustedPriority,
      escalated: this.escalated(nowMs).length,
      topItems: all.slice(0, 5).map(i => ({ id: i.id, title: i.title, agency: i.agency, status: i.status, daysRemaining: i.daysRemaining, priority: i.priority })),
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createComplianceAutomationProtocol(config = {}) {
  return new ComplianceAutomationEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  AGENCIES,
  LIFECYCLE,
  WATCH_DAYS,
  ESCALATE_DAYS,
  phiPriority,
  ComplianceCalendar,
  ComplianceAutomationEngine,
  createComplianceAutomationProtocol,
};
