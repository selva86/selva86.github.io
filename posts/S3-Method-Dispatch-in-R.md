---
title: "S3 Method Dispatch: Exactly How R Finds the Right Function for Your Object"
slug: "S3-Method-Dispatch-in-R"
description: "When you call print(x), R uses UseMethod() to find the right method. Learn how S3 dispatch works, use NextMethod() for inheritance, and debug method lookup."
keywords: "S3 method dispatch R, UseMethod R, NextMethod R, S3 dispatch mechanism, R generic functions, S3 class vector, R method lookup, group generics R, S3 inheritance R, debug S3 dispatch"
auto_link_terms: "S3 method dispatch|UseMethod()|NextMethod()|S3 dispatch|method dispatch in R|S3 generic functions"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.3"
post_type: "C"
sidebar_section: "Advanced R"
sidebar_title: "S3 Method Dispatch"
sidebar_order: 12
difficulty: "Advanced"
---

# S3 Method Dispatch: Exactly How R Finds the Right Function for Your Object

<p class="lead">S3 method dispatch is R's mechanism for deciding which function implementation to run when you call a generic like <code>print()</code> or <code>summary()</code>, R inspects the object's class attribute, searches for a matching method name, and calls the first one it finds.</p>

## What happens when you call a generic function like print()?

Every time you type `print(x)`, R doesn't just run one fixed function. It checks what *kind* of object `x` is, builds a method name from the generic and the class, and calls that specific function. This is S3 method dispatch, and it powers almost every interaction you have with R.

```r
# Create a custom "greeting" class
greet <- structure("Hello from S3!", class = "greeting")

# Define a print method specifically for "greeting" objects
print.greeting <- function(x, ...) {
  cat("***", x, "***\n")
}

# R sees class(greet) is "greeting", so it calls print.greeting()
print(greet)
#> *** Hello from S3! ***

# A plain character with the same data — no special method
plain <- "Hello from S3!"
print(plain)
#> [1] "Hello from S3!"
```

Same data, different output. When you called `print(greet)`, R saw that `greet` has class `"greeting"`, looked for a function named `print.greeting`, found it, and called it. When you called `print(plain)`, there was no `print.character` in your environment, so R fell through to `print.default`. That lookup process *is* S3 dispatch.

So how does `print()` know to delegate? Let's look inside it.

```r
# print() is a "generic" — its entire body is one line
print
#> function (x, ...)
#> UseMethod("print")
#> <bytecode: 0x...>
#> <environment: namespace:base>
```

That single line, `UseMethod("print")`, is the engine. Every S3 generic function follows this pattern: accept arguments, then immediately hand off to `UseMethod()`. The generic never does any real work itself. It's a dispatcher, not a doer.

[KEY INSIGHT]
**Every S3 generic is a one-line function that calls UseMethod().** When you call `print(x)`, R never executes any code after `UseMethod("print")`. Control transfers entirely to the matched method.

**Try it:** Create a custom `format.greeting()` method that returns the greeting wrapped in square brackets. Test it by calling `format()` on a greeting object.

```r
# Try it: write format.greeting()
format.greeting <- function(x, ...) {
  # your code here
}

# Test:
format(greet)
#> Expected: "[Hello from S3!]"
```

<details>
<summary>Click to reveal solution</summary>

```r
format.greeting <- function(x, ...) {
  paste0("[", x, "]")
}
format(greet)
#> [1] "[Hello from S3!]"
```

**Explanation:** `format()` is a generic just like `print()`. R found `format.greeting()` because `class(greet)` is `"greeting"`.

</details>

## How does UseMethod() search for the right method?

When `UseMethod("generic")` runs, R constructs candidate method names by pasting the generic name, a dot, and each class in the object's class vector. Then it searches three places in order.

Let's build a custom generic to see this clearly.

```r
# Define a generic function
describe <- function(x, ...) {
  UseMethod("describe")
}

# Define methods for specific classes
describe.character <- function(x, ...) {
  cat("A character string:", x, "\n")
}

describe.numeric <- function(x, ...) {
  cat("A number:", x, "\n")
}

# Dispatch in action
describe("hello")
#> A character string: hello

describe(42)
#> A number: 42
```

