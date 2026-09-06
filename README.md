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

The live walkthrough is **provisioned access only** — invite-only, no public sign-up. Delivery is **GitHub Pages only**. Hobby org is enough. There is no password fallback.

The site shows **Sign-in** for existing Clerk users. There is no Sign-up UI. If a visitor sees “couldn’t find your account”, an admin must create that user in Clerk (or send an invitation).

This is a **static Pages** bundle. Only the **publishable** key is baked in at build (`VITE_CLERK_PUBLISHABLE_KEY`). Never put `CLERK_SECRET_KEY` in Vite or the repo.

If the publishable key is missing, Actions **fails the build** (the unlocked mock is not shipped).

#### Clerk Dashboard (Pages first)

1. Create a Clerk application in the Hobby org.
2. **Disable public sign-ups (required, org-wide for this Clerk app).** The UI lock on the site is not enough — turn sign-up off in the Dashboard:
   - **Configure → Access mode → Invite-only**, then Save.  
     (API value `restricted`. Older Dashboard: **Configure → Restrictions → Sign-up mode → Restricted**, or disable sign-up.)
   - Invite-only means only users you create or invite can authenticate. Open / public sign-up must stay off.
3. **Create users** (admins only): Clerk Dashboard → **Users → Create user**, or send **Invitations**. Visitors cannot self-register on GitHub Pages.
4. Copy the **Publishable key** only (`pk_…`).
5. Repo **Settings → Secrets and variables → Actions →** `VITE_CLERK_PUBLISHABLE_KEY`. Cursor secure input does **not** set this. The Deploy GitHub Pages workflow passes:
   ```yaml
   env:
     VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.VITE_CLERK_PUBLISHABLE_KEY }}
   ```
6. **Allowed origin** (origin only, no path):
   - `https://jumboshrimpman.github.io`
7. **Redirect URLs** (after sign-in and sign-out) for `/wealth-passport`:
   - `https://jumboshrimpman.github.io/wealth-passport`
   - `https://jumboshrimpman.github.io/wealth-passport/`
   - `https://jumboshrimpman.github.io/wealth-passport/chat`
   - `https://jumboshrimpman.github.io/wealth-passport/passport`
8. Merge this branch into `main` so Pages rebuilds.

The app uses Clerk hash routing on the Pages URL, then returns to `https://jumboshrimpman.github.io/wealth-passport/` (Client mode opens `/chat`). Sign-in only — `signUpUrl` is not set on `ClerkProvider`.

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
| Client | Chat (home), Passport, Verification, Offers, Ops |
| Institution | Offer console only |
| Admin | Overview of both sides plus extra mock metrics (no Client/Institution tabs) |

`/` opens the home screen for the current mode.

### Walkthrough routes

| View | Route | Public URL | Mode | What it shows |
| --- | --- | --- | --- | --- |
| Client chat (home) | `/chat` | […/chat](https://jumboshrimpman.github.io/wealth-passport/chat) | Client, Admin | MOCK assistant: `Hi Elena, your net worth is $300M. Ask me anything`. Suggestion chips + scripted fixture replies. Unhandled questions fail loudly — no live model |
| Client Passport | `/passport` | […/passport](https://jumboshrimpman.github.io/wealth-passport/passport) | Client, Admin | Holistic profile: $300M household figures, expandable securities, one broad consent, ranked offers with Accept / Decline |
| Verification | `/verification` | […/verification](https://jumboshrimpman.github.io/wealth-passport/verification) | Client, Admin | Verified Merrill Lynch custodian; advisor Linda McDonald, BrokerCheck `111111` |
| Client offers inbox | `/offers` | […/offers](https://jumboshrimpman.github.io/wealth-passport/offers) | Client, Admin | Ranked paid placements; Accept / Decline persist in browser storage; blocked if consent is off |
| Institutional console | `/institution` | […/institution](https://jumboshrimpman.github.io/wealth-passport/institution) | Institution, Admin | Targeting and offer terms (local state only) |
| Ops reuse | `/ops` | […/ops](https://jumboshrimpman.github.io/wealth-passport/ops) | Client, Admin | Rollover packet with passport-filled fields |
| Admin | `/admin` | […/admin](https://jumboshrimpman.github.io/wealth-passport/admin) | Admin | Both sides plus extra mock metrics |
| Legacy Trust URL | `/trust` | […/trust](https://jumboshrimpman.github.io/wealth-passport/trust) | — | Redirects to `/verification` |
| Unknown path | any other URL | […/not-a-view](https://jumboshrimpman.github.io/wealth-passport/not-a-view) | — | Loud “not part of the walkthrough” — no silent fallback |

Deep links work because the deploy workflow copies `index.html` to `404.html`.

### What is deliberately fake

- Household, accounts, holdings, offers, and admin metrics are TypeScript constants.
- Consent, mode, and offer Accept / Decline live in React state plus `sessionStorage` / `localStorage`.
- The client chat is a scripted MOCK assistant. There is no model API. Unhandled questions say so.
- Vendor names (Morningstar, Informa) appear as **illustrated first-party data sources**, not live feeds.
- Footer mentions future quant matching / instant quotes. Those screens are **not built**.

### Stack

Vite + React 19 + TypeScript + React Router + `@clerk/clerk-react`. Custom CSS variables (camel brown / sage green). No backend.
