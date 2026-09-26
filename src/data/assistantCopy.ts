import type { OfferMatch } from "../../shared/match.ts";
import { formatUsd } from "../../shared/format.ts";
import {
  greetingLine,
  selectClientOffers,
  type InstitutionOfferRef,
  type OfferBook,
  type SurfacedOffer,
  type WealthPicture,
} from "../../shared/marketplace.ts";
import type { ClientPassport } from "../../shared/types.ts";

export const STARTER_PROMPTS = [
  { id: "offers", label: "What are my new offers?" },
  { id: "accounts", label: "How are my accounts set up?" },
  { id: "financials", label: "What's verified on my financials?" },
  { id: "household", label: "How does this household look?" },
] as const;

function intentOf(input: string): "offers" | "accounts" | "financials" | "household" | "general" {
  const text = input.toLowerCase();
  if (/(offer|recommend|strateg|match|cheaper|sunset)/.test(text)) return "offers";
  if (/(account|balance|custodian|brokerage|ira)/.test(text)) return "accounts";
  if (/(financial|verified|pending|net worth|wealth|tax|plaid|kubera|coinbase|fundrise|kalshi)/.test(text)) {
    return "financials";
  }
  if (/(household|allocation|risk|analysis|family|combine)/.test(text)) return "household";
  return "general";
}

export function answerQuestion(
  input: string,
  ctx: {
    client: ClientPassport;
    book: OfferBook;
    wealth: WealthPicture;
    institutions: OfferMatch[];
  },
): string {
  const { client, book, wealth, institutions } = ctx;
  const first = client.household.clientFirstName;
  const intent = intentOf(input);

  if (intent === "offers") {
    const selected = selectClientOffers(book, institutionRefs(institutions));
    const lines = [greetingLine(first, wealth.total, selected.length)];
    for (const offer of selected) {
      lines.push(offerLine(offer, book, institutions));
    }
    if (institutions.length === 0) {
      lines.push(`No institution has sent an offer that fits the ${client.household.name} record.`);
    }
    lines.push("The ranking is proprietary. It cannot be bought.");
    return lines.join("\n\n");
  }

  if (intent === "accounts") {
    const lines = client.accounts.map(
      (account) =>
        `${account.name} (${account.type}) at ${account.custodian}: ${formatUsd(account.balance)}. ${
          account.verifiedCustodian ? "The balance is verified." : "Confirmation is still out on this one."
        }`,
    );
    const largest = [...client.accounts].sort((a, b) => b.balance - a.balance)[0];
    return [
      `${first}'s ${client.household.name} has ${client.accounts.length} accounts totaling ${formatUsd(
        client.accounts.reduce((sum, account) => sum + account.balance, 0),
        true,
      )}.`,
      ...lines,
      largest
        ? `The one that dominates the book is ${largest.name} at ${largest.custodian}.`
        : `${client.household.domicile} is the domicile on the record.`,
    ].join("\n\n");
  }

  if (intent === "financials") {
    return [
      `${first}, verified wealth is ${formatUsd(wealth.verified)} and ${formatUsd(wealth.pending)} is still pending. Net worth on this record is ${formatUsd(wealth.total)}.`,
      ...wealth.points.map((point) => `${point.label}: ${formatUsd(point.amount)} · ${point.note}.`),
    ].join("\n\n");
  }

  if (intent === "household") {
    const classes = client.allocationTree
      .map((node) => `${node.label} ${Math.round(node.pct)}% (${formatUsd(node.value, true)})`)
      .join("; ");
    const lines = [
      `${client.household.name} in ${client.household.domicile}. ${client.household.principals}. Household value ${formatUsd(client.household.householdValue)}. Risk on file: ${client.household.risk.label}, ${client.household.risk.horizon}. ${client.household.risk.capacity}.`,
      classes ? `Allocation: ${classes}.` : "Allocation is not broken out on this record.",
    ];
    const householdOffer = selectClientOffers(book, institutionRefs(institutions)).find(
      (offer) => offer.kind === "strategy" && offer.accountId === null,
    );
    if (householdOffer && householdOffer.kind === "strategy") {
      lines.push(
        `The household offer is ${householdOffer.recommendation.title} (${householdOffer.recommendation.matchPct}% match). ${householdOffer.recommendation.reason}`,
      );
    }
    return lines.join("\n\n");
  }

  const largest = [...client.accounts].sort((a, b) => b.balance - a.balance)[0];
  return [
    `I can answer from ${first}'s record: net worth ${formatUsd(wealth.total)}, ${formatUsd(wealth.verified)} verified and ${formatUsd(wealth.pending)} still pending.`,
    largest
      ? `The largest account is ${largest.name} at ${largest.custodian} (${formatUsd(largest.balance, true)}).`
      : `${client.household.name} is the household on file.`,
    `Ask about offers, accounts, financials, or the household analysis. For example: what are my new offers.`,
  ].join("\n\n");
}

function institutionRefs(institutions: OfferMatch[]): InstitutionOfferRef[] {
  return institutions.map((match) => ({
    id: match.institution.id,
    title: match.institution.offer.title,
    rank: match.institution.offer.rank,
  }));
}

function offerLine(offer: SurfacedOffer, book: OfferBook, institutions: OfferMatch[]): string {
  if (offer.kind === "institution") {
    const match = institutions.find((item) => item.institution.id === offer.institutionId);
    const name = match?.institution.name ?? offer.title;
    const reason = match?.fitReason ? ` ${match.fitReason}` : "";
    return `${name} — ${offer.title}.${reason}`;
  }
  const account = book.accounts.find((item) => item.accountId === offer.accountId);
  const where = account
    ? `${account.accountName} at ${account.custodian} (${formatUsd(account.balance, true)})`
    : "Household";
  const prefix = offer.extra ? "More — " : "";
  const { title, matchPct, reason } = offer.recommendation;
  return `${prefix}${where}: ${title}, ${matchPct}% match. ${reason}`;
}
