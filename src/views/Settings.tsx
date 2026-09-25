import { useClerk, useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hasClerkKey, usePortalAccess } from "../auth/access";
import { useClient } from "../context/ClientContext";

const ALERT_KEY = "wealthpass-offer-alerts";

export function Settings() {
  const { passport } = useClient();
  const navigate = useNavigate();
  const { clearDemo } = usePortalAccess();
  const [alerts, setAlerts] = useState(() => {
    try {
      return localStorage.getItem(ALERT_KEY) !== "0";
    } catch {
      return true;
    }
  });

  function toggleAlerts() {
    const next = !alerts;
    setAlerts(next);
    try {
      localStorage.setItem(ALERT_KEY, next ? "1" : "0");
    } catch {
      // The toggle still reflects this session.
    }
  }

  return (
    <div className="settings-page">
      <h1>Account</h1>
      <dl>
        <div>
          <dt>Name</dt>
          <dd>{passport.household.principals}</dd>
        </div>
        <div>
          <dt>Household</dt>
          <dd>
            {passport.household.name} · {passport.household.domicile}
          </dd>
        </div>
        <EmailRow />
      </dl>
      <label className="alert-toggle">
        <input type="checkbox" checked={alerts} onChange={toggleAlerts} />
        Email me when a new offer is ready
      </label>
      <SignOut
        onDone={() => {
          clearDemo();
          navigate("/");
        }}
      />
    </div>
  );
}

function EmailRow() {
  if (!hasClerkKey()) {
    return (
      <div>
        <dt>Email</dt>
        <dd>Sign in with Clerk to attach an email.</dd>
      </div>
    );
  }
  return <ClerkEmail />;
}

function ClerkEmail() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "No email on this Clerk user.";
  return (
    <div>
      <dt>Email</dt>
      <dd>{email}</dd>
    </div>
  );
}

function SignOut({ onDone }: { onDone: () => void }) {
  if (!hasClerkKey()) {
    return (
      <button type="button" className="text-button" onClick={onDone}>
        Sign out
      </button>
    );
  }
  return <ClerkSignOut onDone={onDone} />;
}

function ClerkSignOut({ onDone }: { onDone: () => void }) {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      className="text-button"
      onClick={() => {
        onDone();
        void signOut();
      }}
    >
      Sign out
    </button>
  );
}
