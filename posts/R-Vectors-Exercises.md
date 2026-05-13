---
title: "R Vectors Exercises: 18 Hands-On Problems with Worked Solutions"
slug: "R-Vectors-Exercises"
description: "18 interactive R vector exercises with worked answers: creation, coercion, indexing, named vectors, recycling, NA handling, z-scoring, and binning."
keywords: "R vectors exercises, R vector practice problems, R indexing exercises, R recycling exercises, R named vector practice, R NA handling exercises"
mathjax: false
webr: true
date: "2026-05-13"
curriculum_id: "E1.2"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Vectors (18 problems)"
sidebar_order: 150
fr_parent: "R-Vectors.html"
auto_link_terms: "R vectors exercises|R vector practice|R indexing exercises|R recycling exercises|named vector in R"
auto_link_case_sensitive: false
target_keyword: "R vectors exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Vectors Exercises: 18 Hands-On Problems with Worked Solutions

<p class="lead">Eighteen runnable exercises covering the full vector workflow in R: creation, coercion, positive and logical indexing, named lookups, vectorised arithmetic, recycling, NA handling, and real-world workflows like z-scoring and binning. Solutions are hidden until you click. Code blocks share state across the page, so variables defined early are available later.</p>

Vectors are the single most important data structure in R. Scalars are length-one vectors, data frame columns are vectors, and almost every base function is vectorised. Working through these exercises in order builds the intuition you need for dplyr, ggplot2, and modelling code that follows.

The difficulty mix is roughly three Beginner warm-ups, eleven Intermediate problems that match the questions analysts hit on the job, and four Advanced workflows that combine three or four ideas at once. Run each block as you go.

```r title="Run this once before any exercise"
library(stats)
set.seed(42)
```

## Section 1. Creating and inspecting vectors (3 problems)

### Exercise 1.1: Build the same sequence four ways and verify equality

**Task:** Create the numeric sequence `1, 2, 3, ..., 10` four different ways: with `c()`, with the `:` shortcut, with `seq()`, and with `seq_len()`. Then use `identical()` to test which pairs are truly identical (values AND storage type). Save the four vectors to `ex_1_1` as a named list so the comparisons are easy to inspect.

**Expected result:**

```
#> $v1 -> double:  1  2  3  4  5  6  7  8  9 10
#> $v2 -> integer: 1  2  3  4  5  6  7  8  9 10
#> $v3 -> double:  1  2  3  4  5  6  7  8  9 10
#> $v4 -> integer: 1  2  3  4  5  6  7  8  9 10
#> identical(v1, v3) : TRUE   # both double
#> identical(v2, v4) : TRUE   # both integer
#> identical(v1, v2) : FALSE  # same values, different storage type
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- list(
  v1 = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
  v2 = 1:10,
  v3 = seq(1, 10, by = 1),
  v4 = seq_len(10)
)

sapply(ex_1_1, typeof)
identical(ex_1_1$v1, ex_1_1$v3)
identical(ex_1_1$v2, ex_1_1$v4)
identical(ex_1_1$v1, ex_1_1$v2)
#> [1] TRUE
#> [1] TRUE
#> [1] FALSE
```

**Explanation:** `c(1, 2, ...)` and `seq()` produce double-precision vectors because the literals `1`, `2`, ... are doubles by default. The `:` operator and `seq_len()` produce integer vectors. The values print identically but `identical()` checks storage type as well as numerical equality, which is why the cross-type comparison returns `FALSE`. Use `L` suffixes (`1L:10L`) or `as.integer()` when you need integer storage.

</details>

### Exercise 1.2: Predict type coercion in mixed c() calls

**Task:** Run `typeof()` on each of these five calls and predict the result before checking: `c(1, 2, 3)`, `c(1L, 2L, 3L)`, `c(1, 2L, 3)`, `c(1, "2", 3)`, `c(1, TRUE, 3)`. Save the five returned type strings as a character vector to `ex_1_2`. The point is to internalise R's coercion hierarchy without looking it up every time.

**Expected result:**

