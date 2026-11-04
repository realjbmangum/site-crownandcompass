import type { BlogEnv } from '../db/types';

/**
 * Draft writers. Add a row here and the matching Pages secret to give a new
 * writer a key. BARNABAS_API_KEY is already listed for the planned C&C writer.
 * An unset secret simply cannot authenticate.
 *
 * These keys can create and edit drafts, upload images, and mark a draft ready.
 * They cannot publish. Publish checks BRIAN_ADMIN_KEY only, and refuses the
 * call if the same token is also a draft key.
 */
export const DRAFT_ACTORS = [
  { env: 'DAVID_API_KEY', actor: 'david' },
  { env: 'PULPIT_API_KEY', actor: 'pulpit' },
  { env: 'BARNABAS_API_KEY', actor: 'barnabas' },
] as const;

export type DraftActor = (typeof DRAFT_ACTORS)[number]['actor'];
export type Actor = DraftActor | 'brian';

export function presentedToken(request: Request): string | null {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  if (match) return match[1];
  const alt = request.headers.get('x-api-key');
  const trimmed = alt?.trim();
  return trimmed ? trimmed : null;
}

async function digest(value: string): Promise<Uint8Array> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return new Uint8Array(bytes);
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function sameSecret(presented: string, expected: string): Promise<boolean> {
  return sameBytes(await digest(presented), await digest(expected));
}

function secret(env: BlogEnv, name: string): string | undefined {
  const value = env[name as keyof BlogEnv];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export async function draftActor(env: BlogEnv, token: string | null): Promise<DraftActor | null> {
  if (!token) return null;
  for (const row of DRAFT_ACTORS) {
    const key = secret(env, row.env);
    if (key && await sameSecret(token, key)) return row.actor;
  }
  return null;
}

export async function isBrian(env: BlogEnv, token: string | null): Promise<boolean> {
  if (!token) return false;
  const key = secret(env, 'BRIAN_ADMIN_KEY');
  return !!key && await sameSecret(token, key);
}

/** Draft routes. Brian's admin key may also edit, so he can correct a draft. */
export async function authorizeDraft(env: BlogEnv, token: string | null): Promise<Actor | null> {
  const writer = await draftActor(env, token);
  if (writer) return writer;
  if (await isBrian(env, token)) return 'brian';
  return null;
}

/**
 * Publish route. A draft key is rejected even when it happens to equal
 * BRIAN_ADMIN_KEY, so a writer key can never publish.
 */
export async function authorizePublish(env: BlogEnv, token: string | null): Promise<boolean> {
  if (!(await isBrian(env, token))) return false;
  if (await draftActor(env, token)) return false;
  return true;
}
