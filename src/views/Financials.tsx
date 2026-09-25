import { formatUsd } from "../../shared/format.ts";
import { describeWealth } from "../../shared/marketplace.ts";
import { useClient } from "../context/ClientContext";
import { useDemo } from "../context/DemoContext";

export function Financials() {
  const { passport } = useClient();
  const { profile } = useDemo();
  const active = profile && profile.clientId === passport.id ? profile : null;
  const picture = describeWealth(passport, active);
  const verifiedFlex = picture.verified > 0 ? picture.verified : 0;
  const pendingFlex = picture.pending > 0 ? picture.pending : 0;

  return (
    <div className="financials-page">
      <h1>Financials</h1>
      <p className="lede-quiet">
        {passport.household.clientFirstName}&rsquo;s wealth, {formatUsd(picture.total)} in all.
        Verified is solid. Still pending is gray.
      </p>
      <div
        className="wealth-bar"
        role="img"
        aria-label={`${formatUsd(picture.verified)} verified, ${formatUsd(picture.pending)} still pending`}
      >
        {verifiedFlex > 0 ? <span className="wealth-verified" style={{ flex: verifiedFlex }} /> : null}
        {pendingFlex > 0 ? <span className="wealth-pending" style={{ flex: pendingFlex }} /> : null}
      </div>
      <p className="wealth-legend">
        <span>
          <i className="swatch solid" aria-hidden="true" /> {formatUsd(picture.verified)} verified
        </span>
        <span>
          <i className="swatch gray" aria-hidden="true" /> {formatUsd(picture.pending)} still pending
        </span>
      </p>
      <ul className="wealth-points">
        {picture.points.map((point) => (
          <li key={point.id}>
            <div>
              <strong>{point.label}</strong>
              <span>{point.note}</span>
            </div>
            <span className={point.status}>{formatUsd(point.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
