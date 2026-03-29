---
title: "R6 Inheritance, Private Methods & Active Bindings: Advanced R6"
slug: "R6-Advanced"
description: "Advanced R6 patterns in R: inheritance with inherit, super$, private methods, active bindings, finalize for cleanup, and portable vs non-portable classes."
keywords: "R6 inheritance, R6 active bindings, R6 super, R6 finalize, R6 private methods, advanced R6 R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.7"
post_type: "C"
auto_link_terms: "R6 inheritance|active bindings|R6 advanced|R6 finalize"
auto_link_case_sensitive: false
---

# R6 Inheritance, Private Methods & Active Bindings: Advanced R6

<p class="lead">R6 supports <strong>single inheritance</strong> with <code>inherit</code>, <strong>private methods</strong> for internal logic, <strong>active bindings</strong> that look like fields but run code, and a <strong>finalize</strong> method for cleanup. These features make R6 suitable for production-grade R packages.</p>

This tutorial assumes you already know the basics of R6 (see [R6 Classes in R](R6-Classes-in-R.html)). Here we go deeper into the features that make R6 a serious OOP tool.

## Inheritance with inherit and super

Use `inherit` in `R6Class()` to create a child class. The child inherits all public and private fields/methods. Use `super$` to call parent methods.

```r
library(R6)

Animal <- R6Class("Animal",
  public = list(
    name = NULL,
    sound = NULL,

    initialize = function(name, sound) {
      self$name <- name
      self$sound <- sound
    },

    speak = function() {
      cat(self$name, "says:", self$sound, "\n")
    },

    describe = function() {
      cat("I am", self$name, "\n")
    }
  )
)

Dog <- R6Class("Dog",
  inherit = Animal,
  public = list(
    breed = NULL,

    initialize = function(name, breed) {
      super$initialize(name, sound = "Woof")  # Call parent constructor
      self$breed <- breed
    },

    # Override parent method
    describe = function() {
      super$describe()  # Call parent version
      cat("Breed:", self$breed, "\n")
    },

    fetch = function(item) {
      cat(self$name, "fetches the", item, "!\n")
    }
  )
)

rex <- Dog$new("Rex", "Golden Retriever")
rex$speak()     # Inherited from Animal
rex$describe()  # Overridden, calls super
rex$fetch("ball")  # Dog-only method
```

### Multi-Level Inheritance

```r
library(R6)

Base <- R6Class("Base",
  public = list(
    id = NULL,
    initialize = function(id) self$id <- id,
    info = function() cat("Base id:", self$id, "\n")
  )
)

Middle <- R6Class("Middle",
  inherit = Base,
  public = list(
    level = "middle",
    initialize = function(id) {
      super$initialize(id)
    },
    info = function() {
      super$info()
      cat("Level:", self$level, "\n")
    }
  )
)

Top <- R6Class("Top",
  inherit = Middle,
  public = list(
    tag = NULL,
    initialize = function(id, tag) {
      super$initialize(id)
      self$tag <- tag
    },
    info = function() {
      super$info()
      cat("Tag:", self$tag, "\n")
    }
  )
)

obj <- Top$new("A1", "production")
obj$info()
cat("Inherits from Base?", inherits(obj, "Base"), "\n")
```

## Private Methods

Private methods encapsulate internal logic that users of the class should not call directly.

```r
library(R6)

PasswordManager <- R6Class("PasswordManager",
  public = list(
    initialize = function() {
      private$passwords <- list()
    },

    add = function(site, password) {
      if (!private$is_strong(password)) {
        stop("Password too weak! Must be >= 8 chars with a digit.")
      }
      private$passwords[[site]] <- private$hash(password)
      cat("Password saved for", site, "\n")
      invisible(self)
    },

    verify = function(site, password) {
      stored <- private$passwords[[site]]
      if (is.null(stored)) {
        cat("No password stored for", site, "\n")
        return(FALSE)
      }
      result <- stored == private$hash(password)
      cat("Verification for", site, ":", if (result) "PASS" else "FAIL", "\n")
      result
    }
  ),

  private = list(
    passwords = NULL,

    is_strong = function(pw) {
      nchar(pw) >= 8 && grepl("[0-9]", pw)
    },

    hash = function(pw) {
      # Simple hash simulation (use real hashing in production!)
      paste0("hashed_", nchar(pw), "_", substr(pw, 1, 1))
    }
  )
)

pm <- PasswordManager$new()
pm$add("github", "MyPass123!")
pm$verify("github", "MyPass123!")
pm$verify("github", "wrong")
```

