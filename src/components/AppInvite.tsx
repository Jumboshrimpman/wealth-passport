import { useAssistant } from "../context/AssistantContext";

/** Demo invite only. There is no store listing and nothing is installed. */
export function AppInvite() {
  const { appInviteOpen, dismissAppInvite, openPhone } = useAssistant();
  if (!appInviteOpen) return null;

  return (
    <aside className="app-invite" role="dialog" aria-labelledby="app-invite-title" data-testid="app-invite">
      <button type="button" className="app-invite-close" aria-label="Dismiss" onClick={dismissAppInvite}>
        ×
      </button>
      <p className="app-invite-kicker">Demo</p>
      <h2 id="app-invite-title">Manage assets on the go</h2>
      <p>Download the app. No store listing yet. Nothing is installed from this screen.</p>
      <button type="button" className="text-button" onClick={openPhone}>
        See the phone demo
      </button>
    </aside>
  );
}
