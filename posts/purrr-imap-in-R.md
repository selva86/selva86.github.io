---
title: "purrr imap() in R: Map Over Values and Their Names"
slug: "purrr-imap-in-R"
description: "Use purrr imap() to iterate over a list or vector and its names or index together in R. Covers imap_chr, imap_dbl, imap_dfr, iwalk, and 5 worked examples."
keywords: "purrr imap, imap function R, purrr imap examples, imap_chr, imap with index, imap vs map2, iwalk"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr imap|imap()|imap_chr()|imap_dbl()|iterate with index"
auto_link_case_sensitive: true
target_keyword: "purrr imap"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr imap() in R: Map Over Values and Their Names

<p class="lead">The <code>purrr</code> <code>imap()</code> function iterates over a list or vector and its names or index at the same time, exposing each value as <code>.x</code> and each name as <code>.y</code>. Type-safe variants (<code>imap_chr</code>, <code>imap_dbl</code>, <code>imap_dfr</code>) return an atomic vector or data frame instead of a list.</p>

[QUICK ANSWER]
imap(x, ~ paste(.y, .x))             # list; .y = name or index
imap_chr(x, ~ paste0(.y, ": ", .x))  # character vector
imap_dbl(x, ~ .x * .y)               # numeric vector
imap_int(x, ~ .y)                    # integer index per element
imap_dfr(x, ~ data.frame(id = .y))   # row-bind to a data frame
iwalk(x, ~ cat(.y, .x, "\n"))        # side effects, no return
imap(unnamed, ~ .y)                  # .y is 1, 2, 3, ...

[DECISION TREE: Is imap() the right tool?]
- need value plus its name or index: imap(x, ~ paste(.y, .x))
- value only, no index needed: map(x, ~ .x * 2)
- two separate inputs in lockstep: map2(a, b, ~ .x + .y)
- index plus side effects only: iwalk(x, ~ cat(.y))
- three or more inputs: pmap(list(a, b, c), sum)
- running total across elements: reduce(x, `+`)

## What imap() does in one sentence

**`imap(.x, .f)` calls `.f` once per element of `.x`, passing the element as `.x` and its name or integer position as `.y`.** It is exactly `map2(.x, names(.x) %||% seq_along(.x), .f)`, with the second input filled in for you.

When `.x` has names, `.y` is the name string. When `.x` is unnamed, `.y` is the integer index `1, 2, 3, ...`. That makes `imap()` the tool for any task where each result depends on both a value and where that value sits.

## Syntax

**`imap(.x, .f, ...)`. `.x` is the list or vector; `.f` is the function or lambda; `...` holds extra arguments passed to `.f`.**

Inside a purrr lambda, `.x` is the current element and `.y` is its name or index. There is no separate names argument, because `imap()` derives `.y` from `.x` itself. A two-argument function works too, with the value first and the name second.

```r title="imap exposes value and name"
library(purrr)

imap(c(a = 1, b = 2), ~ paste0(.y, " -> ", .x))
#> $a
#> [1] "a -> 1"
#> 
#> $b
#> [1] "b -> 2"
```

[TIP]
**Pick the typed variant whenever the output type is known.** `imap_chr()` returns a character vector and errors if any call returns something else, catching bugs at the call site. Reserve bare `imap()` for results that are genuinely mixed types or must stay a list.

## Five common patterns

### 1. Plain imap (list output)

**`imap()` with no suffix returns a list the same length and names as `.x`.** Use it when each call produces something that should not be flattened, such as a vector, a model, or a nested list.

```r title="Prefix each score with its subject"
scores <- list(math = 90, science = 85, art = 78)

imap(scores, ~ paste(.y, "scored", .x))
#> $math
#> [1] "math scored 90"
#> 
#> $science
#> [1] "science scored 85"
#> 
#> $art
#> [1] "art scored 78"
```

Each call sees the value as `.x` and the list name as `.y`, so the result keeps the original names.

### 2. Type-safe character output

**`imap_chr()` collapses the result into a named character vector.** It is the variant to reach for when every call returns a single string.

```r title="Type-safe character output"
imap_chr(scores, ~ paste0(.y, ": ", .x))
#>          math       science           art 
#>    "math: 90" "science: 85"     "art: 78"
```

The names of `scores` carry through to the names of the returned vector.

### 3. imap over an unnamed vector

**On an unnamed input, `.y` is the integer position, not a name.** This turns `imap()` into a clean way to number elements without writing a `seq_along()` loop.

```r title="Number elements of an unnamed vector"
fruits <- c("apple", "banana", "cherry")

imap_chr(fruits, ~ paste0(.y, ". ", .x))
#> [1] "1. apple"  "2. banana" "3. cherry"
```

Here `.y` takes the values `1`, `2`, and `3` because `fruits` has no names.

### 4. Combine results into a data frame

**`imap_dfr()` calls a function that returns a data frame, then row-binds every result.** It builds one tidy table from a list and its names.

```r title="Build a data frame, one row per element"
imap_dfr(scores, ~ data.frame(subject = .y, score = .x))
#>   subject score
#> 1    math    90
#> 2 science    85
#> 3     art    78
```

The list name becomes a column value, which is the usual reason to switch from a named list to a data frame.

### 5. iwalk for side effects

**`iwalk()` is the side-effect version of `imap()`.** It runs an index-aware function for printing, plotting, or writing files, and returns the input invisibly.

