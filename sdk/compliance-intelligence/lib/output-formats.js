/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OUTPUT FORMATS — Multi-Format Export for Compliance Data             ║
 * ║                                                                            ║
 * ║  JSON, CSV, API payloads, markdown reports, and embeddings-ready text      ║
 * ║  blocks for downstream intelligence systems.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// JSON OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export compliance record as clean JSON.
 */
function toJSON(record, options = {}) {
  const data = options.compact ? {
    recordId: record.recordId,
    entity: record.entity.name,
    regulation: record.regulation.name,
    status: record.assessment.status,
    score: record.assessment.score,
    riskLevel: record.riskProfile.level,
    findings: record.assessment.findings.length,
    controls: record.assessment.controls.length,
  } : JSON.parse(JSON.stringify(record));

  return options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Export compliance records as CSV rows.
 */
function toCSV(records, options = {}) {
  const arr = Array.isArray(records) ? records : [records];
  const delimiter = options.delimiter || ',';

  const headers = [
    'record_id', 'entity', 'entity_type', 'regulation', 'category',
    'status', 'score', 'risk_level', 'total_findings', 'open_findings',
    'critical_findings', 'controls', 'evidence_items', 'confidence',
  ];

  const rows = arr.map(r => [
    r.recordId,
    escapeCSV(r.entity.name),
    r.entity.type || '',
    escapeCSV(r.regulation.name),
    escapeCSV(r.regulation.category || ''),
    r.assessment.status,
    r.assessment.score,
    r.riskProfile.level,
    r.assessment.findings.length,
    r.assessment.findings.filter(f => f.status === 'open').length,
    r.assessment.findings.filter(f => f.severity === 'critical').length,
    r.assessment.controls.length,
    r.evidence.length,
    r.audit.confidence || '',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export findings as CSV.
 */
function findingsToCSV(record, options = {}) {
  const delimiter = options.delimiter || ',';
  const headers = [
    'record_id', 'finding_id', 'title', 'severity', 'status',
    'assigned_to', 'due_date', 'regulation', 'description', 'remediation',
  ];

  const rows = record.assessment.findings.map(f => [
    record.recordId,
    f.findingId || '',
    escapeCSV(f.title),
    f.severity,
    f.status,
    escapeCSV(f.assignedTo || ''),
    f.dueDate || '',
    escapeCSV(f.regulation || record.regulation.name),
    escapeCSV(f.description || ''),
    escapeCSV(f.remediation || ''),
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

/**
 * Export controls as CSV.
 */
function controlsToCSV(record, options = {}) {
  const delimiter = options.delimiter || ',';
  const headers = [
    'record_id', 'control_id', 'name', 'type', 'status',
    'effectiveness', 'owner', 'last_tested', 'next_review',
  ];

  const rows = record.assessment.controls.map(c => [
    record.recordId,
    c.controlId || '',
    escapeCSV(c.name),
    c.type || '',
    c.status,
    c.effectiveness || '',
    escapeCSV(c.owner || ''),
    c.lastTested || '',
    c.nextReview || '',
  ]);

  const lines = [headers.join(delimiter)];
  for (const row of rows) {
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// API PAYLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate an API-ready payload (for GRC platforms, webhooks, audit systems).
 */
function toAPIPayload(record, options = {}) {
  return {
    event: options.event || 'compliance.updated',
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      record_id: record.recordId,
      entity: {
        name: record.entity.name,
        type: record.entity.type || '',
        jurisdiction: record.entity.jurisdiction || '',
      },
      regulation: {
        name: record.regulation.name,
        category: record.regulation.category,
        authority: record.regulation.authority || '',
      },
      assessment: {
        status: record.assessment.status,
        score: record.assessment.score,
        total_findings: record.assessment.findings.length,
        open_findings: record.assessment.findings.filter(f => f.status === 'open').length,
        critical_findings: record.assessment.findings.filter(f => f.severity === 'critical').length,
        controls: record.assessment.controls.length,
      },
      risk: {
        level: record.riskProfile.level,
        inherent: record.riskProfile.inherentRisk || null,
        residual: record.riskProfile.residualRisk || null,
      },
      metadata: {
        confidence: record.audit.confidence,
        source_hash: record.audit.sourceHash,
        warnings: record.audit.warnings || [],
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN REPORT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a human-readable markdown compliance report.
 */
function toMarkdown(record) {
  const lines = [
    `# Compliance Assessment: ${record.entity.name}`,
    '',
    `**Regulation:** ${record.regulation.name} (${record.regulation.category || 'N/A'})`,
    `**Status:** ${record.assessment.status}`,
    `**Score:** ${record.assessment.score}`,
    `**Risk Level:** ${record.riskProfile.level}`,
    '',
    '## Summary',
    `| Metric | Value |`,
    `|:---|---:|`,
    `| Total Findings | ${record.assessment.findings.length} |`,
    `| Open Findings | ${record.assessment.findings.filter(f => f.status === 'open').length} |`,
    `| Critical | ${record.assessment.findings.filter(f => f.severity === 'critical').length} |`,
    `| High | ${record.assessment.findings.filter(f => f.severity === 'high').length} |`,
    `| Controls Mapped | ${record.assessment.controls.length} |`,
    `| Evidence Items | ${record.evidence.length} |`,
    '',
    '## Findings',
    '| ID | Title | Severity | Status | Assigned |',
    '|:---|:---|:---|:---|:---|',
  ];

  for (const f of record.assessment.findings) {
    lines.push(`| ${f.findingId || '—'} | ${f.title} | ${f.severity} | ${f.status} | ${f.assignedTo || '—'} |`);
  }

  if (record.assessment.findings.length === 0) {
    lines.push('| — | No findings recorded | — | — | — |');
  }

  lines.push('');
  lines.push('## Controls');
  lines.push('| Name | Type | Status | Effectiveness |');
  lines.push('|:---|:---|:---|---:|');

  for (const c of record.assessment.controls) {
    lines.push(`| ${c.name} | ${c.type || '—'} | ${c.status} | ${c.effectiveness || 0}% |`);
  }

  if (record.assessment.controls.length === 0) {
    lines.push('| — | No controls documented | — | — |');
  }

  lines.push('');
  lines.push('## Risk Profile');
  lines.push(`- **Level:** ${record.riskProfile.level}`);
  lines.push(`- **Inherent Risk:** ${record.riskProfile.inherentRisk || 'Not assessed'}`);
  lines.push(`- **Residual Risk:** ${record.riskProfile.residualRisk || 'Not assessed'}`);

  if (record.riskProfile.factors && record.riskProfile.factors.length > 0) {
    lines.push('- **Risk Factors:**');
    for (const factor of record.riskProfile.factors) {
      lines.push(`  - ${factor}`);
    }
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMBEDDINGS-READY TEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate text blocks optimized for vector embedding systems.
 */
function toEmbeddingBlocks(record) {
  const blocks = [];

  // Block 1: Overview
  blocks.push({
    blockType: 'overview',
    text: `Compliance assessment for ${record.entity.name} under ${record.regulation.name} (${record.regulation.category || 'general'}). ` +
      `Status: ${record.assessment.status}. Score: ${record.assessment.score}. ` +
      `Risk level: ${record.riskProfile.level}. ` +
      `${record.assessment.findings.length} findings, ${record.assessment.controls.length} controls.`,
    metadata: { recordId: record.recordId, section: 'overview' },
  });

  // Block 2: Findings detail
  if (record.assessment.findings.length > 0) {
    blocks.push({
      blockType: 'findings',
      text: record.assessment.findings.map(f =>
        `[${f.severity}] ${f.title} — status: ${f.status}${f.assignedTo ? `, assigned: ${f.assignedTo}` : ''}`
      ).join('. '),
      metadata: { recordId: record.recordId, section: 'findings' },
    });
  }

  // Block 3: Controls
  if (record.assessment.controls.length > 0) {
    blocks.push({
      blockType: 'controls',
      text: record.assessment.controls.map(c =>
        `${c.name}: ${c.status}, ${c.effectiveness || 0}% effective (${c.type || 'general'})`
      ).join('. '),
      metadata: { recordId: record.recordId, section: 'controls' },
    });
  }

  // Block 4: Risk
  blocks.push({
    blockType: 'risk',
    text: `Risk level: ${record.riskProfile.level}. ` +
      `Inherent: ${record.riskProfile.inherentRisk || 'N/A'}. ` +
      `Residual: ${record.riskProfile.residualRisk || 'N/A'}. ` +
      `Factors: ${(record.riskProfile.factors || []).join(', ') || 'none documented'}.`,
    metadata: { recordId: record.recordId, section: 'risk' },
  });

  return blocks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function escapeCSV(value) {
  if (typeof value !== 'string') return value;
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

module.exports = {
  toJSON,
  toCSV,
  findingsToCSV,
  controlsToCSV,
  toAPIPayload,
  toMarkdown,
  toEmbeddingBlocks,
};
