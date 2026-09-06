import {
  advisor,
  allocations,
  formatUsd,
  household,
  offerHeadline,
  opsPacket,
  rankedInstitutions,
  type Offer,
} from "./mock";

export type OfferDecision = "accepted" | "declined";

export type ChatRole = "assistant" | "user";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  handled: boolean;
}

export interface ChatSuggestion {
  id: string;
  label: string;
}

export interface ChatReply {
  text: string;
  handled: boolean;
  intent: string;
}

export const MOCK_ASSISTANT_LABEL = "MOCK assistant";

export const chatSuggestions: ChatSuggestion[] = [
  {
    id: "strategies-offers",
    label: "Tell me about my recommended strategies and latest offers.",
  },
  {
    id: "verification",
    label: "What's verified on my passport right now?",
  },
  {
    id: "ops",
    label: "How much of the IRA rollover packet can you reuse?",
  },
  {
    id: "allocation",
    label: "Walk me through my allocation and household value.",
  },
];

export function greetingText(): string {
  return `Hi ${household.clientFirstName}, your net worth is ${formatUsd(household.householdValue, true)}. Ask me anything`;
}

export function greetingMessage(): ChatMessage {
  return {
    id: "greeting",
    role: "assistant",
    text: greetingText(),
    handled: true,
  };
}

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function offerLine(offer: Offer, decision: OfferDecision | undefined): string {
  const status = decision ? ` · ${decision === "accepted" ? "Accepted" : "Declined"}` : " · pending";
  return `Rank ${offer.rank}: ${offerHeadline(offer)}${status}. ${offer.fitReason}`;
}

function replyStrategies(consentOn: boolean, decisions: Record<string, OfferDecision>): ChatReply {
  if (!consentOn) {
    return {
      intent: "strategies-offers",
      handled: true,
      text:
        "MOCK FAILURE: passport share consent is off, so this mock has no ranked offers to describe. I will not invent an inbox. Turn consent on from Passport, then ask again — or open Offers.",
    };
  }

  const ranked = rankedInstitutions();
  const lines = ranked.map((firm) => offerLine(firm.offer, decisions[firm.offer.id]));
  return {
    intent: "strategies-offers",
    handled: true,
    text: [
      `Recommended strategies and latest offers for the ${household.name} (fixtures, not a live model). Ranked to this $300M household — allocation, Greenwich domicile, and verified Merrill collateral.`,
      ...lines,
      "Accept or Decline on Offers (or the Passport offer section). Status is stored in this browser only.",
    ].join("\n\n"),
  };
}

function replyVerification(): ChatReply {
  return {
    intent: "verification",
    handled: true,
    text: [
      `Verification on this mock passport is fixture-only — no FINRA or custodian API.`,
      `Advisor: ${advisor.name}, ${advisor.title} at ${advisor.firm}. BrokerCheck ${advisor.brokerCheckId} (placeholder). Illustrated since ${advisor.since}.`,
      "Custodian: Merrill Lynch Private Wealth brokerage (account ending 4481) is the only verified sleeve. Fidelity, Schwab, Oakridge admin, and First Atlantic cash stay unverified so the badge means something.",
      "Open Verification for the attestation trail.",
    ].join("\n\n"),
  };
}

function replyOps(): ChatReply {
  const reused = opsPacket.fields.filter((field) => field.reused).length;
  const needed = opsPacket.fields.filter((field) => !field.reused).length;
  return {
    intent: "ops",
    handled: true,
    text: [
      `${opsPacket.title}: ${opsPacket.from} → ${opsPacket.to}.`,
      `${opsPacket.reused} of ${opsPacket.total} fields reuse the Whitmore passport (${reused} marked reused, ${needed} still collected).`,
      "Still needed in this mock: medallion / wet signature, receiving-plan acceptance, and the CT rollover notice. No ACATS or transfer agent is connected.",
      "Open Ops to see each reused field.",
    ].join("\n\n"),
  };
}

