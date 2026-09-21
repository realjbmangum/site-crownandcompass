/**
 * Public site reading-guide paths, keyed by books.slug.
 *
 * Source of truth for a book is D1 `books.guide_url` when it is set. These
 * paths fill in when that column is null (as Killing Kryptonite is today)
 * and remap the old hub URL `/reading-guide`, which now 308s to whatever
 * the brotherhood is currently reading. Do not treat `/reading-guide` as a
 * per-book guide.
 *
 * has_guide stays a separate signal: a published row in book_guides.
 */
export const SITE_GUIDE_PATHS: Record<string, string> = {
  'killing-kryptonite': '/guide-killing-kryptonite',
  'disciplines-of-a-godly-man': '/guide-disciplines-of-a-godly-man',
  'the-barbarian-way': '/guide-the-barbarian-way',
  'stepping-up': '/guide-stepping-up',
  'they-were-christians': '/guide-they-were-christians',
  'm46-crash-course': '/guide-m46-crash-course',
  'counterfeit-gods': '/guide-counterfeit-gods',
  'a-million-little-miracles': '/guide-a-million-little-miracles',
  'under-par': '/guide-under-par',
  'maximized-manhood': '/guide-maximized-manhood',
  'the-man-in-the-mirror': '/guide-the-man-in-the-mirror',
};

function isStaleHub(url: string): boolean {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    return path === '/reading-guide' || path === '/reading-guide.html';
  } catch {
    return false;
  }
}

export function resolveGuideUrl(slug: unknown, dbGuideUrl: unknown): string | null {
  const fromDb = typeof dbGuideUrl === 'string' ? dbGuideUrl.trim() : '';
  const known = typeof slug === 'string' ? SITE_GUIDE_PATHS[slug] : undefined;
  if (fromDb && !isStaleHub(fromDb)) return fromDb;
  return known ?? null;
}
