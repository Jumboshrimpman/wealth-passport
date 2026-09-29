import assert from "node:assert/strict";
import { test } from "node:test";
import type { BiddingOffer, Recommendation } from "./marketplace.ts";
import { detailFromBid, detailFromProfile, detailFromRecommendation } from "./strategyDetail.ts";
import { STRATEGY_UNIVERSE } from "./seed/strategies.ts";

test("strategy details reuse seed fields and household eligibility", () => {
  const growth = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "uma-ali-h");
  if (!growth) throw new Error("growth strategy missing");
  const fromUniverse = detailFromProfile(growth, 1_000);
  assert.equal(fromUniverse.manager, "AllianceBernstein");
  assert.equal(fromUniverse.fee, null);
  assert.equal(fromUniverse.style, "US Large Cap Growth");
  assert.equal(fromUniverse.risk, "Aggressive");
  assert.equal(fromUniverse.productCode, "ALI-H");
  assert.equal(fromUniverse.eligibility, "Above this household");
  assert.equal(detailFromProfile(growth, 5_000).eligibility, "You meet the minimum");

  const bid: BiddingOffer = {
    id: "ali-growth",
    bidder: "AllianceBernstein",
    title: "Concentrated U.S. Growth",
    terms: "Illustrative",
    customization: "Single-name cap and tax lots",
    minimum: 5_000,
    matchPct: 94,
  };
  const fromBid = detailFromBid(bid, 1_000);
  assert.equal(fromBid.key, "uma-ali-h");
  assert.equal(fromBid.summary, growth.summary);
  assert.equal(fromBid.note, bid.customization);
  assert.equal(fromBid.eligibility, "Above this household");

  const recommendation: Recommendation = {
    id: "acct-cheaper",
    title: "A lower fee",
    matchPct: 90,
    reason: "A close strategy is cheaper.",
    currentStrategy: "Equity strategy",
    nextStrategy: "Lower-fee equity strategy",
    allInBps: 28,
    strategyMinimum: 10_000_000,
  };
  const fromMatch = detailFromRecommendation(recommendation, 50_000_000);
  assert.equal(fromMatch.name, "Lower-fee equity strategy");
  assert.equal(fromMatch.fee, "all-in 28 bps");
  assert.equal(fromMatch.minimum, 10_000_000);
  assert.equal(fromMatch.eligibility, "You meet the minimum");
  assert.equal(fromMatch.summary, "A close strategy is cheaper.");
});
