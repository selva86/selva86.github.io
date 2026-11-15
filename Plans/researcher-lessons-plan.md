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

Section 4 holds eight roadmap items. The live `t-test` course covers three of
them and stays exactly as it is; `res-test-selection` covers the other five. Both
rows in `COURSE_ROADMAP` carry the same `sectionLabel`, copied verbatim from
`www/roadmap-curriculum.js`, or the player's breadcrumb and Back button point at
the wrong section.

Sections 5 to 16 are not designed yet.

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

- **Merge gate.** The branch is unmerged by design while the arc is incomplete.
  No decision yet on whether to merge section by section or in one pass.
- **Certificate name mismatch.** The track advertises "Applied Statistics with R"
  while the mintable certificate is "Statistics for Data Science".
- **`regression-intervals` on `Point-Estimates-and-the-Standard-Error`.** Its
  approved plan uses the widget as an explicit generalization beat on canned
  regression data. Defensible, and the step says so, but `chart-plotter` could
  carry the same beat on the lesson's own standard-error-against-n numbers.
- **Build pass not started.** Owner preference is plans first, owner reviews,
  then build (`--plan-only`, then a second pass without it).
