---
title: "purrr quietly() in R: Trap Output, Warnings, Messages"
slug: purrr-quietly-in-R
description: "Learn how purrr's quietly() in R wraps a function to capture its printed output, warnings, and messages as a tidy list. Worked examples, pitfalls, FAQ."
keywords: "purrr quietly, quietly function R, purrr quietly examples, R capture warnings, purrr adverbs, quietly purrr output, capture side-effects R"
mathjax: false
webr: true
date: 2026-05-15
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "quietly()|purrr quietly|purrr::quietly()|capture side-effects|quietly adverb"
auto_link_case_sensitive: true
target_keyword: "purrr quietly"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr quietly() in R: Trap Output, Warnings, Messages

<p class="lead">purrr <code>quietly()</code> in R wraps a function so its printed output, warnings, and messages are captured as data instead of spilling to the console. The wrapped function returns a tidy four-element list you can inspect, store, or filter.</p>

[QUICK ANSWER]
quietly(f)                          # wrap a function
quietly(f)(x)$result                # the return value
quietly(f)(x)$output                # captured print() output
quietly(f)(x)$warnings              # warnings as a character vector
quietly(f)(x)$messages              # messages as a character vector
map(inputs, quietly(f))             # run quietly across a list
map(runs, "warnings")               # pluck warnings from each run

[DECISION TREE: Is quietly() the right tool?]
- inspect warnings or messages a function emits: quietly(f)
- catch an error that would stop your code: safely(f)
- swap an error for a fallback value: possibly(f, otherwise = NA)
- retry a flaky call a few times: insistently(f)
- discard warnings entirely, no record: suppressWarnings(expr)

## What quietly() does

**quietly() turns side-effects into data.** Most R functions emit warnings and messages straight to the console. Those signals do not stop execution, which makes them easy to miss in a long script and impossible to test programmatically. `quietly()` solves this by capturing those signals where you can actually work with them.

It belongs to a small group of purrr functions called adverbs. An adverb takes one function and returns a modified version of it, leaving the original untouched. `safely()` and `possibly()` are adverbs for errors; `quietly()` is the adverb for the quieter side-effects. The wrapped function still does exactly what the original did, accepts the same arguments, and produces the same result. The only change is what happens to the noise.

When you call the wrapped function, its return value is no longer a bare value. Instead you get a named list with four parts: `result` holds the original return value, `output` holds anything sent to `print()` or `cat()`, `warnings` holds a character vector of warning text, and `messages` holds a character vector of message text. Nothing reaches the console, so you can examine each channel on its own terms.

[KEY INSIGHT]
**Side-effects become inspectable values.** Once a warning lives inside `res$warnings` rather than the console, you can count it, log it, store it, or branch on it. That is the entire purpose of `quietly()`: it makes the noisy parts of a function as queryable as its return value.

## quietly() syntax and arguments

**quietly() takes a single argument.** You pass the function you want to silence, and you get back a new function with the same call signature as the original.

```r title="quietly basic syntax"
library(purrr)

quiet_sqrt <- quietly(sqrt)
out <- quiet_sqrt(-4)
names(out)
#> [1] "result"   "output"   "warnings" "messages"
```

The only argument is `.f`, the function to wrap. It accepts a plain function object, an anonymous function written inline, or a string naming a function such as `"sqrt"`. The returned function forwards every argument straight through to `.f`, so `quiet_sqrt(-4)` behaves like `sqrt(-4)` in every way except that the warning is trapped rather than printed.

The shape of the returned list never changes. Even when a function emits no warnings at all, the `warnings` slot still exists as a zero-length character vector. Here `sqrt(-4)` produces `NaN` plus a warning, and both are reachable by name:

```r title="quietly return list elements"
out$result
#> [1] NaN

out$warnings
#> [1] "NaNs produced"
```

## Four worked examples

### Capture everything from a noisy function

**Start with a function that emits all three side-effects.** This example prints, messages, and warns in one call, so every slot of the returned list gets filled. Seeing all four channels populated at once makes the structure concrete.

```r title="Capture print message and warning"
noisy <- function(x) {
  print(paste("Processing", x))
  message("Working on it")
  warning("Something looked odd")
  x * 10
}

quiet_noisy <- quietly(noisy)
result <- quiet_noisy(4)
str(result)
#> List of 4
#>  $ result  : num 40
#>  $ output  : chr "[1] \"Processing 4\""
#>  $ warnings: chr "Something looked odd"
#>  $ messages: chr "Working on it\n"
```

The console stays completely silent. `result$result` holds `40`, the print call is stored as a string in `output`, and the message and warning sit in their own slots. Notice the message keeps its trailing newline, because `message()` adds one before sending text.

### Collect warnings from coercion

**Real warnings are worth capturing too.** Converting bad strings with `as.numeric()` triggers the familiar "NAs introduced by coercion" warning. With `quietly()`, that warning becomes a value you can keep alongside the partially converted result.

```r title="Capture coercion warning"
quiet_num <- quietly(as.numeric)
coerced <- quiet_num(c("10", "20", "oops"))

coerced$result
#> [1] 10 20 NA

coerced$warnings
#> [1] "NAs introduced by coercion"
```

### Run quietly across a list with map()

**quietly() shines when paired with map().** Wrap the function once, then map it over many inputs to get one capture list per element. This is the pattern that makes `quietly()` worth learning.

```r title="quietly across a list with map"
inputs <- list(c("1", "2"), c("3", "bad"), c("x", "y"))
runs <- map(inputs, quietly(as.numeric))

map(runs, "result")
#> [[1]]
#> [1] 1 2
#>
#> [[2]]
#> [1]  3 NA
#>
#> [[3]]
#> [1] NA NA
```

