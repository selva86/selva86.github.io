---
title: "purrr map_vec() in R: Map to a Simple Typed Vector"
slug: purrr-map_vec-in-R
description: "Learn purrr map_vec() in R to apply a function over a list or vector and return a simplified vector that automatically keeps Date, factor and other S3 types."
keywords: "purrr map_vec, map_vec function R, purrr map_vec examples, R map_vec vector, map_vec vs map, map_vec dates, purrr map_vec output type"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "map_vec()|purrr map_vec|purrr::map_vec()|map_vec function|simplify to a vector|map returning a typed vector"
auto_link_case_sensitive: true
target_keyword: "purrr map_vec"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr map_vec() in R: Map to a Simple Typed Vector

<p class="lead">purrr map_vec() applies a function to every element of a list or vector and returns a simplified vector, automatically picking the common output type including Date, factor and other S3 classes.</p>

[QUICK ANSWER]
map_vec(1:3, ~ .x * 2)               # numeric vector
map_vec(x, toupper)                  # character vector
map_vec(dates, as.Date)              # Date vector, class kept
map_vec(codes, ~ factor(.x))         # factor vector
map_vec(x, f, .ptype = integer())    # force the output type
map_vec(x, f, .progress = TRUE)      # show a progress bar

[DECISION TREE: Is map_vec() the right tool?]
- simplify to a vector, type unknown: map_vec(x, f)
- output is always a number: map_dbl(x, f)
- output is always a string: map_chr(x, f)
- output should stay a list: map(x, f)
- combine results row-wise into a table: list_rbind(map(x, f))
- iterate only for side effects: walk(x, f)

## What map_vec() does in one sentence

**map_vec() is the type-flexible simplifier of the purrr map family.** You hand it a list or vector and a function, it runs that function once per element, then combines the length-one results into a single atomic or S3 vector. Unlike `map_chr()` or `map_dbl()`, it does not force a type in advance. It inspects what the function returns and picks the common type automatically.

That flexibility is the reason `map_vec()` exists. The typed variants only know about logical, integer, double and character. `map_vec()` also handles Date, factor, POSIXct and difftime, so iterations that produce those classes finally have a simplifying map function.

## Syntax and arguments

**The signature takes the data first, then the function.** Like every map variant, `map_vec()` follows the standard purrr argument order, with two extras for type control.

```r title="The map_vec signature"
library(purrr)

# map_vec(.x, .f, ..., .ptype = NULL, .progress = FALSE)
#   .x        a list or atomic vector to iterate over
#   .f        a function, formula (~), or extractor (name/position)
#   ...       extra arguments passed on to .f
#   .ptype    optional prototype to force the output type
#   .progress show a progress bar for slow iterations
```

The `.f` argument accepts a named function such as `toupper`, a formula like `~ .x * 2` where `.x` is the current element, or a string or integer that plucks an element from nested data. The `.ptype` argument is the safety valve: pass it a zero-length prototype like `integer()` and `map_vec()` coerces every result to that type or errors trying.

## Worked examples

**Example 1 squares each number and returns a numeric vector.** With a simple numeric function, `map_vec()` behaves like `map_dbl()`.

```r title="Map to a numeric vector"
library(purrr)

map_vec(1:5, ~ .x ^ 2)
#> [1]  1  4  9 16 25
```

**Example 2 parses date strings and keeps the Date class.** This is the case the typed variants cannot handle, since there is no `map_date()`.

```r title="Map to a Date vector"
library(purrr)

date_strings <- c("2024-01-15", "2024-06-30", "2024-12-25")
holidays <- map_vec(date_strings, as.Date)

holidays
#> [1] "2024-01-15" "2024-06-30" "2024-12-25"
class(holidays)
#> [1] "Date"
```

A plain `map_chr()` here would strip the class and leave you with bare strings. `map_vec()` returns a genuine Date vector you can subtract, sort, or plot.

**Example 3 builds a factor from integer codes.** Each call returns a length-one factor, and `map_vec()` binds them while preserving the levels.

```r title="Map to a factor vector"
library(purrr)

codes <- c(2, 1, 3, 1)
sizes <- map_vec(codes, ~ factor(c("small", "medium", "large")[.x],
                                 levels = c("small", "medium", "large")))
sizes
#> [1] medium small  large  small 
#> Levels: small medium large
```

**Example 4 forces the output type with `.ptype`.** Supplying a prototype makes the contract explicit and rejects any result that cannot be coerced.

```r title="Force the output type with .ptype"
library(purrr)

map_vec(c(1, 2, 3), ~ .x, .ptype = integer())
#> [1] 1 2 3
```

[TIP]
**Use `.ptype` when you know the type you expect.** Passing `.ptype = double()` or `.ptype = Sys.Date()` turns `map_vec()` into a typed variant on demand. It documents intent and fails fast if a function ever returns the wrong class.

## map_vec() vs map_chr(), map_dbl() and map()

**The difference is who decides the output type.** All four iterate identically; they differ in what they return and how strict they are.

| Function | Returns | Use when |
|---|---|---|
| `map()` | A list | Results vary in type or length |
| `map_chr()` | Character vector | Every result is a single string |
| `map_dbl()` | Double vector | Every result is a single number |
| `map_vec()` | Simplest common vector | Results are scalars, including Date or factor |
| `list_rbind()` | Data frame | Each result is a row |

