---
title: "R hist() Error: 'breaks are not unique' — Why Your Data Has No Spread"
slug: "R-Error-Breaks-Not-Unique"
description: "Fix R's 'breaks are not unique' error in hist(). Caused by constant or low-variance data — learn to detect it and use jitter, fewer breaks, or barplot()."
keywords: "R breaks are not unique, R hist error, R histogram error, breaks not unique fix, R hist constant data, R hist bin width, R histogram low variance"
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR16"
post_type: "FR"
auto_link_terms: "breaks are not unique|hist breaks error|R histogram error|breaks not unique"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R hist() Error: 'breaks are not unique' — Why Your Data Has No Spread

<p class="lead">The error <code>some 'breaks' are not unique</code> means <code>hist()</code> built bin edges that contain duplicates — almost always because your data has zero or near-zero spread, so the computed boundaries collapse onto the same number.</p>

## Why does R throw "breaks are not unique"?

`hist()` picks bin edges from `range(x)` and the chosen breaks rule (Sturges by default). If every value in `x` is the same, `diff(range(x))` is zero, so every edge lands on the same point and R refuses to draw overlapping bars. The block below reproduces the exact message with `tryCatch()` so you can compare it to what your console printed.

```r
# Reproduce the error on purpose
flat_data <- rep(5, 100)

err <- tryCatch(
  hist(flat_data, plot = FALSE),
  error = function(e) conditionMessage(e)
)
err
#> [1] "some 'breaks' are not unique"

# Confirm the root cause
diff(range(flat_data))
#> [1] 0
length(unique(flat_data))
#> [1] 1
```

The error text is literal — R is telling you that after it built the break vector, two or more entries were equal. The diagnostic lines confirm why: the range is zero and there is only one unique value. Any fix has to either give `hist()` a range to work with, or switch to a chart that doesn't need one.

[KEY INSIGHT]
**This error is a symptom, not a bug.** `hist()` is refusing to draw bins because the data has no spread to bin — the fix is to inspect the data, not to patch the plot call.

**Try it:** Build a vector of 50 zeros named `ex_zero`, pass it to `hist(..., plot = FALSE)` inside `tryCatch()`, and capture the error message.

```r
# Try it: reproduce the error with a vector of zeros
ex_zero <- # your code here

ex_msg <- tryCatch(
  hist(ex_zero, plot = FALSE),
  error = function(e) conditionMessage(e)
)
ex_msg
#> Expected: "some 'breaks' are not unique"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_zero <- rep(0, 50)
ex_msg <- tryCatch(
  hist(ex_zero, plot = FALSE),
  error = function(e) conditionMessage(e)
)
ex_msg
#> [1] "some 'breaks' are not unique"
```

**Explanation:** Any constant vector triggers the same error — the specific value (5, 0, 42) doesn't matter. What matters is that `length(unique(x)) == 1`.

</details>

## How do you detect low-variance columns before calling hist()?

If you loop over a data frame and call `hist()` on each numeric column, one sick column will kill the whole loop. Three cheap checks catch the problem before `hist()` ever runs: `var(x) > 0`, `length(unique(x)) > 1`, and `diff(range(x)) > 0`. Running them with `sapply()` gives you a per-column report in two lines.

```r
# Mixed data frame: one constant column, one normal
set.seed(7)
df <- data.frame(
  constant = rep(5, 100),
  normal   = rnorm(100, mean = 50, sd = 10)
)

col_stats <- sapply(df, function(x) c(
  var      = var(x),
  n_unique = length(unique(x)),
  spread   = diff(range(x))
))
col_stats
#>          constant    normal
#> var             0  96.77
#> n_unique        1  100.00
#> spread          0  46.83

# Flag the columns that will break hist()
names(df)[col_stats["n_unique", ] < 2]
#> [1] "constant"
```

The `constant` column shows up with `var = 0`, `n_unique = 1`, and `spread = 0` — any one of those three is a reliable flag. In production code you only need one check; `length(unique(x)) > 1` is the cheapest because it stops as soon as it finds a second distinct value.

