---
title: "furrr Package in R: Parallel purrr with future Backend"
slug: "furrr-Package-in-R"
description: "Run purrr's map functions in parallel using furrr and the future package. Drop-in replacements: future_map(), future_map2(), future_pmap() with examples."
keywords: "furrr R, parallel purrr, future_map, parallel map R, future package R, parallel iteration R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-func-4"
post_type: "FR"
auto_link_terms: "furrr|future_map|parallel purrr"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# furrr Package in R: Parallel purrr with future Backend

<p class="lead"><code>furrr</code> provides drop-in parallel replacements for every <code>purrr</code> map function. Change <code>map()</code> to <code>future_map()</code> and your code runs across multiple CPU cores — no other changes needed.</p>

If your `map()` call takes minutes because each iteration is slow (API calls, model fitting, file processing), furrr can cut that time proportionally to the number of cores available.

## Setup

```r
# Install if needed
# install.packages(c("furrr", "future"))

library(furrr)
library(purrr)

# Tell future to use multiple cores
plan(multisession, workers = 2)  # Use 2 workers
cat("Parallel plan active:", nbrOfWorkers(), "workers\n")
```

## Basic Usage: future_map()

The API mirrors purrr exactly. Replace `map` with `future_map`.

```r
library(furrr)
library(purrr)
plan(multisession, workers = 2)

# Simulate slow computation
slow_square <- function(x) {
  Sys.sleep(0.5)
  x^2
}

# Sequential (purrr)
t_seq <- system.time(
  results_seq <- map_dbl(1:4, slow_square)
)

# Parallel (furrr)
t_par <- system.time(
  results_par <- future_map_dbl(1:4, slow_square)
)

cat("Sequential:", t_seq["elapsed"], "sec\n")
cat("Parallel:  ", t_par["elapsed"], "sec\n")
cat("Results match:", identical(results_seq, results_par), "\n")

plan(sequential)  # Reset
```

## All furrr Functions

| purrr | furrr (parallel) |
|-------|-----------------|
| `map()` | `future_map()` |
| `map_dbl()` | `future_map_dbl()` |
| `map_chr()` | `future_map_chr()` |
| `map_lgl()` | `future_map_lgl()` |
| `map2()` | `future_map2()` |
| `imap()` | `future_imap()` |
| `pmap()` | `future_pmap()` |
| `walk()` | `future_walk()` |

## Execution Plans

The `plan()` function controls how futures are resolved.

```r
library(furrr)

# Sequential (no parallelism — same as purrr)
plan(sequential)

# Multisession (separate R processes — works everywhere)
plan(multisession, workers = 2)

# Multicore (forked processes — faster, Unix/Mac only)
# plan(multicore, workers = 4)

# Check current plan
cat("Current plan:", class(plan())[1], "\n")
cat("Workers:", nbrOfWorkers(), "\n")

plan(sequential)  # Reset when done
```

## Practical: Parallel Model Fitting

```r
library(furrr)
library(purrr)
plan(multisession, workers = 2)

# Fit models with different formulas in parallel
formulas <- list(
  mpg ~ wt,
  mpg ~ wt + hp,
  mpg ~ wt + hp + cyl,
  mpg ~ wt * hp
)

models <- future_map(formulas, \(f) {
  lm(f, data = mtcars)
})

# Extract R-squared from each model
r_squared <- map_dbl(models, \(m) summary(m)$r.squared)
cat("R-squared values:", round(r_squared, 3), "\n")

plan(sequential)
```

## Progress Bars

furrr supports progress tracking with the `progressr` package.

```r
library(furrr)
library(purrr)
plan(multisession, workers = 2)

# Enable progress reporting
results <- future_map(1:10, \(x) {
  Sys.sleep(0.2)
  x^2
}, .progress = TRUE)

cat("Results:", unlist(results), "\n")
plan(sequential)
```

## When to Use furrr

| Situation | Use furrr? |
|-----------|-----------|
| Each iteration takes > 1 second | Yes |
| Many quick iterations (microseconds each) | No (overhead > gain) |
| Each iteration is independent | Yes |
| Iterations share mutable state | No |
| Need reproducible random numbers | Yes (with `furrr_options(seed = TRUE)`) |

## Seed Control for Reproducibility

```r
library(furrr)
plan(multisession, workers = 2)

# Without seed: different results each run
# With seed: reproducible parallel random numbers
results <- future_map_dbl(
  1:5,
  \(x) rnorm(1),
  .options = furrr_options(seed = 123)
)
cat("Reproducible results:", round(results, 3), "\n")

plan(sequential)
```

## Practice Exercises

### Exercise 1: Parallel Simulation

Run 100 bootstrap iterations in parallel.

```r
library(furrr)
library(purrr)
plan(multisession, workers = 2)

# Bootstrap the mean of mtcars$mpg
# 1. Create a function that takes an index, samples mtcars with replacement, returns mean(mpg)
# 2. Run it 100 times in parallel with future_map_dbl
# 3. Report the bootstrap confidence interval

plan(sequential)
```

<details>
<summary>Click to reveal solution</summary>

```r
library(furrr)
library(purrr)
plan(multisession, workers = 2)

boot_mean <- function(i) {
  sample_data <- mtcars[sample(nrow(mtcars), replace = TRUE), ]
  mean(sample_data$mpg)
}

boot_results <- future_map_dbl(1:100, boot_mean,
  .options = furrr_options(seed = 42))

cat("Bootstrap mean:", round(mean(boot_results), 2), "\n")
cat("95% CI:", round(quantile(boot_results, c(0.025, 0.975)), 2), "\n")

plan(sequential)
```

**Explanation:** Each bootstrap iteration is independent — perfect for parallelization. The seed option ensures reproducible results across parallel workers.

</details>

## Summary

| Feature | Detail |
|---------|--------|
| Install | `install.packages("furrr")` |
| Setup | `plan(multisession, workers = N)` |
| Usage | Replace `map` with `future_map` |
| Cleanup | `plan(sequential)` when done |
| Seeds | `furrr_options(seed = TRUE)` |
| Progress | `.progress = TRUE` argument |

## FAQ

### How many workers should I use?

Start with `parallel::detectCores() - 1` to leave one core free for your OS. More workers isn't always faster — there's overhead for each worker process.

### Does furrr work on Windows?

Yes. `plan(multisession)` works on all platforms. `plan(multicore)` only works on Unix/macOS (it uses forking, which Windows doesn't support).

### Why is my parallel code slower than sequential?

Parallel overhead (starting workers, sending data, collecting results) exceeds the computation time. This happens when individual iterations are very fast. Parallelism helps when each iteration takes at least a few hundred milliseconds.

## What's Next?

- [purrr map() Variants](/purrr-map-Variants.html) — the sequential versions furrr parallelizes
- [Functional Programming in R](/Functional-Programming-in-R.html) — the parent tutorial
- [Writing Composable R Code](/Writing-Composable-R-Code.html) — build pipelines that can be parallelized
