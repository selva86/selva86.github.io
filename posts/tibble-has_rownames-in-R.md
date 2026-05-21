---
title: "tibble has_rownames() in R: Detect Non-Trivial Row Names"
slug: "tibble-has_rownames-in-R"
description: "Detect whether a data frame carries non-trivial row names with tibble has_rownames() in R. Learn syntax, mtcars vs tibble checks, and three real-world pitfalls."
keywords: "tibble has_rownames, has_rownames function R, tibble has_rownames examples, R check rownames, detect rownames data frame R, has rownames tidyverse, rownames check R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "has_rownames()|tibble has_rownames|tibble::has_rownames()|check if rownames exist|detect non-trivial rownames"
auto_link_case_sensitive: true
target_keyword: "tibble has_rownames"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble has_rownames() in R: Detect Non-Trivial Row Names

<p class="lead">The <code>has_rownames()</code> function in the tibble package returns <code>TRUE</code> when a data frame carries explicit character row names and <code>FALSE</code> otherwise, including for every tibble and for any data frame still using the default integer row index.</p>

[QUICK ANSWER]
has_rownames(mtcars)                          # TRUE: real labels
has_rownames(iris)                            # FALSE: default 1:N
has_rownames(as_tibble(mtcars))               # FALSE: tibbles never
has_rownames(data.frame(x = 1:3))             # FALSE: integer rownames
df |> has_rownames()                          # pipe-friendly check
if (has_rownames(df)) rownames_to_column(df)  # guard before lift
stopifnot(has_rownames(df))                   # contract check in functions

[DECISION TREE: Is has_rownames() the right tool?]
- check whether a frame has rownames: has_rownames(df)
- lift rownames into a column: rownames_to_column(df, "id")
- move a column into rownames: column_to_rownames(df, "id")
- drop rownames entirely: remove_rownames(df)
- read the rownames as a vector: rownames(df)
- count rows regardless of rownames: nrow(df)
- check the class of a frame: inherits(df, "data.frame")

## What has_rownames() does in one sentence

**`has_rownames()` returns `TRUE` if its data frame argument has non-trivial row names and `FALSE` if those row names are missing, integer, or default.** Internally it delegates to base R's `.row_names_info()`, which distinguishes character row names (real labels) from compact integer row names (the default `1, 2, 3, ...` index that R assigns to every fresh data frame). Only character row names count as "having" rownames.

The function is a predicate, returning a single logical scalar. It exists because the question "does this frame have rownames?" is surprisingly subtle in base R: `is.null(rownames(df))` returns `FALSE` for every data frame, even brand new ones, because `rownames(df)` always materialises a vector. `has_rownames()` answers the question users actually mean, which is whether those names carry information worth preserving.

## Syntax

**`has_rownames()` takes a data frame and returns a single `TRUE` or `FALSE`.** No optional arguments, no side effects, no errors on unusual inputs.

```r title="Load tibble and check three frames"
library(tibble)
library(dplyr)

# mtcars has character rownames (car models)
has_rownames(mtcars)
#> [1] TRUE

# iris uses the default integer rownames
has_rownames(iris)
#> [1] FALSE

# A tibble never carries rownames
has_rownames(as_tibble(mtcars))
#> [1] FALSE
```

The full signature is:

```
has_rownames(.data)
```

Argument:

- `.data`: a data frame or tibble. Non-data-frame inputs return `FALSE` instead of erroring.

The return value is always a length-one logical, never `NA`. There is nothing to configure.

[TIP]
**Use `has_rownames()` as a guard before `rownames_to_column()`.** Calling `rownames_to_column()` on a frame without real rownames produces a column of useless `"1", "2", "3", ...` strings. Branching on `has_rownames()` keeps the lift idempotent.

## Five common patterns

### 1. Distinguish real labels from default integer rownames

```r title="Built-in datasets compared"
has_rownames(mtcars)
#> [1] TRUE

has_rownames(iris)
#> [1] FALSE

has_rownames(airquality)
#> [1] FALSE

has_rownames(USArrests)
#> [1] TRUE
```

`mtcars` and `USArrests` ship with character rownames (car models, US state names), so `has_rownames()` returns `TRUE`. `iris` and `airquality` use the default `1:N` integer index, which the function correctly reports as absent. This distinction matters for any code that wants to preserve labels through a pipeline.

### 2. Every tibble returns FALSE, even one converted from mtcars

```r title="Tibble conversion drops rownames"
mt_tbl <- as_tibble(mtcars)
has_rownames(mt_tbl)
#> [1] FALSE

# To preserve labels, lift them first
mt_tbl_kept <- as_tibble(mtcars, rownames = "model")
has_rownames(mt_tbl_kept)
#> [1] FALSE

# But the column is there
head(mt_tbl_kept$model, 3)
#> [1] "Mazda RX4"     "Mazda RX4 Wag" "Datsun 710"
```

Tibbles intentionally do not store row names; every observation identifier is a first-class column instead. So `has_rownames()` on any tibble always returns `FALSE`, even after `as_tibble(rownames = "model")` lifts the labels safely into a column. The check is asking about row name attributes, not about whether labels exist anywhere in the frame.

