---
title: "purrr discard() in R: Drop List Elements by Predicate"
slug: purrr-discard-in-R
description: "Learn how purrr discard() in R drops list or vector elements that match a predicate function. Syntax, worked examples, keep vs discard, and common pitfalls."
keywords: "purrr discard, discard function R, purrr discard examples, R discard list elements, keep vs discard R, remove list elements R, filter list by predicate R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "discard()|purrr discard|purrr::discard()|discard_at()|discard list elements"
auto_link_case_sensitive: true
target_keyword: "purrr discard"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr discard() in R: Drop List Elements by Predicate

<p class="lead">The purrr discard() function in R drops every list or vector element where a predicate function returns TRUE, keeping the rest. It is the fastest way to strip NA values, empty strings, or any element failing a test.</p>

[QUICK ANSWER]
discard(x, is.na)                  # drop NA elements
discard(x, \(v) v < 0)             # drop by a condition
discard(x, ~ .x == 0)              # formula shorthand
discard(x, is.character)           # drop by type
discard_at(x, "key")               # drop by name
discard_at(x, c(2, 4))             # drop by position
keep(x, \(v) v > 0)                # inverse: keep matches

[DECISION TREE: Is discard() the right tool?]
- drop elements failing a test: discard(x, \(v) v < 0)
- keep elements passing a test: keep(x, \(v) v > 0)
- drop only NULL and empty elements: compact(x)
- drop elements by name or position: discard_at(x, "key")
- drop a single element by index: x[-2]
- find the first matching element: detect(x, \(v) v > 0)

## What purrr discard() does

**discard() removes the elements you do not want.** It walks a list or vector, applies a predicate function to each element, and drops every element for which the predicate returns TRUE. Everything that returns FALSE survives. That makes it the natural tool for cleaning a collection: strip NA values, empty strings, or any element that fails a test.

Because `discard()` keeps the opposite of `keep()`, you reach for it whenever the rule for rejection is shorter to write than the rule for acceptance.

```r title="Load purrr and drop NA values"
library(purrr)

nums <- list(23, NA, 14, 7, NA, 24)
discard(nums, is.na) |> unlist()
#> [1] 23 14  7 24
```

[KEY INSIGHT]
**discard() keeps FALSE, not TRUE.** Write the predicate to describe what you want gone. If `is.na` returns TRUE for an element, that element is dropped. Reading the predicate as "what to remove" prevents the most common logic error with this function.

## discard() syntax and arguments

**discard() takes two core arguments plus optional extras.** The signature is `discard(.x, .p, ...)`, and each part has a specific job.

- `.x`: the list or atomic vector to filter.
- `.p`: the predicate function applied to each element. It must return a single TRUE or FALSE.
- `...`: extra arguments forwarded to `.p` on every call.

You can supply the predicate in three styles. Pass a named function like `is.na`, an anonymous function with the `\(x)` shorthand, or a formula where `.x` stands for the current element.

```r title="Drop elements with an anonymous predicate"
scores <- list(a = 12, b = 45, c = 8, d = 33)
discard(scores, \(x) x < 20)
#> $b
#> [1] 45
#>
#> $d
#> [1] 33
```

The result preserves names and the input type. Discarding from a list returns a list; discarding from an atomic vector returns an atomic vector.

## discard() examples by use case

**Real cleaning tasks fall into a few repeating shapes.** These four examples cover the cases you will meet most often.

Drop empty strings from a list of text by testing string length:

```r title="Drop empty strings from a list"
words <- list("apple", "", "kiwi", "", "mango")
discard(words, \(x) nchar(x) == 0) |> unlist()
#> [1] "apple" "kiwi"  "mango"
```

The formula syntax does the same job with less typing. Inside a formula, `.x` is the element being tested:

```r title="Drop short words with formula syntax"
discard(words, ~ nchar(.x) < 5) |> unlist()
#> [1] "apple" "mango"
```

When you know the name of the element to remove, `discard_at()` skips the predicate entirely and targets names or positions directly:

```r title="Drop elements by name with discard_at"
config <- list(host = "localhost", port = 8080, debug = TRUE)
discard_at(config, "debug")
#> $host
#> [1] "localhost"
#>
#> $port
#> [1] 8080
```

A data frame is a list of columns, so `discard()` works on it column by column. Here it drops every character column and leaves the numeric ones:

```r title="Drop character columns from a data frame"
df <- data.frame(
  name = c("Mazda", "Honda"),
  mpg  = c(21.0, 30.4),
  cyl  = c(6, 4)
)
discard(df, is.character)
#>    mpg cyl
#> 1 21.0   6
#> 2 30.4   4
```

## keep() vs discard(): two sides of the same filter

**keep() and discard() are mirror images.** Both apply a predicate to every element; they differ only in which result they retain. Pick the one whose rule is simpler to express.

