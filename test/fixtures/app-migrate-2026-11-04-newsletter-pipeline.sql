-- TEST FIXTURE ONLY. Never apply this file. It is a byte-for-byte copy of the
-- members app's db/migrate-2026-11-04-newsletter-pipeline.sql, which is the one
-- to apply (once, from the app repo) when Brian approves.

-- Newsletter pipeline: drafts from Barnabas, versions, an audit trail, and a
-- human approve-and-send gate. Extends the existing `newsletters` table.
--
-- Why extend instead of a new table: `newsletters` already holds every draft
-- and sent issue the composer has written (body_json is the composer's
-- structured content), member delete already nulls newsletters.created_by,
-- and a second table would split the history of the Field Letter in two.
--
-- Additive only. Nothing is dropped, renamed, or rewritten, and the existing
-- send/save code keeps working against this shape (it never sets `author`,
-- so none of the new guards below apply to its rows).
--
--   * new nullable columns on `newsletters` (plus current_rev, default 1)
--   * newsletter_versions (append-only, like blog_post_versions)
--   * newsletter_activity_log (append-only, like blog_activity_log)
--   * guard triggers:
--       - status must be draft | ready | approved | sent | failed
--       - pipeline rows (author set) are born as drafts
--       - a pipeline row reaches approved/sent only with approved_by and
--         approved_at set; the site's draft API never writes either column,
--         so a draft key cannot approve or send at the database level
--       - a sent row's content and audit columns are frozen
--       - approved (in flight) and sent rows cannot be deleted
--   * backfills version 1 for every existing row
--
-- Run ONCE. SQLite has no ADD COLUMN IF NOT EXISTS, so a second run stops at
-- the first ALTER with "duplicate column name" before changing anything.
--
-- Applied to the SHARED D1 `crownandcompass`. Do not run the remote command
-- until Brian approves it. Apply BEFORE merging the app and site PRs that use it.
-- Local:  npx wrangler d1 execute crownandcompass --local --file=db/migrate-2026-11-04-newsletter-pipeline.sql
-- Remote (Brian, after review):
--   npx wrangler d1 execute crownandcompass --remote --file=db/migrate-2026-11-04-newsletter-pipeline.sql

ALTER TABLE newsletters ADD COLUMN issue_date TEXT
  CHECK (issue_date IS NULL OR issue_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]');
-- Who wrote it: a draft-API actor ('barnabas', 'david', 'pulpit', 'brian'),
-- or 'admin' for a draft started in the app composer. NULL on legacy rows.
ALTER TABLE newsletters ADD COLUMN author TEXT
  CHECK (author IS NULL OR author IN ('brian', 'pulpit', 'david', 'barnabas', 'admin'));
-- Last editor: an API actor name, or 'admin:<member id>' from the app.
ALTER TABLE newsletters ADD COLUMN updated_by TEXT;
ALTER TABLE newsletters ADD COLUMN current_rev INTEGER NOT NULL DEFAULT 1;
ALTER TABLE newsletters ADD COLUMN updated_at DATETIME;
ALTER TABLE newsletters ADD COLUMN ready_at DATETIME;
-- Approval: the signed-in admin who clicked Approve and send, and the exact
-- revision he confirmed. Member ids are not foreign keys on purpose, so a
-- member delete never has to touch the audit trail; the email is a snapshot.
ALTER TABLE newsletters ADD COLUMN approved_by INTEGER;
ALTER TABLE newsletters ADD COLUMN approved_by_email TEXT;
ALTER TABLE newsletters ADD COLUMN approved_at DATETIME;
ALTER TABLE newsletters ADD COLUMN approved_rev INTEGER;
-- Send audit. recipient_count (existing) is the number SendGrid accepted.
ALTER TABLE newsletters ADD COLUMN send_started_at DATETIME;
ALTER TABLE newsletters ADD COLUMN sent_by INTEGER;
ALTER TABLE newsletters ADD COLUMN sent_by_email TEXT;
ALTER TABLE newsletters ADD COLUMN attempted_count INTEGER;
ALTER TABLE newsletters ADD COLUMN failed_count INTEGER;
-- Frozen copy of exactly what went out, and its SHA-256 (hex).
ALTER TABLE newsletters ADD COLUMN sent_subject TEXT;
ALTER TABLE newsletters ADD COLUMN sent_html TEXT;
ALTER TABLE newsletters ADD COLUMN sent_html_sha256 TEXT;
-- JSON: SendGrid statuses, X-Message-Id values, and any failed addresses.
ALTER TABLE newsletters ADD COLUMN send_report TEXT;

CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters (status, id DESC);

