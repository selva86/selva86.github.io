---
title: "dplyr pull() in R: Extract a Column as a Vector"
slug: "dplyr-pull-in-R"
description: "Use dplyr pull() to extract a single column from a data frame as a vector in R. Covers pull vs $, pull vs double-bracket, named output, and 6 examples."
keywords: "dplyr pull, extract column as vector R, dplyr pull vs $, R column to vector, dplyr pull examples, named pull"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "pull()|dplyr pull|dplyr::pull()|extract column|column to vector"
auto_link_case_sensitive: true
target_keyword: "dplyr pull"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr pull() in R: Extract a Column as a Vector

<p class="lead">The <code>pull()</code> function in dplyr extracts a single column from a data frame and returns it as a plain vector. It is the pipe-friendly equivalent of base R's <code>$</code> and <code>[[</code> operators.</p>

[QUICK ANSWER]
pull(df, mpg)                          # extract mpg as vector
pull(df, "mpg")                        # quoted name also works
pull(df, 1)                            # by position (column 1)
pull(df, last_col())                   # last column
pull(df, mpg, name = car_name)         # named vector
df |> filter(cyl == 4) |> pull(mpg)    # in pipeline
mean(pull(df, mpg))                    # feed to a function

[DECISION TREE: Is pull() the right tool?]
- extract one column as vector: pull(df, x)
- keep result as a data frame: select(df, x)
- get value at a single cell: df$x[3] or pull(df, x)[3]
- return a named vector: pull(df, x, name = id_col)
- multiple columns at once: select(df, x, y) (data frame)
- inside a pipe to feed scalar fn: df |> pull(x) |> mean()
- check column type: class(pull(df, x))

## What pull() does in one sentence

**`pull()` extracts ONE column from a data frame and returns a plain VECTOR.** Unlike `select(df, x)` which returns a one-column data frame, `pull(df, x)` strips the data frame wrapper and gives you the column's values directly.

This matters when downstream code expects a vector (e.g., `mean()`, `length()`, `sum()`). A one-column data frame is NOT the same as a vector; passing one where the other is expected often errors or produces surprising output.

## Syntax

**`pull()` takes a data frame and a single column reference.** The reference can be a bare name, a quoted string, or an integer position. An optional `name` argument turns the output into a named vector.

```r title="Load dplyr and inspect mtcars"
library(dplyr)

library(tibble)
mtcars |> pull(mpg) |> head()
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1
```

The full signature:

```
pull(.data, var = -1, name = NULL, ...)
```

`.data` is the data frame. `var` is the column to extract; default is `-1` (the LAST column). `name` is an optional column whose values become names of the output vector.

[TIP]
**The default for `var` is `-1`, meaning the LAST column.** `pull(df)` with no second argument returns the last column. This is useful in pipelines where the last column is freshly created or selected: `df |> mutate(z = ...) |> pull()` extracts z.

## Six common patterns

### 1. Extract a column by name

```r title="Get all mpg values as a vector"
mpg_vec <- mtcars |> pull(mpg)
mpg_vec |> head()
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1

class(mpg_vec)
#> [1] "numeric"
```

The result is a numeric vector, NOT a data frame.

### 2. Extract by position

```r title="First column, third column"
mtcars |> pull(1) |> head()
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1

mtcars |> pull(3) |> head()
#> [1] 160 160 108 258 360 225
```

Integer positions are 1-indexed. `pull(df, last_col())` extracts the last column by position helper.

### 3. Inside a pipeline

```r title="Filter then extract"
mean_mpg_4cyl <- mtcars |>
  filter(cyl == 4) |>
  pull(mpg) |>
  mean()

mean_mpg_4cyl
#> [1] 26.66364
```

`pull()` is the bridge from "data frame world" to "vector world". After pull, you can use base R functions that expect vectors: `mean()`, `sum()`, `range()`, etc.

### 4. Named vector with the name argument

```r title="Get mpg as a vector named by car"
named_mpg <- mtcars |>
  tibble::rownames_to_column("car") |>
  pull(mpg, name = car)

named_mpg |> head(4)
#> Mazda RX4     Mazda RX4 Wag        Datsun 710     Hornet 4 Drive
#>      21.0              21.0              22.8               21.4
```

Setting `name = car` turns the output into a named vector. Useful for lookup tables and direct subsetting like `named_mpg["Mazda RX4"]`.

### 5. Pull last column (default)

```r title="Pull the last column without naming it"
mtcars |>
  mutate(efficiency = mpg / wt) |>
  pull() |>
  head()
#> [1] 8.015267 7.304348 9.827586 6.656299 5.435279 5.231214
```

`pull()` with no argument returns the LAST column. Convenient after a `mutate()` where the new column is at the end.

