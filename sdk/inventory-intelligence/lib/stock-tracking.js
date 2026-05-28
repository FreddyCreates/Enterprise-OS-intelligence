/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 3: STOCK TRACKING — Movement & Level Intelligence            ║
 * ║                                                                            ║
 * ║  Tracks stock movements, computes real-time levels, detects anomalies,     ║
 * ║  and maintains full audit trail of all inventory changes.                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const { createMovement } = require('./schema');

// ═══════════════════════════════════════════════════════════════════════════════
// MOVEMENT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Process a batch of movements and compute resulting stock levels
 */
function processMovements(currentLevels, movements) {
  const levels = { ...currentLevels };
  const processed = [];

  for (const mov of movements) {
    const result = applySingleMovement(levels, mov);
    processed.push(result);
  }

  levels.available = levels.onHand - levels.allocated;
  return { levels, processed };
}

function applySingleMovement(levels, movement) {
  const before = { ...levels };
  let valid = true;
  let warning = '';

  switch (movement.type) {
    case 'inbound':
      levels.onHand += movement.quantity;
      if (levels.inTransit >= movement.quantity) {
        levels.inTransit -= movement.quantity;
      }
      break;
    case 'outbound':
      if (levels.onHand < movement.quantity) {
        warning = `Insufficient stock: need ${movement.quantity}, have ${levels.onHand}`;
        valid = false;
      } else {
        levels.onHand -= movement.quantity;
      }
      break;
    case 'transfer':
      // Transfer doesn't change overall levels, just zone
      break;
    case 'adjustment':
      levels.onHand += movement.quantity; // Can be negative for shrinkage
      break;
    case 'return':
      levels.onHand += movement.quantity;
      break;
    case 'allocate':
      if (levels.available < movement.quantity) {
        warning = `Cannot allocate ${movement.quantity}, only ${levels.available} available`;
        valid = false;
      } else {
        levels.allocated += movement.quantity;
      }
      break;
    case 'deallocate':
      levels.allocated = Math.max(0, levels.allocated - movement.quantity);
      break;
    default:
      warning = `Unknown movement type: ${movement.type}`;
      valid = false;
  }

  levels.available = levels.onHand - levels.allocated;

  return {
    movement,
    before,
    after: { ...levels },
    valid,
    warning,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK LEVEL COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute stock position from a full movement history
 */
function computeStockFromHistory(movements) {
  const stockBySKU = {};

  for (const mov of movements) {
    if (!stockBySKU[mov.sku]) {
      stockBySKU[mov.sku] = { onHand: 0, allocated: 0, available: 0, inTransit: 0, backOrdered: 0 };
    }
    const levels = stockBySKU[mov.sku];
    switch (mov.type) {
      case 'inbound':
        levels.onHand += mov.quantity;
        break;
      case 'outbound':
        levels.onHand -= mov.quantity;
        break;
      case 'adjustment':
        levels.onHand += mov.quantity;
        break;
      case 'return':
        levels.onHand += mov.quantity;
        break;
      case 'allocate':
        levels.allocated += mov.quantity;
        break;
      case 'deallocate':
        levels.allocated -= mov.quantity;
        break;
    }
    levels.available = levels.onHand - levels.allocated;
  }

  return stockBySKU;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REORDER DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check which items need reordering based on rules
 */
function checkReorderPoints(stockBySKU, reorderRules) {
  const alerts = [];

  for (const [sku, rules] of Object.entries(reorderRules)) {
    const stock = stockBySKU[sku];
    if (!stock) continue;

    if (stock.available <= rules.reorderPoint) {
      const urgency = stock.available <= rules.safetyStock ? 'critical' : 'warning';
      alerts.push({
        sku,
        urgency,
        currentAvailable: stock.available,
        reorderPoint: rules.reorderPoint,
        safetyStock: rules.safetyStock,
        suggestedOrder: rules.reorderQuantity,
        supplier: rules.preferredSupplier || '',
        leadTimeDays: rules.leadTimeDays || 0,
        projectedStockout: estimateStockoutDays(stock.available, rules),
      });
    }
  }

  return alerts.sort((a, b) => a.projectedStockout - b.projectedStockout);
}

function estimateStockoutDays(available, rules) {
  if (available <= 0) return 0;
  // Simple linear estimate based on reorder quantity as a proxy for consumption rate
  const dailyConsumption = rules.reorderQuantity / (rules.leadTimeDays * 2 || 30);
  return dailyConsumption > 0 ? Math.ceil(available / dailyConsumption) : 999;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect unusual patterns in movement history
 */
function detectAnomalies(movements, options = {}) {
  const anomalies = [];
  const thresholdMultiplier = options.thresholdMultiplier || 3;

  // Group by SKU
  const bySKU = {};
  for (const mov of movements) {
    if (!bySKU[mov.sku]) bySKU[mov.sku] = [];
    bySKU[mov.sku].push(mov);
  }

  for (const [sku, skuMovements] of Object.entries(bySKU)) {
    const quantities = skuMovements.map(m => Math.abs(m.quantity));
    const avg = quantities.reduce((s, q) => s + q, 0) / quantities.length;
    const stdDev = Math.sqrt(quantities.reduce((s, q) => s + Math.pow(q - avg, 2), 0) / quantities.length);

    for (const mov of skuMovements) {
      // Unusually large movement
      if (Math.abs(mov.quantity) > avg + (thresholdMultiplier * stdDev) && stdDev > 0) {
        anomalies.push({
          type: 'unusual_quantity',
          severity: 'high',
          movement: mov,
          expected: Math.round(avg),
          deviation: Math.round((Math.abs(mov.quantity) - avg) / stdDev * 100) / 100,
        });
      }

      // Negative stock detection
      if (mov.type === 'outbound' && mov.quantity < 0) {
        anomalies.push({
          type: 'negative_quantity',
          severity: 'critical',
          movement: mov,
        });
      }
    }

    // Detect suspicious time patterns (multiple large movements in short window)
    const sorted = [...skuMovements].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    for (let i = 1; i < sorted.length; i++) {
      const timeDiff = new Date(sorted[i].timestamp) - new Date(sorted[i - 1].timestamp);
      if (timeDiff < 60000 && sorted[i].type === sorted[i - 1].type) { // < 1 minute apart
        anomalies.push({
          type: 'rapid_successive_movements',
          severity: 'medium',
          movements: [sorted[i - 1], sorted[i]],
          timeDiffMs: timeDiff,
        });
      }
    }
  }

  return anomalies;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK STATS
// ═══════════════════════════════════════════════════════════════════════════════

function computeStockStats(movements, periodDays = 30) {
  const cutoff = Date.now() - (periodDays * 24 * 60 * 60 * 1000);
  const recent = movements.filter(m => new Date(m.timestamp).getTime() >= cutoff);

  const inbound = recent.filter(m => m.type === 'inbound');
  const outbound = recent.filter(m => m.type === 'outbound');

  return {
    period: `${periodDays} days`,
    totalMovements: recent.length,
    inboundCount: inbound.length,
    inboundUnits: inbound.reduce((s, m) => s + m.quantity, 0),
    outboundCount: outbound.length,
    outboundUnits: outbound.reduce((s, m) => s + m.quantity, 0),
    turnoverRate: outbound.length > 0 ? Math.round((outbound.reduce((s, m) => s + m.quantity, 0) / periodDays) * 100) / 100 : 0,
    adjustments: recent.filter(m => m.type === 'adjustment').length,
    returns: recent.filter(m => m.type === 'return').length,
  };
}

module.exports = {
  processMovements,
  applySingleMovement,
  computeStockFromHistory,
  checkReorderPoints,
  detectAnomalies,
  computeStockStats,
  estimateStockoutDays,
};
