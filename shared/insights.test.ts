import assert from "node:assert/strict";
import { test } from "node:test";
import { householdInsights } from "./insights.ts";
import { elenaClient } from "./seed/elena.ts";

test("householdInsights flags concentration, liquidity runway, and rollover candidates", () => {
  const insights = householdInsights(elenaClient);
  const concentration = insights.filter((row) => row.kind === "concentration");
  const liquidity = insights.find((row) => row.kind === "liquidity");
  const rollover = insights.find((row) => row.kind === "rollover");

  assert.ok(concentration.length >= 3);
  assert.ok(concentration.every((row) => row.severity === "info"));
  assert.ok(concentration.some((row) => row.title.startsWith("AAPL is ")));
  assert.ok(liquidity);
  assert.match(liquidity!.title, /24 months/);
  assert.equal(liquidity!.severity, "info");
  assert.ok(rollover);
  assert.match(rollover!.title, /Traditional IRA \(rollover candidate\)/);
});
