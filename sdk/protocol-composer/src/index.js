const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;
const HEARTBEAT_MS = 873;

function safeUnref(handle) {
  handle?.unref?.();
  return handle;
}

function normalizeProtocol(protocol) {
  if (typeof protocol === "function") {
    return {
      execute: protocol,
    };
  }

  if (protocol && typeof protocol.execute === "function") {
    return protocol;
  }

  throw new Error("Protocol must be a function or an object with execute(input)");
}

function topologicalSort(states) {
  const indegree = new Map();
  const dependents = new Map();

  states.forEach((state, name) => {
    indegree.set(name, state.dependencies.size);
    dependents.set(name, new Set(state.dependents));
  });

  const queue = [...indegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([name]) => name)
    .sort();
  const order = [];

  while (queue.length > 0) {
    const name = queue.shift();
    order.push(name);

    dependents.get(name)?.forEach((dependent) => {
      indegree.set(dependent, indegree.get(dependent) - 1);
      if (indegree.get(dependent) === 0) {
        queue.push(dependent);
        queue.sort();
      }
    });
  }

  if (order.length !== states.size) {
    throw new Error("Protocol dependency graph contains a cycle");
  }

  return order;
}

function normalizeDelta(delta) {
  let result = Math.abs(delta) % (2 * Math.PI);
  if (result > Math.PI) {
    result = (2 * Math.PI) - result;
  }
  return result;
}

export class ProtocolComposer {
  constructor({ autoHeartbeat = true } = {}) {
    this.protocols = new Map();
    this.currentBeat = 0;
    this.totalExecutions = 0;
    this.totalExecTimeMs = 0;
    this._heartbeat = null;

    if (autoHeartbeat) {
      this.start();
    }
  }

  start() {
    if (this._heartbeat) {
      return this;
    }

    this._heartbeat = safeUnref(setInterval(() => {
      this.currentBeat += 1;
    }, HEARTBEAT_MS));
    return this;
  }

  stop() {
    clearInterval(this._heartbeat);
    this._heartbeat = null;
    return this;
  }

  registerProtocol(name, protocol, dependencies = []) {
    const normalized = normalizeProtocol(protocol);
    const dependencySet = new Set(dependencies);
    const existing = this.protocols.get(name);
    const state = existing || {
      name,
      protocol: normalized,
      active: true,
      dependencies: new Set(),
      dependents: new Set(),
      execCount: 0,
      lastExecTime: 0,
      lastOutput: null,
    };

    state.protocol = normalized;
    this.protocols.set(name, state);

    // Clear previous reverse links before rebuilding.
    this.protocols.forEach((candidate) => candidate.dependents.delete(name));
    state.dependencies = dependencySet;

    dependencySet.forEach((dependency) => {
      if (!this.protocols.has(dependency)) {
        this.protocols.set(dependency, {
          name: dependency,
          protocol: { execute: (input) => input },
          active: true,
          dependencies: new Set(),
          dependents: new Set([name]),
          execCount: 0,
          lastExecTime: 0,
          lastOutput: null,
        });
      } else {
        this.protocols.get(dependency).dependents.add(name);
      }
    });

    return this;
  }

  _executeWithDependencies(name, input, cache) {
    if (cache.has(name)) {
      return cache.get(name);
    }

    const state = this.protocols.get(name);
    if (!state) {
      throw new Error(`Protocol not found: ${name}`);
    }

    let resolvedInput = input;
    state.dependencies.forEach((dependency) => {
      resolvedInput = this._executeWithDependencies(dependency, resolvedInput, cache);
    });

    if (!state.active) {
      cache.set(name, state.lastOutput);
      return state.lastOutput;
    }

    const startedAt = Date.now();
    const output = state.protocol.execute(resolvedInput);
    const elapsed = Date.now() - startedAt;

    state.execCount += 1;
    state.lastExecTime = elapsed;
    state.lastOutput = output;

    this.totalExecutions += 1;
    this.totalExecTimeMs += elapsed;

    cache.set(name, output);
    return output;
  }

  execute(protocolName, input = {}) {
    const cache = new Map();
    return this._executeWithDependencies(protocolName, input, cache);
  }

