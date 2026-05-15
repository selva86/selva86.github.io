---
title: "purrr possibly() in R: Return a Default on Error"
slug: purrr-possibly-in-R
description: "Use purrr possibly() in R to wrap risky functions so failures return a fallback value instead of an error. Examples with map_dbl, otherwise, and safely."
keywords: "purrr possibly, possibly function R, purrr possibly examples, R possibly error handling, possibly vs safely R, possibly otherwise"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "possibly()|purrr possibly|purrr::possibly()|possibly() function|purrr possibly function|possibly adverb"
auto_link_case_sensitive: true
target_keyword: "purrr possibly"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr possibly() in R: Return a Default on Error

<p class="lead">purrr possibly() wraps a function so a failure returns a fallback value instead of stopping your code. Unlike safely(), it hands back the plain value directly, which keeps map_dbl() and map_chr() type-stable.</p>

[QUICK ANSWER]
possibly(log)                          # wrap a function, NULL on error
possibly(log, otherwise = NA)          # wrap with a fallback value
possibly(log)(10)                      # call the wrapped function
possibly(log, otherwise = NA)("x")     # failed call returns NA
map_dbl(x, possibly(log, otherwise = NA_real_))  # type-stable iteration
possibly(f, otherwise = 0, quiet = FALSE)        # also print the error
mtcars |> map(possibly(risky))         # finish a loop despite failures

[DECISION TREE: Is possibly() the right tool?]
- want a clean value, drop errors: possibly(f, otherwise = NA)
- need the error message too: safely(f)
- capture warnings and messages: quietly(f)
- retry a flaky network call: insistently(f)
- stop on the first error instead: map(x, f)
- custom handling per error type: tryCatch(expr, error = h)

## What possibly() does

**possibly() turns a risky function into one that cannot fail.** It takes a function and returns a new function. The new function runs the original code, and if that code throws an error, it quietly returns a fallback value you chose instead. You never see the error, only the result or the default.

The contrast with `safely()` is the whole point. `safely()` returns a two-element `list(result, error)` so you can inspect failures. `possibly()` throws the error away and returns just the value. That makes it the lighter choice when you only want a loop to finish and a clean value is enough.

## possibly() syntax and arguments

**possibly() takes three arguments, and only the first is required.**

```r title="The possibly function signature"
library(purrr)

# possibly(.f, otherwise = NULL, quiet = TRUE)
safe_log <- possibly(log, otherwise = NA_real_)
safe_log(100)
#> [1] 4.60517
```

- `.f` is the function to wrap. Pass it bare (`log`), as a string (`"log"`), or as a lambda (`\(x) log(x)`).
- `otherwise` is the value returned when the call fails. The default is `NULL`.
- `quiet` controls whether the error is also printed. The default `TRUE` stays silent; set `FALSE` while debugging.

[NOTE]
**possibly() changed in purrr 1.0.0.** Older versions required the `otherwise` argument; modern purrr defaults it to `NULL`. The `quiet` argument arrived in the same release, so upgrade the package if `possibly(f, quiet = FALSE)` raises an unused-argument error.

## possibly() examples

**Start with a single wrapped call.** The wrapped function returns the real value on success and the fallback on failure.

```r title="A single call with a fallback"
safe_log <- possibly(log, otherwise = NA_real_)

safe_log(100)
#> [1] 4.60517
safe_log("not a number")
#> [1] NA
```

The first call succeeds and returns the logarithm. The second would normally error, but `possibly()` swaps in `NA_real_` so the call still returns cleanly.

**Iterate with map_dbl() and stay type-stable.** This is where `possibly()` beats `safely()`. Because it returns a bare value, the output drops straight into a typed vector.

```r title="Type-stable iteration with map_dbl"
inputs <- list(1, 10, "bad", 100)

map_dbl(inputs, possibly(log, otherwise = NA_real_))
#> [1] 0.000000 2.302585       NA 4.605170
```

Every input ran. The third element failed and became `NA`, while `map_dbl()` still returned a plain numeric vector you can sum, plot, or filter.

[KEY INSIGHT]
**possibly() is the type-stable error adverb.** Because it returns a plain value rather than a list, `map_dbl()`, `map_int()`, and `map_chr()` accept its output directly. `safely()` cannot do this: its list-of-pairs output forces you back to `map()` plus a separate cleanup step.

**Guard a custom function that calls stop().** Any function of your own that raises an error can be wrapped the same way.

```r title="Wrap a custom risky function"
risky_divide <- function(x) {
  if (x == 0) stop("cannot divide by zero")
  10 / x
}

map_dbl(c(2, 5, 0, 10), possibly(risky_divide, otherwise = Inf))
#> [1] 5.0 2.0 Inf 1.0
```

The zero input triggers `stop()`, and `possibly()` returns the `Inf` fallback for that position. The fallback does not have to be `NA`; pick whatever value downstream code expects.

**Apply a fallback inside a data pipeline.** A realistic case is a lookup that fails for unknown keys.

