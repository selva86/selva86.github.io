---
title: "purrr list_rbind() in R: Row-Bind a List of Data Frames"
slug: purrr-list_rbind-in-R
description: "Learn purrr list_rbind() in R to row-bind a list of data frames into one. Examples cover names_to, map(), mismatched columns, and a bind_rows comparison."
keywords: "purrr list_rbind, list_rbind function R, purrr list_rbind examples, R combine list of data frames, list_rbind vs map_dfr, bind list of dataframes R, list_rbind names_to"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "list_rbind()|purrr list_rbind|purrr::list_rbind()|combine a list of data frames|list_rbind in R"
auto_link_case_sensitive: true
target_keyword: "purrr list_rbind"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr list_rbind() in R: Row-Bind a List of Data Frames

<p class="lead">purrr <code>list_rbind()</code> row-binds a list of data frames into a single data frame, stacking each element top to bottom. It is the modern, type-safe building block behind the purrr 1.0 replacement for <code>map_dfr()</code>.</p>

[QUICK ANSWER]
list_rbind(dfs)                          # row-bind a list of data frames
list_rbind(dfs, names_to = "source")     # keep list names in a column
map(x, f) |> list_rbind()                # apply f, then stack the results
list_rbind(list(df1, NULL, df2))         # NULL elements are skipped
split(df, df$g) |> map(fn) |> list_rbind()  # split then recombine
list_cbind(dfs)                          # column-bind a list instead

[DECISION TREE: Is list_rbind() the right tool?]
- stack data frames row-wise: list_rbind(dfs)
- stack frames side by side: list_cbind(dfs)
- combine a list of vectors: list_c(vecs)
- flatten one level of nesting: list_flatten(x)
- row-bind two frames directly: bind_rows(df1, df2)
- apply a function then stack: map(x, f) |> list_rbind()

## What list_rbind() does

**list_rbind() stacks a list of data frames into one.** It takes a single list whose elements are data frames and binds them row-wise into one combined data frame. Columns are matched by name, so the input frames can carry their columns in any order. The function is built on `vctrs::vec_rbind()` and arrived with purrr 1.0.0 in late 2022.

The job it does is the back half of split-apply-combine work. You split data into pieces, transform each piece, and `list_rbind()` reassembles the pieces into one tidy table. It also stacks frames read from many files into a single result.

## list_rbind() syntax and arguments

**The function takes one list plus two optional arguments.** Here is the full call shape.

```r title="The list_rbind function signature"
list_rbind(x, ..., names_to = NULL, ptype = NULL)
```

- `x`: a list. Every element must be a data frame or `NULL`. Any `NULL` element is silently dropped before binding.
- `...`: reserved for future extensions and must stay empty. Passing anything here raises an error.
- `names_to`: optional string. When supplied, the names of `x` are saved into a new column with that name. The default discards the names.
- `ptype`: optional prototype data frame. It forces the output column types, which is useful when you need a stable schema even if `x` is empty.

The contract is strict on purpose: `list_rbind()` only ever accepts a list of data frames, never loose frames passed as separate arguments. That single-list rule is what makes it compose cleanly after `map()`.

[NOTE]
**list_rbind() needs purrr 1.0.0 or newer.** If `list_rbind` is not found, your purrr is pre-1.0. Run `install.packages("purrr")` to update. The function also has a column-binding twin, `list_cbind()`, and a vector version, `list_c()`.

## list_rbind() examples

**Each example feeds list_rbind() a list and gets one frame back.** Start with two small quarterly tables collected in a named list.

```r title="Row-bind a list of data frames"
library(purrr)

q1 <- data.frame(month = c("Jan", "Feb"), sales = c(100, 120))
q2 <- data.frame(month = c("Mar", "Apr"), sales = c(140, 130))

quarters <- list(q1 = q1, q2 = q2)
list_rbind(quarters)
#>   month sales
#> 1   Jan   100
#> 2   Feb   120
#> 3   Mar   140
#> 4   Apr   130
```

The result has four rows and the list names are gone. To keep track of which rows came from which element, pass `names_to` and the names become a real column.

```r title="Keep list names with names_to"
list_rbind(quarters, names_to = "quarter")
#>   quarter month sales
#> 1      q1   Jan   100
#> 2      q1   Feb   120
#> 3      q2   Mar   140
#> 4      q2   Apr   130
```

The most common use is after `map()`. Split `mtcars` by cylinder count, pick the most efficient car in each group, and `list_rbind()` stacks the three one-row results.

```r title="Combine results from map"
top_by_cyl <- split(mtcars, mtcars$cyl) |>
  map(\(df) head(df[order(-df$mpg), c("mpg", "hp")], 1)) |>
  list_rbind(names_to = "cyl")

top_by_cyl
#>   cyl  mpg  hp
#> 1   4 33.9  65
#> 2   6 21.4 110
#> 3   8 19.2 175
```

When the input frames do not share the same columns, `list_rbind()` keeps every column and fills the gaps with `NA` rather than failing.

```r title="Handle data frames with different columns"
df_a <- data.frame(id = 1, x = 10)
df_b <- data.frame(id = 2, y = 99)

list_rbind(list(df_a, df_b))
#>   id  x  y
#> 1  1 10 NA
#> 2  2 NA 99
```

