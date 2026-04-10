---
title: "Write Better R Functions: Arguments, Defaults, Scope & When to Vectorise"
slug: "R-Functions"
description: "Stop copy-pasting code. Learn to write clean R functions with default arguments, explicit return values, proper scoping rules, and built-in error checking."
keywords: "R functions, writing functions in R, R function arguments, default arguments R, lexical scoping R, return values R, vectorization R, R function syntax"
auto_link_terms: "writing R functions|R function arguments|R function scope|lexical scoping|default arguments in R|return value in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.10"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "Writing R Functions"
sidebar_order: 10
---


# Write Better R Functions: Arguments, Defaults, Scope & When to Vectorise

<p class="lead">An R function is a reusable block of code you call by name with arguments. Writing your own functions lets you turn repeated steps into a single command, cut bugs, and make scripts readable.</p>

## Introduction

You have written the same five lines of code three times in the same script. Now you have three places to fix the same bug. That is the signal to write a function.

A function wraps a chunk of logic behind a name. You call it with different inputs and get consistent outputs. The logic lives in exactly one place, so fixing a bug fixes it everywhere. That is the first reason to write functions. The second is readability: a call like `clean_dates(sales)` tells a reader what you meant, while twelve lines of string manipulation do not.

In this tutorial you will learn how R functions are built piece by piece: arguments, defaults, the body, and the return value. You will see how R decides which argument goes where when you call a function, how it finds variables using lexical scoping, how to accept any number of extra arguments with `...`, and how to validate inputs so your function fails with a clear message instead of a cryptic crash.

Every code block below is runnable. Click Run and the code executes in your browser. Edit the values, run again, and watch what changes. Blocks build on one another, so run them top to bottom the first time through.

## What is a function in R? (anatomy)

Every R function has four parts: a **name**, a list of **arguments**, a **body**, and a **return value**. You assign the whole thing to a name with `<-`, just like any other object in R.

![Anatomy of an R function](screenshots/R-Functions-anatomy.webp)
*Figure 1: The four parts of every R function: name, arguments, body, and return value.*

Let's build the simplest possible function: one that squares a number. The argument is `x`, the body multiplies `x` by itself, and the last expression in the body is the return value.

```r
# Define a function called square
square <- function(x) {
  x * x
}

# Call it with an argument
result <- square(5)
print(result)
#> [1] 25
```

What happened: `function(x) { x * x }` creates a function object, and `<-` binds that object to the name `square`. Calling `square(5)` runs the body with `x = 5`, and R returns the value of the last expression (`x * x = 25`). You now have a reusable tool you can call as many times as you want.

[TIP]
**Name functions with verbs, not nouns.** A function *does* something, so clean_dates() or compute_tax() reads better than dates() or tax(). Save nouns for the variables that hold data.

Function bodies can be longer. When you need intermediate values, assign them with `<-` inside the body. They are local to the function and disappear when the function finishes.

```r
# A function with intermediate local variables
bmi_calc <- function(weight_kg, height_m) {
  bmi <- weight_kg / (height_m ^ 2)
  rounded <- round(bmi, 1)
  rounded
}

bmi_calc(weight_kg = 72, height_m = 1.75)
#> [1] 23.5
```

The variables `bmi` and `rounded` exist only while the function runs. After the call, they are gone — you cannot type `bmi` at the prompt and see 23.5. Only the returned value (`rounded`) leaves the function. Isolation like this is why functions are safer than copy-pasted scripts: local work stays local.

## How do you set default arguments in R functions?

Arguments without defaults are **required** — omitting one throws an error. Arguments with defaults are **optional**; R uses the default when you do not provide a value. This lets you build flexible functions that have sensible behavior out of the box.

![How R matches arguments](screenshots/R-Functions-arg-matching.webp)
*Figure 2: R matches arguments in four steps: exact name, partial name, position, then defaults.*

Here is a function with one required argument (`name`) and one with a default (`greeting`).

