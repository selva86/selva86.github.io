---
title: "R Functions Exercises: 18 Default Arg, Closure and Dots Problems"
slug: "R-Functions-Exercises"
description: "Eighteen interactive R function exercises covering default arguments, match.arg, dots, lazy evaluation, closures, recursion, on.exit and higher-order functions."
keywords: "R functions exercises, R closures exercises, R default arguments, R lazy evaluation, R higher order functions"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Functions (18 problems)"
sidebar_order: 150
fr_parent: "R-Functions.html"
auto_link_terms: "r functions exercises|r closures exercises|r default arguments|r lazy evaluation|r higher order functions"
auto_link_case_sensitive: false
target_keyword: "R functions exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Functions Exercises: 18 Default Arg, Closure and Dots Problems

<p class="lead">Eighteen runnable practice problems for writing R functions: positional and named arguments, defaults, <code>match.arg()</code>, the dots argument <code>...</code>, lazy evaluation, closures, <code>on.exit()</code>, recursion, anonymous lambdas with <code>\(x)</code>, and the higher-order helpers <code>Filter</code> and <code>Reduce</code>. Every solution is tucked behind a reveal block.</p>

Functions are R's main unit of reuse. Most people stop at `function(args) body` and never touch closures, dots, or lazy evaluation, then wonder why packages they read look impenetrable. These problems isolate each idiom on a small enough surface that the mechanism is visible, not the data wrangling around it.

```r title="Run this once before any exercise"
library(tibble)
```

## Section 1. Arguments, defaults and validation (4 problems)

### Exercise 1.1: Write a body mass index function with two numeric arguments

**Task:** A clinic dashboard wants a quick BMI calculator written as a reusable function. Define `bmi(weight_kg, height_m)` that returns body mass index, weight divided by height squared. Call it with 70 kg and 1.75 m and save the result to `ex_1_1`.

**Expected result:**

```
#> [1] 22.85714
```

**Difficulty:** Beginner

```r title="Your turn"
bmi <- function(weight_kg, height_m) {
  # your code here
}
ex_1_1 <- bmi(70, 1.75)
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
bmi <- function(weight_kg, height_m) {
  weight_kg / height_m^2
}
ex_1_1 <- bmi(70, 1.75)
ex_1_1
#> [1] 22.85714
```

**Explanation:** A function is created with `function(args) body` and the last expression in the body is its return value, so an explicit `return()` is unnecessary for the common case. The `^` operator has higher precedence than `/`, so `weight_kg / height_m^2` parses as the intended `weight_kg / (height_m^2)`. Functions are first-class objects in R: you can pass them as arguments, store them in lists, and return them from other functions.

</details>

### Exercise 1.2: Convert Celsius to Fahrenheit with a default offset argument

**Task:** A meteorologist often converts temperatures from Celsius to Fahrenheit. Write `c_to_f(c, offset = 32)` returning `c * 9/5 + offset`, where the offset has a default because Fahrenheit's zero point is shifted. Call `c_to_f(-5)` using the default, save it to `ex_1_2`, and verify with `c_to_f(100)`.

**Expected result:**

```
#> [1] 23
#> [1] 212
```

**Difficulty:** Beginner

```r title="Your turn"
c_to_f <- function(c, offset = 32) {
  # your code here
}
ex_1_2 <- c_to_f(-5)
ex_1_2
c_to_f(100)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
c_to_f <- function(c, offset = 32) {
  c * 9 / 5 + offset
}
ex_1_2 <- c_to_f(-5)
ex_1_2
#> [1] 23
c_to_f(100)
#> [1] 212
```

**Explanation:** Default arguments are evaluated lazily inside the function body, which means a default can depend on other arguments of the same call, for example `function(x, y = x * 2)`. Defaults make a function callable with the most common path on autopilot while keeping advanced overrides available. If you want the default to be required, write `offset = stop("supply offset")` and the error fires only when the argument is actually used.

</details>

### Exercise 1.3: Restrict an argument to a fixed set of strings with match.arg

**Task:** A weather dashboard exposes `forecast_label(level)` and must reject typos. Use `match.arg()` so `level` is one of `"sunny"`, `"cloudy"`, `"rain"`, or `"snow"`, and any other value raises a clear error. Call `forecast_label("rain")` and save the returned string to `ex_1_3`.

**Expected result:**

