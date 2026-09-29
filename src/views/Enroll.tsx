import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { agentEnrollSteps, enrollProgress, selfEnrollSteps, type DemoEnrollStep } from "../../shared/enrollFlow.ts";
import { formatUsd } from "../../shared/format.ts";
import {
  blankContact,
  blankLife,
  blankRepresentedClient,
  contactReady,
  householdImportFor,
  lpoaShareReady,
  openLifeModules,
  representedReady,
  roleActsForClient,
  roleTitle,
  type ContactDetails,
  type EnrolleeRole,
  type EstateRecord,
  type FamilyMember,
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
import {
  BehalfStep,
  ContactStep,
  EstateStep,
  HouseholdStep,
  LifeStep,
  LpoaShareStep,
  RolePicker,
} from "../enroll/contextSteps";

type Step = DemoEnrollStep;
type AgentChoice = "chatgpt" | "anthropic";

const AGENTS: { id: AgentChoice; label: string }[] = [
  { id: "chatgpt", label: "ChatGPT Finance" },
  { id: "anthropic", label: "Anthropic RIA dashboard" },
];

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

function mergeByName(current: FamilyMember[], incoming: FamilyMember[]): FamilyMember[] {
  const names = new Set(current.map((member) => member.name.trim().toLowerCase()));
  return [...current, ...incoming.filter((member) => !names.has(member.name.trim().toLowerCase()))];
}

function mergeTrusts(current: TrustRecord[], incoming: TrustRecord[]): TrustRecord[] {
  const names = new Set(current.map((trust) => trust.name.trim().toLowerCase()));
  return [...current, ...incoming.filter((trust) => !names.has(trust.name.trim().toLowerCase()))];
}

/** A log line that stops the agent until the person answers. */
function agentPausePrompt(line: string): string | null {
  const match = /^Paused\.\s+(.+)$/.exec(line.trim());
  return match?.[1] ?? null;
}

function splitAgentLines(lines: string[]): { status: string[]; prompts: string[] } {
  const status: string[] = [];
  const prompts: string[] = [];
  for (const line of lines) {
    const prompt = agentPausePrompt(line);
    if (prompt) prompts.push(prompt);
    else status.push(line);
  }
  return { status, prompts };
}

export function Enroll() {
  const { passport, selectClient } = useClient();
  const { saveProfile } = useDemo();
  const { allowDemo } = usePortalAccess();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("fork");
  const [pendingPath, setPendingPath] = useState<"self" | "agent" | null>(null);
  const [agent, setAgent] = useState<AgentChoice | null>(null);
  const [agentLines, setAgentLines] = useState<string[]>([]);
  const [provider, setProvider] = useState<"plaid" | "kubera" | null>(null);
  const [bank, setBank] = useState<BankConnectResult | null>(null);
  const [fundrise, setFundrise] = useState<AssetConnectResult | null>(null);
  const [coinbase, setCoinbase] = useState<AssetConnectResult | null>(null);
  const [kalshi, setKalshi] = useState<AssetConnectResult | null>(null);
  const [otherLabel, setOtherLabel] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [irs, setIrs] = useState<IrsConnectResult | null>(null);
  const [risk, setRisk] = useState<RiskChoice | null>(null);
  const [balance, setBalance] = useState<BalanceChoice | null>(null);
  const [motive, setMotive] = useState<MotiveChoice | null>(null);
  const [focus, setFocus] = useState<string[]>([]);
  const [role, setRole] = useState<EnrolleeRole>("client");
  const [represented, setRepresented] = useState<RepresentedClient>(blankRepresentedClient());
  const [contact, setContact] = useState<ContactDetails>(blankContact());
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [familyStatus, setFamilyStatus] = useState<SectionStatus>("open");
  const [trusts, setTrusts] = useState<TrustRecord[]>([]);
  const [trustStatus, setTrustStatus] = useState<SectionStatus>("open");
  const [estate, setEstate] = useState<EstateRecord>({ choice: "unset", label: "" });
  const [life, setLife] = useState<LifeContext>(blankLife());
  const [lifeImported, setLifeImported] = useState(false);
  const [lpoaShare, setLpoaShare] = useState<LpoaShareChoice>("unset");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const otherValue = Number(otherAmount.replace(/[^0-9.]/g, ""));
  const otherReady = otherLabel.trim().length > 0 && Number.isFinite(otherValue) && otherValue > 0;
  const includeLife = step === "life" || openLifeModules(life, lifeImported).length > 0;
  const onAgentPath =
    pendingPath === "agent" || step === "agent" || step === "agent-run" || step === "agent-pause";
  const progressSteps = onAgentPath ? agentEnrollSteps(role) : selfEnrollSteps(role, includeLife);
  const acting = roleActsForClient(role) && represented.name.trim().length > 0;

  function applyImport(which: "contact" | "household" | "life" | "all") {
    const packet = householdImportFor(passport);
    if (which === "contact" || which === "all") {
      setContact((current) => ({
        ...current,
        email: packet.contact.email,
        mailingAddress: packet.contact.mailingAddress,
        imported: true,
      }));
    }
    if (which === "household" || which === "all") {
      const nextFamily = mergeByName(family, packet.family);
      const nextTrusts = mergeTrusts(trusts, packet.trusts);
      setFamily(nextFamily);
      setFamilyStatus(nextFamily.length > 0 ? "saved" : "later");
      setTrusts(nextTrusts);
      setTrustStatus(nextTrusts.length > 0 ? "saved" : "later");
    }
    if ((which === "life" || which === "all") && packet.retirementPlans) {
      setLife((current) => ({
        ...current,
        retirementPlans: packet.retirementPlans,
        retirementPlansImported: true,
      }));
      setLifeImported(true);
    }
    return packet;
  }

  function choosePath(path: "self" | "agent") {
    setPendingPath(path);
    if (roleActsForClient(role)) setStep("behalf");
    else setStep(path === "agent" ? "agent" : "connect");
  }

  function continueBehalf() {
    if (!representedReady(represented)) return;
    setContact((current) => ({ ...current, email: current.email || represented.email.trim() }));
    setStep(pendingPath === "agent" ? "agent" : "connect");
  }

  function afterEstate(next: EstateRecord) {
    setEstate(next);
    const stillOpen = openLifeModules(life, lifeImported).length > 0;
    setStep(stillOpen ? "life" : "risk");
  }

  async function connectBank(next: "plaid" | "kubera") {
    setBusy(true);
    setPending(next);
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
      setPending(null);
    }
  }

  async function connectAsset(next: "fundrise" | "coinbase" | "kalshi") {
    setBusy(true);
    setPending(next);
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
      setPending(null);
    }
  }

  async function connectIrs() {
    setBusy(true);
    setPending("irs");
    setError(null);
    try {
      const result = await connectDemo("irs", passport.id);
      if (result.kind !== "irs") throw new Error("Expected an identity result.");
      setIrs(result);
    } catch {
      setError("The demo connection did not return. Try again.");
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  function completeEnrollment(input: {
    bank: BankConnectResult;
    provider: "plaid" | "kubera";
    fundrise: AssetConnectResult | null;
    coinbase: AssetConnectResult | null;
    kalshi: AssetConnectResult | null;
    other: { label: string; amount: number } | null;
    irsConnected: boolean;
    risk: RiskChoice;
    balance: BalanceChoice;
    motive: MotiveChoice;
    focus: string[];
    role: EnrolleeRole;
    represented: RepresentedClient;
    contact: ContactDetails;
    family: FamilyMember[];
    familyStatus: SectionStatus;
    trusts: TrustRecord[];
    trustStatus: SectionStatus;
    estate: EstateRecord;
    life: LifeContext;
    lifeImported: boolean;
    lpoaShare: LpoaShareChoice;
  }) {
    if (input.focus.length === 0) return;
    if (!contactReady(input.contact) || !lpoaShareReady(input.lpoaShare)) return;
    if (roleActsForClient(input.role) && !representedReady(input.represented)) return;
    const forClient = roleActsForClient(input.role);
    const profile: DemoProfile = {
      clientId: passport.id,
      provider: input.provider,
      providerLabel: input.bank.providerLabel,
      fullName: forClient ? input.represented.name.trim() : input.bank.fullName,
      pulledAccounts: input.bank.accounts,
      fundrise: input.fundrise
        ? { connected: true, amount: input.fundrise.amount, label: input.fundrise.label }
        : { connected: false, amount: 0, label: "" },
      coinbase: input.coinbase
        ? { connected: true, amount: input.coinbase.amount, label: input.coinbase.label }
        : { connected: false, amount: 0, label: "" },
      kalshi: input.kalshi
        ? { connected: true, amount: input.kalshi.amount, label: input.kalshi.label }
        : { connected: false, amount: 0, label: "" },
      other: input.other,
      irsConnected: input.irsConnected,
      isFinancialAdvisor: forClient,
      enrolleeRole: input.role,
      representedClient: forClient ? input.represented : null,
      contact: input.contact,
      family: input.family,
      familyStatus: input.familyStatus,
      trusts: input.trusts,
      trustStatus: input.trustStatus,
      estate: input.estate.choice === "unset" ? { choice: "later", label: "" } : input.estate,
      life: input.life,
      lifeImported: input.lifeImported,
      lpoaShare: input.lpoaShare,
      fit: {
        risk: input.risk,
        balance: input.balance,
        motive: input.motive,
        focusAccountIds: input.focus,
      },
    };
    saveProfile(profile);
    allowDemo();
    selectClient(passport.id);
    navigate("/assistant");
  }

  function contextSnapshot() {
    return {
      role,
      represented,
      contact,
      family,
      familyStatus: family.length === 0 && familyStatus === "open" ? ("later" as const) : familyStatus,
      trusts,
      trustStatus: trusts.length === 0 && trustStatus === "open" ? ("later" as const) : trustStatus,
      estate,
      life,
      lifeImported,
      lpoaShare,
    };
  }

  function finish() {
    if (!bank || !provider || !risk || !balance || !motive || !irs || focus.length === 0) return;
    completeEnrollment({
      bank,
      provider,
      fundrise,
      coinbase,
      kalshi,
      other: otherReady ? { label: otherLabel.trim(), amount: otherValue } : null,
      irsConnected: true,
      risk,
      balance,
      motive,
      focus,
      ...contextSnapshot(),
    });
  }

  async function pullAsset(next: "fundrise" | "coinbase" | "kalshi"): Promise<AssetConnectResult | null> {
    try {
      const result = await connectDemo(next, passport.id);
      if (result.kind !== "asset") return null;
      return result;
    } catch {
      return null;
    }
  }

  async function startAgent(choice: AgentChoice) {
    const label = choice === "chatgpt" ? "ChatGPT Finance" : "Anthropic RIA dashboard";
    setAgent(choice);
    setPending(choice);
    setStep("agent-run");
    setError(null);
    setBusy(true);
    const lines = [`${label} is running enrollment. This demo does not call that product.`];
    setAgentLines(lines);
    try {
      const bankResult = await connectDemo("plaid", passport.id);
      if (bankResult.kind !== "bank") throw new Error("Expected a bank pull.");
      setProvider("plaid");
      setBank(bankResult);
      const largest = [...bankResult.accounts].sort((a, b) => b.balance - a.balance)[0];
      setFocus(largest ? [largest.id] : []);
      lines.push(`Plaid returned ${bankResult.accounts.length} accounts for ${bankResult.fullName}.`);
      setAgentLines([...lines]);

      const fund = await pullAsset("fundrise");
      setFundrise(fund);
      lines.push(fund ? `${fund.label} is in.` : "No Fundrise position came back.");
      setAgentLines([...lines]);

      const coin = await pullAsset("coinbase");
      setCoinbase(coin);
      lines.push(coin ? `${coin.label} is in.` : "No Coinbase balance came back.");
      setAgentLines([...lines]);

      const kal = await pullAsset("kalshi");
      setKalshi(kal);
      lines.push(kal ? `${kal.label} is in.` : "No Kalshi positions came back.");
      setAgentLines([...lines]);

      const irsResult = await connectDemo("irs", passport.id);
      if (irsResult.kind !== "irs") throw new Error("Expected an IRS result.");
      setIrs(irsResult);
      lines.push("IRS connector returned a transcript request. No tax file was uploaded.");

      const packet = applyImport("all");
      if (packet.family.length > 0) {
        lines.push(`Family unit on file: ${packet.family.map((member) => member.name).join(", ")}.`);
      } else {
        lines.push("No relatives were on file. You can add them later.");
      }
      if (packet.trusts.length > 0) {
        lines.push(`${packet.trusts.map((trust) => trust.name).join(", ")} is on file. Trustees were checked against the family unit.`);
      } else {
        lines.push("No trust was on file. You can add one later.");
      }
      if (packet.retirementPlans) {
        lines.push(`Retirement planning window on file: ${packet.retirementPlans}. Age was not, so it can be added later.`);
      }
      lines.push("Will and estate documents were not connected. You can add them later.");
      lines.push("Paused. Risk, contact permission, and LPOA sharing have to come from you.");
      setAgentLines([...lines]);
      setStep("agent-pause");
    } catch {
      setError("The demo agent did not finish. You can enroll yourself instead.");
      setStep("fork");
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  function finishFromAgent() {
    if (!bank || !irs || !risk || !contactReady(contact) || !lpoaShareReady(lpoaShare)) return;
    const largest = [...bank.accounts].sort((a, b) => b.balance - a.balance)[0];
    completeEnrollment({
      bank,
      provider: "plaid",
      fundrise,
      coinbase,
      kalshi,
      other: null,
      irsConnected: true,
      risk,
      balance: "balanced",
      motive: "change",
      focus: largest ? [largest.id] : [],
      ...contextSnapshot(),
      estate: estate.choice === "unset" ? { choice: "later", label: "" } : estate,
    });
  }

  function skipOther() {
    setOtherLabel("");
    setOtherAmount("");
    setStep("irs");
  }

  const emailKnown =
    (contact.imported && contact.email.trim().length > 0) ||
    (acting && contact.email.trim().length > 0 && contact.email.trim() === represented.email.trim());

  return (
    <div className="public-page">
      <main className="enroll-flow">
        <p className="wordmark">
          <Link to="/">{PRODUCT_NAME}</Link>
        </p>
        <EnrollProgress value={enrollProgress(step, progressSteps)} />
        {acting && step !== "fork" && step !== "behalf" ? (
          <p className="enroll-role-note">
            {roleTitle(role)} for {represented.name.trim()}.
          </p>
        ) : null}
        {step === "fork" ? (
          <section>
            <h1>How do you want to enroll?</h1>
            <p>Either way stays in this demo. Nothing is sent to a bank, a model, or an advisor. Client is the usual path.</p>
            <RolePicker
              role={role}
              onChange={(next) => {
                setRole(next);
                if (!roleActsForClient(next)) setRepresented(blankRepresentedClient());
              }}
            />
            <div className="enroll-choices" role="listbox" aria-label="How do you want to enroll?">
              <button type="button" className="enroll-choice enroll-path" onClick={() => choosePath("agent")}>
                <span className="enroll-path-copy">
                  <span className="enroll-path-title">Use my finance agent</span>
                  <span className="enroll-path-note">An agent runs the connections and pauses for you.</span>
                </span>
              </button>
              <button type="button" className="enroll-choice enroll-path" onClick={() => choosePath("self")}>
                <span className="enroll-path-copy">
                  <span className="enroll-path-title">
                    {roleActsForClient(role) ? "I\u2019ll enroll the client" : "I\u2019ll enroll myself"}
                  </span>
                  <span className="enroll-path-note">You connect each source yourself, in order.</span>
                </span>
              </button>
            </div>
          </section>
        ) : null}

        {step === "behalf" ? (
          <BehalfStep role={role} client={represented} onChange={setRepresented} onContinue={continueBehalf} />
        ) : null}

        {step === "agent" ? (
          <section>
            <h1>Which agent should run this?</h1>
            <p>Demo only. Neither product is connected. Pick one to start.</p>
            <div className="enroll-choices">
              {AGENTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="enroll-choice"
                  disabled={busy}
                  onClick={() => void startAgent(option.id)}
                >
                  <span>{pending === option.id ? "Starting…" : option.label}</span>
                </button>
              ))}
            </div>
            <div className="enroll-actions">
              <Secondary disabled={busy} onClick={() => setStep("connect")}>
                I&rsquo;ll enroll myself instead
              </Secondary>
            </div>
          </section>
        ) : null}

        {step === "agent-run" ? <AgentRun lines={agentLines} /> : null}

        {step === "agent-pause" ? (
          <section>
            <h1>Your agent paused.</h1>
            <AgentPausePrompts
              lines={agentLines}
              waiting={agent === "anthropic" ? "The Anthropic RIA dashboard" : "ChatGPT Finance"}
            />
            {contact.imported ? (
              <p className="enroll-known">
                Contact on file
                <small>
                  {contact.email}. {contact.mailingAddress}.
                </small>
              </p>
            ) : null}
            <label className="advisor-mark">
              <input
                type="checkbox"
                checked={contact.commsConsent}
                onChange={(event) => setContact((current) => ({ ...current, commsConsent: event.target.checked }))}
              />
              <span>
                <span className="advisor-mark-label">You may contact {acting ? "the client" : "me"}</span>
                <span className="advisor-mark-help">
                  About this enrollment and about offers you choose to see.
                </span>
              </span>
            </label>
            <ChoiceList label="How do you take risk?" options={RISKS} value={risk} onChange={setRisk} />
            <div className="enroll-choices" role="listbox" aria-label="Permission to provide your LPOA">
              <button
                type="button"
                role="option"
                aria-selected={lpoaShare === "permit"}
                className={lpoaShare === "permit" ? "enroll-choice is-on" : "enroll-choice"}
                onClick={() => setLpoaShare("permit")}
              >
                <span className="enroll-path-copy">
                  <span>WealthPass may provide the LPOA</span>
                  <span className="enroll-path-note">This permission is not an LPOA. The selected manager sets up the Schwab brokerage.</span>
                </span>
              </button>
              <button
                type="button"
                role="option"
                aria-selected={lpoaShare === "decline"}
                className={lpoaShare === "decline" ? "enroll-choice is-on" : "enroll-choice"}
                onClick={() => setLpoaShare("decline")}
              >
                <span>Do not provide the LPOA</span>
              </button>
            </div>
            <p className="enroll-feedback" role="status">
              {risk && contact.commsConsent && lpoaShareReady(lpoaShare)
                ? "Those answers are saved. Finish when you are ready."
                : "Risk, permission to contact, and LPOA sharing are still open. Finish stays closed until each is answered."}
            </p>
            <div className="enroll-actions">
              <Primary
                disabled={!risk || !contactReady(contact) || !lpoaShareReady(lpoaShare)}
                onClick={finishFromAgent}
              >
                Finish enrollment
              </Primary>
            </div>
            <AgentStatusLog lines={agentLines} />
          </section>
        ) : null}

        {step === "connect" ? (
          <section>
            <h1>Connect a bank or a balance sheet.</h1>
            <p>Simulated. Nothing leaves this demo, and we only ask for what this pull does not return.</p>
            <div className="enroll-choices">
              <button type="button" className="enroll-choice" disabled={busy} onClick={() => void connectBank("plaid")}>
                <span>{pending === "plaid" ? "Connecting…" : "Connect Plaid"}</span>
                <span className="choice-hint">Bank accounts</span>
              </button>
              <button type="button" className="enroll-choice" disabled={busy} onClick={() => void connectBank("kubera")}>
                <span>{pending === "kubera" ? "Connecting…" : "Connect Kubera"}</span>
                <span className="choice-hint">Balance sheet</span>
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
            <div className="enroll-actions">
              <Primary onClick={() => setStep("fundrise")}>Continue to private holdings</Primary>
            </div>
          </section>
        ) : null}

        {step === "fundrise" ? (
          <AssetStep
            title="Any private or alternative holdings?"
            body="Fundrise, if you have it. This is the gap the bank pull did not cover."
            result={fundrise}
            connecting={pending === "fundrise"}
            connectLabel="Connect Fundrise"
            skipLabel="I don't have private holdings"
            continueLabel="Continue to crypto"
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
            connecting={pending === "coinbase"}
            connectLabel="Connect Coinbase"
            skipLabel="I don't have crypto"
            continueLabel="Continue to prediction markets"
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
            connecting={pending === "kalshi"}
            connectLabel="Connect Kalshi"
            skipLabel="I don't have prediction markets"
            continueLabel="Continue to other holdings"
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
            <p className="enroll-feedback" role="status">
              {otherReady
                ? `${otherLabel.trim()} · ${formatUsd(otherValue)} will be declared, not verified.`
                : "Add a name and a value, or skip with Nothing else."}
            </p>
            <div className="enroll-actions">
              <Primary disabled={!otherReady} onClick={() => setStep("irs")}>
                Add this holding
              </Primary>
              <Secondary onClick={skipOther}>Nothing else</Secondary>
            </div>
          </section>
        ) : null}

        {step === "irs" ? (
          <section>
            <h1>Connect to the IRS.</h1>
            <p>
              Wage and return records come from this connection. Nothing is uploaded. This demo does
              not contact the IRS.
            </p>
            {irs ? (
              <>
                <p className="enroll-feedback" role="status">
                  Connected. {irs.detail}
                </p>
                <div className="enroll-actions">
                  <Primary onClick={() => setStep("contact")}>Continue</Primary>
                </div>
              </>
            ) : (
              <div className="enroll-actions">
                <Primary disabled={busy} onClick={() => void connectIrs()}>
                  {pending === "irs" ? "Connecting…" : "Connect IRS"}
                </Primary>
              </div>
            )}
          </section>
        ) : null}

        {step === "contact" ? (
          <ContactStep
            contact={contact}
            emailKnown={emailKnown}
            onChange={setContact}
            onImport={() => applyImport("contact")}
            onContinue={() => setStep("household")}
          />
        ) : null}

        {step === "household" ? (
          <HouseholdStep
            enrolleeName={acting ? represented.name.trim() : bank?.fullName || passport.household.principals}
            family={family}
            familyStatus={familyStatus}
            trusts={trusts}
            trustStatus={trustStatus}
            onFamily={setFamily}
            onFamilyStatus={setFamilyStatus}
            onTrusts={setTrusts}
            onTrustStatus={setTrustStatus}
            onImport={() => applyImport("household")}
            onContinue={() => setStep("estate")}
          />
        ) : null}

        {step === "estate" ? <EstateStep estate={estate} onChange={setEstate} onContinue={afterEstate} /> : null}

        {step === "life" ? (
          <LifeStep
            life={life}
            imported={lifeImported}
            onChange={setLife}
            onImport={() => applyImport("life")}
            onContinue={() => setStep("risk")}
          />
        ) : null}

        {step === "risk" ? (
          <ChoiceStep
            title="How do you take risk?"
            options={RISKS}
            value={risk}
            onChange={setRisk}
            continueLabel="Continue to allocation"
            onContinue={() => risk && setStep("balance")}
          />
        ) : null}
        {step === "balance" ? (
          <ChoiceStep
            title="Equity or fixed income?"
            options={BALANCES}
            value={balance}
            onChange={setBalance}
            continueLabel="Continue to why you are here"
            onContinue={() => balance && setStep("motive")}
          />
        ) : null}
        {step === "motive" ? (
          <ChoiceStep
            title="What brought you here?"
            options={MOTIVES}
            value={motive}
            onChange={setMotive}
            continueLabel="Choose accounts"
            onContinue={() => motive && setStep("focus")}
          />
        ) : null}

        {step === "focus" && bank ? (
          <section>
            <h1>Which accounts matter most?</h1>
            <p>These are the accounts the connection already returned.</p>
            <div className="enroll-choices" role="listbox" aria-label="Which accounts matter most?">
              {bank.accounts.map((account) => {
                const on = focus.includes(account.id);
                return (
                  <button
                    key={account.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={on ? "enroll-choice is-on" : "enroll-choice"}
                    onClick={() =>
                      setFocus((current) =>
                        current.includes(account.id)
                          ? current.filter((id) => id !== account.id)
                          : [...current, account.id],
                      )
                    }
                  >
                    <span>
                      {account.institution} · {account.name}
                    </span>
                    {on ? <span className="choice-mark">Selected</span> : null}
                  </button>
                );
              })}
            </div>
            <p className="enroll-feedback" role="status">
              {focus.length === 0
                ? "Select at least one account. Continue stays closed until you do."
                : `${focus.length} ${focus.length === 1 ? "account" : "accounts"} selected.`}
            </p>
            <div className="enroll-actions">
              <Primary disabled={focus.length === 0 || !irs} onClick={() => setStep("lpoa")}>
                Continue
              </Primary>
            </div>
          </section>
        ) : null}

        {step === "lpoa" ? (
          <LpoaShareStep choice={lpoaShare} onChange={setLpoaShare} onFinish={finish} />
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}
      </main>
      <LegalFooter />
    </div>
  );
}

function EnrollProgress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="enroll-progress">
      <div className="enroll-progress-meta">
        <span>Signup</span>
        <span>{pct}%</span>
      </div>
      <div
        className="enroll-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Signup progress"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Primary({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="enroll-primary" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function Secondary({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="enroll-secondary" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function AgentRun({ lines }: { lines: string[] }) {
  return (
    <section>
      <h1>Your agent is enrolling.</h1>
      <p>It stops when it needs a person.</p>
      <AgentPausePrompts lines={lines} />
      <AgentStatusLog lines={lines} />
    </section>
  );
}

function AgentPausePrompts({ lines, waiting }: { lines: string[]; waiting?: string }) {
  const { prompts } = splitAgentLines(lines);
  if (prompts.length === 0) return null;
  return (
    <>
      {prompts.map((prompt) => (
        <div key={prompt} className="agent-needs-you" role="status">
          <p className="agent-needs-kicker">Needs your answer</p>
          <p className="agent-needs-prompt">{prompt}</p>
          {waiting ? <p className="agent-needs-note">{waiting} is waiting. Demo only.</p> : null}
        </div>
      ))}
    </>
  );
}

function AgentStatusLog({ lines }: { lines: string[] }) {
  const { status } = splitAgentLines(lines);
  if (status.length === 0) return null;
  return (
    <ul className="agent-log">
      {status.map((line, index) => (
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}

function AssetStep({
  title,
  body,
  result,
  connecting,
  connectLabel,
  skipLabel,
  continueLabel,
  onConnect,
  onSkip,
  onContinue,
}: {
  title: string;
  body: string;
  result: AssetConnectResult | null;
  connecting: boolean;
  connectLabel: string;
  skipLabel: string;
  continueLabel: string;
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
          <p className="enroll-feedback" role="status">
            Connected. {result.label} · {formatUsd(result.amount)}. {result.detail}
          </p>
          <div className="enroll-actions">
            <Primary onClick={onContinue}>{continueLabel}</Primary>
          </div>
        </>
      ) : (
        <div className="enroll-actions">
          <Primary disabled={connecting} onClick={onConnect}>
            {connecting ? "Connecting…" : connectLabel}
          </Primary>
          <Secondary disabled={connecting} onClick={onSkip}>
            {skipLabel}
          </Secondary>
        </div>
      )}
    </section>
  );
}

function ChoiceList<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <div className="enroll-choices" role="listbox" aria-label={label}>
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={on}
            className={on ? "enroll-choice is-on" : "enroll-choice"}
            onClick={() => onChange(option.id)}
          >
            <span>{option.label}</span>
            {on ? <span className="choice-mark">Selected</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function ChoiceStep<T extends string>({
  title,
  options,
  value,
  onChange,
  continueLabel,
  onContinue,
}: {
  title: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
  continueLabel: string;
  onContinue: () => void;
}) {
  const selected = options.find((option) => option.id === value);
  return (
    <section>
      <h1>{title}</h1>
      <ChoiceList label={title} options={options} value={value} onChange={onChange} />
      <p className="enroll-feedback" role="status">
        {selected ? `${selected.label} is saved for this step.` : "Pick one. The next step stays closed until you do."}
      </p>
      <div className="enroll-actions">
        <Primary disabled={!value} onClick={onContinue}>
          {continueLabel}
        </Primary>
      </div>
    </section>
  );
}
