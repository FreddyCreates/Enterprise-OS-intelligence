/**
 * Inventory Intelligence SDK — Pipeline Integration Test
 */

'use strict';

const { processPipeline, schema, ingest, classify, tracking, forecast, InventoryLedger, aiContext, validation, observability, output } = require('../index');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

const sampleInventoryData = {
  warehouse: { name: 'Dallas Distribution Center', code: 'DAL-01', zone: 'A', address: '1234 Commerce St, Dallas, TX 75201' },
  items: [
    { sku: 'SKU-001', name: 'Widget Alpha', category: 'components', unit: 'EA', unitCost: 12.50, weight: 0.5, lotNumber: 'LOT-2026-001' },
    { sku: 'SKU-002', name: 'Gadget Beta', category: 'assemblies', unit: 'EA', unitCost: 45.00, weight: 2.1, expiryDate: '2027-06-01' },
    { sku: 'SKU-003', name: 'Part Gamma', category: 'raw-materials', unit: 'KG', unitCost: 8.25, weight: 1.0 },
  ],
  levels: { onHand: 500, allocated: 120, available: 380, inTransit: 50, backOrdered: 10 },
  movements: [
    { type: 'receipt', sku: 'SKU-001', quantity: 200, timestamp: '2026-05-20T10:00:00Z', performedBy: 'warehouse-bot', reference: 'PO-5001' },
    { type: 'issue', sku: 'SKU-002', quantity: 30, timestamp: '2026-05-21T14:30:00Z', performedBy: 'pick-system', reference: 'SO-8001' },
    { type: 'transfer', sku: 'SKU-003', quantity: 50, timestamp: '2026-05-22T09:00:00Z', performedBy: 'logistics', fromLocation: 'Zone-A', toLocation: 'Zone-B' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

function testIngest() {
  const record = ingest.ingestStructured(sampleInventoryData);
  assert(record.recordId, 'Should generate recordId');
  assert(record.warehouse.name === 'Dallas Distribution Center', 'Warehouse name preserved');
  assert(record.items.length === 3, 'Items count preserved');
  assert(record.audit.createdAt, 'Audit timestamp set');
  console.log('  ✓ ingest-normalize');
}

function testClassification() {
  const record = ingest.ingestStructured(sampleInventoryData);
  const classified = classify.classifyItem(record.items[0], { totalValue: 10000 });
  assert(classified, 'Returns classification');
  console.log('  ✓ item-classification');
}

function testStockTracking() {
  const record = ingest.ingestStructured(sampleInventoryData);
  const analysis = tracking.analyzeMovements(record.movements);
  assert(analysis, 'Returns movement analysis');
  assert(analysis.totalMovements === 3, 'Counts movements');
  console.log('  ✓ stock-tracking');
}

function testDemandForecast() {
  const patterns = forecast.detectPatterns([100, 120, 110, 130, 125, 140, 135]);
  assert(patterns, 'Returns pattern analysis');
  console.log('  ✓ demand-forecast');
}

function testValidation() {
  const record = ingest.ingestStructured(sampleInventoryData);
  const results = validation.runAllGates(record);
  assert(results.gates, 'Has gates array');
  assert(typeof results.passed === 'boolean', 'Has passed boolean');
  assert(Array.isArray(results.warnings), 'Has warnings array');
  console.log('  ✓ validation-gates');
}

function testObservability() {
  const record = ingest.ingestStructured(sampleInventoryData);
  const valResults = validation.runAllGates(record);
  const confidence = observability.computeConfidenceScore(record, valResults);
  assert(confidence.score >= 0 && confidence.score <= 1, 'Score in range');
  assert(confidence.grade, 'Has grade');
  assert(confidence.breakdown, 'Has breakdown');

  const explain = observability.generateExplainability(record, valResults, confidence);
  assert(explain.recordId, 'Explainability has recordId');
  assert(explain.summary, 'Explainability has summary');

  // Test ExceptionQueue
  const queue = new observability.ExceptionQueue();
  queue.add('REC-001', 'stockout', 'critical', 'Zero available stock');
  assert(queue.getOpen().length === 1, 'Queue has one open exception');
  queue.resolve(queue.queue[0].id, 'admin', 'Stock replenished');
  assert(queue.getOpen().length === 0, 'Queue resolved');
  console.log('  ✓ observability (confidence + ExceptionQueue + explainability)');
}

function testLedger() {
  const ledger = new InventoryLedger();
  const record = ingest.ingestStructured(sampleInventoryData);

  const result = ledger.commit(record, 'test-user');
  assert(result.version === 1, 'First version');

  const retrieved = ledger.get(record.recordId);
  assert(retrieved, 'Can retrieve committed record');
  assert(retrieved.warehouse.name === 'Dallas Distribution Center', 'Data preserved');

  // Version 2
  retrieved.levels.onHand = 600;
  ledger.commit(retrieved, 'update-bot');
  const history = ledger.getHistory(record.recordId);
  assert(history.length === 2, 'Two versions in history');

  // Reconciliation
  const rec = ledger.reconcile(record.recordId, 595, 'counter-1');
  assert(rec.variance === -5, 'Variance calculated');
  assert(rec.status, 'Has status');

  // Snapshot
  const snap = ledger.takeSnapshot('test-snap');
  assert(snap.snapshotId, 'Snapshot has ID');
  assert(snap.recordCount === 1, 'Snapshot has record');

  console.log('  ✓ inventory-ledger (commit, history, reconcile, snapshot)');
}

function testAIContext() {
  const record = ingest.ingestStructured(sampleInventoryData);
  const aiRecord = aiContext.toAIRecord(record);
  assert(aiRecord, 'Returns AI record');
  assert(aiRecord.text || aiRecord.summary, 'Has text content');
  console.log('  ✓ ai-inventory-context');
}

function testOutputFormats() {
  const record = ingest.ingestStructured(sampleInventoryData);

  const json = output.toJSON(record, { pretty: true });
  assert(json.includes(record.recordId), 'JSON contains recordId');

  const csv = output.toCSV(record);
  assert(csv.includes('record_id'), 'CSV has header');
  assert(csv.includes(record.recordId), 'CSV has data');

  const itemsCsv = output.itemsToCSV(record);
  assert(itemsCsv.includes('sku'), 'Items CSV has header');

  const api = output.toAPIPayload(record);
  assert(api.type === 'inventory_update', 'API payload type');
  assert(api.payload.recordId === record.recordId, 'API has recordId');

  const blocks = output.toEmbeddingBlocks(record);
  assert(blocks.length >= 2, 'Has multiple embedding blocks');
  assert(blocks[0].blockType === 'overview', 'First block is overview');

  console.log('  ✓ output-formats (JSON, CSV, API, embeddings)');
}

function testFullPipeline() {
  const result = processPipeline(sampleInventoryData);
  assert(result.record, 'Pipeline returns record');
  assert(result.validation, 'Pipeline returns validation');
  assert(result.confidence, 'Pipeline returns confidence');
  assert(result.aiRecord, 'Pipeline returns AI record');
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
  console.log('\n📦 Inventory Intelligence SDK — Test Suite\n');
  try {
    testIngest();
    testClassification();
    testStockTracking();
    testDemandForecast();
    testValidation();
    testObservability();
    testLedger();
    testAIContext();
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
