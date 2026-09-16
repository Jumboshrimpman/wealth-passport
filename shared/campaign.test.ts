import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyCounters, withFunnel } from "./campaign.ts";

test("withFunnel computes cost per accept and conversion from booked revenue", () => {
  const row = withFunnel(emptyCounters("meridian"), {
    name: "Meridian Global Asset Management",
    kindLabel: "Asset manager",
    accepts: 2,
    declines: 1,
    bookedRevenue: 410_400,
  });
  assert.equal(row.costPerAccept, 205_200);
  assert.equal(row.conversionRate, 0);

  const impressed = withFunnel(
    { institutionId: "meridian", views: 10, matches: 4, impressions: 4 },
    { name: "Meridian", kindLabel: "Asset manager", accepts: 1, declines: 0, bookedRevenue: 205_200 },
  );
  assert.equal(impressed.costPerAccept, 205_200);
  assert.equal(impressed.conversionRate, 0.25);
  assert.equal(withFunnel(emptyCounters("oakridge"), {
    name: "Oakridge",
    kindLabel: "Private markets",
    accepts: 0,
    declines: 0,
    bookedRevenue: 0,
  }).costPerAccept, 0);
});
