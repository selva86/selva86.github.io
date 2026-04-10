---
title: "R Error: could not find function 'X' — Namespace & Package Conflicts"
slug: "R-Error-Function-Not-Found"
description: "Fix the R error 'could not find function'. Learn the 5 causes: package not loaded, masked functions, typos, namespace conflicts, and how to resolve each one."
keywords: "R could not find function, R function not found, R package not loaded, R namespace conflict, R masked function, R library error"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR10"
post_type: "FR"
auto_link_terms: "could not find function|function not found"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# R Error: could not find function 'X' — Namespace & Package Conflicts

<p class="lead"><code>Error: could not find function "X"</code> means R searched every loaded package and the global environment but could not find a function with that name. The function's package is not loaded, the name is misspelled, or it's been masked by another package.</p>

## The Error

```r
# Reproduce the error:
# mutate(mtcars, ratio = mpg / wt)
# Error: could not find function "mutate"

cat("This error means the function isn't available in the current session.\n")
cat("Loaded namespaces:", length(loadedNamespaces()), "\n")
```

## Cause 1: Package Not Loaded

The most common cause. The function exists in a package you haven't loaded:

```r
# Check if a function is available
cat("mean exists?", exists("mean", mode = "function"), "\n")

# Find which package provides a function
cat("mean is in:", paste(find("mean"), collapse = ", "), "\n")

# Fix: load the package
# library(dplyr)
# mutate(mtcars, ratio = mpg / wt)

cat("\nFix: add library(package_name) at the top of your script.\n")
```

**Fix:** Load the package with `library(package_name)`. If you don't know which package provides a function, search with `??function_name` or `help.search("function_name")`.

## Cause 2: Typo in Function Name

R function names are case-sensitive:

```r
# Common typos
cat("Wrong -> Right:\n")
cat("  Read.csv -> read.csv\n")
cat("  As.numeric -> as.numeric\n")
cat("  Str -> str\n")
cat("  Summary -> summary\n")

# Find functions with similar names
matches <- apropos("^read\\.")
cat("\nFunctions matching 'read.':", paste(head(matches, 6), collapse = ", "), "\n")
```

**Fix:** Check spelling and case. Use `apropos("partial_name")` to search for functions by partial name.

## Cause 3: Package Installed but Not Loaded

Installing and loading are different operations:

```r
# Check if a package is installed (but maybe not loaded)
installed <- "stats" %in% rownames(installed.packages())
loaded <- "stats" %in% loadedNamespaces()

cat("stats installed?", installed, "\n")
cat("stats loaded?", loaded, "\n")

# Use :: to call a function without loading the whole package
result <- stats::median(c(1, 5, 3, 9, 2))
cat("stats::median result:", result, "\n")

cat("\npackage::function() works without library()\n")
```

**Fix:** Use `library(pkg)` to load, or `pkg::function()` for one-off calls without loading.

## Cause 4: Function Masked by Another Package

When two packages have functions with the same name, the last-loaded package "masks" the other:

```r
# See what's masked in your session
conflicts_list <- conflicts(detail = TRUE)
cat("Number of conflicts:", length(conflicts()), "\n")

# Common masking examples:
cat("\nCommon conflicts:\n")
cat("  dplyr::filter() masks stats::filter()\n")
cat("  dplyr::lag() masks stats::lag()\n")
cat("  MASS::select() masks dplyr::select()\n")

# Fix: use the full namespace
# stats::filter(x, ...)    # explicitly use stats version
# dplyr::filter(df, ...)   # explicitly use dplyr version

cat("\nFix: use package::function() to be explicit.\n")
```

**Fix:** Use the fully qualified name `package::function()` when conflicts exist. Load packages in the right order (most-used last).

## Cause 5: Function Removed or Renamed in Package Update

Packages evolve. Functions get deprecated, renamed, or removed:

```r
# Check if a function exists in a specific package
cat("Check namespace for a function:\n")
cat("  existsFunction('lm'):", existsFunction("lm"), "\n")

# Common renames in tidyverse:
cat("\nCommon renames:\n")
cat("  summarise_each -> summarise_all -> across()\n")
cat("  gather/spread -> pivot_longer/pivot_wider\n")
cat("  funs() -> list() with lambdas\n")

cat("\nFix: check the package changelog or vignettes for new names.\n")
```

**Fix:** Check the package documentation for renamed functions. Look for deprecation warnings when loading the package.

## Practice Exercise

```r
# Exercise: Debug this code that produces "could not find function" errors.
# Don't actually load packages — just identify what's wrong and
# show how you'd fix each line.

# Line 1: result <- str_replace("hello world", "world", "R")
# Line 2: df <- tibble(x = 1:5, y = rnorm(5))
# Line 3: df %>% Mutate(z = x + y)

# Write the fixed version (using :: syntax) below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Fix 1: str_replace is from stringr
# stringr::str_replace("hello world", "world", "R")
# Or: sub("world", "R", "hello world")  # base R alternative
result <- sub("world", "R", "hello world")
cat("Fix 1:", result, "\n")

# Fix 2: tibble is from the tibble package
# tibble::tibble(x = 1:5, y = rnorm(5))
# Or use base R:
df <- data.frame(x = 1:5, y = rnorm(5))
cat("Fix 2: used data.frame() instead\n")

# Fix 3: Mutate has wrong case - should be mutate (lowercase)
# Also needs dplyr loaded or use dplyr::mutate()
# dplyr::mutate(df, z = x + y)
# Or base R:
df$z <- df$x + df$y
cat("Fix 3: mutate not Mutate (case-sensitive)\n")
print(df)
```

**Explanation:** Three different causes: (1) function from an unloaded package (stringr), (2) function from an unloaded package (tibble), (3) case-sensitivity typo (Mutate vs mutate). Each can be fixed with `package::function()` or a base R alternative.

</details>

## Summary

| Cause | Fix | Prevention |
|-------|-----|------------|
| Package not loaded | `library(pkg)` or `pkg::fn()` | Load all packages at script top |
| Typo in function name | `apropos("name")` to search | Use tab completion |
| Installed but not loaded | `library()` or `::` | Understand install vs load |
| Masked by another package | `package::function()` | Use explicit namespaces |
| Function renamed/removed | Check package docs | Read changelog after updates |

## FAQ

### How do I find which package a function belongs to?

Use `??function_name` to search all installed packages. Or use `help.search("function_name")`. Online, search "R function_name" — the documentation page shows the package name in curly braces like `{dplyr}`.

### Should I use library() or require()?

Use `library()` — it throws an error if the package is missing, which is what you want (fail loudly). `require()` returns `FALSE` silently, which can let your script continue with broken assumptions. Only use `require()` inside functions where you explicitly check the return value.

## Continue Learning

1. **R Error: there is no package called 'X'** — package installation troubleshooting
2. **R Error: object 'x' not found** — variable not found troubleshooting
3. **R Common Errors** — the full reference of 50 common errors
