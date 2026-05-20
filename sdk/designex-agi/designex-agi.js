/**
 * DESIGNEX AGI — Commercial Interior Design Intelligence
 * RSHIP-2026-DESIGNEX-001
 *
 * Domain: Commercial Interior Design
 * Latin: designare — "to mark out, to plan, to design"
 *   designare (to mark out) is the root of "design" — implying intentional spatial planning.
 *   In commercial interiors, every square foot carries financial weight; DESIGNEX optimizes
 *   the interplay of aesthetics and ROI. Firms like Gensler, HOK, and Perkins&Will operate
 *   at the intersection of art and capital efficiency.
 *
 * Theory: BIM/IFC standard, LEED v4.1 / WELL v2.0 scoring, NPS methodology,
 *   PHI-weighted satisfaction decay (AURUM — Paper XXII), RSHIP Framework
 *
 * © 2026 RSHIP Intelligence. All rights reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Commercial Interior Design Constants ──
const PHI_LOCAL     = 1.618033988749895;
const PHI_INV_LOCAL = 1 / PHI_LOCAL;

const LEED_V41_CATEGORIES = {
  'Location & Transportation': { max: 16 },
  'Sustainable Sites':         { max: 10 },
  'Water Efficiency':          { max: 11 },
  'Energy & Atmosphere':       { max: 33 },
  'Materials & Resources':     { max: 13 },
  'Indoor Environmental Quality': { max: 16 },
  'Innovation':                { max: 6  },
  'Regional Priority':         { max: 4  },
};
const LEED_TOTAL_MAX = Object.values(LEED_V41_CATEGORIES).reduce((s, c) => s + c.max, 0); // 109

const LEED_THRESHOLDS = { certified: 40, silver: 50, gold: 60, platinum: 80 };

const WELL_V2_CONCEPTS = [
  'Air', 'Water', 'Nourishment', 'Light', 'Movement',
  'Thermal', 'Sound', 'Materials', 'Mind', 'Community',
];

const FFE_DEPRECIATION = {
  furniture:  { years: 7,  method: 'straight-line' },
  fixtures:   { years: 15, method: 'straight-line' },
  equipment:  { years: 5,  method: 'straight-line' },
};

const MATERIAL_SUSTAINABILITY_SCORES = {
  'recycled-content':   0.9,
  'fsc-certified-wood': 0.85,
  'low-voc-paint':      0.8,
  'bamboo':             0.88,
  'standard-carpet':    0.4,
  'vinyl-tile':         0.35,
  'steel':              0.6,
  'concrete':           0.5,
};

// ── DESIGNEX Core ──
class DESIGNEX {
  constructor(config = {}) {
    this.designation = 'RSHIP-2026-DESIGNEX-001';
    this.domain      = 'Commercial Interior Design';
    this.phi         = PHI_LOCAL;
    this.phiInv      = PHI_INV_LOCAL;
    this.config      = config;
    this.createdAt   = new Date().toISOString();
    this.memoryLog   = [];
  }

  // ── Method 1: Space Planning Optimization ──
  optimizeSpacePlanning(ifcData = []) {
    // ifcData: array of { spaceId, name, grossArea, netUsableArea, occupancyHours, assignedFunction }
    const spaces = ifcData.map(space => {
      const utilizationRatio = space.grossArea > 0 ? space.netUsableArea / space.grossArea : 0;
      const occupancyFactor  = Math.min(space.occupancyHours / 8, 1);
      const efficiencyScore  = +(utilizationRatio * occupancyFactor).toFixed(4);

      // PHI threshold: spaces scoring below 1/phi² (~0.382) are dead zones
      const deadZoneThreshold = Math.pow(this.phiInv, 2);
      const isDeadZone         = efficiencyScore < deadZoneThreshold;

      // Space value index: efficiency × phiInv scalar normalises to golden ratio scale
      const spaceValueIndex = +(efficiencyScore * this.phi).toFixed(4);

      return {
        spaceId:         space.spaceId,
        name:            space.name,
        grossArea:       space.grossArea,
        netUsableArea:   space.netUsableArea,
        utilizationRatio: +utilizationRatio.toFixed(4),
        occupancyFactor:  +occupancyFactor.toFixed(4),
        efficiencyScore,
        spaceValueIndex,
        isDeadZone,
        assignedFunction: space.assignedFunction,
        recommendation:   isDeadZone
          ? 'Consider reprogramming: circulation, storage, or densification'
          : efficiencyScore > 0.8 ? 'Optimal — candidate for expansion'
          : 'Within acceptable efficiency range',
      };
    });

    const totalGross    = spaces.reduce((s, sp) => s + sp.grossArea, 0);
    const totalUsable   = spaces.reduce((s, sp) => s + sp.netUsableArea, 0);
    const deadZoneCount = spaces.filter(sp => sp.isDeadZone).length;
    const overallEff    = totalGross > 0 ? +(totalUsable / totalGross).toFixed(4) : 0;

    this._log('optimizeSpacePlanning', { spaceCount: ifcData.length, deadZoneCount, overallEfficiency: overallEff });
    return { spaces, summary: { totalGross, totalUsable, overallEfficiency: overallEff, deadZoneCount } };
  }

  // ── Method 2: FF&E Budget Tracking with ROI Scoring ──
  trackFFEBudget(ffeData = []) {
    const results = ffeData.map(item => {
      const { itemId, name, category, budget, actual, purchaseYear, clientSatisfactionImpact } = item;
      const depSchedule = FFE_DEPRECIATION[category] || FFE_DEPRECIATION['furniture'];
      const depRate     = 1 / depSchedule.years;
      const age         = new Date().getFullYear() - (purchaseYear || new Date().getFullYear());

      // Straight-line book value
      const bookValue   = Math.max(actual * (1 - depRate * age), 0);

      // ROI score: client satisfaction impact / lifecycle cost ratio × phi normalisation
      const lifecycleCost = actual + (actual * 0.05 * depSchedule.years); // 5%/yr maintenance
      const roiScore      = lifecycleCost > 0
        ? +((clientSatisfactionImpact || 0.5) * this.phi / lifecycleCost * 10000).toFixed(4)
        : 0;

      const variance    = actual - budget;
      const variancePct = budget > 0 ? (variance / budget) * 100 : 0;

      return {
        itemId,
        name,
        category,
        budget,
        actual,
        variance: +variance.toFixed(2),
        variancePct: +variancePct.toFixed(2),
        bookValue: +bookValue.toFixed(2),
        depScheduleYears: depSchedule.years,
        lifecycleCost: +lifecycleCost.toFixed(2),
        roiScore,
        overBudget: variance > 0,
      };
    });

    const totalBudget = results.reduce((s, r) => s + r.budget, 0);
    const totalActual = results.reduce((s, r) => s + r.actual, 0);
    const avgROI      = results.length > 0
      ? +(results.reduce((s, r) => s + r.roiScore, 0) / results.length).toFixed(4)
      : 0;

    this._log('trackFFEBudget', { itemCount: ffeData.length, totalBudget, totalActual });
    return { results, summary: { totalBudget, totalActual, totalVariance: +(totalActual - totalBudget).toFixed(2), averageROIScore: avgROI } };
  }

  // ── Method 3: LEED/WELL Certification Tracking ──
  trackCertification(projectData = {}, certType = 'LEED') {
    if (certType === 'LEED') {
      const scores   = projectData.categoryScores || {};
      let totalEarned = 0;
      const breakdown = {};

      Object.entries(LEED_V41_CATEGORIES).forEach(([cat, meta]) => {
        const earned  = Math.min(scores[cat] || 0, meta.max);
        const pct     = meta.max > 0 ? +(earned / meta.max * 100).toFixed(1) : 0;
        totalEarned  += earned;
        breakdown[cat] = { earned, max: meta.max, pct, gap: meta.max - earned };
      });

      const percentTotal = +(totalEarned / LEED_TOTAL_MAX * 100).toFixed(2);

      let currentLevel  = 'Not Certified';
      let nextLevel     = 'Certified';
      let pointsNeeded  = LEED_THRESHOLDS.certified - totalEarned;
      Object.entries(LEED_THRESHOLDS).forEach(([level, pts]) => {
        if (totalEarned >= pts) { currentLevel = level.charAt(0).toUpperCase() + level.slice(1); }
      });
      const levelOrder = ['certified', 'silver', 'gold', 'platinum'];
      for (const lvl of levelOrder) {
        if (totalEarned < LEED_THRESHOLDS[lvl]) {
          nextLevel = lvl;
          pointsNeeded = LEED_THRESHOLDS[lvl] - totalEarned;
          break;
        } else {
          nextLevel    = 'Platinum (achieved)';
          pointsNeeded = 0;
        }
      }

      // PHI gap score: urgency to next certification level
      const phiGapScore = pointsNeeded > 0 ? +(this.phi * pointsNeeded / LEED_TOTAL_MAX).toFixed(4) : 0;

      this._log('trackCertification', { certType, totalEarned, currentLevel });
      return { certType, totalEarned, percentTotal, currentLevel, nextLevel, pointsNeeded, phiGapScore, breakdown };

    } else if (certType === 'WELL') {
      const conceptScores = projectData.conceptScores || {};
      const breakdown = {};
      let totalScore = 0;
      WELL_V2_CONCEPTS.forEach(concept => {
        const score = Math.min(conceptScores[concept] || 0, 100);
        totalScore += score;
        breakdown[concept] = { score, gap: 100 - score };
      });
      const avgScore = +(totalScore / WELL_V2_CONCEPTS.length).toFixed(2);
      const phiScore = +(avgScore * this.phiInv).toFixed(4);

      this._log('trackCertification', { certType, avgScore });
      return { certType, averageConceptScore: avgScore, phiScore, breakdown, eligible: avgScore >= 50 };
    }

    return { error: `Unknown certType: ${certType}` };
  }

  // ── Method 4: Client Satisfaction Scoring (NPS + PHI decay) ──
  scoreClientSatisfaction(projectHistory = []) {
    const results = projectHistory.map(proj => {
      const { projectId, npsScore, revisionCycles, onTimeDelivery, budgetAdherence } = proj;
      // NPS component: normalise 0-100
      const npsNorm = ((npsScore || 0) + 100) / 200;

      // PHI-decay penalty per revision cycle beyond 2 (baseline)
      const excessRevisions  = Math.max((revisionCycles || 0) - 2, 0);
      const revisionPenalty  = excessRevisions > 0 ? 1 - (1 - Math.pow(this.phiInv, excessRevisions)) : 0;

      // Delivery bonus: on-time × phi boost
      const deliveryBonus    = onTimeDelivery ? this.phiInv * 0.1 : 0;
      const budgetBonus      = budgetAdherence ? this.phiInv * 0.05 : 0;

      const satisfactionScore = Math.min(+(npsNorm * (1 - revisionPenalty) + deliveryBonus + budgetBonus).toFixed(4), 1);
      const grade = satisfactionScore >= 0.85 ? 'A' : satisfactionScore >= 0.7 ? 'B' : satisfactionScore >= 0.55 ? 'C' : 'D';

      return {
        projectId,
        npsScore,
        revisionCycles,
        excessRevisions,
        revisionPenalty: +revisionPenalty.toFixed(4),
        satisfactionScore,
        grade,
        onTimeDelivery,
        budgetAdherence,
      };
    });

    const avgSatisfaction = results.length > 0
      ? +(results.reduce((s, r) => s + r.satisfactionScore, 0) / results.length).toFixed(4)
      : 0;

    this._log('scoreClientSatisfaction', { projectCount: projectHistory.length, avgSatisfaction });
    return { results, averageSatisfactionScore: avgSatisfaction, portfolioGrade: avgSatisfaction >= 0.8 ? 'A' : avgSatisfaction >= 0.65 ? 'B' : 'C' };
  }

  // ── Method 5: Material/Finish Substitution Intelligence ──
  specSubstitution(materialSpec = {}, budget = 0, availabilityConstraints = []) {
    const { specifiedMaterial, quantity, unitCost } = materialSpec;
    const specCost  = quantity * unitCost;
    const overBudget = specCost > budget;

    // Build candidate substitutions from sustainability database
    const candidates = Object.entries(MATERIAL_SUSTAINABILITY_SCORES)
      .filter(([mat]) => mat !== specifiedMaterial && !availabilityConstraints.includes(mat))
      .map(([mat, sustScore]) => {
        // Estimate relative cost factor (heuristic)
        const costFactor   = sustScore > 0.75 ? 1.1 : sustScore > 0.55 ? 0.85 : 0.7;
        const estUnitCost  = +(unitCost * costFactor).toFixed(2);
        const estTotalCost = +(quantity * estUnitCost).toFixed(2);
        const withinBudget = estTotalCost <= budget;

        // PHI-composite score: sustainability + budget-fit
        const budgetScore  = withinBudget ? 1 : budget / estTotalCost;
        const phiComposite = +(sustScore * this.phi * budgetScore).toFixed(4);

        return {
          material:      mat,
          sustainabilityScore: sustScore,
          estimatedUnitCost: estUnitCost,
          estimatedTotalCost: estTotalCost,
          withinBudget,
          phiComposite,
        };
      });

    candidates.sort((a, b) => b.phiComposite - a.phiComposite);

    this._log('specSubstitution', { specifiedMaterial, overBudget, candidateCount: candidates.length });
    return {
      specifiedMaterial,
      specCost,
      budget,
      overBudget,
      topRecommendations: candidates.slice(0, 5),
      allCandidates:      candidates,
    };
  }

  // ── Utility: Project Milestone Tracker ──
  trackMilestones(milestones = []) {
    const today   = new Date();
    const results = milestones.map(m => {
      const dueDate     = new Date(m.dueDate);
      const daysTodue   = Math.round((dueDate - today) / 86400000);
      const overdue     = !m.completed && daysTodue < 0;
      const urgency     = overdue
        ? +(Math.abs(daysTodue) * this.phi / 30).toFixed(4)
        : daysTodue < 14 ? +(this.phiInv * 14 / Math.max(daysTodue, 1)).toFixed(4) : 0;
      return { ...m, daysTodue, overdue, urgency, status: m.completed ? 'COMPLETE' : overdue ? 'OVERDUE' : daysTodue < 7 ? 'DUE-SOON' : 'ON-TRACK' };
    });
    return { milestones: results.sort((a, b) => a.daysTodue - b.daysTodue), overdueCount: results.filter(r => r.overdue).length };
  }

  // ── Utility: Material Lead-Time Risk ──
  scoreMaterialLeadTimeRisk(specList = [], constructionStartDate) {
    const startDate = new Date(constructionStartDate);
    const today     = new Date();
    const daysToStart = Math.round((startDate - today) / 86400000);

    return specList.map(spec => {
      const leadBuffer = daysToStart - spec.leadTimeDays;
      const riskScore  = leadBuffer < 0
        ? +(Math.abs(leadBuffer) * this.phi / 30).toFixed(4)
        : +(this.phiInv / Math.max(leadBuffer, 1) * 30).toFixed(4);
      return {
        materialId:     spec.materialId,
        name:           spec.name,
        leadTimeDays:   spec.leadTimeDays,
        bufferDays:     leadBuffer,
        riskScore,
        onCriticalPath: leadBuffer < 0,
        status:         leadBuffer < 0 ? 'CRITICAL' : leadBuffer < 14 ? 'WATCH' : 'SAFE',
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
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
        'Space Planning Optimization (BIM/IFC)',
        'FF&E Budget Tracking with ROI Scoring',
        'LEED/WELL Certification Tracking',
        'Client Satisfaction Scoring (NPS + PHI decay)',
        'Material/Finish Substitution Intelligence',
      ],
      leedCategories:  LEED_V41_CATEGORIES,
      leedThresholds:  LEED_THRESHOLDS,
      wellConcepts:    WELL_V2_CONCEPTS,
      ffeDepreciation: FFE_DEPRECIATION,
      memoryLog:       this.memoryLog,
      createdAt:       this.createdAt,
      framework:       'RSHIP',
    };
  }
}

export function birthDESIGNEX(config = {}) { return new DESIGNEX(config); }
export { DESIGNEX };
export default DESIGNEX;
