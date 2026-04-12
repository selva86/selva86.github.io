# Plan: furrr Package in R: Parallel purrr with future Backend

## A. Frontmatter

| Field | Value |
|---|---|
| title | furrr Package in R: Parallel purrr with future Backend |
| slug | furrr-Package-in-R |
| description | The furrr package turns any purrr map call into a parallel operation. Learn future_map(), plan(), furrr_options(), and seed control with runnable R examples. |
| keywords | furrr package R, future_map R, parallel purrr, furrr tutorial, parallel processing R, future_map2, furrr_options, parallel map R, R parallel computing, furrr future |
| auto_link_terms | furrr\|furrr package\|future_map()\|future_map2()\|furrr_options()\|parallel purrr\|furrr parallel |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-12 |
| curriculum_id | FR-func-4 |
| post_type | FR |
| fr_parent | purrr-map-Variants.html |

## B. Breadcrumb

Home > Learn R > Functional Programming > furrr Package in R: Parallel purrr with future Backend

## C. Full Section Outline

### Lead paragraph
The furrr package gives every purrr mapping function a parallel twin — swap `map()` for `future_map()`, set a `plan()`, and your code runs across multiple CPU cores with no other changes.

### First H2 opening prose (≤80 words)
"If your purrr pipeline already works correctly, you're one function swap away from running it in parallel. Let's load furrr and see the difference immediately."

---

### Core Content Sections (5 H2s)

#### H2-1: How do you convert a purrr workflow to furrr?
- **Theory:** furrr mirrors every purrr function with a `future_` prefix. The API is identical — same args, same output types. The only additions are `plan()` and `.options`.
- **Code block 1 (PAYOFF):** Load furrr, run `future_map()` on a simple numeric vector with a custom function, show output. Include `plan(multisession, workers = 2)` inline.
- **Code block 2:** Side-by-side comparison — `map_dbl()` vs `future_map_dbl()` computing square roots of 1:5.
- **Callout:** [NOTE] — WebR runs in a single-threaded browser environment so `plan(multisession)` falls back to sequential here; results are identical, only timing differs on your local R.
- **Inline exercise:** Write `future_map_chr()` to paste "Item-" before each element of `c("A", "B", "C")`.

#### H2-2: What does plan() do and which backend should you choose?
- **Theory:** `plan()` tells future (and furrr) how to resolve futures. Key plans: `sequential` (default, no parallelism), `multisession` (new R sessions on same machine — safest cross-platform), `multicore` (forked processes — Linux/Mac only, faster but not safe with RStudio GUI).
- **Code block 3:** Show `plan(sequential)` then `plan(multisession, workers = 4)` with `availableCores()`.
- **Code block 4:** Demonstrate resetting with `plan(sequential)` after parallel work.
- **Callout:** [TIP] — Use `plan(multisession, workers = availableCores() - 1)` to keep one core free for your OS and RStudio.
- **Table:** Plan comparison table (plan name, platform, overhead, best for).
- **Inline exercise:** Write code to check how many cores are available and set a plan using half of them.

#### H2-3: How do future_map2() and future_pmap() handle multiple inputs?
- **Theory:** `future_map2()` iterates over two vectors in parallel (like `map2()`). `future_pmap()` iterates over any number of inputs passed as a list (like `pmap()`).
- **Code block 5:** `future_map2_dbl()` to compute weighted sums from two vectors.
- **Code block 6:** `future_pmap()` with a data frame of parameters to generate customized strings.
- **Callout:** [KEY INSIGHT] — "Parallel" in furrr means across CPU cores, not across inputs — each worker still processes its assigned chunk of inputs sequentially.
- **Inline exercise:** Use `future_map2_chr()` to paste first and last names from two vectors.

