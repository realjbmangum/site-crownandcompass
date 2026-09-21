-- Current book: John Bevere, Killing Kryptonite.
-- Point D1 books.guide_url at the live public discussion-Q page.
-- has_guide stays 1 (published book_guides row already exists). Do not invent weeks.
UPDATE books
SET guide_url = '/guide-killing-kryptonite'
WHERE slug = 'killing-kryptonite'
  AND (guide_url IS NULL OR guide_url <> '/guide-killing-kryptonite');
