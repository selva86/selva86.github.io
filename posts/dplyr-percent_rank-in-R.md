---
title: "dplyr percent_rank() in R: Relative Position 0 to 1"
slug: "dplyr-percent_rank-in-R"
description: "Use dplyr percent_rank() to compute the relative percentile position 0 to 1 of values in R. Covers vs cume_dist, ties, NA, formula, and 5 worked examples."
keywords: "dplyr percent_rank, R percent rank, percent_rank vs cume_dist, dplyr percentile, ranking 0 to 1, relative position rank, percentile R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "percent_rank()|dplyr percent_rank|relative position rank|percent rank vs cume_dist|percentile rank"
auto_link_case_sensitive: true
target_keyword: "dplyr percent_rank"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr percent_rank() in R: Relative Position 0 to 1

<p class="lead">The <code>percent_rank()</code> function in dplyr returns the relative position of each value in the range 0 to 1, scaled by rank. The smallest value gets 0; the largest gets 1.</p>

[QUICK ANSWER]
percent_rank(c(10, 20, 30, 40))    # 0, 0.333, 0.667, 1
percent_rank(desc(x))               # reverse direction
df |> mutate(pr = percent_rank(score))
df |> group_by(g) |> mutate(pr = percent_rank(score))
cume_dist(c(10, 20, 30, 40))        # 0.25, 0.5, 0.75, 1 (cumulative dist)
ntile(x, 4)                          # bin into 4 quartiles

[DECISION TREE: Is percent_rank() the right tool?]
- relative rank 0..1 (smallest = 0, largest = 1): percent_rank()
- cumulative distribution (proportion ≤ x): cume_dist()
- bin into n equal-count groups: ntile(x, n)
- raw rank with ties: min_rank() or dense_rank()
- per-group percent_rank: group_by + percent_rank
- explicit quantile value: quantile(x, probs)

## What percent_rank() does in one sentence

**`percent_rank(x)` returns `(min_rank(x) - 1) / (n - 1)` for each element, where n is the count.** The smallest value gets 0; the largest gets 1; intermediate values are linearly spaced by RANK position.

This answers: "what fraction of values are below this one?". Useful for percentile-style normalization.

## Syntax

**`percent_rank(x)`. NAs stay NA. Output is in [0, 1].**

```r title="Linear spacing by rank"
library(dplyr)

x <- c(10, 20, 30, 40)
percent_rank(x)
#> [1] 0.0000000 0.3333333 0.6666667 1.0000000
```

[TIP]
**`percent_rank` and `cume_dist` differ subtly: `percent_rank` excludes the current rank, `cume_dist` includes it.** For c(10, 20, 30, 40), percent_rank gives 0, 1/3, 2/3, 1; cume_dist gives 1/4, 2/4, 3/4, 1.

## Five common patterns

### 1. Linear position by rank

```r title="Smallest = 0, largest = 1"
percent_rank(c(50, 80, 90, 100))
#> [1] 0.0000000 0.3333333 0.6666667 1.0000000
```

### 2. Descending direction

```r title="Largest gets percent_rank 0"
percent_rank(desc(c(50, 80, 90, 100)))
#> [1] 1.0000000 0.6666667 0.3333333 0.0000000
```

### 3. Per-group percent_rank

```r title="Reset per group"
df_g <- data.frame(
  team = c("A","A","A","B","B","B"),
  pts  = c(10, 20, 30, 40, 50, 60)
)

df_g |>
  group_by(team) |>
  mutate(pr = percent_rank(pts))
#> # A tibble: 6 x 3
#>   team   pts    pr
#>   A       10   0
#>   A       20   0.5
#>   A       30   1
#>   B       40   0
#>   B       50   0.5
#>   B       60   1
```

Each team gets its own 0-to-1 scale.

### 4. Use as a normalized feature

```r title="Min-max normalization via rank"
df <- data.frame(score = c(50, 80, 90, 100))

df |>
  mutate(score_normalized = percent_rank(score))
#>   score score_normalized
#> 1    50        0.0000000
#> 2    80        0.3333333
#> 3    90        0.6666667
#> 4   100        1.0000000
```

Useful when you want rank-based normalization (immune to outliers, unlike (x - min) / (x - max)).

### 5. Compare to cume_dist

```r title="Both produce values in [0, 1] but different formulas"
percent_rank(c(10, 20, 30, 40))
#> [1] 0.0000000 0.3333333 0.6666667 1.0000000

cume_dist(c(10, 20, 30, 40))
#> [1] 0.25 0.50 0.75 1.00
```

`percent_rank = (rank - 1) / (n - 1)`. `cume_dist = rank / n`. Pick based on the convention your downstream code expects.

[KEY INSIGHT]
**`percent_rank(x) = (min_rank(x) - 1) / (n - 1)`.** It is a rescaling of min_rank to [0, 1]. Tied values get the same percent_rank. The max percent_rank is always 1; the min is always 0 (unless n = 1).

