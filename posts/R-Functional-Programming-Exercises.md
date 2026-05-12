---
title: "Functional Programming R Exercises: 18 Practice Problems"
slug: "R-Functional-Programming-Exercises"
description: "Functional programming R exercises with solutions: 18 hands-on problems on higher-order functions, map, reduce, closures, function factories, and purrr."
keywords: "functional programming R exercises, purrr exercises, higher-order functions R, closures R, map reduce R, function factories R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Functional Programming Exercises"
sidebar_order: 150
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "functional programming exercises|higher-order functions in r|purrr exercises|closures in r|map and reduce in r"
auto_link_case_sensitive: false
target_keyword: "functional programming R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Functional Programming R Exercises: 18 Practice Problems

<p class="lead">Eighteen runnable practice problems on functional programming in R, covering higher-order functions, the apply and map families, Reduce, closures, function factories, composition, partial application, and recursion. Solutions are hidden behind a reveal so you can solve before peeking.</p>

Run the setup block once before attempting any exercise. Each problem is self-contained and assigns its result to `ex_N_M`, so you can check your answer side-by-side with the printed expected output.

```r title="Run this once before any exercise"
library(purrr)
library(dplyr)
```

## Section 1. First-class and higher-order functions (3 problems)

### Exercise 1.1: Type-check a mixed list with sapply

**Task:** A code reviewer is auditing type-safety in a script and needs the class of every element in a heterogeneous list. Use base R `sapply()` to apply `class()` across each element of `list(a = c(1.5, 2.5), b = "hi", c = TRUE)`. The result should be a named character vector. Save it to `ex_1_1`.

**Expected result:**

```
#>           a           b           c
#>   "numeric" "character"   "logical"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- sapply(list(a = c(1.5, 2.5), b = "hi", c = TRUE), class)
ex_1_1
#>           a           b           c
#>   "numeric" "character"   "logical"
```

**Explanation:** `sapply()` treats a function as a value: you pass `class` (no parentheses) and it gets invoked on each list element. Because every result is a length-one character, `sapply()` simplifies the output to a named vector instead of returning a list. If you wanted to preserve list shape, `lapply()` is the safer choice and `vapply(lst, class, character(1))` is the strictest.

</details>

### Exercise 1.2: Return a function from a function

**Task:** A finance team analyst wants a reusable currency-formatter generator. Write `make_formatter(prefix)` that returns a single-argument function which pastes `prefix` and a number rounded to two decimals. Use the returned function to format `1234.5678` with prefix `"$"` and save the resulting string to `ex_1_2`.

**Expected result:**

```
#> [1] "$1234.57"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_formatter <- function(prefix) {
  function(x) paste0(prefix, format(round(x, 2), nsmall = 2))
}
dollar <- make_formatter("$")
ex_1_2 <- dollar(1234.5678)
ex_1_2
#> [1] "$1234.57"
```

**Explanation:** Returning a function turns `prefix` into part of the inner function's enclosing environment. That captured value persists for every later call, which is the essence of a closure. The same pattern produces `euro <- make_formatter("EUR ")` for free, with no copy-paste. `format(..., nsmall = 2)` keeps trailing zeros (so `12.50` does not collapse to `12.5`).

</details>

### Exercise 1.3: Anonymous functions with the backslash shorthand

**Task:** Use the base R `\(x) ...` anonymous function shorthand together with `sapply()` to compute the cube of each integer from 1 to 6. The result should simplify to a numeric vector of length six. Save it to `ex_1_3`.

**Expected result:**

```
#> [1]   1   8  27  64 125 216
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- sapply(1:6, \(x) x^3)
ex_1_3
#> [1]   1   8  27  64 125 216
```

**Explanation:** The `\(x)` lambda syntax (added in R 4.1) is identical to `function(x)` but two characters cheaper, which matters when you have many short callbacks. Use it for one-off helpers you would not reuse: anything you would name (like `cube`) deserves a top-level `function()` binding so it shows up in stack traces.

</details>

## Section 2. The map family in base R and purrr (4 problems)

### Exercise 2.1: One-line column audit with sapply over mtcars

**Task:** A reporting analyst wants a quick audit of every numeric column in `mtcars`. Use `sapply()` to compute the median of each column. Because all 11 columns are numeric and length-32, the result should simplify to a named numeric vector. Save it to `ex_2_1`.

**Expected result:**

