---
title: "tidyr Pivot Exercises in R: 18 pivot_longer & pivot_wider Problems"
slug: "tidyr-Pivot-Exercises-in-R"
description: "18 hands-on pivot_longer and pivot_wider problems with worked solutions: reshape wide to long, aggregate during pivots, handle paired columns, and more."
keywords: "pivot_longer exercises, pivot_wider exercises, tidyr pivot, reshape data R, wide to long R, long to wide R, names_sep, names_pattern, .value"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "tidyr Pivot Exercises"
sidebar_order: 145
fr_parent: "pivot_longer-pivot_wider-Reshape-Data-in-R.html"
auto_link_terms: "pivot_longer|pivot_wider|reshape data in r|wide to long|tidyr pivot|names_to"
auto_link_case_sensitive: false
target_keyword: "pivot_longer pivot_wider exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# tidyr Pivot Exercises in R: 18 pivot_longer & pivot_wider Problems

<p class="lead">Eighteen worked problems on reshaping data with tidyr `pivot_longer()` and `pivot_wider()`. Each exercise gives a Task, the exact output your code should produce, and a hidden solution with an explanation. Difficulty ranges from beginner pivots on tidy built-in datasets to advanced patterns using `names_sep`, `names_pattern`, the `.value` sentinel, `values_fn`, and `names_glue`.</p>

```r title="Run this once before any exercise"
library(tidyr)
library(dplyr)
library(tibble)
```

## Section 1. Wide to long with pivot_longer (3 problems)

### Exercise 1.1: Reshape USArrests crime columns to a long state-crime table

**Task:** The `USArrests` built-in dataset has one row per US state and four crime columns: `Murder`, `Assault`, `UrbanPop`, and `Rape`. A criminology team wants the same information in long form so they can facet plots by crime type. Convert the rownames to a `state` column, then pivot the four crime columns into `crime` and `rate`. Save the result as `ex_1_1`.

**Expected result:**

```
#> # A tibble: 200 x 3
#>    state   crime      rate
#>    <chr>   <chr>     <dbl>
#>  1 Alabama Murder     13.2
#>  2 Alabama Assault   236
#>  3 Alabama UrbanPop   58
#>  4 Alabama Rape       21.2
#>  5 Alaska  Murder     10
#>  6 Alaska  Assault   263
#>  7 Alaska  UrbanPop   48
#>  8 Alaska  Rape       44.5
#>  9 Arizona Murder      8.1
#> 10 Arizona Assault   294
#> # 190 more rows hidden
```

**Difficulty:** Beginner

[HINTS]
Each state currently carries four separate crime measurements across columns, and the state labels are not a real column yet but are hiding in the rownames.
Lift the rownames into a column with rownames_to_column("state"), then pivot_longer() with cols = -state, names_to = "crime", and values_to = "rate".

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- USArrests |>
  rownames_to_column("state") |>
  pivot_longer(cols = -state, names_to = "crime", values_to = "rate")
ex_1_1
#> # A tibble: 200 x 3
#>    state   crime      rate
#>    <chr>   <chr>     <dbl>
#>  1 Alabama Murder     13.2
#>  2 Alabama Assault   236
#>  3 Alabama UrbanPop   58
#>  4 Alabama Rape       21.2
#> ...
```

**Explanation:** `USArrests` is a base R `data.frame` with state names stored as rownames, not a real column. `rownames_to_column()` lifts them into a `state` column so `pivot_longer()` can keep them as identifier columns. The selector `cols = -state` means "pivot everything except `state`", which is the idiomatic way to say "all the value columns". The result has `50 states x 4 crimes = 200` rows. A common mistake is forgetting the rownames step: tidyverse verbs silently drop rownames after the first manipulation.

</details>

### Exercise 1.2: Pivot iris flower measurements into a long format

**Task:** Reshape the built-in `iris` dataset so the four measurement columns (`Sepal.Length`, `Sepal.Width`, `Petal.Length`, `Petal.Width`) become two columns: `measurement` and `value`. The `Species` column should remain as an identifier. The output should have 600 rows (150 flowers x 4 measurements). Save the result as `ex_1_2`.

**Expected result:**

```
#> # A tibble: 600 x 2 (grouped by Species)
#>    Species measurement  value
#>    <fct>   <chr>        <dbl>
#>  1 setosa  Sepal.Length   5.1
#>  2 setosa  Sepal.Width    3.5
#>  3 setosa  Petal.Length   1.4
#>  4 setosa  Petal.Width    0.2
#>  5 setosa  Sepal.Length   4.9
#>  6 setosa  Sepal.Width    3
#>  7 setosa  Petal.Length   1.4
#>  8 setosa  Petal.Width    0.2
#>  9 setosa  Sepal.Length   4.7
#> 10 setosa  Sepal.Width    3.2
#> # 590 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
The four measurement columns should collapse into one key column and one value column, while the species label stays put as an identifier.
Use pivot_longer() with a column range such as Sepal.Length:Petal.Width, plus names_to = "measurement" and values_to = "value".

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- iris |>
  pivot_longer(
    cols = Sepal.Length:Petal.Width,
    names_to = "measurement",
    values_to = "value"
  )
