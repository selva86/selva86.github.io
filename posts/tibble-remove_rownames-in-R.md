---
title: "tibble remove_rownames() in R: Strip Row Names Cleanly"
slug: "tibble-remove_rownames-in-R"
description: "Strip character row names from any data frame using tibble remove_rownames() in R. Master syntax, the mtcars reset, pipeline lifts, and common pitfalls."
keywords: "tibble remove_rownames, remove_rownames function R, tibble remove_rownames examples, R remove row names, drop rownames data frame R, remove_rownames tidyverse, clear rownames tibble"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "tibble-functions"
fr_parent: "R-Data-Frames.html"
auto_link_terms: "remove_rownames()|tibble remove_rownames|tibble::remove_rownames()|strip rownames|drop rownames"
auto_link_case_sensitive: true
target_keyword: "tibble remove_rownames"
sibling_block_enabled: true
difficulty: "Beginner"
---

# tibble remove_rownames() in R: Strip Row Names Cleanly

<p class="lead">The <code>remove_rownames()</code> function in the tibble package strips character row names from a data frame and replaces them with the default integer index, returning a frame that no longer carries label metadata.</p>

[QUICK ANSWER]
remove_rownames(mtcars)                                # strip mtcars labels
mtcars |> remove_rownames()                            # pipe-friendly
df |> remove_rownames() |> as_tibble()                 # drop then convert
mtcars |> rownames_to_column("model") |> remove_rownames()  # save then drop
rownames(remove_rownames(df))                          # now "1","2","3"...
rbind(remove_rownames(a), remove_rownames(b))          # avoid dup-rowname errors
purrr::map(list_of_dfs, remove_rownames)               # clean a list of frames

[DECISION TREE: Is remove_rownames() the right tool?]
- drop rownames entirely and discard them: remove_rownames(df)
- lift rownames into a column before dropping: rownames_to_column(df, "id")
- promote a column back into rownames: column_to_rownames(df, "id")
- check whether a frame has rownames: has_rownames(df)
- convert to a tibble (also drops rownames): as_tibble(df)
- read current rownames as a character vector: rownames(df)
- count rows ignoring rownames: nrow(df)

## What remove_rownames() does in one sentence

**`remove_rownames()` returns its input frame with the row names attribute reset to the default integer index `1, 2, 3, ...` and the original character labels discarded.** It returns a copy, not a mutation. Character row names are lost unless you saved them first with `rownames_to_column()`.

The function exists because base R lacks a pipe-friendly verb for the operation. The base equivalent assigns `NULL` to `rownames(df)`, which mutates and does not compose. `remove_rownames()` returns a value, so it works with `|>` and `%>%`.

## Syntax

**`remove_rownames()` takes one argument and returns a data frame with default integer rownames.** No optional arguments and no side effects on the input.

```r title="Load tibble and strip mtcars labels"
library(tibble)
library(dplyr)

# mtcars carries car model labels as rownames
head(rownames(mtcars), 3)
#> [1] "Mazda RX4"     "Mazda RX4 Wag" "Datsun 710"

# remove_rownames replaces them with the default index
mt_plain <- remove_rownames(mtcars)
head(rownames(mt_plain), 3)
#> [1] "1" "2" "3"
```

The full signature is:

```
remove_rownames(.data)
```

Argument:

- `.data`: a data frame. Non-data-frame inputs raise an error rather than silently passing through.

The return value is always a data frame with `nrow(df)` integer row names. The class of the input is preserved: a data frame stays a data frame, a tibble stays a tibble (though tibbles already lack rownames, so the call is a no-op).

[TIP]
**Pair `rownames_to_column()` with `remove_rownames()` to save labels before dropping them.** Calling `rownames_to_column(df, "id") |> remove_rownames()` lifts the labels into a real column first, then resets the row-name attribute, so the labels survive any downstream join or rbind.

## Five common patterns

### 1. Strip mtcars labels for a clean tibble

```r title="Reset mtcars rownames"
mt_plain <- remove_rownames(mtcars)

head(mt_plain, 3)
#>    mpg cyl disp  hp drat   wt qsec vs am gear carb
#> 1 21.0   6  160 110 3.90 2.62 16.5  0  1    4    4
#> 2 21.0   6  160 110 3.90 2.88 17.0  0  1    4    4
#> 3 22.8   4  108  93 3.85 2.32 18.6  1  1    4    1
```

After `remove_rownames()`, the car model labels are gone and rows are numbered `1` through `32`. This is the form a fresh tibble or a `read_csv()` result already has, so the call is mostly used to normalise an inherited data frame before further processing. The original `mtcars` is untouched; only `mt_plain` reflects the reset.

### 2. Save labels first, then strip

