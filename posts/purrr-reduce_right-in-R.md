---
title: "purrr reduce_right() in R: Fold a List From the Right"
slug: purrr-reduce_right-in-R
description: "purrr reduce_right() folds a list or vector from right to left in R. Learn its syntax, the modern backward-direction replacement, and worked examples."
keywords: "purrr reduce_right, reduce_right function R, purrr reduce_right examples, R reduce from right, right fold R, reduce backward direction R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "reduce_right()|purrr reduce_right|purrr::reduce_right()|right fold|fold from the right"
auto_link_case_sensitive: true
target_keyword: "purrr reduce_right"
sibling_block_enabled: true
difficulty: Intermediate
---

# purrr reduce_right() in R: Fold a List From the Right

<p class="lead">purrr reduce_right() folds a list or vector from right to left, combining elements with a binary function that starts at the last item and works backward to the first.</p>

[QUICK ANSWER]
reduce_right(1:4, `-`)                  # right fold: 1-(2-(3-4)) = -2
reduce(1:4, `-`, .dir = "backward")     # modern equivalent, purrr >= 1.0
reduce_right(x, f, .init = 0)           # seed value sits on the right
reduce2_right(x, y, f)                  # right fold over two inputs
reduce(1:4, `-`)                        # left fold, the default = -8
Reduce(`-`, 1:4, right = TRUE)          # base R right fold

[DECISION TREE: Is reduce_right() the right tool?]
- fold a list right-to-left: reduce(x, f, .dir = "backward")
- fold left-to-right instead: reduce(x, f)
- keep every intermediate result: accumulate(x, f, .dir = "backward")
- fold two lists in parallel: reduce2(x, y, f)
- transform each element, no fold: map(x, f)
- collapse with a base R verb: Reduce(f, x, right = TRUE)

## What reduce_right() does

**reduce_right() collapses a sequence into one value, starting from the right.** It takes a list or vector and a two-argument function, then applies that function repeatedly so the last element is processed first. A left fold computes `f(f(f(x1, x2), x3), x4)`; reduce_right() computes `f(x1, f(x2, f(x3, x4)))` instead.

For commutative operations the direction is invisible. For subtraction, division, string nesting, or list construction, the direction changes the answer entirely.

[KEY INSIGHT]
**In a right fold the accumulator is the second argument.** Each call looks like `f(element, accumulator)`, the mirror image of a left fold where the accumulator comes first. Get this backward and your reducer silently computes the wrong thing.

## Syntax

**reduce_right() shares its signature with reduce().** You pass the data, a binary reducer, and an optional seed value.

```r title="reduce_right signature"
reduce_right(.x, .f, ..., .init)
```

- `.x`: a list or atomic vector to fold.
- `.f`: a binary function called as `.f(element, accumulator)`.
- `.init`: optional starting value, placed at the right end of `.x`.
- `...`: extra arguments passed to every call of `.f`.

[NOTE]
**reduce_right() is superseded.** Since purrr 0.3.0 the recommended form is `reduce(.x, .f, .dir = "backward")`. The old function still works and is not scheduled for removal, but new code should prefer the `.dir` argument.

## reduce_right() examples

**Each example below highlights one use case for a right fold.** They run in a single loaded purrr session, so later blocks reuse earlier objects.

**Example 1: arithmetic shows the direction.** Subtraction is not commutative, so a left fold and a right fold disagree.

```r title="Right fold versus left fold"
library(purrr)

reduce_right(1:4, `-`)
#> [1] -2

reduce(1:4, `-`)
#> [1] -8
```

reduce_right() computes `1 - (2 - (3 - 4))`, which is `1 - (2 - -1)`, which is `1 - 3 = -2`. The default left fold computes `((1 - 2) - 3) - 4 = -8`.

**Example 2: seed the fold with .init.** The initial value joins the right end of the sequence.

```r title="reduce_right with an initial value"
reduce_right(1:3, `-`, .init = 10)
#> [1] -8
```

The fold becomes `1 - (2 - (3 - 10))`: first `3 - 10 = -7`, then `2 - -7 = 9`, then `1 - 9 = -8`.

**Example 3: nest strings from the inside out.** A right fold wraps later elements inside earlier ones.

```r title="Nesting strings with a right fold"
wrap <- function(x, acc) paste0(x, "(", acc, ")")

reduce_right(c("a", "b", "c"), wrap)
#> [1] "a(b(c))"

reduce(c("a", "b", "c"), wrap)
#> [1] "a(b)(c)"
```

The right fold builds one nested expression; the left fold chains the wraps side by side.

**Example 4: build a right-nested list.** Passing `list` as the reducer reveals the fold shape directly.