ex_1_2
#> # A tibble: 600 x 3
#>    Species measurement  value
#>    <fct>   <chr>        <dbl>
#>  1 setosa  Sepal.Length   5.1
#>  2 setosa  Sepal.Width    3.5
#>  3 setosa  Petal.Length   1.4
#>  4 setosa  Petal.Width    0.2
#> ...
```

**Explanation:** The colon selector `Sepal.Length:Petal.Width` matches a contiguous range of columns by position. Alternatives that produce identical results are `cols = -Species` and `cols = where(is.numeric)`. After the pivot, `Species` is automatically preserved as the identifier since it was not in `cols`. This is the canonical first step before plotting all four measurements together with `ggplot2 + facet_wrap(~ measurement)`.

</details>

### Exercise 1.3: Reshape a wide monthly sales tibble to a long monthly panel

**Task:** A regional manager kept Q1 sales in a wide tibble with one row per region and three month columns. Build the tibble inline as `sales_wide`, then pivot it so each row is one (region, month) pair with a `revenue` value. The `month` column should preserve the original column order. Save the long table as `ex_1_3`.

**Expected result:**

```
#> # A tibble: 9 x 3
#>   region month   revenue
#>   <chr>  <chr>     <dbl>
#> 1 East   jan       12500
#> 2 East   feb       13800
#> 3 East   mar       15200
#> 4 South  jan        9200
#> 5 South  feb        9900
#> 6 South  mar       10100
#> 7 West   jan       17000
#> 8 West   feb       16400
#> 9 West   mar       18900
```

**Difficulty:** Intermediate

[HINTS]
Each month is its own column right now, but you want every row to stand for a single region-month pair with one revenue figure.
Pivot the jan:mar columns longer with names_to = "month" and values_to = "revenue".

```r title="Your turn"
sales_wide <- tibble::tibble(
  region = c("East", "South", "West"),
  jan = c(12500, 9200, 17000),
  feb = c(13800, 9900, 16400),
  mar = c(15200, 10100, 18900)
)

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales_wide <- tibble::tibble(
  region = c("East", "South", "West"),
  jan = c(12500, 9200, 17000),
  feb = c(13800, 9900, 16400),
  mar = c(15200, 10100, 18900)
)

ex_1_3 <- sales_wide |>
  pivot_longer(
    cols = jan:mar,
    names_to = "month",
    values_to = "revenue"
  )
ex_1_3
#> # A tibble: 9 x 3
#>   region month   revenue
#>   <chr>  <chr>     <dbl>
#> 1 East   jan       12500
#> 2 East   feb       13800
#> 3 East   mar       15200
#> ...
```

**Explanation:** Column order in the `names_to` output column matches the order columns appeared in the original tibble, not alphabetical. That is exactly what you want so plots stay in calendar order without an explicit factor level call. If you needed a factor with month order locked in, you would pipe into `mutate(month = factor(month, levels = c("jan", "feb", "mar")))` next. Three regions x three months equals nine rows, which is a good sanity check before any downstream join.

</details>

## Section 2. Long to wide with pivot_wider (3 problems)

### Exercise 2.1: Build a wool by tension breakage summary matrix

**Task:** The `warpbreaks` built-in dataset records `breaks` per loom for each combination of `wool` (A or B) and `tension` (L, M, H). A weaving manager wants a small 2x3 summary table: one row per wool type, three columns for the mean breaks at each tension. Group by `wool` and `tension`, compute the mean, then pivot the tension levels into columns. Save the wide summary as `ex_2_1`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   wool      L     M     H
#>   <fct> <dbl> <dbl> <dbl>
#> 1 A      44.6  24    24.6
#> 2 B      28.2  28.8  18.8
```

**Difficulty:** Beginner

[HINTS]
First reduce the many looms per wool-tension combination down to one average, then spread the tension levels across the top of the table.
After group_by(wool, tension) and summarise() of the mean, use pivot_wider() with names_from = tension and values_from set to the mean column.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- warpbreaks |>
  group_by(wool, tension) |>
  summarise(mean_breaks = mean(breaks), .groups = "drop") |>
  pivot_wider(names_from = tension, values_from = mean_breaks)
ex_2_1
#> # A tibble: 2 x 4
#>   wool      L     M     H
#>   <fct> <dbl> <dbl> <dbl>
#> 1 A      44.6  24    24.6
#> 2 B      28.2  28.8  18.8
```

**Explanation:** This is the classic summarise-then-pivot pattern that produces a wide report table. `names_from` is the column whose values become the new column NAMES, and `values_from` is the column whose values fill the cells. The order of L, M, H is preserved because `tension` is an ordered factor; if it were a plain character vector you would get alphabetical H, L, M. Use `.groups = "drop"` to avoid getting a tibble that is silently still grouped by `wool`, which would confuse later joins.

</details>

### Exercise 2.2: Spread monthly average ozone into a Month by Day matrix

**Task:** The `airquality` dataset is already in long form: one row per (Month, Day) with `Ozone` measurements. Reshape it into a wide table where each row is a `Month` (5 through 9) and each column is a `Day` (1 through 31), with the `Ozone` reading in each cell. Many cells will be `NA` for missing observations. Save the wide table as `ex_2_2`.

**Expected result:**

```
#> # A tibble: 5 x 32
#>   Month   `1`   `2`   `3`   `4`   `5`   `6`   `7`   `8`   `9`  `10`  `11`  `12`
#>   <int> <int> <int> <int> <int> <int> <int> <int> <int> <int> <int> <int> <int>
#> 1     5    41    36    12    18    NA    28    23    19     8    NA     7    16
#> 2     6    NA    NA    NA    NA    NA    NA    29    NA    71    39    NA    NA
#> 3     7   135    49    32    NA    64    40    77    97    97    85    NA    10
#> 4     8    39     9    16    78    35    66   122    89   110    NA    NA    44
#> 5     9    96    78    73    91    47    32    20    23    21    24    44    21
#> # 19 more variables hidden
```

**Difficulty:** Intermediate

[HINTS]
Keep one row per month and turn every distinct day into its own column holding that day's reading, with blanks where no observation exists.
After narrowing to the three relevant columns with select(), use pivot_wider() with names_from = Day and values_from = Ozone.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- airquality |>
  select(Month, Day, Ozone) |>
  pivot_wider(names_from = Day, values_from = Ozone)
ex_2_2
#> # A tibble: 5 x 32
#>   Month   `1`   `2`   `3`   `4`   `5` ...
#>   <int> <int> <int> <int> <int> <int>
#> 1     5    41    36    12    18    NA
#> 2     6    NA    NA    NA    NA    NA
#> 3     7   135    49    32    NA    64
#> 4     8    39     9    16    78    35
#> 5     9    96    78    73    91    47
#> ...
```

