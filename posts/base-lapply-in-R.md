---
title: "lapply() in R: Apply a Function to a List or Vector"
slug: "base-lapply-in-R"
description: "Use base R lapply() to apply a function to every element of a list or vector and get a list back. Covers vs sapply, vs map, FUN argument, 5 examples."
keywords: "lapply in R, lapply vs sapply, R apply function to list, base R lapply, lapply examples, R map function"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "lapply()|base lapply|apply function to list|R lapply|map function"
auto_link_case_sensitive: true
target_keyword: "lapply in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# lapply() in R: Apply a Function to a List or Vector

<p class="lead">The <code>lapply()</code> function in base R applies a function to every element of a list or vector and returns a LIST of the results. Unlike <code>sapply()</code>, it always returns a list regardless of result shapes.</p>

[QUICK ANSWER]
lapply(1:5, function(x) x^2)               # list of 5 numbers
lapply(1:5, sqrt)                          # list of 5 sqrt values
lapply(list(a=1:3, b=4:6), mean)           # list with names
lapply(mtcars, mean)                       # one mean per column
result <- lapply(files, read.csv)          # read many files into list
do.call(rbind, lapply(...))                # combine list of df into one df
purrr::map(1:5, ~ .^2)                     # tidyverse equivalent

[DECISION TREE: Is lapply() the right tool?]
- apply fn, want list output: lapply()
- apply fn, want simplified output: sapply()
- apply fn, type-strict output: vapply()
- functional programming: purrr::map()
- combine result into data frame: bind_rows(lapply(...)) or purrr::map_dfr
- multi-arg apply: mapply() or purrr::map2
- apply across many cols of df: lapply(df, fn) or summarise across

## What lapply() does in one sentence

**`lapply(X, FUN)` applies `FUN` to each element of `X` and returns a list of length equal to `X`, with each element being the result of one call.** Output structure is always a list, regardless of what FUN returns.

`lapply` is the workhorse of "apply this function to every X" patterns. The list output is consistent and predictable, making it safer for production code than `sapply()`.

## Syntax

**`lapply(X, FUN, ...)`. X is a list or vector; FUN is the function; `...` passes extra arguments to FUN.**

```r title="Apply sqrt to a vector"
lapply(1:5, sqrt)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 1.414214
#>
#> [[3]]
#> [1] 1.732051
#>
#> [[4]]
#> [1] 2
#>
#> [[5]]
#> [1] 2.236068
```

Each call returns one number; the result is a list of 5 single-number elements.

[TIP]
**To convert a list to a vector after lapply, use `unlist()` or `do.call(c, ...)`.** `unlist(lapply(1:5, sqrt))` returns a flat numeric vector. `sapply()` would have done this automatically, but `lapply` + `unlist` makes the conversion explicit.

## Five common patterns

### 1. Apply to a vector

```r title="Square each integer"
lapply(1:5, function(x) x^2)[1:2]
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 4
```

### 2. Apply to a named list

```r title="Mean of each list element"
result <- lapply(list(a = 1:3, b = 4:6, c = 7:9), mean)
result
#> $a
#> [1] 2
#> $b
#> [1] 5
#> $c
#> [1] 8
```

Names are preserved: result is a named list.

### 3. Apply over data frame columns

```r title="Mean of every numeric column"
lapply(mtcars[, c("mpg","hp","wt")], mean)
#> $mpg
#> [1] 20.09062
#> $hp
#> [1] 146.6875
#> $wt
#> [1] 3.21725
```

Data frames ARE lists of columns. lapply iterates column-wise. To get a vector instead of list, use sapply or `unlist()`.

### 4. Read multiple files

```r title="Read N CSVs into a list of data frames"
# files <- list.files("data/", "*.csv", full.names = TRUE)
# dfs <- lapply(files, read.csv)
# Demo:
dfs <- lapply(c("a", "b", "c"), function(x) data.frame(letter = x, n = 1:3))

length(dfs)
#> [1] 3
```

Common pattern: read many files, get a list of data frames. Combine with `do.call(rbind, dfs)` or `dplyr::bind_rows(dfs)` for a single combined data frame.

### 5. Pass extra arguments through ...

