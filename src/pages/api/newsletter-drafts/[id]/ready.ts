export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../../lib/api/auth';
import { fail, json } from '../../../../lib/api/http';
import { mapNewsletterDbError } from '../../../../lib/api/newsletter-errors';
import { actorMayEditNewsletter, actorMayReadNewsletter, fromRow, parseId } from '../../../../lib/content/newsletters';
import { blogEnv } from '../../../../lib/db/types';
import { getNewsletter, newsletterSummary, saveNewsletterRevision } from '../../../../lib/db/newsletters';

// POST: mark your draft ready for Brian's review. This is as far as a draft
// key can take an issue. It shows up as "Ready for review" in the members
// app; nothing is emailed until Brian presses Approve and send there.
export async function POST({ request, locals, params }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  const id = parseId(params.id);
  if (!id) return fail('not found', 404);

  try {
    const row = await getNewsletter(env.DB, id);
    if (!row || !actorMayReadNewsletter(actor, row)) return fail('not found', 404);
    if (row.status === 'ready') return json({ ok: true, newsletter: newsletterSummary(row) });
    const may = actorMayEditNewsletter(actor, row);
    if (!may.ok) return fail(may.error, may.status);
    const saved = await saveNewsletterRevision(env.DB, row, fromRow(row), actor, 'ready', 'ready', 'newsletter.ready');
    if (!saved) return fail('the draft changed; GET it and try again', 409);
    const after = await getNewsletter(env.DB, id);
    if (!after) return fail('database error', 500);
    return json({ ok: true, newsletter: newsletterSummary(after) });
  } catch (err) {
    return mapNewsletterDbError(err);
  }
}
