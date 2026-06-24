# How to add an interactive lesson (and link it to the roadmap)

Operator runbook for the step-player lessons. Paths are relative to the repo root (`selva86.github.io/`). Companions: `_build/lesson-pedagogy.md` (quality rules), `_build/lesson-contract.md` (DOM + `=== step ===` grammar), `_build/lessons-derive.md` (metadata), `Plans/lessons-curriculum.md` (what to build).

---

## The one fact that trips people up

A lesson's **link back to the roadmap is NOT in the lesson's frontmatter.** It comes from one hand-maintained dict: `COURSE_ROADMAP` in `Scripts/build_lessons_tracker.py`, keyed by `course_id`. That dict stamps a `roadmap{track, section, sectionLabel}` block into `courses.json`, which the player reads to build the breadcrumb + the drill-up rail + the Back button.

- A course **in** `COURSE_ROADMAP` → gets the breadcrumb, the `Roadmap > Track > Section` crumbs, the in-player Track/Section rail, and a Back button that deep-links to `/roadmap/<page>.html#rm-s<section>`.
- A course **not in** it → still builds and works, but has **no** roadmap breadcrumb and the rail falls back to a flat single-course list.

So: **the roadmap link = one entry in one file.**

---

## A. The steps you do

### Case 1 — a new lesson in an EXISTING course
(e.g. a 4th Random Forests lesson). The `course_id` is already in `COURSE_ROADMAP`, so the roadmap link is automatic.

1. Add the lesson to that course's arc in `Plans/lessons-curriculum.md` (slug, title, one-line focus, signature widget, order).
2. Build it:
   ```bash
   python Scripts/batch_lessons.py --slug <New-Lesson-Slug>
   ```
3. Update the sibling lessons' `course_total` and `course_next`/`course_prev` if the lesson count changed (or re-run the arc).

### Case 2 — a brand-new course (the full case)

1. **Pick its home in the roadmap.** Open `www/roadmap-curriculum.js`, find the track and the `S(n, …)` section it belongs in. Note the **track key** and the **section number `n`** (see the track-key table below).
2. **Add the course + lesson arc** to `Plans/lessons-curriculum.md`: `course_id`, `course_title`, `course_landing`, `curriculum_id`, and the ordered lessons (each ≤ 12 steps per R13 — split a big topic into multiple lessons here, in the plan).
3. **Add the roadmap link** — one entry in `Scripts/build_lessons_tracker.py` (the `COURSE_ROADMAP` dict), keyed by your `course_id`:
   ```python
   'your-course-id': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 7,
                      'sectionLabel': 'Exact section title from roadmap-curriculum.js'},
   ```
   > ⚠️ `section` **must equal** the `S(n, …)` number for that track in `www/roadmap-curriculum.js`, or the Back-button deep-link lands on the wrong section. `track` must be one of the six keys below. `sectionLabel` should match the roadmap (it is what the breadcrumb shows).
4. **Build the lessons** (one fresh AI session each — repeatable `--slug`):
   ```bash
   python Scripts/batch_lessons.py --slug <Lesson-1-Slug> --slug <Lesson-2-Slug>
   ```
5. **Verify on the `lesson-mode-phase1` preview**, then merge to master when happy. (Lessons land on a branch + CF preview first; never straight to master.)

> Manual alternative to step 4 (one lesson, no orchestrator): `/write-lesson <course-id>:<n>` then `/publish-lesson <slug>`.

---

## B. What happens behind the scenes

`batch_lessons.py` spawns a **fresh `claude -p` per lesson** (clean context each = the scaling lever). Per lesson:

1. **Validate** — slug dedupe / cross-dir collision guard (vs `posts/`, `_posts/`, `_lessons/`, root).
2. **`/write-lesson`**
   - Pass 0: reads the SSOTs (`lesson-pedagogy.md`, `lesson-contract.md`, `lesson-visual-catalog.md`, `lessons-derive.md`, your `lessons-curriculum.md` entry) **+ the RF exemplar** (`lessons/RF-Course-Lesson-1.md`); derives metadata.
   - Pass 1: writes the **plan** `post_plans/<slug>_lesson-plan.md` (objectives → step → check table; arc sized **≤ 12 steps**). No plan, no lesson.
   - Pass 2: writes `lessons/<slug>.md` — cover visual, depth-ladder prose + MathJax, `::widget`s **selected from `www/lesson-widgets/`** (never hand-drawn SVG), gated quiz + try-it, 3–5 references.
   - Pass 3: self-runs the gate.
