---
title: "Tidyverse Exercises in R: 50 Real-World Practice Problems"
slug: "tidyverse-Exercises-in-R"
description: "Practice the tidyverse with 50 cross-package R exercises spanning dplyr, tidyr, stringr, lubridate, and purrr on real workflows. Hidden solutions and explanations."
keywords: "tidyverse exercises, tidyverse practice, tidyverse exercises in R, learn tidyverse by example, tidyverse practice problems, dplyr tidyr stringr exercises"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Tidyverse Exercises"
sidebar_order: 103
fr_parent: "R-Tutorial.html"
auto_link_terms: "tidyverse exercises|tidyverse practice|tidyverse exercises in R|practice tidyverse|tidyverse problems"
auto_link_case_sensitive: false
target_keyword: "tidyverse exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Tidyverse Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty tidyverse practice problems grouped into six themed sections that cross dplyr, tidyr, stringr, lubridate, and purrr on real workflows. Every problem ships with an expected result so you can verify, and solutions stay hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(stringr)
library(lubridate)
library(purrr)
library(tibble)
library(broom)
library(ggplot2)
```

## Section 1. dplyr foundations: filter, select, mutate, summarise (9 problems)

### Exercise 1.1: Filter mpg for fuel-efficient compact cars

**Task:** Use the `mpg` dataset from ggplot2 to keep only rows where `class` equals "compact" AND city mileage (`cty`) is strictly greater than 25 miles per gallon. Retain every original column so a reviewer can inspect manufacturer, model, and transmission for each match. Save the filtered tibble to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 6 x 11
#>   manufacturer model      displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>      <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 toyota       corolla      1.8  2008     4 manual(m5) f        28    37 r     compact
#> 2 volkswagen   new beetle   1.9  1999     4 manual(m5) f        35    44 d     compact
#> 3 volkswagen   jetta        1.9  1999     4 manual(m5) f        33    44 d     compact
#> ...
#> # 3 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
You need to keep only the rows that satisfy two requirements at the same time, while leaving every column untouched.
Filter with two comma-separated conditions: one testing `class` for equality with "compact", one testing `cty` against 25.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mpg |>
  filter(class == "compact", cty > 25)
ex_1_1
```

**Explanation:** Passing multiple conditions to `filter()` separated by commas is equivalent to combining them with `&` (logical AND). The comma style reads more naturally and is the idiomatic dplyr form. A common mistake is writing `class = "compact"` with a single equals sign, which is assignment and triggers an error inside `filter()`. Always use `==` for equality tests.

</details>

### Exercise 1.2: Select diamond grading columns with tidyselect helpers

**Task:** From the `diamonds` dataset, build a tibble that keeps `price` first, then every column whose name starts with the letter "c" (carat, cut, color, clarity). Use a tidyselect helper rather than naming columns one by one so the code keeps working if a new "c" column is added later. Save the result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 53,940 x 5
#>   price carat cut       color clarity
#>   <int> <dbl> <ord>     <ord> <ord>
#> 1   326  0.23 Ideal     E     SI2
#> 2   326  0.21 Premium   E     SI1
#> 3   327  0.23 Good      E     VS1
#> ...
#> # 53,937 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
Name the one column you want up front, then let a pattern-based selector grab the whole family of related columns.
Pass `price` first and then `starts_with("c")` to your column selection.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- diamonds |>
  select(price, starts_with("c"))
ex_1_2
```

**Explanation:** `starts_with()` is one of the tidyselect helpers (`ends_with()`, `contains()`, `matches()`, `where()`). Naming `price` first then `starts_with("c")` controls column order: position in the call equals position in the output. Because `starts_with()` skips columns already listed by name, `price` never gets duplicated even if it had started with "c" itself.

</details>

### Exercise 1.3: Sort diamonds by price descending then carat ascending

**Task:** Sort the `diamonds` data frame so the most expensive stones appear first, and within the same price the smaller carat appears first. This is the order a pricing audit would want when scanning for entries that look mispriced relative to size. Save the sorted tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 53,940 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.29 Premium   I     VS2      60.8    60 18823  8.5   8.47  5.16
#> 2  2    Very Good G     SI1      63.5    56 18818  7.9   7.97  5.04
#> 3  1.51 Ideal     G     IF       61.7    55 18806  7.37  7.41  4.56
#> ...
#> # 53,937 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
Sort primarily by price from high to low, and use the size column only to settle rows that share the same price.
Call `arrange()` with `desc(price)` followed by `carat` as the tiebreaker.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- diamonds |>
  arrange(desc(price), carat)
ex_1_3
```

**Explanation:** `arrange()` sorts ascending by default; wrap a column in `desc()` for descending. Passing two columns means the second is a tiebreaker for the first. Note that `arrange()` ignores grouping; to sort within groups, either `arrange(group, key)` or use `.by_group = TRUE`. Sorting is non-destructive: it returns a new tibble with row order changed but no data removed.

</details>

### Exercise 1.4: Tag diamonds into price tiers with case_when

**Task:** Add a `tier` column to `diamonds` that bins `price` into three buckets; "budget" (below 1000), "mid" (1000 to under 5000), and "premium" (5000 and above). A jeweller preparing a quarterly sale wants this label for routing inventory to different campaigns. Save the result to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 53,940 x 11
#>   carat cut       color clarity depth table price     x     y     z tier
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl> <chr>
#> 1  0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43 budget
#> 2  0.21 Premium   E     SI1      59.8    61   326  3.89  3.84  2.31 budget
#> 3  0.23 Good      E     VS1      56.9    65   327  4.05  4.07  2.31 budget
#> ...
#> # 53,937 more rows hidden
#> count(ex_1_4, tier):
#>   tier        n
#> 1 budget  14524
#> 2 mid     28966
#> 3 premium 10450
```

**Difficulty:** Intermediate
[HINTS]
Add a new column whose label depends on which of three price ranges each row falls into.
Inside `mutate()`, use `case_when()` with conditions ordered low-to-high and a final `TRUE ~ "premium"` catch-all.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- diamonds |>
  mutate(tier = case_when(
    price < 1000  ~ "budget",
    price < 5000  ~ "mid",
    TRUE          ~ "premium"
  ))
count(ex_1_4, tier)
```

**Explanation:** `case_when()` reads top-to-bottom and the first matching condition wins. Because the second branch implicitly handles 1000-4999, you do not need `price >= 1000 & price < 5000`. The trailing `TRUE ~ ...` is the catch-all default; without it, prices of 5000 or above would become `NA`. Cleaner than nested `if_else()` once you reach three or more buckets.

</details>

### Exercise 1.5: Summarise diamonds with multiple statistics in one call

**Task:** Compute four summary statistics for the entire `diamonds` price column in one `summarise()` call: mean price (`mean_price`), median price (`median_price`), 10th percentile (`p10`), and 90th percentile (`p90`). Round all four to one decimal place so the result fits a single audit row. Save the resulting tibble to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>   mean_price median_price    p10    p90
#>        <dbl>        <dbl>  <dbl>  <dbl>
#> 1     3932.8        2401   646   9821
```

**Difficulty:** Beginner
[HINTS]
Collapse the entire price column down to a single row holding four separately named statistics.
Inside `summarise()`, compute `mean()`, `median()`, and `quantile(price, 0.10)` / `quantile(price, 0.90)`, wrapping results in `round()`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- diamonds |>
  summarise(
    mean_price   = round(mean(price), 1),
    median_price = median(price),
    p10          = quantile(price, 0.10),
    p90          = quantile(price, 0.90)
  )
ex_1_5
```

**Explanation:** `summarise()` collapses many rows to one and is the right verb whenever you need a one-row report. `quantile()` returns a named numeric; `summarise()` strips the name and stores it under the column name you assigned. To compute the same statistics by group, the only change is prepending `group_by()`; the `summarise()` call stays identical. That symmetry is why pipelines stay short.

</details>

### Exercise 1.6: Drop duplicate model rows keeping every column

**Task:** The `mpg` dataset has multiple rows per (manufacturer, model) pair because of trim variants. Keep one row per unique (manufacturer, model) combination but retain every original column from whichever row appears first. Save the result to `ex_1_6` so a product catalogue can reference one row per model.

**Expected result:**

```
#> # A tibble: 38 x 11
#>   manufacturer model      displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>      <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 audi         a4           1.8  1999     4 auto(l5)   f        18    29 p     compact
#> 2 audi         a4 quattro   1.8  1999     4 manual(m5) 4        18    26 p     compact
#> 3 audi         a6 quattro   2.8  1999     6 auto(l5)   4        15    24 a     midsize
#> ...
#> # 35 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
Reduce the data to one row per unique key combination, but hold on to every other column from the first matching row.
Call `distinct()` on `manufacturer` and `model` with the `.keep_all = TRUE` argument.

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- mpg |>
  distinct(manufacturer, model, .keep_all = TRUE)
ex_1_6
```

**Explanation:** Without `.keep_all = TRUE`, `distinct()` returns only the columns you list. With it, dplyr keeps the first encountered row in full whenever a duplicate of the key columns appears. This is faster than `group_by() |> slice(1)` and reads more clearly when the intent is dedup-on-key. To choose a specific row instead of the first, switch to `slice_min()` or `slice_max()` on a tiebreaker column.

</details>

### Exercise 1.7: Find the top three priciest diamonds per cut grade

