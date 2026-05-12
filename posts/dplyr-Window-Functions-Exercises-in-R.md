---
title: "dplyr Window Functions Exercises in R: 25 Practice Problems"
slug: "dplyr-Window-Functions-Exercises-in-R"
description: "Twenty-five dplyr window function practice problems: lead, lag, cumsum, rank, ntile, first, last, cumall, cumany. Hidden solutions, runnable code."
keywords: "dplyr window functions exercises, lead lag R exercises, cumsum R practice, rank in R exercises, ntile R exercises, dplyr window practice"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "dplyr Window Functions Exercises"
sidebar_order: 122
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr window functions exercises|lead lag R exercises|cumsum R practice|rank in R exercises|ntile R practice"
auto_link_case_sensitive: false
target_keyword: "dplyr window functions exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dplyr Window Functions Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on dplyr window functions: lead and lag, cumulative operations, ranking, ntile bucketing, positional selectors, cumulative filters, and within-group windows. Each problem ships with a stated task, an expected result, and a hidden solution with an explanation. Built-in datasets only.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(ggplot2)
```

## Section 1. lead and lag offsets (5 problems)

### Exercise 1.1: Compute the previous value of a vector with lag

**Task:** Use `lag()` to add a column called `prev` containing the previous value of `x` for a small tibble built from `x = c(10, 12, 15, 14, 18)`. The first row's previous value should be `NA` because nothing precedes it. Save the resulting tibble to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>       x  prev
#>   <dbl> <dbl>
#> 1    10    NA
#> 2    12    10
#> 3    15    12
#> 4    14    15
#> 5    18    14
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- tibble(x = c(10, 12, 15, 14, 18)) |>
  # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- tibble(x = c(10, 12, 15, 14, 18)) |>
  mutate(prev = lag(x))
ex_1_1
#> # A tibble: 5 x 2
#>       x  prev
#>   <dbl> <dbl>
#> 1    10    NA
#> 2    12    10
#> 3    15    12
#> 4    14    15
#> 5    18    14
```

**Explanation:** `lag(x)` shifts the vector down by one position and pads the head with `NA` because the first row has no predecessor. The default offset is `n = 1` and you can override it (for example `lag(x, n = 2)` looks two rows back). Pair `lag()` with `mutate()` to create lookback columns on time ordered data; the boundary `NA` is intentional and lets downstream `is.na()` filters skip the first observation cleanly.

</details>

### Exercise 1.2: Peek at the next value with lead

**Task:** Use `lead()` to add a column called `nxt` containing the next value of `x` for the same tibble built from `x = c(10, 12, 15, 14, 18)`. The last row's next value should be `NA` because nothing follows it. Save the result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>       x   nxt
#>   <dbl> <dbl>
#> 1    10    12
#> 2    12    15
#> 3    15    14
#> 4    14    18
#> 5    18    NA
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- tibble(x = c(10, 12, 15, 14, 18)) |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- tibble(x = c(10, 12, 15, 14, 18)) |>
  mutate(nxt = lead(x))
ex_1_2
#> # A tibble: 5 x 2
#>       x   nxt
#>   <dbl> <dbl>
#> 1    10    12
#> 2    12    15
#> 3    15    14
#> 4    14    18
#> 5    18    NA
```

**Explanation:** `lead(x)` is the mirror image of `lag(x)`: it shifts the vector up by one position and pads the tail with `NA`. Use `lead()` when you need to compare a row with what comes next, for example to mark transitions like state changes, end of session, or upcoming spikes. Both functions accept a `default` argument that replaces the boundary `NA` with any sentinel value you prefer.

</details>

### Exercise 1.3: Day over day Temp change in airquality

**Task:** Compute the day over day change in `Temp` from the `airquality` dataset. Add a column `temp_change` defined as `Temp` minus `lag(Temp)`. Keep only `Month`, `Day`, `Temp`, and `temp_change`, then arrange by `Month` and `Day` so the lag respects time order. Save the result to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 153 x 4
#>   Month   Day  Temp temp_change
#>   <int> <int> <int>       <int>
#> 1     5     1    67          NA
#> 2     5     2    72           5
#> 3     5     3    74           2
#> 4     5     4    62         -12
#> 5     5     5    56          -6
#> ...
#> # 148 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- airquality |>
  arrange(Month, Day) |>
  # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- airquality |>
  arrange(Month, Day) |>
  mutate(temp_change = Temp - lag(Temp)) |>
  select(Month, Day, Temp, temp_change)
ex_1_3
#> # A tibble: 153 x 4
#>   Month   Day  Temp temp_change
#>   <int> <int> <int>       <int>
#> 1     5     1    67          NA
#> 2     5     2    72           5
#> 3     5     3    74           2
#> 4     5     4    62         -12
#> 5     5     5    56          -6
#> ...
#> # 148 more rows hidden
```

