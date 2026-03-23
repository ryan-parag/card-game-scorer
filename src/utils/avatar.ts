// Deterministic avatar/face generation helpers.
// We store `player.avatar` as a stable seed string derived from the player name.

export function hashStringToUint32(input: string): number {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function generateAvatarSeed(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return hashStringToUint32(trimmed).toString(16);
}