## percent_rank() vs cume_dist() vs ntile() vs min_rank()

**Four "relative position" functions in dplyr.**

| Function | Output range | Formula | Best for |
|---|---|---|---|
| `percent_rank(x)` | 0 to 1 | (min_rank - 1) / (n - 1) | "Above what fraction of values" |
| `cume_dist(x)` | 0 to 1 | rank / n | Empirical CDF |
| `ntile(x, n)` | 1 to n | bin index | Quartiles, deciles, percentiles |
| `min_rank(x)` | 1 to n | competition rank | Sports / standings |

When to use which:

- `percent_rank` for [0, 1] normalization with min = 0, max = 1.
- `cume_dist` for empirical CDF (cumulative distribution).
- `ntile` for binning into quantiles.
- `min_rank` for raw rank.

## A practical workflow

**Use percent_rank as a robust normalizer for ML features when the distribution is heavy-tailed or has outliers.**

```r title="Rank-based feature normalization"
features |>
  mutate(across(where(is.numeric), ~ percent_rank(.x)))
```

Every numeric column becomes a [0, 1] rank-based version. Robust to outliers (unlike `(x - min) / (max - min)` which is dragged by extreme values).

For per-group normalization:

```r title="Per-category normalization"
features |>
  group_by(category) |>
  mutate(across(where(is.numeric), ~ percent_rank(.x))) |>
  ungroup()
```

Each category's features rescale independently.

## Common pitfalls

**Pitfall 1: ties produce identical percent_rank.** Three rows tied for the median all get the same percent_rank. If unique percentiles matter, break ties first.

**Pitfall 2: edge case at n = 1.** `percent_rank(c(10))` returns NaN (division by 0). Filter or skip 1-row groups.

[WARNING]
**`percent_rank` and `cume_dist` are NOT interchangeable.** `percent_rank(c(1, 2, 3, 4))` is `c(0, 0.33, 0.67, 1)`; `cume_dist` is `c(0.25, 0.5, 0.75, 1)`. Always check which formula your downstream code expects.

## When percent_rank is the right scaling

**For machine-learning features, rank-based scaling has a key advantage over min-max scaling: it is robust to outliers.** A single outlier with `value = 1e6` and the rest in `[0, 100]` would crush min-max-scaled features into a tiny range near 0 for almost every row. percent_rank ignores absolute magnitudes and uses only ordinal information, so the outlier still maps to 1 but the rest distribute cleanly across [0, 1]. The trade-off: you lose information about the magnitude of differences. Two values that are very close in absolute terms but happen to be adjacent ranks will get adjacent percent_rank values; two values that are far apart but adjacent in rank get the same gap.

## Try it yourself

**Try it:** Compute the percent_rank of `mtcars$mpg` and find which cars are in the top 10% (percent_rank > 0.9). Save to `ex_top_pct`.

```r title="Your turn: top 10% by percent_rank"
ex_top_pct <- mtcars |>
  # your code here

ex_top_pct
#> Expected: rows in the top 10th percentile of mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_top_pct <- mtcars |>
  mutate(pr = percent_rank(mpg)) |>
  filter(pr > 0.9)

ex_top_pct[, c("mpg", "pr")]
#>                 mpg     pr
#> Toyota Corolla 33.9 1.0000000
#> Fiat 128       32.4 0.9354839
#> Honda Civic    30.4 0.8709677
#> ... (top mpg cars)
```

**Explanation:** `percent_rank(mpg)` rescales mpg to [0, 1]. Filter for > 0.9 keeps the top 10%.

</details>

## Related dplyr functions

After mastering percent_rank, look at:

- `cume_dist()`: cumulative distribution function
- `ntile()`: bin into n equal groups
- `min_rank()` / `dense_rank()`: integer ranks
- `quantile()`: explicit percentile values
- `scale()`: z-score normalization (mean 0, sd 1)
- `rank()`: base R; defaults to average ties

For ML feature engineering with robust scaling, percent_rank is often more useful than mean-sd scaling because it is outlier-robust.

## FAQ

**What does percent_rank do in dplyr?**

`percent_rank(x)` returns each value's relative position in [0, 1] computed as `(min_rank(x) - 1) / (n - 1)`. The smallest value gets 0; the largest gets 1.

**What is the difference between percent_rank and cume_dist?**

Different formulas. `percent_rank = (rank - 1) / (n - 1)`. `cume_dist = rank / n`. Both are in [0, 1] but they assign different values per rank.

**How do I rank descending with percent_rank?**

Wrap in `desc()`: `percent_rank(desc(x))`. The largest value gets 0; the smallest gets 1.

**How does percent_rank handle ties?**

Tied values get the same percent_rank (because min_rank gives ties the same rank, and percent_rank is a rescaling of min_rank).

**Can percent_rank be used for normalization?**

Yes. `percent_rank(x)` rescales any numeric vector to [0, 1] based on rank, robust to outliers. A common alternative to `(x - min) / (max - min)` for heavy-tailed data.
