import { useMemo, useState, type ReactNode } from "react";
import { formatUsd } from "../../shared/format.ts";
import {
  ADR_OPTIONS,
  BENCHMARK_KIND_OPTIONS,
  browseStrategies,
  CATALOG_SOURCE_NOTE,
  COUPON_BAND_OPTIONS,
  DURATION_BAND_OPTIONS,
  ELIGIBLE_FILTER_LABEL,
  ESG_FILTER_LABEL,
  FEE_RANGE_OPTIONS,
  FUND_FEE_OPTIONS,
  HOUSEHOLD_MINIMUM_BAND_OPTIONS,
  MATURITY_BAND_OPTIONS,
  meetsStrategyMinimum,
  MINIMUM_BAND_OPTIONS,
  SECURITIES_BAND_OPTIONS,
  strategyBenchmarks,
  strategyCategories,
  strategyFeeLine,
  strategyManagers,
  strategyRisks,
  STRATEGY_UNIVERSE,
  TAX_FILTER_OPTIONS,
  TURNOVER_BAND_OPTIONS,
  YIELD_BAND_OPTIONS,
  type AdrFilterId,
  type BenchmarkKindFilterId,
  type FeeRangeId,
  type FundFeeFilterId,
  type HouseholdMinimumBandId,
  type MinimumBandId,
  type StrategyProfile,
  type TaxFilterId,
} from "../../shared/strategies.ts";
import { detailFromProfile } from "../../shared/strategyDetail.ts";
import { StrategyDetailModal } from "./StrategyDetailModal";

/**
 * One strategy catalog for Client and Institutional.
 * Eligible-for-me appears only when the viewer has a household investable figure.
 */
