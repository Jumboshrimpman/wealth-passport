import assert from "node:assert/strict";
import { test } from "node:test";
import { ASSISTANT_CHECKLIST, agentEnrollSteps, assistantProgress, enrollProgress, selfEnrollSteps } from "./enrollFlow.ts";

test("demo enroll stays a short flow and the bar moves with the active path", () => {
  const client = selfEnrollSteps("client", true);
  const advisor = selfEnrollSteps("advisor", true);
  const associate = selfEnrollSteps("associate", false);
  assert.ok(client.length < 20);
  assert.ok(client.length < 24);
  assert.equal(client.includes("restrictions"), true);
  assert.equal(client.includes("preferences"), true);
  assert.equal(advisor.length, client.length + 1);
  assert.equal(advisor[1], "behalf");
  assert.equal(associate.includes("life"), false);
  assert.equal(associate.includes("behalf"), true);
  assert.equal(client[0], "fork");
  assert.equal(client.at(-1), "lpoa");
  assert.equal(client.includes("contact"), true);
  assert.equal(client.includes("household"), true);
  assert.equal(client.includes("estate"), true);

  const agent = agentEnrollSteps("client");
  const agentForClient = agentEnrollSteps("advisor");
  assert.ok(agent.length <= 6);
  assert.deepEqual(agent, ["fork", "agent", "agent-run", "agent-pause"]);
  assert.equal(agentForClient.includes("behalf"), true);

  assert.equal(enrollProgress("fork", client), 0);
  assert.equal(enrollProgress("lpoa", client), 100);
  const mid = enrollProgress("contact", client);
  assert.ok(mid > 0 && mid < 100);

  assert.ok(ASSISTANT_CHECKLIST.length < client.length);
  assert.equal(ASSISTANT_CHECKLIST.length, 12);
  const none = Object.fromEntries(ASSISTANT_CHECKLIST.map((gap) => [gap, false])) as Record<
    (typeof ASSISTANT_CHECKLIST)[number],
    boolean
  >;
  assert.equal(assistantProgress(none), 0);
  const all = Object.fromEntries(ASSISTANT_CHECKLIST.map((gap) => [gap, true])) as Record<
    (typeof ASSISTANT_CHECKLIST)[number],
    boolean
  >;
  assert.equal(assistantProgress(all), 100);
  assert.equal(assistantProgress({ ...none, custodian: true, irs: true }), 17);
});
