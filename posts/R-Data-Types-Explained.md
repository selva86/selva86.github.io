# R Data Types: Which Type Is Your Variable? (And Why It Matters)

R has six data types: numeric, integer, character, logical, complex, and raw. Every variable you create belongs to one of these types, and the type determines what operations you can perform on it. Get the type wrong and your code breaks in surprising ways.

This tutorial shows you every data type, how to check and convert between them, and the coercion traps that catch beginners.

## The 6 Data Types at a Glance

| Type | What It Stores | Example | Check With |
|------|---------------|---------|------------|
| numeric | Decimal numbers | `3.14` | `is.numeric()` |
| integer | Whole numbers | `5L` | `is.integer()` |
| character | Text strings | `"hello"` | `is.character()` |
| logical | TRUE/FALSE | `TRUE` | `is.logical()` |
| complex | Complex numbers | `3+2i` | `is.complex()` |
| raw | Raw bytes | `charToRaw("A")` | `is.raw()` |

## Numeric: The Default Number Type

Every number you type in R is numeric (also called "double") by default. Even whole numbers like `5` are stored as numeric unless you say otherwise.

```r
x <- 42
class(x)
typeof(x)

pi_val <- 3.14159
class(pi_val)

# Even this is numeric, not integer
whole <- 10
is.integer(whole)
is.numeric(whole)
```

The `class()` function tells you what R thinks the variable is. The `typeof()` function tells you how R stores it internally. For numbers, `class()` returns `"numeric"` and `typeof()` returns `"double"`.

## Integer: Whole Numbers with the L Suffix

To create a true integer, add `L` after the number. Integers use less memory than numeric values, which matters with large datasets.

```r
# Create an integer with L suffix
count <- 5L
class(count)
typeof(count)

# Compare memory usage
cat("Numeric size:", object.size(rep(1.0, 1000)), "bytes\n")
cat("Integer size:", object.size(rep(1L, 1000)), "bytes\n")

# Ranges created with : are integer
sequence <- 1:10
class(sequence)
```

When does integer vs numeric matter? Rarely in practice. R handles the conversion automatically. But if you work with millions of rows, integers save about half the memory.

## Character: Text Strings

Characters store text. Wrap text in single or double quotes.

```r
name <- "Alice"
greeting <- 'Hello, world!'

class(name)

# Get string length
nchar(name)

# Combine strings
paste("Hello", name)
paste0("Score: ", 95)

# Convert number to text
num_text <- as.character(42)
class(num_text)
```

A common mistake: numbers stored as characters look like numbers but behave like text. You cannot do math on them.

```r
# This looks like a number but it is text
price <- "29.99"
class(price)

# This fails
# price + 10  # Error!

# Convert first, then do math
as.numeric(price) + 10
```

## Logical: TRUE and FALSE

Logical values come from comparisons. They are the backbone of filtering and conditional logic in R.

```r
is_active <- TRUE
has_passed <- FALSE
class(is_active)

# Comparisons produce logicals
10 > 5
"apple" == "orange"

# Logicals are secretly 0 and 1
TRUE + TRUE + FALSE
sum(c(TRUE, TRUE, FALSE, TRUE))
mean(c(TRUE, FALSE, TRUE, TRUE))
```

That last trick is powerful. Since `TRUE` equals 1 and `FALSE` equals 0, you can use `sum()` to count how many values meet a condition, and `mean()` to get the proportion.

## Complex: Numbers with Imaginary Parts

Complex numbers have a real and imaginary component. You will only need these in mathematics, physics, or signal processing.

```r
z <- 3 + 2i
class(z)

# Real and imaginary parts
Re(z)
Im(z)
Mod(z)

# Complex arithmetic
z2 <- 1 - 1i
z + z2
z * z2
```

## Raw: Byte-Level Data

Raw stores data as raw bytes. This type is rare — you might see it when reading binary files or working with low-level data.