[TIP]
**Guard every call to hist() in a loop.** Wrap the call in `if (length(unique(x)) > 1) hist(x) else message("skip: constant column")` so one bad column doesn't stop the whole batch.

**Try it:** Add a third column `ex_tiny` to `df` that contains 100 values from `rnorm(100, mean = 50, sd = 1e-9)`. Will the `length(unique) > 1` guard still clear it?

```r
# Try it: add a near-constant column and check the guard
df$ex_tiny <- # your code here

length(unique(df$ex_tiny)) > 1
#> Expected: TRUE (but hist() may still struggle — next section)
```

<details>
<summary>Click to reveal solution</summary>

```r
df$ex_tiny <- rnorm(100, mean = 50, sd = 1e-9)
length(unique(df$ex_tiny)) > 1
#> [1] TRUE
```

**Explanation:** The guard clears it because R stores doubles with ~15 digits of precision, so 100 draws with `sd = 1e-9` are almost all distinct. But the spread is tiny — the next section handles that case.

</details>

## How do you fix constant or near-constant data?

Once you know a column has no useful spread, there are three practical paths. Use `barplot(table(x))` when the data is truly constant — it's the honest chart. Use `jitter()` when you want to *visualize* tiny noise that's invisible at the default resolution. Use manual `seq()` breaks when you want `hist()` to draw a single bar around the constant value.

```r
# Fix 1: barplot is the honest chart for constant data
barplot(table(flat_data),
        main = "flat_data (constant = 5)",
        col  = "steelblue")

# Fix 2: jitter adds spread just for visualization
set.seed(1)
hist(jitter(flat_data, amount = 0.5),
     main = "flat_data with jitter",
     col  = "coral")

# Fix 3: manual breaks around the constant value
hist(flat_data,
     breaks = seq(4.5, 5.5, by = 0.25),
     main   = "flat_data with manual breaks",
     col    = "lightgreen")
```

The barplot version is correct but boring — a single bar of height 100. The jittered version looks like a real histogram, but the spread is artificial. The manual-breaks version is the best compromise if you need a histogram in a panel of other histograms: the chart type stays consistent and readers see one tall bar centered on 5.

[WARNING]
**jitter() invents spread that isn't in the data.** Only use it for visualization. Never run statistics on jittered values — you'll be reporting noise you injected yourself.

**Try it:** Use `hist()` with manual `breaks = seq(4, 6, by = 0.5)` on `flat_data` and confirm it renders without error.

```r
# Try it: manual breaks straddling the constant value
ex_breaks <- seq(4, 6, by = 0.5)
hist(flat_data, breaks = ex_breaks,
     main = "ex: manual breaks", col = "plum")
#> Expected: a single-bar histogram centered on 5
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_breaks <- seq(4, 6, by = 0.5)
hist(flat_data, breaks = ex_breaks,
     main = "ex: manual breaks", col = "plum")
```

**Explanation:** As long as the break vector has at least two distinct values *and* brackets the data range, `hist()` is happy. The bar lands in the `(4.5, 5]` bin.

</details>

## How do you fix duplicate manual or quantile breaks?

Even when your data has plenty of spread, you can still hand `hist()` a bad break vector. The two common failure modes are a hardcoded vector with a typo and a break vector generated from `quantile()` on tied data. Both trigger the same error, and both are fixed by `sort(unique(...))` — though the quantile version is usually a hint that `barplot()` is a better fit.

```r
# Tied data: only values 1 and 2, 50 of each
tied <- c(rep(1, 50), rep(2, 50))

# quantile() returns duplicated edges because of the ties
q_breaks <- quantile(tied, probs = seq(0, 1, 0.1))
q_breaks
#>   0%  10%  20%  30%  40%  50%  60%  70%  80%  90% 100%
#>    1    1    1    1    1    1    2    2    2    2    2

# This errors: "some 'breaks' are not unique"
# hist(tied, breaks = q_breaks)

# Rescue 1: drop duplicates
hist(tied, breaks = unique(q_breaks),
     main = "rescued with unique()", col = "skyblue")

# Rescue 2 (cleaner): tied data is really discrete — use barplot
barplot(table(tied),
        main = "tied as barplot", col = "skyblue")
```

