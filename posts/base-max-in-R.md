---
title: "max() in R: Find the Largest Value With NA Handling"
slug: "base-max-in-R"
description: "Use base R max() to find the largest value of a numeric vector. Covers na.rm, pmax() for element-wise maxima, which.max() for the index, and 5 examples."
keywords: "max in R, R max function, base R max, largest value in R, max ignoring NA R, na.rm in max, pmax vs max R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "base max()|R max function|largest value in R|max() with na.rm|pmax() in R"
auto_link_case_sensitive: true
target_keyword: "max in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# max() in R: Find the Largest Value With NA Handling

<p class="lead">The <code>max()</code> function in base R returns the largest value of one or more numeric vectors. Pass <code>na.rm = TRUE</code> to ignore missing values, and reach for <code>pmax()</code> when you need element-wise maxima across two vectors.</p>

[QUICK ANSWER]
max(x)                              # largest value of a vector
max(x, na.rm = TRUE)                # ignore NA values
max(x, y, z)                        # largest across multiple vectors
max(mtcars$hp)                      # max of a data frame column
which.max(x)                        # index of the largest value
pmax(x, y)                          # element-wise maximum of two vectors
max(x[x > 0])                       # conditional max (positives only)

[DECISION TREE: Is max() the right tool?]
- largest value in one vector: max(x)
- largest value ignoring NA: max(x, na.rm = TRUE)
- index of the largest value: which.max(x)
- element-wise maximum of two vectors: pmax(x, y)
- both min and max in one call: range(x)
- top N values (not just the largest): sort(x, decreasing = TRUE)[1:N]
- largest per group: aggregate(x ~ g, data, max)

## What max() does in one sentence

**max() scans every value passed to it and returns the single largest one as a length-one vector.** It accepts numeric, integer, logical (where `TRUE = 1`), character (alphabetical order), and date inputs. You can pass one vector or many; max() flattens them all into a single comparison before reducing.

The function is method-dispatching, so `Date` and `POSIXct` objects have a defined maximum. `max(as.Date(c("2026-01-15", "2025-12-31")))` returns the later date as a `Date`, not a number. The same dispatch applies to factors with ordered levels and to objects from packages that register a `max()` method. For unordered factors, max() raises an error rather than returning a misleading alphabetical result.

Because max() always returns a length-one value, you can use it inline anywhere a scalar is expected: as a threshold in a logical test, as a denominator for normalization, or as the upper limit in a sequence call. This makes it one of the most commonly chained functions in base R alongside its sibling, min().

## Syntax

**`max(..., na.rm = FALSE)` takes any number of comparable inputs and one optional flag.** Pass values directly or as a vector. The `na.rm` argument controls whether missing values poison the result.

```r title="Largest value of a numeric vector"
x <- c(7, 3, 9, 1, 5)
max(x)
#> [1] 9
```

The arguments:

- `...`: one or more numeric, logical, character, or date vectors. All are combined before the comparison.
- `na.rm`: if `TRUE`, drop `NA` before computing; default is `FALSE`.

Because `...` captures all unnamed arguments, you must name `na.rm` when mixing it with multiple vectors. Writing `max(x, y, TRUE)` does not enable NA-stripping; it adds the value `1` (the numeric form of `TRUE`) to the comparison pool.

[TIP]
**Pass `na.rm = TRUE` whenever your data may contain missing values.** With the default `na.rm = FALSE`, a single `NA` makes max() return `NA`. This same gotcha bites mean(), sum(), and min(); check for it first when a summary unexpectedly returns `NA`.

## Five common patterns

### 1. Largest value of a numeric vector

```r title="Max of a small vector"
max(c(8, 2, 5, 11, 4))
#> [1] 11
```

max() scans the five values and returns 11, the largest. The return type matches the input: numeric in, numeric out.

### 2. Ignore missing values with na.rm

```r title="Drop NA before finding the maximum"
x <- c(10, 20, NA, 5, 40)
max(x)
#> [1] NA

max(x, na.rm = TRUE)
#> [1] 40
```

Without `na.rm = TRUE`, any `NA` poisons the result. With it, max() drops `NA` and returns the largest of the remaining four values.

### 3. Largest across multiple vectors

```r title="Pass two vectors to find the overall maximum"
a <- c(15, 22, 8)
b <- c(11, 4, 19)
max(a, b)
#> [1] 22
```

max() concatenates `a` and `b` before comparing, returning the global largest. This is **not** the same as `pmax()`, which compares element by element. The flattening behavior is also the source of the most common max() bug: writing `max(x, 0)` to floor every element fails silently because max() reduces the combined input to one scalar.

### 4. Max of a data frame column and locating the record holder

```r title="Most powerful car in mtcars"
max(mtcars$hp)
#> [1] 335

mtcars[which.max(mtcars$hp), c("mpg", "cyl", "hp")]
#>                 mpg cyl  hp
#> Maserati Bora  15.0   8 335
```

Pass a column directly for the value, or combine with `which.max()` to retrieve the full row of the record holder. `which.max()` returns the position of the first maximum; ties go to the earliest index.

### 5. Conditional max on a subset

```r title="Largest value under a ceiling"
x <- c(50, 120, 75, 200, 95, 180)
max(x[x < 150])
#> [1] 120
```

The logical subset `x[x < 150]` keeps only entries below 150. Passing that filtered vector to max() returns the largest qualifying value. The same pattern answers "what is the best result that still meets a constraint" without sorting.

