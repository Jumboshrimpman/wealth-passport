import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ALGORITHMIC_PARTY,
  acceptChoicesFor,
  acceptanceConfirmation,
  clientAgreementLines,
  schwabLpoaLines,
  acceptOnRow,
  allInBpsFromTerms,
  listsAfterAccept,
  rowCanAccept,
  withVisibility,
} from "./acceptOffer.ts";
import { buildOfferBoard, defaultFit, revealedItems } from "./marketplace.ts";
import { CLIENT_SEEDS } from "./seed/index.ts";

test("accepting opens a demo agreement and a Schwab LPOA before the row locks", () => {
  const choice = {
    party: "Meridian Global Asset Management",
    strategy: "Tax-aware municipal SMA",
    accountName: "Private Wealth brokerage",
  };
  const agreement = clientAgreementLines(choice).join(" ");
  const lpoa = schwabLpoaLines(choice).join(" ");
  assert.match(agreement, /Client agreement with Meridian Global Asset Management/);
  assert.match(agreement, /Tax-aware municipal SMA/);
  assert.match(agreement, /demo signature/);
  assert.match(lpoa, /will set up a brokerage with Schwab to manage the assets/);
  assert.match(lpoa, /Meridian Global Asset Management/);
  assert.equal(lpoa.toLowerCase().includes(["paid", "placement"].join(" ")), false);
});

test("all-in bps parse only from an all-in fee line", () => {
  assert.equal(allInBpsFromTerms("all-in 38 bps"), 38);
  assert.equal(allInBpsFromTerms("all-in 28 bps"), 28);
  assert.equal(allInBpsFromTerms("SOFR + 1.85%"), null);
  assert.equal(allInBpsFromTerms("11 bps under the current schedule"), null);
  assert.equal(allInBpsFromTerms("1.50% and 15% carry"), null);
});

test("each account and the household can accept one visible choice", () => {
  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  if (!elena) throw new Error("elena missing");
  const board = buildOfferBoard(elena, defaultFit(elena));
  const merrill = board.rows.find((row) => row.key === "ml-pw");
  const household = board.rows.find((row) => row.key === "household");
  assert.ok(merrill && household);
  assert.equal(rowCanAccept(merrill), true);
  assert.equal(rowCanAccept(household), true);

  const collapsed = acceptChoicesFor(merrill, false, false);
  assert.deepEqual(
    collapsed.map((choice) => choice.id),
    ["match:ml-pw-cheaper", "bid:meridian"],
  );
  assert.equal(collapsed[0].party, ALGORITHMIC_PARTY);
  assert.equal(collapsed[0].strategy, "Lower-fee equity strategy");
  assert.equal(collapsed[0].allInBps, 28);
  assert.equal(collapsed[1].party, "Meridian Global Asset Management");
  assert.equal(collapsed[1].strategy, "Tax-aware municipal SMA");
  assert.equal(collapsed[1].allInBps, 38);
  assert.equal(
    acceptanceConfirmation(collapsed[1]),
    "Meridian Global Asset Management will be in touch shortly to set up Tax-aware municipal SMA for Private Wealth brokerage at all-in 38 bps.",
  );
  assert.equal(
    acceptanceConfirmation(collapsed[0]),
    "WealthPass will be in touch shortly to set up Lower-fee equity strategy for Private Wealth brokerage at all-in 28 bps.",
  );

  const expanded = acceptChoicesFor(merrill, true, true);
  assert.equal(expanded.length, revealedItems(merrill.algorithmic, true).length + revealedItems(merrill.offers, true).length);
  assert.equal(expanded.length, 6);
  assert.equal(expanded.some((choice) => choice.id === "bid:harbor-lane"), true);
  assert.equal(expanded.some((choice) => choice.id === "match:ml-pw-change" || choice.strategy === "Rebuilt core strategy"), true);

  const booked = acceptOnRow({}, merrill.key, collapsed[1]);
  assert.equal(booked[merrill.key].confirmation, acceptanceConfirmation(collapsed[1]));
  const locked = acceptOnRow(booked, merrill.key, collapsed[0]);
  assert.equal(locked[merrill.key].choiceId, "bid:meridian");
  assert.equal(Object.keys(locked).length, 1);

  const householdChoices = acceptChoicesFor(household, false, false);
  assert.equal(householdChoices[0].party, ALGORITHMIC_PARTY);
  assert.equal(householdChoices[0].accountName, "Household");
  const line = householdChoices.find((choice) => choice.id === "bid:first-atlantic");
  assert.ok(line);
  assert.equal(line.allInBps, null);
  assert.equal(line.rateLabel, "SOFR + 1.85%");
  assert.equal(
    acceptanceConfirmation(line),
    "First Atlantic Private Bank will be in touch shortly to set up Securities-based credit line for Household at SOFR + 1.85%.",
  );

  for (const row of board.rows) {
    assert.equal(rowCanAccept(row), true);
    const choices = acceptChoicesFor(row, false, false);
    assert.ok(choices.length >= 1);
    assert.ok(choices.length <= 2);
  }

  const blob = JSON.stringify(collapsed) + JSON.stringify(expanded) + booked[merrill.key].confirmation;
  assert.equal(blob.toLowerCase().includes(["paid", "placement"].join(" ")), false);

  const meridian = expanded.find((choice) => choice.id === "bid:meridian");
  assert.ok(meridian);
  const keptOpen = acceptOnRow({}, merrill.key, meridian, { matchesOpen: true, offersOpen: true });
  const openLists = listsAfterAccept(merrill, keptOpen[merrill.key]);
  assert.equal(openLists.algorithmic.length, 3);
  assert.equal(openLists.offers.length, 3);
  assert.equal(
    openLists.offers.some((offer) => `bid:${offer.id}` === keptOpen[merrill.key].choiceId),
    true,
  );
  assert.equal(
    openLists.algorithmic.some((item) => `match:${item.id}` === "match:ml-pw-cheaper"),
    true,
  );

  const keptClosed = acceptOnRow({}, household.key, householdChoices[0], { matchesOpen: false, offersOpen: false });
  const closedLists = listsAfterAccept(household, keptClosed[household.key]);
  assert.equal(closedLists.algorithmic.length, 1);
  assert.equal(closedLists.offers.length, 1);

  const fromStorage = withVisibility({
    ...keptClosed[household.key],
    matchesOpen: undefined as unknown as boolean,
    offersOpen: undefined as unknown as boolean,
  });
  assert.equal(fromStorage.matchesOpen, false);
  assert.equal(fromStorage.offersOpen, false);
  assert.equal(listsAfterAccept(household, fromStorage).algorithmic.length, 1);
});
