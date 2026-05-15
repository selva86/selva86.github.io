---
title: "purrr compose() in R: Combine Functions Into One"
slug: purrr-compose-in-R
description: "Learn purrr compose() in R to combine multiple functions into a single reusable function. Covers the .dir argument, execution order, and three common pitfalls."
keywords: "purrr compose, compose function R, purrr compose examples, R compose functions, function composition R, compose two functions R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "compose()|purrr compose|purrr::compose()|function composition|composed function"
auto_link_case_sensitive: true
target_keyword: "purrr compose"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr compose() in R: Combine Functions Into One

<p class="lead">purrr compose() in R takes two or more functions and returns a single new function that runs them in sequence, feeding each result into the next. It turns a repeated chain of steps into one named, reusable function you can pass around like any other.</p>

[QUICK ANSWER]
compose(toupper, trimws)                   # right-to-left: trim, then upper
compose(trimws, toupper, .dir = "forward") # left-to-right order
compose(round, \(x) x / 10)                # mix named and anonymous
clean <- compose(toupper, trimws)          # save the composed function
map_chr(words, compose(toupper, trimws))   # use one inline, inside map
do.call(compose, fn_list)                  # compose a list of functions

[DECISION TREE: Is compose() the right tool?]
- build one reusable function from several: compose(f, g)
- transform a value through steps once: x |> f() |> g()
- pre-set some arguments of a function: partial(fn, digits = 2)
- flip a predicate's TRUE/FALSE result: negate(is.null)
- apply one function across a list: map(x, fn)
- collapse a list of functions onto a value: reduce(fns, op)

## What compose does

**compose() bundles a pipeline into a function.** You hand it the functions you would otherwise call one after another, and it returns a closure that performs the whole sequence on whatever input you give it later. The functions are not run when you call compose(); nothing happens until you call the function it returns.

The default direction is the part that surprises newcomers. With `compose(f, g)`, the rightmost function `g` runs first and `f` runs on its output, matching the mathematical reading of "f after g". This is the opposite of a left-to-right pipe, and you can switch to pipe order with the `.dir` argument.

[KEY INSIGHT]
**A composed function is a value, not a result.** compose() hands back a function object, so you store it in a variable and reuse it everywhere a function is expected, including inside map(), as an argument to apply(), or passed to another function.

## compose syntax

**The signature is `compose(..., .dir = c("backward", "forward"))`.** Every argument before `.dir` is a function to include in the chain.

| Argument | Description |
|----------|-------------|
| `...` | Two or more functions to compose. Named functions, anonymous `\(x)` functions, and purrr `~` formulas all work. |
| `.dir` | Direction of application. `"backward"` (default) runs the last function first; `"forward"` runs the first function first. |

Each function should accept the output of the previous one. Only the function that runs first receives the arguments you pass to the composed function. Every later function gets a single value, the running result.

```r title="Load purrr and compose two functions"
library(purrr)

clean <- compose(toupper, trimws)
clean("  some text  ")
#> [1] "SOME TEXT"
```

The call `compose(toupper, trimws)` reads as "uppercase after trim". trimws() runs first because it sits on the right, then toupper() works on the trimmed string.

## Compose functions and set the order

**Saved once, a composed function works anywhere.** The example below builds a text-cleaning function from three steps and applies it across a vector with map_chr(). The composition itself is defined a single time, then reused for every element.

```r title="Compose three steps and map over a vector"
slugify <- compose(\(s) gsub(" ", "-", s), tolower, trimws)

words <- c("  Hello World ", " Data Science ")
map_chr(words, slugify)
#> [1] "hello-world"   "data-science"
```

Reading right to left: trimws() strips the padding, tolower() lowercases the text, and the anonymous function swaps spaces for hyphens. The whole transform now has a name, so it stays readable wherever it appears.

### Control direction with .dir

**Order matters whenever the functions do not commute.** Numeric steps make the difference visible. The same two functions produce different results depending on `.dir`.

```r title="Backward vs forward direction"
add1   <- function(x) x + 1
double <- function(x) x * 2

compose(add1, double)(5)
#> [1] 11
compose(add1, double, .dir = "forward")(5)
#> [1] 12
```

In the backward (default) call, double() runs first: `5 * 2` then `+ 1` gives 11. In the forward call, add1() runs first: `5 + 1` then `* 2` gives 12. Choose `"forward"` when you want the call to read in the same order the data flows through it.

[TIP]
**Use `.dir = "forward"` to match pipe order.** If your team reads code as a top-to-bottom pipeline, forward composition keeps `compose(step1, step2, step3)` in the same order as `x |> step1() |> step2() |> step3()`.

## compose vs the pipe and partial

