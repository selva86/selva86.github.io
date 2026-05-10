---
title: "purrr reduce() in R: Combine Elements With a Function"
slug: "purrr-reduce-in-R"
description: "Use purrr reduce() to combine a list or vector with a 2-argument function in R. Covers reduce, accumulate, .init, .dir, fold left vs right, and 5 examples."
keywords: "purrr reduce, R fold function, reduce R example, accumulate purrr, R reduce list, fold left right R, base Reduce alternative"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr reduce|reduce()|accumulate()|fold function|combine list"
auto_link_case_sensitive: true
target_keyword: "purrr reduce"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr reduce() in R: Combine Elements With a Function

<p class="lead">The <code>reduce()</code> function in purrr applies a 2-argument function recursively across a list or vector, combining elements into a single result. <code>accumulate()</code> returns the intermediate steps as a vector.</p>

[QUICK ANSWER]
reduce(1:5, `+`)                          # 15 (sum via fold)
reduce(1:5, `+`, .init = 100)             # 115 (with init)
reduce(list(c(1,2), c(3,4)), c)           # c(1,2,3,4) flatten
reduce(list_of_dfs, dplyr::full_join)     # join many tables
accumulate(1:5, `+`)                      # 1 3 6 10 15 (running sum)
reduce(1:5, `+`, .dir = "backward")       # right-fold
reduce2(1:3, c(10,20), ~ .x + .y + ..3)   # two-input reduce

[DECISION TREE: Is reduce() the right tool?]
- combine list to single value: reduce()
- need running totals / steps: accumulate()
- combine right-to-left: reduce(..., .dir = "backward")
- reduce with two parallel inputs: reduce2()
- common case: sum / mean / max: just sum() / mean() / max()
- combine many data frames: reduce(list_of_dfs, full_join)
- chain transformations: reduce(funs, ~ .y(.x), .init = data)

## What reduce() does in one sentence

**`reduce(.x, .f)` calls `.f(first, second)`, then `.f(result, third)`, and so on, collapsing a list or vector into a single output.** It is the functional-programming "fold" or "inject" operation.

`reduce()` is purrr's friendlier wrapper around base R's `Reduce()`. The main wins: cleaner argument names, lambda syntax, integration with `accumulate()` for running output.

## Syntax

**`reduce(.x, .f, ..., .init, .dir = c("forward", "backward"))`. `.f` takes 2 args; `.init` is an optional starting value.**

```r title="Sum 1 to 5 via reduce"
library(purrr)

reduce(1:5, `+`)
#> [1] 15

reduce(1:5, `+`, .init = 100)
#> [1] 115
```

[TIP]
**For sum, mean, max, min, just call the specialized function (`sum()`, etc).** They are MUCH faster (vectorized in C) than `reduce(x, +)`. Reach for `reduce` only when the operation is not already a built-in.

## Five common patterns

### 1. Combine list of data frames

```r title="Join many tables with reduce + dplyr"
library(dplyr)

dfs <- list(
  data.frame(id = 1:3, a = 1:3),
  data.frame(id = 1:3, b = 4:6),
  data.frame(id = 1:3, c = 7:9)
)

reduce(dfs, full_join, by = "id")
#>   id a b c
#> 1  1 1 4 7
#> 2  2 2 5 8
#> 3  3 3 6 9
```

This is the canonical use case: combining many data frames where you cannot easily use `bind_rows()`.

### 2. Flatten nested lists

```r title="Concatenate vectors in a list"
reduce(list(c(1,2), c(3,4), c(5,6)), c)
#> [1] 1 2 3 4 5 6
```

`c()` is the 2-arg combine function; `reduce` repeats it across the list.

### 3. Running total with accumulate

```r title="accumulate keeps every intermediate step"
accumulate(1:5, `+`)
#> [1]  1  3  6 10 15
```

`accumulate` is `reduce` with all intermediate results returned, useful for cumulative sums, factorials, recursive sequences.

### 4. Apply a chain of functions

```r title="Pipe via reduce"
funs <- list(
  ~ .x * 2,
  ~ .x + 10,
  ~ sqrt(.x)
)

reduce(funs, ~ .y(.x), .init = 5)
#> [1] 4.472136
```

Equivalent to `sqrt((5 * 2) + 10)`. `reduce` over a list of functions builds a transformation pipeline programmatically.

### 5. Right-fold for non-commutative ops

