---
title: "Missing Values in R: Detect, Count, Remove, and Impute NA — Complete Playbook"
slug: "Missing-Values-in-R-Detect-Count-Remove-Impute-NA"
description: "Handle NA values in R: detect with is.na(), count, remove with na.omit() or complete.cases(), and impute with mice. Decision guide for each situation."
keywords: "missing values in R, NA in R, is.na, complete.cases, na.omit, mice imputation, MCAR MAR MNAR, handle NA R"
auto_link_terms: "missing values in R|NA values|is.na()|complete.cases()|na.omit()|missing data imputation|handle NA|impute missing values"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.2.9"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "Missing Values (NA)"
sidebar_order: 10
---


# Missing Values in R: Detect, Count, Remove, and Impute NA — Complete Playbook

<p class="lead">Missing values in R are represented by <code>NA</code>, a special logical constant that silently propagates through arithmetic and comparisons. You handle them with <code>is.na()</code>, <code>complete.cases()</code>, <code>na.omit()</code>, and imputation methods like median replacement or <code>mice</code>.</p>

A single NA can turn a clean `mean()` into `NA` and mask a real problem across your entire analysis. This post teaches you to detect, count, remove, and impute missing values with runnable examples, plus when to pick each approach.

## Introduction

Real data is messy. Respondents skip questions. Sensors drop readings. Joins leave gaps. R marks every such hole with `NA`, and the value spreads through calculations unless you handle it. If you skip this handling, your summary statistics lie quietly, and your models either crash or learn from biased data.

R actually has four typed NAs: `NA` (logical), `NA_integer_`, `NA_real_`, and `NA_character_`. You rarely need to pick one by hand because R coerces between them. What matters is knowing how NA behaves and what to do about it.

![NA propagates through arithmetic, comparison, and aggregation.](screenshots/Missing-Values-in-R-Detect-Count-Remove-Impute-NA-propagation-flow.webp)
*Figure 1: NA silently propagates through arithmetic, comparison, and aggregation.*

In this tutorial you will detect missing values, count them per column, remove them two different ways, and fill them in when removal would waste data. Every code block runs in your browser, and variables carry over between blocks like a notebook. Click Run on the first block, then work top to bottom.

## What does NA mean in R, and why does it spread?

NA means "we do not know this value." Because the value is unknown, any calculation that touches it is also unknown. This is why `5 + NA` returns `NA` instead of a guess. It is also why `NA == NA` returns `NA`, not `TRUE`. Two unknowns might be the same or might not be, so R refuses to commit.

This propagation is a feature, not a bug. It forces you to notice missingness instead of burying it inside a sum. Most aggregation functions accept `na.rm = TRUE` to opt out, but the default is strict on purpose.

Let's load the built-in `airquality` dataset, which contains real missing values in its `Ozone` and `Solar.R` columns, and watch NA propagate.

```r
library(dplyr)
library(tidyr)

aq <- airquality
head(aq, 4)
#>   Ozone Solar.R Wind Temp Month Day
#> 1    41     190  7.4   67     5   1
#> 2    36     118  8.0   72     5   2
#> 3    12     149 12.6   74     5   3
#> 4    18     313 11.5   62     5   4

mean(aq$Ozone)
#> [1] NA

mean(aq$Ozone, na.rm = TRUE)
#> [1] 42.12931
```

The first `mean()` call returns `NA` because `Ozone` contains missing days. Adding `na.rm = TRUE` drops the NAs before averaging and gives you a real number. Notice that without `na.rm`, R does not warn you, it just returns NA. If you piped that NA into a plot or a model, you would spend an hour debugging a silent failure.

[KEY INSIGHT]
**NA is contagious by design.** R propagates NA through calculations so missingness is visible at the point of use. The moment you silence it with `na.rm = TRUE`, you are making a modeling decision. Do it knowingly.

Here is how NA compares to R's other special values:

