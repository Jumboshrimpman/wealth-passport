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

**Public demo (GitHub Pages):** [https://jumboshrimpman.github.io/wealth-passport/](https://jumboshrimpman.github.io/wealth-passport/) — published from `main` on each push.

First-time enable (repo admin, once): **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run the **Deploy GitHub Pages** workflow. The Actions `GITHUB_TOKEN` cannot create the Pages site by itself. Fallback: **Source → Deploy from a branch → `gh-pages` / root** (that branch already has a production build).

Tagline: *Standardized and comprehensive investment potential across firms.*

### Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173/wealth-passport/](http://localhost:5173/wealth-passport/) (Vite `base` is `/wealth-passport/` so the local path matches GitHub Pages). A persistent **MOCK DEMO** banner stays on every screen.

```bash
npm run build    # production bundle
npm run preview  # serve the built bundle
```

Requires Node 20+.

### Walkthrough routes

| View | Route | Public URL | What it shows |
| --- | --- | --- | --- |
| Client Passport | `/passport` | […/passport](https://jumboshrimpman.github.io/wealth-passport/passport) | Holistic profile, allocations, liquidity, risk, consent toggles |
| Trust / verification | `/trust` | […/trust](https://jumboshrimpman.github.io/wealth-passport/trust) | Verified Merrill Lynch custodian; advisor Linda McDonald, BrokerCheck `111111` |
| Client offers inbox | `/offers` | […/offers](https://jumboshrimpman.github.io/wealth-passport/offers) | Paid placements (bps / strategy / special offer) |
| Institutional console | `/institution` | […/institution](https://jumboshrimpman.github.io/wealth-passport/institution) | Targeting, offer terms, paid placement channel (local state only) |
| Ops reuse | `/ops` | […/ops](https://jumboshrimpman.github.io/wealth-passport/ops) | Rollover packet with passport-filled fields |
| Admin | `/admin` | […/admin](https://jumboshrimpman.github.io/wealth-passport/admin) | Client + institution sides and aggregate mock metrics |
| Unknown path | any other URL | […/not-a-view](https://jumboshrimpman.github.io/wealth-passport/not-a-view) | Loud “not part of the walkthrough” — no silent fallback |

`/` and the Pages root redirect to `/passport`. Deep links work because the deploy workflow copies `index.html` to `404.html`.

### What is deliberately fake

- Household, accounts, offers, and admin metrics are TypeScript constants.
- Consent toggles and institution sliders update **in-memory React state** only.
- Vendor names (Morningstar, Informa) appear as **illustrated first-party data sources**, not live feeds.
- Footer mentions future quant matching / instant quotes. Those screens are **not built**.

### Stack

Vite + React 19 + TypeScript + React Router. Custom CSS variables (camel brown / sage green). No backend.