```r
# One required argument, one with a default
greet <- function(name, greeting = "Hello") {
  paste0(greeting, ", ", name, "!")
}

# Call using position (name first)
greet("Selva")
#> [1] "Hello, Selva!"

# Override the default by name
greet("Selva", greeting = "Welcome")
#> [1] "Welcome, Selva!"

# Call fully by name — order does not matter
greet(greeting = "Hi", name = "Priya")
#> [1] "Hi, Priya!"
```

Three calls, three ways to pass the same arguments. R matches arguments in a fixed order: first by exact name, then by partial name, then by position, and finally it fills in missing ones from the defaults. Passing by name is the safest style — your call keeps working even if the function's author reorders arguments later.

[WARNING]
**Partial-name matching is fragile.** R will let greet("Selva", gr = "Hi") match `gr` to `greeting`, but a future argument starting with `g` would silently break your code. Always write argument names in full.

Defaults can reference other arguments. The default is evaluated **when the function is called**, not when it is defined. This is called lazy evaluation, and it lets you write defaults that depend on the user's inputs.

```r
# Default that depends on another argument
price_with_tax <- function(price, tax_rate = 0.08, tax = price * tax_rate) {
  price + tax
}

# Use the default tax (8% of price)
price_with_tax(price = 100)
#> [1] 108

# Override tax_rate — the tax default recomputes
price_with_tax(price = 100, tax_rate = 0.20)
#> [1] 120

# Override tax directly — tax_rate is ignored
price_with_tax(price = 100, tax = 5)
#> [1] 105
```

The `tax` argument defaults to `price * tax_rate`, so you get the right tax amount whether you override nothing, the rate, or the tax itself. You did not have to compute anything yourself. Lazy defaults let you express relationships between arguments in the signature itself.

## How does an R function return values?

Every R function returns exactly one object. If the function's last expression produces a value, R returns that value — you do not need to write `return()`. This is called an **implicit return**, and it is the idiomatic R style for short functions.

```r
# Implicit return: last expression is returned
area <- function(length, width) {
  length * width   # no return() needed
}

area(3, 4)
#> [1] 12
```

The function has one expression, `length * width`, and R returns it. Short functions read more clearly this way. Adding `return()` here would only add noise.

Use **explicit** `return()` when you need to exit early, typically to handle an edge case before the main logic runs. Early returns flatten nested `if`/`else` branches and make the code easier to follow.

```r
# Early return guards against bad input
safe_div <- function(a, b) {
  if (b == 0) {
    return(NA)          # exit now, skip the rest
  }
  a / b                 # implicit return of the normal result
}

safe_div(10, 2)
#> [1] 5
safe_div(10, 0)
#> [1] NA
```

The guard `if (b == 0) return(NA)` handles the divide-by-zero case up front, and the rest of the body assumes `b` is safe. Compared to an `if`/`else` wrapping the whole body, the early-return style keeps the main logic at the left margin where the eye expects it.

A function can return only one object, but that object can be a **list**. This is how you return "multiple values" in R: bundle them into a named list.

```r
# Return multiple values as a named list
describe_vec <- function(x) {
  list(
    mean = mean(x),
    sd   = sd(x),
    n    = length(x)
  )
}

stats_out <- describe_vec(c(4, 8, 15, 16, 23, 42))
stats_out$mean
#> [1] 18
stats_out$sd
#> [1] 13.62351
stats_out$n
#> [1] 6
```

The caller pulls out whatever they need with `$name`. Named lists are self-documenting — `stats_out$mean` is clearer than `stats_out[[1]]`, and adding a new output later will not renumber existing ones.

[KEY INSIGHT]
**R functions return exactly one object, but that object can be anything — a number, a vector, a list, a data frame, even another function.** "Returning multiple values" in R means returning a single list that contains them.

## What is lexical scoping in R?

Variables created inside a function are **local**. They exist only while the function runs and disappear when it returns. Variables from outside the function are **free**, and R finds them using a rule called **lexical scoping**.

![How R resolves a variable](screenshots/R-Functions-scope-chain.webp)
*Figure 3: How R searches environments to resolve a variable name inside a function.*

