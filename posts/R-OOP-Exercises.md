---
title: "OOP in R Exercises: 8 S3, S4 & R6 Practice Problems — Solved Step-by-Step)"
slug: "R-OOP-Exercises"
description: "Practice R object-oriented programming with 8 hands-on exercises covering S3 classes, S4 formal validation, R6 mutable objects, and operator overloading."
keywords: "R OOP exercises, S3 class exercises R, S4 exercises R, R6 exercises, R object-oriented programming exercises, R OOP practice problems, R UseMethod exercises, R class method dispatch exercises"
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "E11.2"
post_type: "EX"
sidebar_title: "OOP in R (8 problems)"
auto_link_terms: "R OOP exercises|OOP in R exercises|S3 S4 R6 practice|R object-oriented programming exercises|R class practice problems"
auto_link_case_sensitive: false
fr_parent: "OOP-in-R.html"
difficulty: "Intermediate"
---

# OOP in R Exercises: 8 S3, S4 & R6 Practice Problems — Solved Step-by-Step)

<p class="lead">These 8 practice problems build real fluency in R's three major OOP systems — <strong>S3</strong> (informal), <strong>S4</strong> (formal, validated), and <strong>R6</strong> (mutable reference) — plus operator overloading and method dispatch. Every exercise ships with starter code and a worked solution you can run in the browser.</p>

Work through them in order. Each one uses a real pattern you'd ship in production code, and the exercises get progressively harder — simple S3 first, then S4 validation, then R6 mutation, then a synthesis problem that asks *which* system fits a given scenario. If you're fuzzy on any system, the parent tutorial [OOP in R](OOP-in-R.html) is your fallback.

## How Should You Use These Exercises?

Every code block on this page shares one R session, so variables and class definitions you create in one exercise are still available in the next. The warm-up below confirms that `R6` and the `methods` package (which powers S4) are both loaded, and creates one tiny demo object in each system so you can see them side by side.

```r
library(R6)
library(methods)

# One trivial object from each OOP system
s3_obj <- structure(list(value = 10), class = "demo")

setClass("DemoS4", representation(value = "numeric"))
s4_obj <- new("DemoS4", value = 10)

DemoR6 <- R6Class("DemoR6", public = list(value = 10))
r6_obj <- DemoR6$new()

c(S3 = class(s3_obj), S4 = class(s4_obj), R6 = class(r6_obj)[1])
#>       S3       S4       R6
#>   "demo" "DemoS4" "DemoR6"
```

All three systems work. Each exercise below gives you a **starter block** with a scaffold and expected output, followed by a collapsible **worked solution** with a short explanation. Type your own answer before opening the reveal — that's where the learning happens.

[NOTE]
**These exercises assume you already know what `class()`, `UseMethod()`, and `setClass()` do.** If those feel unfamiliar, read [OOP in R](OOP-in-R.html) first and come back.

## Exercise 1: Can You Build an S3 Temperature Class?

S3 is the lightest OOP system in R. A class is just a character vector attached to an object via `class()`, and a method is a function named `<generic>.<class>`. Build an S3 class `Temperature` that stores a numeric value plus a unit ("C" or "F"), prints itself nicely, and exposes a `to_celsius()` generic that converts Fahrenheit to Celsius.

```r
# Write a constructor and a print method for an S3 Temperature class.
# Then define a to_celsius() generic + Temperature method.

temperature <- function(value, unit) {
  # your code here — return an object with class "Temperature"
}

# Test:
temp_f <- temperature(212, "F")
print(temp_f)
#> Expected: 212 F
to_celsius(temp_f)
#> Expected: 100 C
```

<details>
<summary>Click to reveal solution</summary>

```r
temperature <- function(value, unit) {
  stopifnot(unit %in% c("C", "F"))
  structure(list(value = value, unit = unit), class = "Temperature")
}

print.Temperature <- function(x, ...) {
  cat(x$value, x$unit, "\n")
  invisible(x)
}

to_celsius <- function(x) UseMethod("to_celsius")
to_celsius.Temperature <- function(x) {
  if (x$unit == "C") return(x)
  temperature((x$value - 32) * 5 / 9, "C")
}

temp_f <- temperature(212, "F")
print(temp_f)
#> 212 F
to_celsius(temp_f)
#> 100 C
```