`runs` is a list of three capture lists. The string shortcut `map(runs, "result")` plucks the `result` slot out of each one, so you get the values without the surrounding noise.

### Flag which inputs produced warnings

**Now the captured data earns its keep.** Because warnings are stored as vectors, you can test their length to find out exactly which inputs were problematic, then act on that.

```r title="Flag inputs that warned"
had_warning <- map_lgl(runs, ~ length(.x$warnings) > 0)
had_warning
#> [1] FALSE  TRUE  TRUE

sum(had_warning)
#> [1] 2
```

Two of the three inputs raised a warning, and you found out without reading a single console line. In a batch job, this turns a silent data-quality problem into a clear audit trail.

## quietly() vs safely() vs possibly()

**quietly() is the side-effects adverb; safely() and possibly() are the error adverbs.** They share the same wrapping idea but solve different problems, so picking the right one matters.

| Adverb | Captures | Returns | Use when |
|---|---|---|---|
| `quietly()` | output, warnings, messages | list of `result`, `output`, `warnings`, `messages` | you want to inspect side-effects |
| `safely()` | errors | list of `result` and `error` | a call might throw an error |
| `possibly()` | errors | the result, or your `otherwise` default | you want a fallback on error |

The decision rule is simple. If your concern is a function that *stops* execution, reach for `safely()` or `possibly()`. If your concern is a function that *runs fine but complains*, reach for `quietly()`. When a call can do both, nest the adverbs: `safely(quietly(f))` captures the warnings inside the success branch and still traps any error in its own slot.

[WARNING]
**quietly() does not capture errors.** A wrapped function that hits `stop()` still aborts your code. `quietly()` only intercepts output, warnings, and messages, never errors. If a call can both warn and fail, combine `quietly()` with `safely()` rather than expecting `quietly()` to handle everything.

## Common pitfalls

**Three mistakes account for most quietly() confusion.** Each has a quick fix once you can see it.

**Forgetting the result is nested.** The wrapped function never returns a bare value. It always returns the four-element list, so using the call directly in arithmetic silently breaks downstream code:

```r title="Pitfall nested result"
quiet_sum <- quietly(sum)
total <- quiet_sum(1:5)
# total + 1                       # error: non-numeric argument
total$result + 1                  # correct
#> [1] 16
```

Always reach into `$result` when you want the value the original function would have returned.

**Expecting errors to be trapped.** `quietly()` ignores `stop()` entirely, so a wrapped function that errors still aborts. Wrap with `safely()` when failure is possible:

```r title="Pitfall errors not caught"
risky <- quietly(function() stop("real error"))
# risky()                         # still throws: real error
```

**Confusing output with result.** The `output` slot holds captured console text from `print()` or `cat()`, while `result` holds the actual return value. They are different channels and usually hold different things. A function that prints a table but returns a data frame will put the printed text in `output` and the data frame in `result`.

## Try it yourself

**Try it:** Wrap `log` with `quietly()` and call the wrapped function on `-1`. `log(-1)` returns `NaN` and raises a warning. Pull the warning text out of the capture list, storing the full list in `ex_result`.

```r title="Your turn: capture a log warning"
# Try it: capture the warning from log(-1)
ex_quiet <- # your code here
ex_result <- # your code here

ex_result$warnings
#> Expected: "NaNs produced"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_quiet <- quietly(log)
ex_result <- ex_quiet(-1)

ex_result$warnings
#> [1] "NaNs produced"
```

**Explanation:** `quietly(log)` returns a wrapped function. Calling it on `-1` runs `log(-1)`, which yields `NaN` with a warning. The warning text is captured in the `warnings` slot instead of printing to the console.

</details>

## Related purrr functions

**quietly() belongs to the purrr adverb family.** These functions modify other functions rather than mapping over data:

- `safely()` wraps a function to capture errors as a `result` and `error` pair.
- `possibly()` returns a default value when a function errors.
- `insistently()` retries a function that fails intermittently.
- `compose()` chains several functions into one combined function.
- `negate()` flips a predicate function's `TRUE` and `FALSE` results.

For the full argument reference, see the [purrr quietly() documentation](https://purrr.tidyverse.org/reference/quietly.html) on the tidyverse site.

## FAQ

**Does quietly() catch errors in R?**

No. `quietly()` only captures printed output, warnings, and messages. If the wrapped function calls `stop()`, the error still propagates and halts your code. To trap errors, use `safely()`, which returns a list with `result` and `error` elements, or `possibly()`, which substitutes a default value. You can nest the adverbs, such as `safely(quietly(f))`, to capture both side-effects and errors from a single call.

**What is the difference between quietly() and suppressWarnings()?**

`suppressWarnings()` discards warnings completely, leaving no record that anything happened. `quietly()` keeps them: the warnings are stored in the returned list so you can count, log, or test them later. Use `suppressWarnings()` when a warning is genuinely noise you never need again. Use `quietly()` when you want the warning out of the console but still need it available as data.

**What does quietly() return?**

The wrapped function returns a named list with four elements. `result` is the original return value of the function. `output` is a character string of anything sent to `print()` or `cat()`. `warnings` is a character vector of warning messages, and `messages` is a character vector of message text. Empty channels return zero-length vectors, so `length(res$warnings)` is a reliable test for whether any warning fired.

**Can I use quietly() with map()?**

Yes, and it is the most common pattern. Pass `quietly(f)` as the function argument to `map()` to get one capture list per input. You can then call `map(runs, "result")` to extract just the values, or `map(runs, "warnings")` to gather every warning across the run. This makes `quietly()` ideal for batch processing where you want to audit side-effects after the work is done.
