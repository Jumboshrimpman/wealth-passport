import { createApp } from "./app.ts";
import { defaultDatabasePath, openDatabase, seedIfEmpty } from "./db.ts";

const port = Number(process.env.API_PORT ?? 8787);
const db = openDatabase();
seedIfEmpty(db);

const app = createApp(db);
app.listen(port, () => {
  console.log(`WealthPass client API on http://127.0.0.1:${port} (sqlite ${defaultDatabasePath()})`);
});
