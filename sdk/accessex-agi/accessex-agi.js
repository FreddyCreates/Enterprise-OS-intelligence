/**
 * ACCESSEX AGI — Accessibility & ADA Compliance Intelligence
 * RSHIP-2026-ACCESSEX-001
 *
 * Domain: Accessibility & ADA Compliance
 * Latin: accedo — "to approach, to come near, to have access"
 *   accedo (to come near) is the etymological root of "access" — implying the right and
 *   ability to approach. The ADA (1990) and Air Carrier Access Act (1986) mandate equal access;
 *   ACCESSEX makes compliance auditable and continuous. With 26% of US adults living with
 *   disability, accessibility intelligence is both a legal and moral imperative.
 *
 * Theory: ADA Standards for Accessible Design, 14 CFR Part 382, 28 CFR Part 36,
 *   DEI analytics, Queue optimization, PHI-weighted accessibility scoring
 *   (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Accessibility & ADA Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const ADA_CHECKPOINT_CATEGORIES = {
  'Parking & Approach':       { checkpoints: 28, weight: 1.2 },
  'Entrance & Doors':         { checkpoints: 22, weight: 1.3 },
  'Paths of Travel':          { checkpoints: 35, weight: 1.5 },
  'Restrooms':                { checkpoints: 30, weight: 1.4 },
  'Gates & Ticketing':        { checkpoints: 25, weight: 1.3 },
  'Signage & Wayfinding':     { checkpoints: 20, weight: 1.1 },
  'Communication Systems':    { checkpoints: 18, weight: 1.2 },
  'Seating':                  { checkpoints: 22, weight: 1.0 },
  'Assistance Services':      { checkpoints: 40, weight: 1.6 },
};
const TOTAL_CHECKPOINTS = Object.values(ADA_CHECKPOINT_CATEGORIES).reduce((s, c) => s + c.checkpoints, 0);

const CFR_382_REQUIREMENTS = [
  'Pre-boarding assistance', 'Wheelchair/aisle chair availability', 'Stowage of assistive devices',
  'Service animal accommodation', 'In-flight disability information', 'Accessible lavatories',
  'Passenger with disability seating', 'Deplaning assistance',
];

const SLA_TARGETS = {
  wheelchairPreRequested: 15,   // minutes
  wheelchairWalkUp:       30,   // minutes
  accommodationFulfill:   60,   // minutes
};

const DEI_CATEGORIES = ['race_ethnicity', 'gender', 'disability_status', 'veteran_status', 'age_group'];

const INCIDENT_ROOT_CAUSES = ['infrastructure', 'staff_training', 'equipment', 'communication', 'policy', 'other'];

// ── ACCESSEX Core ──
class ACCESSEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-ACCESSEX-001';
    this.domain      = 'Accessibility & ADA Compliance';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: ADA Compliance Gap Scanning ──
  scanADACompliance(facilityData = {}) {
    const categoryResults = {};
    let totalPassedWeighted = 0;
    let totalMaxWeighted    = 0;

    Object.entries(ADA_CHECKPOINT_CATEGORIES).forEach(([cat, meta]) => {
      const passed  = facilityData[cat]?.passed ?? Math.round(meta.checkpoints * 0.75);
      const failed  = meta.checkpoints - passed;
      const score   = meta.checkpoints > 0 ? passed / meta.checkpoints : 0;
      const weighted = score * meta.weight;

      totalPassedWeighted += weighted;
      totalMaxWeighted    += meta.weight;

      // PHI-gap: distance from full compliance × weight × phi
      const gap         = meta.checkpoints - passed;
      const phiGapScore = +(gap * meta.weight * this.phi / TOTAL_CHECKPOINTS).toFixed(4);

      categoryResults[cat] = {
        checkpoints: meta.checkpoints,
        passed,
        failed,
        score: +score.toFixed(4),
        weight: meta.weight,
        weightedScore: +weighted.toFixed(4),
        phiGapScore,
        priority: score < 0.7 ? 'CRITICAL' : score < 0.9 ? 'IMPROVE' : 'COMPLIANT',
        failedCheckpoints: failed,
      };
    });

    const overallScore    = totalMaxWeighted > 0 ? +(totalPassedWeighted / totalMaxWeighted).toFixed(4) : 0;
    const compliancePct   = +(overallScore * 100).toFixed(2);
    const criticalCount   = Object.values(categoryResults).filter(c => c.priority === 'CRITICAL').length;

    // Total remediation items sorted by phi-gap score
    const remediationList = Object.entries(categoryResults)
      .filter(([, v]) => v.failed > 0)
      .map(([cat, v]) => ({ category: cat, failedItems: v.failed, phiGapScore: v.phiGapScore, priority: v.priority }))
      .sort((a, b) => b.phiGapScore - a.phiGapScore);

    this._log('scanADACompliance', { overallScore, criticalCount, totalCheckpoints: TOTAL_CHECKPOINTS });
    return { categoryResults, overallScore, compliancePct, criticalCount, remediationList, totalCheckpoints: TOTAL_CHECKPOINTS };
  }

  // ── Method 2: Wheelchair/Mobility Assist Request Routing ──
  routeAssistanceRequests(requestQueue = [], staffAvailability = []) {
    const now    = Date.now();
    const sorted = [...requestQueue].sort((a, b) => {
      // Priority: pre-requested > walk-up; earlier request time = higher priority
      const priorA = a.type === 'pre_requested' ? 2 : 1;
      const priorB = b.type === 'pre_requested' ? 2 : 1;
      if (priorB !== priorA) return priorB - priorA;
      return new Date(a.requestedAt) - new Date(b.requestedAt);
    });

    const availableStaff = staffAvailability.filter(s => s.available);
    const assignments    = [];
    const unassigned     = [];

    sorted.forEach(req => {
      const slaTarget = req.type === 'pre_requested' ? SLA_TARGETS.wheelchairPreRequested : SLA_TARGETS.wheelchairWalkUp;
      const ageMinutes = (now - new Date(req.requestedAt).getTime()) / 60000;
      const slaBreached = ageMinutes > slaTarget;

      // Find nearest available staff member
      const staffIdx = availableStaff.findIndex(s => !s.assigned && s.zone === req.zone);
      const anyIdx   = staffIdx === -1 ? availableStaff.findIndex(s => !s.assigned) : staffIdx;

      if (anyIdx !== -1) {
        const staff = availableStaff[anyIdx];
        staff.assigned = true;

        // Estimated wait: distance factor / staff speed × phi efficiency
        const distanceFactor = staffIdx === -1 ? 1.5 : 1.0;
        const estimatedWait  = +(distanceFactor * 5 * (slaBreached ? this.phi : 1)).toFixed(2);

        assignments.push({
          requestId:   req.requestId,
          passengerId: req.passengerId,
          staffId:     staff.staffId,
          zone:        req.zone,
          slaTarget,
          ageMinutes:  +ageMinutes.toFixed(2),
          slaBreached,
          estimatedWaitMinutes: estimatedWait,
          priority: req.type === 'pre_requested' ? 'HIGH' : 'STANDARD',
        });
      } else {
        unassigned.push({ requestId: req.requestId, ageMinutes: +ageMinutes.toFixed(2), slaBreached });
      }
    });

    const breachedCount = assignments.filter(a => a.slaBreached).length;
    this._log('routeAssistanceRequests', { totalRequests: requestQueue.length, assigned: assignments.length, unassigned: unassigned.length, breachedCount });
    return { assignments, unassigned, summary: { total: requestQueue.length, assigned: assignments.length, unassigned: unassigned.length, slaBreached: breachedCount } };
  }

  // ── Method 3: Accessibility Incident Tracking ──
  trackIncidents(incidentLog = []) {
    const rootCauseCounts = Object.fromEntries(INCIDENT_ROOT_CAUSES.map(c => [c, 0]));
    const monthlyTrend    = {};

    incidentLog.forEach(inc => {
      const rc = inc.rootCause || 'other';
      if (rootCauseCounts[rc] !== undefined) rootCauseCounts[rc]++;
      else rootCauseCounts['other']++;

      const monthKey = inc.date ? inc.date.substring(0, 7) : 'unknown';
      if (!monthlyTrend[monthKey]) monthlyTrend[monthKey] = 0;
      monthlyTrend[monthKey]++;
    });

    // Pareto: which root causes account for 80% of incidents?
    const sortedCauses = Object.entries(rootCauseCounts)
      .sort(([, a], [, b]) => b - a);
    const total    = incidentLog.length;
    let cumPct     = 0;
    const pareto   = [];
    sortedCauses.forEach(([cause, count]) => {
      cumPct += total > 0 ? count / total * 100 : 0;
      pareto.push({ cause, count, cumulativePct: +cumPct.toFixed(2), inPareto80: cumPct <= 80 });
    });

    // PHI-severity index: weight systemic causes more heavily
    const systemicWeight   = { infrastructure: this.phi, staff_training: this.phi, equipment: 1.2, communication: 1.1, policy: 1.0, other: 0.8 };
    const phiSeverityScore = +(Object.entries(rootCauseCounts).reduce((s, [c, count]) => s + count * (systemicWeight[c] || 1), 0) / Math.max(total, 1)).toFixed(4);

    // Trend: recent 3 months vs prior 3 months
    const months     = Object.keys(monthlyTrend).sort();
    const recent3    = months.slice(-3).reduce((s, m) => s + monthlyTrend[m], 0);
    const prior3     = months.slice(-6, -3).reduce((s, m) => s + monthlyTrend[m], 0);
    const trendDir   = prior3 > 0 ? (recent3 - prior3) / prior3 : 0;

    this._log('trackIncidents', { total, topCause: sortedCauses[0]?.[0] });
    return {
      totalIncidents: total,
      rootCauseCounts,
      paretoAnalysis: pareto,
      monthlyTrend,
      phiSeverityScore,
      trend: trendDir > 0.1 ? 'worsening' : trendDir < -0.1 ? 'improving' : 'stable',
      trendPct: +(trendDir * 100).toFixed(2),
    };
  }

  // ── Method 4: DEI Reporting ──
  reportDEI(workforceData = {}, regionalDemographics = {}) {
    const gapReport = {};
    let totalGapScore = 0;

    DEI_CATEGORIES.forEach(cat => {
      const workforce  = workforceData[cat]  || {};
      const regional   = regionalDemographics[cat] || {};
      const groups     = new Set([...Object.keys(workforce), ...Object.keys(regional)]);
      const catGaps    = {};

      groups.forEach(group => {
        const wfPct  = workforce[group]  || 0;
        const regPct = regional[group]   || 0;
        const gap    = +(wfPct - regPct).toFixed(4);
        const absGap = Math.abs(gap);

        // PHI-gap: representation gap scaled by phi for under-representation
        const phiGap = gap < 0 ? +(absGap * this.phi).toFixed(4) : +(absGap * this.phiInv).toFixed(4);
        catGaps[group] = { workforcePct: wfPct, regionalPct: regPct, gap, phiGap, underrepresented: gap < -0.02 };
        totalGapScore += phiGap;
      });

      gapReport[cat] = catGaps;
    });

    const overallRepresentationScore = +(1 / (1 + totalGapScore / DEI_CATEGORIES.length)).toFixed(4);

    this._log('reportDEI', { categories: DEI_CATEGORIES.length, overallScore: overallRepresentationScore });
    return {
      gapReport,
      overallRepresentationScore,
      scoreInterpretation: overallRepresentationScore > 0.8 ? 'Strong Representation' : overallRepresentationScore > 0.6 ? 'Moderate Gaps' : 'Significant Underrepresentation',
      underrepresentedGroups: Object.entries(gapReport).flatMap(([cat, groups]) =>
        Object.entries(groups).filter(([, v]) => v.underrepresented).map(([g]) => `${cat}:${g}`)
      ),
    };
  }

  // ── Method 5: Accommodation SLA Monitoring ──
  monitorAccommodationSLAs(requestPipeline = []) {
    const now = Date.now();
    const results = requestPipeline.map(req => {
      const openedAt     = new Date(req.openedAt).getTime();
      const ageMinutes   = (now - openedAt) / 60000;
      const slaTarget    = SLA_TARGETS.accommodationFulfill;
      const resolved     = !!req.resolvedAt;
      const resolvedAt   = resolved ? new Date(req.resolvedAt).getTime() : null;
      const resolutionMinutes = resolved ? (resolvedAt - openedAt) / 60000 : null;

      const slaBreached    = !resolved && ageMinutes > slaTarget;
      const onTimeFulfill  = resolved && resolutionMinutes <= slaTarget;

      // PHI-escalation urgency: breach age compounds by phi
      const overageMinutes = slaBreached ? ageMinutes - slaTarget : 0;
      const phiEscalation  = slaBreached ? +(Math.pow(this.phi, overageMinutes / slaTarget) - 1).toFixed(4) : 0;

      return {
        requestId:         req.requestId,
        requestType:       req.type,
        ageMinutes:        +ageMinutes.toFixed(2),
        slaTarget,
        resolved,
        resolutionMinutes: resolutionMinutes !== null ? +resolutionMinutes.toFixed(2) : null,
        slaBreached,
        onTimeFulfill,
        phiEscalation,
        status: resolved ? (onTimeFulfill ? 'CLOSED-ON-TIME' : 'CLOSED-LATE') : slaBreached ? 'ESCALATE' : 'IN-PROGRESS',
      };
    });

    const breachedCount  = results.filter(r => r.slaBreached).length;
    const onTimeCount    = results.filter(r => r.onTimeFulfill).length;
    const closedCount    = results.filter(r => r.resolved).length;
    const slaCompliancePct = closedCount > 0 ? +(onTimeCount / closedCount * 100).toFixed(2) : null;

    this._log('monitorAccommodationSLAs', { totalRequests: requestPipeline.length, breachedCount, slaCompliancePct });
    return {
      requests: results,
      summary: { total: requestPipeline.length, open: requestPipeline.length - closedCount, closed: closedCount, breached: breachedCount, slaCompliancePct },
      escalationQueue: results.filter(r => r.status === 'ESCALATE').sort((a, b) => b.phiEscalation - a.phiEscalation),
    };
  }

  // ── Utility: Staff Training Gap Analysis ──
  analyzeTrainingGaps(staffRecords = [], requiredCertifications = []) {
    const results = staffRecords.map(staff => {
      const held     = new Set(staff.certifications || []);
      const missing  = requiredCertifications.filter(cert => !held.has(cert));
      const gapRatio = requiredCertifications.length > 0 ? missing.length / requiredCertifications.length : 0;
      // PHI-compliance: below 1/phi gap ratio = adequately trained
      const phiCompliant = gapRatio < this.phiInv;
      const trainingScore = +(1 - gapRatio * this.phi).toFixed(4);

      return {
        staffId:       staff.staffId,
        name:          staff.name,
        missingCerts:  missing,
        gapRatio:      +gapRatio.toFixed(4),
        phiCompliant,
        trainingScore: Math.max(trainingScore, 0),
        priority:      gapRatio > 0.5 ? 'URGENT' : gapRatio > 0 ? 'SCHEDULE' : 'COMPLIANT',
      };
    });

    const avgGap = results.reduce((s, r) => s + r.gapRatio, 0) / (results.length || 1);
    return { staff: results, averageGapRatio: +avgGap.toFixed(4), urgentCount: results.filter(r => r.priority === 'URGENT').length };
  }

  // ── Utility: Accessibility Investment ROI ──
  accessibilityROI(remediationCost, penaltyRiskAvoided, patronageImpact, years = 5) {
    // ADA violations can result in $75K-$150K civil penalties first offense
    const totalBenefit = penaltyRiskAvoided + patronageImpact * years;
    const netBenefit   = totalBenefit - remediationCost;
    const roi          = remediationCost > 0 ? netBenefit / remediationCost : 0;

    // PHI-value: ROI × phi if positive
    const phiROI = roi > 0 ? +(roi * this.phi).toFixed(4) : +(roi * this.phiInv).toFixed(4);

    return {
      remediationCost, penaltyRiskAvoided, patronageImpact, years,
      totalBenefit: +totalBenefit.toFixed(2),
      netBenefit:   +netBenefit.toFixed(2),
      roi:          +roi.toFixed(4),
      roiPct:       +(roi * 100).toFixed(2),
      phiROI,
      decision:     roi >= 1 ? 'HIGH-VALUE' : roi > 0 ? 'POSITIVE' : 'COST-ONLY-COMPLIANCE',
    };
  }

  _log(method, meta = {}) {
    this.memoryLog.push({ ts: new Date().toISOString(), method, ...meta });
  }

  // ── Intelligence Report ──
  intelligenceReport() {
    return {
      designation: this.designation,
      domain:      this.domain,
      phi:         this.phi,
      capabilities: [
        'ADA Compliance Gap Scanning (240-checkpoint)',
        'Wheelchair/Mobility Assist Request Routing',
        'Accessibility Incident Tracking & Root-Cause Analysis',
        'DEI Reporting (Workforce vs Regional Demographics)',
        'Accommodation SLA Monitoring & Escalation',
      ],
      totalCheckpoints: TOTAL_CHECKPOINTS,
      slaTargets:       SLA_TARGETS,
      deiCategories:    DEI_CATEGORIES,
      cfr382Requirements: CFR_382_REQUIREMENTS,
      memoryLog:        this.memoryLog,
      createdAt:        this.createdAt,
      framework:        'RSHIP',
    };
  }
}

export function birthACCESSEX(config = {}) { return new ACCESSEX(config); }
export { ACCESSEX };
export default ACCESSEX;
