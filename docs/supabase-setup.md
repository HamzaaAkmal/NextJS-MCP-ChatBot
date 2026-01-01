# Supabase Database Setup Guide

This guide walks you through setting up Supabase as the database for Better Chatbot.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js 18+ installed
- pnpm installed

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project name**: `better-chatbot` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup (~2 minutes)

## Step 2: Get Your Database Connection String

1. In your Supabase project, go to **Project Settings** (gear icon)
2. Click **Database** in the sidebar
3. Scroll to **Connection string** section
4. Copy the **URI** connection string (Transaction mode recommended for serverless)

The connection string looks like:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

Replace `[password]` with your database password.

## Step 3: Run the Database Migration

### Option A: Using Supabase SQL Editor (Recommended for first setup)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)

### Option B: Using Drizzle CLI

1. Update your `.env` file with the connection string
2. Run the migration:
   ```bash
   pnpm db:push
   ```

## Step 4: Configure Environment Variables

Copy `.env.example` to `.env` and update these values:

```env
# Supabase Database Connection (Transaction mode - for app)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase Project Keys (optional, for Supabase Auth features)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Better Auth Secret (generate with: npx @better-auth/cli@latest secret)
BETTER_AUTH_SECRET=your-generated-secret
```

### Where to find Supabase keys:

1. Go to **Project Settings** > **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Step 5: Start the Application

```bash
pnpm dev
```

Visit `http://localhost:3000` to access your chatbot!

## Connection Modes

Supabase offers two connection modes:

### Transaction Mode (Port 6543) - Recommended
- Best for serverless/edge deployments
- Uses connection pooling (PgBouncer)
- Add `?pgbouncer=true` to connection string
- Drizzle config: `prepare: false`

### Session Mode (Port 5432) - For Migrations
- Best for running migrations
- Direct database connection
- No connection string modifications needed

For running migrations, you may need to temporarily use the Session mode connection string.

## Row Level Security (RLS)

The migration script enables RLS on all tables and creates policies for the `service_role`. This means:

- Your backend (using `SUPABASE_SERVICE_ROLE_KEY`) has full access
- Direct client access is restricted (secure by default)

If you want to allow authenticated users direct database access (not recommended for this app), you'll need to create additional policies.

## Troubleshooting

### "Connection refused" error
- Check your connection string is correct
- Ensure your IP is not blocked (Supabase allows all IPs by default)
- Try the Session mode connection (port 5432) for debugging

### "Prepared statement already exists" error
- Make sure `prepare: false` is set in your postgres client config
- This is required for Transaction mode pooling

### "Permission denied" error
- Check that RLS policies are created
- Verify you're using the correct service role key

### Migration errors
- Run migrations using Session mode connection (port 5432)
- Check if tables already exist (migration is idempotent with `IF NOT EXISTS`)

## File Storage

For file uploads, you can use Supabase Storage. Add these settings:

```env
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=your-bucket-name
FILE_STORAGE_S3_REGION=your-region
FILE_STORAGE_S3_ENDPOINT=https://[project-ref].supabase.co/storage/v1/s3
AWS_ACCESS_KEY_ID=your-supabase-access-key
AWS_SECRET_ACCESS_KEY=your-supabase-secret-key
```

To get S3 credentials for Supabase Storage:
1. Go to **Project Settings** > **API**
2. Find the **S3 Access Keys** section
3. Create new credentials

## Backup & Restore

Supabase automatically creates daily backups (Pro plan and above). For manual backups:

1. Use `pg_dump` with your direct connection string
2. Or export via Supabase Dashboard > Database > Backups

---

For more help, check the [Supabase Docs](https://supabase.com/docs) or open an issue on GitHub.
