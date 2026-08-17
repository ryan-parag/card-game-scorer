-- Same reasoning as 013_enable_realtime_games.sql: the Flutter app's
-- LeagueRepository.watchLeagues() uses Realtime .stream(), which requires
-- the table to be in the supabase_realtime publication.
ALTER PUBLICATION supabase_realtime ADD TABLE leagues;
