# Profile v3 program: mock v2 -> product

Contract: `_mocks/profile-mock-v2.html` (owner-approved 2026-07-24). Base:
the profile-v2 branch (backend + page + card.svg + API, checklist-green on
preview). Three passes, each shippable alone; nothing in a later pass blocks
an earlier one.

## PASS 1 - the page becomes the mock (no new behavior systems)

1.1 HERO BAND: navy identity band (site footer navy), avatar + gold
    tier-progress ring + tier pin, display-weight name, bio, chips (PRO,
    open-to-work, currently-learning), meta row, 4-stat strip with deltas
    (+XP this month, +solved this month, streak/best, rank + percentile).
    Section anchor tabs. The standalone shell keeps us free of site rebuilds.
1.2 MONTH-SEGMENTED ACTIVITY BOARD: server-rendered HTML grid (mock markup),
    per-month totals, weekday rails, ?year= selector (2026 default, prior
    years from xp_ledger/reading history), summary strip computed from the
    same rows that render the cells (single source, no drift).
1.3 XP-OVER-TIME CHART: server-rendered SVG, cumulative monthly XP from
    xp_ledger, certificate milestones overlaid, endpoint emphasized.
1.4 BADGE ENGINE (the big new backend):
    - functions/_lib/badges.ts: BADGE_DEFS const (id, name, blurb, kind,
      art params, test(stats) predicate). Launch set: streak 7/30/100,
      solves 100/200/300, quiz-perfect, track certs (from certificates),
      early-member (created_at < cutoff), tier-master.
    - D1 user_badges (user_id, badge_id, awarded_at, meta_json,
      PK(user_id, badge_id)), runtime-created. Award sweep runs lazily
      (profile load + own-view) via INSERT OR IGNORE: idempotent, race-safe,
      backfills history user by user with zero migration.
    - Rarity: COUNT(*) per badge_id, KV-cached 1h ("held by N learners";
      suppressed below 3 holders to avoid "held by 1" awkwardness).
    - Locked badges render from defs with live progress bars.
1.5 SKILLS MASTERY CHIPS: difficulty-by-track matrix from the solved pairs
    (already loaded); chips per mock.
