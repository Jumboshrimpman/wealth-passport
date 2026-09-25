import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatUsd } from "../../shared/format.ts";
import type {
  AssetConnectResult,
  BalanceChoice,
  BankConnectResult,
  DemoProfile,
  IrsConnectResult,
  MotiveChoice,
  RiskChoice,
} from "../../shared/marketplace.ts";
import { connectDemo } from "../api/connect";
import { usePortalAccess } from "../auth/access";
import { LegalFooter } from "../components/LegalFooter";
import { useClient } from "../context/ClientContext";
import { useDemo } from "../context/DemoContext";
import { PRODUCT_NAME } from "../data/catalog";

type Step =
  | "connect"
  | "returned"
  | "fundrise"
  | "coinbase"
  | "kalshi"
  | "other"
  | "tax"
  | "irs"
  | "risk"
  | "balance"
  | "motive"
  | "focus";

const RISKS: { id: RiskChoice; label: string }[] = [
  { id: "aggressive", label: "Aggressive" },
  { id: "moderate", label: "Moderate" },
  { id: "conservative", label: "Conservative" },
];

const BALANCES: { id: BalanceChoice; label: string }[] = [
  { id: "equity", label: "Mostly equity" },
  { id: "balanced", label: "A balance of equity and fixed income" },
  { id: "fixed-income", label: "Mostly fixed income" },
];

const MOTIVES: { id: MotiveChoice; label: string }[] = [
  { id: "sunset", label: "A product is being sunset" },
  { id: "change", label: "I want a change" },
  { id: "cheaper", label: "I want something cheaper" },
];

