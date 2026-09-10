import { useClient } from "../context/ClientContext";
import { formatUsd } from "../data/mock";

export function ClientSwitcher() {
  const { clients, passport, source, selectClient } = useClient();

  return (
    <label className="client-switcher">
      <span className="client-switcher-label">Client record</span>
      <select
        aria-label="Selected client record"
        value={passport.id}
        onChange={(event) => selectClient(event.target.value)}
      >
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.clientFirstName} · {client.name} · {formatUsd(client.householdValue, true)}
          </option>
        ))}
      </select>
      <span className="tiny muted">{source === "api" ? "SQLite" : "bundled seed"}</span>
    </label>
  );
}