```r title="Direction matters when the op is not commutative"
reduce(c("a","b","c"), paste0)
#> [1] "abc"

reduce(c("a","b","c"), paste0, .dir = "backward")
#> [1] "abc"
```

For commutative ops (`+`, `c`), direction does not matter. For string concat or list cons, it does.

[KEY INSIGHT]
**`reduce` is the functional "fold" operation.** It generalizes sum, product, concatenation, and joining into a single pattern: "combine pairs left-to-right (or right-to-left) until one value remains". Recognizing when a problem fits this shape unlocks elegant pipelines.

## reduce() vs accumulate() vs base Reduce()

**Three ways to fold a list in R, with different output and ergonomics.**

| Function | Output | Best for |
|---|---|---|
| `purrr::reduce()` | Single value | Standard fold |
| `purrr::accumulate()` | Vector of intermediate values | Cumulative sequences |
| `base::Reduce()` | Single value | No purrr dependency |
| `base::Reduce(accumulate=TRUE)` | Vector | Cumulative, no dep |

For modern code, prefer purrr's variants for cleaner syntax. Use base if avoiding tidyverse.

## A practical reduce workflow

**Recognizing fold patterns is the key skill.** Common problems that fit:

- Combining many CSV files into one data frame
- Building a final result step-by-step (e.g., training a model in stages)
- Reducing a list of pairs into a hash-map-like structure
- Cumulative metrics (running balance, running max, running concat)
- Composing functions dynamically

Once you spot the pattern, reduce or accumulate produces compact, readable code.

## Common pitfalls

**Pitfall 1: empty list error.** `reduce(list(), +)` errors because there is nothing to fold. Provide `.init = 0` to handle empty input gracefully.

**Pitfall 2: function arity confusion.** `.f` MUST take exactly 2 arguments. `reduce(1:3, sum)` errors because `sum` is variadic. Use `\(x, y) x + y` or backtick `+`.

[WARNING]
**`reduce` is SLOWER than vectorized alternatives for sum / product / mean / max.** Always prefer `sum(x)` over `reduce(x, +)` for simple aggregations. Reach for reduce when no specialized function exists.

## Try it yourself

**Try it:** Use `reduce` with `intersect` to find IDs common to all 3 vectors. Save to `ex_common`.

```r title="Your turn: intersection of many vectors"
v1 <- c(1, 2, 3, 4, 5)
v2 <- c(2, 3, 4, 5, 6)
v3 <- c(3, 4, 5, 6, 7)

ex_common <- # your code here

ex_common
#> Expected: c(3, 4, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_common <- reduce(list(v1, v2, v3), intersect)
ex_common
#> [1] 3 4 5
```

**Explanation:** `reduce` applies `intersect()` pairwise: first `intersect(v1, v2)` then `intersect(result, v3)`. Generalizes the 2-arg intersect to N inputs.

</details>

## Related purrr functions

After mastering reduce, look at:

- `accumulate()`: keeps every intermediate result
- `reduce2()`: parallel reduce over two inputs
- `compose()`: function composition (a kind of fold over functions)
- `partial()`: partial function application
- `map_*()`: when you want one output PER input, not a single fold result

For data frame operations, dplyr's `bind_rows()` and `summarise()` cover the common cases without needing reduce.

## FAQ

**What does reduce do in purrr?**

`reduce(.x, .f)` repeatedly applies `.f` (a 2-arg function) across `.x`, combining elements pairwise until a single value remains. It is the functional fold operation.

**What is the difference between reduce and accumulate in purrr?**

`reduce` returns ONLY the final folded value. `accumulate` returns ALL intermediate values as a vector. Both apply the function the same way; they differ in what they keep.

**How do I reduce in R without purrr?**

Use `base::Reduce(f, x)`. It works the same way but with reversed argument order: function first, vector second. For accumulate behavior: `Reduce(f, x, accumulate = TRUE)`.

**How do I combine many data frames with purrr?**

`reduce(list_of_dfs, dplyr::full_join, by = "id")` joins them all on `id`. For row-binding, `purrr::list_rbind()` or `dplyr::bind_rows()` is more direct.

**What is the .init argument in reduce?**

`.init` is the starting value of the accumulator. Without it, `reduce` uses the first element of `.x` as the initial value. With it, you start the fold from a specific seed (e.g., 0 for sum, 1 for product, empty data frame for joins).
