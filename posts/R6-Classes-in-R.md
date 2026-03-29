---
title: "R6 Classes in R: Reference Semantics & Mutable State Tutorial"
slug: "R6-Classes-in-R"
description: "Learn R6 classes in R with R6Class(), public/private fields, initialize(), self/private references, clone(), and reference semantics. Complete guide."
keywords: "R6 classes R, R6Class, reference semantics R, mutable state R, R6 tutorial, R OOP R6, clone R6"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.6"
post_type: "C"
auto_link_terms: "R6 classes|R6Class|reference semantics|mutable state R"
auto_link_case_sensitive: false
---

# R6 Classes in R: Reference Semantics & Mutable State Tutorial

<p class="lead"><strong>R6</strong> is R's modern OOP system with <strong>reference semantics</strong>. Unlike S3/S4 where objects are copied on modification, R6 objects are <strong>mutable</strong> -- modifying an object changes it in place, just like objects in Python or Java. This makes R6 ideal for stateful things like database connections, API clients, and game objects.</p>

R6 is provided by the `R6` package (not built into base R). It's simple to use, fast, and increasingly popular for packages that manage state.

## Creating Your First R6 Class

Use `R6Class()` to define a class. Public fields and methods go in the `public` list.

```r
library(R6)

# Define a class
Dog <- R6Class("Dog",
  public = list(
    name = NULL,
    breed = NULL,
    energy = 100,

    initialize = function(name, breed) {
      self$name <- name
      self$breed <- breed
    },

    bark = function() {
      cat(self$name, "says: Woof!\n")
      self$energy <- self$energy - 10
    },

    status = function() {
      cat(self$name, "(", self$breed, ") - Energy:", self$energy, "\n")
    }
  )
)

# Create an instance with $new()
rex <- Dog$new("Rex", "Labrador")
rex$status()
rex$bark()
rex$bark()
rex$status()
```

Key differences from S3/S4:
- Methods use `self$` to access fields and other methods
- Objects are created with `ClassName$new()`
- No `@` or `$` dispatch magic -- everything is explicit

## Reference Semantics: The Big Difference

In S3/S4, `y <- x` copies the object. In R6, `y <- x` creates a **reference** -- both variables point to the same object.

```r
library(R6)

Counter <- R6Class("Counter",
  public = list(
    count = 0,
    increment = function() {
      self$count <- self$count + 1
    }
  )
)

# Reference semantics: both point to the SAME object
c1 <- Counter$new()
c2 <- c1  # NOT a copy!

c1$increment()
c1$increment()

cat("c1 count:", c1$count, "\n")  # 2
cat("c2 count:", c2$count, "\n")  # Also 2! Same object!

# To get a real copy, use $clone()
c3 <- c1$clone()
c1$increment()

cat("\nAfter cloning and incrementing c1:\n")
cat("c1 count:", c1$count, "\n")  # 3
cat("c3 count:", c3$count, "\n")  # Still 2 -- independent copy
```

This is fundamentally different from how most R objects work. Always use `$clone()` when you need an independent copy.

## Public vs Private

Private fields and methods are only accessible from within the class. Use `private$` to access them.

```r
library(R6)

BankAccount <- R6Class("BankAccount",
  public = list(
    owner = NULL,

    initialize = function(owner, balance = 0) {
      self$owner <- owner
      private$balance <- balance
    },

    deposit = function(amount) {
      if (amount <= 0) stop("Amount must be positive")
      private$balance <- private$balance + amount
      private$log_transaction("deposit", amount)
      invisible(self)
    },

    withdraw = function(amount) {
      if (amount <= 0) stop("Amount must be positive")
      if (amount > private$balance) stop("Insufficient funds")
      private$balance <- private$balance - amount
      private$log_transaction("withdrawal", amount)
      invisible(self)
    },

    get_balance = function() {
      private$balance
    },

    print = function(...) {
      cat("Account:", self$owner, "| Balance:", private$balance, "\n")
    }
  ),

  private = list(
    balance = 0,

    log_transaction = function(type, amount) {
      cat("  [LOG]", type, "of", amount, "| New balance:", private$balance, "\n")
    }
  )
)

acct <- BankAccount$new("Alice", balance = 1000)
acct$deposit(500)
acct$withdraw(200)
acct$print()

# Cannot access private fields from outside
tryCatch(
  acct$balance,
  error = function(e) cat("Cannot access private field directly\n")
)
cat("Balance via getter:", acct$get_balance(), "\n")
```

## The initialize() Method

`initialize()` is the constructor. It runs when you call `$new()`. Use it to validate inputs and set up the object.

```r
library(R6)

Person <- R6Class("Person",
  public = list(
    name = NULL,
    age = NULL,

    initialize = function(name, age) {
      stopifnot(is.character(name), length(name) == 1)
      stopifnot(is.numeric(age), age >= 0, age <= 150)
      self$name <- name
      self$age <- age
      cat("Created person:", name, "age", age, "\n")
    },

    greet = function() {
      cat("Hi, I'm", self$name, "and I'm", self$age, "years old.\n")
    }
  )
)

p <- Person$new("Alice", 30)
p$greet()

# Validation catches bad input
tryCatch(
  Person$new("Bob", -5),
  error = function(e) cat("Error:", e$message, "\n")
)
```

## Method Chaining with invisible(self)

Return `invisible(self)` from methods to enable fluent method chaining.

