# Asset Track: Interview-Question Posts

**Total:** 60 posts (30 to 50 questions each, ~2,500 questions total)
**Page template per post:** intro → questions in 4-tier difficulty (warm-up, core, advanced, gotcha) → R code in answer → common-mistake call-out → next-step CTA
**Word count target:** 3,000 to 6,000 (interview-prep pages reward depth)
**Tracking:** `Plans/PSEO/asset-tracker.json` under `interview_questions`

URL pattern: `/<Slug>.html` (treated as long-form Core posts; sidebar listed under "Interview Prep")

---

## By role / level (9)

| Slug | Title | Questions |
|---|---|---|
| R-Interview-Questions-Freshers | 30 R Interview Questions for Freshers (Entry-Level) | 30 |
| R-Interview-Questions-Mid-Level | 40 R Interview Questions (2 to 5 Years Experience) | 40 |
| R-Interview-Questions-Senior | 50 Senior R Developer Interview Questions | 50 |
| Statistical-Analyst-Interview-Questions | 40 Statistical Analyst Interview Questions in R | 40 |
| Biostatistician-Interview-Questions | 35 Biostatistician Interview Questions | 35 |
| Quant-Analyst-Interview-Questions | 40 Quantitative Analyst Interview Questions in R | 40 |
| ML-Engineer-R-Interview-Questions | 45 Machine Learning Engineer Interview Questions in R | 45 |
| Shiny-Developer-Interview-Questions | 30 Shiny Developer Interview Questions | 30 |
| BI-Analyst-R-Interview-Questions | 35 BI / Data Analyst R Interview Questions | 35 |

## By topic (21)

| Slug | Title | Questions |
|---|---|---|
| Base-R-Interview-Questions | 50 Base R Interview Questions | 50 |
| Tidyverse-Interview-Questions | 40 Tidyverse Interview Questions | 40 |
| dplyr-Interview-Questions | 30 dplyr Interview Questions | 30 |
| ggplot2-Interview-Questions | 30 ggplot2 Interview Questions | 30 |
| Statistics-Fundamentals-Interview-Questions | 50 Statistics Fundamentals Interview Questions | 50 |
| Probability-Interview-Questions | 40 Probability Interview Questions | 40 |
| Hypothesis-Testing-Interview-Questions | 35 Hypothesis Testing Interview Questions | 35 |
| Regression-Interview-Questions | 40 Regression Interview Questions | 40 |
| Classification-Interview-Questions | 35 Classification Interview Questions in R | 35 |
| Clustering-Interview-Questions | 30 Clustering Interview Questions | 30 |
| Time-Series-Interview-Questions | 40 Time Series Interview Questions in R | 40 |
| Bayesian-Interview-Questions | 30 Bayesian Statistics Interview Questions | 30 |
| Causal-Inference-Interview-Questions | 30 Causal Inference Interview Questions | 30 |
| Experimental-Design-Interview-Questions | 35 A/B Testing and Experimental Design Interview Questions | 35 |
| Survival-Analysis-Interview-Questions | 25 Survival Analysis Interview Questions in R | 25 |
| Deep-Learning-R-Interview-Questions | 30 Deep Learning Interview Questions in R | 30 |
| NLP-R-Interview-Questions | 30 NLP Interview Questions in R | 30 |
| Bioinformatics-R-Interview-Questions | 30 Bioinformatics R Interview Questions | 30 |
| Finance-R-Interview-Questions | 35 Finance R Interview Questions | 35 |
| data-table-Interview-Questions | 25 data.table Interview Questions | 25 |
| Shiny-Interview-Questions | 30 Shiny Interview Questions | 30 |

## By format (9)

| Slug | Title | Questions |
|---|---|---|
| R-Conceptual-Interview-Questions | 100 R Conceptual Interview Questions | 100 |
| R-Coding-Interview-Questions-with-Answers | 50 R Coding Interview Questions with Answers | 50 |
| R-Coding-Challenges | 40 R Coding Challenges (Solutions Separate) | 40 |
| R-MCQ-Test | 100 R MCQ Test Questions (Free Online) | 100 |
| R-Scenario-Interview-Questions | 30 R Scenario-Based Interview Questions | 30 |
| R-Whiteboard-Design-Questions | 20 R Whiteboard / System Design Interview Questions | 20 |
| Statistics-Reasoning-Puzzles | 40 Statistics Reasoning Puzzles | 40 |
| Stats-ELI5-Questions | 30 Stats Concepts Explained Like You're 5 | 30 |
| R-Common-Mistakes-Gotchas | 40 R Common Mistakes and Gotchas | 40 |

## Specials (5)

| Slug | Title | Questions |
|---|---|---|
| FAANG-R-Stats-Interview-Questions | 40 FAANG R / Stats Interview Questions | 40 |
| Recent-2025-R-Interview-Experiences | Recent 2025 R Interview Experiences (Crowdsourced) | 50 |
| Pharma-R-Interview-Questions | 30 Pharma / Clinical R Interview Questions | 30 |
| Fintech-R-Interview-Questions | 30 Fintech R Interview Questions | 30 |
| Healthcare-R-Interview-Questions | 30 Healthcare / MarTech R Interview Questions | 30 |

## Bait pages (8)

High-CTR titles. Often serve as the entry point that links to specialized pages above.

| Slug | Title | Questions |
|---|---|---|
| 100-R-Interview-Questions | 100 R Interview Questions and Answers (Master List) | 100 |
| 50-Statistics-Interview-Questions | 50 Statistics Interview Questions | 50 |
| 30-dplyr-Questions-Master | 30 dplyr Questions Every Data Scientist Should Know | 30 |
| Hardest-R-Interview-Questions | 25 Hardest R Interview Questions Ever Asked | 25 |
| R-Interview-Cheatsheet | The R Interview Cheatsheet (Last-Minute Prep) | 60 |
| Top-50-Data-Scientist-R-Questions | Top 50 Data Scientist Interview Questions in R | 50 |
| R-Pandas-Equivalents | Every Pandas Function and Its R Equivalent | 60 |
| R-SQL-Interview-Questions | 30 R + SQL Interview Questions | 30 |

(Slug count: 9 + 21 + 9 + 5 + 8 = 52. Plan target was 60; the additional 8 slots are reserved for specialized topic pages emerging from waves 4 to 6 — e.g., Geospatial-R-Interview-Questions, Bayesian-Workflow-Interview-Questions, Reproducibility-Interview-Questions.)

---

## Question quality bar

Each interview-question post must include:
- 4-tier difficulty progression (warm-up → core → advanced → gotcha)
- Runnable R code in every answer
- "Common-mistake" call-out for at least 50% of questions
- "Why this is asked" rationale for advanced questions
- Cross-links to relevant tutorials (e.g., dplyr question links to Data-Wrangling-With-dplyr.html)
- Schema: `QAPage` JSON-LD per question

## Internal linking play

Bait pages (8) serve as hub posts; specialized pages (52) serve as spoke posts. Hub-and-spoke architecture:
- Bait: "100 R Interview Questions" links out to 20+ specialized pages
- Specialized: each links back to relevant bait posts and to its topic parent (e.g., dplyr questions → dplyr tutorial)

This creates ~500 inter-interview-page links, plus ~1,500 links from interview pages back to tutorials. Massive internal-link uplift.

## Build cadence

- Weeks 1 to 4: bait pages (8) + role-level pages (9) — quickest CTR wins
- Weeks 5 to 12: topic pages (21) — pair with relevant tutorial publish waves
- Weeks 13 to 20: format pages (9) + specials (5) + reserved (8) — fills the long tail