  executeAll(input = {}) {
    const cache = new Map();
    const results = {};
    const order = topologicalSort(this.protocols);

    order.forEach((name) => {
      const state = this.protocols.get(name);
      if (!state?.active) {
        return;
      }
      results[name] = this._executeWithDependencies(name, input, cache);
    });

    return results;
  }

  chain(protocolNames = []) {
    protocolNames.forEach((name, index) => {
      const dependency = index === 0 ? [] : [protocolNames[index - 1]];
      const existing = this.protocols.get(name);
      if (!existing) {
        this.registerProtocol(name, (input) => input, dependency);
      } else {
        this.registerProtocol(name, existing.protocol, dependency);
      }
    });
    return this;
  }

  parallel(protocolNames = []) {
    protocolNames.forEach((name) => {
      const existing = this.protocols.get(name);
      if (!existing) {
        this.registerProtocol(name, (input) => input, []);
      } else {
        this.registerProtocol(name, existing.protocol, []);
      }
    });
    return this;
  }

  fanOut(source, targets = []) {
    targets.forEach((target) => {
      const existing = this.protocols.get(target);
      if (!existing) {
        this.registerProtocol(target, (input) => input, [source]);
      } else {
        const dependencies = new Set(existing.dependencies);
        dependencies.add(source);
        this.registerProtocol(target, existing.protocol, [...dependencies]);
      }
    });
    return this;
  }

  fanIn(sources = [], target) {
    const existing = this.protocols.get(target);
    if (!existing) {
      this.registerProtocol(target, (input) => input, sources);
    } else {
      this.registerProtocol(target, existing.protocol, sources);
    }
    return this;
  }

  syncPhase(protocolA, protocolB) {
    const stateA = this.protocols.get(protocolA);
    const stateB = this.protocols.get(protocolB);
    if (!stateA || !stateB) {
      return 0;
    }

    const phaseA = (stateA.execCount * PHI) % (2 * Math.PI);
    const phaseB = (stateB.execCount * PHI) % (2 * Math.PI);
    const delta = normalizeDelta(phaseA - phaseB);
    return Number((((Math.cos(delta) + 1) / 2)).toFixed(4));
  }

  getSyncMatrix() {
    const matrix = {};
    const names = [...this.protocols.keys()].sort();
    names.forEach((left) => {
      matrix[left] = {};
      names.forEach((right) => {
        matrix[left][right] = left === right ? 1 : this.syncPhase(left, right);
      });
    });
    return matrix;
  }

  getMetrics() {
    const activeProtocols = [...this.protocols.values()].filter((state) => state.active);
    return {
      totalProtocols: this.protocols.size,
      activeProtocols: activeProtocols.length,
      totalExecutions: this.totalExecutions,
      avgExecTimeMs: this.totalExecutions ? Number((this.totalExecTimeMs / this.totalExecutions).toFixed(4)) : 0,
      currentBeat: this.currentBeat,
      phiRatio: Number(((this.currentBeat + PHI) / Math.max(activeProtocols.length || 1, 1)).toFixed(4)),
    };
  }

  getProtocolState(name) {
    const state = this.protocols.get(name);
    if (!state) {
      return null;
    }

    return {
      name: state.name,
      active: state.active,
      dependencies: [...state.dependencies],
      dependents: [...state.dependents],
      execCount: state.execCount,
      lastExecTime: state.lastExecTime,
      lastOutput: state.lastOutput,
    };
  }

  getAllStates() {
    return [...this.protocols.keys()]
      .sort()
      .map((name) => this.getProtocolState(name));
  }

  activateProtocol(name) {
    const state = this.protocols.get(name);
    if (state) {
      state.active = true;
    }
    return this;
  }

  deactivateProtocol(name) {
    const state = this.protocols.get(name);
    if (state) {
      state.active = false;
    }
    return this;
  }

  getCompositionGraph() {
    const graph = new Map();
    [...this.protocols.keys()].sort().forEach((name) => {
      const state = this.protocols.get(name);
      graph.set(name, {
        protocol: state.name,
        dependencies: [...state.dependencies],
        dependents: [...state.dependents],
      });
    });
    return graph;
  }
}

export function createComposer(config = {}) {
  return new ProtocolComposer(config);
}

export { HEARTBEAT_MS, PHI, PHI_INV };

export default {
  HEARTBEAT_MS,
  PHI,
  PHI_INV,
  ProtocolComposer,
  createComposer,
};
