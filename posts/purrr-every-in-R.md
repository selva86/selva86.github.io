---
title: "purrr every() in R: Test If All Elements Pass"
slug: purrr-every-in-R
description: "Learn purrr every() in R to test whether all elements of a list or vector pass a predicate. Covers syntax, some() and none(), NA handling, and pitfalls."
keywords: "purrr every, every function R, purrr every examples, R check all elements, purrr every some none, every predicate R, purrr all elements pass"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "every()|purrr every|purrr::every()|every predicate|purrr every function"
auto_link_case_sensitive: true
target_keyword: purrr every
sibling_block_enabled: true
difficulty: Beginner
---

# purrr every() in R: Test If All Elements Pass

<p class="lead">The purrr every() function tests whether every element of a list or vector satisfies a predicate, returning a single TRUE or FALSE. It is the tidyverse way to ask "do all of these pass?" in one call.</p>

[QUICK ANSWER]
every(x, is.numeric)              # are all elements numeric?
every(x, \(v) v > 0)              # all match a lambda predicate
every(x, ~ .x > 0)                # formula shorthand predicate
every(list(), is.numeric)         # TRUE (empty input, vacuous truth)
every(x, \(v) !is.na(v))          # are all elements non-missing?
some(x, is.numeric)               # are any elements numeric?
none(x, is.numeric)               # are no elements numeric?

[DECISION TREE: Is every() the right tool?]
- test that all elements pass: every(x, is.numeric)
- test that any element passes: some(x, is.numeric)
- test that no element passes: none(x, is.numeric)
- keep only the matching elements: keep(x, is.numeric)
- find the first matching element: detect(x, is.numeric)
- test a plain logical vector: all(x > 0)

## What purrr every() does

**every() reduces a whole collection to one TRUE or FALSE.** It applies a predicate to each top-level element of a list or vector and returns `TRUE` only when the predicate holds for all of them. As soon as it meets an element that fails, it stops and returns `FALSE`, so it never tests elements past the first failure.

The function ships with the purrr package, part of the tidyverse. It is the all-pass counterpart to `some()`, which asks whether at least one element matches, and `none()`, which asks whether zero elements match. Together the three cover every yes/no question you can ask about a collection.

[KEY INSIGHT]
**every() is `all()` with a predicate built in.** Base R's `all()` needs a logical vector you already computed. every() takes the raw collection plus a test function and does the per-element work for you, which is why it reads cleanly inside a tidyverse pipeline.

## every() syntax and arguments

**every() takes a collection and a predicate.** The signature is `every(.x, .p, ...)`.

- `.x`: a list or atomic vector to test.
- `.p`: a predicate function returning a single `TRUE` or `FALSE` per element. Pass a named function (`is.numeric`), an anonymous function (`\(x) x > 0`), or a purrr formula (`~ .x > 0`).
- `...`: extra arguments passed on to `.p`.

```r title="Load purrr and test all elements"
library(purrr)

nums <- list(4, 11, 8, 2, 15)
every(nums, \(x) x > 0)
#> [1] TRUE
```

The predicate `\(x) x > 0` is applied to each element. Every value is positive, so every() returns a single `TRUE`. The result is one scalar, not a vector of per-element answers.

## every() examples by use case

**Most every() jobs fall into a few shapes.** These four examples cover the common ones.

### Check every element is a given type

**Pass a type-checking function as the predicate.** Functions like `is.numeric` or `is.character` confirm a list holds only one kind of value.

```r title="Check every element is numeric"
every(nums, is.numeric)
#> [1] TRUE

mixed <- list(1, 2.5, "Toyota")
every(mixed, is.numeric)
#> [1] FALSE
```

The first call passes because `nums` is all numbers. The second returns `FALSE` the moment it reaches `"Toyota"`, without inspecting anything after it.

### Validate every column of a data frame

**A data frame is a list of columns, so every() tests columns.** This is a quick guard before a numeric model or summary.

```r title="Check every column of a data frame"
every(mtcars, is.numeric)
#> [1] TRUE

every(iris, is.numeric)
#> [1] FALSE
```

`mtcars` is fully numeric, so the check passes. `iris` includes the `Species` factor column, so every() returns `FALSE`.

### Test a numeric condition on every element

**The predicate can be any test that returns one logical value.** Here it checks that all values are even.

```r title="Test a numeric condition"
every(c(2, 4, 6, 8), \(x) x %% 2 == 0)
#> [1] TRUE
```

Each value divides evenly by 2, so the predicate is `TRUE` everywhere and every() returns `TRUE`.

### Use the formula shorthand

**purrr formulas give a compact predicate for one-liners.** Write `~` then refer to the element as `.x`.

```r title="Use formula shorthand for the predicate"
every(1:10, ~ .x > 0)
#> [1] TRUE
```

The formula `~ .x > 0` behaves like `\(x) x > 0`. Both styles are valid; the lambda form is clearer when the predicate grows past a single expression.

## every() vs some(), none(), and all()

**every() has three close relatives, and picking the wrong one is a common mistake.** `some()` asks whether any element passes, `none()` asks whether none pass, and base R's `all()` works on a logical vector you already built rather than a raw collection.

