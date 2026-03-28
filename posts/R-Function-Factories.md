# R Function Factories: Functions That Create Functions (With 5 Examples)

> A function factory returns a function, capturing the enclosing environment as a closure. Learn this pattern with 5 real examples — from power functions to ggplot2 label formatters.

## What Is a Function Factory?

A function factory is a function that creates and returns another function. The returned function "remembers" the values that existed when it was created — even after the factory has finished running.

```r
power <- function(exponent) {
  function(x) x^exponent
}

square <- power(2)
cube <- power(3)

square(5)  # 25
cube(5)    # 125
```

The factory `power()` creates specialized functions. Each one remembers its `exponent`. This "remembering" is the key concept — it's called a closure.

## Why Use Function Factories?

Three practical reasons:

1. **Avoid repetition** — Instead of writing `round(x, 2)` everywhere, create `round2 <- rounder(2)` once
2. **Configuration** — Create functions pre-loaded with settings (like a tax rate or threshold)
3. **Composition** — Build complex behavior from simple, configurable pieces

## How Closures Work

When a function is created inside another function, it captures the **enclosing environment** — the set of variables that existed at the time of creation:

```r
make_greeter <- function(greeting) {
  function(name) {
    paste(greeting, name)
  }
}

hello <- make_greeter("Hello")
hi <- make_greeter("Hi")

hello("Alice")  # "Hello Alice"
hi("Bob")       # "Hi Bob"
```

The inner function carries its enclosing environment like a backpack. The variable `greeting` lives in that backpack, accessible whenever the inner function runs.

You can inspect a closure's environment:

```r
environment(hello)
ls(environment(hello))
get("greeting", environment(hello))
```

## Example 1: Power Function Factory

The classic example — create any power function from a single factory:

```r
power <- function(exponent) {
  function(x) x^exponent
}

square <- power(2)
cube <- power(3)
fourth <- power(4)

cat("5 squared:", square(5), "\n")
cat("5 cubed:", cube(5), "\n")
cat("5^4:", fourth(5), "\n")

# Works with vectors too
square(1:5)
```

## Example 2: Threshold Checker Factory

Create reusable threshold functions for data validation:

```r
above <- function(threshold) {
  function(x) x > threshold
}

is_adult <- above(17)
is_hot <- above(30)
is_expensive <- above(100)

ages <- c(12, 25, 17, 42, 8)
cat("Adults:", ages[is_adult(ages)], "\n")

temps <- c(28, 35, 22, 31, 29)
cat("Hot days:", sum(is_hot(temps)), "\n")

prices <- c(50, 120, 99, 200, 75)
cat("Expensive items:", sum(is_expensive(prices)), "\n")
```

## Example 3: Custom Formatter Factory

Build formatters for consistent output across your project:

```r
make_formatter <- function(prefix = "", suffix = "", digits = 2) {
  function(x) {
    formatted <- formatC(round(x, digits), format = "f", digits = digits)
    paste0(prefix, formatted, suffix)
  }
}

format_usd <- make_formatter(prefix = "$", digits = 2)
format_pct <- make_formatter(suffix = "%", digits = 1)
format_temp <- make_formatter(suffix = "°C", digits = 0)

cat(format_usd(1234.567), "\n")
cat(format_pct(0.8567 * 100), "\n")
cat(format_temp(22.7), "\n")

# Works with vectors
prices <- c(9.99, 24.50, 149.95)
cat(paste(format_usd(prices), collapse = ", "), "\n")
```

## Example 4: ggplot2 Label Formatter Factory

ggplot2 scale functions accept formatter functions. Factories let you create custom formatters:

```r
label_currency <- function(prefix = "$", big.mark = ",") {
  function(x) {
    paste0(prefix, formatC(x, format = "f", digits = 0, big.mark = big.mark))
  }
}

label_k <- function(suffix = "K") {
  function(x) {
    paste0(round(x / 1000, 1), suffix)
  }
}

# Test the formatters
fmt_usd <- label_currency()
fmt_euro <- label_currency(prefix = "€", big.mark = ".")
fmt_k <- label_k()

cat("USD:", fmt_usd(1500000), "\n")
cat("EUR:", fmt_euro(1500000), "\n")
cat("Short:", fmt_k(1500000), "\n")
```

## Example 5: Memoization Factory

Memoization caches results so expensive computations only run once per unique input:

