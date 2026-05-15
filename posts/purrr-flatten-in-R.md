---
title: "purrr flatten() in R: Flatten Nested Lists"
slug: purrr-flatten-in-R
description: "purrr flatten() in R removes one level of list nesting. Learn flatten_dbl, flatten_chr, and the modern list_flatten and list_c replacements with examples."
keywords: "purrr flatten, flatten function R, purrr flatten examples, R flatten list, flatten nested list R, list_flatten R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "flatten()|purrr flatten|purrr::flatten()|list_flatten()|flatten_dbl()"
auto_link_case_sensitive: true
target_keyword: "purrr flatten"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr flatten() in R: Flatten Nested Lists

<p class="lead">purrr flatten() in R removes exactly one level of nesting from a list, turning a list of lists into a flatter list. The typed variants flatten_dbl(), flatten_chr(), and flatten_int() return atomic vectors instead.</p>

[QUICK ANSWER]
flatten(x)               # remove one nesting level (legacy)
list_flatten(x)          # modern replacement, returns a list
flatten_dbl(x)           # flatten to a double vector
flatten_chr(x)           # flatten to a character vector
list_c(x)                # concatenate elements into a vector
flatten_dfr(x)           # row-bind into a data frame (legacy)

[DECISION TREE: Is flatten() the right tool?]
- remove one nesting level: list_flatten(x)
- concatenate into a vector: list_c(x)
- stack a list of data frames: list_rbind(x)
- bind a list of columns: list_cbind(x)
- drop NULL elements: compact(x)
- pull a deeply nested value: pluck(x, 1, 2)

## What purrr flatten() does

**flatten() collapses one layer of list hierarchy.** Given a list whose elements are themselves lists, it returns a single list containing all the inner elements. It does not touch deeper levels, so a triple-nested list becomes double-nested, not flat.

The function comes from the purrr package, the tidyverse toolkit for [functional programming](Functional-Programming-in-R.html). It is the list-shaping companion to the `map()` family, which often produces nested output that needs one level removed.

```r title="Load purrr and flatten a list"
library(purrr)

nested <- list(list(1, 2), list(3, 4))
flatten(nested)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 2
#>
#> [[3]]
#> [1] 3
#>
#> [[4]]
#> [1] 4
```

The outer list had two elements; each was a two-element list. After `flatten()`, the result is a flat list of four scalars.

## flatten() syntax and typed variants

**flatten() takes a single argument and has one job.** The signature is `flatten(.x)`, where `.x` is the list to un-nest by one level. There are no other parameters. The variety comes from the typed family, which coerces the flattened result into an atomic vector or data frame.

| Variant | Returns | Use when |
|---|---|---|
| `flatten()` | list | Inner elements have mixed shapes |
| `flatten_lgl()` | logical vector | Inner elements are TRUE/FALSE |
| `flatten_int()` | integer vector | Inner elements are integers |
| `flatten_dbl()` | double vector | Inner elements are numbers |
| `flatten_chr()` | character vector | Inner elements are strings |
| `flatten_dfr()` / `flatten_dfc()` | data frame | Inner elements are rows or columns |

```r title="Typed flatten variants"
scores <- list(c(90, 85), c(78, 92))
flatten_dbl(scores)
#> [1] 90 85 78 92

words <- list("a", "b", "c")
flatten_chr(words)
#> [1] "a" "b" "c"
```

[NOTE]
**flatten() is superseded as of purrr 1.0.0.** The package now recommends `list_flatten()`, `list_c()`, `list_rbind()`, and `list_cbind()`. The old functions still work, so existing code will not break, but new code should prefer the `list_*` family.

## Flatten examples by use case

**The most common use of flatten() is cleaning up map() output.** When a mapped function returns a list per element, the result is a list of lists. One `flatten()` call gives you a flat list you can iterate over again.

```r title="Flatten the output of map"
result <- map(1:3, ~ list(.x, .x^2))
flatten(result)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 1
#>
#> [[3]]
#> [1] 2
#>
#> [[4]]
#> [1] 4
#>
#> [[5]]
#> [1] 3
#>
#> [[6]]
#> [1] 9
```

A second frequent case is removing exactly one layer from a deeply nested structure while leaving the rest intact.

```r title="flatten removes only one level"
deep <- list(list(list(1, 2)), list(list(3)))
flatten(deep)
#> [[1]]
#> [[1]][[1]]
#> [1] 1
#>
#> [[1]][[2]]
#> [1] 2
#>
#>
#> [[2]]
#> [[2]][[1]]
#> [1] 3
```

