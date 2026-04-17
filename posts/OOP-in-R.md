---
title: "R OOP Systems Explained: S3, S4, R5, R6, Pick the Right One in 3 Questions"
slug: "OOP-in-R"
description: "R has four OOP systems with very different trade-offs. Answer 3 questions to pick the right one, S3, S4, R5, or R6, and start building confidently."
keywords: "R OOP, R object oriented programming, S3 class R, S4 class R, R6 class R, R5 reference class, R OOP comparison, S3 vs S4 vs R6, OOP in R, R class system"
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.1"
post_type: "C"
sidebar_section: "Advanced R"
sidebar_title: "OOP in R: S3/S4/R6"
sidebar_order: 10
auto_link_terms: "R OOP|OOP in R|S3 class|S4 class|R6 class|R5 reference class|object-oriented programming in R|R OOP systems"
auto_link_case_sensitive: false
difficulty: "Advanced"
---

# R OOP Systems Explained: S3, S4, R5, R6, Pick the Right One in 3 Questions

<p class="lead">R has four object-oriented programming systems, S3, S4, R5 (Reference Classes), and R6, each with different trade-offs around formality, mutability, and ease of use. Three questions are all you need to pick the right one for your project.</p>

## What are R's four OOP systems and why do they exist?

R grew its OOP toolkit over three decades. S3 arrived in the early 1990s as a lightweight naming convention. S4 added formal type-checked slots in R 1.4. R5 (Reference Classes) brought mutable objects in R 2.12. R6, a CRAN package, refined the mutable approach with a cleaner, lighter API. Let's see S3, the most common system, at work right now.

```r
# Create an S3 object: a simple "dog" with name and breed
dog <- list(name = "Buddy", breed = "Golden Retriever")
class(dog) <- "dog"

# Define a generic function
describe <- function(x, ...) UseMethod("describe")

# Define a method for the "dog" class
describe.dog <- function(x, ...) {
  paste(x$name, "is a", x$breed)
}

# Call it — R dispatches to describe.dog automatically
describe(dog)
#> [1] "Buddy is a Golden Retriever"

class(dog)
#> [1] "dog"
```

That's polymorphism in action: the `describe()` generic examines the object's class and routes the call to `describe.dog()`. If you created a `"cat"` class, you'd write `describe.cat()` and the same `describe()` call would work on both. No `if-else` chains needed.

This is **functional OOP**, the method belongs to the generic function, not to the object. S3 and S4 both work this way. R5 and R6 take the opposite approach: **encapsulated OOP**, where methods live inside the object itself (like Python or Java). Think of it this way: functional OOP is like a restaurant where the waiter (generic) decides who handles your order based on cuisine type. Encapsulated OOP is like a food truck where the truck (object) does everything itself.

![Functional vs Encapsulated OOP in R](screenshots/OOP-in-R-functional-vs-encapsulated.webp)
*Figure 1: Functional OOP (S3/S4) dispatches methods through generics; encapsulated OOP (R5/R6) keeps methods inside objects.*

[KEY INSIGHT]
**The fundamental divide in R's OOP world is functional vs encapsulated.** S3 and S4 use functional OOP where methods belong to generic functions. R5 and R6 use encapsulated OOP where methods belong to objects. This isn't a quality difference, it's a design philosophy difference that shapes how you structure your code.

Here's a quick overview of what makes each system unique:

| System | Paradigm | Mutable? | Part of base R? | Best known for |
|--------|----------|----------|-----------------|----------------|
| S3 | Functional | No (copy-on-modify) | Yes | Simplicity, used everywhere |
| S4 | Functional | No (copy-on-modify) | Yes | Formal slots, Bioconductor |
| R5 (RC) | Encapsulated | Yes (reference) | Yes | Built-in mutable objects |
| R6 | Encapsulated | Yes (reference) | No (CRAN package) | Clean API, private fields |

**Try it:** Create an S3 `"cat"` object with `name` and `lives` fields. Write a `describe.cat()` method that returns `"<name> has <lives> lives left"`. Test it.

```r
# Try it: create an S3 cat object
ex_cat <- list(name = "Whiskers", lives = 9)
class(ex_cat) <- "cat"

describe.cat <- function(x, ...) {
  # your code here
}

# Test:
describe(ex_cat)
#> Expected: "Whiskers has 9 lives left"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cat <- list(name = "Whiskers", lives = 9)
class(ex_cat) <- "cat"

describe.cat <- function(x, ...) {
  paste(x$name, "has", x$lives, "lives left")
}

describe(ex_cat)
#> [1] "Whiskers has 9 lives left"
```

**Explanation:** The method name `describe.cat` follows the `generic.class` convention. When you call `describe(ex_cat)`, R sees that `ex_cat` has class `"cat"` and dispatches to `describe.cat()`.

</details>

## How does S3 work?

S3 is the simplest and most widely used OOP system in R. Every time you call `print()`, `summary()`, or `plot()` on an R object, S3 is working behind the scenes. There are no formal class definitions, just a naming convention.

Let's build a proper S3 class with a constructor, validation, and inheritance.

```r
# Constructor function: creates a validated "dog" object
new_dog <- function(name, breed, age) {
  if (!is.character(name)) stop("name must be a character string")
  if (!is.numeric(age) || age < 0) stop("age must be a non-negative number")

  obj <- list(name = name, breed = breed, age = age)
  class(obj) <- "dog"
  obj
}

# Print method — called automatically when you type the object name
print.dog <- function(x, ...) {
  cat(sprintf("Dog: %s (%s, %d years old)\n", x$name, x$breed, x$age))
}

# Create and print
buddy <- new_dog("Buddy", "Golden Retriever", 3)
buddy
#> Dog: Buddy (Golden Retriever, 3 years old)
```