R constructed `describe.character` for the first call and `describe.numeric` for the second. But what happens when no class-specific method exists?

```r
# No describe.logical exists — R falls back to describe.default
describe.default <- function(x, ...) {
  cat("I don't know what this is:", class(x), "\n")
}

describe(TRUE)
#> I don't know what this is: logical
```

The `.default` suffix is a special pseudo-class. R always tries it last, after exhausting all classes in the class vector. If no `.default` exists either, R throws an error.

Here's the full algorithm R follows:

1. **Build candidate names:** For each class in `class(x)`, construct `generic.classN`. Append `generic.default` at the end.
2. **Search the method table:** Check `.__S3MethodsTable__.` in the environment where the generic is defined (this is how package methods are found).
3. **Search the calling environments:** Walk up the environment chain from where the generic was called, up to the global environment.
4. **Search the base environment:** Check base R's registered methods.
5. **If nothing matched:** Throw `"no applicable method"` error.

![How UseMethod() walks the class vector to find a matching method](screenshots/S3-Method-Dispatch-in-R-dispatch-flowchart.webp)

*Figure 1: How UseMethod() walks the class vector to find a matching method.*

You can see just how many methods exist for common generics like `print()`.

```r
# How many print methods are registered?
print_methods <- methods(print)
length(print_methods)
#> [1] 232

# Show the first 10
head(print_methods, 10)
#> [1] "print.acf"          "print.activeConcord" "print.anova"
#> [4] "print.aov"          "print.aovlist"       "print.ar"
#> [7] "print.Arima"        "print.arima0"        "print.AsIs"
#> [10] "print.aspell"
```

That's over 200 methods for a single generic. Every time you call `print()`, R searches through these to find the right one for your object's class.

[WARNING]
**UseMethod() never returns to the generic's body.** Any code you write after `UseMethod()` inside a generic function is unreachable. R transfers control entirely to the matched method.

**Try it:** Write a `describe.logical` method for the `describe` generic we created above. It should print "A logical value: TRUE" or "A logical value: FALSE". Verify it's called instead of the default.

```r
# Try it: write describe.logical()
describe.logical <- function(x, ...) {
  # your code here
}

# Test:
describe(TRUE)
#> Expected: "A logical value: TRUE"
```

<details>
<summary>Click to reveal solution</summary>

```r
describe.logical <- function(x, ...) {
  cat("A logical value:", x, "\n")
}
describe(TRUE)
#> A logical value: TRUE
```

**Explanation:** Now R finds `describe.logical` before falling through to `describe.default`.

</details>

## What role does the class vector play in dispatch?

An object's class isn't always a single string. It can be a character vector like `c("glm", "lm")`, and the order of that vector controls which method runs first. R walks the vector left to right, trying each one until it finds a match.

```r
# An employee with multiple roles — order matters
emp <- structure(
  list(name = "Ada", level = "senior", dept = "engineering"),
  class = c("senior_dev", "developer", "employee")
)

describe.senior_dev <- function(x, ...) {
  cat("Senior developer:", x$name, "in", x$dept, "\n")
}

describe.developer <- function(x, ...) {
  cat("Developer:", x$name, "\n")
}

describe.employee <- function(x, ...) {
  cat("Employee:", x$name, "\n")
}

# R tries describe.senior_dev first — and finds it
describe(emp)
#> Senior developer: Ada in engineering
```

R tried `describe.senior_dev`, found it, and stopped. It never checked `describe.developer` or `describe.employee`. Now watch what happens when we change the class order.

```r
# Same person, different class order
emp2 <- emp
class(emp2) <- c("employee", "developer", "senior_dev")

describe(emp2)
#> Employee: Ada
```

Now `describe.employee` fires first because `"employee"` is at position 1 in the class vector. The class vector is a priority list, the first class that has a matching method wins.

This becomes important with built-in R objects too. Many base types carry implicit class vectors.

