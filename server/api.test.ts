import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { createApp } from "./app.ts";
import { openDatabase, seedIfEmpty } from "./db.ts";

async function withApi<T>(run: (base: string) => Promise<T>): Promise<T> {
  const db = openDatabase(":memory:");
  seedIfEmpty(db);
  const app = createApp(db);
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("TEST FAILURE: expected TCP address.");
  }
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    db.close();
  }
}

test("seeds Elena and Priya and persists consent on the selected client", async () => {
  await withApi(async (base) => {
    const list = await fetch(`${base}/api/clients`).then((res) => res.json());
    assert.equal(list.clients.length, 2);
    const ids = list.clients.map((row: { id: string }) => row.id).sort();
    assert.deepEqual(ids, ["elena-whitmore", "priya-shah"]);

    const elena = await fetch(`${base}/api/clients/elena-whitmore`).then((res) => res.json());
    assert.equal(elena.client.household.clientFirstName, "Elena");
    assert.equal(elena.client.household.householdValue, 300_000_000);
    assert.equal(elena.client.advisor.name, "Linda McDonald");
    assert.ok(elena.client.accounts.some((account: { verifiedCustodian: boolean }) => account.verifiedCustodian));

    const priya = await fetch(`${base}/api/clients/priya-shah`).then((res) => res.json());
    assert.equal(priya.client.household.clientFirstName, "Priya");
    assert.equal(priya.client.household.householdValue, 72_000_000);
    assert.equal(priya.client.advisor.name, "David Park");
    assert.equal(priya.client.verifiedCustodian.badge, "Goldman Sachs");

    const patched = await fetch(`${base}/api/clients/priya-shah/consent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared: false }),
    }).then((res) => res.json());
    assert.equal(patched.client.consent.shared, false);

    const reread = await fetch(`${base}/api/clients/priya-shah`).then((res) => res.json());
    assert.equal(reread.client.consent.shared, false);

    const elenaAgain = await fetch(`${base}/api/clients/elena-whitmore`).then((res) => res.json());
    assert.equal(elenaAgain.client.consent.shared, true);

    const missing = await fetch(`${base}/api/clients/not-a-client`);
    assert.equal(missing.status, 404);
  });
});

test("serves the seeded institution catalog", async () => {
  await withApi(async (base) => {
    const body = await fetch(`${base}/api/institutions`).then((res) => res.json());
    assert.equal(body.institutions.length, 3);
    const ids = body.institutions.map((row: { id: string }) => row.id).sort();
    assert.deepEqual(ids, ["first-atlantic", "meridian", "oakridge"]);
    const ranks = body.institutions.map((row: { offer: { rank: number } }) => row.offer.rank);
    assert.deepEqual(ranks, [1, 2, 3]);
  });
});

test("matches offers against each stored client record", async () => {
  await withApi(async (base) => {
    const elena = await fetch(`${base}/api/clients/elena-whitmore/offers`).then((res) => res.json());
    assert.equal(elena.eligible.length, 3);
    assert.deepEqual(
      elena.eligible.map((match: { institution: { id: string } }) => match.institution.id),
      ["meridian", "first-atlantic", "oakridge"],
    );
    const elenaMuni = elena.eligible.find(
      (match: { institution: { id: string } }) => match.institution.id === "meridian",
    );
    assert.match(elenaMuni.fitReason, /Greenwich, CT/);
    assert.match(elenaMuni.fitReason, /\$228M investable/);

    const priya = await fetch(`${base}/api/clients/priya-shah/offers`).then((res) => res.json());
    assert.deepEqual(
      priya.eligible.map((match: { institution: { id: string } }) => match.institution.id),
      ["meridian"],
    );
    const blocked = priya.matches.filter(
      (match: { eligible: boolean }) => !match.eligible,
    );
    assert.equal(blocked.length, 2);
    const sbl = blocked.find(
      (match: { institution: { id: string } }) => match.institution.id === "first-atlantic",
    );
    assert.ok(
      sbl.reasons.some((reason: string) => reason.includes("Liquidity $6.4M is below the $10M floor")),
    );
    const secondaries = blocked.find(
      (match: { institution: { id: string } }) => match.institution.id === "oakridge",
    );
    assert.ok(
      secondaries.reasons.some((reason: string) =>
        reason.includes("Private-markets sleeve 0% is below the 10% floor"),
      ),
    );

    const missing = await fetch(`${base}/api/clients/not-a-client/offers`);
    assert.equal(missing.status, 404);
  });
});

test("consent flip changes offer eligibility", async () => {
  await withApi(async (base) => {
    await fetch(`${base}/api/clients/elena-whitmore/consent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared: false }),
    });
    const body = await fetch(`${base}/api/clients/elena-whitmore/offers`).then((res) => res.json());
    assert.equal(body.eligible.length, 0);
    assert.ok(
      body.matches.every((match: { reasons: string[] }) =>
        match.reasons.includes("Passport share consent is off."),
      ),
    );
  });
});

test("persists the admin dashboard layout server-side", async () => {
  await withApi(async (base) => {
    const initial = await fetch(`${base}/api/admin/layout`).then((res) => res.json());
    assert.equal(initial.layout.length, 6);
    assert.ok(initial.layout.every((widget: { visible: boolean }) => widget.visible));

    const custom = [
      { id: "bank-ranking", visible: true, span: 2, viz: "donut" },
      { id: "clients", visible: false, span: 1, viz: "bars" },
    ];
    const put = await fetch(`${base}/api/admin/layout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgets: custom }),
    });
    assert.equal(put.status, 200);
    const saved = await put.json();
    assert.equal(saved.layout[0].id, "bank-ranking");
    assert.equal(saved.layout[0].viz, "donut");
    assert.equal(saved.layout[1].visible, false);
    assert.equal(saved.layout.length, 6);

    const reread = await fetch(`${base}/api/admin/layout`).then((res) => res.json());
    assert.deepEqual(reread.layout, saved.layout);

    const bad = await fetch(`${base}/api/admin/layout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: [] }),
    });
    assert.equal(bad.status, 400);
  });
});
