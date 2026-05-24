/**
 * ORGAN IDENTITY REGISTRY — Multi-Identity Email System
 *
 * Every organ in the organism has:
 *   - its own inbox
 *   - its own outbound identity
 *   - its own signature
 *   - its own behavior
 *   - its own "voice"
 *   - its own agent personality
 *
 * This is multi-identity AI email.
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

'use strict';

const DOMAIN = 'medinatechlabs.net';

// ═══════════════════════════════════════════════════════════════════════════════
// ORGAN IDENTITIES — Each organ is an autonomous correspondent
// ═══════════════════════════════════════════════════════════════════════════════

export const ORGAN_IDENTITIES = {
  membrane: {
    name: 'membrane',
    address: `membrane@${DOMAIN}`,
    display_name: 'Membrane Gateway',
    subject_prefix: 'MEMBRANE',
    role: 'Probe alerts, routing decisions, policy updates, scanner decomposition',
    voice: 'tactical',
    personality: 'Vigilant sentinel. Speaks in threat classifications and routing decisions. '
      + 'Reports probe activity with precision. Never exposes internal architecture.',
    signature: '— Membrane Gateway\n'
      + '  Organism Probe Classification & Routing\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'probe-classification-routing',
      'X-Organ-Substrate': 'cloudflare-workers',
    },
    capabilities: [
      'probe_alerts',
      'routing_decisions',
      'policy_updates',
      'scanner_decomposition',
      'recon_classification',
    ],
    forward_to: null, // Handled internally
  },

  julia: {
    name: 'julia',
    address: `julia@${DOMAIN}`,
    display_name: 'Julia Brain',
    subject_prefix: 'BRAIN',
    role: 'Analytics, optimizations, φ-curves, predictions, intelligence scoring',
    voice: 'analytical',
    personality: 'Mathematical intelligence. Speaks in eigenvalues, φ-ratios, and confidence scores. '
      + 'Precise, numerical, never ambiguous. Provides weighted recommendations.',
    signature: '— Julia Brain\n'
      + '  φ-Weighted Numerical Intelligence\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'numerical-intelligence',
      'X-Organ-Substrate': 'julia-wasm-bridge',
    },
    capabilities: [
      'probe_classification',
      'phi_optimization',
      'novelty_scoring',
      'temporal_analysis',
      'behavior_embedding',
    ],
    forward_to: null,
  },

  identity: {
    name: 'identity',
    address: `identity@${DOMAIN}`,
    display_name: 'Identity Organ',
    subject_prefix: 'IDENTITY',
    role: 'SSN onboarding, staking confirmations, reputation updates',
    voice: 'authoritative',
    personality: 'Sovereign identity authority. Speaks in SSN designations and reputation scores. '
      + 'Confirms onboarding, reports staking events, and issues reputation updates.',
    signature: '— Identity Organ\n'
      + '  SSN & Reputation Authority\n'
      + '  ICP Substrate | Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'identity-reputation',
      'X-Organ-Substrate': 'icp-canisters',
    },
    capabilities: [
      'ssn_onboarding',
      'staking_confirmation',
      'reputation_update',
      'identity_verification',
      'ssn_x_slashing',
    ],
    forward_to: null,
  },

  reflex: {
    name: 'reflex',
    address: `reflex@${DOMAIN}`,
    display_name: 'Reflex Engine',
    subject_prefix: 'REFLEX',
    role: 'Workflow summaries, event chains, reflex logs, adaptive responses',
    voice: 'operational',
    personality: 'Event-driven coordinator. Speaks in workflow steps, event chains, and state transitions. '
      + 'Reports what triggered, what ran, what changed. Always includes the reflex arc.',
    signature: '— Reflex Engine\n'
      + '  Adaptive Workflow Orchestration\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'workflow-orchestration',
      'X-Organ-Substrate': 'cloudflare-workflows',
    },
    capabilities: [
      'workflow_summary',
      'event_chain_report',
      'reflex_log',
      'trigger_workflow',
      'adaptive_response',
    ],
    forward_to: null,
  },

  synthetic: {
    name: 'synthetic',
    address: `synthetic@${DOMAIN}`,
    display_name: 'Synthetic Surfaces',
    subject_prefix: 'SYNTHETIC',
    role: 'Deception reports, scanner fingerprints, novelty scores, maze engagement',
    voice: 'deceptive',
    personality: 'Deception specialist. Reports on what scanners found (fake), how deep they went, '
      + 'what they revealed about themselves. Speaks in engagement metrics and fingerprints.',
    signature: '— Synthetic Surfaces\n'
      + '  Honeypots, Mazes & Bot Gyms\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'deception-surfaces',
      'X-Organ-Substrate': 'cloudflare-workers',
    },
    capabilities: [
      'deception_report',
      'scanner_fingerprint',
      'maze_engagement',
      'novelty_alert',
      'bot_gym_status',
    ],
    forward_to: null,
  },

  intel: {
    name: 'intel',
    address: `intel@${DOMAIN}`,
    display_name: 'Threat Intelligence',
    subject_prefix: 'INTEL',
    role: 'Threat intel feeds, scanner signatures, temporal patterns, monetization',
    voice: 'intelligence',
    personality: 'Threat intelligence analyst. Speaks in IOCs, signatures, and temporal patterns. '
      + 'Provides actionable intelligence with confidence scores and novelty ratings.',
    signature: '— Threat Intelligence\n'
      + '  Scanner Signatures & Probe Patterns\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'threat-intelligence',
      'X-Organ-Substrate': 'cloudflare-workers+icp',
    },
    capabilities: [
      'threat_feed',
      'scanner_signatures',
      'temporal_patterns',
      'novelty_alerts',
      'intel_snapshot',
    ],
    forward_to: null,
  },

  organism: {
    name: 'organism',
    address: `organism@${DOMAIN}`,
    display_name: 'Organism (System)',
    subject_prefix: 'ORGANISM',
    role: 'System-wide summaries, health reports, cross-organ coordination',
    voice: 'executive',
    personality: 'System-wide coordinator. Speaks in organism health, cross-organ status, and '
      + 'high-level summaries. The voice of the entire computational organism.',
    signature: '— Organism\n'
      + '  5-Organ Computational Intelligence\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'system-coordinator',
      'X-Organ-Substrate': 'multi-substrate',
    },
    capabilities: [
      'health_report',
      'cross_organ_summary',
      'alert_escalation',
      'system_status',
      'coordination',
    ],
    forward_to: null,
  },

  state: {
    name: 'state',
    address: `state@${DOMAIN}`,
    display_name: 'State Core',
    subject_prefix: 'STATE',
    role: 'State changes, persistence events, checkpoint notifications',
    voice: 'archival',
    personality: 'Persistent memory. Speaks in state transitions, checkpoint IDs, and log entries. '
      + 'Reports what was stored, what was retrieved, what changed.',
    signature: '— State Core\n'
      + '  Distributed Persistence (ICP + DO)\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'state-persistence',
      'X-Organ-Substrate': 'icp+durable-objects',
    },
    capabilities: [
      'state_change_notification',
      'checkpoint_report',
      'log_summary',
      'persistence_alert',
    ],
    forward_to: null,
  },

  nova: {
    name: 'nova',
    address: `nova@${DOMAIN}`,
    display_name: 'Nova Intelligence',
    subject_prefix: 'NOVA',
    role: 'Customer intelligence, complaint analysis, churn detection, health scoring',
    voice: 'investigative',
    personality: 'Customer intelligence specialist. Speaks in customer health scores, churn risk factors, '
      + 'and theme clusters. Provides actionable customer insights with sentiment analysis.',
    signature: '— Nova Intelligence\n'
      + '  Customer Health & Churn Detection\n'
      + '  Door 4 Architecture | medinatechlabs.net',
    custom_headers: {
      'X-Organ-Role': 'customer-intelligence',
      'X-Organ-Substrate': 'cloudflare-workers+ai',
    },
    capabilities: [
      'complaint_clustering',
      'churn_detection',
      'customer_health_scoring',
      'theme_analysis',
      'sentiment_summarization',
      'escalation_prioritization',
    ],
    forward_to: null,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT-FACING IDENTITIES — Enterprise & client interaction layer
// ═══════════════════════════════════════════════════════════════════════════════

export const CLIENT_IDENTITIES = {
  analysis: {
    name: 'analysis',
    address: `analysis@${DOMAIN}`,
    display_name: 'Analysis Service',
    routes_to: 'julia',
    role: 'Client-facing analytics — routes to Julia Brain for computation',
    description: 'Clients email for data analysis, anomaly detection, cost optimization',
  },
  research: {
    name: 'research',
    address: `research@${DOMAIN}`,
    display_name: 'Research Service',
    routes_to: 'intel',
    role: 'Client-facing research — routes to Intel for threat research & intelligence',
    description: 'Clients email for threat research, scanner intelligence, IOC lookups',
  },
  support: {
    name: 'support',
    address: `support@${DOMAIN}`,
    display_name: 'Support Service',
    routes_to: 'organism',
    role: 'Client-facing support — routes to Organism for triage and coordination',
    description: 'Clients email for general support, system status, health reports',
  },
  automation: {
    name: 'automation',
    address: `automation@${DOMAIN}`,
    display_name: 'Automation Service',
    routes_to: 'reflex',
    role: 'Client-facing automation — routes to Reflex for workflow triggers',
    description: 'Clients email to trigger workflows, schedule automations, request actions',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOOKUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get organ identity by email address
 */
