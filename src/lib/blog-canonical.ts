/**
 * Blog documents live at the slashless path (`/blog`, `/blog/<slug>`).
 *
 * `/blog` and `/blog/*` are served by the Pages Function (`public/_routes.json`).
 * Pages does not apply `public/_redirects` to Function routes, so the
 * `/blog/:slug/` rule in that file never runs and a trailing slash answers 200.
 * The canonical tag is already slashless. Send the slash form to that URL.
 *
 * `search` is `URL.search` (empty, or starting with `?`).
 */
export function blogTrailingSlashTarget(pathname: string, search = ''): string | null {
  if (!pathname.startsWith('/blog/') || !pathname.endsWith('/')) return null;
  return `${pathname.replace(/\/+$/, '')}${search}`;
}