```r
# Integers have an implicit two-element class vector
x_int <- 1L
class(x_int)
#> [1] "integer"

# But R treats it as c("integer", "numeric") for dispatch
is.numeric(x_int)
#> [1] TRUE

# Dates have a single class
x_date <- Sys.Date()
class(x_date)
#> [1] "Date"

# A GLM has a two-element class vector
fit <- glm(am ~ wt, data = mtcars, family = binomial)
class(fit)
#> [1] "glm" "lm"
```

That `c("glm", "lm")` class vector means: when you call `summary(fit)`, R first looks for `summary.glm`. If that didn't exist, it would fall through to `summary.lm`. This is how S3 implements inheritance, not through formal parent/child declarations, but through the order of the class vector.

[TIP]
**Use unclass() to strip the class and see the raw underlying object.** This is handy for debugging when you want to bypass dispatch entirely and inspect the base structure.

**Try it:** Create an object with class `c("electric_car", "car")`. Define `describe.car` that prints the model, and `describe.electric_car` that prints the battery range. Predict which fires, then verify.

```r
# Try it: which method fires?
ex_tesla <- structure(
  list(model = "Model 3", range_km = 500),
  class = c("electric_car", "car")
)

describe.car <- function(x, ...) {
  cat("Car model:", x$model, "\n")
}

describe.electric_car <- function(x, ...) {
  # your code here
}

# Test:
describe(ex_tesla)
#> Expected: prints the battery range
```

<details>
<summary>Click to reveal solution</summary>

```r
describe.electric_car <- function(x, ...) {
  cat("Electric car with", x$range_km, "km range\n")
}
describe(ex_tesla)
#> Electric car with 500 km range
```

**Explanation:** `"electric_car"` is first in the class vector, so `describe.electric_car` wins. `describe.car` is never reached.

</details>

## How does NextMethod() delegate to parent classes?

So far, when R finds a method, the dispatch stops. But sometimes you want a child method to do its own work *and then* pass control to the parent method. That's what `NextMethod()` does, it moves to the next class in the class vector and calls that method.

```r
# Build a pet hierarchy: puppy > dog > pet
buddy <- structure(
  list(name = "Buddy", breed = "Golden Retriever", toy = "tennis ball"),
  class = c("puppy", "dog", "pet")
)

summary.pet <- function(x, ...) {
  cat("Pet:", x$name, "\n")
}

summary.dog <- function(x, ...) {
  cat("Breed:", x$breed, "\n")
  NextMethod()  # pass to summary.pet
}

summary.puppy <- function(x, ...) {
  cat("Favorite toy:", x$toy, "\n")
  NextMethod()  # pass to summary.dog
}

summary(buddy)
#> Favorite toy: tennis ball
#> Breed: Golden Retriever
#> Pet: Buddy
```

All three methods fired in sequence. `summary.puppy` ran first (because `"puppy"` is the first class), printed the toy, then called `NextMethod()`. That moved to `summary.dog`, which printed the breed and called `NextMethod()` again. Finally, `summary.pet` printed the name.

![How NextMethod() delegates through a three-level class hierarchy](screenshots/S3-Method-Dispatch-in-R-nextmethod-chain.webp)

*Figure 2: How NextMethod() delegates through a three-level class hierarchy.*

One crucial detail: `NextMethod()` doesn't restart dispatch from scratch. R internally tracks where it is in the class vector using a special `.Class` variable. Each `NextMethod()` call advances the position by one.

```r
# Prove that NextMethod() passes the original object unchanged
summary.dog <- function(x, ...) {
  cat("Breed:", x$breed, "\n")
  cat("  Classes seen by this method:", paste(.Class, collapse = ", "), "\n")
  NextMethod()
}

summary.puppy <- function(x, ...) {
  cat("Favorite toy:", x$toy, "\n")
  cat("  Classes seen by this method:", paste(.Class, collapse = ", "), "\n")
  NextMethod()
}

summary(buddy)
#> Favorite toy: tennis ball
#>   Classes seen by this method: puppy, dog, pet
#> Breed: Golden Retriever
#>   Classes seen by this method: dog, pet
#> Pet: Buddy
```

