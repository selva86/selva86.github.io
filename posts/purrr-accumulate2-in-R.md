---
title: "purrr accumulate2() in R: Cumulative Reduce Over Two Vectors"
slug: "purrr-accumulate2-in-R"
description: "Learn purrr accumulate2() in R to run a cumulative reduce over two parallel vectors. Covers syntax, the .init argument, worked examples, and common pitfalls."
keywords: "purrr accumulate2, accumulate2 function R, purrr accumulate2 examples, R accumulate2 two vectors, accumulate2 vs accumulate, accumulate2 vs reduce2"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "accumulate2()|purrr accumulate2|purrr::accumulate2()|accumulate over two lists|accumulate over two vectors"
auto_link_case_sensitive: true
target_keyword: "purrr accumulate2"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# purrr accumulate2() in R: Cumulative Reduce Over Two Vectors

<p class="lead">The purrr <code>accumulate2()</code> function runs a cumulative reduce over two parallel vectors, returning every intermediate step instead of only the final value.</p>

[QUICK ANSWER]
accumulate2(x, y, \(acc, e, w) acc + e + w)   # 3-arg accumulator
accumulate2(x, y, f)                          # rule: length(y) = length(x) - 1
accumulate2(x, y, f, .init = 0)               # seed; x and y equal length
accumulate2(x, ops, \(acc, e, op) op(acc, e)) # different op each step
accumulate2(x, y, ~ ..1 + ..2 + ..3)          # formula-style .f
accumulate2(x, y, paste)                      # join three parts each step
tail(accumulate2(x, y, f), 1)                 # keep only the final value

[DECISION TREE: Is accumulate2() the right tool?]
- fold two parallel lists, keep every step: accumulate2(x, y, f)
- fold two parallel lists, final value only: reduce2(x, y, f)
- fold one list, keep every step: accumulate(x, f)
- fold one list, final value only: reduce(x, f)
- one transformed output per pair: map2(x, y, f)
- run side effects over two lists: walk2(x, y, f)

## What accumulate2() does

**`accumulate2(.x, .y, .f)` folds `.x` step by step while a second parallel vector `.y` feeds an extra value into every step, and it records the running result after each one.** Where `reduce2()` collapses the two inputs to a single answer, `accumulate2()` keeps the full trail of partial results.

It is the two-input version of `accumulate()` and the step-keeping version of `reduce2()`. The accumulator function `.f` takes three arguments: the running result, the next `.x` element, and the next `.y` element. Use it whenever a running calculation needs a second stream of data, such as a weight, separator, or operator.

[KEY INSIGHT]
**`accumulate2()` is `reduce2()` with a memory.** Both walk two parallel vectors in lockstep with the same three-argument function. `reduce2()` discards each partial result and returns one value; `accumulate2()` stores every partial result. Ask "how did the running value evolve?" and you want `accumulate2()`.

## Syntax and the length rule

**`accumulate2(.x, .y, .f, ..., .init)` requires `.y` to be exactly one element shorter than `.x`.** That length rule is the detail beginners miss most often. An `.x` of length n produces n-1 fold steps, each step consumes one `.y` element, so `.y` has length n-1.

```r title="accumulate2 versus reduce2"
library(purrr)

x <- c(1, 2, 3, 4)
y <- c(10, 20, 30)

reduce2(x, y, \(acc, e, w) acc + e + w)
#> [1] 70

accumulate2(x, y, \(acc, e, w) acc + e + w)
#> [1]  1 13 36 70
```

The first output is `.x[1]` untouched, since the first element seeds the accumulator. Each later value folds in one more `.x` element and one more `.y` element. `accumulate2()` returns a vector the same length as `.x`, or one element longer when `.init` is supplied.

The argument order inside `.f` is fixed: the first argument is always the running accumulator, the second is the current `.x` element, and the third is the current `.y` element. When you pass `.init`, the fold gains an extra step, so `.x` and `.y` must then have the *same* length. Unlike `accumulate()`, there is no `.dir` argument, so `accumulate2()` always folds left to right.

