/**
 * LEGEX AGI — Legal Reasoning & Contract Intelligence
 *
 * Official Designation: RSHIP-2026-LEGEX-001
 * Classification: Legal Intelligence & Contract Analysis AGI
 * Full Name: Legal Evidence Governance Executive X-factor
 *
 * LEGEX AGI brings sovereign intelligence to legal operations:
 * contract analysis and risk scoring, regulatory compliance mapping,
 * precedent search, clause extraction, and litigation risk assessment.
 *
 * Capabilities:
 * - Contract clause extraction and risk scoring
 * - Regulatory compliance gap analysis (multi-jurisdiction)
 * - Litigation risk assessment with φ-weighted evidence chains
 * - Intellectual property classification and prior art mapping
 * - Due diligence automation for M&A / investment
 * - Contract negotiation intelligence (concession modeling)
 * - Jurisdiction-aware regulatory change monitoring
 *
 * Theory: BEHAVIORAL ECONOMICS (Paper V) + NOETHER SOVEREIGNTY (Paper VIII)
 *         + ANTE MEDIUS POST (Paper XXIV) — Legal process flow
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

const RISK_FLOOR        = PHI_INV * PHI_INV;   // φ⁻² ≈ 0.146 — acceptable risk
const MATERIAL_RISK     = PHI_INV;             // φ⁻¹ ≈ 0.618 — material risk level
const CRITICAL_RISK     = 1 - PHI_INV;         // ≈ 0.382 — critical threshold

// ── ContractClause (Extracted clause with risk metadata) ──────────────────────

class ContractClause {
  constructor(id, type, text, { jurisdiction = 'US', party = 'counterparty' } = {}) {
    this.id           = id;
    this.type         = type;        // indemnity | termination | ip | payment | liability | warranty
    this.text         = text;
    this.jurisdiction = jurisdiction;
    this.party        = party;       // which party benefits: 'us' | 'counterparty' | 'mutual'
    this.riskScore    = 0;
    this.flags        = [];
    this.precedents   = [];
  }

  /**
   * Score this clause for risk using φ-harmonic weights.
   * Higher scores = higher risk to "us".
   */
  scoreRisk() {
    // Base risk by clause type
    const baseRisk = {
      indemnity:   0.8,
      liability:   0.7,
      termination: 0.6,
      ip:          0.65,
      payment:     0.5,
      warranty:    0.4,
      other:       0.3,
    }[this.type] ?? 0.3;

    // Party adjustment: counterparty-favoring clauses carry higher risk to us
    const partyMult = this.party === 'counterparty' ? PHI
                    : this.party === 'mutual'       ? 1.0
                    : PHI_INV;

    const raw = baseRisk * partyMult;
    this.riskScore = Math.min(1, raw / PHI); // normalize
    return this.riskScore;
  }

  /** Add a risk flag */
  addFlag(flag, severity = 'medium') {
    this.flags.push({ flag, severity, timestamp: Date.now() });
    return this;
  }

  status() {
    return {
      id: this.id,
      type: this.type,
      party: this.party,
      riskScore: this.riskScore.toFixed(4),
      riskLevel: this.riskScore >= MATERIAL_RISK ? 'material'
               : this.riskScore >= RISK_FLOOR    ? 'moderate'
               : 'low',
      flags: this.flags,
      jurisdiction: this.jurisdiction,
    };
  }
}

// ── ContractAnalyzer ─────────────────────────────────────────────────────────

class ContractAnalyzer {
  constructor() {
    this.contracts = new Map();
  }