[KEY INSIGHT]
**list_rbind() is map_dfr() with the seam exposed.** The old `map_dfr()` welded iteration and row-binding into one call. purrr 1.0 split them back apart so each step is visible: `map()` does the work, `list_rbind()` does the combine. Seeing the two stages separately makes pipelines easier to debug.

## list_rbind() vs other row-binding tools

**Pick the binder that matches what you already hold.** `list_rbind()` is purpose-built for a list, while `bind_rows()` is more flexible and `do.call(rbind, ...)` is pure base R.

| Approach | Input | Needs a package | Notes |
|---|---|---|---|
| `list_rbind(x)` | one list of data frames | purrr | pairs with `map()`, has `names_to` |
| `bind_rows(...)` | frames or a list | dplyr | flexible, uses `.id` for names |
| `do.call(rbind, x)` | one list of data frames | base R | no NA-fill for new columns |
| `map_dfr(x, f)` | a vector to map over | purrr + dplyr | superseded, avoid in new code |

The decision rule is short. If you have a list and want it stacked, reach for `list_rbind()`; it is the natural end of a `map()` pipeline and drops the dplyr dependency. Use `dplyr::bind_rows()` when you have loose frames as separate arguments or want its `.id` shortcut. Keep `do.call(rbind, ...)` for base-only scripts, but remember it errors when columns differ instead of filling `NA`.

## Common pitfalls

**Most list_rbind() errors come from what is inside the list.** Three mistakes cover almost all of them.

The first is putting a non-data-frame element in the list. `list_rbind()` accepts only data frames and `NULL`, so a stray vector stops the call.

```r title="A non data frame element errors"
list_rbind(list(df_a, c(1, 2, 3)))
#> Error in `list_rbind()`:
#> ! Each element of `x` must be a data frame or `NULL`.
```

The fix is to make sure every element is a data frame, or use `list_c()` if you actually meant to combine vectors. The second mistake is passing frames as separate arguments, as in `list_rbind(df_a, df_b)`. That fails because the extra frame lands in the reserved `...`. Wrap them in `list()` first. The third is forgetting `names_to`, which silently drops the list names and leaves an output table you cannot trace back to its source.

[WARNING]
**Do not reach for map_dfr() in new code.** `map_dfr()` is superseded as of purrr 1.0.0. It still runs, but the recommended pattern is `map(x, f) |> list_rbind()`. The newer form removes the hard dplyr dependency and keeps the mapping and binding steps separate.

## Try it yourself

**Try it:** Split `airquality` by `Month`, take the first 2 rows of each month with `head()`, and row-bind them back with `list_rbind()`, keeping the month label in a column called `month`. Save the result to `ex_air`.

```r title="Your turn: row-bind by month"
# Try it: split, take 2 rows each, recombine
ex_air <- # your code here

ex_air
#> Expected: 10 rows, with a 'month' label column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_air <- split(airquality, airquality$Month) |>
  map(\(df) head(df, 2)) |>
  list_rbind(names_to = "month")
nrow(ex_air)
#> [1] 10
```

**Explanation:** `split()` makes a named list of monthly data frames, `map()` trims each to two rows, and `list_rbind(names_to = "month")` stacks the five pieces into a 10-row frame while saving each list name into the `month` column.

</details>

## Related purrr functions

These functions sit next to `list_rbind()` in everyday purrr work:

- `list_cbind()`: column-binds a list of data frames instead of row-binding them.
- `list_c()`: combines a list of vectors into one vector, the atomic counterpart.
- `map()`: the base iterator that produces the list `list_rbind()` consumes.
- `map_dfr()`: the superseded map-and-row-bind shortcut that `list_rbind()` replaces.
- `list_flatten()`: removes one level of nesting from a list before you bind it.

For the full argument reference, see the official [purrr list-combine documentation](https://purrr.tidyverse.org/reference/list_c.html).

## FAQ

**What is the difference between list_rbind() and bind_rows()?**

Both stack data frames row-wise, but they expect different inputs. `list_rbind()` takes exactly one list of data frames and nothing else, which makes it a clean fit at the end of a `map()` pipeline. `dplyr::bind_rows()` is looser: it accepts frames passed as separate arguments or as a list. `list_rbind()` also avoids a dplyr dependency, since it runs on vctrs.

**Does list_rbind() handle data frames with different columns?**

Yes. When the input frames do not share the same columns, `list_rbind()` keeps the union of all columns and fills the missing cells with `NA`. Column matching is by name, not by position, so frames can list their columns in any order. This is the same outer-join behavior that `vctrs::vec_rbind()` provides under the hood.

**Is map_dfr() deprecated in favor of list_rbind()?**

`map_dfr()` is superseded, not deprecated. It still works and receives critical fixes, but the tidyverse now recommends `map(x, f) |> list_rbind()` for new code. The newer pattern separates the mapping step from the binding step and drops the required dplyr dependency. Existing scripts using `map_dfr()` are safe and need no urgent rewrite.

**How do I keep the names of the list in the output?**

Pass the `names_to` argument with a column name, such as `list_rbind(x, names_to = "source")`. The names of the list `x` are then written into a new column called `source`, with one value per row identifying which element it came from. Without `names_to`, the list names are discarded and the output has no source column.

**What package and version do I need for list_rbind()?**

`list_rbind()` lives in the purrr package and was introduced in purrr 1.0.0, released in December 2022. If R reports that it cannot find `list_rbind`, your purrr is older than 1.0. Run `install.packages("purrr")` to update. The companion functions `list_cbind()` and `list_c()` shipped in the same release.
