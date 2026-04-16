---
title: "R Data Types: Which Type Is Your Variable? (And Why It Matters)"
slug: "R-Data-Types"
description: "Learn R's 6 data types — numeric, integer, character, logical, complex, raw. How to check types, why coercion causes silent bugs, and when each belongs."
keywords: "R data types, numeric vs integer R, R class typeof, R type coercion, L suffix R, check data type R, R character vs factor"
auto_link_terms: "R data types|numeric in R|integer in R|character in R|logical in R|typeof()|class()|type coercion in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.1.5"
post_type: C
sidebar_section: "R Fundamentals"
sidebar_title: "R Data Types"
sidebar_order: 5
difficulty: "Beginner"
---

# R Data Types: Which Type Is Your Variable? (And Why It Matters)

<p class="lead">R has six basic data types — <strong>numeric</strong>, <strong>integer</strong>, <strong>character</strong>, <strong>logical</strong>, <strong>complex</strong>, and <strong>raw</strong> — and the type of a value decides what you can do with it. Get it wrong and your math turns into string concatenation, your filters return nothing, or your model silently drops rows.</p>

## What are R's six data types?

Before you can trust a number, you need to know whether R actually sees it as a number. Every value in R belongs to exactly one of six basic types, and one call to `class()` tells you which. Let's create one value of each type and ask R to identify them.

```r
weight     <- 72.5          # numeric (double)
age        <- 30L           # integer (note the L)
name       <- "Selva"       # character
is_raining <- TRUE          # logical
signal     <- 1 + 2i        # complex
byte       <- as.raw(255)   # raw

c(class(weight), class(age), class(name),
  class(is_raining), class(signal), class(byte))
#> [1] "numeric"   "integer"   "character" "logical"   "complex"   "raw"
```

Six values, six different types. `weight` is **numeric** because `72.5` has a decimal. `age` is **integer** only because we added the `L` suffix — without it, R would store `30` as numeric too. `name` is **character** (always quoted). `is_raining` is **logical** (the Boolean). `signal` is **complex** (has an imaginary part). `byte` is **raw** (low-level bytes). That's the whole family.

**Try it:** Create a variable `ex_city` holding the string `"Chennai"` and print its class.

```r
# Try it: store a city name and check its type
ex_city <- # your code here

class(ex_city)
#> Expected: [1] "character"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_city <- "Chennai"
class(ex_city)
#> [1] "character"
```

**Explanation:** Any value wrapped in quotes becomes a character, regardless of what's inside the quotes — even `"123"` is character, not numeric.

</details>

## How do I check a variable's type?

Knowing the types exist is one thing; checking them in running code is another. R gives you two families of tools: `class()` returns the type as a string, and `is.*()` functions return `TRUE` or `FALSE` for a specific type. Use `class()` when you want to know *which* type a value is, and `is.numeric()` / `is.character()` / `is.logical()` when you want to test *if* it's a particular type inside an `if` statement.

```r
class(weight)
#> [1] "numeric"

is.numeric(weight)
#> [1] TRUE

is.character(name)
#> [1] TRUE

is.logical(is_raining)
#> [1] TRUE

is.numeric("72.5")   # quoted, so it's character — not numeric!
#> [1] FALSE
```

The last line is the trap every beginner hits. `"72.5"` *looks* like a number but it's wrapped in quotes, so R stores it as character. `is.numeric()` correctly says `FALSE`. This is exactly why data read from CSVs with a single stray non-numeric cell comes in as character — more on that in the coercion section.

**Try it:** Check whether the comparison `5 > 3` produces a logical value.

```r
# Try it: store the comparison result and test its type
ex_check <- # your code here

is.logical(ex_check)
#> Expected: [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_check <- 5 > 3
is.logical(ex_check)
#> [1] TRUE
```

**Explanation:** Comparison operators (`>`, `<`, `==`, `!=`) always return logical values, which is why they drop straight into `if` conditions and `filter()` calls.

</details>

## What's the difference between class(), typeof(), and mode()?

R has three functions that all seem to answer "what type is this?" and they disagree just often enough to cause confusion. Here's the rule: **`class()`** tells you the object's high-level class (what it behaves like), **`typeof()`** tells you how R stores it internally, and **`mode()`** is a legacy base-R category that you'll rarely need. Seeing them side-by-side makes the difference obvious.

