import cors from "cors";
import express from "express";
import type { DatabaseSync } from "node:sqlite";
import { getClientPassport, listClientSummaries, updateConsent } from "./db.ts";

export function createApp(db: DatabaseSync) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, store: "sqlite", scope: "client" });
  });

  app.get("/api/clients", (_req, res) => {
    res.json({ clients: listClientSummaries(db) });
  });

  app.get("/api/clients/:id", (req, res) => {
    const passport = getClientPassport(db, req.params.id);
    if (!passport) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    res.json({ client: passport });
  });

  app.patch("/api/clients/:id/consent", (req, res) => {
    const shared = req.body?.shared;
    if (typeof shared !== "boolean") {
      res.status(400).json({ error: "Body must include boolean `shared`." });
      return;
    }
    const passport = updateConsent(db, req.params.id, shared);
    if (!passport) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    res.json({ client: passport });
  });

  return app;
}
