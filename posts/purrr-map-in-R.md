---
title: "purrr map() in R: Apply a Function (Tidyverse Style)"
slug: "purrr-map-in-R"
description: "Use purrr map() to apply a function to each element of a list or vector in R. Covers map_dbl, map_chr, map_dfr type-safe variants and 5 worked examples."
keywords: "purrr map, R map function, map_dbl R, purrr map vs lapply, tidyverse apply, R functional programming map"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr map|map()|map_dbl()|map_chr()|tidyverse map"
auto_link_case_sensitive: true
target_keyword: "purrr map"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr map() in R: Apply a Function (Tidyverse Style)

<p class="lead">The <code>map()</code> function in purrr applies a function to each element of a list or vector and returns a list. Type-safe variants (<code>map_dbl</code>, <code>map_chr</code>, <code>map_lgl</code>, <code>map_dfr</code>) return specific atomic types or data frames.</p>

[QUICK ANSWER]
map(1:5, ~ .x^2)                      # list output (lambda)
map_dbl(1:5, ~ .x^2)                  # numeric vector
map_chr(1:5, as.character)            # character vector
map_lgl(1:5, ~ .x > 2)                # logical vector
map_dfr(files, read.csv)              # combine to data frame (rbind)
map_dfc(list_of_vec, identity)        # combine to data frame (cbind)
map2(a, b, ~ .x + .y)                 # two inputs

[DECISION TREE: Which map variant?]
- list output: map()
- numeric vector: map_dbl()
- character vector: map_chr()
- logical vector: map_lgl()
- combine into data frame (rbind): map_dfr()
- combine into data frame (cbind): map_dfc()
- two inputs in lockstep: map2()
- N inputs: pmap()

## What map() does in one sentence

**`map(x, fn)` applies `fn` to each element of `x` and returns a LIST of results.** Type-safe variants like `map_dbl()` enforce a specific output type and error if the function returns something different.

`map()` is purrr's answer to base R's `lapply()`. The main differences: lambda syntax `~ .x + 1`, type-safe variants, and tighter integration with the tidyverse.

## Syntax

**`map(.x, .f, ...)`. `.x` is the input; `.f` is the function or lambda; `...` is extra args passed to `.f`.**

```r title="Square each element"
library(purrr)

map(1:5, ~ .x^2)
#> [[1]]
#> [1] 1
#> [[2]]
#> [1] 4
#> ...

map_dbl(1:5, ~ .x^2)
#> [1]  1  4  9 16 25
```

[TIP]
**Use `map_*()` variants whenever you know the expected output type.** `map_dbl()` errors if the function returns NA or a non-numeric. This catches bugs early. Reach for plain `map()` only when output types vary or you genuinely need a list.

## Five common patterns

### 1. Plain map (list output)

```r title="Default: returns a list"
result <- map(1:3, ~ .x * 10)
result
#> [[1]]
#> [1] 10
#> [[2]]
#> [1] 20
#> [[3]]
#> [1] 30
```

`~ .x * 10` is purrr's lambda syntax. `.x` is the input element.

### 2. Type-safe numeric output

```r title="map_dbl for numeric vector"
map_dbl(mtcars[, c("mpg","hp","wt")], mean)
#>      mpg       hp       wt
#> 20.09062 146.6875  3.21725
```

`map_dbl()` returns a numeric vector. Each call must return a single numeric; otherwise it errors.

### 3. Character output

```r title="map_chr for character vector"
map_chr(1:5, ~ paste("number", .x))
#> [1] "number 1" "number 2" "number 3" "number 4" "number 5"
```

### 4. Combine to data frame

```r title="map_dfr stacks list of df vertically"
make_df <- function(letter) {
  data.frame(letter = letter, n = 1:3)
}

map_dfr(c("a","b","c"), make_df)
#>   letter n
#> 1      a 1
#> 2      a 2
#> 3      a 3
#> 4      b 1
#> ...
```

`map_dfr()` calls the function on each input, then row-binds the results into one data frame.

### 5. Two inputs with map2

```r title="Apply pairwise to two inputs"
map2_dbl(1:3, 4:6, ~ .x + .y)
#> [1] 5 7 9
```

`map2()` (and `map2_*()` variants) iterates over TWO inputs in lockstep. `.x` is from the first; `.y` is from the second.

[KEY INSIGHT]
**`map_*()` type-safe variants are why purrr is preferred over base lapply/sapply.** `map_dbl(x, fn)` is `vapply(x, fn, numeric(1))`'s tidyverse equivalent: same type-safety, cleaner syntax. For tidyverse users, the `map_*` family replaces both `sapply` (auto-simplify) and `vapply` (type-safe).

