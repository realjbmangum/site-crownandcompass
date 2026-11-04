import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { unsubscribeToken, unsubscribeUrl, verifyUnsubscribeToken, UNSUBSCRIBE_BASE } from './unsubscribe-token.ts';

const SECRET = 'test-secret-not-real';

describe('unsubscribe tokens', () => {
  it('verifies a token for the address it was minted for, case-insensitively', async () => {
    const t = await unsubscribeToken(SECRET, 'Someone@Example.com ');
    assert.match(t, /^[0-9a-f]{64}$/);
    assert.equal(await verifyUnsubscribeToken(SECRET, 'someone@example.com', t), true);
  });
  it('rejects another address, another secret, junk, and a missing secret', async () => {
    const t = await unsubscribeToken(SECRET, 'a@example.com');
    assert.equal(await verifyUnsubscribeToken(SECRET, 'b@example.com', t), false);
    assert.equal(await verifyUnsubscribeToken('other-secret', 'a@example.com', t), false);
    assert.equal(await verifyUnsubscribeToken(SECRET, 'a@example.com', 'nope'), false);
    assert.equal(await verifyUnsubscribeToken(SECRET, 'a@example.com', ''), false);
    assert.equal(await verifyUnsubscribeToken('', 'a@example.com', t), false);
  });
  it('builds the link the site route expects', async () => {
    const u = new URL(await unsubscribeUrl(SECRET, 'A+b@Example.com'));
    assert.equal(`${u.origin}${u.pathname}`, UNSUBSCRIBE_BASE);
    assert.equal(u.searchParams.get('email'), 'a+b@example.com');
    assert.equal(await verifyUnsubscribeToken(SECRET, u.searchParams.get('email')!, u.searchParams.get('token')!), true);
  });
  it('refuses to mint without a secret', async () => {
    await assert.rejects(() => unsubscribeToken('', 'a@example.com'));
  });
});