**Explanation:** `arrange()` before `lag()` is critical because lag respects row order, not date order. Subtracting `lag(Temp)` produces a delta whose sign reveals direction (positive for warming, negative for cooling). The first row is `NA` because there is no prior observation. This same pattern computes first differences for any time series before fitting AR models or stationarity tests.

</details>

### Exercise 1.4: Per chick weight gain between visits

**Task:** A nutrition researcher running a feed trial wants the weight gain a chick puts on between consecutive visits in the `ChickWeight` dataset. Group by `Chick`, arrange by `Time`, then add a `gain` column computed as `weight - lag(weight)`. Save the result to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 578 x 5
#> # Groups: Chick [50]
#>   weight  Time Chick Diet   gain
#>    <dbl> <dbl> <ord> <fct> <dbl>
#> 1     42     0 1     1        NA
#> 2     51     2 1     1         9
#> 3     59     4 1     1         8
#> 4     64     6 1     1         5
#> 5     76     8 1     1        12
#> ...
#> # 573 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- ChickWeight |>
  # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- ChickWeight |>
  group_by(Chick) |>
  arrange(Time, .by_group = TRUE) |>
  mutate(gain = weight - lag(weight))
ex_1_4
#> # A tibble: 578 x 5
#> # Groups: Chick [50]
#>   weight  Time Chick Diet   gain
#>    <dbl> <dbl> <ord> <fct> <dbl>
#> 1     42     0 1     1        NA
#> 2     51     2 1     1         9
#> 3     59     4 1     1         8
#> 4     64     6 1     1         5
#> ...
#> # 574 more rows hidden
```

**Explanation:** `group_by(Chick)` makes `lag()` respect chick boundaries so the lag at Time 0 of a new chick is `NA` instead of leaking the previous chick's last weight. `arrange(Time, .by_group = TRUE)` keeps within group ordering correct after the grouping is applied. This pattern is the backbone of longitudinal change scores and pre or post comparisons.

</details>

### Exercise 1.5: Week over week Ozone comparison

**Task:** Compare each day's `Ozone` reading in `airquality` with the reading from exactly seven days earlier. Arrange by `Month` then `Day`, then add a column `ozone_7day_lag` computed as `lag(Ozone, n = 7)`. Keep `Month`, `Day`, `Ozone`, and `ozone_7day_lag`. Save to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 153 x 4
#>   Month   Day Ozone ozone_7day_lag
#>   <int> <int> <int>          <int>
#> 1     5     1    41             NA
#> 2     5     2    36             NA
#> ...
#> 8     5     8    19             41
#> 9     5     9     8             36
#> ...
#> # 144 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- airquality |>
  arrange(Month, Day) |>
  # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- airquality |>
  arrange(Month, Day) |>
  mutate(ozone_7day_lag = lag(Ozone, n = 7)) |>
  select(Month, Day, Ozone, ozone_7day_lag)
ex_1_5
#> # A tibble: 153 x 4
#>   Month   Day Ozone ozone_7day_lag
#>   <int> <int> <int>          <int>
#> 1     5     1    41             NA
#> 2     5     2    36             NA
#> ...
#> 8     5     8    19             41
#> 9     5     9     8             36
#> ...
#> # 144 more rows hidden
```

**Explanation:** Passing `n = 7` to `lag()` shifts the vector down by seven positions, useful for week over week comparisons in daily data. The first seven rows become `NA` because there is no value seven days before them. For more flexible periods, prefer named arguments (`lag(x, n = 7, default = NA)`) so the intent is explicit and the boundary behavior is documented.

</details>

## Section 2. Cumulative operations (4 problems)

### Exercise 2.1: Running total with cumsum

**Task:** Compute the running total of a small daily series. Build a tibble with `daily = c(4, 7, 3, 8, 5)`, then add a `total` column using `cumsum(daily)` so each row holds the accumulated sum up to that point. Save the result to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   daily total
#>   <dbl> <dbl>
#> 1     4     4
#> 2     7    11
#> 3     3    14
#> 4     8    22
#> 5     5    27
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- tibble(daily = c(4, 7, 3, 8, 5)) |>
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- tibble(daily = c(4, 7, 3, 8, 5)) |>
  mutate(total = cumsum(daily))
