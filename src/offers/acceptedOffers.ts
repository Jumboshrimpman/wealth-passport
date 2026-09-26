import type { RowAcceptance } from "../../shared/acceptOffer.ts";

const STORAGE_KEY = "wealthpass-row-accepts-v1";

type Book = Record<string, Record<string, RowAcceptance>>;

function emptyBook(): Book {
  return {};
}

function isAcceptance(value: unknown): value is RowAcceptance {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<RowAcceptance>;
  return (
    typeof row.choiceId === "string" &&
    typeof row.party === "string" &&
    typeof row.strategy === "string" &&
    typeof row.accountName === "string" &&
    typeof row.confirmation === "string" &&
    (row.allInBps == null || typeof row.allInBps === "number") &&
    (row.rateLabel == null || typeof row.rateLabel === "string")
  );
}

function readBook(): Book {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBook();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyBook();
    const book: Book = {};
    for (const [clientId, rows] of Object.entries(parsed as Record<string, unknown>)) {
      if (!rows || typeof rows !== "object" || Array.isArray(rows)) continue;
      const next: Record<string, RowAcceptance> = {};
      for (const [rowKey, value] of Object.entries(rows as Record<string, unknown>)) {
        if (isAcceptance(value)) next[rowKey] = value;
      }
      book[clientId] = next;
    }
    return book;
  } catch {
    return emptyBook();
  }
}

function writeBook(book: Book) {
  try {
    const value = JSON.stringify(book);
    localStorage.setItem(STORAGE_KEY, value);
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The in-memory copy still applies for this tab.
  }
}

export function readAcceptedOffers(clientId: string): Record<string, RowAcceptance> {
  return readBook()[clientId] ?? {};
}

export function writeAcceptedOffers(clientId: string, rows: Record<string, RowAcceptance>) {
  const book = readBook();
  book[clientId] = rows;
  writeBook(book);
}