### 3. Guard a pipeline before lifting rownames

```r title="Conditional rowname lift"
safe_lift <- function(df, var = "id") {
  if (has_rownames(df)) {
    rownames_to_column(df, var)
  } else {
    df
  }
}

safe_lift(mtcars) |> head(2)
#>                      id  mpg cyl disp  hp drat   wt qsec vs am gear carb
#> Mazda RX4     Mazda RX4 21.0   6  160 110 3.90 2.62 16.5  0  1    4    4
#> Mazda RX4 Wag Mazda RX4 21.0   6  160 110 3.90 2.88 17.0  0  1    4    4

safe_lift(iris) |> head(2)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
```

Branching on `has_rownames()` keeps the lift idempotent: frames with real labels pick up an `id` column, frames without rownames pass through unchanged. Without the guard, `rownames_to_column()` on `iris` would create a meaningless `"1", "2", "3"` column.

### 4. Detect rowname loss after a dplyr verb

```r title="Most dplyr verbs strip rownames"
has_rownames(mtcars)
#> [1] TRUE

mtcars_filtered <- mtcars |> filter(cyl == 4)
has_rownames(mtcars_filtered)
#> [1] FALSE

# Lift first, then filter
mtcars_kept <- mtcars |>
  rownames_to_column("model") |>
  filter(cyl == 4)
has_rownames(mtcars_kept)
#> [1] FALSE

# Labels survive as a column
head(mtcars_kept$model, 3)
#> [1] "Datsun 710" "Merc 240D"  "Merc 230"
```

`filter()`, `mutate()`, `arrange()`, and `select()` all coerce their input to a tibble internally, so rownames disappear after the first call. `has_rownames()` exposes exactly when this happens. The safe pattern is to lift rownames into a column first, then run the pipeline.

### 5. Contract check inside a function

```r title="Stop early if rownames missing"
to_dist_matrix <- function(df) {
  stopifnot(
    is.data.frame(df),
    has_rownames(df)
  )
  dist(as.matrix(df))
}

# Works: mtcars has rownames
to_dist_matrix(mtcars[1:3, 1:3])
#>           Mazda RX4 Mazda RX4 Wag
#> Mazda RX4 Wag 0.281...
#> Datsun 710    13.40...

# Fails fast: iris does not
# to_dist_matrix(iris[1:3, 1:4])
# Error: has_rownames(df) is not TRUE
```

Functions that depend on rownames (matrix routines, heatmaps, biplots) should refuse unlabelled frames up front, not silently produce a distance matrix labelled `1, 2, 3`. A `stopifnot(has_rownames(df))` line at the top of such functions documents the contract and fails fast when violated.

## has_rownames() vs alternatives

**Pick `has_rownames()` when you want a simple, tibble-aware predicate.** Several adjacent expressions answer related questions but with subtle differences.

| Behavior | `has_rownames()` | `!is.null(rownames(df))` | `.row_names_info(df) > 0` | `inherits(df, "tbl_df")` |
|---|---|---|---|---|
| Source | tibble | base R | base R (internal) | base R |
| Returns | TRUE/FALSE | Always TRUE for data frames | TRUE/FALSE | TRUE/FALSE |
| Detects character rownames | Yes | No (always TRUE) | Yes | No |
| Tibble-aware | Yes (always FALSE) | No | Same answer | Yes (returns TRUE) |
| Safe on non-data-frames | Yes (returns FALSE) | Errors | Errors | Yes |

When to use which:

- Use `has_rownames()` for everyday checks: it asks the question users mean and handles tibbles correctly.
- Use `inherits(df, "tbl_df")` when you specifically want to know if the input is a tibble, not whether labels exist.
- Use `.row_names_info(df) > 0` only inside tibble itself or in micro-benchmarks where you must avoid the function call cost.
- Never rely on `!is.null(rownames(df))`: it returns `TRUE` for every data frame, including blank new ones.

[KEY INSIGHT]
**Base R's `rownames(df)` always returns a non-null vector, even on a fresh frame with no real labels.** That is why `has_rownames()` exists: to answer the question "does this frame carry labels worth preserving?" instead of the literal "is the rownames attribute null?" The two are not the same.

## Common pitfalls

**Pitfall 1: assuming a tibble can have rownames.** Tibbles intentionally do not store row names. `has_rownames()` returns `FALSE` for every tibble, no matter how it was built.

```r title="Tibbles never carry rownames"
tb <- tibble(x = 1:3)
rownames(tb) <- c("a", "b", "c")
has_rownames(tb)
#> [1] FALSE

# The "rownames" call appears to succeed but does nothing durable
rownames(tb)
#> [1] "1" "2" "3"
```

If you need observation labels in a tibble, store them in an ordinary column. Use `as_tibble(df, rownames = "var")` to migrate existing rownames into a column during conversion.

