---
title: "R Base Functions Cheat Sheet: 100 Functions You Actually Need"
slug: "R-Base-Functions-Cheat-Sheet"
description: "The 100 most-used base R functions with clear examples. Organized by purpose: data manipulation, math, strings, IO, and control flow."
keywords: "R base functions, base R cheat sheet, R built-in functions, R function reference, most used R functions, R programming basics"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "CHT10"
post_type: "FR"
auto_link_terms: "R base functions|base R cheat sheet|built-in R functions"
auto_link_case_sensitive: false
fr_parent: "Getting-Help-in-R.html"
---

# R Base Functions Cheat Sheet: 100 Functions You Actually Need

<p class="lead">These are the 100 base R functions that working data analysts and statisticians use most often. No packages required — everything here ships with R out of the box.</p>

R has over 1,200 base functions, but most programmers rely on the same 100 day after day. This cheat sheet distills those essentials, organized by what you're trying to do. Every function includes a signature, a one-line description, and a runnable example.

## Object Inspection (10 Functions)

These are the first functions you reach for when exploring unfamiliar data.

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 1 | `str(x)` | Show structure compactly | `str(mtcars)` |
| 2 | `summary(x)` | Statistical summary | `summary(iris)` |
| 3 | `class(x)` | Object class | `class(Sys.Date())` |
| 4 | `typeof(x)` | Internal storage type | `typeof(1L)` |
| 5 | `length(x)` | Number of elements | `length(letters)` |
| 6 | `dim(x)` | Rows and columns | `dim(mtcars)` |
| 7 | `names(x)` | Element/column names | `names(mtcars)` |
| 8 | `head(x, n)` | First n elements | `head(mtcars, 3)` |
| 9 | `tail(x, n)` | Last n elements | `tail(mtcars, 3)` |
| 10 | `attributes(x)` | All attributes | `attributes(mtcars)` |

```r
# Inspect the built-in mtcars dataset
cat("Class:", class(mtcars), "\n")
cat("Dimensions:", dim(mtcars), "\n")
cat("Columns:", names(mtcars), "\n")
str(mtcars)
```

## Creating & Combining (15 Functions)

Functions that build data structures from scratch or combine existing ones.

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 11 | `c(...)` | Combine into vector | `c(1, 2, 3)` |
| 12 | `vector(mode, length)` | Create empty vector | `vector("numeric", 5)` |
| 13 | `list(...)` | Create a list | `list(a = 1, b = "two")` |
| 14 | `data.frame(...)` | Create data frame | `data.frame(x = 1:3)` |
| 15 | `matrix(data, nrow, ncol)` | Create matrix | `matrix(1:6, nrow = 2)` |
| 16 | `array(data, dim)` | Create array | `array(1:24, dim = c(2,3,4))` |
| 17 | `factor(x, levels)` | Create factor | `factor(c("a","b","a"))` |
| 18 | `seq(from, to, by)` | Generate sequence | `seq(0, 1, by = 0.1)` |
| 19 | `rep(x, times)` | Repeat elements | `rep(c("a","b"), 3)` |
| 20 | `cbind(...)` | Bind columns | `cbind(1:3, 4:6)` |
| 21 | `rbind(...)` | Bind rows | `rbind(1:3, 4:6)` |
| 22 | `append(x, values)` | Insert into vector | `append(1:3, 99, after = 1)` |
| 23 | `expand.grid(...)` | All combinations | `expand.grid(x = 1:2, y = c("a","b"))` |
| 24 | `do.call(fun, args)` | Call with argument list | `do.call(paste, list("a","b"))` |
| 25 | `Recall(...)` | Recursive self-call | Used inside recursive functions |

```r
# Building structures
v <- c(10, 20, 30)
m <- matrix(1:9, nrow = 3)
df <- data.frame(id = 1:3, name = c("Alice","Bob","Carol"))
cat("Vector:", v, "\n")
cat("Matrix:\n"); print(m)
cat("Data frame:\n"); print(df)
```

## Subsetting & Searching (12 Functions)

Find, filter, and extract elements from data.

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 26 | `subset(x, ...)` | Filter rows/columns | `subset(mtcars, mpg > 30)` |
| 27 | `which(x)` | Indices of TRUE values | `which(c(F, T, T, F))` |
| 28 | `which.min(x)` | Index of minimum | `which.min(c(5,2,8,1))` |
| 29 | `which.max(x)` | Index of maximum | `which.max(c(5,2,8,1))` |
| 30 | `match(x, table)` | First match positions | `match("c", letters)` |
| 31 | `%in%` | Membership test | `c(1,5) %in% 1:3` |
| 32 | `grep(pattern, x)` | Search indices | `grep("mpg", names(mtcars))` |
| 33 | `grepl(pattern, x)` | Search logical | `grepl("^m", names(mtcars))` |
| 34 | `startsWith(x, prefix)` | Starts with? | `startsWith("hello", "he")` |
| 35 | `endsWith(x, suffix)` | Ends with? | `endsWith("test.csv", ".csv")` |
| 36 | `Find(f, x)` | First matching element | `Find(function(x) x>3, 1:10)` |
| 37 | `Position(f, x)` | Index of first match | `Position(function(x) x>3, 1:10)` |

