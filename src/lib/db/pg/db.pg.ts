// import { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

// Supabase connection string from environment
const connectionString =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "";

// Create postgres client for Supabase
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

export const pgDb = drizzle(client, {
  //   logger: new MyLogger(),
});
