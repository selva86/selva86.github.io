---
title: "R Function Factories: How to Build Customisable Functions That Generate Functions"
slug: "R-Function-Factories"
description: "An R function factory returns a new function that remembers its parameters via a closure. Master the pattern with 5 real examples, from power() to MLE."
keywords: "R function factory, function factories in R, closures in R, force() R, stateful functions R, higher-order functions R, R functional programming, lexical scoping R"
auto_link_terms: "R function factories|function factory|function factory in R|function that returns a function|R closure pattern"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-14"
curriculum_id: "4.2.4"
post_type: "C"
sidebar_section: "Advanced R"
sidebar_title: "R Function Factories"
sidebar_order: 4
difficulty: "Advanced"
---

# R Function Factories: How to Build Customisable Functions That Generate Functions

<p class="lead">A function factory is an R function that builds and returns another function, trapping its arguments inside a persistent closure so the child function "remembers" them. The pattern turns one-off helpers into reusable templates you can tailor on the fly.</p>

## What is a function factory in R?

Imagine you need `square()`, `cube()`, and a tenth-power helper — identical except for the exponent. Writing three copies is busywork. A better move is to write `power()` once, hand it an exponent, and let it return a specialised child function you can call like any other. Here is the whole idea in six lines of R, with the payoff on display.

```r
power <- function(exponent) {
  function(x) x ^ exponent
}

square <- power(2)
cube   <- power(3)

square(1:5)
#> [1]  1  4  9 16 25
cube(1:5)
#> [1]   1   8  27  64 125
```

`power()` is the factory. It does not do the work — it manufactures a worker. Every call to `power()` returns a brand-new function that carries its own `exponent` along with it, tucked inside the enclosing environment of the returned function. `square` and `cube` look like plain functions from the outside, but each one has a tiny backpack of remembered state.

![Function factory mechanism diagram](screenshots/R-Function-Factories-mechanism.webp)
*Figure 1: How power(2) captures its exponent and returns a specialised child function.*

This is exactly how `scales::dollar`, `scales::percent`, `ecdf`, and `approxfun` work under the hood in base R and the tidyverse.

[KEY INSIGHT]
**Three R features combine to make factories possible.** First-class functions (functions can be returned like values), lexical scoping (a function looks up variables where it was defined, not where it was called), and closures (the returned function keeps its enclosing environment alive). Remove any one and the pattern collapses.

**Try it:** Build a factory `ex_multiplier(factor)` that returns a function multiplying its argument by `factor`. Use it to make a `triple` function and apply it to `1:4`.

```r
# Try it: write ex_multiplier
ex_multiplier <- function(factor) {
  # your code here
}

triple <- ex_multiplier(3)
triple(1:4)
#> Expected: 3 6 9 12
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_multiplier <- function(factor) {
  function(x) x * factor
}
triple <- ex_multiplier(3)
triple(1:4)
#> [1]  3  6  9 12
```

**Explanation:** `ex_multiplier` returns an anonymous child function. That child remembers `factor` because its enclosing environment is the execution environment of `ex_multiplier`, where `factor = 3` was bound.

</details>

## Why does R need force() inside a function factory?

R evaluates arguments lazily — it does not look at the value of a parameter until something in the function body actually uses it. That sounds harmless until you build factories inside a loop. Watch what happens when we try to make a list of power functions the naive way.

```r
exponents <- 2:4
powers_buggy <- lapply(exponents, function(e) power(e))

powers_buggy[[1]](10)
#> [1] 10000
powers_buggy[[2]](10)
#> [1] 10000
powers_buggy[[3]](10)
#> [1] 10000
```

All three functions return 10000, which is `10^4`. That is not what we asked for. The problem is subtle: when `power(e)` runs, `exponent` is bound to a *promise* pointing at `e`. The promise is not evaluated until someone calls the manufactured function — and by then the loop has finished, leaving every promise resolving to the last value of `e`. Every child function ends up with the same exponent.

[WARNING]
**Lazy evaluation inside factories is a silent bug.** The code runs, no error is raised, and the wrong number quietly propagates. Any factory that captures a value from its arguments should force that argument early.

The fix is a single line: `force(exponent)` evaluates the promise immediately, locking the value in before the child function is returned.

```r
power_safe <- function(exponent) {
  force(exponent)
  function(x) x ^ exponent
}

powers_safe <- lapply(2:4, function(e) power_safe(e))

powers_safe[[1]](10)
#> [1] 100
powers_safe[[2]](10)
#> [1] 1000
powers_safe[[3]](10)
#> [1] 10000
```

