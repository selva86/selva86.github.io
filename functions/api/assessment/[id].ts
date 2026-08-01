// GET /api/assessment/<id>
// Starts an attempt: returns the section metadata and 12 questions WITHOUT
// their answers, plus a token that binds this question set to the eventual
// submission. Works signed out (score only, no standing, no certificate).

import { json, err404, err429, jsonError } from "../../_lib/errors";
import { isOn } from "../../_lib/flags";
import {
  serveQuestions,
  newToken,
  cooldownRemaining,
  QUESTIONS_PER_ATTEMPT,
  PASS_FRACTION,
  COOLDOWN_HOURS,
  type AssessmentMeta,
} from "../../_lib/assessments";
import META from "../../_data/assessments.json";

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env, "id", { user?: { id: string } }> = async (ctx) => {
  if (!(await isOn(ctx.env.KV, "assessments"))) return err404("Not available yet.");

  const id = String(ctx.params.id || "");
  const meta = (META as Record<string, AssessmentMeta>)[id];
  if (!meta) return err404("No such assessment.");

  const user = ctx.data?.user || null;
  const now = Math.floor(Date.now() / 1000);

  const wait = await cooldownRemaining(ctx.env.DB, id, user?.id || null, now);
  if (wait > 0) {
    return err429(
      `You can retake this in ${Math.ceil(wait / 3600)} hours. The wait is there so a retake means something.`,
    );
  }

  const token = newToken();
  const questions = await serveQuestions(ctx.env.DB, id, token);
  if (questions.length < QUESTIONS_PER_ATTEMPT) {
    return jsonError(503, "bank_incomplete", "This assessment is not ready yet.");
  }

  await ctx.env.DB.prepare(
    `INSERT INTO assessment_attempts
       (id, assessment_id, user_id, served_json, total, started_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(token, id, user?.id || null, JSON.stringify(questions.map((q) => q.id)), questions.length, now)
    .run();

  return json({
    token,
    meta,
    questions,
    pass_mark: Math.ceil(questions.length * PASS_FRACTION),
    total: questions.length,
    cooldown_hours: COOLDOWN_HOURS,
    signed_in: !!user,
  });
};
