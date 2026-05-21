/**
 * Agent Registry Tests
 * Tests for src/constants/agents.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AGENT_STATUS,
  DEPLOYMENT_PLATFORM,
  OMEGA_ALPHA_AGENTS,
  getActiveAgents,
  getAgentById,
  getAgentByName,
} from '../src/constants/agents.js';

describe('Agent Registry', () => {
  describe('AGENT_STATUS', () => {
    it('should have ACTIVE status', () => {
      assert.strictEqual(AGENT_STATUS.ACTIVE, 'ACTIVE');
    });

    it('should have INACTIVE status', () => {
      assert.strictEqual(AGENT_STATUS.INACTIVE, 'INACTIVE');
    });

    it('should have STANDBY status', () => {
      assert.strictEqual(AGENT_STATUS.STANDBY, 'STANDBY');
    });

    it('should have INITIALIZING status', () => {
      assert.strictEqual(AGENT_STATUS.INITIALIZING, 'INITIALIZING');
    });
  });

  describe('DEPLOYMENT_PLATFORM', () => {
    it('should have CLOUDFLARE platform', () => {
      assert.strictEqual(DEPLOYMENT_PLATFORM.CLOUDFLARE, 'cloudflare');
    });

    it('should have ICP platform', () => {
      assert.strictEqual(DEPLOYMENT_PLATFORM.ICP, 'icp');
    });

    it('should have EDGE platform', () => {
      assert.strictEqual(DEPLOYMENT_PLATFORM.EDGE, 'edge');
    });
  });

  describe('OMEGA_ALPHA_AGENTS', () => {
    it('should have AXIOM agent', () => {
      assert.ok(OMEGA_ALPHA_AGENTS.AXIOM);
      assert.strictEqual(OMEGA_ALPHA_AGENTS.AXIOM.name, 'AXIOM');
    });

    it('should have FORTRESS agent', () => {
      assert.ok(OMEGA_ALPHA_AGENTS.FORTRESS);
      assert.strictEqual(OMEGA_ALPHA_AGENTS.FORTRESS.name, 'FORTRESS');
    });

    it('AXIOM should have correct structure', () => {
      const axiom = OMEGA_ALPHA_AGENTS.AXIOM;
      
      assert.ok(axiom.id);
      assert.ok(axiom.name);
      assert.ok(axiom.description);
      assert.ok(axiom.status);
      assert.ok(axiom.model);
      assert.ok(axiom.deployment);
      assert.ok(Array.isArray(axiom.tools));
    });

    it('FORTRESS should have correct structure', () => {
      const fortress = OMEGA_ALPHA_AGENTS.FORTRESS;
      
      assert.ok(fortress.id);
      assert.ok(fortress.name);
      assert.ok(fortress.description);
      assert.ok(fortress.status);
      assert.ok(fortress.model);
      assert.ok(fortress.deployment);
      assert.ok(Array.isArray(fortress.tools));
    });

    it('agents should have valid deployment config', () => {
      for (const [name, agent] of Object.entries(OMEGA_ALPHA_AGENTS)) {
        assert.ok(agent.deployment.platform, `${name} missing platform`);
        assert.strictEqual(typeof agent.deployment.edge_compatible, 'boolean');
        assert.strictEqual(typeof agent.deployment.worker_ready, 'boolean');
      }
    });

    it('agents should have common tools', () => {
      const requiredTools = ['code_search', 'file_search', 'read_file'];
      
      for (const [name, agent] of Object.entries(OMEGA_ALPHA_AGENTS)) {
        for (const tool of requiredTools) {
          assert.ok(
            agent.tools.includes(tool),
            `${name} missing required tool: ${tool}`
          );
        }
      }
    });
  });

  describe('getActiveAgents', () => {
    it('should return array of active agents', () => {
      const active = getActiveAgents();
      assert.ok(Array.isArray(active));
    });

    it('should only return agents with ACTIVE status', () => {
      const active = getActiveAgents();
      for (const agent of active) {
        assert.strictEqual(agent.status, AGENT_STATUS.ACTIVE);
      }
    });

    it('should include AXIOM if active', () => {
      if (OMEGA_ALPHA_AGENTS.AXIOM.status === AGENT_STATUS.ACTIVE) {
        const active = getActiveAgents();
        const axiom = active.find(a => a.name === 'AXIOM');
        assert.ok(axiom);
      }
    });

    it('should include FORTRESS if active', () => {
      if (OMEGA_ALPHA_AGENTS.FORTRESS.status === AGENT_STATUS.ACTIVE) {
        const active = getActiveAgents();
        const fortress = active.find(a => a.name === 'FORTRESS');
        assert.ok(fortress);
      }
    });
  });

  describe('getAgentById', () => {
    it('should find agent by ID', () => {
      const axiomId = OMEGA_ALPHA_AGENTS.AXIOM.id;
      const found = getAgentById(axiomId);
      
      assert.ok(found);
      assert.strictEqual(found.name, 'AXIOM');
    });

    it('should return undefined for unknown ID', () => {
      const found = getAgentById('NONEXISTENT-ID');
      assert.strictEqual(found, undefined);
    });

    it('should return correct agent data', () => {
      const fortressId = OMEGA_ALPHA_AGENTS.FORTRESS.id;
      const found = getAgentById(fortressId);
      
      assert.strictEqual(found.id, fortressId);
      assert.strictEqual(found.name, 'FORTRESS');
    });
  });

  describe('getAgentByName', () => {
    it('should find agent by uppercase name', () => {
      const found = getAgentByName('AXIOM');
      assert.ok(found);
      assert.strictEqual(found.name, 'AXIOM');
    });

    it('should find agent by lowercase name', () => {
      const found = getAgentByName('axiom');
      assert.ok(found);
      assert.strictEqual(found.name, 'AXIOM');
    });

    it('should find agent by mixed case name', () => {
      const found = getAgentByName('Axiom');
      assert.ok(found);
      assert.strictEqual(found.name, 'AXIOM');
    });

    it('should return undefined for unknown name', () => {
      const found = getAgentByName('UNKNOWN');
      assert.strictEqual(found, undefined);
    });

    it('should find FORTRESS agent', () => {
      const found = getAgentByName('fortress');
      assert.ok(found);
      assert.strictEqual(found.name, 'FORTRESS');
    });
  });
});
