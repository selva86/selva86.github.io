---
title: "purrr reduce2() in R: Fold Two Lists in Parallel"
slug: "purrr-reduce2-in-R"
description: "Use purrr reduce2() in R to fold a list while a second parallel list supplies an extra argument at each step. Covers syntax, the length rule, and examples."
keywords: "purrr reduce2, reduce2 function R, purrr reduce2 examples, R reduce2 two lists, accumulate2 vs reduce2, reduce2 init argument"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "reduce2()|purrr reduce2|purrr::reduce2()|accumulate2()|fold two lists|reduce with two lists"
auto_link_case_sensitive: true
target_keyword: "purrr reduce2"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# purrr reduce2() in R: Fold Two Lists in Parallel

<p class="lead">The <code>reduce2()</code> function in purrr extends <code>reduce()</code>: it folds one list while a second, parallel list supplies an extra argument at every step.</p>

[QUICK ANSWER]
reduce2(x, y, \(acc, e, w) acc + e * w)   # 3-arg accumulator
reduce2(words, seps, paste0)              # join with varying separators
reduce2(x, ops, \(acc, e, op) op(acc, e)) # different op each step
reduce2(x, y, f, .init = 0)               # .init: .x and .y same length
accumulate2(x, y, f)                      # keep every intermediate step
reduce2(.x, .y, .f)                       # rule: length(.y) = length(.x) - 1

[DECISION TREE: Is reduce2() the right tool?]
- fold a list with a second parallel list: reduce2()
- fold a single list to one value: reduce()
- keep every intermediate fold step: accumulate2()
- one result per pair of inputs: map2()
- run side effects over two lists: walk2()
- fold over three or more lists: pmap() inside reduce()

## What reduce2() does

**`reduce2(.x, .y, .f)` folds `.x` like `reduce()`, but passes one element of `.y` into every step.** The accumulator function takes three arguments instead of two: the running result, the next `.x` element, and the next `.y` element. Use it when each fold step needs an extra piece of data, such as a separator, a weight, or an operator.

`reduce2()` is the two-input cousin of `reduce()`. Where `reduce()` collapses one list, `reduce2()` walks two lists in lockstep.

A concrete way to picture it: imagine combining a list of data frames where the join type changes at each merge. The data frames are `.x`, the join functions are `.y`, and `reduce2()` threads them together. Any time a fold needs a decision or a value that varies from step to step, `reduce2()` is the right shape. The function is part of the same family as `map2()` and `walk2()`, which also pair two parallel inputs, but those produce one output per element rather than a single folded result.

## Syntax and the length rule

**`reduce2(.x, .y, .f, ..., .init)` requires `.y` to be exactly one element shorter than `.x`.** That is the rule beginners miss most. An `.x` of length n produces n-1 fold steps, and each step consumes one `.y` element, so `.y` has length n-1.

```r title="Basic reduce2 with a 3-arg function"
library(purrr)

words <- c("data", "science", "with", "R")
seps  <- c("-", "_", ".")

reduce2(words, seps, paste0)
#> [1] "data-science_with.R"
```

Here `.x` has 4 elements and `.y` has 3. The fold starts with `"data"`, then evaluates `paste0("data", "-", "science")`, and continues. `paste0()` works as `.f` because it accepts all three arguments positionally.

The argument order inside `.f` is fixed and matters: the first argument is always the running accumulator, the second is the current `.x` element, and the third is the current `.y` element. Getting that order wrong is the most common source of confusing results. The `...` slot passes constant arguments straight through to `.f` on every call, which is handy for a fixed option such as `by = "id"` in a join.

When you pass `.init`, the fold gains one extra step, so `.x` and `.y` must then have the *same* length. Without `.init`, the first `.x` element becomes the starting accumulator and no `.y` element is consumed for it, which is the reason `.y` is one element shorter.