```r title="possibly inside a map pipeline"
rates <- c(USD = 1, EUR = 0.92, GBP = 0.79)

to_usd <- function(code) {
  if (!code %in% names(rates)) stop("unknown currency")
  1 / rates[[code]]
}

map_dbl(c("EUR", "GBP", "JPY", "USD"), possibly(to_usd, otherwise = NA_real_))
#> [1] 1.086957 1.265823       NA 1.000000
```

`JPY` is missing from the lookup table, so its call errors and becomes `NA`. The other three convert normally, and the result stays a clean numeric vector.

## When to use possibly() instead of safely()

**Choose possibly() when you want output, not diagnostics.** Both adverbs stop a single failure from killing a loop, but they hand back different things.

| Aspect | possibly() | safely() |
|---|---|---|
| Return on success | the value itself | `list(result = value, error = NULL)` |
| Return on failure | the `otherwise` fallback | `list(result = NULL, error = <error>)` |
| Tells you which input failed | No | Yes |
| Works with `map_dbl()` / `map_chr()` | Yes, type-stable | No, returns lists |
| Best for | clean output, discard failures | logging and debugging failures |

The rule is short. If your next step is arithmetic, a typed vector, or a plot, `possibly()` gives you usable output immediately. If your next step is a report on what broke, `safely()` keeps the error objects you need. When unsure, start with `possibly()`; it is the simpler tool, and you can swap in `safely()` later.

## Common mistakes with possibly()

**possibly() returns a function, not a result.** Writing `possibly(log, 100)` does not compute the log of 100. The `100` is passed to the `otherwise` argument. You must capture the wrapped function first, then call it: `possibly(log)(100)`.

**The fallback should match the success type.** If a successful call returns a number, set `otherwise` to a number such as `NA_real_`, not a string. A mismatched fallback breaks `map_dbl()`, because the output vector cannot mix a numeric result with a character default.

[WARNING]
**possibly() hides which inputs failed.** It discards the error object entirely, so after a run you cannot tell a genuine `NA` from a failed call that returned `NA`. When you need that distinction for logging or a report, use `safely()` instead and inspect its `error` slot.

## Try it yourself

**Try it:** Wrap sqrt() with possibly() so a non-numeric input returns NA, then map_dbl it over list(4, "x", 9, 16). Save the result to ex_roots.

```r title="Your turn: possibly wrap sqrt"
# Try it: possibly + map_dbl
ex_roots <- # your code here

ex_roots
#> Expected: 2, NA, 3, 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_roots <- map_dbl(list(4, "x", 9, 16), possibly(sqrt, otherwise = NA_real_))
ex_roots
#> [1]  2 NA  3  4
```

**Explanation:** possibly() turns sqrt() into a function that returns NA_real_ when it errors on the string input. map_dbl() then collects every call into one clean numeric vector.

</details>

## Related purrr functions

**possibly() is one of purrr's error-handling adverbs.** Switch to a sibling when your need is slightly different.

- `safely()` returns a `result`/`error` list so you can inspect every failure.
- `quietly()` captures printed output, warnings, and messages instead of errors.
- `insistently()` retries a failing call on a schedule before giving up.
- `map_dbl()` is the typed iteration verb `possibly()` pairs with most often.
- `compose()` chains several functions into a single new function.

For the wider picture of adverbs and function operators, see the [Functional Programming in R](Functional-Programming-in-R.html) guide. The official [purrr adverbs reference](https://purrr.tidyverse.org/reference/possibly.html) documents every argument.

## FAQ

**What is the difference between possibly() and safely() in R?**

`possibly()` returns the plain value on success and a fallback you choose on failure, discarding the error. `safely()` returns a two-element list with both a `result` and an `error` slot, so you can see which inputs failed and why. Use `possibly()` when a clean value is all you need and you can ignore failures. Use `safely()` when you must log or report the errors that occurred.

**What does the otherwise argument do in possibly()?**

`otherwise` sets the value returned whenever the wrapped function throws an error. It defaults to `NULL`. Set it to a type-stable sentinel that matches your successful output, such as `NA_real_` for numbers or `"<missing>"` for strings. A matching type lets `map_dbl()` or `map_chr()` collect the results into a clean atomic vector without a type error.

**Does possibly() catch warnings in R?**

No. `possibly()` only intercepts errors, the conditions that halt execution. Warnings and messages pass through untouched, so a call that emits a warning still counts as a success and returns its value. `sqrt(-1)`, for example, returns `NaN` with a warning, not the `otherwise` fallback. To capture warnings and messages, wrap the function with `quietly()` instead.

**Can I use possibly() with map_dbl()?**

Yes, and this is its main advantage over `safely()`. Because `possibly()` returns a bare value rather than a list, `map_dbl()`, `map_int()`, and `map_chr()` accept its output directly. Set `otherwise` to a fallback of the matching type, such as `NA_real_` for `map_dbl()`, so the result vector stays type-stable.
