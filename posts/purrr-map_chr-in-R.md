---
title: "purrr map_chr() in R: Map a List to a Character Vector"
slug: purrr-map_chr-in-R
description: "Learn purrr map_chr() in R to apply a function over a list or vector and return a type-stable character vector, with worked examples and common pitfalls."
keywords: "purrr map_chr, map_chr function R, purrr map_chr examples, R map_chr character vector, map over list R, map_chr vs map"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "map_chr()|purrr map_chr|purrr::map_chr()|map_chr function|character vector from a list|map over a list returning strings"
auto_link_case_sensitive: true
target_keyword: "purrr map_chr"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr map_chr() in R: Map a List to a Character Vector

<p class="lead">purrr map_chr() applies a function to every element of a list or vector and always returns a character vector, erroring loudly if any result is not a single string.</p>

[QUICK ANSWER]
map_chr(x, f)                     # apply f, return a character vector
map_chr(x, ~ paste0(.x, "!"))     # formula shorthand for f
map_chr(people, "name")           # extract element "name" from each item
map_chr(people, 1)                # extract element by position
map_chr(x, f, .default = NA)      # fallback when the element is missing
map_chr(letters, toupper)         # works on atomic vectors too

[DECISION TREE: Is map_chr() the right tool?]
- need a character vector out: map_chr(x, f)
- need a numeric vector instead: map_dbl(x, f)
- need a logical (TRUE/FALSE) vector: map_lgl(x, f)
- output length varies per element: map(x, f)
- iterate over two lists in parallel: map2_chr(x, y, f)
- only side effects, no return value: walk(x, f)

## What map_chr() does in one sentence

**map_chr() is the string-returning member of the purrr map family.** You hand it a list or vector and a function, and it runs that function once per element, then binds the results into a single character vector. The "chr" suffix is a contract: every call must produce exactly one string per element, or the function stops with an error.

This type stability is the whole point. A plain `map()` returns a list, which forces you to unlist or flatten afterward. `map_chr()` guarantees a flat character vector up front, so downstream code never has to guess what came back.

## Syntax

**The signature takes the data first, then the function.** Like every map variant, `map_chr()` follows the purrr argument order.

```r title="The map_chr signature"
library(purrr)

# map_chr(.x, .f, ..., .default = NULL)
#   .x        a list or atomic vector to iterate over
#   .f        a function, formula (~), or extractor (name/position)
#   ...       extra arguments passed on to .f
#   .default  value to use when an extracted element is missing
```

The `.f` argument is flexible. It accepts a named function like `toupper`, a formula such as `~ paste0(.x, "!")` where `.x` is the current element, or a string or integer that acts as an extractor for nested data.

```r title="Three ways to write the function"
library(purrr)

map_chr(c("ada", "grace"), toupper)         # named function
#> [1] "ADA"   "GRACE"

map_chr(1:3, ~ paste0("row-", .x))          # formula with .x
#> [1] "row-1" "row-2" "row-3"
```

## Worked examples

**Example 1 reports the class of every column in a data frame.** A data frame is a list of columns, so mapping over it visits one column at a time.

```r title="Class of each iris column"
library(purrr)

map_chr(iris, class)
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>    "numeric"    "numeric"    "numeric"    "numeric"     "factor"
```

The result keeps the column names, because `map_chr()` preserves the names of `.x`. This makes it ideal for building labelled summaries.

**Example 2 builds a formatted label per column with a formula.** The `.x` placeholder refers to each column vector in turn.

```r title="Formatted mean per column"
library(purrr)

cols <- mtcars[c("mpg", "hp", "wt")]
map_chr(cols, ~ paste0("mean = ", round(mean(.x), 1)))
#>             mpg              hp              wt
#> "mean = 20.1" "mean = 146.7"   "mean = 3.2"
```

**Example 3 extracts a field from a list of records.** When `.f` is a string, `map_chr()` plucks that named element from each item.

```r title="Extract a field from nested records"
library(purrr)

people <- list(
  list(name = "Ada",   role = "engineer"),
  list(name = "Linus", role = "developer"),
  list(name = "Grace", role = "admiral")
)

map_chr(people, "name")
#> [1] "Ada"   "Linus" "Grace"
```

**Example 4 supplies a fallback for missing fields.** If a record lacks the requested element, `.default` prevents the error.

```r title="Handle a missing element with .default"
library(purrr)

map_chr(people, "email", .default = NA_character_)
#> [1] NA NA NA
```

[TIP]
**Reach for the typed variant that matches your output.** Use `map_chr()` for strings, `map_dbl()` for numbers, and `map_lgl()` for TRUE/FALSE. Typed variants fail fast on the wrong type, which catches bugs that a plain `map()` would silently pass downstream.

## map_chr() vs map() and the other variants

**The difference is the shape and type of what comes back.** All variants iterate identically; they differ only in how results are combined.

