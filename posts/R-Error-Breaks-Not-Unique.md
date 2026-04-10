---
title: "R Error: breaks are not unique in hist() — Bin Width Fix"
slug: "R-Error-Breaks-Not-Unique"
description: "Fix the R error 'breaks are not unique' in hist(). Learn causes: constant data, too many breaks, manual break errors, and solutions for proper histograms."
keywords: "R breaks not unique, R hist error, R histogram breaks, R hist bin width, R histogram constant data, R hist breaks fix"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR16"
post_type: "FR"
auto_link_terms: "breaks are not unique|hist breaks error"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# R Error: breaks are not unique in hist() — Bin Width Fix

<p class="lead"><code>Error in hist.default(x, ...) : some 'breaks' are not unique</code> means the bin boundaries you gave to <code>hist()</code> have duplicate values. This happens with constant data, zero-range data, or incorrect manual break vectors.</p>

## The Error

```r
# Reproduce the error:
constant_data <- rep(5, 100)  # all values are 5

# hist() tries to create breaks but range is zero
# hist(constant_data)
# Error: some 'breaks' are not unique

cat("Data range:", range(constant_data), "\n")
cat("When all values are identical, R can't create distinct bin edges.\n")
```

## Cause 1: Constant or Zero-Variance Data

All values are the same, so there's no range to divide into bins:

```r
x <- rep(42, 50)
cat("All values:", unique(x), "\n")
cat("Variance:", var(x), "\n")

# Fix 1: add a small buffer to create a range
cat("\nFix 1: Use explicit breaks around the value\n")
hist(x, breaks = seq(41, 43, by = 0.5),
     main = "Constant Data Histogram", col = "steelblue")

# Fix 2: check for constant data first
if (length(unique(x)) == 1) {
  cat("Fix 2: Data is constant at", unique(x), "\n")
  cat("A histogram is not meaningful for constant data.\n")
  cat("Use barplot() instead.\n")
}
```

**Fix:** Check `var(x) > 0` or `length(unique(x)) > 1` before calling `hist()`. For constant data, use `barplot()` instead.

## Cause 2: Nearly Constant Data with Too Many Breaks

The data has a tiny range but you request many bins:

```r
# Data with very small range
set.seed(1)
x <- rnorm(100, mean = 50, sd = 0.001)
cat("Range:", range(x), "\n")
cat("Spread:", diff(range(x)), "\n")

# Requesting many breaks on tiny range can fail
# hist(x, breaks = 100)  # May error: breaks not unique

# Fix: let R choose breaks automatically, or use fewer bins
hist(x, breaks = 10,
     main = "Nearly Constant Data", col = "coral")

cat("\nWhen range is tiny, use fewer breaks.\n")
```

**Fix:** Reduce the number of breaks, or let R choose automatically with `breaks = "Sturges"` (the default).

## Cause 3: Manual Breaks with Duplicate Values

Your break vector has repeated values:

```r
# Wrong: duplicate break point at 20
bad_breaks <- c(0, 10, 20, 20, 30, 40)
cat("Bad breaks:", bad_breaks, "\n")
cat("Has duplicates:", any(duplicated(bad_breaks)), "\n")

# Fix: remove duplicates and sort
good_breaks <- sort(unique(bad_breaks))
cat("Good breaks:", good_breaks, "\n")

# Now hist works
x <- runif(200, min = 0, max = 40)
hist(x, breaks = good_breaks,
     main = "Fixed Manual Breaks", col = "lightgreen")
```

**Fix:** Use `sort(unique(breaks))` to remove duplicates from manual break vectors.

## Cause 4: Programmatically Generated Breaks That Collapse

When computing breaks from data, edge cases can create duplicates:

```r
# Example: breaks based on quantiles with tied values
x <- c(rep(1, 50), rep(2, 30), rep(3, 20))
cat("Data:", table(x), "\n")

q <- quantile(x, probs = seq(0, 1, 0.1))
cat("Quantile breaks:", q, "\n")
cat("Many duplicates!\n")

# Fix: use unique breaks
unique_breaks <- unique(q)
cat("Unique breaks:", unique_breaks, "\n")

# Better approach for discrete data: use barplot
barplot(table(x), main = "Discrete Data", col = "plum")
```

