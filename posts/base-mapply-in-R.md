---
title: "mapply() in R: Apply a Function Over Multiple Arguments"
slug: "base-mapply-in-R"
description: "Use base R mapply() to apply a function in parallel across multiple vectors or lists. Covers syntax, 5 examples, mapply vs Map, SIMPLIFY, and pitfalls."
keywords: "base mapply, mapply function R, base mapply examples, R mapply multiple arguments, mapply vs Map, mapply vs sapply, vectorize function R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "mapply()|base mapply|base::mapply()|multivariate apply|parallel apply"
auto_link_case_sensitive: true
target_keyword: "base mapply"
sibling_block_enabled: true
difficulty: "Beginner"
---

# mapply() in R: Apply a Function Over Multiple Arguments

<p class="lead">The base R <code>mapply()</code> function is a multivariate version of <code>sapply()</code>. It applies a function in parallel across the elements of two or more vectors or lists, pairing the first elements, then the second, and so on, then simplifying the result.</p>

[QUICK ANSWER]
mapply(function(x, y) x + y, 1:3, 4:6)        # parallel add: 5 7 9
mapply(max, c(1, 5, 3), c(4, 2, 6))           # element-wise max
mapply(rep, 1:3, times = 5)                   # matrix output
mapply(paste, c("Mr", "Mrs"), c("Jones", "Smith"))   # paired paste
mapply(fn, x, y, SIMPLIFY = FALSE)            # force list (= Map)
mapply(fn, x, y, MoreArgs = list(sep = "-"))  # extra fixed args
mapply(fn, x, y, USE.NAMES = FALSE)           # drop names

[DECISION TREE: Is mapply() the right tool?]
- apply fn to pairs from 2+ vectors: mapply()
- apply fn to pairs, want list output: Map()
- apply fn to one vector, simplify: sapply()
- apply fn to one vector, always list: lapply()
- apply over rows or cols of a matrix: apply()
- typed parallel apply, tidyverse style: purrr::map2_dbl(), pmap()
- make a non-vectorized fn vectorized: Vectorize()

## What mapply() does in one sentence

**`mapply(FUN, ..., MoreArgs, SIMPLIFY, USE.NAMES)` calls `FUN` on the first elements of each `...` argument, then on the second, and so on, then simplifies.** It is the multi-argument cousin of `sapply()`: where sapply iterates over one vector, mapply zips two or more in lockstep.

If every call returns a scalar of the same type, you get a vector. If every call returns a same-length vector, you get a matrix. Otherwise it falls back to a list (like `Map()`).

## Syntax

**`mapply(FUN, ..., MoreArgs = NULL, SIMPLIFY = TRUE, USE.NAMES = TRUE)`. The `...` arguments are the vectors zipped in parallel; `MoreArgs` is a list of extra arguments passed unchanged to every call.**

```r title="The minimal mapply call"
mapply(function(x, y) x + y, 1:3, 4:6)
#> [1] 5 7 9
```

The function receives `x = 1, y = 4` on the first call, `x = 2, y = 5` on the second, `x = 3, y = 6` on the third. The three scalar results are simplified to a length-3 vector.

[TIP]
**`mapply` recycles shorter vectors silently.** `mapply(sum, 1:6, 1:2)` pairs `(1,1), (2,2), (3,1), (4,2), ...` and returns 6 values. If you do not want recycling, check lengths first or use `purrr::map2()` which errors on length mismatch.

## Five common patterns

### 1. Element-wise arithmetic across two vectors

```r title="Pairwise maximum of two vectors"
mapply(max, c(1, 5, 3, 9), c(4, 2, 6, 7))
#> [1] 4 5 6 9
```

For each position, `max()` runs on a pair from the two inputs. The result is the parallel maximum, equivalent to `pmax()` but generalizable to any function.

### 2. Function returning vectors gives a matrix

```r title="Repeat each value a different number of times"
mapply(rep, 1:3, times = 4:6)
#> [[1]]
#> [1] 1 1 1 1
#>
#> [[2]]
#> [1] 2 2 2 2 2
#>
#> [[3]]
#> [1] 3 3 3 3 3 3
```

