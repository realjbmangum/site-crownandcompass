import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GET as listDrafts, POST as createDraft } from '../pages/api/newsletter-drafts/index.ts';
import { GET as getDraft, PATCH as patchDraft } from '../pages/api/newsletter-drafts/[id].ts';
import { POST as markReady } from '../pages/api/newsletter-drafts/[id]/ready.ts';
import { POST as uploadImage } from '../pages/api/newsletter-drafts/[id]/images.ts';
import { GET as media } from '../pages/media/[...path].ts';
import { sanitizeLetterHtml } from './content/newsletter-html.ts';

// /api/newsletter-drafts against the real shared-table schema: the members
// app's legacy newsletters table plus its pipeline migration (fixtures).
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const KEYS = { BARNABAS_API_KEY: 'barnabas-test-key', DAVID_API_KEY: 'david-test-key', BRIAN_ADMIN_KEY: 'brian-test-key' };
const ORIGIN = 'https://thecrownandcompass.org';

function openDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(join(root, 'test/fixtures/newsletters-legacy.sql'), 'utf8'));
  db.exec(readFileSync(join(root, 'test/fixtures/app-migrate-2026-11-04-newsletter-pipeline.sql'), 'utf8'));
  return db;
}

type Bound = { sql: string; args: unknown[]; bind: (...a: unknown[]) => Bound; first: <T>() => Promise<T | null>; all: <T>() => Promise<{ results: T[]; success: boolean }>; run: () => Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }> };

function asD1(db: DatabaseSync) {
  const exec = (sql: string, args: unknown[]) => {
    const r = db.prepare(sql).run(...(args as [])) as { changes?: number | bigint; lastInsertRowid?: number | bigint };
    return { success: true, meta: { changes: Number(r.changes ?? 0), last_row_id: Number(r.lastInsertRowid ?? 0) } };
  };
  function statement(sql: string, args: unknown[] = []): Bound {
    return {
      sql,
      args,
      bind: (...more) => statement(sql, [...args, ...more]),
      first: async <T>() => (db.prepare(sql).get(...(args as [])) as T | undefined) ?? null,
      all: async <T>() => ({ results: db.prepare(sql).all(...(args as [])) as T[], success: true }),
      run: async () => exec(sql, args),
    };
  }
  return {
    prepare: (sql: string) => statement(sql),
    async batch(stmts: Bound[]) {
      db.exec('BEGIN');
      try {
        const out = stmts.map((s) => exec(s.sql, s.args));
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
  };
}

function fakeBucket() {
  const objects = new Map<string, { bytes: Uint8Array; contentType?: string; custom?: Record<string, string> }>();
  return {
    objects,
    async put(key: string, bytes: Uint8Array, opts?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }) {
      objects.set(key, { bytes, contentType: opts?.httpMetadata?.contentType, custom: opts?.customMetadata });
    },
    async get(key: string) {
      const o = objects.get(key);
      return o ? { body: new Blob([o.bytes as unknown as ArrayBuffer]).stream(), httpMetadata: { contentType: o.contentType } } : null;
    },
    async list({ prefix }: { prefix?: string } = {}) {
      return { objects: [...objects.keys()].filter((k) => !prefix || k.startsWith(prefix)).map((key) => ({ key })) };
    },
  };
}

type Env = Record<string, unknown>;
async function call(
  handler: (ctx: never) => Promise<Response>,
  opts: { key?: string; method?: string; body?: unknown; id?: number | string; env: Env; path?: string }
) {
  const headers: Record<string, string> = {};
  if (opts.key) headers.authorization = `Bearer ${opts.key}`;
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers['content-type'] = 'application/json';
  }
  const url = new URL(`${ORIGIN}/api/newsletter-drafts${opts.id ? `/${opts.id}` : ''}`);
  const request = new Request(url, { method: opts.method ?? (body ? 'POST' : 'GET'), headers, body });
  const res = await handler({ request, url, params: { id: opts.id == null ? undefined : String(opts.id), path: opts.path }, locals: { runtime: { env: opts.env } } } as never);
  const text = await res.text();
  let json: Record<string, any> = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { text };
  }
  return { status: res.status, body: json, headers: res.headers };
}

function setup() {
  const db = openDb();
  const MEDIA = fakeBucket();
  const env: Env = { DB: asD1(db), MEDIA, ...KEYS };
  return { db, env, MEDIA };
}