export function Enroll() {
  const { passport, selectClient } = useClient();
  const { saveProfile } = useDemo();
  const { allowDemo } = usePortalAccess();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("connect");
  const [provider, setProvider] = useState<"plaid" | "kubera" | null>(null);
  const [bank, setBank] = useState<BankConnectResult | null>(null);
  const [fundrise, setFundrise] = useState<AssetConnectResult | null>(null);
  const [coinbase, setCoinbase] = useState<AssetConnectResult | null>(null);
  const [kalshi, setKalshi] = useState<AssetConnectResult | null>(null);
  const [otherLabel, setOtherLabel] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [taxName, setTaxName] = useState<string | null>(null);
  const [irs, setIrs] = useState<IrsConnectResult | null>(null);
  const [risk, setRisk] = useState<RiskChoice | null>(null);
  const [balance, setBalance] = useState<BalanceChoice | null>(null);
  const [motive, setMotive] = useState<MotiveChoice | null>(null);
  const [focus, setFocus] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connectBank(next: "plaid" | "kubera") {
    setBusy(true);
    setError(null);
    try {
      const result = await connectDemo(next, passport.id);
      if (result.kind !== "bank") throw new Error("Expected a bank pull.");
      const largest = [...result.accounts].sort((a, b) => b.balance - a.balance)[0];
      setProvider(next);
      setBank(result);
      setFocus(largest ? [largest.id] : []);
      setStep("returned");
    } catch {
      setError("The demo connection did not return. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function connectAsset(next: "fundrise" | "coinbase" | "kalshi") {
    setBusy(true);
    setError(null);
    try {
      const result = await connectDemo(next, passport.id);
      if (result.kind !== "asset") throw new Error("Expected an asset pull.");
      if (next === "fundrise") setFundrise(result);
      if (next === "coinbase") setCoinbase(result);
      if (next === "kalshi") setKalshi(result);
    } catch {
      setError("The demo connection did not return. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function connectIrs() {
    setBusy(true);
    setError(null);
    try {
      const result = await connectDemo("irs", passport.id);
      if (result.kind !== "irs") throw new Error("Expected an identity result.");
      setIrs(result);
    } catch {
      setError("The demo connection did not return. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    if (!bank || !provider || !risk || !balance || !motive || focus.length === 0) return;
    const amount = Number(otherAmount.replace(/[^0-9.]/g, ""));
    const profile: DemoProfile = {
      clientId: passport.id,
      provider,
      providerLabel: bank.providerLabel,
      fullName: bank.fullName,
      pulledAccounts: bank.accounts,
      fundrise: fundrise
        ? { connected: true, amount: fundrise.amount, label: fundrise.label }
        : { connected: false, amount: 0, label: "" },
      coinbase: coinbase
        ? { connected: true, amount: coinbase.amount, label: coinbase.label }
        : { connected: false, amount: 0, label: "" },
      kalshi: kalshi
        ? { connected: true, amount: kalshi.amount, label: kalshi.label }
        : { connected: false, amount: 0, label: "" },
      other: Number.isFinite(amount) && amount > 0 ? { label: otherLabel.trim() || "Other assets", amount } : null,
      taxDocName: taxName,
      fit: { risk, balance, motive, focusAccountIds: focus },
    };
    saveProfile(profile);
    allowDemo();
    selectClient(passport.id);
    navigate("/assistant");
  }

  return (
    <div className="public-page">
      <main className="enroll-flow">
        <p className="wordmark">
          <Link to="/">{PRODUCT_NAME}</Link>
        </p>
        {step === "connect" ? (
          <section>
            <h1>Connect a bank or a balance sheet.</h1>
            <p>Simulated. Nothing leaves this demo, and we only ask for what this pull does not return.</p>
            <div className="public-actions">
              <button type="button" disabled={busy} onClick={() => void connectBank("plaid")}>
                Plaid
              </button>
              <button type="button" disabled={busy} onClick={() => void connectBank("kubera")}>
                Kubera
              </button>
            </div>
          </section>
        ) : null}

        {step === "returned" && bank ? (
          <section>
            <h1>This is what came back.</h1>
            <p>
              {bank.fullName}. We already have the name and these balances, so we will not ask for
              them again.
            </p>
            <ul className="pull-list">
              {bank.accounts.map((account) => (
                <li key={account.id}>
                  <span>
                    {account.institution}
                    <small>{account.name}</small>
                  </span>
                  <span>{formatUsd(account.balance)}</span>
                </li>
              ))}
            </ul>
            <button type="button" className="text-button" onClick={() => setStep("fundrise")}>
              Continue
            </button>
          </section>
        ) : null}

        {step === "fundrise" ? (
          <AssetStep
            title="Any private or alternative holdings?"
            body="Fundrise, if you have it. This is the gap the bank pull did not cover."
            result={fundrise}
            busy={busy}
            connectLabel="Connect Fundrise"
            onConnect={() => void connectAsset("fundrise")}
            onSkip={() => setStep("coinbase")}
            onContinue={() => setStep("coinbase")}
          />
        ) : null}

        {step === "coinbase" ? (
          <AssetStep
            title="Any crypto?"
            body="Coinbase, if you have it."
            result={coinbase}
            busy={busy}
            connectLabel="Connect Coinbase"
            onConnect={() => void connectAsset("coinbase")}
            onSkip={() => setStep("kalshi")}
            onContinue={() => setStep("kalshi")}
          />
        ) : null}

        {step === "kalshi" ? (
          <AssetStep
            title="Any prediction markets?"
            body="Kalshi, if you have it."
            result={kalshi}
            busy={busy}
            connectLabel="Connect Kalshi"
            onConnect={() => void connectAsset("kalshi")}
            onSkip={() => setStep("other")}
            onContinue={() => setStep("other")}
          />
        ) : null}

        {step === "other" ? (
          <section>
            <h1>Anything else not reflected?</h1>
            <p>A holding none of those connections would have returned.</p>
            <label className="field">
              What is it
              <input value={otherLabel} onChange={(event) => setOtherLabel(event.target.value)} />
            </label>
            <label className="field">
              Approximate value
              <input
                inputMode="decimal"
                value={otherAmount}
                onChange={(event) => setOtherAmount(event.target.value)}
              />
            </label>
            <div className="public-actions">
              <button type="button" onClick={() => setStep("tax")}>
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtherLabel("");
                  setOtherAmount("");
                  setStep("tax");
                }}
              >
                Nothing else
              </button>
            </div>
          </section>
        ) : null}

        {step === "tax" ? (
          <section>
            <h1>Upload a tax document.</h1>
            <p>The file stays in this browser. It will show as still processing.</p>
            <label className="field">
              Tax document
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(event) => setTaxName(event.target.files?.[0]?.name ?? null)}
              />
            </label>
            {taxName ? <p>{taxName} · still processing</p> : null}
            <button type="button" className="text-button" onClick={() => setStep("irs")}>
              Continue
            </button>
          </section>
        ) : null}

        {step === "irs" ? (
          <section>
            <h1>Verify with the IRS.</h1>
            <p>
              This follows the shape of an ID.me handoff: confirm it is you, then the agency request
              goes out. This demo does not contact the IRS or ID.me.
            </p>
            {irs ? (
              <>
                <p>{irs.detail}</p>
                <button type="button" className="text-button" onClick={() => setStep("risk")}>
                  Continue
                </button>
              </>
            ) : (
              <button type="button" className="text-button" disabled={busy} onClick={() => void connectIrs()}>
                Continue
              </button>
            )}
          </section>
        ) : null}

        {step === "risk" ? (
          <ChoiceStep
            title="How do you take risk?"
            options={RISKS}
            value={risk}
            onChange={setRisk}
            onContinue={() => risk && setStep("balance")}
          />
        ) : null}
        {step === "balance" ? (
          <ChoiceStep
            title="Equity or fixed income?"
            options={BALANCES}
            value={balance}
            onChange={setBalance}
            onContinue={() => balance && setStep("motive")}
          />
        ) : null}
        {step === "motive" ? (
          <ChoiceStep
            title="What brought you here?"
            options={MOTIVES}
            value={motive}
            onChange={setMotive}
            onContinue={() => motive && setStep("focus")}
          />
        ) : null}

        {step === "focus" && bank ? (
          <section>
            <h1>Which accounts matter most?</h1>
            <p>These are the accounts the connection already returned.</p>
            <div className="choices">
              {bank.accounts.map((account) => {
                const on = focus.includes(account.id);
                return (
                  <button
                    key={account.id}
                    type="button"
                    aria-pressed={on}
                    className={on ? "is-on" : ""}
                    onClick={() =>
                      setFocus((current) =>
                        current.includes(account.id)
                          ? current.filter((id) => id !== account.id)
                          : [...current, account.id],
                      )
                    }
                  >
                    {account.institution} · {account.name}
                  </button>
                );
              })}
            </div>
            <button type="button" className="text-button" disabled={focus.length === 0} onClick={finish}>
              See your offers
            </button>
          </section>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
      </main>
      <LegalFooter />
    </div>
  );
}

function AssetStep({
  title,
  body,
  result,
  busy,
  connectLabel,
  onConnect,
  onSkip,
  onContinue,
}: {
  title: string;
  body: string;
  result: AssetConnectResult | null;
  busy: boolean;
  connectLabel: string;
  onConnect: () => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{body}</p>
      {result ? (
        <>
          <p>
            {result.label} · {formatUsd(result.amount)} verified. {result.detail}
          </p>
          <button type="button" className="text-button" onClick={onContinue}>
            Continue
          </button>
        </>
      ) : (
        <div className="public-actions">
          <button type="button" disabled={busy} onClick={onConnect}>
            {connectLabel}
          </button>
          <button type="button" onClick={onSkip}>
            I don&rsquo;t have this
          </button>
        </div>
      )}
    </section>
  );
}

function ChoiceStep<T extends string>({
  title,
  options,
  value,
  onChange,
  onContinue,
}: {
  title: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
  onContinue: () => void;
}) {
  return (
    <section>
      <h1>{title}</h1>
      <div className="choices" role="listbox" aria-label={title}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            className={value === option.id ? "is-on" : ""}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button type="button" className="text-button" disabled={!value} onClick={onContinue}>
        Continue
      </button>
    </section>
  );
}
