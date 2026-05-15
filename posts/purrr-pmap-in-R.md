---
title: "purrr pmap() in R: Iterate Over Many Lists in Parallel"
slug: "purrr-pmap-in-R"
description: "Use purrr pmap() to apply a function to several lists or data frame rows in parallel in R. Covers pmap_dbl, pmap_chr, pmap_dfr, and 5 worked examples."
keywords: "purrr pmap, pmap function R, purrr pmap examples, pmap_dbl, pmap vs map2, pmap data frame rows, pwalk"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr pmap|pmap()|pmap_dbl()|pmap_dfr()|iterate over data frame rows"
auto_link_case_sensitive: true
target_keyword: "purrr pmap"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr pmap() in R: Iterate Over Many Lists in Parallel

<p class="lead">The <code>pmap()</code> function in purrr applies a function to any number of lists, vectors, or data frame columns in parallel, stepping through all of them at once. Type-safe variants (<code>pmap_dbl</code>, <code>pmap_chr</code>, <code>pmap_dfr</code>) return a specific atomic type or a data frame instead of a list.</p>

[QUICK ANSWER]
pmap(list(a, b, c), ~ ..1 + ..2 + ..3)   # list output
pmap_dbl(list(a, b), ~ ..1 * ..2)        # numeric vector
pmap_chr(df, paste)                      # character vector
pmap(df, function(x, y) x + y)           # named args from columns
pmap_dfr(list(a, b), make_row)           # row-bind to data frame
pmap(list(a, b), fn, na.rm = TRUE)       # extra args after .f
pwalk(list(paths, data), write.csv)      # side effects, no return

[DECISION TREE: Is pmap() the right tool?]
- three or more inputs in lockstep: pmap(list(a, b, c), fn)
- iterate over data frame rows: pmap(df, fn)
- exactly one input: map(a, fn)
- exactly two inputs: map2(a, b, fn)
- many inputs, side effects only: pwalk(list(a, b), fn)
- one input plus its index: imap(a, fn)

## What pmap() does in one sentence

**`pmap(.l, .f)` calls `.f` once per position, drawing one element from every list inside `.l`.** Element `i` of the result is `.f` applied to the `i`-th element of each input, so all inputs must have the same length.

While `map()` walks one input and `map2()` walks two, `pmap()` walks any number of inputs in lockstep. You pass them as a single list, which is why `pmap()` has no fixed limit on input count. A data frame is itself a list of equal-length columns, so `pmap()` over a data frame iterates row by row.

## Syntax

**`pmap(.l, .f, ...)`. `.l` is a list of inputs, `.f` is the function or lambda, and `...` holds extra arguments passed to `.f`.**

Inside a purrr lambda, refer to inputs positionally as `..1`, `..2`, `..3`, and so on. If `.l` has named elements, you can instead write a function whose argument names match those names. Every list element in `.l` must have the same length.

```r title="Sum three vectors in parallel"
library(purrr)

pmap(list(1:3, 4:6, 7:9), ~ ..1 + ..2 + ..3)
#> [[1]]
#> [1] 12
#> [[2]]
#> [1] 15
#> [[3]]
#> [1] 18

pmap_dbl(list(1:3, 4:6, 7:9), ~ ..1 + ..2 + ..3)
#> [1] 12 15 18
```

[TIP]
**Reach for a `pmap_*()` variant whenever you know the output type.** `pmap_dbl()` returns a numeric vector and errors if any call returns a non-numeric value, which catches bugs early. Use plain `pmap()` only when results are mixed types or genuinely need to stay a list.

## Five common patterns

### 1. Plain pmap (list output)

**`pmap()` with no suffix always returns a list, one element per position.** Use it when each call produces something that does not flatten cleanly, such as a vector or a model object.

```r title="Combine three inputs into vectors"
pmap(list(c(1, 2), c(10, 20), c(100, 200)), ~ c(..1, ..2, ..3))
#> [[1]]
#> [1]   1  10 100
#> [[2]]
#> [1]   2  20 200
```

Each call returns a length-3 vector, so a list is the only sensible container.

### 2. Type-safe numeric output

**`pmap_dbl()` combines several numeric inputs into one clean numeric vector.** Declaring the output type up front turns a wrong return value into an immediate error instead of a silent list.

```r title="Weighted sum of three inputs"
base   <- c(2, 4, 6)
bonus  <- c(1, 1, 1)
weight <- c(0.5, 0.25, 0.1)

pmap_dbl(list(base, bonus, weight), ~ (..1 + ..2) * ..3)
#> [1] 1.50 1.25 0.70
```

`..1` is each base value, `..2` each bonus, and `..3` each weight, so element `i` is `(base[i] + bonus[i]) * weight[i]`.

### 3. Iterate over data frame rows

**Pass a data frame as `.l` and `pmap()` walks it one row at a time.** Each column becomes an argument, matched by name to your function's parameters.

```r title="Iterate over data frame rows"
df <- data.frame(
  amount = c(10, 20, 30),
  rate   = c(0.1, 0.2, 0.3)
)

pmap_dbl(df, function(amount, rate) amount * (1 + rate))
#> [1] 11 24 39
```

The argument names `amount` and `rate` match the column names, so purrr passes each row's values into the right slots.

[KEY INSIGHT]
**A data frame is a list of equal-length columns, so `pmap()` over a data frame is row-wise iteration for free.** This is the cleanest base-tidyverse answer to "apply a function to every row." No `apply()`, no `rowwise()`, no manual indexing: name your function's arguments after the columns and let purrr do the matching.

### 4. Build strings from several columns

**`pmap_chr()` glues one value from each input into a single string per position.** It is the multi-input version of pasting columns together.

