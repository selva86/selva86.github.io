---
title: "R5 Reference Classes in R: setRefClass() — Legacy OOP"
slug: "R5-Reference-Classes"
description: "R5 Reference Classes (setRefClass) are base R's first mutable OOP system. Learn the syntax, the <<- rule, why R6 superseded it, and how to migrate code."
keywords: "R5 reference classes, setRefClass R, R reference classes, R5 vs R6, legacy OOP R, mutable objects R, callSuper R, reference semantics R"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "FR-oop-1"
post_type: "FR"
auto_link_terms: "R5 reference classes|setRefClass|R5 class|reference classes in R|R5 OOP|R5 system"
auto_link_case_sensitive: false
fr_parent: "OOP-in-R.html"
---

# R5 Reference Classes in R: setRefClass() — Legacy OOP

<p class="lead"><strong>R5 Reference Classes</strong> — also called Reference Classes or just R5 — are base R's first OOP system where objects can change their own state in place instead of returning a new copy on every update. They are defined with <code>setRefClass()</code> and ship with base R, but the R6 package has largely replaced them in modern code.</p>

## What are R5 Reference Classes in R?

R5 lets a single object hold state and update itself in place. That mutability is the whole point — a counter can tick up, a config can change settings, and every variable pointing at the object sees the same update. Let's build a tiny `Person` class so the shape is concrete before we unpack any rules.

The class declares its data in a `fields` list and its behaviour in a `methods` list. Calling `Person$new(...)` creates an instance you talk to with `$`.

```r
# Define a Reference Class with two fields and two methods
Person <- setRefClass("Person",
  fields = list(
    name = "character",
    age  = "numeric"
  ),
  methods = list(
    greet = function() {
      cat("Hi, I'm", name, "and I'm", age, "years old.\n")
    },
    have_birthday = function() {
      age <<- age + 1
      cat(name, "is now", age, "\n")
    }
  )
)

# Create an instance and talk to it
alice <- Person$new(name = "Alice", age = 30)
alice$greet()
#> Hi, I'm Alice and I'm 30 years old.

alice$have_birthday()
#> Alice is now 31

alice$greet()
#> Hi, I'm Alice and I'm 31 years old.
```

Notice that we never reassigned `alice`. A single call to `have_birthday()` changed `alice$age` from 30 to 31, and the second `greet()` call sees the new value. That in-place update is the entire reason R5 exists — every other R object would have forced you to write `alice <- update(alice)` and pass the new copy around.

[NOTE]
**R5 ships in base R via the `methods` package.** No install or `library()` call is needed — `setRefClass()` is available the moment you start R.

**Try it:** Define an `ex_Car` class with `make` and `model` fields and a `describe()` method that prints `"<make> <model>"`. Test it on a Toyota Corolla.

```r
# Try it: define ex_Car
ex_Car <- setRefClass("ex_Car",
  fields = list(
    # your fields here
  ),
  methods = list(
    describe = function() {
      # your code here
    }
  )
)

# Test:
ex_car <- ex_Car$new(make = "Toyota", model = "Corolla")
ex_car$describe()
#> Expected: Toyota Corolla
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_Car <- setRefClass("ex_Car",
  fields = list(
    make  = "character",
    model = "character"
  ),
  methods = list(
    describe = function() {
      cat(make, model, "\n")
    }
  )
)

ex_car <- ex_Car$new(make = "Toyota", model = "Corolla")
ex_car$describe()
#> Toyota Corolla
```

**Explanation:** Fields are referenced by bare name inside methods. `cat()` prints them with a space separator and a trailing newline.

</details>

## Why does R5 use <<- instead of <- inside methods?

R5 methods run in their own little environment. A plain `<-` creates a *local* variable inside that environment, which vanishes the moment the method returns. To actually update the field stored on the object, you have to reach up the scope chain — and that's what `<<-` does.

Skip `<<-` and your "setter" looks fine but quietly does nothing. Let's prove it.

```r
# WRONG: uses <- so the update is local and lost
BadCounter <- setRefClass("BadCounter",
  fields  = list(count = "numeric"),
  methods = list(
    increment = function() {
      count <- count + 1   # local variable, not the field
    }
  )
)

bc <- BadCounter$new(count = 0)
bc$increment()
bc$increment()
bc$count
#> [1] 0

# RIGHT: uses <<- so the field on the object is updated
GoodCounter <- setRefClass("GoodCounter",
  fields  = list(count = "numeric"),
  methods = list(
    increment = function() {
      count <<- count + 1
    }
  )
)

gc <- GoodCounter$new(count = 0)
gc$increment()
gc$increment()
gc$count
#> [1] 2
```