| Function | Question answered | Returns | Use when |
|---|---|---|---|
| `every()` | Do all elements pass? | one `TRUE`/`FALSE` | you need every element to match |
| `some()` | Does any element pass? | one `TRUE`/`FALSE` | one match is enough |
| `none()` | Do zero elements pass? | one `TRUE`/`FALSE` | you need to confirm absence |
| `all()` | Are all values `TRUE`? | one `TRUE`/`FALSE` | you already have a logical vector |

```r title="every, some, and none compared"
v <- list(2, 4, 6, 8)
every(v, \(x) x %% 2 == 0)   # all even?
#> [1] TRUE
some(v, \(x) x > 5)          # any over 5?
#> [1] TRUE
none(v, \(x) x > 100)        # none over 100?
#> [1] TRUE
```

All three read like plain English, which is the point: reach for the verb that matches the question instead of hand-rolling a loop.

[NOTE]
**Coming from base R?** `every(x, p)` is equivalent to `all(sapply(x, p))`, and `some(x, p)` is `any(sapply(x, p))`. The purrr versions short-circuit and skip the intermediate vector, so they are both faster and easier to read in a pipeline.

## Common pitfalls

**Most every() surprises trace back to the predicate or to missing values.** Three mistakes account for nearly all of them.

The first is a predicate that returns more than one value. every() needs exactly one `TRUE` or `FALSE` per element, so a vector-valued element with a naive comparison errors.

```r title="Predicate must return one TRUE or FALSE"
vals <- list(c(1, 2), c(8, 9))
every(vals, \(x) x > 0)
#> Error in `every()`:
#> ! `.p()` must return a single `TRUE` or `FALSE`, not a logical vector.
```

Wrap the comparison in `all()` so each element collapses to one logical value.

```r title="Collapse the predicate with all"
every(vals, \(x) all(x > 0))
#> [1] TRUE
```

The second pitfall is missing values. When the predicate returns `NA` for an element and no element returns `FALSE`, every() returns `NA` rather than `TRUE`, exactly as `all()` does.

```r title="A predicate returning NA yields NA"
has_na <- list(2, 4, NA, 8)
every(has_na, \(x) x > 0)
#> [1] NA
```

[WARNING]
**An NA result is not a pass.** Code that branches on `if (every(x, pred))` will error when every() returns `NA`. Guard the predicate with `!is.na(v) & v > 0` when missing data should count as a failure rather than an unknown.

The third pitfall is the empty collection. `every()` on an empty list returns `TRUE` because there is no element that fails. This is vacuous truth, and it can mask a data problem upstream.

```r title="An empty collection returns TRUE"
every(list(), \(x) x > 100)
#> [1] TRUE
```

If an empty input should be treated as a failure, check `length(x) > 0` before calling every().

## Try it yourself

**Try it:** Use every() to test whether all numbers from 2 to 20 are greater than 1. Save the result to ex_all.

```r title="Your turn: test all elements"
# Try it: are all values greater than 1?
ex_all <- # your code here

ex_all
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_all <- every(2:20, \(x) x > 1)
ex_all
#> [1] TRUE
```

**Explanation:** The predicate `\(x) x > 1` is TRUE for every integer from 2 to 20, so every() returns a single `TRUE`. If any value failed, every() would stop at it and return `FALSE`.

</details>

## Related purrr functions

**every() is one of several purrr predicate tools.** Reach for these when every() is not the exact fit.

- `some()`: tests whether at least one element passes the predicate.
- `none()`: tests whether zero elements pass the predicate.
- `keep()` and `discard()`: return the matching or non-matching elements instead of a logical.
- `detect()` and `detect_index()`: return the first matching element or its position.
- `map_lgl()`: returns the full vector of per-element `TRUE`/`FALSE` answers.

See the [official purrr every() reference](https://purrr.tidyverse.org/reference/every.html) for the full argument list.

## FAQ

**What does every() return if the list is empty?**
every() returns `TRUE` for an empty list or vector. This is vacuous truth: there is no element that fails the predicate, so the "all pass" condition holds trivially. The behaviour matches base R's `all(logical(0))`. If an empty input should count as a failure in your code, test `length(x) > 0` before calling every() and handle the empty case explicitly.

**What is the difference between every() and all() in R?**
`all()` takes a logical vector that you have already computed and returns `TRUE` if every value is `TRUE`. every() takes a raw list or vector plus a predicate function, applies the predicate to each element, and then performs the same all-`TRUE` test. In short, `every(x, p)` is `all(sapply(x, p))` written in one short, pipe-friendly call that also short-circuits on the first failure.

**How does every() handle NA values?**
If the predicate returns `NA` for an element and no other element returns `FALSE`, every() returns `NA` rather than `TRUE`. This mirrors `all()`. If any element returns `FALSE`, every() returns `FALSE` even when `NA` values are present, because a single failure already settles the answer. Guard the predicate with `!is.na(v)` when missing data should be treated as a definite failure.

**What is the difference between every(), some(), and none()?**
All three reduce a collection to one logical value, but they ask different questions. every() returns `TRUE` only when all elements pass the predicate. some() returns `TRUE` when at least one element passes. none() returns `TRUE` when no element passes. Pick the verb that matches your question so the code reads like the requirement it checks.

**Can every() be used on a data frame?**
Yes. A data frame is a list of columns, so every() applies the predicate to each column and returns one logical value. `every(mtcars, is.numeric)` returns `TRUE` because all columns are numeric, while `every(iris, is.numeric)` returns `FALSE` because of the `Species` factor. every() never inspects individual rows; use `dplyr::filter()` for row-level conditions.
