---
title: "min() in R: Find the Smallest Value With NA Handling"
slug: "base-min-in-R"
description: "Use base R min() to find the smallest value of a numeric vector. Covers na.rm, pmin() for element-wise minima, which.min() for the index, and 5 examples."
keywords: "min in R, R min function, base R min, smallest value in R, min ignoring NA R, na.rm in min, pmin vs min R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "base min()|R min function|smallest value in R|min() with na.rm|pmin() in R"
auto_link_case_sensitive: true
target_keyword: "min in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# min() in R: Find the Smallest Value With NA Handling

<p class="lead">The <code>min()</code> function in base R returns the smallest value of one or more numeric vectors. Pass <code>na.rm = TRUE</code> to ignore missing values, and reach for <code>pmin()</code> when you need element-wise minima across two vectors.</p>

[QUICK ANSWER]
min(x)                              # smallest value of a vector
min(x, na.rm = TRUE)                # ignore NA values
min(x, y, z)                        # smallest across multiple vectors
min(mtcars$mpg)                     # min of a data frame column
which.min(x)                        # index of the smallest value
pmin(x, y)                          # element-wise minimum of two vectors
min(x[x > 0])                       # conditional min (positive values only)

[DECISION TREE: Is min() the right tool?]
- smallest value in one vector: min(x)
- smallest value ignoring NA: min(x, na.rm = TRUE)
- index of the smallest value: which.min(x)
- element-wise minimum of two vectors: pmin(x, y)
- both min and max in one call: range(x)
- smallest per group: aggregate(x ~ g, data, min)
- smallest row of a data frame by column: df[which.min(df$x), ]

## What min() does in one sentence

**min() scans every value passed to it and returns the single smallest one as a length-one vector.** It accepts numeric, integer, logical (where `TRUE = 1`), character (alphabetical order), and date inputs. You can pass one vector or many; min() flattens them all before comparing.

The function is method-dispatching, so `Date` and `POSIXct` objects have a defined minimum. `min(as.Date(c("2026-01-15", "2025-12-31")))` returns the earlier date as a `Date`, not a number.

## Syntax

**`min(..., na.rm = FALSE)` takes any number of comparable inputs and one optional flag.** Pass values directly or as a vector. The `na.rm` argument controls whether missing values poison the result.

```r title="Smallest value of a numeric vector"
x <- c(7, 3, 9, 1, 5)
min(x)
#> [1] 1
```

The arguments:

- `...`: one or more numeric, logical, character, or date vectors. All are combined before the comparison.
- `na.rm`: if `TRUE`, drop `NA` before computing; default is `FALSE`.

[TIP]
**Pass `na.rm = TRUE` whenever your data may contain missing values.** With the default `na.rm = FALSE`, a single `NA` makes min() return `NA`. This is the same gotcha that bites mean() and sum(); check for it first when a summary unexpectedly returns `NA`.

## Five common patterns

### 1. Smallest value of a numeric vector

```r title="Min of a small vector"
min(c(8, 2, 5, 11, 4))
#> [1] 2
```

min() scans the five values and returns 2, the smallest. The return type matches the input: numeric in, numeric out.

### 2. Ignore missing values with na.rm

```r title="Drop NA before finding the minimum"
x <- c(10, 20, NA, 5, 40)
min(x)
#> [1] NA

min(x, na.rm = TRUE)
#> [1] 5
```

Without `na.rm = TRUE`, any `NA` poisons the result. With it, min() drops `NA` and returns the smallest of the remaining four values.

### 3. Smallest across multiple vectors

```r title="Pass two vectors to find the overall minimum"
a <- c(15, 22, 8)
b <- c(11, 4, 19)
min(a, b)
#> [1] 4
```

min() concatenates `a` and `b` before comparing, returning the global smallest. This is **not** the same as `pmin()`, which compares element by element. See the comparison table below.

### 4. Min of a data frame column

```r title="Smallest mpg value in mtcars"
min(mtcars$mpg)
#> [1] 10.4

mtcars[which.min(mtcars$mpg), c("mpg", "cyl", "hp")]
#>                     mpg cyl  hp
#> Cadillac Fleetwood 10.4   8 205
```

Pass a column directly for the value, or combine with `which.min()` to retrieve the full row of the record holder. `which.min()` returns the position of the first minimum; ties go to the earliest index.

### 5. Conditional min on a subset

```r title="Smallest positive value only"
x <- c(-3, 7, -1, 12, 4, -8)
min(x[x > 0])
#> [1] 4
```

The logical subset `x[x > 0]` keeps only positive entries. Passing that filtered vector to min() returns the smallest positive value. The same pattern powers most "smallest in a subgroup" questions in base R.

[KEY INSIGHT]
**min() flattens its inputs; pmin() preserves their shape.** `min(a, b)` returns one number, the overall smallest. `pmin(a, b)` returns a vector the same length as its inputs, with the smaller value at each position. Remembering this distinction prevents the most common R mistake when capping values: use pmin(), not min(), to clip every element to a ceiling.

