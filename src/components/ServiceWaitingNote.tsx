import { useServiceRequests } from "../context/ServiceRequestContext";

export function ServiceWaitingNote() {
  const { requests } = useServiceRequests();
  if (requests.length === 0) return null;
  const labels = requests.map((request) => request.label).join(", ");
  return (
    <p className="waiting-note">
      Requested, waiting: {labels}. No offer yet. Demo only.
    </p>
  );
}