**Task:** For each `cut` quality level in `diamonds`, return the three rows with the highest `price`. Break ties by including all ties (so a cut with four diamonds tied for second place returns four rows, not three). Save the resulting tibble to `ex_1_7` so a buyer can see the top stones in each grade.

**Expected result:**

```
#> # A tibble: 15 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.01 Fair      G     SI1      70.6    64 18574  7.43  6.64  4.69
#> 2  2.02 Fair      H     VS2      64.5    57 18565  8     7.95  5.13
#> 3  4.5  Fair      J     I1       65.8    58 18531 10.2  10.16  6.72
#> ...
#> # 12 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
Work within each cut grade and keep only the rows holding the largest price values, including any ties at the cutoff.
Use `group_by(cut)` then `slice_max(price, n = 3, with_ties = TRUE)`, and `ungroup()` at the end.

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- diamonds |>
  group_by(cut) |>
  slice_max(price, n = 3, with_ties = TRUE) |>
  ungroup()
ex_1_7
```

**Explanation:** `slice_max()` keeps the n highest values; `slice_min()` is the symmetric verb. The `with_ties = TRUE` default returns extra rows when the nth row is tied, which is usually what audits want. `ungroup()` at the end prevents the grouping from leaking into downstream operations; a frequent source of confusing dplyr bugs. Always ungroup once group-aware work is done.

</details>

### Exercise 1.8: Rename and reorder columns for a finance report

**Task:** Make the `economics` dataset publication-ready: rename `psavert` to `savings_rate`, rename `unemploy` to `unemployed_thousands`, and reorder so the columns appear as `date`, `unemployed_thousands`, `savings_rate`, then everything else in original order. Save to `ex_1_8` so the result can be shipped to a finance team unfamiliar with R abbreviations.

**Expected result:**

```
#> # A tibble: 574 x 6
#>   date       unemployed_thousands savings_rate    pce    pop uempmed
#>   <date>                    <dbl>        <dbl>  <dbl>  <dbl>   <dbl>
#> 1 1967-07-01                 2944         12.5  507.0  198712     4.5
#> 2 1967-08-01                 2945         12.5  510.9  198911     4.7
#> 3 1967-09-01                 2958         11.7  516.7  199113     4.6
#> ...
#> # 571 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
Give two columns clearer names, then move a few columns to the front while leaving the rest in place.
Use `rename()` with `new = old` pairs, then `relocate()` listing the three columns that should lead.

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- economics |>
  rename(savings_rate = psavert, unemployed_thousands = unemploy) |>
  relocate(date, unemployed_thousands, savings_rate)
ex_1_8
```

**Explanation:** `rename()` takes pairs in `new = old` order; the opposite of `mutate()`, which is `new = expression`. `relocate()` is the dedicated verb for column reordering; the columns you name move to the front by default, and unlisted columns keep their relative order. You could chain `select()` to reorder but `select()` drops anything not listed, which is risky for wide tables. Prefer `relocate()`.

</details>

### Exercise 1.9: Z-score every numeric column in mtcars

**Task:** Standardise every numeric column of `mtcars` (subtract the mean, divide by the standard deviation) so the result has mean zero and unit variance per column. Use `mutate(across(...))` rather than rewriting one mutate per column. Save the scaled tibble to `ex_1_9` for use as model input later.

**Expected result:**

```
#> # A tibble: 32 x 11
#>      mpg    cyl   disp     hp   drat     wt   qsec     vs     am   gear   carb
#>    <dbl>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>
#> 1  0.151 -0.105 -0.571 -0.535  0.568 -0.610 -0.777 -0.868  1.190  0.424  0.735
#> 2  0.151 -0.105 -0.571 -0.535  0.568 -0.350 -0.464 -0.868  1.190  0.424  0.735
#> 3  0.450 -1.225 -0.990 -0.783  0.474 -0.917  0.426  1.116  1.190  0.424 -1.122
#> ...
#> # 29 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
Apply the same standardising transformation to every column at once instead of writing one line per column.
Use `mutate(across(everything(), ...))` with a lambda like `\(x) (x - mean(x)) / sd(x)`.

```r title="Your turn"
ex_1_9 <- # your code here
ex_1_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_9 <- as_tibble(mtcars) |>
  mutate(across(everything(), \(x) (x - mean(x)) / sd(x)))
ex_1_9
```

**Explanation:** `across()` applies a function to many columns at once. `everything()` is the selector here; for numeric-only safety on mixed-type tables, use `where(is.numeric)`. The backslash lambda `\(x) ...` is base R 4.1+ shorthand for `function(x) ...`. An alternative is `scale()`, but it returns a matrix; `mutate(across())` keeps the result as a tibble, which is usually what you want for downstream piping.

</details>

## Section 2. Grouping, joining, set operations (9 problems)

### Exercise 2.1: Average highway mileage per vehicle class

**Task:** Group the `mpg` dataset by `class` and report two columns: `n` (number of vehicles in that class) and `mean_hwy` (mean highway mpg, rounded to 1 decimal). Sort the output so the most fuel-efficient class appears at the top. Save the result to `ex_2_1` for a fleet-procurement briefing.

**Expected result:**

```
#> # A tibble: 7 x 3
#>   class          n mean_hwy
#>   <chr>      <int>    <dbl>
#> 1 compact       47     28.3
#> 2 midsize       41     27.3
#> 3 subcompact    35     28.1
#> ...
#> # 4 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
Split the data by class, then report a count and an average per group, ordered so the best average is on top.
Use `group_by(class)`, `summarise(n = n(), mean_hwy = round(mean(hwy), 1))`, then `arrange(desc(mean_hwy))`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mpg |>
  group_by(class) |>
  summarise(n = n(), mean_hwy = round(mean(hwy), 1)) |>
  arrange(desc(mean_hwy))
ex_2_1
```

**Explanation:** `n()` is a dplyr counter that works only inside `summarise()` and similar verbs; it knows the current group size. The `arrange(desc())` after summarising sorts the one-row-per-group output by the computed mean. Since dplyr 1.1, you could also write `summarise(..., .by = class)` and skip the explicit `group_by()`; both styles are valid, but the explicit form remains easier for newcomers to read.

</details>

### Exercise 2.2: Percentage of diamonds in each cut quality

**Task:** Report what percentage of all 53,940 diamonds belong to each `cut` grade. The output must have columns `cut`, `n`, and `pct` (percent of total, rounded to 2 decimals), with rows sorted from largest cut category to smallest. Save the result to `ex_2_2` so it can drop straight into a slide deck.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   cut           n   pct
#>   <ord>     <int> <dbl>
#> 1 Ideal     21551  39.95
#> 2 Premium   13791  25.57
#> 3 Very Good 12082  22.40
#> 4 Good       4906   9.10
#> 5 Fair       1610   2.98
```

**Difficulty:** Intermediate
[HINTS]
Tally how many rows fall in each category, then convert those tallies into shares of the overall total.
Use `count(cut, sort = TRUE)`, then `mutate(pct = round(100 * n / sum(n), 2))`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- diamonds |>
  count(cut, sort = TRUE) |>
  mutate(pct = round(100 * n / sum(n), 2))
ex_2_2
```

**Explanation:** `count(cut, sort = TRUE)` is shorthand for `group_by(cut) |> summarise(n = n()) |> arrange(desc(n))`. After counting, the data is no longer grouped, so `sum(n)` in `mutate()` totals across all rows; which is what we want for an overall percent. If we had stayed grouped, `sum(n)` would have just returned each group's own count and every `pct` would have been 100.

</details>

### Exercise 2.3: Inner-join orders to customers on customer_id

**Task:** Build two small inline tibbles; `customers` with columns `customer_id`, `name` (5 rows) and `orders` with `order_id`, `customer_id`, `amount` (6 rows where one `customer_id` does not exist in `customers`). Inner-join orders to customers so only orders with a matching customer remain, and save to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   order_id customer_id name    amount
#>      <int>       <int> <chr>    <dbl>
#> 1     1001           1 Alice     49.9
#> 2     1002           2 Bob      120
#> 3     1003           1 Alice     33.5
#> 4     1004           3 Cara      87.2
#> 5     1006           4 Dan       15
```

**Difficulty:** Intermediate
[HINTS]
Combine the two tables so that only records present on both sides survive the merge.
Use `inner_join()` with `by = "customer_id"`.

```r title="Your turn"
customers <- tibble(
  customer_id = 1:5,
  name        = c("Alice", "Bob", "Cara", "Dan", "Eve")
)
orders <- tibble(
  order_id    = 1001:1006,
  customer_id = c(1, 2, 1, 3, 9, 4),
  amount      = c(49.9, 120, 33.5, 87.2, 200, 15)
)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- orders |>
  inner_join(customers, by = "customer_id")
ex_2_3
```

**Explanation:** `inner_join()` keeps only rows whose join key exists in both tables. The order of arguments determines column order in the output, not the join semantics; `orders |> inner_join(customers)` and `customers |> inner_join(orders)` return the same rows but with columns in different positions. dplyr 1.1 also accepts `join_by(customer_id)` as the modern alternative to `by = "customer_id"`.

</details>

### Exercise 2.4: Left-join customers with orders and fill missing amounts

