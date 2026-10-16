// Game ids are unguessable so that a game link is the only way to reach a
// game's share card. Older games use Date.now() timestamps.
export const newGameId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

// Account ids (and newer game ids) are UUIDs; typed-in players and older games
// use timestamp ids. Postgres rejects a non-UUID compared against a uuid column.
export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
