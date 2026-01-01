import { migrate } from "drizzle-orm/postgres-js/migrator";
import { join } from "path";
import { pgDb } from "lib/db/pg/db.pg";
import { sql } from "drizzle-orm";

export const runMigrate = async () => {
  console.log("⏳ Running PostgreSQL migrations...");

  const start = Date.now();

  try {
    await migrate(pgDb, {
      migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
    });
    const end = Date.now();
    console.log("✅ PostgreSQL migrations completed in", end - start, "ms");
  } catch (err: any) {
    // If tables already exist, that's fine - schema was pushed directly
    if (err?.code === "42P07") {
      console.log("✅ Database schema already up to date");
      return;
    }
    console.error(
      `❌ PostgreSQL migrations failed. Check the database connection.`,
      err.cause,
    );
    throw err;
  }
};
