import { useState } from "react";
import { clientAgreementLines, schwabLpoaLines, type AcceptableChoice } from "../../shared/acceptOffer.ts";

/** The pitches accept dialog. Chat enroll opens this same signature. */
export function ClientAgreementModal({
  choice,
  onCancel,
  onSign,
}: {
  choice: AcceptableChoice;
  onCancel: () => void;
  onSign: () => void;
}) {
  const [agreement, setAgreement] = useState(false);
  const [lpoa, setLpoa] = useState(false);
  const ready = agreement && lpoa;
  return (
    <div className="accept-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="accept-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accept-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="accept-modal-title">Sign with {choice.party}</h2>
        <p className="accept-modal-kicker">Client agreement</p>
        {clientAgreementLines(choice).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <label className="accept-modal-check">
          <input type="checkbox" checked={agreement} onChange={(event) => setAgreement(event.target.checked)} />
          <span>I agree to the client agreement with {choice.party}</span>
        </label>
        <p className="accept-modal-kicker">LPOA</p>
        {schwabLpoaLines(choice).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <label className="accept-modal-check">
          <input type="checkbox" checked={lpoa} onChange={(event) => setLpoa(event.target.checked)} />
          <span>I agree to the limited power of attorney for a Schwab brokerage</span>
        </label>
        <div className="accept-modal-actions">
          <button type="button" className="text-button" disabled={!ready} onClick={onSign}>
            Sign
          </button>
          <button type="button" className="reveal-next" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
