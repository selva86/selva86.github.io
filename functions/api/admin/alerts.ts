// GET  /api/admin/alerts            open operational alerts, newest first
// GET  /api/admin/alerts?all=1      include ones already dealt with
// POST /api/admin/alerts            { "resolve": <id> } marks one dealt with
//
// The reason this endpoint exists at all: an alert that is only an email is
// gone the moment the email is deleted, and warn-level alerts are never
// emailed by design. ops_alerts is the durable half, and without somewhere to
// read it the durable half is as invisible as the console output it replaced.
//
// Admin-gated exactly as /api/admin/digest is, cookie fallback included, so
// that typing the URL in a signed-in browser works rather than demanding a
// hand-set Authorization header.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, err403, jsonError } from "../../_lib/errors";
import { getUserById } from "../../_lib/db";
import { readCookie, verifyIdCookie, ID_COOKIE } from "../../_lib/idcookie";
import { openAlerts, resolveAlert } from "../../_lib/ops-alert";

const DEFAULT_ADMIN = "selva86@gmail.com";

async function requireAdmin(context: {
  data: RequestData; env: Env; request: Request;
}): Promise<Response | null> {
  let u = context.data.user;
  if (!u) {
    const secret = (context.env as { EDGE_ID_SECRET?: string }).EDGE_ID_SECRET || "";
    const sub = secret ? await verifyIdCookie(secret, readCookie(context.request, ID_COOKIE)) : null;
    if (sub) u = await getUserById(context.env.DB, sub).catch(() => null);
  }
  if (!u) return err401();
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  if ((u.email || "").toLowerCase() !== admin.toLowerCase()) return err403("Admins only");
  return null;
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  const rows = await openAlerts(context.env.DB, 200);
  return json({
    open: rows.length,
    /* detail_json is stored as the same key/value pairs the email shows, so
       the two tell the identical story and neither has to be reconciled
       against the other. */
    alerts: rows.map((r) => ({
      id: r.id, kind: r.kind, severity: r.severity, summary: r.summary,
      ref: r.ref, at: r.at,
      detail: (() => { try { return JSON.parse(r.detail_json || "[]"); } catch { return []; } })(),
    })),
  });
};

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const denied = await requireAdmin(context);
  if (denied) return denied;

  let id = 0;
  try { id = Number(((await context.request.json()) as { resolve?: number })?.resolve || 0); } catch { /* empty */ }
  if (!id) return jsonError(400, "bad_request", "Send { resolve: <alert id> }.");

  const ok = await resolveAlert(context.env.DB, id);
  /* Not an error when it does not change a row: the alert may already have
     been cleared, and a second click should not read as a failure. */
  return json({ resolved: ok, id });
};