First, watch how local variables vanish when the function returns:

```r
# Locals are destroyed when the function exits
local_demo <- function() {
  secret <- 42
  secret * 2
}

local_demo()
#> [1] 84

# secret is not visible here
exists("secret")
#> [1] FALSE
```

`secret` lived inside `local_demo()` only. Outside, `exists("secret")` returns FALSE. This isolation is a feature: function internals cannot pollute your workspace, and your workspace cannot accidentally change function internals.

When a function uses a name it did not define locally, R searches **outward** — first in the environment where the function was defined, then up the chain toward the global environment.

```r
# The free variable `threshold` comes from outside
threshold <- 170

is_tall <- function(height) {
  height > threshold    # threshold is not local — R searches outward
}

is_tall(175)
#> [1] TRUE
is_tall(165)
#> [1] FALSE

# Change the global, and the function sees the new value
threshold <- 180
is_tall(175)
#> [1] FALSE
```

The function does not hard-code 170 — it looks up `threshold` in the global environment every time it runs. Change the global, and the function's behavior changes. That is lexical scoping in action.

[WARNING]
**Modifying a global from inside a function with the super-assignment operator is almost always a mistake.** It creates invisible couplings that make code hard to debug. If a function needs to change something, return the new value and let the caller assign.

## How do you pass extra arguments with `...`?

The special argument `...` (three dots, also called "dots") lets a function accept any number of extra arguments and forward them to another function. You use it when you are writing a **wrapper** — a function that adds a little bit of behavior around an existing one.

```r
# Wrapper that forwards extra args to any stat function
apply_fn <- function(x, fn, ...) {
  result <- fn(x, ...)       # forward ... to fn
  cat("Input length:", length(x), "| Output:", result, "\n")
  result
}

# Forward na.rm = TRUE to mean()
apply_fn(c(1, 2, NA, 4), mean, na.rm = TRUE)
#> Input length: 4 | Output: 2.333333
#> [1] 2.333333

# Forward trim to mean()
apply_fn(c(1, 2, 100, 3, 4), mean, trim = 0.2)
#> Input length: 5 | Output: 3
#> [1] 3
```

The wrapper does not care what arguments `mean()` accepts — it just collects them with `...` and passes them through. You can swap `mean` for `sum`, `median`, or any other function, and the wrapper still works. This is how functions like `lapply()`, `aggregate()`, and most plotting wrappers stay flexible.

[TIP]
**Use `...` to forward plot or formatting options through your function.** If your my_plot() wraps plot(), take `...` and pass it on — callers can still pass col, pch, main, and every other base-R plot arg without you having to list them.

## How should your R functions validate inputs?

A function that silently returns nonsense is harder to debug than one that stops loudly. Check your inputs at the top of the function. If they are wrong, stop immediately with a clear message — do not let bad data flow through your logic.

The fastest check is `stopifnot()`. It stops execution if any of its conditions is FALSE.

```r
# stopifnot() halts with the failing condition
safe_sqrt <- function(x) {
  stopifnot(is.numeric(x), all(x >= 0))
  sqrt(x)
}

safe_sqrt(c(4, 9, 16))
#> [1] 2 3 4

# This call fails loudly (commented to keep the notebook running):
# safe_sqrt(c(4, -1, 9))
#> Error in safe_sqrt(c(4, -1, 9)) : all(x >= 0) is not TRUE
```

`stopifnot()` is terse and fine for internal helpers. For functions you share, write a custom `stop()` with a message that explains both the problem **and the fix**. Commenting out the failing call keeps the notebook flow intact while still showing readers the expected error.

```r
# Custom stop() with actionable message
divide <- function(a, b) {
  if (!is.numeric(a) || !is.numeric(b)) {
    stop("Both `a` and `b` must be numeric. Got: a=", class(a), ", b=", class(b))
  }
  if (b == 0) {
    stop("`b` is zero. Provide a non-zero denominator.")
  }
  a / b
}

divide(10, 2)
#> [1] 5
# divide(10, 0)
#> Error in divide(10, 0) : `b` is zero. Provide a non-zero denominator.
```