```
#>     mpg     cyl    disp      hp    drat      wt    qsec      vs      am    gear    carb
#>  19.200   6.000 196.300 123.000   3.695   3.325  17.710   0.000   0.000   4.000   2.000
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- sapply(mtcars, median)
ex_2_1
#>     mpg     cyl    disp      hp    drat      wt    qsec      vs      am    gear    carb
#>  19.200   6.000 196.300 123.000   3.695   3.325  17.710   0.000   0.000   4.000   2.000
```

**Explanation:** A data frame is internally a list of columns, so `sapply()` iterates column-by-column. Because the per-column result is always a single numeric value, the output collapses to a named vector. For type-stable production code prefer `vapply(mtcars, median, numeric(1))`: if any column ever returns something unexpected, `vapply()` fails loudly instead of silently switching to a list.

</details>

### Exercise 2.2: Column maxima with purrr map_dbl handling NAs

**Task:** A platform engineer is profiling a daily data export and needs the maximum value of each column in `airquality`, several of which contain `NA`. Use `purrr::map_dbl()` together with an anonymous function that passes `na.rm = TRUE` to `max()`. Save the resulting named numeric vector to `ex_2_2`.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>   168.0   334.0    20.7    97.0     9.0    31.0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- map_dbl(airquality, \(col) max(col, na.rm = TRUE))
ex_2_2
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>   168.0   334.0    20.7    97.0     9.0    31.0
```

**Explanation:** `map_dbl()` is the type-stable variant of `map()`: it guarantees a double vector or errors at the first non-numeric result. The `\(col)` lambda is needed only because `max()` takes the extra `na.rm` argument; for the bare `max` case `map_dbl(airquality, max)` would also work but would return `NA` for any column containing missing values.

</details>

### Exercise 2.3: Walk paired vectors with map2_dbl

**Task:** The growth team has paired before/after revenue figures for three campaigns and wants the percent change per campaign. Given `before <- c(100, 120, 80)` and `after <- c(140, 110, 95)`, use `map2_dbl()` to compute `(after - before) / before * 100`. Save the numeric vector to `ex_2_3`.

**Expected result:**

```
#> [1]  40.00000  -8.33333  18.75000
```

**Difficulty:** Intermediate

```r title="Your turn"
before <- c(100, 120, 80)
after  <- c(140, 110, 95)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
before <- c(100, 120, 80)
after  <- c(140, 110, 95)
ex_2_3 <- map2_dbl(before, after, \(b, a) (a - b) / b * 100)
ex_2_3
#> [1]  40.00000  -8.33333  18.75000
```

**Explanation:** `map2_*()` is the right call when two inputs must move in lockstep: it errors if the vectors differ in length, which would mask a bug if you used vectorised arithmetic alone. For three or more parallel inputs you would graduate to `pmap_dbl()` and pass a list. The plain vectorised form `(after - before) / before * 100` works here too, but `map2_dbl()` makes the iteration explicit.

</details>

### Exercise 2.4: Total price across many parallel vectors with pmap_dbl

**Task:** A pricing analyst has three parallel vectors describing line items: `qty <- c(2, 5, 1, 4)`, `unit_price <- c(9.99, 4.50, 19.95, 12.00)`, and `tax_rate <- c(0.08, 0.08, 0.0, 0.10)`. Use `pmap_dbl()` to compute the per-line total `qty * unit_price * (1 + tax_rate)`. Save the numeric vector to `ex_2_4`.

**Expected result:**

```
#> [1] 21.5784 24.3000 19.9500 52.8000
```

**Difficulty:** Intermediate

```r title="Your turn"
qty        <- c(2, 5, 1, 4)
unit_price <- c(9.99, 4.50, 19.95, 12.00)
tax_rate   <- c(0.08, 0.08, 0.0, 0.10)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
qty        <- c(2, 5, 1, 4)
unit_price <- c(9.99, 4.50, 19.95, 12.00)
tax_rate   <- c(0.08, 0.08, 0.0, 0.10)
ex_2_4 <- pmap_dbl(list(qty, unit_price, tax_rate),
                   \(q, p, t) q * p * (1 + t))
