import assert from "node:assert/strict";
import { test } from "node:test";
import { CLIENT_SEEDS } from "./seed/index.ts";
import { STRATEGY_UNIVERSE } from "./seed/strategies.ts";
import { browseStrategies, ELIGIBLE_FILTER_LABEL, ESG_FILTER_LABEL, meetsStrategyMinimum, strategyFeeLine } from "./strategies.ts";

test("the strategy universe follows the public UMA profile index and can be filtered", () => {
  assert.ok(STRATEGY_UNIVERSE.length >= 900);
  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  const priya = CLIENT_SEEDS.find((row) => row.id === "priya-shah");
  if (!elena || !priya) throw new Error("seed clients missing");

  const all = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable);
  const eligible = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { eligibleOnly: true });
  assert.equal(all.length, STRATEGY_UNIVERSE.length);
  assert.ok(eligible.length > 0);
  assert.ok(eligible.length < all.length);
  assert.ok(eligible.every((strategy) => meetsStrategyMinimum(strategy, elena.household.investable)));
  assert.ok(all.some((strategy) => strategy.minimum == null));

  const priyaEligible = browseStrategies(STRATEGY_UNIVERSE, priya.household.investable, { eligibleOnly: true });
  assert.equal(priyaEligible.length, eligible.length);

  const smallHousehold = browseStrategies(STRATEGY_UNIVERSE, 1_000, { eligibleOnly: true });
  assert.ok(smallHousehold.length < eligible.length);
  assert.ok(smallHousehold.every((strategy) => strategy.minimum != null && strategy.minimum <= 1_000));

  const muni = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { query: "municipal" });
  assert.ok(muni.length > 10);
  assert.ok(muni.every((strategy) => /muni/i.test(`${strategy.name} ${strategy.style} ${strategy.category}`)));

  const growth = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "uma-ali-h");
  assert.ok(growth);
  assert.equal(growth.manager, "AllianceBernstein");
  assert.equal(growth.name, "Concentrated U.S. Growth");
  assert.equal(growth.style, "US Large Cap Growth");
  assert.equal(growth.minimum, 5_000);
  assert.equal(growth.productCode, "ALI-H");
  assert.equal(strategyFeeLine(growth), "");
  assert.equal(meetsStrategyMinimum(growth, 1_000), false);
  assert.equal(meetsStrategyMinimum(growth, 5_000), true);

  const esg = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { esgOnly: true });
  assert.ok(esg.length > 0);
  assert.ok(esg.length < all.length);
  assert.ok(esg.every((strategy) => strategy.esg === true));
  assert.ok(esg.some((strategy) => strategy.id === "uma-zvn-1"));
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

  const fixed = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { category: "Fixed income" });
  assert.ok(fixed.length > 0);
  assert.ok(fixed.every((strategy) => strategy.category === "Fixed income"));
  assert.equal(ELIGIBLE_FILTER_LABEL, "Eligible for me");

  const blob = JSON.stringify(STRATEGY_UNIVERSE);
  assert.equal(blob.toLowerCase().includes(["paid", "placement"].join(" ")), false);
});
