---
title: "Parallel Computing in R Exercises: 20 Practice Problems"
slug: "Parallel-Computing-in-R-Exercises"
description: "Twenty hands-on parallel computing in R problems with hidden solutions: parallel, future, furrr, doParallel, reproducible seeds, bootstrap workflows."
keywords: "parallel computing R exercises, future furrr R exercises, mclapply parLapply exercises, doParallel foreach practice, parallel R practice problems"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Parallel Computing Exercises"
sidebar_order: 156
fr_parent: "R-Tutorial.html"
auto_link_terms: "parallel computing in r|future framework|furrr package|doparallel foreach|parlapply mclapply"
auto_link_case_sensitive: false
target_keyword: "future furrr R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Parallel Computing in R Exercises: 20 Practice Problems

<p class="lead">Twenty practice problems on parallel computing in R covering the parallel package, the future framework, furrr, foreach with doParallel, reproducible random number streams, and real bootstrap and simulation workflows. Solutions are hidden behind reveal blocks so you can try first.</p>

```r title="Run this once before any exercise"
library(parallel)
library(future)
library(future.apply)
library(furrr)
library(foreach)
library(doParallel)
library(doRNG)
library(dplyr)
library(purrr)
library(tibble)
library(ggplot2)
library(microbenchmark)
```

## Section 1. The parallel package: cores, forks, and clusters (4 problems)

### Exercise 1.1: Detect available cores and reserve one for the OS

**Task:** Before launching any parallel job, a reporting analyst wants to know how many cores are available on the current machine and how many should be used as workers (always leave one free for the operating system). Use `parallel::detectCores()` to find the total, subtract one to get the worker count, and save both as a named integer vector to `ex_1_1`.

**Expected result:**

```
#> total workers
#>     8       7
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
total_cores <- parallel::detectCores()
ex_1_1 <- c(total = total_cores, workers = total_cores - 1L)
ex_1_1
#> total workers
#>     8       7
```

**Explanation:** `detectCores()` returns the number of logical CPUs reported by the OS, which on modern Intel and AMD chips includes hyperthreads. The minus-one idiom keeps the machine responsive: if you grab every core, the OS thread that scheduled R itself competes with your workers and overall throughput often drops. Use `detectCores(logical = FALSE)` if you want physical cores only, which can help when the workload is CPU-bound rather than IO-bound.

</details>

### Exercise 1.2: Parallel apply over mtcars columns with mclapply

**Task:** A junior analyst is auditing the `mtcars` dataset and wants the mean of every column computed in parallel using `parallel::mclapply()` with two cores. On Windows `mc.cores` is silently forced to 1, but the call still works. Save the result to `ex_1_2` as a named list of length 11.

**Expected result:**

```
#> $mpg
#> [1] 20.09062
#>
#> $cyl
#> [1] 6.1875
#>
#> $disp
#> [1] 230.7219
#>
#> ... (8 more elements: hp, drat, wt, qsec, vs, am, gear, carb)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- parallel::mclapply(mtcars, mean, mc.cores = 2)
ex_1_2[1:2]
#> $mpg
#> [1] 20.09062
#>
#> $cyl
#> [1] 6.1875
```

**Explanation:** `mclapply()` is a drop-in parallel replacement for `lapply()` on Linux and macOS, using `fork()` to copy the parent process. Forking is fast (copy-on-write memory) but does not exist on Windows, where the function falls back to sequential execution with a warning suppressed. For cross-platform parallel apply, prefer `future.apply::future_lapply()` or `parLapply()` with an explicit cluster.

</details>

### Exercise 1.3: Build and tear down a PSOCK cluster cleanly

**Task:** The ops team requires that every parallel job releases its workers, even if the job throws an error. Build a two-worker PSOCK cluster with `parallel::makeCluster()`, run `parLapply()` to square the numbers 1 through 6, and stop the cluster inside `on.exit()` so workers always shut down. Save the squared values to `ex_1_3` as a numeric vector.

**Expected result:**

