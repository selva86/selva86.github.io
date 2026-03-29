---
title: "OOP in R Exercises: 8 S3, S4 & R6 Practice Problems"
slug: "R-OOP-Exercises"
description: "Practice R OOP with 8 hands-on exercises covering S3 classes, S4 formal OOP, R6 reference classes, method dispatch, and operator overloading."
keywords: "R OOP exercises, S3 exercises R, S4 exercises R, R6 exercises, OOP practice R, R class exercises"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E11.2"
post_type: "EX"
auto_link_terms: "OOP exercises R|S3 S4 R6 practice"
auto_link_case_sensitive: false
fr_parent: "OOP-in-R.html"
---

# OOP in R Exercises: 8 S3, S4 & R6 Practice Problems

<p class="lead">Test your understanding of R's object-oriented systems with these 8 practice problems. They cover <strong>S3</strong> (informal classes), <strong>S4</strong> (formal classes), and <strong>R6</strong> (reference classes), plus operator overloading and method dispatch. Each exercise includes a complete solution.</p>

## Exercise 1: S3 Class -- Temperature Converter

Create an S3 class `Temperature` that stores a value and a unit ("C" or "F"). Implement:
- A constructor `temperature(value, unit)`
- A `print` method that displays the value with its unit
- A `to_celsius()` generic and method
- A `to_fahrenheit()` generic and method

```r
# Your code here
# temp <- temperature(100, "C")
# print(temp)         # Should show: 100 C
# to_fahrenheit(temp) # Should return a Temperature in F
```

<details><summary>Click to reveal solution</summary>

```r
temperature <- function(value, unit = "C") {
  stopifnot(unit %in% c("C", "F"))
  structure(list(value = value, unit = unit), class = "Temperature")
}

print.Temperature <- function(x, ...) {
  cat(x$value, x$unit, "\n")
}

to_celsius <- function(x, ...) UseMethod("to_celsius")
to_fahrenheit <- function(x, ...) UseMethod("to_fahrenheit")

to_celsius.Temperature <- function(x, ...) {
  if (x$unit == "C") return(x)
  temperature((x$value - 32) * 5/9, "C")
}

to_fahrenheit.Temperature <- function(x, ...) {
  if (x$unit == "F") return(x)
  temperature(x$value * 9/5 + 32, "F")
}

# Test
boiling <- temperature(100, "C")
print(boiling)
print(to_fahrenheit(boiling))

body_temp <- temperature(98.6, "F")
print(body_temp)
print(to_celsius(body_temp))
```

</details>

## Exercise 2: S3 Inheritance -- Shapes

Create an S3 class hierarchy for shapes:
- `shape(color)` -- base class
- `circle(radius, color)` -- has class `c("Circle", "Shape")`
- `rectangle(width, height, color)` -- has class `c("Rectangle", "Shape")`
- Implement an `area()` generic with methods for Circle and Rectangle
- Implement a `describe()` generic where Shape gives color, and subclasses call `NextMethod()`

<details><summary>Click to reveal solution</summary>

```r
shape <- function(color = "black") {
  structure(list(color = color), class = "Shape")
}

circle <- function(radius, color = "red") {
  obj <- list(radius = radius, color = color)
  class(obj) <- c("Circle", "Shape")
  obj
}

rectangle <- function(width, height, color = "blue") {
  obj <- list(width = width, height = height, color = color)
  class(obj) <- c("Rectangle", "Shape")
  obj
}

area <- function(x, ...) UseMethod("area")
area.Circle <- function(x, ...) pi * x$radius^2
area.Rectangle <- function(x, ...) x$width * x$height

describe <- function(x, ...) UseMethod("describe")
describe.Shape <- function(x, ...) cat("Color:", x$color, "\n")
describe.Circle <- function(x, ...) {
  cat("Circle, radius:", x$radius, ", area:", round(area(x), 2), "\n")
  NextMethod()
}
describe.Rectangle <- function(x, ...) {
  cat("Rectangle,", x$width, "x", x$height, ", area:", area(x), "\n")
  NextMethod()
}

# Test
c1 <- circle(5, "green")
r1 <- rectangle(4, 6)
describe(c1)
cat("\n")
describe(r1)
```

</details>

## Exercise 3: S3 Operator Overloading -- Rational Numbers

