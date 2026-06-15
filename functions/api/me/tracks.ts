// GET /api/me/tracks
//
// Returns the current user's progress across every certification track:
//   {
//     tracks: [{
//       id, name, tagline, color_primary, color_accent, icon, skills,
//       threshold, total_exercises, solved, pct, eligible,
//       minted: { public_id, verify_url, issued_at } | null
//     }, ...]
//   }
//
// Powers:
//   - /account-certificates.html (progress bars + claim buttons)
//   - exercise-hub.js post-completion claim CTA
//   - The future dashboard
//
// One D1 query (getSolvedByHub) covers all 5 tracks; eligibility is computed
// in pure JS from the resulting Map. listCertificates is a second query.

import type { Env, RequestData } from "../../_middleware";
import { json, err401 } from "../../_lib/errors";
import { getSolvedByHub, listCertificates } from "../../_lib/db";
import { getAllTracks, computeTrackProgress } from "../../_lib/tracks";

export const onRequestGet: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  const [solvedByHub, certs] = await Promise.all([
    getSolvedByHub(context.env.DB, u.id),
    listCertificates(context.env.DB, u.id),
  ]);
  const mintedByTrack = new Map<string, { public_id: string | null; issued_at: number }>();
  for (const c of certs) {
    mintedByTrack.set(c.track, { public_id: c.public_id, issued_at: c.issued_at });
  }

  const origin = new URL(context.request.url).origin;
  const tracks = getAllTracks().map(t => {
    const p = computeTrackProgress(t, solvedByHub);
    const minted = mintedByTrack.get(t.id);
    return {
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      color_primary: t.color_primary,
      color_accent: t.color_accent,
      icon: t.icon,
      skills: t.skills,
      threshold: t.threshold,
      total_exercises: t.total_exercises,
      solved: p.solved,
      pct: p.pct,
      eligible: p.eligible,
      minted: minted && minted.public_id ? {
        public_id: minted.public_id,
        verify_url: `${origin}/cert/${minted.public_id}`,
        issued_at: minted.issued_at,
      } : null,
    };
  });

  // True total of solved exercises across ALL hubs (not just the 5 cert
  // tracks) — the dashboard's "Exercises solved" stat. solvedByHub is already
  // loaded, so this is free.
  let total_solved = 0;
  for (const ids of solvedByHub.values()) total_solved += ids.size;

  return json({ tracks, total_solved });
};