```
#> [1]  1  4  9 16 25 36
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
run_squared <- function(n) {
  cl <- parallel::makeCluster(2)
  on.exit(parallel::stopCluster(cl))
  unlist(parallel::parLapply(cl, seq_len(n), function(x) x^2))
}
ex_1_3 <- run_squared(6)
ex_1_3
#> [1]  1  4  9 16 25 36
```

**Explanation:** PSOCK clusters spawn fresh R sessions and communicate over sockets, so they work on every platform including Windows. The `on.exit()` guard is the single most important pattern in cluster code: without it, a thrown error inside `parLapply()` leaves orphaned R processes that lock files, hold ports, and bleed memory. Wrapping the cluster lifecycle in a function gives the call site a single tidy entry point.

</details>

### Exercise 1.4: Export variables and packages to PSOCK workers

**Task:** Unlike fork-based parallelism, PSOCK workers start as empty R sessions and cannot see variables or packages from the parent. Build a two-worker cluster, define `multiplier <- 10` and load `dplyr` on each worker using `clusterExport()` and `clusterEvalQ()`, then compute `multiplier * x` for x in 1 to 5 using `parSapply()`. Save the result to `ex_1_4`.

**Expected result:**

```
#> [1] 10 20 30 40 50
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cl <- parallel::makeCluster(2)
on.exit(parallel::stopCluster(cl))
multiplier <- 10
parallel::clusterExport(cl, "multiplier")
invisible(parallel::clusterEvalQ(cl, library(dplyr)))
ex_1_4 <- parallel::parSapply(cl, 1:5, function(x) multiplier * x)
parallel::stopCluster(cl)
ex_1_4
#> [1] 10 20 30 40 50
```

**Explanation:** `clusterExport()` copies named objects from the parent environment into each worker, and `clusterEvalQ()` runs an arbitrary expression on each worker (commonly `library()` calls). Forgetting either is the most common bug: the parent works but workers throw "object not found" or "could not find function". The `future` framework removes this friction by detecting needed globals automatically, which is why most modern code uses `future` and `furrr` instead of raw PSOCK.

</details>

## Section 2. The future framework: plans, values, and futures (4 problems)

### Exercise 2.1: Set a sequential plan and resolve a single future

**Task:** A code reviewer wants to demonstrate that `future::future()` is lazy: nothing actually runs until you call `value()`. Set `plan(sequential)` (no actual parallelism, but the API behaves identically), create a future that sleeps for a fraction of a second and returns the square root of 144, then resolve it. Save the resolved value to `ex_2_1`.

**Expected result:**

```
#> [1] 12
#> class(ex_2_1)
#> [1] "numeric"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::sequential)
f <- future::future({ Sys.sleep(0.1); sqrt(144) })
ex_2_1 <- future::value(f)
ex_2_1
#> [1] 12
```

**Explanation:** A future is a placeholder for a value that may be computed elsewhere or later. `future()` schedules the work and returns immediately; `value()` blocks until the result is ready. With `plan(sequential)` everything runs in the current process so timings are not faster, but the API is identical to multisession or multicore plans, which means you can prototype on `sequential`, then change one line to scale out without touching the rest of your code.

</details>

### Exercise 2.2: Use future_lapply for a cross-platform parallel apply

**Task:** A statistician wants a square-root computation parallelized in a way that works on Windows, macOS, and Linux without `if (.Platform$OS.type)` branches. Switch the plan to `multisession` with two workers, then use `future.apply::future_lapply()` to compute `sqrt()` of 1 through 8. Save the unlisted result to `ex_2_2` as a numeric vector.

**Expected result:**

```
#> [1] 1.000000 1.414214 1.732051 2.000000 2.236068 2.449490 2.645751 2.828427
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
ex_2_2 <- unlist(future.apply::future_lapply(1:8, sqrt))
ex_2_2
#> [1] 1.000000 1.414214 1.732051 2.000000 2.236068 2.449490 2.645751 2.828427
future::plan(future::sequential)
```

