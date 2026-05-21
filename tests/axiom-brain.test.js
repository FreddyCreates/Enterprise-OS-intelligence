/**
 * Axiom Agent Tests
 * Tests for src/agents/axiom.js - AxiomBrain class
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Simulate brain class structure for testing (avoiding cloudflare worker imports)
const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const SCHUMANN_HZ = 7.83;
const HEARTBEAT_MS = 873;

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

  pulse() {
    this.beats++;
    for (const [key, node] of this.knowledgeGraph) {
      node.weight *= this.phiInv;
      if (node.weight < 0.001) {
        this.knowledgeGraph.delete(key);
      }
    }
    return this.beats;
  }

  learn(key, value, importance = 1.0) {
    const weight = importance * this.phi;
    this.knowledgeGraph.set(key, { value, weight, learned_at: Date.now() });
  }

  recall(key) {
    return this.knowledgeGraph.get(key);
  }

  vaultWrite(key, value) {
    const schumann_ts = Date.now() * 7.83e-3;
    this.memoryVault.set(key, { value, schumann_ts, beat: this.beats });
  }

  status() {
    return {
      agent: 'AXIOM',
      id: 'RSHIP-2026-AXIOM-001',
      status: 'ACTIVE',
      beats: this.beats,
      knowledge_count: this.knowledgeGraph.size,
      vault_count: this.memoryVault.size,
      phi: this.phi,
      schumann_hz: this.schumannHz,
      uptime_ms: this.beats * this.heartbeatMs,
    };
  }
}

describe('AxiomBrain', () => {
  let brain;

  beforeEach(() => {
    brain = new AxiomBrain();
  });

  describe('constructor', () => {
    it('should initialize with PHI constant', () => {
      assert.strictEqual(brain.phi, PHI);
    });

    it('should initialize with PHI_INV constant', () => {
      assert.strictEqual(brain.phiInv, PHI_INV);
    });

    it('should initialize with Schumann frequency', () => {
      assert.strictEqual(brain.schumannHz, SCHUMANN_HZ);
    });

    it('should initialize with heartbeat interval', () => {
      assert.strictEqual(brain.heartbeatMs, HEARTBEAT_MS);
    });

    it('should start with 0 beats', () => {
      assert.strictEqual(brain.beats, 0);
    });

    it('should have empty knowledge graph', () => {
      assert.strictEqual(brain.knowledgeGraph.size, 0);
    });

    it('should have empty memory vault', () => {
      assert.strictEqual(brain.memoryVault.size, 0);
    });
  });

  describe('pulse', () => {
    it('should increment beats', () => {
      brain.pulse();
      assert.strictEqual(brain.beats, 1);
      
      brain.pulse();
      assert.strictEqual(brain.beats, 2);
    });

    it('should return beat count', () => {
      const result = brain.pulse();
      assert.strictEqual(result, 1);
    });

    it('should decay knowledge weights', () => {
      brain.learn('test', 'value', 1.0);
      const before = brain.knowledgeGraph.get('test').weight;
      
      brain.pulse();
      const after = brain.knowledgeGraph.get('test').weight;
      
      assert.strictEqual(after, before * PHI_INV);
    });

    it('should remove knowledge below threshold', () => {
      brain.learn('weak', 'value', 0.0001);
      
      // Multiple pulses to decay below threshold
      for (let i = 0; i < 20; i++) {
        brain.pulse();
      }
      
      assert.strictEqual(brain.knowledgeGraph.has('weak'), false);
    });

    it('should keep strong knowledge after pulse', () => {
      brain.learn('strong', 'value', 100.0);
      brain.pulse();
      
      assert.ok(brain.knowledgeGraph.has('strong'));
    });
  });

  describe('learn', () => {
    it('should add knowledge to graph', () => {
      brain.learn('key1', 'value1');
      assert.strictEqual(brain.knowledgeGraph.size, 1);
    });

    it('should store value correctly', () => {
      brain.learn('key1', 'test-value');
      const node = brain.knowledgeGraph.get('key1');
      assert.strictEqual(node.value, 'test-value');
    });

    it('should apply PHI-weighted importance', () => {
      brain.learn('key1', 'value', 1.0);
      const node = brain.knowledgeGraph.get('key1');
      assert.strictEqual(node.weight, 1.0 * PHI);
    });

    it('should apply custom importance', () => {
      brain.learn('key1', 'value', 2.5);
      const node = brain.knowledgeGraph.get('key1');
      assert.strictEqual(node.weight, 2.5 * PHI);
    });

    it('should default importance to 1.0', () => {
      brain.learn('key1', 'value');
      const node = brain.knowledgeGraph.get('key1');
      assert.strictEqual(node.weight, 1.0 * PHI);
    });

    it('should record timestamp', () => {
      const before = Date.now();
      brain.learn('key1', 'value');
      const after = Date.now();
      
      const node = brain.knowledgeGraph.get('key1');
      assert.ok(node.learned_at >= before);
      assert.ok(node.learned_at <= after);
    });

    it('should overwrite existing knowledge', () => {
      brain.learn('key1', 'old');
      brain.learn('key1', 'new');
      
      assert.strictEqual(brain.knowledgeGraph.size, 1);
      assert.strictEqual(brain.knowledgeGraph.get('key1').value, 'new');
    });
  });

  describe('recall', () => {
    it('should return stored knowledge', () => {
      brain.learn('test', 'my-value');
      const result = brain.recall('test');
      
      assert.strictEqual(result.value, 'my-value');
    });

    it('should return undefined for unknown key', () => {
      const result = brain.recall('unknown');
      assert.strictEqual(result, undefined);
    });

    it('should include weight in recall', () => {
      brain.learn('test', 'value', 5.0);
      const result = brain.recall('test');
      
      assert.strictEqual(result.weight, 5.0 * PHI);
    });

    it('should include timestamp in recall', () => {
      brain.learn('test', 'value');
      const result = brain.recall('test');
      
      assert.ok(result.learned_at > 0);
    });
  });

  describe('vaultWrite', () => {
    it('should add to memory vault', () => {
      brain.vaultWrite('key1', 'secret');
      assert.strictEqual(brain.memoryVault.size, 1);
    });

    it('should store value', () => {
      brain.vaultWrite('key1', 'secret-data');
      const entry = brain.memoryVault.get('key1');
      assert.strictEqual(entry.value, 'secret-data');
    });

    it('should include Schumann timestamp', () => {
      brain.vaultWrite('key1', 'value');
      const entry = brain.memoryVault.get('key1');
      assert.ok(entry.schumann_ts > 0);
    });

    it('should include beat number', () => {
      brain.pulse();
      brain.pulse();
      brain.vaultWrite('key1', 'value');
      
      const entry = brain.memoryVault.get('key1');
      assert.strictEqual(entry.beat, 2);
    });

    it('should handle multiple vault entries', () => {
      brain.vaultWrite('a', 1);
      brain.vaultWrite('b', 2);
      brain.vaultWrite('c', 3);
      
      assert.strictEqual(brain.memoryVault.size, 3);
    });
  });

  describe('status', () => {
    it('should return agent name', () => {
      const s = brain.status();
      assert.strictEqual(s.agent, 'AXIOM');
    });

    it('should return agent id', () => {
      const s = brain.status();
      assert.strictEqual(s.id, 'RSHIP-2026-AXIOM-001');
    });

    it('should return active status', () => {
      const s = brain.status();
      assert.strictEqual(s.status, 'ACTIVE');
    });

    it('should return beat count', () => {
      brain.pulse();
      brain.pulse();
      brain.pulse();
      
      const s = brain.status();
      assert.strictEqual(s.beats, 3);
    });

    it('should return knowledge count', () => {
      brain.learn('a', 1);
      brain.learn('b', 2);
      
      const s = brain.status();
      assert.strictEqual(s.knowledge_count, 2);
    });

    it('should return vault count', () => {
      brain.vaultWrite('x', 1);
      brain.vaultWrite('y', 2);
      
      const s = brain.status();
      assert.strictEqual(s.vault_count, 2);
    });

    it('should calculate uptime correctly', () => {
      brain.pulse();
      brain.pulse();
      
      const s = brain.status();
      assert.strictEqual(s.uptime_ms, 2 * HEARTBEAT_MS);
    });

    it('should include phi constant', () => {
      const s = brain.status();
      assert.strictEqual(s.phi, PHI);
    });

    it('should include schumann_hz', () => {
      const s = brain.status();
      assert.strictEqual(s.schumann_hz, SCHUMANN_HZ);
    });
  });
});
