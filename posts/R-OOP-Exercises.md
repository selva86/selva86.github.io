---
title: "R OOP Exercises: 20 S3, S4 & R6 Practice Problems"
slug: "R-OOP-Exercises"
description: "Practice R object-oriented programming with 20 hands-on exercises covering S3 dispatch, S4 validation, R6 mutation, operator overloading, inheritance and system selection."
keywords: "R OOP exercises, S3 class exercises R, S4 exercises R, R6 exercises, R object-oriented programming exercises, R OOP practice problems, R UseMethod exercises, R class method dispatch exercises"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R OOP Exercises"
sidebar_order: 320
fr_parent: "OOP-in-R.html"
auto_link_terms: "R OOP exercises|OOP in R exercises|S3 S4 R6 practice|R object-oriented programming exercises|R class practice problems"
auto_link_case_sensitive: false
target_keyword: "R OOP exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R OOP Exercises: 20 S3, S4 & R6 Practice Problems

<p class="lead">Twenty scenario-based exercises that build fluency across R's three object systems: S3 (informal dispatch), S4 (formal slots and validity), and R6 (mutable reference semantics). Each problem ships with expected output so you can verify, and worked solutions are hidden behind reveal toggles so you actually try first.</p>

Work through the sections in order. Section 1 builds S3 from the ground up, Section 2 introduces S4's formal contracts, Section 3 covers R6's mutable model, Section 4 stress-tests operator and subset dispatch, and Section 5 asks you to pick the right system for a given problem. Several exercises reuse classes you defined earlier, so keep the page open and the session live.

```r title="Run this once before any exercise"
library(R6)
library(methods)
```

## Section 1. S3: informal dispatch (5 problems)

### Exercise 1.1: Build an S3 class for survey responses

**Task:** A research team running a small NPS survey wants tidy storage with a custom print. Build a constructor `survey()` that takes a numeric vector of scores between 0 and 10 and returns a list with class `"survey"` holding the scores and a creation date. Save the constructed object to `ex_1_1`.

**Expected result:**

```
class(ex_1_1)
#> [1] "survey"
ex_1_1$scores
#>  [1]  9 10  8  7  6  9  4  5 10  8
```

**Difficulty:** Beginner

```r title="Your turn"
survey <- function(scores) {
  # your code here
}

ex_1_1 <- survey(c(9, 10, 8, 7, 6, 9, 4, 5, 10, 8))
class(ex_1_1)
ex_1_1$scores
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
survey <- function(scores) {
  stopifnot(is.numeric(scores), all(scores >= 0 & scores <= 10))
  structure(
    list(scores = scores, created = Sys.Date()),
    class = "survey"
  )
}

ex_1_1 <- survey(c(9, 10, 8, 7, 6, 9, 4, 5, 10, 8))
class(ex_1_1)
#> [1] "survey"
ex_1_1$scores
#>  [1]  9 10  8  7  6  9  4  5 10  8
```

**Explanation:** S3 is the "informal" class system because there is no registry; you just attach a class string to an existing R object. The `structure()` helper builds the list and stamps the class attribute in one call. `stopifnot()` provides cheap argument checking. For stronger guarantees you would jump to S4 with `setValidity()`. Always prefer constructor functions to raw `list(..., class = "x")` so refactoring stays safe.

</details>

### Exercise 1.2: Add a print method that dispatches by class

**Task:** Continue with the `survey` class from the previous exercise. Define `print.survey()` so calling `print()` on a survey object shows a one-line summary like `<survey: n=10, mean=7.6>` instead of dumping the raw list. Wrap the same scores into a fresh object and save it as `ex_1_2`, then print it.

**Expected result:**

```
ex_1_2
#> <survey: n=10, mean=7.6>
```

**Difficulty:** Intermediate

```r title="Your turn"
print.survey <- function(x, ...) {
  # your code here
}

ex_1_2 <- survey(c(9, 10, 8, 7, 6, 9, 4, 5, 10, 8))
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
print.survey <- function(x, ...) {
  cat(sprintf("<survey: n=%d, mean=%.1f>\n",
              length(x$scores), mean(x$scores)))
  invisible(x)
}

ex_1_2 <- survey(c(9, 10, 8, 7, 6, 9, 4, 5, 10, 8))
ex_1_2
#> <survey: n=10, mean=7.6>
```

**Explanation:** `print.survey` is found by `UseMethod("print")` because the object's class attribute is "survey". The naming pattern `generic.class` is the entire S3 contract: R looks for `<generic>.<class>` first, then falls back to `<generic>.default`. Always return `invisible(x)` so the value still threads through pipelines without printing twice at the REPL.

</details>

### Exercise 1.3: Chain inheritance with NextMethod for audit logs

