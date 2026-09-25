import { seedById } from "../../shared/seed/index.ts";
import { runDemoConnector, type DemoConnectResult } from "../../shared/marketplace.ts";

export async function connectDemo(provider: string, clientId: string): Promise<DemoConnectResult> {
  try {
    const response = await fetch("/api/demo/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, clientId }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as DemoConnectResult;
    if (!body || body.ok !== true || typeof body.kind !== "string") {
      throw new Error("Malformed connector payload");
    }
    return body;
  } catch {
    const client = seedById(clientId);
    if (!client) throw new Error(`No demo client for "${clientId}".`);
    const local = runDemoConnector(provider, client);
    if (!local) throw new Error(`Unknown connector "${provider}".`);
    return local;
  }
}