**Explanation:** Day numbers are integers, so the new column names are stringified integers wrapped in backticks. Cells that have no matching (Month, Day) combination get filled with `NA` by default. You could replace those with zero by passing `values_fill = 0` to `pivot_wider()`. The `select()` step is not strictly necessary, but dropping the other measurement columns (`Solar.R`, `Wind`, `Temp`) makes the pivot's intent obvious and avoids accidentally creating a list-column.

</details>

### Exercise 2.3: Pivot patient encounters to one column per visit

**Task:** A clinical analyst has long-form patient encounter data with one row per visit. Build `encounters` inline with five rows covering three patients across visits 1 to 3. Reshape it so each row is one patient and there are three columns `v1`, `v2`, `v3` holding the systolic blood pressure for each visit. Patients with fewer visits get `NA` in the missing column. Save as `ex_2_3`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   patient_id    v1    v2    v3
#>   <chr>      <int> <int> <int>
#> 1 P001         128   132   135
#> 2 P002         142    NA    NA
#> 3 P003         120   118    NA
```

**Difficulty:** Intermediate

[HINTS]
Each patient should become a single row, with the visit numbers turning into columns and patients with fewer visits left blank.
Use pivot_wider() with names_from = visit, values_from = systolic, and names_prefix = "v" to get v1, v2, v3.

```r title="Your turn"
encounters <- tibble::tibble(
  patient_id = c("P001", "P001", "P001", "P002", "P003", "P003"),
  visit      = c(1, 2, 3, 1, 1, 2),
  systolic   = c(128L, 132L, 135L, 142L, 120L, 118L)
)

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
encounters <- tibble::tibble(
  patient_id = c("P001", "P001", "P001", "P002", "P003", "P003"),
  visit      = c(1, 2, 3, 1, 1, 2),
  systolic   = c(128L, 132L, 135L, 142L, 120L, 118L)
)

ex_2_3 <- encounters |>
  pivot_wider(
    names_from = visit,
    values_from = systolic,
    names_prefix = "v"
  )
ex_2_3
#> # A tibble: 3 x 4
#>   patient_id    v1    v2    v3
#>   <chr>      <int> <int> <int>
#> 1 P001         128   132   135
#> 2 P002         142    NA    NA
#> 3 P003         120   118    NA
```

**Explanation:** `names_prefix = "v"` glues the literal string `v` to each value of `visit` before turning it into a column name. Without it, the columns would be `1`, `2`, `3`, which forces every downstream reference to use backticks. The implicit missings for P002 (visits 2 and 3) and P003 (visit 3) become explicit `NA` cells once you pivot wider. This shape is what most BI tools and Excel exports expect from clinical data.

</details>

## Section 3. Advanced pivot_longer: multi-piece names (3 problems)

### Exercise 3.1: Split combined treatment_time column names with names_sep

**Task:** A clinical trial recorded outcomes in four wide columns named like `treated_pre`, `treated_post`, `control_pre`, `control_post`. The two pieces (group and time) are joined by an underscore. Build `trial_wide` inline, then pivot longer using `names_sep = "_"` to split the column name into a `group` column and a `time` column, with the readings in a `score` column. Save as `ex_3_1`.

**Expected result:**

```
#> # A tibble: 12 x 4
#>    subject group   time   score
#>    <chr>   <chr>   <chr>  <dbl>
#>  1 S01     treated pre     22.1
#>  2 S01     treated post    27.4
#>  3 S01     control pre     21.8
#>  4 S01     control post    22.0
#>  5 S02     treated pre     19.6
#>  6 S02     treated post    25.1
#>  7 S02     control pre     20.2
#>  8 S02     control post    20.5
#>  9 S03     treated pre     23.0
#> 10 S03     treated post    28.7
#> 11 S03     control pre     22.5
#> 12 S03     control post    23.1
```

**Difficulty:** Intermediate

[HINTS]
Each column name packs two facts joined by an underscore, so the reshape should produce two new label columns at once.
Pass a length-2 vector to names_to and set names_sep = "_" in pivot_longer() to split the name into group and time.

```r title="Your turn"
trial_wide <- tibble::tibble(
  subject       = c("S01", "S02", "S03"),
  treated_pre   = c(22.1, 19.6, 23.0),
  treated_post  = c(27.4, 25.1, 28.7),
  control_pre   = c(21.8, 20.2, 22.5),
  control_post  = c(22.0, 20.5, 23.1)
)

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
trial_wide <- tibble::tibble(
  subject       = c("S01", "S02", "S03"),
  treated_pre   = c(22.1, 19.6, 23.0),
  treated_post  = c(27.4, 25.1, 28.7),
  control_pre   = c(21.8, 20.2, 22.5),
  control_post  = c(22.0, 20.5, 23.1)
)

