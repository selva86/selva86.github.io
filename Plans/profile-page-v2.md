# Learner Profile v2: a page users build, showcase, and share

Owner directive (2026-07-23): "research top platforms and enhance it into a world
profile page that users would be proud to build, showcase and share to the world.
Plan this carefully before executing."

## 1. What the best profile pages get right (benchmarks)

| Platform | The move worth stealing | How it maps here |
|---|---|---|
| GitHub | The contribution heatmap IS the identity; 10-second signal, zero clutter | Upgrade our 26-week heatmap to a labeled 52-week graph as the visual centerpiece |
| Kaggle | A named TIER ladder (Novice to Grandmaster) turns activity into status | An R-flavored tier ladder computed from verifiable activity |
| LeetCode | Solved-count with structure (by difficulty), percentile context | Solved donut by difficulty (if manifest carries it) + site rank context |
| Credly | VERIFIED credentials + one-click "Add to LinkedIn" | Certificate cards linking /cert/<id> + prefilled LinkedIn add-to-profile URL |
| Duolingo | Streak as identity | Streak tile stays prominent (current + best) |
| github-readme-stats | An embeddable SVG stats card spreads the brand into READMEs | `/u/<handle>/card.svg`: auto-updating stats card users embed in GitHub profiles |
| 2026 consensus (recruiter feedback via Codeboards/Quillly guides) | Signal not noise: one strong stats widget, fast load, no gimmicks | One stats band, one heatmap, no counters/carousels/animations |

Anti-goals from the same research: no visitor counters, no badge carousels, no
animated gimmicks, no stacked stat widgets. Every element loads fast and reads
in seconds.

## 2. What exists today (parity baseline, functions/u/[handle].ts)

Avatar/name/PRO/member-since header; 4 tiles (XP, solved, streak, certs);
26-week unlabeled heatmap; certificates table; top hubs; recent activity;
private-by-toggle with owner bar (copy link, make public/private); noindex;
`/api/me/profile` GET/POST; lazy column migration; email never rendered.
All of this is kept; nothing regresses.

## 3. The v2 feature set

### 3.1 Identity header (upgraded)
- Avatar (or initial), display name, handle, PRO badge, member-since.
- NEW `bio` (<= 140 chars, plain text, owner-editable via the owner bar) and
  NEW `website` (one URL, https-only, rel="nofollow me"). Both optional,
  both sanitized, both behind the existing lazy-migration pattern.
- Tier chip next to the name (3.2).

### 3.2 Tier ladder (the status engine)
Deterministic, activity-derived, documented right on the page (hover/footnote):
- Newcomer (default) -> Apprentice (250 XP or 10 solves) -> Practitioner
  (1,000 XP and 25 solves) -> Analyst (3,000 XP and 75 solves or 1 cert) ->
  Expert (8,000 XP and 150 solves and 1 cert) -> Master (20,000 XP and 300
  solves and 2 certs).
- Thresholds live in one exported const in profile.ts (tunable). Tier renders
  as a colored chip + a subtle progress line "1,850 / 3,000 XP to Analyst".
- Never buyable: PRO does not affect tier. Verifiable activity only.

### 3.3 Stats band (one widget, six numbers)
XP (with "#N of M learners" rank when M >= 100), exercises solved, day streak
(current, best), pages read (reading_progress), quizzes passed, certificates.
Tabular numerals, no sparkline clutter.

### 3.4 Heatmap: 52 weeks, labeled
Month labels on top, Mon/Wed/Fri labels left, per-cell tooltip (title attr:
"3 activities on 12 Mar"), GitHub-familiar palette on brand hue, streak
annotation under it. Data: union of xp_ledger, exercise_attempts,
reading_progress days (existing query, extended window).

### 3.5 Skills by topic (replaces raw "top hubs")
Group solved exercises by hub -> map hub to its curriculum track (Learn R,
Statistics, Time Series, ML, ...) via sidebar/curriculum lookup baked at build
into a static JSON the function reads (no per-request scans). Render as
per-track solved bars. Falls back to hub list when unmapped.
CONDITIONAL: solved-by-difficulty donut IF the exercise manifest exposes
per-exercise difficulty (verify before building; skip cleanly if absent).

### 3.6 Certificates: verified credential cards
Card per cert: track name, issue date, "Verified" mark, /cert/<id> link, and
"Add to LinkedIn" using LinkedIn's add-to-profile URL (name, organization
r-statistics.co, issue year/month, certUrl). This is the highest-leverage
share loop on the page.

