/**
 * Local smoke test. Uses wrangler's local D1 only. Never passes --remote.
 *
 *   node scripts/smoke-blog.mjs
 */
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = 8788;
const BASE = `http://127.0.0.1:${PORT}`;

function run(args) {
  const result = spawnSync('npx', args, { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

writeFileSync(join(ROOT, '.dev.vars'), [
  'DAVID_API_KEY=test-david-key',
  'PULPIT_API_KEY=test-pulpit-key',
  'BARNABAS_API_KEY=test-barnabas-key',
  'BRIAN_ADMIN_KEY=test-brian-key',
  '',
].join('\n'));

run(['wrangler', 'd1', 'execute', 'crownandcompass', '--local', '--yes', '--file=migrations/0001_blog.sql']);
run(['wrangler', 'd1', 'execute', 'crownandcompass', '--local', '--yes', '--file=data/blog-import.sql']);

const server = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--port', String(PORT), '--ip', '127.0.0.1'], {
  cwd: ROOT,
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', (buf) => { logs += buf; });
server.stderr.on('data', (buf) => { logs += buf; });

function stop() {
  try {
    process.kill(-server.pid, 'SIGKILL');
  } catch {
    server.kill('SIGKILL');
  }
}

async function waitReady() {
  const deadline = Date.now() + 40000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/blog`);
      if (res.status) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  console.error(logs);
  throw new Error('pages dev did not start');
}

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual', ...options });
  const text = await res.text();
  return { status: res.status, location: res.headers.get('location'), text };
}

try {
  await waitReady();
  const blog = await req('/blog');
  if (blog.status !== 200 || !blog.text.includes('Fight Club with books')) {
    throw new Error(`blog index failed ${blog.status}`);
  }
  if (/chasing dopamine/i.test(blog.text) || /feel loved/i.test(blog.text)) {
    throw new Error('excluded essays showed up on the D1 index');
  }
  const post = await req('/blog/fight-club-with-books');
  if (post.status !== 200 || !post.text.includes('Pull up a chair')) {
    throw new Error(`post page failed ${post.status}`);
  }
  const sedation = await req('/blog/so-does-sedation');
  if (!sedation.text.includes('class="scripture"') || !sedation.text.includes('1 Peter 5:8')) {
    throw new Error('scripture block did not survive the import');
  }
  if (!post.text.includes('rel="canonical" href="https://thecrownandcompass.org/blog/fight-club-with-books"')) {
    throw new Error('canonical is wrong');
  }
  const old = await req('/fight-club-with-books');
  if (old.status !== 301 || old.location !== '/blog/fight-club-with-books') {
    throw new Error(`old url redirect was ${old.status} ${old.location}`);
  }
  const kept = await req('/chasing-dopamine');
  if (kept.status !== 200 || !kept.text.includes('dopamine')) {
    throw new Error(`excluded page was not left alone (${kept.status})`);
  }
  const unauth = await req('/api/drafts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  if (unauth.status !== 401) throw new Error(`draft without a key was ${unauth.status}`);
  const writerPublish = await req('/api/admin/posts/fight-club-with-books/publish', {
    method: 'POST',
    headers: { authorization: 'Bearer test-david-key' },
  });
  if (writerPublish.status !== 401) throw new Error(`david publish was ${writerPublish.status} ${writerPublish.text}`);

  const slug = `smoke-${Date.now()}`;
  const created = await req('/api/drafts', {
    method: 'POST',
    headers: { authorization: 'Bearer test-barnabas-key', 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'A quiet Friday',
      description: 'One honest note from the week.',
      body: 'The room was still.\n\n<script>alert(1)</script>\n\n**Stay.**',
      pub_date: '2026-11-04',
      slug,
      tags: ['Faith'],
    }),
  });
  if (created.status !== 201) throw new Error(`create failed ${created.status} ${created.text}`);
  const ready = await req(`/api/drafts/${slug}/ready`, {
    method: 'POST',
    headers: { authorization: 'Bearer test-pulpit-key' },
  });
  if (ready.status !== 200) throw new Error(`ready failed ${ready.status} ${ready.text}`);
  const hidden = await req(`/blog/${slug}`);
  if (hidden.status !== 404) throw new Error(`unpublished post was visible (${hidden.status})`);
  const published = await req(`/api/admin/posts/${slug}/publish`, {
    method: 'POST',
    headers: { authorization: 'Bearer test-brian-key' },
  });
  if (published.status !== 200 || !published.text.includes('"published_by":"brian"')) {
    throw new Error(`publish failed ${published.status} ${published.text}`);
  }
  const live = await req(`/blog/${slug}`);
  if (live.status !== 200 || !live.text.includes('The room was still')) {
    throw new Error('published draft did not render');
  }
  if (live.text.includes('<script>alert') || live.text.includes('<script>')) {
    throw new Error('script tag survived rendering');
  }
  const again = await req(`/api/admin/posts/${slug}/publish`, {
    method: 'POST',
    headers: { authorization: 'Bearer test-brian-key' },
  });
  if (again.status !== 409) throw new Error(`second publish was ${again.status}`);
  const book = await req('/api/current-book');
  if (book.status !== 200) throw new Error(`current-book broke (${book.status})`);
  console.log('smoke-blog: ok');
} catch (err) {
  console.error(logs.slice(-4000));
  console.error(err);
  process.exitCode = 1;
} finally {
  stop();
  setTimeout(() => process.exit(process.exitCode ?? 0), 200);
}