```r
r <- charToRaw("Hello")
r
class(r)

# Convert back
rawToChar(r)
```

## Checking Types: class(), typeof(), is.*()

R gives you three families of functions to inspect types.

```r
x <- 42L

# class() — what R calls it
class(x)

# typeof() — how R stores it internally
typeof(x)

# is.*() — ask yes/no questions
is.integer(x)
is.numeric(x)
is.character(x)
```

Here is a comparison of what each function returns for every type:

| Value | class() | typeof() | is.numeric() |
|-------|---------|----------|--------------|
| `3.14` | numeric | double | TRUE |
| `5L` | integer | integer | TRUE |
| `"hi"` | character | character | FALSE |
| `TRUE` | logical | logical | FALSE |
| `3+2i` | complex | complex | FALSE |

Notice that `is.numeric()` returns TRUE for both numeric and integer. This is by design — integers are a subset of numeric values.

```r
# Demonstrate is.numeric() returns TRUE for integers too
cat("is.numeric(5L):", is.numeric(5L), "\n")
cat("is.integer(5.0):", is.integer(5.0), "\n")
cat("is.double(5L):", is.double(5L), "\n")
cat("is.double(5.0):", is.double(5.0), "\n")
```

## Type Coercion: Automatic Conversion

When you mix types in a vector, R silently converts everything to a common type. This is called coercion, and it follows a strict hierarchy:

**logical → integer → numeric → complex → character**

The rule: R converts to the most flexible type needed to hold all values without losing information.

```r
# Mixing numeric and character → everything becomes character
mixed <- c(1, "two", 3)
mixed
class(mixed)

# Mixing logical and numeric → logical becomes 0/1
mixed2 <- c(TRUE, 5, FALSE)
mixed2
class(mixed2)

# Mixing integer and numeric → everything becomes numeric
mixed3 <- c(1L, 2.5, 3L)
mixed3
class(mixed3)
```

This automatic coercion is one of the most common sources of bugs in R. You think you have numbers, but one character value turned the entire vector into text.

```r
# A realistic bug: one bad value ruins the column
scores <- c(85, 92, "N/A", 78, 91)
class(scores)

# Now math fails silently
mean(scores)  # NA with warning

# The fix: convert and handle missing values
scores_clean <- as.numeric(scores)
scores_clean
mean(scores_clean, na.rm = TRUE)
```

## Explicit Conversion with as.*()

Use the `as.*()` family to convert between types on purpose.

```r
# Character to numeric
as.numeric("3.14")

# Numeric to integer
as.integer(3.7)  # Truncates, does NOT round

# Numeric to character
as.character(100)

# Logical to numeric
as.numeric(TRUE)
as.numeric(FALSE)

# Character to logical
as.logical("TRUE")
as.logical("yes")  # NA — only "TRUE"/"FALSE" work

# Numeric to logical
as.logical(0)    # FALSE
as.logical(1)    # TRUE
as.logical(-5)   # TRUE (any non-zero is TRUE)
```

Notice: `as.integer()` truncates toward zero, not rounds. If you want rounding, use `round()` first.

## Common Bugs from Wrong Types

### Bug 1: Reading CSV imports numbers as text

```r
# Simulate reading a CSV where a column has mixed values
data <- data.frame(
  name = c("Alice", "Bob", "Carol"),
  score = c("85", "92", "78"),
  stringsAsFactors = FALSE
)

class(data$score)

# Fix: convert the column
data$score <- as.numeric(data$score)
class(data$score)
mean(data$score)
```

### Bug 2: Factor surprise

```r
# Factors look like text but behave differently
colors <- factor(c("red", "blue", "red", "green"))
class(colors)
levels(colors)

# Converting factor to numeric gives level codes, not the text
as.numeric(colors)

# Correct way: convert to character first
as.character(colors)
```

### Bug 3: NULL vs NA vs NaN