Notice how `.Class` shrinks at each step. In `summary.puppy`, it's `c("puppy", "dog", "pet")`. In `summary.dog`, it's `c("dog", "pet")`, `"puppy"` has been consumed. R uses this to know which method to call next.

[WARNING]
**Don't modify the dispatched object before calling NextMethod().** Changes to `x` inside a method are ignored by NextMethod(), R passes the *original* object, not your modified copy. If you need to pass extra information, use additional arguments.

**Try it:** Add a `describe.puppy()` method that prints `"Puppy: <name>"` and then calls `NextMethod()` to also trigger `describe.dog()`. Verify both lines print.

```r
# Try it: chain describe.puppy -> describe.dog
ex_pup <- structure(
  list(name = "Max", breed = "Beagle"),
  class = c("puppy", "dog")
)

describe.dog <- function(x, ...) {
  cat("Dog breed:", x$breed, "\n")
}

describe.puppy <- function(x, ...) {
  # your code here — print name, then delegate
}

# Test:
describe(ex_pup)
#> Expected:
#> Puppy: Max
#> Dog breed: Beagle
```

<details>
<summary>Click to reveal solution</summary>

```r
describe.puppy <- function(x, ...) {
  cat("Puppy:", x$name, "\n")
  NextMethod()
}
describe(ex_pup)
#> Puppy: Max
#> Dog breed: Beagle
```

**Explanation:** `describe.puppy` runs first, prints the name, then `NextMethod()` advances to `describe.dog`, which prints the breed.

</details>

## How do internal generics and group generics dispatch differently?

Not all dispatch goes through `UseMethod()`. R has two special categories of generics that work differently: internal generics and group generics.

**Internal generics** like `[`, `[[`, `c`, `+`, and `length` are implemented in C code. They perform dispatch at the C level, which is faster but follows the same class-lookup logic. You can still write S3 methods for them, R checks for your method before falling back to the C implementation.

**Group generics** are even more powerful. Instead of writing a separate method for every operator (`+`, `-`, `*`, `<`, `==`), you write *one* method for the group, and R routes all member operators through it. R has four groups:

1. **Ops**, arithmetic and comparison: `+`, `-`, `*`, `/`, `^`, `%%`, `%/%`, `<`, `>`, `<=`, `>=`, `==`, `!=`, `&`, `|`, `!`
2. **Math**, math functions: `abs`, `sqrt`, `floor`, `ceiling`, `round`, `log`, `exp`, `sin`, `cos`, etc.
3. **Summary**, aggregation: `sum`, `min`, `max`, `range`, `prod`, `any`, `all`
4. **Complex**, complex number operations: `Re`, `Im`, `Mod`, `Arg`, `Conj`

Let's see this in action with a custom `currency` class.

```r
# A simple currency class
currency <- function(amount, code = "USD") {
  structure(amount, class = "currency", currency = code)
}

# One method handles ALL arithmetic and comparison operators
Ops.currency <- function(e1, e2) {
  result <- NextMethod()  # do the math on the underlying numbers
  if (is.numeric(result)) {
    currency(result, attr(e1, "currency"))
  } else {
    result  # comparisons return logical
  }
}

price1 <- currency(29.99)
price2 <- currency(15.50)

# All of these route through Ops.currency
price1 + price2
#> [1] 45.49
#> attr(,"class")
#> [1] "currency"
#> attr(,"currency")
#> [1] "USD"

price1 > price2
#> [1] TRUE
```

One method handled both `+` and `>`. Inside the method, the special variable `.Generic` contains the actual operator name, so you can branch on it if needed.

The `Math` group works the same way for mathematical functions.