[TIP]
**Always write a constructor function for S3 classes.** Directly setting `class(x) <- "myclass"` on an arbitrary list skips validation and makes bugs hard to trace. A constructor like `new_dog()` guarantees every object starts in a valid state.

Now let's see how S3 handles inheritance. It uses the class vector, a character vector where earlier entries take priority during method dispatch.

```r
# Puppy inherits from dog — just prepend "puppy" to the class vector
new_puppy <- function(name, breed, age, training_level = "beginner") {
  obj <- new_dog(name, breed, age)  # reuse parent constructor
  obj$training_level <- training_level
  class(obj) <- c("puppy", "dog")   # puppy first, then dog
  obj
}

# Method for puppy
describe.puppy <- function(x, ...) {
  paste(x$name, "is a puppy in", x$training_level, "training")
}

# Method dispatch in action
pup <- new_puppy("Max", "Labrador", 1)
describe(pup)
#> [1] "Max is a puppy in beginner training"

# Falls back to dog's print method (no print.puppy defined)
pup
#> Dog: Max (Labrador, 1 years old)

# Check the class hierarchy
inherits(pup, "dog")
#> [1] TRUE

class(pup)
#> [1] "puppy" "dog"
```

When you call `describe(pup)`, R looks for `describe.puppy` first. It finds it and calls it. When you call `print(pup)`, R looks for `print.puppy`, doesn't find it, and falls back to `print.dog`. That's S3 method dispatch, simple, predictable, and zero boilerplate.

[WARNING]
**S3 has no built-in type checking on fields.** Anyone can write `buddy$age <- "old"` and R won't complain. If field integrity matters, validate in every function that modifies the object, or consider S4 instead.

**Try it:** Create an S3 `"book"` class with a constructor `new_book(title, author, pages)`. Write a `print.book()` method that displays `"<title> by <author> (<pages> pages)"`. Test it with your favourite book.

```r
# Try it: build an S3 book class
new_book <- function(title, author, pages) {
  # your code here
}

print.book <- function(x, ...) {
  # your code here
}

# Test:
ex_book <- new_book("R for Data Science", "Hadley Wickham", 522)
ex_book
#> Expected: R for Data Science by Hadley Wickham (522 pages)
```

<details>
<summary>Click to reveal solution</summary>

```r
new_book <- function(title, author, pages) {
  obj <- list(title = title, author = author, pages = pages)
  class(obj) <- "book"
  obj
}

print.book <- function(x, ...) {
  cat(sprintf("%s by %s (%d pages)\n", x$title, x$author, x$pages))
}

ex_book <- new_book("R for Data Science", "Hadley Wickham", 522)
ex_book
#> R for Data Science by Hadley Wickham (522 pages)
```

**Explanation:** The constructor wraps a list, assigns the class, and returns it. `print.book()` uses `cat()` with `sprintf()` for clean formatted output.

</details>

## How does S4 add formal structure?

S4 brings formal class definitions with typed **slots** (named fields with declared types), built-in validity checks, and multiple dispatch. If S3 is a handshake agreement, S4 is a signed contract.

Let's define an S4 class with slots, a validity function, and a custom `show()` method.

```r
library(methods)

# Define an S4 class with typed slots
setClass("Animal",
  slots = list(
    name    = "character",
    species = "character",
    weight  = "numeric"
  ),
  validity = function(object) {
    if (object@weight <= 0) return("weight must be positive")
    if (nchar(object@name) == 0) return("name cannot be empty")
    TRUE
  }
)

# Custom show method (S4's version of print)
setMethod("show", "Animal", function(object) {
  cat(sprintf("%s the %s (%.1f kg)\n", object@name, object@species, object@weight))
})

# Create an object with new()
cat1 <- new("Animal", name = "Luna", species = "Cat", weight = 4.2)
cat1
#> Luna the Cat (4.2 kg)

# Access slots with @
cat1@species
#> [1] "Cat"
```

Notice the differences from S3: you declare each slot's type upfront, access fields with `@` instead of `$`, and the validity function runs automatically when the object is created.

[KEY INSIGHT]
**S4's validity function runs automatically on object creation, S3 can't do this.** If someone tries to create an Animal with negative weight, they get an error immediately, not a silent bug that surfaces three functions later.

Let's see inheritance and validity rejection in action.

```r
# Dog extends Animal with an extra slot
setClass("DogS4",
  contains = "Animal",
  slots = list(
    breed = "character"
  )
)

setMethod("show", "DogS4", function(object) {
  cat(sprintf("%s the %s (%s, %.1f kg)\n",
    object@name, object@species, object@breed, object@weight))
})

# Works fine
rex <- new("DogS4", name = "Rex", species = "Dog",
           weight = 28.5, breed = "German Shepherd")
rex
#> Rex the Dog (German Shepherd, 28.5 kg)

# Validity blocks bad data
tryCatch(
  new("Animal", name = "Ghost", species = "Dog", weight = -5),
  error = function(e) cat("Error:", conditionMessage(e), "\n")
)
#> Error: invalid class "Animal" object: weight must be positive
```