```r title="Build a label per row"
people <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  age  = c(30, 25, 41)
)

pmap_chr(people, function(name, age) paste0(name, " is ", age))
#> [1] "Alice is 30" "Bob is 25"   "Carol is 41"
```

### 5. Combine results into a data frame

**`pmap_dfr()` calls a function that returns a data frame, then row-binds every result.** This builds one tidy table from several parallel inputs.

```r title="Row-bind a data frame per call"
make_row <- function(id, n) {
  data.frame(group = id, total = n * 100)
}

pmap_dfr(list(c("x", "y", "z"), c(1, 2, 3)), make_row)
#>   group total
#> 1     x   100
#> 2     y   200
#> 3     z   300
```

## pmap() vs map2() vs mapply()

**Three families iterate over several inputs in parallel, with different input limits and output guarantees.** `pmap()` is the only one with no cap on input count.

| Function | Inputs | Package | Output |
|---|---|---|---|
| `map2()` | Exactly 2 | purrr | List |
| `pmap()` | Any number (a list) | purrr | List |
| `pmap_dbl()` and friends | Any number | purrr | Type-strict atomic vector |
| `mapply()` and `Map()` | Any number | base | Vector or matrix or list (auto) |

Use `map2()` when you have exactly two inputs and `pmap()` once you reach three or more, or whenever the inputs already live together in a list or data frame. The typed `pmap_*()` family adds the safety net: you declare the output type, and a wrong return value raises an error instead of simplifying unpredictably the way `mapply()` does.

[NOTE]
**Coming from Python?** The closest equivalent of `pmap(list(a, b, c), f)` is `[f(x, y, z) for x, y, z in zip(a, b, c)]` or `list(map(f, a, b, c))`. Iterating a data frame with `pmap(df, f)` is like pandas `df.apply(f, axis=1)`.

## Common pitfalls

**Pitfall 1: forgetting to wrap inputs in `list()`.** `pmap()` takes a single argument `.l`. Writing `pmap(a, b, c, fn)` is wrong because `b` and `c` get treated as `.f` and `...`. Always group the inputs: `pmap(list(a, b, c), fn)`.

**Pitfall 2: a data frame with extra columns.** When you pass a data frame, every column becomes an argument. If the data frame has more columns than your function accepts, the call errors. Select the needed columns first, or add `...` to the function signature to absorb the rest.

**Pitfall 3: reaching for `.x` and `.y`.** Inside a `pmap()` lambda there is no `.x` or `.y`. Use the numbered pronouns `..1`, `..2`, `..3`, or name the function arguments to match the list element names.

## Try it yourself

**Try it:** Use `pmap_dbl` to iterate over a data frame. Build `mtcars[1:4, c("hp", "wt")]` and compute `hp / wt` for each row. Save the result to `ex_ratio`.

```r title="Your turn: power-to-weight with pmap"
# Try it: pmap_dbl over a two-column data frame
ex_data <- mtcars[1:4, c("hp", "wt")]
ex_ratio <- # your code here

ex_ratio
#> Expected: 4 numbers, horsepower divided by weight
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_data <- mtcars[1:4, c("hp", "wt")]
ex_ratio <- pmap_dbl(ex_data, function(hp, wt) hp / wt)
ex_ratio
#> [1] 41.98473 38.26087 40.08621 34.21462
```

**Explanation:** `pmap_dbl()` walks the data frame one row at a time. The function arguments `hp` and `wt` are matched to the columns by name, and the `_dbl` suffix returns a numeric vector instead of a list.

</details>

## Related purrr functions

After pmap, these functions cover the rest of multi-input iteration:

- `pmap_dbl()`, `pmap_chr()`, `pmap_lgl()`, `pmap_int()`: type-safe variants
- `pmap_dfr()`, `pmap_dfc()`: combine results into a data frame by row or column
- `map()` and `map2()`: iterate over one or exactly two inputs
- `pwalk()`: run a multi-input function for side effects, returning the input invisibly
- `imap()`: iterate over one input plus its index or names

The base R counterparts are `Map()` and `mapply()` for projects that avoid the tidyverse. The official argument reference lives in the [purrr pmap documentation](https://purrr.tidyverse.org/reference/pmap.html).

## FAQ

**What is the difference between map2 and pmap in purrr?**

`map2()` iterates over exactly two inputs, exposed inside a lambda as `.x` and `.y`. `pmap()` iterates over any number of inputs, passed as a single list and referred to as `..1`, `..2`, `..3`, and so on. Use `map2()` for two inputs and `pmap()` once you reach three or more, or whenever the inputs already sit together in a list or data frame.

**How do I use pmap with a data frame?**

Pass the data frame directly as the first argument: `pmap(df, fn)`. A data frame is a list of equal-length columns, so `pmap()` walks it one row at a time. Give your function argument names that match the column names, and purrr matches each row's values to the right parameters automatically.

**What do ..1 and ..2 mean in pmap?**

`..1`, `..2`, and `..3` are positional pronouns inside a `pmap()` lambda. `..1` is the current element of the first list in `.l`, `..2` the second, and so on. They let you write a compact formula such as `~ ..1 + ..2` without naming a full function. For named lists, you can use the names instead.

**Can pmap return a data frame?**

Yes. Use `pmap_dfr()` when your function returns a data frame per call; it row-binds every result into one table. Use `pmap_dfc()` to column-bind instead. Both require the dplyr or vctrs binding rules, so each per-call result should have a consistent set of columns.

**How do I run pmap for side effects only?**

Use `pwalk()` instead of `pmap()`. It calls the function once per position for its side effect, such as writing a file or printing, then returns the input list invisibly. `pwalk(list(paths, datasets), write.csv)` writes each dataset to its matching path without building a result list.
</content>
</invoke>
