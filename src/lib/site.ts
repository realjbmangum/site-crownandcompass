/**
 * Single source of truth for the public site URL used in server-rendered email
 * and links (newsletter footer, unsubscribe links).
 *
 * Set the SITE_URL variable in the Cloudflare Pages dashboard once the final
 * domain is attached. The fallback keeps local and preview builds working.
 * Static pages take their canonical URL from Astro's `site:` config in
 * astro.config.mjs instead — set both to the same domain when it is chosen.
 */
const FALLBACK = 'https://thecrownandcompass.org';

export function getSiteUrl(env: unknown): string {
  const raw = (env as Record<string, string> | undefined)?.SITE_URL || FALLBACK;
  const trimmed = raw.replace(/\/+$/, '');
  try {
    // Validate. A malformed SITE_URL (e.g. missing scheme) would otherwise throw
    // deep inside the send loop and surface only as a generic 500.
    new URL(trimmed);
    return trimmed;
  } catch {
    return FALLBACK;
  }
}
