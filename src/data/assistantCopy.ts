import { formatUsd } from "../../shared/format.ts";
import { greetingLine, type OfferBoard, type WealthPicture } from "../../shared/marketplace.ts";
import { browseStrategies, STRATEGY_UNIVERSE, strategyFeeLine } from "../../shared/strategies.ts";
import type { ClientPassport } from "../../shared/types.ts";

export const STARTER_PROMPTS = [
  { id: "offers", label: "What are my new pitches?" },
  { id: "strategies", label: "Which strategies do I qualify for?" },
  { id: "accounts", label: "How are my accounts set up?" },
  { id: "financials", label: "What's verified on my financials?" },
  { id: "household", label: "How does this household look?" },
] as const;

function intentOf(input: string): "offers" | "strategies" | "accounts" | "financials" | "household" | "general" {
  const text = input.toLowerCase();
  if (/(pitch|offer|recommend|match|cheaper|sunset|algorithm)/.test(text)) return "offers";
  if (/(strateg|eligib|qualif|universe|minimum)/.test(text)) return "strategies";
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
      "Algorithmic match is WealthPass’s ranking of basic managed strategies: the proposed strategy and its all-in fee. Pitches are customized strategy pitches, a manager’s customizable solution at a unique price. Each list opens on the top result.",
    ];
    for (const row of board.rows) {
      const algorithmic = row.algorithmic[0];
      const bid = row.offers[0];
      const where = row.key === "household" ? "Household" : `${row.accountName} (${row.meta})`;
      const parts: string[] = [];
      if (algorithmic) {
        parts.push(
          `Basic managed strategy: proposed ${algorithmic.nextStrategy} (currently ${algorithmic.currentStrategy}), all-in ${algorithmic.allInBps} bps, ${algorithmic.matchPct}% match. ${algorithmic.reason}`,
        );
      }
      if (bid) {
        parts.push(
          `Customized strategy pitch: ${bid.bidder}, ${bid.title}. Customizable solution: ${bid.customization} Unique pricing: ${bid.terms}. ${bid.matchPct}% match.`,
        );
      }
      if (parts.length > 0) lines.push(`${where}. ${parts.join(" ")}`);
    }
    lines.push("Ranks 2 and 3 stay hidden until you choose Show next 2. Show less closes them again.");
    lines.push("The algorithmic ranking is ours. It cannot be bought.");
    return lines.join("\n\n");
  }

  if (intent === "strategies") {
    const investable = client.household.investable;
    const eligible = browseStrategies(STRATEGY_UNIVERSE, investable, { eligibleOnly: true });
    const shown = eligible.slice(0, 6);
    const lines = [
      `${first}, household investable is ${formatUsd(investable, true)}. Eligible for me keeps strategies whose minimum is at or under that. The filter starts off, so Strategies shows the full universe until you turn it on.`,
      ...shown.map(
        (strategy) =>
          `${strategy.name} · ${strategy.manager} · ${strategy.category}, ${strategy.style} · minimum ${formatUsd(strategy.minimum, true)} · ${strategyFeeLine(strategy)}. ${strategy.summary}`,
      ),
    ];
    if (eligible.length > shown.length) {
      lines.push(
        `${eligible.length - shown.length} more also meet this household minimum. Search Strategies for the rest, including ones above it.`,
      );
    }
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
        `The algorithmic match for the household proposes ${algorithmic.nextStrategy} (currently ${algorithmic.currentStrategy}) at all-in ${algorithmic.allInBps} bps (${algorithmic.matchPct}% match). ${algorithmic.reason}`,
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
    `Ask about strategies, pitches, accounts, financials, or the household. For example: which strategies do I qualify for.`,
  ].join("\n\n");
}