`BadCounter$increment()` runs without complaint, but two calls leave `count` at 0 because each call wrote to a throwaway local. `GoodCounter` uses `<<-`, so each call reaches up and rewrites the field — two calls, count of two.

[WARNING]
**Forgetting `<<-` is a silent bug.** R5 will not warn you that your setter did nothing. Any method that updates a field MUST use `<<-`, or you'll spend an hour debugging a "stuck" object.

**Try it:** The `ex_Tag` class below has a broken `set_label()` method. Fix it so the test prints the new label.

```r
# Try it: fix set_label() so the field actually updates
ex_Tag <- setRefClass("ex_Tag",
  fields  = list(label = "character"),
  methods = list(
    set_label = function(new_label) {
      label <- new_label   # this is wrong — fix it
    }
  )
)

ex_tag <- ex_Tag$new(label = "draft")
ex_tag$set_label("final")
ex_tag$label
#> Expected: "final"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_Tag <- setRefClass("ex_Tag",
  fields  = list(label = "character"),
  methods = list(
    set_label = function(new_label) {
      label <<- new_label   # use <<- to write to the field
    }
  )
)

ex_tag <- ex_Tag$new(label = "draft")
ex_tag$set_label("final")
ex_tag$label
#> [1] "final"
```

**Explanation:** Switching `<-` to `<<-` tells R to walk past the method's local scope and update the `label` field on the object itself.

</details>

## How do reference semantics work in R5?

Most R objects follow copy-on-modify: assign a vector to a new name, change one, and the other is untouched. R5 objects deliberately break that rule. Assigning an R5 object to a new name creates an *alias*, not a copy — both names point to the same underlying object, and every change is visible to both.

If you genuinely want an independent snapshot, R5 gives you a built-in `$copy()` method.

```r
Counter <- setRefClass("Counter",
  fields  = list(count = "numeric"),
  methods = list(
    increment = function() {
      count <<- count + 1
    }
  )
)

c1 <- Counter$new(count = 0)
c2 <- c1            # alias, NOT a copy

c1$increment()
c1$increment()

c1$count
#> [1] 2
c2$count
#> [1] 2

# $copy() makes an independent snapshot
c3 <- c1$copy()
c1$increment()

c1$count
#> [1] 3
c3$count
#> [1] 2
```

`c2 <- c1` did not duplicate anything — both names point at the same object, so incrementing `c1` was the same as incrementing `c2`. `c3 <- c1$copy()` did duplicate, so `c3` froze at 2 while `c1` carried on.

[KEY INSIGHT]
**Reference semantics is the entire point of R5.** Once you assign an R5 object to a new name, you are sharing state, not data — that's a feature for stateful systems and a footgun if you forget.

**Try it:** Predict what `ex_b$value` will print after the increment, then run it to check.

```r
# Try it: predict before running
ex_Box <- setRefClass("ex_Box",
  fields  = list(value = "numeric"),
  methods = list(
    bump = function() { value <<- value + 10 }
  )
)

ex_a <- ex_Box$new(value = 5)
ex_b <- ex_a
ex_a$bump()
ex_b$value
#> Expected: 15
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_a <- ex_Box$new(value = 5)
ex_b <- ex_a
ex_a$bump()
ex_b$value
#> [1] 15
```

**Explanation:** `ex_b <- ex_a` aliases the same object, so bumping `ex_a` also bumps what `ex_b` is pointing at. Both see `value = 15`.

</details>

## How does inheritance work with setRefClass()?

A child class declares its parent with `contains = "Parent"`. Inside the child's `initialize` method, you call `callSuper(...)` to run the parent's constructor first, then add the child's own fields. Every method defined on the parent is automatically available on the child — and the child can override or extend any of them.

