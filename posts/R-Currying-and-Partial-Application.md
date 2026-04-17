---
title: "R Currying & Partial Application: purrr::partial() & rlang"
slug: "R-Currying-and-Partial-Application"
description: "Partial application pre-fills function arguments so you never repeat them. Learn purrr::partial() with lazy and eager evaluation, the ... trick, and real currying in R."
keywords: "R partial application, purrr partial, R currying, partial function R, purrr::partial(), rlang quasiquotation partial, R function operators, curry R, functional programming R, partial application vs currying"
auto_link_terms: "partial application|purrr::partial()|currying in R|partial()|R currying|curry package|partial function application"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "FR-func-2"
post_type: "FR"
fr_parent: "R-Function-Operators.html"
difficulty: "Intermediate"
---

# R Currying & Partial Application: purrr::partial() & rlang

<p class="lead"><strong>Partial application</strong> creates a new function from an existing one by locking in some arguments upfront, so you call the simpler version everywhere else. In R, <code>purrr::partial()</code> is the standard tool for this, and with rlang's quasiquotation you control exactly when each pre-filled argument gets evaluated.</p>

## What Is Partial Application and Why Does It Matter?

If you've ever written `na.rm = TRUE` for the hundredth time inside a pipeline, you've already felt the pain that partial application solves. Let's fix that right now.

```r title="Repeating na.rm versus partial"
# The problem: repeating na.rm = TRUE everywhere
library(purrr)

x <- c(3.2, 7.1, NA, 4.8, 9.5, NA, 2.3)

# Old way — tedious and error-prone
mean(x, na.rm = TRUE)
#> [1] 5.38
sd(x, na.rm = TRUE)
#> [1] 2.871214
median(x, na.rm = TRUE)
#> [1] 4.8

# Partial application — lock in na.rm once
mean_na <- partial(mean, na.rm = TRUE)
sd_na   <- partial(sd,   na.rm = TRUE)

mean_na(x)
#> [1] 5.38
sd_na(x)
#> [1] 2.871214
```

Three calls, zero repeated arguments. `partial(mean, na.rm = TRUE)` returns a brand-new function that behaves exactly like `mean()` except `na.rm` is always `TRUE`. You pass only the data.

The manual alternative works too, but it's more ceremony for the same result:

```r title="Manual wrapper alternative"
# Manual wrapper — works, but verbose
mean_no_na <- function(x, ...) mean(x, na.rm = TRUE, ...)

mean_no_na(x)
#> [1] 5.38
```

Both approaches produce the same output. The difference is that `partial()` is declarative, you describe *what* to pre-fill rather than writing boilerplate.

[KEY INSIGHT]
**Partial application isn't about saving keystrokes, it's about naming a concept.** Calling your function `mean_na` tells the reader what it does. Writing `function(x) mean(x, na.rm = TRUE)` tells them how. Names beat implementation details.

**Try it:** Create a partially applied function `ex_round2` that rounds to 2 decimal places, then test it on `pi`.

```r title="Exercise: Round-to-two-digits partial"
# Try it: create ex_round2
ex_round2 <- partial(round, digits = 2)

# Test:
ex_round2(pi)
#> Expected: 3.14
```

<details>
<summary>Click to reveal solution</summary>

```r title="Round-to-two solution"
ex_round2 <- partial(round, digits = 2)
ex_round2(pi)
#> [1] 3.14
```

**Explanation:** `partial(round, digits = 2)` locks in `digits` so you only need to supply the number to round.

</details>

## How Does purrr::partial() Work Under the Hood?

Understanding what `partial()` returns helps you debug and compose functions confidently. Let's create a simple partial function and inspect it.

```r title="Inspect a partial function"
# Create a partial function and inspect it
add5 <- partial(`+`, 5)

add5
#> <partialised>
#> function (...) 
#> `+`(5, ...)

add5(10)
#> [1] 15
add5(-3)
#> [1] 2
```

When you print `add5`, R shows you the partially applied call: `` `+`(5, ...) ``. The `5` is baked in, and `...` accepts whatever you pass next.