S4 inheritance uses the `contains` argument. The child class (`DogS4`) inherits all slots and the validity function from `Animal`, plus adds its own. The `@` accessor works the same for inherited slots.

[NOTE]
**S4 is the standard in Bioconductor.** If you contribute to bioinformatics or genomics packages, you'll encounter S4 everywhere. The SummarizedExperiment, GenomicRanges, and Biostrings packages all use S4 extensively.

**Try it:** Create an S4 `"Rectangle"` class with `width` and `height` slots (both numeric). Add a validity check that both must be positive. Write a generic `area()` and a method that returns `width * height`.

```r
# Try it: S4 Rectangle
setClass("Rectangle",
  slots = list(
    width  = "numeric",
    height = "numeric"
  ),
  validity = function(object) {
    # your code here
  }
)

setGeneric("area", function(shape) standardGeneric("area"))
setMethod("area", "Rectangle", function(shape) {
  # your code here
})

# Test:
ex_rect <- new("Rectangle", width = 5, height = 3)
area(ex_rect)
#> Expected: 15
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Rectangle",
  slots = list(width = "numeric", height = "numeric"),
  validity = function(object) {
    if (object@width <= 0 || object@height <= 0) return("width and height must be positive")
    TRUE
  }
)

setGeneric("area", function(shape) standardGeneric("area"))
setMethod("area", "Rectangle", function(shape) {
  shape@width * shape@height
})

ex_rect <- new("Rectangle", width = 5, height = 3)
area(ex_rect)
#> [1] 15
```

**Explanation:** The validity function checks both dimensions are positive. `setGeneric()` creates a new generic, and `setMethod()` provides the Rectangle-specific implementation.

</details>

## What are R5 reference classes?

R5, officially called **Reference Classes (RC)**, brought mutable objects to base R in version 2.12. Unlike S3 and S4 where modifying an object creates a copy, R5 objects change in place. Methods live inside the class definition, just like in Python or Java.

Let's build a mutable BankAccount to see how reference semantics work.

```r
# R5 Reference Class: methods live inside the class
BankAccount <- setRefClass("BankAccount",
  fields = list(
    owner   = "character",
    balance = "numeric"
  ),
  methods = list(
    initialize = function(owner, balance = 0) {
      owner   <<- owner
      balance <<- balance
    },
    deposit = function(amount) {
      balance <<- balance + amount
      cat(sprintf("Deposited $%.2f. Balance: $%.2f\n", amount, balance))
    },
    withdraw = function(amount) {
      if (amount > balance) {
        cat("Insufficient funds!\n")
        return(invisible(NULL))
      }
      balance <<- balance - amount
      cat(sprintf("Withdrew $%.2f. Balance: $%.2f\n", amount, balance))
    },
    show = function() {
      cat(sprintf("Account: %s | Balance: $%.2f\n", owner, balance))
    }
  )
)

acct <- BankAccount$new("Alice", 100)
acct$deposit(50)
#> Deposited $50.00. Balance: $150.00
acct$withdraw(30)
#> Withdrew $30.00. Balance: $120.00
acct
#> Account: Alice | Balance: $120.00
```

Notice how `acct$deposit(50)` changes the balance in place, no reassignment needed. The `<<-` operator modifies the field in the object's environment.

[WARNING]
**Reference semantics mean assignment does not copy.** This is the biggest gotcha for R programmers accustomed to copy-on-modify behaviour. If you assign an R5 object to a new variable, both variables point to the same object.

Watch what happens when two variables reference the same account.

```r
# The reference gotcha: both variables point to the SAME object
acct2 <- acct
acct2$deposit(1000)
#> Deposited $1000.00. Balance: $1120.00

# acct also changed — they're the same object!
acct
#> Account: Alice | Balance: $1120.00

# To get an independent copy, use $copy()
acct3 <- acct$copy()
acct3$withdraw(500)
#> Withdrew $500.00. Balance: $620.00

# Original is unchanged
acct
#> Account: Alice | Balance: $1120.00
```

This behaviour is powerful for modelling real-world entities (database connections, GUI widgets, game state) but dangerous if you forget. Always use `$copy()` when you need an independent duplicate.

**Try it:** Create an R5 `"Counter"` class with a `count` field (starts at 0), an `increment()` method that adds 1, and a `reset()` method that sets count back to 0. Verify that incrementing 5 times gives count = 5.

```r
# Try it: R5 Counter class
Counter <- setRefClass("Counter",
  fields = list(count = "numeric"),
  methods = list(
    initialize = function() {
      count <<- 0
    },
    increment = function() {
      # your code here
    },
    reset = function() {
      # your code here
    }
  )
)

# Test:
ex_ctr <- Counter$new()
for (i in 1:5) ex_ctr$increment()
ex_ctr$count
#> Expected: 5
```

<details>
<summary>Click to reveal solution</summary>

```r
Counter <- setRefClass("Counter",
  fields = list(count = "numeric"),
  methods = list(
    initialize = function() { count <<- 0 },
    increment = function() { count <<- count + 1 },
    reset = function() { count <<- 0 }
  )
)

ex_ctr <- Counter$new()
for (i in 1:5) ex_ctr$increment()
ex_ctr$count
#> [1] 5
ex_ctr$reset()
ex_ctr$count
#> [1] 0
```

**Explanation:** Each call to `increment()` modifies `count` in place using `<<-`. The `reset()` method sets it back to 0. No reassignment of the Counter object is needed.

