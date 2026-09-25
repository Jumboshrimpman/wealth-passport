import { ClerkProvider } from "@clerk/clerk-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AccessProvider, ClerkBridge } from "./auth/access";
import {
  CLERK_AFTER_AUTH_URL,
  CLERK_AFTER_SIGN_OUT_URL,
  CLERK_PAGES_HOME,
  clerkAppearance,
  clerkLocalization,
} from "./auth/clerk";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Boot failure: #root is missing from index.html.");
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

const appTree = (
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

createRoot(root).render(
  <StrictMode>
    <AccessProvider>
      {publishableKey ? (
        <ClerkProvider
          publishableKey={publishableKey}
          afterSignOutUrl={CLERK_AFTER_SIGN_OUT_URL}
          signInFallbackRedirectUrl={CLERK_AFTER_AUTH_URL}
          signInUrl={CLERK_PAGES_HOME}
          appearance={clerkAppearance}
          localization={clerkLocalization}
        >
          <ClerkBridge />
          {appTree}
        </ClerkProvider>
      ) : (
        appTree
      )}
    </AccessProvider>
  </StrictMode>,
);
