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

**WealthPass** is a **frontend-only MOCK** for investor walkthroughs. Holdings, institutions, and offers are static fixtures in `src/data/mock.ts` and `src/data/holdings.ts`. There are no custody APIs, KYC, payments, or Morningstar / Informa integrations.

Tagline: *Standardized and comprehensive investment potential across firms.*

**Public demo (GitHub Pages):** [https://jumboshrimpman.github.io/wealth-passport/](https://jumboshrimpman.github.io/wealth-passport/) — published from `main` on each push. Vite `base` stays `/wealth-passport/` so that URL keeps working.

First-time enable (repo admin, once): **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run the **Deploy GitHub Pages** workflow. The Actions `GITHUB_TOKEN` cannot create the Pages site by itself. Fallback: **Source → Deploy from a branch → `gh-pages` / root** (that branch already has a production build).

### Clerk access (required)

The walkthrough is blocked until the visitor signs in with **Clerk** (`@clerk/clerk-react`). A Hobby org application is enough. There is no local password fallback.

This is a **static GitHub Pages** site. Only the **publishable** key is used (`VITE_CLERK_PUBLISHABLE_KEY`). Never put `CLERK_SECRET_KEY` in Vite, Actions client env, or the repo.

If the publishable key is missing:

- `npm run build` / GitHub Actions **fails loudly** (no silent open)
- The running app renders a setup panel and does **not** show the mock

#### Create the Clerk application

1. In [Clerk Dashboard](https://dashboard.clerk.com), create an application in the Hobby org.
2. Open **API Keys** and copy the **Publishable key** only (`pk_…`).
3. **Local:** copy `.env.example` to `.env.local` and set `VITE_CLERK_PUBLISHABLE_KEY`.
4. **GitHub Pages / CI:** repo **Settings → Secrets and variables → Actions → New repository secret** named `VITE_CLERK_PUBLISHABLE_KEY`. The Deploy GitHub Pages and CI workflows pass that secret into `npm run build`. After the secret is set, redeploy (push to `main` or run the workflow).
5. Clerk Dashboard → **Domains / Allowed origins**:
   - `https://jumboshrimpman.github.io`
   - `http://localhost:5173`
6. Clerk Dashboard → **Paths / Allowed redirect URLs** (after sign-in, after sign-up, sign-out). Include the Pages base and `/passport`:
   - `https://jumboshrimpman.github.io/wealth-passport`
   - `https://jumboshrimpman.github.io/wealth-passport/`
   - `https://jumboshrimpman.github.io/wealth-passport/passport`
   - `http://localhost:5173/wealth-passport`
   - `http://localhost:5173/wealth-passport/`
   - `http://localhost:5173/wealth-passport/passport`

The app signs in with Clerk hash routing, then returns to Vite `base` (`/wealth-passport/`), which opens the current mode home (Client → `/passport`).

### Run locally

```bash
npm install
# create .env.local with VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

Then open [http://localhost:5173/wealth-passport/](http://localhost:5173/wealth-passport/) (Vite `base` is `/wealth-passport/` so the local path matches GitHub Pages). A persistent **MOCK DEMO · WealthPass** banner stays on every screen.

```bash
npm run build    # production bundle — requires VITE_CLERK_PUBLISHABLE_KEY
npm run preview  # serve the built bundle
```

Requires Node 20+.

### Household figures (MOCK)

This walkthrough household is scaled to **~$300M AUM**:

| Figure | Illustrated value | Meaning |
| --- | --- | --- |
| Account value | $186.4M | Sum of listed custodied accounts |
| Total investable assets | $228M | Listed accounts + $41.6M held-away |
| Household value / AUM | $300M | Investable + Greenwich residence + other personal assets |

The allocation bar is expandable: **asset class → sleeve/account → individual securities** (weights and values). All holdings are fixtures.

### Three modes

A global **Client | Institution | Admin** toggle switches completely separate experiences. There is no mixed walkthrough nav.

| Mode | What you can open |
| --- | --- |
| Client | Passport, Verification, Offers, Ops reuse |
| Institution | Offer console only |
| Admin | Overview of both sides plus extra mock metrics (no Client/Institution tabs) |

`/` opens the home screen for the current mode.

### Walkthrough routes

| View | Route | Public URL | Mode | What it shows |
| --- | --- | --- | --- | --- |
| Client Passport | `/passport` | […/passport](https://jumboshrimpman.github.io/wealth-passport/passport) | Client, Admin | $300M household figures, expandable securities, one broad consent, ranked offers |
| Verification | `/verification` | […/verification](https://jumboshrimpman.github.io/wealth-passport/verification) | Client, Admin | Verified Merrill Lynch custodian; advisor Linda McDonald, BrokerCheck `111111` |
| Client offers inbox | `/offers` | […/offers](https://jumboshrimpman.github.io/wealth-passport/offers) | Client, Admin | Ranked paid placements; strategy / bps / fee discount primary |
| Institutional console | `/institution` | […/institution](https://jumboshrimpman.github.io/wealth-passport/institution) | Institution, Admin | Targeting and offer terms (local state only) |
| Ops reuse | `/ops` | […/ops](https://jumboshrimpman.github.io/wealth-passport/ops) | Client, Admin | Rollover packet with passport-filled fields |
| Admin | `/admin` | […/admin](https://jumboshrimpman.github.io/wealth-passport/admin) | Admin | Both sides plus extra mock metrics |
| Legacy Trust URL | `/trust` | […/trust](https://jumboshrimpman.github.io/wealth-passport/trust) | — | Redirects to `/verification` |
| Unknown path | any other URL | […/not-a-view](https://jumboshrimpman.github.io/wealth-passport/not-a-view) | — | Loud “not part of the walkthrough” — no silent fallback |

Deep links work because the deploy workflow copies `index.html` to `404.html`.

### What is deliberately fake

- Household, accounts, holdings, offers, and admin metrics are TypeScript constants.
- Consent and mode flags live in React state plus `sessionStorage` / `localStorage`.
- Vendor names (Morningstar, Informa) appear as **illustrated first-party data sources**, not live feeds.
- Footer mentions future quant matching / instant quotes. Those screens are **not built**.

### Stack

Vite + React 19 + TypeScript + React Router + `@clerk/clerk-react`. Custom CSS variables (camel brown / sage green). No backend.
