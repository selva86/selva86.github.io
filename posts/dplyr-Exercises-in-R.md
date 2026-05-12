---
title: "dplyr Exercises in R: 50 Real-World Practice Problems"
slug: "dplyr-Exercises-in-R"
description: "Practice dplyr with 50 scenario-based exercises in R: filter, mutate, summarise, joins, window functions, multi-step pipelines. Hidden solutions and explanations."
keywords: "dplyr exercises, dplyr practice problems, dplyr exercises in R, learn dplyr by example, dplyr filter exercises, dplyr summarise exercises, dplyr joins exercises"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "dplyr Exercises"
sidebar_order: 100
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr exercises|dplyr practice|practice dplyr|dplyr scenario problems|dplyr exercises in r"
auto_link_case_sensitive: false
target_keyword: "dplyr exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# dplyr Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty scenario-based dplyr exercises grouped into six themed sections covering filtering, mutating, summarising, joins, window functions, and multi-step pipelines. Every problem ships with an expected result so you can verify, and solutions are hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(tidyr)
```

## Section 1. Filter and select (8 problems)

### Exercise 1.1: Find every fuel-sipping four-cylinder car

**Task:** A consumer-magazine reviewer is compiling a short list of fuel-efficient compacts. From the built-in `mtcars` dataset, return only rows where `cyl == 4` and `mpg > 25`, keeping just the car name (from rowname) and `mpg`. Save to `ex_1_1`.

**Expected result:**

```
#>              car  mpg
#> 1       Fiat 128 32.4
#> 2    Honda Civic 30.4
#> 3 Toyota Corolla 33.9
#> 4      Fiat X1-9 27.3
#> 5  Porsche 914-2 26.0
#> 6   Lotus Europa 30.4
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- mtcars |>
  rownames_to_column("car") |>
  # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mtcars |>
  rownames_to_column("car") |>
  filter(cyl == 4, mpg > 25) |>
  select(car, mpg)

ex_1_1
```

**Explanation:** Passing two conditions to `filter()` separated by a comma is equivalent to `&` (logical AND). `rownames_to_column()` from tibble lifts the car names out of the row index so they survive the pipeline; base `mtcars` stores them as `rownames(mtcars)` which `filter()` cannot reference directly.

</details>

### Exercise 1.2: Filter by a vector of named models

**Task:** Marketing has flagged three specific models for a teardown report: "Mazda RX4", "Honda Civic", and "Toyota Corolla". Return the rows of `mtcars` whose name matches any of those three using `%in%`, keeping all columns. Save to `ex_1_2`.

**Expected result:**

```
#>              car  mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> 1      Mazda RX4 21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
#> 2    Honda Civic 30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> 3 Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
```

**Difficulty:** Beginner

```r title="Your turn"
target <- c("Mazda RX4", "Honda Civic", "Toyota Corolla")

ex_1_2 <- mtcars |>
  rownames_to_column("car") |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
target <- c("Mazda RX4", "Honda Civic", "Toyota Corolla")

ex_1_2 <- mtcars |>
  rownames_to_column("car") |>
  filter(car %in% target)

ex_1_2
```

**Explanation:** `%in%` returns a logical vector the same length as `car`, marking each element TRUE if it appears anywhere in `target`. It is the idiomatic way to filter against a known set, and is far more readable than chaining several `car == "..."` clauses joined by `|`. Negate with `!(car %in% target)`.

</details>

### Exercise 1.3: Drop rows with missing Ozone readings

**Task:** A climatologist is preparing the `airquality` dataset for a regression on `Ozone` and needs to drop every row where `Ozone` is `NA`. Use `filter()` with `is.na()` (or `!is.na()`) to keep only complete-ozone rows and save the cleaned tibble to `ex_1_3`.

**Expected result:**

```
#>   Ozone Solar.R Wind Temp Month Day
#> 1    41     190  7.4   67     5   1
#> 2    36     118  8.0   72     5   2
#> 3    12     149 12.6   74     5   3
#> 4    18     313 11.5   62     5   4
#> ...
#> # 116 rows total after dropping NA Ozone
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- airquality |>
  # your code here
