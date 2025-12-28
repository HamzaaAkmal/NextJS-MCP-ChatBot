// import { Logger } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

// class MyLogger implements Logger {
//   logQuery(query: string, params: unknown[]): void {
//     console.log({ query, params });
//   }
// }

const client = createClient({
  url: "file:" + (process.env.POSTGRES_URL || "./data/better-chatbot.db")
});

export const pgDb = drizzle(client, {
  //   logger: new MyLogger(),
});
