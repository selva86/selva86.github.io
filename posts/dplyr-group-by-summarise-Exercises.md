---
title: "dplyr group_by + summarise Exercises in R: 18 Aggregation Practice Problems"
slug: "dplyr-group-by-summarise-Exercises"
description: "18 worked group_by + summarise exercises in R: counts, multi-column rollups, across() column-wise stats, NA handling, group shares, and per-group ranking."
keywords: "group_by summarise exercises in R, dplyr group_by exercises, dplyr summarise exercises, dplyr aggregation practice, group by practice problems, dplyr exercises, R data wrangling exercises"
mathjax: false
webr: true
date: "2026-05-13"
curriculum_id: "E2.3"
post_type: "EX"
sidebar_title: "group_by & summarise (18 problems)"
sidebar_order: 145
fr_parent: "dplyr-group-by-summarise.html"
auto_link_terms: "group_by exercises|summarise exercises|dplyr aggregation practice|group by practice problems|dplyr exercises"
auto_link_case_sensitive: false
target_keyword: "group_by summarise exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dplyr group_by + summarise Exercises in R: 18 Aggregation Practice Problems

<p class="lead">Eighteen runnable practice problems that drill the most common dplyr aggregation pattern: <code>group_by() |&gt; summarise()</code>. The mix covers counts and means, multi-column groups, <code>across()</code> for column-wise stats, <code>NA</code> handling, group shares, and per-group ranking. Each problem hides a fully worked solution so you can try first and verify after.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(ggplot2)   # for the diamonds dataset
```

The exercises share state: every variable you define (`ex_1_1`, `ex_2_3`, etc.) persists across blocks on this page, so feel free to reuse earlier results in later problems if you want.

## Section 1. Counts and means: the basics (3 problems)

The first three exercises drill the bread-and-butter pattern: split the rows, then count or average inside each group. Every later problem is a variation on this same skeleton.

### Exercise 1.1: Count cars per cylinder in mtcars

**Task:** Use `group_by()` and `summarise()` on the built-in `mtcars` dataset to count how many rows belong to each `cyl` value (the engine cylinder count). The output should have two columns, `cyl` and `n`. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>     cyl     n
#>   <dbl> <int>
#> 1     4    11
#> 2     6     7
#> 3     8    14
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mtcars |>
  group_by(cyl) |>
  summarise(n = n(), .groups = "drop")

ex_1_1
#> # A tibble: 3 x 2
#>     cyl     n
#>   <dbl> <int>
#> 1     4    11
#> 2     6     7
#> 3     8    14
```

**Explanation:** `n()` is a special dplyr helper that returns the row count of the current group. The shorter equivalent here is `count(mtcars, cyl)`, which wraps the same pipeline. Once you also need a mean or sum alongside the count, you have to switch back to the full `group_by()` + `summarise()` form, so it pays to be fluent in both.

</details>

### Exercise 1.2: Average mpg per cylinder, rounded to one decimal

**Task:** A junior analyst is preparing a one-line summary of fuel economy by engine size for a status email. Compute the mean of `mpg` grouped by `cyl` in `mtcars`, round to one decimal, and save the two-column result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>     cyl avg_mpg
#>   <dbl>   <dbl>
#> 1     4    26.7
#> 2     6    19.7
#> 3     8    15.1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = round(mean(mpg), 1), .groups = "drop")