**Explanation:** The constructor wraps the inputs in a list and tags it with `class = "Temperature"`. `structure()` is the idiomatic one-liner for this. `print.Temperature` is picked up automatically when you call `print(temp_f)` because R sees class `Temperature` and looks for `print.Temperature`. The generic `to_celsius()` calls `UseMethod()`, which is S3's dispatch mechanism — it finds `to_celsius.Temperature` by matching the class of the first argument.

</details>

[TIP]
**Name S3 methods as `<generic>.<class>`, never the other way around.** Writing `Temperature.print` would just create a function with a dot in its name — it would not be dispatched to when you call `print(temp_f)`.

## Exercise 2: Can You Write a Generic That Dispatches to Three Methods?

S3 dispatch is pure string matching. When you call a generic, R looks up the class of the first argument and searches for `<generic>.<class>`. If it doesn't find a match it falls back to `<generic>.default`. Write a `describe_ex2()` generic with methods for `numeric`, `character`, and `factor`, plus a default that says "unknown type".

```r
# Write a describe_ex2() generic and three methods.
# numeric → "numeric of length N, mean = M"
# character → "character of length N"
# factor → "factor with K levels"
# default → "unknown type"

describe_ex2 <- function(x) UseMethod("describe_ex2")

# your methods here

describe_ex2(1:10)
#> Expected: "numeric of length 10, mean = 5.5"
describe_ex2(letters)
#> Expected: "character of length 26"
describe_ex2(factor(c("a", "b", "a")))
#> Expected: "factor with 2 levels"
describe_ex2(TRUE)
#> Expected: "unknown type"
```

<details>
<summary>Click to reveal solution</summary>

```r
describe_ex2 <- function(x) UseMethod("describe_ex2")

describe_ex2.numeric <- function(x) {
  sprintf("numeric of length %d, mean = %s", length(x), mean(x))
}
describe_ex2.character <- function(x) {
  sprintf("character of length %d", length(x))
}
describe_ex2.factor <- function(x) {
  sprintf("factor with %d levels", nlevels(x))
}
describe_ex2.default <- function(x) "unknown type"

describe_ex2(1:10)
#> [1] "numeric of length 10, mean = 5.5"
describe_ex2(letters)
#> [1] "character of length 26"
describe_ex2(factor(c("a", "b", "a")))
#> [1] "factor with 2 levels"
describe_ex2(TRUE)
#> [1] "unknown type"
```

**Explanation:** Each method takes the same argument name as the generic (`x`) and returns a string. `UseMethod("describe_ex2")` inspects `class(x)` and searches for `describe_ex2.<class>`. For `1:10`, R sees class `"integer"` and then `"numeric"` — if it finds a method for either, it dispatches there. The default handler catches anything R doesn't have a specific method for, which is how `TRUE` (class `"logical"`) ends up at `describe_ex2.default`.

</details>

[KEY INSIGHT]
**S3 dispatch is just string matching.** There's no registry, no compile step, no validation. R sees the class name, pastes together `<generic>.<class>`, and calls whatever function exists at that name. That simplicity is why S3 powers 90% of base R and the tidyverse.

## Exercise 3: Can You Create an S4 Account Class With Validation?

S4 is the stricter, more formal sibling of S3. You declare slots with types up front using `setClass()`, optionally attach a validity function, and dispatch with `setGeneric()` + `setMethod()`. Build an `Account` class with a numeric `balance` slot and a character `owner` slot. Add a validity rule that the balance cannot be negative, and a `deposit()` generic that adds to the balance.

