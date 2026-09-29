import { UMA_LISTINGS, type UmaListing } from "./umaListings.ts";

/**
 * Client and institutional strategy catalog.
 * Names, managers, styles, minimums, and inception dates come from the public
 * Select UMA manager-profile index. Summaries, risk bands, and ESG flags are
 * demo copy inferred from those fields.
 */
export interface StrategyProfile {
  id: string;
  name: string;
  category: string;
  style: string;
  manager: string;
  /** Account minimum in dollars. Null when the public profile header did not list one. */
  minimum: number | null;
  /** All-in management fee in bps when the strategy is priced that way. */
  allInBps: number | null;
  /** Price line when the strategy is not an all-in bps fee. */
  feeLabel: string | null;
  summary: string;
  risk: string;
  /** Tagged for an environmental, social, or values screen. */
  esg: boolean;
  inception: string | null;
  productCode: string | null;
}

function inferStyle(name: string): string {
  const text = name.toLowerCase();
  if (/muni|tax[- ]exempt|tax[- ]free/.test(text)) return "US Tax Free Core";
  if (/bond|fixed|credit|aggregate|duration/.test(text)) return "US Taxable Core";
  if (/small/.test(text)) return "US Small Cap";
  if (/mid/.test(text)) return "US Mid Cap";
  if (/international|global|emerging|adr/.test(text)) return "Global Equities";
  if (/value/.test(text)) return "US Large Cap Value";
  if (/growth/.test(text)) return "US Large Cap Growth";
  if (/equity|dividend|stock/.test(text)) return "US Large Cap";
  return "Global Multi Asset";
}

export function categoryFor(style: string, name: string): string {
  const blob = `${style} ${name}`.toLowerCase();
  if (/real estate|reit|commodit|infrastructure|mlp/.test(blob)) return "Real assets";
  if (/multi asset|multi-strategy|event driven/.test(blob)) return "Multi-asset";
  if (/fixed|muni|tax free|taxable|yield|govt|preferred|inflation|bond|credit/.test(blob)) return "Fixed income";
  if (/equit|cap|stock|dividend/.test(blob)) return "Equity";
  return "Multi-asset";
}

export function riskBand(style: string, name: string): string {
  const blob = `${style} ${name}`.toLowerCase();
  if (/ultra-short|short term|wealth conservation|high quality/.test(blob)) return "Conservative";
  if (/small cap|emerging|high yield|event driven|mlp|concentrated|disrupt/.test(blob)) return "Aggressive";
  if (/growth|equit|reit|infrastructure|commodit/.test(blob)) return "Growth";
  return "Moderate";
}

function esgListed(style: string, name: string): boolean {
  return /esg|sustain|responsible|gender lens|impact|catholic|climate|fossil|socially|environmental/.test(
    `${style} ${name}`.toLowerCase(),
  );
}

function summaryFor(name: string, style: string, category: string, esg: boolean): string {
  const role =
    category === "Fixed income"
      ? "bond sleeve"
      : category === "Real assets"
        ? "real-asset sleeve"
        : category === "Multi-asset"
          ? "multi-asset sleeve"
          : "equity sleeve";
  const screen = esg ? " Sustainability is part of the mandate." : "";
  return `${name} is a ${style.toLowerCase()} ${role}. A household can set exclusions, tax treatment, and how tightly the account follows its benchmark.${screen}`;
}

/**
 * Stable demo all-in fee. The public profile index does not publish bps, and
 * search still needs a fee range. This is not a manager's schedule.
 */
export function illustrativeFeeBps(id: string, category: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const span =
    category === "Fixed income"
      ? [10, 40]
      : category === "Equity"
        ? [15, 70]
        : category === "Real assets"
          ? [35, 90]
          : [20, 75];
  const [min, max] = span;
  const steps = Math.floor((max - min) / 5);
  return min + (Math.abs(hash) % (steps + 1)) * 5;
}

function profileFromListing(row: UmaListing): StrategyProfile {
  const style = row.style ?? inferStyle(row.name);
  const category = categoryFor(style, row.name);
  const esg = esgListed(style, row.name);
  return {
    id: row.id,
    name: row.name,
    category,
    style,
    manager: row.manager,
    minimum: row.minimum,
    allInBps: illustrativeFeeBps(row.id, category),
    feeLabel: null,
    summary: summaryFor(row.name, style, category, esg),
    risk: riskBand(style, row.name),
    esg,
    inception: row.inception,
    productCode: row.code,
  };
}

export const STRATEGY_UNIVERSE: StrategyProfile[] = UMA_LISTINGS.map(profileFromListing);

{
  const ids = STRATEGY_UNIVERSE.map((row) => row.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("STRATEGY DATA FAILURE: strategy ids must be unique.");
  }
}
