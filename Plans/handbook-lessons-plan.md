# Interactive lessons for the Publishing Handbook

Written 2026-08-06. Companion to `publishing-handbook-plan.md` (the free chapters)
and `offer-design-2026.md` (the commercial frame).

---

## Part A: The problem this has to solve

The handbook chapters are good, and that is the difficulty.

A researcher arrives with an objection, reads the chapter, runs the diagnostic,
adapts the response wording, and leaves. Their problem is solved. Nothing about
that experience creates a felt need for anything else.

**Free content that fully answers the question generates no pull toward a paid
product.** The pull has to come from something the chapter cannot do at any
length, not from withholding part of the answer.

This is not a reason to weaken the chapters. Boot.dev gives away every lesson
explanation and still runs at $10M ARR; their stated answer to "why pay" is
interactivity, not content. Duolingo converts around 9% of monthly actives with
no learning content behind the paywall at all. The chapters buy trust. The
lessons have to sell something else.

### The one-line distinction

**The handbook transfers a conclusion. A lesson transfers a mechanism.**

The chapter says multicollinearity inflates standard errors while leaving
coefficients unbiased. The reader believes it because two model outputs were
shown and the sentence was asserted.

The lesson puts a slider on the correlation between two predictors. The reader
drags it and watches the standard errors balloon while the coefficients sit
still, then drags it back. That cannot be written down, and the reader who has
done it can reconstruct the argument a year later.

### The authoring test

**What does the reader DO here that they could not do by reading?**

If a lesson could be written as prose without losing anything, it should have
stayed a chapter. Apply this before writing a single step.

---

## Part B: Thirty lessons, eight widgets

An earlier draft of this plan said eight lessons. That was wrong, and the error
is worth recording because it is easy to repeat.

It conflated two questions. **How many widgets are needed** is about eight,
because the underlying mechanisms repeat across objections. **How many lessons
there should be** is separate, and I let the widget cost decide the lesson count.

That runs against this platform's own design. Lessons SELECT and CONFIGURE
widgets from `www/lesson-widgets/`; authors never hand-write simulation code. One
multiplicity widget serves all six multiplicity objections at different
configurations. One assumption-violation dial serves all seven assumption
objections. The expensive artifact is the widget, and it is amortised.

**So: one lesson per objection, thirty lessons, eight widgets.**

That is also unremarkable for this factory, which has shipped 91-lesson and
45-lesson fleets.

### The one constraint that survives

**A lesson must not restate its chapter.** Same subject, different job:

- The chapter answers the objection the reader already received
- The lesson shows the mechanism and makes the reader apply it to a case they
  did not choose

If a lesson's steps could be lifted into its chapter without loss, it is not a
lesson. The authoring test stands: what does the reader DO here that they could
not do by reading?

### Widget-to-lesson mapping

| Widget | Serves objections | Count |
|---|---|---|
| Assumption-violation dial | 31-37 normality, variance, independence, autocorrelation, multicollinearity, linearity, proportional hazards | 7 |
| Cluster / ICC simulator | 33, 55 independence, mixed models | 2 |
| Editable DAG | 39-42 confounding, baseline, selection bias, control group | 4 |
| Multiplicity simulation | 43-48 comparisons, subgroups, borderline p, exploratory, dichotomising, outliers | 6 |
| Same-result-four-ways comparator | 49-53 effect sizes, intervals, trends, fit, missing data | 5 |
| Wrong-family fit viewer | 54, 56-59 ordinal, link function, zero-inflation, overfitting, interactions | 5 |
| Reproducibility repair | 60 plus Part 10 sharing | 1+ |
| Review triage sorter | Chapter 30 hub, response and revision | 1+ |

Eight widgets, thirty-one lesson slots. Several objections draw on two widgets,
which is fine and adds variety rather than cost.

## Part C: The review simulator

The premium product, and the thing no chapter resembles.

### What it is

The reader is handed a dataset and a completed analysis they did not write. A
reviewer raises an objection in reviewer language. The reader must:

1. Run the diagnostic themselves, in the browser
2. Decide which of the three outcomes applies
3. Draft the response

### How it grades

- **The diagnostic**: auto-graded. Did they run the right check?
- **The outcome choice**: auto-graded. Three options, one correct, with feedback
  naming why the others are wrong in this specific case.
- **The response**: self-graded against a published rubric. This is the Coaching
  Actuaries mechanic, which grades written work at zero marginal cost and works
  because the rubric does the teaching.

