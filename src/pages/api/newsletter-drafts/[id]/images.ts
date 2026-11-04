export const prerender = false;

import type { APIContext } from 'astro';
import { authorizeDraft, presentedToken } from '../../../../lib/api/auth';
import { fail, json } from '../../../../lib/api/http';
import { mapNewsletterDbError } from '../../../../lib/api/newsletter-errors';
import {
  actorMayEditNewsletter,
  actorMayReadNewsletter,
  NEWSLETTER_KEY_RE,
  newsletterImagePrefix,
  parseId,
  sniffImage,
} from '../../../../lib/content/newsletters';
import { contentTypeForExt } from '../../../../lib/content/posts';
import { blogEnv } from '../../../../lib/db/types';
import { getNewsletter } from '../../../../lib/db/newsletters';

const MAX_BYTES = 5_000_000;

interface Upload {
  bytes: Uint8Array;
  alt: string;
}

async function readUpload(request: Request): Promise<Upload | Response> {
  const typeHeader = request.headers.get('content-type') ?? '';
  if (typeHeader.includes('application/json')) {
    const text = await request.text();
    if (text.length > 8_000_000) return fail('image too large', 400);
    const payload = JSON.parse(text) as Record<string, unknown>;
    const encoded = typeof payload.data_base64 === 'string' ? payload.data_base64.replace(/^data:[^,]*,/, '') : '';
    if (!encoded) return fail('data_base64 is required', 400);
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return fail('image too large', 400);
    return { bytes, alt: typeof payload.alt === 'string' ? payload.alt.trim() : '' };
  }
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return fail('file is required', 400);
  if (file.size <= 0 || file.size > MAX_BYTES) return fail('image too large', 400);
  return { bytes: new Uint8Array(await file.arrayBuffer()), alt: String(form.get('alt') ?? '').trim() };
}

// POST: upload one image for a newsletter draft (multipart `file` + `alt`, or
// JSON { data_base64, alt }). Stored in the media bucket at
// newsletter/YYYY/MM/<id>/NN.ext and returned as an absolute URL, ready to use
// in body_html (<img src="URL" alt="...">) or as cover_image_url.
// Alt text is required: the letter goes to people who may not see images.
export async function POST({ request, locals, params, url }: APIContext) {
  const env = blogEnv(locals);
  const actor = await authorizeDraft(env, presentedToken(request));
  if (!actor) return fail('unauthorized', 401);
  if (!env.DB) return fail('database unavailable', 500);
  if (!env.MEDIA) return fail('media store unavailable', 500);
  const id = parseId(params.id);
  if (!id) return fail('not found', 404);

  let upload: Upload;
  try {
    const read = await readUpload(request);
    if (read instanceof Response) return read;
    upload = read;
  } catch {
    return fail('could not read the image', 400);
  }
  if (!upload.alt) return fail('alt text is required', 400);
  if (upload.alt.length > 300) return fail('alt text is too long', 400);
  const ext = sniffImage(upload.bytes);
  if (!ext) return fail('use a png, jpg, webp, or gif', 400);

  try {
    const row = await getNewsletter(env.DB, id);
    if (!row || !actorMayReadNewsletter(actor, row)) return fail('not found', 404);
    const may = actorMayEditNewsletter(actor, row);
    if (!may.ok) return fail(may.error, may.status);

    const prefix = newsletterImagePrefix(id, row.issue_date);
    const listed = await env.MEDIA.list({ prefix, limit: 100 });
    let next = 1;
    for (const object of listed.objects) {
      const match = /\/(\d{2})\.[a-z]+$/.exec(object.key);
      if (match) next = Math.max(next, Number(match[1]) + 1);
    }
    if (next > 40) return fail('too many images on this issue', 400);
    const key = `${prefix}${String(next).padStart(2, '0')}.${ext}`;
    if (!NEWSLETTER_KEY_RE.test(key)) return fail('could not name that image', 400);

    await env.MEDIA.put(key, upload.bytes, {
      httpMetadata: { contentType: contentTypeForExt(ext) ?? 'application/octet-stream' },
      customMetadata: { alt: upload.alt, newsletter: String(id), uploadedBy: actor },
    });
    const path = `/media/${key}`;
    return json({ ok: true, key, path, url: `${url.origin}${path}`, alt: upload.alt }, 201);
  } catch (err) {
    return mapNewsletterDbError(err);
  }
}
