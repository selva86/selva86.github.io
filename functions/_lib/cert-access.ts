// Who may claim which certificate. One place, used by /api/cert/mint (the gate)
// and /api/me/tracks (what the UI offers), so a Claim button is only ever shown
// for a certificate the mint will actually issue.
//
// Rules (owner decisions 2026-10-05):
//   - A track that is still being published (track.open false) is never claimable.
//   - A free track (New to R) is claimable without Pro while the launch switch
//     flag:free-foundations-cert is on.
//   - Every other certificate needs a paid plan whose scope covers the track:
//     All-Access, Lifetime and team seats cover all; Single Track covers its
//     own track plus the core (scopeCovers). A Data Analyst trial pass is not
//     a paid plan, so it opens DA lessons but not the DA certificate.

import type { User } from "./db";
import { resolvePro, resolveScope, scopeCovers } from "./entitlement";
import type { Track } from "./tracks";

export interface CertAccess {
  pro: boolean;
  scope: string;      // "0" (no paid plan), "all", or a Single Track key
  freeFlag: boolean;  // flag:free-foundations-cert
}

export type ClaimBlock = "closed" | "needs_pro" | "needs_track";

export async function certAccess(
  env: { DB: D1Database; KV: KVNamespace },
  user: User,
): Promise<CertAccess> {
  const ent = await resolvePro(env.DB, user);
  const scope = ent.pro ? await resolveScope(env, user) : "0";
  const freeFlag = (await env.KV.get("flag:free-foundations-cert").catch(() => null)) === "on";
  return { pro: ent.pro, scope, freeFlag };
}

// Whether this user's plan lets them claim the track (eligibility is separate).
export function claimBlock(access: CertAccess, track: Track): ClaimBlock | null {
  if (!track.open) return "closed";
  if (track.free && access.freeFlag) return null;
  if (!access.pro) return "needs_pro";
  if (!scopeCovers(access.scope, track.roadmap_track || "any")) return "needs_track";
  return null;
}
