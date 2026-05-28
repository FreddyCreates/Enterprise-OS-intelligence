/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          INVENTORY INTELLIGENCE SDK v1.0.0                                 ║
 * ║                                                                            ║
 * ║  Enterprise inventory data pipeline — ingest, classify, track, forecast,   ║
 * ║  validate, store, and package for AI consumption.                          ║
 * ║                                                                            ║
 * ║  Core Libraries:                                                           ║
 * ║    1. ingest-normalize     — Clean & standardize raw inventory data        ║
 * ║    2. item-classification  — ABC, velocity, perishability, hazard classes  ║
 * ║    3. stock-tracking       — Movements, levels, reorder, anomalies         ║
 * ║    4. demand-forecast      — Patterns, trends, simple forecasting          ║
 * ║    5. inventory-ledger     — Versioned store + cycle-count reconciliation  ║
 * ║    6. ai-inventory-context — AI-ready records for search/forecasting       ║
 * ║                                                                            ║
 * ║  Plus: validation-gates, observability, output-formats                     ║
 * ║                                                                            ║
 * ║  © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const schema = require('./lib/schema');
const ingest = require('./lib/ingest-normalize');
const classify = require('./lib/item-classification');
const tracking = require('./lib/stock-tracking');
const forecast = require('./lib/demand-forecast');
const { InventoryLedger } = require('./lib/inventory-ledger');
const aiContext = require('./lib/ai-inventory-context');
const validation = require('./lib/validation-gates');
const observability = require('./lib/observability');
const output = require('./lib/output-formats');

// ═══════════════════════════════════════════════════════════════════════════════
// FULL PIPELINE — end-to-end from raw data to AI-ready output
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Process raw inventory data through the full intelligence pipeline.
 *
 * @param {Object} rawData - Structured inventory input
 * @param {Object[]} [movements] - Stock movement records
 * @param {Object} [options] - Pipeline options
 * @returns {Object} Complete pipeline result
 */
function processPipeline(rawData, movements = [], options = {}) {
  // Step 1: Ingest and normalize
  const record = ingest.ingestStructured(rawData);

  // Step 2: Classify items
  let classifiedItems = record.items;
  if (classifiedItems.length > 0) {
    classifiedItems = classify.abcClassification(classifiedItems);
    if (movements.length > 0) {
      classifiedItems = classify.velocityClassification(classifiedItems, movements, options.periodDays || 90);
    }
    classifiedItems = classify.perishabilityClassification(classifiedItems);
    classifiedItems = classify.hazardClassification(classifiedItems);
    record.items = classifiedItems;
  }

  // Step 3: Process movements and compute levels
  if (movements.length > 0) {
    record.movements = movements;
    const { levels } = tracking.processMovements(record.levels, movements);
    record.levels = levels;
  }

  // Step 4: Validate
  const validationResults = validation.runAllGates(record);
  record.audit.warnings = validationResults.warnings;

  // Step 5: Confidence scoring
  const confidence = observability.computeConfidenceScore(record, validationResults);
  record.audit.confidence = confidence.score;

  // Step 6: Generate AI context
  const aiRecord = aiContext.toAIRecord(record);
  const embeddingBlocks = output.toEmbeddingBlocks(record);
  const explainability = observability.generateExplainability(record, validationResults, confidence);

  // Step 7: Forecast (if enough movement data)
  let forecasts = {};
  if (movements.length > 10) {
    const skus = [...new Set(movements.map(m => m.sku))];
    for (const sku of skus) {
      forecasts[sku] = forecast.simpleForecast(movements, sku);
    }
  }

  return {
    record,
    classification: classify.classificationSummary(classifiedItems),
    validation: validationResults,
    confidence,
    aiRecord,
    embeddingBlocks,
    explainability,
    forecasts,
    outputs: {
      json: output.toJSON(record, { pretty: true }),
      csv: output.toCSV(record),
      itemsCSV: output.itemsToCSV(record),
      apiPayload: output.toAPIPayload(record),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  processPipeline,
  schema,
  ingest,
  classify,
  tracking,
  forecast,
  InventoryLedger,
  aiContext,
  validation,
  observability,
  output,
  VERSION: '1.0.0',
};
