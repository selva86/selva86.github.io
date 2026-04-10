---
title: "Operator Overloading in R: Define Custom +, -, ==, [ & print Methods"
slug: "Operator-Overloading-in-R"
description: "Learn to overload operators in R using S3 and S4 methods. Define custom +, -, *, ==, [, print, and comparison operators for your own classes."
keywords: "operator overloading R, custom operators R, S3 operators, S4 operators, Ops group generic, R operator methods"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.8"
post_type: "C"
auto_link_terms: "operator overloading|Ops group generic|custom operators R"
auto_link_case_sensitive: false
---

# Operator Overloading in R: Define Custom +, -, ==, [ & print Methods

<p class="lead">R lets you define what <code>+</code>, <code>-</code>, <code>==</code>, <code>[</code>, and other operators do for your custom classes. This is called <strong>operator overloading</strong>. Both S3 and S4 support it, and it's how base R makes <code>+</code> work differently for numbers, dates, and strings.</p>

When you type `Sys.Date() + 1`, R doesn't use the same `+` as `2 + 3`. It dispatches to a method specialized for Date objects. You can define the same behavior for your own classes.

## S3 Operator Overloading Basics

In S3, operators are generic functions. Define a method named `operator.ClassName` to overload it.

```r
# A simple 2D point class
Point <- function(x, y) {
  structure(list(x = x, y = y), class = "Point")
}

print.Point <- function(p, ...) {
  cat("(", p$x, ",", p$y, ")\n")
}

# Overload + for Point
`+.Point` <- function(e1, e2) {
  if (inherits(e2, "Point")) {
    Point(e1$x + e2$x, e1$y + e2$y)
  } else if (is.numeric(e2)) {
    Point(e1$x + e2, e1$y + e2)
  } else {
    stop("Cannot add Point and ", class(e2))
  }
}

# Overload - for Point
`-.Point` <- function(e1, e2) {
  if (missing(e2)) {
    Point(-e1$x, -e1$y)  # Unary minus
  } else if (inherits(e2, "Point")) {
    Point(e1$x - e2$x, e1$y - e2$y)
  } else {
    stop("Cannot subtract")
  }
}

# Overload == for Point
`==.Point` <- function(e1, e2) {
  e1$x == e2$x && e1$y == e2$y
}

a <- Point(3, 4)
b <- Point(1, 2)

print(a)
print(a + b)       # Point + Point
print(a + 10)      # Point + scalar
print(a - b)       # Point - Point
print(-a)          # Unary minus
cat("a == b:", a == b, "\n")
cat("a == a:", a == Point(3, 4), "\n")
```

## The Ops Group Generic

Instead of defining `+.MyClass`, `-.MyClass`, `*.MyClass` separately, you can define `Ops.MyClass` to handle all arithmetic and comparison operators at once.

```r
# A Money class using the Ops group generic
Money <- function(amount, currency = "USD") {
  structure(list(amount = amount, currency = currency), class = "Money")
}

print.Money <- function(x, ...) {
  cat(x$currency, formatC(x$amount, format = "f", digits = 2), "\n")
}

Ops.Money <- function(e1, e2) {
  # .Generic holds the operator being used
  op <- .Generic

  # Extract amounts
  a1 <- if (inherits(e1, "Money")) e1$amount else e1
  a2 <- if (inherits(e2, "Money")) e2$amount else e2

  # Get currency (from whichever is Money)
  curr <- if (inherits(e1, "Money")) e1$currency else e2$currency

  # Check currency match for two Money objects
  if (inherits(e1, "Money") && inherits(e2, "Money")) {
    if (e1$currency != e2$currency) stop("Currency mismatch")
  }

  # Compute result
  result <- switch(op,
    "+"  = a1 + a2,
    "-"  = a1 - a2,
    "*"  = a1 * a2,
    "/"  = a1 / a2,
    "==" = a1 == a2,
    "!=" = a1 != a2,
    "<"  = a1 < a2,
    "<=" = a1 <= a2,
    ">"  = a1 > a2,
    ">=" = a1 >= a2,
    stop("Operator ", op, " not supported for Money")
  )

  # Comparisons return logical; arithmetic returns Money
  if (op %in% c("==", "!=", "<", "<=", ">", ">=")) {
    return(result)
  }
  Money(result, curr)
}

price <- Money(29.99)
tax <- Money(2.40)
print(price + tax)
print(price * 3)
cat("price > tax:", price > tax, "\n")
cat("price == price:", price == Money(29.99), "\n")
```

## Overloading [ and [[

The subset operators `[` and `[[` are internal generics. You can define methods for them.

```r
# A named collection class
Collection <- function(...) {
  items <- list(...)
  structure(items, class = "Collection")
}

print.Collection <- function(x, ...) {
  cat("Collection with", length(x), "items:\n")
  for (i in seq_along(x)) {
    name <- names(x)[i]
    if (is.null(name) || name == "") name <- paste0("[", i, "]")
    cat("  ", name, ":", x[[i]], "\n")
  }
}

# Override [ to return a Collection (not a plain list)
`[.Collection` <- function(x, i) {
  result <- unclass(x)[i]
  structure(result, class = "Collection")
}

# Override [[ for single element access
`[[.Collection` <- function(x, i) {
  unclass(x)[[i]]
}

# Override length
length.Collection <- function(x) {
  length(unclass(x))
}

coll <- Collection(a = 10, b = 20, c = 30, d = 40)
print(coll)
cat("\nSubset [2:3]:\n")
print(coll[2:3])
cat("\nElement [[1]]:", coll[[1]], "\n")
```

## Overloading print, summary, and format

These are the most commonly overloaded generics. Every class should have at least a `print` method.

```r
# A regression result class
RegResult <- function(formula, r_squared, coefficients) {
  structure(
    list(formula = formula, r_squared = r_squared, coefficients = coefficients),
    class = "RegResult"
  )
}

print.RegResult <- function(x, ...) {
  cat("Linear Regression:", deparse(x$formula), "\n")
  cat("R-squared:", round(x$r_squared, 4), "\n")
}

summary.RegResult <- function(object, ...) {
  cat("=== Regression Summary ===\n")
  cat("Formula:", deparse(object$formula), "\n")
  cat("R-squared:", round(object$r_squared, 4), "\n")
  cat("Coefficients:\n")
  for (nm in names(object$coefficients)) {
    cat("  ", nm, "=", round(object$coefficients[[nm]], 4), "\n")
  }
}

format.RegResult <- function(x, ...) {
  paste0("RegResult(R2=", round(x$r_squared, 3), ")")
}

# Use it
fit <- lm(mpg ~ wt + hp, data = mtcars)
result <- RegResult(
  formula = mpg ~ wt + hp,
  r_squared = summary(fit)$r.squared,
  coefficients = as.list(coef(fit))
)

print(result)
cat("\n")
summary(result)
cat("\nFormatted:", format(result), "\n")
```

## S4 Operator Overloading

S4 uses `setMethod()` for operators. The approach is more formal but the result is the same.

```r
setClass("Fraction",
  slots = list(num = "integer", den = "integer"),
  validity = function(object) {
    if (object@den == 0L) "denominator cannot be zero"
    else TRUE
  }
)

Fraction <- function(num, den) {
  new("Fraction", num = as.integer(num), den = as.integer(den))
}

setMethod("show", "Fraction", function(object) {
  cat(object@num, "/", object@den, "\n")
})

setMethod("+", signature("Fraction", "Fraction"), function(e1, e2) {
  new_num <- e1@num * e2@den + e2@num * e1@den
  new_den <- e1@den * e2@den
  Fraction(new_num, new_den)
})

setMethod("*", signature("Fraction", "Fraction"), function(e1, e2) {
  Fraction(e1@num * e2@num, e1@den * e2@den)
})

setMethod("==", signature("Fraction", "Fraction"), function(e1, e2) {
  e1@num * e2@den == e2@num * e1@den
})

a <- Fraction(1, 3)
b <- Fraction(1, 6)
cat("a: "); show(a)
cat("b: "); show(b)
cat("a + b: "); show(a + b)
cat("a * b: "); show(a * b)
cat("a == a:", a == a, "\n")
```

## Summary Table

| Operator | S3 Method Name | S4 Signature | Group |
|----------|----------------|-------------|-------|
| `+`, `-`, `*`, `/` | `+.Class`, etc. | `setMethod("+", ...)` | Ops |
| `==`, `!=`, `<`, `>` | `==.Class`, etc. | `setMethod("==", ...)` | Ops |
| `[` | `[.Class` | `setMethod("[", ...)` | N/A (internal) |
| `[[` | `[[.Class` | `setMethod("[[", ...)` | N/A (internal) |
| `$` | `$.Class` | `setMethod("$", ...)` | N/A (internal) |
| `print` | `print.Class` | `setMethod("show", ...)` | N/A |
| `summary` | `summary.Class` | `setMethod("summary", ...)` | N/A |
| `format` | `format.Class` | `setMethod("format", ...)` | N/A |
| `abs`, `sqrt`, `log` | `Math.Class` (group) | `setMethod("Math", ...)` | Math |

## Practice Exercises

**Exercise 1:** Create a `Percentage` class where `Percentage(50) + Percentage(30)` returns `Percentage(80)`, `print` shows `"50%"`, and `as.numeric` returns `0.5`.

<details><summary>Click to reveal solution</summary>

```r
Percentage <- function(x) {
  structure(list(value = x), class = "Percentage")
}
print.Percentage <- function(x, ...) cat(x$value, "%\n")
as.numeric.Percentage <- function(x, ...) x$value / 100

`+.Percentage` <- function(e1, e2) {
  v1 <- if (inherits(e1, "Percentage")) e1$value else e1
  v2 <- if (inherits(e2, "Percentage")) e2$value else e2
  Percentage(v1 + v2)
}

print(Percentage(50) + Percentage(30))
cat("As numeric:", as.numeric(Percentage(50)), "\n")
```

</details>

**Exercise 2:** Create a `Matrix2x2` class with overloaded `*` for matrix multiplication and `print` for formatted display.

<details><summary>Click to reveal solution</summary>

```r
Matrix2x2 <- function(a, b, c, d) {
  structure(list(data = matrix(c(a, c, b, d), 2, 2)), class = "Matrix2x2")
}
print.Matrix2x2 <- function(x, ...) {
  cat("| ", x$data[1,1], x$data[1,2], "|\n")
  cat("| ", x$data[2,1], x$data[2,2], "|\n")
}
`*.Matrix2x2` <- function(e1, e2) {
  r <- e1$data %*% e2$data
  Matrix2x2(r[1,1], r[1,2], r[2,1], r[2,2])
}

A <- Matrix2x2(1, 2, 3, 4)
B <- Matrix2x2(5, 6, 7, 8)
cat("A:\n"); print(A)
cat("B:\n"); print(B)
cat("A * B:\n"); print(A * B)
```

</details>

## FAQ

**Q: Which operators can I overload in R?**
Almost all of them: arithmetic (`+`, `-`, `*`, `/`, `^`, `%%`, `%/%`), comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`), logical (`&`, `|`, `!`), subsetting (`[`, `[[`, `$`), and display (`print`, `format`, `summary`). You can also define custom infix operators like `%between%`.

**Q: What happens when the left operand is not my class (e.g., 5 + MyObj)?**
For S3, R checks the class of both operands. If neither has a method, it falls back to the default. In your Ops method, use `.Generic` and check which argument has your class.

**Q: Should I use Ops group generic or individual operator methods?**
Use the Ops group generic when the logic is similar for all operators (e.g., extract values, apply operator, wrap result). Use individual methods when different operators need very different logic.

## Continue Learning
- [S3 Method Dispatch in R](S3-Method-Dispatch-in-R.html) -- Understand the dispatch mechanism behind operator methods
- [S4 Methods & Multiple Dispatch](S4-Methods-in-R.html) -- Formal operator overloading with S4
- [OOP in R Overview](OOP-in-R.html) -- Compare all four OOP systems
