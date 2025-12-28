import { defineConfig } from "drizzle-kit";
import "load-env";

const dialect = "sqlite";

const url = process.env.POSTGRES_URL || "./data/better-chatbot.db";

const schema = "./src/lib/db/pg/schema.pg.ts";

const out = "./src/lib/db/migrations/pg";

export default defineConfig({
  schema,
  out,
  dialect,
  migrations: {},
  dbCredentials: {
    url,
  },
});