ex_2_1
#> # A tibble: 5 x 2
#>   daily total
#>   <dbl> <dbl>
#> 1     4     4
#> 2     7    11
#> 3     3    14
#> 4     8    22
#> 5     5    27
```

**Explanation:** `cumsum()` returns a vector of the same length where each element is the running sum up to and including that index. The output's last value equals `sum(daily)`. Unlike `sum()`, `cumsum()` preserves row alignment so it slots into `mutate()` directly. Sister functions `cumprod()`, `cummax()`, `cummin()`, and `cummean()` follow the same shape contract.

</details>

### Exercise 2.2: Running unemployment total from economics

**Task:** An analyst tracking cumulative joblessness over the post war period wants a running total of monthly `unemploy` from the `economics` dataset. Add a `cum_unemp` column with `cumsum(unemploy)` and keep only `date`, `unemploy`, and `cum_unemp`. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 574 x 3
#>   date       unemploy cum_unemp
#>   <date>        <dbl>     <dbl>
#> 1 1967-07-01     2944      2944
#> 2 1967-08-01     2945      5889
#> 3 1967-09-01     2958      8847
#> 4 1967-10-01     3143     11990
#> 5 1967-11-01     3066     15056
#> ...
#> # 569 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- economics |>
  # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- economics |>
  mutate(cum_unemp = cumsum(unemploy)) |>
  select(date, unemploy, cum_unemp)
ex_2_2
#> # A tibble: 574 x 3
#>   date       unemploy cum_unemp
#>   <date>        <dbl>     <dbl>
#> 1 1967-07-01     2944      2944
#> 2 1967-08-01     2945      5889
#> 3 1967-09-01     2958      8847
#> ...
#> # 571 more rows hidden
```

**Explanation:** `economics` is already sorted by `date`, so `cumsum()` accumulates in calendar order without an explicit `arrange()`. When the underlying order is unknown, sort first. Cumulative totals are a building block for dashboards: divide `cum_unemp` by `cum_pop` for a running unemployment fraction, or take the period over period delta of the cumulative series to recover smoothed monthly flow.

</details>

### Exercise 2.3: Per manufacturer running max city mpg

**Task:** A fleet analyst comparing models within each `manufacturer` in `mpg` wants a running maximum of `cty` (city miles per gallon) as cars appear in row order. Group by manufacturer, then add a `running_max_cty` column with `cummax(cty)`. Save the augmented tibble to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 234 x 4
#> # Groups: manufacturer [15]
#>   manufacturer model   cty running_max_cty
#>   <chr>        <chr> <int>           <int>
#> 1 audi         a4       18              18
#> 2 audi         a4       21              21
#> 3 audi         a4       20              21
#> 4 audi         a4       21              21
#> 5 audi         a4       16              21
#> ...
#> # 229 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- mpg |>
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- mpg |>
  group_by(manufacturer) |>
  mutate(running_max_cty = cummax(cty)) |>
  select(manufacturer, model, cty, running_max_cty)
ex_2_3
#> # A tibble: 234 x 4
#> # Groups: manufacturer [15]
#>   manufacturer model   cty running_max_cty
#>   <chr>        <chr> <int>           <int>
#> 1 audi         a4       18              18
#> 2 audi         a4       21              21
#> 3 audi         a4       20              21
#> ...
#> # 231 more rows hidden
```

**Explanation:** `cummax()` returns a non decreasing vector where each element is the maximum seen so far. Combined with `group_by()`, the running max restarts at each manufacturer. This is a classic "best ever to date" idiom and shows up in finance (drawdown calculations) and sports (record scores by season). Switch to `cummin()` for the worst case mirror.

</details>

### Exercise 2.4: Monthly running mean of Temp

**Task:** Compute a within month running mean of `Temp` in `airquality` so the cumulative mean restarts at the first day of each month. Group by `Month`, arrange by `Day`, then add a `cum_mean_temp` column with `cummean(Temp)`. Save the result to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 153 x 4
#> # Groups: Month [5]
#>   Month   Day  Temp cum_mean_temp
#>   <int> <int> <int>         <dbl>
#> 1     5     1    67          67  
#> 2     5     2    72          69.5
#> 3     5     3    74          71  
#> 4     5     4    62          68.8
#> 5     5     5    56          66.2
#> ...
#> # 148 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- airquality |>
  group_by(Month) |>
  arrange(Day, .by_group = TRUE) |>
  # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- airquality |>
  group_by(Month) |>
  arrange(Day, .by_group = TRUE) |>
  mutate(cum_mean_temp = cummean(Temp)) |>
  select(Month, Day, Temp, cum_mean_temp)
ex_2_4
#> # A tibble: 153 x 4
#> # Groups: Month [5]
#>   Month   Day  Temp cum_mean_temp
#>   <int> <int> <int>         <dbl>
#> 1     5     1    67          67  
#> 2     5     2    72          69.5
#> 3     5     3    74          71  
#> ...
#> # 150 more rows hidden
```

**Explanation:** `cummean()` divides `cumsum(x)` by `seq_along(x)`, producing a smoothed view that gives early observations weight equal to later ones within the group. The grouped version restarts at each month boundary because window functions in dplyr respect group structure. Compare to a fixed lookback rolling mean (`zoo::rollmean`) when you need a constant window length instead of an expanding one.

</details>

## Section 3. Ranking functions (5 problems)

### Exercise 3.1: Rank mtcars rows by mpg

