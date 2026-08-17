-- Enables Postgres logical replication for the games table so clients can
-- subscribe to live changes via Supabase Realtime (used by the Flutter
-- mobile app's GameRepository.watchGames()/watchGame()). The web app only
-- ever did one-off selects, so this was never needed until now.
ALTER PUBLICATION supabase_realtime ADD TABLE games;
