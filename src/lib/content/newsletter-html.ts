// COPY of members app src/lib/newsletter-html.ts (crownandcompass app repo).
// Keep the two in step: the site stores what this produces, and the app
// sanitizes again when it renders and sends.
//
// Rich text for the Field Letter body. Pure string code (no DOM), so the same
// functions run in the Worker (save, send) and in the browser (live preview).
//
// sanitizeLetterHtml() takes whatever the editor, a paste, or Barnabas's draft
// API produced and keeps only a small allow-list of tags. Everything else is
// unwrapped to its text, and script-like elements are dropped with their
// contents. The output is the form we store.
//
// emailLetterHtml() runs the same pass and adds inline styles, so the letter
// survives email clients that strip <style>: fixed widths for images, absolute
// image URLs only, alt text on every image, and no colored side borders.

const ALLOWED_ATTRS: Record<string, readonly string[]> = {
  p: [], br: [], strong: [], em: [], u: [], h2: [], h3: [], ul: [], ol: [], li: [],
  blockquote: [], hr: [], a: ['href'], img: ['src', 'alt', 'width'],
};
const VOID = new Set(['br', 'hr', 'img']);
const RENAME: Record<string, string> = { b: 'strong', i: 'em', div: 'p', h1: 'h2', h4: 'h3', h5: 'h3', h6: 'h3' };
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math',
  'head', 'title', 'textarea', 'select', 'form', 'button', 'video', 'audio', 'canvas',
]);

/** Widest an inline image may render: the 600px card minus 40px padding each side. */
export const LETTER_IMAGE_MAX_WIDTH = 520;
export const MAX_LETTER_LENGTH = 100_000;

const FONT_BODY = "'Spectral',Georgia,serif";
const FONT_HEAD = "'Zilla Slab',Georgia,serif";
const EMAIL_STYLE: Record<string, string> = {
  p: `margin:0 0 16px; font-family:${FONT_BODY}; font-size:16px; line-height:1.7; color:#3a352a;`,
  h2: `margin:28px 0 12px; font-family:${FONT_HEAD}; font-weight:700; font-size:22px; line-height:1.25; color:#16130D;`,
  h3: `margin:24px 0 10px; font-family:${FONT_HEAD}; font-weight:600; font-size:18px; line-height:1.3; color:#16130D;`,
  ul: `margin:0 0 16px; padding:0 0 0 22px; font-family:${FONT_BODY}; font-size:16px; line-height:1.7; color:#3a352a;`,
  ol: `margin:0 0 16px; padding:0 0 0 22px; font-family:${FONT_BODY}; font-size:16px; line-height:1.7; color:#3a352a;`,
  li: 'margin:0 0 6px;',
  blockquote: `margin:0 0 16px; padding:16px 20px; background:#E9E1CC; font-family:${FONT_BODY}; font-style:italic; font-size:16px; line-height:1.65; color:#16130D;`,
  a: 'color:#C0552A; text-decoration:underline;',
  strong: 'color:#16130D;',
  hr: 'border:0; height:1px; background:#DCD3BC; margin:24px 0;',
};

/** Hosts whose /media/ images may appear in a letter. Email cannot load
 *  relative or local images, and a stranger's host would see every open. */
const IMAGE_HOSTS = new Set(['thecrownandcompass.org', 'www.thecrownandcompass.org']);
const PREVIEW_IMAGE_HOST = /^[a-z0-9-]+\.site-crownandcompass\.pages\.dev$/;

export function isAllowedImageUrl(value: unknown): boolean {
  const s = String(value ?? '').trim();
  if (!/^https:\/\//i.test(s)) return false;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    if (!(IMAGE_HOSTS.has(host) || PREVIEW_IMAGE_HOST.test(host) || host === 'site-crownandcompass.pages.dev')) return false;
    return u.pathname.startsWith('/media/') && !u.username && !u.password;
  } catch {
    return false;
  }
}

function safeHref(value: string): string | null {
  const s = value.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^mailto:[^\s<>"]+@[^\s<>"]+$/i.test(s)) return s;
  return null;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function decodeEntities(value: string): string {
  return value.replace(/&(#\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos|nbsp|#39);/gi, (_m, e: string) => {
    const k = e.toLowerCase();
    if (k === 'amp') return '&';
    if (k === 'lt') return '<';
    if (k === 'gt') return '>';
    if (k === 'quot') return '"';
    if (k === 'apos' || k === '#39') return "'";
    if (k === 'nbsp') return '\u00a0';
    const code = k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
  });
}

