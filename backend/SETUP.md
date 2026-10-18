# Supabase setup checkpoints

## 1. Client foundation

The official `@supabase/supabase-js` client is initialized lazily by `src/lib/supabase/client.js`. Public values are read from `.env.local`. The local workspace remains unchanged until authentication and shared-data integration are ready.

Required variables:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Only publishable or legacy anon keys belong in Vite variables: every `VITE_` value is public in the browser bundle. Configuration checks catch common mistakes; the Supabase server, not client-side checks, validates keys and enforces authorization. Never add service-role keys, database passwords, or personal access tokens to this file or source code.

## 2. Inspect the existing project (pending)

Before applying `schema.sql`, inspect existing tables, authentication settings, and database migrations. Confirm the `ms_` table names do not conflict. Do not reset or overwrite an existing project.

## 3. Database setup (pending)

Review and apply the schema transaction in an authorized database session. Grant the initial administrator explicitly after their account and profile exist. Verify policies with separate student and admin accounts before connecting the production UI. Keep sample browser data separate from real records.

## 4. Authentication (next implementation step)

Add sign-up, sign-in, sign-out, email confirmation, password recovery, and session restoration. Configure the exact development and deployed callback URLs in Supabase before testing confirmation/recovery flows. Keep account sessions separate from `mindshare.workspace.v1`; signing into an account must not upload or inherit another user's local data.

## Verification

```sh
node --test tests/*.test.js
npm run build
```

Client-side configuration tests do not verify credentials, database access policies, or live authentication. These need a configured project and controlled test accounts.
