import { Navigate, Route, Routes } from "react-router-dom";
import { ClerkGate } from "./components/ClerkGate";
import { Layout } from "./components/Layout";
import { ModeRoute } from "./components/ModeRoute";
import { ConsentProvider } from "./context/ConsentContext";
import { ModeProvider, useMode } from "./context/ModeContext";
import { MODE_HOMES } from "./data/mock";
import { Admin } from "./views/Admin";
import { Institution } from "./views/Institution";
import { Offers } from "./views/Offers";
import { Ops } from "./views/Ops";
import { Passport } from "./views/Passport";
import { Verification } from "./views/Verification";

export default function App() {
  return (
    <ClerkGate>
      <ConsentProvider>
        <ModeProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route
                path="/passport"
                element={
                  <ModeRoute path="/passport">
                    <Passport />
                  </ModeRoute>
                }
              />
              <Route path="/trust" element={<Navigate to="/verification" replace />} />
              <Route
                path="/verification"
                element={
                  <ModeRoute path="/verification">
                    <Verification />
                  </ModeRoute>
                }
              />
              <Route
                path="/offers"
                element={
                  <ModeRoute path="/offers">
                    <Offers />
                  </ModeRoute>
                }
              />
              <Route
                path="/institution"
                element={
                  <ModeRoute path="/institution">
                    <Institution />
                  </ModeRoute>
                }
              />
              <Route
                path="/ops"
                element={
                  <ModeRoute path="/ops">
                    <Ops />
                  </ModeRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ModeRoute path="/admin">
                    <Admin />
                  </ModeRoute>
                }
              />
              <Route path="*" element={<UnknownRoute />} />
            </Route>
          </Routes>
        </ModeProvider>
      </ConsentProvider>
    </ClerkGate>
  );
}

function HomeRedirect() {
  const { mode } = useMode();
  return <Navigate to={MODE_HOMES[mode]} replace />;
}

function UnknownRoute() {
  return (
    <section className="panel">
      <p className="kicker">Mock routing</p>
      <h1>This view is not part of the walkthrough.</h1>
      <p className="lede">
        There is no silent fallback. Use the mode toggle and navigation to open a labeled demo
        screen.
      </p>
    </section>
  );
}
