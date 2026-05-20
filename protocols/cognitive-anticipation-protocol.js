/**
 * PROTO-015: Cognitive Anticipation Protocol (CAP)
 *
 * Pre-cognition routing and anticipatory intelligence.  The RSHIP organism
 * does not wait for events to arrive and then react — it anticipates with
 * φ-weighted Bayesian updating and pre-routes cognitive resources before
 * the triggering event is observed.
 *
 * CAP treats the organism's decision pipeline as a causal graph:
 *  - Each node is an event with prior probability P(E)
 *  - Edges carry φ-weighted conditional probabilities P(E₂|E₁)
 *  - The protocol continuously updates priors as weak signals arrive
 *  - When P(E) > PHI_INV (0.618) the organism pre-routes for E
 *  - When P(E) > PHI⁻² (0.382) + φ-lock, cognitive resources are committed
 *
 * Result: the organism is already thinking about what is about to happen,
 * not reacting to what has already happened.
 *
 * Basis: Bayesian anticipation + φ-compounding (AURUM Paper XXII)
 * Engines: AnticipationGraph + BayesianUpdater + PreRouteEngine
 * Ring: Intelligence Ring  |  Wire: intelligence-wire/cap
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, PHI, PHI_INV } from '../../rship-framework.js';

const SCHUMANN_HZ  = 7.83;
const PRE_ROUTE_THRESHOLD  = PHI_INV;        // 0.618 — pre-route
const COMMIT_THRESHOLD     = PHI_INV ** 2;   // 0.382 — commit resources

// ── Anticipation Node ─────────────────────────────────────────────────────

class AnticipationNode {
  /**
   * @param {string} event_id   — unique event identifier
   * @param {number} prior      — initial P(event) ∈ [0,1]
   * @param {string} domain     — which AGI domain this event belongs to
   */
  constructor(event_id, prior = 0.1, domain = 'UNKNOWN') {
    this.event_id   = event_id;
    this.prior      = prior;
    this.posterior  = prior;
    this.domain     = domain;
    this.signals    = [];   // weak signals received
    this.pre_routed = false;
    this.committed  = false;
  }

  /**
   * Update posterior with a new weak signal using φ-weighted Bayes.
   * P(E|signal) = P(signal|E) × P(E) / P(signal)
   * φ-weight: recent signals have weight 1, older signals decay by φ⁻¹ per step.
   * @param {number} likelihood  P(signal|E) — how diagnostic is the signal?
   * @param {number} signal_prior P(signal) — base rate of this signal
   */
  update(likelihood, signal_prior = 0.5) {
    const bayes = (likelihood * this.posterior) / signal_prior;
    // φ-weighted blend: new posterior leans toward Bayesian update, damped by φ⁻¹
    this.posterior = Math.min(1.0, PHI_INV * this.posterior + (1 - PHI_INV) * bayes);
    this.signals.push({ likelihood, signal_prior, posterior: this.posterior, t: Date.now() });

    if (this.posterior >= PRE_ROUTE_THRESHOLD && !this.pre_routed) {
      this.pre_routed = true;
    }
    if (this.posterior >= COMMIT_THRESHOLD && !this.committed) {
      this.committed = true;
    }
  }

  status() {
    return {
      event_id:   this.event_id,
      domain:     this.domain,
      prior:      this.prior.toFixed(4),
      posterior:  this.posterior.toFixed(4),
      pre_routed: this.pre_routed,
      committed:  this.committed,
      signal_count: this.signals.length,
    };
  }
}

// ── Anticipation Graph ────────────────────────────────────────────────────

class AnticipationGraph {
  constructor() {
    /** @type {Map<string, AnticipationNode>} */
    this.nodes = new Map();
    /** @type {Map<string, Map<string, number>>} */
    this.edges = new Map();  // event_id → Map<event_id, conditional_prob>
  }

