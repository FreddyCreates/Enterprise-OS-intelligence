/**
 * Fleet Logistics Intelligence SDK — Pipeline Integration Test
 */

'use strict';

const { processPipeline, schema, ingest, routing, tracking, fleet, LogisticsLedger, aiContext, validation, observability, output } = require('../index');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

const sampleShipmentData = {
  carrier: { name: 'Swift Transport', code: 'SWIFT', scac: 'SWFT', contact: 'dispatch@swift.com' },
  route: {
    origin: { name: 'Dallas DC', address: '1234 Commerce St, Dallas, TX', lat: 32.7767, lng: -96.7970 },
    destination: { name: 'Houston Hub', address: '5678 Shipping Blvd, Houston, TX', lat: 29.7604, lng: -95.3698 },
    waypoints: [{ name: 'Waco Rest Stop', lat: 31.5493, lng: -97.1467 }],
  },
  cargo: { type: 'general-freight', description: 'Electronics components', weight: 12000, pieces: 24, hazmat: false },
  costs: { lineHaul: 1200, fuelSurcharge: 180, accessorials: 75, currency: 'USD' },
  timeline: [
    { timestamp: '2026-05-20T08:00:00Z', event: 'picked_up', location: 'Dallas DC', updatedBy: 'driver-1' },
    { timestamp: '2026-05-20T12:30:00Z', event: 'in_transit', location: 'Waco, TX', updatedBy: 'gps-system' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

function testIngest() {
  const shipment = ingest.ingestStructured(sampleShipmentData);
  assert(shipment.shipmentId, 'Should generate shipmentId');
  assert(shipment.carrier.name === 'Swift Transport', 'Carrier name preserved');
  assert(shipment.cargo.weight === 12000, 'Cargo weight preserved');
  assert(shipment.audit.createdAt, 'Audit timestamp set');
  console.log('  ✓ ingest-normalize');
}

function testRouting() {
  const distance = routing.haversineDistance(32.7767, -96.7970, 29.7604, -95.3698);
  assert(distance > 200 && distance < 300, 'Dallas to Houston ~239 miles');
  console.log('  ✓ route-intelligence (haversine)');
}

function testShipmentTracking() {
  const shipment = ingest.ingestStructured(sampleShipmentData);
  const analysis = tracking.analyzeTimeline(shipment.timeline);
  assert(analysis, 'Returns timeline analysis');
  assert(analysis.events >= 2, 'Counts events');
  console.log('  ✓ shipment-tracking');
}

function testFleetManagement() {
  const vehicle = { vehicleId: 'VH-001', type: 'semi-trailer', capacityLbs: 44000, status: 'active', odometer: 125000 };
  const utilization = fleet.computeUtilization(vehicle, 12000);
  assert(utilization, 'Returns utilization');
  assert(utilization.percent > 0, 'Utilization > 0');
  console.log('  ✓ fleet-management');
}

function testValidation() {
  const shipment = ingest.ingestStructured(sampleShipmentData);
  const results = validation.runAllGates(shipment);
  assert(results.gates, 'Has gates array');
  assert(typeof results.passed === 'boolean', 'Has passed boolean');
  assert(Array.isArray(results.warnings), 'Has warnings array');
  console.log('  ✓ validation-gates');
}

function testObservability() {
  const shipment = ingest.ingestStructured(sampleShipmentData);
  const valResults = validation.runAllGates(shipment);
  const confidence = observability.computeConfidenceScore(shipment, valResults);
  assert(confidence.score >= 0 && confidence.score <= 1, 'Score in range');
  assert(confidence.grade, 'Has grade');
  assert(confidence.breakdown, 'Has breakdown');
  assert(confidence.weights, 'Has weights');

  const explain = observability.generateExplainability(shipment, valResults, confidence);
  assert(explain.shipmentId, 'Explainability has shipmentId');
  assert(explain.summary.carrier === 'Swift Transport', 'Summary has carrier');
  assert(explain.routeProof, 'Has route proof');
  assert(explain.costProof, 'Has cost proof');

  // Test ExceptionQueue
  const queue = new observability.ExceptionQueue();
  queue.add('SHIP-001', 'route_validation', 'high', 'Route distance exceeds maximum');
  queue.add('SHIP-001', 'cost_check', 'medium', 'Cost per mile above threshold');
  assert(queue.getOpen().length === 2, 'Queue has two open exceptions');
  assert(queue.getByShipment('SHIP-001').length === 2, 'Filter by shipment');
  queue.resolve(queue.queue[0].id, 'admin', 'Route approved');
  assert(queue.getOpen().length === 1, 'One resolved');
  assert(queue.stats().total === 2, 'Stats total');
  console.log('  ✓ observability (confidence + ExceptionQueue + explainability)');
}

function testLedger() {
  const ledger = new LogisticsLedger();
  const shipment = ingest.ingestStructured(sampleShipmentData);

  const result = ledger.commit(shipment, 'test-user');
  assert(result.version === 1, 'First version');
  assert(result.hash, 'Has hash');

  const retrieved = ledger.get(shipment.shipmentId);
  assert(retrieved, 'Can retrieve committed shipment');
  assert(retrieved.carrier.name === 'Swift Transport', 'Data preserved');

  // Version 2
  retrieved.status = 'in-transit';
  ledger.commit(retrieved, 'tracking-system');
  const history = ledger.getHistory(shipment.shipmentId);
  assert(history.length === 2, 'Two versions');

  // Diff
  const changes = ledger.diff(shipment.shipmentId, 1, 2);
  assert(changes.changes.length > 0, 'Diff shows changes');

  // POD
  const pod = ledger.recordPOD(shipment.shipmentId, 'sig-abc', 'John Smith', 'Received in good condition');
  assert(pod.podId, 'POD has ID');
  assert(pod.verified === true, 'POD verified');
  assert(ledger.getPOD(shipment.shipmentId), 'Can retrieve POD');

  // Reconciliation
  const rec = ledger.reconcile(shipment.shipmentId, 1500);
  assert(rec.variance !== undefined, 'Has variance');
  assert(rec.status, 'Has status');

  // Summary
  const summary = ledger.summary();
  assert(summary.totalShipments >= 1, 'Summary has shipments');
  assert(summary.podsRecorded === 1, 'Summary has PODs');

  console.log('  ✓ logistics-ledger (commit, history, diff, POD, reconcile)');
}

function testOutputFormats() {
  const shipment = ingest.ingestStructured(sampleShipmentData);

  const json = output.toJSON(shipment, { pretty: true });
  assert(json.includes(shipment.shipmentId), 'JSON contains shipmentId');

  const compact = output.toJSON(shipment, { compact: true });
  assert(compact.includes('Swift Transport'), 'Compact JSON has carrier');

  const csv = output.toCSV(shipment);
  assert(csv.includes('shipment_id'), 'CSV has header');

  const timelineCsv = output.timelineToCSV(shipment);
  assert(timelineCsv.includes('timestamp'), 'Timeline CSV has header');

  const api = output.toAPIPayload(shipment);
  assert(api.event === 'shipment.updated', 'API event type');
  assert(api.data.shipment_id === shipment.shipmentId, 'API has shipmentId');

  const md = output.toMarkdown(shipment);
  assert(md.includes('# Shipment'), 'Markdown has title');
  assert(md.includes('Swift Transport'), 'Markdown has carrier');

  const blocks = output.toEmbeddingBlocks(shipment);
  assert(blocks.length >= 3, 'Has multiple embedding blocks');
  assert(blocks[0].blockType === 'overview', 'First block is overview');
  assert(blocks[0].metadata.shipmentId, 'Block has metadata');

  console.log('  ✓ output-formats (JSON, CSV, API, Markdown, embeddings)');
}

function testFullPipeline() {
  const result = processPipeline(sampleShipmentData);
  assert(result.shipment, 'Pipeline returns shipment');
  assert(result.validation, 'Pipeline returns validation');
  assert(result.confidence, 'Pipeline returns confidence');
  assert(result.outputs, 'Pipeline returns outputs');
  console.log('  ✓ full pipeline integration');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

function run() {
  console.log('\n🚛 Fleet Logistics Intelligence SDK — Test Suite\n');
  try {
    testIngest();
    testRouting();
    testShipmentTracking();
    testFleetManagement();
    testValidation();
    testObservability();
    testLedger();
    testOutputFormats();
    testFullPipeline();
    console.log('\n✅ All tests passed.\n');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}\n`);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
