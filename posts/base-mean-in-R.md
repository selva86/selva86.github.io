---
title: "mean() in R: Arithmetic Mean With Trim and NA Handling"
slug: "base-mean-in-R"
description: "Use base R mean() to compute the arithmetic average of a numeric vector. Covers na.rm, trim for trimmed means, weighted alternatives, pitfalls, 5 examples."
keywords: "mean in R, R mean function, base R mean, arithmetic mean in R, mean ignoring NA R, na.rm in mean, trimmed mean in R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "base mean()|R mean function|arithmetic mean in R|mean() with na.rm|mean() trim argument"
auto_link_case_sensitive: true
target_keyword: "mean in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# mean() in R: Arithmetic Mean With Trim and NA Handling

<p class="lead">The <code>mean()</code> function in base R computes the arithmetic average of a numeric vector. Pass <code>na.rm = TRUE</code> to ignore missing values and <code>trim</code> to drop the tails for a robust central tendency.</p>

[QUICK ANSWER]
mean(x)                              # arithmetic mean
mean(x, na.rm = TRUE)                # ignore NA values
mean(x, trim = 0.1)                  # 10% trimmed mean (robust to outliers)
mean(x[x > 0])                       # conditional mean (positive values only)
weighted.mean(x, w)                  # weighted mean (separate function)
mean(mtcars$mpg)                     # mean of a data frame column
colMeans(mtcars)                     # column-wise mean of a numeric data frame

[DECISION TREE: Is mean() the right tool?]
- average of a numeric vector: mean(x)
- mean with missing values: mean(x, na.rm = TRUE)
- robust to outliers: median(x) or mean(x, trim = 0.1)
- weighted average: weighted.mean(x, w)
- column-wise mean of a data frame: colMeans(df) or sapply(df, mean)
- group-wise mean by category: aggregate(x ~ g, data, mean)
- rolling or running mean: zoo::rollmean() or RcppRoll::roll_mean()

## What mean() does in one sentence

**mean() returns the sum of x divided by length(x) as a single numeric value.** It accepts numeric, integer, logical (where TRUE = 1), and complex vectors. For other input types it returns `NA` with a warning.

The function is method-dispatching, so date and POSIXct objects also have a defined mean. `mean(Sys.Date() + 0:9)` returns the midpoint date as a `Date`, not a number.

## Syntax

**`mean(x, trim = 0, na.rm = FALSE, ...)` takes a vector plus two optional arguments.** `trim` drops a fraction of values from each end; `na.rm` controls how `NA` values are handled.

```r title="Mean of a numeric vector"
x <- c(2, 4, 6, 8, 10)
mean(x)
#> [1] 6
```

The three arguments:

- `x`: numeric, logical, or date/time vector
- `trim`: fraction (between 0 and 0.5) of values to trim from each end before averaging
- `na.rm`: if `TRUE`, drop `NA` before computing; default is `FALSE`

[TIP]
**Pass `na.rm = TRUE` whenever you suspect missing values.** With the default `na.rm = FALSE`, a single `NA` makes the entire result `NA`. This is the most common base-R surprise; check for it first when a summary returns `NA`.

## Five common patterns

### 1. Plain arithmetic mean

```r title="Mean of a small vector"
mean(c(1, 2, 3, 4, 5))
#> [1] 3
```

The sum is 15, the length is 5, the mean is 3.

### 2. Ignore missing values

```r title="Drop NA before averaging"
x <- c(10, 20, NA, 30, 40)
mean(x)
#> [1] NA

mean(x, na.rm = TRUE)
#> [1] 25
```

Without `na.rm = TRUE`, any `NA` poisons the result. With it, the function drops `NA` and averages the remaining four values.

### 3. Trimmed mean for outlier robustness

```r title="10% trimmed mean ignores extreme tails"
x <- c(2, 3, 4, 5, 6, 7, 8, 9, 10, 100)
mean(x)
#> [1] 15.4

mean(x, trim = 0.1)
#> [1] 6.5
```

`trim = 0.1` drops the lowest 10% and highest 10% of sorted values before averaging. The single outlier of 100 pulls the plain mean to 15.4; the trimmed mean of 6.5 better reflects the bulk of the data.

### 4. Mean of a data frame column

```r title="Mean of the mpg column in mtcars"
mean(mtcars$mpg)
#> [1] 20.09062
```

For a single column, pass it directly. For every numeric column, use `colMeans()` or `sapply(df, mean)`.

### 5. Mean of a logical vector returns a proportion

```r title="Share of mtcars rows with more than 4 cylinders"
mean(mtcars$cyl > 4)
#> [1] 0.65625
```

R coerces logical to numeric (`TRUE = 1`, `FALSE = 0`). The mean of a logical vector is the proportion that is `TRUE`. This is the cleanest one-liner for proportions in base R.

