---
title: "S3 Classes in R: Create, Inherit & Write Methods — Complete Tutorial"
slug: "S3-Classes-in-R"
description: "Master S3 classes in R: create constructors, write print/summary methods, implement inheritance, and understand dispatch. Interactive examples."
keywords: "S3 classes R, R S3 methods, UseMethod, S3 inheritance, R class system, print method R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.2"
post_type: "C"
auto_link_terms: "S3 classes|S3 methods|UseMethod"
auto_link_case_sensitive: true
---

# S3 Classes in R: Create, Inherit & Write Methods — Complete Tutorial

<p class="lead">S3 is R's most widely used OOP system. It powers <code>data.frame</code>, <code>lm</code>, <code>factor</code>, and nearly every base R object. This tutorial teaches you to create your own S3 classes with proper constructors, methods, and inheritance.</p>

S3 is "informal" OOP — there's no formal class definition, no type checking on fields, and no enforcement. The trade-off is simplicity: you can create an S3 class in two lines. This flexibility is why most R packages use S3.

## Creating an S3 Class

An S3 object is just a base R object (usually a list) with a `class` attribute.

```r
# The simplest S3 class: a list with a class attribute
person <- list(name = "Alice", age = 30)
class(person) <- "Person"

# Verify
cat("Class:", class(person), "\n")
cat("Is list?", is.list(person), "\n")
str(person)
```

### Proper Constructor (Best Practice)

Always create a constructor function that validates inputs.

```r
new_Person <- function(name, age, email = NA_character_) {
  stopifnot(is.character(name), length(name) == 1)
  stopifnot(is.numeric(age), age >= 0)

  obj <- list(name = name, age = age, email = email)
  class(obj) <- "Person"
  obj
}

alice <- new_Person("Alice", 30, "alice@example.com")
bob <- new_Person("Bob", 25)
print(alice$name)
```

## Writing S3 Methods

S3 method dispatch works by naming: when you call `print(x)`, R looks for `print.ClassName`.

### print() Method

```r
new_Person <- function(name, age) {
  obj <- list(name = name, age = age)
  class(obj) <- "Person"
  obj
}

print.Person <- function(x, ...) {
  cat(sprintf("Person: %s (age %d)\n", x$name, x$age))
  invisible(x)
}

alice <- new_Person("Alice", 30)
alice   # Calls print.Person automatically
```

### summary() Method

```r
new_Person <- function(name, age) {
  obj <- list(name = name, age = age)
  class(obj) <- "Person"
  obj
}

print.Person <- function(x, ...) {
  cat(sprintf("Person: %s (age %d)\n", x$name, x$age))
  invisible(x)
}

summary.Person <- function(object, ...) {
  cat("=== Person Summary ===\n")
  cat("Name:", object$name, "\n")
  cat("Age:", object$age, "\n")
  cat("Generation:", ifelse(object$age < 30, "Young", "Experienced"), "\n")
}

alice <- new_Person("Alice", 30)
summary(alice)
```

### Custom Generics

```r
new_Person <- function(name, age) {
  obj <- list(name = name, age = age)
  class(obj) <- "Person"
  obj
}

# Define a new generic function
greet <- function(x, ...) UseMethod("greet")

# Method for Person class
greet.Person <- function(x, ...) {
  cat("Hello! I'm", x$name, "\n")
}

# Default method for unrecognized classes
greet.default <- function(x, ...) {
  cat("Hello from an unknown object\n")
}

alice <- new_Person("Alice", 30)
greet(alice)
greet("not a person")
```

## S3 Inheritance

S3 inheritance uses a character vector as the class attribute. The first element is the most specific class.

```r
# Parent: Animal
new_Animal <- function(name, sound) {
  obj <- list(name = name, sound = sound)
  class(obj) <- "Animal"
  obj
}

speak <- function(x, ...) UseMethod("speak")
speak.Animal <- function(x, ...) cat(x$name, "says:", x$sound, "\n")

# Child: Dog inherits from Animal
new_Dog <- function(name, breed) {
  obj <- new_Animal(name, "Woof")
  obj$breed <- breed
  class(obj) <- c("Dog", "Animal")  # Dog first, then Animal
  obj
}

# Dog-specific method
speak.Dog <- function(x, ...) {
  cat(x$name, "the", x$breed, "says: WOOF WOOF!\n")
}

fetch <- function(x, ...) UseMethod("fetch")
fetch.Dog <- function(x, ...) cat(x$name, "fetches the ball!\n")

rex <- new_Dog("Rex", "Labrador")
speak(rex)    # Uses speak.Dog
fetch(rex)    # Uses fetch.Dog

cat("\nClass hierarchy:", class(rex), "\n")
```

