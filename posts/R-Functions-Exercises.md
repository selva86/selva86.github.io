---
title: "R Functions Exercises: 10 Problems, Write, Debug & Optimize Functions, Solved Step-by-Step"
slug: "R-Functions-Exercises"
description: "10 interactive R function exercises, write, test, default arguments, lazy evaluation, variadic ..., closures, debug and benchmark. Every problem runs in the page."
keywords: "R functions exercises, R function practice, R default arguments, R closures exercises, R debug function"
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "E1.6"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Functions (10 problems)"
auto_link_terms: "R functions exercises|R function practice|R default arguments"
auto_link_case_sensitive: false
fr_parent: "R-Functions.html"
difficulty: "Intermediate"
---

# R Functions Exercises: 10 Problems, Write, Debug & Optimize Functions, Solved Step-by-Step

<p class="lead">Ten exercises that take you from writing your first function to debugging, benchmarking and closures. Every problem is runnable here in the page, with an expandable worked solution. Work through in order, each one builds on the previous.</p>

Functions are R's main unit of reuse. Every tidyverse verb is a function. Every statistical model fit is a function call. The surprising thing is how few programmers use the more advanced features, default arguments, `...`, closures, early `return()`, even after years of R. These exercises fix that.

## Section 1, Writing functions

### Exercise 1. Your first function

Write a function `bmi(weight_kg, height_m)` that returns body mass index (weight / height²). Test it with 70 kg and 1.75 m.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
bmi <- function(weight_kg, height_m) {
  weight_kg / height_m^2
}

bmi(70, 1.75)  # 22.86
```

A function is created with `function(args) body`. The last expression in the body is the return value, no explicit `return()` needed.

</details>

### Exercise 2. Default arguments

Extend `bmi()` so `height_m` defaults to 1.70 when not supplied. Test with `bmi(70)` and `bmi(70, 1.80)`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
bmi <- function(weight_kg, height_m = 1.70) {
  weight_kg / height_m^2
}

bmi(70)        # 24.22
bmi(70, 1.80)  # 21.60
```

Default values can reference other arguments or be computed expressions. They are evaluated lazily, only when the argument is actually used.

</details>

### Exercise 3. Multiple return values via a list

Write `summary_stats(x)` that takes a numeric vector and returns a named list with `n`, `mean`, `sd`, `min`, and `max`. Test with `c(2, 5, 7, 10, 14)`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
summary_stats <- function(x) {
  list(
    n    = length(x),
    mean = mean(x),
    sd   = sd(x),
    min  = min(x),
    max  = max(x)
  )
}

summary_stats(c(2, 5, 7, 10, 14))
# $n: 5
# $mean: 7.6
# $sd: 4.59
# $min: 2
# $max: 14
```

R functions return exactly one object. To "return multiple values", return a list (or a named vector, or a data frame).

</details>

## Section 2, Arguments and matching

### Exercise 4. Partial matching and named args

Write `greet(name, greeting = "Hello", punctuation = "!")`. Then call it three different ways: positional only, all named, and with partial-name matching (`greet("Ada", punc = "?")`).

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
greet <- function(name, greeting = "Hello", punctuation = "!") {
  paste0(greeting, ", ", name, punctuation)
}

greet("Ada")                                  # "Hello, Ada!"
greet("Ada", greeting = "Hi", punctuation = ".")   # "Hi, Ada."
greet("Ada", punc = "?")                      # "Hello, Ada?"  (partial match)
```

R allows partial argument matching, `punc` resolves to `punctuation` because no other argument starts with those letters. For production code, avoid partial matching: it is fragile if you add another argument later.

</details>

### Exercise 5. Variadic with `...`

Write `paste_upper(...)` that takes any number of character arguments and returns their concatenation in uppercase. Example: `paste_upper("hello", "world")` returns `"HELLOWORLD"`.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
paste_upper <- function(...) {
  toupper(paste0(...))
}

paste_upper("hello", "world")            # "HELLOWORLD"
paste_upper("big ", "red ", "box")       # "BIG RED BOX"
```

`...` collects all unnamed arguments and forwards them to another function. This is how `paste()`, `c()`, and most R functions accept variable-length inputs.

</details>

## Section 3, Environments and closures

### Exercise 6. A counter closure

Write `make_counter(start = 0)` that returns a *function*. Each time the returned function is called, it increments an internal counter and returns the new value.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
make_counter <- function(start = 0) {
  count <- start
  function() {
    count <<- count + 1
    count
  }
}

tick <- make_counter()
tick()  # 1
tick()  # 2
tick()  # 3

tick2 <- make_counter(100)
tick2() # 101
tick2() # 102
tick()  # 4  — independent state
```