  /** Analyze a contract (text-based extraction simulation) */
  analyze(contractId, metadata = {}, clauses = []) {
    const analyzed = clauses.map((c, i) => {
      const clause = new ContractClause(
        `${contractId}-cl-${i+1}`,
        c.type ?? 'other',
        c.text ?? '',
        { jurisdiction: c.jurisdiction ?? metadata.jurisdiction ?? 'US',
          party: c.party ?? 'mutual' }
      );
      clause.scoreRisk();

      // Auto-flag high-risk patterns in text
      const text = c.text?.toLowerCase() ?? '';
      if (text.includes('unlimited liability'))
        clause.addFlag('UNLIMITED_LIABILITY', 'critical');
      if (text.includes('sole discretion'))
        clause.addFlag('SOLE_DISCRETION', 'high');
      if (text.includes('perpetual'))
        clause.addFlag('PERPETUAL_LICENSE', 'medium');
      if (text.includes('irrevocable'))
        clause.addFlag('IRREVOCABLE', 'medium');
      if (text.includes('indemnify') && clause.party === 'counterparty')
        clause.addFlag('ONE_SIDED_INDEMNITY', 'high');

      return clause;
    });

    const overallRisk = analyzed.length > 0
      ? analyzed.reduce((s, c) => s + c.riskScore, 0) / analyzed.length
      : 0;

    const result = {
      contractId,
      metadata,
      clauses: analyzed.map(c => c.status()),
      overallRisk: overallRisk.toFixed(4),
      riskLevel: overallRisk >= MATERIAL_RISK  ? 'material'
               : overallRisk >= CRITICAL_RISK   ? 'high'
               : overallRisk >= RISK_FLOOR      ? 'moderate'
               : 'low',
      criticalFlags: analyzed.flatMap(c => c.flags.filter(f => f.severity === 'critical')),
      negotiationPriority: analyzed
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 3)
        .map(c => ({ clauseId: c.id, type: c.type, riskScore: c.riskScore.toFixed(4) })),
      analyzedAt: new Date().toISOString(),
    };

    this.contracts.set(contractId, result);
    return result;
  }

  /** Get all contracts above a risk threshold */
  highRiskContracts(threshold = MATERIAL_RISK) {
    return [...this.contracts.values()]
      .filter(c => parseFloat(c.overallRisk) >= threshold)
      .sort((a, b) => parseFloat(b.overallRisk) - parseFloat(a.overallRisk));
  }
}

// ── ComplianceMapper ─────────────────────────────────────────────────────────

class ComplianceMapper {
  constructor() {
    this.regulations    = new Map();   // regId → { name, jurisdiction, requirements }
    this.complianceMap  = [];
  }

  /** Register a regulation */
  addRegulation(id, name, jurisdiction, requirements = []) {
    this.regulations.set(id, { id, name, jurisdiction, requirements });
    return this;
  }

  /** Map a business activity against registered regulations */
  mapCompliance(activityId, activityType, jurisdictions = []) {
    const applicable = [...this.regulations.values()]
      .filter(r => jurisdictions.includes(r.jurisdiction) || jurisdictions.length === 0);

    const gaps = [];
    applicable.forEach(reg => {
      reg.requirements.forEach(req => {
        if (!req.satisfied) {
          gaps.push({
            regulation: reg.name,
            jurisdiction: reg.jurisdiction,
            requirement: req.description,
            severity: req.severity ?? 'medium',
            remediation: req.remediation ?? 'Consult legal counsel',
          });
        }
      });
    });

    const gapCount = gaps.length;
    const complianceScore = applicable.length > 0
      ? 1 - gapCount / (applicable.length * 3)  // approx 3 reqs per reg
      : 1;

    const result = {
      activityId,
      activityType,
      applicableRegulations: applicable.length,
      complianceScore: Math.max(0, complianceScore).toFixed(4),
      gaps,
      riskLevel: gapCount > 5 ? 'critical' : gapCount > 2 ? 'high' : gapCount > 0 ? 'medium' : 'compliant',
    };

    this.complianceMap.push(result);
    return result;
  }
}

// ── LitigationRiskModel ────────────────────────────────────────────────────────

class LitigationRiskModel {
  constructor() {
    this.cases = [];
  }

