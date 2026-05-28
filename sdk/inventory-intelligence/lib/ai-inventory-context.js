/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       LIBRARY 6: AI INVENTORY CONTEXT — AI-Ready Record Packaging          ║
 * ║                                                                            ║
 * ║  Packages inventory data into AI-consumable formats for embeddings,        ║
 * ║  semantic search, demand forecasting, and anomaly detection.               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// AI RECORD GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert inventory record to AI-ready format for vector DB / LLM consumption
 */
function toAIRecord(record) {
  const items = record.items || [];
  const itemSummary = items.map(i => `${i.sku}: ${i.name} (${i.category}, ${i.unit} @ $${i.unitCost})`).join('; ');

  return {
    id: record.recordId,
    type: 'inventory_record',
    embedding_text: generateEmbeddingText(record),
    structured: {
      warehouse: record.warehouse.name,
      warehouseCode: record.warehouse.code,
      zone: record.warehouse.zone,
      itemCount: items.length,
      onHand: record.levels.onHand,
      available: record.levels.available,
      allocated: record.levels.allocated,
      inTransit: record.levels.inTransit,
      totalValue: items.reduce((s, i) => s + (i.unitCost * (record.levels.onHand / Math.max(items.length, 1))), 0),
      status: record.status,
    },
    metadata: {
      createdAt: record.audit.createdAt,
      confidence: record.audit.confidence,
      version: record.version,
      itemSummary,
    },
    signals: extractSignals(record),
  };
}

function generateEmbeddingText(record) {
  const parts = [
    `Inventory at ${record.warehouse.name} (${record.warehouse.code})`,
    `Zone: ${record.warehouse.zone || 'General'}`,
    `Type: ${record.warehouse.type}`,
    `Status: ${record.status}`,
    `Stock: ${record.levels.onHand} on-hand, ${record.levels.available} available, ${record.levels.allocated} allocated`,
  ];

  if (record.items.length > 0) {
    parts.push(`Items: ${record.items.map(i => `${i.name} (${i.sku})`).join(', ')}`);
    const categories = [...new Set(record.items.map(i => i.category).filter(Boolean))];
    if (categories.length > 0) parts.push(`Categories: ${categories.join(', ')}`);
  }

  if (record.levels.inTransit > 0) parts.push(`In transit: ${record.levels.inTransit} units incoming`);
  if (record.levels.backOrdered > 0) parts.push(`Back-ordered: ${record.levels.backOrdered} units owed`);

  return parts.join('. ');
}

function extractSignals(record) {
  const signals = [];

  if (record.levels.available <= 0) signals.push({ signal: 'stockout_risk', severity: 'critical' });
  if (record.levels.onHand > 0 && record.levels.allocated / record.levels.onHand > 0.9) {
    signals.push({ signal: 'high_allocation_ratio', severity: 'warning' });
  }
  if (record.levels.backOrdered > 0) signals.push({ signal: 'backorders_pending', severity: 'warning' });
  if (record.levels.inTransit > record.levels.onHand) {
    signals.push({ signal: 'large_incoming_shipment', severity: 'info' });
  }

  // Check for expiring items
  const now = new Date();
  for (const item of record.items) {
    if (item.expiryDate) {
      const daysLeft = Math.ceil((new Date(item.expiryDate) - now) / (24 * 60 * 60 * 1000));
      if (daysLeft <= 0) signals.push({ signal: 'expired_stock', severity: 'critical', sku: item.sku });
      else if (daysLeft <= 7) signals.push({ signal: 'expiring_soon', severity: 'warning', sku: item.sku });
    }
  }

  return signals;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORECAST CONTEXT FOR AI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build forecast context from multiple inventory records for AI planning
 */
function buildForecastContext(records) {
  const context = {
    totalWarehouses: new Set(records.map(r => r.warehouse.code)).size,
    totalSKUs: new Set(records.flatMap(r => r.items.map(i => i.sku))).size,
    aggregateStock: {
      totalOnHand: records.reduce((s, r) => s + r.levels.onHand, 0),
      totalAllocated: records.reduce((s, r) => s + r.levels.allocated, 0),
      totalAvailable: records.reduce((s, r) => s + r.levels.available, 0),
      totalInTransit: records.reduce((s, r) => s + r.levels.inTransit, 0),
    },
    warehouseBreakdown: {},
    categoryBreakdown: {},
    riskItems: [],
  };

  for (const record of records) {
    const whCode = record.warehouse.code;
    if (!context.warehouseBreakdown[whCode]) {
      context.warehouseBreakdown[whCode] = { name: record.warehouse.name, items: 0, onHand: 0 };
    }
    context.warehouseBreakdown[whCode].items += record.items.length;
    context.warehouseBreakdown[whCode].onHand += record.levels.onHand;

    for (const item of record.items) {
      const cat = item.category || 'uncategorized';
      if (!context.categoryBreakdown[cat]) context.categoryBreakdown[cat] = { count: 0, totalValue: 0 };
      context.categoryBreakdown[cat].count++;
      context.categoryBreakdown[cat].totalValue += item.unitCost;
    }

    if (record.levels.available <= 0) {
      context.riskItems.push({ recordId: record.recordId, warehouse: whCode, reason: 'stockout' });
    }
  }

  return context;
}

/**
 * Detect inventory anomalies across records for AI alerting
 */
function detectInventoryAnomalies(newRecord, forecastContext) {
  const anomalies = [];

  // Check if stock is unusually high vs aggregate
  const avgOnHand = forecastContext.aggregateStock.totalOnHand / (forecastContext.totalWarehouses || 1);
  if (newRecord.levels.onHand > avgOnHand * 3) {
    anomalies.push({
      type: 'overstock',
      message: `On-hand (${newRecord.levels.onHand}) is 3x+ the warehouse average (${Math.round(avgOnHand)})`,
      severity: 'warning',
    });
  }

  // Check if allocation is unusually high
  if (newRecord.levels.onHand > 0 && newRecord.levels.allocated / newRecord.levels.onHand > 0.95) {
    anomalies.push({
      type: 'over_allocation',
      message: `${Math.round(newRecord.levels.allocated / newRecord.levels.onHand * 100)}% of stock is allocated`,
      severity: 'warning',
    });
  }

  return anomalies;
}

/**
 * Generate AI replenishment suggestion context
 */
function replenishmentContext(record, forecast) {
  return {
    recordId: record.recordId,
    warehouse: record.warehouse.name,
    currentAvailable: record.levels.available,
    forecastedDemand: forecast.totalForecast || 0,
    daysOfStock: forecast.dailyForecast > 0
      ? Math.round(record.levels.available / forecast.dailyForecast)
      : 999,
    shouldReorder: record.levels.available <= (record.reorderRules.reorderPoint || 0),
    suggestedQuantity: record.reorderRules.reorderQuantity || forecast.totalForecast || 0,
    urgency: record.levels.available <= (record.reorderRules.safetyStock || 0) ? 'critical' : 'normal',
    prompt: `Warehouse ${record.warehouse.name} has ${record.levels.available} units available. ` +
      `Forecasted demand is ${forecast.totalForecast || 'unknown'} units over ${forecast.forecastDays || 14} days. ` +
      `Recommend replenishment action.`,
  };
}

module.exports = {
  toAIRecord,
  generateEmbeddingText,
  extractSignals,
  buildForecastContext,
  detectInventoryAnomalies,
  replenishmentContext,
};
