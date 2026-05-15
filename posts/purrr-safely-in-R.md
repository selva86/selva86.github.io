---
title: "purrr safely() in R: Catch Errors Without Stopping Code"
slug: purrr-safely-in-R
description: "Use purrr safely() in R to wrap risky functions so errors are captured as values, not crashes. Examples with map(), transpose(), otherwise, and possibly()."
keywords: "purrr safely, safely function R, purrr safely examples, R safely error handling, safely possibly R, purrr capture errors, safely map R"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "safely()|purrr safely|purrr::safely()|safely() function|purrr safely function|safely adverb"
auto_link_case_sensitive: true
target_keyword: "purrr safely"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr safely() in R: Catch Errors Without Stopping Code

<p class="lead">purrr safely() wraps a function so errors become values instead of crashes. The wrapped function always returns a list with two slots, <code>result</code> and <code>error</code>, so a single bad input never halts a loop.</p>

[QUICK ANSWER]
safely(log)                          # wrap a function
safely(log)(10)$result               # get the value
safely(log)("a")$error               # get the error
safely(log, otherwise = NA)          # default value on failure
map(x, safely(log))                  # safe iteration
map(x, safely(log)) |> transpose()   # split results from errors
safely(log, quiet = FALSE)           # also print the error

[DECISION TREE: Is safely() the right tool?]
- keep both value and error: safely(f)
- want only a fallback value: possibly(f, otherwise = NA)
- capture warnings and messages: quietly(f)
- stop on the first error instead: map(x, f)
- retry a flaky network call: insistently(f)
- debug interactively on error: auto_browse(f)

## What safely() does in one sentence

**safely() converts a risky function into a safe one.** It takes a function as input and returns a new function. That new function never throws an error: it runs the original code, and whatever happens, hands you back a two-element list. One element holds the successful value, the other holds the error object. Exactly one of them is `NULL`.

This pattern matters most when you iterate. A normal `map()` over ten inputs stops dead on the first failure, and you lose the nine results that worked. Wrapping the function with `safely()` lets every input run to completion so you can inspect failures afterward.

## Syntax and arguments

**safely() has three arguments.** Only the first is required.

```r title="The safely function signature"
library(purrr)

# safely(.f, otherwise = NULL, quiet = TRUE)
safe_log <- safely(log)
safe_log
#> function (...)
#> capture_error(.f(...), otherwise, quiet)
```

- `.f` is the function to wrap. Pass it bare (`log`), as a string (`"log"`), or as a lambda (`\(x) log(x)`).
- `otherwise` is the value placed in the `result` slot when the call fails. The default is `NULL`.
- `quiet` controls whether the error is also printed to the console. The default `TRUE` stays silent; set `FALSE` while debugging.

[NOTE]
**safely() is a function operator.** It belongs to the same purrr family as `possibly()`, `quietly()`, and `compose()`: functions that take a function and return a modified function. The R community calls these "adverbs" because they modify how a verb behaves.

## Four worked examples

**Start with a single safe call.** The wrapped function returns a list every time, success or failure.

```r title="A safe call returns result and error"
safe_log <- safely(log)

safe_log(100)
#> $result
#> [1] 4.60517
#> $error
#> NULL

safe_log("not a number")
#> $result
#> NULL
#> $error
#> <simpleError in .Primitive("log")("not a number"): non-numeric argument to mathematical function>
```

On success, `result` holds the value and `error` is `NULL`. On failure, the two swap. You test which case you got by checking `is.null(out$error)`.

**Supply a fallback with `otherwise`.** Instead of `NULL`, the `result` slot can carry a sentinel value you choose.

```r title="Set a fallback value with otherwise"
safe_log <- safely(log, otherwise = NA_real_)

safe_log("bad")$result
#> [1] NA
```

This keeps `result` type-stable. Every call now yields a number, so downstream code that expects numeric input never sees a `NULL`.

**Iterate safely over a messy list.** This is the core use case. One bad element no longer kills the whole run.

```r title="Map safely over mixed inputs"
inputs <- list(1, 10, "oops", 100)

out <- map(inputs, safely(log))
out[[3]]$error
#> <simpleError in .Primitive("log")("oops"): non-numeric argument to mathematical function>
```

Every input ran. `out` is a list of four result/error pairs, and only the third one failed.

**Split results from errors with `transpose()`.** A list of pairs is awkward to use. `transpose()` flips it into two parallel lists.

