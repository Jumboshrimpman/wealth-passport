import {
  ADVERSE_MEDIA_LIST,
  PEP_LIST,
  SANCTIONS_LIST,
  nameConfidence,
  type WatchlistEntry,
} from "./seed/watchlist.ts";

export type IdType = "passport" | "drivers-license" | "national-id" | "residence-permit";
export type EmploymentStatus = "employed" | "self-employed" | "retired" | "student" | "other";
export type EntityType =
  | "sole-proprietorship"
  | "partnership"
  | "llc"
  | "corporation"
  | "trust"
  | "foundation";
export type WealthBand = "under-250k" | "250k-1m" | "1m-10m" | "over-10m";
export type IncomeSource =
  | "employment"
  | "business"
  | "investments"
  | "rental"
  | "inheritance"
  | "crypto"
  | "other";
export type InvestmentObjective =
  | "capital-appreciation"
  | "income"
  | "wealth-preservation"
  | "legacy";
export type TradingFrequency = "passive" | "monthly" | "quarterly" | "daily";

export interface EnrollmentAccount {
  fullName: string;
  email: string;
  phone: string;
}

export interface EnrollmentIdentity {
  idType: IdType;
  idNumber: string;
  idExpiry: string;
  issuingCountry: string;
  /** Simulated biometric liveness + face match for the walkthrough. */
  livenessConfirmed: boolean;
}

export interface EnrollmentAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EnrollmentPersonal {
  dob: string;
  citizenship: string;
  dualCitizenship: string;
  address: EnrollmentAddress;
  residentialStatus: "own" | "rent" | "family" | "other";
  occupation: string;
  industry: string;
  employmentStatus: EmploymentStatus;
  yearsInRole: number;
}

export interface BeneficialOwner {
  name: string;
  ownershipPct: number;
  isEntity: boolean;
}

export interface EnrollmentEntity {
  isBusiness: boolean;
  legalName: string;
  entityType: EntityType;
  formationJurisdiction: string;
  registrationNumber: string;
  businessActivity: string;
  signatoryRole: string;
  owners: BeneficialOwner[];
}

export interface EnrollmentPep {
  hasRelatedParties: boolean;
  relatedPartyDetail: string;
  isPep: boolean;
  pepRole: string;
  pepCountry: string;
  pepDuration: string;
  sanctionedJurisdictionTies: boolean;
  priorEnforcement: boolean;
  highRiskIndustry: boolean;
  highRiskIndustryDetail: string;
}

export interface EnrollmentFinancial {
  netWorthBand: WealthBand;
  liquidAssetsBand: WealthBand;
  annualIncomeBand: WealthBand;
  primaryIncomeSource: IncomeSource;
  sourceOfFundsDocs: string[];
  expectedAnnualTransactions: number;
  typicalTransactionSize: number;
  investmentObjective: InvestmentObjective;
  holdingPeriod: "days" | "months" | "years";
  productInterests: string[];
  geographicFocus: "domestic" | "international" | "specific-regions";
  tradingFrequency: TradingFrequency;
  internationalTrade: boolean;
  multiCountryFunds: boolean;
  importerExporter: boolean;
}

export interface EnrollmentAcknowledgments {
  amlProgram: boolean;
  privacyPolicy: boolean;
  sanctionsDisclosure: boolean;
  reportChanges: boolean;
  signatureName: string;
}

export interface EnrollmentPayload {
  account: EnrollmentAccount;
  identity: EnrollmentIdentity;
  personal: EnrollmentPersonal;
  entity: EnrollmentEntity;
  pep: EnrollmentPep;
  financial: EnrollmentFinancial;
  acknowledgments: EnrollmentAcknowledgments;
}

export interface ScreeningHit {
  list: string;
  matchedName: string;
  confidence: number;
  note: string;
}

export interface ScreeningOutcome {
  status: "no-hit" | "low-confidence" | "high-confidence";
  hits: ScreeningHit[];
}

