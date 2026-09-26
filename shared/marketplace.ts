import { formatUsd } from "./format.ts";
import type { Account, ClientRecord } from "./types.ts";

export type RiskChoice = "aggressive" | "moderate" | "conservative";
export type BalanceChoice = "equity" | "balanced" | "fixed-income";
export type MotiveChoice = "sunset" | "change" | "cheaper";

export interface FitInterview {
  risk: RiskChoice;
  balance: BalanceChoice;
  motive: MotiveChoice;
  focusAccountIds: string[];
}

export interface PulledAccount {
  id: string;
  name: string;
  institution: string;
  balance: number;
  type: string;
}

export interface DemoProfile {
  clientId: string;
  provider: "plaid" | "kubera";
  providerLabel: string;
  fullName: string;
  pulledAccounts: PulledAccount[];
  fundrise: { connected: boolean; amount: number; label: string };
  coinbase: { connected: boolean; amount: number; label: string };
  kalshi: { connected: boolean; amount: number; label: string };
  other: { label: string; amount: number } | null;
  taxDocName: string | null;
  fit: FitInterview;
}

export interface BankConnectResult {
  ok: true;
  kind: "bank";
  provider: "plaid" | "kubera";
  providerLabel: string;
  fullName: string;
  accounts: PulledAccount[];
}

export interface AssetConnectResult {
  ok: true;
  kind: "asset";
  provider: "fundrise" | "coinbase" | "kalshi";
  providerLabel: string;
  label: string;
  amount: number;
  detail: string;
}

export interface IrsConnectResult {
  ok: true;
  kind: "irs";
  provider: "irs";
  providerLabel: string;
  status: "request-out";
  detail: string;
}

export type DemoConnectResult = BankConnectResult | AssetConnectResult | IrsConnectResult;

export interface Recommendation {
  id: string;
  title: string;
  matchPct: number;
  reason: string;
  /** Strategy the account or household is in now. */
  currentStrategy: string;
  /** New strategy being recommended. */
  nextStrategy: string;
}

export interface AccountOffers {
  accountId: string;
  accountName: string;
  custodian: string;
  balance: number;
  recommendations: [Recommendation, Recommendation, Recommendation];
}

export interface OfferBook {
  accounts: AccountOffers[];
  household: [Recommendation, Recommendation, Recommendation];
}

export interface WealthPoint {
  id: string;
  label: string;
  amount: number;
  status: "verified" | "pending";
  note: string;
}

export interface WealthPicture {
  total: number;
  verified: number;
  pending: number;
  points: WealthPoint[];
}

/** Round one-bank household minimums. A bank counts the relationship, not each account. */
const HOUSEHOLD_TIERS = [1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000];

/**
 * Highest tier the accounts meet only once they sit together at one bank.
 * A tier counts when the consolidated total reaches it and no single account already does.
 * Returns null when combining them would not clear a new household minimum.
 */
export function oneBankHouseholdMinimum(balances: number[]): number | null {
  const amounts = balances.filter((value) => Number.isFinite(value) && value > 0);
  if (amounts.length < 2) return null;
  const consolidated = amounts.reduce((sum, value) => sum + value, 0);
  const largest = Math.max(...amounts);
  let met: number | null = null;
  for (const tier of HOUSEHOLD_TIERS) {
    if (consolidated >= tier && largest < tier) met = tier;
  }
  return met;
}

function roundTo(value: number, step: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / step) * step;
}

function sumBalances(rows: Array<{ balance: number }>): number {
  return rows.reduce((sum, row) => sum + row.balance, 0);
}

export function clientFullName(client: ClientRecord): string {
  const first = client.household.clientFirstName.trim();
  const last = client.household.principals.trim().split(/\s+/).pop() ?? "";
  if (!last || last.toLowerCase() === first.toLowerCase()) return first;
  return `${first} ${last}`;
}

function bankAccounts(client: ClientRecord): Account[] {
  const linked = client.accounts.filter((account) => account.sleeve !== "private");
  return linked.length > 0 ? linked : client.accounts;
}

