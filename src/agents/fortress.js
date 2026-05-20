/**
 * FORTRESS Agent Worker — Security Analysis & Code Intelligence
 * Medina Tech · RSHIP-2026-FORTRESS-001 · Dallas, TX
 * 
 * Cloudflare Worker for the FORTRESS Omega Alpha Agent
 */

import { PHI, PHI_INV, SCHUMANN_HZ, HEARTBEAT_MS } from '../constants/phi.js';
import { OMEGA_ALPHA_AGENTS, AGENT_STATUS } from '../constants/agents.js';
import { jsonResponse, errorResponse, agentResponse } from '../utils/response.js';

const AGENT = OMEGA_ALPHA_AGENTS.FORTRESS;

// CVSS severity thresholds
const CVSS_CRITICAL_THRESHOLD = 9.0;
const CVSS_HIGH_THRESHOLD = 7.0;
const CVSS_MEDIUM_THRESHOLD = 4.0;

/**
 * FORTRESS Brain — Live cognitive code for security analysis
 */
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

  /**
   * Heartbeat pulse — φ-weighted threat decay
   */
  pulse() {
    this.beats++;
    // φ-decay threat weights
    for (const [key, threat] of this.threatRegistry) {
      threat.weight *= this.phiInv;
      if (threat.weight < 0.001 && !threat.persistent) {
        this.threatRegistry.delete(key);
      }
    }
    return this.beats;
  }

  /**
   * Register a security threat
   */
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

  /**
   * Calculate φ-weighted threat importance
   */
  calculateThreatWeight(threat) {
    const severityMultiplier = threat.cvss ? threat.cvss / 10 : 0.5;
    return severityMultiplier * this.phi;
  }

  /**
   * Get severity level from CVSS score
   */
  getSeverityLevel(cvss) {
    if (cvss >= CVSS_CRITICAL_THRESHOLD) return 'CRITICAL';
    if (cvss >= CVSS_HIGH_THRESHOLD) return 'HIGH';
    if (cvss >= CVSS_MEDIUM_THRESHOLD) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Log security scan
   */
  logScan(scanType, results) {
    const scan = {
      type: scanType,
      results,
      timestamp: Date.now(),
      beat: this.beats,
    };
    this.scanHistory.push(scan);
    if (this.scanHistory.length > 100) {
      this.scanHistory.shift(); // Keep last 100 scans
    }
    return scan;
  }

  /**
   * Get agent status
   */
  status() {
    const criticalThreats = Array.from(this.threatRegistry.values())
      .filter(t => t.cvss >= CVSS_CRITICAL_THRESHOLD).length;
    const highThreats = Array.from(this.threatRegistry.values())
      .filter(t => t.cvss >= CVSS_HIGH_THRESHOLD && t.cvss < CVSS_CRITICAL_THRESHOLD).length;

    return {
      agent: AGENT.name,
      id: AGENT.id,
      status: AGENT.status,
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

// Singleton brain instance
const brain = new FortressBrain();

/**
 * Handle FORTRESS agent requests
 */
export async function handleFortressRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Health check
  if (path === '/fortress/health' || path === '/fortress/status') {
    brain.pulse();
    return agentResponse(AGENT, brain.status());
  }

  // Register threat endpoint
  if (path === '/fortress/threat' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { id, type, description, cvss, cwe } = body;
      brain.registerThreat(id || `THREAT-${Date.now()}`, {
        type,
        description,
        cvss: cvss || 5.0,
        cwe,
        severity: brain.getSeverityLevel(cvss || 5.0),
      });
      brain.pulse();
      return agentResponse(AGENT, { 
        registered: id,
        threat_count: brain.threatRegistry.size,
      });
    } catch (err) {
      return errorResponse('Invalid request body', 400);
    }
  }

  // Get threats endpoint
  if (path === '/fortress/threats') {
    brain.pulse();
    const threats = Array.from(brain.threatRegistry.entries()).map(([id, threat]) => ({
      id,
      ...threat,
    }));
    return agentResponse(AGENT, { threats, count: threats.length });
  }

  // Log scan endpoint
  if (path === '/fortress/scan' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { type, results } = body;
      const scan = brain.logScan(type, results);
      brain.pulse();
      return agentResponse(AGENT, { scan, scan_history_size: brain.scanHistory.length });
    } catch (err) {
      return errorResponse('Invalid request body', 400);
    }
  }

  // Audit log endpoint
  if (path === '/fortress/audit') {
    brain.pulse();
    return agentResponse(AGENT, { 
      audit_log: brain.auditLog.slice(-50), // Last 50 entries
      total_entries: brain.auditLog.length,
    });
  }

  // Default agent info
  brain.pulse();
  return agentResponse(AGENT, {
    message: `${AGENT.name} Agent — ${AGENT.description}`,
    endpoints: ['/fortress/health', '/fortress/status', '/fortress/threat', '/fortress/threats', '/fortress/scan', '/fortress/audit'],
  });
}

export default {
  AGENT,
  brain,
  handleFortressRequest,
};
