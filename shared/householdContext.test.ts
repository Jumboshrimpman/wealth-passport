import assert from "node:assert/strict";
import { test } from "node:test";
import { schwabLpoaLines } from "./acceptOffer.ts";
import {
  blankEnrollmentContext,
  contactReady,
  enrollmentContextFromStored,
  enrollmentRoleLabel,
  householdImportFor,
  isTrustLike,
  lifeModuleFilled,
  LPOA_SHARE_LINES,
  openLifeModules,
  representedReady,
  trustHouseholdView,
  trusteeLinkLabel,
} from "./householdContext.ts";
import { CLIENT_SEEDS } from "./seed/index.ts";

function client(id: string) {
  const row = CLIENT_SEEDS.find((item) => item.id === id);
  if (!row) throw new Error(`missing ${id}`);
  return row;
}

test("household import builds a family unit and checks trustees against it", () => {
  const elena = client("elena-whitmore");
  const packet = householdImportFor(elena);
  assert.equal(packet.contact.email, "elena.whitmore@example.com");
  assert.equal(packet.contact.mailingAddress, "Greenwich, CT");
  assert.equal(packet.family.length, 1);
  assert.equal(packet.family[0].name, "Marcus Whitmore");
  assert.equal(packet.family[0].relation, "partner");
  assert.equal(packet.family[0].commsConsent, false);
  assert.equal(packet.family[0].dob, "");
  assert.equal(packet.trusts.length, 1);
  assert.equal(packet.trusts[0].name, "Whitmore Family Revocable Trust");
  assert.equal(packet.retirementPlans, "7-year planning window");

  const view = trustHouseholdView("Elena Whitmore", packet.family, packet.trusts);
  assert.equal(view.length, 1);
  const byName = Object.fromEntries(view[0].trustees.map((trustee) => [trustee.name, trustee]));
  assert.equal(byName["Elena Whitmore"].link, "enrollee");
  assert.equal(byName["Marcus Whitmore"].link, "family");
  assert.equal(trusteeLinkLabel(byName["Marcus Whitmore"]), "In the family unit · Partner");
  assert.equal(byName["Whitmore 2008 GST"].link, "outside");
  assert.equal(trusteeLinkLabel(byName["Whitmore 2008 GST"]), "Not in the family unit");
});

test("a single principal has no partner, and an LLC is not treated as a trust", () => {
  const hannah = client("lindqvist-estate");
  const packet = householdImportFor(hannah);
  assert.equal(packet.family.length, 0);
  assert.equal(packet.trusts[0]?.name, "Lindqvist Inheritance Trust");
  assert.deepEqual(packet.trusts[0]?.trustees, ["Hannah Lindqvist"]);

  const fernandez = client("fernandez-family");
  assert.equal(isTrustLike(fernandez.household.entity), false);
  assert.equal(householdImportFor(fernandez).trusts.length, 0);
  assert.equal(isTrustLike("Ashworth Family Settlement"), true);
});

test("life modules stay hidden once an import already has them", () => {
  const life = blankEnrollmentContext().life;
  assert.deepEqual(openLifeModules(life, false), [
    "retirement",
    "education",
    "life-events",
    "eldercare",
    "values",
  ]);

  const imported = {
    ...life,
    retirementPlans: "7-year planning window",
    retirementPlansImported: true,
    education: "529 for a child",
  };
  assert.equal(lifeModuleFilled(imported, "retirement"), false);
  assert.equal(lifeModuleFilled({ ...imported, retirementAge: "62" }, "retirement"), true);
  const open = openLifeModules({ ...imported, retirementAge: "62" }, true);
  assert.equal(open.includes("retirement"), false);
  assert.equal(open.includes("education"), false);
  assert.equal(open.includes("eldercare"), true);
  assert.deepEqual(openLifeModules({ ...imported, retirementAge: "62" }, false).length, 5);
});

test("contact and client-authority gates stay closed until the required answers are in", () => {
  const contact = blankEnrollmentContext().contact;
  assert.equal(contactReady(contact), false);
  assert.equal(
    contactReady({ ...contact, email: "elena.whitmore@example.com", mailingAddress: "Greenwich, CT", commsConsent: true }),
    true,
  );
  assert.equal(
    contactReady({
      ...contact,
      email: "elena.whitmore@example.com",
      mailingAddress: "Greenwich, CT",
      commsConsent: false,
    }),
    false,
  );

  assert.equal(representedReady(null), false);
  assert.equal(
    representedReady({ name: "Elena Whitmore", email: "elena.whitmore@example.com", authorityAcknowledged: false }),
    false,
  );
  assert.equal(
    representedReady({ name: "Elena Whitmore", email: "elena.whitmore@example.com", authorityAcknowledged: true }),
    true,
  );
});

test("LPOA share copy is permission to provide a document, not an LPOA", () => {
  const text = LPOA_SHARE_LINES.join(" ");
  assert.match(text, /This is not a limited power of attorney/);
  assert.match(text, /permission for WealthPass to provide your existing LPOA/);
  assert.match(text, /manager you select sets up the Schwab brokerage/);
  assert.match(text, /WealthPass does not/);
  assert.equal(/WealthPass will set up/i.test(text), false);
  assert.equal(/WealthPass (holds|is) the (limited power|LPOA)/i.test(text), false);
  assert.equal(text.toLowerCase().includes(["paid", "placement"].join(" ")), false);

  const brokerage = schwabLpoaLines({
    party: "Meridian Global Asset Management",
    strategy: "Tax-aware municipal SMA",
    accountName: "Private Wealth brokerage",
  }).join(" ");
  assert.match(brokerage, /selected Manager will set up a brokerage with Schwab/);
  assert.equal(brokerage.includes("WealthPass will set up a brokerage"), false);
});

test("stored profiles without the new context still read as a client enrollment", () => {
  const context = enrollmentContextFromStored({ isFinancialAdvisor: false });
  assert.equal(context.enrolleeRole, "client");
  assert.equal(context.lpoaShare, "unset");
  assert.equal(context.contact.commsConsent, false);
  assert.equal(enrollmentRoleLabel({ isFinancialAdvisor: true }), "Financial advisor");
  assert.equal(
    enrollmentRoleLabel({
      enrolleeRole: "associate",
      representedClient: { name: "Priya Shah", email: "priya.shah@example.com", authorityAcknowledged: true },
    }),
    "Client associate for Priya Shah",
  );
});
