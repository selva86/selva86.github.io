---
title: "R Error: object 'x' not found — 7 Causes & Step-by-Step Fixes"
slug: "R-Error-Object-Not-Found"
description: "Fix the 'object not found' error in R. Learn the 7 most common causes: typos, scope issues, missing packages, lazy evaluation, and how to solve each one."
keywords: "R object not found, R error object not found, R variable not found, R name error, R undefined variable, R could not find"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR1"
post_type: "FR"
auto_link_terms: "object not found|object 'x' not found"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# R Error: object 'x' not found — 7 Causes & Step-by-Step Fixes

<p class="lead"><code>Error: object 'x' not found</code> is the single most common R error. It means R searched all environments on the search path and couldn't find a variable with that name. Here are the 7 causes and how to fix each one.</p>

## Cause 1: Typo in Variable Name

The most common cause — you spelled the variable differently when creating it vs. using it:

```r
# Wrong
my_data <- c(1, 2, 3)
# my_Data  # Error: object 'my_Data' not found (capital D)

# Fix: match the exact spelling and case
cat("Correct:", my_data, "\n")

# Tip: use ls() to see what's defined
cat("Defined variables:", paste(ls(), collapse = ", "), "\n")
```

**Fix:** R is case-sensitive. `myData`, `mydata`, and `my_data` are three different names. Use `ls()` to see what's defined, or use tab completion in RStudio.

## Cause 2: Variable Not Yet Created

You're using a variable before assigning it — often because you ran code out of order:

```r
# If you run this line first, 'result' doesn't exist yet:
# cat(result)  # Error: object 'result' not found

# You need to run this first:
result <- 42
cat("result:", result, "\n")
```

**Fix:** In RStudio, run your script from the top. In R Markdown, make sure chunks are in the right order. Use `exists("varname")` to check.

## Cause 3: Variable Defined in a Different Scope

A variable created inside a function doesn't exist outside:

```r
my_function <- function() {
  internal_value <- 999
  cat("Inside:", internal_value, "\n")
}

my_function()

# internal_value doesn't exist here
cat("exists?", exists("internal_value"), "\n")

# Fix: return the value from the function
my_function_fixed <- function() {
  internal_value <- 999
  internal_value  # return it
}

result <- my_function_fixed()
cat("Got it:", result, "\n")
```

**Fix:** Return values from functions and assign the result: `x <- my_function()`.

## Cause 4: Package Not Loaded

You're calling a function from a package you haven't loaded:

```r
# This would fail without loading the package:
# result <- tibble(x = 1:3)
# Error: could not find function "tibble"

# Fix: load the package first
# library(tibble)
# result <- tibble(x = 1:3)

# Or use :: to be explicit without loading:
# result <- tibble::tibble(x = 1:3)

cat("Fix: library(package) or package::function()\n")
```

**Fix:** `library(package_name)` at the top of your script. Or use `package::function()`.

## Cause 5: Column Name Error in dplyr/ggplot2

Non-standard evaluation (NSE) in tidyverse functions looks for column names, not regular variables:

```r
df <- data.frame(price = c(10, 20, 30), qty = c(5, 3, 8))

# If you use a wrong column name in a dplyr-style context:
# df[df$quantity > 3, ]  # NULL — 'quantity' doesn't exist, it's 'qty'

# Check available columns first
cat("Columns:", paste(names(df), collapse = ", "), "\n")

# Correct subsetting
result <- df[df$qty > 3, ]
print(result)
```

**Fix:** Check `names(df)` before subsetting. Watch for `quantity` vs `qty`, `name` vs `Name`, etc.

## Cause 6: Forgot to Load a Dataset

You're referencing a built-in dataset that needs `data()` first:

```r
# Some datasets are lazily loaded
# In some contexts, you need data() first:
data(mtcars)
cat("mtcars loaded:", nrow(mtcars), "rows\n")

# For package datasets:
# data(dataset_name, package = "package_name")
```

**Fix:** Run `data(dataset_name)` or check available datasets with `data()`.

## Cause 7: Variable Lost After Restart

When you restart R, all variables in the global environment are gone:

```r
# After restarting R, everything is cleared
# Saving .RData can mask this issue (not recommended)

cat("Best practice:\n")
cat("1. Put all code in a script (.R file)\n")
cat("2. Set RStudio to NOT save .RData on exit\n")
cat("3. Run your full script with source()\n")
cat("4. If everything runs clean, your code is reproducible\n")
```

**Fix:** Never rely on objects from a previous session. Your script should create everything it needs.

## Diagnostic Checklist

```r
# When you get 'object not found', run through this:
target <- "my_variable"

# 1. Is it defined?
cat("1. Exists?", exists(target), "\n")

# 2. What IS defined? (look for typos)
cat("2. Defined variables:", paste(head(ls(), 10), collapse = ", "), "\n")

# 3. Is it in a specific environment?
cat("3. In global env?", exists(target, envir = globalenv()), "\n")

# 4. Find where a name lives
cat("4. Search path for 'mean':", paste(find("mean"), collapse = ", "), "\n")
```

## Practice Exercise

```r
# Exercise: This code has 3 'object not found' errors.
# Find and fix all of them without changing the intended logic.

# calculate_stats <- function(values) {
#   avg <- mean(values)
#   std <- sd(values)
#   list(mean = avg, sd = std, cv = std / average)
# }
#
# my_numbers <- c(10, 20, 30, 40, 50)
# stats <- calculate_stats(my_Numbers)
# cat("CV:", stats$coefficient_of_variation, "\n")

# Write your fixed version below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Fix 1: 'average' should be 'avg' (typo inside function)
# Fix 2: 'my_Numbers' should be 'my_numbers' (case mismatch)
# Fix 3: 'coefficient_of_variation' should be 'cv' (wrong list element name)

calculate_stats <- function(values) {
  avg <- mean(values)
  std <- sd(values)
  list(mean = avg, sd = std, cv = std / avg)  # Fix 1: avg not average
}

my_numbers <- c(10, 20, 30, 40, 50)
stats <- calculate_stats(my_numbers)  # Fix 2: my_numbers not my_Numbers
cat("CV:", stats$cv, "\n")  # Fix 3: cv not coefficient_of_variation
```

**Explanation:** Three different "not found" bugs: (1) typo in variable name inside function, (2) case mismatch in variable name, (3) wrong name for list element. All three are variants of Cause 1 (typos).

</details>

## Summary

| Cause | Fix | Prevention |
|-------|-----|------------|
| Typo | Check spelling and case | Use tab completion |
| Not created yet | Run code in order | Use `source()` for full scripts |
| Wrong scope | Return from functions | Assign function results |
| Package not loaded | `library()` or `::` | Load packages at top of script |
| Wrong column name | Check `names(df)` | Print column names first |
| Dataset not loaded | `data(name)` | Load explicitly |
| Session restart | Rerun full script | Keep scripts self-contained |

## FAQ

### How is "object not found" different from "could not find function"?

Both mean R can't find a name. `object 'x' not found` is for variables. `could not find function "fn"` is specifically for functions — usually because a package isn't loaded.

### Why does my code work in the console but fail in R Markdown?

R Markdown knits in a clean environment. If you defined a variable in the console but not in your .Rmd file, knitting fails. Solution: make sure every variable is created within a code chunk.

## Continue Learning

1. **R Error: subscript out of bounds** — indexing errors explained
2. **R Error: undefined columns selected** — data frame subsetting fix
3. **R Common Errors** — the full reference of 50 common errors