ex_1_2
#> # A tibble: 3 x 2
#>     cyl avg_mpg
#>   <dbl>   <dbl>
#> 1     4    26.7
#> 2     6    19.7
#> 3     8    15.1
```

**Explanation:** Wrapping the aggregation in `round(..., 1)` shapes the column at the point of computation, which is cleaner than rounding downstream because the summary table is the artifact you ship. Avoid rounding upstream of statistical work though: `round()` discards precision that matters for variance, t-tests, and regression. Round at the presentation step only.

</details>

### Exercise 1.3: Average ozone per month in airquality

**Task:** The reporting team at an air-quality office wants the monthly mean of `Ozone` from the built-in `airquality` dataset for the New York summer of 1973. Group by `Month` and produce one row per month with `avg_ozone` rounded to one decimal. Save the result to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   Month avg_ozone
#>   <int>     <dbl>
#> 1     5      23.6
#> 2     6      29.4
#> 3     7      59.1
#> 4     8      59.9
#> 5     9      31.4
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- airquality |>
  group_by(Month) |>
  summarise(avg_ozone = round(mean(Ozone, na.rm = TRUE), 1), .groups = "drop")

ex_1_3
#> # A tibble: 5 x 2
#>   Month avg_ozone
#>   <int>     <dbl>
#> 1     5      23.6
#> 2     6      29.4
#> 3     7      59.1
#> 4     8      59.9
#> 5     9      31.4
```

**Explanation:** `airquality$Ozone` has 37 missing values out of 153, so a naive `mean(Ozone)` returns `NA` for any month that contains one. Setting `na.rm = TRUE` discards those rows before averaging. This is the right default for descriptive reporting; if missingness is itself meaningful, you would instead compute a separate `n_missing = sum(is.na(Ozone))` column and decide downstream.

</details>

## Section 2. Multi-column grouping and rollups (3 problems)

Real summaries usually slice by two or three variables at once. The shape of the output changes the moment you add a second grouping column, and the `.groups` argument controls how dplyr leaves the grouping after the summary.

### Exercise 2.1: Mean horsepower by cylinder count and gear count

**Task:** Aggregate `mtcars` by two columns at once, `cyl` and `gear`, and compute `avg_hp = mean(hp)`. The output should have one row per existing cyl-and-gear combination, sorted by `cyl` then `gear`. Save to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 8 x 3
#>     cyl  gear avg_hp
#>   <dbl> <dbl>  <dbl>
#> 1     4     3   97
#> 2     4     4   76
#> 3     4     5  102
#> 4     6     3  108
#> 5     6     4  116.
#> 6     6     5  175
#> 7     8     3  194.
#> 8     8     5  300.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mtcars |>
  group_by(cyl, gear) |>
  summarise(avg_hp = mean(hp), .groups = "drop")

ex_2_1
#> # A tibble: 8 x 3
#>     cyl  gear avg_hp
#>   <dbl> <dbl>  <dbl>
#> 1     4     3   97
#> 2     4     4   76
#> 3     4     5  102
#> 4     6     3  108
#> 5     6     4  116.
#> 6     6     5  175
#> 7     8     3  194.
#> 8     8     5  300.
```

**Explanation:** Listing two columns inside `group_by()` creates one bucket per observed combination, not the full Cartesian product, so the cyl=8 gear=4 row is absent (no such car exists in `mtcars`). `.groups = "drop"` returns a plain ungrouped tibble; with the default `"drop_last"` dplyr would silently keep the data grouped by `cyl`, which can produce surprising results in any later `mutate()` or `filter()` you chain on.

</details>

### Exercise 2.2: Median price per cut and color in diamonds

**Task:** A jeweller preparing a quarterly price review wants the median list price of stones in the `diamonds` dataset broken down by `cut` and `color`. Compute `med_price` per `(cut, color)` cell. Save the long-form tibble (one row per combination) to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 35 x 3
#>    cut       color med_price
#>    <ord>     <ord>     <dbl>
#>  1 Fair      D         3730 
#>  2 Fair      E         2956.
#>  3 Fair      F         3035 
#>  4 Fair      G         3057 
#>  5 Fair      H         3816 
#>  6 Fair      I         3246 
#>  7 Fair      J         4234 
#>  8 Good      D         1838 
#>  9 Good      E         1994 
#> 10 Good      F         2281 
#> # 25 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- diamonds |>
  group_by(cut, color) |>
  summarise(med_price = median(price), .groups = "drop")

ex_2_2
#> # A tibble: 35 x 3
#>    cut       color med_price
#>    <ord>     <ord>     <dbl>
#>  1 Fair      D         3730 
#>  2 Fair      E         2956.
#>  3 Fair      F         3035 
#>  4 Fair      G         3057 
#>  5 Fair      H         3816 
#> # 30 more rows hidden
```

