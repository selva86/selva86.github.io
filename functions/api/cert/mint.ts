// POST /api/cert/mint
//
// Mints a certificate for an eligible track. Idempotent: a second call for
// the same (user, track) returns the existing public_id with newly_minted=false.
//
// Body: { track_id: string }
// Response: {
//   public_id, verify_url, issued_at, recipient_name, track_name, newly_minted
// }
//
// Gates (in order):
//   1. Auth (Bearer JWT)
//   2. Pro tier OR KV flag `flag:cert_free` == 'on' (early-launch escape)
//   3. Track exists in the manifest
//   4. User is eligible (solved >= threshold * total_exercises)
//
// On a newly-minted cert: +200 XP via xp_ledger (action='cert.earned') and
// users.total_xp bumped. The endpoint also surfaces `xp_awarded_now` so the
// avatar dropdown can refresh without an extra /api/me/stats call.

import type { Env, RequestData } from "../../_middleware";
import { json, err401, jsonError } from "../../_lib/errors";
import { isProActive, getSolvedByHub, mintCertificate, getStats } from "../../_lib/db";
import {
  getTrack, computeTrackProgress, generatePublicId, getIssuer,
} from "../../_lib/tracks";
import { sendCertificateEmail } from "../../_lib/email";

async function isCertFreeFlag(kv: KVNamespace): Promise<boolean> {
  try {
    const v = await kv.get("flag:cert_free");
    return v === "on";
  } catch {
    return false;
  }
}

function newRowId(): string {
  // 16 hex chars; row PK separate from public_id for back-compat with
  // existing schema. Not user-visible.
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<Env, string, RequestData> = async (context) => {
  const u = context.data.user;
  if (!u) return err401();

  let body: { track_id?: unknown };
  try {
    body = await context.request.json();
  } catch {
    return jsonError(400, "bad_body", "Invalid JSON body");
  }
  const trackId = typeof body.track_id === "string" ? body.track_id : "";
  if (!trackId) return jsonError(400, "bad_body", "track_id required");

  const track = getTrack(trackId);
  if (!track) return jsonError(400, "unknown_track", "Unknown track");

  // Pro gate (with KV flag escape for early launch).
  const isPro = isProActive(u);
  if (!isPro) {
    const freeAllowed = await isCertFreeFlag(context.env.KV);
    if (!freeAllowed) {
      return jsonError(
        403, "pro_required",
        "Certificate minting requires a Pro subscription.",
      );
    }
  }

  // Eligibility check.
  const solvedByHub = await getSolvedByHub(context.env.DB, u.id);
  const progress = computeTrackProgress(track, solvedByHub);
  if (!progress.eligible) {
    return jsonError(
      400, "not_eligible",
      `Need ${Math.ceil(track.threshold * 100)}% of exercises in this track. ` +
      `Currently ${progress.solved} of ${track.total_exercises}.`,
    );
  }

  // Snapshot fields for the cert row.
  const recipientName = u.display_name || (u.email ? u.email.split("@")[0] : "Learner");
  const evidence = track.hubs.map(h => h.url);
  const publicId = generatePublicId();
  const rowId = newRowId();

  const { cert, newly_minted } = await mintCertificate(context.env.DB, {
    userId: u.id,
    trackId: track.id,
    trackName: track.name,
    recipientName,
    skills: track.skills,
    evidence,
    publicId,
    rowId,
    xpAward: track.xp_award,
  });

  const stats = await getStats(context.env.DB, u.id);
  const origin = new URL(context.request.url).origin;
  const verifyUrl = `${origin}/cert/${cert.public_id}`;

  // Fire-and-forget email send on newly-minted certs. context.waitUntil keeps
  // the Worker alive after we've returned to the client so the mint response
  // isn't gated on ZeptoMail latency. On success, mark email_sent_at so the
  // dashboard / future cron can tell which certs need a retry.
  if (newly_minted && u.email && cert.public_id) {
    context.waitUntil(
      (async () => {
        try {
          const result = await sendCertificateEmail(context.env, {
            to: { email: u.email, name: cert.recipient_name || u.email },
            trackName: cert.track_name || track.name,
            verifyUrl,
            publicId: cert.public_id as string,
          });
          if (result.ok) {
            await context.env.DB
              .prepare("UPDATE certificates SET email_sent_at = ? WHERE id = ?")
              .bind(Math.floor(Date.now() / 1000), cert.id)
              .run();
          }
        } catch (e) {
          console.warn("[cert.mint] background email failed:", (e as Error).message);
        }
      })(),
    );
  }

  return json({
    public_id: cert.public_id,
    verify_url: verifyUrl,
    issued_at: cert.issued_at,
    recipient_name: cert.recipient_name,
    track_name: cert.track_name,
    issuer: getIssuer().name,
    newly_minted,
    xp_awarded_now: newly_minted ? track.xp_award : 0,
    total_xp: stats.total_xp,
    current_streak_days: stats.current_streak_days,
    longest_streak_days: stats.longest_streak_days,
  });
};
