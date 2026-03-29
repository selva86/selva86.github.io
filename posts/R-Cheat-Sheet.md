---
title: "R Cheat Sheet: The Ultimate Quick Reference — 200 Functions"
slug: "R-Cheat-Sheet"
description: "The ultimate R cheat sheet with 200 essential functions organized by category: vectors, data frames, strings, dates, stats, IO, and apply family."
keywords: "R cheat sheet, R functions reference, R quick reference, R commands list, base R functions, R programming cheat sheet"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "CHT1"
post_type: "FR"
auto_link_terms: "R cheat sheet|R quick reference|R functions reference"
auto_link_case_sensitive: false
fr_parent: "Getting-Help-in-R.html"
---

# R Cheat Sheet: The Ultimate Quick Reference — 200 Functions

<p class="lead">A comprehensive, searchable reference of the 200 most important R functions organized by category. Bookmark this page — you'll come back to it every day.</p>

This cheat sheet covers base R and essential package functions across seven major categories. Each entry includes the function signature, a one-line description, and a minimal example. Whether you're a beginner looking up syntax or an experienced user refreshing your memory, this is your go-to quick reference.

## Vectors & Basic Operations

Vectors are R's fundamental data structure. These functions create, manipulate, and query vectors.

| Function | Description | Example |
|----------|-------------|---------|
| `c()` | Combine values into a vector | `c(1, 2, 3)` |
| `seq()` | Generate a sequence | `seq(1, 10, by = 2)` |
| `seq_len()` | Sequence from 1 to n | `seq_len(5)` |
| `seq_along()` | Sequence along an object | `seq_along(letters)` |
| `rep()` | Repeat elements | `rep(1:3, times = 2)` |
| `length()` | Number of elements | `length(1:10)` |
| `rev()` | Reverse a vector | `rev(1:5)` |
| `sort()` | Sort a vector | `sort(c(3,1,2))` |
| `order()` | Return sort indices | `order(c(3,1,2))` |
| `rank()` | Rank elements | `rank(c(3,1,2))` |
| `unique()` | Remove duplicates | `unique(c(1,1,2,3))` |
| `duplicated()` | Find duplicate positions | `duplicated(c(1,1,2))` |
| `table()` | Frequency table | `table(c("a","b","a"))` |
| `which()` | Indices where TRUE | `which(c(T,F,T))` |
| `which.min()` | Index of minimum | `which.min(c(3,1,2))` |
| `which.max()` | Index of maximum | `which.max(c(3,1,2))` |
| `any()` | Any TRUE? | `any(c(T,F,F))` |
| `all()` | All TRUE? | `all(c(T,T,F))` |
| `ifelse()` | Vectorized if-else | `ifelse(1:5 > 3, "hi", "lo")` |
| `match()` | First match positions | `match(c("b"), letters)` |
| `%in%` | Element membership test | `3 %in% 1:5` |
| `setdiff()` | Set difference | `setdiff(1:5, 3:7)` |
| `intersect()` | Set intersection | `intersect(1:5, 3:7)` |
| `union()` | Set union | `union(1:3, 2:5)` |
| `append()` | Insert into vector | `append(1:3, 99, after = 2)` |
| `head()` | First n elements | `head(1:100, 5)` |
| `tail()` | Last n elements | `tail(1:100, 5)` |

```r
# Quick demo: creating and querying vectors
x <- c(5, 3, 8, 1, 9, 2)
cat("Sorted:", sort(x), "\n")
cat("Order:", order(x), "\n")
cat("Unique:", unique(c(1,1,2,3,3)), "\n")
cat("5 in x?", 5 %in% x, "\n")
```

## Math & Statistics

Essential mathematical and statistical functions for numeric computation.