export function fundriseAmount(client: ClientRecord): number {
  const privateBal = client.accounts
    .filter((account) => account.sleeve === "private")
    .reduce((sum, account) => sum + account.balance, 0);
  const accountSum = sumBalances(client.accounts);
  const outside = Math.max(0, client.household.householdValue - accountSum);
  const raw = privateBal > 0 ? privateBal * 0.3 : client.household.additionalInvestable * 0.4;
  return Math.min(privateBal + outside, roundTo(raw, 100_000));
}

function connectorAmount(provider: "fundrise" | "coinbase" | "kalshi", client: ClientRecord): number {
  if (provider === "fundrise") return fundriseAmount(client);
  if (provider === "coinbase") return roundTo(client.household.investable * 0.008, 100_000);
  return roundTo(Math.max(client.household.liquidity * 0.012, 10_000), 10_000);
}

export function runDemoConnector(provider: string, client: ClientRecord): DemoConnectResult | null {
  if (provider === "plaid" || provider === "kubera") {
    return {
      ok: true,
      kind: "bank",
      provider,
      providerLabel: provider === "plaid" ? "Plaid" : "Kubera",
      fullName: clientFullName(client),
      accounts: bankAccounts(client).map((account) => ({
        id: account.id,
        name: account.name,
        institution: account.custodian,
        balance: account.balance,
        type: account.type,
      })),
    };
  }
  if (provider === "fundrise" || provider === "coinbase" || provider === "kalshi") {
    const label =
      provider === "fundrise"
        ? "Fundrise Flagship Real Estate Fund"
        : provider === "coinbase"
          ? "Coinbase · BTC and ETH"
          : "Kalshi open positions";
    const detail =
      provider === "fundrise"
        ? "A private real-estate position the bank pull did not include."
        : provider === "coinbase"
          ? "Crypto balances the bank pull did not include."
          : "Prediction-market positions the bank pull did not include.";
    return {
      ok: true,
      kind: "asset",
      provider,
      providerLabel: provider === "fundrise" ? "Fundrise" : provider === "coinbase" ? "Coinbase" : "Kalshi",
      label,
      amount: connectorAmount(provider, client),
      detail,
    };
  }
  if (provider === "irs") {
    return {
      ok: true,
      kind: "irs",
      provider: "irs",
      providerLabel: "IRS",
      status: "request-out",
      detail: "Identity confirmed in this demo. A transcript request is out, and nothing has posted yet.",
    };
  }
  return null;
}

export function defaultFit(client: ClientRecord): FitInterview {
  const label = client.household.risk.label.toLowerCase();
  const risk: RiskChoice = label.includes("conserv")
    ? "conservative"
    : label.includes("aggress")
      ? "aggressive"
      : label.includes("moderate")
        ? "moderate"
        : label.includes("growth")
          ? "aggressive"
          : "moderate";
  const equity = client.holdings
    .filter((holding) => holding.assetClass === "equity")
    .reduce((sum, holding) => sum + holding.value, 0);
  const fixed = client.holdings
    .filter((holding) => holding.assetClass === "fixed-income")
    .reduce((sum, holding) => sum + holding.value, 0);
  const balance: BalanceChoice =
    equity > fixed * 1.35 ? "equity" : fixed > equity * 1.15 ? "fixed-income" : "balanced";
  const largest = [...client.accounts].sort((a, b) => b.balance - a.balance)[0];
  return {
    risk,
    balance,
    motive: "cheaper",
    focusAccountIds: largest ? [largest.id] : [],
  };
}

function splitOutside(outside: number): { tax: number; irs: number; rest: number } {
  if (outside <= 0) return { tax: 0, irs: 0, rest: 0 };
  const tax = Math.min(outside, roundTo(outside * 0.16, 100_000));
  const irs = Math.min(Math.max(0, outside - tax), roundTo(outside * 0.1, 100_000));
  return { tax, irs, rest: outside - tax - irs };
}

function pictureFrom(points: WealthPoint[], total: number): WealthPicture {
  const drafted = points.map((point) => ({ ...point }));
  const sum = drafted.reduce((totalSum, point) => totalSum + point.amount, 0);
  const drift = total - sum;
  if (drift !== 0 && drafted.length > 0) {
    const host = [...drafted].reverse().find((point) => point.status === "pending") ?? drafted[drafted.length - 1];
    host.amount += drift;
  }
  const verified = drafted.filter((point) => point.status === "verified").reduce((totalSum, point) => totalSum + point.amount, 0);
  const pending = drafted.filter((point) => point.status === "pending").reduce((totalSum, point) => totalSum + point.amount, 0);
  return { total, verified, pending, points: drafted };
}