```
#> [1] "rain"
```

**Difficulty:** Intermediate

```r title="Your turn"
forecast_label <- function(level = c("sunny", "cloudy", "rain", "snow")) {
  # your code here
}
ex_1_3 <- forecast_label("rain")
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
forecast_label <- function(level = c("sunny", "cloudy", "rain", "snow")) {
  level <- match.arg(level)
  level
}
ex_1_3 <- forecast_label("rain")
ex_1_3
#> [1] "rain"
```

**Explanation:** `match.arg()` is the idiomatic way to validate a string option against an allowed set. When the default is the full allowed vector and `match.arg()` is called with no arguments, the first element becomes the default value. It also supports partial matching, so `forecast_label("rai")` would resolve to `"rain"`. Pass an unknown value and you get `Error in match.arg: 'arg' should be one of "sunny", "cloudy", "rain", "snow"`, which is more helpful than a custom `stop()`.

</details>

### Exercise 1.4: Make an argument truly optional with missing()

**Task:** A retailer wants `apply_discount(price, pct)` to return `price` unchanged when `pct` is not supplied, and `price * (1 - pct/100)` otherwise. Use `missing(pct)` for the test, since it is true only when the caller did not pass `pct`. Save `apply_discount(100)` to `ex_1_4`.

**Expected result:**

```
#> [1] 100
```

**Difficulty:** Intermediate

```r title="Your turn"
apply_discount <- function(price, pct) {
  # your code here
}
ex_1_4 <- apply_discount(100)
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
apply_discount <- function(price, pct) {
  if (missing(pct)) price
  else price * (1 - pct / 100)
}
ex_1_4 <- apply_discount(100)
ex_1_4
#> [1] 100
```

**Explanation:** `missing()` is `TRUE` only when the caller did not supply the argument and the argument has no default value. It is more accurate than checking `is.null(pct)` because `NULL` may be a legitimate value the caller wanted to pass. The common alternative is to set `pct = NULL` as a default and check `is.null(pct)`, which is fine when `NULL` is not a meaningful input. Reach for `missing()` when you need to distinguish "not passed" from "passed as NULL".

</details>

## Section 2. The dots argument and forwarding (3 problems)

### Exercise 2.1: Average any number of numeric vectors using the dots argument

**Task:** Write `mean_safely(...)` that accepts any number of numeric vectors via `...`, flattens them with `c(...)`, drops `NA` values, and returns the overall mean. Save `mean_safely(c(1, NA, 3), c(5, 7))` to `ex_2_1` and verify with `mean_safely(1:10)`.

**Expected result:**

```
#> [1] 4
#> [1] 5.5
```

**Difficulty:** Intermediate

```r title="Your turn"
mean_safely <- function(...) {
  # your code here
}
ex_2_1 <- mean_safely(c(1, NA, 3), c(5, 7))
ex_2_1
mean_safely(1:10)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mean_safely <- function(...) {
  all_vals <- c(...)
  mean(all_vals, na.rm = TRUE)
}
ex_2_1 <- mean_safely(c(1, NA, 3), c(5, 7))
ex_2_1
#> [1] 4
mean_safely(1:10)
#> [1] 5.5
```

**Explanation:** Inside a function, `...` is a special symbol that collects every unmatched extra argument the caller passed. You consume it with `c(...)` to flatten or `list(...)` to keep elements separate. The dots argument is positional and lazy, meaning each piece is only evaluated when you actually touch it. Picking out a single dot by name uses `..1`, `..2` and so on, while `...length()` reports how many extra arguments were passed.

</details>

### Exercise 2.2: Element-wise sum of arbitrary equal-length vectors with dots and Reduce

**Task:** Build `sum_columns(...)` that takes any number of equal-length numeric vectors through `...` and returns their element-wise sum (the same length as each input). Wrap the dots into a list and reduce with `+`. Save `sum_columns(1:3, 10:12, 100:102)` to `ex_2_2`.

**Expected result:**

```
#> [1] 111 114 117
```

**Difficulty:** Intermediate

```r title="Your turn"
sum_columns <- function(...) {
  # your code here
}
ex_2_2 <- sum_columns(1:3, 10:12, 100:102)
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sum_columns <- function(...) {
  vecs <- list(...)
  Reduce(`+`, vecs)
}
ex_2_2 <- sum_columns(1:3, 10:12, 100:102)
ex_2_2
#> [1] 111 114 117
```

