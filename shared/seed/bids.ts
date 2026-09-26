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

/** What the manager will tailor. Shown on the pitch, not buried in the terms. */
export const BID_CUSTOMIZATION: Record<string, string> = {
  meridian: "State preference, duration, and which lots to harvest",
  "harbor-lane": "Sector bands, single-name caps, and tax-lot rules",
  northbridge: "Harvest threshold and which names stay off limits",
  "field-co": "Benchmark, factor tilts, and excluded holdings",
  "lark-index": "Index family and the tracking range",
  "cedar-ira": "Share class and the fee schedule inside the IRA",
  "elm-custody": "Delivery method and which lots move in kind",
  quince: "Duration target and credit limits inside the IRA",
  plover: "Glide path and the equity share",
  oakridge: "Vintage year, pacing, and co-invest rights",
  lumen: "Commitment size and the call schedule",
  sable: "Deal size and the information rights",
  brindle: "Stage focus and the reserve for follow-ons",
  stillwater: "Ladder length and the reinvestment rule",
  kindred: "Insurance coverage and the sweep threshold",
  rowan: "Fund share class and the liquidity window",
  wick: "Tenor and the counterparty list",
  "first-atlantic": "Advance rate, tenor, and which accounts are pledged",
  pellham: "Breakpoint and which sleeves sit on the schedule",
  vesper: "Which accounts consolidate and the service list",
  halden: "Overlay budget and the household constraints",
};

/**
 * Strategy minimums. Figures that already exist on the strategy universe stay
 * on that product. A null means the pitch is not a strategy sleeve.
 */
export const BID_MINIMUM: Record<string, number | null> = {
  meridian: 25_000_000,
  "harbor-lane": 10_000_000,
  northbridge: 15_000_000,
  "field-co": 5_000_000,
  "lark-index": 8_000_000,
  "cedar-ira": 5_000_000,
  "elm-custody": 5_000_000,
  quince: 10_000_000,
  plover: 5_000_000,
  oakridge: 40_000_000,
  lumen: 40_000_000,
  sable: 50_000_000,
  brindle: 100_000_000,
  stillwater: 1_000_000,
  kindred: 1_000_000,
  rowan: 1_000_000,
  wick: 1_000_000,
  "first-atlantic": null,
  pellham: null,
  vesper: 25_000_000,
  halden: 50_000_000,
};

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
