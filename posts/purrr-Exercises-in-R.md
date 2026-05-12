---
title: "purrr Exercises in R: 30 Real-World Practice Problems"
slug: "purrr-Exercises-in-R"
description: "Practice purrr with 30 real R problems: map, walk, reduce, safely, predicate functions and many-models patterns. Hidden solutions, runnable code."
keywords: "purrr exercises, purrr practice, map function R, R functional programming, many models in R, reduce in R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "purrr Exercises"
sidebar_order: 114
fr_parent: "purrr-map-in-R.html"
auto_link_terms: "purrr exercises|map function R|R functional programming|many models in R|reduce in R"
auto_link_case_sensitive: false
target_keyword: "purrr exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# purrr Exercises in R: 30 Real-World Practice Problems

<p class="lead">Thirty practice problems on purrr covering the map family, pmap and walk, reduce and accumulate, safely and possibly, predicate functions, and the nest plus map many-models workflow. Solutions are hidden; click to reveal after attempting each problem.</p>

```r title="Run this once before any exercise"
library(purrr)
library(dplyr)
library(tidyr)
library(tibble)
library(broom)
```

## Section 1. map family basics (5 problems)

### Exercise 1.1: Square integers 1 to 5 using map_dbl

**Task:** A junior analyst is learning the difference between `map()` and its type-stable variants. Use `map_dbl()` to square every integer in `1:5` and return a plain numeric vector (not a list). Save the result to `ex_1_1`.

**Expected result:**

```
#> [1]  1  4  9 16 25
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- map_dbl(1:5, ~ .x^2)
ex_1_1
#> [1]  1  4  9 16 25
```

**Explanation:** `map()` always returns a list; the typed suffixes (`map_dbl`, `map_int`, `map_chr`, `map_lgl`) coerce the result to an atomic vector and throw an error if any element is the wrong type. That type-check is the whole point: if the body silently produces an `NA` of the wrong shape, you find out immediately instead of three steps later. The `~ .x^2` is a one-sided formula shorthand for `function(x) x^2`.

</details>

### Exercise 1.2: Build padded ID strings with map_chr

**Task:** Convert the integer sequence `1:8` into zero-padded ID strings of the form `"id_001"`, `"id_002"`, and so on, using `map_chr()` with `sprintf()`. The output must be a character vector, not a list. Save the result to `ex_1_2`.

**Expected result:**

```
#> [1] "id_001" "id_002" "id_003" "id_004" "id_005" "id_006" "id_007" "id_008"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- map_chr(1:8, ~ sprintf("id_%03d", .x))
ex_1_2
#> [1] "id_001" "id_002" "id_003" "id_004" "id_005" "id_006" "id_007" "id_008"
```

**Explanation:** `map_chr()` enforces a length-1 character return per element; `sprintf("%03d", .x)` zero-pads to width 3. A common mistake is using `paste0("id_", .x)` which produces `"id_1"`, not `"id_001"`. For purely vectorised work you could skip `map_chr` and call `sprintf("id_%03d", 1:8)` directly. Reach for `map_chr` when the per-element logic is more complex than one vectorised call.

</details>

### Exercise 1.3: Count rows of every tibble in a list with map_int

**Task:** A data engineer has split a daily extract into a list of three tibbles by region. Build the list with `list(north = mtcars[1:5, ], south = mtcars[6:20, ], west = mtcars[21:32, ])`, then use `map_int()` to return the row count of each tibble as a named integer vector. Save the result to `ex_1_3`.

**Expected result:**

```
#> north south  west
#>     5    15    12
```

**Difficulty:** Intermediate

```r title="Your turn"
parts <- list(north = mtcars[1:5, ], south = mtcars[6:20, ], west = mtcars[21:32, ])
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
parts <- list(north = mtcars[1:5, ], south = mtcars[6:20, ], west = mtcars[21:32, ])
ex_1_3 <- map_int(parts, nrow)
ex_1_3
#> north south  west
#>     5    15    12
```

**Explanation:** Passing a bare function name like `nrow` is the cleanest form when the function takes a single argument; no formula or anonymous wrapper needed. `map_int` preserves the input names, which is essential for downstream joining or reporting. If even one element returned a double, `map_int` would error: that strictness catches schema drift the moment it occurs.

</details>

### Exercise 1.4: Flag groups with positive mean using map_lgl

**Task:** Given the list `groups <- list(a = c(1, -2, 4), b = c(-3, -5), c = c(0, 1, 2))`, use `map_lgl()` to return a named logical vector indicating which groups have a strictly positive mean. Save the result to `ex_1_4`.

**Expected result:**

```
#>     a     b     c
#>  TRUE FALSE  TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
groups <- list(a = c(1, -2, 4), b = c(-3, -5), c = c(0, 1, 2))
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
groups <- list(a = c(1, -2, 4), b = c(-3, -5), c = c(0, 1, 2))
ex_1_4 <- map_lgl(groups, ~ mean(.x) > 0)
ex_1_4
#>     a     b     c
#>  TRUE FALSE  TRUE
```

**Explanation:** `map_lgl()` is the right tool whenever you need a boolean filter aligned to the elements of a list. Combine it with `keep()` or `discard()` to retain only the groups that pass. A frequent mistake is using `sapply()` here, which would work but loses the type guarantee: a single non-logical return would silently mutate the result type.

</details>

### Exercise 1.5: Extract the first element of every nested vector

