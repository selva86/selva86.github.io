---
title: "dplyr slice_sample() in R: Random Rows From a Tibble"
slug: "dplyr-slice_sample-in-R"
description: "Use dplyr slice_sample() to pull a random sample of n rows or a fraction from a tibble (or per group) in R. Covers replace, weight_by, .by, 5 examples."
keywords: "dplyr slice_sample, R random sample rows, slice_sample per group, dplyr sample_n, slice_sample replace, weighted sample R, slice_sample vs sample_n"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "slice_sample()|dplyr slice_sample|random sample rows|sample n rows|stratified sample"
auto_link_case_sensitive: true
target_keyword: "dplyr slice_sample"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr slice_sample() in R: Random Rows From a Tibble

<p class="lead">The <code>slice_sample()</code> function in dplyr returns a random sample of n rows (or a fraction) from a data frame, optionally per group, with or without replacement. It supersedes the older <code>sample_n()</code> and <code>sample_frac()</code>.</p>

[QUICK ANSWER]
slice_sample(df, n = 5)                       # 5 random rows
slice_sample(df, prop = 0.1)                  # 10% of rows
slice_sample(df, n = 3, by = cyl)             # 3 per group (stratified)
slice_sample(df, n = 5, replace = TRUE)       # bootstrap
slice_sample(df, n = 5, weight_by = w)        # weighted sample
df |> group_by(g) |> slice_sample(n = 3)      # equivalent grouped form
set.seed(42); slice_sample(df, n = 5)         # reproducible

[DECISION TREE: Is slice_sample() the right tool?]
- random n rows: slice_sample(n = N)
- random fraction: slice_sample(prop = 0.1)
- stratified random per group: slice_sample(n, by = g)
- bootstrap (sample with replacement): slice_sample(n, replace = TRUE)
- weighted random: slice_sample(n, weight_by = w)
- specific positional rows: slice(c(1,3,5))
- top n by value: slice_max() / slice_min()

## What slice_sample() does in one sentence

**`slice_sample(.data, n)` returns a random sample of `n` rows; `slice_sample(.data, prop = 0.1)` returns 10% of the rows.** On a grouped tibble (or with `by = g`), the sampling happens within each group.

This is the modern, group-aware random sampler. For new code, prefer it over `sample_n()` (deprecated).

## Syntax

**`slice_sample(.data, n = NULL, prop = NULL, weight_by = NULL, replace = FALSE, by = NULL)`. Pass `n` OR `prop`, not both.**

```r title="5 random cars"
library(dplyr)
set.seed(42)

mtcars |>
  slice_sample(n = 5)
#>             mpg cyl ...
#> Datsun 710 22.8   4
#> Camaro Z28 13.3   8
#> ... (5 random rows; depends on seed)
```

[TIP]
**Always set `set.seed()` before sampling for reproducibility.** Random samples without a seed differ across runs, which makes debugging and report regeneration harder.

## Five common patterns

### 1. Random n rows

```r title="Pick 10 at random"
set.seed(1)
mtcars |>
  slice_sample(n = 10)
```

### 2. Random fraction

```r title="20% sample"
mtcars |>
  slice_sample(prop = 0.2)
```

20% of 32 = ~6 rows.

### 3. Stratified sample (per group)

```r title="Equal n per group"
mtcars |>
  slice_sample(n = 3, by = cyl)
```

3 random cars per cylinder group, regardless of group size.

### 4. Bootstrap (with replacement)

```r title="Resample 32 rows with replacement"
set.seed(1)
mtcars |>
  slice_sample(n = nrow(mtcars), replace = TRUE)
```

Standard bootstrap: same row count as original, with duplicates allowed.

### 5. Weighted sample

```r title="Bias toward higher mpg"
set.seed(1)
mtcars |>
  slice_sample(n = 5, weight_by = mpg)
```

Rows with higher `mpg` are more likely to be picked. Useful for importance sampling.

[KEY INSIGHT]
**`slice_sample()` replaces TWO older functions: `sample_n()` (n random rows) and `sample_frac()` (fraction).** Both are deprecated since dplyr 1.0. The new function unifies them and adds `by` for stratified sampling.

## slice_sample() vs sample_n() vs sample()

