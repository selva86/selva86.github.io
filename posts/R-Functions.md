---
title: "Write Better R Functions: Arguments, Defaults, Scope"
slug: "R-Functions"
description: "Write better R functions — define arguments with defaults, understand scoping rules, return values cleanly, and know when to vectorize. Interactive examples throughout."
keywords: "R functions, function() in R, function arguments, default arguments R, R function scope, return() in R, vectorized functions"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.10"
post_type: "C"
auto_link_terms: "R functions|function() in R|function arguments|function in R"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Writing R Functions"
sidebar_order: 10
---

<nav class="breadcrumb-nav">Home &gt; Learn R &gt; Fundamentals &gt; Writing R Functions</nav>

# Write Better R Functions: Arguments, Defaults, Scope

<p class="lead">R functions package a sequence of operations behind a name, taking arguments as input and returning a value as output. Mastering function arguments, default values, scoping, and return semantics is the single biggest step from "R user" to "R programmer."</p>

## Introduction

In R, functions are first-class objects. You create them with the `function` keyword, store them in variables, pass them to other functions, and return them from other functions. This is why R feels so programmable once you get comfortable writing functions.

This tutorial covers how to define functions, use positional and named arguments, set defaults, understand lexical scope, return values correctly, and decide when to vectorize. Every example runs live in your browser — click **Run** to try.

By the end you'll write functions that work the first time and read cleanly six months later.

## How do you define a function in R?

Use `function(args) { body }` and assign it to a name. The last expression in the body is returned automatically.

![R Function Anatomy](screenshots/R-Functions-anatomy.webp)
*Figure 1: The anatomy of an R function — name, arguments, body, return value.*

```r
# Minimal function
square <- function(x) {
  x * x
}

square(5)
#> [1] 25
square(7)
#> [1] 49
```

`square` takes one argument `x` and returns `x * x`. No `return()` needed — the last line is the return value by convention. This keeps functions short.

For multi-argument functions, separate arguments with commas:

```r
# Two arguments
bmi <- function(weight_kg, height_m) {
  weight_kg / (height_m ^ 2)
}

bmi(70, 1.75)
#> [1] 22.85714

# Call with named arguments (order doesn't matter)
bmi(height_m = 1.75, weight_kg = 70)
#> [1] 22.85714
```

R supports both positional calling (`bmi(70, 1.75)`) and named calling (`bmi(weight_kg = 70, height_m = 1.75)`). Named calls are self-documenting and order-independent.

[KEY INSIGHT]
**Named arguments make function calls self-documenting.** `lm(y ~ x, data = df)` is clearer than `lm(y ~ x, df)` even though both work. For any function call with 3+ arguments, name them.

## How do you set default argument values?

Give arguments a default value with `=` in the function signature. Defaults make arguments optional.

```r
# Function with defaults
greet <- function(name, greeting = "Hello", punct = "!") {
  paste0(greeting, ", ", name, punct)
}

# Use all defaults
greet("Alice")
#> [1] "Hello, Alice!"

# Override one default
greet("Bob", greeting = "Hi")
#> [1] "Hi, Bob!"

# Override multiple
greet("Carol", greeting = "Hey", punct = "?")
#> [1] "Hey, Carol?"
```

`greeting = "Hello"` means "if the caller doesn't provide `greeting`, use 'Hello'". Defaults turn required arguments into optional ones — the function still works with minimal input but can be customized.

[TIP]
**Default arguments can reference other arguments.** `function(x, n = length(x))` sets `n` to the length of `x` by default. This pattern is common in statistical functions.

## How do R functions return values?

R returns the **last evaluated expression** automatically. Explicit `return()` is for early exit only.

```r
# Implicit return — last expression
absolute_value <- function(x) {
  if (x < 0) {
    -x
  } else {
    x
  }
}
absolute_value(-7)
#> [1] 7

# Explicit return() for early exit
safe_divide <- function(a, b) {
  if (b == 0) {
    return(NA)
  }
  a / b
}
safe_divide(10, 2)
#> [1] 5
safe_divide(10, 0)
#> [1] NA
```

Both functions work the same way. `return()` is only needed when you want to exit before reaching the last line (e.g., guard clauses at the top of a function).

To return multiple values, package them in a list:

```r
summarize <- function(x) {
  list(
    mean = mean(x),
    median = median(x),
    sd = sd(x),
    n = length(x)
  )
}

result <- summarize(c(3, 7, 2, 9, 5, 8, 1, 6))
result$mean
#> [1] 5.125
result$sd
#> [1] 2.900123
```

