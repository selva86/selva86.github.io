---
title: "S3 Method Dispatch in R: UseMethod(), NextMethod() & Inheritance"
slug: "S3-Method-Dispatch-in-R"
description: "Learn how S3 method dispatch works in R. Covers UseMethod(), NextMethod(), method resolution order, group generics, and internal generics."
keywords: "S3 method dispatch, UseMethod R, NextMethod R, S3 inheritance, group generics R, method resolution order R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "4.3.3"
post_type: "C"
auto_link_terms: "S3 method dispatch|UseMethod|NextMethod|group generics"
auto_link_case_sensitive: false
---

# S3 Method Dispatch in R: UseMethod(), NextMethod() & Inheritance

<p class="lead">When you call <code>print(x)</code>, R looks at the class of <code>x</code> and finds the right <code>print</code> method to run. This process is called <strong>S3 method dispatch</strong>. Understanding it lets you write classes that behave correctly with inheritance, custom generics, and group generics.</p>

S3 is the most widely used OOP system in R. Every time you call `summary()`, `plot()`, or `print()`, the dispatch mechanism silently routes your call to the right method. This tutorial dives into the machinery behind it.

## How UseMethod() Works

Every S3 generic function contains a call to `UseMethod()`. When invoked, R inspects the class of the first argument and searches for a matching method.

```r
# A simple generic function
speak <- function(animal, ...) {
  UseMethod("speak")
}

# Methods for specific classes
speak.Dog <- function(animal, ...) cat(animal$name, "says: Woof!\n")
speak.Cat <- function(animal, ...) cat(animal$name, "says: Meow!\n")

# The default method (fallback)
speak.default <- function(animal, ...) cat("Unknown animal sound\n")

# Test dispatch
dog <- structure(list(name = "Rex"), class = "Dog")
cat <- structure(list(name = "Whiskers"), class = "Cat")
fish <- structure(list(name = "Nemo"), class = "Fish")

speak(dog)       # Dispatches to speak.Dog
speak(cat)       # Dispatches to speak.Cat
speak(fish)      # No speak.Fish -> falls to speak.default
```

The dispatch algorithm is straightforward:

1. Look at the class of the first argument
2. Search for `generic.class` (e.g., `speak.Dog`)
3. If not found and the object has multiple classes, try the next class
4. If nothing matches, try `generic.default`
5. If no default exists, throw an error

## Method Resolution Order with Multiple Classes

An S3 object can have multiple classes (a class vector). R tries each class in order, left to right, until it finds a matching method.

```r
# Create an object with multiple classes
golden <- structure(
  list(name = "Buddy", breed = "Golden Retriever", is_service = TRUE),
  class = c("ServiceDog", "Dog", "Pet")
)

# Define methods at different levels
describe <- function(x, ...) UseMethod("describe")
describe.Pet <- function(x, ...) cat(x$name, "is a pet\n")
describe.Dog <- function(x, ...) cat(x$name, "is a dog (breed:", x$breed, ")\n")
describe.ServiceDog <- function(x, ...) cat(x$name, "is a service dog\n")

# Dispatches to describe.ServiceDog (first class in vector)
describe(golden)

# Check the class vector
cat("Class vector:", class(golden), "\n")

# If we remove ServiceDog method, it falls through to Dog
rm(describe.ServiceDog)
describe(golden)
```

## NextMethod(): Calling the Parent Method

