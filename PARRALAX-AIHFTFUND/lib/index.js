import { createRegistries } from "./registry.js";
import { ReceiptLedger } from "./receipts.js";
import { CapitalAllocator, KillSwitch, RiskGateEngine } from "./risk.js";
import { TokenEngine, NFTEngine } from "./assets.js";
import { createAgent } from "./agents.js";
import { MarketMemory, PaperExecutionEngine } from "./execution.js";

export class ParralaxStack {
  constructor() {
    this.registries = createRegistries();
    this.ledger = new ReceiptLedger();
    this.risk = new RiskGateEngine(this.registries.risk.list());
    this.killSwitch = new KillSwitch();
    this.capital = new CapitalAllocator();
    this.tokens = new TokenEngine();
    this.nfts = new NFTEngine();
    this.execution = new PaperExecutionEngine();
    this.memory = new MarketMemory();
  }

  createAgent(agentId) {
    const config = this.registries.agents.get(agentId);
    if (!config) {
      throw new Error(`Unknown agent: ${agentId}`);
    }
    return createAgent(config);
  }
}

export * from "./registry.js";
export * from "./receipts.js";
export * from "./risk.js";
export * from "./assets.js";
export * from "./agents.js";
export * from "./execution.js";
