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

function namedParty(party: string): string {
  if (party === ALGORITHMIC_PARTY) return "the strategy ranked for this account";
  return party;
}

export function recommendationCopy(rec: PitchRecommendation): string {
  const price = rec.price ? ` The price on the pitch is ${rec.price}.` : "";
  const because = rec.because.trim().replace(/[.]+$/, "");
  return [
    `This is what I recommend for ${rec.choice.accountName}: ${rec.choice.strategy} with ${namedParty(rec.choice.party)}. What do you think?`,
    `Here's how it could benefit your financials given what I've seen. ${because}.${price} This is not legal advice.`,
    `If you enroll in ${rec.choice.strategy} for ${rec.choice.accountName}, just tell me if you like it and I can get started enrolling you.`,
    "The algorithmic ranking cannot be bought.",
  ].join("\n\n");
}

export function enrolledAssistantCopy(row: RowAcceptance): string {
  const reach =
    row.party === ALGORITHMIC_PARTY
      ? "Your selected manager may reach out to finish setting this up."
      : `${row.party} may reach out to finish setting this up.`;
  return [
    `You're enrolled in ${row.strategy} for ${row.accountName}.`,
    reach,
    "Your selected manager sets up the Schwab brokerage. WealthPass does not hold the LPOA. Permission to share an LPOA is not an LPOA. You're all set on this end.",
  ].join(" ");
}

export function managerLine(row: Pick<RowAcceptance, "party">): string {
  if (row.party === ALGORITHMIC_PARTY) {
    return "Ranked by WealthPass. Your selected manager sets up the Schwab brokerage. WealthPass does not hold the LPOA.";
  }
  return `${row.party}. Your selected manager sets up the Schwab brokerage. WealthPass does not hold the LPOA.`;
}

export function isPitchNavigation(text: string): boolean {
  return /take me to (my )?(pitches|offers)\b/i.test(text.trim());
}

export function isAcceptIntent(text: string): boolean {
  return /^(accept|i accept|enroll|enroll me|i like it)\.?$/i.test(text.trim());
}

export function isPhoneIntent(text: string): boolean {
  return /\bon your phone\b|\bon my phone\b|text wealthpass|\bsms\b|on the go/i.test(text.trim());
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
  if (already) {
    return `That's already noted. Still waiting on an offer for ${label}. Nothing is live yet. This is a demo request.`;
  }
  return `Noted. I have your request for ${label}. I'll reach back out once there's an offer. Nothing is live yet. This is a demo request.`;
}

export function promptsFor(input: { pendingAccept: boolean; enrolled: boolean }): AssistantPrompt[] {
  if (input.pendingAccept) return [{ id: "accept", label: "Accept", tone: "primary" }, ...QUIET_PROMPTS];
  if (input.enrolled) return QUIET_PROMPTS;
  return [{ id: "pitches", label: "Take me to my pitches", tone: "primary" }, ...QUIET_PROMPTS];
}
