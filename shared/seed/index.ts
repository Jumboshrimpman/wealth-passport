import { assemblePassport } from "../assemble";
import type { ClientPassport, ClientRecord } from "../types";
import { elenaClient } from "./elena";
import { priyaClient } from "./priya";

export const DEFAULT_CLIENT_ID = "elena-whitmore";

export const CLIENT_SEEDS: ClientRecord[] = [elenaClient, priyaClient];

export const SEEDED_PASSPORTS: ClientPassport[] = CLIENT_SEEDS.map((record) => assemblePassport(record));

export function seedById(id: string): ClientRecord | undefined {
  return CLIENT_SEEDS.find((record) => record.id === id);
}

{
  const ids = CLIENT_SEEDS.map((record) => record.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("CLIENT DATA FAILURE: seed client ids must be unique.");
  }
}
