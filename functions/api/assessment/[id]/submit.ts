// POST /api/assessment/<id>/submit
// Grades server-side against D1, records the attempt, and returns the score,
// which questions were missed with the chapter to reread, and the standing.
// A token is single-use: submitting twice with the same token is a conflict.

import { json, err404, err409, err400, jsonError } from "../../../_lib/errors";
import { isOn } from "../../../_lib/flags";
import {
  gradeAttempt,
  standing,
  hasPriorAttempt,
  TOKEN_TTL_SECONDS,
  type AssessmentMeta,
} from "../../../_lib/assessments";
import META from "../../../_data/assessments.json";

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface Body {
  token?: string;
  answers?: Record<string, string[]>;
  signed_name?: string;
  duration_seconds?: number;
}

export const onRequestPost: PagesFunction<Env, "id", { user?: { id: string } }> = async (ctx) => {
  if (!(await isOn(ctx.env.KV, "assessments"))) return err404("Not available yet.");

  const id = String(ctx.params.id || "");
  const meta = (META as Record<string, AssessmentMeta>)[id];
  if (!meta) return err404("No such assessment.");

  let body: Body;
  try {
    body = (await ctx.request.json()) as Body;
  } catch {
    return err400("Malformed request.");
  }
  const token = String(body.token || "");
  if (!token) return err400("Missing attempt token.");

  const attempt = await ctx.env.DB.prepare(
    `SELECT id, assessment_id, user_id, served_json, submitted_at, started_at
       FROM assessment_attempts WHERE id = ?`,
  )
    .bind(token)
    .first<{
      id: string; assessment_id: string; user_id: string | null;
      served_json: string; submitted_at: number | null; started_at: number;
    }>();

  if (!attempt || attempt.assessment_id !== id) return err404("Unknown attempt.");
  if (attempt.submitted_at) return err409("This attempt was already submitted.");

  const now = Math.floor(Date.now() / 1000);
  if (now - attempt.started_at > TOKEN_TTL_SECONDS) {
    return jsonError(410, "attempt_expired", "This attempt expired. Start it again when you are ready.");
  }

  const servedIds = JSON.parse(attempt.served_json) as string[];
  const result = await gradeAttempt(ctx.env.DB, servedIds, body.answers || {});

  // The attempt's owner is whoever started it; if they signed in mid-quiz we
  // take the current user so the result is not orphaned.
  const userId = attempt.user_id || ctx.data?.user?.id || null;
  const isFirst = userId ? !(await hasPriorAttempt(ctx.env.DB, id, userId)) : false;

  await ctx.env.DB.prepare(
    `UPDATE assessment_attempts
        SET user_id = ?, signed_name = ?, answers_json = ?, score = ?,
            passed = ?, first_attempt = ?, duration_seconds = ?, submitted_at = ?
      WHERE id = ?`,
  )
    .bind(
      userId,
      (body.signed_name || "").slice(0, 120) || null,
      JSON.stringify(body.answers || {}),
      result.score,
      result.passed ? 1 : 0,
      isFirst ? 1 : 0,
      Math.max(0, Math.min(86400, Number(body.duration_seconds) || 0)),
      now,
      token,
    )
    .run();

  const stand = await standing(ctx.env.DB, ctx.env.KV, id, result.score);

  // Certificate eligibility is decided here but minted by /api/cert/mint,
  // which owns Pro entitlement. Section 1 is free for everyone signed in.
  const certificate = {
    eligible: result.passed && !!userId,
    free: meta.free_certificate,
    needs_sign_in: result.passed && !userId,
  };

  return json({
    score: result.score,
    total: result.total,
    passed: result.passed,
    questions: result.questions,
    standing: stand,
    certificate,
  });
};
