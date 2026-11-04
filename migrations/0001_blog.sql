-- Public blog tables for thecrownandcompass.org.
--
-- The crownandcompass D1 database is shared with the members app. That app
-- already owns `posts` (Watch discussions), plus members, sessions, magic_links,
-- subscribers, and the rest of the roster. This migration only creates new
-- blog_* tables. It does not ALTER, DROP, or write any existing table.
--
-- Shape follows jbmangum's content schema (posts, post_versions, activity_log,
-- tags, post_tags, projects, post_projects), including the "born as a draft"
-- and "only brian can publish" guards.
--
-- jbmangum also requires every slug to start with its pub_date, because those
-- public URLs are dated (/blog/2026-09-12-title/). These essays already have
-- stable slugs (/the-long-walk). That date-prefix trigger is not copied.
--
-- Apply only after review:
--   npx wrangler d1 migrations apply crownandcompass --remote
-- Do not apply this file to production from CI.

CREATE TABLE IF NOT EXISTS blog_posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 180),
  description     TEXT NOT NULL CHECK (length(trim(description)) > 0 AND length(description) <= 300),
  body            TEXT NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 100000),
  pub_date        TEXT NOT NULL CHECK (pub_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  hero_image_key  TEXT CHECK (hero_image_key IS NULL OR length(hero_image_key) <= 240),
  hero_image_alt  TEXT CHECK (hero_image_alt IS NULL OR length(hero_image_alt) <= 300),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published')),
  author          TEXT NOT NULL CHECK (author IN ('brian', 'pulpit', 'david', 'barnabas')),
  current_rev     INTEGER NOT NULL DEFAULT 1 CHECK (current_rev >= 1),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  published_at    TEXT,
  published_by    TEXT CHECK (published_by IS NULL OR published_by = 'brian'),
  CHECK (
    (hero_image_key IS NULL AND hero_image_alt IS NULL)
    OR (
      hero_image_key IS NOT NULL
      AND hero_image_alt IS NOT NULL
      AND length(trim(hero_image_alt)) > 0
    )
  ),
  CHECK (status <> 'published' OR published_by = 'brian'),
  CHECK (
    length(slug) BETWEEN 1 AND 80
    AND slug = lower(slug)
    AND instr(slug, ' ') = 0
    AND instr(slug, '/') = 0
  )
);

CREATE TABLE IF NOT EXISTS blog_post_versions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id        INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  rev            INTEGER NOT NULL CHECK (rev >= 1),
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  body           TEXT NOT NULL,
  hero_image_key TEXT,
  hero_image_alt TEXT,
  status         TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'published')),
  edited_by      TEXT NOT NULL CHECK (edited_by IN ('brian', 'pulpit', 'david', 'barnabas')),
  note           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (post_id, rev)
);

CREATE TABLE IF NOT EXISTS blog_activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  at           TEXT NOT NULL DEFAULT (datetime('now')),
  actor        TEXT NOT NULL,
  action       TEXT NOT NULL,
  post_id      INTEGER,
  project_slug TEXT,
  detail       TEXT,
  ok           INTEGER NOT NULL CHECK (ok IN (0, 1))
);

CREATE TABLE IF NOT EXISTS blog_tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL CHECK (length(trim(label)) > 0)
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_projects (
  slug           TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 120),
  repo           TEXT CHECK (repo IS NULL OR length(repo) <= 120),
  description    TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 300),
  link           TEXT CHECK (link IS NULL OR length(link) <= 300),
  status         TEXT NOT NULL CHECK (status IN ('LIVE', 'IN PROGRESS', 'PARKED', 'RETIRED')),
  visible        INTEGER NOT NULL DEFAULT 0 CHECK (visible IN (0, 1)),
  sort           INTEGER NOT NULL DEFAULT 100,
  discovered_via TEXT NOT NULL DEFAULT 'manual' CHECK (discovered_via IN ('manual', 'seed', 'github')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blog_post_projects (
  post_id      INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  project_slug TEXT NOT NULL REFERENCES blog_projects(slug),
  PRIMARY KEY (post_id, project_slug)
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_pub_date ON blog_posts (status, pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_activity_log_at ON blog_activity_log (at);
CREATE INDEX IF NOT EXISTS idx_blog_activity_log_post ON blog_activity_log (post_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_projects_repo ON blog_projects (repo) WHERE repo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_projects_visible_sort ON blog_projects (visible, sort);

CREATE TRIGGER IF NOT EXISTS blog_posts_born_draft
BEFORE INSERT ON blog_posts
WHEN NEW.status <> 'draft'
BEGIN
  SELECT RAISE(ABORT, 'posts are born as drafts');
END;

CREATE TRIGGER IF NOT EXISTS blog_posts_publish_guard
BEFORE UPDATE OF status ON blog_posts
WHEN NEW.status = 'published' AND (NEW.published_by IS NULL OR NEW.published_by <> 'brian')
BEGIN
  SELECT RAISE(ABORT, 'only brian can publish');
END;

CREATE TRIGGER IF NOT EXISTS blog_post_versions_no_update
BEFORE UPDATE ON blog_post_versions
BEGIN
  SELECT RAISE(ABORT, 'post versions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS blog_post_versions_no_delete
BEFORE DELETE ON blog_post_versions
BEGIN
  SELECT RAISE(ABORT, 'post versions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS blog_activity_log_no_update
BEFORE UPDATE ON blog_activity_log
BEGIN
  SELECT RAISE(ABORT, 'activity log is append-only');
END;

CREATE TRIGGER IF NOT EXISTS blog_activity_log_no_delete
BEFORE DELETE ON blog_activity_log
BEGIN
  SELECT RAISE(ABORT, 'activity log is append-only');
END;
