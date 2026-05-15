---
title: "purrr map_lgl() in R: Map a List to a Logical Vector"
slug: purrr-map_lgl-in-R
description: "Learn purrr map_lgl() in R to apply a predicate over a list or vector and return a type-stable logical vector, with worked examples and common pitfalls."
keywords: "purrr map_lgl, map_lgl function R, purrr map_lgl examples, R map_lgl logical vector, map_lgl predicate, map_lgl vs sapply"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "map_lgl()|purrr map_lgl|purrr::map_lgl()|map_lgl function|logical vector from a list|test each element of a list"
auto_link_case_sensitive: true
target_keyword: "purrr map_lgl"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr map_lgl() in R: Map a List to a Logical Vector

<p class="lead">purrr map_lgl() applies a predicate to every element of a list or vector and always returns a logical vector, erroring loudly if any result is not a single TRUE or FALSE.</p>

[QUICK ANSWER]
map_lgl(x, f)                      # apply f, return a logical vector
map_lgl(x, ~ .x > 0)               # formula predicate shorthand
map_lgl(df, is.numeric)            # test each column of a data frame
map_lgl(x, ~ any(is.na(.x)))       # flag elements that contain NA
map_lgl(people, "active")          # extract a logical field from records
which(map_lgl(x, f))               # indices of elements that pass the test

[DECISION TREE: Is map_lgl() the right tool?]
- need a TRUE/FALSE per element: map_lgl(x, f)
- need a number per element instead: map_dbl(x, f)
- need a string per element instead: map_chr(x, f)
- keep only elements that pass a test: keep(x, p)
- one answer for "do all pass": every(x, p)
- one answer for "does any pass": some(x, p)

## What map_lgl() does in one sentence

**map_lgl() is the logical-returning member of the purrr map family.** You hand it a list or vector and a predicate function, and it runs that function once per element, then binds the results into a single logical vector. The "lgl" suffix is a contract: every call must produce exactly one `TRUE`, `FALSE`, or `NA` per element, or the function stops with an error.

This type stability is the whole point. A plain `map()` returns a list, which you would have to unlist before you could use it in `which()`, `if`, or a subsetting bracket. `map_lgl()` guarantees a flat logical vector up front, so it slots directly into those tools.

## Syntax

**The signature takes the data first, then the predicate.** Like every map variant, `map_lgl()` follows the standard purrr argument order.

```r title="The map_lgl signature"
library(purrr)

# map_lgl(.x, .f, ..., .default = NULL)
#   .x        a list or atomic vector to iterate over
#   .f        a function, formula (~), or extractor (name/position)
#   ...       extra arguments passed on to .f
#   .default  value to use when an extracted element is missing
```

The `.f` argument is flexible. It accepts a named function like `is.numeric`, a formula such as `~ .x > 0` where `.x` is the current element, or a string or integer that acts as an extractor for nested data.

```r title="Two ways to write the predicate"
library(purrr)

map_lgl(list(1, -2, 3), ~ .x > 0)    # formula with .x
#> [1]  TRUE FALSE  TRUE

map_lgl(list(1L, "a", TRUE), is.numeric)   # named function
#> [1]  TRUE FALSE FALSE
```

## Worked examples

**Example 1 tests which columns of a data frame are numeric.** A data frame is a list of columns, so mapping over it visits one column at a time.

```r title="Find the numeric columns of iris"
library(purrr)

map_lgl(iris, is.numeric)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>         TRUE         TRUE         TRUE         TRUE        FALSE
```

The result keeps the column names, because `map_lgl()` preserves the names of `.x`. You can feed it straight into `iris[map_lgl(iris, is.numeric)]` to drop the non-numeric column.

**Example 2 flags list elements that contain a missing value.** The `.x` placeholder refers to each element in turn, and `any()` collapses a vector of tests into one logical.

```r title="Flag elements containing NA"
library(purrr)

nested <- list(a = c(1, 2, NA), b = c(3, 4, 5), c = c(NA, 6))
map_lgl(nested, ~ any(is.na(.x)))
#>     a     b     c
#>  TRUE FALSE  TRUE
```

**Example 3 extracts a logical field from a list of records.** When `.f` is a string, `map_lgl()` plucks that named element from each item.

```r title="Extract a logical field from nested records"
library(purrr)

people <- list(
  list(name = "Ada",   active = TRUE),
  list(name = "Linus", active = FALSE),
  list(name = "Grace", active = TRUE)
)

map_lgl(people, "active")
#> [1]  TRUE FALSE  TRUE
```

**Example 4 finds the positions of passing elements.** Wrapping `map_lgl()` in `which()` turns a logical vector into the indices you can subset with.

```r title="Locate the positive numbers"
library(purrr)

x <- list(10, -3, 7, -1, 4)
which(map_lgl(x, ~ .x > 0))
#> [1] 1 3 5
```

[TIP]
**Reach for the typed variant that matches your output.** Use `map_lgl()` for TRUE/FALSE, `map_dbl()` for numbers, and `map_chr()` for strings. Typed variants fail fast on the wrong type, which catches bugs that a plain `map()` would silently pass downstream.

## map_lgl() vs map() and the other variants

**The difference is the shape and type of what comes back.** All variants iterate identically; they differ only in how results are combined.

| Function | Returns | Use when |
|---|---|---|
| `map()` | A list | Each result has a different type or length |
| `map_lgl()` | Logical vector | Each result is one TRUE/FALSE |
| `map_dbl()` | Double vector | Each result is one number |
| `map_chr()` | Character vector | Each result is one string |
| `map2_lgl()` | Logical vector | You iterate over two inputs in parallel |

