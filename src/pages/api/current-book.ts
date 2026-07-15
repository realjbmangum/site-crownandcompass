export const prerender = false;

import type { APIContext } from 'astro';

const EMPTY = { title: null };

export async function GET({ locals }: APIContext) {
  try {
    // @ts-ignore — D1 binding injected by Cloudflare runtime
    const db = locals.runtime?.env?.DB;
    if (!db) {
      return json(EMPTY);
    }

    const row = await db
      .prepare(
        `SELECT b.title, b.author, b.slug, b.buy_url, b.guide_url
         FROM reading_cycles rc
         JOIN books b ON b.id = rc.book_id
         WHERE rc.status = 'current'
         ORDER BY rc.id DESC
         LIMIT 1`
      )
      .first();

    if (!row || !row.title) {
      return json(EMPTY);
    }

    return json({
      title: row.title,
      author: row.author ?? null,
      slug: row.slug ?? null,
      buy_url: row.buy_url ?? null,
      guide_url: row.guide_url ?? null,
    });
  } catch (err) {
    console.error('current-book API error:', err);
    return json(EMPTY);
  }
}

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
