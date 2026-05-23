---
title: "sum() in R: Add Vector Elements With NA Handling"
slug: "base-sum-in-R"
description: "Use base R sum() to add up the elements of one or more numeric vectors. Covers na.rm, integer overflow, the colSums alternative, and 5 worked examples."
keywords: "sum in R, R sum function, base R sum, sum function R, sum vector R, na.rm sum R, sum columns R, integer overflow R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "base sum()|R sum function|sum() with na.rm|sum a vector in R|colSums and rowSums"
auto_link_case_sensitive: true
target_keyword: "sum in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# sum() in R: Add Vector Elements With NA Handling

<p class="lead">The <code>sum()</code> function in base R adds up the elements of one or more numeric or logical vectors and returns a single value. It is the most-used aggregator in R, with two arguments that matter: the data you pass in and <code>na.rm</code>.</p>

[QUICK ANSWER]
sum(x)                              # add all elements
sum(x, y, z)                        # add across several vectors
sum(x, na.rm = TRUE)                # drop NA before adding
sum(is.na(x))                       # count NAs (TRUE = 1)
sum(x > 0)                          # count values matching a condition
sum(x[x > 0])                       # add only matching values
colSums(m); rowSums(m)              # column / row totals (faster)
sum(as.numeric(x))                  # avoid integer overflow

[DECISION TREE: Is sum() the right tool?]
- add all values of one vector: sum(x)
- add values across many vectors: sum(x, y, z)
- column totals of a matrix or df: colSums(m)
- row totals of a matrix or df: rowSums(m)
- running cumulative total: cumsum(x)
- sum by group in a data frame: dplyr::summarise(total = sum(x), .by = grp)
- weighted sum (each value times a weight): sum(x * w) or weighted.mean
- average rather than total: mean(x)

## What sum() does in one sentence

**`sum(..., na.rm = FALSE)` adds every element of every argument passed in and returns a single number.** It coerces logical values to integers, so `sum(x > 0)` becomes a count of TRUE values.

`sum()` accepts any number of numeric or logical vectors. If you pass three vectors, it adds every element of all three. If even one element is `NA` and `na.rm = FALSE` (the default), the result is `NA`.

## Syntax

**`sum(..., na.rm = FALSE)`. The `...` accepts one or more numeric, integer, logical, or complex vectors. `na.rm` controls NA propagation.**

```r title="Add the elements of a vector"
x <- c(2, 4, 6, 8, 10)
sum(x)
#> [1] 30

sum(x, 100, 200)
#> [1] 330

sum(c(1, 2, NA, 4))
#> [1] NA

sum(c(1, 2, NA, 4), na.rm = TRUE)
#> [1] 7
```

The default `na.rm = FALSE` is deliberate. R refuses to silently hide missing data, so you must opt in by writing `na.rm = TRUE`.

[TIP]
**Set `na.rm = TRUE` only when missing values are truly negligible.** A silent drop can hide upstream data-quality bugs. When in doubt, count NAs first with `sum(is.na(x))` and decide whether to drop or impute.

## Five common patterns

### 1. Total of a numeric vector

```r title="Most common sum use"
sales <- c(120, 95, 230, 410, 75)
sum(sales)
#> [1] 930
```

The cleanest case. Pass a single numeric vector and get the total.

### 2. Sum with NA handling

```r title="na.rm drops missing values"
readings <- c(3.2, NA, 4.1, 5.0, NA, 6.7)
sum(readings)
#> [1] NA

sum(readings, na.rm = TRUE)
#> [1] 19

sum(is.na(readings))
#> [1] 2
```

`sum(is.na(x))` is the idiomatic way to count NAs. The logical vector returned by `is.na()` coerces to 0/1 inside `sum()`.

### 3. Conditional count and conditional sum

```r title="Count or sum values matching a condition"
ages <- c(22, 35, 17, 48, 29, 15, 60)

sum(ages > 30)              # how many adults over 30?
#> [1] 3

sum(ages[ages > 30])        # total of those ages
#> [1] 143

sum(ages > 30 & ages < 50)  # how many in a range?
#> [1] 2
```

This pattern replaces `length(which(...))` and is the standard way to count matches in R.

### 4. Column and row totals

```r title="colSums and rowSums for matrices and data frames"
m <- matrix(1:12, nrow = 3)
m
#>      [,1] [,2] [,3] [,4]
#> [1,]    1    4    7   10
#> [2,]    2    5    8   11
#> [3,]    3    6    9   12

colSums(m)
#> [1]  6 15 24 33

rowSums(m)
#> [1] 22 26 30
```

`colSums()` and `rowSums()` are dedicated, C-level functions that beat `apply(m, 2, sum)` on large matrices. Use them whenever you need column or row totals.

### 5. Cumulative sum (running total)

```r title="cumsum returns a vector, not a scalar"
daily_sales <- c(120, 95, 230, 410, 75)
cumsum(daily_sales)
#> [1] 120 215 445 855 930

sum(daily_sales)
#> [1] 930
```

`cumsum()` returns a vector of the same length showing the running total at each position. The final element of `cumsum(x)` always equals `sum(x)`.

