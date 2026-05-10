---
title: "dplyr min_rank() in R: Rank With Ties Sharing Min Position"
slug: "dplyr-min_rank-in-R"
description: "Use dplyr min_rank() to rank values where tied entries share the lowest rank with gaps in R. Covers vs row_number, dense_rank, desc, NA handling, 5 examples."
keywords: "dplyr min_rank, R min rank, min_rank vs dense_rank, ranking ties R, dplyr standard rank, min_rank desc, R competition rank"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "min_rank()|dplyr min_rank|standard rank|ranking ties|competition ranking"
auto_link_case_sensitive: true
target_keyword: "dplyr min_rank"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr min_rank() in R: Rank With Ties Sharing Min Position

<p class="lead">The <code>min_rank()</code> function in dplyr ranks values where tied entries share the LOWEST available rank, leaving gaps. It is the "1224" or "competition" ranking style used in sports and academic standings.</p>

[QUICK ANSWER]
min_rank(c(10, 20, 20, 30))         # 1, 2, 2, 4 (gaps after ties)
min_rank(desc(x))                    # rank descending
df |> mutate(rank = min_rank(score))
df |> group_by(g) |> mutate(rank = min_rank(score))
dense_rank(c(10, 20, 20, 30))       # 1, 2, 2, 3 (no gaps)
row_number(c(10, 20, 20, 30))       # 1, 2, 3, 4 (always unique)

[DECISION TREE: Which ranking function?]
- ties share rank, leave gap (1, 2, 2, 4): min_rank()
- ties share rank, no gap (1, 2, 2, 3): dense_rank()
- ties broken by row order (1, 2, 3, 4): row_number()
- relative position 0..1: percent_rank() / cume_dist()
- bin into n equal groups: ntile(x, n)
- average tie ranks (1, 2.5, 2.5, 4): base::rank()

## What min_rank() does in one sentence

**`min_rank(x)` returns the rank of each element where TIED values share the LOWEST rank and subsequent ranks SKIP to leave gaps.** For `c(10, 20, 20, 30)`, the result is `c(1, 2, 2, 4)`.

This is the "competition" or "standard" ranking style. If two athletes share 2nd place, the next is 4th, not 3rd.

## Syntax

**`min_rank(x)`. Use `desc(x)` for descending. NAs stay as NA in the output.**

```r title="Rank scores ascending"
library(dplyr)

scores <- c(10, 20, 20, 30, 15)
min_rank(scores)
#> [1] 1 3 3 5 2
```

[TIP]
**`min_rank(x)` is what most people MEAN by "rank".** It matches sports standings: tied competitors get the same rank, and the next rank skips to leave a gap.

## Five common patterns

### 1. Standard ascending rank

```r title="Lowest score ranks 1"
scores <- c(50, 80, 80, 60, 90)
min_rank(scores)
#> [1] 1 3 3 2 5
```

Tied 80s share rank 3. The 90 is rank 5 (rank 4 is skipped).

### 2. Descending rank

```r title="Highest score ranks 1"
min_rank(desc(scores))
#> [1] 5 2 2 4 1
```

`desc()` reverses the comparison.

### 3. Top n via filter

```r title="Top 3 (with possible ties)"
df <- data.frame(score = c(50, 80, 80, 60, 90, 95))

df |>
  filter(min_rank(desc(score)) <= 3)
#>   score
#> 1    80
#> 2    80   <-- tied at rank 2
#> 3    90
#> 4    95
```

Returns 4 rows because the two 80s tie at rank 2, and rank 3 is filled by the 90; total 4 in the top-3 ranks.

### 4. Per-group rank

```r title="Rank within each group"
df_g <- data.frame(
  team  = c("A","A","B","B","B"),
  pts   = c(10, 20, 5, 15, 15)
)

df_g |>
  group_by(team) |>
  mutate(rank = min_rank(desc(pts)))
#> # A tibble: 5 x 3
#>   team   pts  rank
#>   A       10     2
#>   A       20     1
#>   B        5     3
#>   B       15     1
#>   B       15     1
```

Within each team, ranks restart.

### 5. NA handling

```r title="NAs propagate"
x <- c(10, NA, 20, NA)
min_rank(x)
#> [1]  1 NA  2 NA
```

NAs stay as NA in the rank vector.

[KEY INSIGHT]
**`min_rank` is "competition ranking": ties share the LOWEST rank, then the next rank SKIPS to leave a gap.** `dense_rank` is "no-gap ranking" (next rank does NOT skip). `row_number` is "broken ties" (always unique). Pick by what semantics your downstream code expects.

