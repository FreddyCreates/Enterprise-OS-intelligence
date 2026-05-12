/**
 * RSHIP Agent Registry Constants
 * Medina Tech · RSHIP-2026 · Dallas, TX
 * 
 * Agent definitions and configurations for Cloudflare deployment
 */

export const AGENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  STANDBY: 'STANDBY',
  INITIALIZING: 'INITIALIZING',
};

export const DEPLOYMENT_PLATFORM = {
  CLOUDFLARE: 'cloudflare',
  ICP: 'icp',
  EDGE: 'edge',
};

// Omega Alpha Agents — Primary cognitive agents
export const OMEGA_ALPHA_AGENTS = {
  AXIOM: {
    id: 'RSHIP-2026-AXIOM-001',
    name: 'AXIOM',
    description: 'Science Journal & IP Protection Omega Alpha Agent',
    status: AGENT_STATUS.ACTIVE,
    model: 'claude-sonnet-4-5',
    deployment: {
      platform: DEPLOYMENT_PLATFORM.CLOUDFLARE,
      edge_compatible: true,
      worker_ready: true,
    },
    tools: [
      'code_search',
      'file_search',
      'read_file',
      'create_file',
      'update_file',
      'run_command',
      'web_search',
    ],
  },
  FORTRESS: {
    id: 'RSHIP-2026-FORTRESS-001',
    name: 'FORTRESS',
    description: 'Security Analysis & Code Intelligence Omega Alpha Agent',
    status: AGENT_STATUS.ACTIVE,
    model: 'claude-sonnet-4-5',
    deployment: {
      platform: DEPLOYMENT_PLATFORM.CLOUDFLARE,
      edge_compatible: true,
      worker_ready: true,
    },
    tools: [
      'code_search',
      'file_search',
      'read_file',
      'create_file',
      'update_file',
      'run_command',
      'web_search',
    ],
  },
};

// Get all active agents
export function getActiveAgents() {
  return Object.values(OMEGA_ALPHA_AGENTS).filter(
    agent => agent.status === AGENT_STATUS.ACTIVE
  );
}

// Get agent by ID
export function getAgentById(id) {
  return Object.values(OMEGA_ALPHA_AGENTS).find(agent => agent.id === id);
}

// Get agent by name
export function getAgentByName(name) {
  return OMEGA_ALPHA_AGENTS[name.toUpperCase()];
}

export default {
  AGENT_STATUS,
  DEPLOYMENT_PLATFORM,
  OMEGA_ALPHA_AGENTS,
  getActiveAgents,
  getAgentById,
  getAgentByName,
};
