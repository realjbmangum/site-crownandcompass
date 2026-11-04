import assert from 'node:assert/strict';
import { authorizeDraft, authorizePublish } from '../src/lib/api/auth.ts';
import { renderBody } from '../src/lib/content/render.ts';
import type { BlogEnv } from '../src/lib/db/types.ts';

const html = renderBody('<p class="pull">Hello</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><div class="scripture" onclick="nope">Verse <span class="ref">Luke 1:1</span></div>');
assert.equal(html.includes('<script'), false);
assert.equal(html.includes('onclick'), false);
assert.equal(html.includes('javascript:'), false);
assert.match(html, /class="pull"/);
assert.match(html, /class="scripture"/);
assert.match(html, /class="ref"/);
assert.match(html, />x</);

const md = renderBody('A line.\n\n<script>alert(1)</script>\n\n![Desk](blog/2026/09/fight-club-with-books/01.png)\n\n**Iron**.');
assert.equal(md.includes('<script'), false);
assert.match(md, /&lt;script&gt;/);
assert.match(md, /src="\/media\/blog\/2026\/09\/fight-club-with-books\/01.png"/);
assert.match(md, /<strong>Iron<\/strong>/);

const env = {
  DAVID_API_KEY: 'david-secret',
  PULPIT_API_KEY: 'pulpit-secret',
  BARNABAS_API_KEY: 'barnabas-secret',
  BRIAN_ADMIN_KEY: 'brian-secret',
} as BlogEnv;

assert.equal(await authorizeDraft(env, 'david-secret'), 'david');
assert.equal(await authorizeDraft(env, 'pulpit-secret'), 'pulpit');
assert.equal(await authorizeDraft(env, 'barnabas-secret'), 'barnabas');
assert.equal(await authorizeDraft(env, 'brian-secret'), 'brian');
assert.equal(await authorizeDraft(env, 'nope'), null);
assert.equal(await authorizePublish(env, 'brian-secret'), true);
assert.equal(await authorizePublish(env, 'david-secret'), false);
assert.equal(await authorizePublish(env, 'pulpit-secret'), false);
assert.equal(await authorizePublish(env, 'barnabas-secret'), false);
assert.equal(await authorizePublish(env, null), false);

const collided = { ...env, DAVID_API_KEY: 'brian-secret' } as BlogEnv;
assert.equal(await authorizePublish(collided, 'brian-secret'), false);

console.log('render-test: ok');
