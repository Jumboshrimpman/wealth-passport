export type VerificationKind = "custodian" | "advisor" | "document";

export type AssetClassId = "equity" | "fixed-income" | "private" | "real-assets" | "cash";

export interface Account {
  id: string;
  name: string;
  type: string;
  custodian: string;
  balance: number;
  verifiedCustodian: boolean;
  sleeve: "taxable" | "qualified" | "private" | "cash";
}

export interface Allocation {
  label: string;
  pct: number;
  tone: "camel" | "sage" | "ink" | "clay" | "stone";
}

export interface PassportConsent {
  shared: boolean;
  lastChanged: string;
  scopes: string[];
}

export interface Advisor {
  name: string;
  title: string;
  firm: string;
  brokerCheckId: string;
  crdFirm: string;
  verified: boolean;
  since: string;
}

export interface HouseholdRisk {
  label: string;
  horizon: string;
  capacity: string;
  privateMarketsSleeve: number;
}

export interface Household {
  name: string;
  clientFirstName: string;
  principals: string;
  domicile: string;
  entity: string;
  accountValue: number;
  investable: number;
  additionalInvestable: number;
  realEstate: number;
  otherHousehold: number;
  householdValue: number;
  liquidity: number;
  risk: HouseholdRisk;
  dataAsOf: string;
  sourceNote: string;
}

export interface SecurityHolding {
  id: string;
  name: string;
  ticker: string;
  kind: string;
  accountId: string;
  assetClass: AssetClassId;
  value: number;
}

export interface OpsField {
  label: string;
  value: string;
  source: string;
  reused: boolean;
}

export interface OpsPacket {
  title: string;
  from: string;
  to: string;
  reused: number;
  total: number;
  fields: OpsField[];
}

export interface Attestation {
  date: string;
  kind: VerificationKind;
  title: string;
  detail: string;
}

export interface VerifiedCustodianCopy {
  badge: string;
  accountMask: string;
  title: string;
  body: string;
}

export interface ClientRecord {
  id: string;
  household: Household;
  advisor: Advisor;
  accounts: Account[];
  holdings: SecurityHolding[];
  consent: PassportConsent;
  attestations: Attestation[];
  opsPacket: OpsPacket;
  verifiedCustodian: VerifiedCustodianCopy;
}

export interface AllocationSleeve {
  accountId: string;
  accountName: string;
  custodian: string;
  value: number;
  weightOfClass: number;
  holdings: Array<SecurityHolding & { weightOfAccount: number; weightOfBook: number }>;
}

export interface AllocationNode {
  id: AssetClassId;
  label: string;
  tone: "camel" | "sage" | "ink" | "clay" | "stone";
  value: number;
  pct: number;
  sleeves: AllocationSleeve[];
}

export interface ClientPassport extends ClientRecord {
  allocationTree: AllocationNode[];
  allocations: Allocation[];
}

export interface ClientSummary {
  id: string;
  name: string;
  clientFirstName: string;
  principals: string;
  domicile: string;
  householdValue: number;
}

export function summarizeClient(record: ClientRecord): ClientSummary {
  return {
    id: record.id,
    name: record.household.name,
    clientFirstName: record.household.clientFirstName,
    principals: record.household.principals,
    domicile: record.household.domicile,
    householdValue: record.household.householdValue,
  };
}