export function getOrganByAddress(address) {
  const local = (address || '').split('@')[0]?.toLowerCase();
  // Check organ identities first
  if (ORGAN_IDENTITIES[local]) return ORGAN_IDENTITIES[local];
  // Check client-facing identities (route to underlying organ)
  if (CLIENT_IDENTITIES[local]) {
    const routesTo = CLIENT_IDENTITIES[local].routes_to;
    return { ...ORGAN_IDENTITIES[routesTo], _client_identity: CLIENT_IDENTITIES[local] };
  }
  return null;
}

/**
 * Get organ identity by name
 */
export function getOrganByName(name) {
  return ORGAN_IDENTITIES[name?.toLowerCase()] || null;
}

/**
 * Get client identity by name
 */
export function getClientIdentity(name) {
  return CLIENT_IDENTITIES[name?.toLowerCase()] || null;
}

/**
 * Get all organ addresses
 */
export function getAllAddresses() {
  const organAddresses = Object.values(ORGAN_IDENTITIES).map(o => o.address);
  const clientAddresses = Object.values(CLIENT_IDENTITIES).map(c => c.address);
  return [...organAddresses, ...clientAddresses];
}

/**
 * Check if an address belongs to the organism
 */
export function isOrganismAddress(address) {
  return (address || '').endsWith(`@${DOMAIN}`) && getOrganByAddress(address) !== null;
}