| Value | Means | Example |
|---|---|---|
| `NA` | Unknown / missing | Missing survey answer |
| `NULL` | Does not exist | An empty list element |
| `NaN` | Not a number | `0 / 0` |
| `Inf` / `-Inf` | Infinity | `1 / 0` |

```r
c(NA, NULL, NaN, Inf)
#> [1]  NA NaN Inf

is.na(NaN)
#> [1] TRUE
is.na(NULL)
#> logical(0)
```

NULL vanishes from the vector entirely because it represents absence of the slot, not an unknown value. NaN is technically a missing number, so `is.na(NaN)` returns TRUE. `is.na(NULL)` returns an empty logical, not FALSE, because there is no element to test.

## How do you detect NA values in R?

The rule of thumb is simple: never use `==` to test for NA. Use `is.na()`. The `==` operator compares two known values, and NA is not a known value, so `x == NA` always returns NA, never TRUE.

`is.na()` returns a logical vector the same shape as its input. TRUE marks a missing position, FALSE marks a present one. For a quick yes/no check across a whole object, use `anyNA()`, which short-circuits as soon as it finds one NA.

```r
x <- c(10, NA, 30, NA, 50)
x == NA
#> [1] NA NA NA NA NA

is.na(x)
#> [1] FALSE  TRUE FALSE  TRUE FALSE

anyNA(aq)
#> [1] TRUE

anyNA(aq$Wind)
#> [1] FALSE
```

The `x == NA` call fails silently, returning a vector of NAs that looks plausible but tells you nothing. The `is.na(x)` call returns the correct mask. On the full data frame, `anyNA(aq)` tells you NAs exist somewhere, and `anyNA(aq$Wind)` confirms the Wind column has none.

[TIP]
**Use anyNA() for quick existence checks, not sum(is.na()).** anyNA() stops at the first NA it finds, so it is much faster on large data when you only need a yes/no answer.

## How do you count missing values per column?

For data frames, a per-column NA count is almost always more useful than a total. It tells you which columns need attention. The pattern is `colSums(is.na(df))`, which adds up the TRUE values in each column's NA mask.

```r
colSums(is.na(aq))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0

na_pct <- colSums(is.na(aq)) / nrow(aq) * 100
round(na_pct, 1)
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>    24.2     4.6     0.0     0.0     0.0     0.0
```

Ozone has 37 missing days out of 153 rows, about 24% of the column. Solar.R is missing 7 days, under 5%. Wind, Temp, Month, and Day are complete. That single table tells you Ozone is the problem column and Solar.R is light enough to drop or fill with little cost.

You can do the same job in dplyr, which fits nicely into a tidyverse pipeline:

```r
aq |>
  summarise(across(everything(), ~ sum(is.na(.x))))
#>   Ozone Solar.R Wind Temp Month Day
#> 1    37       7    0    0     0   0
```

The `across(everything(), ...)` call applies the NA-counting function to every column. The result is a one-row data frame, which you can pivot longer if you need a tall report. Either form works, pick the one that matches the rest of your code.

## How do you remove rows with NA values?

Three tools handle removal, and they differ in how much control they give you.

`na.omit(df)` drops every row that has at least one NA anywhere. It is the blunt instrument. `complete.cases(df)` returns a logical mask, which you can combine with other filters. `tidyr::drop_na()` lets you name specific columns, so you only drop rows where those columns are missing.

```r
nrow(aq)
#> [1] 153

aq_complete <- na.omit(aq)
nrow(aq_complete)
#> [1] 111

aq_drop <- aq |> drop_na(Ozone)
nrow(aq_drop)
#> [1] 116

# complete.cases() as a mask
sum(complete.cases(aq))
#> [1] 111
```

`na.omit()` dropped 42 rows because it requires every column to be present. `drop_na(Ozone)` only dropped the 37 Ozone-missing rows, keeping 5 rows that have a Solar.R NA but a present Ozone. The two give you different datasets and different downstream conclusions.

