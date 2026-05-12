---
title: "dplyr group_by Exercises in R: 25 Real-World Practice Problems"
slug: "dplyr-Group-By-Exercises-in-R"
description: "Twenty-five dplyr group_by exercises with hidden solutions: grouped summarise, mutate, slice, .by argument, sticky-group gotchas, rolling windows."
keywords: "dplyr group_by exercises, group_by R practice, R group operations exercises, dplyr summarise practice, .by argument R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "dplyr group_by Exercises"
sidebar_order: 131
fr_parent: "dplyr-group_by-in-R.html"
auto_link_terms: "dplyr group_by exercises|group_by R practice|R group operations exercises|grouped summarise|.by argument"
auto_link_case_sensitive: false
target_keyword: "dplyr group_by exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dplyr group_by Exercises in R: 25 Real-World Practice Problems

<p class="lead">Twenty-five practice problems covering grouped summarise, grouped mutate and slice, the .by argument, .groups discipline, lag and cumulative windows within groups, plus real stakeholder workflows. Try each one in the editor first, then click to reveal the solution.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(slider)
```

## Section 1. Grouped summarise basics (5 problems)

### Exercise 1.1: Compute the mean mpg for each cylinder count

**Task:** Using the built-in `mtcars` dataset, group the rows by `cyl` and compute the mean of `mpg` for each group. Return a two-column tibble with `cyl` and `mean_mpg`. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4    26.66
#> 2     6    19.74
#> 3     8    15.10
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
  summarise(mean_mpg = mean(mpg))
ex_1_1
#> # A tibble: 3 x 2
#>     cyl mean_mpg
#>   <dbl>    <dbl>
#> 1     4    26.66
#> 2     6    19.74
#> 3     8    15.10
```

**Explanation:** `group_by()` partitions the tibble into groups but does not aggregate; `summarise()` collapses each group into a single row. The result drops one level of grouping (here, all of it, because there was only one grouping variable) and returns a regular tibble. Forgetting to call `summarise()` and chaining a row-level verb instead is the most common beginner mistake.

</details>

### Exercise 1.2: Count cars per gear and carburetor combination

**Task:** Using `mtcars`, group by both `gear` and `carb` and return the count of cars in each combination using `n()`. Sort the result by count descending and save to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 11 x 3
#> # Groups:   gear [3]
#>    gear  carb     n
#>   <dbl> <dbl> <int>
#> 1     3     2     6
#> 2     3     4     6
#> 3     4     2     4
#> 4     4     4     4
#> 5     5     2     2
#> # 6 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mtcars |>
  group_by(gear, carb) |>
  summarise(n = n(), .groups = "keep") |>
  arrange(desc(n))
ex_1_2
```

**Explanation:** Two grouping variables create a row per unique pair that actually exists in the data; combinations with zero observations are not returned by default. `n()` counts rows in the current group. The `.groups = "keep"` argument preserves both grouping levels in the output so the printed header reflects the grouping, while `"drop"` removes them entirely. Choose deliberately to avoid lingering-group surprises downstream.

</details>

### Exercise 1.3: Marketing analyst summarises click-through by campaign

**Task:** A marketing analyst is preparing a weekly performance review. From the inline campaign tibble below, compute total impressions, total clicks, and click-through rate (ctr = clicks/impressions) per `campaign`. Save the result to `ex_1_3` and sort by ctr descending.

```r title="Inline data"
campaigns <- tibble(
  campaign    = rep(c("A", "B", "C"), each = 4),
  day         = rep(1:4, times = 3),
  impressions = c(1200, 1500, 1100, 1300, 800, 900, 850, 950, 2000, 2100, 1950, 2200),
  clicks      = c(  36,   45,   33,   39,  40,  45,  43,  47,   60,   63,   58,   66)
)
```

**Expected result:**

```
#> # A tibble: 3 x 4
#>   campaign impressions clicks    ctr
#>   <chr>          <dbl>  <dbl>  <dbl>
#> 1 B               3500    175 0.0500
#> 2 A               5100    153 0.0300
#> 3 C               8250    247 0.0299
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- campaigns |>
  group_by(campaign) |>
  summarise(
    impressions = sum(impressions),
    clicks      = sum(clicks),
    ctr         = clicks / impressions,
    .groups = "drop"
  ) |>
  arrange(desc(ctr))
