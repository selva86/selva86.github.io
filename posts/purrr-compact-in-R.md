---
title: "purrr compact() in R: Drop NULL and Empty List Elements"
slug: purrr-compact-in-R
description: "purrr compact() in R drops NULL and empty (length-zero) elements from a list in one call. Worked examples, compact() vs discard(), common pitfalls, and FAQ."
keywords: "purrr compact, compact function R, purrr compact examples, R compact list, remove NULL from list R, drop empty list elements R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "compact()|purrr compact|purrr::compact()|remove NULL from list|drop empty list elements"
auto_link_case_sensitive: true
target_keyword: "purrr compact"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr compact() in R: Drop NULL and Empty List Elements

<p class="lead">The purrr compact() function removes NULL and empty (length-zero) elements from a list in a single call, leaving only the entries that hold real values. It is the cleanest way to tidy up the gappy lists that <code>map()</code> and lookups so often produce.</p>

[QUICK ANSWER]
compact(x)                       # drop NULL and length-0 elements
compact(list(a = 1, b = NULL))   # keeps only a
compact(map(ids, lookup_fn))     # clean NULLs after a map()
compact(x, ~ .x[.x > 0])         # drop by computed emptiness
compact(x) |> length()           # count surviving elements
discard(x, is.na)                # NA is NOT empty: use discard

[DECISION TREE: Is compact() the right tool?]
- drop NULL or empty list elements: compact(x)
- drop NA values from a vector: discard(x, is.na)
- drop elements by a TRUE/FALSE test: discard(x, \(e) e > 5)
- keep elements by a test instead: keep(x, \(e) e > 5)
- flatten one level of nesting: list_flatten(x)
- drop duplicate elements: unique(x)

## What purrr compact() does

**compact() is a list pruner.** You hand it a list, and it returns a new list with every NULL element and every length-zero element removed. Nothing else changes: surviving elements keep their names, their order, and their values. The target keyword here, purrr compact, describes exactly one job done well.

An element counts as "empty" when its length is zero. That includes `NULL`, `integer(0)`, `character(0)`, and the empty list `list()`. A scalar like `5`, a string `"hi"`, or even `NA` all have length one, so compact() keeps them.

[KEY INSIGHT]
**compact() filters on length, not on truthiness.** It asks "does this element have length zero?" and drops it if so. This is why `NA` survives compact() but a `NULL` does not: `NA` is a value of length one, while `NULL` has length zero.

## compact() syntax and arguments

**The signature has two arguments.** Only the first is required.

```r title="compact function signature"
library(purrr)

# compact(.x, .p = identity)
#   .x  a list or atomic vector
#   .p  a function applied to each element before the
#       emptiness test; defaults to identity (the element itself)
```

With the default `.p = identity`, compact() tests each element as-is. When you pass a function to `.p`, compact() applies it to every element first, then drops the element if the *result* has length zero. The original value (not the transformed one) is what stays in the output.

## compact() examples by use case

**Example 1: drop NULL elements from a named list.** This is the everyday case. NULL entries vanish, names are preserved.

```r title="Drop NULL elements from a list"
prices <- list(apple = 3, banana = NULL, cherry = 8, date = NULL)
compact(prices)
#> $apple
#> [1] 3
#>
#> $cherry
#> [1] 8
```

**Example 2: drop empty length-zero elements.** Empty vectors are removed alongside NULL, because both have length zero.

```r title="Drop empty length-zero elements"
mixed <- list(a = 1:3, b = character(0), c = "hello", d = integer(0))
compact(mixed)
#> $a
#> [1] 1 2 3
#>
#> $c
#> [1] "hello"
```

**Example 3: clean up the output of map().** A lookup that misses returns NULL, so `map()` over missing keys produces a gappy list. compact() removes the gaps.

```r title="Clean NULL results after a map call"
lookup <- list(x = 10, y = 20)
ids <- c("x", "z", "y")
vals <- map(ids, ~ lookup[[.x]])
compact(vals)
#> [[1]]
#> [1] 10
#>
#> [[2]]
#> [1] 20
```

**Example 4: drop by computed emptiness with a predicate.** Pass `.p` a function. compact() keeps an element only when applying `.p` to it yields something non-empty.

```r title="Drop elements using a predicate"
groups <- list(low = c(1, 2), mid = c(5, 6), high = c(9, 10))
compact(groups, ~ .x[.x > 7])
#> $high
#> [1]  9 10
```

Here `low` and `mid` have no values above 7, so the predicate returns an empty vector and those elements are dropped. `high` survives, and note it keeps its original value `c(9, 10)`, not the filtered `9 10`.

## compact() vs discard(): which list cleaner to use

**compact() is the specialist; discard() is the generalist.** compact() only ever asks "is this empty?" `discard()` drops elements whenever a predicate you supply returns TRUE, so it can express any rule at all.

