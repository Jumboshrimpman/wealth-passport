import { buildAllocationTree } from "./allocations";
import type { ClientPassport, ClientRecord } from "./types";

export function validateClientRecord(record: ClientRecord): void {
  const accountValue = record.accounts.reduce((sum, account) => sum + account.balance, 0);
  if (accountValue !== record.household.accountValue) {
    throw new Error(
      `CLIENT DATA FAILURE (${record.id}): accountValue sum ${accountValue} does not match household.accountValue ${record.household.accountValue}.`,
    );
  }
  if (record.household.investable !== record.household.accountValue + record.household.additionalInvestable) {
    throw new Error(`CLIENT DATA FAILURE (${record.id}): investable must equal listed accounts plus additional investable.`);
  }
  if (
    record.household.householdValue !==
    record.household.investable + record.household.realEstate + record.household.otherHousehold
  ) {
    throw new Error(
      `CLIENT DATA FAILURE (${record.id}): household value must equal investable + real estate + other household assets.`,
    );
  }
  const holdingSum = record.holdings.reduce((sum, row) => sum + row.value, 0);
  if (holdingSum !== accountValue) {
    throw new Error(`CLIENT DATA FAILURE (${record.id}): holdings do not sum to account value.`);
  }
  const reused = record.opsPacket.fields.filter((field) => field.reused).length;
  if (reused !== record.opsPacket.reused || record.opsPacket.fields.length !== record.opsPacket.total) {
    throw new Error(`CLIENT DATA FAILURE (${record.id}): ops packet reused/total counts do not match fields.`);
  }
}

export function assemblePassport(record: ClientRecord): ClientPassport {
  validateClientRecord(record);
  const accountValue = record.household.accountValue;
  const allocationTree = buildAllocationTree(record.accounts, accountValue, record.holdings);
  return {
    ...record,
    allocationTree,
    allocations: allocationTree.map((node) => ({
      label: node.label,
      pct: Math.round(node.pct * 10) / 10,
      tone: node.tone,
    })),
  };
}