ex_3_1 <- trial_wide |>
  pivot_longer(
    cols = -subject,
    names_to = c("group", "time"),
    names_sep = "_",
    values_to = "score"
  )
ex_3_1
#> # A tibble: 12 x 4
#>    subject group   time   score
#>    <chr>   <chr>   <chr>  <dbl>
#>  1 S01     treated pre     22.1
#>  2 S01     treated post    27.4
#> ...
```

**Explanation:** Passing a length-2 character vector to `names_to` plus `names_sep` tells tidyr to split each column name on the first underscore and produce that many new columns. The order of pieces in `names_to` must match the order in the column name. If the separator is variable or appears multiple times, switch to `names_pattern` with a regex (see the next exercise). After pivoting, a downstream `pivot_wider(names_from = time, values_from = score)` would give the pre/post difference column you usually want for paired tests.

</details>

### Exercise 3.2: Parse quarter and year out of column names with names_pattern

**Task:** A retailer has quarterly revenue stored as four columns: `Q1_2023`, `Q2_2023`, `Q1_2024`, `Q2_2024`. Build `qtr_wide` inline, then use `pivot_longer()` with a regex `names_pattern` to capture the quarter (`Q1` or `Q2`) and the year as separate columns. Coerce `year` to integer in the regex output by passing `names_transform`. Save the long table as `ex_3_2`.

**Expected result:**

```
#> # A tibble: 8 x 4
#>   store   quarter  year revenue
#>   <chr>   <chr>   <int>   <dbl>
#> 1 Store_A Q1       2023   45000
#> 2 Store_A Q2       2023   48200
#> 3 Store_A Q1       2024   51000
#> 4 Store_A Q2       2024   52800
#> 5 Store_B Q1       2023   33000
#> 6 Store_B Q2       2023   31500
#> 7 Store_B Q1       2024   36400
#> 8 Store_B Q2       2024   37100
```

**Difficulty:** Advanced

[HINTS]
The two pieces of each column name need to be captured separately, and the year piece should arrive as a number rather than text.
Use names_pattern with a regex of two capture groups, give names_to both column names, and pass names_transform = list(year = as.integer).

```r title="Your turn"
qtr_wide <- tibble::tibble(
  store   = c("Store_A", "Store_B"),
  Q1_2023 = c(45000, 33000),
  Q2_2023 = c(48200, 31500),
  Q1_2024 = c(51000, 36400),
  Q2_2024 = c(52800, 37100)
)

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
qtr_wide <- tibble::tibble(
  store   = c("Store_A", "Store_B"),
  Q1_2023 = c(45000, 33000),
  Q2_2023 = c(48200, 31500),
  Q1_2024 = c(51000, 36400),
  Q2_2024 = c(52800, 37100)
)

ex_3_2 <- qtr_wide |>
  pivot_longer(
    cols = -store,
    names_to = c("quarter", "year"),
    names_pattern = "(Q\\d)_(\\d{4})",
    names_transform = list(year = as.integer),
    values_to = "revenue"
  )
ex_3_2
#> # A tibble: 8 x 4
#>   store   quarter  year revenue
#>   <chr>   <chr>   <int>   <dbl>
#> 1 Store_A Q1       2023   45000
#> 2 Store_A Q2       2023   48200
#> ...
```

**Explanation:** `names_pattern` uses a Perl-compatible regex where each capture group `(...)` becomes one of the new columns named by `names_to`. The pattern `(Q\d)_(\d{4})` captures the quarter token and a four-digit year. Why not `names_sep = "_"`? It would also work here, but `names_pattern` is the right tool whenever you need to drop or transform pieces of the column name. `names_transform` runs after capture so the year arrives as integer rather than character, which matters for downstream arithmetic like `year - lag(year)`.

</details>

### Exercise 3.3: Use the .value sentinel to recover paired height and weight columns

**Task:** An anthropometric panel was exported as four columns: `height_2020`, `weight_2020`, `height_2021`, `weight_2021`. Each column embeds both a variable name and a year. Build `anthro_wide` inline, then pivot longer so the output has columns `subject`, `year`, `height`, and `weight`. Use the special `.value` sentinel in `names_to`. Save as `ex_3_3`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   subject year  height weight
#>   <chr>   <chr>  <dbl>  <dbl>
#> 1 A       2020    1.62   58
#> 2 A       2021    1.63   60
#> 3 B       2020    1.78   72
#> 4 B       2021    1.79   75
#> 5 C       2020    1.55   49
#> 6 C       2021    1.56   51
```

**Difficulty:** Advanced

[HINTS]
One piece of each column name should decide which output column the value lands in, instead of becoming a label column of its own.
Put the .value sentinel as the first element of names_to alongside "year", with names_sep = "_".

```r title="Your turn"
anthro_wide <- tibble::tibble(
  subject     = c("A", "B", "C"),
  height_2020 = c(1.62, 1.78, 1.55),
  weight_2020 = c(58,   72,   49),
  height_2021 = c(1.63, 1.79, 1.56),
  weight_2021 = c(60,   75,   51)
)

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
anthro_wide <- tibble::tibble(
  subject     = c("A", "B", "C"),
  height_2020 = c(1.62, 1.78, 1.55),
  weight_2020 = c(58,   72,   49),
  height_2021 = c(1.63, 1.79, 1.56),
  weight_2021 = c(60,   75,   51)
)

ex_3_3 <- anthro_wide |>
  pivot_longer(
    cols = -subject,
    names_to = c(".value", "year"),
    names_sep = "_"
  )
ex_3_3
#> # A tibble: 6 x 4
#>   subject year  height weight
#>   <chr>   <chr>  <dbl>  <dbl>
#> 1 A       2020    1.62   58
#> 2 A       2021    1.63   60
#> ...
```

