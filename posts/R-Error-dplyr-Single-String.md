---
title: "dplyr Error: must return a single string in group_by — Exact Fix"
slug: "R-Error-dplyr-Single-String"
description: "Fix the dplyr error where summarise must return a single value per group. Learn causes: multiple values per group, type mismatches, and the correct solutions."
keywords: "dplyr summarise error, R group_by error, dplyr single value, summarise multiple values, R dplyr troubleshooting, group_by summarise fix"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR11"
post_type: "FR"
auto_link_terms: "dplyr single string error|summarise must return single value"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# dplyr Error: must return a single string in group_by — Exact Fix

<p class="lead">When <code>summarise()</code> returns more than one value per group or a value of the wrong type, dplyr throws an error. The message varies by version but the root cause is the same: your summary function doesn't collapse each group to a single scalar value.</p>

## The Error

```r
# The error looks like one of these (depends on dplyr version):
# Error: Column `x` must return a single string or a length 1 vector
# Error: `x` must be a single string, not a character vector of length 3

cat("This error means your summarise() function returned multiple values\n")
cat("when dplyr expected exactly one value per group.\n")
```

## Cause 1: Summary Function Returns Multiple Values

Using a function that returns a vector instead of a scalar inside `summarise()`:

```r
df <- data.frame(
  group = c("A", "A", "A", "B", "B", "B"),
  value = c(10, 20, 30, 40, 50, 60)
)

# range() returns 2 values (min and max) - this would error:
# library(dplyr)
# df %>% group_by(group) %>% summarise(r = range(value))

# Fix: use functions that return exactly one value
cat("Single-value functions:\n")
cat("  mean(), median(), sum(), min(), max(), n(), first(), last()\n")
cat("  sd(), var(), IQR(), n_distinct()\n\n")

# If you need range, split into two columns:
result <- aggregate(value ~ group, data = df,
                    FUN = function(x) c(min = min(x), max = max(x)))
cat("Min and max per group:\n")
print(result)
```

**Fix:** Use scalar summary functions (`mean`, `sum`, `min`, `max`, `n`). If you need multiple values, create separate columns for each.

## Cause 2: Pasting Multiple Values Without Collapsing

Trying to combine text values per group without `collapse`:

```r
df <- data.frame(
  team = c("A", "A", "B", "B", "B"),
  player = c("Alice", "Bob", "Carol", "Dave", "Eve")
)

# paste() without collapse returns a vector per group - error!
# df %>% group_by(team) %>% summarise(players = paste(player))

# Fix: use collapse to combine into a single string
result <- aggregate(player ~ team, data = df,
                    FUN = function(x) paste(x, collapse = ", "))
cat("Players per team:\n")
print(result)
```

**Fix:** Always use `paste(x, collapse = ", ")` inside `summarise()` when combining text, not just `paste(x)`.

## Cause 3: Wrong Function for the Data Type

Using a numeric summary on character data, or vice versa:

```r
df <- data.frame(
  group = c("A", "A", "B", "B"),
  status = c("pass", "fail", "pass", "pass"),
  score = c(85, 60, 90, 78)
)

# mean() on character column would error
# df %>% group_by(group) %>% summarise(avg = mean(status))

# Fix: use appropriate functions for each type
cat("For numeric columns: mean(), sum(), sd()\n")
cat("For character columns: paste(collapse=','), first(), n_distinct()\n")
cat("For logical columns: sum() (counts TRUE), mean() (proportion TRUE)\n\n")

# Correct approach
result <- aggregate(cbind(pass_rate = score) ~ group, data = df, FUN = mean)
print(result)
```

**Fix:** Match your summary function to the column type. Use `str(df)` to check types before summarizing.

## Cause 4: Using list() or c() in summarise

Returning a list or combined vector instead of a scalar:

```r
df <- data.frame(
  category = c("X", "X", "Y", "Y"),
  val = c(1, 2, 3, 4)
)

# These would error in summarise():
# summarise(df, result = c(mean(val), sd(val)))    # returns length 2
# summarise(df, result = list(val))                  # returns a list

# Fix: one column per summary statistic
cat("Correct pattern:\n")
cat("  summarise(mean_val = mean(val), sd_val = sd(val))\n\n")

result <- data.frame(
  category = c("X", "Y"),
  mean_val = c(mean(df$val[df$category == "X"]),
               mean(df$val[df$category == "Y"])),
  sd_val = c(sd(df$val[df$category == "X"]),
             sd(df$val[df$category == "Y"]))
)
print(result)
```

**Fix:** Create a separate column for each summary statistic instead of combining them into one column.

## Practice Exercise

```r
# Exercise: Fix this grouped summary so it returns one row per group.
# For each group, compute:
#   - avg_score: mean of score
#   - players: all names combined into one string
#   - score_range: max(score) - min(score) (single number)

df <- data.frame(
  team = c("Red", "Red", "Red", "Blue", "Blue"),
  name = c("Ana", "Ben", "Cat", "Dan", "Eve"),
  score = c(88, 72, 95, 80, 91)
)

# Write your solution using base R or dplyr:

```

<details>
<summary>Click to reveal solution</summary>

```r
df <- data.frame(
  team = c("Red", "Red", "Red", "Blue", "Blue"),
  name = c("Ana", "Ben", "Cat", "Dan", "Eve"),
  score = c(88, 72, 95, 80, 91)
)

# Base R solution using aggregate and merge
avg <- aggregate(score ~ team, data = df, FUN = mean)
names(avg)[2] <- "avg_score"

players <- aggregate(name ~ team, data = df,
                     FUN = function(x) paste(x, collapse = ", "))
names(players)[2] <- "players"

score_range <- aggregate(score ~ team, data = df,
                         FUN = function(x) max(x) - min(x))
names(score_range)[2] <- "score_range"

result <- merge(merge(avg, players), score_range)
print(result)
```

**Explanation:** Each summary function returns exactly one value per group: `mean()` for avg_score, `paste(collapse=", ")` for players, and `max() - min()` for score_range. Each produces a scalar per group, avoiding the error.

</details>

## Summary

| Cause | Fix | Prevention |
|-------|-----|------------|
| Function returns multiple values | Use scalar functions (mean, sum, min) | Check function return length |
| paste() without collapse | Add `collapse = ", "` | Always use collapse in summarise |
| Wrong type for function | Match function to column type | Check `str(df)` first |
| c() or list() in summarise | One column per statistic | Create separate named columns |

## FAQ

### What changed between dplyr versions regarding this error?

In dplyr 1.0+, `summarise()` can return multiple rows per group if `.groups` is set. But each column must still be length 1 or the same length. In older versions, any non-scalar result was an error. If your code works in one version but not another, check `packageVersion("dplyr")`.

### Can I return a list column from summarise?

Yes. Wrap the result in `list()`: `summarise(data = list(val))` creates a list column. This is useful for nested data frames but is an advanced pattern. For simple summaries, stick to scalar values.

## Continue Learning

1. **R Error: could not find function 'X'** — namespace and package conflicts
2. **ggplot2 Error: object 'X' not found** — data vs environment mapping
3. **R Common Errors** — the full reference of 50 common errors
