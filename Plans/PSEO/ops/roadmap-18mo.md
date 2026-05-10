# Ops Spec: 18-Month Roadmap and Capacity Model

Covers ops item 10 (must-have).

---

## Total scope (recap)

| Track | Items |
|---|---|
| PSEO posts (14 categories) | 3,200 |
| Calculators (net new) | 50 |
| Calculator companion posts (net new + backfill) | 78 |
| Cheatsheets (net new) | 54 |
| Comparison posts | 250 (overlaps PSEO category 06) |
| Interview-question posts | 60 |
| Cookbook recipes | 500 (overlaps PSEO category 05) |
| **Net-new asset count** (after dedupe) | ~3,892 |

(Comparisons and cookbook are PSEO categories; they're counted in the 3,200, so the asset-only additions are 50 + 78 + 54 + 60 = 242 distinct artifacts on top of the 3,200 PSEO.)

---

## Throughput model

### Per-asset effort estimates (post `/write-pseo-v2` skill is built)

| Asset type | Effort per item (hours, end-to-end) | Per week capacity (1 author + skill) |
|---|---|---|
| PSEO (function-deep, regex, type-conv, beginner FAQ) | 0.3 (skill writes; human reviews 5 min) | 100 to 130 |
| PSEO (errors, dataset, time-series, ML metrics) | 0.4 | 80 to 100 |
| PSEO (statistical test, chart-type, ML algo) | 0.5 | 60 to 80 |
| Cookbook recipe | 0.4 | 80 to 100 |
| Comparison post | 1.5 (deeper, needs benchmarks) | 25 to 30 |
| Calculator | 8 to 16 (interactive UI build) | 1 |
| Calculator companion (1500 words) | 2 (manual write or skill) | 15 to 20 |
| Cheatsheet (HTML + PDF + 2 PNGs) | 6 to 10 | 1 to 2 |
| Interview-question post (50 questions, deep) | 8 to 12 | 1 to 2 |

### Sustained cadence (1 author + tooling)

Realistic monthly output assuming the pipeline is built (months 1 to 2):

| Asset | Monthly target |
|---|---|
| PSEO posts | 200 to 240 |
| Calculators (with companions) | 4 |
| Cheatsheets | 4 |
| Comparison posts | 12 |
| Interview-question posts | 4 |

That's ~225 PSEO + ~24 non-PSEO = ~250 net new pages / month.

3,892 / 250 = ~15.5 months at sustained cadence. Adding 2 months pipeline build = ~17.5 months total. Plan target: 18 months.

---

## Wave plan (18 months)

### Phase 0: Foundation (months 1 to 2)

**Goal:** ship pipeline tooling. Almost no content output.

Build:
- `/write-pseo-v2` skill + 14 category templates
- `Scripts/validate_pseo.py`
- `Scripts/pseo_batch.py` + `Scripts/pseo_publish_batch.py`
- `slug_registry` field in `programmatic-seo.json` + dedupe gate
- `Scripts/pseo_quality_check.py`
- `inject_sibling_block()` extension to `auto_link.py`
- JSON-LD schema injection in `build.py`
- `Scripts/refresh_audit.py` (skeleton, doesn't run yet)
- `Scripts/orphan_check.py`

Content shipped:
- 5 calculators (high-priority gaps: normal, binomial, Poisson, t, F distribution calculators)
- 5 calculator companions
- 5 cheatsheets (dplyr, tidyr, stringr, lubridate, ggplot2 PDF/PNG release)

Cumulative: 15 net-new assets. Site at ~30K monthly traffic baseline.

### Wave 1: Function-deep (dplyr/tidyr/ggplot2) (months 3 to 5)

**Goal:** ship the highest-volume function-deep cluster first. dplyr/tidyr/ggplot2 are searched 10x more than other R packages.

Content:
- 80 dplyr function pages
- 30 tidyr function pages
- 70 ggplot2 function pages
- 10 calculators (test calculators: z-test, Welch, Mann-Whitney, etc.)
- 10 companions
- 5 cheatsheets (test decision tree, regression tree, distributions, etc.)
- 10 interview-question bait pages (8 bait + 2 role-level)

Total: 215 net new. Cumulative: 230.

Expected traffic: 75K/mo by end of month 5.

### Wave 2: Errors + cookbook batch 1 (months 6 to 8)

**Goal:** errors are SEO sweet spot (low competition, fast ranking). Pair with cookbook batch 1 (highest-volume tasks).

Content:
- 400 error message pages (entire category 02)
- 100 cookbook recipes (data import + cleaning + wrangling subset = top 100 by volume)
- 10 calculators (effect size, agreement, intervals)
- 10 companions
- 10 cheatsheets (ANOVA, post-hoc, classification metrics, regression metrics, etc.)
- 20 interview-question posts (most by-topic)

Total: 550 net new. Cumulative: 780.

Expected traffic: 150K/mo.

### Wave 3: Stat tests + chart types + base R (months 9 to 11)

Content:
- 250 statistical test pages
- 140 chart-type pages
- 100 base R essentials (function-deep)
- 100 cookbook recipes (visualization + modeling subset)
- 100 comparison posts (priority sub-types: package vs package + method vs method)
- 10 calculators (time-series + model selection + visual sims)
- 10 companions
- 10 cheatsheets

Total: 720 net new. Cumulative: 1,500.

Expected traffic: 280K/mo.

### Wave 4: ML algos + datasets + cookbook batch 2 (months 12 to 14)

Content:
- 150 ML algorithm pages
- 120 dataset-driven pages
- 200 cookbook recipes (strings + dates + aggregations + joins + reshape + sampling)
- 100 comparison posts (R vs Python by task + concept vs concept)
- 50 base R essentials (rest of base R category)
- 10 calculators
- 10 companions
- 15 cheatsheets (engineering, reporting, specialized)

Total: 655 net new. Cumulative: 2,155.

Expected traffic: 500K/mo.

### Wave 5: Long-tail completion (months 15 to 16)

Content:
- 80 regex/pattern pages
- 80 date/time recipe pages
- 50 type-conversion pages
- 60 beginner FAQ pages
- 80 time-series specific pages
- 50 ML metrics pages
- 50 comparison posts (remaining sub-types)
- 20 base R essentials
- 5 calculators
- 5 companions
- 10 cheatsheets
- 25 interview-question posts (remaining)
- Cookbook batch 3 (remaining 100 recipes)

Total: 615 net new. Cumulative: 2,770.

Expected traffic: 750K/mo.

### Wave 6: Refresh + remaining (months 17 to 18)

Content:
- Function-deep remaining: stringr, lubridate, purrr, forcats, readr, data.table, tibble, janitor, glue, broom, caret, tidymodels = ~750 posts (not all in one wave; the bulk shipped in earlier waves)
- Refresh audit Round 1: ~100 stale posts updated
- Backfill calculator companions for original 28 live calculators
- Bait page round 2 (year-end interview season demand)

Total: ~870 net new + 100 refreshed. Cumulative: ~3,800 net new at month 18.

Expected traffic: 1M/mo target.

---

## Cumulative scope chart

| Month | PSEO cumulative | Calculator | Cheatsheet | Comparison | Interview | Cookbook | Total | Traffic est |
|---|---|---|---|---|---|---|---|---|
| 0 (today) | 0 | 28 | 1 | 0 | 0 | 0 | 29 | 30K |
| 2 | 0 | 33 | 6 | 0 | 0 | 0 | 39 | 30K |
| 5 | 180 | 43 | 11 | 0 | 10 | 0 | 244 | 75K |
| 8 | 580 | 53 | 21 | 0 | 30 | 100 | 784 | 150K |
| 11 | 1080 | 63 | 31 | 100 | 30 | 200 | 1,504 | 280K |
| 14 | 1500 | 73 | 46 | 200 | 30 | 400 | 2,249 | 500K |
| 16 | 1900 | 78 | 56 | 250 | 55 | 500 | 2,839 | 750K |
| 18 | 3200 | 78 | 56 | 250 | 60 | 500 | 4,144 | 1M |

(Numbers are cumulative net new. Existing 120 published tutorials and 28 calculators not double-counted.)

---

## RICE prioritization framework (used during waves)

When in-wave priority is unclear, score with RICE:

`RICE = (Reach x Impact x Confidence) / Effort`

| Factor | Definition | Scale |
|---|---|---|
| Reach | Estimated monthly searches captured (from validate_pseo.py PAA + Suggest + (when available) DataForSEO volume) | 0 to 50,000 |
| Impact | Conversion to a tracked goal (newsletter signup, calculator use, share) | 0.25 / 0.5 / 1 / 2 / 3 |
| Confidence | Have we shipped similar content + does it rank? | 0 to 1 |
| Effort | Hours from /write-pseo-v2 to publish | 0.3 to 16 |

Within a wave, sort the candidate slug list by RICE descending. Ship top-RICE first.

---

## Capacity model (sensitivities)

### If 1 author full-time + skill works at expected throughput
- ~250 net new / month
- 18 months to 1M target

### If 2 authors full-time + skill works
- ~450 net new / month (some sequential bottlenecks at review)
- 12 months to 1M target

### If skill underperforms (15 min/post instead of 8)
- ~120 net new / month
- 28 months to 1M target

### If demand validation rejects 30% of slugs
- Effective scope = 3,200 x 0.7 = 2,240 PSEO
- Reach lower at 1M; need to expand into new categories (secondary topics like Python stats, Excel-to-R migration content)

---

## Review SLAs

To prevent the review queue from becoming the bottleneck:

| Asset type | Author -> reviewer turnaround | Reviewer SLA |
|---|---|---|
| PSEO post | same day staged | within 24h |
| Cookbook recipe | same day staged | within 24h |
| Comparison post | within 1 day | within 48h |
| Calculator | demo build first, then review | within 1 week |
| Cheatsheet | first draft, design pass, final | within 1 week |
| Interview-question post | drafted in 2 batches | within 1 week per batch |

Reviewer = author themself if solo. SLAs apply to "doesn't go into queue rot for >7 days", not literal turnaround.

---

## Stretch goals (months 19 to 24, if budget extends)

If after month 18 traffic is still climbing toward 1M+, the next 6 months ship:

- Specialized tracks: Bioinformatics, Geospatial, Survival Analysis, Causal Inference (each ~100 posts)
- Free certification quiz system (10 quizzes, 50 questions each)
- Newsletter relaunch and growth engine
- YouTube channel with paired video content for top 50 cornerstone tutorials
- Translation: top 200 pages translated to Spanish + Portuguese + Hindi (high R user populations)

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Skill produces low-quality output | Quality gate (`pseo_quality_check.py`) blocks publish; per-category templates iterated |
| Demand validation rejects too many | Track rejection rate; if >40%, plan adjusts to add more secondary topics |
| Google algorithm update penalizes thin PSEO | Mitigation: every page meets 800-word + visual + FAQ + ≥5 internal-links bar; we're not thin |
| Author burnout | Sequential pipeline + skill caps daily new-content time at ~3 hours; rest is review and tooling |
| Refresh queue grows unbounded | Quarterly cap (only 1 quarter cohort touched per audit), 6-month frequency cap per post |
| Calculator UI library deprecates | Pin React/dependencies; quarterly UI audit |
| Sidebar becomes unwieldy as Core posts grow | Sidebar is hand-curated per `project_sidebar_handcurated`; PSEO posts skip sidebar by design |

---

## Tracking the roadmap

Roadmap progress tracked weekly via `Plans/PSEO/roadmap-progress.md` (regenerated by `Scripts/roadmap_status.py`):

```bash
python Scripts/roadmap_status.py
# Outputs: cumulative counts vs plan, current wave, on-track/behind/ahead
```

Inputs:
- `programmatic-seo.json` (PSEO state)
- `curriculum-status.json` (Core/FR/EX state)
- `Plans/PSEO/asset-tracker.json` (calculator/cheatsheet/interview state)

Output written to `Plans/PSEO/roadmap-progress.md`. Auto-regenerates on commit via pre-commit hook (optional).
