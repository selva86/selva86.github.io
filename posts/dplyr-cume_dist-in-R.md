---
title: "dplyr cume_dist() in R: Empirical Cumulative Distribution"
slug: "dplyr-cume_dist-in-R"
description: "Use dplyr cume_dist() to compute the empirical cumulative distribution proportion in R. Covers vs percent_rank, formula, ties, NA, and 5 worked examples."
keywords: "dplyr cume_dist, R cumulative distribution, cume_dist vs percent_rank, dplyr ECDF, empirical CDF R, cume_dist formula, cume_dist ties"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cume_dist()|dplyr cume_dist|cumulative distribution|empirical CDF|cume_dist vs percent_rank"
auto_link_case_sensitive: true
target_keyword: "dplyr cume_dist"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr cume_dist() in R: Empirical Cumulative Distribution

<p class="lead">The <code>cume_dist()</code> function in dplyr returns the empirical cumulative distribution: the proportion of values less than or equal to each value, in the range (0, 1].</p>

[QUICK ANSWER]
cume_dist(c(10, 20, 30, 40))      # 0.25, 0.5, 0.75, 1
cume_dist(desc(x))                  # reverse direction
df |> mutate(cd = cume_dist(score))
df |> group_by(g) |> mutate(cd = cume_dist(score))
percent_rank(c(10, 20, 30, 40))   # 0, 0.33, 0.67, 1 (different)
ecdf(x)(x)                           # base R equivalent

[DECISION TREE: Is cume_dist() the right tool?]
- "what fraction of values are <= this": cume_dist()
- "what fraction of values are STRICTLY below this": percent_rank()
- bin into n equal-count quantiles: ntile(x, n)
- raw rank: min_rank() / dense_rank()
- per-group cume_dist: group_by + cume_dist
- explicit percentile: quantile(x, prob)

## What cume_dist() does in one sentence

**`cume_dist(x)` returns `count(values <= x_i) / n` for each element.** This is the empirical cumulative distribution function (ECDF) at each observation. Values range over (0, 1]; the maximum value always gets 1.

It is the dplyr / pipeline-friendly version of `ecdf(x)(x)`.

## Syntax

**`cume_dist(x)`. NAs stay NA. Output is in (0, 1].**

```r title="Cumulative distribution of 4 values"
library(dplyr)

x <- c(10, 20, 30, 40)
cume_dist(x)
#> [1] 0.25 0.50 0.75 1.00
```

[TIP]
**`cume_dist(x)` answers "what fraction of all values are AT MOST this one?".** Useful for percentile reasoning ("this customer is in the top 5%") and ECDF plots.

## Five common patterns

### 1. Cumulative distribution

```r title="Each value's cumulative proportion"
cume_dist(c(50, 80, 90, 100))
#> [1] 0.25 0.50 0.75 1.00
```

The smallest gets 1/n; the largest always gets 1.

### 2. Identify top-percentile observations

```r title="Top 10% (cume_dist >= 0.9)"
df <- data.frame(score = c(50, 60, 70, 80, 90, 95, 99, 100, 85, 75))

df |>
  mutate(cd = cume_dist(score)) |>
  filter(cd >= 0.9)
#>   score   cd
#> 1    99 0.9
#> 2   100 1.0
```

### 3. Per-group cumulative distribution

```r title="Each group's own ECDF"
df_g <- data.frame(
  team = c("A","A","A","B","B","B"),
  pts  = c(10, 20, 30, 40, 50, 60)
)

df_g |>
  group_by(team) |>
  mutate(cd = cume_dist(pts))
#> # A tibble: 6 x 3
#>   team   pts    cd
#>   A       10  0.333
#>   A       20  0.667
#>   A       30  1
#>   B       40  0.333
#>   B       50  0.667
#>   B       60  1
```

### 4. Compare to percent_rank

```r title="Two formulas, two results"
percent_rank(c(10, 20, 30, 40))
#> [1] 0.0000000 0.3333333 0.6666667 1.0000000

cume_dist(c(10, 20, 30, 40))
#> [1] 0.25 0.50 0.75 1.00
```

`percent_rank = (rank - 1) / (n - 1)`. `cume_dist = rank / n`. Both in [0, 1] but with different lower bounds.

### 5. Build a quantile-binned column

```r title="Quartile assignment via cume_dist"
df <- data.frame(value = c(10, 50, 30, 90, 20, 70, 40, 60, 80, 100))

df |>
  mutate(
    cd       = cume_dist(value),
    quartile = case_when(
      cd <= 0.25 ~ "Q1",
      cd <= 0.50 ~ "Q2",
      cd <= 0.75 ~ "Q3",
      TRUE       ~ "Q4"
    )
  )
```

