---
title: "median() in R: Find the Middle Value of a Numeric Vector"
slug: "base-median-in-R"
description: "Use base R median() to find the middle value of a numeric vector. Covers na.rm handling, even and odd length, outlier robustness, group medians, 5 examples."
keywords: "median in R, R median function, base R median, median ignoring NA R, na.rm in median, median of a vector R, median vs mean R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "Descriptive-Statistics-in-R.html"
auto_link_terms: "base median()|R median function|median in R|median() with na.rm|median of a vector"
auto_link_case_sensitive: true
target_keyword: "median in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# median() in R: Find the Middle Value of a Numeric Vector

<p class="lead">The <code>median()</code> function in R returns the middle value of a sorted numeric vector. It is robust to outliers, so prefer median() over mean() for skewed data, and pass <code>na.rm = TRUE</code> to drop missing values.</p>

[QUICK ANSWER]
median(x)                              # 50th percentile
median(x, na.rm = TRUE)                # ignore NA values
median(mtcars$mpg)                     # median of a data frame column
median(x[x > 0])                       # conditional median (positive only)
apply(num_df, 2, median)               # column-wise median of a data frame
aggregate(mpg ~ cyl, mtcars, median)   # group-wise median by category
quantile(x, 0.5, names = FALSE)        # equivalent via quantile()

[DECISION TREE: Is median() the right tool?]
- middle value of a numeric vector: median(x)
- median with missing values: median(x, na.rm = TRUE)
- need other percentiles too: quantile(x, c(0.25, 0.5, 0.75))
- robust spread paired with median: mad(x)
- column-wise median of a data frame: apply(df, 2, median)
- group-wise median by category: aggregate(x ~ g, data, median)
- weighted median: matrixStats::weightedMedian(x, w)

## What median() does in one sentence

**median() returns the middle value of a sorted vector as a single number.** For an odd-length vector, it returns the exact middle element; for an even-length vector, it returns the arithmetic mean of the two middle elements.

The function is method-dispatching, so numeric, integer, logical (where TRUE = 1), and date or POSIXct vectors all have a defined median. `median(Sys.Date() + 0:9)` returns the midpoint date as a `Date`, not a number.

## Syntax

**`median(x, na.rm = FALSE, ...)` takes a vector plus one optional argument.** Unlike `mean()`, `median()` has no `trim` argument because the median is already robust to extreme tails by construction.

```r title="Median of a small numeric vector"
x <- c(2, 4, 6, 8, 10)
median(x)
#> [1] 6
```

The two main arguments:

- `x`: numeric, logical, or date or time vector
- `na.rm`: if `TRUE`, drop `NA` before computing; default is `FALSE`

[TIP]
**Pass `na.rm = TRUE` whenever your data contains missing values.** With the default `na.rm = FALSE`, a single `NA` makes the entire result `NA`. This is the most common base-R surprise; check for it first when a summary unexpectedly returns `NA`.

## Five common patterns

### 1. Plain median of an odd-length vector

```r title="Middle value of a 5 element vector"
median(c(3, 1, 4, 1, 5))
#> [1] 3
```

The function sorts the vector internally to `1, 1, 3, 4, 5` and returns the third element. You do not need to sort the input yourself.

### 2. Even-length vector averages the two middle values

```r title="Median of a 4 element vector"
median(c(1, 2, 3, 4))
#> [1] 2.5
```

With four sorted values, the two middle elements are 2 and 3. The function returns their arithmetic mean, 2.5. This is why a median of integers can return a decimal.

### 3. Ignore missing values

```r title="Drop NA before computing the median"
x <- c(10, 20, NA, 30, 40)
median(x)
#> [1] NA

median(x, na.rm = TRUE)
#> [1] 25
```

Without `na.rm = TRUE`, any `NA` poisons the result. With it, the function drops the `NA` and computes the median of the remaining four values.

### 4. Robustness to outliers

```r title="Median ignores extreme values that pull the mean"
x <- c(2, 3, 4, 5, 6, 7, 8, 9, 10, 100)
mean(x)
#> [1] 15.4

median(x)
#> [1] 6.5
```

The single outlier of 100 pulls the mean from 5.5 to 15.4. The median stays at 6.5 because rank-based summaries do not care how large the largest value is. This is the main reason to choose `median()` over `mean()` for skewed or long-tailed data.

### 5. Median of a data frame column

```r title="Median of the mpg column in mtcars"
median(mtcars$mpg)
#> [1] 19.2
```

For a single column, pass it directly. For every numeric column at once, use `apply(mtcars, 2, median)` or `sapply(mtcars, median)`; there is no `colMedians()` in base R.

[KEY INSIGHT]
**The median is exactly the 50th percentile.** `median(x)` and `quantile(x, 0.5, names = FALSE)` return the same value for the default quantile algorithm. This means anything you can express with `quantile()` (other percentiles, multiple quantiles in one call, type-2 step-function semantics) is a strict generalization of `median()`. Reach for `quantile()` when you need the 25th and 75th alongside the median.

## median vs mean vs quantile vs mad

**Pick the summary that matches the question you are asking about the distribution.** The table compares four base-R summaries that operate on the same vector.

