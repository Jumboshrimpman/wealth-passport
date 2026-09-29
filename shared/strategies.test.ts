import assert from "node:assert/strict";
import { test } from "node:test";
import { CLIENT_SEEDS } from "./seed/index.ts";
import { STRATEGY_UNIVERSE } from "./seed/strategies.ts";
import { browseStrategies, ELIGIBLE_FILTER_LABEL, ESG_FILTER_LABEL, meetsStrategyMinimum, strategyFeeLine } from "./strategies.ts";

test("the strategy universe is larger than one household's pitches and can be filtered", () => {
  assert.ok(STRATEGY_UNIVERSE.length >= 20);
  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  const priya = CLIENT_SEEDS.find((row) => row.id === "priya-shah");
  if (!elena || !priya) throw new Error("seed clients missing");

  const all = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable);
  const eligible = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { eligibleOnly: true });
  assert.equal(all.length, STRATEGY_UNIVERSE.length);
  assert.ok(eligible.length > 0);
  assert.ok(eligible.length < all.length);
  assert.ok(eligible.every((strategy) => meetsStrategyMinimum(strategy, elena.household.investable)));
  assert.ok(all.some((strategy) => strategy.minimum > elena.household.investable));

  const priyaEligible = browseStrategies(STRATEGY_UNIVERSE, priya.household.investable, { eligibleOnly: true });
  assert.ok(priyaEligible.length < eligible.length);

  const muni = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { query: "municipal" });
  assert.ok(muni.some((strategy) => strategy.name === "Tax-aware municipal SMA"));
  assert.equal(strategyFeeLine(muni.find((strategy) => strategy.id === "meridian-muni")!), "all-in 38 bps");
  assert.equal(ELIGIBLE_FILTER_LABEL, "Eligible for me");

  const founder = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "founder-sma");
  assert.ok(founder);
  assert.equal(meetsStrategyMinimum(founder, elena.household.investable), false);
  assert.equal(meetsStrategyMinimum(founder, 250_000_000), true);

  const esg = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { esgOnly: true });
  assert.ok(esg.length > 0);
  assert.ok(esg.length < all.length);
  assert.ok(esg.every((strategy) => strategy.esg === true));
  assert.ok(esg.some((strategy) => strategy.id === "global-equity"));
  const esgSearch = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { query: "esg" });
  assert.deepEqual(
    esgSearch.map((strategy) => strategy.id).sort(),
    esg.map((strategy) => strategy.id).sort(),
  );
  const esgEligible = browseStrategies(STRATEGY_UNIVERSE, priya.household.investable, {
    esgOnly: true,
    eligibleOnly: true,
  });
  assert.ok(esgEligible.every((strategy) => strategy.esg === true && meetsStrategyMinimum(strategy, priya.household.investable)));
  assert.equal(ESG_FILTER_LABEL, "ESG");

  const blob = JSON.stringify(STRATEGY_UNIVERSE);
  assert.equal(blob.toLowerCase().includes(["paid", "placement"].join(" ")), false);
});
