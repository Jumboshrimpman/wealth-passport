import { useMemo, useState } from "react";
import { formatUsd } from "../../shared/format.ts";
import {
  browseStrategies,
  ELIGIBLE_FILTER_LABEL,
  ESG_FILTER_LABEL,
  meetsStrategyMinimum,
  STRATEGY_UNIVERSE,
  strategyFeeLine,
  type StrategyProfile,
} from "../../shared/strategies.ts";
import { detailFromProfile } from "../../shared/strategyDetail.ts";
import { StrategyDetailModal } from "../components/StrategyDetailModal";
import { useClient } from "../context/ClientContext";

/** Eligible-for-me starts off so the full universe is visible until the client narrows it. */
export function Strategies() {
  const { passport } = useClient();
  const investable = passport.household.investable;
  const [query, setQuery] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [esgOnly, setEsgOnly] = useState(false);
  const [selected, setSelected] = useState<StrategyProfile | null>(null);
  const rows = useMemo(
    () => browseStrategies(STRATEGY_UNIVERSE, investable, { query, eligibleOnly, esgOnly }),
    [eligibleOnly, esgOnly, investable, query],
  );

  return (
    <div className="strategies-page">
      <h1>Strategies</h1>
      <p className="lede-quiet">
        Search the universe of investment strategies. The assistant stays beside this list if you
        want to ask about one.
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
          <label className="strategy-eligible">
            <input
              type="checkbox"
              checked={eligibleOnly}
              onChange={(event) => setEligibleOnly(event.target.checked)}
            />
            <span>
              <span className="strategy-eligible-label">{ELIGIBLE_FILTER_LABEL}</span>
              <span className="strategy-eligible-help">
                Household investable is {formatUsd(investable, true)}. This keeps strategies whose
                minimum is at or under that.
              </span>
            </span>
          </label>
          <label className="strategy-eligible">
            <input
              type="checkbox"
              checked={esgOnly}
              onChange={(event) => setEsgOnly(event.target.checked)}
            />
            <span>
              <span className="strategy-eligible-label">{ESG_FILTER_LABEL}</span>
              <span className="strategy-eligible-help">
                Strategies tagged for environmental, social, or values alignment.
              </span>
            </span>
          </label>
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
            const qualifies = meetsStrategyMinimum(strategy, investable);
            const fee = strategyFeeLine(strategy);
            return (
              <li key={strategy.id}>
                <button type="button" className="strategy-row" aria-haspopup="dialog" onClick={() => setSelected(strategy)}>
                  <span className="strategy-name">{strategy.name}</span>
                  {strategy.esg ? <span className="strategy-esg">ESG</span> : null}
                  <span className="strategy-line">
                    {strategy.category} · {strategy.style}
                  </span>
                  <span className="strategy-line">{strategy.manager}</span>
                  <span className="strategy-line">Minimum {formatUsd(strategy.minimum, true)}</span>
                  {fee ? <span className="strategy-fee">{fee}</span> : null}
                  <span className="strategy-summary">{strategy.summary}</span>
                  <span className={qualifies ? "strategy-fit meets" : "strategy-fit above"}>
                    {qualifies ? "You meet the minimum" : "Above this household"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected ? (
        <StrategyDetailModal detail={detailFromProfile(selected, investable)} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