```r title="Lift then drop rownames"
mt_safe <- mtcars |>
  rownames_to_column("model") |>
  remove_rownames()

head(mt_safe[, 1:4], 3)
#>           model  mpg cyl disp
#> 1     Mazda RX4 21.0   6  160
#> 2 Mazda RX4 Wag 21.0   6  160
#> 3    Datsun 710 22.8   4  108
```

`rownames_to_column("model")` writes the car names into a real column. The subsequent `remove_rownames()` then resets the row-name attribute, so the labels survive as data while the rownames attribute itself is reset. This is the safe pattern when you need the labels downstream but want predictable row indexing.

### 3. Stack two frames without a duplicate-rownames error

```r title="rbind needs unique rownames"
a <- mtcars[1:3, 1:3]
b <- mtcars[1:3, 1:3]

# Both frames share the same character rownames
# rbind(a, b) would warn: non-unique values when setting 'row.names'

a_b <- rbind(remove_rownames(a), remove_rownames(b))
nrow(a_b)
#> [1] 6
rownames(a_b)
#> [1] "1" "2" "3" "4" "5" "6"
```

Base R's `rbind()` rejects frames whose character rownames collide. Stripping rownames on both sides resets the attribute to integer indices, which `rbind()` then renumbers to `1:6`. The data is preserved; only the names are reset.

### 4. Drop rownames inside a pipeline before exporting

```r title="Clean before write_csv"
mtcars |>
  remove_rownames() |>
  head(2)
#>    mpg cyl disp  hp drat   wt qsec vs am gear carb
#> 1 21.0   6  160 110 3.90 2.62 16.5  0  1    4    4
#> 2 21.0   6  160 110 3.90 2.88 17.0  0  1    4    4
```

`readr::write_csv()` and most CSV writers ignore row names by default, but `write.csv()` writes them as an unnamed first column, which produces a stray `X` column when the file is read back. `remove_rownames()` upstream of the write step guarantees a clean round-trip whichever writer you use.

### 5. Apply across a list of frames

```r title="Strip rownames in a map"
frames <- list(mtcars[1:3, 1:2], mtcars[4:6, 1:2])

clean <- lapply(frames, remove_rownames)
rownames(clean[[1]])
#> [1] "1" "2" "3"
rownames(clean[[2]])
#> [1] "1" "2" "3"
```

Because `remove_rownames()` is a pure function returning a data frame, it drops straight into `lapply()`, `purrr::map()`, or any other functional iterator. Each frame in the list gets its own fresh integer rownames, so a subsequent `do.call(rbind, clean)` will produce a frame with rownames `1:nrow(combined)`.

## remove_rownames() vs alternatives

**Pick `remove_rownames()` when you want a pipe-friendly verb that returns a value.** Several adjacent expressions do the same job with different ergonomics.

| Behavior | `remove_rownames()` | `rownames(df) <- NULL` | `as_tibble(df)` | `as_tibble(df, rownames = "id")` |
|---|---|---|---|---|
| Source | tibble | base R | tibble | tibble |
| Side effect | None, returns copy | Mutates in place | None | None |
| Pipe-friendly | Yes | No, needs assignment | Yes | Yes |
| Keeps class | Yes (df stays df) | Yes | Converts to tibble | Converts to tibble |
| Saves labels | No, discarded | No | No, discarded | Yes, into a column |

When to use which:

- Use `remove_rownames()` when you want to reset rownames but keep the input as a base data frame.
- Use `rownames(df) <- NULL` only in code that is not part of a pipeline and you want zero dependencies.
- Use `as_tibble(df)` when conversion to a tibble is desirable; it drops rownames as a side effect.
- Use `as_tibble(df, rownames = "id")` when you want both conversion and a real labels column in one step.

[KEY INSIGHT]
**Resetting rownames is a metadata edit, not a data edit.** No values in the frame change; only the `row.names` attribute is replaced with `1:nrow(df)`. The function preserves the class vector and every other attribute (factor levels, `sf` geometry columns), so it is safe to call on enriched frames and never affects downstream computations that use column data.

## Common pitfalls

**Pitfall 1: losing labels you wanted to keep.** `remove_rownames()` discards the character rownames forever. If you need them downstream, save them first.

```r title="Wrong order loses labels"
# Wrong: labels are gone before they can be lifted
bad <- mtcars |>
  remove_rownames() |>
  rownames_to_column("model")
head(bad$model, 3)
#> [1] "1" "2" "3"

# Right: lift first, then strip
good <- mtcars |>
  rownames_to_column("model") |>
  remove_rownames()
head(good$model, 3)
#> [1] "Mazda RX4"     "Mazda RX4 Wag" "Datsun 710"
```

Order matters. `remove_rownames()` then `rownames_to_column()` writes the new integer index into the column, not the labels. Reverse the order to preserve information.

**Pitfall 2: expecting in-place modification.** `remove_rownames()` returns a copy. The original frame keeps its rownames unless you assign the result back.

