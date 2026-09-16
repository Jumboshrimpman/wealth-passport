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

## Product

**WealthPass** presents consented client passports so institutions can pay to show a fit. **Client passports** (Elena Whitmore and Priya Shah) are stored in a local **SQLite** database and served by a small Express API. GitHub Pages is a static bundle and falls back to the same two client seeds if `/api` is unreachable.

Tagline: *Standardized and comprehensive investment potential across firms.*

**Live site (GitHub Pages):** [https://jumboshrimpman.github.io/wealth-passport/](https://jumboshrimpman.github.io/wealth-passport/) — published from `main`. Vite `base` is `/wealth-passport/`. Pages is static, so it falls back to the same two client seeds bundled in the client if `/api` is unreachable.

First-time Pages enable (repo admin, once): **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run **Deploy GitHub Pages**.

### Clerk on GitHub Pages (required)

The live walkthrough is **provisioned access only** — invite-only, no public sign-up. Delivery is **GitHub Pages only**. Hobby org is enough. There is no password fallback.

The site shows **Sign-in** for existing Clerk users. There is no Sign-up UI. If a visitor sees “couldn’t find your account”, an admin must create that user in Clerk (or send an invitation).

This is a **static Pages** bundle. Only the **publishable** key is baked in at build (`VITE_CLERK_PUBLISHABLE_KEY`). Never put `CLERK_SECRET_KEY` in Vite or the repo.

If the publishable key is missing, Actions **fails the build**.

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

The header **Client record** control switches between **Elena Whitmore** (`elena-whitmore`, $300M Greenwich) and **Priya Shah** (`priya-shah`, $72M Los Angeles), plus the eight generated households. Master share and per-scope consent toggle `PATCH /api/clients/:id/consent` (`shared` and/or `scopes`) and persist in `data/wealthpass.sqlite`.

```bash
npm test           # API + admin layout + KYC engine checks (in-memory SQLite)
npm run build      # production bundle
npm run preview    # serve the built bundle
```

Delete `data/wealthpass.sqlite` to re-seed all ten clients and the institution catalog from `shared/seed/`.

### Household figures

Ten client records ship in the database — about **$1B in verified household AUM** across retiree, tech-executive, trust, inherited, business-owner, and international segments:

| Client | Household | Household AUM | Verified custodian |
| --- | --- | --- | --- |
| Elena Whitmore | Greenwich, CT | $300M | Merrill Lynch |
| Beaumont family | Boston, MA | $210M | State Street Private |
| Okafor Family Trust | New York, NY | $140M | BNY Mellon |
| Ashworth family | London, UK | $89M | UBS |
| Priya Shah | Los Angeles, CA | $72M | Goldman Sachs |
| Nakamura family | Honolulu, HI | $65M | UBS |
| Chen family | San Francisco, CA | $50M | Morgan Stanley |
| Fernandez family | Miami, FL | $50M | J.P. Morgan |
| Delgado family | Austin, TX | $21.5M | Fidelity |
| Lindqvist estate | Chicago, IL | $12M | Northern Trust |

Elena and Priya are the hand-authored walkthrough records; the other eight are generated from compact specs in `shared/seed/households.ts` with the same record invariants (account sums, holdings totals, ops reuse counts) enforced at load.

The allocation bar is expandable: **asset class → sleeve/account → individual securities**. Holdings live on the client record.

### Three modes

A global **Client | Institution | Admin** toggle switches completely separate experiences. There is no mixed walkthrough nav.

| Mode | What you can open |
| --- | --- |
| Client | Chat (home), Passport, Verification, Offers, Ops |
| Institution | Offer console only |
| Admin | Overview with a customizable metric dashboard (charts + layout) |

`/` opens the home screen for the current mode.

### Walkthrough routes

| View | Route | Public URL | Mode | What it shows |
| --- | --- | --- | --- | --- |
| Client chat (home) | `/chat` | […/chat](https://jumboshrimpman.github.io/wealth-passport/chat) | Client, Admin | Assistant greets the selected client (Elena or Priya) with that household’s net worth. Suggestion chips only |
| Client Passport | `/passport` | […/passport](https://jumboshrimpman.github.io/wealth-passport/passport) | Client, Admin | Holistic profile loaded from SQLite (or seed fallback), expandable securities, household insights, master share plus four independently revocable scopes |
| Verification | `/verification` | […/verification](https://jumboshrimpman.github.io/wealth-passport/verification) | Client, Admin | Advisor and custodian badges from the selected client record |
| Client offers inbox | `/offers` | […/offers](https://jumboshrimpman.github.io/wealth-passport/offers) | Client, Admin | Paid placements matched to the selected client record; Accept / Decline persist in browser storage; blocked if consent is off |
| Enrollment | `/enroll` | […/enroll](https://jumboshrimpman.github.io/wealth-passport/enroll) | Client, Admin | KYC/AML onboarding wizard (blue **Enroll Now** button in the client header) with screening, risk scoring, and a compliance decision |
| Institutional console | `/institution` | […/institution](https://jumboshrimpman.github.io/wealth-passport/institution) | Institution, Admin | Targeting and offer terms (local state only) with a live match check, redacted client-card preview, and campaign funnel against the selected client |
| Ops reuse | `/ops` | […/ops](https://jumboshrimpman.github.io/wealth-passport/ops) | Client, Admin | Rollover packet with passport-filled fields |
| Admin | `/admin` | […/admin](https://jumboshrimpman.github.io/wealth-passport/admin) | Admin | Customizable dashboard: client records, verified AUM, institutions, placements, placement revenue, ops reuse, bank ranking; layout persists in the client database; **Mask PII** toggle; enrollment review queue + audit trail |
| Legacy Trust URL | `/trust` | […/trust](https://jumboshrimpman.github.io/wealth-passport/trust) | — | Redirects to `/verification` |
| Unknown path | any other URL | […/not-a-view](https://jumboshrimpman.github.io/wealth-passport/not-a-view) | — | Loud “not part of the walkthrough” — no silent fallback |

Deep links work because the deploy workflow copies `index.html` to `404.html`.

### Data notes

- Client households are seeded records in SQLite (`shared/seed/`), not live custody feeds.
- Paying institutions are seeded into the same SQLite store (`shared/seed/institutions.ts`) and served from `GET /api/institutions`. `GET /api/clients/:id/offers` matches each desk's targeting floors (investable, liquidity, private-markets sleeve, geography, consent, and required scopes) against the stored client record, so Elena's and Priya's inboxes differ. Withheld scopes skip the corresponding numeric floors so match reasons cannot leak a number the household revoked. The same GET increments campaign counters (`views` / `matches` / `impressions`) served at `GET /api/campaigns`. The static Pages build falls back to the same bundled seeds and runs the matcher locally.
- The admin dashboard layout persists server-side (`GET` / `PUT /api/admin/layout`) with a browser-storage fallback when the API is unreachable. Admin board counts (14 desks, 41 open placements) are still static data. `GET` / `PUT /api/admin/privacy` stores the **Mask PII** toggle; masking is display-time only.
- **Enrollment (KYC/AML):** `POST /api/enrollments` validates the seven-step wizard payload, screens every declared name against local sanctions / PEP / adverse-media lists (`shared/seed/watchlist.ts`), computes a transparent 0–100 risk score, and applies the decision rules (auto-approve / EDD / reject). Files persist in the `enrollments` table and surface in the Admin review queue (`GET /api/enrollments`), where a compliance officer can open the full file and sign off (`PATCH /api/enrollments/:id/decision` — approve activates the account ID; only EDD files are resolvable). On the static Pages build the same shared engine runs in the browser and records stay in local storage. Demo hits: **Ivan Petrov** or **Viktor Marek** → sanctions reject; **Maria Santos** → PEP EDD; **Robert Kahn** → adverse-media EDD; a partial name like **Ivan** → low-confidence EDD.
- Offer Accept / Decline are placement decisions in SQLite (`POST /api/placements`, per client, consent enforced server-side). Accepting books annualized placement revenue (fee bps × investable assets) that feeds the admin **Placement revenue** widget and the institution **cost per accept** column; per-client browser storage is the offline fallback.
- Every consent change, placement decision, enrollment submission/resolution, and admin layout update appends to an immutable `events` table, served at `GET /api/admin/events` and shown in the admin **Audit trail** panel.
- Consent is per client. Master share turns the inbox on or off; four scopes (`holdings`, `risk`, `verification`, `domicile`) are independently revocable and persist in SQLite when the API is running. The Passport household-insights panel reads concentration, liquidity runway, and rollover candidates from the stored book — not advice.
- The client chat is suggestion chips plus canned replies for the selected client.
- Vendor names (Morningstar, Informa) appear as first-party data sources, not live feeds.

### Stack

Vite + React 19 + TypeScript + React Router + `@clerk/clerk-react` + Express + Node SQLite (`node:sqlite`). Custom CSS variables (camel brown / sage green). Client API is local-only in this slice.
