// The admin gate the contact-centre endpoints share.
//
// Three ways in, the same three /api/admin/contacts and /api/admin/outreach
// have accepted since 2026-09-27:
//   - a Supabase bearer for the admin account (what the admin pages send),
//   - the signed rsc-id cookie (typing an /api URL into a signed-in browser),
//   - the CRON_SECRET bearer (scripted checks; it already runs the email
//     brain, so it is not a widening of trust).

import type { Env, RequestData } from "../_middleware";
import { err401, err403 } from "./errors";
import { getUserById } from "./db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "./idcookie";

const DEFAULT_ADMIN = "selva86@gmail.com";

/* Constant-time compare. A length-varying or short-circuiting compare on a
   shared secret is a timing oracle. */
function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export type AdminOk = { ok: true; admin: string; isCron: boolean };

export async function requireAdmin(
  context: EventContext<Env & { CRON_SECRET?: string; ADMIN_EMAIL?: string }, string, RequestData>,
): Promise<AdminOk | Response> {
  let u = context.data.user;
  if (!u) {
    const secret = context.env.EDGE_ID_SECRET || "";
    const sub = secret ? await verifyIdCookie(secret, readCookie(context.request, ID_COOKIE)) : null;
    if (sub) u = await getUserById(context.env.DB, sub).catch(() => null);
  }
  const auth = context.request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const isCron = !!context.env.CRON_SECRET && timingSafeEq(bearer, context.env.CRON_SECRET);
  const admin = context.env.ADMIN_EMAIL || DEFAULT_ADMIN;
  const isAdmin = !!u && (u.email || "").toLowerCase() === admin.toLowerCase();
  if (!isAdmin && !isCron) return u ? err403("Admins only") : err401();
  return { ok: true, admin, isCron };
}