Now each child carries its own exponent. `force()` itself is nothing magical — it is literally defined as `function(x) x`. The important bit is naming it: calling `force(exponent)` tells both R and the next reader of your code "I deliberately want this promise resolved right here."

**Try it:** The factory below is broken by lazy evaluation. Fix it so each adder adds the correct value.

```r
# Try it: fix ex_make_adder with force()
ex_make_adder <- function(n) {
  function(x) x + n
}

ex_adders <- lapply(1:3, function(i) ex_make_adder(i))
ex_adders[[1]](10)
#> Expected: 11
ex_adders[[2]](10)
#> Expected: 12
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_make_adder <- function(n) {
  force(n)
  function(x) x + n
}

ex_adders <- lapply(1:3, function(i) ex_make_adder(i))
ex_adders[[1]](10)
#> [1] 11
ex_adders[[2]](10)
#> [1] 12
ex_adders[[3]](10)
#> [1] 13
```

**Explanation:** Adding `force(n)` resolves the promise while `i` still points at the correct loop value. Without it, every adder shared the final `i`.

</details>

## How do function factories use closures to remember state?

So far every child function has been read-only with respect to its captured values. But the enclosing environment is a real R environment — you can also *write* to it. The super-assignment operator `<<-` walks up the scope chain and updates a binding in the first enclosing frame that has it. That turns the enclosing environment into persistent memory.

The canonical example is a counter factory. Each call to `new_counter()` creates an independent counter with its own state.

```r
new_counter <- function() {
  count <- 0
  function() {
    count <<- count + 1
    count
  }
}

counter_a <- new_counter()
counter_b <- new_counter()

counter_a()
#> [1] 1
counter_a()
#> [1] 2
counter_a()
#> [1] 3
counter_b()
#> [1] 1
```

`counter_a` and `counter_b` look identical, but they are isolated. Each one has its own enclosing environment containing a private `count` variable, created fresh when `new_counter()` was called. Using `<-` inside the child would create a local variable and throw away the update; `<<-` is what makes the memory stick.

![Closure environment chain diagram](screenshots/R-Function-Factories-closure-env.webp)
*Figure 2: Each counter created by new_counter() holds its own enclosing environment.*

[NOTE]
**Stateful factories are how R built toy "objects" before R6 or S4 existed.** Counters, caches, and small accumulators were routinely written exactly this way. It is still the right tool when you need one small piece of private state and do not want the ceremony of a class.

**Try it:** Build `ex_running_sum()` — each call to the returned function should add its argument to a running total and return the new total.

```r
# Try it: write ex_running_sum
ex_running_sum <- function() {
  total <- 0
  # your code here
}

adder <- ex_running_sum()
adder(10)
#> Expected: 10
adder(5)
#> Expected: 15
adder(100)
#> Expected: 115
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_running_sum <- function() {
  total <- 0
  function(x) {
    total <<- total + x
    total
  }
}

adder <- ex_running_sum()
adder(10)
#> [1] 10
adder(5)
#> [1] 15
adder(100)
#> [1] 115
```

**Explanation:** `total <<- total + x` updates the `total` binding in the enclosing environment of `ex_running_sum`, so the value persists across calls to `adder()`.

</details>

## When should you use function factories over regular functions?

Function factories earn their keep when expensive work can be done **once** and then reused on every call to the child function. Maximum likelihood estimation is a classic case. To fit a Poisson rate $\lambda$ to observed counts, you minimise the negative log-likelihood:

$$-\log L(\lambda) = n \lambda - \left(\sum_i x_i\right) \log \lambda + \sum_i \log(x_i!)$$

Where:

- $n$ = number of observations
- $\sum_i x_i$ = the sample total
- $\sum_i \log(x_i!)$ = a constant that does not depend on $\lambda$

Notice that $n$, $\sum x_i$, and the factorial term never change as the optimiser explores different values of $\lambda$. A naive implementation would recompute them every step. A factory can stash them once.

```r
nll_poisson <- function(x) {
  force(x)
  n          <- length(x)
  sum_x      <- sum(x)
  sum_lgamma <- sum(lgamma(x + 1))   # log(x!)
  function(lambda) {
    n * lambda - sum_x * log(lambda) + sum_lgamma
  }
}

set.seed(94)
x_data <- rpois(n = 500, lambda = 3.7)

ll <- nll_poisson(x_data)
fit_poisson <- optimise(ll, interval = c(0.01, 20))
fit_poisson$minimum
#> [1] 3.712
```

