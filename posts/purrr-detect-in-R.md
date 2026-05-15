---
title: "purrr detect() in R: Find the First Matching Element"
slug: purrr-detect-in-R
description: "Learn purrr detect() in R to find the first list or vector element matching a predicate. Covers detect_index(), .dir, .default, examples, and pitfalls."
keywords: "purrr detect, detect function R, purrr detect examples, R detect first match, find first element R, purrr detect_index, purrr find element"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "detect()|purrr detect|purrr::detect()|detect_index()|find first match"
auto_link_case_sensitive: true
target_keyword: purrr detect
sibling_block_enabled: true
difficulty: Beginner
---

# purrr detect() in R: Find the First Matching Element

<p class="lead">The purrr detect() function searches a list or vector and returns the first element for which a predicate is TRUE. It is the tidyverse way to find a single match instead of filtering every one.</p>

[QUICK ANSWER]
detect(x, is.character)            # first character element
detect(x, \(v) v > 5)              # first element matching a lambda
detect(x, ~ .x > 5)                # formula shorthand predicate
detect(x, pred, .dir = "backward") # search from the end
detect(x, pred, .default = NA)     # value when nothing matches
detect_index(x, pred)              # position of the first match
detect_index(x, pred) == 0L        # TRUE when no element matches

[DECISION TREE: Is detect() the right tool?]
- find the first matching element: detect(x, is.numeric)
- find the position of that element: detect_index(x, is.numeric)
- keep every matching element: keep(x, is.numeric)
- test if any element matches: some(x, is.numeric)
- test if all elements match: every(x, is.numeric)
- find a row in a data frame: dplyr::filter(df, x > 5)

## What purrr detect() does

**detect() returns the first match, not all of them.** It walks the top-level elements of a list or vector in order, applies a predicate to each one, and stops at the first element where the predicate returns `TRUE`. That element is returned as-is. If no element matches, detect() returns `NULL` by default.

The function ships with the purrr package, part of the tidyverse. It is the find-one counterpart to `keep()`, which returns every matching element. Where `keep()` filters, detect() searches and short-circuits, so it never examines elements after the first hit.

[KEY INSIGHT]
**detect() returns a value; detect_index() returns a position.** This pairing mirrors base R's distinction between an element and its index. When you need the matching element use detect(); when you need where it sits use detect_index().

## detect() syntax and arguments

**detect() takes a collection, a predicate, and a search direction.** The signature is `detect(.x, .f, ..., .dir = c("forward", "backward"), .default = NULL)`.

- `.x`: a list or atomic vector to search.
- `.f`: a predicate function returning a single `TRUE` or `FALSE` per element. Pass a named function (`is.numeric`), an anonymous function (`\(x) x > 5`), or a purrr formula (`~ .x > 5`).
- `.dir`: `"forward"` (the default) searches from the first element; `"backward"` searches from the last.
- `.default`: the value returned when no element matches. Defaults to `NULL`.
- `...`: extra arguments passed on to `.f`.

```r title="Load purrr and find first match"
library(purrr)

nums <- list(4, 11, 8, 2, 15)
detect(nums, \(x) x > 7)
#> [1] 11
```

The predicate `\(x) x > 7` is tested against each element. Element 4 fails, 11 passes, so detect() stops and returns 11. Note the result is the bare value, not a one-element list.

## detect() examples by use case

**Most detect() jobs fall into a few shapes.** These four examples cover the common ones.

### Find the first element of a type

**Pass a type-checking function as the predicate.** Functions like `is.character` or `is.numeric` find the first element of that type.

```r title="Find the first character element"
mixed <- list(1, 2.5, "Toyota", TRUE, "Honda")
detect(mixed, is.character)
#> [1] "Toyota"
```

Here `is.character` is passed by name. The first two elements are numeric, so detect() skips them and returns `"Toyota"`, ignoring `"Honda"` entirely.

### Search from the end with .dir

**Set `.dir = "backward"` to find the last match.** detect() then walks elements in reverse and returns the first hit it meets.

```r title="Search from the end with .dir"
detect(1:10, \(x) x %% 3 == 0, .dir = "backward")
#> [1] 9
```

The multiples of 3 are 3, 6, and 9. A forward search returns 3; the backward search returns 9, the last matching value.

### Return a default when nothing matches

**Use `.default` to avoid a silent `NULL`.** Supplying a fallback makes a no-match outcome explicit and pipe-safe.

```r title="Return a default when nothing matches"
detect(1:5, \(x) x > 100, .default = NA)
#> [1] NA
```

No element exceeds 100, so detect() returns the `.default` value `NA` instead of `NULL`.

[TIP]
**Always set `.default` inside a pipe.** A `NULL` from an unmatched detect() can break a downstream step that expects a scalar. A sentinel like `NA` or `-1` keeps the chain running and signals "not found" clearly.

### Get the position with detect_index()

**detect_index() returns the index of the first match.** It accepts the same arguments as detect() and returns `0` when nothing matches.

```r title="detect_index returns the position"
detect_index(nums, \(x) x > 7)
#> [1] 2
```

Element 11 sits at position 2, so detect_index() returns `2L`. Use it when you need to slice or modify the collection at that spot.

## detect() vs detect_index, keep, and Find

**detect() has close relatives, and picking the wrong one is a common mistake.** `detect_index()` returns a position rather than a value. `keep()` returns every match instead of just the first. Base R's `Find()` does the same job as detect() but with the arguments reversed and no `.dir` or `.default` support.

