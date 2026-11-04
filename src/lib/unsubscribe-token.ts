/**
 * Signed newsletter unsubscribe links.
 *
 * The member app's send tool builds the link; the public site's
 * /api/unsubscribe checks it. Both sides keep an identical copy of this file
 * and read the same UNSUBSCRIBE_SECRET, so a link only works for the address
 * it was minted for and nobody can unsubscribe someone else by guessing.
 */
export const UNSUBSCRIBE_BASE = 'https://thecrownandcompass.org/api/unsubscribe';

const enc = new TextEncoder();

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export async function unsubscribeToken(secret: string, email: string): Promise<string> {
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not set');
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`unsubscribe:${normalizeEmail(email)}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyUnsubscribeToken(
  secret: string,
  email: string,
  token: string
): Promise<boolean> {
  if (!secret || !email || typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return false;
  const expected = await unsubscribeToken(secret, email);
  // Constant-time compare over equal-length hex strings.
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

export async function unsubscribeUrl(secret: string, email: string, base = UNSUBSCRIBE_BASE): Promise<string> {
  const clean = normalizeEmail(email);
  const token = await unsubscribeToken(secret, clean);
  return `${base}?email=${encodeURIComponent(clean)}&token=${token}`;
}