**Task:** Build an audit-log class hierarchy. The base `audit_log` carries an events vector and a date; `secure_audit_log` inherits from it via the class vector `c("secure_audit_log", "audit_log")`. Implement `print()` so the secure subclass prints `[SECURE]` then calls `NextMethod()` to inherit the base format. Save a `secure_audit_log` instance to `ex_1_3`.

**Expected result:**

```
ex_1_3
#> [SECURE]
#> <audit_log: 3 events at 2026-05-13>
```

**Difficulty:** Advanced

```r title="Your turn"
audit_log <- function(events) {
  # your code here
}

secure_audit_log <- function(events) {
  # your code here
}

print.audit_log <- function(x, ...) {
  # your code here
}

print.secure_audit_log <- function(x, ...) {
  # your code here
}

ex_1_3 <- secure_audit_log(c("login", "view", "logout"))
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
audit_log <- function(events) {
  structure(list(events = events, when = Sys.Date()),
            class = "audit_log")
}

secure_audit_log <- function(events) {
  obj <- audit_log(events)
  class(obj) <- c("secure_audit_log", "audit_log")
  obj
}

print.audit_log <- function(x, ...) {
  cat(sprintf("<audit_log: %d events at %s>\n",
              length(x$events), x$when))
  invisible(x)
}

print.secure_audit_log <- function(x, ...) {
  cat("[SECURE]\n")
  NextMethod()
}

ex_1_3 <- secure_audit_log(c("login", "view", "logout"))
ex_1_3
#> [SECURE]
#> <audit_log: 3 events at 2026-05-13>
```

**Explanation:** The class vector encodes lookup order: UseMethod walks left to right, finds `print.secure_audit_log`, runs it, and `NextMethod()` re-dispatches to the next class in the vector. This is the S3 equivalent of `super.print()` in Java or C++, and it lets subclasses extend rather than replace parent behaviour. Forget `NextMethod()` and the base format disappears entirely.

</details>

### Exercise 1.4: Operator overloading with the Ops group generic

**Task:** Build a `money` S3 class wrapping a numeric `amount` and a `currency` string. Implement `Ops.money()` so that `+` and `-` work between two `money` objects of the same currency and raise an informative error otherwise. Construct two USD objects, add them, and save the resulting `money` object to `ex_1_4`.

**Expected result:**

```
ex_1_4
#> <money: 175 USD>
```

**Difficulty:** Advanced

```r title="Your turn"
money <- function(amount, currency) {
  # your code here
}

print.money <- function(x, ...) {
  # your code here
}

Ops.money <- function(e1, e2) {
  # your code here
}

ex_1_4 <- money(100, "USD") + money(75, "USD")
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
money <- function(amount, currency) {
  structure(list(amount = amount, currency = currency),
            class = "money")
}

print.money <- function(x, ...) {
  cat(sprintf("<money: %g %s>\n", x$amount, x$currency))
  invisible(x)
}

Ops.money <- function(e1, e2) {
  if (!inherits(e2, "money") || e1$currency != e2$currency) {
    stop("incompatible money operands")
  }
  money(get(.Generic)(e1$amount, e2$amount), e1$currency)
}

ex_1_4 <- money(100, "USD") + money(75, "USD")
ex_1_4
#> <money: 175 USD>
```

**Explanation:** `Ops` is a group generic that covers the entire family of arithmetic and comparison operators including `+`, `-`, `*`, `/`, `==`, and `<`. R sets `.Generic` to the operator name as a string before calling the method, so `get(.Generic)` resolves the matching base function. Wrapping it in one method lets you handle a whole operator family without writing a separate dispatcher for every symbol.

</details>

### Exercise 1.5: Format and compare a temperature class

**Task:** Build a `temperature` S3 class holding a numeric value in Celsius. Implement `format.temperature()` to render `"21.0 C"`, a `print.temperature()` that delegates to `format()` and `cat()`, plus an `Ops.temperature()` method enabling `<`, `>`, and `==` comparisons. Compare two temperatures (21.0 and 19.5) and save the logical result to `ex_1_5`.

**Expected result:**