Notice the `...` signature, `partial()` always returns a function with `...` as its arguments, regardless of the original function's signature. This is a deliberate design choice that lets `partial()` work with functions that use non-standard evaluation (like `dplyr::filter()` or `ggplot2::aes()`).

```r title="partial always returns dots formals"
# The returned function always has ... formals
formals(add5)
#> $...
#> 
```

The trade-off is that you lose autocomplete for the remaining arguments. If you need autocomplete, write a manual wrapper with explicit argument names instead.

[NOTE]
**The curry package preserves argument signatures.** If autocomplete matters, the curry package's operators return functions that retain named arguments. For most workflows, though, `purrr::partial()` is the standard choice.

**Try it:** Create a `ex_dash_paste` function using `partial(paste, sep = "-")`, then call it with `"R"`, `"is"`, `"fun"`.

```r title="Exercise: Dash-separated paste partial"
# Try it: create ex_dash_paste
ex_dash_paste <- partial(paste, sep = "-")

# Test:
ex_dash_paste("R", "is", "fun")
#> Expected: "R-is-fun"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dash paste solution"
ex_dash_paste <- partial(paste, sep = "-")
ex_dash_paste("R", "is", "fun")
#> [1] "R-is-fun"
```

**Explanation:** `sep` is locked to `"-"`, so every call joins its arguments with dashes.

</details>

## When Should You Use Lazy vs Eager Evaluation?

By default, `partial()` evaluates pre-filled arguments *lazily*, they're re-evaluated every time you call the function. This is usually what you want, but sometimes you need to freeze a value at creation time. That's where rlang's `!!` (bang-bang) operator comes in.

Think of it this way: lazy evaluation is like checking the weather each morning before you dress. Eager evaluation is like setting your thermostat once when you move in.

```r title="Lazy evaluation rerolls each call"
# Lazy: n is re-evaluated every call
set.seed(99)
f_lazy <- partial(runif, n = rpois(1, 5))

length(f_lazy())
#> [1] 8
length(f_lazy())
#> [1] 5
length(f_lazy())
#> [1] 5
```

Each call to `f_lazy()` draws a fresh Poisson random number for `n`, so the length changes. Now compare with eager evaluation:

```r title="Eager evaluation freezes with bangs"
# Eager: n is fixed at creation time with !!
set.seed(99)
f_eager <- partial(runif, n = !!rpois(1, 5))

length(f_eager())
#> [1] 8
length(f_eager())
#> [1] 8
length(f_eager())
#> [1] 8
```

With `!!`, the `rpois(1, 5)` call runs once, at the moment `partial()` executes, and the result (8) is baked into the function permanently.

Here's a practical scenario where the distinction matters. Suppose you want a function that stamps the current time onto a message:

```r title="Lazy timestamp example"
# Lazy: captures current time on each call (usually what you want)
stamp_lazy <- partial(paste, "Logged at", Sys.time(), "->")

stamp_lazy("model started")
#> [1] "Logged at 2026-04-12 10:30:01 -> model started"

stamp_lazy("model finished")
#> [1] "Logged at 2026-04-12 10:30:02 -> model finished"
```

The lazy version updates the timestamp each call, perfect for logging. But if you wanted to record when the *session* started, you'd use eager evaluation with `!!Sys.time()` to freeze the timestamp at creation time.

[WARNING]
**Lazy evaluation can surprise you with mutable state.** If you write `partial(rnorm, mean = my_var)` and later change `my_var`, the partial function uses the new value. Use `!!` to lock in the current value when the function is created.

**Try it:** Create a partial function `ex_rnorm` that generates 10 random normals with a mean of 100, using eager evaluation so the mean can't change later.

```r title="Exercise: Eager rnorm with bangs"
# Try it: create ex_rnorm with eager evaluation
my_mean_val <- 100
ex_rnorm <- partial(rnorm, n = 10, mean = !!my_mean_val)

# Test (should always use mean = 100):
set.seed(42)
round(mean(ex_rnorm()), 1)
#> Expected: close to 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Eager rnorm solution"
my_mean_val <- 100
ex_rnorm <- partial(rnorm, n = 10, mean = !!my_mean_val)

set.seed(42)
round(mean(ex_rnorm()), 1)
#> [1] 100.1
```

