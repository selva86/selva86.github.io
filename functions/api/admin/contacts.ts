// GET /api/admin/contacts - the contact centre.
//
//   (default)        everything the page needs in one response: every person
//                    (the All tab), the queue (Needs action), the threads
//                    (Contacted) and the counts for the tab labels.
//   ?view=insights   which sign-up doors produce buyers, what each buyer did
//                    before buying, and how each outreach email performs.
//
// The logic lives in functions/_lib/contacts.ts so the daily digest reads the
// same queue the page shows.
//
// WHY ONE RESPONSE. 1,200 people is about 400 KB of JSON and about 40k rows
// read. Tab switches then cost nothing, and the queue, the threads and the
// list are guaranteed to describe the same moment.
//
// WHY EVERY ROW CARRIES ITS EVIDENCE. A dozen purchases cannot validate a
// scoring model, so each row reports the three components behind its score
// and the page shows them. The score is a way to sort a list, not a forecast.
//
// EXCLUDED ON PURPOSE: badges, certificates and quiz attempts are not scored.
// All three had zero rows in production when this was written.

import type { Env, RequestData } from "../../_middleware";
import { json } from "../../_lib/errors";
import { requireAdmin } from "../../_lib/admin-auth";
import { loadContacts, loadThreads, buildQueue, buildInsights, gateLabel } from "../../_lib/contacts";
import { OUTREACH } from "../../_lib/outreach-copy";

export const onRequestGet: PagesFunction<Env & { CRON_SECRET?: string; ADMIN_EMAIL?: string }, string, RequestData> = async (context) => {
  const gate = await requireAdmin(context);
  if (gate instanceof Response) return gate;

  const DB = context.env.DB;
  const url = new URL(context.request.url);
  const L = await loadContacts(DB);
  const threads = await loadThreads(DB, L);

  if (url.searchParams.get("view") === "insights") {
    const ins = await buildInsights(DB, L, threads);
    return json({
      now: L.now,
      doors: ins.doors.map((d) => ({ ...d, label: gateLabel(d.gate || null) })),
      slugs: ins.slugs,
      stories: ins.stories,
      outreach: ins.outreach,
      purchases: ins.stories.length,
      recorded: ins.recorded, total: ins.total,
    });
  }

  const queue = await buildQueue(DB, L, threads);
  const counts: Record<string, number> = {};
  for (const r of L.rows) counts[r.state] = (counts[r.state] || 0) + 1;

  return json({
    now: L.now,
    total: L.rows.length,
    counts,
    rows: L.rows,
    queue,
    threads,
    templates: OUTREACH.map((t) => ({ key: t.key, label: t.label, group: t.group })),
    tabs: {
      queue: queue.length,
      contacted: new Set(threads.map((t) => t.user_id)).size,
      follow_up: threads.filter((t) => t.next === "follow_up").length,
      all: L.rows.length,
    },
    // Stated in the payload so the page can say it rather than imply precision
    // the data cannot support.
    caveat: {
      purchases: L.rows.filter((r) => r.purchased_at).length,
      note: "The score orders a list; it is not a prediction. With this few purchases no model can be validated, so every row carries the components behind its score.",
      excluded: "badges, certificates and quiz attempts are not scored",
    },
  });
};