#### H2-4: How do you control seeds, globals, and chunking with furrr_options()?
- **Theory:** `furrr_options()` is the configuration hub. Key params: `seed` (reproducible RNG), `globals` (variables shipped to workers), `packages` (ensure attached), `scheduling`/`chunk_size` (how work is divided).
- **Code block 7:** Demonstrate `furrr_options(seed = 123)` for reproducible random sampling across workers.
- **Code block 8:** Show `furrr_options(globals = "my_lookup")` to explicitly pass a large lookup table.
- **Callout:** [WARNING] — Without `seed = TRUE` or a fixed seed, random operations inside `future_map()` produce different results every run and across different numbers of workers.
- **Table:** furrr_options() parameter quick-reference (param, type, default, purpose).
- **Inline exercise:** Use `future_map_dbl()` with `furrr_options(seed = 42)` to draw one random normal value per iteration across 5 iterations.

#### H2-5: When is furrr slower than purrr and how do you avoid the overhead trap?
- **Theory:** Parallelism has startup cost (spawning workers) and data transfer cost (serializing objects to/from workers). For lightweight operations, overhead > time saved. Rules of thumb: parallelize when each iteration takes >100ms, keep objects small, return only what you need.
- **Code block 9:** Benchmark a lightweight operation where furrr is slower than purrr (simple arithmetic on small vector).
- **Code block 10:** Benchmark a heavy operation (simulating 10K samples) where furrr wins.
- **Callout:** [TIP] — Use `tictoc::tic()` / `toc()` or `system.time()` to benchmark before committing to parallel. Not every loop benefits.
- **List:** Rules of thumb for when to parallelize (numbered list, 4 items).
- **Inline exercise:** Predict which of two tasks benefits from parallelization, then verify with timing.

---

### Tail Sections

#### Practice Exercises (2 exercises)
1. **Exercise 1 (medium):** Given a list of 5 data frames, use `future_map()` to compute column means for each, then bind results into one summary data frame.
2. **Exercise 2 (hard):** Use `future_pmap()` with `furrr_options(seed = 100)` to run a mini Monte Carlo simulation: for each row in a parameter grid (n, mean, sd), draw `n` random normal values and return the sample mean. Verify reproducibility by running twice.

#### Complete Example
End-to-end workflow: generate a parameter grid of simulation settings, use `future_pmap_dfr()` with seed control to run simulations across cores, collect results, summarize with dplyr.

#### Summary
Table of key concepts: function mapping (purrr→furrr), plan types, furrr_options params, when-to-parallelize rules.

#### References (8 sources)
1. furrr official site — furrr.futureverse.org
2. future package — CRAN/GitHub (Henrik Bengtsson)
3. purrr documentation — purrr.tidyverse.org
4. Davis Vaughan — furrr README/vignettes
5. Wickham & Grolemund — R for Data Science, Ch. 21 (Iteration)
6. CRAN furrr reference manual
7. R-bloggers — Tidy Parallel Processing with furrr (Matt Dancho, 2021)
8. future package vignette — "A Future for R" (Henrik Bengtsson)

#### Continue Learning
1. purrr map() in R — parent post covering all map variants
2. R Anonymous Functions — compact lambda syntax used inside map/future_map
3. Functional Programming in R — the broader FP landscape

## D. Diagram List

No diagrams for this FR post. The purrr→furrr function mapping and plan() concepts are best conveyed through comparison tables and progressive code blocks.

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load furrr + plan + future_map payoff | `furrr` | `result` | — |
| 2 | map_dbl vs future_map_dbl comparison | — | `seq_result`, `par_result` | — |
| 3 | plan() with availableCores() | — | `n_cores` | — |
| 4 | Resetting plan to sequential | — | — | — |
| 5 | future_map2_dbl weighted sums | — | `weights`, `values`, `weighted` | — |
| 6 | future_pmap with data frame of params | — | `params`, `labels` | — |
| 7 | furrr_options(seed) reproducible RNG | — | `samples` | — |
| 8 | furrr_options(globals) explicit globals | — | `my_lookup`, `looked_up` | — |
| 9 | Lightweight benchmark (furrr slower) | `tictoc` | — | — |
| 10 | Heavy benchmark (furrr faster) | — | — | — |
| 11 | Complete example: Monte Carlo simulation | `dplyr`, `tidyr` | `grid`, `sim_results`, `summary_df` | — |