```
#> [1] "double"    "integer"   "double"    "character" "double"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- c(
  typeof(c(1, 2, 3)),
  typeof(c(1L, 2L, 3L)),
  typeof(c(1, 2L, 3)),
  typeof(c(1, "2", 3)),
  typeof(c(1, TRUE, 3))
)
ex_1_2
#> [1] "double"    "integer"   "double"    "character" "double"
```

**Explanation:** R coerces along the hierarchy `logical < integer < double < character`. `c()` picks the most general type present, so a single character literal forces everything to character and a single double demotes integers. The trap is `c(1, "2", 3)`: the middle string silently turns numeric values into the strings `"1"` and `"3"`, which then fail arithmetic downstream. Validate input types with `is.numeric()` before doing math on untrusted vectors.

</details>

### Exercise 1.3: Audit a seq() with length, head, and tail

**Task:** Create `prices <- seq(5, 100, by = 5)` and report three quick diagnostics: the total length, the first three values, and the last three values. Combine them into a named list and save to `ex_1_3`. This is the kind of one-line audit you write at the top of every analysis to confirm an input vector is the shape you expect.

**Expected result:**

```
#> $len
#> [1] 20
#> $first3
#> [1]  5 10 15
#> $last3
#> [1]  90  95 100
```

**Difficulty:** Beginner

```r title="Your turn"
prices <- seq(5, 100, by = 5)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- seq(5, 100, by = 5)
ex_1_3 <- list(
  len    = length(prices),
  first3 = head(prices, 3),
  last3  = tail(prices, 3)
)
ex_1_3
#> $len
#> [1] 20
#> $first3
#> [1]  5 10 15
#> $last3
#> [1]  90  95 100
```

**Explanation:** `length()`, `head()`, and `tail()` are the three cheapest checks you can run on an unknown vector. Together they confirm "right size, right start, right end" in three lines. `head()` and `tail()` default to six elements, so pass `n = 3` (or just `3`) when you want a tighter peek. For data frames the same trio works because `length()` returns the column count and `head()`/`tail()` slice rows.

</details>

## Section 2. Indexing and subsetting (4 problems)

### Exercise 2.1: Positional and contiguous slice on a price ladder

**Task:** A jeweller is preparing a sale flyer using the `prices` vector from Exercise 1.3 (a 20-step price ladder from 5 to 100). Pull two slices: the prices at positions 1, 5, and 10 (the "anchor" tiers shown in the flyer), and the contiguous block from positions 11 through 15 (the mid-tier upsell band). Save both as a named list to `ex_2_1`.

**Expected result:**

```
#> $anchors
#> [1]  5 25 50
#> $upsell_band
#> [1] 55 60 65 70 75
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- list(
  anchors     = prices[c(1, 5, 10)],
  upsell_band = prices[11:15]
)
ex_2_1
#> $anchors
#> [1]  5 25 50
#> $upsell_band
#> [1] 55 60 65 70 75
```

**Explanation:** A vector of indices inside `[ ]` returns elements in the order requested, so `prices[c(1, 5, 10)]` is positional and `prices[c(10, 5, 1)]` reverses the order. The `:` shortcut builds a contiguous integer vector, making `prices[11:15]` the idiomatic way to pull a window. For overlapping or repeated picks (e.g., `prices[c(1, 1, 2)]`) the values repeat in the output: this is how `c()` with index vectors differs from set membership.

</details>

### Exercise 2.2: Drop the last two elements two ways

**Task:** Using `prices`, return everything except the last two elements. Solve it twice: once with a negative index built from `length()`, and once with `head()` using a negative count. Confirm the two approaches return the same vector by using `identical()`. Save a list with both vectors and the equality check to `ex_2_2`.

**Expected result:**

```
#> $neg_idx
#>  [1]  5 10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 85 90
#> $head_neg
#>  [1]  5 10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 85 90
#> $same
#> [1] TRUE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- length(prices)
ex_2_2 <- list(
  neg_idx  = prices[-c(n - 1, n)],
  head_neg = head(prices, -2),
  same     = identical(prices[-c(n - 1, n)], head(prices, -2))
)
ex_2_2
#> $same
#> [1] TRUE
```

