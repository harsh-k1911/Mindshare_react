-- MindShare: initial Supabase application schema.
-- Inspect the target database before running. Uses ms_ prefixes to avoid collisions.
-- Run once, transactionally, using a database owner in Supabase's SQL Editor.
-- No sample content or administrator membership is inserted here.
-- See verify-rls.sql for rollback-only authorization checks.
begin;
create table public.ms_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  department text not null default '',
  year text not null default '',
  skills text[] not null default '{}',
  bio text not null default '' check (char_length(bio) <= 1000)
);
-- Admin membership is separate from editable profiles. Only a database owner can grant it.
create table public.ms_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.ms_admins enable row level security;
revoke all on public.ms_admins from anon, authenticated;
create function public.ms_is_admin() returns boolean language sql stable security definer
set search_path = '' as $$ select exists(select 1 from public.ms_admins where user_id = (select auth.uid())); $$;
revoke all on function public.ms_is_admin() from public;
grant execute on function public.ms_is_admin() to authenticated;

create table public.ms_ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.ms_profiles(id),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null check (char_length(trim(description)) between 1 and 5000),
  tags text[] not null default '{}',
  stage text not null default 'Exploring' check (stage in ('Exploring','Building','Launched')),
  created_at timestamptz not null default now()
);
create table public.ms_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ms_ideas(id) on delete cascade,
  author_id uuid not null references public.ms_profiles(id),
  parent_id uuid,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique(id, idea_id),
  foreign key (parent_id, idea_id) references public.ms_comments(id, idea_id) on delete cascade
);
create table public.ms_votes (
  idea_id uuid not null references public.ms_ideas(id) on delete cascade,
  user_id uuid not null references public.ms_profiles(id) on delete cascade,
  value smallint not null check (value in (-1,1)),
  primary key (idea_id,user_id)
);
create table public.ms_listings (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('hackathon','opportunity')),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null check (char_length(trim(description)) between 1 and 5000),
  owner_name text not null,
  tags text[] not null default '{}',
  event_date date,
  deadline date,
  format text check (format in ('On campus','Online','Hybrid')),
  eligibility text,
  registration_url text check (registration_url is null or registration_url ~ '^https://'),
  role text,
  commitment text,
  duration text,
  slots integer check (slots between 1 and 100),
  closed boolean not null default false,
  created_by uuid not null references public.ms_profiles(id),
  created_at timestamptz not null default now(),
  check (kind <> 'hackathon' or (event_date is not null and deadline is not null and deadline <= event_date)),
  check (kind <> 'opportunity' or (role is not null and commitment is not null and slots is not null))
);
create table public.ms_participants (
  listing_id uuid not null references public.ms_listings(id) on delete cascade,
  user_id uuid not null references public.ms_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (listing_id,user_id)
);
create table public.ms_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.ms_listings(id) on delete cascade,
  user_id uuid not null references public.ms_profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 2000),
  status text not null default 'Pending' check (status in ('Pending','Accepted','Declined')),
  created_at timestamptz not null default now(),
  unique(listing_id,user_id)
);
create table public.ms_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.ms_profiles(id) on delete cascade,
  idea_id uuid references public.ms_ideas(id) on delete cascade,
  listing_id uuid references public.ms_listings(id) on delete cascade,
  check (num_nonnulls(idea_id,listing_id) = 1),
  unique(user_id,idea_id), unique(user_id,listing_id)
);
-- Explicit grants: no anonymous access to student identities or community data.
alter table public.ms_profiles enable row level security;
alter table public.ms_ideas enable row level security;
alter table public.ms_comments enable row level security;
alter table public.ms_votes enable row level security;
alter table public.ms_listings enable row level security;
alter table public.ms_participants enable row level security;
alter table public.ms_applications enable row level security;
alter table public.ms_bookmarks enable row level security;
revoke all on public.ms_profiles, public.ms_ideas, public.ms_comments, public.ms_votes,
 public.ms_listings, public.ms_participants, public.ms_applications, public.ms_bookmarks from anon, authenticated;
grant select,insert,update on public.ms_profiles to authenticated;
grant select,insert,update,delete on public.ms_ideas, public.ms_comments, public.ms_votes,
 public.ms_listings, public.ms_participants, public.ms_applications, public.ms_bookmarks to authenticated;
