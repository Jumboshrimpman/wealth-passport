import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { usePortalAccess } from "./auth/access";
import { PortalShell } from "./components/PortalShell";
import { AssistantProvider } from "./context/AssistantContext";
import { ClientProvider } from "./context/ClientContext";
import { ConsentProvider } from "./context/ConsentContext";
import { DemoProvider } from "./context/DemoContext";
import { OfferDecisionProvider } from "./context/OfferDecisionContext";
import { OfferProvider } from "./context/OfferContext";
import { Admin } from "./views/Admin";
import { Assistant } from "./views/Assistant";
import { Enroll } from "./views/Enroll";
import { Financials } from "./views/Financials";
import { Institution } from "./views/Institution";
import { Offers } from "./views/Offers";
import { PublicHome } from "./views/PublicHome";
import { Settings } from "./views/Settings";
import { Strategies } from "./views/Strategies";
import { SignInScreen } from "./views/SignInScreen";

export default function App() {
  return (
    <ClientProvider>
      <ConsentProvider>
        <OfferProvider>
          <OfferDecisionProvider>
            <DemoProvider>
              <AssistantProvider>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/sign-in" element={<SignInScreen />} />
                  <Route path="/enroll" element={<Enroll />} />
                  <Route element={<RequirePortal />}>
                    <Route element={<PortalShell />}>
                      <Route path="/assistant" element={<Assistant />} />
                      <Route path="/offers" element={<Offers />} />
                      <Route path="/strategies" element={<Strategies />} />
                      <Route path="/financials" element={<Financials />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/institution" element={<Institution />} />
                    </Route>
                  </Route>
                  <Route path="/chat" element={<Navigate to="/assistant" replace />} />
                  <Route path="/passport" element={<Navigate to="/financials" replace />} />
                  <Route path="/verification" element={<Navigate to="/financials" replace />} />
                  <Route path="/trust" element={<Navigate to="/financials" replace />} />
                  <Route path="/ops" element={<Navigate to="/settings" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AssistantProvider>
            </DemoProvider>
          </OfferDecisionProvider>
        </OfferProvider>
      </ConsentProvider>
    </ClientProvider>
  );
}

function Landing() {
  const { demo, clerkLoaded, clerkSignedIn } = usePortalAccess();
  if (demo || (clerkLoaded && clerkSignedIn)) return <Navigate to="/assistant" replace />;
  return <PublicHome />;
}

function RequirePortal() {
  const { ready, allowed, demo } = usePortalAccess();
  if (demo) return <Outlet />;
  if (!ready) return <p className="quiet-load">WealthPass</p>;
  if (!allowed) return <Navigate to="/" replace />;
  return <Outlet />;
}