**Explanation:** Negative indexing means "exclude these positions". `prices[-1]` drops the first element, `prices[-c(n-1, n)]` drops the last two. `head(x, -k)` and `tail(x, -k)` accept negative counts as a cleaner idiom for trimming. Both produce the same result, but the `head(prices, -2)` form is more readable in pipelines and harder to off-by-one. Mixing positive and negative indices in the same call is an error: pick one or the other.

</details>

### Exercise 2.3: Compound logical filter on a price band

**Task:** A marketing analyst is targeting the "mid-band" customers and needs the `prices` values strictly greater than 30 AND strictly less than 75. Build a logical vector using `&`, then use it to subset `prices`. Save the resulting numeric vector to `ex_2_3`. Important: do NOT use `&&`. That is the scalar form for single `if` conditions.

**Expected result:**

```
#> [1] 35 40 45 50 55 60 65 70
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- prices[prices > 30 & prices < 75]
ex_2_3
#> [1] 35 40 45 50 55 60 65 70
```

**Explanation:** `&` and `|` are element-wise, returning a logical vector the same length as their inputs. `&&` and `||` collapse to a single TRUE/FALSE and only look at the first element of each side: using them inside `[ ]` silently filters by one comparison and drops the rest. The condition `x > 30 & x < 75` is far cleaner than `between(x, 30, 75)` (which is dplyr) when you only need base R, and it's compiler-friendly because both comparisons short-circuit on FALSE.

</details>

### Exercise 2.4: Use which() to locate failing tests in a QA batch

**Task:** A QA engineer ran 15 unit tests and stores the pass/fail outcomes as the logical vector `results <- c(TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE)`. Report two things: the positions (test numbers) that failed, and the count of failures. Save both as a named list to `ex_2_4`. This is the standard "where did it break?" lookup pattern.

**Expected result:**

```
#> $failed_positions
#> [1]  3  7 12 15
#> $failure_count
#> [1] 4
```

**Difficulty:** Intermediate

```r title="Your turn"
results <- c(TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE,
             TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
results <- c(TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, TRUE,
             TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, FALSE)

ex_2_4 <- list(
  failed_positions = which(!results),
  failure_count    = sum(!results)
)
ex_2_4
#> $failed_positions
#> [1]  3  7 12 15
#> $failure_count
#> [1] 4
```

**Explanation:** `which()` converts a logical vector to the integer positions where it is TRUE. Negating with `!` flips the mask before passing in, so `which(!results)` gives the failing positions. For the count, `sum()` on a logical coerces TRUE to 1 and FALSE to 0, so `sum(!results)` counts failures without an explicit loop. This logical-to-position trick is the foundation of dplyr's `slice()` and `filter()` semantics.

</details>

## Section 3. Named vectors and lookups (3 problems)

### Exercise 3.1: Three lookups on a named population vector

**Task:** A policy analyst keeps populations in millions in a named vector: `pop <- c(USA = 331, China = 1412, India = 1417, Brazil = 215, Nigeria = 223)`. Pull three things: India's population by name, the values for USA and Nigeria in a single subset call, and the country names whose population exceeds 300 million. Save the three results as a named list to `ex_3_1`.

**Expected result:**

```
#> $india
#> India
#>  1417
#> $usa_nigeria
#>     USA Nigeria
#>     331     223
#> $over_300m
#> [1] "USA"   "China" "India"
```

**Difficulty:** Intermediate

```r title="Your turn"
pop <- c(USA = 331, China = 1412, India = 1417, Brazil = 215, Nigeria = 223)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pop <- c(USA = 331, China = 1412, India = 1417, Brazil = 215, Nigeria = 223)

ex_3_1 <- list(
  india       = pop["India"],
  usa_nigeria = pop[c("USA", "Nigeria")],
  over_300m   = names(pop)[pop > 300]
)
ex_3_1
```

**Explanation:** Character indexing on named vectors is one of R's most elegant features: `pop["India"]` works like a dictionary lookup, and the result preserves the name in the output. `names(pop)[pop > 300]` shows the pattern for "give me the labels of the matching values": apply the logical to `names()`, not to `pop` itself. The alternative `pop[pop > 300]` returns values with their names attached, which is useful when you want both.

</details>