**Explanation:** `!!my_mean_val` evaluates `my_mean_val` immediately and locks in 100. Even if you later set `my_mean_val <- 999`, the function still uses 100.

</details>

## How Do You Control Where New Arguments Go With ...?

By default, pre-filled arguments go first and the caller's arguments come after. But some base R functions have the argument you want to pre-fill in the *middle* or at the *end*. The `... = ` syntax lets you control exactly where new arguments get inserted.

```r title="Default prefilled args come first"
# Default: pre-filled args go first
prefix_paste <- partial(paste, ">>")

prefix_paste("hello", "world")
#> [1] ">> hello world"
```

That works because `paste()` takes `...`, all arguments just concatenate. But what if you need to insert new arguments *between* pre-filled ones?

```r title="Slot new args with dots equals"
# ... = inserts caller's args at that position
between <- partial(list, "start", ... = , "end")

str(between("middle_1", "middle_2"))
#> List of 4
#>  $ : chr "start"
#>  $ : chr "middle_1"
#>  $ : chr "middle_2"
#>  $ : chr "end"
```

The caller's arguments (`"middle_1"`, `"middle_2"`) slot in where `... = ` sits, between `"start"` and `"end"`.

Here's a practical use case. `grepl()` takes `pattern` first and `x` second, but you might want to pre-fill the options while leaving both `pattern` and `x` free:

```r title="Case-insensitive grepl shortcut"
# Case-insensitive, Perl-regex grepl shortcut
igrepl <- partial(grepl, ... = , ignore.case = TRUE, perl = TRUE)

fruits <- c("Apple", "BANANA", "cherry", "Date")
igrepl("an", fruits)
#> [1] FALSE  TRUE FALSE FALSE
igrepl("^[ad]", fruits)
#> [1]  TRUE FALSE FALSE  TRUE
```

The `... = ` tells `partial()` that `pattern` and `x` (the first two positional arguments) come from the caller, and `ignore.case` and `perl` are locked in after them.

[TIP]
**Use ... = when the arguments you want to fix aren't the first parameters.** This is especially common with base R functions like `grepl()`, `sub()`, and `sprintf()` where options sit at the end.

**Try it:** Create a case-insensitive grep shortcut `ex_igrep` using `partial(grep, ... = , ignore.case = TRUE, value = TRUE)`. Test it by searching for `"the"` in `c("The End", "beginning", "THERE")`.

```r title="Exercise: Case-insensitive grep value"
# Try it: create ex_igrep
ex_igrep <- partial(grep, ... = , ignore.case = TRUE, value = TRUE)

# Test:
ex_igrep("the", c("The End", "beginning", "THERE"))
#> Expected: "The End" "THERE"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Case-insensitive grep solution"
ex_igrep <- partial(grep, ... = , ignore.case = TRUE, value = TRUE)
ex_igrep("the", c("The End", "beginning", "THERE"))
#> [1] "The End" "THERE"
```

**Explanation:** `value = TRUE` returns matching strings instead of indices, and `ignore.case = TRUE` makes the match case-insensitive. Both are locked in by `partial()`.

</details>

## What Is Currying and How Does It Differ From Partial Application?

You'll often see "currying" and "partial application" used interchangeably, but they're different techniques. Partial application fixes *some* arguments and returns a function that takes the rest. Currying transforms a function of N arguments into a *chain* of N single-argument functions.

In Haskell, every function is automatically curried, `add 3 5` is actually `(add 3) 5`, where `add 3` returns a function that adds 3. R doesn't do this automatically, but you can build it yourself.

```r title="Manual currying with closures"
# Manual currying: a chain of single-argument functions
curry_add <- function(a) {
  function(b) a + b
}

add3 <- curry_add(3)
add3(5)
#> [1] 8

# Or call both at once
curry_add(10)(7)
#> [1] 17
```

