/**
 * Simulated local discovery. This never reads a password manager, keychain,
 * or browser store. A real helper would run on the device. WealthPass cloud
 * does not receive credentials.
 */
export interface AgenticSource {
  id: string;
  label: string;
  found: boolean;
  detail: string;
}

const FOUND_DETAIL = "Simulated session on this device. Password not read. Not uploaded.";
const GAP_DETAIL = "Not found. Plaid can cover this gap.";

const CUSTODIANS: { id: string; label: string; match: RegExp }[] = [
  { id: "schwab", label: "Charles Schwab", match: /schwab/i },
  { id: "merrill", label: "Merrill Lynch", match: /merrill/i },
  { id: "morgan-stanley", label: "Morgan Stanley", match: /morgan stanley/i },
  { id: "fidelity", label: "Fidelity", match: /fidelity/i },
];

export function planAgenticCrawl(input: { custodians: readonly string[]; fundrise: number }): AgenticSource[] {
  const custodians = input.custodians.join(" \n ");
  const foundCustodians: AgenticSource[] = CUSTODIANS.map((source) => {
    const found = source.match.test(custodians);
    return { id: source.id, label: source.label, found, detail: found ? FOUND_DETAIL : GAP_DETAIL };
  });
  const fundriseFound = input.fundrise > 0;
  return [
    ...foundCustodians,
    {
      id: "fundrise",
      label: "Fundrise",
      found: fundriseFound,
      detail: fundriseFound ? FOUND_DETAIL : GAP_DETAIL,
    },
    { id: "coinbase", label: "Coinbase", found: false, detail: GAP_DETAIL },
    { id: "kalshi", label: "Kalshi", found: false, detail: GAP_DETAIL },
  ];
}

export function crawlGaps(sources: readonly AgenticSource[]): AgenticSource[] {
  return sources.filter((source) => !source.found);
}