### Exercise 3.2: Build a SKU price book and pull a basket

**Task:** A retailer maintains a named price book: SKU-A = 19.99, SKU-B = 24.99, SKU-C = 34.99, SKU-D = 49.99, SKU-E = 69.99, SKU-F = 89.99. Build it as a named numeric vector, then pull the prices for a customer basket containing SKU-A, SKU-C, and SKU-F in that order. Sum the basket to get the total. Save the basket vector and total as a named list to `ex_3_2`.

**Expected result:**

```
#> $basket
#> SKU-A SKU-C SKU-F
#> 19.99 34.99 89.99
#> $total
#> [1] 144.97
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
price_book <- c(
  `SKU-A` = 19.99, `SKU-B` = 24.99, `SKU-C` = 34.99,
  `SKU-D` = 49.99, `SKU-E` = 69.99, `SKU-F` = 89.99
)
basket_skus <- c("SKU-A", "SKU-C", "SKU-F")

ex_3_2 <- list(
  basket = price_book[basket_skus],
  total  = sum(price_book[basket_skus])
)
ex_3_2
```

**Explanation:** Backticks around `SKU-A` are required because the hyphen would otherwise be parsed as minus. The basket lookup is the canonical use case for named vectors: instead of an `if/else` cascade or a `match()` call, you index by the keys directly and the values come back in the requested order. For thousands of lookups, named vectors are faster than data frames because there's no row-search overhead.

</details>

### Exercise 3.3: Sort a named vector by name and by value

**Task:** Take the `pop` vector from Exercise 3.1. Produce two sorted versions: one sorted alphabetically by country name, and one sorted by population in descending order. The descending sort should keep the names attached so the result is still self-describing. Save both as a named list to `ex_3_3`.

**Expected result:**

```
#> $by_name
#>  Brazil   China   India Nigeria     USA
#>     215    1412    1417     223     331
#> $by_value_desc
#>   India   China     USA Nigeria  Brazil
#>    1417    1412     331     223     215
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- list(
  by_name       = pop[order(names(pop))],
  by_value_desc = sort(pop, decreasing = TRUE)
)
ex_3_3
```

**Explanation:** `sort()` works on the values and carries the names along, which is exactly what you want for the descending case. To sort by name instead, use `order(names(pop))` to get the permutation and index back in. `order()` is the more general tool because it returns positions (so you can apply the same permutation to a parallel vector). For ties or mixed-type sorts, pass multiple vectors to `order()`: it breaks ties on the second argument.

</details>

## Section 4. Vectorized arithmetic and recycling (3 problems)

### Exercise 4.1: Convert a Fahrenheit vector to Celsius

**Task:** A climatologist stores daily highs in Fahrenheit: `temps_f <- c(30, 40, 50, 60, 70, 80, 90, 100)`. Convert the whole vector to Celsius in one shot using the formula `(F - 32) * 5 / 9`. The point is to write the formula once and have R apply it element-wise without any loop. Save the resulting numeric vector to `ex_4_1`, rounded to two decimals.

**Expected result:**

```
#> [1] -1.11  4.44 10.00 15.56 21.11 26.67 32.22 37.78
```

**Difficulty:** Intermediate

```r title="Your turn"
temps_f <- c(30, 40, 50, 60, 70, 80, 90, 100)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
temps_f <- c(30, 40, 50, 60, 70, 80, 90, 100)
ex_4_1 <- round((temps_f - 32) * 5 / 9, 2)
ex_4_1
#> [1] -1.11  4.44 10.00 15.56 21.11 26.67 32.22 37.78
```

**Explanation:** Every arithmetic operator (`-`, `*`, `/`, `^`) is vectorised, so the scalar `32` is recycled across all eight elements automatically. There is no need for `sapply()` or a `for` loop. The compiled C code under the hood runs orders of magnitude faster than a manual loop in R. The same pattern handles columns in a data frame because columns are just vectors: `mtcars$mpg * 1.609` converts MPG to kilometres-per-litre across all rows in one expression.

</details>

### Exercise 4.2: The recycling trap with mismatched lengths

