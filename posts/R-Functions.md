---
title: "Write Better R Functions: Arguments, Defaults, Scope & When to Vectorise"
slug: "R-Functions"
description: "Stop copy-pasting code. Learn to write clean R functions with default arguments, explicit returns, lexical scoping rules, and input validation."
keywords: "R functions, write R functions, R function arguments, default arguments R, R lexical scoping, vectorised functions R, R function validation"
auto_link_terms: "R functions|write R functions|function() in R|default arguments in R|lexical scoping in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "1.1.10"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "Writing R Functions"
sidebar_order: 16
difficulty: "Beginner"
---

# Write Better R Functions: Arguments, Defaults, Scope & When to Vectorise

<p class="lead">An R function is a reusable block of code you define once with `function()` and call any time. Good R functions take named arguments, provide sensible defaults, return one clear value, and fail loudly on bad input, so you stop copy-pasting the same five lines across your script.</p>

## Why wrap code in a function at all?

Because the same five lines copy-pasted four times is four places a bug can hide. A function turns that repetition into a single tested unit you can call with one line. Here's what the payoff looks like, a three-line function that replaces a block you'd otherwise write for every numeric vector.

```r title="Define a z-score function"
z_score <- function(x) {
  (x - mean(x)) / sd(x)
}

z_score(c(10, 12, 15, 18, 20))
#> [1] -1.2649111 -0.6324555  0.3162278  1.2649111  1.8973666
```

One definition, infinite reuse. Change the formula in one place and every caller gets the fix. Functions are also the unit you test, document, and share, R has no concept of "reusable code" smaller than a function.

[TIP]
If you've copy-pasted the same expression three times, stop and write a function. The two minutes you spend naming it will save you thirty later.

**Try it:** Write a one-line function `ex_celsius_to_f` that converts Celsius to Fahrenheit (formula: `C * 9/5 + 32`) and call it on `c(0, 20, 100)`.

```r title="Your turn: Celsius to Fahrenheit"
ex_celsius_to_f <- function(c) {
  # your formula here
}

# ex_celsius_to_f(c(0, 20, 100))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Celsius to Fahrenheit solution"
ex_celsius_to_f <- function(c) {
  c * 9 / 5 + 32
}
ex_celsius_to_f(c(0, 20, 100))
#> [1]  32  68 212
```

The body is a single expression, so there's no need for `return()`, the last (and only) expression is returned automatically. The formula is vectorised, so `c(0, 20, 100)` is converted element-by-element to `c(32, 68, 212)` in one call.
</details>

## How do you declare a function and what's in the signature?