/** Text between tags: keep valid entities, escape a bare & and any > or <. */
function cleanText(text: string): string {
  return text
    .replace(/&(?!(?:#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});)/gi, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseAttrs(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    if (out.has(name)) continue;
    out.set(name, decodeEntities(m[2] ?? m[3] ?? m[4] ?? ''));
  }
  return out;
}

function openTag(tag: string, attrs: Map<string, string>, styled: boolean): string | null {
  const style = styled && EMAIL_STYLE[tag] ? ` style="${EMAIL_STYLE[tag]}"` : '';
  if (tag === 'a') {
    const href = safeHref(attrs.get('href') ?? '');
    if (!href) return null;
    return `<a href="${escapeAttr(href)}"${style}>`;
  }
  if (tag === 'img') {
    const src = (attrs.get('src') ?? '').trim();
    if (!isAllowedImageUrl(src)) return null;
    const alt = (attrs.get('alt') ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
    const wRaw = Number.parseInt(attrs.get('width') ?? '', 10);
    const width = Number.isFinite(wRaw) && wRaw > 0 ? Math.min(wRaw, LETTER_IMAGE_MAX_WIDTH) : LETTER_IMAGE_MAX_WIDTH;
    const imgStyle = styled
      ? ` style="display:block; width:100%; max-width:${width}px; height:auto; margin:8px 0 18px; border:0; outline:none; text-decoration:none;"`
      : '';
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" width="${width}"${imgStyle}>`;
  }
  return `<${tag}${style}>`;
}

function run(input: unknown, styled: boolean): string {
  const html = String(input ?? '').slice(0, MAX_LETTER_LENGTH);
  const out: string[] = [];
  const stack: string[] = [];
  let dropping: { tag: string; depth: number } | null = null;
  const re = /<!--[\s\S]*?(?:-->|$)|<!\[CDATA\[[\s\S]*?(?:\]\]>|$)|<![^>]*>|<\?[^>]*>|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+|</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const token = m[0];
    const name = m[2]?.toLowerCase();
    if (dropping) {
      if (name === dropping.tag) dropping.depth += m[1] ? -1 : /\/\s*$/.test(m[3] ?? '') ? 0 : 1;
      if (dropping.depth <= 0) dropping = null;
      continue;
    }
    if (!name) {
      if (token.startsWith('<!') || token.startsWith('<?')) continue; // comments, doctype, CDATA
      out.push(cleanText(token));
      continue;
    }
    if (DROP_WITH_CONTENT.has(name)) {
      if (!m[1] && !/\/\s*$/.test(m[3] ?? '')) dropping = { tag: name, depth: 1 };
      continue;
    }
    const tag = RENAME[name] ?? name;
    if (!(tag in ALLOWED_ATTRS)) continue; // unwrap: drop the tag, keep its text
    if (m[1]) {
      if (VOID.has(tag)) continue;
      const at = stack.lastIndexOf(tag);
      if (at === -1) continue;
      while (stack.length > at) out.push(`</${stack.pop()}>`);
      continue;
    }
    const opened = openTag(tag, parseAttrs(m[3] ?? ''), styled);
    if (!opened) continue;
    out.push(opened);
    if (!VOID.has(tag)) stack.push(tag);
  }
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out.join('').trim();
}

/** The stored form: allow-listed tags, safe links, approved image hosts only. */
export function sanitizeLetterHtml(input: unknown): string {
  return run(input, false);
}

/** The email form: same allow-list, with inline styles on every element. */
export function emailLetterHtml(input: unknown): string {
  return run(input, true);
}

/** Visible text of a letter, for "is it empty?" checks and word counts. */
export function letterText(input: unknown): string {
  return decodeEntities(sanitizeLetterHtml(input).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Every <img> in the letter that lacks alt text. Send refuses these. */
export function imagesMissingAlt(input: unknown): string[] {
  const clean = sanitizeLetterHtml(input);
  const missing: string[] = [];
  const re = /<img src="([^"]*)" alt="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) if (!m[2].trim()) missing.push(decodeEntities(m[1]));
  return missing;
}