```r title="Transpose then keep only successes"
out <- map(inputs, safely(log)) |> transpose()

ok <- out$result |> compact()
ok
#> [[1]]
#> [1] 0
#>
#> [[2]]
#> [1] 2.302585
#>
#> [[3]]
#> [1] 4.60517
```

`transpose()` gives you `out$result` and `out$error` as separate lists. `compact()` drops the `NULL` entries, leaving the three values that succeeded.

## safely() vs possibly() vs quietly()

**Pick the adverb that matches what you need back.** All three wrap a function, but they return different things.

| Adverb | Returns | Use when |
|---|---|---|
| `safely()` | `list(result, error)` | You need to inspect *which* inputs failed and why |
| `possibly()` | the value, or `otherwise` | You only want a clean value and can discard failures |
| `quietly()` | `list(result, output, warnings, messages)` | The function prints warnings or messages, not errors |
| `tryCatch()` | whatever your handler returns | You need custom base-R control flow per error type |

The decision rule is short. Need the error object for logging or a report? Use `safely()`. Just want the loop to finish and do not care about the failures? `possibly()` is lighter. Chasing a warning rather than an error? `safely()` will not help, because warnings are not errors; reach for `quietly()`.

## Common pitfalls

**safely() returns a function, not a result.** A frequent mistake is calling it like `safely(log, 100)`, expecting the log of 100. That passes `100` to the `otherwise` argument. You must capture the wrapped function first, then call it: `safely(log)(100)`.

**The result slot is NULL on failure.** Code that pipes `out$result` straight into arithmetic will break on a `NULL`. Either set `otherwise` to a type-stable sentinel, or call `compact()` to drop the empty slots before you continue.

[WARNING]
**safely() does not catch warnings.** `sqrt(-1)` returns `NaN` with a warning, not an error, so a safely-wrapped `sqrt` reports success and a `NaN` result. If you need to trap warnings, wrap with `quietly()` instead and read its `warnings` slot.

## Try it yourself

**Try it:** Wrap log() with safely() and map it over list(1, "two", 3). Save the captured output to ex_safe and pull out the error from element 2.

```r title="Your turn: safely wrap log"
# Try it: safely + map + transpose
ex_safe <- # your code here

ex_safe$error[[2]]
#> Expected: a simpleError about a non-numeric argument
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_safe <- map(list(1, "two", 3), safely(log)) |> transpose()
ex_safe$error[[2]]
#> <simpleError in .Primitive("log")("two"): non-numeric argument to mathematical function>
```

**Explanation:** safely() turns each call into a result/error pair, and transpose() regroups the list of pairs into two parallel lists. That lets you index `ex_safe$error` to inspect every failure at once.

</details>

## Related purrr functions

**safely() sits in a small family of error-handling adverbs.** Reach for a sibling when your need is slightly different.

- `possibly()` returns a plain value or a default, with no error object.
- `quietly()` captures printed output, warnings, and messages.
- `map()` is the iteration verb safely() is most often paired with.
- `transpose()` reshapes the list of result/error pairs.
- `compact()` removes `NULL` entries after a safe run.

For the bigger picture of adverbs and function operators, see the [Functional Programming in R](Functional-Programming-in-R.html) guide. The official [purrr adverbs reference](https://purrr.tidyverse.org/reference/safely.html) documents every argument.

## FAQ

**What is the difference between safely() and possibly() in R?**

`safely()` returns a list with both a `result` and an `error` slot, so you can see exactly which inputs failed and read the error message. `possibly()` returns only the value, or a fallback you specify, and discards the error entirely. Use `safely()` when you need to report or log failures; use `possibly()` when you just want the loop to finish and a clean value is enough.

**Does safely() catch warnings?**

No. `safely()` only intercepts errors, the conditions that would normally stop execution. Warnings and messages pass through untouched, so a function that emits a warning still counts as a success and its `error` slot stays `NULL`. To capture warnings and messages, wrap the function with `quietly()` instead, which returns dedicated `warnings` and `messages` slots.

**How do I get just the successful results from a safely() run?**

After mapping `safely(f)` over your inputs, pipe the list into `transpose()` to split it into `$result` and `$error`. Then call `compact()` on `$result` to drop the `NULL` entries left by failed calls. The remaining list holds only the values that succeeded, ready for further processing.

**Is safely() part of base R or a package?**

`safely()` comes from the purrr package, part of the tidyverse. Load it with `library(purrr)`. The base-R equivalents are `tryCatch()` and `try()`, which give you more manual control but require more boilerplate. `safely()` is a thin, consistent wrapper designed to compose cleanly with `map()`.
