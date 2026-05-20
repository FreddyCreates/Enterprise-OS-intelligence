/**
 * PROTO-014: Vendor Intelligence Protocol (VIP)  (Medina)
 *
 * Continuous vendor performance scoring and relationship intelligence.
 *
 * Scores every vendor on 5 axes — On-Time Delivery, Quality, Price
 * Competitiveness, Responsiveness, and Sustainability — then combines them
 * into a single φ-weighted composite score. Tracks scorecard history over
 * time, detects deterioration via moving-average delta, and auto-recommends
 * qualification or disqualification actions.
 *
 * Engines wired: VendorIntelligenceEngine + ScorecardLedger + DeteriorationDetector
 * Ring: Intelligence Ring
 * Wire: intelligence-wire/vip
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const SCORE_AXES = ['otd', 'quality', 'price', 'responsiveness', 'sustainability'];

// φ-weights summing to 1 (powers of PHI_INV, normalised)
const RAW_WEIGHTS = SCORE_AXES.map((_, i) => Math.pow(PHI_INV, i));
const WEIGHT_SUM = RAW_WEIGHTS.reduce((a, b) => a + b, 0);
const PHI_WEIGHTS = RAW_WEIGHTS.map(w => w / WEIGHT_SUM);

const QUALIFY_THRESHOLD = 0.72;
const DISQUALIFY_THRESHOLD = 0.45;
const DETERIORATION_DELTA = -0.08; // composite drop over last 3 cycles

// ── Scorecard Ledger ──────────────────────────────────────────────────────────

class ScorecardLedger {
  constructor(vendorId) {
    this.vendorId = vendorId;
    this.history = []; // [{ cycle, scores, composite, ts }]
  }

  record(cycle, scores) {
    const composite = SCORE_AXES.reduce((sum, ax, i) => sum + (scores[ax] || 0) * PHI_WEIGHTS[i], 0);
    const entry = { cycle, scores: { ...scores }, composite: Math.round(composite * 1e4) / 1e4, ts: Date.now() };
    this.history.push(entry);
    return entry;
  }

  latestComposite() {
    return this.history.length ? this.history[this.history.length - 1].composite : null;
  }

  deteriorationDelta(window = 3) {
    if (this.history.length < 2) return 0;
    const recent = this.history.slice(-window).map(e => e.composite);
    return recent[recent.length - 1] - recent[0];
  }
}

// ── Deterioration Detector ────────────────────────────────────────────────────

class DeteriorationDetector {
  detect(ledger) {
    const delta = ledger.deteriorationDelta();
    const latest = ledger.latestComposite();
    const deteriorating = delta <= DETERIORATION_DELTA;
    let action = 'monitor';
    if (latest !== null) {
      if (latest >= QUALIFY_THRESHOLD && !deteriorating) action = 'qualify';
      else if (latest <= DISQUALIFY_THRESHOLD || (deteriorating && latest < QUALIFY_THRESHOLD)) action = 'disqualify';
      else if (deteriorating) action = 'probation';
    }
    return { vendorId: ledger.vendorId, latest, delta: Math.round(delta * 1e4) / 1e4, deteriorating, action };
  }
}

// ── Vendor Intelligence Engine ────────────────────────────────────────────────

class VendorIntelligenceEngine {
  constructor(config = {}) {
    this.orgId = config.orgId || 'ORG-001';
    this.ledgers = new Map();   // vendorId → ScorecardLedger
    this.detector = new DeteriorationDetector();
    this.cycle = 0;
  }

  registerVendor(vendorId, name) {
    this.ledgers.set(vendorId, Object.assign(new ScorecardLedger(vendorId), { name }));
    return vendorId;
  }

  submitScores(vendorId, scores) {
    if (!this.ledgers.has(vendorId)) this.registerVendor(vendorId, vendorId);
    return this.ledgers.get(vendorId).record(this.cycle, scores);
  }

  advanceCycle() {
    this.cycle++;
    return this.cycle;
  }

  scorecard(vendorId) {
    const ledger = this.ledgers.get(vendorId);
    if (!ledger) return null;
    const detection = this.detector.detect(ledger);
    return { vendorId, history: ledger.history, ...detection };
  }

  leaderboard() {
    const board = [];
    for (const [id, ledger] of this.ledgers) {
      const latest = ledger.latestComposite();
      if (latest !== null) board.push({ vendorId: id, composite: latest });
    }
    return board.sort((a, b) => b.composite - a.composite);
  }

  flagged() {
    const flags = [];
    for (const ledger of this.ledgers.values()) {
      const d = this.detector.detect(ledger);
      if (d.action !== 'qualify' && d.action !== 'monitor') flags.push(d);
    }
    return flags;
  }

  run() {
    return {
      protocol: 'PROTO-014',
      orgId: this.orgId,
      cycle: this.cycle,
      vendorCount: this.ledgers.size,
      phiWeights: PHI_WEIGHTS.map((w, i) => ({ axis: SCORE_AXES[i], weight: Math.round(w * 1e4) / 1e4 })),
      leaderboard: this.leaderboard(),
      flagged: this.flagged(),
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createVendorIntelligenceProtocol(config = {}) {
  return new VendorIntelligenceEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  SCORE_AXES,
  PHI_WEIGHTS,
  QUALIFY_THRESHOLD,
  DISQUALIFY_THRESHOLD,
  DETERIORATION_DELTA,
  ScorecardLedger,
  DeteriorationDetector,
  VendorIntelligenceEngine,
  createVendorIntelligenceProtocol,
};
