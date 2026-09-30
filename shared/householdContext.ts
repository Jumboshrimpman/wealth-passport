import type { ClientRecord } from "./types.ts";

/** Who is filling out enrollment. Client is the default. */
export type EnrolleeRole = "client" | "advisor" | "associate";

export interface RepresentedClient {
  name: string;
  email: string;
  /** The enrollee confirms they have authority to enroll this client. */
  authorityAcknowledged: boolean;
}

export interface ContactDetails {
  email: string;
  mailingAddress: string;
  /** Explicit permission for WealthPass to contact this person. */
  commsConsent: boolean;
  /** Email and mailing address arrived from a connection, so they are not asked again. */
  imported: boolean;
}

export type FamilyRelation = "partner" | "child" | "parent" | "sibling" | "other";

export interface FamilyMember {
  id: string;
  relation: FamilyRelation;
  name: string;
  email: string;
  dob: string;
  address: string;
  commsConsent: boolean;
  source: "import" | "manual";
}

export interface TrustRecord {
  id: string;
  name: string;
  trustees: string[];
  source: "import" | "manual";
}

export type SectionStatus = "open" | "later" | "skipped" | "saved";

export type TrusteeLink = "enrollee" | "family" | "outside";

export interface TrusteeMatch {
  name: string;
  link: TrusteeLink;
  relation: FamilyRelation | null;
}

export interface TrustHouseholdView {
  trustName: string;
  trustees: TrusteeMatch[];
}

export type EstateChoice = "unset" | "connected" | "later" | "skipped";

export interface EstateRecord {
  choice: EstateChoice;
  /** Demo connection label only. Nothing is stored in a vault. */
  label: string;
}

export interface LifeContext {
  retirementAge: string;
  retirementPlans: string;
  retirementPlansImported: boolean;
  education: string;
  lifeEvents: string;
  eldercare: string;
  values: string;
}

export type LifeModuleId = "retirement" | "education" | "life-events" | "eldercare" | "values";

/** Permission to provide an existing LPOA. This choice is not itself an LPOA. */
export type LpoaShareChoice = "unset" | "permit" | "decline";

export const RESTRICTION_SECTORS = [
  "Communication services",
  "Consumer discretionary",
  "Consumer staples",
  "Energy",
  "Financials",
  "Health care",
  "Industrials",
  "Information technology",
  "Materials",
  "Real estate",
  "Utilities",
] as const;

export type RestrictionSector = (typeof RESTRICTION_SECTORS)[number];

/** Client-stated or custodian-imported names the household cannot be enrolled in. Not a legal determination. */
export interface InvestmentRestrictions {
  tickers: string[];
  sectors: string[];
  notes: string;
  imported: boolean;
  status: SectionStatus;
}

/** Municipal state preference. Not tax advice. */
export interface FixedIncomePreference {
  inState: boolean;
  states: string[];
  imported: boolean;
  status: SectionStatus;
}

export const RESTRICTION_COPY =
  "These are restrictions stated by the client or imported from a custodian. WealthPass does not give legal, tax, or compliance advice.";

export const FIXED_INCOME_PREF_COPY =
  "A preference for municipal bonds of certain states, including an in-state preference. For matching later. This is not tax advice.";

export const US_STATES: { code: string; name: string }[] = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

export interface EnrollmentContext {
  enrolleeRole: EnrolleeRole;
  representedClient: RepresentedClient | null;
  contact: ContactDetails;
  family: FamilyMember[];
  familyStatus: SectionStatus;
  trusts: TrustRecord[];
  trustStatus: SectionStatus;
  estate: EstateRecord;
  life: LifeContext;
  lifeImported: boolean;
  restrictions: InvestmentRestrictions;
  fixedIncome: FixedIncomePreference;
  lpoaShare: LpoaShareChoice;
}

