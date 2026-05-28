import assert from "node:assert/strict";
import { ParralaxStack } from "../lib/index.js";

const stack = new ParralaxStack();

assert.equal(stack.registries.agents.list().length > 0, true);
assert.equal(stack.registries.protocols.list().length > 0, true);
assert.equal(stack.registries.risk.list().length > 0, true);
assert.equal(stack.registries.assets.list().length > 0, true);
assert.equal(stack.registries.strategies.list().length > 0, true);

const observer = stack.createAgent("observer-market-001");
const observation = observer.observe({ symbol: "SPY", price: 520.15, change: -0.013, volatility: 0.019, regime: "NOISY" });
assert.equal(observation.observation.symbol, "SPY");

const token = stack.tokens.issue({
  assetId: "parralax-governance-unit",
  supply: 1000000,
  rights: ["vote"],
  actor: "founder"
});
assert.equal(token.token.assetId, "parralax-governance-unit");

const nft = stack.nfts.mint({
  assetId: "strategy-license-001",
  metadata: { strategy: "equities-momentum-paper" },
  actor: "founder"
});
assert.equal(nft.nft.class, "nft");

const allocation = stack.capital.allocate(1000000, [
  { id: "equities-momentum-paper", weight: 2 },
  { id: "crypto-event-driven-paper", weight: 1 }
]);
assert.equal(allocation.length, 2);

console.log("parralax-validate-ok");
