import assert from "node:assert/strict";
import { test } from "node:test";
import { fundriseAmount } from "./marketplace.ts";
import { CLIENT_SEEDS } from "./seed/index.ts";
import { crawlGaps, planAgenticCrawl } from "./agenticCrawl.ts";

test("the simulated crawl finds seeded custodians and leaves the rest for Plaid", () => {
  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  if (!elena) throw new Error("elena missing");
  const plan = planAgenticCrawl({
    custodians: elena.accounts.map((account) => account.custodian),
    fundrise: fundriseAmount(elena),
  });
  const byId = Object.fromEntries(plan.map((source) => [source.id, source]));
  assert.equal(byId.schwab.found, true);
  assert.equal(byId.merrill.found, true);
  assert.equal(byId.fidelity.found, true);
  assert.equal(byId["morgan-stanley"].found, false);
  assert.equal(byId.coinbase.found, false);
  assert.equal(byId.kalshi.found, false);
  const text = plan.map((source) => source.detail).join(" ");
  assert.match(text, /Password not read/);
  assert.match(text, /Not uploaded/);
  assert.equal(text.toLowerCase().includes("keychain"), false);
  assert.equal(text.includes("WealthPass cloud"), false);
  const gaps = crawlGaps(plan).map((source) => source.id);
  assert.equal(gaps.includes("morgan-stanley"), true);
  assert.equal(gaps.includes("schwab"), false);
});
