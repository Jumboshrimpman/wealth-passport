import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildOfferBook,
  clientFullName,
  defaultFit,
  describeWealth,
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
  assert.match(cheaper.household[0].reason, /\$100M|minimum/);
  const blob = JSON.stringify(cheaper) + JSON.stringify(sunset);
  assert.equal(blob.toLowerCase().includes(["paid", "placement"].join(" ")), false);
});
