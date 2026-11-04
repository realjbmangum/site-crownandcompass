import { register } from 'node:module';

// The site imports extensionless TypeScript (`../db/types`). Node's test runner
// does not. This hook only fills that gap for `npm test`.
register('./resolve-ts-hook.mjs', import.meta.url);
