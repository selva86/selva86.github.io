---
title: "R6 Classes in R: When You Need Objects That Mutate in Place"
slug: "R6-Classes-in-R"
description: "R6 is R's modern OOP system for mutable, encapsulated objects — the one you want for stateful classes that behave like Python or Java objects. Here is the full workflow."
keywords: "R6 classes in R, R mutable objects, R6 package, R reference semantics, R OOP encapsulated"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.6"
post_type: "C"
auto_link_terms: "R6 classes|R6 class|R6Class|R6 mutable"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R6 Classes in R"
sidebar_order: 46
---

# R6 Classes in R: When You Need Objects That Mutate in Place

<p class="lead">R6 is R's modern system for <strong>mutable, encapsulated</strong> objects. Unlike S3 and S4 (where every change returns a new copy), an R6 object can update its own state in place — so <code>counter$increment()</code> actually modifies <code>counter</code>. It is the OOP system you reach for when you need a Python-style object.</p>

Most R code is purely functional: functions take values in, return new values out, and never mutate anything. That model is beautiful until you need a Shiny module tracking its own state, a database connection that knows if it is open, or a stream parser with a growing buffer. For those, R6 is the right tool. This tutorial walks you from the empty class to a working counter, then shows private fields, active bindings, and inheritance.

## How Do You Create an R6 Class?

Load the `R6` package and call `R6Class()` with a name and a list of `public` fields and methods. Fields are plain data; methods are functions that can reference `self$` to access or update them.

```r
library(R6)

Counter <- R6Class("Counter",
  public = list(
    count = 0,
    increment = function() {
      self$count <- self$count + 1
      invisible(self)
    },
    get = function() self$count
  )
)

c1 <- Counter$new()
c1$increment()
c1$increment()
c1$increment()
c1$get()
#> [1] 3
```

Three things to notice. First, the class is defined in one call — no `setClass` + `setMethod` split like S4. Second, calling `c1$increment()` **mutated** `c1` — after three calls, `c1$count` is 3, not still 0. That is the key difference from S3/S4. Third, methods return `invisible(self)` so you can chain them: `c1$increment()$increment()$increment()` works.

[KEY INSIGHT]
**R6 objects have reference semantics.** `c2 <- c1` does *not* make a copy — both names point to the same underlying object, so `c2$increment()` will also affect `c1$count`. This is the opposite of S3/S4 (copy on modify) and matches Python/Java behaviour. If you need a real copy, use `c1$clone()`.

## Why Does R6 Matter? The Copy Problem in S3/S4

Watch what happens when you try to build a counter as an S3 class:

```r
new_counter_s3 <- function() structure(list(count = 0), class = "counter_s3")

increment_s3 <- function(x) {
  x$count <- x$count + 1
  x                          # must return the new version
}

c1 <- new_counter_s3()
increment_s3(c1)             # this builds a modified copy — but c1 is unchanged
c1$count
#> [1] 0
```

Calling `increment_s3(c1)` returned a modified copy but left `c1` alone. To make the change stick, you would have to reassign: `c1 <- increment_s3(c1)`. For a single counter that is annoying; for a database connection shared across 20 functions it is untenable. R6 fixes this by giving the object genuine identity — one mutation updates *the* object, everywhere it is referenced.

## How Do You Add Private Fields?

R6 supports **private** fields and methods — data and helpers that are hidden from the outside but accessible inside the class. Reference them with `private$` instead of `self$`.

```r
library(R6)

SecureCounter <- R6Class("SecureCounter",
  public = list(
    initialize = function() {
      private$count <- 0
    },
    increment = function() {
      private$count <- private$count + 1
      invisible(self)
    },
    get = function() private$count
  ),
  private = list(
    count = NULL
  )
)

sc <- SecureCounter$new()
sc$increment()
sc$increment()
sc$get()
#> [1] 2

sc$count
#> NULL
```

`sc$count` returns `NULL` — outside code cannot reach the private `count` field directly. The only way to read it is through the public `get()` method; the only way to change it is through `increment()`. This is proper **encapsulation**: the class controls every access to its state.

## How Do You Use `initialize` for Constructor Logic?

The special method named `initialize` runs when you call `ClassName$new(args)`. Use it to validate inputs and set up initial state.

```r
library(R6)

BankAccount <- R6Class("BankAccount",
  public = list(
    initialize = function(owner, opening_balance = 0) {
      stopifnot(is.character(owner), length(owner) == 1)
      stopifnot(is.numeric(opening_balance), opening_balance >= 0)
      private$owner   <- owner
      private$balance <- opening_balance
    },
    deposit = function(amount) {
      stopifnot(amount > 0)
      private$balance <- private$balance + amount
      invisible(self)
    },
    withdraw = function(amount) {
      stopifnot(amount > 0, amount <= private$balance)
      private$balance <- private$balance - amount
      invisible(self)
    },
    balance = function() private$balance
  ),
  private = list(
    owner   = NULL,
    balance = NULL
  )
)

acc <- BankAccount$new("Ada", 100)
acc$deposit(50)
acc$withdraw(30)
acc$balance()
#> [1] 120
```

The class has three public methods (`deposit`, `withdraw`, `balance`) and two private fields. Every state change goes through a public method that enforces the business rules — you cannot withdraw more than you have, and the balance can never go below zero. Because state is private, there is literally no way to violate the rules from outside.

**Try it:** Write an `R6Class` called `Stack` with `push(x)`, `pop()`, and `size()` methods backed by a private `items` list.

