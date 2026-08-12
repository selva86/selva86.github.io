# Nurture personalization: who the user is decides what we send

The plan for collecting persona, role, and proficiency at signup, and for
turning the site's best content into nurture sequences matched to them.
Extends `email-program-v2.md` (s5-7) and the win-first funnel (P1 in
`free-user-onboarding-plan.md`). Email bodies live in `email-copy-book.md`
(3e, 5a, 5c); this file owns the questions, the schema, the mapping, and the
content queues. Every URL in the queues was verified against the repo on
2026-08-12; nothing here is invented (P3).

## 1. What we collect, exactly

Three screens, one tap each, all skippable. Wording is final unless the
owner edits.

**Screen 1: "What brings you to R?"** -> `users.persona`

| Option | Value |
|---|---|
| I am a student | `student` |
| I use data at work | `professional` |
| I am job hunting or switching careers | `jobseeker` |
| I do research (academia, science, medicine) | `researcher` |
| Just exploring | `explorer` |

**Screen 2 (professional and jobseeker only): "Which role fits best?"** -> `users.role`

| Option | Value | Plans as |
|---|---|---|
| Data Analyst | `analyst` | analyst |
| Data Scientist | `ds` | ds |
| ML Engineer | `mle` | mle |
| AI Engineer | `ai` | ai (ds-adjacent queue) |
| Product Manager | `pm` | pm |
| Other (type it) | `other` + `users.role_other` text | **ds** (owner decision 2026-08-12) |

**Screen 3: "Where are you right now?"** -> three one-tap rows

| Field | Options (stored value) |
|---|---|
| `users.level_r` | New to R (`new`) / I write basic scripts (`basic`) / Comfortable, use it regularly (`solid`) |
| `users.level_ml` | Haven't done ML (`none`) / Know the concepts (`concepts`) / Build models hands-on (`hands_on`) |
| `users.level_ts` | No time series work (`none`) / Some exposure (`some`) / Work with it regularly (`regular`) |

Skip on any screen stores NULL and never re-asks (the P1 rule). NULL
defaults at planning time: persona=`explorer`, role=`ds`, level_r=`basic`,
level_ml=`none`, level_ts=`none`.

## 2. When and where we ask

- **Not during auth.** Signup stays frictionless (magic link / OAuth, zero
  fields). The profiler is the post-auth step, merged with the win-first
  P1 goal screen so there is ONE onboarding moment, not two: screen 1 is
  the P1 goal confirm (pre-selected from signup_gate context: someone who
  signed up at a DA lesson wall sees "I use data at work" preselected),
  then screens 2-3.
- **New users:** immediately after first sign-in, before the redirect to
  their `?next=` destination. Three taps adds ~10 seconds; each screen has
  a visible "Skip" that proceeds instantly.
- **Existing users:** a one-time dismissible card on /dashboard.html
  ("30 seconds so the emails and recommendations actually fit you"), plus
  the same fields editable forever in the /account.html preference center.
- **Storage endpoint:** extend the existing profile update API with the
  six columns; hydrate back via /api/me so client surfaces can read them.

## 3. Schema (apply with the engine build, both DBs)

```sql
ALTER TABLE users ADD COLUMN persona TEXT;      -- student|professional|jobseeker|researcher|explorer
ALTER TABLE users ADD COLUMN role TEXT;         -- analyst|ds|mle|ai|pm|other
ALTER TABLE users ADD COLUMN role_other TEXT;   -- free text when role='other'
ALTER TABLE users ADD COLUMN level_r TEXT;      -- new|basic|solid
ALTER TABLE users ADD COLUMN level_ml TEXT;     -- none|concepts|hands_on
ALTER TABLE users ADD COLUMN level_ts TEXT;     -- none|some|regular
```

Columns, not profile_json: the email brain filters on these in SQL.

## 4. The mapping: profile -> nurture track

```
track = researcher                    if persona = researcher
      = student                       if persona = student
      = role (other -> ds)            if persona in (professional, jobseeker)
      = explorer                      if persona = explorer or NULL
```

**Modifiers, applied to any track:**

- `level_r = new`: the queue's first two slots are always nr-basics
  (R-Foundations-Basics-Course) and R-Beginner-Exercises, then the track
  queue continues. Nobody gets boosting emails who cannot write a loop.
- `level_ml = none` on ds/mle/ai: queue starts at the evaluation and
  classification end, advanced items (boosting, causal, anomaly) move to
  the back. `hands_on`: foundational items drop out entirely.
- `level_ts = regular`: every 3rd slot becomes a forecasting item from the
  TS overlay below. `some`: one TS item mid-queue. `none`: no TS.
- `persona = jobseeker`: interview overlay items are spliced into slots 2
  and 5 whatever the role track.
- Track switch any time via preference center; the ledger keys are per
  item, so no repeats after a switch.

## 5. The content queues (the site's best, verified)

Each item = one guided-tour email: subject, the hook the body opens with,
and the destination. Bodies follow the 5c template in the copy book; the
first issue of each track is fully written there. Queue order is the send
order; one item per week (Tuesdays), nurture category, strictly opt-in.

