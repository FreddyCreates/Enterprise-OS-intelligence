/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          FLEET LOGISTICS INTELLIGENCE SDK v1.0.0                           ║
 * ║                                                                            ║
 * ║  Enterprise logistics data pipeline — ingest, route, track, validate,      ║
 * ║  store, and package for AI consumption.                                    ║
 * ║                                                                            ║
 * ║  Core Libraries:                                                           ║
 * ║    1. ingest-normalize    — Clean & standardize raw shipment data          ║
 * ║    2. route-intelligence  — Distance, ETA, optimization, cost analysis     ║
 * ║    3. shipment-tracking   — Timeline events, delays, performance           ║
 * ║    4. fleet-management    — Vehicles, utilization, maintenance, fuel       ║
 * ║    5. logistics-ledger    — Versioned shipment store + POD                 ║
 * ║    6. ai-logistics-context— AI-ready records for search/dispatch           ║
 * ║                                                                            ║
 * ║  © 2026 Alfredo Medina Hernandez · RSHIP AGI Systems                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const schema = require('./lib/schema');
const ingest = require('./lib/ingest-normalize');
const routing = require('./lib/route-intelligence');
const tracking = require('./lib/shipment-tracking');
const fleet = require('./lib/fleet-management');
const { LogisticsLedger } = require('./lib/logistics-ledger');
const aiContext = require('./lib/ai-logistics-context');
const validation = require('./lib/validation-gates');
const observability = require('./lib/observability');
const output = require('./lib/output-formats');

function processPipeline(rawData, options = {}) {
  // Step 1: Ingest
  const shipment = ingest.ingestStructured(rawData);

  // Step 2: Route analysis
  if (shipment.route.origin.lat && shipment.route.destination.lat) {
    const dist = routing.haversineDistance(
      shipment.route.origin.lat, shipment.route.origin.lng,
      shipment.route.destination.lat, shipment.route.destination.lng
    );
    if (!shipment.route.distanceMiles) shipment.route.distanceMiles = dist;
  }
  const travelEstimate = routing.estimateTravelTime(shipment.route.distanceMiles, options);
  if (!shipment.route.estimatedHours) shipment.route.estimatedHours = travelEstimate.totalHours;

  const routeRisk = routing.assessRouteRisk(shipment);
  const costAnalysis = routing.costPerMileAnalysis(shipment);

  // Step 3: Validate
  const validationResults = validation.runAllGates(shipment);
  shipment.audit.warnings = validationResults.warnings;

  // Step 4: Confidence
  const confidence = observability.computeConfidenceScore(shipment, validationResults);
  shipment.audit.confidence = confidence.score;

  // Step 5: AI context
  const aiRecord = aiContext.toAIRecord(shipment);
  const embeddingBlocks = output.toEmbeddingBlocks(shipment);
  const explainability = observability.generateExplainability(shipment, validationResults, confidence);

  return {
    shipment,
    routeRisk,
    costAnalysis,
    travelEstimate,
    validation: validationResults,
    confidence,
    aiRecord,
    embeddingBlocks,
    explainability,
    outputs: {
      json: output.toJSON(shipment, { pretty: true }),
      csv: output.toCSV(shipment),
      apiPayload: output.toAPIPayload(shipment),
    },
  };
}

module.exports = {
  processPipeline,
  schema,
  ingest,
  routing,
  tracking,
  fleet,
  LogisticsLedger,
  aiContext,
  validation,
  observability,
  output,
  VERSION: '1.0.0',
};