export interface ScreeningResult {
  sanctions: ScreeningOutcome;
  pep: ScreeningOutcome;
  adverseMedia: ScreeningOutcome;
}

export interface RiskFactor {
  label: string;
  points: number;
}

export interface RiskAssessment {
  score: number;
  level: "low" | "medium" | "high";
  factors: RiskFactor[];
}

export type EnrollmentStatus = "approved" | "edd" | "rejected";

export interface EnrollmentDecision {
  status: EnrollmentStatus;
  reasons: string[];
  eddChecklist: string[];
  accountId: string | null;
}

export interface Enrollment {
  id: string;
  createdAt: string;
  payload: EnrollmentPayload;
  screening: ScreeningResult;
  risk: RiskAssessment;
  decision: EnrollmentDecision;
  status: EnrollmentStatus;
}

export interface EnrollmentSummary {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  status: EnrollmentStatus;
  riskScore: number;
  riskLevel: RiskAssessment["level"];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function applicantAge(dob: string, today = new Date()): number {
  const birth = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return -1;
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Blocking validation errors, in wizard step order. Empty array means submittable. */
export function validateEnrollment(payload: EnrollmentPayload): string[] {
  const errors: string[] = [];
  const { account, identity, personal, entity, pep, financial, acknowledgments } = payload;

  if (!isNonEmpty(account.fullName)) errors.push("Full legal name is required.");
  if (!EMAIL_PATTERN.test(account.email)) errors.push("A valid email address is required.");
  if (!isNonEmpty(account.phone)) errors.push("Phone number is required.");

  if (!isNonEmpty(identity.idNumber)) errors.push("Government ID number is required.");
  if (!isNonEmpty(identity.idExpiry)) {
    errors.push("Government ID expiration is required.");
  } else if (new Date(`${identity.idExpiry}T00:00:00Z`) <= new Date()) {
    errors.push("Government ID is expired.");
  }
  if (!isNonEmpty(identity.issuingCountry)) errors.push("ID issuing country is required.");
  if (!identity.livenessConfirmed) {
    errors.push("Biometric liveness check must be completed (simulated in this walkthrough).");
  }

  if (!isNonEmpty(personal.dob)) {
    errors.push("Date of birth is required.");
  } else if (applicantAge(personal.dob) < 18) {
    errors.push("Applicant must be at least 18 years old.");
  }
  if (!isNonEmpty(personal.citizenship)) errors.push("Citizenship is required.");
  if (!isNonEmpty(personal.address.street)) errors.push("Street address is required.");
  if (!isNonEmpty(personal.address.city)) errors.push("City is required.");
  if (!isNonEmpty(personal.address.postalCode)) errors.push("Postal code is required.");
  if (!isNonEmpty(personal.address.country)) errors.push("Country of residence is required.");
  if (!isNonEmpty(personal.occupation)) errors.push("Occupation is required.");
  if (!isNonEmpty(personal.industry)) errors.push("Industry is required.");

  if (entity.isBusiness) {
    if (!isNonEmpty(entity.legalName)) errors.push("Legal entity name is required.");
    if (!isNonEmpty(entity.formationJurisdiction)) {
      errors.push("Formation jurisdiction is required.");
    }
    if (!isNonEmpty(entity.businessActivity)) errors.push("Primary business activity is required.");
    if (!isNonEmpty(entity.signatoryRole)) errors.push("Signatory role is required.");
    const owners = entity.owners.filter((owner) => isNonEmpty(owner.name));
    if (owners.length === 0) {
      errors.push("At least one beneficial owner is required.");
    } else {
      const totalPct = owners.reduce((sum, owner) => sum + owner.ownershipPct, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        errors.push(`Ownership must sum to 100% (currently ${Math.round(totalPct * 10) / 10}%).`);
      }
    }
  }

  if (pep.hasRelatedParties && !isNonEmpty(pep.relatedPartyDetail)) {
    errors.push("Describe the related party (name and relationship).");
  }
  if (pep.isPep && (!isNonEmpty(pep.pepRole) || !isNonEmpty(pep.pepCountry))) {
    errors.push("PEP role and country are required for a PEP declaration.");
  }
  if (pep.highRiskIndustry && !isNonEmpty(pep.highRiskIndustryDetail)) {
    errors.push("Describe the high-risk industry exposure.");
  }

  if (financial.sourceOfFundsDocs.length === 0) {
    errors.push("Select at least one source-of-funds document.");
  }
  if (financial.expectedAnnualTransactions <= 0) {
    errors.push("Expected annual transaction count must be greater than zero.");
  }
  if (financial.typicalTransactionSize <= 0) {
    errors.push("Typical transaction size must be greater than zero.");
  }

  if (!acknowledgments.amlProgram) errors.push("AML/CFT program acknowledgment is required.");
  if (!acknowledgments.privacyPolicy) errors.push("Privacy policy acceptance is required.");
  if (!acknowledgments.sanctionsDisclosure) {
    errors.push("Sanctions / beneficial-ownership disclosure verification is required.");
  }
  if (!acknowledgments.reportChanges) errors.push("Commitment to report changes is required.");
  if (!isNonEmpty(acknowledgments.signatureName)) {
    errors.push("Type your full name to sign electronically.");
  }

  return errors;
}

const HIGH_CONFIDENCE = 0.8;
const LOW_CONFIDENCE = 0.5;

function screenName(name: string, list: WatchlistEntry[]): ScreeningOutcome {
  const hits: ScreeningHit[] = [];
  for (const entry of list) {
    const confidence = nameConfidence(name, entry.name);
    if (confidence >= LOW_CONFIDENCE) {
      hits.push({
        list: entry.list,
        matchedName: entry.name,
        confidence: Math.round(confidence * 100) / 100,
        note: entry.note,
      });
    }
  }
  hits.sort((a, b) => b.confidence - a.confidence);
  const status = hits.some((hit) => hit.confidence >= HIGH_CONFIDENCE)
    ? "high-confidence"
    : hits.length > 0
      ? "low-confidence"
      : "no-hit";
  return { status, hits };
}

function screeningNames(payload: EnrollmentPayload): string[] {
  const names = [payload.account.fullName];
  if (payload.entity.isBusiness) {
    if (isNonEmpty(payload.entity.legalName)) names.push(payload.entity.legalName);
    for (const owner of payload.entity.owners) {
      if (isNonEmpty(owner.name)) names.push(owner.name);
    }
  }
  return names;
}

function worst(outcomes: ScreeningOutcome[]): ScreeningOutcome {
  const hits = outcomes.flatMap((outcome) => outcome.hits);
  hits.sort((a, b) => b.confidence - a.confidence);
  const status = outcomes.some((outcome) => outcome.status === "high-confidence")
    ? "high-confidence"
    : hits.length > 0
      ? "low-confidence"
      : "no-hit";
  return { status, hits };
}

/** FR-18/19/20 — sanctions, PEP, and adverse-media screening over every declared name. */
export function screenEnrollment(payload: EnrollmentPayload): ScreeningResult {
  const names = screeningNames(payload);
  return {
    sanctions: worst(names.map((name) => screenName(name, SANCTIONS_LIST))),
    pep: worst(names.map((name) => screenName(name, PEP_LIST))),
    adverseMedia: worst(names.map((name) => screenName(name, ADVERSE_MEDIA_LIST))),
  };
}

function addFactor(factors: RiskFactor[], label: string, points: number) {
  factors.push({ label, points });
}

/** FR-21 — transparent rule-based risk score, 0–100. */
export function scoreEnrollment(
  payload: EnrollmentPayload,
  screening: ScreeningResult,
): RiskAssessment {
  const factors: RiskFactor[] = [];
  const { entity, pep, financial } = payload;

  if (screening.sanctions.status === "high-confidence") {
    addFactor(factors, "High-confidence sanctions list hit", 100);
  } else if (screening.sanctions.status === "low-confidence") {
    addFactor(factors, "Low-confidence sanctions list similarity", 30);
  }
  if (screening.pep.status !== "no-hit") {
    addFactor(factors, "PEP database match", 25);
  }
  if (screening.adverseMedia.status !== "no-hit") {
    addFactor(factors, "Adverse media match", 20);
  }
  if (pep.isPep) addFactor(factors, "Self-declared politically exposed person", 25);
  if (pep.hasRelatedParties) addFactor(factors, "Related parties enrolled or politically exposed", 10);
  if (pep.sanctionedJurisdictionTies) {
    addFactor(factors, "Interests or residency in sanctioned jurisdictions", 35);
  }
  if (pep.priorEnforcement) addFactor(factors, "Prior sanctions / regulatory enforcement", 30);
  if (pep.highRiskIndustry) addFactor(factors, "High-risk industry exposure", 15);

  if (financial.primaryIncomeSource === "crypto") {
    addFactor(factors, "Crypto-derived source of funds", 15);
  } else if (financial.primaryIncomeSource === "inheritance" || financial.primaryIncomeSource === "other") {
    addFactor(factors, `Source of funds: ${financial.primaryIncomeSource}`, 5);
  }
  if (financial.netWorthBand === "over-10m") addFactor(factors, "Net worth above $10M", 10);
  const annualVolume = financial.expectedAnnualTransactions * financial.typicalTransactionSize;
  if (annualVolume > 5_000_000) addFactor(factors, "Expected annual volume above $5M", 10);
  if (financial.internationalTrade || financial.multiCountryFunds || financial.importerExporter) {
    addFactor(factors, "International trade / multi-country fund flows", 10);
  }
  if (financial.geographicFocus === "international") {
    addFactor(factors, "International geographic focus", 5);
  }

  if (entity.isBusiness) {
    if (entity.owners.some((owner) => owner.isEntity)) {
      addFactor(factors, "Cascading entity ownership (intermediate legal entity)", 10);
    }
    const named = entity.owners.filter((owner) => isNonEmpty(owner.name));
    if (named.length > 0 && !named.some((owner) => !owner.isEntity && owner.ownershipPct > 25)) {
      addFactor(factors, "No natural-person UBO above 25%", 10);
    }
  }

  const score = Math.min(
    100,
    factors.reduce((sum, factor) => sum + factor.points, 0),
  );
  const level = score >= 70 ? "high" : score >= 30 ? "medium" : "low";
  return { score, level, factors };
}

function eddChecklistFor(payload: EnrollmentPayload, screening: ScreeningResult): string[] {
  const items: string[] = [];
  if (screening.pep.status !== "no-hit" || payload.pep.isPep) {
    items.push("PEP role verification and senior-management approval sign-off");
  }
  if (screening.sanctions.status === "low-confidence") {
    items.push("Sanctions similarity resolution (analyst review of the matched record)");
  }
  if (screening.adverseMedia.status !== "no-hit") {
    items.push("Adverse media disposition (true positive vs. name collision)");
  }
  if (payload.pep.highRiskIndustry) {
    items.push("Business license and regulatory standing for the declared industry");
  }
  if (
    payload.financial.internationalTrade ||
    payload.financial.multiCountryFunds ||
    payload.financial.importerExporter
  ) {
    items.push("Trade finance documentation for cross-border flows");
  }
  if (payload.financial.netWorthBand === "over-10m") {
    items.push("Source-of-wealth narrative plus two years of tax returns");
  }
  if (payload.entity.isBusiness) {
    items.push("Certified formation documents and beneficial-ownership register");
  }
  items.push("Bank reference letter", "Employment or business verification letter");
  return items;
}

let accountSeq = 0;

export function generateAccountId(enrollmentId: string): string {
  accountSeq += 1;
  let hash = 0;
  for (const char of enrollmentId) hash = (hash * 31 + char.charCodeAt(0)) % 1_000_000;
  return `WP-${String(hash).padStart(6, "0")}${String(accountSeq % 100).padStart(2, "0")}`;
}

/** FR-23 — decision engine per the compliance rules in the PRD appendix. */
export function decideEnrollment(
  payload: EnrollmentPayload,
  screening: ScreeningResult,
  risk: RiskAssessment,
): EnrollmentDecision {
  const reasons: string[] = [];

  if (screening.sanctions.status === "high-confidence") {
    const hit = screening.sanctions.hits[0];
    reasons.push(`High-confidence sanctions hit (${hit.list}: ${hit.matchedName}).`);
  }
  if (risk.score >= 70) reasons.push(`Risk score ${risk.score} is at or above the 70 reject line.`);
  if (reasons.length > 0) {
    return { status: "rejected", reasons, eddChecklist: [], accountId: null };
  }

  const annualVolume =
    payload.financial.expectedAnnualTransactions * payload.financial.typicalTransactionSize;
  if (risk.score >= 30) reasons.push(`Risk score ${risk.score} is in the enhanced-diligence band.`);
  if (screening.sanctions.status === "low-confidence") {
    reasons.push("Low-confidence sanctions similarity needs analyst disposition.");
  }
  if (screening.pep.status !== "no-hit") reasons.push("PEP database match requires review.");
  if (screening.adverseMedia.status !== "no-hit") {
    reasons.push("Adverse media match requires review.");
  }
  if (payload.pep.isPep) reasons.push("Self-declared PEP requires enhanced due diligence.");
  if (payload.pep.highRiskIndustry && payload.financial.geographicFocus === "international") {
    reasons.push("High-risk industry combined with international activity.");
  }
  if (payload.financial.netWorthBand === "over-10m") {
    reasons.push("Net worth above $10M triggers enhanced due diligence.");
  }
  if (annualVolume > 5_000_000) {
    reasons.push("Expected annual transaction volume above $5M.");
  }

  if (reasons.length > 0) {
    return {
      status: "edd",
      reasons,
      eddChecklist: eddChecklistFor(payload, screening),
      accountId: null,
    };
  }

  reasons.push(`Risk score ${risk.score} below the auto-approve line; no screening hits.`);
  return { status: "approved", reasons, eddChecklist: [], accountId: null };
}

export function emptyEnrollmentPayload(): EnrollmentPayload {
  return {
    account: { fullName: "", email: "", phone: "" },
    identity: {
      idType: "passport",
      idNumber: "",
      idExpiry: "",
      issuingCountry: "",
      livenessConfirmed: false,
    },
    personal: {
      dob: "",
      citizenship: "",
      dualCitizenship: "",
      address: { street: "", city: "", state: "", postalCode: "", country: "" },
      residentialStatus: "own",
      occupation: "",
      industry: "",
      employmentStatus: "employed",
      yearsInRole: 0,
    },
    entity: {
      isBusiness: false,
      legalName: "",
      entityType: "llc",
      formationJurisdiction: "",
      registrationNumber: "",
      businessActivity: "",
      signatoryRole: "",
      owners: [],
    },
    pep: {
      hasRelatedParties: false,
      relatedPartyDetail: "",
      isPep: false,
      pepRole: "",
      pepCountry: "",
      pepDuration: "",
      sanctionedJurisdictionTies: false,
      priorEnforcement: false,
      highRiskIndustry: false,
      highRiskIndustryDetail: "",
    },
    financial: {
      netWorthBand: "1m-10m",
      liquidAssetsBand: "250k-1m",
      annualIncomeBand: "250k-1m",
      primaryIncomeSource: "employment",
      sourceOfFundsDocs: [],
      expectedAnnualTransactions: 12,
      typicalTransactionSize: 25_000,
      investmentObjective: "wealth-preservation",
      holdingPeriod: "years",
      productInterests: [],
      geographicFocus: "domestic",
      tradingFrequency: "passive",
      internationalTrade: false,
      multiCountryFunds: false,
      importerExporter: false,
    },
    acknowledgments: {
      amlProgram: false,
      privacyPolicy: false,
      sanctionsDisclosure: false,
      reportChanges: false,
      signatureName: "",
    },
  };
}