export interface HouseholdImport {
  contact: { email: string; mailingAddress: string };
  family: FamilyMember[];
  trusts: TrustRecord[];
  /** Planning window already on the household record, when there is one. */
  retirementPlans: string;
  /** Present only when a custodian or prior import already has restrictions. */
  restrictions: InvestmentRestrictions | null;
  /** Present only when a custodian or prior import already has a municipal state preference. */
  fixedIncome: FixedIncomePreference | null;
}

export const ROLE_OPTIONS: { id: EnrolleeRole; label: string; note: string }[] = [
  { id: "client", label: "I am the client", note: "You are enrolling yourself." },
  { id: "advisor", label: "I am a financial advisor", note: "You are enrolling a client." },
  { id: "associate", label: "I am a client associate", note: "You are enrolling a client." },
];

export const FAMILY_RELATIONS: { id: FamilyRelation; label: string }[] = [
  { id: "partner", label: "Partner" },
  { id: "child", label: "Child" },
  { id: "parent", label: "Parent" },
  { id: "sibling", label: "Sibling" },
  { id: "other", label: "Other relative" },
];

export const LIFE_MODULES: { id: LifeModuleId; title: string; body: string }[] = [
  {
    id: "retirement",
    title: "Retirement",
    body: "Age and retirement plans, so a strategy can fit the timeline.",
  },
  {
    id: "education",
    title: "Education planning",
    body: "For you or a child, including 529-style liquidity.",
  },
  {
    id: "life-events",
    title: "Life events",
    body: "Marriage, divorce, or the death of someone close.",
  },
  {
    id: "eldercare",
    title: "Eldercare",
    body: "Care for a parent or older relative, if it changes timing or liquidity.",
  },
  {
    id: "values",
    title: "ESG and causes",
    body: "Nonprofits, social causes, or other values for strategy fit.",
  },
];

/**
 * Permission to provide an existing LPOA. Not an LPOA, and not a brokerage account.
 * The selected manager sets up the Schwab brokerage.
 */
export const LPOA_SHARE_LINES = [
  "This is not a limited power of attorney.",
  "It is only your permission for WealthPass to provide your existing LPOA to an asset manager you consent to.",
  "The manager you select sets up the Schwab brokerage. WealthPass does not.",
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function roleActsForClient(role: EnrolleeRole): boolean {
  return role === "advisor" || role === "associate";
}

export function roleTitle(role: EnrolleeRole): string {
  if (role === "advisor") return "Financial advisor";
  if (role === "associate") return "Client associate";
  return "Client";
}

export function enrollmentRoleLabel(input: {
  enrolleeRole?: EnrolleeRole;
  isFinancialAdvisor?: boolean;
  representedClient?: RepresentedClient | null;
}): string {
  const role = input.enrolleeRole ?? (input.isFinancialAdvisor ? "advisor" : "client");
  const title = roleTitle(role);
  if (role === "client") return title;
  const name = input.representedClient?.name.trim() ?? "";
  return name ? `${title} for ${name}` : title;
}

export function blankContact(): ContactDetails {
  return { email: "", mailingAddress: "", commsConsent: false, imported: false };
}

export function blankLife(): LifeContext {
  return {
    retirementAge: "",
    retirementPlans: "",
    retirementPlansImported: false,
    education: "",
    lifeEvents: "",
    eldercare: "",
    values: "",
  };
}

export function blankRepresentedClient(): RepresentedClient {
  return { name: "", email: "", authorityAcknowledged: false };
}

export function blankRestrictions(): InvestmentRestrictions {
  return { tickers: [], sectors: [], notes: "", imported: false, status: "open" };
}

export function blankFixedIncome(): FixedIncomePreference {
  return { inState: false, states: [], imported: false, status: "open" };
}

export function blankEnrollmentContext(): EnrollmentContext {
  return {
    enrolleeRole: "client",
    representedClient: null,
    contact: blankContact(),
    family: [],
    familyStatus: "open",
    trusts: [],
    trustStatus: "open",
    estate: { choice: "unset", label: "" },
    life: blankLife(),
    lifeImported: false,
    restrictions: blankRestrictions(),
    fixedIncome: blankFixedIncome(),
    lpoaShare: "unset",
  };
}

export function normalizeTicker(raw: string): string | null {
  const ticker = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{1,5}(?:[.-][A-Z]{1,2})?$/.test(ticker)) return null;
  return ticker;
}

