---
title: "dplyr bind_cols() in R: Combine Tables Side by Side"
slug: "dplyr-bind_cols-in-R"
description: "Use dplyr bind_cols() to combine data frames side by side by position in R. Covers bind_cols vs cbind, name conflicts, length checks, and 5 worked examples."
keywords: "dplyr bind_cols, R cbind alternative, bind_cols vs cbind, dplyr column bind, side-by-side join, name_repair bind_cols"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "bind_cols()|dplyr bind_cols|column bind|side-by-side combine|bind_cols vs cbind"
auto_link_case_sensitive: true
target_keyword: "dplyr bind_cols"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr bind_cols() in R: Combine Tables Side by Side

<p class="lead">The <code>bind_cols()</code> function in dplyr combines data frames or vectors SIDE BY SIDE (horizontally), matching by row position. It is the safe, type-checking dplyr alternative to base R <code>cbind()</code>.</p>

[QUICK ANSWER]
bind_cols(df1, df2)                          # combine by position
bind_cols(df1, df2, df3)                     # multiple inputs
bind_cols(df1, df2, .name_repair = "unique") # auto-rename clashes
bind_cols(df, new_col = c(1,2,3))            # add a named column
cbind(df1, df2)                              # base R alternative (less safe)
left_join(df1, df2, by = "id")                # different: JOIN by KEY

[DECISION TREE: Is bind_cols() the right tool?]
- combine columns SIDE BY SIDE, matched by position: bind_cols()
- combine ROWS (stack vertically): bind_rows()
- match by KEY column (id-based): left_join() / inner_join()
- add ONE column: mutate()
- merge tables of UNEQUAL length: bind_cols errors; use a join instead
- handle name conflicts: bind_cols(.name_repair = "unique")

## What bind_cols() does in one sentence

**`bind_cols(...)` glues data frames or vectors side by side by ROW POSITION; all inputs MUST have the same number of rows.** Unlike joins, there is no key matching; row 1 of input A is paired with row 1 of input B regardless of any id column.

This is the "concatenate columns" function. Useful when you have parallel computations or sourced columns that share row order.

## Syntax

**`bind_cols(..., .name_repair = "unique")`. All inputs must have the same number of rows (or be length 1, recycled).**

```r title="Combine two data frames side by side"
library(dplyr)

df_a <- data.frame(x = 1:3, y = c("a","b","c"))
df_b <- data.frame(z = 4:6, w = c("p","q","r"))

bind_cols(df_a, df_b)
#>   x y z w
#> 1 1 a 4 p
#> 2 2 b 5 q
#> 3 3 c 6 r
```

[TIP]
**Use `bind_cols` only when you are SURE the row order matches.** It does NOT validate that rows correspond to the same entity. For ID-based merging, use a join.

## Five common patterns

### 1. Combine two data frames

```r title="Side-by-side glue"
df_a <- data.frame(x = 1:3, y = c("a","b","c"))
df_b <- data.frame(z = 4:6)

bind_cols(df_a, df_b)
#>   x y z
#> 1 1 a 4
#> 2 2 b 5
#> 3 3 c 6
```

### 2. Add a vector as a new column

```r title="Append a column"
df <- data.frame(x = 1:3)
new_col <- c(10, 20, 30)

bind_cols(df, new_col = new_col)
#>   x new_col
#> 1 1      10
#> 2 2      20
#> 3 3      30
```

For one new column, `mutate(df, new_col = ...)` is more idiomatic.

### 3. Combine many data frames

```r title="Variable-arity binding"
df_a <- data.frame(x = 1:3)
df_b <- data.frame(y = 4:6)
df_c <- data.frame(z = 7:9)

bind_cols(df_a, df_b, df_c)
#>   x y z
#> 1 1 4 7
#> 2 2 5 8
#> 3 3 6 9
```

### 4. Resolve name conflicts

```r title=".name_repair handles duplicates"
df_a <- data.frame(x = 1:3)
df_b <- data.frame(x = 4:6)

bind_cols(df_a, df_b, .name_repair = "unique")
#>   x...1 x...2
#> 1     1     4
#> 2     2     5
#> 3     3     6
```

`unique` appends `...n` suffixes; `universal` is similar; `minimal` keeps duplicates as-is.

### 5. Bind a list of data frames