## map() vs lapply() vs sapply() vs vapply()

**Four R iteration functions across base and tidyverse, with different output guarantees.**

| Function | Package | Output | Type-safe |
|---|---|---|---|
| `lapply()` | base | List | No |
| `sapply()` | base | Vector / matrix / list (auto) | No (surprises) |
| `vapply()` | base | Type-strict vector | Yes |
| `map()` | purrr | List | No |
| `map_*()` | purrr | Type-strict atomic | Yes |

`map()` is essentially `lapply()` with cleaner lambda syntax. The win is the typed `map_*()` family: you declare the output type, and a wrong return value errors instead of silently producing a list. This catches bugs early in pipelines.

## A practical purrr workflow

**Most real purrr usage chains a few common patterns into a single iteration pipeline.**

1. **Read N files**: `map_dfr(file_paths, read.csv)` returns one combined data frame.
2. **Fit N models**: `map(formulas, ~ lm(.x, data = my_data))` returns a list of model objects.
3. **Extract per-model summary**: `map_dbl(models, ~ summary(.x)$r.squared)` pulls a number from each.
4. **Tidy results**: `map_dfr(models, broom::tidy, .id = "model")` row-binds tidy results.

This pipeline (read, fit, extract, tidy) is the canonical purrr workflow. Each step picks the right `map_*` variant based on what the function returns.

## Common pitfalls

**Pitfall 1: forgetting the `_dbl` / `_chr` suffix.** `map(1:5, ~ .x^2)` returns a LIST, not a numeric vector. Use `map_dbl(1:5, ~ .x^2)` for vector output.

**Pitfall 2: lambda syntax confusion.** `~ .x + 1` is a function definition with `.x` as the argument. `\(x) x + 1` (R 4.1+) is the modern lambda syntax. Both work; pick one and stick with it.

[WARNING]
**`map_dbl` and friends ERROR if the function returns NA or wrong type unexpectedly.** A function that USUALLY returns a number but occasionally returns NULL crashes `map_dbl`. Use `purrr::possibly()` or `safely()` to wrap the function for graceful error handling.

## Try it yourself

**Try it:** Use `map_dbl` to compute the variance of each numeric column in `iris[, 1:4]`. Save to `ex_vars`.

```r title="Your turn: variance per column"
# Try it: map_dbl + var
ex_vars <- # your code here

ex_vars
#> Expected: 4 named numbers (variance of each numeric column)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_vars <- map_dbl(iris[, 1:4], var)
ex_vars
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width
#>    0.6856935    0.1899794    3.1162779    0.5810063
```

**Explanation:** `map_dbl(iris[, 1:4], var)` applies `var()` to each of the 4 numeric columns. The result is a named numeric vector with one variance per column.

</details>

## Related purrr functions

After mastering map, look at:

- `map_dbl()`, `map_chr()`, `map_lgl()`, `map_int()`: type-safe variants
- `map_dfr()`, `map_dfc()`: combine to data frame
- `map2()`, `pmap()`: multi-input variants
- `walk()`, `walk2()`: for side effects (no return)
- `safely()`, `possibly()`: error-handling wrappers
- `imap()`: map with index access

For pipelines that mostly use base R, `lapply` and `sapply` are equivalents.

## FAQ

**What is the difference between purrr map and base R lapply?**

Both apply a function to each element. `map()` returns a list (like lapply). `map_dbl/chr/lgl()` are type-safe variants that return specific atomic vectors. purrr also has lambda syntax (`~ .x + 1`) and tidyverse integration.

**How do I write an anonymous function in purrr map?**

Use `~ .x + 1` (purrr lambda) or `\(x) x + 1` (R 4.1+ native lambda). Both work in purrr. The `.x` is the input element placeholder.

**How do I get a vector instead of list from purrr map?**

Use the type-safe variant: `map_dbl()` for numeric, `map_chr()` for character, `map_lgl()` for logical, `map_int()` for integer. They error if the function returns the wrong type.

**How do I apply a function to two inputs at once?**

Use `map2()`: `map2(x, y, ~ .x + .y)`. For more than 2, use `pmap()` with a list of inputs.

**How do I combine map output into a data frame?**

`map_dfr(x, fn)` row-binds the function's outputs (each output should be a data frame). `map_dfc(x, fn)` column-binds them. Both are common patterns for reading multiple files into one data frame.
