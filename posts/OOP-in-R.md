---
title: "OOP in R: S3 vs S4 vs R5 vs R6 — When to Use Each System"
slug: "OOP-in-R"
description: "Compare R's four OOP systems: S3 (informal), S4 (formal), R5 (reference classes), and R6 (modern). Learn when to use each with side-by-side examples."
keywords: "OOP in R, S3 classes R, S4 classes R, R5 reference classes, R6 classes, object oriented R, R class systems"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.1"
post_type: "C"
auto_link_terms: "OOP in R|S3 vs S4|R6 classes|object oriented R"
auto_link_case_sensitive: false
---

# OOP in R: S3 vs S4 vs R5 vs R6 — When to Use Each System

<p class="lead">R has four object-oriented programming systems: <strong>S3</strong> (simple, informal), <strong>S4</strong> (formal, strict), <strong>R5/Reference Classes</strong> (mutable), and <strong>R6</strong> (modern, fast). This guide compares all four and tells you when to pick each one.</p>

Most languages have one OOP system. R has four, because they evolved over decades to serve different needs. You don't need to master all four — but you need to recognize them in the wild and know which one fits your project.

## The Big Picture

| System | Style | Mutability | Validation | Speed | Use case |
|--------|-------|-----------|------------|-------|----------|
| S3 | Informal | Copy-on-modify | None built-in | Fast | Quick classes, most packages |
| S4 | Formal | Copy-on-modify | Strict slots | Medium | Bioconductor, complex hierarchies |
| R5 | Reference | Mutable | Optional | Slow | Legacy mutable objects |
| R6 | Reference | Mutable | Optional | Fast | Modern mutable objects, APIs |

## S3: The Informal System

S3 is R's most common OOP system. It's what `lm()`, `data.frame`, and `factor` use. There's no formal class definition — you just set an attribute.

```r
# Create an S3 object: it's just a list with a "class" attribute
dog <- list(name = "Rex", breed = "Labrador", age = 5)
class(dog) <- "Dog"

# Define a method: create a function named generic.class
print.Dog <- function(x, ...) {
  cat(sprintf("Dog: %s (%s, %d years old)\n", x$name, x$breed, x$age))
}

# R dispatches print() to print.Dog automatically
print(dog)

# S3 is informal — no validation, no enforcement
dog$color <- "brown"  # Add any field anytime
dog$age <- "old"      # No type checking
```

### S3 Constructors and Methods

```r
# Best practice: create a constructor function
new_Dog <- function(name, breed, age) {
  obj <- list(name = name, breed = breed, age = age)
  class(obj) <- "Dog"
  obj
}

# Define methods for generics
summary.Dog <- function(object, ...) {
  cat("Dog Summary\n")
  cat("  Name:", object$name, "\n")
  cat("  Breed:", object$breed, "\n")
  cat("  Human years:", object$age * 7, "\n")
}

bark <- function(x, ...) UseMethod("bark")
bark.Dog <- function(x, ...) cat(x$name, "says: Woof!\n")

rex <- new_Dog("Rex", "Labrador", 5)
summary(rex)
bark(rex)
```

## S4: The Formal System

S4 enforces structure with `setClass()`, typed slots, and `setGeneric()`/`setMethod()`. It's used heavily in Bioconductor.

```r
# Define class with typed slots
setClass("Person", representation(
  name = "character",
  age = "numeric",
  email = "character"
))

# Create an instance
alice <- new("Person", name = "Alice", age = 30, email = "alice@example.com")

# Access slots with @
cat("Name:", alice@name, "\n")
cat("Age:", alice@age, "\n")

# Slots are type-checked
# new("Person", name = "Bob", age = "thirty")  # Error!
```

```r
# S4 methods
setClass("Person", representation(
  name = "character",
  age = "numeric"
))

setGeneric("greet", function(x, ...) standardGeneric("greet"))
setMethod("greet", "Person", function(x, ...) {
  cat("Hi, I'm", x@name, "and I'm", x@age, "\n")
})

bob <- new("Person", name = "Bob", age = 25)
greet(bob)
```