**Task:** Sort `mtcars` in descending order by `mpg` and add a `rank` column using `row_number()` so the most fuel efficient car receives rank 1. Convert row names into a `model` column first so the result reads cleanly. Keep only `model`, `mpg`, and `rank`, then save to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 32 x 3
#>   model              mpg  rank
#>   <chr>            <dbl> <int>
#> 1 Toyota Corolla    33.9     1
#> 2 Fiat 128          32.4     2
#> 3 Honda Civic       30.4     3
#> 4 Lotus Europa      30.4     4
#> 5 Fiat X1-9         27.3     5
#> ...
#> # 27 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- mtcars |>
  rownames_to_column("model") |>
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars |>
  rownames_to_column("model") |>
  arrange(desc(mpg)) |>
  mutate(rank = row_number()) |>
  select(model, mpg, rank)
ex_3_1
#> # A tibble: 32 x 3
#>   model              mpg  rank
#>   <chr>            <dbl> <int>
#> 1 Toyota Corolla    33.9     1
#> 2 Fiat 128          32.4     2
#> 3 Honda Civic       30.4     3
#> ...
#> # 29 more rows hidden
```

**Explanation:** `row_number()` always returns a unique integer for every row, breaking ties by row position. That makes it the right choice when you want a strict 1, 2, 3 ordering with no duplicates, for example to take the top N per group. For tie aware rankings, switch to `min_rank()` or `dense_rank()`. The two Honda Civic and Lotus Europa cars share 30.4 mpg but get distinct row numbers here.

</details>

### Exercise 3.2: Rank diamonds within each cut by price

**Task:** A jeweller compiling cut specific price guides wants `diamonds` ranked from cheapest to most expensive within each `cut`. Group by `cut`, then add a `price_rank` column with `min_rank(price)`. Keep `cut`, `price`, and `price_rank`, then arrange by `cut` and `price_rank`. Save to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 53,940 x 3
#> # Groups: cut [5]
#>   cut    price price_rank
#>   <ord>  <int>      <int>
#> 1 Fair     337          1
#> 2 Fair     345          2
#> 3 Fair     357          3
#> 4 Good     327          1
#> 5 Good     335          2
#> ...
#> # 53,935 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- diamonds |>
  # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- diamonds |>
  group_by(cut) |>
  mutate(price_rank = min_rank(price)) |>
  select(cut, price, price_rank) |>
  arrange(cut, price_rank)
ex_3_2
#> # A tibble: 53,940 x 3
#> # Groups: cut [5]
#>   cut    price price_rank
#>   <ord>  <int>      <int>
#> 1 Fair     337          1
#> 2 Fair     345          2
#> ...
#> # 53,938 more rows hidden
```

**Explanation:** `min_rank()` assigns tied values the same rank and leaves gaps after the tie, mimicking the ranking convention used in track and field. Combining it with `group_by(cut)` restarts the ranking at each cut, so a row's `price_rank` is its position inside its cut, not across the full dataset. Use `dense_rank()` when you would rather avoid gaps after ties.

</details>

### Exercise 3.3: Compare min_rank, dense_rank, and row_number on ties

**Task:** A code reviewer comparing the three rank flavors needs a tibble built from `x = c(10, 10, 12, 15, 15, 20)` with three columns called `min`, `dense`, and `row` showing `min_rank(x)`, `dense_rank(x)`, and `row_number(x)` respectively. Save the comparison tibble to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>       x   min dense   row
#>   <dbl> <int> <int> <int>
#> 1    10     1     1     1
#> 2    10     1     1     2
#> 3    12     3     2     3
#> 4    15     4     3     4
#> 5    15     4     3     5
#> 6    20     6     4     6
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- tibble(x = c(10, 10, 12, 15, 15, 20)) |>
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- tibble(x = c(10, 10, 12, 15, 15, 20)) |>
  mutate(
    min   = min_rank(x),
    dense = dense_rank(x),
    row   = row_number(x)
  )
ex_3_3
#> # A tibble: 6 x 4
#>       x   min dense   row
#>   <dbl> <int> <int> <int>
#> 1    10     1     1     1
#> 2    10     1     1     2
#> 3    12     3     2     3
#> 4    15     4     3     4
#> 5    15     4     3     5
#> 6    20     6     4     6
```

**Explanation:** The three functions only disagree at ties. `min_rank` shares the rank but leaves a gap (1, 1, 3). `dense_rank` shares the rank without gaps (1, 1, 2). `row_number` breaks ties by position so every row gets a unique integer. Pick `min_rank` for sports style rankings, `dense_rank` for cardinality preserving bins, and `row_number` when you need exactly one winner.

</details>

### Exercise 3.4: Percent rank diamonds prices

**Task:** Use `percent_rank(price)` on the full `diamonds` dataset to assign each diamond a 0 to 1 score reflecting its position in the sorted price distribution. Keep `price` and the new `pct_rank` column, then arrange ascending by `price`. Save to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 53,940 x 2
#>   price  pct_rank
#>   <int>     <dbl>
#> 1   326 0        
#> 2   326 0        
#> 3   327 0.0000371
#> 4   334 0.0000557
#> 5   335 0.0000742
#> ...
#> # 53,935 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- diamonds |>
  # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- diamonds |>
  mutate(pct_rank = percent_rank(price)) |>
  select(price, pct_rank) |>
  arrange(price)
ex_3_4
#> # A tibble: 53,940 x 2
#>   price  pct_rank
#>   <int>     <dbl>
#> 1   326 0        
#> 2   326 0        
#> ...
#> # 53,938 more rows hidden
```

