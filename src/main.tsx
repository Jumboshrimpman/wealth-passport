import { ClerkProvider } from "@clerk/clerk-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { clerkAppearance, getClerkPublishableKey } from "./auth/clerk";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("MOCK BOOT FAILURE: #root is missing from index.html.");
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
const publishableKey = getClerkPublishableKey();

createRoot(root).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl={import.meta.env.BASE_URL}
      signInFallbackRedirectUrl={import.meta.env.BASE_URL}
      appearance={clerkAppearance}
    >
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);
