export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../lib/api/auth';
import { fail, json, mapDbError } from '../../../lib/api/http';
import { actorMayEdit, validatePostFields } from '../../../lib/content/posts';
import { blogEnv } from '../../../lib/db/types';
import { getAny, replaceTags, saveRevision, summary } from '../../../lib/db/posts';

export async function PATCH({ request, locals, params }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);

  const slug = params.slug;
  if (!slug) return fail('not found', 404);

  let payload: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 200_000) return fail('body too large', 400);
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return fail('send JSON', 400);
  }

  try {
    const existing = await getAny(env.DB, slug);
    if (!existing) return fail('not found', 404);
    if (!actorMayEdit(actor, existing.status)) return fail('published posts are locked', 403);
    if (typeof payload.slug === 'string' && payload.slug.trim() && payload.slug.trim() !== slug) {
      return fail('slug cannot change', 400);
    }

    const parsed = validatePostFields({
      title: payload.title ?? existing.title,
      description: payload.description ?? existing.description,
      body: payload.body ?? existing.body,
      pubDate: payload.pub_date ?? existing.pub_date,
      slug,
      heroImageKey: payload.hero_image_key === undefined ? existing.hero_image_key : payload.hero_image_key,
      heroImageAlt: payload.hero_image_alt === undefined ? existing.hero_image_alt : payload.hero_image_alt,
      tags: payload.tags,
    });
    if (!parsed.ok) return fail(parsed.error, 400);

    const rev = existing.current_rev + 1;
    const note = typeof payload.note === 'string' && payload.note.trim()
      ? payload.note.trim().slice(0, 160)
      : 'edit';
    await saveRevision(env.DB, parsed.value, actor, existing.status, rev, note, 'post.edit');
    if (payload.tags !== undefined) await replaceTags(env.DB, slug, parsed.value.tags);
    const row = await getAny(env.DB, slug);
    if (!row) return fail('database error', 500);
    return json({ ok: true, post: summary(row) });
  } catch (err) {
    return mapDbError(err);
  }
}
