---
title: "base Map() in R: Zip Lists and Apply a Function in Parallel"
slug: "base-Map-in-R"
description: "Use base R Map() to apply a function in parallel across multiple lists or vectors and always get a list back. Syntax, 5 examples, Map vs mapply, pitfalls."
keywords: "base Map, Map function R, base Map examples, R Map multiple lists, Map mapply difference, parallel apply R, Map zip lists R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "Map()|base Map|base::Map()|parallel apply|zip and apply"
auto_link_case_sensitive: true
target_keyword: "base Map"
sibling_block_enabled: true
difficulty: "Beginner"
---

# base Map() in R: Zip Lists and Apply a Function in Parallel

<p class="lead">The base R <code>Map()</code> function walks two or more lists or vectors in lockstep, applies a function to each tuple of elements, and always returns a list. It is the list-returning sibling of <code>mapply()</code>, equivalent to <code>mapply(FUN, ..., SIMPLIFY = FALSE, USE.NAMES = FALSE)</code>.</p>

[QUICK ANSWER]
Map(`+`, 1:3, 4:6)                              # element-wise add, list out
Map(function(a, b) a * b, 1:3, 4:6)             # custom fn over two vectors
Map(list, name = c("a", "b"), value = 1:2)      # build named records
Map(paste, c("Mr", "Mrs"), c("Jones", "Smith")) # paired paste, list out
Map(head, list(iris, mtcars), n = c(2, 3))      # different fixed args per call
Map(function(x) x^2, 1:5)                       # one input acts like lapply
do.call(rbind, Map(data.frame, id = 1:3, x = 4:6))  # row-bind list of frames

[DECISION TREE: Is Map() the right tool?]
- apply fn to pairs from 2+ vectors, want list: Map()
- apply fn to pairs, want vector or matrix: mapply()
- apply fn to one vector, always list: lapply()
- apply fn to one vector, simplify: sapply()
- combine pairs with a binary fn into one value: Reduce()
- typed parallel apply, tidyverse style: purrr::pmap() or map2()
- iterate over rows of a data frame: Map() on its columns, or purrr::pmap()

## What Map() does in one sentence

**`Map(f, ...)` calls `f` on the first elements of every `...` argument, then on the second, and so on, and returns the results as a list.** It is the parallel-apply primitive whose output shape is always a list, never a vector or matrix.

That guarantee matters. Most parallel-apply tools in base R (`sapply`, `mapply`, `vapply`) decide their output shape from the data, which can change between runs. Map() never surprises you: in equals lists, out equals a list, length equals the longest input.

## Syntax

**`Map(f, ...)` takes a function `f` and two or more vectors or lists in `...`, then returns a list of the same length as the longest input.** There are no `SIMPLIFY`, `MoreArgs`, or `USE.NAMES` arguments; those belong to `mapply()`.

```r title="The minimal Map call"
Map(function(x, y) x + y, 1:3, 4:6)
#> [[1]]
#> [1] 5
#>
#> [[2]]
#> [1] 7
#>
#> [[3]]
#> [1] 9
```

The function receives `x = 1, y = 4` first, then `x = 2, y = 5`, then `x = 3, y = 6`. Three results, packaged as a length-3 list. The same call with `mapply` would simplify to `c(5, 7, 9)`; Map keeps each result in its own slot.

[NOTE]
**Map() is implemented as `mapply(FUN, ..., SIMPLIFY = FALSE, USE.NAMES = FALSE)`.** That is literally the body of the function in R's source. Pick Map when you want list output without typing the four extra arguments, and reach for mapply when you want the simplified vector or matrix.

## Five common patterns

### 1. Build named records from parallel vectors

```r title="Zip name and value into a list of records"
ids    <- c("alpha", "beta", "gamma")
scores <- c(0.81, 0.74, 0.92)

records <- Map(function(id, score) list(id = id, score = score), ids, scores)
records[[1]]
#> $id
#> [1] "alpha"
#>
#> $score
#> [1] 0.81
```

Each list element is a fully named record. The result is a list of three such records, ready to feed into `lapply()`, `Reduce()`, or `do.call(rbind, lapply(records, as.data.frame))` for a frame.

### 2. Iterate over columns of a data frame in pairs