**Explanation:** `percent_rank()` returns `(min_rank(x) - 1) / (n - 1)`, mapping the minimum value to 0 and the maximum to 1 exactly. The output is closed on both ends, unlike `cume_dist()` which is closed only on the upper end. Use percent ranks to compare distributions of different sizes side by side, or to derive a normalised score column that downstream features can consume.

</details>

### Exercise 3.5: Top 3 chicks per diet by final weight

**Task:** A trial coordinator preparing a feed efficacy report wants the top three chicks per `Diet` based on their weight at the final visit (`Time == 21`) in `ChickWeight`. Filter to that timepoint, group by Diet, rank descending by weight with `row_number()`, then keep ranks 1 through 3 in each diet. Save to `ex_3_5`.

**Expected result:**

```
#> # A tibble: 12 x 4
#> # Groups: Diet [4]
#>    Time weight Chick Diet 
#>   <dbl>  <dbl> <ord> <fct>
#> 1    21    305 7     1    
#> 2    21    303 5     1    
#> 3    21    275 4     1    
#> 4    21    331 22    2    
#> 5    21    295 17    2    
#> ...
#> # 7 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_5 <- ChickWeight |>
  filter(Time == 21) |>
  # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- ChickWeight |>
  filter(Time == 21) |>
  group_by(Diet) |>
  arrange(desc(weight), .by_group = TRUE) |>
  mutate(rank = row_number()) |>
  filter(rank <= 3) |>
  select(Time, weight, Chick, Diet)
ex_3_5
#> # A tibble: 12 x 4
#> # Groups: Diet [4]
#>    Time weight Chick Diet 
#>   <dbl>  <dbl> <ord> <fct>
#> 1    21    305 7     1    
#> ...
#> # 11 more rows hidden
```

**Explanation:** `row_number()` after `arrange(desc(weight))` produces a unique 1 through N ranking per group, so `rank <= 3` always yields exactly three rows even when weights tie. Compare with `min_rank(desc(weight)) <= 3`, which can return more than three rows when two chicks share third place. `slice_max(weight, n = 3, with_ties = FALSE)` is a shorter equivalent worth knowing.

</details>

## Section 4. ntile bucketing (3 problems)

### Exercise 4.1: Quartile buckets of city mpg

**Task:** Bucket `cty` (city miles per gallon) from the `mpg` dataset into four roughly equal sized quartiles using `ntile(cty, 4)`. Keep only `manufacturer`, `model`, `cty`, and the new `cty_quartile` column. Save the resulting tibble to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 234 x 4
#>   manufacturer model   cty cty_quartile
#>   <chr>        <chr> <int>        <int>
#> 1 audi         a4       18            2
#> 2 audi         a4       21            3
#> 3 audi         a4       20            3
#> 4 audi         a4       21            3
#> ...
#> # 230 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- mpg |>
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mpg |>
  mutate(cty_quartile = ntile(cty, 4)) |>
  select(manufacturer, model, cty, cty_quartile)
ex_4_1
#> # A tibble: 234 x 4
#>   manufacturer model   cty cty_quartile
#>   <chr>        <chr> <int>        <int>
#> 1 audi         a4       18            2
#> 2 audi         a4       21            3
#> ...
#> # 232 more rows hidden
```

**Explanation:** `ntile()` splits the input into `n` buckets of as equal size as possible by row count, not by value range. Two cars with the same `cty` may end up in different buckets when the bucket boundary cuts through tied values; this is a feature, not a bug, because it guarantees balanced bucket sizes. For value range buckets instead, use `cut()` from base R or `cut_number()` from ggplot2.

</details>

### Exercise 4.2: Decile diamond prices within each cut

**Task:** A pricing analyst wants per cut decile labels on `diamonds` so a stone in the top 10 percent of "Premium" is comparable to the top 10 percent of "Ideal". Group by `cut`, then add a `price_decile` column using `ntile(price, 10)` so each cut gets its own decile grid. Save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 53,940 x 4
#> # Groups: cut [5]
#>   carat cut       price price_decile
#>   <dbl> <ord>     <int>        <int>
#> 1  0.23 Ideal       326            1
#> 2  0.21 Premium     326            1
#> 3  0.23 Good        327            1
#> 4  0.29 Premium     334            1
#> ...
#> # 53,936 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- diamonds |>
  # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- diamonds |>
  group_by(cut) |>
  mutate(price_decile = ntile(price, 10)) |>
  select(carat, cut, price, price_decile)
ex_4_2
#> # A tibble: 53,940 x 4
#> # Groups: cut [5]
#>   carat cut       price price_decile
#>   <dbl> <ord>     <int>        <int>
#> 1  0.23 Ideal       326            1
#> ...
#> # 53,939 more rows hidden
```

