import type { D1Database } from './types';
import type { Actor } from '../api/auth';
import type { PostInput, PostRow } from '../content/posts';

const POST_COLUMNS = `p.id, p.slug, p.title, p.description, p.body, p.pub_date,
  p.hero_image_key, p.hero_image_alt, p.status, p.author, p.current_rev,
  p.created_at, p.updated_at, p.published_at, p.published_by`;

const TAG_COLUMN = `(SELECT t.label FROM blog_tags t
  JOIN blog_post_tags pt ON pt.tag_id = t.id
  WHERE pt.post_id = p.id
  ORDER BY t.label
  LIMIT 1) AS tag`;

export async function listPublished(db: D1Database): Promise<PostRow[]> {
  const result = await db
    .prepare(
      `SELECT ${POST_COLUMNS}, ${TAG_COLUMN}
       FROM blog_posts p
       WHERE p.status = 'published'
       ORDER BY p.pub_date DESC, p.slug ASC`
    )
    .all<PostRow>();
  return result.results ?? [];
}

export async function getPublished(db: D1Database, slug: string): Promise<PostRow | null> {
  return db
    .prepare(
      `SELECT ${POST_COLUMNS}, ${TAG_COLUMN}
       FROM blog_posts p
       WHERE p.slug = ? AND p.status = 'published'`
    )
    .bind(slug)
    .first<PostRow>();
}

export async function getAny(db: D1Database, slug: string): Promise<PostRow | null> {
  return db
    .prepare(`SELECT ${POST_COLUMNS}, ${TAG_COLUMN} FROM blog_posts p WHERE p.slug = ?`)
    .bind(slug)
    .first<PostRow>();
}

export async function relatedPosts(db: D1Database, slug: string, tag: string | null): Promise<PostRow[]> {
  if (tag) {
    const tagged = await db
      .prepare(
        `SELECT ${POST_COLUMNS}, ${TAG_COLUMN}
         FROM blog_posts p
         WHERE p.status = 'published' AND p.slug <> ?
           AND EXISTS (
             SELECT 1 FROM blog_post_tags pt
             JOIN blog_tags t ON t.id = pt.tag_id
             WHERE pt.post_id = p.id AND t.label = ?
           )
         ORDER BY p.pub_date DESC
         LIMIT 2`
      )
      .bind(slug, tag)
      .all<PostRow>();
    if ((tagged.results ?? []).length >= 2) return tagged.results ?? [];
  }
  const rest = await db
    .prepare(
      `SELECT ${POST_COLUMNS}, ${TAG_COLUMN}
       FROM blog_posts p
       WHERE p.status = 'published' AND p.slug <> ?
       ORDER BY p.pub_date DESC
       LIMIT 2`
    )
    .bind(slug)
    .all<PostRow>();
  return rest.results ?? [];
}

function tagStatements(db: D1Database, slug: string, tags: PostInput['tags']) {
  return tags.flatMap((tag) => [
    db.prepare(
      `INSERT INTO blog_tags (slug, label) VALUES (?, ?)
       ON CONFLICT(slug) DO UPDATE SET label = excluded.label`
    ).bind(tag.slug, tag.label),
    db.prepare(
      `INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
       SELECT p.id, t.id FROM blog_posts p, blog_tags t
       WHERE p.slug = ? AND t.slug = ?`
    ).bind(slug, tag.slug),
  ]);
}

export async function createDraft(
  db: D1Database,
  input: PostInput,
  actor: Actor,
  source: string | null
): Promise<void> {
  const detail = JSON.stringify({ slug: input.slug, source });
  await db.batch([
    db.prepare(
      `INSERT INTO blog_posts (
         slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, 1)`
    ).bind(
      input.slug,
      input.title,
      input.description,
      input.body,
      input.pubDate,
      input.heroImageKey,
      input.heroImageAlt,
      actor
    ),
    db.prepare(
      `INSERT INTO blog_post_versions (
         post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note
       )
       SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', ?, 'created'
       FROM blog_posts WHERE slug = ?`
    ).bind(actor, input.slug),
    db.prepare(
      `INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
       SELECT ?, 'draft.create', id, ?, 1 FROM blog_posts WHERE slug = ?`
    ).bind(actor, detail, input.slug),
    ...tagStatements(db, input.slug, input.tags),
  ]);
}

export async function replaceTags(db: D1Database, slug: string, tags: PostInput['tags']): Promise<void> {
  await db.batch([
    db.prepare(
      `DELETE FROM blog_post_tags
       WHERE post_id = (SELECT id FROM blog_posts WHERE slug = ?)`
    ).bind(slug),
    ...tagStatements(db, slug, tags),
  ]);
}

export async function saveRevision(
  db: D1Database,
  input: PostInput,
  actor: Actor,
  status: PostRow['status'],
  rev: number,
  note: string,
  action: string
): Promise<void> {
  const detail = JSON.stringify({ slug: input.slug, note });
  await db.batch([
    db.prepare(
      `UPDATE blog_posts
       SET title = ?, description = ?, body = ?, pub_date = ?,
           hero_image_key = ?, hero_image_alt = ?, status = ?,
           current_rev = ?, updated_at = datetime('now')
       WHERE slug = ?`
    ).bind(
      input.title,
      input.description,
      input.body,
      input.pubDate,
      input.heroImageKey,
      input.heroImageAlt,
      status,
      rev,
      input.slug
    ),
    db.prepare(
      `INSERT INTO blog_post_versions (
         post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note
       )
       SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM blog_posts WHERE slug = ?`
    ).bind(
      rev,
      input.title,
      input.description,
      input.body,
      input.heroImageKey,
      input.heroImageAlt,
      status,
      actor,
      note,
      input.slug
    ),
    db.prepare(
      `INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
       SELECT ?, ?, id, ?, 1 FROM blog_posts WHERE slug = ?`
    ).bind(actor, action, detail, input.slug),
  ]);
}

export async function publishPost(db: D1Database, row: PostRow): Promise<number> {
  const rev = row.current_rev + 1;
  const detail = JSON.stringify({ slug: row.slug });
  await db.batch([
    db.prepare(
      `UPDATE blog_posts
       SET status = 'published',
           published_by = 'brian',
           published_at = datetime('now'),
           current_rev = ?,
           updated_at = datetime('now')
       WHERE slug = ? AND status <> 'published'`
    ).bind(rev, row.slug),
    db.prepare(
      `INSERT INTO blog_post_versions (
         post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note
       )
       SELECT id, ?, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish'
       FROM blog_posts WHERE slug = ?`
    ).bind(rev, row.slug),
    db.prepare(
      `INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
       SELECT 'brian', 'post.publish', id, ?, 1 FROM blog_posts WHERE slug = ?`
    ).bind(detail, row.slug),
  ]);
  return rev;
}

export function summary(row: PostRow) {
  return {
    slug: row.slug,
    title: row.title,
    status: row.status,
    rev: row.current_rev,
    author: row.author,
    pub_date: row.pub_date,
    published_by: row.published_by,
  };
}
