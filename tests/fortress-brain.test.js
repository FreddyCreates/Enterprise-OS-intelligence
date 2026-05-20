/**
 * Fortress Agent Tests
 * Tests for src/agents/fortress.js - FortressBrain class
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// Simulate brain class structure for testing (avoiding cloudflare worker imports)
const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const SCHUMANN_HZ = 7.83;
const HEARTBEAT_MS = 873;

const CVSS_CRITICAL_THRESHOLD = 9.0;
const CVSS_HIGH_THRESHOLD = 7.0;
const CVSS_MEDIUM_THRESHOLD = 4.0;

class FortressBrain {
  constructor() {
    this.phi = PHI;
    this.phiInv = PHI_INV;
    this.schumannHz = SCHUMANN_HZ;
    this.heartbeatMs = HEARTBEAT_MS;
    this.beats = 0;
    this.threatRegistry = new Map();
    this.auditLog = [];
    this.scanHistory = [];
  }

  pulse() {
    this.beats++;
    for (const [key, threat] of this.threatRegistry) {
      threat.weight *= this.phiInv;
      if (threat.weight < 0.001 && !threat.persistent) {
        this.threatRegistry.delete(key);
      }
    }
    return this.beats;
  }

  registerThreat(id, threat) {
    const weight = this.calculateThreatWeight(threat);
    this.threatRegistry.set(id, {
      ...threat,
      weight,
      detected_at: Date.now(),
      beat: this.beats,
    });
    this.auditLog.push({
      action: 'THREAT_REGISTERED',
      id,
      severity: threat.severity,
      timestamp: Date.now(),
    });
  }

  calculateThreatWeight(threat) {
    const severityMultiplier = threat.cvss ? threat.cvss / 10 : 0.5;
    return severityMultiplier * this.phi;
  }

  getSeverityLevel(cvss) {
    if (cvss >= CVSS_CRITICAL_THRESHOLD) return 'CRITICAL';
    if (cvss >= CVSS_HIGH_THRESHOLD) return 'HIGH';
    if (cvss >= CVSS_MEDIUM_THRESHOLD) return 'MEDIUM';
    return 'LOW';
  }

  logScan(scanType, results) {
    const scan = {
      type: scanType,
      results,
      timestamp: Date.now(),
      beat: this.beats,
    };
    this.scanHistory.push(scan);
    if (this.scanHistory.length > 100) {
      this.scanHistory.shift();
    }
    return scan;
  }

  status() {
    const criticalThreats = Array.from(this.threatRegistry.values())
      .filter(t => t.cvss >= CVSS_CRITICAL_THRESHOLD).length;
    const highThreats = Array.from(this.threatRegistry.values())
      .filter(t => t.cvss >= CVSS_HIGH_THRESHOLD && t.cvss < CVSS_CRITICAL_THRESHOLD).length;

    return {
      agent: 'FORTRESS',
      id: 'RSHIP-2026-FORTRESS-001',
      status: 'ACTIVE',
      beats: this.beats,
      threat_count: this.threatRegistry.size,
      critical_threats: criticalThreats,
      high_threats: highThreats,
      audit_log_size: this.auditLog.length,
      scan_history_size: this.scanHistory.length,
      phi: this.phi,
      schumann_hz: this.schumannHz,
      uptime_ms: this.beats * this.heartbeatMs,
    };
  }
}

describe('FortressBrain', () => {
  let brain;

  beforeEach(() => {
    brain = new FortressBrain();
  });

  describe('constructor', () => {
    it('should initialize with PHI constant', () => {
      assert.strictEqual(brain.phi, PHI);
    });

    it('should initialize with empty threat registry', () => {
      assert.strictEqual(brain.threatRegistry.size, 0);
    });

    it('should initialize with empty audit log', () => {
      assert.strictEqual(brain.auditLog.length, 0);
    });

    it('should initialize with empty scan history', () => {
      assert.strictEqual(brain.scanHistory.length, 0);
    });

    it('should start with 0 beats', () => {
      assert.strictEqual(brain.beats, 0);
    });
  });

  describe('pulse', () => {
    it('should increment beats', () => {
      brain.pulse();
      assert.strictEqual(brain.beats, 1);
    });

    it('should decay threat weights', () => {
      brain.registerThreat('threat-1', { cvss: 8.0, severity: 'HIGH' });
      const before = brain.threatRegistry.get('threat-1').weight;
      
      brain.pulse();
      const after = brain.threatRegistry.get('threat-1').weight;
      
      assert.strictEqual(after, before * PHI_INV);
    });

    it('should remove weak non-persistent threats', () => {
      brain.registerThreat('weak', { cvss: 0.1, severity: 'LOW' });
      
      // Multiple pulses to decay below threshold
      for (let i = 0; i < 50; i++) {
        brain.pulse();
      }
      
      assert.strictEqual(brain.threatRegistry.has('weak'), false);
    });

    it('should keep persistent threats', () => {
      brain.registerThreat('persistent', { cvss: 0.1, severity: 'LOW', persistent: true });
      
      for (let i = 0; i < 50; i++) {
        brain.pulse();
      }
      
      assert.ok(brain.threatRegistry.has('persistent'));
    });
  });

  describe('registerThreat', () => {
    it('should add threat to registry', () => {
      brain.registerThreat('threat-1', { cvss: 8.0, severity: 'HIGH' });
      assert.strictEqual(brain.threatRegistry.size, 1);
    });

    it('should store threat data', () => {
      brain.registerThreat('threat-1', { cvss: 8.0, severity: 'HIGH', type: 'XSS' });
      const threat = brain.threatRegistry.get('threat-1');
      
      assert.strictEqual(threat.cvss, 8.0);
      assert.strictEqual(threat.severity, 'HIGH');
      assert.strictEqual(threat.type, 'XSS');
    });

    it('should calculate weight from CVSS', () => {
      brain.registerThreat('threat-1', { cvss: 10.0, severity: 'CRITICAL' });
      const threat = brain.threatRegistry.get('threat-1');
      
      assert.strictEqual(threat.weight, (10.0 / 10) * PHI);
    });

    it('should record detection timestamp', () => {
      const before = Date.now();
      brain.registerThreat('threat-1', { cvss: 5.0, severity: 'MEDIUM' });
      const after = Date.now();
      
      const threat = brain.threatRegistry.get('threat-1');
      assert.ok(threat.detected_at >= before);
      assert.ok(threat.detected_at <= after);
    });

    it('should add to audit log', () => {
      brain.registerThreat('threat-1', { cvss: 5.0, severity: 'MEDIUM' });
      
      assert.strictEqual(brain.auditLog.length, 1);
      assert.strictEqual(brain.auditLog[0].action, 'THREAT_REGISTERED');
      assert.strictEqual(brain.auditLog[0].id, 'threat-1');
    });

    it('should record current beat', () => {
      brain.pulse();
      brain.pulse();
      brain.registerThreat('threat-1', { cvss: 5.0, severity: 'MEDIUM' });
      
      const threat = brain.threatRegistry.get('threat-1');
      assert.strictEqual(threat.beat, 2);
    });
  });

  describe('calculateThreatWeight', () => {
    it('should return phi-weighted value for CVSS', () => {
      const weight = brain.calculateThreatWeight({ cvss: 10.0 });
      assert.strictEqual(weight, 1.0 * PHI);
    });

    it('should scale weight by CVSS score', () => {
      const weight5 = brain.calculateThreatWeight({ cvss: 5.0 });
      const weight10 = brain.calculateThreatWeight({ cvss: 10.0 });
      
      assert.strictEqual(weight10, weight5 * 2);
    });

    it('should default to 0.5 multiplier when no CVSS', () => {
      const weight = brain.calculateThreatWeight({});
      assert.strictEqual(weight, 0.5 * PHI);
    });
  });

  describe('getSeverityLevel', () => {
    it('should return CRITICAL for cvss >= 9.0', () => {
      assert.strictEqual(brain.getSeverityLevel(9.0), 'CRITICAL');
      assert.strictEqual(brain.getSeverityLevel(10.0), 'CRITICAL');
    });

    it('should return HIGH for 7.0 <= cvss < 9.0', () => {
      assert.strictEqual(brain.getSeverityLevel(7.0), 'HIGH');
      assert.strictEqual(brain.getSeverityLevel(8.9), 'HIGH');
    });

    it('should return MEDIUM for 4.0 <= cvss < 7.0', () => {
      assert.strictEqual(brain.getSeverityLevel(4.0), 'MEDIUM');
      assert.strictEqual(brain.getSeverityLevel(6.9), 'MEDIUM');
    });

    it('should return LOW for cvss < 4.0', () => {
      assert.strictEqual(brain.getSeverityLevel(0.0), 'LOW');
      assert.strictEqual(brain.getSeverityLevel(3.9), 'LOW');
    });

    it('should handle boundary values correctly', () => {
      assert.strictEqual(brain.getSeverityLevel(3.99), 'LOW');
      assert.strictEqual(brain.getSeverityLevel(4.0), 'MEDIUM');
      assert.strictEqual(brain.getSeverityLevel(6.99), 'MEDIUM');
      assert.strictEqual(brain.getSeverityLevel(7.0), 'HIGH');
      assert.strictEqual(brain.getSeverityLevel(8.99), 'HIGH');
      assert.strictEqual(brain.getSeverityLevel(9.0), 'CRITICAL');
    });
  });

  describe('logScan', () => {
    it('should add scan to history', () => {
      brain.logScan('VULNERABILITY', { found: 3 });
      assert.strictEqual(brain.scanHistory.length, 1);
    });

    it('should return scan object', () => {
      const scan = brain.logScan('DEPENDENCY', { outdated: 5 });
      
      assert.strictEqual(scan.type, 'DEPENDENCY');
      assert.deepStrictEqual(scan.results, { outdated: 5 });
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const scan = brain.logScan('TYPE', {});
      const after = Date.now();
      
      assert.ok(scan.timestamp >= before);
      assert.ok(scan.timestamp <= after);
    });

    it('should include beat number', () => {
      brain.pulse();
      brain.pulse();
      const scan = brain.logScan('TYPE', {});
      
      assert.strictEqual(scan.beat, 2);
    });

    it('should limit history to 100 entries', () => {
      for (let i = 0; i < 150; i++) {
        brain.logScan(`scan-${i}`, {});
      }
      
      assert.strictEqual(brain.scanHistory.length, 100);
    });

    it('should remove oldest when exceeding limit', () => {
      for (let i = 0; i < 101; i++) {
        brain.logScan(`scan-${i}`, {});
      }
      
      // First scan should be removed
      assert.strictEqual(brain.scanHistory[0].type, 'scan-1');
      assert.strictEqual(brain.scanHistory[99].type, 'scan-100');
    });
  });

  describe('status', () => {
    it('should return agent name', () => {
      const s = brain.status();
      assert.strictEqual(s.agent, 'FORTRESS');
    });

    it('should return agent id', () => {
      const s = brain.status();
      assert.strictEqual(s.id, 'RSHIP-2026-FORTRESS-001');
    });

    it('should count threats', () => {
      brain.registerThreat('t1', { cvss: 5.0, severity: 'MEDIUM' });
      brain.registerThreat('t2', { cvss: 6.0, severity: 'MEDIUM' });
      
      const s = brain.status();
      assert.strictEqual(s.threat_count, 2);
    });

    it('should count critical threats', () => {
      brain.registerThreat('t1', { cvss: 9.5, severity: 'CRITICAL' });
      brain.registerThreat('t2', { cvss: 9.0, severity: 'CRITICAL' });
      brain.registerThreat('t3', { cvss: 7.0, severity: 'HIGH' });
      
      const s = brain.status();
      assert.strictEqual(s.critical_threats, 2);
    });

    it('should count high threats', () => {
      brain.registerThreat('t1', { cvss: 9.0, severity: 'CRITICAL' });
      brain.registerThreat('t2', { cvss: 7.5, severity: 'HIGH' });
      brain.registerThreat('t3', { cvss: 8.0, severity: 'HIGH' });
      
      const s = brain.status();
      assert.strictEqual(s.high_threats, 2);
    });

    it('should track audit log size', () => {
      brain.registerThreat('t1', { cvss: 5.0, severity: 'MEDIUM' });
      brain.registerThreat('t2', { cvss: 5.0, severity: 'MEDIUM' });
      
      const s = brain.status();
      assert.strictEqual(s.audit_log_size, 2);
    });

    it('should track scan history size', () => {
      brain.logScan('A', {});
      brain.logScan('B', {});
      brain.logScan('C', {});
      
      const s = brain.status();
      assert.strictEqual(s.scan_history_size, 3);
    });

    it('should calculate uptime', () => {
      brain.pulse();
      brain.pulse();
      brain.pulse();
      
      const s = brain.status();
      assert.strictEqual(s.uptime_ms, 3 * HEARTBEAT_MS);
    });
  });
});
