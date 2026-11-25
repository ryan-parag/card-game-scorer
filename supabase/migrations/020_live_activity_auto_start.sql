-- Auto-start Live Activities for league games (iOS 17.2+ "push-to-start").
--
-- Each signed-in iPhone registers a push-to-start token. When a league game is
-- being played, api/live-activity/dispatch.ts uses it to start the game's Live
-- Activity on every league member's Lock Screen — no "Follow" tap needed. The
-- started activity then registers its own update token in
-- live_activity_tokens (019), and later updates flow exactly like follows.

-- ── Push-to-start tokens (one per device + account) ─────────────────────────
create table public.live_activity_start_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  push_token  text not null unique,
  environment text not null default 'production'
              check (environment in ('production', 'sandbox')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index live_activity_start_tokens_user_id_idx on public.live_activity_start_tokens (user_id);

alter table public.live_activity_start_tokens enable row level security;

create policy "Users can view their start tokens"
  on public.live_activity_start_tokens for select to authenticated
  using (user_id = auth.uid());

create policy "Users can add their start tokens"
  on public.live_activity_start_tokens for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their start tokens"
  on public.live_activity_start_tokens for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their start tokens"
  on public.live_activity_start_tokens for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.live_activity_start_tokens to authenticated;

-- ── Who has already been sent a start for a game ────────────────────────────
-- The dispatcher claims (game, user) here before sending, so overlapping
-- webhook calls never start the same game twice on someone's phone. Only the
-- service role (the dispatcher) touches it.
create table public.live_activity_auto_starts (
  game_id    text not null references public.games(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

alter table public.live_activity_auto_starts enable row level security;
-- No policies: not readable or writable by app users.

-- ── Opt-out ─────────────────────────────────────────────────────────────────
-- Lives with the other notification preferences. No row (or true) means
-- league games start automatically on this person's iPhone.
alter table public.notification_settings
  add column live_activity_league_games boolean not null default true;