</details>

## How does R6 improve on reference classes?

R6 is a CRAN package that provides the same mutable, encapsulated OOP as R5 but with a cleaner, more modern API. It adds **private fields** (true encapsulation), **active bindings** (computed properties), and **method chaining**, features R5 lacks or makes awkward.

```r
library(R6)

Account <- R6Class("Account",
  private = list(
    balance = NULL
  ),
  public = list(
    owner = NULL,
    initialize = function(owner, balance = 0) {
      self$owner <- owner
      private$balance <- balance
    },
    deposit = function(amount) {
      private$balance <- private$balance + amount
      cat(sprintf("Deposited $%.2f. Balance: $%.2f\n",
                  amount, private$balance))
      invisible(self)  # enables method chaining
    },
    withdraw = function(amount) {
      if (amount > private$balance) {
        cat("Insufficient funds!\n")
        return(invisible(self))
      }
      private$balance <- private$balance - amount
      cat(sprintf("Withdrew $%.2f. Balance: $%.2f\n",
                  amount, private$balance))
      invisible(self)
    },
    get_balance = function() private$balance
  ),
  active = list(
    balance_label = function() {
      sprintf("$%.2f", private$balance)
    }
  )
)

my_acct <- Account$new("Bob", 200)
my_acct$deposit(100)
#> Deposited $100.00. Balance: $300.00
my_acct$withdraw(50)
#> Withdrew $50.00. Balance: $250.00
my_acct$get_balance()
#> [1] 250

# Active binding — looks like a field, runs a function
my_acct$balance_label
#> [1] "$250.00"
```

The `private` list hides internal state. Users interact through `public` methods, which prevents accidental corruption. The `active` list creates computed properties that act like fields but recalculate on access.

[TIP]
**Use private fields and active bindings to enforce encapsulation.** Instead of exposing `$balance` directly (where anyone could set it to -9999), expose `$get_balance()` for reading and `$deposit()`/`$withdraw()` for controlled changes.

R6 also makes inheritance and method chaining clean.

```r
# SavingsAccount inherits from Account
SavingsAccount <- R6Class("SavingsAccount",
  inherit = Account,
  public = list(
    rate = NULL,
    initialize = function(owner, balance = 0, rate = 0.02) {
      super$initialize(owner, balance)
      self$rate <- rate
    },
    add_interest = function() {
      interest <- self$get_balance() * self$rate
      self$deposit(interest)
      invisible(self)
    }
  )
)

# Method chaining: deposit, add interest, withdraw — in one line
savings <- SavingsAccount$new("Carol", 1000, rate = 0.05)
savings$deposit(500)$add_interest()$withdraw(75)
#> Deposited $500.00. Balance: $1500.00
#> Deposited $75.00. Balance: $1575.00
#> Withdrew $75.00. Balance: $1500.00
```

Method chaining works because each method returns `invisible(self)`. This lets you string operations together like a pipeline, familiar if you've used Python's fluent interfaces or JavaScript's jQuery.

[KEY INSIGHT]
**If you come from Python, Java, or JavaScript, R6 will feel immediately familiar.** Objects own their methods, private fields enforce encapsulation, and inheritance uses a single `inherit` argument. R6 bridges the gap between R's functional roots and mainstream OOP conventions.

**Try it:** Create an R6 `"Logger"` class with a private `messages` field (list), a public `log(msg)` method that appends to messages, and a public `show_all()` method that prints all messages. Test it by logging 3 messages.

```r
# Try it: R6 Logger
Logger <- R6Class("Logger",
  private = list(
    messages = NULL
  ),
  public = list(
    initialize = function() {
      private$messages <- list()
    },
    log = function(msg) {
      # your code here
    },
    show_all = function() {
      # your code here
    }
  )
)

# Test:
ex_log <- Logger$new()
ex_log$log("Started")
ex_log$log("Processing")
ex_log$log("Done")
ex_log$show_all()
#> Expected: prints all 3 messages
```

<details>
<summary>Click to reveal solution</summary>

```r
Logger <- R6Class("Logger",
  private = list(messages = NULL),
  public = list(
    initialize = function() { private$messages <- list() },
    log = function(msg) {
      private$messages <- c(private$messages, list(msg))
      invisible(self)
    },
    show_all = function() {
      for (m in private$messages) cat(m, "\n")
    }
  )
)

ex_log <- Logger$new()
ex_log$log("Started")
ex_log$log("Processing")
ex_log$log("Done")
ex_log$show_all()
#> Started
#> Processing
#> Done
```

**Explanation:** `log()` appends to the private list using `c()`. `show_all()` iterates and prints. The private field keeps the raw message list hidden from external access.

</details>

## Which OOP system should you choose?

Here's the decision framework promised in the title. Three binary questions, four possible answers.

**Question 1: Does your object need to modify itself in place (mutable state)?**

Think database connections, GUI widgets, caches, game characters with changing HP. If yes, you need reference semantics, go to Question 2b. If no (most data analysis tasks), go to Question 2a.

**Question 2a: Do you need formal type checking and multiple dispatch?**

If you're building a large package with many interrelated classes (like Bioconductor), S4's typed slots and validity functions catch bugs early. If you just need quick, flexible dispatch for a few classes, S3 is the pragmatic choice.

- **No** → **S3** (simple, universal, covers 90% of use cases)
- **Yes** → **S4** (formal contracts, Bioconductor standard)

**Question 2b: Can your project depend on an external package?**

