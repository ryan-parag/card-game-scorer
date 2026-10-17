-- Notifications: an outbox of things worth telling someone about, plus each
-- person's email preferences.
--
-- Rows are written by the triggers below (so they fire no matter which app —
-- web or iOS — made the change) and by the daily cron (season endings that
-- happen on their own, weekly digests). api/notifications/dispatch.ts emails
-- each new row via Resend; a Supabase Database Webhook on INSERT calls it right
-- away, and the daily cron retries anything that didn't go out.
--
-- The table also gives us what we'd need later for push notifications or an
-- in-app inbox, so recipients can read their own rows.

-- ── Preferences ──────────────────────────────────────────────────────────────
-- Kept out of profiles because profiles are publicly readable. No row means
-- every email is on.

create table public.notification_settings (
  user_id               uuid primary key references public.profiles(id) on delete cascade,
  email_friend_activity boolean not null default true,
  email_league_activity boolean not null default true,
  email_weekly_digest   boolean not null default true,
  updated_at            timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

create policy "Users can view their notification settings"
  on public.notification_settings for select to authenticated
  using (user_id = auth.uid());

create policy "Users can create their notification settings"
  on public.notification_settings for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their notification settings"
  on public.notification_settings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.notification_settings to authenticated;

-- ── Outbox ───────────────────────────────────────────────────────────────────

create table public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  type                text not null check (type in (
                        'friend_request', 'friend_accepted', 'league_added',
                        'season_started', 'season_ended', 'weekly_digest')),
  data                jsonb not null default '{}'::jsonb,
  -- Stops the same event being queued twice (e.g. a season ending both by
  -- hand and on its end date).
  dedupe_key          text unique,
  created_at          timestamptz not null default now(),
  emailed_at          timestamptz,
  -- Set when we deliberately don't email (turned off, no address, …).
  email_skipped       text,
  email_attempts      integer not null default 0,
  email_claimed_at    timestamptz,
  email_error         text
);

create index notifications_unsent_idx on public.notifications (created_at)
  where emailed_at is null and email_skipped is null;
create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

grant select on public.notifications to authenticated;

-- ── Queueing ─────────────────────────────────────────────────────────────────

create or replace function public.queue_notification(
  p_user_id uuid, p_type text, p_data jsonb, p_dedupe_key text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into notifications (user_id, type, data, dedupe_key)
  values (p_user_id, p_type, coalesce(p_data, '{}'::jsonb), p_dedupe_key)
  on conflict (dedupe_key) do nothing;
$$;

revoke all on function public.queue_notification(uuid, text, jsonb, text) from public, anon, authenticated;

-- Friend requests: tell the addressee about a new request, and the requester
-- when it's accepted.
create or replace function public.notify_friendship_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform queue_notification(new.addressee_id, 'friend_request',
      jsonb_build_object('requester_id', new.requester_id, 'friendship_id', new.id), 'friend_request:' || new.id);
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted' then
    perform queue_notification(new.requester_id, 'friend_accepted',
      jsonb_build_object('addressee_id', new.addressee_id, 'friendship_id', new.id), 'friend_accepted:' || new.id);
  end if;
  return new;
end;
$$;

create trigger on_friendship_change
  after insert or update of status on public.friendships
  for each row execute function public.notify_friendship_change();

-- Being added to a league by someone else. Joining yourself (or being added
-- as the creator of a new league) isn't news to you.
create or replace function public.notify_league_member_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> new.user_id then
    perform queue_notification(new.user_id, 'league_added',
      jsonb_build_object('league_id', new.league_id, 'added_by', auth.uid()),
      'league_added:' || new.league_id || ':' || new.user_id);
  end if;
  return new;
end;
$$;

create trigger on_league_member_added
  after insert on public.league_members
  for each row execute function public.notify_league_member_added();

-- Season ended: everyone in the league except whoever ended it hears who won.
-- Also used by the daily cron for seasons that reach their end date.
create or replace function public.queue_season_ended(p_season_id uuid, p_except uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select queue_notification(m.user_id, 'season_ended',
    jsonb_build_object('league_id', s.league_id, 'season_id', s.id),
    'season_ended:' || s.id || ':' || m.user_id)
  from league_seasons s
  join league_members m on m.league_id = s.league_id
  where s.id = p_season_id and m.user_id is distinct from p_except;
$$;

revoke all on function public.queue_season_ended(uuid, uuid) from public, anon, authenticated;

create or replace function public.notify_season_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform queue_notification(m.user_id, 'season_started',
      jsonb_build_object('league_id', new.league_id, 'season_id', new.id, 'created_by', auth.uid()),
      'season_started:' || new.id || ':' || m.user_id)
    from league_members m
    where m.league_id = new.league_id and m.user_id is distinct from auth.uid();
  elsif new.status = 'completed' and old.status is distinct from 'completed' then
    -- "End season" in the app sets the status to completed.
    perform queue_season_ended(new.id, auth.uid());
  end if;
  return new;
end;
$$;

create trigger on_season_change
  after insert or update of status on public.league_seasons
  for each row execute function public.notify_season_change();

-- Seasons that ran out on their own in the last few days. Called by the daily
-- cron; dedupe keys make repeat calls harmless.
create or replace function public.queue_ended_seasons()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  season record;
  queued integer := 0;
begin
  for season in
    select s.id from league_seasons s
    where s.end_date < current_date and s.end_date >= current_date - 3
      -- Already announced when someone ended it by hand.
      and not exists (
        select 1 from notifications n
        where n.type = 'season_ended' and n.data->>'season_id' = s.id::text
      )
  loop
    perform queue_season_ended(season.id, null);
    queued := queued + 1;
  end loop;
  return queued;
end;
$$;

revoke all on function public.queue_ended_seasons() from public, anon, authenticated;
grant execute on function public.queue_ended_seasons() to service_role;