```r title="Print each item for its side effect"
iwalk(scores, ~ cat(.y, "=", .x, "\n"))
#> math = 90 
#> science = 85 
#> art = 78
```

Use `iwalk()` instead of `imap()` when you do not need the return value, only the action it performs.

[KEY INSIGHT]
**`imap(x, f)` is just `map2(x, names(x) %||% seq_along(x), f)`.** purrr fills the second input for you: names when `x` has them, integer positions when it does not. That single rule explains every `imap()` result. If `.y` shows up as `1, 2, 3` when you expected text, your input has no names.

## imap() vs map2() vs map()

**Three purrr functions cover index-aware iteration, differing in where the index comes from.** `imap()` derives it automatically, while `map2()` needs it spelled out.

| Approach | Second input | When to use |
|---|---|---|
| `map(x, .f)` | none | the result needs only the value |
| `imap(x, .f)` | `names(x)` or `seq_along(x)`, automatic | the result needs the value and its label |
| `map2(x, names(x), .f)` | explicit, you supply it | the labels come from somewhere other than `x` |
| `Map(f, x, names(x))` | explicit, base R | no tidyverse dependency wanted |

Reach for `imap()` when the index you want is the one already attached to `.x`. Reach for `map2()` when the second input is a separate object, such as a vector of file paths or a lookup table.

[NOTE]
**Coming from Python?** `imap(x, f)` on an unnamed input behaves like `enumerate(x)`, and on a named list like iterating `dict.items()`. In both cases you get the value and its position or key together in one pass.

## Common pitfalls

**Pitfall 1: assuming `.y` is always a name.** On an unnamed vector, `.y` is the integer index, not a string. Code like `imap_chr(unnamed, ~ toupper(.y))` fails because `toupper()` cannot uppercase a number. Check whether the input is named before relying on `.y`.

**Pitfall 2: confusing `.y` with a second value.** In `map2()`, `.y` is the matching element of a second input. In `imap()`, `.y` is the name or index of the same element. Carrying a `map2()` mental model into `imap()` leads to treating a label as data.

**Pitfall 3: partially named lists.** `imap()` only falls back to integer positions when `names(.x)` is entirely missing. If a list has names on some elements and not others, the unnamed ones give `.y` as `""`, an empty string, not an index. Name every element or none.

## Try it yourself

**Try it:** Use `imap_chr` to turn the named vector `c(a = 5, b = 10, c = 15)` into strings like `"a = 5"`. Save the result to `ex_tagged`.

```r title="Your turn: tag values with imap"
# Try it: imap_chr over a named numeric vector
ex_tagged <- # your code here

ex_tagged
#> Expected: 3 strings pairing each name with its value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_tagged <- imap_chr(c(a = 5, b = 10, c = 15), ~ paste0(.y, " = ", .x))
ex_tagged
#>       a       b       c 
#> "a = 5" "b = 10" "c = 15"
```

**Explanation:** `imap_chr()` walks the vector, exposing each value as `.x` and each name as `.y`. The lambda pastes them into one string per element, and the `_chr` suffix returns a character vector instead of a list.

</details>

## Related purrr functions

After imap, these functions round out index-aware and multi-input iteration:

- `imap_chr()`, `imap_dbl()`, `imap_int()`, `imap_lgl()`: type-safe variants returning atomic vectors
- `imap_dfr()`, `imap_dfc()`: combine results by row or column into a data frame
- `iwalk()`: run an index-aware function for side effects, returning the input invisibly
- `map2()`: iterate over two inputs when the second is a separate object, not names
- `map()`: single-input iteration when no index is needed
- `pmap()`: iterate over three or more inputs supplied as a list

The official argument reference lives in the [purrr imap documentation](https://purrr.tidyverse.org/reference/imap.html).

## FAQ

**What is the difference between map and imap in purrr?**

`map()` iterates over a single input and exposes each element as `.x`, with no access to position. `imap()` iterates over the same input but also exposes each element's name or integer index as `.y`. Use `map()` when the result depends only on the value, and `imap()` when it also depends on the label, such as numbering items or prefixing each value with its key.

**What is .y in imap?**

`.y` is the index of the current element. When the input has names, `.y` is the name string. When the input is unnamed, `.y` is the integer position: `1` for the first element, `2` for the second, and so on. This is the difference from `map2()`, where `.y` is an element of a separate second input rather than a label.

**Does imap work on unnamed lists and vectors?**

Yes. On an unnamed input, `imap()` uses `seq_along()` to supply integer positions as `.y`. So `imap_chr(c("a", "b"), ~ paste0(.y, .x))` returns `"1a"` and `"2b"`. This makes `imap()` a clean replacement for manual `seq_along()` loops when you need both the value and its index.

**What is the difference between imap and map2?**

`imap(x, f)` is shorthand for `map2(x, names(x) %||% seq_along(x), f)`. Both expose `.x` and `.y`, but `imap()` derives `.y` from the input itself, while `map2()` takes it as an explicit second argument. Use `imap()` when the second input is the names or index of the first, and `map2()` when it is a separate object.

**How do I use imap to write multiple files?**

Use `iwalk()`, the side-effect version of `imap()`. With a named list of data frames, `iwalk(dfs, ~ write.csv(.x, paste0(.y, ".csv")))` writes one file per element, naming each file after the list name. `iwalk()` returns the input invisibly, so it chains cleanly inside a pipeline.
