import type { Account } from "../types.ts";

export type BidSleeve = Account["sleeve"] | "household";

/**
 * Companies bidding a rate or term on a profile. Catalog institutions are
 * included only when that firm already matches the client. Extra names are
 * demo bidders so each list can fill to three and still drop a fourth.
 * This is not the admin institution board.
 */
export interface BidTemplate {
  id: string;
  bidder: string;
  title: string;
  terms: string;
  sleeves: BidSleeve[];
  matchPct: number;
  /** When set, the bid is offered only if this institution is eligible, and only on its host row. */
  institutionId?: string;
}

export const BID_TEMPLATES: BidTemplate[] = [
  {
    id: "meridian",
    bidder: "Meridian Global Asset Management",
    title: "Tax-aware municipal SMA",
    terms: "all-in 38 bps",
    sleeves: ["taxable"],
    matchPct: 94,
    institutionId: "meridian",
  },
  {
    id: "harbor-lane",
    bidder: "Harbor Lane Advisors",
    title: "Equity SMA",
    terms: "all-in 32 bps",
    sleeves: ["taxable"],
    matchPct: 90,
  },
  {
    id: "northbridge",
    bidder: "Northbridge Wealth",
    title: "Tax-loss overlay",
    terms: "all-in 28 bps",
    sleeves: ["taxable"],
    matchPct: 86,
  },
  {
    id: "field-co",
    bidder: "Field & Co.",
    title: "Direct indexing",
    terms: "all-in 35 bps",
    sleeves: ["taxable"],
    matchPct: 79,
  },
  {
    id: "lark-index",
    bidder: "Lark Index",
    title: "Custom index sleeve",
    terms: "all-in 41 bps",
    sleeves: ["taxable"],
    matchPct: 74,
  },
  {
    id: "cedar-ira",
    bidder: "Cedar Retirement",
    title: "Lower IRA fee",
    terms: "11 bps under the current schedule",
    sleeves: ["qualified"],
    matchPct: 91,
  },
  {
    id: "elm-custody",
    bidder: "Elm Street Custody",
    title: "In-kind IRA transfer",
    terms: "No ticket charges",
    sleeves: ["qualified"],
    matchPct: 85,
  },
  {
    id: "quince",
    bidder: "Quince Advisory",
    title: "Bond sleeve inside the IRA",
    terms: "all-in 40 bps",
    sleeves: ["qualified"],
    matchPct: 80,
  },
  {
    id: "plover",
    bidder: "Plover Retirement",
    title: "Target-date sleeve",
    terms: "all-in 48 bps",
    sleeves: ["qualified"],
    matchPct: 74,
  },
  {
    id: "oakridge",
    bidder: "Oakridge Partners",
    title: "2026 secondaries sleeve",
    terms: "1.50% and 15% carry",
    sleeves: ["private"],
    matchPct: 90,
    institutionId: "oakridge",
  },
  {
    id: "lumen",
    bidder: "Lumen Secondaries",
    title: "2026 feeder",
    terms: "1.25% and 12.5% carry",
    sleeves: ["private"],
    matchPct: 88,
  },
  {
    id: "sable",
    bidder: "Sable Partners",
    title: "Co-invest access",
    terms: "1.00% and 10% carry",
    sleeves: ["private"],
    matchPct: 84,
  },
  {
    id: "brindle",
    bidder: "Brindle Capital",
    title: "Late-stage sleeve",
    terms: "1.75% and 20% carry",
    sleeves: ["private"],
    matchPct: 76,
  },
  {
    id: "stillwater",
    bidder: "Stillwater Treasury",
    title: "T-bill ladder",
    terms: "4.3% yield, 0–12 months",
    sleeves: ["cash"],
    matchPct: 89,
  },
  {
    id: "kindred",
    bidder: "Kindred Cash",
    title: "Insured deposit sweep",
    terms: "4.1% APY",
    sleeves: ["cash"],
    matchPct: 84,
  },
  {
    id: "rowan",
    bidder: "Rowan Reserve",
    title: "Government money fund",
    terms: "4.0% yield",
    sleeves: ["cash"],
    matchPct: 78,
  },
  {
    id: "wick",
    bidder: "Wick Liquidity",
    title: "Overnight repo",
    terms: "3.7% yield",
    sleeves: ["cash"],
    matchPct: 72,
  },
  {
    id: "first-atlantic",
    bidder: "First Atlantic Private Bank",
    title: "Securities-based credit line",
    terms: "SOFR + 1.85%",
    sleeves: ["household"],
    matchPct: 93,
    institutionId: "first-atlantic",
  },
  {
    id: "pellham",
    bidder: "Pellham Trust",
    title: "Household fee schedule",
    terms: "12 bps under the current custodian schedule",
    sleeves: ["household"],
    matchPct: 88,
  },
  {
    id: "vesper",
    bidder: "Vesper Private Bank",
    title: "One-bank custody",
    terms: "Relationship pricing on the consolidated book",
    sleeves: ["household"],
    matchPct: 83,
  },
  {
    id: "halden",
    bidder: "Halden & Grey",
    title: "Household overlay",
    terms: "all-in 22 bps",
    sleeves: ["household"],
    matchPct: 77,
  },
];
