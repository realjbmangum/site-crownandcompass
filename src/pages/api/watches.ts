export const prerender = false;

import type { APIContext } from 'astro';

// Public read of the Watches (chapters) from the shared D1, for the map on
// find-a-chapter. Degrades to an empty list if the DB is unavailable.
export async function GET({ locals }: APIContext) {
  const cache = 'public, max-age=300';
  try {
    // @ts-ignore — D1 binding injected by the Cloudflare runtime
    const db = locals.runtime?.env?.DB;
    if (!db) return json({ watches: [] }, cache);
    const { results } = await db
      .prepare(
        `SELECT name, city, region, lat, lng, status
           FROM watches
          WHERE status IN ('active', 'forming')
          ORDER BY name`
      )
      .all();
    return json({ watches: results ?? [] }, cache);
  } catch (err) {
    console.error('watches API error:', err);
    return json({ watches: [] }, cache);
  }
}

function json(body: unknown, cache: string) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });
}
