/**
 * RSHIP Main Cloudflare Worker Entry Point
 * Medina Tech · RSHIP-2026 · Dallas, TX
 * 
 * Main entry point for the RSHIP Cloudflare Worker
 * Routes requests to the appropriate agent workers
 */

import { PHI, SCHUMANN_HZ, HEARTBEAT_MS } from './constants/phi.js';
import { OMEGA_ALPHA_AGENTS, getActiveAgents, AGENT_STATUS } from './constants/agents.js';
import { jsonResponse, errorResponse, handleCors } from './utils/response.js';
import Router from './utils/router.js';
import { handleAxiomRequest } from './agents/axiom.js';
import { handleFortressRequest } from './agents/fortress.js';

// Create router
const router = new Router();

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Root endpoint — RSHIP organism status
      if (path === '/' || path === '/health' || path === '/status') {
        return jsonResponse({
          organism: 'RSHIP',
          version: '2026.1.0',
          status: 'ACTIVE',
          platform: 'cloudflare',
          phi: PHI,
          schumann_hz: SCHUMANN_HZ,
          heartbeat_ms: HEARTBEAT_MS,
          agents: getActiveAgents().map(a => ({
            id: a.id,
            name: a.name,
            status: a.status,
          })),
          timestamp: new Date().toISOString(),
        });
      }

      // List all agents
      if (path === '/agents') {
        return jsonResponse({
          agents: Object.values(OMEGA_ALPHA_AGENTS),
          active_count: getActiveAgents().length,
          total_count: Object.keys(OMEGA_ALPHA_AGENTS).length,
        });
      }

      // AXIOM agent routes
      if (path.startsWith('/axiom')) {
        return handleAxiomRequest(request, env, ctx);
      }

      // FORTRESS agent routes
      if (path.startsWith('/fortress')) {
        return handleFortressRequest(request, env, ctx);
      }

      // Phi constants endpoint
      if (path === '/phi' || path === '/constants/phi') {
        return jsonResponse({
          PHI,
          PHI_INV: 0.618033988749895,
          PHI_SQUARED: PHI * PHI,
          PHI_CUBED: PHI * PHI * PHI,
          PHI_FOURTH: PHI * PHI * PHI * PHI,
          SCHUMANN_HZ,
          HEARTBEAT_MS,
        });
      }

      // 404 for unknown routes
      return errorResponse('Not Found', 404);

    } catch (err) {
      console.error('Worker error:', err);
      return errorResponse(`Internal Server Error: ${err.message}`, 500);
    }
  },
};
