export const prerender = false;

import type { APIContext } from 'astro';
import { authorizePublish, presentedToken } from '../../../../../lib/api/auth';
import { fail, json, mapDbError } from '../../../../../lib/api/http';
import { blogEnv } from '../../../../../lib/db/types';
import { getAny, publishPost, summary } from '../../../../../lib/db/posts';

export async function POST({ request, locals, params }: APIContext) {
  const env = blogEnv(locals);
  const token = presentedToken(request);
  // Draft keys are refused here even if one of them equals BRIAN_ADMIN_KEY.
  if (!(await authorizePublish(env, token))) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  const slug = params.slug;
  if (!slug) return fail('not found', 404);

  try {
    const existing = await getAny(env.DB, slug);
    if (!existing) return fail('not found', 404);
    if (existing.status === 'published') return fail('that post is already published', 409);
    await publishPost(env.DB, existing);
    const row = await getAny(env.DB, slug);
    if (!row || row.published_by !== 'brian' || row.status !== 'published') {
      return fail('database error', 500);
    }
    return json({ ok: true, post: summary(row) });
  } catch (err) {
    return mapDbError(err);
  }
}