## R6: The Modern Reference System

R6 classes use reference semantics (objects are mutable) and have a clean, familiar syntax. Install with `install.packages("R6")`.

```r
library(R6)

BankAccount <- R6Class("BankAccount",
  public = list(
    owner = NULL,
    initialize = function(owner, balance = 0) {
      self$owner <- owner
      private$bal <- balance
    },
    deposit = function(amount) {
      private$bal <- private$bal + amount
      cat("Deposited $", amount, ". Balance: $", private$bal, "\n")
      invisible(self)
    },
    withdraw = function(amount) {
      if (amount > private$bal) stop("Insufficient funds")
      private$bal <- private$bal - amount
      cat("Withdrew $", amount, ". Balance: $", private$bal, "\n")
      invisible(self)
    },
    get_balance = function() private$bal
  ),
  private = list(
    bal = 0
  )
)

acct <- BankAccount$new("Alice", 1000)
acct$deposit(500)
acct$withdraw(200)
cat("Final balance: $", acct$get_balance(), "\n")
```

### R6 Reference Semantics

```r
library(R6)

Counter <- R6Class("Counter",
  public = list(
    count = 0,
    increment = function() { self$count <- self$count + 1; invisible(self) }
  )
)

c1 <- Counter$new()
c2 <- c1  # NOT a copy — same object!

c1$increment()
c1$increment()
cat("c1$count:", c1$count, "\n")
cat("c2$count:", c2$count, "\n")  # Also 2!

# To make a true copy:
c3 <- c1$clone()
c1$increment()
cat("\nAfter c1$increment():\n")
cat("c1:", c1$count, "  c3:", c3$count, "\n")
```

## Side-by-Side Comparison

```r
# S3 version
new_Point_S3 <- function(x, y) {
  obj <- list(x = x, y = y)
  class(obj) <- "Point"
  obj
}
print.Point <- function(p, ...) cat(sprintf("(%g, %g)\n", p$x, p$y))

p1 <- new_Point_S3(3, 4)
print(p1)
```

```r
# S4 version
setClass("PointS4", representation(x = "numeric", y = "numeric"))
setMethod("show", "PointS4", function(object) {
  cat(sprintf("(%g, %g)\n", object@x, object@y))
})

p2 <- new("PointS4", x = 3, y = 4)
p2
```

```r
# R6 version
library(R6)
PointR6 <- R6Class("PointR6",
  public = list(
    x = NULL, y = NULL,
    initialize = function(x, y) { self$x <- x; self$y <- y },
    print = function(...) cat(sprintf("(%g, %g)\n", self$x, self$y))
  )
)

p3 <- PointR6$new(3, 4)
p3
```

## Decision Guide

![R OOP system decision guide](screenshots/OOP-in-R-decision-guide.webp)

*Figure 1: Choose S3 for most packages (simple dispatch), S4 for strict types and Bioconductor, R6 for mutable state and reference semantics, R5 only for legacy code.*

| Choose... | When... |
|-----------|---------|
| **S3** | You need simple method dispatch, compatibility with base R, or you're building a CRAN package |
| **S4** | You need strict type checking, multiple dispatch, or you're in the Bioconductor ecosystem |
| **R6** | You need mutable objects (connections, caches, stateful APIs) or you prefer `obj$method()` syntax |
| **R5** | Only for maintaining legacy code — use R6 for new projects |

## Practice Exercises

### Exercise 1: Create an S3 Class

Build a `Temperature` S3 class that stores a value and unit, with a `print` method.

```r
# Create new_Temperature(value, unit = "C")
# print.Temperature should display "25°C" or "77°F"
# Create a convert() generic that converts between C and F

```

<details>
<summary>Click to reveal solution</summary>

