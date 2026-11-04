import { normalizeEmail, verifyUnsubscribeToken } from './unsubscribe-token.ts';

type DB = { prepare(sql: string): { bind(...v: unknown[]): { run(): Promise<unknown> } } };
export type UnsubEnv = { DB?: DB; UNSUBSCRIBE_SECRET?: string };

/**
 * GET shows a confirm button (mail scanners prefetch links, so a GET never
 * changes anything). POST, from that button or a mail client's one-click
 * List-Unsubscribe-Post, marks the row 'unsubscribed'. The newsletter send
 * tool only mails status = 'active'. No row is ever deleted, and the reply is
 * the same whether or not the address was on the list.
 */
export async function handleUnsubscribe(method: string, url: URL, env: UnsubEnv): Promise<Response> {
  const email = normalizeEmail(url.searchParams.get('email') || '');
  const token = url.searchParams.get('token') || '';
  const secret = env.UNSUBSCRIBE_SECRET || '';

  if (!secret || !env.DB) {
    return page(503, 'Unsubscribe is not available right now', 'Please reply to the email and we will take you off the list by hand.');
  }
  if (!email || email.length > 254 || !(await verifyUnsubscribeToken(secret, email, token))) {
    return page(400, 'This link is not valid', 'Use the unsubscribe link from the bottom of the email, or reply to it and we will take you off the list.');
  }

  if (method === 'GET') {
    const action = `/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
    return page(200, 'Unsubscribe from Crown and Compass email?', `You will stop getting the newsletter at ${escapeHtml(email)}.`,
      `<form method="post" action="${escapeHtml(action)}"><button class="btn" type="submit">Unsubscribe</button></form>`);
  }
  if (method === 'POST') {
    await env.DB
      .prepare(`UPDATE subscribers SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP WHERE email = ?`)
      .bind(email)
      .run();
    return page(200, 'You are unsubscribed', 'You will not get the newsletter again. If that was a mistake, you can always join again from the site.');
  }
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST' } });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function page(status: number, title: string, body: string, extra = ''): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} · Crown and Compass</title>
<style>body{margin:0;background:#15120d;color:#f1ebdc;font-family:Georgia,serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}main{max-width:520px;text-align:center}h1{font-size:28px;line-height:1.2;margin:0 0 14px}p{font-size:17px;line-height:1.6;color:rgba(241,235,220,.8)}.btn{margin-top:18px;background:#C0552A;color:#15120d;border:0;padding:14px 26px;font:600 16px Georgia,serif;cursor:pointer}a{color:#e08a5f}</style></head>
<body><main><h1>${escapeHtml(title)}</h1><p>${body}</p>${extra}<p><a href="/">thecrownandcompass.org</a></p></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
