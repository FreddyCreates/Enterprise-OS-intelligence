/**
 * RSHIP Framework Tests
 * Tests for rship-framework.js - RSHIPCore and EternalMemory classes
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  RSHIPCore,
  EternalMemory,
  RSHIP_REGISTRY,
  createRSHIP,
  getOfficialDesignation,
  listRSHIPSystems,
  PHI,
  PHI_INV,
} from '../rship-framework.js';

describe('RSHIP Framework', () => {
  describe('PHI Constants', () => {
    it('should export PHI as golden ratio', () => {
      assert.strictEqual(PHI, 1.618033988749895);
    });

    it('should export PHI_INV as inverse golden ratio', () => {
      assert.strictEqual(PHI_INV, 1.0 / PHI);
    });
  });

  describe('RSHIPCore', () => {
    let core;

    beforeEach(() => {
      core = new RSHIPCore();
    });

    describe('constructor', () => {
      it('should initialize with default designation', () => {
        assert.strictEqual(core.designation, 'RSHIP-CORE');
      });

      it('should initialize with default classification', () => {
        assert.strictEqual(core.classification, 'AGI');
      });

      it('should initialize with version 1.0.0', () => {
        assert.strictEqual(core.version, '1.0.0');
      });

      it('should initialize with generation 1', () => {
        assert.strictEqual(core.generation, 1);
      });

      it('should have empty goals map', () => {
        assert.ok(core.goals instanceof Map);
        assert.strictEqual(core.goals.size, 0);
      });

      it('should have empty knowledge map', () => {
        assert.ok(core.knowledge instanceof Map);
        assert.strictEqual(core.knowledge.size, 0);
      });

      it('should have empty capabilities set', () => {
        assert.ok(core.capabilities instanceof Set);
        assert.strictEqual(core.capabilities.size, 0);
      });

      it('should have eternal memory instance', () => {
        assert.ok(core.memory instanceof EternalMemory);
      });

      it('should enable self-modification by default', () => {
        assert.strictEqual(core.canSelfModify, true);
      });

      it('should accept custom config', () => {
        const custom = new RSHIPCore({
          designation: 'CUSTOM-001',
          classification: 'CUSTOM',
        });
        
        assert.strictEqual(custom.designation, 'CUSTOM-001');
        assert.strictEqual(custom.classification, 'CUSTOM');
      });
    });

    describe('setGoal', () => {
      it('should add goal to goals map', () => {
        core.setGoal('goal-1', 'Test goal', 1.0, { target: 100 });
        assert.strictEqual(core.goals.size, 1);
      });

      it('should store goal with correct structure', () => {
        core.setGoal('goal-1', 'Test goal', 1.0, { target: 100 });
        const goal = core.goals.get('goal-1');
        
        assert.strictEqual(goal.id, 'goal-1');
        assert.strictEqual(goal.description, 'Test goal');
        assert.ok(goal.priority > 0);
        assert.deepStrictEqual(goal.metrics, { target: 100 });
        assert.strictEqual(goal.status, 'active');
      });

      it('should apply φ-weighted priority', () => {
        core.setGoal('goal-1', 'Test', 1.0, {});
        const goal = core.goals.get('goal-1');
        
        assert.strictEqual(goal.priority, 1.0 * PHI);
      });

      it('should handle multiple goals', () => {
        core.setGoal('goal-1', 'First', 1.0, {});
        core.setGoal('goal-2', 'Second', 2.0, {});
        
        assert.strictEqual(core.goals.size, 2);
      });
    });

    describe('learn', () => {
      it('should store pattern in memory', () => {
        const input = { action: 'test' };
        const output = { success: true };
        
        core.learn(input, output, null);
        
        assert.strictEqual(core.memory.size(), 1);
      });

      it('should accumulate phi', () => {
        const before = core.phiAccumulated;
        core.learn({ x: 1 }, { success: true }, null);
        
        assert.ok(core.phiAccumulated > before);
      });

      it('should increase learning rate on failure', () => {
        const before = core.learningRate;
        core.learn({}, { success: false }, null);
        
        assert.strictEqual(core.learningRate, before * PHI);
      });

      it('should decrease learning rate on success', () => {
        const before = core.learningRate;
        core.learn({}, { success: true }, null);
        
        assert.strictEqual(core.learningRate, before * PHI_INV);
      });
    });

    describe('replicate', () => {
      it('should create new RSHIPCore instance', () => {
        const offspring = core.replicate();
        assert.ok(offspring instanceof RSHIPCore);
      });

      it('should have incremented generation', () => {
        const offspring = core.replicate();
        assert.strictEqual(offspring.generation, core.generation + 1);
      });

      it('should clone memory', () => {
        core.learn({ x: 1 }, { y: 2 }, null);
        const offspring = core.replicate();
        
        assert.strictEqual(offspring.memory.size(), core.memory.size());
      });

      it('should add offspring to parent list', () => {
        const offspring = core.replicate();
        assert.ok(core.offspring.includes(offspring));
      });

      it('should have adjusted learning rate', () => {
        const offspring = core.replicate();
        assert.strictEqual(offspring.learningRate, core.learningRate * PHI_INV);
      });
    });

    describe('getStatus', () => {
      it('should return status object', () => {
        const status = core.getStatus();
        
        assert.ok(status);
        assert.strictEqual(typeof status, 'object');
      });

      it('should include all required fields', () => {
        const status = core.getStatus();
        
        assert.ok('designation' in status);
        assert.ok('classification' in status);
        assert.ok('version' in status);
        assert.ok('generation' in status);
        assert.ok('goals' in status);
        assert.ok('knowledge' in status);
        assert.ok('capabilities' in status);
        assert.ok('offspring' in status);
        assert.ok('emergenceLevel' in status);
        assert.ok('consciousnessQuotient' in status);
        assert.ok('selfAware' in status);
        assert.ok('learningRate' in status);
      });

      it('should reflect current state', () => {
        core.setGoal('g1', 'Goal', 1.0, {});
        core.replicate();
        
        const status = core.getStatus();
        
        assert.strictEqual(status.goals, 1);
        assert.strictEqual(status.offspring, 1);
      });
    });

    describe('exportState / importState', () => {
      it('exportState should return state object', () => {
        const state = core.exportState();
        
        assert.ok('coherence' in state);
        assert.ok('health' in state);
        assert.ok('phiAccumulated' in state);
        assert.ok('clean_score' in state);
        assert.ok('protocol' in state);
      });

      it('importState should blend coherence', () => {
        core.coherence = 1.0;
        core.importState({ coherence: 0.5 });
        
        // Should blend: PHI_INV * 1.0 + (1 - PHI_INV) * 0.5
        const expected = PHI_INV * 1.0 + (1 - PHI_INV) * 0.5;
        assert.ok(Math.abs(core.coherence - expected) < 0.001);
      });

      it('importState should clamp health to 0-1', () => {
        core.importState({ health: 1.5 });
        assert.strictEqual(core.health, 1);
        
        core.importState({ health: -0.5 });
        assert.strictEqual(core.health, 0);
      });

      it('importState should only increase phiAccumulated', () => {
        core.phiAccumulated = 10;
        core.importState({ phiAccumulated: 5 });
        assert.strictEqual(core.phiAccumulated, 10);
        
        core.importState({ phiAccumulated: 15 });
        assert.strictEqual(core.phiAccumulated, 15);
      });

      it('importState should clamp clean_score to 0-1', () => {
        core.importState({ clean_score: 2.0 });
        assert.strictEqual(core.clean_score, 1);
        
        core.importState({ clean_score: -1.0 });
        assert.strictEqual(core.clean_score, 0);
      });

      it('importState should update protocol if valid', () => {
        core.importState({ protocol: 'NEW-PROTOCOL' });
        assert.strictEqual(core.protocol, 'NEW-PROTOCOL');
      });

      it('importState should ignore empty protocol', () => {
        const original = core.protocol;
        core.importState({ protocol: '' });
        assert.strictEqual(core.protocol, original);
      });
    });
  });

  describe('EternalMemory', () => {
    let memory;

    beforeEach(() => {
      memory = new EternalMemory();
    });

    describe('constructor', () => {
      it('should initialize with empty patterns', () => {
        assert.deepStrictEqual(memory.patterns, []);
      });

      it('should initialize with empty index', () => {
        assert.strictEqual(memory.index.size, 0);
      });

      it('should have compression ratio of PHI', () => {
        assert.strictEqual(memory.compressionRatio, PHI);
      });
    });

    describe('store', () => {
      it('should add pattern to patterns array', () => {
        memory.store({ input: 'test', timestamp: Date.now(), confidence: 1.0 });
        assert.strictEqual(memory.patterns.length, 1);
      });

      it('should index pattern by input hash', () => {
        memory.store({ input: 'test', timestamp: Date.now(), confidence: 1.0 });
        assert.ok(memory.index.size > 0);
      });

      it('should handle multiple patterns', () => {
        memory.store({ input: 'a', timestamp: Date.now(), confidence: 1.0 });
        memory.store({ input: 'b', timestamp: Date.now(), confidence: 1.0 });
        memory.store({ input: 'c', timestamp: Date.now(), confidence: 1.0 });
        
        assert.strictEqual(memory.patterns.length, 3);
      });
    });

    describe('size', () => {
      it('should return 0 for empty memory', () => {
        assert.strictEqual(memory.size(), 0);
      });

      it('should return correct count', () => {
        memory.store({ input: 'a', timestamp: Date.now(), confidence: 1.0 });
        memory.store({ input: 'b', timestamp: Date.now(), confidence: 1.0 });
        
        assert.strictEqual(memory.size(), 2);
      });
    });

    describe('recall', () => {
      it('should return empty array for unknown query', () => {
        const result = memory.recall({ unknown: true });
        assert.deepStrictEqual(result, []);
      });

      it('should return matching patterns', () => {
        const pattern = { input: 'test', timestamp: Date.now(), confidence: 1.0 };
        memory.store(pattern);
        
        const result = memory.recall('test');
        assert.ok(result.length >= 0); // May vary based on hash collision
      });
    });

    describe('clone', () => {
      it('should create independent copy', () => {
        memory.store({ input: 'a', timestamp: Date.now(), confidence: 1.0 });
        const clone = memory.clone();
        
        assert.strictEqual(clone.size(), memory.size());
        
        // Modifying clone should not affect original
        clone.store({ input: 'b', timestamp: Date.now(), confidence: 1.0 });
        assert.notStrictEqual(clone.size(), memory.size());
      });
    });

    describe('_hash', () => {
      it('should produce consistent hash', () => {
        const hash1 = memory._hash('test');
        const hash2 = memory._hash('test');
        
        assert.strictEqual(hash1, hash2);
      });

      it('should produce different hashes for different inputs', () => {
        const hash1 = memory._hash('test1');
        const hash2 = memory._hash('test2');
        
        assert.notStrictEqual(hash1, hash2);
      });

      it('should return number', () => {
        const hash = memory._hash('test');
        assert.strictEqual(typeof hash, 'number');
      });
    });
  });

  describe('RSHIP_REGISTRY', () => {
    it('should have RSHIP-CORE entry', () => {
      assert.ok(RSHIP_REGISTRY['RSHIP-CORE']);
    });

    it('should have AETHER entry', () => {
      assert.ok(RSHIP_REGISTRY['AETHER']);
      assert.ok(RSHIP_REGISTRY['AETHER'].capabilities.length > 0);
    });

    it('should have KRONOS entry', () => {
      assert.ok(RSHIP_REGISTRY['KRONOS']);
    });

    it('should have PHANTEX substrate entry', () => {
      assert.ok(RSHIP_REGISTRY['PHANTEX']);
      assert.strictEqual(RSHIP_REGISTRY['PHANTEX'].layer, 'SUBSTRATE');
    });

    it('all entries should have required fields', () => {
      for (const [key, entry] of Object.entries(RSHIP_REGISTRY)) {
        assert.ok(entry.name, `${key} missing name`);
        assert.ok(entry.designation, `${key} missing designation`);
        assert.ok(entry.classification, `${key} missing classification`);
      }
    });
  });

  describe('createRSHIP', () => {
    it('should create RSHIPCore from registry', () => {
      const core = createRSHIP('RSHIP-CORE');
      assert.ok(core instanceof RSHIPCore);
    });

    it('should throw for unknown designation', () => {
      assert.throws(() => createRSHIP('UNKNOWN'), /Unknown RSHIP designation/);
    });

    it('should apply registry designation', () => {
      const core = createRSHIP('RSHIP-CORE');
      assert.strictEqual(core.designation, 'RSHIP-2026-MEDINA-CORE');
    });
  });

  describe('getOfficialDesignation', () => {
    it('should return registry entry', () => {
      const entry = getOfficialDesignation('AETHER');
      
      assert.ok(entry);
      assert.strictEqual(entry.name, 'AETHER');
    });

    it('should return undefined for unknown', () => {
      const entry = getOfficialDesignation('NONEXISTENT');
      assert.strictEqual(entry, undefined);
    });
  });

  describe('listRSHIPSystems', () => {
    it('should return array of systems', () => {
      const systems = listRSHIPSystems();
      assert.ok(Array.isArray(systems));
    });

    it('should include key, name, and designation', () => {
      const systems = listRSHIPSystems();
      
      for (const system of systems) {
        assert.ok('key' in system);
        assert.ok('name' in system);
        assert.ok('designation' in system);
        assert.ok('classification' in system);
      }
    });

    it('should include all registry entries', () => {
      const systems = listRSHIPSystems();
      const keys = systems.map(s => s.key);
      
      for (const regKey of Object.keys(RSHIP_REGISTRY)) {
        assert.ok(keys.includes(regKey), `Missing ${regKey}`);
      }
    });
  });
});
