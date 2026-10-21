# MindShare

A campus community for sharing ideas, finding fellow hackathon participants, and joining student or faculty projects. Built with React 19, Vite, and plain CSS.

## Current build

This checkout contains the forest-and-lime campus layout, with sidebar navigation, readable card grids, a student doodle in the welcome panel, and a responsive overview, idea feed, hackathon directory, opportunity directory, bookmarks, activity page, and explicitly labeled local admin preview.

Working local flows:
- Search and category filtering; idea sorting by upvotes or date.
- Publish, edit, and delete your own ideas; upvote/downvote with undo.
- Comments and replies, bookmarks across all three content types.
- Event details, participant lists, join and leave.
- Opportunity requests, withdrawal, and local admin review.
- Local admin listing creation and closing/reopening listings.
- Editable profile, light/dark themes, keyboard-accessible dialogs, reduced-motion support.
- Browser persistence under `mindshare.workspace.v1`.

**Shared features are being connected incrementally.** Signed-in accounts use Supabase for profiles, ideas, listings, and hackathon participation. Overview and activity still show local preview content. Sample listings and participants are illustrative; the local admin preview does not grant shared administration rights.

## Development

```sh
npm install
npm run dev
npm run build
node --test tests/*.test.js
```

Production output goes to `dist`. Hash-based routes support direct links on static hosts without rewrite rules. Google Fonts supplies Manrope and DM Sans; system sans-serif remains the fallback.

## Code structure

- `src/App.jsx`: app shell, routing, overview, directories, activity, local administration.
- `src/features/CampusOverview.jsx`: illustrated welcome panel, upcoming event cards, sortable idea cards, and opportunities.
- `src/assets/student-doodle.md`: generated illustration provenance and prompt.
- `src/features/Detail.jsx`: idea/event/opportunity details and discussion.
- `src/features/Forms.jsx`: accessible dialogs and publishing/profile/request forms.
- `src/components/CommunityCards.jsx`: reusable cards, avatars, tags, bookmarks.
- `src/components/Icon.jsx`: inline SVG icons.
- `src/lib/store.js`: initial content, pure reducer, persistence loading, date helpers.
- `src/App.css`: palette, components, responsive layouts, reduced motion.
- `backend/schema.sql`: Supabase schema and access policies; applied on 18 October 2026.
- `backend/verify-rls.sql`: rollback-only database authorization tests, verified against Supabase.
- `tests/store.test.js`: meaningful state-transition regression checks.

The older page/components remain in the repository but are not used by the new App entry point.

## Supabase integration — in progress

The official Supabase client and public configuration validation are prepared in `src/lib/supabase/`. Signup, sign-in, and account profile saving have been verified with a real account. Signed-in Ideas uses Supabase for publishing, editing, and voting; live voting and bookmark persistence have been verified; publishing/editing verification is tracked in the setup notes. Shared idea discussions and bookmarks are connected. Signed-in hackathon/opportunity pages now read shared listings, with publishing/editing/closing gated by server-verified admin access. Hackathon participation now supports joining, leaving, and reading member profiles. Live participation verification awaits the first real listing. Overview and activity still use local preview data; applications are not connected yet. See `backend/SETUP.md` for checkpoints.

Public connection values can be kept in ignored `.env.local` using `.env.example` as a guide. The authenticated features consume these values; local preview content remains separate. Never use a service-role or secret key in browser code.

Before switching to shared data:
1. Inspect the target project and its existing tables. Review `backend/schema.sql`; it creates prefixed `ms_` tables without dropping existing tables.
2. Schema applied on 18 October 2026 after confirming the public schema was empty. The rollback-only authorization checks pass. Do not re-run the initial migration on this project.
3. Connect Supabase Auth and the database client, then replace local mutations with authenticated requests and error handling. Do not upload the current local state wholesale.
4. After creating the owner's account/profile, grant admin membership through an owner-controlled database operation. Users must never grant themselves admin rights.
5. Verify policies using anonymous, student A, student B, and admin sessions. Test ownership, private requests/bookmarks, closed-event joins, and unauthorized admin writes.
6. Configure email confirmation and allowed redirect URLs, then test account creation, sign-in/out, session restoration, and production deployment.

RLS design reference: https://supabase.com/docs/guides/database/postgres/row-level-security

## Scope for later iterations

Opportunity applications, listing bookmarks, shared overview/activity, notifications, team formation, and deployment verification remain to be completed. Campus event participation is separate from official event registration.
