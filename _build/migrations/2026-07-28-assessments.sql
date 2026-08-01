-- Assessment tables migration (additive only)

-- Question banks live here, never in the browser. The API serves questions
-- without their answers and grades server-side.
CREATE TABLE IF NOT EXISTS assessment_questions (
  id            TEXT PRIMARY KEY,        -- <assessment_id>:<n>, e.g. ts-1:07
  assessment_id TEXT NOT NULL,           -- ts-1, stats-4, ...
  kind          TEXT NOT NULL,           -- single | multi | output
  prompt        TEXT NOT NULL,
  code          TEXT,                    -- optional R block shown above options
  options_json  TEXT NOT NULL,           -- [{key,text}, ...] order randomised at serve
  answer_json   TEXT NOT NULL,           -- ["b"] or ["a","c"] - NEVER sent to client
  why           TEXT,                    -- shown only after a pass
  chapter_slug  TEXT NOT NULL,           -- where to reread
  chapter_title TEXT NOT NULL,
  difficulty    TEXT,                    -- intermediate | hard
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_aq_assessment ON assessment_questions(assessment_id, active);

-- One row per submitted attempt. first_attempt drives the percentile so
-- retakes cannot inflate the distribution.
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id            TEXT PRIMARY KEY,        -- attempt token (also the replay guard)
  assessment_id TEXT NOT NULL,
  user_id       TEXT,                    -- NULL for anonymous takers
  signed_name   TEXT,                    -- honour-code signature, audit trail
  served_json   TEXT NOT NULL,           -- question ids served, in order
  answers_json  TEXT,                    -- what they submitted
  score         INTEGER,
  total         INTEGER NOT NULL,
  passed        INTEGER,
  first_attempt INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  started_at    INTEGER NOT NULL,
  submitted_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_aa_dist ON assessment_attempts(assessment_id, first_attempt, submitted_at);
CREATE INDEX IF NOT EXISTS idx_aa_user ON assessment_attempts(user_id, assessment_id, submitted_at);
