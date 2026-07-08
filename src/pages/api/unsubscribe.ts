export const prerender = false;

import type { APIContext } from 'astro';
import { verifyUnsubscribeToken } from '../../lib/unsubscribe';
import { getSiteUrl } from '../../lib/site';
import { escapeHtml } from '../../lib/html';

type Result = 'ok' | 'invalid' | 'error';

function readParams(request: Request) {
  const url = new URL(request.url);
  return {
    email: (url.searchParams.get('email') || '').trim().toLowerCase(),
    token: (url.searchParams.get('token') || '').trim(),
    // Relative action URL preserves email+token for the confirm form POST.
    actionUrl: url.pathname + url.search,
  };
}

async function isValid(email: string, token: string, locals: APIContext['locals']): Promise<boolean> {
  // @ts-ignore — bindings injected by the Cloudflare runtime
  const secret = (locals.runtime?.env?.ADMIN_SECRET as string) || '';
  return verifyUnsubscribeToken(email, token, secret);
}

async function applyUnsubscribe(email: string, locals: APIContext['locals']): Promise<Result> {
  // @ts-ignore — bindings injected by the Cloudflare runtime
  const db = locals.runtime?.env?.DB;
  if (!db) return 'error';
  try {
    await db
      .prepare(
        `UPDATE subscribers SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP WHERE email = ?`
      )
      .bind(email)
      .run();
    return 'ok';
  } catch (err) {
    console.error('unsubscribe error:', err);
    return 'error';
  }
}

// A link click (GET) never mutates. Corporate mail scanners (Microsoft Safe Links,
// Proofpoint, Mimecast) pre-fetch every link in an inbound email, so a mutating GET
// would silently unsubscribe men who never clicked. GET verifies the token and shows
// a one-button confirm page that POSTs. Native "Unsubscribe" buttons (RFC 8058) POST
// directly and skip this page.
export async function GET(context: APIContext) {
  const { email, token, actionUrl } = readParams(context.request);
  // @ts-ignore — bindings injected by the Cloudflare runtime
  const siteUrl = getSiteUrl(context.locals.runtime?.env);
  const valid = await isValid(email, token, context.locals);
  return html(
    valid ? confirmPage(email, actionUrl, siteUrl) : messagePage('invalid', siteUrl),
    valid ? 200 : 400
  );
}

export async function POST(context: APIContext) {
  const { email, token } = readParams(context.request);
  // @ts-ignore — bindings injected by the Cloudflare runtime
  const siteUrl = getSiteUrl(context.locals.runtime?.env);
  // A human submitting the confirm form navigates and accepts HTML; an RFC 8058
  // one-click POST from a mail client does not, and wants a bare 2xx.
  const wantsHtml = (context.request.headers.get('accept') || '').includes('text/html');

  if (!(await isValid(email, token, context.locals))) {
    return wantsHtml ? html(messagePage('invalid', siteUrl), 400) : new Response(null, { status: 400 });
  }

  const result = await applyUnsubscribe(email, context.locals);
  if (!wantsHtml) {
    return new Response(null, { status: result === 'ok' ? 200 : 500 });
  }
  return html(messagePage(result, siteUrl), result === 'error' ? 500 : 200);
}

function html(body: string, status: number) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function shell(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Crown and Compass</title>
<style>
  body { margin:0; background:#0f1117; color:#f0ebe2; font-family: Georgia,'Times New Roman',serif; }
  .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px 20px; box-sizing:border-box; }
  .card { max-width:520px; text-align:center; }
  .kicker { font-family:'DM Sans',Arial,sans-serif; font-size:11px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase; color:#c9853a; margin:0 0 20px; }
  h1 { font-size:32px; font-weight:700; margin:0 0 20px; line-height:1.2; }
  p { font-size:18px; line-height:1.8; color:#d4cfc6; margin:0 0 28px; }
  .btn { font-family:'DM Sans',Arial,sans-serif; font-size:15px; font-weight:600; letter-spacing:0.02em; color:#0f1117; background:#c9853a; border:none; border-radius:2px; padding:14px 28px; cursor:pointer; }
  .btn:hover { background:#e8a055; }
  form { margin:0 0 24px; }
  a.home { font-family:'DM Sans',Arial,sans-serif; font-size:14px; color:#8a8070; text-decoration:underline; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
${inner}
    </div>
  </div>
</body>
</html>`;
}

function confirmPage(email: string, actionUrl: string, siteUrl: string): string {
  return shell(`      <p class="kicker">Crown and Compass</p>
      <h1>Leaving the list?</h1>
      <p>This stops the emails to ${escapeHtml(email)}. No hard feelings. The door stays open.</p>
      <form method="POST" action="${escapeHtml(actionUrl)}">
        <button type="submit" class="btn">Yes, take me off the list</button>
      </form>
      <a class="home" href="${escapeHtml(siteUrl)}">Never mind, keep me on</a>`);
}

function messagePage(result: Result, siteUrl: string): string {
  const heading =
    result === 'ok'
      ? "You're off the list."
      : result === 'invalid'
        ? "We couldn't confirm that link."
        : 'Something went wrong.';

  const body =
    result === 'ok'
      ? 'We have taken you off the Crown and Compass list. No more emails will come. The door stays open. When you are ready to walk again, you know where we are.'
      : result === 'invalid'
        ? 'That unsubscribe link did not check out. It may have been mistyped or already used. Reply to any email from us and we will take you off by hand.'
        : 'We could not process that request. Reply to any email from us and we will take you off by hand.';

  return shell(`      <p class="kicker">Crown and Compass</p>
      <h1>${heading}</h1>
      <p>${body}</p>
      <a class="home" href="${escapeHtml(siteUrl)}">Return to Crown and Compass</a>`);
}
