---
title: "R Warning: longer object length is not a multiple of shorter"
slug: "R-Warning-Object-Length"
description: "Fix the R warning 'longer object length is not a multiple of shorter object length'. Understand vector recycling rules and how to avoid silent data corruption."
keywords: "R longer object length, R vector recycling, R unequal vector lengths, R recycling warning, R vector length mismatch, R shorter object"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR14"
post_type: "FR"
auto_link_terms: "longer object length|not a multiple of shorter"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# R Warning: longer object length is not a multiple of shorter

<p class="lead"><code>Warning: longer object length is not a multiple of shorter object length</code> appears when R tries to combine two vectors of different lengths and the shorter one doesn't divide evenly into the longer one. R still recycles, but the result is likely wrong.</p>

## The Warning

```r
# Reproduce the warning:
x <- c(1, 2, 3, 4, 5)   # length 5
y <- c(10, 20)            # length 2

result <- x + y
cat("x:", x, "\n")
cat("y:", y, "\n")
cat("x + y:", result, "\n")
cat("R recycled y as: 10, 20, 10, 20, 10\n")
cat("5 is not a multiple of 2, so R warns you.\n")
```

## How Vector Recycling Works

R automatically repeats the shorter vector to match the longer one:

```r
# When lengths divide evenly: NO warning
a <- c(1, 2, 3, 4, 5, 6)  # length 6
b <- c(10, 20, 30)          # length 3 (divides into 6)
cat("No warning:", a + b, "\n")
cat("b recycled as: 10, 20, 30, 10, 20, 30\n\n")

# When lengths don't divide evenly: WARNING
c <- c(1, 2, 3, 4, 5)  # length 5
d <- c(10, 20, 30)       # length 3 (doesn't divide into 5)
cat("With warning:", c + d, "\n")
cat("d recycled as: 10, 20, 30, 10, 20 (truncated!)\n")
```

Recycling with length-1 vectors (scalars) is intentional and never warns: `x * 2` multiplies every element by 2.

## Cause 1: Accidentally Unequal Vectors

The most common case — you meant the vectors to be the same length:

```r
names <- c("Alice", "Bob", "Carol", "Dave")
scores <- c(88, 92, 75)  # Oops! Forgot Dave's score

cat("names:", length(names), "elements\n")
cat("scores:", length(scores), "elements\n")

# Creating a data frame would error:
# data.frame(name = names, score = scores)

# Fix: make sure vectors are the same length
scores_fixed <- c(88, 92, 75, 81)  # add the missing score
df <- data.frame(name = names, score = scores_fixed)
print(df)
```

**Fix:** Check `length()` of both vectors. Ensure they match before combining. `data.frame()` is stricter and will error instead of warning.

## Cause 2: Conditional Subsetting Creates Unequal Lengths

Filtering one vector but not its pair:

```r
x <- 1:10
y <- 11:20

# Filter only x, forget to filter y
x_filtered <- x[x > 5]
cat("x_filtered:", x_filtered, "(length", length(x_filtered), ")\n")
cat("y:", y, "(length", length(y), ")\n")

# This would recycle with a warning
result <- x_filtered + y
cat("Mismatched addition:", result, "\n")

# Fix: apply the same filter to both
mask <- x > 5
x_fix <- x[mask]
y_fix <- y[mask]
cat("\nFiltered both:", x_fix + y_fix, "\n")
```

**Fix:** Apply the same logical filter to all related vectors. Or store them in a data frame and subset rows.

## Cause 3: Off-by-One from Diff, Lag, or Slice Operations

Functions like `diff()` return a vector one element shorter:

```r
values <- c(10, 15, 13, 20, 18)
changes <- diff(values)  # length 4, not 5

cat("values:", values, "(length", length(values), ")\n")
cat("changes:", changes, "(length", length(changes), ")\n")

# Trying to combine them would warn:
# data.frame(value = values, change = changes)  # Error: different lengths

# Fix option 1: pad with NA
changes_padded <- c(NA, changes)
cat("Padded:", changes_padded, "\n")

# Fix option 2: trim the original
values_trimmed <- values[-1]
cat("Trimmed:", values_trimmed, "\n")
cat("Now both length:", length(values_trimmed), "\n")
```