```r
library(R6)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(R6)

Stack <- R6Class("Stack",
  public = list(
    initialize = function() {
      private$items <- list()
    },
    push = function(x) {
      private$items <- c(private$items, list(x))
      invisible(self)
    },
    pop = function() {
      n <- length(private$items)
      if (n == 0) return(NULL)
      top <- private$items[[n]]
      private$items <- private$items[-n]
      top
    },
    size = function() length(private$items)
  ),
  private = list(items = NULL)
)

s <- Stack$new()
s$push(1)$push(2)$push(3)
s$size()
#> [1] 3
s$pop()
#> [1] 3
s$size()
#> [1] 2
```

**Explanation:** `push` appends to the private list; `pop` removes and returns the last element. Method chaining works because each mutator returns `invisible(self)`.

</details>

## How Does R6 Handle Inheritance?

Pass `inherit =` to `R6Class()` to extend an existing class. The subclass gets everything from the parent and can add new methods or override existing ones. Call `super$method()` to invoke the parent's version from inside the override.

```r
library(R6)

SavingsAccount <- R6Class("SavingsAccount",
  inherit = BankAccount,
  public = list(
    initialize = function(owner, opening_balance = 0, rate = 0.03) {
      super$initialize(owner, opening_balance)
      private$rate <- rate
    },
    accrue = function(years = 1) {
      private$balance <- private$balance * (1 + private$rate)^years
      invisible(self)
    }
  ),
  private = list(rate = NULL)
)

sav <- SavingsAccount$new("Bo", 1000, rate = 0.05)
sav$deposit(500)      # inherited from BankAccount
sav$accrue(2)         # new SavingsAccount method
round(sav$balance(), 2)
#> [1] 1653.75
```

`super$initialize(...)` called the parent `BankAccount$initialize` to set up `owner` and `balance`, then the subclass added its own `rate`. The `deposit` method was inherited as-is; `accrue` is new. This is classic single inheritance — familiar from Python, Java, C++.

[TIP]
**Use `$clone()` when you want a true copy.** Because R6 objects have reference semantics, `b <- a` does not copy the state. If you need an independent copy, call `b <- a$clone()`. For deep copies of nested R6 objects, pass `deep = TRUE`.

## Practice Exercises

### Exercise 1: Running Average Tracker

Write an R6 class `RunningMean` with `add(x)` to include a new value and `mean()` to return the current running average. Use private fields for `n` and `total`.

```r
library(R6)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(R6)

RunningMean <- R6Class("RunningMean",
  public = list(
    initialize = function() {
      private$n <- 0
      private$total <- 0
    },
    add = function(x) {
      private$n     <- private$n + 1
      private$total <- private$total + x
      invisible(self)
    },
    mean = function() {
      if (private$n == 0) return(NaN)
      private$total / private$n
    }
  ),
  private = list(n = NULL, total = NULL)
)

rm <- RunningMean$new()
rm$add(10)$add(20)$add(30)
rm$mean()
#> [1] 20
```

**Explanation:** The class tracks a running sum and count privately; `mean()` returns the ratio. Chaining works because `add` returns `invisible(self)`.

</details>

### Exercise 2: Logger With Inheritance

Build a base `Logger` R6 class with a `log(msg)` method that prints `"[INFO] msg"`. Subclass it as `TimestampLogger` that overrides `log(msg)` to prepend the current time.

```r
library(R6)
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
library(R6)

Logger <- R6Class("Logger",
  public = list(
    log = function(msg) {
      cat("[INFO]", msg, "\n")
    }
  )
)

TimestampLogger <- R6Class("TimestampLogger",
  inherit = Logger,
  public = list(
    log = function(msg) {
      cat("[", format(Sys.time(), "%H:%M:%S"), "] ", sep = "")
      super$log(msg)
    }
  )
)

tl <- TimestampLogger$new()
tl$log("server started")
#> [12:34:56] [INFO] server started
```

**Explanation:** `super$log(msg)` invokes the parent's `log` method after the subclass prints the timestamp prefix. Classic method override with superclass delegation.

</details>

## Summary

| Feature           | How it works                                         |
|-------------------|------------------------------------------------------|
| Class definition  | `R6Class("Name", public = list(...), private = list(...))` |
| Create instance   | `obj <- ClassName$new(args)`                         |
| Access field      | `obj$field` (public only)                            |
| Call method       | `obj$method(args)`                                   |
| Inside class      | `self$x` (public), `private$x` (private)             |
| Mutate            | Direct assignment — changes persist                  |
| Inherit           | `inherit = ParentClass`                              |
| Call parent       | `super$method(...)`                                  |
| Copy              | `obj$clone()` (shallow), `obj$clone(deep=TRUE)`      |

## References

1. `R6` package documentation. [Link](https://r6.r-lib.org/)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 14: R6. [Link](https://adv-r.hadley.nz/r6.html)
3. Chang, W. — *R6: Encapsulated Object-Oriented Programming for R*. [Link](https://cran.r-project.org/package=R6)
4. RStudio — Shiny modules (a major consumer of R6). [Link](https://shiny.posit.co/r/articles/modules.html)
5. `plumber` package — R6-based API routing.

## Continue Learning

- [OOP in R](OOP-in-R.html) — where R6 fits among the four OOP systems.
- [S4 Classes in R](S4-Classes-in-R.html) — the formal alternative for immutable typed objects.
- [R Function Factories](R-Function-Factories.html) — the functional alternative for closures that capture state.
