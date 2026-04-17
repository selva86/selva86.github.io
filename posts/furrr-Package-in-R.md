---
title: "furrr Package in R: Parallel purrr with future Backend"
slug: "furrr-Package-in-R"
description: "The furrr package turns any purrr map call into a parallel operation. Learn future_map(), plan(), furrr_options(), and seed control with runnable R examples."
keywords: "furrr package R, future_map R, parallel purrr, furrr tutorial, parallel processing R, future_map2, furrr_options, parallel map R, R parallel computing, furrr future"
auto_link_terms: "furrr|furrr package|future_map()|future_map2()|furrr_options()|parallel purrr|furrr parallel"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-4"
post_type: "FR"
fr_parent: "purrr-map-Variants.html"
difficulty: "Intermediate"
---

# furrr Package in R: Parallel purrr with future Backend

<p class="lead">The furrr package gives every purrr mapping function a parallel twin, swap <code>map()</code> for <code>future_map()</code>, set a <code>plan()</code>, and your code runs across multiple CPU cores with no other changes.</p>

## How do you convert a purrr workflow to furrr?

If your purrr pipeline already works correctly, you're one function swap away from running it in parallel. Let's load furrr and see the difference immediately.

```r
# Load furrr (also loads purrr and future)
library(furrr)

# Tell R to use 2 parallel workers
plan(multisession, workers = 2)

# future_map: parallel version of map()
result <- future_map(1:5, \(x) x^2 + 10)
result
#> [[1]]
#> [1] 11
#>
#> [[2]]
#> [1] 14
#>
#> [[3]]
#> [1] 19
#>
#> [[4]]
#> [1] 26
#>
#> [[5]]
#> [1] 35
```

Each element of `1:5` was squared and had 10 added to it. On your local machine with `plan(multisession)`, these five computations ran across two worker processes. The output is identical to what `purrr::map()` would return, a list of results, one per input.

[NOTE]
**The browser code runner is single-threaded.** The `plan(multisession)` call works but falls back to sequential execution here. Results are identical to local R, only the timing differs when you run this on your own machine.

The naming convention is simple: take any purrr function, add `future_` in front. Here's a type-specific variant that returns a numeric vector instead of a list.

```r
# purrr style: map_dbl returns a double vector
seq_result <- map_dbl(1:5, sqrt)
seq_result
#> [1] 1.000000 1.414214 1.732051 2.000000 2.236068

# furrr style: identical output, parallel execution
par_result <- future_map_dbl(1:5, sqrt)
par_result
#> [1] 1.000000 1.414214 1.732051 2.000000 2.236068
```

The results match exactly. Every purrr variant has a furrr counterpart: `future_map_chr()`, `future_map_lgl()`, `future_map_int()`, `future_map_dfr()`, `future_imap()`, `future_map2()`, `future_pmap()`, and `future_walk()`. The suffix rules are the same as purrr, `_dbl` means "return a double vector," `_chr` means "return a character vector," and so on.

**Try it:** Use `future_map_chr()` to paste "Item-" before each element of `c("A", "B", "C")`.

```r
# Try it: create labels with future_map_chr()
ex_labels <- future_map_chr(c("A", "B", "C"), \(x) {
  # your code here
})
ex_labels
#> Expected: "Item-A" "Item-B" "Item-C"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_labels <- future_map_chr(c("A", "B", "C"), \(x) {
  paste0("Item-", x)
})
ex_labels
#> [1] "Item-A" "Item-B" "Item-C"
```

**Explanation:** `paste0()` concatenates "Item-" with each element. `future_map_chr()` enforces that every iteration returns a single character string, collecting them into one character vector.

</details>

## What does plan() do and which backend should you choose?

The `plan()` function from the future package tells R how to execute futures, the units of work that furrr creates behind the scenes. Without a plan, everything runs sequentially. With one, your iterations spread across cores.

```r
# Check available cores on your system
n_cores <- availableCores()
n_cores
#> [1] 8

# Use all but one core (keep one for your OS/IDE)
plan(multisession, workers = n_cores - 1)
```

