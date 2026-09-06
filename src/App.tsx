import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Admin } from "./views/Admin";
import { Institution } from "./views/Institution";
import { Offers } from "./views/Offers";
import { Ops } from "./views/Ops";
import { Passport } from "./views/Passport";
import { Trust } from "./views/Trust";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/passport" replace />} />
        <Route path="/passport" element={<Passport />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/institution" element={<Institution />} />
        <Route path="/ops" element={<Ops />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<UnknownRoute />} />
      </Route>
    </Routes>
  );
}

function UnknownRoute() {
  return (
    <section className="panel">
      <p className="kicker">Mock routing</p>
      <h1>This view is not part of the walkthrough.</h1>
      <p className="lede">
        There is no silent fallback. Use the navigation to open a labeled demo screen.
      </p>
    </section>
  );
}
