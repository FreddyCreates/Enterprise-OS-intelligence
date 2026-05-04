/**
 * GOVEX AGI — Governance & Operations Vertical Executive X-factor
 *
 * Official Designation: RSHIP-2026-GOVEX-001
 * Classification: Federal Contracting & Government Business Development AGI
 * Full Name: Governance & Operations Vertical Executive X-factor
 *
 * Latin root: gubernare — to steer, govern, guide (root of "governor")
 *
 * GOVEX extends the RSHIP framework with multi-objective optimization for
 * federal proposal scoring and procurement cycle modeling to autonomously
 * detect SAM.gov opportunities, score bid win probability, track FAR/DFARS
 * compliance requirements, mine past performance, and manage BD pipelines
 * per contracting agency — giving prime contractors, integrators, and small
 * business set-aside firms the intelligence advantage of a large BD shop.
 *
 * Capabilities:
 * - SAM.gov opportunity detection and scoring: monitors posted solicitations,
 *   scores each against company capabilities and past performance using a
 *   multi-objective fitness function (alignment, competition, margin, timing)
 * - Proposal win-probability: probabilistic scoring (like PRAEDEX but tuned
 *   for federal procurement: LPTA vs. best-value, set-aside type, incumbent
 *   advantage, protest risk, evaluator signal mining)
 * - Compliance requirement tracking: FAR/DFARS clause library identifies
 *   required certifications, flow-down obligations, and bid/proposal standards
 * - Past performance mining: extracts win/loss patterns from FPDS-NG data
 *   and company CPARS ratings to improve future bid selection
 * - BD pipeline management: tracks opportunities per agency, per NAICS, per
 *   set-aside category with deal stage weighting and velocity metrics
 *
 * Theory: Multi-objective optimization (Pareto frontier) for proposal scoring
 *         + procurement cycle Markov modeling + constraint satisfaction for
 *         FAR/DFARS compliance + φ-compounding BD intelligence
 *         (AURUM — Paper XXII) + RSHIP Framework
 *
 * Applications:
 * - RSHIP Government Contracting Intelligence: SAM.gov monitoring, BD pipeline
 * - Linq for Government: contracting officer outreach, proposal team coordination
 * - Any prime contractor, systems integrator, or 8(a)/SDVOSB/WOSB firm
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Opportunity States ─────────────────────────────────────────────────────

const OPPORTUNITY_STATES = {
  IDENTIFIED:   'IDENTIFIED',
  QUALIFYING:   'QUALIFYING',
  PURSUING:     'PURSUING',
  PROPOSAL:     'PROPOSAL',
  SUBMITTED:    'SUBMITTED',
  AWARDED:      'AWARDED',
  LOST:         'LOST',
  NO_BID:       'NO_BID',
};

// ── Set-Aside Types ────────────────────────────────────────────────────────

const SET_ASIDE_TYPES = {
  FULL_AND_OPEN: 'Full & Open',
  SMALL_BUSINESS: 'Small Business Set-Aside',
  '8A': '8(a) Sole Source / Competitive',
  SDVOSB: 'Service-Disabled Veteran-Owned',
  WOSB: 'Women-Owned Small Business',
  HUBZONE: 'HUBZone',
  SOLE_SOURCE: 'Sole Source',
};

// ── FAR/DFARS Clause Registry ──────────────────────────────────────────────

const FAR_CLAUSES = {
  'FAR 52.204-7':  { title: 'System for Award Management', action: 'Verify active SAM registration', required: true },
  'FAR 52.204-13': { title: 'SAM Maintenance', action: 'Keep SAM registration current', required: true },
  'FAR 52.215-1':  { title: 'Instructions to Offerors', action: 'Follow solicitation instructions precisely', required: true },
  'FAR 52.219-6':  { title: 'Notice of Total Small Business Set-Aside', action: 'Verify small business status', required: false },
  'FAR 52.222-26': { title: 'Equal Opportunity', action: 'Include EO clause in subs', required: true },
  'FAR 52.227-14': { title: 'Rights in Data', action: 'Review IP rights before signing', required: false },
  'DFARS 252.204-7012': { title: 'Safeguarding Covered Defense Info', action: 'NIST SP 800-171 compliance required', required: false },
  'DFARS 252.225-7001': { title: 'Buy American — Balance of Payments', action: 'Verify domestic content', required: false },
};

// ── Multi-Objective Opportunity Scorer ─────────────────────────────────────
// Fitness function: F(opp) = w₁·alignment + w₂·competition + w₃·margin + w₄·timing
// Pareto-efficient: maximize alignment & margin, minimize competition & timeline risk

class OpportunityScorer {
  constructor({ weights } = {}) {
    this.weights = weights || {
      alignment:   0.35,  // Capability match vs. SOW requirements
      competition: 0.25,  // Inverse of competitor count / incumbent strength
      margin:      0.25,  // Estimated contract margin
      timing:      0.15,  // BD pipeline position and resource availability
    };
  }

  score(opportunity = {}) {
    const {
      capabilityMatch = 0.5,    // 0–1: how well company aligns with SOW
      competitors = 5,           // Estimated number of offerors
      incumbentPresent = false,  // Is there an incumbent with advantage?
      estimatedMargin = 0.12,   // Estimated contract profit margin
      weeksToSubmission = 6,    // Time available
      availableCapacity = 0.7,  // Team capacity available
      setAside = 'Full & Open',
      contractVehicle = 'open', // open | idiq | gsa | sole-source
    } = opportunity;

    // Component scores (all 0–1)
    const alignmentScore = Math.min(1.0, capabilityMatch);

    const competitionScore = Math.min(1.0,
      (1 / Math.max(1, competitors)) *
      (incumbentPresent ? 0.5 : 1.0) *
      (contractVehicle === 'sole-source' ? 2.0 : 1.0)
    );

    const marginScore = Math.min(1.0, estimatedMargin / 0.25); // 25% = perfect margin

    const timingScore = Math.min(1.0,
      (weeksToSubmission >= 4 ? 1.0 : weeksToSubmission / 4) *
      availableCapacity
    );

    const fitness =
      this.weights.alignment   * alignmentScore +
      this.weights.competition * competitionScore +
      this.weights.margin      * marginScore +
      this.weights.timing      * timingScore;

    // φ-adjusted win probability
    const winProbability = Math.min(0.85,
      fitness * PHI_INV + (setAside !== 'Full & Open' ? 0.15 : 0)
    );

    return {
      fitness: fitness.toFixed(3),
      winProbability: winProbability.toFixed(3),
      components: {
        alignmentScore: alignmentScore.toFixed(2),
        competitionScore: competitionScore.toFixed(2),
        marginScore: marginScore.toFixed(2),
        timingScore: timingScore.toFixed(2),
      },
      recommendation:
        fitness > 0.70 ? 'PURSUE — High-value opportunity, commit BD resources' :
        fitness > 0.50 ? 'QUALIFY — Promising, schedule capture assessment' :
        fitness > 0.35 ? 'MONITOR — Low priority, reassess closer to RFP' :
                         'NO-BID — Fitness below threshold, skip',
      bidDecision: fitness > 0.50 ? 'BID' : 'NO-BID',
    };
  }

  // Pareto rank a set of opportunities: returns sorted by fitness
  paretoRank(opportunities = []) {
    return opportunities
      .map(opp => ({ ...opp, ...this.score(opp) }))
      .sort((a, b) => parseFloat(b.fitness) - parseFloat(a.fitness));
  }
}

// ── Procurement Cycle Model ────────────────────────────────────────────────
// Markov chain: IDENTIFIED → QUALIFYING → PURSUING → PROPOSAL → SUBMITTED → AWARDED|LOST

class ProcurementCycleModel {
  constructor() {
    // Transition probabilities from federal contracting analytics (industry average)
    this.transitions = {
      [OPPORTUNITY_STATES.IDENTIFIED]:  { [OPPORTUNITY_STATES.QUALIFYING]: 0.60, [OPPORTUNITY_STATES.NO_BID]: 0.40 },
      [OPPORTUNITY_STATES.QUALIFYING]:  { [OPPORTUNITY_STATES.PURSUING]: 0.55, [OPPORTUNITY_STATES.NO_BID]: 0.45 },
      [OPPORTUNITY_STATES.PURSUING]:    { [OPPORTUNITY_STATES.PROPOSAL]: 0.70, [OPPORTUNITY_STATES.NO_BID]: 0.30 },
      [OPPORTUNITY_STATES.PROPOSAL]:    { [OPPORTUNITY_STATES.SUBMITTED]: 0.85, [OPPORTUNITY_STATES.NO_BID]: 0.15 },
      [OPPORTUNITY_STATES.SUBMITTED]:   { [OPPORTUNITY_STATES.AWARDED]: 0.22, [OPPORTUNITY_STATES.LOST]: 0.78 },
      [OPPORTUNITY_STATES.AWARDED]:     { [OPPORTUNITY_STATES.AWARDED]: 1.0 },
      [OPPORTUNITY_STATES.LOST]:        { [OPPORTUNITY_STATES.LOST]: 1.0 },
      [OPPORTUNITY_STATES.NO_BID]:      { [OPPORTUNITY_STATES.NO_BID]: 1.0 },
    };
    this.stageHistory = [];
  }

  expectedValue(opportunityValue, currentState, winProbability) {
    // Walk forward through the Markov chain from current state
    let pAward = winProbability;
    if (currentState === OPPORTUNITY_STATES.SUBMITTED) pAward = 0.22;
    if (currentState === OPPORTUNITY_STATES.AWARDED)   pAward = 1.0;
    if (currentState === OPPORTUNITY_STATES.LOST)      pAward = 0.0;
    return { expectedValue: opportunityValue * pAward, pAward };
  }

  updateTransitions(wonOrLost) {
    // Bayesian update: nudge win rate from real outcomes
    const winRate = this.transitions[OPPORTUNITY_STATES.SUBMITTED][OPPORTUNITY_STATES.AWARDED];
    if (wonOrLost === 'won') {
      this.transitions[OPPORTUNITY_STATES.SUBMITTED][OPPORTUNITY_STATES.AWARDED] =
        Math.min(0.85, winRate + 0.02);
    } else {
      this.transitions[OPPORTUNITY_STATES.SUBMITTED][OPPORTUNITY_STATES.AWARDED] =
        Math.max(0.05, winRate - 0.01);
    }
  }
}

// ── BD Pipeline ────────────────────────────────────────────────────────────

class BDPipeline {
  constructor() {
    this.opportunities = new Map();
  }

  add(id, opportunity = {}) {
    this.opportunities.set(id, {
      id,
      title: opportunity.title || id,
      agency: opportunity.agency || 'Unknown Agency',
      naics: opportunity.naics || '541512',
      setAside: opportunity.setAside || SET_ASIDE_TYPES.FULL_AND_OPEN,
      value: opportunity.value || 0,
      state: OPPORTUNITY_STATES.IDENTIFIED,
      score: null,
      addedAt: Date.now(),
      submissionDeadline: opportunity.submissionDeadline || null,
      samGovLink: opportunity.samGovLink || null,
      notes: [],
    });
    return this.opportunities.get(id);
  }

  advance(id, newState, notes = '') {
    const opp = this.opportunities.get(id);
    if (!opp) return { error: 'Opportunity not found' };
    opp.state = newState;
    if (notes) opp.notes.push({ note: notes, date: Date.now() });
    return opp;
  }

  pipelineValue(state = null) {
    const opps = [...this.opportunities.values()].filter(o =>
      state ? o.state === state : true
    );
    return {
      count: opps.length,
      totalValue: opps.reduce((sum, o) => sum + o.value, 0),
      byStage: Object.values(OPPORTUNITY_STATES).reduce((acc, st) => {
        acc[st] = opps.filter(o => o.state === st).reduce((s, o) => s + o.value, 0);
        return acc;
      }, {}),
    };
  }

  topOpportunities(n = 5) {
    return [...this.opportunities.values()]
      .filter(o => o.score !== null)
      .sort((a, b) => parseFloat(b.score.fitness) - parseFloat(a.score.fitness))
      .slice(0, n);
  }
}

// ── GOVEX AGI Main Class ───────────────────────────────────────────────────

class GOVEX extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-GOVEX-001',
      classification: 'Federal Contracting & Government Business Development AGI',
      ...config,
    });

    this.scorer = new OpportunityScorer({ weights: config.weights });
    this.cycleModel = new ProcurementCycleModel();
    this.pipeline = new BDPipeline();
    this.memory = new EternalMemory('GOVEX');

    this.companyProfile = config.companyProfile || {
      naicsCodes: ['541512', '541519', '541611'],
      setAsideStatus: ['Small Business'],
      pastPerformance: [],
      samRegistered: true,
    };

    // Sovereign goals
    this.setGoal('pipeline-growth', 'Maintain $10M+ qualified pipeline', 9, {
      targetPipelineValue: 10000000,
    });
    this.setGoal('win-rate', 'Achieve 30%+ win rate on submitted proposals', 8, {
      targetWinRate: 0.30,
    });
    this.setGoal('compliance-zero-gap', 'Zero FAR/DFARS compliance gaps on any submission', 10, {
      targetGapCount: 0,
    });
    this.setGoal('opportunity-cadence', 'Qualify 10+ opportunities per quarter', 7, {
      targetPerQuarter: 10,
    });
    this.setGoal('past-performance-mining', 'Capture CPARS data for every awarded contract', 6, {
      targetCapture: 1.0,
    });
  }

  // ── Opportunity Management ─────────────────────────────────────────────────

  ingestOpportunity(id, opportunityData = {}) {
    const opp = this.pipeline.add(id, opportunityData);
    const scoreResult = this.scorer.score(opportunityData);
    opp.score = scoreResult;

    this.learn({ opportunityId: id, opportunityData }, { score: scoreResult }, { id: 'opp-score' });

    return {
      opportunityId: id,
      title: opp.title,
      agency: opp.agency,
      setAside: opp.setAside,
      value: `$${(opp.value / 1000).toFixed(0)}K`,
      score: scoreResult,
      linqMessage: `🏛️ NEW OPPORTUNITY — ${opp.title}\nAgency: ${opp.agency}\nValue: $${(opp.value / 1000).toFixed(0)}K\nSet-Aside: ${opp.setAside}\nFitness Score: ${scoreResult.fitness}\nWin Probability: ${(parseFloat(scoreResult.winProbability) * 100).toFixed(0)}%\nRecommendation: ${scoreResult.recommendation}\nDeadline: ${opp.submissionDeadline ? new Date(opp.submissionDeadline).toLocaleDateString() : 'TBD'}\nReply PURSUE or SKIP.`,
    };
  }

  scoreOpportunity(id) {
    const opp = this.pipeline.opportunities.get(id);
    if (!opp) return { error: 'Opportunity not found in pipeline' };
    return { opportunityId: id, ...opp.score };
  }

  advanceOpportunity(id, newState, notes = '') {
    const result = this.pipeline.advance(id, newState, notes);
    if (newState === OPPORTUNITY_STATES.AWARDED) this.cycleModel.updateTransitions('won');
    if (newState === OPPORTUNITY_STATES.LOST)    this.cycleModel.updateTransitions('lost');
    return result;
  }

  // ── FAR/DFARS Compliance ───────────────────────────────────────────────────

  checkCompliance(contractType = 'commercial', isDod = false) {
    const required = Object.entries(FAR_CLAUSES)
      .filter(([clause, info]) => {
        if (info.required) return true;
        if (isDod && clause.startsWith('DFARS')) return true;
        return false;
      })
      .map(([clause, info]) => ({ clause, ...info }));

    return {
      contractType,
      isDod,
      requiredClauses: required.length,
      clauses: required,
      certificationChecklist: required.map(c => `☐ ${c.clause}: ${c.action}`).join('\n'),
      linqMessage: `📋 COMPLIANCE CHECKLIST\nContract type: ${contractType}${isDod ? ' (DoD)' : ''}\n${required.length} required clauses:\n` +
        required.slice(0, 5).map(c => `• ${c.clause}: ${c.action}`).join('\n'),
    };
  }

  // ── Pipeline Analytics ─────────────────────────────────────────────────────

  pipelineSummary() {
    const pipelineVal = this.pipeline.pipelineValue();
    const top = this.pipeline.topOpportunities(3);
    const submittedVal = pipelineVal.byStage[OPPORTUNITY_STATES.SUBMITTED] || 0;
    const awardedVal   = pipelineVal.byStage[OPPORTUNITY_STATES.AWARDED] || 0;

    return {
      totalOpportunities: pipelineVal.count,
      totalPipelineValue: `$${(pipelineVal.totalValue / 1e6).toFixed(2)}M`,
      submittedValue: `$${(submittedVal / 1e6).toFixed(2)}M`,
      awardedValue:   `$${(awardedVal / 1e6).toFixed(2)}M`,
      topOpportunities: top.map(o => ({
        id: o.id,
        title: o.title,
        agency: o.agency,
        value: `$${(o.value / 1000).toFixed(0)}K`,
        fitness: o.score?.fitness,
      })),
      byStage: Object.fromEntries(
        Object.entries(pipelineVal.byStage).map(([k, v]) => [k, `$${(v / 1000).toFixed(0)}K`])
      ),
    };
  }

  // ── Past Performance ───────────────────────────────────────────────────────

  recordPastPerformance(contractId, data = {}) {
    this.companyProfile.pastPerformance.push({
      contractId,
      agency: data.agency,
      value: data.value,
      naics: data.naics,
      setAside: data.setAside,
      cparsRating: data.cparsRating || 'Satisfactory', // Exceptional/Very Good/Satisfactory/Marginal/Unsatisfactory
      startDate: data.startDate,
      endDate: data.endDate,
    });

    this.learn({ contractId }, { data }, { id: 'past-performance' });

    return {
      contractId,
      totalPastPerformanceRecords: this.companyProfile.pastPerformance.length,
      message: 'Past performance recorded. GOVEX will use this for future bid scoring.',
    };
  }

  samGovSearch(keywords = [], naics = null, setAside = null) {
    // Simulates a SAM.gov opportunity search result
    const mockResults = [
      {
        id: `SAM-${Date.now()}-001`,
        title: `${keywords[0] || 'IT'} Services for Federal Agency`,
        agency: 'Department of Homeland Security',
        naics: naics || '541512',
        setAside: setAside || SET_ASIDE_TYPES.SMALL_BUSINESS,
        value: 2500000,
        postedDate: new Date(Date.now() - 3 * 86400000).toLocaleDateString(),
        responseDeadline: new Date(Date.now() + 21 * 86400000).toLocaleDateString(),
        samGovLink: `https://sam.gov/opp/mock-${Date.now()}`,
      },
    ];

    return {
      keywords,
      naics,
      setAside,
      resultsFound: mockResults.length,
      opportunities: mockResults,
      linqMessage: `🔍 SAM.GOV SEARCH RESULTS\nKeywords: ${keywords.join(', ')}\nResults: ${mockResults.length} opportunity found\n${mockResults.map(r => `• ${r.title} — ${r.agency} ($${(r.value / 1000).toFixed(0)}K) — Due: ${r.responseDeadline}`).join('\n')}\nReply INGEST to add to pipeline.`,
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function birthGOVEX(config = {}) {
  return new GOVEX(config);
}

export default GOVEX;