**Fix:** When generating breaks from data with ties, apply `unique()` to the breaks. For discrete data, prefer `barplot(table(x))` over `hist()`.

## Cause 5: Integer Data with Narrow Range

Integer data with few unique values often causes this:

```r
# Dice rolls: only values 1-6
set.seed(42)
rolls <- sample(1:6, 100, replace = TRUE)
cat("Unique values:", sort(unique(rolls)), "\n")

# Fix 1: use breaks that span half-integers
hist(rolls, breaks = seq(0.5, 6.5, by = 1),
     main = "Dice Rolls", col = "skyblue",
     xlab = "Face Value")

# Fix 2: use barplot for integer/count data
cat("\nBarplot is often better for integer data:\n")
barplot(table(rolls), main = "Dice Rolls (barplot)",
        col = "skyblue")
```

**Fix:** For integer data, set breaks at half-integers: `seq(min(x) - 0.5, max(x) + 0.5, by = 1)`. Or use `barplot(table(x))`.

## Practice Exercise

```r
# Exercise: Create a histogram for this data that might
# have issues with breaks. Handle edge cases gracefully.

set.seed(99)
data_list <- list(
  normal = rnorm(200, mean = 50, sd = 10),
  constant = rep(25, 200),
  discrete = sample(1:3, 200, replace = TRUE)
)

# Write a safe_hist() function that handles all three cases:

```

<details>
<summary>Click to reveal solution</summary>

```r
safe_hist <- function(x, ...) {
  # Check for empty or all-NA
  x <- x[!is.na(x)]
  if (length(x) == 0) {
    cat("No data to plot.\n")
    return(invisible(NULL))
  }

  # Check for constant data
  if (length(unique(x)) == 1) {
    cat("Constant data at", unique(x), "- using barplot.\n")
    barplot(table(x), ...)
    return(invisible(NULL))
  }

  # Check for discrete data (few unique values)
  if (length(unique(x)) <= 10 && all(x == round(x))) {
    cat("Discrete data - using aligned breaks.\n")
    breaks <- seq(min(x) - 0.5, max(x) + 0.5, by = 1)
    hist(x, breaks = breaks, ...)
    return(invisible(NULL))
  }

  # Normal case
  hist(x, ...)
}

set.seed(99)
data_list <- list(
  normal = rnorm(200, mean = 50, sd = 10),
  constant = rep(25, 200),
  discrete = sample(1:3, 200, replace = TRUE)
)

for (nm in names(data_list)) {
  cat("\n---", nm, "---\n")
  safe_hist(data_list[[nm]], main = nm, col = "steelblue")
}
```

**Explanation:** The function handles three cases: constant data (uses barplot), discrete data with few unique integers (uses half-integer breaks), and continuous data (uses default hist). This prevents the "breaks not unique" error in all cases.

</details>

## Summary

| Cause | Fix | Prevention |
|-------|-----|------------|
| Constant data (zero variance) | Use `barplot()` or add buffer | Check `var(x) > 0` first |
| Tiny range + many breaks | Reduce number of breaks | Let R choose: `breaks = "Sturges"` |
| Duplicate manual breaks | `sort(unique(breaks))` | Build break vectors carefully |
| Quantile breaks with ties | Apply `unique()` to breaks | Check for tied values |
| Integer data, narrow range | Use `seq(min-0.5, max+0.5, 1)` | Use `barplot(table(x))` for counts |

## FAQ

### What is the default number of breaks in hist()?

R uses the "Sturges" method by default, which computes `ceiling(log2(n) + 1)` bins where n is the number of data points. For 100 observations, that's about 8 bins. You can also try `"FD"` (Freedman-Diaconis) or `"Scott"` for alternative bin widths.

### Can I use hist() with non-numeric data?

No. `hist()` only works with numeric vectors. For categorical data, use `barplot(table(x))`. For date/time data, convert to numeric first or use `hist.Date()` / `hist.POSIXct()`.

## Continue Learning

1. **R Error in read.csv: more columns than column names** — CSV parsing fixes
2. **R Error: singular matrix in solve()** — near-singular matrix solutions
3. **R Common Errors** — the full reference of 50 common errors
