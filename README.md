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

**WealthPass** is a **frontend-only MOCK** for investor walkthroughs. It is honest UI with static fixtures in `src/data/mock.ts`. There are no APIs, Clerk, KYC, payments, custody links, or Morningstar / Informa integrations.

Tagline: *Standardized and comprehensive investment potential across firms.*

**Public demo (GitHub Pages):** [https://jumboshrimpman.github.io/wealth-passport/](https://jumboshrimpman.github.io/wealth-passport/) — published from `main` on each push. Vite `base` stays `/wealth-passport/` so that URL keeps working.

First-time enable (repo admin, once): **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run the **Deploy GitHub Pages** workflow. The Actions `GITHUB_TOKEN` cannot create the Pages site by itself. Fallback: **Source → Deploy from a branch → `gh-pages` / root** (that branch already has a production build).

### Demo password (MOCK auth)

The site is blocked until the password is entered. Unlock state is stored in `sessionStorage` and `localStorage` (GitHub Pages–friendly). Wrong passwords fail loudly. There is no Clerk or server check.

**Password:** `wealth-demo`

### Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173/wealth-passport/](http://localhost:5173/wealth-passport/) (Vite `base` is `/wealth-passport/` so the local path matches GitHub Pages). A persistent **MOCK DEMO · WealthPass** banner stays on every screen.

```bash
npm run build    # production bundle
npm run preview  # serve the built bundle
```

Requires Node 20+.

### Three modes

A global **Client | Institution | Admin** toggle switches completely separate experiences. There is no mixed walkthrough nav.

| Mode | What you can open |
| --- | --- |
| Client | Passport, Verification, Offers, Ops reuse |
| Institution | Offer console only |
| Admin | Admin metrics plus both sides |

`/` opens the home screen for the current mode.

### Walkthrough routes

| View | Route | Public URL | Mode | What it shows |
| --- | --- | --- | --- | --- |
| Client Passport | `/passport` | […/passport](https://jumboshrimpman.github.io/wealth-passport/passport) | Client, Admin | Account / household / investable figures, one broad consent, ranked offers |
| Verification | `/verification` | […/verification](https://jumboshrimpman.github.io/wealth-passport/verification) | Client, Admin | Verified Merrill Lynch custodian; advisor Linda McDonald, BrokerCheck `111111` |
| Client offers inbox | `/offers` | […/offers](https://jumboshrimpman.github.io/wealth-passport/offers) | Client, Admin | Ranked paid placements; strategy / bps / fee discount primary |
| Institutional console | `/institution` | […/institution](https://jumboshrimpman.github.io/wealth-passport/institution) | Institution, Admin | Targeting and offer terms (local state only) |
| Ops reuse | `/ops` | […/ops](https://jumboshrimpman.github.io/wealth-passport/ops) | Client, Admin | Rollover packet with passport-filled fields |
| Admin | `/admin` | […/admin](https://jumboshrimpman.github.io/wealth-passport/admin) | Admin | Both sides plus extra mock metrics |
| Legacy Trust URL | `/trust` | […/trust](https://jumboshrimpman.github.io/wealth-passport/trust) | — | Redirects to `/verification` |
| Unknown path | any other URL | […/not-a-view](https://jumboshrimpman.github.io/wealth-passport/not-a-view) | — | Loud “not part of the walkthrough” — no silent fallback |

Deep links work because the deploy workflow copies `index.html` to `404.html`.

### What is deliberately fake

- Household, accounts, offers, and admin metrics are TypeScript constants.
- Consent, mode, and password-unlock flags live in React state plus `sessionStorage` / `localStorage`.
- Vendor names (Morningstar, Informa) appear as **illustrated first-party data sources**, not live feeds.
- Footer mentions future quant matching / instant quotes. Those screens are **not built**.

### Stack

Vite + React 19 + TypeScript + React Router. Custom CSS variables (camel brown / sage green). No backend.
