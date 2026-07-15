/**
 * Reusable, email-safe Crown and Compass branded shell.
 *
 * Table layout + inline styles + web-safe font fallbacks so it renders in
 * every mail client. Palette matches the Field Manual brand:
 *   ink  #16130D  (header + primary text)
 *   bone #F1EBDC  (content card)
 *   ember #C0552A (accent)
 *
 * Pass already-escaped, trusted HTML as innerHtml. Callers are responsible
 * for escaping any user-supplied values before handing them in.
 */
export function brandEmail(innerHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#DCD3BC;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#F1EBDC;color:#16130D;">
      <tr>
        <td style="background:#16130D;padding:24px 32px;text-align:center;">
          <img src="https://thecrownandcompass.org/assets/cc-white.png" width="64" height="64" alt="Crown and Compass" style="display:block;margin:0 auto 10px;border:0;outline:none;text-decoration:none;height:auto;" />
          <div style="color:#F1EBDC;font-size:14px;letter-spacing:.16em;font-weight:700;font-family:Georgia,'Times New Roman',serif;">CROWN &amp; COMPASS</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;font-size:16px;line-height:1.65;color:#16130D;">
          ${innerHtml}
        </td>
      </tr>
      <tr>
        <td style="background:#16130D;padding:16px 32px;text-align:center;">
          <div style="color:#B8AE97;font-size:12px;letter-spacing:.06em;font-family:Georgia,'Times New Roman',serif;">Crown and Compass · One book, read together.</div>
        </td>
      </tr>
    </table>
  </td></tr></table>
</body></html>`;
}
