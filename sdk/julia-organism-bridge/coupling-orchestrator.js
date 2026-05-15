/**
 * COUPLING ORCHESTRATOR
 *
 * Boots Julia bridge, maintains sync cadence with JS runtime, exposes optional
 * HTTP command endpoint for Go gateway proxying, and applies resilience
 * controls (retry + circuit breaker + degraded mode).
 */

const http = require('http');
const { createJuliaBridge } = require('./julia-organism-bridge');
const {
  createEnvelope,
  normalizeState,
  successResult,
  errorResult,
} = require('./coupling-contract');

class CouplingOrchestrator {
  constructor(config = {}) {
    this.coreRuntime = config.coreRuntime || null;
    this.bridgeConfig = config.bridgeConfig || {};
    this.bridge = null;

    this.syncIntervalMs = config.syncIntervalMs || 1500;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryBackoffMs = config.retryBackoffMs || 250;

    this.circuitThreshold = config.circuitThreshold || 4;
    this.circuitCooldownMs = config.circuitCooldownMs || 10000;
    this.circuitFailures = 0;
    this.circuitOpenUntil = 0;

    this.syncTimer = null;
    this.server = null;
    this.port = config.port || Number(process.env.ORGANISM_COUPLING_PORT || 8874);

    this.state = {
      connected: false,
      degraded: false,
      lastSyncAt: 0,
      lastSuccessAt: 0,
      lastFailureAt: 0,
      syncLagMs: 0,
      heartbeatCount: 0,
      coherence: 1.0,
      health: 1.0,
      phiAccumulated: 0,
      clean_score: 0,
      protocol: 'unknown',
      lastError: '',
    };
  }

  async start() {
    await this.connectBridge();
    this.startSyncLoop();
    await this.startHttpServer();
    return this.healthSnapshot();
  }

