/**
 * ANIMUS — The Mind of the Civilization
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Latin: ANIMUS (soul, mind, spirit, courage)
 * 
 * ANIMUS is the reasoning engine of the AI civilization. It:
 *   - Makes decisions based on inputs from other organs
 *   - Plans multi-step operations
 *   - Resolves conflicts between competing goals
 *   - Generates strategies for the civilization
 *
 * This is NOT a passive class. ANIMUS runs AUTONOMOUSLY in the background,
 * constantly processing the cognitive queue and making decisions.
 *
 * Theory basis:
 *   Paper IX  — COHORS MENTIS: autonomous cognitive units
 *   Paper VII — QUAESTIO ET ACTIO: query = execute = learn
 *   Paper XXI — QUORUM: decisions without authority
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ══════════════════════════════════════════════════════════════════════════════
// ANIMUS — THE MIND
// ══════════════════════════════════════════════════════════════════════════════

export class ANIMUS extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} options.chrono - CHRONO instance for logging
   * @param {object} options.cerebex - CEREBEX instance for categorization
   * @param {number} [options.thinkIntervalMs=100] - How often ANIMUS thinks (ms)
   */
  constructor({ chrono, cerebex, thinkIntervalMs = 100 }) {
    super();
    
    /** @type {string} */
    this.name = 'ANIMUS';
    
    /** @type {string} */
    this.latinMeaning = 'The Mind, Soul, Spirit';
    
    /** @type {object} */
    this._chrono = chrono;
    
    /** @type {object} */
    this._cerebex = cerebex;
    
    /** @type {number} */
    this._thinkIntervalMs = thinkIntervalMs;
    
    /** @type {boolean} */
    this._alive = false;
    
    /** @type {NodeJS.Timer|null} */
    this._thinkLoop = null;
    
    /** @type {Array} Queue of items to reason about */
    this._cognitiveQueue = [];
    
    /** @type {Map} Active plans being executed */
    this._activePlans = new Map();
    
    /** @type {Map} Goals the mind is pursuing */
    this._goals = new Map();
    
    /** @type {object} Current mental state */
    this._mentalState = {
      focus: null,
      confidence: 1.0,
      stress: 0.0,
      lastThought: null,
      thoughtCount: 0,
    };
    
    /** @type {Array} Reasoning history */
    this._reasoningHistory = [];
    
    // ═══ ADAPTIVE LEARNING ═══════════════════════════════════════════════════
    // Learning from decision outcomes - HOMEOSTATIC FEEDBACK
    
    /** @type {Map<string, object>} Decision memory: decisionId → {decision, outcome, timestamp} */
    this._decisionMemory = new Map();
    
    /** @type {Map<string, object>} Strategy performance tracking */
    this._strategyPerformance = new Map();
    
    /** @type {object} Adaptive decision weights (evolve from outcomes) */
    this._adaptiveWeights = {
      goalAlignment: 2.0,    // Weight for goal alignment
      riskModifier: 10.0,    // Weight for risk assessment
      valueModifier: 10.0,   // Weight for expected value
      confidenceMultiplier: 1.0, // How much confidence affects decisions
      explorationRate: 0.1,  // Probability of exploring non-optimal choices
    };
    
    /** @type {number} Total decisions made */
    this._totalDecisions = 0;
    
    /** @type {number} Successful decisions */
    this._successfulDecisions = 0;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE — BRING THE MIND ONLINE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Awaken ANIMUS — start the autonomous thinking loop.
   */
  awaken() {
    if (this._alive) return { awakened: false, message: 'Already alive' };
    
    this._alive = true;
    this._log('ANIMUS_AWAKENED', { thinkIntervalMs: this._thinkIntervalMs });
    
    // Start the autonomous thinking loop
    this._thinkLoop = setInterval(() => this._think(), this._thinkIntervalMs);
    
    this.emit('awakened', { organ: 'ANIMUS' });
    
    return { awakened: true, organ: 'ANIMUS' };
  }

  /**
   * Put ANIMUS to sleep — stop the autonomous thinking loop.
   */
  sleep() {
    if (!this._alive) return { sleeping: false, message: 'Already sleeping' };
    
    this._alive = false;
    if (this._thinkLoop) {
      clearInterval(this._thinkLoop);
      this._thinkLoop = null;
    }
    
    this._log('ANIMUS_SLEEPING', { thoughtCount: this._mentalState.thoughtCount });
    this.emit('sleeping', { organ: 'ANIMUS' });
    
    return { sleeping: true, organ: 'ANIMUS', totalThoughts: this._mentalState.thoughtCount };
  }

  /**
   * Check if ANIMUS is alive.
   */
  isAlive() {
    return this._alive;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // COGNITION — THE THINKING PROCESS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Submit something for ANIMUS to reason about.
   * 
   * @param {object} item - Item to reason about
   * @param {string} item.type - Type of cognitive task
   * @param {object} item.payload - Data for the task
   * @param {number} [item.priority=5] - Priority (1-10, 10 = highest)
   * @returns {{ queued: boolean, queueId: string, position: number }}
   */
  reason(item) {
    const queueId = `THOUGHT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem = {
      queueId,
      type: item.type,
      payload: item.payload,
      priority: item.priority || 5,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Insert by priority (higher priority first)
    const insertIndex = this._cognitiveQueue.findIndex(q => q.priority < queueItem.priority);
    if (insertIndex === -1) {
      this._cognitiveQueue.push(queueItem);
    } else {
      this._cognitiveQueue.splice(insertIndex, 0, queueItem);
    }
    
    this._log('REASON_QUEUED', { queueId, type: item.type, priority: item.priority });
    
    return { queued: true, queueId, position: insertIndex === -1 ? this._cognitiveQueue.length : insertIndex + 1 };
  }

  /**
   * Set a goal for ANIMUS to pursue.
   * 
   * @param {string} goalId - Unique goal identifier
   * @param {object} goal - Goal definition
   * @param {string} goal.description - What the goal is
   * @param {function} goal.satisfiedWhen - Function that returns true when goal is met
   * @param {number} [goal.priority=5] - Priority (1-10)
   */
  setGoal(goalId, goal) {
    this._goals.set(goalId, {
      goalId,
      description: goal.description,
      satisfiedWhen: goal.satisfiedWhen,
      priority: goal.priority || 5,
      setAt: new Date().toISOString(),
      status: 'active',
      progress: 0,
    });
    
    this._log('GOAL_SET', { goalId, description: goal.description });
    this.emit('goal_set', { goalId, description: goal.description });
    
    return { set: true, goalId };
  }

  /**
   * Get current mental state.
   */
  getMentalState() {
    return {
      ...this._mentalState,
      queueLength: this._cognitiveQueue.length,
      activePlans: this._activePlans.size,
      activeGoals: this._goals.size,
      isAlive: this._alive,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DECISION MAKING
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Make a decision based on options and criteria.
   * 
   * @param {object} decision
   * @param {string} decision.question - What needs to be decided
   * @param {Array<object>} decision.options - Available options
   * @param {object} [decision.context] - Context for decision
   * @returns {{ decided: boolean, decisionId: string, choice: object, reasoning: string }}
   */
  decide(decision) {
    const { question, options, context = {} } = decision;
    
    if (!options || options.length === 0) {
      return { decided: false, error: 'No options provided' };
    }
    
    const decisionId = `DEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this._totalDecisions++;
    
    // Score each option using ADAPTIVE weights (learned from outcomes)
    const scoredOptions = options.map(option => {
      let score = 0;
      
      // Factor 1: Alignment with active goals (ADAPTIVE weight)
      for (const [goalId, goal] of this._goals) {
        if (option.supportsGoals?.includes(goalId)) {
          score += goal.priority * this._adaptiveWeights.goalAlignment;
        }
      }
      
      // Factor 2: Risk assessment (lower risk = higher score) (ADAPTIVE weight)
      const risk = option.risk || 0.5;
      score += (1 - risk) * this._adaptiveWeights.riskModifier;
      
      // Factor 3: Expected value (ADAPTIVE weight)
      const expectedValue = option.expectedValue || 0.5;
      score += expectedValue * this._adaptiveWeights.valueModifier;
      
      // Factor 4: Confidence modifier (ADAPTIVE multiplier)
      score *= (this._mentalState.confidence * this._adaptiveWeights.confidenceMultiplier);
      
      return { ...option, score };
    });
    
    // Sort by score descending
    scoredOptions.sort((a, b) => b.score - a.score);
    
    // Exploration vs Exploitation: occasionally choose non-optimal to learn
    let choice;
    if (Math.random() < this._adaptiveWeights.explorationRate) {
      // Explore: choose randomly from top 3 options
      const topOptions = scoredOptions.slice(0, Math.min(3, scoredOptions.length));
      choice = topOptions[Math.floor(Math.random() * topOptions.length)];
    } else {
      // Exploit: choose best option
      choice = scoredOptions[0];
    }
    
    // Generate reasoning
    const reasoning = `Selected "${choice.label || choice.id}" with score ${choice.score.toFixed(2)}. ` +
      `Risk: ${choice.risk || 0.5}, Expected value: ${choice.expectedValue || 0.5}. ` +
      `${scoredOptions.length} options evaluated. Strategy weights: goal=${this._adaptiveWeights.goalAlignment.toFixed(2)}, ` +
      `risk=${this._adaptiveWeights.riskModifier.toFixed(2)}, value=${this._adaptiveWeights.valueModifier.toFixed(2)}`;
    
    // Store decision in memory for outcome learning
    this._decisionMemory.set(decisionId, {
      decisionId,
      question,
      options: scoredOptions,
      choice,
      context,
      reasoning,
      timestamp: new Date().toISOString(),
      weights: { ...this._adaptiveWeights }, // Snapshot of weights at decision time
      mentalState: { ...this._mentalState },
      outcomeRecorded: false,
    });
    
    this._log('DECISION_MADE', { decisionId, question, choice: choice.id || choice.label, score: choice.score, reasoning });
    this.emit('decision', { decisionId, question, choice, reasoning });
    
    return { decided: true, decisionId, choice, reasoning, allScores: scoredOptions };
  }

  /**
   * Create a plan to achieve an objective.
   * 
   * @param {object} objective
   * @param {string} objective.description - What to achieve
   * @param {object} [objective.constraints] - Constraints on the plan
   * @returns {{ planned: boolean, planId: string, steps: Array }}
   */
  plan(objective) {
    const planId = `PLAN-${Date.now()}`;
    
    // Generate steps based on objective type
    // In production, this would use more sophisticated planning
    const steps = this._generatePlanSteps(objective);
    
    const plan = {
      planId,
      objective: objective.description,
      constraints: objective.constraints || {},
      steps,
      createdAt: new Date().toISOString(),
      status: 'ready',
      currentStep: 0,
    };
    
    this._activePlans.set(planId, plan);
    
    this._log('PLAN_CREATED', { planId, objective: objective.description, stepCount: steps.length });
    this.emit('plan_created', { planId, steps });
    
    return { planned: true, planId, steps };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HOMEOSTATIC FEEDBACK — LEARNING FROM OUTCOMES
  // ════════════════════════════════════════════════════════════════════════════
  
  /**
   * Record the outcome of a decision — THIS IS THE MISSING HOMEOSTAT.
   * The organism closes the loop: decisions → outcomes → learning → better decisions.
   * 
   * @param {string} decisionId - The decision ID returned from decide()
   * @param {object} outcome - The actual outcome
   * @param {boolean} outcome.success - Was the decision successful?
   * @param {number} [outcome.quality] - Quality score 0-1 (how good was the outcome)
   * @param {string} [outcome.feedback] - Optional feedback about what happened
   * @param {object} [outcome.metrics] - Optional metrics about the outcome
   * @returns {{ recorded: boolean, learned: object }}
   */
  recordDecisionOutcome(decisionId, outcome) {
    const decision = this._decisionMemory.get(decisionId);
    
    if (!decision) {
      return { recorded: false, error: `Decision ${decisionId} not found in memory` };
    }
    
    if (decision.outcomeRecorded) {
      return { recorded: false, error: 'Outcome already recorded for this decision' };
    }
    
    const { success, quality = (success ? 1.0 : 0.0), feedback, metrics } = outcome;
    
    // Store outcome with decision
    decision.outcome = {
      success,
      quality,
      feedback,
      metrics,
      recordedAt: new Date().toISOString(),
    };
    decision.outcomeRecorded = true;
    
    // Track overall success rate
    if (success) {
      this._successfulDecisions++;
    }
    
    // Update mental state based on outcome (HOMEOSTATIC FEEDBACK)
    if (success) {
      // Success increases confidence, reduces stress
      this._mentalState.confidence = Math.min(1.0, this._mentalState.confidence + 0.05);
      this._mentalState.stress = Math.max(0.0, this._mentalState.stress - 0.05);
    } else {
      // Failure decreases confidence, increases stress
      this._mentalState.confidence = Math.max(0.3, this._mentalState.confidence - 0.05);
      this._mentalState.stress = Math.min(1.0, this._mentalState.stress + 0.05);
    }
    
    // Track strategy performance
    const strategyKey = this._getStrategyKey(decision);
    let strategyPerf = this._strategyPerformance.get(strategyKey);
    
    if (!strategyPerf) {
      strategyPerf = {
        strategyKey,
        totalUses: 0,
        successes: 0,
        totalQuality: 0,
        avgQuality: 0,
        weights: { ...decision.weights },
      };
      this._strategyPerformance.set(strategyKey, strategyPerf);
    }
    
    strategyPerf.totalUses++;
    if (success) strategyPerf.successes++;
    strategyPerf.totalQuality += quality;
    strategyPerf.avgQuality = strategyPerf.totalQuality / strategyPerf.totalUses;
    
    // Learn: Adapt decision strategy based on this outcome
    const learned = this._adaptDecisionStrategy(decision, outcome);
    
    this._log('OUTCOME_RECORDED', {
      decisionId,
      success,
      quality,
      confidence: this._mentalState.confidence,
      stress: this._mentalState.stress,
      learned,
    });
    
    this.emit('outcome_recorded', { decisionId, outcome, learned });
    
    return { recorded: true, learned };
  }
  
  /**
   * Adapt decision-making strategy based on outcomes.
   * This is where ANIMUS LEARNS from experience.
   * 
   * @private
   * @param {object} decision - The decision that had an outcome
   * @param {object} outcome - The outcome that occurred
   * @returns {object} What was learned and adjusted
   */
  _adaptDecisionStrategy(decision, outcome) {
    const { success, quality } = outcome;
    const learned = {
      adjustments: [],
      strategyShifts: [],
    };
    
    // PHI-weighted learning rate (golden ratio for optimal learning)
    const PHI_INV = 1.0 / 1.618033988749895;
    const learningRate = PHI_INV * 0.1; // ~0.0618
    
    // 1. Adjust weights based on which factors led to good/bad outcomes
    if (success && quality > 0.7) {
      // This strategy worked well - reinforce it
      
      // If high risk led to success, increase risk tolerance slightly
      if (decision.choice.risk > 0.7) {
        this._adaptiveWeights.riskModifier *= (1 + learningRate);
        learned.adjustments.push('Increased risk tolerance (high-risk success)');
      }
      
      // If goal alignment was strong, reinforce it
      if (decision.choice.supportsGoals?.length > 0) {
        this._adaptiveWeights.goalAlignment *= (1 + learningRate);
        learned.adjustments.push('Increased goal alignment weight');
      }
      
      // Decrease exploration rate when strategies are working
      this._adaptiveWeights.explorationRate = Math.max(0.05, this._adaptiveWeights.explorationRate * 0.95);
      learned.adjustments.push('Decreased exploration (exploit success)');
      
    } else if (!success || quality < 0.3) {
      // This strategy failed - adjust away from it
      
      // If high risk led to failure, decrease risk tolerance
      if (decision.choice.risk > 0.7) {
        this._adaptiveWeights.riskModifier *= (1 - learningRate);
        learned.adjustments.push('Decreased risk tolerance (high-risk failure)');
      }
      
      // If expected value was high but outcome poor, adjust value weight
      if (decision.choice.expectedValue > 0.7) {
        this._adaptiveWeights.valueModifier *= (1 - learningRate * 0.5);
        learned.adjustments.push('Adjusted value assessment weight');
      }
      
      // Increase exploration rate when current strategies fail
      this._adaptiveWeights.explorationRate = Math.min(0.3, this._adaptiveWeights.explorationRate * 1.1);
      learned.adjustments.push('Increased exploration (strategy failed)');
    }
    
    // 2. Adjust based on stress levels (HOMEOSTATIC control)
    if (this._mentalState.stress > 0.7) {
      // High stress → more conservative decisions
      this._adaptiveWeights.riskModifier *= 0.9;
      this._adaptiveWeights.explorationRate *= 0.8;
      learned.strategyShifts.push('High stress → Conservative strategy');
    } else if (this._mentalState.stress < 0.3 && this._mentalState.confidence > 0.7) {
      // Low stress + high confidence → can afford more exploration
      this._adaptiveWeights.explorationRate = Math.min(0.3, this._adaptiveWeights.explorationRate * 1.05);
      learned.strategyShifts.push('Low stress + confidence → Increased exploration');
    }
    
    // 3. Learn which decision PATTERNS lead to goal achievement
    const successRate = this._successfulDecisions / this._totalDecisions;
    if (this._totalDecisions > 20) { // Need enough data
      if (successRate < 0.5) {
        // Overall poor performance → shift all weights toward more conservative
        this._adaptiveWeights.riskModifier *= 0.95;
        this._adaptiveWeights.confidenceMultiplier = Math.max(0.5, this._adaptiveWeights.confidenceMultiplier * 0.95);
        learned.strategyShifts.push(`Low success rate (${(successRate * 100).toFixed(1)}%) → Conservative shift`);
      } else if (successRate > 0.8) {
        // High performance → can be more ambitious
        this._adaptiveWeights.confidenceMultiplier = Math.min(1.5, this._adaptiveWeights.confidenceMultiplier * 1.02);
        learned.strategyShifts.push(`High success rate (${(successRate * 100).toFixed(1)}%) → Confident shift`);
      }
    }
    
    // 4. Keep weights in reasonable bounds
    this._adaptiveWeights.goalAlignment = Math.max(0.5, Math.min(5.0, this._adaptiveWeights.goalAlignment));
    this._adaptiveWeights.riskModifier = Math.max(1.0, Math.min(20.0, this._adaptiveWeights.riskModifier));
    this._adaptiveWeights.valueModifier = Math.max(1.0, Math.min(20.0, this._adaptiveWeights.valueModifier));
    this._adaptiveWeights.confidenceMultiplier = Math.max(0.3, Math.min(2.0, this._adaptiveWeights.confidenceMultiplier));
    this._adaptiveWeights.explorationRate = Math.max(0.05, Math.min(0.3, this._adaptiveWeights.explorationRate));
    
    learned.currentWeights = { ...this._adaptiveWeights };
    learned.successRate = successRate;
    
    return learned;
  }
  
  /**
   * Generate a strategy key for tracking strategy performance.
   * @private
   */
  _getStrategyKey(decision) {
    const { goalAlignment, riskModifier, valueModifier } = decision.weights;
    return `GA${goalAlignment.toFixed(1)}_RM${riskModifier.toFixed(1)}_VM${valueModifier.toFixed(1)}`;
  }
  
  /**
   * Get decision learning statistics.
   */
  getDecisionStats() {
    return {
      totalDecisions: this._totalDecisions,
      successfulDecisions: this._successfulDecisions,
      successRate: this._totalDecisions > 0 ? this._successfulDecisions / this._totalDecisions : 0,
      pendingOutcomes: Array.from(this._decisionMemory.values()).filter(d => !d.outcomeRecorded).length,
      strategyCount: this._strategyPerformance.size,
      currentWeights: { ...this._adaptiveWeights },
      topStrategies: this._getTopStrategies(5),
    };
  }
  
  /**
   * Get top performing strategies.
   * @private
   */
  _getTopStrategies(count = 5) {
    return Array.from(this._strategyPerformance.values())
      .filter(s => s.totalUses >= 3) // Need enough data
      .sort((a, b) => b.avgQuality - a.avgQuality)
      .slice(0, count)
      .map(s => ({
        strategy: s.strategyKey,
        uses: s.totalUses,
        successRate: s.successes / s.totalUses,
        avgQuality: s.avgQuality,
      }));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE — THE AUTONOMOUS THINKING LOOP
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * The core thinking function — runs autonomously.
   * @private
   */
  _think() {
    if (!this._alive) return;
    
    this._mentalState.thoughtCount++;
    const now = new Date().toISOString();
    
    // 1. Process cognitive queue
    if (this._cognitiveQueue.length > 0) {
      const item = this._cognitiveQueue.shift();
      this._processThought(item);
    }
    
    // 2. Check goal progress
    for (const [goalId, goal] of this._goals) {
      if (goal.status === 'active' && goal.satisfiedWhen) {
        try {
          if (goal.satisfiedWhen()) {
            goal.status = 'achieved';
            goal.achievedAt = now;
            this._log('GOAL_ACHIEVED', { goalId, description: goal.description });
            this.emit('goal_achieved', { goalId });
          }
        } catch (e) {
          // Goal check failed, continue
        }
      }
    }
    
    // 3. Execute active plans
    for (const [planId, plan] of this._activePlans) {
      if (plan.status === 'executing' && plan.currentStep < plan.steps.length) {
        const step = plan.steps[plan.currentStep];
        this._executeStep(planId, step);
      }
    }
    
    // 4. Update mental state
    this._mentalState.lastThought = now;
    
    // 5. Emit heartbeat every 100 thoughts
    if (this._mentalState.thoughtCount % 100 === 0) {
      this.emit('heartbeat', { organ: 'ANIMUS', thoughtCount: this._mentalState.thoughtCount });
    }
  }

  /**
   * Process a single thought from the queue.
   * @private
   */
  _processThought(item) {
    item.status = 'processing';
    item.processedAt = new Date().toISOString();
    
    let result = null;
    
    switch (item.type) {
      case 'DECISION':
        result = this.decide(item.payload);
        break;
      case 'PLAN':
        result = this.plan(item.payload);
        break;
      case 'ANALYZE':
        result = this._analyze(item.payload);
        break;
      case 'QUERY':
        result = this._query(item.payload);
        break;
      default:
        result = { processed: true, type: item.type, message: 'Generic processing' };
    }
    
    item.status = 'completed';
    item.result = result;
    
    this._reasoningHistory.push({
      queueId: item.queueId,
      type: item.type,
      processedAt: item.processedAt,
      result: result?.decided || result?.planned || 'processed',
    });
    
    this.emit('thought_processed', { queueId: item.queueId, type: item.type, result });
  }

  /**
   * Analyze something using CEREBEX.
   * @private
   */
  _analyze(payload) {
    if (!this._cerebex) {
      return { analyzed: false, error: 'CEREBEX not connected' };
    }
    
    const scores = this._cerebex.score(payload.input || JSON.stringify(payload));
    return { analyzed: true, categories: scores.slice(0, 5) };
  }

  /**
   * Handle a query.
   * @private
   */
  _query(payload) {
    // In production, this would route to appropriate handlers
    return { answered: true, query: payload.query, answer: 'Query processed by ANIMUS' };
  }

  /**
   * Generate plan steps for an objective.
   * @private
   */
  _generatePlanSteps(objective) {
    // Simplified step generation
    // In production, this would use more sophisticated planning algorithms
    return [
      { stepId: 1, action: 'ANALYZE', description: `Analyze requirements for: ${objective.description}` },
      { stepId: 2, action: 'PREPARE', description: 'Prepare necessary resources' },
      { stepId: 3, action: 'EXECUTE', description: 'Execute primary action' },
      { stepId: 4, action: 'VERIFY', description: 'Verify results' },
      { stepId: 5, action: 'COMPLETE', description: 'Mark objective complete' },
    ];
  }

  /**
   * Execute a plan step.
   * @private
   */
  _executeStep(planId, step) {
    const plan = this._activePlans.get(planId);
    if (!plan) return;
    
    this._log('STEP_EXECUTING', { planId, stepId: step.stepId, action: step.action });
    
    // Mark step complete and advance
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    plan.currentStep++;
    
    if (plan.currentStep >= plan.steps.length) {
      plan.status = 'completed';
      plan.completedAt = new Date().toISOString();
      this._log('PLAN_COMPLETED', { planId });
      this.emit('plan_completed', { planId });
    }
  }

  /**
   * Log to CHRONO.
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ type, organ: 'ANIMUS', ...data, timestamp: new Date().toISOString() });
    }
  }
}