[KEY INSIGHT]
**`reduce2()` is `reduce()` with a side channel.** The `.y` list feeds step-specific data into the accumulator, so the operation can change at every step instead of staying fixed. That single idea covers separators, weights, and per-step operators.

## reduce2() examples

**Each example below uses a different shape of `.y`: a numeric vector, a list of operators, and a length-matched vector with `.init`.** All three run in sequence and share the same session.

### 1. Weight each element differently

```r title="Weighted fold across two vectors"
values  <- c(2, 3, 4)
weights <- c(10, 100)

reduce2(values, weights, \(acc, val, w) acc + val * w)
#> [1] 432
```

The fold seeds with `2`, then computes `2 + 3 * 10 = 32`, then `32 + 4 * 100 = 432`. The `.y` list supplies a fresh weight at every step.

### 2. Apply a different operator each step

```r title="Operators stored in a list"
ops <- list(`+`, `*`, `-`)

reduce2(c(5, 3, 4, 2), ops, \(acc, x, op) op(acc, x))
#> [1] 30
```

Here `.y` is a list of functions. Step one is `5 + 3 = 8`, step two is `8 * 4 = 32`, step three is `32 - 2 = 30`. This turns `reduce2()` into a tiny programmable calculator.

### 3. Match lengths with .init

```r title="Using .init so .x and .y are equal length"
reduce2(1:3, c(10, 20, 30), \(acc, x, y) acc + x + y, .init = 0)
#> [1] 66
```

With `.init = 0`, both lists are length 3. The fold runs `0 + 1 + 10`, then `+ 2 + 20`, then `+ 3 + 30`, giving `66`. Using `.init` is also the safe way to fold a possibly empty `.x`, since the seed value guarantees a result even when there is nothing to combine.

### 4. Combine data frames with a different join each step

```r title="Join data frames with varying join types"
library(dplyr)

dfs <- list(
  data.frame(id = 1:3, a = c(10, 20, 30)),
  data.frame(id = 2:4, b = c(40, 50, 60)),
  data.frame(id = 1:3, c = c(70, 80, 90))
)
joins <- list(inner_join, full_join)

reduce2(dfs, joins, \(acc, df, join) join(acc, df, by = "id"))
#>   id  a  b  c
#> 1  2 20 40 80
#> 2  3 30 50 90
#> 3  1 NA NA 70
```

This is the example that shows why `reduce2()` exists. A plain `reduce()` would force every merge to use the same join. Here the first merge is an `inner_join()` and the second is a `full_join()`, because the join functions live in the `.y` list. The result keeps only ids `2` and `3` after the inner join, then the full join adds id `1` back with `NA` for the missing columns.

[TIP]
**Reach for an explicit lambda when `.f` takes three arguments.** Backtick operators like `+` accept only two arguments and will error inside `reduce2()`. Writing `\(acc, x, y) ...` makes the three roles obvious and prevents arity bugs.

## reduce2() vs reduce() vs accumulate2()

**These three functions differ in input count and in what they return.** Pick by how many parallel lists you have and whether you need the intermediate steps.

| Function | Inputs | Returns | Use when |
|---|---|---|---|
| `reduce()` | one list | final value | standard single-list fold |
| `reduce2()` | two parallel lists | final value | each step needs extra data |
| `accumulate2()` | two parallel lists | list of every step | you want to inspect the fold |

`accumulate2()` shares the two-list signature of `reduce2()` but keeps every intermediate result.

```r title="accumulate2 keeps each step"
accumulate2(c(2, 3, 4), c(10, 100), \(acc, val, w) acc + val * w)
#> [[1]]
#> [1] 2
#> [[2]]
#> [1] 32
#> [[3]]
#> [1] 432
```

`accumulate2()` returns a list, so wrap it in `unlist()` when you want a plain vector. Seeing every step is useful when a fold gives a surprising final answer and you need to find which step went wrong.