```r
# Define an S4 Account class with validation, and a deposit() generic.
# Slots: balance (numeric), owner (character)
# Validity: balance must be >= 0
# Method: deposit(account, amount) returns a new Account with balance + amount

# setClass(...) here
# setValidity(...) here
# setGeneric("deposit", ...) here
# setMethod("deposit", ...) here

acct1 <- new("Account", balance = 100, owner = "Selva")
acct1
#> Expected: An object of class "Account" with balance 100 owned by Selva
deposit(acct1, 50)@balance
#> Expected: 150
# new("Account", balance = -5, owner = "Bug")  # should error
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Account",
  representation(balance = "numeric", owner = "character"))

setValidity("Account", function(object) {
  if (object@balance < 0) "balance cannot be negative" else TRUE
})

setGeneric("deposit", function(account, amount) standardGeneric("deposit"))
setMethod("deposit", "Account", function(account, amount) {
  account@balance <- account@balance + amount
  account
})

acct1 <- new("Account", balance = 100, owner = "Selva")
acct1@balance
#> [1] 100
acct1@owner
#> [1] "Selva"

deposit(acct1, 50)@balance
#> [1] 150

# This would throw: "invalid class 'Account' object: balance cannot be negative"
# new("Account", balance = -5, owner = "Bug")
```

**Explanation:** `representation()` lists the slots and their required types — assigning a character to `balance` would error at construction time. `setValidity()` attaches a function that runs on `new()` and on every slot update, returning `TRUE` for valid or an error string. `setGeneric()` registers `deposit` as an S4 generic, and `setMethod()` binds an implementation for objects of class `Account`. Slots are accessed with `@`, not `$`.

</details>

[WARNING]
**S4 validity checks run on `new()` *and* every slot write via `@`.** That means `acct1@balance <- -5` also fails the check — S4 will not silently let you corrupt the object. This is a feature, not a bug, and is a big reason bioconductor and pharma pipelines rely on S4.

## Exercise 4: Can You Use S4 Multiple Dispatch for Geometric Intersections?

S4's most unique feature is **multiple dispatch**: a method can dispatch on the classes of *several* arguments, not just the first. Define S4 classes `Circle` (with `radius`) and `Rectangle` (with `width`, `height`), then write an `intersects()` generic that takes two shapes and returns a string describing which pair it was called with. You need three methods: `(Circle, Circle)`, `(Circle, Rectangle)`, and `(Rectangle, Rectangle)`.

```r
# Define Circle and Rectangle S4 classes.
# Then define intersects(a, b) with three methods:
#   (Circle, Circle)       → "circle meets circle"
#   (Circle, Rectangle)    → "circle meets rectangle"
#   (Rectangle, Rectangle) → "rectangle meets rectangle"

# setClass("Circle", ...)
# setClass("Rectangle", ...)
# setGeneric("intersects", ...)
# setMethod("intersects", signature("Circle", "Circle"), ...)
# ... etc

cc1 <- new("Circle", radius = 3)
rr1 <- new("Rectangle", width = 4, height = 5)
intersects(cc1, cc1)
#> Expected: "circle meets circle"
intersects(cc1, rr1)
#> Expected: "circle meets rectangle"
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Circle", representation(radius = "numeric"))
setClass("Rectangle", representation(width = "numeric", height = "numeric"))

setGeneric("intersects", function(a, b) standardGeneric("intersects"))

setMethod("intersects", signature("Circle", "Circle"), function(a, b) {
  "circle meets circle"
})
setMethod("intersects", signature("Circle", "Rectangle"), function(a, b) {
  "circle meets rectangle"
})
setMethod("intersects", signature("Rectangle", "Rectangle"), function(a, b) {
  "rectangle meets rectangle"
})

cc1 <- new("Circle", radius = 3)
rr1 <- new("Rectangle", width = 4, height = 5)

intersects(cc1, cc1)
#> [1] "circle meets circle"
intersects(cc1, rr1)
#> [1] "circle meets rectangle"
intersects(rr1, rr1)
#> [1] "rectangle meets rectangle"
```

**Explanation:** `setGeneric("intersects", function(a, b) ...)` declares that the generic takes two arguments, and `setMethod()` uses `signature()` to declare which class combination each implementation handles. When you call `intersects(cc1, rr1)`, S4 looks at the classes of both arguments — `Circle` and `Rectangle` — and finds the exact method registered for that pair. No other OOP system in R does this natively.

</details>

[TIP]
**Signature order matters in S4 multiple dispatch.** The method for `signature("Circle", "Rectangle")` will not fire when you call `intersects(rectangle, circle)` — you'd need to register a separate `signature("Rectangle", "Circle")` method, or make the generic commutative by sorting the inputs before dispatch.

