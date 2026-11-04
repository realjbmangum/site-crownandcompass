export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../../lib/api/auth';
import { fail, json, mapDbError } from '../../../../lib/api/http';
import {
  actorMayEdit,
  contentTypeForExt,
  extForType,
  imageKey,
  isBlogImageKey,
  type PostInput,
} from '../../../../lib/content/posts';
import { blogEnv } from '../../../../lib/db/types';
import { getAny, saveRevision, summary } from '../../../../lib/db/posts';

const MAX_BYTES = 5_000_000;

interface Upload {
  bytes: ArrayBuffer | Uint8Array;
  type: string;
  filename: string;
  alt: string;
  hero: boolean;
}

async function readUpload(request: Request): Promise<Upload | Response> {
  const typeHeader = request.headers.get('content-type') ?? '';
  if (typeHeader.includes('application/json')) {
    const text = await request.text();
    if (text.length > 8_000_000) return fail('image too large', 400);
    const payload = JSON.parse(text) as Record<string, unknown>;
    const filename = typeof payload.filename === 'string' ? payload.filename : 'image.png';
    const encoded = typeof payload.data_base64 === 'string' ? payload.data_base64 : '';
    const encodedRaw = encoded.replace(/^data:[^,]*,/, '');
    const bytes = Uint8Array.from(atob(encodedRaw), (c) => c.charCodeAt(0));
    if (!encodedRaw || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return fail('image too large', 400);
    const declared = typeof payload.content_type === 'string' ? payload.content_type : '';
    return {
      bytes,
      type: declared,
      filename,
      alt: typeof payload.alt === 'string' ? payload.alt.trim() : '',
      hero: payload.hero === true,
    };
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return fail('file is required', 400);
  if (file.size <= 0 || file.size > MAX_BYTES) return fail('image too large', 400);
  return {
    bytes: await file.arrayBuffer(),
    type: file.type,
    filename: file.name || 'image',
    alt: String(form.get('alt') ?? '').trim(),
    hero: form.get('hero') === '1' || form.get('hero') === 'true',
  };
}

export async function POST({ request, locals, params }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  if (!env.MEDIA) return fail('media store unavailable', 500);
  const slug = params.slug;
  if (!slug) return fail('not found', 404);

  let upload: Upload;
  try {
    const read = await readUpload(request);
    if (read instanceof Response) return read;
    upload = read;
  } catch {
    return fail('could not read the image', 400);
  }

  const ext = extForType(upload.type, upload.filename);
  if (!ext) return fail('use a png, jpg, webp, or gif', 400);
  if (upload.hero && !upload.alt) return fail('a hero image needs alt text', 400);
  if (upload.alt.length > 300) return fail('alt text is too long', 400);

  try {
    const existing = await getAny(env.DB, slug);
    if (!existing) return fail('not found', 404);
    if (!actorMayEdit(actor, existing.status)) return fail('published posts are locked', 403);

    const prefix = imageKey(existing.pub_date, slug, 1, ext).replace(/\/\d{2}\.[a-z]+$/, '/');
    const listed = await env.MEDIA.list({ prefix, limit: 100 });
    let next = 1;
    for (const object of listed.objects) {
      const match = /\/(\d{2})\.[a-z]+$/.exec(object.key);
      if (match) next = Math.max(next, Number(match[1]) + 1);
    }
    if (next > 40) return fail('too many images on this post', 400);
    const key = imageKey(existing.pub_date, slug, next, ext);
    if (!isBlogImageKey(key, slug)) return fail('could not name that image', 400);

    const contentType = contentTypeForExt(ext) ?? upload.type;
    await env.MEDIA.put(key, upload.bytes, { httpMetadata: { contentType } });

    let post = summary(existing);
    if (upload.hero) {
      const rev = existing.current_rev + 1;
      const input: PostInput = {
        slug: existing.slug,
        title: existing.title,
        description: existing.description,
        body: existing.body,
        pubDate: existing.pub_date,
        heroImageKey: key,
        heroImageAlt: upload.alt,
        tags: [],
      };
      await saveRevision(env.DB, input, actor, existing.status, rev, 'hero image', 'post.edit');
      const row = await getAny(env.DB, slug);
      if (row) post = summary(row);
    }

    return json({
      ok: true,
      key,
      url: `/media/${key}`,
      post,
    }, 201);
  } catch (err) {
    return mapDbError(err);
  }
}