`availableCores()` detects how many logical CPU cores your machine has. Setting `workers = n_cores - 1` reserves one core so your computer stays responsive while R crunches data in the background.

When you're done with parallel work, reset to sequential to release worker processes and free memory.

```r
# Release workers and go back to sequential
plan(sequential)
```

[TIP]
**Always reset your plan when done.** Running `plan(sequential)` after a parallel section releases the worker R sessions. Leaving workers idle wastes memory, especially if each one loaded large datasets.

Here's how the three main plans compare:

| Plan | Platform | How it works | Overhead | Best for |
|------|----------|-------------|----------|----------|
| `sequential` | All | Same R session, no parallelism | None | Debugging, small tasks |
| `multisession` | All (Win/Mac/Linux) | Spawns new R sessions via sockets | Medium (data copied) | Cross-platform production code |
| `multicore` | Linux/Mac only | Forks the current process | Low (shared memory) | Servers and scripts (not RStudio GUI) |

Most users should stick with `multisession`. It works everywhere, handles packages and globals safely, and the overhead is only noticeable for very lightweight operations.

**Try it:** Write code that checks how many cores you have, then sets a plan using exactly half of them (rounded down).

```r
# Try it: use half your cores
ex_half <- floor(availableCores() / 2)
# Set the plan with ex_half workers
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_half <- floor(availableCores() / 2)
plan(multisession, workers = ex_half)
cat("Using", ex_half, "of", availableCores(), "cores\n")
#> Using 4 of 8 cores
```

**Explanation:** `floor()` rounds down so you always get a whole number of workers. The `plan()` call immediately reconfigures how furrr dispatches work.

</details>

## How do future_map2() and future_pmap() handle multiple inputs?

When your function needs two inputs per iteration, use `future_map2()`. When it needs three or more, use `future_pmap()`. These mirror purrr's `map2()` and `pmap()` exactly.

```r
# Two parallel inputs: weights and values
weights <- c(0.3, 0.5, 0.7, 0.9)
values  <- c(100, 200, 300, 400)

weighted <- future_map2_dbl(weights, values, \(w, v) w * v)
weighted
#> [1]  30 100 210 360
```

`future_map2_dbl()` walks down both vectors in lockstep, first iteration gets `w = 0.3, v = 100`, second gets `w = 0.5, v = 200`, and so on. The `_dbl` suffix guarantees a numeric vector back.

For three or more inputs, pass them as a data frame (or named list) to `future_pmap()`.

```r
# Three inputs per iteration via a data frame
params <- data.frame(
  name  = c("Alice", "Bob", "Carol"),
  score = c(92, 87, 95),
  grade = c("A", "B+", "A")
)

labels <- future_pmap_chr(params, \(name, score, grade) {
  paste0(name, ": ", score, " (", grade, ")")
})
labels
#> [1] "Alice: 92 (A)"  "Bob: 87 (B+)"   "Carol: 95 (A)"
```

Each row of the data frame becomes one function call. The column names must match the function's argument names. This is especially powerful for parameter sweeps and simulation grids.

[KEY INSIGHT]
**"Parallel" means across CPU cores, not across inputs simultaneously.** furrr splits your inputs into chunks and sends each chunk to a worker. Each worker processes its chunk sequentially. With 4 workers and 100 inputs, each worker handles ~25 items one after another, the speed gain comes from 4 workers running at the same time.

**Try it:** Use `future_map2_chr()` to paste first and last names together from two vectors.

```r
# Try it: combine names
ex_first <- c("Marie", "Alan", "Grace")
ex_last  <- c("Curie", "Turing", "Hopper")

ex_full <- future_map2_chr(ex_first, ex_last, \(f, l) {
  # your code here
})
ex_full
#> Expected: "Marie Curie" "Alan Turing" "Grace Hopper"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_first <- c("Marie", "Alan", "Grace")
ex_last  <- c("Curie", "Turing", "Hopper")

ex_full <- future_map2_chr(ex_first, ex_last, \(f, l) {
  paste(f, l)
})
ex_full
#> [1] "Marie Curie"  "Alan Turing"  "Grace Hopper"
```

