import type {
  Account,
  Advisor,
  Attestation,
  ClientRecord,
  HouseholdRisk,
  SecurityHolding,
} from "../types.ts";

/**
 * Generates internally consistent client records from compact specs so the
 * board can show a realistic book of households. Invariants checked by
 * validateClientRecord (accountValue = Σ accounts, holdings sum to account
 * value, ops reused/total counts) hold by construction.
 */

export interface AccountSpec {
  id: string;
  name: string;
  type: string;
  custodian: string;
  balance: number;
  verifiedCustodian?: boolean;
  sleeve: Account["sleeve"];
}

export interface HouseholdSpec {
  id: string;
  name: string;
  clientFirstName: string;
  principals: string;
  domicile: string;
  entity: string;
  accounts: AccountSpec[];
  additionalInvestable: number;
  realEstate: number;
  otherHousehold: number;
  liquidity: number;
  risk: HouseholdRisk;
  dataAsOf: string;
  advisor: Advisor;
  /** Mask for the verified account, e.g. "Account ending 3381". */
  verifiedAccountMask: string;
  ops: {
    title: string;
    from: string;
    to: string;
    deliveringAccount: string;
    receivingAccount: string;
    stateNotice: string;
  };
  consentLastChanged: string;
}

interface HoldingTemplate {
  ticker: string;
  name: string;
  kind: string;
  assetClass: SecurityHolding["assetClass"];
  /** Share of the account balance; the last template row takes the remainder. */
  weight: number;
}

const SLEEVE_HOLDINGS: Record<Account["sleeve"], HoldingTemplate[]> = {
  taxable: [
    { ticker: "VTI", name: "Vanguard Total Stock Market", kind: "ETF", assetClass: "equity", weight: 0.3 },
    { ticker: "VXUS", name: "Vanguard Total International", kind: "ETF", assetClass: "equity", weight: 0.12 },
    { ticker: "SCHD", name: "Schwab US Dividend Equity", kind: "ETF", assetClass: "equity", weight: 0.1 },
    { ticker: "MUB", name: "iShares National Muni Bond", kind: "ETF", assetClass: "fixed-income", weight: 0.14 },
    { ticker: "LQD", name: "iShares iBoxx IG Corporate", kind: "ETF", assetClass: "fixed-income", weight: 0.1 },
    { ticker: "VNQ", name: "Vanguard Real Estate ETF", kind: "ETF", assetClass: "real-assets", weight: 0.06 },
    { ticker: "GLD", name: "SPDR Gold Shares", kind: "ETF", assetClass: "real-assets", weight: 0.05 },
    { ticker: "SWEEP", name: "Cash sweep", kind: "Cash", assetClass: "cash", weight: 0 },
  ],
  qualified: [
    { ticker: "FXAIX", name: "Fidelity 500 Index", kind: "Mutual fund", assetClass: "equity", weight: 0.45 },
    { ticker: "FSPSX", name: "Fidelity International Index", kind: "Mutual fund", assetClass: "equity", weight: 0.15 },
    { ticker: "FXNAX", name: "Fidelity US Bond Index", kind: "Mutual fund", assetClass: "fixed-income", weight: 0.25 },
    { ticker: "SPAXX", name: "Government money market", kind: "Money market", assetClass: "cash", weight: 0 },
  ],
  private: [
    { ticker: "PE-FD", name: "PE feeder fund", kind: "Private fund", assetClass: "private", weight: 0.55 },
    { ticker: "SEC-26", name: "Secondaries sleeve", kind: "Private fund", assetClass: "private", weight: 0.3 },
    { ticker: "CO-INV", name: "Co-invest SPV", kind: "SPV interest", assetClass: "private", weight: 0 },
  ],
  cash: [
    { ticker: "T-BILL", name: "US Treasury bills 0–12m", kind: "Treasury", assetClass: "cash", weight: 0.6 },
    { ticker: "MMF", name: "Government money market", kind: "Money market", assetClass: "cash", weight: 0 },
  ],
};

function holdingsFor(account: AccountSpec): SecurityHolding[] {
  const template = SLEEVE_HOLDINGS[account.sleeve];
  const holdings: SecurityHolding[] = [];
  let allocated = 0;
  template.forEach((row, index) => {
    const isLast = index === template.length - 1;
    const value = isLast ? account.balance - allocated : Math.round(account.balance * row.weight);
    allocated += value;
    holdings.push({
      id: `${account.id}-${row.ticker.toLowerCase()}`,
      accountId: account.id,
      name: row.name,
      ticker: row.ticker,
      kind: row.kind,
      assetClass: row.assetClass,
      value,
    });
  });
  return holdings;
}