**compose() builds a function; the pipe transforms a value.** They solve related problems but are not interchangeable. Reach for the tool that matches whether you need a reusable function or a one-time result.

| Tool | Produces | Best for |
|------|----------|----------|
| `compose(f, g)` | A new reusable function | A multi-step transform you apply many times |
| `x \|> f() \|> g()` | A value | Transforming one value once, inline |
| `partial(f, n = 2)` | A function with arguments fixed | Pre-filling arguments, not chaining steps |
| `reduce(fns, op)` | A value | Applying a list of functions decided at runtime |

The rule is short. If you would copy the same chain of calls into three places, name it once with compose(). If the chain runs in exactly one spot, the pipe is clearer. compose() and partial() pair well, since partial() adapts a function's signature and compose() strings the adapted functions together.

[NOTE]
**Coming from Python?** There is no built-in compose, but `toolz.compose` behaves like the default backward direction, and `functools.reduce` can chain functions manually. purrr's `.dir` argument gives you both orders without extra code.

## Common pitfalls

**The default order runs right to left.** Reading `compose(a, b)` as "a then b" is the most common mistake. The rightmost function always runs first under the default `"backward"` direction. When in doubt, pass `.dir = "forward"` and list the functions in execution order.

**Only the first-applied function takes multiple arguments.** Every later function receives a single value. A multi-argument function placed anywhere but the first-applied slot fails.

```r title="Multi-argument function in the wrong slot"
g <- compose(sqrt, \(x, y) x / y, .dir = "forward")
g(8, 2)
#> Error in sqrt(8, 2): 2 arguments passed to 'sqrt' which requires 1
```

Here `.dir = "forward"` makes sqrt() run first, so it receives both `8` and `2`. Put the multi-argument function in the first-applied slot instead.

**compose() captures functions by value.** The composed function stores the function objects as they were at creation. Redefining a source function afterward does not change the composition.

```r title="Redefining a source function has no effect"
step <- function(x) x + 1
bump <- compose(step, step)

step <- function(x) x * 100
bump(1)
#> [1] 3
```

bump() still adds one twice, because compose() captured the original `step` before it was redefined.

## Try it yourself

**Try it:** Build a function called `ex_norm` that trims whitespace and then lowercases a string, using compose(). Apply it to `"  MixedCase  "`.

```r title="Your turn: compose trim and lowercase"
# Try it: compose tolower after trimws
ex_norm <- # your code here

ex_norm("  MixedCase  ")
#> Expected: "mixedcase"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_norm <- compose(tolower, trimws)
ex_norm("  MixedCase  ")
#> [1] "mixedcase"
```

**Explanation:** Under the default backward direction, trimws() runs first because it sits on the right, then tolower() lowercases the trimmed result.

</details>

## Related purrr functions

These functions pair naturally with compose() when you build small function toolkits:

- The partial function fixes some of a function's arguments, producing a simpler signature that composes cleanly.
- The negate function returns a predicate that flips TRUE and FALSE, handy as one stage of a composition.
- The map function applies a composed function across every element of a list or vector.
- The reduce function folds a list of functions onto a value when the steps are decided at runtime.

See the [purrr compose reference](https://purrr.tidyverse.org/reference/compose.html) for the full specification.

## FAQ

**What does compose() do in purrr?**
compose() takes two or more functions and returns a single new function that runs them in sequence. Calling the returned function feeds your input through each stage, passing every result to the next function. It lets you name a repeated chain of steps once and reuse it as an ordinary function, including inside map() or as an argument to other functions.

**Does purrr compose run functions left to right or right to left?**
By default, right to left. With `compose(f, g)` the rightmost function `g` runs first, then `f` works on its output, which matches the mathematical phrase "f after g". To run functions in the order you wrote them, pass `.dir = "forward"`. Forward composition reads like a pipeline and is usually easier for teammates to follow.

**What is the difference between compose() and the pipe operator?**
The pipe `|>` sends one value through a series of calls and produces a value immediately. compose() produces a function instead, with no value computed until you call it. Use the pipe for a transformation that happens once, inline. Use compose() when you want to name the chain and reuse it in several places, or pass it where a function is expected.

**Can I compose functions that take multiple arguments?**
Yes, but only the first-applied function receives more than one argument. Every later stage gets a single value, the running result. Place a multi-argument function in the first-applied slot: the rightmost position under the default direction, or the leftmost position with `.dir = "forward"`. Functions after the first must accept exactly one input.

**Is there a base R equivalent of purrr compose()?**
Base R has no dedicated compose function. You can nest calls directly, as in `toupper(trimws(x))`, or build a composer with `Reduce()`. purrr's compose() is shorter, accepts anonymous and formula functions, and offers the `.dir` argument so you control execution order without rewriting the chain.