| Function | Description | Example |
|----------|-------------|---------|
| `sum()` | Sum of elements | `sum(1:10)` |
| `prod()` | Product of elements | `prod(1:5)` |
| `cumsum()` | Cumulative sum | `cumsum(1:5)` |
| `cumprod()` | Cumulative product | `cumprod(1:5)` |
| `cummax()` | Cumulative maximum | `cummax(c(1,3,2,5))` |
| `cummin()` | Cumulative minimum | `cummin(c(5,3,4,1))` |
| `diff()` | Lagged differences | `diff(c(1,3,6,10))` |
| `mean()` | Arithmetic mean | `mean(1:10)` |
| `median()` | Median value | `median(1:10)` |
| `var()` | Variance | `var(1:10)` |
| `sd()` | Standard deviation | `sd(1:10)` |
| `min()` | Minimum value | `min(c(3,1,2))` |
| `max()` | Maximum value | `max(c(3,1,2))` |
| `range()` | Min and max | `range(1:10)` |
| `quantile()` | Quantiles | `quantile(1:100, 0.75)` |
| `IQR()` | Interquartile range | `IQR(1:100)` |
| `cor()` | Correlation | `cor(1:10, 10:1)` |
| `cov()` | Covariance | `cov(1:10, 10:1)` |
| `abs()` | Absolute value | `abs(-5)` |
| `sqrt()` | Square root | `sqrt(16)` |
| `log()` | Natural logarithm | `log(exp(1))` |
| `log10()` | Base-10 logarithm | `log10(100)` |
| `log2()` | Base-2 logarithm | `log2(8)` |
| `exp()` | Exponential | `exp(1)` |
| `ceiling()` | Round up | `ceiling(3.2)` |
| `floor()` | Round down | `floor(3.8)` |
| `round()` | Round to n digits | `round(3.14159, 2)` |
| `trunc()` | Truncate decimals | `trunc(3.7)` |
| `sign()` | Sign of number | `sign(-3)` |
| `factorial()` | Factorial | `factorial(5)` |
| `choose()` | Combinations | `choose(5, 2)` |

```r
# Statistics at a glance
x <- c(12, 15, 18, 22, 25, 30, 35)
cat("Mean:", mean(x), "\n")
cat("SD:", round(sd(x), 2), "\n")
cat("Quantiles:\n")
print(quantile(x))
```

## Data Frames

Functions for creating, inspecting, and manipulating data frames.

| Function | Description | Example |
|----------|-------------|---------|
| `data.frame()` | Create data frame | `data.frame(x = 1:3, y = c("a","b","c"))` |
| `str()` | Structure overview | `str(mtcars)` |
| `summary()` | Summary statistics | `summary(mtcars)` |
| `nrow()` | Number of rows | `nrow(mtcars)` |
| `ncol()` | Number of columns | `ncol(mtcars)` |
| `dim()` | Dimensions | `dim(mtcars)` |
| `names()` | Column names | `names(mtcars)` |
| `colnames()` | Column names | `colnames(mtcars)` |
| `rownames()` | Row names | `rownames(mtcars)` |
| `cbind()` | Bind columns | `cbind(1:3, 4:6)` |
| `rbind()` | Bind rows | `rbind(1:3, 4:6)` |
| `merge()` | Merge/join data frames | `merge(df1, df2, by = "id")` |
| `subset()` | Filter rows/columns | `subset(mtcars, mpg > 25)` |
| `transform()` | Add/modify columns | `transform(mtcars, kpl = mpg * 0.425)` |
| `within()` | Modify inside data frame | `within(mtcars, {kpl <- mpg*0.425})` |
| `with()` | Evaluate expression | `with(mtcars, mean(mpg))` |
| `complete.cases()` | Rows with no NAs | `complete.cases(airquality)` |
| `na.omit()` | Remove NA rows | `na.omit(airquality)` |
| `is.na()` | Test for NA | `is.na(c(1, NA, 3))` |
| `reshape()` | Reshape wide/long | `reshape(df, direction = "long")` |
| `stack()` | Stack columns | `stack(list(a = 1:3, b = 4:6))` |
| `expand.grid()` | All combinations | `expand.grid(x = 1:2, y = c("a","b"))` |

```r
# Data frame basics
df <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  score = c(92, 85, 78),
  grade = c("A", "B", "C")
)
cat("Dimensions:", dim(df), "\n")
cat("High scorers:\n")
print(subset(df, score > 80))
```

## Strings

Functions for character manipulation and pattern matching.

| Function | Description | Example |
|----------|-------------|---------|
| `paste()` | Concatenate with separator | `paste("a", "b", sep = "-")` |
| `paste0()` | Concatenate without separator | `paste0("x", 1:3)` |
| `sprintf()` | Formatted string | `sprintf("%.2f", 3.14159)` |
| `nchar()` | Number of characters | `nchar("hello")` |
| `substr()` | Extract substring | `substr("hello", 1, 3)` |
| `substring()` | Extract/replace substring | `substring("hello", 2, 4)` |
| `toupper()` | Convert to uppercase | `toupper("hello")` |
| `tolower()` | Convert to lowercase | `tolower("HELLO")` |
| `trimws()` | Trim whitespace | `trimws("  hello  ")` |
| `gsub()` | Replace all matches | `gsub("o", "0", "foo")` |
| `sub()` | Replace first match | `sub("o", "0", "foo")` |
| `grep()` | Find pattern (indices) | `grep("a", c("apple","banana"))` |
| `grepl()` | Find pattern (logical) | `grepl("a", c("apple","bat"))` |
| `regexpr()` | First match position | `regexpr("o", "hello world")` |
| `regmatches()` | Extract regex matches | `regmatches("abc123", regexpr("[0-9]+", "abc123"))` |
| `strsplit()` | Split string | `strsplit("a,b,c", ",")` |
| `startsWith()` | Starts with prefix? | `startsWith("hello", "he")` |
| `endsWith()` | Ends with suffix? | `endsWith("hello", "lo")` |
| `chartr()` | Character translation | `chartr("abc", "ABC", "abcdef")` |
| `format()` | Format values as strings | `format(3.14, nsmall = 4)` |
| `formatC()` | C-style formatting | `formatC(12345, format = "d", big.mark = ",")` |