**Task:** Using the `customers` and `orders` tibbles from Exercise 2.3, build a left join that starts from `customers` and brings in `order_id` and `amount`. Where a customer has no orders, replace the resulting `NA` amount with 0 so the column is fully numeric. Save the result to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   customer_id name  order_id amount
#>         <int> <chr>    <int>  <dbl>
#> 1           1 Alice     1001   49.9
#> 2           1 Alice     1003   33.5
#> 3           2 Bob       1002  120
#> 4           3 Cara      1004   87.2
#> 5           4 Dan       1006   15
#> 6           5 Eve         NA    0
```

**Difficulty:** Intermediate
[HINTS]
Keep every customer, attach order details where they exist, and replace the blanks left behind with zero.
Use `left_join()` on `customer_id`, then `mutate(amount = coalesce(amount, 0))`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- customers |>
  left_join(orders, by = "customer_id") |>
  mutate(amount = coalesce(amount, 0))
ex_2_4
```

**Explanation:** A left join keeps every row of the left table and adds matching columns from the right; non-matches become `NA`. `coalesce()` is the tidyverse "first non-NA" function and is the idiomatic replacement for `ifelse(is.na(x), 0, x)`. Notice that Eve still shows `NA` for `order_id`; only `amount` was patched, because the order id of a non-existent order is genuinely undefined.

</details>

### Exercise 2.5: Anti-join to find orders without matching customers

**Task:** Using the same `orders` and `customers` tibbles, surface every order whose `customer_id` does NOT exist in the customer table. This is exactly what a data-quality auditor looking for orphan transactions wants. Save the result to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   order_id customer_id amount
#>      <int>       <int>  <dbl>
#> 1     1005           9    200
```

**Difficulty:** Intermediate
[HINTS]
Return the orders whose key has no counterpart at all in the customer table.
Use `anti_join(customers, by = "customer_id")`.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- orders |>
  anti_join(customers, by = "customer_id")
ex_2_5
```

**Explanation:** `anti_join()` keeps rows of the left table whose key has NO match in the right table; the inverse of `semi_join()`. The right table contributes no columns; it acts purely as a filter. This is the cleanest way to find referential-integrity violations in joined data. Functionally equivalent to `filter(!customer_id %in% customers$customer_id)` but reads better and is faster on large data.

</details>

### Exercise 2.6: Semi-join to keep only iris rows of selected species

**Task:** Build a one-column tibble called `keep` listing two species: "setosa" and "virginica". Use a semi-join against `iris` (converted to a tibble) so the result contains every iris row whose species appears in `keep`, with no columns from `keep` itself. Save the result to `ex_2_6`.

**Expected result:**

```
#> # A tibble: 100 x 5
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> ...
#> # 97 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
Filter the iris rows down to those whose species appears in the lookup table, without pulling in its columns.
Use `semi_join(keep, by = "Species")` against the iris tibble.

```r title="Your turn"
keep <- tibble(Species = c("setosa", "virginica"))
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- as_tibble(iris) |>
  semi_join(keep, by = "Species")
ex_2_6
```

**Explanation:** `semi_join()` filters the left table by membership in the right table's key; it never duplicates rows even if the right table has multiple matches. Compare with `inner_join()`, which would broadcast: if `keep` had `setosa` listed twice, `inner_join()` would double every setosa row, but `semi_join()` would not. Use semi-join whenever you need filter-by-membership semantics without column merging.

</details>

### Exercise 2.7: Full-join two product price feeds and coalesce values

**Task:** Two feeds report product prices and one is missing some SKUs. Build inline tibbles `feed_a` (SKUs A, B, C with prices 10, 20, 30) and `feed_b` (SKUs B, C, D with prices 22, 31, 40). Full-join them on `sku`, then add a `final_price` column that prefers `feed_a` when present and falls back to `feed_b`. Save to `ex_2_7`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   sku   price_a price_b final_price
#>   <chr>   <dbl>   <dbl>       <dbl>
#> 1 A          10      NA          10
#> 2 B          20      22          20
#> 3 C          30      31          30
#> 4 D          NA      40          40
```

**Difficulty:** Intermediate
[HINTS]
Keep the union of keys from both feeds, then pick the preferred value per row when both are present.
Use `full_join()` on `sku`, then `mutate(final_price = coalesce(price_a, price_b))`.

```r title="Your turn"
feed_a <- tibble(sku = c("A","B","C"), price_a = c(10, 20, 30))
feed_b <- tibble(sku = c("B","C","D"), price_b = c(22, 31, 40))
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- feed_a |>
  full_join(feed_b, by = "sku") |>
  mutate(final_price = coalesce(price_a, price_b))
ex_2_7
```

**Explanation:** `full_join()` returns the union of keys from both tables, inserting `NA` where a key is missing on either side. `coalesce()` accepts any number of arguments and returns the first non-`NA` per row, making it perfect for prioritised feed reconciliation. If you wanted the maximum or mean of the two prices instead, swap `coalesce()` for `pmax(..., na.rm = TRUE)` or `rowMeans(..., na.rm = TRUE)`.

</details>

### Exercise 2.8: Stack quarterly tibbles with a source identifier

**Task:** Three quarterly tibbles each have the same columns `region` and `revenue` but no quarter label. Stack them into one long tibble adding a `quarter` column (Q1, Q2, Q3) sourced from the list element name. Save to `ex_2_8` so revenue can be plotted across quarters.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   quarter region revenue
#>   <chr>   <chr>    <dbl>
#> 1 Q1      east       100
#> 2 Q1      west       150
#> 3 Q2      east       110
#> 4 Q2      west       170
#> 5 Q3      east       125
#> 6 Q3      west       190
```

**Difficulty:** Intermediate
[HINTS]
Stack the list of tables into one, carrying each table's name into a new label column.
Use `bind_rows()` with the `.id = "quarter"` argument.

```r title="Your turn"
q_list <- list(
  Q1 = tibble(region = c("east","west"), revenue = c(100, 150)),
  Q2 = tibble(region = c("east","west"), revenue = c(110, 170)),
  Q3 = tibble(region = c("east","west"), revenue = c(125, 190))
)
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- bind_rows(q_list, .id = "quarter")
ex_2_8
```

**Explanation:** `bind_rows()` accepts a list of tibbles and stacks them. The magic argument is `.id`: it adds a new column whose values are the list-element names. This is the cleanest way to preserve a "source" label when combining many similar tables. If you instead had separate variables `q1`, `q2`, `q3`, you would call `bind_rows(Q1 = q1, Q2 = q2, Q3 = q3, .id = "quarter")` with explicit naming.

</details>

### Exercise 2.9: Compute day-over-day price change with lag

**Task:** Build an inline tibble of seven consecutive daily closing prices for a single ticker, then add a `delta` column equal to today minus yesterday. The first row should have `delta` = `NA` because there is no prior day. Save to `ex_2_9` so a trader can flag big single-day moves.

**Expected result:**

```
#> # A tibble: 7 x 3
#>   date       close delta
#>   <date>     <dbl> <dbl>
#> 1 2026-05-01  101    NA
#> 2 2026-05-02  103     2
#> 3 2026-05-03  100    -3
#> 4 2026-05-04  104     4
#> 5 2026-05-05  108     4
#> 6 2026-05-06  107    -1
#> 7 2026-05-07  111     4
```

**Difficulty:** Intermediate
[HINTS]
After putting the rows in date order, compare each day's value against the one immediately before it.
Use `arrange(date)`, then `mutate(delta = close - lag(close))`.

```r title="Your turn"
prices <- tibble(
  date  = as.Date("2026-05-01") + 0:6,
  close = c(101, 103, 100, 104, 108, 107, 111)
)
ex_2_9 <- # your code here
ex_2_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_9 <- prices |>
  arrange(date) |>
  mutate(delta = close - lag(close))
ex_2_9
```

**Explanation:** `lag()` shifts a vector down by one, padding the top with `NA`; `lead()` is its mirror. Always `arrange()` before lagging or you will compute deltas between rows that are not actually adjacent in time. For groupwise lags (per ticker), wrap in `group_by()` first; `lag()` respects grouping inside a dplyr pipeline. Use `lag(close, n = 5)` for a 5-day lag.

</details>

## Section 3. Reshape with tidyr: pivot, separate, nest (8 problems)

### Exercise 3.1: Pivot quarterly sales from wide to long

**Task:** Take a wide tibble where each row is a region and quarterly sales sit across columns `Q1`, `Q2`, `Q3`, `Q4`. Pivot to long form so the result has columns `region`, `quarter`, and `sales`. Save the long tibble to `ex_3_1` for use as ggplot input.

**Expected result:**

```
#> # A tibble: 12 x 3
#>   region quarter sales
#>   <chr>  <chr>   <dbl>
#> 1 east   Q1        100
#> 2 east   Q2        110
#> 3 east   Q3        125
#> 4 east   Q4        140
#> 5 west   Q1        150
#> ...
#> # 7 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
Reshape the table so the four spread-out columns collapse into one key column and one value column.
Use `pivot_longer(cols = Q1:Q4, names_to = "quarter", values_to = "sales")`.

```r title="Your turn"
wide_sales <- tibble(
  region = c("east","west","north"),
  Q1 = c(100, 150, 80),
  Q2 = c(110, 170, 85),
  Q3 = c(125, 190, 90),
  Q4 = c(140, 210, 95)
)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- wide_sales |>
  pivot_longer(
    cols      = Q1:Q4,
    names_to  = "quarter",
    values_to = "sales"
  )
ex_3_1
```

