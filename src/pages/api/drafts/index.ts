export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../lib/api/auth';
import { fail, json, mapDbError } from '../../../lib/api/http';
import { slugify, validatePostFields } from '../../../lib/content/posts';
import { blogEnv } from '../../../lib/db/types';
import { createDraft, getAny, summary } from '../../../lib/db/posts';

export async function POST({ request, locals }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);

  let payload: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 200_000) return fail('body too large', 400);
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return fail('send JSON', 400);
  }

  const slug = typeof payload.slug === 'string' && payload.slug.trim()
    ? payload.slug
    : slugify(typeof payload.title === 'string' ? payload.title : '');
  const parsed = validatePostFields({
    title: payload.title,
    description: payload.description,
    body: payload.body,
    pubDate: payload.pub_date,
    slug,
    heroImageKey: payload.hero_image_key,
    heroImageAlt: payload.hero_image_alt,
    tags: payload.tags,
  });
  if (!parsed.ok) return fail(parsed.error, 400);

  const source = typeof payload.source === 'string' ? payload.source.trim().slice(0, 80) : null;
  try {
    await createDraft(env.DB, parsed.value, actor, source || null);
    const row = await getAny(env.DB, parsed.value.slug);
    if (!row) return fail('database error', 500);
    return json({ ok: true, post: summary(row) }, 201);
  } catch (err) {
    return mapDbError(err);
  }
}
