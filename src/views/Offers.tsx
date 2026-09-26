import { useMemo } from "react";
import { formatUsd } from "../../shared/format.ts";
import {
  buildOfferBook,
  defaultFit,
  selectClientOffers,
  type Recommendation,
  type SurfacedOffer,
} from "../../shared/marketplace.ts";
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

interface OfferTableRow {
  key: string;
  name: string;
  meta: string;
  strategies: Recommendation[];
  institutionTitles: string[];
  sortScore: number;
}

export function Offers() {
  const { passport } = useClient();
  const { profile } = useDemo();
  const { eligible } = useOffers();
  const fit = profile && profile.clientId === passport.id ? profile.fit : defaultFit(passport);
  const book = useMemo(() => buildOfferBook(passport, fit), [fit, passport]);
  const selected = useMemo(
    () =>
      selectClientOffers(
        book,
        eligible.map((match) => ({
          id: match.institution.id,
          title: match.institution.offer.title,
          rank: match.institution.offer.rank,
        })),
      ),
    [book, eligible],
  );
  const rows = useMemo(
    () => offerRows(passport, book, selected, eligible),
    [book, eligible, passport, selected],
  );

  return (
    <div className="offer-page">
      <h1>Offers</h1>
      <p className="lede-quiet">
        The strongest offers for {passport.household.clientFirstName}, at most three. Match and
        institution offers sit on the same line. This ranking is proprietary. It cannot be bought.
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
            {rows.map((row) => (
              <OfferRow
                key={row.key}
                name={row.name}
                meta={row.meta}
                strategies={row.strategies}
                offers={row.institutionTitles}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function offerRows(
  passport: ClientPassport,
  book: ReturnType<typeof buildOfferBook>,
  selected: SurfacedOffer[],
  eligible: OfferMatch[],
): OfferTableRow[] {
  const byKey = new Map<string, OfferTableRow>();

  function ensure(key: string): OfferTableRow {
    const existing = byKey.get(key);
    if (existing) return existing;
    if (key === "household") {
      const row: OfferTableRow = {
        key,
        name: "Household",
        meta: "Counted together at one bank",
        strategies: [],
        institutionTitles: [],
        sortScore: 0,
      };
      byKey.set(key, row);
      return row;
    }
    const account = book.accounts.find((item) => item.accountId === key);
    const row: OfferTableRow = {
      key,
      name: account?.accountName ?? "Account",
      meta: account ? `${account.custodian} · ${formatUsd(account.balance, true)}` : "",
      strategies: [],
      institutionTitles: [],
      sortScore: 0,
    };
    byKey.set(key, row);
    return row;
  }

  for (const offer of selected) {
    if (offer.kind !== "strategy") continue;
    const row = ensure(offer.accountId ?? "household");
    row.strategies.push(offer.recommendation);
    row.sortScore = Math.max(row.sortScore, offer.score);
  }

  for (const offer of selected) {
    if (offer.kind !== "institution") continue;
    const match = eligible.find((item) => item.institution.id === offer.institutionId);
    const row = ensure(match ? offerRowKey(passport, match) : "household");
    row.institutionTitles.push(offer.title);
    row.sortScore = Math.max(row.sortScore, offer.score);
  }

  return [...byKey.values()].sort((a, b) => b.sortScore - a.sortScore || a.name.localeCompare(b.name));
}

function OfferRow({
  name,
  meta,
  strategies,
  offers,
}: {
  name: string;
  meta: string;
  strategies: Recommendation[];
  offers: string[];
}) {
  const offerText = offers.join(" · ");
  const lead = strategies[0];
  return (
    <tr>
      <th scope="row">
        <span className="offer-account">{name}</span>
        <span className="offer-meta">{meta}</span>
      </th>
      <td>
        {strategies.map((recommendation, index) => (
          <div key={recommendation.id} className="strategy-block">
            {index > 0 ? <p className="strategy-more">More</p> : null}
            <p className="strategy-shift">
              <span className="strategy-now">{recommendation.currentStrategy}</span>
              <span className="strategy-arrow" aria-hidden="true">
                →
              </span>
              <span className="strategy-next">{recommendation.nextStrategy}</span>
            </p>
            <p className="strategy-reason">{recommendation.reason}</p>
          </div>
        ))}
      </td>
      <td>
        <p className="match-line">
          {lead ? (
            <span className="match-pct" style={{ color: matchColor(lead.matchPct) }}>
              {lead.matchPct}% match
            </span>
          ) : null}
          <span className="offer-names">{offerText}</span>
        </p>
      </td>
    </tr>
  );
}
