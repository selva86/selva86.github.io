---
title: "S4 Classes in R: Formal Object-Oriented Programming With Type Checking"
slug: "S4-Classes-in-R"
description: "S4 is R's formal OOP system — typed slots, setClass(), setGeneric(), and setMethod(). Learn when to choose it over S3 and how to build a working S4 class in under 30 lines."
keywords: "S4 classes in R, R setClass, R setGeneric, S4 method, R formal OOP"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.4"
post_type: "C"
auto_link_terms: "S4 classes|S4 class|setClass|setGeneric|setMethod"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "S4 Classes in R"
sidebar_order: 44
---

# S4 Classes in R: Formal Object-Oriented Programming With Type Checking

<p class="lead">S4 is R's <strong>formal</strong> OOP system — every class has a declared structure (<code>setClass</code>), every method is explicitly registered (<code>setMethod</code>), and slot access is type-checked at runtime. It is slower to write than S3 but catches bugs S3 cannot.</p>

If S3 is the Python of R's class systems — duck-typed, forgiving, informal — then S4 is the Java. You declare classes up front, you name the slots and their types, and R enforces the contract. Bioconductor built its 2000+ packages on S4 for exactly this reason: when you are wrapping a genomics database with 40 fields, "informal" is not good enough. This tutorial shows the workflow from class definition to working methods.

## How Do You Define an S4 Class?

Use `setClass()` to declare the class name and its **slots** (named, typed fields). Once declared, `new()` creates instances.

```r
setClass("Employee",
  representation(
    name   = "character",
    salary = "numeric",
    hired  = "Date"
  )
)

alice <- new("Employee",
  name   = "Alice",
  salary = 75000,
  hired  = as.Date("2020-06-15")
)

alice@name
#> [1] "Alice"

alice@salary
#> [1] 75000
```

Three things to notice. First, the `representation()` block declares each slot with its R type — `"character"`, `"numeric"`, `"Date"`, etc. Second, you access slots with `@`, not `$`. Third, R type-checks the slot values on construction: if you pass `salary = "seventy-five thousand"`, `new()` throws an error. That is the whole point of S4 — invalid objects cannot exist.

[KEY INSIGHT]
**S4 enforces a contract; S3 trusts you.** With S4, once an object exists, its slots are guaranteed to have the declared types. With S3, a field can be anything at any time. For large systems and collaborative codebases, the S4 guarantee is worth the ceremony.

## How Do You Add Validation?

Beyond type checking, S4 lets you define a **validity function** that runs on construction and rejects invalid states. Return `TRUE` if the object is valid, or an error string if not.

```r
setClass("Employee",
  representation(
    name   = "character",
    salary = "numeric",
    hired  = "Date"
  ),
  validity = function(object) {
    if (length(object@name) != 1)    return("name must be length 1")
    if (object@salary < 0)           return("salary cannot be negative")
    if (object@hired > Sys.Date())   return("hired date cannot be in the future")
    TRUE
  }
)

# This fails validity, not just type-check
tryCatch(
  new("Employee", name = "Bob", salary = -100, hired = as.Date("2020-01-01")),
  error = function(e) message("Rejected: ", e$message)
)
#> Rejected: invalid class "Employee" object: salary cannot be negative
```

Validity functions are where S4 shines compared to S3. You state the business rules once, and R enforces them every time an object is constructed or modified. A subclass inherits its parent's validity function automatically.

## How Do You Define Methods?

S4 uses `setGeneric()` to declare a generic and `setMethod()` to register a method for a specific class. The generic is conceptually the same as an S3 generic — a function that delegates based on argument type — but the registration is explicit.

```r
# Declare the generic
setGeneric("raise", function(object, pct) standardGeneric("raise"))
#> [1] "raise"

# Register a method for Employee
setMethod("raise", "Employee", function(object, pct) {
  object@salary <- object@salary * (1 + pct)
  object
})

alice <- new("Employee", name = "Alice", salary = 75000,
             hired = as.Date("2020-06-15"))

alice2 <- raise(alice, 0.10)
alice2@salary
#> [1] 82500
```

`setGeneric()` creates the `raise` generic (and prints a confirmation). `setMethod()` says "when `raise` is called on an `Employee`, run this function". Note that S4 objects are **immutable** — `raise(alice, 0.10)` returns a new `Employee` with the updated salary, leaving `alice` unchanged. To persist the change, reassign: `alice <- raise(alice, 0.10)`.

**Try it:** Define an S4 class `Rectangle` with numeric slots `width` and `height`, then write a generic `area()` that returns `width * height`.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Rectangle", representation(width = "numeric", height = "numeric"))

setGeneric("area", function(shape) standardGeneric("area"))

setMethod("area", "Rectangle", function(shape) shape@width * shape@height)

r <- new("Rectangle", width = 3, height = 4)
area(r)
#> [1] 12
```

**Explanation:** `setClass` declares the slots with types, `setGeneric` creates the generic, `setMethod` registers the area formula for the `Rectangle` class.

</details>

## How Does S4 Inheritance Work?

Inherit from a parent class using `contains =` in `setClass`. The subclass automatically gains the parent's slots, validity function, and methods — you can override methods by registering a more specific one.

```r
setClass("Manager",
  contains = "Employee",
  representation(reports = "character")
)

