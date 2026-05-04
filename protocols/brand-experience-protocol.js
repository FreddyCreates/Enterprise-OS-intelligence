/**
 * PROTO-021: Brand Experience Protocol (BXP)  (Medina)
 *
 * Ensures brand consistency and performance across multi-location retail/hospitality brands.
 *
 * Scores every location on 6 brand pillars — Visual Identity, Service Quality,
 * Product Consistency, Staff Presentation, Digital Presence, Customer Loyalty —
 * and combines them into a Brand Experience Index (BXI) using φ-exponential
 * weighting. Brand drift is detected when a location's BXI falls more than
 * φ⁻¹ standard deviations below the brand average. Corrective action
 * protocols are triggered per-pillar.
 *
 * Engines wired: BrandExperienceEngine + BXICalculator + BrandDriftDetector
 * Ring: Intelligence Ring
 * Wire: intelligence-wire/bxp
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const PILLARS = ['visual_identity', 'service_quality', 'product_consistency', 'staff_presentation', 'digital_presence', 'customer_loyalty'];

// φ-exponential weights: first pillar has highest weight
const RAW_PILLAR_WEIGHTS = PILLARS.map((_, i) => Math.pow(PHI, PILLARS.length - 1 - i));
const PILLAR_WEIGHT_SUM = RAW_PILLAR_WEIGHTS.reduce((a, b) => a + b, 0);
const PILLAR_WEIGHTS = Object.fromEntries(PILLARS.map((p, i) => [p, RAW_PILLAR_WEIGHTS[i] / PILLAR_WEIGHT_SUM]));

const DRIFT_SIGMA = PHI_INV;          // drift threshold in std deviations
const BXI_EXCELLENCE = 0.85;
const BXI_WARNING    = 0.65;

// ── BXI Calculator ────────────────────────────────────────────────────────────

class BXICalculator {
  compute(scores) {
    let bxi = 0;
    for (const pillar of PILLARS) {
      const norm = Math.min(1, Math.max(0, (scores[pillar] || 0) / 10));
      bxi += norm * PILLAR_WEIGHTS[pillar];
    }
    return Math.round(bxi * 1e4) / 1e4;
  }

  weakPillars(scores, threshold = 6.5) {
    return PILLARS.filter(p => (scores[p] || 0) < threshold);
  }
}

// ── Brand Drift Detector ──────────────────────────────────────────────────────

class BrandDriftDetector {
  detect(locationBXIs) {
    const values = Object.values(locationBXIs);
    if (values.length < 2) return {};
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const drifted = {};
    for (const [locId, bxi] of Object.entries(locationBXIs)) {
      const sigma = std > 0 ? (mean - bxi) / std : 0;
      if (sigma >= DRIFT_SIGMA) {
        drifted[locId] = { bxi, mean: Math.round(mean * 1e4) / 1e4, sigmaBelow: Math.round(sigma * 1e4) / 1e4 };
      }
    }
    return drifted;
  }
}

// ── Brand Experience Engine ───────────────────────────────────────────────────

class BrandExperienceEngine {
  constructor(config = {}) {
    this.brandId = config.brandId || 'BRAND-001';
    this.brandName = config.brandName || 'Enterprise Brand';
    this.locations = new Map();   // locationId → { name, scores, bxi, history }
    this.calc = new BXICalculator();
    this.driftDetector = new BrandDriftDetector();
    this.auditCycle = 0;
  }

  registerLocation(locationId, name) {
    this.locations.set(locationId, { id: locationId, name, scores: {}, bxi: null, history: [] });
    return locationId;
  }

  submitAudit(locationId, scores) {
    if (!this.locations.has(locationId)) this.registerLocation(locationId, locationId);
    const loc = this.locations.get(locationId);
    loc.scores = { ...scores };
    loc.bxi = this.calc.compute(scores);
    loc.history.push({ cycle: this.auditCycle, bxi: loc.bxi, ts: Date.now() });
    return { locationId, bxi: loc.bxi, weakPillars: this.calc.weakPillars(scores) };
  }

  advanceCycle() {
    this.auditCycle++;
    return this.auditCycle;
  }

  brandBXI() {
    const values = [...this.locations.values()].map(l => l.bxi).filter(b => b !== null);
    if (!values.length) return null;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1e4) / 1e4;
  }

  driftAnalysis() {
    const bxiMap = {};
    for (const [id, loc] of this.locations) {
      if (loc.bxi !== null) bxiMap[id] = loc.bxi;
    }
    return this.driftDetector.detect(bxiMap);
  }

  leaderboard() {
    return [...this.locations.values()]
      .filter(l => l.bxi !== null)
      .sort((a, b) => b.bxi - a.bxi)
      .map(l => ({ id: l.id, name: l.name, bxi: l.bxi, status: l.bxi >= BXI_EXCELLENCE ? 'excellent' : l.bxi >= BXI_WARNING ? 'good' : 'at_risk' }));
  }

  run() {
    const drifted = this.driftAnalysis();
    return {
      protocol: 'PROTO-021',
      brandId: this.brandId,
      brandName: this.brandName,
      auditCycle: this.auditCycle,
      locationCount: this.locations.size,
      brandBXI: this.brandBXI(),
      driftedLocations: Object.keys(drifted).length,
      driftDetails: drifted,
      leaderboard: this.leaderboard(),
      pillarWeights: PILLAR_WEIGHTS,
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createBrandExperienceProtocol(config = {}) {
  return new BrandExperienceEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  PILLARS,
  PILLAR_WEIGHTS,
  BXI_EXCELLENCE,
  BXI_WARNING,
  DRIFT_SIGMA,
  BXICalculator,
  BrandDriftDetector,
  BrandExperienceEngine,
  createBrandExperienceProtocol,
};
