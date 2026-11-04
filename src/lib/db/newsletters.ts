// The shared `newsletters` table (owned by the members app; see the app's
// db/migrate-2026-11-04-newsletter-pipeline.sql). This module only creates and
// edits drafts and marks them ready. It never writes approved_*, sent_*, or a
// status past 'ready'; database triggers refuse a pipeline row moving to
// approved or sent without a signed-in admin's approved_by anyway.

import type { Actor } from '../api/auth';
import { toContent, type NewsletterDraftFields, type NewsletterStatus } from '../content/newsletters';
import type { D1Database } from './types';

export interface NewsletterRow {
  id: number;
  subject: string;
  preheader: string | null;
  body_json: string;
  status: NewsletterStatus;
  issue_date: string | null;
  author: string | null;
  updated_by: string | null;
  current_rev: number;
  created_at: string;
  updated_at: string | null;
  ready_at: string | null;
  approved_at: string | null;
  sent_at: string | null;
  recipient_count: number | null;
}

const COLUMNS = `id, subject, preheader, body_json, status, issue_date, author, updated_by, current_rev,
  created_at, updated_at, ready_at, approved_at, sent_at, recipient_count`;

export async function getNewsletter(db: D1Database, id: number): Promise<NewsletterRow | null> {
  return db.prepare(`SELECT ${COLUMNS} FROM newsletters WHERE id = ?`).bind(id).first<NewsletterRow>();
}

export async function listNewsletters(db: D1Database, actor: Actor, limit = 20): Promise<NewsletterRow[]> {
  const sql = actor === 'brian'
    ? `SELECT ${COLUMNS} FROM newsletters WHERE author IS NOT NULL ORDER BY id DESC LIMIT ?`
    : `SELECT ${COLUMNS} FROM newsletters WHERE author = ? ORDER BY id DESC LIMIT ?`;
  const stmt = actor === 'brian' ? db.prepare(sql).bind(limit) : db.prepare(sql).bind(actor, limit);
  const res = await stmt.all<NewsletterRow>();
  return res.results ?? [];
}

/** What the API returns. Never includes send audit fields beyond the status. */
export function newsletterSummary(row: NewsletterRow) {
  let content: unknown = null;
  try {
    content = JSON.parse(row.body_json || 'null');
  } catch {
    content = null;
  }
  return {
    id: row.id,
    status: row.status,
    rev: row.current_rev,
    subject: row.subject,
    preheader: row.preheader,
    issue_date: row.issue_date,
    author: row.author,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    ready_at: row.ready_at,
    sent_at: row.sent_at,
    content,
    review_url: `https://app.thecrownandcompass.org/admin/newsletter?id=${row.id}`,
  };
}

function versionStatement(db: D1Database, id: number, rev: number, actor: string, note: string) {
  return db.prepare(
    `INSERT INTO newsletter_versions (newsletter_id, rev, subject, preheader, body_json, issue_date, status, edited_by, note)
     SELECT id, ?, subject, preheader, body_json, issue_date, status, ?, ? FROM newsletters WHERE id = ? AND current_rev = ?`
  ).bind(rev, actor, note, id, rev);
}

function logStatement(db: D1Database, actor: string, action: string, id: number, rev: number, detail: unknown) {
  return db.prepare(
    `INSERT INTO newsletter_activity_log (actor, action, newsletter_id, detail, ok)
     SELECT ?, ?, id, ?, 1 FROM newsletters WHERE id = ? AND current_rev = ? AND updated_by = ?`
  ).bind(actor, action, JSON.stringify(detail), id, rev, actor);
}

export async function createNewsletterDraft(
  db: D1Database,
  fields: NewsletterDraftFields,
  actor: Actor,
  source: string
): Promise<number> {
  const res = await db.prepare(
    `INSERT INTO newsletters (subject, preheader, body_json, status, created_by, issue_date, author, updated_by, current_rev, updated_at)
     VALUES (?, ?, ?, 'draft', NULL, ?, ?, ?, 1, CURRENT_TIMESTAMP)`
  ).bind(
    fields.subject,
    fields.preheader || null,
    JSON.stringify(toContent(fields)),
    fields.issueDate,
    actor,
    actor
  ).run();
  const id = Number(res.meta?.last_row_id);
  if (!Number.isInteger(id) || id <= 0) throw new Error('newsletter insert returned no id');
  await db.batch([
    versionStatement(db, id, 1, actor, 'created'),
    logStatement(db, actor, 'newsletter.create', id, 1, { source: source || null }),
  ]);
  return id;
}

/**
 * Save a new revision. Refuses (returns false) when the row moved on since it
 * was read: another save, an app edit, or an approval. The WHERE clause is the
 * guard, so two writers cannot both win.
 */
export async function saveNewsletterRevision(
  db: D1Database,
  row: NewsletterRow,
  fields: NewsletterDraftFields,
  actor: Actor,
  status: 'draft' | 'ready',
  note: string,
  action: string
): Promise<boolean> {
  const rev = row.current_rev + 1;
  const ownerGuard = actor === 'brian' ? '' : ' AND author = ? AND updated_by = ?';
  const update = db.prepare(
    `UPDATE newsletters
        SET subject = ?, preheader = ?, body_json = ?, issue_date = ?, status = ?,
            ready_at = CASE WHEN ? = 'ready' THEN COALESCE(ready_at, CURRENT_TIMESTAMP) ELSE ready_at END,
            updated_by = ?, current_rev = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND current_rev = ? AND status IN ('draft', 'ready')${ownerGuard}`
  );
  const args: unknown[] = [
    fields.subject,
    fields.preheader || null,
    JSON.stringify(toContent(fields)),
    fields.issueDate,
    status,
    status,
    actor,
    rev,
    row.id,
    row.current_rev,
  ];
  if (actor !== 'brian') args.push(actor, actor);
  const results = await db.batch([
    update.bind(...args),
    versionStatement(db, row.id, rev, actor, note),
    logStatement(db, actor, action, row.id, rev, { rev, note }),
  ]);
  const changes = results?.[0]?.meta?.changes;
  return changes === undefined ? true : changes === 1;
}
