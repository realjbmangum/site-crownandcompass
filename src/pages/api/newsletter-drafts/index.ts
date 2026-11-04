export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../lib/api/auth';
import { fail, json } from '../../../lib/api/http';
import { validateNewsletterFields } from '../../../lib/content/newsletters';
import { blogEnv } from '../../../lib/db/types';
import { createNewsletterDraft, getNewsletter, listNewsletters, newsletterSummary } from '../../../lib/db/newsletters';
import { mapNewsletterDbError } from '../../../lib/api/newsletter-errors';

// Field Letter drafts for the shared newsletters table.
//
// POST creates a draft. GET lists the caller's own recent issues. A draft key
// (BARNABAS_API_KEY and the other writer keys) can create, edit, upload images
// to, and mark ready its own drafts. No route here approves or sends; that is
// a signed-in admin's button at app.thecrownandcompass.org/admin/newsletter.

export async function GET({ request, locals }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  try {
    const rows = await listNewsletters(env.DB, actor);
    return json({ ok: true, newsletters: rows.map(newsletterSummary) });
  } catch (err) {
    return mapNewsletterDbError(err);
  }
}

export async function POST({ request, locals, url }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);

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
    if (payload[banned] !== undefined) return fail(`${banned} cannot be set here; drafts are sent only from the members app`, 400);
  }

  const parsed = validateNewsletterFields(payload, url.origin);
  if (!parsed.ok) return fail(parsed.error, 400);
  const source = typeof payload.source === 'string' ? payload.source.trim().slice(0, 160) : '';

  try {
    const id = await createNewsletterDraft(env.DB, parsed.value, actor, source);
    const row = await getNewsletter(env.DB, id);
    if (!row) return fail('database error', 500);
    return json({ ok: true, newsletter: newsletterSummary(row) }, 201);
  } catch (err) {
    return mapNewsletterDbError(err);
  }
}