```r
Animal <- setRefClass("Animal",
  fields  = list(
    name  = "character",
    sound = "character"
  ),
  methods = list(
    initialize = function(name = "", sound = "") {
      name  <<- name
      sound <<- sound
    },
    speak = function() {
      cat(name, "says:", sound, "\n")
    }
  )
)

Dog <- setRefClass("Dog",
  contains = "Animal",
  fields   = list(breed = "character"),
  methods  = list(
    initialize = function(name = "", breed = "") {
      callSuper(name = name, sound = "Woof")
      breed <<- breed
    },
    describe = function() {
      cat(name, "is a", breed, "\n")
      speak()
    }
  )
)

rex <- Dog$new(name = "Rex", breed = "Labrador")
rex$describe()
#> Rex is a Labrador
#> Rex says: Woof

rex$speak()
#> Rex says: Woof
```

`callSuper()` runs `Animal$initialize` first, which populates `name` and `sound`, then the rest of `Dog$initialize` sets `breed`. When `rex$describe()` calls `speak()`, it's calling the inherited method on the same object — that's why it sees `name = "Rex"`.

**Try it:** Add a `Cat` subclass of `Animal` with a `purr()` method that prints `"<name> purrs."`. Constructor should hard-code the sound to `"Meow"`.

```r
# Try it: define ex_Cat as a subclass of Animal
ex_Cat <- setRefClass("ex_Cat",
  contains = "Animal",
  methods  = list(
    initialize = function(name = "") {
      # call parent and set sound to "Meow"
    },
    purr = function() {
      # print "<name> purrs."
    }
  )
)

ex_whiskers <- ex_Cat$new(name = "Whiskers")
ex_whiskers$speak()
#> Expected: Whiskers says: Meow
ex_whiskers$purr()
#> Expected: Whiskers purrs.
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_Cat <- setRefClass("ex_Cat",
  contains = "Animal",
  methods  = list(
    initialize = function(name = "") {
      callSuper(name = name, sound = "Meow")
    },
    purr = function() {
      cat(name, "purrs.\n")
    }
  )
)

ex_whiskers <- ex_Cat$new(name = "Whiskers")
ex_whiskers$speak()
#> Whiskers says: Meow
ex_whiskers$purr()
#> Whiskers purrs.
```

**Explanation:** `callSuper(name = name, sound = "Meow")` runs `Animal$initialize` so the inherited `speak()` method finds the right values. The new `purr()` method is unique to `Cat`.

</details>

## How do you convert R5 code to R6?

R6 is a small package that gives you the same reference-semantics OOP with cleaner syntax, faster dispatch, and proper private fields. Translation is mechanical once you know the four substitutions: drop `setRefClass()` for `R6Class()`, move `fields` into `public`, replace every `<<-` with `self$`, and swap `callSuper()` for `super$initialize()`.

![R5 to R6 migration map](screenshots/R5-Reference-Classes-r5-vs-r6-flow.webp)
*Figure 1: Mechanical mapping from R5's setRefClass() to R6's R6Class().*

Here's the same `Person` class written in R6 alongside its R5 counterpart, so the substitutions are obvious side by side.

```r
# R5 version (for comparison only — commented out)
# Person <- setRefClass("Person",
#   fields  = list(name = "character", age = "numeric"),
#   methods = list(
#     greet = function() cat("Hi, I'm", name, "\n"),
#     have_birthday = function() age <<- age + 1
#   )
# )

# R6 equivalent — runnable
library(R6)

PersonR6 <- R6Class("PersonR6",
  public = list(
    name = NULL,
    age  = NULL,
    initialize = function(name, age) {
      self$name <- name
      self$age  <- age
    },
    greet = function() {
      cat("Hi, I'm", self$name, "\n")
    },
    have_birthday = function() {
      self$age <- self$age + 1
    }
  )
)

alice_r6 <- PersonR6$new("Alice", 30)
alice_r6$greet()
#> Hi, I'm Alice
alice_r6$have_birthday()
alice_r6$age
#> [1] 31
```

The behaviour is identical — what changed is only the surface syntax. `self$age` is more verbose than `age <<-`, but it removes the entire class of "I forgot the second arrow" silent bugs.

| R5 syntax | R6 syntax |
|---|---|
| `setRefClass("Name", fields = ..., methods = ...)` | `R6Class("Name", public = ...)` |
| `field <<- value` | `self$field <- value` |
| `contains = "Parent"` | `inherit = Parent` |
| `callSuper(...)` | `super$initialize(...)` |
| `obj$copy()` | `obj$clone()` |