[WARNING]
**na.omit() on the whole frame can silently cut your data in half.** If one column has 40% missingness, na.omit() removes 40% of the rows, even though the other columns were fine on those rows. Prefer drop_na(col1, col2) to be specific, or impute the sparse column first.

## When should you impute instead of dropping?

Dropping rows is cheap to implement but expensive in information. Each dropped row takes all its other columns with it. If you are losing more than a few percent of your data, impute instead. Imputation fills NAs with plausible values so the rest of the row stays in your analysis.

The right imputation method depends on *why* the values are missing. Statisticians group missingness into three mechanisms.

![MCAR, MAR, and MNAR — three missingness mechanisms.](screenshots/Missing-Values-in-R-Detect-Count-Remove-Impute-NA-mechanisms.webp)
*Figure 2: Three missingness mechanisms: MCAR, MAR, and MNAR.*

MCAR (Missing Completely At Random) means the missingness does not depend on anything. A sensor fails randomly. You can drop or impute safely. MAR (Missing At Random) means missingness depends on *observed* data. Richer respondents hide income more often, but you can see who is rich. You can impute using the other variables. MNAR (Missing Not At Random) means missingness depends on the *missing value itself*. People with very high income hide it. No standard imputation is correct, and you usually need to model the missingness process.

Use a simple rule of thumb for which strategy to apply:

![Decision tree: drop, impute, or flag.](screenshots/Missing-Values-in-R-Detect-Count-Remove-Impute-NA-decision-tree.webp)
*Figure 3: Decision tree for choosing drop, impute, or flag.*

For most analyses, a median imputation is a reasonable starting point for numeric columns. It is robust to outliers and preserves the central tendency of the column. Here is how you apply it in dplyr:

```r
aq_imputed <- aq |>
  mutate(across(
    c(Ozone, Solar.R),
    ~ ifelse(is.na(.x), median(.x, na.rm = TRUE), .x)
  ))

colSums(is.na(aq_imputed))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>       0       0       0       0       0       0

c(mean_orig = mean(aq$Ozone, na.rm = TRUE),
  mean_imp  = mean(aq_imputed$Ozone))
#> mean_orig  mean_imp
#>  42.12931  37.80392
```

The Ozone mean dropped from 42.1 to 37.8 after imputation because the median (31.5) is pulled below the mean by the column's right-skew. This is the trade-off of median imputation: it preserves the row count but shrinks variance and can bias summaries. For a quick analysis it is fine. For a published model, consider multiple imputation.

[NOTE]
**For rigorous analyses, use multiple imputation with the mice package in your local RStudio.** The `mice` package generates several plausible datasets, fits your model to each, and pools the results to honor the uncertainty introduced by imputation. It is not pre-compiled for the in-browser code runner used on this page, so run it in your local R session.

## Complete Example: Cleaning airquality end-to-end

Let's apply the full playbook. We audit the data, decide on a strategy, and produce a cleaned frame ready for modeling.

```r
# 1. Audit
na_report <- aq |>
  summarise(across(everything(), ~ sum(is.na(.x)))) |>
  pivot_longer(everything(), names_to = "col", values_to = "n_na") |>
  mutate(pct = round(n_na / nrow(aq) * 100, 1)) |>
  arrange(desc(n_na))
na_report
#> # A tibble: 6 x 3
#>   col      n_na   pct
#>   <chr>   <int> <dbl>
#> 1 Ozone      37  24.2
#> 2 Solar.R     7   4.6
#> 3 Wind        0   0
#> 4 Temp        0   0
#> 5 Month       0   0
#> 6 Day         0   0

# 2. Decide: Solar.R under 5% -> drop those rows. Ozone 24% -> median impute.
# 3. Act
aq_clean <- aq |>
  drop_na(Solar.R) |>
  mutate(Ozone = ifelse(is.na(Ozone), median(Ozone, na.rm = TRUE), Ozone))

nrow(aq_clean)
#> [1] 146
anyNA(aq_clean)
#> [1] FALSE
```