**Fix:** Pad the shorter vector with `NA` at the start/end, or trim the longer vector to match.

## Cause 4: Matrix Operations with Wrong Dimensions

```r
mat <- matrix(1:12, nrow = 3, ncol = 4)
cat("Matrix (3x4):\n")
print(mat)

# Adding a vector of wrong length
v <- c(10, 20, 30, 40, 50)  # length 5, matrix has 12 elements
# mat + v  # Warning: 12 is not a multiple of 5

# Fix: match vector length to rows or columns
row_add <- c(100, 200, 300)      # length 3 = nrow
col_add <- c(10, 20, 30, 40)     # length 4 = ncol

# Adding to each column (recycles down rows)
cat("Add by row:", "\n")
print(mat + row_add)
```

**Fix:** Make sure vector length matches the matrix dimension you're operating on.

## Cause 5: Merge or Comparison of Different-Length Groups

```r
group_a <- c(85, 90, 78, 92)     # 4 students
group_b <- c(88, 76, 95)          # 3 students

# Comparing directly warns:
# group_a - group_b  # Warning

# Fix: don't compare element-wise when groups have different sizes
cat("Group A mean:", mean(group_a), "\n")
cat("Group B mean:", mean(group_b), "\n")
cat("Difference in means:", mean(group_a) - mean(group_b), "\n")

# Or use a proper statistical test
t_result <- t.test(group_a, group_b)
cat("t-test p-value:", t_result$p.value, "\n")
```

**Fix:** Use summary statistics or statistical tests for comparing groups of different sizes. Don't do element-wise operations.

## Practice Exercise

```r
# Exercise: This code produces a recycling warning. Fix it properly.

months <- c("Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
revenue <- c(100, 120, 115, 130)  # Only Q1 data

# This warns because 12 is not a multiple of 4... wait, it IS a multiple.
# But the intent is wrong — we only have 4 months of data, not 12.

# Fix: only use matching data

```

<details>
<summary>Click to reveal solution</summary>

```r
months <- c("Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
revenue <- c(100, 120, 115, 130)  # Only Q1 data

# Problem: recycling would silently repeat Q1 data for all 12 months!
# Even though 12 is a multiple of 4, the result is WRONG.

# Fix: only combine matching data
q1_months <- months[1:4]
q1_data <- data.frame(month = q1_months, revenue = revenue)
cat("Q1 data only:\n")
print(q1_data)

# Or pad revenue with NA for missing months
full_revenue <- c(revenue, rep(NA, 8))
full_data <- data.frame(month = months, revenue = full_revenue)
cat("\nFull year (with NAs for missing months):\n")
print(full_data)
```

**Explanation:** This is a subtle case. R would NOT warn here because 12 is a multiple of 4 — so recycling happens silently. But the result is wrong: it repeats Q1 revenue for Q2, Q3, Q4. The fix is to either only use 4 months or pad with NAs. Silent recycling without a warning is the most dangerous case.

</details>

## Summary

| Cause | Fix | Prevention |
|-------|-----|------------|
| Unequal vectors | Match lengths before combining | Check `length()` on both |
| Filtered one but not the other | Apply same filter to all | Store related vectors in a data frame |
| diff/lag returns shorter vector | Pad with NA or trim | Account for length change |
| Matrix dimension mismatch | Match vector to nrow or ncol | Check `dim()` first |
| Different group sizes | Use summary stats or tests | Don't compare element-wise |

## FAQ

### Is vector recycling ever intentional?

Yes — recycling a scalar (length 1) is standard R: `x * 2` or `x + 1`. Recycling with length matching the dimension (e.g., adding a 3-element vector to a 3-row matrix) is also intentional. The warning only fires when the lengths don't divide evenly.

### Why does R recycle at all instead of just erroring?

Recycling is a core R design feature inherited from S. It enables concise vectorized code like `x * 2` or `matrix + row_vector`. The trade-off is that it can silently produce wrong results when lengths are accidentally mismatched. Many R users consider the silent (no-warning) recycling case more dangerous.

## What's Next?

1. **R Error: argument is not a matrix** — apply() on wrong object types
2. **R Error: subscript out of bounds** — indexing errors
3. **R Common Errors** — the full reference of 50 common errors
