---
title: "dplyr dense_rank() in R: Rank Without Gaps After Ties"
slug: "dplyr-dense_rank-in-R"
description: "Use dplyr dense_rank() to rank values where tied entries share the same rank with no gaps in R. Covers vs min_rank, row_number, descending, 5 examples."
keywords: "dplyr dense_rank, R dense rank, dense_rank vs min_rank, ranking ties no gaps, dplyr ranking R, dense_rank desc, ranking levels count"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dense_rank()|dplyr dense_rank|dense ranking|ranking no gaps|dense_rank vs min_rank"
auto_link_case_sensitive: true
target_keyword: "dplyr dense_rank"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr dense_rank() in R: Rank With Ties Sharing Same Position

<p class="lead">The <code>dense_rank()</code> function in dplyr ranks values where tied entries share the same rank, and the NEXT rank does NOT skip. The output covers a contiguous range 1, 2, 3, ... up to the number of distinct values.</p>

[QUICK ANSWER]
dense_rank(c(10, 20, 20, 30))      # 1, 2, 2, 3 (no gap)
min_rank(c(10, 20, 20, 30))        # 1, 2, 2, 4 (gap)
dense_rank(desc(x))                 # rank descending
df |> mutate(level = dense_rank(score))
df |> group_by(g) |> mutate(level = dense_rank(score))
length(unique(x))                   # max rank from dense_rank

[DECISION TREE: Which ranking function?]
- ties share rank, NO gap (1, 2, 2, 3): dense_rank()
- ties share rank, leave gap (1, 2, 2, 4): min_rank()
- always unique ranks (1, 2, 3, 4): row_number()
- percentile / relative position: percent_rank() or cume_dist()
- bin into n equal groups: ntile(x, n)
- count of distinct ranks: max(dense_rank(x))

## What dense_rank() does in one sentence

**`dense_rank(x)` returns the rank of each element where TIED values share the same rank and subsequent ranks DO NOT SKIP.** For `c(10, 20, 20, 30)`, the result is `c(1, 2, 2, 3)`: distinct values get distinct, contiguous ranks.

This is the "dense" or "no-gap" ranking style. The maximum rank equals `length(unique(x))`.

## Syntax

**`dense_rank(x)`. Use `desc(x)` for descending. NAs stay as NA in the output.**

```r title="Dense rank ascending"
library(dplyr)

x <- c(10, 20, 20, 30, 15)
dense_rank(x)
#> [1] 1 3 3 4 2
```

[TIP]
**`dense_rank` is the right tool when you want to bucket values into ordered categories.** Distinct values get distinct ranks; ties get the same rank. The result is a small contiguous integer range, perfect for category mapping.

## Five common patterns

### 1. Rank with ties sharing position

```r title="Three distinct values, two of them tied"
dense_rank(c(50, 80, 80, 60, 90))
#> [1] 1 3 3 2 4
```

The two 80s share rank 3. The 90 (next distinct value) is rank 4, not 5.

### 2. Descending dense rank

```r title="Highest value ranks 1"
dense_rank(desc(c(50, 80, 80, 60, 90)))
#> [1] 4 2 2 3 1
```

### 3. Count distinct values via dense_rank

```r title="Max dense rank = number of distinct values"
x <- c(10, 20, 20, 30, 15, 30)
max(dense_rank(x))
#> [1] 4

length(unique(x))
#> [1] 4
```

A useful identity: `max(dense_rank(x))` always equals `length(unique(x))` (excluding NAs).

### 4. Per-group dense rank

```r title="Restart ranks at each group"
df_g <- data.frame(
  team  = c("A","A","B","B","B"),
  pts   = c(10, 20, 5, 15, 15)
)

df_g |>
  group_by(team) |>
  mutate(level = dense_rank(desc(pts)))
#> # A tibble: 5 x 3
#>   team   pts level
#>   A       10     2
#>   A       20     1
#>   B        5     2
#>   B       15     1
#>   B       15     1
```

### 5. Bucket continuous values into ordered levels

```r title="Categorical encoding via dense_rank"
df <- data.frame(price = c(10, 50, 100, 100, 25))

df |>
  mutate(price_level = dense_rank(price))
#>   price price_level
#> 1    10           1
#> 2    50           3
#> 3   100           4
#> 4   100           4
#> 5    25           2
```

`price_level` is now a small integer range (1 to 4) suitable as a categorical input.

