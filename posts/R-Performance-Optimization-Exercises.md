---
title: "R Performance Optimization Exercises: 20 Practice Problems"
slug: "R-Performance-Optimization-Exercises"
description: "Master R performance with 20 practice problems: profiling, vectorization, data.table, Rcpp, memory, benchmarks. Hidden solutions."
keywords: "R performance optimization exercises, R profiling exercises, R vectorization practice, benchmarkR, R memory exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R Performance Exercises"
sidebar_order: 155
fr_parent: "R-Tutorial.html"
auto_link_terms: "R performance optimization exercises|R profiling exercises|R vectorization practice|benchmarkR"
auto_link_case_sensitive: false
target_keyword: "R performance optimization exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# R Performance Optimization Exercises: 20 Practice Problems

<p class="lead">Twenty practice problems on R performance: profiling, vectorization, data.table, byte-compile, Rcpp, memory. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(microbenchmark)
library(profvis)
```

### Exercise 1: Benchmark two approaches

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
microbenchmark::microbenchmark(
  loop  = { s <- 0; for (i in 1:1000) s <- s + i; s },
  vec   = sum(1:1000),
  times = 50
)
```

</details>

### Exercise 2: Vectorize a loop

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
x <- 1:10000
# slow
slow <- function() { y <- numeric(length(x)); for (i in seq_along(x)) y[i] <- x[i]^2; y }
# fast
fast <- function() x^2
```

</details>

### Exercise 3: Preallocate vs grow

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
grow <- function(n) { x <- numeric(); for (i in 1:n) x <- c(x, i); x }
prealloc <- function(n) { x <- numeric(n); for (i in 1:n) x[i] <- i; x }
# prealloc is 100x+ faster for large n
```

</details>

### Exercise 4: apply vs vectorized

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
m <- matrix(rnorm(1000*100), nrow = 100)
microbenchmark::microbenchmark(
  apply = apply(m, 1, sum),
  vec   = rowSums(m),
  times = 50
)
```

</details>

### Exercise 5: Profile a function

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
profvis::profvis({
  x <- numeric()
  for (i in 1:1000) x <- c(x, i^2)
})
```

</details>

### Exercise 6: byte-compile

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
slow <- function(n) { s <- 0; for (i in 1:n) s <- s + i; s }
fast <- compiler::cmpfun(slow)
microbenchmark::microbenchmark(slow(1e4), fast(1e4), times = 50)
```

</details>

### Exercise 7: data.table vs dplyr aggregation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
dt <- data.table::as.data.table(mtcars)
microbenchmark::microbenchmark(
  dplyr_way = dplyr::summarise(dplyr::group_by(mtcars, cyl), m = mean(mpg)),
  dt_way    = dt[, .(m = mean(mpg)), by = cyl],
  times = 50
)
```

</details>

### Exercise 8: Memory usage

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
m <- matrix(rnorm(1e6), 1000, 1000)
object.size(m) |> format(units = "MB")
```

</details>

### Exercise 9: gc() to free memory

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
large <- numeric(1e7)
rm(large); gc()
```

</details>

### Exercise 10: Avoid copy-on-modify with data.table

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
dt <- data.table::as.data.table(mtcars)
dt[, kpl := mpg * 0.425]   # in-place, no copy
```

</details>

### Exercise 11: Rcpp for hot loop

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# Rcpp::cppFunction("double sum_cpp(NumericVector x){ double s=0; for(int i=0;i<x.size();i++) s+=x[i]; return s; }")
# sum_cpp(1:1000)
```

</details>

### Exercise 12: tracemem demo

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
x <- 1:5
tracemem(x)
x[1] <- 99   # prints memory copy address
untracemem(x)
```

</details>

### Exercise 13: bench package timing

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
bench::mark(
  v1 = sum(1:1e4),
  v2 = { s <- 0; for (i in 1:1e4) s <- s + i; s },
  check = TRUE
)
```

</details>

### Exercise 14: Use which() instead of all-row filter

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
v <- runif(1e6)
microbenchmark::microbenchmark(
  v1 = v[v > 0.5],
  v2 = v[which(v > 0.5)],
  times = 20
)
```

</details>

### Exercise 15: Avoid factors when not needed

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# When reading strings that won't be used in models, stringsAsFactors = FALSE or use read_csv()
# In tibbles, strings stay as character by default. In data.frame pre-R 4.0, they became factors.
```

</details>

### Exercise 16: rowsum() for fast group sums

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
rowsum(mtcars$mpg, mtcars$cyl)
```

</details>

### Exercise 17: tabulate for fast counts

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
x <- sample(1:5, 1e5, replace = TRUE)
microbenchmark::microbenchmark(
  table_fn = table(x),
  tab      = tabulate(x),
  times = 20
)
```

</details>

### Exercise 18: setDT in place

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- as.data.frame(mtcars)
data.table::setDT(df)
class(df)
```

</details>

### Exercise 19: Faster reads with fread

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
data.table::fwrite(mtcars, "demo.csv")
data.table::fread("demo.csv")
```

</details>

### Exercise 20: Parallel apply with future

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
future::plan(future::multisession, workers = 2)
furrr::future_map_dbl(1:5, ~ { Sys.sleep(0.1); .x^2 })
```

</details>

## What to do next

- **Parallel-Computing-Exercises** (coming) — parallel strategies.
- **data.table-Exercises** (shipped) — performance via data.table.
