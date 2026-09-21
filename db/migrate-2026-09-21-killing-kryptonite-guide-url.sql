-- Wire the public reading-guide URLs on the shared D1 books table.
--
-- books.guide_url is what /api/current-book and /api/reading-list return.
-- The Worker also falls back to src/lib/guides.ts if this column is null,
-- so a missed apply does not leave the APIs empty after deploy.
--
-- Apply after merge (do not run against production from an unmerged PR):
--   npx wrangler d1 execute crownandcompass --remote --file=db/migrate-2026-09-21-killing-kryptonite-guide-url.sql

UPDATE books
   SET guide_url = '/guide-killing-kryptonite'
 WHERE slug = 'killing-kryptonite';

-- Hughes used to live at the /reading-guide hub. That path now 308s to the
-- current book, so the archive URL has to be stored on this row.
UPDATE books
   SET guide_url = '/guide-disciplines-of-a-godly-man'
 WHERE slug = 'disciplines-of-a-godly-man';
