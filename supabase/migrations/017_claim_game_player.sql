-- Lets a signed-in user claim a player who was typed in by name ("Amanda")
-- as themselves, so that game counts toward their stats and profile.
--
-- A player's identity is the `id` inside the game's players JSON — career
-- stats, head-to-head and league standings all match on it — so claiming
-- renames that id to the user's id everywhere it appears in the game and its
-- undo history. The original id is kept on the player as `claimedFrom`.
--
-- Only completed games can be claimed: an in-progress game is still held in
-- the scorekeeper's app, and their next save would overwrite the claim.

-- Renames a player's id in a game state. Works on both a games row's
-- players/rounds columns and a game_history snapshot, which share key names.
create or replace function public.rename_player_in_game_state(state jsonb, old_id text, new_id text)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  result jsonb := state;
  round jsonb;
  renamed_rounds jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(state->'players') = 'array' then
    result := jsonb_set(result, '{players}', (
      select coalesce(jsonb_agg(
        case when p->>'id' = old_id
          then p || jsonb_build_object('id', new_id, 'claimedFrom', old_id)
          else p
        end
        order by ord
      ), '[]'::jsonb)
      from jsonb_array_elements(state->'players') with ordinality as t(p, ord)
    ));
  end if;

  if jsonb_typeof(state->'rounds') = 'array' then
    for round in select value from jsonb_array_elements(state->'rounds') loop
      if jsonb_typeof(round->'scores') = 'object' and round->'scores' ? old_id then
        round := jsonb_set(round, '{scores}',
          ((round->'scores') - old_id) || jsonb_build_object(new_id, round->'scores'->old_id));
      end if;
      if jsonb_typeof(round->'proposedScores') = 'object' and round->'proposedScores' ? old_id then
        round := jsonb_set(round, '{proposedScores}',
          ((round->'proposedScores') - old_id) || jsonb_build_object(new_id, round->'proposedScores'->old_id));
      end if;
      renamed_rounds := renamed_rounds || jsonb_build_array(round);
    end loop;
    result := jsonb_set(result, '{rounds}', renamed_rounds);
  end if;

  return result;
end;
$$;

create or replace function public.claim_game_player(p_game_id text, p_player_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  g public.games%rowtype;
  renamed jsonb;
begin
  if uid is null then
    raise exception 'Sign in to claim a player.' using errcode = '28000';
  end if;

  select * into g from public.games where id = p_game_id for update;
  if not found or (g.league_id is not null and not public.is_league_member(g.league_id)) then
    raise exception 'Game not found.' using errcode = 'P0002';
  end if;

  if g.status <> 'completed' then
    raise exception 'You can claim a player once the game is finished.' using errcode = '22023';
  end if;

  if not exists (select 1 from jsonb_array_elements(g.players) p where p->>'id' = p_player_id) then
    raise exception 'That player isn''t in this game.' using errcode = '22023';
  end if;

  if exists (select 1 from public.profiles where id::text = p_player_id) then
    raise exception 'That player is already linked to an account.' using errcode = '22023';
  end if;

  if exists (select 1 from jsonb_array_elements(g.players) p where p->>'id' = uid::text) then
    raise exception 'You''re already a player in this game.' using errcode = '22023';
  end if;

  renamed := public.rename_player_in_game_state(
    jsonb_build_object('players', g.players, 'rounds', g.rounds), p_player_id, uid::text);

  -- updated_at is left alone: season standings replay games in that order.
  update public.games
  set players = renamed->'players', rounds = renamed->'rounds'
  where id = p_game_id;

  update public.game_history
  set game_state = public.rename_player_in_game_state(game_state, p_player_id, uid::text)
  where game_id = p_game_id;
end;
$$;

revoke all on function public.claim_game_player(text, text) from public, anon;
grant execute on function public.claim_game_player(text, text) to authenticated;
