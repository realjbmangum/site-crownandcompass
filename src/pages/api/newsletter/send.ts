export const prerender = false;

import type { APIContext } from 'astro';
import { makeUnsubscribeToken, buildUnsubscribeUrl, constantTimeEqual } from '../../../lib/unsubscribe';
import { getSiteUrl } from '../../../lib/site';
import { escapeHtml } from '../../../lib/html';

interface NewsletterPayload {
  subject: string;
  preheader?: string;
  readingNotes: string;
  announcements?: string;
  chapterSpotlight?: string;
}

function buildEmailHtml(
  payload: NewsletterPayload,
  unsubscribeUrl: string,
  siteUrl: string,
  mailingAddress = ''
): string {
  const siteHost = new URL(siteUrl).host;

  // Escape all admin-authored fields before interpolation: they are plain text, so a
  // stray "<" (or a hostile value, were the admin secret ever compromised) must never
  // become live markup in the email.
  const subject = escapeHtml(payload.subject.trim());
  const preheader = escapeHtml((payload.preheader ?? '').trim());
  const readingNotes = escapeHtml(payload.readingNotes.trim());
  const announcements = escapeHtml((payload.announcements ?? '').trim());
  const chapterSpotlight = escapeHtml((payload.chapterSpotlight ?? '').trim());

  const announcementsSection = announcements
    ? `
      <tr>
        <td style="padding: 0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-top: 2px solid #c9853a; padding-top: 24px;">
                <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c9853a; margin: 0 0 12px;">Announcements</p>
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.75; color: #d4cfc6; white-space: pre-line;">${announcements}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const spotlightSection = chapterSpotlight
    ? `
      <tr>
        <td style="padding: 0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-top: 2px solid #c9853a; padding-top: 24px;">
                <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c9853a; margin: 0 0 12px;">Chapter Spotlight</p>
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.75; color: #d4cfc6; white-space: pre-line;">${chapterSpotlight}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#0f1117;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#0f1117;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1a1a20;border:1px solid #2e2c26;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid #2e2c26; text-align: center;">
              <p style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #f0ebe2; margin: 0 0 4px; letter-spacing: 0.03em;">Crown &amp; Compass</p>
              <p style="font-family: Georgia, serif; font-size: 13px; font-style: italic; color: #8a8070; margin: 0;">The Walk. Long. Slow. Together.</p>
            </td>
          </tr>

          <!-- Subject line as heading -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c9853a; margin: 0 0 12px;">This Week</p>
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 700; color: #f0ebe2; margin: 0; line-height: 1.2;">${subject}</h1>
            </td>
          </tr>

          <!-- Reading Notes -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top: 2px solid #c9853a; padding-top: 24px;">
                    <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c9853a; margin: 0 0 12px;">From the Session</p>
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.85; color: #d4cfc6; white-space: pre-line;">${readingNotes}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${announcementsSection}
          ${spotlightSection}

          <!-- Compass divider -->
          <tr>
            <td style="padding: 8px 40px 24px; text-align: center;">
              <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #c9853a; opacity: 0.5; margin: 0; letter-spacing: 0.2em;">— ✦ —</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; border-top: 1px solid #2e2c26; text-align: center;">
              <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #8a8070; margin: 0 0 8px;">
                You're receiving this because you're connected to Crown &amp; Compass.
              </p>
              <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 12px; color: #8a8070; margin: 0; opacity: 0.6;">
                <a href="${unsubscribeUrl}" style="color: #8a8070; text-decoration: underline;">Unsubscribe</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl}" style="color: #8a8070; text-decoration: underline;">${siteHost}</a>
              </p>
              ${mailingAddress ? `<p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; color: #8a8070; margin: 12px 0 0; opacity: 0.6;">${escapeHtml(mailingAddress)}</p>` : ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST({ request, locals }: APIContext) {
  try {
    // Admin auth check (constant-time so a wrong secret leaks no timing signal).
    const adminSecret = (locals.runtime?.env?.ADMIN_SECRET as string) || '';
    const authHeader = request.headers.get('x-admin-secret') || '';

    if (!adminSecret || !constantTimeEqual(authHeader, adminSecret)) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = await request.json() as NewsletterPayload;

    if (!payload.subject?.trim() || !payload.readingNotes?.trim()) {
      return new Response(JSON.stringify({ error: 'Subject and reading notes are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // @ts-ignore — bindings injected by the Cloudflare runtime
    const db = locals.runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database unavailable.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sendgridKey = (locals.runtime?.env?.SENDGRID_API_KEY as string) || '';
    const fromEmail = (locals.runtime?.env?.NOTIFICATION_EMAIL as string) || '';

    if (!sendgridKey || !fromEmail) {
      return new Response(JSON.stringify({ error: 'SendGrid not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query all active subscribers
    const { results: subscribers } = await db
      .prepare(`SELECT name, email FROM subscribers WHERE status = 'active'`)
      .all() as { results: { name: string; email: string }[] };

    if (subscribers.length === 0) {
      return new Response(JSON.stringify({ error: 'No active subscribers found.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = getSiteUrl(locals.runtime?.env);
    const mailingAddress = (locals.runtime?.env?.MAILING_ADDRESS as string) || '';

    // Send one message per subscriber so each carries its own working unsubscribe
    // link: a visible footer link (CAN-SPAM) plus an RFC 8058 one-click header for
    // deliverability. Each iteration is one SendGrid subrequest; Cloudflare caps
    // subrequests per invocation (~50 bundled, ~1000 unbound), so move to a queued
    // or batched send before the list outgrows that ceiling.
    let sent = 0;
    const failed: string[] = [];

    for (const sub of subscribers) {
      const token = await makeUnsubscribeToken(sub.email, adminSecret);
      const unsubscribeUrl = buildUnsubscribeUrl(siteUrl, sub.email, token);
      const htmlContent = buildEmailHtml(payload, unsubscribeUrl, siteUrl, mailingAddress);

      const sendRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: sub.email, name: sub.name }],
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            },
          ],
          from: { email: fromEmail, name: 'Crown and Compass' },
          subject: payload.subject.trim(),
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });

      if (sendRes.ok) {
        sent++;
      } else {
        failed.push(sub.email);
        console.error('SendGrid error for', sub.email, await sendRes.text());
      }
    }

    if (sent === 0) {
      return new Response(JSON.stringify({ error: 'Failed to send to any subscriber.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the send. A failure here must NOT change the reported outcome: the emails
    // already went out, and reporting an error would tempt a duplicate blast to the
    // whole list.
    try {
      await db
        .prepare(`INSERT INTO newsletter_sends (subject, recipient_count) VALUES (?, ?)`)
        .bind(payload.subject.trim(), sent)
        .run();
    } catch (logErr) {
      console.error('newsletter_sends log insert failed (send already completed):', logErr);
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed: failed.length, failedEmails: failed }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Newsletter send error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
