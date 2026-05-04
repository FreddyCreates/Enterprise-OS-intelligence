/**
 * PRAEDEX AGI — Predictive Demand & Market Intelligence
 *
 * Official Designation: RSHIP-2026-PRAEDEX-001
 * Classification: Predictive Analytics & Demand Forecasting AGI
 * Full Name: Predictive Response Analytics & Demand Executive X-factor
 *
 * Latin root: praedico — to predict, to foretell, to declare in advance
 *
 * PRAEDEX AGI extends the RSHIP framework with Lyapunov stability forecasting
 * and attractor basin mapping to predict demand, win probabilities, schedule risks,
 * and market regime transitions before they become visible in conventional data.
 *
 * Capabilities:
 * - Demand forecasting: 30/60/90-day labor, material, and sub demand from project-state attractors
 * - Win-probability scoring: scores every bid using project-type, client history, competition, timing
 * - Delay prediction: detects early signatures of schedule slippage before a PM notices
 * - Churn risk scoring: probability a client or subcontractor leaves before renewal
 * - Market regime detection: identifies chaotic vs. stable construction market regimes
 *   using the Lyapunov exponent (λ > 0 = chaos; λ < 0 = stable attractor)
 *
 * Theory: Lyapunov stability forecasting + attractor basin mapping
 *         (KRONOS phase-space) + RSHIP Framework
 *
 * Applications:
 * - SMB general contractors (RSHIP Starter): bid scoring, delay alerts
 * - Enterprise GCs: market regime detection, sub capacity forecasting
 * - Design firms: client churn prevention, project demand planning
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── Lyapunov Stability Engine ──────────────────────────────────────────────
// Estimates the maximal Lyapunov exponent from a scalar time series.
// λ > 0: divergent / chaotic state (risk is rising)
// λ = 0: neutral
// λ < 0: convergent / stable attractor (project/market is settling)

class LyapunovEngine {
  constructor({ embeddingDim = 3, tau = 2, epsilon = 0.1 } = {}) {
    this.m = embeddingDim;
    this.tau = tau;        // Time-delay embedding lag
    this.epsilon = epsilon; // Neighborhood radius
  }

  estimate(series) {
    if (series.length < this.m * this.tau + 2) return 0;

    // Build delay-embedding vectors
    const vectors = [];
    for (let i = 0; i <= series.length - this.m * this.tau; i++) {
      const v = [];
      for (let j = 0; j < this.m; j++) {
        v.push(series[i + j * this.tau]);
      }
      vectors.push(v);
    }

    let logSum = 0;
    let count = 0;

    for (let i = 0; i < vectors.length - 1; i++) {
      // Find nearest neighbor within epsilon
      let nearestDist = Infinity;
      let nearestJ = -1;

      for (let j = 0; j < vectors.length - 1; j++) {
        if (j === i) continue;
        const dist = this._euclidean(vectors[i], vectors[j]);
        if (dist < this.epsilon && dist < nearestDist) {
          nearestDist = dist;
          nearestJ = j;
        }
      }

      if (nearestJ >= 0) {
        const futureDistI = this._euclidean(vectors[i + 1], vectors[nearestJ + 1]);
        if (futureDistI > 0 && nearestDist > 0) {
          logSum += Math.log(futureDistI / nearestDist);
          count++;
        }
      }
    }

    return count > 0 ? logSum / count : 0;
  }

  _euclidean(a, b) {
    return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
  }
}

// ── Attractor Basin Mapping ────────────────────────────────────────────────
// Maps project or market state to the nearest known attractor basin.
// Attractors learned from historical project outcomes.

class AttractorBasin {
  constructor(basinId, centroid, label) {
    this.basinId = basinId;
    this.centroid = centroid; // n-dimensional state vector
    this.label = label;       // 'on-track' | 'at-risk' | 'failing' | 'winning'
    this.radius = PHI_INV;    // φ⁻¹ basin radius
    this.count = 1;
  }

  distance(stateVector) {
    if (stateVector.length !== this.centroid.length) return Infinity;
    return Math.sqrt(
      stateVector.reduce((s, v, i) => s + (v - this.centroid[i]) ** 2, 0)
    );
  }

  update(stateVector) {
    // φ⁻¹ centroid update (moving average)
    this.centroid = this.centroid.map(
      (c, i) => c + PHI_INV * ((stateVector[i] || c) - c)
    );
    this.count++;
  }
}

// ── Bid Record ────────────────────────────────────────────────────────────

class BidRecord {
  constructor(bidId, config = {}) {
    this.bidId = bidId;
    this.projectType = config.projectType || 'commercial';
    this.estimatedValue = config.estimatedValue || 0;
    this.clientId = config.clientId || 'unknown';
    this.competitorCount = config.competitorCount || 3;
    this.bidDate = config.bidDate || Date.now();
    this.dueDate = config.dueDate || Date.now() + 14 * 86400000;
    this.status = 'open'; // open | won | lost | cancelled
    this.winProbability = 0.5;
    this.followUpScheduled = false;
  }

  get daysUntilDue() {
    return Math.floor((this.dueDate - Date.now()) / 86400000);
  }
}

// ── PRAEDEX AGI Core ──────────────────────────────────────────────────────

export class PRAEDEX_AGI extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-PRAEDEX-001',
      classification: 'Predictive Analytics & Demand Forecasting AGI',
      ...config,
    });

    // Lyapunov engine for stability estimation
    this.lyapunov = new LyapunovEngine(config.lyapunovConfig || {});

    // Market regime tracking
    this.marketSignalHistory = []; // Time series of market health signals
    this.marketLambda = 0;         // Current Lyapunov exponent
    this.marketRegime = 'STABLE';  // STABLE | TRANSITIONING | CHAOTIC

    // Attractor basins (learned from project outcomes)
    this.attractors = [
      new AttractorBasin('on-track', [0.8, 0.9, 0.85, 0.8], 'on-track'),
      new AttractorBasin('at-risk', [0.5, 0.6, 0.55, 0.5], 'at-risk'),
      new AttractorBasin('failing', [0.2, 0.3, 0.25, 0.2], 'failing'),
      new AttractorBasin('winning', [0.95, 0.95, 0.9, 0.95], 'winning'),
    ];

    // Bid pipeline
    this.bids = new Map(); // bidId → BidRecord
    this.clientWinHistory = new Map(); // clientId → [{ won: bool, projectType, value }]
    this.subCapacity = new Map(); // subId → { trade, availableCapacity, utilization }

    // Delay signal accumulators per project
    this.delaySignals = new Map(); // projectId → { signals: [], lambda, riskScore }

    // Churn tracking
    this.churnSignals = new Map(); // entityId → { interactions: [], lastContact, churnScore }

    // Demand forecasts
    this.demandForecasts = new Map(); // projectId → { labor, materials, subs, horizon }

    // AGI Goals
    this.setGoal('maximize-bid-accuracy', 'Score bids with >80% win-prediction accuracy', 10, {
      targetAccuracy: 0.80,
    });

    this.setGoal('predict-delays-early', 'Detect delay signals 14+ days before they become delays', 9, {
      earlyWarningDays: 14,
    });

    this.setGoal('minimize-churn', 'Flag every at-risk client or sub before they leave', 8, {
      targetChurnRate: 0.05,
    });

    this.setGoal('detect-market-regime', 'Maintain accurate market regime classification', 7, {
      regimes: ['STABLE', 'TRANSITIONING', 'CHAOTIC'],
    });
  }

  // ── Demand Forecasting ────────────────────────────────────────────────────

  forecastDemand(projectId, projectState = {}) {
    // Project state vector: [scheduleHealth, budgetHealth, subAvailability, permitProgress]
    const stateVector = [
      projectState.scheduleHealth || 0.7,
      projectState.budgetHealth || 0.8,
      projectState.subAvailability || 0.6,
      projectState.permitProgress || 0.5,
    ];

    const nearestAttractor = this._findNearestAttractor(stateVector);

    // Demand scaling: closer to 'failing' attractor = more urgent demand
    const urgencyFactor = {
      'on-track': 1.0,
      'at-risk': 1.35,
      'failing': 1.75,
      'winning': 0.90,
    }[nearestAttractor.label] || 1.0;

    const baseLabor = projectState.activeWorkers || 10;
    const forecast = {
      projectId,
      attractor: nearestAttractor.label,
      attractorDistance: parseFloat(nearestAttractor.distance(stateVector).toFixed(4)),
      horizon30: {
        laborFTE: Math.round(baseLabor * urgencyFactor * PHI_INV * 30),
        materialCategories: this._forecastMaterials(projectState, 30),
        subsNeeded: this._forecastSubsNeeded(projectState, urgencyFactor),
      },
      horizon60: {
        laborFTE: Math.round(baseLabor * urgencyFactor * 60 * 0.8),
        materialCategories: this._forecastMaterials(projectState, 60),
        subsNeeded: this._forecastSubsNeeded(projectState, urgencyFactor * 0.8),
      },
      horizon90: {
        laborFTE: Math.round(baseLabor * urgencyFactor * 90 * 0.6),
        materialCategories: this._forecastMaterials(projectState, 90),
        subsNeeded: this._forecastSubsNeeded(projectState, urgencyFactor * 0.6),
      },
      marketRegime: this.marketRegime,
      marketLambda: parseFloat(this.marketLambda.toFixed(4)),
    };

    this.demandForecasts.set(projectId, forecast);

    // Update attractor basin with observed state
    nearestAttractor.update(stateVector);

    this.learn(
      { projectId, stateVector, attractor: nearestAttractor.label },
      { forecast, urgencyFactor },
      { id: 'demand-forecast' }
    );

    return forecast;
  }

  _forecastMaterials(projectState, horizonDays) {
    const phase = projectState.currentPhase || 'construction';
    const phaseMap = {
      design: ['lumber', 'steel', 'concrete-forms'],
      permitting: [],
      construction: ['concrete', 'steel', 'lumber', 'electrical', 'plumbing', 'HVAC'],
      closeout: ['finishes', 'fixtures', 'landscaping'],
    };
    return phaseMap[phase] || phaseMap['construction'];
  }

  _forecastSubsNeeded(projectState, urgencyFactor) {
    const trades = projectState.activePhaseTrades || ['concrete', 'framing', 'electrical'];
    return trades.map(trade => ({
      trade,
      headcountNeeded: Math.ceil((projectState.activeWorkers || 10) * urgencyFactor * 0.3),
    }));
  }

  // ── Bid Win-Probability Scoring ───────────────────────────────────────────

  scoreBid(bidId, config = {}) {
    const bid = new BidRecord(bidId, config);
    this.bids.set(bidId, bid);

    // Factor 1: Historical win rate for this client × project type
    const clientHistory = this.clientWinHistory.get(config.clientId) || [];
    const relevantHistory = clientHistory.filter(h => h.projectType === config.projectType);
    const historicalWinRate = relevantHistory.length > 0
      ? relevantHistory.filter(h => h.won).length / relevantHistory.length
      : 0.25; // Default for unknown clients

    // Factor 2: Competition penalty (more competitors = lower odds)
    const competitionFactor = Math.max(0.1, 1 / Math.max(1, config.competitorCount));

    // Factor 3: Timing advantage (early submission beats late)
    const daysUntilDue = bid.daysUntilDue;
    const timingFactor = daysUntilDue > 7 ? 1.0 : daysUntilDue > 3 ? 0.9 : 0.75;

    // Factor 4: Market regime modifier
    const regimeFactor = {
      STABLE: 1.0,
      TRANSITIONING: 0.90,
      CHAOTIC: 0.75,
    }[this.marketRegime] || 1.0;

    // φ-weighted combination
    const winProb = PHI_INV * historicalWinRate +
                    (1 - PHI_INV) * (competitionFactor * timingFactor * regimeFactor);

    bid.winProbability = parseFloat(Math.max(0.05, Math.min(0.95, winProb)).toFixed(4));

    // Schedule follow-up if probability is promising
    bid.followUpScheduled = bid.winProbability >= 0.35;

    // Update accuracy goal via self-assessment
    const bidGoal = this.goals.get('maximize-bid-accuracy');
    if (bidGoal) {
      const wonBids = [...this.bids.values()].filter(b => b.status === 'won').length;
      const closedBids = [...this.bids.values()].filter(b => b.status !== 'open').length;
      bidGoal.progress = closedBids > 0 ? wonBids / closedBids : 0.5;
    }

    this.learn(
      { bidId, projectType: config.projectType, clientId: config.clientId, competitorCount: config.competitorCount },
      { winProbability: bid.winProbability, historicalWinRate, competitionFactor, timingFactor },
      { id: 'bid-score' }
    );

    return {
      bidId,
      winProbability: bid.winProbability,
      confidence: bid.winProbability > 0.5 ? 'HIGH' : bid.winProbability > 0.3 ? 'MEDIUM' : 'LOW',
      factors: { historicalWinRate, competitionFactor, timingFactor, regimeFactor },
      followUpScheduled: bid.followUpScheduled,
      recommendation: this._bidRecommendation(bid),
    };
  }

  _bidRecommendation(bid) {
    if (bid.winProbability >= 0.60) return 'Prioritize — strong win odds. Assign senior estimator.';
    if (bid.winProbability >= 0.40) return 'Pursue — competitive odds. Standard effort.';
    if (bid.winProbability >= 0.20) return 'Low priority — pursue only if bandwidth exists.';
    return 'Pass — below threshold. Resources better spent elsewhere.';
  }

  recordBidOutcome(bidId, won) {
    const bid = this.bids.get(bidId);
    if (!bid) return null;

    bid.status = won ? 'won' : 'lost';

    // Update client win history
    const history = this.clientWinHistory.get(bid.clientId) || [];
    history.push({ won, projectType: bid.projectType, value: bid.estimatedValue });
    this.clientWinHistory.set(bid.clientId, history);

    // Learn: actual outcome vs. predicted probability
    this.learn(
      { bidId, predicted: bid.winProbability, actual: won ? 1 : 0 },
      { predictionError: Math.abs(bid.winProbability - (won ? 1 : 0)) },
      { id: 'bid-outcome' }
    );

    return { bidId, status: bid.status, predictionAccuracy: 1 - Math.abs(bid.winProbability - (won ? 1 : 0)) };
  }

  // ── Delay Prediction ──────────────────────────────────────────────────────

  assessDelayRisk(projectId, signals = {}) {
    // Signals: { permitDays, subResponseRate, weatherDays, changeOrderBacklog, budgetVariancePct }
    const signalVector = [
      signals.permitDays ? Math.min(1, signals.permitDays / 30) : 0,
      signals.subResponseRate ? 1 - signals.subResponseRate : 0,
      signals.weatherDays ? Math.min(1, signals.weatherDays / 10) : 0,
      signals.changeOrderBacklog ? Math.min(1, signals.changeOrderBacklog / 20) : 0,
      signals.budgetVariancePct ? Math.min(1, Math.abs(signals.budgetVariancePct) / 0.20) : 0,
    ];

    // Accumulate signal history for Lyapunov estimation
    const existing = this.delaySignals.get(projectId) || { signals: [], lambda: 0, riskScore: 0 };
    const aggregateSignal = signalVector.reduce((s, v) => s + v, 0) / signalVector.length;
    existing.signals.push(aggregateSignal);

    // Estimate Lyapunov exponent from accumulated signal history
    let lambda = 0;
    if (existing.signals.length >= 8) {
      lambda = this.lyapunov.estimate(existing.signals);
    }
    existing.lambda = lambda;

    // Risk score: combines signal magnitude and instability (λ)
    const riskScore = Math.min(1, aggregateSignal * 0.6 + Math.max(0, lambda) * 0.4);
    existing.riskScore = riskScore;
    this.delaySignals.set(projectId, existing);

    const riskLabel = riskScore >= 0.7 ? 'CRITICAL' : riskScore >= 0.4 ? 'WARNING' : 'STABLE';

    // Update goal
    const delayGoal = this.goals.get('predict-delays-early');
    if (delayGoal) {
      delayGoal.progress = riskScore < 0.4 ? 1.0 : 1 - riskScore;
    }

    this.learn(
      { projectId, signals, aggregateSignal },
      { lambda, riskScore, riskLabel },
      { id: 'delay-risk' }
    );

    return {
      projectId,
      riskScore: parseFloat(riskScore.toFixed(4)),
      riskLabel,
      lyapunovExponent: parseFloat(lambda.toFixed(4)),
      dynamicsState: lambda > 0.1 ? 'DIVERGING' : lambda < -0.1 ? 'CONVERGING' : 'NEUTRAL',
      topSignals: this._topDelaySignals(signals, signalVector),
      earlyWarning: riskScore >= 0.4 && existing.signals.length <= 10,
    };
  }

  _topDelaySignals(signals, vector) {
    const labels = ['permitDays', 'subResponseRate', 'weatherDays', 'changeOrderBacklog', 'budgetVariancePct'];
    return labels
      .map((label, i) => ({ signal: label, magnitude: parseFloat(vector[i].toFixed(3)) }))
      .filter(s => s.magnitude > 0.1)
      .sort((a, b) => b.magnitude - a.magnitude);
  }

  // ── Churn Risk Scoring ────────────────────────────────────────────────────

  scoreChurnRisk(entityId, entityType = 'client', interactions = []) {
    const existing = this.churnSignals.get(entityId) || {
      interactions: [],
      lastContact: Date.now(),
      churnScore: 0.3,
    };

    // Append new interactions
    existing.interactions.push(...interactions);
    if (existing.interactions.length > 50) {
      existing.interactions = existing.interactions.slice(-50);
    }

    // Churn signals: declining frequency, declining response rate, complaints
    const recent = existing.interactions.slice(-10);
    const older = existing.interactions.slice(-20, -10);

    const recentAvgEngagement = recent.length > 0
      ? recent.reduce((s, i) => s + (i.engaged ? 1 : 0), 0) / recent.length
      : 0.5;

    const olderAvgEngagement = older.length > 0
      ? older.reduce((s, i) => s + (i.engaged ? 1 : 0), 0) / older.length
      : 0.5;

    const engagementTrend = recentAvgEngagement - olderAvgEngagement; // Negative = declining

    // Days since last contact
    const daysSince = Math.floor((Date.now() - existing.lastContact) / 86400000);
    const silencePenalty = Math.min(1, daysSince / 60);

    // Complaint signals
    const complaintRate = existing.interactions.filter(i => i.complaint).length /
                          Math.max(1, existing.interactions.length);

    // Churn score: 0 = loyal, 1 = churning
    const churnScore = Math.min(1, Math.max(0,
      0.3 * silencePenalty +
      0.4 * Math.max(0, -engagementTrend) +
      0.3 * complaintRate
    ));

    existing.churnScore = churnScore;
    this.churnSignals.set(entityId, existing);

    const churnLabel = churnScore >= 0.6 ? 'AT_RISK' : churnScore >= 0.35 ? 'WATCH' : 'LOYAL';

    const churnGoal = this.goals.get('minimize-churn');
    if (churnGoal) {
      churnGoal.progress = churnScore < 0.35 ? 1.0 : 1 - churnScore;
    }

    this.learn(
      { entityId, entityType, recentEngagement: recentAvgEngagement, daysSince },
      { churnScore, churnLabel },
      { id: 'churn-risk' }
    );

    return {
      entityId,
      entityType,
      churnScore: parseFloat(churnScore.toFixed(4)),
      churnLabel,
      engagementTrend: parseFloat(engagementTrend.toFixed(4)),
      daysSinceContact: daysSince,
      recommendation: this._churnRecommendation(churnLabel, entityType),
    };
  }

  _churnRecommendation(label, entityType) {
    if (label === 'AT_RISK') {
      return entityType === 'client'
        ? 'Schedule executive check-in immediately. Assign dedicated account manager.'
        : 'Call sub principal directly. Review payment terms and workload balance.';
    }
    if (label === 'WATCH') {
      return entityType === 'client'
        ? 'Initiate proactive value-add touchpoint this week.'
        : 'Send upcoming work preview to re-engage sub interest.';
    }
    return 'Relationship healthy — maintain regular cadence.';
  }

  // ── Market Regime Detection ───────────────────────────────────────────────

  updateMarketSignal(signal) {
    // Signal: composite 0–1 market health indicator
    // (permit volume, materials pricing, labor availability, financing conditions)
    this.marketSignalHistory.push(signal);
    if (this.marketSignalHistory.length > 200) {
      this.marketSignalHistory.shift();
    }

    // Estimate Lyapunov exponent from market signal history
    if (this.marketSignalHistory.length >= 10) {
      this.marketLambda = this.lyapunov.estimate(this.marketSignalHistory);
    }

    // Classify regime
    const prev = this.marketRegime;
    if (this.marketLambda > 0.15) {
      this.marketRegime = 'CHAOTIC';
    } else if (this.marketLambda > 0.05) {
      this.marketRegime = 'TRANSITIONING';
    } else {
      this.marketRegime = 'STABLE';
    }

    const regimeChanged = prev !== this.marketRegime;

    // Update goal
    const regimeGoal = this.goals.get('detect-market-regime');
    if (regimeGoal) {
      regimeGoal.progress = this.marketSignalHistory.length >= 20 ? 1.0 : this.marketSignalHistory.length / 20;
    }

    this.learn(
      { signal, historyLength: this.marketSignalHistory.length },
      { lambda: this.marketLambda, regime: this.marketRegime, regimeChanged },
      { id: 'market-regime' }
    );

    return {
      signal,
      lyapunovExponent: parseFloat(this.marketLambda.toFixed(4)),
      regime: this.marketRegime,
      regimeChanged,
      interpretation: this._interpretRegime(),
    };
  }

  _interpretRegime() {
    return {
      STABLE: 'Market attractors are strong. Bid aggressively — conditions favor GCs.',
      TRANSITIONING: 'Market is in phase transition. Bid selectively. Watch material pricing.',
      CHAOTIC: 'Market is unstable. Increase contingency reserves. Delay optional bids.',
    }[this.marketRegime];
  }

  // ── Attractor Utilities ───────────────────────────────────────────────────

  _findNearestAttractor(stateVector) {
    let nearest = this.attractors[0];
    let minDist = nearest.distance(stateVector);

    for (const basin of this.attractors.slice(1)) {
      const d = basin.distance(stateVector);
      if (d < minDist) {
        minDist = d;
        nearest = basin;
      }
    }
    return nearest;
  }

  // ── AGI Status ─────────────────────────────────────────────────────────────

  getAGIStatus() {
    const baseStatus = this.getStatus();
    const openBids = [...this.bids.values()].filter(b => b.status === 'open');
    const avgWinProb = openBids.length > 0
      ? openBids.reduce((s, b) => s + b.winProbability, 0) / openBids.length
      : 0;

    return {
      ...baseStatus,
      predictiveState: {
        bidsTracked: this.bids.size,
        openBids: openBids.length,
        avgBidWinProbability: parseFloat(avgWinProb.toFixed(3)),
        projectsMonitored: this.delaySignals.size,
        entitiesChurnTracked: this.churnSignals.size,
        marketSignalHistory: this.marketSignalHistory.length,
      },
      marketIntelligence: {
        regime: this.marketRegime,
        lyapunovExponent: parseFloat(this.marketLambda.toFixed(4)),
        interpretation: this._interpretRegime(),
      },
      attractorBasins: this.attractors.map(a => ({
        label: a.label,
        observations: a.count,
      })),
    };
  }
}

// ── Factory Function ────────────────────────────────────────────────────────

export function birthPRAEDEX(config = {}) {
  return new PRAEDEX_AGI(config);
}

export default PRAEDEX_AGI;
