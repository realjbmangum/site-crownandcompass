// Field Letter drafts written through /api/newsletter-drafts (Barnabas's
// Friday draft). Pure validation and shaping; no database here.
//
// The row lives in the shared `newsletters` table that the members app owns.
// body_json holds the app's NewsletterContent shape, so the app's composer and
// renderer open it unchanged. Draft keys write only the parts a letter for
// outsiders needs: subject, preheader, headline, intro, the letter body, an
// optional cover image, and an optional verse. The cycle sections (book, key
// dates, prayers, names) stay empty, and the app hides empty sections.
//
// Nothing here or in the routes can approve or send. Sending is a signed-in
// admin's button in the members app.

import { isAllowedImageUrl, letterText, MAX_LETTER_LENGTH, sanitizeLetterHtml } from './newsletter-html';

export type NewsletterStatus = 'draft' | 'ready' | 'approved' | 'sent' | 'failed';

export interface NewsletterDraftFields {
  subject: string;
  preheader: string;
  issueDate: string | null;
  headline: string;
  intro: string;
  bodyHtml: string;
  coverUrl: string | null;
  coverAlt: string | null;
  verseText: string;
  verseRef: string;
  cycleTag: string;
}

/** The members app's NewsletterContent, the parts a draft key writes. */
export interface DraftContent {
  subject: string;
  preheader: string;
  cycleTag: string;
  headline: string;
  intro: string;
  letterHtml: string;
  cover?: { url: string; alt: string };
  book: { title: string; author: string; description: string; planUrl: string };
  keyDates: { date: string; label: string }[];
  brotherQuote: { text: string; attribution: string };
  verse: { text: string; ref: string };
  inviteUrl: string;
}

export const INVITE_URL = 'https://thecrownandcompass.org/join';
export const PLAN_URL = 'https://thecrownandcompass.org/reading-list';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function text(value: unknown, field: string, max: number, required = false): Parsed<string> {
  if (value == null) return required ? { ok: false, error: `${field} is required` } : { ok: true, value: '' };
  if (typeof value !== 'string') return { ok: false, error: `${field} must be text` };
  const trimmed = value.trim();
  if (required && !trimmed) return { ok: false, error: `${field} is required` };
  if (trimmed.length > max) return { ok: false, error: `${field} is too long (max ${max})` };
  return { ok: true, value: trimmed };
}

export function parseIssueDate(value: unknown): Parsed<string | null> {
  if (value == null || value === '') return { ok: true, value: null };
  const s = String(value).trim();
  if (!DATE_RE.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) return { ok: false, error: 'issue_date must be YYYY-MM-DD' };
  return { ok: true, value: s };
}