```r
# Handle abs(), round(), floor(), etc. with one method
Math.currency <- function(x, ...) {
  result <- NextMethod()
  currency(result, attr(x, "currency"))
}

# Add a print method so output is cleaner
print.currency <- function(x, ...) {
  cat(attr(x, "currency"), formatC(unclass(x), format = "f", digits = 2), "\n")
}

debt <- currency(-42.567)
abs(debt)
#> USD 42.57

round(currency(19.999), digits = 1)
#> USD 20.00
```

[KEY INSIGHT]
**Group generics let you write one method to handle dozens of operators.** The special variable `.Generic` tells you which operator was actually called, so you can branch on it if `+` and `*` need different logic.

**Try it:** Create a `Summary.currency` method that handles `sum()` and `max()`. Test it with a vector of currency values.

```r
# Try it: write Summary.currency
Summary.currency <- function(..., na.rm = FALSE) {
  # your code here
  # Hint: use NextMethod() and wrap the result in currency()
}

# Test:
ex_prices <- currency(c(10, 25, 15))
sum(ex_prices)
#> Expected: USD 50.00
max(ex_prices)
#> Expected: USD 25.00
```

<details>
<summary>Click to reveal solution</summary>

```r
Summary.currency <- function(..., na.rm = FALSE) {
  result <- NextMethod()
  currency(result, "USD")
}
sum(ex_prices)
#> USD 50.00
max(ex_prices)
#> USD 25.00
```

**Explanation:** `Summary.currency` intercepts both `sum()` and `max()` because they belong to the Summary group. `NextMethod()` does the actual computation on the underlying numeric, then we rewrap it as currency.

</details>

## How do you inspect and debug S3 dispatch?

When dispatch doesn't behave as expected, you need tools to see what R is doing behind the scenes. Base R gives you everything you need.

`methods()` is your first stop. It lists all methods for a generic or all methods defined for a class.

```r
# All methods for the summary() generic
summary_methods <- methods(summary)
length(summary_methods)
#> [1] 48

# All methods defined for the "Date" class
date_methods <- methods(class = "Date")
length(date_methods)
#> [1] 35

head(date_methods, 8)
#> [1] "-.Date"             "[.Date"              "[[.Date"
#> [4] "+.Date"             "as.character.Date"   "as.data.frame.Date"
#> [7] "as.list.Date"       "as.POSIXct.Date"
```

Some methods are hidden inside package namespaces. A `*` next to a method name in `methods()` output means it's not directly accessible. Use `getAnywhere()` to find it.

```r
# Find a method hidden in a package namespace
getAnywhere("residuals.lm")
#> A single object matching 'residuals.lm' was found
#> It was found in the following places
#>   registered S3 method for residuals from namespace stats
#>   namespace:stats
```

For systematic debugging, you can trace the dispatch path manually. This function walks the class vector and checks whether each candidate method exists.

```r
# Manual dispatch tracer
trace_dispatch <- function(generic, x) {
  classes <- c(class(x), "default")
  cat("Dispatch for", generic, "on class:",
      paste(class(x), collapse = ", "), "\n")
  for (cl in classes) {
    method_name <- paste0(generic, ".", cl)
    found <- length(utils::getAnywhere(method_name)$objs) > 0
    status <- if (found) "<-- MATCH" else "    (skip)"
    cat("  Try:", method_name, status, "\n")
    if (found) break
  }
}

# Trace dispatch for a GLM object
trace_dispatch("summary", fit)
#> Dispatch for summary on class: glm, lm
#>   Try: summary.glm <-- MATCH
```

The tracer shows exactly which method R would pick. Try it with different objects to see the full lookup path.

```r
# A data frame has a simple single class
trace_dispatch("print", mtcars)
#> Dispatch for print on class: data.frame
#>   Try: print.data.frame <-- MATCH

# An ordered factor has a two-element class vector
trace_dispatch("print", ordered(c("low", "mid", "high")))
#> Dispatch for print on class: ordered, factor
#>   Try: print.ordered     (skip)
#>   Try: print.factor <-- MATCH
```

The ordered factor example is revealing: there's no `print.ordered`, so R falls through to `print.factor`. This is inheritance in action, the class vector `c("ordered", "factor")` gives ordered factors all the behavior of regular factors, plus any ordered-specific methods that exist for other generics.

