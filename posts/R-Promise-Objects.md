---
title: "R Promise Objects: Lazy Evaluation & Force() Explained"
slug: "R-Promise-Objects"
description: "Learn how R uses promise objects for lazy evaluation: delayed argument evaluation, force(), substitute(), and why default arguments are evaluated lazily."
keywords: "R promise objects, R lazy evaluation, R force function, R substitute, R delayed evaluation, R default arguments, R promises"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-inte-4"
post_type: "FR"
auto_link_terms: "R promise objects|lazy evaluation|force()|R promises"
auto_link_case_sensitive: false
fr_parent: "R-Environments.html"
---

# R Promise Objects: Lazy Evaluation & Force() Explained

<p class="lead">When you call a function in R, arguments are not evaluated immediately. Instead, R creates <strong>promise objects</strong> — recipes that say "evaluate this expression when (and if) it's actually needed." This is lazy evaluation, and it's both a feature and a source of subtle bugs.</p>

## How Lazy Evaluation Works

When you call `f(x + 1)`, R does not compute `x + 1` first. It packages the expression `x + 1` and the environment to evaluate it in as a promise, and passes that to `f`. The promise is only evaluated when `f` actually uses the argument:

```r
# Lazy evaluation: arguments aren't evaluated until used
lazy_demo <- function(a, b) {
  cat("About to use 'a'\n")
  cat("a =", a, "\n")
  cat("'b' is never used — its expression is never evaluated\n")
}

# Even though 1/0 would cause issues, b is never evaluated
lazy_demo(42, {cat("b is being evaluated!\n"); 999})
```

```r
# This means side effects in arguments happen at use time, not call time
log_and_return <- function(label, value) {
  cat(sprintf("[%s evaluated]\n", label))
  value
}

process <- function(x, y) {
  cat("Function started\n")
  result <- x  # x is evaluated here
  cat("After using x\n")
  # y is never used, so it's never evaluated
  result
}

process(log_and_return("x", 10), log_and_return("y", 20))
```

## The Lazy Evaluation Trap in Loops

The most common bug from lazy evaluation occurs with closures in loops:

```r
# The classic trap
fns <- list()
for (i in 1:3) {
  fns[[i]] <- function() cat("i =", i, "\n")
}

# All print 3! Because i is evaluated lazily when called, not when defined
fns[[1]]()
fns[[2]]()
fns[[3]]()
```

```r
# Fix with force()
fns_fixed <- list()
for (i in 1:3) {
  local({
    forced_i <- i  # force evaluation by assigning to local variable
    fns_fixed[[length(fns_fixed) + 1]] <<- function() cat("i =", forced_i, "\n")
  })
}

fns_fixed[[1]]()
fns_fixed[[2]]()
fns_fixed[[3]]()
```

## force(): Evaluate Now

`force(x)` simply evaluates `x` immediately. It's equivalent to just writing `x`, but makes the intent clear:

```r
# force() in function factories
make_adder <- function(n) {
  force(n)  # Evaluate n NOW, not later
  function(x) x + n
}

# Without force(), this pattern can have subtle bugs
# when the argument comes from a changing variable
adders <- lapply(1:5, make_adder)
cat("adders[[1]](10) =", adders[[1]](10), "\n")  # 11
cat("adders[[3]](10) =", adders[[3]](10), "\n")  # 13
cat("adders[[5]](10) =", adders[[5]](10), "\n")  # 15
```

```r
# Default arguments are evaluated lazily IN the function's environment
smart_default <- function(x, n = length(x)) {
  # n defaults to length(x), evaluated when n is first used
  # At that point, x is already available in this environment
  head(x, n)
}

cat("All:", smart_default(1:10), "\n")
cat("First 3:", smart_default(1:10, 3), "\n")
```

## substitute(): Capture the Promise Expression

`substitute()` captures the unevaluated expression from a promise:

```r
# substitute captures what the user typed, not the value
show_expression <- function(x) {
  expr <- substitute(x)
  cat("Expression:", deparse(expr), "\n")
  cat("Value:", x, "\n")
}

a <- 5
show_expression(a + 10)
show_expression(sqrt(144))
show_expression(1:5)
```

This is how functions like `plot()` automatically label axes with the expression you passed in.

## Practice Exercise

```r
# Exercise: Create a function make_validators() that takes a list
# of conditions like list(positive = x > 0, small = x < 100)
# and returns a list of validator functions.
# Make sure each validator captures its own condition correctly
# (don't fall into the lazy evaluation trap).

# Test: validators$positive(-5) should return FALSE
#       validators$small(50) should return TRUE

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
make_validators <- function(conditions) {
  validators <- list()
  for (name in names(conditions)) {
    local({
      threshold_name <- name
      cond <- conditions[[threshold_name]]
      validators[[threshold_name]] <<- function(x) {
        eval(cond, list(x = x))
      }
    })
  }
  validators
}

# Simpler approach using lapply (no lazy eval trap)
make_validators2 <- function(rules) {
  lapply(rules, function(rule) {
    force(rule)
    function(x) eval(rule, list(x = x))
  })
}

validators <- make_validators2(list(
  positive = quote(x > 0),
  small = quote(x < 100),
  even = quote(x %% 2 == 0)
))

cat("Is -5 positive?", validators$positive(-5), "\n")
cat("Is 50 small?", validators$small(50), "\n")
cat("Is 7 even?", validators$even(7), "\n")
cat("Is 8 even?", validators$even(8), "\n")
```

**Explanation:** Using `quote()` to create unevaluated expressions and `eval()` with a custom environment prevents the lazy evaluation trap. `lapply()` creates a new scope for each iteration, which also helps.

</details>

## Summary

| Concept | Description | Solution |
|---------|-------------|----------|
| Lazy evaluation | Arguments evaluated on demand | Default R behavior |
| Promise | Unevaluated expression + environment | Created automatically for args |
| `force(x)` | Evaluate argument immediately | Use in function factories |
| `substitute(x)` | Capture unevaluated expression | For metaprogramming |
| Loop trap | Closures capture variable, not value | Use `force()` or `local()` |
| Default args | Evaluated in function's environment | Can reference other args |

## FAQ

### Is lazy evaluation the same as memoization?

No. Lazy evaluation means "don't compute until needed." Memoization means "compute once, cache the result." A promise is evaluated once and then cached, so there's a similarity — but the key feature of lazy evaluation is *deferral*, not caching.

### Why doesn't R evaluate arguments eagerly like most languages?

Lazy evaluation enables powerful patterns: default arguments that reference other arguments, short-circuit evaluation, and functions like `substitute()` that inspect the caller's expression. It also avoids computing unused arguments.

## Continue Learning

1. **R Active Bindings** — computed variables with makeActiveBinding()
2. **R Closures** — how functions capture environments (closely related to promises)
3. **R Environments** — the environments where promises are evaluated
