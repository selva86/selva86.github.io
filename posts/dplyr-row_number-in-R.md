---
title: "dplyr row_number() in R: Assign Sequential Row Indexes"
slug: "dplyr-row_number-in-R"
description: "Use dplyr row_number() to assign 1, 2, 3 sequential indexes to rows in R. Covers row_number vs rank, ordering, ties, per-group row numbers, 5 examples."
keywords: "dplyr row_number, R row number, row_number vs rank, dplyr sequential index, row_number per group, R numbering rows, row_number ordering"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "row_number()|dplyr row_number|sequential index|row number per group|ranking ties"
auto_link_case_sensitive: true
target_keyword: "dplyr row_number"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr row_number() in R: Assign Sequential Row Indexes

<p class="lead">The <code>row_number()</code> function in dplyr returns sequential integer ranks 1, 2, 3, ... where TIES are broken by FIRST APPEARANCE. It is the most common ranking function in dplyr.</p>

[QUICK ANSWER]
row_number()                            # 1, 2, 3, ... over current group
row_number(x)                           # rank by x (ties: first appearance)
row_number(desc(x))                     # rank by x descending
df |> mutate(rn = row_number())
df |> group_by(g) |> mutate(rn = row_number())
df |> filter(row_number() <= 3)         # top 3 per group (after sort)

[DECISION TREE: Is row_number() the right tool?]
- sequential index 1..n: row_number()
- rank by column, ties = first: row_number(col)
- rank by column, ties = same rank: min_rank() / dense_rank()
- top n rows: filter(row_number() <= n) or slice_head(n)
- per-group row numbers: group_by + row_number()
- random ordering: order(runif(n()))

## What row_number() does in one sentence

**`row_number()` (no arg) returns 1, 2, 3, ... in row order; `row_number(x)` returns the rank of each element of `x` with ties broken by FIRST APPEARANCE.** Inside `group_by()`, numbering restarts in each group.

The most common ranking function in dplyr. Use it when you want strictly increasing integers without tied ranks.

## Syntax

**`row_number(x = NULL)`. With no arg, returns 1..n_rows. With an arg, ranks by that vector.**

```r title="Sequential row numbers"
library(dplyr)

mtcars |>
  mutate(rn = row_number()) |>
  select(mpg, rn) |>
  head(3)
#>            mpg rn
#> Mazda RX4 21.0  1
#> Mazda RX4 Wag 21.0  2
#> Datsun 710 22.8  3
```

[TIP]
**Use `row_number()` (no arg) inside mutate to add a sequential id column.** Combined with `arrange()`, it gives you a stable position index after sorting.

## Five common patterns

### 1. Add a sequential index

```r title="Number every row 1..n"
mtcars |>
  mutate(id = row_number()) |>
  head(3)
```

Sequential id, useful for joining or referencing rows.

### 2. Rank by a column

```r title="Rank by mpg ascending"
df <- data.frame(name = c("a","b","c","d"), score = c(10, 20, 20, 5))

df |>
  mutate(rank = row_number(score))
#>   name score rank
#> 1    a    10    2
#> 2    b    20    3
#> 3    c    20    4   <-- tie broken by first appearance
#> 4    d     5    1
```

Ties are broken by row order, NOT shared rank.

### 3. Rank descending

```r title="Top performers first"
df |>
  mutate(rank_desc = row_number(desc(score)))
#>   name score rank_desc
#> 1    a    10        3
#> 2    b    20        1
#> 3    c    20        2
#> 4    d     5        4
```

### 4. Per-group row numbers

```r title="1..k per group"
df_g <- data.frame(
  user = c("a","a","a","b","b"),
  ts   = 1:5
)

df_g |>
  group_by(user) |>
  mutate(visit_num = row_number())
#> # A tibble: 5 x 3
#>   user  ts visit_num
#>   a      1         1
#>   a      2         2
#>   a      3         3
#>   b      4         1
#>   b      5         2
```

User a's visits are numbered 1-3; user b's restart at 1.

### 5. Top n per group (filter)

```r title="Top 2 highest mpg per cyl"
mtcars |>
  group_by(cyl) |>
  arrange(desc(mpg)) |>
  filter(row_number() <= 2) |>
  ungroup()
```

Sort by mpg desc within each group, then keep rows where row_number is 1 or 2.

[KEY INSIGHT]
**`row_number()` always produces UNIQUE integer ranks.** No ties. Two rows with the same value get adjacent ranks (e.g., 3 and 4). For shared ranks on ties, use `min_rank()` (1, 2, 2, 4) or `dense_rank()` (1, 2, 2, 3) instead.

