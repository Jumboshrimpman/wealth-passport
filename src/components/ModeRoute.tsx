import type { ReactNode } from "react";
import { modesAllowedForPath, PRODUCT_NAME } from "../data/mock";
import { useMode } from "../context/ModeContext";

const MODE_LABEL: Record<string, string> = {
  client: "Client",
  institution: "Institution",
  admin: "Admin",
};

export function ModeRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { mode, setMode } = useMode();
  const allowed = modesAllowedForPath(path);

  if (!allowed.includes(mode)) {
    const suggested = allowed[0];
    return (
      <section className="panel">
        <p className="kicker">Mock routing · mode wall</p>
        <h1>This screen is not part of {MODE_LABEL[mode]} mode.</h1>
        <p className="lede">
          {PRODUCT_NAME} keeps Client, Institution, and Admin as separate walkthroughs. There is
          no mixed nav and no silent fallback into another mode.
        </p>
        <button type="button" className="gate-submit" onClick={() => setMode(suggested)}>
          Switch to {MODE_LABEL[suggested]} mode
        </button>
      </section>
    );
  }

  return children;
}