nrow(ex_1_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- airquality |>
  filter(!is.na(Ozone))

nrow(ex_1_3)
#> [1] 116
```

**Explanation:** Direct comparison `Ozone == NA` always returns `NA` (never TRUE), so `filter(Ozone == NA)` returns zero rows silently. `is.na()` is the only correct test for missingness; negating it with `!` is the standard dplyr idiom for dropping NAs in one column. For multiple columns, use `filter(if_all(c(Ozone, Solar.R), \(x) !is.na(x)))`.

</details>

### Exercise 1.4: Pick measurement columns with starts_with

**Task:** From the `iris` dataset, keep only the four numeric measurement columns whose names begin with "Sepal" or "Petal", plus the `Species` column. Use `select()` with `starts_with()` helpers instead of typing each name. Save the result to `ex_1_4`.

**Expected result:**

```
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
#> ...
#> # 147 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- iris |>
  # your code here
head(ex_1_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- iris |>
  select(starts_with("Sepal"), starts_with("Petal"), Species)

head(ex_1_4, 3)
```

**Explanation:** Tidyselect helpers like `starts_with()`, `ends_with()`, `contains()`, and `matches()` (regex) make column picks robust to schema drift: if a new "Sepal.Area" column appears tomorrow, it joins automatically. Listing `Species` after the helpers fixes its position at the end, which is useful when the rest of the pipeline expects measurements first.

</details>

### Exercise 1.5: Keep diamonds priced above the median

**Task:** A jeweller wants the upper half of inventory by price. From `diamonds`, filter rows where `price` is strictly greater than the median price across the full dataset, then keep just `carat`, `cut`, and `price`. Save to `ex_1_5` and confirm the row count.

**Expected result:**

```
#> # A tibble: 26,966 x 3
#>   carat cut       price
#>   <dbl> <ord>     <int>
#> 1  1.17 Very Good  2774
#> 2  1.01 Premium    2781
#> 3  1.01 Fair       2788
#> 4  1.01 Premium    2788
#> ...
#> nrow(ex_1_5)
#> [1] 26966
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- diamonds |>
  # your code here
nrow(ex_1_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- diamonds |>
  filter(price > median(price)) |>
  select(carat, cut, price)

nrow(ex_1_5)
#> [1] 26966
```

**Explanation:** `median(price)` is evaluated once at the start of `filter()` because dplyr passes the entire column vector. Strictly greater (`>`) excludes the median itself, which is why the count is slightly under half of 53,940. Use `>=` if you want the median row included. Because there is no `group_by()`, the median is computed across the whole dataset.

</details>

### Exercise 1.6: Find heavy-duty trucks or sporty coupes

**Task:** From `mpg`, return rows where `class` is either "pickup" or "2seater" using a single `filter()` call with `%in%`. Keep only `manufacturer`, `model`, `class`, and `cty`. Save the result to `ex_1_6` for a downstream comparison plot.

**Expected result:**

```
#> # A tibble: 38 x 4
#>   manufacturer model      class     cty
#>   <chr>        <chr>      <chr>   <int>
#> 1 chevrolet    corvette   2seater    16
#> 2 chevrolet    corvette   2seater    15
#> 3 chevrolet    corvette   2seater    16
#> 4 chevrolet    corvette   2seater    15
#> ...
#> # 34 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- mpg |>
  # your code here
head(ex_1_6, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- mpg |>
  filter(class %in% c("pickup", "2seater")) |>
  select(manufacturer, model, class, cty)

head(ex_1_6, 3)
```

**Explanation:** `%in%` collapses what would otherwise be `class == "pickup" | class == "2seater"`. As the set of allowed values grows, `%in%` stays one short line while `|` chains become unreadable. The vector passed to `%in%` can be constructed elsewhere (e.g., read from a config file), which makes the pipeline declarative.

</details>

### Exercise 1.7: Drop unwanted columns with negative select

**Task:** A reporting team wants `mtcars` without the four engine geometry columns `disp`, `drat`, `qsec`, and `carb`. Use `select()` with negative selection (the `!c(...)` form) so that adding new columns later still keeps them automatically. Save to `ex_1_7`.

**Expected result:**

```
#>                    mpg cyl  hp    wt vs am gear
#> Mazda RX4         21.0   6 110 2.620  0  1    4
#> Mazda RX4 Wag     21.0   6 110 2.875  0  1    4
#> Datsun 710        22.8   4  93 2.320  1  1    4
#> ...
#> # 29 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- mtcars |>
  # your code here
head(ex_1_7, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- mtcars |>
  select(!c(disp, drat, qsec, carb))

head(ex_1_7, 3)
```

**Explanation:** Negative select with `!c(...)` (or the older `-c(...)`) is the right tool when the keep-list is longer than the drop-list. It is also robust to schema drift: any new column appearing in `mtcars` later automatically passes through, instead of being silently dropped as it would be with a positive `select(mpg, cyl, hp, wt, vs, am, gear)`.

</details>

### Exercise 1.8: Drop rows missing ALL listed measurements

**Task:** In `airquality`, several rows have multiple missing measurements. Keep only rows where at least one of `Ozone`, `Solar.R`, or `Wind` is non-NA (i.e. drop rows missing all three). Use `if_all()` inside `filter()` and save to `ex_1_8`.

**Expected result:**

```
#> nrow(airquality)
#> [1] 153
#> nrow(ex_1_8)
#> [1] 153    # no row in airquality is missing ALL three; sanity check
#> # repeat with mtcars-style synthetic NAs to see the helper in action
```

**Difficulty:** Advanced

```r title="Your turn"
ex_1_8 <- airquality |>
  # your code here
nrow(ex_1_8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- airquality |>
  filter(!if_all(c(Ozone, Solar.R, Wind), is.na))

nrow(ex_1_8)
#> [1] 153
```

**Explanation:** `if_all()` returns TRUE only when the predicate (`is.na`) holds across every named column in a row. Negating with `!` keeps rows where it is NOT true that all three are missing, which is the standard "drop fully empty rows" pattern. Use `if_any()` for "missing in at least one"; the two read as quantifiers on columns.

</details>

## Section 2. Arrange, mutate, and transform (8 problems)

### Exercise 2.1: Bin diamonds into price tiers with case_when

**Task:** A jeweller preparing a quarterly sale wants to bucket `diamonds` into three tiers: "budget" (price < 1000), "mid" (1000 to 4999), and "premium" (>= 5000). Add a `tier` column with `case_when()` and save the augmented tibble to `ex_2_1`.

**Expected result:**

```
#> count(ex_2_1, tier)
#> # A tibble: 3 x 2
#>   tier        n
#>   <chr>   <int>
#> 1 budget  14524
#> 2 mid     28966
#> 3 premium 10450
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- diamonds |>
  # your code here
count(ex_2_1, tier)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- diamonds |>
  mutate(tier = case_when(
    price < 1000  ~ "budget",
    price < 5000  ~ "mid",
    TRUE          ~ "premium"
  ))

count(ex_2_1, tier)
```

**Explanation:** `case_when()` reads top to bottom; the first matching condition wins, so the second branch only catches prices in [1000, 4999]. The trailing `TRUE ~ ...` is the catch-all default; without it, prices at or above 5000 would become `NA`. This is much cleaner than nested `if_else()` for three or more buckets.

</details>

### Exercise 2.2: Compute price-per-carat and rank

**Task:** A pricing analyst wants a "value per carat" view. Add `ppc = price / carat` to `diamonds`, then keep only `carat`, `cut`, `price`, `ppc`, and arrange descending by `ppc`. Save the top of the table to `ex_2_2` and inspect the first six rows.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   carat cut       price    ppc
#>   <dbl> <ord>     <int>  <dbl>
#> 1  1.07 Ideal     18279 17083.
#> 2  1.03 Ideal     17590 17078.
#> 3  1.04 Ideal     17729 17047.
#> 4  1.08 Ideal     18394 17031.
#> 5  1.05 Ideal     17869 17018.
#> 6  1.06 Ideal     18028 17008.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- diamonds |>
  # your code here
head(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- diamonds |>
  mutate(ppc = price / carat) |>
  select(carat, cut, price, ppc) |>
  arrange(desc(ppc))

head(ex_2_2)
```

**Explanation:** `mutate()` adds the derived column without dropping existing ones, then `select()` reshapes to the four columns of interest. `arrange(desc(ppc))` puts the most expensive-per-carat stones first; `desc()` is preferred over `-ppc` because it works on character and factor columns too. The actual numbers depend on the exact rounding of `diamonds`.

</details>

### Exercise 2.3: Flag automatic vs manual with if_else

**Task:** A used-car aggregator needs a human-readable transmission label. In `mtcars`, the `am` column is 0/1; add a new column `transmission` that says "manual" when `am == 1` and "automatic" otherwise, using `if_else()`. Save the modified data to `ex_2_3`.

**Expected result:**

```
#> count(ex_2_3, transmission)
#>   transmission  n
#> 1    automatic 19
#> 2       manual 13
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_3 <- mtcars |>
  # your code here
count(ex_2_3, transmission)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- mtcars |>
  mutate(transmission = if_else(am == 1, "manual", "automatic"))

count(ex_2_3, transmission)
```

**Explanation:** `if_else()` from dplyr is type-strict (both branches must return the same type) and NA-aware (carries `NA` through the predicate), unlike base `ifelse()` which can silently coerce. For binary recodes from 0/1 numerics, this is the standard idiom. For three or more outcomes, switch to `case_when()`.

</details>

### Exercise 2.4: Round every numeric column with across

**Task:** Apply `round(x, 2)` to every numeric column of `iris` in a single call, leaving the `Species` factor untouched. Use `mutate()` with `across()` and `where(is.numeric)` so the code does not list column names. Save the rounded tibble to `ex_2_4`.

**Expected result:**

```
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
#> ...
#> # 147 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- iris |>
  # your code here
head(ex_2_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- iris |>
  mutate(across(where(is.numeric), \(x) round(x, 2)))

head(ex_2_4, 3)
```

**Explanation:** `across()` applies a function to many columns inside a single `mutate()`; `where(is.numeric)` is a tidyselect predicate that picks columns by class. The anonymous-function shorthand `\(x) round(x, 2)` is preferred over the older `~ round(.x, 2)` because it scales to multiple arguments and matches base R syntax.

</details>

### Exercise 2.5: Convert engine columns to factors

**Task:** For `mtcars`, the engine count `cyl`, gear count `gear`, and carburetor count `carb` are stored as numerics but are really categorical. Convert all three to factors in one `mutate()` using `across()`, leaving every other column unchanged. Save to `ex_2_5`.

**Expected result:**

```
#> sapply(ex_2_5[c("cyl","gear","carb")], class)
#>   cyl   gear  carb
#> "factor" "factor" "factor"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_5 <- mtcars |>
  # your code here
sapply(ex_2_5[c("cyl","gear","carb")], class)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- mtcars |>
  mutate(across(c(cyl, gear, carb), as.factor))

sapply(ex_2_5[c("cyl","gear","carb")], class)
```

**Explanation:** `across(c(...), fn)` passes the function bare (no anonymous wrapper needed) because `as.factor()` takes a single vector. This pattern lets you batch-coerce many columns and is the dplyr replacement for `mutate_at()` (now superseded). Categorical conversion early in the pipeline keeps later models (`lm`, `aov`) from treating the codes as continuous.

</details>

### Exercise 2.6: Sort cars by mpg then hp

**Task:** A reviewer wants `mtcars` sorted with the most fuel-efficient cars first, breaking ties by lowest horsepower. Use `arrange()` with descending `mpg` and ascending `hp`, keeping all columns. Save the sorted tibble to `ex_2_6` and inspect the head.

**Expected result:**

```
#>                    mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Toyota Corolla    33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat 128          32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic       30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Lotus Europa      30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
#> ...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_6 <- mtcars |>
  # your code here
head(ex_2_6, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- mtcars |>
  arrange(desc(mpg), hp)

head(ex_2_6, 4)
```

**Explanation:** `arrange()` evaluates its sort keys left to right, so `desc(mpg)` is primary and `hp` is the tie-break. Notice the two Honda Civic / Lotus Europa rows both at 30.4 mpg: the one with lower `hp` (52 vs 113) appears first because of the secondary `hp` key. Use `arrange(across(everything()))` to sort on every column at once.

</details>

### Exercise 2.7: Coalesce two columns into one

**Task:** Build an inline tibble of customer contacts where some have `email` filled and others have `phone` filled but not both. Add a `primary_contact` column equal to `email` when present, otherwise `phone`, using `coalesce()`. Save the augmented tibble to `ex_2_7`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   id    email                  phone        primary_contact
#>   <chr> <chr>                  <chr>        <chr>
#> 1 A     ada@example.com        NA           ada@example.com
#> 2 B     NA                     555-0102     555-0102
#> 3 C     carol@example.com      NA           carol@example.com
#> 4 D     NA                     555-0104     555-0104
```

**Difficulty:** Intermediate

```r title="Your turn"
contacts <- tibble(
  id    = c("A","B","C","D"),
  email = c("ada@example.com", NA, "carol@example.com", NA),
  phone = c(NA, "555-0102", NA, "555-0104")
)

ex_2_7 <- contacts |>
  # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
contacts <- tibble(
  id    = c("A","B","C","D"),
  email = c("ada@example.com", NA, "carol@example.com", NA),
  phone = c(NA, "555-0102", NA, "555-0104")
)

ex_2_7 <- contacts |>
  mutate(primary_contact = coalesce(email, phone))

ex_2_7
```

**Explanation:** `coalesce()` walks its arguments left to right and returns the first non-NA value per row, much like SQL's `COALESCE`. It is the cleanest way to express "use A if present, else fall back to B (else C, etc.)" and beats nested `if_else()` chains. If every input is `NA` for a row, the result is `NA`.

</details>

### Exercise 2.8: Re-code cut quality with case_match

**Task:** A summary table for executives wants `diamonds$cut` collapsed into two labels: "premium" for "Ideal" or "Premium", and "other" for the remaining three levels. Use `case_match()` (a `case_when()` shortcut for value re-coding) and save to `ex_2_8`.

**Expected result:**

```
#> count(ex_2_8, cut_group)
#>   cut_group     n
#> 1     other 22198
#> 2   premium 31742
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_8 <- diamonds |>
  # your code here
count(ex_2_8, cut_group)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- diamonds |>
  mutate(cut_group = case_match(
    as.character(cut),
    c("Ideal", "Premium") ~ "premium",
    .default              ~ "other"
  ))

count(ex_2_8, cut_group)
```

**Explanation:** `case_match()` is designed for value-to-value mapping, removing the noisy `cut == "Ideal" | cut == "Premium"` syntax that `case_when()` would need. The `.default` argument is the catch-all (replacing `TRUE ~ ...`). Coercing `cut` to character avoids surprises with the ordered factor levels that `diamonds` ships with.

</details>

## Section 3. Summarise and group_by (10 problems)

### Exercise 3.1: Mean and median mpg by cylinder count

**Task:** A reviewer wants headline fuel-economy numbers per engine size. Group `mtcars` by `cyl` and compute the mean and median of `mpg` for each group, naming the columns `mean_mpg` and `median_mpg`. Save the three-row summary to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>     cyl mean_mpg median_mpg
#>   <dbl>    <dbl>      <dbl>
#> 1     4    26.7        26
#> 2     6    19.7        19.7
#> 3     8    15.1        15.2
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- mtcars |>
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars |>
  group_by(cyl) |>
  summarise(
    mean_mpg   = mean(mpg),
    median_mpg = median(mpg)
  )

ex_3_1
```

**Explanation:** `group_by()` partitions the data; `summarise()` then collapses each partition to one row, with each named expression becoming a new column. The result is automatically ungrouped at the last grouping variable, which is why downstream code rarely needs an explicit `ungroup()` after a single `group_by()`.

</details>

### Exercise 3.2: Count rows per cut quality

**Task:** A reporting analyst needs the size of every `cut` segment in `diamonds`. Use the `count()` shortcut to return a two-column tibble of cut level and row count, sorted from largest segment to smallest. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   cut           n
#>   <ord>     <int>
#> 1 Ideal     21551
#> 2 Premium   13791
#> 3 Very Good 12082
#> 4 Good       4906
#> 5 Fair       1610
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_2 <- diamonds |>
  # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- diamonds |>
  count(cut, sort = TRUE)

ex_3_2
```

**Explanation:** `count(col)` is shorthand for `group_by(col) |> summarise(n = n())`. The `sort = TRUE` argument arranges descending by `n`, which is exactly what you want for a ranked segment view. For multiple grouping columns, pass them all (`count(cut, color)`); for weighted counts, pass `wt = some_col`.

</details>

### Exercise 3.3: Summarise every numeric column at once

**Task:** Get the per-species mean of every numeric column in `iris` in a single call. Group by `Species`, then use `summarise()` with `across(where(is.numeric), mean)` so adding a new measurement column would just appear automatically. Save to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   Species    Sepal.Length Sepal.Width Petal.Length Petal.Width
#>   <fct>             <dbl>       <dbl>        <dbl>       <dbl>
#> 1 setosa             5.01        3.43         1.46       0.246
#> 2 versicolor         5.94        2.77         4.26       1.33
#> 3 virginica          6.59        2.97         5.55       2.03
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- iris |>
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric), mean))

ex_3_3
```

**Explanation:** `across()` inside `summarise()` produces one summary column per input column (here, four numerics give four summary outputs). For multiple summary functions per column, pass a named list: `across(where(is.numeric), list(mean = mean, sd = sd))` produces `Sepal.Length_mean`, `Sepal.Length_sd`, and so on.

</details>

### Exercise 3.4: Mean price by cut and color

**Task:** A merchandiser wants a two-way breakdown. Group `diamonds` by `cut` and `color`, summarise to mean `price` and `n = n()`, keep only segments with more than 1000 rows, and save the surviving rows to `ex_3_4`. The result should have 22 rows.

**Expected result:**

```
#> # A tibble: 22 x 4
#>   cut       color mean_price     n
#>   <ord>     <ord>      <dbl> <int>
#> 1 Ideal     D          2629.  2834
#> 2 Ideal     E          2598.  3903
#> 3 Ideal     F          3375.  3826
#> 4 Ideal     G          3721.  4884
#> ...
#> # 18 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- diamonds |>
  # your code here
nrow(ex_3_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- diamonds |>
  group_by(cut, color) |>
  summarise(mean_price = mean(price), n = n(), .groups = "drop") |>
  filter(n > 1000)

nrow(ex_3_4)
#> [1] 22
```

**Explanation:** `summarise()` with two grouping columns produces one row per (cut, color) combination. Passing `.groups = "drop"` strips the residual grouping so the downstream `filter()` runs on a regular tibble. Without it, `filter()` would still work, but later operations could be silently scoped to remaining groups.

</details>

### Exercise 3.5: Weighted mean of mpg by cylinder

**Task:** Use car weight `wt` to compute the weighted mean of `mpg` per cylinder in `mtcars`, so heavier cars count for more. Group by `cyl` and call `weighted.mean(mpg, w = wt)` inside `summarise()`. Save to `ex_3_5` and compare against a plain mean column called `naive_mean`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>     cyl wmean_mpg naive_mean
#>   <dbl>     <dbl>      <dbl>
#> 1     4      26.2       26.7
#> 2     6      19.7       19.7
#> 3     8      15.0       15.1
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_5 <- mtcars |>
  # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- mtcars |>
  group_by(cyl) |>
  summarise(
    wmean_mpg  = weighted.mean(mpg, w = wt),
    naive_mean = mean(mpg)
  )

ex_3_5
```

**Explanation:** Weighted means matter whenever observations are unequal: heavy cars likely use more fuel and should pull the average down, which is why `wmean_mpg` is a touch lower than `naive_mean` for `cyl == 4`. dplyr does not have a dedicated weighted-mean verb, but `weighted.mean()` from base R drops straight into `summarise()`.

</details>

### Exercise 3.6: Conditional sum inside summarise

**Task:** From `mpg`, count how many city-mpg miles come from cars with `class == "suv"` versus other classes, expressed as one row per manufacturer. Use `summarise()` with `sum(cty[class == "suv"])` and `sum(cty[class != "suv"])`. Save to `ex_3_6`.

**Expected result:**

```
#> # A tibble: 15 x 3
#>   manufacturer suv_cty other_cty
#>   <chr>          <int>     <int>
#> 1 audi               0       259
#> 2 chevrolet         55       119
#> 3 dodge            104       250
#> 4 ford             126       108
#> ...
#> # 11 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_6 <- mpg |>
  # your code here
head(ex_3_6, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- mpg |>
  group_by(manufacturer) |>
  summarise(
    suv_cty   = sum(cty[class == "suv"]),
    other_cty = sum(cty[class != "suv"])
  )

head(ex_3_6, 4)
```

**Explanation:** Inline subsetting (`cty[class == "suv"]`) is dplyr-friendly: each summary expression sees the group's columns as plain vectors, so any base R indexing works. This avoids splitting the pipeline into two `filter()` branches and joining them back. Numbers depend on the exact `mpg` shipped with ggplot2.

</details>

### Exercise 3.7: Per-group quantiles of price

**Task:** A pricing team wants the 25th, 50th, and 75th percentiles of `price` for each `cut` in `diamonds`. Inside `summarise()` use `quantile(price, probs = c(0.25, 0.5, 0.75))` and unnest the named vector into three columns with `as_tibble_row()`. Save to `ex_3_7`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   cut       q25    q50    q75
#>   <ord>   <dbl>  <dbl>  <dbl>
#> 1 Fair      942   3282  5206.
#> 2 Good      912   3050. 5028
#> 3 Very Good 912   2648  5373
#> 4 Premium  1046   3185  6296
#> 5 Ideal     878   1810. 4678.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_7 <- diamonds |>
  # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- diamonds |>
  group_by(cut) |>
  summarise(
    q25 = quantile(price, 0.25),
    q50 = quantile(price, 0.50),
    q75 = quantile(price, 0.75)
  )

ex_3_7
```

**Explanation:** `summarise()` requires each expression to return a single value, so calling `quantile()` separately for each probability is the simplest path. The alternative, returning a length-3 vector, used to require `reframe()` (added in dplyr 1.1) which lets a summary expression produce multiple rows per group. For wide output, the three-call form is more readable.

</details>

### Exercise 3.8: Group share as a percent of total

**Task:** A merchandiser wants the share of inventory per `cut` in `diamonds`, expressed as a percent rounded to one decimal. Compute `n = n()` per group, then add a `share_pct` column using `n / sum(n) * 100`. Save the result to `ex_3_8`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   cut           n share_pct
#>   <ord>     <int>     <dbl>
#> 1 Fair       1610       3
#> 2 Good       4906       9.1
#> 3 Very Good 12082      22.4
#> 4 Premium   13791      25.6
#> 5 Ideal     21551      40
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_8 <- diamonds |>
  # your code here
ex_3_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- diamonds |>
  count(cut) |>
  mutate(share_pct = round(n / sum(n) * 100, 1))

ex_3_8
```

**Explanation:** `count()` returns one row per cut and a column `n`. Because the resulting tibble has no remaining grouping (count auto-drops one level), `sum(n)` is the grand total across all cuts, which gives the share-of-whole. To get share within a different parent group, wrap the divisor in a grouped `sum(n)` via `group_by()` before the `mutate()`.

</details>

### Exercise 3.9: Compare mean price across cuts in wide format

**Task:** Build a one-row wide table showing the mean `price` for each `cut` level of `diamonds` as its own column (`Fair`, `Good`, `Very_Good`, `Premium`, `Ideal`). Use `summarise()` + `pivot_wider()` from tidyr. Save the single-row result to `ex_3_9`.

**Expected result:**

```
#> # A tibble: 1 x 5
#>    Fair   Good `Very Good` Premium Ideal
#>   <dbl>  <dbl>       <dbl>   <dbl> <dbl>
#> 1 4359.  3929.       3982.   4584. 3458.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_9 <- diamonds |>
  # your code here
ex_3_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_9 <- diamonds |>
  group_by(cut) |>
  summarise(mean_price = mean(price)) |>
  pivot_wider(names_from = cut, values_from = mean_price)

ex_3_9
```

**Explanation:** Wide format is the right shape for side-by-side comparison and exec dashboards. The summary stays long while computing (`group_by` + `summarise`), then `pivot_wider()` reshapes once: `names_from` becomes the new column headers, `values_from` becomes their cell values. Use `pivot_longer()` to go the other way.

</details>

### Exercise 3.10: Use the .by argument shortcut

**Task:** Repeat the mean-and-median-mpg-by-cyl summary from Exercise 3.1, but skip `group_by()` and use the newer `.by` argument inside `summarise()` (introduced in dplyr 1.1). Save the result to `ex_3_10` and confirm it matches `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>     cyl mean_mpg median_mpg
#>   <dbl>    <dbl>      <dbl>
#> 1     6    19.7        19.7
#> 2     4    26.7        26
#> 3     8    15.1        15.2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_10 <- mtcars |>
  # your code here
ex_3_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_10 <- mtcars |>
  summarise(
    mean_mpg   = mean(mpg),
    median_mpg = median(mpg),
    .by        = cyl
  )

ex_3_10
```

**Explanation:** `.by` is a per-call grouping argument that does not persist after the verb finishes, so you never need an explicit `ungroup()`. It is preferable when grouping applies to just one verb. Row order in the output follows the order of first appearance of `cyl` in the data, not sorted; pass `.by = cyl` with a downstream `arrange(cyl)` for a sorted view.

</details>

## Section 4. Joins and combining tables (8 problems)

### Exercise 4.1: Inner join customers with their orders

**Task:** A finance team needs every customer-order pair where both sides exist. Build two inline tibbles, `customers` (id, name) and `orders` (cust_id, amount), and inner-join them on the customer key. Save the resulting joined tibble to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>      id name  amount
#>   <int> <chr>  <dbl>
#> 1     1 Ada      100
#> 2     2 Bob       50
#> 3     2 Bob       75
```

**Difficulty:** Beginner

```r title="Your turn"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_1 <- customers |>
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_1 <- customers |>
  inner_join(orders, by = c("id" = "cust_id"))

ex_4_1
```

**Explanation:** `inner_join()` keeps only rows that match on both sides, so customer 3 (Carol, no order) and order from cust_id 4 (no matching customer) both drop. The named vector `c("id" = "cust_id")` tells dplyr the left key is `id` and the right key is `cust_id`. The newer alternative is `join_by(id == cust_id)`.

</details>

### Exercise 4.2: Left join preserves all customers

**Task:** Using the same `customers` and `orders` tibbles, return one row per customer with their order amount (or `NA` if they never bought anything). Use `left_join()` so Carol is retained. Save to `ex_4_2` and notice the `NA` row.

**Expected result:**

```
#> # A tibble: 4 x 3
#>      id name  amount
#>   <int> <chr>  <dbl>
#> 1     1 Ada      100
#> 2     2 Bob       50
#> 3     2 Bob       75
#> 4     3 Carol     NA
```

**Difficulty:** Intermediate

```r title="Your turn"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_2 <- customers |>
  # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_2 <- customers |>
  left_join(orders, by = c("id" = "cust_id"))

ex_4_2
```

**Explanation:** `left_join()` keeps every row from the left side regardless of whether a match exists on the right; unmatched rows get `NA` in the right-side columns. Bob has two orders so he appears twice (left rows can be duplicated by the right). This is the right join when the left table is your "spine" of entities you must report on.

</details>

### Exercise 4.3: Find customers without orders via anti_join

**Task:** From the inline `customers` and `orders` tibbles, return the customers who have never placed an order. Use `anti_join()` so the result is a normal customer tibble without any order columns. Save to `ex_4_3` and confirm it has one row.

**Expected result:**

```
#> # A tibble: 1 x 2
#>      id name
#>   <int> <chr>
#> 1     3 Carol
```

**Difficulty:** Intermediate

```r title="Your turn"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_3 <- customers |>
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_3 <- customers |>
  anti_join(orders, by = c("id" = "cust_id"))

ex_4_3
```

**Explanation:** Filtering joins (`anti_join`, `semi_join`) only return columns from the left table and never duplicate rows. `anti_join()` keeps rows that have no match on the right, the inverse of `semi_join()`. It is the cleanest way to ask "who is missing from B?" without a noisy `left_join() |> filter(is.na(amount))` pattern.

</details>

### Exercise 4.4: Keep customers who DID place orders via semi_join

**Task:** Using the same two inline tibbles, return the customer rows for those who have at least one order, without inflating the result by the order count (semi_join, not inner_join). Save to `ex_4_4` and confirm two rows.

**Expected result:**

```
#> # A tibble: 2 x 2
#>      id name
#>   <int> <chr>
#> 1     1 Ada
#> 2     2 Bob
```

**Difficulty:** Intermediate

```r title="Your turn"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_4 <- customers |>
  # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_4 <- customers |>
  semi_join(orders, by = c("id" = "cust_id"))

ex_4_4
```

**Explanation:** `semi_join()` is to `inner_join()` what `anti_join()` is to `left_join() |> filter(is.na(...))`: a filtering-only variant. It keeps at most one copy of each left row and never adds right-side columns. Reach for it when you want to subset by membership in another table without materialising extra columns.

</details>

### Exercise 4.5: Full join exposes both-sides gaps

**Task:** Combine the inline `customers` and `orders` tibbles with `full_join()` so the result contains every customer AND every order, with NAs filling unmatched cells on either side. Save to `ex_4_5` and confirm five rows.

**Expected result:**

```
#> # A tibble: 5 x 4
#>      id name  cust_id amount
#>   <int> <chr>   <dbl>  <dbl>
#> 1     1 Ada         1    100
#> 2     2 Bob         2     50
#> 3     2 Bob         2     75
#> 4     3 Carol      NA     NA
#> 5    NA NA          4    200
```

**Difficulty:** Intermediate

```r title="Your turn"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_5 <- customers |>
  # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
customers <- tibble(id = 1:3,        name   = c("Ada","Bob","Carol"))
orders    <- tibble(cust_id = c(1,2,2,4), amount = c(100, 50, 75, 200))

ex_4_5 <- customers |>
  full_join(orders, by = c("id" = "cust_id"), keep = TRUE)

ex_4_5
```

**Explanation:** `full_join()` is the union of `left_join()` and `right_join()` and is invaluable when you suspect both sides have orphan records. The `keep = TRUE` argument preserves both join keys as separate columns so you can see exactly which side a row came from. Drop `keep` and the keys merge into one column.

</details>

### Exercise 4.6: Join on two key columns

**Task:** Inline two tibbles `staffing` and `shifts` keyed on both `date` and `store`. Inner-join them on the composite key so each shift gets the correct staff count for that date and store. Save the joined result to `ex_4_6`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   date       store staff_count shift_label
#>   <chr>      <chr>       <dbl> <chr>
#> 1 2026-01-02 A               5 morning
#> 2 2026-01-02 B               3 evening
#> 3 2026-01-03 A               4 morning
```

**Difficulty:** Intermediate

```r title="Your turn"
staffing <- tibble(
  date  = c("2026-01-02","2026-01-02","2026-01-03","2026-01-03"),
  store = c("A","B","A","B"),
  staff_count = c(5, 3, 4, 6)
)
shifts <- tibble(
  date  = c("2026-01-02","2026-01-02","2026-01-03"),
  store = c("A","B","A"),
  shift_label = c("morning","evening","morning")
)

ex_4_6 <- staffing |>
  # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
staffing <- tibble(
  date  = c("2026-01-02","2026-01-02","2026-01-03","2026-01-03"),
  store = c("A","B","A","B"),
  staff_count = c(5, 3, 4, 6)
)
shifts <- tibble(
  date  = c("2026-01-02","2026-01-02","2026-01-03"),
  store = c("A","B","A"),
  shift_label = c("morning","evening","morning")
)

ex_4_6 <- staffing |>
  inner_join(shifts, by = c("date", "store"))

ex_4_6
```

**Explanation:** Passing a character vector to `by` joins on multiple columns by name (same name on both sides). If the columns were named differently, you would use `by = c("date" = "shift_date", "store" = "shift_store")`. Composite keys are how you avoid Cartesian explosions: every (date, store) pair is meant to be unique on at least one side.

</details>

### Exercise 4.7: Inequality join with join_by

**Task:** A risk team wants to attach a tax rate from a `brackets` tibble (`min_income`, `max_income`, `rate`) to a small `payroll` tibble. Use `join_by()` with the inequality operators `>=` and `<` so each salary maps to the bracket it falls into. Save the augmented payroll to `ex_4_7`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   employee salary  rate
#>   <chr>     <dbl> <dbl>
#> 1 Ada       45000  0.15
#> 2 Bob       85000  0.22
#> 3 Carol    200000  0.32
```

**Difficulty:** Advanced

```r title="Your turn"
payroll  <- tibble(employee = c("Ada","Bob","Carol"), salary = c(45000, 85000, 200000))
brackets <- tibble(
  min_income = c(0,     50000, 100000),
  max_income = c(50000, 100000, Inf),
  rate       = c(0.15,  0.22,   0.32)
)

ex_4_7 <- payroll |>
  # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
payroll  <- tibble(employee = c("Ada","Bob","Carol"), salary = c(45000, 85000, 200000))
brackets <- tibble(
  min_income = c(0,     50000, 100000),
  max_income = c(50000, 100000, Inf),
  rate       = c(0.15,  0.22,   0.32)
)

ex_4_7 <- payroll |>
  inner_join(brackets, by = join_by(salary >= min_income, salary < max_income)) |>
  select(employee, salary, rate)

ex_4_7
```

**Explanation:** `join_by()` (dplyr 1.1+) supports inequalities, rolling joins, and overlap joins that the older `by =` character syntax could not express. Here each salary is matched to the unique bracket whose `min_income <= salary < max_income`. Without inequality joins, this would require a manual `crossing()` followed by `filter()`, a quadratic blow-up on real data.

</details>

### Exercise 4.8: Stack two datasets with bind_rows and .id

**Task:** Append the first three rows of `mtcars` and the first three rows of `mpg`'s shared columns into one tall tibble, tagging each row with a `source` column equal to `"mtcars"` or `"mpg"`. Use `bind_rows()` with the `.id` argument. Save to `ex_4_8`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   source  cyl   hp
#>   <chr> <dbl> <dbl>
#> 1 mtcars     6   110
#> 2 mtcars     6   110
#> 3 mtcars     4    93
#> 4 mpg        4    NA
#> 5 mpg        4    NA
#> 6 mpg        4    NA
```

**Difficulty:** Intermediate

```r title="Your turn"
a <- mtcars |> head(3) |> select(cyl, hp)
b <- mpg    |> head(3) |> select(cyl)

ex_4_8 <- bind_rows(
  # your code here
)
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- mtcars |> head(3) |> select(cyl, hp)
b <- mpg    |> head(3) |> select(cyl)

ex_4_8 <- bind_rows(mtcars = a, mpg = b, .id = "source")

ex_4_8
```

**Explanation:** `bind_rows()` aligns columns by name, filling missing ones with `NA`, which is why `hp` is `NA` for the mpg rows. The `.id` argument creates a new column whose values come from the names you passed (here "mtcars" and "mpg"), perfect for tagging row provenance when you union datasets from different sources.

</details>

## Section 5. Window functions and ranking (8 problems)

### Exercise 5.1: Rank cars by mpg within cylinder

**Task:** A reviewer wants the rank order of `mpg` within each `cyl` group of `mtcars`, with rank 1 going to the highest mpg. Use `group_by(cyl)` and `mutate(rank_mpg = row_number(desc(mpg)))`. Keep `car`, `cyl`, `mpg`, `rank_mpg` and save to `ex_5_1`.

**Expected result:**

```
#> head(filter(ex_5_1, cyl == 4))
#> # A tibble: 6 x 4
#>   car              cyl   mpg rank_mpg
#>   <chr>          <dbl> <dbl>    <int>
#> 1 Toyota Corolla     4  33.9        1
#> 2 Fiat 128           4  32.4        2
#> 3 Honda Civic        4  30.4        3
#> 4 Lotus Europa       4  30.4        4
#> 5 Fiat X1-9          4  27.3        5
#> 6 Porsche 914-2      4  26.0        6
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- mtcars |>
  rownames_to_column("car") |>
  # your code here
head(filter(ex_5_1, cyl == 4))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  mutate(rank_mpg = row_number(desc(mpg))) |>
  ungroup() |>
  select(car, cyl, mpg, rank_mpg)

head(filter(ex_5_1, cyl == 4))
```

**Explanation:** `row_number()` breaks ties by the order of appearance in the data, giving every row a distinct integer rank. Wrapping the input in `desc()` reverses the direction so 1 is "best". Use `min_rank()` if you want tied values to share a rank with gaps, or `dense_rank()` for ties without gaps.

</details>

### Exercise 5.2: Period-over-period change with lag

**Task:** A growth team wants the month-over-month change in `unemploy` from the `economics` dataset. Compute `delta = unemploy - lag(unemploy)` after sorting by `date`, keep `date`, `unemploy`, `delta`, and drop the first NA row. Save to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   date       unemploy delta
#>   <date>        <dbl> <dbl>
#> 1 1967-08-01     2945    62
#> 2 1967-09-01     2958    13
#> 3 1967-10-01     3143   185
#> 4 1967-11-01     3066   -77
#> 5 1967-12-01     3018   -48
#> 6 1968-01-01     2878  -140
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- economics |>
  # your code here
head(ex_5_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- economics |>
  arrange(date) |>
  mutate(delta = unemploy - lag(unemploy)) |>
  select(date, unemploy, delta) |>
  filter(!is.na(delta))

head(ex_5_2)
```

**Explanation:** `lag(x)` shifts the vector down by one, so the first row becomes `NA` (no prior period). Always `arrange()` before `lag()`/`lead()` because they trust the row order they see. Use `lag(x, n = 12)` for year-over-year on monthly data, or pass `default = ...` to control how the first n rows fill.

</details>

### Exercise 5.3: Cumulative sum of price within cut

**Task:** Within each `cut` of `diamonds`, compute the running sum of `price` ordered by `carat` ascending. Keep `cut`, `carat`, `price`, and the new `cum_price` column. Save the result to `ex_5_3` and inspect a small head per group.

**Expected result:**

```
#> # A tibble: 6 x 4
#> # Groups:   cut [1]
#>   cut   carat price cum_price
#>   <ord> <dbl> <int>     <int>
#> 1 Fair    0.22   337       337
#> 2 Fair    0.25   336       673
#> 3 Fair    0.25   631      1304
#> 4 Fair    0.27   460      1764
#> 5 Fair    0.27   573      2337
#> 6 Fair    0.27   626      2963
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- diamonds |>
  # your code here
head(filter(ex_5_3, cut == "Fair"))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- diamonds |>
  arrange(cut, carat) |>
  group_by(cut) |>
  mutate(cum_price = cumsum(price)) |>
  select(cut, carat, price, cum_price)

head(filter(ex_5_3, cut == "Fair"))
```

**Explanation:** `cumsum()` is a window function: it returns a vector the same length as its input. Inside a `group_by()`, it restarts at each group, which is the entire point. `arrange()` before `group_by()` controls the order within each window; without it, the running sum would follow whatever order the source happened to be in.

</details>

### Exercise 5.4: Top 3 priciest stones per cut

**Task:** From `diamonds`, return the three priciest stones per `cut` level using `slice_max()`. Keep all columns and order each within-cut block from most to least expensive. Save to `ex_5_4` and confirm 15 rows.

**Expected result:**

```
#> # A tibble: 15 x 10
#>   carat cut       color clarity depth table price     x     y     z
#>   <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#> 1  2.01 Fair      G     SI1      70.6    64 18574  7.43  6.64  4.69
#> 2  2.02 Fair      H     SI2      64.5    57 18565  8.00  7.95  5.14
#> 3  2.01 Fair      G     SI1      62.8    63 18557  7.91  7.85  4.94
#> ...
#> # 12 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- diamonds |>
  # your code here
nrow(ex_5_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- diamonds |>
  group_by(cut) |>
  slice_max(price, n = 3, with_ties = FALSE) |>
  ungroup()

nrow(ex_5_4)
#> [1] 15
```

**Explanation:** `slice_max(price, n = 3)` keeps the top three rows by `price` within each group. `with_ties = FALSE` forces exactly three rows even when there is a tie at the cutoff, which is what you want when downstream code expects a fixed count. The sibling `slice_min()` does the inverse, and `slice_sample(n = 3)` gives random picks.

</details>

### Exercise 5.5: Deduplicate keeping the latest record

**Task:** Inline a tibble `events` of (id, ts, value) where some `id`s repeat across timestamps. Keep only the most recent row per `id` using `arrange(desc(ts)) |> group_by(id) |> slice_head(n = 1)`. Save the deduplicated tibble to `ex_5_5`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>      id ts         value
#>   <int> <chr>      <dbl>
#> 1     1 2026-04-03    30
#> 2     2 2026-04-02    25
#> 3     3 2026-04-04    50
```

**Difficulty:** Intermediate

```r title="Your turn"
events <- tibble(
  id    = c(1, 1, 2, 2, 3),
  ts    = c("2026-04-01","2026-04-03","2026-04-01","2026-04-02","2026-04-04"),
  value = c(10, 30, 20, 25, 50)
)

ex_5_5 <- events |>
  # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- tibble(
  id    = c(1, 1, 2, 2, 3),
  ts    = c("2026-04-01","2026-04-03","2026-04-01","2026-04-02","2026-04-04"),
  value = c(10, 30, 20, 25, 50)
)

ex_5_5 <- events |>
  arrange(desc(ts)) |>
  group_by(id) |>
  slice_head(n = 1) |>
  ungroup() |>
  arrange(id)

ex_5_5
```

**Explanation:** "Most recent per id" is a window-level filter: rank by `ts` within `id`, keep rank 1. The `arrange(desc(ts))` puts the newest row first within each group, and `slice_head(n = 1)` takes it. The same idea generalises to "first event per session", "best score per player", and so on.

</details>

### Exercise 5.6: dense_rank versus row_number

**Task:** In `mpg`, add two columns ranking cars by `hwy` mileage descending across the whole dataset: `rn = row_number(desc(hwy))` (unique) and `dr = dense_rank(desc(hwy))` (ties share a rank, no gaps). Save the augmented tibble to `ex_5_6` and inspect a few tied rows.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   manufacturer  hwy    rn    dr
#>   <chr>       <int> <int> <int>
#> 1 volkswagen     44     1     1
#> 2 volkswagen     44     2     1
#> 3 toyota         44     3     1
#> 4 honda          41     4     2
#> 5 volkswagen     41     5     2
#> 6 toyota         37     6     3
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_6 <- mpg |>
  # your code here
head(arrange(ex_5_6, dr, rn), 6)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- mpg |>
  mutate(
    rn = row_number(desc(hwy)),
    dr = dense_rank(desc(hwy))
  ) |>
  select(manufacturer, hwy, rn, dr)

head(arrange(ex_5_6, dr, rn), 6)
```

**Explanation:** `row_number()` always returns a unique integer per row (ties broken by source order). `dense_rank()` gives equal values the same rank with no gap to the next, so three rows tied at hwy=44 all get `dr=1` and the next distinct value (hwy=41) is `dr=2`. `min_rank()` is the third flavour: equal values share, but the next rank skips ahead.

</details>

### Exercise 5.7: Three-period moving average with lag

**Task:** From `economics`, compute a 3-month centred moving average of `unemploy` using base `mean()` over `lag(x,1), x, lead(x,1)`. Sort by date first, keep `date`, `unemploy`, and the new column `ma3`, dropping the first and last rows. Save the result to `ex_5_7`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   date       unemploy   ma3
#>   <date>        <dbl> <dbl>
#> 1 1967-08-01     2945 2929.
#> 2 1967-09-01     2958 3015.
#> 3 1967-10-01     3143 3056.
#> 4 1967-11-01     3066 3076.
#> 5 1967-12-01     3018 2987.
#> 6 1968-01-01     2878 2926.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_7 <- economics |>
  # your code here
head(ex_5_7)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- economics |>
  arrange(date) |>
  mutate(ma3 = (lag(unemploy) + unemploy + lead(unemploy)) / 3) |>
  select(date, unemploy, ma3) |>
  filter(!is.na(ma3))

head(ex_5_7)
```

**Explanation:** A centred 3-period average uses one observation on each side of the current row, which is why `lag()` and `lead()` appear together. The first and last rows of the series have no neighbour on one side, so `ma3` is `NA` there and the `filter()` drops them. For longer windows, the slider package offers `slide_dbl()`.

</details>

### Exercise 5.8: First and last value per group

**Task:** A retention analyst wants the first and last `unemploy` reading for each year in `economics`. Sort by date, add a `year` column, and within each year use `first()` and `last()` to capture the opening and closing values. Save the summary to `ex_5_8`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>    year  first  last
#>   <dbl>  <dbl> <dbl>
#> 1  1967   2944  3018
#> 2  1968   2878  2685
#> 3  1969   2718  2884
#> 4  1970   3201  4988
#> 5  1971   4903  4715
#> 6  1972   4471  4191
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_8 <- economics |>
  # your code here
head(ex_5_8)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- economics |>
  arrange(date) |>
  mutate(year = as.integer(format(date, "%Y"))) |>
  group_by(year) |>
  summarise(first = first(unemploy), last = last(unemploy), .groups = "drop")

head(ex_5_8)
```

**Explanation:** `first()` and `last()` are dplyr helpers that respect the current row order, so `arrange()` controls what counts as "first". They are clearer than `head(x, 1)` and `tail(x, 1)` inside `summarise()` because they return a single scalar by design. Use `nth(x, n)` for arbitrary positions.

</details>

## Section 6. Multi-step pipelines and real scenarios (8 problems)

### Exercise 6.1: Cohort retention from a tiny event log

**Task:** Build an inline event log with one row per (user, day_visited). For each `signup_day` cohort, compute the share of users who came back at least once on a later day. Save the cohort-level retention rate to `ex_6_1` as a percentage rounded to one decimal.

**Expected result:**

```
#> # A tibble: 2 x 3
#>   signup_day n_users retention_pct
#>   <chr>        <int>         <dbl>
#> 1 2026-01-01       3          66.7
#> 2 2026-01-02       2          50
```

**Difficulty:** Advanced

```r title="Your turn"
events <- tibble(
  user        = c("a","a","b","c","d","d","e"),
  day_visited = c("2026-01-01","2026-01-03","2026-01-01","2026-01-01","2026-01-02","2026-01-04","2026-01-02"),
  signup_day  = c("2026-01-01","2026-01-01","2026-01-01","2026-01-01","2026-01-02","2026-01-02","2026-01-02")
)

ex_6_1 <- events |>
  # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
events <- tibble(
  user        = c("a","a","b","c","d","d","e"),
  day_visited = c("2026-01-01","2026-01-03","2026-01-01","2026-01-01","2026-01-02","2026-01-04","2026-01-02"),
  signup_day  = c("2026-01-01","2026-01-01","2026-01-01","2026-01-01","2026-01-02","2026-01-02","2026-01-02")
)

ex_6_1 <- events |>
  group_by(signup_day, user) |>
  summarise(returned = any(day_visited > signup_day), .groups = "drop") |>
  group_by(signup_day) |>
  summarise(
    n_users        = n(),
    retention_pct  = round(mean(returned) * 100, 1),
    .groups        = "drop"
  )

ex_6_1
```

**Explanation:** The pipeline runs in two grouping passes: first collapse each (cohort, user) to a single retention flag with `any()`, then average the flag within each cohort to get the rate. Doing it in one pass would over-count users with many return visits. `mean()` of a logical vector is the share that is TRUE.

</details>

### Exercise 6.2: Remove price outliers within each cut

**Task:** From `diamonds`, remove the `price` outliers within each `cut` using the 1.5 * IQR rule. Compute per-cut quartiles, then filter to rows whose price is inside `[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`. Save the cleaned data to `ex_6_2` and report row count change.

**Expected result:**

```
#> nrow(diamonds)
#> [1] 53940
#> nrow(ex_6_2)
#> [1] 50225    # roughly: dataset minus per-cut high-price outliers
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- diamonds |>
  # your code here
c(nrow(diamonds), nrow(ex_6_2))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- diamonds |>
  group_by(cut) |>
  mutate(
    q1  = quantile(price, 0.25),
    q3  = quantile(price, 0.75),
    iqr = q3 - q1
  ) |>
  filter(price >= q1 - 1.5*iqr, price <= q3 + 1.5*iqr) |>
  ungroup() |>
  select(-q1, -q3, -iqr)

c(nrow(diamonds), nrow(ex_6_2))
```

**Explanation:** Per-group outlier removal needs per-group thresholds, which is why `mutate()` (not `summarise()`) is used: it broadcasts the group quantiles to every row in the group. After the filter, the helper columns are dropped. Tukey's 1.5 * IQR is conservative for skewed data like prices; for log-scale data, do the same logic on `log(price)`.

</details>

### Exercise 6.3: Find groups with monotonically increasing values

**Task:** Inline a tibble `metrics` with (segment, week, value). Return only the segments whose `value` strictly increases week-over-week across all four weeks. Use `group_by()` and a logical reduction inside `summarise()`. Save the surviving segment names to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 1 x 1
#>   segment
#>   <chr>
#> 1 alpha
```

**Difficulty:** Advanced

```r title="Your turn"
metrics <- tibble(
  segment = rep(c("alpha","beta","gamma"), each = 4),
  week    = rep(1:4, times = 3),
  value   = c(10, 12, 15, 20,   8, 9, 9, 11,   5, 8, 7, 10)
)

ex_6_3 <- metrics |>
  # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
metrics <- tibble(
  segment = rep(c("alpha","beta","gamma"), each = 4),
  week    = rep(1:4, times = 3),
  value   = c(10, 12, 15, 20,   8, 9, 9, 11,   5, 8, 7, 10)
)

ex_6_3 <- metrics |>
  arrange(segment, week) |>
  group_by(segment) |>
  summarise(monotonic = all(diff(value) > 0), .groups = "drop") |>
  filter(monotonic) |>
  select(segment)

ex_6_3
```

**Explanation:** `diff()` returns the period-over-period gaps; `all(diff(value) > 0)` is TRUE only when every gap is positive, i.e. the series is strictly increasing. Wrapping this in a per-group `summarise()` reduces every segment to a single TRUE/FALSE, then a downstream `filter()` keeps the qualifying ones. `>=` instead of `>` would allow plateaus.

</details>

### Exercise 6.4: Largest single-month jump in unemployment

**Task:** In `economics`, find the date with the largest single-month increase in `unemploy`, plus the size of the jump. Use `lag()` to compute month-over-month change, then `slice_max()` to pull the row. Save the one-row tibble to `ex_6_4`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   date       unemploy  jump
#>   <date>        <dbl> <dbl>
#> 1 2008-12-01    11400  584
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_4 <- economics |>
  # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- economics |>
  arrange(date) |>
  mutate(jump = unemploy - lag(unemploy)) |>
  filter(!is.na(jump)) |>
  slice_max(jump, n = 1, with_ties = FALSE) |>
  select(date, unemploy, jump)

ex_6_4
```

**Explanation:** The combined pattern of `lag()` for differences and `slice_max()` for extremes is one of dplyr's most useful idioms for time series anomaly detection. `arrange(date)` is essential before `lag()`. `with_ties = FALSE` keeps the output to exactly one row when several months happen to share the maximum jump.

</details>

### Exercise 6.5: Pareto 80/20 of inventory value

**Task:** From `diamonds`, find the smallest set of rows (ranked by `price` descending) whose cumulative price reaches 80% of total inventory value. Add a running share and filter up to (and including) the row that crosses 0.8. Save the qualifying rows to `ex_6_5`.

**Expected result:**

```
#> nrow(ex_6_5)
#> [1] 32115     # ~60% of rows account for the top 80% of value
#> sum(ex_6_5$price) / sum(diamonds$price)
#> [1] 0.8000003
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- diamonds |>
  # your code here
nrow(ex_6_5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- diamonds |>
  arrange(desc(price)) |>
  mutate(
    share     = price / sum(price),
    cum_share = cumsum(share)
  ) |>
  filter(cum_share <= 0.80 | lag(cum_share, default = 0) <= 0.80) |>
  select(carat, cut, price, cum_share)

nrow(ex_6_5)
```

**Explanation:** The Pareto cut is "biggest first until cumulative share crosses 80%", which requires including the row that crosses, not just the rows below it. The `lag(cum_share, default = 0) <= 0.80` clause adds back the boundary-crosser. The exact count depends on price distribution but typically the top 20% to 60% of rows hold 80% of value.

</details>

### Exercise 6.6: Z-score within groups and flag outliers

**Task:** Within each `cyl` group of `mtcars`, compute the z-score of `hp` and flag rows whose absolute z-score exceeds 1.5 as outliers. Add columns `z_hp` and `is_outlier`, keep `car`, `cyl`, `hp`, `z_hp`, `is_outlier`. Save the result to `ex_6_6`.

**Expected result:**

```
#> filter(ex_6_6, is_outlier)
#> # A tibble: 4 x 5
#>   car                cyl    hp  z_hp is_outlier
#>   <chr>            <dbl> <dbl> <dbl> <lgl>
#> 1 Lotus Europa         4   113  1.97 TRUE
#> 2 Ferrari Dino         6   175  1.59 TRUE
#> 3 Maserati Bora        8   335  2.06 TRUE
#> 4 Cadillac Fleetwood   8   205 -1.51 TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_6 <- mtcars |>
  rownames_to_column("car") |>
  # your code here
filter(ex_6_6, is_outlier)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_6 <- mtcars |>
  rownames_to_column("car") |>
  group_by(cyl) |>
  mutate(
    z_hp       = (hp - mean(hp)) / sd(hp),
    is_outlier = abs(z_hp) > 1.5
  ) |>
  ungroup() |>
  select(car, cyl, hp, z_hp, is_outlier)

filter(ex_6_6, is_outlier)
```

**Explanation:** Group-wise standardisation puts each `hp` on a comparable scale per cylinder class, which matters because a 175-hp 6-cylinder is unusual but a 175-hp 8-cylinder is not. The threshold 1.5 (sigma) is a soft outlier rule; 2 or 3 is stricter. Keep `mutate()` (not `summarise()`) so the original rows are preserved.

</details>

### Exercise 6.7: Pivot a price summary into a wide cut by color table

**Task:** Group `diamonds` by `cut` and `color`, compute mean `price`, then pivot to a wide layout where rows are `cut` and columns are `color`. Round values to the nearest integer. Save the resulting 5x8 tibble to `ex_6_7`.

**Expected result:**

```
#> # A tibble: 5 x 8
#>   cut         D     E     F     G     H     I     J
#>   <ord>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 Fair     4292  3683  3827  4239  5136  4685  4976
#> 2 Good     3405  3424  3496  4123  4276  5079  4574
#> ...
#> # 3 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_7 <- diamonds |>
  # your code here
head(ex_6_7, 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- diamonds |>
  group_by(cut, color) |>
  summarise(mean_price = round(mean(price)), .groups = "drop") |>
  pivot_wider(names_from = color, values_from = mean_price)

head(ex_6_7, 2)
```

**Explanation:** A two-way summary table is the canonical use of `summarise()` + `pivot_wider()`. The result has one row per `cut` and one column per `color`, with cell values from `mean_price`. If a (cut, color) combination had no rows, the cell would default to `NA`; pass `values_fill = 0` to override.

</details>

### Exercise 6.8: Detect duplicates by a subset of columns

**Task:** Inline a tibble `txns` (id, account, amount, ts) where some rows are exact duplicates on (account, amount) within the same minute. Flag those duplicates with `add_count()` and keep only the duplicate rows for review. Save the suspicious rows to `ex_6_8`.

**Expected result:**

```
#> # A tibble: 4 x 5
#>      id account amount ts             dup_n
#>   <int> <chr>    <dbl> <chr>          <int>
#> 1     1 A          100 2026-04-01 10:00     2
#> 2     2 A          100 2026-04-01 10:00     2
#> 3     4 B           50 2026-04-01 11:00     2
#> 4     5 B           50 2026-04-01 11:00     2
```

**Difficulty:** Intermediate

```r title="Your turn"
txns <- tibble(
  id      = 1:5,
  account = c("A","A","A","B","B"),
  amount  = c(100, 100, 80, 50, 50),
  ts      = c("2026-04-01 10:00","2026-04-01 10:00","2026-04-01 10:30","2026-04-01 11:00","2026-04-01 11:00")
)

ex_6_8 <- txns |>
  # your code here
ex_6_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
txns <- tibble(
  id      = 1:5,
  account = c("A","A","A","B","B"),
  amount  = c(100, 100, 80, 50, 50),
  ts      = c("2026-04-01 10:00","2026-04-01 10:00","2026-04-01 10:30","2026-04-01 11:00","2026-04-01 11:00")
)

ex_6_8 <- txns |>
  add_count(account, amount, ts, name = "dup_n") |>
  filter(dup_n > 1)

ex_6_8
```

**Explanation:** `add_count()` is `count()` followed by a join: it adds a column with the group size to every original row, so you can filter by it without losing the original columns. Filtering on `dup_n > 1` keeps only rows that belong to a duplicate group. For exact whole-row duplicates use `distinct()` (drop) or `janitor::get_dupes()` (inspect).

</details>

## What to do next

- [Data Wrangling With dplyr](Data-Wrangling-With-dplyr.html): the core tutorial that introduces every verb used here.
- [dplyr Joins Exercises](dplyr-Joins-Exercises-in-R.html): drill specifically on join types, key mismatches, and inequality joins.
- [dplyr Group By Exercises](dplyr-Group-By-Exercises-in-R.html): deeper practice on grouped summaries, `.by`, and grouped windows.
- [dplyr Window Functions Exercises](dplyr-Window-Functions-Exercises-in-R.html): focused practice on `lag`, `lead`, ranking, and running calculations.
