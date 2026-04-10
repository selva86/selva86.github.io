---
title: "S4 Classes in R: setClass(), setGeneric() & Formal OOP"
slug: "S4-Classes-in-R"
description: "Master S4 classes in R with setClass(), slots, validity checking, new(), isVirtualClass, and inheritance with contains. Complete tutorial with examples."
keywords: "S4 classes R, setClass R, setGeneric R, S4 slots, S4 validity, formal OOP R, S4 inheritance"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.4"
post_type: "C"
auto_link_terms: "S4 classes|setClass|setGeneric|S4 OOP"
auto_link_case_sensitive: false
---

# S4 Classes in R: setClass(), setGeneric() & Formal OOP

<p class="lead">S4 is R's <strong>formal</strong> OOP system. Unlike S3's "just slap a class attribute on it" approach, S4 enforces class definitions with typed <strong>slots</strong>, built-in <strong>validity checking</strong>, and formal <strong>inheritance</strong>. It's the foundation of Bioconductor and many complex R packages.</p>

S4 trades simplicity for safety. You declare your class structure up front, and R enforces it. If someone tries to put a character into a numeric slot, R throws an error. This makes S4 ideal for large, collaborative projects where you need guarantees about object structure.

## Defining Classes with setClass()

Use `setClass()` to define a class. Slots are named, typed fields.

```r
# Define an S4 class with typed slots
setClass("Person",
  slots = list(
    name = "character",
    age  = "numeric",
    email = "character"
  )
)

# Create an instance with new()
alice <- new("Person", name = "Alice", age = 30, email = "alice@example.com")

# Access slots with @
cat("Name:", alice@name, "\n")
cat("Age:", alice@age, "\n")

# Or use slot()
cat("Email:", slot(alice, "email"), "\n")

# Check the class
cat("Is S4?", isS4(alice), "\n")
cat("Class:", class(alice), "\n")
```

### Slot types are enforced

```r
setClass("Point",
  slots = list(
    x = "numeric",
    y = "numeric"
  )
)

# This works
p1 <- new("Point", x = 3.0, y = 4.0)
cat("Point:", p1@x, p1@y, "\n")

# This would error: wrong type
# new("Point", x = "three", y = 4.0)  # Error!

# You can use "ANY" for untyped slots
setClass("Flexible",
  slots = list(
    data = "ANY",
    label = "character"
  )
)

f1 <- new("Flexible", data = 1:10, label = "numbers")
f2 <- new("Flexible", data = "hello", label = "text")
cat("f1 data:", f1@data[1:3], "\n")
cat("f2 data:", f2@data, "\n")
```

## Default Values with prototype()

Use `prototype` to set default slot values. If a slot isn't provided in `new()`, it gets the prototype value.

```r
setClass("Config",
  slots = list(
    verbose = "logical",
    max_iter = "numeric",
    tolerance = "numeric"
  ),
  prototype = list(
    verbose = FALSE,
    max_iter = 100,
    tolerance = 1e-6
  )
)

# Create with defaults
cfg <- new("Config")
cat("Verbose:", cfg@verbose, "\n")
cat("Max iterations:", cfg@max_iter, "\n")
cat("Tolerance:", cfg@tolerance, "\n")

# Override specific defaults
cfg2 <- new("Config", verbose = TRUE, max_iter = 500)
cat("\nCustom config:\n")
cat("Verbose:", cfg2@verbose, "\n")
cat("Max iterations:", cfg2@max_iter, "\n")
```

## Validity Checking

The `validity` argument lets you define rules that every instance must satisfy. The function should return `TRUE` if valid, or a character string describing the problem.

```r
setClass("Probability",
  slots = list(
    value = "numeric",
    label = "character"
  ),
  validity = function(object) {
    errors <- character()
    if (length(object@value) != 1) {
      errors <- c(errors, "value must be length 1")
    }
    if (object@value < 0 || object@value > 1) {
      errors <- c(errors, "value must be between 0 and 1")
    }
    if (length(errors) == 0) TRUE else errors
  }
)

# Valid object
p <- new("Probability", value = 0.75, label = "rain")
cat("Probability of", p@label, ":", p@value, "\n")

# Invalid object -- will produce an error
tryCatch(
  new("Probability", value = 1.5, label = "impossible"),
  error = function(e) cat("Error:", e$message, "\n")
)

# Manually validate an existing object
cat("Is valid:", validObject(p), "\n")
```

## Inheritance with contains

S4 supports single and multiple inheritance via `contains`.

```r
# Base class
setClass("Shape",
  slots = list(
    color = "character"
  ),
  prototype = list(color = "black")
)

# Child class inherits Shape's slots
setClass("Rectangle",
  contains = "Shape",
  slots = list(
    width = "numeric",
    height = "numeric"
  )
)

# Grandchild
setClass("Square",
  contains = "Rectangle",
  validity = function(object) {
    if (object@width != object@height) {
      "width and height must be equal for a Square"
    } else {
      TRUE
    }
  }
)

# Create objects
rect <- new("Rectangle", color = "blue", width = 5, height = 3)
sq <- new("Square", color = "red", width = 4, height = 4)

cat("Rectangle color:", rect@color, "\n")
cat("Rectangle dims:", rect@width, "x", rect@height, "\n")

# Check inheritance
cat("Is rect a Shape?", is(rect, "Shape"), "\n")
cat("Is sq a Rectangle?", is(sq, "Rectangle"), "\n")
cat("Is sq a Shape?", is(sq, "Shape"), "\n")

# Show the class hierarchy
cat("\nSquare superclasses:", paste(is(sq), collapse = ", "), "\n")
```

## Virtual Classes