  async stop() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.server) {
      await new Promise((resolve) => this.server.close(() => resolve()));
      this.server = null;
    }
    if (this.bridge?.disconnect) {
      this.bridge.disconnect();
    }
    this.state.connected = false;
  }

  async connectBridge() {
    this.bridge = await createJuliaBridge(this.bridgeConfig);
    this.state.connected = true;
    this.state.degraded = !!this.bridge.mock;
    this.state.lastSuccessAt = Date.now();
  }

  startSyncLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = setInterval(async () => {
      try {
        await this.syncOnce();
      } catch (_) {
        // keep loop alive
      }
    }, this.syncIntervalMs);
  }

  async syncOnce() {
    const id = `sync-${Date.now()}`;
    const result = await this.withResilience(async () => {
      if (this.coreRuntime && this.bridge?.synchronize) {
        await this.bridge.synchronize(this.coreRuntime);
      }

      let status = {};
      if (this.bridge?.getStatus) {
        status = await this.bridge.getStatus();
      }

      let virtual = {};
      if (this.bridge?.getVirtualStatus) {
        virtual = await this.bridge.getVirtualStatus();
      }

      return { status, virtual };
    });

    const merged = {
      ...(result.status?.result || result.status || {}),
      ...(result.virtual?.result || result.virtual || {}),
    };
    const normalized = normalizeState(merged);
    this.state = {
      ...this.state,
      ...normalized,
      connected: true,
      degraded: false,
      lastSyncAt: Date.now(),
      lastSuccessAt: Date.now(),
      syncLagMs: 0,
      heartbeatCount: Number(merged.heartbeatCount || merged.heartbeat_count || this.state.heartbeatCount || 0),
      lastError: '',
    };
    return successResult(id, this.healthSnapshot());
  }

  async executeCommand(envelope) {
    const msg = this.normalizeEnvelope(envelope);
    if (!msg.command) {
      return errorResult(msg.id, 'bad_command', 'command is required');
    }

    try {
      if (this.isCircuitOpen()) {
        return errorResult(msg.id, 'circuit_open', 'coupling circuit breaker open');
      }

      const result = await this.withResilience(async () => {
        switch (msg.command) {
          case 'virtualStatus':
            return this.bridge.getVirtualStatus();
          case 'protocolPulse':
            return this.bridge.protocolPulse(msg.params.signal || []);
          case 'applyMathematics':
            return this.bridge.applyMathematics(msg.params.signal || []);
          case 'status':
            return this.bridge.getStatus();
          case 'gatewayOutcome':
            return this.ingestGatewayOutcome(msg.params || {});
          default:
            throw new Error(`Unknown command: ${msg.command}`);
        }
      });

      const payload = result?.result || result || {};
      const normalized = normalizeState(payload);
      this.state = {
        ...this.state,
        ...normalized,
        connected: true,
        degraded: false,
        lastSuccessAt: Date.now(),
        lastSyncAt: Date.now(),
        lastError: '',
      };
      return successResult(msg.id, payload);
    } catch (err) {
      return errorResult(msg.id, 'command_failed', err.message);
    }
  }

  async ingestGatewayOutcome(outcome) {
    if (this.bridge?.importState) {
      await this.bridge.importState({
        phiAccumulated: this.state.phiAccumulated + Number(outcome.latency_ms || 0) * 0.0001,
        health: this.state.health,
        coherence: this.state.coherence,
      });
    }
    return {
      status: 'ingested',
      model_id: outcome.model_id,
      success: !!outcome.success,
      latency_ms: Number(outcome.latency_ms || 0),
    };
  }

  async withResilience(fn) {
    let attempt = 0;
    // retry with exponential backoff
    while (attempt < this.retryAttempts) {
      try {
        const value = await fn();
        this.recordSuccess();
        return value;
      } catch (err) {
        attempt += 1;
        this.recordFailure(err);
        if (attempt >= this.retryAttempts) {
          throw err;
        }
        await sleep(this.retryBackoffMs * attempt);
      }
    }
    throw new Error('resilience exhausted');
  }

  recordSuccess() {
    this.circuitFailures = 0;
    this.circuitOpenUntil = 0;
    this.state.connected = true;
    this.state.degraded = false;
    this.state.lastSuccessAt = Date.now();
  }

  recordFailure(err) {
    this.circuitFailures += 1;
    this.state.connected = false;
    this.state.degraded = true;
    this.state.lastFailureAt = Date.now();
    this.state.lastError = err?.message || String(err);

    if (this.circuitFailures >= this.circuitThreshold) {
      this.circuitOpenUntil = Date.now() + this.circuitCooldownMs;
    }
  }

  isCircuitOpen() {
    if (!this.circuitOpenUntil) return false;
    if (Date.now() >= this.circuitOpenUntil) {
      this.circuitOpenUntil = 0;
      this.circuitFailures = 0;
      return false;
    }
    return true;
  }

  normalizeEnvelope(input = {}) {
    const id = input.id || `gw-${Date.now()}`;
    return createEnvelope(input.command, input.params || {}, id);
  }

  async startHttpServer() {
    if (this.server) return;
    this.server = http.createServer(async (req, res) => {
      try {
        if (req.method === 'GET' && req.url === '/health') {
          return this.writeJson(res, 200, successResult('health', this.healthSnapshot()));
        }
        if (req.method === 'GET' && req.url === '/metrics') {
          return this.writeJson(res, 200, successResult('metrics', this.metricsSnapshot()));
        }
        if (req.method === 'POST' && req.url === '/command') {
          const body = await this.readJsonBody(req);
          const result = await this.executeCommand(body);
          const code = result.status === 'ok' ? 200 : 503;
          return this.writeJson(res, code, result);
        }
        return this.writeJson(res, 404, errorResult('http', 'not_found', 'route not found'));
      } catch (err) {
        return this.writeJson(res, 500, errorResult('http', 'internal_error', err.message));
      }
    });

    await new Promise((resolve) => this.server.listen(this.port, resolve));
  }

  async readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8') || '{}';
    return JSON.parse(raw);
  }

  writeJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(payload));
  }

  healthSnapshot() {
    const now = Date.now();
    const lastSyncAt = this.state.lastSyncAt || this.state.lastSuccessAt || 0;
    const syncLagMs = lastSyncAt ? Math.max(0, now - lastSyncAt) : 0;
    return {
      ...this.state,
      syncLagMs,
      circuitOpen: this.isCircuitOpen(),
      circuitFailures: this.circuitFailures,
    };
  }

  metricsSnapshot() {
    const h = this.healthSnapshot();
    return {
      connected: h.connected,
      degraded: h.degraded,
      syncLagMs: h.syncLagMs,
      heartbeatCount: h.heartbeatCount,
      coherence: h.coherence,
      health: h.health,
      phiAccumulated: h.phiAccumulated,
      clean_score: h.clean_score,
      protocol: h.protocol,
      circuitOpen: h.circuitOpen,
      circuitFailures: h.circuitFailures,
    };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  CouplingOrchestrator,
};