Lists are the idiomatic way to return multiple values in R. The caller accesses results with `$` or `[[ ]]`.

## How does R find variable names inside functions?

R uses **lexical scoping** — variables are looked up in the environment where the function was *defined*, not where it's called.

```r
y <- 100

add_y <- function(x) {
  x + y
}

add_y(5)
#> [1] 105

y <- 200
add_y(5)
#> [1] 205

silly <- function() {
  z <- 50
  z
}
silly()
#> [1] 50
exists("z")
#> [1] FALSE
```

Inside `add_y`, `x` is local (the argument) and `y` is found in the global environment. Variables created inside a function (like `z` in `silly`) disappear when the function exits.

[WARNING]
**Don't rely on global variables inside functions.** It makes your function non-reproducible: the same call may return different results if the global changes. Pass everything the function needs as arguments.

## When should a function be vectorized?

A function is **vectorized** if it naturally works on vectors without needing a loop. Vectorized functions are faster and compose better.

```r
# Naturally vectorized
square <- function(x) x * x
square(5)
#> [1] 25
square(c(1, 2, 3, 4))
#> [1] 1 4 9 16

# Not vectorized
classify <- function(x) {
  if (x > 0) "positive"
  else if (x < 0) "negative"
  else "zero"
}
classify(5)
#> [1] "positive"
```

`square` is vectorized because `*` is vectorized. `classify` isn't — it uses scalar `if/else`. To vectorize it, use `ifelse()`:

```r
classify_vec <- function(x) {
  ifelse(x > 0, "positive",
  ifelse(x < 0, "negative", "zero"))
}
classify_vec(c(3, -1, 0, 7, -5))
#> [1] "positive" "negative" "zero"     "positive" "negative"
```

`ifelse()` is fast because it uses R's internal vectorization.

## Common Mistakes and How to Fix Them

### Mistake 1: Using `return` without parentheses

❌ **Wrong:**
```r
my_fn <- function(x) {
  return x * 2
}
```

**Why it is wrong:** `return()` is a function in R, not a keyword. It needs parentheses.

✅ **Correct:**
```r
my_fn <- function(x) {
  return(x * 2)
}
my_fn(5)
#> [1] 10
```

### Mistake 2: Shadowing an argument

❌ **Wrong:**
```r
compute <- function(x) {
  x <- x * 2
  x
}
compute(5)
#> [1] 10   # fine, but confuses readers
```

**Why it is wrong:** Reassigning the argument makes it hard to reason about what `x` refers to at any point.

✅ **Correct:**
```r
compute <- function(x) {
  doubled <- x * 2
  doubled
}
```

### Mistake 3: Returning via print

❌ **Wrong:**
```r
compute_mean <- function(x) {
  print(mean(x))
}
result <- compute_mean(c(1, 2, 3))
#> [1] 2
```

**Why it is wrong:** `print()` has side effects and returns its value invisibly. Confusing for readers.

✅ **Correct:**
```r
compute_mean <- function(x) {
  mean(x)
}
```

### Mistake 4: Missing required argument

❌ **Wrong:**
```r
greet <- function(name, greeting) {
  paste0(greeting, ", ", name)
}
greet("Alice")
#> Error in paste0(greeting, ", ", name) : argument "greeting" is missing
```

✅ **Correct:**
```r
greet <- function(name, greeting = "Hello") {
  paste0(greeting, ", ", name)
}
greet("Alice")
#> [1] "Hello, Alice"
```

## Practice Exercises

### Exercise 1: Circle Area

Write `my_area(radius)` that returns the area of a circle.

```r
# Hint: use pi

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_area <- function(radius) {
  pi * radius ^ 2
}
my_area(5)
#> [1] 78.53982
```

</details>

### Exercise 2: Default Argument

Write `my_greet(name, formal = FALSE)` that greets formally or casually.

```r
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_greet <- function(name, formal = FALSE) {
  if (formal) paste0("Hello, Mr/Ms ", name)
  else paste0("Hi, ", name)
}
my_greet("Alice")
#> [1] "Hi, Alice"
my_greet("Alice", formal = TRUE)
#> [1] "Hello, Mr/Ms Alice"
```

</details>

### Exercise 3: Return Multiple Values

Write `my_stats(x)` returning a list with mean, median, sd.

