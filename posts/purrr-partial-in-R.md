---
title: "purrr partial() in R: Pre-Fill Function Arguments"
slug: purrr-partial-in-R
description: "Learn how purrr's partial() in R pre-fills function arguments to build reusable, single-purpose functions. Syntax, map() examples, unquoting, and pitfalls."
keywords: "purrr partial, partial function R, purrr partial examples, R partial application, partial() purrr, pre-fill function arguments R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "partial()|purrr partial|purrr::partial()|partial application|function operator|partially apply"
auto_link_case_sensitive: true
target_keyword: "purrr partial"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr partial() in R: Pre-Fill Function Arguments

<p class="lead">The purrr partial() function in R pre-fills one or more arguments of a function, returning a new, simpler function you can name, reuse, or drop straight into <code>map()</code>.</p>

[QUICK ANSWER]
partial(round, digits = 2)              # pre-fill one argument
partial(paste, sep = "-")               # pre-fill a named argument
partial(log, base = 10)                 # build a single-purpose function
map(x, partial(mean, na.rm = TRUE))     # pass it into map()
partial(paste, "Q:")                    # pre-fill a positional argument
partial(rnorm, n = !!5)                 # unquote: evaluate the value once
partial(quantile, probs = 0.95)         # fix a tuning value

[DECISION TREE: Is partial() the right tool?]
- pre-fill some function arguments: partial(round, digits = 2)
- chain several functions together: compose(sqrt, abs)
- flip a TRUE/FALSE predicate: negate(is.na)
- write a one-off inline wrapper: \(x) round(x, 2)
- catch errors without stopping: safely(read.csv)
- pre-fill many functions at once: map(fns, partial, na.rm = TRUE)

## What purrr partial() does

**partial() specializes a general function.** You give it a function plus values for some of its arguments, and it hands back a new function that already carries those values. The classic name for this idea is partial application: you partially apply a function to only part of its arguments now, and supply the rest later.

This matters because R code is full of functions that take a few "configuration" arguments alongside the real input. `round()` needs `digits`, `mean()` needs `na.rm`, `paste()` needs `sep`. Repeating those settings on every call is noise, and noise hides bugs. `partial()` bakes the settings in once so the call site shows only what changes.

It belongs to a small group of purrr tools called function operators: functions that take a function and return a modified function. `partial()` is the simplest of them, and it is the one you reach for most often when writing functional programming in R.

```r title="Pre-fill an argument with partial"
library(purrr)

# round() normally needs digits on every call
round(3.14159, digits = 2)
#> [1] 3.14

# partial() bakes digits in once
round2 <- partial(round, digits = 2)
round2(3.14159)
#> [1] 3.14
round2(2.71828)
#> [1] 2.72
```

[KEY INSIGHT]
**A partial function turns configuration into identity.** `round2` is not just "round with options". It is a named thing that means "round to 2 decimals" everywhere it appears, which makes call sites read like plain English.

## partial() syntax

**The signature is `partial(.f, ...)`.** The first argument `.f` is the function to specialize. Everything in `...` is an argument you want to pre-fill, passed by name or by position exactly as you would pass it to `.f` itself.

| Argument | Role |
|----------|------|
| `.f` | The function to partially apply |
| `...` | Named or positional arguments to fix in advance |

The function that `partial()` returns itself takes only `...`. Unlike `compose()` or `negate()`, `partial()` does not copy the original signature of `.f`. Any arguments you did not pre-fill simply pass through when you call the new function. Named pre-filling is the safer habit: it survives any change to the original function's argument order, while positional pre-filling silently breaks if that order shifts.

```r title="Pre-fill positional and named arguments"
# named pre-fill
dash <- partial(paste, sep = "-")
dash("2026", "05", "15")
#> [1] "2026-05-15"

# positional pre-fill: the first argument of paste is fixed
label <- partial(paste, "Result:")
label("ok")
#> [1] "Result: ok"
```

## Four ways to use partial()

**partial() shines wherever a function needs the same settings repeatedly.** These four patterns cover almost every real use you will meet in day-to-day R work.

1. **Name a configured function.** Writing `clean_mean <- partial(mean, na.rm = TRUE)` documents intent far better than scattering `na.rm = TRUE` through a script. The name itself explains what the function is for.
2. **Feed `map()` cleanly.** Instead of wrapping a call in an anonymous function every time, pass the partial function straight into `map()`, `map_dbl()`, or any iteration helper.
3. **Fix a tuning value.** Locking an analysis choice like `p95 <- partial(quantile, probs = 0.95)` keeps that decision in one place, so changing it later is a one-line edit.
4. **Adapt a function to an interface.** When a helper expects a function of one argument, `partial()` reshapes a multi-argument function to fit without writing a wrapper by hand.

The second pattern is the most common. Anywhere you would otherwise type `function(x) f(x, some_option = value)`, a named partial function is shorter and reads better.

```r title="Use partial inside map"
vals <- list(c(1, 2, NA), c(4, NA, 6), c(7, 8, 9))

# without partial: an anonymous function repeats the option
map_dbl(vals, function(x) mean(x, na.rm = TRUE))
#> [1] 1.5 5.0 8.0

# with partial: the intent gets a name
mean_clean <- partial(mean, na.rm = TRUE)
map_dbl(vals, mean_clean)
#> [1] 1.5 5.0 8.0
```