function wealthFromRecord(client: ClientRecord): WealthPicture {
  const accountSum = sumBalances(client.accounts);
  const total = client.household.householdValue;
  const { tax, irs, rest } = splitOutside(Math.max(0, total - accountSum));
  const points: WealthPoint[] = client.accounts.map((account) => ({
    id: account.id,
    label: `${account.custodian} · ${account.name}`,
    amount: account.balance,
    status: account.verifiedCustodian ? "verified" : "pending",
    note: account.verifiedCustodian ? "Balance verified" : "Confirmation still out",
  }));
  if (tax > 0) {
    points.push({ id: "tax", label: "Tax documents", amount: tax, status: "pending", note: "Still processing" });
  }
  if (irs > 0) {
    points.push({ id: "irs", label: "IRS transcript", amount: irs, status: "pending", note: "Request still out" });
  }
  if (rest > 0) {
    points.push({
      id: "rest",
      label: "Other household assets",
      amount: rest,
      status: "pending",
      note: "Not on a connection yet",
    });
  }
  return pictureFrom(points, total);
}

function wealthFromProfile(client: ClientRecord, profile: DemoProfile): WealthPicture {
  const pulledIds = new Set(profile.pulledAccounts.map((account) => account.id));
  const pulledSum = sumBalances(profile.pulledAccounts);
  const accountSum = sumBalances(client.accounts);
  const unpulledSum = sumBalances(client.accounts.filter((account) => !pulledIds.has(account.id)));
  const outside = Math.max(0, client.household.householdValue - accountSum);
  const fundrise = profile.fundrise.connected ? profile.fundrise.amount : 0;
  const coinbase = profile.coinbase.connected ? profile.coinbase.amount : 0;
  const kalshi = profile.kalshi.connected ? profile.kalshi.amount : 0;
  const other = profile.other?.amount ?? 0;

  let fundriseLeft = fundrise;
  let unpulledAdj = unpulledSum;
  const fromUnpulled = Math.min(unpulledAdj, fundriseLeft);
  unpulledAdj -= fromUnpulled;
  fundriseLeft -= fromUnpulled;
  let outsideAdj = outside;
  const fromOutside = Math.min(outsideAdj, fundriseLeft);
  outsideAdj -= fromOutside;
  fundriseLeft -= fromOutside;
  const absorbed = fundrise - fundriseLeft;

  const { tax, irs, rest } = splitOutside(outsideAdj);
  const total = client.household.householdValue + coinbase + kalshi + other;
  const points: WealthPoint[] = [
    {
      id: "bank",
      label: profile.providerLabel,
      amount: pulledSum,
      status: "verified",
      note: `${profile.fullName} · bank accounts and balances`,
    },
    {
      id: "fundrise",
      label: "Fundrise",
      amount: profile.fundrise.connected ? absorbed : 0,
      status: profile.fundrise.connected ? "verified" : "pending",
      note: profile.fundrise.connected ? profile.fundrise.label : "Not connected",
    },
    {
      id: "coinbase",
      label: "Coinbase",
      amount: profile.coinbase.connected ? coinbase : 0,
      status: profile.coinbase.connected ? "verified" : "pending",
      note: profile.coinbase.connected ? profile.coinbase.label : "Not connected",
    },
    {
      id: "kalshi",
      label: "Kalshi",
      amount: profile.kalshi.connected ? kalshi : 0,
      status: profile.kalshi.connected ? "verified" : "pending",
      note: profile.kalshi.connected ? profile.kalshi.label : "Not connected",
    },
    {
      id: "other",
      label: other > 0 ? profile.other?.label || "Other assets" : "Other assets",
      amount: other,
      status: "pending",
      note: other > 0 ? "Declared, not verified" : "Nothing else declared",
    },
  ];
  if (unpulledAdj > 0) {
    points.push({
      id: "unpulled",
      label: "Not in the bank pull",
      amount: unpulledAdj,
      status: "pending",
      note: "Still outside the connected accounts",
    });
  }
  if (tax > 0) {
    points.push({
      id: "tax",
      label: "Tax documents",
      amount: tax,
      status: "pending",
      note: profile.taxDocName ? `${profile.taxDocName} · still processing` : "Still processing",
    });
  }
  if (irs > 0) {
    points.push({ id: "irs", label: "IRS transcript", amount: irs, status: "pending", note: "Request still out" });
  }
  if (rest > 0) {
    points.push({
      id: "rest",
      label: "Other household assets",
      amount: rest,
      status: "pending",
      note: "Not reflected on a connection yet",
    });
  }
  return pictureFrom(points, total);
}

