import type { ReactNode } from "react";
import type { EnrollmentPayload } from "../../shared/enrollment.ts";
import {
  ENTITY_TYPE_OPTIONS,
  FREQUENCY_OPTIONS,
  ID_TYPE_OPTIONS,
  INCOME_SOURCE_OPTIONS,
  OBJECTIVE_OPTIONS,
  PRODUCT_OPTIONS,
  SOF_DOC_OPTIONS,
  WEALTH_BAND_OPTIONS,
} from "./form";

type Patch = <K extends keyof EnrollmentPayload>(
  section: K,
  partial: Partial<EnrollmentPayload[K]>,
) => void;

interface StepProps {
  payload: EnrollmentPayload;
  patch: Patch;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field-label">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="enroll-check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

export function AccountStep({ payload, patch }: StepProps) {
  const { account } = payload;
  return (
    <div className="form-grid">
      <Field label="Full legal name">
        <input
          value={account.fullName}
          onChange={(event) => patch("account", { fullName: event.target.value })}
          placeholder="First Middle Last"
          autoComplete="name"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={account.email}
          onChange={(event) => patch("account", { email: event.target.value })}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Phone">
        <input
          type="tel"
          value={account.phone}
          onChange={(event) => patch("account", { phone: event.target.value })}
          placeholder="+1 555 000 0000"
          autoComplete="tel"
        />
      </Field>
    </div>
  );
}

export function IdentityStep({ payload, patch }: StepProps) {
  const { identity } = payload;
  return (
    <div className="form-grid">
      <Field label="Government ID type">
        <select
          value={identity.idType}
          onChange={(event) =>
            patch("identity", { idType: event.target.value as typeof identity.idType })
          }
        >
          {ID_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="ID number">
        <input
          value={identity.idNumber}
          onChange={(event) => patch("identity", { idNumber: event.target.value })}
          placeholder="Document number"
        />
      </Field>
      <Field label="Expiration date">
        <input
          type="date"
          value={identity.idExpiry}
          onChange={(event) => patch("identity", { idExpiry: event.target.value })}
        />
      </Field>
      <Field label="Issuing country">
        <input
          value={identity.issuingCountry}
          onChange={(event) => patch("identity", { issuingCountry: event.target.value })}
          placeholder="United States"
        />
      </Field>
      <Check
        checked={identity.livenessConfirmed}
        onChange={(next) => patch("identity", { livenessConfirmed: next })}
      >
        Biometric liveness check passed — selfie matched to the ID portrait (simulated capture in
        this walkthrough; production runs OCR + liveness through a verification vendor).
      </Check>
    </div>
  );
}

export function PersonalStep({ payload, patch }: StepProps) {
  const { personal } = payload;
  const patchAddress = (partial: Partial<typeof personal.address>) =>
    patch("personal", { address: { ...personal.address, ...partial } });
  return (
    <div className="form-grid">
      <Field label="Date of birth">
        <input
          type="date"
          value={personal.dob}
          onChange={(event) => patch("personal", { dob: event.target.value })}
        />
      </Field>
      <Field label="Citizenship">
        <input
          value={personal.citizenship}
          onChange={(event) => patch("personal", { citizenship: event.target.value })}
          placeholder="United States"
        />
      </Field>
      <Field label="Dual citizenship (optional)">
        <input
          value={personal.dualCitizenship}
          onChange={(event) => patch("personal", { dualCitizenship: event.target.value })}
        />
      </Field>
      <Field label="Street address">
        <input
          value={personal.address.street}
          onChange={(event) => patchAddress({ street: event.target.value })}
          autoComplete="street-address"
        />
      </Field>
      <div className="grid grid-2" style={{ gap: "0.8rem" }}>
        <Field label="City">
          <input
            value={personal.address.city}
            onChange={(event) => patchAddress({ city: event.target.value })}
          />
        </Field>
        <Field label="State / province">
          <input
            value={personal.address.state}
            onChange={(event) => patchAddress({ state: event.target.value })}
          />
        </Field>
        <Field label="Postal code">
          <input
            value={personal.address.postalCode}
            onChange={(event) => patchAddress({ postalCode: event.target.value })}
          />
        </Field>
        <Field label="Country">
          <input
            value={personal.address.country}
            onChange={(event) => patchAddress({ country: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Residential status">
        <select
          value={personal.residentialStatus}
          onChange={(event) =>
            patch("personal", {
              residentialStatus: event.target.value as typeof personal.residentialStatus,
            })
          }
        >
          <option value="own">Own</option>
          <option value="rent">Rent</option>
          <option value="family">Family property</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <div className="grid grid-2" style={{ gap: "0.8rem" }}>
        <Field label="Occupation">
          <input
            value={personal.occupation}
            onChange={(event) => patch("personal", { occupation: event.target.value })}
          />
        </Field>
        <Field label="Industry">
          <input
            value={personal.industry}
            onChange={(event) => patch("personal", { industry: event.target.value })}
          />
        </Field>
        <Field label="Employment status">
          <select
            value={personal.employmentStatus}
            onChange={(event) =>
              patch("personal", {
                employmentStatus: event.target.value as typeof personal.employmentStatus,
              })
            }
          >
            <option value="employed">Employed</option>
            <option value="self-employed">Self-employed</option>
            <option value="retired">Retired</option>
            <option value="student">Student</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Years in current role">
          <input
            type="number"
            min={0}
            value={personal.yearsInRole}
            onChange={(event) => patch("personal", { yearsInRole: Number(event.target.value) })}
          />
        </Field>
      </div>
    </div>
  );
}

export function EntityStep({ payload, patch }: StepProps) {
  const { entity } = payload;
  const patchOwner = (index: number, partial: Partial<(typeof entity.owners)[number]>) =>
    patch("entity", {
      owners: entity.owners.map((owner, i) => (i === index ? { ...owner, ...partial } : owner)),
    });
  return (
    <div className="form-grid">
      <Field label="Is this account for a person or a business entity?">
        <select
          value={entity.isBusiness ? "business" : "personal"}
          onChange={(event) => patch("entity", { isBusiness: event.target.value === "business" })}
        >
          <option value="personal">Personal account</option>
          <option value="business">Business entity</option>
        </select>
      </Field>

      {entity.isBusiness ? (
        <>
          <Field label="Legal entity name">
            <input
              value={entity.legalName}
              onChange={(event) => patch("entity", { legalName: event.target.value })}
            />
          </Field>
          <div className="grid grid-2" style={{ gap: "0.8rem" }}>
            <Field label="Entity type">
              <select
                value={entity.entityType}
                onChange={(event) =>
                  patch("entity", { entityType: event.target.value as typeof entity.entityType })
                }
              >
                {ENTITY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Formation jurisdiction">
              <input
                value={entity.formationJurisdiction}
                onChange={(event) =>
                  patch("entity", { formationJurisdiction: event.target.value })
                }
                placeholder="Delaware, USA"
              />
            </Field>
            <Field label="Registration number (if available)">
              <input
                value={entity.registrationNumber}
                onChange={(event) =>
                  patch("entity", { registrationNumber: event.target.value })
                }
              />
            </Field>
            <Field label="Signatory role">
              <input
                value={entity.signatoryRole}
                onChange={(event) => patch("entity", { signatoryRole: event.target.value })}
                placeholder="CEO, trustee, authorized representative…"
              />
            </Field>
          </div>
          <Field label="Primary business activity">
            <input
              value={entity.businessActivity}
              onChange={(event) => patch("entity", { businessActivity: event.target.value })}
            />
          </Field>

          <div>
            <p className="tiny muted" style={{ margin: "0 0 0.5rem" }}>
              Beneficial owners — identify every ultimate beneficial owner (UBO) above 25%. If an
              owner is itself a legal entity, mark it and the structure is flagged for review.
            </p>
            <div className="stack" style={{ gap: "0.55rem" }}>
              {entity.owners.map((owner, index) => (
                <div className="enroll-owner" key={index}>
                  <input
                    value={owner.name}
                    onChange={(event) => patchOwner(index, { name: event.target.value })}
                    placeholder="Owner name"
                    aria-label={`Owner ${index + 1} name`}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={owner.ownershipPct}
                    onChange={(event) =>
                      patchOwner(index, { ownershipPct: Number(event.target.value) })
                    }
                    aria-label={`Owner ${index + 1} ownership percent`}
                  />
                  <label className="enroll-check" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={owner.isEntity}
                      onChange={(event) => patchOwner(index, { isEntity: event.target.checked })}
                    />
                    <span>Entity</span>
                  </label>
                  <button
                    type="button"
                    className="dash-tool"
                    onClick={() =>
                      patch("entity", { owners: entity.owners.filter((_, i) => i !== index) })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="dash-tool"
                  onClick={() =>
                    patch("entity", {
                      owners: [...entity.owners, { name: "", ownershipPct: 0, isEntity: false }],
                    })
                  }
                >
                  Add owner
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="muted tiny" style={{ margin: 0 }}>
          Personal account — beneficial ownership and corporate documents are skipped.
        </p>
      )}
    </div>
  );
}

export function PepStep({ payload, patch }: StepProps) {
  const { pep } = payload;
  return (
    <div className="form-grid">
      <Check
        checked={pep.hasRelatedParties}
        onChange={(next) => patch("pep", { hasRelatedParties: next })}
      >
        I have close family members or related parties enrolled with this firm.
      </Check>
      {pep.hasRelatedParties ? (
        <Field label="Related party — name and relationship">
          <input
            value={pep.relatedPartyDetail}
            onChange={(event) => patch("pep", { relatedPartyDetail: event.target.value })}
          />
        </Field>
      ) : null}

      <Check checked={pep.isPep} onChange={(next) => patch("pep", { isPep: next })}>
        I or a close family member am a Politically Exposed Person (government official,
        state-owned-enterprise officer, or immediate family / close associate of one).
      </Check>
      {pep.isPep ? (
        <div className="grid grid-3" style={{ gap: "0.8rem" }}>
          <Field label="PEP role & institution">
            <input
              value={pep.pepRole}
              onChange={(event) => patch("pep", { pepRole: event.target.value })}
            />
          </Field>
          <Field label="Country">
            <input
              value={pep.pepCountry}
              onChange={(event) => patch("pep", { pepCountry: event.target.value })}
            />
          </Field>
          <Field label="Duration of exposure">
            <input
              value={pep.pepDuration}
              onChange={(event) => patch("pep", { pepDuration: event.target.value })}
              placeholder="2019 – 2023"
            />
          </Field>
        </div>
      ) : null}

      <Check
        checked={pep.sanctionedJurisdictionTies}
        onChange={(next) => patch("pep", { sanctionedJurisdictionTies: next })}
      >
        I have business interests, employment, or residency in sanctioned countries.
      </Check>
      <Check
        checked={pep.priorEnforcement}
        onChange={(next) => patch("pep", { priorEnforcement: next })}
      >
        I have been the subject of sanctions, legal action, or regulatory enforcement.
      </Check>
      <Check
        checked={pep.highRiskIndustry}
        onChange={(next) => patch("pep", { highRiskIndustry: next })}
      >
        I am involved in a high-risk industry (weapons, gambling, crypto, trade finance, etc.).
      </Check>
      {pep.highRiskIndustry ? (
        <Field label="High-risk industry detail">
          <input
            value={pep.highRiskIndustryDetail}
            onChange={(event) => patch("pep", { highRiskIndustryDetail: event.target.value })}
          />
        </Field>
      ) : null}
    </div>
  );
}

export function FinancialStep({ payload, patch }: StepProps) {
  const { financial } = payload;
  const toggleInList = (list: string[], item: string) =>
    list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
  return (
    <div className="form-grid">
      <div className="grid grid-3" style={{ gap: "0.8rem" }}>
        <Field label="Estimated net worth">
          <select
            value={financial.netWorthBand}
            onChange={(event) =>
              patch("financial", { netWorthBand: event.target.value as typeof financial.netWorthBand })
            }
          >
            {WEALTH_BAND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Liquid assets">
          <select
            value={financial.liquidAssetsBand}
            onChange={(event) =>
              patch("financial", {
                liquidAssetsBand: event.target.value as typeof financial.liquidAssetsBand,
              })
            }
          >
            {WEALTH_BAND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Annual income / revenue">
          <select
            value={financial.annualIncomeBand}
            onChange={(event) =>
              patch("financial", {
                annualIncomeBand: event.target.value as typeof financial.annualIncomeBand,
              })
            }
          >
            {WEALTH_BAND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Primary source of income">
        <select
          value={financial.primaryIncomeSource}
          onChange={(event) =>
            patch("financial", {
              primaryIncomeSource: event.target.value as typeof financial.primaryIncomeSource,
            })
          }
        >
          {INCOME_SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <p className="tiny muted" style={{ margin: "0 0 0.5rem" }}>
          Source-of-funds documentation you can provide (upload portal opens after submission).
        </p>
        <div className="stack" style={{ gap: "0.4rem" }}>
          {SOF_DOC_OPTIONS.map((doc) => (
            <Check
              key={doc}
              checked={financial.sourceOfFundsDocs.includes(doc)}
              onChange={() =>
                patch("financial", {
                  sourceOfFundsDocs: toggleInList(financial.sourceOfFundsDocs, doc),
                })
              }
            >
              {doc}
            </Check>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: "0.8rem" }}>
        <Field label="Expected transactions per year">
          <input
            type="number"
            min={0}
            value={financial.expectedAnnualTransactions}
            onChange={(event) =>
              patch("financial", { expectedAnnualTransactions: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Typical transaction size (USD)">
          <input
            type="number"
            min={0}
            value={financial.typicalTransactionSize}
            onChange={(event) =>
              patch("financial", { typicalTransactionSize: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Investment objective">
          <select
            value={financial.investmentObjective}
            onChange={(event) =>
              patch("financial", {
                investmentObjective: event.target.value as typeof financial.investmentObjective,
              })
            }
          >
            {OBJECTIVE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Expected holding period">
          <select
            value={financial.holdingPeriod}
            onChange={(event) =>
              patch("financial", {
                holdingPeriod: event.target.value as typeof financial.holdingPeriod,
              })
            }
          >
            <option value="days">Days</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
        </Field>
        <Field label="Geographic focus">
          <select
            value={financial.geographicFocus}
            onChange={(event) =>
              patch("financial", {
                geographicFocus: event.target.value as typeof financial.geographicFocus,
              })
            }
          >
            <option value="domestic">Domestic</option>
            <option value="international">International</option>
            <option value="specific-regions">Specific regions</option>
          </select>
        </Field>
        <Field label="Frequency of trading">
          <select
            value={financial.tradingFrequency}
            onChange={(event) =>
              patch("financial", {
                tradingFrequency: event.target.value as typeof financial.tradingFrequency,
              })
            }
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <p className="tiny muted" style={{ margin: "0 0 0.5rem" }}>
          Product interests
        </p>
        <div className="row">
          {PRODUCT_OPTIONS.map((product) => (
            <Check
              key={product}
              checked={financial.productInterests.includes(product)}
              onChange={() =>
                patch("financial", {
                  productInterests: toggleInList(financial.productInterests, product),
                })
              }
            >
              {product}
            </Check>
          ))}
        </div>
      </div>

      <Check
        checked={financial.internationalTrade}
        onChange={(next) => patch("financial", { internationalTrade: next })}
      >
        I am using these services to facilitate international trade.
      </Check>
      <Check
        checked={financial.multiCountryFunds}
        onChange={(next) => patch("financial", { multiCountryFunds: next })}
      >
        Funds will involve payments between multiple countries.
      </Check>
      <Check
        checked={financial.importerExporter}
        onChange={(next) => patch("financial", { importerExporter: next })}
      >
        I am an exporter or importer.
      </Check>
    </div>
  );
}

export function ReviewStep({ payload, patch }: StepProps) {
  const { acknowledgments } = payload;
  const { account, personal, entity, financial } = payload;
  return (
    <div className="form-grid">
      <div className="enroll-summary">
        <p>
          <strong>{account.fullName}</strong> · {account.email} · {account.phone}
        </p>
        <p>
          {personal.address.city}, {personal.address.country} · {personal.occupation} (
          {personal.industry}) · {entity.isBusiness ? `Business: ${entity.legalName}` : "Personal account"}
        </p>
        <p>
          Net worth {WEALTH_BAND_OPTIONS.find((o) => o.value === financial.netWorthBand)?.label} ·
          income source{" "}
          {INCOME_SOURCE_OPTIONS.find((o) => o.value === financial.primaryIncomeSource)?.label} ·{" "}
          {financial.sourceOfFundsDocs.length} source-of-funds documents
        </p>
      </div>

      <Check
        checked={acknowledgments.amlProgram}
        onChange={(next) => patch("acknowledgments", { amlProgram: next })}
      >
        I acknowledge the firm’s AML/CFT program and agree to customer due-diligence monitoring.
      </Check>
      <Check
        checked={acknowledgments.privacyPolicy}
        onChange={(next) => patch("acknowledgments", { privacyPolicy: next })}
      >
        I accept the privacy policy and the data-retention schedule (KYC documents held 7 years).
      </Check>
      <Check
        checked={acknowledgments.sanctionsDisclosure}
        onChange={(next) => patch("acknowledgments", { sanctionsDisclosure: next })}
      >
        I verify the sanctions and beneficial-ownership disclosures are complete and accurate.
      </Check>
      <Check
        checked={acknowledgments.reportChanges}
        onChange={(next) => patch("acknowledgments", { reportChanges: next })}
      >
        I commit to reporting material changes (address, employment, ownership, PEP status).
      </Check>

      <Field label="Electronic signature — type your full legal name">
        <input
          value={acknowledgments.signatureName}
          onChange={(event) => patch("acknowledgments", { signatureName: event.target.value })}
          placeholder={account.fullName || "Full legal name"}
        />
      </Field>
    </div>
  );
}