**Explanation:** With 5 cuts and 7 colors the full cross is 35 rows, and `diamonds` happens to have observations in every cell, so all 35 appear. Use `median()` here rather than `mean()` because diamond prices are heavily right-skewed by a handful of high-carat stones; the median answers "the typical price of a stone of this grade", which is what the jeweller cares about for pricing decisions.

</details>

### Exercise 2.3: Hierarchical rollup of diamond inventory by cut and clarity

**Task:** The category manager needs a rollup of `diamonds` showing both the row count and the total revenue per `(cut, clarity)` combination, sorted high-to-low by total revenue. Compute `n_stones` and `total_price` per group, then arrange so the most valuable combinations are on top. Save to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 40 x 4
#>    cut       clarity n_stones total_price
#>    <ord>     <ord>      <int>       <int>
#>  1 Ideal     VS2         5071    25719226
#>  2 Premium  SI1          3575    21477705
#>  3 Premium  VS2          3357    20063910
#>  4 Ideal     SI1         4282    19500488
#>  5 Ideal     VS1         3589    16769747
#> # 35 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- diamonds |>
  group_by(cut, clarity) |>
  summarise(
    n_stones    = n(),
    total_price = sum(price),
    .groups     = "drop"
  ) |>
  arrange(desc(total_price))

ex_2_3
#> # A tibble: 40 x 4
#>    cut       clarity n_stones total_price
#>    <ord>     <ord>      <int>       <int>
#>  1 Ideal     VS2         5071    25719226
#>  2 Premium  SI1          3575    21477705
#> # 38 more rows hidden
```

**Explanation:** Chaining `arrange(desc(total_price))` after the summarise turns a raw aggregation into a ranked report, the format a manager actually reads. Notice `total_price` is `<int>` here because `price` is integer; if it ever overflowed (R integers max at ~2.1 billion) you would coerce with `as.numeric(price)` before summing. For diamond revenue it does not, but the same code applied to retail sales over years can hit that ceiling.

</details>

## Section 3. across() for column-wise summaries (3 problems)

`across()` lets one call summarise many columns at once. It is the cleanest way to compute the same statistic across a panel of numeric columns, and it composes with column selection helpers like `where()` and `starts_with()`.

### Exercise 3.1: Mean of every numeric column in mtcars by cylinder

**Task:** Compute the mean of every numeric column in `mtcars` grouped by `cyl`. Use `across(where(is.numeric), mean)` so the code automatically picks up all numeric columns (every column in `mtcars` is numeric). Save the wide result to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 11
#>     cyl   mpg  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1     4  26.7  105.  82.6  4.07  2.29  19.1 0.909 0.727  4.09  1.55
#> 2     6  19.7  183. 122.   3.59  3.12  18.0 0.571 0.429  3.86  3.43
#> 3     8  15.1  353. 209.   3.23  4.00  16.8 0     0.143  3.29  3.5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars |>
  group_by(cyl) |>
  summarise(across(where(is.numeric), mean), .groups = "drop")

ex_3_1
#> # A tibble: 3 x 11
#>     cyl   mpg  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1     4  26.7  105.  82.6  4.07  2.29  19.1 0.909 0.727  4.09  1.55
#> 2     6  19.7  183. 122.   3.59  3.12  18.0 0.571 0.429  3.86  3.43
#> 3     8  15.1  353. 209.   3.23  4.00  16.8 0     0.143  3.29  3.5
```

**Explanation:** `where(is.numeric)` is a tidyselect helper that scans columns at runtime and keeps only those matching the predicate. The grouping column `cyl` is excluded automatically because dplyr peels off grouping variables before `across()` sees the column set. The `am` column averages to a fraction (e.g. 0.727 for 4-cyl cars) because it is a 0/1 indicator: a mean of an indicator is a proportion.

