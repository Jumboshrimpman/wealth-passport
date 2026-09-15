/**
 * Local screening lists for the enrollment walkthrough. A production system calls
 * OFAC/EU/UN consolidated lists and commercial PEP / adverse-media vendors; the
 * walkthrough screens against these stored rows so hits are deterministic.
 *
 * Demo names:
 * - "Ivan Petrov"  → high-confidence OFAC SDN hit (auto-reject path)
 * - "Viktor Marek" → high-confidence EU consolidated hit (auto-reject path)
 * - "Maria Santos" → PEP database hit (EDD path)
 * - "Robert Kahn"  → adverse media hit (EDD path)
 * - a partial name like "Ivan" → low-confidence similarity (EDD path)
 */
export interface WatchlistEntry {
  name: string;
  list: string;
  note: string;
}

export const SANCTIONS_LIST: WatchlistEntry[] = [
  {
    name: "Ivan Petrov",
    list: "OFAC SDN",
    note: "Specially Designated National — blocking sanctions apply.",
  },
  {
    name: "Viktor Marek",
    list: "EU Consolidated",
    note: "Listed person on the EU consolidated sanctions list.",
  },
];

export const PEP_LIST: WatchlistEntry[] = [
  {
    name: "Maria Santos",
    list: "PEP database",
    note: "Former deputy finance minister; domestic PEP, exposure ended 2023.",
  },
];

export const ADVERSE_MEDIA_LIST: WatchlistEntry[] = [
  {
    name: "Robert Kahn",
    list: "Adverse media",
    note: "SEC enforcement action (settled 2024); fraud-keyword news cluster.",
  },
];

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Token-overlap confidence between two names. Exact matches score highest,
 * reordered token sets just below, strict subsets (partial names) land in the
 * low-confidence review band, and everything else falls back to Jaccard overlap.
 */
export function nameConfidence(candidate: string, listed: string): number {
  const a = normalizeName(candidate);
  const b = normalizeName(listed);
  if (!a || !b) return 0;
  if (a === b) return 0.99;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  const jaccard = overlap / union;
  if (overlap === aTokens.size && overlap === bTokens.size) return 0.98;
  const subset = [...bTokens].every((token) => aTokens.has(token)) ||
    [...aTokens].every((token) => bTokens.has(token));
  if (subset) return Math.max(jaccard, 0.6);
  return jaccard;
}