| Function | Drops elements when... | Use it for |
|---|---|---|
| `compact(x)` | element has length zero (NULL, empty) | clearing NULLs and empty results |
| `discard(x, p)` | predicate `p` returns TRUE | any custom condition (NA, negative, too short) |
| `keep(x, p)` | predicate `p` returns FALSE | the inverse of discard() |
| `Filter(f, x)` | function `f` returns FALSE | base R, no purrr dependency |

Decision rule: if you are removing NULL or empty entries, reach for compact() because it reads clearly and needs no predicate. For anything that depends on the *value* of an element (drop NAs, drop negatives), use [discard()](purrr-discard-in-R.html) instead.

[NOTE]
**compact() is roughly `discard(x, ~ length(.x) == 0)`.** They are interchangeable for the NULL-and-empty case, but `compact(x)` states the intent in one word, which makes pipelines easier to skim.

## Common pitfalls

**Pitfall 1: expecting compact() to remove NA.** `NA` is a value of length one, so compact() keeps it. This silently leaves NAs in a list you thought was clean.

```r title="compact does not drop NA"
vals <- list(1, NA, NULL, 3)
compact(vals)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] NA
#>
#> [[3]]
#> [1] 3

# Fix: NA needs a value-based test, so use discard()
discard(vals, ~ length(.x) == 1 && is.na(.x))
```

**Pitfall 2: assuming compact() recurses into nested lists.** compact() only inspects the top level. A NULL buried inside a sub-list is left untouched.

```r title="compact is not recursive"
nested <- list(a = list(b = 1, c = NULL), d = NULL)
compact(nested)
#> $a
#> $a$b
#> [1] 1
#>
#> $a$c
#> NULL

# Fix: apply compact() at each level with map()
modify(nested, ~ if (is.list(.x)) compact(.x) else .x) |> compact()
```

**Pitfall 3: using compact() on an atomic vector.** Each scalar in an atomic vector has length one, so compact() finds nothing to drop and returns the vector unchanged. compact() is built for lists.

## Try it yourself

**Try it:** Use compact() to remove the NULL and empty elements from the list below. Save the cleaned list to `ex_clean`.

```r title="Your turn: clean a list"
ex_raw <- list(p = 1:2, q = NULL, r = "ok", s = integer(0))

# Try it: drop NULL and empty elements
ex_clean <- # your code here

ex_clean
#> Expected: 2 elements (p and r)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_raw <- list(p = 1:2, q = NULL, r = "ok", s = integer(0))
ex_clean <- compact(ex_raw)
length(ex_clean)
#> [1] 2
```

**Explanation:** `q` is NULL and `s` is `integer(0)`, both length zero, so compact() drops them. `p` and `r` hold real values and survive with their names intact.

</details>

## Related purrr functions

These functions pair naturally with compact() when reshaping or filtering lists:

- [discard()](purrr-discard-in-R.html) drops elements by any predicate you supply.
- [keep()](purrr-keep-in-R.html) keeps elements that pass a predicate, the inverse of discard().
- [map()](purrr-map-in-R.html) transforms every element and is the usual source of the NULLs that compact() cleans up.
- `list_flatten()` removes one level of nesting from a list.
- See the full [purrr reference](https://purrr.tidyverse.org/reference/keep.html) for the predicate-function family.

## FAQ

**Does purrr compact() remove NA values?**

No. compact() removes elements based on length, and `NA` has length one, so it is treated as a real value and kept. If you need to drop `NA`, use `discard(x, ~ length(.x) == 1 && is.na(.x))`, or `discard(x, is.na)` when every element is a single value. Mixing the two tools is common: run compact() first to clear NULLs, then discard() to clear NAs.

**What is the difference between compact() and discard()?**

compact() drops only NULL and length-zero elements; it takes no condition because the condition is fixed. `discard()` drops elements whenever a predicate function you pass returns TRUE, so it can express any rule. In short, `compact(x)` is a readable shorthand for `discard(x, ~ length(.x) == 0)`. Use compact() for emptiness, discard() for everything else.

**Does compact() work on data frames?**

A data frame is a list of column vectors, and compact() will treat it that way, dropping any column of length zero. In a valid data frame every column has the same length as the number of rows, so nothing is dropped and the result comes back as a plain list, not a data frame. compact() is meant for ordinary lists, not data frames.

**What does compact() return when every element is removed?**

It returns an empty list, `list()`, of length zero. compact() never returns `NULL` itself, so you can safely pipe its result into `length()`, `map()`, or another compact() call without a special case for the all-empty input.

**Is compact() recursive?**

No. compact() inspects only the top level of the list. A NULL or empty element nested inside a sub-list is left in place. To clean nested lists, apply compact() at each level, for example with `modify()` or `map()`, before compacting the outer list.
