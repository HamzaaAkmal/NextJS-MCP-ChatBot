-- Better Chatbot - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to create all required tables
-- Make sure to enable the uuid-ossp extension first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER & AUTH TABLES
-- =====================================================

-- User table
CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password TEXT,
  image TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  banned BOOLEAN,
  ban_reason TEXT,
  ban_expires TIMESTAMPTZ,
  role TEXT NOT NULL DEFAULT 'user'
);

-- Session table (Better Auth)
CREATE TABLE IF NOT EXISTS session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  impersonated_by TEXT
);

-- Account table (Better Auth - OAuth providers)
CREATE TABLE IF NOT EXISTS account (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Verification table (Better Auth - email verification, password reset)
CREATE TABLE IF NOT EXISTS verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CHAT TABLES
-- =====================================================

-- Chat threads
CREATE TABLE IF NOT EXISTS chat_thread (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_message (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES chat_thread(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  parts JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat exports (shareable conversations)
CREATE TABLE IF NOT EXISTS chat_export (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  exporter_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  original_thread_id UUID,
  messages JSONB NOT NULL,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Chat export comments
CREATE TABLE IF NOT EXISTS chat_export_comment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  export_id UUID NOT NULL REFERENCES chat_export(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES chat_export_comment(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- AGENT TABLES
-- =====================================================

-- Agents (custom AI assistants)
CREATE TABLE IF NOT EXISTS agent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon JSONB,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  instructions JSONB,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MCP (Model Context Protocol) TABLES
-- =====================================================

-- MCP Servers
CREATE TABLE IF NOT EXISTS mcp_server (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MCP Tool Customization (per-user tool instructions)
CREATE TABLE IF NOT EXISTS mcp_server_tool_custom_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  mcp_server_id UUID NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
  prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tool_name, mcp_server_id)
);

-- MCP Server Customization (per-user server instructions)
CREATE TABLE IF NOT EXISTS mcp_server_custom_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  mcp_server_id UUID NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
  prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mcp_server_id)
);

-- MCP OAuth Sessions
CREATE TABLE IF NOT EXISTS mcp_oauth_session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mcp_server_id UUID NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
  server_url TEXT NOT NULL,
  client_info JSONB,
  tokens JSONB,
  code_verifier TEXT,
  state TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- WORKFLOW TABLES
-- =====================================================

-- Workflows
CREATE TABLE IF NOT EXISTS workflow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL DEFAULT '0.1.0',
  name TEXT NOT NULL,
  icon JSONB,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'private',
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Nodes
CREATE TABLE IF NOT EXISTS workflow_node (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL DEFAULT '0.1.0',
  workflow_id UUID NOT NULL REFERENCES workflow(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ui_config JSONB DEFAULT '{}',
  node_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Edges
CREATE TABLE IF NOT EXISTS workflow_edge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT NOT NULL DEFAULT '0.1.0',
  workflow_id UUID NOT NULL REFERENCES workflow(id) ON DELETE CASCADE,
  source UUID NOT NULL REFERENCES workflow_node(id) ON DELETE CASCADE,
  target UUID NOT NULL REFERENCES workflow_node(id) ON DELETE CASCADE,
  ui_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ARCHIVE & BOOKMARK TABLES
-- =====================================================

-- Archives (folders for organizing chats)
CREATE TABLE IF NOT EXISTS archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Archive Items
CREATE TABLE IF NOT EXISTS archive_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_id UUID NOT NULL REFERENCES archive(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmark (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id, item_type)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Bookmark indexes
CREATE INDEX IF NOT EXISTS bookmark_user_id_idx ON bookmark(user_id);
CREATE INDEX IF NOT EXISTS bookmark_item_idx ON bookmark(item_id, item_type);

-- Archive item indexes
CREATE INDEX IF NOT EXISTS archive_item_item_id_idx ON archive_item(item_id);

-- Workflow node indexes
CREATE INDEX IF NOT EXISTS workflow_node_kind_idx ON workflow_node(kind);

-- MCP OAuth session indexes
CREATE INDEX IF NOT EXISTS mcp_oauth_session_server_id_idx ON mcp_oauth_session(mcp_server_id);
CREATE INDEX IF NOT EXISTS mcp_oauth_session_state_idx ON mcp_oauth_session(state);
CREATE INDEX IF NOT EXISTS mcp_oauth_session_tokens_idx ON mcp_oauth_session(mcp_server_id) WHERE tokens IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Optional but Recommended
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_export ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_export_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_server ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_server_tool_custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_server_custom_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_oauth_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_edge ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (your app backend)
-- These policies allow the service role (your backend) full access

CREATE POLICY "Service role has full access to users" ON "user"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to sessions" ON session
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to accounts" ON account
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to verifications" ON verification
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to chat_threads" ON chat_thread
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to chat_messages" ON chat_message
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to chat_exports" ON chat_export
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to chat_export_comments" ON chat_export_comment
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to agents" ON agent
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to mcp_servers" ON mcp_server
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to mcp_tool_customizations" ON mcp_server_tool_custom_instructions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to mcp_server_customizations" ON mcp_server_custom_instructions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to mcp_oauth_sessions" ON mcp_oauth_session
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to workflows" ON workflow
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to workflow_nodes" ON workflow_node
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to workflow_edges" ON workflow_edge
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to archives" ON archive
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to archive_items" ON archive_item
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to bookmarks" ON bookmark
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_updated_at BEFORE UPDATE ON session
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_updated_at BEFORE UPDATE ON verification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_updated_at BEFORE UPDATE ON agent
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_server_updated_at BEFORE UPDATE ON mcp_server
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_tool_custom_updated_at BEFORE UPDATE ON mcp_server_tool_custom_instructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_server_custom_updated_at BEFORE UPDATE ON mcp_server_custom_instructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_oauth_session_updated_at BEFORE UPDATE ON mcp_oauth_session
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_updated_at BEFORE UPDATE ON workflow
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_node_updated_at BEFORE UPDATE ON workflow_node
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_archive_updated_at BEFORE UPDATE ON archive
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_export_comment_updated_at BEFORE UPDATE ON chat_export_comment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE!
-- =====================================================
-- Your Supabase database is now ready for Better Chatbot
-- Make sure to:
-- 1. Copy your DATABASE_URL from Supabase Dashboard > Project Settings > Database
-- 2. Add it to your .env file
-- 3. Run `pnpm dev` to start the application
