/**
 * PROTO-013: Workforce Mesh Protocol (WMP)  (Medina)
 *
 * Multi-employer workforce coordination across shared facilities.
 *
 * Airports host 50+ independent employers sharing the same footprint.
 * WMP models the workforce as a mesh graph — nodes are employers, edges are
 * shared workers (float pool, inter-employer transfers). Graph coloring
 * (chromatic number minimisation) resolves coverage conflicts; φ-weighted
 * fatigue accumulation tracks cross-employer duty hours.
 *
 * Engines wired: WorkforceMeshEngine + GraphColoringEngine + FatigueTracker
 * Ring: Coordination Ring
 * Wire: intelligence-wire/wmp
 */

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const MAX_SHIFT_HOURS = 10;
const FATIGUE_THRESHOLD = PHI * 4; // ~6.47 fatigue units before mandatory rest

// ── Graph Coloring (Greedy) ───────────────────────────────────────────────────

function greedyColor(adjacency) {
  const nodes = Object.keys(adjacency);
  const colors = {};
  for (const node of nodes) {
    const neighborColors = new Set((adjacency[node] || []).map(n => colors[n]).filter(c => c !== undefined));
    let color = 1;
    while (neighborColors.has(color)) color++;
    colors[node] = color;
  }
  return colors;
}

// ── Fatigue Tracker ───────────────────────────────────────────────────────────

class FatigueTracker {
  constructor() {
    this.records = new Map(); // workerId → { totalHours, fatigueScore, employers }
  }

  log(workerId, employerId, hoursWorked) {
    if (!this.records.has(workerId)) {
      this.records.set(workerId, { totalHours: 0, fatigueScore: 0, employers: new Set() });
    }
    const r = this.records.get(workerId);
    r.totalHours += hoursWorked;
    r.employers.add(employerId);
    // φ-weighted fatigue: cross-employer work incurs higher fatigue
    const crossEmployerFactor = r.employers.size > 1 ? PHI : 1;
    r.fatigueScore += hoursWorked * crossEmployerFactor * PHI_INV;
    return r;
  }

  isFatigued(workerId) {
    const r = this.records.get(workerId);
    return r ? r.fatigueScore >= FATIGUE_THRESHOLD : false;
  }

  reset(workerId) {
    if (this.records.has(workerId)) {
      this.records.get(workerId).fatigueScore = 0;
    }
  }

  summary() {
    const entries = [];
    for (const [id, r] of this.records) {
      entries.push({ workerId: id, totalHours: r.totalHours, fatigueScore: Math.round(r.fatigueScore * 100) / 100, employerCount: r.employers.size, fatigued: r.fatigueScore >= FATIGUE_THRESHOLD });
    }
    return entries;
  }
}

// ── Workforce Mesh Engine ─────────────────────────────────────────────────────

class WorkforceMeshEngine {
  constructor(config = {}) {
    this.facilityId = config.facilityId || 'FACILITY-001';
    this.employers = new Map();   // employerId → { name, requiredCoverage, currentStaff }
    this.floatPool = new Map();   // workerId → { skills, currentEmployer }
    this.adjacency = {};          // employerId → [employerId] (share workers)
    this.fatigue = new FatigueTracker();
    this.conflictLog = [];
  }

  addEmployer(id, name, requiredCoverage) {
    this.employers.set(id, { name, requiredCoverage, currentStaff: 0 });
    this.adjacency[id] = this.adjacency[id] || [];
  }

  addFloatWorker(workerId, skills = []) {
    this.floatPool.set(workerId, { skills, currentEmployer: null });
  }

  linkEmployers(idA, idB) {
    this.adjacency[idA] = this.adjacency[idA] || [];
    this.adjacency[idB] = this.adjacency[idB] || [];
    if (!this.adjacency[idA].includes(idB)) this.adjacency[idA].push(idB);
    if (!this.adjacency[idB].includes(idA)) this.adjacency[idB].push(idA);
  }

  assignFloat(workerId, employerId, hours) {
    const worker = this.floatPool.get(workerId);
    const employer = this.employers.get(employerId);
    if (!worker || !employer) return { ok: false, reason: 'not_found' };
    if (this.fatigue.isFatigued(workerId)) return { ok: false, reason: 'fatigued' };
    if (hours > MAX_SHIFT_HOURS) return { ok: false, reason: 'shift_too_long' };
    worker.currentEmployer = employerId;
    employer.currentStaff++;
    this.fatigue.log(workerId, employerId, hours);
    return { ok: true, workerId, employerId, hours };
  }

  resolveConflicts() {
    const colors = greedyColor(this.adjacency);
    const chromaticNumber = Math.max(...Object.values(colors), 0);
    const conflicts = [];
    for (const [eId, neighbors] of Object.entries(this.adjacency)) {
      for (const n of neighbors) {
        if (colors[eId] === colors[n]) {
          conflicts.push({ employerA: eId, employerB: n });
        }
      }
    }
    this.conflictLog.push({ resolvedAt: Date.now(), chromaticNumber, conflicts: conflicts.length });
    return { colors, chromaticNumber, conflicts };
  }

  coverageScore() {
    let total = 0, covered = 0;
    for (const emp of this.employers.values()) {
      total += emp.requiredCoverage;
      covered += Math.min(emp.currentStaff, emp.requiredCoverage);
    }
    return total > 0 ? Math.round((covered / total) * PHI * 1000) / 1000 : 0;
  }

  run() {
    const resolution = this.resolveConflicts();
    return {
      protocol: 'PROTO-013',
      facilityId: this.facilityId,
      employerCount: this.employers.size,
      floatPoolSize: this.floatPool.size,
      chromaticNumber: resolution.chromaticNumber,
      coverageScore: this.coverageScore(),
      fatigued: this.fatigue.summary().filter(w => w.fatigued).length,
      conflicts: resolution.conflicts,
      phiWeightedFatigueThreshold: FATIGUE_THRESHOLD,
    };
  }

  status() {
    return { ...this.run(), fatigueSummary: this.fatigue.summary() };
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

function createWorkforceMeshProtocol(config = {}) {
  return new WorkforceMeshEngine(config);
}

module.exports = {
  PHI,
  PHI_INV,
  MAX_SHIFT_HOURS,
  FATIGUE_THRESHOLD,
  greedyColor,
  FatigueTracker,
  WorkforceMeshEngine,
  createWorkforceMeshProtocol,
};
