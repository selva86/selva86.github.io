---
title: "dplyr ntile() in R: Bin Values into N Equal-Count Groups"
slug: "dplyr-ntile-in-R"
description: "Use dplyr ntile() to split values into n approximately equal-count quantile bins in R. Covers vs cut, quartiles, percentiles, NA, and 5 worked examples."
keywords: "dplyr ntile, R quantile bins, ntile vs cut, dplyr quartile, percentile bins, ntile NA, equal-count groups, ntile per group"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "ntile()|dplyr ntile|quantile bins|equal-count groups|quartile binning"
auto_link_case_sensitive: true
target_keyword: "dplyr ntile"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr ntile() in R: Bin Values into N Equal-Count Groups

<p class="lead">The <code>ntile()</code> function in dplyr divides a vector into n approximately equal-count quantile bins, returning an integer 1 to n for each value. It is the rank-based binning function for quartiles, deciles, and any equal-count split.</p>

[QUICK ANSWER]
ntile(1:10, 4)                      # 4 quartiles
ntile(x, 10)                         # 10 deciles
ntile(desc(x), 4)                    # reverse direction
df |> mutate(quartile = ntile(score, 4))
df |> group_by(g) |> mutate(quartile = ntile(score, 4))
cut(x, breaks = quantile(x, probs = seq(0, 1, 0.25)))  # value-based bins (different)

[DECISION TREE: Is ntile() the right tool?]
- equal-COUNT bins (each bin has same n): ntile(x, n)
- equal-WIDTH bins (each bin spans same range): cut(x, breaks)
- specific percentile cutpoints: cut(x, breaks = quantile(x, probs))
- relative position 0..1: percent_rank() / cume_dist()
- per-group quantiles: group_by + ntile
- 4 bins (quartiles): ntile(x, 4)
- 10 bins (deciles): ntile(x, 10)

## What ntile() does in one sentence

**`ntile(x, n)` returns an integer between 1 and n indicating which quantile bin each value falls into; bins are sized to be approximately equal in COUNT.** With 100 rows and `n = 4`, you get 25 rows per bin.

The standard tool for "split this column into quartiles / deciles / quintiles".

## Syntax

**`ntile(x, n)`. Returns integers 1..n. Ties are broken arbitrarily by ntile.**

```r title="Quartile bins for a sequence"
library(dplyr)

ntile(1:12, 4)
#> [1] 1 1 1 2 2 2 3 3 3 4 4 4
```

Three values per bin (12 / 4 = 3).

[TIP]
**`ntile(x, n)` always returns integers 1 to n.** This makes it perfect for grouping or color-coding by quantile. Combine with `factor()` to get ordered factor labels.

## Five common patterns

### 1. Quartiles (n = 4)

```r title="Standard quartile assignment"
ntile(c(10, 20, 30, 40, 50, 60, 70, 80), 4)
#> [1] 1 1 2 2 3 3 4 4
```

Each quartile holds 2 values (8 / 4 = 2).

### 2. Deciles (n = 10)

```r title="10% bins"
ntile(1:100, 10)
#> [1]  1  1  1  1  1  1  1  1  1  1  2  2 ...
```

Useful for "top 10%", "next 10%", etc.

### 3. Inside mutate as a derived column

```r title="Add quartile to data frame"
mtcars |>
  mutate(mpg_quartile = ntile(mpg, 4)) |>
  count(mpg_quartile)
#>   mpg_quartile  n
#> 1            1  8
#> 2            2  8
#> 3            3  8
#> 4            4  8
```

32 rows / 4 = 8 rows per quartile.

### 4. Reverse direction (highest = bin 1)

```r title="Top performers in bin 1"
ntile(desc(c(50, 80, 90, 100)), 4)
#> [1] 4 3 2 1
```

`desc()` makes the highest value get bin 1.

### 5. Per-group ntile

```r title="Quartiles within each category"
df_g <- data.frame(
  team  = rep(c("A","B"), each = 4),
  pts   = c(10, 20, 30, 40, 50, 60, 70, 80)
)

df_g |>
  group_by(team) |>
  mutate(quartile = ntile(pts, 4))
#> # A tibble: 8 x 3
#>   team   pts quartile
#>   A       10        1
#>   A       20        2
#>   A       30        3
#>   A       40        4
#>   B       50        1
#>   B       60        2
#>   B       70        3
#>   B       80        4
```

