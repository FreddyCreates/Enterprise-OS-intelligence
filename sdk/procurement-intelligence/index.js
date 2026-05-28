/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          PROCUREMENT INTELLIGENCE SDK v1.0.0                               ║
 * ║                                                                            ║
 * ║  Enterprise procurement data pipeline — ingest, vendor scoring, PO         ║
 * ║  lifecycle, spend analytics, validate, store, and AI-context packaging.    ║
 * ║                                                                            ║
 * ║  © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const schema = require('./lib/schema');
const ingest = require('./lib/ingest-normalize');
const vendor = require('./lib/vendor-intelligence');
const purchaseOrders = require('./lib/purchase-orders');
const spend = require('./lib/spend-analytics');
const { ProcurementLedger } = require('./lib/procurement-ledger');
const aiContext = require('./lib/ai-procurement-context');
const validation = require('./lib/validation-gates');
const observability = require('./lib/observability');
const output = require('./lib/output-formats');

function processPipeline(rawData, options = {}) {
  const po = ingest.ingestStructured(rawData);
  const validationResults = validation.runAllGates(po, options.existingPOs || []);
  po.audit.warnings = validationResults.warnings;
  const confidence = observability.computeConfidenceScore(po, validationResults);
  po.audit.confidence = confidence.score;
  const aiRecord = aiContext.toAIRecord(po);
  const embeddingBlocks = output.toEmbeddingBlocks(po);
  const explainability = observability.generateExplainability(po, validationResults, confidence);

  return {
    po,
    validation: validationResults,
    confidence,
    aiRecord,
    embeddingBlocks,
    explainability,
    outputs: {
      json: output.toJSON(po, { pretty: true }),
      csv: output.toCSV(po),
      lineItemsCSV: output.lineItemsToCSV(po),
      apiPayload: output.toAPIPayload(po),
    },
  };
}

module.exports = {
  processPipeline,
  schema,
  ingest,
  vendor,
  purchaseOrders,
  spend,
  ProcurementLedger,
  aiContext,
  validation,
  observability,
  output,
  VERSION: '1.0.0',
};