export function StrategiesCatalog({
  investable,
  added = [],
  yours,
  heading = true,
  pinned = null,
}: {
  investable: number | null;
  added?: readonly StrategyProfile[];
  yours?: ReadonlySet<string>;
  /** Page title. Institutional Search sits under its own Strategies heading. */
  heading?: boolean;
  /** Client enrollments, pinned above the universe. */
  pinned?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [risk, setRisk] = useState("");
  const [feeRange, setFeeRange] = useState<FeeRangeId>("");
  const [minimumBand, setMinimumBand] = useState<MinimumBandId>("");
  const [esgOnly, setEsgOnly] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [more, setMore] = useState(false);
  const [householdMinimumBand, setHouseholdMinimumBand] = useState<HouseholdMinimumBandId>("");
  const [manager, setManager] = useState("");
  const [adr, setAdr] = useState<AdrFilterId>("");
  const [maturityBand, setMaturityBand] = useState("");
  const [durationBand, setDurationBand] = useState("");
  const [couponBand, setCouponBand] = useState("");
  const [yieldBand, setYieldBand] = useState("");
  const [turnoverBand, setTurnoverBand] = useState("");
  const [securitiesBand, setSecuritiesBand] = useState("");
  const [benchmarkKind, setBenchmarkKind] = useState<BenchmarkKindFilterId>("");
  const [benchmark, setBenchmark] = useState("");
  const [fundFees, setFundFees] = useState<FundFeeFilterId>("");
  const [taxPosture, setTaxPosture] = useState<TaxFilterId>("");
  const [selected, setSelected] = useState<StrategyProfile | null>(null);
  const universe = useMemo(() => [...added, ...STRATEGY_UNIVERSE], [added]);
  const categories = useMemo(() => strategyCategories(universe), [universe]);
  const risks = useMemo(() => strategyRisks(universe), [universe]);
  const managers = useMemo(() => strategyManagers(universe), [universe]);
  const benchmarks = useMemo(() => strategyBenchmarks(universe), [universe]);
  const rows = useMemo(
    () =>
      browseStrategies(universe, investable ?? 0, {
        query,
        category: category || undefined,
        risk: risk || undefined,
        feeRange,
        minimumBand,
        householdMinimumBand,
        manager: manager || undefined,
        adr,
        maturityBand,
        durationBand,
        couponBand,
        yieldBand,
        turnoverBand,
        securitiesBand,
        benchmarkKind,
        benchmark: benchmark || undefined,
        fundFees,
        taxPosture,
        esgOnly,
        eligibleOnly: investable != null && eligibleOnly,
      }),
    [
      adr,
      benchmark,
      benchmarkKind,
      category,
      couponBand,
      durationBand,
      eligibleOnly,
      esgOnly,
      feeRange,
      fundFees,
      householdMinimumBand,
      investable,
      manager,
      maturityBand,
      minimumBand,
      query,
      risk,
      securitiesBand,
      taxPosture,
      turnoverBand,
      universe,
      yieldBand,
    ],
  );

  return (
    <div className="strategies-page">
      {heading ? <h1>Strategies</h1> : null}
      {pinned}
      <p className="lede-quiet">
        Search the universe of investment strategies. The assistant stays beside this list if you want to ask about one.
      </p>
      <div className="strategy-tools">
        <label className="strategy-search">
          <span className="sr-only">Search strategies</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, style, or manager"
          />
        </label>
        <div className="strategy-filters">
          <div className="strategy-filter-row">
            <label className="strategy-filter">
              <span>Asset class</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All asset classes</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="strategy-filter">
              <span>Fee</span>
              <select value={feeRange} onChange={(event) => setFeeRange(event.target.value as FeeRangeId)}>
                {FEE_RANGE_OPTIONS.map((option) => (
                  <option key={option.id || "any-fee"} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="strategy-filter">
              <span>Risk</span>
              <select value={risk} onChange={(event) => setRisk(event.target.value)}>
                <option value="">All risks</option>
                {risks.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="strategy-filter">
              <span>Strategy minimum</span>
              <select
                value={minimumBand}
                onChange={(event) => setMinimumBand(event.target.value as MinimumBandId)}
              >
                {MINIMUM_BAND_OPTIONS.map((option) => (
                  <option key={option.id || "any-min"} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="strategy-more" aria-expanded={more} onClick={() => setMore((open) => !open)}>
            {more ? "Fewer filters" : "More filters"}
          </button>
          {more ? (
            <div className="strategy-filter-row">
              <FilterSelect
                label="Household minimum"
                value={householdMinimumBand}
                options={HOUSEHOLD_MINIMUM_BAND_OPTIONS}
                onChange={(value) => setHouseholdMinimumBand(value as HouseholdMinimumBandId)}
              />
              <FilterSelect
                label="Asset manager"
                value={manager}
                options={[{ id: "", label: "Any asset manager" }, ...managers.map((name) => ({ id: name, label: name }))]}
                onChange={setManager}
              />
              <FilterSelect label="ADRs" value={adr} options={ADR_OPTIONS} onChange={(value) => setAdr(value as AdrFilterId)} />
              <FilterSelect label="Avg maturity" value={maturityBand} options={MATURITY_BAND_OPTIONS} onChange={setMaturityBand} />
              <FilterSelect label="Avg duration" value={durationBand} options={DURATION_BAND_OPTIONS} onChange={setDurationBand} />
              <FilterSelect label="Avg coupon" value={couponBand} options={COUPON_BAND_OPTIONS} onChange={setCouponBand} />
              <FilterSelect label="Avg yield" value={yieldBand} options={YIELD_BAND_OPTIONS} onChange={setYieldBand} />
              <FilterSelect label="Turnover" value={turnoverBand} options={TURNOVER_BAND_OPTIONS} onChange={setTurnoverBand} />
              <FilterSelect
                label="Securities"
                value={securitiesBand}
                options={SECURITIES_BAND_OPTIONS}
                onChange={setSecuritiesBand}
              />
              <FilterSelect
                label="Benchmark"
                value={benchmarkKind}
                options={BENCHMARK_KIND_OPTIONS}
                onChange={(value) => setBenchmarkKind(value as BenchmarkKindFilterId)}
              />
              <FilterSelect
                label="Benchmark name"
                value={benchmark}
                options={[{ id: "", label: "Any named benchmark" }, ...benchmarks.map((name) => ({ id: name, label: name }))]}
                onChange={setBenchmark}
              />
              <FilterSelect
                label="Underlying fees"
                value={fundFees}
                options={FUND_FEE_OPTIONS}
                onChange={(value) => setFundFees(value as FundFeeFilterId)}
              />
              <FilterSelect
                label="Tax posture"
                value={taxPosture}
                options={TAX_FILTER_OPTIONS}
                onChange={(value) => setTaxPosture(value as TaxFilterId)}
              />
            </div>
          ) : null}
          <p className="strategy-filter-note">
            Fee bands use all-in basis points. Public catalog fees are illustrative. {CATALOG_SOURCE_NOTE}
          </p>
          <label className="strategy-eligible">
            <input type="checkbox" checked={esgOnly} onChange={(event) => setEsgOnly(event.target.checked)} />
            <span>
              <span className="strategy-eligible-label">{ESG_FILTER_LABEL}</span>
              <span className="strategy-eligible-help">
                Strategies tagged for environmental, social, or values alignment.
              </span>
            </span>
          </label>
          {investable != null ? (
            <label className="strategy-eligible">
              <input
                type="checkbox"
                checked={eligibleOnly}
                onChange={(event) => setEligibleOnly(event.target.checked)}
              />
              <span>
                <span className="strategy-eligible-label">{ELIGIBLE_FILTER_LABEL}</span>
                <span className="strategy-eligible-help">
                  Household investable is {formatUsd(investable, true)}. This keeps strategies whose minimum is at or
                  under that.
                </span>
              </span>
            </label>
          ) : null}
        </div>
      </div>
      <p className="strategy-count">
        {rows.length} {rows.length === 1 ? "strategy" : "strategies"}
      </p>
      {rows.length === 0 ? (
        <p className="lede-quiet">Nothing matches.</p>
      ) : (
        <ul className="strategy-list">
          {rows.map((strategy) => {
            const fee = strategyFeeLine(strategy);
            const qualifies = investable != null && meetsStrategyMinimum(strategy, investable);
            return (
              <li key={strategy.id}>
                <button type="button" className="strategy-row" aria-haspopup="dialog" onClick={() => setSelected(strategy)}>
                  <span className="strategy-name">
                    {strategy.name}
                    {yours?.has(strategy.id) ? <span className="strategy-yours">Yours</span> : null}
                  </span>
                  {strategy.esg ? <span className="strategy-esg">ESG</span> : null}
                  <span className="strategy-line">
                    {strategy.category} · {strategy.style} · {strategy.risk}
                  </span>
                  <span className="strategy-line">{strategy.manager}</span>
                  <span className="strategy-line">
                    {strategy.minimum != null ? `Strategy minimum ${formatUsd(strategy.minimum, true)}` : "Strategy minimum not listed"}
                  </span>
                  {fee ? <span className="strategy-fee">{fee}</span> : null}
                  <span className="strategy-summary">{strategy.summary}</span>
                  {investable != null ? (
                    <span className={qualifies ? "strategy-fit meets" : "strategy-fit above"}>
                      {strategy.minimum == null
                        ? "Minimum not listed"
                        : qualifies
                          ? "You meet the minimum"
                          : "Above this household"}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected ? (
        <StrategyDetailModal
          detail={detailFromProfile(selected, investable)}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="strategy-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id || `any-${label}`} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