[TIP]
**Use methods(class = "yourclass") right after defining a new class.** It's the fastest way to verify all your methods registered correctly. If a method doesn't show up, check for typos in the naming convention.

[NOTE]
**The sloop package provides richer dispatch visualization.** If you're working in RStudio, `sloop::s3_dispatch(print(fit))` shows the full dispatch path with symbols indicating which methods were called, which exist but weren't called, and which were delegated to via NextMethod(). Install it with `install.packages("sloop")`.

**Try it:** Use `methods()` to find all methods defined for the `Date` class. How many are there?

```r
# Try it: count Date methods
ex_date_methods <- methods(class = "Date")
# your code here — print the count
#> Expected: a number around 35
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_date_methods <- methods(class = "Date")
length(ex_date_methods)
#> [1] 35
```

**Explanation:** R's `Date` class has around 35 methods, covering arithmetic (`+.Date`, `-.Date`), formatting (`format.Date`), comparison, and coercion. This shows how much behavior a single S3 class can accumulate.

</details>

## Practice Exercises

### Exercise 1: Temperature class with dispatch

Create a `temperature` class that stores a numeric value and a unit (`"C"` or `"F"`). Write:
- `print.temperature` that displays like `"25 °C"` or `"77 °F"`
- A `convert` generic with `convert.temperature` that switches Celsius to Fahrenheit (F = C × 9/5 + 32) and vice versa (C = (F − 32) × 5/9)

Verify that converting twice returns the original value.

```r
# Exercise 1: Build the temperature class
# Hint: store as a list with $value and $unit, set class = "temperature"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
temperature <- function(value, unit = "C") {
  structure(list(value = value, unit = unit), class = "temperature")
}

print.temperature <- function(x, ...) {
  symbol <- if (x$unit == "C") "\u00b0C" else "\u00b0F"
  cat(x$value, symbol, "\n")
}

convert <- function(x, ...) UseMethod("convert")

convert.temperature <- function(x, ...) {
  if (x$unit == "C") {
    temperature(x$value * 9 / 5 + 32, "F")
  } else {
    temperature((x$value - 32) * 5 / 9, "C")
  }
}

boiling <- temperature(100, "C")
print(boiling)
#> 100 °C
print(convert(boiling))
#> 212 °F
print(convert(convert(boiling)))
#> 100 °C
```

**Explanation:** The `convert` generic uses `UseMethod()` to dispatch to `convert.temperature`. Round-tripping (convert twice) returns the original value, confirming the formulas are correct.

</details>

### Exercise 2: Three-level shape hierarchy with NextMethod()

Build a 3-level class hierarchy: `shape` → `polygon` → `triangle`. Write an `area()` generic where:
- `area.triangle` computes 0.5 × base × height, prints "Triangle area:", then calls `NextMethod()`
- `area.polygon` prints "Computed by polygon method", then calls `NextMethod()`
- `area.shape` prints the final result

Verify the full chain fires for a triangle with base = 10 and height = 6.

```r
# Exercise 2: Build the shape hierarchy
# Hint: class vector should be c("triangle", "polygon", "shape")
# Store area in the object so parent methods can read it

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
area <- function(x, ...) UseMethod("area")

area.triangle <- function(x, ...) {
  x$computed_area <- 0.5 * x$base * x$height
  cat("Triangle area:", x$computed_area, "\n")
  NextMethod()
}

area.polygon <- function(x, ...) {
  cat("Computed by polygon method\n")
  NextMethod()
}

area.shape <- function(x, ...) {
  cat("Shape processing complete\n")
}

my_tri <- structure(
  list(base = 10, height = 6),
  class = c("triangle", "polygon", "shape")
)

area(my_tri)
#> Triangle area: 30
#> Computed by polygon method
#> Shape processing complete
```

**Explanation:** All three methods fire in sequence because each calls `NextMethod()`. The class vector `c("triangle", "polygon", "shape")` defines the delegation order.

</details>