**Task:** A platform engineer is parsing log payloads represented as `payloads <- list(c(101, 50, 1), c(102, 75, 2), c(103, 60, 1), c(104, 90, 3))`. Each inner vector starts with a request ID. Use `map_int()` to pluck the first element of every entry and return the request IDs as an integer vector. Save the result to `ex_1_5`.

**Expected result:**

```
#> [1] 101 102 103 104
```

**Difficulty:** Intermediate

```r title="Your turn"
payloads <- list(c(101, 50, 1), c(102, 75, 2), c(103, 60, 1), c(104, 90, 3))
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
payloads <- list(c(101, 50, 1), c(102, 75, 2), c(103, 60, 1), c(104, 90, 3))
ex_1_5 <- map_int(payloads, 1L)
ex_1_5
#> [1] 101 102 103 104
```

**Explanation:** Passing an integer position to `map_*` is purrr's positional plucking shorthand: `map_int(x, 1L)` is equivalent to `map_int(x, ~ .x[[1]])` but shorter and faster. You can also pass a string for named extraction (`map_chr(x, "name")`) or a list of keys for deep extraction (`map(x, list("a", "b"))`). Using `1` instead of `1L` works at the top level but can produce type-coercion surprises with `map_int`.

</details>

## Section 2. Iterating over data frames and named lists (5 problems)

### Exercise 2.1: Compute mean of every numeric column of iris

**Task:** Use `map_dbl()` to compute the mean of every numeric column of `iris` (the first four columns are numeric, `Species` is a factor). Subset the data frame to drop `Species` before mapping. Save the named numeric result to `ex_2_1`.

**Expected result:**

```
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>     5.843333     3.057333     3.758000     1.199333
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- map_dbl(iris[, 1:4], mean)
ex_2_1
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>     5.843333     3.057333     3.758000     1.199333
```

**Explanation:** A data frame is a list of columns under the hood, so `map_*` iterates over columns by default. Including `Species` would error because `mean()` cannot handle a factor; dropping it via `iris[, 1:4]` keeps the call clean. In tidyverse-heavy code you would write `iris |> summarise(across(where(is.numeric), mean))` for the same effect; both styles are common.

</details>

### Exercise 2.2: Combine a list of tibbles row-wise with list_rbind

**Task:** A marketing analyst pulled three weekly sales extracts as separate tibbles: `w1 <- tibble(week = 1, sales = c(10, 12))`, `w2 <- tibble(week = 2, sales = c(15, 11))`, `w3 <- tibble(week = 3, sales = c(20, 18))`. Use `map()` (with an identity body) followed by `list_rbind()` to combine them into one long tibble. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>    week sales
#>   <dbl> <dbl>
#> 1     1    10
#> 2     1    12
#> 3     2    15
#> 4     2    11
#> 5     3    20
#> 6     3    18
```

**Difficulty:** Intermediate

```r title="Your turn"
w1 <- tibble(week = 1, sales = c(10, 12))
w2 <- tibble(week = 2, sales = c(15, 11))
w3 <- tibble(week = 3, sales = c(20, 18))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
w1 <- tibble(week = 1, sales = c(10, 12))
w2 <- tibble(week = 2, sales = c(15, 11))
w3 <- tibble(week = 3, sales = c(20, 18))
ex_2_2 <- list(w1, w2, w3) |> list_rbind()
ex_2_2
#> # A tibble: 6 x 2
#>    week sales
#>   <dbl> <dbl>
#> 1     1    10
#> 2     1    12
#> 3     2    15
#> 4     2    11
#> 5     3    20
#> 6     3    18
```

**Explanation:** `list_rbind()` superseded `map_dfr()` in purrr 1.0 and is the modern row-bind primitive. It is strict about column alignment: mismatched columns become `NA` rather than failing silently. Pass `names_to = "source"` to capture the list element names as a new column when the inputs are named. The pre-1.0 idiom `map_dfr(list(w1, w2, w3), identity)` still works but emits a deprecation lifecycle badge in fresh code.

</details>

### Exercise 2.3: Element-wise addition of two vectors with map2_dbl

**Task:** Given two same-length numeric vectors `revenue <- c(120, 150, 90, 210)` and `cost <- c(80, 100, 60, 150)`, use `map2_dbl()` to compute the profit per row as `revenue - cost`. Return a numeric vector of the same length. Save the result to `ex_2_3`.

**Expected result:**

```
#> [1] 40 50 30 60
```

**Difficulty:** Intermediate

```r title="Your turn"
revenue <- c(120, 150, 90, 210)
cost    <- c(80, 100, 60, 150)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
revenue <- c(120, 150, 90, 210)
cost    <- c(80, 100, 60, 150)
ex_2_3 <- map2_dbl(revenue, cost, ~ .x - .y)
ex_2_3
#> [1] 40 50 30 60
```

**Explanation:** `map2()` and its typed variants iterate over two parallel inputs of identical length; `.x` and `.y` reference the two arguments inside the formula body. For pure arithmetic the vectorised `revenue - cost` is simpler and faster, so reserve `map2_*` for cases where the body cannot be vectorised: per-row API calls, per-pair model fits, or branching logic. Lengths must match exactly; mismatches error rather than recycling.

</details>

### Exercise 2.4: Deep-pluck a nested field from an API response

**Task:** An API team receives JSON-like nested lists: `resp <- list(list(user = list(id = 1, name = "Asha")), list(user = list(id = 2, name = "Ben")), list(user = list(id = 3, name = "Cara")))`. Use `map_chr()` with deep extraction (the list-of-keys form) to pull out each `user$name`. Save the character vector to `ex_2_4`.

**Expected result:**

```
#> [1] "Asha" "Ben"  "Cara"
```

**Difficulty:** Advanced

```r title="Your turn"
resp <- list(
  list(user = list(id = 1, name = "Asha")),
  list(user = list(id = 2, name = "Ben")),
  list(user = list(id = 3, name = "Cara"))
)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- list(
  list(user = list(id = 1, name = "Asha")),
  list(user = list(id = 2, name = "Ben")),
  list(user = list(id = 3, name = "Cara"))
)
ex_2_4 <- map_chr(resp, list("user", "name"))
ex_2_4
#> [1] "Asha" "Ben"  "Cara"
```

**Explanation:** Passing a list as the `.f` argument tells purrr to walk the list of keys, so `list("user", "name")` is equivalent to `~ .x[["user"]][["name"]]`. For a robust version that survives missing keys, use `map_chr(resp, \(x) pluck(x, "user", "name", .default = NA_character_))`. The deep-pluck shorthand is one of the most underused features of purrr and replaces a lot of nested `lapply` boilerplate.

</details>

### Exercise 2.5: Map over rows of a tibble with pmap

**Task:** A reporting analyst needs one formatted summary line per row of a small jobs tibble: `jobs <- tibble(name = c("etl_daily", "report_weekly"), runtime_min = c(12, 45), status = c("OK", "WARN"))`. Use `pmap_chr()` to produce strings like `"etl_daily ran 12 min (OK)"`. Save the character vector to `ex_2_5`.

**Expected result:**

```
#> [1] "etl_daily ran 12 min (OK)"     "report_weekly ran 45 min (WARN)"
```

**Difficulty:** Intermediate

```r title="Your turn"
jobs <- tibble(name = c("etl_daily", "report_weekly"),
               runtime_min = c(12, 45),
               status = c("OK", "WARN"))
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
jobs <- tibble(name = c("etl_daily", "report_weekly"),
               runtime_min = c(12, 45),
               status = c("OK", "WARN"))
