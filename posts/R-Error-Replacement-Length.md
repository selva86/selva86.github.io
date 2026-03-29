---
title: "R Error: replacement has length zero — The NA Assignment Bug"
slug: "R-Error-Replacement-Length"
description: "Fix R's 'replacement has length zero' error caused by NULL assignments, empty vectors, or conditional logic returning nothing. Step-by-step solutions inside."
keywords: "R replacement has length zero, R NULL assignment, R empty replacement, R conditional assignment error, R replacement length"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "ERR4"
post_type: "FR"
auto_link_terms: "replacement has length zero"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
---

# R Error: replacement has length zero — The NA Assignment Bug

<p class="lead"><code>Error in x[[i]] &lt;- value : replacement has length zero</code> means you tried to assign a zero-length value (like <code>NULL</code>, <code>character(0)</code>, or <code>integer(0)</code>) into a position that expects a real value. This often happens when a lookup or computation silently returns nothing.</p>

## Reproducing the Error

```r
x <- list(a = 1, b = 2, c = 3)

# Assigning NULL to a list element with [[ removes it
x[["a"]] <- NULL
cat("After NULL assignment, 'a' is gone:", paste(names(x), collapse = ", "), "\n")

# But assigning NULL to a vector element is an error:
v <- 1:5
tryCatch(
  v[[3]] <- NULL,
  error = function(e) cat("Error:", conditionMessage(e), "\n")
)
```

```r
# The more common trigger: a function returns length-0 result
result <- character(0)  # Empty character vector
cat("Length of result:", length(result), "\n")

v <- c("a", "b", "c")
tryCatch(
  v[[2]] <- result,
  error = function(e) cat("Error:", conditionMessage(e), "\n")
)
```

## Cause 1: Lookup Returns Nothing

```r
# Looking up a value that doesn't exist
lookup_table <- c(cat = "meow", dog = "woof", bird = "tweet")

# This returns a named NA — but the name is NA too
animal <- "fish"
sound <- lookup_table[animal]
cat("Lookup result:", sound, "\n")
cat("Is NA:", is.na(sound), "\n")

# With match(), no-match returns NA
idx <- match("fish", names(lookup_table))
cat("match result:", idx, "\n")

# Safe lookup pattern:
safe_lookup <- function(table, key, default = "unknown") {
  result <- table[key]
  if (is.na(result)) default else unname(result)
}

cat("Safe lookup:", safe_lookup(lookup_table, "fish"), "\n")
cat("Safe lookup:", safe_lookup(lookup_table, "cat"), "\n")
```

## Cause 2: grep/which Returns integer(0)

```r
data <- c("apple", "banana", "cherry")

# grep returns integer(0) when nothing matches
idx <- grep("mango", data)
cat("grep result:", idx, "\n")
cat("Length:", length(idx), "\n")

# Using this empty result for assignment causes issues
results <- character(3)
if (length(idx) > 0) {
  results[idx] <- "found"
} else {
  cat("No matches — skipping assignment\n")
}

# Pattern: always check length before using grep/which results
matches <- grep("an", data)
cat("Matches for 'an':", matches, "\n")
if (length(matches) > 0) {
  cat("Found:", data[matches], "\n")
}
```

## Cause 3: Conditional Assignment with Empty Result

```r
# A function that sometimes returns nothing
get_value <- function(x) {
  if (x > 0) return(x * 2)
  # Implicitly returns NULL when x <= 0
}

cat("get_value(5):", get_value(5), "\n")
cat("get_value(-1):", get_value(-1), "\n")  # NULL
cat("is.null:", is.null(get_value(-1)), "\n")

# Using this in assignment:
results <- numeric(5)
inputs <- c(3, -1, 5, 0, 2)

for (i in seq_along(inputs)) {
  val <- get_value(inputs[i])
  # Fix: check for NULL before assigning
  results[i] <- if (!is.null(val)) val else NA
}
cat("Results:", results, "\n")
```

## Cause 4: Subsetting an Empty Data Frame

