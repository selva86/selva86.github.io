---
title: "purrr map_dbl() in R: Return a Numeric Vector"
slug: "purrr-map_dbl-in-R"
description: "Use purrr map_dbl() in R to apply a function across a list or vector and return a type-stable numeric (double) vector. Worked examples, pitfalls, and FAQ."
keywords: "purrr map_dbl, map_dbl function R, purrr map_dbl examples, R map_dbl numeric vector, map_dbl vs map, map_dbl vs sapply"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "map_dbl()|purrr map_dbl|purrr::map_dbl()|map_dbl function|map_dbl variant"
auto_link_case_sensitive: true
target_keyword: "purrr map_dbl"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr map_dbl() in R: Return a Numeric Vector

<p class="lead">The <code>map_dbl()</code> function in purrr applies a function to each element of a list or vector and returns a flat numeric (double) vector. It is the type-stable variant of <code>map()</code>: if the function returns anything other than a length-1 double, <code>map_dbl()</code> errors instead of failing silently.</p>

[QUICK ANSWER]
map_dbl(x, mean)                    # apply, return doubles
map_dbl(x, ~ .x ^ 2)                # lambda formula
map_dbl(x, \(v) v ^ 2)              # native anonymous function
map_dbl(x, mean, na.rm = TRUE)      # pass extra arguments
map_dbl(records, "score")           # pluck a numeric element
map_dbl(x, length)                  # numeric summary per element
map_dbl(df, ~ sum(.x > 0))          # count matches per column

[DECISION TREE: Is map_dbl() the right tool?]
- need a numeric vector out: map_dbl(x, mean)
- need text out instead: map_chr(x, format)
- need whole integers out: map_int(x, length)
- need TRUE or FALSE out: map_lgl(x, is.numeric)
- output length varies per element: map(x, range)
- building a data frame row by row: map_dfr(x, summary_fn)
- only running side effects, no output: walk(x, print)

## What map_dbl() does in one sentence

**`map_dbl(x, fn)` applies `fn` to every element of `x` and returns a numeric vector.** Each call to `fn` must produce a single double value, so the result is always a flat, predictable atomic vector rather than a list.

This type guarantee is the whole point. Plain `map()` always returns a list, and base R's `sapply()` *guesses* the output type, which can silently hand you a list, a matrix, or a vector depending on the data. `map_dbl()` removes the guessing.

## Syntax

**`map_dbl(.x, .f, ...)` takes three things: input, function, and pass-through arguments.** `.x` is a list or atomic vector, `.f` is the function or lambda to apply, and `...` are extra arguments forwarded to `.f`.

```r title="Three ways to write the function"
library(purrr)

# Named function
map_dbl(1:5, sqrt)
#> [1] 1.000000 1.414214 1.732051 2.000000 2.236068

# Lambda formula: .x is the placeholder for each element
map_dbl(1:5, ~ .x ^ 2)
#> [1]  1  4  9 16 25

# Native R anonymous function (R 4.1+)
map_dbl(1:5, \(v) v ^ 2)
#> [1]  1  4  9 16 25
```

All three styles are equivalent. The `~ .x` lambda is purrr shorthand; the `\(v)` form is base R syntax and works anywhere.

## Worked examples

**Each example below uses a different input shape.** Together they cover the four situations where `map_dbl()` shows up most: summarising columns, measuring list elements, extracting a value, and handling missing data.

**1. Summarise every column of a data frame.** A data frame is a list of columns, so `map_dbl()` iterates column by column.

```r title="Column means of mtcars"
map_dbl(mtcars, mean)
#>        mpg        cyl       disp         hp       drat         wt
#>  20.090625   6.187500 230.721875 146.687500   3.596563   3.217250
#>       qsec         vs         am       gear       carb
#>  17.848750   0.437500   0.406250   3.687500   2.812500
```

**2. Measure each element of a list.** When list elements have different lengths, `length()` reduces each to a single number.

```r title="Length of each list element"
lst <- list(a = 1:3, b = 1:7, c = 1:2)
map_dbl(lst, length)
#> a b c
#> 3 7 2
```

**3. Pluck a numeric field from nested records.** Passing a string as `.f` extracts that element from each item, like a vectorised `$`.

```r title="Extract a field by name"
records <- list(
  list(id = 1, score = 88),
  list(id = 2, score = 92),
  list(id = 3, score = 75)
)
map_dbl(records, "score")
#> [1] 88 92 75
```

**4. Forward extra arguments with `...`.** Anything after `.f` is passed straight to the function on every call.

```r title="Handle NA values per element"
vals <- list(c(1, 2, NA), c(4, NA, 6))
map_dbl(vals, mean, na.rm = TRUE)
#> [1] 1.5 5.0
```

[TIP]
**Reach for the lambda when you need an expression, not a bare function.** `map_dbl(x, mean)` is cleanest for a single named function, but `map_dbl(df, ~ sum(.x > 0))` lets you compute something inline without defining a helper.

## map_dbl() vs map() and the other variants

**Pick the variant that matches the type you expect back.** All `map_*` functions iterate the same way; they differ only in what they return and how strictly they enforce it.