When the per-call results have DIFFERENT lengths, mapply falls back to a list. If you fix `times = 5` so every call returns the same length, you get a matrix:

```r title="Fixed-length vectors collapse to a matrix"
mapply(rep, 1:3, times = 5)
#>      [,1] [,2] [,3]
#> [1,]    1    2    3
#> [2,]    1    2    3
#> [3,]    1    2    3
#> [4,]    1    2    3
#> [5,]    1    2    3
```

Each column is the output of one call.

### 3. Pass extra fixed arguments with MoreArgs

```r title="Format pairs with a fixed separator"
mapply(paste, c("Mr", "Mrs", "Dr"), c("Jones", "Smith", "Lee"),
       MoreArgs = list(sep = " - "))
#> [1] "Mr - Jones"   "Mrs - Smith"  "Dr - Lee"
```

`MoreArgs` is a named list of arguments forwarded unchanged to every call. Without `MoreArgs`, R would try to zip `sep` in parallel too, which is rarely what you want.

### 4. Disable simplification to get a list

```r title="mapply with SIMPLIFY = FALSE equals Map"
mapply(function(x, y) c(min = x, max = y),
       c(1, 5, 3), c(9, 7, 8), SIMPLIFY = FALSE)
#> [[1]]
#> min max
#>   1   9
#>
#> [[2]]
#> min max
#>   5   7
#>
#> [[3]]
#> min max
#>   3   8
```

`SIMPLIFY = FALSE` always returns a list, regardless of per-call return shape. This is exactly what `Map()` does, just spelled differently.

### 5. Build a data frame from parallel lists

```r title="Tabulate parallel results"
ids   <- c("A", "B", "C")
xs    <- c(10, 20, 30)
ys    <- c(0.1, 0.2, 0.3)

result <- mapply(function(id, x, y) data.frame(id = id, ratio = x * y),
                 ids, xs, ys, SIMPLIFY = FALSE)
do.call(rbind, result)
#>   id ratio
#> 1  A     1
#> 2  B     4
#> 3  C     9
```

The pattern is: zip with `SIMPLIFY = FALSE` to get a list of data frames, then `do.call(rbind, ...)` (or `dplyr::bind_rows()`) to stack them.

[KEY INSIGHT]
**`mapply()` is the "zip and apply" pattern from functional programming.** Two vectors of equal length act like a list of pairs; mapply walks them in lockstep and calls the function on each pair. The closest tidyverse equivalent is `purrr::map2()` for two inputs and `purrr::pmap()` for an arbitrary number.

## mapply vs Map vs purrr vs Vectorize

**Each parallel-apply function trades off type safety, length checking, and simplicity differently.** Use this table to pick the one that matches your codebase and tolerance for surprise.

| Function | Inputs | Return | When to use |
|---|---|---|---|
| `mapply()` | 2+ vectors/lists | Vector, matrix, or list (auto) | Quick parallel apply with simplification |
| `Map()` | 2+ vectors/lists | Always list | Same as `mapply(SIMPLIFY = FALSE)` |
| `purrr::map2()` | Exactly 2 | List (or typed with `_dbl`, `_chr`) | Tidyverse style, type-safe |
| `purrr::pmap()` | List of any arity | List (or typed variants) | 3+ parallel inputs, named arguments |
| `Vectorize()` | A scalar fn | Vectorized fn | One-shot wrapper to make a fn vectorized; calls mapply under the hood |
| `pmax()`, `pmin()` | 2+ numeric vectors | Numeric vector | Built-in pairwise extrema (faster than mapply) |

Decision rule:

- One input: use `sapply()` or `lapply()`.
- Two inputs, tidyverse style: use `purrr::map2()` or `map2_dbl()` for type safety.
- Two or more inputs, base R: use `mapply()` for vector/matrix output, `Map()` for list output.
- You have a scalar function and want a vectorized one for later use: `Vectorize()`.

## Common pitfalls

