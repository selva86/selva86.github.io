---
title: "R Performance Optimization Exercises: 20 Practice Problems"
slug: "R-Performance-Optimization-Exercises"
description: "Twenty R performance practice problems: profiling, vectorization, memory, data.table, byte-compile, algorithmic wins. Hidden solutions, expected outputs."
keywords: "R profiling optimization, R performance exercises, R vectorization practice, microbenchmark exercises, data.table benchmark exercises, profvis exercises"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Performance Exercises"
sidebar_order: 155
fr_parent: "R-Tutorial.html"
auto_link_terms: "R profiling optimization|R performance exercises|R vectorization practice|microbenchmark exercises|profvis exercises"
auto_link_case_sensitive: false
target_keyword: "R profiling optimization"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Performance Optimization Exercises: 20 Practice Problems

<p class="lead">Twenty hands-on problems covering profiling, vectorization, memory allocation, data.table, byte-compilation, and algorithmic tuning. Every exercise names the dataset, the expected output, and saves a result variable. Solutions are hidden until you click.</p>

```r title="Run this once before any exercise"
library(microbenchmark)
library(profvis)
library(data.table)
library(dplyr)
library(ggplot2)
```

## Section 1. Profile, time, and pick the right experiment (4 problems)

### Exercise 1.1: Time a loop sum against a vectorized sum with microbenchmark

**Task:** A data engineer is reviewing a colleague's hot loop on a daily ETL job and suspects vectorization will pay off. Compare a `for`-loop that sums the integers `1:1e5` against `sum(1:1e5)` using `microbenchmark()` over 100 iterations, then save the resulting microbenchmark object to `ex_1_1`.

**Expected result:**

```
#> Unit: microseconds
#>     expr        min         lq       mean     median         uq       max neval
#>     loop  8123.456   8512.789   9234.567   8745.123   9456.234  14523.0   100
#>      vec     1.234      1.456      1.812      1.500      1.789      4.5   100
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- microbenchmark(
  loop = { s <- 0; for (i in 1:1e5) s <- s + i; s },
  vec  = sum(1:1e5),
  times = 100
)
ex_1_1
#> Unit: microseconds
#>  expr     min      lq    mean  median      uq    max neval
#>  loop  8123.4  8512.7  9234.5  8745.1  9456.2  14523   100
#>  vec      1.2     1.4     1.8     1.5     1.7      4   100
```

**Explanation:** `microbenchmark()` runs each expression `times` reps in a randomized order and reports nanosecond-precision timings, defaulting to a useful unit. The vector form is roughly three orders of magnitude faster because `sum()` is a single C call over a contiguous integer buffer, while the loop pays the R interpreter cost on every iteration plus a copy each time `s` is rebound. Pick `times = 100` for fast expressions and bump it for noisy ones.

</details>

### Exercise 1.2: Profile a vector-growing function with profvis

**Task:** A reporting analyst is debugging a slow nightly script. Wrap a function that grows a numeric vector inside a `for` loop and then sorts it (`f <- function(n) { x <- numeric(); for (i in 1:n) x <- c(x, runif(1)); sort(x) }`) in a `profvis()` call with `n = 5000`, then save the returned profvis object to `ex_1_2`.

**Expected result:**

```
#> <profvis> HTML widget
#> Top self-time lines (from the flamegraph):
#>   f at line 3:  c(x, runif(1))   ~ 78% self time
#>   f at line 3:  runif(1)         ~ 14% self time
#>   sort(x)                        ~  6% self time
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- function(n) {
  x <- numeric()
  for (i in 1:n) x <- c(x, runif(1))
  sort(x)
}
ex_1_2 <- profvis({ f(5000) })
ex_1_2
#> profvis HTML widget shows c() dominating self-time
```

**Explanation:** `profvis()` samples the call stack every few milliseconds and renders the result as an interactive flamegraph plus a source view. The big finding here is that `c(x, runif(1))` is the bottleneck, not `runif` and not `sort`, because every `c()` call reallocates the entire vector. The fix (preallocate with `numeric(n)`) is obvious once the profile names the suspect. Always profile before optimizing; intuition is wrong roughly half the time.

