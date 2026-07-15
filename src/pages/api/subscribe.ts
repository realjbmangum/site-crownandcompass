export const prerender = false;

import type { APIContext } from 'astro';
import { brandEmail } from '../../lib/email-template';

// Newsletter signup. Email-only (name optional), writes to the shared
// subscribers table. Distinct from /api/join, which is the full inquiry form.
export async function POST({ request, locals }: APIContext) {
  try {
    const body = await request.json();
    const { email, source } = body as Record<string, string>;

    if (!email?.trim()) {
      return json({ error: 'Please enter your email.' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    const clean = email.trim().toLowerCase();
    const heard = source?.trim() ? `Newsletter (${source.trim()})` : 'Newsletter';

    // @ts-ignore — D1 binding injected by Cloudflare runtime
    const db = locals.runtime?.env?.DB;
    if (!db) {
      console.error('D1 binding "DB" not found in runtime env');
      return json({ error: 'Something went wrong. Try again.' }, 500);
    }

    // Upsert on email. Do NOT clobber an existing subscriber's name or how they
    // first reached us (someone who filled out Join may also subscribe here);
    // only touch the timestamp when they already exist.
    await db
      .prepare(
        `INSERT INTO subscribers (name, email, how_you_heard, source)
         VALUES ('', ?, ?, 'newsletter')
         ON CONFLICT(email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`
      )
      .bind(clean, heard)
      .run();

    // Warm, plain confirmation to the subscriber. Non-blocking on failure.
    const sendgridKey = (locals.runtime?.env?.SENDGRID_API_KEY as string) || '';
    const fromEmail = (locals.runtime?.env?.NOTIFICATION_EMAIL as string) || '';

    if (sendgridKey && fromEmail) {
      const confirmBody = `
        <p style="margin:0 0 18px;font-size:17px;">You are on the list.</p>
        <p style="margin:0 0 18px;">One honest email each week: what we are reading, one thought worth sitting with, and when the next cycle opens. Nothing else.</p>
        <p style="margin:0;">If it is ever not worth your time, there is a way out at the bottom of every note.</p>
      `;
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: clean }] }],
          from: { email: fromEmail, name: 'Crown and Compass' },
          subject: 'You are on the list',
          content: [{ type: 'text/html', value: brandEmail(confirmBody) }],
        }),
      }).catch((err) => console.error('SendGrid send failed:', err));
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error('subscribe API error:', err);
    return json({ error: 'Something went wrong. Try again.' }, 500);
  }
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
