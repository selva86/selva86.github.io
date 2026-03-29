---
title: "Writing Composable R Code: Pipes, Functions & Functional Architecture"
slug: "Writing-Composable-R-Code"
description: "Write cleaner R code with composable functions, pipes, and functional architecture. Learn to chain, combine, and structure R code for readability and reuse."
keywords: "composable R code, R pipes, R functional architecture, clean R code, R code organization, pipe operator R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.2.8"
post_type: "C"
auto_link_terms: "composable R code|functional architecture|R pipes"
auto_link_case_sensitive: false
---

# Writing Composable R Code: Pipes, Functions & Functional Architecture

<p class="lead">Composable code means building complex operations from simple, reusable pieces that snap together like Lego blocks. This tutorial shows you how to write R functions that compose naturally using pipes, higher-order functions, and clean architecture.</p>

Most R scripts start well but grow into tangled spaghetti. The fix isn't more comments or better variable names — it's composability. When each function does one thing and plays nicely with others, your code stays readable at any scale.

## What Makes Code Composable?

A composable function has three properties:

1. **Single responsibility** — it does one thing well
2. **Consistent interface** — data in, data out (same type when possible)
3. **No hidden state** — the result depends only on the arguments

```r
# NOT composable: does too many things, side effects, hidden state
process_data <- function(file) {
  data <- read.csv(file)                    # I/O side effect
  data <- data[complete.cases(data), ]      # Cleaning
  data$score <- scale(data$score)           # Transformation
  write.csv(data, "output.csv")            # I/O side effect
  cat("Done! Processed", nrow(data), "rows\n")  # Print side effect
  data
}

# COMPOSABLE: each function does one thing
read_data    <- \(file) read.csv(file)
remove_na    <- \(df) df[complete.cases(df), ]
scale_column <- \(df, col) { df[[col]] <- scale(df[[col]]); df }
```

## Pipes: The Composition Operator

Pipes connect composable functions into readable pipelines. R has two pipe operators.

### The Native Pipe |> (R 4.1+)

```r
# Without pipes: read inside-out
result <- round(mean(abs(c(-3, 1, -5, 2, -4))), 2)
cat("Nested:", result, "\n")

# With native pipe: read left to right
result <- c(-3, 1, -5, 2, -4) |> abs() |> mean() |> round(2)
cat("Piped:", result, "\n")
```

### Data Frame Pipelines

```r
# Build a data analysis pipeline
mtcars |>
  subset(cyl == 6) |>
  transform(kpl = mpg * 0.425) |>
  (\(df) df[order(df$kpl, decreasing = TRUE), ])() |>
  head(5) |>
  print()
```

### Writing Pipe-Friendly Functions

For a function to work well with pipes, the **data argument should come first**.

```r
# Pipe-friendly: data is first argument
add_column <- function(df, name, values) {
  df[[name]] <- values
  df
}

tag_rows <- function(df, condition_col, threshold, label = "high") {
  df$tag <- ifelse(df[[condition_col]] > threshold, label, "low")
  df
}

# Now they compose with pipes
result <- mtcars[1:5, c("mpg", "hp")] |>
  add_column("brand", rownames(mtcars)[1:5]) |>
  tag_rows("mpg", 20, "efficient")

print(result)
```

## Composing with Higher-Order Functions

Higher-order functions (functions that take or return functions) are the backbone of composable R code.

### Pattern: Transform-Then-Summarize

```r
# Reusable building blocks
trim_outliers <- function(x, lower = 0.05, upper = 0.95) {
  q <- quantile(x, c(lower, upper), na.rm = TRUE)
  x[x >= q[1] & x <= q[2]]
}

robust_summary <- function(x) {
  c(mean = mean(x, na.rm = TRUE),
    median = median(x, na.rm = TRUE),
    sd = sd(x, na.rm = TRUE),
    n = length(x))
}

# Compose them
set.seed(42)
data <- c(rnorm(100), 50, -50)  # Normal data + outliers

cat("Raw summary:\n")
print(round(robust_summary(data), 2))

cat("\nTrimmed summary:\n")
print(round(robust_summary(trim_outliers(data)), 2))
```

### Pattern: Apply Multiple Functions

```r
# Apply a list of functions to the same data
apply_fns <- function(x, fns) {
  sapply(fns, \(f) f(x))
}

stats <- list(
  mean = mean,
  sd = sd,
  min = min,
  max = max,
  range = \(x) max(x) - min(x)
)

data <- c(23, 45, 12, 67, 34, 89, 56)
results <- apply_fns(data, stats)
cat("Statistics:\n")
print(round(results, 2))
```

### Pattern: Pipeline as a List of Steps

```r
# Define a pipeline as a list of transformation functions
pipeline <- list(
  \(x) x[!is.na(x)],           # Remove NAs
  \(x) x[x > 0],               # Keep positives
  log,                           # Log transform
  \(x) round(x, 3)              # Round
)

# Execute pipeline using Reduce
run_pipeline <- function(data, steps) {
  Reduce(\(d, f) f(d), steps, init = data)
}

raw <- c(NA, 3, -1, 10, NA, 0, 7, -2, 15)
cat("Raw:", raw, "\n")
cat("Processed:", run_pipeline(raw, pipeline), "\n")
```

## Composable Data Frame Operations

### Building a Verb Library

Create a set of verbs (functions) that all take a data frame as input and return a data frame.

