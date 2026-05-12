---
title: "Tidyverse Exercises in R: 50 Real-World Practice Problems"
slug: "tidyverse-Exercises-in-R"
description: "Sharpen tidyverse skills with 50 cross-package practice problems spanning dplyr, tidyr, stringr, lubridate, and purrr on real workflows. Hidden solutions."
keywords: "tidyverse exercises, tidyverse practice, tidyverse exercises in R, learn tidyverse by example, tidyverse practice problems, dplyr tidyr exercises"
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

<p class="lead">Fifty cross-package practice problems spanning dplyr, tidyr, stringr, lubridate, and purrr. Each problem states the task, shows the expected result, and hides a fully worked solution with an explanation. The sweet spot is exercises that force you to pick the right verb from the right package and chain them on real data.</p>

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

**Task:** Use the `mpg` dataset from ggplot2 to keep only rows where `class` equals "compact" AND city mileage (`cty`) exceeds 25 miles per gallon. Retain every original column so a reviewer can inspect manufacturer, model, and transmission for each match. Save the filtered tibble to `ex_1_1`.

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

**Explanation:** Passing multiple conditions to `filter()` separated by commas is equivalent to combining them with `&` (logical AND). Using commas reads more naturally and is the idiomatic dplyr style. A common mistake is writing `class = "compact"` with a single equals sign, which is assignment and triggers an error. Use `==` for equality tests inside `filter()`.

</details>

### Exercise 1.2: Select diamond grading columns with tidyselect helpers

**Task:** From the `diamonds` dataset, build a tibble that keeps `price` first, then every column whose name starts with "c" (carat, cut, color, clarity). Use a tidyselect helper rather than naming columns one by one so the code keeps working if a new "c" column is added later. Save the result to `ex_1_2`.

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

**Explanation:** `starts_with()` is one of several tidyselect helpers (`ends_with()`, `contains()`, `matches()`, `where()`). Naming `price` first then `starts_with("c")` is how column reordering works inside `select()`: order in the call equals order in the output. Because `starts_with()` skips columns already listed by name, `price` does not get duplicated even if it had started with "c".

</details>

### Exercise 1.3: Sort diamonds by price descending then carat ascending

**Task:** Sort the `diamonds` data frame so the most expensive stones appear first, and within the same price, the smaller carat appears first. This is the order a pricing audit would want when scanning for unusual entries. Save the sorted tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 53,940 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.29 Premium   I     VS2      60.8    60 18823  8.5   8.47  5.16
#> 2  2    Very Good G     SI1      63.5    56 18818  7.9   7.97  5.04
#> 3  1.51 Ideal     G     IF       61.7    55 18806  7.37  7.41  4.56
#> ...
```

**Difficulty:** Beginner

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

**Explanation:** `arrange()` sorts ascending by default. Wrap an argument in `desc()` to flip the direction for that single column without affecting the others. The secondary sort by `carat` is only visible when ties exist on `price`, which is common at integer-rounded dollar values like 18820. A common mistake is `arrange(-price, carat)` for character columns: the negation works for numerics only.

</details>

### Exercise 1.4: Tag diamonds into price tiers with case_when

**Task:** A jeweller preparing a quarterly catalog wants every diamond labelled as "budget" (under 1000), "mid" (1000 to 4999), or "premium" (5000 and above). Add a `tier` column to `diamonds` using `case_when()` and save the augmented tibble to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 53,940 x 11
#>   carat cut       color clarity depth table price     x     y     z tier
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl> <chr>
#> 1  0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43 budget
#> 2  0.21 Premium   E     SI1      59.8    61   326  3.89  3.84  2.31 budget
#> 3  0.23 Good      E     VS1      56.9    65   327  4.05  4.07  2.31 budget
#> ...
#> # count by tier:
#> # budget  14524, mid 28966, premium 10450
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- diamonds |>
  # your code here
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

**Explanation:** `case_when()` evaluates conditions top to bottom and the first match wins, so the second branch only sees rows with `price >= 1000`. The closing `TRUE ~ "premium"` is the catch-all fallback. Without it, prices of 5000 and above would silently become `NA`. For ordered, mutually exclusive buckets this reads far cleaner than nested `if_else()` calls and scales gracefully when you add a fourth tier later.

</details>

### Exercise 1.5: Summarise diamonds with multiple statistics in one call

**Task:** Compute four summary statistics on the `diamonds` table in a single `summarise()` call: number of stones, mean price, median price, and price standard deviation. The reporting team wants all four numbers in one wide row for a daily inventory dashboard. Save the result to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>       n mean_price median_price sd_price
#>   <int>      <dbl>        <dbl>    <dbl>
#> 1 53940      3933.         2401     3989.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- diamonds |>
  summarise(
    n            = n(),
    mean_price   = mean(price),
    median_price = median(price),
    sd_price     = sd(price)
  )
ex_1_5
```

**Explanation:** `summarise()` collapses a tibble to one row when no grouping is set, and inside it `n()` returns the row count without needing a column reference. Aligning the equals signs is purely cosmetic but pays off when the team scans diffs. A common mistake is calling `summarise(mean(price))`: it works but the output column is named `mean(price)`, which is awkward to reference downstream.

</details>

### Exercise 1.6: Drop duplicate model rows keeping every column

**Task:** In `mpg`, several rows share the same manufacturer and model because the dataset captures multiple model years. Use `distinct()` to keep one row per (`manufacturer`, `model`) combination while preserving every other column from the first occurrence. Save the result to `ex_1_6`.

**Expected result:**

```
#> # A tibble: 38 x 11
#>   manufacturer model      displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>      <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 audi         a4           1.8  1999     4 auto(l5)   f        18    29 p     compact
#> 2 audi         a4 quattro   1.8  1999     4 manual(m5) 4        18    26 p     compact
#> ...
#> # 36 more rows hidden
```

**Difficulty:** Intermediate

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

**Explanation:** By default `distinct()` returns ONLY the columns you list, which is rarely what you want. Setting `.keep_all = TRUE` preserves the remaining columns by taking values from the first matching row of each group. If you need a specific row per group (most recent year, highest mpg), reach for `slice_max()` or `slice_min()` with a `.by` instead, because `distinct()` is non-deterministic about which "first" row it picks.

</details>

### Exercise 1.7: Find the top three priciest diamonds per cut grade

**Task:** A premium-jewellery retailer needs the three most expensive stones in each `cut` grade for the front-page showcase. Use `slice_max()` with `.by` to pull the top three rows per cut by `price`, breaking ties so you never end up with more than three per group. Save the result to `ex_1_7`.

**Expected result:**

```
#> # A tibble: 15 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.29 Premium   I     VS2      60.8    60 18823  8.5   8.47  5.16
#> 2  2.04 Premium   H     SI1      58.1    60 18795  8.37  8.28  4.84
#> 3  2    Premium   I     VS1      60.8    59 18795  8.13  8.02  4.91
#> 4  2    Very Good G     SI1      63.5    56 18818  7.9   7.97  5.04
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- diamonds |>
  slice_max(price, n = 3, by = cut, with_ties = FALSE)
ex_1_7
```

**Explanation:** The `.by` argument introduced in dplyr 1.1 performs per-group operations without needing `group_by()` followed by `ungroup()`. `with_ties = FALSE` is critical: at integer-rounded prices, two stones often tie and `slice_max()` would return more than `n` per group otherwise. The classic pre-1.1 idiom was `group_by(cut) |> slice_max(...) |> ungroup()` which still works but is wordier.

</details>

### Exercise 1.8: Rename and reorder columns for a finance report

**Task:** Take `economics` (a personal-finance time series in ggplot2) and rename `psavert` to `savings_rate`, `pce` to `consumer_spend`, and `uempmed` to `unemp_duration`. Then reorder columns so `date` comes first, the three renamed columns follow, and the rest trail behind. Save the result to `ex_1_8`.

