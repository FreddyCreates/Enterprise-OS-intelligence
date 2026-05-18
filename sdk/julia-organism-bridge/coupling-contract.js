/**
 * COUPLING CONTRACT
 *
 * Canonical message/state/error/result normalization shared across rings.
 */

function nowMs() {
  return Date.now();
}

function createEnvelope(command, params = {}, id = `MSG-${nowMs()}-${Math.random().toString(36).slice(2)}`) {
  return {
    id,
    command,
    params: params || {},
    timestamp: nowMs(),
  };
}

function normalizeState(raw = {}) {
  return {
    coherence: asNumber(raw.coherence ?? raw.core_coherence ?? raw.coreCoherence, 1.0),
    health: asNumber(raw.health ?? raw.core_health ?? raw.coreHealth, 1.0),
    phiAccumulated: asNumber(raw.phiAccumulated ?? raw.phi_accumulated, 0),
    clean_score: asNumber(raw.clean_score ?? raw.cleanScore, 0),
    protocol: asString(raw.protocol ?? raw.virtual_protocol ?? 'unknown'),
  };
}

function successResult(id, result = {}) {
  return {
    id,
    status: 'ok',
    result,
    timestamp: nowMs(),
  };
}

function errorResult(id, code, message, details) {
  return {
    id,
    status: 'error',
    error: { code, message, details },
    timestamp: nowMs(),
  };
}

function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asString(v, fallback = '') {
  return typeof v === 'string' ? v : fallback;
}

module.exports = {
  createEnvelope,
  normalizeState,
  successResult,
  errorResult,
};
