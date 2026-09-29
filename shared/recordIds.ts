/**
 * Stable demo IDs for the admin desk.
 * Client and household codes are separate. They are not seed slugs and must
 * not be rendered on the client or institutional desks.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function code(seed: string, length = 5): string {
  let n = hash(seed);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[n % ALPHABET.length];
    n = hash(`${seed}:${i}:${n}`);
  }
  return out;
}

export interface RecordIds {
  clientId: string;
  householdId: string;
}

/** Same passport always yields the same pair. The two codes never match. */
export function recordIds(passportId: string): RecordIds {
  return {
    clientId: `CL-${code(`client:${passportId}`)}`,
    householdId: `HH-${code(`household:${passportId}`)}`,
  };
}