```r title="Compute pairwise covariance of mtcars columns"
pairs_left  <- list(mtcars$mpg, mtcars$hp, mtcars$wt)
pairs_right <- list(mtcars$hp,  mtcars$wt, mtcars$qsec)

covs <- Map(cov, pairs_left, pairs_right)
unlist(covs)
#> [1]  -320.7322   83.5036   -1.8941
```

A data frame is a list of columns, so Map() over column-lists is a natural fit. Each call receives one left column and one right column, runs `cov`, and returns a scalar. The result is a list of scalars; `unlist()` flattens it for display.

### 3. Pair functions with inputs (functions are first-class)

```r title="Apply a different function to each input"
fns    <- list(mean, median, sd)
inputs <- list(1:5, c(2, 4, 4, 6, 100), c(10, 20, 30, 40, 50))

summary_stats <- Map(function(f, x) f(x), fns, inputs)
summary_stats
#> [[1]]
#> [1] 3
#>
#> [[2]]
#> [1] 4
#>
#> [[3]]
#> [1] 15.81139
```

Because lists can hold any R object, you can zip a list of functions against a list of inputs. The anonymous wrapper just calls each function on its paired input. This pattern is common when each column of a frame needs a different aggregator.

### 4. Vary a fixed argument across calls

```r title="Read first N rows from each frame, with different N per frame"
frames <- list(iris, mtcars, airquality)
ns     <- c(2, 3, 1)

heads <- Map(head, frames, n = ns)
sapply(heads, nrow)
#> [1] 2 3 1
```

Map zips the `n` argument too, so each call receives a different `n`. If you want `n` FIXED across all calls, you cannot use `MoreArgs` (Map does not accept it); pass a constant vector instead: `Map(head, frames, n = rep(5, length(frames)))`.

### 5. Stack the results into a data frame

```r title="Build a data frame from a list of parallel inputs"
groups <- c("A", "B", "C")
values <- list(c(10, 12, 11), c(20, 19, 21), c(5, 7, 6))

rows <- Map(function(g, v) data.frame(group = g, n = length(v), mean = mean(v)),
            groups, values)
do.call(rbind, rows)
#>   group n      mean
#> 1     A 3 11.000000
#> 2     B 3 20.000000
#> 3     C 3  6.000000
```

The recipe is: Map() to get a list of per-group frames, then `do.call(rbind, ...)` (or `dplyr::bind_rows()`) to stack them. This is the base R analogue of `purrr::map_dfr()`.

[KEY INSIGHT]
**Map() is the "zip-and-apply" verb of base R.** Two or more lists become a sequence of tuples; Map walks the tuples and calls a function on each. The output is always a list, which makes Map composable: feed it into `Reduce`, `do.call`, `Filter`, or another `Map` without worrying about whether the previous step returned a vector or a matrix.

## Map vs mapply vs purrr::pmap vs lapply

**These four functions overlap but differ on output shape, type safety, and number of inputs.** Pick by what you need downstream.

| Function | Inputs | Return | When to use |
|---|---|---|---|
| `Map()` | 2+ vectors or lists | Always list | You want a list and do not want to remember `SIMPLIFY = FALSE` |
| `mapply()` | 2+ vectors or lists | Vector, matrix, or list (auto) | You want auto-simplification to a vector or matrix |
| `lapply()` | Exactly 1 | Always list | One input, list output |
| `purrr::pmap()` | List of any arity | List (or typed variants) | Tidyverse style, type-safe, named arguments |
| `purrr::map2()` | Exactly 2 | List (or typed `_dbl`, `_chr`) | Two inputs, type checking |
| `Vectorize()` | A scalar fn | Vectorized fn | Wrap once, reuse like a built-in |

Decision rule:

- One input: `lapply()`.
- Two or more inputs, list output guaranteed: `Map()`.
- Two or more inputs, want auto-simplification: `mapply()`.
- Already in the tidyverse, want strict types: `purrr::pmap()` or `map2_dbl()`.

## Common pitfalls

**Pitfall 1: silent recycling.** `Map(`+`, 1:6, 1:2)` does not error; it recycles `1:2` to length 6 and returns six results. Check `length(x) == length(y)` first, or use `purrr::map2()`, which errors on mismatch.

**Pitfall 2: expecting `MoreArgs`.** Map does not take `MoreArgs`. To pass a constant value, either repeat it (`rep(value, n)`) or wrap your call in an anonymous function that captures the constant from its enclosing scope.