For direct binning, `ntile(value, 4)` is more concise.

[KEY INSIGHT]
**`cume_dist(x)` is the empirical CDF evaluated at each observation.** It answers "of all values, what proportion are at most this one?". The smallest value gets 1/n; the largest gets exactly 1. This makes it the natural choice for percentile reasoning.

## cume_dist() vs percent_rank() vs ntile() vs ecdf()

**Four functions for relative-position computation in R.**

| Function | Output range | Formula | Best for |
|---|---|---|---|
| `cume_dist(x)` | (0, 1] | rank / n | ECDF; "at most this fraction" |
| `percent_rank(x)` | [0, 1] | (rank - 1) / (n - 1) | "Strictly below this fraction" |
| `ntile(x, n)` | 1 to n | bin index | Quantile binning |
| `ecdf(x)(x)` | (0, 1] | Same as cume_dist | Base R equivalent |

When to use which:

- `cume_dist` inside dplyr pipelines.
- `ecdf(x)(x)` in base R; identical result.
- `percent_rank` if your convention puts min at 0.
- `ntile` for direct quantile bins.

## A practical workflow

**The "percentile flag" pattern is the cume_dist sweet spot.**

```r title="Top/bottom percentile flags"
df |>
  mutate(
    cd        = cume_dist(score),
    is_top_5  = cd >= 0.95,
    is_bottom_5 = cd <= 0.05
  )
```

Adds boolean flags for top and bottom percentiles. Useful for outlier detection and stratified analysis.

For per-segment percentiles:

```r title="Per-segment cumulative distribution"
df |>
  group_by(segment) |>
  mutate(cd = cume_dist(score)) |>
  ungroup()
```

Each segment's cumulative distribution scales independently.

## Common pitfalls

**Pitfall 1: confusing with percent_rank.** Both return values in [0, 1] but with different formulas. `cume_dist` is `rank / n` (min = 1/n, max = 1). `percent_rank` is `(rank - 1) / (n - 1)` (min = 0, max = 1). Pick based on convention.

**Pitfall 2: tied values share cume_dist.** Three tied values all get the same value (the max rank among them, divided by n).

[WARNING]
**`cume_dist` is NOT a kernel-density estimate.** It is the EMPIRICAL distribution at observed points only. For smooth density estimation, use `density(x)` (base R) or geom_density (ggplot2).

## Try it yourself

**Try it:** Mark cars in `mtcars` as "high mpg" if their cume_dist for mpg is >= 0.75. Save to `ex_high_mpg`.

```r title="Your turn: top quartile by mpg"
ex_high_mpg <- mtcars |>
  # your code here

sum(ex_high_mpg$is_high)
#> Expected: about 8 (top 25% of 32 cars)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_high_mpg <- mtcars |>
  mutate(
    cd      = cume_dist(mpg),
    is_high = cd >= 0.75
  )

sum(ex_high_mpg$is_high)
#> [1] 8
```

**Explanation:** `cume_dist(mpg)` returns each row's percentile. `>= 0.75` keeps the top quartile. 25% of 32 = 8 cars.

</details>

## Related dplyr functions

After mastering cume_dist, look at:

- `percent_rank()`: alternative formula (different convention)
- `ntile()`: bin into n equal-count groups
- `min_rank()` / `dense_rank()`: integer rank
- `quantile()`: explicit percentile values
- `ecdf()`: base R empirical CDF
- `ggplot2::stat_ecdf()`: visualize ECDF

For percentile-based analysis, cume_dist + filter is the cleanest dplyr idiom.

## FAQ

**What does cume_dist do in dplyr?**

`cume_dist(x)` returns the empirical cumulative distribution at each value: the proportion of all values that are less than or equal to that value. Output is in (0, 1].

**What is the difference between cume_dist and percent_rank?**

Different formulas. `cume_dist = rank / n`. `percent_rank = (rank - 1) / (n - 1)`. Both range over [0, 1] (or (0, 1]) but assign different values per rank position.

**How do I find the top 5% by cume_dist?**

`filter(cume_dist(x) >= 0.95)` keeps rows in the top 5% percentile.

**Does cume_dist match the ECDF function?**

Yes. `cume_dist(x)` returns the same values as `ecdf(x)(x)` in base R. dplyr's version integrates with summarise and group_by.

**How do I get cume_dist within groups?**

`df |> group_by(g) |> mutate(cd = cume_dist(value))`. Each group has its own cumulative distribution.