The optimiser hammered the child function hundreds of times, but `length()`, `sum()`, and the `lgamma` work happened exactly once. For a 500-element sample the savings are small; for millions of rows it is the difference between a cup of coffee and an afternoon.

[TIP]
**Move every constant out of the child function and into the factory body.** If a calculation does not depend on the argument the child receives, it belongs above the inner `function(...)` line. This is the single biggest performance lever factories give you.

**Try it:** Write `ex_deviation(x)` — it precomputes `mean(x)` and returns a function that takes a new value `v` and reports how far it is from that mean.

```r
# Try it: write ex_deviation
ex_deviation <- function(x) {
  # your code here
}

dev_fn <- ex_deviation(c(10, 20, 30, 40, 50))
dev_fn(45)
#> Expected: 15
dev_fn(12)
#> Expected: -18
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_deviation <- function(x) {
  force(x)
  mu <- mean(x)
  function(v) v - mu
}

dev_fn <- ex_deviation(c(10, 20, 30, 40, 50))
dev_fn(45)
#> [1] 15
dev_fn(12)
#> [1] -18
```

**Explanation:** `mean(x)` runs once when the factory is called and the result is stashed in `mu`. Every subsequent call to `dev_fn()` reads that constant instead of recomputing it.

</details>

## How do function factories power ggplot2 label formatters?

Open `scales::label_number()` or `scales::label_dollar()` and you will find function factories. They take formatting options (prefix, suffix, big-mark, precision) and return a function that turns a numeric vector into strings. That is exactly the shape ggplot2 wants for axis labels — a single-argument function — so factories let you configure the formatting up front and pass the customised child into `scale_y_continuous(labels = ...)`.

You can build your own in a few lines.

```r
label_maker <- function(prefix = "", suffix = "", digits = 0) {
  force(prefix); force(suffix); force(digits)
  function(x) {
    paste0(prefix, formatC(x, format = "f", digits = digits, big.mark = ","), suffix)
  }
}

dollars <- label_maker(prefix = "$", digits = 2)
pct2    <- label_maker(suffix = "%", digits = 1)

dollars(c(1234.5, 99.9, 1e6))
#> [1] "$1,234.50"     "$99.90"        "$1,000,000.00"
pct2(c(0.1, 12.345, 100))
#> [1] "0.1%"   "12.3%"  "100.0%"
```

`dollars` and `pct2` are ordinary-looking functions a plot can call with a single vector of numbers. All the configuration work happened once, inside `label_maker`. If you ever tried passing formatting options directly to ggplot2 and ended up with an anonymous-function soup, this is the clean alternative.

[TIP]
**Reach for a factory whenever you need to hand a "configured" function to something that only accepts a single-argument function.** Plotting libraries, `optimise()`, `integrate()`, `Reduce()`, and `purrr::map()` all fit this description.

**Try it:** Write `ex_percent(digits)` — a factory returning a function that formats numeric proportions as percentages with the given number of decimal places. `ex_percent(0)` on `0.257` should give `"26%"`.

```r
# Try it: write ex_percent
ex_percent <- function(digits) {
  # your code here
}

fmt0 <- ex_percent(0)
fmt0(c(0.1, 0.257, 0.999))
#> Expected: "10%"  "26%"  "100%"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_percent <- function(digits) {
  force(digits)
  function(x) paste0(formatC(100 * x, format = "f", digits = digits), "%")
}

fmt0 <- ex_percent(0)
fmt0(c(0.1, 0.257, 0.999))
#> [1] "10%"  "26%"  "100%"
```

**Explanation:** The child multiplies by 100 to convert the proportion, uses `formatC` to control decimal places, and pastes a `%` on the end. The factory configures `digits` once.

</details>

## How do you avoid memory leaks in function factories?

There is one footgun worth knowing about. A manufactured function keeps its enclosing environment alive as long as the function itself is alive — and that enclosing environment contains **everything** that was defined inside the factory, not just the things the child function uses. If you happen to create a big temporary object in the factory body, it sticks around forever.

```r
factory_heavy <- function() {
  big <- runif(1e6)           # 8 MB of random numbers, never used by the child
  fudge <- 0.1
  function(x) x + fudge
}

f_heavy <- factory_heavy()
format(object.size(environment(f_heavy)), units = "MB")
#> [1] "7.6 Mb"
```

