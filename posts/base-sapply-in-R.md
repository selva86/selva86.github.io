---
title: "sapply() in R: Apply a Function and Simplify the Result"
slug: "base-sapply-in-R"
description: "Use base R sapply() to apply a function to a list or vector and simplify the result. Covers vs lapply, simplify rules, USE.NAMES, and 5 examples."
keywords: "sapply in R, sapply vs lapply, R apply function to list, base R sapply, R sapply examples, vapply alternative"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "sapply()|base sapply|apply function to list|R sapply|simplify apply"
auto_link_case_sensitive: true
target_keyword: "sapply in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# sapply() in R: Apply a Function and Simplify the Result

<p class="lead">The <code>sapply()</code> function in base R applies a function to each element of a list or vector and tries to SIMPLIFY the result to a vector or matrix. It is the user-friendly variant of <code>lapply()</code> that strips the list wrapper when possible.</p>

[QUICK ANSWER]
sapply(1:5, function(x) x^2)               # vector output
sapply(1:5, sqrt)                          # named function
sapply(list(a=1:3, b=4:6), sum)            # over a list
sapply(1:3, function(x) x:(x+2))           # matrix output (uniform length)
sapply(x, fn, simplify = FALSE)            # disable simplification (= lapply)
sapply(x, fn, USE.NAMES = FALSE)           # drop names
vapply(1:5, sqrt, numeric(1))              # safer: declare expected output

[DECISION TREE: Is sapply() the right tool?]
- apply fn, want vector if possible: sapply()
- apply fn, always want list: lapply()
- apply fn, type-strict expected: vapply()
- apply fn over data frame columns: lapply or sapply
- apply fn over matrix rows/cols: apply()
- apply fn pairwise across vectors: mapply() or Map()
- functional programming style: purrr::map family

## What sapply() does in one sentence

**`sapply(X, FUN)` calls `FUN` on each element of `X` and tries to simplify the result.** If every call returns the same-length numeric, the result is a vector or matrix. Otherwise it falls back to a list (like `lapply`).

This auto-simplification is convenient for interactive use but unpredictable: a function that USUALLY returns scalars but occasionally returns NULL gives you sometimes a vector, sometimes a list. For predictable code, prefer `vapply()` or `purrr::map_dbl()`.

## Syntax

**`sapply(X, FUN, ..., simplify = TRUE, USE.NAMES = TRUE)`. X is a list or vector; FUN is the function applied to each element.**

```r title="Apply a function to a sequence"
sapply(1:5, function(x) x^2)
#> [1]  1  4  9 16 25
```

[TIP]
**For predictable results in production code, prefer `vapply()`.** `vapply(1:5, function(x) x^2, numeric(1))` errors if the function ever returns something other than a single numeric. This catches bugs that `sapply()` would silently turn into a list.

## Five common patterns

### 1. Apply to a vector, get a vector

```r title="Square every element"
sapply(1:5, function(x) x^2)
#> [1]  1  4  9 16 25
```

### 2. Apply to a list, get a vector

```r title="Sum each list element"
sapply(list(a = 1:3, b = 4:6, c = 7:9), sum)
#>  a  b  c
#>  6 15 24
```

Names are preserved in the output by default.

### 3. Function returning vectors -> matrix

```r title="Each call returns 3 values -> 3-row matrix"
sapply(1:4, function(x) x:(x+2))
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    2    3    4
#> [2,]    2    3    4    5
#> [3,]    3    4    5    6
```

When all calls return same-length vectors, sapply gives a matrix (one column per input).

### 4. Disable simplification (= lapply)

```r title="Always return a list"
sapply(1:3, function(x) x^2, simplify = FALSE)
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 4
#>
#> [[3]]
#> [1] 9
```

`simplify = FALSE` makes sapply identical to lapply.

### 5. Apply across data frame columns

```r title="Mean of each numeric column"
sapply(mtcars[, c("mpg","hp","wt")], mean)
#>      mpg       hp       wt
#> 20.09062 146.6875  3.21725
```

