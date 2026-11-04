import type { Actor } from '../api/auth';

export const AUTHORS = ['brian', 'pulpit', 'david', 'barnabas'] as const;
export type Author = (typeof AUTHORS)[number];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_KEY_RE = /^blog\/\d{4}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/\d{2}\.(?:png|jpe?g|webp|gif)$/;

export interface PostInput {
  slug: string;
  title: string;
  description: string;
  body: string;
  pubDate: string;
  heroImageKey: string | null;
  heroImageAlt: string | null;
  tags: { slug: string; label: string }[];
}

export interface PostRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  pub_date: string;
  hero_image_key: string | null;
  hero_image_alt: string | null;
  status: 'draft' | 'ready' | 'published';
  author: Author;
  current_rev: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_by: string | null;
  tag: string | null;
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function tagSlug(label: string): string {
  return slugify(label).slice(0, 40);
}

function asString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function optionalText(
  value: unknown,
  max: number
): { ok: true; value: string | null } | { ok: false } {
  if (value == null || value === '') return { ok: true, value: null };
  const text = asString(value, max);
  if (!text) return { ok: false };
  return { ok: true, value: text };
}

export function parseTags(value: unknown): { slug: string; label: string }[] | string {
  if (value == null) return [];
  if (!Array.isArray(value)) return 'tags must be a list of labels';
  if (value.length > 8) return 'too many tags';
  const out: { slug: string; label: string }[] = [];
  for (const item of value) {
    const label = asString(item, 40);
    if (!label) return 'each tag must be a short label';
    const slug = tagSlug(label);
    if (!SLUG_RE.test(slug)) return 'a tag could not be turned into a slug';
    if (!out.some((tag) => tag.slug === slug)) out.push({ slug, label });
  }
  return out;
}

export function validatePostFields(input: {
  title: unknown;
  description: unknown;
  body: unknown;
  pubDate: unknown;
  slug: unknown;
  heroImageKey?: unknown;
  heroImageAlt?: unknown;
  tags?: unknown;
}): { ok: true; value: PostInput } | { ok: false; error: string } {
  const title = asString(input.title, 180);
  if (!title) return { ok: false, error: 'title is required (180 characters max)' };
  const description = asString(input.description, 300);
  if (!description) return { ok: false, error: 'description is required (300 characters max)' };
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!body || body.length > 100000) return { ok: false, error: 'body is required (100000 characters max)' };
  const pubDate = asString(input.pubDate, 10);
  if (!pubDate || !DATE_RE.test(pubDate) || Number.isNaN(Date.parse(`${pubDate}T00:00:00Z`))) {
    return { ok: false, error: 'pub_date must be YYYY-MM-DD' };
  }
  const slugRaw = asString(input.slug, 80);
  if (!slugRaw || !SLUG_RE.test(slugRaw)) {
    return { ok: false, error: 'slug must be lowercase words separated by single hyphens' };
  }
  const heroImageKey = optionalText(input.heroImageKey, 240);
  const heroImageAlt = optionalText(input.heroImageAlt, 300);
  if (!heroImageKey.ok || !heroImageAlt.ok) {
    return { ok: false, error: 'hero image needs both a key and alt text' };
  }
  if ((heroImageKey.value == null) !== (heroImageAlt.value == null)) {
    return { ok: false, error: 'hero image needs both a key and alt text' };
  }
  if (heroImageKey.value && !IMAGE_KEY_RE.test(heroImageKey.value)) {
    return { ok: false, error: 'hero image key must look like blog/YYYY/MM/slug/01.jpg' };
  }
  if (heroImageKey.value && !heroImageKey.value.includes(`/${slugRaw}/`)) {
    return { ok: false, error: 'hero image key must sit under this post slug' };
  }
  const tags = parseTags(input.tags);
  if (typeof tags === 'string') return { ok: false, error: tags };
  return {
    ok: true,
    value: {
      slug: slugRaw,
      title,
      description,
      body,
      pubDate,
      heroImageKey: heroImageKey.value,
      heroImageAlt: heroImageAlt.value,
      tags,
    },
  };
}

export function imageKey(pubDate: string, slug: string, n: number, ext: string): string {
  const [year, month] = pubDate.split('-');
  const nn = String(n).padStart(2, '0');
  return `blog/${year}/${month}/${slug}/${nn}.${ext}`;
}

export function isBlogImageKey(key: string, slug: string): boolean {
  return IMAGE_KEY_RE.test(key) && key.includes(`/${slug}/`);
}

export function contentTypeForExt(ext: string): string | null {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return null;
  }
}

export function extForType(type: string, filename: string): string | null {
  const fromName = filename.split('.').pop()?.toLowerCase() ?? '';
  const normalized = fromName === 'jpeg' ? 'jpg' : fromName;
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const fromType = map[type.toLowerCase()] ?? null;
  const fromFile = contentTypeForExt(normalized) ? normalized : null;
  if (fromType && fromFile && fromType !== fromFile) return null;
  return fromType || fromFile;
}

export function actorMayEdit(actor: Actor, status: PostRow['status']): boolean {
  if (status === 'published') return actor === 'brian';
  return true;
}

export function formatCardDate(iso: string): string {
  return formatDate(iso, 'short');
}

export function formatLongDate(iso: string): string {
  return formatDate(iso, 'long');
}

function formatDate(iso: string, month: 'short' | 'long'): string {
  const [year, mon, day] = iso.slice(0, 10).split('-').map(Number);
  if (!year || !mon || !day) return iso;
  return new Date(Date.UTC(year, mon - 1, day)).toLocaleDateString('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function readMinutes(body: string): number {
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return Math.max(1, Math.round(words / 220));
}

export function displayAuthor(author: string): string {
  if (author === 'brian') return 'Brian';
  if (author === 'david') return 'David';
  if (author === 'pulpit') return 'Pulpit';
  if (author === 'barnabas') return 'Barnabas';
  return author;
}

/** Essays that stay on their current static URLs and are not loaded into D1. */
export const EXCLUDED_SLUGS = ['chasing-dopamine', 'wife-feel-loved'] as const;

/**
 * Static essays this PR moves onto /blog/<slug>. Used as the pre-migration
 * fallback and as the redirect list. Excluded slugs are intentionally absent.
 */
export const LEGACY_SLUGS = [
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
] as const;

export function isLegacySlug(slug: string): boolean {
  return (LEGACY_SLUGS as readonly string[]).includes(slug);
}
