# Exercises Hub Catalog — r-statistics.co

**Goal:** Build a search-driven library of interactive practice hubs that targets keywords with proven monthly demand, using the same scenario-based, hidden-solution format proven on `dplyr-Exercises-in-R`.

**Target:** 70 hubs over 18 weeks. Projected 100-200K incremental monthly traffic at maturity (12 months post-publish).

**Format spec (per hub):**
- 50 exercises (Tiers 1-2), 30 (Tiers 3-4), 20 (Tiers 5-6)
- 6 sections, mostly intermediate difficulty (~20% beginner, 60% intermediate, 20% advanced)
- Real-world scenario framing (analyst, jeweller, trading desk, compliance, etc.)
- Built-in datasets only (mtcars, iris, diamonds, economics, faithful, ChickWeight, airquality) + small inline tibbles
- Solutions hidden in `<details>` blocks
- post_type: `EX`, sidebar listed in Practice Exercises section
- Slug pattern: `<Topic>-Exercises-in-R.html` (or appropriate keyword form for non-package hubs)

---

## Tier 1 — Blockbusters (10 hubs, ship first)

Ship in this order. Each can plausibly pull 5-15K monthly visits at decent rankings.

| # | Hub slug | Target keyword | Rationale |
|---|---|---|---|
| 1 | dplyr-Exercises-in-R | dplyr exercises | DONE 2026-05-11 |
| 2 | ggplot2-Exercises-in-R | ggplot2 exercises, ggplot2 practice | Most-used viz package, weak SERP |
| 3 | R-Interview-Questions | R interview questions, R coding interview | Job-market hub, massive intent |
| 4 | tidyverse-Exercises-in-R | tidyverse exercises, tidyverse practice | Umbrella term, captures cross-package |
| 5 | Data-Wrangling-Exercises-in-R | data wrangling in R exercises | Generic high-intent fallback |
| 6 | data.table-Exercises-in-R | data.table exercises | Underserved, devoted audience |
| 7 | Linear-Regression-Exercises-in-R | linear regression R exercises | Stats-class evergreen |
| 8 | Machine-Learning-Exercises-in-R | machine learning R exercises | Career-pivot search |
| 9 | EDA-Exercises-in-R | EDA in R, exploratory data analysis R | First step every analyst does |
| 10 | R-for-Data-Science-Exercises | R for data science exercises, R4DS practice | Tied to most-cited R book |

## Tier 2 — High-volume packages and topics (15 hubs)

| # | Hub slug | Target keyword |
|---|---|---|
| 11 | tidyr-Exercises-in-R | tidyr exercises, pivot in R |
| 12 | stringr-Exercises-in-R | stringr exercises, regex in R exercises |
| 13 | lubridate-Exercises-in-R | lubridate exercises, dates in R |
| 14 | purrr-Exercises-in-R | purrr exercises, map function R |
| 15 | forcats-Exercises-in-R | factors in R exercises |
| 16 | readr-Exercises-in-R | read csv R exercises, data import R |
| 17 | Data-Cleaning-Exercises-in-R | data cleaning in R exercises |
| 18 | Data-Visualization-Exercises-in-R | data viz R exercises |
| 19 | Hypothesis-Testing-Exercises-in-R | hypothesis testing R |
| 20 | Logistic-Regression-Exercises-in-R | logistic regression R exercises |
| 21 | Time-Series-Exercises-in-R | time series R exercises |
| 22 | ARIMA-Exercises-in-R | ARIMA in R, forecasting R exercises |
| 23 | Shiny-Exercises-in-R | shiny exercises, shiny app practice |
| 24 | R-Markdown-Exercises | R Markdown exercises, Quarto practice |
| 25 | R-Beginner-Exercises | R for beginners exercises, R basics practice |

## Tier 3 — Topic sub-hubs (15 hubs)

| # | Hub slug | Target keyword |
|---|---|---|
| 26 | dplyr-Joins-Exercises-in-R | joins in R exercises, dplyr joins practice |
| 27 | dplyr-Window-Functions-Exercises-in-R | dplyr window functions, lead lag R |
| 28 | dplyr-Group-By-Exercises-in-R | group_by R exercises |
| 29 | ggplot2-Themes-Exercises-in-R | ggplot2 themes, customize ggplot |
| 30 | ggplot2-Facets-Exercises-in-R | facet_wrap exercises, ggplot facet practice |
| 31 | ggplot2-Color-Scales-Exercises-in-R | ggplot color palette exercises |
| 32 | ggplot2-Bar-Chart-Exercises | ggplot bar chart, geom_bar exercises |
| 33 | ggplot2-Heatmap-Exercises-in-R | ggplot heatmap, geom_tile exercises |
| 34 | tidyr-Pivot-Exercises-in-R | pivot_longer pivot_wider exercises |
| 35 | tidyr-Nest-Unnest-Exercises-in-R | nest unnest R, many models |
| 36 | Regex-Exercises-in-R | regex in R exercises, R regular expressions practice |
| 37 | Date-Time-Manipulation-Exercises-in-R | dates in R exercises, posixct practice |
| 38 | Apply-Family-Exercises-in-R | apply sapply lapply exercises |
| 39 | Loops-vs-Vectorization-Exercises-in-R | R vectorization exercises |
| 40 | R-Functional-Programming-Exercises | functional programming R exercises |