**Task:** Define `a <- c(1, 2, 3, 4)` and `b <- c(5, 6, 7)`. Compute `a + b` and capture both the result AND any warning that R emits. The result should NOT throw a hard error, but the mismatch produces a warning because 3 does not divide evenly into 4. Save the resulting numeric vector to `ex_4_2`, then write a comment explaining what value the 4th element holds and why.

**Expected result:**

```
#> Warning message:
#> In a + b : longer object length is not a multiple of shorter object length
#> [1]  6  8 10  9
#> # position 4: a[4] = 4 plus the recycled b[1] = 5 gives 9
```

**Difficulty:** Advanced

```r title="Your turn"
a <- c(1, 2, 3, 4)
b <- c(5, 6, 7)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- c(1, 2, 3, 4)
b <- c(5, 6, 7)

ex_4_2 <- a + b
ex_4_2
#> Warning message:
#> In a + b : longer object length is not a multiple of shorter object length
#> [1]  6  8 10  9
```

**Explanation:** R recycles the shorter vector to match the longer one. When the longer length is an exact multiple of the shorter (e.g., 6 and 3), there is no warning, which silently masks bugs. When it is not a multiple, R still does the operation but warns you. Position 4 holds `a[4] + b[1] = 4 + 5 = 9` because `b` wraps back to its first element. Always treat recycling warnings as errors: in production code, wrap risky arithmetic in `if (length(a) != length(b)) stop(...)` so a typo cannot quietly corrupt a result.

</details>

### Exercise 4.3: cumsum and diff for a daily P&L stream

**Task:** A trading desk tracks daily P&L for one week: `pnl <- c(250, -150, 280, 145, -245, 90)`. Compute two derived vectors that the risk team reads every morning. First, the running cumulative P&L starting from a Monday opening balance of 1000. Second, the day-over-day deltas (which equal `pnl` itself but force the student to use `diff()` on the cumulative series). Save both to `ex_4_3` as a named list.

**Expected result:**

```
#> $running_balance
#> [1] 1250 1100 1380 1525 1280 1370
#> $daily_delta
#> [1]  250 -150  280  145 -245   90
```

**Difficulty:** Intermediate

```r title="Your turn"
pnl <- c(250, -150, 280, 145, -245, 90)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pnl <- c(250, -150, 280, 145, -245, 90)

running_balance <- 1000 + cumsum(pnl)
daily_delta     <- diff(c(1000, running_balance))

ex_4_3 <- list(
  running_balance = running_balance,
  daily_delta     = daily_delta
)
ex_4_3
```

**Explanation:** `cumsum()` is the vectorised running total: it returns a vector the same length as its input. Adding the scalar `1000` shifts every element up by the opening balance, again thanks to recycling. `diff()` returns first differences, which is one element shorter than its input, so to recover the daily P&L we prepend the opening balance to the running series before calling `diff()`. These two operators together cover ~80% of time-series feature engineering in base R.

</details>

## Section 5. NA, NULL, and special values (3 problems)

### Exercise 5.1: NA propagation in mean and sum

**Task:** The ops team has a vector of response times in milliseconds with a couple of dropped measurements: `rt <- c(120, 95, NA, 140, 75, NA, 88)`. Compute three things: the default `mean(rt)` (which propagates NA), the NA-skipping mean via `na.rm = TRUE`, and the total of non-missing values via `sum(rt, na.rm = TRUE)`. Save all three to `ex_5_1` as a named list so the contrast is obvious.

**Expected result:**

```
#> $mean_default
#> [1] NA
#> $mean_narm
#> [1] 103.6
#> $sum_narm
#> [1] 518
```

**Difficulty:** Beginner

```r title="Your turn"
rt <- c(120, 95, NA, 140, 75, NA, 88)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rt <- c(120, 95, NA, 140, 75, NA, 88)

ex_5_1 <- list(
  mean_default = mean(rt),
  mean_narm    = mean(rt, na.rm = TRUE),
  sum_narm     = sum(rt, na.rm = TRUE)
)
ex_5_1
#> $mean_default
#> [1] NA
#> $mean_narm
#> [1] 103.6
#> $sum_narm
#> [1] 518
```