1.6 STANDING DELTA: rank_history (user_id, week, rank) captured lazily on
    profile render (first render each ISO week stores that week's rank);
    "up N places" compares the latest two stored weeks; silent when <2 rows.
1.7 SHARE-MOMENT CARD: /u/<handle>/cert-card.svg?id=<public_id> renders the
    navy certificate card (public profiles + active certs only, escaped,
    cached); profile cert rows gain Post-to-LinkedIn/X links that reference
    it. (The in-flow award modal is Pass 2; the artifact ships now.)
1.8 Hero stat deltas: monthly XP and solves from windowed queries.

## PASS 2 - behavior systems

2.1 DAILY SET: deterministic per (user, IST day) selection - one unsolved
    from the current track, one from the weakest track, one 30-day-old
    review; rendered on own-view + dashboard; completion detected against
    the day's attempts; +15 bonus XP awarded once via xp_ledger action
    'daily.bonus' (guard: unique day marker in meta, checked before insert).
2.2 STREAK FREEZES: users.streak_freezes (0-2). Earn +1 at each 7-day
    multiple (in the streak-update path, atomic UPDATE ... WHERE freezes < 2).
    Consume: when the streak update detects exactly one missed day and
    freezes > 0, decrement and preserve the streak (atomic guard against
    double-spend). True active days stay separately displayed - freezes
    never fabricate activity, they only bridge the streak counter.
2.3 MILESTONE NUDGES: exercise success toast shows the nearest advancing
    counter (badge progress, tier progress) - data piggybacks on the attempt
    response; www/exercise-api.js + hub/lesson UI additions.
2.4 WEEKLY RECAP EMAIL: flag-gated (flag:recap-email), lazy weekly sweep
    (KV-throttled) over users active in the last 14 days AND
    newsletter_opt_in = 1 initially; per-user-per-week KV dedupe marker;
    ZeptoMail; one-click opt-out link writing users.recap_opt_out.
2.5 AWARD MOMENT: attempt/cert flows return newly-awarded badges; client
    modal with the share card + prefilled posts.

## PASS 3 - competitive layer (scale-gated)

3.1 FIRST-SOLVER RACES: publish pipeline marks race hubs (frontmatter
    race_badge: true); first N passing users get a numbered badge
    (meta.number claimed via COUNT at award, race-tolerant: duplicates
    resolved by awarded_at order, numbers cosmetic).
3.2 MONTHLY CHALLENGE: Plans-driven config (challenge id, month, hub set,
    target); progress = solved-in-window across the set; limited badge;
    /challenges/<id> hall-of-fame page (server-rendered).
3.3 WEEKLY LEADERBOARD: public page, opt-out via profile_json, computed
    from xp_ledger weekly windows; ships when weekly actives >= 100.
3.4 LEAGUES: cohorts of 20 by tier, weekly promote/demote; explicitly
    deferred until 3.3 sustains >= 100 weekly actives.

## Issues, gaps, conflicts, fail cases

| # | Risk | Resolution |
|---|---|---|
| 1 | attempt.ts is the hot XP path; pass-2 hooks could break grading | every hook additive + try/catch + flag-gated; grading result never depends on new code |
| 2 | Badge sweep races (two isolates award at once) | PK(user_id,badge_id) + INSERT OR IGNORE = idempotent by construction |
| 3 | Freeze double-spend on concurrent misses | single atomic UPDATE with WHERE freezes>0 AND streak-state guard; loser no-ops |
| 4 | Daily-set day boundary | IST day everywhere (site convention), computed server-side only |
| 5 | daily.bonus double award | xp_ledger insert guarded by SELECT of the day's marker first; worst case one duplicate 15 XP on a perfect race - acceptable, logged |
| 6 | Rarity counts embarrassing at small base | suppressed under 3 holders; "founding cohort" copy while small |
| 7 | Rank delta noisy (rank moves on others' activity) | weekly granularity only; silent without 2 weeks of history |
| 8 | Recap email = spam risk | opt-in cohort only at launch, flag kill switch, per-week dedupe, one-click opt-out |
| 9 | Year selector data volume (all-time boards) | per-year windowed queries; "All time" caps at 3 years rendered |
| 10 | cert-card.svg leaks | public profile + active cert + ownership join required; 404 otherwise; all text escaped |
| 11 | Hero band on zero-activity users | deltas suppressed, stats render zeros honestly, empty-state copy kept |
| 12 | League/challenge URLs squatting | /challenges reserved in RESERVED_HANDLES already; routes under /challenges/ namespace |
| 13 | Profile page query growth | pass-1 adds ~5 queries (badges, rarity via KV, rank history, deltas); all in the existing parallel batch; measured target < 400ms compute |
| 14 | Old mocks drift from build | mocks stay committed as contract; deviations documented in this file |

## Verification checklists

PASS 1 (Playwright on preview + seeded dev D1):
[ ] Hero band renders all identity elements; deltas correct vs seeded data
[ ] Tabs anchor-scroll; keyboard focus visible
[ ] Board: month blocks with totals; summary equals cell sum; ?year=2025
    renders past data; empty year renders clean
[ ] XP chart: cumulative curve matches ledger sum; milestones at cert dates
[ ] Badges: seeded user earns expected set (30-streak no, 200-solves no,
    quiz-perfect yes...) on first load; second load awards nothing new;
    locked badges show correct progress; rarity line suppressed (<3 holders)
[ ] user_badges rows idempotent after 3 loads
[ ] Standing delta hidden on first-ever render, correct after two weeks
    simulated (two rank_history rows seeded)
[ ] cert-card.svg: 200 public+active, 404 private/revoked/foreign id,
    hostile name escaped
[ ] Mobile 390px; reduced-motion honored; load < 1s warm
PASS 2:
[ ] Daily set deterministic for fixed (user, day); resets on IST midnight;
    bonus awarded once; grading unaffected with flag off AND on
[ ] Freeze earn at 7/14; consume on 1-day gap; never below 0 or above 2;
    true active days unchanged
[ ] Recap email: sends once per user-week to opted-in actives only;
    opt-out honored immediately; flag off = zero sends
PASS 3: per-feature checklists written when scheduled.

---

# PASS 2 implementation design (2026-07-24, pre-build)

Reconnaissance: streak logic lives in functions/_lib/db.ts touchStreak()
(four transitions, UTC days, idempotent per day, called only on passes).
XP claims are race-free via the partial unique index. This is the surface
pass 2 hooks into; every hook is additive and flag-gated.

## 2.2 Freezes (into touchStreak, minimal diff)
- users.streak_freezes INTEGER DEFAULT 0 (lazy ALTER via ensureProfileColumns).
- New transition between "yesterday" and "reset": gap of EXACTLY one missed
  day AND freezes > 0 -> atomic consume:
  UPDATE users SET streak_freezes = streak_freezes - 1 WHERE id=? AND streak_freezes > 0
  meta.changes==1 -> streak continues (+1) and last_active backfills the
  bridge day; changes==0 (race/none) -> normal reset. Gaps > 2 days always
  reset: freezes bridge single days only (v1 simplicity, documented).
- Earn: when the new current hits a multiple of 7:
  UPDATE users SET streak_freezes = MIN(2, streak_freezes + 1) - runs at
  most once per day thanks to the last==today guard.
- AttemptResult gains streak_freezes and freeze_used_today for the UI.
- True active days remain derived from ledgers; freezes never fabricate rows.

## 2.1 Daily set (read API first, bonus second)
- GET /api/me/daily -> { date, tasks: [{hub, exercise_id, track, reason,
  difficulty, done}], all_done, bonus_awarded }.
- Deterministic pick: seed = SHA-like hash of (userId + UTC date);
  task 1 from the dominant-track hubs of the last 30d, task 2 from the
  weakest track with history (fallback: any unmapped hub), task 3 a review
  (solved > 30 days ago). Unsolved filtering against the manifest.
- done = a passing attempt today for that exercise id (any pass counts;
  review tasks are re-passes, first-pass uniqueness untouched).
- Bonus (flag:daily-set): on the pass that completes the set, attempt flow
  waitUntil()s checkDailyBonus: SELECT xp_ledger action='daily.bonus'
  ref=date first, then insert 15 XP + total_xp bump. Worst-case race =
  one duplicate 15 XP, logged, accepted (risk table #5).
- Surfaces: dashboard card + profile own-view via the API (client fetch).

## 2.3 + 2.5 Nudges and award moments (server first, client in two steps)
- attempt.ts response gains: nudge (nearest counter line, computed from
  stats already in AttemptResult + one COUNT on passes only) and
  new_badges (award sweep runs ONLY when a pass crosses a threshold
  boundary - solved in {1,100,200,300}, streak in {7,30,100} - so the
  12-query ctx build never runs on ordinary passes).
- Client step 1 (ships with pass 2): lesson-mode.js consumes both (its
  pages re-hash automatically on deploy).
- Client step 2 (rides the planned site-wide rebuild with the dwell work):
  exercise-hub.js consumption + ?v bump. Not blocked on it.
- badge-card.svg (/u/<handle>/badge-card.svg?id=...) joins cert-card.svg,
  same public-only + escaped contract, for the share modal.

## 2.4 Recap email
- functions/_lib/recap.ts: weekly KV-throttled sweep piggybacked on
  /api/me traffic; cohort = newsletter_opt_in=1 AND recap_opt_out IS NULL
  AND active in 14d; per-(user, ISO week) KV dedupe marker; flag:recap-email
  kill switch; ZeptoMail via existing sendMail.
- Unsubscribe without auth: random token minted at send time, stored
  KV recap-unsub:<token> -> user_id (TTL 90d); GET /api/recap/unsub?t=...
  sets users.recap_opt_out=1. No new secrets.
- Content: XP + solves for the week, rank move, nearest badge line, one CTA.

## 2.6 Free Foundations certificate (investigation-first)
- Investigate functions/_lib/tracks.ts + cert/mint.ts gating; if the
  foundations track cert is config-level, ship free-tier minting behind
  flag:free-foundations-cert; else scope a follow-up. The award-moment
  modal + LinkedIn add make this the fast-fill + conversion rung.

## Pass 2 verification checklist (preview + seeded dev D1)
VERIFIED 2026-07-24: 37/37 green on a local wrangler-pages-dev rig (forged
HS256 tokens via .dev.vars-only secret, seeded local D1, KV flags toggled
live). Found + fixed in the run: daily-set pool drifted as tasks were
passed (selection inputs now frozen at UTC day start) and free users could
be dealt Pro-walled tasks (pools now exclude pro-lesson hubs). Recap cohort
filter observed exact (1 send attempt for 1 eligible of 4 seeded).
[x] Freeze transitions: yesterday->+1 unchanged; same-day no-op unchanged;
    2-day gap with freeze -> streak continues, freezes-1; 2-day gap without
    freeze -> reset; 3-day gap with 2 freezes -> reset (single-day rule);
    freeze floor 0 / cap 2 enforced under concurrent attempts
[x] Earn: streak 7 -> +1 freeze (cap 2); no double-earn same day
[x] Daily set: deterministic for fixed (user,date); changes at UTC midnight;
    tasks unsolved-only; review task older than 30d; done-detection flips on
    pass; bonus exactly once; flag off = no bonus, API still renders set
[x] attempt.ts: grading result identical with flags off (regression: XP,
    first_pass, streak fields byte-equal on old paths); nudge line present
    on passes; new_badges only at boundary crossings
[x] Recap: flag off = zero sends; one send per user-week; opt-out link works
    unauthenticated; cohort filter excludes non-opted users
[x] badge-card.svg: public-only, escaped, 404 on foreign/unknown badge
