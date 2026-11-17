# Researcher track: interactive lesson arc + widget plan

Status: IN BUILD. Source of truth for the arc is `Plans/lessons-curriculum.md`
(append there, keep this as the design rationale and the handoff).

**This file records decisions, not counts.** Counts drift and then mislead, which
is how a stale CLAUDE.md paragraph once cost a session hours of duplicate work.
To learn what is actually built, stand on the branch and ask the disk:

```
git worktree list                                  # find the branch and its tree
python Scripts/build_lessons_tracker.py --dry-run  # derive courses.json, print it
cat lessons-status.json                            # in-flight batch state, gitignored
```

## Branch

**Everything lives on `lesson-res-probability-1-7`, worktree `_wt-research`.
Nothing is on `master`**, so none of it is on r-statistics.co. The live roadmap
already advertises these sections, so Pro viewers see "Soon" until it merges.

Three files in the tree are dirty and were dirty before this work started:
`pseo-status.json` and the two `www/lesson-widgets.bundle*.js` files. They are
regenerable build artifacts. Do not `git add -A`; stage explicit paths, and run
`git checkout -- tools/` before every commit.

### Merge master forward before every build pass

```
git merge origin/master          # in the worktree, before building, never mid-run
```

A branch that outlives its base builds lessons with stale machinery. On
2026-11-15 this branch was 75 commits behind `origin/master` and **36
build-critical files had moved**, including the converter and the player:

```
_build/md2lesson.py   +14    the lesson-to-player converter
_build/build.py        -8
_build/template.html   +2
www/lesson-mode.css   +11
www/lesson-mode.js  +159    across 8 commits
```

Those eight commits changed real behaviour, not styling: "Take the sign-in wall
off free lesson content", "The Pro gate asks the learner to continue, and offers
a way onward", "Try-it steps: the textarea is the last block before the check,
so setup cells run". The last one is an authoring rule. The gates will not catch
the mismatch, because they check the old machinery against the old player; it
surfaces only after the merge.

Do the merge between passes, never while a batch is running: a worker reads
`Plans/`, `_build/` and `www/lesson-widgets/` mid-session.

### Branch scope

One branch per **course**, not per track. A course is what the reader consumes
and what the roadmap flips, and seven lessons is about six hours of build, so
the branch lives a day instead of a fortnight. This branch is named
course-scoped (`-probability-1-7`) but accumulated sections 2 and 3, which is
exactly why it went stale. Split the next one.

## Owner decision, 2026-11-15

A second curriculum for this track was written on 2026-11-14 on branch
`lesson-researcher-1-4`, using the same `res-probability` course id and the same
`curriculum_id 4.10.x` numbers but a different lesson set. The owner chose to
**resume this branch and discard that one**, because the work here is built,
gated and carries four widgets that exist nowhere else. The superseded branch is
kept at `c4ce07058b` and its worktree is removed.

The lesson: that branch was invisible to a check against `master`, to a grep of
branch names for "research", and to a clean `git status`. Only
`git worktree list` surfaced it.

## Standing rules for this track

Everything runs on base R plus `replicate()` and `sample()`, so every block is
exact in the browser with one `set.seed()` and nothing has to be installed.

**Slugs.** Every section-1 topic already exists as a tutorial page
(`Random-Variables-in-R`, `Central-Limit-Theorem-in-R` and the rest). Lessons
share one flat slug namespace with those pages, so lessons take fresh names and
the tutorials keep their rankings. Same rule the Forecaster track used.

**Landings take no `R-` prefix** on this track:
`Probability-and-Estimation-Course.html`, not `R-Probability-...`.

**Section 1 access is set explicitly in frontmatter.**
`access_from_curriculum` in `Scripts/build_lessons_tracker.py` reads the second
dotted component of `curriculum_id` literally, so `4.10.1` resolves to section 10
and returns `pro`. Every section-1 lesson is free only because its frontmatter
says `lesson_access: "free"`. Do not rely on the derivation.

## The arc

Four courses, sections 1 to 4. Lesson lists and widget assignments live in
`Plans/lessons-curriculum.md` under `# Researcher track`.

| Course | curriculum_id | Roadmap | Access | Landing |
|---|---|---|---|---|
| `res-probability` | 4.10 | §1 | free | Probability-and-Estimation-Course |
| `res-estimation` | 4.20 | §2 | pro | Estimation-and-the-Bootstrap-Course |
| `res-inference` | 4.30 | §3 | pro | Confidence-Intervals-and-P-Values-Course |
| `res-test-selection` | 4.40 | §4 | pro | Choosing-Statistical-Tests-Course |
| `res-anova` | 4.50 | §5 | pro | ANOVA-and-Multiple-Comparisons-Course |
| `res-linear-models` | 4.60 | §6 | pro | Linear-Regression-Properly-Course |
| `res-model-strategy` | 4.70 | §7 | pro | Regression-Modeling-Strategies-Course |
| `res-glm` | 4.80 | §8 | pro | Generalized-Linear-Models-Course |
| `res-mixed` | 4.90 | §9 | pro | Mixed-Effects-and-Longitudinal-Models-Course |
| `res-additive` | 4.100 | §10 | pro | Additive-and-Nonparametric-Models-Course |
| `res-bayes` | 4.110 | §11 | pro | Bayesian-Data-Analysis-Course |
| `res-design` | 4.120 | §12 | pro | Experimental-Design-and-A-B-Testing-Course |
| `res-causal` | 4.130 | §13 | pro | Causal-Inference-from-Data-Course |
| `res-survival` | 4.140 | §14 | pro | Survival-and-Event-History-Analysis-Course |
| `res-multivariate` | 4.150 | §15 | pro | Multivariate-Measurement-and-Missing-Data-Course |
| `res-reporting` | 4.160 | §16 | pro | Meta-Analysis-and-Defensible-Reporting-Course |

