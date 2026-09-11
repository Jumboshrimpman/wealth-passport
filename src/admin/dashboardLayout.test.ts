import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLayout, mergeLayout, WIDGET_IDS } from "./dashboardLayout.ts";
import { BOARD_COUNT, OPEN_PLACEMENTS, payingBoard, placementMix } from "../data/adminBoard.ts";

test("paying board and placement mix match the walkthrough headline numbers", () => {
  assert.equal(payingBoard.length, BOARD_COUNT);
  assert.equal(payingBoard.filter((desk) => desk.walkthrough).length, 3);
  assert.equal(placementMix.reduce((sum, row) => sum + row.count, 0), OPEN_PLACEMENTS);
});

test("mergeLayout keeps order, drops unknown ids, and fills missing widgets", () => {
  const merged = mergeLayout({
    widgets: [
      { id: "clerk", visible: true, span: 2, viz: "donut" },
      { id: "not-a-widget", visible: true },
      { id: "clients", visible: false, span: 1, viz: "bars" },
    ],
  });
  assert.equal(merged[0]?.id, "clerk");
  assert.equal(merged[0]?.span, 2);
  assert.equal(merged[0]?.viz, "donut");
  assert.equal(merged[1]?.id, "clients");
  assert.equal(merged[1]?.visible, false);
  assert.equal(merged.length, WIDGET_IDS.length);
  assert.deepEqual(merged.map((row) => row.id).sort(), [...WIDGET_IDS].sort());
  assert.equal(defaultLayout().length, WIDGET_IDS.length);
});
