import { useMemo, useState } from "react";
import { formatUsd } from "../../shared/format.ts";
import { buildOfferBook, defaultFit, type Recommendation } from "../../shared/marketplace.ts";
import { useClient } from "../context/ClientContext";
import { useDemo } from "../context/DemoContext";
import { useOffers } from "../context/OfferContext";

export function Offers() {
  const { passport } = useClient();
  const { profile } = useDemo();
  const { eligible } = useOffers();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const fit = profile && profile.clientId === passport.id ? profile.fit : defaultFit(passport);
  const book = useMemo(() => buildOfferBook(passport, fit), [fit, passport]);

  return (
    <div className="offer-page">
      <h1>Offers</h1>
      <p className="lede-quiet">
        Only matches for {passport.household.clientFirstName}. One recommendation for each account,
        and one for the household. This ranking is proprietary. It cannot be bought.
      </p>

      {book.accounts.map((account) => {
        const [top, ...rest] = account.recommendations;
        return (
          <OfferBlock
            key={account.accountId}
            eyebrow={`${account.custodian} · ${account.accountName} · ${formatUsd(account.balance, true)}`}
            recommendation={top}
            more={rest}
            open={Boolean(open[account.accountId])}
            onToggle={() =>
              setOpen((current) => ({ ...current, [account.accountId]: !current[account.accountId] }))
            }
          />
        );
      })}

      <OfferBlock
        eyebrow="Household"
        recommendation={book.household[0]}
        more={book.household.slice(1)}
        open={Boolean(open.household)}
        onToggle={() => setOpen((current) => ({ ...current, household: !current.household }))}
      />

      {eligible.length > 0 ? (
        <section className="institution-offers">
          <h2>From institutions</h2>
          <p>
            Institutions can send an offer through WealthPass. That is what they pay for, because
            this market is price-sensitive. These offers do not buy the ranking and do not change it.
          </p>
          <ul>
            {eligible.map((match) => (
              <li key={match.institution.id}>
                <strong>{match.institution.offer.title}</strong>
                <span>
                  {match.institution.name} · {match.fitReason}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function OfferBlock({
  eyebrow,
  recommendation,
  more,
  open,
  onToggle,
}: {
  eyebrow: string;
  recommendation: Recommendation;
  more: Recommendation[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="offer-line">
      <p className="eyebrow">{eyebrow}</p>
      <div className="offer-head">
        <h2>{recommendation.title}</h2>
        <span>{recommendation.matchPct}% match</span>
      </div>
      <p>{recommendation.reason}</p>
      {more.length > 0 ? (
        <button type="button" className="text-button" onClick={onToggle}>
          {open ? "Less" : "More"}
        </button>
      ) : null}
      {open
        ? more.map((item) => (
            <div key={item.id} className="offer-more">
              <div className="offer-head">
                <h3>{item.title}</h3>
                <span>{item.matchPct}% match</span>
              </div>
              <p>{item.reason}</p>
            </div>
          ))
        : null}
    </section>
  );
}