[KEY INSIGHT]
**max() flattens its inputs; pmax() preserves their shape.** `max(a, b)` returns one number, the overall largest. `pmax(a, b)` returns a vector the same length as its inputs, with the larger value at each position. Remembering this distinction prevents the most common R mistake when flooring values: use pmax(), not max(), to lift every element above a threshold.

## max vs pmax vs which.max vs range

**Pick the function that matches your question, not just the keyword.** The table compares the four sibling functions in base R.

| Function | What it returns | Typical use |
|---|---|---|
| `max(x)` | Single largest value | Reduce a vector to its maximum |
| `max(x, y)` | Single largest across both | Pool many vectors, then maximize |
| `pmax(x, y)` | Vector of element-wise maxima | Floor each element of x at the corresponding y |
| `which.max(x)` | Index (integer) of the first maximum | Locate the record holder in a data frame |
| `range(x)` | Length-2 vector: `c(min, max)` | Both extremes in one call |

For a scalar summary, max() is the right answer. For a vectorized comparison such as flooring each value at zero, pmax() is the only correct tool. For locating the row that holds the maximum, which.max() is faster and more readable than `match(max(x), x)`.

## Group-wise maximum

**Combine max() with `aggregate()` or `tapply()` to compute one maximum per group.** Base R offers two equivalent shortcuts; pick whichever reads more naturally in your script.

```r title="Maximum horsepower per cylinder count"
aggregate(hp ~ cyl, data = mtcars, FUN = max)
#>   cyl  hp
#> 1   4 113
#> 2   6 175
#> 3   8 335
```

`aggregate()` returns a tidy data frame with one row per group. `tapply(mtcars$hp, mtcars$cyl, max)` returns a named numeric vector instead, which can be more convenient when piping into a plot. For grouped maxima inside the tidyverse, `dplyr::summarise(max_hp = max(hp), .by = cyl)` is the modern equivalent.

## Common pitfalls

**Pitfall 1: max() of an empty vector returns -Inf with a warning.** `max(numeric(0))` returns `-Inf`, not `NA` or an error. Check `length(x) > 0` before calling max() on user-supplied data; otherwise downstream comparisons silently inherit the `-Inf`.

**Pitfall 2: max() returns NA when any element is NA.** Always set `na.rm = TRUE` for real-world data. If you forget, every downstream summary inherits the `NA` and breaks plots and tables.

**Pitfall 3: max() on a character vector returns the alphabetically last string.** `max(c("banana", "apple", "cherry"))` returns `"cherry"`. Convert to numeric first if the strings represent numbers, because `"9" > "10"` lexicographically.

[WARNING]
**Do not use max() to floor a vector element by element.** A common bug is writing `max(x, 0)` to lift every negative value of `x` to zero. That call flattens `x` and 0 together and returns one scalar. Use `pmax(x, 0)` to floor each element individually, returning a vector the same length as `x`.

## Try it yourself

**Try it:** Find the highest mpg value in mtcars among cars with exactly 8 cylinders. Save the result to `ex_max_8cyl`.

```r title="Your turn: conditional maximum"
ex_max_8cyl <- # your code here

ex_max_8cyl
#> Expected: 19.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_max_8cyl <- max(mtcars$mpg[mtcars$cyl == 8])
ex_max_8cyl
#> [1] 19.2
```

**Explanation:** The subset `mtcars$mpg[mtcars$cyl == 8]` keeps mpg values only where the cylinder count is 8. Passing that filtered vector to max() returns the largest of the fourteen matching cars.

</details>

## Related base R summary functions

After mastering max(), look at:

- `min()`: the opposite end of the range
- `range()`: min and max in a single length-2 vector
- `which.max()` and `which.min()`: index of the first extreme value
- `pmax()` and `pmin()`: element-wise maxima and minima across vectors
- `sort()` and `order()`: full ordering when you need ranks, not just the extreme
- `summary()`: five-number summary including min and max

For group-wise maxima, `dplyr::summarise(max_x = max(x))` extends max() to grouped data. The R documentation for [max in base R](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extremes.html) covers the full function signature.

## FAQ

**How do I find the maximum value in R while ignoring missing values?**

Pass `na.rm = TRUE`: `max(x, na.rm = TRUE)`. By default, max() returns `NA` if any element is `NA`, which silently propagates into downstream summaries. Always set `na.rm = TRUE` when working with real-world data, or impute the missing values first using a domain-appropriate rule before reducing the vector.

**What is the difference between max and pmax in R?**

max() returns one scalar: the largest value across all its inputs combined. pmax() returns a vector: the element-wise maximum of two or more equal-length vectors. Use max() for a single summary; use pmax() to floor or cap every element of a vector against another vector or a constant.

**How do I find the row with the maximum value in a data frame?**

Use `which.max()` to get the position, then index back: `df[which.max(df$x), ]`. which.max() returns the integer index of the first occurrence of the maximum. If you need every tied row, use `df[df$x == max(df$x, na.rm = TRUE), ]` to keep all rows that match the maximum value.

**Why does max(numeric(0)) return -Inf in R?**

R defines max of an empty set as negative infinity by convention: there is no value larger than any number you could insert, so the identity element for maximization is `-Inf`. R issues a warning to flag the edge case. Check `length(x) > 0` before reducing user-supplied data to avoid silently inheriting the `-Inf`.

**Can I use max() on dates and characters in R?**

Yes. max() dispatches on the input class. For `Date` vectors it returns the latest date; for character vectors it returns the alphabetically last string; for `POSIXct` vectors it returns the latest timestamp. The same `na.rm` argument applies. Comparing mixed types is unsafe; coerce first with `as.Date()` or `as.numeric()`.
