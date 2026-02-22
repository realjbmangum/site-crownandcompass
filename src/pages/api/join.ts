export const prerender = false;

import type { APIContext } from 'astro';

export async function POST({ request, locals }: APIContext) {
  try {
    const body = await request.json();
    const { name, email, how_you_heard, message } = body as Record<string, string>;

    if (!name?.trim() || !email?.trim()) {
      return new Response(JSON.stringify({ error: 'Name and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // @ts-ignore — D1 binding injected by Cloudflare runtime
    const db = locals.runtime?.env?.DB;
    if (!db) {
      console.error('D1 binding "DB" not found in runtime env');
      return new Response(JSON.stringify({ error: 'Database unavailable.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db
      .prepare(
        `INSERT INTO subscribers (name, email, how_you_heard, message)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           name = excluded.name,
           how_you_heard = excluded.how_you_heard,
           message = excluded.message,
           updated_at = CURRENT_TIMESTAMP`
      )
      .bind(
        name.trim(),
        email.trim().toLowerCase(),
        how_you_heard?.trim() || null,
        message?.trim() || null
      )
      .run();

    // SendGrid notification
    const sendgridKey = (locals.runtime?.env?.SENDGRID_API_KEY as string) || '';
    const notifyEmail = (locals.runtime?.env?.NOTIFICATION_EMAIL as string) || '';

    if (sendgridKey && notifyEmail) {
      const emailBody = `
        <p>New Crown &amp; Compass inquiry:</p>
        <ul>
          <li><strong>Name:</strong> ${name.trim()}</li>
          <li><strong>Email:</strong> ${email.trim()}</li>
          <li><strong>How they heard:</strong> ${how_you_heard?.trim() || '—'}</li>
          <li><strong>Message:</strong> ${message?.trim() || '—'}</li>
        </ul>
      `;

      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: notifyEmail }] }],
          from: { email: notifyEmail, name: 'Crown and Compass' },
          subject: `New CC inquiry — ${name.trim()}`,
          content: [{ type: 'text/html', value: emailBody }],
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('join API error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong. Try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