```r
# Composable verbs for data frames
select_cols <- function(df, cols) df[, cols, drop = FALSE]
filter_rows <- function(df, condition) df[condition, , drop = FALSE]
sort_by <- function(df, col, desc = FALSE) {
  ord <- order(df[[col]], decreasing = desc)
  df[ord, , drop = FALSE]
}
add_col <- function(df, name, expr) {
  df[[name]] <- expr
  df
}
top_n <- function(df, n) head(df, n)

# Compose them
result <- mtcars |>
  add_col("brand", rownames(mtcars)) |>
  select_cols(c("brand", "mpg", "hp", "wt")) |>
  filter_rows(mtcars$cyl == 4) |>
  sort_by("mpg", desc = TRUE) |>
  top_n(5)

print(result)
```

## Error Handling in Composable Code

Composable functions should fail clearly or handle errors explicitly.

```r
# Safe wrapper that catches errors in a pipeline
safe_step <- function(f, on_error = NULL) {
  function(...) {
    tryCatch(f(...), error = function(e) {
      warning("Step failed: ", e$message)
      on_error
    })
  }
}

# Use in a pipeline
safe_parse <- safe_step(as.numeric, on_error = NA)

inputs <- c("42", "3.14", "abc", "100")
results <- sapply(inputs, safe_parse)
cat("Parsed:", results, "\n")
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|-------------|---------|-----|
| Function does 5 things | Can't reuse parts | Split into 5 functions |
| Modifies global variables | Hidden dependencies | Return results, don't assign globally |
| Prints AND returns | Side effect in pipeline | Return only; use `walk()` for printing |
| Data arg is 3rd parameter | Can't pipe easily | Put data first |
| Returns different types | Can't predict output | Be consistent |

## Practice Exercises

### Exercise 1: Build a Text Processing Pipeline

Create composable functions and chain them to clean text data.

```r
# Create these functions:
# - remove_punctuation(text): removes all punctuation
# - to_lower(text): converts to lowercase
# - split_words(text): splits into words, returns a list
# - count_words(words): counts unique words

# Then compose them into a pipeline:
text <- "Hello, World! Hello R. R is great, R is fun."

```

<details>
<summary>Click to reveal solution</summary>

```r
remove_punctuation <- \(text) gsub("[[:punct:]]", "", text)
to_lower <- tolower
split_words <- \(text) strsplit(text, "\\s+")[[1]]
count_words <- \(words) sort(table(words), decreasing = TRUE)

text <- "Hello, World! Hello R. R is great, R is fun."

result <- text |>
  remove_punctuation() |>
  to_lower() |>
  split_words() |>
  count_words()

print(result)
```

**Explanation:** Each function takes one input and returns one output. The pipe chains them naturally. You could rearrange, add, or remove steps without touching the other functions.

</details>

### Exercise 2: Configurable Pipeline

Create a `make_pipeline()` function factory that takes a list of functions and returns a single composed function.

```r
# Create make_pipeline that accepts a list of functions
# and returns a single function that runs them in order

# Example usage:
# clean <- make_pipeline(list(trimws, tolower, \(x) gsub(" ", "-", x)))
# clean("  Hello World  ")  # "hello-world"

```

<details>
<summary>Click to reveal solution</summary>

```r
make_pipeline <- function(steps) {
  function(data) {
    Reduce(\(d, f) f(d), steps, init = data)
  }
}

clean <- make_pipeline(list(
  trimws,
  tolower,
  \(x) gsub("\\s+", "-", x)
))

tests <- c("  Hello World  ", "R Programming  ", "  DATA SCIENCE")
cat("Cleaned:", sapply(tests, clean, USE.NAMES = FALSE), "\n")

# Pipelines are composable too!
slug_maker <- make_pipeline(list(
  clean,
  \(x) gsub("[^a-z0-9-]", "", x)
))

cat("Slugs:", sapply(tests, slug_maker, USE.NAMES = FALSE), "\n")
```

**Explanation:** `make_pipeline` is a function factory that returns a composed function. The inner function uses `Reduce` to apply each step in order. Pipelines can even compose with other pipelines.

</details>

## Summary

| Principle | Implementation |
|-----------|---------------|
| Single responsibility | One function, one job |
| Data-first arguments | Enables piping with `\|>` |
| No side effects | Return data, don't print or write |
| Consistent types | Data frame in → data frame out |
| Composability | Small functions that chain together |
| Error handling | `tryCatch()` or purrr `safely()` |

## FAQ

### Should I use |> or %>%?

Use `|>` (native pipe, R 4.1+) for new code. It's built into R, requires no packages, and is slightly faster. Use `%>%` (magrittr) only if you need its extra features like `.` placeholder or `%<>%` assignment pipe.

### How small should a composable function be?

A function should do one conceptual thing. If you can describe what it does without the word "and," it's probably the right size. `clean_and_transform_and_save()` should be three functions.

### Don't small functions hurt performance?

Function call overhead in R is negligible for typical data analysis. The readability and reusability gains far outweigh microseconds of overhead. Only optimize hot loops after profiling.

## What's Next?

- [Functional Programming in R](/Functional-Programming-in-R.html) — the FP foundation
- [R Function Operators](/R-Function-Operators.html) — compose, negate, and memoize
- [Reduce, Filter, Map](/Reduce-Filter-Map-in-R.html) — base R's functional building blocks