| Function | Returns | Use when |
|---|---|---|
| `map()` | A list | Each result has a different type or length |
| `map_chr()` | Character vector | Each result is one string |
| `map_dbl()` | Double vector | Each result is one number |
| `map_lgl()` | Logical vector | Each result is one TRUE/FALSE |
| `map2_chr()` | Character vector | You iterate over two inputs in parallel |

The contrast with `map()` is clearest on the same input:

```r title="map returns a list, map_chr returns a vector"
library(purrr)

map(1:3, ~ as.character(.x * 10))
#> [[1]]
#> [1] "10"
#>
#> [[2]]
#> [1] "20"
#>
#> [[3]]
#> [1] "30"

map_chr(1:3, ~ as.character(.x * 10))
#> [1] "10" "20" "30"
```

**Decision rule:** if you know every result is a single string, use `map_chr()`. If results vary in length or type, use `map()` and post-process.

[KEY INSIGHT]
**The type suffix is a runtime test, not just a convenience.** `map_chr()` checks every result and stops on the first one that is not a length-one string. That turns a vague "my output looks wrong" bug into a precise error at the exact failing index.

## Common pitfalls

**Pitfall 1: the function returns more than one value.** `map_chr()` demands exactly one string per element.

```r title="Length error when output is not scalar"
library(purrr)

map_chr(list(1:2, 3:4), ~ as.character(.x))
#> Error in `map_chr()`:
#> i In index: 1.
#> Caused by error:
#> ! Result must be length 1, not 2.
```

The fix is to collapse the result, for example `~ paste(as.character(.x), collapse = ",")`, or switch to `map()` if you genuinely need varying lengths.

**Pitfall 2: extracting a missing element without `.default`.** Plucking a name that some records lack throws an error unless you provide a fallback, as shown in Example 4.

**Pitfall 3: using `map_chr()` for side effects.** If you only want to print or write each element, `map_chr()` still forces a character return. Use `walk()` instead, which runs the function for its side effect and returns the input invisibly.

[WARNING]
**map_chr() does not coerce numbers to strings for you in purrr 1.0+.** If `.f` returns a double, you get a type error, not an automatic conversion. Wrap the result in `as.character()` or `format()` so the output is genuinely a string.

## Try it yourself

**Try it:** Use `map_chr()` to return the type of each column in `mtcars` as a character vector. Save the result to `ex_types`.

```r title="Your turn: column types of mtcars"
# Try it: return the class of every mtcars column
ex_types <- # your code here

ex_types
#> Expected: a named character vector, all "numeric"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(purrr)

ex_types <- map_chr(mtcars, class)
ex_types
#> mpg  cyl disp   hp drat   wt qsec   vs   am gear carb
#> "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric" "numeric"
```

**Explanation:** `mtcars` is a list of columns, so `map_chr()` calls `class()` on each one. Because every column is numeric, the result is a named character vector of `"numeric"` values.

</details>

## Related purrr functions

**These functions pair naturally with map_chr() in everyday pipelines.**

- `map()`: the untyped base case that returns a list when results vary.
- `map_dbl()`: the numeric sibling for results that are single numbers.
- `map2_chr()`: iterates over two inputs in parallel to build strings.
- `imap_chr()`: passes the index or name alongside each element.
- `walk()`: runs a function purely for side effects with no return value.

[NOTE]
**Coming from base R?** `map_chr(x, f)` is equivalent to `vapply(x, f, character(1))`. Both enforce a one-string-per-element contract; purrr just adds formula shorthand and the `.default` argument.

## FAQ

**What is the difference between map and map_chr in purrr?**

`map()` always returns a list, regardless of what the function produces. `map_chr()` returns a flat character vector and requires every result to be a single string. Use `map_chr()` when you know the output is text and want a vector you can use directly; use `map()` when results differ in type or length and you will process them afterward.

**Why does map_chr() throw a "Result must be length 1" error?**

That error means the function returned a vector with more than one element for at least one item. `map_chr()` can only combine length-one results into its output vector. The error reports the failing index. Either collapse the result with `paste(collapse = ...)` or switch to `map()` if varying lengths are expected.

**How do I extract a named element from a list with map_chr()?**

Pass the element name as a string in the `.f` position, like `map_chr(records, "name")`. purrr treats a string `.f` as an extractor that plucks that element from each item. Add `.default = NA_character_` so missing elements return `NA` instead of stopping with an error.

**Does map_chr() keep the names of the input?**

Yes. If the input list or vector has names, `map_chr()` carries them onto the output character vector. This is why `map_chr(iris, class)` returns a vector labelled with the column names, which makes the result self-documenting.

**Can map_chr() iterate over a plain atomic vector?**

Yes. Although purrr is often shown with lists, `map_chr()` accepts any atomic vector. For example `map_chr(letters[1:3], toupper)` returns `c("A", "B", "C")`. Each element is passed to the function one at a time, exactly as with a list.