3. **`Scripts/lesson_quality_check.py`** (HARD) — cover visual (R1), ≥1 quiz + ≥1 try-it (R5), refs resolve (R9), every `::widget` type exists, no inline `<svg>`, ≥1 widget, `mathjax:true` when formulas present, warns at > 12 steps (R13). Fail → retry once → `manual_review`.
4. **`/publish-lesson`** runs the chain:
   - `_build/md2lesson.py` → `_lessons/<slug>.html` (steps + nested `<section class="exercise">` for gated steps + widget mounts).
   - `_build/build.py` → **`/<slug>.html` at repo root** (the `post_type: LESSON` flag triggers the player shell; flat URL so `hub_slug == stem` and the grading/XP backend is reused with zero new server code).
   - `_build/build_exercise_manifest.py` → authorizes the lesson's gated-step IDs (else grading 400s).
   - **`Scripts/build_lessons_tracker.py` → regenerates `courses.json`** — scans `_lessons/` frontmatter, groups by `course_id`, and (because your `course_id` is now in `COURSE_ROADMAP`) **attaches the `roadmap{}` block.** This is the moment the roadmap link becomes real.
   - First lesson of a NEW course only → also create the landing post (`posts/<Course>.md`, `post_type: C`) + run `_build/sync_registries.py` so it joins the sidebar under its track. (Lessons themselves are NOT in the sidebar.)
   - Commit **explicit paths** (never `git add -A` — the build leaves CRLF/EOL churn on ~1,300 pages) + push to the branch.
5. `batch_lessons.py` records status in `lessons-status.json` (gitignored, resumable) and runs a periodic catalog/manifest sync.

### At runtime (what makes it "link back")
1. The built page carries `<body data-course-id="<cid>" …>`.
2. `www/lesson-mode.js` fetches `/courses.json`, finds the course by `course_id`, reads its `roadmap{track, section, sectionLabel}`.
3. It renders the breadcrumb (Roadmap › Track › Section › Lesson) + the drill-up rail + a Back button → `/roadmap/<page>.html#rm-s<section>` (page from the `ROADMAP_PAGES` key→file map in `lesson-mode.js`).
4. On the roadmap page, `www/roadmap-role.js` sees `#rm-s<n>` and opens + smooth-scrolls to that section (`<details id="rm-s<n>">`).

**Data flow:** `COURSE_ROADMAP` entry → `courses.json` `roadmap{}` → player breadcrumb / rail / Back → `#rm-s<n>` on the roadmap page.

---

## Reference

### Track keys (use in `COURSE_ROADMAP.track`) → roadmap page
| `track` key | `trackLabel` | Roadmap page (`/roadmap/…`) |
|---|---|---|
| `foundations` | New to R | `new-to-r.html` |
| `analyst` | Data Analyst | `data-analyst.html` |
| `ds` | Data Scientist | `data-scientist.html` |
| `ts` | Forecaster | `forecaster.html` |
| `researcher` | Researcher | `researcher.html` |
| `developer` | R Developer | `r-developer.html` |

(The key→page map lives in `www/lesson-mode.js` `ROADMAP_PAGES`; the section ids `rm-s<n>` are emitted by `www/roadmap-role.js`.)

### Required LESSON frontmatter
`post_type: LESSON`, `curriculum_id`, `course_id`, `course_title`, `course_lesson`, `course_total`, `course_landing`. Optional: `course_next`, `course_prev`, `lesson_access` (override). Most are derived in `/write-lesson` Pass 0 per `_build/lessons-derive.md`.

### Free / Pro gate (positional, from `curriculum_id` "L.S.P")
Free if **level == 1 OR section == 1**, else Pro. Override with `lesson_access: free|pro` in frontmatter. Baked into `courses.json` per lesson; enforced by the player (2-step preview then paywall).

### Length (R13)
Target 7–12 steps, **ceiling 12**. A bigger topic is a multi-lesson course split at a natural seam — decided in the plan (`Plans/lessons-curriculum.md`), never by chopping a finished lesson. The gate warns above 12.

### Key files
| File | Role |
|---|---|
| `Plans/lessons-curriculum.md` | SSOT of WHAT to build (course + lesson arc) |
| `Scripts/build_lessons_tracker.py` | `COURSE_ROADMAP` dict → generates `courses.json` (**the roadmap link**) |
| `Scripts/batch_lessons.py` | orchestrator: fresh `claude -p` per lesson |
| `.claude/skills/write-lesson` | per-lesson writer (plan → md) |
| `.claude/skills/publish-lesson` | gate → md2lesson → build → manifest → tracker → commit |
| `Scripts/lesson_quality_check.py` | hard quality gate |
| `_build/md2lesson.py` | `lessons/<slug>.md` → `_lessons/<slug>.html` |
| `_build/lesson-pedagogy.md` | quality rules R1–R13 |
| `_build/lesson-contract.md` | step/`::`-directive grammar + emitted DOM |
| `www/lesson-widgets/` | the widget library lessons select from |
| `courses.json` | generated catalog the player reads (public, served) |
| `www/lesson-mode.js` / `.css` | the player (breadcrumb, drill-up rail, gating) |
| `www/roadmap-role.js` | per-track roadmap page; opens/scrolls to `#rm-s<n>` |

### Gotchas
- **No `COURSE_ROADMAP` entry = no roadmap link** (new courses only; existing courses already have one).
- **`section` must match `S(n,…)`** in `roadmap-curriculum.js`, or the deep-link lands wrong.
- **Slugs are globally unique** across `posts/`, `_posts/`, `_lessons/`, and root (shared flat URL + grading-hub namespace). Use a course-prefixed convention.
- **Never `git add -A`** in the lesson flow — stage explicit paths (the build dirties ~1,300 pages with EOL churn).
- **`::widget` config can't contain apostrophes or raw `<`/`>`** (it sits in a single-quoted HTML attribute; md2lesson + the gate reject it).