| Function | Retains elements where the predicate is | Use when |
|---|---|---|
| `keep()` | TRUE | you can describe what to **keep** |
| `discard()` | FALSE | you can describe what to **remove** |
| `compact()` | length greater than 0 | you only want to drop NULL or empty elements |
| `Filter()` (base R) | TRUE | no purrr dependency is available |

`compact()` is a focused shortcut: it is equivalent to `discard()` with a length test, but reads better when removing empties is the only goal. Use `discard()` when the rejection rule is anything more specific than "empty".

[NOTE]
**Coming from Python pandas?** The closest equivalent of `discard()` is a list comprehension that filters out matches, such as `[v for v in x if not v < 0]`, or `filterfalse()` from the `itertools` module.

## Common pitfalls

**Most discard() errors trace back to the predicate.** The function is strict: `.p` must return exactly one TRUE or one FALSE per element.

A predicate that returns a vector longer than one fails. Calling `is.na` on a multi-value element produces a logical vector, not a single flag:

```r title="Pitfall: predicate must return one value"
vecs <- list(c(1, NA), c(3, 4))
# discard(vecs, is.na)
#> Error: `.p` must return a single `TRUE` or `FALSE`

# Fix: collapse to one logical with anyNA()
discard(vecs, anyNA) |> str()
#> List of 1
#>  $ : num [1:2] 3 4
```

A predicate that returns NA fails the same way. Comparing an NA element with `>` yields NA, which is neither TRUE nor FALSE:

```r title="Pitfall: a predicate that returns NA"
mixed <- list(5, NA, 10)
# discard(mixed, \(x) x > 6)
#> Error: `.p` must return a single `TRUE` or `FALSE`

# Fix: guard against NA inside the predicate
discard(mixed, \(x) !is.na(x) && x > 6) |> unlist()
#> [1]  5 NA
```

[WARNING]
**Discarding every element returns an empty list, never NULL.** If the predicate matches all elements, `discard()` gives back `list()`. Downstream code that assumes at least one value will break. Check with `length()` before using the result.

```r title="Pitfall: discarding everything yields an empty list"
all_na <- list(NA, NA, NA)
discard(all_na, is.na)
#> list()
```

## Try it yourself

**Try it:** From the list `prices <- list(10, NA, 25, 0, NA, 8)`, use discard() to drop both the NA values and the zero. Save the result to ex_clean.

```r title="Your turn: clean a price list"
prices <- list(10, NA, 25, 0, NA, 8)
ex_clean <- # your code here

ex_clean
#> Expected: 10, 25, 8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- list(10, NA, 25, 0, NA, 8)
ex_clean <- discard(prices, \(x) is.na(x) || x == 0)
unlist(ex_clean)
#> [1] 10 25  8
```

**Explanation:** The predicate returns TRUE for NA elements and for zero, so discard() drops both. `||` short-circuits, so `x == 0` is never tested on an NA value.

</details>

## Related purrr functions

**discard() sits in a small family of filtering verbs.** Reach for a neighbour when the task shifts from rejection to selection or lookup.

- [keep()](purrr-keep-in-R.html) keeps elements where the predicate is TRUE, the exact inverse of `discard()`.
- [compact()](purrr-compact-in-R.html) drops only NULL and zero-length elements.
- `discard_at()` and `keep_at()` filter by name or position instead of value.
- [detect()](purrr-detect-in-R.html) returns the first element that matches a predicate.
- [map()](purrr-map-in-R.html) transforms elements once you have filtered the ones you want.

See the official [purrr keep and discard reference](https://purrr.tidyverse.org/reference/keep.html) for the full argument list.

## FAQ

**What is the difference between keep() and discard() in purrr?**

Both functions test every element with a predicate. `keep()` retains the elements where the predicate returns TRUE, while `discard()` retains the elements where it returns FALSE. They are exact opposites, so `discard(x, p)` equals `keep(x, negate(p))`. Choose whichever lets you write the simpler rule: keep when describing what to retain is easier, discard when describing what to remove is easier.

**How do I remove NA values from a list with discard()?**

Pass `is.na` as the predicate: `discard(my_list, is.na)`. The `is.na` function returns TRUE for each NA element, and `discard()` drops those, leaving only the non-missing values. This works when every element is a single value. If elements are multi-value vectors, use `anyNA` instead so the predicate still returns a single TRUE or FALSE.

**Can discard() be used on a data frame?**

Yes. A data frame is a list of columns, so `discard()` applies the predicate to each column. For example, `discard(df, is.character)` drops every character column and returns a data frame of the remaining columns. This is a quick way to keep only numeric columns before modelling or to strip identifier columns before a summary.

**Why does discard() throw a "single TRUE or FALSE" error?**

The predicate returned something other than one logical value. Common causes are a function like `is.na` applied to a multi-element vector, which returns a logical vector, or a comparison against an NA value, which returns NA. Fix it by collapsing the result with `anyNA` or `any`, or by guarding the comparison with `!is.na(x) &&` so the predicate always returns a single TRUE or FALSE.
