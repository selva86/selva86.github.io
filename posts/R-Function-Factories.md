---
title: "R Function Factories: How to Build Customisable Functions That Generate Functions"
slug: "R-Function-Factories"
description: "Learn R function factories — functions that return other functions. See closures, partial application, and real-world examples like custom formatters and power builders."
keywords: "R function factories, R closures, functions that return functions, partial application R, R higher-order factories"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.2.4"
post_type: "C"
auto_link_terms: "function factories|function factory|functions that return functions"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Function Factories"
sidebar_order: 36
---

# R Function Factories: How to Build Customisable Functions That Generate Functions

<p class="lead">A function factory in R is a function whose return value is another function. The returned function remembers the arguments that were passed to the factory, letting you build customised helpers on demand without duplicating code.</p>

Once you see how a function factory works, dozens of everyday R idioms click into place — `stats::ecdf`, `scales::percent_format`, `purrr::partial`, the `power` example from every FP tutorial. They are all the same pattern. This guide teaches the pattern, shows five practical factories, and flags the one memory gotcha to watch out for.

## What Is a Function Factory, Exactly?

A function factory is "a function that makes functions". You pass in the settings — the *parameters of the parameters* — and get back a specialised function that uses those settings. The returned function is a **closure**: it captures the environment of the factory call, so it remembers whatever was passed in.

Here is the canonical example. `power_of(n)` returns a function that raises its input to the `n`-th power. Call the factory once with `2`, once with `3`, and you now have `square` and `cube` — two related but independent functions.

```r
power_of <- function(n) {
  function(x) x^n
}

square <- power_of(2)
cube   <- power_of(3)

square(5)
#> [1] 25

cube(5)
#> [1] 125
```

`power_of(2)` did not run `5^2`. It *returned* a function that will run `x^2` whenever you call it. The value `n = 2` lives inside the returned function's environment and is recalled every time `square` is invoked. `cube` has its own private copy of `n = 3` — the two functions share no state.

[KEY INSIGHT]
**A function factory trades "one function with many arguments" for "many specialised functions, each with fewer arguments".** That sounds wasteful until you realise you can now pass those specialised functions around as first-class values — to `sapply`, to `map`, into a data frame column — without ever re-specifying the settings.

## Why Do Function Factories Work? (Closures Over the Enclosing Environment)

When a function is defined *inside* another function, it captures the enclosing environment. Every variable in the parent function is reachable from the child — and it stays reachable even after the parent has finished running.

```r
make_adder <- function(delta) {
  function(x) x + delta
}

add5  <- make_adder(5)
add10 <- make_adder(10)

add5(100)
#> [1] 105

add10(100)
#> [1] 110
```

`make_adder(5)` creates a new environment where `delta = 5`, then returns a function that lives inside that environment. The environment is kept alive because the returned function holds a reference to it. Every call to `add5(100)` looks up `delta` in that captured environment — finds `5` — and computes `100 + 5`.

For the deeper mechanics of how R pulls this off, see the dedicated post on [R Closures](R-Closures.html).

## A Formatter Factory: Five Lines, Infinite Customisation

Here is a real example. `make_formatter` builds a number formatter that always prefixes with a currency symbol and rounds to a fixed number of decimals. You can generate `usd`, `eur`, and `jpy` from the same factory.

```r
make_formatter <- function(symbol, decimals = 2) {
  function(x) paste0(symbol, formatC(x, format = "f", digits = decimals))
}

usd <- make_formatter("$", 2)
eur <- make_formatter("€", 2)
jpy <- make_formatter("¥", 0)

usd(1234.5)
#> [1] "$1234.50"

eur(1234.5)
#> [1] "€1234.50"

jpy(1234.5)
#> [1] "¥1235"
```

Each returned function knows its own `symbol` and `decimals`. Calling `usd(1234.5)` does not need the symbol — that was burned in at the moment you called the factory. You can store the three formatters in a list, pass them to `sapply`, or drop them into a ggplot `labels = ` argument.

**Try it:** Write a factory `ex_make_prefixer(prefix)` that returns a function prepending `prefix` to any string. Build one for "INFO: " and use it.

```r
# your code here
info <- ex_make_prefixer("INFO: ")
info("server started")
#> Expected: "INFO: server started"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_make_prefixer <- function(prefix) {
  function(msg) paste0(prefix, msg)
}
info <- ex_make_prefixer("INFO: ")
info("server started")
#> [1] "INFO: server started"
```

**Explanation:** The factory captures `prefix` in its enclosing environment; the returned function uses it on every call.

</details>

## How Do You Partially Apply a Function?