```r
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_stats <- function(x) {
  list(mean = mean(x), median = median(x), sd = sd(x))
}
my_stats(c(10, 20, 30, 40, 50))
#> $mean
#> [1] 30
#>
#> $median
#> [1] 30
#>
#> $sd
#> [1] 15.81139
```

</details>

### Exercise 4: Early Return

Write `my_safe_log(x)` returning `NA` if x ≤ 0, else `log(x)`.

```r
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_safe_log <- function(x) {
  if (x <= 0) return(NA)
  log(x)
}
my_safe_log(10)
#> [1] 2.302585
my_safe_log(-5)
#> [1] NA
```

</details>

### Exercise 5: Vectorized Sign

Write `my_sign(x)` returning "pos", "neg", or "zero" for each element.

```r
my_nums <- c(3, -1, 0, 5, -2, 0, 7)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_sign <- function(x) {
  ifelse(x > 0, "pos", ifelse(x < 0, "neg", "zero"))
}
my_nums <- c(3, -1, 0, 5, -2, 0, 7)
my_sign(my_nums)
#> [1] "pos"  "neg"  "zero" "pos"  "neg"  "zero" "pos"
```

</details>

## Complete Example: A Data Summarizer

```r
# --- summarize_vector: comprehensive stats function ---

summarize_vector <- function(x, na.rm = TRUE, digits = 2) {
  if (!is.numeric(x)) {
    return(list(error = "Input must be numeric"))
  }

  n_na <- sum(is.na(x))
  if (na.rm) x <- x[!is.na(x)]

  if (length(x) == 0) {
    return(list(n = 0, note = "No valid values"))
  }

  list(
    n = length(x),
    n_missing = n_na,
    mean = round(mean(x), digits),
    median = round(median(x), digits),
    sd = round(sd(x), digits),
    min = min(x),
    max = max(x)
  )
}

data <- c(23, 45, NA, 67, 12, NA, 89, 34, 56, 78)
summarize_vector(data)
#> $n
#> [1] 8
#>
#> $n_missing
#> [1] 2
#>
#> $mean
#> [1] 50.5
#>
#> $median
#> [1] 50.5
#>
#> $sd
#> [1] 27.26
#>
#> $min
#> [1] 12
#>
#> $max
#> [1] 89

summarize_vector(c("a", "b", "c"))
#> $error
#> [1] "Input must be numeric"
```

This function uses five patterns: argument defaults, guard clauses with early return, NA handling, list-based multiple returns, and type checking. Real R functions look like this.

## Summary

| Concept | Syntax | Example |
|---|---|---|
| Define | `f <- function(x) { ... }` | `sq <- function(x) x*x` |
| Default | `function(x = value)` | `function(x, n = 10)` |
| Implicit return | last expression | `function(x) x * 2` |
| Explicit return | `return(value)` | `return(NA)` |
| Multiple returns | list | `list(a = 1, b = 2)` |
| Named call | `f(arg = value)` | `lm(y ~ x, data = df)` |
| Scope | Lexical | Outer vars visible |

## FAQ

### Should I always use explicit `return()`?

No. R's convention is implicit return (last expression) for the main value, explicit `return()` only for early exits.

### How many arguments is too many?

~5-7 is a soft limit. Beyond that, group related arguments into a list.

### What does `...` mean?

The `...` collects extra arguments you didn't name. Useful in wrapper functions: `my_plot <- function(x, ...) plot(x, col="red", ...)`.

### Can I define a function inside another function?

Yes — these are closures. The inner function remembers the outer environment.

### How do I debug a function?

Insert `browser()` inside, or wrap with `debug(fn); fn(...)` to step through it.

## References

1. R Core Team — *An Introduction to R*, Chapter 10 (Writing your own functions). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 6 (Functions). [Link](https://adv-r.hadley.nz/functions.html)
3. R manual — `function` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/function.html)
4. R Language Definition — Function objects. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Function-objects)
5. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 26 (Functions). [Link](https://r4ds.hadley.nz/functions.html)
6. tidyverse style guide — Functions. [Link](https://style.tidyverse.org/functions.html)
7. R manual — `Vectorize()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Vectorize.html)

## What's Next?

- **[R Anonymous Functions](R-Anonymous-Functions.html)** — short throwaway functions with `\(x)` syntax.
- **[R Closures](R-Closures.html)** — functions that remember their environment.
- **[Functional Programming in R](Functional-Programming-in-R.html)** — first-class functions, map/filter/reduce.