A virtual class cannot be instantiated directly. It serves as an abstract base class or interface.

```r
# Define a virtual class (abstract base)
setClass("Serializable", contains = "VIRTUAL")

setClass("JsonData",
  contains = "Serializable",
  slots = list(
    content = "list"
  )
)

# You cannot create a Serializable directly
tryCatch(
  new("Serializable"),
  error = function(e) cat("Cannot instantiate virtual class:", e$message, "\n")
)

# But you can create subclasses
jd <- new("JsonData", content = list(a = 1, b = "hello"))
cat("Is Serializable?", is(jd, "Serializable"), "\n")
cat("Content:", paste(names(jd@content), collapse = ", "), "\n")

# isVirtualClass check
cat("Serializable is virtual:", isVirtualClass("Serializable"), "\n")
cat("JsonData is virtual:", isVirtualClass("JsonData"), "\n")
```

## Constructor Functions (Best Practice)

While `new()` works, best practice is to provide a user-friendly constructor function that validates inputs and sets sensible defaults.

```r
setClass("Matrix2D",
  slots = list(
    data = "matrix",
    row_names = "character",
    col_names = "character"
  ),
  validity = function(object) {
    if (nrow(object@data) != length(object@row_names)) {
      return("row_names length must match number of rows")
    }
    if (ncol(object@data) != length(object@col_names)) {
      return("col_names length must match number of columns")
    }
    TRUE
  }
)

# User-friendly constructor
Matrix2D <- function(data, row_names = NULL, col_names = NULL) {
  if (!is.matrix(data)) data <- as.matrix(data)
  if (is.null(row_names)) row_names <- paste0("R", 1:nrow(data))
  if (is.null(col_names)) col_names <- paste0("C", 1:ncol(data))
  new("Matrix2D", data = data, row_names = row_names, col_names = col_names)
}

# Easy to use
m <- Matrix2D(matrix(1:6, nrow = 2))
cat("Dimensions:", nrow(m@data), "x", ncol(m@data), "\n")
cat("Row names:", m@row_names, "\n")
cat("Col names:", m@col_names, "\n")
```

## Summary Table

| Feature | Syntax | Purpose |
|---------|--------|---------|
| Define class | `setClass("Name", slots=...)` | Declare class structure |
| Create instance | `new("Name", ...)` | Instantiate an object |
| Access slot | `object@slot` or `slot(object, "name")` | Read slot value |
| Default values | `prototype = list(...)` | Set defaults for slots |
| Validation | `validity = function(object) ...` | Enforce constraints |
| Inheritance | `contains = "Parent"` | Inherit slots and methods |
| Virtual class | `contains = "VIRTUAL"` | Abstract base class |
| Check class | `is(obj, "Class")` | Test inheritance |
| Check S4 | `isS4(obj)` | Is this an S4 object? |

## Practice Exercises

**Exercise 1:** Create an S4 class `BankAccount` with slots `owner` (character), `balance` (numeric), and `currency` (character, default "USD"). Add validity to ensure balance is non-negative.

<details><summary>Click to reveal solution</summary>

```r
setClass("BankAccount",
  slots = list(
    owner = "character",
    balance = "numeric",
    currency = "character"
  ),
  prototype = list(
    currency = "USD",
    balance = 0
  ),
  validity = function(object) {
    if (object@balance < 0) "balance cannot be negative"
    else TRUE
  }
)

acct <- new("BankAccount", owner = "Alice", balance = 1000)
cat(acct@owner, "has", acct@balance, acct@currency, "\n")

tryCatch(
  new("BankAccount", owner = "Bob", balance = -50),
  error = function(e) cat("Validation caught:", e$message, "\n")
)
```

</details>

**Exercise 2:** Create a class hierarchy: `Animal` (virtual) > `Mammal` > `Dog`. `Animal` has slot `name`, `Mammal` adds `legs`, `Dog` adds `breed`. Create a Dog and verify it `is` an Animal.

<details><summary>Click to reveal solution</summary>

```r
setClass("Animal", contains = "VIRTUAL",
  slots = list(name = "character"))

setClass("Mammal", contains = "Animal",
  slots = list(legs = "numeric"),
  prototype = list(legs = 4))

setClass("Dog", contains = "Mammal",
  slots = list(breed = "character"))

rex <- new("Dog", name = "Rex", breed = "Labrador")
cat("Name:", rex@name, "\n")
cat("Legs:", rex@legs, "\n")
cat("Breed:", rex@breed, "\n")
cat("Is Animal?", is(rex, "Animal"), "\n")
cat("Is Mammal?", is(rex, "Mammal"), "\n")
```

</details>

## FAQ

**Q: When should I use S4 instead of S3?**
Use S4 when you need enforced structure (typed slots), validity checking, multiple dispatch, or formal inheritance hierarchies. S4 is standard in Bioconductor and academic packages. For simpler use cases, S3 is fine.

**Q: Can I have multiple inheritance in S4?**
Yes. Pass a character vector to `contains`: `setClass("C", contains = c("A", "B"))`. The child inherits slots from both parents. Conflicts are resolved by order.

**Q: What is the difference between @ and $?**
`@` accesses S4 slots. `$` accesses list elements (S3) or R5/R6 fields. Using `$` on an S4 object won't work for slots (unless a `$` method is defined). Always use `@` for S4.

## Continue Learning
- [S4 Methods & Multiple Dispatch](S4-Methods-in-R.html) -- Learn `setMethod()`, method signatures, and multiple dispatch
- [R6 Classes in R](R6-Classes-in-R.html) -- Modern reference semantics with mutable state
- [OOP in R Overview](OOP-in-R.html) -- Compare all four OOP systems side by side
