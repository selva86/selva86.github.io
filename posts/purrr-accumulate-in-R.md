---
title: "purrr accumulate() in R: Running Reductions Over a List"
slug: "purrr-accumulate-in-R"
description: "Use purrr accumulate() in R to fold a list or vector while keeping every intermediate step. Covers running sums, .init, .dir, accumulate2, and 5 examples."
keywords: "purrr accumulate, accumulate function R, purrr accumulate examples, R cumulative reduce, accumulate vs reduce R, R running total list, purrr accumulate dir"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr accumulate|accumulate()|purrr::accumulate()|running total|cumulative reduce"
auto_link_case_sensitive: true
target_keyword: "purrr accumulate"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr accumulate() in R: Running Reductions Over a List

<p class="lead">The <code>accumulate()</code> function in purrr folds a list or vector with a 2-argument function and returns <em>every</em> intermediate result, not just the final one. It is <code>reduce()</code> that shows its work.</p>

[QUICK ANSWER]
accumulate(1:5, `+`)                      # 1 3 6 10 15 running sum
accumulate(1:5, `*`)                      # 1 2 6 24 120 cumulative product
accumulate(x, max)                        # running maximum
accumulate(x, `+`, .init = 100)           # start the fold from 100
accumulate(1:5, `+`, .dir = "backward")   # fold right-to-left
accumulate2(x, y, ~ ..1 + ..2 + ..3)      # two parallel inputs

[DECISION TREE: Is accumulate() the right tool?]
- need running totals and every step: accumulate()
- need only the final folded value: reduce()
- plain running sum of a vector: cumsum()
- plain running product of a vector: cumprod()
- running max or running min: cummax() / cummin()
- one output per input, no folding: map()
- accumulate over two inputs at once: accumulate2()

## What accumulate() does in one sentence

**`accumulate(.x, .f)` applies a 2-argument function across `.x` and records the result after every step, returning a vector the same length as the input.** Where `reduce()` collapses a list to one value, `accumulate()` keeps the full trail of partial results.

Think of summing `1:5`. `reduce()` gives you `15`. `accumulate()` gives you `1 3 6 10 15`, the partial sum after each element is added. The first output is the first input untouched, and every value after it is the running result of folding one more element into the accumulator.

That trail is the whole point. Many problems ask not for a final number but how a quantity evolved: a balance after each transaction, a portfolio value after each year. `accumulate()` answers that in one line, where a manual loop would need an index and a pre-allocated output vector.

## Syntax

**`accumulate(.x, .f, ..., .init, .dir = c("forward", "backward"))`. `.f` takes 2 arguments, `.init` is an optional seed, and `.dir` controls fold direction.**

```r title="Running sum versus a single reduce"
library(purrr)

reduce(1:5, `+`)
#> [1] 15

accumulate(1:5, `+`)
#> [1]  1  3  6 10 15
```

The first argument of `.f` is the accumulator, meaning the result so far. The second argument is the next element of `.x`. The output is a vector the same length as the input, and it keeps the names of `.x` when the input is named. You can pass `.f` as a bare function, a backtick-quoted operator like `+`, or a purrr-style lambda such as `~ .x + .y`.

[KEY INSIGHT]
**`accumulate()` is `reduce()` with a memory.** Both walk the input pairwise with the same function in the same order. `reduce()` throws away each partial result; `accumulate()` stores them. Whenever you ask "what did the running value look like along the way?", you want `accumulate()`.

## accumulate() examples by use case

### 1. Running totals and cumulative sums

The most common job is a running total: a balance, a score, or a count that grows element by element. Each output position holds the sum of every input up to and including that position.

```r title="Running total of a sequence"
accumulate(1:7, `+`)
#> [1]  1  3  6 10 15 21 28
```

This pattern fits any additive quantity, such as daily sales accumulating into a month-to-date figure.

### 2. Running maximum and running minimum

Pass `max` or `min` as `.f` to track the best or worst value seen so far. The result is a non-decreasing (or non-increasing) sequence, which is exactly what a high-water mark looks like.

```r title="Running maximum over a noisy vector"
scores <- c(3, 1, 4, 1, 5, 9, 2, 6)

accumulate(scores, max)
#> [1] 3 3 4 4 5 9 9 9
```

Once a new peak appears at position 6, it carries forward unchanged. Drawdown analysis uses this idea: compare each value against its running maximum.

### 3. Cumulative product

Swap in the `*` operator to get cumulative products. When the input is `1:n`, the result is the sequence of factorials, because each step multiplies the running product by the next integer.

```r title="Cumulative product yields factorials"
accumulate(1:6, `*`)
#> [1]   1   2   6  24 120 720
```

Position 6 is `6! = 720`, and every earlier position is the factorial of its index.

[TIP]
**For a plain cumulative sum or product, reach for base R first.** `cumsum()`, `cumprod()`, `cummax()`, and `cummin()` are vectorized in C and noticeably faster than `accumulate()`. Use `accumulate()` when the step function is custom and no `cum*()` helper exists, or when the input is a list rather than a plain numeric vector.

### 4. Compound growth with .init

The `.init` argument seeds the fold with a starting value, and that seed becomes the first element of the output. This models compound growth cleanly: the seed is the opening amount, and each growth factor multiplies the running balance.

```r title="Investment value after five years of 5% growth"
accumulate(rep(1.05, 5), `*`, .init = 1000)
#> [1] 1000.000 1050.000 1102.500 1157.625 1215.506 1276.282
```

