---
title: "Infix Functions in R: Write Your Own %op% Operators"
slug: "Infix-Functions-in-R"
description: "Create custom infix operators in R using the %op% syntax. Learn how pipe, formula, and comparison operators work internally."
keywords: "R infix functions, custom operators R, %op% R, pipe operator, R operator overloading"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-func-1"
post_type: "FR"
auto_link_terms: "infix functions|custom operators|%op% operators"
auto_link_case_sensitive: false
fr_parent: "Functional-Programming-in-R.html"
---

# Infix Functions in R: Write Your Own %op% Operators

<p class="lead">An <strong>infix function</strong> sits between its two arguments: <code>x + y</code> instead of <code>`+`(x, y)</code>. R lets you create custom infix operators using the <code>%name%</code> syntax.</p>

You use infix operators constantly: `+`, `-`, `*`, `%>%`, `%in%`, `<-`. What most R users don't know is that you can define your own. Any function named `%something%` automatically works as an infix operator.

## Built-in Infix Operators

Every operator in R is actually a function. You can call them in prefix form.

```r
# Normal (infix) usage
cat("3 + 4 =", 3 + 4, "\n")
cat("10 %% 3 =", 10 %% 3, "\n")  # modulo
cat("2 %in% c(1,2,3) =", 2 %in% c(1,2,3), "\n")

# Prefix form (function call syntax)
cat("`+`(3, 4) =", `+`(3, 4), "\n")
cat("`%%`(10, 3) =", `%%`(10, 3), "\n")
cat("`%in%`(2, c(1,2,3)) =", `%in%`(2, c(1,2,3)), "\n")
```

## Creating Custom Infix Operators

Define a function with a name wrapped in `%...%` and backticks.

```r
# Null coalescing operator (like Python's 'or' or JS's '??')
`%||%` <- function(a, b) {
  if (is.null(a)) b else a
}

x <- NULL
y <- 42
cat("x %||% y:", x %||% y, "\n")  # 42
cat("10 %||% y:", 10 %||% y, "\n") # 10
```

```r
# String concatenation operator
`%+%` <- function(a, b) paste0(a, b)

greeting <- "Hello" %+% " " %+% "World" %+% "!"
cat(greeting, "\n")

# Between operator
`%between%` <- function(x, range) {
  x >= range[1] & x <= range[2]
}

values <- c(3, 7, 12, 1, 9, 15)
cat("Between 5 and 10:", values %between% c(5, 10), "\n")
```

## Practical Custom Operators

### Default Value Operator

```r
# Use a default when value is NA (not NULL)
`%na%` <- function(x, default) {
  ifelse(is.na(x), default, x)
}

data <- c(1, NA, 3, NA, 5)
cat("Original:", data, "\n")
cat("With default:", data %na% 0, "\n")
```

### Not-In Operator

```r
# The opposite of %in%
`%notin%` <- function(x, table) {
  !(x %in% table)
}

fruits <- c("apple", "banana", "cherry", "date")
exclude <- c("banana", "date")

cat("Not in exclusion list:", fruits[fruits %notin% exclude], "\n")
```

### Approximate Equality

```r
# Check if two numbers are approximately equal
`%~%` <- function(a, b) {
  abs(a - b) < .Machine$double.eps^0.5
}

cat("0.1 + 0.2 == 0.3:", 0.1 + 0.2 == 0.3, "\n")  # FALSE!
cat("0.1 + 0.2 %~% 0.3:", (0.1 + 0.2) %~% 0.3, "\n")  # TRUE
```

## How the Pipe Operators Work

The pipe operators `%>%` and `|>` are just infix functions (though `|>` is a language-level construct).

```r
# The magrittr pipe is essentially:
`%pipe%` <- function(lhs, rhs) {
  rhs(lhs)
}

result <- 1:10 %pipe% mean %pipe% round
cat("Result:", result, "\n")
```

## Rules for Custom Operators

| Rule | Example |
|------|---------|
| Must start and end with `%` | `%op%`, `%+%`, `%between%` |
| Name goes inside the `%` signs | `%myop%` |
| Must be defined with backticks | `` `%myop%` <- function(a, b) ... `` |
| Always takes exactly 2 arguments | Left operand and right operand |
| Can contain letters, numbers, `.` | `%do.call%`, `%v2%` |

## Practice Exercises

### Exercise 1: Range Check Operator

Create a `%within%` operator that checks if values fall within a named range.

```r
# Create %within% that works like:
# 5 %within% c(1, 10)   -> TRUE
# 15 %within% c(1, 10)  -> FALSE
# c(3, 7, 12) %within% c(5, 10)  -> FALSE TRUE FALSE

```

<details>
<summary>Click to reveal solution</summary>

```r
`%within%` <- function(x, range) {
  x > range[1] & x < range[2]  # Exclusive bounds
}

cat("5 %within% c(1,10):", 5 %within% c(1, 10), "\n")
cat("15 %within% c(1,10):", 15 %within% c(1, 10), "\n")

values <- c(3, 7, 12, 5, 10)
cat("Values:", values, "\n")
cat("Within (5,10):", values %within% c(5, 10), "\n")
```

**Explanation:** Custom operators are normal functions that happen to use infix syntax. The left side becomes the first argument, the right side becomes the second.

</details>

## Summary

| Operator | Purpose | Package |
|----------|---------|---------|
| `%>%` | Forward pipe | magrittr |
| `%in%` | Membership test | base |
| `%%` | Modulo | base |
| `%*%` | Matrix multiply | base |
| `%o%` | Outer product | base |
| `%||%` | Null coalescing | rlang/custom |
| `%+%` | ggplot2 layer add | ggplot2 |

## FAQ

### Are custom operators slower than regular functions?

No. An infix operator is just a regular function with special syntax. There is no performance penalty.

### Can I override built-in operators like + or *?

Yes, but you shouldn't for primitive types. You can define methods for custom S3/S4 classes: `"+.myclass" <- function(a, b) ...`. Overriding for base types creates confusing code.

### Why do custom operators need % signs?

The `%...%` syntax is R's way of distinguishing user-defined infix operators from built-in ones. Without it, the parser wouldn't know if `myop` is a variable or an operator.

## What's Next?

- [Functional Programming in R](/Functional-Programming-in-R.html) — the parent tutorial
- [R Function Operators](/R-Function-Operators.html) — compose, negate, and partial
- [Operator Overloading in R](/Operator-Overloading-in-R.html) — define +, -, == for custom classes
