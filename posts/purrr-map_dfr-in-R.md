---
title: "purrr map_dfr() in R: Map and Row-Bind to Data Frames"
slug: purrr-map_dfr-in-R
description: "purrr map_dfr() applies a function to each element and row-binds the results into one data frame. Learn its syntax, the .id key, map2_dfr, and list_rbind."
keywords: "purrr map_dfr, map_dfr function R, purrr map_dfr examples, R map_dfr data frame, map_dfr vs map, map_dfr .id, map2_dfr"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "map_dfr()|purrr map_dfr|purrr::map_dfr()|row-bind data frames|map_dfr in R"
auto_link_case_sensitive: true
target_keyword: "purrr map_dfr"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr map_dfr() in R: Map and Row-Bind to Data Frames

<p class="lead">purrr <code>map_dfr()</code> applies a function to each element of a list or vector and row-binds the results into a single data frame. The "r" stands for rows, so each call's output is stacked on top of the previous one.</p>

[QUICK ANSWER]
map_dfr(x, f)                    # row-bind f(x) outputs
map_dfr(x, f, .id = "key")       # add a column of source keys
map2_dfr(x, y, f)                # two inputs, then row-bind
imap_dfr(x, f)                   # use name/index as the 2nd arg
pmap_dfr(list(a, b), f)          # many inputs, then row-bind
map(x, f) |> list_rbind()        # purrr 1.0 replacement

[DECISION TREE: Is map_dfr() the right tool?]
- stack row-wise data frames: map_dfr(x, f)
- combine column-wise instead: map_dfc(x, f)
- modern purrr 1.0 row-bind: map(x, f) |> list_rbind()
- keep results as a plain list: map(x, f)
- collapse to a numeric vector: map_dbl(x, f)
- run for side effects only: walk(x, f)

## What map_dfr() does in one sentence

**map_dfr() maps and row-binds in one step.** It iterates over `.x`, calls `.f` on each element, and passes every result to `dplyr::bind_rows()`. The function expects each `.f` output to be a data frame or a named vector. The final return value is one combined data frame with as many rows as all the pieces put together.

This makes `map_dfr()` the natural tool for split-apply-combine work: split data into groups, compute a per-group summary, and reassemble the summaries into a tidy table. It also shines when reading many files, where each file produces a data frame that you want stacked.

[NOTE]
**map_dfr() was superseded in purrr 1.0.0.** It still works and is not deprecated, but the tidyverse team now recommends `map()` followed by `list_rbind()`. The reasoning: the `_dfr` suffix wrongly suggests a length-1 constraint like `map_dbl()`, and it forces a hard dependency on dplyr. Existing code is safe to keep.

## Syntax

**The signature is small but the arguments matter.** Here is the full call shape:

```r title="map_dfr function signature"
map_dfr(.x, .f, ..., .id = NULL)
```

- `.x`: a list or atomic vector to iterate over.
- `.f`: a function, formula (`~ .x + 1`), or a string/integer for element extraction. Its output must be a data frame or named vector.
- `...`: extra arguments passed on to every call of `.f`.
- `.id`: optional string. When `.x` is named, it adds a column of that name holding each element's name; useful for tracking which group a row came from.

Load purrr and prepare a grouped list to map over. Splitting `mtcars` by cylinder count gives a named list of three data frames.

```r title="Load purrr and split data"
library(purrr)
library(dplyr)

cyl_groups <- split(mtcars, mtcars$cyl)
length(cyl_groups)
#> [1] 3
```

## Worked examples

**Each example returns a data frame from .f and lets map_dfr() stack them.** Start with a one-row-per-group summary.

```r title="Row-bind a summary per group"
map_dfr(cyl_groups, function(df) {
  data.frame(n = nrow(df), mean_mpg = round(mean(df$mpg), 1))
})
#>    n mean_mpg
#> 1 11     26.7
#> 2  7     19.7
#> 3 14     15.1
```

The result has three rows, one per cylinder group. But you lost track of which row is which cylinder. The `.id` argument fixes that by promoting the list names to a column.

```r title="Keep the source key with .id"
map_dfr(cyl_groups, function(df) {
  data.frame(n = nrow(df), mean_mpg = round(mean(df$mpg), 1))
}, .id = "cyl")
#>   cyl  n mean_mpg
#> 1   4 11     26.7
#> 2   6  7     19.7
#> 3   8 14     15.1
```

[TIP]
**Always set .id when .x is named.** Without it, the source key disappears and you cannot tell which group each row describes. The `.id` column is the cheapest insurance against an ambiguous output table.

Each `.f` call can return more than one row. Here every group contributes a min and a max row, so the six pieces stack into a six-row frame.

```r title="Return multiple rows per group"
map_dfr(cyl_groups, function(df) {
  data.frame(stat = c("min", "max"),
             mpg  = c(min(df$mpg), max(df$mpg)))
}, .id = "cyl")
#>   cyl stat  mpg
#> 1   4  min 21.4
#> 2   4  max 33.9
#> 3   6  min 17.8
#> 4   6  max 21.4
#> 5   8  min 10.4
#> 6   8  max 19.2
```

When the function needs two inputs that vary together, use `map2_dfr()`. It walks two vectors in parallel and row-binds the results.

```r title="Map over two inputs with map2_dfr"
sizes <- c(small = 3, large = 8)
map2_dfr(sizes, names(sizes), function(n, label) {
  data.frame(label = label, total = sum(seq_len(n)))
})
#>   label total
#> 1 small     6
#> 2 large    36
```