CREATE TABLE IF NOT EXISTS newsletter_versions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  newsletter_id INTEGER NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  rev           INTEGER NOT NULL CHECK (rev >= 1),
  subject       TEXT NOT NULL,
  preheader     TEXT,
  body_json     TEXT NOT NULL,
  issue_date    TEXT,
  status        TEXT NOT NULL,
  edited_by     TEXT NOT NULL,
  note          TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (newsletter_id, rev)
);

CREATE TABLE IF NOT EXISTS newsletter_activity_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor         TEXT NOT NULL,
  action        TEXT NOT NULL,
  newsletter_id INTEGER,
  detail        TEXT,
  ok            INTEGER NOT NULL CHECK (ok IN (0, 1))
);
CREATE INDEX IF NOT EXISTS idx_newsletter_activity_letter ON newsletter_activity_log (newsletter_id, at);

CREATE TRIGGER IF NOT EXISTS newsletters_status_insert
BEFORE INSERT ON newsletters
WHEN NEW.status NOT IN ('draft', 'ready', 'approved', 'sent', 'failed')
BEGIN
  SELECT RAISE(ABORT, 'unknown newsletter status');
END;

CREATE TRIGGER IF NOT EXISTS newsletters_status_update
BEFORE UPDATE OF status ON newsletters
WHEN NEW.status NOT IN ('draft', 'ready', 'approved', 'sent', 'failed')
BEGIN
  SELECT RAISE(ABORT, 'unknown newsletter status');
END;

CREATE TRIGGER IF NOT EXISTS newsletters_born_draft
BEFORE INSERT ON newsletters
WHEN NEW.author IS NOT NULL AND NEW.status <> 'draft'
BEGIN
  SELECT RAISE(ABORT, 'newsletters are born as drafts');
END;

CREATE TRIGGER IF NOT EXISTS newsletters_approve_guard
BEFORE UPDATE ON newsletters
WHEN NEW.author IS NOT NULL
  AND NEW.status IN ('approved', 'sent')
  AND (NEW.approved_by IS NULL OR NEW.approved_at IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'only a signed-in admin can approve a newsletter');
END;

CREATE TRIGGER IF NOT EXISTS newsletters_sent_lock
BEFORE UPDATE ON newsletters
WHEN OLD.status = 'sent' AND (
  NEW.status IS NOT OLD.status
  OR NEW.subject IS NOT OLD.subject
  OR NEW.preheader IS NOT OLD.preheader
  OR NEW.body_json IS NOT OLD.body_json
  OR NEW.issue_date IS NOT OLD.issue_date
  OR NEW.current_rev IS NOT OLD.current_rev
  OR NEW.recipient_count IS NOT OLD.recipient_count
  OR NEW.sent_at IS NOT OLD.sent_at
  OR NEW.approved_at IS NOT OLD.approved_at
  OR NEW.approved_rev IS NOT OLD.approved_rev
  OR NEW.sent_subject IS NOT OLD.sent_subject
  OR NEW.sent_html IS NOT OLD.sent_html
  OR NEW.sent_html_sha256 IS NOT OLD.sent_html_sha256
  OR NEW.send_report IS NOT OLD.send_report
)
BEGIN
  SELECT RAISE(ABORT, 'sent newsletters are locked');
END;

CREATE TRIGGER IF NOT EXISTS newsletters_no_delete_sent
BEFORE DELETE ON newsletters
WHEN OLD.status IN ('approved', 'sent')
BEGIN
  SELECT RAISE(ABORT, 'sent newsletters are locked');
END;

CREATE TRIGGER IF NOT EXISTS newsletter_versions_no_update
BEFORE UPDATE ON newsletter_versions
BEGIN
  SELECT RAISE(ABORT, 'newsletter versions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS newsletter_versions_no_delete
BEFORE DELETE ON newsletter_versions
BEGIN
  SELECT RAISE(ABORT, 'newsletter versions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS newsletter_activity_log_no_update
BEFORE UPDATE ON newsletter_activity_log
BEGIN
  SELECT RAISE(ABORT, 'newsletter activity log is append-only');
END;

CREATE TRIGGER IF NOT EXISTS newsletter_activity_log_no_delete
BEFORE DELETE ON newsletter_activity_log
BEGIN
  SELECT RAISE(ABORT, 'newsletter activity log is append-only');
END;

-- Every existing row gets a version 1, so history starts complete.
INSERT INTO newsletter_versions (newsletter_id, rev, subject, preheader, body_json, issue_date, status, edited_by, note, created_at)
SELECT n.id, 1, n.subject, n.preheader, n.body_json, NULL, n.status,
       CASE WHEN n.created_by IS NULL THEN 'legacy' ELSE 'admin:' || n.created_by END,
       'backfill', n.created_at
FROM newsletters n
WHERE NOT EXISTS (SELECT 1 FROM newsletter_versions v WHERE v.newsletter_id = n.id AND v.rev = 1);
