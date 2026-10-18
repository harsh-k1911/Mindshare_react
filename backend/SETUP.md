# Supabase setup checkpoints

## 1. Client foundation

The official `@supabase/supabase-js` client is initialized lazily by `src/lib/supabase/client.js`. Public values are read from `.env.local`. The local workspace remains unchanged until authentication and shared-data integration are ready.

Required variables:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Only publishable or legacy anon keys belong in Vite variables: every `VITE_` value is public in the browser bundle. Configuration checks catch common mistakes; the Supabase server, not client-side checks, validates keys and enforces authorization. Never add service-role keys, database passwords, or personal access tokens to this file or source code.

## 2. Project inspection — completed 18 October 2026

The public schema was inspected through the Supabase SQL Editor and contained zero base tables. The dashboard reported a healthy project. No existing application tables were overwritten. Authentication settings still need review during the account-flow step.

## 3. Database setup — completed 18 October 2026

Applied `schema.sql` to project `mocaaobiwsynqomjkiqm`. Nine application tables now use row-level security. Profile creation is triggered by Auth account creation; ownership and identity columns cannot be changed through client updates.

Executed `verify-rls.sql` in the database successfully. It checks owner versus other-student edits, request/bookmark privacy, closed-event participation, vote impersonation, student versus admin listing management, and request review. Its fixture users and data were rolled back. No permanent admin membership was granted.

Grant the first real administrator explicitly after their account and profile exist. Browser data has not been uploaded. Live account flows and API integration still need testing.

## 4. Authentication (next implementation step)

Add sign-up, sign-in, sign-out, email confirmation, password recovery, and session restoration. Configure the exact development and deployed callback URLs in Supabase before testing confirmation/recovery flows. Keep account sessions separate from `mindshare.workspace.v1`; signing into an account must not upload or inherit another user's local data.

## Verification

```sh
node --test tests/*.test.js
npm run build
```

Client-side configuration tests do not verify credentials, database access policies, or live authentication. These need a configured project and controlled test accounts.
