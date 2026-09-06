import type { Account } from "./mock";

export type AssetClassId = "equity" | "fixed-income" | "private" | "real-assets" | "cash";

export interface SecurityHolding {
  id: string;
  name: string;
  ticker: string;
  kind: string;
  accountId: string;
  assetClass: AssetClassId;
  value: number;
}

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

/** Illustrated securities. Values are fixtures and must sum to each account balance. */
export const holdings: SecurityHolding[] = [
  { id: "ml-aapl", accountId: "ml-pw", assetClass: "equity", ticker: "AAPL", name: "Apple Inc.", kind: "Common stock", value: 12_400_000 },
  { id: "ml-msft", accountId: "ml-pw", assetClass: "equity", ticker: "MSFT", name: "Microsoft Corp.", kind: "Common stock", value: 11_800_000 },
  { id: "ml-nvda", accountId: "ml-pw", assetClass: "equity", ticker: "NVDA", name: "NVIDIA Corp.", kind: "Common stock", value: 9_600_000 },
  { id: "ml-amzn", accountId: "ml-pw", assetClass: "equity", ticker: "AMZN", name: "Amazon.com Inc.", kind: "Common stock", value: 8_200_000 },
  { id: "ml-googl", accountId: "ml-pw", assetClass: "equity", ticker: "GOOGL", name: "Alphabet Inc. Class A", kind: "Common stock", value: 7_100_000 },
  { id: "ml-voo", accountId: "ml-pw", assetClass: "equity", ticker: "VOO", name: "Vanguard S&P 500 ETF", kind: "ETF", value: 10_200_000 },
  { id: "ml-ctmuni", accountId: "ml-pw", assetClass: "fixed-income", ticker: "CT GO", name: "Connecticut GO 5.00% 2034", kind: "Municipal bond", value: 8_200_000 },
  { id: "ml-munisma", accountId: "ml-pw", assetClass: "fixed-income", ticker: "MUNI SMA", name: "National + CT municipal SMA", kind: "SMA sleeve", value: 6_100_000 },
  { id: "ml-lqd", accountId: "ml-pw", assetClass: "fixed-income", ticker: "LQD", name: "Investment-grade corporate sleeve", kind: "ETF sleeve", value: 3_400_000 },
  { id: "ml-vnq", accountId: "ml-pw", assetClass: "real-assets", ticker: "VNQ", name: "Vanguard Real Estate ETF", kind: "ETF", value: 2_800_000 },
  { id: "ml-gld", accountId: "ml-pw", assetClass: "real-assets", ticker: "GLD", name: "SPDR Gold Shares", kind: "ETF", value: 2_100_000 },
  { id: "ml-peov", accountId: "ml-pw", assetClass: "private", ticker: "PE-CO", name: "PE co-invest overlay", kind: "Private interest", value: 1_800_000 },
  { id: "ml-sweep", accountId: "ml-pw", assetClass: "cash", ticker: "SWEEP", name: "Merrill cash sweep", kind: "Cash", value: 500_000 },

  { id: "fid-brkb", accountId: "fid-tax", assetClass: "equity", ticker: "BRK.B", name: "Berkshire Hathaway Class B", kind: "Common stock", value: 6_400_000 },
  { id: "fid-vti", accountId: "fid-tax", assetClass: "equity", ticker: "VTI", name: "Vanguard Total Stock Market", kind: "ETF", value: 5_100_000 },
  { id: "fid-vxus", accountId: "fid-tax", assetClass: "equity", ticker: "VXUS", name: "Vanguard Total International", kind: "ETF", value: 3_200_000 },
  { id: "fid-mub", accountId: "fid-tax", assetClass: "fixed-income", ticker: "MUB", name: "iShares National Muni Bond", kind: "ETF", value: 5_100_000 },
  { id: "fid-tlt", accountId: "fid-tax", assetClass: "fixed-income", ticker: "TLT", name: "iShares 20+ Year Treasury", kind: "ETF", value: 3_800_000 },
  { id: "fid-lqd", accountId: "fid-tax", assetClass: "fixed-income", ticker: "LQD", name: "iShares iBoxx IG Corporate", kind: "ETF", value: 3_200_000 },
  { id: "fid-iau", accountId: "fid-tax", assetClass: "real-assets", ticker: "IAU", name: "iShares Gold Trust", kind: "ETF", value: 1_600_000 },
  { id: "fid-vnqi", accountId: "fid-tax", assetClass: "real-assets", ticker: "VNQI", name: "Vanguard Global ex-US REIT", kind: "ETF", value: 1_200_000 },
  { id: "fid-spaxx", accountId: "fid-tax", assetClass: "cash", ticker: "SPAXX", name: "Fidelity Government Money Market", kind: "Money market", value: 1_800_000 },

  { id: "sch-swtsx", accountId: "schwab-ira", assetClass: "equity", ticker: "SWTSX", name: "Schwab Total Stock Market Index", kind: "Mutual fund", value: 8_400_000 },
  { id: "sch-swisx", accountId: "schwab-ira", assetClass: "equity", ticker: "SWISX", name: "Schwab International Index", kind: "Mutual fund", value: 3_200_000 },
  { id: "sch-swagx", accountId: "schwab-ira", assetClass: "fixed-income", ticker: "SWAGX", name: "Schwab US Aggregate Bond", kind: "Mutual fund", value: 7_200_000 },
  { id: "sch-vwitx", accountId: "schwab-ira", assetClass: "fixed-income", ticker: "VWITX", name: "Vanguard Intermediate-Term Tax-Exempt", kind: "Mutual fund", value: 3_400_000 },
  { id: "sch-vgslx", accountId: "schwab-ira", assetClass: "real-assets", ticker: "VGSLX", name: "Vanguard Real Estate Index", kind: "Mutual fund", value: 4_200_000 },
  { id: "sch-swvxx", accountId: "schwab-ira", assetClass: "cash", ticker: "SWVXX", name: "Schwab Government Money", kind: "Money market", value: 2_700_000 },

  { id: "oak-feeder", accountId: "oak-pe", assetClass: "private", ticker: "OAK-III", name: "Oakridge PE Feeder III", kind: "Private fund", value: 12_400_000 },
  { id: "oak-sec", accountId: "oak-pe", assetClass: "private", ticker: "OAK-S24", name: "Oakridge Secondaries 2024", kind: "Private fund", value: 6_200_000 },
  { id: "oak-spv", accountId: "oak-pe", assetClass: "private", ticker: "OAK-SPV", name: "Co-invest SPV (illustrated)", kind: "SPV interest", value: 3_200_000 },

  { id: "fa-tbill", accountId: "cash", assetClass: "cash", ticker: "T-BILL", name: "US Treasury bills 0–12m", kind: "Treasury", value: 8_200_000 },
  { id: "fa-op", accountId: "cash", assetClass: "cash", ticker: "CASH", name: "First Atlantic operating cash", kind: "Cash", value: 3_200_000 },
  { id: "fa-muni", accountId: "cash", assetClass: "fixed-income", ticker: "CT ST", name: "CT short municipal reserve", kind: "Municipal bond", value: 8_500_000 },
];

