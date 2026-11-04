export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../lib/api/auth';
import { fail, json } from '../../../lib/api/http';
import { mapNewsletterDbError } from '../../../lib/api/newsletter-errors';
import {
  actorMayEditNewsletter,
  actorMayReadNewsletter,
  fromRow,
  parseId,
  validateNewsletterFields,
} from '../../../lib/content/newsletters';
import { blogEnv } from '../../../lib/db/types';
import { getNewsletter, newsletterSummary, saveNewsletterRevision } from '../../../lib/db/newsletters';

// GET: one issue (your own). PATCH: edit your own open draft. Send only the
// fields you change. `rev` (optional) must match the stored revision, so a
// stale edit cannot overwrite a newer one.
export async function GET({ request, locals, params }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  const id = parseId(params.id);
  if (!id) return fail('not found', 404);
  try {
    const row = await getNewsletter(env.DB, id);
    if (!row || !actorMayReadNewsletter(actor, row)) return fail('not found', 404);
    return json({ ok: true, newsletter: newsletterSummary(row) });
  } catch (err) {
    return mapNewsletterDbError(err);
  }
}

export async function PATCH({ request, locals, params, url }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  const id = parseId(params.id);
  if (!id) return fail('not found', 404);

  let payload: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > 200_000) return fail('body too large', 400);
    payload = JSON.parse(text) as Record<string, unknown>;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return fail('send a JSON object', 400);
  } catch {
    return fail('send JSON', 400);
  }
  for (const banned of ['status', 'approved_by', 'approved_at', 'sent_at', 'sent_by', 'send']) {
    if (payload[banned] !== undefined) return fail(`${banned} cannot be set here; use /ready to mark a draft ready. Sending happens only in the members app`, 400);
  }

  try {
    const row = await getNewsletter(env.DB, id);
    if (!row || !actorMayReadNewsletter(actor, row)) return fail('not found', 404);
    const may = actorMayEditNewsletter(actor, row);
    if (!may.ok) return fail(may.error, may.status);
    if (payload.rev !== undefined && Number(payload.rev) !== row.current_rev) {
      return fail(`stale revision: the draft is at rev ${row.current_rev}`, 409);
    }

    const parsed = validateNewsletterFields(payload, url.origin, fromRow(row));
    if (!parsed.ok) return fail(parsed.error, 400);
    const note = typeof payload.note === 'string' && payload.note.trim() ? payload.note.trim().slice(0, 160) : 'edit';
    const status = row.status === 'ready' ? 'ready' : 'draft';
    const saved = await saveNewsletterRevision(env.DB, row, parsed.value, actor, status, note, 'newsletter.edit');
    if (!saved) return fail('the draft changed while you were saving; GET it and try again', 409);
    const after = await getNewsletter(env.DB, id);
    if (!after) return fail('database error', 500);
    return json({ ok: true, newsletter: newsletterSummary(after) });
  } catch (err) {
    return mapNewsletterDbError(err);
  }
}
