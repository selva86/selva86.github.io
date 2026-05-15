---
title: "purrr map2() in R: Iterate Over Two Lists in Parallel"
slug: "purrr-map2-in-R"
description: "Use purrr map2() to apply a function to two lists or vectors in parallel in R. Covers map2_dbl, map2_chr, map2_dfr variants, lambda syntax, and 5 examples."
keywords: "purrr map2, map2 function R, purrr map2 examples, map2_dbl, map2 vs mapply, R iterate two lists, walk2"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr map2|map2()|map2_dbl()|map2_chr()|iterate over two lists"
auto_link_case_sensitive: true
target_keyword: "purrr map2"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr map2() in R: Iterate Over Two Lists in Parallel

<p class="lead">The <code>map2()</code> function in purrr applies a function to two lists or vectors in parallel, stepping through both at the same time. Type-safe variants (<code>map2_dbl</code>, <code>map2_chr</code>, <code>map2_dfr</code>) return a specific atomic type or a data frame instead of a list.</p>

[QUICK ANSWER]
map2(a, b, ~ .x + .y)              # list output
map2_dbl(a, b, ~ .x + .y)          # numeric vector
map2_chr(nm, val, paste)           # character vector
map2_lgl(a, b, ~ .x > .y)          # logical vector
map2_dfr(a, b, make_row)           # row-bind to data frame
map2(a, b, fn, na.rm = TRUE)       # extra args after .f
walk2(paths, data, write.csv)      # side effects, no return

[DECISION TREE: Is map2() the right tool?]
- two inputs in lockstep: map2(a, b, ~ .x + .y)
- only one input: map(a, ~ .x * 2)
- three or more inputs: pmap(list(a, b, c), sum)
- two inputs, side effects only: walk2(a, b, fn)
- two inputs, running total: reduce2(a, b, fn)
- one input plus its index: imap(a, ~ .y)

## What map2() does in one sentence

**`map2(.x, .y, .f)` calls `.f` once per pair of elements drawn from `.x` and `.y`, returning a list.** Element `i` of the result is `.f(.x[[i]], .y[[i]])`, so both inputs must have the same length.

While `map()` walks a single input, `map2()` walks two inputs in lockstep. This is the tool you reach for when a calculation needs one value from each of two collections: a name and a score, a numerator and a denominator, a file path and the data to write to it.

## Syntax

**`map2(.x, .y, .f, ...)`. `.x` and `.y` are the two inputs; `.f` is the function or lambda; `...` holds extra arguments passed to `.f`.**

Inside a purrr lambda, `.x` refers to the current element of the first input and `.y` to the current element of the second. The two inputs must be the same length, although a length-1 input is recycled.

```r title="Add two vectors element by element"
library(purrr)

map2(1:3, 4:6, ~ .x + .y)
#> [[1]]
#> [1] 5
#> [[2]]
#> [1] 7
#> [[3]]
#> [1] 9

map2_dbl(1:3, 4:6, ~ .x + .y)
#> [1] 5 7 9
```

[TIP]
**Reach for a `map2_*()` variant whenever you know the output type.** `map2_dbl()` returns a numeric vector and errors if any call returns a non-numeric, which catches bugs early. Use plain `map2()` only when results are mixed types or genuinely need to stay a list.

## Five common patterns

### 1. Plain map2 (list output)

**`map2()` with no suffix always returns a list, one element per pair.** Use it when each call produces something that does not flatten cleanly, such as a vector or a model object.

```r title="Pairwise list output"
map2(c(1, 2, 3), c(10, 20, 30), ~ c(.x, .y))
#> [[1]]
#> [1]  1 10
#> [[2]]
#> [1]  2 20
#> [[3]]
#> [1]  3 30
```

Each call returns a length-2 vector, so a list is the only sensible container.

### 2. Type-safe numeric output

**`map2_dbl()` divides, scales, or combines two numeric inputs into a clean numeric vector.** This is the most common map2 variant in day-to-day analysis.

```r title="Divide miles per gallon by weight"
mpg <- mtcars$mpg[1:4]
wt  <- mtcars$wt[1:4]

map2_dbl(mpg, wt, ~ .x / .y)
#> [1] 8.015267 7.304348 7.091757 6.656299
```

`.x` is each mpg value and `.y` is the matching weight, so element `i` is `mpg[i] / wt[i]`.

### 3. Build strings from two vectors

**`map2_chr()` glues a value from each input into one string per pair.** It is the parallel-iteration answer to pasting two vectors together.

```r title="Combine names and scores"
students <- c("Alice", "Bob", "Carol")
scores   <- c(88, 92, 79)

map2_chr(students, scores, ~ paste0(.x, " scored ", .y))
#> [1] "Alice scored 88" "Bob scored 92"   "Carol scored 79"
```

### 4. Combine results into a data frame

**`map2_dfr()` calls a function that returns a data frame, then row-binds every result.** This builds one tidy table from two parallel inputs.

```r title="Row-bind a data frame per pair"
make_row <- function(name, n) {
  data.frame(group = name, total = n * 10)
}

map2_dfr(c("x", "y", "z"), c(1, 2, 3), make_row)
#>   group total
#> 1     x    10
#> 2     y    20
#> 3     z    30
```

### 5. Pass extra arguments after the function

**Anything after `.f` is forwarded to every call.** Here `round()` receives `.x` and `.y` as its first two arguments, with no lambda needed.

```r title="Round each number to a paired digit count"
map2_dbl(c(3.14159, 2.71828), c(2, 4), round)
#> [1] 3.1400 2.7183
```

