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

**Live site (GitHub Pages only):** [https://jumboshrimpman.github.io/wealth-passport/](https://jumboshrimpman.github.io/wealth-passport/) — published from `main`. Vite `base` is `/wealth-passport/`. Sama delivers here; local Vite is not required.

First-time Pages enable (repo admin, once): **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run **Deploy GitHub Pages**.

### Clerk on GitHub Pages (required)

The live walkthrough is blocked until the visitor signs in with **Clerk**. Hobby org is enough. There is no password fallback.

This is a **static Pages** bundle. Only the **publishable** key is baked in at build (`VITE_CLERK_PUBLISHABLE_KEY`). Never put `CLERK_SECRET_KEY` in Vite or the repo.

If the publishable key is missing, Actions **fails the build** (the unlocked mock is not shipped).

#### Clerk Dashboard (Pages first)

1. Create a Clerk application in the Hobby org.
2. Copy the **Publishable key** only (`pk_…`).
3. Repo **Settings → Secrets and variables → Actions →** `VITE_CLERK_PUBLISHABLE_KEY`. Cursor secure input does **not** set this. The Deploy GitHub Pages workflow passes:
   ```yaml
   env:
     VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
   ```
4. **Allowed origin** (origin only, no path):
   - `https://jumboshrimpman.github.io`
5. **Redirect URLs** (after sign-in, sign-up, and sign-out) for `/wealth-passport`:
   - `https://jumboshrimpman.github.io/wealth-passport`
   - `https://jumboshrimpman.github.io/wealth-passport/`
   - `https://jumboshrimpman.github.io/wealth-passport/passport`
6. Merge this branch into `main` so Pages rebuilds.

The app uses Clerk hash routing on the Pages URL, then returns to `https://jumboshrimpman.github.io/wealth-passport/` (Client mode opens `/passport`).

#### Optional: local Vite

Not used for delivery. If needed: `.env.local` with `VITE_CLERK_PUBLISHABLE_KEY`, `npm run dev`, open `http://localhost:5173/wealth-passport/`, and add that origin in Clerk only if you actually run it.

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
