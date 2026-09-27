import assert from "node:assert/strict";
import { test } from "node:test";
import type { BiddingOffer, Recommendation } from "./marketplace.ts";
import { detailFromBid, detailFromProfile, detailFromRecommendation } from "./strategyDetail.ts";
import { STRATEGY_UNIVERSE } from "./seed/strategies.ts";

test("strategy details reuse seed fields and household eligibility", () => {
  const muni = STRATEGY_UNIVERSE.find((strategy) => strategy.id === "meridian-muni");
  if (!muni) throw new Error("muni strategy missing");
  const fromUniverse = detailFromProfile(muni, 10_000_000);
  assert.equal(fromUniverse.manager, "Meridian Global Asset Management");
  assert.equal(fromUniverse.fee, "all-in 38 bps");
  assert.equal(fromUniverse.style, "Municipal");
  assert.equal(fromUniverse.eligibility, "Above this household");
  assert.equal(detailFromProfile(muni, 25_000_000).eligibility, "You meet the minimum");

  const bid: BiddingOffer = {
    id: "meridian",
    bidder: "Meridian Global Asset Management",
    title: "Tax-aware municipal SMA",
    terms: "all-in 38 bps",
    customization: "State preference, duration, and which lots to harvest",
    minimum: 25_000_000,
    matchPct: 94,
  };
  const fromBid = detailFromBid(bid, 10_000_000);
  assert.equal(fromBid.key, "meridian-muni");
  assert.equal(fromBid.summary, muni.summary);
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