The error message names the argument (`b`), tells the user what is wrong ("is zero"), and tells them how to fix it ("Provide a non-zero denominator"). Future-you will thank present-you at 2 a.m. when this message appears in a log.

[KEY INSIGHT]
**Validate at the boundary, trust the internals.** Check inputs once, at the top of the public function. Helper functions called from inside can assume the data is already clean.

## Common Mistakes and How to Fix Them

### Mistake 1: Defining a function without assigning it

❌ **Wrong:**
```r
function(x) {
  x * 2
}
# Then trying to call:
# double(5)
#> Error: could not find function "double"
```

**Why it is wrong:** `function(...) { ... }` creates a function object, but nothing holds a reference to it. Without `<-`, the object is immediately garbage-collected and has no name to call.

✅ **Correct:**
```r
double <- function(x) {
  x * 2
}
double(5)
#> [1] 10
```

### Mistake 2: Using `=` instead of `<-` inside the body

❌ **Wrong:**
```r
# Mixing = and <- confuses readers and breaks style checkers
bad_fn <- function(x, y) {
  z = x + y
  z
}
```

**Why it is wrong:** `=` and `<-` both assign at the top level of a function body, but mixing them is a style error that confuses readers and tools. Named-argument calls at the call site use `=` (e.g., `mean(x, na.rm = TRUE)`), and keeping `<-` for assignment avoids visual collision with named args.

✅ **Correct:**
```r
good_fn <- function(x, y) {
  z <- x + y
  z
}
good_fn(3, 4)
#> [1] 7
```

### Mistake 3: Depending on a global variable that can change

❌ **Wrong:**
```r
rate <- 0.08
with_tax_bad <- function(price) {
  price * (1 + rate)   # rate comes from global — caller may change it
}

rate <- 0.20                 # someone else's script changes this
with_tax_bad(100)            # now returns 120, not 108
#> [1] 120
```

**Why it is wrong:** The function's output depends on a variable the caller might not realize they are affecting. Tests pass, then mysteriously fail when scripts run in a different order.

✅ **Correct:**
```r
with_tax_good <- function(price, rate = 0.08) {
  price * (1 + rate)
}
with_tax_good(100)
#> [1] 108
with_tax_good(100, rate = 0.20)
#> [1] 120
```

### Mistake 4: Deep nesting instead of an early return

❌ **Wrong:**
```r
classify_bad <- function(x) {
  if (is.numeric(x)) {
    if (length(x) > 0) {
      if (!any(is.na(x))) {
        mean(x)
      } else {
        NA
      }
    } else {
      NA
    }
  } else {
    NA
  }
}
```

**Why it is wrong:** Three levels of `if` for three guard conditions pushes the real logic far to the right and forces the reader to match braces to find the main path.

✅ **Correct:**
```r
classify_good <- function(x) {
  if (!is.numeric(x))    return(NA)
  if (length(x) == 0)    return(NA)
  if (any(is.na(x)))     return(NA)
  mean(x)
}
classify_good(c(2, 4, 6))
#> [1] 4
```

## Practice Exercises

### Exercise 1: Convert Celsius to Fahrenheit

Write a function `celsius_to_f(c)` that converts a Celsius temperature to Fahrenheit. Formula: `f = c * 9/5 + 32`. Test it on `0` (expect 32) and `100` (expect 212).

```r
# Exercise: write celsius_to_f(c)
# Hint: one-line body, implicit return

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
celsius_to_f <- function(c) {
  c * 9/5 + 32
}

celsius_to_f(0)
#> [1] 32
celsius_to_f(100)
#> [1] 212
```

**Explanation:** R is vectorised, so this function also works on a whole vector: `celsius_to_f(c(0, 25, 100))` returns `c(32, 77, 212)`. No loop needed.

</details>

### Exercise 2: Summary statistics as a named list

