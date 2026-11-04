export const prerender = false;

import type { APIContext } from 'astro';
import { handleUnsubscribe } from '../../lib/unsubscribe-handler';

// Target of the unsubscribe link the member app's newsletter send tool puts
// in every email (and in its List-Unsubscribe header). See unsubscribe-handler.
export const ALL = ({ request, locals }: APIContext) =>
  // @ts-ignore — D1 binding and secret injected by Cloudflare runtime
  handleUnsubscribe(request.method, new URL(request.url), locals.runtime?.env ?? {});
