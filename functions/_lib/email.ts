// Transactional email via Zoho ZeptoMail.
//
// Env config:
//   ZOHO_ZEPTOMAIL_TOKEN   - Bearer token (already includes the
//                            'Zoho-enczapikey ' prefix per Zoho convention).
//   ZOHO_ZEPTOMAIL_SENDER  - Sender email, e.g. 'noreply@r-statistics.co'.
//
// API: https://api.zeptomail.in/v1.1/email (Indian datacenter; matches the
// region selected at signup per CLAUDE.md Phase 0 setup notes).
//
// All sends are best-effort. Callers should use context.waitUntil() so
// the user response isn't gated on email delivery; failures are logged
// and the caller can retry via a separate path (e.g., cron) if needed.

const ZEPTOMAIL_ENDPOINT = "https://api.zeptomail.in/v1.1/email";

export interface SendMailArgs {
  to: { email: string; name?: string };
  subject: string;
  htmlBody: string;
  textBody: string;
  // Optional reply-to (defaults to the sender so replies go nowhere useful).
  replyTo?: { email: string; name?: string };
}

export interface SendMailResult {
  ok: boolean;
  status: number;
  body?: unknown;
  error?: string;
}

export async function sendMail(
  env: { ZOHO_ZEPTOMAIL_TOKEN: string; ZOHO_ZEPTOMAIL_SENDER: string },
  args: SendMailArgs,
): Promise<SendMailResult> {
  if (!env.ZOHO_ZEPTOMAIL_TOKEN || !env.ZOHO_ZEPTOMAIL_SENDER) {
    return { ok: false, status: 0, error: "missing_email_config" };
  }
  // The stored token already begins with "Zoho-enczapikey "; using as-is.
  const auth = env.ZOHO_ZEPTOMAIL_TOKEN.startsWith("Zoho-enczapikey ")
    ? env.ZOHO_ZEPTOMAIL_TOKEN
    : `Zoho-enczapikey ${env.ZOHO_ZEPTOMAIL_TOKEN}`;

  const payload: Record<string, unknown> = {
    from: { address: env.ZOHO_ZEPTOMAIL_SENDER, name: "r-statistics.co" },
    to: [{ email_address: { address: args.to.email, name: args.to.name || args.to.email } }],
    subject: args.subject,
    htmlbody: args.htmlBody,
    textbody: args.textBody,
  };
  if (args.replyTo) {
    payload.reply_to = [{ address: args.replyTo.email, name: args.replyTo.name || args.replyTo.email }];
  }

  try {
    const resp = await fetch(ZEPTOMAIL_ENDPOINT, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.warn(`[email] ZeptoMail send failed: ${resp.status}`, body);
      return { ok: false, status: resp.status, body, error: "send_failed" };
    }
    return { ok: true, status: resp.status, body };
  } catch (e) {
    const msg = (e as Error).message;
    console.warn(`[email] ZeptoMail network error: ${msg}`);
    return { ok: false, status: 0, error: msg };
  }
}

// Reusable plain-text HTML email shell so individual call sites only write
// the body copy. Inline styles (Outlook/Gmail-friendly), light theme.
export function emailShell(args: {
  preheader: string;
  contentHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const cta = args.ctaUrl && args.ctaLabel ? `
    <tr><td style="padding:0 32px 24px;">
      <a href="${args.ctaUrl}" style="display:inline-block;background:#2056d2;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px">${args.ctaLabel}</a>
    </td></tr>` : "";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>r-statistics.co</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a0d14">
<div style="display:none;max-height:0;overflow:hidden">${args.preheader}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f6f9">
  <tr><td align="center" style="padding:32px 16px">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #e4e7ee">
      <tr><td style="padding:24px 32px 12px;font-family:'Courier New',monospace;font-weight:600;font-size:15px;color:#0a0d14">
        r-statistics.co
      </td></tr>
      <tr><td style="padding:0 32px 24px;font-size:15px;line-height:1.6;color:#1f2533">
        ${args.contentHtml}
      </td></tr>
      ${cta}
      <tr><td style="padding:16px 32px 24px;border-top:1px solid #e4e7ee;font-size:12px;color:#6b7280;line-height:1.6">
        r-statistics.co &middot; R tutorials for working data scientists &middot;
        <a href="https://r-statistics.co" style="color:#2056d2;text-decoration:none">r-statistics.co</a>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

// Convenience wrapper for the certificate-earned email. Caller passes
// recipient details + cert metadata; we compose subject, HTML, and text
// and ship via sendMail.
export async function sendCertificateEmail(
  env: { ZOHO_ZEPTOMAIL_TOKEN: string; ZOHO_ZEPTOMAIL_SENDER: string },
  args: {
    to: { email: string; name: string };
    trackName: string;
    verifyUrl: string;
    publicId: string;
  },
): Promise<SendMailResult> {
  const subject = `${args.trackName} certificate — issued`;
  const contentHtml = `
    <p style="font-size:17px;font-weight:600;color:#0a0d14;margin:0 0 12px">
      Congratulations, ${args.to.name}.
    </p>
    <p>You've earned the <strong>${args.trackName}</strong> certificate from r-statistics.co.</p>
    <p>Your credential is now live at the public verify URL below. Add it to LinkedIn, share it with employers, or download the Open Badges JSON for badge wallets.</p>
    <p style="font-family:'Courier New',monospace;font-size:13px;background:#f4f6f9;padding:12px;border-radius:6px;word-break:break-all">
      ${args.verifyUrl}
    </p>
    <p>Certificate ID: <strong>${args.publicId}</strong></p>
  `;
  const textBody =
    `Congratulations, ${args.to.name}.\n\n` +
    `You have earned the ${args.trackName} certificate from r-statistics.co.\n\n` +
    `Verify URL: ${args.verifyUrl}\n` +
    `Certificate ID: ${args.publicId}\n\n` +
    `Add it to LinkedIn, share it with employers, or download the Open Badges JSON ` +
    `for credential wallets.\n\n` +
    `-- r-statistics.co`;
  const htmlBody = emailShell({
    preheader: `Your ${args.trackName} certificate is live.`,
    contentHtml,
    ctaUrl: args.verifyUrl,
    ctaLabel: "View your certificate",
  });
  return sendMail(env, {
    to: { email: args.to.email, name: args.to.name },
    subject, htmlBody, textBody,
  });
}
