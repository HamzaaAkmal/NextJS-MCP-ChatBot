import { migrate } from "drizzle-orm/libsql/migrator";
import { join } from "path";
import { pgDb } from "lib/db/pg/db.pg";

export const runMigrate = async () => {
  console.log("⏳ Running SQLite migrations...");

  const start = Date.now();
  await migrate(pgDb, {
    migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
  }).catch((err) => {
    console.error(
      `❌ SQLite migrations failed. Check the database file path.`,
      err.cause,
    );
    throw err;
  });
  const end = Date.now();

  console.log("✅ SQLite migrations completed in", end - start, "ms");
};