**Three sampling functions in R, with different scope.**

| Function | Package | Per group | Status |
|---|---|---|---|
| `slice_sample(n)` | dplyr | Yes | Recommended |
| `sample_n(n)` | dplyr | Yes | Deprecated since 1.0 |
| `base::sample(x, size)` | base | No | Vector sampling, not data frames |

When to use which:

- `slice_sample` for data frames in dplyr pipelines.
- `sample` for sampling from vectors or generating random indices.
- Avoid `sample_n` in new code.

## A practical workflow

**The "stratified sample" pattern is the most common slice_sample use case.** Examples:

- Train/test split with balanced classes: `slice_sample(prop = 0.8, by = class)`
- Sample customers per region equally: `slice_sample(n = 100, by = region)`
- Bootstrap CI estimation: loop `slice_sample(n = nrow(df), replace = TRUE)` 1,000 times

For one-off samples, `slice_sample(n = 5)` is the quick interactive tool. For production analysis, set the seed and document the sample size.

## Common pitfalls

**Pitfall 1: forgetting to set seed.** `slice_sample` is non-deterministic. Reports / tests / docs should `set.seed(42)` (or any fixed integer) right before to get reproducible output.

**Pitfall 2: per-group surprise.** On a grouped tibble, `slice_sample(n = 5)` returns 5 rows PER GROUP. Often what you want for stratification, sometimes not. Use `ungroup()` first if you mean a global sample.

[WARNING]
**`slice_sample(n = X)` errors if any group has fewer than X rows AND `replace = FALSE`.** A group with only 2 rows fails for `n = 5`. Either set `replace = TRUE` or filter groups by size first.

## Reproducibility and seeds

**Random samples are only useful if they are reproducible across runs.** Always call `set.seed(N)` immediately before `slice_sample()` when the result will be used in a report, plot, or test. Different code paths that need DIFFERENT samples should use different seeds (e.g., `set.seed(1)` for train, `set.seed(2)` for test) so the splits are reproducible AND independent. R's RNG state is global, so any operation between `set.seed()` and `slice_sample()` that consumes randomness will desync the result. Keep them adjacent.

## Try it yourself

**Try it:** Take a stratified random sample of 2 rows per `cyl` group from `mtcars`. Set seed 42 for reproducibility. Save to `ex_strat`.

```r title="Your turn: stratified sample"
set.seed(42)

ex_strat <- mtcars |>
  # your code here

ex_strat
#> Expected: 6 rows (2 per cyl group)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_strat <- mtcars |>
  slice_sample(n = 2, by = cyl)
ex_strat
#> 6 rows total: 2 per cyl group, randomly chosen
```

**Explanation:** `slice_sample(n = 2, by = cyl)` picks 2 random rows per cyl group. Equal-count stratified sample.

</details>

## Related slice functions

After mastering slice_sample, look at:

- `slice_head()` / `slice_tail()`: positional first/last n
- `slice_max()` / `slice_min()`: top/bottom n by value
- `slice()`: specific row indexes
- `sample_n()` / `sample_frac()`: deprecated; do not use
- `rsample` package: train/test splits with class balance, k-fold CV
- `base::sample()`: vector sampling

For machine-learning splits, the `rsample` package builds on slice_sample with `initial_split()` and `vfold_cv()`.

## FAQ

**What is the difference between slice_sample and sample_n?**

`sample_n()` is deprecated since dplyr 1.0. `slice_sample()` is the replacement: clearer name, supports `prop`, `weight_by`, and `by` arguments, group-aware.

**How do I do a reproducible random sample in R?**

Call `set.seed(42)` (or any fixed integer) immediately before `slice_sample()`. The same seed always returns the same rows.

**How do I sample with replacement (bootstrap) in dplyr?**

Pass `replace = TRUE`: `slice_sample(df, n = nrow(df), replace = TRUE)`. The size matches the original; rows can repeat.

**How do I do a weighted random sample?**

Pass `weight_by = column`: `slice_sample(df, n = 5, weight_by = price)` makes rows with higher `price` more likely to be picked.

**How do I do a stratified sample per group?**

`slice_sample(df, n = 3, by = group_col)` returns 3 random rows per group. For a fraction per group, use `prop = 0.1` instead of `n`.
