---
title: "Parallel Computing in R Exercises: 15 Practice Problems"
slug: "Parallel-Computing-in-R-Exercises"
description: "Master parallel computing in R with 15 practice problems: mclapply, future, furrr, doParallel, parallel apply. Hidden solutions."
keywords: "parallel computing R exercises, R parallel practice, future R, furrr R exercises, mclapply R"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Parallel Computing Exercises"
sidebar_order: 156
fr_parent: "R-Tutorial.html"
auto_link_terms: "parallel computing R exercises|R parallel practice|future R|furrr R exercises"
auto_link_case_sensitive: false
target_keyword: "parallel computing R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Parallel Computing in R Exercises: 15 Practice Problems

<p class="lead">Fifteen practice problems on parallel computing in R: mclapply, future, furrr, doParallel, parallel maps. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(future)
library(furrr)
library(parallel)
```

### Exercise 1: detectCores

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
parallel::detectCores()
```

</details>

### Exercise 2: mclapply (unix)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
parallel::mclapply(1:4, function(x) { Sys.sleep(0.5); x^2 }, mc.cores = 2)
```

</details>

### Exercise 3: parLapply with cluster

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
cl <- parallel::makeCluster(2)
parallel::parLapply(cl, 1:4, function(x) x^2)
parallel::stopCluster(cl)
```

</details>

### Exercise 4: future multisession

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
future::plan(future::multisession, workers = 2)
f <- future::future({ Sys.sleep(0.5); 42 })
future::value(f)
```

</details>

### Exercise 5: furrr future_map

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
future::plan(future::multisession, workers = 2)
furrr::future_map_dbl(1:4, ~ { Sys.sleep(0.5); .x^2 })
```

</details>

### Exercise 6: future_map_dfr

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
future::plan(future::multisession, workers = 2)
furrr::future_map_dfr(1:3, ~ tibble::tibble(n = .x, sq = .x^2))
```

</details>

### Exercise 7: Globals: pass variables

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
future::plan(future::multisession, workers = 2)
k <- 10
furrr::future_map_dbl(1:5, ~ .x * k)
```

</details>

### Exercise 8: Set seed reproducibly

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
future::plan(future::multisession, workers = 2)
furrr::future_map_dbl(1:5, ~ runif(1), .options = furrr::furrr_options(seed = 123))
```

</details>

### Exercise 9: doParallel + foreach

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
cl <- parallel::makeCluster(2)
doParallel::registerDoParallel(cl)
foreach::foreach(i = 1:4, .combine = c) %dopar% { Sys.sleep(0.3); i^2 }
parallel::stopCluster(cl)
```

</details>

### Exercise 10: future plan sequential

**Difficulty:** Beginner. Reset to sequential.

<details><summary>Show solution</summary>

```r
future::plan(future::sequential)
```

</details>

### Exercise 11: Compare serial vs parallel

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
slow <- function(x) { Sys.sleep(0.5); x^2 }
future::plan(future::multisession, workers = 4)
serial_time <- system.time(lapply(1:8, slow))
parallel_time <- system.time(furrr::future_map(1:8, slow))
list(serial = serial_time["elapsed"], parallel = parallel_time["elapsed"])
```

</details>

### Exercise 12: parSapply

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
cl <- parallel::makeCluster(2)
parallel::parSapply(cl, 1:5, function(x) x^2)
parallel::stopCluster(cl)
```

</details>

### Exercise 13: Caret parallel via doParallel

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
cl <- parallel::makeCluster(2)
doParallel::registerDoParallel(cl)
# train() with method="rf" auto-parallelizes when registered
parallel::stopCluster(cl)
```

</details>

### Exercise 14: future apply

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
future::plan(future::multisession, workers = 2)
future.apply::future_sapply(1:5, function(x) x^2)
```

</details>

### Exercise 15: Stop cluster cleanly

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
cl <- parallel::makeCluster(2)
# ... do work ...
parallel::stopCluster(cl)
```

</details>

## What to do next

- **R-Performance-Optimization-Exercises** (shipped) — single-thread first.
- **purrr-Exercises** (shipped) — serial map functions before parallel.