R6 is a CRAN package, lightweight and with zero compiled code, but still a dependency. R5 is built into base R with no extra installs.

- **Yes** → **R6** (cleaner API, private fields, active bindings)
- **No** → **R5 / Reference Classes** (base R only, no external dependencies)

![Pick Your R OOP System in 3 Questions](screenshots/OOP-in-R-decision-flowchart.webp)
*Figure 2: Three yes/no questions lead you to the right OOP system for your project.*

Here's when real-world packages use each system:

| System | Best for | Real packages | Avoid when |
|--------|----------|---------------|------------|
| S3 | Quick classes, analysis scripts, most packages | ggplot2, dplyr, base R | You need type safety or mutable state |
| S4 | Large-scale package systems, bioinformatics | GenomicRanges, Matrix, SummarizedExperiment | Small projects where formality adds friction |
| R5 | Mutable objects in base-R-only environments | Some internal R packages | You want private fields or a modern API |
| R6 | Stateful objects, Shiny modules, APIs | Shiny, plumber, R6-based frameworks | Your package can't take any dependency |

Let's see how each system handles the same tiny problem, a 2D point with x and y coordinates.

```r
# S3 Point
new_point_s3 <- function(x, y) {
  structure(list(x = x, y = y), class = "point_s3")
}
print.point_s3 <- function(p, ...) cat(sprintf("(%g, %g)\n", p$x, p$y))

# S4 Point
setClass("PointS4", slots = list(x = "numeric", y = "numeric"))
setMethod("show", "PointS4", function(object) {
  cat(sprintf("(%g, %g)\n", object@x, object@y))
})

# R5 Point
PointRC <- setRefClass("PointRC",
  fields = list(x = "numeric", y = "numeric"),
  methods = list(
    show = function() cat(sprintf("(%g, %g)\n", x, y))
  )
)

# R6 Point
PointR6 <- R6Class("PointR6",
  public = list(
    x = NULL, y = NULL,
    initialize = function(x, y) {
      self$x <- x; self$y <- y
    },
    print = function() cat(sprintf("(%g, %g)\n", self$x, self$y))
  )
)

# Create and print each
new_point_s3(3, 4)
#> (3, 4)
new("PointS4", x = 3, y = 4)
#> (3, 4)
PointRC$new(x = 3, y = 4)
#> (3, 4)
PointR6$new(3, 4)
#> (3, 4)
```

Four systems, same result. The differences show up in how much ceremony each requires and what guarantees you get back.

[TIP]
**When in doubt, start with S3.** It covers 90% of R use cases with minimal boilerplate. You can always refactor to S4 (for formal validation) or R6 (for mutable state) later, the concepts transfer directly.

**Try it:** A game character has a name and HP (health points) that changes during combat. Which OOP system would you pick? Write a 1-line justification, then create the class with a `take_damage(amount)` method.

```r
# Try it: game character with mutable HP
# Which system? (hint: HP changes in place)
# Your justification: ___

# Write your class below:


# Test:
# ex_hero <- ???$new("Aria", hp = 100)
# ex_hero$take_damage(25)
# ex_hero  # should show HP = 75
```

<details>
<summary>Click to reveal solution</summary>

```r
# R6 — because HP changes in place (mutable state) and we want a clean API
Hero <- R6Class("Hero",
  public = list(
    name = NULL, hp = NULL,
    initialize = function(name, hp = 100) {
      self$name <- name
      self$hp <- hp
    },
    take_damage = function(amount) {
      self$hp <- max(0, self$hp - amount)
      cat(sprintf("%s takes %d damage! HP: %d\n",
                  self$name, amount, self$hp))
      invisible(self)
    },
    print = function() {
      cat(sprintf("Hero: %s | HP: %d\n", self$name, self$hp))
    }
  )
)

ex_hero <- Hero$new("Aria", hp = 100)
ex_hero$take_damage(25)
#> Aria takes 25 damage! HP: 75
ex_hero
#> Hero: Aria | HP: 75
```

**Explanation:** R6 is the natural choice, HP changes in place (mutable state) and the character has methods attached to it (encapsulated). S3 would require reassignment after every damage event.

</details>

## How do the four systems compare side by side?

Here's the comprehensive comparison table. Bookmark this for quick reference.

| Feature | S3 | S4 | R5 (RC) | R6 |
|---------|----|----|---------|-----|
| **Paradigm** | Functional | Functional | Encapsulated | Encapsulated |
| **Mutability** | Copy-on-modify | Copy-on-modify | Reference | Reference |
| **Type checking** | None | Formal slots | Typed fields | None (by default) |
| **Validation** | Manual | Built-in validity | Manual | Manual |
| **Private fields** | No | No | No | Yes |
| **Active bindings** | No | No | No | Yes |
| **Multiple dispatch** | No | Yes | No | No |
| **Method chaining** | No | No | Awkward | Yes |
| **Part of base R** | Yes | Yes | Yes | No (CRAN) |
| **Learning curve** | Low | High | Medium | Medium |
| **Used by** | Base R, tidyverse | Bioconductor | Rare | Shiny, plumber |

Let's see the practical difference with a full BankAccount example in all four systems, same operations, different mechanics.