Write `summary_stats(x)` that returns a named list containing `mean`, `median`, and `sd` of a numeric vector. Save the result to `my_stats` and access `my_stats$mean`.

```r
# Exercise: write summary_stats(x)
# Hint: return list(mean = ..., median = ..., sd = ...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
summary_stats <- function(x) {
  list(
    mean   = mean(x),
    median = median(x),
    sd     = sd(x)
  )
}

my_stats <- summary_stats(c(10, 20, 30, 40, 50))
my_stats$mean
#> [1] 30
my_stats$median
#> [1] 30
my_stats$sd
#> [1] 15.81139
```

**Explanation:** Returning a named list is the standard R pattern for "multiple outputs". Callers pull out what they need by name.

</details>

### Exercise 3: Clipping with defaults

Write `clip(x, lo = 0, hi = 1)` that returns `x` with any value below `lo` replaced by `lo` and any value above `hi` replaced by `hi`. Defaults should clip to the `[0, 1]` range. Test on `c(-0.5, 0.3, 0.7, 1.5)`.

```r
# Exercise: write clip(x, lo = 0, hi = 1)
# Hint: pmax() and pmin() do this in one line

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
clip <- function(x, lo = 0, hi = 1) {
  pmin(pmax(x, lo), hi)
}

clip(c(-0.5, 0.3, 0.7, 1.5))
#> [1] 0.0 0.3 0.7 1.0
clip(c(-0.5, 0.3, 0.7, 1.5), lo = -1, hi = 1)
#> [1] -0.5  0.3  0.7  1.0
```

**Explanation:** `pmax(x, lo)` returns the elementwise maximum, raising any value below `lo` up to `lo`. Wrapping that in `pmin(..., hi)` caps any value above `hi` at `hi`. Default arguments keep the common `[0, 1]` call short.

</details>

### Exercise 4: Safe logarithm with validation

Write `safe_log(x)` that returns `log(x)` for positive `x` but calls `stop()` with a helpful message if any value in `x` is not positive. Include the offending values in the error message.

```r
# Exercise: write safe_log(x)
# Hint: use stop() and paste the bad values into the message

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
safe_log <- function(x) {
  bad <- x[x <= 0]
  if (length(bad) > 0) {
    stop("safe_log() requires positive values. Got: ", paste(bad, collapse = ", "))
  }
  log(x)
}

safe_log(c(1, 2.718, 10))
#> [1] 0.000000 0.999896 2.302585
# safe_log(c(2, -1, 0, 5))
#> Error in safe_log(c(2, -1, 0, 5)) : safe_log() requires positive values. Got: -1, 0
```

**Explanation:** The function identifies which values are bad before calling `stop()`, then lists them in the message. The user now knows *which* inputs to fix, not just that something was wrong.

</details>

## Complete Example

Let's pull everything together. You will write `describe_numeric()`, a function that takes a data frame, validates the input, computes summary statistics for every numeric column, and returns the results as a data frame.

The function uses nearly every idea from this tutorial: a required argument, default arguments, input validation, `...` to forward arguments, local variables, early return, and a single clear return value.

```r
# A real-world function: describe numeric columns of a data frame
describe_numeric <- function(df, digits = 2, na.rm = TRUE, ...) {
  # 1. Validate inputs with clear messages
  if (!is.data.frame(df)) {
    stop("`df` must be a data frame. Got: ", class(df)[1])
  }

  # 2. Pick numeric columns — early return if none
  num_cols <- sapply(df, is.numeric)
  if (!any(num_cols)) {
    return(data.frame(column = character(0), mean = numeric(0), sd = numeric(0)))
  }

  # 3. Compute stats on each numeric column
  numeric_df <- df[, num_cols, drop = FALSE]
  means <- sapply(numeric_df, mean, na.rm = na.rm, ...)
  sds   <- sapply(numeric_df, sd,   na.rm = na.rm, ...)

  # 4. Assemble the result (single return object, as a data frame)
  data.frame(
    column = names(numeric_df),
    mean   = round(means, digits),
    sd     = round(sds,   digits),
    row.names = NULL
  )
}

# Try it on mtcars
report <- describe_numeric(mtcars, digits = 1)
head(report, 5)
#>   column   mean     sd
#> 1    mpg   20.1    6.0
#> 2    cyl    6.2    1.8
#> 3   disp  230.7  123.9
#> 4     hp  146.7   68.6
#> 5   drat    3.6    0.5
```

