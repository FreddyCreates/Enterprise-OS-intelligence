/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          COMPLIANCE INTELLIGENCE SDK v1.0.0                                ║
 * ║                                                                            ║
 * ║  Enterprise compliance data pipeline — ingest, regulation mapping,         ║
 * ║  audit trails, risk scoring, validate, store, and AI-context packaging.    ║
 * ║                                                                            ║
 * ║  © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const schema = require('./lib/schema');
const ingest = require('./lib/ingest-normalize');
const regulations = require('./lib/regulation-engine');
const { AuditTrail } = require('./lib/audit-trail');
const risk = require('./lib/risk-scoring');
const { ComplianceLedger } = require('./lib/compliance-ledger');
const aiContext = require('./lib/ai-compliance-context');
const validation = require('./lib/validation-gates');
const observability = require('./lib/observability');
const output = require('./lib/output-formats');

function processPipeline(rawData, options = {}) {
  const record = ingest.ingestStructured(rawData);

  // Risk scoring
  const riskResult = risk.computeRiskScore(record);
  record.riskProfile.level = riskResult.level;
  record.riskProfile.factors = riskResult.factors;

  // Compliance threshold check
  const thresholdCheck = regulations.checkComplianceThresholds(record, options.thresholds);
  if (!thresholdCheck.compliant) {
    record.audit.warnings.push(...thresholdCheck.issues.map(i => `${i.type}: actual=${i.actual}, threshold=${i.threshold}`));
  }

  // Validate
  const validationResults = validation.runAllGates(record);
  record.audit.warnings.push(...validationResults.warnings);

  // Confidence
  const confidence = observability.computeConfidenceScore(record, validationResults);
  record.audit.confidence = confidence.score;

  // AI context
  const aiRecord = aiContext.toAIRecord(record);
  const embeddingBlocks = output.toEmbeddingBlocks(record);
  const explainability = observability.generateExplainability(record, validationResults, confidence);

  return {
    record,
    riskAssessment: riskResult,
    thresholdCheck,
    validation: validationResults,
    confidence,
    aiRecord,
    embeddingBlocks,
    explainability,
    outputs: {
      json: output.toJSON(record, { pretty: true }),
      csv: output.toCSV(record),
      findingsCSV: output.findingsToCSV(record),
      apiPayload: output.toAPIPayload(record),
    },
  };
}

module.exports = {
  processPipeline,
  schema,
  ingest,
  regulations,
  AuditTrail,
  risk,
  ComplianceLedger,
  aiContext,
  validation,
  observability,
  output,
  VERSION: '1.0.0',
};