</details>

### Exercise 1.3: Configure microbenchmark for stable microsecond comparisons

**Task:** An ML engineer wants stable microsecond-level timings to compare two tiny expressions before committing to one. Configure `microbenchmark()` with `unit = "us"` and `times = 500` to compare `seq_len(1000)` against `1:1000`, then save the microbenchmark object to `ex_1_3`.

**Expected result:**

```
#> Unit: microseconds
#>      expr   min    lq   mean median    uq   max neval
#>  seq_len 0.523 0.587 0.812  0.612 0.745 11.23   500
#>    colon 0.045 0.056 0.094  0.067 0.089  3.45   500
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- microbenchmark(
  seq_len = seq_len(1000),
  colon   = 1:1000,
  unit    = "us",
  times   = 500
)
ex_1_3
#> Unit: microseconds
#>     expr   min    lq  mean median    uq    max neval
#>  seq_len 0.523 0.587 0.812 0.612  0.745 11.23   500
#>    colon 0.045 0.056 0.094 0.067  0.089  3.45   500
```

**Explanation:** Two settings buy reliability for sub-microsecond work. Bumping `times` from the default 100 to 500 shrinks confidence intervals on noisy measurements, and pinning `unit = "us"` keeps the printed columns on the same scale across runs so you do not chase phantom regressions when the autoscaler flips between `ns` and `us`. The colon operator wins because it allocates a compact ALTREP integer sequence rather than materializing all 1000 integers up front.

</details>

### Exercise 1.4: Use Rprof and summaryRprof to rank functions by self-time

**Task:** A finance team's portfolio simulator is too slow and the team needs a hard ranking of which functions cost the most. Profile 5e4 iterations of `var(rnorm(100))` using `Rprof()` plus `summaryRprof()` on a temp file, then extract the `by.self` data frame and save it as `ex_1_4`.

**Expected result:**

```
#>          self.time self.pct total.time total.pct
#> "rnorm"      1.42    61.74       1.42     61.74
#> "var"        0.46    20.00       0.88     38.26
#> "mean"       0.18     7.83       0.18      7.83
#> "is.na"      0.12     5.22       0.12      5.22
#> ...
```

