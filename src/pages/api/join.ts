export const prerender = false;

import type { APIContext } from 'astro';
import { escapeHtml } from '../../lib/html';
import { brandEmail } from '../../lib/email-template';

export async function POST({ request, locals }: APIContext) {
  try {
    const body = await request.json();
    const { name, email, how_you_heard, message, intent } = body as Record<string, string>;

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

    // Length caps: keep a bad actor from bloating D1 rows / SendGrid payloads.
    if (
      name.trim().length > 200 ||
      email.trim().length > 254 ||
      (how_you_heard?.trim().length ?? 0) > 200 ||
      (message?.trim().length ?? 0) > 2000
    ) {
      return new Response(JSON.stringify({ error: 'One of those fields is too long.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // What the man is actually asking for. Anything unrecognised becomes
    // 'unsure' rather than a guess — a wrong guess here puts him in somebody
    // else's Watch, which is the bug this field exists to stop.
    const INTENTS = ['join', 'start', 'unsure'];
    const wants = INTENTS.includes((intent || '').trim()) ? intent.trim() : 'unsure';

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
        `INSERT INTO subscribers (name, email, how_you_heard, message, intent)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           name = excluded.name,
           how_you_heard = excluded.how_you_heard,
           message = excluded.message,
           intent = excluded.intent,
           updated_at = CURRENT_TIMESTAMP`
      )
      .bind(
        name.trim(),
        email.trim().toLowerCase(),
        how_you_heard?.trim() || null,
        message?.trim() || null,
        wants
      )
      .run();

    // Also put the man on the member app's roster as an applicant, so he can be
    // invited into a Watch from its /admin/members page — the app shares this
    // D1. DO NOTHING on conflict: an existing member (any status) is never
    // touched by a public form. And never let this write sink the join itself:
    // the subscriber row and the notification email still matter without it.
    let onRoster = false;
    try {
      const res = await db
        .prepare(
          `INSERT INTO members (name, email, role, status, intent)
           VALUES (?, ?, 'member', 'applied', ?)
           ON CONFLICT(email) DO NOTHING`
        )
        .bind(name.trim(), email.trim().toLowerCase(), wants)
        .run();
      onRoster = (res.meta?.changes ?? 0) > 0;
    } catch (err) {
      console.error('join: could not record applicant on the members roster:', err);
    }

    // SendGrid notifications
    const sendgridKey = (locals.runtime?.env?.SENDGRID_API_KEY as string) || '';
    const notifyEmail = (locals.runtime?.env?.NOTIFICATION_EMAIL as string) || '';

    if (sendgridKey && notifyEmail) {
      const safeName = escapeHtml(name.trim());
      const safeEmail = escapeHtml(email.trim());
      const safeHow = escapeHtml(how_you_heard?.trim() || 'Not given');
      const safeMessage = escapeHtml(message?.trim() || 'None');

      // Row style for the admin notification table.
      const label = 'padding:8px 14px 8px 0;color:#5b5445;font-size:13px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;vertical-align:top;';
      const value = 'padding:8px 0;color:#16130D;font-size:16px;line-height:1.5;vertical-align:top;';

      const notifyBody = `
        <p style="margin:0 0 20px;font-size:17px;">A new inquiry just came in.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #DCD3BC;">
          <tr><td style="${label}">Name</td><td style="${value}">${safeName}</td></tr>
          <tr><td style="${label}">Email</td><td style="${value}"><a href="mailto:${safeEmail}" style="color:#C0552A;text-decoration:none;">${safeEmail}</a></td></tr>
          <tr><td style="${label}">Wants</td><td style="${value}"><strong>${wants === 'start' ? 'To start his own Watch' : wants === 'join' ? 'To join a Watch' : 'Not sure yet'}</strong></td></tr>
          <tr><td style="${label}">How they heard</td><td style="${value}">${safeHow}</td></tr>
          <tr><td style="${label}">Message</td><td style="${value}">${safeMessage}</td></tr>
        </table>
        ${onRoster ? '<p style="margin:20px 0 0;font-size:14px;color:#5b5445;line-height:1.6;">He is on the Members roster in the app as Applied — send his invite from there to place him in a Watch.</p>' : ''}
      `;

      // Warm, plain confirmation for the person who reached out.
      const confirmBody = `
        <p style="margin:0 0 18px;font-size:17px;">${safeName ? `Thanks, ${safeName}.` : 'Thanks for reaching out.'}</p>
        <p style="margin:0 0 18px;">We got your note. Brian reads every message that comes in personally, so this is not an autoresponder standing in for a real reply.</p>
        <p style="margin:0 0 18px;">He will reach out to you before the next cycle opens. Nothing else is needed from you right now.</p>
        <p style="margin:0;">Glad you are here.</p>
      `;

      const send = (to: string, subject: string, html: string) =>
        fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: notifyEmail, name: 'Crown and Compass' },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        }).catch((err) => console.error('SendGrid send failed:', err));

      // Notify Brian, and confirm to the requester.
      await Promise.all([
        send(notifyEmail, `New Crown and Compass inquiry: ${name.trim()}`, brandEmail(notifyBody)),
        send(email.trim().toLowerCase(), 'We got your note', brandEmail(confirmBody)),
      ]);
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