`curry_add(3)` doesn't compute anything, it returns a new function that remembers `a = 3` and waits for `b`. This is a closure (the returned function "closes over" the value of `a`).

You can generalise this into a helper that curries any function:

```r title="Generic curry helper"
# Simple curry helper for any function
my_curry <- function(fn) {
  params <- formals(fn)
  if (length(params) <= 1) return(fn)
  
  function(x) {
    remaining <- params[-1]
    new_fn <- function(...) do.call(fn, c(list(x), list(...)))
    if (length(remaining) <= 1) return(new_fn)
    my_curry(new_fn)
  }
}

# Test with a 3-argument function
add3args <- function(a, b, c) a + b + c
curried <- my_curry(add3args)
curried(1)(2)(3)
#> [1] 6
```

This works, but it's more of a learning exercise than production code. In practice, `partial()` covers 95% of use cases more cleanly.

[KEY INSIGHT]
**R doesn't curry automatically like Haskell, and that's fine.** Partial application with partial() gives you the practical benefit (fewer arguments to pass) without restructuring your entire function. True currying is elegant in theory but rarely needed in R workflows.

**Try it:** Write a manually curried `ex_multiply` function that takes one argument and returns a function that multiplies by it. Test that `ex_multiply(3)(7)` returns 21.

```r title="Exercise: Curried multiply function"
# Try it: write ex_multiply
ex_multiply <- function(a) {
  # your code here
}

# Test:
ex_multiply(3)(7)
#> Expected: 21
```

<details>
<summary>Click to reveal solution</summary>

```r title="Curried multiply solution"
ex_multiply <- function(a) {
  function(b) a * b
}

ex_multiply(3)(7)
#> [1] 21

# Bonus: save a specialised version
double <- ex_multiply(2)
double(15)
#> [1] 30
```

**Explanation:** `ex_multiply(3)` returns a closure that remembers `a = 3`. When you call that closure with `7`, it computes `3 * 7 = 21`.

</details>

## Where Does Partial Application Shine in Real R Workflows?

Now that you understand the mechanics, let's see where `partial()` earns its keep in day-to-day R code. These patterns come up constantly.

**Pattern 1: Cleaner map() pipelines.** Instead of writing anonymous functions inside `map()`, pre-fill the fixed arguments:

```r title="Cleaner map pipeline with partial"
library(stringr)

messy <- list("hello world", "foo bar", "one two three")

# Without partial — anonymous function needed
map_chr(messy, \(s) str_replace(s, " ", "_"))
#> [1] "hello_world"   "foo_bar"       "one_two three"

# With partial — cleaner and self-documenting
replace_space <- partial(str_replace, pattern = " ", replacement = "_")
map_chr(messy, replace_space)
#> [1] "hello_world"   "foo_bar"       "one_two three"
```

Both produce the same result, but the `partial()` version names the operation, `replace_space`, making the pipeline self-documenting.

**Pattern 2: Summarise helpers across columns.** Build a family of NA-safe summary functions and use them with `across()`:

```r title="NA-safe summarise helpers"
library(dplyr)

mean_na   <- partial(mean, na.rm = TRUE)
sd_na     <- partial(sd, na.rm = TRUE)
median_na <- partial(median, na.rm = TRUE)

airquality |>
  summarise(across(c(Ozone, Solar.R), list(
    avg = mean_na,
    sd  = sd_na,
    med = median_na
  )))
#>   Ozone_avg Ozone_sd Ozone_med Solar.R_avg Solar.R_sd Solar.R_med
#> 1  42.12931 32.98788        31    185.9315   90.05842         205
```

Three lines of `partial()` replace six anonymous functions. Every analyst on your team can reuse `mean_na` without wondering about the `na.rm` flag.

[TIP]
**Partial application pairs beautifully with map() and across().** Instead of `map(x, \(item) fn(item, arg = val))`, write `map(x, partial(fn, arg = val))`. It's shorter and more declarative.

**Try it:** Use `partial()` to create `ex_log10` that computes base-10 logarithms, then map it over the list `list(1, 10, 100, 1000)`.

