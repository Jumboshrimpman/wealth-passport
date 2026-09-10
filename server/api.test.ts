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