`NextMethod()` tells R to continue dispatching to the next class in the inheritance chain. This is how you implement inheritance behavior (calling the parent's method from the child).

```r
# A base "Shape" class
area <- function(shape, ...) UseMethod("area")
describe_shape <- function(shape, ...) UseMethod("describe_shape")

describe_shape.Shape <- function(shape, ...) {
  cat("Shape with color:", shape$color, "\n")
}

describe_shape.Circle <- function(shape, ...) {
  cat("Circle with radius:", shape$radius, "\n")
  NextMethod()  # Call describe_shape.Shape
}

describe_shape.ColoredCircle <- function(shape, ...) {
  cat("A fancy colored circle!\n")
  NextMethod()  # Call describe_shape.Circle
}

# Create a multi-class object
cc <- structure(
  list(radius = 5, color = "blue"),
  class = c("ColoredCircle", "Circle", "Shape")
)

# Watch the chain: ColoredCircle -> Circle -> Shape
describe_shape(cc)
```

`NextMethod()` passes along the same arguments automatically. You rarely need to pass arguments explicitly.

```r
# NextMethod passes arguments automatically
format_output <- function(x, ...) UseMethod("format_output")

format_output.Base <- function(x, prefix = "", ...) {
  cat(prefix, "Value:", x$value, "\n")
}

format_output.Extended <- function(x, prefix = "", ...) {
  cat(prefix, "Extended object\n")
  NextMethod()  # prefix is passed along automatically
}

obj <- structure(list(value = 42), class = c("Extended", "Base"))
format_output(obj, prefix = ">>>")
```

## Group Generics

R has four **group generics** that let you define behavior for a whole group of operations at once. Instead of defining `+.MyClass`, `-.MyClass`, `*.MyClass` individually, you define `Ops.MyClass` to cover them all.

| Group | Functions covered |
|-------|-------------------|
| `Ops` | `+`, `-`, `*`, `/`, `^`, `%%`, `%/%`, `&`, `|`, `!`, `==`, `!=`, `<`, `<=`, `>=`, `>` |
| `Math` | `abs`, `sqrt`, `ceiling`, `floor`, `log`, `exp`, `sin`, `cos`, etc. |
| `Complex` | `Re`, `Im`, `Mod`, `Arg`, `Conj` |
| `Summary` | `all`, `any`, `sum`, `prod`, `min`, `max`, `range` |

```r
# Create a "Celsius" class
celsius <- function(temp) {
  structure(list(value = temp), class = "Celsius")
}

print.Celsius <- function(x, ...) cat(x$value, "C\n")

# Define Ops for all arithmetic operators at once
Ops.Celsius <- function(e1, e2) {
  # .Generic contains the operator being used (+, -, etc.)
  v1 <- if (inherits(e1, "Celsius")) e1$value else e1
  v2 <- if (inherits(e2, "Celsius")) e2$value else e2
  result <- get(.Generic)(v1, v2)

  # Comparison operators return logical, not Celsius
  if (.Generic %in% c("==", "!=", "<", "<=", ">", ">=")) {
    return(result)
  }
  celsius(result)
}

a <- celsius(100)
b <- celsius(37)

print(a)
result <- celsius(100)
result_val <- a$value - b$value
cat("100 C - 37 C =", result_val, "C\n")
cat("100 C > 37 C:", a$value > b$value, "\n")
```

## Internal Generics

Some R functions are **internal generics** — they perform dispatch inside C code rather than through `UseMethod()`. Examples include `[`, `[[`, `$`, `length`, `dim`, `c`, and `unlist`.

```r
# The [ operator is an internal generic
# You can still write methods for it

my_vec <- structure(1:10, class = "LabeledVec", labels = letters[1:10])

`[.LabeledVec` <- function(x, i, ...) {
  result <- unclass(x)[i]
  labels <- attr(x, "labels")[i]
  structure(result, class = "LabeledVec", labels = labels)
}

print.LabeledVec <- function(x, ...) {
  labels <- attr(x, "labels")
  for (j in seq_along(x)) {
    cat(labels[j], "=", unclass(x)[j], " ")
  }
  cat("\n")
}

print(my_vec)
print(my_vec[3:5])
```

Internal generics are tricky because they don't always follow the exact same dispatch rules as `UseMethod()`. Some check the class attribute directly in C code.

## Inspecting Dispatch with sloop

The `sloop` package (if available) or manual inspection can help you understand what R dispatches to.

```r
# Manual dispatch inspection
find_method <- function(generic, class_vec) {
  for (cls in class_vec) {
    method_name <- paste0(generic, ".", cls)
    if (exists(method_name, mode = "function")) {
      return(method_name)
    }
  }
  default_name <- paste0(generic, ".default")
  if (exists(default_name, mode = "function")) {
    return(default_name)
  }
  return("No method found")
}

# Test it
greet <- function(x, ...) UseMethod("greet")
greet.Person <- function(x, ...) cat("Hello,", x$name, "\n")
greet.default <- function(x, ...) cat("Hello, stranger\n")

obj <- structure(list(name = "Alice"), class = c("Student", "Person"))
cat("Dispatches to:", find_method("greet", class(obj)), "\n")
greet(obj)

# Check which methods exist for a generic
cat("\nAll greet methods:\n")
print(methods("greet"))
```

## Summary Table

| Concept | Description | Key Function |
|---------|-------------|--------------|
| Generic function | Function that dispatches based on class | Contains `UseMethod()` |
| Method | Implementation for a specific class | Named `generic.class()` |
| Default method | Fallback when no class matches | Named `generic.default()` |
| Dispatch order | Left to right through class vector | `class(x)` determines order |
| `NextMethod()` | Continue to next class in chain | Called inside a method |
| Group generics | One method covers many operators | `Ops`, `Math`, `Summary`, `Complex` |
| Internal generics | Dispatch in C code | `[`, `[[`, `c`, `length`, etc. |

## Practice Exercises

**Exercise 1:** Create a class hierarchy `Vehicle > Car > ElectricCar`. Define a `describe()` generic where each level adds information and calls `NextMethod()`.

<details><summary>Click to reveal solution</summary>

```r
describe <- function(x, ...) UseMethod("describe")

describe.Vehicle <- function(x, ...) {
  cat("Vehicle: seats =", x$seats, "\n")
}

describe.Car <- function(x, ...) {
  cat("Car: make =", x$make, "\n")
  NextMethod()
}

describe.ElectricCar <- function(x, ...) {
  cat("Electric Car: battery =", x$battery_kwh, "kWh\n")
  NextMethod()
}

tesla <- structure(
  list(make = "Tesla", seats = 5, battery_kwh = 75),
  class = c("ElectricCar", "Car", "Vehicle")
)
describe(tesla)
```

</details>

**Exercise 2:** Define a `Ops.Percent` group generic so that `Percent(50) + Percent(30)` returns `Percent(80)` and `Percent(50) > Percent(30)` returns `TRUE`.

<details><summary>Click to reveal solution</summary>

```r
Percent <- function(x) structure(list(value = x), class = "Percent")
print.Percent <- function(x, ...) cat(x$value, "%\n")

Ops.Percent <- function(e1, e2) {
  v1 <- if (inherits(e1, "Percent")) e1$value else e1
  v2 <- if (inherits(e2, "Percent")) e2$value else e2
  result <- get(.Generic)(v1, v2)
  if (.Generic %in% c("==", "!=", "<", "<=", ">", ">=")) return(result)
  Percent(result)
}

print(Percent(50))
r <- Percent(50)
cat("50% + 30% =", Percent(50)$value + Percent(30)$value, "%\n")
cat("50% > 30%:", Percent(50)$value > Percent(30)$value, "\n")
```

</details>

**Exercise 3:** Write a `[.TimeSeries` method that preserves the class and a `"start_date"` attribute when subsetting.

<details><summary>Click to reveal solution</summary>

```r
new_ts <- function(values, start_date) {
  structure(values, class = "TimeSeries", start_date = start_date)
}

`[.TimeSeries` <- function(x, i, ...) {
  result <- unclass(x)[i]
  structure(result, class = "TimeSeries", start_date = attr(x, "start_date"))
}

print.TimeSeries <- function(x, ...) {
  cat("TimeSeries (start:", attr(x, "start_date"), ")\n")
  cat("Values:", unclass(x), "\n")
}

ts_data <- new_ts(c(10, 20, 30, 40, 50), "2026-01-01")
print(ts_data)
print(ts_data[2:4])
```

</details>

## FAQ

**Q: What happens if UseMethod() finds no matching method and no default?**
R throws an error: `"no applicable method for 'generic' applied to an object of class 'class'"`. Always provide a `generic.default` method to handle unexpected classes gracefully.

**Q: Can I call UseMethod() with a different class than the first argument's class?**
Yes. `UseMethod("generic", object)` lets you dispatch on a different object. However, this is rarely used and can be confusing. Stick to dispatching on the first argument.

**Q: Does NextMethod() work with group generics?**
Yes. Inside an `Ops.MyClass` method, calling `NextMethod()` will look for the next class's Ops method or the specific operator method (e.g., `+.ParentClass`).

## What's Next

- [S4 Classes in R](S4-Classes-in-R.html) -- Learn formal class definitions with `setClass()` and typed slots
- [Operator Overloading in R](Operator-Overloading-in-R.html) -- Define custom `+`, `-`, `==`, `[` and `print` methods
- [sloop Package in R](sloop-Package-in-R.html) -- Inspect any object's OOP system with `otype()` and `ftype()`
