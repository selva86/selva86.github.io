# Splitting Researcher into Applied Statistician and Product Data Scientist

Written 2026-11-26. Owner decision: split the Researcher track in two and sell
Product Data Scientist as an independent track.

This file is the plan of record. `Plans/lessons-curriculum.md` remains the
factory's source of truth for what to build; this explains why the arc is
shaped the way it is, what the migration touches, and what to verify after.

---

## 1. Why

The Researcher track grew from a 4-stage, 19-stop, six-week outline into 14
courses and 118 planned lessons without its name or its positioning copy being
revisited. The roadmap page still advertises the 2026-06 version.

Worse, the catalog had already duplicated itself along persona lines:

| course | track | lessons |
|---|---|---|
| `ds-causal` Causal Inference in R | ds §10 | 6 |
| `ds-causal-decisions` Causal Inference for Decisions | ds §18 | 12 |
| `res-causal` Causal Inference from Data | researcher §13 | 8 |
| `ds-experimentation` Experimentation | ds §17 | 8 |
| `res-design` Experimental Design and A/B Testing | researcher §12 | 8 |

Twenty-six causal lessons covering perhaps fourteen distinct topics, because
three different personas each needed the material and the single-track
structure gave them nowhere shared to put it. Content duplicating itself along
persona lines is a catalog pointing at its own seams.

The two experimentation courses are the exception: `res-design` is classical
DOE (blocking, factorial, split-plot) and `ds-experimentation` is online
product experimentation (CUPED, SRM, switchback, bandits). Those are genuinely
complementary and both survive, in different tracks.

## 2. The split

**Applied Statistician** keeps the `researcher` track KEY and every `res-*`
course. Only the display name changes. See section 6 for why the key is not
renamed.

```
 1 Probability and Estimation 7      2 Estimation and the Bootstrap 7
 3 Confidence Intervals and P-Values 6   4 Choosing Statistical Tests 6 + t-test 2
 5 ANOVA and Multiple Comparisons 8   6 Linear Regression, Properly 8
 7 Regression Modeling Strategies 7   8 Generalized Linear Models 8
 9 Mixed Effects and Longitudinal 7  10 Additive and Nonparametric 6
11 Bayesian Data Analysis 8          12 Experimental Design (classical DOE) 8
13 Causal Inference from Data 8      14 Survival and Event History 7
15 Multivariate and Measurement 7*   16 Meta-Analysis and Reporting 10*
                                                        (* planned, not built)
```

It keeps `res-causal` and `res-design`: an epidemiologist needs causal
inference, and classical DOE is applied statistics. The overlap with Product
Data Scientist is deliberate and is discussed in section 6.

**Product Data Scientist** is a new track, key `product-ds`, slug
`product-data-scientist`, curriculum prefix `3` (unused; 1 foundations,
2 analyst, 4 researcher, 5 ts, 6 ds, 0 windowed).

## 3. The persona this is designed for

Works at a product company. Owns experiment design and causal measurement.
Is judged not on "ran a t-test" but on **having made a call the company could
act on, and defended it in a room with a PM in it.**

That person's week contains: arguing about which metric a team should move,
sizing a test, explaining why they will not look at it on day two, deciding
what to do when the test cannot be run at all, and writing the readout. The
curriculum is ordered to match that, which is why it opens on metrics and
closes on decisions rather than opening on probability and closing on models.

Three gaps on the existing site that this persona feels immediately, and that
nothing anywhere currently covers:

1. **Metric design.** Nothing on the site teaches what makes a metric worth
   optimising, what a guardrail is for, or why a ratio metric breaks naive
   variance. This is where the persona is weakest and where the damage is
   largest, so it is section 1 and it is free.
2. **Long-run and second-order effects.** Surrogates, holdouts,
   cannibalisation. Every mature experimentation org has been burned here.
3. **Decisions.** Expected loss, minimum detectable effect as a business
   number, what a null result is worth, and how to write a readout. This is
   the section that makes the track read as a job rather than a methods list.

## 4. The curriculum

**Ten sections, 80 lessons.** The arc lives in ONE place:
`Plans/lessons-curriculum.md`, the ten `pds-*` course blocks, which is what the
factory reads. It is deliberately not restated here. Two copies of a lesson
list drift, and this repo has already paid for that three times over (three
causal courses, two survival courses, five names for one track).