[KEY INSIGHT]
**`sum()` reduces a vector to one number; `cumsum()` keeps it as a vector.** Reach for `sum()` when you want a single aggregate, and `cumsum()` when you want a time-series style running total. Mixing them up is a common source of "I got 5 numbers when I expected 1" confusion.

## sum vs colSums vs Reduce vs accumulate

**Four ways to add elements together, picked by input shape and output shape.** Knowing which function to reach for saves both code and CPU.

| Function | Input | Output | Best for |
|---|---|---|---|
| `sum()` | One or more vectors | Single number | Total of a vector |
| `colSums()` / `rowSums()` | Matrix or data frame | Vector | Totals by column or row |
| `cumsum()` | One vector | Vector (running total) | Time-series cumulative |
| `Reduce("+", x)` | List of vectors | Vector (element-wise) | Element-wise sum of many vectors |
| `dplyr::summarise(total = sum(x), .by = grp)` | Data frame | Grouped data frame | Total by group |

When to use which:

- One vector, one number: `sum()`.
- Many columns, one number per column: `colSums()`.
- Running total: `cumsum()`.
- By group: `dplyr::summarise`.

## Common pitfalls

**Pitfall 1: integer overflow.** R integers max out at `.Machine$integer.max` = 2,147,483,647. Summing a long integer vector that crosses this returns `NA` with a warning. Cast to double first.

```r title="Force double to avoid integer overflow"
big <- rep(1L, 3e6) * 1000L      # 3 billion as integers
sum(big)
#> Warning: integer overflow; use sum(.) for double

sum(as.numeric(big))
#> [1] 3e+09
```

**Pitfall 2: forgetting `na.rm = TRUE` on real-world data.** Any single `NA` poisons the whole sum. Spot it during exploration; handle it explicitly.

**Pitfall 3: confusing `sum()` with `+`.** `sum(x, y)` adds every element of x AND every element of y into one number. `x + y` is element-wise addition that returns a vector.

```r title="sum vs + are different operations"
x <- c(1, 2, 3); y <- c(10, 20, 30)
sum(x, y)
#> [1] 66

x + y
#> [1] 11 22 33
```

[WARNING]
**Numeric sums lose precision around 1e15.** R uses double-precision floats; once the running total exceeds about 9 quadrillion, adding small values rounds away. For very large datasets, switch to specialized packages like `Rmpfr` or aggregate in chunks.

## Try it yourself

**Try it:** Use the built-in `mtcars` dataset. Compute the total horsepower across all 32 cars, ignoring any NAs. Save the result to `ex_total_hp`.

```r title="Your turn: total horsepower in mtcars"
ex_total_hp <- # your code here

ex_total_hp
#> Expected: 4694
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_total_hp <- sum(mtcars$hp, na.rm = TRUE)
ex_total_hp
#> [1] 4694
```

**Explanation:** `mtcars$hp` extracts the horsepower column as a numeric vector. `sum()` adds the 32 values; `na.rm = TRUE` is defensive even though `mtcars` has no NAs.

</details>

## Related base R aggregators

After mastering `sum()`, look at:

- `mean()`, `median()`: central tendency.
- `colSums()`, `rowSums()`, `colMeans()`, `rowMeans()`: fast row and column aggregates.
- `cumsum()`, `cumprod()`, `cummax()`, `cummin()`: cumulative aggregates.
- `prod()`: product instead of sum.
- `Reduce("+", list_of_vectors)`: element-wise sum across many vectors.
- `dplyr::summarise(total = sum(x), .by = grp)`: grouped totals on data frames.

For documentation, see [the R sum() reference](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sum.html) on the official R site.

## FAQ

**How do I sum a vector while ignoring NA values in R?**

Pass `na.rm = TRUE` to `sum()`. The function then drops any `NA` elements before adding the rest. For example, `sum(c(1, NA, 3), na.rm = TRUE)` returns `4`. Without `na.rm`, the result would be `NA`. Always check `sum(is.na(x))` first to know how many values you are discarding.

**What is the difference between sum() and colSums() in R?**

`sum()` collapses every element of every argument into a single number. `colSums()` returns one number per column of a matrix or data frame. Use `sum()` for a grand total. Use `colSums()` when you want a vector of column totals, since it is faster than calling `apply(m, 2, sum)`.

**How do I sum elements of a vector by condition in R?**

Use logical indexing. `sum(x[x > 0])` returns the total of values greater than zero. To count matches instead of summing them, use `sum(x > 0)`, which exploits R's coercion of `TRUE` to 1 and `FALSE` to 0.

**Why does sum() return NA in R?**

Any single `NA` in the input vector propagates to the result by default. R refuses to silently drop missing data. Either fix the upstream cause of the NAs, impute a value, or pass `na.rm = TRUE` to ignore them for this call.

**How do I avoid integer overflow when using sum() in R?**

Integer vectors top out at about 2.1 billion. If the running total can exceed that, cast the input to double first: `sum(as.numeric(x))`. Doubles are good up to about 1e15 before precision loss begins. For larger totals, aggregate in chunks or use `Rmpfr` for arbitrary-precision arithmetic.