**Explanation:** `list(...)` keeps each input vector as a separate list element, which is what you need for an element-wise reduction. `Reduce("+", vecs)` applies `+` left-to-right across the list, leveraging R's vectorised arithmetic: `1:3 + 10:12 = c(11, 13, 15)`, and so on. Compared to `do.call("+", vecs)`, `Reduce` scales to any number of inputs whereas the binary `+` only takes two operands directly. For a length-mismatch input set, this approach silently recycles, so a leading `stopifnot(length(unique(lengths(vecs))) == 1)` is a useful guardrail in production.

</details>

### Exercise 2.3: Pass extra arguments to mean through a safe wrapper

**Task:** Write `safe_mean(x, ...)` that returns the mean of a numeric vector after removing NAs by passing `na.rm = TRUE`, and forwards any extra arguments (such as `trim`) to `base::mean()` via the dots. Save `safe_mean(c(1, 2, NA, 4, 5), trim = 0.2)` to `ex_2_3`, then verify on `c(NA, NA, 5)`.

**Expected result:**

```
#> [1] 3
#> [1] 5
```

**Difficulty:** Advanced

```r title="Your turn"
safe_mean <- function(x, ...) {
  # your code here
}
ex_2_3 <- safe_mean(c(1, 2, NA, 4, 5), trim = 0.2)
ex_2_3
safe_mean(c(NA, NA, 5))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_mean <- function(x, ...) {
  mean(x, na.rm = TRUE, ...)
}
ex_2_3 <- safe_mean(c(1, 2, NA, 4, 5), trim = 0.2)
ex_2_3
#> [1] 3
safe_mean(c(NA, NA, 5))
#> [1] 5
```

**Explanation:** Forwarding `...` directly to another function is the most common dots pattern in the tidyverse and base R: every named argument the user passes flows through unchanged. The trick is that `safe_mean` already hard-codes `na.rm = TRUE`, so the caller cannot reset it; if they pass `na.rm = FALSE` it would either be silently shadowed or raise a duplicate-argument error depending on argument matching. To keep both behaviours, drop the hard-coded value and rely entirely on `...`, or use `if (!"na.rm" %in% names(list(...)))` to inject the default only when absent.

</details>

## Section 3. Lazy evaluation, closures and on.exit (4 problems)

### Exercise 3.1: Show that R does not evaluate unused arguments with lazy evaluation

**Task:** Write `pick_first(x, y = stop("y was evaluated"))` that returns `x` and never touches `y`. Calling `pick_first(42)` should succeed even though the default expression for `y` is an error, proving R defers evaluation until a value is needed. Save the returned value to `ex_3_1` and confirm the trick on a string input too.

**Expected result:**

```
#> [1] 42
#> [1] "hello"
```

**Difficulty:** Intermediate

```r title="Your turn"
pick_first <- function(x, y = stop("y was evaluated")) {
  # your code here
}
ex_3_1 <- pick_first(42)
ex_3_1
pick_first("hello")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pick_first <- function(x, y = stop("y was evaluated")) {
  x
}
ex_3_1 <- pick_first(42)
ex_3_1
#> [1] 42
pick_first("hello")
#> [1] "hello"
```

**Explanation:** R arguments are not evaluated when the function is called, only when the body actually references them. This is called lazy evaluation and it is implemented via promises: each argument is bundled with its expression and the enclosing environment, then forced on first use. The pattern shows up in real code as defaults like `function(x, n = length(x))` where `n` depends on `x`. It also has a footgun: if a default has a side effect, you have no guarantee it ever fires, so never put log writes or counters in default expressions.

</details>

### Exercise 3.2: Build a counter factory that returns a stateful closure

**Task:** Write a factory `make_counter(start = 0)` that returns a closure incrementing and returning a private counter on each call. Two counters built from the same factory must hold independent state. Call one closure three times, save the third returned value to `ex_3_2`, then call a second fresh counter once.

**Expected result:**

```
#> [1] 3
#> [1] 1
```

**Difficulty:** Intermediate

```r title="Your turn"
make_counter <- function(start = 0) {
  # your code here
}
counter <- make_counter()
counter(); counter()
ex_3_2 <- counter()
ex_3_2
make_counter()()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_counter <- function(start = 0) {
  count <- start
  function() {
    count <<- count + 1
    count
  }
}
counter <- make_counter()
counter(); counter()
ex_3_2 <- counter()
ex_3_2
#> [1] 3
make_counter()()  # fresh counter is independent
#> [1] 1
```

