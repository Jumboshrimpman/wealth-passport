import assert from "node:assert/strict";
import { test } from "node:test";
import { ALGORITHMIC_PARTY, acceptOnRow } from "../../shared/acceptOffer.ts";
import { buildOfferBoard, defaultFit } from "../../shared/marketplace.ts";
import { CLIENT_SEEDS } from "../../shared/seed/index.ts";
import {
  bestPitchRecommendation,
  enrolledAssistantCopy,
  isAcceptIntent,
  isPitchNavigation,
  isServiceMenu,
  matchServiceProduct,
  recommendationCopy,
  serviceRequestCopy,
} from "./assistantFlow.ts";

test("the assistant recommends a manager pitch on a concrete account", () => {
  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  if (!elena) throw new Error("elena missing");
  const board = buildOfferBoard(elena, defaultFit(elena));
  const rec = bestPitchRecommendation(board);
  assert.ok(rec);
  assert.notEqual(rec.rowKey, "household");
  assert.notEqual(rec.choice.party, ALGORITHMIC_PARTY);
  assert.equal(rec.choice.kind, "offer");
  const copy = recommendationCopy(rec);
  assert.match(copy, new RegExp(rec.choice.strategy));
  assert.match(copy, new RegExp(rec.choice.accountName));
  assert.match(copy, /This is what I recommend/);
  assert.match(copy, /If you enroll in/);
  assert.match(copy, /cannot be bought/);
  assert.equal(copy.toLowerCase().includes(["paid", "placement"].join(" ")), false);
  assert.equal(copy.includes("WealthPass holds"), false);
  assert.match(copy, /not legal advice/);
});

test("enrolled copy keeps the Schwab manager and refuses an LPOA for WealthPass", () => {
  const choice = {
    id: "bid:meridian",
    kind: "offer" as const,
    party: "Meridian Global Asset Management",
    strategy: "Tax-aware municipal SMA",
    accountName: "Private Wealth brokerage",
    allInBps: 38,
    rateLabel: null,
  };
  const accepted = acceptOnRow({}, "ml-pw", choice);
  const copy = enrolledAssistantCopy(accepted["ml-pw"]);
  assert.match(copy, /You're enrolled in Tax-aware municipal SMA for Private Wealth brokerage/);
  assert.match(copy, /Meridian Global Asset Management may reach out/);
  assert.match(copy, /selected manager sets up the Schwab brokerage/);
  assert.match(copy, /WealthPass does not hold the LPOA/);
  assert.match(copy, /Permission to share an LPOA is not an LPOA/);
  assert.equal(copy.includes("WealthPass holds the LPOA"), false);
  assert.equal(copy.includes("WealthPass will set up"), false);
});

test("chat intents stay narrow", () => {
  assert.equal(isPitchNavigation("Take me to my pitches"), true);
  assert.equal(isPitchNavigation("What are my new pitches?"), false);
  assert.equal(isAcceptIntent("accept"), true);
  assert.equal(isAcceptIntent("I accept the premise"), false);
  assert.equal(isServiceMenu("I need other financial services"), true);
  const named = matchServiceProduct("I need a business line of credit and I don't see any offers.");
  assert.equal(named?.id, "business-loc");
  assert.match(serviceRequestCopy("Business line of credit", false), /I'll reach back out once there's an offer/);
  assert.equal(serviceRequestCopy("Business line of credit", false).toLowerCase().includes("approved"), false);
});