[KEY INSIGHT]
**`ntile(x, n)` produces equal-COUNT bins; `cut(x, breaks)` produces equal-WIDTH bins.** They are different. Equal-count is what you want for "top decile" thinking; equal-width is what you want for histogram-like binning. Pick based on whether bin SIZE matters (equal-count) or bin RANGE matters (equal-width).

## ntile() vs cut() vs quantile() vs percent_rank()

**Four binning / quantile functions in R.**

| Function | Output | Bin type | Best for |
|---|---|---|---|
| `ntile(x, n)` | Integer 1..n | Equal count | Quartile / decile assignment |
| `cut(x, breaks)` | Factor | Equal width or custom | Histogram-style binning |
| `cut(x, quantile(x, probs))` | Factor | Quantile-based | Same as ntile but factor output |
| `quantile(x, probs)` | Numeric values | (returns thresholds) | Compute percentile boundaries |
| `percent_rank(x)` | 0 to 1 | (continuous) | Relative position, not bins |

When to use which:

- `ntile` for clean integer bin assignment.
- `cut` if you need factor labels or specific cutpoints.
- `quantile` to find the actual percentile values (e.g., median = quantile(x, 0.5)).
- `percent_rank` for continuous relative position.

## A practical workflow

**The "quartile-bucketed analysis" pattern is ntile's main use case.**

```r title="Quartile-bucketed analysis"
df |>
  mutate(price_q = ntile(price, 4)) |>
  group_by(price_q) |>
  summarise(
    n           = n(),
    avg_revenue = mean(revenue),
    .groups     = "drop"
  )
```

Bucket products by price quartile, then aggregate revenue per quartile. Useful for quick "are higher-priced items more profitable" analyses.

For deciles with named labels:

```r title="Decile labels"
df |>
  mutate(
    decile      = ntile(score, 10),
    decile_lbl  = paste0("D", decile)
  )
```

## Common pitfalls

**Pitfall 1: ties broken arbitrarily.** ntile uses row order to break ties. Two rows with the same value may end up in different bins. For deterministic ties, sort the data first.

**Pitfall 2: NA propagation.** NAs in x become NA in the output. Filter NAs before ntile if integer output is required.

[WARNING]
**`ntile(x, n)` does NOT compute true percentiles.** Bins are equal-count, not bounded by exact percentile cutpoints. If you need quartile boundaries (Q1 = 25th percentile, etc.), use `quantile(x, probs)` instead.

## Try it yourself

**Try it:** Bin `mtcars$mpg` into 5 quintiles (1 = lowest, 5 = highest). Save to `ex_quintile`.

```r title="Your turn: quintile assignment"
ex_quintile <- mtcars |>
  # your code here

count(ex_quintile, mpg_quintile)
#> Expected: 5 quintiles, ~6-7 rows each
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_quintile <- mtcars |>
  mutate(mpg_quintile = ntile(mpg, 5))

count(ex_quintile, mpg_quintile)
#>   mpg_quintile n
#> 1            1 7
#> 2            2 6
#> 3            3 7
#> 4            4 6
#> 5            5 6
```

**Explanation:** `ntile(mpg, 5)` splits the 32 cars into 5 quintiles. 32/5 is not even; some bins get an extra row.

</details>

## Related dplyr functions

After mastering ntile, look at:

- `cume_dist()` / `percent_rank()`: continuous relative position
- `min_rank()` / `dense_rank()`: integer rank
- `cut()`: base R; bins by value cutpoints
- `quantile()`: compute percentile boundaries
- `forcats::cut_number()` / `cut_interval()`: ggplot-style binning
- `dplyr::case_when()`: custom bin definitions

For ggplot binning, `forcats::cut_number()` is similar to ntile but returns a factor.

## FAQ

**What does ntile do in dplyr?**

`ntile(x, n)` divides x into n approximately equal-count bins and returns an integer 1..n for each value indicating its bin. With 100 rows and n = 4, each bin has 25 rows.

**What is the difference between ntile and cut in R?**

`ntile(x, n)` produces equal-COUNT bins. `cut(x, n)` produces equal-WIDTH bins. ntile is for quantile assignment; cut is for value-range binning.

**How do I get quartiles with ntile?**

`ntile(x, 4)` returns 1, 2, 3, or 4 per value. The smallest 25% are in bin 1; the largest 25% are in bin 4.

**Does ntile handle ties?**

Yes, but ties are broken arbitrarily by row order. Two rows with the same value may end up in different bins. Sort first for determinism.

**How do I reverse ntile direction?**

Wrap in `desc()`: `ntile(desc(x), n)`. The highest values get bin 1.
