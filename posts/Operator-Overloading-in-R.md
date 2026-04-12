---
title: "Operator Overloading in R: Give Your S3 Objects Intuitive Behaviour"
slug: "Operator-Overloading-in-R"
description: "Define custom +, -, ==, [, print, and format methods for S3 objects in R so they behave naturally. Complete worked example building a physical units class."
keywords: "operator overloading in R, S3 Ops group generic, custom operators R, double dispatch R, S3 print method, format method R, R class methods, physical units class R"
auto_link_terms: "operator overloading in R|Ops group generic|S3 group generics|double dispatch|custom operators in R|print.class method|format.class method"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-12"
curriculum_id: "4.3.8"
post_type: "C"
sidebar_section: "Advanced R"
sidebar_title: "Operator Overloading"
sidebar_order: 17
---

# Operator Overloading in R: Give Your S3 Objects Intuitive Behaviour

<p class="lead"><strong>Operator overloading in R</strong> lets you define what <code>+</code>, <code>==</code>, <code>[</code>, and <code>print</code> do for your own S3 classes — so a length object adds in metres, a money object compares dollars, and every built-in operator keeps working the way it already looks.</p>

You already use overloaded operators every day. `Sys.Date() + 1` adds a day, not the integer 1 to a number. `factor("a") == "a"` compares labels, not the underlying integer codes. Both work because R's operators are S3 generics — ordinary functions that dispatch to methods based on class. The rest of this tutorial shows you how to write those methods for your own classes.

## What exactly is operator overloading in R?

Here is the shortest possible payoff. We'll define a tiny length class that stores metres, teach `+` how to add two of them, and teach `print` how to display them. Everything else in the tutorial builds on this three-line pattern.

```r
# A minimal S3 class for lengths in metres
length_m <- function(x) {
  structure(list(value = x), class = "length_m")
}

# Overload + for length_m
`+.length_m` <- function(e1, e2) {
  length_m(e1$value + e2$value)
}

# Teach R how to print length_m
print.length_m <- function(x, ...) {
  cat(x$value, "m\n")
  invisible(x)
}

a <- length_m(3)
b <- length_m(2)
a + b
#> 5 m
```

The constructor is a plain `list()` with a `class` attribute. `+.length_m` is a function whose name is the generic (`+`) followed by a dot and the class (`length_m`) — that's the whole recipe. When R sees `a + b` it checks the class of `a`, finds `+.length_m`, and calls it. The result is still a `length_m`, so `print()` also dispatches to our method and shows "5 m".

[KEY INSIGHT]
**R's operators are already S3 generics.** You aren't extending a language feature — you're writing one more method for a generic that base R ships with. That's why the machinery is so small: define a function with the right name and dispatch takes care of the rest.

**Try it:** Write `-.length_m` so that `a - b` returns a `length_m` holding the difference. Test it on `length_m(10) - length_m(4)`.

```r
# Try it: subtract two length_m values
`-.length_m` <- function(e1, e2) {
  # your code here
}

length_m(10) - length_m(4)
#> Expected: 6 m
```

<details>
<summary>Click to reveal solution</summary>

```r
`-.length_m` <- function(e1, e2) {
  length_m(e1$value - e2$value)
}
length_m(10) - length_m(4)
#> 6 m
```

**Explanation:** Subtraction follows the exact same pattern as addition — name the method `-.length_m`, do the arithmetic on the `value` field, and wrap the result back in the constructor so `print` still fires.

</details>

## How does R decide which operator method to call?

Binary operators like `+` have *two* arguments, so R can't dispatch on just the first one the way `print()` does. Instead, it uses **double dispatch**: it examines the class of both sides and picks a method that works for either. That's how `as.Date("2020-01-01") + 1` can find a date method even though `1` is a plain integer on the right.

```r
# Scalar addition — only the left side has a method
mixed <- a + 3
mixed
#> 6 m
```

The left operand has class `length_m`, the right is a plain number. R looks for a method on either side, finds only ours, and calls it. Our existing `+.length_m` happens to handle this correctly because `e2$value` on a bare number quietly becomes `NULL`… which would actually break. Let's see what a robust version looks like.

```r
# A safer + that handles length_m + numeric too
`+.length_m` <- function(e1, e2) {
  v1 <- if (inherits(e1, "length_m")) e1$value else e1
  v2 <- if (inherits(e2, "length_m")) e2$value else e2
  length_m(v1 + v2)
}

a + 3
#> 6 m
3 + a
#> 6 m
```

Now either side can be a plain number. This matters because double dispatch is commutative — R will call `+.length_m` for `3 + a` too, as long as at least one operand has the class. The method itself needs to stay symmetric, which is why we extract `v1` and `v2` before adding.

![How R resolves a binary operator across two argument classes.](screenshots/Operator-Overloading-in-R-dispatch-flow.webp)
*Figure 1: How R resolves a binary operator across two argument classes.*

Things get noisier when two custom classes collide. If the left and right sides each define their own `+` method and the methods disagree, R prints a warning and falls back to the internal numeric `+`, which almost never does what you want.

```r
# A conflicting class with its own + method
length_ft <- function(x) structure(list(value = x), class = "length_ft")
`+.length_ft` <- function(e1, e2) length_ft(e1$value + e2$value)

# These two methods disagree — warning + wrong result
suppressWarnings(a + length_ft(10))
#> $value
#> [1] 13
#> attr(,"class")
#> [1] "length_m"
```

R saw two different methods and couldn't decide, so it stripped the class wrapper and returned a malformed object. The fix is to make one method aware of the other — either convert `length_ft` to metres inside `+.length_m`, or define a shared parent class. The warning is R's way of telling you "your two classes haven't agreed on how to meet yet."

[WARNING]
**"Incompatible methods" warnings are a silent bug magnet.** The operation still returns something, just not what you expect. If you see this warning in your own code, stop and write an explicit conversion path between the two classes instead of letting R fall back to the internal operator.

**Try it:** Without running it, predict what `3 + a` returns. Check the dispatch rule: which operand is searched first?

```r
# Try it: predict the result of 3 + a
# Hint: R searches BOTH operands for methods
3 + a
#> Expected: 6 m
```

<details>
<summary>Click to reveal solution</summary>

```r
3 + a
#> 6 m
```

**Explanation:** Even though `3` is on the left and has no class, `a` on the right has class `length_m` and defines `+.length_m`. Double dispatch checks both operands, finds our method on the right, and calls it. The method extracts `v1 = 3` and `v2 = 3` and returns a `length_m` of 6.

</details>

## When should you use the Ops group generic instead?

Writing `+`, `-`, `*`, `/`, `==`, `!=`, `<`, `<=`, `>`, `>=` one by one gets old fast — that's ten methods just for basic arithmetic and comparison. R ships a shortcut: the **Ops group generic**. Define a single function called `Ops.yourclass` and R routes every operator in the group to it, passing the operator name in the special variable `.Generic`.

```r
# One method for all arithmetic + comparison
Ops.length_m <- function(e1, e2) {
  v1 <- if (inherits(e1, "length_m")) e1$value else e1
  v2 <- if (inherits(e2, "length_m")) e2$value else e2

  result <- get(.Generic)(v1, v2)

  # Comparisons return logical; arithmetic returns length_m
  if (.Generic %in% c("==", "!=", "<", "<=", ">", ">=")) {
    result
  } else if (.Generic %in% c("+", "-", "*", "/")) {
    length_m(result)
  } else {
    stop(.Generic, " is not defined for length_m")
  }
}
```

`.Generic` is a string like `"+"` or `"=="`, and `get(.Generic)` fetches the actual base function — that's how one method handles every operator. We branch at the end: arithmetic wraps the result back into a `length_m`, comparison returns a bare logical (because asking "is 3 m less than 5 m" should give `TRUE`, not a length object).

```r
# Arithmetic and comparison share the same method now
a + b
#> 5 m
a * 2
#> 6 m
a == b
#> [1] FALSE
a < b
#> [1] FALSE
```

All four call the same `Ops.length_m`. That's ten operators covered by one function — and when you need to add `%%` later, you just add it to the `if` branch. The pattern scales much better than writing individual methods.

![The three S3 group generics that cover most math and comparison needs.](screenshots/Operator-Overloading-in-R-group-generics.webp)
*Figure 2: The three S3 group generics that cover most math and comparison needs.*

[TIP]
**Use Ops for arithmetic and comparison, individual methods for the rest.** The group generic only handles operators in the Ops family. Subsetting (`[`, `[[`), display (`print`, `format`), and conversion (`as.character`) still need their own named methods.

**Try it:** The method above rejects `%%` (modulo) with an error. Extend the allowed-arithmetic branch so that `length_m(10) %% length_m(3)` returns `length_m(1)`.

```r
# Try it: add %% to the arithmetic branch
# Hint: edit the if/else chain in Ops.length_m
length_m(10) %% length_m(3)
#> Expected: 1 m
```

<details>
<summary>Click to reveal solution</summary>

```r
Ops.length_m <- function(e1, e2) {
  v1 <- if (inherits(e1, "length_m")) e1$value else e1
  v2 <- if (inherits(e2, "length_m")) e2$value else e2
  result <- get(.Generic)(v1, v2)
  if (.Generic %in% c("==", "!=", "<", "<=", ">", ">=")) {
    result
  } else if (.Generic %in% c("+", "-", "*", "/", "%%")) {
    length_m(result)
  } else {
    stop(.Generic, " is not defined for length_m")
  }
}
length_m(10) %% length_m(3)
#> 1 m
```

**Explanation:** Adding `"%%"` to the arithmetic whitelist lets the method wrap the modulo result in a `length_m`. The whitelist is your safety net — anything outside it hits the final `stop()` branch with a clear error.

</details>

## How do you make your class print and format nicely?

`print.length_m` above works, but it has a subtle weakness: only `print()` knows about units. If someone writes `paste("Height:", a)` they get back `"Height: list(value = 3)"` or worse. The clean solution is to split display into two methods. `format.class` produces the character representation; `print.class` calls `format` and adds any surrounding context.

```r
# Separate format from print
format.length_m <- function(x, ...) {
  paste0(x$value, " m")
}

print.length_m <- function(x, ...) {
  cat(format(x), "\n")
  invisible(x)
}

format(a)
#> [1] "3 m"
print(a)
#> 3 m
paste("Distance to work:", format(a))
#> [1] "Distance to work: 3 m"
```

`format()` returns a string, so everything that calls `format()` under the hood — `paste`, `sprintf`, `as.character`, data-frame printing — automatically picks up our unit suffix. `print.length_m` becomes a thin wrapper: one `cat()` and an invisible return so the object isn't duplicated on screen when printing is called implicitly.

[NOTE]
**Always return `invisible(x)` from a print method.** If you return `x` normally, calling `print(a)` from inside another function can re-trigger printing and double up the output. `invisible(x)` keeps the value available to the caller without displaying it.

**Try it:** Modify `format.length_m` so the number is shown with exactly two decimal places — for example, `length_m(3)` should display as `"3.00 m"`. Use `sprintf("%.2f", x$value)`.

```r
# Try it: two-decimal format
format.length_m <- function(x, ...) {
  # your code here
}

format(length_m(3))
#> Expected: "3.00 m"
```

<details>
<summary>Click to reveal solution</summary>

```r
format.length_m <- function(x, ...) {
  paste0(sprintf("%.2f", x$value), " m")
}
format(length_m(3))
#> [1] "3.00 m"
format(length_m(1.5))
#> [1] "1.50 m"
```

**Explanation:** `sprintf("%.2f", ...)` formats a number with two decimal places as a string. Wrapping it in `paste0` glues the unit suffix on. Because `print.length_m` calls `format`, the new formatting applies to `print(a)` as well — one change, two behaviours fixed.

</details>

## How do you overload `[` and `[[` for vectorised classes?

So far `length_m` has stored a single number. The more useful version stores a vector of values — a whole column of lengths — and supports subsetting. The trick is that `[` is *also* a generic, so you can write `[.length_m` to keep the class attached after a slice. The implementation uses `NextMethod()`, which calls the next method in the dispatch chain (here, plain numeric subsetting).

```r
# Vectorised length class
length_m <- function(x) {
  structure(list(value = x), class = "length_m")
}

`[.length_m` <- function(x, i) {
  length_m(x$value[i])
}

`[<-.length_m` <- function(x, i, value) {
  x$value[i] <- if (inherits(value, "length_m")) value$value else value
  x
}

lens <- length_m(c(10, 20, 30, 40, 50))
lens[2:4]
#> 20 30 40 m
lens[1] <- 99
lens
#> 99 20 30 40 50 m
```

`[.length_m` subsets the internal `value` vector and rewraps it — one line of real work. The replacement form `[<-.length_m` is a little more delicate because the `value` coming in might itself be a `length_m` (assigning one unit to another) or a bare number (assigning a literal). The guard checks which and extracts the underlying numbers before writing.

[WARNING]
**Never call your constructor inside `[.class` if your class can be subclassed.** Using the constructor forces the result back to the base class and strips subclass information. For single-class use the constructor is fine; if you plan to subclass, use `vctrs::vec_restore(NextMethod(), x)` instead so the subclass sticks around.

**Try it:** Write `[[.length_m` so that `lens[[3]]` returns a `length_m` holding just the third element. `[[` on a list normally returns the raw element; we want the class preserved.

```r
# Try it: [[ that keeps the length_m wrapper
`[[.length_m` <- function(x, i) {
  # your code here
}

lens[[3]]
#> Expected: 30 m
```

<details>
<summary>Click to reveal solution</summary>

```r
`[[.length_m` <- function(x, i) {
  length_m(x$value[[i]])
}
lens[[3]]
#> 30 m
```

**Explanation:** `[[.length_m` pulls out a single element with `x$value[[i]]` and rewraps it in the constructor. Without this method, `lens[[3]]` would strip the class and return a plain number — because `[[` dispatches on the underlying list, not the `length_m` wrapper.

</details>

## How do you also overload `Math`, `Summary`, and comparison operators?

Alongside `Ops`, R has two more group generics worth knowing. **Math** covers element-wise functions like `sqrt`, `log`, `abs`, `round`, `exp`. **Summary** covers reducers like `sum`, `min`, `max`, `all`, `any`. Both work the same way as `Ops`: one method, dispatch on `.Generic`.

```r
# Math group: element-wise functions
Math.length_m <- function(x, ...) {
  length_m(get(.Generic)(x$value, ...))
}

# Summary group: reducers that collapse to a single length_m
Summary.length_m <- function(..., na.rm = FALSE) {
  args <- list(...)
  values <- unlist(lapply(args, function(a) {
    if (inherits(a, "length_m")) a$value else a
  }))
  length_m(get(.Generic)(values, na.rm = na.rm))
}

abs(length_m(-7))
#> 7 m
sqrt(length_m(16))
#> 4 m
sum(lens)
#> 249 m
max(lens)
#> 99 m
```

`Math.length_m` is almost a one-liner because every Math function takes a single vector and returns another vector of the same length. `Summary.length_m` is slightly longer because `sum(a, b, c)` is valid — you might pass several length_m objects to reduce at once, so we `unlist` everything into a single numeric vector before reducing.

![The method family a rich S3 class typically ships with.](screenshots/Operator-Overloading-in-R-method-map.webp)
*Figure 3: The method family a rich S3 class typically ships with.*

[KEY INSIGHT]
**Group generics turn ~30 method definitions into 3.** Ops covers 16 arithmetic and comparison operators. Math covers roughly 20 element-wise functions. Summary covers 5 reducers. Three group methods give your class "first-class citizen" behaviour across base R without the tedium of writing each operator by hand.

**Try it:** You didn't define a method for `range()`, but try `range(lens)` anyway. Why does it work? (Hint: check `?range` for what it calls internally.)

<details>
<summary>Click to reveal solution</summary>

```r
range(lens)
#> 20 99 m
```

**Explanation:** `range()` is not in the Summary group itself, but internally it calls `min()` and `max()` — both of which *are* in Summary and have our method. So `range(lens)` hits `Summary.length_m` twice and returns a two-element `length_m`. This cascade is exactly why group generics are worth the small upfront effort.

</details>

## Practice Exercises

### Exercise 1: A Celsius temperature class

Build a `celsius()` constructor that stores a temperature. Use the `Ops` group generic so that `celsius(20) + celsius(5)` returns `celsius(25)`, and `celsius(20) > celsius(15)` returns `TRUE`. Also write `print.celsius` that displays `"20 °C"`.

```r
# Exercise 1: Celsius class
# Hint: model this on length_m's Ops method, but split arithmetic/comparison

celsius <- function(x) {
  # your constructor
}

Ops.celsius <- function(e1, e2) {
  # handle arithmetic vs comparison
}

print.celsius <- function(x, ...) {
  # display with °C suffix
}

# Test:
x1 <- celsius(20)
x2 <- celsius(5)
x1 + x2
#> 25 °C
x1 > celsius(15)
#> [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
celsius <- function(x) structure(list(value = x), class = "celsius")

Ops.celsius <- function(e1, e2) {
  v1 <- if (inherits(e1, "celsius")) e1$value else e1
  v2 <- if (inherits(e2, "celsius")) e2$value else e2
  result <- get(.Generic)(v1, v2)
  if (.Generic %in% c("==", "!=", "<", "<=", ">", ">=")) {
    result
  } else if (.Generic %in% c("+", "-", "*", "/")) {
    celsius(result)
  } else {
    stop(.Generic, " not supported for celsius")
  }
}

print.celsius <- function(x, ...) {
  cat(x$value, "°C\n")
  invisible(x)
}

x1 <- celsius(20)
x2 <- celsius(5)
x1 + x2
#> 25 °C
x1 > celsius(15)
#> [1] TRUE
```

**Explanation:** The structure mirrors `length_m` — the Ops method handles all operators in one place and branches on `.Generic` to decide whether the result stays wrapped (arithmetic) or collapses to a bare logical (comparison). The print method uses `cat()` with the `°C` glyph.

</details>

### Exercise 2: A currency-aware money class

Build a `money(amount, currency)` constructor that stores both an amount and a currency string. Overload `+.money` so adding two same-currency amounts works, but mixing currencies throws an error. Write `format.money` and `print.money` that produce `"$100.00 USD"`.

```r
# Exercise 2: money class with currency guard
money <- function(amount, currency = "USD") {
  # your constructor
}

`+.money` <- function(e1, e2) {
  # guard currency mismatch, then add
}

format.money <- function(x, ...) {
  # "$100.00 USD"
}

print.money <- function(x, ...) {
  # call format, then cat
}

# Test:
m1 <- money(50, "USD")
m2 <- money(25, "USD")
m1 + m2
#> $75.00 USD
```

<details>
<summary>Click to reveal solution</summary>

```r
money <- function(amount, currency = "USD") {
  structure(list(amount = amount, currency = currency), class = "money")
}

`+.money` <- function(e1, e2) {
  if (e1$currency != e2$currency) {
    stop("Cannot add ", e1$currency, " and ", e2$currency)
  }
  money(e1$amount + e2$amount, e1$currency)
}

format.money <- function(x, ...) {
  sprintf("$%.2f %s", x$amount, x$currency)
}

print.money <- function(x, ...) {
  cat(format(x), "\n")
  invisible(x)
}

m1 <- money(50, "USD")
m2 <- money(25, "USD")
m1 + m2
#> $75.00 USD
# money(10, "EUR") + m1   # would error: "Cannot add EUR and USD"
```

**Explanation:** The guard inside `+.money` is what makes the class safer than plain numbers — mixing currencies is almost always a bug, so the class refuses. `format.money` returns a string, and `print.money` delegates to it so `paste("Total:", format(m1))` also works correctly.

</details>

### Exercise 3: A 2-D point class without Ops

Build a `point(x, y)` constructor, then overload `+` and `-` as *individual* methods (not `Ops`) so you can add and subtract points component-wise. Add `==.point` comparing both coordinates, and `print.point` showing `"(3, 4)"`. This exercise is the "no shortcuts" version — it shows what the group generic was hiding.

```r
# Exercise 3: 2-D point using individual operator methods
point <- function(x, y) {
  # your constructor
}

`+.point` <- function(e1, e2) {
  # componentwise sum
}

`-.point` <- function(e1, e2) {
  # componentwise difference
}

`==.point` <- function(e1, e2) {
  # both x and y equal
}

print.point <- function(p, ...) {
  # "(x, y)"
}

# Test:
p1 <- point(3, 4)
p2 <- point(1, 2)
p1 + p2
#> (4, 6)
p1 == point(3, 4)
#> [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
point <- function(x, y) structure(list(x = x, y = y), class = "point")

`+.point` <- function(e1, e2) point(e1$x + e2$x, e1$y + e2$y)
`-.point` <- function(e1, e2) point(e1$x - e2$x, e1$y - e2$y)
`==.point` <- function(e1, e2) e1$x == e2$x && e1$y == e2$y

print.point <- function(p, ...) {
  cat("(", p$x, ",", p$y, ")\n", sep = "")
  invisible(p)
}

p1 <- point(3, 4)
p2 <- point(1, 2)
p1 + p2
#> (4,6)
p1 - p2
#> (2,2)
p1 == point(3, 4)
#> [1] TRUE
```

**Explanation:** Writing three separate methods works fine for a small class, but notice the pattern — each one unpacks `e1` and `e2`, does the same arithmetic on both fields, and rewraps. `Ops.point` would compress all three into one `.Generic`-driven block, which is exactly why the group generic exists.

</details>

## Complete Example: A physical units class

Here is an end-to-end class that combines everything from the tutorial. `units()` stores a numeric vector plus a unit string. It supports `Ops` (arithmetic and comparison), `print`/`format` (display with unit suffix), `[` (vector subsetting), and `Summary` (sum, max, min).

```r
# A complete physical-units class
units <- function(value, unit) {
  stopifnot(is.numeric(value), is.character(unit), length(unit) == 1)
  structure(list(value = value, unit = unit), class = "units")
}

Ops.units <- function(e1, e2) {
  u1 <- if (inherits(e1, "units")) e1$unit else NULL
  u2 <- if (inherits(e2, "units")) e2$unit else NULL
  unit <- u1 %||% u2
  if (!is.null(u1) && !is.null(u2) && u1 != u2) {
    stop("Cannot combine units '", u1, "' and '", u2, "'")
  }
  v1 <- if (inherits(e1, "units")) e1$value else e1
  v2 <- if (inherits(e2, "units")) e2$value else e2
  result <- get(.Generic)(v1, v2)
  if (.Generic %in% c("==", "!=", "<", "<=", ">", ">=")) {
    result
  } else if (.Generic %in% c("+", "-", "*", "/")) {
    units(result, unit)
  } else {
    stop(.Generic, " not supported for units")
  }
}

Summary.units <- function(..., na.rm = FALSE) {
  args <- list(...)
  values <- unlist(lapply(args, function(a) a$value))
  unit <- args[[1]]$unit
  units(get(.Generic)(values, na.rm = na.rm), unit)
}

format.units <- function(x, ...) {
  paste(x$value, x$unit)
}

print.units <- function(x, ...) {
  cat(format(x), "\n")
  invisible(x)
}

`[.units` <- function(x, i) {
  units(x$value[i], x$unit)
}

# The null-coalesce helper
`%||%` <- function(a, b) if (is.null(a)) b else a

# Put it to work
distances <- units(c(100, 250, 175, 330), "m")
distances[2:3]
#> 250 175 m

sum(distances)
#> 855 m
max(distances)
#> 330 m

distances + units(50, "m")
#> 150 300 225 380 m
distances > 200
#> [1] FALSE  TRUE FALSE  TRUE

# distances + units(10, "kg")  # would error: Cannot combine units 'm' and 'kg'
```

This one class shows every technique from the tutorial working together. `Ops.units` enforces unit compatibility at the boundary — trying to add metres to kilograms fails loudly instead of silently producing nonsense. `Summary.units` lets reducers like `sum` stay in "units-space". `[.units` keeps the class attached through subsetting. And the `format`/`print` pair ensures that whether you explicitly print or just paste the value into a sentence, the unit suffix travels along.

## Summary

| What you want | How to do it | Tiny example |
|---|---|---|
| Add two of your objects | Define `+.class` or `Ops.class` | `` `+.length_m` <- function(e1, e2) length_m(e1$value + e2$value) `` |
| One method for all arithmetic + comparison | Define `Ops.class`, branch on `.Generic` | `Ops.length_m <- function(e1, e2) {...}` |
| Pretty printing | Pair `format.class` with `print.class` | `format.length_m <- function(x, ...) paste0(x$value, " m")` |
| Subset a vectorised class | Define `[.class`, call constructor on the slice | `` `[.length_m` <- function(x, i) length_m(x$value[i]) `` |
| Element-wise math (`sqrt`, `abs`, `log`) | Define `Math.class` | `Math.length_m <- function(x, ...) length_m(get(.Generic)(x$value, ...))` |
| Reducers (`sum`, `max`, `min`) | Define `Summary.class` | `Summary.length_m <- function(...) {...}` |
| Compare custom objects | Let `Ops` handle it, or write `==.class` | `a == b` inside `Ops.length_m` returns a bare logical |

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 13: S3. [Link](https://adv-r.hadley.nz/s3.html)
2. Gagolewski, M. — *Deep R Programming*, Chapter 10: S3 classes. [Link](https://deepr.gagolewski.com/chapter/220-s3.html)
3. R Core Team — `?groupGeneric` (base R documentation). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/groupGeneric.html)
4. R Core Team — `?Ops`, `?Math`, `?Summary`. [Link](https://rdrr.io/r/base/groupGeneric.html)
5. Wickham, H. — *Advanced R*, §13.4 "Object styles" and §13.6.1 "Operators and double dispatch". [Link](https://adv-r.hadley.nz/s3.html#operators)
6. vctrs package — `?vec_arith` for modern arithmetic dispatch. [Link](https://vctrs.r-lib.org/reference/vec_arith.html)
7. units package — reference implementation of `Ops.units` for physical quantities. [Link](https://r-quantities.github.io/units/reference/Ops.units.html)

## Continue Learning

1. **[S3 Classes in R](S3-Classes-in-R.html)** — how to define the class structure your operator methods dispatch on.
2. **[S3 Method Dispatch in R](S3-Method-Dispatch-in-R.html)** — a deeper look at how R resolves a method call, including `NextMethod()` and inheritance chains.
3. **[R6 Classes in R](R6-Classes-in-R.html)** — the reference-semantics alternative when you need mutable state and don't want double-dispatch gymnastics.