The call `describe_numeric(mtcars, digits = 1)` overrides only the `digits` default; everything else uses its default. The output is one tidy data frame where each row describes one input column. You could write it to CSV, print it, or plot it — the caller decides.

Notice how the function reads as a short story: validate, select, compute, assemble, return. Each step is one small block. That is the payoff of composing small ideas (defaults, `...`, validation, early return) into one readable function.

## Summary

| Concept | Rule of thumb |
|---|---|
| Function syntax | `name <- function(args) { body }` — body's last expression is returned |
| Arguments | Required args have no default; optional args have one. Name args at call sites. |
| Defaults | Put sensible defaults in the signature; they can reference other arguments. |
| Return | Use implicit return for short functions; `return()` only for early exits. |
| Multiple outputs | Return a named list (or data frame) — R functions return exactly one object. |
| Scope | Locals vanish on return; free variables use lexical scoping. |
| `...` | Forward extra arguments to inner functions in wrappers. |
| Validation | Check inputs at the top with `stopifnot()` or `stop()` and clear messages. |
| Globals | Don't modify them from inside a function; return the new value instead. |

## FAQ

### Should I use `=` or `<-` for assignment inside functions?

Use `<-` inside function bodies. Both operators assign, but `=` at call sites means "named argument" (e.g., `mean(x, na.rm = TRUE)`). Keeping `<-` for assignment makes the distinction visually obvious and matches the tidyverse and Advanced R style guides.

### Can I return more than one value from an R function?

No — an R function returns exactly one object. The standard pattern is to bundle the things you want to return into a **named list** (or a data frame), which is itself one object. The caller extracts individual pieces with `result$mean`, `result$sd`, and so on.

### What's the difference between `stop()` and `warning()`?

`stop()` halts execution and raises an error — code after it does not run. `warning()` prints a warning message but execution continues. Use `stop()` when the problem makes the rest of the function meaningless (bad types, impossible values). Use `warning()` when the function can still produce something useful but the user should know about an issue (e.g., `NA` values were dropped).

### When should I NOT write a function?

Skip the function if the code runs once and reads clearly in place, or if the "function" would just rename a single existing call (`my_mean <- function(x) mean(x)` adds nothing). The usual rule of thumb: once you have written the same logic three times, wrap it in a function.

## References

1. Wickham, H. — *Advanced R*, 2nd ed., Ch 6 Functions. [adv-r.hadley.nz/functions.html](https://adv-r.hadley.nz/functions.html)
2. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd ed., Ch 25 Functions. [r4ds.hadley.nz/functions.html](https://r4ds.hadley.nz/functions.html)
3. R Core Team — *An Introduction to R*, §10 Writing your own functions. [cran.r-project.org/doc/manuals/r-release/R-intro.html](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
4. Tidyverse Style Guide — Functions. [style.tidyverse.org/functions.html](https://style.tidyverse.org/functions.html)
5. R Documentation — `stopifnot()`. [rdocumentation.org](https://www.rdocumentation.org/packages/base/versions/3.6.2/topics/stopifnot)
6. Dataquest — Writing Functions in R. [dataquest.io/blog/write-functions-in-r](https://www.dataquest.io/blog/write-functions-in-r/)

## Continue Learning

- **[R Control Flow](R-Control-Flow.html)** — Conditionals and loops are the building blocks you will use inside function bodies. Review `if`/`else`, `for`, and `while` before diving deeper into function design.
- **[R Special Values](R-Special-Values.html)** — Learn how `NA`, `NULL`, `NaN`, and `Inf` behave in R, so your functions handle them correctly instead of returning mystery results.
