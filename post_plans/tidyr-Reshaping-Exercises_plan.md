# Plan: tidyr Reshaping Exercises

## A. Frontmatter

| Field | Value |
|---|---|
| title | tidyr Reshaping Exercises: 10 pivot_longer & pivot_wider Problems — Solved Step-by-Step |
| slug | tidyr-Reshaping-Exercises |
| description | Practise tidyr reshaping with 10 pivot_longer and pivot_wider problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced. |
| keywords | tidyr exercises, pivot_longer exercises, pivot_wider exercises, R reshaping practice, tidyr practice problems, wide to long exercises R, long to wide exercises R, tidyr pivot exercises |
| auto_link_terms | tidyr reshaping exercises\|pivot_longer exercises\|pivot_wider exercises\|tidyr pivot exercises\|reshaping practice problems |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | E2.5 |
| post_type | EX |
| sidebar_title | tidyr Reshaping (10 problems) |
| fr_parent | pivot_longer-pivot_wider-Reshape-Data-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > tidyr > tidyr Reshaping Exercises

## C. Section Outline

### Lead sentence
Ten hands-on exercises drill `pivot_longer()` and `pivot_wider()` from basic column stacking to advanced multi-value reshaping — run every solution in your browser.

### Introduction (2-3 paragraphs)
- Hook: Reading about reshaping is one thing; doing it under pressure is another.
- What: 10 exercises covering both pivot_longer() and pivot_wider(), from beginner to advanced.
- Link to parent tutorial for review. Code runs in shared browser session.

### Setup: The Datasets We Will Use
- Build 3 small tibbles: `students` (wide scores), `quarterly` (long sales data), `weather` (multi-measurement wide).
- Show the data so readers can eyeball it.

### Warm-Up: Basic Reshaping (Exercises 1-3)
- Exercise 1: Basic pivot_longer (stack subject columns)
- Exercise 2: Basic pivot_wider (spread a long table to wide)
- Exercise 3: Round-trip (pivot_longer then pivot_wider to recover original)

### Core Challenges: Arguments and Edge Cases (Exercises 4-7)
- Exercise 4: Use `names_prefix` to strip a column prefix during pivot_longer
- Exercise 5: Use `values_fill` to handle missing combinations in pivot_wider
- Exercise 6: Use `names_sep` to split compound column names during pivot_longer
- Exercise 7: Pivot wider with `values_fn` to aggregate duplicate keys

### Advanced Problems: Real-World Reshaping (Exercises 8-10)
- Exercise 8: Use `names_pattern` with regex to extract structured column names
- Exercise 9: Multi-value pivot_wider (multiple values_from columns)
- Exercise 10: Reshape a messy real-world-style table combining multiple techniques

### Common Mistakes and How to Fix Them
- Mistake 1: Forgetting to exclude ID columns from cols in pivot_longer
- Mistake 2: Duplicate key combinations in pivot_wider (gets list-columns)
- Mistake 3: Wrong data types after pivoting (character instead of numeric)

### Summary
- Table of functions and key arguments covered

### FAQ
- Q1: When should I use pivot_longer vs pivot_wider?
- Q2: How do I pivot only some columns?
- Q3: What replaced gather() and spread()?
- Q4: Can I pivot multiple value columns at once?

### References
- tidyr official docs, R4DS, tidyverse pivot vignette, Stanford DCL

### What's Next?
- Link to missing values post, dplyr exercises, ggplot2

## D. Diagram list
None (EX post — diagrams optional, skipping).

## E. Code block master list

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Setup: load tidyr+dplyr, create 3 datasets | tidyr, dplyr | students, quarterly, weather | — |
| 2 | Ex1 starter (empty) | — | — | students |
| 3 | Ex1 solution: basic pivot_longer | — | ans1 | students |
| 4 | Ex2 starter (empty) | — | — | quarterly |
| 5 | Ex2 solution: basic pivot_wider | — | ans2 | quarterly |
| 6 | Ex3 starter (empty) | — | — | students |
| 7 | Ex3 solution: round-trip | — | ans3_long, ans3_wide | students |
| 8 | Ex4 starter (empty) | — | — | weather |
| 9 | Ex4 solution: names_prefix | — | ans4 | weather |
| 10 | Ex5 data + starter (empty) | — | orders_long | — |
| 11 | Ex5 solution: values_fill | — | ans5 | orders_long |
| 12 | Ex6 data + starter (empty) | — | measurements | — |
| 13 | Ex6 solution: names_sep | — | ans6 | measurements |
| 14 | Ex7 data + starter (empty) | — | survey | — |
| 15 | Ex7 solution: values_fn | — | ans7 | survey |
| 16 | Ex8 data + starter (empty) | — | clinic | — |
| 17 | Ex8 solution: names_pattern | — | ans8 | clinic |
| 18 | Ex9 data + starter (empty) | — | results_long | — |
| 19 | Ex9 solution: multi-value pivot_wider | — | ans9 | results_long |
| 20 | Ex10 data + starter (empty) | — | messy | — |
| 21 | Ex10 solution: combined techniques | — | ans10 | messy |
| 22 | Mistake 1: wrong cols | — | — | students |
| 23 | Mistake 1: fix | — | — | students |
| 24 | Mistake 2: duplicate keys | — | — | — |
| 25 | Mistake 3: type issue | — | — | — |
