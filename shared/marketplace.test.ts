import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allInFeeLabel,
  buildOfferBoard,
  buildOfferBook,
  capByMatch,
  clientFullName,
  defaultFit,
  describeWealth,
  MAX_ALGORITHMIC_MATCHES,
  MAX_TOP_OFFERS,
  oneBankHouseholdMinimum,
  revealedItems,
  revealLabel,
  runDemoConnector,
  type DemoProfile,
} from "./marketplace.ts";
import { CLIENT_SEEDS } from "./seed/index.ts";

function sampleProfile(clientId: string): DemoProfile {
  const client = CLIENT_SEEDS.find((row) => row.id === clientId);
  if (!client) throw new Error(`missing ${clientId}`);
  const bank = runDemoConnector("plaid", client);
  const fundrise = runDemoConnector("fundrise", client);
  const coinbase = runDemoConnector("coinbase", client);
  const kalshi = runDemoConnector("kalshi", client);
  if (!bank || bank.kind !== "bank" || !fundrise || fundrise.kind !== "asset") {
    throw new Error("connector shape");
  }
  if (!coinbase || coinbase.kind !== "asset" || !kalshi || kalshi.kind !== "asset") {
    throw new Error("asset connector shape");
  }
  return {
    clientId: client.id,
    provider: "plaid",
    providerLabel: bank.providerLabel,
    fullName: bank.fullName,
    pulledAccounts: bank.accounts,
    fundrise: { connected: true, amount: fundrise.amount, label: fundrise.label },
    coinbase: { connected: true, amount: coinbase.amount, label: coinbase.label },
    kalshi: { connected: true, amount: kalshi.amount, label: kalshi.label },
    other: { label: "Art", amount: 500_000 },
    taxDocName: "2025-return.pdf",
    fit: { ...defaultFit(client), motive: "cheaper", focusAccountIds: [bank.accounts[0]?.id ?? ""] },
  };
}

test("demo bank pull names the client and skips private sleeves", () => {
  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  if (!elena) throw new Error("elena missing");
  const pull = runDemoConnector("kubera", elena);
  assert.ok(pull && pull.kind === "bank");
  if (!pull || pull.kind !== "bank") return;
  assert.equal(pull.fullName, "Elena Whitmore");
  assert.equal(clientFullName(elena), "Elena Whitmore");
  assert.equal(
    pull.accounts.some((account) => account.id === "oak-pe"),
    false,
  );
  assert.ok(pull.accounts.some((account) => account.institution === "Merrill Lynch"));
  const irs = runDemoConnector("irs", elena);
  assert.equal(irs && irs.kind === "irs" && irs.status, "request-out");
  assert.equal(runDemoConnector("land-registry", elena), null);
});

test("wealth points add up for every seeded household", () => {
  for (const client of CLIENT_SEEDS) {
    const plain = describeWealth(client, null);
    assert.equal(plain.verified + plain.pending, plain.total);
    assert.ok(plain.points.every((point) => point.amount >= 0));
    assert.equal(
      plain.points.reduce((sum, point) => sum + point.amount, 0),
      plain.total,
    );
    const enrolled = describeWealth(client, sampleProfile(client.id));
    assert.equal(enrolled.verified + enrolled.pending, enrolled.total);
    assert.ok(enrolled.points.every((point) => point.amount >= 0));
    assert.equal(
      enrolled.points.reduce((sum, point) => sum + point.amount, 0),
      enrolled.total,
    );
    assert.ok(enrolled.points.some((point) => point.id === "tax" && point.status === "pending"));
    assert.ok(enrolled.points.some((point) => point.note.includes("Request still out")));
  }
});