**Explanation:** NA propagation is contagious: any arithmetic that touches an NA returns NA unless the function explicitly knows to skip them. Most aggregators in base R (`mean`, `sum`, `sd`, `min`, `max`, `median`, `var`) accept `na.rm = TRUE` for that purpose. Silent NAs are the single most common reason a downstream model errors out with "input contains missing values", so the safer default in pipelines is to either drop them upstream or impute, not to silently `na.rm`.

</details>

### Exercise 5.2: Distinguish NA, NULL, NaN, and Inf

**Task:** Build a list containing one of each: `NA` (missing), `NULL` (absent), `NaN` (not-a-number, from `0/0`), and `Inf` (from `1/0`). For each value, run the four tests `is.na`, `is.null`, `is.nan`, and `is.finite` and store the four logical results. Save the lot as a list of four named logical vectors to `ex_5_2`. The point is to see which tests fire on which value.

**Expected result:**

```
#> $na      : is.na=TRUE  is.null=FALSE is.nan=FALSE is.finite=FALSE
#> $null    : is.na=logical(0) is.null=TRUE is.nan=logical(0) is.finite=logical(0)
#> $nan     : is.na=TRUE  is.null=FALSE is.nan=TRUE  is.finite=FALSE
#> $inf     : is.na=FALSE is.null=FALSE is.nan=FALSE is.finite=FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
test_one <- function(x) c(
  is.na     = is.na(x),
  is.null   = is.null(x),
  is.nan    = is.nan(x),
  is.finite = is.finite(x)
)

ex_5_2 <- list(
  na   = test_one(NA),
  null = test_one(NULL),
  nan  = test_one(0 / 0),
  inf  = test_one(1 / 0)
)
ex_5_2
```

**Explanation:** Two facts catch most beginners: `is.na(NaN)` is TRUE because NaN counts as a flavour of missing, and `is.null(NA)` is FALSE because NA is a value but NULL is the absence of a value. Tests applied to NULL return zero-length logicals because NULL has length zero. `is.finite(Inf)` is FALSE, which matters for ratio calculations where a denominator can hit zero. The defensive pattern is `x[is.finite(x)]` to keep only "real" numbers before averaging.

</details>

### Exercise 5.3: Last-observation-carried-forward on a sensor stream

**Task:** A sensor team has 10 hourly readings with intermittent dropouts: `sensor <- c(22.1, NA, 22.3, NA, NA, 22.8, NA, 23.1, NA, NA)`. Fill the NAs by carrying the most recent non-NA value forward (LOCF). Save the imputed numeric vector to `ex_5_3`. Constraint: write the loop yourself, do not use `zoo::na.locf` or `tidyr::fill`. The exercise is about understanding what those packages do under the hood.

**Expected result:**

```
#>  [1] 22.1 22.1 22.3 22.3 22.3 22.8 22.8 23.1 23.1 23.1
```

**Difficulty:** Advanced

```r title="Your turn"
sensor <- c(22.1, NA, 22.3, NA, NA, 22.8, NA, 23.1, NA, NA)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sensor <- c(22.1, NA, 22.3, NA, NA, 22.8, NA, 23.1, NA, NA)

ex_5_3 <- sensor
for (i in seq_along(ex_5_3)) {
  if (is.na(ex_5_3[i]) && i > 1) {
    ex_5_3[i] <- ex_5_3[i - 1]
  }
}
ex_5_3
#>  [1] 22.1 22.1 22.3 22.3 22.3 22.8 22.8 23.1 23.1 23.1
```

**Explanation:** LOCF is the simplest imputation method and the only one that respects time order without lookahead. The single-pass loop works because by the time we hit position `i`, position `i - 1` has already been filled (if it was NA, the previous iteration set it). The base-R vectorised trick uses `cummax` on a position index: `ex_5_3 <- sensor[cummax((!is.na(sensor)) * seq_along(sensor))]`. LOCF assumes the underlying signal is roughly piecewise-constant; for trending data, linear interpolation via `approx()` is usually better.

</details>

## Section 6. Real-world vector workflows (2 problems)

### Exercise 6.1: Z-score a vector and flag outliers