function replyAllocation(): ChatReply {
  const sleeves = allocations.map((row) => `${row.label} ${row.pct}%`).join(" · ");
  return {
    intent: "allocation",
    handled: true,
    text: [
      `${household.name} net worth / household value is ${formatUsd(household.householdValue, true)} (${formatUsd(household.householdValue)}) — the labeled AUM for this walkthrough.`,
      `Account value ${formatUsd(household.accountValue, true)} · investable ${formatUsd(household.investable, true)} · Greenwich residence ${formatUsd(household.realEstate, true)} · other personal ${formatUsd(household.otherHousehold, true)} · liquidity ${formatUsd(household.liquidity, true)}.`,
      `Risk: ${household.risk.label}, ${household.risk.horizon}. ${household.risk.capacity}.`,
      `Allocation bar: ${sleeves}. Open Passport to drill asset class → sleeve → securities.`,
    ].join("\n\n"),
  };
}

function replyConsent(consentOn: boolean): ChatReply {
  return {
    intent: "consent",
    handled: true,
    text: consentOn
      ? "Passport share consent is on. Any paying institution may send an offer. Accept still requires that consent stay on — this mock will not complete an accept if you turn it off."
      : "MOCK FAILURE: passport share consent is off. No institution may offer, and Accept is blocked. Toggle it on from Passport. This is not an empty API — the inbox is closed on purpose.",
  };
}

const INTENT_KEYWORDS: { intent: string; keywords: string[] }[] = [
  {
    intent: "strategies-offers",
    keywords: [
      "offer",
      "offers",
      "strategy",
      "strategies",
      "recommend",
      "recommended",
      "inbox",
      "placement",
      "muni",
      "municipal",
      "credit",
      "lending",
      "sbl",
      "secondar",
      "oakridge",
      "meridian",
      "atlantic",
    ],
  },
  {
    intent: "verification",
    keywords: [
      "verif",
      "advisor",
      "brokercheck",
      "custodian",
      "linda",
      "mcdonald",
      "merrill",
      "badge",
      "attest",
    ],
  },
  {
    intent: "ops",
    keywords: ["ops", "rollover", "reuse", "packet", "ira", "enrollment", "acats"],
  },
  {
    intent: "allocation",
    keywords: [
      "allocation",
      "sleeve",
      "holding",
      "holdings",
      "net worth",
      "household",
      "aum",
      "investable",
      "worth",
      "portfolio",
      "weight",
    ],
  },
  {
    intent: "consent",
    keywords: ["consent", "share", "privacy", "opt in", "opt-in"],
  },
];

function matchIntent(normalized: string): string | null {
  const suggestion = chatSuggestions.find((item) => normalize(item.label) === normalized);
  if (suggestion) return suggestion.id;

  if (/^(hi|hello|hey)\b/.test(normalized)) return "greeting";

  for (const row of INTENT_KEYWORDS) {
    if (row.keywords.some((keyword) => normalized.includes(keyword))) {
      return row.intent;
    }
  }

  return null;
}

export function answerMockChat(
  input: string,
  ctx: { consentOn: boolean; decisions: Record<string, OfferDecision> },
): ChatReply {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      intent: "empty",
      handled: false,
      text: "MOCK FAILURE: empty question. Type something, or use a suggestion chip. There is no live model to guess from silence.",
    };
  }

  const intent = matchIntent(normalize(trimmed));

  if (intent === "greeting") {
    return {
      intent,
      handled: true,
      text: `${greetingText()}\n\nI only answer scripted Whitmore-fixture questions (offers, verification, ops reuse, allocation, consent). I am a MOCK assistant — not a model.`,
    };
  }
  if (intent === "strategies-offers") return replyStrategies(ctx.consentOn, ctx.decisions);
  if (intent === "verification") return replyVerification();
  if (intent === "ops") return replyOps();
  if (intent === "allocation") return replyAllocation();
  if (intent === "consent") return replyConsent(ctx.consentOn);

  return {
    intent: "unhandled",
    handled: false,
    text: `I don't have that in this mock.\n\nMOCK FAILURE: no scripted handler for “${trimmed}”. There is no live LLM. Ask one of the suggestion chips, or use keywords like offers, verification, allocation, rollover, or consent.`,
  };
}

if (household.householdValue !== 300_000_000) {
  throw new Error("MOCK DATA FAILURE: chat greeting must use the $300M household value.");
}

if (!greetingText().includes(formatUsd(household.householdValue, true))) {
  throw new Error("MOCK DATA FAILURE: greeting net worth does not match household value.");
}
