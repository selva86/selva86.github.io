---
title: "purrr map_int() in R: Return an Integer Vector"
slug: purrr-map_int-in-R
description: "purrr map_int() applies a function to each element and returns an integer vector in R. Learn syntax, worked examples, coercion rules, and common errors."
keywords: "purrr map_int, map_int function R, purrr map_int examples, R map_int integer vector, map_int vs map_dbl, map_int count elements"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "map_int()|purrr map_int|purrr::map_int()|map_int function|map_int"
auto_link_case_sensitive: true
target_keyword: "purrr map_int"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr map_int() in R: Return an Integer Vector

<p class="lead">purrr map_int() applies a function to each element of a list or vector and returns an integer vector. It is the type-stable counterpart of map() for whole-number results, such as counts and lengths.</p>

[QUICK ANSWER]
map_int(x, length)                    # element count per list item
map_int(df, ~ sum(is.na(.x)))         # NA count per column
map_int(df, ~ length(unique(.x)))     # distinct values per column
map_int(words, nchar)                 # character count per string
map_int(x, \(v) v * 2L)               # anonymous function, integer result
map_int(x, length, .progress = TRUE)  # show a progress bar

[DECISION TREE: Is map_int() the right tool?]
- count things, want an integer vector: map_int(x, length)
- result is a decimal or average: map_dbl(x, mean)
- result is text: map_chr(x, paste0)
- result is TRUE or FALSE: map_lgl(x, is.numeric)
- keep mixed results as a list: map(x, summary)
- two inputs in parallel: map2_int(x, y, `+`)

## What map_int() does in one sentence

**map_int() is a type-stable iterator.** It loops over every element of `.x`, calls `.f` on each one, and binds the results into a plain integer vector the same length as the input. If any result cannot become an integer, the call fails loudly instead of returning a surprising type.

That strictness is the point. Base R's `sapply()` guesses the output type and can hand you a list when you expected a vector. `map_int()` removes the guess: the answer is always an integer vector, or it is an error you can see immediately.

[KEY INSIGHT]
**Type stability is a contract, not a limitation.** Because `map_int()` guarantees an integer vector, code downstream can rely on that type without defensive checks. The error you get on a bad result is cheaper than a silent type bug found in production.

## Syntax

**map_int() takes an input and a function.** The two required arguments are `.x`, the list or vector to iterate over, and `.f`, the function applied to each element.

```r title="The map_int signature"
library(purrr)

# map_int(.x, .f, ..., .progress = FALSE)
#   .x        a list or atomic vector
#   .f        a function, ~ formula, or \(x) lambda
#   ...       extra arguments passed on to .f
#   .progress show a progress bar for slow loops

map_int(list(1:3, 1:5, 1:10), length)
#> [1]  3  5 10
```

You can write `.f` three ways: a named function (`length`), a purrr formula (`~ sum(is.na(.x))`) where `.x` is the current element, or a native lambda (`\(v) length(v)`). All three are equivalent; pick whichever reads best.

## Worked examples

**Counting is the canonical job for map_int().** Each example below returns one whole number per element, so the integer output type fits naturally.

Count missing values in every column of a data frame. A data frame is a list of columns, so `map_int()` iterates column by column.

