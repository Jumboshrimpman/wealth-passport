import { ClerkProvider } from "@clerk/clerk-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { clerkAppearance, getClerkPublishableKey } from "./auth/clerk";
import { ClerkMissingKey } from "./components/ClerkMissingKey";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("MOCK BOOT FAILURE: #root is missing from index.html.");
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
const publishableKey = getClerkPublishableKey();
const afterAuthUrl = import.meta.env.BASE_URL;

createRoot(root).render(
  <StrictMode>
    {publishableKey ? (
      <ClerkProvider
        publishableKey={publishableKey}
        afterSignOutUrl={afterAuthUrl}
        signInFallbackRedirectUrl={afterAuthUrl}
        signUpFallbackRedirectUrl={afterAuthUrl}
        appearance={clerkAppearance}
      >
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <ClerkMissingKey />
    )}
  </StrictMode>,
);
