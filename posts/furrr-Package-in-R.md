---
title: "furrr Package in R: Parallel purrr With the future Backend"
slug: "furrr-Package-in-R"
description: "The furrr package gives you parallel versions of purrr's map() family with a one-line switch. Same API, same results, multicore speed. Here is how to use it safely."
keywords: "furrr package R, parallel purrr, future_map, R parallel processing, future R package"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-4"
post_type: "FR"
auto_link_terms: "furrr|future_map|parallel purrr|parallel R"
auto_link_case_sensitive: false
fr_parent: "purrr-map-Variants.html"
---

# furrr Package in R: Parallel purrr With the future Backend

<p class="lead">The <code>furrr</code> package provides <code>future_map()</code>, <code>future_map_dbl()</code>, <code>future_map2()</code>, and friends — parallel drop-in replacements for <code>purrr::map()</code>. Set a plan with <code>future::plan(multisession)</code> and switch <code>map</code> to <code>future_map</code>; everything else stays the same.</p>

Parallel programming is often oversold — most R code is not CPU-bound, and the setup cost of spawning workers can exceed the savings. But when you genuinely need parallelism (fitting 500 models, hitting 200 APIs, bootstrapping 10000 times), `furrr` is the cleanest way to get it. You keep purrr's API; you gain multiple cores.

## What Is furrr and How Does It Differ From purrr?

`furrr` is a bridge between [purrr](purrr-map-Variants.html) and the `future` parallel-processing framework. Every function in `furrr` mirrors a purrr function, prefixed with `future_`. The API is identical; the execution happens across multiple workers.

```r
library(purrr)
library(furrr)

# Sequential (purrr): one worker, one task at a time
slow_square <- function(x) { Sys.sleep(0.1); x^2 }

system.time(map_dbl(1:8, slow_square))
#>    user  system elapsed
#>   0.010   0.000   0.812

# Parallel (furrr): 4 workers, 4 tasks at a time
plan(multisession, workers = 4)
system.time(future_map_dbl(1:8, slow_square))
#>    user  system elapsed
#>   0.150   0.020   0.231
```

Same inputs, same results, 3-4x faster on a 4-core machine. The `plan(multisession, workers = 4)` line tells `future` to spawn four background R sessions; `future_map_dbl` distributes the eight elements across them. When the call finishes, the workers stay alive for future calls — you pay the spawn cost once per session, not once per `future_map`.

[KEY INSIGHT]
**furrr parallelises *across elements*, not within a single call.** Each element of your input runs on one worker. This means `future_map_dbl(x, f)` helps when you have many elements and `f` is slow; it does nothing when you have one element and `f` is internally serial.

## How Do You Set Up `future::plan()`?

`future::plan()` tells the `future` package how to run the parallel tasks. The common plans are:

| Plan | Meaning |
|---|---|
| `sequential` | Run serially (default; useful for debugging) |
| `multisession` | Spawn background R sessions on the same machine |
| `multicore` | Fork the R process (Unix/macOS only; unsafe in RStudio) |
| `cluster` | Run on a remote cluster with specified nodes |

```r
library(future)
library(furrr)

# 4 workers on local machine
plan(multisession, workers = 4)

# Back to serial
plan(sequential)
```

For day-to-day work on a laptop, `multisession` is the right choice — safe on all platforms, RStudio-compatible, and easy to configure. `multicore` is marginally faster on Unix because it forks instead of spawning, but it does not play well with RStudio.

## What Does `.options = furrr_options()` Do?

By default, `furrr` sends everything visible in your current environment to each worker. If your function uses a 500 MB data frame you loaded earlier, that frame is serialised and copied to every worker — possibly tanking the gains. `furrr_options()` lets you control what travels to workers and how random seeds are managed.

```r
library(furrr)
plan(multisession, workers = 4)

# Safe random numbers: each element gets a distinct, reproducible seed
results <- future_map_dbl(
  1:8,
  \(x) rnorm(1),
  .options = furrr_options(seed = TRUE)
)
```

Setting `seed = TRUE` is the single most important option. Without it, parallel random number generation is either non-reproducible or uses the same stream on every worker — both bad. `seed = TRUE` tells `furrr` to use the L'Ecuyer-CMRG RNG, which produces distinct reproducible streams per element.

[WARNING]
**Forgetting `seed = TRUE` on a parallel RNG task is a silent bug.** Your output will look plausible but cannot be reproduced and may be statistically wrong. If your function calls `rnorm`, `sample`, `runif`, or any random draw, always pass `seed = TRUE` to `future_map`.

## When Does Parallelism Actually Pay Off?

The break-even point is roughly: **each task should take at least 100 ms**. Below that, the overhead of serialising the task, sending it to a worker, and collecting the result dominates.