[TIP]
**Convert R5 code one class at a time.** Translate, run your tests, commit. The substitutions are mechanical but typos are easy — small steps make any breakage trivial to find.

**Try it:** Convert this R5 `Greeter` to R6 as `ex_GreeterR6`.

```r
# R5 original (do NOT change this — write the R6 version below):
# Greeter <- setRefClass("Greeter",
#   fields  = list(who = "character"),
#   methods = list(
#     initialize = function(who) { who <<- who },
#     hello = function() { cat("Hello,", who, "\n") }
#   )
# )

# Try it: write ex_GreeterR6 in R6
ex_GreeterR6 <- R6Class("ex_GreeterR6",
  public = list(
    # your code here
  )
)

ex_g <- ex_GreeterR6$new("Selva")
ex_g$hello()
#> Expected: Hello, Selva
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_GreeterR6 <- R6Class("ex_GreeterR6",
  public = list(
    who = NULL,
    initialize = function(who) {
      self$who <- who
    },
    hello = function() {
      cat("Hello,", self$who, "\n")
    }
  )
)

ex_g <- ex_GreeterR6$new("Selva")
ex_g$hello()
#> Hello, Selva
```

**Explanation:** Every R5 field becomes a `NULL` slot in `public`. Every `<<-` becomes `self$`. Everything else stays the same.

</details>

## Practice Exercises

### Exercise 1: A BankAccount class in R5

Build an R5 `BankAccount` class with:

- A numeric `balance` field that defaults to 0
- A `deposit(amount)` method that adds to the balance
- A `withdraw(amount)` method that refuses overdrafts (prints a message, leaves the balance unchanged)
- A `show_balance()` method that prints the current balance

Save the instance to `my_account`. Test by depositing 100, withdrawing 30, then trying to withdraw 1000.

```r
# Exercise 1: build an R5 BankAccount
BankAccount <- setRefClass("BankAccount",
  fields  = list(
    # your fields here
  ),
  methods = list(
    # your methods here
  )
)

my_account <- BankAccount$new()
my_account$deposit(100)
my_account$withdraw(30)
my_account$withdraw(1000)
my_account$show_balance()
```

<details>
<summary>Click to reveal solution</summary>

```r
BankAccount <- setRefClass("BankAccount",
  fields  = list(balance = "numeric"),
  methods = list(
    initialize = function(balance = 0) {
      balance <<- balance
    },
    deposit = function(amount) {
      balance <<- balance + amount
    },
    withdraw = function(amount) {
      if (amount > balance) {
        cat("Insufficient funds. Balance unchanged.\n")
      } else {
        balance <<- balance - amount
      }
    },
    show_balance = function() {
      cat("Balance:", balance, "\n")
    }
  )
)

my_account <- BankAccount$new()
my_account$deposit(100)
my_account$withdraw(30)
my_account$withdraw(1000)
#> Insufficient funds. Balance unchanged.
my_account$show_balance()
#> Balance: 70
```

**Explanation:** Every state change uses `<<-`. The overdraft branch returns silently after printing instead of throwing — keeps the test clean and the balance untouched.

</details>

### Exercise 2: Convert BankAccount to R6 and add a SavingsAccount subclass

Translate the `BankAccount` class to R6 as `BankAccountR6`. Then create `SavingsAccount` that inherits from it and adds an `add_interest(rate)` method that increases the balance by `balance * rate`. Test by creating `my_savings` with a starting balance of 1000 and applying a 5% interest rate.

```r
# Exercise 2: R6 version + SavingsAccount subclass
library(R6)

BankAccountR6 <- R6Class("BankAccountR6",
  public = list(
    # your code here
  )
)

SavingsAccount <- R6Class("SavingsAccount",
  inherit = BankAccountR6,
  public  = list(
    # your code here
  )
)

my_savings <- SavingsAccount$new(1000)
my_savings$add_interest(0.05)
my_savings$show_balance()
#> Expected: Balance: 1050
```

<details>
<summary>Click to reveal solution</summary>

