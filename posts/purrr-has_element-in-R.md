---
title: "purrr has_element() in R: Test If a List Contains a Value"
slug: "purrr-has_element-in-R"
description: "purrr's has_element() tests if a list or vector contains a value and returns a single TRUE or FALSE. See syntax, examples, and how it differs from %in%."
keywords: "purrr has_element, has_element function R, purrr has_element examples, R check if list contains value, has_element vs %in%, test list element R, purrr membership"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "has_element()|purrr has_element|purrr::has_element()|has_element function|check list contains element"
auto_link_case_sensitive: true
target_keyword: "purrr has_element"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr has_element() in R: Test If a List Contains a Value

<p class="lead">purrr's <code>has_element()</code> tests whether a list or vector contains a specific value and returns a single <code>TRUE</code> or <code>FALSE</code>. It compares with <code>identical()</code>, so the match is exact in both value and type.</p>

[QUICK ANSWER]
has_element(list(1, 2, 3), 2)          # value in a list -> TRUE
has_element(letters, "z")              # value in a vector -> TRUE
has_element(list(1L, 2L), 2)           # type-strict: 2 is not 2L -> FALSE
has_element(list("a", "b"), "c")       # absent value -> FALSE
has_element(list(1:3, 4:6), 4:6)       # a whole vector as element -> TRUE
2 %in% c(1, 2, 3)                      # %in%: coerces types, vectorized
some(x, ~ .x > 10)                     # some(): a predicate, not equality

[DECISION TREE: Is has_element() the right tool?]
- check a list contains a value: has_element(x, val)
- test a condition holds for any element: some(x, ~ .x > 5)
- find the matching element itself: detect(x, ~ .x > 5)
- get the position of a match: detect_index(x, ~ .x > 5)
- membership test on atomic vectors: val %in% vec
- check every element passes a test: every(x, is.numeric)

## What has_element() does in one sentence

**`has_element()` answers one question: does this list contain that object?** You pass a list or atomic vector as the first argument and the value to look for as the second, and you get back a single logical. It is the purrr way to write a membership check that stays predictable on lists, where base R `%in%` can behave in surprising ways.

The function exists because lists are not vectors. A list can hold numbers, strings, other lists, even functions, all mixed together. `has_element()` walks that list element by element and asks whether any element is exactly equal to your target. That makes it a natural fit for checking configuration objects, scanning nested results, or guarding a pipeline on the presence of a flag.

## Syntax

**`has_element()` takes exactly two arguments and has no options to tune.** The signature is `has_element(.x, .y)`, where `.x` is the list or vector to search and `.y` is the value to find.

```r title="Load purrr and test a list"
library(purrr)

ingredients <- list("flour", "sugar", "eggs", "butter")

has_element(ingredients, "eggs")
#> [1] TRUE

has_element(ingredients, "milk")
#> [1] FALSE
```

The return value is always length one. That is the key difference from `%in%`, which returns one logical per element of its left-hand side. Because the result is a scalar, you can drop `has_element()` straight into an `if ()` condition without wrapping it in `any()`.

Internally, `has_element(.x, .y)` is equivalent to `some(.x, identical, .y)`. It uses `identical()` for the comparison, which means the match must agree on value, type, and attributes. There is no type coercion and no partial matching.

## Examples

**`has_element()` works on atomic vectors just as well as lists.** When the input is an atomic vector, the function compares against each scalar element in turn.

```r title="Works on vectors and nested values"
# atomic vector input
has_element(letters, "q")
#> [1] TRUE

# the element you search for can itself be a vector
batches <- list(1:3, 4:6, 7:9)
has_element(batches, 4:6)
#> [1] TRUE

# a double vector is not identical to an integer vector
has_element(batches, c(4, 5, 6))
#> [1] FALSE
```

Searching a list whose elements are themselves vectors is where `has_element()` earns its place. `4:6` is an integer vector and matches the second element exactly. `c(4, 5, 6)` looks the same but is a double vector, so `identical()` rejects it.

A common real use is guarding a workflow on a setting, or scanning many lists at once with a map function.

```r title="Guard a workflow and scan many lists"
config <- list(mode = "train", epochs = 10L, verbose = TRUE)

if (has_element(config, TRUE)) {
  print("at least one setting is enabled")
}
#> [1] "at least one setting is enabled"

# check several runs for a target value with map_lgl
runs <- list(list(1, 2, 3), list(4, 5, 6), list(7, 8, 9))
map_lgl(runs, has_element, 5)
#> [1] FALSE  TRUE FALSE
```

[TIP]
**Pair `has_element()` with `map_lgl()` to scan a list of lists.** Passing `has_element` as the function and the target as an extra argument tests every sub-list in one vectorized call, returning a clean logical vector you can index or sum.

## has_element() vs %in% vs some()

