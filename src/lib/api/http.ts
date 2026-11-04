export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function fail(error: string, status: number): Response {
  return json({ ok: false, error }, status);
}

/** Map a D1/SQLite failure onto a client response. Unknown errors stay generic. */
export function mapDbError(err: unknown): Response {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('blog db error:', msg);
  if (/UNIQUE/i.test(msg) && /slug/i.test(msg)) return fail('slug already exists', 409);
  if (msg.includes('only brian can publish')) return fail('only brian can publish', 403);
  if (msg.includes('posts are born as drafts')) return fail('posts are born as drafts', 400);
  if (msg.includes('post versions are append-only')) return fail('post versions are append-only', 400);
  if (/CHECK constraint/i.test(msg)) return fail('that post did not pass the database checks', 400);
  return fail('database error', 500);
}