### Why it is the paid product

The chapter answers a question the reader already has. The simulator gives them
the question, under conditions they did not choose, and finds out whether they
can handle it. That is the closest available proxy for the real job, and every
vertical in the offer research charges for exactly that gap.

It also generates the data for a readiness score, which is the item the
comparative research identified as the strongest defensible product in the
category.

### Scale

Start with six scenarios, one per mechanism. Each is a dataset, an analysis, two
or three objections, and a rubric. Reusable across many attempts because the
objections can be drawn at random.

---

## Part D: What makes it feel premium

Four things a free indexed page cannot do. All four already exist in the
platform; none needs new backend.

**Simulation the reader controls.** The core. Set the conditions, watch the
consequence.

**Specific feedback, not a revealed answer.** "You chose fixable; the correct
call was real problem, because both variables are theoretically necessary and
dropping either changes what the model estimates."

**Progress that persists and compounds.** Spaced repetition weighted toward what
the reader got wrong. This matters more in statistics than most subjects because
the skills are used episodically and forgotten between projects.

**A readiness number with a published meaning.** "Am I ready to defend this?" is
answerable only by a system that has watched the reader work.

---

## Part E: Gating

Per `growth-playbook-2026.md`:

- **Free**: every handbook chapter, forever, indexed. The trust layer.
- **Free**: lesson 1 in full, and the first scenario of the simulator.
- **Pro**: lessons 2-8, the remaining scenarios, the readiness score, the
  credential.

The wall is on the feature, not the content, and it never touches a page that
ranks.

**The chapters must link to the lessons as a natural next step, not as an
advertisement.** The honest framing: this chapter told you what to do about this
objection; the lesson is where you learn to see it coming. That is true, which
is why it will read as helpful rather than as a pitch.

---

## Part F: Build order

| # | Item | Why here |
|---|---|---|
| 1 | Lesson 4, multiplicity | Best signature interactive; the simulation IS the argument. If this one does not land, the format is wrong and it is cheap to learn that. |
| 2 | Lesson 1, assumptions | Broadest coverage, seven chapters feed it |
| 3 | Simulator scenario 1 | Proves the grading loop end to end |
| 4 | Lessons 2, 3 | |
| 5 | Simulator scenarios 2-3 | |
| 6 | Lessons 5-8 | |
| 7 | Remaining scenarios, readiness score | Needs attempt data first |

**Gate after item 3.** One lesson plus one scenario is enough to tell whether
people finish them and whether anyone converts. Building all eight before
checking repeats the mistake the handbook nearly made.

---

## Part G: Widgets needed

Against the existing library in `www/lesson-widgets/`:

| Widget | Used by | Exists? |
|---|---|---|
| Assumption-violation dial | L1 | New |
| Cluster / ICC simulator | L2 | New |
| Editable DAG | L3 | New, hardest to build |
| Multiplicity simulation | L4 | New |
| Same-result-four-ways comparator | L5 | New |
| Wrong-family fit viewer | L6 | New |
| Reproducibility repair | L7 | New |
| Review triage sorter | L8 | New |

All eight are new. That is real work, and the widget is what makes each lesson
worth paying for, so it cannot be skipped or faked. The project rule stands: a
genuinely novel widget is hand-built, never approximated.

Every widget must also emit runnable R beside its visual, per the standing rule
that widgets show AND run.

---

## Part H: The thirty lessons

Added 2026-08-06. Part B settled the count and Part G listed the widgets, but the
lessons themselves were never enumerated, so nothing could be scheduled or
handed to the factory. This is that list.

One lesson per objection, numbered to its chapter. The middle column is the only
one that decides whether a lesson deserves to exist: if it can be written as a
sentence, the lesson is a chapter with extra steps.

### Part 9 objections, chapters 31 to 60