## map_dfr() vs list_rbind() and map_dfc()

**Pick the binder that matches your data shape.** `map_dfr()` stacks rows, `map_dfc()` stacks columns, and `list_rbind()` is the modern row-stacking replacement.

| Approach | Binds | Needs dplyr | Status |
|---|---|---|---|
| `map_dfr(x, f)` | rows | yes | superseded |
| `map_dfc(x, f)` | columns | yes | superseded |
| `map(x, f) \|> list_rbind()` | rows | no | recommended |
| `map(x, f) \|> list_cbind()` | columns | no | recommended |

The decision rule is simple. If every `.f` call produces a slice of the same table and you want them stacked vertically, you need row-binding: either `map_dfr()` or the newer `list_rbind()`. If each call produces a new column for the same rows, use `map_dfc()` or `list_cbind()`. The modern pair drops the dplyr dependency and keeps the iteration step (`map()`) separate from the combining step.

```r title="The purrr 1.0 replacement for map_dfr"
cyl_groups |>
  map(function(df) data.frame(n = nrow(df))) |>
  list_rbind(names_to = "cyl")
#>   cyl  n
#> 1   4 11
#> 2   6  7
#> 3   8 14
```

[KEY INSIGHT]
**Think of map_dfr() as map() plus a stack.** The `_dfr` suffix is just `map()` with `bind_rows()` welded onto the end. Once you see it that way, `list_rbind()` is the same idea with the weld removed, which is why the tidyverse split them back apart in purrr 1.0.

## Common pitfalls

**Most map_dfr() errors trace back to what .f returns.** Three mistakes account for nearly all of them.

The first is returning something that is not a data frame. If `.f` returns a bare numeric vector, `bind_rows()` cannot stack it cleanly. Wrap scalar results in `data.frame()` so each call produces a proper one-row frame.

```r title="Pitfall: returning a bare value"
# Fails or warns: bind_rows() cannot stack unnamed scalars
map_dfr(cyl_groups, function(df) nrow(df))

# Fix: return a one-row data frame
map_dfr(cyl_groups, function(df) data.frame(n = nrow(df)))
```

The second is inconsistent columns across calls. If one call returns columns `a, b` and another returns `a, c`, `bind_rows()` keeps all three and fills the gaps with `NA`. That is sometimes intended, but it often signals a bug in `.f`. The third is forgetting that `map_dfr()` needs dplyr installed; on a minimal setup the call fails with a missing-package error, which is another reason to prefer `list_rbind()`.

## Try it yourself

**Try it:** Use `map_dfr()` on `cyl_groups` to build a table with one row per cylinder group containing the group's `cyl` key and the maximum horsepower (`hp`). Save it to `ex_hp`.

```r title="Your turn: max hp per group"
# Try it: row-bind a max-hp summary
ex_hp <- # your code here

ex_hp
#> Expected: 3 rows, columns cyl and max_hp
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_hp <- map_dfr(cyl_groups, function(df) {
  data.frame(max_hp = max(df$hp))
}, .id = "cyl")
ex_hp
#>   cyl max_hp
#> 1   4    113
#> 2   6    175
#> 3   8    335
```

**Explanation:** Each call returns a one-row `data.frame` with the group maximum, and `.id = "cyl"` promotes the list names into a labeling column so the three rows stay identifiable.

</details>

## Related purrr functions

These functions sit next to `map_dfr()` in everyday purrr work:

- `map()`: the base iterator; returns a list instead of a data frame.
- `list_rbind()`: row-binds a list of data frames; the purrr 1.0 replacement.
- `map_dfc()`: column-binds results instead of row-binding them.
- `map2_dfr()`: iterates over two inputs in parallel, then row-binds.
- `pmap_dfr()`: iterates over many inputs from a list, then row-binds.

## FAQ

**What does the "r" in map_dfr mean?**

The "r" stands for rows. `map_dfr()` collects every result from `.f` and row-binds them, stacking each piece on top of the next. Its sibling `map_dfc()` uses a "c" for columns and binds side by side instead. Both return a single data frame, but the orientation of the combine step is the only difference between them.

**Is map_dfr() deprecated?**

No, `map_dfr()` is superseded, not deprecated. Superseded means the function still works, receives critical bug fixes, and will not be removed, but it is no longer recommended for new code. The tidyverse points new code toward `map()` plus `list_rbind()`. Existing scripts that use `map_dfr()` are safe and do not need an urgent rewrite.

**What is the difference between map_dfr() and bind_rows()?**

`bind_rows()` only combines a list of data frames you already have. `map_dfr()` does two jobs: it first applies `.f` to every element of `.x` to create those data frames, then passes them to `bind_rows()` internally. So `map_dfr(x, f)` is equivalent to `bind_rows(map(x, f))` in a single call.

**Why does map_dfr() return an error?**

The most common cause is `.f` returning something that is not a data frame or named vector, such as a bare number or an unnamed list. `bind_rows()` cannot stack those, so the call fails. Wrap scalar outputs in `data.frame()`. A missing dplyr installation also triggers an error, since `map_dfr()` depends on it.

**Can map_dfr() read multiple CSV files?**

Yes, that is one of its most common uses. Pass a vector of file paths as `.x` and `readr::read_csv` as `.f`. Each file becomes a data frame, and `map_dfr()` stacks them into one combined table. Add `.id = "file"` to record which source file each row came from.
