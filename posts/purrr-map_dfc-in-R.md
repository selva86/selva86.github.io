---
title: "purrr map_dfc() in R: Combine List Results Into Columns"
slug: purrr-map_dfc-in-R
description: "purrr map_dfc() applies a function to each element and column-binds the results into one data frame. Learn its syntax, map2_dfc, pitfalls, and list_cbind."
keywords: "purrr map_dfc, map_dfc function R, purrr map_dfc examples, R map_dfc columns, map_dfc vs map_dfr, map_dfc bind columns, map2_dfc"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "map_dfc()|purrr map_dfc|purrr::map_dfc()|column-bind data frames|map_dfc in R"
auto_link_case_sensitive: true
target_keyword: "purrr map_dfc"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr map_dfc() in R: Combine List Results Into Columns

<p class="lead">purrr <code>map_dfc()</code> applies a function to each element of a list or vector and column-binds the results into a single data frame. The "c" stands for columns, so each call's output is placed side by side with the previous one.</p>

[QUICK ANSWER]
map_dfc(x, f)                    # column-bind f(x) outputs
map2_dfc(x, y, f)                # two inputs, then column-bind
imap_dfc(x, f)                   # use name/index as the 2nd arg
pmap_dfc(list(a, b), f)          # many inputs, then column-bind
map(x, f) |> list_cbind()        # purrr 1.0 replacement
map_dfr(x, f)                    # row-bind instead of column-bind

[DECISION TREE: Is map_dfc() the right tool?]
- combine results column-wise: map_dfc(x, f)
- stack results row-wise instead: map_dfr(x, f)
- modern purrr 1.0 column-bind: map(x, f) |> list_cbind()
- keep results as a plain list: map(x, f)
- collapse to a numeric vector: map_dbl(x, f)
- run for side effects only: walk(x, f)

## What map_dfc() does in one sentence

**map_dfc() maps and column-binds in one step.** It iterates over `.x`, calls `.f` on each element, and passes every result to `dplyr::bind_cols()`. The function expects each `.f` output to be a data frame or a named vector. The final return value is one combined data frame with all the pieces placed next to each other as columns.

This makes `map_dfc()` the natural tool for feature building: take a set of inputs, derive one new column from each, and assemble the columns into a tidy table. It pairs every column to the same set of rows, so every result must share the same row count.

[NOTE]
**map_dfc() was superseded in purrr 1.0.0.** It still works and is not deprecated, but the tidyverse team now recommends `map()` followed by `list_cbind()`. The reasoning: the `_dfc` suffix wrongly suggests a length constraint like `map_dbl()`, and it forces a hard dependency on dplyr. Existing code is safe to keep.

## Syntax

**The signature is small, and notably has no .id argument.** Here is the full call shape:

```r title="map_dfc function signature"
map_dfc(.x, .f, ...)
```

- `.x`: a list or atomic vector to iterate over.
- `.f`: a function, formula (`~ .x + 1`), or a string/integer for element extraction. Its output must be a data frame or named vector.
- `...`: extra arguments passed on to every call of `.f`.

Unlike `map_dfr()`, there is no `.id` parameter, because column-binding has nowhere sensible to put a key column. Load purrr and pick a few numeric columns to map over.

```r title="Load purrr and pick columns"
library(purrr)
library(dplyr)

num_cols <- mtcars[c("mpg", "hp", "wt")]
ncol(num_cols)
#> [1] 3
```

## Worked examples

**Each example returns a column from .f and lets map_dfc() place them side by side.** Start by standardizing several columns at once. Mapping over a data frame iterates its columns, and the named input list carries those names straight to the output.

```r title="Column-bind a z-score per input"
scaled <- map_dfc(num_cols, ~ round((.x - mean(.x)) / sd(.x), 2))
head(scaled, 3)
#>     mpg    hp    wt
#> 1  0.15 -0.54 -0.61
#> 2  0.15 -0.54 -0.35
#> 3  0.45 -0.78 -0.92
```

The result keeps three columns named `mpg`, `hp`, and `wt`, one standardized column per input. When `.x` is unnamed, `bind_cols()` has no names to use and invents them instead.

```r title="Unnamed input forces invented names"
map_dfc(1:3, ~ data.frame(v = .x))
#>   v...1 v...2 v...3
#> 1     1     2     3
```

Every call returned a column named `v`, so `bind_cols()` appended `...1`, `...2`, and `...3` to keep names unique. To get clean names, build them yourself inside `.f`.

```r title="Set explicit column names in .f"
powers <- map_dfc(1:3, function(p) {
  setNames(data.frame(mtcars$mpg[1:5] ^ p), paste0("mpg_p", p))
})
powers
#>   mpg_p1 mpg_p2    mpg_p3
#> 1   21.0 441.00  9261.000
#> 2   21.0 441.00  9261.000
#> 3   22.8 519.84 11852.352
#> 4   21.4 457.96  9800.344
#> 5   18.7 349.69  6539.203
```

When two inputs vary together, use `map2_dfc()`. It walks two vectors in parallel and column-binds the results, taking output names from the first argument.

```r title="Map over two inputs with map2_dfc"
map2_dfc(num_cols[c("mpg", "hp")], c(10, 0.1), ~ head(.x * .y, 3))
#>   mpg   hp
#> 1 210 11.0
#> 2 210 11.0
#> 3 228  9.3
```

## map_dfc() vs map_dfr() and list_cbind()

**Pick the binder that matches your data shape.** `map_dfc()` stacks columns, `map_dfr()` stacks rows, and `list_cbind()` is the modern column-stacking replacement.