```
 1  Product sense and metric diagnosis   pds-sense          6   FREE
 2  Metric design                        pds-metrics        9
 3  Experiment design                    pds-design         8
 4  Experiment trustworthiness           pds-trust          7
 5  Experiment sensitivity               pds-sensitivity    8
 6  Interference and network effects     pds-interference   6
 7  Heterogeneous treatment effects      pds-heterogeneity  7
 8  Causal inference without randomisation  pds-causal     12
 9  Long-term effects                    pds-longterm       7
10  Decision-making and communication    pds-decision      10
```

The same ten section titles appear in `www/roadmap-curriculum.js` and in
`Scripts/build_lessons_tracker.py`, where they MUST match verbatim or the
lesson player's breadcrumb and Back button point at the wrong section. A
cross-check over every course row in the repo is in the verification list.

### Why this shape, and not a methods list

An earlier draft was organised by method, the way a statistics catalogue is.
Research into the role said that was wrong in two specific ways.

**Trust, not technique, is most of the job.** Of the 23 chapters in Kohavi,
Tang and Xu, the majority concern why a result you already have is wrong. The
methods-first draft was missing the A/A test, triggering, Twyman's law,
ramping, the OEC and research ethics entirely. Sections 2, 3, 4 and 5 are now
the trust and sensitivity spine.

**Product sense is the top rejection reason.** Interview guides for several
large employers name failure to connect analysis to business impact, define
relevant metrics, or approach a product problem strategically as the most
common cause of a no-hire, and separately report that candidates over-prepare
SQL at the expense of open-ended experiment and metric design. The
methods-first draft had nothing on diagnosing a metric drop, funnels, cohorts
or opportunity sizing. That is now section 1, and it is the free one.

### Build order

**Sections 1, 2, 3, 4 and 10 first: 40 lessons.** They are the two interview
rounds that eliminate candidates, they contain almost no reusable material,
and together they stand alone as a product. Sections 5 to 9 follow as the
depth upgrade and are roughly half relocations.

### Reuse

About 21 of the 80 relocate from `ds-experimentation`, `ds-causal` and
`ds-causal-decisions`; the rest are new. Nothing moves out of Applied
Statistician. Concentrated in sections 5 to 8, which is why the first release
is almost entirely new writing.

`ds-experimentation` 7 (Contextual Bandits and Off-Policy Evaluation) folds
into section 7 lesson 6; `ds-causal-decisions` 11 (Mediation Analysis) folds
into section 8 lesson 11. Neither should be stranded.

## 5. Scope, honestly

A product data science loop has four rounds: SQL/coding, statistics and
experimentation, product sense, and behavioural. **This track owns the middle
two and does not touch the other two.** SQL is near-universal in the postings
and Python is the common second language; R appears mainly as an alternative,
including in Meta's own posting, which lists "statistical/mathematical
software (e.g. R)" as an example rather than a requirement.

The track must therefore NOT claim to make somebody hireable on its own. It
should say what it is: the two rounds that eliminate the most candidates,
assuming you can already write SQL. That is both true and a sharper pitch than
a vague promise, because it names a gap the buyer already suspects.

## 6. Decisions taken, and why

**The `researcher` track KEY does not change.** Only the display name. The key
appears in `tracks:<uid>` KV scopes for paying Single Track customers, in 101
lesson `curriculum_id` values, in 105 URLs and in 13 hardcoded lists. Renaming
it would revoke paid access and discard SEO equity to achieve a cosmetic
result. `SLUG` already decouples key from URL, so "Applied Statistician" can
be served from `/roadmap/researcher.html` with no one the wiser.

**Deliberate overlap between the two tracks on causal inference.** Applied
Statistician keeps `res-causal` (academic framing, observational epidemiology
and social science). Product Data Scientist gets §5 and §6 (product framing,
rollouts and launches). The topics overlap; the examples, the framing and the
reader do not. At $65 a track a buyer must choose, so each has to be complete.
Overlap across tracks is normal; three near-identical courses inside one
catalog was the actual problem, and the split removes it.

**`ds` loses 26 lessons.** The Data Scientist track goes 176 to 150 and
becomes a cleaner, purely-ML track. This is an improvement, not a sacrifice.