```r
memoize <- function(f) {
  cache <- list()
  function(...) {
    key <- paste(..., sep = "_")
    if (is.null(cache[[key]])) {
      cache[[key]] <<- f(...)
    }
    cache[[key]]
  }
}

# A slow function (simulated)
slow_square <- function(x) {
  Sys.sleep(0.1)
  x^2
}

fast_square <- memoize(slow_square)

# First call — slow (computes and caches)
t1 <- system.time(result1 <- fast_square(42))

# Second call — instant (from cache)
t2 <- system.time(result2 <- fast_square(42))

cat("Result:", result1, "\n")
cat("First call:", round(t1[3], 3), "sec\n")
cat("Second call:", round(t2[3], 3), "sec\n")
```

The `<<-` operator is crucial here — it modifies the `cache` variable in the enclosing environment, not in the local scope. This is how the cache persists between calls.

## The <<- Operator and Mutable State

Closures can maintain mutable state using `<<-`:

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

counter <- make_counter()
cat("Count:", counter$get(), "\n")
counter$increment()
counter$increment()
counter$increment()
cat("After 3 increments:", counter$get(), "\n")
counter$reset()
cat("After reset:", counter$get(), "\n")
```

Use this pattern sparingly. Mutable state makes code harder to reason about. But it's powerful when you need it — for caching, logging, or rate-limiting.

## Common Pitfalls

### Pitfall 1: Lazy Evaluation Trap

R uses lazy evaluation. In a loop, all closures may capture the same variable:

```r
# BUG: all functions return 3
funs_bad <- list()
for (i in 1:3) {
  funs_bad[[i]] <- function(x) x + i
}
# i is now 3, so all functions add 3
cat("Bad:", funs_bad[[1]](10), funs_bad[[2]](10), funs_bad[[3]](10), "\n")

# FIX: use force() or a factory
make_adder <- function(n) {
  force(n)
  function(x) x + n
}

funs_good <- list()
for (i in 1:3) {
  funs_good[[i]] <- make_adder(i)
}
cat("Good:", funs_good[[1]](10), funs_good[[2]](10), funs_good[[3]](10), "\n")
```

`force(n)` evaluates the argument immediately instead of lazily. Always use `force()` in function factories when the argument is used inside the returned function.

### Pitfall 2: Memory Leaks

Closures capture their enclosing environment. If that environment contains large objects you don't need, they stay in memory:

```r
# Wasteful — big_data stays in memory
bad_factory <- function() {
  big_data <- rnorm(1e6)
  result <- mean(big_data)
  function() result
}

# Better — big_data is garbage collected
good_factory <- function() {
  big_data <- rnorm(1e6)
  result <- mean(big_data)
  rm(big_data)
  function() result
}
```

## When to Use Function Factories

| Use Case | Example |
|----------|---------|
| Parameterized transforms | `power(2)`, `rounder(3)` |
| Data validation | `above(threshold)`, `between(lo, hi)` |
| Formatting | `label_currency("$")`, `label_pct(1)` |
| ggplot2 scales | Custom axis label formatters |
| Caching/memoization | `memoize(slow_fn)` |
| Testing | Create test fixtures with preset config |
| Configuration | Pre-load API keys, database connections |

## Practice Exercises

### Exercise 1: Between Checker
Write a factory `between()` that takes `lo` and `hi` and returns a function that checks if a value is between them (inclusive).

### Exercise 2: Scaler
Write a factory `scaler()` that takes a vector, and returns a function that scales any new value to the 0-1 range using the original vector's min and max.

### Exercise 3: Logger
Write a factory that returns a function which prints a timestamped message every time it's called. Use `Sys.time()`.

### Exercise 4: Compose Two Functions
Write a factory `compose()` that takes two functions `f` and `g`, and returns a new function that computes `f(g(x))`.

## FAQ

### What's the difference between a closure and a regular function?
Every function in R is technically a closure — it has an enclosing environment. But we typically use "closure" to mean a function that uses variables from its enclosing environment that aren't passed as arguments.

### Do function factories hurt performance?
No. The function creation is fast, and calling the returned function has the same overhead as calling any other function. The only cost is memory for the enclosing environment.

### Can I see what a closure has captured?
Yes. Use `environment(fn)` to get the enclosing environment, `ls(environment(fn))` to list captured variables, and `get("var_name", environment(fn))` to inspect them.

### Are function factories a functional programming pattern?
Yes. They're called "higher-order functions" — functions that return functions. This pattern is central to functional programming in R, JavaScript, Python, and many other languages.

### When should I use a factory vs a function with extra parameters?
Use a factory when you want to configure once and call many times. Use a regular function with parameters when the configuration changes on every call.

## Conclusion

A function factory creates functions. The returned function remembers its creation context through a closure. This pattern eliminates repetition, separates configuration from execution, and produces clean, composable code. Start with the power function example to build intuition, then apply the pattern to formatters, validators, and caching in your own projects. Remember to use `force()` to avoid the lazy evaluation trap, and `rm()` to prevent memory leaks from large captured objects.