`quantile()` returned six `1`s and five `2`s because the 10th through 50th percentiles of the data are all exactly `1`. `unique()` collapses the break vector to just `c(1, 2)` and `hist()` draws a single bin — technically correct but not informative. The `barplot(table(tied))` version is usually what you actually wanted: two bars, one per discrete level.

[NOTE]
**`cut()` errors with the same message.** If you're binning a variable with `cut(x, breaks = quantile(x, ...))` and see `'breaks' are not unique`, apply the same `unique()` rescue — or switch to `cut(x, breaks = unique(...), include.lowest = TRUE)`.

**Try it:** Given `c(rep(1, 50), rep(2, 50))`, build a quantile break vector at deciles, fix the duplicates, and count how many unique edges remain.

```r
# Try it: fix the quantile pipeline
ex_tied <- c(rep(1, 50), rep(2, 50))
ex_q    <- quantile(ex_tied, probs = seq(0, 1, 0.1))
ex_fix  <- # your code here

length(ex_fix)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_tied <- c(rep(1, 50), rep(2, 50))
ex_q    <- quantile(ex_tied, probs = seq(0, 1, 0.1))
ex_fix  <- sort(unique(ex_q))
length(ex_fix)
#> [1] 2
```

**Explanation:** After `unique()` the vector holds only `1` and `2`. Two edges make one bin — a sign that a barplot would communicate more than a histogram here.

</details>

## Practice Exercises

### Exercise 1: Build a safe hist() wrapper

Write `my_safe_hist(x)` that does two things. If `length(unique(x)) < 2`, print a one-line diagnostic with `message()` and return `invisible(NULL)`. Otherwise, call `hist(x, main = "safe hist")` and return `invisible(NULL)`. Test it on `rep(7, 50)` (should skip) and `rnorm(200)` (should plot).

```r
# Exercise: safe hist wrapper
# Hint: check length(unique(x)) before calling hist()

my_safe_hist <- function(x) {
  # your code here
}

my_safe_hist(rep(7, 50))
my_safe_hist(rnorm(200))
```

<details>
<summary>Click to reveal solution</summary>

```r
my_safe_hist <- function(x) {
  if (length(unique(x)) < 2) {
    message("skip: x has ", length(unique(x)), " unique value(s)")
    return(invisible(NULL))
  }
  hist(x, main = "safe hist", col = "steelblue")
  invisible(NULL)
}

my_safe_hist(rep(7, 50))
#> skip: x has 1 unique value(s)
my_safe_hist(rnorm(200))
#> (plots a normal histogram)
```

**Explanation:** The guard catches the constant case before `hist()` ever runs, so the function never throws the `'breaks' are not unique` error. Using `message()` (not `print()`) keeps the diagnostic out of normal output streams.

</details>

### Exercise 2: Column-wise dispatch

Given a data frame with four numeric columns — one constant, one near-constant, two normal — loop over columns and pick the right chart per column. Skip the constant one, jitter the near-constant one, plot the normal ones directly. Save each decision (`"skip"`, `"jitter"`, `"plot"`) to a named character vector `my_plot_log`.

```r
# Exercise: column-wise dispatch
# Hint: branch on length(unique(x)) and diff(range(x))

set.seed(11)
my_df <- data.frame(
  const = rep(3, 100),
  tiny  = rnorm(100, mean = 0, sd = 1e-6),
  n1    = rnorm(100, mean = 10, sd = 2),
  n2    = rnorm(100, mean = 20, sd = 5)
)

my_plot_log <- character(ncol(my_df))
names(my_plot_log) <- names(my_df)

# Write your loop below:
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(11)
my_df <- data.frame(
  const = rep(3, 100),
  tiny  = rnorm(100, mean = 0, sd = 1e-6),
  n1    = rnorm(100, mean = 10, sd = 2),
  n2    = rnorm(100, mean = 20, sd = 5)
)

my_plot_log <- character(ncol(my_df))
names(my_plot_log) <- names(my_df)

for (nm in names(my_df)) {
  x <- my_df[[nm]]
  if (length(unique(x)) < 2) {
    my_plot_log[nm] <- "skip"
  } else if (diff(range(x)) < 1e-4) {
    hist(jitter(x, amount = 1e-4), main = nm, col = "coral")
    my_plot_log[nm] <- "jitter"
  } else {
    hist(x, main = nm, col = "steelblue")
    my_plot_log[nm] <- "plot"
  }
}
my_plot_log
#>    const     tiny       n1       n2
#>   "skip" "jitter"   "plot"   "plot"
```

