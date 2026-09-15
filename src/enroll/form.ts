import {
  applicantAge,
  type EnrollmentPayload,
  type EntityType,
  type IdType,
  type IncomeSource,
  type InvestmentObjective,
  type TradingFrequency,
  type WealthBand,
} from "../../shared/enrollment.ts";

export interface EnrollStep {
  id: string;
  title: string;
  blurb: string;
}

export const ENROLL_STEPS: EnrollStep[] = [
  { id: "account", title: "Account", blurb: "Contact details for the new relationship." },
  { id: "identity", title: "Identity", blurb: "Government ID capture and biometric liveness." },
  { id: "personal", title: "Personal", blurb: "Demographics, address, and employment." },
  { id: "entity", title: "Entity & ownership", blurb: "Personal account or business structure with UBOs." },
  { id: "pep", title: "PEP & related parties", blurb: "Political exposure and jurisdiction risk." },
  { id: "financial", title: "Financial profile", blurb: "Source of funds and expected activity." },
  { id: "review", title: "Review & sign", blurb: "Compliance acknowledgments and e-signature." },
];

export const ID_TYPE_OPTIONS: { value: IdType; label: string }[] = [
  { value: "passport", label: "Passport" },
  { value: "drivers-license", label: "Driver's license" },
  { value: "national-id", label: "National ID" },
  { value: "residence-permit", label: "Residence permit" },
];

export const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: "sole-proprietorship", label: "Sole proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "trust", label: "Trust" },
  { value: "foundation", label: "Foundation" },
];

export const WEALTH_BAND_OPTIONS: { value: WealthBand; label: string }[] = [
  { value: "under-250k", label: "< $250K" },
  { value: "250k-1m", label: "$250K – $1M" },
  { value: "1m-10m", label: "$1M – $10M" },
  { value: "over-10m", label: "> $10M" },
];

export const INCOME_SOURCE_OPTIONS: { value: IncomeSource; label: string }[] = [
  { value: "employment", label: "Employment" },
  { value: "business", label: "Business ownership" },
  { value: "investments", label: "Investments" },
  { value: "rental", label: "Rental income" },
  { value: "inheritance", label: "Inheritance" },
  { value: "crypto", label: "Crypto assets" },
  { value: "other", label: "Other" },
];

export const OBJECTIVE_OPTIONS: { value: InvestmentObjective; label: string }[] = [
  { value: "capital-appreciation", label: "Capital appreciation" },
  { value: "income", label: "Income" },
  { value: "wealth-preservation", label: "Wealth preservation" },
  { value: "legacy", label: "Legacy / estate" },
];

export const FREQUENCY_OPTIONS: { value: TradingFrequency; label: string }[] = [
  { value: "passive", label: "Passive" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "daily", label: "Frequent / day-trading" },
];

export const SOF_DOC_OPTIONS = [
  "Tax returns (last 2 years)",
  "Payslips (last 3 months)",
  "Bank statements (last 3 months)",
  "Investment account statements",
  "Business financial statements",
  "Employment letter",
  "Gift letter",
];

export const PRODUCT_OPTIONS = [
  "Managed portfolio",
  "Direct stock",
  "Options",
  "Fixed income",
  "Private markets",
  "Crypto",
];

/** Per-step gates mirror the server-side validateEnrollment rules. */
export function stepErrors(stepId: string, payload: EnrollmentPayload): string[] {
  const errors: string[] = [];
  const { account, identity, personal, entity, pep, financial, acknowledgments } = payload;

  if (stepId === "account") {
    if (!account.fullName.trim()) errors.push("Full legal name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
      errors.push("A valid email address is required.");
    }
    if (!account.phone.trim()) errors.push("Phone number is required.");
  }

  if (stepId === "identity") {
    if (!identity.idNumber.trim()) errors.push("Government ID number is required.");
    if (!identity.idExpiry) {
      errors.push("Government ID expiration is required.");
    } else if (new Date(`${identity.idExpiry}T00:00:00Z`) <= new Date()) {
      errors.push("Government ID is expired.");
    }
    if (!identity.issuingCountry.trim()) errors.push("ID issuing country is required.");
    if (!identity.livenessConfirmed) errors.push("Complete the simulated liveness check.");
  }

  if (stepId === "personal") {
    if (!personal.dob) {
      errors.push("Date of birth is required.");
    } else if (applicantAge(personal.dob) < 18) {
      errors.push("Applicant must be at least 18 years old.");
    }
    if (!personal.citizenship.trim()) errors.push("Citizenship is required.");
    if (!personal.address.street.trim()) errors.push("Street address is required.");
    if (!personal.address.city.trim()) errors.push("City is required.");
    if (!personal.address.postalCode.trim()) errors.push("Postal code is required.");
    if (!personal.address.country.trim()) errors.push("Country of residence is required.");
    if (!personal.occupation.trim()) errors.push("Occupation is required.");
    if (!personal.industry.trim()) errors.push("Industry is required.");
  }

  if (stepId === "entity" && entity.isBusiness) {
    if (!entity.legalName.trim()) errors.push("Legal entity name is required.");
    if (!entity.formationJurisdiction.trim()) errors.push("Formation jurisdiction is required.");
    if (!entity.businessActivity.trim()) errors.push("Primary business activity is required.");
    if (!entity.signatoryRole.trim()) errors.push("Signatory role is required.");
    const owners = entity.owners.filter((owner) => owner.name.trim());
    if (owners.length === 0) {
      errors.push("At least one beneficial owner is required.");
    } else {
      const totalPct = owners.reduce((sum, owner) => sum + owner.ownershipPct, 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        errors.push(`Ownership must sum to 100% (currently ${Math.round(totalPct * 10) / 10}%).`);
      }
    }
  }

  if (stepId === "pep") {
    if (pep.hasRelatedParties && !pep.relatedPartyDetail.trim()) {
      errors.push("Describe the related party (name and relationship).");
    }
    if (pep.isPep && (!pep.pepRole.trim() || !pep.pepCountry.trim())) {
      errors.push("PEP role and country are required for a PEP declaration.");
    }
    if (pep.highRiskIndustry && !pep.highRiskIndustryDetail.trim()) {
      errors.push("Describe the high-risk industry exposure.");
    }
  }

  if (stepId === "financial") {
    if (financial.sourceOfFundsDocs.length === 0) {
      errors.push("Select at least one source-of-funds document.");
    }
    if (financial.expectedAnnualTransactions <= 0) {
      errors.push("Expected annual transaction count must be greater than zero.");
    }
    if (financial.typicalTransactionSize <= 0) {
      errors.push("Typical transaction size must be greater than zero.");
    }
  }

  if (stepId === "review") {
    if (!acknowledgments.amlProgram) errors.push("AML/CFT program acknowledgment is required.");
    if (!acknowledgments.privacyPolicy) errors.push("Privacy policy acceptance is required.");
    if (!acknowledgments.sanctionsDisclosure) {
      errors.push("Sanctions / beneficial-ownership disclosure verification is required.");
    }
    if (!acknowledgments.reportChanges) errors.push("Commitment to report changes is required.");
    if (!acknowledgments.signatureName.trim()) {
      errors.push("Type your full name to sign electronically.");
    }
  }

  return errors;
}
