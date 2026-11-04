import { isLegacySlug } from './posts';
import { blogEnv } from '../db/types';

/**
 * Before the blog tables are loaded, /blog and /blog/<legacy slug> can still
 * serve the static HTML that already ships in public/. Excluded essays are
 * not offered on the new path.
 */
export async function legacyHtml(
  locals: unknown,
  request: Request,
  slug: string | null
): Promise<Response | null> {
  if (slug !== null && !isLegacySlug(slug)) return null;
  const assets = blogEnv(locals).ASSETS;
  if (!assets) return null;
  const path = slug ? `/${slug}.html` : '/blog.html';
  let url: URL;
  try {
    url = new URL(path, request.url);
  } catch {
    return null;
  }
  const res = await assets.fetch(new Request(url.toString(), { method: 'GET' }));
  if (!res.ok) return null;
  return new Response(await res.arrayBuffer(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
}