export function describeWealth(client: ClientRecord, profile: DemoProfile | null): WealthPicture {
  if (profile && profile.clientId === client.id) return wealthFromProfile(client, profile);
  return wealthFromRecord(client);
}

function tickersFor(client: ClientRecord, accountId: string): string[] {
  return client.holdings
    .filter((holding) => holding.accountId === accountId)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .map((holding) => holding.ticker);
}

function englishList(items: string[]): string {
  if (items.length === 0) return "the same securities";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function savingsBps(fit: FitInterview): number {
  if (fit.balance === "fixed-income") return 12;
  if (fit.balance === "equity") return 18;
  return 14;
}

function matchBase(account: Account, fit: FitInterview): number {
  let score = fit.focusAccountIds.includes(account.id) ? 96 : 89;
  if (fit.risk === "aggressive" && account.sleeve === "cash") score -= 7;
  if (fit.risk === "conservative" && (account.sleeve === "taxable" || account.sleeve === "private")) score -= 4;
  if (fit.balance === "equity" && account.sleeve === "qualified") score -= 2;
  if (fit.balance === "fixed-income" && account.sleeve === "cash") score += 3;
  return Math.max(74, Math.min(97, score));
}

function cheaperTitle(fit: FitInterview): string {
  if (fit.balance === "equity") return "Same equities, lower fee";
  if (fit.balance === "fixed-income") return "Same bonds, lower fee";
  return "Same mix, lower fee";
}

function changeTitle(fit: FitInterview): string {
  if (fit.risk === "aggressive") return "A sharper equity sleeve";
  if (fit.risk === "conservative") return "A steadier income sleeve";
  return "A cleaner version of this account";
}

function strategyNow(account: Account, client: ClientRecord): string {
  const totals = new Map<string, number>();
  for (const holding of client.holdings) {
    if (holding.accountId !== account.id || holding.value <= 0) continue;
    totals.set(holding.assetClass, (totals.get(holding.assetClass) ?? 0) + holding.value);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const second = ranked[1];
  if (!top) return account.type;
  if (second && second[1] >= top[1] * 0.55) return "Blended strategy";
  switch (top[0]) {
    case "equity":
      return "Equity strategy";
    case "fixed-income":
      return "Bond strategy";
    case "private":
      return "Private markets strategy";
    case "cash":
      return "Cash strategy";
    case "real-assets":
      return "Real-assets strategy";
    default:
      return account.type;
  }
}

function strategyNext(kind: "cheaper" | "sunset" | "change", current: string, fit: FitInterview): string {
  if (kind === "sunset") return "In-kind successor strategy";
  if (kind === "change") {
    if (fit.risk === "aggressive") return "Higher-growth equity strategy";
    if (fit.risk === "conservative") return "Income strategy";
    return "Rebuilt core strategy";
  }
  if (current === "Equity strategy") return "Lower-fee equity strategy";
  if (current === "Bond strategy") return "Lower-fee bond strategy";
  if (current === "Cash strategy") return "Lower-fee reserve strategy";
  if (current === "Private markets strategy") return "Lower-fee private markets strategy";
  if (current === "Real-assets strategy") return "Lower-fee real-assets strategy";
  if (current === "Blended strategy") return "Lower-fee blended strategy";
  return "Lower-fee strategy";
}

function accountStrategies(
  account: Account,
  client: ClientRecord,
  fit: FitInterview,
): [Recommendation, Recommendation, Recommendation] {
  const names = englishList(tickersFor(client, account.id));
  const bps = savingsBps(fit);
  const base = matchBase(account, fit);
  const currentStrategy = strategyNow(account, client);
  const cheaper: Recommendation = {
    id: `${account.id}-cheaper`,
    title: cheaperTitle(fit),
    matchPct: base,
    currentStrategy,
    nextStrategy: strategyNext("cheaper", currentStrategy, fit),
    reason: `${names} sit on both sides of a move out of ${account.custodian}. An in-kind transfer would not create much tax, and a close strategy is ${bps} bps cheaper.`,
  };
  const sunset: Recommendation = {
    id: `${account.id}-sunset`,
    title: `${account.custodian} is sunsetting this`,
    matchPct: base,
    currentStrategy,
    nextStrategy: strategyNext("sunset", currentStrategy, fit),
    reason: `${account.custodian} is sunsetting ${account.name}. The replacement holds ${names}, so the switch stays in-kind and would not create much tax.`,
  };
  const change: Recommendation = {
    id: `${account.id}-change`,
    title: changeTitle(fit),
    matchPct: base,
    currentStrategy,
    nextStrategy: strategyNext("change", currentStrategy, fit),
    reason: `You wanted a change in ${account.name}. ${names} overlap the proposed book, so switching would not create much tax.`,
  };
  const ordered =
    fit.motive === "sunset" ? [sunset, cheaper, change] : fit.motive === "change" ? [change, cheaper, sunset] : [cheaper, change, sunset];
  return ordered.map((item, index) => ({
    ...item,
    matchPct: Math.max(70, base - index * 5),
  })) as [Recommendation, Recommendation, Recommendation];
}

function consolidationClause(consolidated: number, largest: number): string {
  const next = HOUSEHOLD_TIERS.find((tier) => consolidated < tier);
  if (!next) {
    return "The largest account already meets the same household minimums as the combined total, so putting them at one bank does not clear a new one.";
  }
  const already = [...HOUSEHOLD_TIERS].reverse().find((tier) => largest >= tier);
  const alone = already
    ? ` The largest account is already ${formatUsd(largest, true)}, which meets a ${formatUsd(already, true)} minimum on its own.`
    : "";
  return `That is under a ${formatUsd(next, true)} household minimum, so combining them does not clear a new one.${alone}`;
}

function classSum(client: ClientRecord, accountId: string, assetClass: "equity" | "fixed-income"): number {
  return client.holdings
    .filter((holding) => holding.accountId === accountId && holding.assetClass === assetClass)
    .reduce((sum, holding) => sum + holding.value, 0);
}

function combineIdea(client: ClientRecord): Recommendation {
  const ranked = [...client.accounts].sort((a, b) => b.balance - a.balance);
  const custodians = new Set(ranked.map((account) => account.custodian));
  const splitBanks = custodians.size > 1;
  const currentStrategy = splitBanks
    ? "Separate accounts at different banks"
    : "Separate accounts at the same bank";
  const nextStrategy = splitBanks ? "One household relationship at one bank" : "One household mandate";
  const first = ranked[0];
  const second = ranked[1];
  if (!first || !second) {
    return {
      id: "household-combine",
      title: "One mandate for the household",
      matchPct: 90,
      currentStrategy,
      nextStrategy,
      reason: `${client.household.name} already has ${formatUsd(client.household.investable, true)} investable. A household minimum is counted at one bank. There are not two accounts here to consolidate.`,
    };
  }
  const consolidated = sumBalances(ranked);
  const minimum = oneBankHouseholdMinimum(ranked.map((account) => account.balance));
  const pair = `${first.name} at ${first.custodian} is ${formatUsd(first.balance, true)} and ${second.name} at ${second.custodian} is ${formatUsd(second.balance, true)}`;
  const counted =
    ranked.length === 2
      ? `Counted at one bank, the household is ${formatUsd(consolidated, true)}`
      : `Those two are the largest. Counted at one bank, all ${ranked.length} accounts are ${formatUsd(consolidated, true)}`;
  const premise = splitBanks
    ? "A household minimum is counted at one bank, not on each account alone."
    : `Both already sit at ${first.custodian}. A household minimum is still what that one bank counts across the household, not each account alone.`;
  const reason = minimum
    ? `${pair}. ${premise} No account reaches ${formatUsd(minimum, true)}. ${counted}, which meets that ${formatUsd(minimum, true)} household minimum.`
    : `${pair}. ${premise} ${counted}. ${consolidationClause(consolidated, first.balance)}`;
  return {
    id: "household-combine",
    title: nextStrategy,
    matchPct: 93,
    currentStrategy,
    nextStrategy,
    reason,
  };
}

function programIdea(client: ClientRecord): Recommendation {
  const taxable = client.accounts.filter((account) => account.sleeve === "taxable");
  const pool = taxable.length > 0 ? taxable : client.accounts;
  const sum = sumBalances(pool);
  const host = pool[0];
  const ticker = host ? tickersFor(client, host.id)[0] : undefined;
  return {
    id: "household-program",
    title: "A line you already qualify for",
    matchPct: 90,
    currentStrategy: "Invested book without a credit line",
    nextStrategy: "Securities-based line",
    reason: `${formatUsd(sum || client.household.investable, true)} at ${host?.custodian ?? "the custodian"} already qualifies ${client.household.name} for a securities-based line. Drawing on it would cover spending without selling ${ticker ?? "the equity"}, so that unrealized gain is not taxed this year.`,
  };
}

function taxLocation(client: ClientRecord, fit: FitInterview): Recommendation {
  const qualified = client.accounts.find((account) => account.sleeve === "qualified");
  const taxable = client.accounts.find((account) => account.sleeve === "taxable");
  if (!qualified || !taxable) {
    return {
      id: "household-location",
      title: "A lower fee on the book you already have",
      matchPct: 84,
      currentStrategy: "A separate fee at each custodian",
      nextStrategy: "One household fee schedule",
      reason: `${client.household.name} already holds ${formatUsd(client.household.investable, true)} investable. One household fee schedule would cost less than paying each custodian separately.`,
    };
  }
  const bonds = classSum(client, qualified.id, "fixed-income");
  const stocks = classSum(client, taxable.id, "equity");
  const ticker = tickersFor(client, taxable.id)[0] ?? "the equity sleeve";
  const title = fit.balance === "fixed-income" ? "Shelter the coupons in the IRA" : "Leave the growth in taxable";
  return {
    id: "household-location",
    title,
    matchPct: 86,
    currentStrategy: "Bonds and growth mixed across accounts",
    nextStrategy: title,
    reason: `${qualified.name} can hold the bonds${bonds > 0 ? ` (${formatUsd(bonds, true)})` : ""} and ${taxable.name} can keep ${ticker}${stocks > 0 ? ` (${formatUsd(stocks, true)})` : ""}. That shelters the coupon and leaves the growth in the taxable account.`,
  };
}

function householdIdeas(
  client: ClientRecord,
  fit: FitInterview,
): [Recommendation, Recommendation, Recommendation] {
  const combine = combineIdea(client);
  const program = programIdea(client);
  const tax = taxLocation(client, fit);
  const ordered =
    fit.motive === "sunset" ? [program, combine, tax] : fit.motive === "change" ? [tax, combine, program] : [combine, program, tax];
  const scores = [93, 88, 82];
  return ordered.map((item, index) => ({ ...item, matchPct: scores[index] ?? 80 })) as [
    Recommendation,
    Recommendation,
    Recommendation,
  ];
}

export function buildOfferBook(client: ClientRecord, fit: FitInterview): OfferBook {
  return {
    accounts: client.accounts.map((account) => ({
      accountId: account.id,
      accountName: account.name,
      custodian: account.custodian,
      balance: account.balance,
      recommendations: accountStrategies(account, client, fit),
    })),
    household: householdIdeas(client, fit),
  };
}

export function countNewOffers(book: OfferBook, institutionOffers: number): number {
  return book.accounts.length + 1 + Math.max(0, institutionOffers);
}

export function greetingLine(firstName: string, netWorth: number, offers: number): string {
  const noun = offers === 1 ? "offer" : "offers";
  return `Hi ${firstName}, your net worth is ${formatUsd(netWorth, true)} today, we have ${offers} new ${noun} for you today.`;
}