**Expected result:**

```
#> # A tibble: 574 x 6
#>   date       savings_rate consumer_spend unemp_duration   pop unemploy
#>   <date>            <dbl>          <dbl>          <dbl> <dbl>    <dbl>
#> 1 1967-07-01         12.5           507.            4.5 198712     2944
#> 2 1967-08-01         12.5           510.            4.7 198911     2945
#> ...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- economics |>
  rename(
    savings_rate   = psavert,
    consumer_spend = pce,
    unemp_duration = uempmed
  ) |>
  select(date, savings_rate, consumer_spend, unemp_duration, everything())
ex_1_8
```

**Explanation:** Inside `rename()` and `select()` the syntax is `new_name = old_name`, which is the opposite direction from `mutate()`. The `everything()` helper inside `select()` is the cleanest way to "and keep all the remaining columns in their original order" without typing them out. If you swap the order of `rename()` and `select()` it still works because `select()` references the already-renamed columns.

</details>

### Exercise 1.9: Z-score every numeric column in mtcars

**Task:** A modelling team needs every numeric column of `mtcars` rescaled to z-scores (mean zero, unit standard deviation) so they can compare coefficients across predictors. Use `across()` to apply `scale()` to all numeric columns at once, dropping the matrix attribute scale returns. Save the standardized tibble to `ex_1_9`.

**Expected result:**

```
#> # A tibble: 32 x 11
#>     mpg     cyl    disp     hp   drat      wt    qsec     vs     am   gear   carb
#>   <dbl>   <dbl>   <dbl>  <dbl>  <dbl>   <dbl>   <dbl>  <dbl>  <dbl>  <dbl>  <dbl>
#> 1 0.151 -0.105  -0.571  -0.535  0.568 -0.610  -0.777  -0.868  1.19   0.424 0.735
#> 2 0.151 -0.105  -0.571  -0.535  0.568 -0.350  -0.464  -0.868  1.19   0.424 0.735
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_9 <- # your code here
ex_1_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_9 <- mtcars |>
  as_tibble() |>
  mutate(across(everything(), \(x) as.numeric(scale(x))))
ex_1_9
```

**Explanation:** `across()` is dplyr's "do this to many columns" tool. The anonymous function `\(x) as.numeric(scale(x))` strips the matrix attributes that `scale()` would otherwise attach. `everything()` works here because every column of `mtcars` is numeric: in mixed-type data use `where(is.numeric)` instead. Pre-`across()` code used `mutate_if()` or `mutate_all()`, which are now superseded.

</details>

## Section 2. Grouping, joining, set operations (9 problems)

### Exercise 2.1: Average highway mileage per vehicle class

**Task:** Group `mpg` by `class` and compute the mean highway mileage (`hwy`) and row count per group. Arrange the result so the most efficient class appears at the top, since that is the chart order a fuel-economy report needs. Save the summary to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 7 x 3
#>   class      mean_hwy     n
#>   <chr>         <dbl> <int>
#> 1 compact        28.3    47
#> 2 midsize        27.3    41
#> 3 subcompact     28.1    35
#> 4 minivan        22.4    11
#> 5 2seater        24.8     5
#> ...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mpg |>
  summarise(
    mean_hwy = mean(hwy),
    n        = n(),
    .by      = class
  ) |>
  arrange(desc(mean_hwy))
ex_2_1
```

**Explanation:** Using `.by` inside `summarise()` is the dplyr 1.1+ idiom that replaces `group_by() |> summarise() |> ungroup()`. The result is automatically ungrouped, which avoids a common bug where downstream operations behave unexpectedly because rows are still grouped. Sorting by the metric you care about is a small touch that makes the table immediately useful in a dashboard.

</details>

### Exercise 2.2: Percentage of diamonds in each cut quality

**Task:** A marketing analyst needs the share of total inventory each `cut` grade represents in `diamonds`, expressed as a percentage rounded to one decimal place. The output should have columns `cut`, `n`, and `pct`, sorted from most common cut to least common. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   cut           n   pct
#>   <ord>     <int> <dbl>
#> 1 Ideal     21551  40.0
#> 2 Premium   13791  25.6
#> 3 Very Good 12082  22.4
#> 4 Good       4906   9.1
#> 5 Fair       1610   3.0
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
  count(cut, sort = TRUE) |>
  mutate(pct = round(100 * n / sum(n), 1))
ex_2_2
```

**Explanation:** `count(x, sort = TRUE)` is shorthand for `group_by(x) |> summarise(n = n()) |> arrange(desc(n))`. The trick that catches people is that after `count()` the data is ungrouped, so `sum(n)` correctly returns the GRAND total, not a per-group total. If you wanted within-group shares (for example "pct of premium stones that are color D"), you would need an explicit `.by` on the `mutate()` call.

</details>

### Exercise 2.3: Inner-join orders to customers on customer_id

**Task:** A retail dataset has separate tibbles for customers and orders. Inner-join the two below on `customer_id` so the result contains only customers who placed at least one order, with both customer attributes and order amount on the same row. Save the joined tibble to `ex_2_3`.

```r title="Setup for 2.3, 2.4, 2.5"
customers <- tibble(
  customer_id = c(1, 2, 3, 4),
  name        = c("Ada", "Beau", "Cleo", "Dan"),
  city        = c("NYC", "SF", "LA", "Chicago")
)
orders <- tibble(
  customer_id = c(1, 1, 2, 5),
  order_id    = c(101, 102, 103, 104),
  amount      = c(50, 30, 80, 60)
)
```

**Expected result:**

```
#> # A tibble: 3 x 5
#>   customer_id name  city  order_id amount
#>         <dbl> <chr> <chr>    <dbl>  <dbl>
#> 1           1 Ada   NYC        101     50
#> 2           1 Ada   NYC        102     30
#> 3           2 Beau  SF         103     80
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- customers |>
  inner_join(orders, by = "customer_id")
ex_2_3
```

**Explanation:** Inner joins keep only rows that match on both sides. Ada has two orders so she appears twice, Cleo and Dan are dropped (no orders), and customer 5 is dropped (no customer record). Specifying `by = "customer_id"` is more readable than letting dplyr guess from common column names, and it gives a clearer error if a column gets renamed upstream.

</details>

### Exercise 2.4: Left-join customers with orders and fill missing amounts

**Task:** Left-join `customers` to `orders` from the previous setup so every customer appears in the result, including those without orders. Replace the resulting `NA` in `amount` with zero so a "lifetime spend" rollup later does not silently break. Save the cleaned tibble to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 5 x 5
#>   customer_id name  city    order_id amount
#>         <dbl> <chr> <chr>      <dbl>  <dbl>
#> 1           1 Ada   NYC          101     50
#> 2           1 Ada   NYC          102     30
#> 3           2 Beau  SF           103     80
#> 4           3 Cleo  LA            NA      0
#> 5           4 Dan   Chicago       NA      0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- customers |>
  left_join(orders, by = "customer_id") |>
  mutate(amount = replace_na(amount, 0))
ex_2_4
```

**Explanation:** A left join keeps every row from the left table and pads unmatched columns from the right table with `NA`. `replace_na()` from tidyr is the tidy idiom for setting a default value, and it is type-aware (it would refuse to put `"none"` into a numeric column). Leaving `order_id` as `NA` is fine because the downstream rollup sums `amount`, not `order_id`. If you needed both filled, pass a named list to `replace_na()`.

</details>

### Exercise 2.5: Anti-join to find orders without matching customers

**Task:** The data engineering team suspects some orders reference customer IDs that no longer exist in the customers table (likely due to a soft-delete bug). Use `anti_join()` on the setup tibbles to surface every `orders` row whose `customer_id` is missing from `customers`. Save the offending rows to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   customer_id order_id amount
#>         <dbl>    <dbl>  <dbl>
#> 1           5      104     60
```

**Difficulty:** Intermediate

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