**Pitfall 2: confusing `has_rownames()` with `nrow(df) > 0`.** A frame with rows can still report `FALSE` from `has_rownames()`, because the question is about row labels, not row count.

```r title="Rows exist but no labels"
df <- data.frame(x = 1:1000)
nrow(df)
#> [1] 1000
has_rownames(df)
#> [1] FALSE
```

Use `nrow()` for size checks. Use `has_rownames()` only for the labels question.

[WARNING]
**Most dplyr verbs silently strip rownames.** `filter()`, `mutate()`, `arrange()`, `select()`, and `summarise()` all coerce their input to a tibble, so any rownames on the input disappear from the output. Lift them with `rownames_to_column()` before piping if you need them downstream.

**Pitfall 3: trusting `!is.null(rownames(df))` as a substitute.** Base R's `rownames(df)` always materialises a vector, so a null check is never `TRUE` for any data frame.

```r title="Why the null check fails"
df <- data.frame(x = 1:3)
is.null(rownames(df))
#> [1] FALSE
rownames(df)
#> [1] "1" "2" "3"

has_rownames(df)
#> [1] FALSE
```

The integer rownames are auto-generated, not stored. `has_rownames()` looks past this auto-generation; the null check does not.

## Try it yourself

**Try it:** Write a short pipeline that loads `USArrests`, confirms it carries rownames, lifts them into a column called `state`, filters to states with `Murder > 10`, then verifies the result no longer carries rownames (because dplyr coerced to a tibble). Save the final filtered tibble to `ex_arrests`.

```r title="Your turn: lift then verify"
library(tibble)
library(dplyr)
# Try it: build ex_arrests
ex_arrests <- # your code here

has_rownames(ex_arrests)
#> Expected: FALSE
nrow(ex_arrests)
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
stopifnot(has_rownames(USArrests))

ex_arrests <- USArrests |>
  rownames_to_column("state") |>
  filter(Murder > 10)

has_rownames(ex_arrests)
#> [1] FALSE
nrow(ex_arrests)
#> [1] 5
head(ex_arrests$state, 5)
#> [1] "Alabama"        "Florida"        "Georgia"
#> [4] "Mississippi"    "South Carolina"
```

**Explanation:** `stopifnot(has_rownames(USArrests))` confirms the source frame carries labels before the pipeline runs. After `filter()`, the result is a tibble, so `has_rownames(ex_arrests)` correctly reports `FALSE`. The labels survive as the `state` column.

</details>

## Related tibble functions

Alongside `has_rownames()`, look at:

- `rownames_to_column()`: lift row names out into a new character column.
- `column_to_rownames()`: promote a column's values back into row names.
- `remove_rownames()`: drop row names entirely without saving them.
- `rowid_to_column()`: add a fresh integer id column without touching existing row names.
- `as_tibble(rownames = "var")`: lift rownames into a column during tibble conversion.
- `tibble::is_tibble()`: a related predicate for "is this object a tibble?".

For the full reference, see the [official tibble rownames documentation](https://tibble.tidyverse.org/reference/rownames.html).

## FAQ

**How do I check if a data frame has row names in R?**

Call `has_rownames()` from the tibble package, passing the data frame: `has_rownames(df)`. It returns `TRUE` only if the frame carries explicit character row names like `mtcars` or `USArrests`. Frames using the default integer index (like `iris`) return `FALSE`, and every tibble returns `FALSE`. Avoid `!is.null(rownames(df))`: that check always returns `TRUE` for data frames because base R auto-generates an integer rownames vector even when no labels are set.

**Why does has_rownames() return FALSE on my tibble?**

Tibbles intentionally do not store row names. The tibble design treats every observation identifier as a first-class column instead, so `has_rownames()` always returns `FALSE` for tibble inputs. If you want to keep labels through a tibble pipeline, lift them into a column with `rownames_to_column()` or use `as_tibble(df, rownames = "var")` during conversion.

**What is the difference between has_rownames() and rownames()?**

`rownames(df)` always returns a character vector, even on a fresh frame with default integer labels (you get `"1", "2", "3", ...`). `has_rownames(df)` returns a single `TRUE`/`FALSE` that is `TRUE` only when those labels are explicit and meaningful, not auto-generated. Use `has_rownames()` for predicate checks; use `rownames()` only when you actually need the label vector.

**Does has_rownames() work on non-data-frame inputs?**

Yes, safely. Passing a matrix, vector, or list to `has_rownames()` returns `FALSE` instead of erroring, because the function first checks `is.data.frame(.data)`. You can drop it into a `stopifnot()` clause without wrapping it in extra guards. Other base R rownames calls may error on non-data-frame inputs, so this safety is a real convenience.

**Why do dplyr verbs make has_rownames() return FALSE?**

`filter()`, `mutate()`, `arrange()`, `select()`, and `summarise()` all coerce their input to a tibble internally, and tibbles never carry rownames. The fix is to lift rownames before the first dplyr call with `rownames_to_column("id")`, run the pipeline, then promote the column back if needed using `column_to_rownames("id")`. Treat rownames as a return-trip artifact, not as durable state inside a pipeline.