[KEY INSIGHT]
**`dense_rank` is the only rank function whose output forms a contiguous integer range.** `min_rank` and `row_number` can leave gaps or break ties. `dense_rank` always covers 1..k where k is the number of distinct values. Useful for mapping continuous values to ordinal categories.

## dense_rank() vs min_rank() vs row_number() vs ntile()

**Four ranking-style functions in dplyr.**

| Function | Output for c(10, 20, 20, 30) | Best for |
|---|---|---|
| `dense_rank()` | 1, 2, 2, 3 | Categorical encoding; no gaps |
| `min_rank()` | 1, 2, 2, 4 | Standard rank with gaps |
| `row_number()` | 1, 2, 3, 4 | Unique sequential IDs |
| `ntile(x, 3)` | 1, 2, 2, 3 | Bin into n equal-sized groups |

When to use which:

- `dense_rank` for "ordinal level" or "tier" assignment.
- `min_rank` for sports / standings.
- `row_number` for unique row IDs.
- `ntile` for binning into quantiles.

## A practical workflow

**The "tier assignment" pattern is the dense_rank sweet spot.**

```r title="Tier assignment via dense_rank"
products |>
  mutate(tier = dense_rank(desc(rating)))
```

A 5-star product and a 4.9-star product get tier 1 and 2; ties on the same rating share a tier. The maximum tier is the number of distinct ratings.

For per-category tiers:

```r title="Per-category tier assignment"
products |>
  group_by(category) |>
  mutate(tier = dense_rank(desc(rating))) |>
  ungroup()
```

Each category has its own contiguous tier range.

## Common pitfalls

**Pitfall 1: confusing dense_rank with min_rank.** `min_rank(c(10, 20, 20, 30))` is `c(1, 2, 2, 4)` (gap). `dense_rank(c(10, 20, 20, 30))` is `c(1, 2, 2, 3)` (no gap). Pick based on whether downstream code expects gaps.

**Pitfall 2: NA propagation.** NAs stay as NA in the rank vector. Filter NAs first or set `na.last = NA` (not directly supported; use `dense_rank(if_else(is.na(x), -Inf, x))` as a workaround).

[WARNING]
**`dense_rank` returns the SAME rank for ALL ties.** If you need unique ranks even when values are equal, use `row_number` instead.

## Try it yourself

**Try it:** Encode the unique `cyl` values in `mtcars` as small integers 1, 2, 3 (lowest cyl = 1). Save to `ex_cyl_level`.

```r title="Your turn: encode cyl as ordinal"
ex_cyl_level <- mtcars |>
  # your code here

head(ex_cyl_level)
#> Expected: original rows + cyl_level column with 1, 2, or 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_cyl_level <- mtcars |>
  mutate(cyl_level = dense_rank(cyl))

head(ex_cyl_level[, c("cyl", "cyl_level")])
#>                    cyl cyl_level
#> Mazda RX4            6         2
#> Mazda RX4 Wag        6         2
#> Datsun 710           4         1
#> Hornet 4 Drive       6         2
#> Hornet Sportabout    8         3
#> Valiant              6         2
```

**Explanation:** `dense_rank(cyl)` maps cyl 4 -> 1, cyl 6 -> 2, cyl 8 -> 3. Each unique cyl gets a contiguous integer level.

</details>

## Related dplyr functions

After mastering dense_rank, look at:

- `min_rank()`: gaps after ties
- `row_number()`: unique sequential
- `percent_rank()` / `cume_dist()`: percentile rankings
- `ntile()`: bin into n equal-sized groups
- `factor()`: convert dense ranks to factor levels
- `forcats::fct_inseq()`: factor in numerical order

For converting dense ranks to factors with sensible levels, `factor(dense_rank(x))` works.

## FAQ

**What does dense_rank do in dplyr?**

`dense_rank(x)` ranks values where tied entries share the same rank, and subsequent ranks DO NOT skip. The output is a contiguous integer range 1..k.

**What is the difference between dense_rank and min_rank?**

`dense_rank` produces no gaps after ties (1, 2, 2, 3). `min_rank` leaves gaps (1, 2, 2, 4). dense_rank is useful when counting distinct rank levels matters.

**How do I count the number of distinct ranks?**

`max(dense_rank(x))` returns the count of distinct values (ignoring NAs). Equivalent to `length(unique(x[!is.na(x)]))`.

**How do I rank descending with dense_rank?**

`dense_rank(desc(x))`. Highest value gets rank 1.

**Can dense_rank be used as a categorical encoder?**

Yes. `dense_rank(x)` maps distinct values of x to a contiguous integer range, which is the ordinal-encoding pattern.
