import { ParralaxStack } from "../lib/index.js";

const stack = new ParralaxStack();

const observer = stack.createAgent("observer-market-001");
const signalAgent = stack.createAgent("signal-alpha-001");
const riskAgent = stack.createAgent("risk-gate-001");
const auditAgent = stack.createAgent("audit-ledger-001");
const governanceAgent = stack.createAgent("governance-council-001");

const observation = observer.observe({
  symbol: "BTC-USD",
  price: 68250,
  change: 0.017,
  volatility: 0.032,
  regime: "TRENDING"
});

const signal = signalAgent.generate(observation.observation);
const riskResult = stack.risk.evaluate({
  drawdown: 0.02,
  volatility: observation.observation.volatility,
  exposure: 0.08,
  leverage: 1.2,
  killSwitch: stack.killSwitch.active
});
const riskReview = riskAgent.review(riskResult);

let trade = null;
if (riskReview.approved) {
  const governanceReceipt = governanceAgent.approve("trade-authorization", "BTC-USD", true, "paper execution allowed");
  auditAgent.record(stack.ledger, governanceReceipt);
  trade = stack.execution.execute({
    venue: "paper",
    symbol: "BTC-USD",
    side: signal.signal === "LONG" ? "BUY" : "SELL",
    quantity: 0.25,
    price: observation.observation.price
  });
  stack.memory.write({
    symbol: observation.observation.symbol,
    signal: signal.signal,
    confidence: signal.confidence,
    outcome: trade.fill.status
  });
  auditAgent.record(stack.ledger, signal.receipt);
  auditAgent.record(stack.ledger, observation.receipt);
  auditAgent.record(stack.ledger, trade.receipt);
}

console.log(JSON.stringify({
  observation,
  signal,
  riskResult,
  trade,
  portfolio: stack.execution.portfolio(),
  receipts: stack.ledger.list().length,
  memoryEntries: stack.memory.list().length
}, null, 2));
