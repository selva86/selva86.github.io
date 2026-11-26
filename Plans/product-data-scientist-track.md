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

## 4. The curriculum: 8 sections, 55 lessons

Section 1 is free; sections 2 onward are Pro, per the standing gating rule.

### §1 Product Metrics and Measurement (7, free) - `pds-metrics`, 3.10

1. `What-Makes-a-Metric-Worth-Optimising` - input versus output metrics, and the difference between a number that moves and a number worth moving.
2. `Proxy-Metrics-and-the-Surrogacy-Trap` - when a short-term stand-in is valid for the thing you actually care about, and the conditions that make it lie.
3. `Guardrails-and-What-They-Protect` - the metrics you promise not to break, how many is too many, and the multiplicity cost of watching them all.
4. `Can-Your-Metric-Even-Detect-the-Change` - metric sensitivity: variance, traffic and effect size decide what is detectable before the test is designed.
5. `Ratio-Metrics-and-the-Delta-Method` - why per-user rates break naive variance, and the delta method that fixes the standard error.
6. `Segmenting-Without-Fooling-Yourself` - Simpson's paradox on real product data, and why a segment that reverses the result is usually a mix shift.
7. `Product-Metrics-Quiz`

### §2 Experiment Design and Power (8) - `pds-design`, 3.20

1. `From-a-Product-Question-to-a-Testable-Hypothesis` - turning "does the new onboarding work" into a comparison with a unit, a metric and a decision rule.
2. `Choosing-the-Randomisation-Unit` - user, session, device or cluster, and what each choice costs in variance and validity.
3. `Power-for-an-Online-Test-by-Simulation` - simulate the design you will actually run, including the ratio metric and the variance reduction.
4. `Setting-a-Minimum-Detectable-Effect` - the MDE is a product decision before it is a statistical one.
5. `Sample-Ratio-Mismatch-and-Why-the-Result-Is-Unusable` - the cheapest check in experimentation, what a failed SRM means, and why the result is then unusable.
6. `Writing-the-Analysis-Down-Before-the-Data` - pre-registration for product teams, and the degrees of freedom it closes.
7. `Reading-an-Experiment-Readout` - what to look at, in what order, and the four things that should stop you.
8. `Experiment-Design-Quiz`

### §3 Sequential Testing, Variance Reduction and Interference (7) - `pds-pitfalls`, 3.30

1. `Peeking-and-What-It-Does-to-Your-Error-Rate` - simulate the inflation, so the number is yours rather than a warning you half-remember.
2. `Sequential-Testing-and-Always-Valid-Inference` - the fix for peeking rather than the prohibition: always-valid p-values and confidence sequences.
3. `Variance-Reduction-with-CUPED` - use pre-period data to cut variance, and what it does and does not buy.
4. `Novelty-and-Primacy-Effects` - when the first week lies in both directions, and how to tell which you have.
5. `When-Treatment-Leaks-Between-Users` - marketplaces, social graphs and shared inventory break SUTVA, with the bias shown rather than asserted.
6. `Cluster-and-Switchback-Designs` - the two standard answers to interference, and the variance price each one charges.
7. `Experiment-Pitfalls-Quiz`

### §4 Heterogeneous Effects, Uplift and Bandits (7) - `pds-targeting`, 3.40

1. `The-Average-Effect-Hides-Everyone` - a null average concealing a real win for one group and a real loss for another.
2. `Pre-Specified-Subgroups-and-Fishing` - the difference between a hypothesis and a search, demonstrated by searching.
3. `Uplift-Modelling-Who-to-Treat` - modelling the effect rather than the outcome, and why the two rank people differently.
4. `Causal-Forests-and-Honest-Splitting` - honest sample splitting, and reading a heterogeneity estimate without over-reading it.
5. `Multi-Armed-Bandits-Explore-Versus-Exploit` - when an adaptive test beats a fixed one, and when it quietly costs you inference.
6. `Thompson-Sampling-and-Bayesian-Bandits` - the sampler built from scratch, then the regret curve compared against a fixed split.
7. `Targeting-and-Heterogeneity-Quiz`

### §5 Observational and Quasi-Experimental Methods (9) - `pds-causal`, 3.50