## min vs pmin vs which.min vs range

**Pick the function that matches your question, not just the keyword.** The table compares the four sibling functions in base R.

| Function | What it returns | Typical use |
|---|---|---|
| `min(x)` | Single smallest value | Reduce a vector to its minimum |
| `min(x, y)` | Single smallest across both | Pool many vectors, then minimize |
| `pmin(x, y)` | Vector of element-wise minima | Cap each element of x at the corresponding y |
| `which.min(x)` | Index (integer) of the first minimum | Locate the record holder in a data frame |
| `range(x)` | Length-2 vector: `c(min, max)` | Both extremes in one call |

For a scalar summary, min() is the right answer. For a vectorized comparison (e.g., "cap each price at 100"), pmin() is the only correct tool. For locating the row that holds the minimum, which.min() is faster and more readable than `match(min(x), x)`.

## Common pitfalls

**Pitfall 1: min() of an empty vector returns Inf with a warning.** `min(numeric(0))` returns `Inf`, not `NA` or an error. Check `length(x) > 0` before calling min() on user-supplied data; otherwise downstream comparisons silently inherit the `Inf`.

**Pitfall 2: min() returns NA when any element is NA.** Always set `na.rm = TRUE` for real-world data. If you forget, every downstream summary inherits the `NA` and breaks plots and tables.

**Pitfall 3: min() on a character vector returns the alphabetically first string.** `min(c("banana", "apple", "cherry"))` returns `"apple"`, not an error. The behavior is consistent but rarely what you want; convert to numeric first if the strings represent numbers.

[WARNING]
**Do not use min() to clip a vector element by element.** A common bug is writing `min(x, 100)` to cap each value of `x` at 100. That call flattens `x` and 100 together and returns one scalar. Use `pmin(x, 100)` to cap each element individually, returning a vector the same length as `x`.

## Try it yourself

**Try it:** Find the smallest mpg value in mtcars among cars with exactly 6 cylinders. Save the result to `ex_min_6cyl`.

```r title="Your turn: conditional minimum"
ex_min_6cyl <- # your code here

ex_min_6cyl
#> Expected: 17.8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_min_6cyl <- min(mtcars$mpg[mtcars$cyl == 6])
ex_min_6cyl
#> [1] 17.8
```

**Explanation:** The subset `mtcars$mpg[mtcars$cyl == 6]` keeps mpg values only where the cylinder count is 6. Passing that filtered vector to min() returns the smallest of the seven matching cars.

</details>

## Related base R summary functions

After mastering min(), look at:

- `max()`: the opposite end of the range
- `range()`: min and max in a single length-2 vector
- `which.min()` and `which.max()`: index of the first extreme value
- `pmin()` and `pmax()`: element-wise minima and maxima across vectors
- `sort()` and `order()`: full ordering when you need ranks, not just the extreme
- `summary()`: five-number summary including min and max

For descriptive statistics across many variables at once, see the descriptive statistics in R guide. For group-wise minima, `aggregate(x ~ g, data, min)` or `dplyr::summarise(min_x = min(x))` extends min() to grouped data. The R documentation for [min in base R](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Extremes.html) covers the full function signature.

## FAQ

**How do I find the minimum value in R while ignoring missing values?**

Pass `na.rm = TRUE`: `min(x, na.rm = TRUE)`. By default, min() returns `NA` if any element is `NA`, which silently propagates into downstream summaries. Always set `na.rm = TRUE` when working with real-world data, or impute the missing values first using a domain-appropriate rule before reducing the vector.

**What is the difference between min and pmin in R?**

min() returns one scalar: the smallest value across all its inputs combined. pmin() returns a vector: the element-wise minimum of two or more equal-length vectors. Use min() for a single summary; use pmin() to cap or floor every element of a vector against another vector or a constant.

**How do I find the row with the minimum value in a data frame?**

Use `which.min()` to get the position, then index back: `df[which.min(df$x), ]`. which.min() returns the integer index of the first occurrence of the minimum. If you need every tied row, use `df[df$x == min(df$x, na.rm = TRUE), ]` to keep all rows that match the minimum value.

**Why does min(numeric(0)) return Inf in R?**

R defines min of an empty set as positive infinity by convention: there is no value smaller than any number you could insert, so the identity element for minimization is `Inf`. R issues a warning to flag the edge case. Check `length(x) > 0` before reducing user-supplied data to avoid silently inheriting the `Inf`.

**Can I use min() on dates and characters in R?**

Yes. min() dispatches on the input class. For `Date` vectors it returns the earliest date; for character vectors it returns the alphabetically first string; for `POSIXct` vectors it returns the earliest timestamp. The same `na.rm` argument applies. Comparing mixed types is unsafe; coerce first with `as.Date()` or `as.numeric()`.