</details>

### Exercise 3.2: Multiple statistics across selected columns

**Task:** For each `cyl` group of `mtcars`, compute the minimum, mean, and maximum of `mpg`, `hp`, and `wt` in a single `summarise(across(...))` call. Use a named list of functions so column names come out as `mpg_min`, `mpg_mean`, `mpg_max`, etc. Save the 10-column tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 3 x 10
#>     cyl mpg_min mpg_mean mpg_max hp_min hp_mean hp_max wt_min wt_mean wt_max
#>   <dbl>   <dbl>    <dbl>   <dbl>  <dbl>   <dbl>  <dbl>  <dbl>   <dbl>  <dbl>
#> 1     4    21.4     26.7    33.9     52    82.6    113   1.51    2.29   3.19
#> 2     6    17.8     19.7    21.4    105   122.    175   2.62    3.12   3.46
#> 3     8    10.4     15.1    19.2    150   209.    335   3.17    4.00   5.42
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mtcars |>
  group_by(cyl) |>
  summarise(
    across(c(mpg, hp, wt), list(min = min, mean = mean, max = max)),
    .groups = "drop"
  )

ex_3_2
#> # A tibble: 3 x 10
#>     cyl mpg_min mpg_mean mpg_max hp_min hp_mean hp_max wt_min wt_mean wt_max
#>   <dbl>   <dbl>    <dbl>   <dbl>  <dbl>   <dbl>  <dbl>  <dbl>   <dbl>  <dbl>
#> 1     4    21.4     26.7    33.9     52    82.6    113   1.51    2.29   3.19
#> 2     6    17.8     19.7    21.4    105   122.    175   2.62    3.12   3.46
#> 3     8    10.4     15.1    19.2    150   209.    335   3.17    4.00   5.42
```

**Explanation:** Passing a named list to the second argument of `across()` produces one new column per (variable, function) pair, named `{var}_{fn}` by default. You can customize the template with the `.names` argument, e.g. `.names = "{fn}({col})"`. This idiom replaces the older `summarise_at(vars(mpg, hp, wt), funs(min, mean, max))` pattern, which is now soft-deprecated. Reach for `across()` whenever you would otherwise repeat the same function across columns.

</details>

### Exercise 3.3: Mean of all measurement columns in airquality per month, ignoring NA

**Task:** From `airquality`, compute the per-month mean of every numeric column except `Month` and `Day`. Use `across()` with a column selector that excludes those two, and pass `na.rm = TRUE` so missing readings are ignored. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 5 x 5
#>   Month Ozone Solar.R  Wind  Temp
#>   <int> <dbl>   <dbl> <dbl> <dbl>
#> 1     5  23.6    182.  11.6  65.5
#> 2     6  29.4    190.  10.3  79.1
#> 3     7  59.1    216.   8.94 83.9
#> 4     8  59.9    172.   8.79 84.0
#> 5     9  31.4    167.  10.2  76.9
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- airquality |>
  group_by(Month) |>
  summarise(
    across(-c(Month, Day), \(x) mean(x, na.rm = TRUE)),
    .groups = "drop"
  )

ex_3_3
#> # A tibble: 5 x 5
#>   Month Ozone Solar.R  Wind  Temp
#>   <int> <dbl>   <dbl> <dbl> <dbl>
#> 1     5  23.6    182.  11.6  65.5
#> 2     6  29.4    190.  10.3  79.1
#> 3     7  59.1    216.   8.94 83.9
#> 4     8  59.9    172.   8.79 84.0
#> 5     9  31.4    167.  10.2  76.9
```

**Explanation:** The selector `-c(Month, Day)` keeps every column except those two; combined with the implicit removal of the grouping variable, dplyr summarises just `Ozone`, `Solar.R`, `Wind`, and `Temp`. The lambda `\(x) mean(x, na.rm = TRUE)` is a base-R anonymous-function shorthand (R 4.1+); the older `function(x) mean(x, na.rm = TRUE)` works identically. Pass extra arguments through a lambda whenever the function needs them; bare `mean` cannot take `na.rm` directly.