```
print(a); print(b)
#> 21.0 C
#> 19.5 C
ex_1_5
#> [1] FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
temperature <- function(celsius) {
  # your code here
}

format.temperature <- function(x, ...) {
  # your code here
}

print.temperature <- function(x, ...) {
  # your code here
}

Ops.temperature <- function(e1, e2) {
  # your code here
}

a <- temperature(21.0)
b <- temperature(19.5)
print(a); print(b)
ex_1_5 <- a < b
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
temperature <- function(celsius) {
  structure(list(c = celsius), class = "temperature")
}

format.temperature <- function(x, ...) sprintf("%.1f C", x$c)

print.temperature <- function(x, ...) {
  cat(format(x), "\n", sep = "")
  invisible(x)
}

Ops.temperature <- function(e1, e2) {
  if (.Generic %in% c("<", ">", "<=", ">=", "==", "!=")) {
    get(.Generic)(e1$c, e2$c)
  } else {
    stop(sprintf("'%s' not supported on temperature", .Generic))
  }
}

a <- temperature(21.0)
b <- temperature(19.5)
print(a); print(b)
#> 21.0 C
#> 19.5 C
ex_1_5 <- a < b
ex_1_5
#> [1] FALSE
```

**Explanation:** The `Ops` group covers arithmetic AND comparison operators; checking `.Generic %in% c(...)` lets you opt in to a subset and reject the rest with a single dispatcher. Splitting the renderer into a separate `format()` method is the canonical pattern: `print()` calls `format()`, and other consumers like `paste()` or `as.character()` can reuse the same renderer for free.

</details>

## Section 2. S4: formal classes with validation (4 problems)

### Exercise 2.1: Define an Employee class with typed slots

**Task:** Use `setClass()` to create an `Employee` S4 class with three slots: `name` (character), `salary` (numeric), and `start_date` (Date). Construct an instance for "Alice" earning 75000 starting 2024-03-15 and save it as `ex_2_1`. The slot type system will reject anything mistyped at construction time.

**Expected result:**

```
ex_2_1
#> An object of class "Employee"
#> Slot "name":
#> [1] "Alice"
#> 
#> Slot "salary":
#> [1] 75000
#> 
#> Slot "start_date":
#> [1] "2024-03-15"
```

**Difficulty:** Beginner

```r title="Your turn"
setClass("Employee",
  representation(
    # your code here
  )
)

ex_2_1 <- new("Employee",
  # your code here
)
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setClass("Employee",
  representation(
    name       = "character",
    salary     = "numeric",
    start_date = "Date"
  )
)

ex_2_1 <- new("Employee",
  name       = "Alice",
  salary     = 75000,
  start_date = as.Date("2024-03-15")
)
ex_2_1
#> An object of class "Employee"
#> Slot "name":
#> [1] "Alice"
#> 
#> Slot "salary":
#> [1] 75000
#> 
#> Slot "start_date":
#> [1] "2024-03-15"
```

**Explanation:** S4 differs from S3 by requiring an explicit class definition through `setClass()` with typed slots. `new()` is the canonical constructor and enforces slot types at construction: passing a string to `salary` would error immediately. `representation()` is legacy syntax with the same effect as the modern `slots =` argument, but you will see it everywhere in published code so it is worth recognising.

</details>

### Exercise 2.2: Reject invalid state with setValidity

**Task:** Define an S4 `Patient` class with slots `age` (numeric) and `systolic_bp` (numeric). Attach a validity function via `setValidity()` that rejects ages below zero or `systolic_bp` outside the 60 to 250 range. Try constructing a patient with `systolic_bp = 400` inside `tryCatch()` and save the captured error message string to `ex_2_2`.

**Expected result:**

```
ex_2_2
#> [1] "invalid class \"Patient\" object: systolic_bp must be 60 to 250"
```

**Difficulty:** Intermediate

```r title="Your turn"
setClass("Patient",
  representation(age = "numeric", systolic_bp = "numeric")
)

setValidity("Patient", function(object) {
  # your code here
})

ex_2_2 <- tryCatch(
  new("Patient", age = 30, systolic_bp = 400),
  error = function(e) conditionMessage(e)
)
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setClass("Patient",
  representation(age = "numeric", systolic_bp = "numeric")
)

setValidity("Patient", function(object) {
  if (object@age < 0) return("age must be non-negative")
  if (object@systolic_bp < 60 || object@systolic_bp > 250)
    return("systolic_bp must be 60 to 250")
  TRUE
})

ex_2_2 <- tryCatch(
  new("Patient", age = 30, systolic_bp = 400),
  error = function(e) conditionMessage(e)
)
ex_2_2
#> [1] "invalid class \"Patient\" object: systolic_bp must be 60 to 250"
```

**Explanation:** `setValidity()` registers a function that runs on every `new()` call and whenever you invoke `validObject()` explicitly. It must return TRUE for valid state or a character string describing the failure. S4 prepends a standard `invalid class X object:` prefix to your message, which is why the captured error reads as it does. Validity checks beat manual `stopifnot()` in constructors because they also fire on slot mutation.

</details>

### Exercise 2.3: Compute billing with setGeneric and setMethod

