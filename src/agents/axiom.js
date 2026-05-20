/**
 * AXIOM Agent Worker — Science Journal & IP Protection
 * Medina Tech · RSHIP-2026-AXIOM-001 · Dallas, TX
 * 
 * Cloudflare Worker for the AXIOM Omega Alpha Agent
 */

import { PHI, PHI_INV, SCHUMANN_HZ, HEARTBEAT_MS } from '../constants/phi.js';
import { OMEGA_ALPHA_AGENTS, AGENT_STATUS } from '../constants/agents.js';
import { jsonResponse, errorResponse, agentResponse } from '../utils/response.js';

const AGENT = OMEGA_ALPHA_AGENTS.AXIOM;

/**
 * AXIOM Brain — Live cognitive code for science/math/IP tasks
 */
class AxiomBrain {
  constructor() {
    this.phi = PHI;
    this.phiInv = PHI_INV;
    this.schumannHz = SCHUMANN_HZ;
    this.heartbeatMs = HEARTBEAT_MS;
    this.beats = 0;
    this.knowledgeGraph = new Map();
    this.memoryVault = new Map();
  }

  /**
   * Heartbeat pulse — φ-weighted decay
   */
  pulse() {
    this.beats++;
    // φ-decay all knowledge weights toward coherence
    for (const [key, node] of this.knowledgeGraph) {
      node.weight *= this.phiInv;
      if (node.weight < 0.001) {
        this.knowledgeGraph.delete(key);
      }
    }
    return this.beats;
  }

  /**
   * Store knowledge with φ-weighted importance
   */
  learn(key, value, importance = 1.0) {
    const weight = importance * this.phi;
    this.knowledgeGraph.set(key, { value, weight, learned_at: Date.now() });
  }

  /**
   * Retrieve knowledge
   */
  recall(key) {
    return this.knowledgeGraph.get(key);
  }

  /**
   * Store to permanent memory vault
   */
  vaultWrite(key, value) {
    const schumann_ts = Date.now() * 7.83e-3;
    this.memoryVault.set(key, { value, schumann_ts, beat: this.beats });
  }

  /**
   * Get agent status
   */
  status() {
    return {
      agent: AGENT.name,
      id: AGENT.id,
      status: AGENT.status,
      beats: this.beats,
      knowledge_count: this.knowledgeGraph.size,
      vault_count: this.memoryVault.size,
      phi: this.phi,
      schumann_hz: this.schumannHz,
      uptime_ms: this.beats * this.heartbeatMs,
    };
  }
}

// Singleton brain instance
const brain = new AxiomBrain();

/**
 * Handle AXIOM agent requests
 */
export async function handleAxiomRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Health check
  if (path === '/axiom/health' || path === '/axiom/status') {
    brain.pulse();
    return agentResponse(AGENT, brain.status());
  }

  // Learn endpoint
  if (path === '/axiom/learn' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { key, value, importance } = body;
      brain.learn(key, value, importance);
      brain.pulse();
      return agentResponse(AGENT, { learned: key, knowledge_count: brain.knowledgeGraph.size });
    } catch (err) {
      return errorResponse('Invalid request body', 400);
    }
  }

  // Recall endpoint
  if (path.startsWith('/axiom/recall/')) {
    const key = path.replace('/axiom/recall/', '');
    const knowledge = brain.recall(key);
    brain.pulse();
    return agentResponse(AGENT, { key, knowledge });
  }

  // Vault write
  if (path === '/axiom/vault' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { key, value } = body;
      brain.vaultWrite(key, value);
      brain.pulse();
      return agentResponse(AGENT, { vaulted: key, vault_count: brain.memoryVault.size });
    } catch (err) {
      return errorResponse('Invalid request body', 400);
    }
  }

  // Default agent info
  brain.pulse();
  return agentResponse(AGENT, {
    message: `${AGENT.name} Agent — ${AGENT.description}`,
    endpoints: ['/axiom/health', '/axiom/status', '/axiom/learn', '/axiom/recall/:key', '/axiom/vault'],
  });
}

export default {
  AGENT,
  brain,
  handleAxiomRequest,
};