## Exercise 5: Can You Build a Counter Class With R6?

R6 is R's mutable, reference-based OOP system. Unlike S3 and S4 (which return new objects on modification), an R6 object changes *in place*. Build a `Counter` class with a private `count` field starting at zero, and three public methods: `increment()`, `decrement()`, and `get_count()`.

```r
# Build a Counter R6 class with a private count.
# public methods: increment(), decrement(), get_count()
# private field: count = 0

Counter <- R6Class("Counter",
  public = list(
    # your methods here
  ),
  private = list(
    # your field here
  )
)

my_counter <- Counter$new()
my_counter$increment()
my_counter$increment()
my_counter$increment()
my_counter$decrement()
my_counter$get_count()
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r
Counter <- R6Class("Counter",
  public = list(
    increment = function() {
      private$count <- private$count + 1
      invisible(self)
    },
    decrement = function() {
      private$count <- private$count - 1
      invisible(self)
    },
    get_count = function() private$count
  ),
  private = list(
    count = 0
  )
)

my_counter <- Counter$new()
my_counter$increment()
my_counter$increment()
my_counter$increment()
my_counter$decrement()
my_counter$get_count()
#> [1] 2
```

**Explanation:** `R6Class()` returns a class generator — calling `$new()` on it creates an instance. Inside methods, `self$` refers to public fields and `private$` to private ones. Returning `invisible(self)` from `increment()` and `decrement()` is the standard R6 pattern for chainable methods: you can write `my_counter$increment()$increment()$decrement()` in a single line. Each call mutates the same object — there's no copy.

</details>

[KEY INSIGHT]
**R6 objects are references, not values.** Calling `my_counter$increment()` changes the original object. If you do `other <- my_counter` and then `other$increment()`, `my_counter` also changes, because they point to the same underlying environment. This is the opposite of base R's copy-on-modify, and it's exactly what you want for stateful things like game loops, Shiny reactive sessions, or database connections.

## Exercise 6: Can You Extend Counter Into a BoundedCounter?

R6 supports single inheritance via the `inherit =` argument. A subclass can add new fields, add new methods, or override existing ones — and when it overrides, it can still call the parent via `super$`. Extend `Counter` into `BoundedCounter` that accepts a `max` value in `initialize()` and refuses to go above `max` or below `0`. Reuse the parent's `increment()` and `decrement()` logic wherever possible.

```r
# Build BoundedCounter inheriting from Counter.
# initialize(max) stores the upper bound.
# increment() should NOT exceed max.
# decrement() should NOT go below 0.
# All other behaviour comes from the parent Counter.

BoundedCounter <- R6Class("BoundedCounter",
  inherit = Counter,
  public = list(
    # your code here
  ),
  private = list(
    # your code here
  )
)

bc1 <- BoundedCounter$new(max = 2)
bc1$increment(); bc1$increment(); bc1$increment()  # third call should be a no-op
bc1$get_count()
#> Expected: 2
bc1$decrement(); bc1$decrement(); bc1$decrement()  # third call should be a no-op
bc1$get_count()
#> Expected: 0
```

<details>
<summary>Click to reveal solution</summary>

```r
BoundedCounter <- R6Class("BoundedCounter",
  inherit = Counter,
  public = list(
    initialize = function(max) {
      private$max <- max
    },
    increment = function() {
      if (private$count < private$max) super$increment()
      invisible(self)
    },
    decrement = function() {
      if (private$count > 0) super$decrement()
      invisible(self)
    }
  ),
  private = list(
    max = NULL
  )
)

bc1 <- BoundedCounter$new(max = 2)
bc1$increment(); bc1$increment(); bc1$increment()
bc1$get_count()
#> [1] 2

bc1$decrement(); bc1$decrement(); bc1$decrement()
bc1$get_count()
#> [1] 0
```

