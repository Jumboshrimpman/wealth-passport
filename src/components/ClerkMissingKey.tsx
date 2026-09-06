import {
  CLERK_ALLOWED_ORIGINS,
  CLERK_PAGES_HOME,
  CLERK_REDIRECT_URLS,
} from "../auth/clerk";
import { DEMO_NOTICE, PRODUCT_NAME } from "../data/mock";

export function ClerkMissingKey() {
  return (
    <div className="gate">
      <div className="mock-banner" role="status">
        <div className="mock-banner-inner">
          <strong>Mock demo · {PRODUCT_NAME}</strong>
          <span>{DEMO_NOTICE}</span>
        </div>
      </div>
      <main className="gate-main">
        <section className="panel gate-card gate-card-wide">
          <p className="kicker">Clerk setup · GitHub Pages</p>
          <h1>VITE_CLERK_PUBLISHABLE_KEY is missing.</h1>
          <p className="lede">
            WealthPass will not open on {CLERK_PAGES_HOME}. This static Pages mock needs the Clerk
            publishable key at build time. There is no password fallback and no invented key.
          </p>
          <aside className="gate-error" role="alert">
            CLERK BOOT FAILURE: add repo Actions secret VITE_CLERK_PUBLISHABLE_KEY, then merge to
            main so Pages rebuilds. Do not commit secrets.
          </aside>
          <ol className="setup-list">
            <li>Create a Clerk Hobby application.</li>
            <li>
              Disable public sign-up: Clerk Dashboard → <strong>Configure → Access mode</strong> →{" "}
              <strong>Invite-only</strong> (older UI: Restrictions → Sign-up mode → Restricted).
              Create walkthrough users under <strong>Users</strong> (or Invitations).
            </li>
            <li>
              Copy the <strong>publishable</strong> key only. Never add <code>CLERK_SECRET_KEY</code>{" "}
              to this Pages client.
            </li>
            <li>
              GitHub → Settings → Secrets and variables → Actions →{" "}
              <code>VITE_CLERK_PUBLISHABLE_KEY</code>. The Pages workflow passes that secret into{" "}
              <code>npm run build</code>.
            </li>
            <li>
              Clerk allowed origin (Pages):{" "}
              {CLERK_ALLOWED_ORIGINS.map((url) => (
                <code key={url}>{url}</code>
              ))}
            </li>
            <li>
              Clerk redirect URLs for <code>/wealth-passport</code>:
              <ul>
                {CLERK_REDIRECT_URLS.map((url) => (
                  <li key={url}>
                    <code>{url}</code>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              Merge to <code>main</code> so https://jumboshrimpman.github.io/wealth-passport/ rebuilds.
            </li>
          </ol>
        </section>
      </main>
    </div>
  );
}