export function domicileStateCode(domicile: string): string | null {
  const match = /,\s*([A-Z]{2})\b/.exec(domicile.trim());
  if (!match) return null;
  return US_STATES.some((state) => state.code === match[1]) ? match[1] : null;
}

export function stateName(code: string): string {
  return US_STATES.find((state) => state.code === code)?.name ?? code;
}

/** What a later match or filter can read. Skipped and deferred answers stay off. */
export function statedConstraints(input: {
  restrictions: InvestmentRestrictions;
  fixedIncome: FixedIncomePreference;
  domicile: string;
}): {
  restrictedTickers: string[];
  restrictedSectors: string[];
  notes: string;
  preferInStateMunis: boolean;
  muniStates: string[];
} {
  const restrictionsActive = input.restrictions.status === "saved" || input.restrictions.imported;
  const preferenceActive = input.fixedIncome.status === "saved" || input.fixedIncome.imported;
  const states = new Set<string>();
  if (preferenceActive) {
    for (const code of input.fixedIncome.states) states.add(code.toUpperCase());
    const home = domicileStateCode(input.domicile);
    if (input.fixedIncome.inState && home) states.add(home);
  }
  return {
    restrictedTickers: restrictionsActive ? input.restrictions.tickers : [],
    restrictedSectors: restrictionsActive ? input.restrictions.sectors : [],
    notes: restrictionsActive ? input.restrictions.notes.trim() : "",
    preferInStateMunis: preferenceActive && input.fixedIncome.inState,
    muniStates: preferenceActive ? [...states] : [],
  };
}

export function contactReady(contact: ContactDetails): boolean {
  return EMAIL_PATTERN.test(contact.email.trim()) && contact.mailingAddress.trim().length > 0 && contact.commsConsent;
}

export function representedReady(client: RepresentedClient | null): boolean {
  if (!client) return false;
  return client.name.trim().length > 0 && EMAIL_PATTERN.test(client.email.trim()) && client.authorityAcknowledged;
}

export function lpoaShareReady(choice: LpoaShareChoice): boolean {
  return choice === "permit" || choice === "decline";
}

export function relationLabel(relation: FamilyRelation): string {
  return FAMILY_RELATIONS.find((option) => option.id === relation)?.label ?? "Relative";
}

export function trusteeLinkLabel(match: TrusteeMatch): string {
  if (match.link === "enrollee") return "Enrollee";
  if (match.link === "family") {
    return match.relation ? `In the family unit · ${relationLabel(match.relation)}` : "In the family unit";
  }
  return "Not in the family unit";
}

export function demoEmail(fullName: string): string {
  const slug = fullName
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return slug ? `${slug}@example.com` : "";
}

/** Same shape as the marketplace full-name helper, kept here to avoid a circular import. */
export function enrolleeName(client: ClientRecord): string {
  const first = client.household.clientFirstName.trim();
  const last = client.household.principals.trim().split(/\s+/).pop() ?? "";
  if (!last || last.toLowerCase() === first.toLowerCase()) return first;
  return `${first} ${last}`;
}

export function isTrustLike(entity: string): boolean {
  return /\b(trust|settlement)\b/i.test(entity);
}

function partnerName(client: ClientRecord): string | null {
  const match = /^(.+?) & (.+)$/.exec(client.household.principals.trim());
  if (!match) return null;
  const partner = match[2].trim();
  return partner || null;
}

