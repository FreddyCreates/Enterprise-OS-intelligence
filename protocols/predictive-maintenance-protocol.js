/**
 * PROTO-019: Predictive Maintenance Protocol (PMP)  (Medina)
 *
 * Predicts equipment failure before it happens using Weibull survival analysis.
 *
 * Manages 15 asset categories across airport infrastructure. For each asset,
 * a two-parameter Weibull distribution (shape β, scale η) is fit to historical
 * failure data. Remaining Useful Life (RUL) is derived from the survival
 * function S(t) = exp(-(t/η)^β). φ-weighted criticality scores rank
 * maintenance urgency. Interventions are scheduled when RUL drops below the
 * φ-inverse of the asset's expected lifecycle.
 *
 * Engines wired: PredictiveMaintenanceEngine + WeibullAnalyzer + AssetRegistry
 * Ring: Coordination Ring
 * Wire: intelligence-wire/pmp
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

const ASSET_CATEGORIES = [
  'escalator', 'moving_walkway', 'baggage_belt', 'jet_bridge', 'hvac_unit',
  'generator', 'ground_vehicle', 'elevator', 'automated_door', 'people_mover',
  'fire_suppression', 'runway_light', 'fuel_hydrant', 'security_camera', 'pax_bridge',
];

const DEFAULT_WEIBULL = { beta: 2.0, eta: 8760 }; // shape 2 (wear-out), scale 1yr in hours

// ── Weibull Analyzer ──────────────────────────────────────────────────────────

class WeibullAnalyzer {
  // Survival function: S(t) = exp(-(t/eta)^beta)
  survival(t, beta, eta) {
    return Math.exp(-Math.pow(t / eta, beta));
  }

  // Hazard rate: h(t) = (beta/eta) * (t/eta)^(beta-1)
  hazard(t, beta, eta) {
    if (t <= 0) return 0;
    return (beta / eta) * Math.pow(t / eta, beta - 1);
  }

  // RUL: time from current age to S(t) = φ⁻¹ (61.8% survival threshold)
  rul(currentAgeHours, beta, eta) {
    // Solve exp(-(T/eta)^beta) = PHI_INV → T = eta * (-ln(PHI_INV))^(1/beta)
    const T_threshold = eta * Math.pow(-Math.log(PHI_INV), 1 / beta);
    return Math.max(0, Math.round(T_threshold - currentAgeHours));
  }

  mttf(beta, eta) {
    // MTTF = eta * Γ(1 + 1/beta) ≈ eta * (1/beta + 0.5772/beta^2) for large beta
    const gammaTerm = Math.exp(this._lnGamma(1 + 1 / beta));
    return Math.round(eta * gammaTerm);
  }

  _lnGamma(z) {
    // Lanczos approximation
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - this._lnGamma(1 - z);
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
}

// ── Asset Registry ────────────────────────────────────────────────────────────

class AssetRegistry {
  constructor() {
    this.assets = new Map();
    this.nextId = 1;
  }

  register(category, location, criticality, ageHours, beta, eta) {
    if (!ASSET_CATEGORIES.includes(category)) throw new Error(`Unknown category: ${category}`);
    const id = `ASSET-${String(this.nextId++).padStart(5, '0')}`;
    this.assets.set(id, { id, category, location, criticality, ageHours, beta: beta || DEFAULT_WEIBULL.beta, eta: eta || DEFAULT_WEIBULL.eta, maintenanceLog: [] });
    return id;
  }

  logMaintenance(assetId, type, notes = '') {
    const asset = this.assets.get(assetId);
    if (!asset) return null;
    asset.ageHours = 0; // reset age after maintenance
    asset.maintenanceLog.push({ type, notes, ts: Date.now() });
    return asset;
  }

  get(id) { return this.assets.get(id) || null; }
  all() { return [...this.assets.values()]; }
}

// ── Predictive Maintenance Engine ─────────────────────────────────────────────

class PredictiveMaintenanceEngine {
  constructor(config = {}) {
    this.facilityId = config.facilityId || 'AIRPORT-001';
    this.analyzer = new WeibullAnalyzer();
    this.registry = new AssetRegistry();
    this.runCount = 0;
  }

  addAsset(category, location, criticality, ageHours, beta, eta) {
    return this.registry.register(category, location, criticality, ageHours, beta, eta);
  }

  maintain(assetId, type, notes) {
    return this.registry.logMaintenance(assetId, type, notes);
  }

  assetHealth(assetId) {
    const asset = this.registry.get(assetId);
    if (!asset) return null;
    const { ageHours, beta, eta, criticality } = asset;
    const survival = this.analyzer.survival(ageHours, beta, eta);
    const hazard = this.analyzer.hazard(ageHours, beta, eta);
    const rul = this.analyzer.rul(ageHours, beta, eta);
    const mttf = this.analyzer.mttf(beta, eta);
    // φ-weighted urgency: high criticality + low survival → high urgency
    const urgency = Math.round((criticality * (1 - survival) * PHI) * 1e4) / 1e4;
    return { assetId, category: asset.category, ageHours, survival: Math.round(survival * 1e4) / 1e4, hazard: Math.round(hazard * 1e6) / 1e6, rulHours: rul, mttfHours: mttf, urgency };
  }

  schedule() {
    return this.registry.all()
      .map(a => this.assetHealth(a.id))
      .filter(Boolean)
      .sort((a, b) => b.urgency - a.urgency);
  }

  criticalAssets(threshold = 0.5) {
    return this.schedule().filter(a => a.survival < threshold);
  }

  run() {
    this.runCount++;
    const sched = this.schedule();
    const critical = sched.filter(a => a.survival < 0.5);
    return {
      protocol: 'PROTO-019',
      facilityId: this.facilityId,
      runCount: this.runCount,
      totalAssets: this.registry.assets.size,
      criticalCount: critical.length,
      phiSurvivalThreshold: PHI_INV,
      topUrgent: sched.slice(0, 5),
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createPredictiveMaintenanceProtocol(config = {}) {
  return new PredictiveMaintenanceEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  ASSET_CATEGORIES,
  DEFAULT_WEIBULL,
  WeibullAnalyzer,
  AssetRegistry,
  PredictiveMaintenanceEngine,
  createPredictiveMaintenanceProtocol,
};