bob <- new("Manager",
  name = "Bob", salary = 110000, hired = as.Date("2018-03-01"),
  reports = c("Alice", "Cara")
)

bob@name
#> [1] "Bob"

bob@reports
#> [1] "Alice" "Cara"

# The raise method defined for Employee still works
raise(bob, 0.05)@salary
#> [1] 115500
```

`Manager` inherits from `Employee`, so it has all of Employee's slots plus its own `reports` slot. The `raise` method — registered on `Employee` — is automatically picked up by `Manager` through inheritance. If you needed a manager-specific raise rule, you would `setMethod("raise", "Manager", ...)` and it would take precedence.

## How Does S4 Multiple Dispatch Work?

S4's killer feature is **multiple dispatch** — a method can be chosen based on the classes of *several* arguments, not just the first. Define the method with a `signature` spanning multiple types.

```r
setGeneric("combine", function(a, b) standardGeneric("combine"))

setMethod("combine", signature("numeric", "numeric"),
  function(a, b) a + b)

setMethod("combine", signature("character", "character"),
  function(a, b) paste0(a, b))

combine(2, 3)
#> [1] 5

combine("foo", "bar")
#> [1] "foobar"
```

Two `combine` methods live under the same generic — one for `(numeric, numeric)`, another for `(character, character)`. S3 cannot do this cleanly. For the deeper dive with more examples, see the dedicated post on [S4 Methods and Multiple Dispatch](S4-Methods-in-R.html).

[TIP]
**If multiple dispatch solves your problem, use S4.** The number-one reason to prefer S4 over S3 is when you need method behaviour that depends on more than one argument's class. If that never comes up in your code, S3 is probably enough.

## Practice Exercises

### Exercise 1: Bank Account With Validity

Define an S4 class `Account` with slots `balance` (numeric) and `owner` (character). Add a validity function that rejects negative balances. Try to construct an invalid account.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Account",
  representation(balance = "numeric", owner = "character"),
  validity = function(object) {
    if (object@balance < 0) return("balance cannot be negative")
    TRUE
  }
)

acc <- new("Account", balance = 100, owner = "Ada")
acc@balance
#> [1] 100

tryCatch(
  new("Account", balance = -50, owner = "Ada"),
  error = function(e) message("Rejected: ", e$message)
)
#> Rejected: invalid class "Account" object: balance cannot be negative
```

**Explanation:** The validity function runs at construction; returning a non-TRUE string aborts the creation with that message.

</details>

### Exercise 2: Generic `describe`

Write a generic `describe()` and register methods for `Rectangle` (from the earlier exercise) and `Account`. Each should print a one-line summary.

```r
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Rectangle", representation(width = "numeric", height = "numeric"))
setClass("Account",   representation(balance = "numeric", owner = "character"))

setGeneric("describe", function(x) standardGeneric("describe"))

setMethod("describe", "Rectangle", function(x) {
  cat("Rectangle:", x@width, "x", x@height, "\n")
})

setMethod("describe", "Account", function(x) {
  cat("Account of", x@owner, "—", x@balance, "\n")
})

describe(new("Rectangle", width = 3, height = 4))
#> Rectangle: 3 x 4
describe(new("Account", balance = 500, owner = "Bo"))
#> Account of Bo — 500
```

**Explanation:** One generic, two registered methods. S4 dispatches on the class of `x` exactly like S3, just with explicit registration.

</details>

## Summary

| Step                  | Function                                  |
|-----------------------|-------------------------------------------|
| Declare class         | `setClass("X", representation(...))`      |
| Add validation        | `validity = function(object) ...`         |
| Create instance       | `new("X", slot1 = ..., slot2 = ...)`      |
| Access slot           | `obj@slot1`                               |
| Declare generic       | `setGeneric("f", function(x) standardGeneric("f"))` |
| Register method       | `setMethod("f", "X", function(x) ...)`    |
| Inherit               | `setClass("Y", contains = "X", ...)`      |
| Multiple dispatch     | `signature("A", "B")`                     |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 15: S4. [Link](https://adv-r.hadley.nz/s4.html)
2. Chambers, J. M. — *Software for Data Analysis*, S4 chapter.
3. Bioconductor — S4 class guidelines. [Link](https://bioconductor.org/developers/how-to/commonMethodsAndClasses/)
4. R Core Team — `methods` package documentation.
5. Gentleman, R. et al. — *Bioconductor: open software development for computational biology and bioinformatics*. Genome Biology 5 (2004).

## Continue Learning

- [OOP in R](OOP-in-R.html) — where S4 fits in R's four OOP systems.
- [S4 Multiple Dispatch in R](S4-Methods-in-R.html) — dispatch on two arguments simultaneously.
- [S3 Classes in R](S3-Classes-in-R.html) — the informal sibling for when S4 feels like overkill.
