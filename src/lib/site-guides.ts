/** Public-site reading-guide paths.

    D1 `books.guide_url` is the source of truth when set. When it is still
    null (as Killing Kryptonite was), the APIs fall back to the live static
    page so `/api/current-book` and `/api/reading-list` agree with the hub. */
const SITE_GUIDE_URLS: Record<string, string> = {
  'killing-kryptonite': '/guide-killing-kryptonite',
};

export function resolvePublicGuideUrl(
  slug: string | null | undefined,
  guideUrl: string | null | undefined
): string | null {
  if (guideUrl) return String(guideUrl);
  if (slug && SITE_GUIDE_URLS[slug]) return SITE_GUIDE_URLS[slug];
  return null;
}