**Pitfall 3: confusing Map with map.** `Map()` is base R; `purrr::map()` is the tidyverse single-input apply. If you load purrr, both are in scope. With case-sensitive linting you are safe; without it, mis-typing capitalization silently picks the wrong function. The companion functions are `purrr::map2()` and `purrr::pmap()`, not `purrr::Map()`.

[WARNING]
**Map() is slower than vectorized arithmetic for built-in math.** Prefer `x + y` over `Map(`+`, x, y)` and `pmax(x, y)` over `Map(max, x, y)`. Reserve Map for cases where the per-tuple function is non-vectorized, returns lists or frames, or wraps side-effecting work like file reads.

## Try it yourself

**Try it:** Use Map() to build a list of per-cylinder summaries from mtcars, where each element is a list with `cyl`, `n`, and `mean_mpg`. Save the result to ex_summaries.

```r title="Your turn: per-cylinder summaries"
cyls   <- c(4, 6, 8)
mpgs   <- split(mtcars$mpg, mtcars$cyl)

ex_summaries <- # your code here

ex_summaries[[1]]
#> Expected: list(cyl = 4, n = 11, mean_mpg = 26.66...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_summaries <- Map(function(c, v) list(cyl = c, n = length(v), mean_mpg = mean(v)),
                    cyls, mpgs)
ex_summaries[[1]]
#> $cyl
#> [1] 4
#>
#> $n
#> [1] 11
#>
#> $mean_mpg
#> [1] 26.66364
```

**Explanation:** Map() zips `cyls` and `mpgs` (a list of three numeric vectors from `split`), then the anonymous function packages each pair into a named record. The result is a length-3 list of records, ready for `do.call(rbind, lapply(ex_summaries, as.data.frame))`.

</details>

## Related base R functional functions

After Map, study the rest of the base R functional toolkit:

- `mapply()`: same engine, returns a vector or matrix when shapes match
- `lapply()`: single-input apply, always list
- `sapply()` and `vapply()`: single-input apply with simplification or type checking
- `Reduce()`: fold a binary function over a list, accumulating one result
- `Filter()` and `Find()`: keep or pick list elements that match a predicate
- `Position()`: index of the first match
- `Vectorize()`: turn a scalar function into a vectorized one (uses mapply under the hood)
- `purrr::pmap()`, `purrr::map2()`: tidyverse parallel apply with type-safe variants

For the canonical reference, see the official R help at [stat.ethz.ch Map](https://stat.ethz.ch/R-manual/R-devel/library/base/help/Map.html).

## FAQ

**What is the difference between Map and mapply in R?**

`Map(f, x, y)` is exactly `mapply(f, x, y, SIMPLIFY = FALSE, USE.NAMES = FALSE)`. Both walk their inputs in parallel and call `f` on each tuple. The only difference is output shape: Map always returns a list; mapply simplifies to a vector or matrix when shapes align. Pick Map for guaranteed list output, mapply for auto-simplification.

**How does Map work with lists of different lengths?**

Map silently recycles shorter inputs to match the longest. `Map(`+`, 1:6, 1:2)` pairs `(1,1), (2,2), (3,1), (4,2), (5,1), (6,2)` and returns six results. R warns only when the longer length is not a multiple of the shorter. To enforce equal lengths, call `stopifnot(length(x) == length(y))` first, or switch to `purrr::map2()`, which errors.

**Can Map iterate over rows of a data frame?**

Not directly. A data frame is a list of columns, so Map over a frame iterates COLUMNS in parallel. To iterate ROWS, pass the columns as separate arguments: `Map(function(a, b, c) ..., df$col1, df$col2, df$col3)`. For many columns, `purrr::pmap(df, function(col1, col2, col3) ...)` is cleaner.

**Why does Map return a list when I expected a vector?**

By design. Map always returns a list, even when every call returns a scalar. If you want a vector, call `unlist()` on the result or switch to `mapply()`, which simplifies automatically. The list contract makes Map composable with `Reduce`, `do.call`, and `Filter`, which all consume lists.

**Is Map() faster than a for loop in R?**

Marginally. Both interpret the inner function call in R, so neither vectorizes it. The wins of Map are clarity and no preallocation bugs, not raw speed. For real speed, use vectorized base R like `x + y` or `pmax(x, y)`, a C-backed package function, or `purrr::pmap_dbl()` with a typed return.
