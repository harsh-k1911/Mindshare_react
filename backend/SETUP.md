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

## 4. Authentication — implementation complete, live verification pending

Sign-up, sign-in, device sign-out, confirmation messaging, password recovery, and session restoration are implemented at `#/account`. Account sessions use `mindshare.auth.v1`, separate from `mindshare.workspace.v1`. Signing in does not upload local preview data.

The Supabase redirect allowlist now includes `http://127.0.0.1:5173/**` for development only. The local confirmation callback is `http://127.0.0.1:5173/#/account`; recovery uses `http://127.0.0.1:5173/?flow=recovery#/account`. Open email links in the same browser that requested them (PKCE). Production callbacks and the production Site URL still need configuration once the deployment URL is confirmed.

Verify with an owner-controlled account: create account, confirm email, sign in, reload, sign out, request recovery, and set a new password. The user must enter their own credentials. Automated service tests use mocks and do not prove delivery or live authentication. Shared database reads/writes are the next implementation step.

## Verification

```sh
node --test tests/*.test.js
npm run build
```

Client-side configuration tests do not verify credentials, database access policies, or live authentication. These need a configured project and controlled test accounts.

## Email delivery limitation

The first manual signup attempt returned `email rate limit exceeded`. Supabase's built-in email provider currently allows only two messages per hour per project and restricts recipients to organization members. Check for an earlier confirmation email; otherwise retry after the sending quota recovers. This is a server limit, not resolved by changing client validation. Public student registration requires a custom SMTP provider with a verified sender. Configure SMTP credentials only in Supabase, never in Vite environment variables. Keep email confirmation enabled.

References: https://supabase.com/docs/guides/auth/rate-limits and https://supabase.com/docs/guides/auth/auth-smtp

## 5. Account profile — 19 October 2026

The user confirmed successful account creation and sign-in on 18 October. The account screen now loads and updates `ms_profiles` using the authenticated user's ID. Editable fields are name, department, year/role, skills, and bio. No local sample data is uploaded. A failed read offers a retry; a failed save preserves entered values. Switching accounts remounts the form, and old load responses are ignored after unmount.

Profile fields are readable by other authenticated members under the existing database policy. Identity and admin membership are not editable through this form. Service tests check field filtering, validation, user-scoped queries, and error handling; actual authorization remains enforced by database RLS.

Manual verification pending: open My account, save your profile, reload, and confirm the fields persist. Shared posts, listings, and the overview's preview identity remain local until the next integration step.

## 6. Shared idea publishing — 19 October 2026

The user confirmed saving their account profile. For signed-in members, `#/ideas` now loads the latest 100 posts from `ms_ideas`, including author names joined from `ms_profiles`. Members can publish and edit their own posts. Writes whitelist content fields; new authorship comes from the session, and updates constrain both the post ID and author ID. Existing RLS remains the authorization boundary.

The editor waits for database confirmation before closing, preserves drafts on failure, and disables duplicate submission while saving. Feed reads ignore stale responses after a write or unmount. Search filters the loaded posts; Refresh ideas fetches the newest data. Live posts are not copied into browser preview storage. Overview, saved items, activity, listings, and local admin preview are still local; votes/comments/bookmarks on shared posts are not connected in this step.

Manual verification: sign in, open Ideas, publish a post, reload, edit it, and reload again. A second signed-in member should see it after refreshing, without an Edit button. Mock service tests cover validation, identity filtering, query ownership, and failure handling; live multi-account verification remains pending.

Live signed-in check: the shared feed successfully loads its empty state. The author join was made explicit (`ms_ideas_author_id_fkey`) after the live API reported ambiguous profile relationships. The publish dialog opens and native required-field validation blocks empty posts. No test posts were created; publish/edit persistence and second-member visibility still need verification.

## 7. Shared idea voting — 21 October 2026

Shared ideas now support upvotes, downvotes, switching direction, and removing a vote by pressing the selected direction again. Writes use the signed-in user ID and the existing `(idea_id,user_id)` unique key. The existing `ms_votes` RLS policy enforces ownership; no migration is required.

The feed loads votes in ordered pages for its loaded idea IDs, so the standard response row limit does not truncate totals. Totals are calculated as upvotes minus downvotes. Responses from obsolete loads are ignored. Voting is locked during writes and reloads; both successful and failed writes trigger a fresh read, since a failed response can still correspond to a committed database write. Refresh ideas also refreshes voting data. This is refresh-based, not realtime.

Automated verification: 32 tests pass, including vote ownership filters, insert/update conflict keys, removal, pagination, signed-out rejection, and server errors. Changed JavaScript passes lint and the production build passes. Live vote persistence still requires a published shared idea; the live feed was empty when checked.

### Voting permission fix

The first live upvote exposed `permission denied for table ms_votes`: merge-upsert attempts to update identity columns, while the schema intentionally permits updates only to `value`. The client now inserts with conflict-ignore, then updates only `value`, constrained by both identity columns. The update selects one row to detect missing/inaccessible records. Existing RLS and column permissions are unchanged. Both requests are repeatable; an interrupted operation still reloads server totals before retrying.

Live checks verified upvote (1), switch to downvote (-1), and remove (0). All 33 tests, targeted lint, and the production build pass.

## 8. Shared comments and replies — 21 October 2026

