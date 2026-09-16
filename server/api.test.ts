import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { emptyEnrollmentPayload, type EnrollmentPayload } from "../shared/enrollment.ts";
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

test("seeds the household book and persists consent on the selected client", async () => {
  await withApi(async (base) => {
    const list = await fetch(`${base}/api/clients`).then((res) => res.json());
    assert.equal(list.clients.length, 10);
    const ids = list.clients.map((row: { id: string }) => row.id).sort();
    assert.deepEqual(ids, [
      "ashworth-family",
      "beaumont-family",
      "chen-family",
      "delgado-family",
      "elena-whitmore",
      "fernandez-family",
      "lindqvist-estate",
      "nakamura-family",
      "okafor-trust",
      "priya-shah",
    ]);

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

test("matching varies across the wider household book", async () => {
  await withApi(async (base) => {
    const eligibleIds = async (clientId: string) => {
      const body = await fetch(`${base}/api/clients/${clientId}/offers`).then((res) => res.json());
      return body.eligible
        .map((match: { institution: { id: string } }) => match.institution.id)
        .sort();
    };
    assert.deepEqual(await eligibleIds("okafor-trust"), ["first-atlantic", "meridian", "oakridge"]);
    assert.deepEqual(await eligibleIds("chen-family"), ["meridian"]);
    assert.deepEqual(await eligibleIds("beaumont-family"), ["first-atlantic", "oakridge"]);
    assert.deepEqual(await eligibleIds("ashworth-family"), ["oakridge"]);
    assert.deepEqual(await eligibleIds("delgado-family"), []);
    assert.deepEqual(await eligibleIds("nakamura-family"), []);
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
    assert.equal(initial.layout.length, 7);
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
    assert.equal(saved.layout.length, 7);

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

test("books placement revenue when a client accepts an offer", async () => {
  await withApi(async (base) => {
    const accepted = await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "elena-whitmore", offerId: "offer-muni", status: "accepted" }),
    });
    assert.equal(accepted.status, 200);
    const body = await accepted.json();
    // 9 bps on $228M investable = $205,200 annualized.
    assert.equal(body.placement.annualRevenue, 205_200);
    assert.equal(body.placement.institutionId, "meridian");
    assert.equal(body.placement.status, "accepted");
    assert.equal(body.placements.length, 1);

    const declined = await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "elena-whitmore", offerId: "offer-sbl", status: "declined" }),
    });
    assert.equal(declined.status, 200);

    const forClient = await fetch(`${base}/api/clients/elena-whitmore/placements`).then((res) =>
      res.json(),
    );
    assert.equal(forClient.placements.length, 2);

    const all = await fetch(`${base}/api/placements`).then((res) => res.json());
    assert.equal(all.placements.length, 2);

    // Re-deciding the same offer updates the row instead of duplicating it.
    const flip = await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "elena-whitmore", offerId: "offer-sbl", status: "accepted" }),
    });
    assert.equal(flip.status, 200);
    const after = await fetch(`${base}/api/placements`).then((res) => res.json());
    assert.equal(after.placements.length, 2);
    const sbl = after.placements.find(
      (row: { offerId: string }) => row.offerId === "offer-sbl",
    );
    assert.equal(sbl.status, "accepted");
    // 12 bps on $228M investable = $273,600 annualized.
    assert.equal(sbl.annualRevenue, 273_600);

    const missingClient = await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "nope", offerId: "offer-muni", status: "accepted" }),
    });
    assert.equal(missingClient.status, 404);
    const missingOffer = await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "elena-whitmore", offerId: "nope", status: "accepted" }),
    });
    assert.equal(missingOffer.status, 404);
    const badStatus = await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "elena-whitmore", offerId: "offer-muni", status: "maybe" }),
    });
    assert.equal(badStatus.status, 400);
  });
});

