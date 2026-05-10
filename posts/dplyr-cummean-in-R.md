---
title: "dplyr cummean() in R: Running Mean Across a Vector"
slug: "dplyr-cummean-in-R"
description: "Use dplyr cummean() to compute the running (cumulative) mean of a vector in R. Covers cummean vs cumsum/seq_along, per-group, NA handling, 5 examples."
keywords: "dplyr cummean, R running mean, cummean vs cumsum, dplyr cumulative average, R running average, group running mean, cummean lag"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "cummean()|dplyr cummean|running mean|cumulative mean|running average"
auto_link_case_sensitive: true
target_keyword: "dplyr cummean"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr cummean() in R: Running Mean Across a Vector

<p class="lead">The <code>cummean()</code> function in dplyr returns the cumulative (running) mean of a numeric vector. It is the "mean so far" companion of <code>cumsum()</code>.</p>

[QUICK ANSWER]
cummean(1:5)                          # 1, 1.5, 2, 2.5, 3
cumsum(x) / seq_along(x)              # base R equivalent
df |> arrange(date) |> mutate(running_avg = cummean(value))
df |> group_by(g) |> mutate(running_avg = cummean(value))
cummean(c(10, 20, NA, 30))            # NA propagates: 10, 15, NA, NA
zoo::rollmean(x, k = 3)               # fixed-width rolling mean (different)

[DECISION TREE: Is cummean() the right tool?]
- running mean from start to current: cummean()
- fixed-width rolling mean (last 7 days): zoo::rollmean or slider::slide_mean
- running sum: cumsum()
- running max / min: cummax() / cummin()
- per-group running mean: group_by + cummean
- final overall mean: mean()

## What cummean() does in one sentence

**`cummean(x)` returns a numeric vector where position `i` is the mean of `x[1:i]`.** It accumulates the average from the start through every position.

Useful for "performance to date", "session average", and other "growing window" metrics.

## Syntax

**`cummean(x)`. x is a numeric vector. Returns a numeric vector of the same length.**

```r title="Cumulative mean of 1 to 5"
library(dplyr)

cummean(1:5)
#> [1] 1.0 1.5 2.0 2.5 3.0
```

[TIP]
**`cummean(x)` is `cumsum(x) / seq_along(x)`: same result, more readable.** Use cummean for the intent; the cumsum version is the manual fallback.

## Five common patterns

### 1. Running average

```r title="Build up the mean step by step"
cummean(c(10, 20, 30, 40))
#> [1] 10 15 20 25
```

Position 1 is just `10`. Position 2 is `mean(10, 20) = 15`. Position 3 is `mean(10, 20, 30) = 20`. And so on.

### 2. Per-game running average (sports analytics)

```r title="Running batting average"
games <- data.frame(
  game     = 1:5,
  hits     = c(2, 0, 3, 1, 2),
  at_bats  = c(4, 4, 4, 3, 5)
)

games |>
  mutate(avg_so_far = cumsum(hits) / cumsum(at_bats))
#>   game hits at_bats avg_so_far
#> 1    1    2       4    0.5000
#> 2    2    0       4    0.2500
#> 3    3    3       4    0.4167
#> 4    4    1       3    0.4667
#> 5    5    2       5    0.4500
```

For pre-divided values, `cummean(hits / at_bats)` would be wrong (mean of ratios, not ratio of cumulative sums).

### 3. Running mean inside a pipeline

```r title="Daily reading + running average"
sales <- data.frame(
  day = 1:7,
  rev = c(100, 150, 130, 200, 180, 220, 190)
)

sales |>
  arrange(day) |>
  mutate(running_avg = cummean(rev))
#>   day rev running_avg
#> 1   1 100    100.0000
#> 2   2 150    125.0000
#> ...
```

### 4. Per-group running average

```r title="Reset the running average per group"
df <- data.frame(
  team   = c("A","A","A","B","B"),
  score  = c(10, 20, 30, 100, 200)
)

df |>
  group_by(team) |>
  mutate(running_avg = cummean(score))
#> # A tibble: 5 x 3
#>   team  score running_avg
#>   A        10        10
#>   A        20        15
#>   A        30        20
#>   B       100       100
#>   B       200       150
```

Group_by makes cummean restart for each team.

### 5. Lagged running mean (avoid current row)

```r title="Mean of EVERYTHING BEFORE current row"
x <- c(10, 20, 30, 40, 50)
prev_avg <- lag(cummean(x), default = NA)
prev_avg
#> [1]  NA 10.00 15.00 20.00 25.00
```

`lag()` shifts the cummean down by one, so each row sees the average of all PRECEDING rows (excluding self). Useful for forward-looking analysis without leakage.

[KEY INSIGHT]
**`cummean(x)` and `cumsum(x) / seq_along(x)` always produce the same result.** The cumsum version is what cummean does internally. Use cummean for clarity; reach for cumsum/seq_along if you need to handle NAs explicitly or weight values.