```r title="Assignment is required"
remove_rownames(mtcars)        # discarded; mtcars unchanged
head(rownames(mtcars), 2)
#> [1] "Mazda RX4"     "Mazda RX4 Wag"

mtcars2 <- remove_rownames(mtcars)
head(rownames(mtcars2), 2)
#> [1] "1" "2"
```

This matches the broader tidyverse convention: functions return values and never mutate their inputs. Always capture the result with `<-` or compose it into a pipeline.

[WARNING]
**`remove_rownames()` errors on non-data-frame inputs.** Passing a matrix, list, or vector raises `Error: Can't access columns that don't exist`. Wrap with `as.data.frame()` first, or check `is.data.frame()` before the call.

**Pitfall 3: calling it on a tibble.** Tibbles never carry rownames, so the call is a no-op but still costs a function call.

```r title="Tibbles already lack rownames"
tb <- as_tibble(mtcars)
tb2 <- remove_rownames(tb)
identical(tb, tb2)
#> [1] TRUE
```

If your frame is already a tibble, skip `remove_rownames()`. Use `has_rownames(df)` as a guard if the input type varies.

## Try it yourself

**Try it:** Strip the rownames from `USArrests`, but save them first into a column called `state`. Then filter to states with `Murder > 10` and confirm the result has no rownames. Save the final filtered data frame to `ex_arrests`.

```r title="Your turn: save then strip"
library(tibble)
library(dplyr)
# Try it: build ex_arrests
ex_arrests <- # your code here

rownames(ex_arrests)
#> Expected: "1" "2" "3" "4" "5"
ncol(ex_arrests)
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_arrests <- USArrests |>
  rownames_to_column("state") |>
  remove_rownames() |>
  filter(Murder > 10)

rownames(ex_arrests)
#> [1] "1" "2" "3" "4" "5"
ncol(ex_arrests)
#> [1] 5
head(ex_arrests$state, 5)
#> [1] "Alabama"        "Florida"        "Georgia"
#> [4] "Mississippi"    "South Carolina"
```

**Explanation:** `rownames_to_column("state")` saves the state names as a real column before `remove_rownames()` resets the row-name attribute to integers. The subsequent `filter()` then narrows to high-murder states; the labels survive as data in the `state` column.

</details>

## Related tibble functions

Alongside `remove_rownames()`, look at:

- `rownames_to_column()`: lift row names into a new column before dropping them.
- `column_to_rownames()`: the inverse, promoting a column back into row names.
- `has_rownames()`: predicate for whether a frame carries non-trivial labels.
- `rowid_to_column()`: add a fresh integer id column without touching rownames.
- `as_tibble(rownames = "id")`: convert to a tibble while preserving labels in a column.
- `tibble::tibble()`: the constructor that returns a frame without rownames by default.

For the official reference, see the [tibble rownames documentation](https://tibble.tidyverse.org/reference/rownames.html).

## FAQ

**How do I remove row names from a data frame in R?**

Call `tibble::remove_rownames(df)`. It returns a copy of the data frame with the character row names replaced by the default integer index `1, 2, 3, ...`. Capture the result with `<-` because the function does not mutate in place. The base R equivalent is `rownames(df) <- NULL`, which mutates the frame but is not pipe-friendly. Use `remove_rownames()` inside tidyverse pipelines and the base assignment in short scripts that do not need composition.

**Does remove_rownames() delete the data or just the labels?**

Only the labels. The function rewrites the `row.names` attribute to `seq_len(nrow(df))` and leaves every column value untouched. Row count, column count, column types, and stored values are all identical between the input and the output. Think of it as a metadata edit, not a data edit, so it is cheap to call and never affects downstream computations.

**What is the difference between remove_rownames() and as_tibble()?**

Both drop row names, but they differ in class. `remove_rownames(df)` keeps the input as a base data frame and only resets rownames. `as_tibble(df)` converts to a tibble, which also drops rownames but additionally changes printing, subsetting, and stricter handling of column types. Choose `remove_rownames()` when you need the result to remain a data frame; choose `as_tibble()` when conversion is the goal and rownames removal is a free side effect.

**Why does remove_rownames() leave my tibble unchanged?**

Tibbles never carry rownames in the first place. The tibble design stores every observation identifier as a regular column, so the row-name attribute is always the default integer index. Calling `remove_rownames()` on a tibble is a no-op: the function returns an identical object. Use `has_rownames(df)` as a guard if you only want to call `remove_rownames()` when there is actually something to strip.

**How do I save row names before calling remove_rownames()?**

Pipe through `rownames_to_column("name")` first. The full pattern is `df |> rownames_to_column("name") |> remove_rownames()`, which lifts the character labels into a new column before the row-name attribute is reset. Order matters: reversing the calls writes the new integer index into the column instead of the labels.