**Explanation:** The `.value` sentinel tells tidyr "this captured piece of the column name should not become a new column of its own. Use it as the destination column name." After splitting on `_`, the first piece (`height` or `weight`) names which output column the value lands in, and the second piece (`2020` or `2021`) becomes the new `year` column. Without `.value` you would get a long-form table with `height` and `weight` mixed in one `value` column, which would then need a follow-up `pivot_wider()`. This pattern is the cleanest way to handle paired columns in panel data.

</details>

## Section 4. Advanced pivot_wider patterns (3 problems)

### Exercise 4.1: Format new column names with names_glue

**Task:** Starting from the long `ex_3_2` table (store, quarter, year, revenue), pivot back to wide but build the new column names from BOTH `year` and `quarter` using a template like `rev_2023_Q1`. Use `names_glue` to control the format. Save the wide result as `ex_4_1`.

**Expected result:**

```
#> # A tibble: 2 x 5
#>   store   rev_2023_Q1 rev_2023_Q2 rev_2024_Q1 rev_2024_Q2
#>   <chr>         <dbl>       <dbl>       <dbl>       <dbl>
#> 1 Store_A       45000       48200       51000       52800
#> 2 Store_B       33000       31500       36400       37100
```

**Difficulty:** Intermediate

[HINTS]
The new column names should be built from two existing columns, reordered and given a prefix rather than left to the default join.
In pivot_wider(), give names_from both year and quarter, set values_from = revenue, and supply a names_glue template like "rev_{year}_{quarter}".

```r title="Your turn"
ex_4_1 <- ex_3_2 |>
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ex_3_2 |>
  pivot_wider(
    names_from = c(year, quarter),
    values_from = revenue,
    names_glue = "rev_{year}_{quarter}"
  )
ex_4_1
#> # A tibble: 2 x 5
#>   store   rev_2023_Q1 rev_2023_Q2 rev_2024_Q1 rev_2024_Q2
#>   <chr>         <dbl>       <dbl>       <dbl>       <dbl>
#> 1 Store_A       45000       48200       51000       52800
#> 2 Store_B       33000       31500       36400       37100
```

**Explanation:** Passing a character vector to `names_from` makes `pivot_wider()` combine its values into the new column names. By default, the separator is `_` and the order matches `names_from`. `names_glue` overrides that with a `glue` template, letting you add prefixes (`rev_`) or reorder the pieces freely. This is invaluable when downstream consumers expect names like `Q1_FY2024` or `metric.store.year`. The same trick works with `names_glue` on `pivot_longer()` when you need to construct synthetic identifiers in the long output.

</details>

### Exercise 4.2: Aggregate during pivot_wider with values_fn

**Task:** A logistics analyst has multiple delivery records per (`warehouse`, `region`) pair and wants the mean delivery time as the cell value when pivoting wide. Build `deliveries` inline with three warehouses and two regions, with duplicate rows per pair. Pivot wider with `names_from = region`, `values_from = minutes`, and `values_fn = mean` so duplicates collapse to averages. Save as `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   warehouse North South
#>   <chr>     <dbl> <dbl>
#> 1 W1         42    37.5
#> 2 W2         55    48
#> 3 W3         38    34
```

**Difficulty:** Intermediate

[HINTS]
There are several records per warehouse-region cell, so the reshape needs a rule for collapsing those duplicates into one number.
Pass values_fn = mean to pivot_wider() alongside names_from = region and values_from = minutes.

```r title="Your turn"
deliveries <- tibble::tibble(
  warehouse = c("W1", "W1", "W1", "W2", "W2", "W2", "W3", "W3"),
  region    = c("North", "South", "South", "North", "South", "South", "North", "South"),
  minutes   = c(42,      35,      40,      55,      45,      51,      38,      34)
)

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deliveries <- tibble::tibble(
  warehouse = c("W1", "W1", "W1", "W2", "W2", "W2", "W3", "W3"),
  region    = c("North", "South", "South", "North", "South", "South", "North", "South"),
  minutes   = c(42,      35,      40,      55,      45,      51,      38,      34)
)

ex_4_2 <- deliveries |>
  pivot_wider(
    names_from = region,
    values_from = minutes,
    values_fn = mean
  )
ex_4_2
#> # A tibble: 3 x 3
#>   warehouse North South
#>   <chr>     <dbl> <dbl>
#> 1 W1         42    37.5
#> 2 W2         55    48
#> 3 W3         38    34
```

**Explanation:** Without `values_fn`, `pivot_wider()` warns when it finds duplicate row-column combinations and silently stuffs the values into a list-column. Setting `values_fn = mean` tells it how to collapse those duplicates into a single number. Other useful choices: `sum` for totals, `length` for counts, `~ paste(.x, collapse = ", ")` for string concatenation. The lesson is to either pre-summarise with `group_by() |> summarise()` OR use `values_fn` inline, but never silently ignore the duplicate-keys warning.

</details>

### Exercise 4.3: Pivot two value columns at once with values_from on a vector

**Task:** A weather station logged daily temperatures with `min_temp` and `max_temp` columns by month. Build `weather` inline with twelve rows (one per month) of fake min/max readings. Pivot wider so each output column is a single `(metric, month_q)` cell where `month_q` is `Q1` through `Q4`, with both `min_temp` and `max_temp` becoming separate column families. Save the eight-column wide table as `ex_4_3`.

