import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { blogTrailingSlashTarget } from './blog-canonical.ts';

describe('blog trailing slash', () => {
  it('leaves the slashless canonical paths alone', () => {
    assert.equal(blogTrailingSlashTarget('/blog'), null);
    assert.equal(blogTrailingSlashTarget('/blog/the-long-walk'), null);
    assert.equal(blogTrailingSlashTarget('/'), null);
    assert.equal(blogTrailingSlashTarget('/about/'), null);
    assert.equal(blogTrailingSlashTarget('/api/join/'), null);
    assert.equal(blogTrailingSlashTarget('/media/hero.jpg/'), null);
  });

  it('308 target is the slashless path, with the query string kept', () => {
    assert.equal(blogTrailingSlashTarget('/blog/'), '/blog');
    assert.equal(blogTrailingSlashTarget('/blog/the-long-walk/'), '/blog/the-long-walk');
    assert.equal(
      blogTrailingSlashTarget('/blog/the-long-walk/', '?utm=1'),
      '/blog/the-long-walk?utm=1',
    );
    assert.equal(blogTrailingSlashTarget('/blog/the-long-walk//'), '/blog/the-long-walk');
  });
});