The contrast with `map()` is clearest on the same input:

```r title="map returns a list, map_lgl returns a vector"
library(purrr)

map(1:3, ~ .x > 1)
#> [[1]]
#> [1] FALSE
#>
#> [[2]]
#> [1] TRUE
#>
#> [[3]]
#> [1] TRUE

map_lgl(1:3, ~ .x > 1)
#> [1] FALSE  TRUE  TRUE
```

**Decision rule:** if you know every result is a single logical, use `map_lgl()`. If results vary in length or type, use `map()` and post-process.

[KEY INSIGHT]
**A logical vector is the natural input to subsetting and counting.** Because `map_lgl()` returns a flat logical vector, you can drop it straight into `x[...]`, `which()`, or `sum()` to count how many elements passed. That last trick works because `TRUE` counts as 1 and `FALSE` as 0.

## Common pitfalls

**Pitfall 1: the predicate returns more than one value.** `map_lgl()` demands exactly one logical per element.

```r title="Length error when output is not scalar"
library(purrr)

map_lgl(list(1:2, 3:4), ~ .x > 2)
#> Error in `map_lgl()`:
#> i In index: 1.
#> Caused by error:
#> ! Result must be length 1, not 2.
```

The fix is to collapse the result with `any()` or `all()`, as Example 2 does, or switch to `map()` if you genuinely need varying lengths.

**Pitfall 2: the predicate returns a number instead of a logical.** In purrr 1.0 and later, `map_lgl()` will not coerce a `0` or `1` into `FALSE` or `TRUE`.

```r title="Type error when output is not logical"
library(purrr)

map_lgl(1:3, ~ .x)
#> Error in `map_lgl()`:
#> i In index: 1.
#> Caused by error:
#> ! Can't coerce from a number to a logical.
```

Wrap the body in an explicit comparison such as `~ .x > 0` so the result is a real logical.

**Pitfall 3: using `map_lgl()` when you want a single answer.** If you only need to know whether all or any elements pass, `every()` and `some()` read better and stop early.

[WARNING]
**Watch for NA leaking into your logical vector.** A predicate that returns `NA` (for example `~ mean(.x) > 0` on data with missing values) produces an `NA` in the output. That `NA` then breaks `if`, and `which()` silently ignores it. Guard with `na.rm = TRUE` or test explicitly.

## Try it yourself

**Try it:** Use `map_lgl()` to test which columns of `mtcars` contain only values greater than 0. Save the result to `ex_allpos`.

```r title="Your turn: all-positive columns of mtcars"
# Try it: TRUE if every value in the column is > 0
ex_allpos <- # your code here

ex_allpos
#> Expected: vs and am are FALSE, every other column TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(purrr)

ex_allpos <- map_lgl(mtcars, ~ all(.x > 0))
ex_allpos
#>   mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>  TRUE  TRUE  TRUE  TRUE  TRUE  TRUE  TRUE FALSE FALSE  TRUE  TRUE
```

**Explanation:** `mtcars` is a list of columns, so `map_lgl()` calls `~ all(.x > 0)` on each one. The `vs` and `am` columns contain `0` values, so `all(.x > 0)` is `FALSE` for them and `TRUE` for every other column.

</details>

## Related purrr functions

**These functions pair naturally with map_lgl() in everyday pipelines.**

- `map()`: the untyped base case that returns a list when results vary.
- `keep()` and `discard()`: filter a list by a predicate instead of testing it.
- `every()` and `some()`: collapse a predicate over a whole list to one logical.
- `map2_lgl()`: iterates over two inputs in parallel to build logicals.
- `detect_index()`: returns the position of the first element that passes.

[NOTE]
**Coming from base R?** `map_lgl(x, f)` is equivalent to `vapply(x, f, logical(1))`. Both enforce a one-logical-per-element contract; purrr just adds formula shorthand and the `.default` argument for missing fields.

## FAQ

**What is the difference between map and map_lgl in purrr?**

`map()` always returns a list, regardless of what the function produces. `map_lgl()` returns a flat logical vector and requires every result to be a single `TRUE`, `FALSE`, or `NA`. Use `map_lgl()` when you know the output is a yes/no test and want a vector you can use directly in subsetting or `which()`; use `map()` when results differ in type or length.

**Why does map_lgl() throw a "Result must be length 1" error?**

That error means the predicate returned a vector with more than one element for at least one item. `map_lgl()` can only combine length-one results into its output vector. The error reports the failing index. Collapse the result with `any()` or `all()`, or switch to `map()` if varying lengths are expected.

**How is map_lgl() different from every() and some()?**

`map_lgl()` returns one logical per element, so a 10-element list gives a 10-element vector. `every()` and `some()` collapse the whole list to a single `TRUE` or `FALSE`. Use `map_lgl()` when you need the per-element results, for example to subset; use `every()` or `some()` when you only need the overall answer.

**Does map_lgl() handle NA values?**

Yes, `NA` is a valid logical, so a predicate may return `NA` and `map_lgl()` will accept it. The risk is downstream: `NA` breaks `if` statements and is dropped by `which()`. If your predicate can produce `NA`, add `na.rm = TRUE` inside it or filter the result before using it in control flow.

**What is the base R equivalent of map_lgl()?**

The closest match is `vapply(x, f, logical(1))`, which also enforces a one-logical-per-element contract. `sapply(x, f)` returns a logical vector too, but only when every result happens to be a scalar logical, so it is less predictable. `map_lgl()` adds the formula shorthand `~ .x > 0` and the `.default` argument for missing extracted fields.