**Explanation:** `anti_join()` keeps rows from the left table that have NO match on the right, and unlike a left join it does not add the right-side columns. It is the cleanest way to express "give me the orphans" in a data-quality check, and it scales to multi-column keys. The opposite, `semi_join()`, keeps rows that DO match without adding columns.

</details>

### Exercise 2.6: Semi-join to keep only iris rows of selected species

**Task:** Use `semi_join()` to keep only the rows of `iris` whose `Species` appears in a small lookup tibble `keep`. The point is to filter by membership without adding columns from the lookup. Save the filtered tibble to `ex_2_6`.

```r title="Setup for 2.6"
keep <- tibble(Species = c("setosa", "virginica"))
```

**Expected result:**

```
#> # A tibble: 100 x 5
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <fct>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> ...
#> # 98 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- iris |>
  as_tibble() |>
  semi_join(keep, by = "Species")
ex_2_6
```

**Explanation:** `semi_join()` is filter-by-lookup. It is preferable to `filter(Species %in% keep$Species)` when the lookup table itself has multiple key columns or comes from a database query, because it does not require you to enumerate the values inline. A subtle factor-vs-character mismatch on `Species` would not break the join because dplyr coerces compatibly, but it does warn in noisy modes.

</details>

### Exercise 2.7: Full-join two product price feeds and coalesce values

**Task:** Two vendor price feeds for the same SKU catalog occasionally disagree on which products they list. Full-join the two feeds below on `sku`, then collapse the two price columns into a single `price` taking vendor A's value when present, otherwise vendor B's. Save the consolidated tibble to `ex_2_7`.

```r title="Setup for 2.7"
feed_a <- tibble(sku = c("X1", "X2", "X3"), price_a = c(10, 15, NA))
feed_b <- tibble(sku = c("X2", "X3", "X4"), price_b = c(14, 22, 30))
```

**Expected result:**

```
#> # A tibble: 4 x 2
#>   sku   price
#>   <chr> <dbl>
#> 1 X1       10
#> 2 X2       15
#> 3 X3       22
#> 4 X4       30
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- feed_a |>
  full_join(feed_b, by = "sku") |>
  mutate(price = coalesce(price_a, price_b)) |>
  select(sku, price)
ex_2_7
```

**Explanation:** `full_join()` returns every key from either side, padding missing columns with `NA`. `coalesce()` walks arguments left to right and returns the first non-`NA` value, which is exactly the "prefer A, fall back to B" rule the business is asking for. Sku X3 demonstrates the fallback: A has `NA`, so B's 22 wins. For three or more feeds, `coalesce()` accepts an arbitrary number of arguments.

</details>

### Exercise 2.8: Stack quarterly tibbles with a source identifier

**Task:** Three quarterly sales extracts arrive as separate tibbles with identical schemas. Stack them into one long tibble using `bind_rows()` and add a `quarter` column that records which source each row came from. Save the combined tibble to `ex_2_8`.

```r title="Setup for 2.8"
q1 <- tibble(product = c("A", "B"), sales = c(100, 200))
q2 <- tibble(product = c("A", "B"), sales = c(110, 180))
q3 <- tibble(product = c("A", "B"), sales = c(130, 210))
```

**Expected result:**

```
#> # A tibble: 6 x 3
#>   quarter product sales
#>   <chr>   <chr>   <dbl>
#> 1 q1      A         100
#> 2 q1      B         200
#> 3 q2      A         110
#> 4 q2      B         180
#> 5 q3      A         130
#> 6 q3      B         210
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- bind_rows(q1 = q1, q2 = q2, q3 = q3, .id = "quarter") |>
  select(quarter, everything())
ex_2_8
```

**Explanation:** Passing named arguments plus `.id = "quarter"` makes `bind_rows()` produce a column tagging each row with the originating tibble's name. This pattern is invaluable when concatenating monthly or vendor exports because it preserves provenance for free. If the schemas differ, `bind_rows()` fills missing columns with `NA` rather than failing, which is usually what you want but can mask typos in column names.

</details>

### Exercise 2.9: Compute day-over-day price change with lag

**Task:** A trading desk wants the day-over-day absolute and percentage change in `Open` for the `EuStockMarkets` DAX series. Convert the time series to a tibble, then use `lag()` to access the previous row inside `mutate()` to compute both changes. Save the resulting tibble to `ex_2_9`.

**Expected result:**

```
#> # A tibble: 1,860 x 4
#>   day   open_dax abs_change pct_change
#>   <int>    <dbl>      <dbl>      <dbl>
#> 1     1    1629.      NA         NA
#> 2     2    1614.     -14.9      -0.916
#> 3     3    1607.      -7.4      -0.459
#> 4     4    1621.      14.3       0.890
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_9 <- # your code here
ex_2_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_9 <- as_tibble(EuStockMarkets) |>
  mutate(
    day        = row_number(),
    open_dax   = DAX,
    abs_change = open_dax - lag(open_dax),
    pct_change = 100 * abs_change / lag(open_dax)
  ) |>
  select(day, open_dax, abs_change, pct_change)
ex_2_9
```

**Explanation:** `lag(x)` shifts the column down by one row, so `x - lag(x)` is "today minus yesterday". The first row's change is `NA` because there is no yesterday: this is intentional and downstream `mean()` should set `na.rm = TRUE`. For per-group changes, pass `.by` to `mutate()` or use `lag(x, default = NA)`. A frequent bug is using `lag()` on an unsorted tibble: always `arrange()` first.

</details>

## Section 3. Reshape with tidyr: pivot, separate, nest (8 problems)

### Exercise 3.1: Pivot quarterly sales from wide to long

**Task:** A regional team receives sales as a wide table with columns Q1, Q2, Q3, Q4. Pivot to long format with columns `region`, `quarter`, and `sales` so the data can be grouped or charted. Save the long tibble to `ex_3_1`.

```r title="Setup for 3.1"
sales_wide <- tibble(
  region = c("North", "South", "East", "West"),
  Q1     = c(100, 120, 90, 110),
  Q2     = c(130, 150, 100, 140),
  Q3     = c(120, 140, 110, 130),
  Q4     = c(160, 170, 130, 150)
)
```

**Expected result:**

```
#> # A tibble: 16 x 3
#>   region quarter sales
#>   <chr>  <chr>   <dbl>
#> 1 North  Q1        100
#> 2 North  Q2        130
#> 3 North  Q3        120
#> 4 North  Q4        160
#> 5 South  Q1        120
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- sales_wide |>
  pivot_longer(
    cols      = Q1:Q4,
    names_to  = "quarter",
    values_to = "sales"
  )
ex_3_1
```

**Explanation:** `pivot_longer()` reshapes wide-to-long. `cols = Q1:Q4` is tidyselect syntax for a contiguous range, equivalent to `c(Q1, Q2, Q3, Q4)` or `starts_with("Q")`. Whatever was a column NAME becomes a value in the new `quarter` column, and whatever was a column VALUE moves into the new `sales` column. This shape is what most ggplot2 and dplyr verbs prefer.

</details>

### Exercise 3.2: Pivot the same data back to wide format