</details>

## Section 4. Handling NA in group-wise aggregations (3 problems)

Missing values silently break aggregations: a single `NA` in a group turns `mean()` into `NA` for that whole row. These exercises drill the three coping strategies: skip, count, and replace.

### Exercise 4.1: Naive mean produces NA, see what happens

**Task:** Compute the per-month mean of `Solar.R` in `airquality` WITHOUT setting `na.rm = TRUE`. The result will contain at least one `NA` row because `Solar.R` has missing readings. Save the result to `ex_4_1` so you can inspect which months are affected.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   Month avg_solar
#>   <int>     <dbl>
#> 1     5       NA 
#> 2     6      190.
#> 3     7      216.
#> 4     8       NA 
#> 5     9      167.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- airquality |>
  group_by(Month) |>
  summarise(avg_solar = mean(Solar.R), .groups = "drop")

ex_4_1
#> # A tibble: 5 x 2
#>   Month avg_solar
#>   <int>     <dbl>
#> 1     5       NA 
#> 2     6      190.
#> 3     7      216.
#> 4     8       NA 
#> 5     9      167.
```

**Explanation:** `mean()` propagates `NA` by default, so any group with a single missing observation returns `NA` for the whole aggregate. This is intentional, R refuses to silently invent a summary. The fix is one of: pass `na.rm = TRUE` to skip, drop the rows upstream with `filter(!is.na(Solar.R))`, or replace `NA` with an imputed value. Pick the strategy that matches the question, never the one that just makes the warning go away.

</details>

### Exercise 4.2: Count missing readings per month

**Task:** The data-quality reviewer needs to know how many `Ozone` readings are missing in each month of `airquality`. Compute `n_missing = sum(is.na(Ozone))` and `n_total = n()` per `Month` so the team can see both the absolute count and the denominator. Save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   Month n_missing n_total
#>   <int>     <int>   <int>
#> 1     5         5      31
#> 2     6        21      30
#> 3     7         5      31
#> 4     8         5      31
#> 5     9         1      30
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- airquality |>
  group_by(Month) |>
  summarise(
    n_missing = sum(is.na(Ozone)),
    n_total   = n(),
    .groups   = "drop"
  )

ex_4_2
#> # A tibble: 5 x 3
#>   Month n_missing n_total
#>   <int>     <int>   <int>
#> 1     5         5      31
#> 2     6        21      30
#> 3     7         5      31
#> 4     8         5      31
#> 5     9         1      30
```

**Explanation:** `is.na(x)` returns a logical vector, and summing a logical vector counts its `TRUE` values because `TRUE` coerces to 1 and `FALSE` to 0. June stands out (21 missing out of 30 observations) which is something a downstream analysis should flag rather than silently average over. A common follow-up is `mutate(pct_missing = n_missing / n_total)` to put the magnitude on a comparable scale across months.

</details>

### Exercise 4.3: Replace NA with the column median before aggregating

**Task:** For `airquality`, impute missing `Ozone` and `Solar.R` values with each column's median (computed across the full dataset, not within month), then take the per-month mean. Use `mutate(across(...))` for the impute, then `group_by()` + `summarise()` for the aggregate. Save to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   Month avg_ozone avg_solar
#>   <int>     <dbl>     <dbl>
#> 1     5      27.4     187. 
#> 2     6      30.4     190. 
#> 3     7      54.6     214. 
#> 4     8      56.7     180. 
#> 5     9      31.3     167. 
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- airquality |>
  mutate(across(
    c(Ozone, Solar.R),
    \(x) ifelse(is.na(x), median(x, na.rm = TRUE), x)
  )) |>
  group_by(Month) |>
  summarise(
    avg_ozone = round(mean(Ozone), 1),
    avg_solar = round(mean(Solar.R), 1),
    .groups   = "drop"
  )