**Task:** Continuing with the `Employee` class from 2.1, define a generic `annual_cost()` using `setGeneric()` and a method via `setMethod()` that returns `salary * 1.30` to model a 30 percent overhead loading. Compute Alice's annual cost from the existing `ex_2_1` object and save the numeric to `ex_2_3`.

**Expected result:**

```
ex_2_3
#> [1] 97500
```

**Difficulty:** Intermediate

```r title="Your turn"
setGeneric("annual_cost",
  function(x) standardGeneric("annual_cost")
)

setMethod("annual_cost", "Employee", function(x) {
  # your code here
})

ex_2_3 <- annual_cost(ex_2_1)
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setGeneric("annual_cost",
  function(x) standardGeneric("annual_cost")
)

setMethod("annual_cost", "Employee", function(x) {
  x@salary * 1.30
})

ex_2_3 <- annual_cost(ex_2_1)
ex_2_3
#> [1] 97500
```

**Explanation:** `setGeneric()` registers a function name that S4 will dispatch on, with `standardGeneric()` acting as the dispatch stub that selects a method based on argument classes. `setMethod()` attaches a concrete implementation to a class signature. The slot accessor `@` is the S4 equivalent of `$` for lists, but it is type-checked: writing `x@nonexistent` errors at runtime instead of silently returning NULL.

</details>

### Exercise 2.4: Inherit with contains and callNextMethod

**Task:** Define an S4 `Manager` class that extends `Employee` using `contains = "Employee"` and adds a `reports` slot (integer count of direct reports). Override `annual_cost()` so a manager's overhead loading is 50 percent on base salary plus `reports * 5000` headcount load. Construct a Manager named "Bob" with salary 75000 and 4 reports, then save the cost to `ex_2_4`.

**Expected result:**

```
ex_2_4
#> [1] 132500
```

**Difficulty:** Advanced

```r title="Your turn"
setClass("Manager",
  contains = "Employee",
  representation(reports = "integer")
)

setMethod("annual_cost", "Manager", function(x) {
  # your code here
})

mgr <- new("Manager",
  name       = "Bob",
  salary     = 75000,
  start_date = as.Date("2023-01-01"),
  reports    = 4L
)
ex_2_4 <- annual_cost(mgr)
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setClass("Manager",
  contains = "Employee",
  representation(reports = "integer")
)

setMethod("annual_cost", "Manager", function(x) {
  base <- callNextMethod()        # Employee's 1.30 loading
  base / 1.30 * 1.50 + x@reports * 5000
})

mgr <- new("Manager",
  name       = "Bob",
  salary     = 75000,
  start_date = as.Date("2023-01-01"),
  reports    = 4L
)
ex_2_4 <- annual_cost(mgr)
ex_2_4
#> [1] 132500
```

**Explanation:** `contains = "Employee"` makes Manager inherit every slot and every method defined on Employee. `callNextMethod()` dispatches the same generic to the parent class signature, similar to `NextMethod()` in S3 but aware of S4's multiple dispatch. Dividing out the parent loading is a common idiom when you want a different multiplier on top of an inherited calculation rather than a plain additive delta.

</details>

## Section 3. R6: mutable reference classes (4 problems)

### Exercise 3.1: Build a Counter with public state

**Task:** Use `R6Class()` to define a `Counter` with a public field `n` initialised to zero and a method `increment()` that adds 1 to `self$n`. Instantiate, increment three times, then save the counter object (not its value) to `ex_3_1`. Read `ex_3_1$n` afterwards to confirm the count is 3.

**Expected result:**

```
ex_3_1$n
#> [1] 3
```

**Difficulty:** Beginner

```r title="Your turn"
Counter <- R6Class("Counter",
  public = list(
    # your code here
  )
)

ex_3_1 <- Counter$new()
ex_3_1$increment()
ex_3_1$increment()
ex_3_1$increment()
ex_3_1$n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
Counter <- R6Class("Counter",
  public = list(
    n = 0,
    increment = function() {
      self$n <- self$n + 1
      invisible(self)
    }
  )
)

ex_3_1 <- Counter$new()
ex_3_1$increment()
ex_3_1$increment()
ex_3_1$increment()
ex_3_1$n
#> [1] 3
```

**Explanation:** R6 objects have reference semantics, so `ex_3_1$increment()` mutates the same instance every call without reassignment. Inside a method, `self$` refers to the current object. Returning `invisible(self)` is the R6 idiom that enables method chaining, allowing `Counter$new()$increment()$increment()` to flow naturally without polluting the REPL with intermediate prints.

</details>

### Exercise 3.2: Encapsulate state with private fields

**Task:** Define an R6 `Account` with a private numeric `balance` initialised in `initialize()` and public methods `deposit(amount)`, `withdraw(amount)`, and `current()`. `withdraw` must error if amount exceeds balance. Open an account, deposit 500, withdraw 120, and save the account object to `ex_3_2`. Call `ex_3_2$current()` to verify.