### 3.7 Course progress (server-truth only)
Lessons are exercise hubs, so gated-step solves and section quiz passes ARE in
D1. Render per-track progress bars ("Data Analyst track: 34 graded steps, 5
quizzes passed"). Label honestly as graded work, not "lessons completed"
(client-side lesson completion state never leaves the browser).

### 3.8 The share loop
- `/u/<handle>/card.svg`: a compact auto-updating stats card (name, tier, XP,
  solved, streak, heatmap strip). Cache-Control public 1h. Only for public
  profiles; 404 otherwise. The owner bar shows copy-paste markdown for GitHub
  READMEs: the github-readme-stats growth loop pointed at us.
- OG/Twitter meta on public profiles: dynamic title/description ("Selva:
  4,200 XP, 87 exercises solved, 3 certificates on r-statistics.co") + a
  designed static OG brand image v1. (Dynamic PNG OG cards via resvg-wasm =
  explicit stretch goal, not v1.)
- Share buttons in the owner bar: copy link, share to LinkedIn, share to X
  (prefilled text).

### 3.9 Design
Re-skin the standalone shell to current brand: white page, Inter Tight 700 for
the name and section titles, IBM Plex Sans body, site link colors, the dark
site footer NOT needed (single centered column, max-width ~880px), mobile-first,
no slogan copy anywhere. The page must look at home next to the Handbook page.

### 3.10 Privacy and indexing
- Privacy model unchanged: public by default, binary toggle, email never
  rendered, private = data-free shell.
- Keep noindex in v1. Indexing public profiles is a separate owner decision
  (SEO upside vs amplifying user data); flag it after launch.
- card.svg and OG meta exist only for public profiles.

## 4. Backend work

- profile.ts: tier const + computeTier(); rank query (COUNT users with more
  XP); track-mapping loader (static JSON baked by build script); extended
  heatmap window; quizzes-passed count; bio/website columns in the lazy
  migration; card.svg renderer (pure SVG string, escaped).
- functions/u/[handle]/card.svg.ts: new route (same dir convention as cert).
- /api/me/profile POST: accept {bio, website} with validation (length, https,
  strip control chars).
- Scripts: small build step emitting www/hub-tracks.json (hub slug -> track)
  from curriculum/sidebar data; committed like other registries.

## 5. Edge cases and risks (checked)

- Zero-activity profile: tier Newcomer, empty-state copy ("This learner is
  just getting started"), heatmap renders empty grid; page still looks whole.
- Long names/bios: CSS clamp + server-side length caps; escHtml everywhere
  (SVG builder too: card.svg is an injection surface, all fields escaped).
- Small user base honesty: rank shows only when >= 100 learners; no fake
  percentiles.
- Heatmap timezone: IST day buckets (consistent with the rest of the site);
  footnote says so.
- card.svg scraping/abuse: public-only, 1h edge cache, no PII in it.
- LinkedIn URL scheme drift: build the URL per current documented params; it
  degrades to LinkedIn's generic add-cert page if params change (harmless).
- The /u/ shell is standalone (no template.html), so no site-wide rebuild is
  needed; deploy = functions only. Zero risk to the 1,600 static pages.
- D1 load: one profile view = the existing stats queries + 2 cheap new ones;
  card.svg cached at edge. Fine at current volume.

## 6. Verification plan (before merge)

Branch `profile-v2` -> CF preview. Playwright against preview:
1. Public profile renders: header, tier chip, 6 stats, labeled heatmap,
   cert cards with LinkedIn links, track bars, share buttons.
2. Private profile: stranger sees data-free shell; owner (token injected)
   sees own-view + toggle works both ways.
3. Owner bar: bio save round-trips; invalid website rejected.
4. card.svg: 200 + valid SVG for public, 404 for private; renders in an
   <img> tag; no unescaped user content.
5. OG meta present on public, absent on private.
6. Mobile 390px: no horizontal scroll, tiles wrap.
7. A zero-activity test profile looks intentional, not broken.
Then eyeball on preview, merge to master.

## 7. Sequencing

1. Verify exercise-manifest difficulty availability (decides 3.5 donut).
2. hub-tracks.json build step.
3. profile.ts backend (tier, rank, queries, columns).
4. Page redesign + owner bar + share loop.
5. card.svg endpoint.
6. Playwright verification -> preview eyeball -> merge.

Estimated effort: one focused day. No dependency on any external provisioning.