| Approach | Binds | Needs dplyr | Status |
|---|---|---|---|
| `map_dfc(x, f)` | columns | yes | superseded |
| `map_dfr(x, f)` | rows | yes | superseded |
| `map(x, f) \|> list_cbind()` | columns | no | recommended |
| `map(x, f) \|> list_rbind()` | rows | no | recommended |

The decision rule is simple. If each `.f` call produces a new column for the same set of rows, you need column-binding: either `map_dfc()` or the newer `list_cbind()`. If every call produces a slice of the same table to be stacked vertically, use `map_dfr()` or `list_rbind()`. The modern pair drops the dplyr dependency and keeps the iteration step (`map()`) separate from the combining step.

```r title="The purrr 1.0 replacement for map_dfc"
zscore <- function(x) round((x - mean(x)) / sd(x), 2)

num_cols |>
  imap(\(col, name) setNames(data.frame(zscore(col)), name)) |>
  list_cbind() |>
  head(3)
#>     mpg    hp    wt
#> 1  0.15 -0.54 -0.61
#> 2  0.15 -0.54 -0.35
#> 3  0.45 -0.78 -0.92
```

[KEY INSIGHT]
**Think of map_dfc() as map() plus a side-by-side stack.** The `_dfc` suffix is just `map()` with `bind_cols()` welded onto the end. Once you see it that way, `list_cbind()` is the same idea with the weld removed, which is why the tidyverse split them back apart in purrr 1.0.

## Common pitfalls

**Most map_dfc() surprises trace back to row counts and names.** Three mistakes account for nearly all of them.

The first is mismatched row counts. `bind_cols()` requires every result to have the same number of rows, or exactly one row to recycle. If one call returns 32 values and another returns 5, the call fails with a length error. The second is silent name mangling: when results carry the same name, `bind_cols()` appends `...1`, `...2`, and so on rather than erroring, which leaves you with cryptic column names.

```r title="Pitfall: results of different lengths"
# Fails: bind_cols() cannot reconcile 32 rows with 5 rows
map_dfc(list(full = mtcars$mpg, part = mtcars$mpg[1:5]), ~ .x)

# Fix: make every result the same length before mapping
map_dfc(list(a = mtcars$mpg[1:5], b = mtcars$hp[1:5]), ~ .x)
```

[WARNING]
**map_dfc() has no .id argument, so you cannot label the source.** With `map_dfr()` you can add `.id = "key"` to record which element each row came from. Column-binding has no equivalent, so if you need to track sources, name the columns yourself inside `.f` with `setNames()`.

The third pitfall is forgetting that `map_dfc()` needs dplyr installed; on a minimal setup the call fails with a missing-package error. That is another reason new code prefers `list_cbind()`, which lives in purrr itself.

## Try it yourself

**Try it:** Use `map_dfc()` on `num_cols` to build a data frame where each column is its input rounded to the nearest 10. Save it to `ex_rounded` and inspect the first three rows.

```r title="Your turn: round each column"
# Try it: column-bind a rounded version of each input
ex_rounded <- # your code here

head(ex_rounded, 3)
#> Expected: 3 columns named mpg, hp, wt
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rounded <- map_dfc(num_cols, ~ round(.x, -1))
head(ex_rounded, 3)
#>   mpg  hp wt
#> 1  20 110  0
#> 2  20 110  0
#> 3  20  90  0
```

**Explanation:** Mapping over the data frame `num_cols` iterates its three columns. Each `round(.x, -1)` call returns one numeric vector, and `map_dfc()` column-binds them, carrying the input names `mpg`, `hp`, and `wt` straight through.

</details>

## Related purrr functions

These functions sit next to `map_dfc()` in everyday purrr work:

- `map()`: the base iterator; returns a list instead of a data frame.
- `list_cbind()`: column-binds a list of data frames; the purrr 1.0 replacement.
- `map_dfr()`: row-binds results instead of column-binding them.
- `map2_dfc()`: iterates over two inputs in parallel, then column-binds.
- `pmap_dfc()`: iterates over many inputs from a list, then column-binds.

## FAQ

**What does the "c" in map_dfc mean?**

The "c" stands for columns. `map_dfc()` collects every result from `.f` and column-binds them, placing each piece beside the next. Its sibling `map_dfr()` uses an "r" for rows and stacks results vertically instead. Both return a single data frame, but the orientation of the combine step is the only difference between them.

**Is map_dfc() deprecated?**

No, `map_dfc()` is superseded, not deprecated. Superseded means the function still works, receives critical bug fixes, and will not be removed, but it is no longer recommended for new code. The tidyverse points new code toward `map()` plus `list_cbind()`. Existing scripts that use `map_dfc()` are safe and do not need an urgent rewrite.

**What is the difference between map_dfc() and map_dfr()?**

Both apply `.f` to each element of `.x` and return one data frame, but they combine differently. `map_dfc()` column-binds the results, so the output gains a column per call and keeps the same row count. `map_dfr()` row-binds them, so the output gains rows per call and keeps the same columns. Use `map_dfc()` for feature building and `map_dfr()` for split-apply-combine.

**Why does map_dfc() produce columns named ...1, ...2?**

That happens when the results carry duplicate or missing names. `bind_cols()` requires unique column names, so it appends `...1`, `...2`, and so on to disambiguate. To get clean names, either pass a named list as `.x`, or build named columns inside `.f` with `setNames()` or `data.frame()`.

**Can map_dfc() bind columns of different lengths?**

No. `bind_cols()` needs every result to have the same number of rows, with one exception: a length-1 result is recycled to match the others. Any other length mismatch raises an error. Trim or pad your inputs to a common length before calling `map_dfc()`.
</content>
</invoke>
