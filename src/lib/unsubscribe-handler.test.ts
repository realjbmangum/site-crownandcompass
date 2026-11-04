import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleUnsubscribe } from './unsubscribe-handler.ts';
import { unsubscribeUrl } from './unsubscribe-token.ts';

const SECRET = 'test-secret-not-real';
function fakeDb() {
  const rows = new Map([['a@example.com', 'active'], ['b@example.com', 'active']]);
  return {
    rows,
    prepare(sql: string) {
      assert.match(sql, /^UPDATE subscribers SET status = 'unsubscribed'/);
      return { bind: (email: string) => ({ run: async () => { if (rows.has(email)) rows.set(email, 'unsubscribed'); } }) };
    },
  };
}

describe('/api/unsubscribe', () => {
  it('GET with a valid link only shows a confirm button and changes nothing', async () => {
    const db = fakeDb();
    const r = await handleUnsubscribe('GET', new URL(await unsubscribeUrl(SECRET, 'a@example.com')), { DB: db, UNSUBSCRIBE_SECRET: SECRET });
    assert.equal(r.status, 200);
    assert.match(await r.text(), /<form method="post"/);
    assert.equal(db.rows.get('a@example.com'), 'active');
  });
  it('POST with a valid link marks only that subscriber unsubscribed', async () => {
    const db = fakeDb();
    const r = await handleUnsubscribe('POST', new URL(await unsubscribeUrl(SECRET, 'A@Example.com')), { DB: db, UNSUBSCRIBE_SECRET: SECRET });
    assert.equal(r.status, 200);
    assert.equal(db.rows.get('a@example.com'), 'unsubscribed');
    assert.equal(db.rows.get('b@example.com'), 'active');
  });
  it('rejects a forged or missing token and an email swapped into a real link', async () => {
    const db = fakeDb();
    const env = { DB: db, UNSUBSCRIBE_SECRET: SECRET };
    const u = new URL(await unsubscribeUrl(SECRET, 'a@example.com'));
    u.searchParams.set('email', 'b@example.com');
    assert.equal((await handleUnsubscribe('POST', u, env)).status, 400);
    assert.equal((await handleUnsubscribe('POST', new URL('https://x.test/api/unsubscribe?email=b@example.com'), env)).status, 400);
    assert.equal(db.rows.get('b@example.com'), 'active');
  });
  it('fails closed when the secret is not configured', async () => {
    const db = fakeDb();
    const r = await handleUnsubscribe('POST', new URL(await unsubscribeUrl(SECRET, 'a@example.com')), { DB: db });
    assert.equal(r.status, 503);
    assert.equal(db.rows.get('a@example.com'), 'active');
  });
  it('escapes the address it echoes back', async () => {
    const evil = '"><script>x</script>@example.com';
    const r = await handleUnsubscribe('GET', new URL(await unsubscribeUrl(SECRET, evil)), { DB: fakeDb(), UNSUBSCRIBE_SECRET: SECRET });
    assert.doesNotMatch(await r.text(), /<script>x/);
  });
  it('405s other methods', async () => {
    const r = await handleUnsubscribe('PUT', new URL(await unsubscribeUrl(SECRET, 'a@example.com')), { DB: fakeDb(), UNSUBSCRIBE_SECRET: SECRET });
    assert.equal(r.status, 405);
  });
});