**Explanation:** `multisession` spawns persistent background R sessions (built on PSOCK) and reuses them across calls, so the per-call overhead is paid once. `future_lapply()` is the drop-in replacement for `lapply()` and handles globals automatically: it scans the function body and ships needed variables to workers without an explicit `clusterExport()`. Always reset to `plan(sequential)` at the end of an interactive script so background workers do not linger.

</details>

### Exercise 2.3: Choose multicore vs multisession by platform

**Task:** A package author writing portable code wants to pick the fastest available plan: `multicore` (fork-based, no global serialization) on Linux and macOS, falling back to `multisession` on Windows. Use `supportsMulticore()` from the `parallelly` package (re-exported through `future`) to branch, set the plan with 2 workers, and capture the chosen plan class name as a single string. Save to `ex_2_3`.

**Expected result:**

```
#> [1] "multisession"   # on Windows
#> [1] "multicore"      # on Linux/macOS
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
if (future::supportsMulticore()) {
  future::plan(future::multicore, workers = 2)
} else {
  future::plan(future::multisession, workers = 2)
}
ex_2_3 <- class(future::plan())[1]
ex_2_3
#> [1] "multisession"
future::plan(future::sequential)
```

**Explanation:** Fork-based parallelism is faster to start up (no R session spawn, no global serialization) but is unsafe inside RStudio and absent on Windows. `supportsMulticore()` is a single-line portability check that returns `FALSE` on Windows or inside the RStudio GUI, so the same code can ship to a teammate on a different OS without breaking. The chosen plan class is returned by `class(plan())` and is useful for logging which mode actually ran.

</details>

### Exercise 2.4: Inspect future resolution state without blocking

**Task:** A platform engineer building a dashboard wants to launch three slow futures, then check which ones have finished without waiting for the slow ones. Set `plan(multisession, workers = 3)`, create three futures (`Sys.sleep(0.5)`, `Sys.sleep(0.05)`, `Sys.sleep(0.5)` returning 1, 2, 3 respectively), wait long enough for only the fast one to finish, and call `resolved()` on each. Save the logical vector to `ex_2_4`.

**Expected result:**

```
#> [1] FALSE  TRUE FALSE   # the middle (fast) future is resolved
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 3)
fs <- list(
  future::future({ Sys.sleep(0.5); 1 }),
  future::future({ Sys.sleep(0.05); 2 }),
  future::future({ Sys.sleep(0.5); 3 })
)
Sys.sleep(0.2)
ex_2_4 <- vapply(fs, future::resolved, logical(1))
ex_2_4
#> [1] FALSE  TRUE FALSE
future::plan(future::sequential)
```

**Explanation:** `resolved()` is non-blocking: it asks "is this future done yet?" and returns immediately, unlike `value()` which waits. This is the key building block for progress bars (`progressr`), throttled queues, and dashboards that need to poll multiple long-running jobs. The pattern generalizes: launch many futures, store them in a list, then either `vapply(fs, resolved, ...)` to poll or `future::value(fs)` to block on all of them.

</details>

## Section 3. furrr: purrr-style parallel maps (4 problems)

### Exercise 3.1: Square integers with future_map_dbl

**Task:** A junior analyst onboarding to furrr wants the typed parallel equivalent of `purrr::map_dbl()`. Set `plan(multisession, workers = 2)`, then use `furrr::future_map_dbl()` to square the integers 1 through 6. Save the numeric vector to `ex_3_1`.

**Expected result:**

```
#> [1]  1  4  9 16 25 36
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
ex_3_1 <- furrr::future_map_dbl(1:6, function(x) x^2)
ex_3_1
#> [1]  1  4  9 16 25 36
future::plan(future::sequential)
```

**Explanation:** The `future_map_*()` family mirrors `purrr::map_*()`: `future_map()` returns a list, `future_map_dbl()` enforces a numeric vector, `future_map_chr()` a character vector, and so on. The type-stable variants fail loudly if a worker returns the wrong type, which catches bugs (NA propagation, NULL returns) faster than a permissive `future_map()` plus a manual `unlist()`. Whenever you know the output type, prefer the typed variant.

</details>