```r
# Finding things in data
x <- c(15, 8, 22, 3, 41, 7)
cat("Values > 10:", x[x > 10], "\n")
cat("Index of max:", which.max(x), "\n")
cat("Is 22 present?", 22 %in% x, "\n")
```

## Math & Statistics (18 Functions)

The core numeric computation toolkit.

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 38 | `sum(x)` | Sum of elements | `sum(1:100)` |
| 39 | `mean(x)` | Arithmetic mean | `mean(mtcars$mpg)` |
| 40 | `median(x)` | Median | `median(mtcars$mpg)` |
| 41 | `var(x)` | Variance | `var(mtcars$mpg)` |
| 42 | `sd(x)` | Standard deviation | `sd(mtcars$mpg)` |
| 43 | `min(x)` | Minimum | `min(mtcars$mpg)` |
| 44 | `max(x)` | Maximum | `max(mtcars$mpg)` |
| 45 | `range(x)` | Min and max | `range(mtcars$mpg)` |
| 46 | `quantile(x, probs)` | Quantiles | `quantile(mtcars$mpg, c(0.25, 0.75))` |
| 47 | `cor(x, y)` | Correlation | `cor(mtcars$mpg, mtcars$wt)` |
| 48 | `cumsum(x)` | Cumulative sum | `cumsum(1:10)` |
| 49 | `diff(x)` | Lagged differences | `diff(c(1,4,9,16))` |
| 50 | `abs(x)` | Absolute value | `abs(-5)` |
| 51 | `sqrt(x)` | Square root | `sqrt(144)` |
| 52 | `round(x, digits)` | Round | `round(pi, 3)` |
| 53 | `ceiling(x)` | Round up | `ceiling(3.01)` |
| 54 | `floor(x)` | Round down | `floor(3.99)` |
| 55 | `log(x)` | Natural log | `log(exp(5))` |

```r
# Quick descriptive stats
x <- mtcars$mpg
cat("Mean:", round(mean(x), 1), "\n")
cat("SD:", round(sd(x), 1), "\n")
cat("Range:", range(x), "\n")
cat("Correlation (mpg vs wt):", round(cor(mtcars$mpg, mtcars$wt), 3), "\n")
```

## Sorting & Ordering (5 Functions)

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 56 | `sort(x)` | Sort a vector | `sort(c(3,1,4,1,5))` |
| 57 | `order(...)` | Sort indices | `order(c(3,1,2))` |
| 58 | `rank(x)` | Rank values | `rank(c(3,1,2))` |
| 59 | `rev(x)` | Reverse vector | `rev(1:5)` |
| 60 | `unique(x)` | Remove duplicates | `unique(c(1,1,2,3,3))` |

## String Functions (12 Functions)

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 61 | `paste(...)` | Concatenate strings | `paste("Hello", "World")` |
| 62 | `paste0(...)` | Concatenate without space | `paste0("id_", 1:3)` |
| 63 | `sprintf(fmt, ...)` | Formatted string | `sprintf("%.1f%%", 95.678)` |
| 64 | `nchar(x)` | String length | `nchar("hello")` |
| 65 | `substr(x, start, stop)` | Extract substring | `substr("hello", 1, 3)` |
| 66 | `toupper(x)` | To uppercase | `toupper("hello")` |
| 67 | `tolower(x)` | To lowercase | `tolower("HELLO")` |
| 68 | `trimws(x)` | Trim whitespace | `trimws("  hi  ")` |
| 69 | `gsub(pat, rep, x)` | Replace all | `gsub("[aeiou]", "*", "hello")` |
| 70 | `sub(pat, rep, x)` | Replace first | `sub("l", "L", "hello")` |
| 71 | `strsplit(x, split)` | Split string | `strsplit("a,b,c", ",")` |
| 72 | `format(x, ...)` | Format for display | `format(12345.6, big.mark = ",")` |

```r
# String manipulation
x <- "  Hello, World!  "
cat("Trimmed:", trimws(x), "\n")
cat("Upper:", toupper(trimws(x)), "\n")
cat("Replace:", gsub("o", "0", x), "\n")
cat("Split:", unlist(strsplit("a-b-c", "-")), "\n")
```

## Apply Family (8 Functions)

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 73 | `apply(X, MARGIN, FUN)` | Over rows/cols of matrix | `apply(matrix(1:6,2), 2, sum)` |
| 74 | `lapply(X, FUN)` | Over list, return list | `lapply(1:3, sqrt)` |
| 75 | `sapply(X, FUN)` | Over list, simplify | `sapply(1:5, function(x) x^2)` |
| 76 | `vapply(X, FUN, type)` | Type-safe sapply | `vapply(1:3, sqrt, numeric(1))` |
| 77 | `tapply(X, INDEX, FUN)` | By group | `tapply(mtcars$mpg, mtcars$cyl, mean)` |
| 78 | `mapply(FUN, ...)` | Multiple inputs | `mapply(paste, 1:3, c("a","b","c"))` |
| 79 | `Reduce(f, x)` | Accumulate | `Reduce("+", 1:10)` |
| 80 | `Filter(f, x)` | Keep matches | `Filter(is.numeric, list(1,"a",3))` |

