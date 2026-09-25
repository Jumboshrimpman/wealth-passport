import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { hasClerkKey } from "../auth/access";
import { CLERK_AFTER_AUTH_URL, CLERK_PAGES_ORIGIN, clerkAppearance } from "../auth/clerk";
import { ClerkMissingKey } from "../components/ClerkMissingKey";
import { LegalFooter } from "../components/LegalFooter";

export function SignInScreen() {
  if (!hasClerkKey()) return <ClerkMissingKey />;
  return <ClerkSignIn />;
}

function ClerkSignIn() {
  const { isSignedIn } = useAuth();
  if (isSignedIn) return <Navigate to="/assistant" replace />;
  return (
    <div className="public-page">
      <main className="sign-in-main">
        <h1>Sign in</h1>
        <SignIn
          routing="hash"
          forceRedirectUrl={CLERK_AFTER_AUTH_URL}
          fallbackRedirectUrl={CLERK_AFTER_AUTH_URL}
          withSignUp={false}
          transferable={false}
          signUpUrl=""
          appearance={clerkAppearance}
          fallback={
            <aside className="gate-error" role="alert">
              Clerk sign-in did not load. Check the publishable key and the allowed origin{" "}
              {CLERK_PAGES_ORIGIN}.
            </aside>
          }
        />
      </main>
      <LegalFooter />
    </div>
  );
}
