-- r-statistics.co D1 schema. Apply with:
--   wrangler d1 execute r-stats-prod --remote --file schema.sql
--   wrangler d1 execute r-stats-dev  --remote --file schema.sql
-- Idempotent (uses IF NOT EXISTS). Safe to re-run after a column add.

-- ===== users (mirrored from Supabase Auth via webhook) =====
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,        -- Supabase UUID
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  handle        TEXT UNIQUE,             -- public profile slug
  country       TEXT,                    -- ISO-2 from CF-IPCountry at signup
  timezone      TEXT,                    -- IANA
  created_at    INTEGER NOT NULL,
  pro_until     INTEGER,                 -- unix ts; NULL=free; -1=lifetime
  paddle_customer_id   TEXT,
  razorpay_customer_id TEXT,
  newsletter_opt_in        INTEGER DEFAULT 0,
  newsletter_subscribed_at INTEGER,
  public_profile           INTEGER DEFAULT 1,
  total_xp                 INTEGER DEFAULT 0,
  current_streak_days      INTEGER DEFAULT 0,
  longest_streak_days      INTEGER DEFAULT 0,
  last_active_date         TEXT,         -- YYYY-MM-DD
  role          TEXT DEFAULT 'user',     -- 'user' | 'admin'
  deleted_at    INTEGER,                 -- GDPR soft-delete
  signup_gate   TEXT,                    -- 'exercise' | 'lesson' | 'browsing' | magnet id; set once, never overwritten
  signup_slug   TEXT,                    -- the page/hub/lesson that gated them
  pass_claimed_at INTEGER                -- DA pass claim-to-start moment (applied 2026-08-16 to dev+prod)
);
-- Existing-deploy migration for signup context (applied 2026-08-10 to dev+prod):
--   ALTER TABLE users ADD COLUMN signup_gate TEXT
--   ALTER TABLE users ADD COLUMN signup_slug TEXT
CREATE INDEX IF NOT EXISTS idx_users_pro_until ON users(pro_until);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
-- Existing-deploy migration for profiles (applied lazily by functions/_lib/profile.ts):
--   ALTER TABLE users ADD COLUMN handle TEXT
--   ALTER TABLE users ADD COLUMN public_profile INTEGER DEFAULT 1
CREATE INDEX IF NOT EXISTS idx_users_country   ON users(country);

-- ===== subscriptions (Paddle + Razorpay mirrored) =====
CREATE TABLE IF NOT EXISTS subscriptions (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL,           -- 'paddle' | 'razorpay'
  external_id   TEXT NOT NULL,
  user_id       TEXT NOT NULL REFERENCES users(id),
  plan          TEXT NOT NULL,           -- 'pro_monthly' | 'pro_annual' | 'lifetime' | 'teams'
  status        TEXT NOT NULL,           -- 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | 'paused'
  current_period_end INTEGER,
  trial_end     INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0,
  amount        INTEGER,                 -- cents
  currency      TEXT,
  created_at    INTEGER,
  updated_at    INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subs_external ON subscriptions(provider, external_id);

-- ===== reading progress =====
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id       TEXT NOT NULL,
  post_slug     TEXT NOT NULL,
  scroll_pct    INTEGER,
  last_section  TEXT,
  read_at       INTEGER,
  marked_read   INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, post_slug)
);
-- Index added 2026-05-27 (Phase 2). Supports /api/me/reading?kind=in_progress
-- ordered by read_at DESC. Existing deploys: apply manually with
--   wrangler d1 execute r-stats-prod --remote --command "CREATE INDEX IF NOT EXISTS idx_reading_user_read_at ON reading_progress(user_id, read_at DESC)"
CREATE INDEX IF NOT EXISTS idx_reading_user_read_at
  ON reading_progress(user_id, read_at DESC);

-- ===== saved posts =====
CREATE TABLE IF NOT EXISTS saved_posts (
  user_id   TEXT NOT NULL,
  post_slug TEXT NOT NULL,
  saved_at  INTEGER NOT NULL,
  PRIMARY KEY (user_id, post_slug)
);

