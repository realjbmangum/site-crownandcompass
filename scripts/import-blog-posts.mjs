/**
 * Build data/blog-import.sql and data/blog-r2-manifest.json from the static
 * essays in public/. Does not connect to D1 or R2.
 *
 * Excluded on purpose (privacy, left on their current pages):
 *   chasing-dopamine, wife-feel-loved
 *
 * Load shape matches the jbmangum Substack import: insert as a draft (the
 * schema refuses anything else), write the version and activity rows, then
 * publish with published_by = 'brian'.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PUBLIC = join(ROOT, 'public');
const EXCLUDED = new Set(['chasing-dopamine', 'wife-feel-loved']);

function decode(value) {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&rdquo;/g, '\u201d')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&middot;/g, '\u00b7')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function sql(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function innerProse(html, file) {
  const marker = '<div class="prose">';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`${file}: no prose block`);
  let i = start + marker.length;
  let depth = 1;
  const begin = i;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose < 0) throw new Error(`${file}: unclosed prose`);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) return html.slice(begin, nextClose).trim();
      i = nextClose + 6;
    }
  }
  throw new Error(`${file}: unclosed prose`);
}

function field(html, re, file, label) {
  const match = html.match(re);
  if (!match) throw new Error(`${file}: missing ${label}`);
  return decode(match[1].trim());
}

function contentType(file) {
  const ext = extname(file).slice(1).toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  throw new Error(`unsupported image ${file}`);
}

function isoFromLong(value) {
  const months = {
    January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
    July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
  };
  const match = value.match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  if (!match || !months[match[1]]) throw new Error(`bad date ${value}`);
  return `${match[3]}-${months[match[1]]}-${match[2].padStart(2, '0')}`;
}

function tagSlug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const posts = [];
for (const name of readdirSync(PUBLIC)) {
  if (!name.endsWith('.html')) continue;
  const html = readFileSync(join(PUBLIC, name), 'utf8');
  if (!html.includes('All articles')) continue;
  const slug = name.replace(/\.html$/, '');
  if (EXCLUDED.has(slug)) continue;

  const title = field(html, /<h1 class="article-title">([^<]+)<\/h1>/, name, 'title');
  const description = field(html, /<meta name="description" content="([^"]*)"/, name, 'description');
  const iso = html.match(/"datePublished":"(\d{4}-\d{2}-\d{2})"/);
  const byline = html.match(/<div class="byline">[\s\S]*?<span>([A-Z][a-z]+ \d{1,2}, \d{4})<\/span>/);
  const pubDate = iso ? iso[1] : (byline ? isoFromLong(byline[1]) : '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pubDate)) throw new Error(`${name}: missing date`);
  const tag = field(html, /<span class="tag">([^<]+)<\/span>/, name, 'tag');
  const heroTag = html.match(/<div class="imgph[^"]*hero-img[^"]*"[^>]*>/);
  if (!heroTag) throw new Error(`${name}: no hero`);
  const src = heroTag[0].match(/url\('([^']+)'\)/);
  if (!src) throw new Error(`${name}: no hero url`);
  const source = src[1].replace(/^\.\//, '');
  if (!source.startsWith('img/')) throw new Error(`${name}: unexpected hero ${source}`);
  const label = heroTag[0].match(/data-label="([^"]*)"/);
  const alt = (label ? decode(label[1]) : title).slice(0, 300);
  const body = innerProse(html, name);
  const ext = extname(source).slice(1).toLowerCase().replace('jpeg', 'jpg');
  const [year, month] = pubDate.split('-');
  const key = `blog/${year}/${month}/${slug}/01.${ext}`;

  if (title.length > 180) throw new Error(`${slug} title is ${title.length} chars`);
  if (description.length > 300) throw new Error(`${slug} description is ${description.length} chars`);
  if (body.length > 100000) throw new Error(`${slug} body is ${body.length} chars`);
  if (!body.trim()) throw new Error(`${slug} body is empty`);

  posts.push({
    slug,
    title,
    description,
    pubDate,
    tag,
    tagSlug: tagSlug(tag),
    alt,
    body,
    key,
    source: `public/${source}`,
    contentType: contentType(source),
  });
}

posts.sort((a, b) => a.pubDate.localeCompare(b.pubDate) || a.slug.localeCompare(b.slug));
if (posts.length !== 10) {
  throw new Error(`expected 10 essays, found ${posts.length}: ${posts.map((p) => p.slug).join(', ')}`);
}

const lines = [];
lines.push('-- Load the public essays into blog_posts.');
lines.push('--');
lines.push('-- Not included, and left on their current URLs until Brian decides:');
lines.push('--   chasing-dopamine (names his wife), wife-feel-loved (private marriage detail and workplace).');
lines.push('--');
lines.push('-- Same two-step as the jbmangum Substack import: born as a draft, then');
lines.push("-- published with published_by = 'brian', plus a version row and an activity");
lines.push('-- row for each step. Run once, after migrations/0001_blog.sql.');
lines.push('--');
lines.push('-- Production (only after approval):');
lines.push('--   npx wrangler d1 execute crownandcompass --remote --file=data/blog-import.sql');
lines.push('-- Preview database is crownandcompass-preview, not crownandcompass.');
lines.push('--');
lines.push('-- Each statement is safe to re-run. D1 rejects SQL BEGIN/COMMIT, so this');
lines.push('-- file does not wrap a transaction. A second run inserts nothing new.');
lines.push('');
for (const post of posts) {
  const detailCreate = JSON.stringify({ slug: post.slug, source: `static:${post.slug}` });
  const detailPublish = JSON.stringify({ slug: post.slug, source: `static:${post.slug}` });
  lines.push('');
  lines.push(`-- ${post.slug}`);
  lines.push(
    `INSERT INTO blog_posts (slug, title, description, body, pub_date, hero_image_key, hero_image_alt, status, author, current_rev)
     SELECT ${sql(post.slug)}, ${sql(post.title)}, ${sql(post.description)}, ${sql(post.body)}, ${sql(post.pubDate)}, ${sql(post.key)}, ${sql(post.alt)}, 'draft', 'brian', 1
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = ${sql(post.slug)});`
  );
  lines.push(
    `INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 1, title, description, body, hero_image_key, hero_image_alt, 'draft', 'brian', 'created (static import)'
     FROM blog_posts p WHERE slug = ${sql(post.slug)}
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 1);`
  );
  lines.push(
    `INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'draft.create', id, ${sql(detailCreate)}, 1 FROM blog_posts p WHERE slug = ${sql(post.slug)}
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'draft.create');`
  );
  lines.push(
    `INSERT INTO blog_tags (slug, label) VALUES (${sql(post.tagSlug)}, ${sql(post.tag)})
     ON CONFLICT(slug) DO UPDATE SET label = excluded.label;`
  );
  lines.push(
    `INSERT OR IGNORE INTO blog_post_tags (post_id, tag_id)
     SELECT p.id, t.id FROM blog_posts p, blog_tags t
     WHERE p.slug = ${sql(post.slug)} AND t.slug = ${sql(post.tagSlug)};`
  );
  lines.push(
    `UPDATE blog_posts
     SET status = 'published', published_by = 'brian', published_at = ${sql(`${post.pubDate} 12:00:00`)},
         current_rev = 2, updated_at = ${sql(`${post.pubDate} 12:00:00`)}
     WHERE slug = ${sql(post.slug)} AND status = 'draft';`
  );
  lines.push(
    `INSERT INTO blog_post_versions (post_id, rev, title, description, body, hero_image_key, hero_image_alt, status, edited_by, note)
     SELECT id, 2, title, description, body, hero_image_key, hero_image_alt, 'published', 'brian', 'publish (static import)'
     FROM blog_posts p WHERE slug = ${sql(post.slug)}
       AND NOT EXISTS (SELECT 1 FROM blog_post_versions v WHERE v.post_id = p.id AND v.rev = 2);`
  );
  lines.push(
    `INSERT INTO blog_activity_log (actor, action, post_id, detail, ok)
     SELECT 'brian', 'post.publish', id, ${sql(detailPublish)}, 1 FROM blog_posts p WHERE slug = ${sql(post.slug)}
       AND NOT EXISTS (SELECT 1 FROM blog_activity_log a WHERE a.post_id = p.id AND a.action = 'post.publish');`
  );
}
lines.push('');

writeFileSync(join(ROOT, 'data/blog-import.sql'), lines.join('\n'));

const manifest = {
  key_layout: 'blog/YYYY/MM/<slug>/NN.ext',
  public_path: '/media/<key>',
  bucket_production: 'crownandcompass-media',
  bucket_preview: 'crownandcompass-media-preview',
  excluded_slugs: [...EXCLUDED],
  objects: posts.map((post) => ({
    slug: post.slug,
    key: post.key,
    source: post.source,
    content_type: post.contentType,
    alt: post.alt,
  })),
};
writeFileSync(join(ROOT, 'data/blog-r2-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${posts.length} essays`);
for (const post of posts) console.log(`  ${post.pubDate}  ${post.slug}  ${post.key}`);