```r
# --- S3 BankAccount (immutable — returns new copy) ---
new_s3_bank <- function(owner, bal = 0) {
  structure(list(owner = owner, balance = bal), class = "s3_bank")
}
deposit_s3 <- function(acct, amount) {
  acct$balance <- acct$balance + amount
  acct
}
b1 <- new_s3_bank("Alice", 100)
b1 <- deposit_s3(b1, 50)    # must reassign!
cat("S3 balance:", b1$balance, "\n")
#> S3 balance: 150

# --- S4 BankAccount (immutable — returns new copy) ---
setClass("S4Bank",
  slots = list(owner = "character", balance = "numeric"))
setGeneric("deposit_s4",
  function(acct, amount) standardGeneric("deposit_s4"))
setMethod("deposit_s4", "S4Bank", function(acct, amount) {
  acct@balance <- acct@balance + amount
  acct
})
b2 <- new("S4Bank", owner = "Alice", balance = 100)
b2 <- deposit_s4(b2, 50)    # must reassign!
cat("S4 balance:", b2@balance, "\n")
#> S4 balance: 150

# --- R5 BankAccount (mutable — changes in place) ---
R5Bank <- setRefClass("R5Bank",
  fields = list(owner = "character", balance = "numeric"),
  methods = list(
    deposit_r5 = function(amount) { balance <<- balance + amount }
  )
)
b3 <- R5Bank$new(owner = "Alice", balance = 100)
b3$deposit_r5(50)            # no reassignment needed
cat("R5 balance:", b3$balance, "\n")
#> R5 balance: 150

# --- R6 BankAccount (mutable — changes in place) ---
R6Bank <- R6Class("R6Bank",
  public = list(
    owner = NULL, balance = NULL,
    initialize = function(owner, balance = 0) {
      self$owner <- owner; self$balance <- balance
    },
    deposit_r6 = function(amount) {
      self$balance <- self$balance + amount
      invisible(self)
    }
  )
)
b4 <- R6Bank$new("Alice", 100)
b4$deposit_r6(50)            # no reassignment needed
cat("R6 balance:", b4$balance, "\n")
#> R6 balance: 150
```

The key takeaway: S3 and S4 require `b <- deposit(b, amount)`, you reassign the modified copy. R5 and R6 modify in place, `b$deposit(amount)` and the object updates. Neither approach is "better", they serve different design needs.

[NOTE]
**S7 is an emerging OOP system** that unifies the best ideas from S3 and S4, S3's simplicity with S4's type safety. It's being developed by the R Consortium and may eventually become part of base R. For now, the four systems above cover all production use cases.

**Try it:** Look at the comparison table above. For each scenario, name the best system: (a) a quick analysis script that needs a custom print method, (b) a Bioconductor package with 20 interrelated classes, (c) a Shiny app with a stateful shopping cart.

```r
# Try it: match scenario to system
# (a) Quick analysis script, custom print: ____
# (b) Bioconductor package, 20 classes:    ____
# (c) Shiny app, stateful cart:            ____

# No code needed — fill in your answers, then check below.
```

<details>
<summary>Click to reveal solution</summary>

**(a) S3**, minimal boilerplate, just need a `print.myclass()` method. No formal structure needed for a script.

**(b) S4**, formal slots, validity functions, and multiple dispatch keep 20 interrelated classes consistent. Bioconductor mandates S4.

**(c) R6**, the shopping cart needs mutable state (items change in place) and private fields protect internal state from accidental modification in Shiny's reactive environment.

</details>

## Practice Exercises

### Exercise 1: Build a TodoList with R6

Create an R6 `"TodoList"` class where each task has a name and a `done` status (logical). Implement `add_task(name)` (adds a task, initially not done), `complete_task(name)` (marks a task as done), and `show()` (prints all tasks with `[x]` or `[ ]` markers).

```r
# Exercise: R6 TodoList
# Hint: store tasks as a data.frame with name and done columns

TodoList <- R6Class("TodoList",
  # Write your class here
)

# Test:
# my_todos <- TodoList$new()
# my_todos$add_task("Learn S3")
# my_todos$add_task("Learn R6")
# my_todos$complete_task("Learn S3")
# my_todos$show()
#> [x] Learn S3
#> [ ] Learn R6
```

<details>
<summary>Click to reveal solution</summary>

```r
TodoList <- R6Class("TodoList",
  private = list(
    tasks = NULL
  ),
  public = list(
    initialize = function() {
      private$tasks <- data.frame(
        name = character(), done = logical(),
        stringsAsFactors = FALSE)
    },
    add_task = function(name) {
      private$tasks <- rbind(private$tasks,
        data.frame(name = name, done = FALSE,
                   stringsAsFactors = FALSE))
      invisible(self)
    },
    complete_task = function(name) {
      idx <- which(private$tasks$name == name)
      if (length(idx) == 0) cat("Task not found:", name, "\n")
      else private$tasks$done[idx] <- TRUE
      invisible(self)
    },
    show = function() {
      for (i in seq_len(nrow(private$tasks))) {
        mark <- if (private$tasks$done[i]) "[x]" else "[ ]"
        cat(mark, private$tasks$name[i], "\n")
      }
    }
  )
)

my_todos <- TodoList$new()
my_todos$add_task("Learn S3")
my_todos$add_task("Learn R6")
my_todos$complete_task("Learn S3")
my_todos$show()
#> [x] Learn S3
#> [ ] Learn R6
```

**Explanation:** Tasks are stored in a private data.frame. `complete_task()` finds the row by name and sets `done` to `TRUE`. The `show()` method iterates rows and prints status markers.

</details>

