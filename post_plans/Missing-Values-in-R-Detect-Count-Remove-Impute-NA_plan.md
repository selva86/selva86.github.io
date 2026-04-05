# Plan: Missing Values in R — Detect, Count, Remove, Impute

## Frontmatter

| Field | Value |
|---|---|
| title | Missing Values in R: Detect, Count, Remove, and Impute NA — Complete Playbook |
| slug | Missing-Values-in-R-Detect-Count-Remove-Impute-NA |
| description | Handle NA values in R: detect with is.na(), count, remove with na.omit() or complete.cases(), and impute with mice. Decision guide for each situation. |
| keywords | missing values in R, NA in R, is.na, complete.cases, na.omit, mice imputation, MCAR MAR MNAR, handle NA R |
| auto_link_terms | missing values in R\|NA values\|is.na()\|complete.cases()\|na.omit()\|missing data imputation\|handle NA\|impute missing values |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.2.9 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | Missing Values (NA) |
| sidebar_order | 10 |
| fr_parent | null |

## Breadcrumb

Home > Data Wrangling > tidyr > Missing Values in R

## Lead sentence

Missing values in R are represented by `NA`, a special logical constant that silently propagates through arithmetic and comparisons unless you handle it explicitly with functions like `is.na()`, `complete.cases()`, `na.omit()`, or imputation.

## Section outline

### Introduction
- Hook: a single NA in a column can turn `mean(x)` into NA, masking a problem across an entire analysis.
- What NA is (special logical constant, 4 type-specific forms: `NA_integer_`, `NA_real_`, `NA_character_`, `NA_complex_`).
- Why missing data handling matters: downstream bias, broken models, misleading summaries.
- What the reader will learn: detect, count, remove, impute, and choose between them.
- Diagram 1: NA propagation flow.

### What does NA mean in R, and why does it spread?
- NA vs NULL vs NaN vs Inf (table).
- Arithmetic propagation: `5 + NA`, `mean(c(1,2,NA))`, `NA == NA`.
- The `na.rm = TRUE` escape hatch.
- Code block: demonstrate propagation with airquality.
- KEY INSIGHT callout on why NA != NA.

### How do you detect NA values in R?
- `is.na()` on vectors, data frames.
- `anyNA()` for quick existence check.
- Beware comparison traps (`x == NA` always NA).
- Code block: is.na() on a vector, on airquality.
- TIP callout on anyNA() speed.

### How do you count missing values per column?
- `sum(is.na(x))` for totals.
- `colSums(is.na(df))` for per-column.
- `sapply()` / `dplyr::summarise(across())` pattern.
- Code block: per-column count + percent missing in airquality.

### How do you remove rows with NA values?
- `na.omit(df)` — full-case removal.
- `complete.cases(df)` — flexible mask.
- `tidyr::drop_na()` with column selection.
- Code block: compare na.omit vs drop_na (specific cols).
- WARNING callout on silently losing rows.

### When should you impute instead of dropping?
- Diagram 2: MCAR / MAR / MNAR typology.
- Diagram 3: decision tree for drop vs impute vs flag.
- Rules of thumb: <5% drop; 5–40% impute; >40% reconsider column.
- Simple base R median/mean imputation.
- Brief mention of mice for multiple imputation.
- Code block: median imputation with dplyr across.
- NOTE callout: mice runs in local RStudio, not in the browser code runner here.

### Complete Example: cleaning airquality end-to-end
- Audit → decide → act (median impute + drop the worst column).
- Side-by-side: before/after summary.

### Common Mistakes
1. Using `x == NA` instead of `is.na(x)`.
2. Calling `mean(x)` without `na.rm = TRUE`.
3. Using `na.omit()` on the whole data frame when only 1 column has NA.
4. Treating character "NA" strings as missing.
5. Imputing before train/test split (leakage).

### Practice Exercises (3)
1. Easy — count total NAs in airquality.
2. Medium — keep only rows with no NA in Ozone and Solar.R.
3. Challenging — impute Ozone with its median by Month.

### Summary table
- Function → use case → returns.

### FAQ
1. What is the difference between NA and NULL in R?
2. Why does `NA == NA` return NA and not TRUE?
3. Should I always use `na.rm = TRUE`?
4. Is median imputation ever a bad idea?
5. Can I replace NA with 0?

### References
1. R Core Team — An Introduction to R, Missing Values section.
2. Wickham & Grolemund — R for Data Science, Chapter on missing values.
3. mice package (van Buuren).
4. UCLA OARC R FAQ — How does R handle missing values.
5. tidyr drop_na documentation.
6. Princeton Missing Data guide.
7. dplyr across documentation.

### What's Next
- dplyr mutate & rename
- pivot_longer and pivot_wider
- R Joins

## Diagrams

| # | Filename | Figure | Caption | Placed in |
|---|---|---|---|---|
| 1 | Missing-Values-in-R-Detect-Count-Remove-Impute-NA-propagation-flow.webp | Figure 1 | NA silently propagates through arithmetic, comparison, and aggregation. | Introduction |
| 2 | Missing-Values-in-R-Detect-Count-Remove-Impute-NA-mechanisms.webp | Figure 2 | Three missingness mechanisms: MCAR, MAR, and MNAR. | When should you impute instead of dropping? |
| 3 | Missing-Values-in-R-Detect-Count-Remove-Impute-NA-decision-tree.webp | Figure 3 | Decision tree for choosing drop, impute, or flag. | When should you impute instead of dropping? |

## Code blocks

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Load data, show NA propagation | dplyr, tidyr | aq | — |
| 2 | NA vs NULL vs NaN | — | — | — |
| 3 | is.na and anyNA | — | na_mask | aq |
| 4 | na.rm comparison | — | — | aq |
| 5 | Count NA per column | — | na_counts, na_pct | aq |
| 6 | na.omit, complete.cases, drop_na | — | aq_complete, aq_drop | aq |
| 7 | Median imputation with dplyr across | — | aq_imputed | aq |
| 8 | Complete example end-to-end | — | aq_clean | aq |
| 9 | Ex1 solution | — | my_total_na | aq |
| 10 | Ex2 solution | — | my_rows | aq |
| 11 | Ex3 solution | — | my_ozone_fill | aq |
