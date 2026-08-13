# Windowed lessons: implementation plan

The build plan for the v3 nurture model (SSOT for the model itself:
`nurture-email-sequence.md`). Owner approved 2026-08-14 with Part 2 as
committed. This file: phases, the full issue/conflict/gap/edge-case
analysis, and the decisions each one forced.

## The moving parts

1. **Registry** `functions/_data/mini-courses.json` - every mini course,
   its parts mapped to sequence numbers, badge ids, and per-part lesson
   slugs (null until the factory builds them). One file feeds the
   middleware, the shelf API, the dashboard, the sender, and the factory.
2. **Access** - middleware branch for windowed slugs: Pro serves; a valid
   personal window serves (session user OR signed link token); everything
   else 302s to the expiry page. Windowed pages get noindex.
3. **Expiry page** `lesson-locked.html` - graceful, names the real window,
   shows what is open now, carries Why-Pro, fires an intent signal.
4. **Shelf API** `/api/me/shelf` - open lessons + catalog + badge states,
   derived from the ledger and registry.
5. **Dashboard** - "Your open lessons" shelf + the locked catalog +
   (later) the badge wall; **Dashboard tab in the navbar for signed-in
   users** (site-nav bump + sitewide sweep).
6. **Sender** - brain sends `seq:<n>` daily (Mon-Sat), nurture consent,
   only when the lesson is BUILT; the send row IS the unlock.
7. **Ceremony** - Why-Pro screen (dismissable) then badge mint + verify
   page + LinkedIn + wall.
8. **Factory** - lessons #1-14 under R1-R15, then continuous.

## Phases

| Phase | Ships | State after |
|---|---|---|
| A (now) | Registry, middleware access, expiry page, shelf API, dashboard shelf+catalog, navbar tab, lesson-mode 'windowed' handling | Mechanics live but dormant (no windowed lesson exists); navbar tab visible to signed-in users |
| B | Badge system + ceremony + Why-Pro screen | Completion experience ready before anyone can complete |
| C | Sequence sender + week-one bodies (owner reads before launch) | Sender dev-mode testable; flag `nurture-sequence` off |
| D | Factory: lessons 1-14, then a week ahead of the calendar. **Model: Opus 5 (`claude --model claude-opus-5`) for every lesson-writing subprocess - owner directive 2026-08-14** | Launch-ready; owner flips nurture flag |

## Issues, conflicts, gaps, edge cases - and the decisions

**Identity and access**

- *Email clicks land signed-out (other device, mail app browser).* The
  lesson link in each email carries `?u=<uid>&t=<hmac>` - the same
  per-user signature as unsubscribe/tracking. Middleware honors EITHER a
  valid token OR the session user, then checks THAT user's window in the
  ledger. No sign-in friction at the door.
- *Token grants reading, not earning.* Grading/XP still needs a session;
  checks work locally either way, and signing in is the natural upgrade
  prompt inside the lesson. Documented, not fought.
- *Forwarded emails leak the window.* Accepted: 72h, one lesson, and a
  forward is organic acquisition. The token cannot unsubscribe or read
  anything else (different endpoints re-verify).
- *Mid-lesson expiry.* The window is checked at page load only; a loaded
  lesson is never yanked. A learner who loads at hour 71 finishes in peace.
- *Pro users* bypass windows entirely, including via token links.

**Sequence mechanics**

- *Everyone walks the sequence from their own day 1* (opt-in day). Windows
  are personal; the dashboard shelf shows ~3 open at any time (daily sends
  x 3-day windows). Sundays are the recap, so the sequence advances six
  days a week.
- *Factory falls behind:* the sender sends `seq:<n>` ONLY if that lesson's
  registry status is built. Users hold at the frontier and resume when the
  factory catches up - order is never skipped, and nobody gets a dead link.
- *Nurture opt-out mid-sequence:* sends stop, shelf drains, ledger keeps
  their position; re-opting resumes at the first unsent number.
- *Day 0 (R Syntax 101)* is conditional on `level_r = new` - sent as that
  user's first day, shifting their numbering by one (ledger keys are
  per-user, so this is free).
- *A user binging a course:* parts outside their windows are locked - that
  is the design (the Pro moment), surfaced by the slim per-lesson nudge.

**Collisions with existing systems**

- *Pro-lesson stripping:* windowed slugs must NEVER enter pro-lessons.json
  (that path strips content and shows the Pro gate). The windowed branch
  runs BEFORE the pro-lesson branch in middleware; the lessons tracker
  learns to skip `lesson_access: windowed`.
- *The account gate in lesson-mode.js* (sign-in wall at lesson 3+ of free
  courses) would fire on parts 3+ of windowed courses. Fix shipped in
  Phase A: `access === 'windowed'` skips both the account gate and the Pro
  gate client-side - the SERVER is the only gate for windowed lessons.
- *The meter:* windowed lessons are lesson hubs, meter-exempt by design.
  One scarcity per surface; no change needed, asserted in tests.
- *The DA pass* covers track 'analyst' lessons via resolveScope; windowed
  lessons are a separate access class the pass neither opens nor blocks.
- *SEO leakage:* windowed pages get `noindex` (middleware header + meta),
  stay OUT of sitemap.xml, feed.xml, Pagefind, courses.json, sidebars, and
  roadmaps. The public blog post keeps the search traffic. auto_link
  already skips lesson pages.
- *Email click tracking* wraps the lesson link; the `to=` carries the full
  tokened URL through the redirect. Verified in Phase C tests.
- *Windowed lessons never appear in the DA/DS course catalogs* -
  the dashboard catalog is their only listing surface.

**Ceremony and badges (Phase B decisions locked now)**

- Badge, not certificate; verify URL + LinkedIn add + OG image via the
  cert-page machinery; badge wall on the dashboard.
- Completion = every gated check in every part passed (server-derivable
  from the exercise manifest + attempts; no new state).
- Order: final check -> Why-Pro (one-tap dismissable, Boot.dev pattern) ->
  badge ceremony. The badge is never conditional on the pitch; Pro skips
  the pitch.

**Sender specifics (Phase C)**

- Category nurture, consent `email_nurture=1`, one-brain priority below
  deadlines/intent/cap, Sunday recap untouched. Ledger `seq:<n>`, sent_at
  = the unlock moment. Subjects/bodies from the sequence doc, owner-read
  before the flag ever flips.

**Navbar tab**

- Rendered by site-nav.js (so: JS + CSS version bump and the sitewide ?v
  sweep, same mechanical pattern as the Go Pro button). Hidden until
  auth-hydrate marks the body signed-in; no layout shift for anonymous
  visitors. Mobile menu gets the same entry.

## Verification per phase

A: preview curl matrix (windowed slug anon -> 302 expiry; with token ->
200; Pro session -> 200; noindex header present; shelf API 401 anon /
correct JSON authed; navbar link present-but-hidden markup sitewide;
dashboard renders shelf empty-state). B: badge mint + verify page + og.
C: dev-mode sends to allowlist only; ledger rows create unlocks
end-to-end. D: every lesson passes the R1-R15 gate chain before publish.