`f_heavy` is a trivial "add 0.1" function, yet it is dragging 7.6 MB of dead weight around because `big` is still sitting in its enclosing environment. The fix is to delete the unused object inside the factory before returning the child.

```r
factory_lean <- function() {
  big   <- runif(1e6)
  fudge <- mean(big) + 0.1     # use big, then drop it
  rm(big)
  function(x) x + fudge
}

f_lean <- factory_lean()
format(object.size(environment(f_lean)), units = "Kb")
#> [1] "1.6 Kb"
```

Down from 7.6 MB to under 2 KB. The rule is simple: anything you compute inside a factory but do not need in the child function should be removed with `rm()` before you return.

[WARNING]
**Factories hold on to everything in scope, not just the variables the child references.** If you are building thousands of functions inside a loop or storing them in a list, an unused 10 MB object inside the factory body turns into 10 GB of retained memory. Always `rm()` heavy intermediates.

**Try it:** The factory below captures a large `raw` object it does not need. Clean it up so the returned function is lean.

```r
# Try it: clean up ex_leaky
ex_leaky <- function() {
  raw <- rnorm(5e5)
  threshold <- quantile(raw, 0.95)
  # your cleanup here
  function(x) x > threshold
}

ex_f <- ex_leaky()
format(object.size(environment(ex_f)), units = "Kb")
#> Expected: something small, not several Mb
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_leaky <- function() {
  raw <- rnorm(5e5)
  threshold <- quantile(raw, 0.95)
  rm(raw)
  function(x) x > threshold
}

ex_f <- ex_leaky()
format(object.size(environment(ex_f)), units = "Kb")
#> [1] "1.8 Kb"
```

**Explanation:** `raw` was only needed to compute `threshold`. After that we drop it with `rm()`, and the child function keeps just the small `threshold` value in its enclosing environment.

</details>

## Practice Exercises

Two capstone problems combining everything above. The `my_*` prefixes below keep exercise state from colliding with earlier code.

### Exercise 1: Build a bounded clipper factory

Write `make_bounded_clipper(lo, hi)` that returns a function which clips a numeric vector so every value falls inside `[lo, hi]`. Use `force()` for safety. Test it on `c(-0.5, 0.3, 1.2)` with a 0-to-1 clipper.

```r
# Exercise 1: bounded clipper
# Hint: inside the child, use pmin(pmax(x, lo), hi)

make_bounded_clipper <- function(lo, hi) {
  # your code here
}

my_clip_01 <- make_bounded_clipper(0, 1)
my_clip_01(c(-0.5, 0.3, 1.2))
```

<details>
<summary>Click to reveal solution</summary>

```r
make_bounded_clipper <- function(lo, hi) {
  force(lo); force(hi)
  stopifnot(lo < hi)
  function(x) pmin(pmax(x, lo), hi)
}

my_clip_01 <- make_bounded_clipper(0, 1)
my_clip_01(c(-0.5, 0.3, 1.2))
#> [1] 0.0 0.3 1.0
```

**Explanation:** `pmax(x, lo)` lifts anything below `lo`; `pmin(..., hi)` caps anything above `hi`. `force()` guards against lazy evaluation if the factory is ever used inside a loop.

</details>

### Exercise 2: Exponentially weighted moving average

Build `make_ema(alpha)` that returns a stateful function. On each call, the function takes a numeric value, updates an exponentially weighted moving average using `new = alpha * x + (1 - alpha) * old`, and returns the new EMA. Use `<<-` so state persists. Demonstrate two independent trackers.

```r
# Exercise 2: stateful EMA
# Hint: initialise the state to NA and special-case the first call

make_ema <- function(alpha) {
  # your code here
}

my_fast <- make_ema(0.5)
my_slow <- make_ema(0.1)

c(my_fast(10), my_fast(20), my_fast(30))
c(my_slow(10), my_slow(20), my_slow(30))
```

<details>
<summary>Click to reveal solution</summary>

```r
make_ema <- function(alpha) {
  force(alpha)
  state <- NA_real_
  function(x) {
    state <<- if (is.na(state)) x else alpha * x + (1 - alpha) * state
    state
  }
}

my_fast <- make_ema(0.5)
my_slow <- make_ema(0.1)

c(my_fast(10), my_fast(20), my_fast(30))
#> [1] 10.0 15.0 22.5
c(my_slow(10), my_slow(20), my_slow(30))
#> [1] 10.00 11.00 12.90
```

