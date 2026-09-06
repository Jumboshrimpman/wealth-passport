# Wealth Passport

Collaborative project workspace for Sama and Jonathan.

This GitHub repository is the shared source of truth. Each person uses their own Cursor / Grok; chats are not shared.

## Personal branch ownership (hard rule)

**Do not write on another person’s personal branch.**

- Branch `sama` is **ONLY for Sama** (repo owner, GitHub `Jumboshrimpman`). Jonathan must **never** commit, push, or open PRs from `sama`.
- Branch `jonathan` is **ONLY for Jonathan**. Sama must not use `jonathan` for day-to-day work.
- Shared integration happens via **PRs into `main`** (or short-lived `feat/*` branches that PR into `main`).

**How we work together:** see [CONTRIBUTING.md](CONTRIBUTING.md).

Cursor / Cloud Agents should follow [AGENTS.md](AGENTS.md). That file repeats this ownership rule first so agents cannot miss it.

---

## Investor mock (this branch)

`Wealth Passport` is a **frontend-only MOCK** for investor walkthroughs. It is honest UI with static fixtures in `src/data/mock.ts`. There are no APIs, auth, KYC, payments, custody links, or Morningstar / Informa integrations.

Tagline: *Standardized and comprehensive investment potential across firms.*

### Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL (default [http://localhost:5173](http://localhost:5173)). A persistent **MOCK DEMO** banner stays on every screen.

```bash
npm run build    # production bundle
npm run preview  # serve the built bundle
```

Requires Node 20+.

### Walkthrough routes

| View | Route | What it shows |
| --- | --- | --- |
| Client Passport | `/passport` | Holistic profile, allocations, liquidity, risk, consent toggles |
| Trust / verification | `/trust` | Verified Merrill Lynch custodian; advisor Linda McDonald, BrokerCheck `111111` |
| Client offers inbox | `/offers` | Paid placements (bps / strategy / special offer) |
| Institutional console | `/institution` | Targeting, offer terms, paid placement channel (local state only) |
| Ops reuse | `/ops` | Rollover packet with passport-filled fields |
| Admin | `/admin` | Client + institution sides and aggregate mock metrics |
| Unknown path | any other URL | Loud “not part of the walkthrough” — no silent fallback |

`/` redirects to `/passport`.

### What is deliberately fake

- Household, accounts, offers, and admin metrics are TypeScript constants.
- Consent toggles and institution sliders update **in-memory React state** only.
- Vendor names (Morningstar, Informa) appear as **illustrated first-party data sources**, not live feeds.
- Footer mentions future quant matching / instant quotes. Those screens are **not built**.

### Stack

Vite + React 19 + TypeScript + React Router. Custom CSS variables (camel brown / sage green). No backend.