**Explanation:** A closure is a function plus the environment in which it was defined. When `make_counter` returns the inner function, that environment, containing `count`, survives as long as the returned closure is reachable. The `<<-` operator walks up parent environments to find `count` and assigns to it in place, which is what gives the counter its memory. Each call to `make_counter()` builds a fresh enclosing environment, so two counters never share state. This is the core mechanism behind R6 classes, memoisation, and most stateful gadgets in R.

</details>

### Exercise 3.3: Speed up a slow function with a memoising closure

**Task:** Write `memoise(f)` that takes a function and returns a closure storing prior `(arg, result)` pairs in a private list. The closure must call `f` once for each unique argument and reuse the cached result thereafter. Save `memoise(sqrt)(16)` to `ex_3_3`, then call the same wrapper on 25 to confirm the cache reuses cleanly.

**Expected result:**

```
#> [1] 4
#> [1] 5
```

**Difficulty:** Advanced

```r title="Your turn"
memoise <- function(f) {
  # your code here
}
fast_sqrt <- memoise(sqrt)
ex_3_3 <- fast_sqrt(16)
ex_3_3
fast_sqrt(25)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
memoise <- function(f) {
  cache <- list()
  function(x) {
    key <- as.character(x)
    if (is.null(cache[[key]])) {
      cache[[key]] <<- f(x)
    }
    cache[[key]]
  }
}
fast_sqrt <- memoise(sqrt)
ex_3_3 <- fast_sqrt(16)
ex_3_3
#> [1] 4
fast_sqrt(25)
#> [1] 5
```

**Explanation:** Memoisation trades memory for speed by caching results, and closures are the natural home for the cache because the environment is private and persists across calls. Using a list keyed by `as.character(x)` is the simplest implementation; for multi-argument functions and richer keys, the `memoise` package on CRAN uses `digest::digest()` to hash the inputs. The trade-off is that the cache grows without bound unless you cap it (an LRU eviction is a typical fix), and the cache key collapses numerically distinct values that share a string representation.

</details>

### Exercise 3.4: Guarantee cleanup of a temporary file using on.exit

**Task:** Write `with_tmpfile(action)` that calls `tempfile()` to get a path, runs `file.create(path)` so the file actually exists, applies `action(path)`, and is guaranteed to delete the file via `on.exit(unlink(path))` even if `action` errors. Use `file.exists` as the action and save the resulting logical to `ex_3_4`.

**Expected result:**

```
#> [1] TRUE
```

**Difficulty:** Advanced

```r title="Your turn"
with_tmpfile <- function(action) {
  # your code here
}
ex_3_4 <- with_tmpfile(file.exists)
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
with_tmpfile <- function(action) {
  path <- tempfile()
  file.create(path)
  on.exit(unlink(path))
  action(path)
}
ex_3_4 <- with_tmpfile(file.exists)
ex_3_4
#> [1] TRUE
```

**Explanation:** `on.exit()` registers an expression to be run when the enclosing function exits, no matter whether it returned normally or threw an error. This is the R idiom for "finally" blocks and is essential for closing database connections, restoring `options()`, releasing file handles, or removing scratch files. Place `on.exit()` immediately after creating the resource so a later error cannot bypass cleanup. By default a second `on.exit()` overwrites the first; use `on.exit(expr, add = TRUE)` to stack handlers.

</details>

## Section 4. Anonymous lambdas and higher-order functions (4 problems)

### Exercise 4.1: Compute column means of mtcars with an anonymous lambda

**Task:** Use `sapply()` together with an anonymous lambda written in the new `\(x) ...` shorthand to compute the mean of every column of the built-in `mtcars` data (all 11 columns are numeric). Save the resulting named numeric vector to `ex_4_1`.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- sapply(mtcars, \(x) mean(x))
ex_4_1
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09063  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Explanation:** Since R 4.1, `\(x) expr` is a backslash shorthand for `function(x) expr`, much like Haskell's `\x -> expr` or Python's `lambda x:`. It is exactly equivalent to writing `function(x) mean(x)` and saves four characters per call site, which adds up when threading anonymous functions through `sapply`, `Map`, `Reduce`, or pipe sequences. A data frame is internally a list of columns, so `sapply()` walks each column. Of course `sapply(mtcars, mean)` works too, since `mean` is already a function and no lambda is required.