Data frames are lists of columns. sapply iterates column-wise.

[KEY INSIGHT]
**`sapply()` is convenient but TYPE-UNPREDICTABLE.** Sometimes returns a vector; sometimes a list; sometimes a matrix; depends on what the function returned across all inputs. For library code, use `vapply()` (declares expected return type) or `purrr::map_*()` (typed variants like `map_dbl`, `map_chr`). Reserve `sapply()` for quick interactive use.

## sapply vs lapply vs vapply

| Function | Return type | When to use |
|---|---|---|
| `sapply()` | Vector / matrix / list (auto) | Interactive, quick code |
| `lapply()` | Always list | When list output is desired |
| `vapply()` | Vector of declared type | Production / library code |
| `purrr::map()` | List | Tidyverse style |
| `purrr::map_dbl()` | Numeric vector | Tidyverse, type-safe |

When to use which:

- Use `sapply()` interactively for quick mapping when you trust the output shape.
- Use `vapply()` in production for type safety.
- Use `purrr::map_*()` family in tidyverse pipelines.

## Common pitfalls

**Pitfall 1: empty input gives empty list, not vector.** `sapply(list(), mean)` returns `list()`, not `numeric(0)`. Defensive code should handle this.

**Pitfall 2: list with different return shapes -> unexpected result.** If your function sometimes returns 1 value and sometimes 2, sapply may return a list (not vector). Use `vapply()` to enforce shape.

[WARNING]
**`sapply()` is the most common source of "weird" R bugs.** Code works in tests because all inputs return scalars; in production one input returns a 2-vector, sapply silently shifts to matrix output, downstream code breaks. Use `vapply()` to fail loudly instead.

## Try it yourself

**Try it:** Compute the LENGTH (number of characters) of each name in `names_vec` using sapply. Save to `ex_lengths`.

```r title="Your turn: count chars per name"
names_vec <- c("Alice", "Bob", "Charlotte")

ex_lengths <- # your code here

ex_lengths
#> Expected: c(5, 3, 9)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_lengths <- sapply(names_vec, nchar)
ex_lengths
#>     Alice       Bob Charlotte
#>         5         3         9
```

**Explanation:** `sapply(names_vec, nchar)` applies `nchar()` to each name. Since each call returns a single integer, sapply simplifies to an integer vector. Names are preserved.

</details>

## Related apply functions

After mastering sapply, look at:

- `lapply()`: always returns a list (no simplification)
- `vapply()`: type-strict (you declare expected output)
- `mapply()`: multi-argument apply
- `apply()`: apply over rows/columns of a matrix
- `purrr::map()` and variants: tidyverse alternatives with type safety

For data frame column-wise summaries, `dplyr::summarise(across(...))` is more idiomatic than sapply.

## FAQ

**What is the difference between sapply and lapply in R?**

`lapply()` ALWAYS returns a list. `sapply()` tries to simplify the result to a vector or matrix; falls back to a list if simplification fails. Use sapply when you want a vector; lapply when you want a list.

**What is the difference between sapply and vapply?**

Both apply a function to each element. `sapply()` is convenient but type-unpredictable. `vapply()` requires you to declare the expected return type, errors if the function returns something different. Use vapply for predictable production code.

**How do I apply a function to multiple columns in R?**

For a data frame, `sapply(df, fn)` works because data frames are lists of columns. For a tidyverse approach, use `dplyr::summarise(across(everything(), fn))` or `purrr::map(df, fn)`.

**Why does sapply sometimes return a matrix?**

When the applied function returns a same-length VECTOR for every input, sapply combines those vectors into a matrix (one column per input). Use `simplify = FALSE` to force list output.

**How do I keep names in sapply output?**

Set `USE.NAMES = TRUE` (the default). Names come from the input's names if it has any, or from the input values if it does not. Set `USE.NAMES = FALSE` to drop names.