**Task:** Take the long tibble produced in the previous exercise (`ex_3_1`) and pivot it back to wide format with one row per region and one column per quarter. This is the shape an executive summary table usually wants. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 4 x 5
#>   region    Q1    Q2    Q3    Q4
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 East      90   100   110   130
#> 2 North    100   130   120   160
#> 3 South    120   150   140   170
#> 4 West     110   140   130   150
```

**Difficulty:** Intermediate

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

**Explanation:** `pivot_wider()` is the inverse of `pivot_longer()`. `names_from` says which column's values become the NEW column headers, and `values_from` says where the cells come from. A common gotcha is when the data has duplicate (`region`, `quarter`) combinations: `pivot_wider()` would silently put a list-column in there. To collapse duplicates first, group and summarise, then pivot.

</details>

### Exercise 3.3: Split a name column into first and last names

**Task:** Use `separate_wider_delim()` to split the `full_name` column on a single space into `first` and `last` columns. The HR team needs the split before importing names into a system that stores them in separate fields. Save the split tibble to `ex_3_3`.

```r title="Setup for 3.3"
people <- tibble(
  full_name = c("Ada Lovelace", "Alan Turing", "Grace Hopper"),
  role      = c("mathematician", "logician", "rear admiral")
)
```

**Expected result:**

```
#> # A tibble: 3 x 3
#>   first last     role
#>   <chr> <chr>    <chr>
#> 1 Ada   Lovelace mathematician
#> 2 Alan  Turing   logician
#> 3 Grace Hopper   rear admiral
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- people |>
  separate_wider_delim(
    cols  = full_name,
    delim = " ",
    names = c("first", "last")
  )
ex_3_3
```

**Explanation:** `separate_wider_delim()` is tidyr 1.3's modern replacement for the older `separate()`. It is stricter and louder by default, which is helpful: if a row had three space-separated tokens, it would error rather than silently truncate. The argument names (`cols`, `delim`, `names`) are deliberately verbose so the call reads almost like English. For multi-character delimiters use `delim = ", "` literally.

</details>

### Exercise 3.4: Parse a structured event code with separate_wider_regex

**Task:** Event identifiers in a logging pipeline follow the pattern `<region>-<year>-<seq>` where region is two uppercase letters, year is four digits, and seq is three digits. Use `separate_wider_regex()` to break the column into three typed parts. Save the parsed tibble to `ex_3_4`.

```r title="Setup for 3.4"
events <- tibble(
  event_id = c("US-2024-001", "EU-2025-042", "JP-2024-330")
)
```

**Expected result:**

```
#> # A tibble: 3 x 3
#>   region year  seq
#>   <chr>  <chr> <chr>
#> 1 US     2024  001
#> 2 EU     2025  042
#> 3 JP     2024  330
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- events |>
  separate_wider_regex(
    cols     = event_id,
    patterns = c(region = "[A-Z]{2}", "-", year = "\\d{4}", "-", seq = "\\d{3}")
  )
ex_3_4
```

**Explanation:** `separate_wider_regex()` (tidyr 1.3+) consumes a named-and-unnamed pattern vector: named entries become output columns, unnamed entries are literal separators consumed but discarded. This is more robust than `separate()` because it validates each piece against a pattern rather than just splitting on a delimiter. If you need numeric output, follow with `mutate(year = as.integer(year))` since separate functions always return character columns.

</details>

### Exercise 3.5: Nest mpg into one row per manufacturer

**Task:** Group `mpg` so each manufacturer collapses into a single row carrying a list-column called `data` that holds the full per-row detail for that manufacturer. This is the entry point to per-group modelling. Save the nested tibble to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 15 x 2
#>   manufacturer data
#>   <chr>        <list>
#> 1 audi         <tibble [18 x 10]>
#> 2 chevrolet    <tibble [19 x 10]>
#> 3 dodge        <tibble [37 x 10]>
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- mpg |>
  nest(data = -manufacturer)
ex_3_5
```

**Explanation:** `nest(data = -manufacturer)` reads "stash all columns except `manufacturer` into a list-column called `data`". The result has one row per unique manufacturer with a tibble inside. From here you can fit a model per manufacturer with `mutate(model = map(data, \(df) lm(hwy ~ cty, df)))`, which is the canonical purrr-meets-broom workflow you will see in Section 5.

</details>

### Exercise 3.6: Unnest a list-column back into long form

**Task:** Take the nested tibble `ex_3_5` from the previous exercise and unnest the `data` list-column so every original row reappears. This is how you go back to flat form after computing something per-group. Save the unnested tibble to `ex_3_6`.

**Expected result:**

```
#> # A tibble: 234 x 11
#>   manufacturer model      displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>      <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 audi         a4           1.8  1999     4 auto(l5)   f        18    29 p     compact
#> ...
#> # 233 more rows hidden
```

**Difficulty:** Intermediate

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

**Explanation:** `unnest(data)` expands each list element back into rows, reattaching the grouping column (`manufacturer`) on the left. The cycle nest -> per-group operation -> unnest is the tidyverse pattern for "do something complicated per group" when `summarise()` is not enough (for example, returning a model object or a multi-row prediction). If the nested tibbles have different schemas, `unnest()` will error unless you specify `names_repair`.

</details>

### Exercise 3.7: Complete missing day-product combinations with zero sales

**Task:** A daily sales tibble has rows only for products that sold that day, but the analytics team needs every (day, product) combination present, with missing rows filled with zero sales. Use `complete()` then `replace_na()` to fix the gaps. Save the completed tibble to `ex_3_7`.

```r title="Setup for 3.7"
sparse_sales <- tibble(
  day     = as.Date(c("2024-01-01", "2024-01-01", "2024-01-02", "2024-01-03")),
  product = c("A", "B", "A", "B"),
  units   = c(5, 3, 7, 2)
)
```

**Expected result:**

```
#> # A tibble: 6 x 3
#>   day        product units
#>   <date>     <chr>   <dbl>
#> 1 2024-01-01 A           5
#> 2 2024-01-01 B           3
#> 3 2024-01-02 A           7
#> 4 2024-01-02 B           0
#> 5 2024-01-03 A           0
#> 6 2024-01-03 B           2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- sparse_sales |>
  complete(day, product, fill = list(units = 0))
ex_3_7
```

**Explanation:** `complete()` builds the cartesian product of the named columns' unique values and ensures every combination has a row, inserting `NA` where the original did not. The `fill = list(units = 0)` argument lets you provide a default in the same call so you avoid an extra `mutate()`. This is the canonical fix when downstream code (a rolling sum, a chart) silently miscounts because zero-sales days are absent.

</details>

### Exercise 3.8: Forward-fill missing branch labels in a transaction log

**Task:** A transaction export has a `branch` column that is only filled on the row that opened a branch session; subsequent rows are `NA` until a new branch opens. Use `fill()` to propagate the branch downward so every row is labelled. Save the filled tibble to `ex_3_8`.

```r title="Setup for 3.8"
tx <- tibble(
  row_id = 1:6,
  branch = c("NYC", NA, NA, "SF", NA, "LA"),
  amount = c(50, 75, 20, 100, 60, 40)
)
```

**Expected result:**

```
#> # A tibble: 6 x 3
#>   row_id branch amount
#>    <int> <chr>   <dbl>
#> 1      1 NYC        50
#> 2      2 NYC        75
#> 3      3 NYC        20
#> 4      4 SF        100
#> 5      5 SF         60
#> 6      6 LA         40
```

**Difficulty:** Intermediate

```r title="Your turn"
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

**Explanation:** `fill()` propagates the last non-`NA` value forward (or backward with `.direction = "up"`) within a column. It is the tidy idiom for "carry last observation forward", which shows up constantly in time-stamped logs where only the change-of-state rows are written. If the very first row is `NA`, `down` cannot fill it; combine with `arrange()` or pre-pend a sentinel row if that case matters.

</details>

## Section 4. Strings and dates: stringr and lubridate (8 problems)

### Exercise 4.1: Keep mpg rows whose model name contains "audi"

**Task:** Use `str_detect()` inside `filter()` to keep `mpg` rows whose `manufacturer` column contains the substring "audi", case-insensitive. The output should retain all original columns. Save the filtered tibble to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 18 x 11
#>   manufacturer model      displ  year   cyl trans      drv     cty   hwy fl    class
#>   <chr>        <chr>      <dbl> <int> <int> <chr>      <chr> <int> <int> <chr> <chr>
#> 1 audi         a4           1.8  1999     4 auto(l5)   f        18    29 p     compact
#> ...
#> # 17 more rows hidden
```

**Difficulty:** Beginner

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