ex_2_5 <- pmap_chr(jobs, \(name, runtime_min, status) {
  sprintf("%s ran %d min (%s)", name, runtime_min, status)
})
ex_2_5
#> [1] "etl_daily ran 12 min (OK)"     "report_weekly ran 45 min (WARN)"
```

**Explanation:** `pmap_*` iterates row-wise over any data frame or list of equal-length vectors, binding column names to function arguments. The anonymous-function form `\(name, runtime_min, status)` is the modern lambda syntax (R >= 4.1) and is preferred over `function(name, runtime_min, status)` for readability. If you do not care about column order, the spreadsheet-like `..1`, `..2`, `..3` shorthand also works inside a formula body.

</details>

## Section 3. pmap, walk, and side effects (5 problems)

### Exercise 3.1: Use walk to print side-effect messages

**Task:** A code reviewer wants the iteration that prints status messages to leave the pipeline unchanged. Use `walk()` over the character vector `c("loaded", "transformed", "validated")` to `cat()` each value followed by a newline. The expression must return the input invisibly, not a list of `NULL`. Save the (invisible) result to `ex_3_1`.

**Expected result:**

```
#> loaded
#> transformed
#> validated
#> # ex_3_1 is invisibly the input vector
#> ex_3_1
#> [1] "loaded"      "transformed" "validated"
```

**Difficulty:** Intermediate

```r title="Your turn"
steps <- c("loaded", "transformed", "validated")
ex_3_1 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
steps <- c("loaded", "transformed", "validated")
ex_3_1 <- walk(steps, ~ cat(.x, "\n"))
ex_3_1
#> loaded
#> transformed
#> validated
#> [1] "loaded"      "transformed" "validated"
```

**Explanation:** `walk()` is `map()` for side effects: it runs the function for its action (printing, writing files, logging), discards the per-call return value, and returns the input invisibly so the call slots into a pipe. Using `map()` here would build a list of `NULL` values for nothing. The invisible return is what lets `walk()` chain naturally: `x |> walk(write_csv, path) |> mutate(...)`.

</details>

### Exercise 3.2: Use iwalk to access list element names

**Task:** Given the named numeric vector `metrics <- c(latency = 120, errors = 3, throughput = 1500)`, use `iwalk()` to print one line per metric formatted as `"latency: 120"`. The output expression should return `metrics` invisibly. Save the result to `ex_3_2`.

**Expected result:**

```
#> latency: 120
#> errors: 3
#> throughput: 1500
```

**Difficulty:** Intermediate

```r title="Your turn"
metrics <- c(latency = 120, errors = 3, throughput = 1500)
ex_3_2 <- # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
metrics <- c(latency = 120, errors = 3, throughput = 1500)
ex_3_2 <- iwalk(metrics, ~ cat(.y, ": ", .x, "\n", sep = ""))
ex_3_2
#> latency: 120
#> errors: 3
#> throughput: 1500
```

**Explanation:** `iwalk()` is the indexed variant of `walk()`: `.x` holds the value and `.y` holds the name (or position, if unnamed). The same `i` prefix exists on `imap()`, giving you index-aware mapping when you need labels in the output. Without the prefix variants you would need `walk2(metrics, names(metrics), ...)`, which works but is twice as much typing.

</details>

### Exercise 3.3: pmap over simulation parameters to build a tibble

**Task:** A pharmacology team wants to run three small dosage simulations defined by `params <- tibble(dose = c(10, 25, 50), n = c(20, 20, 20), seed = c(1, 2, 3))`. For each row, draw `n` normal samples with mean `dose` and standard deviation 2 after `set.seed(seed)`, then return a tibble with columns `dose`, `mean_obs`, `sd_obs`. Use `pmap()` and combine via `list_rbind()`. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>    dose mean_obs sd_obs
#>   <dbl>    <dbl>  <dbl>
#> 1    10    10.3    2.04
#> 2    25    24.8    2.01
#> 3    50    49.9    1.84
```