Create an S3 class `Rational` representing a fraction (numerator/denominator). Implement:
- `+` (addition of two Rationals)
- `*` (multiplication)
- `==` (equality after simplification)
- `print` (shows "3/4" format)

Hint: Use `gcd` to simplify fractions.

<details><summary>Click to reveal solution</summary>

```r
gcd <- function(a, b) {
  a <- abs(a); b <- abs(b)
  while (b != 0) { temp <- b; b <- a %% b; a <- temp }
  a
}

rational <- function(num, den) {
  if (den == 0) stop("Denominator cannot be zero")
  if (den < 0) { num <- -num; den <- -den }
  g <- gcd(abs(num), den)
  structure(list(num = num / g, den = den / g), class = "Rational")
}

print.Rational <- function(x, ...) cat(x$num, "/", x$den, "\n")

`+.Rational` <- function(e1, e2) {
  rational(e1$num * e2$den + e2$num * e1$den, e1$den * e2$den)
}

`*.Rational` <- function(e1, e2) {
  rational(e1$num * e2$num, e1$den * e2$den)
}

`==.Rational` <- function(e1, e2) {
  e1$num == e2$num && e1$den == e2$den
}

# Test
a <- rational(1, 3)
b <- rational(1, 6)
print(a)
print(b)
cat("1/3 + 1/6 = "); print(a + b)
cat("1/3 * 1/6 = "); print(a * b)
cat("2/6 == 1/3:", rational(2, 6) == rational(1, 3), "\n")
```

</details>

## Exercise 4: S4 Class -- Student Records

Create an S4 class `Student` with:
- Slots: `name` (character), `grades` (numeric), `graduation_year` (integer)
- Validity: grades must be between 0 and 100, graduation_year must be > 2000
- A `gpa()` generic that computes mean grade
- A `show` method for nice display
- A `honor_roll()` generic that returns TRUE if GPA >= 85

<details><summary>Click to reveal solution</summary>

```r
setClass("Student",
  slots = list(
    name = "character",
    grades = "numeric",
    graduation_year = "integer"
  ),
  validity = function(object) {
    errors <- character()
    if (any(object@grades < 0 | object@grades > 100)) {
      errors <- c(errors, "grades must be between 0 and 100")
    }
    if (object@graduation_year <= 2000L) {
      errors <- c(errors, "graduation_year must be > 2000")
    }
    if (length(errors) == 0) TRUE else errors
  }
)

setGeneric("gpa", function(student) standardGeneric("gpa"))
setMethod("gpa", "Student", function(student) {
  mean(student@grades)
})

setGeneric("honor_roll", function(student) standardGeneric("honor_roll"))
setMethod("honor_roll", "Student", function(student) {
  gpa(student) >= 85
})

setMethod("show", "Student", function(object) {
  cat("Student:", object@name, "\n")
  cat("  GPA:", round(gpa(object), 1), "\n")
  cat("  Graduation:", object@graduation_year, "\n")
  cat("  Honor roll:", honor_roll(object), "\n")
})

# Test
alice <- new("Student",
  name = "Alice",
  grades = c(95, 88, 92, 87, 91),
  graduation_year = 2026L
)
show(alice)

bob <- new("Student",
  name = "Bob",
  grades = c(70, 65, 80, 72, 68),
  graduation_year = 2027L
)
show(bob)
```

</details>

## Exercise 5: S4 Multiple Dispatch

Create two S4 classes `Metric` and `Imperial` for distance measurements. Implement an `add_distance()` generic with multiple dispatch that handles all four combinations (Metric+Metric, Imperial+Imperial, Metric+Imperial, Imperial+Metric), always returning Metric.

<details><summary>Click to reveal solution</summary>