**Explanation:** `str_detect(x, pattern)` returns a logical vector the same length as `x`, which is exactly what `filter()` needs. Wrapping the pattern in `regex(..., ignore_case = TRUE)` is more explicit than `str_detect(..., negate = FALSE)` and pairs naturally with other regex options like `multiline` or `dotall`. A common mistake is `grepl("audi", manufacturer)`, which works but is base R and inconsistent with the rest of the pipe.

</details>

### Exercise 4.2: Strip leading zeros from a string ID column

**Task:** A legacy export pads numeric IDs with leading zeros ("00042"), but downstream systems expect bare digits ("42"). Use `str_replace()` with a regex anchored to the start of the string to remove the leading zeros without touching internal zeros. Save the cleaned tibble to `ex_4_2`.

```r title="Setup for 4.2"
ids <- tibble(raw = c("00042", "00100", "001000", "00009"))
```

**Expected result:**

```
#> # A tibble: 4 x 2
#>   raw    clean
#>   <chr>  <chr>
#> 1 00042  42
#> 2 00100  100
#> 3 001000 1000
#> 4 00009  9
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ids |>
  mutate(clean = str_replace(raw, "^0+", ""))
ex_4_2
```

**Explanation:** The `^` anchor matches only the start of the string, and `0+` matches one or more consecutive zeros. Together they say "leading zeros only", which is what protects the inner zeros in "100". Without the anchor, `str_replace_all()` would strip every zero. If a value could be the literal string "00000" you would end up with the empty string; handle that with `if_else(clean == "", "0", clean)` if zero is a valid ID.

</details>

### Exercise 4.3: Extract phone numbers from free-text contact notes

**Task:** Customer support notes contain phone numbers in the format `(XXX) XXX-XXXX` embedded in free text. Use `str_extract()` with a regex to pull the first occurrence into a `phone` column, returning `NA` when no phone is present. Save the augmented tibble to `ex_4_3`.

```r title="Setup for 4.3"
notes <- tibble(
  case_id = 1:4,
  note    = c(
    "Call back at (415) 555-2071 after 3pm",
    "Customer angry, no number provided",
    "Reach via (212) 555-0144 (mobile) or email",
    "Spoke with (510) 555-9999 today, all resolved"
  )
)
```

**Expected result:**

```
#> # A tibble: 4 x 3
#>   case_id note                                              phone
#>     <int> <chr>                                             <chr>
#> 1       1 Call back at (415) 555-2071 after 3pm             (415) 555-2071
#> 2       2 Customer angry, no number provided                NA
#> 3       3 Reach via (212) 555-0144 (mobile) or email        (212) 555-0144
#> 4       4 Spoke with (510) 555-9999 today, all resolved     (510) 555-9999
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- notes |>
  mutate(phone = str_extract(note, "\\(\\d{3}\\) \\d{3}-\\d{4}"))
ex_4_3
```

**Explanation:** Parentheses are special in regex (they group), so they must be escaped as `\\(` and `\\)`. `\\d{3}` is "exactly three digits". `str_extract()` returns the first match per element, or `NA` when no match exists, which is the desired behavior. If the format varied (some entries used dashes, others periods), you would broaden the pattern with `[ .-]?` between groups and validate downstream rather than trying to parse every variant inline.

</details>

### Exercise 4.4: Parse mixed-format date strings with lubridate

**Task:** A CSV import gave you date strings in `"YYYY-MM-DD"` form as character. Use `ymd()` from lubridate to parse them into proper Date objects so date arithmetic works. Save the tibble with the new `parsed` column to `ex_4_4`.

```r title="Setup for 4.4"
raw_dates <- tibble(d = c("2024-01-15", "2024-02-29", "2024-12-31"))
```

**Expected result:**

```
#> # A tibble: 3 x 2
#>   d          parsed
#>   <chr>      <date>
#> 1 2024-01-15 2024-01-15
#> 2 2024-02-29 2024-02-29
#> 3 2024-12-31 2024-12-31
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- raw_dates |>
  mutate(parsed = ymd(d))
ex_4_4
```

**Explanation:** lubridate's parsing helpers are named after the order of components in the input: `ymd()` for year-month-day, `mdy()` for the American month-day-year format, `dmy()` for the European order. They tolerate a wide variety of separators ("-", "/", "."). If the column had multiple formats mixed together, use `parse_date_time(x, orders = c("ymd", "mdy"))` instead and lubridate will guess each row separately.

</details>

### Exercise 4.5: Aggregate economics to monthly mean savings rate

**Task:** Floor every `date` in `economics` to the first of its month using `floor_date()`, then group by month and compute the mean `psavert`. This is the same shape an executive dashboard would chart as a monthly time series. Save the aggregated tibble to `ex_4_5`.

**Expected result:**

```
#> # A tibble: 574 x 2
#>   month      mean_savings
#>   <date>            <dbl>
#> 1 1967-07-01         12.5
#> 2 1967-08-01         12.5
#> 3 1967-09-01         11.7
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- economics |>
  mutate(month = floor_date(date, unit = "month")) |>
  summarise(mean_savings = mean(psavert), .by = month) |>
  arrange(month)
ex_4_5
```

**Explanation:** `floor_date(x, "month")` snaps every date back to the first of its month, which is the conventional anchor for monthly aggregations. The `economics` dataset already has monthly observations, so the group has only one row each: in higher-frequency data (daily, hourly) the same pattern collapses multiple rows. The mirror function is `ceiling_date()`, useful when the convention is "end of month".

</details>

### Exercise 4.6: Compute customer tenure in days

**Task:** For each customer below, compute the number of full days between `signup_date` and `first_purchase_date`. The growth team uses this "time-to-first-purchase" as a leading indicator of activation quality. Save the augmented tibble to `ex_4_6`.

```r title="Setup for 4.6"
cust <- tibble(
  customer_id         = 1:4,
  signup_date         = ymd(c("2024-01-01", "2024-02-15", "2024-03-20", "2024-04-10")),
  first_purchase_date = ymd(c("2024-01-05", "2024-02-20", "2024-04-01", "2024-04-10"))
)
```

**Expected result:**

```
#> # A tibble: 4 x 4
#>   customer_id signup_date first_purchase_date tenure_days
#>         <int> <date>      <date>                    <dbl>
#> 1           1 2024-01-01  2024-01-05                    4
#> 2           2 2024-02-15  2024-02-20                    5
#> 3           3 2024-03-20  2024-04-01                   12
#> 4           4 2024-04-10  2024-04-10                    0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- cust |>
  mutate(tenure_days = as.numeric(difftime(first_purchase_date, signup_date, units = "days")))
ex_4_6
```

**Explanation:** Subtracting two Date objects directly returns a `difftime` object whose units are not guaranteed (R picks based on magnitude). `difftime(..., units = "days")` forces the unit explicitly, and `as.numeric()` strips the `difftime` class so downstream code sees a plain numeric. The customer 4 row showing `0` confirms that same-day purchases are correctly handled as zero rather than `NA`.

</details>

### Exercise 4.7: Count tags in a semicolon-separated tag column

**Task:** A blog-post export stores tags as a single semicolon-separated string per row. Split each row's `tags` string on the separator, count the number of tags per post, and add it as a `tag_count` column. Save the augmented tibble to `ex_4_7`.

```r title="Setup for 4.7"
posts <- tibble(
  post_id = 1:4,
  tags    = c("r;tidyverse;dplyr", "python;pandas", "r", "r;ggplot2;visualization;dataviz")
)
```

**Expected result:**

```
#> # A tibble: 4 x 3
#>   post_id tags                              tag_count
#>     <int> <chr>                                 <int>
#> 1       1 r;tidyverse;dplyr                         3
#> 2       2 python;pandas                             2
#> 3       3 r                                         1
#> 4       4 r;ggplot2;visualization;dataviz           4
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_7 <- posts |>
  mutate(tag_count = map_int(str_split(tags, ";"), length))
ex_4_7
```