## row_number() vs min_rank() vs dense_rank() vs rank()

**Four ranking functions in R, with different tie-handling.**

| Function | Ties | Output for c(10, 20, 20, 5) |
|---|---|---|
| `row_number(x)` | Broken by row order | 2, 3, 4, 1 |
| `min_rank(x)` | Tied values share min rank | 2, 3, 3, 1 |
| `dense_rank(x)` | Tied values share rank, no gaps | 2, 3, 3, 1 (same here) |
| `base::rank(x)` | Tied values get average | 2, 3.5, 3.5, 1 |

When to use which:

- `row_number` for unique sequential IDs.
- `min_rank` for "leaderboard with ties".
- `dense_rank` to avoid gaps after ties.
- `rank` if you need average-tie behavior (rare in dplyr).

## A practical workflow

**The "top n per group" pattern is row_number's signature use case.**

```r title="Top 5 per category"
df |>
  group_by(category) |>
  arrange(desc(score)) |>
  filter(row_number() <= 5) |>
  ungroup()
```

Top 5 by score in each category. Equivalent to `slice_max(score, n = 5, by = category)` in modern dplyr (1.1+); slice_max is cleaner.

For "first occurrence per group":

```r title="First chronological row per user"
df |>
  group_by(user) |>
  arrange(timestamp) |>
  filter(row_number() == 1) |>
  ungroup()
```

Same as `slice_min(timestamp, n = 1, by = user)`.

## Common pitfalls

**Pitfall 1: forgetting arrange.** `row_number()` is positional. Without `arrange()`, the numbers reflect whatever order rows happen to be in.

**Pitfall 2: per-group reset can surprise.** On a grouped tibble, row_number restarts at each group boundary. If you wanted a global row index, ungroup first or use `mutate(id = 1:n())` outside group_by.

[WARNING]
**`row_number(x)` and `row_number()` differ semantically.** With no arg, it numbers rows 1..n in current order. With an arg, it RANKS by that column. Easy to confuse.

## Try it yourself

**Try it:** Rank `mtcars` cars by `hp` descending and keep only the top 3 PER cyl group. Save to `ex_top3`.

```r title="Your turn: top 3 hp per cyl"
ex_top3 <- mtcars |>
  # your code here

ex_top3
#> Expected: 9 rows (3 per cyl group)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_top3 <- mtcars |>
  group_by(cyl) |>
  arrange(desc(hp)) |>
  filter(row_number() <= 3) |>
  ungroup()

# Modern equivalent:
ex_top3_v2 <- mtcars |>
  slice_max(hp, n = 3, by = cyl)
```

**Explanation:** Sort by hp desc within each cyl, keep rows where row_number <= 3. slice_max is the cleaner alternative in dplyr 1.1+.

</details>

## Related dplyr functions

After mastering row_number, look at:

- `min_rank()`: ties share min rank
- `dense_rank()`: ties share rank, no gaps
- `percent_rank()` / `cume_dist()`: relative-position rankings
- `ntile()`: split rows into n bins
- `slice_max()` / `slice_min()`: top/bottom n by column (cleaner than filter + row_number)
- `cur_group_rows()`: row indices within current group

For modern dplyr code, prefer `slice_max(col, n)` over `arrange(desc(col)) |> filter(row_number() <= n)`.

## FAQ

**What does row_number do in dplyr?**

`row_number()` returns 1, 2, 3, ... sequential integers. `row_number(x)` ranks by x with ties broken by first appearance.

**What is the difference between row_number, min_rank, and dense_rank?**

`row_number` always produces unique ranks (ties broken by row order). `min_rank` gives ties the same rank but leaves gaps (1, 2, 2, 4). `dense_rank` gives ties the same rank with no gaps (1, 2, 2, 3).

**How do I get top n rows per group with row_number?**

`df |> group_by(g) |> arrange(desc(col)) |> filter(row_number() <= n)`. In dplyr 1.1+, `slice_max(col, n, by = g)` is cleaner.

**Why does row_number reset on grouped tibbles?**

Because dplyr applies it per group. To get a global row index, call `ungroup()` first or use `mutate(id = 1:n())` outside the grouping.

**What is the difference between row_number() and 1:n()?**

`1:n()` is also valid inside dplyr verbs and produces the same result. `row_number()` is a window function with full dplyr support; `1:n()` is shorter but functionally equivalent for the no-arg case.
