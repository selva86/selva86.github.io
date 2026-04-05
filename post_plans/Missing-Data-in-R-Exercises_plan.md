# Plan: Missing Data in R Exercises

## A. Frontmatter

| Field | Value |
|---|---|
| title | Missing Data in R Exercises: 10 NA Detection & Imputation Problems — Solved Step-by-Step |
| slug | Missing-Data-in-R-Exercises |
| description | Practise missing data handling in R with 10 NA detection and imputation problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced. |
| keywords | missing data exercises R, NA exercises R, is.na exercises, complete.cases practice, na.omit exercises, imputation exercises R, missing value practice problems, NA detection R |
| auto_link_terms | missing data exercises\|NA exercises\|is.na exercises\|missing value practice\|NA detection exercises |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | E2.6 |
| post_type | EX |
| sidebar_title | Missing Data (10 problems) |
| fr_parent | Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html |

## B. Breadcrumb

Home > Data Wrangling > tidyr > Missing Data Exercises

## C. Section Outline

### Lead sentence
Ten hands-on exercises drill NA detection, removal, and imputation in R — from basic `is.na()` checks to grouped median imputation — run every solution in your browser.

### Introduction (2 paragraphs)
- Hook: Reading about NA handling is easy; applying it under pressure with real messy data is harder. These 10 problems close that gap.
- What you'll practice: is.na(), complete.cases(), na.omit(), na.rm, mean/median imputation with base R and dplyr. If concepts are new, read the parent Missing Values tutorial first.
- All code runs in one shared session. Use distinct variable names (ans1, ans2, etc.).

### Setup: The Datasets (1 code block)
- Create 3 small datasets with deliberate NA patterns:
  - `sales`: 6-row tibble with NA in revenue and units columns
  - `survey`: 8-row tibble with NA in age, score, and group columns
  - `weather`: 5-row tibble with NA in temp and rainfall columns

### Warm-Up: Detection (Exercises 1-3)
- Exercise 1: Count total NAs in sales (is.na + sum)
- Exercise 2: Count NAs per column in survey (colSums + is.na)
- Exercise 3: Find rows with any NA in weather (complete.cases)

### Core Challenges: Removal (Exercises 4-6)
- Exercise 4: Remove all rows with NA from sales (na.omit)
- Exercise 5: Remove rows where a specific column is NA (filter + !is.na)
- Exercise 6: Keep only complete cases for selected columns (complete.cases on subset)

### Advanced: Imputation (Exercises 7-10)
- Exercise 7: Replace NA with column mean in sales$revenue (base R)
- Exercise 8: Replace NA with column median using dplyr mutate + replace (dplyr)
- Exercise 9: Impute NA with group-wise mean (group_by + mutate)
- Exercise 10: Full cleaning pipeline — detect, report, impute, verify (combine all techniques)

### Common Mistakes (3 mistakes)
- Mistake 1: Using == NA instead of is.na()
- Mistake 2: Forgetting na.rm = TRUE in mean/median
- Mistake 3: Imputing before understanding the pattern of missingness

### Summary
- Table mapping each exercise to the skill it tests

### FAQ (4 questions)
- When should I remove vs impute?
- Does na.rm = TRUE change the original data?
- How do I check if imputation worked?
- What if most of a column is NA?

### References (6 sources)
1. R documentation — is.na()
2. R documentation — complete.cases()
3. Wickham & Grolemund — R for Data Science, Ch. on missing values
4. UC Business Analytics R Guide — Missing Values
5. dplyr documentation — mutate() and replace()
6. Epidemiologist R Handbook — Missing Data chapter

### What's Next (3 links)
- Parent tutorial: Missing Values in R
- dplyr Exercises (15 problems)
- tidyr Reshaping Exercises (10 problems)

## D. Diagram list
None (EX post, diagrams optional — skipped)

## E. Code block master list

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Setup: load libs + create 3 datasets | dplyr, tidyr | sales, survey, weather_data | — |
| 2 | Ex1 starter (empty) | — | — | sales |
| 3 | Ex1 solution | — | ans1 | sales |
| 4 | Ex2 starter (empty) | — | — | survey |
| 5 | Ex2 solution | — | ans2 | survey |
| 6 | Ex3 starter (empty) | — | — | weather_data |
| 7 | Ex3 solution | — | ans3 | weather_data |
| 8 | Ex4 starter (empty) | — | — | sales |
| 9 | Ex4 solution | — | ans4 | sales |
| 10 | Ex5 starter (empty) | — | — | survey |
| 11 | Ex5 solution | — | ans5 | survey |
| 12 | Ex6 starter (empty) | — | — | weather_data |
| 13 | Ex6 solution | — | ans6 | weather_data |
| 14 | Ex7 starter (empty) | — | — | sales |
| 15 | Ex7 solution | — | ans7 | sales |
| 16 | Ex8 starter (empty) | — | — | survey |
| 17 | Ex8 solution | — | ans8 | survey |
| 18 | Ex9 starter (empty) | — | — | survey |
| 19 | Ex9 solution | — | ans9 | survey |
| 20 | Ex10 starter (empty) | — | — | sales |
| 21 | Ex10 solution | — | ans10 | sales |
| 22 | Mistake 1: == NA vs is.na() | — | — | — |
| 23 | Mistake 1: correct | — | — | — |
| 24 | Mistake 2: missing na.rm | — | — | — |
| 25 | Mistake 2: correct | — | — | — |