**Explanation:** `str_split(x, sep)` returns a LIST of character vectors, one per input element, because each row can have a different number of pieces. `map_int(..., length)` walks the list applying `length()` to each element, returning an integer vector aligned with the rows. An alternative one-liner is `str_count(tags, ";") + 1`, which counts separators and adds one, but it breaks on empty strings and is less explicit.

</details>

### Exercise 4.8: Convert UTC event timestamps to a local timezone

**Task:** A logging service writes event timestamps in UTC, but the on-call team in San Francisco wants them rendered in Pacific time for triage. Use `with_tz()` to convert the `ts_utc` column to `"America/Los_Angeles"`. Save the augmented tibble to `ex_4_8`.

```r title="Setup for 4.8"
events_log <- tibble(
  event_id = 1:3,
  ts_utc   = ymd_hms(c("2024-06-15 14:30:00", "2024-06-15 18:45:00", "2024-12-15 02:00:00"), tz = "UTC")
)
```

**Expected result:**

```
#> # A tibble: 3 x 3
#>   event_id ts_utc              ts_pt
#>      <int> <dttm>              <dttm>
#> 1        1 2024-06-15 14:30:00 2024-06-15 07:30:00
#> 2        2 2024-06-15 18:45:00 2024-06-15 11:45:00
#> 3        3 2024-12-15 02:00:00 2024-12-14 18:00:00
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- events_log |>
  mutate(ts_pt = with_tz(ts_utc, tzone = "America/Los_Angeles"))
ex_4_8
```

**Explanation:** `with_tz()` changes the timezone the timestamp is DISPLAYED in without altering the underlying instant in time. Its sibling `force_tz()` reinterprets the same wall-clock time as if it were in the new zone, which is almost never what you want for already-correct UTC data. Note row 3: in December, San Francisco is on Pacific Standard Time (UTC-8), so 02:00 UTC is 18:00 the previous day, which the result correctly shows.

</details>

## Section 5. Iteration with purrr: map family and list-columns (8 problems)

### Exercise 5.1: Column-wise means of mtcars with map_dbl

**Task:** Compute the mean of every column of `mtcars` using `map_dbl()` and return a named numeric vector. The point of `map_dbl()` over `sapply()` is type safety: you guarantee the output is double, not whatever shape the data happens to produce. Save the named vector to `ex_5_1`.

**Expected result:**

```
#>     mpg     cyl    disp      hp    drat      wt    qsec      vs      am    gear    carb
#> 20.0906  6.1875 230.722 146.688  3.5966  3.2173 17.8487  0.4375  0.4063  3.6875  2.8125
```

**Difficulty:** Intermediate

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

**Explanation:** A data frame is internally a list of columns, so `map_dbl()` walks each column and applies `mean()`, returning a named double vector. The "type-stable" `_dbl` suffix would error if any iteration returned a non-double, which is what you want in production. The `purrr` family also has `_int`, `_chr`, `_lgl`, and `_df` siblings for other return types. A common base-R parallel is `sapply()`, but its return type is unpredictable.

</details>

### Exercise 5.2: Pair-wise add two vectors with map2

**Task:** Given two equal-length numeric vectors `a` and `b`, compute the element-wise sum using `map2_dbl()` rather than R's native vectorization. The point is to practice the two-input map for cases where the operation is more complex than a single operator. Save the result vector to `ex_5_2`.

```r title="Setup for 5.2"
a <- c(1, 2, 3, 4)
b <- c(10, 20, 30, 40)
```

**Expected result:**

```
#> [1] 11 22 33 44
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- map2_dbl(a, b, \(x, y) x + y)
ex_5_2
```

**Explanation:** `map2(x, y, f)` walks two vectors in lockstep and calls `f(x_i, y_i)` per pair. For trivial sums, plain `a + b` is faster and more readable, but `map2_dbl()` shines when `f` is a non-vectorized function like a custom regression call that needs paired inputs. The anonymous function `\(x, y) x + y` is base-R 4.1+ syntax: pre-4.1 you would write `function(x, y) x + y` or `~ .x + .y` in purrr-lambda form.

</details>

### Exercise 5.3: Build a tibble of geometric series with pmap

**Task:** Generate a tibble of geometric series rows where each row has a starting value `a`, a ratio `r`, and the resulting third term `a * r * r`. Use `pmap_dbl()` so the row-wise arguments come straight from the tibble. Save the augmented tibble to `ex_5_3`.

```r title="Setup for 5.3"
params <- tibble(a = c(1, 2, 5, 10), r = c(2, 3, 0.5, 1.1))
```

**Expected result:**

```
#> # A tibble: 4 x 3
#>       a     r third_term
#>   <dbl> <dbl>      <dbl>
#> 1     1   2         4
#> 2     2   3        18
#> 3     5   0.5       1.25
#> 4    10   1.1      12.1
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- params |>
  mutate(third_term = pmap_dbl(list(a = a, r = r), \(a, r) a * r * r))
ex_5_3
```

**Explanation:** `pmap()` is the n-ary cousin of `map2()`. Its first argument is a list of equal-length vectors (or a data frame), and its function gets one argument per list element. The pattern `pmap_dbl(list(a = a, r = r), \(a, r) ...)` reads as "call this function once per row of these named columns". An even shorter idiom is `pmap_dbl(params, \(a, r, ...) a * r * r)`: the `...` swallows any extra columns the row may carry.

</details>

### Exercise 5.4: Fit a linear model per cylinder count and extract slope

**Task:** Group `mtcars` by `cyl`, then fit `mpg ~ wt` within each group and extract the slope coefficient. Use `nest()` to collapse to one row per cylinder count, `map()` to fit, and `map_dbl()` to pull the slope. Save the per-group slopes to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>     cyl  data              slope
#>   <dbl> <list>             <dbl>
#> 1     6 <tibble [7 x 10]>  -2.78
#> 2     4 <tibble [11 x 10]> -5.65
#> 3     8 <tibble [14 x 10]> -2.19
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- mtcars |>
  as_tibble() |>
  nest(data = -cyl) |>
  mutate(
    model = map(data, \(df) lm(mpg ~ wt, data = df)),
    slope = map_dbl(model, \(m) coef(m)[["wt"]])
  ) |>
  select(cyl, data, slope)
