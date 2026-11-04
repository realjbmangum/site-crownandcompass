-- TEST FIXTURE ONLY. Never apply this to any database.
-- The `newsletters` table as the members app created it before the newsletter
-- pipeline (crownandcompass app repo, db/schema.sql at 94daf0d), plus a stub
-- members table so the foreign key resolves. The site tests load this, then
-- the app's migration (copied next to it), to exercise the real schema.
CREATE TABLE members (id INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS newsletters (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  subject         TEXT NOT NULL,
  preheader       TEXT,
  body_json       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  created_by      INTEGER REFERENCES members(id),
  recipient_count INTEGER DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at         DATETIME
);
