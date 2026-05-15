---
title: "purrr detect_index() in R: Find First Match Position"
slug: purrr-detect_index-in-R
description: "Learn purrr detect_index() in R to find the position of the first list or vector element matching a predicate. Covers .dir, the no-match case, and pitfalls."
keywords: "purrr detect_index, detect_index function R, purrr detect_index examples, R find index of first match, detect_index vs detect, purrr find position"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "detect_index()|purrr detect_index|purrr::detect_index()|find index of first match|position of first match"
auto_link_case_sensitive: true
target_keyword: purrr detect_index
sibling_block_enabled: true
difficulty: Beginner
---

# purrr detect_index() in R: Find First Match Position

<p class="lead">The purrr detect_index() function searches a list or vector and returns the integer position of the first element for which a predicate is TRUE. It returns 0 when nothing matches.</p>

[QUICK ANSWER]
detect_index(x, is.character)            # position of first character element
detect_index(x, \(v) v > 5)              # first element matching a lambda
detect_index(x, ~ .x > 5)                # formula shorthand predicate
detect_index(x, pred, .dir = "backward") # search from the end
detect_index(x, pred) == 0L              # TRUE when no element matches
x[[detect_index(x, pred)]]               # grab the matching element
detect(x, pred)                          # the value instead of the position

[DECISION TREE: Is detect_index() the right tool?]
- find the position of the first match: detect_index(x, is.numeric)
- find the matching element itself: detect(x, is.numeric)
- get every matching position: which(map_lgl(x, pred))
- match an exact value, not a predicate: match(value, x)
- test if any element matches at all: some(x, is.numeric)
- find a data frame row index: which(df$x > 5)[1]

## What purrr detect_index() does

**detect_index() reports where the first match sits, not what it is.** It walks the top-level elements of a list or vector in order, applies a predicate to each one, and stops at the first element where the predicate returns `TRUE`. The return value is that element's integer position. When no element matches, detect_index() returns `0`, never `NULL` or `NA`.

The function ships with the purrr package, part of the tidyverse. It is the position-returning partner of `detect()`, which returns the matching value instead. Both short-circuit, so neither examines elements after the first hit.

[KEY INSIGHT]
**detect_index() returns a position; detect() returns a value.** Once you hold the index you can slice, replace, or inspect the collection at that exact spot, something the value alone cannot give you.

## detect_index() syntax and arguments

**detect_index() takes a collection, a predicate, and a search direction.** The signature is `detect_index(.x, .f, ..., .dir = c("forward", "backward"))`.

- `.x`: a list or atomic vector to search.
- `.f`: a predicate function returning a single `TRUE` or `FALSE` per element. Pass a named function (`is.numeric`), an anonymous function (`\(x) x > 5`), or a purrr formula (`~ .x > 5`).
- `.dir`: `"forward"` (the default) searches from the first element; `"backward"` searches from the last.
- `...`: extra arguments passed on to `.f`.

Unlike `detect()`, detect_index() has no `.default` argument. The no-match result is always the integer `0`, which is a deliberate sentinel because `0` is never a valid R index.

```r title="Load purrr and find first index"
library(purrr)

nums <- list(4, 11, 8, 2, 15)
detect_index(nums, \(x) x > 7)
#> [1] 2
```

The predicate `\(x) x > 7` is tested element by element. Element `4` fails, `11` passes, so detect_index() stops and returns `2`, the position of `11`.

## detect_index() examples by use case

**Most detect_index() jobs fall into a few shapes.** These four examples cover the common ones.

### Find the position of the first element of a type

**Pass a type-checking function as the predicate.** Functions like `is.character` or `is.numeric` locate the first element of that type.

```r title="Find first character element index"
mixed <- list(1, 2.5, "Toyota", TRUE, "Honda")
detect_index(mixed, is.character)
#> [1] 3
```

The first two elements are numeric, so detect_index() skips them and returns `3`, the position of `"Toyota"`. It never reaches `"Honda"`.

### Search from the end with .dir

**Set `.dir = "backward"` to find the last match.** detect_index() then walks elements in reverse and returns the position of the first hit it meets.

```r title="Search from the end with .dir"
detect_index(1:10, \(x) x %% 3 == 0, .dir = "backward")
#> [1] 9
```

The multiples of 3 sit at positions 3, 6, and 9. A forward search returns `3`; the backward search returns `9`, the last matching position.

### Handle the no-match case

**detect_index() returns `0` when nothing matches.** Because `0` is not a valid index in R, it doubles as a clear "not found" flag.

```r title="No match returns zero"
detect_index(1:5, \(x) x > 100)
#> [1] 0
```

No element exceeds 100, so the result is `0`. Test the result with `== 0` or `> 0` before using it to subset anything.

[TIP]
**Branch on the result before indexing.** Wrap the lookup in a guard such as `idx <- detect_index(x, pred); if (idx > 0) x[[idx]]`. This keeps a no-match `0` from reaching `[[ ]]` and crashing the pipeline.

### Use the index to slice the collection

**The index is most useful when you feed it straight back into the collection.** Combine detect_index() with `[[` to read or replace the matching element.

```r title="Use the index to slice"
idx <- detect_index(nums, \(x) x > 7)
nums[[idx]]
#> [1] 11
```

detect_index() found position `2`, and `nums[[2]]` returns the value `11`. This two-step pattern is what `detect()` does internally.

## detect_index() vs detect, which, and match