[KEY INSIGHT]
**`mean(condition)` is the idiomatic way to compute a proportion in R.** Because logicals coerce to 0 and 1, `mean(x > threshold)` returns the share of values above the threshold without a separate counter. The same trick gives `mean(is.na(x))` for missingness rate and `mean(x == "yes")` for the yes-rate.

## mean vs median vs trimmed mean vs weighted mean

**Pick the central-tendency function that matches your data shape.** The table compares mean, median, trimmed mean, and weighted mean.

| Function | What it computes | When to use |
|---|---|---|
| `mean(x)` | Arithmetic average | Symmetric data with no outliers |
| `mean(x, trim = 0.1)` | Trimmed mean | Skewed data with extreme tails |
| `median(x)` | Middle value | Heavily skewed data; ordinal scales |
| `weighted.mean(x, w)` | Weighted average | Observations differ in importance |
| `colMeans(df)` | Column-wise mean | All numeric columns of a data frame |

For symmetric, well-behaved data the plain mean is the standard summary. The moment outliers appear, switch to a median or a trimmed mean for a more honest center.

## Common pitfalls

**Pitfall 1: `mean()` returns `NA` when any element is `NA`.** Always set `na.rm = TRUE` for real-world data. If you forget, downstream summaries silently propagate `NA` and break plots and tables.

**Pitfall 2: mean of a character vector returns `NA` with a warning.** R does not auto-convert strings to numbers. Convert first with `as.numeric()`, then handle the `NA` values from parse failures.

**Pitfall 3: `trim` is a fraction, not a count.** `mean(x, trim = 2)` is invalid; `trim` must be between 0 and 0.5. Use `trim = 0.1` for 10%, not `trim = 10`.

[WARNING]
**Never pass a data frame directly to `mean()`.** `mean(mtcars)` returns `NA` with a warning in modern R. Use `colMeans(mtcars)` for numeric columns or `sapply(mtcars, mean)` for a column-by-column mean. This bug bites every R beginner once.

## Try it yourself

**Try it:** Compute the mean of `mtcars$mpg` for cars with exactly 4 cylinders. Save the result to `ex_mean_4cyl`.

```r title="Your turn: conditional mean"
ex_mean_4cyl <- # your code here

ex_mean_4cyl
#> Expected: about 26.66
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mean_4cyl <- mean(mtcars$mpg[mtcars$cyl == 4])
ex_mean_4cyl
#> [1] 26.66364
```

**Explanation:** The subset `mtcars$mpg[mtcars$cyl == 4]` keeps mpg values only where cylinder count is 4. Passing that filtered vector to `mean()` gives the conditional average. The same logical-subset pattern powers most "mean of a subgroup" questions in base R.

</details>

## Related base R summary functions

After mastering `mean()`, look at:

- `median()`: middle value, robust to outliers
- `sd()` and `var()`: spread around the mean
- `range()`, `min()`, `max()`: extremes
- `summary()`: five-number summary plus mean in one call
- `colMeans()` and `rowMeans()`: bulk averages for matrices and data frames
- `aggregate()` and `dplyr::summarise()`: group-wise means

For descriptive statistics across many variables at once, see the descriptive statistics in R guide. For weighted averages, `weighted.mean()` extends the toolkit; for running or rolling means, `zoo::rollmean()` is the go-to.

## FAQ

**How do I calculate the mean in R while ignoring missing values?**

Pass `na.rm = TRUE`: `mean(x, na.rm = TRUE)`. By default, `mean()` returns `NA` if any element is `NA`, which silently propagates into downstream summaries. Always set `na.rm = TRUE` when working with real-world data, or impute the missing values first using a domain-appropriate rule before averaging.

**What is the difference between mean and median in R?**

`mean()` is the arithmetic average (sum divided by length); `median()` is the middle value when data is sorted. The mean is sensitive to outliers and skew; the median is not. For symmetric data the two agree; for skewed data the median is the safer summary of central tendency.

**How do I compute the mean of every column in a data frame?**

For numeric-only frames, use `colMeans(df, na.rm = TRUE)`. For mixed types, use `sapply(df, function(x) if (is.numeric(x)) mean(x, na.rm = TRUE) else NA)`. The tidyverse equivalent is `dplyr::summarise(across(where(is.numeric), mean, na.rm = TRUE))` for a one-line column-wise mean.

**Can I compute a weighted mean in base R?**

Yes, with `weighted.mean(x, w)` where `w` is a numeric vector of weights the same length as `x`. The function returns `sum(x * w) / sum(w)`. Use it when observations contribute unequally, such as survey weights or grades with different credit values.

**Why does `mean(mtcars)` return NA?**

Because `mean()` expects a vector, not a data frame. Older R versions silently coerced the frame; current R returns `NA` with a warning. Use `colMeans(mtcars)` for column-wise means or `mean(mtcars$mpg)` for a single column.
