export const prerender = false;

import type { APIContext } from 'astro';
import { blogEnv } from '../../lib/db/types';

const KEY_RE = /^blog\/\d{4}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\/\d{2}\.(?:png|jpe?g|webp|gif)$/;
// Field Letter images: newsletter/YYYY/MM/<issue id>/NN.ext (see /api/newsletter-drafts).
const NEWSLETTER_KEY_RE = /^newsletter\/\d{4}\/\d{2}\/[1-9]\d{0,9}\/\d{2}\.(?:png|jpg|webp|gif)$/;

function contentType(key: string): string {
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.webp')) return 'image/webp';
  if (key.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function GET({ params, locals }: APIContext) {
  const raw = params.path;
  const key = Array.isArray(raw) ? raw.join('/') : String(raw ?? '');
  if (!KEY_RE.test(key) && !NEWSLETTER_KEY_RE.test(key)) return new Response('Not found', { status: 404 });

  const media = blogEnv(locals).MEDIA;
  if (!media) return new Response('Media store unavailable', { status: 500 });
  const object = await media.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  headers.set('content-type', object.httpMetadata?.contentType || contentType(key));
  headers.set('cache-control', 'public, max-age=86400');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(object.body, { status: 200, headers });
}
