import assert from "node:assert/strict";
import { test } from "node:test";
import { documentsForSegment, segmentDocumentLine } from "./segmentDocuments.ts";

test("verified segments keep a short document list and unconnected ones stay empty", () => {
  const bank = documentsForSegment({
    id: "bank",
    status: "verified",
    note: "Elena Whitmore · bank accounts and balances",
  });
  assert.deepEqual(
    bank.map((doc) => doc.label),
    ["Statement", "Confirmation"],
  );

  const pendingAccount = documentsForSegment({
    id: "acct-1",
    status: "pending",
    note: "Confirmation still out",
  });
  assert.deepEqual(
    pendingAccount.map((doc) => doc.label),
    ["Statement"],
  );

  assert.deepEqual(
    documentsForSegment({ id: "coinbase", status: "pending", note: "Not connected" }),
    [],
  );
  assert.deepEqual(
    documentsForSegment({ id: "rest", status: "pending", note: "Not on a connection yet" }),
    [],
  );
  assert.deepEqual(
    documentsForSegment({
      id: "irs",
      status: "pending",
      note: "Connected in this demo. A transcript request is out, and nothing has posted yet.",
    }).map((doc) => doc.label),
    ["Transcript request"],
  );
  assert.equal(documentsForSegment({ id: "irs", status: "pending", note: "Not connected" }).length, 0);

  const spoken = segmentDocumentLine("Statement").toLowerCase();
  assert.match(spoken, /demo only/);
  assert.equal(spoken.includes("lpoa"), false);
});