## accumulate2() examples

**Each example below pairs `.x` with a different shape of `.y`: a numeric vector, a separator vector, a length-matched vector with `.init`, and a list of operators.** All four run in the same session.

### 1. Running cart total with per-item discount

**A shopping cart total is a natural running fold: each item adds its price and subtracts a discount.** The prices are `.x` and the discounts are `.y`.

```r title="Running total with discounts"
prices    <- c(100, 50, 80, 30)
discounts <- c(10, 5, 8)

accumulate2(prices, discounts, \(acc, p, d) acc + p - d)
#> [1] 100 140 215 237
```

The fold seeds with `100`, then computes `100 + 50 - 10 = 140`, then `140 + 80 - 5 = 215`, then `215 + 30 - 8 = 237`. Each output position is the cart total after that item.

### 2. Join path segments with separators

**`.y` does not have to be numeric.** Here it holds the separator used to glue each new segment onto the path built so far.

```r title="Build a file path step by step"
join_seg <- function(acc, seg, sep) paste0(acc, sep, seg)

accumulate2(c("usr", "local", "share", "R"), c("/", "/", "/"), join_seg)
#> [1] "usr"               "usr/local"         "usr/local/share"
#> [4] "usr/local/share/R"
```

`join_seg()` reads its three arguments by name, so the separator from `.y` lands in the right place. The result shows the path growing one segment at a time.

[TIP]
**Use an explicit lambda when `.f` takes three arguments.** Backtick operators like `+` accept only two arguments and error inside `accumulate2()`. Writing `\(acc, x, y) ...` or a named function makes the three roles obvious and prevents arity bugs.

### 3. Model an investment with growth and deposits

**`.init` seeds the fold with a starting value and makes `.x` and `.y` equal length.** This models an account that grows by a rate and receives a deposit each year.

```r title="Investment balance with annual deposits"
growth  <- c(1.05, 1.07, 1.04)
deposit <- c(200, 200, 200)

accumulate2(growth, deposit, \(bal, g, add) bal * g + add, .init = 1000)
#> [1] 1000.0 1250.0 1537.5 1799.0
```

With `.init = 1000`, both vectors are length 3 and the output has 4 values. The balance starts at `1000`, grows by 5% and gains `200` to reach `1250`, and so on. Because `.init` adds an element, the result is one longer than `.x`.

### 4. Apply a different operation each step

**`.y` can hold functions, turning `accumulate2()` into a small programmable calculator.** Each step pulls the next operator from `.y` and applies it.

```r title="One operator per fold step"
steps <- list(`+`, `*`, `-`)

accumulate2(c(6, 4, 5, 3), steps, \(acc, x, op) op(acc, x))
#> [1]  6 10 50 47
```

The trail reads `6`, then `6 + 4 = 10`, then `10 * 5 = 50`, then `50 - 3 = 47`, exposing which operator produced each jump.

## accumulate2() vs accumulate() vs reduce2()

**These three functions differ in how many lists they fold and in what they return.** Pick by input count and by whether you need the intermediate steps.

| Function | Inputs | Returns | Use when |
|---|---|---|---|
| `accumulate()` | one list | every step | running trail over a single list |
| `accumulate2()` | two parallel lists | every step | each step needs a second value |
| `reduce2()` | two parallel lists | final value only | you want only the end result |

`accumulate2()` and `reduce2()` share the same two-list signature and the same length rule. The only difference is that `reduce2()` keeps the last value while `accumulate2()` keeps them all. For a single list, drop down to `accumulate()`; for just the end total, take `tail(accumulate2(...), 1)`.

[NOTE]
**Coming from Python?** `itertools.accumulate()` works on a single iterable. To accumulate over two streams you would `zip()` them first and unpack a tuple inside the function. `accumulate2()` keeps the two vectors separate, and the three-argument accumulator reads each role by name.

## Common pitfalls