**Product Data Scientist is NOT added to the pricing page yet.** An empty
track must not be sellable. It ships with its sections visible and "Soon"
rows, exactly as `mleng` and `developer` do today, and joins the Single Track
picker once §1, §7 and §8 are built.

**Uncertainty Quantification and Robustness/Drift stay in `ds`.** Both are
relevant to this persona and both are more ML-system than product-decision.
Adding them would push the track past 70 lessons without sharpening it.

## 7. What the migration touches

Thirteen files hold a hardcoded track list.

| file | holds | why |
|---|---|---|
| `www/roadmap-data.js` | `LEVELS`, `TRACK_META` | the track definition |
| `www/roadmap-curriculum.js` | `RM2.sections[key]` | section list; **builder skips a track with none** |
| `www/roadmap-f2.js` | `TRACKS`, `SLUG` | v1 roadmap |
| `www/roadmap-nav.js` | track row, `RANK` | Courses dropdown |
| `www/roadmap-role.js` | track handling | v1 role page |
| `www/roadmap-v3.js` | `ROLES` | project domains |
| `www/lesson-mode.js` | `ROADMAP_PAGES:1499` | **the lesson back button** |
| `_build/build_roadmap_fanout.js` | `SLUG:77`, `chromeFrom` | generates both v2 pages |
| `Scripts/build_lessons_tracker.py` | course to track/section map | derives `courses.json` |
| `functions/api/webhooks/paddle.ts` | `TRACK_KEYS:30` | **money** |
| `functions/_lib/entitlement.ts` | `CORE_TRACKS`, `scopeCovers` | **money** |
| `functions/_lib/brain.ts` | `TRACK_NAMES/LOCKED/TOPICS` | emails name the track |
| `pricing.html` | `TRACKS:907`, `MAPT:1089 and :1196` | **money, and duplicated** |

Plus `index.html` (6 track cards), `roadmap/index.html`, `_build/tracks-source.json`
(certificates) and the sitemap.

`_build/build_roadmap_f2.js` is marked stale in CLAUDE.md section 9 and must
never be run.

### The back button chain, as it actually works

```
lesson page
  lm-exit rendered with href = data-course-landing        (lesson-mode.js:98, initial paint)
  fetch('/courses.json')                                  (:1018)
  renderCrumbs() rewrites href = exitTarget()             (:1029)
  exitTarget() = /roadmap/<ROADMAP_PAGES[track]>.html#rm-s<section>   (:1503)
     -> falls back to the course landing when the course has no roadmap data
/roadmap/<track>.html  (V1 page)
  -> /roadmap/  (index)
```

Two consequences. A new track missing from `ROADMAP_PAGES` sends the reader to
`/roadmap/` instead of its own page: degraded, not broken. And the back button
targets the **v1** page while the homepage and roadmap index both link to
**v2**, which is a pre-existing inconsistency this plan does not fix.

## 8. Risks, each with its fix

| # | risk | severity | fix |
|---|---|---|---|
| R1 | A `ds` Single Track buyer loses the 26 relocated lessons, silently: `scopeCovers("ds","product-ds")` is false and the middleware just strips the page | **critical, money** | `SPLIT_ALIASES = { ds: ["product-ds"] }` in `scopeCovers`, shipped BEFORE any lesson moves |
| R2 | A purchase of the new track writes no scope, because `TRACK_KEYS` rejects it | **critical, money** | add `product-ds` to `paddle.ts:30` |
| R3 | `MAPT` is duplicated in `pricing.html` at 1089 and 1196; editing one leaves an intermittent bug | high, money | edit both, or extract to one constant |
| R4 | Certificate denominators shift: eligibility is `solved / track.total_exercises`, so removing 26 lessons from `ds` moves everyone's DS percentage | high | decide deliberately; freeze the `ds` denominator or announce |
| R5 | `chromeFrom()` throws ENOENT for a track with no v1 page, killing the whole roadmap build | high | existence guard with a fallback source page |
| R6 | Builder silently skips a track with no `RM2.sections` entry, so the pages never appear and nothing errors | medium | add sections first; assert 14 to 16 pages written |
| R7 | Back button degrades to `/roadmap/` for the new track | medium | add to `ROADMAP_PAGES`; costs a full rebuild since `lesson-mode.js` is content-hashed |
| R8 | Relocated lessons change `curriculum_id`, which drives derived free/Pro access | medium | set `lesson_access` explicitly in frontmatter; verify against `courses.json` |
| R9 | An empty track appears purchasable | medium | keep it out of the pricing picker until §1, §7, §8 exist |
| R10 | Asset-key regression on the roadmap rebuild | low | the guard added 2026-11-26 refuses and writes nothing |