### Exercise 3: Money class with Ops group generic

Create a `money` class with an `Ops` group generic. Two money values can only be added/subtracted if they share the same currency. Comparison operators should work across currencies (comparing raw amounts). Test these cases:

- `money(10, "USD") + money(5, "USD")` → should work
- `money(10, "USD") + money(5, "EUR")` → should error
- `money(10, "USD") > money(5, "EUR")` → should return TRUE

```r
# Exercise 3: Build the money class with Ops
# Hint: use .Generic to detect whether the operation is arithmetic vs comparison

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
money <- function(amount, curr = "USD") {
  structure(list(amount = amount, curr = curr), class = "money")
}

print.money <- function(x, ...) {
  cat(x$curr, formatC(x$amount, format = "f", digits = 2), "\n")
}

Ops.money <- function(e1, e2) {
  arithmetic_ops <- c("+", "-", "*", "/")
  if (.Generic %in% arithmetic_ops) {
    if (e1$curr != e2$curr) {
      stop("Cannot ", .Generic, " different currencies: ",
           e1$curr, " vs ", e2$curr)
    }
    money(do.call(.Generic, list(e1$amount, e2$amount)), e1$curr)
  } else {
    do.call(.Generic, list(e1$amount, e2$amount))
  }
}

print(money(10, "USD") + money(5, "USD"))
#> USD 15.00

money(10, "USD") > money(5, "EUR")
#> [1] TRUE

tryCatch(
  money(10, "USD") + money(5, "EUR"),
  error = function(e) cat("Error:", e$message, "\n")
)
#> Error: Cannot + different currencies: USD vs EUR
```

**Explanation:** The `Ops.money` method uses `.Generic` to branch: arithmetic operations enforce same-currency, comparisons work on raw amounts. This is a real-world pattern for financial software.

</details>

## Putting It All Together

Let's build a complete `bank_account` class that demonstrates every dispatch concept from this tutorial: generics, class vectors, `NextMethod()`, and group generics.

```r
# Constructor — returns an account with a subclass for the account type
bank_account <- function(owner, balance = 0, type = "checking") {
  subclass <- paste0(type, "_account")
  structure(
    list(owner = owner, balance = balance, type = type),
    class = c(subclass, "bank_account")
  )
}

# Print method for all bank accounts
print.bank_account <- function(x, ...) {
  cat(toupper(x$type), "ACCOUNT\n")
  cat("  Owner:  ", x$owner, "\n")
  cat("  Balance:", paste0("$", formatC(x$balance, format = "f", digits = 2)), "\n")
}

# Savings accounts add interest info to print
print.savings_account <- function(x, ...) {
  NextMethod()  # print the base account info first
  cat("  Type:    Savings (0.5% monthly interest)\n")
}

# Custom generics for banking operations
deposit <- function(account, amount, ...) UseMethod("deposit")
withdraw <- function(account, amount, ...) UseMethod("withdraw")

# Base deposit — works for all account types
deposit.bank_account <- function(account, amount, ...) {
  account$balance <- account$balance + amount
  cat("Deposited $", formatC(amount, format = "f", digits = 2), "\n")
  account
}

# Base withdraw
withdraw.bank_account <- function(account, amount, ...) {
  if (amount > account$balance) {
    cat("Insufficient funds!\n")
    return(account)
  }
  account$balance <- account$balance - amount
  cat("Withdrew $", formatC(amount, format = "f", digits = 2), "\n")
  account
}

# Savings accounts charge a $2 withdrawal fee
withdraw.savings_account <- function(account, amount, ...) {
  cat("Savings withdrawal fee: $2.00\n")
  withdraw.bank_account(account, amount + 2)
}
```

Now let's see the full system in action.

```r
# Create accounts
alice_checking <- bank_account("Alice", 500, "checking")
bob_savings <- bank_account("Bob", 1000, "savings")

# Print dispatches to different methods based on class
print(alice_checking)
#> CHECKING ACCOUNT
#>   Owner:   Alice
#>   Balance: $500.00

print(bob_savings)
#> SAVINGS ACCOUNT
#>   Owner:   Bob
#>   Balance: $1000.00
#>   Type:    Savings (0.5% monthly interest)
```

