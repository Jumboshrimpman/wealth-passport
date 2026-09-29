/**
 * Demo documents already on file for a wealth segment.
 * A segment gets a statement, and a verified one may also have a confirmation.
 * Unconnected leftovers stay empty so the row is not a document list.
 */

export interface SegmentDocument {
  id: string;
  label: string;
}

const UNFILED =
  /not connected|nothing else declared|not on a connection|not reflected|still outside/i;

export function documentsForSegment(point: {
  id: string;
  status: "verified" | "pending";
  note: string;
}): SegmentDocument[] {
  if (point.id === "irs") {
    if (!/connected in this demo/i.test(point.note)) return [];
    return [{ id: "irs-transcript", label: "Transcript request" }];
  }
  if (point.id === "rest" || point.id === "other" || point.id === "unpulled") return [];
  if (point.status !== "verified" && UNFILED.test(point.note)) return [];
  const documents: SegmentDocument[] = [{ id: `${point.id}-statement`, label: "Statement" }];
  if (point.status === "verified") {
    documents.push({ id: `${point.id}-confirmation`, label: "Confirmation" });
  }
  return documents;
}

export function segmentDocumentLine(label: string): string {
  return `${label} on file. Demo only. Nothing is stored.`;
}