**Lesson URLs do not change.** Built pages live at the repo root as
`<Slug>.html`, independent of track, so all 26 relocating lessons keep their
URLs, inbound links and rankings. Only their section, landing and
`curriculum_id` move.

## 9. Implementation order

Each step is separately verifiable, and the money step ships first and alone.

1. **Money path**: `scopeCovers` alias, `TRACK_KEYS`, both `MAPT` sites. No
   user-visible change. Verify a `ds`-scoped account still opens an
   experimentation lesson in full.
2. **Builder robustness**: `chromeFrom` existence guard, v1 page for the new
   track.
3. **Track definition**: the six frontend files plus `ROADMAP_PAGES`,
   `tracks-source.json`, `brain.ts`. Track renders empty with Soon rows.
4. **Curriculum**: the 8 course blocks in `Plans/lessons-curriculum.md` and
   the course to section map in `build_lessons_tracker.py`.
5. **Display rename**: Researcher to Applied Statistician, key untouched, and
   the stale 4-stage copy replaced in the same pass.
6. **Generate and sweep**: roadmap builder, full `build.py`, sitemap,
   `sync_registries.py`, verify, merge.
7. **Later, separately**: relocate the 26 lessons; write the 34 new ones.

## 10. Verification checklist

Run after implementation, before merge where possible.

**Money and access**
- [ ] `scopeCovers("ds", "product-ds")` is true; `scopeCovers("0", ...)` still false
- [ ] `scopeCovers("researcher", <any res- track>)` unchanged
- [ ] A `tracks:<uid>` = `ds` account opens a relocated lesson and sees ALL steps, not two
- [ ] A `tracks:<uid>` = `researcher` account is unaffected by the rename
- [ ] `TRACK_KEYS` accepts `product-ds`; an unknown value still normalises to ""
- [ ] Both `MAPT` sites agree, and every pricing chip maps to a real track key

**Build integrity**
- [ ] `node --check` on every edited JS file
- [ ] Roadmap builder exits 0 and reports **0 key regressions**
- [ ] It writes 16 pages (8 tracks x 2), not 14
- [ ] `chromeFrom` does not throw for any track
- [ ] `build.py` completes; `git checkout -- tools/` afterwards; `tools` dirty = 0
- [ ] No `?v=` or `?h=` key is LOWERED anywhere in the diff

**Routing and navigation**
- [ ] `/roadmap/v2/product-data-scientist.html` returns 200
- [ ] `/roadmap/v2/product-data-scientist-overview.html` returns 200
- [ ] `/roadmap/product-data-scientist.html` (v1) returns 200
- [ ] The Courses dropdown lists both new tracks and links resolve
- [ ] Homepage track cards resolve; the renamed one reads Applied Statistician
- [ ] `/roadmap/` index lists both and links resolve
- [ ] `ROADMAP_PAGES` contains `product-ds`, so the back button does not fall through to `/roadmap/`
- [ ] Every existing `/roadmap/...researcher...` URL still 200s

**Data integrity**
- [ ] `courses.json` has no course pointing at a track with no definition
- [ ] Every `landing` in `courses.json` resolves to a committed file (72 of 72)
- [ ] Every section number in `build_lessons_tracker.py` equals its `S(n, ...)` in `roadmap-curriculum.js`
- [ ] `pro-lessons.json` track distribution matches expectation
- [ ] No duplicate `curriculum_id` introduced
- [ ] Sidebar and sitemap diffs are additive: added > 0, removed = 0

**Content and copy**
- [ ] No em-dashes in anything added
- [ ] The in-browser R runtime is never named in public copy (CLAUDE.md rule 5: it is the moat)
- [ ] The researcher roadmap no longer claims 4 stages or ~6 weeks
- [ ] The new track is absent from the Single Track pricing picker

**Post-deploy on production**
- [ ] Both new roadmap pages 200
- [ ] A sample of 5 existing lesson pages still 200 with unchanged URLs
- [ ] A Pro lesson still serves exactly 2 populated steps to a signed-out visitor
- [ ] A free lesson still serves every step