**Explanation:** Grouping before `ntile()` restarts the decile count inside each cut, so decile 10 within "Fair" and decile 10 within "Ideal" describe different absolute prices. This relative bucketing is the right tool when cohorts differ in scale but you want comparable rank positions. Without `group_by()`, the deciles would mix all 53,940 stones into one global grid.

</details>

### Exercise 4.3: Compare ntile to cut_number for Temp deciles

**Task:** A statistician comparing two decile algorithms wants both `ntile(Temp, 10)` and `cut_number(Temp, 10)` applied to `airquality$Temp` in the same tibble. The first returns integer bucket IDs, the second returns factor intervals. Keep `Temp`, `ntile_bucket`, and `cut_number_bucket`, then save to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 153 x 3
#>    Temp ntile_bucket cut_number_bucket
#>   <int>        <int> <fct>            
#> 1    67            3 (65,68]          
#> 2    72            5 (71,74]          
#> 3    74            6 (71,74]          
#> 4    62            1 [56,67]          
#> ...
#> # 149 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- airquality |>
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- airquality |>
  mutate(
    ntile_bucket      = ntile(Temp, 10),
    cut_number_bucket = cut_number(Temp, 10)
  ) |>
  select(Temp, ntile_bucket, cut_number_bucket)
ex_4_3
#> # A tibble: 153 x 3
#>    Temp ntile_bucket cut_number_bucket
#>   <int>        <int> <fct>            
#> 1    67            3 (65,68]          
#> ...
#> # 152 more rows hidden
```

**Explanation:** `ntile()` returns integer IDs and aims for equal sized buckets even when that means splitting ties across buckets. `cut_number()` from ggplot2 returns factor intervals with explicit boundary labels, which makes the bucket meaning self documenting on plot axes. The two often disagree at tied values: the factor labels show identical intervals for the same value while `ntile` may place rows in adjacent integer buckets.

</details>

## Section 5. Positional selectors (4 problems)

### Exercise 5.1: First and last chick weight per Diet

**Task:** A study coordinator summarising chick growth wants, for each `Diet` in `ChickWeight`, the first and the last `weight` recorded across all chicks when sorted by `Time`. Group by Diet, arrange by Time, then summarise using `first(weight)` and `last(weight)` into columns called `first_w` and `last_w`. Save the result to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   Diet  first_w last_w
#>   <fct>   <dbl>  <dbl>
#> 1 1          42    205
#> 2 2          40    214
#> 3 3          39    270
#> 4 4          42    237
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- ChickWeight |>
  # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ChickWeight |>
  group_by(Diet) |>
  arrange(Time, .by_group = TRUE) |>
  summarise(
    first_w = first(weight),
    last_w  = last(weight)
  )
ex_5_1
#> # A tibble: 4 x 3
#>   Diet  first_w last_w
#>   <fct>   <dbl>  <dbl>
#> 1 1          42    205
#> 2 2          40    214
#> 3 3          39    270
#> 4 4          42    237
```

**Explanation:** `first()` and `last()` are alignment friendly versions of `head(x, 1)` and `tail(x, 1)`: they return a scalar even when the input is empty (giving the optional `default` instead of an error). Because they respect row order, `arrange()` before them is mandatory. Both also accept an `order_by` argument so you can specify the ordering inline without a separate `arrange()` step.

</details>

### Exercise 5.2: Third highest mpg with nth

**Task:** Use `nth()` on the `mtcars$mpg` column to extract the third highest mpg value in the dataset. Sort the vector with `sort(..., decreasing = TRUE)` first so position three corresponds to the third best, not the third row. The result should be a single number. Save it to `ex_5_2`.

**Expected result:**

```
#> [1] 30.4
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- mtcars$mpg |>
  # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- mtcars$mpg |>
  sort(decreasing = TRUE) |>
  nth(3)
ex_5_2
#> [1] 30.4
```

**Explanation:** `nth(x, n)` returns the n th element of `x` and falls back to a `default` argument when `n` is out of bounds, instead of throwing the cryptic subscript error you get from `x[n]`. Sorting beforehand is the cleanest way to express positional intent; alternatively, pass `order_by = -x` to fold sorting into `nth()` directly: `nth(mpg, 3, order_by = -mpg)`.

</details>

### Exercise 5.3: Each chick's heaviest visit time