### Track: student

| # | Subject | Hook | Destination |
|---|---|---|---|
| 1 | Your first ten lines of R | Most courses start with theory. Write working code in the browser in minute one instead. | R-Foundations-Basics-Course.html |
| 2 | Twenty small wins | Beginner exercises with instant grading. The fastest way to make syntax stick. | R-Beginner-Exercises.html |
| 3 | Lists: where real data lives | Vectors are the toy version. Real datasets arrive as nested lists; here is how to take them apart. | R-Foundations-Structures-Course.html |
| 4 | Probability you can poke at | Distributions as interactive code, not formulas on a slide. | Probability-in-R-Exercises.html |
| 5 | The t-test, built from scratch | You will use it in every stats course. Build it yourself once and it stops being a black box. | T-Test-Course.html |
| 6 | dplyr: the five verbs | Filter, select, mutate, group, summarize. Ninety percent of data homework is these five. | Data-Wrangling-dplyr-Course.html |
| 7 | Your first real chart | The grammar of graphics, taught by building one plot properly. | ggplot2-Course.html |
| 8 | The whole-course workout | Exercises spanning everything so far. If these feel easy, you have leveled up. | R-for-Data-Science-Exercises.html |

### Track: analyst

| # | Subject | Hook | Destination |
|---|---|---|---|
| 1 | Import to insight, properly | The dplyr course starts where analyst work starts: messy files in, tidy tables out. | Data-Wrangling-dplyr-Course.html |
| 2 | The five-verb workout | Graded dplyr drills. Muscle memory for the verbs you will type every day. | dplyr-Exercises.html |
| 3 | Joins without fear | Left, inner, anti: which rows survive and why. The lesson that ends join guesswork. | Join-Reshape-Course.html |
| 4 | The cleaning gauntlet | Real-world messy data, one gauntlet. The single most job-like exercise set on the site. | Data-Cleaning-Gauntlet.html |
| 5 | EDA with a framework | Not "look at the data" but a repeatable one-variable-at-a-time method. | EDA-Course.html |
| 6 | Charts that survive review | ggplot2 from the grammar up, so edits stop being trial and error. | ggplot2-Course.html |
| 7 | When dplyr is too slow | data.table: same jobs, tenth of the runtime. Worth an afternoon. | data-table-Course.html |
| 8 | Tables people actually read | gt and flextable: report-ready tables straight from R, no Excel detour. | Report-Tables-Course.html |

### Track: ds

| # | Subject | Hook | Destination |
|---|---|---|---|
| 1 | Cross-validation, done honestly | Most model failures are evaluation failures. Start where the mistakes start. | R-Model-Evaluation-Course.html |
| 2 | kNN and the curse | Why distance stops meaning anything in high dimensions, and what that breaks. | R-Classification-Course.html |
| 3 | The ML workout | Graded machine learning exercises, end to end. | Machine-Learning-Exercises-in-R.html |
| 4 | Features beat algorithms | Encoding, leakage, target statistics: the course on the part that actually moves the metric. | R-Feature-Engineering-Course.html |
| 5 | Boosting from scratch | Build gradient boosting by hand once; xgboost's knobs stop being mysterious. | R-Gradient-Boosting-Course.html |
| 6 | Resampling problems | Bootstrap and permutation drills. The inference tool nobody taught you properly. | Resampling-Problems-in-R.html |
| 7 | Explain your model | Global vs local explanations, and when each one lies to you. | R-Interpretability-Course.html |
| 8 | Correlation, causation, decisions | Potential outcomes without the notation fog. Where senior DS work lives. | R-Causal-Inference-Course.html |

### Track: mle

| # | Subject | Hook | Destination |
|---|---|---|---|
| 1 | The ML system design checklist | The one-pager for "how would you productionize this?" Interviews and real life. | An-ML-System-Design-Checklist.html |
| 2 | Models rot. Plan for it | Monitoring and robustness as a playbook, not an afterthought. | A-Monitoring-and-Robustness-Playbook.html |
| 3 | Evaluation that survives production | CV strategies that match how the model will actually be hit. | R-Model-Evaluation-Course.html |
| 4 | Drift: reweight or retrain? | The decision framework for when the world shifts under your model. | Adapting-to-Drift-Reweighting-and-Retraining.html |
| 5 | The xgboost workout | Tuning drills on the model you will actually deploy. | XGBoost-Exercises-in-R.html |
| 6 | Nearest neighbors at scale | ANN indexes: the trick behind every recommender and vector store. | Approximate-Nearest-Neighbors-at-Scale.html |
| 7 | When inputs are hostile | Adversarial robustness: how models get gamed and what helps. | Adversarial-Robustness.html |
| 8 | Anomaly detection | What "anomaly" even means, then the methods that find them. | R-Anomaly-Detection-Course.html |

### Track: ai (AI Engineer; ds-adjacent, systems-leaning)

Slots 1-2 from mle (system design, monitoring), then interpretability,
anomaly, ANN-at-scale, boosting, evaluation, causal. **Honest gap, flagged
for curriculum: no LLM-in-R or GenAI content exists on the site yet; this
track leans on ML systems content until that exists.**

