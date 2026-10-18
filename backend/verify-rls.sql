-- Rollback-only integration checks, run as postgres in the SQL Editor.
-- These temporary fixture accounts have no credentials and are never committed.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAILED: %', label; end if; end;
$$;
insert into auth.users(id, raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','{"name":"RLS Student A"}'),
 ('22222222-2222-4222-8222-222222222222','{"name":"RLS Student B"}'),
 ('33333333-3333-4333-8333-333333333333','{"name":"RLS Admin"}');
insert into public.ms_admins values ('33333333-3333-4333-8333-333333333333');
insert into public.ms_ideas(id,author_id,title,description) values
 ('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','RLS fixture idea','A temporary policy test');
insert into public.ms_listings(id,kind,title,description,owner_name,created_by,event_date,deadline,closed) values
 ('55555555-5555-4555-8555-555555555555','hackathon','Open fixture','Test','Test','33333333-3333-4333-8333-333333333333',current_date+7,current_date+5,false),
 ('66666666-6666-4666-8666-666666666666','hackathon','Closed fixture','Test','Test','33333333-3333-4333-8333-333333333333',current_date+7,current_date+5,true);
insert into public.ms_listings(id,kind,title,description,owner_name,created_by,role,commitment,slots) values
 ('77777777-7777-4777-8777-777777777777','opportunity','Opportunity fixture','Test','Test','33333333-3333-4333-8333-333333333333','Developer','1 hour',1);

select pg_temp.assert_true(not has_table_privilege('anon','public.ms_profiles','SELECT'), 'anonymous profile access denied');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.ms_admins','INSERT'), 'students cannot grant admin membership');
select pg_temp.assert_true(not has_column_privilege('authenticated','public.ms_ideas','author_id','UPDATE'), 'ownership is immutable');
select pg_temp.assert_true(not has_column_privilege('authenticated','public.ms_applications','user_id','UPDATE'), 'request identity is immutable');
select pg_temp.assert_true((select count(*)=9 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('ms_profiles','ms_admins','ms_ideas','ms_comments','ms_votes','ms_listings','ms_participants','ms_applications','ms_bookmarks') and c.relrowsecurity), 'RLS enabled on all application tables');

set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select pg_temp.assert_true(not public.ms_is_admin(), 'student is not admin');
update public.ms_ideas set title='Updated by owner' where id='44444444-4444-4444-8444-444444444444';
select pg_temp.assert_true((select title='Updated by owner' from public.ms_ideas where id='44444444-4444-4444-8444-444444444444'), 'owner can edit');
insert into public.ms_participants(listing_id,user_id) values ('55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111');
insert into public.ms_applications(id,listing_id,user_id,message) values ('88888888-8888-4888-8888-888888888888','77777777-7777-4777-8777-777777777777','11111111-1111-4111-8111-111111111111','Private request');
insert into public.ms_bookmarks(user_id,idea_id) values ('11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444');
do $$ begin
 begin
  insert into public.ms_participants(listing_id,user_id) values ('66666666-6666-4666-8666-666666666666','11111111-1111-4111-8111-111111111111');
  raise exception 'FAILED: closed event accepted participation';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.ms_votes(idea_id,user_id,value) values ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222',1);
  raise exception 'FAILED: vote impersonation permitted';
 exception when insufficient_privilege then null; end;
end $$;
update public.ms_applications set status='Accepted' where id='88888888-8888-4888-8888-888888888888';
select pg_temp.assert_true((select status='Pending' from public.ms_applications where id='88888888-8888-4888-8888-888888888888'), 'student cannot approve own request');

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
update public.ms_ideas set title='Changed by other student' where id='44444444-4444-4444-8444-444444444444';
select pg_temp.assert_true((select title='Updated by owner' from public.ms_ideas where id='44444444-4444-4444-8444-444444444444'), 'other student cannot edit idea');
select pg_temp.assert_true((select count(*)=0 from public.ms_applications where id='88888888-8888-4888-8888-888888888888'), 'other student cannot read private requests');
select pg_temp.assert_true((select count(*)=0 from public.ms_bookmarks where user_id='11111111-1111-4111-8111-111111111111'), 'other student cannot read bookmarks');
update public.ms_listings set closed=true where id='55555555-5555-4555-8555-555555555555';
select pg_temp.assert_true((select not closed from public.ms_listings where id='55555555-5555-4555-8555-555555555555'), 'student cannot manage listings');

select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select pg_temp.assert_true(public.ms_is_admin(), 'admin role recognized');
update public.ms_applications set status='Accepted' where id='88888888-8888-4888-8888-888888888888';
select pg_temp.assert_true((select status='Accepted' from public.ms_applications where id='88888888-8888-4888-8888-888888888888'), 'admin can review requests');
update public.ms_listings set closed=true where id='55555555-5555-4555-8555-555555555555';
select pg_temp.assert_true((select closed from public.ms_listings where id='55555555-5555-4555-8555-555555555555'), 'admin can close listings');
reset role;
rollback;
select 'PASS: database authorization checks completed; all fixtures rolled back' as result;