**Expected result:**

```
ex_3_2$current()
#> [1] 380
```

**Difficulty:** Intermediate

```r title="Your turn"
Account <- R6Class("Account",
  public = list(
    # your code here
  ),
  private = list(
    balance = NULL
  )
)

ex_3_2 <- Account$new()
ex_3_2$deposit(500)
ex_3_2$withdraw(120)
ex_3_2$current()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
Account <- R6Class("Account",
  public = list(
    initialize = function() {
      private$balance <- 0
    },
    deposit = function(amount) {
      private$balance <- private$balance + amount
      invisible(self)
    },
    withdraw = function(amount) {
      if (amount > private$balance) stop("insufficient funds")
      private$balance <- private$balance - amount
      invisible(self)
    },
    current = function() private$balance
  ),
  private = list(
    balance = NULL
  )
)

ex_3_2 <- Account$new()
ex_3_2$deposit(500)
ex_3_2$withdraw(120)
ex_3_2$current()
#> [1] 380
```

**Explanation:** `private` fields are accessible only inside methods of the same object via `private$`. Calling `ex_3_2$balance` from outside returns NULL because the field is invisible to the public interface. This is the strongest encapsulation R offers: S3 and S4 have no private mechanism. Reach for private state when you want invariants that callers cannot accidentally clobber by direct assignment.

</details>

### Exercise 3.3: Expose derived state with active bindings

**Task:** Build an R6 `Body` class with public fields `height_m` and `weight_kg`, plus an active binding `bmi` that computes weight divided by height squared every time it is read. Construct a Body with height 1.75 and weight 70, then save the value of `body$bmi` (a numeric scalar, not the object) to `ex_3_3`.

**Expected result:**

```
ex_3_3
#> [1] 22.85714
```

**Difficulty:** Intermediate

```r title="Your turn"
Body <- R6Class("Body",
  public = list(
    height_m  = NA,
    weight_kg = NA,
    initialize = function(height_m, weight_kg) {
      # your code here
    }
  ),
  active = list(
    bmi = function(value) {
      # your code here
    }
  )
)

body <- Body$new(height_m = 1.75, weight_kg = 70)
ex_3_3 <- body$bmi
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
Body <- R6Class("Body",
  public = list(
    height_m  = NA,
    weight_kg = NA,
    initialize = function(height_m, weight_kg) {
      self$height_m  <- height_m
      self$weight_kg <- weight_kg
    }
  ),
  active = list(
    bmi = function(value) {
      if (!missing(value)) stop("bmi is read-only")
      self$weight_kg / (self$height_m^2)
    }
  )
)

body <- Body$new(height_m = 1.75, weight_kg = 70)
ex_3_3 <- body$bmi
ex_3_3
#> [1] 22.85714
```

**Explanation:** Active bindings look like fields to callers but execute a function on every access. The function receives `value` only when the binding is being assigned to; checking `missing(value)` is the idiom for declaring a read-only computed property. This is R6's answer to Python's `@property` decorator, useful for cached or derived quantities that should always stay in sync with their inputs.

</details>

### Exercise 3.4: Copy-on-write via clone with deep semantics

**Task:** R6 objects copy by reference, so `a <- b` creates an alias, not a copy. Reuse the `Counter` from 3.1: create object `a`, increment it once, then make `b <- a$clone()`, increment `a` again, and save the count of `b$n` to `ex_3_4` (which should still be 1, not 2). This verifies that clones really decouple from their source.

**Expected result:**

```
ex_3_4
#> [1] 1
```

**Difficulty:** Advanced

```r title="Your turn"
a <- Counter$new()
a$increment()

b <- a$clone()
a$increment()

ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- Counter$new()
a$increment()

b <- a$clone()
a$increment()

ex_3_4 <- b$n
ex_3_4
#> [1] 1
```

**Explanation:** `$clone()` produces a shallow independent copy, so subsequent mutations of `a` no longer touch `b`. Without clone, `b <- a` makes both names point to the same R6 environment and incrementing either mutates both. For nested R6 fields you also need `clone(deep = TRUE)`, otherwise the inner R6 object remains shared between the copies and the bug surfaces only when you mutate something nested.

</details>

## Section 4. Operator overloading and dispatch (3 problems)

### Exercise 4.1: Render fractions with format and print

**Task:** Build a `fraction` S3 class with integer slots `num` and `den`. Write `format.fraction()` returning strings like `"3/4"` and `print.fraction()` that delegates to `format()` and `cat()` to render output. Construct a fraction representing three-quarters and save the printable object (not its character form) to `ex_4_1`. Print it to confirm the output is `3/4`.