/** Make /media/... image paths absolute (email cannot load relative images). */
export function absolutizeMedia(html: string, origin: string): string {
  const base = origin.replace(/\/+$/, '');
  return html.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(["']?)(\/media\/)/gi, `$1$2${base}$3`);
}

function absoluteCover(url: string, origin: string): string {
  return url.startsWith('/media/') ? `${origin.replace(/\/+$/, '')}${url}` : url;
}

/**
 * Validate a create (all fields) or a PATCH (only what was sent, over the
 * stored fields). `origin` turns /media/ paths into absolute URLs.
 */
export function validateNewsletterFields(
  payload: Record<string, unknown>,
  origin: string,
  existing?: NewsletterDraftFields
): Parsed<NewsletterDraftFields> {
  const pick = (key: string, current: unknown) => (payload[key] === undefined ? current : payload[key]);

  const subject = text(pick('subject', existing?.subject), 'subject', 200, true);
  if (!subject.ok) return subject;
  const preheader = text(pick('preheader', existing?.preheader), 'preheader', 300);
  if (!preheader.ok) return preheader;
  const headline = text(pick('headline', existing?.headline), 'headline', 200);
  if (!headline.ok) return headline;
  const intro = text(pick('intro', existing?.intro), 'intro', 2000);
  if (!intro.ok) return intro;
  const verseText = text(pick('verse_text', existing?.verseText), 'verse_text', 600);
  if (!verseText.ok) return verseText;
  const verseRef = text(pick('verse_ref', existing?.verseRef), 'verse_ref', 80);
  if (!verseRef.ok) return verseRef;
  const cycleTag = text(pick('cycle_tag', existing?.cycleTag), 'cycle_tag', 80);
  if (!cycleTag.ok) return cycleTag;
  const issueDate = parseIssueDate(pick('issue_date', existing?.issueDate));
  if (!issueDate.ok) return issueDate;

  const rawBody = pick('body_html', existing?.bodyHtml);
  if (typeof rawBody !== 'string' || !rawBody.trim()) return { ok: false, error: 'body_html is required' };
  if (rawBody.length > MAX_LETTER_LENGTH) return { ok: false, error: `body_html is too long (max ${MAX_LETTER_LENGTH})` };
  const bodyHtml = sanitizeLetterHtml(absolutizeMedia(rawBody, origin));
  if (!letterText(bodyHtml).trim()) return { ok: false, error: 'body_html has no readable text after cleaning' };
  const droppedImages = (rawBody.match(/<img\b/gi) ?? []).length - (bodyHtml.match(/<img\b/gi) ?? []).length;
  if (droppedImages > 0) {
    return { ok: false, error: 'images must be uploaded through /api/newsletter-drafts/{id}/images (https://thecrownandcompass.org/media/... URLs only)' };
  }
  if (/<img\b(?![^>]*\balt="[^"]+")[^>]*>/i.test(bodyHtml)) return { ok: false, error: 'every image in body_html needs alt text' };

  let coverUrl: string | null = existing?.coverUrl ?? null;
  let coverAlt: string | null = existing?.coverAlt ?? null;
  if (payload.cover_image_url !== undefined) {
    const raw = payload.cover_image_url;
    if (raw === null || raw === '') {
      coverUrl = null;
      coverAlt = null;
    } else if (typeof raw !== 'string') {
      return { ok: false, error: 'cover_image_url must be text' };
    } else {
      coverUrl = absoluteCover(raw.trim(), origin);
    }
  }
  if (payload.cover_image_alt !== undefined) {
    const alt = text(payload.cover_image_alt, 'cover_image_alt', 300);
    if (!alt.ok) return alt;
    coverAlt = alt.value || null;
  }
  if (coverUrl) {
    if (!isAllowedImageUrl(coverUrl)) return { ok: false, error: 'cover_image_url must be an uploaded /media/ image on thecrownandcompass.org' };
    if (!coverAlt) return { ok: false, error: 'a cover image needs cover_image_alt' };
  }

  return {
    ok: true,
    value: {
      subject: subject.value,
      preheader: preheader.value,
      issueDate: issueDate.value,
      headline: headline.value,
      intro: intro.value,
      bodyHtml,
      coverUrl,
      coverAlt,
      verseText: verseText.value,
      verseRef: verseRef.value,
      cycleTag: cycleTag.value,
    },
  };
}

/** The body_json the members app reads. */
export function toContent(f: NewsletterDraftFields): DraftContent {
  return {
    subject: f.subject,
    preheader: f.preheader,
    cycleTag: f.cycleTag,
    headline: f.headline,
    intro: f.intro,
    letterHtml: f.bodyHtml,
    ...(f.coverUrl && f.coverAlt ? { cover: { url: f.coverUrl, alt: f.coverAlt } } : {}),
    book: { title: '', author: '', description: '', planUrl: PLAN_URL },
    keyDates: [],
    brotherQuote: { text: '', attribution: '' },
    verse: { text: f.verseText, ref: f.verseRef },
    inviteUrl: INVITE_URL,
  };
}

/** Back from a stored row to editable fields (for a PATCH over it). */
export function fromRow(row: { subject: string; preheader: string | null; issue_date: string | null; body_json: string }): NewsletterDraftFields {
  let c: Partial<DraftContent> = {};
  try {
    const parsed = JSON.parse(row.body_json || '{}');
    if (parsed && typeof parsed === 'object') c = parsed;
  } catch {
    c = {};
  }
  return {
    subject: row.subject,
    preheader: row.preheader ?? '',
    issueDate: row.issue_date,
    headline: c.headline ?? '',
    intro: c.intro ?? '',
    bodyHtml: c.letterHtml ?? '',
    coverUrl: c.cover?.url ?? null,
    coverAlt: c.cover?.alt ?? null,
    verseText: c.verse?.text ?? '',
    verseRef: c.verse?.ref ?? '',
    cycleTag: c.cycleTag ?? '',
  };
}

/**
 * Draft keys edit only their own rows, and only until someone else has
 * touched them: once Brian edits a draft in the app (updated_by 'admin:N'),
 * the writer's key can read it but not overwrite it. Approved, sent, and
 * failed issues are closed to every key. BRIAN_ADMIN_KEY may edit any open draft.
 */
export function actorMayEditNewsletter(
  actor: string,
  row: { author: string | null; updated_by: string | null; status: string }
): { ok: true } | { ok: false; status: number; error: string } {
  if (row.status !== 'draft' && row.status !== 'ready') {
    return { ok: false, status: 409, error: `this issue is ${row.status}; only the members app can change it now` };
  }
  if (actor === 'brian') return { ok: true };
  if (row.author !== actor) return { ok: false, status: 403, error: 'you can only edit your own drafts' };
  if (row.updated_by !== actor) {
    return { ok: false, status: 409, error: 'Brian edited this draft in the members app; it is his now. Create a new draft instead.' };
  }
  return { ok: true };
}

export function actorMayReadNewsletter(actor: string, row: { author: string | null }): boolean {
  return actor === 'brian' || row.author === actor;
}

// ---- images --------------------------------------------------------------

export const NEWSLETTER_KEY_RE = /^newsletter\/\d{4}\/\d{2}\/[1-9]\d{0,9}\/\d{2}\.(?:png|jpg|webp|gif)$/;

export function newsletterImagePrefix(id: number, issueDate: string | null, now = new Date()): string {
  const m = issueDate ? /^(\d{4})-(\d{2})-\d{2}$/.exec(issueDate) : null;
  const yyyy = m ? m[1] : String(now.getUTCFullYear());
  const mm = m ? m[2] : String(now.getUTCMonth() + 1).padStart(2, '0');
  return `newsletter/${yyyy}/${mm}/${id}/`;
}

/** Image type from the first bytes, ignoring the declared type. */
export function sniffImage(bytes: Uint8Array): 'jpg' | 'png' | 'gif' | 'webp' | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png';
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return 'gif';
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP') return 'webp';
  return null;
}

/** Route param to an issue id. */
export function parseId(raw: string | undefined): number | null {
  if (!raw || !/^[1-9]\d{0,9}$/.test(raw)) return null;
  return Number(raw);
}