**Explanation:** `pivot_longer()` takes the columns named in `cols`, stacks them into one new column whose values come from old cell entries, and adds a key column listing the old column names. `cols = Q1:Q4` uses tidyselect range syntax; you could equivalently write `cols = starts_with("Q")`. Long form is the format ggplot, dplyr summarisation, and most modelling functions expect, so reshaping wide-to-long is usually the first step.

</details>

### Exercise 3.2: Pivot the same data back to wide format

**Task:** Take the long-format `ex_3_1` and pivot back to wide so each region is one row and each quarter is a column (Q1, Q2, Q3, Q4). The result should match the original `wide_sales` exactly. Save to `ex_3_2` so you can validate the round-trip.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   region    Q1    Q2    Q3    Q4
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 east     100   110   125   140
#> 2 west     150   170   190   210
#> 3 north     80    85    90    95
```

**Difficulty:** Beginner
[HINTS]
Reverse the earlier reshape so every key value becomes its own column once more.
Use `pivot_wider(names_from = quarter, values_from = sales)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ex_3_1 |>
  pivot_wider(
    names_from  = quarter,
    values_from = sales
  )
ex_3_2
```

**Explanation:** `pivot_wider()` is the inverse of `pivot_longer()`. `names_from` says which column's values become new column names; `values_from` says which column's values fill the cells. If the (region, quarter) combination is not unique, you must supply `values_fn = mean` (or sum, list, etc.) to tell pivot how to aggregate duplicates. Without that, `pivot_wider()` warns and stores list-columns.

</details>

### Exercise 3.3: Split a name column into first and last names

**Task:** Given a tibble of three full names like "Ada Lovelace" in a single `full_name` column, split on the space into two new columns `first` and `last`. The original column should be dropped. Save the resulting two-column tibble to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   first    last
#>   <chr>    <chr>
#> 1 Ada      Lovelace
#> 2 Grace    Hopper
#> 3 Margaret Hamilton
```

**Difficulty:** Beginner
[HINTS]
Split the single text column at its space into two named columns and discard the original.
Use `separate_wider_delim(full_name, delim = " ", names = c("first", "last"))`.

```r title="Your turn"
people <- tibble(full_name = c("Ada Lovelace", "Grace Hopper", "Margaret Hamilton"))
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- people |>
  separate_wider_delim(full_name, delim = " ", names = c("first", "last"))
ex_3_3
```

**Explanation:** `separate_wider_delim()` is the modern tidyr replacement for the deprecated `separate()`. It splits on a delimiter and creates the named columns. If you had three-word names like "Mary Jane Watson", you would need `too_many = "merge"` or `too_many = "drop"` to handle the extra parts; otherwise tidyr errors loudly, which is usually safer than silently truncating.

</details>

### Exercise 3.4: Parse a structured event code with separate_wider_regex

**Task:** A logging system stores event codes as strings like "EVT-2026-0427-NY-ORDER" (prefix-year-mmdd-region-type). Parse one inline column of three such codes into four columns: `year`, `mmdd`, `region`, `type`. Use a regex-based separator so each piece lands in the right column. Save to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   year  mmdd  region type
#>   <chr> <chr> <chr>  <chr>
#> 1 2026  0427  NY     ORDER
#> 2 2026  0428  SF     REFUND
#> 3 2026  0429  NY     ORDER
```

**Difficulty:** Advanced
[HINTS]
Break the structured code into fields by describing each piece's pattern, letting the dashes act as throwaway separators.
Use `separate_wider_regex()` with a `patterns` vector mixing named entries like `year = "\\d{4}"` and unnamed separator strings.

```r title="Your turn"
events <- tibble(code = c("EVT-2026-0427-NY-ORDER", "EVT-2026-0428-SF-REFUND", "EVT-2026-0429-NY-ORDER"))
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- events |>
  separate_wider_regex(
    code,
    patterns = c(
      "EVT-", year = "\\d{4}", "-", mmdd = "\\d{4}", "-",
      region = "[A-Z]+", "-", type = "[A-Z]+"
    )
  )
ex_3_4
```

**Explanation:** `separate_wider_regex()` accepts a vector of named (kept) and unnamed (dropped) patterns. Unnamed strings like `"EVT-"` and `"-"` act as separators and disappear from the result. Named entries become columns. This pattern is far cleaner than a single mega-regex with capture groups because each field is documented inline and missing pieces fail loudly with row indices, easing debugging.

</details>

### Exercise 3.5: Nest mpg into one row per manufacturer

**Task:** Collapse the `mpg` dataset so the result has one row per manufacturer with a list-column `data` containing every other column for that manufacturer's vehicles. Save the nested tibble to `ex_3_5`. This is the canonical setup for fitting one model per group with purrr.

**Expected result:**

```
#> # A tibble: 15 x 2
#>   manufacturer data
#>   <chr>        <list>
#> 1 audi         <tibble [18 x 10]>
#> 2 chevrolet    <tibble [19 x 10]>
#> 3 dodge        <tibble [37 x 10]>
#> ...
#> # 12 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
Collapse each manufacturer's many rows into a single row carrying a packed table of the remaining columns.
Use `group_by(manufacturer)` then `nest()`, finishing with `ungroup()`.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- mpg |>
  group_by(manufacturer) |>
  nest() |>
  ungroup()
ex_3_5
```

**Explanation:** `nest()` turns each group of rows into a one-row entry in a list-column called `data`. You can pass `nest(.by = manufacturer)` since tidyr 1.3 to avoid the explicit `group_by()`. Always ungroup afterwards or downstream pipelines may behave unexpectedly. Nested tibbles are the foundation of split-apply-combine modelling: you nest, model, extract, then unnest.

</details>

### Exercise 3.6: Unnest a list-column back into long form

**Task:** Take the nested tibble `ex_3_5` and expand the `data` list-column back into the original shape; one row per vehicle, with `manufacturer` repeated across every row of its group. Save the unnested tibble to `ex_3_6`. The row count should match the original `mpg`.

**Expected result:**

```
#> # A tibble: 234 x 11
#>   manufacturer model      displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>      <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 audi         a4           1.8  1999     4 auto(l5)   f        18    29 p     compact
#> 2 audi         a4           1.8  1999     4 manual(m5) f        21    29 p     compact
#> ...
#> # 232 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
Expand the packed table column so every original vehicle becomes its own row again.
Use `unnest(data)` on the nested tibble.

```r title="Your turn"
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- ex_3_5 |>
  unnest(data)
ex_3_6
```

**Explanation:** `unnest()` is the inverse of `nest()`. It takes a list-column of tibbles and stacks them, repeating the non-list columns to match each row. If the list-column held atomic vectors instead of tibbles, you would need `unnest_longer()` (each element becomes a row) or `unnest_wider()` (each element becomes a column). Match the verb to the shape of the list-column content.

</details>

### Exercise 3.7: Complete missing day-product combinations with zero sales

**Task:** A sparse sales log only records days where at least one product sold. Given three rows covering 2 products across 3 days, expand to the full 6-row grid so every (day, product) pair appears, filling absent sales with 0. Save to `ex_3_7` so a dashboard does not show gaps.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   day        product sales
#>   <date>     <chr>   <dbl>
#> 1 2026-05-01 A           5
#> 2 2026-05-01 B           0
#> 3 2026-05-02 A           0
#> 4 2026-05-02 B           7
#> 5 2026-05-03 A           3
#> 6 2026-05-03 B           4
```

**Difficulty:** Intermediate
[HINTS]
Fill in every missing pairing of the two key columns so no day-product combination is absent.
Use `complete(day, product, fill = list(sales = 0))`.

```r title="Your turn"
sparse <- tibble(
  day     = as.Date(c("2026-05-01","2026-05-02","2026-05-03","2026-05-03")),
  product = c("A","B","A","B"),
  sales   = c(5, 7, 3, 4)
)
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- sparse |>
  complete(day, product, fill = list(sales = 0))
ex_3_7
```

**Explanation:** `complete()` takes one or more columns and ensures every combination of their unique values appears as a row. Missing rows are added with `NA` in other columns; `fill = list(col = value)` provides defaults. This is exactly the operation needed before time-series joins or aggregations where missing observations represent zero, not unknown. Skipping `complete()` here would make a downstream `group_by(day)` give wrong averages.

</details>

### Exercise 3.8: Forward-fill missing branch labels in a transaction log

**Task:** A bank's transaction export only writes the branch name on the first row of each block and leaves it blank afterwards. Given a tibble where `branch` has `NA` for rows 2, 3, 5, 6, forward-fill the column so every row has the most recent branch above it. Save to `ex_3_8`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   branch     amount
#>   <chr>       <dbl>
#> 1 Downtown      120
#> 2 Downtown       85
#> 3 Downtown      210
#> 4 Airport       55
#> 5 Airport       90
#> 6 Airport      130
```

**Difficulty:** Intermediate
[HINTS]
Propagate each block's label downward into the rows left blank beneath it.
Use `fill(branch, .direction = "down")`.

```r title="Your turn"
tx <- tibble(
  branch = c("Downtown", NA, NA, "Airport", NA, NA),
  amount = c(120, 85, 210, 55, 90, 130)
)
ex_3_8 <- # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- tx |>
  fill(branch, .direction = "down")
ex_3_8
```

**Explanation:** `fill()` propagates the last non-`NA` value into subsequent `NA`s. `.direction = "down"` is the default and matches the spreadsheet "merged cell" pattern. Use `"up"` for backward fill or `"downup"` to fill from both directions in one pass. `fill()` respects grouping, so prepending `group_by(account_id)` prevents one account's branch from leaking into another's.