ex_5_4
```

**Explanation:** This is the canonical "many models" pattern: nest into list-columns, map a model-fit over the nested data, then map an extraction over the fitted objects. Storing the fitted models in their own column lets downstream code pull other quantities (intercept, R-squared, predictions) without re-fitting. For a tidy-formatted coefficient table, swap the slope step for `map(model, broom::tidy)` and `unnest()`.

</details>

### Exercise 5.5: Keep only the named list elements that are numeric

**Task:** Given a heterogeneous named list, use `keep()` to retain only the elements that pass `is.numeric()`. The data-engineering team uses this idiom to defensively filter a configuration list before passing it to a numeric-only function. Save the filtered list to `ex_5_5`.

```r title="Setup for 5.5"
config <- list(retries = 3, host = "api.example.com", timeout = 30, verbose = TRUE, batch = 100)
```

**Expected result:**

```
#> $retries
#> [1] 3
#>
#> $timeout
#> [1] 30
#>
#> $batch
#> [1] 100
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- keep(config, is.numeric)
ex_5_5
```

**Explanation:** `keep(.x, .p)` returns the elements of `.x` for which the predicate `.p` returns `TRUE`. Its mirror is `discard()`, which drops them. Note that `verbose = TRUE` is kept out because logical is not numeric. To include integers and doubles explicitly, you could pass an anonymous predicate `\(x) is.numeric(x) && !is.logical(x)` since base R sometimes treats logical as a numeric in arithmetic.

</details>

### Exercise 5.6: Reduce a list of tibbles by left-joining them all

**Task:** Given a list of three lookup tibbles all sharing the key `id`, combine them into a single tibble by repeatedly left-joining. Use `reduce()` so the code scales to any number of lookups without nested `left_join()` calls. Save the joined tibble to `ex_5_6`.

```r title="Setup for 5.6"
lookups <- list(
  tibble(id = 1:3, name  = c("Ada", "Beau", "Cleo")),
  tibble(id = 1:3, city  = c("NYC", "SF", "LA")),
  tibble(id = 1:3, score = c(91, 87, 95))
)
```

**Expected result:**

```
#> # A tibble: 3 x 4
#>      id name  city  score
#>   <int> <chr> <chr> <dbl>
#> 1     1 Ada   NYC      91
#> 2     2 Beau  SF       87
#> 3     3 Cleo  LA       95
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- reduce(lookups, left_join, by = "id")
ex_5_6
```

**Explanation:** `reduce(.x, .f)` applies a two-argument function across a list left-to-right: it starts with the first two elements, applies `.f`, then folds the result with the third element, and so on. Passing `left_join` (without parentheses) plus its named argument `by = "id"` produces "join all of these on id". This pattern generalizes to any associative two-argument operation: `+`, `intersect`, `bind_rows`.

</details>

### Exercise 5.7: Safely apply log() and capture failures

**Task:** Apply `log()` to a vector that includes a non-numeric value using `safely()` so the call does not abort the pipeline. The result should be a list with `result` and `error` slots per input. Save the wrapped output to `ex_5_7`.

```r title="Setup for 5.7"
xs <- list(2, 8, "oops", 16)
```

**Expected result:**

```
#> [[1]]$result
#> [1] 0.6931
#> [[2]]$result
#> [1] 2.0794
#> [[3]]$error
#> <simpleError in log(x): non-numeric argument to mathematical function>
#> [[4]]$result
#> [1] 2.7726
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_log <- safely(log)
ex_5_7  <- map(xs, safe_log)
ex_5_7
```

**Explanation:** `safely(f)` returns a NEW function that always succeeds: it returns a list with `result` (the value if `f` worked, `NULL` otherwise) and `error` (the condition if `f` failed, `NULL` otherwise). This is the standard purrr way to keep a pipeline running over a list of inputs where some may fail. Companion helpers are `possibly()` (substitute a default value on failure) and `quietly()` (capture warnings and messages too).

</details>

### Exercise 5.8: Walk a list to print each item with its position

**Task:** Use `walk2()` to iterate over a named character vector and print each element prefixed with its index. `walk*()` is the side-effect cousin of `map*()`: same iteration, but the return value is discarded and you get the input back invisibly. Save the input vector to `ex_5_8` after walking it.

```r title="Setup for 5.8"
titles <- c("intro" = "Hello", "body" = "World", "outro" = "Bye")
```

**Expected result:**

```
#> [intro] Hello
#> [body] World
#> [outro] Bye
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
walk2(names(titles), titles, \(nm, val) cat("[", nm, "] ", val, "\n", sep = ""))
ex_5_8 <- titles
ex_5_8
```

**Explanation:** `walk2()` runs the function for its side effect (printing here) without returning a list of `NULL`s like `map2()` would. This makes it appropriate for logging, writing files, or any "do X for each row" operation where the value is irrelevant. It returns the input invisibly so you can keep piping, which is why the third line `ex_5_8 <- titles` works without losing data.

</details>

## Section 6. Cross-package real workflows (8 problems)

### Exercise 6.1: Build a per-class fuel-efficiency leaderboard with mean and rank

**Task:** A consumer-vehicles report ranks each `class` in `mpg` by mean highway efficiency. Compute mean `hwy` per class, attach a rank (1 = best), keep classes with at least five vehicles in the dataset, and sort by rank. Save the leaderboard to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   class      mean_hwy     n  rank
#>   <chr>         <dbl> <int> <int>
#> 1 compact        28.3    47     1
#> 2 subcompact     28.1    35     2
#> 3 midsize        27.3    41     3
#> 4 minivan        22.4    11     4
#> 5 suv            18.1    62     5
#> 6 pickup         16.9    33     6
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- mpg |>
  summarise(
    mean_hwy = mean(hwy),
    n        = n(),
    .by      = class
  ) |>
  filter(n >= 5) |>
  arrange(desc(mean_hwy)) |>
  mutate(rank = row_number())
ex_6_1
```

**Explanation:** The order of operations matters: filter for "enough data" BEFORE ranking, otherwise a tiny class with one fluky data point could win the leaderboard. `row_number()` after `arrange(desc(mean_hwy))` assigns 1 to the top row and increments down. For dense ranks (where ties share a rank), use `dense_rank()`; for sparse ranks (where ties skip subsequent numbers), use `min_rank()`.

</details>

### Exercise 6.2: Compute a three-period trailing mean within group

**Task:** For each `chick` in `ChickWeight`, compute the trailing three-day mean of `weight` using `lag()`. The pediatric-research team uses smoothed weights to avoid noise from a single weighing. Save the augmented tibble to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 578 x 5
#>   Chick weight  Time Diet  trailing_mean
#>   <ord>  <dbl> <dbl> <fct>         <dbl>
#> 1 18        42     0 1                NA
#> 2 18        39     2 1                NA
#> 3 18        35.5   4 1                38.8
#> 4 16        41     0 1                NA
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- ChickWeight |>
  as_tibble() |>
  arrange(Chick, Time) |>
  mutate(
    trailing_mean = (weight + lag(weight, 1) + lag(weight, 2)) / 3,
    .by           = Chick
  )
ex_6_2
```

**Explanation:** Adding three `lag()` shifts (offset 0, 1, 2) and dividing by three is the simplest trailing-mean idiom that does not pull in another package. Always `arrange()` before any windowed call so `lag()` actually reaches yesterday and not just "the row above". The `.by = Chick` argument confines `lag()` within each chick so the first two observations of every chick are correctly `NA` rather than borrowing from a different bird.

</details>

### Exercise 6.3: Build a data-quality flag report for diamonds

**Task:** Scan `diamonds` for three quality flags: zero `x` (impossible width), `depth` outside the plausible 50 to 75 range, and `price` below 300 (suspiciously low). Build a summary tibble with one row per flag showing how many records trip it. Save the report to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   flag             n_records
#>   <chr>                <int>
#> 1 zero_width               8
#> 2 implausible_depth       16
#> 3 low_price                0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- diamonds |>
  summarise(
    zero_width         = sum(x == 0),
    implausible_depth  = sum(depth < 50 | depth > 75),
    low_price          = sum(price < 300)
  ) |>
  pivot_longer(everything(), names_to = "flag", values_to = "n_records")
ex_6_3
```

**Explanation:** Summing a logical vector counts the `TRUE`s because in R, `TRUE` coerces to `1`. Computing all three flags in one `summarise()` and then pivoting long produces a tidy report with one row per check. This shape is easy to share with stakeholders and easy to extend by adding another summary line plus the pivot will pick it up automatically.

</details>

### Exercise 6.4: Top three texas housing markets per year by median sale price

**Task:** From `txhousing` (a Texas housing time series in ggplot2), compute median monthly sale price per (year, city), then for each year keep the three cities with the highest median. Sort the result by year then median descending. Save to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 60 x 3
#>    year city               yearly_median
#>   <int> <chr>                      <dbl>
#> 1  2000 South Padre Island       180000
#> 2  2000 Collin County            172500
#> 3  2000 Bay Area                 144000
#> 4  2001 South Padre Island       190000
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- txhousing |>
  summarise(yearly_median = median(median, na.rm = TRUE), .by = c(year, city)) |>
  slice_max(yearly_median, n = 3, by = year, with_ties = FALSE) |>
  arrange(year, desc(yearly_median))