```r
# Apply family showcase
cat("Column means:\n")
print(round(apply(mtcars[,1:4], 2, mean), 1))
cat("\nMPG by cylinder:\n")
print(round(tapply(mtcars$mpg, mtcars$cyl, mean), 1))
```

## IO & File System (10 Functions)

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 81 | `read.csv(file)` | Read CSV | `read.csv("data.csv")` |
| 82 | `write.csv(x, file)` | Write CSV | `write.csv(df, "out.csv")` |
| 83 | `readRDS(file)` | Read R object | `readRDS("model.rds")` |
| 84 | `saveRDS(object, file)` | Save R object | `saveRDS(fit, "model.rds")` |
| 85 | `readLines(con, n)` | Read text lines | `readLines("log.txt", 10)` |
| 86 | `writeLines(text, con)` | Write text lines | `writeLines(c("a","b"), "out.txt")` |
| 87 | `cat(...)` | Print to console | `cat("value:", 42, "\n")` |
| 88 | `print(x)` | Print object | `print(head(mtcars))` |
| 89 | `getwd()` | Working directory | `getwd()` |
| 90 | `file.exists(x)` | File exists? | `file.exists("data.csv")` |

## Control Flow & Error Handling (10 Functions)

| # | Function | What It Does | Example |
|---|----------|-------------|---------|
| 91 | `if/else` | Conditional | `if (x > 0) "pos" else "neg"` |
| 92 | `ifelse(test, yes, no)` | Vectorized conditional | `ifelse(1:5 > 3, "hi", "lo")` |
| 93 | `switch(expr, ...)` | Multi-branch | `switch("b", a=1, b=2, c=3)` |
| 94 | `for(var in seq)` | Loop | `for (i in 1:5) cat(i)` |
| 95 | `while(cond)` | While loop | `while(x < 10) x <- x + 1` |
| 96 | `tryCatch(expr, ...)` | Error handling | `tryCatch(log(-1), warning=function(w) NA)` |
| 97 | `try(expr)` | Try without stopping | `try(log("a"), silent = TRUE)` |
| 98 | `stop(msg)` | Throw error | `stop("x must be positive")` |
| 99 | `warning(msg)` | Issue warning | `warning("Unusual value")` |
| 100 | `message(msg)` | Print message | `message("Processing done")` |

```r
# Error handling in practice
safe_log <- function(x) {
  tryCatch(
    log(x),
    warning = function(w) { message("Warning: ", w$message); NA },
    error = function(e) { message("Error: ", e$message); NA }
  )
}
cat("log(10):", safe_log(10), "\n")
cat("log(-1):", safe_log(-1), "\n")
cat("log('a'):", safe_log("a"), "\n")
```

## Summary: The Top 20 You'll Use Daily

| Rank | Function | Category |
|------|----------|----------|
| 1 | `c()` | Creating |
| 2 | `str()` | Inspection |
| 3 | `head()` | Inspection |
| 4 | `summary()` | Statistics |
| 5 | `mean()` | Statistics |
| 6 | `length()` | Inspection |
| 7 | `names()` | Inspection |
| 8 | `paste0()` | Strings |
| 9 | `sapply()` | Apply |
| 10 | `which()` | Searching |
| 11 | `cat()` | IO |
| 12 | `read.csv()` | IO |
| 13 | `class()` | Inspection |
| 14 | `ifelse()` | Control |
| 15 | `unique()` | Manipulation |
| 16 | `subset()` | Subsetting |
| 17 | `gsub()` | Strings |
| 18 | `round()` | Math |
| 19 | `sort()` | Sorting |
| 20 | `tryCatch()` | Error handling |

## FAQ

**What counts as "base R"?**
Base R means functions available without loading any packages. These come from the `base`, `utils`, `stats`, `grDevices`, and `graphics` packages that ship with every R installation.

**Should I learn base R or tidyverse first?**
Learn base R first. Understanding `c()`, `[`, `$`, `apply()`, and the type system makes tidyverse code easier to debug and understand. Tidyverse is built on top of base R, not a replacement.

**How can I check all arguments a function accepts?**
Use `args(function_name)` or `?function_name`. For example, `args(read.csv)` shows all parameters, and `?read.csv` opens the full help page with descriptions.

## What's Next

- [R Cheat Sheet](R-Cheat-Sheet.html) — Extended 200-function reference organized by category
- [Getting Help in R](Getting-Help-in-R.html) — Master R's built-in help system
- [R for Excel Users](R-for-Excel-Users.html) — Translate your Excel skills to R