```r
new_Temperature <- function(value, unit = "C") {
  stopifnot(unit %in% c("C", "F"))
  obj <- list(value = value, unit = unit)
  class(obj) <- "Temperature"
  obj
}

print.Temperature <- function(x, ...) {
  cat(sprintf("%.1f°%s\n", x$value, x$unit))
}

convert <- function(x, ...) UseMethod("convert")
convert.Temperature <- function(x, to, ...) {
  if (x$unit == to) return(x)
  if (x$unit == "C" && to == "F") return(new_Temperature(x$value * 9/5 + 32, "F"))
  if (x$unit == "F" && to == "C") return(new_Temperature((x$value - 32) * 5/9, "C"))
}

boiling <- new_Temperature(100, "C")
print(boiling)
print(convert(boiling, "F"))

body_temp <- new_Temperature(98.6, "F")
print(body_temp)
print(convert(body_temp, "C"))
```

**Explanation:** S3 classes are just lists with a class attribute. Methods follow the `generic.class` naming convention. `UseMethod()` enables dispatch.

</details>

### Exercise 2: R6 Stack

Implement a stack (LIFO data structure) using R6.

```r
library(R6)

# Create a Stack R6 class with:
# - push(item): add to top
# - pop(): remove and return top
# - peek(): view top without removing
# - size(): return number of elements
# - is_empty(): TRUE/FALSE

```

<details>
<summary>Click to reveal solution</summary>

```r
library(R6)

Stack <- R6Class("Stack",
  public = list(
    initialize = function() private$items <- list(),
    push = function(item) {
      private$items <- c(list(item), private$items)
      invisible(self)
    },
    pop = function() {
      if (self$is_empty()) stop("Stack is empty")
      item <- private$items[[1]]
      private$items <- private$items[-1]
      item
    },
    peek = function() {
      if (self$is_empty()) stop("Stack is empty")
      private$items[[1]]
    },
    size = function() length(private$items),
    is_empty = function() length(private$items) == 0,
    print = function(...) {
      cat("Stack [", self$size(), "items ]")
      if (!self$is_empty()) cat(" top:", format(self$peek()))
      cat("\n")
    }
  ),
  private = list(items = NULL)
)

s <- Stack$new()
s$push(10)$push(20)$push(30)
print(s)
cat("Pop:", s$pop(), "\n")
cat("Peek:", s$peek(), "\n")
cat("Size:", s$size(), "\n")
```

**Explanation:** R6 classes use `self$` to access their own fields and methods. `invisible(self)` enables method chaining. Private fields keep internal state hidden.

</details>

## Summary

| Feature | S3 | S4 | R5 | R6 |
|---------|----|----|----|----|
| Define class | `class(x) <- "Foo"` | `setClass()` | `setRefClass()` | `R6Class()` |
| Create object | `new_Foo()` | `new("Foo")` | `Foo$new()` | `Foo$new()` |
| Access fields | `x$field` | `x@slot` | `x$field` | `x$field` |
| Define methods | `method.Class` | `setMethod()` | Inside class | Inside class |
| Inheritance | Implicit | `contains=` | `contains=` | `inherit=` |
| Copy semantics | Copy-on-modify | Copy-on-modify | Reference | Reference |
| Package needed | No | No | No | R6 |

## FAQ

### Which OOP system should I learn first?

S3. It's used by most R packages and base R itself. Learn R6 next if you need mutable objects. Only learn S4 when you need it (Bioconductor work, formal validation).

### Can I mix OOP systems?

Yes. S3 and S4 interoperate (S4 can inherit from S3). R6 objects can have S3 methods added to them. In practice, pick one system per class and stick with it.

### Why does R have so many OOP systems?

Historical evolution. S3 came from S (1990s). S4 was added for stricter needs. R5 added reference semantics. R6 was created as a faster, cleaner alternative to R5. Each solved a real problem at the time.

## Continue Learning

- [S3 Classes in R](/S3-Classes-in-R.html) — deep dive into creating and using S3
- [R6 Classes in R](/R6-Classes-in-R.html) — modern R OOP with reference semantics
- [S4 Classes in R](/S4-Classes-in-R.html) — formal OOP for complex hierarchies