The pipeline produced a frame with 146 rows (7 dropped for Solar.R) and zero NAs. Ozone kept all its 146 rows via imputation rather than losing another 35 to removal. The decisions match the rates: light missingness got dropped, heavy missingness got filled. Always document which columns you imputed and with what method, so a reviewer can challenge the choices.

## Common Mistakes and How to Fix Them

### Mistake 1: Using x == NA instead of is.na(x)

&#10060; **Wrong:**
```r
x <- c(1, NA, 3)
x[x == NA]
#> [1] NA NA NA
```

**Why it is wrong:** `x == NA` compares to an unknown value, so every comparison returns NA. You get no match and no error.

&#9989; **Correct:**
```r
x <- c(1, NA, 3)
x[is.na(x)]
#> [1] NA
```

### Mistake 2: Calling mean() or sum() without na.rm on data with NAs

&#10060; **Wrong:**
```r
mean(airquality$Ozone)
#> [1] NA
```

**Why it is wrong:** A single NA turns the result into NA. If you pipe this downstream, everything breaks silently.

&#9989; **Correct:**
```r
mean(airquality$Ozone, na.rm = TRUE)
#> [1] 42.12931
```

### Mistake 3: Using na.omit() on the whole frame when only one column has NAs

&#10060; **Wrong:**
```r
clean <- na.omit(airquality)  # drops 42 rows
```

**Why it is wrong:** You lose rows that were only missing the sparse columns, even though most of their values were present.

&#9989; **Correct:**
```r
clean <- tidyr::drop_na(airquality, Ozone, Solar.R)
```

### Mistake 4: Treating the character string "NA" as missing

&#10060; **Wrong:**
```r
vals <- c("yes", "no", "NA", "yes")
sum(is.na(vals))
#> [1] 0
```

**Why it is wrong:** The string `"NA"` is a four-character word, not the missing sentinel. `is.na()` correctly says there are zero missing values.

&#9989; **Correct:**
```r
vals <- c("yes", "no", "NA", "yes")
vals[vals == "NA"] <- NA
sum(is.na(vals))
#> [1] 1
```

### Mistake 5: Imputing before splitting into train and test

&#10060; **Wrong:**
```r
# Compute median on full data, then split. Leaks test info into train.
```

**Why it is wrong:** The median of the combined set uses test rows. Your model sees test information at training time, inflating your reported performance.

&#9989; **Correct:** Split first, compute the median on the train set only, then apply that same value to both sets.

## Practice Exercises

### Exercise 1: Count total missing values in airquality

Write one line that returns the total count of NA values across the whole `airquality` data frame. Save it to `my_total_na`.

```r
# Exercise 1
# Hint: sum() + is.na() work on matrices and data frames too.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_total_na <- sum(is.na(airquality))
my_total_na
#> [1] 44
```

**Explanation:** `is.na(airquality)` returns a logical matrix of the same shape. `sum()` treats TRUE as 1, so summing gives the total count.

</details>

### Exercise 2: Keep only rows that are complete in Ozone and Solar.R

Filter `airquality` to rows where both `Ozone` and `Solar.R` are present. Save the result to `my_rows`. It should have 111 rows.

```r
# Exercise 2
# Hint: use drop_na() with the column names, or complete.cases().

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_rows <- airquality |> tidyr::drop_na(Ozone, Solar.R)
nrow(my_rows)
#> [1] 111
```

**Explanation:** `drop_na()` with specific column arguments only drops rows where those named columns are NA. Wind, Temp, Month, Day are complete already, so this matches `na.omit()` here.

</details>

### Exercise 3: Fill Ozone with its monthly median

For each month, replace missing Ozone values with the median Ozone of that month. Save the result to `my_ozone_fill`. Verify it has no NAs in Ozone.

