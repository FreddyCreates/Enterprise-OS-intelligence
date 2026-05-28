import crypto from "node:crypto";
import { createComputeReceipt, createSignalReceipt, createGovernanceReceipt } from "./receipts.js";

class BaseAgent {
  constructor(agentConfig) {
    this.id = agentConfig.id;
    this.class = agentConfig.class;
    this.authorityLevel = agentConfig.authorityLevel;
    this.scope = agentConfig.scope;
    this.allowedActions = agentConfig.allowedActions;
  }
}

export class MarketObserverAgent extends BaseAgent {
  observe(snapshot) {
    return {
      agentId: this.id,
      observation: snapshot,
      receipt: createComputeReceipt({
        agentId: this.id,
        strategyId: "market-observer",
        inputHash: crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex"),
        modelVersion: "observer-v1",
        outcome: "observation-recorded",
      }),
    };
  }
}

export class SignalAgent extends BaseAgent {
  generate(observation) {
    const signal = observation.change >= 0 ? "LONG" : "SHORT";
    const confidence = Math.min(0.99, Math.abs(observation.change) + 0.55);
    return {
      agentId: this.id,
      symbol: observation.symbol,
      signal,
      confidence,
      receipt: createSignalReceipt({
        agentId: this.id,
        symbol: observation.symbol,
        signal,
        confidence,
        regime: observation.regime,
      }),
    };
  }
}

export class RiskAgent extends BaseAgent {
  review(riskResult) {
    return {
      agentId: this.id,
      approved: riskResult.passed,
      blockingActions: riskResult.blockingActions,
    };
  }
}

export class GovernanceAgent extends BaseAgent {
  approve(action, target, approved, notes = "") {
    return createGovernanceReceipt({
      actor: this.id,
      action,
      target,
      approved,
      notes,
    });
  }
}

export class AuditAgent extends BaseAgent {
  record(ledger, receipt) {
    return ledger.write(receipt);
  }
}

export function createAgent(agentConfig) {
  switch (agentConfig.class) {
    case "MarketObserver":
      return new MarketObserverAgent(agentConfig);
    case "SignalAgent":
      return new SignalAgent(agentConfig);
    case "RiskAgent":
      return new RiskAgent(agentConfig);
    case "AuditAgent":
      return new AuditAgent(agentConfig);
    default:
      return new GovernanceAgent(agentConfig);
  }
}
