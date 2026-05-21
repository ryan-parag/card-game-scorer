
export function hashStringToUint32(input: string): number {
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
