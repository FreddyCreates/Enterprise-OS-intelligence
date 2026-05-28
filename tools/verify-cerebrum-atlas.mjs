import assert from "node:assert/strict";

const mod = await import(new URL("../cloudflare-workers/cerebrum/worker.js", import.meta.url));
const worker = mod.default;

const atlasResponse = await worker.fetch(new Request("https://example.com/organism-atlas"), {});
const apiResponse = await worker.fetch(new Request("https://example.com/api/organism-atlas"), {});
const apiData = await apiResponse.json();

assert.equal(atlasResponse.ok, true);
assert.equal(apiResponse.ok, true);
assert.ok(apiData.metrics.packageCount >= 20);
assert.ok(Array.isArray(apiData.layers));

console.log("verify-cerebrum-atlas-ok");
