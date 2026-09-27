import assert from "node:assert/strict";
import { test } from "node:test";
import { illustrativeNav } from "./illustrativePath.ts";

test("illustrative index is a stable demo path, not a claimed return", () => {
  const muni = illustrativeNav("Tax-aware municipal SMA");
  assert.deepEqual(muni, illustrativeNav("Tax-aware municipal SMA"));
  assert.equal(muni.length, 36);
  assert.equal(muni[0], 100);
  assert.ok(muni.every((value) => value >= 80 && value <= 150));
  assert.notDeepEqual(muni, illustrativeNav("Family-office OCIO"));
});