### Exercise 2: S4 Shape hierarchy with validation

Create an S4 class hierarchy: `Shape` (abstract) → `Circle` (radius slot) and `Rect` (width, height slots). Write `area()` and `perimeter()` generics with methods for both. Include validity checks that all dimensions must be positive.

```r
# Exercise: S4 Shape hierarchy
# Hint: use setClass with contains for inheritance
# Define area and perimeter generics, then methods for each

# Write your classes and methods here


# Test:
# my_circle <- new("Circle", radius = 5)
# area(my_circle)         # ~78.54
# perimeter(my_circle)    # ~31.42
# my_rect <- new("Rect", width = 4, height = 6)
# area(my_rect)           # 24
# perimeter(my_rect)      # 20
```

<details>
<summary>Click to reveal solution</summary>

```r
setClass("Shape")

setClass("Circle",
  contains = "Shape",
  slots = list(radius = "numeric"),
  validity = function(object) {
    if (object@radius <= 0) return("radius must be positive")
    TRUE
  }
)

setClass("Rect",
  contains = "Shape",
  slots = list(width = "numeric", height = "numeric"),
  validity = function(object) {
    if (object@width <= 0 || object@height <= 0) {
      return("dimensions must be positive")
    }
    TRUE
  }
)

setGeneric("area", function(shape) standardGeneric("area"))
setGeneric("perimeter", function(shape) standardGeneric("perimeter"))

setMethod("area", "Circle",
  function(shape) pi * shape@radius^2)
setMethod("area", "Rect",
  function(shape) shape@width * shape@height)
setMethod("perimeter", "Circle",
  function(shape) 2 * pi * shape@radius)
setMethod("perimeter", "Rect",
  function(shape) 2 * (shape@width + shape@height))

my_circle <- new("Circle", radius = 5)
cat("Circle area:", area(my_circle), "\n")
#> Circle area: 78.53982
cat("Circle perimeter:", perimeter(my_circle), "\n")
#> Circle perimeter: 31.41593

my_rect <- new("Rect", width = 4, height = 6)
cat("Rect area:", area(my_rect), "\n")
#> Rect area: 24
cat("Rect perimeter:", perimeter(my_rect), "\n")
#> Rect perimeter: 20
```

**Explanation:** `Shape` is an abstract parent (no slots). `Circle` and `Rect` both `contain` it. The `area()` and `perimeter()` generics dispatch to class-specific methods. Validity blocks invalid dimensions at creation time.

</details>

### Exercise 3: Stack in S3 vs R6

Implement a `Stack` data structure (push, pop, peek, size) in **both** S3 and R6. Compare how mutable vs immutable state changes the API.

```r
# Exercise: Stack in S3 and R6
# S3 version: push/pop return a new stack (must reassign)
# R6 version: push/pop modify in place

# Hint for S3: store items in a list, return the modified stack
# Hint for R6: use private$items, return invisible(self)

# Write both versions, then test:
# S3 test:
# s <- new_stack_s3()
# s <- push_s3(s, 10); s <- push_s3(s, 20)
# peek_s3(s)   # 20
# s <- pop_s3(s)
# peek_s3(s)   # 10

# R6 test:
# s <- StackR6$new()
# s$push(10)$push(20)
# s$peek()     # 20
# s$pop(); s$peek()  # 10
```

<details>
<summary>Click to reveal solution</summary>

```r
# --- S3 Stack (immutable) ---
new_stack_s3 <- function() {
  structure(list(items = list()), class = "stack_s3")
}
push_s3 <- function(stack, value) {
  stack$items <- c(stack$items, list(value))
  stack
}
pop_s3 <- function(stack) {
  n <- length(stack$items)
  if (n == 0) stop("Stack is empty")
  stack$items <- stack$items[-n]
  stack
}
peek_s3 <- function(stack) {
  n <- length(stack$items)
  if (n == 0) stop("Stack is empty")
  stack$items[[n]]
}

s1 <- new_stack_s3()
s1 <- push_s3(s1, 10)
s1 <- push_s3(s1, 20)
cat("S3 peek:", peek_s3(s1), "\n")
#> S3 peek: 20
s1 <- pop_s3(s1)
cat("S3 peek after pop:", peek_s3(s1), "\n")
#> S3 peek after pop: 10

# --- R6 Stack (mutable) ---
StackR6 <- R6Class("StackR6",
  private = list(items = NULL),
  public = list(
    initialize = function() { private$items <- list() },
    push = function(value) {
      private$items <- c(private$items, list(value))
      invisible(self)
    },
    pop = function() {
      n <- length(private$items)
      if (n == 0) stop("Stack is empty")
      private$items <- private$items[-n]
      invisible(self)
    },
    peek = function() {
      n <- length(private$items)
      if (n == 0) stop("Stack is empty")
      private$items[[n]]
    },
    size = function() length(private$items)
  )
)

s2 <- StackR6$new()
s2$push(10)$push(20)
cat("R6 peek:", s2$peek(), "\n")
#> R6 peek: 20
s2$pop()
cat("R6 peek after pop:", s2$peek(), "\n")
#> R6 peek after pop: 10
```

**Explanation:** The S3 version requires `s <- push_s3(s, value)`, you must reassign because it returns a modified copy. The R6 version uses `s$push(value)`, the object changes in place. R6 also enables method chaining with `$push(10)$push(20)`. This is exactly the kind of task where mutability makes the API cleaner.

</details>

## Putting It All Together

