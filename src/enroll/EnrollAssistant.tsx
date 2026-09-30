import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ASSISTANT_CHECKLIST, assistantProgress, type AssistantGap } from "../../shared/enrollFlow.ts";
import { formatUsd } from "../../shared/format.ts";
import {
  FIXED_INCOME_PREF_COPY,
  LPOA_SHARE_LINES,
  RESTRICTION_COPY,
  RESTRICTION_SECTORS,
  ROLE_OPTIONS,
  blankContact,
  blankFixedIncome,
  blankLife,
  blankRepresentedClient,
  blankRestrictions,
  contactReady,
  domicileStateCode,
  enrolleeName,
  householdImportFor,
  lpoaShareReady,
  normalizeTicker,
  representedReady,
  roleActsForClient,
  roleTitle,
  stateName,
  type ContactDetails,
  type EnrolleeRole,
  type EstateRecord,
  type FamilyMember,
  type FixedIncomePreference,
  type InvestmentRestrictions,
  type LifeContext,
  type LpoaShareChoice,
  type RepresentedClient,
  type SectionStatus,
  type TrustRecord,
} from "../../shared/householdContext.ts";
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

const RISKS: { id: RiskChoice; label: string }[] = [
  { id: "conservative", label: "Conservative" },
  { id: "moderate", label: "Moderate" },
  { id: "aggressive", label: "Aggressive" },
];

const BALANCES: { id: BalanceChoice; label: string }[] = [
  { id: "equity", label: "Mostly equity" },
  { id: "balanced", label: "A balance" },
  { id: "fixed-income", label: "Mostly fixed income" },
];

const MOTIVES: { id: MotiveChoice; label: string }[] = [
  { id: "sunset", label: "A product is being sunset" },
  { id: "change", label: "I want a change" },
  { id: "cheaper", label: "I want something cheaper" },
];

const DEMO_CLIENTS = [
  { id: "elena-whitmore", label: "Elena Whitmore" },
  { id: "priya-shah", label: "Priya Shah" },
];

function mergeByName(current: FamilyMember[], incoming: FamilyMember[]): FamilyMember[] {
  const names = new Set(current.map((member) => member.name.trim().toLowerCase()));
  return [...current, ...incoming.filter((member) => !names.has(member.name.trim().toLowerCase()))];
}

function mergeTrusts(current: TrustRecord[], incoming: TrustRecord[]): TrustRecord[] {
  const names = new Set(current.map((trust) => trust.name.trim().toLowerCase()));
  return [...current, ...incoming.filter((trust) => !names.has(trust.name.trim().toLowerCase()))];
}