```r title="Exercise: Base-ten log partial"
# Try it: create ex_log10
ex_log10 <- partial(log, base = 10)

# Test:
map_dbl(list(1, 10, 100, 1000), ex_log10)
#> Expected: 0 1 2 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Base-ten log solution"
ex_log10 <- partial(log, base = 10)
map_dbl(list(1, 10, 100, 1000), ex_log10)
#> [1] 0 1 2 3
```

**Explanation:** `partial(log, base = 10)` locks in the base, so each call only needs the number. `map_dbl()` applies it to each element and returns a numeric vector.

</details>

## Practice Exercises

### Exercise 1: Build a Logging Function Toolkit

Create two functions using `partial()` and `paste()`:
- `my_log_info(msg)` that prepends `"[INFO]"` and a timestamp
- `my_log_error(msg)` that prepends `"[ERROR]"` and a timestamp

Then use `map_chr()` to apply `my_log_info` to the vector `c("model started", "data loaded", "training complete")`.

```r title="Exercise: Logging toolkit with partial"
# Exercise: logging toolkit with partial()
# Hint: partial(paste, "[INFO]") is a starting point

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Logging toolkit solution"
my_log_info  <- partial(paste, "[INFO]", Sys.time(), "-")
my_log_error <- partial(paste, "[ERROR]", Sys.time(), "-")

messages <- c("model started", "data loaded", "training complete")
map_chr(messages, my_log_info)
#> [1] "[INFO] 2026-04-12 10:30:00 - model started"
#> [2] "[INFO] 2026-04-12 10:30:00 - data loaded"
#> [3] "[INFO] 2026-04-12 10:30:00 - training complete"

my_log_error("connection timeout")
#> [1] "[ERROR] 2026-04-12 10:30:00 - connection timeout"
```

**Explanation:** `partial(paste, "[INFO]", Sys.time(), "-")` pre-fills the prefix and timestamp. Because `Sys.time()` is lazily evaluated, each call gets the current time.

</details>

### Exercise 2: Compose a Text Cleaning Pipeline

Use `partial()` to create specialised versions of string functions, then chain them with `purrr::compose()` to build a single `my_clean_text()` function. Apply it to `c("  Hello WORLD!!  ", "  R is GREAT!!  ")`.

Your pipeline should: (1) trim whitespace, (2) convert to lowercase, (3) remove all `!` characters.

```r title="Exercise: Text-cleaning pipeline"
# Exercise: text cleaning pipeline
# Hint: compose() chains functions right-to-left,
#   so the last function in compose() runs first

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Text-cleaning pipeline solution"
remove_bangs <- partial(str_replace_all, pattern = "!", replacement = "")

my_clean_text <- compose(remove_bangs, tolower, str_trim)

my_texts <- c("  Hello WORLD!!  ", "  R is GREAT!!  ")
map_chr(my_texts, my_clean_text)
#> [1] "hello world" "r is great"
```

**Explanation:** `compose(remove_bangs, tolower, str_trim)` creates a pipeline that first trims, then lowercases, then removes bangs. The `partial()` call locks the pattern and replacement into `str_replace_all()`.

</details>

### Exercise 3: Curried Power Function

Write a `my_curry_power(exp)` function that returns a single-argument function raising its input to the `exp` power. Use it to create `my_square`, `my_cube`, and `my_fourth`. Verify that `map_dbl(1:5, my_square)` returns `c(1, 4, 9, 16, 25)`.

```r title="Exercise: Curried power function"
# Exercise: curried power function
# Hint: the returned function should compute x^exp

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Curried power solution"
my_curry_power <- function(exp) {
  function(x) x^exp
}

my_square <- my_curry_power(2)
my_cube   <- my_curry_power(3)
my_fourth <- my_curry_power(4)

map_dbl(1:5, my_square)
#> [1]  1  4  9 16 25
map_dbl(1:5, my_cube)
#> [1]   1   8  27  64 125
map_dbl(1:5, my_fourth)
#> [1]   1  16  81 256 625
```