`count <<- count + 1` assigns into the *enclosing* environment, which is where `count` lives. Each call to `make_counter()` creates a fresh environment, so counters are independent. This is the core of R's closure pattern.

</details>

### Exercise 7. Memoization with a closure

Write `memoize(f)` that takes a function and returns a new function. The returned function caches results per unique argument so that calling it twice with the same input is instant the second time.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
memoize <- function(f) {
  cache <- list()
  function(x) {
    key <- as.character(x)
    if (is.null(cache[[key]])) {
      cache[[key]] <<- f(x)
    }
    cache[[key]]
  }
}

slow_square <- function(x) { Sys.sleep(0.1); x^2 }
fast_square <- memoize(slow_square)

system.time(fast_square(5))  # ~0.1s first call
system.time(fast_square(5))  # ~0s on the second call
```

The cache lives in the enclosing environment of the returned function. It persists across calls but is invisible to outside code, exactly what you want for a cache.

</details>

## Section 4, Debugging and safety

### Exercise 8. Input validation with stop()

Write `safe_bmi(weight_kg, height_m)` that errors with an informative message if either argument is not a single positive number. Test it with `safe_bmi(70, 1.75)` (valid) and `safe_bmi(-10, 1.75)` (invalid).

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
safe_bmi <- function(weight_kg, height_m) {
  if (!is.numeric(weight_kg) || length(weight_kg) != 1 || weight_kg <= 0) {
    stop("weight_kg must be a single positive number, got: ",
         paste(deparse(weight_kg), collapse = " "))
  }
  if (!is.numeric(height_m) || length(height_m) != 1 || height_m <= 0) {
    stop("height_m must be a single positive number")
  }
  weight_kg / height_m^2
}

safe_bmi(70, 1.75)   # 22.86
# safe_bmi(-10, 1.75) # Error: weight_kg must be a single positive number, got: -10
```

The pattern is: validate at the top, fail fast with a clear message, then do the work. `stopifnot()` is a shorter alternative when the default error messages are good enough.

</details>

### Exercise 9. Early return with tryCatch

Write `safe_log(x)` that returns `log(x)` when `x > 0`, `NA_real_` when `x <= 0` or `NA`, and `NA_real_` if anything else goes wrong, all without letting an error propagate.

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
safe_log <- function(x) {
  tryCatch(
    {
      if (is.na(x) || x <= 0) return(NA_real_)
      log(x)
    },
    error   = function(e) NA_real_,
    warning = function(w) NA_real_
  )
}

safe_log(10)   # 2.302585
safe_log(-1)   # NA
safe_log(NA)   # NA
safe_log("a")  # NA — the arithmetic would error; tryCatch handles it
```

`tryCatch()` lets you convert errors and warnings into values. Use it sparingly, it can hide real bugs. Here it is the right choice because the caller explicitly wants a total function.

</details>

## Section 5, Benchmarking

### Exercise 10. Measure two implementations

Write two implementations of "sum of squares from 1 to n": one using a for loop, one using `sum((1:n)^2)`. Benchmark them at `n = 100000` with `system.time()`. Which is faster?

```r
# Your attempt here

```

<details>
<summary>Solution</summary>

```r
sq_loop <- function(n) {
  total <- 0
  for (i in seq_len(n)) total <- total + i^2
  total
}

sq_vec <- function(n) sum((seq_len(n))^2)

n <- 100000
system.time(sq_loop(n))
system.time(sq_vec(n))
# The vectorised version is typically 50-200x faster.
```

The vectorised version dispatches to compiled C code in one call. The loop runs the R interpreter once per iteration. Always reach for vectorised first, use loops only when each step genuinely needs the previous result.

</details>

## Summary

- Functions are created with `function(args) body`. The last expression is returned.
- Use defaults (`x = 1`) for optional arguments and `...` for variadic forwarding.
- Closures capture the enclosing environment, the basis for counters, memoization, and `$` accessors in Shiny.
- Validate inputs with `stop()` or `stopifnot()`. Wrap risky code in `tryCatch()` only when errors are expected.
- Benchmark before optimising. Vectorised code usually beats explicit loops by orders of magnitude.

## References

- [Advanced R, Functions](https://adv-r.hadley.nz/functions.html)
- [R for Data Science (2e), Functions](https://r4ds.hadley.nz/functions.html)
- [R Language Definition, Function calls](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Function-calls)

## Continue Learning

- [R Functions: Write Better R Functions](R-Functions.html)
- [R Control Flow Exercises: 12 Practice Problems](R-Control-Flow-Exercises.html)
- [R String Manipulation Exercises: 10 stringr Practice Problems](R-String-Exercises.html)
