import { defineConfig } from "drizzle-kit";
import "load-env";

const dialect = "postgresql";

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";

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