**Expected result:**

```
#> # A tibble: 1 x 9
#>   station min_temp_Q1 min_temp_Q2 min_temp_Q3 min_temp_Q4 max_temp_Q1 max_temp_Q2 max_temp_Q3 max_temp_Q4
#>   <chr>         <dbl>       <dbl>       <dbl>       <dbl>       <dbl>       <dbl>       <dbl>       <dbl>
#> 1 KSEA           36.7        50          60          43.7        50          70.3        78.7        56.3
```

**Difficulty:** Advanced

[HINTS]
Both measurement columns should each spawn their own family of quarter columns in a single reshape, not two separate ones.
After summarising the means per quarter, give pivot_wider() a vector values_from = c(min_temp, max_temp) with names_from = month_q.

```r title="Your turn"
weather <- tibble::tibble(
  station  = "KSEA",
  month    = month.abb,
  min_temp = c(34, 36, 40, 44, 50, 56, 60, 60, 56, 48, 40, 35),
  max_temp = c(46, 50, 54, 60, 66, 75, 80, 80, 76, 64, 52, 47)
) |>
  mutate(month_q = paste0("Q", ceiling(match(month, month.abb) / 3)))

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
weather <- tibble::tibble(
  station  = "KSEA",
  month    = month.abb,
  min_temp = c(34, 36, 40, 44, 50, 56, 60, 60, 56, 48, 40, 35),
  max_temp = c(46, 50, 54, 60, 66, 75, 80, 80, 76, 64, 52, 47)
) |>
  mutate(month_q = paste0("Q", ceiling(match(month, month.abb) / 3)))

ex_4_3 <- weather |>
  group_by(station, month_q) |>
  summarise(min_temp = mean(min_temp), max_temp = mean(max_temp), .groups = "drop") |>
  pivot_wider(
    names_from = month_q,
    values_from = c(min_temp, max_temp)
  )
ex_4_3
#> # A tibble: 1 x 9
#>   station min_temp_Q1 min_temp_Q2 min_temp_Q3 min_temp_Q4 max_temp_Q1 max_temp_Q2 max_temp_Q3 max_temp_Q4
#>   <chr>         <dbl>       <dbl>       <dbl>       <dbl>       <dbl>       <dbl>       <dbl>       <dbl>
#> 1 KSEA           36.7        50          60          43.7        50          70.3        78.7        56.3
```

**Explanation:** When `values_from` is a character vector of length greater than one, `pivot_wider()` produces one column family per element, prefixing each new column with the source name. So you get `min_temp_Q1`, `min_temp_Q2`, ..., and the same for `max_temp`. This avoids two separate pivots followed by a join. The pre-summarise step is necessary because there are three rows per quarter and you want the quarterly mean. If you only had one row per (station, quarter) you could skip the summarise.

</details>

## Section 5. Reshape pipelines and round trips (3 problems)

### Exercise 5.1: Compute year over year revenue growth via wider then mutate then longer

**Task:** Take the long `ex_3_2` table (store, quarter, year, revenue), pivot it wider so each year is its own column, compute a `growth_pct` column as `(revenue_2024 - revenue_2023) / revenue_2023 * 100`, then drop the intermediate year columns. Round growth to one decimal place. Save the (store, quarter, growth_pct) table as `ex_5_1`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   store   quarter growth_pct
#>   <chr>   <chr>        <dbl>
#> 1 Store_A Q1            13.3
#> 2 Store_A Q2             9.5
#> 3 Store_B Q1            10.3
#> 4 Store_B Q2            17.8
```

**Difficulty:** Intermediate

[HINTS]
To compare two years you first need them side by side as columns, then compute the ratio, then keep only the columns that matter.
Use pivot_wider() with names_from = year and names_prefix = "rev_", then mutate() the rounded growth and select() the final three columns.

```r title="Your turn"
ex_5_1 <- ex_3_2 |>
  # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ex_3_2 |>
  pivot_wider(names_from = year, values_from = revenue, names_prefix = "rev_") |>
  mutate(growth_pct = round((rev_2024 - rev_2023) / rev_2023 * 100, 1)) |>
  select(store, quarter, growth_pct)
ex_5_1
#> # A tibble: 4 x 3
#>   store   quarter growth_pct
#>   <chr>   <chr>        <dbl>
#> 1 Store_A Q1            13.3
#> 2 Store_A Q2             9.5
#> 3 Store_B Q1            10.3
#> 4 Store_B Q2            17.8
```

**Explanation:** When you need to compute differences or ratios between rows of a long table, the pattern is almost always pivot wider, compute, then drop or pivot longer again. Subtracting `rev_2023` from `rev_2024` across two columns is far cleaner than `lag()` ordering tricks in long form. `names_prefix = "rev_"` keeps the new column names valid (a leading digit needs backticks). For more than two periods, `mutate(across(...))` or a `pivot_longer()` follow-up scales better than enumerating each year by hand.

</details>

### Exercise 5.2: Round trip pivot to validate reshape correctness

**Task:** Round trip the `iris` dataset through pivot_longer and pivot_wider, then prove the result is identical to the input. Add a `row_id` to `iris` first so the wide pivot has a unique key. The final test should use `dplyr::all_equal()` (or `waldo::compare()`) and the answer should be `TRUE` (or equivalent). Save the round tripped tibble as `ex_5_2`.

**Expected result:**

```
#> # A tibble: 150 x 6
#>    row_id Species Sepal.Length Sepal.Width Petal.Length Petal.Width
#>     <int> <fct>          <dbl>       <dbl>        <dbl>       <dbl>
#>  1      1 setosa           5.1         3.5          1.4         0.2
#>  2      2 setosa           4.9         3            1.4         0.2
#>  3      3 setosa           4.7         3.2          1.3         0.2
#>  4      4 setosa           4.6         3.1          1.5         0.2
#>  5      5 setosa           5           3.6          1.4         0.2
#> # 145 more rows hidden
#>
#> identical to source: TRUE
```

**Difficulty:** Intermediate

[HINTS]
Reshaping the data to long and then back to wide should return the original exactly, provided every row carries a unique identifier.
Chain pivot_longer() over the measurement columns into a pivot_wider() that reverses it, then compare with all.equal().

```r title="Your turn"
ex_5_2 <- iris |>
  mutate(row_id = row_number()) |>
  # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
