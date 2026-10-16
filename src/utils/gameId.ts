// Game ids are unguessable so that a game link is the only way to reach a
// game's share card. Older games use Date.now() timestamps.
export const newGameId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
