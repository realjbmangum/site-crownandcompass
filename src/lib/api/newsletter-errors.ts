import { fail } from './http';

/** Map a D1 failure on the newsletters tables onto a client response. */
export function mapNewsletterDbError(err: unknown): Response {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('newsletter db error:', msg);
  if (/no such table: newsletter_versions|no such column: (author|current_rev|issue_date)/i.test(msg)) {
    return fail('the newsletter pipeline migration has not been applied to this database yet', 503);
  }
  if (msg.includes('only a signed-in admin can approve')) return fail('only a signed-in admin can approve or send a newsletter', 403);
  if (msg.includes('newsletters are born as drafts')) return fail('newsletters are born as drafts', 400);
  if (msg.includes('sent newsletters are locked')) return fail('this issue was sent and is locked', 409);
  if (msg.includes('unknown newsletter status')) return fail('unknown status', 400);
  if (/append-only/i.test(msg)) return fail('newsletter history is append-only', 400);
  if (/CHECK constraint/i.test(msg)) return fail('that draft did not pass the database checks', 400);
  return fail('database error', 500);
}
