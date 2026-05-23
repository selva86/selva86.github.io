---
title: "Reduce() in R: Fold a Function Over a List or Vector"
slug: "base-Reduce-in-R"
description: "Use base R Reduce() to fold a function across a list or vector. Covers accumulate, init, right=TRUE, and purrr::reduce, with six worked code examples."
keywords: "Reduce in R, base Reduce, R fold function, Reduce accumulate, Reduce init, Reduce vs purrr reduce, R functional programming"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "Reduce()|base Reduce|fold function R|Reduce accumulate|R reduce function"
auto_link_case_sensitive: true
target_keyword: "Reduce in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Reduce() in R: Fold a Function Over a List or Vector

<p class="lead">The <code>Reduce()</code> function in base R folds a binary function across a list or vector, collapsing many values into a single accumulated result. It powers running totals, list merges, and any "combine pairwise from the left" computation.</p>

[QUICK ANSWER]
Reduce("+", 1:5)                                  # 15 (sum via fold)
Reduce("+", 1:5, accumulate = TRUE)               # 1 3 6 10 15 (running totals)
Reduce("+", 1:5, accumulate = TRUE, init = 100)   # 100 101 103 106 110 115
Reduce(paste, letters[1:4])                       # "a b c d" (left fold)
Reduce(paste, letters[1:4], right = TRUE)         # "a b c d" (right fold)
Reduce(intersect, list(1:5, 3:7, 4:10))           # 4 5 (common elements)
Reduce(merge, list(df1, df2, df3))                # merge many data frames

[DECISION TREE: Is Reduce() the right tool?]
- fold binary fn over a list: Reduce(f, x)
- need every intermediate result: Reduce(f, x, accumulate = TRUE)
- apply a fn element-wise (no folding): lapply() or sapply()
- combine many data frames pairwise: Reduce(merge, list_of_dfs)
- variadic function over a list: do.call(f, list_of_args)
- tidyverse fold: purrr::reduce(x, f)
- special-case sums or products: sum(), prod(), paste(collapse = )

## What Reduce() does in one sentence

**`Reduce(f, x)` collapses the elements of `x` into a single value by applying the binary function `f` left-to-right, like `f(f(f(x1, x2), x3), x4)`.** It is R's left fold, the same operation as `foldl` in Haskell or `functools.reduce` in Python.

`Reduce` belongs to base R's [functional programming](Functional-Programming-in-R.html) toolkit (alongside `Map`, `Filter`, `Find`, `Position`, and `Negate`). It is the only base function that turns a list of values into one accumulated value by repeated pairwise combination.

## Syntax

**`Reduce(f, x, init, accumulate = FALSE, right = FALSE)`. `f` is a binary function, `x` is a list or vector; `init` seeds the fold, `accumulate` returns every step, `right` flips direction.**

```r title="Sum a vector via fold"
Reduce("+", 1:5)
#> [1] 15
```

The call expands to `((((1 + 2) + 3) + 4) + 5)`. The first argument can be any binary function: a name in quotes, a function object, or an anonymous function.

[TIP]
**Quoting an operator like `"+"` looks it up as a function.** `Reduce("+", x)` is identical to `Reduce(`+`, x)` or `Reduce(function(a, b) a + b, x)`. Use the quoted form for arithmetic and logical operators; it reads cleanest.

## Six common patterns

### 1. Fold an operator across a vector

```r title="Sum and product via Reduce"
Reduce("+", 1:5)
#> [1] 15

Reduce("*", 1:5)
#> [1] 120
```

For sums and products specifically, `sum()` and `prod()` are faster and clearer. Use `Reduce` when the operation is not vectorized (merging, intersecting, composing).

### 2. Get every intermediate result with accumulate

```r title="Running totals"
Reduce("+", 1:5, accumulate = TRUE)
#> [1]  1  3  6 10 15
```

`accumulate = TRUE` returns a vector of length `length(x)`, one entry per fold step. This is the `cumsum()` equivalent for arbitrary binary functions.

### 3. Seed the fold with init

```r title="Start the accumulator at 100"
Reduce("+", 1:5, accumulate = TRUE, init = 100)
#> [1] 100 101 103 106 110 115
```

`init` prepends a starting value. The output now has length `length(x) + 1`. Without `init` and with an empty `x`, `Reduce` returns `NULL`, which often crashes downstream code. Pass `init` whenever `x` might be empty.

### 4. Merge a list of data frames

```r title="Pairwise merge across many tables"
df1 <- data.frame(id = 1:3, a = c(10, 20, 30))
df2 <- data.frame(id = 1:3, b = c("x", "y", "z"))
df3 <- data.frame(id = 1:3, c = c(0.1, 0.2, 0.3))

Reduce(function(x, y) merge(x, y, by = "id"), list(df1, df2, df3))
#>   id  a b   c
#> 1  1 10 x 0.1
#> 2  2 20 y 0.2
#> 3  3 30 z 0.3
```

This is the canonical use case. `merge` only takes two data frames, so any chain longer than two needs a fold. `dplyr::full_join` works the same way with `purrr::reduce`.

### 5. Intersect many sets

```r title="Common elements across N vectors"
Reduce(intersect, list(1:5, 3:7, 4:10))
#> [1] 4 5
```

`intersect()` is binary. `Reduce(intersect, list_of_vectors)` finds elements present in every vector. The same pattern works with `union` for the opposite operation.

### 6. Right fold for right-associative ops

```r title="Left vs right fold"
Reduce(function(a, b) paste0("(", a, "+", b, ")"), 1:4)
#> [1] "(((1+2)+3)+4)"

Reduce(function(a, b) paste0("(", a, "+", b, ")"), 1:4, right = TRUE)
#> [1] "(1+(2+(3+4)))"
```