### 6. Pull with quoted column name

```r title="Quoted name (useful in functions)"
my_col <- "mpg"
mtcars |> pull(my_col) |> head()
#> [1] 21.0 21.0 22.8 21.4 18.7 18.1
```

Quoted strings work the same as bare names. Useful inside functions where the column name is stored in a variable.

[KEY INSIGHT]
**`pull(df, x)` is to dplyr what `df$x` and `df[["x"]]` are to base R.** All three return the same vector. The difference is `pull()` is pipe-friendly and works inside chains; `$` requires the data frame as the LHS and breaks the pipe flow.

## pull() vs base R column extraction

**Three ways to extract a column as a vector. Choose based on context.**

| Task | dplyr | Base R |
|---|---|---|
| Extract by name | `pull(df, mpg)` | `df$mpg` or `df[["mpg"]]` |
| In a pipe | `df \|> filter(...) \|> pull(mpg)` | (awkward; needs `with()` or temp var) |
| Quoted name | `pull(df, "mpg")` | `df[["mpg"]]` |
| By position | `pull(df, 1)` | `df[[1]]` |
| Named vector output | `pull(df, mpg, name = id)` | `setNames(df$mpg, df$id)` |
| Default (last col) | `pull(df)` | `df[[ncol(df)]]` |

When to use which:

- Use `pull()` inside any dplyr pipeline.
- Use `df$x` or `df[["x"]]` for one-line scripts without other dplyr code.
- Use `pull(df, "x")` inside functions where the column name is a variable.

## Common pitfalls

**Pitfall 1: confusing `pull()` and `select()`.** `pull(df, x)` returns a VECTOR. `select(df, x)` returns a one-column DATA FRAME. They behave differently when fed to other functions: `mean(select(df, mpg))` errors, but `mean(pull(df, mpg))` works.

**Pitfall 2: `pull()` returns ONLY the last column by default.** Calling `pull(df)` without specifying a column returns the LAST column. New users sometimes expect it to return all columns. To get a specific column, always specify: `pull(df, mpg)`.

[WARNING]
**`pull()` strips data frame metadata including grouping.** If `df` is grouped via `group_by()`, the pull result is just a vector with no group info. To preserve grouping for downstream operations, summarise within the group first, then pull.

**Pitfall 3: pulling from a grouped frame can return UNEXPECTED ORDER.** `group_by(df, g) |> pull(x)` may not return values in the original row order, depending on dplyr version. If order matters, `arrange()` or `ungroup()` first.

## Try it yourself

**Try it:** From `mtcars`, extract the `hp` column as a vector and compute its mean. Save the mean to `ex_mean_hp`.

```r title="Your turn: pull and mean"
# Try it: mean of hp column
ex_mean_hp <- # your code here

ex_mean_hp
#> Expected: 146.6875
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mean_hp <- mtcars |> pull(hp) |> mean()
ex_mean_hp
#> [1] 146.6875
```

**Explanation:** `pull(hp)` extracts the hp column as a numeric vector. `mean()` then computes the average. This works because `mean()` expects a vector, which is exactly what `pull()` returns.

</details>

## Related dplyr functions

After mastering `pull()`, look at:

- `select()` (with one column): returns a data frame, not a vector
- `$` and `[[` in base R: equivalent to pull but not pipe-friendly
- `tibble::deframe()`: convert a 2-column tibble to a named vector
- `tibble::enframe()`: inverse, convert a named vector to a tibble

For extracting multiple columns, use `select()` and keep the data frame structure. `pull()` is specifically for the single-column case.

## FAQ

**What is the difference between pull and $ in dplyr and base R?**

`pull(df, x)` and `df$x` both return the same vector. The difference is composability: `pull()` works inside dplyr pipes (`df |> filter(...) |> pull(x)`), while `$` requires the data frame on the left side and breaks the pipe flow.

**How do I extract a single column as a vector in dplyr?**

Use `pull(df, column_name)`. The result is a vector you can pass to `mean()`, `sum()`, `length()`, etc. Use `select(df, column_name)` instead if you want a one-column data frame.

**Can I use pull with a quoted string for the column name?**

Yes. `pull(df, "mpg")` and `pull(df, mpg)` produce the same result. Use quoted strings inside functions where the column name is stored in a variable.

**What does pull return for a grouped data frame?**

A plain vector with no grouping. The vector contains values for all rows, but the group structure is gone. If grouping matters for the downstream operation, summarise within the group first, or `ungroup()` before pulling.

**How do I get a named vector from pull?**

Pass the `name` argument: `pull(df, value_col, name = name_col)`. The result is a named vector where each name comes from `name_col` and each value from `value_col`. Useful for lookup tables.