```r
# Exercise 3
# Hint: group_by(Month), then mutate() with ifelse() and median().

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_ozone_fill <- airquality |>
  dplyr::group_by(Month) |>
  dplyr::mutate(
    Ozone = ifelse(is.na(Ozone), median(Ozone, na.rm = TRUE), Ozone)
  ) |>
  dplyr::ungroup()

sum(is.na(my_ozone_fill$Ozone))
#> [1] 0
```

**Explanation:** `group_by(Month)` makes the median computed within each month. Hot months get the hot-month median, cool months get the cool-month median. This is a stronger imputation than a single global median because it preserves monthly seasonality.

</details>

## Summary

| Task | Function | Returns |
|---|---|---|
| Detect NA | `is.na(x)` | Logical vector, same shape as x |
| Any NA present? | `anyNA(x)` | Single TRUE/FALSE |
| Count NAs per column | `colSums(is.na(df))` | Named numeric vector |
| Drop all NA rows | `na.omit(df)` | Data frame, rows with any NA removed |
| Mask complete rows | `complete.cases(df)` | Logical vector of rows |
| Drop rows NA in chosen cols | `tidyr::drop_na(df, col1, col2)` | Data frame |
| Simple imputation | `ifelse(is.na(x), median(x, na.rm = TRUE), x)` | Vector with NAs filled |
| Multiple imputation | `mice::mice(df)` (local R) | Multiply imputed dataset |

The headline rule: detect with `is.na()`, count with `colSums(is.na(df))`, and choose drop vs impute by the missingness rate and mechanism.

## FAQ

### What is the difference between NA and NULL in R?

NA means a value is unknown. NULL means the value does not exist at all. NA keeps its slot in a vector, NULL vanishes. Use NA for missing survey answers, NULL to remove a list element.

### Why does NA == NA return NA and not TRUE?

Because NA means "unknown." Two unknowns might or might not be equal, so R refuses to claim they are equal. Always use `is.na()` to test for missingness instead of `==`.

### Should I always use na.rm = TRUE?

No. Use it knowingly. Passing `na.rm = TRUE` silences missingness, which can hide data-quality problems. Always audit NA rates first, then decide whether removing them is safe for your question.

### Is median imputation ever a bad idea?

Yes. It shrinks variance and can bias relationships between variables because every imputed row gets the same value. For predictive models that care about uncertainty or correlation structure, use multiple imputation (`mice`) instead.

### Can I replace NA with 0?

Only if 0 means "none" in your domain, such as "zero items sold." If 0 is a real measurement, replacing NA with 0 invents data and shifts your mean. Use the median, a group median, or `mice` instead.

## References

1. R Core Team. *An Introduction to R* — Missing Values section. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Missing-values)
2. UCLA OARC Statistical Consulting. *How does R handle missing values?* [Link](https://stats.oarc.ucla.edu/r/faq/how-does-r-handle-missing-values/)
3. van Buuren, S. *mice: Multivariate Imputation by Chained Equations* (package documentation). [Link](https://cran.r-project.org/web/packages/mice/mice.pdf)
4. van Buuren, S. *Flexible Imputation of Missing Data*, 2nd ed. [Link](https://stefvanbuuren.name/fimd/)
5. Wickham, H. & Grolemund, G. *R for Data Science (2e)* — Chapter on missing values. [Link](https://r4ds.hadley.nz/missing-values.html)
6. tidyr reference. `drop_na()` documentation. [Link](https://tidyr.tidyverse.org/reference/drop_na.html)
7. dplyr reference. `across()` documentation. [Link](https://dplyr.tidyverse.org/reference/across.html)

## What's Next?

- **[dplyr mutate & rename](dplyr-mutate-rename.html)** — Build on the `mutate(across(...))` pattern used here for imputation.
- **[pivot_longer and pivot_wider](pivot_longer-pivot_wider-Reshape-Data-in-R.html)** — Reshape the NA audit table into a long format for reporting.
- **[R Joins](R-Joins.html)** — Joins are a common source of NAs; handling them well starts with this playbook.
