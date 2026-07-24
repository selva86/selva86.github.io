# Profile pass M: the mainstream kit

Owner approved all 5 points 2026-07-24 ("Plan completely, implement carefully and test it")
plus two carried items from the same day (cert OG images, per-track difficulty chips).
Branch: profile-m. Test rig: local wrangler pages dev + seeded D1 + forged HS256 tokens
(same rig as pass 2, scripts in scratchpad p2/). Preview + Playwright before merge.

## Scope

| # | Feature | Files (primary) |
|---|---------|-----------------|
| M0 | Per-track cert OG images (PNG, 1200x630) | screenshots/og-cert-*.png, functions/cert/[id].ts |
| M1 | GitHub README stat card SVG | functions/u/[handle]/github-card.svg.ts, profile share row |
| M2 | Percentile chips (all-time + 30d) | functions/_lib/profile.ts, functions/u/[handle].ts |
| M3 | Activity timeline + per-track difficulty chips + motion polish | functions/u/[handle].ts, _lib/profile.ts |
| M4 | Runnable portfolio (3 pinned projects) | _lib/profile.ts (validation), u/[handle].ts (render + editor) |
| M5 | Avatar upload + accent themes | functions/api/me/avatar.ts, u/avatar/[uid].ts, u/[handle].ts, auth-hydrate |

## M0 Cert OG images
- Six 1200x630 PNGs, one per track, rendered offline (HTML template -> Playwright screenshot),
  committed to screenshots/og-cert-<track-id>.png. Navy ground, track name, seal, site wordmark.
- functions/cert/[id].ts og:image -> /screenshots/og-cert-<track-id>.png with og-default fallback.
- Risk: none at runtime (static assets). Check: LinkedIn Post Inspector on one cert URL.

## M1 GitHub README stat card
- GET /u/<handle>/github-card.svg?theme=dark|light (default dark; READMEs skew dark).
  ~495x195 like github-readme-stats. Contents: display name + handle, XP, solved, streak,
  certs, tier ring initials. Public-profile gate identical to card.svg. All text escaped.
- Fonts: system stack only (GitHub camo re-hosts the SVG; webfonts will not load).
- Cache-Control: public, max-age=14400, stale-while-revalidate=86400 (camo respects it).
- Own-view share row gets "GitHub README" button -> copies markdown embed to clipboard.
- Risks: camo strips query strings? (it keeps them). SVG must be self-contained. Foreign
  handle 404. Checks: 200 + valid SVG public, 404 private/unknown, escaping with a
  hostile display name, theme param renders both ways, markdown copy button works.

## M2 Percentiles
- Population: users with total_xp > 0 (active, honest denominator; not all accounts).
- All-time: percentile of total_xp. 30d: percentile of SUM(xp_ledger.at >= now-30d).
- KV cache pct:alltime + pct:30d histograms 1h (small: one sorted array of values).
- Display: hero chip "Top N% by XP" + "Top N% this month" ONLY when N <= 50 and
  population >= 30. Existing rank suppression (<100 learners) unchanged; percentile
  is the interim competitive surface.
- Risks: percentile flapping near cache expiry (acceptable); division by tiny population
  (floor guard). Checks: seeded users at known XP produce exact percentiles; chip absent
  for bottom-half user; absent when population < 30.

## M3 Timeline + difficulty chips + motion
- Timeline: last 15 events server-rendered, grouped by day: exercise passes (collapsed
  "solved N exercises in <hub>"), badges (user_badges.awarded_at), certs, daily bonuses,
  streak milestones. Sources: xp_ledger + user_badges + certificates. Icons inline SVG.
- Per-track difficulty chips: solved counts by difficulty per track (join exercise_attempts
  x manifest difficulty x hub-tracks in JS at edge). Chips under each skills-by-track bar:
  "12 beginner - 8 intermediate - 3 advanced" (plain dot separators, no mono font).
- Motion: count-up on hero stat numbers + tier-ring stroke animation + board month fade-in.
  IntersectionObserver, guarded by prefers-reduced-motion, pure inline JS, no library.
- Risks: xp_ledger rows without matching manifest entries (skip silently); timeline
  empty for new users (hide section). Checks: seeded user shows grouped events in order;
  reduced-motion shows static numbers; chips sum equals solved count per track.

## M4 Runnable portfolio
- profile_json.pinned = [{title<=80, code<=2000, note<=140}] max 3 (extends the existing
  single snippet pattern; snippet stays for back-compat, rendered as pinned[0] if no pinned).
- Server validation mirrors snippet rules; total profile_json cap 12KB enforced.
- Render: cards with escaped <pre> + Run button per card (webr-init reuse, lazy init on
  first Run click so three editors do not triple-load WebR at page load).
- Editor: own-view modal gains a Pinned work section, 3 slots, add/remove.
- Risks: XSS (escape everything; code only ever executes client-side in the viewer's own
  WebR sandbox on explicit Run, same trust model as the existing snippet); payload bloat
  (caps). Checks: 3 cards render + run; hostile title/code escaped; cap rejection messages;
  legacy snippet-only profiles unchanged.

## M5 Avatar + themes
- Upload: POST /api/me/avatar, JSON {data: dataURL} after CLIENT-side canvas downscale to
  256x256 JPEG q0.85 (payload ~20-40KB, no edge image processing needed). Validate magic
  bytes + size <= 200KB. Store R2 AVATARS key avatar/<uid>.jpg. users.avatar_key lazy ALTER.
  DELETE /api/me/avatar removes it.
- Serve: GET /u/avatar/<uid>.jpg from R2, Cache-Control 1d + ?v=<updated ts> busting.
- Surfaces: profile hero, masthead dropdown (auth-hydrate reads avatar_url from /api/me),
  share cards keep initials (SVG simplicity).
- Themes: profile_json.theme enum {navy default, forest, plum, slate, ember}; recolors the
  hero gradient + ring + accents via CSS vars baked server-side; validated server-side.
- Risks: hostile uploads (magic-byte check, size cap, R2 key is server-derived from uid,
  never user input); moderation of public images deferred (small base; add report path
  later, noted); GDPR delete (account deletion must remove R2 object; wire into existing
  delete path if present, else note). Checks: upload -> renders on profile + dropdown;
  oversized/malformed rejected; delete restores initials; theme switch persists + renders;
  invalid theme rejected.

## Order and verification
M0 -> M1 -> M2 -> M3 -> M5 -> M4 (isolated routes first, editor-heavy last).
After each: local-rig checks above. After all: full Playwright pass on the CF preview
(public profile, own view via forged token, mobile 390px, dark mode), then the pass-2
regression trio (daily API, attempt contract fields, badge-card 404s) to prove no
regressions, then merge decision to owner.

## Flagged follow-up (owner, 2026-07-24)
certifications.html needs a complete redo (owner: "we need to completely redo that url").
Interim: homepage hellobar points at /roadmap/new-to-r.html instead. Scope the redesign
after pass M ships: the page should sell the credential (proof artifacts, free-vs-Pro
tracks, verify flow) rather than list tracks.
