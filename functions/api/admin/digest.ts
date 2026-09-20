// GET /api/admin/digest - the daily operator digest, on demand.
//
//   (no params)   render it in the browser, exactly as the email looks
//   ?format=text  the plain-text half
//   ?format=json  the numbers, for anything that wants to chart them
//   ?send=1       send it to the admin address now
//
// The cron sends this once a day; this endpoint is how you look at it
// whenever you like, and how the send is tested without waiting for 05:00.
//
// Admin-gated the same way as /api/admin/stats and /api/admin/email-plan.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403 } from "../../_lib/errors";
import { buildDigest, renderDigestHtml, renderDigestText } from "../../_lib/digest";
import { sendMail } from "../../_lib/email";

const DEFAULT_ADMIN = "selva86@gmail.com";

export const onRequestGet: PagesFunction<
  Env & { ZOHO_ZEPTOMAIL_TOKEN?: string; ZOHO_ZEPTOMAIL_SENDER?: string },
  string,
  RequestData
> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  if ((u.email || "").toLowerCase() !== admin.toLowerCase()) return err403("Admins only");

  const url = new URL(context.request.url);
  const d = await buildDigest(context.env);

  if (url.searchParams.get("send") === "1") {
    const r = await sendMail(
      context.env as { ZOHO_ZEPTOMAIL_TOKEN: string; ZOHO_ZEPTOMAIL_SENDER: string },
      {
        to: { email: admin },
        subject: d.subject,
        htmlBody: renderDigestHtml(d),
        textBody: renderDigestText(d),
      },
    );
    // Logged like any other send so the digest shows up in its own numbers.
    try {
      await context.env.DB.prepare(
        "INSERT INTO email_events (at, user_id, email_key, event, meta) VALUES (?,?,?,?,?)",
      ).bind(Math.floor(Date.now() / 1000), u.id, "digest", r.ok ? "sent" : "error",
        r.ok ? d.day : String(r.error || r.status)).run();
    } catch { /* the send is what matters */ }
    return json({ sent: r.ok, to: admin, subject: d.subject, error: r.ok ? null : (r.error || r.status) });
  }

  const fmt = url.searchParams.get("format");
  if (fmt === "json") return json(d as unknown as Record<string, unknown>);
  if (fmt === "text") {
    return new Response(renderDigestText(d), {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">` +
    `<title>${d.subject}</title>` +
    `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">` +
    `<body style="margin:0">${renderDigestHtml(d)}</body>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
};