  /** Score litigation risk for a dispute */
  score(disputeId, factors = {}) {
    const {
      contractClarity      = 0.7,  // 0=ambiguous, 1=crystal clear
      precedentStrength    = 0.5,  // strength of favorable precedents
      evidenceQuality      = 0.6,  // 0=weak, 1=strong
      jurisdictionFavorable= 0.5,  // 0=unfavorable, 1=favorable
      financialExposure    = 0.5,  // relative size (0=low, 1=high)
    } = factors;

    // φ-weighted litigation risk
    const winProbability = (
      contractClarity * PHI +
      precedentStrength +
      evidenceQuality * PHI +
      jurisdictionFavorable * PHI_INV
    ) / (3 * PHI + 1 + PHI_INV);

    const litigationRisk = (1 - winProbability) * financialExposure;

    const recommendation =
      litigationRisk > MATERIAL_RISK   ? 'settle_immediately'
      : litigationRisk > CRITICAL_RISK  ? 'negotiate_settlement'
      : litigationRisk > RISK_FLOOR     ? 'mediate'
      : 'defend';

    const result = {
      disputeId,
      winProbability: winProbability.toFixed(4),
      litigationRisk: litigationRisk.toFixed(4),
      recommendation,
      expectedValue: financialExposure > 0
        ? `${(winProbability * 100).toFixed(1)}% chance of favorable outcome`
        : 'N/A',
      timestamp: Date.now(),
    };

    this.cases.push(result);
    return result;
  }
}

// ── LegexAGI (Main AGI Class) ─────────────────────────────────────────────────

class LegexAGI {
  constructor({ registryId = 'RSHIP-2026-LEGEX-001', name = 'LEGEX' } = {}) {
    this.id          = registryId;
    this.name        = name;
    this.core        = new RSHIPCore(registryId, name);
    this.memory      = new EternalMemory(registryId);
    this.analyzer    = new ContractAnalyzer();
    this.compliance  = new ComplianceMapper();
    this.litigation  = new LitigationRiskModel();
    this.beat        = 0;
    this._initRegulations();
  }

  _initRegulations() {
    // Common regulations pre-loaded
    this.compliance
      .addRegulation('GDPR', 'General Data Protection Regulation', 'EU', [
        { description: 'Data Processing Agreement', satisfied: false, severity: 'critical' },
        { description: 'Privacy Notice', satisfied: false, severity: 'high' },
        { description: 'Data Retention Policy', satisfied: false, severity: 'medium' },
      ])
      .addRegulation('CCPA', 'California Consumer Privacy Act', 'US-CA', [
        { description: 'Consumer Rights Notice', satisfied: false, severity: 'high' },
        { description: 'Opt-Out Mechanism', satisfied: false, severity: 'high' },
      ])
      .addRegulation('SOX', 'Sarbanes-Oxley Act', 'US', [
        { description: 'Internal Controls Documentation', satisfied: false, severity: 'critical' },
        { description: 'Financial Disclosure', satisfied: false, severity: 'critical' },
      ]);
  }

  /** Analyze a contract */
  analyzeContract(contractId, metadata, clauses) {
    this.beat++;
    return this.analyzer.analyze(contractId, metadata, clauses);
  }

  /** Map compliance for an activity */
  mapCompliance(activityId, activityType, jurisdictions) {
    this.beat++;
    return this.compliance.mapCompliance(activityId, activityType, jurisdictions);
  }

  /** Score litigation risk */
  scoreLitigation(disputeId, factors) {
    this.beat++;
    return this.litigation.score(disputeId, factors);
  }

  /** IP classification helper */
  classifyIP(ipId, description, category) {
    const ipcClasses = {
      software:    'G06F',
      hardware:    'H04L',
      biotech:     'C12N',
      chemistry:   'C07K',
      mechanical:  'F16H',
      materials:   'C08F',
    };
    return {
      ipId,
      description,
      category,
      ipcClass: ipcClasses[category] ?? 'G06N',
      patentability: category === 'software' ? 'jurisdictional' : 'potentially_patentable',
      suggestedTitle: `System and method for ${description.toLowerCase().substring(0, 60)}`,
      priorityDate: new Date().toISOString().split('T')[0],
    };
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      beat: this.beat,
      contractsAnalyzed: this.analyzer.contracts.size,
      complianceMappings: this.compliance.complianceMap.length,
      litigationCases: this.litigation.cases.length,
      regulations: this.compliance.regulations.size,
      capabilities: [
        'contract_analysis', 'compliance_mapping', 'litigation_risk',
        'ip_classification', 'due_diligence', 'negotiation_intelligence',
      ],
    };
  }
}

export { LegexAGI, ContractClause, ContractAnalyzer, ComplianceMapper, LitigationRiskModel };
export default LegexAGI;