| Function | Returns | Errors if element is not... |
|---|---|---|
| `map()` | list | never errors (any type allowed) |
| `map_dbl()` | double vector | a length-1 double |
| `map_int()` | integer vector | a length-1 integer |
| `map_chr()` | character vector | a length-1 string |
| `map_lgl()` | logical vector | a length-1 TRUE/FALSE |
| `sapply()` | guessed (base R) | does not error, simplifies inconsistently |

The decision rule: if you know the output is numeric, use `map_dbl()`. If the per-element result is a count of whole numbers, `map_int()` is stricter. When the shape is unpredictable, fall back to [map()](purrr-map-in-R.html), which never simplifies.

[KEY INSIGHT]
**Type-stable functions make bugs loud instead of silent.** With `sapply()`, one odd element can change the return type and break code three steps later. `map_dbl()` fails at the exact line where the assumption broke, which makes debugging far faster.

## Common pitfalls

**Most `map_dbl()` errors trace back to the function returning the wrong thing.** The fix is almost always to switch variants or reshape the per-element result.

**Pitfall 1: the function returns more than one value.** `map_dbl()` demands exactly length 1 per call.

```r title="Length-1 rule violation"
map_dbl(1:3, ~ c(.x, .x))
#> Error in `map_dbl()`:
#> i In index: 1.
#> Caused by error:
#> ! Result must be length 1, not 2.
```

Fix: use `map()` if you genuinely need multiple values per element, or summarise inside the lambda (`~ sum(c(.x, .x))`).

**Pitfall 2: the function returns text.** A character result cannot be coerced to a double.

```r title="Wrong variant for text output"
map_dbl(c("apple", "kiwi"), nchar)   # ok: nchar returns numbers
#> [1] 5 4
map_dbl(c("apple", "kiwi"), toupper) # toupper returns strings
#> Error in `map_dbl()`:
#> ! Can't coerce from a string to a double.
```

Fix: use `map_chr()` when the result is text.

**Pitfall 3: missing values silently propagate.** If an element contains `NA` and your function does not drop it, you get `NA` back, not an error.

```r title="NA leaks through without na.rm"
map_dbl(list(c(1, NA), c(3, 4)), mean)
#> [1] NA  3.5
```

Fix: pass `na.rm = TRUE` through `...` so every call drops missing values.

## Try it yourself

**Try it:** Use `map_dbl()` to get the maximum value of each numeric column in `iris[1:4]`. Save the result to `ex_maxes`.

```r title="Your turn: column maxima"
# Try it: max of each iris numeric column
ex_maxes <- # your code here

ex_maxes
#> Expected: 4 named values
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_maxes <- map_dbl(iris[1:4], max)
ex_maxes
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>          7.9          4.4          6.9          2.5
```

**Explanation:** `iris[1:4]` drops the non-numeric `Species` column, leaving a list of four numeric columns. `map_dbl()` applies `max()` to each and returns a named double vector.

</details>

## Related purrr functions

**`map_dbl()` is one node in the purrr map family.** These siblings cover the cases it cannot:

- [map()](purrr-map-in-R.html): returns a list when the per-element output is not a scalar.
- [map2()](purrr-map2-in-R.html): iterates over two vectors in lockstep.
- [pmap()](purrr-pmap-in-R.html): iterates over any number of inputs, including data frame rows.
- [imap()](purrr-imap-in-R.html): iterates with an index or name available as `.y`.
- [reduce()](purrr-reduce-in-R.html): collapses a list to a single value instead of one-per-element.

For the base R equivalents, see [lapply() and the apply family](base-lapply-in-R.html) and the broader [Functional Programming in R](Functional-Programming-in-R.html) guide.

## FAQ

**What is the difference between map_dbl() and map() in R?**

`map()` always returns a list, regardless of what the applied function produces. `map_dbl()` returns a flat numeric vector and enforces that every per-element result is a single double. Use `map()` when results vary in length or type, and `map_dbl()` when you know each call yields one number and want a clean atomic vector to compute on directly.

**Is map_dbl() faster than sapply()?**

Speed is roughly comparable for typical workloads; both loop in R. The real advantage of `map_dbl()` is predictability, not raw speed. `sapply()` infers the return type and can hand back a list, vector, or matrix depending on the data, while `map_dbl()` always returns a double vector or errors clearly.

**Why does map_dbl() say "Result must be length 1"?**

The function you passed returned a vector with more than one element for at least one input. `map_dbl()` requires exactly one double per element so it can build a flat result. Either summarise the result inside the function, for example `~ sum(.x)`, or switch to `map()` if you actually need multiple values per element.

**Can map_dbl() return integers?**

It returns doubles even when every value is a whole number, because the output type is fixed as double. If you specifically need an integer vector, use `map_int()` instead. It applies the same type check but stores the result as integers, which is stricter and slightly more memory efficient.

**How do I pass extra arguments to the function in map_dbl()?**

Add them after the function in the `...` slot. For example, `map_dbl(x, mean, na.rm = TRUE)` forwards `na.rm = TRUE` to every `mean()` call. This works for any named argument the applied function accepts, and is cleaner than wrapping the function in a lambda just to set one option.