ex_1_3
```

**Explanation:** Within `summarise()`, expressions are evaluated in order so `ctr` can reference the just-computed `clicks` and `impressions` aggregates. This is cleaner than computing daily ctr first and averaging it, which would give the wrong answer because days with different impression volumes should not be weighted equally. Always aggregate the numerator and denominator separately, then divide.

</details>

### Exercise 1.4: Per-species petal and sepal summary

**Task:** Using the `iris` dataset, group by `Species` and report the mean of all four numeric columns plus the count of rows per species. Save the result to `ex_1_4`. Use `across()` so you do not have to name each column explicitly.

**Expected result:**

```
#> # A tibble: 3 x 6
#>   Species    Sepal.Length Sepal.Width Petal.Length Petal.Width     n
#>   <fct>             <dbl>       <dbl>        <dbl>       <dbl> <int>
#> 1 setosa            5.006       3.428        1.462       0.246    50
#> 2 versicolor        5.936       2.770        4.260       1.326    50
#> 3 virginica         6.588       2.974        5.552       2.026    50
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric), mean), n = n(), .groups = "drop")
ex_1_4
```

**Explanation:** `across(where(is.numeric), mean)` applies `mean()` to every numeric column without spelling each name, which scales to wide tables. `where()` is a tidyselect helper that takes a predicate function. Putting `n = n()` after `across()` adds the row count as an extra column without interfering with the across loop. If you need different stats per column, pass a named list of functions to `across()`.

</details>

### Exercise 1.5: Diamond price quartiles by cut

**Task:** A jeweller setting display tiers wants to know the 25th, 50th, and 75th percentile of `price` within each diamond `cut`. Compute these for the `diamonds` dataset, return a tibble with `cut`, `p25`, `p50`, `p75`, and save the result to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   cut         p25   p50    p75
#>   <ord>     <dbl> <dbl>  <dbl>
#> 1 Fair       2050  3282   5206
#> 2 Good        912  3050.  5028
#> 3 Very Good   912  2648   5373
#> 4 Premium    1046  3185   6296
#> 5 Ideal       878  1810   4678.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- diamonds |>
  group_by(cut) |>
  summarise(
    p25 = quantile(price, 0.25),
    p50 = quantile(price, 0.50),
    p75 = quantile(price, 0.75),
    .groups = "drop"
  )
ex_1_5
```

**Explanation:** `quantile()` returns a single named number when given one probability, which is exactly what `summarise()` expects per group. If you instead pass a vector of probabilities, you get a list-column and the output stops being tidy. A common shortcut for several quantiles is `reframe(price = quantile(price, c(.25, .5, .75)), q = c(.25, .5, .75))`, which produces a long-format tibble.

</details>

## Section 2. Multi-key grouping and the .by argument (5 problems)

### Exercise 2.1: Diamond price by cut and color

**Task:** Compute the mean `price` for each combination of `cut` and `color` in the `diamonds` dataset. Drop all grouping in the output so subsequent operations behave as ungrouped. Save the result to `ex_2_1` sorted by `cut` then `color`.

**Expected result:**

```
#> # A tibble: 35 x 3
#>    cut   color  mean_price
#>    <ord> <ord>       <dbl>
#>  1 Fair  D           4291.
#>  2 Fair  E           3682.
#>  3 Fair  F           3827.
#>  4 Fair  G           4239.
#>  5 Fair  H           5135.
#> # 30 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- diamonds |>
  group_by(cut, color) |>
  summarise(mean_price = mean(price), .groups = "drop")
ex_2_1
```

**Explanation:** With two grouping variables, `summarise()` by default peels off the last one and keeps the first as the lingering grouping, which silently affects later steps. Passing `.groups = "drop"` returns a plain tibble so the next verb operates on the whole result. The `.groups` warning that dplyr emits when you omit it is not just noise; it points at a real source of bugs.

</details>

### Exercise 2.2: Use the .by argument for one-shot grouping

