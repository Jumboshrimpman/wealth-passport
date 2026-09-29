import { useLocation } from "react-router-dom";
import { modeFromPath, type AppMode } from "../data/catalog";
import { useMode } from "../context/ModeContext";

const OPTIONS: { id: AppMode; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "institution", label: "Institutional" },
  { id: "admin", label: "Admin" },
];

export function RoleSwitcher() {
  const { mode, setMode } = useMode();
  const { pathname } = useLocation();
  const current = modeFromPath(pathname) ?? mode;

  return (
    <div className="role-switch" role="radiogroup" aria-label="Role">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={current === option.id}
          onClick={() => setMode(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
