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

**WealthPass** is an investor walkthrough mock. **Client passports** (Elena Whitmore and Priya Shah) are stored in a local **SQLite** database and served by a small Express API. Institution offers, targeting, and paid placements remain frontend fixtures. There are no live custody APIs, KYC, payments, or Morningstar / Informa integrations.

Tagline: *Standardized and comprehensive investment potential across firms.*

**Live site (GitHub Pages):** [https://jumboshrimpman.github.io/wealth-passport/](https://jumboshrimpman.github.io/wealth-passport/) — published from `main`. Vite `base` is `/wealth-passport/`. Pages is static, so it falls back to the same two client seeds bundled in the client if `/api` is unreachable.

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

#### Optional: local Vite + client API

Requires **Node 22+**. Copy `.env.example` to `.env.local` and set `VITE_CLERK_PUBLISHABLE_KEY`. Then:

```bash
npm install
npm run dev
```

That starts the SQLite API on [http://127.0.0.1:8787](http://127.0.0.1:8787) and Vite on [http://localhost:5173/wealth-passport/](http://localhost:5173/wealth-passport/). Vite proxies `/api` to the API. Add `http://localhost:5173` as a Clerk allowed origin if you sign in locally.

The header **Client record** control switches between **Elena Whitmore** (`elena-whitmore`, $300M Greenwich) and **Priya Shah** (`priya-shah`, $72M Los Angeles). Consent toggles `PATCH /api/clients/:id/consent` and persist in `data/wealthpass.sqlite`.

```bash
npm run test:api   # in-memory SQLite + HTTP checks
npm run build      # production bundle
npm run preview    # serve the built bundle
```

Delete `data/wealthpass.sqlite` to re-seed both clients from `shared/seed/`.

### Household figures (MOCK)

Two client records ship in the database:

| Client | Household | Account value | Household AUM | Verified custodian |
| --- | --- | --- | --- | --- |
| Elena Whitmore | Greenwich, CT | $186.4M | $300M | Merrill Lynch |
| Priya Shah | Los Angeles, CA | $48M | $72M | Goldman Sachs |

The allocation bar is expandable: **asset class → sleeve/account → individual securities**. Holdings live on the client record.

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
| Client chat (home) | `/chat` | […/chat](https://jumboshrimpman.github.io/wealth-passport/chat) | Client, Admin | MOCK assistant greets the selected client (Elena or Priya) with that household’s net worth. Suggestion chips only |
| Client Passport | `/passport` | […/passport](https://jumboshrimpman.github.io/wealth-passport/passport) | Client, Admin | Holistic profile loaded from SQLite (or seed fallback), expandable securities, per-client consent |
| Verification | `/verification` | […/verification](https://jumboshrimpman.github.io/wealth-passport/verification) | Client, Admin | Advisor and custodian badges from the selected client record |
| Client offers inbox | `/offers` | […/offers](https://jumboshrimpman.github.io/wealth-passport/offers) | Client, Admin | Ranked paid placements; Accept / Decline persist in browser storage; blocked if consent is off |
| Institutional console | `/institution` | […/institution](https://jumboshrimpman.github.io/wealth-passport/institution) | Institution, Admin | Targeting and offer terms (local state only) |
| Ops reuse | `/ops` | […/ops](https://jumboshrimpman.github.io/wealth-passport/ops) | Client, Admin | Rollover packet with passport-filled fields |
| Admin | `/admin` | […/admin](https://jumboshrimpman.github.io/wealth-passport/admin) | Admin | Both sides plus extra mock metrics |
| Legacy Trust URL | `/trust` | […/trust](https://jumboshrimpman.github.io/wealth-passport/trust) | — | Redirects to `/verification` |
| Unknown path | any other URL | […/not-a-view](https://jumboshrimpman.github.io/wealth-passport/not-a-view) | — | Loud “not part of the walkthrough” — no silent fallback |

Deep links work because the deploy workflow copies `index.html` to `404.html`.

### What is deliberately fake

- Client households are mock records in SQLite (seeded from `shared/seed/`), not live custody.
- Institution offers and admin board metrics remain TypeScript fixtures.
- Offer Accept / Decline still live in browser storage. Consent is per client and persists in SQLite when the API is running.
- The client chat is suggestion chips plus canned replies for the selected client. There is no text box and no model API.
- Vendor names (Morningstar, Informa) appear as **illustrated first-party data sources**, not live feeds.
- Footer mentions future quant matching / instant quotes. Those screens are **not built**. Institution matching is not wired to the new client store yet.

### Stack

Vite + React 19 + TypeScript + React Router + `@clerk/clerk-react` + Express + Node SQLite (`node:sqlite`). Custom CSS variables (camel brown / sage green). Client API is local-only in this slice.