```r
check_type <- function(x) {
  data.frame(value = deparse(x), class = class(x), typeof = typeof(x), mode = mode(x))
}

rbind(
  check_type(72.5),
  check_type(30L),
  check_type("Selva"),
  check_type(TRUE),
  check_type(1 + 2i),
  check_type(as.raw(255))
)
#>     value     class    typeof      mode
#> 1    72.5   numeric    double   numeric
#> 2     30L   integer   integer   numeric
#> 3 "Selva" character character character
#> 4    TRUE   logical   logical   logical
#> 5    1+2i   complex   complex   complex
#> 6      ff       raw       raw       raw
```

Look at the first two rows. `72.5` has class `"numeric"` but typeof `"double"` — that's because in R, "numeric" is the user-facing name for the double-precision floating point type. And both `72.5` and `30L` have mode `"numeric"` because mode lumps integers and doubles together. For day-to-day work, `class()` is the one you want; `typeof()` matters when you care about storage (integer overflow, memory); `mode()` is a holdover from S that you can mostly ignore.

[KEY INSIGHT]
**`class()` tells you what an object *acts* like; `typeof()` tells you how R *stores* it.** A data frame has class `"data.frame"` but typeof `"list"`, because internally a data frame is a list of columns. Knowing this difference is how you debug "why doesn't my function work on this object?" bugs.

**Try it:** Print `typeof(5)` and `typeof(5L)` side-by-side.

```r
# Try it: show that 5 and 5L have different storage types
c(typeof(5), typeof(5L))
#> Expected: [1] "double"  "integer"
```

<details>
<summary>Click to reveal solution</summary>

```r
c(typeof(5), typeof(5L))
#> [1] "double"  "integer"
```

