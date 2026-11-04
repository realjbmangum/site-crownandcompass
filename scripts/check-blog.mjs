/**
 * Offline checks for the blog migration. No network, no production database.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const migrationRaw = readFileSync(join(ROOT, 'migrations/0001_blog.sql'), 'utf8');
const migration = migrationRaw.replace(/--.*$/gm, '');
const sql = readFileSync(join(ROOT, 'data/blog-import.sql'), 'utf8');
const manifest = JSON.parse(readFileSync(join(ROOT, 'data/blog-r2-manifest.json'), 'utf8'));
const redirects = readFileSync(join(ROOT, 'public/_redirects'), 'utf8');
const routes = readFileSync(join(ROOT, 'public/_routes.json'), 'utf8');

assert.match(migrationRaw, /CREATE TABLE IF NOT EXISTS blog_posts/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS blog_post_versions/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS blog_activity_log/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS blog_tags/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS blog_post_tags/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS blog_projects/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS blog_post_projects/);
assert.doesNotMatch(migration, /CREATE TABLE posts\b/);
assert.doesNotMatch(migration, /ALTER TABLE/);
assert.doesNotMatch(migration, /DROP TABLE/);
assert.doesNotMatch(migration, /\b(members|magic_links|sessions|subscribers|newsletter_sends)\b/);
assert.match(migration, /posts are born as drafts/);
assert.match(migration, /only brian can publish/);
assert.match(migration, /'barnabas'/);

const excluded = ['chasing-dopamine', 'wife-feel-loved'];
for (const slug of excluded) {
  assert.equal(sql.includes(`'${slug}'`), false, `${slug} must not be inserted`);
  assert.equal(JSON.stringify(manifest.objects).includes(slug), false);
  assert.equal(redirects.includes(`/blog/${slug}`), false, `${slug} must not gain a new URL`);
}

const expected = [
  'fight-club-with-books',
  'travel-schedule-idol',
  'so-does-sedation',
  'fifteen-percent-no-friends',
  'the-long-walk',
  'projects-priorities',
  'question-cut-through',
  'verse-in-your-pocket',
  'falling-in-love-again',
  'prioritize-your-mind',
];
for (const slug of expected) {
  assert.equal(sql.includes(`'${slug}'`), true, `missing ${slug}`);
  assert.match(redirects, new RegExp(`/${slug}\\s+/blog/${slug}\\s+301`));
  assert.equal(manifest.objects.some((object) => object.slug === slug), true);
}
assert.equal(manifest.objects.length, expected.length);
assert.match(routes, /\/blog/);
assert.match(routes, /\/media\/\*/);
assert.match(readFileSync(join(ROOT, 'wrangler.toml'), 'utf8'), /crownandcompass-media-preview/);
assert.match(readFileSync(join(ROOT, 'wrangler.toml'), 'utf8'), /crownandcompass-media"/);

const render = spawnSync(process.execPath, ['--experimental-strip-types', join(ROOT, 'scripts/render-test.ts')], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (render.status !== 0) {
  console.error(render.stdout);
  console.error(render.stderr);
  process.exit(render.status ?? 1);
}
console.log(render.stdout.trim());
console.log('check-blog: ok');