```r
library(R6)

QueryBuilder <- R6Class("QueryBuilder",
  public = list(
    initialize = function(table) {
      private$table <- table
      private$conditions <- character()
      private$limit_val <- NULL
    },

    where = function(condition) {
      private$conditions <- c(private$conditions, condition)
      invisible(self)
    },

    limit = function(n) {
      private$limit_val <- n
      invisible(self)
    },

    build = function() {
      sql <- paste("SELECT * FROM", private$table)
      if (length(private$conditions) > 0) {
        sql <- paste(sql, "WHERE", paste(private$conditions, collapse = " AND "))
      }
      if (!is.null(private$limit_val)) {
        sql <- paste(sql, "LIMIT", private$limit_val)
      }
      sql
    }
  ),

  private = list(
    table = NULL,
    conditions = NULL,
    limit_val = NULL
  )
)

# Method chaining!
query <- QueryBuilder$new("users")$
  where("age > 18")$
  where("active = TRUE")$
  limit(10)$
  build()

cat(query, "\n")
```

## Deep Cloning

By default, `$clone()` does a shallow clone. If your object contains other R6 objects, you need `$clone(deep = TRUE)` and a `deep_clone` private method.

```r
library(R6)

Engine <- R6Class("Engine",
  public = list(
    horsepower = NULL,
    initialize = function(hp) self$horsepower <- hp
  )
)

Car <- R6Class("Car",
  public = list(
    model = NULL,
    engine = NULL,
    initialize = function(model, hp) {
      self$model <- model
      self$engine <- Engine$new(hp)
    }
  ),
  private = list(
    deep_clone = function(name, value) {
      if (is.environment(value) && !is.null(value$clone)) {
        value$clone(deep = TRUE)
      } else {
        value
      }
    }
  )
)

car1 <- Car$new("Sedan", 200)
car2 <- car1$clone(deep = TRUE)

# Modify car2's engine -- car1 is unaffected
car2$engine$horsepower <- 300

cat("car1 HP:", car1$engine$horsepower, "\n")  # 200
cat("car2 HP:", car2$engine$horsepower, "\n")  # 300
```

## Summary Table

| Feature | Syntax | Description |
|---------|--------|-------------|
| Define class | `R6Class("Name", public=list(...))` | Create a new R6 class |
| Create instance | `ClassName$new(...)` | Instantiate an object |
| Public field | `self$field` | Access within methods |
| Private field | `private$field` | Accessible only inside the class |
| Constructor | `initialize = function(...)` | Runs on `$new()` |
| Method chaining | `invisible(self)` | Return self for chaining |
| Clone | `obj$clone()` | Shallow copy |
| Deep clone | `obj$clone(deep = TRUE)` | Deep copy (needs `deep_clone`) |
| Reference semantics | `y <- x` | Both point to same object |
| Print | `print = function(...)` | Custom display |

## Practice Exercises

**Exercise 1:** Create a `Stack` R6 class with `push(value)`, `pop()`, and `peek()` methods. Use a private list to store the elements.

<details><summary>Click to reveal solution</summary>

```r
library(R6)

Stack <- R6Class("Stack",
  public = list(
    initialize = function() {
      private$elements <- list()
    },
    push = function(value) {
      private$elements <- c(private$elements, list(value))
      invisible(self)
    },
    pop = function() {
      if (self$size() == 0) stop("Stack is empty")
      val <- private$elements[[self$size()]]
      private$elements <- private$elements[-self$size()]
      val
    },
    peek = function() {
      if (self$size() == 0) stop("Stack is empty")
      private$elements[[self$size()]]
    },
    size = function() length(private$elements)
  ),
  private = list(
    elements = NULL
  )
)

s <- Stack$new()
s$push(10)$push(20)$push(30)
cat("Peek:", s$peek(), "\n")
cat("Pop:", s$pop(), "\n")
cat("Size:", s$size(), "\n")
```

</details>

**Exercise 2:** Create a `Timer` class that tracks elapsed time. It should have `start()`, `stop()`, and `elapsed()` methods. Use `Sys.time()` internally.

<details><summary>Click to reveal solution</summary>

```r
library(R6)

Timer <- R6Class("Timer",
  public = list(
    start = function() {
      private$start_time <- Sys.time()
      private$end_time <- NULL
      cat("Timer started.\n")
      invisible(self)
    },
    stop = function() {
      if (is.null(private$start_time)) stop("Timer not started")
      private$end_time <- Sys.time()
      cat("Timer stopped.\n")
      invisible(self)
    },
    elapsed = function() {
      if (is.null(private$start_time)) return(0)
      end <- if (is.null(private$end_time)) Sys.time() else private$end_time
      as.numeric(difftime(end, private$start_time, units = "secs"))
    }
  ),
  private = list(
    start_time = NULL,
    end_time = NULL
  )
)

t <- Timer$new()
t$start()
Sys.sleep(0.1)
cat("Elapsed:", t$elapsed(), "seconds\n")
t$stop()
cat("Final:", t$elapsed(), "seconds\n")
```

</details>

## FAQ

**Q: Why use R6 instead of S3 or S4?**
Use R6 when you need mutable state (objects that change in place), encapsulation (private fields), or when coming from Python/Java and want familiar OOP. R6 is also faster than R5 (Reference Classes).

**Q: Is R6 part of base R?**
No. R6 is a CRAN package. Install it with `install.packages("R6")`. It has zero dependencies and is very lightweight.

**Q: How do I avoid accidental reference sharing?**
Always use `$clone()` (or `$clone(deep = TRUE)` for nested R6 objects) when you want an independent copy. `y <- x` does NOT copy -- it creates a reference to the same object.

## What's Next

- [R6 Advanced: Inheritance, Private Methods & Active Bindings](R6-Advanced.html) -- Inheritance, super, active bindings, and finalize
- [OOP Design Patterns in R](OOP-Design-Patterns-in-R.html) -- Factory, strategy, and observer patterns with R6
- [R5 Reference Classes](R5-Reference-Classes.html) -- The legacy alternative to R6