**Task:** A researcher analysing growth trajectories wants, for each chick in `ChickWeight`, the `Time` at which that chick was heaviest. Group by `Chick`, then summarise with `Time[which.max(weight)]` into a column called `peak_time`. Save the result to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 50 x 2
#>   Chick peak_time
#>   <ord>     <dbl>
#> 1 18            2
#> 2 16            8
#> 3 15           12
#> 4 13           12
#> 5  9           21
#> ...
#> # 45 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- ChickWeight |>
  # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ChickWeight |>
  group_by(Chick) |>
  summarise(peak_time = Time[which.max(weight)])
ex_5_3
#> # A tibble: 50 x 2
#>   Chick peak_time
#>   <ord>     <dbl>
#> 1 18            2
#> 2 16            8
#> ...
#> # 48 more rows hidden
```

**Explanation:** `which.max()` returns the position of the first maximum, which combined with bracket indexing of `Time` recovers the value of any sibling column at the row of the peak. The dplyr equivalent using window functions is `slice_max(weight, n = 1, with_ties = FALSE)`, which keeps the full row instead of a single column and is the right call when you need more than one column from the peak observation.

</details>

### Exercise 5.4: First and last model alphabetically per manufacturer

**Task:** A catalog editor preparing a press kit needs, for each `manufacturer` in `mpg`, the first and last `model` name when models are sorted alphabetically. Group by manufacturer, arrange by model, then summarise with `first(model)` and `last(model)` into `first_model` and `last_model`. Save to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 15 x 3
#>   manufacturer first_model    last_model      
#>   <chr>        <chr>          <chr>           
#> 1 audi         a4             a6 quattro      
#> 2 chevrolet    c1500 suburban malibu          
#> 3 dodge        caravan 2wd    ram 1500 pickup 
#> 4 ford         expedition 2wd mustang         
#> ...
#> # 11 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- mpg |>
  # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- mpg |>
  group_by(manufacturer) |>
  arrange(model, .by_group = TRUE) |>
  summarise(
    first_model = first(model),
    last_model  = last(model)
  )
ex_5_4
#> # A tibble: 15 x 3
#>   manufacturer first_model    last_model      
#>   <chr>        <chr>          <chr>           
#> 1 audi         a4             a6 quattro      
#> ...
#> # 14 more rows hidden
```

**Explanation:** The same row may appear repeatedly in `mpg` because each model has several trim variants; `first()` and `last()` after `arrange(model)` therefore pick the alphabetic extremes of the unique models reduced to text. If you need the alphabetically first distinct model only (no duplicates), insert `distinct(model)` before the `summarise()`. The `.by_group = TRUE` argument ensures arrange respects group boundaries.

</details>

## Section 6. Cumulative filters (2 problems)

### Exercise 6.1: Leading run of windy days

**Task:** A flight ops planner wants to know how long the initial run of "windy" days lasts at the start of `airquality`, where windy is defined as `Wind > 7`. Add a column `windy_run` using `cumall(Wind > 7)` so the value stays `TRUE` while every preceding day was windy and flips to `FALSE` as soon as the first calm day appears. Keep `Day`, `Wind`, and `windy_run`. Save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 153 x 3
#>     Day  Wind windy_run
#>   <int> <dbl> <lgl>    
#> 1     1   7.4 TRUE     
#> 2     2   8   TRUE     
#> 3     3  12.6 TRUE     
#> 4     4  11.5 TRUE     
#> 5     5  14.3 TRUE     
#> 6     6  14.9 TRUE     
#> 7     7   8.6 TRUE     
#> 8     8  13.8 TRUE     
#> ...
#> # 145 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- airquality |>
  arrange(Month, Day) |>
  # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- airquality |>
  arrange(Month, Day) |>
  mutate(windy_run = cumall(Wind > 7)) |>
  select(Day, Wind, windy_run)
ex_6_1
#> # A tibble: 153 x 3
#>     Day  Wind windy_run
#>   <int> <dbl> <lgl>    
#> 1     1   7.4 TRUE     
#> 2     2   8   TRUE     
#> ...
#> # 151 more rows hidden
```

**Explanation:** `cumall(p)` is `TRUE` at position `i` if every earlier value of the predicate `p` was also `TRUE`; once `p` becomes `FALSE` for any prior row, the column locks at `FALSE` forever. The mirror function `cumall(! p)` flags the leading run where the predicate was never satisfied. Both are useful for early stopping logic such as "valid until the first error" or "still within SLA".

</details>

### Exercise 6.2: First fraud alert onwards with cumany

**Task:** A fraud team wants every transaction from the first triggered alert onwards flagged as "post incident". Given a small tibble with `alert = c(FALSE, FALSE, TRUE, FALSE, FALSE)`, add a column `post_incident` using `cumany(alert)` so the value flips to `TRUE` at the first `TRUE` and stays that way. Save the result to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   alert post_incident
#>   <lgl> <lgl>        
#> 1 FALSE FALSE        
#> 2 FALSE FALSE        
#> 3 TRUE  TRUE         
#> 4 FALSE TRUE         
#> 5 FALSE TRUE         
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- tibble(alert = c(FALSE, FALSE, TRUE, FALSE, FALSE)) |>
  # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- tibble(alert = c(FALSE, FALSE, TRUE, FALSE, FALSE)) |>
  mutate(post_incident = cumany(alert))
ex_6_2
#> # A tibble: 5 x 2
#>   alert post_incident
#>   <lgl> <lgl>        
#> 1 FALSE FALSE        
#> 2 FALSE FALSE        
#> 3 TRUE  TRUE         
#> 4 FALSE TRUE         
#> 5 FALSE TRUE         
```

