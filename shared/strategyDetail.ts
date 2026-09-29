import { allInFeeLabel, type BiddingOffer, type Recommendation } from "./marketplace.ts";
import { STRATEGY_UNIVERSE, type StrategyProfile } from "./seed/strategies.ts";
import { strategyFeeLine } from "./strategies.ts";

export interface StrategyDetail {
  key: string;
  name: string;
  manager: string | null;
  category: string | null;
  style: string | null;
  fee: string | null;
  minimum: number | null;
  summary: string | null;
  /** Pitch-specific tailoring, when it is separate from the summary. */
  note: string | null;
  eligibility: string | null;
  matchPct: number | null;
  currentStrategy: string | null;
  risk: string | null;
  esg: boolean;
  inception: string | null;
  productCode: string | null;
}

function profileByName(name: string): StrategyProfile | undefined {
  return STRATEGY_UNIVERSE.find((strategy) => strategy.name === name);
}

function eligibilityLine(minimum: number | null, investable: number | null): string | null {
  if (investable == null || !Number.isFinite(investable)) return null;
  if (minimum == null) return "Minimum not listed";
  return investable >= minimum ? "You meet the minimum" : "Above this household";
}

function blank(value: string | null | undefined): string | null {
  const text = value?.trim() ?? "";
  return text ? text : null;
}

export function detailFromProfile(strategy: StrategyProfile, investable: number | null): StrategyDetail {
  return {
    key: strategy.id,
    name: strategy.name,
    manager: strategy.manager,
    category: strategy.category,
    style: strategy.style,
    fee: blank(strategyFeeLine(strategy)),
    minimum: strategy.minimum,
    summary: strategy.summary,
    note: null,
    eligibility: investable == null ? null : eligibilityLine(strategy.minimum, investable),
    matchPct: null,
    currentStrategy: null,
    risk: strategy.risk,
    esg: strategy.esg,
    inception: strategy.inception,
    productCode: strategy.productCode,
  };
}

export function detailFromRecommendation(recommendation: Recommendation, investable: number | null): StrategyDetail {
  const profile = profileByName(recommendation.nextStrategy);
  if (profile) {
    const detail = detailFromProfile(profile, investable ?? Number.NaN);
    return {
      ...detail,
      eligibility: eligibilityLine(profile.minimum, investable),
      note: blank(recommendation.reason),
      matchPct: recommendation.matchPct,
      currentStrategy: blank(recommendation.currentStrategy),
    };
  }
  return {
    key: recommendation.id,
    name: recommendation.nextStrategy,
    manager: null,
    category: null,
    style: null,
    fee: allInFeeLabel(recommendation.allInBps),
    minimum: recommendation.strategyMinimum,
    summary: blank(recommendation.reason),
    note: null,
    eligibility: eligibilityLine(recommendation.strategyMinimum, investable),
    matchPct: recommendation.matchPct,
    currentStrategy: blank(recommendation.currentStrategy),
    risk: null,
    esg: false,
    inception: null,
    productCode: null,
  };
}

export function detailFromBid(offer: BiddingOffer, investable: number | null): StrategyDetail {
  const profile = profileByName(offer.title);
  if (profile) {
    const detail = detailFromProfile(profile, investable ?? Number.NaN);
    return {
      ...detail,
      manager: blank(offer.bidder) ?? detail.manager,
      fee: blank(offer.terms) ?? detail.fee,
      minimum: offer.minimum ?? detail.minimum,
      note: blank(offer.customization),
      eligibility: eligibilityLine(offer.minimum ?? profile.minimum, investable),
      matchPct: offer.matchPct,
    };
  }
  return {
    key: offer.id,
    name: offer.title,
    manager: blank(offer.bidder),
    category: null,
    style: null,
    fee: blank(offer.terms),
    minimum: offer.minimum,
    summary: blank(offer.customization),
    note: null,
    eligibility: eligibilityLine(offer.minimum, investable),
    matchPct: offer.matchPct,
    currentStrategy: null,
    risk: null,
    esg: false,
    inception: null,
    productCode: null,
  };
}