**Expected result:**

```
print(ex_4_1)
#> 3/4
```

**Difficulty:** Intermediate

```r title="Your turn"
fraction <- function(num, den) {
  # your code here
}

format.fraction <- function(x, ...) {
  # your code here
}

print.fraction <- function(x, ...) {
  # your code here
}

ex_4_1 <- fraction(3, 4)
print(ex_4_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fraction <- function(num, den) {
  stopifnot(den != 0)
  structure(list(num = num, den = den), class = "fraction")
}

format.fraction <- function(x, ...) {
  sprintf("%d/%d", x$num, x$den)
}

print.fraction <- function(x, ...) {
  cat(format(x), "\n", sep = "")
  invisible(x)
}

ex_4_1 <- fraction(3, 4)
print(ex_4_1)
#> 3/4
```

**Explanation:** Splitting format from print lets other generics like `as.character()`, `paste()`, or `sprintf()` reuse the same renderer without duplication. The `print()` method simply adds a newline via `cat()`. A common mistake is to call `print()` recursively from inside the method body, which would re-enter dispatch on the same class and produce infinite recursion until the C stack overflows.

</details>

### Exercise 4.2: Vector addition via Ops on a Vec2 class

**Task:** Define an S3 `vec2` class wrapping a length-2 numeric (x, y). Implement `print.vec2()` that renders `vec2(x, y)` and `Ops.vec2()` so that `+` between two `vec2` objects returns a new `vec2` with elementwise sums, while any other operator errors with `"unsupported"`. Add `vec2(1, 2)` and `vec2(3, 4)` and save the resulting `vec2` to `ex_4_2`.

**Expected result:**

```
ex_4_2
#> vec2(4, 6)
```

**Difficulty:** Intermediate

```r title="Your turn"
vec2 <- function(x, y) {
  # your code here
}

print.vec2 <- function(v, ...) {
  # your code here
}

Ops.vec2 <- function(e1, e2) {
  # your code here
}

ex_4_2 <- vec2(1, 2) + vec2(3, 4)
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vec2 <- function(x, y) {
  structure(list(x = x, y = y), class = "vec2")
}

print.vec2 <- function(v, ...) {
  cat(sprintf("vec2(%g, %g)\n", v$x, v$y))
  invisible(v)
}

Ops.vec2 <- function(e1, e2) {
  if (.Generic != "+") stop("unsupported")
  vec2(e1$x + e2$x, e1$y + e2$y)
}

ex_4_2 <- vec2(1, 2) + vec2(3, 4)
ex_4_2
#> vec2(4, 6)
```

**Explanation:** The Ops group dispatches arithmetic and comparison operators based on `.Generic`. Filtering on `.Generic != "+"` lets you allow a single operator while rejecting the rest with a uniform error message. Adding a `print.vec2()` method is essential because the default list printer would dump messy `$x`, `$y`, and `attr(,"class")` lines, hiding the actual structure under noise.

</details>

### Exercise 4.3: Implement subsetting with custom bracket methods

**Task:** Build a `ts_simple` S3 class storing two parallel numeric vectors `time` and `value`. Implement `[.ts_simple` so `x[i]` returns a sub-`ts_simple` with both vectors indexed by `i`. Construct a 10-point series with `time = 1:10` and ten increasing values, take the first three points, and save the subsetted `ts_simple` to `ex_4_3`.

**Expected result:**

```
ex_4_3
#> ts_simple:
#>   time value
#> 1    1    10
#> 2    2    12
#> 3    3    15
```

**Difficulty:** Advanced

