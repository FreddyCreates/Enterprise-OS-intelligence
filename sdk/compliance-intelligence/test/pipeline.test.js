/**
 * Compliance Intelligence SDK — Pipeline Integration Test
 */

'use strict';

const { processPipeline, schema, ingest, controls, riskAssessment, audit, ComplianceLedger, aiContext, validation, observability, output } = require('../index');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

const sampleAssessmentData = {
  framework: { id: 'SOC2-TYPE2', name: 'SOC 2 Type II', version: '2024', domain: 'Security' },
  organization: { name: 'MedinaTech Solutions', unit: 'Cloud Services', assessor: 'Jane Torres', assessDate: '2026-05-20' },
  controls: [
    { controlId: 'CC6.1', title: 'Logical Access Security', category: 'Access', status: 'effective', evidence: ['access-policy.pdf', 'rbac-config.json'], testDate: '2026-05-10' },
    { controlId: 'CC6.6', title: 'System Boundary Protection', category: 'Network', status: 'effective', evidence: ['firewall-rules.json', 'network-diagram.pdf'], testDate: '2026-05-11' },
    { controlId: 'CC7.2', title: 'Security Monitoring', category: 'Monitoring', status: 'partially-effective', evidence: ['siem-config.json'], testDate: '2026-05-12', gaps: ['Real-time alerting not configured for all critical assets'] },
    { controlId: 'CC8.1', title: 'Change Management', category: 'Operations', status: 'effective', evidence: ['change-mgmt-policy.pdf', 'jira-audit-log.csv'], testDate: '2026-05-13' },
  ],
  findings: [
    { findingId: 'F-2026-001', severity: 'medium', control: 'CC7.2', title: 'Incomplete monitoring coverage', description: 'SIEM does not cover 3 critical assets', recommendation: 'Extend SIEM agent deployment to all Tier-1 assets' },
  ],
  riskScore: { overall: 0.82, confidentiality: 0.90, integrity: 0.85, availability: 0.72 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

function testIngest() {
  const assessment = ingest.ingestStructured(sampleAssessmentData);
  assert(assessment.assessmentId, 'Should generate assessmentId');
  assert(assessment.framework.id === 'SOC2-TYPE2', 'Framework preserved');
  assert(assessment.controls.length === 4, 'Controls preserved');
  assert(assessment.findings.length === 1, 'Findings preserved');
  assert(assessment.audit.createdAt, 'Audit timestamp set');
  console.log('  ✓ ingest-normalize');
}

function testControlsIntelligence() {
  const assessment = ingest.ingestStructured(sampleAssessmentData);
  const status = controls.summarizeControls(assessment.controls);
  assert(status.total === 4, 'Four controls');
  assert(status.effective === 3, 'Three effective');
  assert(status.gaps.length === 1, 'One with gaps');
  console.log('  ✓ controls-intelligence');
}

function testRiskAssessment() {
  const assessment = ingest.ingestStructured(sampleAssessmentData);
  const risk = riskAssessment.computeRisk(assessment);
  assert(risk, 'Returns risk assessment');
  assert(risk.overallScore >= 0 && risk.overallScore <= 1, 'Score in range');
  assert(risk.riskLevel, 'Has risk level');
  console.log('  ✓ risk-assessment');
}

function testAuditIntelligence() {
  const assessment = ingest.ingestStructured(sampleAssessmentData);
  const readiness = audit.assessReadiness(assessment);
  assert(readiness, 'Returns audit readiness');
  assert(typeof readiness.ready === 'boolean', 'Has ready flag');
  assert(readiness.evidenceScore >= 0, 'Has evidence score');
  console.log('  ✓ audit-intelligence');
}

function testValidation() {
  const assessment = ingest.ingestStructured(sampleAssessmentData);
  const results = validation.runAllGates(assessment);
  assert(results.gates, 'Has gates array');
  assert(typeof results.passed === 'boolean', 'Has passed boolean');
  assert(Array.isArray(results.warnings), 'Has warnings array');
  console.log('  ✓ validation-gates');
}

function testObservability() {
  const assessment = ingest.ingestStructured(sampleAssessmentData);
  const valResults = validation.runAllGates(assessment);
  const confidence = observability.computeConfidenceScore(assessment, valResults);
  assert(confidence.score >= 0 && confidence.score <= 1, 'Score in range');
  assert(confidence.grade, 'Has grade');
  assert(confidence.breakdown, 'Has breakdown');

  const explain = observability.generateExplainability(assessment, valResults, confidence);
  assert(explain.assessmentId, 'Explainability has assessmentId');
  assert(explain.summary.framework === 'SOC2-TYPE2', 'Summary has framework');
  assert(explain.assessmentProof, 'Has assessment proof');

  // Test ExceptionQueue
  const queue = new observability.ExceptionQueue();
  queue.add('ASM-001', 'missing_evidence', 'high', 'Control CC7.2 has insufficient evidence');
  queue.fromFindings(assessment.findings);
  assert(queue.stats().total >= 2, 'Queue has exceptions');
  const critical = queue.getCritical();
  assert(Array.isArray(critical), 'getCritical returns array');
  console.log('  ✓ observability (confidence + ExceptionQueue + explainability)');
}

function testLedger() {
  const ledger = new ComplianceLedger();
  const assessment = ingest.ingestStructured(sampleAssessmentData);
  assessment.status = 'draft';

  const result = ledger.commit(assessment, 'assessor');
  assert(result.version === 1, 'First version');
  assert(result.hash, 'Has hash');

  const retrieved = ledger.get(assessment.assessmentId);
  assert(retrieved, 'Can retrieve committed assessment');
  assert(retrieved.framework.id === 'SOC2-TYPE2', 'Data preserved');

  // Add finding
  const finding = ledger.addFinding(assessment.assessmentId, {
    severity: 'low', control: 'CC8.1', title: 'Outdated procedure doc',
    description: 'Change management procedure last updated 14 months ago',
    recommendation: 'Review and update annually',
  }, 'assessor');
  assert(finding.success === true, 'Finding added');
  assert(finding.findingId, 'Finding has ID');

  // Remediate finding
  const remediation = ledger.remediateFinding(assessment.assessmentId, 'F-2026-001', 'security-team', 'SIEM agents deployed to all Tier-1 assets', ['siem-deploy-evidence.pdf']);
  assert(remediation.success === true, 'Remediation succeeds');

  // Add evidence
  const evidence = ledger.addEvidence(assessment.assessmentId, 'CC6.1', ['quarterly-access-review.pdf', 'user-deprovisioning-log.csv'], 'compliance-team');
  assert(evidence.success === true, 'Evidence added');

  // Accept risk
  const risk = ledger.acceptRisk(assessment.assessmentId, finding.findingId, 'CISO', 'Risk accepted — low impact, remediation scheduled Q3');
  assert(risk.success === true, 'Risk accepted');

  // Submit for audit
  const submission = ledger.submitForAudit(assessment.assessmentId, 'compliance-lead', 'Ready for external audit');
  assert(submission.success === true, 'Submitted for audit');
  assert(ledger.get(assessment.assessmentId).status === 'submitted-for-audit', 'Status updated');

  // Record audit result
  const auditResult = ledger.recordAuditResult(assessment.assessmentId, 'pass-with-observations', 'external-auditor', 'Clean report with one observation on monitoring');
  assert(auditResult.success === true, 'Audit result recorded');
  assert(ledger.get(assessment.assessmentId).auditResult === 'pass-with-observations', 'Audit result stored');

  // History & diff
  const history = ledger.getHistory(assessment.assessmentId);
  assert(history.length >= 5, 'Multiple versions from lifecycle');
  const diff = ledger.diff(assessment.assessmentId, 1, 2);
  assert(diff.changes.length > 0, 'Diff shows changes');

  // Summary
  const summary = ledger.summary();
  assert(summary.totalAssessments >= 1, 'Summary has assessments');
  assert(summary.findings >= 1, 'Summary has findings');

  console.log('  ✓ compliance-ledger (commit, finding, remediate, evidence, risk, audit)');
}

function testOutputFormats() {
  const assessment = ingest.ingestStructured(sampleAssessmentData);

  const json = output.toJSON(assessment, { pretty: true });
  assert(json.includes(assessment.assessmentId), 'JSON contains assessmentId');

  const compact = output.toJSON(assessment, { compact: true });
  assert(compact.includes('SOC2-TYPE2'), 'Compact has framework');

  const csv = output.toCSV(assessment);
  assert(csv.includes('assessment_id'), 'CSV has header');

  const controlsCsv = output.controlsToCSV(assessment);
  assert(controlsCsv.includes('control_id'), 'Controls CSV has header');
  assert(controlsCsv.includes('CC6.1'), 'Has control ID');

  const api = output.toAPIPayload(assessment);
  assert(api.event === 'assessment.updated', 'API event type');
  assert(api.data.assessment_id === assessment.assessmentId, 'API has assessmentId');

  const md = output.toMarkdown(assessment);
  assert(md.includes('# Compliance Assessment'), 'Markdown has title');
  assert(md.includes('SOC 2 Type II'), 'Markdown has framework name');

  const blocks = output.toEmbeddingBlocks(assessment);
  assert(blocks.length >= 3, 'Has multiple embedding blocks');
  assert(blocks[0].blockType === 'overview', 'First block is overview');

  const riskBlock = output.toRiskSummaryBlock(assessment);
  assert(riskBlock.overallScore, 'Risk block has score');
  assert(riskBlock.dimensions, 'Risk block has dimensions');

  console.log('  ✓ output-formats (JSON, CSV, API, Markdown, embeddings, risk)');
}

function testFullPipeline() {
  const result = processPipeline(sampleAssessmentData);
  assert(result.assessment, 'Pipeline returns assessment');
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
  console.log('\n🛡️  Compliance Intelligence SDK — Test Suite\n');
  try {
    testIngest();
    testControlsIntelligence();
    testRiskAssessment();
    testAuditIntelligence();
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
