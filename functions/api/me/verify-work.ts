// POST /api/me/verify-work           { email }  -> sends a 6-digit code
// POST /api/me/verify-work (confirm) { code }   -> sets the verified domain
//
// The one honest validation we can offer for "works at / studies at": prove
// control of an email address on the organization's domain. Only the DOMAIN
// is ever stored or shown; the address is used once for the code and dropped.
// Domains that prove nothing (free mail, disposables) are rejected. Academic
// domains (.edu, .edu.xx, .ac.xx) verify the education line; everything else
// verifies work. Code: hashed in KV, 15-minute expiry, 5 confirm attempts,
// 3 sends per day per user.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { sendMail, emailShell } from "../../_lib/email";
import { ensureProfileColumns } from "../../_lib/profile";

const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk",
  "outlook.com", "hotmail.com", "live.com", "msn.com", "aol.com",
  "icloud.com", "me.com", "proton.me", "protonmail.com", "gmx.com", "gmx.de",
  "mail.com", "zoho.com", "zohomail.in", "yandex.com", "yandex.ru",
  "rediffmail.com", "mailinator.com", "guerrillamail.com", "yopmail.com",
  "10minutemail.com", "tempmail.com", "temp-mail.org", "sharklasers.com",
]);

function isAcademic(domain: string): boolean {
  return /\.edu$/.test(domain) || /\.edu\.[a-z]{2,3}$/.test(domain) || /\.ac\.[a-z]{2,3}$/.test(domain);
}

async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

interface Pending { hash: string; domain: string; kind: "work" | "education"; attempts: number }

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const KV = context.env.KV;

  let body: { email?: unknown; code?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return jsonError(400, "bad_body", "Invalid JSON body");
  }

  // ---- confirm path ----
  if (typeof body.code === "string") {
    const code = body.code.replace(/\D/g, "");
    if (code.length !== 6) return jsonError(400, "bad_code", "Enter the 6-digit code.");
    const pend = await KV.get<Pending>(`vw:${u.id}`, "json");
    if (!pend) return jsonError(410, "expired", "Code expired. Send a new one.");
    if (pend.attempts >= 5) {
      await KV.delete(`vw:${u.id}`);
      return jsonError(429, "too_many", "Too many attempts. Send a new code.");
    }
    if ((await sha256hex(code + u.id)) !== pend.hash) {
      pend.attempts += 1;
      await KV.put(`vw:${u.id}`, JSON.stringify(pend), { expirationTtl: 900 });
      return jsonError(400, "wrong_code", "That code does not match.");
    }
    await KV.delete(`vw:${u.id}`);
    await ensureProfileColumns(context.env.DB);
    const col = pend.kind === "education" ? "edu_verified_domain" : "work_verified_domain";
    await context.env.DB.prepare(`UPDATE users SET ${col} = ?1 WHERE id = ?2`)
      .bind(pend.domain, u.id).run();
    return json({ ok: true, kind: pend.kind, domain: pend.domain });
  }

  // ---- send path ----
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const m = email.match(/^[a-z0-9][a-z0-9._%+-]{0,63}@([a-z0-9.-]+\.[a-z]{2,24})$/);
  if (!m) return jsonError(400, "bad_email", "Enter a valid email address.");
  const domain = m[1];
  if (FREE_MAIL.has(domain)) {
    return jsonError(400, "free_mail", "Use your work or university address; personal-mail domains cannot verify an organization.");
  }

  const dayKey = `vw:rate:${u.id}:${new Date().toISOString().slice(0, 10)}`;
  const sent = Number((await KV.get(dayKey)) || 0);
  if (sent >= 3) return jsonError(429, "rate_limited", "Limit reached; try again tomorrow.");

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const kind: "work" | "education" = isAcademic(domain) ? "education" : "work";
  await KV.put(`vw:${u.id}`, JSON.stringify({
    hash: await sha256hex(code + u.id), domain, kind, attempts: 0,
  } as Pending), { expirationTtl: 900 });
  await KV.put(dayKey, String(sent + 1), { expirationTtl: 86400 });

  const res = await sendMail(context.env, {
    to: { email },
    subject: `${code} is your r-statistics.co verification code`,
    htmlBody: emailShell({
      preheader: "Verification code",
      contentHtml: `<p>Your code to verify <b>@${domain}</b> on your r-statistics.co profile:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
        <p style="color:#6b7280;font-size:13px">Expires in 15 minutes. If you did not request this, ignore this email; nothing is linked without the code.</p>`,
    }),
    textBody: `Your r-statistics.co verification code for @${domain}: ${code}\nExpires in 15 minutes.`,
  });
  if (!res.ok) return jsonError(502, "send_failed", "Could not send the code. Try again shortly.");
  return json({ ok: true, kind, domain });
};