</details>

## Section 4. Strings and dates: stringr and lubridate (8 problems)

### Exercise 4.1: Keep mpg rows whose model name contains "audi"

**Task:** From the `mpg` dataset, keep only rows where `manufacturer` matches "audi" (case-insensitive so a future "AUDI" entry would still match). Use a stringr detector inside `filter()` rather than `==`. Save the filtered tibble to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 18 x 11
#>   manufacturer model      displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>      <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 audi         a4           1.8  1999     4 auto(l5)   f        18    29 p     compact
#> 2 audi         a4           1.8  1999     4 manual(m5) f        21    29 p     compact
#> ...
#> # 16 more rows hidden
```

**Difficulty:** Beginner
[HINTS]
Filter rows by testing whether the manufacturer text contains a substring, regardless of letter case.
Inside `filter()`, use `str_detect()` with the pattern wrapped in `regex("audi", ignore_case = TRUE)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mpg |>
  filter(str_detect(manufacturer, regex("audi", ignore_case = TRUE)))
ex_4_1
```

**Explanation:** `str_detect()` returns a logical vector indicating which strings contain the pattern, perfect for use inside `filter()`. Wrapping the pattern in `regex(..., ignore_case = TRUE)` makes the match case-insensitive without modifying the source data. For a literal substring match without regex semantics, use `fixed("Audi")` to disable special characters; faster and safer when the pattern is user input.

</details>

### Exercise 4.2: Strip leading zeros from a string ID column

**Task:** A legacy system pads identifiers to a fixed width with leading zeros: "00042", "00100", "01999". Strip the leading zeros to produce "42", "100", "1999", but keep the result as a character column (not numeric) because downstream code expects strings. Save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   id_raw id_clean
#>   <chr>  <chr>
#> 1 00042  42
#> 2 00100  100
#> 3 01999  1999
```

**Difficulty:** Intermediate
[HINTS]
Delete only the run of zeros anchored to the very start of each string, keeping the column as text.
In `mutate()`, use `str_remove(id_raw, "^0+")`.

```r title="Your turn"
ids <- tibble(id_raw = c("00042", "00100", "01999"))
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ids |>
  mutate(id_clean = str_remove(id_raw, "^0+"))
ex_4_2
```

**Explanation:** `str_remove()` deletes the first regex match; `str_remove_all()` deletes every match. The anchor `^` ties the pattern to the start of the string, and `0+` matches one or more zeros. Without the anchor, `0+` would also remove zeros in the middle, turning "10500" into "15". A trap: `str_remove("00000", "^0+")` yields `""` not `"0"`; guard against all-zero inputs separately if you need to preserve a single zero.

</details>

### Exercise 4.3: Extract phone numbers from free-text contact notes

**Task:** Pull every US-style phone number formatted as ddd-ddd-dddd out of three rows of free-text contact notes. There may be zero, one, or two numbers per row. Return a tibble with one row per phone number found, retaining a `note_id` so each match links back to its source. Save to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   note_id phone
#>     <int> <chr>
#> 1       1 415-555-2671
#> 2       2 212-555-1010
#> 3       2 415-555-9090
#> 4       3 718-555-4444
```

**Difficulty:** Advanced
[HINTS]
Pull out every pattern match within each row, then expand the result so each match becomes its own row.
Use `str_extract_all(text, "\\d{3}-\\d{3}-\\d{4}")`, then `unnest_longer()` on that list-column.

```r title="Your turn"
notes <- tibble(
  note_id = 1:3,
  text    = c(
    "Call Ada at 415-555-2671 next week.",
    "Reach Bob on 212-555-1010 or 415-555-9090, either is fine.",
    "Cara: 718-555-4444 (mobile, after 7pm only)."
  )
)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- notes |>
  mutate(phone = str_extract_all(text, "\\d{3}-\\d{3}-\\d{4}")) |>
  select(note_id, phone) |>
  unnest_longer(phone)
ex_4_3
```

**Explanation:** `str_extract_all()` returns a list-column where each element holds every match for one row. `unnest_longer()` turns that list-column into one row per match, repeating `note_id` as needed. If you only wanted the first match per row, `str_extract()` (without `_all`) returns a character vector directly and no unnest is needed. Pick the verb based on whether rows can have multiple matches.

</details>

### Exercise 4.4: Parse mixed-format date strings with lubridate

**Task:** A CSV merged data from three vendors and each used a different date format: "2026-04-27", "04/28/2026", "29-Apr-2026". Parse all three into `Date` objects in one column called `parsed`. The result should be sortable as a date. Save to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   raw         parsed
#>   <chr>       <date>
#> 1 2026-04-27  2026-04-27
#> 2 04/28/2026  2026-04-28
#> 3 29-Apr-2026 2026-04-29
```

**Difficulty:** Intermediate
[HINTS]
Parse each string by trying several candidate date layouts until one of them fits.
Use `parse_date_time(raw, orders = c("ymd", "mdy", "dmy"))`, then `as.Date()` to drop the time.

```r title="Your turn"
mixed <- tibble(raw = c("2026-04-27", "04/28/2026", "29-Apr-2026"))
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- mixed |>
  mutate(parsed = parse_date_time(raw, orders = c("ymd", "mdy", "dmy")) |> as.Date())
ex_4_4
```

**Explanation:** `parse_date_time()` accepts a vector of candidate `orders` and tries them in turn for each value, returning the first that parses. The output is a `POSIXct`; `as.Date()` strips the time component. If you knew every row was the same format, the single-format functions `ymd()`, `mdy()`, or `dmy()` are faster. For heterogeneous CSVs, `parse_date_time()` is the workhorse; lock the candidate set tightly to avoid ambiguous matches.

</details>

### Exercise 4.5: Aggregate economics to monthly mean savings rate

**Task:** The `economics` dataset is already monthly, but treat it as a stress test: extract `year` and `month` (1-12) from `date`, then compute the mean `psavert` (personal savings rate) per (year, month) pair. The aggregation will be a no-op here (one row in equals one row out), but the code should be correct for any daily input. Save to `ex_4_5`.

**Expected result:**

```
#> # A tibble: 574 x 3
#>    year month mean_savings
#>   <dbl> <dbl>        <dbl>
#> 1  1967     7        12.5
#> 2  1967     8        12.5
#> 3  1967     9        11.7
#> ...
#> # 571 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
Pull the calendar components out of the date, then average the rate within each year-and-month period.
Use `mutate(year = year(date), month = month(date))`, `group_by(year, month)`, then `summarise(mean_savings = mean(psavert), .groups = "drop")`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- economics |>
  mutate(year = year(date), month = month(date)) |>
  group_by(year, month) |>
  summarise(mean_savings = mean(psavert), .groups = "drop")
ex_4_5
```

**Explanation:** `year()` and `month()` from lubridate return integer components from a `Date` or `POSIXct`. The `.groups = "drop"` argument is the cleanest way to silence dplyr's grouping warning and return an ungrouped result. Writing this idiom on a daily series automatically becomes a monthly rollup; the same pattern works whether the input is daily, hourly, or already monthly.

</details>

### Exercise 4.6: Compute customer tenure in days

**Task:** Build an inline tibble of three customers with `signup_date` ranging across years. Compute a `tenure_days` column showing how many whole days passed between `signup_date` and 2026-05-12. Save to `ex_4_6` so a retention dashboard can bucket customers by tenure.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   customer signup_date tenure_days
#>   <chr>    <date>      <dbl>
#> 1 Alice    2024-01-15        848
#> 2 Bob      2025-08-30        255
#> 3 Cara     2026-04-30         12
```

**Difficulty:** Beginner
[HINTS]
Subtract the signup date from a fixed reference date, then turn the resulting gap into a plain number.
In `mutate()`, compute `as.numeric(as.Date("2026-05-12") - signup_date)`.

```r title="Your turn"
signups <- tibble(
  customer    = c("Alice","Bob","Cara"),
  signup_date = as.Date(c("2024-01-15","2025-08-30","2026-04-30"))
)
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- signups |>
  mutate(tenure_days = as.numeric(as.Date("2026-05-12") - signup_date))
ex_4_6
```

**Explanation:** Subtracting two `Date` objects returns a `difftime`; `as.numeric()` strips the unit and gives a plain number of days. A lubridate alternative is `interval(signup_date, ymd("2026-05-12")) / days(1)`, which is more explicit about the unit but more verbose. For days-only arithmetic, the base R subtraction is usually the simplest correct answer.

</details>

### Exercise 4.7: Count tags in a semicolon-separated tag column

**Task:** A CMS stores article tags as a single `tags` string like "r;tidyverse;analytics". Given three rows, count the total occurrences of each individual tag across all rows. Return a tibble with columns `tag` and `n`, sorted from most to least common. Save to `ex_4_7`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   tag           n
#>   <chr>     <int>
#> 1 r             3
#> 2 tidyverse     2
#> 3 analytics     1
#> 4 ggplot2       1
#> 5 reporting     1
```

**Difficulty:** Intermediate
[HINTS]
Split the multi-valued string so each tag occupies its own row, then tally how often each tag appears.
Use `separate_longer_delim(tags, delim = ";")`, then `count(tag = tags, sort = TRUE)`.