## cummean() vs cumsum() vs zoo::rollmean()

**Three "running average" computations in R, with different windows.**

| Function | Window | Best for |
|---|---|---|
| `cummean(x)` | Growing (1..i) | All-time average to date |
| `cumsum(x) / seq_along(x)` | Growing (manual) | Same as cummean; explicit form |
| `zoo::rollmean(x, k)` | Fixed width k | "Last 7 days average" |
| `slider::slide_dbl(x, mean, .before = k)` | Configurable | Modern rolling-window |

When to use which:

- `cummean` for growing-window means.
- `zoo::rollmean` or `slider` for fixed-width rolling means (last N observations).

## A practical workflow

**The "growing-window average" pattern is the canonical cummean use case.**

```r title="Per-user lifetime average"
df |>
  arrange(date) |>
  group_by(user) |>
  mutate(lifetime_avg = cummean(value)) |>
  ungroup()
```

For each user in chronological order, the lifetime average through each row. Common in cohort and customer-LTV analysis.

For "average of last N", use `slider::slide_mean(x, .before = N - 1)`. The two solve different problems: cummean grows; slide_mean is a fixed window.

## Common pitfalls

**Pitfall 1: NA propagation.** `cummean(c(10, 20, NA, 30))` returns `c(10, 15, NA, NA)`. Once NA appears, every later position is NA. Filter NAs first or use `cumsum(x[!is.na(x)]) / seq_along(...)`.

**Pitfall 2: order dependence.** cummean reads the vector left-to-right. Always `arrange()` first if the order is meaningful.

[WARNING]
**`cummean(x)` is NOT a rolling-window mean.** It is "mean of EVERYTHING from start to here". For "mean of last 7 days", use `zoo::rollmean()` or `slider::slide_mean()`. The two are very different and easy to confuse.

## Cumulative vs rolling: a common confusion

**Cumulative means a growing window: position i averages everything from start through i.** Rolling means a fixed-width window: position i averages the previous k values (or the centered window). The two solve different problems and produce very different results. cummean(1:100) climbs slowly toward 50; rollmean(1:100, k=7) increases by 1 each step. For "season-to-date stats", cummean is right. For "last 7 days moving average", you need slider or zoo. The dplyr cumulative family (cummean, cumsum, cumprod, cummax, cummin) handles only the growing-window case; reach for `slider::slide_*` or `zoo::roll*` whenever the window has a fixed width.

## Try it yourself

**Try it:** Compute a running monthly average of revenue, sorted by month. Save to `ex_running`.

```r title="Your turn: monthly running average"
revenue <- data.frame(
  month = 1:6,
  rev   = c(100, 120, 80, 150, 130, 200)
)

ex_running <- revenue |>
  # your code here

ex_running
#> Expected: rev column + running_avg column with cumulative averages
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_running <- revenue |>
  arrange(month) |>
  mutate(running_avg = cummean(rev))
ex_running
#>   month rev running_avg
#> 1     1 100    100.0000
#> 2     2 120    110.0000
#> 3     3  80    100.0000
#> 4     4 150    112.5000
#> 5     5 130    116.0000
#> 6     6 200    130.0000
```

**Explanation:** Sort by month, then cummean computes the running average. Each row shows the average through that month.

</details>

## Related dplyr functions

After mastering cummean, look at:

- `cumsum()`, `cumprod()`, `cummax()`, `cummin()`: other cumulatives
- `cumall()` / `cumany()`: cumulative logicals
- `lag()` / `lead()`: shift to compare across rows
- `slider::slide_mean()`: rolling-window mean (fixed width)
- `zoo::rollmean()`: classic rolling mean
- `RcppRoll::roll_mean()`: fast rolling mean for big data

For fixed-width rolling means, the `slider` and `RcppRoll` packages are the modern tools.

## FAQ

**What is the difference between cummean and cumsum in R?**

`cumsum(x)` returns the running SUM. `cummean(x)` returns the running MEAN, which is `cumsum(x) / seq_along(x)`. cummean is the per-position average up to that point.

**What is the difference between cummean and rollmean?**

`cummean` is a growing window: each position averages all values from start to here. `rollmean` (zoo) is a fixed window: each position averages the previous k values. Different semantics, different use cases.

**How do I do a per-group running mean?**

`df |> group_by(g) |> mutate(running = cummean(value))`. group_by makes cummean restart for each group.

**Does cummean handle NA?**

NAs propagate: once NA appears, every later position is NA. Filter NAs before cummean, or use `cumsum(x[!is.na(x)]) / cumsum(!is.na(x))` for an NA-skipping version.

**Is cummean a rolling-window mean?**

No. cummean is a growing window (1..i). For fixed-width rolling means (last 7 days, last 30 minutes), use `slider::slide_mean()` or `zoo::rollmean()`.