```r title="Count NAs per column"
map_int(airquality, ~ sum(is.na(.x)))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

Count how many distinct values each column holds. This is a fast cardinality check before modelling.

```r title="Distinct values per column"
map_int(iris, ~ length(unique(.x)))
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>           35           23           43           22            3
```

Apply a named function directly. Here `nchar` returns the character count of each string.

```r title="Character count per string"
map_int(c("apple", "fig", "banana"), nchar)
#> [1] 5 3 6
```

Use a lambda when the result needs explicit integer literals. The `L` suffix marks `2L` as an integer so the output type is exact.

```r title="Lambda returning an integer"
map_int(1:4, \(v) v * 2L)
#> [1] 2 4 6 8
```

## map_int() vs map() and the other variants

**Every map variant differs only in its return type.** The loop is identical; the suffix picks the output. Choose the variant that matches the type each call to `.f` produces.

| Function | Returns | Use when `.f` produces |
|---|---|---|
| `map()` | list | anything, including mixed types |
| `map_int()` | integer vector | whole numbers (counts, lengths) |
| `map_dbl()` | double vector | decimals (means, ratios) |
| `map_chr()` | character vector | strings |
| `map_lgl()` | logical vector | TRUE or FALSE |

The decision rule is simple. If `.f` returns a count or a length, use `map_int()`. If it returns an average, a proportion, or any fractional number, use `map_dbl()`. When in doubt, use `map()` and inspect the list first.

[NOTE]
**Coming from base R?** `map_int(x, f)` is `vapply(x, f, integer(1))`. Both promise an integer vector, but `map_int()` supports formula and lambda shorthand and gives clearer error messages.

## Common pitfalls

**Most map_int() errors trace back to one rule: each result must coerce to a single integer.** These three mistakes break that rule.

A function that returns a fractional double cannot become an integer. Averaging columns produces decimals, so `map_int()` rejects them.

```r title="Pitfall: fractional result"
map_int(mtcars, mean)
#> Error in `map_int()`:
#> ! Can't coerce from a double vector to an integer vector.
```

The fix is to use `map_dbl()` whenever `.f` can return a decimal.

A function that returns more than one value per element also fails, because `map_int()` expects exactly length 1.

```r title="Pitfall: result longer than one"
map_int(list(1:3, 4:6), range)
#> Error in `map_int()`:
#> ! Result 1 must be a single integer, not an integer vector of length 2.
```

Aggregate first so each call yields one number, for example `~ diff(range(.x))`.

[WARNING]
**Character digits do not auto-convert.** `map_int(c("1", "2"), identity)` errors even though the strings look numeric. Wrap the result yourself: `map_int(c("1", "2"), as.integer)`.

## Try it yourself

**Try it:** Use map_int() on the `mtcars` data frame to count how many distinct values appear in each column. Save the result to `ex_distinct`.

```r title="Your turn: distinct values per column"
# Try it: count distinct values per column of mtcars
ex_distinct <- # your code here

ex_distinct
#> Expected: an integer vector with one count per column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_distinct <- map_int(mtcars, ~ length(unique(.x)))
ex_distinct
#>  mpg  cyl disp   hp drat   wt qsec   vs   am gear carb
#>   25    3   27   22   22   29   30    2    2    3    6
```

**Explanation:** `map_int()` iterates over each column of `mtcars`. The formula `~ length(unique(.x))` returns one whole number per column, so the integer return type fits and the result is a named integer vector.

</details>

## Related purrr functions

**map_int() is one of a family.** Reach for these when the return type changes:

- `map()` returns a list for any result type.
- `map_dbl()` returns a double vector for decimal results.
- `map_chr()` returns a character vector for string results.
- `map_lgl()` returns a logical vector for TRUE or FALSE results.
- `map2_int()` iterates two inputs in parallel and returns an integer vector.

## FAQ

**What is the difference between map_int() and map() in R?**

`map()` always returns a list, regardless of what `.f` produces. `map_int()` returns a plain integer vector and checks every result. Use `map()` when results vary in type or length, and `map_int()` when each result is a single whole number. The integer return type makes `map_int()` output ready for arithmetic, indexing, or comparison without any unlisting step.

**Why does map_int() give a coercion error?**

The error appears when `.f` returns something that cannot become an integer, most often a fractional double like a mean, or a value longer than one. `map_int()` enforces an integer-vector contract, so it stops instead of silently changing type. Switch to `map_dbl()` for decimal results, or aggregate the result down to a single whole number per element.

**Can map_int() return NA values?**

Yes. If `.f` returns `NA_integer_` for an element, `map_int()` keeps it as a missing value in the integer output. A bare logical `NA` also coerces cleanly. What it will not accept is `NULL` or a zero-length result, since those cannot fill an integer slot and trigger a length error instead.

**Is map_int() faster than sapply()?**

Performance is roughly equal; both loop in C-backed code. The real gain from `map_int()` is reliability. `sapply()` may return a list, a vector, or a matrix depending on the data, while `map_int()` always returns an integer vector or errors. That predictability prevents type bugs that surface far from their cause.
</content>
</invoke>