ex_6_4
```

**Explanation:** `summarise(.by = c(year, city))` groups by both columns in one shot, returning one row per (year, city). The second step uses `slice_max(.., by = year)` to keep the top three within each year. Passing `with_ties = FALSE` protects against years where two cities tie on the median, which would otherwise yield more than three rows for that year and break a fixed-width report.

</details>

### Exercise 6.5: Pivot wider with TWO value columns at once

**Task:** Given the long sales tibble below carrying both `revenue` and `units`, pivot wider so each quarter becomes TWO columns (one for revenue, one for units). The output should have one row per region. Save the wide tibble to `ex_6_5`.

```r title="Setup for 6.5"
long <- tibble(
  region  = rep(c("North", "South"), each = 4),
  quarter = rep(c("Q1", "Q2", "Q3", "Q4"), 2),
  revenue = c(100, 130, 120, 160, 120, 150, 140, 170),
  units   = c(10, 13, 12, 16, 12, 15, 14, 17)
)
```

**Expected result:**

```
#> # A tibble: 2 x 9
#>   region revenue_Q1 revenue_Q2 revenue_Q3 revenue_Q4 units_Q1 units_Q2 units_Q3 units_Q4
#>   <chr>       <dbl>      <dbl>      <dbl>      <dbl>    <dbl>    <dbl>    <dbl>    <dbl>
#> 1 North         100        130        120        160       10       13       12       16
#> 2 South         120        150        140        170       12       15       14       17
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- long |>
  pivot_wider(
    names_from   = quarter,
    values_from  = c(revenue, units)
  )
ex_6_5
```

**Explanation:** Passing a vector of columns to `values_from` produces a Cartesian product in the output column names: for each value column and each name level, you get one output column. The default separator is `_`. If you want the quarter to come first, pass `names_glue = "{quarter}_{.value}"`. This pattern is the cleanest way to produce "wide reports" without manually pivoting twice and joining.

</details>

### Exercise 6.6: Per-species linear model with broom-tidied coefficients

**Task:** For each species in `iris`, fit `Petal.Length ~ Sepal.Length` and produce a tidy coefficient table with columns `Species`, `term`, `estimate`, and `p.value`. Use `broom::tidy()` inside a nested mutate. Save the coefficient tibble to `ex_6_6`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   Species    term        estimate p.value
#>   <fct>      <chr>          <dbl>   <dbl>
#> 1 setosa     (Intercept)    0.803  0.0264
#> 2 setosa     Sepal.Length   0.131  0.0698
#> 3 versicolor (Intercept)    0.185  0.770
#> 4 versicolor Sepal.Length   0.686  1.27e-12
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_6 <- iris |>
  as_tibble() |>
  nest(data = -Species) |>
  mutate(
    model = map(data, \(df) lm(Petal.Length ~ Sepal.Length, data = df)),
    coefs = map(model, tidy)
  ) |>
  select(Species, coefs) |>
  unnest(coefs) |>
  select(Species, term, estimate, p.value)
ex_6_6
```

**Explanation:** `broom::tidy()` converts a fitted model into a tibble with one row per term and standardized column names (`estimate`, `std.error`, `statistic`, `p.value`). Combining it with `nest()` and `unnest()` is the canonical recipe for fitting many models and getting a long-format coefficient table out the other end. From there you can pivot or filter to answer "which species has the steepest relationship" type questions.

</details>

### Exercise 6.7: Cohort retention table by signup month

**Task:** Given a small activity log, build a cohort retention table: rows are signup months, columns are month-since-signup, cells are counts of distinct customers who were active in that period. Use `floor_date()`, `pivot_wider()`, and a `complete()` step to fill missing combinations with zero. Save the cohort table to `ex_6_7`.

```r title="Setup for 6.7"
activity <- tibble(
  customer_id   = c(1, 1, 1, 2, 2, 3, 3, 3, 3),
  signup_date   = ymd(c("2024-01-15", "2024-01-15", "2024-01-15",
                        "2024-01-20", "2024-01-20",
                        "2024-02-10", "2024-02-10", "2024-02-10", "2024-02-10")),
  activity_date = ymd(c("2024-01-15", "2024-02-05", "2024-03-10",
                        "2024-01-20", "2024-02-25",
                        "2024-02-10", "2024-02-22", "2024-03-15", "2024-04-02"))
)
```

**Expected result:**

```
#> # A tibble: 2 x 5
#>   cohort     month_0 month_1 month_2 month_3
#>   <date>       <int>   <int>   <int>   <int>
#> 1 2024-01-01       2       2       1       0
#> 2 2024-02-01       1       1       1       0
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_7 <- # your code here
ex_6_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- activity |>
  mutate(
    cohort       = floor_date(signup_date, "month"),
    period       = interval(floor_date(signup_date, "month"),
                            floor_date(activity_date, "month")) %/% months(1)
  ) |>
  summarise(n = n_distinct(customer_id), .by = c(cohort, period)) |>
  complete(cohort, period = 0:3, fill = list(n = 0)) |>
  mutate(period = paste0("month_", period)) |>
  pivot_wider(names_from = period, values_from = n)
ex_6_7
```

**Explanation:** Cohort retention requires three computational steps in sequence: derive the cohort anchor (signup month floored), derive the period offset (months between activity and signup), and count distinct customers per (cohort, period). The `complete()` call ensures the grid is rectangular so the wider step does not produce ragged columns. `interval(...) %/% months(1)` is lubridate's idiom for "how many whole months between these dates".

</details>

### Exercise 6.8: RFM customer scoring on a transaction log

**Task:** Compute classic Recency-Frequency-Monetary scores on the customer transaction log below. For each `customer_id`, compute recency (days since last purchase relative to a snapshot date), frequency (number of orders), and monetary (sum of amounts). Then assign 1-5 quintile scores to each metric so the marketing team can target segments. Save the scored tibble to `ex_6_8`.

```r title="Setup for 6.8"
set.seed(1)
tx_log <- tibble(
  customer_id = sample(1:20, 80, replace = TRUE),
  order_date  = sample(seq(ymd("2024-01-01"), ymd("2024-06-01"), by = "day"), 80, replace = TRUE),
  amount      = round(runif(80, 10, 500), 2)
)
snapshot <- ymd("2024-07-01")
```

**Expected result:**

```
#> # A tibble: 20 x 7
#>   customer_id recency_days frequency monetary r_score f_score m_score
#>         <int>        <dbl>     <int>    <dbl>   <int>   <int>   <int>
#> 1           1           18         6     1532.      5       4       4
#> 2           2           45         3      612.      3       2       2
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_8 <- # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_8 <- tx_log |>
  summarise(
    recency_days = as.numeric(snapshot - max(order_date)),
    frequency    = n(),
    monetary     = sum(amount),
    .by          = customer_id
  ) |>
  mutate(
    r_score = ntile(-recency_days, 5),
    f_score = ntile(frequency, 5),
    m_score = ntile(monetary, 5)
  ) |>
  arrange(customer_id)
ex_6_8
```

**Explanation:** RFM is the marketing-analytics workhorse for segmenting customers by behavior. The trick is that for RECENCY, smaller is better (a recent buyer is more valuable), so we pass `-recency_days` to `ntile()` to flip the sort order before quantile-binning. `ntile(x, 5)` chops `x` into five equal-sized buckets ranked 1 (lowest) through 5 (highest). Customers with `r_score = f_score = m_score = 5` are the marketing team's "champions" segment.

</details>

## What to do next

Now that you have these reps in muscle memory, deepen the pipeline by pulling on one strand at a time:

- [dplyr Exercises in R](dplyr-Exercises-in-R.html) drills the verbs in isolation with 50 more focused problems.
- [tidyr Exercises in R](tidyr-Exercises-in-R.html) goes deeper on reshaping and list-columns.
- [purrr Exercises in R](purrr-Exercises-in-R.html) focuses on functional iteration patterns at scale.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html) blends tidyverse and base R on messier datasets.
