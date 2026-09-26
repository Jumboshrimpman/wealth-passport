import { formatUsd } from "../../shared/format.ts";
import { greetingLine, type OfferBoard, type WealthPicture } from "../../shared/marketplace.ts";
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
    board: OfferBoard;
    wealth: WealthPicture;
  },
): string {
  const { client, board, wealth } = ctx;
  const first = client.household.clientFirstName;
  const intent = intentOf(input);

  if (intent === "offers") {
    const lines = [
      greetingLine(first, wealth.total, board.rows.filter((row) => row.offers.length > 0).length),
      "Algorithmic match is our ranking of the next strategy. Top offers are companies bidding their best rates. Each list opens on rank 1.",
    ];
    for (const row of board.rows) {
      const algorithmic = row.algorithmic[0];
      const bid = row.offers[0];
      const where = row.key === "household" ? "Household" : `${row.accountName} (${row.meta})`;
      const parts: string[] = [];
      if (algorithmic) {
        parts.push(
          `Algorithmic match: ${algorithmic.currentStrategy} → ${algorithmic.nextStrategy}, ${algorithmic.matchPct}% match. ${algorithmic.reason}`,
        );
      }
      if (bid) {
        parts.push(`Top offer: ${bid.bidder}, ${bid.title}, ${bid.terms}, ${bid.matchPct}% match.`);
      }
      if (parts.length > 0) lines.push(`${where}. ${parts.join(" ")}`);
    }
    lines.push("Ranks 2 and 3 stay on the Offers page until you ask to see the next matches or the next offers.");
    lines.push("The algorithmic ranking is ours. It cannot be bought.");
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
    const household = board.rows.find((row) => row.key === "household");
    const algorithmic = household?.algorithmic[0];
    if (algorithmic) {
      lines.push(
        `The algorithmic match for the household is ${algorithmic.title} (${algorithmic.matchPct}% match). ${algorithmic.reason}`,
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
