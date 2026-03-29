---
title: "R Closures: Functions That Remember Their Defining Environment"
slug: "R-Closures"
description: "Learn how R closures capture their enclosing environment, how to inspect them with environment(), and practical closure patterns for state and factories."
keywords: "R closures, R function environment, R enclosing environment, R function factory, environment() R, R mutable state, R closure pattern"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.1.6"
post_type: "C"
auto_link_terms: "R closures|closure|enclosing environment|function factory"
auto_link_case_sensitive: false
---

# R Closures: Functions That Remember Their Defining Environment

<p class="lead">A closure is a function bundled with a reference to the environment where it was created. In R, every function is a closure — it remembers the variables that were visible when it was defined, even after that environment would normally disappear.</p>

Closures are what make function factories, accumulators, and memoization work in R. They're not an exotic concept — every function you write is technically a closure. But understanding *how* they capture environments lets you use them deliberately and powerfully.

## Introduction

A closure has three components:

1. **The function body** — the code inside `function(...) { ... }`
2. **The formals** — the function's arguments
3. **The enclosing environment** — the environment where the function was *defined*

The enclosing environment is what makes closures special. When a function looks up a variable that isn't in its own execution environment or its arguments, it looks in the enclosing environment. And that environment persists as long as the function exists.

```r
# A simple closure
make_greeter <- function(greeting) {
  function(name) {
    cat(greeting, name, "\n")
  }
}

hello <- make_greeter("Hello")
howdy <- make_greeter("Howdy")

hello("Alice")   # Hello Alice
howdy("Bob")     # Howdy Bob

# greeting is not in the inner function's args or body
# It comes from the enclosing environment (make_greeter's execution env)
```

## How Closures Capture Environments

When `make_greeter("Hello")` runs, R:

1. Creates an execution environment for `make_greeter` with `greeting = "Hello"`
2. Defines the inner function inside that environment
3. Returns the inner function — which carries a reference to that environment

Even after `make_greeter` finishes, its execution environment survives because the returned function points to it:

```r
make_multiplier <- function(factor) {
  inner <- function(x) x * factor

  # Show the enclosing environment
  cat("Inner fn's enclosing env:", format(environment(inner)), "\n")
  cat("factor in that env:", factor, "\n")

  inner
}

times_3 <- make_multiplier(3)
times_7 <- make_multiplier(7)

cat("3 * 5 =", times_3(5), "\n")
cat("7 * 5 =", times_7(5), "\n")

# Each closure has its OWN enclosing environment with its OWN 'factor'
cat("\ntimes_3's env:", format(environment(times_3)), "\n")
cat("times_7's env:", format(environment(times_7)), "\n")
cat("Same env?", identical(environment(times_3), environment(times_7)), "\n")
```

## Inspecting Closures with environment()

`environment(fn)` returns the enclosing environment of a function. You can inspect and even modify it:

```r
make_counter <- function(start = 0) {
  count <- start

  list(
    increment = function() {
      count <<- count + 1
      count
    },
    get = function() count,
    reset = function() {
      count <<- start
    }
  )
}

ctr <- make_counter(10)
ctr$increment()
ctr$increment()
ctr$increment()
cat("Count:", ctr$get(), "\n")

# Peek inside the enclosing environment
env <- environment(ctr$get)
cat("Enclosing env contents:", paste(ls(env), collapse = ", "), "\n")
cat("count in env:", get("count", envir = env), "\n")
cat("start in env:", get("start", envir = env), "\n")
```

Notice the `<<-` operator — it assigns to the enclosing environment instead of the local execution environment. This is how closures maintain mutable state.

## Enclosing vs Binding Environment

Two environment concepts that often confuse people:

- **Enclosing environment**: where the function was *defined* — `environment(fn)`
- **Binding environment**: where the function's *name* lives — the env where `fn` is assigned

```r
# The enclosing env = where the function was created
wrapper <- function() {
  local_fn <- function() cat("I was defined inside wrapper\n")

  cat("local_fn's enclosing env:", environmentName(environment(local_fn)), "\n")
  # It's wrapper's execution env (unnamed)

  local_fn
}

fn <- wrapper()
fn()

# fn is BOUND in the global env, but ENCLOSED in wrapper's env
cat("fn is bound in:", environmentName(environment()), "\n")
cat("fn encloses:", format(environment(fn)), "\n")
```

For closures returned by function factories, the enclosing and binding environments are always different. The enclosing environment is the factory's execution environment; the binding environment is wherever you store the result.

## Practical Closure Patterns

### Pattern 1: Running Total

```r
make_accumulator <- function() {
  total <- 0
  function(x) {
    total <<- total + x
    total
  }
}

acc <- make_accumulator()
cat("Add 5:", acc(5), "\n")
cat("Add 3:", acc(3), "\n")
cat("Add 12:", acc(12), "\n")
cat("Running total:", acc(0), "\n")
```

### Pattern 2: Logger with Timestamp

