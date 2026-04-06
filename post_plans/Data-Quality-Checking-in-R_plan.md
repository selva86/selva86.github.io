# Plan: Data Quality Checking in R

## A. Frontmatter

| Field | Value |
|---|---|
| title | Data Quality Checking in R: 10 Things to Verify Before You Analyze |
| slug | Data-Quality-Checking-in-R |
| description | Before any analysis, check dimensions, types, duplicates, missing values, ranges, and consistency. Here are 10 data quality checks in R with code you can copy into any project. |
| keywords | data quality checking in R, data validation R, check data before analysis, data quality checklist R, missing values check R, duplicates in R, data types R, data range validation, data consistency R, validate package R |
| auto_link_terms | data quality checking in R\|data quality checks\|data validation in R\|validate your data\|check data quality\|data quality checklist |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 2.10.5 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | Data Quality Checking |
| sidebar_order | 17 |

## B. Breadcrumb

Home > Data Wrangling > Data Cleaning & Quality > Data Quality Checking in R

## C. Full Section Outline

### Lead sentence
Data quality checking is the process of verifying that your dataset's structure, types, values, and relationships are correct before you analyze it — catching problems that would silently corrupt every downstream result.

### Introduction (2-3 paragraphs)
- Hook: "Every data analysis rests on an assumption: the data is trustworthy. Skip the quality check and you discover the broken column at 2 AM, after two days of modeling."
- What: 10 systematic checks that cover structure, content, and relationships
- Why: Prevents silent errors, saves debugging time, makes analyses reproducible
- What you'll learn: A reusable checklist with runnable R code for each check
- Packages: base R + dplyr (loaded in first block)
- Diagram: Figure 1 (checklist flow) placed here

### Core Content Sections (7 H2s, question-form)

#### H2-1: What should you check first — dimensions and structure?
- Theory: Before anything else, verify row/column counts match expectations. Use `dim()`, `str()`, `glimpse()`.
- Code block 1: Load dplyr + create messy dataset with `data.frame()`. Show `dim()`, `str()`, `glimpse()`.
- Callout: TIP — "Use glimpse() over str() for wide data frames."
- Inline exercise: Check dimensions of `mtcars` and identify how many numeric columns it has.

#### H2-2: Are your column types what you expect?
- Theory: Character columns that should be numeric, dates stored as strings. Use `sapply(df, class)`, `summary()`.
- Code block 2: Show type mismatches in the messy dataset; fix with `as.numeric()`, `as.Date()`.
- Callout: WARNING — "as.numeric() on a factor converts factor codes, not labels."
- Inline exercise: Convert a character column to numeric and check for introduced NAs.

#### H2-3: How do you find and remove duplicate rows?
- Theory: Exact duplicates vs near-duplicates. `duplicated()`, `distinct()`, counting duplicates.
- Code block 3: Find duplicates, count them, remove with `distinct()`.
- Callout: KEY INSIGHT — "Duplicates often signal a join gone wrong, not just data entry errors."
- Inline exercise: Count duplicates in a small data frame using `sum(duplicated())`.

#### H2-4: How many missing values does each column have?
- Theory: `is.na()`, `colSums(is.na())`, percent missing per column, threshold decisions.
- Code block 4: Count NAs per column, compute percent missing, identify columns above 50%.
- Callout: NOTE — "Columns above 50% missing are usually dropped, not imputed."
- Diagram: Figure 2 (issue decision) placed here
- Inline exercise: Write code to find which columns have more than 10% missing.

#### H2-5: Are numeric values within expected ranges?
- Theory: `summary()` for min/max, domain-specific ranges (age 0-120, price > 0). Flagging out-of-range values.
- Code block 5: Use `summary()` to spot impossible values; filter out-of-range rows.
- Callout: WARNING — "Negative ages and future dates are silent model killers."
- Inline exercise: Flag rows where a value exceeds a given threshold.