[TIP]
**Give partial functions descriptive names.** `mean_clean` or `round2` read far better at the call site than a buried `na.rm = TRUE`. The name is the documentation, so spend a moment choosing it.

## partial() vs other purrr function operators

**partial() pre-fills arguments; the other operators reshape behavior.** purrr ships a small family of function operators that each take a function and return a modified one. Picking the right member keeps code honest and avoids forcing one tool to do another's job.

| Tool | Use when | Example |
|------|----------|---------|
| `partial()` | Pre-fill some arguments of one function | `partial(round, digits = 2)` |
| `compose()` | Chain several functions into one | `compose(sqrt, abs)` |
| `negate()` | Invert a TRUE/FALSE predicate | `negate(is.na)` |
| anonymous `\(x)` | One-off wrapper used once inline | `\(x) round(x, 2)` |

The decision rule is short. Reach for `partial()` when you will reuse the configured function or want it named. If the wrapper is used exactly once and is trivial, an anonymous function `\(x) ...` is shorter and clearer than a saved object. Use `compose()` when the goal is sequencing functions rather than fixing arguments, and `negate()` whenever you only need to flip a predicate's logic.

[NOTE]
**Coming from Python?** The direct equivalent of `partial()` is `functools.partial`. Both freeze chosen arguments and return a callable that accepts the rest.

## Common pitfalls

**Pre-filled arguments are lazy by default.** A pre-filled value is stored as an expression and re-evaluated on every call. If that expression reads a variable, the partial function tracks the variable's current value, not the value it held when the function was created. This is convenient sometimes and a silent bug at other times.

```r title="Lock values with unquoting"
threshold <- 100

# !! unquotes: the value 100 is locked in now
clamp <- partial(pmin, !!threshold)
clamp(c(50, 150, 200))
#> [1]  50 100 100

# changing threshold later does not affect clamp
threshold <- 0
clamp(c(50, 150, 200))
#> [1]  50 100 100
```

[WARNING]
**Without `!!`, the partial function follows the variable.** `partial(pmin, threshold)` stores the name `threshold`, so editing `threshold` later silently changes the function's behavior. Unquote with `!!` whenever the value should be frozen.

Two more limits are worth knowing. You cannot call `partial()` twice to re-fill the same argument with a new expression, so build the function with its final settings in one call. And a pre-filled argument cannot refer to the function's other arguments, since those values do not exist until call time. When you need that kind of cross-argument logic, a hand-written wrapper function is the right tool instead.

## Try it yourself

**Try it:** Use `partial()` to build a function `ex_pct` that formats a number with `formatC`, pre-filling `format = "f"`, `digits = 1`, and `flag = "0"`. Call it on `50` and paste a `%` sign.

```r title="Your turn: build a percent formatter"
# Try it: pre-fill formatC with partial()
ex_pct <- # your code here

paste0(ex_pct(50), "%")
#> Expected: "50.0%"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pct <- partial(formatC, format = "f", digits = 1, flag = "0")
paste0(ex_pct(50), "%")
#> [1] "50.0%"
```

**Explanation:** `partial()` fixes the three formatting arguments, leaving only the number as the open argument. The result is a clean, single-purpose formatter you can reuse anywhere.

</details>

## Related purrr functions

These functions pair naturally with `partial()` when you build with functional programming in R:

- `compose()` joins several functions into a single pipeline function.
- `negate()` flips a predicate so `TRUE` becomes `FALSE`.
- `map()` applies a function, often a partial one, across a list or vector.
- `safely()` wraps a function so errors return a value instead of stopping.
- `lift()` changes how a function receives its arguments.

For the bigger picture, see the [purrr package reference](https://purrr.tidyverse.org/reference/partial.html).

## FAQ

**What does partial() do in R?**

`partial()` from the purrr package performs partial application: it takes a function and values for some of its arguments, then returns a new function with those arguments pre-filled. The new function only needs the arguments you left open, which makes repeated calls shorter and gives the configured behavior a name you can reuse across a script.

**What is the difference between partial() and an anonymous function?**

Both can pre-fill arguments. An anonymous function like `\(x) round(x, 2)` is best for a one-off wrapper used inline. `partial(round, digits = 2)` is better when you want to name the result, reuse it across a script, or pass it cleanly into `map()`. `partial()` also makes the configuration explicit rather than buried in a function body.

**Why is my partial() function giving changing results?**

Pre-filled arguments are lazy: they are stored as expressions and re-evaluated on every call. If a pre-filled value reads a variable or calls something random, it updates each time. Unquote the value with `!!`, as in `partial(rnorm, n = !!5)`, to evaluate it once when the function is created and freeze it.

**Can I pre-fill positional arguments with partial()?**

Yes. You can pass arguments to `partial()` by position or by name, exactly as you would call the original function. `partial(paste, "Q:")` fixes the first positional argument, so calling the result adds further pieces after `"Q:"`. Named pre-filling is usually clearer because it survives changes to the function's argument order.

**Does partial() keep the original function's argument names?**

No. The function `partial()` returns takes only `...`, so it does not reuse the signature of the original function. Arguments you did not pre-fill still pass through correctly, but editor autocomplete will not show them. If preserving the visible signature matters, a hand-written wrapper function is the better choice.