[KEY INSIGHT]
**`map2()` is `map()` with a second synchronized cursor, not a nested loop.** It does not pair every element of `.x` with every element of `.y`. It pairs position 1 with position 1, position 2 with position 2, and so on. For an all-combinations grid, use `tidyr::crossing()` first, then `map2()` over the expanded columns.

## map2() vs Map() vs mapply()

**Three R functions iterate over two inputs in parallel, with different output guarantees.** `map2()` adds type safety and lambda syntax on top of what base R already offers.

| Function | Package | Output | Type-safe |
|---|---|---|---|
| `Map()` | base | List | No |
| `mapply()` | base | Vector or matrix or list (auto) | No |
| `map2()` | purrr | List | No |
| `map2_dbl()` and friends | purrr | Type-strict atomic vector | Yes |

`map2()` behaves like `Map()` with cleaner lambda syntax. The real advantage is the typed `map2_*()` family: you declare the output type up front, and a wrong return value raises an error instead of silently collapsing to a list or simplifying unpredictably like `mapply()`.

[NOTE]
**Coming from Python?** The closest equivalent of `map2(a, b, f)` is `[f(x, y) for x, y in zip(a, b)]` or `list(map(f, a, b))`. Both iterate two sequences in lockstep, exactly as map2 does.

## Common pitfalls

**Pitfall 1: inputs of different lengths.** `map2()` requires `.x` and `.y` to have the same length, except when one has length 1. `map2(1:3, 1:2, ~ .x + .y)` raises an error because purrr cannot recycle a length-3 input to match a length-2 input.

**Pitfall 2: forgetting the type suffix.** `map2(a, b, ~ .x + .y)` returns a list. For a numeric vector, use `map2_dbl()`. For text, use `map2_chr()`. The bare `map2()` never simplifies on its own.

**Pitfall 3: swapping `.x` and `.y`.** The first argument fills `.x` and the second fills `.y`. In `map2_dbl(mpg, wt, ~ .x / .y)`, reversing the inputs computes weight over mileage instead. Order matters.

## Try it yourself

**Try it:** Use `map2_chr` to label each car. Combine `rownames(mtcars)[1:3]` with `mtcars$cyl[1:3]` into strings like `"Mazda RX4 has 6 cylinders"`. Save the result to `ex_labels`.

```r title="Your turn: label cars with map2"
# Try it: map2_chr over names and cylinder counts
ex_labels <- # your code here

ex_labels
#> Expected: 3 strings naming each car and its cylinder count
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_labels <- map2_chr(
  rownames(mtcars)[1:3],
  mtcars$cyl[1:3],
  ~ paste0(.x, " has ", .y, " cylinders")
)
ex_labels
#> [1] "Mazda RX4 has 6 cylinders"     "Mazda RX4 Wag has 6 cylinders"
#> [3] "Datsun 710 has 4 cylinders"
```

**Explanation:** `map2_chr()` walks the car names and cylinder counts together. For each pair, the lambda pastes `.x` (the name) and `.y` (the count) into one sentence, and the `_chr` suffix returns a character vector.

</details>

## Related purrr functions

After map2, these functions cover the rest of multi-input iteration:

- `map2_dbl()`, `map2_chr()`, `map2_lgl()`, `map2_int()`: type-safe variants
- `map2_dfr()`, `map2_dfc()`: combine results into a data frame
- `pmap()` and `pmap_dbl()`: iterate over three or more inputs from a list
- `walk2()`: run a two-input function for side effects, returning the input invisibly
- `imap()`: iterate over one input plus its index or names
- `reduce2()`: fold two inputs into a single accumulated value

The base R counterparts are `Map()` and `mapply()` for projects that avoid the tidyverse. The official argument reference lives in the [purrr map2 documentation](https://purrr.tidyverse.org/reference/map2.html).

## FAQ

**What is the difference between map and map2 in purrr?**

`map()` iterates over a single input and exposes each element as `.x`. `map2()` iterates over two inputs in parallel, exposing them as `.x` and `.y`. Use `map()` when a calculation needs one value at a time, and `map2()` when each step needs a matching value from two collections, such as a name and a score. For three or more inputs, switch to `pmap()`.

**How do I use map2 with more than two inputs?**

`map2()` is limited to exactly two inputs. For three or more, use `pmap()`, which takes a single list of inputs: `pmap(list(a, b, c), function(x, y, z) x + y + z)`. Inside a pmap lambda you can also refer to inputs positionally as `..1`, `..2`, and `..3`. The typed `pmap_dbl()` and `pmap_chr()` variants work the same way.

**What does map2_dbl do?**

`map2_dbl()` applies a function to two inputs in parallel and returns a numeric vector instead of a list. Every call must return a single numeric value, otherwise purrr raises an error. It is the type-safe choice for pairwise arithmetic like division, weighted sums, or scaling one vector by another.

**Why does map2 give an error about lengths?**

`map2()` requires both inputs to be the same length, or one of them to have length 1 so it can be recycled. An error such as "Can't recycle" means `.x` and `.y` have different, incompatible lengths. Check both inputs with `length()` and fix the mismatch before calling map2.

**Can I use named arguments with map2?**

Yes. Any argument you pass after `.f` is forwarded to every call. For example, `map2_dbl(x, y, fn, na.rm = TRUE)` passes `na.rm = TRUE` into each invocation of `fn`. This keeps the lambda short when the extra argument is constant across all pairs.