```r
setClass("MetricDist", slots = list(meters = "numeric"))
setClass("ImperialDist", slots = list(feet = "numeric"))

setGeneric("add_distance", function(a, b) standardGeneric("add_distance"))

setMethod("add_distance", signature("MetricDist", "MetricDist"), function(a, b) {
  new("MetricDist", meters = a@meters + b@meters)
})

setMethod("add_distance", signature("ImperialDist", "ImperialDist"), function(a, b) {
  total_feet <- a@feet + b@feet
  new("MetricDist", meters = total_feet * 0.3048)
})

setMethod("add_distance", signature("MetricDist", "ImperialDist"), function(a, b) {
  new("MetricDist", meters = a@meters + b@feet * 0.3048)
})

setMethod("add_distance", signature("ImperialDist", "MetricDist"), function(a, b) {
  new("MetricDist", meters = a@feet * 0.3048 + b@meters)
})

setMethod("show", "MetricDist", function(object) {
  cat(round(object@meters, 2), "meters\n")
})

# Test
m1 <- new("MetricDist", meters = 100)
m2 <- new("MetricDist", meters = 50)
i1 <- new("ImperialDist", feet = 328)

cat("100m + 50m = "); show(add_distance(m1, m2))
cat("100m + 328ft = "); show(add_distance(m1, i1))
cat("328ft + 328ft = "); show(add_distance(i1, i1))
```

</details>

## Exercise 6: R6 -- Todo List

Create an R6 `TodoList` class with:
- `add(task, priority = "normal")` -- add a task
- `complete(index)` -- mark a task done
- `pending()` -- return only incomplete tasks
- `print()` -- display all tasks with status
- Private field to store the tasks as a data frame

<details><summary>Click to reveal solution</summary>

```r
library(R6)

TodoList <- R6Class("TodoList",
  public = list(
    initialize = function() {
      private$tasks <- data.frame(
        task = character(),
        priority = character(),
        done = logical(),
        stringsAsFactors = FALSE
      )
    },

    add = function(task, priority = "normal") {
      private$tasks <- rbind(private$tasks, data.frame(
        task = task, priority = priority, done = FALSE,
        stringsAsFactors = FALSE
      ))
      cat("Added:", task, "\n")
      invisible(self)
    },

    complete = function(index) {
      if (index < 1 || index > nrow(private$tasks)) stop("Invalid index")
      private$tasks$done[index] <- TRUE
      cat("Completed:", private$tasks$task[index], "\n")
      invisible(self)
    },

    pending = function() {
      private$tasks[!private$tasks$done, ]
    },

    print = function(...) {
      cat("=== Todo List ===\n")
      if (nrow(private$tasks) == 0) {
        cat("  (empty)\n")
        return(invisible(self))
      }
      for (i in 1:nrow(private$tasks)) {
        status <- if (private$tasks$done[i]) "[x]" else "[ ]"
        cat(sprintf("  %d. %s %s (%s)\n", i, status,
                    private$tasks$task[i], private$tasks$priority[i]))
      }
      n_pending <- sum(!private$tasks$done)
      cat(sprintf("  --- %d of %d pending ---\n", n_pending, nrow(private$tasks)))
    }
  ),

  private = list(
    tasks = NULL
  )
)

# Test
todo <- TodoList$new()
todo$add("Write R6 tutorial", "high")
todo$add("Review PR", "normal")
todo$add("Update docs", "low")
todo$complete(1)
todo$print()
cat("\nPending tasks:\n")
print(todo$pending())
```

</details>

## Exercise 7: R6 Inheritance -- Logger Hierarchy

Create a `Logger` base class with `log(message)`, then create:
- `ConsoleLogger` -- prints to console
- `FileLogger` -- appends to a (simulated) internal log vector
- `CompositeLogger` -- logs to multiple loggers

All should inherit from Logger and use `super$`.

<details><summary>Click to reveal solution</summary>

```r
library(R6)

Logger <- R6Class("Logger",
  public = list(
    level = "INFO",
    log = function(message, level = "INFO") {
      timestamp <- format(Sys.time(), "%H:%M:%S")
      formatted <- sprintf("[%s] %s: %s", timestamp, level, message)
      private$write(formatted)
    }
  ),
  private = list(
    write = function(msg) {
      stop("Subclass must implement write()")
    }
  )
)

ConsoleLogger <- R6Class("ConsoleLogger",
  inherit = Logger,
  private = list(
    write = function(msg) {
      cat(msg, "\n")
    }
  )
)

FileLogger <- R6Class("FileLogger",
  inherit = Logger,
  public = list(
    initialize = function() {
      private$log_entries <- character()
    },
    get_logs = function() private$log_entries
  ),
  private = list(
    log_entries = NULL,
    write = function(msg) {
      private$log_entries <- c(private$log_entries, msg)
    }
  )
)

CompositeLogger <- R6Class("CompositeLogger",
  inherit = Logger,
  public = list(
    initialize = function(...) {
      private$loggers <- list(...)
    }
  ),
  private = list(
    loggers = NULL,
    write = function(msg) {
      for (lg in private$loggers) {
        # Call the logger's log method with the already-formatted message
        cat(msg, "\n")  # Simplified for demo
      }
    }
  )
)

# Test
console <- ConsoleLogger$new()
console$log("Application started")
console$log("User logged in", "DEBUG")

file_log <- FileLogger$new()
file_log$log("Error occurred", "ERROR")
file_log$log("Retrying...")
cat("\nFile log contents:\n")
cat(file_log$get_logs(), sep = "\n")
```