```r
# String operations
names <- c("Alice Smith", "Bob Jones", "Carol Lee")
cat("Uppercase:", toupper(names[1]), "\n")
cat("Split:", unlist(strsplit(names[1], " ")), "\n")
cat("Contains 'Jones':", grepl("Jones", names), "\n")
```

## Dates & Times

Functions for working with date and time objects.

| Function | Description | Example |
|----------|-------------|---------|
| `Sys.Date()` | Current date | `Sys.Date()` |
| `Sys.time()` | Current date-time | `Sys.time()` |
| `as.Date()` | Convert to Date | `as.Date("2026-03-29")` |
| `as.POSIXct()` | Convert to datetime | `as.POSIXct("2026-03-29 10:30:00")` |
| `format()` | Format date as string | `format(Sys.Date(), "%B %d, %Y")` |
| `difftime()` | Time difference | `difftime(Sys.Date(), as.Date("2026-01-01"))` |
| `seq.Date()` | Sequence of dates | `seq.Date(as.Date("2026-01-01"), by = "month", length.out = 6)` |
| `weekdays()` | Day of the week | `weekdays(Sys.Date())` |
| `months()` | Month name | `months(Sys.Date())` |
| `quarters()` | Quarter of year | `quarters(Sys.Date())` |
| `as.numeric()` | Date to epoch days | `as.numeric(Sys.Date())` |
| `strptime()` | Parse date string | `strptime("29/03/2026", "%d/%m/%Y")` |
| `strftime()` | Format date/time | `strftime(Sys.time(), "%H:%M:%S")` |

```r
# Date arithmetic
today <- Sys.Date()
cat("Today:", format(today, "%A, %B %d, %Y"), "\n")
cat("30 days ago:", format(today - 30, "%Y-%m-%d"), "\n")
cat("Day of week:", weekdays(today), "\n")
```

## Input/Output

Functions for reading, writing, and interacting with the file system.

| Function | Description | Example |
|----------|-------------|---------|
| `read.csv()` | Read CSV file | `read.csv("data.csv")` |
| `read.table()` | Read delimited file | `read.table("data.txt", header = TRUE)` |
| `read.delim()` | Read tab-delimited | `read.delim("data.tsv")` |
| `readLines()` | Read lines of text | `readLines("file.txt", n = 5)` |
| `scan()` | Read data flexibly | `scan("nums.txt", what = numeric())` |
| `readRDS()` | Read R object | `readRDS("model.rds")` |
| `write.csv()` | Write CSV file | `write.csv(df, "out.csv", row.names = FALSE)` |
| `write.table()` | Write delimited file | `write.table(df, "out.txt", sep = "\t")` |
| `writeLines()` | Write lines of text | `writeLines(c("a","b"), "out.txt")` |
| `saveRDS()` | Save R object | `saveRDS(model, "model.rds")` |
| `save()` | Save multiple objects | `save(x, y, file = "data.RData")` |
| `load()` | Load .RData file | `load("data.RData")` |
| `cat()` | Print to console/file | `cat("Hello\n")` |
| `print()` | Print an object | `print(1:5)` |
| `message()` | Print a message | `message("Processing...")` |
| `warning()` | Issue a warning | `warning("Check input")` |
| `stop()` | Throw an error | `stop("Invalid argument")` |
| `file.exists()` | Check file existence | `file.exists("data.csv")` |
| `dir()` | List files in directory | `dir(pattern = "\\.csv$")` |
| `getwd()` | Get working directory | `getwd()` |
| `setwd()` | Set working directory | `setwd("~/projects")` |
| `download.file()` | Download a file | `download.file(url, "file.csv")` |

```r
# Quick IO demo
df <- data.frame(x = 1:5, y = letters[1:5])
cat("Current directory:", getwd(), "\n")
cat("CSV output would look like:\n")
write.csv(df, stdout(), row.names = FALSE)
```

## Apply Family & Functional Programming

Functions for iteration without explicit loops.

