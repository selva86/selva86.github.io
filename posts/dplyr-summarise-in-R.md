---
title: "dplyr summarise() in R: Aggregate Data with Stats"
slug: "dplyr-summarise-in-R"
description: "Use dplyr summarise() to aggregate rows in R with mean, sum, n(), and custom stats. Covers grouped summaries, across(), .by groups, and 7 runnable examples."
keywords: "dplyr summarise, dplyr summarize, aggregate data R, dplyr group_by summarise, summarise across, summarise multiple columns"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "summarise()|dplyr summarise|dplyr::summarise()|summarize()|aggregate rows"
auto_link_case_sensitive: true
target_keyword: "dplyr summarise"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr summarise() in R: Aggregate Data with Stats

<p class="lead">The <code>summarise()</code> function in dplyr collapses many rows into one summary row using aggregation functions like <code>mean()</code>, <code>sum()</code>, or <code>n()</code>. Combined with <code>group_by()</code> or the <code>.by</code> argument, it produces one summary per group.</p>

[QUICK ANSWER]
summarise(df, avg = mean(mpg))                       # one summary
summarise(df, n = n(), avg = mean(mpg))              # multiple stats
summarise(df, avg = mean(mpg), .by = cyl)            # one row per group
group_by(df, cyl) |> summarise(avg = mean(mpg))      # same via group_by
summarise(df, across(where(is.numeric), mean))       # all numeric cols
summarise(df, p25 = quantile(mpg, 0.25), p75 = quantile(mpg, 0.75))  # custom
summarise(df, .by = cyl, n = n(), mn = min(mpg), mx = max(mpg))      # multi

[DECISION TREE: Is summarise() the right tool?]
- collapse rows to one per group: summarise(df, m = mean(x), .by = g)
- keep all rows but add summary col: mutate(df, m = mean(x), .by = g)
- just count rows per group: count(df, g)
- one row per group from raw data: distinct(df, g, .keep_all = TRUE)
- multiple values per group (vector): reframe(df, q = quantile(x, c(.25, .75)), .by = g)
- window function (rank, lag): mutate(df, rk = rank(x), .by = g)
- aggregate without grouping: summarise(df, m = mean(x))

## What summarise() does in one sentence

**`summarise()` collapses rows into a single summary row.** You give it a data frame and one or more aggregation expressions of the form `name = function(column)`. The result has one row total (or one row per group when grouped), with only the columns you named.

Note: dplyr accepts both `summarise()` (British) and `summarize()` (American). They are aliases. Use either.

Unlike base R `aggregate()`, summarise integrates into pipelines, computes multiple statistics in one call, names result columns clearly, and pairs naturally with `group_by()` or `.by` for per-group aggregation.

## Syntax

**`summarise()` takes a data frame plus aggregation expressions.** Each expression must return a scalar (single value) per group. Use `n()` for row counts, `n_distinct()` for unique counts, and `across()` for applying the same function to many columns.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

mtcars |> select(mpg, cyl, hp) |> head(3)
#>                    mpg cyl  hp
#> Mazda RX4         21.0   6 110
#> Mazda RX4 Wag     21.0   6 110
#> Datsun 710        22.8   4  93
```

The full signature is:

```
summarise(.data, ..., .by = NULL, .groups = NULL)
```

`.data` is the data frame. The `...` argument takes one or more `name = aggregation_expr` pairs. `.by` provides ad-hoc grouping. `.groups` controls what to do with the grouping after summarise (relevant only when chained from `group_by()`).

[TIP]
**Use `.by` for one-off grouped summaries; use `group_by()` when downstream verbs also need the grouping.** `.by` auto-ungroups after the call; `group_by()` leaves the result grouped, which can surprise the next mutate or filter. Reach for `.by` first.

## Seven common patterns

### 1. Single summary across all rows

```r title="Mean mpg of all cars"
mtcars |>
  summarise(avg_mpg = mean(mpg))
#>    avg_mpg
#> 1 20.09062
```

The result is a one-row data frame with the column name you supplied.

### 2. Multiple statistics in one call

```r title="Count, mean, sd, min, max of mpg"
mtcars |>
  summarise(
    n = n(),
    avg = mean(mpg),
    sd  = sd(mpg),
    mn  = min(mpg),
    mx  = max(mpg)
  )
#>    n      avg       sd   mn   mx
#> 1 32 20.09062 6.026948 10.4 33.9
```

`n()` returns the row count. Each named expression becomes a column in the result.

### 3. Per-group summary with .by

```r title="Mean mpg per cylinder count"
mtcars |>
  summarise(avg_mpg = mean(mpg), n = n(), .by = cyl)
#>   cyl  avg_mpg  n
#> 1   6 19.74286  7
#> 2   4 26.66364 11
#> 3   8 15.10000 14
```

`.by = cyl` groups for this single call only. The result is automatically ungrouped.

### 4. Per-group summary with group_by

```r title="Same result via group_by then summarise"
mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg), n = n())
#> # A tibble: 3 x 3
#>     cyl avg_mpg     n
#>   <dbl>   <dbl> <int>
#> 1     4    26.7    11
#> 2     6    19.7     7
#> 3     8    15.1    14
```

Functionally identical to the `.by` version. Choose `.by` when grouping is local to this call; `group_by()` when subsequent verbs in the pipeline also need it.

### 5. Apply same function to many columns

```r title="Mean of every numeric column, by cyl"
mtcars |>
  summarise(across(where(is.numeric), mean), .by = cyl)
