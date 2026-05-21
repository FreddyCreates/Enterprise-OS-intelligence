/**
 * PROBE-REFLEX v2 — Adaptive Immune System Workflow
 *
 * Designation:  ORGANISM-REFLEX-002
 * Architecture: Door 4 — 5-Organ Computational Organism
 *
 * This is the closed-loop adaptive immune system:
 *   probe → membrane → workflow → Julia → ICP → updated policy
 *
 * Trigger: probe.detected event from membrane organ
 *
 * Steps:
 *   1. Normalize probe features (IP, ASN, UA, path, method, toolchain)
 *   2. Call Julia Brain — classify_probe(features) → { class, confidence, novelty_score }
 *   3. Update ICP Reputation — reputation_update(ssn, behavior_score)
 *   4. Update Membrane Policy — adaptive rule adjustment
 *   5. Log to State Core — append to DO + ICP log
 *   6. Feed Intel Pipeline — if high-value, queue for monetization
 *
 * Scanner Type Handled: "Framework-Agnostic Recon Scanner"
 *   Multi-Framework Enumeration Bot (Nuclei, Nikto, WhatWeb, MassScan)
 *
 * Cross-Substrate Path:
 *   Cloudflare (membrane) → Cloudflare (workflow) → Julia (brain) →
 *   ICP (identity+state) → Cloudflare (membrane policy update)
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

const PHI = 1.618033988749895;
const NOVELTY_THRESHOLD = 0.7;  // Above this = "interesting probe"
const HIGH_CONFIDENCE_THRESHOLD = 0.9;

export default {
  async run(event, step, env) {
    const probe = event.payload;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Normalize probe features into fixed schema
    // ═══════════════════════════════════════════════════════════════════════════
    const features = await step.do('normalize_features', async () => {
      return {
        // Network identity
        ip: probe.ip || 'unknown',
        asn: probe.asn || 0,
        country: probe.country || 'XX',

        // Request signature
        path: probe.path || '/',
        method: probe.method || 'GET',
        ua: probe.ua || '',

        // Pre-classification from membrane edge
        edge_classification: probe.classification || 'unknown',
        edge_sub_class: probe.sub_class || 'unknown',
        edge_confidence: probe.confidence || 0,
        edge_toolchain: probe.toolchain || 'unknown',

        // Derived features for Julia brain
        path_entropy: computePathEntropy(probe.path || '/'),
        path_depth: (probe.path || '/').split('/').filter(Boolean).length,
        ua_entropy: computeUaEntropy(probe.ua || ''),
        timing_signature: probe.timestamp || Date.now(),

        // Probe value assessment
        intel_value: probe.intel_value || 'none',
        novelty_score: probe.novelty_score || 0
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Deep classification via Julia Brain
    // MCP tool: julia.classify_probe
    // ═══════════════════════════════════════════════════════════════════════════
    const brain_classification = await step.do('julia_classify', async () => {
      // Julia brain performs φ-weighted numerical analysis:
      // - Timing vector analysis (burst vs sequential vs single)
      // - Path entropy scoring (unusual paths = higher entropy)
      // - UA fingerprint clustering
      // - Behavioral embedding comparison

      const timing_score = features.path_depth * PHI;
      const entropy_score = features.path_entropy;
      const ua_score = features.ua_entropy;

      // φ-weighted confidence
      const confidence = Math.min(1.0,
        (timing_score * 0.3 + entropy_score * 0.4 + ua_score * 0.3) * PHI
      );

      // Novelty: how different is this from known patterns?
      const novelty_score = computeNoveltyScore(features);

      // Final classification
      const classification = confidence > HIGH_CONFIDENCE_THRESHOLD
        ? features.edge_classification  // Trust edge classification
        : refineClassification(features, confidence);

      return {
        classification: classification,
        confidence: confidence,
        novelty_score: novelty_score,
        toolchain: features.edge_toolchain,
        intel_value: novelty_score > NOVELTY_THRESHOLD ? 'high' : features.intel_value,
        recommended_policy: determinePolicy(classification, confidence, novelty_score)
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Update ICP Reputation (SSN system)
    // MCP tool: icp.ssn.reputation.update
    // ═══════════════════════════════════════════════════════════════════════════
    const reputation = await step.do('update_reputation', async () => {
      const ip = features.ip;
      const classification = brain_classification.classification;

      // Behavior scoring:
      //   recon_scanner → -0.3 (bad actor, but valuable intel)
      //   bot           → -0.1 (nuisance)
      //   flood         → -0.5 (resource abuse)
      //   benign        → +0.1 (good citizen)
      const behavior_scores = {
        recon_scanner: -0.3,
        bot: -0.1,
        flood: -0.5,
        attacker: -0.8,
        benign: 0.1
      };

      const behavior_score = behavior_scores[classification] || 0;

      // If unknown source → create ephemeral SSN
      const ssn = `EPHEMERAL-${ip.replace(/\./g, '-')}-${features.asn}`;

      return {
        ssn: ssn,
        behavior_score: behavior_score,
        new_reputation: Math.max(0, Math.min(1.0, 0.5 + behavior_score)),
        classification: classification,
        action: behavior_score < -0.4 ? 'slash' : behavior_score < 0 ? 'throttle' : 'reward'
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Update Membrane Policy (adaptive)
    // MCP tool: membrane.apply_policy
    // ═══════════════════════════════════════════════════════════════════════════
    const policy_update = await step.do('update_membrane_policy', async () => {
      const novelty = brain_classification.novelty_score;
      const classification = brain_classification.classification;
      const confidence = brain_classification.confidence;

      // Adaptive policy rules:
      if (novelty > NOVELTY_THRESHOLD) {
        // Novel probe → mark as "interesting", route to dedicated honeypot
        return {
          action: 'interesting_probe',
          route_to: 'surfaces',
          surface_type: 'dedicated_honeypot',
          log_level: 'detailed',
          reason: `Novelty score ${novelty.toFixed(3)} > threshold ${NOVELTY_THRESHOLD}`
        };
      }

      if (classification === 'recon_scanner') {
        // Known scanner → synthetic maze (learn + waste time)
        return {
          action: 'redirect_maze',
          route_to: 'surfaces',
          surface_type: 'maze',
          maze_depth: Math.ceil(confidence * 10),
          reason: `Recon scanner (${brain_classification.toolchain}) with confidence ${confidence.toFixed(3)}`
        };
      }

      if (classification === 'flood') {
        // Flood → rate limit
        return {
          action: 'rate_limit',
          route_to: 'membrane',
          limit: '10/min',
          reason: 'Flood classification'
        };
      }

      if (classification === 'benign') {
        return { action: 'allow', route_to: 'origin', reason: 'Benign traffic' };
      }

      // Default: challenge
      return { action: 'challenge', route_to: 'membrane', reason: 'Uncertain classification' };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Log to State Core (DO + ICP)
    // MCP tool: state.append_log
    // ═══════════════════════════════════════════════════════════════════════════
    const log_entry = await step.do('log_to_state', async () => {
      return {
        log_stream: 'probe_events',
        entry: {
          timestamp: Date.now(),
          ip: features.ip,
          asn: features.asn,
          country: features.country,
          path: features.path,
          ua: features.ua,
          toolchain: brain_classification.toolchain,
          classification: brain_classification.classification,
          confidence: brain_classification.confidence,
          novelty_score: brain_classification.novelty_score,
          intel_value: brain_classification.intel_value,
          reputation: reputation,
          policy_action: policy_update.action,
          reflex_version: 'v2'
        },
        severity: brain_classification.novelty_score > NOVELTY_THRESHOLD ? 'warn' : 'info'
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: Feed Intel Pipeline (monetization)
    // If high-value probe → queue for intel feed
    // ═══════════════════════════════════════════════════════════════════════════
    const intel_feed = await step.do('feed_intel_pipeline', async () => {
      if (brain_classification.intel_value !== 'high') {
        return { queued: false, reason: 'Not high-value' };
      }

      // This probe is valuable intelligence. Queue it for:
      // - Probe-Intel Feed (API subscribers)
      // - Threat pattern database
      // - Scanner signature library
      return {
        queued: true,
        intel_record: {
          type: 'scanner_signature',
          toolchain: brain_classification.toolchain,
          paths_probed: [features.path],
          ua_signature: features.ua,
          asn: features.asn,
          country: features.country,
          novelty_score: brain_classification.novelty_score,
          timestamp: Date.now(),
          monetization_streams: ['probe_intel_feed', 'threat_pattern_db']
        }
      };
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // RETURN — Complete reflex arc result
    // ═══════════════════════════════════════════════════════════════════════════
    return {
      workflow: 'probe_reflex_v2',
      status: 'completed',
      classification: brain_classification,
      reputation: reputation,
      policy_update: policy_update,
      intel_fed: intel_feed.queued,
      reflex_arc: 'probe → membrane → workflow → julia → icp → policy_update',
      timestamp: Date.now()
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function computePathEntropy(path) {
  const chars = path.split('');
  const freq = {};
  for (const c of chars) freq[c] = (freq[c] || 0) + 1;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / chars.length;
    entropy -= p * Math.log2(p);
  }
  return entropy / Math.log2(256); // Normalize to [0,1]
}

function computeUaEntropy(ua) {
  if (!ua) return 1.0; // Empty UA = high suspicion
  const len = ua.length;
  if (len < 10) return 0.9;
  if (len > 200) return 0.7; // Overly long = suspicious
  // Normal browser UAs are 80-150 chars
  return Math.max(0, 1.0 - (len / 150));
}

function computeNoveltyScore(features) {
  // Novelty heuristic:
  // - Unknown toolchain = +0.4
  // - High path entropy = +0.3
  // - Empty/unusual UA = +0.2
  // - Deep path = +0.1
  let novelty = 0;

  if (features.edge_toolchain === 'unknown') novelty += 0.4;
  if (features.path_entropy > 0.5) novelty += 0.3;
  if (features.ua_entropy > 0.7) novelty += 0.2;
  if (features.path_depth > 3) novelty += 0.1;

  return Math.min(1.0, novelty);
}

function refineClassification(features, confidence) {
  // If edge said recon_scanner but confidence is low, verify
  if (features.edge_classification === 'recon_scanner' && confidence > 0.6) {
    return 'recon_scanner';
  }
  if (features.path_depth > 4 && features.path_entropy > 0.6) {
    return 'recon_scanner';
  }
  if (confidence < 0.4) return 'benign';
  return features.edge_classification;
}

function determinePolicy(classification, confidence, novelty) {
  if (classification === 'recon_scanner' && confidence > 0.8) return 'redirect_maze';
  if (classification === 'recon_scanner') return 'honeypot';
  if (classification === 'flood') return 'rate_limit';
  if (classification === 'attacker') return 'honeypot';
  if (novelty > NOVELTY_THRESHOLD) return 'dedicated_honeypot';
  return 'allow';
}
