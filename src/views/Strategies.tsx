import { useMemo, useState } from "react";
import { formatUsd } from "../../shared/format.ts";
import {
  browseStrategies,
  ELIGIBLE_FILTER_LABEL,
  meetsStrategyMinimum,
  STRATEGY_UNIVERSE,
  strategyFeeLine,
} from "../../shared/strategies.ts";
import { useClient } from "../context/ClientContext";

/** Eligible-for-me starts off so the full universe is visible until the client narrows it. */
export function Strategies() {
  const { passport } = useClient();
  const investable = passport.household.investable;
  const [query, setQuery] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const rows = useMemo(
    () => browseStrategies(STRATEGY_UNIVERSE, investable, { query, eligibleOnly }),
    [eligibleOnly, investable, query],
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
                <p className="strategy-name">{strategy.name}</p>
                <p className="strategy-line">
                  {strategy.category} · {strategy.style}
                </p>
                <p className="strategy-line">{strategy.manager}</p>
                <p className="strategy-line">Minimum {formatUsd(strategy.minimum, true)}</p>
                {fee ? <p className="strategy-fee">{fee}</p> : null}
                <p className="strategy-summary">{strategy.summary}</p>
                <p className={qualifies ? "strategy-fit meets" : "strategy-fit above"}>
                  {qualifies ? "You meet the minimum" : "Above this household"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