```r
make_logger <- function(prefix = "LOG") {
  messages <- character()

  list(
    log = function(msg) {
      entry <- paste0("[", prefix, " ", Sys.time(), "] ", msg)
      messages <<- c(messages, entry)
      cat(entry, "\n")
    },
    history = function() messages,
    count = function() length(messages)
  )
}

logger <- make_logger("APP")
logger$log("Started")
logger$log("Processing data")
logger$log("Complete")

cat("\nLog has", logger$count(), "entries\n")
cat("\nFull history:\n")
for (msg in logger$history()) cat(" ", msg, "\n")
```

### Pattern 3: Once-Only Function

```r
make_once <- function(fn) {
  called <- FALSE
  result <- NULL

  function(...) {
    if (!called) {
      result <<- fn(...)
      called <<- TRUE
    }
    result
  }
}

expensive <- make_once(function() {
  cat("Computing... (this only runs once)\n")
  sum(1:1000000)
})

cat("Call 1:", expensive(), "\n")
cat("Call 2:", expensive(), "\n")  # Cached, no recomputation
cat("Call 3:", expensive(), "\n")
```

## Practice Exercises

### Exercise 1: Rate Limiter

```r
# Exercise: Create make_rate_limiter(max_calls) that returns a function.
# The returned function accepts any function and its args,
# but only executes it if max_calls hasn't been exceeded.
# After that, it returns "Rate limit exceeded".
#
# Usage:
#   limited <- make_rate_limiter(3)
#   limited(cat, "hello\n")   # works
#   limited(cat, "hello\n")   # works
#   limited(cat, "hello\n")   # works
#   limited(cat, "hello\n")   # "Rate limit exceeded"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
make_rate_limiter <- function(max_calls) {
  calls_made <- 0

  function(fn, ...) {
    if (calls_made >= max_calls) {
      cat("Rate limit exceeded\n")
      return(invisible(NULL))
    }
    calls_made <<- calls_made + 1
    fn(...)
  }
}

limited <- make_rate_limiter(3)
limited(cat, "Call 1\n")
limited(cat, "Call 2\n")
limited(cat, "Call 3\n")
limited(cat, "Call 4\n")  # Rate limit exceeded
limited(cat, "Call 5\n")  # Rate limit exceeded
```

**Explanation:** The closure captures `calls_made` and `max_calls`. Each call increments the counter with `<<-`. Once the limit is reached, all subsequent calls are blocked.

</details>

### Exercise 2: Stateful Transformer

```r
# Exercise: Create make_running_mean() that returns a function.
# Each call adds a number and returns the running mean of all
# numbers seen so far.
#
# rm <- make_running_mean()
# rm(10)  # 10
# rm(20)  # 15
# rm(30)  # 20

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
make_running_mean <- function() {
  values <- numeric(0)

  function(x) {
    values <<- c(values, x)
    mean(values)
  }
}

rm_fn <- make_running_mean()
cat("Add 10:", rm_fn(10), "\n")
cat("Add 20:", rm_fn(20), "\n")
cat("Add 30:", rm_fn(30), "\n")
cat("Add 0:", rm_fn(0), "\n")
```

**Explanation:** The `values` vector in the enclosing environment accumulates all inputs. Each call appends to it with `<<-` and returns the mean. The state persists across calls because it lives in the closure's enclosing environment.

</details>

## Summary

| Concept | Description | Access |
|---------|-------------|--------|
| Enclosing env | Where function was defined | `environment(fn)` |
| Binding env | Where function's name lives | The env where `fn <- ...` ran |
| `<<-` | Assign to enclosing env | Modifies closure state |
| Function factory | Function that returns functions | `make_adder <- function(n) function(x) x + n` |
| Fresh start | Each factory call = new env | Separate state per closure |
| `environment(fn)` | Inspect the enclosing env | `ls(environment(fn))` |

**Key insight:** Closures are R's mechanism for persistent, encapsulated state. They're the functional programming equivalent of objects with private fields.

## FAQ

### Is every R function a closure?

Technically, yes — every function has an enclosing environment. But the term "closure" is usually reserved for functions that *rely* on their enclosing environment for free variables (variables not defined in the function's own body or arguments).

### What's the difference between `<-` and `<<-` in closures?

`<-` creates a local binding in the current execution environment. `<<-` walks up the environment chain and modifies the first existing binding it finds. In closures, `<<-` modifies the variable in the enclosing environment, enabling persistent state.

### Can closures cause memory leaks?

Yes. Because closures keep their enclosing environment alive, any large objects in that environment stay in memory. If you create a closure inside a function that also has a large data frame, that data frame won't be garbage collected. To avoid this, only capture what you need, or explicitly `rm()` large objects before returning the closure.

## What's Next?

Closures connect to several important R topics:

1. **R Conditions System** — use closures as condition handlers in tryCatch
2. **R Function Factories** — a deeper dive into factory patterns
3. **R Debugging** — how to debug inside closure scopes
