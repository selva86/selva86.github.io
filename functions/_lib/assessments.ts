// Section assessments: bank access, server-side grading, percentile, cooldown.
//
// The single rule this file exists to enforce: a correct answer never leaves
// the server. `serveQuestions` strips `answer_json`; `gradeAttempt` is the only
// place answers are read, and it reads them from D1 rather than from anything
// the client sent.

export const QUESTIONS_PER_ATTEMPT = 12;
export const PASS_FRACTION = 0.75;          // 9 of 12
export const COOLDOWN_HOURS = 24;
export const MIN_ATTEMPTS_FOR_PERCENTILE = 50;
export const TOKEN_TTL_SECONDS = 3 * 60 * 60;

export interface ServedQuestion {
  id: string;
  kind: "single" | "multi" | "output";
  prompt: string;
  code: string | null;
  options: { key: string; text: string }[];
  pick: number;                              // how many to choose
}

export interface AssessmentMeta {
  id: string;                                // ts-1, stats-4
  book: string;                              // time-series | statistics
  section: number;
  title: string;
  book_title: string;
  chapters: number;
  free_certificate: boolean;                 // section 1 only
}

/** Deterministic shuffle from a seed so a re-served attempt is stable. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function newToken(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

/**
 * Pick QUESTIONS_PER_ATTEMPT questions and return them WITHOUT answers.
 * The token seeds the shuffle so the same token always yields the same set,
 * which makes a mid-quiz refresh safe.
 */
export async function serveQuestions(
  db: D1Database,
  assessmentId: string,
  token: string,
): Promise<ServedQuestion[]> {
  const rs = await db
    .prepare(
      `SELECT id, kind, prompt, code, options_json, answer_json
         FROM assessment_questions
        WHERE assessment_id = ? AND active = 1`,
    )
    .bind(assessmentId)
    .all<{ id: string; kind: string; prompt: string; code: string | null; options_json: string; answer_json: string }>();

  const pool = rs.results || [];
  const picked = seededShuffle(pool, token).slice(0, QUESTIONS_PER_ATTEMPT);

  return picked.map((q) => {
    const opts = JSON.parse(q.options_json) as { key: string; text: string }[];
    const answers = JSON.parse(q.answer_json) as string[];
    return {
      id: q.id,
      kind: q.kind as ServedQuestion["kind"],
      prompt: q.prompt,
      code: q.code,
      // Options are shuffled per attempt too, so screenshots of "the answer is C"
      // are worthless.
      options: seededShuffle(opts, token + q.id),
      pick: answers.length,
    };
  });
}

export interface GradedQuestion {
  id: string;
  correct: boolean;
  chapter_slug: string;
  chapter_title: string;
  prompt: string;
  /** Populated only when the attempt passed - see I1 in the build plan. */
  answer?: string[];
  why?: string | null;
}

export interface GradeResult {
  score: number;
  total: number;
  passed: boolean;
  questions: GradedQuestion[];
}

/**
 * Grade against D1, never against anything the client supplied beyond its
 * chosen option keys. Missing or malformed answers count as wrong rather
 * than throwing, so a truncated submission still produces an honest score.
 */
export async function gradeAttempt(
  db: D1Database,
  servedIds: string[],
  submitted: Record<string, string[]>,
): Promise<GradeResult> {
  if (!servedIds.length) return { score: 0, total: 0, passed: false, questions: [] };

  const placeholders = servedIds.map(() => "?").join(",");
  const rs = await db
    .prepare(
      `SELECT id, prompt, answer_json, why, chapter_slug, chapter_title
         FROM assessment_questions WHERE id IN (${placeholders})`,
    )
    .bind(...servedIds)
    .all<{ id: string; prompt: string; answer_json: string; why: string | null; chapter_slug: string; chapter_title: string }>();

  const byId = new Map((rs.results || []).map((r) => [r.id, r]));
  const questions: GradedQuestion[] = [];
  let score = 0;

  for (const qid of servedIds) {
    const row = byId.get(qid);
    if (!row) continue;
    const expected = (JSON.parse(row.answer_json) as string[]).slice().sort();
    const given = Array.isArray(submitted[qid]) ? submitted[qid].slice().sort() : [];
    const correct =
      expected.length === given.length && expected.every((v, i) => v === given[i]);
    if (correct) score++;
    questions.push({
      id: qid,
      correct,
      prompt: row.prompt,
      chapter_slug: row.chapter_slug,
      chapter_title: row.chapter_title,
    });
  }

  const total = questions.length;
  const passed = total > 0 && score / total >= PASS_FRACTION;

  // Reveal the key only on a pass, so a failed attempt cannot be mined for
  // answers before the retake.
  if (passed) {
    for (const q of questions) {
      const row = byId.get(q.id);
      if (row) {
        q.answer = JSON.parse(row.answer_json) as string[];
        q.why = row.why;
      }
    }
  }

  return { score, total, passed, questions };
}

/** Seconds remaining before this user may retake, or 0 if they may now. */
export async function cooldownRemaining(
  db: D1Database,
  assessmentId: string,
  userId: string | null,
  nowSec: number,
): Promise<number> {
  if (!userId) return 0;
  const row = await db
    .prepare(
      `SELECT submitted_at FROM assessment_attempts
        WHERE assessment_id = ? AND user_id = ? AND submitted_at IS NOT NULL
        ORDER BY submitted_at DESC LIMIT 1`,
    )
    .bind(assessmentId, userId)
    .first<{ submitted_at: number }>();
  if (!row) return 0;
  const elapsed = nowSec - row.submitted_at;
  const window = COOLDOWN_HOURS * 3600;
  return elapsed >= window ? 0 : window - elapsed;
}

export async function hasPriorAttempt(
  db: D1Database,
  assessmentId: string,
  userId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS x FROM assessment_attempts
        WHERE assessment_id = ? AND user_id = ? AND submitted_at IS NOT NULL LIMIT 1`,
    )
    .bind(assessmentId, userId)
    .first<{ x: number }>();
  return !!row;
}

export interface Standing {
  percentile: number | null;   // null until the sample is real
  sample: number;
}

/**
 * Standing against FIRST attempts by signed-in users only, so retakes and
 * anonymous traffic cannot move the distribution. Below
 * MIN_ATTEMPTS_FOR_PERCENTILE we return null and say how many there are;
 * we never invent a number.
 */
export async function standing(
  db: D1Database,
  kv: KVNamespace,
  assessmentId: string,
  score: number,
): Promise<Standing> {
  const cacheKey = `astats:${assessmentId}`;
  let scores: number[] | null = null;

  const cached = await kv.get(cacheKey, "json").catch(() => null);
  if (cached && Array.isArray((cached as { s?: number[] }).s)) {
    scores = (cached as { s: number[] }).s;
  } else {
    const rs = await db
      .prepare(
        `SELECT score FROM assessment_attempts
          WHERE assessment_id = ? AND first_attempt = 1
            AND user_id IS NOT NULL AND submitted_at IS NOT NULL`,
      )
      .bind(assessmentId)
      .all<{ score: number }>();
    scores = (rs.results || []).map((r) => r.score);
    await kv
      .put(cacheKey, JSON.stringify({ s: scores }), { expirationTtl: 600 })
      .catch(() => {});
  }

  const sample = scores.length;
  if (sample < MIN_ATTEMPTS_FOR_PERCENTILE) return { percentile: null, sample };

  const below = scores.filter((s) => s < score).length;
  return { percentile: Math.round((below / sample) * 100), sample };
}
