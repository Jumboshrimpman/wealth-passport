import { useMemo, useState } from "react";
import { formatUsd } from "../../shared/format.ts";
import {
  browseStrategies,
  ELIGIBLE_FILTER_LABEL,
  ESG_FILTER_LABEL,
  meetsStrategyMinimum,
  strategyCategories,
  strategyFeeLine,
  STRATEGY_UNIVERSE,
  type StrategyProfile,
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
}: {
  investable: number | null;
  added?: readonly StrategyProfile[];
  yours?: ReadonlySet<string>;
  /** Page title. Institutional Search sits under its own Strategies heading. */
  heading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [esgOnly, setEsgOnly] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [selected, setSelected] = useState<StrategyProfile | null>(null);
  const universe = useMemo(() => [...added, ...STRATEGY_UNIVERSE], [added]);
  const categories = useMemo(() => strategyCategories(universe), [universe]);
  const rows = useMemo(
    () =>
      browseStrategies(universe, investable ?? 0, {
        query,
        category: category || undefined,
        esgOnly,
        eligibleOnly: investable != null && eligibleOnly,
      }),
    [category, eligibleOnly, esgOnly, investable, query, universe],
  );

  return (
    <div className="strategies-page">
      {heading ? <h1>Strategies</h1> : null}
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
          <label className="strategy-filter">
            <span className="sr-only">Asset class</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All asset classes</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
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
                    {strategy.minimum != null ? `Minimum ${formatUsd(strategy.minimum, true)}` : "Minimum not listed"}
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