[NOTE]
**Coming from Python?** The closest equivalent is `functools.reduce()` over a zipped pair of sequences, where each step receives a tuple. `reduce2()` is cleaner because the two lists stay separate and the accumulator function reads its three arguments by name.

## Common pitfalls

**Pitfall 1: length mismatch.** `reduce2(1:4, 1:4, f)` errors because `.y` must be `length(.x) - 1`. Drop one `.y` element, or add `.init` to make the two lengths equal.

**Pitfall 2: a 2-argument `.f`.** Passing `+` as `.f` fails because `reduce2()` always calls `.f` with three arguments. Supply a three-argument lambda instead.

**Pitfall 3: expecting `.y` per element.** The `.y` list is consumed *between* `.x` elements, not alongside each one. With n elements there are only n-1 gaps, which is why `.y` is shorter. If you really need a value for every element, prepend a dummy first entry to `.y` and pair it with `.init`, or rethink the problem as a `map2()` call instead.

**Pitfall 4: reaching for `reduce2()` when a loop is clearer.** A `reduce2()` call shines when the fold is short and the accumulator function is simple. If each step is long or has many branches, a plain `for` loop over `seq_along(.x)` is easier to read and to debug. Choose the tool that makes the next reader's job easier, not the one that looks the most functional.

[WARNING]
**A silent wrong answer is worse than an error.** If `.f` ignores its third argument, `reduce2()` runs without complaint and quietly behaves like `reduce()`. Always confirm `.f` actually uses the `.y` value.

## Try it yourself

**Try it:** Use `reduce2()` to join the words `c("a", "b", "c")` with the separators `c("+", "-")`. Save the result to `ex_joined`.

```r title="Your turn: join with reduce2"
# Try it: join words with varying separators
ex_joined <- # your code here

ex_joined
#> Expected: "a+b-c"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_joined <- reduce2(c("a", "b", "c"), c("+", "-"), paste0)
ex_joined
#> [1] "a+b-c"
```

**Explanation:** `paste0()` receives the accumulator, the next word, and the next separator at each step. The result builds left to right: `"a"`, then `"a+b"`, then `"a+b-c"`.

</details>

## Related purrr functions

After `reduce2()`, these purrr tools handle nearby jobs:

- `reduce()`: fold a single list down to one value
- `accumulate2()`: like `reduce2()` but returns every intermediate step
- `map2()`: one output per pair of inputs instead of a fold
- `walk2()`: two-list iteration for side effects only
- `pmap()`: iterate over three or more parallel lists

See the official [purrr reduce reference](https://purrr.tidyverse.org/reference/reduce.html) for the full argument list.

## FAQ

**What does reduce2() do in purrr?**

`reduce2()` folds the list `.x` while a second parallel list `.y` supplies an extra argument at every step. The accumulator function `.f` takes three inputs: the running result, the next `.x` element, and the next `.y` element. It is useful when each fold step needs step-specific data such as a separator or a weight.

**Why does reduce2() need .y to be shorter than .x?**

A fold over n elements has only n-1 steps, because the first element seeds the accumulator. Each step consumes one `.y` value, so `.y` has length n-1. When you pass `.init`, the fold gains a step and `.x` and `.y` become equal length.

**What is the difference between reduce2() and accumulate2()?**

Both take two parallel lists and a three-argument function. `reduce2()` returns only the final folded value. `accumulate2()` returns a list containing every intermediate result, which is helpful for debugging a fold or showing running output.

**Can reduce2() use a backtick operator like the plus sign?**

No. `reduce2()` always calls `.f` with three arguments, and `+` accepts only two. You must supply a three-argument function such as `\(acc, x, y) acc + x + y`. The same restriction applies to other binary operators.

**How do I reduce two lists in base R?**

Base R has no direct two-list `Reduce()`. You can combine the two lists with `mapply()` first and then `Reduce()` over the result, or write an explicit loop. purrr's `reduce2()` is the cleanest option for parallel two-list folds.
</content>
</invoke>