iris_id <- iris |> mutate(row_id = row_number())

ex_5_2 <- iris_id |>
  pivot_longer(Sepal.Length:Petal.Width, names_to = "measurement", values_to = "value") |>
  pivot_wider(names_from = measurement, values_from = value) |>
  select(row_id, Species, Sepal.Length, Sepal.Width, Petal.Length, Petal.Width)

ex_5_2
#> # A tibble: 150 x 6
#>    row_id Species Sepal.Length Sepal.Width Petal.Length Petal.Width
#>     <int> <fct>          <dbl>       <dbl>        <dbl>       <dbl>
#>  1      1 setosa           5.1         3.5          1.4         0.2
#>  2      2 setosa           4.9         3            1.4         0.2
#> ...

isTRUE(all.equal(ex_5_2, iris_id))
#> [1] TRUE
```

**Explanation:** Round tripping is the cheapest unit test for any pivot logic: if `longer |> wider` does not return the original, you have either an aggregation hiding duplicates, a column-name collision, or missing identifier columns. The `row_id` is the key that makes the wide pivot unambiguous; without it, identical flowers would collide and `pivot_wider()` would silently create list-columns. Use this pattern in production ETL: pivot, transform, pivot back, and assert equality on a control subset before shipping the new shape.

</details>

### Exercise 5.3: Build a dose by supplement wide summary from ToothGrowth

**Task:** The built-in `ToothGrowth` dataset has `len` (tooth length), `supp` (OJ or VC), and `dose` (0.5, 1, 2). A nutrition researcher wants a 3x2 table: rows are doses, columns are supplements, cells are the mean tooth length at that combination, rounded to two decimals. Save the wide summary as `ex_5_3`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>    dose    OJ    VC
#>   <dbl> <dbl> <dbl>
#> 1   0.5 13.2   7.98
#> 2   1   22.7  16.8
#> 3   2   26.1  26.1
```

**Difficulty:** Intermediate

[HINTS]
Collapse the many length measurements per dose-supplement pair down to one rounded average, then put the supplements across the columns.
After group_by(dose, supp) and summarise() of the rounded mean, use pivot_wider() with names_from = supp and values_from set to the mean column.

```r title="Your turn"
ex_5_3 <- ToothGrowth |>
  # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ToothGrowth |>
  group_by(dose, supp) |>
  summarise(mean_len = round(mean(len), 2), .groups = "drop") |>
  pivot_wider(names_from = supp, values_from = mean_len)
ex_5_3
#> # A tibble: 3 x 3
#>    dose    OJ    VC
#>   <dbl> <dbl> <dbl>
#> 1   0.5 13.2   7.98
#> 2   1   22.7  16.8
#> 3   2   26.1  26.1
```

**Explanation:** This is a very common workflow: `group_by() |> summarise() |> pivot_wider()` produces a stakeholder ready cross tabulation. The order of `group_by()` keys affects the row ordering but not column ordering. Note how OJ vs VC differs sharply at low doses but converges at dose 2.0, which is the headline insight any analyst would extract from this layout. The same data in long form needs eyeballing six rows to spot; the wide form makes the pattern obvious at a glance.

</details>

## Section 6. Edge cases: NAs, duplicates, repair (3 problems)

### Exercise 6.1: Repair duplicate column names produced by a careless pivot_wider

**Task:** When `pivot_wider()` produces colliding column names because of duplicate values in `names_from`, the default behavior raises an error. Build `dup_long` inline with duplicate `key` values within one `group`. Pivot wider and explicitly pass `names_repair = "unique"` to let tidyr disambiguate by appending suffixes. Save the repaired wide table as `ex_6_1`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   group `key...2` `key...3` `key...4`
#>   <chr>     <dbl>     <dbl>     <dbl>
#> 1 A             1         2         5
#> 2 B             3         4         6
```

**Difficulty:** Beginner

[HINTS]
Because the key repeats within a group, the reshape would otherwise collide several values into one column name and error out.
Pass names_repair = "unique" to pivot_wider() (with values_fn = list) so the colliding names get ...n suffixes.

```r title="Your turn"
dup_long <- tibble::tibble(
  group = c("A", "A", "B", "B", "A", "B"),
  key   = c("key", "key", "key", "key", "key", "key"),
  value = c(1, 2, 3, 4, 5, 6),
  pos   = c(1, 2, 1, 2, 3, 3)
)

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dup_long <- tibble::tibble(
  group = c("A", "A", "B", "B", "A", "B"),
  key   = c("key", "key", "key", "key", "key", "key"),
  value = c(1, 2, 3, 4, 5, 6),
  pos   = c(1, 2, 1, 2, 3, 3)
)