</details>

### Exercise 4.2: Keep only numeric columns of iris with a predicate and Filter

**Task:** Use base R's higher-order function `Filter()` with the predicate `is.numeric` to drop the non-numeric `Species` column from the built-in `iris` data, keeping the four measurement columns intact. Save the resulting data.frame to `ex_4_2`.

**Expected result:**

```
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1          5.1         3.5          1.4         0.2
#> 2          4.9         3.0          1.4         0.2
#> 3          4.7         3.2          1.3         0.2
#> # 147 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
head(ex_4_2, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- Filter(is.numeric, iris)
head(ex_4_2, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1          5.1         3.5          1.4         0.2
#> 2          4.9         3.0          1.4         0.2
#> 3          4.7         3.2          1.3         0.2
```

**Explanation:** `Filter(predicate, x)` keeps elements of `x` for which the predicate is `TRUE`. Because data frames are lists of columns, `Filter(is.numeric, iris)` walks each column and keeps the numeric ones. A predicate is any function that returns a logical scalar: `is.character`, `is.factor`, `\(c) length(unique(c)) > 1`. The base sibling `Find()` returns the first matching element, and `Position()` returns its index. These are the same building blocks that show up across functional languages, just spelled with title case in base R.

</details>

### Exercise 4.3: Compose three numeric transforms into one function using Reduce

**Task:** Given the three transforms `\(x) x + 1`, `sqrt`, and `\(x) round(x, 2)`, compose them into a single function `pipeline` that applies them left to right using `Reduce()`. Save `pipeline(15)` to `ex_4_3` and verify on `pipeline(99)`.

**Expected result:**

```
#> [1] 4
#> [1] 10
```

**Difficulty:** Intermediate

```r title="Your turn"
fns <- list(\(x) x + 1, sqrt, \(x) round(x, 2))
pipeline <- function(x) {
  # your code here
}
ex_4_3 <- pipeline(15)
ex_4_3
pipeline(99)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fns <- list(\(x) x + 1, sqrt, \(x) round(x, 2))
pipeline <- function(x) {
  Reduce(\(acc, f) f(acc), fns, init = x)
}
ex_4_3 <- pipeline(15)
ex_4_3
#> [1] 4
pipeline(99)
#> [1] 10
```

**Explanation:** `Reduce(f, x, init)` walks `x` left to right, threading an accumulator through `f(acc, elem)` calls and returning the final accumulator. Setting `init = x` and passing a list of functions turns the reduction into function composition: start with the input value, apply each function in turn. The trace here is 15 to 16 (plus 1), 16 to 4 (square root), 4 to 4 (round). The same idea generalises to fold operations in any functional language. For right-to-left composition, pass `right = TRUE`.

</details>

### Exercise 4.4: Curry a three-argument function into a chain of unary closures

**Task:** Write `curry3(f)` that takes a function `f` of three arguments and returns `function(a) function(b) function(c) f(a, b, c)`. Curry the three-argument `paste` and save the result of `curry3(paste)("R")("is")("functional")` to `ex_4_4`.

**Expected result:**

```
#> [1] "R is functional"
```

**Difficulty:** Advanced

```r title="Your turn"
curry3 <- function(f) {
  # your code here
}
ex_4_4 <- curry3(paste)("R")("is")("functional")
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
curry3 <- function(f) {
  function(a) function(b) function(c) f(a, b, c)
}
ex_4_4 <- curry3(paste)("R")("is")("functional")
ex_4_4
#> [1] "R is functional"
```

**Explanation:** Currying converts an n-argument function into a chain of n one-argument functions, named after Haskell Curry. Each nested closure captures the argument it received and waits for the next one. In R this is rarely written by hand because partial application via `purrr::partial()` or a simple `\(x) f(a, b, x)` is usually clearer, but the exercise pins down what closures actually carry: the chain works because each returned function remembers the values of `a` and `b` in its parent environments long after those parent calls have returned.

</details>

## Section 5. Return values and recursion (3 problems)

### Exercise 5.1: Return mean, median and SD as a single named list