**Explanation:** `5` with no suffix is stored as a double (R's default), while `5L` with the `L` suffix forces integer storage. `class()` would also show the difference (`"numeric"` vs `"integer"`).

</details>

## Why does numeric really mean "double" in R?

When most languages say "number" they mean integer. R flips that: every number you type is a **double** (a 64-bit floating-point number) unless you explicitly ask for an integer. That's why `class(5)` returns `"numeric"` and `typeof(5)` returns `"double"`. If you want an actual integer you must add the `L` suffix — `5L` — or use `as.integer(5)`. This matters more than it sounds, because doubles and integers behave differently at extremes.

```r
# Without the L suffix, R stores numbers as doubles
typeof(1000)
#> [1] "double"

typeof(1000L)
#> [1] "integer"

# Integers max out at ~2.1 billion and overflow to NA with a warning
big_num <- .Machine$integer.max   # 2147483647
big_num + 1L
#> Warning: NAs produced by integer overflow
#> [1] NA

# Doubles handle the same value with room to spare
small_num <- as.double(big_num) + 1
small_num
#> [1] 2147483648
```

The integer overflow is a real gotcha. If you've got a counter that might cross 2.1 billion — row counts, byte totals, millisecond timestamps — an integer column will silently become `NA`. Doubles go to roughly `1.8 × 10^308` before overflowing, so they're the safer default for anything that might grow. That's precisely why R picked double as the default: one fewer surprise for scientific users.

[TIP]
**Use the L suffix when you genuinely need an integer and you won't overflow.** Integer storage is half the memory of double (4 bytes vs 8), which matters for vectors of millions of counts or IDs. For casual scripting, just use plain numbers and let R default to double.

**Try it:** Create an integer variable `ex_count` holding `100` using the `L` suffix and print its class.

```r
# Try it: make a real integer, not a double
ex_count <- # your code here

class(ex_count)
#> Expected: [1] "integer"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_count <- 100L
class(ex_count)
#> [1] "integer"
```

**Explanation:** Without the `L`, `100` would be a double. The `L` tells R "this is a literal integer" — the same idea as the `L` suffix for `long` in C or Java, where R's designers borrowed the notation.

</details>

## How does R coerce types automatically?

R doesn't let values of different types sit side-by-side in the same vector — everything in `c(...)` must share one type. When you mix types, R silently **coerces** them all to the single most flexible type in the group, following a strict hierarchy: **logical → integer → double → complex → character**. Character always wins because any value can be written as text.

![R type coercion ladder](screenshots/R-Data-Types-coercion-ladder.webp)
*Figure 1: R's type coercion ladder — the "higher" type always wins when values are mixed in the same vector.*

The ladder is easier to understand by example. Let's mix a number with a string and watch what happens.

```r
# Mix a number and a character in one vector
mixed <- c(1, 2, "three")
mixed
#> [1] "1"     "2"     "three"

class(mixed)
#> [1] "character"

# Now the "numbers" are strings — arithmetic fails
sum(mixed)
#> Error in sum(mixed) : invalid 'type' (character) of argument
```

That single `"three"` turned the other two numbers into strings `"1"` and `"2"`, and `sum()` now throws an error. This is the single most common "my CSV won't add up" bug in R: one typo or one header row bleeding into the data makes the whole column character. The fix is either `as.numeric(mixed)` (which turns `"three"` into `NA`) or cleaning the source data.

Coercion also works the other way — when logicals meet arithmetic, R promotes `TRUE` to `1L` and `FALSE` to `0L`. That's how you count matches in a vector.

```r
# TRUE becomes 1, FALSE becomes 0 in arithmetic
logic_math <- c(TRUE, FALSE, TRUE, TRUE, FALSE)
sum(logic_math)
#> [1] 3

mean(logic_math)
#> [1] 0.6
```

Three `TRUE`s means `sum()` returns `3`, and `mean()` returns the proportion of `TRUE`s — a handy trick for computing "what fraction of my rows match this condition?" without a separate count.

[KEY INSIGHT]
**Coercion is silent, which is what makes it dangerous.** R won't warn you that your vector of numbers became a vector of strings — you only find out when arithmetic breaks downstream. Whenever a calculation returns an unexpected result, `class()` your inputs first.

**Try it:** Predict the class of `c(TRUE, 1L, 2.5)` before running the code.

```r
# Try it: what type wins when logical + integer + double mix?
ex_pred <- c(TRUE, 1L, 2.5)
class(ex_pred)
#> Expected: [1] "numeric"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_pred <- c(TRUE, 1L, 2.5)
class(ex_pred)
#> [1] "numeric"
ex_pred
#> [1] 1.0 1.0 2.5
```

**Explanation:** Double is higher on the ladder than integer, which is higher than logical, so all three values coerce up to double. `TRUE` becomes `1.0` and `1L` becomes `1.0`.

</details>

## What about NA, NULL, NaN, and Inf?

Not every value in R is a regular type — some represent "missing", "nothing", or "impossible." The four special values you'll meet are **NA** (missing), **NULL** (absent), **NaN** (not a number), and **Inf** (infinity). They look similar but behave very differently, and confusing them is a top source of bugs.

![NA vs NULL vs NaN vs Inf](screenshots/R-Data-Types-special-values.webp)
*Figure 3: NA, NULL, NaN, and Inf — four different "missing-ish" values that behave very differently.*

```r
missing  <- NA         # a missing value — has a type
empty    <- NULL       # no value at all — length 0
not_num  <- 0 / 0      # NaN: not a number
infinity <- 1 / 0      # Inf: positive infinity

c(class(missing), class(empty), class(not_num), class(infinity))
#> [1] "logical" "NULL"    "numeric" "numeric"

# Length comparison tells you which is which
c(length(missing), length(empty), length(not_num), length(infinity))
#> [1] 1 0 1 1
```

`NA` has **length 1** and a type (`"logical"` by default, though typed variants like `NA_integer_` exist). `NULL` has **length 0** — it's not a placeholder, it's truly nothing. `NaN` and `Inf` are both numeric; `NaN` comes from undefined operations like `0/0`, `Inf` from divisions like `1/0`. Your tests for them differ too: `is.na()` catches `NA` and `NaN`, `is.null()` catches only `NULL`, and `is.infinite()` catches `Inf`.

[WARNING]
**`is.na(NULL)` returns `logical(0)`, not `FALSE`.** Because `NULL` has zero length, `is.na()` returns a zero-length logical — which is neither `TRUE` nor `FALSE` and can crash `if` statements. Always use `is.null()` for `NULL` checks and `is.na()` for `NA` checks. Never mix them up.

**Try it:** Count how many `NA`s are in the vector `c(1, NA, 3, NA, 5)`.

```r
# Try it: use sum() on is.na() to count missing values
ex_nas <- c(1, NA, 3, NA, 5)
sum(is.na(ex_nas))
#> Expected: [1] 2
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_nas <- c(1, NA, 3, NA, 5)
sum(is.na(ex_nas))
#> [1] 2
```

**Explanation:** `is.na()` returns a logical vector, and `sum()` coerces logicals to integers (`TRUE` → 1, `FALSE` → 0), giving you the count. This is the idiomatic R way to count missing values.

</details>

## Which type should I use when?

With six types to choose from, the decision is usually obvious — but not always. Here's a practical decision tree: if the value is text, use **character**; if it's TRUE/FALSE, use **logical**; if it's a whole number that will never go near 2 billion, **integer** saves memory; otherwise use **numeric** (double). **Complex** and **raw** are specialist types — you'll know when you need them.

![Which R data type should I use?](screenshots/R-Data-Types-decision-tree.webp)
*Figure 2: A decision tree for picking the right data type.*

```r
# A realistic case: an age column
ages <- c(24L, 31L, 45L, 29L, 38L)   # integers — ages are whole numbers
class(ages)
#> [1] "integer"

mean(ages)   # still works — integers coerce to double for the mean
#> [1] 33.4
```

Ages are whole numbers, they never get huge, and you want memory efficiency when you've got millions of rows — so integer is the right pick. Notice that `mean()` still returns a decimal; R coerced the integer vector to double for the calculation. You get compact storage *and* accurate statistics.

[TIP]
**Prefer character over factor for free-text columns.** Factors store categories efficiently but they trip you up when you try to add a new level or merge two datasets with different factor orders. Use character as the default and convert to factor only when you genuinely need ordered levels for modeling or plotting.

[NOTE]
**The raw type is rare in day-to-day R.** You'll see it mostly when reading binary files, doing cryptography, or interfacing with C code. If you're not sure whether you need it, you don't.

**Try it:** Pick the right type for a vector of temperatures in Celsius and create it.

```r
# Try it: temperatures can be decimals — which type?
ex_temps <- # your code here

class(ex_temps)
#> Expected: [1] "numeric"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_temps <- c(22.5, 19.8, 25.1, 21.0)
class(ex_temps)
#> [1] "numeric"
```

**Explanation:** Temperatures can have decimals, so double (numeric) is the right pick. Using integer would force rounding and lose precision.

</details>

## Practice Exercises

Time to put everything together. These capstones combine type checking, coercion, and picking the right type.

### Exercise 1: Type detective

Given the vector `my_values <- list(42, 42L, "42", TRUE, 4 + 0i)`, print the `class()` and `typeof()` of each element. Predict the answers before you run the code.

```r
# Exercise 1: inspect each element
my_values <- list(42, 42L, "42", TRUE, 4 + 0i)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_values <- list(42, 42L, "42", TRUE, 4 + 0i)
data.frame(
  value  = sapply(my_values, deparse),
  class  = sapply(my_values, class),
  typeof = sapply(my_values, typeof)
)
#>   value     class    typeof
#> 1    42   numeric    double
#> 2   42L   integer   integer
#> 3  "42" character character
#> 4  TRUE   logical   logical
#> 5  4+0i   complex   complex
```

**Explanation:** `42` and `42L` look identical but have different storage types. `"42"` is character even though it looks like a number. `4 + 0i` is complex even though the imaginary part is zero — the `i` forced the type.

</details>

### Exercise 2: Fix the silent bug

The vector `my_broken <- c(10, 20, "30")` won't sum because the `"30"` poisoned the whole vector. Fix it by converting to numeric, then compute the sum as `my_fixed`.

```r
# Exercise 2: fix the type, then sum
my_broken <- c(10, 20, "30")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_broken <- c(10, 20, "30")
class(my_broken)
#> [1] "character"

my_fixed <- sum(as.numeric(my_broken))
my_fixed
#> [1] 60
```

**Explanation:** `as.numeric()` coerces `"30"` back into a number. If the vector contained a genuine non-number like `"three"`, you'd get `NA` with a warning — which is how R tells you the cast failed.

</details>

### Exercise 3: Memory showdown

Create two vectors of 1 million values — one using integers (`1L:1000000L`) and one using doubles (`1:1000000 * 1.0`). Compare their memory footprints with `object.size()`.

```r
# Exercise 3: measure memory for integer vs double
my_ints <- # your code here
my_dbls <- # your code here

c(integer_kb = object.size(my_ints), double_kb = object.size(my_dbls))

```

<details>
<summary>Click to reveal solution</summary>

```r
my_ints <- 1L:1000000L
my_dbls <- 1:1000000 * 1.0
c(integer_kb = object.size(my_ints), double_kb = object.size(my_dbls))
#> integer_kb  double_kb
#>    4000048    8000048
```

**Explanation:** Integers use 4 bytes each; doubles use 8 bytes each. For a million elements that's a 4 MB difference — trivial on a laptop, but meaningful when you scale to hundreds of millions of rows.

</details>

## Putting It All Together

Let's build a tiny weather log that uses four different types correctly — and then spot a contamination bug that beginners hit constantly.

```r
# Build a weather log using the right type for each column
weather <- data.frame(
  date        = c("2026-04-08", "2026-04-09", "2026-04-10"),
  temperature = c(22.5, 19.8, 25.1),
  raining     = c(FALSE, TRUE, FALSE),
  station_id  = c(101L, 102L, 101L)
)

# Check every column's type
sapply(weather, class)
#>        date temperature     raining  station_id
#> "character"   "numeric"   "logical"   "integer"

# Compute stats — works because each column has the right type
mean(weather$temperature)
#> [1] 22.46667

sum(weather$raining)         # TRUE coerces to 1 in arithmetic
#> [1] 1

# Now break it: one temperature gets read as "--" from a broken sensor
broken <- weather
broken$temperature <- c("22.5", "--", "25.1")

class(broken$temperature)
#> [1] "character"

mean(broken$temperature)
#> Warning: argument is not numeric or logical: returning NA
#> [1] NA
```

Each column got the right type the first time: character for free text, numeric for measurements, logical for flags, integer for IDs. `mean()` and `sum()` work directly because the types match the operations. Then we broke `temperature` by inserting `"--"` — a single bad cell made the whole column character, and `mean()` can't process strings. This is exactly what happens when you read messy CSVs — the fix is either `readr::read_csv()` (which reports parse errors) or `as.numeric()` with explicit NA handling.

## Summary

| Type | Example | class() | typeof() | When to use |
|---|---|---|---|---|
| numeric | `72.5` | `"numeric"` | `"double"` | Default for any number — measurements, statistics, money |
| integer | `30L` | `"integer"` | `"integer"` | Counts, IDs, indexes — saves memory at scale |
| character | `"Selva"` | `"character"` | `"character"` | Any text — names, labels, categories |
| logical | `TRUE` | `"logical"` | `"logical"` | Boolean flags, comparison results, filter masks |
| complex | `1 + 2i` | `"complex"` | `"complex"` | Signal processing, FFTs — rare in stats work |
| raw | `as.raw(255)` | `"raw"` | `"raw"` | Binary files, bytes, cryptography — specialist use |

The three rules that catch 90% of type bugs:

1. **Check before you calculate.** `class()` and `typeof()` are your friends — use them whenever something feels off.
2. **One bad cell contaminates the whole vector.** Mix a string in with numbers and R silently turns everything character.
3. **Doubles are the safe default; integers are an optimization.** Only reach for `L` when you have millions of counts and memory matters.

## References

1. R Core Team — *An Introduction to R*, Section 2: Simple manipulations; numbers and vectors. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Simple-manipulations-numbers-and-vectors)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 3: Vectors. [Link](https://adv-r.hadley.nz/vectors-chap.html)
3. R documentation — `?numeric`, `?integer`, `?character`, `?logical`. Run `?typeof` in R for full details.
4. Burns, P. — *The R Inferno*, Circle 8: "Believing it does as intended" (coercion traps). [Link](https://www.burns-stat.com/pages/Tutor/R_inferno.pdf)
5. Tidyverse — `readr` type guessing and the `col_types` argument. [Link](https://readr.tidyverse.org/articles/readr.html)

## Continue Learning

- [R Vectors](R-Vectors.html) — how types combine with length to form R's most important data structure.
- [R Type Coercion](R-Type-Coercion.html) — a deeper dive on automatic conversions, gotchas, and the full coercion rulebook.
- [R Special Values](R-Special-Values.html) — full coverage of NA, NULL, NaN, and Inf with every function that handles them.