**Pick `has_element()` for exact-value checks, `%in%` for atomic membership, and `some()` for conditions.** All three answer "is something in here?", but they compare in different ways and return different shapes.

| Function | Comparison | Returns | Use when |
|---|---|---|---|
| `has_element()` | `identical()`, strict | Single `TRUE`/`FALSE` | A list might contain an exact value |
| `%in%` | coerces types, vectorized | Logical vector | Membership test on atomic vectors |
| `some()` | a custom predicate | Single `TRUE`/`FALSE` | Any element satisfies a condition |

The decision rule is simple. If you need to know whether any element meets a condition rather than equals a value, reach for `some()` and pass a predicate. If you are working with plain atomic vectors and want the speed and coercion of base R, `%in%` is fine. When the input is a list and you want a strict, scalar answer, `has_element()` is the clearest choice.

[KEY INSIGHT]
**`has_element()` is `some()` frozen to one predicate: equality.** Once you see that, the whole purrr predicate family clicks. `some()` is the general tool, `has_element()` is the equality shortcut, and `detect()` returns the matching element instead of a logical.

## Common pitfalls

**The type-strict comparison is the mistake that bites everyone.** Because `has_element()` uses `identical()`, a numeric literal will not match an integer stored in your list.

```r title="Type strictness catches silent bugs"
# 2 is a double; the list holds integers
has_element(list(1L, 2L, 3L), 2)
#> [1] FALSE

# match the type and it works
has_element(list(1L, 2L, 3L), 2L)
#> [1] TRUE

# %in% coerces types, so it returns TRUE either way
2 %in% c(1L, 2L, 3L)
#> [1] TRUE
```

[WARNING]
**`has_element()` does not coerce types, but `%in%` does.** If a check that should pass returns `FALSE`, suspect a double-versus-integer mismatch. Print `str()` of both values, or convert the target with `as.integer()` before searching.

Two other traps are worth knowing. First, `has_element()` does not recurse into nested lists; an element buried two levels deep is invisible unless you flatten the list first. Second, the argument order is `(.x, .y)`, list first and target second, which is the opposite of the `value %in% collection` order, so a swapped call fails quietly.

## Try it yourself

**Try it:** Use `has_element()` to check whether the list `pantry` contains the string `"yeast"`. Save the result to `ex_has_yeast`.

```r title="Your turn: search a list"
pantry <- list("flour", "salt", "yeast", "water")

# Try it: does pantry contain "yeast"?
ex_has_yeast <- # your code here

ex_has_yeast
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pantry <- list("flour", "salt", "yeast", "water")
ex_has_yeast <- has_element(pantry, "yeast")
ex_has_yeast
#> [1] TRUE
```

**Explanation:** `has_element()` walks the list and compares each element to `"yeast"` with `identical()`. The third element matches exactly, so the call returns a single `TRUE`.

</details>

## Related purrr functions

These purrr predicate functions pair naturally with `has_element()`:

- `some()` tests whether any element satisfies a predicate function.
- `every()` tests whether all elements satisfy a predicate.
- `none()` tests whether no element satisfies a predicate.
- `detect()` returns the first element that matches a predicate.
- `detect_index()` returns the position of the first matching element.

For the broader picture, see the guide to [functional programming in R](Functional-Programming-in-R.html), which covers the map and reduce families that these predicates build on.

[NOTE]
**Coming from Python?** purrr's `has_element(x, v)` is the equivalent of `v in x` for a Python list, except the comparison is strict on type. The official reference lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/has_element.html).

## FAQ

**What is the difference between has_element() and %in% in R?**

`has_element()` compares with `identical()` and returns a single `TRUE` or `FALSE`, so the match must agree on value and type. `%in%` coerces types before comparing and returns one logical per element of its left-hand side. Use `has_element()` for strict, scalar checks against a list, and `%in%` for fast membership tests on atomic vectors where type coercion is acceptable.

**Does has_element() work on atomic vectors?**

Yes. `has_element()` accepts both lists and atomic vectors as its first argument. With an atomic vector it compares the target against each scalar element in turn, for example `has_element(letters, "q")` returns `TRUE`. The behavior is identical to using it on a list; only the input structure differs.

**Why does has_element() return FALSE when the value looks present?**

The most common cause is a type mismatch. `has_element()` uses `identical()`, which treats the double `2` and the integer `2L` as different. If a list holds integers and you search for a plain numeric literal, the call returns `FALSE`. Match the type with `2L`, or use `%in%`, which coerces types automatically.

**Can has_element() search nested lists?**

No. `has_element()` only inspects the top level of the list and does not recurse into nested elements. To search a deeply nested structure, flatten it first with `purrr::flatten()` or `unlist()`, then call `has_element()` on the flattened result.

**What does has_element() return?**

It always returns a single logical value, either `TRUE` or `FALSE`, regardless of how long the input list or vector is. This scalar return is what makes it safe to use directly inside an `if ()` condition without wrapping it in `any()`.
