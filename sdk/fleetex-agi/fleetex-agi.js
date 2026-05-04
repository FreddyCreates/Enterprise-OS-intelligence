/**
 * FLEETEX AGI — Ground Support Equipment & Fleet Intelligence
 * RSHIP-2026-FLEETEX-001
 *
 * Domain: Ground Support Equipment & Fleet Management
 * Latin: flecto — "to bend, to turn, to manage a course"
 *   flecto (to bend/turn) captures the constant routing and maneuvering of GSE on the apron.
 *   Ground support equipment — tugs, belt loaders, pushback tractors — are the nervous system
 *   of the ramp. FLEETEX applies reliability engineering and graph routing to maximize GSE
 *   availability and safety.
 *
 * Theory: Weibull reliability analysis, OEE framework (TPM), Dijkstra shortest path (graph theory),
 *   OSHA recordkeeping (300/300A/301), PHI-compounding safety intelligence (AURUM — Paper XXII),
 *   RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Ground Support Equipment Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const GSE_TYPES = [
  'pushback_tractor', 'belt_loader', 'baggage_tug', 'fuel_truck',
  'catering_truck', 'lavatory_truck', 'water_truck', 'gpu',
  'air_start_unit', 'deicing_truck',
];

// Weibull shape (β) and scale (η in hours) parameters by equipment type
const WEIBULL_PARAMS = {
  pushback_tractor: { beta: 2.2, eta: 8000 },
  belt_loader:      { beta: 1.8, eta: 6000 },
  baggage_tug:      { beta: 2.0, eta: 5000 },
  fuel_truck:       { beta: 2.5, eta: 10000 },
  catering_truck:   { beta: 2.1, eta: 7000 },
  lavatory_truck:   { beta: 1.9, eta: 6500 },
  water_truck:      { beta: 1.9, eta: 6500 },
  gpu:              { beta: 1.5, eta: 12000 },
  air_start_unit:   { beta: 1.6, eta: 9000 },
  deicing_truck:    { beta: 2.3, eta: 5500 },
};

const OEE_BENCHMARKS = { worldClass: 0.85, typical: 0.60, poor: 0.40 };
const OSHA_DART_BENCHMARK = 3.2;  // transportation/warehousing

const ELECTRIC_COST_PER_UNIT  = 0.04;  // $/equivalent work unit
const DIESEL_COST_PER_UNIT    = 0.14;  // $/equivalent work unit
const ELECTRIC_TCO_PREMIUM    = 1.35;  // electric capex 35% higher upfront
const DIESEL_CARBON_KG_PER_HR = 2.6;   // kg CO2/hr

// ── FLEETEX Core ──
class FLEETEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-FLEETEX-001';
    this.domain      = 'Ground Support Equipment & Fleet Management';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: Weibull-Based Maintenance Scheduling ──
  scheduleMaintenanceWeibull(fleetData = []) {
    const results = fleetData.map(unit => {
      const { unitId, gseType, hoursOperated, lastMaintenanceHours } = unit;
      const params = WEIBULL_PARAMS[gseType] || WEIBULL_PARAMS['baggage_tug'];
      const { beta, eta } = params;

      // Weibull reliability: R(t) = exp(-(t/η)^β)
      const reliability = Math.exp(-Math.pow(hoursOperated / eta, beta));

      // Weibull failure rate (hazard): λ(t) = (β/η) × (t/η)^(β-1)
      const hazardRate  = (beta / eta) * Math.pow(hoursOperated / eta, beta - 1);

      // MTBF for Weibull: η × Γ(1 + 1/β) — approximate with Γ(x) ≈ Stirling
      const gammaArg    = 1 + 1 / beta;
      const gamma       = this._gamma(gammaArg);
      const mtbf        = +(eta * gamma).toFixed(0);

      // Maintenance urgency: hours since last PM × hazard rate × phi
      const hoursSincePM  = hoursOperated - (lastMaintenanceHours || 0);
      const urgencyScore  = +(hoursSincePM * hazardRate * this.phi * 1000).toFixed(4);
      const maintenanceDue = reliability < 0.7 || urgencyScore > 1.0;

      // Recommended next PM interval: use phi-scaled reliability threshold
      const nextPMAtHours = eta * Math.pow(-Math.log(this.phiInv), 1 / beta);

      return {
        unitId,
        gseType,
        hoursOperated,
        reliability: +reliability.toFixed(4),
        hazardRate: +hazardRate.toFixed(6),
        mtbf,
        hoursSincePM,
        urgencyScore,
        maintenanceDue,
        nextPMAtHours: +nextPMAtHours.toFixed(0),
        priority: maintenanceDue ? 'IMMEDIATE' : urgencyScore > 0.5 ? 'SOON' : 'ROUTINE',
      };
    });

    results.sort((a, b) => b.urgencyScore - a.urgencyScore);
    this._log('scheduleMaintenanceWeibull', { unitCount: fleetData.length, dueNow: results.filter(r => r.maintenanceDue).length });
    return { results, immediateCount: results.filter(r => r.priority === 'IMMEDIATE').length };
  }

  // ── Method 2: Fleet Composition TCO Optimization ──
  optimizeFleetComposition(currentFleet = [], electricPricing = {}, dieselPricing = {}) {
    const eRate = electricPricing.costPerUnit  || ELECTRIC_COST_PER_UNIT;
    const dRate = dieselPricing.costPerUnit    || DIESEL_COST_PER_UNIT;
    const lifeYears = 10;

    const scenarios = currentFleet.map(unit => {
      const { unitId, gseType, hoursPerYear, capex } = unit;
      const workUnitsPerYear = hoursPerYear * 60;  // work units per minute-equivalent

      // Diesel TCO
      const dieselOpCost  = workUnitsPerYear * dRate;
      const dieselTCO     = capex + dieselOpCost * lifeYears;
      const carbonPerYear = hoursPerYear * DIESEL_CARBON_KG_PER_HR;

      // Electric TCO
      const elecCapex   = capex * ELECTRIC_TCO_PREMIUM;
      const elecOpCost  = workUnitsPerYear * eRate;
      const elecTCO     = elecCapex + elecOpCost * lifeYears;

      const savings       = +(dieselTCO - elecTCO).toFixed(2);
      const paybackYears  = elecCapex - capex > 0
        ? +((elecCapex - capex) / (dieselOpCost - elecOpCost)).toFixed(2)
        : 0;

      // PHI-weighted recommendation: savings × phi if payback < phi^2 years
      const phiRecommendScore = savings > 0 && paybackYears < Math.pow(this.phi, 2)
        ? +(savings * this.phi / 10000).toFixed(4)
        : 0;

      return {
        unitId,
        gseType,
        dieselTCO: +dieselTCO.toFixed(2),
        electricTCO: +elecTCO.toFixed(2),
        savings,
        paybackYears,
        carbonPerYear: +carbonPerYear.toFixed(1),
        phiRecommendScore,
        recommendation: savings > 0 && paybackYears < 8 ? 'ELECTRIFY' : 'KEEP-DIESEL',
      };
    });

    const electrifyCount = scenarios.filter(s => s.recommendation === 'ELECTRIFY').length;
    const totalSavings   = scenarios.reduce((s, u) => s + Math.max(u.savings, 0), 0);

    this._log('optimizeFleetComposition', { unitCount: currentFleet.length, electrifyCount });
    return { scenarios, electrifyCount, totalPotentialSavings: +totalSavings.toFixed(2) };
  }

  // ── Method 3: OEE Tracking ──
  trackOEE(equipmentData = []) {
    const results = equipmentData.map(unit => {
      const { unitId, gseType, plannedHours, availableHours, operatingHours, idealCycleTime, actualCycles, goodCycles } = unit;

      // OEE = Availability × Performance × Quality
      const availability  = plannedHours > 0 ? availableHours / plannedHours : 0;
      const performance   = operatingHours > 0 && idealCycleTime > 0
        ? (idealCycleTime * actualCycles) / (operatingHours * 60) : 0;
      const quality       = actualCycles > 0 ? goodCycles / actualCycles : 0;
      const oee           = +(availability * performance * quality).toFixed(4);

      let benchmark = 'poor';
      if (oee >= OEE_BENCHMARKS.worldClass)  benchmark = 'world-class';
      else if (oee >= OEE_BENCHMARKS.typical) benchmark = 'typical';

      // PHI-gap: distance from world-class × phi weighting
      const gapToWorldClass = Math.max(OEE_BENCHMARKS.worldClass - oee, 0);
      const phiGap          = +(gapToWorldClass * this.phi).toFixed(4);

      return {
        unitId,
        gseType,
        availability:  +availability.toFixed(4),
        performance:   +performance.toFixed(4),
        quality:       +quality.toFixed(4),
        oee,
        oeePercent:    +(oee * 100).toFixed(2),
        benchmark,
        gapToWorldClass: +gapToWorldClass.toFixed(4),
        phiGap,
        action: oee < OEE_BENCHMARKS.poor ? 'URGENT-REVIEW' : oee < OEE_BENCHMARKS.typical ? 'IMPROVE' : 'MAINTAIN',
      };
    });

    const fleetOEE  = results.length > 0 ? +(results.reduce((s, r) => s + r.oee, 0) / results.length).toFixed(4) : 0;
    this._log('trackOEE', { unitCount: equipmentData.length, fleetOEE });
    return { results, fleetOEE, fleetOEEPercent: +(fleetOEE * 100).toFixed(2), worldClassUnits: results.filter(r => r.benchmark === 'world-class').length };
  }

  // ── Method 4: GSE Routing via Dijkstra ──
  routeGSE(apronGraph = {}, fromGate, toGate, gseType = 'baggage_tug') {
    // apronGraph: { [nodeId]: { [neighborId]: distanceMeters } }
    const INF  = Infinity;
    const dist = {};
    const prev = {};
    const visited = new Set();
    const nodes = Object.keys(apronGraph);

    nodes.forEach(n => { dist[n] = INF; prev[n] = null; });
    dist[fromGate] = 0;

    // Speed factor by GSE type (km/h → affects traversal cost)
    const speedKmh = { pushback_tractor: 15, fuel_truck: 25, baggage_tug: 20, default: 18 };
    const speed    = speedKmh[gseType] || speedKmh.default;

    while (visited.size < nodes.length) {
      // Find unvisited node with minimum distance
      const current = nodes
        .filter(n => !visited.has(n))
        .reduce((a, b) => dist[a] < dist[b] ? a : b, nodes.find(n => !visited.has(n)));

      if (!current || dist[current] === INF) break;
      if (current === toGate) break;
      visited.add(current);

      const neighbors = apronGraph[current] || {};
      Object.entries(neighbors).forEach(([neighbor, edgeDist]) => {
        const newDist = dist[current] + edgeDist;
        if (newDist < dist[neighbor]) {
          dist[neighbor] = newDist;
          prev[neighbor] = current;
        }
      });
    }

    // Reconstruct path
    const path = [];
    let cur = toGate;
    while (cur) { path.unshift(cur); cur = prev[cur]; }
    const valid = path[0] === fromGate;

    const totalMeters   = dist[toGate] !== INF ? dist[toGate] : null;
    const travelMinutes = totalMeters !== null ? +((totalMeters / 1000) / speed * 60).toFixed(2) : null;
    const phiEfficiency = totalMeters !== null ? +(1 / (1 + totalMeters / (1000 * this.phi))).toFixed(4) : 0;

    this._log('routeGSE', { fromGate, toGate, gseType, totalMeters, valid });
    return { path: valid ? path : [], totalMeters, travelMinutes, gseType, speed, phiEfficiency, valid };
  }

  // ── Method 5: Predictive Safety Risk Scoring ──
  predictSafetyRisk(incidentLog = []) {
    if (incidentLog.length === 0) return { dartRate: 0, riskScore: 0, trend: 'stable' };

    const totalHoursWorked    = incidentLog.reduce((s, i) => s + (i.hoursWorked || 0), 0);
    const daysAway            = incidentLog.filter(i => i.type === 'days_away').length;
    const restrictedTransfer  = incidentLog.filter(i => i.type === 'restricted_transfer').length;
    const dartCases           = daysAway + restrictedTransfer;

    // DART rate = (DART cases × 200000) / hours worked
    const dartRate = totalHoursWorked > 0 ? +((dartCases * 200000) / totalHoursWorked).toFixed(4) : 0;
    const dartFlag = dartRate > OSHA_DART_BENCHMARK;

    // Trend: compare first half vs second half of log
    const mid        = Math.floor(incidentLog.length / 2);
    const firstHalf  = incidentLog.slice(0, mid).length;
    const secondHalf = incidentLog.slice(mid).length;
    const trendRatio = firstHalf > 0 ? secondHalf / firstHalf : 1;
    const trend      = trendRatio > 1.1 ? 'worsening' : trendRatio < 0.9 ? 'improving' : 'stable';

    // Severity-weighted incident count
    const severityWeights = { fatality: 100, days_away: 10, restricted_transfer: 5, first_aid: 1 };
    const weightedScore   = incidentLog.reduce((s, i) => s + (severityWeights[i.type] || 1), 0);

    // PHI-based predictive risk score: compounds on dart excess
    const dartExcess   = Math.max(dartRate - OSHA_DART_BENCHMARK, 0);
    const phiRiskScore = +(weightedScore * Math.pow(this.phi, dartExcess) / 1000).toFixed(4);

    this._log('predictSafetyRisk', { incidentCount: incidentLog.length, dartRate, trend });
    return {
      totalIncidents:   incidentLog.length,
      dartCases,
      dartRate,
      dartFlag,
      dartBenchmark:    OSHA_DART_BENCHMARK,
      trend,
      trendRatio:       +trendRatio.toFixed(4),
      weightedScore,
      phiRiskScore,
      riskLevel: phiRiskScore > 1.0 ? 'HIGH' : phiRiskScore > 0.3 ? 'MODERATE' : 'LOW',
    };
  }

  // ── Gamma function approximation (Lanczos) ──
  _gamma(z) {
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
               771.32342877765313, -176.61502916214059, 12.507343278686905,
               -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this._gamma(1 - z));
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return +(Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x).toFixed(6);
  }

  // ── Utility: Carbon Footprint Tracker ──
  trackCarbonFootprint(fleetActivity = []) {
    const CO2_PER_DIESEL_HOUR = DIESEL_CARBON_KG_PER_HR;
    const ELECTRIC_GRID_CO2  = 0.42;  // kg CO2 per kWh (US grid avg)

    const results = fleetActivity.map(unit => {
      const hoursOp      = unit.hoursOperated || 0;
      const isDiesel     = unit.fuelType !== 'electric';
      const co2Kg        = isDiesel
        ? hoursOp * CO2_PER_DIESEL_HOUR
        : hoursOp * unit.kwhPerHour * ELECTRIC_GRID_CO2;
      const co2Tonnes    = +(co2Kg / 1000).toFixed(4);
      // PHI-carbon index: normalise by phi — units above phiInv tonnes/hr are outliers
      const co2PerHour   = hoursOp > 0 ? co2Kg / hoursOp : 0;
      const phiCarbonIdx = +(co2PerHour * this.phiInv).toFixed(4);
      return { unitId: unit.unitId, gseType: unit.gseType, fuelType: unit.fuelType || 'diesel', hoursOperated: hoursOp, co2Kg: +co2Kg.toFixed(2), co2Tonnes, co2PerHour: +co2PerHour.toFixed(4), phiCarbonIdx };
    });

    const totalCO2Tonnes = results.reduce((s, r) => s + r.co2Tonnes, 0);
    this._log('trackCarbonFootprint', { unitCount: fleetActivity.length, totalCO2Tonnes: +totalCO2Tonnes.toFixed(3) });
    return { units: results, totalCO2Tonnes: +totalCO2Tonnes.toFixed(3), topEmitters: results.sort((a, b) => b.co2Kg - a.co2Kg).slice(0, 5) };
  }

  // ── Utility: Fleet Availability Rate ──
  computeFleetAvailability(fleetData = []) {
    const results = fleetData.map(unit => {
      const avail = unit.scheduledHours > 0 ? unit.operationalHours / unit.scheduledHours : 0;
      const phiAvail = +(avail * this.phi).toFixed(4);
      return { unitId: unit.unitId, gseType: unit.gseType, availability: +avail.toFixed(4), availabilityPct: +(avail * 100).toFixed(2), phiAvail, belowWorldClass: avail < OEE_BENCHMARKS.worldClass };
    });
    const fleetAvg = results.length > 0 ? results.reduce((s, r) => s + r.availability, 0) / results.length : 0;
    return { units: results, fleetAverageAvailability: +fleetAvg.toFixed(4), fleetAvailabilityPct: +(fleetAvg * 100).toFixed(2) };
  }

  _log(method, meta = {}) {
    this.memoryLog.push({ ts: new Date().toISOString(), method, ...meta });
  }

  // ── Intelligence Report ──
  intelligenceReport() {
    return {
      designation: this.designation,
      domain:      this.domain,
      phi:         this.phi,
      capabilities: [
        'GSE Maintenance Scheduling (Weibull reliability)',
        'Fleet Composition TCO Optimization',
        'OEE Tracking per Unit and Fleet-Wide',
        'Gate-to-Gate GSE Routing (Dijkstra)',
        'Predictive Safety Risk Scoring (OSHA DART)',
      ],
      gseTypes:      GSE_BENCHMARKS_PLACEHOLDER(),
      oeeBenchmarks: OEE_BENCHMARKS,
      dartBenchmark: OSHA_DART_BENCHMARK,
      memoryLog:     this.memoryLog,
      createdAt:     this.createdAt,
      framework:     'RSHIP',
    };
  }
}

function GSE_BENCHMARKS_PLACEHOLDER() { return GSE_TYPES; }

export function birthFLEETEX(config = {}) { return new FLEETEX(config); }
export { FLEETEX };
export default FLEETEX;