For associative operations like `+`, the final value is identical regardless of direction. For non-associative ones (function composition, subtraction, division, list concatenation), `right = TRUE` matters.

[KEY INSIGHT]
**Reduce turns ANY binary function into an N-ary one.** That is the entire point: `merge()` works on two tables, but `Reduce(merge, list_of_tables)` works on any number. `union()` joins two vectors, but `Reduce(union, list)` joins many. Whenever you need a binary primitive to apply across a collection, reach for Reduce.

## Reduce vs apply family vs purrr::reduce

**Reduce is a fold; apply functions are maps.** A fold collapses a sequence into one value by threading a running result through each step; a map produces one output per input independently. The table below shows where Reduce fits among related base R and purrr primitives.

| Function | Output | Purpose |
|---|---|---|
| `Reduce(f, x)` | One value | Fold (combine pairwise) |
| `lapply(x, f)` | List of N values | Map (apply independently) |
| `sapply(x, f)` | Vector of N values | Map with simplification |
| `purrr::reduce(x, f)` | One value | Tidyverse fold |
| `purrr::accumulate(x, f)` | Vector of N values | Tidyverse running fold |
| `do.call(f, list)` | One value | Call variadic fn on a list |

When to use which:

- Use `Reduce()` when the operation is pairwise and the function is strictly binary.
- Use `lapply` or `sapply` when you want one result per input, not a single collapsed result.
- Use `purrr::reduce()` in tidyverse pipelines; semantics are the same as `Reduce` with a friendlier interface.
- Use `do.call()` when the function takes variable arguments natively (e.g., `do.call(rbind, list_of_dfs)`).

## Common pitfalls

**Pitfall 1: empty input with no init returns NULL.** `Reduce("+", integer(0))` returns `NULL`, not `0`. Always pass `init` when the input might be empty: `Reduce("+", x, init = 0)`.

**Pitfall 2: confusing accumulate output length.** Without `init`, `accumulate = TRUE` returns `length(x)` values. With `init`, it returns `length(x) + 1`. Off-by-one bugs are common when chaining the result.

**Pitfall 3: using Reduce when vectorized math exists.** `Reduce("+", 1:1e6)` is much slower than `sum(1:1e6)`. Reach for `Reduce` only when no vectorized primitive exists.

[WARNING]
**The function argument order matters.** `f(accumulator, next_element)` is the order in a left fold. If your function is asymmetric (e.g., `setdiff`), the first argument is the running result and the second is the next input. Get this backwards and the output silently changes meaning.

## Try it yourself

**Try it:** Use `Reduce` with `accumulate = TRUE` and `init = 1` to produce the running product of `1:5`. Save the result to `ex_running_prod`.

```r title="Your turn: running product"
# Try it: running product
ex_running_prod <- # your code here

ex_running_prod
#> Expected: 1 1 2 6 24 120
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_running_prod <- Reduce("*", 1:5, accumulate = TRUE, init = 1)
ex_running_prod
#> [1]   1   1   2   6  24 120
```

**Explanation:** `init = 1` seeds the fold at 1 (the multiplicative identity). `accumulate = TRUE` returns every intermediate product. The output has length 6: the init plus one per input.

</details>

## Related base R functional functions

After mastering `Reduce`, look at:

- `Map()`: apply a function across multiple lists in parallel
- `Filter()`: keep elements matching a predicate
- `Find()` and `Position()`: first element (or index) matching a predicate
- `Negate()`: invert a predicate function
- `purrr::reduce()` and `purrr::accumulate()`: tidyverse equivalents

For function composition specifically, `Reduce(function(f, g) function(x) f(g(x)), list_of_fns)` builds a single pipeline function. Most users prefer `magrittr::%>%` or the native `|>` pipe for composition; `Reduce` is the explicit functional form. See the [base funprog reference](https://stat.ethz.ch/R-manual/R-devel/library/base/html/funprog.html) for the full base R functional-programming family.

## FAQ

**What is Reduce() in R used for?**

`Reduce()` folds a binary function across a list or vector to produce a single accumulated value. Common uses include summing or multiplying a sequence, merging a list of data frames, intersecting multiple sets, and computing running totals with `accumulate = TRUE`. It is R's left-fold primitive.

**What is the difference between Reduce and lapply in R?**

`lapply(x, f)` calls `f` on each element of `x` independently and returns a list of `N` results. `Reduce(f, x)` calls a binary `f` pairwise, threading the running result into each next call, and returns ONE final value. Use `lapply` to map; use `Reduce` to fold.

**How do I use Reduce with accumulate in R?**

Pass `accumulate = TRUE`: `Reduce(f, x, accumulate = TRUE)` returns every intermediate result, one per step. With an `init` value, the output length is `length(x) + 1`. This is the general-purpose `cumsum()` equivalent for any binary function.

**What is the difference between Reduce and purrr::reduce?**

Behavior is identical: both fold a binary function across a sequence. `purrr::reduce()` has a tidyverse-friendly signature (`reduce(x, f, .init = ...)`) and integrates cleanly with the pipe. `Reduce()` is base R with no package dependency. Use `purrr::reduce` inside tidyverse pipelines, `Reduce` everywhere else.

**Can Reduce work on an empty vector?**

Yes, but only if you pass `init`. `Reduce(f, character(0), init = "")` returns `""`. Without `init`, `Reduce` returns `NULL` on empty input, which often crashes downstream code. Always pass `init` whenever the input might be empty.