| Function | Returns | Stops at first match | Use when |
|---|---|---|---|
| `detect()` | the matching element | yes | you need the first matching value |
| `detect_index()` | the position (0 if none) | yes | you need where the match sits |
| `keep()` | all matching elements | no | you need every match, not one |
| `Find()` | the matching element | yes | you cannot add a purrr dependency |
| `some()` | a single `TRUE`/`FALSE` | yes | you only need to know if a match exists |

```r title="detect stops while keep collects"
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

`keep()` returns all three values above 7; detect() returned only the first, 11. Reach for detect() when one match is enough and scanning the rest is wasted work.

[NOTE]
**Find() is the base R equivalent.** `Find(\(x) x > 7, nums)` gives the same result as `detect(nums, \(x) x > 7)`. The argument order is flipped and there is no backward search, so detect() is usually the cleaner choice inside a tidyverse pipeline.

## Common pitfalls

**Most detect() surprises trace back to the predicate or the no-match case.** Three mistakes account for nearly all of them.

The first is forgetting that an unmatched detect() returns `NULL`, not `NA`. A `NULL` is easy to miss because it prints as nothing and has length zero.

```r title="No match returns NULL silently"
result <- detect(1:5, \(x) x > 100)
is.null(result)
#> [1] TRUE
```

The fix is to pass `.default` so the outcome is an explicit sentinel value.

The second pitfall is a predicate that returns more than one value. detect() needs exactly one `TRUE` or `FALSE` per element, so a vector-valued element with a naive comparison errors.

```r title="Predicate must return one TRUE or FALSE"
vals <- list(c(1, 2), c(8, 9))
detect(vals, \(x) x > 5)
#> Error in `detect()`:
#> ! `.p()` must return a single `TRUE` or `FALSE`, not a logical vector.
```

Wrap the comparison in `any()` or `all()` to collapse it to a scalar.

```r title="Collapse the predicate with any"
detect(vals, \(x) any(x > 5))
#> [1] 8 9
```

[WARNING]
**A predicate that returns NA is treated as FALSE.** If your data has missing values, `detect(x, \(v) v > 5)` skips `NA` elements rather than matching them. Guard with `!is.na(v) & v > 5` when an `NA` element should still be considered.

The third pitfall is using detect() when you wanted the index. detect() gives you the value; if you then call `which()` or `match()` on it you are doing detect_index()'s job by hand.

## Try it yourself

**Try it:** Use detect() to find the first number from 1 to 30 that is divisible by 7. Save the result to ex_found.

```r title="Your turn: find first multiple of 7"
# Try it: find the first multiple of 7
ex_found <- # your code here

ex_found
#> Expected: 7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_found <- detect(1:30, \(x) x %% 7 == 0)
ex_found
#> [1] 7
```

**Explanation:** The predicate `\(x) x %% 7 == 0` is TRUE when x divides evenly by 7. detect() stops at the first such value, 7, and returns it without scanning 14, 21, or 28.

</details>

## Related purrr functions

**detect() is one of several purrr search tools.** Reach for these when detect() is not the exact fit.

- `detect_index()`: returns the position of the first match instead of the value.
- `keep()` and `discard()`: return every matching or non-matching element.
- `some()`, `every()`, and `none()`: test whether any, all, or no elements match.
- `head_while()`: returns the leading run of elements that all match.
- `map()` and `map_dbl()`: transform every element rather than searching.

See the [official purrr detect() reference](https://purrr.tidyverse.org/reference/detect.html) for the full argument list.

## FAQ

**What does detect() return if nothing matches?**
By default detect() returns `NULL` when no element satisfies the predicate. `NULL` has length zero and prints as nothing, so an unmatched result is easy to overlook. Pass the `.default` argument to return an explicit sentinel instead, for example `detect(x, pred, .default = NA)`. Inside a pipe, a sentinel value keeps downstream steps from failing on an unexpected `NULL`.

**What is the difference between detect() and detect_index() in purrr?**
detect() returns the first element for which the predicate is TRUE, while detect_index() returns that element's integer position. They accept the same arguments and search in the same order. detect_index() returns `0` when no element matches, whereas detect() returns `NULL`. Use detect() when you want the value and detect_index() when you need to slice or update the collection at the matching spot.

**How do I find the last matching element with detect()?**
Set the `.dir` argument to `"backward"`. detect() then walks the elements in reverse and returns the first match it meets, which is the last match in normal order. For example, `detect(1:10, \(x) x %% 3 == 0, .dir = "backward")` returns `9` rather than `3`. The same `.dir` option works on detect_index() to get the last matching position.

**Can detect() be used on a data frame?**
Yes, because a data frame is a list of columns. detect() applies the predicate to each column and returns the first column that matches, as a vector. `detect(iris, is.numeric)` returns the `Sepal.Length` column. detect() never inspects rows; to find a row that meets a condition, use `dplyr::filter()` and take the first result.

**How is purrr detect() different from base R Find()?**
Both return the first element matching a predicate, but the argument order differs. `Find()` takes the function first, as `Find(predicate, x)`, while detect() takes the collection first, as `detect(x, predicate)`. detect() also supports `.dir` for backward search and `.default` for a custom no-match value, neither of which `Find()` offers. detect() reads more naturally inside a tidyverse pipe.