create policy "Members read profiles" on public.ms_profiles for select to authenticated using (true);
create policy "Own profile creation" on public.ms_profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "Own profile editing" on public.ms_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Members read ideas" on public.ms_ideas for select to authenticated using (true);
create policy "Students publish ideas" on public.ms_ideas for insert to authenticated with check (author_id = (select auth.uid()));
create policy "Authors edit ideas" on public.ms_ideas for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "Authors or admins remove ideas" on public.ms_ideas for delete to authenticated using (author_id = (select auth.uid()) or public.ms_is_admin());
create policy "Members read discussion" on public.ms_comments for select to authenticated using (true);
create policy "Students comment" on public.ms_comments for insert to authenticated with check (author_id = (select auth.uid()));
create policy "Authors edit comments" on public.ms_comments for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "Authors or admins remove comments" on public.ms_comments for delete to authenticated using (author_id = (select auth.uid()) or public.ms_is_admin());
create policy "Members read votes" on public.ms_votes for select to authenticated using (true);
create policy "Own vote writes" on public.ms_votes for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Members read listings" on public.ms_listings for select to authenticated using (true);
create policy "Admin listing creation" on public.ms_listings for insert to authenticated with check (public.ms_is_admin() and created_by = (select auth.uid()));
create policy "Admin listing updates" on public.ms_listings for update to authenticated using (public.ms_is_admin()) with check (public.ms_is_admin());
create policy "Admin listing removal" on public.ms_listings for delete to authenticated using (public.ms_is_admin());
create policy "Members see participants" on public.ms_participants for select to authenticated using (true);
create policy "Join an open event" on public.ms_participants for insert to authenticated with check (
 user_id = (select auth.uid()) and exists(select 1 from public.ms_listings l where l.id = listing_id and l.kind = 'hackathon' and not l.closed and l.deadline >= current_date));
create policy "Leave own participation" on public.ms_participants for delete to authenticated using (user_id = (select auth.uid()));
create policy "Private requests" on public.ms_applications for select to authenticated using (user_id = (select auth.uid()) or public.ms_is_admin());
create policy "Request an open opportunity" on public.ms_applications for insert to authenticated with check (
 user_id = (select auth.uid()) and status = 'Pending' and exists(select 1 from public.ms_listings l where l.id = listing_id and l.kind = 'opportunity' and not l.closed));
create policy "Admins review requests" on public.ms_applications for update to authenticated using (public.ms_is_admin()) with check (public.ms_is_admin());
create policy "Withdraw own request" on public.ms_applications for delete to authenticated using (user_id = (select auth.uid()));
create policy "Private bookmarks" on public.ms_bookmarks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Limit updates to the fields that each feature actually edits. Identity and
-- ownership columns cannot be reassigned through the public API.
revoke update on public.ms_profiles, public.ms_ideas, public.ms_comments,
 public.ms_votes, public.ms_listings, public.ms_applications, public.ms_bookmarks,
 public.ms_participants from authenticated;
grant update(name,department,year,skills,bio) on public.ms_profiles to authenticated;
grant update(title,description,tags,stage) on public.ms_ideas to authenticated;
grant update(body) on public.ms_comments to authenticated;
grant update(value) on public.ms_votes to authenticated;
grant update(title,description,owner_name,tags,event_date,deadline,format,eligibility,
 registration_url,role,commitment,duration,slots,closed) on public.ms_listings to authenticated;
grant update(status) on public.ms_applications to authenticated;

-- Create a student profile when Auth creates an account; user metadata never
-- controls admin membership. Existing Auth users receive a neutral profile.
create function public.ms_create_profile() returns trigger language plpgsql security definer
set search_path = '' as $$
begin
 insert into public.ms_profiles(id,name)
 values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Student'),80));
 return new;
end;
$$;
revoke all on function public.ms_create_profile() from public, anon, authenticated;
create trigger ms_auth_profile after insert on auth.users
for each row execute function public.ms_create_profile();
insert into public.ms_profiles(id,name)
select id, left(coalesce(nullif(trim(raw_user_meta_data->>'name'), ''), 'Student'),80)
from auth.users on conflict (id) do nothing;

-- Discussions support comments and one level of replies, matching the UI.
create function public.ms_check_reply() returns trigger language plpgsql
set search_path = '' as $$
begin
 if new.parent_id is not null and exists (
  select 1 from public.ms_comments where id = new.parent_id and parent_id is not null
 ) then
  raise exception 'Replies can only be added to a top-level comment';
 end if;
 return new;
end;
$$;
revoke all on function public.ms_check_reply() from public, anon, authenticated;
create trigger ms_comment_depth before insert on public.ms_comments
for each row execute function public.ms_check_reply();

create index ms_ideas_author on public.ms_ideas(author_id);
create index ms_comments_idea on public.ms_comments(idea_id);
create index ms_applications_user on public.ms_applications(user_id);
create index ms_participants_user on public.ms_participants(user_id);
create index ms_bookmarks_user on public.ms_bookmarks(user_id);
commit;