ex_4_3
#> # A tibble: 5 x 3
#>   Month avg_ozone avg_solar
#>   <int>     <dbl>     <dbl>
#> 1     5      27.4     187. 
#> 2     6      30.4     190. 
#> 3     7      54.6     214. 
#> 4     8      56.7     180. 
#> 5     9      31.3     167. 
```

**Explanation:** Imputing with a global median before grouping biases each group toward the global center, so use it only when missingness is unrelated to the group. A stronger alternative is `mutate(across(c(Ozone, Solar.R), \(x) ifelse(is.na(x), median(x, na.rm = TRUE), x)))` inside a `group_by(Month)` block so each missing value is replaced by its month's median, which preserves between-group differences. Both are first-aid; serious work uses model-based imputation.

</details>

## Section 5. Group shares, ratios, and percentages (3 problems)

Counts and means are starting points; stakeholders usually want shares. These problems drill the move from raw aggregate to percent-of-total, which requires combining `summarise()` with a follow-up `mutate()` or doing both inside one call.

### Exercise 5.1: Share of each cut grade in diamonds inventory

**Task:** A retail manager wants the percentage breakdown of stones in `diamonds` by `cut` grade. Count stones per cut, then add a `pct` column showing each row as a percentage of the 53,940 total, rounded to one decimal. Save to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   cut           n   pct
#>   <ord>     <int> <dbl>
#> 1 Fair       1610   3  
#> 2 Good       4906   9.1
#> 3 Very Good 12082  22.4
#> 4 Premium   13791  25.6
#> 5 Ideal     21551  40  
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- diamonds |>
  group_by(cut) |>
  summarise(n = n(), .groups = "drop") |>
  mutate(pct = round(100 * n / sum(n), 1))

ex_5_1
#> # A tibble: 5 x 3
#>   cut           n   pct
#>   <ord>     <int> <dbl>
#> 1 Fair       1610   3  
#> 2 Good       4906   9.1
#> 3 Very Good 12082  22.4
#> 4 Premium   13791  25.6
#> 5 Ideal     21551  40  
```

**Explanation:** The `mutate()` runs on the ungrouped summary, so `sum(n)` is the dataset total, which is what you want for an overall share. The `.groups = "drop"` in `summarise()` is critical: without it the result would still be grouped, and `sum(n)` inside `mutate()` would return each row's own value (so every `pct` would be 100). Always think about whether your follow-up calculation needs the data ungrouped.

</details>

### Exercise 5.2: Share of cylinder counts within each gear bucket

**Task:** A used-car analyst wants to see, for each `gear` bucket in `mtcars`, what percentage of cars have 4, 6, and 8 cylinders. Group by `(gear, cyl)`, count, then compute `pct_within_gear` as the percentage WITHIN each `gear` group (not the dataset total). Save to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 8 x 4
#> # Groups:   gear [3]
#>    gear   cyl     n pct_within_gear
#>   <dbl> <dbl> <int>           <dbl>
#> 1     3     4     1            6.67
#> 2     3     6     2           13.3 
#> 3     3     8    12           80   
#> 4     4     4     8           66.7 
#> 5     4     6     4           33.3 
#> 6     5     4     2           40   
#> 7     5     6     1           20   
#> 8     5     8     2           40   
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- mtcars |>
  group_by(gear, cyl) |>
  summarise(n = n(), .groups = "drop_last") |>
  mutate(pct_within_gear = round(100 * n / sum(n), 2))