**Difficulty:** Advanced

```r title="Your turn"
params <- tibble(dose = c(10, 25, 50), n = c(20, 20, 20), seed = c(1, 2, 3))
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
params <- tibble(dose = c(10, 25, 50), n = c(20, 20, 20), seed = c(1, 2, 3))
ex_3_3 <- params |>
  pmap(\(dose, n, seed) {
    set.seed(seed)
    samp <- rnorm(n, mean = dose, sd = 2)
    tibble(dose = dose, mean_obs = mean(samp), sd_obs = sd(samp))
  }) |>
  list_rbind()
ex_3_3
#> # A tibble: 3 x 3
#>    dose mean_obs sd_obs
#>   <dbl>    <dbl>  <dbl>
#> 1    10    10.3    2.04
#> 2    25    24.8    2.01
#> 3    50    49.9    1.84
```

**Explanation:** Wrapping `pmap()` plus `list_rbind()` is the canonical purrr pattern for row-wise simulations that return tibbles. Setting the seed inside the per-row function gives reproducibility per parameter set while keeping the rows independent. A common pitfall is forgetting `list_rbind()`, leaving you with a list of one-row tibbles instead of a single combined frame.

</details>

### Exercise 3.4: Map over columns with imap for named labels

**Task:** Use `imap_chr()` on the numeric columns of `iris` (the first four columns) to produce label strings of the form `"Sepal.Length avg=5.84"`, rounding the mean to two decimals. Save the resulting character vector to `ex_3_4`.

**Expected result:**

```
#> [1] "Sepal.Length avg=5.84" "Sepal.Width avg=3.06"
#> [3] "Petal.Length avg=3.76" "Petal.Width avg=1.2"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- imap_chr(iris[, 1:4], ~ paste0(.y, " avg=", round(mean(.x), 2)))
ex_3_4
#> [1] "Sepal.Length avg=5.84" "Sepal.Width avg=3.06"
#> [3] "Petal.Length avg=3.76" "Petal.Width avg=1.2"
```

**Explanation:** Because a data frame is a named list of columns, `imap_*` binds the column name to `.y` and the column values to `.x` per call. This produces compact labelled summaries useful for chart annotations or report footers. If you needed both a summary value and a label separately, swap `imap_chr` for `imap_dfr` and build a two-column tibble instead.

</details>

### Exercise 3.5: pmap with default arguments and a list input

**Task:** Given the parameter list `cfg <- list(c(x = 2, y = 3), c(x = 5, y = 1), c(x = 4, y = 4))`, use `pmap_dbl()` to compute `x^y` for each entry. The input is a list of named numeric vectors rather than a tibble. Save the numeric result to `ex_3_5`.

**Expected result:**

```
#> [1]   8   5 256
```

**Difficulty:** Advanced

```r title="Your turn"
cfg <- list(c(x = 2, y = 3), c(x = 5, y = 1), c(x = 4, y = 4))
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cfg <- list(c(x = 2, y = 3), c(x = 5, y = 1), c(x = 4, y = 4))
ex_3_5 <- pmap_dbl(transpose(cfg), \(x, y) x^y)
ex_3_5
#> [1]   8   5 256
```

**Explanation:** `pmap()` expects its `.l` argument to be a list of parallel inputs (think columns), not a list of records (rows). `transpose()` flips a list of named vectors into the column-oriented shape `pmap()` needs. Skipping `transpose()` is the single most common pmap mistake: the call still runs but binds the wrong values to `x` and `y`, often producing wrong but not error-flagged output.

</details>

## Section 4. reduce and accumulate (5 problems)

### Exercise 4.1: Sum a vector with reduce

**Task:** Use `reduce()` to sum the integers `1:10` by repeatedly applying the binary `+` operator. The point is to learn the reduce pattern, not to call `sum()` directly. Save the scalar result to `ex_4_1` and confirm it matches `sum(1:10)`.

**Expected result:**

```
#> ex_4_1
#> [1] 55
#> identical(ex_4_1, sum(1:10))
#> [1] TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- reduce(1:10, `+`)
ex_4_1
#> [1] 55
identical(ex_4_1, sum(1:10))
#> [1] TRUE
```

**Explanation:** `reduce()` walks left to right, folding each element into an accumulator via a two-argument function. Passing the bare operator with backticks (`` `+` ``) is the idiomatic shorthand. The same pattern generalises to non-trivial reductions: `reduce(list_of_dfs, full_join)` joins many tables, `reduce(list_of_paths, file.path)` joins path fragments. Use `accumulate()` instead when you want every intermediate value, not just the final one.

</details>

### Exercise 4.2: Full-join a list of three tibbles with reduce

