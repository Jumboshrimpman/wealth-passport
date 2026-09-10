import type { Account, AllocationNode, AllocationSleeve, AssetClassId, SecurityHolding } from "./types";

export const ASSET_CLASS_META: Record<
  AssetClassId,
  { label: string; tone: "camel" | "sage" | "ink" | "clay" | "stone" }
> = {
  equity: { label: "Public equity", tone: "camel" },
  "fixed-income": { label: "Fixed income", tone: "sage" },
  private: { label: "Private markets", tone: "ink" },
  "real-assets": { label: "Real assets", tone: "clay" },
  cash: { label: "Cash & equivalents", tone: "stone" },
};

export const CLASS_ORDER: AssetClassId[] = [
  "equity",
  "fixed-income",
  "private",
  "real-assets",
  "cash",
];

export function assertHoldingsMatchAccounts(accountList: Account[], holdingList: SecurityHolding[]) {
  for (const account of accountList) {
    const sum = holdingList
      .filter((row) => row.accountId === account.id)
      .reduce((total, row) => total + row.value, 0);
    if (sum !== account.balance) {
      throw new Error(
        `CLIENT DATA FAILURE: holdings for ${account.id} sum to ${sum}, account balance is ${account.balance}.`,
      );
    }
  }
}

export function buildAllocationTree(
  accountList: Account[],
  bookValue: number,
  holdingList: SecurityHolding[],
): AllocationNode[] {
  assertHoldingsMatchAccounts(accountList, holdingList);
  const accountById = new Map(accountList.map((account) => [account.id, account]));

  return CLASS_ORDER.map((id) => {
    const meta = ASSET_CLASS_META[id];
    const classHoldings = holdingList.filter((row) => row.assetClass === id);
    const value = classHoldings.reduce((total, row) => total + row.value, 0);
    const accountIds = [...new Set(classHoldings.map((row) => row.accountId))];
    const sleeves: AllocationSleeve[] = accountIds.map((accountId) => {
      const account = accountById.get(accountId);
      if (!account) {
        throw new Error(`CLIENT DATA FAILURE: holding references unknown account "${accountId}".`);
      }
      const sleeveHoldings = classHoldings.filter((row) => row.accountId === accountId);
      const sleeveValue = sleeveHoldings.reduce((total, row) => total + row.value, 0);
      return {
        accountId,
        accountName: account.name,
        custodian: account.custodian,
        value: sleeveValue,
        weightOfClass: value === 0 ? 0 : sleeveValue / value,
        holdings: sleeveHoldings.map((row) => ({
          ...row,
          weightOfAccount: account.balance === 0 ? 0 : row.value / account.balance,
          weightOfBook: bookValue === 0 ? 0 : row.value / bookValue,
        })),
      };
    });

    return {
      id,
      label: meta.label,
      tone: meta.tone,
      value,
      pct: bookValue === 0 ? 0 : (value / bookValue) * 100,
      sleeves,
    };
  }).filter((node) => node.value > 0);
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