**Explanation:** `inherit = Counter` pulls in every public and private member from the parent. We override `initialize()` to capture the `max` argument, and we override `increment()` and `decrement()` to guard against hitting the bounds. When the guard passes, we delegate to the parent's implementation with `super$increment()` — no need to reimplement `private$count <- private$count + 1` ourselves. `get_count()` wasn't overridden, so it just inherits unchanged.

</details>

[NOTE]
**`super$` is how you reuse parent logic even after overriding it.** Without `super$`, you'd have to re-declare `private$count <- private$count + 1` inside the subclass — a classic inheritance footgun where the child silently drifts out of sync with the parent.

## Exercise 7: Can You Overload + and - for an S3 Money Class?

R lets you define methods for operators (`+`, `-`, `*`, `==`, `<`, etc.) by writing `Ops.<class>` — a single function that dispatches on the special variable `.Generic`, which tells you which operator was called. Build an S3 `Money` class that holds an amount and a currency, supports `+` and `-` between two `Money` values of the same currency, and prints as `"$100.00 USD"`.

```r
# Build an S3 Money class with:
# - Constructor money(amount, currency)
# - print.Money method → "$X.XX <currency>"
# - Ops.Money method that handles + and - (error on mixed currencies)

money <- function(amount, currency = "USD") {
  # your code here
}

# print.Money <- function(x, ...) { ... }
# Ops.Money <- function(e1, e2) { ... }

wallet <- money(100, "USD")
paycheck <- money(250, "USD")
wallet + paycheck
#> Expected: $350.00 USD
paycheck - wallet
#> Expected: $150.00 USD
```

<details>
<summary>Click to reveal solution</summary>

```r
money <- function(amount, currency = "USD") {
  structure(list(amount = amount, currency = currency), class = "Money")
}

print.Money <- function(x, ...) {
  cat(sprintf("$%.2f %s\n", x$amount, x$currency))
  invisible(x)
}

Ops.Money <- function(e1, e2) {
  if (e1$currency != e2$currency) stop("currency mismatch")
  new_amount <- switch(.Generic,
    "+" = e1$amount + e2$amount,
    "-" = e1$amount - e2$amount,
    stop("operator ", .Generic, " not supported for Money")
  )
  money(new_amount, e1$currency)
}

wallet <- money(100, "USD")
paycheck <- money(250, "USD")

wallet + paycheck
#> $350.00 USD
paycheck - wallet
#> $150.00 USD
```

**Explanation:** Inside `Ops.Money`, the magic variable `.Generic` contains the string name of the operator that was invoked (`"+"`, `"-"`, etc.). We `switch()` on it to decide how to combine the two operands. Anything we don't handle explicitly falls through to the `stop()` branch, so `wallet * paycheck` errors instead of silently doing the wrong thing. The result is wrapped back into a new `Money` object via the constructor.

</details>

[TIP]
**One `Ops.<class>` function gets you 20 operators for free.** The `Ops` group generic covers arithmetic (`+ - * / ^ %% %/%`), comparison (`== != < > <= >=`), and logic (`& | !`). Use `.Generic` to branch on which one was called, and only implement the ones that make sense for your class.

## Exercise 8: Which OOP System Should You Pick for Each Scenario?

There's no universally "best" OOP system in R — each solves a different problem. For the three scenarios below, pick **S3**, **S4**, or **R6** and justify why in one sentence. Then write a minimal sketch showing the class definition for each one.

**Scenarios:**
1. You're writing `summary()` for a new model-fitting function. The object is created once, printed once, and then discarded.
2. You're building a pharma data pipeline where every patient record must pass strict type and range validation before processing.
3. You're writing a turn-based game where a `Player` object's HP, mana, and position change every tick.

```r
# Pick an OOP system for each scenario and sketch a minimal class definition.
# Don't worry about completeness — just show the pattern that fits.

# Scenario 1: summary output → system?
# summary_out <- ...

# Scenario 2: pharma data row → system?
# PharmaRow <- ...

# Scenario 3: game player → system?
# Player <- ...
```

<details>
<summary>Click to reveal solution</summary>

