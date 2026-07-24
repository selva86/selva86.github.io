// GET /api/recap/unsub?t=<token> - one-click weekly-recap unsubscribe.
// The token was minted at send time and maps to the user in KV; no auth
// needed, nothing sensitive revealed, idempotent.

import type { Env, RequestData } from "../../_middleware";
import { ensureProfileColumns } from "../../_lib/profile";

const PAGE = (msg: string) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Weekly recap &middot; r-statistics.co</title>
<style>body{font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#f7f7f5;color:#16181d;display:flex;align-items:center;justify-content:center;min-height:90vh;margin:0}
.card{background:#fff;border:1px solid #e6e8ee;border-radius:14px;padding:30px 34px;max-width:440px;text-align:center}
a{color:#2056d2;text-decoration:none}</style></head>
<body><div class="card"><p style="font-size:17px;font-weight:600;margin:0 0 10px">${msg}</p>
<p style="color:#667085;font-size:14px">You can keep using r-statistics.co exactly as before.</p>
<a href="/">Back to r-statistics.co &rarr;</a></div></body></html>`;

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const t = new URL(context.request.url).searchParams.get("t") || "";
  const headers = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" };
  if (!/^[a-f0-9]{24,48}$/.test(t)) {
    return new Response(PAGE("That unsubscribe link is not valid."), { status: 400, headers });
  }
  try {
    const uid = await context.env.KV.get(`recap-unsub:${t}`);
    if (!uid) {
      return new Response(PAGE("That unsubscribe link has expired. Reply to any recap email and we will remove you by hand."), { status: 410, headers });
    }
    await ensureProfileColumns(context.env.DB);
    await context.env.DB.prepare(
      "UPDATE users SET recap_opt_out = 1 WHERE id = ?1"
    ).bind(uid).run();
    return new Response(PAGE("Done. No more weekly recap emails."), { status: 200, headers });
  } catch {
    return new Response(PAGE("Something went wrong on our side. Reply to any recap email and we will remove you by hand."), { status: 500, headers });
  }
};
