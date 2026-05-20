/**
 * CONCEX AGI — Concession Revenue Operations Intelligence
 * RSHIP-2026-CONCEX-001
 *
 * Domain: Concession Revenue Operations
 * Latin: concessio — "a yielding, a granting, a concession"
 *   From concedo (to yield, to grant), concessio defines the granted privilege of selling
 *   within a controlled space. Airport concessions generate $2.8B+ annually across US airports;
 *   revenue intelligence is mission-critical. CONCEX couples flight intelligence to revenue
 *   prediction with minute-level precision.
 *
 * Theory: EOQ with perishability (Operations Research), BCG Menu Engineering Matrix,
 *   Labor optimization, Flight-demand coupling,
 *   PHI-compounding revenue intelligence (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Concession Revenue Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const LABOR_BENCHMARKS = {
  food_beverage: { low: 0.28, high: 0.32 },
  retail:        { low: 0.15, high: 0.20 },
  services:      { low: 0.25, high: 0.30 },
};

const PERISHABILITY_DECAY = {
  fresh_produce:   0.25,   // k constant: 25% loss/day
  prepared_foods:  0.40,
  baked_goods:     0.20,
  dairy:           0.15,
  dry_goods:       0.005,
};

const FLIGHT_BANK_MULTIPLIERS = [
  { startHour: 5,  endHour: 8,  label: 'EarlyMorning', multiplier: 1.6 },
  { startHour: 9,  endHour: 12, label: 'MidMorning',   multiplier: 2.3 },
  { startHour: 12, endHour: 15, label: 'Midday',        multiplier: 1.8 },
  { startHour: 15, endHour: 18, label: 'Afternoon',     multiplier: 2.0 },
  { startHour: 17, endHour: 20, label: 'Evening',       multiplier: 1.9 },
];

const BCG_THRESHOLDS = {
  highMarginPct:  0.65,  // above = high margin
  highSalesUnits: 50,    // above = high volume
};

const MENU_MARGIN_TARGET = 0.65;
const HOLDING_COST_RATE  = 0.20;  // 20% of item cost per year

// ── CONCEX Core ──
class CONCEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-CONCEX-001';
    this.domain      = 'Concession Revenue Operations';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: Flight-Coupled Revenue Forecasting ──
  forecastRevenue(flightSchedule = [], historicalSales = []) {
    // Build hourly flight count
    const hourlyFlights = Array(24).fill(0);
    flightSchedule.forEach(f => {
      const hr = parseInt((f.departureTime || '12:00').split(':')[0], 10);
      if (hr >= 0 && hr < 24) hourlyFlights[hr]++;
    });

    // Average historical revenue per flight for calibration
    const totalHistFlights = historicalSales.reduce((s, d) => s + (d.flights || 1), 0);
    const totalHistRevenue = historicalSales.reduce((s, d) => s + d.revenue, 0);
    const revenuePerFlight = totalHistFlights > 0 ? totalHistRevenue / totalHistFlights : 120;

    // Apply peak multipliers by hour
    const hourlyForecast = hourlyFlights.map((flights, hour) => {
      const bank = FLIGHT_BANK_MULTIPLIERS.find(b => hour >= b.startHour && hour < b.endHour);
      const mult = bank ? bank.multiplier : 1.0;
      // PHI-boost during peak hours: multiplier scaled by ln(phi)
      const phiBoost      = bank ? 1 + Math.log(this.phi) * (mult - 1) / 2 : 1;
      const forecastRev   = +(flights * revenuePerFlight * mult * phiBoost).toFixed(2);
      return { hour, flights, multiplier: +mult.toFixed(2), phiBoost: +phiBoost.toFixed(4), forecastRevenue: forecastRev };
    });

    const dailyForecast  = +(hourlyForecast.reduce((s, h) => s + h.forecastRevenue, 0)).toFixed(2);
    const weeklyForecast = +(dailyForecast * 7).toFixed(2);
    const peakHour       = hourlyForecast.reduce((a, b) => a.forecastRevenue > b.forecastRevenue ? a : b);

    this._log('forecastRevenue', { flightCount: flightSchedule.length, dailyForecast });
    return { hourlyForecast, dailyForecast, weeklyForecast, peakHour: peakHour.hour, revenuePerFlight: +revenuePerFlight.toFixed(2) };
  }

  // ── Method 2: Food Waste Minimization (EOQ with Perishability) ──
  minimizeWaste(inventoryData = [], flightForecast = {}) {
    const dailyDemandUnits = flightForecast.dailyForecast
      ? flightForecast.dailyForecast / 15   // assume $15 avg transaction
      : 100;

    const results = inventoryData.map(item => {
      const { itemId, name, category, orderCost, unitCost, currentStock, unitDemandPerDay } = item;
      const k         = PERISHABILITY_DECAY[category] || 0.10;   // daily decay rate
      const demand    = unitDemandPerDay || dailyDemandUnits;
      const holdRate  = HOLDING_COST_RATE * unitCost;

      // EOQ modified for perishability: Nahmias model approximation
      // Q* = sqrt( 2 * D * S / (H + k * P) )
      const eoq = Math.sqrt((2 * demand * orderCost) / (holdRate + k * unitCost));

      // Expected waste per cycle: Q × (1 - e^(-k × Q/D))
      const cycleLength  = demand > 0 ? eoq / demand : 1;
      const wasteRate    = 1 - Math.exp(-k * cycleLength);
      const expectedWaste = +(eoq * wasteRate).toFixed(2);
      const wasteCost     = +(expectedWaste * unitCost).toFixed(2);

      // Optimal order: adjust downward by phi-weighted waste factor
      const phiAdjustedQty = Math.max(Math.round(eoq * (1 - wasteRate * this.phiInv)), 1);

      return {
        itemId,
        name,
        category,
        eoq: +eoq.toFixed(2),
        phiAdjustedQty,
        cycleLength: +cycleLength.toFixed(2),
        wasteRate: +wasteRate.toFixed(4),
        expectedWasteUnits: expectedWaste,
        wasteCost,
        currentStock,
        reorderNow: currentStock <= phiAdjustedQty * 0.5,
      };
    });

    const totalWasteCost = results.reduce((s, r) => s + r.wasteCost, 0);
    this._log('minimizeWaste', { itemCount: inventoryData.length, totalWasteCost });
    return { results, totalDailyWasteCost: +totalWasteCost.toFixed(2), reorderItems: results.filter(r => r.reorderNow) };
  }

  // ── Method 3: Labor-to-Sales Ratio Optimization ──
  optimizeLabor(salesData = [], shiftSchedule = []) {
    const categoryTotals = {};
    salesData.forEach(s => {
      if (!categoryTotals[s.category]) categoryTotals[s.category] = 0;
      categoryTotals[s.category] += s.revenue;
    });

    const shiftAnalysis = shiftSchedule.map(shift => {
      const laborCost       = shift.headcount * shift.hoursWorked * shift.hourlyRate;
      const sales           = categoryTotals[shift.category] || 0;
      const laborRatio      = sales > 0 ? laborCost / sales : null;
      const bench           = LABOR_BENCHMARKS[shift.category] || LABOR_BENCHMARKS['food_beverage'];
      const targetRatio     = (bench.low + bench.high) / 2;
      const deviation       = laborRatio !== null ? laborRatio - targetRatio : 0;
      const phiDeviation    = Math.abs(deviation) > 0 ? +(Math.pow(this.phi, Math.abs(deviation) * 10) - 1).toFixed(4) : 0;

      let status = 'optimal';
      if (laborRatio !== null) {
        if (laborRatio > bench.high)       status = 'overstaffed';
        else if (laborRatio < bench.low)   status = 'understaffed';
      }

      const recommendedHeadcount = sales > 0
        ? Math.round((sales * targetRatio) / (shift.hoursWorked * shift.hourlyRate))
        : shift.headcount;

      return {
        shiftId:            shift.id,
        category:           shift.category,
        laborCost: +laborCost.toFixed(2),
        sales: +sales.toFixed(2),
        laborRatio:         laborRatio !== null ? +laborRatio.toFixed(4) : null,
        targetRatio,
        status,
        phiDeviation,
        recommendedHeadcount,
        headcountDelta:     recommendedHeadcount - shift.headcount,
      };
    });

    this._log('optimizeLabor', { shiftCount: shiftSchedule.length });
    return {
      shiftAnalysis,
      summary: {
        overstaffedShifts:  shiftAnalysis.filter(s => s.status === 'overstaffed').length,
        understaffedShifts: shiftAnalysis.filter(s => s.status === 'understaffed').length,
        optimalShifts:      shiftAnalysis.filter(s => s.status === 'optimal').length,
      },
    };
  }

  // ── Method 4: Menu Engineering (BCG Matrix) ──
  engineerMenu(menuData = []) {
    // Compute averages to determine BCG quadrant thresholds dynamically
    const avgSales  = menuData.reduce((s, i) => s + (i.unitsSold || 0), 0) / (menuData.length || 1);
    const avgMargin = menuData.reduce((s, i) => s + (i.marginPct || 0), 0) / (menuData.length || 1);

    const items = menuData.map(item => {
      const { itemId, name, price, cost, unitsSold } = item;
      const marginPct    = price > 0 ? (price - cost) / price : 0;
      const totalContrib = (price - cost) * unitsSold;

      // BCG quadrant classification
      const highMargin = marginPct >= avgMargin;
      const highSales  = unitsSold >= avgSales;
      let quadrant = '';
      if (highMargin && highSales)       quadrant = 'Star';
      else if (highMargin && !highSales) quadrant = 'Puzzle';
      else if (!highMargin && highSales) quadrant = 'Plowhorse';
      else                               quadrant = 'Dog';

      // PHI-value index: contribution × phi-scaled margin quality
      const phiValueIndex = +(totalContrib * this.phi * marginPct).toFixed(4);

      const action = {
        Star:      'Promote heavily, protect placement, maintain price',
        Puzzle:    'Increase visibility, bundle with Stars, promotional pricing',
        Plowhorse: 'Reengineer cost or replace — low margin despite volume',
        Dog:       'Consider removal or deep reengineering',
      }[quadrant];

      return {
        itemId,
        name,
        price,
        cost,
        marginPct: +marginPct.toFixed(4),
        unitsSold,
        totalContribution: +totalContrib.toFixed(2),
        quadrant,
        phiValueIndex,
        action,
      };
    });

    items.sort((a, b) => b.phiValueIndex - a.phiValueIndex);

    const quadrantCounts = { Star: 0, Puzzle: 0, Plowhorse: 0, Dog: 0 };
    items.forEach(i => quadrantCounts[i.quadrant]++);

    this._log('engineerMenu', { itemCount: menuData.length, stars: quadrantCounts.Star, dogs: quadrantCounts.Dog });
    return { items, quadrantCounts, averageMarginPct: +avgMargin.toFixed(4), averageUnitsSold: +avgSales.toFixed(2) };
  }

  // ── Method 5: Real-Time Sales Velocity Monitoring ──
  monitorSalesVelocity(transactionStream = []) {
    if (transactionStream.length === 0) return { error: 'No transactions provided' };

    const now    = Date.now();
    const window = 3600000; // 1 hour in ms

    // Compute per-hour buckets over the stream
    const sorted = [...transactionStream].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const startTs = new Date(sorted[0].timestamp).getTime();
    const endTs   = new Date(sorted[sorted.length - 1].timestamp).getTime();
    const spanHours = Math.max((endTs - startTs) / window, 1);

    const totalRevenue     = transactionStream.reduce((s, t) => s + (t.amount || 0), 0);
    const totalTransactions = transactionStream.length;
    const avgTicket        = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const txPerHour        = totalTransactions / spanHours;
    const revenuePerHour   = totalRevenue / spanHours;

    // Category mix
    const categoryMix = {};
    transactionStream.forEach(t => {
      const cat = t.category || 'unknown';
      if (!categoryMix[cat]) categoryMix[cat] = { count: 0, revenue: 0 };
      categoryMix[cat].count++;
      categoryMix[cat].revenue += (t.amount || 0);
    });

    // Velocity trend: compare first half vs second half
    const mid      = Math.floor(sorted.length / 2);
    const firstRev = sorted.slice(0, mid).reduce((s, t) => s + (t.amount || 0), 0);
    const secRev   = sorted.slice(mid).reduce((s, t) => s + (t.amount || 0), 0);
    const velocityTrend = firstRev > 0 ? (secRev - firstRev) / firstRev : 0;

    // PHI anomaly threshold: deviation > 1/phi² from average = anomaly
    const phiAnomalyBand = Math.pow(this.phiInv, 2);
    const velocityAnomaly = Math.abs(velocityTrend) > phiAnomalyBand;

    // Project closing revenue: extrapolate velocity
    const hoursRemaining = 8 - (spanHours % 8);
    const projectedClosing = +(totalRevenue + revenuePerHour * hoursRemaining * (1 + velocityTrend * 0.5)).toFixed(2);

    this._log('monitorSalesVelocity', { totalTransactions, revenuePerHour: +revenuePerHour.toFixed(2), velocityAnomaly });
    return {
      totalRevenue: +totalRevenue.toFixed(2),
      totalTransactions,
      avgTicket: +avgTicket.toFixed(2),
      txPerHour: +txPerHour.toFixed(2),
      revenuePerHour: +revenuePerHour.toFixed(2),
      velocityTrend: +velocityTrend.toFixed(4),
      velocityAnomaly,
      phiAnomalyBand: +phiAnomalyBand.toFixed(4),
      categoryMix,
      projectedClosingRevenue: projectedClosing,
      spanHours: +spanHours.toFixed(2),
    };
  }

  // ── Utility: Daily Revenue Reconciliation ──
  reconcileDailyRevenue(posTransactions = [], cashDeposit, creditDeposit) {
    const posTotal    = posTransactions.reduce((s, t) => s + (t.amount || 0), 0);
    const totalDeposit = cashDeposit + creditDeposit;
    const variance    = +(totalDeposit - posTotal).toFixed(2);
    const variancePct = posTotal > 0 ? +(variance / posTotal * 100).toFixed(4) : 0;

    // PHI threshold: |variance| > posTotal × phiInv × 0.01 = material discrepancy
    const materialThreshold = posTotal * this.phiInv * 0.01;
    const material = Math.abs(variance) > materialThreshold;

    return {
      posTotal: +posTotal.toFixed(2),
      totalDeposit: +totalDeposit.toFixed(2),
      variance,
      variancePct,
      materialThreshold: +materialThreshold.toFixed(2),
      materialDiscrepancy: material,
      phiFlag: +(Math.abs(variance) * this.phi / Math.max(posTotal, 1)).toFixed(4),
      action: material ? 'INVESTIGATE-DISCREPANCY' : 'BALANCED',
    };
  }

  // ── Utility: Flight-Day Revenue Comparison ──
  compareFlightDays(dayA = {}, dayB = {}) {
    const revDiff     = +(dayB.revenue - dayA.revenue).toFixed(2);
    const flightDiff  = dayB.flights - dayA.flights;
    const revPerFlight_A = dayA.flights > 0 ? dayA.revenue / dayA.flights : 0;
    const revPerFlight_B = dayB.flights > 0 ? dayB.revenue / dayB.flights : 0;
    const efficiencyDiff = +(revPerFlight_B - revPerFlight_A).toFixed(2);

    // PHI-yield index: revenue/flight × phi for golden yield benchmark
    const phiYieldA = +(revPerFlight_A * this.phiInv).toFixed(4);
    const phiYieldB = +(revPerFlight_B * this.phiInv).toFixed(4);

    return {
      dayA: { ...dayA, revPerFlight: +revPerFlight_A.toFixed(2), phiYield: phiYieldA },
      dayB: { ...dayB, revPerFlight: +revPerFlight_B.toFixed(2), phiYield: phiYieldB },
      revenueDiff: revDiff,
      flightDiff,
      efficiencyDiff,
      betterDay: revDiff > 0 ? 'B' : revDiff < 0 ? 'A' : 'EQUAL',
    };
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
        'Flight-Coupled Revenue Forecasting',
        'Food Waste Minimization (EOQ + Perishability)',
        'Labor-to-Sales Ratio Optimization',
        'Menu Engineering (BCG Matrix)',
        'Real-Time Sales Velocity Monitoring',
      ],
      laborBenchmarks:      LABOR_BENCHMARKS,
      flightBankMultipliers: FLIGHT_BANK_MULTIPLIERS,
      perishabilityDecay:   PERISHABILITY_DECAY,
      memoryLog:            this.memoryLog,
      createdAt:            this.createdAt,
      framework:            'RSHIP',
    };
  }
}

export function birthCONCEX(config = {}) { return new CONCEX(config); }
export { CONCEX };
export default CONCEX;
