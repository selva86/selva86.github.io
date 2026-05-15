---
title: "purrr none() in R: Test If No Element Matches"
slug: purrr-none-in-R
description: "Learn purrr none() in R to test whether no element of a list or vector matches a predicate. Covers syntax, every() and some(), NA handling, and pitfalls."
keywords: "purrr none, none function R, purrr none examples, R none predicate, purrr none every some, none predicate R, check no elements match R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "none()|purrr none|purrr::none()|none predicate|purrr none function"
auto_link_case_sensitive: true
target_keyword: purrr none
sibling_block_enabled: true
difficulty: Beginner
---

# purrr none() in R: Test If No Element Matches

<p class="lead">The purrr none() function tests whether no element of a list or vector matches a predicate, returning a single TRUE or FALSE. It is the tidyverse way to ask "are none of these a problem?" in one call.</p>

[QUICK ANSWER]
none(x, is.character)             # are no elements character?
none(x, \(v) v < 0)               # none match a lambda predicate
none(x, ~ .x < 0)                 # formula shorthand predicate
none(list(), is.numeric)          # TRUE (empty input, vacuous truth)
none(x, is.na)                    # are there zero missing values?
every(x, is.numeric)              # are all elements numeric?
some(x, is.numeric)               # are any elements numeric?

[DECISION TREE: Is none() the right tool?]
- confirm no element passes: none(x, is.character)
- confirm every element passes: every(x, is.numeric)
- confirm at least one passes: some(x, is.numeric)
- drop the matching elements: discard(x, is.character)
- find the first match instead: detect(x, is.character)
- test a plain logical vector: !any(x > 0)

## What purrr none() does

**none() asks whether a collection is completely free of matches.** It applies a predicate to each top-level element of a list or vector and returns `TRUE` only when the predicate fails for every one of them. The moment it meets an element that passes, it stops and returns `FALSE`, so it never tests elements past the first match.

The function ships with the purrr package, part of the tidyverse. It is the zero-match counterpart to `every()`, which asks whether all elements match, and `some()`, which asks whether at least one element matches. none() is the verb you reach for when an element passing the predicate is the bad outcome you want to rule out.

[KEY INSIGHT]
**none() states the guarantee instead of negating the failure.** Rather than writing `!any(map_lgl(x, is.na))`, you write `none(x, is.na)`. The negation moves into the function name, so the code reads as the assurance you want rather than a flipped result the reader has to decode.

## none() syntax and arguments

**none() takes a collection and a predicate.** The signature is `none(.x, .p, ...)`.

- `.x`: a list or atomic vector to test.
- `.p`: a predicate function returning a single `TRUE` or `FALSE` per element. Pass a named function (`is.na`), an anonymous function (`\(x) x < 0`), or a purrr formula (`~ .x < 0`).
- `...`: extra arguments passed on to `.p`.

```r title="Load purrr and test for no match"
library(purrr)

nums <- list(4, 11, 8, 2, 15)
none(nums, \(x) x < 0)
#> [1] TRUE
```

The predicate `\(x) x < 0` is applied to each element. No value is negative, so none() returns a single `TRUE`. The result is one scalar, not a vector of per-element answers.

## none() examples by use case

**Most none() jobs are guard checks.** These four examples cover the common shapes.

### Confirm no element is a given type

**Pass a type-checking function as the predicate.** This confirms a list is free of an unwanted value type before a numeric step.

```r title="Confirm no element is character"
none(nums, is.character)
#> [1] TRUE

mixed <- list(1, 2.5, "Toyota")
none(mixed, is.character)
#> [1] FALSE
```

The first call passes because `nums` holds only numbers. The second returns `FALSE` as soon as it reaches `"Toyota"`, without inspecting anything after it.

### Confirm a list has no missing values

**Pass `is.na` to verify a collection is complete.** This is a fast guard before a calculation that cannot tolerate `NA`.

```r title="Confirm there are no missing values"
clean <- list(3, 7, 1, 9)
none(clean, is.na)
#> [1] TRUE
```

Every element is a real value, so `is.na` is `FALSE` throughout and none() returns `TRUE`.

### Confirm a numeric bound holds nowhere

**The predicate can be any test that returns one logical value.** Here it checks that no value exceeds a ceiling.

```r title="Confirm no value exceeds a limit"
none(c(2, 4, 6, 8), \(x) x > 100)
#> [1] TRUE
```

No element is greater than 100, so the predicate is `FALSE` everywhere and none() returns `TRUE`.

### Use the formula shorthand

**purrr formulas give a compact predicate for one-liners.** Write `~` then refer to the element as `.x`.

```r title="Use formula shorthand for the predicate"
none(1:10, ~ .x < 0)
#> [1] TRUE
```

The formula `~ .x < 0` behaves like `\(x) x < 0`. Both styles are valid; the lambda form reads better once the predicate grows past a single expression.

## none() vs every(), some(), and negate()

**none() has two sibling verbs and one negation-based alternative.** `every()` asks whether all elements pass, `some()` asks whether any element passes, and `none()` is logically `every()` run on the negated predicate.

| Function | Question answered | Returns | Use when |
|---|---|---|---|
| `none()` | Do zero elements pass? | one `TRUE`/`FALSE` | a match is the bad outcome |
| `every()` | Do all elements pass? | one `TRUE`/`FALSE` | every element must match |
| `some()` | Does any element pass? | one `TRUE`/`FALSE` | one match is enough |
| `negate()` | flips a predicate | a new function | you need the opposite test |