The contrast with `map()` is clearest on the same input:

```r title="map keeps a list, map_vec simplifies it"
library(purrr)

map(1:3, ~ .x * 10)
#> [[1]]
#> [1] 10
#>
#> [[2]]
#> [1] 20
#>
#> [[3]]
#> [1] 30

map_vec(1:3, ~ .x * 10)
#> [1] 10 20 30
```

**Decision rule:** if every result is a scalar and you want a vector out, use `map_vec()`. If you specifically need numbers or strings and want the type checked, the typed variants state that intent more loudly. If results vary in length, stay with `map()`.

[KEY INSIGHT]
**map_vec() exists to fill the gap left by the typed variants.** Before purrr 1.0.0, iterating to a Date or factor meant calling `map()` and then a manual `do.call(c, ...)` or `reduce()`. `map_vec()` makes that one call, and uses vctrs rules so the combination is type-safe rather than a silent coercion.

## Common pitfalls

**Pitfall 1: the function returns more than one value.** `map_vec()` can only simplify length-one results into its output vector.

```r title="Pitfall: .f must return length 1"
library(purrr)

map_vec(1:3, ~ c(.x, .x * 10))
#> Error in `map_vec()`:
#> i In index: 1.
#> Caused by error:
#> ! Result must be length 1, not 2.
```

The fix is to collapse the result, or switch to `map()` when varying lengths are genuinely expected.

**Pitfall 2: the results have no common type.** If one call returns a number and another a string, `map_vec()` refuses to combine them rather than coercing silently.

```r title="Pitfall: results must share a common type"
library(purrr)

map_vec(list(1, "two", 3), ~ .x)
#> Error in `map_vec()`:
#> ! Can't combine `<double>` and `<character>`.
```

**Pitfall 3: reaching for `map_vec()` when the type is fixed.** If every result is definitely a number, `map_dbl()` documents that better and the error message is clearer. Save `map_vec()` for the cases the typed variants cannot express.

[WARNING]
**map_vec() was added in purrr 1.0.0 (December 2022).** On older purrr installations the function does not exist and you get a "could not find function" error. Run `packageVersion("purrr")` and upgrade if it reports a version below 1.0.0.

## Try it yourself

**Try it:** Use `map_vec()` to convert the character vector `c("3", "7", "11")` to a numeric vector. Save the result to `ex_nums`.

```r title="Your turn: map_vec to numeric"
# Try it: convert character strings to numbers
ex_nums <- # your code here

ex_nums
#> Expected: 3 7 11
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(purrr)

ex_nums <- map_vec(c("3", "7", "11"), as.numeric)
ex_nums
#> [1]  3  7 11
```

**Explanation:** `as.numeric()` returns a single number per element, so `map_vec()` detects the common double type and binds the three results into a numeric vector.

</details>

## Related purrr functions

**These functions pair naturally with map_vec() in everyday pipelines.**

- `map()`: the untyped base case that returns a list when results vary.
- `map_chr()`: the string-only sibling for results that are single characters.
- `map_dbl()`: the numeric-only sibling for results that are single doubles.
- `map2()`: iterates over two inputs in parallel, with its own `_vec` form.
- `list_rbind()`: stacks per-element results into a single data frame.

[NOTE]
**Coming from base R?** `map_vec(x, f)` is close to `vapply(x, f, FUN.VALUE)` but you do not have to spell out the prototype. `map_vec()` infers the common type, and only needs `.ptype` when you want to lock it down.

## FAQ

**What is the difference between map_vec() and map()?**

`map()` always returns a list, no matter what the function produces. `map_vec()` simplifies the results into a single atomic or S3 vector, choosing the common type automatically. Use `map_vec()` when each result is a scalar and you want a flat vector to work with directly. Use `map()` when results differ in length or have no shared type, then process the list afterward.

**When was map_vec() added to purrr?**

`map_vec()` arrived in purrr 1.0.0, released in December 2022, alongside other modernised iteration helpers. If your code calls `map_vec()` and R reports that it cannot find the function, your purrr is older than 1.0.0. Check with `packageVersion("purrr")` and run `install.packages("purrr")` to upgrade to a current release.

**Can map_vec() return a Date or factor vector?**

Yes, and that is its main advantage over the typed variants. `map_chr()`, `map_dbl()`, `map_int()` and `map_lgl()` only know the four base atomic types. `map_vec()` understands any vector type that vctrs can combine, so functions returning Date, POSIXct, factor or difftime values simplify correctly into a vector of that class.

**Why does map_vec() throw a "Result must be length 1" error?**

That error means the function returned more than one value for at least one element. `map_vec()` simplifies by stacking length-one results, so a length-two return has no place to go. The message reports the failing index. Either collapse the result to a single value, or switch to `map()` if varying lengths are part of your design.

**Is map_vec() slower than map_chr() or map_dbl()?**

In practice the difference is negligible for typical data. `map_vec()` does slightly more work because it inspects results to find the common type, while `map_dbl()` knows the type up front. For tight loops over millions of elements the typed variant has a small edge, but for everyday iteration the gap is not noticeable.
</content>
</invoke>