test("blocks placements while passport share consent is off", async () => {
  await withApi(async (base) => {
    await fetch(`${base}/api/clients/priya-shah/consent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared: false }),
    });
    const blocked = await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "priya-shah", offerId: "offer-muni", status: "accepted" }),
    });
    assert.equal(blocked.status, 403);
    const forClient = await fetch(`${base}/api/clients/priya-shah/placements`).then((res) =>
      res.json(),
    );
    assert.equal(forClient.placements.length, 0);
  });
});

test("resolves EDD files with manual compliance sign-off", async () => {
  await withApi(async (base) => {
    const payload = validPayload((draft) => {
      draft.account.fullName = "Maria Santos";
      draft.acknowledgments.signatureName = "Maria Santos";
    });
    const submitted = await postEnrollment(base, payload).then((res) => res.json());
    assert.equal(submitted.enrollment.status, "edd");
    const enrollmentId = submitted.enrollment.id as string;

    const approved = await fetch(`${base}/api/enrollments/${enrollmentId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approved", officer: "Sama Compliance" }),
    });
    assert.equal(approved.status, 200);
    const approvedBody = await approved.json();
    assert.equal(approvedBody.enrollment.status, "approved");
    assert.match(approvedBody.enrollment.decision.accountId, /^WP-/);
    assert.ok(
      approvedBody.enrollment.decision.reasons.some((reason: string) =>
        reason.includes("Manual review: approved by Sama Compliance"),
      ),
    );

    // Resolved files cannot be resolved again.
    const again = await fetch(`${base}/api/enrollments/${enrollmentId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "rejected", officer: "Sama Compliance" }),
    });
    assert.equal(again.status, 409);

    const missing = await fetch(`${base}/api/enrollments/nope/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approved", officer: "Sama Compliance" }),
    });
    assert.equal(missing.status, 404);

    const badBody = await fetch(`${base}/api/enrollments/${enrollmentId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "maybe", officer: "Sama Compliance" }),
    });
    assert.equal(badBody.status, 400);

    const { events } = await fetch(`${base}/api/admin/events`).then((res) => res.json());
    assert.equal(events[0].kind, "enrollment.decided");
    assert.match(events[0].summary, /Sama Compliance approved the enrollment for Maria Santos/);
  });
});

test("writes an append-only audit event for each decision", async () => {
  await withApi(async (base) => {
    await fetch(`${base}/api/clients/priya-shah/consent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared: false }),
    });
    await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "elena-whitmore", offerId: "offer-muni", status: "accepted" }),
    });

    const { events } = await fetch(`${base}/api/admin/events`).then((res) => res.json());
    assert.equal(events.length, 2);
    // Newest first.
    assert.equal(events[0].kind, "placement.decided");
    assert.match(events[0].summary, /Whitmore Household accepted Meridian/);
    assert.match(events[0].summary, /\$205,200\/yr/);
    assert.equal(events[1].kind, "consent.changed");
    assert.match(events[1].summary, /Shah Household turned passport share off/);
    assert.ok(events[0].id > events[1].id);

    const limited = await fetch(`${base}/api/admin/events?limit=1`).then((res) => res.json());
    assert.equal(limited.events.length, 1);
    assert.equal(limited.events[0].kind, "placement.decided");
  });
});

function validPayload(overrides?: (payload: EnrollmentPayload) => void): EnrollmentPayload {
  const payload = emptyEnrollmentPayload();
  payload.account = {
    fullName: "Jordan Reyes",
    email: "jordan.reyes@example.com",
    phone: "+1 203 555 0184",
  };
  payload.identity = {
    idType: "passport",
    idNumber: "X1234567",
    idExpiry: "2031-01-01",
    issuingCountry: "United States",
    livenessConfirmed: true,
  };
  payload.personal.dob = "1988-04-17";
  payload.personal.citizenship = "United States";
  payload.personal.address = {
    street: "12 Elm Street",
    city: "Greenwich",
    state: "CT",
    postalCode: "06830",
    country: "United States",
  };
  payload.personal.occupation = "Surgeon";
  payload.personal.industry = "Healthcare";
  payload.financial.sourceOfFundsDocs = ["Tax returns (last 2 years)"];
  payload.acknowledgments = {
    amlProgram: true,
    privacyPolicy: true,
    sanctionsDisclosure: true,
    reportChanges: true,
    signatureName: "Jordan Reyes",
  };
  overrides?.(payload);
  return payload;
}