```r title="none, every, and some compared"
v <- list(2, 4, 6, 8)
none(v, \(x) x > 100)       # nothing over 100?
#> [1] TRUE
every(v, \(x) x %% 2 == 0)  # all even?
#> [1] TRUE
some(v, \(x) x > 5)         # any over 5?
#> [1] TRUE
```

`none(x, p)` always equals `every(x, negate(p))`: "no element passes p" is the same statement as "every element fails p". Pick `none()` when that phrasing reads more naturally than a negated `every()`.

[NOTE]
**Coming from base R?** `none(x, p)` is equivalent to `!any(sapply(x, p))`. The purrr version short-circuits on the first match and skips the intermediate logical vector, so it is both faster and easier to read inside a pipeline.

## Common pitfalls

**Most none() surprises trace back to the predicate or to missing values.** Three mistakes account for nearly all of them.

The first is a predicate that returns more than one value. none() needs exactly one `TRUE` or `FALSE` per element, so a vector-valued element with a naive comparison errors.

```r title="Predicate must return one TRUE or FALSE"
vals <- list(c(1, 2), c(8, 9))
none(vals, \(x) x < 0)
#> Error in `none()`:
#> ! `.p()` must return a single `TRUE` or `FALSE`, not a logical vector.
```

Wrap the comparison in `any()` or `all()` so each element collapses to one logical value.

```r title="Collapse the predicate with any"
none(vals, \(x) any(x < 0))
#> [1] TRUE
```

The second pitfall is missing values. When the predicate returns `NA` for an element and no element returns `TRUE`, none() returns `NA` rather than `TRUE`.

```r title="A predicate returning NA yields NA"
has_na <- list(2, 4, NA, 8)
none(has_na, \(x) x > 100)
#> [1] NA
```

[WARNING]
**An NA result is not a pass.** Code that branches on `if (none(x, pred))` will error when none() returns `NA`. Guard the predicate with `!is.na(v) & v > 100` when missing data should count as a definite non-match rather than an unknown.

The third pitfall is the empty collection. `none()` on an empty list returns `TRUE` because there is no element that passes. This is vacuous truth, and it can hide a data problem upstream.

```r title="An empty collection returns TRUE"
none(list(), \(x) x > 0)
#> [1] TRUE
```

If an empty input should be treated as a failure, check `length(x) > 0` before calling none().

## Try it yourself

**Try it:** Use none() to test whether none of the numbers from 2 to 20 are negative. Save the result to ex_none.

```r title="Your turn: test for no match"
# Try it: are none of the values negative?
ex_none <- # your code here

ex_none
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_none <- none(2:20, \(x) x < 0)
ex_none
#> [1] TRUE
```

**Explanation:** The predicate `\(x) x < 0` is FALSE for every integer from 2 to 20, so none() returns a single `TRUE`. If any value matched, none() would stop at it and return `FALSE`.

</details>

## Related purrr functions

**none() is one of several purrr predicate tools.** Reach for these when none() is not the exact fit.

- `every()`: tests whether all elements pass the predicate.
- `some()`: tests whether at least one element passes the predicate.
- `discard()` and `keep()`: return the non-matching or matching elements instead of a logical.
- `detect()` and `detect_index()`: return the first matching element or its position.
- `map_lgl()`: returns the full vector of per-element `TRUE`/`FALSE` answers.

See the [official purrr none() reference](https://purrr.tidyverse.org/reference/every.html) for the full argument list.

## FAQ

**What does none() return if the list is empty?**
none() returns `TRUE` for an empty list or vector. This is vacuous truth: there is no element that passes the predicate, so the "zero matches" condition holds trivially. The behaviour mirrors `!any(logical(0))`. If an empty input should count as a failure in your code, test `length(x) > 0` before calling none() and handle the empty case explicitly.

**What is the difference between none() and every()?**
Both reduce a collection to one logical value, but they ask opposite-leaning questions. every() returns `TRUE` when all elements pass the predicate. none() returns `TRUE` when zero elements pass it. They are linked by negation: `none(x, p)` always equals `every(x, negate(p))`. Choose the verb whose phrasing matches the requirement you are checking so the code reads like its intent.

**How does none() handle NA values?**
If the predicate returns `NA` for an element and no element returns `TRUE`, none() returns `NA` rather than `TRUE`. If any element returns `TRUE`, none() returns `FALSE` even when `NA` values are present, because a single match already settles the answer. Guard the predicate with `!is.na(v)` when missing data should be treated as a definite non-match.

**Is none() the same as !some()?**
For a clean `TRUE`/`FALSE` result they agree: `none(x, p)` returns the logical opposite of `some(x, p)`. The difference shows up with missing values, where both can return `NA`, and in readability. `none(x, is.na)` states the guarantee directly, while `!some(x, is.na)` makes the reader mentally flip a result. Prefer none() when the absence of a match is what you want to assert.

**Can none() be used on a data frame?**
Yes. A data frame is a list of columns, so none() applies the predicate to each column and returns one logical value. `none(iris, is.list)` returns `TRUE` because no column is a list column. none() never inspects individual rows; use `dplyr::filter()` for row-level conditions.
