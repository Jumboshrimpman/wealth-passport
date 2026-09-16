import assert from "node:assert/strict";
import { test } from "node:test";
import {
  maskAccountRef,
  maskDob,
  maskEmail,
  maskFreeText,
  maskName,
  maskPhone,
} from "./privacy.ts";

test("display-time PII helpers keep source-shaped but unreadable values", () => {
  assert.equal(maskName("Elena Whitmore"), "E. Whitmore");
  assert.equal(maskName("Elena"), "E.");
  assert.equal(maskEmail("elena.whitmore@example.com"), "e•••@example.com");
  assert.equal(maskPhone("+1 203 555 0184"), "••• ••• 0184");
  assert.equal(maskDob("1988-04-17"), "••••-••-••");
  assert.equal(maskAccountRef("Account ending 4412"), "Account ending ••••");
  assert.match(maskFreeText("Email elena@firm.com and +1 203-555-0184"), /e•••@firm\.com/);
  assert.match(maskFreeText("Email elena@firm.com and +1 203-555-0184"), /••• ••• ••••/);
});
