---
title: "purrr keep() in R: Filter List Elements by Predicate"
slug: purrr-keep-in-R
description: "Learn purrr keep() in R to filter a list, vector, or data frame by a predicate. Covers keep_at(), discard(), syntax, examples, and common pitfalls to avoid."
keywords: "purrr keep, keep function R, purrr keep examples, R keep list elements, filter list by predicate R, purrr keep discard, keep_at R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "keep()|purrr keep|purrr::keep()|discard()|keep_at()"
auto_link_case_sensitive: true
target_keyword: purrr keep
sibling_block_enabled: true
difficulty: Beginner
---

# purrr keep() in R: Filter List Elements by Predicate

<p class="lead">The purrr keep() function filters a list, vector, or data frame, returning only the elements for which a predicate returns TRUE. It is the tidyverse way to subset a collection by a condition.</p>

[QUICK ANSWER]
keep(x, is.numeric)              # keep numeric elements
keep(x, \(v) v > 5)              # keep by lambda condition
keep(x, ~ .x > 5)                # keep by formula shorthand
discard(x, is.na)                # drop matching elements
keep_at(x, c("a", "b"))          # keep by name
keep_at(x, c(1, 3))              # keep by position
compact(x)                        # drop empty or NULL elements

[DECISION TREE: Is keep() the right tool?]
- filter list or vector by predicate: keep(x, is.numeric)
- drop elements instead of keeping: discard(x, is.na)
- select list items by name: keep_at(x, c("a", "b"))
- remove empty or NULL items: compact(x)
- filter data frame rows: dplyr::filter(df, x > 5)
- transform every element: map(x, ~ .x * 2)

## What purrr keep() does

**keep() is a predicate filter.** It examines each top-level element of a list or vector and returns a new collection containing only the elements for which the predicate `.p` evaluates to `TRUE`. The structure of the input is preserved: a list stays a list, an atomic vector stays a vector, and a data frame keeps its column structure.

The function ships with the purrr package, part of the tidyverse. It is the functional-programming counterpart to subsetting with a logical index, but it reads as a single declarative step and composes cleanly inside a pipe.

[KEY INSIGHT]
**keep() filters elements, not contents.** On a list it tests each item; on a data frame it tests each column. It never looks inside an element to filter rows. That distinction explains most surprises beginners hit.

## keep() syntax and arguments

**keep() takes a collection and a predicate.** The signature is `keep(.x, .p, ...)`, where `.x` is the collection to filter and `.p` is a predicate applied to every element.

- `.x`: a list, atomic vector, or data frame.
- `.p`: a predicate function. It must return a single `TRUE` or `FALSE` for each element. Pass a named function (`is.numeric`), an anonymous function (`\(x) x > 5`), or a purrr formula (`~ .x > 5`).
- `...`: extra arguments passed on to `.p`.

```r title="Load purrr and filter a vector"
library(purrr)

nums <- list(4, 11, 8, 2, 15)
keep(nums, \(x) x > 7)
#> [[1]]
#> [1] 11
#>
#> [[2]]
#> [1] 8
#>
#> [[3]]
#> [1] 15
```

The anonymous function `\(x) x > 7` is the predicate. Elements 11, 8, and 15 pass; 4 and 2 are dropped. The result is still a list.

## keep() examples by use case

**Real filtering jobs fall into a few shapes.** These four examples cover the most common ones.

### Keep elements of a given type

**Pass a type-checking function as the predicate.** Functions like `is.numeric` or `is.character` keep only elements of that type.

```r title="Keep numeric list elements"
mixed <- list(id = 1, name = "Toyota", weight = 2.6, active = TRUE)
keep(mixed, is.numeric)
#> $id
#> [1] 1
#>
#> $weight
#> [1] 2.6
```

Here `is.numeric` is passed by name. Names on the list elements carry through to the result.

### Drop non-numeric data frame columns

**A data frame is a list of columns.** Because of that, keep() applies the predicate to each column and never touches rows.

```r title="Keep numeric columns of iris"
numeric_iris <- keep(iris, is.numeric)
names(numeric_iris)
#> [1] "Sepal.Length" "Sepal.Width"  "Petal.Length" "Petal.Width"
```

The `Species` factor column is dropped and a data frame is returned, ready for `cor()` or scaling.

[TIP]
**keep(df, is.numeric) is the idiomatic column filter.** It is shorter and clearer than `df[sapply(df, is.numeric)]` and returns a data frame, so it drops straight into a modeling pipeline.

### Filter with a purrr formula

**The `~ .x` formula is shorthand for a one-argument function.** It saves typing for short, throwaway predicates.

```r title="Filter with formula shorthand"
keep(1:10, ~ .x %% 2 == 0)
#> [1]  2  4  6  8 10
```

On an atomic vector keep() returns an atomic vector, here the even numbers.

### Combine keep() with map()

**keep() composes cleanly inside a pipe.** Chain it between `split()` and `map_dbl()` to filter groups before summarising them.

```r title="Keep groups then summarise"
mtcars |>
  split(mtcars$cyl) |>
  keep(\(g) mean(g$mpg) > 20) |>
  map_dbl(\(g) mean(g$mpg))
#>        4
#> 26.66364
```

Only the 4-cylinder group has a mean mpg above 20, so just that group survives the keep() step.

## keep() vs discard, Filter, and dplyr filter

