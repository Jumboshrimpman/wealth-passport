import { Link } from "react-router-dom";
import { LegalFooter } from "../components/LegalFooter";
import { PRODUCT_NAME } from "../data/catalog";

export function PublicHome() {
  return (
    <div className="public-page">
      <main className="public-hero">
        <h1>{PRODUCT_NAME}</h1>
        <p className="public-desc">A marketplace where clients get the best financial offers.</p>
        <div className="public-actions">
          <Link to="/sign-in">Sign in</Link>
          <Link to="/enroll">Enroll</Link>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