**Pitfall 1: silent recycling.** `mapply(sum, 1:6, 1:2)` does not error; it recycles `1:2` to length 6. Check `length(x) == length(y)` before calling, or use `purrr::map2()` which errors.

**Pitfall 2: unexpected matrix vs vector.** A function that USUALLY returns a scalar but occasionally returns a 2-vector will flip the output shape from vector to matrix. Use `SIMPLIFY = FALSE` to force list output, then post-process.

**Pitfall 3: passing fixed args without MoreArgs.** `mapply(paste, x, y, sep = "-")` works only because `paste` accepts named args directly; for many functions, naming the fixed arg inline confuses mapply's zip logic. Put fixed args in `MoreArgs = list(...)` for safety.

[WARNING]
**`mapply()` is slower than `pmax()`, `pmin()`, or direct vectorized arithmetic for built-in math.** Prefer `x + y` over `mapply("+", x, y)` and `pmax(x, y)` over `mapply(max, x, y)`. Reserve mapply for cases where the per-pair function is genuinely non-vectorized.

## Try it yourself

**Try it:** Use mapply to compute the area of three rectangles given parallel vectors of widths and heights. Save to `ex_areas`.

```r title="Your turn: rectangle areas"
widths  <- c(3, 5, 7)
heights <- c(4, 2, 6)

ex_areas <- # your code here

ex_areas
#> Expected: c(12, 10, 42)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_areas <- mapply(function(w, h) w * h, widths, heights)
ex_areas
#> [1] 12 10 42
```

**Explanation:** `mapply` zips `widths` and `heights` and calls the anonymous function on each pair. Since every call returns one number, mapply simplifies to a numeric vector. For built-in arithmetic like this, `widths * heights` is faster and equivalent.

</details>

## Related apply functions

After mastering mapply, look at:

- `sapply()`: single-vector apply with simplification
- `lapply()`: single-vector apply, always a list
- `vapply()`: type-strict single-vector apply
- `apply()`: row-wise or column-wise apply over a matrix
- `Map()`: same as `mapply(SIMPLIFY = FALSE)`
- `purrr::map2()`, `purrr::pmap()`: tidyverse parallel apply with typed variants
- `Vectorize()`: build a vectorized version of a scalar function (uses mapply internally)

For a deep dive on the apply family, see the official R reference at [stat.ethz.ch mapply](https://stat.ethz.ch/R-manual/R-devel/library/base/help/mapply.html).

## FAQ

**What is the difference between mapply and sapply in R?**

`sapply()` applies a function to ONE list or vector. `mapply()` applies a function to TWO OR MORE in parallel, pairing the first elements, then the second, and so on. Both simplify the result the same way: vector if possible, matrix if same-length vectors, otherwise list. Think of mapply as "sapply for multiple inputs zipped together."

**What is the difference between mapply and Map?**

`Map(f, x, y)` is exactly `mapply(f, x, y, SIMPLIFY = FALSE, USE.NAMES = FALSE)`. They are the same engine; `Map()` is a thin wrapper that always returns a list and drops names. Use `Map()` when you want list output for sure; use `mapply()` when you want automatic simplification to a vector or matrix.

**How does mapply work with multiple arguments?**

The first elements of every `...` argument form the first call: `FUN(arg1[1], arg2[1], arg3[1], ...)`. The second elements form the second call, and so on. If inputs have different lengths, the shorter ones are silently recycled. Use `MoreArgs = list(...)` for arguments that should stay fixed across all calls.

**When should I use mapply vs purrr::map2?**

Use `mapply()` if you want a base R solution with auto-simplification to a vector or matrix. Use `purrr::map2()` (or its typed variants `map2_dbl`, `map2_chr`) if you are already in the tidyverse, want strict type checking, or want a strict length-equality check instead of silent recycling.

**Why does mapply return a matrix sometimes and a vector other times?**

It depends on what `FUN` returns across all calls. If every call returns a single scalar, you get a vector. If every call returns a same-length vector, the vectors become columns of a matrix. If returns have mixed lengths or types, mapply falls back to a list. To get a predictable shape, set `SIMPLIFY = FALSE` and post-process explicitly.
