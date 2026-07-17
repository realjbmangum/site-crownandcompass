export const prerender = false;

import type { APIContext } from 'astro';

// Public reading list for the shelf: the current book plus the "where we have
// been" shelf. The shelf is every book with a blurb except the current one,
// most-recently-read first (books with a past reading cycle rank above the
// curated-but-not-yet-read ones). Rotating the current book in the app admin
// automatically moves the outgoing book onto the shelf.
export async function GET({ locals }: APIContext) {
  const cache = 'public, max-age=300';
  try {
    // @ts-ignore — D1 binding injected by the Cloudflare runtime
    const db = locals.runtime?.env?.DB;
    if (!db) return json({ current: null, shelf: [] }, cache);

    const cols =
      "b.id, b.title, b.author, b.slug, b.cover_url, b.buy_url, b.guide_url, b.description, b.pillar_tags, " +
      "(SELECT 1 FROM book_guides bg WHERE bg.book_id = b.id AND bg.status = 'published' LIMIT 1) AS has_guide";

    const current = await db
      .prepare(
        `SELECT ${cols}
           FROM reading_cycles rc JOIN books b ON b.id = rc.book_id
          WHERE rc.status = 'current'
          ORDER BY rc.id DESC LIMIT 1`
      )
      .first();
    const currentId = (current && current.id) ?? -1;

    // The shelf shows every book that has actually been read (a past cycle) OR
    // has a curated blurb, except the current one. So a book you add and later
    // rotate out lands on the shelf automatically, described or not.
    const { results } = await db
      .prepare(
        `SELECT ${cols},
                (SELECT MAX(rc.id) FROM reading_cycles rc
                  WHERE rc.book_id = b.id AND rc.status = 'past') AS last_past
           FROM books b
          WHERE b.id <> ?
            AND ( (b.description IS NOT NULL AND b.description <> '')
                  OR EXISTS (SELECT 1 FROM reading_cycles rc2
                              WHERE rc2.book_id = b.id AND rc2.status = 'past') )
          ORDER BY last_past DESC, b.title`
      )
      .bind(currentId)
      .all();

    return json({ current: current ?? null, shelf: results ?? [] }, cache);
  } catch (err) {
    console.error('reading-list API error:', err);
    return json({ current: null, shelf: [] }, cache);
  }
}

function json(body: unknown, cache: string) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });
}