**Explanation:** Each tracker gets its own `state` via an independent enclosing environment. The first value seeds the state; subsequent calls blend the new value with the remembered one. `my_fast` reacts quickly because `alpha = 0.5`; `my_slow` smooths more because `alpha = 0.1`.

</details>

## Complete Example

Let us put the pattern to work on something realistic: a reusable range validator for data-cleaning pipelines. You pass minimum and maximum bounds into the factory, and it hands back a function that audits a numeric vector and reports what failed. You can mint one validator for ages, another for percentages, and drop them straight into a dplyr pipeline.

```r
make_range_validator <- function(min_val, max_val, label = "value") {
  force(min_val); force(max_val); force(label)
  msg <- paste0("Out-of-range ", label, " detected")
  function(x) {
    bad_idx <- which(x < min_val | x > max_val | is.na(x))
    list(
      ok        = length(bad_idx) == 0,
      n_bad     = length(bad_idx),
      offending = x[bad_idx],
      message   = if (length(bad_idx)) msg else paste0("All ", label, "s pass")
    )
  }
}

validate_age <- make_range_validator(0, 120, label = "age")
validate_pct <- make_range_validator(0, 1,   label = "proportion")

dirty_ages <- c(25, 42, 170, -3, 55, NA)
validate_age(dirty_ages)
#> $ok
#> [1] FALSE
#>
#> $n_bad
#> [1] 3
#>
#> $offending
#> [1] 170  -3  NA
#>
#> $message
#> [1] "Out-of-range age detected"

dirty_pcts <- c(0.1, 0.4, 0.9, 1.1)
validate_pct(dirty_pcts)
#> $ok
#> [1] FALSE
#>
#> $n_bad
#> [1] 1
#>
#> $offending
#> [1] 1.1
#>
#> $message
#> [1] "Out-of-range proportion detected"
```

Every trick from the tutorial shows up in `make_range_validator`. `force()` pins the bounds and label so the factory is safe inside loops. The precomputed `msg` is the MLE-style optimisation: build the error string once, reuse it forever. The returned closure carries `min_val`, `max_val`, `label`, and `msg` in its enclosing environment, so the two validators stay independent despite sharing code. And because the result is a plain single-argument function, you can pipe it into `purrr::map()`, `dplyr::summarise()`, or anything else that expects `f(x)`.

## Summary

![When to use a function factory diagram](screenshots/R-Function-Factories-when-to-use.webp)
*Figure 3: Decision guide for when a function factory is the right tool.*

| Pattern | When to use | Key rule |
|---|---|---|
| `power(exponent)` style | You need many near-identical functions differing only by a parameter | The parameter lives in the enclosing environment |
| `force(arg)` guard | Any time the factory is called inside a loop or `lapply` | Force before the inner `function(...)` line |
| `<<-` super-assignment | You need persistent state (counter, cache, EMA) | Initialise state inside the factory, mutate inside the child |
| Precompute inside factory | Expensive setup that does not depend on the child's input | Move constants above the inner `function(...)` line |
| `rm()` cleanup | You created a large intermediate but do not need it in the child | Call `rm()` before returning the child function |

**The mental model to keep:** a function factory is a *function-building function*. Everything before the inner `function(...)` line runs **once**; everything inside runs on **every** call to the child. Push work upward to run it once, and use the enclosing environment as the bridge.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 10: Function factories. [Link](https://adv-r.hadley.nz/function-factories.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 6: Functions (closures and lexical scoping). [Link](https://adv-r.hadley.nz/functions.html)
3. Advanced R Solutions — Chapter 9: Function factories exercises. [Link](https://advanced-r-solutions.rbind.io/function-factories.html)
4. R Documentation — `force()`: forcing evaluation of an argument. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/force.html)
5. R Documentation — `environment()`: inspecting and manipulating environments. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/environment.html)
6. scales package — `label_number()` and the formatter family (real-world factories used by ggplot2). [Link](https://scales.r-lib.org/reference/label_number.html)
7. factory package on CRAN — tools for building function factories with cleaner printed output. [Link](https://cran.r-project.org/package=factory)

## Continue Learning

- **[R Closures](R-Closures.html)** — The closure mechanism that makes every factory in this tutorial work. Go deeper on environments and lexical scope.
- **[R Function Operators](R-Function-Operators.html)** — A close cousin of factories: functions that take a function and return a modified version of it. Think decorators in Python.
- **[Functional Programming in R](Functional-Programming-in-R.html)** — How factories, closures, operators, and functionals fit together as one coherent toolkit.