### Track: pm

| # | Subject | Hook | Destination |
|---|---|---|---|
| 1 | A/B testing, designed right | The lesson on experiment design: what to fix before anyone ships a variant. | AB-Testing-and-Experiment-Design.html |
| 2 | Power: the sample size question | "How long do we run it?" answered properly, by design not vibes. | R-Experimentation-Course.html |
| 3 | Which test do I need? | An interactive chooser: answer four questions, get the right test. Bookmark it. | tools/statistical-test-chooser.html |
| 4 | The A/B workout | Graded exercises on reading experiments: lift, significance, the traps. | AB-Testing-Exercises-in-R.html |
| 5 | Sample size, calculated | The calculator your data scientist uses, explained. | tools/sample-size-calculator.html |
| 6 | What a p-value buys you | And what it does not. The five-minute version that sticks. | tools/p-value-calculator.html |
| 7 | Matching and propensity | When you cannot randomize: causal answers from observational data. | R-Causal-Decisions-Course.html |
| 8 | EDA for decision-makers | A framework for interrogating a dataset before believing a dashboard. | EDA-Course.html |

### Track: researcher

| # | Subject | Hook | Destination |
|---|---|---|---|
| 1 | Design decides everything | RCT, cohort, case-control: what each design can and cannot claim. Chapter one for a reason. | Study-Design-Types-RCT-Cohort-Case-Control.html |
| 2 | Power by simulation | Skip the formula lookup: simulate your study and read the power off the curve. | Power-by-Simulation-in-R.html |
| 3 | The t-test, from scratch | Rebuild the test you use most, so reviewers' questions stop landing. | T-Test-Course.html |
| 4 | Reporting statistics, properly | The reporting conventions journals actually enforce, in one page. | Reporting-Statistics-in-R.html |
| 5 | Pre-registration in practice | OSF and AsPredicted, walked through for an R analysis. | Pre-Registration-for-R-Analysis.html |
| 6 | MCAR, MAR, MNAR | Missing data types decide your imputation rights. Get the diagnosis first. | Missing-Data-Types-in-R-MCAR-MAR-MNAR.html |
| 7 | Mixed models workout | Random effects drills: the method your repeated-measures data has been waiting for. | Mixed-Effects-Models-Exercises-in-R.html |
| 8 | Sample size, defensibly | The calculator plus the reasoning to defend the number in your methods section. | tools/sample-size-calculator.html |

### Track: explorer

No queue by default; weekly tour only if they opt in, drawn from the
all-time favorites: ggplot2-Recreation-Challenge, Regex-Drills-in-R,
The-Grammar-of-Graphics, Data-Cleaning-Gauntlet, T-Test-Course. Light
touch; the goal is a spark, not a syllabus.

### Overlay: time series (level_ts)

Time-Series-Exercises-in-R.html, ARIMA-Exercises-in-R.html,
Energy-Load-Forecasting-in-R.html, roadmap/forecaster.html (in that
order). `regular` = every 3rd slot; `some` = one item mid-queue.

### Overlay: interview (persona = jobseeker)

R-Interview-Questions.html (slot 2) and AB-Testing-Interview-Cases.html
(slot 5), whatever the role track.

## 6. What else the profile improves (beyond nurture)

- **Daily rep (5a)** picks its exercise from the track's hub ladder at the
  user's level instead of a generic pool.
- **10b orientation** reorders its three doors by persona.
- **Welcome PS line**: one persona-matched suggestion replaces the generic
  starting point.
- **Dashboard "next up"** module and the win-first P1 next-three plan read
  the same mapping. One brain, one mapping file.
- Intent emails name the track that matches their role when suggesting
  what Pro is for.

## 7. Engine integration

- The mapping and queues ship as `functions/_data/nurture-tracks.json`
  (generated from this file; the brain reads JSON, humans read this doc).
- Ledger keys: `tour:<track>:<n>` per item, `rep:<date>` unchanged. A
  track switch continues at the first unsent item of the new track.
- Queue exhausted = the tour goes quiet (no recycling, no filler). New
  content appends to the JSON and the tour resumes.
- All nurture is opt-in (consent category), one-brain rules apply, tour
  sends Tuesdays at the daily hour.

## 8. Build order (slots into email-program-v2 s10)

1. Schema columns (with the engine's schema step)
2. Profiler UI: extend the P1 goal screen to 3 screens; dashboard card for
   existing users; preference center fields
3. `nurture-tracks.json` + the mapping module in the brain
4. Guided tour sender (after the preference center, with rep + recap)
5. Later: level-aware rep ladder, dashboard next-up module

## 9. Open items for the owner

- Wording of the three screens (s1) - edit freely, values are stable.
- AI Engineer content gap: flagged for the curriculum roadmap (LLM/GenAI
  in R). Until then the ai track is systems-ML.
- Noticed while verifying slugs: BOTH `AB-Testing-Exercises-in-R.html` and
  `A-B-Testing-Exercises-in-R.html` exist as separate pages - probable
  duplicate worth a redirect decision, reported separately from this plan.
