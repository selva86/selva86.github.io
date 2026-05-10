# r-statistics.co Growth Plan: Phase A (1M/mo) + Phase B (5M/mo)

**Status:** active planning, Phase A execution underway, Phase B designed for month 19+
**Owner:** Selva Prabhakaran
**Last updated:** 2026-05-10
**Long-term target:** 5M monthly traffic over 48 months, solo operator
**Phase A target (months 1 to 18):** 1M monthly via 3,200 PSEO posts + 50 calculators + 55 cheatsheets + 260 comparisons + 60 interview posts + 500 cookbook recipes (~3,865 net new assets)
**Phase B target (months 19 to 48):** scale to 5M via calculator network expansion (50 -> 200), general statistics cluster (1,500 posts), glossary network (1,000 terms), YouTube (100 videos), newsletter (50K subs)

---

## Table of Contents

1. [Context](#context)
2. [Scope at a glance](#scope-at-a-glance)
3. [PSEO 14-category taxonomy](#pseo-14-category-taxonomy)
4. [Non-PSEO asset tracks](#non-pseo-asset-tracks)
5. [Status lifecycle and tracker design](#status-lifecycle-and-tracker-design)
6. [Ops items (10)](#ops-items-10)
7. [18-month roadmap summary (Phase A)](#18-month-roadmap-summary)
8. [Verification](#verification)
9. [File index](#file-index)
10. [Phase B: 5M expansion (months 19 to 48)](#phase-b-5m-expansion-months-19-to-48)

---

## Context

**Where we are.** r-statistics.co has 120 published tutorials, 27 live calculators at /tools/, a working publish pipeline (md2html.py + build.py + auto_link.py + sync_registries.py), and a 36-post PSEO seed with 0 published. Production capacity is proven; scope is the binding constraint.

**Where we want to be.**
- Phase A (month 18): 1M monthly visitors via the planned ~3,865-asset expansion
- Phase B (month 48): 5M monthly visitors via topic broadening (general stats), high-leverage assets (200+ calculators), glossary network, YouTube, newsletter

**Realistic distribution at 1M/mo:**
- 30 to 50 hero pages at 5K to 25K/mo (calculators + cornerstone tutorials)
- 300 to 500 mid pages at 500 to 2K/mo (Core tutorials, popular comparisons)
- 2,000 to 4,000 long-tail pages at 50 to 300/mo (PSEO + FR + cookbook + interview)

**R-only TAM caps at ~2M/mo.** R global search volume is ~5 to 10M/mo; even capturing 30 to 50% market share = 2M ceiling. Phase A reaches 1M (50% R market share, conservative). Phase B requires broadening into general statistics (TAM 50M+) and a calculator network (each calc 10K to 100K/mo) to clear 5M. Avoid Python content (saturated, doubles work) and Excel/Tableau (off-brand) per Phase B owner intent.

**Why this plan.** R-only TAM (~5 to 10M monthly searches globally) is too small to capture 5M from R alone, but big enough for 1M with strong execution. Phase A keeps R focus; Phase B broadens to general statistics, ML concepts (language-agnostic), and calculator network expansion where TAM is 50M+. PSEO covers the long-tail volume; calculators carry the transactional intent; cheatsheets and comparisons drive shares and backlinks; interview questions capture an evergreen, high-CTR niche.

**Operating constraints.**
- Sequential pipeline only (no parallel agents per project rule)
- v2 = quality default; v4 = speed opt-in
- No em-dashes anywhere (auto-stripped by md2html.py)
- Sidebar is hand-curated; PSEO posts skip sidebar; FR/PSEO link from parents via auto-link
- WebR is a competitive moat: never named in public-facing copy
- Trackers are write-by-pipeline, read-by-human

---

## Scope at a glance

| Track | Items | Source of truth | Status today |
|---|---|---|---|
| PSEO posts (14 categories) | 3,200 | `www/programmatic-seo.json` | 36 seeded, 0 published |
| Calculators (net new) | 50 | `Plans/PSEO/asset-tracker.json` | 28 already live (additive) |
| Cheatsheets | 55 | `Plans/PSEO/asset-tracker.json` | 1 live (ggplot2) |
| Comparison posts | 260 | `Plans/PSEO/asset-tracker.json` (canonical) + `categories/06-comparison.md` (cross-ref) | 0 |
| Interview-question posts | 60 | `Plans/PSEO/asset-tracker.json` | 0 |
| Cookbook recipes | 500 | `Plans/PSEO/asset-tracker.json` (canonical) + `categories/05-cookbook-recipe.md` (cross-ref) | 0 |
| **Total net-new assets** | **~3,865** | | |

Plus existing curriculum work (~1,260 planned Core/FR/EX posts in `Plan/r-statistics-co-curriculum-v7-ctr-and-meta.md`) continues in parallel.

---

## PSEO 14-category taxonomy

Each category maps to a parent cluster in the existing tutorial graph. Sub-cluster counts are summary-level; full slug enumeration lives in the per-category appendix.

### Category 1: Function-deep PSEO (900 posts)
**Template:** signature → purpose → arguments → 4 examples → common pitfalls → related functions → FAQ
**Parent clusters:** per-package (Data-Wrangling-With-dplyr.html, ggplot2-Tutorial-With-R.html, etc.)
**Why it wins:** highest exact-match volume on the entire surface; rivals rdocumentation.org which ships weak content.

| Sub-cluster | Posts | Parent |
|---|---|---|
| dplyr functions | 80 | Data-Wrangling-With-dplyr.html |
| tidyr functions | 30 | (tidyr parent) |
| ggplot2 functions (geoms + scales + themes + coords + facets) | 70 | ggplot2-Tutorial-With-R.html |
| stringr functions | 40 | (strings parent) |
| lubridate functions | 50 | (dates parent) |
| purrr functions | 50 | (functional programming parent) |
| forcats functions | 20 | (factors parent) |
| readr / readxl / haven functions | 50 | (I/O parent) |
| data.table functions | 40 | (data.table parent) |
| tibble functions | 15 | (tibble parent) |
| janitor functions | 20 | (cleaning parent) |
| glue functions | 10 | (strings parent) |
| broom functions | 15 | (modeling parent) |
| caret functions | 50 | (caret parent) |
| tidymodels family (parsnip, recipes, rsample, yardstick, tune, workflows) | 150 | (tidymodels parent) |
| Base R essentials (apply family, Reduce, Filter, do.call, etc.) | 200 | R-Tutorial.html |

See `categories/01-function-deep.md` for full slug list.

### Category 2: Error message PSEO (400 posts)
**Template:** error text verbatim → cause → minimal reproducer → fix → prevention rule
**Parent clusters:** map to topic parent (e.g., dplyr errors point to dplyr parent)
**Why it wins:** lowest competition niche on the entire site; ranks in days, not months. Underexploited by every major R education site.

| Sub-cluster | Posts |
|---|---|
| Base R errors | 120 |
| Tidyverse errors (dplyr, tidyr, purrr) | 80 |
| ggplot2 errors | 50 |
| Modeling errors (lm, glm, lme4, brms, survival) | 70 |
| I/O errors (readr, readxl, jsonlite, DBI) | 30 |
| Install / environment errors | 30 |
| Performance / memory errors | 20 |

See `categories/02-error-message.md` for full slug list.

### Category 3: Statistical test PSEO (250 posts)
**Template:** 5 framings per test (how-to, assumptions, interpretation, effect size, sample size)
**Parent:** Statistical-Tests-in-R.html
**Why it wins:** each framing equals distinct intent (e.g., "interpretation" is not the same query as "how to do"); keyword multiplier per concept.

50 tests covered: t-test variants (4), chi-square variants (3), ANOVA variants (4), correlation (3), regression types (10), nonparametric tests (8), normality + variance tests (5), time-series tests (5), categorical tests (4), Bayesian variants (4).

See `categories/03-statistical-test.md` for full enumeration.

### Category 4: Chart-type PSEO (140 posts)
**Template:** when to use → minimal code → 5 variants → customization → pitfalls
**Parents:** ggplot2-Tutorial-With-R.html, Top50-Ggplot2-Visualizations-MasterList-R-Code.html
**Why it wins:** Pinterest / Google Image bonus; high social share rate.

| Sub-cluster | Posts |
|---|---|
| Comparison charts (bar, lollipop, dot, dumbbell) | 25 |
| Distribution (histogram, density, violin, ridgeline, raincloud) | 20 |
| Correlation (scatter, bubble, jittered, hexbin, contour) | 15 |
| Composition (pie, donut, treemap, waffle, sunburst, mosaic) | 15 |
| Trend (line, area, stepped, slope, fan) | 15 |
| Statistical (Q-Q, P-P, residual, leverage, ACF, PACF, ROC, PR, calibration) | 20 |
| Time / spatial / network specialty | 30 |

See `categories/04-chart-type.md`.

### Category 5: Cookbook recipe PSEO (600 posts)
**Template:** problem statement → 1 canonical solution → 2 alternatives → benchmark → why
**Parents:** topic parents
**Why it wins:** Stack Overflow killer queries; very high CTR titles.

Subcategories spread across data import (25), cleaning (40), wrangling (80), strings (50), dates (50), aggregations (30), joins (25), reshape (20), sampling (20), viz (80), modeling (60), diagnostics (30), validation (25), tuning (20), export (20), reporting (25), debugging (15), performance (25), reproducibility (15), filesystem (15), API/web (15). 

Note: this is also where the canonical "cookbook" non-PSEO asset lives. `assets/cookbook.md` is the active list; `categories/05-cookbook-recipe.md` mirrors it for taxonomy purposes.

### Category 6: Comparison PSEO (250 posts)
**Template:** TL;DR table → use-case A → use-case B → benchmark → decision tree
**Parents:** topic parents
**Why it wins:** comparison queries have ~2x CTR of explanatory queries.

7 sub-types: same-package fn vs fn (60), cross-package fn vs fn (40), package vs package (30), method vs method (50), concept vs concept (40), R vs Python by task (30), file format vs format (10).

Canonical list at `assets/comparisons.md`; this category file is a cross-reference.

### Category 7: Dataset-driven PSEO (120 posts)
**Template:** dataset intro → 6 standard tasks (EDA, viz, regression, classification, clustering, time-series if applicable) → exportable code
**Parents:** topic parents
**Why it wins:** captures students searching specific datasets they were assigned.

15 datasets x 8 tasks: mtcars, iris, diamonds, gapminder, nycflights13, airquality, Boston, titanic, ChickWeight, USArrests, faithful, sunspots, AirPassengers, BJsales, ToothGrowth.

See `categories/07-dataset-driven.md`.

### Category 8: ML algorithm PSEO (150 posts)
**Template:** 5 framings per algorithm (implementation, hyperparameter tuning, interpretation, visualization, vs alternative)
**Parent:** Machine-Learning parent
**Why it wins:** algorithm names are evergreen high-volume keywords with clear commercial intent.

30 algorithms: linear/logistic/Poisson/multinomial/ordinal regression, Ridge/Lasso/Elastic Net, decision tree, random forest, XGBoost, LightGBM, CatBoost, SVM, k-NN, naive Bayes, k-means, hierarchical, DBSCAN, GMM, PCA, ICA, t-SNE, UMAP, isolation forest, one-class SVM, autoencoder, neural network, ARIMA, prophet, hidden Markov, Cox PH.

### Category 9: Regex / pattern PSEO (80 posts)
**Template:** pattern → R one-liner → variants → traps
**Parent:** strings / regex parent
**Why it wins:** "regex for X" queries are evergreen and underserved by R-specific content.

### Category 10: Date / time recipe PSEO (80 posts)
**Template:** task → lubridate way → base R way → edge cases (DST, leap years, timezones)
**Parent:** dates parent
**Why it wins:** dates are the single biggest source of beginner confusion in R; high commercial-ish intent.

### Category 11: Type conversion PSEO (50 posts)
**Template:** from-type → to-type → 1-liner → 4 gotchas
**Parent:** R-Tutorial.html
**Why it wins:** tiny niche, near-zero competition, 100% query intent match.

### Category 12: Beginner FAQ PSEO (60 posts)
**Template:** question → 200-word answer → 3 supporting examples → CTA to deep tutorial
**Parent:** R-Tutorial.html
**Why it wins:** top-of-funnel; brings net-new audience to the site.

Examples: "Is R hard to learn?", "What is R used for?", "Difference between R and RStudio", "How to install R packages", "Best R IDE", "R vs Python for data science", "How long does it take to learn R?".

### Category 13: Time-series specific PSEO (80 posts)
**Template:** task → ts class setup → forecast wrapper → diagnostic
**Parent:** Time-Series-Analysis-With-R.html
**Why it wins:** niche but high commercial intent (finance, ops research).

### Category 14: ML metrics and evaluation PSEO (50 posts)
**Template:** metric → formula → R implementation → interpretation → vs alternative
**Parent:** ML parent
**Why it wins:** interview-prep traffic; pages serve both candidates and practitioners.

---

## Non-PSEO asset tracks

### Calculators (50 net new, 78 total)
Existing 28 cover the cornerstones (t-test, chi-square, A/B, bootstrap CI, Bayes factor, ROC AUC, etc.). Net new fills the gaps in:
- Distribution probability calculators (15: normal, binomial, Poisson, t, F, chi-square, beta, gamma, exponential, uniform, lognormal, Weibull, negative binomial, geometric, hypergeometric)
- Inferential test calculators not yet covered (15)
- Power / sample size calculators (5)
- Diagnostic and agreement calculators (5)
- Effect size and interval extras (5)
- Time-series tests (4)
- Model selection (3)
- Visual sims / experiences (6: CLT animator, bootstrap visualizer, k-fold CV simulator, MCMC convergence, posterior updater, p-hacking simulator)

**Each calculator ships paired with a 1500-word companion "X Calculator Guide" Core post** (per ops item #9). Calculator captures transactional intent; companion captures informational. 50 calculators = 50 calculators + 50 companion posts = 100 net new pages.

See `assets/calculators.md` for full list.

### Cheatsheets (55 total)
PDF + HTML + dark-mode PNG per sheet. Embed in topic posts; release on Twitter / Reddit. Each cheatsheet equals a backlink magnet.

11 clusters: Tidyverse (8), Visualization (6), Statistics (7), ML (6), Time series (4), Bayesian (4), Engineering (7), Reporting (4), Reference (5), Specialized (4).

See `assets/cheatsheets.md`.

### Comparison posts (260)
Shared with PSEO category 6; canonical list at `assets/comparisons.md`. Treated as its own track because comparisons need deeper writing than templated PSEO (benchmarks, decision tables).

### Interview-question posts (60)
Each post houses 30 to 50 questions with R code, model answers, common-mistake call-outs. Organized 3 ways: by role/level (9), by topic (17), by format (9), plus 5 specials and several CTR bait pages ("100 R interview questions", "Hardest R interview questions").

See `assets/interview-questions.md`.

### Cookbook recipes (500)
Shared with PSEO category 5; canonical list at `assets/cookbook.md`. Treated as its own track because recipes drive the highest CTR / dwell-time metrics on the site (single-task focus).

---

## Status lifecycle and tracker design

**Lifecycle (uniform across all 3 trackers):**
```
not_started → demand_validated → drafted → review → published → needs_refresh → deprecated
```

**Three tracker files:**

| File | Covers | Committed | Pipeline coupling |
|---|---|---|---|
| `www/programmatic-seo.json` | All 3,200 PSEO posts | yes | sync_pseo_to_links.py, /publish-post |
| `curriculum-status.json` | Core, FR, EX, comparisons, calculator companions (~700) | no (gitignored) | /publish-post |
| `Plans/PSEO/asset-tracker.json` | Calculators, cheatsheets, interview, cookbook (~1,400) | yes | new asset publish playbook |

**Per-entry fields (uniform across all 3):**
```yaml
status:           one of 7 lifecycle states
category_id:      "function-deep" | "error-message" | "calculator" | "cheatsheet" | etc.
subcategory_id:   e.g. "dplyr-functions"
slug:             URL-derived
published_date:   ISO date or null
last_modified:    auto from git mtime, computed at audit time
last_reviewed:    when refresh audit last touched it
demand_validated:
  date:           ISO timestamp
  suggest_pass:   bool
  paa_pass:       bool
  serp_pass:      bool
  dedupe_pass:    bool
word_count:       auto from md2html
traffic_30d:      optional, GA-populated
```

**Top-level additions to `programmatic-seo.json`:**
- `slug_registry`: flat array of every slug across all series, drives dedupe gate
- `category_meta`: 14-category index with parent_post + total + status counts

**Auto-update hooks (no manual tracking):**
- `/publish-post` → writes `status=published`, `published_date`, `word_count`
- `Scripts/refresh_audit.py` → writes `last_reviewed`, optionally flips `status=needs_refresh`
- `Scripts/validate_pseo.py` → writes `demand_validated` block

**Trackers are write-by-pipeline, read-by-human.** Per `feedback_publishing_pipeline` and `project_sidebar_handcurated` rules, hand-edited trackers go stale; this design avoids that failure mode by construction.

---

## Ops items (10)

Detailed specs in `ops/` directory. Summary table:

| # | Item | Spec file | Tier |
|---|---|---|---|
| 1 | `/write-pseo-v2` skill | `ops/pipeline-spec.md` | must |
| 2 | Demand-validation pre-flight (`Scripts/validate_pseo.py`) | `ops/pipeline-spec.md` | must |
| 3 | Batch orchestrator (`Scripts/pseo_batch.py`) | `ops/pipeline-spec.md` | must |
| 4 | Slug registry / dedupe index | `ops/pipeline-spec.md` | must |
| 5 | Cluster-aware sibling linking | `ops/linking-and-schema.md` | should |
| 6 | Schema markup auto-injection | `ops/linking-and-schema.md` | should |
| 7 | Refresh cadence (`Scripts/refresh_audit.py`) | `ops/refresh-policy.md` | should |
| 8 | PSEO quality gate (`Scripts/pseo_quality_check.py`) | `ops/pipeline-spec.md` | must |
| 9 | Calculator + companion-post pairing | `ops/refresh-policy.md` | should |
| 10 | 18-month roadmap and capacity model | `ops/roadmap-18mo.md` | must |

---

## 18-month roadmap summary

Detail in `ops/roadmap-18mo.md`. Shape:

| Phase | Months | PSEO output | Asset output | Cumulative |
|---|---|---|---|---|
| Foundation | 1 to 2 | 0 (build pipeline) | 5 calculators + 5 cheatsheets | 10 assets, ~30K/mo traffic |
| Wave 1 (function-deep dplyr/tidyr/ggplot2) | 3 to 5 | 180 | 10 calc + 5 sheets + 10 interview | 215, ~75K/mo |
| Wave 2 (errors + cookbook batch 1) | 6 to 8 | 350 | 10 calc + 10 sheets + 20 interview + 100 cookbook | 695, ~150K/mo |
| Wave 3 (stat tests + chart types + base R) | 9 to 11 | 500 | 10 calc + 10 sheets + 100 cookbook + 100 comparisons | 1,415, ~280K/mo |
| Wave 4 (ML algos + dataset + cookbook batch 2) | 12 to 14 | 600 | 10 calc + 15 sheets + 200 cookbook + 100 comparisons | 2,340, ~500K/mo |
| Wave 5 (regex + dates + types + FAQ + remainder) | 15 to 16 | 800 | 5 calc + 10 sheets + 100 cookbook + 60 comparisons + 30 interview | 3,345, ~750K/mo |
| Wave 6 (long-tail completion + refresh round 1) | 17 to 18 | 770 | refresh sweep | 4,115, ~1M/mo target |

Sustained cadence: months 3 to 18 average ~210 PSEO + ~30 assets per month.

---

## Verification

Plan execution is "done" when:

1. **File presence:** all 25 plan files exist under `Plans/PSEO/`
2. **PLAN.md scannable:** TOC links work, opens in <5s, under 700 lines
3. **Slug counts match (±5%):** category appendix slug counts within 5% of plan
4. **Tracker valid:** `asset-tracker.json` parses; every entry has 7 required fields
5. **36 PSEO re-categorized:** every post in `programmatic-seo.json` has `category_id` and `subcategory_id`
6. **No duplicate slugs:** `slug_registry` is unique
7. **Cross-reference integrity:** every parent_post referenced exists as published HTML
8. **Roadmap math:** monthly targets in `roadmap-18mo.md` sum to ~3,865 over 18 months

---

## File index

```
Plans/PSEO/
├── PLAN.md                              ← THIS FILE
├── asset-tracker.json                   ← unified tracker for non-PSEO assets
├── Goals.txt                            ← original recommendation seed
├── categories/
│   ├── 01-function-deep.md              ← 900 PSEO slugs, 16 sub-clusters
│   ├── 02-error-message.md              ← 400 PSEO slugs, 7 sub-clusters
│   ├── 03-statistical-test.md           ← 250 PSEO slugs, 50 tests x 5 framings
│   ├── 04-chart-type.md                 ← 140 PSEO slugs, 7 sub-clusters
│   ├── 05-cookbook-recipe.md            ← 600 PSEO slugs (cross-ref to assets/cookbook.md)
│   ├── 06-comparison.md                 ← 250 PSEO slugs (cross-ref to assets/comparisons.md)
│   ├── 07-dataset-driven.md             ← 120 PSEO slugs, 15 datasets x 8 tasks
│   ├── 08-ml-algorithm.md               ← 150 PSEO slugs, 30 algorithms x 5 framings
│   ├── 09-regex-pattern.md              ← 80 PSEO slugs
│   ├── 10-date-time.md                  ← 80 PSEO slugs
│   ├── 11-type-conversion.md            ← 50 PSEO slugs
│   ├── 12-beginner-faq.md               ← 60 PSEO slugs
│   ├── 13-time-series.md                ← 80 PSEO slugs
│   └── 14-ml-metrics.md                 ← 50 PSEO slugs
├── assets/
│   ├── calculators.md                   ← 50 net-new calculators + companion posts
│   ├── cheatsheets.md                   ← 55 cheatsheets
│   ├── comparisons.md                   ← 260 comparison posts (canonical)
│   ├── interview-questions.md           ← 60 interview Q post specs
│   └── cookbook.md                      ← 500 recipes (canonical)
└── ops/
    ├── pipeline-spec.md                 ← items #1-#4, #8 (skill, validators, batch, dedupe, quality)
    ├── linking-and-schema.md            ← items #5, #6 (sibling linking, JSON-LD)
    ├── refresh-policy.md                ← items #7, #9 (refresh, calculator companions)
    └── roadmap-18mo.md                  ← item #10 (capacity, RICE, monthly targets)
```

**Cross-references:**
- `Plan/r-statistics-co-curriculum-v7-ctr-and-meta.md` (existing master curriculum, runs in parallel)
- `_build/frontmatter-spec.md` (frontmatter source of truth)
- `CLAUDE.md` (project rules: sidebar hand-curated, no em-dash, no parallel agents, no WebR mention)
- `www/programmatic-seo.json` (live PSEO queue)
- `www/links.json` (auto-link registry, FR mappings)
- `www/sidebar.json` (hand-curated)
- `tools/index.html` (existing 27 tool listings; index.html itself is the listing page, not a tool)

---

## Phase B: 5M expansion (months 19 to 48)

### Status

**Designed (this round), not executed.** Phase B execution starts month 19 after a planning sprint at month 17 to 18 informed by Phase A traffic data. This section is the high-level navigation; detailed appendix files (`Plans/PSEO/phase-b/`) get created during the planning sprint.

### Why a separate phase

R-only TAM caps at ~2M/mo. Phase A ships R-focused content to capture 1M (50% R market share, conservative). Reaching 5M requires:
- Topic broadening (general statistics, language-agnostic) without abandoning the R audience
- High-leverage assets (calculator network expansion to 200+, since each calculator can hit 10K to 100K/mo)
- Solo-viable scope (no contractors per locked owner intent)

Phasing avoids over-committing scope before Phase A teaches us which categories actually rank. Phase B priorities will be refined at month 17 to 18 based on Phase A traffic data.

### Phase B scope (5 priority tracks)

| Track | Net new | Months | Cadence (solo) |
|---|---|---|---|
| Calculator expansion (50 -> 200) + companions | 300 (150 calcs + 150 companion posts) | 19 to 42 | 1 calc + 1 companion per week |
| General statistics cluster (language-agnostic) | 1,500 posts | 24 to 42 | 3 to 4 posts per week |
| Glossary network | 1,000 terms | 24 to 36 | 2 to 3 terms per day |
| YouTube channel (mirror top tutorials) | 100 videos | 24 to 48 | 1 video per week |
| Newsletter (50K subs target) | email list | 24 to 48 | 30 to 60 min digest per week |

**Total Phase B content:** ~2,900 pages + 100 videos + 50K subs = compounding traffic floor.

### Phase B trajectory

| Month | State | Traffic estimate |
|---|---|---|
| 18 | Phase A complete; ~3,865 assets shipped | 1M/mo |
| 24 | Phase B Track 1 (calc) at 80 net new + companions; refresh round 1 | 1.5M/mo |
| 30 | Calc at 130; stats cluster at 300; glossary at 200 | 2.5M/mo |
| 36 | Calc at 180; stats at 800; glossary at 600; YouTube at 50 | 3.5M/mo |
| 42 | Tracks 1, 2, 3 complete; newsletter at 30K subs | 4.5M/mo |
| 48 | Refresh round 2 + compounding + YouTube at 100 + newsletter at 50K | 5M/mo target |

### What Phase B AVOIDS (locked decisions)

- **Python content:** saturated market (Real Python, TDS, GeeksforGeeks); doubles work for halved quality
- **Excel / Tableau / Power BI:** off-brand, requires new toolchains, dilutes positioning
- **More cookbook recipes beyond 1,000:** diminishing returns; cannibalizes existing recipes
- **Domain pivot:** loses 5+ years accumulated authority; soft tagline change only
- **Hiring contractors:** locked owner constraint (solo throughout)

### Why calculators dominate Phase B priority

Statology's top 10 calculators each pull 100K+/mo. CalculatorSoup's top calculators pull 500K+/mo. Math:
- 200 calculators x average 25K/mo = **5M/mo from calculators alone**

The calculator track is sufficient on its own to hit 5M; everything else is risk reduction and compounding floor. This is the highest-leverage scope decision in the entire plan.

### Phase B planning sprint deliverables (month 17 to 18)

To be created during the sprint (not now):
- `Plans/PSEO/phase-b/PLAN.md` (Phase B master plan, like this file is for Phase A)
- `Plans/PSEO/phase-b/calculators-150.md` (150 net-new calculator slug list with target keywords)
- `Plans/PSEO/phase-b/general-stats-1500.md` (1,500 stats topics across 10 sub-clusters)
- `Plans/PSEO/phase-b/glossary-1000.md` (1,000 terms with definitions outline)
- `Plans/PSEO/phase-b/youtube-roadmap.md` (which 100 tutorials to video-mirror, in priority order)
- `Plans/PSEO/phase-b/newsletter-strategy.md` (lead magnets, welcome sequence, weekly digest format)
- `programmatic-seo.json` extended with Phase B series (or new `phase-b-tracker.json` if separation cleaner)
- `asset-tracker.json` extended with Phase B calculator + glossary entries

### Phase B risks and mitigations

| Risk | Mitigation |
|---|---|
| Solo capacity ceiling reached | Drop YouTube track if hard; other tracks solo-viable. |
| Calculator track underperforms (Track 1 fails to rank by month 24) | Double down on stats cluster (Track 2) and glossary instead. |
| General-stats content cannibalizes R rankings | Keep R-tagged URLs distinct from general-stats URLs; different sidebar sections. |
| Brand confusion (R-only vs broader stats audience) | Soft-pivot only: tagline change ("statistics, with R when needed"), not URL or domain change. |
| Newsletter list growth stalls | At 10K subs, evaluate paid tier or sponsored newsletter for revenue diversification. |
| Refresh debt accumulates faster than ship rate | Hard cap: 1 refresh per 4 new posts. If exceeded, slow new-ship cadence. |

### Phase B execution gate

Phase B execution starts ONLY when:
- Phase A is at least 80% shipped (~3,100 of 3,865 assets live)
- Phase A monthly traffic is at least 700K (signal that Phase A trajectory is on track)
- Phase B planning sprint is complete (all deliverables above)

If Phase A traffic at month 18 is significantly below 700K, do a Phase A debugging sprint instead of starting Phase B; understand why Phase A didn't hit the curve before adding Phase B scope.
- `Plans/codeblocktitles/` (parallel project, unrelated)
