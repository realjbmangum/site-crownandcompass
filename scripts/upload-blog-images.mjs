/**
 * Upload manifest objects to an R2 bucket.
 *
 *   node scripts/upload-blog-images.mjs --bucket crownandcompass-media-preview
 *
 * Refuses crownandcompass-media unless you pass --confirm-production.
 * This script does not confirm production on its own. Do not point it at the
 * production bucket until Brian has approved the upload step.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const bucketFlag = args.indexOf('--bucket');
const bucket = bucketFlag >= 0 ? args[bucketFlag + 1] : '';
const confirm = args.includes('--confirm-production');

if (!bucket) {
  console.error('Pass --bucket crownandcompass-media-preview (or the production bucket with --confirm-production).');
  process.exit(1);
}
if (bucket === 'crownandcompass-media' && !confirm) {
  console.error('Refusing crownandcompass-media. That is the production bucket. Re-run with --confirm-production only after Brian approves.');
  process.exit(1);
}
if (bucket !== 'crownandcompass-media' && bucket !== 'crownandcompass-media-preview') {
  console.error(`Unexpected bucket ${bucket}. Use crownandcompass-media-preview or crownandcompass-media.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'data/blog-r2-manifest.json'), 'utf8'));
for (const object of manifest.objects) {
  const file = join(ROOT, object.source);
  if (!existsSync(file)) {
    console.error(`missing ${object.source}`);
    process.exit(1);
  }
  const result = spawnSync(
    'npx',
    [
      'wrangler', 'r2', 'object', 'put',
      `${bucket}/${object.key}`,
      '--file', file,
      '--content-type', object.content_type,
      '--remote',
    ],
    { cwd: ROOT, stdio: 'inherit' }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`put ${object.key}`);
}
