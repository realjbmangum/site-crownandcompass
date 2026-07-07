/**
 * Stateless unsubscribe tokens.
 *
 * A token is HMAC-SHA256(lowercased email) keyed by ADMIN_SECRET, hex-encoded.
 * No storage is needed: possession of a valid token proves the link came from an
 * email we sent to that address, which is enough to honour a one-click unsubscribe.
 */

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function makeUnsubscribeToken(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(email.trim().toLowerCase()));
  return toHex(sig);
}

/**
 * Length-checked, constant-time string comparison. Avoids leaking, through response
 * timing, how many leading characters of a secret or token were guessed correctly.
 * Shared by the unsubscribe-token check and the admin-secret check.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyUnsubscribeToken(
  email: string,
  token: string,
  secret: string
): Promise<boolean> {
  if (!email || !token || !secret) return false;
  const expected = await makeUnsubscribeToken(email, secret);
  return constantTimeEqual(expected, token);
}

export function buildUnsubscribeUrl(siteUrl: string, email: string, token: string): string {
  const url = new URL('/api/unsubscribe', siteUrl);
  url.searchParams.set('email', email.trim().toLowerCase());
  url.searchParams.set('token', token);
  return url.toString();
}