-- ===== exercise submissions =====
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT NOT NULL,
  hub_slug     TEXT NOT NULL,
  exercise_id  TEXT NOT NULL,
  passed       INTEGER NOT NULL,
  hints_used   INTEGER DEFAULT 0,
  xp_awarded   INTEGER DEFAULT 0,
  submitted_at INTEGER NOT NULL,
  source       TEXT,                    -- NULL = live attempt; 'backfill' = anon-era solve banked at sign-in
  -- Stars (2026-09-20). Derived, never stored: solution_seen -> 0, else
  -- 3 - min(hints_used, 2). Existing deploys must apply:
  --   ALTER TABLE exercise_attempts ADD COLUMN solution_seen INTEGER DEFAULT 0
  -- Backfilled rows carry hints_used = 0 because nothing was tracked then, so
  -- they would read as a perfect run. They are unrated, not zero-starred.
  solution_seen INTEGER DEFAULT 0
);
-- Existing-deploy migration for the win-first taster (applied 2026-08-10 to dev+prod):
--   ALTER TABLE exercise_attempts ADD COLUMN source TEXT
-- Backfilled attempts are excluded from the practice meter (_lib/meter.ts), so the
-- anonymous taster is on the house: a fresh account still reads 25 of 25.
CREATE INDEX IF NOT EXISTS idx_attempts_user ON exercise_attempts(user_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_attempts_hub  ON exercise_attempts(hub_slug);
-- Partial UNIQUE index (Phase 3, 2026-05-28) is THE first-pass dedup guard.
-- Two tabs racing to record the same first-pass: the second INSERT fails the
-- unique constraint, recordAttempt() turns it into a no-op, XP is awarded
-- exactly once. SQLite/D1 supports partial indexes natively.
-- Existing deploys must apply manually (idempotent):
--   wrangler d1 execute r-stats-prod --remote --command \
--     "CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_first_pass \
--      ON exercise_attempts(user_id, hub_slug, exercise_id) WHERE passed = 1"
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_first_pass
  ON exercise_attempts(user_id, hub_slug, exercise_id)
  WHERE passed = 1;

-- ===== quiz / mastery assessments (audit-grade snapshot) =====
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL,
  track         TEXT NOT NULL,
  question_json TEXT NOT NULL,           -- full Q+A at time of attempt
  score         INTEGER NOT NULL,
  passed        INTEGER NOT NULL,
  duration_seconds INTEGER,
  submitted_at  INTEGER NOT NULL
);