  addEvent(event_id, prior = 0.1, domain = 'UNKNOWN') {
    if (!this.nodes.has(event_id)) {
      this.nodes.set(event_id, new AnticipationNode(event_id, prior, domain));
      this.edges.set(event_id, new Map());
    }
    return this.nodes.get(event_id);
  }

  /**
   * Add a causal edge: P(to | from) with φ-weighted propagation strength.
   */
  addEdge(from_id, to_id, conditional_prob) {
    if (!this.edges.has(from_id)) this.edges.set(from_id, new Map());
    this.edges.get(from_id).set(to_id, conditional_prob);
  }

  /**
   * Receive a signal for an event and propagate through the causal graph.
   * @param {string} event_id
   * @param {number} likelihood
   */
  signal(event_id, likelihood) {
    const node = this.nodes.get(event_id);
    if (!node) return;
    node.update(likelihood);

    // Propagate to downstream events with φ-decayed signal strength
    const outgoing = this.edges.get(event_id) || new Map();
    for (const [downstream_id, cond_prob] of outgoing) {
      const downstream = this.nodes.get(downstream_id);
      if (downstream) {
        downstream.update(node.posterior * cond_prob * PHI_INV);
      }
    }
  }

  /**
   * Return all events currently pre-routed or committed, sorted by posterior.
   */
  activeForecast() {
    return [...this.nodes.values()]
      .filter(n => n.pre_routed || n.committed)
      .sort((a, b) => b.posterior - a.posterior)
      .map(n => n.status());
  }

  /**
   * φ-decay all posteriors toward priors (time-based forgetting).
   * Called every 873ms heartbeat.
   */
  pulse() {
    for (const node of this.nodes.values()) {
      // Decay posterior toward prior by PHI_INV factor
      node.posterior = node.prior + PHI_INV * (node.posterior - node.prior);
      if (node.posterior < PRE_ROUTE_THRESHOLD) node.pre_routed = false;
      if (node.posterior < COMMIT_THRESHOLD)    node.committed  = false;
    }
  }
}

// ── Pre-Route Engine ──────────────────────────────────────────────────────

class PreRouteEngine {
  /**
   * Given a forecast, compute optimal AGI resource pre-allocation.
   * @param {object[]} forecast — output of AnticipationGraph.activeForecast()
   * @param {string[]} available_agis — list of currently available AGI IDs
   */
  static allocate(forecast, available_agis) {
    const allocations = [];
    const committed   = forecast.filter(f => f.committed);
    const pre_routed  = forecast.filter(f => f.pre_routed && !f.committed);

    // Committed events get dedicated AGI resource from their domain
    for (const event of committed) {
      const agi = available_agis.find(id => id.toUpperCase().includes(event.domain.toUpperCase()));
      allocations.push({
        event_id:   event.event_id,
        status:     'COMMITTED',
        agi:        agi || 'AEGIX',   // fallback to meta-orchestrator
        priority:   parseFloat(event.posterior),
        phi_weight: PHI ** (parseFloat(event.posterior) * 4),
      });
    }

    // Pre-routed events get shared standby
    for (const event of pre_routed) {
      allocations.push({
        event_id:   event.event_id,
        status:     'PRE_ROUTED',
        agi:        'AEGIX',
        priority:   parseFloat(event.posterior),
        phi_weight: PHI_INV ** (1 - parseFloat(event.posterior)),
      });
    }

    return allocations.sort((a, b) => b.priority - a.priority);
  }
}

// ── CAP Public API ────────────────────────────────────────────────────────

const CAP = {
  createGraph: () => new AnticipationGraph(),

  AnticipationGraph,
  AnticipationNode,
  PreRouteEngine,

  DESIGNATION:       'PROTO-015',
  NAME:              'Cognitive Anticipation Protocol',
  PRE_ROUTE_THRESHOLD,
  COMMIT_THRESHOLD,
  SCHUMANN_HZ,
};

export { CAP, AnticipationGraph, AnticipationNode, PreRouteEngine };
export default CAP;