async function postEnrollment(base: string, payload: EnrollmentPayload) {
  return fetch(`${base}/api/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
}

test("enrollment auto-approves a clean low-risk applicant and persists", async () => {
  await withApi(async (base) => {
    const created = await postEnrollment(base, validPayload());
    assert.equal(created.status, 201);
    const { enrollment } = await created.json();
    assert.equal(enrollment.status, "approved");
    assert.equal(enrollment.decision.status, "approved");
    assert.match(enrollment.decision.accountId, /^WP-\d{8}$/);
    assert.equal(enrollment.risk.level, "low");
    assert.equal(enrollment.risk.score, 0);
    assert.equal(enrollment.screening.sanctions.status, "no-hit");

    const list = await fetch(`${base}/api/enrollments`).then((res) => res.json());
    assert.equal(list.enrollments.length, 1);
    assert.equal(list.enrollments[0].fullName, "Jordan Reyes");
    assert.equal(list.enrollments[0].status, "approved");

    const reread = await fetch(`${base}/api/enrollments/${enrollment.id}`).then((res) => res.json());
    assert.equal(reread.enrollment.payload.account.email, "jordan.reyes@example.com");

    const missing = await fetch(`${base}/api/enrollments/not-an-enrollment`);
    assert.equal(missing.status, 404);
  });
});

test("enrollment rejects a high-confidence sanctions hit", async () => {
  await withApi(async (base) => {
    const created = await postEnrollment(
      base,
      validPayload((payload) => {
        payload.account.fullName = "Ivan Petrov";
        payload.acknowledgments.signatureName = "Ivan Petrov";
      }),
    );
    assert.equal(created.status, 201);
    const { enrollment } = await created.json();
    assert.equal(enrollment.status, "rejected");
    assert.equal(enrollment.decision.accountId, null);
    assert.equal(enrollment.screening.sanctions.status, "high-confidence");
    assert.equal(enrollment.screening.sanctions.hits[0].list, "OFAC SDN");
    assert.equal(enrollment.risk.level, "high");
  });
});

test("enrollment routes PEP and complex business files to EDD", async () => {
  await withApi(async (base) => {
    const created = await postEnrollment(
      base,
      validPayload((payload) => {
        payload.pep.isPep = true;
        payload.pep.pepRole = "City treasurer";
        payload.pep.pepCountry = "United States";
        payload.entity.isBusiness = true;
        payload.entity.legalName = "Reyes Holdings LLC";
        payload.entity.formationJurisdiction = "Delaware, USA";
        payload.entity.businessActivity = "Real estate holding company";
        payload.entity.signatoryRole = "Managing member";
        payload.entity.owners = [
          { name: "Jordan Reyes", ownershipPct: 60, isEntity: false },
          { name: "Reyes Family Trust", ownershipPct: 40, isEntity: true },
        ];
      }),
    );
    assert.equal(created.status, 201);
    const { enrollment } = await created.json();
    assert.equal(enrollment.status, "edd");
    assert.equal(enrollment.decision.accountId, null);
    assert.ok(enrollment.risk.score >= 30);
    assert.ok(enrollment.risk.score < 70);
    assert.ok(
      enrollment.decision.eddChecklist.some((item: string) => item.includes("PEP role verification")),
    );
    assert.ok(
      enrollment.decision.eddChecklist.some((item: string) =>
        item.includes("beneficial-ownership register"),
      ),
    );
    assert.ok(
      enrollment.risk.factors.some(
        (factor: { label: string }) => factor.label === "Cascading entity ownership (intermediate legal entity)",
      ),
    );
  });
});

test("enrollment rejects invalid payloads with field errors", async () => {
  await withApi(async (base) => {
    const payload = validPayload((draft) => {
      draft.account.email = "not-an-email";
      draft.personal.dob = "2015-01-01";
      draft.acknowledgments.amlProgram = false;
    });
    const response = await postEnrollment(base, payload);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.errors.some((error: string) => error.includes("email")));
    assert.ok(body.errors.some((error: string) => error.includes("18")));
    assert.ok(body.errors.some((error: string) => error.includes("AML/CFT")));

    const empty = await fetch(`${base}/api/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(empty.status, 400);
  });
});

test("persists per-scope consent and withholds numeric match reasons", async () => {
  await withApi(async (base) => {
    const patched = await fetch(`${base}/api/clients/elena-whitmore/consent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scopes: ["Holdings and sleeves", "risk", "verification"] }),
    }).then((res) => res.json());
    assert.deepEqual(patched.client.consent.scopes, ["holdings", "risk", "verification"]);
    assert.equal(patched.client.consent.shared, true);

    const body = await fetch(`${base}/api/clients/elena-whitmore/offers`).then((res) => res.json());
    assert.deepEqual(
      body.eligible.map((match: { institution: { id: string } }) => match.institution.id),
      ["oakridge"],
    );
    const meridian = body.matches.find(
      (match: { institution: { id: string } }) => match.institution.id === "meridian",
    );
    assert.equal(meridian.eligible, false);
    assert.ok(meridian.reasons.some((reason: string) => reason.includes("Domicile is not shared")));
    assert.equal(
      meridian.reasons.some((reason: string) => reason.includes("Greenwich, CT")),
      false,
    );

    const { events } = await fetch(`${base}/api/admin/events`).then((res) => res.json());
    assert.equal(events[0].kind, "consent.changed");
    assert.match(events[0].summary, /set shared scopes to Holdings and sleeves, Risk posture and liquidity, Verification badges/);
  });
});

test("records campaign funnel counters and cost per accept", async () => {
  await withApi(async (base) => {
    const before = await fetch(`${base}/api/campaigns`).then((res) => res.json());
    assert.equal(before.campaigns.length, 3);
    assert.ok(before.campaigns.every((row: { views: number }) => row.views === 0));

    await fetch(`${base}/api/clients/elena-whitmore/offers`);
    await fetch(`${base}/api/placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: "elena-whitmore", offerId: "offer-muni", status: "accepted" }),
    });

    const after = await fetch(`${base}/api/campaigns`).then((res) => res.json());
    const meridian = after.campaigns.find((row: { institutionId: string }) => row.institutionId === "meridian");
    assert.equal(meridian.views, 1);
    assert.equal(meridian.matches, 1);
    assert.equal(meridian.impressions, 1);
    assert.equal(meridian.accepts, 1);
    assert.equal(meridian.bookedRevenue, 205_200);
    assert.equal(meridian.costPerAccept, 205_200);
  });
});

test("stores the admin PII-mask toggle", async () => {
  await withApi(async (base) => {
    const initial = await fetch(`${base}/api/admin/privacy`).then((res) => res.json());
    assert.equal(initial.maskPii, false);

    const put = await fetch(`${base}/api/admin/privacy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maskPii: true }),
    });
    assert.equal(put.status, 200);
    assert.equal((await put.json()).maskPii, true);

    const reread = await fetch(`${base}/api/admin/privacy`).then((res) => res.json());
    assert.equal(reread.maskPii, true);

    const bad = await fetch(`${base}/api/admin/privacy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(bad.status, 400);
  });
});
