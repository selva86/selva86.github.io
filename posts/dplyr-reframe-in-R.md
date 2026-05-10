---
title: "dplyr reframe() in R: Summarise With Variable Output Length"
slug: "dplyr-reframe-in-R"
description: "Use dplyr reframe() to summarise per group when the output has a variable number of rows in R. Covers reframe vs summarise, quantile, 5 examples."
keywords: "dplyr reframe, R reframe vs summarise, dplyr 1.1 reframe, summarise variable rows, reframe quantile, dplyr per-group multi-row"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "reframe()|dplyr reframe|reframe vs summarise|variable output rows|reframe quantile"
auto_link_case_sensitive: true
target_keyword: "dplyr reframe"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# dplyr reframe() in R: Summarise With Variable Output Length

<p class="lead">The <code>reframe()</code> function in dplyr 1.1 generalizes <code>summarise()</code> to allow variable output rows per group. Where summarise enforces "one row per group" (or n equal rows), reframe permits any number of output rows per group.</p>

[QUICK ANSWER]
df |> group_by(g) |> reframe(q = quantile(x, c(.25,.5,.75)))
df |> reframe(top = head(sort(x, decreasing = TRUE), 3))
df |> group_by(g) |> reframe(seq = seq(min(x), max(x)))
df |> group_by(g) |> summarise(mean = mean(x))   # 1 row per group (sum)
df |> group_by(g) |> reframe(out = some_fn(x))    # any rows (multi)

[DECISION TREE: Is reframe() the right tool?]
- one row per group output: summarise()
- multi-row output per group: reframe()
- per-group quantiles (multiple values): reframe()
- per-group sequences / lists: reframe()
- per-group ranking + filter to top n: slice_max() (cleaner)
- list column output: summarise + list() (alternative)

## What reframe() does in one sentence

**`reframe(.data, ...)` works like `summarise()` but does NOT enforce that each expression returns one value per group; output rows expand to match the largest expression.** Per-group output can have arbitrarily many rows.

reframe was introduced in dplyr 1.1 because summarise's "1 row per group" rule was too restrictive for common patterns like "per-group quantiles" or "per-group top-N".

## Syntax

**`reframe(.data, ...)`. Same syntax as summarise; relaxed output-length rule.**

```r title="Per-group quantiles"
library(dplyr)

mtcars |>
  group_by(cyl) |>
  reframe(
    quantile = c(0.25, 0.5, 0.75),
    mpg_q    = quantile(mpg, c(0.25, 0.5, 0.75))
  )
#> # A tibble: 9 x 3
#>     cyl quantile mpg_q
#>     4     0.25   22.8
#>     4     0.50   26.0
#>     4     0.75   30.4
#>     6     0.25   18.7
#>     6     0.50   19.7
#>     6     0.75   21.0
#>     8     0.25   14.4
#>     8     0.50   15.2
#>     8     0.75   16.6
```

3 quantiles per cyl group = 9 rows. summarise would error because each row produces 3 values.

[TIP]
**Reach for `reframe` when each group's output has multiple rows or a variable count.** For "exactly 1 row per group", `summarise` is still the right tool.

## Five common patterns

### 1. Per-group quantiles

```r title="Multiple quantiles per cyl"
mtcars |>
  group_by(cyl) |>
  reframe(
    q = c("q25","q50","q75"),
    val = quantile(mpg, c(0.25, 0.5, 0.75))
  )
```

### 2. Top n per group (alternative)

```r title="Top 3 rows per group"
mtcars |>
  group_by(cyl) |>
  reframe(top_mpg = head(sort(mpg, decreasing = TRUE), 3))
```

For top-n, `slice_max(mpg, n = 3, by = cyl)` is cleaner because it returns the WHOLE row, not just the values.

### 3. Generated sequences per group

```r title="Sequence from min to max per group"
mtcars |>
  group_by(cyl) |>
  reframe(seq_val = seq(min(mpg), max(mpg)))
```

Each cyl group produces a different number of seq values.

### 4. Multi-stat output

```r title="Several stats with named row"
mtcars |>
  group_by(cyl) |>
  reframe(
    stat = c("mean","sd","min","max"),
    val  = c(mean(mpg), sd(mpg), min(mpg), max(mpg))
  )
```

4 rows per cyl group, one per stat.

### 5. summarise vs reframe demonstration

```r title="When summarise errors and reframe doesn't"
# summarise: errors
# mtcars |> group_by(cyl) |> summarise(q = quantile(mpg, c(.25,.5,.75)))
# Error: must return 1 row per group

# reframe: works
mtcars |> group_by(cyl) |> reframe(q = quantile(mpg, c(.25,.5,.75)))
```