```r title="Pass na.rm = TRUE to mean"
ll <- list(c(1, 2, NA), c(3, NA, 5))
lapply(ll, mean, na.rm = TRUE)
#> [[1]]
#> [1] 1.5
#>
#> [[2]]
#> [1] 4
```

`mean` is called with `(element, na.rm = TRUE)` for each list element. Extra args after FUN go through.

[KEY INSIGHT]
**`lapply()` is the safest of the apply family because it ALWAYS returns a list, regardless of what the function returns.** `sapply()` may unexpectedly return a matrix if all calls produce same-length vectors. `vapply()` errors on type mismatch. lapply quietly handles any shape, useful when you don't know what FUN will return.

## lapply vs sapply vs purrr::map

| Function | Output | When to use |
|---|---|---|
| `lapply()` | List | When you want a list (predictable) |
| `sapply()` | Vector / matrix / list (auto) | Interactive, simple cases |
| `vapply()` | Vector of declared type | Production, type-safe |
| `purrr::map()` | List (tidyverse) | Tidyverse pipelines |
| `purrr::map_dbl()` | Numeric vector | Type-safe tidyverse |

When to use which:

- Use `lapply()` when you want predictable list output.
- Use `sapply()` for quick interactive simplification.
- Use `vapply()` or `purrr::map_*()` for type-safe production code.

## Common pitfalls

**Pitfall 1: confusing lapply with for loops.** `lapply` is a FUNCTION; it returns a value. `for` loops are statements that update side effects. To collect results from a loop, use lapply or pre-allocate a list and assign by index.

**Pitfall 2: forgetting to unlist for vector ops.** `mean(lapply(x, fn))` errors because `mean` does not work on a list. Use `unlist()` or `sapply()`: `mean(unlist(lapply(x, fn)))`.

[WARNING]
**`lapply` does NOT modify in place.** `lapply(my_list, fn)` returns a NEW list; the original `my_list` is unchanged. To update the original, assign: `my_list <- lapply(my_list, fn)`.

## Try it yourself

**Try it:** Use `lapply` to compute the standard deviation of each numeric column in `mtcars`. Save to `ex_sds`.

```r title="Your turn: sd per column"
# Try it: sd of each col
ex_sds <- # your code here

ex_sds[c("mpg","hp")]
#> Expected: list with mpg ~ 6.03, hp ~ 68.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_sds <- lapply(mtcars, sd)
ex_sds[c("mpg","hp")]
#> $mpg
#> [1] 6.026948
#>
#> $hp
#> [1] 68.56287
```

**Explanation:** `lapply(mtcars, sd)` applies `sd()` to each column. Result is a named list. To get a numeric vector instead, use `sapply` or `unlist(lapply(...))`.

</details>

## Related apply functions

After mastering lapply, look at:

- `sapply()`: simplifies output to vector/matrix when possible
- `vapply()`: type-strict version for safety
- `mapply()`: multi-argument apply
- `apply()`: for matrix rows/columns specifically
- `purrr::map()` and family: tidyverse alternatives
- `Map()`: multi-list apply (functional programming style)

For data frame column transforms, `dplyr::mutate(across(...))` is more idiomatic than `lapply`.

## FAQ

**What is the difference between lapply and sapply in R?**

`lapply()` always returns a LIST. `sapply()` tries to simplify the result to a vector or matrix; falls back to a list if shapes vary. Use lapply for predictable list output; sapply for convenient interactive use.

**How do I apply a function to each element in R?**

`lapply(x, fn)` for list output. `sapply(x, fn)` for simplified output. `purrr::map(x, fn)` for tidyverse style. All apply `fn` to each element of `x`.

**How do I pass extra arguments to FUN in lapply?**

After FUN, list extra arguments: `lapply(x, fn, arg1 = val1, arg2 = val2)`. They are passed to fn for every call.

**How do I combine the results of lapply into a single data frame?**

Use `do.call(rbind, lapply(...))` or `dplyr::bind_rows(lapply(...))`. Both stack list-of-data-frames into one data frame vertically.

**Should I use lapply or for loop?**

For collecting results, `lapply` is cleaner and idiomatic. For side effects (printing, writing files), a for loop is fine. Performance is similar in modern R; readability is the main concern.
