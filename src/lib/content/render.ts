/**
 * Bodies are either HTML (imported essays, and any draft whose text starts
 * with a tag) or markdown (what the writer keys send). Both come out as HTML
 * with a small allowlist. Script, style, and event handlers do not survive.
 */

const ALLOWED = new Set([
  'p', 'a', 'strong', 'em', 'blockquote', 'cite', 'h2', 'h3', 'ul', 'ol', 'li', 'br', 'div', 'span', 'img',
]);
const CLASSES = new Set(['scripture', 'signoff', 'lead-b', 'pull', 'pullquote', 'ref']);

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeText(value: string): string {
  return escapeHtml(decodeEntities(value));
}

function safeHref(raw: string): string | null {
  const href = decodeEntities(raw).trim();
  if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\')) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;
  return null;
}

function safeImgSrc(raw: string): string | null {
  const src = decodeEntities(raw).trim();
  if (src.includes('..') || src.includes('\\') || /\s/.test(src)) return null;
  if (/^\/media\/blog\/\d{4}\/\d{2}\/[a-z0-9-]+\/\d{2}\.(?:png|jpe?g|webp|gif)$/.test(src)) return src;
  if (/^blog\/\d{4}\/\d{2}\/[a-z0-9-]+\/\d{2}\.(?:png|jpe?g|webp|gif)$/.test(src)) return `/media/${src}`;
  return null;
}

function attrsOf(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const name = match[1].toLowerCase();
    attrs[name] = match[3] ?? match[4] ?? match[5] ?? '';
  }
  return attrs;
}

function sanitizeAttrs(tag: string, source: string): string | null {
  const attrs = attrsOf(source);
  const parts: string[] = [];
  if (attrs.class) {
    const kept = attrs.class.split(/\s+/).filter((name) => CLASSES.has(name));
    if (kept.length) parts.push(` class="${escapeHtml(kept.join(' '))}"`);
  }
  if (tag === 'a') {
    const href = attrs.href ? safeHref(attrs.href) : null;
    if (!href) return null;
    parts.push(` href="${escapeHtml(href)}"`);
  }
  if (tag === 'img') {
    const src = attrs.src ? safeImgSrc(attrs.src) : null;
    const alt = attrs.alt ? decodeEntities(attrs.alt).trim() : '';
    if (!src || !alt) return null;
    parts.push(` src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"`);
  }
  return parts.join('');
}

export function sanitizeHtml(input: string): string {
  const html = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const out: string[] = [];
  const re = /<\/?([a-zA-Z0-9]+)(\s[^<>]*?)?\s*\/?>/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    out.push(escapeText(html.slice(last, match.index)));
    last = match.index + match[0].length;
    const tag = match[1].toLowerCase();
    if (!ALLOWED.has(tag)) continue;
    const closing = match[0].startsWith('</');
    if (closing) {
      if (tag !== 'br' && tag !== 'img') out.push(`</${tag}>`);
      continue;
    }
    const attrs = sanitizeAttrs(tag, match[2] ?? '');
    if (attrs == null && (tag === 'a' || tag === 'img')) continue;
    if (tag === 'br' || tag === 'img') {
      out.push(`<${tag}${attrs ?? ''}>`);
      continue;
    }
    out.push(`<${tag}${attrs ?? ''}>`);
  }
  out.push(escapeText(html.slice(last)));
  return out.join('');
}

function inline(source: string): string {
  let text = escapeText(source);
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_all, alt: string, url: string) => {
    const src = safeImgSrc(decodeEntities(url));
    const label = decodeEntities(alt).trim();
    if (!src || !label) return escapeHtml(label || '');
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(label)}">`;
  });
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_all, label: string, url: string) => {
    const href = safeHref(decodeEntities(url));
    const inner = decodeEntities(label);
    if (!href) return escapeHtml(inner);
    return `<a href="${escapeHtml(href)}">${escapeHtml(inner)}</a>`;
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return text;
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (/^###\s+/.test(line)) {
      blocks.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`);
      i += 1;
      continue;
    }
    if (/^##\s+/.test(line)) {
      blocks.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`);
      i += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ''))}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    const para: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^(###\s+|##\s+|>\s?|[-*]\s+)/.test(lines[i])) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return blocks.join('\n');
}

export function renderBody(body: string): string {
  if (/^\s*</.test(body)) return sanitizeHtml(body);
  return renderMarkdown(body);
}
