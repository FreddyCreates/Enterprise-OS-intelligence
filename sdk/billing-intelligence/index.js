/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          BILLING INTELLIGENCE SDK v1.0.0                                   ║
 * ║                                                                            ║
 * ║  Enterprise billing data pipeline — ingest, parse, price, validate,        ║
 * ║  store, and package for AI consumption.                                    ║
 * ║                                                                            ║
 * ║  5 Core Libraries:                                                         ║
 * ║    1. ingest-normalize  — Clean & standardize raw billing data             ║
 * ║    2. labor-intel       — Extract shifts, crews, hours from notes          ║
 * ║    3. contract-pricing  — Rates, tax, overtime, calculation traces         ║
 * ║    4. billing-ledger    — Versioned invoice store + reconciliation         ║
 * ║    5. ai-billing-context — AI-ready records for search/forecasting         ║
 * ║                                                                            ║
 * ║  Plus: validation-gates, observability, output-formats                     ║
 * ║                                                                            ║
 * ║  © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const schema = require('./lib/schema');
const ingest = require('./lib/ingest-normalize');
const labor = require('./lib/labor-intel');
const pricing = require('./lib/contract-pricing');
const { BillingLedger } = require('./lib/billing-ledger');
const aiContext = require('./lib/ai-billing-context');
const validation = require('./lib/validation-gates');
const observability = require('./lib/observability');
const output = require('./lib/output-formats');

// ═══════════════════════════════════════════════════════════════════════════════
// FULL PIPELINE — end-to-end from raw data to AI-ready output
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Process raw billing data through the full intelligence pipeline.
 *
 * @param {Object} rawData - Structured billing input
 * @param {string[]} laborBullets - Raw labor summary bullet strings
 * @param {Object} [options] - Pipeline options
 * @returns {Object} Complete pipeline result
 */
function processPipeline(rawData, laborBullets, options = {}) {
  const year = options.year || new Date().getFullYear();

  // Step 1: Ingest and normalize
  const invoice = ingest.ingestStructured(rawData);

  // Step 2: Parse labor data
  const { logs, totalsInfo } = labor.parseLaborSummary(laborBullets, year);
  invoice.laborLogs = logs;

  // Step 3: Apply rate card if not pre-set
  if (totalsInfo.billRate && !invoice.rates.hourlyRate) {
    invoice.rates.hourlyRate = totalsInfo.billRate;
  }

  // Step 4: Calculate totals with trace
  const totals = pricing.calculateTotals(invoice.laborLogs, invoice.rates);
  invoice.totals = totals;

  // Step 5: Validate
  const validationResults = validation.runAllGates(invoice);
  invoice.audit.warnings = validationResults.warnings;

  // Step 6: Confidence scoring
  const confidence = observability.computeConfidenceScore(invoice, validationResults);
  invoice.audit.confidence = confidence.score;

  // Step 7: Generate AI context
  const aiRecord = aiContext.toAIRecord(invoice);
  const embeddingBlocks = output.toEmbeddingBlocks(invoice);
  const explainability = observability.generateExplainability(invoice, validationResults, confidence);

  return {
    invoice,
    validation: validationResults,
    confidence,
    aiRecord,
    embeddingBlocks,
    explainability,
    outputs: {
      json: output.toJSON(invoice, { pretty: true }),
      csv: output.toCSV(invoice),
      laborCSV: output.laborToCSV(invoice),
      apiPayload: output.toAPIPayload(invoice),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Full pipeline
  processPipeline,

  // Individual libraries
  schema,
  ingest,
  labor,
  pricing,
  BillingLedger,
  aiContext,
  validation,
  observability,
  output,

  // Version
  VERSION: '1.0.0',
};
