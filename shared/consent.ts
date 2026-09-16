import type { ClientPassport, Institution } from "./types.ts";

export const CONSENT_SCOPE_IDS = ["holdings", "risk", "verification", "domicile"] as const;

export type ConsentScopeId = (typeof CONSENT_SCOPE_IDS)[number];

export const CONSENT_SCOPE_META: Record<ConsentScopeId, { label: string; blurb: string }> = {
  holdings: {
    label: "Holdings and sleeves",
    blurb: "Account balances, allocation, and individual securities.",
  },
  risk: {
    label: "Risk posture and liquidity",
    blurb: "Risk label, horizon, private-markets sleeve, and liquidity reserve.",
  },
  verification: {
    label: "Verification badges",
    blurb: "Advisor of record and verified-custodian attestation.",
  },
  domicile: {
    label: "Domicile",
    blurb: "Household residence used for geographic targeting.",
  },
};

const LABEL_TO_ID: Record<string, ConsentScopeId> = {
  "Holdings and sleeves": "holdings",
  "Risk posture and liquidity": "risk",
  "Verification badges": "verification",
  Domicile: "domicile",
};

/** Empty array is a valid state — every scope revoked, master share still independently set. */
export function normalizeScopes(stored: unknown): ConsentScopeId[] {
  if (!Array.isArray(stored)) return [...CONSENT_SCOPE_IDS];
  const next: ConsentScopeId[] = [];
  for (const item of stored) {
    if (typeof item !== "string") continue;
    const id = CONSENT_SCOPE_IDS.includes(item as ConsentScopeId)
      ? (item as ConsentScopeId)
      : LABEL_TO_ID[item];
    if (id && !next.includes(id)) next.push(id);
  }
  return next;
}

export function hasScope(scopes: readonly string[], id: ConsentScopeId): boolean {
  return normalizeScopes(scopes).includes(id);
}

export function scopeLabels(scopes: readonly string[]): string[] {
  return normalizeScopes(scopes).map((id) => CONSENT_SCOPE_META[id].label);
}

/** Targeting floors that read a given slice of the passport. */
export function requiredScopesFor(institution: Institution): ConsentScopeId[] {
  const needed = new Set<ConsentScopeId>();
  if (institution.targeting.minInvestable > 0) needed.add("holdings");
  if (institution.targeting.liquidityMin > 0) needed.add("risk");
  if (institution.targeting.privateMarketsMinPct > 0) needed.add("risk");
  if (institution.targeting.states.length > 0) needed.add("domicile");
  return [...needed];
}

export function withheldScopes(scopes: readonly string[]): ConsentScopeId[] {
  const granted = new Set(normalizeScopes(scopes));
  return CONSENT_SCOPE_IDS.filter((id) => !granted.has(id));
}

/** Institution-side view of a passport: withheld scopes drop the corresponding fields. */
export function redactPassport(passport: ClientPassport): ClientPassport {
  const granted = new Set(normalizeScopes(passport.consent.scopes));
  const next: ClientPassport = {
    ...passport,
    household: { ...passport.household, risk: { ...passport.household.risk } },
    advisor: { ...passport.advisor },
    verifiedCustodian: { ...passport.verifiedCustodian },
  };

  if (!granted.has("holdings")) {
    next.accounts = next.accounts.map((account) => ({ ...account, balance: 0 }));
    next.holdings = [];
    next.allocationTree = [];
    next.allocations = [];
    next.household = {
      ...next.household,
      accountValue: 0,
      investable: 0,
      additionalInvestable: 0,
      householdValue: next.household.realEstate + next.household.otherHousehold,
    };
  }
  if (!granted.has("risk")) {
    next.household = {
      ...next.household,
      liquidity: 0,
      risk: {
        label: "Withheld",
        horizon: "Not shared",
        capacity: "Risk posture is not shared.",
        privateMarketsSleeve: 0,
      },
    };
  }
  if (!granted.has("domicile")) {
    next.household = { ...next.household, domicile: "Withheld" };
  }
  if (!granted.has("verification")) {
    next.advisor = { ...next.advisor, name: "Withheld", firm: "Withheld", verified: false, brokerCheckId: "••••••" };
    next.verifiedCustodian = {
      badge: "Withheld",
      accountMask: "Account ending ••••",
      title: "Verification not shared",
      body: "The household has revoked the verification-badge scope.",
    };
    next.attestations = [];
  }
  return next;
}