function attestationsFor(spec: HouseholdSpec, verified: AccountSpec): Attestation[] {
  return [
    {
      date: spec.dataAsOf,
      kind: "custodian",
      title: `${verified.custodian} custodian match`,
      detail: `${spec.verifiedAccountMask} matched to ${verified.custodian} custodian records. Badge is stored on the client record.`,
    },
    {
      date: spec.dataAsOf,
      kind: "advisor",
      title: `${spec.advisor.name} · BrokerCheck ${spec.advisor.brokerCheckId}`,
      detail: `Advisor identity verified against FINRA BrokerCheck–style records. ID ${spec.advisor.brokerCheckId} is stored on the client record.`,
    },
    {
      date: spec.dataAsOf,
      kind: "document",
      title: "Accredited investor letter reused",
      detail: `Ops packet reuses the ${spec.name} accredited-investor letter stored on this client record.`,
    },
  ];
}

export function generateClient(spec: HouseholdSpec): ClientRecord {
  const verified = spec.accounts.find((account) => account.verifiedCustodian);
  if (!verified) {
    throw new Error(`SEED FAILURE (${spec.id}): one account must be the verified custodian.`);
  }
  const accountValue = spec.accounts.reduce((sum, account) => sum + account.balance, 0);
  const investable = accountValue + spec.additionalInvestable;
  const householdValue = investable + spec.realEstate + spec.otherHousehold;
  const otherCustodians = spec.accounts
    .filter((account) => account.id !== verified.id)
    .map((account) => account.custodian)
    .join(", ");

  return {
    id: spec.id,
    household: {
      name: spec.name,
      clientFirstName: spec.clientFirstName,
      principals: spec.principals,
      domicile: spec.domicile,
      entity: spec.entity,
      accountValue,
      investable,
      additionalInvestable: spec.additionalInvestable,
      realEstate: spec.realEstate,
      otherHousehold: spec.otherHousehold,
      householdValue,
      liquidity: spec.liquidity,
      risk: spec.risk,
      dataAsOf: spec.dataAsOf,
      sourceNote: "Holdings and style boxes map to Morningstar and Informa reference data.",
    },
    advisor: spec.advisor,
    accounts: spec.accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      custodian: account.custodian,
      balance: account.balance,
      verifiedCustodian: account.verifiedCustodian === true,
      sleeve: account.sleeve,
    })),
    holdings: spec.accounts.flatMap(holdingsFor),
    consent: {
      shared: true,
      lastChanged: spec.consentLastChanged,
      scopes: ["Holdings and sleeves", "Risk posture and liquidity", "Verification badges", "Domicile"],
    },
    attestations: attestationsFor(spec, verified),
    opsPacket: {
      title: spec.ops.title,
      from: spec.ops.from,
      to: spec.ops.to,
      reused: 14,
      total: 18,
      fields: [
        { label: "Household legal name", value: spec.principals, source: "Passport", reused: true },
        { label: "Legal entity", value: spec.entity, source: "Passport", reused: true },
        { label: "Domicile", value: spec.domicile, source: "Passport", reused: true },
        {
          label: "Advisor of record",
          value: `${spec.advisor.name} · BrokerCheck ${spec.advisor.brokerCheckId}`,
          source: "Verification",
          reused: true,
        },
        { label: "Delivering account", value: spec.ops.deliveringAccount, source: "Passport", reused: true },
        { label: "Receiving account", value: spec.ops.receivingAccount, source: "Ops clerk", reused: false },
        { label: "Cost basis method", value: "Specific ID", source: "Passport", reused: true },
        { label: "Beneficiaries", value: "Primary: spouse · Contingent: family trust", source: "Passport", reused: true },
        { label: "W-9 / TIN attestation", value: "On file", source: "Reusable docs", reused: true },
        { label: "ACH instructions", value: "On file", source: "Reusable docs", reused: true },
        { label: "Risk questionnaire", value: `${spec.risk.label} · 2026 refresh`, source: "Passport", reused: true },
        { label: "Accredited investor letter", value: "Investor letter · 2026-02", source: "Reusable docs", reused: true },
        { label: "Passport share consent", value: "On · any paying institution may offer", source: "Consent", reused: true },
        { label: "Morningstar-style holdings extract", value: "Taxable + qualified sleeves", source: "Reference feed", reused: true },
        { label: "Informa-style product mapping", value: "Eligibility mapping", source: "Reference feed", reused: true },
        { label: "Medallion / wet signature", value: "Required at funding", source: "Still needed", reused: false },
        { label: "Receiving plan acceptance", value: "Institution ops queue", source: "Still needed", reused: false },
        { label: "State rollover notice", value: spec.ops.stateNotice, source: "Still needed", reused: false },
      ],
    },
    verifiedCustodian: {
      badge: verified.custodian,
      accountMask: spec.verifiedAccountMask,
      title: verified.name,
      body: `The ${verified.name} is custodian-matched to ${verified.custodian}. Other sleeves (${otherCustodians}) remain unverified so the badge is meaningful.`,
    },
  };
}