## Active Bindings

Active bindings look like fields but execute code when read or written. They are perfect for computed properties, validation on assignment, and read-only fields.

```r
library(R6)

Temperature <- R6Class("Temperature",
  public = list(
    initialize = function(celsius) {
      private$.celsius <- celsius
    }
  ),

  active = list(
    # Read and write: celsius
    celsius = function(value) {
      if (missing(value)) return(private$.celsius)
      stopifnot(is.numeric(value))
      private$.celsius <- value
    },

    # Computed property: fahrenheit (auto-converts)
    fahrenheit = function(value) {
      if (missing(value)) return(private$.celsius * 9/5 + 32)
      private$.celsius <- (value - 32) * 5/9
    },

    # Read-only property
    kelvin = function(value) {
      if (!missing(value)) stop("kelvin is read-only")
      private$.celsius + 273.15
    }
  ),

  private = list(
    .celsius = NULL
  )
)

temp <- Temperature$new(100)
cat("Celsius:", temp$celsius, "\n")
cat("Fahrenheit:", temp$fahrenheit, "\n")
cat("Kelvin:", temp$kelvin, "\n")

# Set via fahrenheit -- celsius auto-updates
temp$fahrenheit <- 32
cat("\nAfter setting fahrenheit = 32:\n")
cat("Celsius:", temp$celsius, "\n")
cat("Fahrenheit:", temp$fahrenheit, "\n")

# Read-only field
tryCatch(
  { temp$kelvin <- 300 },
  error = function(e) cat("Error:", e$message, "\n")
)
```

### Active Bindings for Validation

```r
library(R6)

Person <- R6Class("Person",
  public = list(
    initialize = function(name, age) {
      self$name <- name  # Triggers active binding validation
      self$age <- age
    }
  ),

  active = list(
    name = function(value) {
      if (missing(value)) return(private$.name)
      if (!is.character(value) || nchar(value) == 0) stop("name must be non-empty string")
      private$.name <- value
    },
    age = function(value) {
      if (missing(value)) return(private$.age)
      if (!is.numeric(value) || value < 0 || value > 150) stop("age must be 0-150")
      private$.age <- value
    }
  ),

  private = list(
    .name = NULL,
    .age = NULL
  )
)

p <- Person$new("Alice", 30)
cat(p$name, "is", p$age, "\n")

p$age <- 31  # Valid
cat("Updated age:", p$age, "\n")

tryCatch(
  { p$age <- -5 },
  error = function(e) cat("Caught:", e$message, "\n")
)
```

## Finalize: Cleanup on Garbage Collection

The `finalize` private method runs when the object is garbage collected. Use it to close connections, delete temp files, or release resources.

```r
library(R6)

TempFileManager <- R6Class("TempFileManager",
  public = list(
    initialize = function(prefix = "tmp") {
      private$filepath <- tempfile(pattern = prefix, fileext = ".txt")
      writeLines("temporary data", private$filepath)
      cat("Created temp file:", private$filepath, "\n")
    },

    read = function() {
      readLines(private$filepath)
    },

    get_path = function() {
      private$filepath
    }
  ),

  private = list(
    filepath = NULL,

    finalize = function() {
      if (file.exists(private$filepath)) {
        file.remove(private$filepath)
        cat("Cleaned up temp file:", private$filepath, "\n")
      }
    }
  )
)

# Create and use
mgr <- TempFileManager$new()
cat("Contents:", mgr$read(), "\n")
fpath <- mgr$get_path()
cat("File exists:", file.exists(fpath), "\n")

# Remove reference and garbage collect
rm(mgr)
gc()  # Triggers finalize
cat("File exists after gc:", file.exists(fpath), "\n")
```

## Portable vs Non-Portable Classes

By default, R6 classes are **portable** (`portable = TRUE`). This means you use `self$` and `private$` explicitly. Non-portable classes bind methods into the object's environment, so you can access fields without `self$`. Stick with portable (the default) -- it's clearer.

```r
library(R6)

# Portable (default, recommended)
Portable <- R6Class("Portable",
  portable = TRUE,
  public = list(
    x = 10,
    show_x = function() cat("x =", self$x, "\n")  # Need self$
  )
)

Portable$new()$show_x()

# Non-portable (legacy style)
NonPortable <- R6Class("NonPortable",
  portable = FALSE,
  public = list(
    x = 10,
    show_x = function() cat("x =", x, "\n")  # No self$ needed
  )
)

NonPortable$new()$show_x()
```

## Summary Table