| Function | Description | Example |
|----------|-------------|---------|
| `apply()` | Apply over rows/cols | `apply(matrix(1:6, 2), 2, sum)` |
| `lapply()` | Apply, return list | `lapply(1:3, function(x) x^2)` |
| `sapply()` | Apply, simplify result | `sapply(1:3, function(x) x^2)` |
| `vapply()` | Apply with type check | `vapply(1:3, function(x) x^2, numeric(1))` |
| `tapply()` | Apply by group | `tapply(mtcars$mpg, mtcars$cyl, mean)` |
| `mapply()` | Multiple-argument apply | `mapply(function(x,y) x+y, 1:3, 4:6)` |
| `Map()` | Like mapply, returns list | `Map("+", 1:3, 4:6)` |
| `Reduce()` | Accumulate from left | `Reduce("+", 1:5)` |
| `Filter()` | Keep matching elements | `Filter(is.numeric, list(1,"a",3))` |
| `Find()` | First match | `Find(function(x) x > 3, 1:10)` |
| `Position()` | Index of first match | `Position(function(x) x > 3, 1:10)` |
| `do.call()` | Call function with arg list | `do.call(paste, list("a","b","c"))` |
| `Vectorize()` | Vectorize a function | `vf <- Vectorize(choose); vf(5, 1:5)` |
| `tryCatch()` | Error handling | `tryCatch(log(-1), warning = function(w) NA)` |
| `try()` | Try without stopping | `try(log("a"), silent = TRUE)` |

```r
# Apply family in action
m <- matrix(1:12, nrow = 3)
cat("Column sums:", apply(m, 2, sum), "\n")
cat("Squares:", sapply(1:5, function(x) x^2), "\n")
cat("Group means:\n")
print(tapply(mtcars$mpg, mtcars$cyl, mean))
```

## Type Checking & Conversion

Functions for inspecting and converting object types.

| Function | Description | Example |
|----------|-------------|---------|
| `class()` | Object class | `class(1:5)` |
| `typeof()` | Internal type | `typeof(1L)` |
| `is.numeric()` | Is numeric? | `is.numeric(3.14)` |
| `is.character()` | Is character? | `is.character("hi")` |
| `is.logical()` | Is logical? | `is.logical(TRUE)` |
| `is.factor()` | Is factor? | `is.factor(factor("a"))` |
| `is.list()` | Is list? | `is.list(list(1,2))` |
| `is.data.frame()` | Is data frame? | `is.data.frame(mtcars)` |
| `is.null()` | Is NULL? | `is.null(NULL)` |
| `as.numeric()` | Convert to numeric | `as.numeric("42")` |
| `as.character()` | Convert to character | `as.character(42)` |
| `as.logical()` | Convert to logical | `as.logical(0)` |
| `as.factor()` | Convert to factor | `as.factor(c("a","b"))` |
| `as.integer()` | Convert to integer | `as.integer(3.7)` |
| `as.list()` | Convert to list | `as.list(1:3)` |
| `unlist()` | Flatten list to vector | `unlist(list(1:2, 3:4))` |
| `identical()` | Exact equality test | `identical(1L, 1L)` |
| `all.equal()` | Near-equality test | `all.equal(0.1+0.2, 0.3)` |

```r
# Type checking
x <- "42"
cat("Class:", class(x), "\n")
cat("Is numeric?", is.numeric(x), "\n")
y <- as.numeric(x)
cat("Converted:", y, "- Class:", class(y), "\n")
```

## Summary: When to Use What

| Task | Go-To Function |
|------|---------------|
| Create a sequence | `seq()` or `1:n` |
| Find elements | `which()`, `match()`, `%in%` |
| Summarize numbers | `mean()`, `median()`, `summary()` |
| Manipulate strings | `paste()`, `gsub()`, `strsplit()` |
| Read data | `read.csv()`, `readRDS()` |
| Iterate without loops | `sapply()`, `lapply()`, `apply()` |
| Check/convert types | `is.*()`, `as.*()` |
| Handle errors | `tryCatch()`, `try()` |

## FAQ

**How do I search for a function I don't know the name of?**
Use `??keyword` in R to search all help pages, or `apropos("pattern")` to find functions matching a pattern. For example, `apropos("mean")` lists all functions with "mean" in the name.

**Should I memorize all 200 functions?**
No. Focus on the 30-40 you use most often. Bookmark this page for the rest. Fluency comes from practice, not memorization.

**Are these functions still relevant with tidyverse?**
Absolutely. Base R functions underpin everything — even tidyverse packages use them internally. Knowing base R makes you a stronger programmer regardless of which packages you prefer.

## What's Next

- [R Base Functions Cheat Sheet](R-Base-Functions-Cheat-Sheet.html) — Deep dive into the 100 most-used base functions
- [Getting Help in R](Getting-Help-in-R.html) — How to use R's help system effectively
- [R for Excel Users](R-for-Excel-Users.html) — Migrate your Excel workflows to R
