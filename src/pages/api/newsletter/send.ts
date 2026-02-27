export const prerender = false;

import type { APIContext } from 'astro';

interface NewsletterPayload {
  subject: string;
  preheader?: string;
  readingNotes: string;
  announcements?: string;
  chapterSpotlight?: string;
}

function buildEmailHtml(payload: NewsletterPayload, unsubscribeUrl: string): string {
  const { subject, preheader = '', readingNotes, announcements, chapterSpotlight } = payload;

  const announcementsSection = announcements?.trim()
    ? `
      <tr>
        <td style="padding: 0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-top: 2px solid #c9853a; padding-top: 24px;">
                <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c9853a; margin: 0 0 12px;">Announcements</p>
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.75; color: #d4cfc6; white-space: pre-line;">${announcements.trim()}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const spotlightSection = chapterSpotlight?.trim()
    ? `
      <tr>
        <td style="padding: 0 40px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-top: 2px solid #c9853a; padding-top: 24px;">
                <p style="font-family: 'DM Sans', Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #c9853a; margin: 0 0 12px;">Chapter Spotlight</p>
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.75; color: #d4cfc6; white-space: pre-line;">${chapterSpotlight.trim()}</div>
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
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.85; color: #d4cfc6; white-space: pre-line;">${readingNotes.trim()}</div>
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
                <a href="https://crownandcompass.com" style="color: #8a8070; text-decoration: underline;">crownandcompass.com</a>
              </p>
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
    // Admin auth check
    const adminSecret = (locals.runtime?.env?.ADMIN_SECRET as string) || '';
    const authHeader = request.headers.get('x-admin-secret') || '';

    if (!adminSecret || authHeader !== adminSecret) {
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

    // @ts-ignore
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

    const siteUrl = 'https://crownandcompass.com';

    // Build personalizations (SendGrid supports up to 1000 per request)
    const personalizations = subscribers.map(sub => ({
      to: [{ email: sub.email, name: sub.name }],
    }));

    const htmlContent = buildEmailHtml(
      payload,
      `${siteUrl}/api/unsubscribe?email=placeholder`
    );

    const sendRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations,
        from: { email: fromEmail, name: 'Crown and Compass' },
        subject: payload.subject.trim(),
        content: [{ type: 'text/html', value: htmlContent }],
      }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error('SendGrid error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to send via SendGrid.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the send
    await db
      .prepare(`INSERT INTO newsletter_sends (subject, recipient_count) VALUES (?, ?)`)
      .bind(payload.subject.trim(), subscribers.length)
      .run();

    return new Response(JSON.stringify({ success: true, sent: subscribers.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter send error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