**Explanation:** The loop uses two thresholds. `length(unique(x)) < 2` catches truly constant columns; `diff(range(x)) < 1e-4` catches near-constant ones that would draw a useless one-bar histogram at default settings. Each decision is logged so you can audit the plots later.

</details>

## Complete Example

Here is the full pattern you would ship in a reporting pipeline — inspect each numeric column, pick a chart, plot it, and return a decision log.

```r
# End-to-end: safe histogram for every numeric column
set.seed(99)
demo_df <- data.frame(
  id     = 1:200,
  flat   = rep(42, 200),
  noise  = rnorm(200, mean = 0, sd = 1e-8),
  height = rnorm(200, mean = 170, sd = 8),
  weight = rnorm(200, mean = 70,  sd = 12)
)

chart_for <- function(x, nm) {
  if (!is.numeric(x))                 return("not numeric")
  if (length(unique(x)) < 2)          return("constant -> barplot")
  if (diff(range(x)) < 1e-6)          return("near-constant -> jitter")
  return("normal -> hist")
}

decisions <- sapply(names(demo_df), function(nm) chart_for(demo_df[[nm]], nm))
decisions
#>                      id                    flat                   noise
#>         "normal -> hist"   "constant -> barplot" "near-constant -> jitter"
#>                  height                  weight
#>         "normal -> hist"        "normal -> hist"

# Plot using the dispatch table
for (nm in names(demo_df)) {
  x <- demo_df[[nm]]
  if (decisions[[nm]] == "constant -> barplot") {
    barplot(table(x), main = nm, col = "steelblue")
  } else if (decisions[[nm]] == "near-constant -> jitter") {
    hist(jitter(x, amount = 1e-6), main = nm, col = "coral")
  } else if (decisions[[nm]] == "normal -> hist") {
    hist(x, main = nm, col = "lightgreen")
  }
}
```

The `decisions` vector is your audit trail. In a real pipeline you would log it alongside the plots so a reviewer can see *why* the `flat` column became a barplot and the `noise` column became a jittered histogram — without that log, an unexpected chart type looks like a bug instead of a deliberate choice.

## Summary

| Symptom | Root cause | Fix |
|---|---|---|
| All values identical | Zero range → duplicate edges | `barplot(table(x))` |
| Near-constant data, many requested breaks | Spread below bin resolution | Reduce breaks or `jitter()` |
| Manual `breaks = c(...)` with a repeat | Typo in the vector | `sort(unique(breaks))` |
| `quantile()`-derived breaks on tied data | Tied values collapse quantiles | `unique(quantile(...))` — or `barplot` |
| Discrete integer data, narrow range | Few unique values | `seq(min - 0.5, max + 0.5, by = 1)` |

The common thread: the error is about your data, not your plot call. Inspect `length(unique(x))` first; the right fix follows from the answer.

## References

1. R Core Team — `?hist` documentation, stats package reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/graphics/html/hist.html)
2. Venables, W. N. & Ripley, B. D. — *Modern Applied Statistics with S*, 4th Edition, Chapter 5: Graphics. Springer (2002).
3. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition, Chapter on histograms and density plots. [Link](https://ggplot2-book.org/statistical-summaries)
4. R source — `hist.default()` implementation in the `graphics` package. [Link](https://github.com/wch/r-source/blob/trunk/src/library/graphics/R/hist.R)
5. R Core Team — `?cut` documentation (same error shape, same fix). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/cut.html)

## Continue Learning

1. **R Common Errors** — the full reference for `Error in ...` messages you'll meet in base R.
2. **R Error: singular matrix in solve()** — another "your data is degenerate" message with a similar fix pattern.
3. **R Error in read.csv: more columns than column names** — parsing errors that hit before you ever get to plot.