**Task:** A finance team has three small tibbles keyed by `account_id`: `bal <- tibble(account_id = 1:3, balance = c(100, 200, 300))`, `tx <- tibble(account_id = c(1, 3), tx_count = c(5, 2))`, `kyc <- tibble(account_id = c(2, 3), kyc_score = c(0.8, 0.95))`. Use `reduce()` with `dplyr::full_join` to merge them all on `account_id`. Save the joined tibble to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   account_id balance tx_count kyc_score
#>        <int>   <dbl>    <dbl>     <dbl>
#> 1          1     100        5     NA
#> 2          2     200       NA      0.8
#> 3          3     300        2      0.95
```

**Difficulty:** Advanced

```r title="Your turn"
bal <- tibble(account_id = 1:3, balance = c(100, 200, 300))
tx  <- tibble(account_id = c(1, 3), tx_count = c(5, 2))
kyc <- tibble(account_id = c(2, 3), kyc_score = c(0.8, 0.95))
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bal <- tibble(account_id = 1:3, balance = c(100, 200, 300))
tx  <- tibble(account_id = c(1, 3), tx_count = c(5, 2))
kyc <- tibble(account_id = c(2, 3), kyc_score = c(0.8, 0.95))
ex_4_2 <- reduce(list(bal, tx, kyc), full_join, by = "account_id")
ex_4_2
#> # A tibble: 3 x 4
#>   account_id balance tx_count kyc_score
#>        <int>   <dbl>    <dbl>     <dbl>
#> 1          1     100        5     NA
#> 2          2     200       NA      0.8
#> 3          3     300        2      0.95
```

**Explanation:** Reducing a list of tibbles with `full_join` is the canonical "join many tables on a common key" pattern and scales linearly with the number of inputs. Trailing arguments after the reduce function (`by = "account_id"`) are passed through to every call. For inner joins, swap to `inner_join`; the choice of join controls whether rows from any single table can drop or fill with `NA`.

</details>

### Exercise 4.3: Running maximum with accumulate

**Task:** A trading desk wants the daily running maximum of a price series `prices <- c(100, 102, 98, 105, 103, 110, 108)`. Use `accumulate()` with the binary `max` function to return a numeric vector of the same length, where each element is the max of all prices seen up to that point. Save the result to `ex_4_3`.

**Expected result:**

```
#> [1] 100 102 102 105 105 110 110
```

**Difficulty:** Intermediate

```r title="Your turn"
prices <- c(100, 102, 98, 105, 103, 110, 108)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- c(100, 102, 98, 105, 103, 110, 108)
ex_4_3 <- accumulate(prices, max)
ex_4_3
#> [1] 100 102 102 105 105 110 110
```

**Explanation:** `accumulate()` is `reduce()` that keeps every intermediate state. The length of the output equals the length of the input, which makes it ideal for cumulative statistics: running max, running min, cumulative product, drawdown calculation. Base R offers `cummax`, `cummin`, `cumprod` for the common cases, but `accumulate()` generalises to any associative binary operation including user-defined ones.

</details>

### Exercise 4.4: reduce2 with weights per step

**Task:** Given values `vals <- c(10, 20, 30, 40)` and weights `wts <- c(0.5, 0.3, 0.2)` (three weights, one per merge step), use `reduce2()` to compute a weighted running combine where each step does `acc + w * x`. Start from the first value, then fold the remaining three. Save the scalar result to `ex_4_4`.

**Expected result:**

```
#> ex_4_4
#> [1] 37
```

**Difficulty:** Advanced

```r title="Your turn"
vals <- c(10, 20, 30, 40)
wts  <- c(0.5, 0.3, 0.2)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vals <- c(10, 20, 30, 40)
wts  <- c(0.5, 0.3, 0.2)
ex_4_4 <- reduce2(vals, wts, \(acc, x, w) acc + w * x)
ex_4_4
#> [1] 37
```

**Explanation:** `reduce2()` walks two parallel sequences: `vals` is the main input and `wts` carries one extra value per fold step. Crucially, `wts` must be exactly one shorter than `vals` because the first element of `vals` seeds the accumulator and no weight is consumed for the seed. The fold sequence here is `10 -> 10 + 0.5*20 = 20 -> 20 + 0.3*30 = 29 -> 29 + 0.2*40 = 37`. Use `reduce2()` whenever a fold needs a parameter that varies per step: learning rates, decay weights, or join keys that change per table.

</details>

### Exercise 4.5: Safe reduce with .init for empty inputs

**Task:** A reliability engineer is hardening a function that joins an arbitrary list of tibbles. Wrap `reduce(list_of_dfs, dplyr::bind_rows)` with the `.init` argument so that an empty input list returns an empty tibble instead of crashing. Test it with both a non-empty list (`list(tibble(a = 1), tibble(a = 2))`) and an empty list. Save the result for the empty case to `ex_4_5`.

**Expected result:**

```
#> # A tibble: 0 x 0
```

**Difficulty:** Intermediate

```r title="Your turn"
safe_combine <- function(dfs) {
  # your code here
}
ex_4_5 <- safe_combine(list())
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_combine <- function(dfs) {
  reduce(dfs, bind_rows, .init = tibble())
}
ex_4_5 <- safe_combine(list())
ex_4_5
#> # A tibble: 0 x 0

