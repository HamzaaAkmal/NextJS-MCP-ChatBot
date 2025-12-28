import { Agent } from "app-types/agent";
import { UserPreferences } from "app-types/user";
import { MCPServerConfig } from "app-types/mcp";
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  unique,
  index,
} from "drizzle-orm/sqlite-core";
import { isNotNull } from "drizzle-orm";
import { DBWorkflow, DBEdge, DBNode } from "app-types/workflow";
import { UIMessage } from "ai";
import { ChatMetadata } from "app-types/chat";
import { TipTapMentionJsonContent } from "@/types/util";

export const ChatThreadTable = sqliteTable("chat_thread", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const ChatMessageTable = sqliteTable("chat_message", {
  id: text("id").primaryKey().notNull(),
  threadId: text("thread_id")
    .notNull()
    .references(() => ChatThreadTable.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<UIMessage["role"]>(),
  parts: text("parts", { mode: "json" }).notNull().$type<UIMessage["parts"]>(),
  metadata: text("metadata", { mode: "json" }).$type<ChatMetadata>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const AgentTable = sqliteTable("agent", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon", { mode: "json" }).$type<Agent["icon"]>(),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  instructions: text("instructions", { mode: "json" }).$type<Agent["instructions"]>(),
  visibility: text("visibility")
    .notNull()
    .default("private"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const BookmarkTable = sqliteTable(
  "bookmark",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    itemType: text("item_type").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    unq: unique().on(table.userId, table.itemId, table.itemType),
    userIdIdx: index("bookmark_user_id_idx").on(table.userId),
    itemIdx: index("bookmark_item_idx").on(table.itemId, table.itemType),
  }),
);

export const McpServerTable = sqliteTable("mcp_server", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  config: text("config", { mode: "json" }).notNull().$type<MCPServerConfig>(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  visibility: text("visibility")
    .notNull()
    .default("private"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const UserTable = sqliteTable("user", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  password: text("password"),
  image: text("image"),
  preferences: text("preferences", { mode: "json" }).default("{}").$type<UserPreferences>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  banned: integer("banned", { mode: "boolean" }),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  role: text("role").notNull().default("user"),
});

// Role tables removed - using Better Auth's built-in role system
// Roles are now managed via the 'role' field on UserTable

export const SessionTable = sqliteTable("session", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  // Admin plugin field (from better-auth generated schema)
  impersonatedBy: text("impersonated_by"),
});

export const AccountTable = sqliteTable("account", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const VerificationTable = sqliteTable("verification", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

// Tool customization table for per-user additional instructions
export const McpToolCustomizationTable = sqliteTable(
  "mcp_server_tool_custom_instructions",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    mcpServerId: text("mcp_server_id")
      .notNull()
      .references(() => McpServerTable.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    unq: unique().on(table.userId, table.toolName, table.mcpServerId),
  }),
);

export const McpServerCustomizationTable = sqliteTable(
  "mcp_server_custom_instructions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    mcpServerId: text("mcp_server_id")
      .notNull()
      .references(() => McpServerTable.id, { onDelete: "cascade" }),
    prompt: text("prompt"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    unq: unique().on(table.userId, table.mcpServerId),
  }),
);

export const WorkflowTable = sqliteTable("workflow", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  version: text("version").notNull().default("0.1.0"),
  name: text("name").notNull(),
  icon: text("icon", { mode: "json" }).$type<DBWorkflow["icon"]>(),
  description: text("description"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  visibility: text("visibility")
    .notNull()
    .default("private"),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const WorkflowNodeDataTable = sqliteTable(
  "workflow_node",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    version: text("version").notNull().default("0.1.0"),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => WorkflowTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    uiConfig: text("ui_config", { mode: "json" }).$type<DBNode["uiConfig"]>().default("{}"),
    nodeConfig: text("node_config", { mode: "json" })
      .$type<Partial<DBNode["nodeConfig"]>>()
      .default("{}"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    kindIdx: index("workflow_node_kind_idx").on(t.kind),
  }),
);

export const WorkflowEdgeTable = sqliteTable("workflow_edge", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  version: text("version").notNull().default("0.1.0"),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => WorkflowTable.id, { onDelete: "cascade" }),
  source: text("source")
    .notNull()
    .references(() => WorkflowNodeDataTable.id, { onDelete: "cascade" }),
  target: text("target")
    .notNull()
    .references(() => WorkflowNodeDataTable.id, { onDelete: "cascade" }),
  uiConfig: text("ui_config", { mode: "json" }).$type<DBEdge["uiConfig"]>().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const ArchiveTable = sqliteTable("archive", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const ArchiveItemTable = sqliteTable(
  "archive_item",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    archiveId: text("archive_id")
      .notNull()
      .references(() => ArchiveTable.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    addedAt: integer("added_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    itemIdIdx: index("archive_item_item_id_idx").on(t.itemId),
  }),
);

export const McpOAuthSessionTable = sqliteTable(
  "mcp_oauth_session",
  {
    id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
    mcpServerId: text("mcp_server_id")
      .notNull()
      .references(() => McpServerTable.id, { onDelete: "cascade" }),
    serverUrl: text("server_url").notNull(),
    clientInfo: text("client_info", { mode: "json" }),
    tokens: text("tokens", { mode: "json" }),
    codeVerifier: text("code_verifier"),
    state: text("state").unique(), // OAuth state parameter for current flow (unique for security)
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    serverIdIdx: index("mcp_oauth_session_server_id_idx").on(t.mcpServerId),
    stateIdx: index("mcp_oauth_session_state_idx").on(t.state),
    tokensIdx: index("mcp_oauth_session_tokens_idx")
      .on(t.mcpServerId)
      .where(isNotNull(t.tokens)),
  }),
);

export type McpServerEntity = typeof McpServerTable.$inferSelect;
export type ChatThreadEntity = typeof ChatThreadTable.$inferSelect;
export type ChatMessageEntity = typeof ChatMessageTable.$inferSelect;

export type AgentEntity = typeof AgentTable.$inferSelect;
export type UserEntity = typeof UserTable.$inferSelect;
export type SessionEntity = typeof SessionTable.$inferSelect;

export type ToolCustomizationEntity =
  typeof McpToolCustomizationTable.$inferSelect;
export type McpServerCustomizationEntity =
  typeof McpServerCustomizationTable.$inferSelect;

export const ChatExportTable = sqliteTable("chat_export", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  exporterId: text("exporter_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  originalThreadId: text("original_thread_id"),
  messages: text("messages", { mode: "json" }).notNull().$type<
    Array<{
      id: string;
      role: UIMessage["role"];
      parts: UIMessage["parts"];
      metadata?: ChatMetadata;
    }>
  >(),
  exportedAt: integer("exported_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

export const ChatExportCommentTable = sqliteTable("chat_export_comment", {
  id: text("id").primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  exportId: text("export_id")
    .notNull()
    .references(() => ChatExportTable.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references(() => ChatExportCommentTable.id, {
    onDelete: "cascade",
  }),
  content: text("content", { mode: "json" }).notNull().$type<TipTapMentionJsonContent>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type ArchiveEntity = typeof ArchiveTable.$inferSelect;
export type ArchiveItemEntity = typeof ArchiveItemTable.$inferSelect;
export type BookmarkEntity = typeof BookmarkTable.$inferSelect;