```r title="Your turn"
ts_simple <- function(time, value) {
  # your code here
}

`[.ts_simple` <- function(x, i) {
  # your code here
}

print.ts_simple <- function(x, ...) {
  # your code here
}

full <- ts_simple(1:10, c(10, 12, 15, 14, 18, 17, 22, 25, 24, 30))
ex_4_3 <- full[1:3]
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ts_simple <- function(time, value) {
  stopifnot(length(time) == length(value))
  structure(list(time = time, value = value),
            class = "ts_simple")
}

`[.ts_simple` <- function(x, i) {
  ts_simple(x$time[i], x$value[i])
}

print.ts_simple <- function(x, ...) {
  cat("ts_simple:\n")
  print(data.frame(time = x$time, value = x$value))
  invisible(x)
}

full <- ts_simple(1:10, c(10, 12, 15, 14, 18, 17, 22, 25, 24, 30))
ex_4_3 <- full[1:3]
ex_4_3
#> ts_simple:
#>   time value
#> 1    1    10
#> 2    2    12
#> 3    3    15
```

**Explanation:** The functions `[`, `[[`, and `$` are themselves S3 generics, which is why custom subset methods integrate seamlessly with the rest of base R. Backticks are required around `` `[.ts_simple` `` because square brackets are not valid in a bare identifier. Returning a same-class object from the subset method preserves chained subsetting, so `full[1:5][2]` continues to work as expected.

</details>

## Section 5. Choosing the right system (4 problems)

### Exercise 5.1: Refactor an S3 stack into R6 for true mutation

**Task:** An S3 stack written as `push_s3(stack, x)` returns a fresh list every call, forcing callers to reassign `stack <- push_s3(stack, x)`. Rewrite it as an R6 `Stack` class with `push()`, `pop()`, and `size()` methods that mutate in place. Push 10, 20, and 30 onto a fresh stack and save the resulting size to `ex_5_1`.

**Expected result:**

```
ex_5_1
#> [1] 3
```

**Difficulty:** Intermediate

```r title="Your turn"
Stack <- R6Class("Stack",
  public = list(
    items = list(),
    push = function(x) {
      # your code here
    },
    pop = function() {
      # your code here
    },
    size = function() {
      # your code here
    }
  )
)

s <- Stack$new()
s$push(10)
s$push(20)
s$push(30)
ex_5_1 <- s$size()
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
Stack <- R6Class("Stack",
  public = list(
    items = list(),
    push = function(x) {
      self$items[[length(self$items) + 1]] <- x
      invisible(self)
    },
    pop = function() {
      n <- length(self$items)
      if (n == 0) stop("empty stack")
      x <- self$items[[n]]
      self$items[[n]] <- NULL
      x
    },
    size = function() length(self$items)
  )
)

s <- Stack$new()
s$push(10)
s$push(20)
s$push(30)
ex_5_1 <- s$size()
ex_5_1
#> [1] 3
```

**Explanation:** S3's value semantics turn every "mutating" operation into a copy-and-replace, which is fine for pure transforms but awkward for stateful structures like stacks, queues, and caches. R6 trades that simplicity for in-place mutation, eliminating the "I forgot to reassign" bug class. Pick R6 when state actively evolves over time, and pick S3 or S4 when your transforms are pure functions of their inputs.

</details>

### Exercise 5.2: Wrap an R6 object in S4 for typed slots

**Task:** Imagine you need an R6 cache for performance but also want S4 slot type checking at the API boundary. Define an S4 `CacheHandle` with one slot `engine` of class `"R6"` (registered via `setOldClass("R6")`). Wrap an R6 `Cache` instance inside the handle and save the handle (the S4 object) to `ex_5_2`. Verify both class layers.

**Expected result:**

```
class(ex_5_2)[1]
#> [1] "CacheHandle"
class(ex_5_2@engine)[1]
#> [1] "Cache"
```

**Difficulty:** Intermediate

```r title="Your turn"
Cache <- R6Class("Cache",
  public = list(
    data = list(),
    set = function(key, value) {
      self$data[[key]] <- value
      invisible(self)
    },
    get = function(key) self$data[[key]]
  )
)

setOldClass("R6")

setClass("CacheHandle",
  representation(engine = "R6")
)

ex_5_2 <- new("CacheHandle", engine = Cache$new())
class(ex_5_2)[1]
class(ex_5_2@engine)[1]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
Cache <- R6Class("Cache",
  public = list(
    data = list(),
    set = function(key, value) {
      self$data[[key]] <- value
      invisible(self)
    },
    get = function(key) self$data[[key]]
  )
)

setOldClass("R6")

setClass("CacheHandle",
  representation(engine = "R6")
)

ex_5_2 <- new("CacheHandle", engine = Cache$new())
class(ex_5_2)[1]
#> [1] "CacheHandle"
class(ex_5_2@engine)[1]
#> [1] "Cache"
```

**Explanation:** `setOldClass("R6")` registers the R6 class string with the S4 system so it can be used as a slot type. The outer S4 layer enforces type-checking at slot assignment, while the inner R6 layer carries mutable state. This hybrid pattern appears when interfacing with packages that demand formal S4 class signatures (Bioconductor, for example) while you still need stateful internals.

</details>

### Exercise 5.3: Pick the right system for an immutable value type

**Task:** You need a class for immutable currency conversion rules: a base currency plus a named numeric vector of conversion rates. The rates never change after construction, and conversions are pure functions of input. Pick S3 (the lowest-friction choice for pure value types) and implement a `convert()` generic with a method. Save the rules object to `ex_5_3` and run a conversion.

**Expected result:**

```
convert(ex_5_3, 100, "EUR")
#> [1] 85
```

**Difficulty:** Beginner

```r title="Your turn"
rates <- function(base, conversions) {
  # your code here
}

convert <- function(x, ...) UseMethod("convert")
convert.rates <- function(x, amount, to) {
  # your code here
}

ex_5_3 <- rates("USD", c(EUR = 0.85, GBP = 0.73))
convert(ex_5_3, 100, "EUR")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rates <- function(base, conversions) {
  structure(list(base = base, rates = conversions),
            class = "rates")
}

convert <- function(x, ...) UseMethod("convert")
convert.rates <- function(x, amount, to) {
  unname(amount * x$rates[[to]])
}

ex_5_3 <- rates("USD", c(EUR = 0.85, GBP = 0.73))
convert(ex_5_3, 100, "EUR")
#> [1] 85
```

**Explanation:** For immutable value types with no shared state and only light validation, S3 is the lowest-friction option. No class registry, no `new()` call, no slot ceremony, just a structure with a class string. Reserve S4 for cases where you genuinely need formal type contracts (Bioconductor, validated domain models), and R6 for cases where mutation is the central point of the abstraction.

</details>

### Exercise 5.4: Benchmark dispatch overhead across three systems

**Task:** Define a trivial `noop()` operation in all three systems (S3 via UseMethod, S4 via setGeneric, R6 via a method) and time 100000 dispatch calls of each with `system.time()`. Capture elapsed seconds, name them `s3`, `s4`, `r6`, and save the named numeric vector to `ex_5_4`. Compare which system has the lowest dispatch overhead.

**Expected result:**

```
ex_5_4
#> # approximate elapsed seconds for 100k dispatches
#>   s3   s4   r6 
#> 0.10 0.45 0.20 
```

**Difficulty:** Advanced

```r title="Your turn"
N <- 100000

# S3
noop_s3 <- function(x) UseMethod("noop_s3")
noop_s3.thing <- function(x) NULL
obj3 <- structure(list(), class = "thing")
t3 <- system.time(for (i in seq_len(N)) noop_s3(obj3))["elapsed"]

# S4
setGeneric("noop_s4", function(x) standardGeneric("noop_s4"))
setClass("Thing4", representation(value = "numeric"))
setMethod("noop_s4", "Thing4", function(x) NULL)
obj4 <- new("Thing4", value = 0)
t4 <- system.time(for (i in seq_len(N)) noop_s4(obj4))["elapsed"]

# R6
Thing6 <- R6Class("Thing6",
  public = list(noop = function() NULL)
)
obj6 <- Thing6$new()
t6 <- system.time(for (i in seq_len(N)) obj6$noop())["elapsed"]

ex_5_4 <- setNames(c(t3, t4, t6), c("s3", "s4", "r6"))
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
N <- 100000

# S3
noop_s3 <- function(x) UseMethod("noop_s3")
noop_s3.thing <- function(x) NULL
obj3 <- structure(list(), class = "thing")
t3 <- system.time(for (i in seq_len(N)) noop_s3(obj3))["elapsed"]

# S4
setGeneric("noop_s4", function(x) standardGeneric("noop_s4"))
setClass("Thing4", representation(value = "numeric"))
setMethod("noop_s4", "Thing4", function(x) NULL)
obj4 <- new("Thing4", value = 0)
t4 <- system.time(for (i in seq_len(N)) noop_s4(obj4))["elapsed"]

# R6
Thing6 <- R6Class("Thing6",
  public = list(noop = function() NULL)
)
obj6 <- Thing6$new()
t6 <- system.time(for (i in seq_len(N)) obj6$noop())["elapsed"]

ex_5_4 <- setNames(c(t3, t4, t6), c("s3", "s4", "r6"))
ex_5_4
#> # approximate elapsed seconds for 100k dispatches
#>   s3   s4   r6 
#> 0.10 0.45 0.20 
```

**Explanation:** S3 dispatch is the cheapest because `UseMethod()` is a thin C call that walks the class vector. S4 dispatch is the slowest in classic benchmarks because it walks a class hierarchy and selects the best-matching signature, sometimes with multiple arguments. R6 dispatch is close to S3 because methods are stored as plain environment lookups. The exact ratios depend on R version and JIT, but the ordering is stable.

</details>

## What to do next

If any system felt fuzzy, the parent tutorial walks through it in full:

- [OOP in R](OOP-in-R.html) covers S3, S4, and R6 with worked examples and a system-selection cheat sheet.
- [Functional Programming in R](Functional-Programming-in-R.html) explores the closures-and-environments toolkit that R6 builds on top of.
- [R Closures](R-Closures.html) explains the environment mechanics that make R6 private fields and active bindings actually work.

Practice more exercise hubs at the [Practice Exercises](index.html#practice-exercises) section of the sidebar.