## Tier 4 — Statistics & ML deep-dives (12 hubs)

| # | Hub slug | Target keyword |
|---|---|---|
| 41 | T-Test-Exercises-in-R | t test R exercises |
| 42 | ANOVA-Exercises-in-R | ANOVA R exercises |
| 43 | Chi-Square-Test-Exercises-in-R | chi square R exercises |
| 44 | Correlation-Exercises-in-R | correlation R exercises |
| 45 | Probability-Distributions-Exercises-in-R | probability distributions R |
| 46 | Sampling-Methods-Exercises-in-R | bootstrap sampling R exercises |
| 47 | Cross-Validation-Exercises-in-R | k-fold cross validation R |
| 48 | Random-Forest-Exercises-in-R | random forest R exercises |
| 49 | XGBoost-Exercises-in-R | xgboost R exercises |
| 50 | Clustering-Exercises-in-R | k-means clustering R exercises |
| 51 | PCA-Exercises-in-R | PCA R exercises, principal component R |
| 52 | tidymodels-Exercises-in-R | tidymodels exercises |

## Tier 5 — Industry/domain (8 hubs)

| # | Hub slug | Target keyword |
|---|---|---|
| 53 | R-for-Finance-Exercises | R for finance exercises |
| 54 | R-for-Marketing-Analytics-Exercises | marketing analytics R exercises |
| 55 | R-for-Healthcare-Exercises | R for healthcare data exercises |
| 56 | R-for-Biostatistics-Exercises | biostatistics in R exercises |
| 57 | R-for-Sports-Analytics-Exercises | sports analytics R exercises |
| 58 | R-for-Genomics-Exercises | bioconductor R exercises |
| 59 | Survey-Analysis-in-R-Exercises | survey package R exercises |
| 60 | A-B-Testing-Exercises-in-R | A/B testing R exercises |

## Tier 6 — Niche but searched (10 hubs)

| # | Hub slug | Target keyword |
|---|---|---|
| 61 | plotly-Exercises-in-R | plotly R exercises |
| 62 | leaflet-Exercises-in-R | leaflet R map exercises |
| 63 | gt-Tables-Exercises-in-R | gt package exercises, R tables |
| 64 | broom-Exercises-in-R | broom R exercises |
| 65 | dbplyr-SQL-Exercises-in-R | dbplyr SQL R exercises |
| 66 | Web-Scraping-Exercises-in-R | rvest R exercises |
| 67 | API-Calls-Exercises-in-R | httr2 R exercises |
| 68 | R-Package-Development-Exercises | devtools R package exercises |
| 69 | R-Performance-Optimization-Exercises | R profiling optimization |
| 70 | Parallel-Computing-in-R-Exercises | future furrr R exercises |

---

## Execution phases

| Phase | Hubs | Time | Cumulative traffic potential |
|---|---|---|---|
| 1 | Tier 1 (10) | 4 weeks | 40-80K mo |
| 2 | Tier 2 (15) | 4 weeks | +30-50K mo |
| 3 | Tier 3 (15) | 3 weeks | +15-30K mo |
| 4 | Tier 4 (12) | 3 weeks | +10-20K mo |
| 5 | Tiers 5-6 (18) | 4 weeks | +10-15K mo |

**Total: 18 weeks, 70 hubs, projected 100-200K incremental monthly visits at maturity.**

---

## Format rules (per hub markdown)

```yaml
---
title: "<Topic> Exercises in R: <N> Real-World Practice Problems"
slug: "<Topic>-Exercises-in-R"
description: "150-160 char meta with the target keyword early"
keywords: "comma-separated, target keyword first"
mathjax: false
webr: true
date: "YYYY-MM-DD"
post_type: "EX"
sidebar_title: "<Topic> Exercises"
sidebar_order: 100
fr_parent: "<parent C post slug>.html"
auto_link_terms: "exact match phrases pipe-separated"
auto_link_case_sensitive: false
target_keyword: "<primary>"
sibling_block_enabled: false
difficulty: "Intermediate"
---
```

**Body structure (no front-matter blocks like Quick Answer or Decision Tree):**
1. H1 + lead paragraph (1-2 sentences)
2. Section table (topic, count, difficulty mix)
3. Single library setup code block
4. Sections 1-6, each H2, with exercises as H3
5. Each exercise: scenario + difficulty + your-turn block + collapsible solution
6. Brief "What to do next" section with links to function-deep posts

---

## Navbar dropdown plan (after second hub ships)

Add a layered "Exercises" dropdown to the navbar with structure:
- Exercises
  - Packages: dplyr, ggplot2, tidyr, stringr, lubridate, purrr, ...
  - Topics: Joins, Window Functions, Pivot, Themes, Facets, ...
  - Statistics: Linear Regression, Logistic, ANOVA, t-test, ...
  - Machine Learning: Random Forest, XGBoost, Clustering, ...
  - Domains: Finance, Healthcare, Marketing, ...
  - Levels: Beginner, Intermediate, Advanced

Implementation: Bootstrap 3 dropdown-submenu CSS in `css/main.css`, JSON config in `www/exercises-nav.json`, rendered by addition to `_build/template.html` masthead.