**detect_index() has close relatives, and picking the wrong one is a common mistake.** `detect()` returns the matching value rather than its position. Base R's `which()` returns every matching position, not just the first. `match()` finds the position of an exact value rather than a predicate match.

| Function | Returns | Stops at first match | Use when |
|---|---|---|---|
| `detect_index()` | position of first match (0 if none) | yes | you need where the first match sits |
| `detect()` | the matching element (NULL if none) | yes | you need the matching value itself |
| `which()` | every matching position | no | you need all positions, not one |
| `match()` | position of an exact value | yes | you compare against a literal, not a predicate |
| `Position()` | position of first match (NULL if none) | yes | you cannot add a purrr dependency |

```r title="which returns every matching position"
nums_v <- c(4, 11, 8, 2, 15)
which(nums_v > 7)
#> [1] 2 3 5
```

`which()` returns all three positions above 7; detect_index() returned only `2`, the first. Reach for detect_index() when one position is enough and scanning the rest is wasted work.

[NOTE]
**Position() is the base R equivalent.** `Position(\(x) x > 7, nums)` gives the same answer as `detect_index(nums, \(x) x > 7)`. The argument order is flipped and `Position()` returns `NULL` instead of `0` for no match, so detect_index() reads more cleanly inside a tidyverse pipeline.

## Common pitfalls

**Most detect_index() surprises trace back to the `0` return or the predicate.** Three mistakes account for nearly all of them.

The first is treating `0` as a usable index. R subsetting with `x[[0]]` throws an error, and `x[0]` silently returns an empty result. Always check `idx > 0` before indexing.

The second pitfall is a predicate that returns more than one value. detect_index() needs exactly one `TRUE` or `FALSE` per element, so a vector-valued element with a naive comparison errors.

```r title="Predicate must return one TRUE or FALSE"
vals <- list(c(1, 2), c(8, 9))
detect_index(vals, \(x) x > 5)
#> Error in `detect_index()`:
#> ! `.p()` must return a single `TRUE` or `FALSE`, not a logical vector.
```

Wrap the comparison in `any()` or `all()` to collapse it to a scalar.

```r title="Collapse the predicate with any"
detect_index(vals, \(x) any(x > 5))
#> [1] 2
```

[WARNING]
**A predicate that returns NA is treated as FALSE.** If your data has missing values, `detect_index(x, \(v) v > 5)` skips `NA` elements rather than matching them. Guard with `!is.na(v) & v > 5` when an `NA` element should still count.

The third pitfall is expecting every matching position. detect_index() stops at the first hit by design. When you need all positions, use `which()` over a logical vector instead.

## Try it yourself

**Try it:** Use detect_index() to find the position of the first number from 1 to 30 that is divisible by 7. Save the result to ex_idx.

```r title="Your turn: find first multiple of 7"
# Try it: position of the first multiple of 7
ex_idx <- # your code here

ex_idx
#> Expected: 7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_idx <- detect_index(1:30, \(x) x %% 7 == 0)
ex_idx
#> [1] 7
```

**Explanation:** The predicate `\(x) x %% 7 == 0` is TRUE when x divides evenly by 7. In the vector `1:30` the value `7` sits at position 7, so detect_index() stops there and returns `7` without scanning 14, 21, or 28.

</details>

## Related purrr functions

**detect_index() is one of several purrr search tools.** Reach for these when detect_index() is not the exact fit.

- `detect()`: returns the first matching element instead of its position.
- `keep()` and `discard()`: return every matching or non-matching element.
- `some()`, `every()`, and `none()`: test whether any, all, or no elements match.
- `head_while()`: returns the leading run of elements that all match.
- `map_lgl()`: builds the logical vector that `which()` needs for all-position lookups.

See the [official purrr detect_index() reference](https://purrr.tidyverse.org/reference/detect.html) for the full argument list.

## FAQ

**What does detect_index() return if nothing matches?**
detect_index() returns the integer `0` when no element satisfies the predicate. Unlike `detect()`, it has no `.default` argument, because `0` is already a safe sentinel: it is never a valid index in R. Test the result with `== 0` or `> 0` before passing it to `[[ ]]`, since subsetting with `0` either errors or returns an empty value.

**What is the difference between detect() and detect_index() in purrr?**
detect() returns the first element for which the predicate is TRUE, while detect_index() returns that element's integer position. They accept the same arguments and search in the same order. detect_index() returns `0` for no match, whereas detect() returns `NULL`. Use detect() when you want the value and detect_index() when you need to slice, replace, or inspect the collection at the matching spot.

**How do I find the last matching index with detect_index()?**
Set the `.dir` argument to `"backward"`. detect_index() then walks the elements in reverse and returns the position of the first match it meets, which is the last match in normal order. For example, `detect_index(1:10, \(x) x %% 3 == 0, .dir = "backward")` returns `9` rather than `3`.

**How is detect_index() different from which() in R?**
`which()` returns every position where a logical vector is TRUE, while detect_index() returns only the first matching position and stops there. detect_index() also takes a predicate function directly, so you do not build the logical vector yourself. Use `which(map_lgl(x, pred))` when you genuinely need all positions, and detect_index() when one is enough.

**Can detect_index() be used on a data frame?**
Yes, because a data frame is a list of columns. detect_index() applies the predicate to each column and returns the position of the first column that matches. `detect_index(iris, is.numeric)` returns `1`, the index of `Sepal.Length`. detect_index() never inspects rows; to find a row index that meets a condition, use `which(df$col > value)[1]`.