Every R function has three parts: a **name** (how you'll call it), a **signature** (the arguments it accepts), and a **body** (the code that runs). You bind all three with `function()` and save it to a variable.

![Anatomy of an R function showing name, arguments, body, and return value](screenshots/R-Functions-anatomy.webp)

*Figure 1: The four pieces of every R function, the name you bind it to, the argument list, the body, and the return value.*

```r title="Summarise a vector with defaults"
summarise_vector <- function(x, digits = 2) {
  result <- c(
    mean = mean(x),
    sd = sd(x),
    n = length(x)
  )
  round(result, digits)
}

summarise_vector(c(4, 7, 9, 12, 15, 18))
#> mean   sd    n 
#> 10.83 5.19 6.00
```

Two arguments: `x` (required, no default) and `digits` (optional, defaults to 2). The body computes three statistics and returns a rounded named vector. Notice there's no `return()`, R returns the value of the last expression automatically. We'll come back to that.

[NOTE]
A function in R is just an object like any other. `summarise_vector` is a variable whose value happens to be a function. You can pass it to other functions, store it in a list, or reassign it.

**Try it:** Modify `summarise_vector` so it also returns the `min` and `max`. Call it `ex_summarise_v2` and run it on `c(4, 7, 9, 12, 15, 18)`.

```r title="Your turn: add min and max"
ex_summarise_v2 <- function(x, digits = 2) {
  # add min and max
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Summarise with min and max"
ex_summarise_v2 <- function(x, digits = 2) {
  result <- c(
    mean = mean(x),
    sd   = sd(x),
    n    = length(x),
    min  = min(x),
    max  = max(x)
  )
  round(result, digits)
}
ex_summarise_v2(c(4, 7, 9, 12, 15, 18))
#>  mean    sd     n   min   max
#> 10.83  5.19  6.00  4.00 18.00
```

Appending `min = min(x)` and `max = max(x)` to the named vector extends the return value without changing the rest of the function, the `round()` call then applies uniformly to all five entries. A named numeric vector is a fine lightweight return when every field is the same type; reach for a `list()` only when the pieces have different shapes.
</details>

## How do default arguments and positional/named matching really work?

When you call a function, R matches your arguments in three passes: **exact name match first**, then **partial name match**, then **positional match**. Defaults fill in anything the caller didn't supply. Understanding this order prevents most "why did my function get the wrong value?" bugs.

![Diagram showing argument matching order: exact name, then partial, then positional](screenshots/R-Functions-arg-matching.webp)

*Figure 2: How R matches call-site arguments to a function's formal parameters, exact name wins, then partial, then position.*

```r title="Match positional and named arguments"
greet <- function(name, greeting = "Hello", punctuation = "!") {
  paste0(greeting, ", ", name, punctuation)
}

greet("Ada")                                 # positional + defaults
greet("Ada", "Hi")                           # positional
greet(name = "Ada", punctuation = ".")       # named, skips middle
greet("Ada", punct = "?")                    # partial name match
#> [1] "Hello, Ada!"
#> [1] "Hi, Ada!"
#> [1] "Hello, Ada."
#> [1] "Hello, Ada?"
```

Named arguments are almost always clearer at the call site. If a reader can't tell what `TRUE, FALSE, 3` means without looking up the signature, you should be writing `scale = TRUE, center = FALSE, k = 3`.

[WARNING]
Partial matching feels convenient but breaks when someone adds a new argument with a similar prefix. `greet(punct = "?")` works today; tomorrow someone adds `punctuate_words` and your call becomes ambiguous. Prefer full names.

**Try it:** Call `greet` with `name = "Lin"` and greeting `"Hey"`, using the punctuation default. Save it to `ex_msg`.

```r title="Your turn: call greet with named args"
# ex_msg <- greet(...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Call greet with named arguments"
ex_msg <- greet(name = "Lin", greeting = "Hey")
ex_msg
#> [1] "Hey, Lin!"
```

Passing `name` and `greeting` by name lets R skip the positional order and leaves `punctuation` to fall back to its default of `"!"`. Named arguments like this are how you communicate intent to the reader and stay safe if the function author ever reorders the signature.
</details>

## Should you use return() explicitly or rely on implicit return?

R returns the value of the **last expression** in the function body automatically. `return()` exists mainly for **early exits**, bailing out before the end of the function. For the happy path, leave it off.

```r title="Implicit versus early return"
# Implicit return — the idiomatic R style
abs_diff <- function(a, b) {
  abs(a - b)
}

# Early return — useful for edge cases
safe_divide <- function(x, y) {
  if (y == 0) return(NA_real_)
  x / y
}

abs_diff(10, 3)
safe_divide(10, 2)
safe_divide(10, 0)
#> [1] 7
#> [1] 5
#> [1] NA
```

Two idioms, one rule: use `return()` when you want to stop early. Don't sprinkle `return()` on every final line, it's noise. A function that returns something on every branch without `return()` reads more clearly than one littered with them.

[KEY INSIGHT]
A function always returns exactly one object. If you need to return multiple things, wrap them in a `list()`. R has no tuples, lists are how you bundle heterogeneous return values.

```r title="Return a named list from a fit"
fit_summary <- function(x, y) {
  m <- lm(y ~ x)
  list(
    slope = coef(m)[[2]],
    intercept = coef(m)[[1]],
    r2 = summary(m)$r.squared
  )
}

fit_summary(1:5, c(2, 4, 5, 4, 6))
#> $slope
#> [1] 0.8
#> 
#> $intercept
#> [1] 1.8
#> 
#> $r2
#> [1] 0.64
```

**Try it:** Write `ex_range_info(x)` that returns a list with `min`, `max`, and `span` (max minus min). Test on `c(4, 9, 2, 7)`.

```r title="Your turn: build exrangeinfo"
ex_range_info <- function(x) {
  # return a list with three elements
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Range info list solution"
ex_range_info <- function(x) {
  list(
    min  = min(x),
    max  = max(x),
    span = max(x) - min(x)
  )
}
ex_range_info(c(4, 9, 2, 7))
#> $min
#> [1] 2
#>
#> $max
#> [1] 9
#>
#> $span
#> [1] 7
```

Wrapping the three values in `list()` lets the single return carry heterogeneous pieces, if you used `c()` the elements would all collapse to one numeric vector and you'd lose the names' semantic distinction. Callers pull individual fields back out with `$min`, `$max`, `$span`.
</details>

## How does R find variables inside a function (lexical scoping)?

When a function needs a variable, R first looks **inside the function**, then in the **environment where the function was defined**, then up the chain to the global environment, and finally in attached packages. This is **lexical scoping**, "lexical" because the lookup follows the code's written structure, not its call order.

![Scope chain diagram: function local, enclosing, global, package](screenshots/R-Functions-scope-chain.webp)

*Figure 3: R's scope chain. A name is resolved by walking outward from the function's own environment through each enclosing environment until it's found.*

```r title="Access an outer variable via scope"
multiplier <- 10

scale_up <- function(x) {
  x * multiplier
}

scale_up(5)
#> [1] 50
```

`multiplier` isn't an argument, but R finds it in the global environment. This "reaching out" is powerful but also a trap, your function's behavior now depends on an invisible variable. Change `multiplier` elsewhere and `scale_up` silently changes too.

[WARNING]
Never rely on globals inside a function unless it's truly configuration (e.g., `options()`). Pass everything the function needs as arguments. Future-you will thank you.

The second half of lexical scoping is that assignments inside a function **stay inside**, they don't leak out.

```r title="Local counter versus global"
counter <- 0

increment <- function() {
  counter <- counter + 1
  counter
}

increment()
increment()
counter          # unchanged in global
#> [1] 1
#> [1] 1
#> [1] 0
```

Each call to `increment()` creates its own local `counter`, uses it, and throws it away. The global `counter` is untouched. This is R's **copy-on-modify** model in action, functions can't accidentally corrupt the caller's variables.

**Try it:** Define `ex_g <- 100`. Write `ex_shift(x)` that returns `x + ex_g`. Call it with `x = 5`, then set `ex_g <- 200` and call again. What do you predict?

```r title="Your turn: use an outer variable"
ex_g <- 100
ex_shift <- function(x) {
  # use ex_g via scoping
}
# ex_shift(5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Outer variable scope solution"
ex_g <- 100
ex_shift <- function(x) {
  x + ex_g
}
ex_shift(5)
#> [1] 105
ex_g <- 200
ex_shift(5)
#> [1] 205
```

`ex_shift()` has no `ex_g` in its own environment, so R walks outward and picks up the current value from the global environment *at call time*, not at definition time. That's why changing `ex_g` to 200 between the two calls changes the result. It's also why leaning on globals inside functions is fragile: a caller can silently alter the result without touching the arguments.
</details>

## When should you vectorise vs loop inside a function?

R's built-in operators and most functions are already **vectorised**, they apply element-wise to whole vectors in a single, fast C call. A for-loop in R is dramatically slower because each iteration pays interpreter overhead. The rule: if a vectorised version exists, use it.

```r title="Vectorised versus looped normalise"
# Vectorised — fast, idiomatic
normalise_vec <- function(x) {
  (x - min(x)) / (max(x) - min(x))
}

# Loop version — same result, slower, more code
normalise_loop <- function(x) {
  out <- numeric(length(x))
  lo <- min(x); hi <- max(x)
  for (i in seq_along(x)) {
    out[i] <- (x[i] - lo) / (hi - lo)
  }
  out
}

x <- c(2, 5, 8, 10)
normalise_vec(x)
normalise_loop(x)
#> [1] 0.000 0.375 0.750 1.000
#> [1] 0.000 0.375 0.750 1.000
```

Same answer, one-third the code, and on a million-element vector `normalise_vec` is roughly 50-100x faster. The vectorised version also reads like the math: *subtract the min, divide by the range*.

[TIP]
Before writing a loop, ask: "Can I express this with `+`, `-`, `*`, `/`, `ifelse()`, `pmax()`, `pmin()`, `cumsum()`, or an `apply` family function?" Nine times out of ten, yes.

Loops aren't forbidden, they're the right tool when each iteration depends on the previous result (like a simulation), or when you're calling a function that isn't itself vectorised. Write the loop then; don't apologise for it.

**Try it:** Write `ex_standardise(x)` that returns `(x - mean(x)) / sd(x)`, vectorised, one line. Test on `c(1, 2, 3, 4, 5)`.

```r title="Your turn: standardise a vector"
ex_standardise <- function(x) {
  # one line, vectorised
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Standardise vector solution"
ex_standardise <- function(x) {
  (x - mean(x)) / sd(x)
}
ex_standardise(c(1, 2, 3, 4, 5))
#> [1] -1.2649111 -0.6324555  0.0000000  0.6324555  1.2649111
```

`mean(x)` and `sd(x)` each collapse the vector to a scalar, and the surrounding arithmetic is recycled across every element of `x` in a single C call. The result is a vector with mean 0 and standard deviation 1, the same thing `scale()` does, minus the matrix wrapper.
</details>

## How do you validate inputs and fail loudly, not silently?

A function that accepts garbage and returns garbage is worse than one that crashes, the silent failure shows up three steps later with no trace of where it started. Validate at the top with `stopifnot()` or explicit `stop()` calls, so bad input fails immediately with a clear message.

```r title="Validate inputs with stopifnot"
z_score_safe <- function(x) {
  stopifnot(
    "x must be numeric" = is.numeric(x),
    "x must have at least 2 values" = length(x) >= 2,
    "x cannot be all NA" = !all(is.na(x))
  )
  (x - mean(x, na.rm = TRUE)) / sd(x, na.rm = TRUE)
}

z_score_safe(c(10, 12, 15, 18, 20))
#> [1] -1.2649111 -0.6324555  0.3162278  1.2649111  1.8973666
```

Each named string in `stopifnot()` is both the condition's description and the error message shown when it fails. If a caller hands in a character vector, they get `Error: x must be numeric` instantly, not a cryptic NaN ten functions downstream.

```r title="Trigger a validation failure"
# Watch it fail fast:
tryCatch(
  z_score_safe("hello"),
  error = function(e) conditionMessage(e)
)
#> [1] "x must be numeric"
```

[KEY INSIGHT]
Validate at boundaries, not inside. Check arguments when they first enter your function. Once inside, trust the data. This keeps validation logic in one place and the main code readable.

For more structured errors with classes and metadata, see `rlang::abort()`. For warnings that shouldn't stop execution, use `warning()`. But 80% of the time, `stopifnot()` is all you need.

**Try it:** Write `ex_mean_positive(x)` that returns `mean(x)` but uses `stopifnot()` to require `x` is numeric and all positive.

```r title="Your turn: validate positive numbers"
ex_mean_positive <- function(x) {
  # validate then compute
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Positive-only mean solution"
ex_mean_positive <- function(x) {
  stopifnot(
    "x must be numeric" = is.numeric(x),
    "x must be all positive" = all(x > 0)
  )
  mean(x)
}
ex_mean_positive(c(2, 4, 6, 8))
#> [1] 5
```

The two `stopifnot()` conditions run before the body, so a character vector or any value `<= 0` raises the matching error immediately instead of silently flowing into `mean()`. Named strings on the left-hand side of each assertion become the error message, make them explicit enough that the caller understands the contract without reading the function body.
</details>

## Practice Exercises

These capstones combine multiple concepts from the sections above. Aim to write each function from scratch before peeking.

### Exercise 1: A reusable summary function

Write `describe(x, digits = 3)` that returns a named list with `n`, `mean`, `sd`, `min`, `max`, and `range` of a numeric vector. Validate that `x` is numeric and non-empty. Round numeric results to `digits`.

```r title="Exercise: write describe function"
# Your solution
describe <- function(x, digits = 3) {
  # ...
}

describe(c(2.1, 4.5, 6.8, 9.2, 11.5))
```

<details>
<summary>Show solution</summary>

```r title="describe function solution"
describe <- function(x, digits = 3) {
  stopifnot(
    "x must be numeric" = is.numeric(x),
    "x cannot be empty" = length(x) > 0
  )
  list(
    n = length(x),
    mean = round(mean(x), digits),
    sd = round(sd(x), digits),
    min = min(x),
    max = max(x),
    range = round(max(x) - min(x), digits)
  )
}

describe(c(2.1, 4.5, 6.8, 9.2, 11.5))
```
</details>

### Exercise 2: Min-max scaler with a fallback

Write `scale_minmax(x, fallback = 0)` that rescales `x` to `[0, 1]`. If all values of `x` are identical (zero range), return a vector of `fallback` the same length as `x`. Use an early `return()`.

```r title="Exercise: scaleminmax with fallback"
scale_minmax <- function(x, fallback = 0) {
  # ...
}

scale_minmax(c(3, 6, 9, 12))
scale_minmax(c(5, 5, 5, 5), fallback = 0.5)
```

<details>
<summary>Show solution</summary>

```r title="scaleminmax fallback solution"
scale_minmax <- function(x, fallback = 0) {
  stopifnot(is.numeric(x), length(x) > 0)
  rng <- max(x) - min(x)
  if (rng == 0) return(rep(fallback, length(x)))
  (x - min(x)) / rng
}

scale_minmax(c(3, 6, 9, 12))
scale_minmax(c(5, 5, 5, 5), fallback = 0.5)
```
</details>

### Exercise 3: A function that returns a function

Write `make_power(exp)` that returns a new function which raises its input to the power `exp`. Use it to build `square` and `cube`.

```r title="Exercise: makepower factory"
make_power <- function(exp) {
  # return a function of x
}

square <- make_power(2)
cube <- make_power(3)
square(1:5)
cube(1:5)
```

<details>
<summary>Show solution</summary>

```r title="makepower factory solution"
make_power <- function(exp) {
  function(x) x ^ exp
}

square <- make_power(2)
cube <- make_power(3)
square(1:5)
cube(1:5)
```

The inner function "remembers" `exp` because of lexical scoping, that's a closure.
</details>

## Complete Example: A Grouped Summary Function

Let's put everything together. We'll write `group_stats(df, group_col, value_col)`, a function that takes a data frame, groups by one column, and returns mean and sd for another. It validates inputs, uses sensible defaults, and has an early return for empty data.

```r title="Build a grouped summary function"
group_stats <- function(df, group_col, value_col, digits = 2) {
  stopifnot(
    "df must be a data frame" = is.data.frame(df),
    "group_col must be a string" = is.character(group_col) && length(group_col) == 1,
    "value_col must be a string" = is.character(value_col) && length(value_col) == 1
  )
  if (nrow(df) == 0) return(data.frame(group = character(), mean = numeric(), sd = numeric()))

  groups <- split(df[[value_col]], df[[group_col]])
  result <- data.frame(
    group = names(groups),
    mean = round(sapply(groups, mean), digits),
    sd = round(sapply(groups, sd), digits),
    row.names = NULL
  )
  result
}

group_stats(mtcars, "cyl", "mpg")
#>   group  mean   sd
#> 1     4 26.66 4.51
#> 2     6 19.74 1.45
#> 3     8 15.10 2.56
```

One call, real output. The function is general, swap `"cyl"` for `"gear"` and `"mpg"` for `"hp"` and it just works. That reusability is the whole point.

```r title="Call groupstats on mtcars"
group_stats(mtcars, "gear", "hp")
#>   group   mean    sd
#> 1     3 176.13 49.00
#> 2     4  89.50 33.36
#> 3     5 195.60 102.83
```

## Summary

| Concept | Rule of thumb |
|---|---|
| **Declare** | `name <- function(args) { body }`, a function is just an object |
| **Arguments** | Required first, optional (with defaults) after. Prefer named calls. |
| **Return** | Last expression returns implicitly. Use `return()` only for early exits. |
| **Multiple values** | Wrap in `list()`, R has no tuples. |
| **Scoping** | Lexical: look local first, then enclosing, then global, then packages. |
| **Globals** | Don't read them inside functions. Pass everything as arguments. |
| **Vectorise** | Default to element-wise operators. Loop only when iterations depend on each other. |
| **Validate** | `stopifnot()` at the top. Fail fast, fail loud, with clear messages. |

Functions are how you turn scripts into software. Master these seven habits and your R code stops being a pile of snippets and becomes a toolkit.

## References

1. Wickham, H. *Advanced R*, 2nd ed., Chapter 6 (Functions). <https://adv-r.hadley.nz/functions.html>
2. R Core Team. *An Introduction to R*, Section 10: Writing your own functions. <https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Writing-your-own-functions>
3. Wickham, H. & Grolemund, G. *R for Data Science*, 2nd ed., Chapter 25: Functions. <https://r4ds.hadley.nz/functions.html>
4. R Documentation. `?function`, `?stopifnot`, `?match.arg`, `?missing`. Run in any R session.
5. Morandat, F. et al. *Evaluating the Design of the R Language* (2012), scoping and semantics. <https://r.cs.purdue.edu/pub/ecoop12.pdf>
6. Tidyverse style guide, function naming and argument order. <https://style.tidyverse.org/functions.html>

## Continue Learning

- [Control Flow in R](Control-Flow-in-R.html), `if`, `else`, `for`, `while`, the building blocks you'll use inside function bodies.
- [R Vectors](R-Vectors.html), understand the data structures your functions will operate on.
- [Functional Programming in R](Functional-Programming-in-R.html), `map()`, `reduce()`, and treating functions as first-class objects.