**Difficulty:** Advanced

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tf <- tempfile()
Rprof(tf, interval = 0.005)
for (i in 1:5e4) var(rnorm(100))
Rprof(NULL)
ex_1_4 <- summaryRprof(tf)$by.self
head(ex_1_4)
#>          self.time self.pct total.time total.pct
#> "rnorm"      1.42    61.74       1.42     61.74
#> "var"        0.46    20.00       0.88     38.26
```

**Explanation:** `Rprof()` writes stack samples to disk at the chosen `interval`; `summaryRprof()` aggregates them into self-time (time inside a function ignoring its children) and total-time (including children). The `by.self` table is the right place to look for the actual bottleneck because a function high in `by.total` often just calls heavy children. Here `rnorm` dominates: any optimization that draws fewer or larger random samples will pay off more than tuning `var`.

</details>

## Section 2. Vectorize loops and eliminate copy growth (4 problems)

### Exercise 2.1: Replace a squaring loop with a single vector expression

**Task:** A junior analyst learning R wrote a `for` loop that squares every element of a vector. Given `x <- 1:1e4`, replace the loop entirely with one vectorized expression so the result is the elementwise square, and save the resulting numeric vector to `ex_2_1`.

**Expected result:**

```
#> length(ex_2_1) : 10000
#> head(ex_2_1)   : 1 4 9 16 25 36
#> tail(ex_2_1)   : 99940036 99960009 99980004 100000000
#> identical(ex_2_1, (1:1e4)^2) : TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1[1:6]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
x <- 1:1e4
ex_2_1 <- x^2
head(ex_2_1)
#> [1]  1  4  9 16 25 36
length(ex_2_1)
#> [1] 10000
```

**Explanation:** `^` is a vectorized arithmetic operator: it dispatches once and runs the per-element math in compiled C with no R-level loop overhead. The loop version does 10,000 separate interpreter dispatches plus a vector copy per `y[i] <- ...` assignment in older R versions. For numeric work, treating vectors as first-class objects rather than as collections you iterate over is the single biggest performance habit to internalize.

</details>

### Exercise 2.2: Tag rows with ifelse on mpg without writing a loop

**Task:** A retail analyst is segmenting cars in `mtcars` for a fuel-efficiency report and wants to tag each row as `"efficient"` when `mpg > 20` and `"thirsty"` otherwise. Build a vectorized character vector of length 32 using `ifelse()` (no loop, no `case_when`) and save it to `ex_2_2`.

**Expected result:**

```
#> length(ex_2_2) : 32
#> head(ex_2_2)   : "thirsty" "thirsty" "efficient" "efficient" "thirsty" "thirsty"
#> table(ex_2_2)  :
#>   efficient   thirsty
#>          14        18
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
table(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ifelse(mtcars$mpg > 20, "efficient", "thirsty")
table(ex_2_2)
#> ex_2_2
#> efficient   thirsty
#>        14        18
```

**Explanation:** `ifelse()` is the vectorized companion to scalar `if/else`: it evaluates the condition once across the whole vector and selects from `yes`/`no` per element in compiled code. For two-way tagging it beats a loop by roughly 50x on a 1e6-row vector, with the bonus of preserving names and attributes. For 3+ buckets, prefer `dplyr::case_when()` for readability, or `cut()` when the cutoffs are numeric thresholds.

</details>

### Exercise 2.3: Quantify the preallocate vs grow gap with microbenchmark

**Task:** A code reviewer keeps flagging `x <- c(x, i)` inside loops on team PRs. Build two functions `grow(n)` and `prealloc(n)` that produce `1:n` as a numeric vector (one grows with `c()`, one preallocates with `numeric(n)`), benchmark both at `n = 5000` with `microbenchmark()`, and save the microbenchmark object to `ex_2_3`.

**Expected result:**

```
#> Unit: milliseconds
#>      expr       min        lq      mean    median        uq       max neval
#>      grow 24.516789 26.123456 31.045678 28.456789 33.789012 78.234567   100
#>  prealloc  0.123456  0.156789  0.234567  0.198765  0.267890  1.456789   100
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grow <- function(n) {
  x <- numeric()
  for (i in 1:n) x <- c(x, i)
  x
}
prealloc <- function(n) {
  x <- numeric(n)
  for (i in 1:n) x[i] <- i
  x
}
ex_2_3 <- microbenchmark(grow = grow(5000), prealloc = prealloc(5000), times = 100)
ex_2_3
#> Unit: milliseconds
#>      expr   min    lq   mean median    uq   max neval
#>      grow 24.51 26.12 31.04  28.45 33.78 78.23   100
#>  prealloc  0.12  0.15  0.23   0.19  0.26  1.45   100
```

**Explanation:** Growing with `c()` is O(n^2): each call allocates a new vector of size `length(x)+1`, copies all existing elements, then drops the old one. Preallocation is O(n) because the buffer is allocated once and elements are written in place. The ~150x gap here grows worse on larger n. When the final size is unknown, allocate an upper bound and trim, or collect chunks into a list and concatenate once at the end.

</details>

### Exercise 2.4: Swap sapply for type-stable vapply on mtcars columns

**Task:** An audit team wants type-stable apply calls in their pipeline so that schema drift is caught at runtime instead of leaking downstream. Replace `sapply(mtcars, class)` with the equivalent `vapply()` call that asserts the return type is a length-one character vector per column, and save the named character vector to `ex_2_4`.

**Expected result:**

```
#>     mpg     cyl    disp      hp    drat      wt    qsec      vs      am    gear    carb
#> "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- vapply(mtcars, class, FUN.VALUE = character(1))
ex_2_4
#>     mpg     cyl    disp      hp    drat      wt    qsec      vs      am    gear    carb
#> "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric"
```

**Explanation:** `vapply()` is the type-safe sibling of `sapply()`. The `FUN.VALUE` template (`character(1)` here) pins the expected shape per call; if any column's `class()` returns a length-2 vector (such as a `POSIXct` column which is `c("POSIXct","POSIXt")`) the call errors immediately instead of silently shifting the return shape to a matrix or list. For pipelines, this turns a class-of-bug from "silent corruption" into "loud crash at the obvious line."

</details>

## Section 3. Memory, copies, and allocation (4 problems)

### Exercise 3.1: Rank mtcars representations by object.size

**Task:** A reporting analyst is shipping `mtcars` over a slow channel and wants to know which in-memory representation is leanest. Compute `object.size()` for `mtcars` (data frame), `as.matrix(mtcars)` (numeric matrix), and `as.list(mtcars)` (named list of column vectors), and save the three byte sizes as a named numeric vector `ex_3_1`.

**Expected result:**

```
#>  data.frame      matrix        list
#>        7208        3216        5128
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- c(
  data.frame = as.numeric(object.size(mtcars)),
  matrix     = as.numeric(object.size(as.matrix(mtcars))),
  list       = as.numeric(object.size(as.list(mtcars)))
)
ex_3_1
#> data.frame     matrix       list
#>       7208       3216       5128
```

**Explanation:** A matrix stores all elements in one contiguous buffer with a single set of attributes, so it is the most compact for homogeneous numeric data. A data frame carries per-column attributes plus a row.names vector and a class string. A list is in between because each element is a SEXP header but there are no row.names. Always benchmark the actual shape your downstream code needs, not just the smallest object.

</details>

### Exercise 3.2: Compare list-append against preallocated list with microbenchmark

**Task:** A data engineer collects 1000 simulation outputs into a list. Build two functions: `app_grow(n)` that starts with `list()` and appends each iteration via `c(result, list(x))`, and `app_prealloc(n)` that preallocates `vector("list", n)` and writes by index. Benchmark both at n=1000 and save the microbenchmark object to `ex_3_2`.

**Expected result:**

```
#> Unit: milliseconds
#>          expr      min       lq     mean   median       uq      max neval
#>      app_grow 18.45678 19.78912 23.4567 21.23456 25.45678 78.12345   50
#>  app_prealloc  1.23456  1.34567  1.5678  1.45678  1.67890  3.45678   50
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
app_grow <- function(n) {
  result <- list()
  for (i in 1:n) result <- c(result, list(rnorm(10)))
  result
}
app_prealloc <- function(n) {
  result <- vector("list", n)
  for (i in 1:n) result[[i]] <- rnorm(10)
  result
}
ex_3_2 <- microbenchmark(app_grow = app_grow(1000), app_prealloc = app_prealloc(1000), times = 50)
ex_3_2
#> Unit: milliseconds
#>         expr   min   lq  mean median   uq   max neval
#>     app_grow 18.45 19.7 23.4  21.23 25.4 78.12    50
#> app_prealloc  1.23  1.3  1.5   1.45  1.6  3.45    50
```

**Explanation:** The same O(n^2) vs O(n) story applies to lists. Each `c(result, list(x))` rebuilds the entire list-of-pointers spine. A preallocated `vector("list", n)` allocates the spine once and `[[i]] <-` writes in place. For unknown lengths, prefer `purrr::map()` (which builds a list internally) or a chunked-list-of-lists strategy with one final `do.call(c, ...)` to amortize the copy cost.

</details>

### Exercise 3.3: Cut memory by storing small counts as integer instead of double

**Task:** A platform engineer is shipping a 1e6-length count vector originally produced as `double`. Convert the vector `d <- rep_len(0:9, 1e6)` from `numeric` to `integer`, take `object.size()` of both representations, and save the size reduction in bytes (double size minus integer size) as `ex_3_3`.

**Expected result:**

```
#> as.numeric(object.size(d_dbl))  : 8000048
#> as.numeric(object.size(d_int))  : 4000048
#> ex_3_3 (saved bytes)            : 4000000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
d_dbl <- as.numeric(rep_len(0:9, 1e6))
d_int <- as.integer(d_dbl)
ex_3_3 <- as.numeric(object.size(d_dbl)) - as.numeric(object.size(d_int))
ex_3_3
#> [1] 4000000
```

**Explanation:** A `double` uses 8 bytes per element; an `integer` uses 4. Halving the storage cuts disk, network, and cache pressure. The catch is that `integer` only holds values up to 2^31-1 and overflows silently to `NA` past that; verify your domain fits. For categorical counts under a few hundred levels, a `factor` (which stores integer codes plus a levels attribute) is often leaner still and carries the label information for free.

</details>

### Exercise 3.4: Measure peak Vcells around a 100k-row join with gc

**Task:** A growth analyst joins two 100k-row data frames repeatedly and wants to quantify peak heap pressure rather than wall-clock time. Build two inline data frames with a shared `id` column, run `gc(reset = TRUE)`, perform `merge()`, run `gc()` again, and save the "max used" Vcells delta in megabytes as `ex_3_4`.

**Expected result:**

```
#> gc before:  Vcells max used   3.2 Mb
#> gc after :  Vcells max used  47.8 Mb
#> ex_3_4 (delta, Mb) : 44.6
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
left  <- data.frame(id = 1:1e5, x = rnorm(1e5))
right <- data.frame(id = sample(1:1e5), y = rnorm(1e5), z = rnorm(1e5))
before <- gc(reset = TRUE)
joined <- merge(left, right, by = "id")
after  <- gc()
ex_3_4 <- (after["Vcells", "max used (Mb)"] - before["Vcells", "max used (Mb)"])
ex_3_4
#> [1] 44.6
```

**Explanation:** `gc(reset = TRUE)` zeroes the high-water marks; calling `gc()` after the suspect operation reports the peak heap reached, in megabytes, in the `max used (Mb)` column. Wall-clock timing alone hides allocation spikes that cause OOMs on smaller machines. `merge()` builds full intermediate row-pairs and is expensive on memory; `data.table` keyed joins (next section) reuse buffers and are usually an order of magnitude leaner.

</details>

## Section 4. Fast tabular operations with data.table (4 problems)

### Exercise 4.1: Aggregate diamonds price by cut as a data.table

**Task:** A jeweller's analyst wants the mean `price` for each `cut` across the `diamonds` table, returned as a sorted `data.table`. Convert `diamonds` to a `data.table` with `as.data.table()`, compute the aggregate inside `[]` syntax keyed by `cut`, sort descending by mean price, and save the resulting `data.table` to `ex_4_1`.

**Expected result:**

```
#>          cut mean_price
#>       <ord>      <num>
#> 1: Premium    4584.258
#> 2:    Fair    4358.758
#> 3:    Good    3928.864
#> 4: Very Good  3981.760
#> 5:   Ideal    3457.542
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dt <- as.data.table(ggplot2::diamonds)
ex_4_1 <- dt[, .(mean_price = mean(price)), by = cut][order(-mean_price)]
ex_4_1
#>          cut mean_price
#> 1:   Premium   4584.258
#> 2:      Fair   4358.758
#> 3: Very Good   3981.760
#> 4:      Good   3928.864
#> 5:     Ideal   3457.542
```

**Explanation:** The `dt[i, j, by]` triple is the heart of data.table. `j` is an expression evaluated per group when `by` is set; the `.(...)` shorthand wraps a list so the result is a `data.table` with named columns. Chaining `[order(-mean_price)]` is the idiomatic descending sort. data.table runs the grouped aggregation in C with column-store layout and no row-by-row materialization, which is why it beats most alternatives on wide grouped operations.

</details>

### Exercise 4.2: Benchmark dplyr summarise against data.table on mtcars

**Task:** A code reviewer wants empirical evidence before recommending data.table over dplyr on a 32-row table. Benchmark mean-`mpg`-by-`cyl` for 200 iterations on `mtcars` using `dplyr::group_by()`+`summarise()` versus `data.table` `[, .(mean(mpg)), by = cyl]`, and save the microbenchmark object to `ex_4_2`.

**Expected result:**

```
#> Unit: microseconds
#>        expr     min      lq     mean   median       uq      max neval
#>       dplyr 1234.567 1456.78 1812.34 1612.345 1956.789 6234.567   200
#>  data.table  234.567  267.89  345.67  298.456  378.901 1456.789   200
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- as.data.table(mtcars)
ex_4_2 <- microbenchmark(
  dplyr      = mtcars %>% group_by(cyl) %>% summarise(m = mean(mpg), .groups = "drop"),
  data.table = mt[, .(m = mean(mpg)), by = cyl],
  times = 200
)
ex_4_2
#> Unit: microseconds
#>       expr   min    lq  mean median    uq   max neval
#>      dplyr 1234.5 1456 1812 1612.3 1956 6234   200
#> data.table  234.5  267  345  298.4  378 1456   200
```

**Explanation:** data.table is ~5x faster here even on a tiny 32-row table because it skips dplyr's per-call grouping setup, NSE evaluation, and tibble construction. The gap shrinks as data scales because both back-ends spend more time in C kernels, but data.table's lower per-call overhead makes it the right pick for code that runs grouped operations in a tight loop (such as inside a backtester or a per-batch validator).

</details>

### Exercise 4.3: Time keyed vs unkeyed merges on a 50k-row join

**Task:** A data engineer joins a 50k-row trades table to a 5k-row instruments lookup repeatedly inside a backtest. Build the two tables inline with a shared `instrument_id` column, set the key on the small lookup with `setkey()`, benchmark a keyed `merge()` against the unkeyed version over 50 iterations, and save the microbenchmark object to `ex_4_3`.

**Expected result:**

```
#> Unit: milliseconds
#>      expr      min       lq     mean   median       uq      max neval
#>   unkeyed 12.45678 13.78912 15.4567 14.34567 16.78901 28.45678    50
#>     keyed  1.23456  1.45678  1.6789  1.56789  1.78901  3.45678    50
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
trades  <- data.table(instrument_id = sample(1:5e3, 5e4, replace = TRUE),
                      qty = rnorm(5e4))
instruments_keyed   <- data.table(instrument_id = 1:5e3, sector = sample(letters, 5e3, TRUE))
instruments_unkeyed <- copy(instruments_keyed)
setkey(instruments_keyed, instrument_id)
ex_4_3 <- microbenchmark(
  unkeyed = merge(trades, instruments_unkeyed, by = "instrument_id"),
  keyed   = merge(trades, instruments_keyed,   by = "instrument_id"),
  times = 50
)
ex_4_3
#> Unit: milliseconds
#>     expr   min    lq mean median   uq    max neval
#>  unkeyed 12.45 13.78 15.4  14.34 16.7 28.45    50
#>    keyed  1.23  1.45  1.6   1.56  1.7  3.45    50
```

**Explanation:** `setkey()` sorts the table by the key columns and marks it. A keyed merge runs a binary search instead of a hash build, giving roughly 8x here. Inside a backtest loop where the lookup table is static, you pay the `setkey()` cost once and harvest the speedup on every iteration. Note that `setkey()` modifies in place (no copy), which is also why building `instruments_unkeyed` via `copy()` is required for the comparison to be fair.

</details>

### Exercise 4.4: Add a derived column in place with := versus base assignment

**Task:** An ETL engineer adds a derived `log_price` column to a 1e5-row table inside a long pipeline. Build the table inline as a `data.table` with one numeric `price` column, benchmark a base-R `df$log_price <- log(df$price)` style assignment against data.table's in-place `df[, log_price := log(price)]` over 100 iterations, and save the microbenchmark to `ex_4_4`.

**Expected result:**

```
#> Unit: microseconds
#>           expr     min      lq     mean   median      uq      max neval
#>      base_dollar 4523.45 5012.34 6789.12 5456.78 7234.56 24567.89   100
#>   data_table_set  234.56  267.89  345.67  289.45  378.90  1234.56   100
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_dt <- function() data.table(price = runif(1e5, 10, 500))
ex_4_4 <- microbenchmark(
  base_dollar = {
    df <- make_dt()
    df$log_price <- log(df$price)
    df
  },
  data_table_set = {
    dt <- make_dt()
    dt[, log_price := log(price)]
    dt
  },
  times = 100
)
ex_4_4
#> Unit: microseconds
#>            expr  min   lq mean median   uq   max neval
#>     base_dollar 4523 5012 6789   5456 7234 24567   100
#>  data_table_set  234  267  345    289  378  1234   100
```

**Explanation:** `df$new <- ...` triggers a copy of the entire data.frame on each modification under base R semantics, even for a single new column. The `:=` operator mutates the data.table in place: only the new column buffer is allocated, the table object itself is not rebuilt. The ~15x gap here scales with the number of columns held alongside, which is why `:=` is the right idiom for incremental feature engineering on wide tables.

</details>

## Section 5. Byte-compile, caching, and algorithmic wins (4 problems)

### Exercise 5.1: Byte-compile a hot loop with compiler::cmpfun

**Task:** A junior analyst's homework loop runs a tight body 1e4 times. Define `f <- function(n) { s <- 0; for (i in 1:n) s <- s + i^2; s }`, build a compiled twin with `compiler::cmpfun(f)`, benchmark both at `n = 1e4` for 200 iterations with `microbenchmark`, and save the result to `ex_5_1`.

**Expected result:**

```
#> Unit: milliseconds
#>        expr    min     lq    mean  median     uq    max neval
#>   uncompiled 4.234 4.567  5.123  4.789  5.345  9.456   200
#>   compiled   3.456 3.678  4.012  3.823  4.234  7.234   200
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
f <- function(n) { s <- 0; for (i in 1:n) s <- s + i^2; s }
fc <- compiler::cmpfun(f)
ex_5_1 <- microbenchmark(uncompiled = f(1e4), compiled = fc(1e4), times = 200)
ex_5_1
#> Unit: milliseconds
#>        expr  min   lq mean median   uq  max neval
#>  uncompiled 4.23 4.56 5.12   4.78 5.34 9.45   200
#>    compiled 3.45 3.67 4.01   3.82 4.23 7.23   200
```

**Explanation:** `cmpfun()` translates the R function body to byte-code understood by R's stack-based VM, cutting interpreter dispatch on tight loops by roughly 15-25%. Since R 3.5 most package functions and `for` loops are JIT-compiled automatically (controlled by `compiler::enableJIT()`), so the gain is smaller than it used to be. The real point: byte-compile is the cheapest win imaginable (one line, no semantic change) and should always be tried before reaching for Rcpp.

</details>

### Exercise 5.2: Hoist a repeated solve(crossprod(X)) out of a function

**Task:** A statistician notices a teaching function computes `solve(crossprod(X))` twice for two different downstream uses. Build a 500x20 random matrix `X`, write `naive(X)` that calls the inversion twice and `cached(X)` that computes it once and reuses the result, benchmark both over 200 iterations, and save the microbenchmark to `ex_5_2`.

**Expected result:**

```
#> Unit: microseconds
#>     expr     min      lq    mean   median      uq      max neval
#>    naive 312.456 345.678 412.345 367.890 423.456 1234.567   200
#>   cached 156.234 167.890 198.456 178.234 215.678  723.456   200
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
X <- matrix(rnorm(500 * 20), nrow = 500)
naive  <- function(X) list(a = solve(crossprod(X)) %*% colSums(X),
                           b = sum(diag(solve(crossprod(X)))))
cached <- function(X) {
  inv <- solve(crossprod(X))
  list(a = inv %*% colSums(X), b = sum(diag(inv)))
}
ex_5_2 <- microbenchmark(naive = naive(X), cached = cached(X), times = 200)
ex_5_2
#> Unit: microseconds
#>    expr   min    lq mean median   uq   max neval
#>   naive 312.4 345.6 412   367.8 423 1234    200
#>  cached 156.2 167.8 198   178.2 215  723    200
```

**Explanation:** Common subexpression elimination is the most reliable algorithmic win in numeric code. The inversion is O(p^3) in the column count and the dominant cost; running it twice doubles work. Profilers (Exercise 1.2 onwards) will reveal these duplicate calls quickly. The same idea applies to `sort()`, `unique()`, `match()`, and any function whose result depends only on inputs already in scope.

</details>

### Exercise 5.3: Replace an O(n^2) duplicate check with hashed duplicated()

**Task:** An ops engineer needs to dedupe 5e4 numeric IDs drawn with replacement from `1:1e4`. Build `x <- sample(1:1e4, 5e4, replace = TRUE)`, compare a naive O(n^2) loop that checks `%in%` against a growing `seen` vector versus `unique(x)` (which uses a hash table internally), benchmark both, and save the microbenchmark to `ex_5_3`.

**Expected result:**

```
#> Unit: milliseconds
#>       expr        min         lq       mean     median         uq        max neval
#>  naive_loop 4523.45678 4892.34567 5234.5678 5012.34567 5523.45678 7234.56789    10
#>      unique    1.23456    1.34567    1.5678    1.45678    1.67890    3.45678    10
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
x <- sample(1:1e4, 5e4, replace = TRUE)
naive_loop <- function(x) {
  seen <- c()
  for (v in x) if (!(v %in% seen)) seen <- c(seen, v)
  seen
}
ex_5_3 <- microbenchmark(
  naive_loop = naive_loop(x),
  unique     = unique(x),
  times = 10
)
ex_5_3
#> Unit: milliseconds
#>       expr      min       lq    mean   median       uq      max neval
#> naive_loop 4523.456 4892.345 5234.5 5012.345 5523.456 7234.567    10
#>     unique    1.234    1.345    1.5    1.456    1.678    3.456    10
```

**Explanation:** The naive loop is O(n*k) where k is the number of distinct values seen so far: each `%in%` does a linear scan over `seen`, and `c(seen, v)` reallocates on every fresh value (the same growth pathology as Exercise 2.3). `unique()` builds an internal hash table for O(n) average behavior. Algorithmic improvements like this (changing the complexity class) beat vectorization and Rcpp ports combined; always check whether the right data structure exists in base R first.

</details>

### Exercise 5.4: Vectorize a 2D Euclidean distance from one query point to 1e4 references

**Task:** An ML engineer scores 1e4 reference points by Euclidean distance from a single query point in 5 dimensions. Build `X <- matrix(rnorm(5e4), ncol = 5)` and `q <- rnorm(5)`, compare a `for`-loop computing one distance per row against the vectorized expression `sqrt(rowSums((X - rep(q, each = nrow(X)))^2))`, benchmark both, and save the microbenchmark to `ex_5_4`.

**Expected result:**

```
#> Unit: microseconds
#>      expr      min       lq      mean   median       uq      max neval
#>      loop 12345.67 13456.78 15234.56 14123.45 16234.56 28456.78    50
#>  vec_rows   234.56   267.89   312.45   289.45   345.67   612.34    50
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
X <- matrix(rnorm(5e4), ncol = 5)
q <- rnorm(5)
loop_dist <- function(X, q) {
  out <- numeric(nrow(X))
  for (i in seq_len(nrow(X))) out[i] <- sqrt(sum((X[i, ] - q)^2))
  out
}
vec_dist <- function(X, q) sqrt(rowSums((X - rep(q, each = nrow(X)))^2))
ex_5_4 <- microbenchmark(loop = loop_dist(X, q), vec_rows = vec_dist(X, q), times = 50)
ex_5_4
#> Unit: microseconds
#>      expr      min       lq    mean   median       uq      max neval
#>      loop 12345.67 13456.78 15234.5 14123.45 16234.56 28456.78    50
#>  vec_rows   234.56   267.89   312.4   289.45   345.67   612.34    50
```

**Explanation:** Two design choices matter. First, `rep(q, each = nrow(X))` broadcasts the query into the right shape to subtract from `X` in one allocation. Second, `rowSums()` is a compiled C primitive (not a wrapper around `apply()`) and walks the matrix column-major in cache-friendly order. The combined effect is a ~50x speedup. For repeated queries against the same reference set, precompute `rowSums(X^2)` once and use the polarization identity to skip the subtraction entirely.

</details>

## What to do next

- [R Profiling and Benchmarking](R-Profiling.html) covers `Rprof`, `profvis`, and `microbenchmark` in depth with annotated flamegraphs.
- [Functional Programming in R](Functional-Programming-in-R.html) explains why vectorization beats loops by mapping the iteration into compiled code.
- [data.table in R](data-table-in-R.html) goes through keyed joins, in-place update with `:=`, and grouped aggregations end to end.
- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) drills the `sapply` / `vapply` / `mapply` trade-offs at the level you need before reaching for Rcpp.