```r
library(R6)

BankAccountR6 <- R6Class("BankAccountR6",
  public = list(
    balance = NULL,
    initialize = function(balance = 0) {
      self$balance <- balance
    },
    deposit = function(amount) {
      self$balance <- self$balance + amount
    },
    withdraw = function(amount) {
      if (amount > self$balance) {
        cat("Insufficient funds. Balance unchanged.\n")
      } else {
        self$balance <- self$balance - amount
      }
    },
    show_balance = function() {
      cat("Balance:", self$balance, "\n")
    }
  )
)

SavingsAccount <- R6Class("SavingsAccount",
  inherit = BankAccountR6,
  public  = list(
    add_interest = function(rate) {
      self$balance <- self$balance + self$balance * rate
    }
  )
)

my_savings <- SavingsAccount$new(1000)
my_savings$add_interest(0.05)
my_savings$show_balance()
#> Balance: 1050
```

**Explanation:** R6 inheritance uses `inherit = BankAccountR6`. The subclass automatically picks up `deposit`, `withdraw`, and `show_balance` — we only add the new `add_interest` method.

</details>

## Complete Example: A small experiment logger

Here is everything in one place. We'll build a `Logger` class that holds a list of timestamped log entries, exposes a `log(msg)` method to append to it, a `last()` method to read the most recent message, and a `count()` method for the total. Then we'll pass the logger to a helper function and watch it accumulate entries — proof that reference semantics actually work the way the earlier sections claimed.

```r
Logger <- setRefClass("Logger",
  fields  = list(entries = "list"),
  methods = list(
    initialize = function() {
      entries <<- list()
    },
    log = function(msg) {
      entries[[length(entries) + 1]] <<- msg
    },
    last = function() {
      if (length(entries) == 0) return(NA_character_)
      entries[[length(entries)]]
    },
    count = function() {
      length(entries)
    }
  )
)

# Helper that takes a logger and writes to it
log_three <- function(logger) {
  logger$log("started")
  logger$log("processing")
  logger$log("done")
}

lg <- Logger$new()
log_three(lg)

lg$count()
#> [1] 3
lg$last()
#> [1] "done"
```

The helper function received `lg` by reference, not by copy, so its three `log()` calls landed on the same object the caller still holds. After the function returns, `lg$count()` is 3 and `lg$last()` is `"done"`. With ordinary R semantics you would have had to return the modified logger and reassign it — R5 makes that ceremony unnecessary.

## Summary

![R5 Reference Classes overview](screenshots/R5-Reference-Classes-overview-mindmap.webp)
*Figure 2: The four moving parts of R5 Reference Classes at a glance.*

| Concept | R5 syntax | Mental model |
|---|---|---|
| Define a class | `setRefClass("Name", fields = ..., methods = ...)` | Schema for a stateful object |
| Update a field inside a method | `field <<- value` | `<<-` walks up to the field's scope |
| Share an instance | `b <- a` | Alias, not copy — both point at the same object |
| Make an independent copy | `a$copy()` | Snapshot of the current state |
| Inherit from a parent | `contains = "Parent"` + `callSuper(...)` | Parent constructor runs first, then child |
| Migrate to R6 | `R6Class(..., public = list(...))` + `self$field` | Same semantics, cleaner syntax |

R5 is worth knowing because you will meet it in legacy packages — Bioconductor, older shiny internals, and several network-analysis libraries still ship classes built with `setRefClass()`. For new code, reach for R6 instead: faster, more explicit, and free of the `<<-` silent-bug trap.

## References

1. R Core Team — `?setRefClass` (base R `methods` package). Run `?methods::setRefClass` in any R session.
2. Wickham, H. — *Advanced R*, 2nd ed. Chapter on R's OO systems. [Link](https://adv-r.hadley.nz/oo.html)
3. Chang, W. — *R6 package documentation*. [Link](https://r6.r-lib.org/)
4. R6 vignette — "Performance" comparison vs Reference Classes. [Link](https://r6.r-lib.org/articles/Performance.html)
5. Chambers, J. M. — *Software for Data Analysis: Programming with R*. Springer (2008). The reference text on R's formal class systems.
6. Bioconductor Project — *Common Bioconductor Methods and Classes* (illustrates real-world R5/S4 use). [Link](https://bioconductor.org/developers/how-to/commonMethodsAndClasses/)

## Continue Learning

- [R6 Classes in R](R6-Classes-in-R.html) — the modern replacement for R5, with cleaner syntax and proper private fields.
- [OOP in R: S3, S4, R5, R6 compared](OOP-in-R.html) — how all four R OOP systems stack up and when to pick each.
- [sloop Package in R](sloop-Package-in-R.html) — inspect any R object to find out which OOP system it belongs to.
