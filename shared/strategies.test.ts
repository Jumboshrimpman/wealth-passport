import assert from "node:assert/strict";
import { test } from "node:test";
import { CLIENT_SEEDS } from "./seed/index.ts";
import { STRATEGY_UNIVERSE } from "./seed/strategies.ts";
import {
  browseStrategies,
  ELIGIBLE_FILTER_LABEL,
  ESG_FILTER_LABEL,
  illustrativeFeeBps,
  meetsStrategyMinimum,
  strategyFeeLine,
} from "./strategies.ts";

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
  assert.ok(
    muni.every((strategy) =>
      /muni/i.test(`${strategy.name} ${strategy.style} ${strategy.category} ${strategy.benchmark ?? ""}`),
    ),
  );

  const growth = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "uma-ali-h");
  assert.ok(growth);
  assert.equal(growth.manager, "AllianceBernstein");
  assert.equal(growth.name, "Concentrated U.S. Growth");
  assert.equal(growth.style, "US Large Cap Growth");
  assert.equal(growth.minimum, 5_000);
  assert.equal(growth.productCode, "ALI-H");
  assert.equal(growth.allInBps, illustrativeFeeBps(growth.id, growth.category));
  assert.equal(growth.allInBps != null && growth.allInBps % 5 === 0, true);
  assert.equal(strategyFeeLine(growth), `all-in ${growth.allInBps} bps`);
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

  const midFee = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { feeRange: "25-40" });
  assert.ok(midFee.length > 0);
  assert.ok(midFee.every((strategy) => strategy.allInBps != null && strategy.allInBps >= 25 && strategy.allInBps <= 40));
  const cheapEsg = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { feeRange: "under-25", esgOnly: true });
  assert.ok(cheapEsg.every((strategy) => strategy.esg === true && strategy.allInBps != null && strategy.allInBps < 25));
  const conservative = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { risk: "Conservative" });
  assert.ok(conservative.length > 0);
  assert.ok(conservative.every((strategy) => strategy.risk === "Conservative"));
  const smallMin = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { minimumBand: "under-100k" });
  assert.ok(smallMin.length > 0);
  assert.ok(smallMin.every((strategy) => strategy.minimum != null && strategy.minimum < 100_000));
  assert.equal(browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { feeRange: "unlisted" }).length, 0);

  const blob = JSON.stringify(STRATEGY_UNIVERSE);
  assert.equal(blob.toLowerCase().includes(["paid", "placement"].join(" ")), false);

  const ladder = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "uma-loc-g");
  const adr = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "uma-sru-a");
  const maps = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "uma-afv-6");
  const indexed = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "uma-apr-a");
  if (!ladder || !adr || !maps || !indexed) throw new Error("catalog rows missing");
  assert.equal(ladder.fixedIncome?.avgMaturityYears, 6.4);
  assert.equal(ladder.taxPosture.includes("tax-sensitive"), true);
  assert.equal(ladder.usesAdrs, false);
  assert.equal(growth.usesAdrs, false);
  assert.equal(growth.fixedIncome, null);
  assert.equal(growth.benchmarkKind, "single");
  assert.equal(adr.usesAdrs, true);
  assert.equal(maps.additionalFundFees, true);
  assert.equal(maps.benchmarkKind, "blended");
  assert.deepEqual(indexed.taxPosture, ["direct-indexing", "tax-aware"]);

  const withHousehold = STRATEGY_UNIVERSE.filter((strategy) => strategy.householdMinimum != null);
  const withoutHousehold = STRATEGY_UNIVERSE.filter((strategy) => strategy.householdMinimum == null);
  assert.ok(withHousehold.length > 20);
  assert.ok(withoutHousehold.length > 20);
  assert.ok(withHousehold.every((strategy) => strategy.minimum == null || strategy.householdMinimum !== strategy.minimum));

  const adrOnly = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { adr: "yes" });
  assert.ok(adrOnly.length > 0 && adrOnly.length < all.length);
  assert.ok(adrOnly.every((strategy) => strategy.usesAdrs));
  const shortMaturity = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { maturityBand: "under-3" });
  assert.ok(shortMaturity.length > 0);
  assert.ok(shortMaturity.every((strategy) => (strategy.fixedIncome?.avgMaturityYears ?? 99) < 3));
  const fundFees = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { fundFees: "yes" });
  assert.ok(fundFees.length > 0 && fundFees.length < all.length);
  assert.ok(fundFees.every((strategy) => strategy.additionalFundFees));
  const direct = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { taxPosture: "direct-indexing" });
  assert.ok(direct.length > 0);
  assert.ok(direct.every((strategy) => strategy.taxPosture.includes("direct-indexing")));
  const blended = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { benchmarkKind: "blended" });
  const single = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { benchmarkKind: "single" });
  assert.ok(blended.length > 0 && single.length > 0);
  assert.ok(blended.every((strategy) => strategy.benchmarkKind === "blended"));
  const managers = browseStrategies(STRATEGY_UNIVERSE, elena.household.investable, { manager: "AllianceBernstein" });
  assert.ok(managers.some((strategy) => strategy.id === "uma-ali-h"));
  assert.ok(managers.every((strategy) => strategy.manager === "AllianceBernstein"));
});