Partial application means fixing one or more of a function's arguments in advance, producing a new function that takes only the remaining ones. You can roll it yourself with a factory, or use `purrr::partial()`.

```r
# Roll your own
partial_apply <- function(f, ...) {
  fixed_args <- list(...)
  function(...) do.call(f, c(fixed_args, list(...)))
}

round2 <- partial_apply(round, digits = 2)
round2(3.14159)
#> [1] 3.14
```

`round2` is `round` with `digits = 2` baked in. Any call to `round2(x)` becomes `round(x, digits = 2)`. The technique is invaluable in pipelines where you want a one-argument function but the real function needs two — fix the one you know in advance.

## A Counter Factory: Mutable State Done Right

Factories also let you create functions that carry *mutable* state — safely, because the state is private. The pattern uses `<<-` to update a variable in the enclosing environment.

```r
make_counter <- function() {
  count <- 0
  function() {
    count <<- count + 1
    count
  }
}

tick <- make_counter()
tick()
#> [1] 1
tick()
#> [1] 2
tick()
#> [1] 3
```

`tick` has its own private `count`. Nothing else in your R session can read or write it. If you need a second independent counter, call `make_counter()` again — the two will not interfere.

[WARNING]
**Closures capture environments by reference — they can hold on to big objects.** If a factory closes over a large data frame, that data frame stays in memory for as long as the returned function exists. Watch out for accidentally bloating your session.

## How Do You Build Many Specialised Functions Programmatically?

Because a factory returns a function *value*, you can use `lapply` to generate a whole family of them in one go.

```r
powers <- lapply(1:5, \(n) function(x) x^n)

# powers[[1]](10) = 10^1, powers[[2]](10) = 10^2, ...
sapply(powers, \(f) f(10))
#> [1]     10    100   1000  10000 100000
```

One line built five specialised functions. `sapply` then called each one in turn. This is exactly how libraries like `scales` build their `label_*` families — you are just seeing the pattern earlier.

## Practice Exercises

### Exercise 1: Build a Clamping Factory

Write a factory `make_clamp(lo, hi)` that returns a function clamping its input into the `[lo, hi]` range. Use it to build `clamp_0_1` and test it on `c(-0.5, 0.3, 1.5)`.

```r
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
make_clamp <- function(lo, hi) {
  function(x) pmin(pmax(x, lo), hi)
}
clamp_0_1 <- make_clamp(0, 1)
clamp_0_1(c(-0.5, 0.3, 1.5))
#> [1] 0.0 0.3 1.0
```

**Explanation:** `pmax(x, lo)` floors at `lo`; `pmin(..., hi)` caps at `hi`. The factory burns both bounds into the closure.

</details>

### Exercise 2: Running Total With Mutable State

Write a factory `make_accumulator()` that returns a function adding its argument to a running total and returning the new total.

```r
# your code here
acc <- make_accumulator()
acc(5)   # 5
acc(3)   # 8
acc(10)  # 18
```

<details>
<summary>Click to reveal solution</summary>

```r
make_accumulator <- function() {
  total <- 0
  function(x) {
    total <<- total + x
    total
  }
}
my_acc <- make_accumulator()
my_acc(5)
#> [1] 5
my_acc(3)
#> [1] 8
my_acc(10)
#> [1] 18
```

**Explanation:** `<<-` updates `total` in the enclosing environment. Each factory call produces an independent accumulator.

</details>

## Summary

| Pattern                     | What the factory captures              | Canonical example           |
|----------------------------|------------------------------------------|-----------------------------|
| Parameterised behaviour    | Settings passed in                       | `power_of(n)`               |
| Partial application        | Fixed arguments for a general function   | `partial_apply(round, digits = 2)` |
| Private mutable state      | A counter or cache                       | `make_counter()`            |
| Formatter family           | Symbol and precision                     | `make_formatter("$", 2)`    |
| Programmatic generation    | Loop variable                            | `lapply(1:n, power_of)`     |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 10: Function factories. [Link](https://adv-r.hadley.nz/function-factories.html)
2. Wickham, H. — *Advanced R*, Chapter 7: Environments. [Link](https://adv-r.hadley.nz/environments.html)
3. `purrr::partial()` documentation. [Link](https://purrr.tidyverse.org/reference/partial.html)
4. `scales` package — label factories like `label_percent()`. [Link](https://scales.r-lib.org/)
5. Chambers, J. M. — *Extending R*. CRC Press (2016).

## Continue Learning

- [R Closures](R-Closures.html) — the environment-capture mechanism that makes factories work.
- [R Function Operators](R-Function-Operators.html) — factories that take *and* return functions.
- [Memoization in R](Memoization-in-R.html) — a factory that caches results for a speedup.