ex_5_2
#> # A tibble: 8 x 4
#> # Groups:   gear [3]
#>    gear   cyl     n pct_within_gear
#>   <dbl> <dbl> <int>           <dbl>
#> 1     3     4     1            6.67
#> 2     3     6     2           13.3 
#> 3     3     8    12           80   
#> 4     4     4     8           66.7 
#> 5     4     6     4           33.3 
#> 6     5     4     2           40   
#> 7     5     6     1           20   
#> 8     5     8     2           40   
```

**Explanation:** Using `.groups = "drop_last"` keeps the data grouped by `gear` only (the outer grouping) after `summarise()`, so the `sum(n)` inside the subsequent `mutate()` is the gear-level total, not the dataset total. This is exactly when the `.groups` argument earns its keep. Verify the result: the `pct_within_gear` values inside any single `gear` bucket should sum to 100.

</details>

### Exercise 5.3: Daily ozone share of monthly total

**Task:** The environmental analyst wants a day-level table from `airquality` showing each day's `Ozone` reading as a percentage of that month's total `Ozone`. For each `(Month, Day)` keep `Ozone` and add `pct_of_month`. Drop rows where `Ozone` is missing first to avoid `NA` denominators. Save to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 116 x 4
#>    Month   Day Ozone pct_of_month
#>    <int> <int> <int>        <dbl>
#>  1     5     1    41         5.61
#>  2     5     2    36         4.92
#>  3     5     3    12         1.64
#>  4     5     4    18         2.46
#>  5     5     6    28         3.83
#> # 111 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- airquality |>
  filter(!is.na(Ozone)) |>
  group_by(Month) |>
  mutate(pct_of_month = round(100 * Ozone / sum(Ozone), 2)) |>
  ungroup() |>
  select(Month, Day, Ozone, pct_of_month)

ex_5_3
#> # A tibble: 116 x 4
#>    Month   Day Ozone pct_of_month
#>    <int> <int> <int>        <dbl>
#>  1     5     1    41         5.61
#>  2     5     2    36         4.92
#> # 114 more rows hidden
```

**Explanation:** This problem is a window-style aggregation: the result has one row per ORIGINAL observation but each row's value uses a group-level total. That is the signature of `group_by()` followed by `mutate()`, not `summarise()`. Reach for `summarise()` when you want one row per group, and for `group_by() + mutate()` when you want one row per input observation with a group-relative value attached.

</details>

## Section 6. Per-group rankings and top-N (3 problems)

The final section drills lookups: given groups, which row inside each group wins on some criterion. These exercises move between `summarise()` (when you just need the winning value) and `slice_max()` (when you need the whole row).

### Exercise 6.1: Maximum price stone in each cut grade

**Task:** A jeweller building a "premium picks" page needs the single most expensive stone of each `cut` grade in `diamonds`, returning every column of that winning row. Use `slice_max()` to pick the top row per group by `price`, breaking ties with `n = 1, with_ties = FALSE`. Save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 5 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.01 Fair      G     SI1      70.6    64 18574  7.43  6.64  4.69
#> 2  2.8  Good      F     SI2      63.5    56 18707  8.78  8.62  5.51
#> 3  2    Very Good G     SI1      63.5    56 18818  7.9   7.97  5.04
#> 4  2.29 Premium   I     VS2      60.8    60 18823  8.5   8.47  5.16
#> 5  1.51 Ideal     G     IF       61.7    55 18806  7.37  7.41  4.56
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- diamonds |>
  group_by(cut) |>
  slice_max(price, n = 1, with_ties = FALSE) |>
  ungroup()