```r title="Right-nested list structure"
nested <- reduce_right(1:4, list)
str(nested)
#> List of 2
#>  $ : int 1
#>  $ :List of 2
#>   ..$ : int 2
#>   ..$ :List of 2
#>   .. ..$ : int 3
#>   .. ..$ : int 4
```

Each element nests inside the result of folding everything to its right.

## reduce_right() vs reduce(.dir = "backward")

**The two calls are identical in behavior.** purrr added the `.dir` argument so a single function covers both directions, and base R offers the same fold through `Reduce()`.

```r title="Three ways to fold from the right"
reduce_right(1:4, `-`)
#> [1] -2

reduce(1:4, `-`, .dir = "backward")
#> [1] -2

Reduce(`-`, 1:4, right = TRUE)
#> [1] -2
```

| Feature | reduce_right() | reduce(.dir = "backward") | Reduce(right = TRUE) |
|---|---|---|---|
| Package | purrr | purrr 1.0+ | base R |
| Lifecycle | Superseded | Current | Stable |
| Type-stable | Yes | Yes | No |
| Two-input variant | reduce2_right() | reduce2(.dir =) | none |

Use `reduce(.dir = "backward")` in new code. Reach for `Reduce(right = TRUE)` only when you want zero package dependencies.

[TIP]
**Skip the right fold for commutative reducers.** Addition, multiplication, `min()`, and `max()` give the same answer in either direction, so a right fold there only costs a function call and reader confusion. Direction matters only when `f(a, b)` differs from `f(b, a)`.

## Common pitfalls

**Pitfall 1: swapping the accumulator argument.** In a right fold `.f` receives `(element, accumulator)`. A reducer written as `function(acc, x)` treats each list element as the accumulator and silently produces nonsense, with no error to warn you.

**Pitfall 2: folding an empty input without .init.** reduce_right() cannot guess a starting value for an empty sequence.

```r title="Empty input needs init"
reduce_right(list(), `+`, .init = 0)
#> [1] 0
```

Without `.init`, an empty `.x` throws an error: supply a seed value whenever the input can be empty.

**Pitfall 3: expecting the intermediate steps.** reduce_right() returns only the final value. To see every partial fold, use `accumulate(.x, .f, .dir = "backward")` instead.

## Try it yourself

**Try it:** Use reduce_right() to fold the vector 1:5 with subtraction. Save the result to ex_rfold.

```r title="Your turn: right fold 1 to 5"
# Try it: right fold with subtraction
ex_rfold <- # your code here

ex_rfold
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rfold <- reduce_right(1:5, `-`)
ex_rfold
#> [1] 3
```

**Explanation:** The fold is `1 - (2 - (3 - (4 - 5)))`. Working inward: `4 - 5 = -1`, `3 - -1 = 4`, `2 - 4 = -2`, then `1 - -2 = 3`.

</details>

## Related purrr functions

- `reduce()`: the left-to-right fold and the home of the `.dir` argument.
- `reduce2()`: folds two sequences in parallel with a three-argument function.
- `accumulate()`: like reduce() but returns every intermediate value.
- `map()`: transforms each element independently with no accumulation.
- `compose()`: chains functions together, a frequent companion to right folds.

See the [purrr reduce reference](https://purrr.tidyverse.org/reference/reduce.html) for the full argument list.

## FAQ

**Is reduce_right() deprecated in purrr?**
reduce_right() is superseded, not removed. Since purrr 0.3.0 the tidyverse recommends `reduce(.x, .f, .dir = "backward")` for new code. The old function still runs without warnings and is not scheduled for deletion, so existing scripts keep working. Superseded simply means a better interface exists and the maintainers will not extend the old one.

**What is the difference between reduce and reduce_right in R?**
reduce() folds left to right, processing the first element first: `f(f(f(x1, x2), x3), x4)`. reduce_right() folds right to left, processing the last element first: `f(x1, f(x2, f(x3, x4)))`. For commutative functions the results match. For subtraction, division, or any operation where order matters, the two return different values.

**How does reduce_right() handle the .init argument?**
With reduce_right() the `.init` value is placed at the right end of the sequence, so it is the first thing combined. `reduce_right(1:3, -, .init = 10)` evaluates `1 - (2 - (3 - 10))`. This mirrors a left fold, where `.init` instead joins the left end and starts the accumulation off.

**Does fold direction matter for sum or product?**
No. Addition and multiplication are commutative and associative, so a left fold and a right fold always agree. Direction only changes the result for non-commutative reducers such as subtraction, division, string concatenation, and list nesting. When in doubt, test both on a small input.