ex_2_4
#> [1] 21.5784 24.3000 19.9500 52.8000
```

**Explanation:** `pmap_*()` takes a single list of equal-length vectors and binds the i-th element of each to the lambda's positional arguments. It scales to any number of inputs, unlike `map2_*()`. A common alternative is to bind columns into a tibble and call `pmap_dbl(df, \(q, p, t) ...)`: the column names then become the parameter names, which reads cleanly when the vectors have meaningful labels.

</details>

## Section 3. Reduce and accumulate (3 problems)

### Exercise 3.1: Intersect three customer lists with Reduce

**Task:** An audit team has three customer-ID vectors pulled from three different systems and needs the IDs present in all three. Given `lst <- list(c(1,2,3,4,5), c(2,3,5,7,8), c(2,3,5,9))`, apply base R `Reduce()` with `intersect` to compute the common IDs. Save the resulting numeric vector to `ex_3_1`.

**Expected result:**

```
#> [1] 2 3 5
```

**Difficulty:** Intermediate

```r title="Your turn"
lst <- list(c(1,2,3,4,5), c(2,3,5,7,8), c(2,3,5,9))
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lst <- list(c(1,2,3,4,5), c(2,3,5,7,8), c(2,3,5,9))
ex_3_1 <- Reduce(intersect, lst)
ex_3_1
#> [1] 2 3 5
```

**Explanation:** `Reduce()` collapses a list by folding a binary function pairwise: it computes `intersect(lst[[1]], lst[[2]])` first, then intersects the result with `lst[[3]]`. This generalises to N lists with zero loop code. The pattern works for any associative binary op: `Reduce(union, ...)`, `Reduce("+", ...)`, `Reduce(merge, list_of_dfs)`, and so on.

</details>

### Exercise 3.2: Compounded wealth multiplier with accumulate

**Task:** A finance team analyst needs the cumulative compounded return factor after each period for a series of period returns. Given `r <- c(0.05, -0.02, 0.03, 0.01)`, use `purrr::accumulate()` with the binary function `\(acc, x) acc * (1 + x)` and `.init = 1` so the result includes the starting wealth of 1. Save the numeric vector to `ex_3_2`.

**Expected result:**

```
#> [1] 1.000000 1.050000 1.029000 1.059870 1.070469
```

**Difficulty:** Advanced

```r title="Your turn"
r <- c(0.05, -0.02, 0.03, 0.01)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
r <- c(0.05, -0.02, 0.03, 0.01)
ex_3_2 <- accumulate(r, \(acc, x) acc * (1 + x), .init = 1)
ex_3_2
#> [1] 1.000000 1.050000 1.029000 1.059870 1.070469
```

**Explanation:** Where `reduce()` keeps only the final value, `accumulate()` returns every intermediate state, which is exactly what cumulative wealth or running totals require. The `.init = 1` argument seeds the fold with a starting wealth, so the output has length five for an input of four returns. A vectorised shortcut for this specific case is `cumprod(1 + r)`, but the accumulate form generalises to any non-trivial state update rule.

</details>

### Exercise 3.3: Right-associative subtraction with Reduce(right = TRUE)

**Task:** A code reviewer wants to demonstrate operator associativity by reducing the binary subtraction operator from right to left across the vector `c(10, 4, 2, 1)`. Use base R `Reduce()` with `right = TRUE` so the computation becomes `10 - (4 - (2 - 1))`. Save the integer result to `ex_3_3`.

**Expected result:**

```
#> [1] 7
#> # equivalent to: 10 - (4 - (2 - 1))
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- Reduce("-", c(10, 4, 2, 1), right = TRUE)
ex_3_3
#> [1] 7
```

**Explanation:** Subtraction is not associative: left-to-right gives `((10 - 4) - 2) - 1 = 3`, but `right = TRUE` evaluates `2 - 1 = 1` first, then `4 - 1 = 3`, then `10 - 3 = 7`. The same flag matters for any non-associative op (division, string concatenation order). It is also faster than building the expression manually with `do.call()` because Reduce avoids intermediate allocations.

</details>

## Section 4. Filter, keep, and discard (2 problems)

### Exercise 4.1: Keep only the numeric elements of a mixed list

**Task:** A data engineer is profiling a mixed list of column-summary objects and needs only the numeric ones for further math. Given `lst <- list(1, "two", 3, "four", 5)`, use `purrr::keep()` with the predicate `is.numeric` to retain only the numeric elements. Save the filtered list (not a vector) to `ex_4_1`.

**Expected result:**

```
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 3
#>
#> [[3]]
#> [1] 5
```

**Difficulty:** Beginner

```r title="Your turn"
lst <- list(1, "two", 3, "four", 5)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lst <- list(1, "two", 3, "four", 5)
ex_4_1 <- keep(lst, is.numeric)
ex_4_1
#> [[1]]
#> [1] 1
#>
#> [[2]]
#> [1] 3
#>
#> [[3]]
#> [1] 5
```

**Explanation:** `keep()` and `discard()` are the inverse of each other and accept any predicate that returns a logical scalar per element. They preserve the input container shape: a list in, a list out, so you can still feed the result into another `map()`. The base R equivalent is `Filter(is.numeric, lst)`, which behaves identically and ships with every R install.

</details>

### Exercise 4.2: Discard short campaign names with a custom predicate

**Task:** A marketing analyst is cleaning campaign names and wants to drop any name with fewer than five characters. Given `names <- c("spring", "ad", "summer-sale", "fy", "winter-promo")`, use `purrr::discard()` with predicate `\(x) nchar(x) < 5` to remove the short names. Save the surviving character vector to `ex_4_2`.

**Expected result:**

```
#> [1] "spring"       "summer-sale"  "winter-promo"
```

**Difficulty:** Intermediate

```r title="Your turn"
names <- c("spring", "ad", "summer-sale", "fy", "winter-promo")
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
names <- c("spring", "ad", "summer-sale", "fy", "winter-promo")
ex_4_2 <- discard(names, \(x) nchar(x) < 5)
ex_4_2
#> [1] "spring"       "summer-sale"  "winter-promo"
```

**Explanation:** A predicate is just a function returning `TRUE` or `FALSE` per element. Here the lambda `\(x) nchar(x) < 5` works on each string. The vectorised base alternative is `names[nchar(names) >= 5]`, which is faster on large vectors but less composable if you later chain through a pipeline of `keep()` / `discard()` / `map()` steps with mixed predicates.

</details>

## Section 5. Closures and function factories (3 problems)

### Exercise 5.1: A counter that remembers its state across calls

**Task:** A junior analyst is learning R's environment model and wants a counter that remembers state between calls. Write `make_counter()` that returns a function which increments a private counter starting at zero and returns the new value. Call the returned counter three times and save the third returned value to `ex_5_1`.

**Expected result:**

```
#> [1] 3
#> # counter has been called three times
```

**Difficulty:** Intermediate

```r title="Your turn"
make_counter <- function() {
  # your code here
}
counter <- make_counter()
counter(); counter()
ex_5_1 <- counter()
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
make_counter <- function() {
  count <- 0
  function() {
    count <<- count + 1
    count
  }
}
counter <- make_counter()
counter(); counter()
ex_5_1 <- counter()
ex_5_1
#> [1] 3
```

**Explanation:** The `<<-` super-assignment writes to `count` in the enclosing function's environment instead of creating a new local binding. That captured environment is what makes the counter persist between calls. Each call to `make_counter()` produces an independent counter with its own private state, which is the closure idiom for object-without-class encapsulation.

</details>

### Exercise 5.2: Power-of-N function factory

**Task:** A statistician wants a small family of monomial functions for hand-crafted polynomial features. Write `power(n)` that returns a function which raises its argument to the `n`-th power. Use it to build a cubing function called `cube`, apply it to the value `4`, and save the numeric result to `ex_5_2`.

**Expected result:**

```
#> [1] 64
#> # cube(4) is 4 raised to the 3rd power
```

**Difficulty:** Intermediate

```r title="Your turn"
power <- function(n) {
  # your code here
}
cube <- power(3)
ex_5_2 <- cube(4)
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
power <- function(n) {
  function(x) x^n
}
cube <- power(3)
ex_5_2 <- cube(4)
ex_5_2
#> [1] 64
```

**Explanation:** Function factories let you parameterise a family of functions with shared logic. `square <- power(2)`, `cube <- power(3)`, and `quartic <- power(4)` all share one definition. The risk is lazy evaluation: if `n` were itself a complex expression, it would not be evaluated until the inner function is called. Use `force(n)` inside the factory if you build many factories in a loop to lock in the value early.

</details>

### Exercise 5.3: Memoized Fibonacci with a closure-private cache

**Task:** An ops engineer is benchmarking recursive computations and wants a memoized Fibonacci that caches previously seen values in a closure-private environment. Write `memo_fib()` that returns a function computing `fib(n)` and caching every result it computes. Use the returned function to compute `fib(20)` and save the integer result to `ex_5_3`.

**Expected result:**

```
#> [1] 6765
```

**Difficulty:** Advanced

```r title="Your turn"
memo_fib <- function() {
  # your code here
}
fib <- memo_fib()
ex_5_3 <- fib(20)
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
memo_fib <- function() {
  cache <- c(0, 1)
  function(n) {
    if (n + 1 <= length(cache)) return(cache[n + 1])
    val <- Recall(n - 1) + Recall(n - 2)
    cache[n + 1] <<- val
    val
  }
}
fib <- memo_fib()
ex_5_3 <- fib(20)
ex_5_3
#> [1] 6765
```

**Explanation:** The naive recursive Fibonacci recomputes the same subproblems exponentially many times. Storing results in a closure-private `cache` reduces it to linear work. `Recall()` refers to the currently executing function, which is robust to renaming the returned function later. The `<<-` writes the new value into the enclosing environment so the next call sees the updated cache.

</details>

## Section 6. Composition, partial application, and recursion (3 problems)

### Exercise 6.1: Compose round-and-stringify into one function

**Task:** A data engineer wants a one-step "round to two decimals, then stringify" formatter. Use `purrr::compose()` (which applies functions right-to-left by default) to combine `\(x) round(x, 2)` and `as.character` into a single function. Apply it to `3.14159` and save the resulting character string to `ex_6_1`.

**Expected result:**

```
#> [1] "3.14"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fmt <- compose(as.character, \(x) round(x, 2))
ex_6_1 <- fmt(3.14159)
ex_6_1
#> [1] "3.14"
```

**Explanation:** `compose(f, g)` returns a new function equivalent to `function(x) f(g(x))`: rightmost arg runs first. Composition is useful when you want to pass a single pre-built pipeline as a callback to `map()` or `apply()` without redefining the lambda each time. Pass `.dir = "forward"` if you prefer left-to-right reading order, which mirrors the magrittr pipe.

</details>

### Exercise 6.2: Partial application baking in na.rm = TRUE

**Task:** A reporting analyst always wants to drop missing values when summarising columns and is tired of typing `na.rm = TRUE` everywhere. Use `purrr::partial()` to create `mean_na` from `mean` with `na.rm = TRUE` pre-baked. Apply `mean_na` to `c(1, 2, NA, 4, 5)` and save the numeric result to `ex_6_2`.

**Expected result:**

```
#> [1] 3
#> # NA dropped, mean of c(1, 2, 4, 5)
```

**Difficulty:** Intermediate

```r title="Your turn"
mean_na <- # your code here
ex_6_2 <- mean_na(c(1, 2, NA, 4, 5))
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mean_na <- partial(mean, na.rm = TRUE)
ex_6_2 <- mean_na(c(1, 2, NA, 4, 5))
ex_6_2
#> [1] 3
```

**Explanation:** `partial()` fixes a subset of arguments and returns a new function awaiting the rest. It is the canonical way to remove keyword-argument boilerplate from callbacks: `map_dbl(df, mean_na)` reads cleaner than `map_dbl(df, \(x) mean(x, na.rm = TRUE))`. Internally `partial()` constructs a function whose default args are the pre-supplied values, so call-site overrides still work.

</details>

### Exercise 6.3: Recursive sum with an accumulator argument

**Task:** A hackathon participant wants to implement summation recursively to practice functional thinking and tail-call style. Write `rec_sum(x, acc = 0)` that recursively sums a numeric vector by peeling off the first element each call and adding it to the running accumulator. Apply it to `1:100` and save the integer result to `ex_6_3`.

**Expected result:**

```
#> [1] 5050
```

**Difficulty:** Advanced

```r title="Your turn"
rec_sum <- function(x, acc = 0) {
  # your code here
}
ex_6_3 <- rec_sum(1:100)
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rec_sum <- function(x, acc = 0) {
  if (length(x) == 0) return(acc)
  rec_sum(x[-1], acc + x[1])
}
ex_6_3 <- rec_sum(1:100)
ex_6_3
#> [1] 5050
```

**Explanation:** The accumulator pattern turns recursion into a tail call (the recursive call is the final operation), which is the functional alternative to a `for` loop with a running total. R does not actually optimise tail calls, so this version will hit the default stack limit around `1:5000`. For real work prefer the vectorised `sum(x)`: the recursive form is here to illustrate the structure, not to replace base arithmetic.

</details>

## What to do next

- Read the parent guide at [Functional Programming in R](Functional-Programming-in-R.html) for deeper theory on first-class functions, closures, and composition.
- For more apply-family drills move on to [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html).
- For data-wrangling practice that uses these patterns at scale try [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- If you want a workflow-oriented sequel, the [purrr Exercises in R](purrr-Exercises-in-R.html) hub focuses specifically on the tidyverse map family.