## min_rank() vs dense_rank() vs row_number() vs percent_rank()

**Four ranking functions in dplyr, with different tie behaviors.**

| Function | Output for c(10, 20, 20, 30) | Best for |
|---|---|---|
| `min_rank()` | 1, 2, 2, 4 | Competition / standard rank |
| `dense_rank()` | 1, 2, 2, 3 | No gaps after ties |
| `row_number()` | 1, 2, 3, 4 | Unique rank, ties broken by order |
| `percent_rank()` | 0, 0.33, 0.33, 1 | Relative position |
| `cume_dist()` | 0.25, 0.75, 0.75, 1 | Cumulative distribution |
| `base::rank()` | 1, 2.5, 2.5, 4 | Average ties (statistics default) |

When to use which:

- `min_rank` for sports / academic standings.
- `dense_rank` to count distinct rank levels.
- `row_number` for unique IDs, no shared ranks.
- `percent_rank` / `cume_dist` for percentile reasoning.

## A practical workflow

**Use min_rank when "what is my position relative to competitors" is the question.**

```r title="Top 10 leaderboard"
leaderboard |>
  arrange(desc(score)) |>
  mutate(rank = min_rank(desc(score))) |>
  filter(rank <= 10)
```

The top 10 (with ties expanding the result if there are tied scores).

For per-category rankings:

```r title="Top 5 per category"
products |>
  group_by(category) |>
  mutate(rank = min_rank(desc(rating))) |>
  filter(rank <= 5) |>
  ungroup()
```

Top 5 per category.

## Common pitfalls

**Pitfall 1: confusing min_rank with row_number.** `min_rank(c(10, 20, 20))` returns `c(1, 2, 2)`. `row_number(c(10, 20, 20))` returns `c(1, 2, 3)`. The former shares ties; the latter breaks them.

**Pitfall 2: filter by rank can return more than n rows.** `filter(min_rank(...) <= 3)` may return more than 3 rows if there are ties at rank 3. To get exactly 3, use `slice_max` or `row_number` with `<= 3`.

[WARNING]
**`base::rank()` defaults to AVERAGE ties (1, 2.5, 2.5, 4), which is DIFFERENT from min_rank.** They look similar but produce different results. Use min_rank in dplyr; rank with `ties.method = "min"` to mimic min_rank in base R.

## Try it yourself

**Try it:** Rank cars in `mtcars` by descending `mpg` and keep only those ranked 5 or better. Save to `ex_top`.

```r title="Your turn: top 5 by mpg via min_rank"
ex_top <- mtcars |>
  # your code here

nrow(ex_top)
#> Expected: 5 (or more if ties)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_top <- mtcars |>
  filter(min_rank(desc(mpg)) <= 5)

nrow(ex_top)
#> [1] 5  (no ties at rank 5)
```

**Explanation:** `min_rank(desc(mpg))` ranks by mpg descending. `<= 5` keeps the top 5 (or more if there were ties at rank 5).

</details>

## Related dplyr functions

After mastering min_rank, look at:

- `dense_rank()`: no-gap ranking
- `row_number()`: unique sequential IDs
- `percent_rank()` / `cume_dist()`: percentile-style ranks
- `ntile()`: bin into n equal groups
- `base::rank()`: average-tie default
- `slice_max()` / `slice_min()`: top/bottom n directly

For "give me exactly n rows", `slice_max` / `slice_min` are cleaner than rank-then-filter.

## FAQ

**What does min_rank do in dplyr?**

`min_rank(x)` ranks values where tied entries share the LOWEST rank, with subsequent ranks skipping to leave a gap. Example: c(10, 20, 20, 30) becomes c(1, 2, 2, 4).

**What is the difference between min_rank and dense_rank?**

`min_rank` leaves gaps after ties (1, 2, 2, 4). `dense_rank` does not leave gaps (1, 2, 2, 3). dense_rank is useful when counting distinct rank levels.

**What is the difference between min_rank and row_number?**

`min_rank` shares ranks among ties. `row_number` always produces unique sequential ranks; ties are broken by row order. Use min_rank for "leaderboard"; row_number for unique IDs.

**How do I rank descending?**

Wrap in `desc()`: `min_rank(desc(x))`. Highest value gets rank 1.

**How does min_rank handle NA?**

NAs stay as NA in the output. Filter NAs before ranking, or use `min_rank` with the understanding that NAs don't get a rank.