**Task:** Write `describe(x)` that takes a numeric vector and returns a named list with three elements: `mean`, `median`, and `sd`. Returning a list is the R idiom for packing several values out of one call when a single scalar would lose information. Save `describe(mtcars$mpg)` to `ex_5_1`.

**Expected result:**

```
#> $mean
#> [1] 20.09062
#>
#> $median
#> [1] 19.2
#>
#> $sd
#> [1] 6.026948
```

**Difficulty:** Intermediate

```r title="Your turn"
describe <- function(x) {
  # your code here
}
ex_5_1 <- describe(mtcars$mpg)
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
describe <- function(x) {
  list(
    mean   = mean(x),
    median = median(x),
    sd     = sd(x)
  )
}
ex_5_1 <- describe(mtcars$mpg)
ex_5_1
#> $mean
#> [1] 20.09062
#>
#> $median
#> [1] 19.2
#>
#> $sd
#> [1] 6.026948
```

**Explanation:** R functions return exactly one object, so when you need to surface multiple values the conventional answer is a named list, which then unpacks at the call site with `result$mean`. A named numeric vector via `c(mean = mean(x), ...)` is shorter when all values are scalars of the same type, but loses generality once you want to mix types (a vector and a data frame, say). For richer return types, an S3 class like `structure(list(...), class = "describe_result")` gives you a hook for a custom `print` method.

</details>

### Exercise 5.2: Compute factorial recursively with a clear base case

**Task:** Write `fact(n)` that returns `n!` (factorial of `n`) using direct recursion: if `n` is `0` or `1` return `1`, otherwise return `n * fact(n - 1)`. The base case is what stops the recursion from running forever. Save `fact(7)` to `ex_5_2`.

**Expected result:**

```
#> [1] 5040
```

**Difficulty:** Intermediate

```r title="Your turn"
fact <- function(n) {
  # your code here
}
ex_5_2 <- fact(7)
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fact <- function(n) {
  if (n <= 1) 1
  else n * fact(n - 1)
}
ex_5_2 <- fact(7)
ex_5_2
#> [1] 5040
```

**Explanation:** Recursion in R works just like in any other language: a function calls itself with a smaller input until a base case returns directly. The base case here is `n <= 1`, returning `1` for both `0!` and `1!`. R does not optimise tail calls, so deep recursions blow the call stack at depth `options("expressions")`, currently 5000. For factorial specifically the iterative `prod(seq_len(n))` is faster, simpler, and immune to that limit; recursion shines when the structure of the problem is itself recursive, such as walking a tree.

</details>

### Exercise 5.3: Memoise a recursive Fibonacci with a closure-bound cache

**Task:** Build `make_fib()` that returns a closure computing the n-th Fibonacci number recursively, but caches every result in an enclosing environment so repeated calls run in near-constant time. Use `fib(0) = 0` and `fib(1) = 1`. Save the value at `n = 25` to `ex_5_3`.

**Expected result:**

```
#> [1] 75025
```

**Difficulty:** Advanced

```r title="Your turn"
make_fib <- function() {
  # your code here
}
fib <- make_fib()
ex_5_3 <- fib(25)
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_fib <- function() {
  cache <- list()
  fib <- function(n) {
    key <- as.character(n)
    if (!is.null(cache[[key]])) return(cache[[key]])
    val <- if (n < 2) n else fib(n - 1) + fib(n - 2)
    cache[[key]] <<- val
    val
  }
  fib
}
fib <- make_fib()
ex_5_3 <- fib(25)
ex_5_3
#> [1] 75025
```

**Explanation:** The naive recursive Fibonacci is exponential, computing `fib(25)` calls the function more than 200 thousand times. Caching prior results in the enclosing environment with `<<-` makes the recurrence linear in `n` because each `fib(k)` returns from cache after the first call. The closure pattern works because the inner `fib` is named, captured by the surrounding environment, and is what `<<-` writes into. An alternative is the `memoise` package on CRAN, which gives you the same speedup with one wrapper call and richer caches.

</details>

## What to do next

- Revisit the parent tutorial [R Functions](R-Functions.html) for the syntax reference.
- Drill the `case_when` and `switch()` patterns in the [R Control Flow Exercises](R-Control-Flow-Exercises.html).
- Practice the higher-order helpers further in the [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html).
- Build on dots-forwarding inside a tidy pipeline with the [dplyr Exercises in R](dplyr-Exercises-in-R.html).