function outsideParty(client: ClientRecord): string | null {
  const field = client.opsPacket.fields.find((row) => row.label === "Beneficiaries");
  if (!field) return null;
  const match = /Contingent:\s*([^·]+)/.exec(field.value);
  if (!match) return null;
  const name = match[1].trim();
  if (!name || /^(spouse|family trust|none)$/i.test(name)) return null;
  return name;
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function householdImportFor(client: ClientRecord): HouseholdImport {
  const enrollee = enrolleeName(client);
  const partner = partnerName(client);
  const family: FamilyMember[] = partner
    ? [
        {
          id: `${client.id}-partner`,
          relation: "partner",
          name: partner,
          email: demoEmail(partner),
          dob: "",
          address: client.household.domicile,
          commsConsent: false,
          source: "import",
        },
      ]
    : [];

  const trusts: TrustRecord[] = [];
  if (isTrustLike(client.household.entity)) {
    const trustees = [enrollee];
    if (partner) trustees.push(partner);
    const outside = outsideParty(client);
    if (outside && !trustees.some((name) => sameName(name, outside))) trustees.push(outside);
    trusts.push({
      id: `${client.id}-trust`,
      name: client.household.entity,
      trustees,
      source: "import",
    });
  }

  return {
    contact: {
      email: demoEmail(enrollee),
      mailingAddress: client.household.domicile,
    },
    family,
    trusts,
    retirementPlans: client.household.risk.horizon.trim(),
    restrictions: importedRestrictions(client.id),
    fixedIncome: importedFixedIncome(client.id),
  };
}

/**
 * Demo custodian packets. Only households whose seed already carries a restriction
 * or a municipal preference are returned. Everyone else is asked, and can skip.
 */
function importedRestrictions(clientId: string): InvestmentRestrictions | null {
  if (clientId === "elena-whitmore") {
    return {
      tickers: ["MS", "GS"],
      sectors: ["Financials"],
      notes: "Board service, as stated on the Merrill relationship.",
      imported: true,
      status: "saved",
    };
  }
  return null;
}

function importedFixedIncome(clientId: string): FixedIncomePreference | null {
  if (clientId === "elena-whitmore") {
    return {
      inState: true,
      states: ["NY"],
      imported: true,
      status: "saved",
    };
  }
  return null;
}

export function trustHouseholdView(
  enrollee: string,
  family: readonly FamilyMember[],
  trusts: readonly TrustRecord[],
): TrustHouseholdView[] {
  return trusts.map((trust) => ({
    trustName: trust.name,
    trustees: trust.trustees.map((name) => {
      if (sameName(name, enrollee)) return { name, link: "enrollee" as const, relation: null };
      const member = family.find((person) => sameName(person.name, name));
      if (member) return { name, link: "family" as const, relation: member.relation };
      return { name, link: "outside" as const, relation: null };
    }),
  }));
}

export function lifeModuleFilled(life: LifeContext, id: LifeModuleId): boolean {
  if (id === "retirement") {
    return life.retirementPlansImported && life.retirementPlans.trim().length > 0 && life.retirementAge.trim().length > 0;
  }
  if (id === "education") return life.education.trim().length > 0;
  if (id === "life-events") return life.lifeEvents.trim().length > 0;
  if (id === "eldercare") return life.eldercare.trim().length > 0;
  return life.values.trim().length > 0;
}

/** Modules still worth asking. Imported answers stay off this list. */
export function openLifeModules(life: LifeContext, imported: boolean): LifeModuleId[] {
  const all = LIFE_MODULES.map((module) => module.id);
  if (!imported) return all;
  return all.filter((id) => !lifeModuleFilled(life, id));
}

const ROLES = new Set<EnrolleeRole>(["client", "advisor", "associate"]);
const SECTION = new Set<SectionStatus>(["open", "later", "skipped", "saved"]);
const ESTATE = new Set<EstateChoice>(["unset", "connected", "later", "skipped"]);
const LPOA = new Set<LpoaShareChoice>(["unset", "permit", "decline"]);

/** Fill context fields missing from an older stored demo profile. */
export function enrollmentContextFromStored(
  stored: Partial<EnrollmentContext> & { isFinancialAdvisor?: boolean },
): EnrollmentContext {
  const blank = blankEnrollmentContext();
  const role = ROLES.has(stored.enrolleeRole as EnrolleeRole)
    ? (stored.enrolleeRole as EnrolleeRole)
    : stored.isFinancialAdvisor
      ? "advisor"
      : "client";
  const contact = { ...blank.contact, ...(stored.contact ?? {}) };
  const life = { ...blank.life, ...(stored.life ?? {}) };
  const estateChoice = stored.estate?.choice;
  return {
    enrolleeRole: role,
    representedClient: stored.representedClient ?? null,
    contact: {
      email: typeof contact.email === "string" ? contact.email : "",
      mailingAddress: typeof contact.mailingAddress === "string" ? contact.mailingAddress : "",
      commsConsent: contact.commsConsent === true,
      imported: contact.imported === true,
    },
    family: Array.isArray(stored.family) ? stored.family : [],
    familyStatus: SECTION.has(stored.familyStatus as SectionStatus) ? (stored.familyStatus as SectionStatus) : "open",
    trusts: Array.isArray(stored.trusts) ? stored.trusts : [],
    trustStatus: SECTION.has(stored.trustStatus as SectionStatus) ? (stored.trustStatus as SectionStatus) : "open",
    estate: {
      choice: ESTATE.has(estateChoice as EstateChoice) ? (estateChoice as EstateChoice) : "unset",
      label: typeof stored.estate?.label === "string" ? stored.estate.label : "",
    },
    life: {
      retirementAge: typeof life.retirementAge === "string" ? life.retirementAge : "",
      retirementPlans: typeof life.retirementPlans === "string" ? life.retirementPlans : "",
      retirementPlansImported: life.retirementPlansImported === true,
      education: typeof life.education === "string" ? life.education : "",
      lifeEvents: typeof life.lifeEvents === "string" ? life.lifeEvents : "",
      eldercare: typeof life.eldercare === "string" ? life.eldercare : "",
      values: typeof life.values === "string" ? life.values : "",
    },
    lifeImported: stored.lifeImported === true,
    restrictions: normalizeRestrictions(stored.restrictions),
    fixedIncome: normalizeFixedIncome(stored.fixedIncome),
    lpoaShare: LPOA.has(stored.lpoaShare as LpoaShareChoice) ? (stored.lpoaShare as LpoaShareChoice) : "unset",
  };
}

function normalizeRestrictions(value: InvestmentRestrictions | undefined): InvestmentRestrictions {
  const blank = blankRestrictions();
  if (!value) return blank;
  const tickers = Array.isArray(value.tickers)
    ? [...new Set(value.tickers.map((ticker) => normalizeTicker(String(ticker))).filter((ticker): ticker is string => Boolean(ticker)))]
    : [];
  const sectors = Array.isArray(value.sectors)
    ? value.sectors.filter((sector): sector is RestrictionSector =>
        RESTRICTION_SECTORS.includes(sector as RestrictionSector),
      )
    : [];
  return {
    tickers,
    sectors,
    notes: typeof value.notes === "string" ? value.notes : "",
    imported: value.imported === true,
    status: SECTION.has(value.status) ? value.status : "open",
  };
}

function normalizeFixedIncome(value: FixedIncomePreference | undefined): FixedIncomePreference {
  const blank = blankFixedIncome();
  if (!value) return blank;
  const known = new Set(US_STATES.map((state) => state.code));
  const states = Array.isArray(value.states)
    ? [...new Set(value.states.map((code) => String(code).toUpperCase()).filter((code) => known.has(code)))]
    : [];
  return {
    inState: value.inState === true,
    states,
    imported: value.imported === true,
    status: SECTION.has(value.status) ? value.status : "open",
  };
}