#### H2-6: Do categorical columns contain only valid levels?
- Theory: `unique()`, `table()`, unexpected factor levels, typos in categories.
- Code block 6: Check unique values, spot typos, fix with `case_when()` or `recode()`.
- Callout: TIP — "Sort unique values alphabetically to spot near-duplicates like 'Male' and 'male'."
- Inline exercise: Find invalid categories in a column.

#### H2-7: Are cross-column relationships consistent?
- Theory: start_date <= end_date, city matches state, derived columns match their formula.
- Code block 7: Check date ordering, cross-field consistency.
- Callout: KEY INSIGHT — "Cross-column checks catch errors that single-column checks miss entirely."
- Diagram: Figure 3 (dirty-to-clean pipeline) placed here
- Inline exercise: Write a check that verifies end_date >= start_date.

### Tail Sections

#### Common Mistakes (3-5)
1. Checking only for NA but ignoring sentinel values like -999, "N/A", ""
2. Using `==` to compare with NA instead of `is.na()`
3. Fixing types before checking for sentinel values (turns "-999" into -999 silently)
4. Removing duplicates without understanding why they exist
5. Skipping cross-column consistency checks

#### Practice Exercises (2-3 capstone)
1. Exercise 1 (medium): Given a messy sales dataset, run all 10 checks and produce a quality report summary.
2. Exercise 2 (hard): Write a reusable `check_quality()` function that takes any data frame and returns a list of issues found.
3. Exercise 3 (hard): Clean a dataset with multiple quality issues — fix types, remove duplicates, handle missing values, validate ranges.

#### Complete Example
- End-to-end: load a messy dataset, run all 10 checks, fix issues, produce clean output.

#### Summary
- Table: Check # | What to verify | Key function | When to worry

#### FAQ (5 questions)
1. How often should I run data quality checks?
2. What is the difference between data validation and data cleaning?
3. Should I automate data quality checks?
4. What R packages specialize in data validation?
5. How do I handle data quality issues in production pipelines?

#### References (7-8)
1. R Core Team — R documentation for is.na(), duplicated(), summary()
2. Wickham & Grolemund — R for Data Science, Ch. Data tidying
3. dplyr documentation — distinct(), filter()
4. validate package CRAN documentation
5. dlookr package documentation
6. Peng — Exploratory Data Analysis with R (bookdown)
7. van der Loo & de Jonge — Data Validation Infrastructure for R (arXiv)

#### What's Next
1. Missing Values in R — deep dive on detection, removal, and imputation
2. Tidy Data in R — reshape messy data into analysis-ready format
3. Importing Data in R — get data into R from CSV, Excel, databases

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Data-Quality-Checking-in-R-checklist-flow.webp | Figure 1 | The 10-step data quality checklist flows left to right, from structure checks through content validation. | Introduction |
| 2 | Data-Quality-Checking-in-R-issue-decision.webp | Figure 2 | When a quality issue is found, the fix depends on the type of problem. | How many missing values does each column have? |
| 3 | Data-Quality-Checking-in-R-dirty-to-clean.webp | Figure 3 | The full pipeline from raw data to analysis-ready data. | Are cross-column relationships consistent? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load dplyr + create messy dataset, dim/str/glimpse | dplyr | messy_df | — |
| 2 | Check/fix column types | — | — | messy_df |
| 3 | Find/remove duplicates | — | clean_df | messy_df |
| 4 | Count missing values per column | — | na_summary | clean_df |
| 5 | Check numeric ranges | — | range_issues | clean_df |
| 6 | Check categorical values | — | — | clean_df |
| 7 | Cross-column consistency | — | — | clean_df |
| 8 | Common mistake: == vs is.na() | — | — | — |
| 9 | Common mistake: sentinel values | — | — | — |
| 10 | Capstone exercise 1 starter | — | — | — |
| 11 | Capstone exercise 2 starter | — | — | — |
| 12 | Capstone exercise 3 starter | — | — | — |
| 13 | Complete example end-to-end | — | final_clean | — |

Estimated word count: ~4500-5000 words
Code blocks: ~17 (including exercises and solutions)