**keep() has close cousins, and choosing wrong is a common mistake.** `discard()` is the exact inverse, dropping elements where the predicate is `TRUE`. Base R's `Filter()` does the same job as keep() but with the arguments reversed. And `dplyr::filter()` is unrelated despite the similar name: it filters rows of a data frame, not elements of a list.

| Function | Operates on | Action | Use when |
|---|---|---|---|
| `keep()` | list, vector, data frame | keeps where predicate TRUE | filtering elements by a condition |
| `discard()` | list, vector, data frame | drops where predicate TRUE | you want the complement of keep() |
| `Filter()` | list, vector | keeps where predicate TRUE | you cannot add a purrr dependency |
| `dplyr::filter()` | data frame | keeps matching rows | filtering observations, not columns |
| `compact()` | list | drops empty elements | removing NULL or zero-length items |

```r title="discard is the inverse of keep"
nums <- list(4, 11, 8, 2, 15)
discard(nums, \(x) x > 7)
#> [[1]]
#> [1] 4
#>
#> [[2]]
#> [1] 2
```

Use keep() when the elements you want are easier to describe than the ones you want gone; use discard() otherwise.

[NOTE]
**keep_at() and discard_at() select by name or position.** Added in purrr 1.0.0, `keep_at(x, c("a", "b"))` keeps elements by name and `keep_at(x, c(1, 3))` keeps by index, with no predicate needed.

## Common pitfalls

**Most keep() errors trace back to the predicate.** Three mistakes account for nearly all of them.

The predicate must return one `TRUE` or `FALSE` per element. If an element is itself a vector, a naive comparison returns a vector and keep() errors.

```r title="Predicate returns a vector and fails"
vals <- list(c(1, 2), c(3, 4))
keep(vals, \(x) x > 2)
#> Error in `keep()`:
#> ! `.p()` must return a single `TRUE` or `FALSE`, not a logical vector.
```

Wrap the comparison in `any()` or `all()` to collapse it to a scalar.

```r title="Collapse the predicate with any"
keep(vals, \(x) any(x > 2))
#> [[1]]
#> [1] 3 4
```

The second pitfall is expecting keep() to filter data frame rows. It filters columns; for rows, reach for `dplyr::filter()`. The third is passing a transformation instead of a predicate: `keep(x, \(v) v * 2)` keeps elements where `v * 2` is truthy, which is rarely what you want.

[WARNING]
**A predicate that returns NA is treated as FALSE.** If your data has missing values, `keep(x, \(v) v > 5)` silently drops `NA` elements. Guard with `!is.na(v) & v > 5` when that is not intended.

## Try it yourself

**Try it:** Use keep() to retain the numbers from 1 to 20 that are divisible by 3. Save the result to ex_kept.

```r title="Your turn: filter multiples of 3"
# Try it: keep multiples of 3
ex_kept <- # your code here

ex_kept
#> Expected: 3 6 9 12 15 18
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_kept <- keep(1:20, \(x) x %% 3 == 0)
ex_kept
#> [1]  3  6  9 12 15 18
```

**Explanation:** The predicate `\(x) x %% 3 == 0` is TRUE when x divides evenly by 3. keep() returns those six values as an atomic vector.

</details>

## Related purrr functions

**keep() is one of several purrr filtering tools.** Reach for these when keep() is not the exact fit.

- `discard()`: the inverse, drops elements where the predicate is TRUE.
- `keep_at()` and `discard_at()`: select elements by name or position.
- `compact()`: a shortcut for discarding empty or NULL elements.
- `map()` and `map_dbl()`: transform every element instead of filtering.
- `detect()`: return the first element matching a predicate.

See the [official purrr keep() reference](https://purrr.tidyverse.org/reference/keep.html) for the full argument list.

## FAQ

**What is the difference between keep() and discard() in purrr?**
keep() and discard() are mirror images. keep() returns the elements for which the predicate is TRUE, while discard() returns the elements for which it is FALSE. Running both on the same input with the same predicate partitions the collection into two non-overlapping pieces. Choose whichever makes the predicate simpler to express: if the elements you want are easier to describe, use keep(); if the unwanted ones are, use discard().

**Can keep() be used on a data frame?**
Yes. A data frame is a list of columns, so keep() applies the predicate to each column and returns a data frame with the columns that pass. `keep(iris, is.numeric)` drops the Species factor and returns the four numeric columns. It does not filter rows; for row filtering use dplyr::filter() instead.

**How is keep() different from dplyr filter()?**
Despite the similar purpose, they work on different axes. keep() filters the elements of a list or the columns of a data frame. dplyr::filter() filters the rows of a data frame based on a condition involving its columns. keep() takes a predicate applied to whole elements; filter() takes logical expressions evaluated row by row.

**Does keep() work on atomic vectors?**
Yes. keep() accepts atomic vectors and returns an atomic vector of the same type. `keep(1:10, ~ .x > 5)` returns the integer vector `6 7 8 9 10`. The predicate is applied to each element in turn, and the surviving elements are recombined into a vector rather than a list.

**Why does keep() error with "must return a single TRUE or FALSE"?**
The predicate produced a result longer than length one for some element. This happens when an element is itself a vector and the predicate compares it element by element. Collapse the comparison to a scalar with `any()` or `all()`, for example `keep(x, \(v) all(v > 0))`.