#>   cyl      mpg     disp        hp     drat       wt     qsec ...
#> 1   6 19.74286 183.3143 122.28571 3.585714 3.117143 17.97714
#> 2   4 26.66364 105.1364  82.63636 4.070909 2.285727 19.13727
#> 3   8 15.10000 353.1000 209.21429 3.229286 3.999214 16.77214
```

`across()` plus a tidyselect helper applies one function to multiple columns. Replaces legacy `summarise_at()`, `summarise_if()`, `summarise_all()`.

### 6. Custom quantile statistics

```r title="25th and 75th percentiles of mpg"
mtcars |>
  summarise(
    p25 = quantile(mpg, 0.25),
    median = median(mpg),
    p75 = quantile(mpg, 0.75)
  )
#>      p25 median   p75
#> 1 15.425  19.2 22.8
```

Any function that returns a scalar from a vector works inside summarise.

### 7. Distinct counts and presence checks

```r title="Distinct counts and presence flags"
starwars |>
  summarise(
    n_chars = n(),
    n_species = n_distinct(species, na.rm = TRUE),
    has_gold = any(skin_color == "gold", na.rm = TRUE)
  )
#> # A tibble: 1 x 3
#>   n_chars n_species has_gold
#>     <int>     <int> <lgl>
#> 1      87        37 TRUE
```

`n_distinct()` counts unique values. Predicates like `any()` and `all()` produce TRUE/FALSE summaries.

[KEY INSIGHT]
**Every expression inside summarise must return a SCALAR per group.** `mean(x)` returns one number, fine. `range(x)` returns two numbers, error. To split multi-value returns into separate columns, name each one explicitly: `mn = min(x), mx = max(x)`. As of dplyr 1.1+, `reframe()` is the alternative when you genuinely need vector-valued summaries.

## summarise() vs base R aggregation

**Base R offers `aggregate()` and `tapply()` for per-group aggregation; summarise wraps these in pipeline-friendly syntax.** The result of summarise is always a data frame; `tapply()` returns an array, `aggregate()` returns a data frame with awkward column names.

| Task | dplyr | Base R |
|---|---|---|
| Mean of one column | `summarise(df, m = mean(x))` | `mean(df$x)` |
| Mean by group | `summarise(df, m = mean(x), .by = g)` | `aggregate(x ~ g, df, mean)` |
| Multiple stats by group | `summarise(df, m = mean(x), s = sd(x), .by = g)` | `aggregate(cbind(m=mean(x), s=sd(x)) ~ g, df, ...)` (awkward) |
| Count rows by group | `summarise(df, n = n(), .by = g)` | `table(df$g)` |
| Across many columns | `summarise(df, across(where(is.numeric), mean), .by = g)` | `aggregate(. ~ g, df, mean)` |

When to use which:

- Use `summarise()` for any multi-statistic or pipelined aggregation.
- Use base R `mean()`, `sum()`, `tapply()`, etc. for one-line scripts on a vector.

## Common pitfalls

**Pitfall 1: forgetting NA handling.** `mean(starwars$mass)` returns NA because some rows are missing. `mean(starwars$mass, na.rm = TRUE)` ignores missing values. Inside summarise: `summarise(starwars, avg = mean(mass, na.rm = TRUE))`.

**Pitfall 2: result is grouped after `group_by() |> summarise()`.** dplyr 1.1+ peels off ONE level of grouping by default but the result may still be grouped if you grouped by multiple keys. Either chain `ungroup()` or use `.groups = "drop"` to fully ungroup. Or use `.by` instead.

[WARNING]
**British vs American spelling: pick one and stick with it.** dplyr accepts `summarise()` and `summarize()` interchangeably, and the same for `colour`/`color`. Mixing them in the same codebase confuses readers and grep searches. Pick the spelling your team prefers and use it consistently.

**Pitfall 3: trying to return multiple values per group.** `summarise(df, q = quantile(x, c(0.25, 0.75)))` errors because each group expression must return a scalar. Either name each value (`p25 = quantile(x, 0.25), p75 = quantile(x, 0.75)`) or use `reframe()` (dplyr 1.1+) for vector returns.

## Related dplyr functions

After mastering `summarise()`, look at:

- `group_by()`, `ungroup()`: persistent grouping for chained operations
- `count()`: shortcut for `summarise(n = n(), .by = ...)`
- `tally()`, `add_count()`: variations on row counting
- `reframe()`: for summaries that return multiple rows per group
- `n()`, `n_distinct()`, `cur_group()`, `cur_group_id()`: helpers that work inside summarise
- `across()` with tidyselect: bulk column summaries

For very large data, also check `data.table` syntax which provides the same semantics with often faster execution.

## FAQ

**What is the difference between summarise and summarize in dplyr?**

They are identical aliases. dplyr accepts both spellings to support British and American English users. Pick one and stick with it for consistency.

**How do I summarise multiple columns in dplyr?**

Use `across()` with a tidyselect helper: `summarise(df, across(where(is.numeric), mean))` computes the mean of every numeric column. To apply multiple functions: `summarise(df, across(where(is.numeric), list(mean = mean, sd = sd)))`.

**How do I count rows in dplyr summarise?**

Use `n()` inside summarise: `summarise(df, n = n())`. For unique-value counts use `n_distinct(col)`. For a quick group-counted shortcut, `count(df, group_col)` is equivalent to `df |> summarise(n = n(), .by = group_col)`.

**What is the difference between summarise with .by vs group_by?**

`.by` groups for the single summarise call and auto-ungroups the result. `group_by()` sets a persistent grouping that affects subsequent verbs (filter, mutate, summarise) until you call `ungroup()`. Use `.by` for one-off summaries; use `group_by()` for chains that need the grouping throughout.

**Can I use custom functions inside summarise?**

Yes, any function that returns a scalar per group works: `summarise(df, p90 = quantile(x, 0.9))`. For functions returning multiple values, use `reframe()` (dplyr 1.1+) instead of `summarise()`.