test("fit changes which recommendation leads", () => {
  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  if (!elena) throw new Error("elena missing");
  const cheaper = buildOfferBook(elena, {
    risk: "moderate",
    balance: "equity",
    motive: "cheaper",
    focusAccountIds: ["ml-pw"],
  });
  const sunset = buildOfferBook(elena, {
    risk: "moderate",
    balance: "equity",
    motive: "sunset",
    focusAccountIds: ["ml-pw"],
  });
  const focus = cheaper.accounts.find((account) => account.accountId === "ml-pw");
  assert.ok(focus);
  assert.match(focus.recommendations[0].reason, /cheaper/);
  assert.match(focus.recommendations[0].reason, /AAPL|MSFT|VOO/);
  assert.equal(focus.recommendations.length, 3);
  assert.match(sunset.household[0].title, /qualify|line/i);
  assert.match(cheaper.household[0].reason, /\$100M/);
  assert.match(cheaper.household[0].reason, /one bank/);
  assert.match(cheaper.household[0].reason, /household minimum/);
  assert.equal(cheaper.accounts[0].recommendations[0].currentStrategy.length > 0, true);
  assert.notEqual(
    cheaper.accounts[0].recommendations[0].currentStrategy,
    cheaper.accounts[0].recommendations[0].nextStrategy,
  );
  const blob = JSON.stringify(cheaper) + JSON.stringify(sunset);
  assert.equal(blob.toLowerCase().includes(["paid", "placement"].join(" ")), false);
  assert.equal(blob.includes(" HH"), false);
});

test("one-bank household minimum is not a threshold a single account already meets", () => {
  assert.equal(oneBankHouseholdMinimum([50_000_000, 40_000_000]), null);
  assert.equal(oneBankHouseholdMinimum([84_200_000, 31_400_000]), 100_000_000);
  assert.equal(oneBankHouseholdMinimum([40_000_000, 15_000_000]), 50_000_000);

  const okafor = CLIENT_SEEDS.find((row) => row.id === "okafor-trust");
  if (!okafor) throw new Error("okafor missing");
  const book = buildOfferBook(okafor, {
    risk: "moderate",
    balance: "balanced",
    motive: "cheaper",
    focusAccountIds: [okafor.accounts[0].id],
  });
  const reason = book.household.find((item) => item.id === "household-combine")?.reason ?? "";
  assert.match(reason, /one bank/);
  assert.match(reason, /\$100M household minimum/);
  assert.doesNotMatch(reason, /\$50M household minimum/);
  assert.doesNotMatch(reason, /\$40M household minimum/);
  assert.equal(reason.includes("HH"), false);

  const split = structuredClone(okafor);
  split.accounts = [
    { ...okafor.accounts[0], id: "large", name: "Larger account", custodian: "UBS", balance: 50_000_000 },
    { ...okafor.accounts[1], id: "small", name: "Smaller account", custodian: "Fidelity", balance: 40_000_000 },
  ];
  const splitBook = buildOfferBook(split, {
    risk: "moderate",
    balance: "balanced",
    motive: "cheaper",
    focusAccountIds: ["large"],
  });
  const splitReason = splitBook.household.find((item) => item.id === "household-combine")?.reason ?? "";
  assert.match(splitReason, /\$50M/);
  assert.match(splitReason, /\$40M/);
  assert.match(splitReason, /one bank/);
  assert.match(splitReason, /does not clear a new one/);
  assert.doesNotMatch(splitReason, /meets that \$40M/);
  assert.doesNotMatch(splitReason, /meets that \$50M/);
  assert.doesNotMatch(splitReason, /\$40M household minimum/);
});