**Explanation:** `cumany(p)` is the cumulative OR of a logical vector: once any earlier value is `TRUE`, the rest of the column is `TRUE`. This is the "sticky flag" idiom and is exactly what you need to mark rows as having entered some absorbing state (after first error, after first conversion, after first churn event). Pair it with `group_by(account_id)` to make the flag account scoped.

</details>

## Section 7. Within group windows (2 problems)

### Exercise 7.1: Weight as a multiple of starting weight per chick

**Task:** A growth biologist normalises chick weights to each animal's starting weight. For each `Chick` in `ChickWeight`, divide every `weight` by that chick's `first(weight)` after arranging by `Time`. Add a numeric multiplier column called `pct_of_start` so the first row of each group is exactly 1. Save the augmented tibble to `ex_7_1`.

**Expected result:**

```
#> # A tibble: 578 x 5
#> # Groups: Chick [50]
#>   weight  Time Chick Diet  pct_of_start
#>    <dbl> <dbl> <ord> <fct>        <dbl>
#> 1     42     0 1     1             1   
#> 2     51     2 1     1             1.21
#> 3     59     4 1     1             1.40
#> 4     64     6 1     1             1.52
#> ...
#> # 574 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_7_1 <- ChickWeight |>
  # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- ChickWeight |>
  group_by(Chick) |>
  arrange(Time, .by_group = TRUE) |>
  mutate(pct_of_start = weight / first(weight))
ex_7_1
#> # A tibble: 578 x 5
#> # Groups: Chick [50]
#>   weight  Time Chick Diet  pct_of_start
#>    <dbl> <dbl> <ord> <fct>        <dbl>
#> 1     42     0 1     1             1   
#> 2     51     2 1     1             1.21
#> ...
#> # 576 more rows hidden
```

**Explanation:** `first(weight)` inside `mutate()` after grouping returns the chick's earliest weight, recycled across that chick's rows. Dividing produces a normalised trajectory that lets you compare growth across animals with different birth weights on the same scale. This per subject normalisation is also called baseline scaling and is standard practice in longitudinal study reporting before fitting mixed effects models.

</details>

### Exercise 7.2: Mark new price highs per cut with cummax and lag

**Task:** A pricing analyst building a "new record" indicator wants, within each `cut` of `diamonds`, a flag marking every row whose `price` strictly exceeds the running max of all prior rows in that group. Group by `cut`, compute `prior_max` as `lag(cummax(price))`, then derive a logical `new_high` column. Save the augmented tibble to `ex_7_2`.

**Expected result:**

```
#> # A tibble: 53,940 x 4
#> # Groups: cut [5]
#>   cut       price prior_max new_high
#>   <ord>     <int>     <int> <lgl>   
#> 1 Ideal       326        NA NA      
#> 2 Premium     326        NA NA      
#> 3 Good        327        NA NA      
#> 4 Premium     334       326 TRUE    
#> ...
#> # 53,936 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_7_2 <- diamonds |>
  group_by(cut) |>
  # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_2 <- diamonds |>
  group_by(cut) |>
  mutate(
    prior_max = lag(cummax(price)),
    new_high  = price > prior_max
  ) |>
  select(cut, price, prior_max, new_high)
ex_7_2
#> # A tibble: 53,940 x 4
#> # Groups: cut [5]
#>   cut       price prior_max new_high
#>   <ord>     <int>     <int> <lgl>   
#> 1 Ideal       326        NA NA      
#> ...
#> # 53,939 more rows hidden
```

**Explanation:** `cummax(price)` gives the running maximum including the current row; `lag()` then shifts it down so each row is compared against the maximum seen strictly before it. Combining the two window functions creates a "high water mark" indicator without writing a loop. The first row of every group is `NA` for `prior_max`, which propagates to `new_high`; replace with `FALSE` using `coalesce(price > prior_max, FALSE)` if you need a strict logical column.

</details>

## What to do next

- [dplyr Joins Exercises in R](dplyr-Joins-Exercises-in-R.html): twenty five join problems covering inner, left, semi, and anti.
- [dplyr Group By Exercises in R](dplyr-Group-By-Exercises-in-R.html): grouped summaries, the `.by` shortcut, and aggregation patterns.
- [Data Wrangling With dplyr](Data-Wrangling-With-dplyr.html): full reference tutorial covering the core verbs end to end.
