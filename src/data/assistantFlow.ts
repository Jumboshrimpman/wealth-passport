import {
  ALGORITHMIC_PARTY,
  acceptChoicesFor,
  choicePrice,
  type AcceptableChoice,
  type RowAcceptance,
} from "../../shared/acceptOffer.ts";
import type { OfferBoard } from "../../shared/marketplace.ts";

export interface PitchRecommendation {
  rowKey: string;
  choice: AcceptableChoice;
  /** What the pitch or match already says. Not a new legal claim. */
  because: string;
  price: string | null;
}

export const SERVICE_PRODUCTS = [
  { id: "business-loc", label: "Business line of credit", test: /business line of credit|\bbloc\b|business loc\b/i },
  { id: "business-card", label: "Business credit card", test: /business credit card/i },
  { id: "personal-loc", label: "Personal line of credit", test: /personal line of credit|personal loc\b/i },
  { id: "personal-card", label: "Personal credit card", test: /personal credit card/i },
  { id: "personal-loan", label: "Personal loan", test: /personal loan/i },
  { id: "business-loan", label: "Business loan", test: /business loan/i },
] as const;

export type ServiceProductId = (typeof SERVICE_PRODUCTS)[number]["id"];

export interface AssistantPrompt {
  id: string;
  label: string;
  tone: "primary" | "quiet";
}

const QUIET_PROMPTS: AssistantPrompt[] = [
  { id: "services", label: "I need other financial services", tone: "quiet" },
  { id: "app", label: "Get the app", tone: "quiet" },
  { id: "phone", label: "On your phone", tone: "quiet" },
];

/** Highest-match manager pitch on a real account. WealthPass stays the ranker, not the manager. */
export function bestPitchRecommendation(board: OfferBoard): PitchRecommendation | null {
  const accounts = board.rows.filter((row) => row.key !== "household" && row.offers.length > 0);
  const pool = accounts.length > 0 ? accounts : board.rows.filter((row) => row.offers.length > 0);
  const ranked = [...pool].sort((a, b) => (b.offers[0]?.matchPct ?? 0) - (a.offers[0]?.matchPct ?? 0));
  for (const row of ranked) {
    const offer = row.offers[0];
    if (!offer) continue;
    const choice = acceptChoicesFor(row, false, false).find((item) => item.id === `bid:${offer.id}`);
    if (!choice || choice.party === ALGORITHMIC_PARTY) continue;
    return {
      rowKey: row.key,
      choice,
      because: offer.customization,
      price: choicePrice(choice),
    };
  }
  for (const row of board.rows) {
    if (row.key === "household") continue;
    const match = row.algorithmic[0];
    if (!match) continue;
    const choice = acceptChoicesFor(row, false, false).find((item) => item.kind === "algorithmic");
    if (!choice) continue;
    return {
      rowKey: row.key,
      choice,
      because: match.reason,
      price: choicePrice(choice),
    };
  }
  return null;
}

function fragment(text: string): string {
  const trimmed = text.trim().replace(/[.]+$/, "");
  if (!trimmed) return "";
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export function recommendationCopy(rec: PitchRecommendation): string {
  const because = fragment(rec.because);
  const becauseClause = because ? ` because ${because}` : "";
  const cost = rec.price ? ` The cost is ${rec.price}.` : "";
  const also =
    rec.choice.party === ALGORITHMIC_PARTY
      ? "WealthPass ranked this and is not the manager. Not legal advice. Ranking cannot be bought."
      : `${rec.choice.party} would manage it. Not legal advice. Ranking cannot be bought.`;
  return `The first account we are looking at is ${rec.choice.accountName} and we recommend ${rec.choice.strategy}${becauseClause}.${cost} You should also know ${also} Interested in proceeding or getting more information?`;
}

export function recommendationDetailCopy(rec: PitchRecommendation): string {
  const who =
    rec.choice.party === ALGORITHMIC_PARTY
      ? `WealthPass ranked ${rec.choice.strategy} for ${rec.choice.accountName}. It is not the manager.`
      : `${rec.choice.party} would manage ${rec.choice.strategy} on ${rec.choice.accountName}.`;
  return `${who} The selected manager sets up Schwab. WealthPass does not hold the LPOA. Not legal advice. Say proceed to open the agreement.`;
}

export function enrolledAssistantCopy(row: RowAcceptance): string {
  const who = row.party === ALGORITHMIC_PARTY ? "Your selected manager" : row.party;
  return `Enrolled in ${row.strategy} for ${row.accountName}. ${who} may follow up. The selected manager sets up Schwab. WealthPass does not hold the LPOA. Sharing an LPOA is not an LPOA.`;
}

export function managerLine(row: Pick<RowAcceptance, "party">): string {
  if (row.party === ALGORITHMIC_PARTY) {
    return "Ranked by WealthPass. Manager sets up Schwab. WealthPass does not hold the LPOA.";
  }
  return `${row.party}. Manager sets up Schwab. WealthPass does not hold the LPOA.`;
}

/** True when this wealth row is the account that accepted the strategy. */
export function enrollmentMatchesPoint(
  point: { id: string; label: string },
  key: string,
  row: Pick<RowAcceptance, "accountName">,
): boolean {
  if (point.id === key) return true;
  const name = row.accountName.trim().toLowerCase();
  return name.length > 0 && point.label.toLowerCase().includes(name);
}

export function isPitchNavigation(text: string): boolean {
  return /take me to (my )?(pitches|offers)\b/i.test(text.trim());
}

export function isAcceptIntent(text: string): boolean {
  return /^(accept|i accept|proceed|enroll|enroll me|i like it)\.?$/i.test(text.trim());
}

export function isMoreInfoIntent(text: string): boolean {
  return /^(more information|tell me more|more info)\.?$/i.test(text.trim());
}

export function isPhoneIntent(text: string): boolean {
  return /\bon your phone\b|\bon my phone\b|text wealthpass|\bsms\b/i.test(text.trim());
}

export function isAppIntent(text: string): boolean {
  return /get the app|download the app|manage assets on the go/i.test(text.trim());
}

export function isServiceMenu(text: string): boolean {
  return /other financial services|isn.?t being met|not being met|don.?t see any (offers|pitches)|do not see any (offers|pitches)|unmet need/i.test(
    text.trim(),
  );
}

export function matchServiceProduct(text: string): (typeof SERVICE_PRODUCTS)[number] | null {
  const trimmed = text.trim();
  return SERVICE_PRODUCTS.find((product) => product.test.test(trimmed)) ?? null;
}

export function serviceRequestCopy(label: string, already: boolean): string {
  if (already) return `Already noted: ${label}. Still waiting. Demo only.`;
  return `Noted: ${label}. I'll reach out when there's an offer. Demo only.`;
}

export function promptsFor(input: { pendingAccept: boolean; enrolled: boolean }): AssistantPrompt[] {
  if (input.pendingAccept) {
    return [
      { id: "accept", label: "Proceed", tone: "primary" },
      { id: "more", label: "More information", tone: "primary" },
      ...QUIET_PROMPTS,
    ];
  }
  if (input.enrolled) return QUIET_PROMPTS;
  return [{ id: "pitches", label: "Take me to my pitches", tone: "primary" }, ...QUIET_PROMPTS];
}
