import {
  advisor,
  allocationTree,
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

export const UNHANDLED_CHAT_REPLY = "This mock only answers the suggested questions.";

export const chatSuggestions: ChatSuggestion[] = [
  {
    id: "strategies-offers",
    label: "Tell me about my recommended strategies and latest offers.",
  },
  {
    id: "understand-offers",
    label: "Help me understand my offers and recommended strategies.",
  },
  {
    id: "portfolio",
    label: "Break down my portfolio, allocation, and holdings.",
  },
  {
    id: "verification",
    label: "What's verified on my passport right now?",
  },
  {
    id: "ops",
    label: "How much of the IRA rollover packet can you reuse?",
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
        "MOCK FAILURE: passport share consent is off, so this mock has no ranked offers to describe. I will not invent an inbox. Turn consent on from Passport, then tap this suggestion again — or open Offers.",
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

function replyUnderstandOffers(consentOn: boolean, decisions: Record<string, OfferDecision>): ChatReply {
  if (!consentOn) {
    return {
      intent: "understand-offers",
      handled: true,
      text:
        "MOCK FAILURE: passport share consent is off, so there are no offers to understand. Accept and Decline are blocked. Turn consent on from Passport, then tap this suggestion again.",
    };
  }

  const ranked = rankedInstitutions();
  const lines = ranked.map((firm) => offerLine(firm.offer, decisions[firm.offer.id]));
  return {
    intent: "understand-offers",
    handled: true,
    text: [
      `These are paid placements ranked to the Whitmore $300M passport — not an optimizer and not a live quote. Rank 1 is the municipal SMA; Rank 2 is securities-based credit; Rank 3 is a secondaries sleeve.`,
      ...lines,
      "On Offers or Passport, tap Accept or Decline. This mock stores that status in the browser. It will not accept without consent.",
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

function replyPortfolio(): ChatReply {
  const classLines = allocationTree.map((node) => {
    const pct = Math.round(node.pct * 10) / 10;
    const sleeveBits = node.sleeves
      .map((sleeve) => `${sleeve.accountName} (${sleeve.custodian}) ${formatUsd(sleeve.value, true)}`)
      .join("; ");
    const topNames = [...node.sleeves.flatMap((sleeve) => sleeve.holdings)]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((row) => `${row.ticker} ${formatUsd(row.value, true)}`)
      .join(", ");
    return `${node.label} ${pct}% · ${formatUsd(node.value, true)}. Sleeves: ${sleeveBits}. Largest names: ${topNames}.`;
  });

  return {
    intent: "portfolio",
    handled: true,
    text: [
      `${household.name} net worth / household value is ${formatUsd(household.householdValue, true)} (${formatUsd(household.householdValue)}) — the labeled AUM for this walkthrough.`,
      `Account value ${formatUsd(household.accountValue, true)} · investable ${formatUsd(household.investable, true)} · Greenwich residence ${formatUsd(household.realEstate, true)} · other personal ${formatUsd(household.otherHousehold, true)} · liquidity ${formatUsd(household.liquidity, true)}.`,
      `Risk: ${household.risk.label}, ${household.risk.horizon}. ${household.risk.capacity}.`,
      ...classLines,
      "Open Passport to drill asset class → sleeve/account → individual securities. Every row is a MOCK fixture.",
    ].join("\n\n"),
  };
}

export function answerMockChat(
  input: string,
  ctx: { consentOn: boolean; decisions: Record<string, OfferDecision> },
): ChatReply {
  const suggestion = chatSuggestions.find((item) => normalize(item.label) === normalize(input));
  if (!suggestion) {
    return {
      intent: "unhandled",
      handled: false,
      text: UNHANDLED_CHAT_REPLY,
    };
  }

  if (suggestion.id === "strategies-offers") return replyStrategies(ctx.consentOn, ctx.decisions);
  if (suggestion.id === "understand-offers") return replyUnderstandOffers(ctx.consentOn, ctx.decisions);
  if (suggestion.id === "portfolio") return replyPortfolio();
  if (suggestion.id === "verification") return replyVerification();
  if (suggestion.id === "ops") return replyOps();

  throw new Error(`MOCK FAILURE: suggestion "${suggestion.id}" has no canned reply.`);
}

const REQUIRED_CHIP_IDS = ["strategies-offers", "understand-offers", "portfolio"] as const;
for (const id of REQUIRED_CHIP_IDS) {
  if (!chatSuggestions.some((item) => item.id === id)) {
    throw new Error(`MOCK DATA FAILURE: required chat chip "${id}" is missing.`);
  }
}

if (household.householdValue !== 300_000_000) {
  throw new Error("MOCK DATA FAILURE: chat greeting must use the $300M household value.");
}

if (!greetingText().includes(formatUsd(household.householdValue, true))) {
  throw new Error("MOCK DATA FAILURE: greeting net worth does not match household value.");
}