### NextMethod(): Calling the Parent

```r
new_Animal <- function(name, sound) {
  obj <- list(name = name, sound = sound)
  class(obj) <- "Animal"
  obj
}

describe <- function(x, ...) UseMethod("describe")
describe.Animal <- function(x, ...) {
  cat("Animal:", x$name, "\n")
}

new_Dog <- function(name, breed) {
  obj <- new_Animal(name, "Woof")
  obj$breed <- breed
  class(obj) <- c("Dog", "Animal")
  obj
}

describe.Dog <- function(x, ...) {
  cat("Dog breed:", x$breed, "\n")
  NextMethod()  # Calls describe.Animal
}

rex <- new_Dog("Rex", "Labrador")
describe(rex)
```

## Method Dispatch Explained

When you call `generic(x)`, R looks for methods in this order:

```r
# Check dispatch order for an object
new_Dog <- function(name, breed) {
  obj <- list(name = name, breed = breed, sound = "Woof")
  class(obj) <- c("Dog", "Animal")
  obj
}

rex <- new_Dog("Rex", "Lab")

# R searches for: speak.Dog -> speak.Animal -> speak.default
cat("Class vector:", class(rex), "\n")
cat("R tries: speak.Dog, speak.Animal, speak.default\n")
```

## Checking and Testing S3 Classes

```r
new_Person <- function(name, age) {
  obj <- list(name = name, age = age)
  class(obj) <- "Person"
  obj
}

alice <- new_Person("Alice", 30)

# Check class
cat("class:", class(alice), "\n")
cat("is Person?", inherits(alice, "Person"), "\n")
cat("is list?", is.list(alice), "\n")

# List available methods for a class
cat("\nMethods for 'Person':\n")
print(methods(class = "Person"))

# List methods for a generic
cat("\nAll print methods (first 10):\n")
print(head(methods("print"), 10))
```

## Practice Exercises

### Exercise 1: Matrix Class

Create a `Matrix2x2` S3 class with `print`, `det` (determinant), and `+` methods.

```r
# Create new_Matrix2x2(a, b, c, d) for matrix [[a,b],[c,d]]
# det.Matrix2x2 should compute ad - bc
# `+.Matrix2x2` should add element-wise

```

<details>
<summary>Click to reveal solution</summary>

```r
new_Matrix2x2 <- function(a, b, c, d) {
  obj <- list(a = a, b = b, c = c, d = d)
  class(obj) <- "Matrix2x2"
  obj
}

print.Matrix2x2 <- function(x, ...) {
  cat(sprintf("| %g  %g |\n| %g  %g |\n", x$a, x$b, x$c, x$d))
  invisible(x)
}

det <- function(x, ...) UseMethod("det")
det.Matrix2x2 <- function(x, ...) x$a * x$d - x$b * x$c

`+.Matrix2x2` <- function(e1, e2) {
  new_Matrix2x2(e1$a + e2$a, e1$b + e2$b, e1$c + e2$c, e1$d + e2$d)
}

m1 <- new_Matrix2x2(1, 2, 3, 4)
m2 <- new_Matrix2x2(5, 6, 7, 8)

cat("m1:\n"); print(m1)
cat("det(m1):", det(m1), "\n\n")
cat("m1 + m2:\n"); print(m1 + m2)
```

**Explanation:** S3 lets you override operators like `+` by defining `+.ClassName`. R dispatches based on the class of the first argument.

</details>

## Summary

| Pattern | Code |
|---------|------|
| Create class | `class(x) <- "Name"` |
| Constructor | `new_Name <- function(...) { ...; class(obj) <- "Name"; obj }` |
| Method | `generic.Name <- function(x, ...) { ... }` |
| Custom generic | `generic <- function(x, ...) UseMethod("generic")` |
| Inheritance | `class(obj) <- c("Child", "Parent")` |
| Call parent | `NextMethod()` |
| Check class | `inherits(x, "Name")` |

## FAQ

### Why don't S3 classes validate their fields?

S3 is deliberately informal — it trades safety for flexibility and speed. Put validation in your constructor function and trust that users create objects through it.

### Can I have private fields in S3?

No. S3 objects are just lists — anyone can read or modify any field. Use R6 if you need private fields.

### How do I know which methods exist for an S3 class?

Use `methods(class = "ClassName")` to list all methods, or `methods("generic")` to see all classes a generic dispatches to.

## Continue Learning

- [S3 Method Dispatch](/S3-Method-Dispatch-in-R.html) — deep dive into UseMethod and NextMethod
- [OOP in R](/OOP-in-R.html) — compare S3 with S4, R5, and R6
- [Operator Overloading](/Operator-Overloading-in-R.html) — define +, -, == for your classes