```r
library(furrr)
plan(multisession, workers = 4)

# Fast task: parallel is SLOWER because of overhead
system.time(map_dbl(1:1000, \(x) x^2))
#>    elapsed: 0.003

system.time(future_map_dbl(1:1000, \(x) x^2))
#>    elapsed: 0.650
```

`x^2` runs in microseconds. `future_map_dbl` wastes time serialising a thousand trivial tasks to workers. The fix is to batch: parallelise coarse-grained work (whole models, whole files, whole APIs), not fine-grained work (individual arithmetic operations).

**Try it:** Measure `future_map` vs `map` for `Sys.sleep(0.1)` on `1:4` with 4 workers. You should see ~0.1s vs ~0.4s.

```r
library(furrr)
plan(multisession, workers = 4)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(furrr)
plan(multisession, workers = 4)

system.time(map(1:4, \(x) Sys.sleep(0.1)))
#> elapsed ~0.40

system.time(future_map(1:4, \(x) Sys.sleep(0.1)))
#> elapsed ~0.10 (plus first-call overhead)
```

**Explanation:** Four workers sleep simultaneously; total wall time drops to the duration of a single sleep. First call pays a one-time ~1s spawn cost.

</details>

## Can You Show a Progress Bar?

Yes — pass `.progress = TRUE` to any `future_map*` call. `furrr` then prints a progress bar as tasks complete.

```r
library(furrr)
plan(multisession, workers = 4)

results <- future_map_dbl(
  1:20,
  \(x) { Sys.sleep(0.1); x^2 },
  .progress = TRUE
)
#> Progress: [====================] 100% eta: 0s
```

For long-running parallel jobs — fitting models, scraping sites — the bar is invaluable. You can see whether it will finish in 10 seconds or 10 hours.

## Practice Exercises

### Exercise 1: Parallel Bootstrap of the Mean

Use `future_map_dbl` with `seed = TRUE` to compute 100 bootstrap estimates of `mean(mtcars$mpg)`. Compare timing to sequential `map_dbl`.

```r
library(furrr)
plan(multisession, workers = 4)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(furrr)
plan(multisession, workers = 4)

boot_mean <- function(i) mean(sample(mtcars$mpg, replace = TRUE))

boot_results <- future_map_dbl(
  1:100,
  boot_mean,
  .options = furrr_options(seed = TRUE)
)

quantile(boot_results, c(0.025, 0.975))
```

**Explanation:** Each element `i` is a bootstrap replicate. `seed = TRUE` gives each replicate a reproducible, independent random stream. The quantiles form a 95% bootstrap confidence interval.

</details>

### Exercise 2: Convert a purrr Chain to furrr

Given `map_dfr(1:5, \(i) data.frame(i = i, v = i * 10))`, convert to a parallel version with a progress bar.

```r
library(furrr)
plan(multisession, workers = 4)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(furrr)
plan(multisession, workers = 4)

future_map_dfr(
  1:5,
  \(i) data.frame(i = i, v = i * 10),
  .progress = TRUE
)
#>   i  v
#> 1 1 10
#> 2 2 20
#> 3 3 30
#> 4 4 40
#> 5 5 50
```

**Explanation:** `future_map_dfr` is the parallel twin of `map_dfr`. For trivially fast tasks like this one, the sequential version is still faster — but the pattern is what matters.

</details>

## Summary

| Question                         | Answer                                               |
|----------------------------------|------------------------------------------------------|
| What does furrr provide?         | Parallel drop-ins for every `purrr::map*` function.  |
| How do I enable parallelism?     | `future::plan(multisession, workers = N)`            |
| What plan should I use?          | `multisession` for laptops; `cluster` for HPC        |
| How do I make RNG reproducible?  | `.options = furrr_options(seed = TRUE)`              |
| When is it worth it?             | Tasks >100 ms each, many elements                    |

## References

1. `furrr` package documentation. [Link](https://furrr.futureverse.org/)
2. `future` package — the parallel backend. [Link](https://future.futureverse.org/)
3. Bengtsson, H. — *A Unifying Framework for Parallel and Distributed Processing in R using Futures*. [Link](https://journal.r-project.org/archive/2021/RJ-2021-048/)
4. `purrr` package. [Link](https://purrr.tidyverse.org/)
5. L'Ecuyer, P. et al. — *RngStreams: A C++ RNG library*. (The algorithm behind `seed = TRUE`.)

## Continue Learning

- [purrr map() Variants](purrr-map-Variants.html) — the parent topic; furrr mirrors its API.
- [Functional Programming in R](Functional-Programming-in-R.html) — why map-based parallelism is easy to reason about.
- [Writing Composable R Code](Writing-Composable-R-Code.html) — composable functions parallelise for free.