```r title="Your turn"
articles <- tibble(
  id   = 1:3,
  tags = c("r;tidyverse;analytics", "r;ggplot2", "r;tidyverse;reporting")
)
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_7 <- articles |>
  separate_longer_delim(tags, delim = ";") |>
  count(tag = tags, sort = TRUE)
ex_4_7
```

**Explanation:** `separate_longer_delim()` is tidyr's row-multiplying split; one tag per row, with `id` repeated. Then `count()` does the tabulation. The rename `tag = tags` inside `count()` makes the output column read like a singular noun. This is the canonical way to summarise "many-valued" columns and avoids the trap of writing a regex-based count, which would miss whitespace edge cases.

</details>

### Exercise 4.8: Convert UTC event timestamps to a local timezone

**Task:** A logging pipeline timestamps events in UTC. Given three ISO-8601 UTC strings, parse them, then convert to "America/New_York" wall-clock time. The resulting column should be a `POSIXct` whose displayed times reflect Eastern, not UTC. Save to `ex_4_8`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   utc_string               local_ny
#>   <chr>                    <dttm>
#> 1 2026-05-12T14:00:00Z     2026-05-12 10:00:00
#> 2 2026-05-12T18:30:00Z     2026-05-12 14:30:00
#> 3 2026-05-13T02:15:00Z     2026-05-12 22:15:00
```

**Difficulty:** Advanced
[HINTS]
Parse the UTC strings, then shift only the displayed timezone while keeping the underlying instant fixed.
Parse with `ymd_hms(utc_string, tz = "UTC")` and wrap it in `with_tz(..., "America/New_York")`.

```r title="Your turn"
events <- tibble(utc_string = c(
  "2026-05-12T14:00:00Z",
  "2026-05-12T18:30:00Z",
  "2026-05-13T02:15:00Z"
))
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- events |>
  mutate(local_ny = with_tz(ymd_hms(utc_string, tz = "UTC"), "America/New_York"))
ex_4_8
```

**Explanation:** `ymd_hms()` parses the timestamp and you must pass `tz = "UTC"` because the trailing "Z" is not auto-detected. `with_tz()` shifts the displayed timezone without changing the underlying instant; the moment in time is identical, only the wall-clock representation differs. Contrast with `force_tz()`, which RE-LABELS the timezone and produces a different instant; that is almost never what you want.

</details>

## Section 5. Iteration with purrr: map family and list-columns (8 problems)

### Exercise 5.1: Column-wise means of mtcars with map_dbl

**Task:** Compute the mean of every column of `mtcars` using `map_dbl()`. The result must be a named numeric vector (not a list, not a tibble), with one entry per column. Save to `ex_5_1` and verify it has length 11.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Difficulty:** Beginner
[HINTS]
Apply the averaging function to each column and force the combined output into a plain numeric vector.
Use `map_dbl(mtcars, mean)`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- map_dbl(mtcars, mean)
ex_5_1
```

**Explanation:** `map_dbl()` is the type-stable variant of `map()` that guarantees a double vector output; `map_chr()`, `map_int()`, `map_lgl()` work the same way. If any column produced a non-numeric result, `map_dbl()` would error rather than silently coerce; that strictness is the whole point. For mixed-result situations, fall back to `map()` (returns a list) and inspect element types before deciding the next verb.

</details>

### Exercise 5.2: Pair-wise add two vectors with map2

**Task:** Given two equal-length numeric vectors `a` and `b`, produce a new vector where each element is the sum of the corresponding pair, using `map2_dbl()`. Save the result to `ex_5_2`. This pattern generalises to any element-wise function more complex than `+`.

**Expected result:**

```
#> [1] 11 22 33 44
```

**Difficulty:** Beginner
[HINTS]
Walk both vectors in parallel, combining each matching pair of elements into one number.
Use `map2_dbl(a, b, \(x, y) x + y)`.

```r title="Your turn"
a <- c(1, 2, 3, 4)
b <- c(10, 20, 30, 40)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- map2_dbl(a, b, \(x, y) x + y)
ex_5_2
```

**Explanation:** `map2()` walks two parallel inputs simultaneously, passing one element from each to the function. The type-stable suffixes `_dbl`, `_int`, `_chr` apply here too. For element-wise addition specifically, plain vectorisation (`a + b`) is faster and more idiomatic. But for arbitrary two-argument functions that are NOT vectorised (e.g. fitting one model per parameter pair), `map2()` is the right tool.

</details>

### Exercise 5.3: Build a tibble of geometric series with pmap

**Task:** For each of three (start, ratio, n) triples, generate the geometric series of length `n` starting at `start` with multiplicative ratio `ratio`. Collect the three sequences as rows of a list-column `series` inside a tibble. Save to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   start ratio     n series
#>   <dbl> <dbl> <dbl> <list>
#> 1     1   2       4 <dbl [4]>
#> 2     5   1.5     3 <dbl [3]>
#> 3    10   0.5     5 <dbl [5]>
```

**Difficulty:** Advanced
[HINTS]
Iterate over several parameter columns together, producing one sequence per row stored inside a list-column.
In `mutate()`, use `pmap(list(start, ratio, n), ...)` with a lambda computing `start * ratio ^ (0:(n-1))`.

```r title="Your turn"
params <- tibble(
  start = c(1, 5, 10),
  ratio = c(2, 1.5, 0.5),
  n     = c(4, 3, 5)
)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- params |>
  mutate(series = pmap(list(start, ratio, n), \(start, ratio, n) start * ratio ^ (0:(n-1))))
ex_5_3
```

**Explanation:** `pmap()` takes a list of equal-length inputs and a function whose argument names match. By naming the lambda arguments `start`, `ratio`, `n`, the call reads like a row-wise function. Putting the result inside `mutate()` creates a list-column, which you can later `unnest_longer()` if you need one row per series element. `pmap` is the n-argument generalisation of `map2`; learn it once and you rarely need `mapply()`.

</details>

### Exercise 5.4: Fit a linear model per cylinder count and extract slope

**Task:** Group `mtcars` by `cyl`, fit a linear model `mpg ~ wt` within each group, and return a tibble with one row per cylinder value showing `cyl`, the model slope (`slope`), and the R-squared (`r2`). Save to `ex_5_4`. This is the canonical split-apply-combine modelling workflow.

**Expected result:**

```
#> # A tibble: 3 x 3
#>     cyl   slope    r2
#>   <dbl>   <dbl> <dbl>
#> 1     4  -5.65  0.713
#> 2     6  -2.78  0.465
#> 3     8  -2.19  0.423
```

**Difficulty:** Advanced
[HINTS]
Pack each cylinder group's rows, fit a model on each packed table, then pull out the numbers you need from every fit.
Use `group_by(cyl)` and `nest()`, then `map()` to fit `lm(mpg ~ wt, data = df)` and `map_dbl()` to extract `coef()` and `summary()$r.squared`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- as_tibble(mtcars) |>
  group_by(cyl) |>
  nest() |>
  mutate(
    model = map(data, \(df) lm(mpg ~ wt, data = df)),
    slope = map_dbl(model, \(m) coef(m)[["wt"]]),
    r2    = map_dbl(model, \(m) summary(m)$r.squared)
  ) |>
  select(cyl, slope, r2) |>
  ungroup()
ex_5_4
```

**Explanation:** The nest-model-extract pattern is the tidyverse alternative to `by()` and `dlply()`. Each step is independently testable: you can print `ex_5_4$model` to inspect individual fits. `broom::tidy(m)` is an even cleaner extractor if you want all coefficients with standard errors and p-values in long form; drop it in and `unnest()` to expand.

</details>

### Exercise 5.5: Keep only the named list elements that are numeric

**Task:** Given a heterogeneous list with character, numeric, logical, and tibble elements, filter it to keep only the numeric entries using `keep()`. Save the resulting (still a list) to `ex_5_5`. The element names must be preserved.

**Expected result:**

```
#> $a
#> [1] 1 2 3
#>
#> $c
#> [1] 4.5
```

**Difficulty:** Intermediate
[HINTS]
Retain only the list entries that pass a type test, leaving their names intact.
Use `keep(mixed, is.numeric)`.

```r title="Your turn"
mixed <- list(
  a = c(1,2,3),
  b = "hello",
  c = 4.5,
  d = TRUE,
  e = tibble(x = 1:2)
)
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- keep(mixed, is.numeric)
ex_5_5
```

**Explanation:** `keep()` retains elements for which the predicate returns `TRUE`; `discard()` is the inverse. The predicate can be a named function (`is.numeric`) or a lambda (`\(x) length(x) > 1`). Both verbs preserve list names, unlike `Filter()` in base R, which also works but has less consistent naming. For tibbles specifically, `select(where(is.numeric))` is the column-wise analogue.

</details>

### Exercise 5.6: Reduce a list of tibbles by left-joining them all

**Task:** Three small tibbles share a `customer_id` column and each adds a different attribute (`name`, `email`, `country`). Combine them into one wide tibble using `reduce()` plus `left_join()`. Save to `ex_5_6`. The result must have every column from every input.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   customer_id name  email             country
#>         <int> <chr> <chr>             <chr>
#> 1           1 Alice alice@example.com US
#> 2           2 Bob   bob@example.com   UK
#> 3           3 Cara  cara@example.com  IN
```

**Difficulty:** Advanced
[HINTS]
Merge an arbitrary number of tables by folding a join cumulatively across the whole list.
Use `reduce(left_join, by = "customer_id")` over the list of tibbles.

```r title="Your turn"
t_names    <- tibble(customer_id = 1:3, name = c("Alice","Bob","Cara"))
t_emails   <- tibble(customer_id = 1:3, email = c("alice@example.com","bob@example.com","cara@example.com"))
t_countries <- tibble(customer_id = 1:3, country = c("US","UK","IN"))
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- list(t_names, t_emails, t_countries) |>
  reduce(left_join, by = "customer_id")