```r title="Use rlang!!! to splice"
list_of_dfs <- list(
  data.frame(a = 1:3),
  data.frame(b = 4:6)
)

do.call(bind_cols, list_of_dfs)
#>   a b
#> 1 1 4
#> 2 2 5
#> 3 3 6
```

For purrr users, `purrr::list_cbind(list_of_dfs)` is more direct.

[KEY INSIGHT]
**`bind_cols` is POSITIONAL; `left_join` is KEY-BASED.** bind_cols pairs row 1 with row 1, row 2 with row 2, etc., regardless of any id column. left_join matches by id. Use bind_cols when row order is meaningful and known; use a join when matching by id.

## bind_cols() vs cbind() vs left_join() vs mutate()

**Four ways to add columns to a data frame in R.**

| Function | Match by | Type-strict | Best for |
|---|---|---|---|
| `bind_cols()` | Position | Yes | dplyr; column glue |
| `base::cbind()` | Position | No | Base R; flexible but less safe |
| `left_join(by = "id")` | Key | Yes | Match by id |
| `mutate()` | (compute) | Yes | Add ONE computed column |

When to use which:

- `bind_cols` for parallel/sourced columns with matching row order.
- `cbind` for quick base R; can mix matrix and df.
- `left_join` when matching by id is needed.
- `mutate` for computed columns.

## A practical workflow

**The "results column" pattern is the bind_cols sweet spot.**

```r title="Append model predictions"
library(broom)
fit       <- lm(mpg ~ hp + wt, data = mtcars)
predicted <- predict(fit)

mtcars |>
  bind_cols(predicted = predicted)
```

Append model predictions as a new column. Position-matching works because predict returns one value per input row in the same order.

## Common pitfalls

**Pitfall 1: row count mismatch errors.** `bind_cols(df_a, df_b)` errors if df_a has 3 rows and df_b has 5 rows. Use a join when rows don't align positionally.

**Pitfall 2: silent ordering bugs.** bind_cols won't catch if df_a's row 3 is for "Alice" but df_b's row 3 is for "Bob". It will pair them anyway. Always verify row alignment first.

[WARNING]
**`bind_cols` does NOT match by id; it matches by POSITION.** This is dangerous if you don't trust the row order. For id-based combination, ALWAYS use `left_join` or `inner_join`.

## Try it yourself

**Try it:** Add a column `total` (mpg + hp/10) to `mtcars` using bind_cols. Save to `ex_total`.

```r title="Your turn: append a derived column"
totals <- mtcars$mpg + mtcars$hp / 10

ex_total <- mtcars |>
  # your code here

head(ex_total[, c("mpg", "hp", "total")])
#> Expected: original + total column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_total <- mtcars |>
  bind_cols(total = totals)

head(ex_total[, c("mpg", "hp", "total")])
#>                    mpg  hp  total
#> Mazda RX4         21.0 110  32.0
#> Mazda RX4 Wag     21.0 110  32.0
#> Datsun 710        22.8  93  32.1
#> ...

# More idiomatic with mutate:
ex_alt <- mtcars |>
  mutate(total = mpg + hp / 10)
```

**Explanation:** `bind_cols` appends the totals vector as a new column. For derived columns, `mutate` is more direct.

</details>

## Related dplyr functions

After mastering bind_cols, look at:

- `bind_rows()`: stack vertically
- `left_join()` / `inner_join()`: match by id
- `mutate()`: add computed columns
- `purrr::list_cbind()`: bind a list of data frames
- `base::cbind()`: base R; less type-strict
- `tibble::add_column()`: add at a specific position

For "add ONE column", `mutate()` or `tibble::add_column()` is cleaner than bind_cols.

## FAQ

**What does bind_cols do in dplyr?**

`bind_cols(df1, df2)` combines data frames side by side by row position. All inputs must have the same number of rows.

**What is the difference between bind_cols and cbind in R?**

bind_cols is the dplyr version: type-strict, validates row counts, returns a tibble. cbind is base R: more lenient, can return matrix or df depending on inputs.

**Should I use bind_cols or left_join?**

Use bind_cols when the row order is meaningful and matching (e.g., model predictions for the same input). Use left_join when matching by id.

**How do I handle name conflicts in bind_cols?**

Pass `.name_repair = "unique"` to auto-rename duplicates. Or rename one input first: `bind_cols(df_a, df_b |> rename(b_x = x))`.

**Can bind_cols accept vectors?**

Yes. `bind_cols(df, new_col = c(1,2,3))` adds a named vector as a new column. Length must match the data frame's row count.
