export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../../lib/api/auth';
import { fail, json, mapDbError } from '../../../../lib/api/http';
import type { PostInput } from '../../../../lib/content/posts';
import { blogEnv } from '../../../../lib/db/types';
import { getAny, saveRevision, summary } from '../../../../lib/db/posts';

export async function POST({ request, locals, params }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  const slug = params.slug;
  if (!slug) return fail('not found', 404);

  try {
    const existing = await getAny(env.DB, slug);
    if (!existing) return fail('not found', 404);
    if (existing.status === 'published') return fail('that post is already published', 409);
    if (existing.status === 'ready') return json({ ok: true, post: summary(existing) });

    const rev = existing.current_rev + 1;
    const input: PostInput = {
      slug: existing.slug,
      title: existing.title,
      description: existing.description,
      body: existing.body,
      pubDate: existing.pub_date,
      heroImageKey: existing.hero_image_key,
      heroImageAlt: existing.hero_image_alt,
      tags: [],
    };
    await saveRevision(env.DB, input, actor, 'ready', rev, 'ready', 'draft.ready');
    const row = await getAny(env.DB, slug);
    if (!row) return fail('database error', 500);
    return json({ ok: true, post: summary(row) });
  } catch (err) {
    return mapDbError(err);
  }
}