```r
df <- data.frame(name = c("Alice", "Bob"), score = c(88, 92))

# Filter returns 0 rows
filtered <- df[df$score > 100, ]
cat("Filtered rows:", nrow(filtered), "\n")

# Trying to extract from empty result
tryCatch(
  {
    best_name <- filtered$name[[1]]
    cat("Best:", best_name, "\n")
  },
  error = function(e) cat("Error:", conditionMessage(e), "\n")
)

# Fix: check nrow() before extracting
if (nrow(filtered) > 0) {
  cat("Best:", filtered$name[[1]], "\n")
} else {
  cat("No results matching criteria\n")
}
```

## Prevention Patterns

```r
# Pattern 1: Use %||% (null coalesce) — available in rlang, or define your own
`%||%` <- function(a, b) if (!is.null(a) && length(a) > 0) a else b

result <- NULL %||% "default"
cat("NULL coalesce:", result, "\n")

result2 <- character(0) %||% "fallback"
cat("Empty coalesce:", result2, "\n")

result3 <- "actual_value" %||% "default"
cat("Non-null:", result3, "\n")
```

```r
# Pattern 2: Defensive function returns
safe_first <- function(x, default = NA) {
  if (length(x) == 0 || is.null(x)) return(default)
  x[[1]]
}

cat("Normal:", safe_first(c(10, 20)), "\n")
cat("Empty:", safe_first(integer(0)), "\n")
cat("NULL:", safe_first(NULL), "\n")

# Pattern 3: Validate before loop assignment
populate <- function(values, transform) {
  results <- vector("list", length(values))
  for (i in seq_along(values)) {
    out <- transform(values[[i]])
    results[[i]] <- if (length(out) > 0) out else NA
  }
  results
}

filled <- populate(list(5, -1, 3), function(x) if (x > 0) x^2 else NULL)
cat("Populated:", paste(filled, collapse = ", "), "\n")
```

## Practice Exercise

```r
# Exercise: This code crashes when processing certain records.
# Fix it so it handles missing/empty values gracefully.

records <- list(
  list(name = "Alice", scores = c(80, 90, 85)),
  list(name = "Bob", scores = c()),           # Empty scores
  list(name = "Carol", scores = c(70, 88)),
  list(name = "Dave", scores = NULL)           # NULL scores
)

# This crashes:
# for (r in records) {
#   avg <- mean(r$scores)
#   cat(r$name, ":", avg, "\n")
# }

# Fix it below:

```

<details>
<summary>Click to reveal solution</summary>

```r
records <- list(
  list(name = "Alice", scores = c(80, 90, 85)),
  list(name = "Bob", scores = c()),
  list(name = "Carol", scores = c(70, 88)),
  list(name = "Dave", scores = NULL)
)

for (r in records) {
  if (is.null(r$scores) || length(r$scores) == 0) {
    cat(r$name, ": No scores available\n")
  } else {
    avg <- mean(r$scores)
    cat(r$name, ":", round(avg, 1), "\n")
  }
}
```

**Explanation:** Check for both `NULL` and zero-length (`length() == 0`) before computing. `mean(c())` returns `NaN` and `mean(NULL)` returns `NA` with a warning — neither is useful. Explicit checking gives a clear message.

</details>

## Summary

| Cause | What Returns Empty | Fix |
|-------|-------------------|-----|
| Lookup miss | `table["nonexistent"]` | Use default: `table[x] %||% default` |
| `grep`/`which` no match | `integer(0)` | Check `length() > 0` before use |
| Function returns NULL | `if (cond) value` (no else) | Always include `else` clause |
| Empty filter | `df[FALSE, ]` | Check `nrow() > 0` |
| NULL assignment to vector | `v[[i]] <- NULL` | Use `NA` instead of `NULL` |

## FAQ

### What's the difference between NULL, NA, and character(0)?

`NULL` means "nothing" — the object doesn't exist. `NA` means "missing value" — a placeholder in a vector. `character(0)` (or `integer(0)`, `numeric(0)`) means "empty vector" — it exists but has zero elements. All three can cause "replacement has length zero" when used as assignments.

### Why does R allow NULL assignment for lists but not vectors?

In lists, `x[["name"]] <- NULL` is a valid operation that *removes* the element. In atomic vectors, every position must have a value (possibly NA), so NULL assignment is meaningless and throws an error.

## What's Next?

1. **R Error: object 'x' not found** — the most common R error
2. **R Error: subscript out of bounds** — indexing beyond length
3. **R Common Errors** — the full reference of 50 common errors