export function EnrollAssistant({ onSteps }: { onSteps: () => void }) {
  const { clients, passport, selectClient } = useClient();
  const { saveProfile } = useDemo();
  const { allowDemo } = usePortalAccess();
  const navigate = useNavigate();
  const [role, setRole] = useState<EnrolleeRole>("client");
  const [represented, setRepresented] = useState<RepresentedClient>(blankRepresentedClient());
  const [phase, setPhase] = useState<"behalf" | "pulling" | "gaps" | "error">("pulling");
  const [lines, setLines] = useState<string[]>([]);
  const [bank, setBank] = useState<BankConnectResult | null>(null);
  const [irs, setIrs] = useState<IrsConnectResult | null>(null);
  const [fundrise, setFundrise] = useState<AssetConnectResult | null>(null);
  const [coinbase, setCoinbase] = useState<AssetConnectResult | null>(null);
  const [kalshi, setKalshi] = useState<AssetConnectResult | null>(null);
  const [otherLabel, setOtherLabel] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [pendingAsset, setPendingAsset] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactDetails>(blankContact());
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [familyStatus, setFamilyStatus] = useState<SectionStatus>("open");
  const [trusts, setTrusts] = useState<TrustRecord[]>([]);
  const [trustStatus, setTrustStatus] = useState<SectionStatus>("open");
  const [estate, setEstate] = useState<EstateRecord>({ choice: "unset", label: "" });
  const [life, setLife] = useState<LifeContext>(blankLife());
  const [lifeImported, setLifeImported] = useState(false);
  const [restrictions, setRestrictions] = useState<InvestmentRestrictions>(blankRestrictions());
  const [restrictionsEditing, setRestrictionsEditing] = useState(false);
  const [fixedIncome, setFixedIncome] = useState<FixedIncomePreference>(blankFixedIncome());
  const [fixedIncomeEditing, setFixedIncomeEditing] = useState(false);
  const [tickerDraft, setTickerDraft] = useState("");
  const [tickerNote, setTickerNote] = useState("");
  const [risk, setRisk] = useState<RiskChoice | null>(null);
  const [balance, setBalance] = useState<BalanceChoice | null>(null);
  const [motive, setMotive] = useState<MotiveChoice | null>(null);
  const [focus, setFocus] = useState<string[]>([]);
  const [lpoaShare, setLpoaShare] = useState<LpoaShareChoice>("unset");
  const [error, setError] = useState<string | null>(null);

  const acting = roleActsForClient(role);
  const behalfKey = acting
    ? `${represented.name.trim()}|${represented.email.trim()}|${represented.authorityAcknowledged}`
    : "self";

  useEffect(() => {
    if (acting && !representedReady(represented)) {
      setPhase("behalf");
      setLines([]);
      setBank(null);
      setIrs(null);
      return;
    }

    let cancelled = false;
    setPhase("pulling");
    setError(null);
    setBank(null);
    setIrs(null);
    setFundrise(null);
    setCoinbase(null);
    setKalshi(null);
    setOtherLabel("");
    setOtherAmount("");
    setContact(blankContact());
    setFamily([]);
    setFamilyStatus("open");
    setTrusts([]);
    setTrustStatus("open");
    setEstate({ choice: "unset", label: "" });
    setLife(blankLife());
    setLifeImported(false);
    setRestrictions(blankRestrictions());
    setRestrictionsEditing(false);
    setFixedIncome(blankFixedIncome());
    setFixedIncomeEditing(false);
    setRisk(null);
    setBalance(null);
    setMotive(null);
    setFocus([]);
    setLpoaShare("unset");
    setLines(["Connecting a custodian, then the IRS. This demo does not call either one."]);

    void (async () => {
      try {
        const bankResult = await connectDemo("plaid", passport.id);
        if (cancelled) return;
        if (bankResult.kind !== "bank") throw new Error("Expected a bank pull.");
        const largest = [...bankResult.accounts].sort((a, b) => b.balance - a.balance)[0];
        setBank(bankResult);
        setFocus(largest ? [largest.id] : []);
        setLines((current) => [
          ...current,
          `Plaid returned ${bankResult.accounts.length} accounts for ${bankResult.fullName}. Name and balances stay on this pull.`,
        ]);

        const irsResult = await connectDemo("irs", passport.id);
        if (cancelled) return;
        if (irsResult.kind !== "irs") throw new Error("Expected an IRS result.");
        setIrs(irsResult);

        const packet = householdImportFor(passport);
        setContact({
          email: packet.contact.email,
          mailingAddress: packet.contact.mailingAddress,
          commsConsent: false,
          imported: true,
        });
        const nextFamily = mergeByName([], packet.family);
        const nextTrusts = mergeTrusts([], packet.trusts);
        setFamily(nextFamily);
        setFamilyStatus(nextFamily.length > 0 ? "saved" : "later");
        setTrusts(nextTrusts);
        setTrustStatus(nextTrusts.length > 0 ? "saved" : "later");
        if (packet.retirementPlans) {
          setLife({
            ...blankLife(),
            retirementPlans: packet.retirementPlans,
            retirementPlansImported: true,
          });
          setLifeImported(true);
        }
        if (packet.restrictions) {
          setRestrictions(packet.restrictions);
          setRestrictionsEditing(false);
        } else {
          setRestrictions({ ...blankRestrictions(), status: "open" });
        }
        if (packet.fixedIncome) {
          setFixedIncome(packet.fixedIncome);
          setFixedIncomeEditing(false);
        } else {
          setFixedIncome({ ...blankFixedIncome(), status: "open" });
        }

        const notes = ["IRS connector returned a transcript request. No tax file was uploaded."];
        if (packet.restrictions) notes.push("Restrictions on file are here to confirm, not to retype.");
        else notes.push("No investment restrictions came back. Skip them, or add a few.");
        if (packet.fixedIncome) notes.push("A municipal state preference is on file.");
        else notes.push("No municipal state preference came back.");
        if (cancelled) return;
        setLines((current) => [...current, ...notes]);
        setPhase("gaps");
      } catch {
        if (cancelled) return;
        setError("The demo connection did not return.");
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [passport.id, acting, behalfKey, represented]);

  const otherValue = Number(otherAmount.replace(/[^0-9.]/g, ""));
  const otherReady = otherLabel.trim().length > 0 && Number.isFinite(otherValue) && otherValue > 0;
  const home = domicileStateCode(passport.household.domicile);
  const restrictionsDone = restrictions.status !== "open";
  const preferencesDone = fixedIncome.status !== "open";
  const householdDone = familyStatus !== "open" && trustStatus !== "open";
  const flags: Record<AssistantGap, boolean> = {
    custodian: bank != null,
    irs: irs != null,
    restrictions: restrictionsDone,
    preferences: preferencesDone,
    contact: contactReady(contact),
    household: householdDone,
    estate: estate.choice !== "unset",
    risk: risk != null,
    balance: balance != null,
    motive: motive != null,
    focus: focus.length > 0,
    lpoa: lpoaShareReady(lpoaShare),
  };
  const progress = assistantProgress(flags);
  const remaining = ASSISTANT_CHECKLIST.filter((gap) => !flags[gap]).length;
  const ready =
    phase === "gaps" &&
    bank != null &&
    irs != null &&
    risk != null &&
    balance != null &&
    motive != null &&
    focus.length > 0 &&
    contactReady(contact) &&
    lpoaShareReady(lpoaShare) &&
    restrictionsDone &&
    preferencesDone &&
    householdDone &&
    estate.choice !== "unset" &&
    (!acting || representedReady(represented));

  function finish() {
    if (!ready || !bank || !risk || !balance || !motive) return;
    const forClient = roleActsForClient(role);
    const profile: DemoProfile = {
      clientId: passport.id,
      provider: "plaid",
      providerLabel: bank.providerLabel,
      fullName: forClient ? represented.name.trim() : bank.fullName,
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
      other: otherReady ? { label: otherLabel.trim(), amount: otherValue } : null,
      irsConnected: true,
      isFinancialAdvisor: forClient,
      enrolleeRole: role,
      representedClient: forClient ? represented : null,
      contact,
      family,
      familyStatus,
      trusts,
      trustStatus,
      estate,
      life,
      lifeImported,
      restrictions,
      fixedIncome,
      lpoaShare,
      fit: { risk, balance, motive, focusAccountIds: focus },
    };
    saveProfile(profile);
    allowDemo();
    selectClient(passport.id);
    navigate("/assistant");
  }

  async function connectAsset(next: "fundrise" | "coinbase" | "kalshi") {
    setPendingAsset(next);
    setError(null);
    try {
      const result = await connectDemo(next, passport.id);
      if (result.kind !== "asset") throw new Error("Expected an asset pull.");
      if (next === "fundrise") setFundrise(result);
      if (next === "coinbase") setCoinbase(result);
      if (next === "kalshi") setKalshi(result);
    } catch {
      setError("That demo connection did not return.");
    } finally {
      setPendingAsset(null);
    }
  }

  function addTicker() {
    const ticker = normalizeTicker(tickerDraft);
    if (!ticker) {
      setTickerNote("Enter a ticker, such as MS.");
      return;
    }
    setTickerNote("");
    setTickerDraft("");
    setRestrictions((current) =>
      current.tickers.includes(ticker) ? current : { ...current, tickers: [...current.tickers, ticker], status: "saved" },
    );
  }

  const who = acting && represented.name.trim() ? represented.name.trim() : enrolleeName(passport);
  const sampleIds = new Set(clients.map((client) => client.id));

  return (
    <div className="public-page">
      <main className="enroll-flow is-assistant" data-client={passport.id}>
        <p className="wordmark">
          <Link to="/">{PRODUCT_NAME}</Link>
        </p>
        <h1>Enroll {who}</h1>
        <p className="assist-kicker">Assistant-led. Demo only. Nothing is sent to a bank, a model, or the IRS.</p>
        <Progress value={phase === "behalf" ? 0 : progress} remaining={phase === "gaps" ? remaining : null} />

        <div className="demo-switch" aria-label="Sample household">
          <span>Sample household</span>
          {DEMO_CLIENTS.filter((client) => sampleIds.size === 0 || sampleIds.has(client.id)).map((client) => (
            <button
              key={client.id}
              type="button"
              className={passport.id === client.id ? "is-on" : undefined}
              aria-pressed={passport.id === client.id}
              onClick={() => selectClient(client.id)}
            >
              {client.label}
            </button>
          ))}
        </div>

        <div className="role-row" role="listbox" aria-label="Who is enrolling">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={role === option.id ? "chip is-on" : "chip"}
              aria-pressed={role === option.id}
              onClick={() => {
                setRole(option.id);
                if (!roleActsForClient(option.id)) setRepresented(blankRepresentedClient());
              }}
            >
              {roleTitle(option.id)}
            </button>
          ))}
        </div>

        {acting && phase === "behalf" ? (
          <section className="gap-card">
            <h2>{roleTitle(role)} for a client</h2>
            <p>Confirm who you are enrolling, and that you have authority. Then the assistant connects the custodian.</p>
            <label className="field">
              Client name
              <input
                value={represented.name}
                autoComplete="name"
                onChange={(event) => setRepresented((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="field">
              Client email
              <input
                type="email"
                value={represented.email}
                autoComplete="email"
                onChange={(event) => setRepresented((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="advisor-mark">
              <input
                type="checkbox"
                checked={represented.authorityAcknowledged}
                onChange={(event) =>
                  setRepresented((current) => ({ ...current, authorityAcknowledged: event.target.checked }))
                }
              />
              <span>
                <span className="advisor-mark-label">I have authority to enroll this client</span>
              </span>
            </label>
          </section>
        ) : null}

        {lines.length > 0 ? (
          <ul className="assist-log" aria-live="polite">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}

        {phase === "gaps" && bank ? (
          <>
            <RestrictionsCard
              value={restrictions}
              editing={restrictionsEditing}
              draft={tickerDraft}
              note={tickerNote}
              onDraft={setTickerDraft}
              onAdd={addTicker}
              onChange={setRestrictions}
              onEdit={() => setRestrictionsEditing(true)}
              onKeep={() => {
                setRestrictionsEditing(false);
                setRestrictions((current) => ({ ...current, status: "saved" }));
              }}
              onSkip={() => {
                setRestrictionsEditing(false);
                setRestrictions((current) => ({ ...current, status: "skipped" }));
              }}
              onLater={() => {
                setRestrictionsEditing(false);
                setRestrictions((current) => ({ ...current, status: "later" }));
              }}
            />

            <PreferencesCard
              value={fixedIncome}
              editing={fixedIncomeEditing}
              home={home}
              onChange={setFixedIncome}
              onEdit={() => setFixedIncomeEditing(true)}
              onKeep={() => {
                setFixedIncomeEditing(false);
                setFixedIncome((current) => ({ ...current, status: "saved" }));
              }}
              onSkip={() => {
                setFixedIncomeEditing(false);
                setFixedIncome(() => ({ ...blankFixedIncome(), status: "skipped" }));
              }}
              onLater={() => {
                setFixedIncomeEditing(false);
                setFixedIncome((current) => ({ ...current, status: "later" }));
              }}
              onInState={() => {
                setFixedIncomeEditing(false);
                setFixedIncome((current) => ({ ...current, inState: true, status: "saved" }));
              }}
            />

            <section className="gap-card">
              <h2>{contact.imported ? "Contact on file" : "Contact"}</h2>
              {contact.imported ? (
                <p>
                  {contact.email}. {contact.mailingAddress}.
                </p>
              ) : (
                <>
                  <label className="field">
                    Email
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    Mailing address
                    <input
                      value={contact.mailingAddress}
                      onChange={(event) =>
                        setContact((current) => ({ ...current, mailingAddress: event.target.value }))
                      }
                    />
                  </label>
                </>
              )}
              <label className="advisor-mark">
                <input
                  type="checkbox"
                  checked={contact.commsConsent}
                  onChange={(event) => setContact((current) => ({ ...current, commsConsent: event.target.checked }))}
                />
                <span>
                  <span className="advisor-mark-label">You may contact {acting ? "the client" : "me"}</span>
                  <span className="advisor-mark-help">
                    About this enrollment and about offers {acting ? "they" : "you"} choose to see.
                  </span>
                </span>
              </label>
            </section>

            <section className="gap-card">
              <h2>{family.length > 0 || trusts.length > 0 ? "Household on file" : "Household"}</h2>
              {family.length > 0 ? <p>{family.map((member) => member.name).join(", ")}.</p> : <p>No relatives were on file.</p>}
              {trusts.length > 0 ? <p>{trusts.map((trust) => trust.name).join(", ")}.</p> : null}
              {life.retirementPlansImported && life.retirementPlans ? (
                <p>Planning window on file: {life.retirementPlans}. Age can be added later.</p>
              ) : null}
              <ChipRow>
                <Chip
                  on={familyStatus === "saved" || trustStatus === "saved"}
                  onClick={() => {
                    setFamilyStatus(family.length > 0 ? "saved" : "later");
                    setTrustStatus(trusts.length > 0 ? "saved" : "later");
                  }}
                >
                  {family.length > 0 || trusts.length > 0 ? "Looks right" : "Nothing to add"}
                </Chip>
                <Chip
                  on={familyStatus === "later" && trustStatus === "later"}
                  onClick={() => {
                    setFamilyStatus("later");
                    setTrustStatus("later");
                  }}
                >
                  Add later
                </Chip>
              </ChipRow>
            </section>

            <section className="gap-card">
              <h2>Will and estate documents</h2>
              <p>Optional. This is not legal advice, and this demo does not store a real file.</p>
              {estate.choice === "connected" ? <p>{estate.label}</p> : null}
              <ChipRow>
                <Chip
                  on={estate.choice === "connected"}
                  onClick={() => setEstate({ choice: "connected", label: "Will and estate packet · demo connection" })}
                >
                  Connect a demo packet
                </Chip>
                <Chip on={estate.choice === "later"} onClick={() => setEstate({ choice: "later", label: "" })}>
                  Add later
                </Chip>
                <Chip on={estate.choice === "skipped"} onClick={() => setEstate({ choice: "skipped", label: "" })}>
                  Skip
                </Chip>
              </ChipRow>
            </section>

            <section className="gap-card">
              <h2>How do you take risk?</h2>
              <ChipRow label="How do you take risk?">
                {RISKS.map((option) => (
                  <Chip key={option.id} on={risk === option.id} onClick={() => setRisk(option.id)}>
                    {option.label}
                  </Chip>
                ))}
              </ChipRow>
            </section>

            <section className="gap-card">
              <h2>Equity or fixed income?</h2>
              <ChipRow label="Equity or fixed income?">
                {BALANCES.map((option) => (
                  <Chip key={option.id} on={balance === option.id} onClick={() => setBalance(option.id)}>
                    {option.label}
                  </Chip>
                ))}
              </ChipRow>
            </section>

            <section className="gap-card">
              <h2>What brought you here?</h2>
              <ChipRow label="What brought you here?">
                {MOTIVES.map((option) => (
                  <Chip key={option.id} on={motive === option.id} onClick={() => setMotive(option.id)}>
                    {option.label}
                  </Chip>
                ))}
              </ChipRow>
            </section>

            <section className="gap-card">
              <h2>Accounts that matter</h2>
              <p>The largest account is already selected. Change it if you want.</p>
              <ChipRow label="Accounts that matter">
                {bank.accounts.map((account) => {
                  const on = focus.includes(account.id);
                  return (
                    <Chip
                      key={account.id}
                      on={on}
                      onClick={() =>
                        setFocus((current) =>
                          current.includes(account.id)
                            ? current.filter((id) => id !== account.id)
                            : [...current, account.id],
                        )
                      }
                    >
                      {account.institution} · {formatUsd(account.balance)}
                    </Chip>
                  );
                })}
              </ChipRow>
            </section>

            <section className="gap-card">
              <h2>Permission to provide an LPOA</h2>
              {LPOA_SHARE_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <ChipRow label="Permission to provide your LPOA">
                <Chip on={lpoaShare === "permit"} onClick={() => setLpoaShare("permit")}>
                  WealthPass may provide the LPOA
                </Chip>
                <Chip on={lpoaShare === "decline"} onClick={() => setLpoaShare("decline")}>
                  Do not provide the LPOA
                </Chip>
              </ChipRow>
            </section>

            <details className="more-accounts">
              <summary>Add more accounts</summary>
              <p>Fundrise, Coinbase, Kalshi, or something else. Simulated. Skip any you do not have.</p>
              <div className="enroll-actions">
                <AssetButton
                  label="Fundrise"
                  pending={pendingAsset === "fundrise"}
                  result={fundrise}
                  onClick={() => void connectAsset("fundrise")}
                />
                <AssetButton
                  label="Coinbase"
                  pending={pendingAsset === "coinbase"}
                  result={coinbase}
                  onClick={() => void connectAsset("coinbase")}
                />
                <AssetButton
                  label="Kalshi"
                  pending={pendingAsset === "kalshi"}
                  result={kalshi}
                  onClick={() => void connectAsset("kalshi")}
                />
              </div>
              <label className="field">
                Something else
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
              {otherReady ? (
                <p>
                  {otherLabel.trim()} · {formatUsd(otherValue)} will be declared, not verified.
                </p>
              ) : null}
            </details>

            <p className="enroll-feedback" role="status">
              {ready
                ? "Those answers are enough. Finish when you are ready."
                : `${remaining} ${remaining === 1 ? "answer" : "answers"} still open. Finish stays closed until each is set.`}
            </p>
            <div className="enroll-actions">
              <button type="button" className="enroll-primary" disabled={!ready} onClick={finish}>
                Finish enrollment
              </button>
            </div>
          </>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
        <p className="enroll-switch">
          <button type="button" className="text-button" onClick={onSteps}>
            Use the step-by-step form
          </button>
        </p>
      </main>
      <LegalFooter />
    </div>
  );
}

function RestrictionsCard({
  value,
  editing,
  draft,
  note,
  onDraft,
  onAdd,
  onChange,
  onEdit,
  onKeep,
  onSkip,
  onLater,
}: {
  value: InvestmentRestrictions;
  editing: boolean;
  draft: string;
  note: string;
  onDraft: (next: string) => void;
  onAdd: () => void;
  onChange: (next: InvestmentRestrictions) => void;
  onEdit: () => void;
  onKeep: () => void;
  onSkip: () => void;
  onLater: () => void;
}) {
  const onFile = value.imported && !editing;
  const summary = [
    value.tickers.length > 0 ? `Tickers ${value.tickers.join(", ")}` : "",
    value.sectors.join(", "),
    value.notes.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="gap-card">
      <h2>{onFile ? "Restrictions on file" : "Anything you cannot be enrolled in?"}</h2>
      <p>{RESTRICTION_COPY}</p>
      {onFile ? <p>{summary}</p> : null}
      <ChipRow>
        {value.imported ? (
          <Chip on={!editing && value.status === "saved"} onClick={onKeep}>
            Keep
          </Chip>
        ) : (
          <Chip on={value.status === "skipped"} onClick={onSkip}>
            None
          </Chip>
        )}
        {!value.imported ? (
          <Chip on={value.status === "later"} onClick={onLater}>
            Add later
          </Chip>
        ) : null}
        <Chip on={editing} onClick={onEdit}>
          {value.imported ? "Edit" : "Add"}
        </Chip>
      </ChipRow>
      {editing ? (
        <RestrictionEditor value={value} draft={draft} note={note} onDraft={onDraft} onAdd={onAdd} onChange={onChange} />
      ) : null}
    </section>
  );
}

function RestrictionEditor({
  value,
  draft,
  note,
  onDraft,
  onAdd,
  onChange,
}: {
  value: InvestmentRestrictions;
  draft: string;
  note: string;
  onDraft: (next: string) => void;
  onAdd: () => void;
  onChange: (next: InvestmentRestrictions) => void;
}) {
  return (
    <>
      <label className="field">
        Ticker
        <span className="ticker-add">
          <input
            value={draft}
            aria-label="Ticker"
            placeholder="MS"
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onAdd();
            }}
          />
          <button type="button" className="enroll-secondary" onClick={onAdd}>
            Add
          </button>
        </span>
      </label>
      {note ? <p>{note}</p> : null}
      {value.tickers.length > 0 ? (
        <ChipRow label="Restricted tickers">
          {value.tickers.map((ticker) => (
            <Chip
              key={ticker}
              on
              onClick={() =>
                onChange({ ...value, tickers: value.tickers.filter((item) => item !== ticker), status: "saved" })
              }
            >
              {ticker} · Remove
            </Chip>
          ))}
        </ChipRow>
      ) : null}
      <ChipRow label="Restricted sectors">
        {RESTRICTION_SECTORS.map((sector) => {
          const on = value.sectors.includes(sector);
          return (
            <Chip
              key={sector}
              on={on}
              onClick={() =>
                onChange({
                  ...value,
                  status: "saved",
                  sectors: on ? value.sectors.filter((item) => item !== sector) : [...value.sectors, sector],
                })
              }
            >
              {sector}
            </Chip>
          );
        })}
      </ChipRow>
    </>
  );
}

function PreferencesCard({
  value,
  editing,
  home,
  onChange,
  onEdit,
  onKeep,
  onSkip,
  onLater,
  onInState,
}: {
  value: FixedIncomePreference;
  editing: boolean;
  home: string | null;
  onChange: (next: FixedIncomePreference) => void;
  onEdit: () => void;
  onKeep: () => void;
  onSkip: () => void;
  onLater: () => void;
  onInState: () => void;
}) {
  const onFile = value.imported && !editing;
  const named = [
    value.inState && home ? `In-state ${stateName(home)}` : value.inState ? "In-state" : "",
    ...value.states.map((code) => stateName(code)),
  ].filter(Boolean);

  return (
    <section className="gap-card">
      <h2>{onFile ? "Municipal preference on file" : "Any state preference for fixed income?"}</h2>
      <p>{FIXED_INCOME_PREF_COPY}</p>
      {onFile ? <p>{named.join(" · ")}</p> : null}
      <ChipRow>
        {value.imported ? (
          <Chip on={!editing && value.status === "saved"} onClick={onKeep}>
            Keep
          </Chip>
        ) : (
          <>
            <Chip on={value.status === "skipped"} onClick={onSkip}>
              No preference
            </Chip>
            <Chip on={value.status === "saved" && value.inState} onClick={onInState}>
              Prefer in-state{home ? ` ${stateName(home)}` : ""}
            </Chip>
            <Chip on={value.status === "later"} onClick={onLater}>
              Add later
            </Chip>
          </>
        )}
        <Chip on={editing} onClick={onEdit}>
          Edit
        </Chip>
      </ChipRow>
      {editing ? (
        <label className="field">
          Add a state
          <select
            aria-label="Add a state"
            value=""
            onChange={(event) => {
              const code = event.target.value;
              if (!code || value.states.includes(code)) return;
              onChange({ ...value, states: [...value.states, code], status: "saved", imported: value.imported });
            }}
          >
            <option value="">Select</option>
            {["NY", "CT", "CA", "MA", "FL", "TX"]
              .filter((code) => !value.states.includes(code))
              .map((code) => (
                <option key={code} value={code}>
                  {stateName(code)}
                </option>
              ))}
          </select>
        </label>
      ) : null}
    </section>
  );
}

function AssetButton({
  label,
  pending,
  result,
  onClick,
}: {
  label: string;
  pending: boolean;
  result: AssetConnectResult | null;
  onClick: () => void;
}) {
  return (
    <button type="button" className={result ? "chip is-on" : "chip"} disabled={pending} onClick={onClick}>
      {pending ? "Connecting…" : result ? `${label} · ${formatUsd(result.amount)}` : label}
    </button>
  );
}

function Progress({ value, remaining }: { value: number; remaining: number | null }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="enroll-progress">
      <div className="enroll-progress-meta">
        <span>{remaining == null ? "Connecting" : remaining === 0 ? "Ready" : `${remaining} left`}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="enroll-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Enrollment progress"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ChipRow({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className="chip-row" aria-label={label}>
      {children}
    </ul>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <li>
      <button type="button" className={on ? "chip is-on" : "chip"} aria-pressed={on} onClick={onClick}>
        {children}
      </button>
    </li>
  );
}