-- ===== certificates =====
CREATE TABLE IF NOT EXISTS certificates (
  id          TEXT PRIMARY KEY,          -- public UUID for verify URL
  user_id     TEXT NOT NULL REFERENCES users(id),
  track       TEXT NOT NULL,
  score       INTEGER,
  issued_at   INTEGER NOT NULL,
  pdf_r2_key  TEXT,
  revoked_at  INTEGER,
  revoke_reason TEXT,
  -- Phase 5 additions (2026-05-28). Existing deploys must apply:
  --   ALTER TABLE certificates ADD COLUMN public_id      TEXT
  --   ALTER TABLE certificates ADD COLUMN track_name     TEXT
  --   ALTER TABLE certificates ADD COLUMN recipient_name TEXT
  --   ALTER TABLE certificates ADD COLUMN skills_json    TEXT
  --   ALTER TABLE certificates ADD COLUMN status         TEXT DEFAULT 'active'
  --   ALTER TABLE certificates ADD COLUMN email_sent_at  INTEGER
  --   ALTER TABLE certificates ADD COLUMN evidence_json  TEXT
  --   CREATE UNIQUE INDEX IF NOT EXISTS idx_certs_public_id ON certificates(public_id)
  --   CREATE UNIQUE INDEX IF NOT EXISTS idx_certs_user_track_active
  --     ON certificates(user_id, track) WHERE status != 'revoked'
  public_id        TEXT,              -- 'RST-2026-A7K3F9' user-visible ID
  track_name       TEXT,              -- snapshot of track display name at mint time
  recipient_name   TEXT,              -- snapshot of users.display_name at mint time
  skills_json      TEXT,              -- JSON array of skill tags from manifest snapshot
  status           TEXT DEFAULT 'active',  -- 'active' | 'unlisted' | 'revoked'
  email_sent_at    INTEGER,           -- timestamp when notification email was delivered
  evidence_json    TEXT               -- JSON array of hub URLs used as evidence
);
CREATE INDEX IF NOT EXISTS idx_certs_user ON certificates(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_certs_public_id ON certificates(public_id);
-- Partial UNIQUE keeps one ACTIVE/UNLISTED cert per (user, track). Revoked
-- rows don't block re-mint (admin revoke leaves room for a later re-issue).
CREATE UNIQUE INDEX IF NOT EXISTS idx_certs_user_track_active
  ON certificates(user_id, track) WHERE status != 'revoked';

-- ===== XP ledger (single source of truth) =====
CREATE TABLE IF NOT EXISTS xp_ledger (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action  TEXT NOT NULL,                 -- 'exercise.passed' | 'cert.earned' | 'streak.day' | 'post.upvote'
  ref     TEXT,
  xp      INTEGER NOT NULL,
  at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_xp_user_at ON xp_ledger(user_id, at);

-- ===== post engagement =====
CREATE TABLE IF NOT EXISTS post_stats (
  post_slug    TEXT PRIMARY KEY,
  upvotes      INTEGER DEFAULT 0,
  share_count  INTEGER DEFAULT 0,
  read_count   INTEGER DEFAULT 0,
  updated_at   INTEGER
);

CREATE TABLE IF NOT EXISTS post_votes (
  user_id    TEXT NOT NULL,
  post_slug  TEXT NOT NULL,
  voted_at   INTEGER NOT NULL,
  PRIMARY KEY (user_id, post_slug)
);

-- ===== newsletter (mirrored to Zoho) =====
CREATE TABLE IF NOT EXISTS newsletter_subs (
  email           TEXT PRIMARY KEY,
  user_id         TEXT,
  confirmed_at    INTEGER,
  unsubscribed_at INTEGER,
  source          TEXT,
  legacy_id       TEXT
);

-- ===== webhook idempotency + audit =====
CREATE TABLE IF NOT EXISTS webhook_events (
  id           TEXT PRIMARY KEY,          -- provider event id
  provider     TEXT NOT NULL,
  payload_json TEXT,
  processed_at INTEGER,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT,
  actor     TEXT,                         -- 'user' | 'admin' | 'system' | 'webhook'
  action    TEXT NOT NULL,
  ref       TEXT,
  meta_json TEXT,
  at        INTEGER NOT NULL
);

-- ===== sessions (for revoke + active-sessions UI) =====
-- session_id is pulled from Supabase Auth v2 JWT 'session_id' claim (NOT 'jti';
-- Supabase JWTs don't include jti). Worker handler writes this row on first hit
-- of a new session_id; revocation flips revoked_at AND adds to KV revoked:<id>.
-- ip column is intentionally NOT populated (privacy decision 2026-05-27); kept
-- for future use if a fraud/abuse case ever justifies it.
CREATE TABLE IF NOT EXISTS sessions (
  session_id   TEXT PRIMARY KEY,         -- from JWT.session_id (Supabase Auth v2)
  user_id      TEXT NOT NULL,
  device       TEXT,                     -- UA-derived label like 'Chrome on Mac'
  ip           TEXT,                     -- NOT populated; kept for schema stability
  user_agent   TEXT,                     -- full UA string (for fallback if device parse fails)
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  revoked_at   INTEGER,
  last_seen_at INTEGER                   -- updated on every authenticated request (with 60s throttle)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Existing-deploy migration: add last_seen_at column if missing (SQLite ALTER).
-- Wrangler d1 execute will error on duplicate-column when re-run; that's
-- harmless after the first apply.
-- (Apply manually with: wrangler d1 execute r-stats-prod --remote --command
--  "ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER" -- ignore errors)

-- ===== teams / seat management (Teams build 2026-07-19) =====
-- An org is a bulk "All-Access for Teams" purchase. seats_purchased mirrors the
-- Paddle subscription quantity (the BILLED seat count = source of truth). The
-- app enforces assigned <= seats_purchased. status/current_period_end drive seat
-- entitlement: a member holds Pro only while their org is active AND not expired.
CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  seats_purchased INTEGER NOT NULL,          -- = Paddle subscription quantity (billed)
  paddle_subscription_id TEXT,
  paddle_customer_id TEXT,                    -- for the billing portal link
  plan TEXT DEFAULT 'teams',
  status TEXT NOT NULL DEFAULT 'active',      -- 'active' | 'past_due' | 'canceled'
  current_period_end INTEGER,                 -- unix ts; seat entitlement valid until this
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
-- UNIQUE so the webhook can ON CONFLICT(paddle_subscription_id) upsert a re-
-- delivered subscription event onto the same org row. SQLite treats NULLs as
-- distinct, so orgs without a sub id (should not occur) never collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_sub ON orgs(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_orgs_owner ON orgs(owner_user_id);
-- Existing-deploy migration (orgs shipped minimal earlier; add columns, ignore
-- duplicate-column errors on re-run):
--   ALTER TABLE orgs ADD COLUMN paddle_customer_id TEXT
--   ALTER TABLE orgs ADD COLUMN plan TEXT DEFAULT 'teams'
--   ALTER TABLE orgs ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
--   ALTER TABLE orgs ADD COLUMN current_period_end INTEGER
--   ALTER TABLE orgs ADD COLUMN updated_at INTEGER

CREATE TABLE IF NOT EXISTS org_members (
  org_id    TEXT NOT NULL,
  user_id   TEXT NOT NULL,
  role      TEXT NOT NULL,                    -- 'owner' | 'admin' | 'member'
  status    TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'removed'
  email     TEXT,                             -- denormalized for the admin roster UI
  invited_by TEXT,                            -- user_id of the admin who added them
  joined_at INTEGER NOT NULL,
  removed_at INTEGER,
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON org_members(user_id, status);
-- Existing-deploy migration:
--   ALTER TABLE org_members ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
--   ALTER TABLE org_members ADD COLUMN email TEXT
--   ALTER TABLE org_members ADD COLUMN invited_by TEXT
--   ALTER TABLE org_members ADD COLUMN removed_at INTEGER

-- Pending seat invites. A row is a reserved seat until accepted (counts against
-- seats), or freed on revoke/expiry. token is single-use + high-entropy. The
-- partial UNIQUE(org_id,email WHERE pending) blocks duplicate live invites and
-- makes invite creation atomic via INSERT OR IGNORE.
CREATE TABLE IF NOT EXISTS org_invites (
  token       TEXT PRIMARY KEY,               -- random 32-byte base64url, single-use
  org_id      TEXT NOT NULL,
  email       TEXT NOT NULL,                  -- lowercased invited email
  role        TEXT NOT NULL DEFAULT 'member',
  invited_by  TEXT,                           -- admin user_id
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  accepted_at INTEGER,                        -- set on accept; NULL = pending
  revoked_at  INTEGER                         -- set if the admin revokes it
);
CREATE INDEX IF NOT EXISTS idx_org_invites_org   ON org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invites_pending
  ON org_invites(org_id, email) WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- comments table omitted: v1 uses Giscus per Section 11 decision.

-- ===== waitlist (Pro founding-member waitlist; pre-Lemon-Squeezy) =====
-- Captures email + plan interest before payments are live. When LS launches we
-- email this list a checkout link; access/validity begins at the paid-features
-- go-live date (honored at activation, not at waitlist signup).
CREATE TABLE IF NOT EXISTS waitlist (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  plan_interest TEXT,                       -- 'monthly' | 'annual' | 'lifetime' | NULL
  source        TEXT,                       -- where they signed up (e.g. 'pricing')
  country       TEXT,                        -- CF-IPCountry at signup
  user_id       TEXT,                        -- linked Supabase user id if signed in
  created_at    INTEGER NOT NULL,
  notified_at   INTEGER                      -- set when we email them that Pro is live
);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at);

-- ===== traffic_daily (admin analytics: per-UTC-day traffic snapshots) =====
-- Cloudflare Web Analytics retains only 30 days on the free plan, so
-- /api/admin/stats snapshots each day's rollup here on every dashboard load.
-- Rows accumulate indefinitely, giving the admin dashboard 90d/all-time
-- visitor trends and (approximate) long-range top pages. top_pages is a JSON
-- array of that day's top 15: [{path, visits, views}].
CREATE TABLE IF NOT EXISTS traffic_daily (
  day        TEXT PRIMARY KEY,              -- 'YYYY-MM-DD' (UTC)
  visits     INTEGER NOT NULL DEFAULT 0,
  pageviews  INTEGER NOT NULL DEFAULT 0,
  top_pages  TEXT,                          -- JSON, filled by nightly backfill
  updated_at INTEGER NOT NULL
);

-- ===== badges_earned (mini-course badges; windowed-lessons plan Phase B) =====
-- One row per (user, mini-course badge). public_id backs the public verify page
-- /badge/<public_id> and the LinkedIn add link. Applied 2026-08-14 to dev+prod.
CREATE TABLE IF NOT EXISTS badges_earned (
  user_id   TEXT NOT NULL,
  badge     TEXT NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  earned_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, badge)
);
CREATE INDEX IF NOT EXISTS idx_badges_public ON badges_earned(public_id);

-- ===== sent_emails (lifecycle email dedupe; Plans/free-user-onboarding-plan.md s6) =====
-- One row per (user, email step) ever sent. Every sender checks BEFORE sending
-- and inserts on success, so no user receives a sequence step twice, whether the
-- send was event-triggered or scheduled. email_key is the stable step id, e.g.
-- 'welcome-1', 'pass-day-27', 'intent-wall-1:<slug>'. Never delete rows.
CREATE TABLE IF NOT EXISTS sent_emails (
  user_id    TEXT NOT NULL,
  email_key  TEXT NOT NULL,
  sent_at    INTEGER NOT NULL,
  PRIMARY KEY (user_id, email_key)
);
CREATE INDEX IF NOT EXISTS idx_sent_emails_user ON sent_emails(user_id);

-- ===== email_events (delivery/open/click/bounce + would_send simulation log) =====
-- Written by the ZeptoMail webhook receiver and by the email brain. `would_send`
-- rows are the development-mode simulation trail (flag:email-live off): what the
-- brain WOULD have sent to a non-allowlisted user. Feeds the admin email dashboard.
CREATE TABLE IF NOT EXISTS email_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   TEXT,
  email     TEXT,
  email_key TEXT,
  event     TEXT NOT NULL,   -- sent | would_send | test_sent | delivered | open | click | bounce | complaint
  at        INTEGER NOT NULL,
  meta      TEXT
);
CREATE INDEX IF NOT EXISTS idx_email_events_at   ON email_events(at);
CREATE INDEX IF NOT EXISTS idx_email_events_user ON email_events(user_id, at);
-- Existing-deploy migration (applied 2026-08-12 to dev+prod): the table above +
--   ALTER TABLE users ADD COLUMN email_status TEXT;            -- NULL/ok | bounced | complained (suppression)
--   ALTER TABLE users ADD COLUMN email_progress INTEGER DEFAULT 1;  -- consent: progress category (opt-out)
--   ALTER TABLE users ADD COLUMN email_nurture INTEGER DEFAULT 0;   -- consent: nurture (strictly opt-in)
--   ALTER TABLE users ADD COLUMN email_offers INTEGER DEFAULT 0;    -- consent: offers/marketing (opt-in)
--   ALTER TABLE users ADD COLUMN email_optin_decided_at INTEGER;    -- post-signup opt-in screen: NULL = never asked
--   ALTER TABLE users ADD COLUMN persona TEXT;        -- student|professional|jobseeker|researcher|explorer
--   ALTER TABLE users ADD COLUMN job_role TEXT;       -- analyst|ds|mle|ai|pm|other (users.role = user|admin)
--   ALTER TABLE users ADD COLUMN job_role_other TEXT;
--   ALTER TABLE users ADD COLUMN level_r TEXT;        -- new|basic|solid
--   ALTER TABLE users ADD COLUMN level_ml TEXT;       -- none|concepts|hands_on
--   ALTER TABLE users ADD COLUMN level_ts TEXT;       -- none|some|regular

-- ===== contact_actions (the contact centre's memory, 2026-10-14) =====
-- What the owner did about a person: an email sent by hand (kind 'outreach',
-- email_key outreach:<template>:<id> is its tracking key), a note, a snooze
-- (until_at), 'done' for a queue reason, 'replied' (ref = the outreach it
-- answers) or 'reopen'. Created on first use by functions/_lib/contacts.ts,
-- together with an email_events (email_key, at) index for the reactions.
CREATE TABLE IF NOT EXISTS contact_actions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  kind       TEXT NOT NULL,     -- outreach | note | snooze | done | replied | reopen
  ref        INTEGER,           -- the outreach a follow-up or a reply belongs to
  template   TEXT,
  email_key  TEXT,
  subject    TEXT,
  body       TEXT,
  until_at   INTEGER,
  reason     TEXT,              -- the queue reason a 'done' dismissed
  at         INTEGER NOT NULL,
  actor      TEXT
);
CREATE INDEX IF NOT EXISTS idx_contact_actions_user ON contact_actions(user_id, at);
CREATE INDEX IF NOT EXISTS idx_email_events_key ON email_events(email_key, at);

-- ===== price_alerts (the "email me if there's ever a discount" flow, 2026-08-29) =====
-- One row per address that asked to hear about discounts. The row IS the
-- state machine: intent (today/week/month/someday) sets offer_due_at; the
-- hourly sweep (functions/_lib/pricealerts.ts) sends the offer, the 24h
-- reminder, the last-30-minutes note (engaged-only) and the close, stopping
-- the moment a purchase is detected. Anonymous visitors have user_id NULL.
CREATE TABLE IF NOT EXISTS price_alerts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           TEXT,
  email             TEXT NOT NULL,
  surface           TEXT,                 -- pricing | lesson-locked | why-pro
  country           TEXT,
  created_at        INTEGER NOT NULL,
  intent            TEXT,                 -- today | week | month | someday | renew
  intent_at         INTEGER,
  offer_due_at      INTEGER,
  offer_sent_at     INTEGER,
  offer_code        TEXT,
  offer_expires_at  INTEGER,
  reminder_sent_at  INTEGER,
  last30_sent_at    INTEGER,
  closed_sent_at    INTEGER,
  purchased_at      INTEGER,
  unsubscribed_at   INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alerts_email ON price_alerts(email);
-- Applied 2026-08-29 to dev+prod, together with:
--   ALTER TABLE users ADD COLUMN nurture_paused_until INTEGER;  -- quiet-probe "pause for two weeks"

-- ===== payments (one row per Paddle transaction that moved money) =====
-- WHY THIS EXISTS. subscriptions mirrors the CURRENT state of a plan, so it
-- answers "what are they on" but never "what did they pay, and when". The
-- subscription.* webhook payload carries no money at all, which is why
-- subscriptions.amount sat NULL on 18 of 19 rows and the digest could not
-- report revenue. Every charge arrives instead on transaction.completed, so
-- that is what this table records: the first charge, every renewal, and the
-- refunds against them.
--
-- Money is stored in minor units, exactly as Paddle sends it. `gross` is in
-- `currency` (what the customer was charged, their currency, tax included);
-- `earnings` is in `earnings_currency` (what Paddle actually pays out, after
-- tax and fees). The two are different currencies on most rows, so never add
-- a gross to an earnings.
CREATE TABLE IF NOT EXISTS payments (
  id                TEXT PRIMARY KEY,     -- Paddle transaction id (txn_...)
  provider          TEXT NOT NULL DEFAULT 'paddle',
  user_id           TEXT,                 -- resolved account; NULL = unmatched buyer
  customer_id       TEXT,                 -- paddle customer id
  subscription_id   TEXT,                 -- sub_...; NULL for one-time (lifetime)
  plan              TEXT,                 -- single_month | allaccess_year | lifetime | teams
  kind              TEXT NOT NULL,        -- first | renewal | one_time | other
  origin            TEXT,                 -- paddle origin (web, subscription_recurring, ...)
  status            TEXT,                 -- completed | billed | past_due
  currency          TEXT,                 -- currency of `gross`, `tax`, `discount`
  gross             INTEGER,              -- grand total charged, minor units
  tax               INTEGER,
  discount          INTEGER,
  earnings          INTEGER,              -- payout earnings after fees, minor units
  earnings_currency TEXT,
  discount_id       TEXT,
  invoice_number    TEXT,
  country           TEXT,
  billed_at         INTEGER,
  period_start      INTEGER,
  period_end        INTEGER,
  refunded          INTEGER NOT NULL DEFAULT 0,  -- minor units refunded, in `currency`
  refunded_at       INTEGER,
  created_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id, billed_at);
CREATE INDEX IF NOT EXISTS idx_payments_sub     ON payments(subscription_id, billed_at);
CREATE INDEX IF NOT EXISTS idx_payments_billed  ON payments(billed_at);