ex_6_1
#> # A tibble: 5 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.01 Fair      G     SI1      70.6    64 18574  7.43  6.64  4.69
#> 2  2.8  Good      F     SI2      63.5    56 18707  8.78  8.62  5.51
#> 3  2    Very Good G     SI1      63.5    56 18818  7.9   7.97  5.04
#> 4  2.29 Premium   I     VS2      60.8    60 18823  8.5   8.47  5.16
#> 5  1.51 Ideal     G     IF       61.7    55 18806  7.37  7.41  4.56
```

**Explanation:** `slice_max()` keeps the top-N rows of each group ranked by a column, and it preserves every column of the chosen rows, unlike `summarise(max_price = max(price))` which would only return the price. Setting `with_ties = FALSE` guarantees exactly `n` rows per group even when several rows share the top price. Call `ungroup()` after to remove the latent grouping before any downstream join or arrange.

</details>

### Exercise 6.2: Top-3 heaviest cars per cylinder count

**Task:** From `mtcars`, return the 3 heaviest cars (highest `wt`) in each `cyl` group. Use `tibble::rownames_to_column()` first so the car names become a column called `model`, then group, then slice. Save the 9-row result to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 9 x 4
#>   model                cyl    wt   mpg
#>   <chr>              <dbl> <dbl> <dbl>
#> 1 Volvo 142E             4 2.78   21.4
#> 2 Toyota Corona          4 2.46   21.5
#> 3 Datsun 710             4 2.32   22.8
#> 4 Merc 280C              6 3.44   17.8
#> 5 Merc 280               6 3.44   19.2
#> 6 Valiant                6 3.46   18.1
#> 7 Lincoln Continental    8 5.42   10.4
#> 8 Cadillac Fleetwood     8 5.25   10.4
#> 9 Chrysler Imperial      8 5.34   14.7
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- mtcars |>
  tibble::rownames_to_column("model") |>
  group_by(cyl) |>
  slice_max(wt, n = 3, with_ties = FALSE) |>
  ungroup() |>
  select(model, cyl, wt, mpg)

ex_6_2
#> # A tibble: 9 x 4
#>   model                cyl    wt   mpg
#>   <chr>              <dbl> <dbl> <dbl>
#> 1 Volvo 142E             4 2.78   21.4
#> 2 Toyota Corona          4 2.46   21.5
#> # 7 more rows hidden
```

**Explanation:** `mtcars` stores car names in row names, which dplyr ignores by default, so the first step has to promote them to a real column. The `tibble::rownames_to_column()` call does that without modifying the row count. `slice_max(wt, n = 3)` then keeps the three heaviest rows per group. Same pattern works with `slice_min()` for bottom-N and `slice_sample(n = k)` for random k-per-group sampling, both heavily used for stratified sampling.

</details>

### Exercise 6.3: Distinct color count per cut grade

**Task:** A merchandising lead wants to know how many distinct `color` grades exist within each `cut` grade in `diamonds`, plus the total stone count, plus the median `carat`. Use `n_distinct()` for the color count and combine three statistics in one `summarise()` call. Save to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   cut       n_colors n_stones med_carat
#>   <ord>        <int>    <int>     <dbl>
#> 1 Fair             7     1610      1   
#> 2 Good             7     4906      0.82
#> 3 Very Good        7    12082      0.71
#> 4 Premium          7    13791      0.86
#> 5 Ideal            7    21551      0.54
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- diamonds |>
  group_by(cut) |>
  summarise(
    n_colors  = n_distinct(color),
    n_stones  = n(),
    med_carat = median(carat),
    .groups   = "drop"
  )

ex_6_3
#> # A tibble: 5 x 4
#>   cut       n_colors n_stones med_carat
#>   <ord>        <int>    <int>     <dbl>
#> 1 Fair             7     1610      1   
#> 2 Good             7     4906      0.82
#> 3 Very Good        7    12082      0.71
#> 4 Premium          7    13791      0.86
#> 5 Ideal            7    21551      0.54
```

**Explanation:** `n_distinct(x)` is the dplyr-friendly equivalent of `length(unique(x))` but faster on large vectors and `NA`-aware (use `na.rm = TRUE` to exclude them). Notice the median carat falls from 1.0 (Fair) to 0.54 (Ideal): the rarest, best-cut stones tend to be smaller because cutting a large stone to Ideal proportions wastes too much rough. That trade-off is exactly the kind of business insight a multi-statistic summary reveals at a glance.

</details>

## What to do next

- Drill multi-table aggregation on the [dplyr Joins Exercises](dplyr-Joins-Exercises-in-R.html) hub.
- Practise the reshape side of summaries on the [tidyr pivot_longer + pivot_wider Exercises](tidyr-Pivot-Longer-Wider-Exercises-in-R.html).
- Revisit the parent lesson [dplyr group_by + summarise](dplyr-group-by-summarise.html) if any pattern above felt unfamiliar.
- For column-wise transformations beyond `across()`, see [dplyr Exercises in R](dplyr-Exercises-in-R.html).