| Function | What it computes | When to use |
|---|---|---|
| `median(x)` | 50th percentile (middle value) | Skewed data, outliers, ordinal scales |
| `mean(x)` | Arithmetic average | Symmetric data with no outliers |
| `quantile(x, p)` | Any percentile or set of percentiles | When you also need 25th, 75th, or custom cuts |
| `mad(x)` | Median absolute deviation | Robust spread (the median's natural partner) |
| `summary(x)` | Five-number summary plus mean | A one-line distribution overview |

For a single robust center, use `median()`. For a robust pair (center + spread), use `median()` with `mad()`. For a full distributional picture, `summary()` or `quantile()` is the better entry point.

## Common pitfalls

**Pitfall 1: `median()` returns `NA` when any element is `NA`.** Always set `na.rm = TRUE` for real-world data. If you forget, downstream summaries silently propagate `NA` and break plots, tables, and joins.

**Pitfall 2: median of a logical vector is 0 or 1, not a proportion.** `mean(c(TRUE, FALSE, FALSE))` returns 0.333, but `median(c(TRUE, FALSE, FALSE))` returns 0 (the middle value after sorting). Use `mean()` on a logical vector when you want the share that is `TRUE`.

**Pitfall 3: passing a character vector returns `NA` with a warning.** R does not auto-convert strings to numbers in `median()`. Convert first with `as.numeric()`, then handle the `NA` values that come from parse failures.

[WARNING]
**Never pass a data frame directly to `median()`.** `median(mtcars)` returns `NA` with a warning. There is no `colMedians()` in base R, unlike `colMeans()`. Use `apply(mtcars, 2, median)` for every numeric column or `sapply(mtcars, median)` for a column-by-column median. This trips up readers who expect symmetry with `mean()`.

## Try it yourself

**Try it:** Compute the median ozone level in the `airquality` dataset, ignoring missing values. Save the result to `ex_median_ozone`.

```r title="Your turn: median with NA handling"
# airquality$Ozone contains NA values
ex_median_ozone <- # your code here

ex_median_ozone
#> Expected: 31.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_median_ozone <- median(airquality$Ozone, na.rm = TRUE)
ex_median_ozone
#> [1] 31.5
```

**Explanation:** The `airquality` dataset has 37 missing values in the `Ozone` column. Passing `na.rm = TRUE` drops them before computing the median of the remaining 116 observations. Without that flag, the call would return `NA` and silently break any downstream summary.

</details>

## Related base R summary functions

After mastering `median()`, look at:

- `mean()`: arithmetic average, paired comparison with median for skewness diagnostics
- `quantile()`: any percentile, including the median itself
- `mad()`: median absolute deviation, the robust spread for `median()`
- `IQR()`: interquartile range, another rank-based spread
- `summary()`: five-number summary plus mean in one call
- `aggregate()` and `dplyr::summarise()`: group-wise medians

For a full descriptive statistics tour, see the [base R descriptive statistics guide](Descriptive-Statistics-in-R.html). For a robust regression alternative driven by the same logic, see `MASS::rlm()`. The official reference for `median()` is the [R help page](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/median.html).

## FAQ

**How do I calculate the median in R while ignoring missing values?**

Pass `na.rm = TRUE`: `median(x, na.rm = TRUE)`. By default, `median()` returns `NA` if any element is `NA`, which silently propagates into downstream summaries. Always set `na.rm = TRUE` when working with real-world data, or impute the missing values first using a domain-appropriate rule before summarizing.

**What is the difference between median and mean in R?**

`mean()` is the arithmetic average (sum divided by length); `median()` is the middle value of the sorted data. The mean is sensitive to outliers and skew; the median is not. For symmetric data the two agree; for skewed data (income, latency, counts) the median is the more honest summary of central tendency. Reporting both side by side flags the presence of skew.

**How do I compute the median by group in R?**

Use `aggregate(x ~ group, data = df, FUN = median)` in base R. For example, `aggregate(mpg ~ cyl, mtcars, median)` returns the median mpg for each cylinder count. The tidyverse equivalent is `dplyr::summarise(median(x), .by = group)`. For multiple group keys, separate them with `+`: `aggregate(mpg ~ cyl + gear, mtcars, median)`.

**Can I compute a weighted median in base R?**

Not directly. Base R has `weighted.mean()` but no `weighted.median()`. Use `matrixStats::weightedMedian(x, w)` or `Hmisc::wtd.quantile(x, weights = w, probs = 0.5)` from CRAN. A weighted median is the value at which the cumulative weight first crosses half the total weight; it is the right summary when observations contribute unequally, such as survey weights or unequal sample sizes.

**Why is `median(c(1, 2, 3, 4))` equal to 2.5?**

For an even-length vector, no element sits exactly in the middle. R follows the standard convention of averaging the two middle values, here 2 and 3, returning 2.5. This is why a median of integers can be a decimal. If you need an integer-only result, take the lower of the two middle values with `sort(x)[floor((length(x) + 1) / 2)]`, but this is a step-function median (`quantile()` type 1) and is rarely preferable to the default.
