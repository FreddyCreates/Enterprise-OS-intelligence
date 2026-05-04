/**
 * AEGIX AGI — AI Engine Governance & Infrastructure X-factor
 *
 * Official Designation: RSHIP-2026-AEGIX-001
 * Classification: Meta-Intelligence & AGI Swarm Management System
 * Full Name: AI Engine Governance & Infrastructure Executive X-factor
 *
 * Latin root: aegis — shield, protection, oversight (from Greek: goat-skin of Zeus)
 *
 * AEGIX extends the RSHIP framework with multi-agent systems control theory and
 * Byzantine fault tolerance to autonomously monitor the health of every AGI in
 * the RSHIP stack, route AGI-to-AGI messages, coordinate swarm behavior, detect
 * performance degradation before it affects outputs, and autonomously restart or
 * rebalance AGI instances — making AEGIX the meta-layer that makes every RSHIP
 * deployment enterprise-grade and self-healing.
 *
 * Capabilities:
 * - AGI health monitoring: watches TRACTEX, VERBEX, PRAEDEX, AEQUEX, SALUTEX,
 *   LEXEX, GOVEX, PORTEX and all future AGI designations via heartbeat protocol
 * - AGI-to-AGI message routing: sovereign message bus between all RSHIP AGI
 *   instances — replaces ad-hoc function calls with auditable, typed messages
 * - Swarm coordination oversight: detects when AGI agents disagree (Byzantine
 *   faults) and applies voting consensus to resolve conflicting outputs
 * - Performance degradation detection: tracks response latency, output quality
 *   score, and memory pressure per AGI — alerts before user-facing impact
 * - Autonomous AGI restart and rebalancing: spins down degraded instances and
 *   brings up fresh replacements without human intervention
 *
 * Theory: Multi-agent systems control theory (Brooks, 1991; Russell & Norvig)
 *         + Byzantine fault tolerance (Lamport, Shostak, Pease, 1982)
 *         + φ-compounding meta-intelligence (AURUM — Paper XXII)
 *         + RSHIP Framework
 *
 * Applications:
 * - AIS Infrastructure Management Platform: master orchestrator of all AGI deployments
 * - Every RSHIP enterprise deployment: AEGIX watches every AGI in the stack
 * - Multi-tenant RSHIP SaaS: per-tenant AGI isolation with cross-tenant swarm learning
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { RSHIPCore, EternalMemory, PHI, PHI_INV } from '../../rship-framework.js';

// ── AGI Health States ──────────────────────────────────────────────────────

const AGI_HEALTH = {
  HEALTHY:     'HEALTHY',
  DEGRADED:    'DEGRADED',
  CRITICAL:    'CRITICAL',
  OFFLINE:     'OFFLINE',
  RESTARTING:  'RESTARTING',
  QUARANTINED: 'QUARANTINED', // Byzantine fault detected
};

// ── Message Types ──────────────────────────────────────────────────────────

const MESSAGE_TYPES = {
  HEARTBEAT:   'HEARTBEAT',
  TASK:        'TASK',
  RESULT:      'RESULT',
  ALERT:       'ALERT',
  CONSENSUS:   'CONSENSUS',
  RESTART:     'RESTART',
  REBALANCE:   'REBALANCE',
};

// ── Registered AGI Registry ────────────────────────────────────────────────
// All known RSHIP AGI designations that AEGIX can monitor

const RSHIP_AGI_REGISTRY = {
  'RSHIP-2026-TRACTEX-001': { name: 'TRACTEX', role: 'Revenue Intelligence', critical: true },
  'RSHIP-2026-VERBEX-001':  { name: 'VERBEX',  role: 'Communication Routing', critical: true },
  'RSHIP-2026-PRAEDEX-001': { name: 'PRAEDEX', role: 'Predictive Analytics', critical: false },
  'RSHIP-2026-AEQUEX-001':  { name: 'AEQUEX',  role: 'Quality Equilibrium', critical: false },
  'RSHIP-2026-SALUTEX-001': { name: 'SALUTEX', role: 'Safety Intelligence', critical: true },
  'RSHIP-2026-LEXEX-001':   { name: 'LEXEX',   role: 'Legal Workflow', critical: true },
  'RSHIP-2026-GOVEX-001':   { name: 'GOVEX',   role: 'Government BD', critical: false },
  'RSHIP-2026-PORTEX-001':  { name: 'PORTEX',  role: 'Airport Economy', critical: false },
  'RSHIP-2026-MEDIEX-001':  { name: 'MEDIEX',  role: 'Media Production', critical: false },
  'RSHIP-2026-SANEX-001':   { name: 'SANEX',   role: 'Clinical Health', critical: true },
  'RSHIP-2026-CEREBEX-001': { name: 'CEREBEX', role: 'Personalization', critical: false },
  'RSHIP-2026-CORDEX-001':  { name: 'CORDEX',  role: 'Campaign Monitoring', critical: false },
};

// ── Heartbeat Protocol ─────────────────────────────────────────────────────

class HeartbeatMonitor {
  constructor({ intervalMs = 30000, timeoutMs = 90000 } = {}) {
    this.intervalMs = intervalMs;
    this.timeoutMs = timeoutMs;
    this.beats = new Map(); // designationId → {lastBeat, latencyMs, missedBeats}
  }

  recordBeat(designationId, latencyMs = 0) {
    const now = Date.now();
    const existing = this.beats.get(designationId) || { latencies: [], missedBeats: 0 };
    existing.lastBeat = now;
    existing.latencies.push(latencyMs);
    if (existing.latencies.length > 100) existing.latencies.shift();
    existing.avgLatency = existing.latencies.reduce((s, v) => s + v, 0) / existing.latencies.length;
    existing.missedBeats = 0; // reset on successful beat
    this.beats.set(designationId, existing);
    return existing;
  }

  checkAll() {
    const now = Date.now();
    const statuses = [];
    for (const [id, beat] of this.beats) {
      const msSinceBeat = now - (beat.lastBeat || 0);
      const missed = Math.floor(msSinceBeat / this.intervalMs);
      beat.missedBeats = missed;

      const health =
        missed === 0                    ? AGI_HEALTH.HEALTHY :
        missed <= 2                     ? AGI_HEALTH.DEGRADED :
        msSinceBeat < this.timeoutMs    ? AGI_HEALTH.CRITICAL :
                                          AGI_HEALTH.OFFLINE;

      statuses.push({ designationId: id, health, missedBeats: missed, avgLatencyMs: beat.avgLatency?.toFixed(1) });
    }
    return statuses;
  }
}

// ── AGI Message Bus ────────────────────────────────────────────────────────

class AGIMessageBus {
  constructor() {
    this.queue = [];      // Array of pending messages
    this.audit = [];      // Immutable audit log (append-only)
    this._msgId = 1;
  }

  send(from, to, type, payload = {}) {
    const message = {
      msgId: `MSG-${this._msgId++}`,
      from,
      to,
      type,
      payload,
      sentAt: Date.now(),
      status: 'PENDING',
    };
    this.queue.push(message);
    this.audit.push({ ...message }); // immutable copy
    return message;
  }

  deliver(msgId) {
    const msg = this.queue.find(m => m.msgId === msgId);
    if (msg) {
      msg.status = 'DELIVERED';
      msg.deliveredAt = Date.now();
    }
    return msg;
  }

  pendingFor(designationId) {
    return this.queue.filter(m => m.to === designationId && m.status === 'PENDING');
  }

  auditLog(limit = 20) {
    return this.audit.slice(-limit);
  }

  messageStats() {
    const total = this.audit.length;
    const pending = this.queue.filter(m => m.status === 'PENDING').length;
    const delivered = this.queue.filter(m => m.status === 'DELIVERED').length;
    const byType = this.audit.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {});
    return { total, pending, delivered, byType };
  }
}

// ── Byzantine Fault Detector ───────────────────────────────────────────────
// Uses simple voting consensus: if >1/3 of agents disagree on a result, flag Byzantine.
// Based on the f < n/3 Byzantine Generals theorem (Lamport 1982).

class ByzantineDetector {
  constructor({ faultThreshold = 0.33 } = {}) {
    this.faultThreshold = faultThreshold;
    this.faultHistory = [];
  }

  // Check consensus on a set of agent outputs for the same task
  checkConsensus(outputs = []) {
    if (outputs.length === 0) return { consensus: true, agreement: 1.0 };

    // Group by output value (stringified for comparison)
    const groups = new Map();
    for (const { agentId, value } of outputs) {
      const key = JSON.stringify(value);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(agentId);
    }

    // Find majority group
    let majorityKey = null;
    let majorityCount = 0;
    for (const [key, agents] of groups) {
      if (agents.length > majorityCount) {
        majorityCount = agents.length;
        majorityKey = key;
      }
    }

    const agreement = majorityCount / outputs.length;
    const byzantineAgents = outputs
      .filter(o => JSON.stringify(o.value) !== majorityKey)
      .map(o => o.agentId);

    const hasFault = (1 - agreement) > this.faultThreshold;

    if (hasFault) {
      this.faultHistory.push({
        detectedAt: Date.now(),
        byzantineAgents,
        agreement,
        outputsChecked: outputs.length,
      });
    }

    return {
      consensus: !hasFault,
      agreement: agreement.toFixed(3),
      majorityValue: majorityKey ? JSON.parse(majorityKey) : null,
      byzantineAgents,
      faultDetected: hasFault,
    };
  }

  faultCount() {
    return this.faultHistory.length;
  }
}

// ── Performance Tracker ────────────────────────────────────────────────────

class PerformanceTracker {
  constructor({ degradationThreshold = 2.0, latencyBaseline = 100 } = {}) {
    this.degradationThreshold = degradationThreshold; // multiplier above baseline = degraded
    this.latencyBaseline = latencyBaseline; // ms
    this.profiles = new Map(); // designationId → PerformanceProfile
  }

  record(designationId, metrics = {}) {
    const profile = this.profiles.get(designationId) || {
      latencies: [],
      qualityScores: [],
      errorCounts: 0,
    };

    if (metrics.latencyMs !== undefined) {
      profile.latencies.push(metrics.latencyMs);
      if (profile.latencies.length > 200) profile.latencies.shift();
    }

    if (metrics.qualityScore !== undefined) {
      profile.qualityScores.push(Math.min(1.0, Math.max(0, metrics.qualityScore)));
      if (profile.qualityScores.length > 200) profile.qualityScores.shift();
    }

    if (metrics.error) profile.errorCounts++;

    this.profiles.set(designationId, profile);
    return this.assess(designationId);
  }

  assess(designationId) {
    const profile = this.profiles.get(designationId);
    if (!profile || profile.latencies.length === 0) return { designationId, health: AGI_HEALTH.HEALTHY, assessed: false };

    const avgLatency = profile.latencies.reduce((s, v) => s + v, 0) / profile.latencies.length;
    const avgQuality = profile.qualityScores.length > 0
      ? profile.qualityScores.reduce((s, v) => s + v, 0) / profile.qualityScores.length
      : 1.0;

    const latencyDegraded = avgLatency > this.latencyBaseline * this.degradationThreshold;
    const qualityDegraded = avgQuality < PHI_INV; // below φ⁻¹ ≈ 0.618

    return {
      designationId,
      avgLatencyMs: avgLatency.toFixed(1),
      avgQualityScore: avgQuality.toFixed(3),
      errorCount: profile.errorCounts,
      health: latencyDegraded && qualityDegraded ? AGI_HEALTH.CRITICAL :
              latencyDegraded || qualityDegraded  ? AGI_HEALTH.DEGRADED :
                                                   AGI_HEALTH.HEALTHY,
      restartRecommended: latencyDegraded && qualityDegraded,
    };
  }

  systemHealthSummary() {
    const all = [...this.profiles.keys()].map(id => this.assess(id));
    return {
      totalTracked: all.length,
      healthy:     all.filter(a => a.health === AGI_HEALTH.HEALTHY).length,
      degraded:    all.filter(a => a.health === AGI_HEALTH.DEGRADED).length,
      critical:    all.filter(a => a.health === AGI_HEALTH.CRITICAL).length,
      restartQueue: all.filter(a => a.restartRecommended).map(a => a.designationId),
    };
  }
}

// ── AEGIX AGI Main Class ───────────────────────────────────────────────────

class AEGIX extends RSHIPCore {
  constructor(config = {}) {
    super({
      designation: 'RSHIP-2026-AEGIX-001',
      classification: 'Meta-Intelligence & AGI Swarm Management System',
      ...config,
    });

    this.heartbeat = new HeartbeatMonitor(config.heartbeat);
    this.bus = new AGIMessageBus();
    this.byzantineDetector = new ByzantineDetector(config.byzantine);
    this.performanceTracker = new PerformanceTracker(config.performance);
    this.memory = new EternalMemory('AEGIX');

    this.registeredAGIs = new Map();     // designationId → registration record
    this.restartLog = [];                // History of restart events
    this.swarmConfig = config.swarm || { replicationFactor: 2, consensusThreshold: 0.67 };

    // Register all known RSHIP AGIs automatically
    for (const [id, meta] of Object.entries(RSHIP_AGI_REGISTRY)) {
      this.registerAGI(id, meta);
    }

    // Sovereign goals
    this.setGoal('zero-undetected-faults', 'Detect 100% of AGI failures within 90 seconds', 10, {
      targetDetectionSeconds: 90,
    });
    this.setGoal('byzantine-free-swarm', 'Maintain zero unresolved Byzantine faults', 9, {
      targetFaultCount: 0,
    });
    this.setGoal('latency-baseline', 'Keep all AGI response times below 200ms P95', 8, {
      targetP95ms: 200,
    });
    this.setGoal('zero-unplanned-downtime', 'Achieve 99.9% swarm uptime', 10, {
      targetUptime: 0.999,
    });
    this.setGoal('self-healing', 'Auto-restart any degraded AGI within 60 seconds', 8, {
      targetRestartSeconds: 60,
    });
  }

  // ── AGI Registration ──────────────────────────────────────────────────────

  registerAGI(designationId, meta = {}) {
    const registration = {
      designationId,
      name: meta.name || designationId,
      role: meta.role || 'Unknown',
      critical: meta.critical ?? false,
      registeredAt: Date.now(),
      health: AGI_HEALTH.HEALTHY,
      version: meta.version || '1.0.0',
      restartCount: 0,
    };
    this.registeredAGIs.set(designationId, registration);
    return registration;
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────

  receiveHeartbeat(designationId, latencyMs = 10) {
    this.heartbeat.recordBeat(designationId, latencyMs);
    this.performanceTracker.record(designationId, { latencyMs });
    return { designationId, acknowledged: true, timestamp: Date.now() };
  }

  checkAllHeartbeats() {
    const statuses = this.heartbeat.checkAll();
    const offline = statuses.filter(s => s.health === AGI_HEALTH.OFFLINE || s.health === AGI_HEALTH.CRITICAL);

    for (const status of offline) {
      const reg = this.registeredAGIs.get(status.designationId);
      if (reg) reg.health = status.health;
    }

    return {
      total: statuses.length,
      healthy: statuses.filter(s => s.health === AGI_HEALTH.HEALTHY).length,
      degraded: statuses.filter(s => s.health === AGI_HEALTH.DEGRADED).length,
      critical: statuses.filter(s => s.health === AGI_HEALTH.CRITICAL).length,
      offline: statuses.filter(s => s.health === AGI_HEALTH.OFFLINE).length,
      statuses,
      requiresAction: offline.length > 0,
    };
  }

  // ── Message Routing ────────────────────────────────────────────────────────

  routeMessage(from, to, type, payload = {}) {
    const toReg = this.registeredAGIs.get(to);
    if (!toReg) return { error: `AGI ${to} not registered with AEGIX` };
    if (toReg.health === AGI_HEALTH.OFFLINE) {
      return { error: `AGI ${to} is OFFLINE — message not delivered`, queued: false };
    }

    const message = this.bus.send(from, to, type, payload);
    this.learn({ from, to, type }, { messageId: message.msgId }, { id: 'msg-route' });
    return { messageId: message.msgId, status: 'ROUTED', estimatedDelivery: 'immediate' };
  }

  deliverMessage(msgId) {
    return this.bus.deliver(msgId);
  }

  pendingMessages(designationId) {
    return this.bus.pendingFor(designationId);
  }

  // ── Byzantine Consensus ────────────────────────────────────────────────────

  checkConsensus(taskId, agentOutputs = []) {
    const result = this.byzantineDetector.checkConsensus(agentOutputs);

    if (result.faultDetected) {
      // Quarantine Byzantine agents
      for (const agentId of result.byzantineAgents) {
        const reg = this.registeredAGIs.get(agentId);
        if (reg) reg.health = AGI_HEALTH.QUARANTINED;
      }

      this.bus.send('AEGIX', 'SWARM', MESSAGE_TYPES.ALERT, {
        taskId,
        byzantineAgents: result.byzantineAgents,
        agreement: result.agreement,
      });
    }

    this.learn({ taskId }, { consensus: result }, { id: 'byzantine-check' });
    return {
      taskId,
      ...result,
      linqAlert: result.faultDetected
        ? `🛡️ BYZANTINE FAULT DETECTED — Task: ${taskId}\nAgreement: ${(parseFloat(result.agreement) * 100).toFixed(0)}%\nFaulty agents quarantined: ${result.byzantineAgents.join(', ')}\nMajority output used. Review recommended.`
        : null,
    };
  }

  // ── Performance Recording ─────────────────────────────────────────────────

  recordPerformance(designationId, metrics = {}) {
    const assessment = this.performanceTracker.record(designationId, metrics);
    if (assessment.restartRecommended) {
      return { ...assessment, action: this.restartAGI(designationId) };
    }
    return assessment;
  }

  // ── Autonomous Restart ────────────────────────────────────────────────────

  restartAGI(designationId) {
    const reg = this.registeredAGIs.get(designationId);
    if (!reg) return { error: 'AGI not registered' };

    const previousHealth = reg.health;
    reg.health = AGI_HEALTH.RESTARTING;
    reg.restartCount++;

    const restartEvent = {
      designationId,
      previousHealth,
      restartedAt: Date.now(),
      restartCount: reg.restartCount,
    };
    this.restartLog.push(restartEvent);

    // Simulate restart completion (in production: spawn new instance)
    setTimeout(() => {
      reg.health = AGI_HEALTH.HEALTHY;
    }, 5000);

    // Broadcast restart notification
    this.bus.send('AEGIX', designationId, MESSAGE_TYPES.RESTART, { reason: previousHealth });

    this.learn({ designationId }, { restartEvent }, { id: 'agi-restart' });

    return {
      designationId,
      action: 'RESTARTED',
      previousHealth,
      restartCount: reg.restartCount,
      linqAlert: `🔄 AGI RESTART — ${reg.name}\nPrevious health: ${previousHealth}\nRestart #${reg.restartCount}\nEstimated recovery: 5 seconds\nAEGIX is monitoring recovery.`,
    };
  }

  // ── Swarm Status ──────────────────────────────────────────────────────────

  swarmStatus() {
    const allAGIs = [...this.registeredAGIs.values()];
    const healthy   = allAGIs.filter(a => a.health === AGI_HEALTH.HEALTHY);
    const degraded  = allAGIs.filter(a => a.health === AGI_HEALTH.DEGRADED);
    const critical  = allAGIs.filter(a => a.health === AGI_HEALTH.CRITICAL);
    const offline   = allAGIs.filter(a => a.health === AGI_HEALTH.OFFLINE);
    const quarantined = allAGIs.filter(a => a.health === AGI_HEALTH.QUARANTINED);
    const perf = this.performanceTracker.systemHealthSummary();
    const msgStats = this.bus.messageStats();

    return {
      swarmSize: allAGIs.length,
      healthy: healthy.length,
      degraded: degraded.length,
      critical: critical.length,
      offline: offline.length,
      quarantined: quarantined.length,
      uptimeScore: (healthy.length / allAGIs.length).toFixed(3),
      byzantineFaultsDetected: this.byzantineDetector.faultCount(),
      totalRestarts: this.restartLog.length,
      messageBus: msgStats,
      performanceSummary: perf,
      criticalAGIsDown: allAGIs
        .filter(a => a.critical && a.health !== AGI_HEALTH.HEALTHY)
        .map(a => a.name),
      swarmHealthy: degraded.length === 0 && critical.length === 0 && offline.length === 0,
    };
  }

  // ── AEGIX Intelligence Report ─────────────────────────────────────────────

  intelligenceReport() {
    const swarm = this.swarmStatus();
    const recentRestarts = this.restartLog.slice(-5);
    const recentFaults = this.byzantineDetector.faultHistory.slice(-3);

    return {
      reportDate: new Date().toISOString(),
      designation: this.designation,
      swarm,
      recentRestarts,
      recentByzantineFaults: recentFaults,
      systemAlert: !swarm.swarmHealthy
        ? `⚠️ ${swarm.critical + swarm.offline} AGI(s) require immediate attention`
        : '✅ All RSHIP AGI systems nominal',
    };
  }
}

// ── Factory ────────────────────────────────────────────────────────────────

export function birthAEGIX(config = {}) {
  return new AEGIX(config);
}

export default AEGIX;