```r
# Scenario 1 — S3. Lightweight, no validation, no mutation, just print nicely.
summary_out <- structure(
  list(n = 100, mean = 5.2, sd = 1.3),
  class = "my_summary"
)
print.my_summary <- function(x, ...) {
  cat("n =", x$n, " mean =", x$mean, " sd =", x$sd, "\n")
}
print(summary_out)
#> n = 100  mean = 5.2  sd = 1.3

# Scenario 2 — S4. Strict slot types + validity enforce the pharma contract.
setClass("PharmaRow",
  representation(patient_id = "character", dose_mg = "numeric", age = "integer"))
setValidity("PharmaRow", function(object) {
  if (object@dose_mg <= 0) return("dose must be positive")
  if (object@age < 18 || object@age > 120) return("age out of range")
  TRUE
})
row1 <- new("PharmaRow", patient_id = "P001", dose_mg = 50, age = 42L)
row1@dose_mg
#> [1] 50

# Scenario 3 — R6. Mutable reference semantics match the game loop.
Player <- R6Class("Player",
  public = list(
    hp = 100, mana = 50, x = 0, y = 0,
    move = function(dx, dy) { self$x <- self$x + dx; self$y <- self$y + dy; invisible(self) },
    take_damage = function(d) { self$hp <- self$hp - d; invisible(self) }
  )
)
hero <- Player$new()
hero$move(3, 4)$take_damage(10)
c(hp = hero$hp, x = hero$x, y = hero$y)
#>  hp   x   y
#>  90   3   4
```

**Explanation:** Scenario 1 is ephemeral output with no constraints — S3 is the simplest tool that answers the need. Scenario 2 is *exactly* the case S4 was designed for: formal types, validated slots, and a predictable contract you can audit. Scenario 3 needs mutation — a fresh copy of a player every time their HP changes would break the game loop — so R6's reference semantics are the right fit.

</details>

[KEY INSIGHT]
**Pick S3 for simplicity, S4 for validation, R6 for mutation.** Those three words cover about 95% of real decisions. Reach for S4 only when you genuinely need slot-level type enforcement, and reach for R6 only when you need objects that change in place.

## Summary

A quick cheat sheet tying the three systems together. Keep this handy while you work — most of the "which system?" questions resolve in under a minute once you know the trade-offs.

| System | Best for | Constructor | Dispatches on | Mutable? |
|---|---|---|---|---|
| S3 | Lightweight classes, print/summary methods, most tidyverse code | `structure(list, class = ...)` | Class of first argument | No (copy-on-modify) |
| S4 | Strict validation, bioconductor, pharma, multiple dispatch | `new("ClassName", ...)` | Any number of arguments | No (copy-on-modify) |
| R6 | Mutable state, Shiny sessions, game loops, database handles | `Generator$new(...)` | Method lookup on object | **Yes** (reference) |

You now have working templates for eight real OOP patterns in R. The biggest payoff from this exercise set is not memorising syntax — it's developing the instinct to ask *"should this be S3, S4, or R6?"* before you write any class at all.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapters 12 (S3), 15 (S4), 14 (R6). [Link](https://adv-r.hadley.nz/oo.html)
2. R6 package vignette — *Introduction to R6*. [Link](https://r6.r-lib.org/articles/Introduction.html)
3. `methods` package documentation — `setClass`, `setGeneric`, `setMethod`, `setValidity`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/methods/html/00Index.html)
4. sloop package — inspect and debug OOP systems at runtime with `otype()`, `s3_dispatch()`, `s4_methods_class()`. [Link](https://sloop.r-lib.org/)
5. Chambers, J. — *Object-Oriented Programming, Functional Programming and R*. Statistical Science, 2014. [Link](https://projecteuclid.org/journals/statistical-science/volume-29/issue-2/Object-Oriented-Programming-Functional-Programming-and-R/10.1214/13-STS452.full)
6. r-statistics.co — [OOP in R: Systems Compared](OOP-in-R.html) (parent tutorial)

## Continue Learning

- [OOP in R](OOP-in-R.html) — the parent tutorial that introduces all four systems side by side and gives you the decision framework
- [S3 Classes in R](S3-Classes-in-R.html) — deep dive on S3 with full method dispatch internals
- [R6 Classes in R](R6-Classes-in-R.html) — when and why to reach for mutable reference objects in Shiny and beyond