| Ch | Lesson | What the reader does that reading cannot give them | Widget |
|---|---|---|---|
| 31 | Non-normal residuals | Drag skewness up and watch interval coverage barely move, then find the sample size where it does | assumption-dial |
| 32 | Unequal variance | Break equal variance and watch coverage collapse while R-squared sits still | assumption-dial |
| 33 | Non-independent observations | Raise the intra-class correlation and see nominal 95% intervals fall to 60% | assumption-dial, cluster-icc-sim |
| 34 | Autocorrelated residuals | Add serial correlation and watch the standard error understate by a factor they can read off | assumption-dial |
| 35 | Multicollinearity | Correlate two predictors and see intervals widen while coverage holds at 95% | assumption-dial |
| 36 | Nonlinear relationships | Bend the truth away from a line and watch prediction fail at the range edges while fit barely moves | assumption-dial |
| 37 | Proportional hazards | Make the hazard ratio drift over follow-up and see one number fail to describe it | assumption-dial |
| 38 | Missing power analysis | Set effect size and n, then read the power they actually had, not the one they claimed | power-curve |
| 39 | Unadjusted confounding | Build the DAG, open and close the back door, and watch the estimate move | dag-editor |
| 40 | Baseline imbalance | Test whether adjusting for an imbalanced variable helps or hurts, by its position in the graph | dag-editor |
| 41 | Selection bias | Condition on a collider and manufacture an association from nothing | dag-editor |
| 42 | Non-comparable control groups | Compare adjustment strategies against a known truth | dag-editor |
| 43 | Multiple comparisons | Run twenty null tests and watch a significant result appear reliably | multiplicity-sim |
| 44 | Unplanned subgroups | Slice one null dataset by subgroup until something turns up | multiplicity-sim |
| 45 | Borderline p-values | Resample the same population and watch p swing across 0.05 | multiplicity-sim |
| 46 | Exploratory vs confirmatory | Pick the model after seeing the data, then price what that costs | multiplicity-sim |
| 47 | Dichotomising | Split a continuous predictor at the median and measure the power thrown away | multiplicity-sim |
| 48 | Outlier removal | Apply four defensible removal rules to one dataset and get four conclusions | multiplicity-sim |
| 49 | Missing effect sizes | Hold p fixed, vary n, and watch the effect size say something p cannot | report-four-ways |
| 50 | Missing confidence intervals | See two studies with identical p and incompatible intervals | report-four-ways |
| 51 | Trending toward significance | Watch p = 0.06 and p = 0.04 come from the same population | report-four-ways |
| 52 | Model fit statistics | Compare R-squared, AIC and cross-validated error ranking models differently | report-four-ways |
| 53 | Missing data reporting | Report the same incomplete dataset four ways and see the conclusion change | report-four-ways |
| 54 | Ordinal data | Fit an ordinal outcome as continuous, then properly, and compare | wrong-family-fit |
| 55 | Mixed models | Fit clustered data with and without random effects | cluster-icc-sim |
| 56 | Link function choice | Fit the wrong link and read the damage in the residuals | wrong-family-fit |
| 57 | Zero-inflation | Fit excess zeros with Poisson, then a zero-inflated model | wrong-family-fit |
| 58 | Too many predictors | Add predictors until in-sample fit is perfect and out-of-sample is worthless | wrong-family-fit |
| 59 | Interaction terms | Interpret a main effect in the presence of an interaction, and get it wrong | wrong-family-fit |
| 60 | Code and data sharing | Take a broken analysis and make it run for someone else | repro-repair |

Chapter 30, the Part 8 hub, gets the `review-triage` lesson: sort real reviewer
comments into the three outcomes before learning any single mechanism. It is the
natural first lesson, because triage is what a researcher does first.

### Three corrections to earlier parts of this plan

**Part G is out of date.** It lists all eight widgets as "New". All eight are
built and verified in `www/lesson-widgets/`: `assumption-dial`, `cluster-icc-sim`,
`dag-editor`, `multiplicity-sim`, `report-four-ways`, `repro-repair`,
`review-triage`, `wrong-family-fit`. The Cox fitter matches `survival::coxph` to
eight significant figures and the cluster standard errors match `sandwich` and
`lme4` exactly.

**Chapter 38 has no widget in Part B's table.** The mapping jumps from
assumptions (31-37) to the DAG group (39-42) and skips power analysis. The
existing `power-curve` widget covers it, so the gap costs nothing, but the table
in Part B should say so.

**Part E and Part F still count to eight.** "Lessons 2-8" and "Lessons 5-8" are
left over from the abandoned eight-lesson draft and contradict the thirty-lesson
decision recorded in Part B. Read them as "the free lesson, then the rest".

---

## Open questions

- Does the review simulator belong inside the lesson player, or is it a separate
  surface like the exercise hubs? Leaning separate: it is a different activity
  with a different session shape.
- Do the lessons get their own track landing, or sit inside the Researcher track
  proposed in `reviewer-2-course-plan.md`?
- Readiness score: one number, or two axes as Coaching Actuaries uses (difficulty
  reached and coverage mastered)? Two is harder to game and more informative.
