// GET/PUT/DELETE /api/admin/seq-plan - the daily sequence's send order and
// per-email on/off switches, edited from the email dashboard. Stored in KV
// "seq-plan"; absent = registry order, everything on. The brain resolves the
// same plan at the top of every daily run, so saves apply on the next send.
// Admin-gated the same way as /api/admin/email-copy.

import type { Env, RequestData } from "../../_middleware";
import { json, jsonError } from "../../_lib/errors";
import { SEQ_ITEMS, seqSendable, getSeqPlan, type SeqPlanEntry } from "../../_lib/nurture";

const DEFAULT_ADMIN = "selva86@gmail.com";

function isAdmin(context: { data: RequestData; env: unknown }): boolean {
  const u = context.data.user;
  const admin = (context.env as { ADMIN_EMAIL?: string }).ADMIN_EMAIL || DEFAULT_ADMIN;
  return !!u && (u.email || "").toLowerCase() === admin.toLowerCase();
}

function planView(plan: SeqPlanEntry[]) {
  const courseLessons: Record<string, number> = {};
  for (const k of Object.keys(SEQ_ITEMS)) {
    const it = SEQ_ITEMS[Number(k)];
    if (it.kind === "lesson" && it.course) courseLessons[it.course] = (courseLessons[it.course] || 0) + 1;
  }
  return plan.map((p) => {
    const it = SEQ_ITEMS[p.seq];
    return {
      seq: p.seq,
      enabled: p.enabled,
      kind: it?.kind || "",
      subject: it?.subject || "",
      slug: it?.slug || null,
      course: it?.course || null,
      course_lessons: it?.course ? (courseLessons[it.course] || 0) : 0,
      sendable: seqSendable(p.seq),
    };
  });
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  if (!isAdmin(context)) return jsonError(403, "forbidden", "Admin only");
  const plan = await getSeqPlan(context.env.KV);
  const custom = !!(await context.env.KV.get("seq-plan"));
  return json({ custom, plan: planView(plan) });
};

export const onRequestPut: PagesFunction<Env, string, RequestData> = async (context) => {
  if (!isAdmin(context)) return jsonError(403, "forbidden", "Admin only");
  let body: { plan?: Array<{ seq?: unknown; enabled?: unknown }> };
  try {
    body = await context.request.json();
  } catch {
    return jsonError(400, "bad_body", "Invalid JSON body");
  }
  const arr = body && body.plan;
  if (!Array.isArray(arr) || !arr.length) return jsonError(400, "bad_plan", "plan must be a non-empty array");
  const known = new Set(Object.keys(SEQ_ITEMS).map(Number));
  const seen = new Set<number>();
  const clean: SeqPlanEntry[] = [];
  for (const p of arr) {
    const n = Number(p && p.seq);
    if (!known.has(n)) return jsonError(400, "bad_plan", "Unknown seq " + String(p && p.seq));
    if (seen.has(n)) return jsonError(400, "bad_plan", "Duplicate seq " + n);
    seen.add(n);
    clean.push({ seq: n, enabled: p.enabled !== false });
  }
  for (const n of [...known].sort((a, b) => a - b)) if (!seen.has(n)) clean.push({ seq: n, enabled: true });
  await context.env.KV.put("seq-plan", JSON.stringify(clean));
  return json({ ok: true, custom: true, plan: planView(clean) });
};

export const onRequestDelete: PagesFunction<Env, string, RequestData> = async (context) => {
  if (!isAdmin(context)) return jsonError(403, "forbidden", "Admin only");
  await context.env.KV.delete("seq-plan");
  const plan = await getSeqPlan(context.env.KV);
  return json({ ok: true, custom: false, plan: planView(plan) });
};
