'use strict';

function toAIRecord(record) {
  const openFindings = record.assessment.findings.filter(f => f.status === 'open');
  return {
    id: record.recordId,
    type: 'compliance_record',
    embedding_text: generateEmbeddingText(record),
    structured: {
      entity: record.entity.name,
      regulation: record.regulation.name,
      regulationCode: record.regulation.code,
      category: record.regulation.category,
      assessmentStatus: record.assessment.status,
      score: record.assessment.score,
      openFindings: openFindings.length,
      criticalFindings: openFindings.filter(f => f.severity === 'critical').length,
      controlCount: record.assessment.controls.length,
      riskLevel: record.riskProfile.level,
    },
    metadata: { createdAt: record.audit.createdAt, confidence: record.audit.confidence },
    signals: extractSignals(record),
  };
}

function generateEmbeddingText(record) {
  const findings = record.assessment.findings.filter(f => f.status === 'open');
  return [
    `Compliance record for ${record.entity.name} under ${record.regulation.name} (${record.regulation.code || 'no code'})`,
    `Category: ${record.regulation.category || 'general'}. Authority: ${record.regulation.authority || 'unknown'}`,
    `Assessment status: ${record.assessment.status}, Score: ${record.assessment.score}`,
    `Open findings: ${findings.length} (${findings.filter(f => f.severity === 'critical').length} critical)`,
    `Controls: ${record.assessment.controls.length} (${record.assessment.controls.filter(c => c.status === 'implemented').length} implemented)`,
    `Risk level: ${record.riskProfile.level}`,
  ].join('. ');
}

function extractSignals(record) {
  const signals = [];
  const openFindings = record.assessment.findings.filter(f => f.status === 'open');
  if (openFindings.some(f => f.severity === 'critical')) signals.push({ signal: 'critical_findings', severity: 'critical' });
  if (openFindings.length > 10) signals.push({ signal: 'high_finding_count', severity: 'warning' });
  if (record.assessment.status === 'non-compliant') signals.push({ signal: 'non_compliant', severity: 'critical' });
  if (record.riskProfile.level === 'critical' || record.riskProfile.level === 'high') {
    signals.push({ signal: 'elevated_risk', severity: 'warning' });
  }
  // Stale assessment
  if (record.assessment.lastAssessedAt) {
    const days = Math.ceil((Date.now() - new Date(record.assessment.lastAssessedAt).getTime()) / (24 * 60 * 60 * 1000));
    if (days > 180) signals.push({ signal: 'stale_assessment', severity: 'warning' });
  }
  return signals;
}

function buildComplianceContext(records) {
  const allFindings = records.flatMap(r => r.assessment.findings);
  return {
    totalRecords: records.length,
    regulations: [...new Set(records.map(r => r.regulation.name))],
    overallStatus: records.every(r => r.assessment.status === 'compliant') ? 'fully-compliant' :
      records.some(r => r.assessment.status === 'non-compliant') ? 'non-compliant' : 'partial',
    totalFindings: allFindings.length,
    openFindings: allFindings.filter(f => f.status === 'open').length,
    criticalFindings: allFindings.filter(f => f.status === 'open' && f.severity === 'critical').length,
    avgScore: records.length > 0 ? Math.round(records.reduce((s, r) => s + r.assessment.score, 0) / records.length) : 0,
  };
}

function remediationContext(record) {
  const prioritized = record.assessment.findings
    .filter(f => f.status === 'open')
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };
      return (order[a.severity] || 4) - (order[b.severity] || 4);
    });

  return {
    recordId: record.recordId,
    regulation: record.regulation.name,
    entity: record.entity.name,
    findings: prioritized.slice(0, 5).map(f => ({ title: f.title, severity: f.severity, dueDate: f.dueDate })),
    prompt: `${record.entity.name} has ${prioritized.length} open findings under ${record.regulation.name}. ` +
      `${prioritized.filter(f => f.severity === 'critical').length} critical, ${prioritized.filter(f => f.severity === 'high').length} high. ` +
      `Current score: ${record.assessment.score}. Recommend remediation plan.`,
  };
}

module.exports = { toAIRecord, generateEmbeddingText, extractSignals, buildComplianceContext, remediationContext };
