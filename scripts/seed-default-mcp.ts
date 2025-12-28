/**
 * Script to seed default MCP servers for users
 * Run with: pnpm seed:mcp
 */

import { pgDb as db } from "../src/lib/db/pg/db.pg";
import { McpServerTable, UserTable } from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import { generateUUID } from "../src/lib/utils";
import "load-env";

// Default MCP servers to seed
const DEFAULT_MCP_SERVERS = [
  {
    name: "Chrome MCP Server",
    config: {
      url: "http://127.0.0.1:12306/mcp",
      type: "streamable-http" as const,
    },
  },
];

async function seedDefaultMcpServers() {
  console.log("🌱 Seeding default MCP servers...");

  try {
    // Get all users
    const users = await db.select({ id: UserTable.id }).from(UserTable);

    if (users.length === 0) {
      console.log("⚠️ No users found. Please create a user first.");
      return;
    }

    console.log(`Found ${users.length} user(s)`);

    for (const user of users) {
      for (const server of DEFAULT_MCP_SERVERS) {
        // Check if this server already exists for the user
        const existing = await db
          .select()
          .from(McpServerTable)
          .where(eq(McpServerTable.name, server.name));

        const userHasServer = existing.some((s) => s.userId === user.id);

        if (userHasServer) {
          console.log(
            `⏭️  Skipping "${server.name}" for user ${user.id} (already exists)`,
          );
          continue;
        }

        // Create the MCP server for this user
        await db.insert(McpServerTable).values({
          id: generateUUID(),
          name: server.name,
          config: server.config,
          userId: user.id,
          visibility: "private",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✅ Added "${server.name}" for user ${user.id}`);
      }
    }

    console.log("\n🎉 Default MCP servers seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding MCP servers:", error);
    process.exit(1);
  }
}

seedDefaultMcpServers();