**Task:** The fraud team scores transaction amounts for outlier detection: `amounts <- c(45.0, 52.3, 47.8, 245.0, 49.1, 50.4, 9.2, 51.5, 48.9, 53.7)`. Compute the z-score of each amount (subtract the mean, divide by the standard deviation), then flag the values whose absolute z-score exceeds 2 as outliers. Save a list with two elements: `z` (numeric vector of z-scores) and `outliers` (numeric vector of original amounts that exceeded the threshold) to `ex_6_1`.

**Expected result:**

```
#> $z
#>  [1] -0.13  0.00 -0.08  3.46 -0.10 -0.08 -0.81 -0.07 -0.09  -0.06
#> $outliers
#> [1] 245.0   9.2
```

**Difficulty:** Advanced

```r title="Your turn"
amounts <- c(45.0, 52.3, 47.8, 245.0, 49.1, 50.4, 9.2, 51.5, 48.9, 53.7)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
amounts <- c(45.0, 52.3, 47.8, 245.0, 49.1, 50.4, 9.2, 51.5, 48.9, 53.7)

z <- (amounts - mean(amounts)) / sd(amounts)
ex_6_1 <- list(
  z        = round(z, 2),
  outliers = amounts[abs(z) > 2]
)
ex_6_1
```

**Explanation:** The z-score `(x - mean(x)) / sd(x)` is the workhorse of distance-based outlier detection. Because `mean` and `sd` themselves are pulled up by the outliers, a single extreme value (here 245.0) inflates the standard deviation and can mask other outliers. The robust alternative is the modified z-score using `median()` and `mad()`: `(x - median(x)) / mad(x)`. For very small samples (n < 30) or skewed distributions, prefer the IQR rule (`Q1 - 1.5 * IQR` and `Q3 + 1.5 * IQR`) over either z-score.

</details>

### Exercise 6.2: Bucket customers into segments with cut()

**Task:** A marketing analyst has 12 customer lifetime values: `clv <- c(120, 450, 88, 230, 890, 1250, 75, 340, 1100, 95, 560, 410)`. Bucket them into three named segments using `cut()`: "low" (less than 250), "mid" (250 to 800), and "high" (over 800). Use `table()` to count how many customers fall into each bucket. Save the segment factor and the count table as a named list to `ex_6_2`.

**Expected result:**

```
#> $segment
#>  [1] low  mid  low  low  high high low  mid  high low  mid  mid
#> Levels: low mid high
#> $counts
#>  low  mid high
#>    5    4    3
```

**Difficulty:** Advanced

```r title="Your turn"
clv <- c(120, 450, 88, 230, 890, 1250, 75, 340, 1100, 95, 560, 410)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
clv <- c(120, 450, 88, 230, 890, 1250, 75, 340, 1100, 95, 560, 410)

segment <- cut(
  clv,
  breaks = c(-Inf, 250, 800, Inf),
  labels = c("low", "mid", "high"),
  right  = FALSE
)

ex_6_2 <- list(
  segment = segment,
  counts  = table(segment)
)
ex_6_2
```

**Explanation:** `cut()` is the canonical way to turn a continuous numeric vector into an ordered factor with labeled bins. Using `-Inf` and `Inf` as the outer breakpoints catches anything below the lowest cut or above the highest, so you never accidentally produce NAs. The `right = FALSE` flag makes intervals left-closed and right-open `[a, b)`, which matches how most product specs are written ("250 to 800 means at least 250 and below 800"). `table()` on a factor returns counts in factor-level order rather than alphabetical, preserving the low / mid / high reading direction.

</details>

## What to do next

- Read the parent tutorial: [R Vectors](R-Vectors.html) covers vector internals, attributes, and the recycling rule.
- Practice list and data frame indexing: [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) builds on vectorised thinking with `sapply`, `lapply`, and `mapply`.
- Move on to wrangling: [dplyr Exercises in R](dplyr-Exercises-in-R.html) applies the same filter, mutate, and group patterns to data frame columns (which are vectors).
- Stress-test your loop intuition: [Loops vs Vectorization Exercises in R](Loops-vs-Vectorization-Exercises-in-R.html) shows when an explicit loop beats a vectorised expression and when it doesn't.