export interface AllocationSleeve {
  accountId: string;
  accountName: string;
  custodian: string;
  value: number;
  weightOfClass: number;
  holdings: Array<SecurityHolding & { weightOfAccount: number; weightOfBook: number }>;
}

export interface AllocationNode {
  id: AssetClassId;
  label: string;
  tone: "camel" | "sage" | "ink" | "clay" | "stone";
  value: number;
  pct: number;
  sleeves: AllocationSleeve[];
}

export function assertHoldingsMatchAccounts(accountList: Account[]) {
  for (const account of accountList) {
    const sum = holdings
      .filter((row) => row.accountId === account.id)
      .reduce((total, row) => total + row.value, 0);
    if (sum !== account.balance) {
      throw new Error(
        `MOCK DATA FAILURE: holdings for ${account.id} sum to ${sum}, account balance is ${account.balance}.`,
      );
    }
  }
}

export function buildAllocationTree(accountList: Account[], bookValue: number): AllocationNode[] {
  assertHoldingsMatchAccounts(accountList);
  const accountById = new Map(accountList.map((account) => [account.id, account]));

  return CLASS_ORDER.map((id) => {
    const meta = ASSET_CLASS_META[id];
    const classHoldings = holdings.filter((row) => row.assetClass === id);
    const value = classHoldings.reduce((total, row) => total + row.value, 0);
    const accountIds = [...new Set(classHoldings.map((row) => row.accountId))];
    const sleeves: AllocationSleeve[] = accountIds.map((accountId) => {
      const account = accountById.get(accountId);
      if (!account) {
        throw new Error(`MOCK DATA FAILURE: holding references unknown account "${accountId}".`);
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
  });
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