test("each account and the household keep three algorithmic matches and three bids", () => {
  assert.equal(MAX_ALGORITHMIC_MATCHES, 3);
  assert.equal(MAX_TOP_OFFERS, 3);

  const dropped = capByMatch(
    [
      { id: "a", matchPct: 70 },
      { id: "b", matchPct: 90 },
      { id: "c", matchPct: 80 },
      { id: "d", matchPct: 60 },
    ],
    3,
  );
  assert.deepEqual(
    dropped.map((item) => item.id),
    ["b", "c", "a"],
  );

  assert.equal(revealedItems(["one", "two", "three"], false).length, 1);
  assert.deepEqual(revealedItems(["one", "two", "three"], false), ["one"]);
  assert.deepEqual(revealedItems(["one", "two", "three"], true), ["one", "two", "three"]);
  assert.deepEqual(revealedItems(["only"], false), ["only"]);
  assert.deepEqual(revealedItems([], false), []);
  assert.equal(revealLabel("offers", 3, false), "Show me the next 2 offers");
  assert.equal(revealLabel("matches", 3, false), "Show me the next 2 matches");
  assert.equal(revealLabel("offers", 2, false), "Show me the next offer");
  assert.equal(revealLabel("matches", 2, false), "Show me the next match");
  assert.equal(revealLabel("offers", 1, false), null);
  assert.equal(revealLabel("offers", 0, false), null);
  assert.equal(revealLabel("offers", 3, true), null);

  const elena = CLIENT_SEEDS.find((row) => row.id === "elena-whitmore");
  if (!elena) throw new Error("elena missing");
  const board = buildOfferBoard(elena, defaultFit(elena));
  assert.equal(board.rows.length, elena.accounts.length + 1);
  assert.equal(board.rows[board.rows.length - 1].key, "household");

  const merrill = board.rows.find((row) => row.key === "ml-pw");
  const household = board.rows.find((row) => row.key === "household");
  const privateRow = board.rows.find((row) => row.key === "oak-pe");
  assert.ok(merrill && household && privateRow);
  assert.equal(merrill.algorithmic.length, 3);
  assert.equal(merrill.algorithmic[0].id, "ml-pw-cheaper");
  assert.equal(merrill.algorithmic[0].currentStrategy, "Equity strategy");
  assert.equal(merrill.algorithmic[0].nextStrategy, "Lower-fee equity strategy");
  assert.equal(merrill.algorithmic[0].allInBps, 28);
  assert.equal(allInFeeLabel(merrill.algorithmic[0].allInBps), "all-in 28 bps");
  assert.ok(merrill.algorithmic[0].matchPct > merrill.algorithmic[1].matchPct);
  assert.ok(merrill.algorithmic.every((item) => item.allInBps > 0));
  assert.equal(merrill.offers[0].terms, "all-in 38 bps");
  assert.deepEqual(
    merrill.offers.map((offer) => offer.id),
    ["meridian", "harbor-lane", "northbridge"],
  );
  assert.equal(merrill.offers.some((offer) => offer.id === "field-co" || offer.id === "lark-index"), false);
  assert.equal(household.algorithmic[0].id, "household-combine");
  assert.equal(household.offers[0].id, "first-atlantic");
  assert.equal(household.offers.length, 3);
  assert.equal(privateRow.offers[0].id, "oakridge");
  assert.equal(revealedItems(merrill.offers, false).length, 1);
  assert.equal(revealedItems(merrill.algorithmic, false).length, 1);

  const quiet = structuredClone(elena);
  quiet.accounts = [{ ...elena.accounts[0], balance: 0 }];
  const quietBoard = buildOfferBoard(quiet, defaultFit(quiet));
  assert.deepEqual(quietBoard.rows[0].offers, []);
  assert.equal(revealLabel("offers", quietBoard.rows[0].offers.length, false), null);

  for (const client of CLIENT_SEEDS) {
    const rows = buildOfferBoard(client, defaultFit(client)).rows;
    assert.equal(rows.length, client.accounts.length + 1);
    for (const row of rows) {
      assert.ok(row.algorithmic.length <= MAX_ALGORITHMIC_MATCHES);
      assert.ok(row.algorithmic.length >= 1);
      assert.ok(row.offers.length <= MAX_TOP_OFFERS);
      for (const match of row.algorithmic) {
        assert.equal(match.nextStrategy.trim().length > 0, true);
        assert.notEqual(match.currentStrategy, match.nextStrategy);
        assert.equal(Number.isInteger(match.allInBps), true);
        assert.ok(match.allInBps >= 8 && match.allInBps <= 200);
        assert.equal(allInFeeLabel(match.allInBps), `all-in ${match.allInBps} bps`);
      }
      for (const offer of row.offers) {
        assert.equal(offer.terms.trim().length > 0, true);
      }
      const matchScores = row.algorithmic.map((item) => item.matchPct);
      const bidScores = row.offers.map((item) => item.matchPct);
      assert.deepEqual(matchScores, [...matchScores].sort((a, b) => b - a));
      assert.deepEqual(bidScores, [...bidScores].sort((a, b) => b - a));
      assert.equal(revealedItems(row.algorithmic, false).length, 1);
      assert.equal(revealedItems(row.offers, false).length, row.offers.length === 0 ? 0 : 1);
    }
  }

  const blob = JSON.stringify(board);
  assert.equal(blob.toLowerCase().includes(["paid", "placement"].join(" ")), false);
});