The output has 6 values: the initial 1000 plus one per growth factor. Because `.init` adds an element, the result is always one longer than `.x` when a seed is supplied.

### 5. accumulate2() for two parallel inputs

`accumulate2()` walks two inputs at once. The second input `.y` must be exactly one element shorter than `.x`, and `.f` receives three arguments: the accumulator, the next `.x`, and the next `.y`.

```r title="Fold two vectors together"
accumulate2(1:4, c(10, 20, 30), ~ ..1 + ..2 + ..3)
#> [1]  1 13 36 70
```

The first result is `.x[1]` untouched. Each later step adds the next `.x` element and the next `.y` element to the running value, which is useful when the fold needs a second stream of data.

## accumulate() vs reduce()

**Both fold with the same function and the same argument order. They differ only in what they return.** Picking between them is a question of whether you need the journey or just the destination.

| Function | Returns | Use when |
|---|---|---|
| `reduce()` | Single final value | You only need the end result |
| `accumulate()` | Vector of every step | You need the running trail |
| `accumulate(.dir = "backward")` | Steps, right-to-left | The trail should build from the end |
| `base::Reduce(accumulate = TRUE)` | Vector of steps | You want no purrr dependency |

Direction matters for `accumulate()` too. A forward fold reports each prefix result, while a backward fold reports each suffix result.

```r title="Forward versus backward accumulation"
accumulate(1:5, `+`)
#> [1]  1  3  6 10 15

accumulate(1:5, `+`, .dir = "backward")
#> [1] 15 14 12  9  5
```

The backward result reads as "sum from here to the end" at each position, which is the natural shape for a countdown or a remaining-work estimate.

## Common pitfalls

**Pitfall 1: expecting a single value.** `accumulate()` returns a vector as long as `.x`, never a scalar. If you only want the final number, use `reduce()`, or take `tail(accumulate(...), 1)`.

**Pitfall 2: forgetting that `.init` adds an element.** With `.init` supplied, the output length is `length(.x) + 1` because the seed counts as the first element. This trips up code that expects the result to line up one-to-one with the input.

**Pitfall 3: mismatched lengths in `accumulate2()`.** The `.y` argument must have exactly one fewer element than `.x`. A wrong length throws an error rather than recycling silently, so check `length(.y) == length(.x) - 1` before calling.

[WARNING]
**A non-commutative function gives different forward and backward results.** For `+`, `*`, `max`, and `min`, the direction changes only the trail, not the final value. For string concatenation, subtraction, or list building, `.dir` changes the actual numbers. Always test both directions when the operation is order-sensitive.

## Try it yourself

**Try it:** Use `accumulate()` to build a running balance from a vector of transactions, starting from an opening balance of 500. Save the result to `ex_balance`.

```r title="Your turn: running account balance"
txns <- c(-100, 250, -75, -200, 400)

ex_balance <- # your code here

ex_balance
#> Expected: 500 400 650 575 375 775
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
txns <- c(-100, 250, -75, -200, 400)

ex_balance <- accumulate(txns, `+`, .init = 500)
ex_balance
#> [1] 500 400 650 575 375 775
```

**Explanation:** `.init = 500` seeds the running balance, so the first output value is the opening balance. Each later value adds the next transaction to the balance so far, giving the account history after every move.

</details>

## Related purrr functions

Once `accumulate()` makes sense, these neighbors round out the fold toolkit:

- `reduce()`: the same fold, but it returns only the final value
- `accumulate2()`: accumulate over two parallel inputs at once
- `reduce2()`: reduce over two parallel inputs
- `map()`: one transformed output per input, with no accumulation between elements
- `compose()`: chain several functions into a single function

For simple cumulative math on numeric vectors, base R's `cumsum()`, `cumprod()`, `cummax()`, and `cummin()` stay the fastest choice and need no package.

## FAQ

**What does accumulate() do in purrr?**

`accumulate(.x, .f)` folds a list or vector with a 2-argument function and returns every intermediate result. After processing each element it records the running value, so the output is a vector the same length as the input. It is the step-by-step version of `reduce()`, which keeps only the final folded value.

**What is the difference between accumulate and reduce in purrr?**

They apply the same function in the same way and the same order. `reduce()` returns only the final folded value, while `accumulate()` returns the complete sequence of partial results. Use `reduce()` for an end total and `accumulate()` when you need the running trail, such as a cumulative sum, a running maximum, or a balance over time.

**How is accumulate() different from cumsum() in R?**

`cumsum()` is hard-wired to addition and only works on numeric vectors. `accumulate()` accepts any 2-argument function, so it handles running products, running max, custom logic, and even list inputs. For a plain cumulative sum, `cumsum()` is faster because it is vectorized in C; for anything else, `accumulate()` is far more flexible.

**What does the .init argument do in accumulate()?**

`.init` sets the starting value of the accumulator and becomes the first element of the output. Without it, `accumulate()` uses the first element of `.x` as the seed. With it, the output is one element longer than `.x`, which is useful for modeling an opening balance, a base case, or a known starting state.

**Can accumulate() fold from right to left?**

Yes. Pass `.dir = "backward"` to fold from the last element toward the first. Each output value then represents the accumulated result of the suffix starting at that position. For order-sensitive functions, the backward trail differs from the forward trail.
</content>
