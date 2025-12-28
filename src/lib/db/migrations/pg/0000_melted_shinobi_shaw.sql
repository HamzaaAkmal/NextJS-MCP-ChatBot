CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `agent` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`user_id` text NOT NULL,
	`instructions` text,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `archive_item` (
	`id` text PRIMARY KEY NOT NULL,
	`archive_id` text NOT NULL,
	`item_id` text NOT NULL,
	`user_id` text NOT NULL,
	`added_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`archive_id`) REFERENCES `archive`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `archive_item_item_id_idx` ON `archive_item` (`item_id`);--> statement-breakpoint
CREATE TABLE `archive` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bookmark` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`item_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bookmark_user_id_idx` ON `bookmark` (`user_id`);--> statement-breakpoint
CREATE INDEX `bookmark_item_idx` ON `bookmark` (`item_id`,`item_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookmark_user_id_item_id_item_type_unique` ON `bookmark` (`user_id`,`item_id`,`item_type`);--> statement-breakpoint
CREATE TABLE `chat_export_comment` (
	`id` text PRIMARY KEY NOT NULL,
	`export_id` text NOT NULL,
	`author_id` text NOT NULL,
	`parent_id` text,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`export_id`) REFERENCES `chat_export`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `chat_export_comment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_export` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`exporter_id` text NOT NULL,
	`original_thread_id` text,
	`messages` text NOT NULL,
	`exported_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`exporter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_message` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`parts` text NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_thread`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chat_thread` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mcp_oauth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`mcp_server_id` text NOT NULL,
	`server_url` text NOT NULL,
	`client_info` text,
	`tokens` text,
	`code_verifier` text,
	`state` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_server`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_oauth_session_state_unique` ON `mcp_oauth_session` (`state`);--> statement-breakpoint
CREATE INDEX `mcp_oauth_session_server_id_idx` ON `mcp_oauth_session` (`mcp_server_id`);--> statement-breakpoint
CREATE INDEX `mcp_oauth_session_state_idx` ON `mcp_oauth_session` (`state`);--> statement-breakpoint
CREATE INDEX `mcp_oauth_session_tokens_idx` ON `mcp_oauth_session` (`mcp_server_id`) WHERE "mcp_oauth_session"."tokens" is not null;--> statement-breakpoint
CREATE TABLE `mcp_server_custom_instructions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mcp_server_id` text NOT NULL,
	`prompt` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_server`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_server_custom_instructions_user_id_mcp_server_id_unique` ON `mcp_server_custom_instructions` (`user_id`,`mcp_server_id`);--> statement-breakpoint
CREATE TABLE `mcp_server` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`config` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`user_id` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mcp_server_tool_custom_instructions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tool_name` text NOT NULL,
	`mcp_server_id` text NOT NULL,
	`prompt` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_server`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mcp_server_tool_custom_instructions_user_id_tool_name_mcp_server_id_unique` ON `mcp_server_tool_custom_instructions` (`user_id`,`tool_name`,`mcp_server_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`password` text,
	`image` text,
	`preferences` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`banned` integer,
	`ban_reason` text,
	`ban_expires` integer,
	`role` text DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `workflow_edge` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text DEFAULT '0.1.0' NOT NULL,
	`workflow_id` text NOT NULL,
	`source` text NOT NULL,
	`target` text NOT NULL,
	`ui_config` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflow`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source`) REFERENCES `workflow_node`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target`) REFERENCES `workflow_node`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workflow_node` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text DEFAULT '0.1.0' NOT NULL,
	`workflow_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`ui_config` text DEFAULT '{}',
	`node_config` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflow`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workflow_node_kind_idx` ON `workflow_node` (`kind`);--> statement-breakpoint
CREATE TABLE `workflow` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text DEFAULT '0.1.0' NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`description` text,
	`is_published` integer DEFAULT false NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
