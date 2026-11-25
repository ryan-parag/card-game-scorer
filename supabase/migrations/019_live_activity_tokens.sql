-- Live Activity push tokens (iOS app, "Follow on Lock Screen").
--
-- When someone follows a game from the iOS app, iOS starts a Live Activity on
-- their phone and hands the app a push token for it. The app stores that token
-- here; api/live-activity/dispatch.ts (called by a Database Webhook on every
-- games UPDATE) sends each follower the game's new standings via APNs, so their
-- Lock Screen updates even while the app is closed. Rows are removed when the
-- game completes, the activity is dismissed, or APNs says the token is dead.

create table public.live_activity_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  game_id     text not null references public.games(id) on delete cascade,
  push_token  text not null unique,
  -- APNs environment the token belongs to: 'sandbox' for development builds,
  -- 'production' for TestFlight / App Store. The dispatcher falls back to the
  -- other one if APNs rejects the token, then corrects this column.
  environment text not null default 'production'
              check (environment in ('production', 'sandbox')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index live_activity_tokens_game_id_idx on public.live_activity_tokens (game_id);

alter table public.live_activity_tokens enable row level security;

-- People only ever see and manage their own tokens. Following requires being
-- able to see the game itself: the subquery runs under the caller's RLS on
-- games, so league games stay members-only.
create policy "Users can view their live activity tokens"
  on public.live_activity_tokens for select to authenticated
  using (user_id = auth.uid());

create policy "Users can follow games they can see"
  on public.live_activity_tokens for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.games g where g.id = game_id)
  );

create policy "Users can update their live activity tokens"
  on public.live_activity_tokens for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.games g where g.id = game_id)
  );

create policy "Users can delete their live activity tokens"
  on public.live_activity_tokens for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.live_activity_tokens to authenticated;
