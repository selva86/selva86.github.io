---
title: "dplyr pull vs select in R: Vector vs Data Frame Output"
slug: "dplyr-pull-vs-select-in-R"
description: "Compare dplyr pull() vs select() in R: pull returns a vector, select returns a data frame. Covers when to use each, ergonomics, and 5 worked examples."
keywords: "dplyr pull vs select, R pull select difference, dplyr extract column, pull single column, select keep column, dplyr vector vs tibble"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "pull vs select|dplyr pull|dplyr select|extract column|vector from data frame"
auto_link_case_sensitive: true
target_keyword: "dplyr pull vs select"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr pull vs select in R: Vector vs Data Frame Output

<p class="lead">In dplyr, <code>pull()</code> extracts ONE column as a VECTOR; <code>select()</code> keeps ONE OR MORE columns as a DATA FRAME. They serve different purposes despite both "selecting" columns.</p>

[QUICK ANSWER]
df |> pull(mpg)                          # numeric vector (length nrow(df))
df |> select(mpg)                        # 1-column tibble
df |> pull(1)                            # by position
df |> pull(mpg, name)                    # named vector
df |> select(mpg, hp)                    # 2-column tibble (pull can't do this)
df$mpg                                    # base R equivalent of pull(mpg)

[DECISION TREE: pull or select?]
- need a VECTOR (1 column): pull()
- need a DATA FRAME (1+ columns): select()
- multiple columns at once: select() (pull only does 1)
- feed to a function expecting a vector: pull()
- feed to a function expecting a data frame: select()

## What pull() vs select() does in one sentence

**`pull(df, col)` returns the values of one column as a VECTOR; `select(df, ...)` returns a DATA FRAME with only the specified columns.** Both pick columns; they differ in output shape.

## Side-by-side comparison

```r title="Same column, different shapes"
library(dplyr)

library(tibble)
# pull: returns a vector
mtcars |> pull(mpg) |> head(3)
#> [1] 21.0 21.0 22.8

# select: returns a 1-column tibble
mtcars |> select(mpg) |> head(3)
#>            mpg
#> Mazda RX4 21.0
#> Mazda RX4 Wag 21.0
#> Datsun 710 22.8
```

[TIP]
**Use `pull()` when downstream code expects a VECTOR (e.g., `mean()`, `length()`).** Use `select()` when downstream code expects a DATA FRAME (e.g., another dplyr verb).

## Five common patterns

### 1. Extract one column

```r title="Vector vs tibble"
mtcars |> pull(mpg)    # vector
mtcars |> select(mpg)  # tibble
```

### 2. Compute a stat on a column

```r title="pull then mean"
mtcars |>
  filter(cyl == 4) |>
  pull(mpg) |>
  mean()
#> [1] 26.66364
```

select would return a tibble; mean would error.

### 3. Use a column as iteration target

```r title="Loop over a vector"
for (id in mtcars |> pull(carb)) {
  # process id
}
```

select would loop over a 1-column tibble.

### 4. Multiple columns: select only

```r title="pull can't multi"
mtcars |> select(mpg, hp, wt)   # 3-column tibble
mtcars |> pull(mpg, hp)          # ERROR: pull takes ONE column
```

### 5. Named vector via pull

```r title="pull(value, name) returns named vector"
mtcars |>
  tibble::rownames_to_column("car") |>
  pull(mpg, name = car) |>
  head(3)
#> Mazda RX4    Mazda RX4 Wag    Datsun 710
#>      21.0             21.0          22.8
```

[KEY INSIGHT]
**The difference is shape, not semantics.** Both pull and select identify the SAME data; pull returns it as a vector, select as a data frame. Pick by what your downstream code expects.

## pull() vs select() vs $ vs [[

**Four ways to extract column data in R.**

| Approach | Returns | Pipe-friendly |
|---|---|---|
| `df |> pull(col)` | Vector | Yes |
| `df |> select(col)` | 1-column tibble | Yes |
| `df$col` | Vector | No (LHS not pipeable) |
| `df[["col"]]` | Vector | No |
| `df[, "col"]` | Vector or tibble (depends) | No |

When to use which:

- `pull` for vector inside a pipe.
- `select` for data frame inside a pipe.
- `$` for interactive scripting (no pipe).
- `[[` for programmatic access with a string column name.

## A practical workflow

**The common "pull at the end of a filter chain" pattern.**

```r
top_mpg <- mtcars |>
  filter(cyl == 4) |>
  arrange(desc(mpg)) |>
  pull(mpg)
```

The vector `top_mpg` can now be fed to `mean`, `summary`, or any function expecting a numeric vector.

The "select for downstream verb" pattern:

```r
key_cols <- mtcars |>
  select(mpg, hp, wt)
# Continue with: pivot_longer, summarise, etc.
```

select keeps the data-frame shape for further dplyr operations.

## Common pitfalls

**Pitfall 1: pull with multiple columns.** `pull(mpg, hp)` is wrong (the second arg is for naming, not selecting). Use `select(mpg, hp)` for multiple columns.

**Pitfall 2: forgetting that select returns a data frame.** `select(mpg) |> mean()` errors because mean expects a vector. Use `pull` instead.

[WARNING]
**`pull(df, mpg, name)` reuses the second positional arg as `name`.** This is what creates a named vector. If you intended a second selection column, use select instead.

## Try it yourself

**Try it:** Get the mean mpg of 4-cylinder cars in two ways: with pull and with $. Save to `ex_avg`.

```r title="Your turn: pull vs $"
# Pipe-friendly version:
ex_avg <- mtcars |>
  filter(cyl == 4) |>
  # your code here

ex_avg
#> Expected: ~26.66
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_avg <- mtcars |>
  filter(cyl == 4) |>
  pull(mpg) |>
  mean()

# Equivalent base R:
ex_alt <- mean(mtcars$mpg[mtcars$cyl == 4])

ex_avg
#> [1] 26.66364
```

**Explanation:** pull extracts mpg as a vector after filtering; mean computes the average.

</details>

## Related dplyr / base functions

After mastering pull vs select, look at:

- `select()`: pick multiple columns
- `pull()`: extract one column as vector
- `$` / `[[`: base R extraction
- `tibble::deframe()`: convert 2-column df to named vector
- `dplyr::pluck()`: deeper extraction (purrr alternative)

For named vector creation, `pull(df, value, name)` is a one-liner that replaces a multi-step deframe.

## Why both functions exist

**dplyr separates "narrow column selection" from "data extraction" deliberately.** Most dplyr verbs work on data frames, so select fits naturally in a pipeline of verbs. But sometimes you need to BREAK OUT of the data-frame world (compute a scalar, build a named vector, feed a function that expects a vector) — that's pull's job. Having two verbs with clear purposes is cleaner than overloading select to sometimes return a vector.

## FAQ

**What is the difference between pull and select in dplyr?**

pull returns a VECTOR; select returns a DATA FRAME. pull is for one column; select can take multiple.

**When should I use pull vs $ in R?**

pull is pipe-friendly: `df |> filter(...) |> pull(col)`. `$` requires the data frame to be on the LHS of `$`, so it doesn't fit naturally in pipes.

**Can pull extract multiple columns?**

No. The second arg in pull is `name`, not a second column. For multiple columns, use select.

**How do I create a named vector with pull?**

`pull(df, value, name)`. The values become the vector; the name column becomes vector names.

**Is pull faster than $?**

Negligibly different. pull does a tiny bit more work for tidyselect support but the difference doesn't matter for any practical use case.
