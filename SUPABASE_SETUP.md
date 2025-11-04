# Supabase Setup Guide

This application uses Supabase to store games and game history, allowing multiple devices to access the same games.

## Database Schema

You need to create the following tables in your Supabase project:

### 1. `games` table

```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  players JSONB NOT NULL,
  rounds JSONB NOT NULL,
  current_round INTEGER NOT NULL,
  max_rounds INTEGER NOT NULL,
  collect_proposed_scores BOOLEAN NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('standard', 'custom')),
  status TEXT NOT NULL CHECK (status IN ('setup', 'in-progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_games_updated_at ON games(updated_at DESC);
CREATE INDEX idx_games_status ON games(status);
```

### 2. `game_history` table

```sql
CREATE TABLE game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  action TEXT NOT NULL,
  game_state JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX idx_game_history_game_id ON game_history(game_id);
CREATE INDEX idx_game_history_timestamp ON game_history(timestamp);
```

### 3. Row Level Security (RLS)

Enable RLS and create policies to allow public read/write access (or customize based on your authentication needs):

```sql
-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (for now - you can restrict this later with authentication)
CREATE POLICY "Allow public read access" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON games FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON games FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON game_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON game_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON game_history FOR DELETE USING (true);
```

## Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under "API" section.

## Setup Steps

1. Create a Supabase project at https://supabase.com
2. Run the SQL commands above in the Supabase SQL Editor
3. Copy your project URL and anon key from the project settings
4. Create a `.env` file with the credentials
5. Restart your development server

## Notes

- **Offline Support**: The app works without Supabase configured - it will automatically fall back to localStorage. This means you can use the app locally without setting up Supabase first.
- **Cross-Device Sync**: When Supabase is configured, games are automatically synced across all devices that access the same Supabase database.
- **Fallback Behavior**: If Supabase is unavailable or not configured, the app seamlessly uses localStorage as a fallback.
- **Settings**: User-specific settings (like theme preference) remain in localStorage as they are device-specific.
- **Game History**: Game history is stored per game in Supabase for cross-device access and undo functionality.

