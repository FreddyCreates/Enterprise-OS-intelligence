/**
 * PROTO-015: Spatial Optimization Protocol (SOP)  (Medina)
 *
 * Maximises revenue and throughput per square foot of leasable/operational space.
 *
 * Uses a greedy assignment heuristic (relaxed LP assignment problem) to place
 * tenant categories into facility zones based on passenger flow, dwell time,
 * and revenue density. Revenue density heatmaps are recomputed every planning
 * cycle; φ-weighted scoring balances short-term yield against long-term dwell
 * uplift. Zone reassignment recommendations are surfaced when reallocation
 * improves the global revenue density by > φ⁻¹ %.
 *
 * Engines wired: SpatialOptimizationEngine + RevenueDensityHeatmap + ZoneAssigner
 * Ring: Intelligence Ring
 * Wire: intelligence-wire/sop
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const REALLOC_THRESHOLD = PHI_INV / 100; // 0.618 % improvement triggers recommendation

// ── Revenue Density Heatmap ───────────────────────────────────────────────────

class RevenueDensityHeatmap {
  constructor() {
    this.cells = new Map(); // zoneId → { sqft, revenuePerSqft, flow, dwellMin }
  }

  upsert(zoneId, sqft, revenuePerSqft, flow, dwellMin) {
    this.cells.set(zoneId, { sqft, revenuePerSqft, flow, dwellMin });
  }

  densityScore(zoneId) {
    const c = this.cells.get(zoneId);
    if (!c) return 0;
    // φ-weighted blend of revenue density and flow×dwell productivity
    const revNorm = c.revenuePerSqft / 1000;
    const flowDwell = (c.flow * c.dwellMin) / 10000;
    return Math.round((revNorm * PHI + flowDwell * PHI_INV) * 1e4) / 1e4;
  }

  topZones(n = 5) {
    const scored = [...this.cells.keys()].map(id => ({ zoneId: id, score: this.densityScore(id) }));
    return scored.sort((a, b) => b.score - a.score).slice(0, n);
  }

  totalRevenuePotential() {
    let total = 0;
    for (const c of this.cells.values()) total += c.sqft * c.revenuePerSqft;
    return Math.round(total * 100) / 100;
  }
}

// ── Zone Assigner ─────────────────────────────────────────────────────────────

class ZoneAssigner {
  constructor() {
    this.assignments = new Map(); // zoneId → tenantCategory
    this.history = [];
  }

  assign(zoneId, tenantCategory) {
    const prev = this.assignments.get(zoneId) || null;
    this.assignments.set(zoneId, tenantCategory);
    if (prev && prev !== tenantCategory) {
      this.history.push({ zoneId, from: prev, to: tenantCategory, ts: Date.now() });
    }
    return { zoneId, tenantCategory, reassigned: prev !== null && prev !== tenantCategory };
  }

  recommendations(heatmap, categoryYield) {
    // For each zone, check if a higher-yield category would improve density
    const recs = [];
    for (const [zoneId, current] of this.assignments) {
      const currentScore = heatmap.densityScore(zoneId);
      for (const [cat, yieldVal] of Object.entries(categoryYield)) {
        if (cat === current) continue;
        const cell = heatmap.cells.get(zoneId);
        if (!cell) continue;
        const projectedRev = yieldVal;
        const projectedScore = (projectedRev / 1000) * PHI + ((cell.flow * cell.dwellMin) / 10000) * PHI_INV;
        const improvement = (projectedScore - currentScore) / Math.max(currentScore, 0.001);
        if (improvement > REALLOC_THRESHOLD) {
          recs.push({ zoneId, currentCategory: current, recommendedCategory: cat, improvementPct: Math.round(improvement * 10000) / 100 });
        }
      }
    }
    return recs.sort((a, b) => b.improvementPct - a.improvementPct);
  }
}

// ── Spatial Optimization Engine ───────────────────────────────────────────────

class SpatialOptimizationEngine {
  constructor(config = {}) {
    this.facilityId = config.facilityId || 'FACILITY-001';
    this.heatmap = new RevenueDensityHeatmap();
    this.assigner = new ZoneAssigner();
    this.categoryYield = {};  // tenantCategory → revenuePerSqft baseline
    this.planningCycle = 0;
  }

  defineZone(zoneId, sqft, flow, dwellMin) {
    const existing = this.heatmap.cells.get(zoneId) || { revenuePerSqft: 0 };
    this.heatmap.upsert(zoneId, sqft, existing.revenuePerSqft, flow, dwellMin);
  }

  setRevenueActual(zoneId, revenuePerSqft) {
    const c = this.heatmap.cells.get(zoneId);
    if (c) this.heatmap.upsert(zoneId, c.sqft, revenuePerSqft, c.flow, c.dwellMin);
  }

  setCategoryYield(category, yieldPerSqft) {
    this.categoryYield[category] = yieldPerSqft;
  }

  assignTenant(zoneId, category) {
    return this.assigner.assign(zoneId, category);
  }

  optimize() {
    this.planningCycle++;
    const recs = this.assigner.recommendations(this.heatmap, this.categoryYield);
    return { planningCycle: this.planningCycle, recommendations: recs, topZones: this.heatmap.topZones() };
  }

  utilizationRate() {
    const total = [...this.heatmap.cells.values()].reduce((s, c) => s + c.sqft, 0);
    const assigned = [...this.assigner.assignments.keys()].reduce((s, id) => {
      const c = this.heatmap.cells.get(id);
      return s + (c ? c.sqft : 0);
    }, 0);
    return total > 0 ? Math.round((assigned / total) * 1e4) / 1e4 : 0;
  }

  run() {
    const opt = this.optimize();
    return {
      protocol: 'PROTO-015',
      facilityId: this.facilityId,
      zoneCount: this.heatmap.cells.size,
      totalRevenuePotential: this.heatmap.totalRevenuePotential(),
      utilizationRate: this.utilizationRate(),
      topZones: opt.topZones,
      recommendations: opt.recommendations,
      phiReallocThresholdPct: Math.round(REALLOC_THRESHOLD * 10000) / 100,
    };
  }

  status() {
    return this.run();
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createSpatialOptimizationProtocol(config = {}) {
  return new SpatialOptimizationEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  REALLOC_THRESHOLD,
  RevenueDensityHeatmap,
  ZoneAssigner,
  SpatialOptimizationEngine,
  createSpatialOptimizationProtocol,
};