Shared ideas now open a discussion on demand. Comments load from `ms_comments` with an explicit author-profile foreign key and ordered pagination. Replies use the existing composite parent/idea relationship and depth trigger; no migration is required. The interface only offers replies to top-level comments.

Posting uses a draft UUID and waits for a confirmed database response. Retrying an unchanged draft after an uncertain response retrieves an existing record scoped to its ID, idea, and author; editing the draft creates a new UUID. Posting disables duplicate submission and retains text on failure. Collapsing the discussion preserves its draft until navigation/unmount. Refresh comments reads newer content; realtime delivery and comment editing/deletion are not included in this step.

Verification: 39 tests, targeted lint and production build pass. Live comment loading and the empty discussion form are checked separately; posting/reply persistence and multi-account behavior require user verification.

## 9. Private shared-idea bookmarks — 21 October 2026

Signed-in members can save/unsave shared ideas and access them through Saved. Reads are scoped to the session user and use the existing private bookmark RLS policy. Conflict-ignore inserts avoid duplicate bookmarks and do not request updates to protected identity columns. Removal filters both user and idea IDs. Failed writes require refreshing before retrying.

The Saved page joins bookmarked ideas directly, independently of the newest-100 feed, with ordered pagination. Direct idea routes now fetch their ID explicitly so older saved posts remain accessible. Signed-in Saved shows live idea bookmarks only; local preview bookmarks remain in browser storage, and listing bookmarks await listing integration. The preview bookmark count is hidden for signed-in members to avoid showing an unrelated number.

Automated verification: 45 tests, targeted lint, and production build pass. Tests cover owner filters, duplicate-safe writes, removal scope, pagination, explicit joins, error handling, and direct retrieval of older posts.

Live verification passed: saved Hacktoberfest, opened Saved, reloaded and confirmed persistence, then unsaved it and confirmed the empty collection. The original unsaved state was restored. No posts, votes, or comments were changed during this check.

## 10. Shared listings and protected administration — 22 October 2026

Signed-in Hackathons and Opportunities now read `ms_listings`. Manage listings uses `ms_is_admin()` to show publishing controls only after the server confirms the role; non-admin accounts see an access-required screen. Existing database RLS independently enforces admin-only writes. The signed-out local admin preview remains explicitly a browser-only preview.

Admins can create, edit, close, and reopen both listing kinds. Validated date ordering, field limits, HTTPS registration URLs, and opportunity openings are checked before submission. Edits whitelist mutable fields and never change listing kind/creator. Create retries use a stable draft UUID. Error messages retain drafts and require refreshed state after an uncertain status change. All listing reads use ordered pagination.

The user explicitly approved their existing verified account as the first administrator on 22 October. The matching confirmed Auth account and profile were checked before adding its ID to `ms_admins`; Supabase returned `admin_granted=true`. No admin grant is included in the application or automatically applied by source files. The app showed access denied before the grant.

Verification: 52 automated tests, targeted lint, and production build pass. Live creation/edit/close/reopen persistence still needs user verification with real listing content. Participation, applications, listing bookmarks, and overview/activity integration are the following steps.

Live role verification completed: the same signed-in account changed from the access-required screen to Create listing after the approved grant and permission refresh. Both event and opportunity forms open with their appropriate fields; empty submission is blocked. The development server was restarted for verification. No real listings were published during UI checks.

## 11. Shared hackathon participation — 22 October 2026

Signed-in hackathon cards now expand a campus participant list with names, departments, years, and skills. Joining and leaving use `ms_participants` with the session user ID. Conflict-ignore inserts prevent duplicate participation without requesting update permissions. Deletes constrain both the event and user. Existing RLS enforces open hackathons and deadlines for joins, and allows students to leave their own participation after closing. No migration is needed.

Lists load on first expansion with ordered pagination and refresh after every write, including uncertain failures. Stale reads are ignored, duplicate clicks are locked, and failed reads offer refresh. Joining is explicitly separate from official event registration. Emails are not fetched or displayed.

Verification: 58 automated tests, targeted lint, and production build pass. The live admin page has no shared listings yet, so live join/reload/leave and second-account visibility remain pending. Publish a real open hackathon, join it, reload and expand participants, then leave and verify removal. Opportunity applications remain the next integration step.

## 12. Private opportunity applications and review — 22 October 2026

Opportunity cards now expand an application form and the member's existing request. Members can submit a message (1–2,000 trimmed characters), view its status, or withdraw it even after the listing closes. Admins additionally see paginated requests with applicant profile details and can accept, decline, or return them to pending. Openings remain informational; acceptance does not automatically close a listing or enforce capacity.

Existing `ms_applications` policies enforce private reads, own pending inserts for open opportunities, own withdrawals, and admin-only status updates. No migration is needed. Inserts whitelist identity/content and force Pending; stable draft IDs recover uncertain retries without updating an existing request. Review writes change only status and filter the previously loaded status to detect conflicting decisions. Every write refreshes server state before another action. Drafts survive failures and collapsing the section. Emails are not fetched.

Participant and application components load as separate bundles to keep the initial JavaScript smaller. Verification: 67 tests, targeted lint, and production build pass. Tests cover private read filters, pagination, validation, duplicate recovery, withdrawal ownership, restricted review columns, concurrent decision checks, and server errors. The live admin page still has no listings, so submission/reload/review/withdrawal and second-account privacy checks remain pending. Publish a real opportunity, apply, reload, review its status from Manage listings, and verify withdrawal.