The result is still nested one level deep. `flatten()` peeled off the outermost layer only, which is exactly the behavior that separates it from `unlist()`.

## flatten() vs list_flatten() and list_c()

**Pick the function that matches the shape you want back.** `flatten()` and `list_flatten()` both return a list and remove one level. `list_c()` concatenates into a vector. Base R `unlist()` flattens recursively all the way down.

| Function | Returns | Recursive? | Notes |
|---|---|---|---|
| `flatten()` | list | No | Superseded in purrr 1.0.0 |
| `list_flatten()` | list | No | Modern one-level replacement |
| `list_c()` | atomic vector | n/a | Concatenates inner elements |
| `unlist()` | atomic vector | Yes | Base R, flattens every level |

```r title="Modern replacement: list_flatten and list_c"
nested <- list(list(1, 2), list(3, 4))
list_flatten(nested)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 2
#>
#> [[3]]
#> [1] 3
#>
#> [[4]]
#> [1] 4

list_c(list(c(1, 2), c(3, 4)))
#> [1] 1 2 3 4
```

[TIP]
**Reach for list_c() when you want a vector, not a list.** It replaces `flatten_dbl()` and friends with a single type-stable function that picks the common type automatically and errors clearly on a real mismatch.

## Common pitfalls

**flatten() is not recursive, so it will not fully un-nest a deep list.** This is the most frequent surprise. If you need every level removed, use `unlist()` or call `flatten()` repeatedly.

A second trap is feeding mixed types to a typed variant. `flatten_dbl()` demands every inner element coerce to a double; a stray string stops it cold.

```r title="Common flatten errors"
mixed <- list(1, "two")
flatten_dbl(mixed)
#> Error in `flatten_dbl()`:
#> ! Can't coerce element 2 from a character to a double.
```

The third pitfall is using `flatten()` on a list that has no nesting. It returns the list unchanged rather than erroring, which can silently hide a bug where you expected nested input.

## Try it yourself

**Try it:** Flatten the nested list `list(list(10, 20), list(30, 40))` into a single numeric vector and save the result to ex_flat.

```r title="Your turn: flatten to a vector"
# Try it: flatten the nested list into a numeric vector
ex_flat <- # your code here

ex_flat
#> Expected: 10 20 30 40
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_flat <- flatten_dbl(list(list(10, 20), list(30, 40)))
ex_flat
#> [1] 10 20 30 40
```

**Explanation:** `flatten_dbl()` removes one nesting level and coerces the four scalars into a double vector. `list_c(list(list(10, 20), list(30, 40)))` would also work and is the modern equivalent.

</details>

## Related purrr functions

These functions pair naturally with `flatten()` when reshaping lists:

- `list_flatten()` removes one nesting level and is the modern replacement for `flatten()`.
- `list_c()` concatenates list elements into a single atomic vector.
- `list_rbind()` stacks a list of data frames into one tall data frame.
- `compact()` drops NULL or empty elements before flattening.
- `pluck()` extracts a single deeply nested value by position or name.

See the [purrr list-flattening reference](https://purrr.tidyverse.org/reference/flatten.html) for the full family.

## FAQ

**What is the difference between flatten() and unlist() in R?**

`flatten()` removes exactly one level of nesting and returns a list. `unlist()` is recursive: it flattens every level and returns an atomic vector. Use `flatten()` when you want to peel one layer and keep a list structure. Use `unlist()` when you want a flat vector regardless of how deep the input goes. The typed variants like `flatten_dbl()` bridge the gap by removing one level and coercing to a vector.

**Is purrr flatten() deprecated?**

`flatten()` is superseded, not deprecated, as of purrr 1.0.0. Superseded means it still works and will not be removed, but it is no longer recommended for new code. The replacements are `list_flatten()` for list output and `list_c()`, `list_rbind()`, or `list_cbind()` for vector and data frame output. Existing scripts that call `flatten()` continue to run without warnings.

**How do I flatten a nested list in R without purrr?**

Base R offers `unlist()`, which flattens recursively, and `do.call(c, x)`, which concatenates one level. For a one-level list-to-list flatten without purrr, `do.call(c, x)` is the closest equivalent. If you only need a vector, `unlist(x)` is simplest, though it strips all nesting at once.

**Does flatten() work recursively?**

No. `flatten()` removes only the outermost level of nesting. A list nested three levels deep becomes nested two levels deep after one call. To fully flatten, call `flatten()` multiple times or use `unlist()`, which recurses through every level by default.