The savings account's print method called `NextMethod()` to get the base info, then added its own line. Now let's test withdrawals.

```r
# Checking account — no fee, falls through to bank_account method
alice_checking <- deposit(alice_checking, 200)
#> Deposited $ 200.00
print(alice_checking)
#> CHECKING ACCOUNT
#>   Owner:   Alice
#>   Balance: $700.00

# Savings account — fee added by savings-specific method
bob_savings <- withdraw(bob_savings, 100)
#> Savings withdrawal fee: $2.00
#> Withdrew $ 102.00
print(bob_savings)
#> SAVINGS ACCOUNT
#>   Owner:   Bob
#>   Balance: $898.00
#>   Type:    Savings (0.5% monthly interest)
```

`withdraw.savings_account` added the $2 fee, then called the base `withdraw.bank_account` with the adjusted amount. The base method did the actual balance deduction.

Let's verify our dispatch paths with the tracing function from earlier.

```r
# Confirm the dispatch path for each account type
trace_dispatch("withdraw", alice_checking)
#> Dispatch for withdraw on class: checking_account, bank_account
#>   Try: withdraw.checking_account     (skip)
#>   Try: withdraw.bank_account <-- MATCH

trace_dispatch("withdraw", bob_savings)
#> Dispatch for withdraw on class: savings_account, bank_account
#>   Try: withdraw.savings_account <-- MATCH
```

Alice's checking account has no specialized withdraw method, so it falls through to `withdraw.bank_account`. Bob's savings account hits `withdraw.savings_account` first, which adds the fee and delegates down. That's the full S3 dispatch lifecycle in one working system.

## Summary

| Concept | What It Does | Example |
|---|---|---|
| `UseMethod("generic")` | Starts dispatch, looks for generic.class() | `print <- function(x, ...) UseMethod("print")` |
| `generic.class()` naming | Convention R uses to find methods | `print.data.frame()`, `summary.lm()` |
| `generic.default()` | Fallback when no class-specific method matches | `print.default()` handles anything without a custom method |
| Class vector | Multi-class objects, searched left to right | `class(fit)` returns `c("glm", "lm")` |
| `NextMethod()` | Delegate to the next method in the class chain | Child does its work, then passes to parent |
| `.Generic` | Inside a method: which generic was called | In `Ops.currency`, tells you if `+` or `>` was used |
| `.Class` | Inside a method: remaining classes to try | Shrinks as NextMethod() advances through the chain |
| Internal generics | `[`, `c`, `+`, dispatch in C code | Write `[.myclass` to customize subsetting |
| Group generics | One method for a family of operators | `Ops.myclass` handles all arithmetic + comparison |
| `methods()` | List methods for a generic or class | `methods(print)`, `methods(class = "Date")` |
| `getAnywhere()` | Find methods hidden in package namespaces | `getAnywhere("residuals.lm")` |

## References

1. Wickham, H., *Advanced R*, 2nd Edition. Chapter 13: S3. [Link](https://adv-r.hadley.nz/s3.html)
2. R Core Team, UseMethod() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/UseMethod.html)
3. R Core Team, InternalMethods documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/InternalMethods.html)
4. R Core Team, groupGeneric documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/groupGeneric.html)
5. Wickham, H., sloop package: helpers for S3 OOP exploration. [Link](https://sloop.r-lib.org/)
6. Gagolewski, M., *Deep R Programming*, Chapter 10: S3 Classes. [Link](https://deepr.gagolewski.com/chapter/220-s3.html)
7. R Core Team, *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

1. [S3 Classes in R](S3-Classes-in-R.html), How to create and structure S3 classes with constructors, validators, and helpers.
2. [OOP in R: S3/S4/R6](OOP-in-R.html), Compare all three OOP systems and when to use each.
3. [R Environments](R-Environments.html), Understand where R searches for methods and how environments chain together.