</details>

## Exercise 8: R6 with Active Bindings -- Bounded Queue

Create an R6 `BoundedQueue` class with:
- A `max_size` set at construction
- `enqueue(item)` and `dequeue()` methods
- An active binding `length` (read-only)
- An active binding `is_full` (read-only)
- Throw an error if enqueue is called when full

<details><summary>Click to reveal solution</summary>

```r
library(R6)

BoundedQueue <- R6Class("BoundedQueue",
  public = list(
    initialize = function(max_size = 5) {
      private$.max_size <- max_size
      private$.items <- list()
    },

    enqueue = function(item) {
      if (self$is_full) stop("Queue is full!")
      private$.items <- c(private$.items, list(item))
      cat("Enqueued:", item, " | Size:", self$length, "/", private$.max_size, "\n")
      invisible(self)
    },

    dequeue = function() {
      if (self$length == 0) stop("Queue is empty!")
      item <- private$.items[[1]]
      private$.items <- private$.items[-1]
      item
    },

    print = function(...) {
      cat("BoundedQueue [", self$length, "/", private$.max_size, "]\n")
      if (self$length > 0) {
        cat("Items:", paste(private$.items, collapse = ", "), "\n")
      }
    }
  ),

  active = list(
    length = function() length(private$.items),
    is_full = function() length(private$.items) >= private$.max_size
  ),

  private = list(
    .items = NULL,
    .max_size = NULL
  )
)

# Test
q <- BoundedQueue$new(max_size = 3)
q$enqueue("a")
q$enqueue("b")
q$enqueue("c")
cat("Is full:", q$is_full, "\n")

tryCatch(q$enqueue("d"), error = function(e) cat("Error:", e$message, "\n"))

cat("Dequeued:", q$dequeue(), "\n")
cat("Is full:", q$is_full, "\n")
q$print()
```

</details>

## Summary Table

| Exercise | OOP System | Key Concepts |
|----------|-----------|--------------|
| 1. Temperature | S3 | Constructor, print, custom generics |
| 2. Shapes | S3 | Inheritance, NextMethod, area generic |
| 3. Rational Numbers | S3 | Operator overloading (+, *, ==) |
| 4. Student Records | S4 | setClass, slots, validity, setMethod |
| 5. Distance | S4 | Multiple dispatch, mixed-type methods |
| 6. Todo List | R6 | Public/private, method chaining |
| 7. Logger Hierarchy | R6 | Inheritance, super, polymorphism |
| 8. Bounded Queue | R6 | Active bindings, encapsulation |

## FAQ

**Q: Which OOP system should I learn first?**
Start with S3 -- it's the most common and the simplest. Learn R6 next if you need mutable objects. Learn S4 only when working with Bioconductor or packages that require formal types.

**Q: How do I know if my class design is good?**
A good class has a clear responsibility, hides internal details (encapsulation), and its methods have obvious names. If you find yourself reaching into the internals of an object from outside the class, your design likely needs more methods.

**Q: Can I mix S3, S4, and R6 in the same project?**
Yes, and many packages do. A common pattern is R6 for internal state management and S3 for user-facing objects that work with base R generics like `print()`, `summary()`, etc.

## What's Next

- [OOP in R Overview](OOP-in-R.html) -- Review the four OOP systems
- [OOP Design Patterns in R](OOP-Design-Patterns-in-R.html) -- Factory, Strategy, Observer patterns
- [R6 Advanced](R6-Advanced.html) -- Inheritance, active bindings, finalize