1. `What-a-Causal-Effect-Is-When-You-Cannot-Randomise` - potential outcomes and the one counterfactual you never observe.
2. `Drawing-the-Causal-Graph-for-a-Product-Decision` - DAGs, confounders, colliders, and the collider bias that controlling creates.
3. `Propensity-Scores-and-Inverse-Probability-Weighting` - building a pseudo-experiment, and checking overlap before trusting it.
4. `Matching-Users-and-the-Sample-You-End-Up-With` - the sample you end up with is not the sample you started with.
5. `Difference-in-Differences-and-Parallel-Trends` - the assumption doing all the work, and a case with perfect pre-trends that still misleads.
6. `Staggered-Rollouts-and-the-Negative-Weights-Problem` - why the standard two-way fixed-effects estimator breaks when units switch on at different times.
7. `Regression-Discontinuity-at-a-Threshold-Rule` - product rules that create natural experiments, bandwidth sensitivity, and the manipulation check.
8. `Instrumental-Variables-and-Two-Stage-Least-Squares` - encouragement designs, the three conditions, and the weak-instrument failure.
9. `Synthetic-Control-for-a-Single-Launch` - one treated market, a weighted combination of the rest, and the pre-period fit as the credential that earns the counterfactual.

### §6 Doubly Robust Estimation and Sensitivity Analysis (5) - `pds-honest`, 3.60

1. `Doubly-Robust-Estimation` - two chances to be right, and what it does when both models are wrong.
2. `Double-Machine-Learning` - flexible nuisance models with cross-fitting, and the regularisation bias it removes.
3. `Mediation-and-How-Much-Goes-Through-the-Feature` - direct and indirect paths, and the assumption nobody states.
4. `Sensitivity-Analysis-and-Placebo-Tests` - how strong an unmeasured confounder would have to be, which is the number that belongs in the doc.
5. `Observational-Claims-Quiz`

### §7 Long-Term Effects and Holdouts (6) - `pds-longrun`, 3.70

1. `The-Short-Term-Win-That-Loses-Money-Later` - a launch that raises clicks and lowers retention, measured both ways.
2. `Surrogate-Metrics-and-When-They-Are-Valid` - the surrogacy conditions, and what happens to the estimate when they fail.
3. `Long-Term-Holdouts-and-What-They-Cost` - holding users back to measure the cumulative effect, and the ethics and economics of doing it.
4. `Retention-and-Churn-as-Time-to-Event` - retention curves are survival curves; censoring, hazard, and why a retention rate at day 30 hides the shape.
5. `Cannibalisation-and-the-Zero-Sum-Launch` - a feature that moves volume rather than creating it, and how to detect the difference.
6. `Long-Run-Effects-Quiz`

### §8 Decision-Making and Reporting (6) - `pds-decision`, 3.80

1. `Deciding-to-Ship-with-Expected-Loss` - the decision framed as a loss function, where significance is an input and not the answer.
2. `Bayesian-A-B-Testing-and-the-Probability-of-Being-Better` - the quantity stakeholders already think a p-value gives them.
3. `When-the-Answer-Is-No-Effect` - what a null result is worth, equivalence testing, and how to say "we learned something" honestly.
4. `Writing-an-Experiment-Readout` - the structure, the one chart, the caveat that belongs and the three that do not.
5. `What-an-Experiment-Review-Should-Check` - what a trustworthy experimentation culture checks, and in what order.
6. `Decision-Making-Quiz`

**Total: 55 lessons across 8 courses.**

## 5. Build order and reuse

Roughly half of this already exists in the `ds` track and can be relocated and
reframed rather than written from scratch.

| new section | relocate from | write new |
|---|---|---|
| §1 Metrics | - | 7 |
| §2 Design | `ds-exp` 1, `ds-causal` 3, 4 | 5 |
| §3 Pitfalls | `ds-exp` 2, 3, 4 | 4 |
| §4 Targeting | `ds-exp` 5, 6; `ds-cd` 8 | 4 |
| §5 Causal | `ds-causal` 1, 2; `ds-cd` 1, 3, 4, 5, 6 | 1 |
| §6 Honest | `ds-cd` 2, 7, 9, 10, 11 | 1 |
| §7 Long-run | - | 6 |
| §8 Decision | - | 6 |

About 20 relocated, about 34 new. `ds-causal`'s quiz, `ds-exp`'s quiz and
`ds-cd`'s quiz retire into the new per-section quizzes.

**Sequencing.** §1, §7 and §8 are the differentiators and contain no reusable
material, so they are written first: they are what makes the track worth
buying on its own. §5 and §6 are almost entirely relocation and can follow
quickly. §2, §3 and §4 are mixed.

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
