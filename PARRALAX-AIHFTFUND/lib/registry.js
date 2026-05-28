import { readFileSync } from "node:fs";

function loadJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

const agentRegistry = loadJson("../config/agent-registry.json");
const protocolRegistry = loadJson("../config/protocol-registry.json");
const riskRegistry = loadJson("../config/risk-gates.json");
const assetRegistry = loadJson("../config/asset-registry.json");
const strategyRegistry = loadJson("../config/strategy-registry.json");

class BaseRegistry {
  constructor(entries = [], key = "id") {
    this.key = key;
    this.entries = new Map(entries.map((entry) => [entry[key], entry]));
  }

  list() {
    return [...this.entries.values()];
  }

  get(id) {
    return this.entries.get(id) ?? null;
  }

  register(entry) {
    this.entries.set(entry[this.key], entry);
    return entry;
  }
}

export class AgentRegistry extends BaseRegistry {
  constructor() {
    super(agentRegistry.agents);
  }
}

export class ProtocolRegistry extends BaseRegistry {
  constructor() {
    super(protocolRegistry.protocols);
  }
}

export class RiskGateRegistry extends BaseRegistry {
  constructor() {
    super(riskRegistry.riskGates);
  }
}

export class AssetRegistry extends BaseRegistry {
  constructor() {
    super(assetRegistry.assets);
  }
}

export class StrategyRegistry extends BaseRegistry {
  constructor() {
    super(strategyRegistry.strategies);
  }
}

export function createRegistries() {
  return {
    agents: new AgentRegistry(),
    protocols: new ProtocolRegistry(),
    risk: new RiskGateRegistry(),
    assets: new AssetRegistry(),
    strategies: new StrategyRegistry(),
  };
}