```r
# NA — "missing value" (exists but unknown)
x <- NA
is.na(x)
class(NA)

# NULL — "nothing" (does not exist)
y <- NULL
is.null(y)
length(y)

# NaN — "not a number" (result of impossible math)
z <- 0/0
is.nan(z)
is.na(z)  # NaN is also NA

cat("NA in math:", 5 + NA, "\n")
cat("NULL in vector:", length(c(1, NULL, 3)), "\n")
```

Key difference: NA is a placeholder that preserves vector length. NULL is removed entirely.

## Practice Exercises

### Exercise 1: Identify the type
Predict the class of each variable, then check.

```r
# What type is each variable?
a <- 100
b <- 100L
c <- "100"
d <- TRUE
e <- 1 + 0i

# Check your predictions
cat("a:", class(a), "\n")
cat("b:", class(b), "\n")
cat("c:", class(c), "\n")
cat("d:", class(d), "\n")
cat("e:", class(e), "\n")
```

### Exercise 2: Fix the coercion bug
This code gives the wrong answer. Find and fix the bug.

```r
# Bug: why does this give NA?
temps <- c(72, 75, "missing", 80, 68)
avg_temp <- mean(temps)
cat("Average temperature:", avg_temp, "\n")
```

<details><summary>Solution</summary>

```r
temps <- c(72, 75, NA, 80, 68)
avg_temp <- mean(temps, na.rm = TRUE)
cat("Average temperature:", avg_temp, "\n")
```

The string `"missing"` caused coercion to character. Use `NA` for missing values instead.

</details>

### Exercise 3: Type conversion chain
Convert `TRUE` through every type in the coercion hierarchy and print each result.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
val <- TRUE
cat("Logical:", val, "— class:", class(val), "\n")

val <- as.integer(val)
cat("Integer:", val, "— class:", class(val), "\n")

val <- as.numeric(val)
cat("Numeric:", val, "— class:", class(val), "\n")

val <- as.complex(val)
cat("Complex:", val, "— class:", class(val), "\n")

val <- as.character(val)
cat("Character:", val, "— class:", class(val), "\n")
```

</details>

### Exercise 4: Safe numeric conversion
Write a function that converts a vector to numeric, prints a warning for values that become NA, and returns the clean result.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
safe_numeric <- function(x) {
  result <- suppressWarnings(as.numeric(x))
  bad <- which(is.na(result) & !is.na(x))
  if (length(bad) > 0) {
    cat("Warning: could not convert:", x[bad], "\n")
  }
  result
}

test <- c("10", "20", "abc", "30", "N/A")
safe_numeric(test)
```

</details>

## FAQ

### What is the difference between class() and typeof()?

`class()` returns the high-level type that R uses for method dispatch (e.g., `"numeric"`, `"data.frame"`). `typeof()` returns the low-level storage mode (e.g., `"double"`, `"list"`). For most work, `class()` is what you want.

### Why does is.numeric(5L) return TRUE?

Because integers are a subset of numeric values. If you need to check specifically for integer, use `is.integer()`. If you want to check for double (decimal), use `is.double()`.

### When should I use integer instead of numeric?

Use integer when you know values are whole numbers and memory matters — large datasets with millions of rows. In everyday analysis, the difference is negligible.

### What happens when I add a number and a string?

R throws an error: `non-numeric argument to binary operator`. Unlike some languages, R does not auto-convert strings to numbers for arithmetic. Use `as.numeric()` first.

### How do I check if a value is NA?

Use `is.na(x)`, never `x == NA`. The comparison `x == NA` always returns NA because any comparison with NA is unknown.

## Conclusion

R's type system is simple — six types cover everything. The critical skill is recognizing when coercion happens silently and knowing how to fix it. Use `class()` to check types, `as.*()` to convert, and `is.*()` to test. When a calculation gives unexpected results, check your types first.

Next, learn about vectors — R's fundamental data structure that holds collections of values of the same type.