### Exercise 3.2: Row-bind worker results with future_map_dfr

**Task:** A performance reviewer wants per-group summaries computed in parallel and stacked into one tibble. Split `mtcars` by `cyl`, then for each chunk compute a one-row tibble with mean mpg and mean hp using `furrr::future_map_dfr()`. The `.id = "cyl"` argument labels each row with the input name. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   cyl   mean_mpg mean_hp
#>   <chr>    <dbl>   <dbl>
#> 1 4         26.7    82.6
#> 2 6         19.7   122.
#> 3 8         15.1   209.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
ex_3_2 <- furrr::future_map_dfr(
  split(mtcars, mtcars$cyl),
  function(d) tibble::tibble(mean_mpg = mean(d$mpg), mean_hp = mean(d$hp)),
  .id = "cyl"
)
ex_3_2
#> # A tibble: 3 x 3
#>   cyl   mean_mpg mean_hp
#>   <chr>    <dbl>   <dbl>
#> 1 4         26.7    82.6
#> 2 6         19.7   122.
#> 3 8         15.1   209.
future::plan(future::sequential)
```

**Explanation:** `future_map_dfr()` is the parallel equivalent of `purrr::map_dfr()` and is the right pattern for split-apply-combine where each group fits comfortably in a worker. The `.id` argument turns the names of the input list into a column, which keeps the group key in the result. For very fine-grained groups (thousands of small chunks), the per-chunk serialization overhead can eat the parallel gains; profile first.

</details>

### Exercise 3.3: Reproducible random draws with future.seed = TRUE

**Task:** A statistician needs three parallel Monte Carlo draws of 100 standard-normal values and wants exactly the same numbers every run on every machine, regardless of how many workers are used. Use `furrr::future_map()` with `.options = furrr::furrr_options(seed = 123)` to draw the three samples, then keep only the means as a length-3 numeric vector. Save to `ex_3_3`.

**Expected result:**

```
#> [1] -0.05768771  0.07730672 -0.03862729   # exact values reproducible
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
draws <- furrr::future_map(
  1:3,
  function(i) rnorm(100),
  .options = furrr::furrr_options(seed = 123)
)
ex_3_3 <- vapply(draws, mean, numeric(1))
ex_3_3
#> [1] -0.05768771  0.07730672 -0.03862729
future::plan(future::sequential)
```

**Explanation:** Naive `set.seed()` does NOT make parallel code reproducible: each worker has its own RNG state, and which iteration lands on which worker depends on load balancing. `furrr_options(seed = 123)` builds a parallel-safe L'Ecuyer-CMRG stream so iteration `i` always gets the same sub-stream regardless of worker count. Forgetting this option is the most common reproducibility bug in parallel R code; the gate `seed = TRUE` (without an integer) auto-generates a stream you can record for later replay.

</details>

### Exercise 3.4: Parallel pmap across two argument vectors

**Task:** A take-home interviewer wants a parallel multi-argument map: pair `x = 1:4` with `y = c(10, 20, 30, 40)` and compute `x * y` for each pair using `furrr::future_pmap_dbl()`. Use a list-input of length-2 named list elements (or a tibble). Save the numeric result to `ex_3_4`.

**Expected result:**

```
#> [1]  10  40  90 160
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
args_df <- tibble::tibble(x = 1:4, y = c(10, 20, 30, 40))
ex_3_4 <- furrr::future_pmap_dbl(args_df, function(x, y) x * y)
ex_3_4
#> [1]  10  40  90 160
future::plan(future::sequential)
```

**Explanation:** `future_pmap_dbl()` walks over a list of equal-length vectors (or a tibble's rows) and calls the supplied function with each row's columns as named arguments. It is the parallel equivalent of `purrr::pmap_dbl()` and is the cleanest way to parameter-sweep across two or more inputs without manually building `Map()` or nested loops. The argument names of the function must match the column names of the tibble.

</details>

## Section 4. foreach and doParallel (3 problems)

### Exercise 4.1: Sequential foreach loop returning a list

**Task:** A junior analyst wants to see `foreach` running in its sequential mode first, before adding parallel backends. Use `foreach::foreach()` with `%do%` (sequential operator) to square 1 through 5 and let the default `.combine = NULL` return a list. Save to `ex_4_1`.

**Expected result:**

```
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 4
#> ... (3 more elements: 9, 16, 25)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- foreach::foreach(i = 1:5) %do% { i^2 }
ex_4_1[1:2]
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 4
```

**Explanation:** `foreach` is a `for`-loop replacement that always returns its values rather than relying on side effects. `%do%` runs sequentially; `%dopar%` runs in parallel against whatever backend is registered. The default combiner returns a list, but `.combine = c`, `.combine = "+"`, or `.combine = rbind` are common. Getting the sequential version right first means the parallel switch is a one-character change.

</details>

### Exercise 4.2: Parallel foreach with doParallel and combine = c

**Task:** The audit team needs the parallel sum of squares 1^2 + 2^2 + ... + 10^2 = 385, computed with `foreach` over a `doParallel` backend on two workers, using `.combine = "+"` to sum inside the foreach call directly. Register the backend, run the loop, stop the cluster, and save the integer sum to `ex_4_2`.

**Expected result:**

```
#> [1] 385
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cl <- parallel::makeCluster(2)
doParallel::registerDoParallel(cl)
on.exit(parallel::stopCluster(cl))
ex_4_2 <- foreach::foreach(i = 1:10, .combine = "+") %dopar% {
  i^2
}
parallel::stopCluster(cl)
ex_4_2
#> [1] 385
```

**Explanation:** `.combine = "+"` calls `Reduce("+", results)` so the workers can each compute partial squares and the reducer adds them, which avoids materializing a length-10 vector in the parent. Common combiners: `c` for a flat vector, `cbind`/`rbind` for matrices, `data.frame` for tabular output (slow on big data, prefer `dplyr::bind_rows()` afterward). The `registerDoParallel()` plus `stopCluster()` pair is the boilerplate; the modern alternative is `doFuture::registerDoFuture()` to drive `foreach` with whatever `future` plan is active.

</details>

### Exercise 4.3: Reproducible parallel foreach with doRNG

**Task:** A biostatistician needs five parallel `rnorm(3)` draws that are bit-identical across runs and across worker counts. Register `doParallel` over two workers, use the `%dorng%` operator from the `doRNG` package with a seed of 42, and bind the rows of the five three-element vectors into a 5x3 matrix. Save to `ex_4_3`.

**Expected result:**

```
#>             [,1]       [,2]       [,3]
#> [1,]  0.8597694  1.3286145 -0.8919004
#> [2,] -0.4796100  0.2173026 -0.0556542
#> [3,]  0.1571086 -0.9685743  0.4022046
#> [4,] -0.2773792  1.1471551  1.4060958
#> [5,]  1.4669218 -0.1232078  0.2842646
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cl <- parallel::makeCluster(2)
doParallel::registerDoParallel(cl)
on.exit(parallel::stopCluster(cl))
ex_4_3 <- foreach::foreach(i = 1:5, .combine = rbind,
                           .options.RNG = 42) %dorng% {
  rnorm(3)
}
attr(ex_4_3, "rng") <- NULL  # drop the rng attribute for printing
rownames(ex_4_3) <- NULL
parallel::stopCluster(cl)
ex_4_3
```

**Explanation:** `%dorng%` from the `doRNG` package replaces `%dopar%` and threads a parallel-safe L'Ecuyer-CMRG stream through every iteration. The `.options.RNG = 42` argument seeds that stream so the same seed produces the same numbers regardless of how many workers handle each iteration. Plain `%dopar%` plus `set.seed()` is NOT reproducible because the timing of worker hand-offs is non-deterministic; reach for `%dorng%` whenever results need to match across runs.

</details>

## Section 5. Real-world parallel workflows (5 problems)

### Exercise 5.1: Parallel bootstrap of the mtcars mpg median

**Task:** A statistician wants a parallel bootstrap of the median mpg in `mtcars` using 1,000 resamples with a reproducible seed. Set `plan(multisession, workers = 2)` and use `furrr::future_map_dbl()` with `furrr_options(seed = 7)` to return the median of each resampled vector. Save the length-1000 numeric vector to `ex_5_1` and print its `summary()`.

**Expected result:**

```
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   15.00   18.50   19.20   19.27   20.10   24.40
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_1 <- # your code here
summary(ex_5_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
ex_5_1 <- furrr::future_map_dbl(
  seq_len(1000),
  function(i) median(sample(mtcars$mpg, replace = TRUE)),
  .options = furrr::furrr_options(seed = 7)
)
summary(ex_5_1)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   15.00   18.50   19.20   19.27   20.10   24.40
future::plan(future::sequential)
```

**Explanation:** Bootstrap is the textbook parallel workload: 1,000 independent resamples with no cross-iteration state. The seed option threads a reproducible RNG stream so a 5-worker run and a 16-worker run produce the same 1,000 medians in the same positions. For real production bootstraps, 1,000 iterations is a starting point; precision of the standard error scales with sqrt(B), so 10,000 is a common target when CIs need a third significant digit.

</details>

### Exercise 5.2: Parallel cross-validation MSE across 5 folds

**Task:** An ML engineer is timing 5-fold linear-regression cross-validation in parallel on `mtcars`. Split row indices into 5 folds, fit `mpg ~ wt + hp` on the training rows, predict on the held-out fold, and return the fold's mean squared error. Use `future_map_dbl()` with `furrr_options(seed = 1)`. Save the length-5 vector to `ex_5_2`.

**Expected result:**

```
#> [1]  5.06  9.32  4.81  7.55  3.18    # 5 fold MSEs; mean ~ 5.98
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
set.seed(1)
folds <- split(sample(seq_len(nrow(mtcars))), rep(1:5, length.out = nrow(mtcars)))
ex_5_2 <- furrr::future_map_dbl(
  folds,
  function(test_idx) {
    train <- mtcars[-test_idx, , drop = FALSE]
    test  <- mtcars[ test_idx, , drop = FALSE]
    fit   <- lm(mpg ~ wt + hp, data = train)
    mean((predict(fit, test) - test$mpg)^2)
  },
  .options = furrr::furrr_options(seed = 1)
)
ex_5_2
future::plan(future::sequential)
```

**Explanation:** Each fold is independent so cross-validation parallelizes perfectly. Two seed touch points matter: `set.seed(1)` before `sample()` controls how rows are assigned to folds (a serial operation), and `furrr_options(seed = 1)` controls any random calls inside the worker function. For pure least-squares regression there are no random calls in the fit, but the option is still wise habit so the same code stays reproducible when you swap in random forest or boosting.

</details>

### Exercise 5.3: Embarrassingly parallel Monte Carlo pi estimation

**Task:** A take-home interviewer asks for a parallel Monte Carlo estimate of pi using 4 batches of 100,000 draws each (400,000 total). Inside each batch, draw uniform x and y in [-1, 1] and count the fraction inside the unit circle; multiply by 4 to estimate pi. Use `future_map_dbl()` with `furrr_options(seed = 99)`, then average the four estimates. Save the scalar estimate to `ex_5_3`.

**Expected result:**

```
#> [1] 3.141758   # close to pi = 3.14159; exact value reproducible
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
batch_pi <- function(n) {
  x <- runif(n, -1, 1)
  y <- runif(n, -1, 1)
  4 * mean(x^2 + y^2 <= 1)
}
estimates <- furrr::future_map_dbl(
  rep(1e5, 4),
  batch_pi,
  .options = furrr::furrr_options(seed = 99)
)
ex_5_3 <- mean(estimates)
ex_5_3
#> [1] 3.141758
future::plan(future::sequential)
```

**Explanation:** Monte Carlo with independent batches is the canonical "embarrassingly parallel" workload: zero cross-batch communication, perfect linear speedup until disk or RAM bottlenecks kick in. Computing one mean of the per-batch estimates is mathematically equivalent to one large estimate when batch sizes are equal, and it gives you a free per-batch standard error: `sd(estimates) / sqrt(length(estimates))` quantifies how much pi is wandering between batches.

</details>

### Exercise 5.4: Parallel grouped summarise across diamonds carat bins

**Task:** A jeweller wants the median price per carat bin for the `ggplot2::diamonds` data, computed in parallel across the 6 bins. Cut carat into `c(0, 0.5, 1, 1.5, 2, 3, 6)`, split the data into bin-keyed groups, and use `future_map_dfr(.id = "carat_bin")` to return one row per bin with the bin label and median price. Save the tibble to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   carat_bin median_price
#>   <chr>            <dbl>
#> 1 (0,0.5]            718
#> 2 (0.5,1]           2245
#> 3 (1,1.5]           6011
#> 4 (1.5,2]          11791
#> 5 (2,3]            14749.
#> 6 (3,6]            16238
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
d <- ggplot2::diamonds
d$carat_bin <- cut(d$carat, breaks = c(0, 0.5, 1, 1.5, 2, 3, 6))
ex_5_4 <- furrr::future_map_dfr(
  split(d, d$carat_bin),
  function(chunk) tibble::tibble(median_price = median(chunk$price)),
  .id = "carat_bin"
)
ex_5_4
future::plan(future::sequential)
```

**Explanation:** Splitting before mapping is fine for a handful of groups, but for hundreds of groups the serialization cost (each chunk is shipped to a worker) dominates. The rule of thumb: each chunk should keep a worker busy for at least 50 to 100 milliseconds, otherwise stay sequential or batch groups together. For very many tiny groups, plain `dplyr::summarise()` or `data.table` is faster than any parallel approach because it stays single-threaded but vectorized.

</details>

### Exercise 5.5: Parallel hyperparameter grid sweep

**Task:** A scout wants the AIC of `lm(mpg ~ ., data = mtcars)` evaluated across a grid of three subset sizes (4, 6, 8 predictors taken in order) in parallel. For each `k`, fit `lm` using only the first `k` predictor columns (cols 2 to k+1 of mtcars) and return AIC. Use `future_map_dfr()` to build a tibble with columns `k` and `aic`. Save to `ex_5_5`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>       k    aic
#>   <int>  <dbl>
#> 1     4   163.
#> 2     6   161.
#> 3     8   163.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
ex_5_5 <- furrr::future_map_dfr(
  c(4, 6, 8),
  function(k) {
    sub <- mtcars[, c(1, 2:(k + 1))]
    fit <- lm(mpg ~ ., data = sub)
    tibble::tibble(k = k, aic = AIC(fit))
  }
)
ex_5_5
future::plan(future::sequential)
```

**Explanation:** Hyperparameter sweeps are the second canonical parallel workload after Monte Carlo: each configuration is independent and fits a complete model. For a real sweep with thousands of configurations, prefer `tune` (tidymodels) or `mlr3` which add resume-on-failure, progress bars, and intelligent search; for a quick custom sweep with under a thousand cells, `future_map_dfr()` plus a small parameter grid is faster to write and good enough.

</details>

## Section 6. Reliability, benchmarking, and shutdown (3 problems)

### Exercise 6.1: Catch worker errors with safely

**Task:** A platform engineer wants a parallel job that does NOT crash on a single failed worker: input `c(4, -1, 9, -2, 16)` with `sqrt()` should produce results for the non-negative values and capture errors for the negative ones (using base R, `sqrt(-1)` returns NaN with a warning, not an error, so use a guard that throws an error on negative input). Wrap with `purrr::safely()` and run via `future_map()`. Save the list-of-result-error pairs to `ex_6_1` and extract just the successful results.

**Expected result:**

```
#> $`1`
#> [1] 2
#>
#> $`2`
#> NULL                # negative input, captured as error
#>
#> $`3`
#> [1] 3
#> ... (2 more elements)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_1 <- # your code here
purrr::map(ex_6_1, "result")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
guarded_sqrt <- purrr::safely(function(x) {
  if (x < 0) stop("negative input")
  sqrt(x)
})
ex_6_1 <- furrr::future_map(c(4, -1, 9, -2, 16), guarded_sqrt)
purrr::map(ex_6_1, "result")
#> $`1`
#> [1] 2
#>
#> $`2`
#> NULL
#>
#> $`3`
#> [1] 3
future::plan(future::sequential)
```

**Explanation:** `safely()` wraps a function so it returns a list with two slots: `result` (or NULL on error) and `error` (or NULL on success). In parallel code this is the difference between a job that finishes with partial output and a job that crashes on iteration 47 of 10,000. The sibling `purrr::possibly(f, otherwise = NA)` is simpler when you just want a sentinel value, while `safely()` keeps the error messages for post-mortem inspection.

</details>

### Exercise 6.2: Benchmark sequential vs parallel apply

**Task:** A performance reviewer wants concrete evidence that parallelism helps only when the per-iteration work is expensive enough. Use `microbenchmark::microbenchmark()` to compare `lapply()` versus `future.apply::future_lapply()` (under `plan(multisession, workers = 2)`) on a workload that sleeps 0.1 seconds and returns x^2 for x in 1:4 (40 calls reduced into 4 here). Save the benchmark object's median times in milliseconds as a named numeric vector to `ex_6_2`.

**Expected result:**

```
#>   sequential     parallel
#>        ~ 400         ~ 220   # ms; parallel ~2x faster on 2 workers
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
work <- function(x) { Sys.sleep(0.1); x^2 }
bm <- microbenchmark::microbenchmark(
  sequential = lapply(1:4, work),
  parallel   = future.apply::future_lapply(1:4, work),
  times = 3
)
medians <- aggregate(time ~ expr, data = bm, FUN = median)
ex_6_2 <- setNames(medians$time / 1e6, medians$expr)
ex_6_2
future::plan(future::sequential)
```

**Explanation:** Parallel speedup is bounded by Amdahl's law: only the iterated portion benefits, while serialization (shipping inputs to workers, receiving outputs) is fixed overhead. The 0.1-second sleep makes the iteration heavy enough that two workers roughly halve the wall time. If you halve the sleep to 0.001 seconds, the overhead dominates and `multisession` is SLOWER than `lapply()`. The "should I parallelize?" question is empirical: benchmark first, then decide.

</details>

### Exercise 6.3: Clean shutdown of multisession workers

**Task:** The SRE oncall is responding to an alert about R sessions consuming memory after a long script finished. Show the right shutdown idiom: start `plan(multisession, workers = 2)`, run a trivial `future_map(1:2, sqrt)` job, then explicitly tear down the workers by setting `plan(sequential)`. Capture the post-shutdown plan class name. Save it to `ex_6_3`.

**Expected result:**

```
#> [1] "sequential"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
future::plan(future::multisession, workers = 2)
invisible(furrr::future_map(1:2, sqrt))
future::plan(future::sequential)
ex_6_3 <- class(future::plan())[1]
ex_6_3
#> [1] "sequential"
```

**Explanation:** `multisession` workers persist across calls so subsequent jobs avoid the spawn overhead, but they keep R processes (and their memory) alive in the background until the script ends or you explicitly reset the plan. Setting `plan(sequential)` is the documented teardown idiom; it sends a shutdown signal to the worker pool. Leaving stale workers around is a common cause of "my laptop is hot for no reason" tickets and shows up as orphaned `Rscript` processes in `top`.

</details>

## What to do next

- Read [Parallel Computing in R](Parallel-Computing-in-R.html) for the conceptual overview of cores, processes, and the cost model behind the choices in these exercises.
- Try [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) for the sequential `lapply`, `sapply`, `vapply` patterns these problems parallelize.
- Work through [Functional Programming in R Exercises](Functional-Programming-in-R-Exercises.html) for the purrr `map` family that `furrr` mirrors.
- For grouped-data workflows where parallel maps shine, see [dplyr Exercises in R](dplyr-Exercises-in-R.html).
