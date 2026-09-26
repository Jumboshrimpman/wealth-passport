import { useMemo } from "react";
import { formatUsd } from "../../shared/format.ts";
import { buildOfferBook, defaultFit, type Recommendation } from "../../shared/marketplace.ts";
import type { OfferMatch } from "../../shared/match.ts";
import type { ClientPassport } from "../../shared/types.ts";
import { useClient } from "../context/ClientContext";
import { useDemo } from "../context/DemoContext";
import { useOffers } from "../context/OfferContext";

/** Darker green is a higher match. Every step stays readable on white. */
function matchColor(pct: number): string {
  if (pct >= 95) return "#0b4f2a";
  if (pct >= 92) return "#115c34";
  if (pct >= 88) return "#17683d";
  if (pct >= 84) return "#1e7546";
  if (pct >= 78) return "#26824f";
  return "#34864e";
}

function fixedIncome(passport: ClientPassport, accountId: string): number {
  return passport.holdings
    .filter((holding) => holding.accountId === accountId && holding.assetClass === "fixed-income")
    .reduce((sum, holding) => sum + holding.value, 0);
}

function offerRowKey(passport: ClientPassport, match: OfferMatch): string {
  if (match.institution.id === "oakridge") {
    const host = passport.accounts
      .filter((account) => account.sleeve === "private")
      .sort((a, b) => b.balance - a.balance)[0];
    return host?.id ?? "household";
  }
  if (match.institution.id === "meridian") {
    const host = passport.accounts
      .filter((account) => account.sleeve === "taxable")
      .sort((a, b) => fixedIncome(passport, b.id) - fixedIncome(passport, a.id))[0];
    if (host && fixedIncome(passport, host.id) > 0) return host.id;
    return "household";
  }
  return "household";
}

export function Offers() {
  const { passport } = useClient();
  const { profile } = useDemo();
  const { eligible } = useOffers();
  const fit = profile && profile.clientId === passport.id ? profile.fit : defaultFit(passport);
  const book = useMemo(() => buildOfferBook(passport, fit), [fit, passport]);
  const offersByRow = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const match of eligible) {
      const key = offerRowKey(passport, match);
      const titles = grouped.get(key) ?? [];
      titles.push(match.institution.offer.title);
      grouped.set(key, titles);
    }
    return grouped;
  }, [eligible, passport]);

  return (
    <div className="offer-page">
      <h1>Offers</h1>
      <p className="lede-quiet">
        A new strategy for each account {passport.household.clientFirstName} already holds, and one
        for the household. Match and institution offers sit on the same line. This ranking is
        proprietary. It cannot be bought.
      </p>
      <div className="offers-scroll">
        <table className="offers-table">
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">Strategy</th>
              <th scope="col">Match and offers</th>
            </tr>
          </thead>
          <tbody>
            {book.accounts.map((account) => (
              <OfferRow
                key={account.accountId}
                name={account.accountName}
                meta={`${account.custodian} · ${formatUsd(account.balance, true)}`}
                recommendation={account.recommendations[0]}
                offers={offersByRow.get(account.accountId) ?? []}
              />
            ))}
            <OfferRow
              name="Household"
              meta="Counted together at one bank"
              recommendation={book.household[0]}
              offers={offersByRow.get("household") ?? []}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferRow({
  name,
  meta,
  recommendation,
  offers,
}: {
  name: string;
  meta: string;
  recommendation: Recommendation;
  offers: string[];
}) {
  const offerText = offers.join(" · ");
  return (
    <tr>
      <th scope="row">
        <span className="offer-account">{name}</span>
        <span className="offer-meta">{meta}</span>
      </th>
      <td>
        <p className="strategy-shift">
          <span className="strategy-now">{recommendation.currentStrategy}</span>
          <span className="strategy-arrow" aria-hidden="true">
            →
          </span>
          <span className="strategy-next">{recommendation.nextStrategy}</span>
        </p>
        <p className="strategy-reason">{recommendation.reason}</p>
      </td>
      <td>
        <p className="match-line">
          <span className="match-pct" style={{ color: matchColor(recommendation.matchPct) }}>
            {recommendation.matchPct}% match
          </span>
          <span className="offer-names">{offerText}</span>
        </p>
      </td>
    </tr>
  );
}