ex_6_1 <- dup_long |>
  pivot_wider(
    id_cols = group,
    names_from = key,
    values_from = value,
    values_fn = list,
    names_repair = "unique"
  ) |>
  tidyr::unnest_wider(key, names_sep = "...")
ex_6_1
#> # A tibble: 2 x 4
#>   group `key...2` `key...3` `key...4`
#>   <chr>     <dbl>     <dbl>     <dbl>
#> 1 A             1         2         5
#> 2 B             3         4         6
```

**Explanation:** `names_repair` accepts `"minimal"` (warn only), `"unique"` (append `...n` suffixes), `"universal"` (also make names syntactic), or a user function. Once the values collide, you need a way to spread them out, which is what `values_fn = list` plus `unnest_wider()` does. In real code the better fix is upstream: include a `pos` or sequence index in `names_from` so each output column is unique by construction. Treat `names_repair` warnings as a smell, not a solution.

</details>

### Exercise 6.2: Drop rows with NA values introduced by pivot_longer using values_drop_na

**Task:** Build `survey_wide` inline with two question columns (`q1` and `q2`) where some respondents left answers blank as `NA`. Pivot longer the question columns into a `question`/`answer` pair, and pass `values_drop_na = TRUE` so rows that arose from missing values are dropped automatically. Save the cleaned long table as `ex_6_2`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   respondent question answer
#>   <chr>      <chr>     <int>
#> 1 R1         q1            4
#> 2 R1         q2            5
#> 3 R2         q1            3
#> 4 R3         q2            2
#> 5 R4         q1            5
```

**Difficulty:** Intermediate

[HINTS]
Some respondents left blanks, and you do not want those empty cells turning into rows in the long output.
Add values_drop_na = TRUE to pivot_longer() over the q1:q2 columns.

```r title="Your turn"
survey_wide <- tibble::tibble(
  respondent = c("R1", "R2", "R3", "R4"),
  q1         = c(4L, 3L, NA, 5L),
  q2         = c(5L, NA, 2L, NA)
)

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
survey_wide <- tibble::tibble(
  respondent = c("R1", "R2", "R3", "R4"),
  q1         = c(4L, 3L, NA, 5L),
  q2         = c(5L, NA, 2L, NA)
)

ex_6_2 <- survey_wide |>
  pivot_longer(
    cols = q1:q2,
    names_to = "question",
    values_to = "answer",
    values_drop_na = TRUE
  )
ex_6_2
#> # A tibble: 5 x 3
#>   respondent question answer
#>   <chr>      <chr>     <int>
#> 1 R1         q1            4
#> 2 R1         q2            5
#> 3 R2         q1            3
#> 4 R3         q2            2
#> 5 R4         q1            5
```

**Explanation:** Without `values_drop_na`, the long table would have 8 rows including three `NA` answers. `values_drop_na = TRUE` skips those during the pivot itself, which is faster and clearer than a follow-up `filter(!is.na(answer))`. Use it whenever an `NA` in the wide form means "no observation" rather than "observed as missing". For survey data where `NA` carries meaning (refused to answer vs not asked) you should preserve them and disambiguate downstream instead.

</details>

### Exercise 6.3: Detect implicit missing patient-visit combinations after pivot_wider

**Task:** Reuse `encounters` from Exercise 2.3. After pivoting wider into `v1`, `v2`, `v3`, the cells that are `NA` mark visits that never happened. Build a small audit tibble showing each patient and the count of missed visits (number of `NA` cells in the row). Save the audit table as `ex_6_3`, sorted descending by `missed`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   patient_id missed
#>   <chr>       <int>
#> 1 P002            2
#> 2 P003            1
#> 3 P001            0
```

**Difficulty:** Advanced

[HINTS]
Each blank cell in the wide table marks a visit that never happened, so you want a per-patient tally of those blanks, ranked.
Use rowwise() with mutate(missed = sum(is.na(c_across(v1:v3)))), then arrange(desc(missed)).

```r title="Your turn"
ex_6_3 <- ex_2_3 |>
  # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- ex_2_3 |>
  rowwise() |>
  mutate(missed = sum(is.na(c_across(v1:v3)))) |>
  ungroup() |>
  select(patient_id, missed) |>
  arrange(desc(missed))
ex_6_3
#> # A tibble: 3 x 2
#>   patient_id missed
#>   <chr>       <int>
#> 1 P002            2
#> 2 P003            1
#> 3 P001            0
```

**Explanation:** Counting `NA` cells across a fixed set of columns is the prototypical use of `rowwise() + c_across()`. The alternative is to pivot back to long form with `values_drop_na = FALSE` and count `NA` per patient with `group_by() |> summarise(missed = sum(is.na(systolic)))`, which is faster on big data but more verbose. A modern equivalent uses `rowSums(is.na(across(v1:v3)))` inside `mutate()`, which is vectorized and avoids `rowwise()` entirely. Either pattern is the standard data quality probe after a `pivot_wider()` that introduces implicit missings.

</details>

## What to do next

- Read the parent core lesson: [pivot_longer & pivot_wider in R: Reshape Wide to Long](pivot_longer-pivot_wider-Reshape-Data-in-R.html).
- Practice splitting and combining character columns: [tidyr separate() & unite()](tidyr-separate-unite-Split-Combine-Columns-in-R.html).
- Practice making implicit missings explicit: [tidyr expand() & complete()](tidyr-expand-complete-Make-Implicit-Missing-Values-Explicit.html).
- Continue with the [tidyr Nest Unnest Exercises in R](tidyr-Nest-Unnest-Exercises-in-R.html) hub once you are comfortable with reshaping.