| Feature | Syntax | Purpose |
|---------|--------|---------|
| Inheritance | `R6Class("Child", inherit = Parent)` | Single inheritance |
| Call parent | `super$method()` | Invoke parent method |
| Private methods | `private = list(fn = function() ...)` | Internal-only logic |
| Active bindings | `active = list(prop = function(value) ...)` | Computed properties |
| Finalize | `private = list(finalize = function() ...)` | Cleanup on GC |
| Portable | `portable = TRUE` (default) | Explicit self$/private$ |
| Lock class | `lock_class = TRUE` | Prevent adding new fields |

## Practice Exercises

**Exercise 1:** Create a `Shape` base class with an `area()` method. Then create `Circle` and `Square` child classes that override `area()`. Both should call `super$initialize()`.

<details><summary>Click to reveal solution</summary>

```r
library(R6)

Shape <- R6Class("Shape",
  public = list(
    color = NULL,
    initialize = function(color = "black") self$color <- color,
    area = function() stop("area() not implemented"),
    describe = function() cat(self$color, class(self)[1], "area:", self$area(), "\n")
  )
)

Circle <- R6Class("Circle", inherit = Shape,
  public = list(
    radius = NULL,
    initialize = function(radius, color = "red") {
      super$initialize(color)
      self$radius <- radius
    },
    area = function() pi * self$radius^2
  )
)

Square <- R6Class("Square", inherit = Shape,
  public = list(
    side = NULL,
    initialize = function(side, color = "blue") {
      super$initialize(color)
      self$side <- side
    },
    area = function() self$side^2
  )
)

Circle$new(5)$describe()
Square$new(4)$describe()
```

</details>

**Exercise 2:** Create a `RangedValue` class with an active binding `value` that clamps any assignment between `min` and `max` (set in the constructor).

<details><summary>Click to reveal solution</summary>

```r
library(R6)

RangedValue <- R6Class("RangedValue",
  public = list(
    initialize = function(min, max, initial = min) {
      private$.min <- min
      private$.max <- max
      self$value <- initial
    }
  ),
  active = list(
    value = function(v) {
      if (missing(v)) return(private$.value)
      private$.value <- max(private$.min, min(private$.max, v))
    }
  ),
  private = list(
    .value = NULL,
    .min = NULL,
    .max = NULL
  )
)

rv <- RangedValue$new(0, 100, 50)
cat("Value:", rv$value, "\n")
rv$value <- 200
cat("After setting 200:", rv$value, "\n")  # Clamped to 100
rv$value <- -10
cat("After setting -10:", rv$value, "\n")  # Clamped to 0
```

</details>

**Exercise 3:** Add a `finalize` method to a `Logger` class that writes "Logger shutting down" to a file when the object is garbage collected.

<details><summary>Click to reveal solution</summary>

```r
library(R6)

Logger <- R6Class("Logger",
  public = list(
    initialize = function() {
      private$logfile <- tempfile(fileext = ".log")
      private$write_log("Logger started")
    },
    log = function(msg) private$write_log(msg),
    get_log = function() readLines(private$logfile)
  ),
  private = list(
    logfile = NULL,
    write_log = function(msg) {
      cat(paste(Sys.time(), msg, "\n"), file = private$logfile, append = TRUE)
    },
    finalize = function() {
      private$write_log("Logger shutting down")
      cat("Check log:", private$logfile, "\n")
    }
  )
)

lg <- Logger$new()
lg$log("test message")
cat("Log contents:\n")
cat(lg$get_log(), sep = "\n")
```

</details>

## FAQ

**Q: Does R6 support multiple inheritance?**
No. R6 supports only single inheritance (one parent). If you need to share behavior across unrelated classes, use composition (include another R6 object as a field) rather than inheritance.

**Q: What is the difference between active bindings and getter/setter methods?**
Active bindings use property syntax (`obj$prop` and `obj$prop <- val`) while getters/setters use method syntax (`obj$get_prop()` and `obj$set_prop(val)`). Active bindings are more natural and Pythonic.

**Q: Should I always use finalize for cleanup?**
Only when your object holds external resources (file handles, database connections, temp files). For normal R objects, garbage collection handles memory automatically.

## What's Next

- [Operator Overloading in R](Operator-Overloading-in-R.html) -- Define custom operators for your classes
- [OOP Design Patterns in R](OOP-Design-Patterns-in-R.html) -- Factory, strategy, and observer patterns with R6
- [R6 Classes in R (Basics)](R6-Classes-in-R.html) -- Review the fundamentals if needed