**Explanation:** `my_curry_power(2)` returns a closure that remembers `exp = 2`. Each specialised function is a single-argument function that works seamlessly with `map_dbl()`.

</details>

## Putting It All Together

Let's build a reusable data-analysis helper toolkit with partial application and run a complete pipeline on the `airquality` dataset.

```r title="End-to-end airquality toolkit"
# Step 1: Create NA-safe summary helpers
mean_na   <- partial(mean, na.rm = TRUE)
sd_na     <- partial(sd, na.rm = TRUE)
median_na <- partial(median, na.rm = TRUE)

# Step 2: Create a rounding shortcut
round2 <- partial(round, digits = 2)

# Step 3: Summarise airquality with our toolkit
result <- airquality |>
  summarise(across(
    c(Ozone, Solar.R, Wind, Temp),
    list(avg = mean_na, sd = sd_na, med = median_na)
  )) |>
  mutate(across(everything(), round2))

# Step 4: Reshape for readability
library(tidyr)
result_long <- result |>
  pivot_longer(everything(),
               names_to = c("variable", "stat"),
               names_sep = "_",
               values_to = "value")

head(result_long, 12)
#>    variable stat  value
#>    <chr>    <chr> <dbl>
#>  1 Ozone    avg   42.13
#>  2 Ozone    sd    32.99
#>  3 Ozone    med   31
#>  4 Solar    avg   185.93
#>  5 Solar    sd    90.06
#>  6 Solar    med   205
#>  7 Wind     avg    9.96
#>  8 Wind     sd     3.52
#>  9 Wind     med    9.7
#> 10 Temp     avg   77.88
#> 11 Temp     sd     9.47
#> 12 Temp     med   79
```

Without `partial()`, the `across()` call would need three anonymous functions: `\(x) mean(x, na.rm = TRUE)`, `\(x) sd(x, na.rm = TRUE)`, and `\(x) median(x, na.rm = TRUE)`. The partial versions are shorter, reusable, and they give each operation a name the whole team understands.

## Summary

| Concept | What It Does | R Tool |
|---|---|---|
| Partial application | Pre-fills some arguments, returns a simpler function | `purrr::partial()` |
| Lazy evaluation | Pre-filled args re-evaluated each call | Default behaviour |
| Eager evaluation | Pre-filled args fixed at creation | `!!` (bang-bang) |
| `... = ` positioning | Controls where the caller's args go | `partial(f, a, ... = , b)` |
| Currying | Transforms N-arg function into chain of 1-arg functions | Manual closures |
| Best use case | `map()` pipelines, `across()` helpers, repeated config | `map(x, partial(fn, arg = val))` |

**Key takeaway:** reach for `partial()` whenever you catch yourself passing the same argument more than twice. It turns repetitive configuration into a named, reusable function, and that makes your code both shorter and easier to read.

## References

1. Wickham, H., *Advanced R*, 2nd Edition. Chapter 11: Function Operators. [Link](https://adv-r.hadley.nz/function-operators.html)
2. purrr documentation, partial() reference. [Link](https://purrr.tidyverse.org/reference/partial.html)
3. Pedersen, T.L., curry package: Operator-based currying and partial application. [Link](https://github.com/thomasp85/curry)
4. Piccolo, A., "Delicious R Curry" (2015). [Link](https://piccolboni.info/2015/07/delicious-r-curry.html)
5. R Core Team, *R Language Definition*, Section on Closures. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
6. Henry, L. & Wickham, H., rlang: quasiquotation. [Link](https://rlang.r-lib.org/reference/quasiquotation.html)
7. purrr vignette, Functional programming in other languages. [Link](https://purrr.tidyverse.org/articles/other-langs.html)

## Continue Learning

- [R Function Operators](R-Function-Operators.html), The parent tutorial covering compose(), negate(), and more function operators including partial application.
- [purrr map() Variants](purrr-map-Variants.html), Master map(), map2(), imap(), and pmap(), partial application's best friend for applying functions across lists and vectors.
- [R Function Factories](R-Function-Factories.html), Learn how functions that return functions (closures) relate to currying and when factories beat partial application.