safe_combine(list(tibble(a = 1), tibble(a = 2)))
#> # A tibble: 2 x 1
#>       a
#>   <dbl>
#> 1     1
#> 2     2
```

**Explanation:** Without `.init`, `reduce()` on an empty list raises an error because there is nothing to seed the accumulator from. Supplying `.init = tibble()` gives the reduction a safe starting value that combines cleanly with the first real element. This pattern is the standard defence for production code that aggregates a dynamically sized list, especially when the upstream filter may yield zero matches on a slow day.

</details>

## Section 5. safely, possibly, and error handling (5 problems)

### Exercise 5.1: Wrap log with safely for vector of mixed inputs

**Task:** A data engineer wants to apply `log()` to a vector that may contain non-positive values without halting the pipeline. Wrap `log` with `safely()`, then `map()` over `c(2, 5, 0, -1, 10)`. The output should be a list where each element has a `result` and an `error` slot. Save the list to `ex_5_1`.

**Expected result:**

```
#> # ex_5_1[[1]]$result is log(2); ex_5_1[[1]]$error is NULL
#> # ex_5_1[[3]] result is -Inf (no error), ex_5_1[[4]] result is NaN (warning, no error)
#> str(ex_5_1, max.level = 2)
#> List of 5
#>  $ :List of 2
#>   ..$ result: num 0.693
#>   ..$ error : NULL
#>  $ :List of 2
#>   ..$ result: num 1.61
#>   ..$ error : NULL
#>  $ :List of 2
#>   ..$ result: num -Inf
#>   ..$ error : NULL
#>  $ :List of 2
#>   ..$ result: num NaN
#>   ..$ error : NULL
#>  $ :List of 2
#>   ..$ result: num 2.3
#>   ..$ error : NULL
```

**Difficulty:** Intermediate

```r title="Your turn"
vals <- c(2, 5, 0, -1, 10)
ex_5_1 <- # your code here
str(ex_5_1, max.level = 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vals <- c(2, 5, 0, -1, 10)
safe_log <- safely(log)
ex_5_1 <- map(vals, safe_log)
str(ex_5_1, max.level = 2)
#> List of 5
#>  $ :List of 2
#>   ..$ result: num 0.693
#>   ..$ error : NULL
#>  ...
```

**Explanation:** `safely()` returns a new function whose output is always a two-slot list (`result` and `error`); one of them is always `NULL`. Note that `log(0)` and `log(-1)` do not throw R errors: they return `-Inf` and `NaN` with a warning, which is why `error` stays `NULL` here. Reach for `safely()` when the wrapped function genuinely throws (network calls, parsers, model fits with singular matrices); use `quietly()` if you want to capture warnings as well.

</details>

### Exercise 5.2: possibly to substitute a default on failure

**Task:** Build a fragile parser `parse_int <- function(x) as.integer(x) |> { if (is.na(.)) stop("bad") else . }()` and wrap it with `possibly()` returning `NA_integer_` on failure. Then `map_int()` over `c("1", "x", "3", "y", "5")`. The expression should never throw. Save the integer vector to `ex_5_2`.

**Expected result:**

```
#> [1]  1 NA  3 NA  5
```

**Difficulty:** Intermediate

```r title="Your turn"
parse_int <- function(x) {
  out <- suppressWarnings(as.integer(x))
  if (is.na(out)) stop("bad") else out
}
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
parse_int <- function(x) {
  out <- suppressWarnings(as.integer(x))
  if (is.na(out)) stop("bad") else out
}
safe_parse <- possibly(parse_int, otherwise = NA_integer_)
ex_5_2 <- map_int(c("1", "x", "3", "y", "5"), safe_parse)
ex_5_2
#> [1]  1 NA  3 NA  5
```

**Explanation:** `possibly()` is the trimmed-down sibling of `safely()`: it returns just the value (or your `otherwise` fallback on error), with no per-element error capture. The `NA_integer_` default keeps the typed result clean for `map_int`. If you also need to inspect the error messages later, prefer `safely()` and post-process; if you only need recovery, `possibly()` is half the code.

</details>

### Exercise 5.3: Split safely results with transpose

**Task:** Continuing from a `safely()` workflow, given `raw <- list(list(result = 1, error = NULL), list(result = NULL, error = "bad"), list(result = 3, error = NULL))`, use `transpose()` to flip the list-of-records into a list with two slots: `result` (a list of three) and `error` (a list of three). Save the transposed list to `ex_5_3`.

**Expected result:**

```
#> List of 2
#>  $ result:List of 3
#>   ..$ : num 1
#>   ..$ : NULL
#>   ..$ : num 3
#>  $ error :List of 3
#>   ..$ : NULL
#>   ..$ : chr "bad"
#>   ..$ : NULL
```

**Difficulty:** Advanced

```r title="Your turn"
raw <- list(
  list(result = 1, error = NULL),
  list(result = NULL, error = "bad"),
  list(result = 3, error = NULL)
)
ex_5_3 <- # your code here
str(ex_5_3, max.level = 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- list(
  list(result = 1, error = NULL),
  list(result = NULL, error = "bad"),
  list(result = 3, error = NULL)
)
ex_5_3 <- transpose(raw)
str(ex_5_3, max.level = 2)
#> List of 2
#>  $ result:List of 3
#>   ..$ : num 1
#>   ..$ : NULL
#>   ..$ : num 3
#>  $ error :List of 3
#>   ..$ : NULL
#>   ..$ : chr "bad"
#>   ..$ : NULL
```

**Explanation:** `transpose()` is the matrix-transpose analogue for lists of lists: it converts the outer-by-inner structure into inner-by-outer. The classic use case is pairing it with `safely()`: you get a list of `{result, error}` records back, transpose to two parallel lists, then process results and errors independently. Without `transpose()` you would need clumsy nested `map()` calls to extract each slot separately.

</details>

### Exercise 5.4: compact to drop NULLs from a map result

**Task:** After running `map(c(2, -1, 4, -2, 6), \(x) if (x > 0) sqrt(x) else NULL)`, you get a list with `NULL` placeholders for negatives. Use `compact()` to remove the `NULL` entries, leaving only the successful square roots. Save the cleaned list to `ex_5_4`.

**Expected result:**

```
#> [[1]]
#> [1] 1.414214
#>
#> [[2]]
#> [1] 2
#>
#> [[3]]
#> [1] 2.449490
```

**Difficulty:** Intermediate

```r title="Your turn"
raw <- map(c(2, -1, 4, -2, 6), \(x) if (x > 0) sqrt(x) else NULL)
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- map(c(2, -1, 4, -2, 6), \(x) if (x > 0) sqrt(x) else NULL)
ex_5_4 <- compact(raw)
ex_5_4
#> [[1]]
#> [1] 1.414214
#>
#> [[2]]
#> [1] 2
#>
#> [[3]]
#> [1] 2.449490
```

**Explanation:** `compact()` drops elements that match a predicate, defaulting to `is.null`. It is a one-line cleanup for the "skip on failure, return `NULL`" idiom, which is common when the failure mode is well-defined but the success path varies in type. Pair it with `possibly(.f, otherwise = NULL)` to get a clean drop-failures-and-keep-results pipeline.

</details>

### Exercise 5.5: quietly to capture warnings during a map

**Task:** An audit team needs the printed warning text from `log()` calls without letting warnings interrupt the run. Wrap `log` with `quietly()`, `map()` over `c(2, -1, 5)`, then pull out only the `warnings` slot from each result. Save the list of character vectors (one per input) to `ex_5_5`.

**Expected result:**

```
#> [[1]]
#> character(0)
#>
#> [[2]]
#> [1] "NaNs produced"
#>
#> [[3]]
#> character(0)
```

**Difficulty:** Advanced

```r title="Your turn"
quiet_log <- # your code here
ex_5_5 <- map(c(2, -1, 5), quiet_log) |> map("warnings")
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
quiet_log <- quietly(log)
ex_5_5 <- map(c(2, -1, 5), quiet_log) |> map("warnings")
ex_5_5
#> [[1]]
#> character(0)
#>
#> [[2]]
#> [1] "NaNs produced"
#>
#> [[3]]
#> character(0)
```

**Explanation:** `quietly()` returns a four-slot list (`result`, `output`, `warnings`, `messages`) capturing everything R would normally print. The string-indexing form `map(x, "warnings")` plucks one slot per element, giving you a list of character vectors. This is the right tool when you need to record warnings for audit trails or surface them on a status page rather than silently swallowing them.

</details>

## Section 6. predicates and many-models (5 problems)

### Exercise 6.1: keep only numeric columns of a tibble

**Task:** Use `keep()` on `iris` to retain only the columns that satisfy `is.numeric`. The result should be a data frame (technically a list of columns) of the four numeric columns. Save the result to `ex_6_1`.

**Expected result:**

```
#> # showing head:
#> 'data.frame':	150 obs. of  4 variables:
#>  $ Sepal.Length: num  5.1 4.9 4.7 4.6 5 5.4 4.6 5 4.4 4.9 ...
#>  $ Sepal.Width : num  3.5 3 3.2 3.1 3.6 3.9 3.4 3.4 2.9 3.1 ...
#>  $ Petal.Length: num  1.4 1.4 1.3 1.5 1.4 1.7 1.4 1.5 1.4 1.5 ...
#>  $ Petal.Width : num  0.2 0.2 0.2 0.2 0.2 0.4 0.3 0.2 0.2 0.1 ...
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_1 <- # your code here
str(ex_6_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- keep(iris, is.numeric)
str(ex_6_1)
#> 'data.frame':	150 obs. of  4 variables:
#>  $ Sepal.Length: num  5.1 4.9 4.7 4.6 5 5.4 4.6 5 4.4 4.9 ...
#>  $ Sepal.Width : num  3.5 3 3.2 3.1 3.6 3.9 3.4 3.4 2.9 3.1 ...
#>  $ Petal.Length: num  1.4 1.4 1.3 1.5 1.4 1.7 1.4 1.5 1.4 1.5 ...
#>  $ Petal.Width : num  0.2 0.2 0.2 0.2 0.2 0.4 0.3 0.2 0.2 0.1 ...
```

**Explanation:** `keep()` filters a list (or list-like data frame) by a predicate; `discard()` is the inverse. Both accept a function, a formula, or a named-shortcut. The tidyverse alternative `iris |> select(where(is.numeric))` does the same thing using tidyselect helpers and is preferred inside a dplyr pipeline. Standalone purrr is cleaner when you do not want to attach dplyr.

</details>

### Exercise 6.2: discard columns where every value is NA

**Task:** A data cleaning analyst loaded `df <- tibble(id = 1:4, name = c("a","b","c","d"), notes = NA_character_, score = c(10, 20, NA, 40))`. The `notes` column is fully `NA` and should be dropped. Use `discard()` with a predicate that returns `TRUE` when all values are `NA`. Save the cleaned tibble to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>      id name  score
#>   <int> <chr> <dbl>
#> 1     1 a        10
#> 2     2 b        20
#> 3     3 c        NA
#> 4     4 d        40
```

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(id = 1:4, name = c("a","b","c","d"),
             notes = NA_character_, score = c(10, 20, NA, 40))
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- tibble(id = 1:4, name = c("a","b","c","d"),
             notes = NA_character_, score = c(10, 20, NA, 40))
ex_6_2 <- discard(df, ~ all(is.na(.x)))
ex_6_2
#> # A tibble: 4 x 3
#>      id name  score
#>   <int> <chr> <dbl>
#> 1     1 a        10
#> 2     2 b        20
#> 3     3 c        NA
#> 4     4 d        40
```

**Explanation:** Use `discard()` when the predicate names the columns you want to drop; use `keep()` when it names the columns you want to retain. The formula `~ all(is.na(.x))` is the all-NA test most data cleaning notebooks reach for first. A common mistake is using `any(is.na(.x))`, which would discard any column with even a single missing value: almost always too aggressive.

</details>

### Exercise 6.3: every and some on a list of numeric vectors

**Task:** Given `groups <- list(c(1, 2, 3), c(-1, 0, 4), c(5, 5, 5))`, write two predicate checks: `all_positive` using `every()` to test if every vector has all positive values, and `any_constant` using `some()` to test if any vector has a single unique value. Save a named two-element logical vector `c(all_positive = ..., any_constant = ...)` to `ex_6_3`.

**Expected result:**

```
#> all_positive  any_constant
#>        FALSE          TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
groups <- list(c(1, 2, 3), c(-1, 0, 4), c(5, 5, 5))
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
groups <- list(c(1, 2, 3), c(-1, 0, 4), c(5, 5, 5))
ex_6_3 <- c(
  all_positive = every(groups, ~ all(.x > 0)),
  any_constant = some(groups, ~ length(unique(.x)) == 1)
)
ex_6_3
#> all_positive  any_constant
#>        FALSE          TRUE
```

**Explanation:** `every()` is `all()` lifted to lists with a predicate per element; `some()` is `any()` lifted the same way. They short-circuit (stop scanning as soon as the answer is determined), which matters on large lists where the predicate is expensive. The third sibling, `none()`, is sometimes clearer than `!some(...)` for guard clauses.

</details>

### Exercise 6.4: detect first failing element with detect_index

**Task:** A QA engineer has a list of validation results: `checks <- list(c(ok = TRUE, n = 100), c(ok = TRUE, n = 50), c(ok = FALSE, n = 25), c(ok = TRUE, n = 80))`. Use `detect_index()` to return the position of the first element whose `ok` field is `FALSE`. If no failure exists the function returns 0. Save the integer index to `ex_6_4`.

**Expected result:**

```
#> ex_6_4
#> [1] 3
```

**Difficulty:** Intermediate

```r title="Your turn"
checks <- list(c(ok = TRUE, n = 100), c(ok = TRUE, n = 50),
               c(ok = FALSE, n = 25), c(ok = TRUE, n = 80))
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
checks <- list(c(ok = TRUE, n = 100), c(ok = TRUE, n = 50),
               c(ok = FALSE, n = 25), c(ok = TRUE, n = 80))
ex_6_4 <- detect_index(checks, ~ !.x[["ok"]])
ex_6_4
#> [1] 3
```

**Explanation:** `detect()` returns the first matching element; `detect_index()` returns its position. Both accept a `.dir = "backward"` argument to scan right-to-left, which is handy for finding the most recent failure in a chronological log. Use `0` (the no-match sentinel) as a guard before indexing: `if (idx > 0) checks[[idx]]`.

</details>

### Exercise 6.5: Fit lm per cyl group with nest plus map

**Task:** A marketing analyst wants one separate `lm(mpg ~ wt)` fit per `cyl` group of `mtcars`. Group and nest the data, fit one model per group using `map()`, then use `broom::tidy()` inside another `map()` to extract a coefficient tibble per group. Finally `unnest()` the tidied output so the result is a long tibble with columns `cyl`, `term`, `estimate`, `std.error`, `statistic`, `p.value`. Save the result to `ex_6_5`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>     cyl term        estimate std.error statistic   p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>     <dbl>
#> 1     6 (Intercept)    28.4      4.18       6.79  0.00105
#> 2     6 wt             -2.78     1.33      -2.08  0.0918
#> 3     4 (Intercept)    39.6      4.35       9.10  0.0000777
#> 4     4 wt             -5.65     1.85      -3.05  0.0137
#> 5     8 (Intercept)    23.9      3.01       7.94  0.00000405
#> 6     8 wt             -2.19     0.739     -2.97  0.0118
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(
    model    = map(data, ~ lm(mpg ~ wt, data = .x)),
    tidied   = map(model, broom::tidy)
  ) |>
  select(cyl, tidied) |>
  unnest(tidied)
ex_6_5
#> # A tibble: 6 x 6
#>     cyl term        estimate std.error statistic   p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>     <dbl>
#> 1     6 (Intercept)    28.4      4.18       6.79  0.00105
#> 2     6 wt             -2.78     1.33      -2.08  0.0918
#> 3     4 (Intercept)    39.6      4.35       9.10  0.0000777
#> 4     4 wt             -5.65     1.85      -3.05  0.0137
#> 5     8 (Intercept)    23.9      3.01       7.94  0.00000405
#> 6     8 wt             -2.19     0.739     -2.97  0.0118
```

**Explanation:** The nest plus map plus unnest workflow is purrr's signature pattern for fitting many models in a tidy frame. Each row of the nested tibble holds one group's data plus its model object, so you can carry summary statistics, predictions, and diagnostics side by side. The same scaffolding scales to thousands of fits: swap `lm` for `glm`, `gam`, or any model-fitting function. For predictions per group, add `predicted = map2(model, data, predict)` and unnest that column instead.

</details>

## What to do next

You now have hands-on reps across the full purrr toolkit: the map family, side-effect iteration, reduction, robust error handling, and the nest-plus-map many-models pattern. Continue learning with these related resources:

- [purrr map() in R](purrr-map-in-R.html): the canonical reference for the `map` family.
- [purrr map() Variants](purrr-map-Variants.html): typed and indexed `map_*` deep dive.
- [purrr reduce in R](purrr-reduce-in-R.html): full coverage of `reduce`, `accumulate`, and `reduce2`.
- [Functional Programming in R](Functional-Programming-in-R.html): how `map`, `reduce`, and closures fit together.