**Task:** Compute the mean highway mpg per manufacturer on the `mpg` dataset, but use the `.by` argument inside `summarise()` instead of a separate `group_by()` call. The output should be ungrouped automatically. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 15 x 2
#>    manufacturer mean_hwy
#>    <chr>           <dbl>
#>  1 audi             26.4
#>  2 chevrolet        21.9
#>  3 dodge            17.9
#>  4 ford             19.4
#>  5 honda            32.6
#> # 10 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- mpg |>
  summarise(mean_hwy = mean(hwy), .by = manufacturer)
ex_2_2
```

**Explanation:** Introduced in dplyr 1.1, `.by` performs a one-call grouping that does NOT persist beyond the verb it appears in, so the result is always ungrouped. This avoids the most common dplyr footgun: a `group_by()` that survives long after you wanted it. Prefer `.by` for single-step grouping; reach for `group_by()` only when several verbs share the same grouping.

</details>

### Exercise 2.3: Verify the grouping state after summarise

**Task:** Group `mtcars` by `cyl` and `am`, run a `summarise()` that computes `mean_mpg` keeping both groupings, then use `group_vars()` on the result to confirm what grouping lingers. Save the resulting tibble to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 6 x 3
#> # Groups:   cyl, am [6]
#>     cyl    am mean_mpg
#>   <dbl> <dbl>    <dbl>
#> 1     4     0    22.9
#> 2     4     1    28.07
#> 3     6     0    19.12
#> 4     6     1    20.57
#> 5     8     0    15.05
#> # 1 more row hidden
#> group_vars(ex_2_3): c("cyl", "am")
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
group_vars(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- mtcars |>
  group_by(cyl, am) |>
  summarise(mean_mpg = mean(mpg), .groups = "keep")
group_vars(ex_2_3)
#> [1] "cyl" "am"
```

**Explanation:** Without `.groups`, dplyr defaults to `"drop_last"` and peels off only the rightmost grouping, leaving `cyl` attached. With `.groups = "keep"` both are retained; with `"drop"` you get a plain tibble. `group_vars()` is the diagnostic call to confirm what state you are in before passing the data forward.

</details>

### Exercise 2.4: Risk team computes daily P and L by book and strategy

**Task:** A risk team is rolling up trader P and L for the daily report. From the inline `trades` tibble, compute total `pnl` per `book` and `strategy` combination. Drop grouping from the output and save the result to `ex_2_4`.

```r title="Inline data"
trades <- tibble(
  trade_id = 1:12,
  book     = rep(c("Equities", "Macro"), each = 6),
  strategy = rep(c("Momentum", "MeanRev", "Carry"), times = 4),
  pnl      = c(1200, -340, 880, 410, 220, -150, 760, 980, -210, 330, -90, 1100)
)
```

**Expected result:**

```
#> # A tibble: 6 x 3
#>   book     strategy   pnl
#>   <chr>    <chr>    <dbl>
#> 1 Equities Carry      730
#> 2 Equities MeanRev    -490
#> 3 Equities Momentum  1610
#> 4 Macro    Carry      890
#> 5 Macro    MeanRev   1070
#> 6 Macro    Momentum   550
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- trades |>
  group_by(book, strategy) |>
  summarise(pnl = sum(pnl), .groups = "drop") |>
  arrange(book, strategy)
ex_2_4
```

**Explanation:** Risk reporting uses `sum()` over the slice, never `mean()`, because pnl is additive across trades. The `.groups = "drop"` matters here because downstream you might pivot or join the result to a positions table; lingering groups would change the join semantics. Sorting by book then strategy gives a stable, deterministic output for snapshot diffing.

</details>

### Exercise 2.5: Compare group_by + summarise vs summarise with .by

**Task:** Compute the count of rows per `cut` in the `diamonds` dataset two ways: once with `group_by() |> summarise()`, once with `summarise(.by = cut)`. Save the two results to `ex_2_5_a` and `ex_2_5_b` and confirm they have the same values but the same ungrouped state with `group_vars()`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   cut           n
#>   <ord>     <int>
#> 1 Fair       1610
#> 2 Good       4906
#> 3 Very Good 12082
#> 4 Premium   13791
#> 5 Ideal     21551
#> group_vars(ex_2_5_a): character(0)
#> group_vars(ex_2_5_b): character(0)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_5_a <- # your code here
ex_2_5_b <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5_a <- diamonds |>
  group_by(cut) |>
  summarise(n = n(), .groups = "drop")