Let's build a small **Library system** that combines S3 and R6, proving that different OOP systems can coexist in one project. Books are simple data containers (S3), while the Library manages a mutable collection (R6).

```r
# S3 book objects — immutable data records
new_lib_book <- function(title, author, year) {
  structure(list(title = title, author = author, year = year),
            class = "lib_book")
}
print.lib_book <- function(x, ...) {
  cat(sprintf('"%s" by %s (%d)\n', x$title, x$author, x$year))
}

# R6 Library — mutable collection with methods
LibraryR6 <- R6Class("LibraryR6",
  private = list(
    books = NULL
  ),
  public = list(
    name = NULL,
    initialize = function(name) {
      self$name <- name
      private$books <- list()
    },
    add_book = function(book) {
      if (!inherits(book, "lib_book")) stop("Must be a lib_book")
      private$books <- c(private$books, list(book))
      cat(sprintf("Added: %s\n", book$title))
      invisible(self)
    },
    search = function(query) {
      matches <- Filter(
        function(b) grepl(query, b$title, ignore.case = TRUE),
        private$books)
      if (length(matches) == 0) {
        cat("No matches found.\n")
      } else {
        cat(sprintf("Found %d match(es):\n", length(matches)))
        for (b in matches) print(b)
      }
      invisible(self)
    },
    list_all = function() {
      cat(sprintf("=== %s: %d books ===\n",
                  self$name, length(private$books)))
      for (b in private$books) print(b)
      invisible(self)
    },
    count = function() length(private$books)
  )
)

# Build a library
lib <- LibraryR6$new("City Library")
lib$add_book(new_lib_book("Advanced R", "Hadley Wickham", 2019))
#> Added: Advanced R
lib$add_book(new_lib_book("R for Data Science", "Hadley Wickham", 2023))
#> Added: R for Data Science
lib$add_book(new_lib_book("The Art of R Programming", "Norman Matloff", 2011))
#> Added: The Art of R Programming

# Search and list
lib$search("data")
#> Found 1 match(es):
#> "R for Data Science" by Hadley Wickham (2023)

lib$list_all()
#> === City Library: 3 books ===
#> "Advanced R" by Hadley Wickham (2019)
#> "R for Data Science" by Hadley Wickham (2023)
#> "The Art of R Programming" by Norman Matloff (2011)

cat("Total books:", lib$count(), "\n")
#> Total books: 3
```

This is a common real-world pattern: use S3 for lightweight data records that don't need to change, and R6 for stateful managers that hold collections and enforce business rules. The `add_book()` method even validates that you're passing a proper S3 `"lib_book"` object with `inherits()`.

## Summary

Here are the key takeaways from this guide:

- **S3** is R's simplest OOP system, just a list with a class attribute and method naming conventions. Use it for 90% of your classes.
- **S4** adds formal slots, type checking, validity functions, and multiple dispatch. Use it for large package ecosystems and Bioconductor.
- **R5 (Reference Classes)** provides mutable, encapsulated objects in base R. Use it when you need mutability without external dependencies.
- **R6** improves on R5 with private fields, active bindings, and method chaining. Use it for stateful objects in modern R applications.
- **Functional vs encapsulated** is the fundamental divide: S3/S4 methods belong to generics, R5/R6 methods belong to objects.
- **Three questions** get you to the right system: (1) mutable state needed? (2) formal validation needed? (3) external dependency OK?
- Different OOP systems can coexist in one project, use each where it fits best.

![R OOP Systems at a Glance](screenshots/OOP-in-R-overview-mindmap.webp)
*Figure 3: R's four OOP systems at a glance, key traits of each.*

| System | One-line summary |
|--------|-----------------|
| S3 | Lightweight, convention-based classes, the R default |
| S4 | Formal, type-safe classes with built-in validation |
| R5 | Mutable reference objects built into base R |
| R6 | Modern mutable objects with private fields and chaining |

## References

1. Wickham, H., *Advanced R*, 2nd Edition. CRC Press (2019). Part III: Object-Oriented Programming. [Link](https://adv-r.hadley.nz/oo.html)
2. Wickham, H., *Advanced R*, 2nd Edition. Chapter 16: Trade-offs. [Link](https://adv-r.hadley.nz/oo-tradeoffs.html)
3. R Core Team, Reference Classes documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/methods/html/refClass.html)
4. Chang, W., R6: Encapsulated Object-Oriented Programming. CRAN. [Link](https://r6.r-lib.org/)
5. R Core Team, S4 Classes and Methods. [Link](https://stat.ethz.ch/R-manual/R-devel/library/methods/html/Introduction.html)
6. Wickham, H., *Advanced R*, 2nd Edition. Chapter 13: S3. [Link](https://adv-r.hadley.nz/s3.html)
7. Wickham, H., *Advanced R*, 2nd Edition. Chapter 15: S4. [Link](https://adv-r.hadley.nz/s4.html)
8. Wickham, H., *Advanced R*, 2nd Edition. Chapter 14: R6. [Link](https://adv-r.hadley.nz/r6.html)

## Continue Learning

- [S3 Classes in R](S3-Classes-in-R.html), deep dive into S3 constructors, validators, and method dispatch patterns
- [S4 Classes in R](S4-Classes-in-R.html), formal class definitions, slots, validity functions, and Bioconductor patterns
- [R6 Classes in R](R6-Classes-in-R.html), public/private methods, active bindings, inheritance, and real-world applications
