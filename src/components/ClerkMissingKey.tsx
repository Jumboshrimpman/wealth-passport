import {
  CLERK_ALLOWED_ORIGINS,
  CLERK_LOCAL_BASE,
  CLERK_PAGES_BASE,
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
          <p className="kicker">Clerk setup · required</p>
          <h1>VITE_CLERK_PUBLISHABLE_KEY is missing.</h1>
          <p className="lede">
            WealthPass will not open. This is a static GitHub Pages mock. Only the Clerk
            publishable key belongs in the client bundle. There is no password fallback and no
            invented key.
          </p>
          <aside className="gate-error" role="alert">
            CLERK BOOT FAILURE: the publishable key env var is empty. Add it, then rebuild /
            redeploy. Do not commit secrets.
          </aside>
          <ol className="setup-list">
            <li>
              Create a Clerk application in the Hobby org (Dashboard → Create application).
            </li>
            <li>
              Copy the <strong>publishable</strong> key only. Never add <code>CLERK_SECRET_KEY</code>{" "}
              to Vite or this repo.
            </li>
            <li>
              Local: <code>.env.local</code> with{" "}
              <code>VITE_CLERK_PUBLISHABLE_KEY=pk_…</code> (see <code>.env.example</code>).
            </li>
            <li>
              GitHub: repo Settings → Secrets and variables → Actions →{" "}
              <code>VITE_CLERK_PUBLISHABLE_KEY</code>. The Pages / CI workflows pass that secret
              into <code>npm run build</code>.
            </li>
            <li>
              Clerk Dashboard allowed origins:{" "}
              {CLERK_ALLOWED_ORIGINS.map((url) => (
                <code key={url}>{url}</code>
              ))}
              .
            </li>
            <li>
              After sign-in / redirect URLs must include {CLERK_PAGES_BASE} and {CLERK_LOCAL_BASE}{" "}
              (and <code>/passport</code>):
              <ul>
                {CLERK_REDIRECT_URLS.map((url) => (
                  <li key={url}>
                    <code>{url}</code>
                  </li>
                ))}
              </ul>
            </li>
            <li>Redeploy from <code>main</code> after the Actions secret is set.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
