'use strict';

function toJSON(record, options = {}) { return options.pretty ? JSON.stringify(record, null, 2) : JSON.stringify(record); }

function toCSV(records) {
  const arr = Array.isArray(records) ? records : [records];
  const header = 'record_id,entity,regulation,category,status,score,open_findings,controls,risk_level';
  const rows = arr.map(r => `${r.recordId},${r.entity.name},${r.regulation.name},${r.regulation.category},${r.assessment.status},${r.assessment.score},${r.assessment.findings.filter(f => f.status === 'open').length},${r.assessment.controls.length},${r.riskProfile.level}`);
  return [header, ...rows].join('\n');
}

function findingsToCSV(record) {
  const header = 'finding_id,title,severity,status,assigned_to,due_date,regulation';
  const rows = record.assessment.findings.map(f => `${f.findingId},${f.title},${f.severity},${f.status},${f.assignedTo || ''},${f.dueDate || ''},${f.regulation || ''}`);
  return [header, ...rows].join('\n');
}

function toAPIPayload(record) {
  return {
    type: 'compliance_update',
    version: '1.0',
    timestamp: new Date().toISOString(),
    payload: { recordId: record.recordId, entity: record.entity.name, regulation: record.regulation.name, status: record.assessment.status, score: record.assessment.score, riskLevel: record.riskProfile.level },
  };
}

function toEmbeddingBlocks(record) {
  return [
    { blockType: 'overview', text: `Compliance: ${record.entity.name} under ${record.regulation.name}. Status: ${record.assessment.status}. Score: ${record.assessment.score}. Risk: ${record.riskProfile.level}.` },
    { blockType: 'findings', text: record.assessment.findings.map(f => `[${f.severity}] ${f.title} (${f.status})`).join('. ') || 'No findings.' },
    { blockType: 'controls', text: record.assessment.controls.map(c => `${c.name}: ${c.status} (${c.effectiveness}% effective)`).join('. ') || 'No controls documented.' },
  ];
}

module.exports = { toJSON, toCSV, findingsToCSV, toAPIPayload, toEmbeddingBlocks };