The Access column is the COURSE default. Per-lesson access follows the owner's
rule of 2026-11-17: section 1's first TWO lessons are free and the rest of
section 1 is Pro; from section 2 on, lesson 1 alone is free and the rest are Pro.
So every course above has one free opener except `res-probability`, which has
two. Set it in frontmatter in BOTH `lessons/<slug>.md` and
`_lessons/<slug>.html`, since the tracker reads the fragment while
`md2lesson.py --force` regenerates the fragment from the source.

Section 4 holds eight roadmap items. The live `t-test` course covers TWO of
them, items 1 "Hypothesis Testing" and 3 "t-Tests", and stays exactly as it is;
`res-test-selection` covers the other SIX, items 2, 4, 5, 6, 7 and 8. (Corrected
2026-11-17: this said three and five, which left item 7 "Effect Size" unowned and
the section a lesson short. `Reporting-Effect-Size-Not-Just-Significance` now
fills it.) Both rows in `COURSE_ROADMAP` carry the same `sectionLabel`, copied
verbatim from `www/roadmap-curriculum.js`, or the player's breadcrumb and Back
button point at the wrong section.

Sections 5 to 16 were designed on 2026-11-17 and their arcs are in
`Plans/lessons-curriculum.md`: 92 lessons, one per roadmap item, 120 items in
total across the track. Two things to read there before planning any of them:
the package-feasibility note (sections 5-16 need libraries that sections 1-3 did
not, and six of them have never been proven to load in the browser), and the
four new widgets that must be built first (`forest-plot`, `funnel-plot`,
`spec-curve`, `missingness-pattern`).

## Widgets

Four widgets were written for this track and exist only on this branch:
`dist-shapes` (df, dist), `clt-sampler` (n, parent), `ci-coverage` (method, n,
parent), `likelihood-curve` (model, n).

**Check a widget's source, not its name, before assigning it.** A widget that
reads no cfg key is a fixed illustration of one specific thing and cannot be
pointed at a lesson's data. Four of the seventeen used here are fixed:
`count-dist`, `leverage-point`, `regression-intervals`, `robust-weights`. Each is
assigned deliberately and the curriculum says so in a `Widget note:` sentence
placed **above** the `widgets:` clause, so the clause stays a bare list of names
that an audit can parse.

## Open decisions

- **Merge gate. Decided 2026-11-17: merge per lesson, from a branch.** The two
  reasons to hold the branch back are both gone. Access is now correct ahead of
  the build (the owner's rule, set in frontmatter), and `batch_lessons.py
  --resume` makes a relaunch cheap and idempotent, so continuity no longer
  depends on one long run surviving. Run with `--sync-every 1`, which bounds the
  window in which a published Pro lesson is still absent from
  `pro-lessons.json`, and therefore being served in full to everyone, to a
  single lesson. Merge to master after each lesson verifies. Thirteen finished
  lessons currently sit unmerged and invisible to production, which is the cost
  of the old policy. Running the track on master directly was considered and
  rejected: it removes the Cloudflare preview and the one-commit rollback while
  fixing none of the four observed halts, every one of which was a machine or
  worker fault rather than anything to do with the branch.
- ~~**Certificate name mismatch.**~~ **Resolved 2026-11-17: there is no live
  mismatch.** The published page and the mintable certificate already agree on
  **"Certified R Researcher"** (`www/roadmap-data.js:203` and
  `functions/_data/tracks.json:2015`, and the page prints the former via
  `RM.byKey(role).cert`). Two stale copies saying "Applied Statistics with R"
  survive in DEAD code: `www/roadmap-page.js` (reached only by
  `_build/sections/roadmap-fragment.html`, which reaches no live page) and
  `www/roadmap-f2.js` (reached only by `_mocks/roadmap-rendered-base.html`).
  Both corrected 2026-11-17. The page `<title>` set by
  `_build/build_roadmap_f2.js` says "Applied Statistics in R", which is an SEO
  title, not a certificate claim, and is left alone deliberately.
- **`regression-intervals` on `Point-Estimates-and-the-Standard-Error`.** Its
  approved plan uses the widget as an explicit generalization beat on canned
  regression data. Defensible, and the step says so, but `chart-plotter` could
  carry the same beat on the lesson's own standard-error-against-n numbers.
- **Build pass not started.** Owner preference is plans first, owner reviews,
  then build (`--plan-only`, then a second pass without it).
