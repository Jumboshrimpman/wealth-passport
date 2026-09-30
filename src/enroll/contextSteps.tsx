import { useState, type ReactNode } from "react";
import {
  FAMILY_RELATIONS,
  FIXED_INCOME_PREF_COPY,
  LIFE_MODULES,
  LPOA_SHARE_LINES,
  RESTRICTION_COPY,
  RESTRICTION_SECTORS,
  ROLE_OPTIONS,
  US_STATES,
  contactReady,
  domicileStateCode,
  normalizeTicker,
  openLifeModules,
  relationLabel,
  representedReady,
  stateName,
  trustHouseholdView,
  trusteeLinkLabel,
  type ContactDetails,
  type EnrolleeRole,
  type EstateRecord,
  type FamilyMember,
  type FamilyRelation,
  type FixedIncomePreference,
  type InvestmentRestrictions,
  type LifeContext,
  type LifeModuleId,
  type LpoaShareChoice,
  type RepresentedClient,
  type SectionStatus,
  type TrustRecord,
} from "../../shared/householdContext.ts";

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

export function RolePicker({ role, onChange }: { role: EnrolleeRole; onChange: (role: EnrolleeRole) => void }) {
  return (
    <div className="enroll-choices" role="listbox" aria-label="Who is enrolling?">
      {ROLE_OPTIONS.map((option) => {
        const on = role === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={on}
            className={on ? "enroll-choice is-on" : "enroll-choice"}
            onClick={() => onChange(option.id)}
          >
            <span className="enroll-path-copy">
              <span className="enroll-path-title">{option.label}</span>
              <span className="enroll-path-note">{option.note}</span>
            </span>
            {on ? <span className="choice-mark">Selected</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function BehalfStep({
  role,
  client,
  onChange,
  onContinue,
}: {
  role: EnrolleeRole;
  client: RepresentedClient;
  onChange: (next: RepresentedClient) => void;
  onContinue: () => void;
}) {
  const ready = representedReady(client);
  const title = role === "associate" ? "Client associate" : "Financial advisor";
  return (
    <section>
      <h1>You are enrolling a client.</h1>
      <p>
        {title}. This path is for the client, not for you. Confirm you have authority to enroll them.
        The client path stays available if you are enrolling yourself.
      </p>
      <label className="field">
        Client legal name
        <input
          value={client.name}
          autoComplete="name"
          onChange={(event) => onChange({ ...client, name: event.target.value })}
        />
      </label>
      <label className="field">
        Client email
        <input
          type="email"
          value={client.email}
          autoComplete="email"
          onChange={(event) => onChange({ ...client, email: event.target.value })}
        />
      </label>
      <label className="advisor-mark">
        <input
          type="checkbox"
          checked={client.authorityAcknowledged}
          onChange={(event) => onChange({ ...client, authorityAcknowledged: event.target.checked })}
        />
        <span>
          <span className="advisor-mark-label">I have authority to enroll this client</span>
          <span className="advisor-mark-help">
            You are acting for them. This demo does not check a power of attorney or an advisory agreement.
          </span>
        </span>
      </label>
      <p className="enroll-feedback" role="status">
        {ready
          ? `${client.name.trim()} is the client on this enrollment.`
          : "Enter the client’s name and email, and confirm authority. Continue stays closed until you do."}
      </p>
      <div className="enroll-actions">
        <Primary disabled={!ready} onClick={onContinue}>
          Continue
        </Primary>
      </div>
    </section>
  );
}

export function ContactStep({
  contact,
  emailKnown,
  onChange,
  onImport,
  onContinue,
}: {
  contact: ContactDetails;
  emailKnown: boolean;
  onChange: (next: ContactDetails) => void;
  onImport: () => void;
  onContinue: () => void;
}) {
  const ready = contactReady(contact);
  const addressKnown = contact.imported && contact.mailingAddress.trim().length > 0;
  return (
    <section>
      <h1>How should we reach you?</h1>
      <p>Email, a mailing address, and permission to contact you. Anything already on file is not asked again.</p>
      {emailKnown ? (
        <p className="enroll-known">
          Email on file
          <small>{contact.email}</small>
        </p>
      ) : (
        <label className="field">
          Email
          <input
            type="email"
            value={contact.email}
            autoComplete="email"
            onChange={(event) => onChange({ ...contact, email: event.target.value, imported: false })}
          />
        </label>
      )}
      {addressKnown ? (
        <p className="enroll-known">
          Mailing address on file
          <small>{contact.mailingAddress}</small>
        </p>
      ) : (
        <label className="field">
          Mailing address
          <input
            value={contact.mailingAddress}
            autoComplete="street-address"
            onChange={(event) => onChange({ ...contact, mailingAddress: event.target.value, imported: false })}
          />
        </label>
      )}
      <label className="advisor-mark">
        <input
          type="checkbox"
          checked={contact.commsConsent}
          onChange={(event) => onChange({ ...contact, commsConsent: event.target.checked })}
        />
        <span>
          <span className="advisor-mark-label">You may contact me</span>
          <span className="advisor-mark-help">
            About this enrollment and about offers you choose to see. You can change this later.
          </span>
        </span>
      </label>
      <p className="enroll-feedback" role="status">
        {ready
          ? "Contact and permission are saved for this enrollment."
          : "Add an email, a mailing address, and permission to contact you. Continue stays closed until you do."}
      </p>
      <div className="enroll-actions">
        <Primary disabled={!ready} onClick={onContinue}>
          Continue
        </Primary>
        {contact.imported ? null : (
          <Secondary onClick={onImport}>Import from connections</Secondary>
        )}
      </div>
    </section>
  );
}

function FamilyForm({
  onSave,
  onCancel,
}: {
  onSave: (member: FamilyMember) => void;
  onCancel: () => void;
}) {
  const [relation, setRelation] = useState<FamilyRelation>("partner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [commsConsent, setCommsConsent] = useState(false);
  const ready = name.trim().length > 0;
  return (
    <div className="enroll-block">
      <label className="field">
        Relationship
        <select value={relation} onChange={(event) => setRelation(event.target.value as FamilyRelation)}>
          {FAMILY_RELATIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="field">
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="field">
        Date of birth
        <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
      </label>
      <label className="field">
        Address
        <input value={address} onChange={(event) => setAddress(event.target.value)} />
      </label>
      <label className="advisor-mark">
        <input type="checkbox" checked={commsConsent} onChange={(event) => setCommsConsent(event.target.checked)} />
        <span>
          <span className="advisor-mark-label">You may contact them</span>
          <span className="advisor-mark-help">Only if they should hear from WealthPass. This can wait.</span>
        </span>
      </label>
      <div className="enroll-actions">
        <Primary
          disabled={!ready}
          onClick={() =>
            onSave({
              id: `family-${Date.now().toString(36)}`,
              relation,
              name: name.trim(),
              email: email.trim(),
              dob,
              address: address.trim(),
              commsConsent,
              source: "manual",
            })
          }
        >
          Save relative
        </Primary>
        <Secondary onClick={onCancel}>Cancel</Secondary>
      </div>
    </div>
  );
}

export function HouseholdStep({
  enrolleeName,
  family,
  familyStatus,
  trusts,
  trustStatus,
  onFamily,
  onFamilyStatus,
  onTrusts,
  onTrustStatus,
  onImport,
  onContinue,
}: {
  enrolleeName: string;
  family: FamilyMember[];
  familyStatus: SectionStatus;
  trusts: TrustRecord[];
  trustStatus: SectionStatus;
  onFamily: (next: FamilyMember[]) => void;
  onFamilyStatus: (next: SectionStatus) => void;
  onTrusts: (next: TrustRecord[]) => void;
  onTrustStatus: (next: SectionStatus) => void;
  onImport: () => void;
  onContinue: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [addingTrust, setAddingTrust] = useState(false);
  const [trustName, setTrustName] = useState("");
  const [trusteeNames, setTrusteeNames] = useState("");
  const views = trustHouseholdView(enrolleeName, family, trusts);
  const familyQuiet = family.length === 0 && (familyStatus === "skipped" || familyStatus === "later");
  const trustQuiet = trusts.length === 0 && (trustStatus === "skipped" || trustStatus === "later");

  return (
    <section>
      <h1>Family and trusts.</h1>
      <p>
        This builds the family unit asset managers plan for. Relatives are optional. Skip them, or add them later.
        If a connection already has them, import instead of typing.
      </p>

      <h2>Relatives</h2>
      {family.length > 0 ? (
        <ul className="trustee-list">
          {family.map((member) => (
            <li key={member.id}>
              <span>
                {member.name}
                <small className="trustee-sub">
                  {relationLabel(member.relation)}
                  {member.email ? ` · ${member.email}` : ""}
                  {member.dob ? ` · ${member.dob}` : " · Date of birth not on file"}
                  {member.address ? ` · ${member.address}` : ""}
                </small>
              </span>
              <span className="trustee-meta">{member.commsConsent ? "Contact allowed" : "No contact yet"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="enroll-feedback" role="status">
          {familyStatus === "skipped"
            ? "Relatives skipped. You can add them later."
            : familyStatus === "later"
              ? "Relatives marked to add later."
              : "No relatives on file yet."}
        </p>
      )}
      {adding ? (
        <FamilyForm
          onCancel={() => setAdding(false)}
          onSave={(member) => {
            onFamily([...family, member]);
            onFamilyStatus("saved");
            setAdding(false);
          }}
        />
      ) : (
        <div className="enroll-actions">
          {family.length === 0 && familyStatus !== "skipped" ? (
            <Secondary onClick={() => onFamilyStatus("skipped")}>Skip</Secondary>
          ) : null}
          {familyQuiet ? null : <Secondary onClick={() => onFamilyStatus("later")}>Add later</Secondary>}
          <Secondary onClick={onImport}>Import with agent</Secondary>
          <Secondary
            onClick={() => {
              setAdding(true);
              onFamilyStatus("open");
            }}
          >
            Add a relative
          </Secondary>
        </div>
      )}

      <h2>Trusts and trustees</h2>
      <p>Provided to asset managers because it affects strategy. Import is enough. A long form is not required.</p>
      {views.length > 0 ? (
        views.map((view) => (
          <div key={view.trustName} className="enroll-block">
            <p className="enroll-known">
              {view.trustName}
              <small>Trustees checked against the family unit.</small>
            </p>
            <ul className="trustee-list">
              {view.trustees.map((trustee) => (
                <li key={trustee.name}>
                  <span>{trustee.name}</span>
                  <span className="trustee-meta">{trusteeLinkLabel(trustee)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p className="enroll-feedback" role="status">
          {trustStatus === "skipped"
            ? "Trusts skipped. You can add them later."
            : trustStatus === "later"
              ? "Trusts marked to add later."
              : "No trust is on file."}
        </p>
      )}
      {addingTrust ? (
        <div className="enroll-block">
          <label className="field">
            Trust name
            <input value={trustName} onChange={(event) => setTrustName(event.target.value)} />
          </label>
          <label className="field">
            Trustees
            <input
              value={trusteeNames}
              placeholder="Names, separated by commas"
              onChange={(event) => setTrusteeNames(event.target.value)}
            />
          </label>
          <div className="enroll-actions">
            <Primary
              disabled={!trustName.trim()}
              onClick={() => {
                const trustees = trusteeNames
                  .split(",")
                  .map((name) => name.trim())
                  .filter(Boolean);
                onTrusts([
                  ...trusts,
                  {
                    id: `trust-${Date.now().toString(36)}`,
                    name: trustName.trim(),
                    trustees: trustees.length > 0 ? trustees : [enrolleeName],
                    source: "manual",
                  },
                ]);
                onTrustStatus("saved");
                setTrustName("");
                setTrusteeNames("");
                setAddingTrust(false);
              }}
            >
              Save trust
            </Primary>
            <Secondary onClick={() => setAddingTrust(false)}>Cancel</Secondary>
          </div>
        </div>
      ) : (
        <div className="enroll-actions">
          {trusts.length === 0 && trustStatus !== "skipped" ? (
            <Secondary onClick={() => onTrustStatus("skipped")}>Skip</Secondary>
          ) : null}
          {trustQuiet ? null : <Secondary onClick={() => onTrustStatus("later")}>Add later</Secondary>}
          {trusts.length === 0 ? <Secondary onClick={onImport}>Import from connections</Secondary> : null}
          <Secondary onClick={() => setAddingTrust(true)}>Add a trust</Secondary>
        </div>
      )}

      <div className="enroll-actions">
        <Primary onClick={onContinue}>Continue</Primary>
      </div>
    </section>
  );
}

export function EstateStep({
  estate,
  onChange,
  onContinue,
}: {
  estate: EstateRecord;
  onChange: (next: EstateRecord) => void;
  onContinue: (next: EstateRecord) => void;
}) {
  return (
    <section>
      <h1>Will and estate documents.</h1>
      <p>
        Optional. Connect them once and WealthPass can keep them as a repository for asset managers you consent to,
        so they can see legacy and estate context. This is not legal advice, and WealthPass does not interpret the
        documents. This demo does not store a real file.
      </p>
      {estate.choice === "connected" ? (
        <p className="enroll-feedback" role="status">
          Connected. {estate.label} This demo connection is not a vault.
        </p>
      ) : null}
      <div className="enroll-actions">
        {estate.choice === "connected" ? (
          <Primary onClick={() => onContinue(estate)}>Continue</Primary>
        ) : (
          <>
            <Primary
              onClick={() =>
                onChange({
                  choice: "connected",
                  label: "Will and estate packet · demo connection",
                })
              }
            >
              Connect documents
            </Primary>
            <Secondary onClick={() => onContinue({ choice: "later", label: "" })}>Add later</Secondary>
            <Secondary onClick={() => onContinue({ choice: "skipped", label: "" })}>Skip</Secondary>
          </>
        )}
      </div>
      {estate.choice === "connected" ? null : (
        <label className="field">
          Or choose a demo file. It stays in this browser.
          <input
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onChange({ choice: "connected", label: file.name });
            }}
          />
        </label>
      )}
    </section>
  );
}

export function LifeStep({
  life,
  imported,
  onChange,
  onImport,
  onContinue,
}: {
  life: LifeContext;
  imported: boolean;
  onChange: (next: LifeContext) => void;
  onImport: () => void;
  onContinue: () => void;
}) {
  const [deferred, setDeferred] = useState<LifeModuleId[]>([]);
  const open = openLifeModules(life, imported).filter((id) => !deferred.includes(id));
  const known = LIFE_MODULES.filter((module) => imported && !openLifeModules(life, true).includes(module.id));

  function defer(id: LifeModuleId) {
    setDeferred((current) => (current.includes(id) ? current : [...current, id]));
  }

  return (
    <section>
      <h1>Life context.</h1>
      <p>
        Optional, and only for strategy fit. Skip any of these, or add them later. A connection that already returned
        an answer is not asked again.
      </p>
      {known.map((module) => (
        <p key={module.id} className="enroll-known">
          {module.title} is already on file
          <small>{module.id === "retirement" ? life.retirementPlans : lifeValue(life, module.id)}</small>
        </p>
      ))}
      {open.length === 0 && deferred.length === 0 ? (
        <p className="enroll-feedback" role="status">
          Nothing else to ask. Continue when you are ready.
        </p>
      ) : null}
      {LIFE_MODULES.filter((module) => open.includes(module.id)).map((module) => (
        <div key={module.id} className="enroll-block">
          <h2>{module.title}</h2>
          <p>{module.body}</p>
          {module.id === "retirement" && life.retirementPlansImported ? (
            <p className="enroll-known">
              Plans on file
              <small>{life.retirementPlans}</small>
            </p>
          ) : null}
          {module.id === "retirement" && !life.retirementPlansImported ? (
            <label className="field">
              Retirement plans
              <input
                value={life.retirementPlans}
                onChange={(event) => onChange({ ...life, retirementPlans: event.target.value })}
              />
            </label>
          ) : null}
          {module.id === "retirement" ? (
            <label className="field">
              Retirement age
              <input
                inputMode="numeric"
                value={life.retirementAge}
                onChange={(event) => onChange({ ...life, retirementAge: event.target.value })}
              />
            </label>
          ) : (
            <label className="field">
              Notes
              <input value={lifeValue(life, module.id)} onChange={(event) => onChange(setLifeValue(life, module.id, event.target.value))} />
            </label>
          )}
          <div className="enroll-actions">
            <Secondary onClick={() => defer(module.id)}>Not now</Secondary>
          </div>
        </div>
      ))}
      {deferred.length > 0 ? (
        <p className="enroll-feedback" role="status">
          {deferred.length === 1 ? "One item" : `${deferred.length} items`} marked to add later.
        </p>
      ) : null}
      <div className="enroll-actions">
        <Primary onClick={onContinue}>Continue</Primary>
        {imported ? null : <Secondary onClick={onImport}>Import with agent</Secondary>}
        <Secondary onClick={onContinue}>Skip all</Secondary>
      </div>
    </section>
  );
}

function lifeValue(life: LifeContext, id: LifeModuleId): string {
  if (id === "education") return life.education;
  if (id === "life-events") return life.lifeEvents;
  if (id === "eldercare") return life.eldercare;
  if (id === "values") return life.values;
  return life.retirementPlans;
}

function setLifeValue(life: LifeContext, id: LifeModuleId, value: string): LifeContext {
  if (id === "education") return { ...life, education: value };
  if (id === "life-events") return { ...life, lifeEvents: value };
  if (id === "eldercare") return { ...life, eldercare: value };
  if (id === "values") return { ...life, values: value };
  return life;
}

export function RestrictionsStep({
  value,
  onChange,
  onContinue,
}: {
  value: InvestmentRestrictions;
  onChange: (next: InvestmentRestrictions) => void;
  onContinue: (next: InvestmentRestrictions) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [tickerNote, setTickerNote] = useState("");
  const onFile =
    value.imported &&
    !editing &&
    (value.tickers.length > 0 || value.sectors.length > 0 || value.notes.trim().length > 0);

  function addTicker() {
    const ticker = normalizeTicker(draft);
    if (!ticker) {
      setTickerNote("Enter a ticker, such as MS.");
      return;
    }
    setTickerNote("");
    setDraft("");
    if (value.tickers.includes(ticker)) return;
    onChange({ ...value, tickers: [...value.tickers, ticker] });
  }

  function finish(status: InvestmentRestrictions["status"]) {
    onContinue({ ...value, status });
  }

  if (onFile) {
    return (
      <section>
        <h1>Restrictions are already on file.</h1>
        <p>{RESTRICTION_COPY}</p>
        <p className="enroll-known">
          From the custodian
          <small>
            {[
              value.tickers.length > 0 ? `Tickers ${value.tickers.join(", ")}` : "",
              value.sectors.length > 0 ? value.sectors.join(", ") : "",
              value.notes.trim(),
            ]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </p>
        <p className="enroll-feedback" role="status">
          Nothing else to ask. Edit only if a line should change.
        </p>
        <div className="enroll-actions">
          <Primary onClick={() => finish("saved")}>Continue</Primary>
          <Secondary onClick={() => setEditing(true)}>Edit</Secondary>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1>Anything you cannot be enrolled in?</h1>
      <p>
        Stocks, sectors, or a short note about work, conflicts, or compliance. This is asked only when it did not come
        in from the custodian. {RESTRICTION_COPY}
      </p>
      <label className="field">
        Ticker
        <span className="ticker-add">
          <input
            value={draft}
            aria-label="Ticker"
            placeholder="MS"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addTicker();
            }}
          />
          <button type="button" className="enroll-secondary" onClick={addTicker}>
            Add
          </button>
        </span>
      </label>
      {tickerNote ? (
        <p className="enroll-feedback" role="status">
          {tickerNote}
        </p>
      ) : null}
      {value.tickers.length > 0 ? (
        <ul className="chip-row" aria-label="Restricted tickers">
          {value.tickers.map((ticker) => (
            <li key={ticker}>
              <button
                type="button"
                className="chip is-on"
                onClick={() => onChange({ ...value, tickers: value.tickers.filter((item) => item !== ticker) })}
              >
                {ticker} · Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="enroll-quiet">Sectors</p>
      <ul className="chip-row" aria-label="Restricted sectors">
        {RESTRICTION_SECTORS.map((sector) => {
          const on = value.sectors.includes(sector);
          return (
            <li key={sector}>
              <button
                type="button"
                className={on ? "chip is-on" : "chip"}
                aria-pressed={on}
                onClick={() =>
                  onChange({
                    ...value,
                    sectors: on ? value.sectors.filter((item) => item !== sector) : [...value.sectors, sector],
                  })
                }
              >
                {sector}
              </button>
            </li>
          );
        })}
      </ul>
      <label className="field">
        Note, if you want one
        <textarea
          rows={3}
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
        />
      </label>
      <div className="enroll-actions">
        <Primary onClick={() => finish("saved")}>Continue</Primary>
        {value.imported ? null : (
          <>
            <Secondary onClick={() => finish("later")}>Add later</Secondary>
            <Secondary onClick={() => finish("skipped")}>Skip</Secondary>
          </>
        )}
      </div>
    </section>
  );
}

export function PreferencesStep({
  value,
  domicile,
  onChange,
  onContinue,
}: {
  value: FixedIncomePreference;
  domicile: string;
  onChange: (next: FixedIncomePreference) => void;
  onContinue: (next: FixedIncomePreference) => void;
}) {
  const [editing, setEditing] = useState(false);
  const home = domicileStateCode(domicile);
  const onFile = value.imported && !editing && (value.inState || value.states.length > 0);

  function finish(status: FixedIncomePreference["status"]) {
    onContinue({ ...value, status });
  }

  if (onFile) {
    const named = [
      value.inState && home ? `In-state ${stateName(home)}` : value.inState ? "In-state" : "",
      ...value.states.map((code) => stateName(code)),
    ].filter(Boolean);
    return (
      <section>
        <h1>A municipal state preference is already on file.</h1>
        <p>{FIXED_INCOME_PREF_COPY}</p>
        <p className="enroll-known">
          From the custodian
          <small>{named.join(" · ")}</small>
        </p>
        <p className="enroll-feedback" role="status">
          Nothing else to ask. Edit only if a state should change.
        </p>
        <div className="enroll-actions">
          <Primary onClick={() => finish("saved")}>Continue</Primary>
          <Secondary onClick={() => setEditing(true)}>Edit</Secondary>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1>Any state preference for fixed income?</h1>
      <p>
        For municipal bonds, you can prefer your home state or name others. Skip this, or add it later.{" "}
        {FIXED_INCOME_PREF_COPY}
      </p>
      <label className="advisor-mark">
        <input
          type="checkbox"
          checked={value.inState}
          onChange={(event) => onChange({ ...value, inState: event.target.checked })}
        />
        <span>
          <span className="advisor-mark-label">Prefer in-state municipals{home ? ` (${stateName(home)})` : ""}</span>
        </span>
      </label>
      <label className="field">
        Add a state
        <select
          aria-label="Add a state"
          value=""
          onChange={(event) => {
            const code = event.target.value;
            if (!code || value.states.includes(code)) return;
            onChange({ ...value, states: [...value.states, code] });
          }}
        >
          <option value="">Select</option>
          {US_STATES.filter((state) => !value.states.includes(state.code)).map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </label>
      {value.states.length > 0 ? (
        <ul className="chip-row" aria-label="Preferred states">
          {value.states.map((code) => (
            <li key={code}>
              <button
                type="button"
                className="chip is-on"
                onClick={() => onChange({ ...value, states: value.states.filter((item) => item !== code) })}
              >
                {stateName(code)} · Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="enroll-actions">
        <Primary onClick={() => finish("saved")}>Continue</Primary>
        {value.imported ? null : (
          <>
            <Secondary onClick={() => finish("later")}>Add later</Secondary>
            <Secondary onClick={() => finish("skipped")}>Skip</Secondary>
          </>
        )}
      </div>
    </section>
  );
}

export function LpoaShareStep({
  choice,
  onChange,
  onFinish,
}: {
  choice: LpoaShareChoice;
  onChange: (next: LpoaShareChoice) => void;
  onFinish: () => void;
}) {
  const ready = choice === "permit" || choice === "decline";
  return (
    <section>
      <h1>Sharing an existing LPOA.</h1>
      {LPOA_SHARE_LINES.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <div className="enroll-choices" role="listbox" aria-label="Permission to provide your LPOA">
        <button
          type="button"
          role="option"
          aria-selected={choice === "permit"}
          className={choice === "permit" ? "enroll-choice is-on" : "enroll-choice"}
          onClick={() => onChange("permit")}
        >
          <span>WealthPass may provide my LPOA</span>
          {choice === "permit" ? <span className="choice-mark">Selected</span> : null}
        </button>
        <button
          type="button"
          role="option"
          aria-selected={choice === "decline"}
          className={choice === "decline" ? "enroll-choice is-on" : "enroll-choice"}
          onClick={() => onChange("decline")}
        >
          <span>Do not provide my LPOA</span>
          {choice === "decline" ? <span className="choice-mark">Selected</span> : null}
        </button>
      </div>
      <p className="enroll-feedback" role="status">
        {choice === "permit"
          ? "Permission saved. This is not an LPOA. The manager you select sets up the Schwab brokerage."
          : choice === "decline"
            ? "WealthPass will not provide your LPOA. You can change this later."
            : "Choose whether WealthPass may provide the LPOA. Continue stays closed until you do."}
      </p>
      <div className="enroll-actions">
        <Primary disabled={!ready} onClick={onFinish}>
          See your offers
        </Primary>
      </div>
    </section>
  );
}