**Pitfall 1: length mismatch.** `accumulate2(1:4, 1:4, f)` errors because `.y` must have `length(.x) - 1` elements. Drop one `.y` element, or add `.init` so that `.x` and `.y` become equal length.

**Pitfall 2: a 2-argument `.f`.** Passing a bare `+` fails because `accumulate2()` always calls `.f` with three arguments. Supply a three-argument lambda such as `\(acc, x, y) acc + x + y`, or a formula like `~ ..1 + ..2 + ..3`.

**Pitfall 3: wrong argument order.** The first argument of `.f` is the accumulator, not the `.x` element. Swapping them often runs without an error and returns a plausible but wrong number, so confirm the accumulator comes first.

[WARNING]
**An accumulator that ignores `.y` fails silently.** If `.f` never uses its third argument, `accumulate2()` runs without complaint and quietly behaves like `accumulate()`. A wrong answer with no error is harder to catch than a crash, so check that `.f` actually consumes the `.y` value.

## Try it yourself

**Try it:** Use `accumulate2()` to track a running balance where deposits are `c(100, 200, 300)` and a per-step fee is `c(5, 10, 15)`. Start from `.init = 0`. Save the result to `ex_running`.

```r title="Your turn: running balance with fees"
# Try it: fold deposits minus fees
ex_running <- # your code here

ex_running
#> Expected: 0 95 285 570
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_running <- accumulate2(
  c(100, 200, 300),
  c(5, 10, 15),
  \(acc, dep, fee) acc + dep - fee,
  .init = 0
)
ex_running
#> [1]   0  95 285 570
```

**Explanation:** With `.init = 0`, both vectors are length 3 and the output has 4 values. Each step adds the next deposit and subtracts the next fee: `0 + 100 - 5 = 95`, then `95 + 200 - 10 = 285`, then `285 + 300 - 15 = 570`.

</details>

## Related purrr functions

After `accumulate2()`, these purrr tools cover nearby jobs:

- `accumulate()`: the same running trail, but over a single list
- `reduce2()`: fold two parallel lists down to one final value
- `reduce()`: fold a single list down to one value
- `map2()`: one transformed output per pair of inputs, with no folding
- `walk2()`: two-list iteration for side effects only

See the official [purrr reduce reference](https://purrr.tidyverse.org/reference/reduce.html) for the full argument list.

## FAQ

**What does accumulate2() do in purrr?**

`accumulate2(.x, .y, .f)` folds two parallel vectors with a three-argument function and returns every intermediate result. The accumulator function receives the running value, the next `.x` element, and the next `.y` element. The output is a vector the same length as `.x`, or one longer when `.init` is supplied. It is the step-keeping version of `reduce2()`, which returns only the final folded value.

**What is the difference between accumulate2() and accumulate()?**

Both keep every intermediate step of a fold. `accumulate()` works on a single list and uses a two-argument function. `accumulate2()` folds two parallel lists and uses a three-argument function, where the third argument is the matching element of the second list. Reach for `accumulate2()` when each step of a running calculation needs an extra value, such as a weight, a separator, or an operator.

**Why must .y be shorter than .x in accumulate2()?**

A fold over n elements has only n-1 steps, because the first `.x` element seeds the accumulator and is not folded. Each step consumes one `.y` element, so `.y` has length n-1. When you pass `.init`, the seed comes from `.init` instead, the fold gains one step, and `.x` and `.y` must then have the same length.

**Does accumulate2() return a list or a vector?**

`accumulate2()` simplifies its output to an atomic vector when every step returns a length-one value of the same type, such as a number or a string. When the steps return vectors or other objects that cannot be simplified, it returns a list instead. Wrap the call in `unlist()` if you always want a flat atomic vector.

**What is the difference between accumulate2() and reduce2()?**

Both take two parallel lists and a three-argument accumulator, and both follow the same length rule. `reduce2()` returns only the final folded value. `accumulate2()` returns the complete sequence of partial results, which is useful for debugging a fold or for showing how a running quantity evolved over time.
</content>
</invoke>
