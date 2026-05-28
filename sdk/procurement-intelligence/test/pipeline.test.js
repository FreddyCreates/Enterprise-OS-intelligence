/**
 * Procurement Intelligence SDK — Pipeline Integration Test
 */

'use strict';

const { processPipeline, schema, ingest, vendor, purchaseOrders, spend, ProcurementLedger, aiContext, validation, observability, output } = require('../index');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

const samplePOData = {
  vendor: { name: 'Acme Industrial Supply', code: 'ACME-001', contact: 'sales@acme.com', category: 'industrial' },
  buyer: { name: 'Maria Rodriguez', department: 'Operations', email: 'maria@company.com' },
  lineItems: [
    { lineNumber: 1, description: 'Steel Bolts M10x30', partNumber: 'SB-M10-30', quantity: 500, unit: 'EA', unitPrice: 0.45, lineTotal: 225.00, category: 'fasteners' },
    { lineNumber: 2, description: 'Hydraulic Hose Assembly', partNumber: 'HH-A100', quantity: 12, unit: 'EA', unitPrice: 89.50, lineTotal: 1074.00, category: 'hydraulics' },
    { lineNumber: 3, description: 'Safety Goggles ANSI Z87', partNumber: 'SG-Z87', quantity: 50, unit: 'EA', unitPrice: 12.99, lineTotal: 649.50, category: 'PPE' },
  ],
  totals: { subtotal: 1948.50, tax: 160.75, shipping: 45.00, totalAmount: 2154.25, currency: 'USD' },
  terms: { orderDate: '2026-05-15', requiredDate: '2026-06-01', paymentTerms: 'Net 30' },
  approvals: [
    { approver: 'James Chen', role: 'Ops Manager', status: 'approved', timestamp: '2026-05-15T10:30:00Z', comment: 'Within budget' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

function testIngest() {
  const po = ingest.ingestStructured(samplePOData);
  assert(po.poNumber, 'Should generate PO number');
  assert(po.vendor.name === 'Acme Industrial Supply', 'Vendor name preserved');
  assert(po.lineItems.length === 3, 'Line items preserved');
  assert(po.totals.totalAmount === 2154.25, 'Total preserved');
  assert(po.audit.createdAt, 'Audit timestamp set');
  console.log('  ✓ ingest-normalize');
}

function testVendorIntelligence() {
  const scoring = vendor.scoreVendor({ deliveries: 20, onTime: 18, qualityIssues: 1, avgLeadDays: 7 });
  assert(scoring, 'Returns vendor score');
  assert(scoring.onTimePercent === 90, 'On-time calculated');
  console.log('  ✓ vendor-intelligence');
}

function testPurchaseOrders() {
  const po = ingest.ingestStructured(samplePOData);
  const lifecycle = purchaseOrders.getLifecycleStage(po);
  assert(lifecycle, 'Returns lifecycle stage');
  console.log('  ✓ purchase-orders');
}

function testSpendAnalytics() {
  const po = ingest.ingestStructured(samplePOData);
  const analysis = spend.analyzeByCategory(po.lineItems);
  assert(analysis, 'Returns spend analysis');
  assert(Object.keys(analysis).length === 3, 'Three categories');
  console.log('  ✓ spend-analytics');
}

function testValidation() {
  const po = ingest.ingestStructured(samplePOData);
  const results = validation.runAllGates(po);
  assert(results.gates, 'Has gates array');
  assert(typeof results.passed === 'boolean', 'Has passed boolean');
  assert(Array.isArray(results.warnings), 'Has warnings array');
  console.log('  ✓ validation-gates');
}

function testObservability() {
  const po = ingest.ingestStructured(samplePOData);
  const valResults = validation.runAllGates(po);
  const confidence = observability.computeConfidenceScore(po, valResults);
  assert(confidence.score >= 0 && confidence.score <= 1, 'Score in range');
  assert(confidence.grade, 'Has grade');
  assert(confidence.breakdown, 'Has breakdown');
  assert(confidence.weights, 'Has weights');

  const explain = observability.generateExplainability(po, valResults, confidence);
  assert(explain.poNumber, 'Explainability has PO number');
  assert(explain.summary.vendor === 'Acme Industrial Supply', 'Summary has vendor');
  assert(explain.calculationProof, 'Has calculation proof');
  assert(explain.approvalChain.length === 1, 'Has approval chain');

  // Test ExceptionQueue
  const queue = new observability.ExceptionQueue();
  queue.add('PO-001', 'total_mismatch', 'high', 'Line items do not sum to subtotal');
  queue.fromValidation('PO-002', valResults);
  assert(queue.stats().total >= 1, 'Queue has exceptions');
  console.log('  ✓ observability (confidence + ExceptionQueue + explainability)');
}

function testLedger() {
  const ledger = new ProcurementLedger();
  const po = ingest.ingestStructured(samplePOData);
  po.status = 'pending-approval';

  const result = ledger.commit(po, 'test-user');
  assert(result.version === 1, 'First version');
  assert(result.hash, 'Has hash');

  const retrieved = ledger.get(po.poNumber);
  assert(retrieved, 'Can retrieve committed PO');
  assert(retrieved.vendor.name === 'Acme Industrial Supply', 'Data preserved');

  // Approve
  const approval = ledger.approve(po.poNumber, 'manager-1', 'Finance Director', 'Budget approved');
  assert(approval.success === true, 'Approval succeeds');
  assert(ledger.get(po.poNumber).status === 'approved', 'Status updated');

  // Receive goods
  const receipt = ledger.receiveGoods(po.poNumber, 1, 500, 'receiving-clerk', 'All in good condition');
  assert(receipt.success === true, 'Receipt succeeds');
  assert(receipt.line.status === 'received', 'Line fully received');

  // Reconcile
  const rec = ledger.reconcile(po.poNumber, 2180.00, 'INV-ACME-2026-001');
  assert(rec.variance !== undefined, 'Has variance');
  assert(rec.invoiceRef === 'INV-ACME-2026-001', 'Has invoice ref');

  // History & diff
  const history = ledger.getHistory(po.poNumber);
  assert(history.length >= 3, 'Multiple versions from operations');

  // Summary
  const summary = ledger.summary();
  assert(summary.totalOrders >= 1, 'Summary has orders');
  assert(summary.totalValue > 0, 'Summary has value');

  console.log('  ✓ procurement-ledger (commit, approve, receive, reconcile, diff)');
}

function testOutputFormats() {
  const po = ingest.ingestStructured(samplePOData);

  const json = output.toJSON(po, { pretty: true });
  assert(json.includes(po.poNumber), 'JSON contains PO number');

  const compact = output.toJSON(po, { compact: true });
  assert(compact.includes('Acme Industrial Supply'), 'Compact has vendor');

  const csv = output.toCSV(po);
  assert(csv.includes('po_number'), 'CSV has header');

  const linesCsv = output.lineItemsToCSV(po);
  assert(linesCsv.includes('description'), 'Line items CSV has header');
  assert(linesCsv.includes('Steel Bolts'), 'Line items has data');

  const api = output.toAPIPayload(po);
  assert(api.event === 'purchase_order.updated', 'API event type');
  assert(api.data.po_number === po.poNumber, 'API has PO number');

  const md = output.toMarkdown(po);
  assert(md.includes('# Purchase Order'), 'Markdown has title');
  assert(md.includes('Acme Industrial Supply'), 'Markdown has vendor');

  const blocks = output.toEmbeddingBlocks(po);
  assert(blocks.length >= 3, 'Has multiple embedding blocks');
  assert(blocks[0].blockType === 'overview', 'First block is overview');
  assert(blocks[0].metadata.poNumber, 'Block has metadata');

  console.log('  ✓ output-formats (JSON, CSV, API, Markdown, embeddings)');
}

function testFullPipeline() {
  const result = processPipeline(samplePOData);
  assert(result.po, 'Pipeline returns PO');
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
  console.log('\n🛒 Procurement Intelligence SDK — Test Suite\n');
  try {
    testIngest();
    testVendorIntelligence();
    testPurchaseOrders();
    testSpendAnalytics();
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
