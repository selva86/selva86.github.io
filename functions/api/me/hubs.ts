// GET /api/me/hubs
//
// One row per hub the reader has touched: how far in they are, which section
// they stopped in, and what the next unsolved problem is called. This is the
// sentence the dashboard's "In flight" list is built from, and it is the one
// thing a dashboard can say that nothing else on the site says: what were you
// doing, and where do you pick it up.
//
// The studio's left rail reads the same response for its per-hub counts, so
// the shape carries both: `done` and `total` for the rail, `next` for the
// dashboard.
//
// Two queries, both bounded. The first groups the whole attempt table by hub,
// which is one row per hub touched. The second fetches the solved ids for the
// handful of hubs that are still in progress, because working out "the next
// unsolved problem" needs the ids and nothing else does. Hubs already
// finished never reach that second query.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { hubOutline, problemNumber } from "../../_lib/badges-hub";

/* How many in-progress hubs get the expensive treatment. The dashboard shows
   six and links to the rest; twelve leaves room to sort and still be honest
   about which are most recent. */
const DETAIL_LIMIT = 12;

interface HubRow {
  done: number;
  total: number;
  sections: number;
  last_at: number;
  next?: {
    id: string; num: string | null; title: string;
    section: number; section_title: string;
    section_done: number; section_total: number;
    last_section: boolean;
  } | null;
}

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();
  const DB = context.env.DB;

  const out: Record<string, HubRow> = {};
  try {
    const rows = (await DB.prepare(
      `SELECT hub_slug,
              COUNT(DISTINCT exercise_id) AS n,
              MAX(submitted_at) AS last_at
         FROM exercise_attempts
        WHERE user_id = ?1 AND passed = 1
        GROUP BY hub_slug`,
    ).bind(u.id).all<{ hub_slug: string; n: number; last_at: number }>()).results ?? [];

    for (const r of rows) {
      if (!r.hub_slug) continue;
      const o = hubOutline(r.hub_slug);
      out[r.hub_slug] = {
        done: Math.min(o.ids.length || Number(r.n || 0), Number(r.n || 0)),
        total: o.ids.length,
        sections: o.sections,
        last_at: Number(r.last_at || 0),
        next: null,
      };
    }

    // the in-progress ones, most recent first
    const open = Object.keys(out)
      .filter((slug) => out[slug].total > 0 && out[slug].done < out[slug].total)
      .sort((a, b) => out[b].last_at - out[a].last_at)
      .slice(0, DETAIL_LIMIT);

    if (open.length) {
      const marks = open.map(() => "?").join(",");
      const solved = (await DB.prepare(
        `SELECT hub_slug, exercise_id FROM exercise_attempts
          WHERE user_id = ? AND passed = 1 AND hub_slug IN (${marks})`,
      ).bind(u.id, ...open).all<{ hub_slug: string; exercise_id: string }>()).results ?? [];

      const done: Record<string, Set<string>> = {};
      for (const r of solved) {
        (done[r.hub_slug] || (done[r.hub_slug] = new Set())).add(r.exercise_id);
      }
      for (const slug of open) {
        const o = hubOutline(slug);
        const seen = done[slug] || new Set<string>();
        const id = o.ids.find((x) => !seen.has(x));
        if (!id) continue;
        /* The section the reader is standing in, counted. "Two more clears
           the section" is the only sentence on the dashboard with a number a
           reader can close in one sitting, so it has to be exact. */
        const sec = o.sectionOf[id] || 0;
        const inSec = o.ids.filter((x) => (o.sectionOf[x] || 0) === sec);
        let secDone = 0;
        for (const x of inSec) if (seen.has(x)) secDone++;
        out[slug].next = {
          id,
          num: problemNumber(id),
          title: o.titleOf[id] || "",
          section: sec,
          section_title: o.sectionTitle[sec] || "",
          section_done: secDone,
          section_total: inSec.length,
          last_section: sec > 0 && sec === o.sections,
        };
      }
    }
  } catch {
    /* The rail is a navigation aid before it is a scoreboard, and the
       dashboard has other things to show. An empty map degrades to hub
       counts of zero rather than failing the page. */
  }

  return json({ hubs: out });
};