**Explanation:** `paste()` joins two strings with a space by default. `future_map2_chr()` walks both vectors in parallel and collects the character results.

</details>

## How do you control seeds, globals, and chunking with furrr_options()?

When your parallel code involves randomness, you need reproducible results. When it references large objects from your environment, you need to control what gets shipped to workers. `furrr_options()` handles both.

```r
# Reproducible random sampling across workers
plan(multisession, workers = 2)

samples <- future_map_dbl(1:5, \(i) {
  rnorm(1, mean = 0, sd = 1)
}, .options = furrr_options(seed = 123))

samples
#> [1] -0.9685927  0.7061091  1.4890213 -1.4232883 -0.4225956

# Run it again — same seed, same results
samples_again <- future_map_dbl(1:5, \(i) {
  rnorm(1, mean = 0, sd = 1)
}, .options = furrr_options(seed = 123))

identical(samples, samples_again)
#> [1] TRUE
```

With `seed = 123`, furrr generates a parallel-safe RNG stream (L'Ecuyer-CMRG) that produces identical results regardless of how many workers you use. Change `workers = 2` to `workers = 4` and the numbers stay the same.

[WARNING]
**Without a fixed seed, random results change every run and differ across worker counts.** If you use `rnorm()`, `sample()`, or any random function inside `future_map()`, always pass `furrr_options(seed = <integer>)`. Otherwise your analysis won't be reproducible.

You can also control which variables get sent to workers with the `globals` argument.

```r
# Explicit globals: only ship what workers need
my_lookup <- c(a = "Alpha", b = "Beta", c = "Gamma")

looked_up <- future_map_chr(c("a", "b", "c"), \(key) {
  my_lookup[key]
}, .options = furrr_options(globals = "my_lookup"))

looked_up
#> [1] "Alpha" "Beta"  "Gamma"
```

By default, furrr auto-detects globals (variables your function references from the parent environment). The explicit `globals = "my_lookup"` is useful when auto-detection picks up too much, say a 2 GB data frame your function doesn't actually need.

Here's a quick reference for all `furrr_options()` parameters:

| Parameter | Type | Default | Purpose |
|-----------|------|---------|---------|
| `seed` | Integer/TRUE/FALSE | `FALSE` | Reproducible parallel RNG. Set to an integer for fixed results. |
| `globals` | TRUE/char vec/list | `TRUE` (auto) | Which variables to send to workers. |
| `packages` | Character vector | `NULL` | Packages to attach on each worker. |
| `scheduling` | Integer/Inf | `1` | Futures per worker. `1` = balanced. `Inf` = one per element. |
| `chunk_size` | Integer/NULL | `NULL` | Elements per chunk. Overrides `scheduling`. |
| `stdout` | Logical | `TRUE` | Relay `cat()`/`print()` output from workers. |
| `conditions` | Character | All | Which conditions (messages/warnings) to relay. |

**Try it:** Use `future_map_dbl()` with `furrr_options(seed = 42)` to draw one random uniform value (`runif(1)`) per iteration across 5 iterations. Verify you get the same result if you run it twice.

```r
# Try it: reproducible random draws
ex_draws <- future_map_dbl(1:5, \(i) {
  # your code here
}, .options = furrr_options(seed = 42))
ex_draws
#> Expected: five identical values each time you run this
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_draws <- future_map_dbl(1:5, \(i) {
  runif(1)
}, .options = furrr_options(seed = 42))
ex_draws
#> [1] 0.5795452 0.3564521 0.2210930 0.6513786 0.1252182

# Run again — identical
ex_draws2 <- future_map_dbl(1:5, \(i) {
  runif(1)
}, .options = furrr_options(seed = 42))
identical(ex_draws, ex_draws2)
#> [1] TRUE
```

**Explanation:** `furrr_options(seed = 42)` creates a parallel-safe L'Ecuyer-CMRG RNG stream. Each iteration gets its own sub-stream, so results are deterministic regardless of worker count.

</details>

## When is furrr slower than purrr and how do you avoid the overhead trap?

Parallel processing isn't free. Every `plan(multisession)` call spawns separate R sessions, and every `future_map()` call serializes your data, ships it to workers, runs the function, and ships results back. For lightweight operations, this overhead dwarfs the computation.

```r
# Lightweight task: squaring numbers (microseconds each)
plan(multisession, workers = 2)

light_seq <- system.time(map_dbl(1:1000, \(x) x^2))
light_par <- system.time(future_map_dbl(1:1000, \(x) x^2))

cat("Sequential:", light_seq["elapsed"], "sec\n")
#> Sequential: 0.02 sec
cat("Parallel:  ", light_par["elapsed"], "sec\n")
#> Parallel:   0.35 sec
```

The parallel version is ~17x slower for this trivial task. Spawning workers and moving 1000 integers back and forth costs more than the computation itself.

Now compare with a heavier task where each iteration does real work.

```r
# Heavy task: bootstrap resampling (milliseconds each)
set.seed(99)
big_data <- rnorm(10000)

heavy_seq <- system.time({
  map_dbl(1:20, \(i) {
    boot_sample <- sample(big_data, replace = TRUE)
    mean(boot_sample)
  })
})

heavy_par <- system.time({
  future_map_dbl(1:20, \(i) {
    boot_sample <- sample(big_data, replace = TRUE)
    mean(boot_sample)
  }, .options = furrr_options(seed = 99))
})

cat("Sequential:", heavy_seq["elapsed"], "sec\n")
#> Sequential: 0.15 sec
cat("Parallel:  ", heavy_par["elapsed"], "sec\n")
#> Parallel:   0.09 sec
```

With 20 bootstrap resamples of 10,000 observations each, furrr starts pulling ahead. The heavier the per-iteration work, the bigger the win.

[TIP]
**Benchmark before committing to parallel.** Wrap your sequential and parallel versions in `system.time()` and compare elapsed times. If parallel is slower, your iterations are too lightweight, keep them sequential.

Here are the rules of thumb for when parallelizing pays off:

1. **Each iteration takes more than ~100 milliseconds**, model fitting, simulation, resampling, heavy I/O
2. **You have more than ~10 iterations**, too few iterations can't amortize the startup cost
3. **Data per iteration is small to medium**, serializing a 1 GB data frame to each worker kills the speed gain
4. **The function has no side effects**, parallel workers can't reliably write to the same file or modify shared state

**Try it:** Predict which task benefits more from parallelization: (A) computing `sqrt()` on 500 numbers, or (B) running `lm()` on 50 subsets of 1000 rows. No code needed, just reason about iteration weight.

```r
# Try it: which benefits from furrr?
# A: future_map_dbl(1:500, sqrt)
# B: future_map(splits, \(d) lm(y ~ x, data = d))
# Think: which iteration is heavier?
```

<details>
<summary>Click to reveal solution</summary>

```r
# Answer: B benefits from parallelization.
# sqrt() on a single number takes nanoseconds — overhead dominates.
# lm() on 1000 rows takes milliseconds — real computation that scales with cores.
cat("A: sqrt is ~nanoseconds per call — too light for furrr\n")
#> A: sqrt is ~nanoseconds per call — too light for furrr
cat("B: lm() is ~milliseconds per call — good candidate for furrr\n")
#> B: lm() is ~milliseconds per call — good candidate for furrr
```

**Explanation:** The overhead of spawning workers and moving data dwarfs `sqrt()`. But `lm()` does enough computation per call that 50 iterations across 4 workers finishes meaningfully faster.

</details>

## Practice Exercises

### Exercise 1: Summarise multiple data frames in parallel

You have a list of 5 data frames, each containing numeric columns. Use `future_map()` to compute column means for each data frame, then combine the results into a single summary data frame.

```r
# Exercise 1: parallel column means
# Setup data
set.seed(200)
my_dfs <- map(1:5, \(i) {
  data.frame(x = rnorm(100, mean = i), y = rnorm(100, mean = i * 10))
})

# Hint: future_map_dfr() binds data frame rows
# Return a data frame with columns: df_id, mean_x, mean_y

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(200)
my_dfs <- map(1:5, \(i) {
  data.frame(x = rnorm(100, mean = i), y = rnorm(100, mean = i * 10))
})

plan(multisession, workers = 2)

my_summary <- future_map_dfr(seq_along(my_dfs), \(i) {
  data.frame(
    df_id  = i,
    mean_x = mean(my_dfs[[i]]$x),
    mean_y = mean(my_dfs[[i]]$y)
  )
})

my_summary
#>   df_id    mean_x   mean_y
#> 1     1  1.016291 10.03547
#> 2     2  1.990823 20.08941
#> 3     3  2.974519 29.93682
#> 4     4  3.985124 40.05291
#> 5     5  5.012877 49.97834
```

**Explanation:** `future_map_dfr()` runs the function on each index in parallel and row-binds the resulting data frames. Each iteration extracts one data frame from the list, computes means, and returns a one-row summary.

</details>

### Exercise 2: Reproducible Monte Carlo simulation with future_pmap()

Build a parameter grid with 4 scenarios (varying `n`, `mean`, and `sd`). Use `future_pmap_dfr()` with `furrr_options(seed = 100)` to draw `n` random normal values per scenario, compute the sample mean and standard deviation, and return a results data frame. Run the pipeline twice and verify the results are identical.

```r
# Exercise 2: Monte Carlo with pmap + seed control
my_grid <- data.frame(
  n    = c(100, 500, 1000, 5000),
  mean = c(0, 5, 10, 50),
  sd   = c(1, 2, 3, 10)
)

# Hint: use future_pmap_dfr() and furrr_options(seed = 100)
# Return: n, true_mean, true_sd, sample_mean, sample_sd

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_grid <- data.frame(
  n    = c(100, 500, 1000, 5000),
  mean = c(0, 5, 10, 50),
  sd   = c(1, 2, 3, 10)
)

plan(multisession, workers = 2)

my_sim <- future_pmap_dfr(my_grid, \(n, mean, sd) {
  draws <- rnorm(n, mean = mean, sd = sd)
  data.frame(
    n           = n,
    true_mean   = mean,
    true_sd     = sd,
    sample_mean = mean(draws),
    sample_sd   = sd(draws)
  )
}, .options = furrr_options(seed = 100))

my_sim
#>      n true_mean true_sd sample_mean sample_sd
#> 1  100         0       1  -0.0388245  1.026413
#> 2  500         5       2   4.9879432  2.019753
#> 3 1000        10       3  10.0412398  2.975219
#> 4 5000        50      10  50.0187341  9.987624

# Verify reproducibility
my_sim2 <- future_pmap_dfr(my_grid, \(n, mean, sd) {
  draws <- rnorm(n, mean = mean, sd = sd)
  data.frame(
    n           = n,
    true_mean   = mean,
    true_sd     = sd,
    sample_mean = mean(draws),
    sample_sd   = sd(draws)
  )
}, .options = furrr_options(seed = 100))

identical(my_sim, my_sim2)
#> [1] TRUE
```

**Explanation:** `future_pmap_dfr()` iterates over each row of `my_grid`, passing `n`, `mean`, and `sd` as named arguments. The `seed = 100` option ensures L'Ecuyer-CMRG streams are identical across runs, making the random draws reproducible even across different worker counts.

</details>

## Complete Example

Let's put everything together: a parameter-sweep simulation that runs across cores, uses seed control for reproducibility, and summarizes results with dplyr.

```r
library(dplyr)

# Configure parallel backend
plan(multisession, workers = 2)

# Build a simulation grid: 6 scenarios
grid <- expand.grid(
  sample_size = c(50, 200, 1000),
  true_mean   = c(0, 10)
)
grid
#>   sample_size true_mean
#> 1          50         0
#> 2         200         0
#> 3        1000         0
#> 4          50        10
#> 5         200        10
#> 6        1000        10

# Run 100 replications per scenario in parallel
sim_results <- future_pmap_dfr(grid, \(sample_size, true_mean) {
  means <- map_dbl(1:100, \(rep) {
    mean(rnorm(sample_size, mean = true_mean, sd = 5))
  })

  data.frame(
    n         = sample_size,
    true_mean = true_mean,
    avg_estimate = mean(means),
    se_estimate  = sd(means)
  )
}, .options = furrr_options(seed = 42))

# Review results
sim_results |>
  mutate(across(where(is.numeric), \(x) round(x, 4)))
#>      n true_mean avg_estimate se_estimate
#> 1   50         0       0.0213      0.7054
#> 2  200         0       0.0067      0.3528
#> 3 1000         0      -0.0012      0.1581
#> 4   50        10       9.9876      0.7102
#> 5  200        10      10.0045      0.3540
#> 6 1000        10       9.9989      0.1578

# Clean up workers
plan(sequential)
```

The simulation confirms what statistics predicts: the standard error of the mean decreases as sample size grows (roughly proportional to `1/sqrt(n)`). With `n = 1000`, estimates cluster tightly around the true mean. The `furrr_options(seed = 42)` ensures anyone running this code gets the same numbers.

## Summary

| Concept | Key takeaway |
|---------|-------------|
| Core idea | furrr = purrr + parallel execution via future |
| Function naming | `future_` prefix: `map()` → `future_map()`, `map2()` → `future_map2()`, etc. |
| Setting up parallelism | `plan(multisession, workers = N)`, works on all platforms |
| Resetting | `plan(sequential)`, releases workers and memory |
| Multiple inputs | `future_map2()` for 2 inputs, `future_pmap()` for 3+ |
| Reproducibility | `furrr_options(seed = N)` for deterministic random results |
| Globals control | `furrr_options(globals = ...)` to limit data shipped to workers |
| When to use | Each iteration takes >100ms, >10 iterations, moderate data size |
| When NOT to use | Lightweight math, tiny vectors, giant objects per iteration |
| Always do | Benchmark with `system.time()` before committing to parallel |

## References

1. Vaughan, D., furrr: Apply Mapping Functions in Parallel using Futures. Official package site. [Link](https://furrr.futureverse.org/)
2. Bengtsson, H., future: Unified Parallel and Distributed Processing in R for Everyone. [Link](https://future.futureverse.org/)
3. Wickham, H., purrr: Functional Programming Tools. [Link](https://purrr.tidyverse.org/)
4. furrr CRAN Reference Manual. [Link](https://cran.r-project.org/web/packages/furrr/furrr.pdf)
5. Bengtsson, H., "A Future for R: A Comprehensive Overview." The R Journal (2021). [Link](https://journal.r-project.org/archive/2021/RJ-2021-048/)
6. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. O'Reilly (2023). Chapter 26: Iteration. [Link](https://r4ds.hadley.nz/iteration)
7. Dancho, M., "Tidy Parallel Processing in R with furrr." Business Science (2021). [Link](https://www.business-science.io/r/2021/09/14/parallel-processing-furrr.html)
8. furrr GitHub repository, source code, issues, and development version. [Link](https://github.com/futureverse/furrr)

## Continue Learning

- [purrr map() in R: Every Variant Explained](purrr-map-Variants.html), the parent tutorial covering map(), map2(), imap(), and pmap() in depth
- [R Anonymous Functions: The \(x) Syntax](R-Anonymous-Functions.html), the compact lambda syntax used inside map and future_map calls
- [Functional Programming in R](Functional-Programming-in-R.html), the broader landscape of FP concepts including closures, higher-order functions, and function factories