ex_5_6
```

**Explanation:** `reduce()` applies a binary function cumulatively along a list: `f(f(t1, t2), t3)`. For joins, this is the cleanest way to merge an arbitrary number of tables without writing N-1 explicit `left_join()` calls. The first list element is the seed; each subsequent element gets joined in. `reduce()` is also the right verb for repeated `bind_rows()`, `intersect()`, `union()`, etc.

</details>

### Exercise 5.7: Safely apply log() and capture failures

**Task:** Apply `log()` to a mixed list `list(1, 100, -5, "oops")` using `safely()` so that the call NEVER errors. The result should be a list of three components, each with `result` and `error` slots; successes have `result` populated and `error` is `NULL`, failures vice versa. Save to `ex_5_7`.

**Expected result:**

```
#> [[1]]$result -> 0
#> [[2]]$result -> 4.6052
#> [[3]]$result -> NaN  ($error NULL, because log(-5) gives NaN with a warning, not error)
#> [[4]]$result -> NULL ($error -> non-numeric argument)
#> (exact structure: 4 entries, each a list of $result and $error)
```

**Difficulty:** Advanced
[HINTS]
Wrap the function so a bad input returns a captured error instead of halting the whole run.
Build a wrapped version with `safely(log)`, then apply it across the inputs with `map()`.

```r title="Your turn"
inputs <- list(1, 100, -5, "oops")
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_log <- safely(log)
ex_5_7 <- map(inputs, safe_log)
ex_5_7
```

**Explanation:** `safely()` is a function adverb: it wraps a function so the wrapped version never errors, returning a list of `result` and `error` instead. The companion `possibly()` returns a fallback value on error (simpler, less information). `quietly()` captures messages and warnings. For a production pipeline that must continue past bad rows, `safely() |> map()` plus a `transpose()` to pull out the two halves is the canonical pattern.

</details>

### Exercise 5.8: Walk a list to print each item with its position

**Task:** For each element of a list of three strings, print a line in the format "<i>: <element>" where `i` is the 1-based position. The function must return the input invisibly so the printing is the visible side effect, not the return value. Save the (invisibly returned) input to `ex_5_8`.

**Expected result:**

```
#> 1: apple
#> 2: banana
#> 3: cherry
#> ex_5_8 is the original input list, returned invisibly:
#> [[1]] "apple"
#> [[2]] "banana"
#> [[3]] "cherry"
```

**Difficulty:** Intermediate
[HINTS]
Run a printing side effect for each element together with its position, returning the input invisibly.
Use `iwalk()` with a lambda `\(x, i) cat(...)` that combines the index and the element.

```r title="Your turn"
fruits <- list("apple", "banana", "cherry")
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- iwalk(fruits, \(x, i) cat(i, ": ", x, "\n", sep = ""))
ex_5_8
```

**Explanation:** `walk()` is `map()`'s side-effect cousin: it runs the function for each element but returns the input invisibly, so it composes inside pipelines. `iwalk()` is the indexed variant that also passes the position (or name, if the list is named). Use `walk` for printing, logging, file writes, plot saving; anything where the function's job is the side effect, not the return value. Never use `map()` for side effects: you would build a list of `NULL`s for nothing.

</details>

## Section 6. Cross-package real workflows (8 problems)

### Exercise 6.1: Build a per-class fuel-efficiency leaderboard with mean and rank

**Task:** For each `class` in `mpg`, compute the mean `hwy` mileage, rank the classes from most to least efficient (1 = best), and report `class`, `mean_hwy` (rounded to 1 decimal), and `rank`. Save to `ex_6_1` so the procurement team can pick the top three classes.

**Expected result:**

```
#> # A tibble: 7 x 3
#>   class      mean_hwy  rank
#>   <chr>         <dbl> <int>
#> 1 compact        28.3     1
#> 2 subcompact     28.1     2
#> 3 midsize        27.3     3
#> ...
#> # 4 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
Average the mileage per class, order the classes by that average, then assign each a sequential position.
Use `group_by(class)`, `summarise(mean_hwy = round(mean(hwy), 1))`, `arrange(desc(mean_hwy))`, then `mutate(rank = row_number())`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = round(mean(hwy), 1), .groups = "drop") |>
  arrange(desc(mean_hwy)) |>
  mutate(rank = row_number())
ex_6_1
```

**Explanation:** `row_number()` inside an arranged frame assigns sequential integers, which is what you want for a 1-based rank. For dense ranks (ties share a rank but no gaps), use `dense_rank()`; for tied ranks (gaps after ties), use `min_rank()`. Choosing the right ranking function matters for presentations: `row_number()` breaks ties arbitrarily, which surprises users who see different orders on different runs.

</details>

### Exercise 6.2: Compute a three-period trailing mean within group

**Task:** For each `region` of inline quarterly sales (10 quarters per region), add a `ma3` column that is the trailing three-quarter mean of `revenue` within the region. The first two rows per region should be `NA` since there is not enough history. Save to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 20 x 4
#>   region quarter revenue   ma3
#>   <chr>    <int>   <dbl> <dbl>
#> 1 east         1     100  NA
#> 2 east         2     110  NA
#> 3 east         3     125  112
#> 4 east         4     140  125
#> 5 east         5     155  140
#> ...
#> # 15 more rows hidden
```

**Difficulty:** Advanced
[HINTS]
Within each region, average each value with the two values that immediately precede it.
Use `group_by(region)` then `mutate(ma3 = (revenue + lag(revenue) + lag(revenue, 2)) / 3)`.

```r title="Your turn"
qtr <- tibble(
  region  = rep(c("east","west"), each = 10),
  quarter = rep(1:10, times = 2),
  revenue = c(100,110,125,140,155,170,180,195,205,210, 150,170,190,210,220,230,245,260,275,290)
)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- qtr |>
  arrange(region, quarter) |>
  group_by(region) |>
  mutate(ma3 = (revenue + lag(revenue) + lag(revenue, 2)) / 3) |>
  ungroup()
ex_6_2
```

**Explanation:** A trailing 3-period mean is the simplest rolling statistic and can be expressed with two `lag()` calls; no rolling package needed. For longer windows (say 12 months), `slider::slide_dbl()` or `zoo::rollmean()` scale better. Grouping by region matters: without it, the lag would pull the last east values into the first west values, corrupting the boundary rows.

</details>

### Exercise 6.3: Build a data-quality flag report for diamonds

**Task:** Inspect the `diamonds` dataset for three known quality issues: zero values in `x`, `y`, or `z` (a physical impossibility for a diamond), and `depth` outside the sane range 55-75. Add three boolean flag columns (`flag_xyz_zero`, `flag_depth_oob`) plus an aggregate `flag_any`. Save flagged rows only (`flag_any` is TRUE) to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 28 x 13
#>   carat cut       color clarity depth table price     x     y     z flag_xyz_zero flag_depth_oob flag_any
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl> <lgl>         <lgl>          <lgl>
#> 1  1.07 Ideal     F     SI2      61.6    56  4954     0  6.62  0    TRUE          FALSE          TRUE
#> 2  1    Premium   H     SI2      59.2    61  3142  6.55     0  0    TRUE          FALSE          TRUE
#> ...
#> # 26 more rows hidden
```

**Difficulty:** Advanced
[HINTS]
Build a boolean column for each quality rule, combine them into an overall flag, then keep only the rows that tripped it.
In `mutate()`, create `flag_xyz_zero`, `flag_depth_oob`, and `flag_any`, then `filter(flag_any)`.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- diamonds |>
  mutate(
    flag_xyz_zero  = x == 0 | y == 0 | z == 0,
    flag_depth_oob = depth < 55 | depth > 75,
    flag_any       = flag_xyz_zero | flag_depth_oob
  ) |>
  filter(flag_any)
ex_6_3
```

**Explanation:** Layering individual flag columns BEFORE filtering is more useful than a single combined predicate: downstream consumers can audit which rule fired, and the same code generates both the report and the filtered set. For more than three rules, build a helper that returns a tibble of named flags, then `bind_cols()` them; that keeps the rule list as data rather than code and makes adding rules a one-line change.

</details>

### Exercise 6.4: Top three texas housing markets per year by median sale price

**Task:** Using the `txhousing` dataset (built into ggplot2), report the three cities with the highest annual median sale price for each year between 2010 and 2014 inclusive. Drop rows with missing `median` first. Save to `ex_6_4` so a relocation report can highlight premium markets per year.

**Expected result:**

```
#> # A tibble: 15 x 3
#>    year city          year_median
#>   <int> <chr>               <dbl>
#> 1  2010 Collin County      215000
#> 2  2010 Midland            155400
#> 3  2010 Austin             185000
#> ...
#> # 12 more rows hidden
```

**Difficulty:** Advanced
[HINTS]
After dropping missing prices, compute each city's annual median and keep only the top few cities within every year.
Use `filter(!is.na(median), year %in% 2010:2014)`, `group_by(year, city)`, `summarise(year_median = median(median), .groups = "drop_last")`, then `slice_max(year_median, n = 3, with_ties = FALSE)`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- txhousing |>
  filter(!is.na(median), year %in% 2010:2014) |>
  group_by(year, city) |>
  summarise(year_median = median(median), .groups = "drop_last") |>
  slice_max(year_median, n = 3, with_ties = FALSE) |>
  arrange(year, desc(year_median)) |>
  ungroup()
