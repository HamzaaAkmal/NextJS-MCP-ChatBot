CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" jsonb,
	"user_id" uuid NOT NULL,
	"instructions" jsonb,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archive_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"archive_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"item_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_user_id_item_id_item_type_unique" UNIQUE("user_id","item_id","item_type")
);
--> statement-breakpoint
CREATE TABLE "chat_export_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_export" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"exporter_id" uuid NOT NULL,
	"original_thread_id" uuid,
	"messages" jsonb NOT NULL,
	"exported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" text NOT NULL,
	"parts" jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_oauth_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"server_url" text NOT NULL,
	"client_info" jsonb,
	"tokens" jsonb,
	"code_verifier" text,
	"state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_oauth_session_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "mcp_server_custom_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_server_custom_instructions_user_id_mcp_server_id_unique" UNIQUE("user_id","mcp_server_id")
);
--> statement-breakpoint
CREATE TABLE "mcp_server" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"user_id" uuid NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_server_tool_custom_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"mcp_server_id" uuid NOT NULL,
	"prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_server_tool_custom_instructions_user_id_tool_name_mcp_server_id_unique" UNIQUE("user_id","tool_name","mcp_server_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"password" text,
	"image" text,
	"preferences" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"role" text DEFAULT 'user' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflow_edge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text DEFAULT '0.1.0' NOT NULL,
	"workflow_id" uuid NOT NULL,
	"source" uuid NOT NULL,
	"target" uuid NOT NULL,
	"ui_config" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_node" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text DEFAULT '0.1.0' NOT NULL,
	"workflow_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"ui_config" jsonb DEFAULT '{}',
	"node_config" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text DEFAULT '0.1.0' NOT NULL,
	"name" text NOT NULL,
	"icon" jsonb,
	"description" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archive_item" ADD CONSTRAINT "archive_item_archive_id_archive_id_fk" FOREIGN KEY ("archive_id") REFERENCES "public"."archive"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archive_item" ADD CONSTRAINT "archive_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archive" ADD CONSTRAINT "archive_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_export_comment" ADD CONSTRAINT "chat_export_comment_export_id_chat_export_id_fk" FOREIGN KEY ("export_id") REFERENCES "public"."chat_export"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_export_comment" ADD CONSTRAINT "chat_export_comment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_export_comment" ADD CONSTRAINT "chat_export_comment_parent_id_chat_export_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."chat_export_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_export" ADD CONSTRAINT "chat_export_exporter_id_user_id_fk" FOREIGN KEY ("exporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_session" ADD CONSTRAINT "mcp_oauth_session_mcp_server_id_mcp_server_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_custom_instructions" ADD CONSTRAINT "mcp_server_custom_instructions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_custom_instructions" ADD CONSTRAINT "mcp_server_custom_instructions_mcp_server_id_mcp_server_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server" ADD CONSTRAINT "mcp_server_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_tool_custom_instructions" ADD CONSTRAINT "mcp_server_tool_custom_instructions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_server_tool_custom_instructions" ADD CONSTRAINT "mcp_server_tool_custom_instructions_mcp_server_id_mcp_server_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_source_workflow_node_id_fk" FOREIGN KEY ("source") REFERENCES "public"."workflow_node"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_edge" ADD CONSTRAINT "workflow_edge_target_workflow_node_id_fk" FOREIGN KEY ("target") REFERENCES "public"."workflow_node"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_node" ADD CONSTRAINT "workflow_node_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "archive_item_item_id_idx" ON "archive_item" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "bookmark_user_id_idx" ON "bookmark" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookmark_item_idx" ON "bookmark" USING btree ("item_id","item_type");--> statement-breakpoint
CREATE INDEX "mcp_oauth_session_server_id_idx" ON "mcp_oauth_session" USING btree ("mcp_server_id");--> statement-breakpoint
CREATE INDEX "mcp_oauth_session_state_idx" ON "mcp_oauth_session" USING btree ("state");--> statement-breakpoint
CREATE INDEX "mcp_oauth_session_tokens_idx" ON "mcp_oauth_session" USING btree ("mcp_server_id") WHERE "mcp_oauth_session"."tokens" is not null;--> statement-breakpoint
CREATE INDEX "workflow_node_kind_idx" ON "workflow_node" USING btree ("kind");