[KEY INSIGHT]
**reframe is summarise WITHOUT the "1 row per group" rule.** This is why it was added: many useful per-group computations naturally produce multiple rows (quantiles, ranks, sequences). Pre-1.1, you had to use a list column workaround.

## reframe() vs summarise() vs slice_max()

**Three approaches to "per-group output with multiple rows".**

| Function | Output rows per group | Best for |
|---|---|---|
| `summarise()` | Exactly 1 (or n equal) | Aggregations |
| `reframe()` | Any number | Multi-row aggregations like quantiles |
| `slice_max(col, n)` | Up to n | Top n by column |

When to use which:

- `summarise` for aggregation: mean, sd, n.
- `reframe` for variable-row output like quantiles or sequences.
- `slice_max` / `slice_min` for "top n by column" specifically.

## A practical workflow

**The "per-group quantile table" pattern is reframe's killer use case.**

```r title="Per-category percentile table"
prices |>
  group_by(category) |>
  reframe(
    quantile = c("p10","p25","p50","p75","p90"),
    price    = quantile(price, c(0.10, 0.25, 0.50, 0.75, 0.90))
  )
```

Per-category, returns 5 rows (one per percentile). Useful for distribution comparison across categories.

## Common pitfalls

**Pitfall 1: reframe is dplyr 1.1+.** Older dplyr versions don't have reframe. Workaround: list-column + tidyr::unnest.

**Pitfall 2: forgetting that summarise still has the 1-row rule.** If your code "used to work" with summarise but now errors, you may have changed the function output length. Switch to reframe.

[WARNING]
**`reframe` doesn't enforce output-length consistency across expressions.** If one expression returns 3 values and another returns 5, reframe expands to the max (5) and shorter ones are recycled or error. Be careful.

## Why reframe was added in dplyr 1.1

**Pre-1.1, the only way to produce variable-length per-group output was to wrap results in a list and unnest them.** This was verbose and slow on big data. The dplyr team added reframe specifically for cases like quantiles, ranks, and per-group sequences where each group naturally produces multiple values. The decision reflects an explicit recognition that summarise's "1 row per group" rule, while useful for safety, was too restrictive for several common analytical patterns. The split between summarise (strict) and reframe (flexible) lets each function communicate clear intent: "I expect one row per group" or "I expect possibly many".

## Try it yourself

**Try it:** Compute the 25th, 50th, and 75th percentile of `mpg` per cyl group using reframe. Save to `ex_quartiles`.

```r title="Your turn: per-cyl quartiles"
ex_quartiles <- mtcars |>
  # your code here

ex_quartiles
#> Expected: 9 rows (3 quartiles x 3 cyl groups)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_quartiles <- mtcars |>
  group_by(cyl) |>
  reframe(
    quartile = c(0.25, 0.5, 0.75),
    mpg      = quantile(mpg, c(0.25, 0.5, 0.75))
  )

ex_quartiles
#> # A tibble: 9 x 3
#>     cyl quartile  mpg
#>     4      0.25  22.8
#>     4      0.50  26
#>     4      0.75  30.4
#>     6      0.25  18.65
#>     ...
```

**Explanation:** reframe allows 3 rows per cyl group (one per quartile). summarise would error on this.

</details>

## Related dplyr functions

After mastering reframe, look at:

- `summarise()`: 1 row per group
- `slice_max()` / `slice_min()`: top/bottom n by column
- `tidyr::unnest()`: flatten list columns
- `quantile()`: percentile values
- `cur_data_all()`: alternative for older dplyr
- `pick()`: select columns inside reframe / summarise

For older dplyr (<1.1), the equivalent pattern is `summarise(out = list(quantile(x, ...))) |> tidyr::unnest(out)`.

## FAQ

**What does reframe do in dplyr?**

`reframe(.data, ...)` is like `summarise()` but allows expressions to return any number of rows per group, not just 1.

**What is the difference between reframe and summarise?**

summarise enforces "1 row per group" (or n equal rows across expressions). reframe allows variable-length output. For multi-row per-group computations like quantiles, use reframe.

**When was reframe introduced?**

In dplyr 1.1.0 (Jan 2023). Older versions used `summarise(x = list(...)) |> tidyr::unnest(x)` as a workaround.

**Can I mix summarise and reframe in a pipeline?**

Yes. Use summarise for fixed-output aggregations and reframe for variable-output ones. They have the same syntax otherwise.

**Why does my summarise error with "must return 1 row per group"?**

Because the expression returns multiple values per group (e.g., quantile returns 3 values for 3 probs). Switch to reframe to allow this.
