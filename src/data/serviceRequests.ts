import { SERVICE_PRODUCTS, type ServiceProductId } from "./assistantFlow";

const STORAGE_KEY = "wealthpass-service-requests-v1";

export interface ServiceRequest {
  id: ServiceProductId;
  label: string;
  requestedAt: string;
}

type Book = Record<string, ServiceRequest[]>;

function emptyBook(): Book {
  return {};
}

function isRequest(value: unknown): value is ServiceRequest {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<ServiceRequest>;
  return (
    typeof row.id === "string" &&
    SERVICE_PRODUCTS.some((product) => product.id === row.id) &&
    typeof row.label === "string" &&
    typeof row.requestedAt === "string"
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
      if (!Array.isArray(rows)) continue;
      book[clientId] = rows.filter(isRequest);
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

export function readServiceRequests(clientId: string): ServiceRequest[] {
  return readBook()[clientId] ?? [];
}

/** Record a demo request. A second note for the same product stays the first one. */
export function recordServiceRequest(clientId: string, productId: ServiceProductId): { requests: ServiceRequest[]; already: boolean } {
  const product = SERVICE_PRODUCTS.find((item) => item.id === productId);
  if (!product) return { requests: readServiceRequests(clientId), already: false };
  const book = readBook();
  const current = book[clientId] ?? [];
  if (current.some((row) => row.id === productId)) {
    return { requests: current, already: true };
  }
  const next = [...current, { id: product.id, label: product.label, requestedAt: new Date().toISOString() }];
  book[clientId] = next;
  writeBook(book);
  return { requests: next, already: false };
}