ex_6_4
```

**Explanation:** `.groups = "drop_last"` after `summarise()` keeps the `year` grouping but drops `city`, so the subsequent `slice_max()` operates per year as intended. `with_ties = FALSE` enforces exactly three rows per year by breaking ties arbitrarily; if you genuinely want all tied rows, leave it `TRUE` and accept variable group sizes. The `arrange()` at the end fixes within-year ordering after slicing.

</details>

### Exercise 6.5: Pivot wider with TWO value columns at once

**Task:** Given a long tibble of quarterly sales and units per region (4 rows per region, 3 regions), pivot to wide so each region is one row and both `sales` and `units` spread out: columns become `sales_Q1`, `units_Q1`, `sales_Q2`, etc. Save to `ex_6_5` for a one-page dashboard export.

**Expected result:**

```
#> # A tibble: 3 x 9
#>   region sales_Q1 units_Q1 sales_Q2 units_Q2 sales_Q3 units_Q3 sales_Q4 units_Q4
#>   <chr>     <dbl>    <dbl>    <dbl>    <dbl>    <dbl>    <dbl>    <dbl>    <dbl>
#> 1 east        100       10      110       12      125       14      140       16
#> 2 north        80        8       85        9       90       10       95       11
#> 3 west        150       18      170       20      190       22      210       25
```

**Difficulty:** Advanced
[HINTS]
Spread the data wide so each period contributes two columns, one for every metric you are tracking.
Use `pivot_wider(names_from = quarter, values_from = c(sales, units), names_glue = "{.value}_{quarter}")`.

```r title="Your turn"
long <- tibble(
  region  = rep(c("east","west","north"), each = 4),
  quarter = rep(c("Q1","Q2","Q3","Q4"), times = 3),
  sales   = c(100,110,125,140, 150,170,190,210, 80,85,90,95),
  units   = c(10,12,14,16, 18,20,22,25, 8,9,10,11)
)
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- long |>
  pivot_wider(
    names_from  = quarter,
    values_from = c(sales, units),
    names_glue  = "{.value}_{quarter}"
  )
ex_6_5
```

**Explanation:** Passing a vector to `values_from` tells `pivot_wider()` to produce multiple wide columns per key. The default naming is `sales_Q1`, `units_Q1`; already correct here, but `names_glue` lets you customise (e.g. `"{quarter}_{.value}"` for quarter-first). This is the cleanest way to ship a one-row-per-entity export with multiple metrics per period, avoiding two separate pivots followed by a join.

</details>

### Exercise 6.6: Per-species linear model with broom-tidied coefficients

**Task:** For each `Species` of `iris`, fit `Petal.Length ~ Sepal.Length` and return one row per (species, coefficient) pair from `broom::tidy()`. The output should have columns `Species`, `term`, `estimate`, `std.error`, `statistic`, `p.value`. Save to `ex_6_6`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>   Species    term         estimate std.error statistic p.value
#>   <fct>      <chr>           <dbl>     <dbl>     <dbl>   <dbl>
#> 1 setosa     (Intercept)     0.803     0.344      2.34  0.0238
#> 2 setosa     Sepal.Length    0.132     0.0685     1.92  0.0607
#> 3 versicolor (Intercept)    -0.0843    0.506     -0.166 0.869
#> ...
#> # 3 more rows hidden
```

**Difficulty:** Advanced
[HINTS]
Fit a model per species, then turn each fitted model into a tidy table of one row per coefficient.
Use `nest()`, `map()` to fit `lm(Petal.Length ~ Sepal.Length, ...)`, `map(model, broom::tidy)`, then `unnest()` the tidied column.

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_6 <- as_tibble(iris) |>
  group_by(Species) |>
  nest() |>
  mutate(
    model = map(data, \(df) lm(Petal.Length ~ Sepal.Length, data = df)),
    tidy  = map(model, broom::tidy)
  ) |>
  unnest(tidy) |>
  select(Species, term, estimate, std.error, statistic, p.value) |>
  ungroup()
ex_6_6
```

**Explanation:** `broom::tidy()` converts a fitted model into a tidy tibble of coefficients, standard errors, and p-values. Combining nest + map + tidy + unnest is the canonical pattern for grouped modelling and it scales smoothly from two species to two thousand. For predictions, swap `tidy()` for `broom::augment()`; for one-row model summaries (R-squared, F-statistic, deviance), `broom::glance()`. Three verbs, three views.

</details>

### Exercise 6.7: Cohort retention table by signup month

**Task:** Given an inline activity log of (customer_id, signup_month, active_month), build a retention table: rows are signup_month, columns are months-since-signup (0, 1, 2, 3), and cells are the count of customers active in that gap. Save to `ex_6_7`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   signup_month gap_0 gap_1 gap_2 gap_3
#>   <chr>        <int> <int> <int> <int>
#> 1 2026-01          3     2     2     1
#> 2 2026-02          2     2     1    NA
#> 3 2026-03          2     1    NA    NA
```

**Difficulty:** Advanced
[HINTS]
Work out how many months separate each active month from signup, count customers per gap, then spread the gaps across columns.
Parse months with `ym()`, derive `gap` from `year()` and `month()`, `count(signup_month, gap)`, then `pivot_wider(names_from = gap, values_from = n, names_prefix = "gap_")`.

```r title="Your turn"
activity <- tribble(
  ~customer_id, ~signup_month, ~active_month,
  1, "2026-01", "2026-01", 1, "2026-01", "2026-02", 1, "2026-01", "2026-03", 1, "2026-01", "2026-04",
  2, "2026-01", "2026-01", 2, "2026-01", "2026-02", 2, "2026-01", "2026-03",
  3, "2026-01", "2026-01",
  4, "2026-02", "2026-02", 4, "2026-02", "2026-03", 4, "2026-02", "2026-04",
  5, "2026-02", "2026-02", 5, "2026-02", "2026-03",
  6, "2026-03", "2026-03", 6, "2026-03", "2026-04",
  7, "2026-03", "2026-03"
)
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- activity |>
  mutate(
    su  = ym(signup_month),
    act = ym(active_month),
    gap = (year(act) - year(su)) * 12 + (month(act) - month(su))
  ) |>
  count(signup_month, gap) |>
  pivot_wider(names_from = gap, values_from = n, names_prefix = "gap_") |>
  arrange(signup_month)
ex_6_7
```

**Explanation:** Cohort tables are the canonical lubridate + tidyr exercise. `ym()` parses "YYYY-MM" strings to dates. The `gap` calculation handles year boundaries because subtracting months alone breaks at year-end. The `pivot_wider()` produces the report shape; cells without observations stay `NA`, which is correct because we have no evidence about months that have not occurred yet for the latest cohort.

</details>

### Exercise 6.8: RFM customer scoring on a transaction log

**Task:** Compute RFM (Recency in days, Frequency = count, Monetary = sum) per customer from an inline transaction log of three customers over April-May 2026. Recency is measured against an "as-of" date of 2026-05-12. Save the per-customer summary to `ex_6_8`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   customer_id recency frequency monetary
#>         <int>   <dbl>     <int>    <dbl>
#> 1           1       2         4      230
#> 2           2      12         2      130
#> 3           3       7         3      155
```

**Difficulty:** Advanced
[HINTS]
Summarise each customer into three numbers: how recently they bought, how many times, and how much in total.
Use `group_by(customer_id)` then `summarise()` with `as.numeric(as_of - max(tx_date))`, `n()`, and `sum(amount)`.

```r title="Your turn"
tx <- tribble(
  ~customer_id, ~tx_date,     ~amount,
  1, "2026-04-01", 50,
  1, "2026-04-15", 60,
  1, "2026-05-05", 70,
  1, "2026-05-10", 50,
  2, "2026-04-20", 80,
  2, "2026-04-30", 50,
  3, "2026-04-25", 55,
  3, "2026-05-01", 50,
  3, "2026-05-05", 50
)
ex_6_8 <- # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
as_of <- as.Date("2026-05-12")
ex_6_8 <- tx |>
  mutate(tx_date = as.Date(tx_date)) |>
  group_by(customer_id) |>
  summarise(
    recency   = as.numeric(as_of - max(tx_date)),
    frequency = n(),
    monetary  = sum(amount),
    .groups   = "drop"
  )
ex_6_8
```

**Explanation:** RFM is the foundational customer-segmentation feature set in marketing analytics. Recency uses `max(tx_date)` per customer because the most recent purchase defines how stale that customer is. Frequency is row count (`n()`), monetary is `sum(amount)`. In production, you would then `mutate(across(c(recency, frequency, monetary), ntile, n = 5))` to score each metric into quintiles and concatenate to a three-digit RFM code per customer.

</details>

## What to do next

- [dplyr Exercises in R](dplyr-Exercises-in-R.html) for focused practice on filter, mutate, summarise, joins, and window functions.
- [tidyr Exercises in R](tidyr-Exercises-in-R.html) for deeper drills on pivot, separate, nest, complete, and fill.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html) for cross-package data-cleaning problems that combine these verbs on messier inputs.
- [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) once you have a tidy result and want to plot it.