ex_2_5_b <- diamonds |>
  summarise(n = n(), .by = cut)

group_vars(ex_2_5_a)
#> character(0)
group_vars(ex_2_5_b)
#> character(0)
```

**Explanation:** Both produce the same five-row tibble with identical counts; the difference is purely about grouping state and code style. `.by` is concise for a single verb and never leaves persistent groups, while `group_by()` is preferable when several consecutive verbs share the grouping. Mixing the two on the same data raises an error because their semantics conflict.

</details>

## Section 3. Grouped mutate, filter, and slice (5 problems)

### Exercise 3.1: Add per-group mean as a new column

**Task:** Using the `mtcars` dataset, group by `cyl` and add a new column `mpg_group_mean` equal to the mean mpg of each car's cylinder group. Do not collapse rows; the output should have all 32 rows. Save the result to `ex_3_1` and ungroup at the end.

**Expected result:**

```
#> # A tibble: 32 x 12
#>    mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb mpg_group_mean
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>          <dbl>
#> 1 21       6  160    110  3.90  2.62  16.5     0     1     4     4          19.74
#> 2 21       6  160    110  3.90  2.88  17.0     0     1     4     4          19.74
#> 3 22.8     4  108     93  3.85  2.32  18.6     1     1     4     1          26.66
#> # 29 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
head(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars |>
  group_by(cyl) |>
  mutate(mpg_group_mean = mean(mpg)) |>
  ungroup()
head(ex_3_1)
```

**Explanation:** `mutate()` after `group_by()` evaluates the expression once per group but writes the value back to every row in that group, which is how you broadcast group-level stats. This is the standard trick for centering or normalizing within a group. Always `ungroup()` afterwards; otherwise subsequent verbs like `filter()` or `arrange()` will behave per-group and surprise you.

</details>

### Exercise 3.2: Keep the top three most fuel-efficient cars per cylinder count

**Task:** A fleet buyer wants the three highest-mpg cars within each `cyl` group of `mtcars`. Use `slice_max()` to pick the top rows per group, and lift the rowname into a `model` column first so you can see which cars won. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 9 x 12
#> # Groups:   cyl [3]
#>   model              mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <chr>             <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Toyota Corolla     33.9     4    71    65  4.22  1.83  19.9     1     1     4     1
#> 2 Fiat 128           32.4     4    78.7  66  4.08  2.20  19.5     1     1     4     1
#> 3 Honda Civic        30.4     4    75.7  52  4.93  1.62  18.5     1     1     4     2
#> 4 Hornet 4 Drive     21.4     6   258   110  3.08  3.21  19.4     1     0     3     1
#> 5 Mazda RX4 Wag      21       6   160   110  3.90  2.88  17.0     0     1     4     4
#> # 4 more rows hidden
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
  tibble::rownames_to_column("model") |>
  group_by(cyl) |>
  slice_max(mpg, n = 3) |>
  arrange(cyl, desc(mpg))
ex_3_2
```

**Explanation:** `slice_max()` returns the top-n rows by the named column WITHIN each group, which is the natural way to get a leaderboard partitioned by some key. Without `group_by()` it would just return the top three overall. Note that ties at the cutoff would inflate the group sizes; pass `with_ties = FALSE` for a strict top-n.

</details>

### Exercise 3.3: Pharmacology team keeps the first dose record per patient

**Task:** A pharmacology team is building a baseline cohort from the inline `doses` tibble. For each `patient_id`, keep the row with the earliest `dose_date`. Save the result to `ex_3_3` and ensure the output is ungrouped.

```r title="Inline data"
doses <- tibble(
  patient_id = c(1, 1, 1, 2, 2, 3, 3, 3, 4),
  dose_date  = as.Date(c("2025-01-04","2025-02-09","2025-03-15",
                         "2025-01-22","2025-02-28",
                         "2025-01-08","2025-02-04","2025-03-19",
                         "2025-02-11")),
  dose_mg    = c(10, 20, 20, 5, 5, 15, 15, 30, 25)
)
```

**Expected result:**

```
#> # A tibble: 4 x 3
#>   patient_id dose_date  dose_mg
#>        <dbl> <date>       <dbl>
#> 1          1 2025-01-04      10
#> 2          2 2025-01-22       5
#> 3          3 2025-01-08      15
#> 4          4 2025-02-11      25
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- doses |>
  group_by(patient_id) |>
  slice_min(dose_date, n = 1, with_ties = FALSE) |>
  ungroup()
ex_3_3
```

**Explanation:** Picking the baseline row per subject is one of the most common operations in clinical and longitudinal data. `slice_min()` with `n = 1` and `with_ties = FALSE` guarantees exactly one row per patient even when two records share the earliest date. The alternative `filter(dose_date == min(dose_date))` works but returns all ties, which is rarely what cohort definitions want.

</details>

### Exercise 3.4: Keep only groups with at least four observations

**Task:** Using the `mpg` dataset, keep only the rows belonging to manufacturers that have 4 or more vehicle records, then return all original columns for those rows. Save the result to `ex_3_4` and confirm with a count of rows per manufacturer.

**Expected result:**

```
#> # A tibble: 229 x 11
#>   manufacturer model    displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>    <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 audi         a4         1.8  1999     4 auto(l5)   f        18    29 p     compa
#> 2 audi         a4         1.8  1999     4 manual(m5) f        21    29 p     compa
#> # 227 more rows hidden
#> count(ex_3_4, manufacturer) shows 14 manufacturers with n >= 4
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
count(ex_3_4, manufacturer)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- mpg |>
  group_by(manufacturer) |>
  filter(n() >= 4) |>
  ungroup()
count(ex_3_4, manufacturer)
```

**Explanation:** `filter()` after `group_by()` keeps or drops ENTIRE groups based on a group-level predicate, here `n() >= 4`. This is different from `count() |> filter()` followed by a join; it preserves all original columns in one step. The `ungroup()` at the end is essential because anything left attached changes the behaviour of downstream verbs.

</details>

### Exercise 3.5: Compute a z-score within each species

**Task:** Standardize `Sepal.Length` within each `Species` of the `iris` dataset by subtracting the species mean and dividing by the species standard deviation. Add the result as a new column `sl_z` and keep all original columns. Save the result to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 150 x 6
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species   sl_z
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>    <dbl>
#> 1          5.1         3.5          1.4         0.2 setosa   0.267
#> 2          4.9         3.0          1.4         0.2 setosa  -0.301
#> 3          4.7         3.2          1.3         0.2 setosa  -0.869
#> # 147 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_5 <- # your code here
head(ex_3_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- iris |>
  group_by(Species) |>
  mutate(sl_z = (Sepal.Length - mean(Sepal.Length)) / sd(Sepal.Length)) |>
  ungroup()
head(ex_3_5)
```

**Explanation:** Within-group standardization is the cornerstone of many EDA workflows: it removes between-group differences so you can examine within-group variability on a common scale. Doing this without `group_by()` would standardize against the global mean and sd, which conflates the two sources of variation. `scale()` returns a matrix; using a manual expression keeps the column numeric and pipe-friendly.

</details>

## Section 4. Window operations within groups (5 problems)

### Exercise 4.1: Rank cars within each cylinder group by mpg

**Task:** For the `mtcars` dataset, assign a within-group rank from 1 (highest mpg) to N for each car in its `cyl` group. Use `row_number()` with `desc(mpg)`. Add the rank as `rank_in_cyl` and save the result to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 32 x 12
#> # Groups:   cyl [3]
#>     mpg   cyl   ...   rank_in_cyl
#>   <dbl> <dbl> <...>         <int>
#> 1 21       6                    4
#> 2 21       6                    5
#> 3 22.8     4                   10
#> 4 21.4     6                    3
#> 5 18.7     8                    9
#> # 27 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mtcars |>
  group_by(cyl) |>
  mutate(rank_in_cyl = row_number(desc(mpg)))
ex_4_1
```

**Explanation:** `row_number()` is dplyr's strict integer rank: every row gets a unique rank with ties broken by row order. When called inside `mutate()` after `group_by()`, it resets to 1 at the start of each group. Use `min_rank()` if you want tied rows to share a rank, or `dense_rank()` if you want gapless ranks after ties.

</details>

### Exercise 4.2: Trading desk computes day-over-day price change per ticker

**Task:** A trading desk wants the daily price change for each ticker. From the inline `prices` tibble, group by `ticker`, sort within group by `date`, and add a `change` column equal to today's price minus the previous day's price using `lag()`. Save the result to `ex_4_2`.

```r title="Inline data"
prices <- tibble(
  date   = rep(as.Date("2024-01-02") + 0:4, times = 2),
  ticker = rep(c("AAPL", "MSFT"), each = 5),
  price  = c(185.7, 184.3, 186.1, 188.0, 187.4,
             376.0, 378.5, 377.2, 380.1, 382.9)
)
```

**Expected result:**

```
#> # A tibble: 10 x 4
#>    date       ticker price change
#>    <date>     <chr>  <dbl>  <dbl>
#> 1  2024-01-02 AAPL   185.7   NA
#> 2  2024-01-03 AAPL   184.3  -1.4
#> 3  2024-01-04 AAPL   186.1   1.8
#> 4  2024-01-05 AAPL   188.0   1.9
#> 5  2024-01-06 AAPL   187.4  -0.6
#> 6  2024-01-02 MSFT   376.0   NA
#> # 4 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- prices |>
  group_by(ticker) |>
  arrange(date, .by_group = TRUE) |>
  mutate(change = price - lag(price)) |>
  ungroup()
ex_4_2
```

**Explanation:** `lag()` inside a grouped mutate respects the group boundaries: the first row of each group gets `NA` rather than borrowing from the previous ticker. `arrange(date, .by_group = TRUE)` sorts within each group first, then by date, which is critical for time-series logic. Without `.by_group`, a global sort would interleave tickers and `lag()` would compare AAPL today against MSFT yesterday.

</details>

### Exercise 4.3: Cumulative ozone exposure by month

**Task:** From the `airquality` dataset, drop rows where `Ozone` is `NA`, then within each `Month` compute a running cumulative sum of `Ozone` ordered by `Day`. Save the result to `ex_4_3` with columns `Month`, `Day`, `Ozone`, and `cum_ozone`.

**Expected result:**

```
#> # A tibble: 116 x 4
#> # Groups:   Month [5]
#>   Month   Day Ozone cum_ozone
#>   <int> <int> <int>     <int>
#> 1     5     1    41        41
#> 2     5     2    36        77
#> 3     5     3    12        89
#> 4     5     4    18       107
#> 5     5     6    28       135
#> # 111 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- airquality |>
  filter(!is.na(Ozone)) |>
  group_by(Month) |>
  arrange(Day, .by_group = TRUE) |>
  mutate(cum_ozone = cumsum(Ozone)) |>
  select(Month, Day, Ozone, cum_ozone)
ex_4_3
```

**Explanation:** `cumsum()` is a window function: inside `mutate()` after `group_by()`, it accumulates from the start of each group and resets at every group boundary. Sorting by `Day` first with `.by_group = TRUE` guarantees the cumulative makes temporal sense within each month. Forgetting to filter `NA` would propagate `NA` forward through the cumulative sum and ruin the result.

</details>

### Exercise 4.4: Dense rank diamond prices within cut

**Task:** Within each `cut` of the `diamonds` dataset, assign `dense_rank()` of `price` from highest to lowest. Keep only rows where the rank is in the top 3 per cut. Save the result to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 15 x 11
#> # Groups:   cut [5]
#>   carat cut       color clarity depth table price  ...  price_rank
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <...>      <int>
#> 1  2.27 Fair      J     SI1      62.5    61 18280               1
#> 2  2.61 Fair      I     SI2      62.2    65 18266               2
#> 3  2.32 Fair      I     SI1      59.3    62 18034               3
#> # 12 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- diamonds |>
  group_by(cut) |>
  mutate(price_rank = dense_rank(desc(price))) |>
  filter(price_rank <= 3) |>
  arrange(cut, price_rank)
ex_4_4
```

**Explanation:** `dense_rank()` returns gapless ranks: with ties at rank 1, the next rank is 2, not 3. `row_number()` and `min_rank()` behave differently around ties, so the choice matters. Filtering after the rank is computed lets you pick "top three including ties" semantics; if you want exactly three rows, switch to `slice_max(price, n = 3)`.

</details>

### Exercise 4.5: First and last weight per chick

**Task:** From the `ChickWeight` dataset, for each `Chick` compute the first weight, the last weight, and the absolute gain (last minus first). Save the result to `ex_4_5`, sorted by gain descending so the top growers appear first.

**Expected result:**

```
#> # A tibble: 50 x 4
#>    Chick first_w last_w  gain
#>    <ord>   <dbl>  <dbl> <dbl>
#> 1  35         39    361   322
#> 2  34         41    341   300
#> 3  40         42    340   298
#> 4  49         39    332   293
#> 5  41         42    322   280
#> # 45 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- ChickWeight |>
  group_by(Chick) |>
  arrange(Time, .by_group = TRUE) |>
  summarise(
    first_w = first(weight),
    last_w  = last(weight),
    gain    = last(weight) - first(weight),
    .groups = "drop"
  ) |>
  arrange(desc(gain))
ex_4_5
```

**Explanation:** `first()` and `last()` are dplyr helpers that return the first and last observation of a vector, but only in the order the data is sorted. Always `arrange()` first when temporal meaning matters. An alternative is `slice_head(n=1)` plus `slice_tail(n=1)` followed by a join, but the `summarise()` approach is one pass and much cleaner.

</details>

## Section 5. Stakeholder workflows and gotchas (5 problems)

### Exercise 5.1: Diagnose and fix a sticky-group bug

**Task:** A junior analyst computed average weight per diet on `ChickWeight` by chaining `group_by(Diet) |> summarise() |> mutate(rank = row_number(desc(mean_w)))` and got odd rankings because they did not realize what `.groups` did. Reproduce the corrected pipeline, dropping groups before the ranking step, and save the right answer to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   Diet  mean_w  rank
#>   <fct>  <dbl> <int>
#> 1 3      142.95    1
#> 2 4      135.26    2
#> 3 2      122.62    3
#> 4 1      102.65    4
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ChickWeight |>
  group_by(Diet) |>
  summarise(mean_w = mean(weight), .groups = "drop") |>
  mutate(rank = row_number(desc(mean_w))) |>
  arrange(rank)
ex_5_1
```

**Explanation:** With a single grouping variable the sticky behaviour is benign because `.groups = "drop_last"` removes the only level, but the principle generalizes: whenever you chain `summarise()` into a window function like `row_number()`, you want NO lingering groups so the rank is computed across the whole result. Being explicit with `.groups = "drop"` is defensive and self-documenting.

</details>

### Exercise 5.2: Growth team builds a monthly active-users summary

**Task:** A growth team is preparing a monthly retention dashboard. From the inline `events` tibble of user logins, compute the number of distinct users who logged in each `month`, sorted chronologically. Save the result to `ex_5_2`.

```r title="Inline data"
events <- tibble(
  user_id = c(1,1,1,2,2,3,3,3,4,4,5,5,5,5,6,6),
  month   = c("2025-01","2025-02","2025-03","2025-01","2025-02",
              "2025-01","2025-02","2025-03","2025-02","2025-03",
              "2025-01","2025-02","2025-03","2025-04","2025-03","2025-04")
)
```

**Expected result:**

```
#> # A tibble: 4 x 2
#>   month   active_users
#>   <chr>          <int>
#> 1 2025-01            4
#> 2 2025-02            5
#> 3 2025-03            5
#> 4 2025-04            2
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- events |>
  group_by(month) |>
  summarise(active_users = n_distinct(user_id), .groups = "drop") |>
  arrange(month)
ex_5_2
```

**Explanation:** `n_distinct()` counts unique values within the current group, which is exactly the metric for "active users" or "unique visitors". Plain `n()` would over-count because the same user appears multiple times within a month. Sorting by `month` works here because the strings are ISO-formatted; for non-ISO dates you must parse to Date type first.

</details>

### Exercise 5.3: Audit team flags negative diamond prices

**Task:** An audit team wants to ensure the inventory has no impossible prices. Group the `diamonds` dataset by `cut` and report, per cut: the count of rows, the minimum price, and a flag `has_neg` that is `TRUE` if any price in that group is below zero. Save the result to `ex_5_3`. The real dataset has none, so `has_neg` should be `FALSE` everywhere.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   cut           n min_price has_neg
#>   <ord>     <int>     <int> <lgl>
#> 1 Fair       1610       337 FALSE
#> 2 Good       4906       327 FALSE
#> 3 Very Good 12082       336 FALSE
#> 4 Premium   13791       326 FALSE
#> 5 Ideal     21551       326 FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- diamonds |>
  group_by(cut) |>
  summarise(
    n         = n(),
    min_price = min(price),
    has_neg   = any(price < 0),
    .groups   = "drop"
  )
ex_5_3
```

**Explanation:** Data-quality checks are perfect candidates for `summarise()` because they collapse a group of rows into one yes/no answer. `any()` is the canonical idiom for "does the group contain at least one bad row". Reporting both `min_price` and `has_neg` gives the human reviewer enough context to act, instead of just a boolean. Always prefer explicit validation passes over silent assumptions.

</details>

### Exercise 5.4: Risk team computes 5-day rolling mean price per ticker

**Task:** Using the same `prices` tibble from Exercise 4.2, compute a 5-day trailing mean of `price` within each `ticker`. Use `slider::slide_dbl()` with `.before = 4` and `.complete = TRUE` so the first four rows of each ticker produce `NA`. Save the result to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 10 x 4
#>    date       ticker price  ma5
#>    <date>     <chr>  <dbl> <dbl>
#> 1  2024-01-02 AAPL   185.7   NA
#> 2  2024-01-03 AAPL   184.3   NA
#> 3  2024-01-04 AAPL   186.1   NA
#> 4  2024-01-05 AAPL   188.0   NA
#> 5  2024-01-06 AAPL   187.4 186.3
#> 6  2024-01-02 MSFT   376.0   NA
#> # 4 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- prices |>
  group_by(ticker) |>
  arrange(date, .by_group = TRUE) |>
  mutate(ma5 = slider::slide_dbl(price, mean, .before = 4, .complete = TRUE)) |>
  ungroup()
ex_5_4
```

**Explanation:** `slider::slide_dbl()` walks a sliding window and applies a function returning a double. `.before = 4` plus the current row gives a 5-row window; `.complete = TRUE` returns `NA` until the window is fully populated. Inside a grouped `mutate()`, the window resets at each group boundary, which is exactly the behaviour needed for per-ticker moving averages. The pure dplyr alternative is to chain `lag()` four times and average, but slider is built for this.

</details>

### Exercise 5.5: ChickWeight average growth trajectory by diet

**Task:** Compute the average weight at each measurement `Time` within each `Diet` from the `ChickWeight` dataset, plus the count of chicks contributing at that time. Save the result to `ex_5_5` sorted by `Diet` then `Time`, so the resulting tibble could feed a line plot of mean trajectories.

**Expected result:**

```
#> # A tibble: 48 x 4
#>   Diet   Time mean_w     n
#>   <fct> <dbl>  <dbl> <int>
#> 1 1         0   41.4    20
#> 2 1         2   47.25   20
#> 3 1         4   56.5    20
#> 4 1         6   66.9    20
#> 5 1         8   79.7    20
#> # 43 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- ChickWeight |>
  group_by(Diet, Time) |>
  summarise(mean_w = mean(weight), n = n(), .groups = "drop") |>
  arrange(Diet, Time)
ex_5_5
```

**Explanation:** Two-key grouping (Diet, Time) plus `summarise()` is the canonical recipe for a longitudinal panel summary. Including `n` is non-negotiable in real reporting: if attrition causes the count to drop over time, the trajectory is no longer comparable across time points and you need to flag that. Dropping all grouping with `.groups = "drop"` makes the result safe to plot or join downstream.

</details>

## What to do next

- Review the parent reference page on [dplyr group_by](dplyr-group_by-in-R.html) for the full argument list and edge cases.
- Practice complementary verbs in the [dplyr summarise exercises](dplyr-Exercises-in-R.html) hub.
- Push into time-aware groupings with the [dplyr Window Functions exercises](dplyr-Window-Functions-Exercises-in-R.html).
- For multi-table joins after grouping, work through the [dplyr Joins exercises](dplyr-Joins-Exercises-in-R.html).