const draft = {
  subject: 'Why men read together',
  preheader: 'A note from the table',
  issue_date: '2026-11-06',
  headline: 'Read slowly, together',
  intro: 'For anyone who has wondered what we do.',
  body_html: '<p>Dear friend,</p><p onclick="x()">We read <b>one book</b> at a time.</p><script>alert(1)</script>',
  verse_text: 'Iron sharpens iron.',
  verse_ref: 'Proverbs 27:17',
  source: 'agents/barnabas/drafts/2026-11-06-newsletter.md',
};

const row = (db: DatabaseSync, id: number) => db.prepare('SELECT * FROM newsletters WHERE id = ?').get(id) as Record<string, any>;

describe('/api/newsletter-drafts', () => {
  it('rejects calls without a draft key', async () => {
    const { env } = setup();
    assert.equal((await call(createDraft, { env, body: draft })).status, 401);
    assert.equal((await call(createDraft, { env, key: 'wrong', body: draft })).status, 401);
  });

  it('creates a draft with version 1, an activity row, and app-shaped content', async () => {
    const { db, env } = setup();
    const res = await call(createDraft, { env, key: KEYS.BARNABAS_API_KEY, body: draft });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const n = res.body.newsletter;
    assert.equal(n.status, 'draft');
    assert.equal(n.rev, 1);
    assert.equal(n.author, 'barnabas');
    const r = row(db, n.id);
    assert.equal(r.created_by, null);
    assert.equal(r.updated_by, 'barnabas');
    assert.equal(r.issue_date, '2026-11-06');
    const content = JSON.parse(r.body_json);
    assert.equal(content.letterHtml, '<p>Dear friend,</p><p>We read <strong>one book</strong> at a time.</p>');
    assert.deepEqual(content.verse, { text: 'Iron sharpens iron.', ref: 'Proverbs 27:17' });
    assert.equal(content.book.title, '');
    assert.deepEqual(content.keyDates, []);
    assert.equal(content.inviteUrl, 'https://thecrownandcompass.org/join');
    assert.equal((db.prepare('SELECT COUNT(*) n FROM newsletter_versions WHERE newsletter_id = ?').get(n.id) as any).n, 1);
    assert.equal((db.prepare(`SELECT COUNT(*) n FROM newsletter_activity_log WHERE action = 'newsletter.create' AND actor = 'barnabas'`).get() as any).n, 1);
  });

  it('refuses status, approval, and send fields from a draft key', async () => {
    const { env } = setup();
    for (const extra of [{ status: 'sent' }, { status: 'approved' }, { approved_by: 1 }, { send: true }, { sent_at: 'now' }]) {
      const res = await call(createDraft, { env, key: KEYS.BARNABAS_API_KEY, body: { ...draft, ...extra } });
      assert.equal(res.status, 400, JSON.stringify(extra));
    }
  });

  it('needs a subject and a readable body, and only hosted images with alt text', async () => {
    const { env } = setup();
    const k = KEYS.BARNABAS_API_KEY;
    assert.equal((await call(createDraft, { env, key: k, body: { ...draft, subject: '' } })).status, 400);
    assert.equal((await call(createDraft, { env, key: k, body: { ...draft, body_html: '<script>x</script>' } })).status, 400);
    assert.equal((await call(createDraft, { env, key: k, body: { ...draft, issue_date: '11/06/2026' } })).status, 400);
    const foreign = await call(createDraft, { env, key: k, body: { ...draft, body_html: '<p>x</p><img src="https://evil.example/p.gif" alt="t">' } });
    assert.equal(foreign.status, 400);
    const noAlt = await call(createDraft, { env, key: k, body: { ...draft, body_html: '<p>x</p><img src="/media/newsletter/2026/11/1/01.jpg">' } });
    assert.equal(noAlt.status, 400);
    const coverNoAlt = await call(createDraft, { env, key: k, body: { ...draft, cover_image_url: '/media/newsletter/2026/11/1/01.jpg' } });
    assert.equal(coverNoAlt.status, 400);
  });

  it('turns /media/ image paths into absolute URLs', async () => {
    const { db, env } = setup();
    const res = await call(createDraft, {
      env,
      key: KEYS.BARNABAS_API_KEY,
      body: { ...draft, body_html: '<p>x</p><img src="/media/newsletter/2026/11/1/01.jpg" alt="Men at a table">', cover_image_url: '/media/newsletter/2026/11/1/02.png', cover_image_alt: 'A lamp' },
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const content = JSON.parse(row(db, res.body.newsletter.id).body_json);
    assert.ok(content.letterHtml.includes('src="https://thecrownandcompass.org/media/newsletter/2026/11/1/01.jpg"'));
    assert.deepEqual(content.cover, { url: 'https://thecrownandcompass.org/media/newsletter/2026/11/1/02.png', alt: 'A lamp' });
  });

  it('edits with PATCH, keeps a version per save, and refuses a stale rev', async () => {
    const { db, env } = setup();
    const k = KEYS.BARNABAS_API_KEY;
    const id = (await call(createDraft, { env, key: k, body: draft })).body.newsletter.id;
    const ok = await call(patchDraft, { env, key: k, id, method: 'PATCH', body: { subject: 'Second try', rev: 1, note: 'tighter subject' } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.body.newsletter.rev, 2);
    assert.equal(row(db, id).subject, 'Second try');
    assert.ok(JSON.parse(row(db, id).body_json).letterHtml.includes('one book'));
    const stale = await call(patchDraft, { env, key: k, id, method: 'PATCH', body: { subject: 'Third', rev: 1 } });
    assert.equal(stale.status, 409);
    assert.equal((db.prepare('SELECT COUNT(*) n FROM newsletter_versions WHERE newsletter_id = ?').get(id) as any).n, 2);
  });

  it('marks ready, which is as far as a draft key can go', async () => {
    const { db, env } = setup();
    const k = KEYS.BARNABAS_API_KEY;
    const id = (await call(createDraft, { env, key: k, body: draft })).body.newsletter.id;
    const res = await call(markReady, { env, key: k, id, body: {} });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.newsletter.status, 'ready');
    const r = row(db, id);
    assert.equal(r.status, 'ready');
    assert.ok(r.ready_at);
    assert.equal(r.approved_by, null);
    assert.equal(r.sent_at, null);
    // Even straight SQL cannot take a pipeline row to approved or sent without an admin.
    assert.throws(() => db.prepare(`UPDATE newsletters SET status = 'sent' WHERE id = ?`).run(id), /only a signed-in admin/);
    assert.throws(() => db.prepare(`UPDATE newsletters SET status = 'approved' WHERE id = ?`).run(id), /only a signed-in admin/);
    // Still editable while ready, and stays ready.
    const edit = await call(patchDraft, { env, key: k, id, method: 'PATCH', body: { preheader: 'new' } });
    assert.equal(edit.body.newsletter.status, 'ready');
  });

  it('keeps writers to their own drafts, and off a draft Brian edited in the app', async () => {
    const { db, env } = setup();
    const id = (await call(createDraft, { env, key: KEYS.BARNABAS_API_KEY, body: draft })).body.newsletter.id;
    assert.equal((await call(getDraft, { env, key: KEYS.DAVID_API_KEY, id })).status, 404);
    assert.equal((await call(patchDraft, { env, key: KEYS.DAVID_API_KEY, id, method: 'PATCH', body: { subject: 'x' } })).status, 404);
    // Brian edits it in the members app.
    db.prepare(`UPDATE newsletters SET updated_by = 'admin:1', current_rev = 2 WHERE id = ?`).run(id);
    const res = await call(patchDraft, { env, key: KEYS.BARNABAS_API_KEY, id, method: 'PATCH', body: { subject: 'mine again' } });
    assert.equal(res.status, 409);
    assert.equal(row(db, id).subject, draft.subject);
    assert.equal((await call(getDraft, { env, key: KEYS.BARNABAS_API_KEY, id })).status, 200);
  });

  it('cannot touch an approved, sent, or failed issue', async () => {
    const { db, env } = setup();
    const k = KEYS.BARNABAS_API_KEY;
    const id = (await call(createDraft, { env, key: k, body: draft })).body.newsletter.id;
    db.prepare(`UPDATE newsletters SET status = 'approved', approved_by = 1, approved_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    assert.equal((await call(patchDraft, { env, key: k, id, method: 'PATCH', body: { subject: 'x' } })).status, 409);
    assert.equal((await call(markReady, { env, key: k, id, body: {} })).status, 409);
    db.prepare(`UPDATE newsletters SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    assert.equal((await call(patchDraft, { env, key: KEYS.BRIAN_ADMIN_KEY, id, method: 'PATCH', body: { subject: 'x' } })).status, 409);
  });

  it('lists only the caller’s own issues', async () => {
    const { db, env } = setup();
    db.prepare(`INSERT INTO newsletters (subject, body_json, status) VALUES ('Legacy composer draft', '{}', 'draft')`).run();
    await call(createDraft, { env, key: KEYS.BARNABAS_API_KEY, body: draft });
    await call(createDraft, { env, key: KEYS.DAVID_API_KEY, body: { ...draft, subject: 'David' } });
    const res = await call(listDrafts, { env, key: KEYS.BARNABAS_API_KEY });
    assert.deepEqual(res.body.newsletters.map((n: any) => n.subject), [draft.subject]);
  });

  it('uploads an image under newsletter/YYYY/MM/<id>/NN.ext with an absolute URL, served by /media', async () => {
    const { env, MEDIA } = setup();
    const k = KEYS.BARNABAS_API_KEY;
    const id = (await call(createDraft, { env, key: k, body: draft })).body.newsletter.id;
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    const form = (alt?: string) => {
      const f = new FormData();
      f.set('file', new File([png], 'p.png', { type: 'image/png' }));
      if (alt) f.set('alt', alt);
      return f;
    };
    assert.equal((await call(uploadImage, { env, key: k, id, body: form() })).status, 400);
    const one = await call(uploadImage, { env, key: k, id, body: form('Men at a table') });
    assert.equal(one.status, 201, JSON.stringify(one.body));
    assert.equal(one.body.key, `newsletter/2026/11/${id}/01.png`);
    assert.equal(one.body.url, `https://thecrownandcompass.org/media/newsletter/2026/11/${id}/01.png`);
    const two = await call(uploadImage, { env, key: k, id, body: form('Second') });
    assert.equal(two.body.key, `newsletter/2026/11/${id}/02.png`);
    assert.equal(MEDIA.objects.get(one.body.key)?.custom?.alt, 'Men at a table');
    const b64 = await call(uploadImage, { env, key: k, id, body: { data_base64: btoa('<svg onload=alert(1)>'), alt: 'x' } });
    assert.equal(b64.status, 400);

    const served = await call(media, { env, path: one.body.key });
    assert.equal(served.status, 200);
    assert.equal(served.headers.get('content-type'), 'image/png');
    assert.equal((await call(media, { env, path: 'newsletter/2026/11/abc/01.png' })).status, 404);
    assert.equal((await call(media, { env, path: 'private/2026/11/1/01.png' })).status, 404);
  });

  it('has no approve or send route', async () => {
    const { readdirSync } = await import('node:fs');
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
    const files = walk(join(root, 'src/pages/api/newsletter-drafts')).map((f) => f.slice(root.length));
    assert.deepEqual(files.sort(), [
      '/src/pages/api/newsletter-drafts/[id].ts',
      '/src/pages/api/newsletter-drafts/[id]/images.ts',
      '/src/pages/api/newsletter-drafts/[id]/ready.ts',
      '/src/pages/api/newsletter-drafts/index.ts',
    ]);
    for (const f of files) assert.ok(!/sendgrid|approved_by\s*=|status\s*=\s*'sent'/i.test(readFileSync(join(root, f), 'utf8')), f);
  });
});

describe('legacy composer rows after the migration', () => {
  it('still save and send the old way', () => {
    const db = openDb();
    db.prepare(`INSERT INTO newsletters (subject, body_json, status) VALUES ('Old draft', '{}', 'draft')`).run();
    db.prepare(`INSERT INTO newsletters (subject, body_json, status, recipient_count, sent_at) VALUES ('Old send', '{}', 'sent', 10, CURRENT_TIMESTAMP)`).run();
    db.prepare(`UPDATE newsletters SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE subject = 'Old draft'`).run();
    assert.equal((db.prepare(`SELECT COUNT(*) n FROM newsletters WHERE status = 'sent'`).get() as any).n, 2);
  });
});

describe('letter sanitizer copy', () => {
  it('matches the members app rules', () => {
    assert.equal(sanitizeLetterHtml('<div style="border-left:3px solid red">x</div>'), '<p>x</p>');
  });
});
