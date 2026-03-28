# R Vectors: The Foundation of Everything in R (Master This First)

Vectors are R's most fundamental data structure. A vector is an ordered collection of values of the same type — like a column in a spreadsheet. Nearly everything in R is a vector or built from vectors. Master vectors first and everything else in R becomes easier.

This tutorial covers creating, naming, indexing, and operating on vectors with interactive code you can run in your browser.

## What Is a Vector?

A vector is a one-dimensional sequence of values that all share the same type. If you try to mix types, R coerces them to a common type.

```r
# A numeric vector
temps <- c(72, 75, 68, 80, 77)
temps
class(temps)
length(temps)
```

The `c()` function (short for "combine") is the most common way to create vectors.

## Creating Vectors

### c() — Combine Values

```r
# Numeric vector
prices <- c(9.99, 14.50, 3.75, 22.00)
prices

# Character vector
cities <- c("NYC", "LA", "Chicago", "Houston")
cities

# Logical vector
passed <- c(TRUE, FALSE, TRUE, TRUE, FALSE)
passed
```

### seq() — Generate Sequences

```r
# Sequence from 1 to 10
seq(1, 10)

# Sequence with step size
seq(0, 1, by = 0.2)

# Sequence of specific length
seq(1, 100, length.out = 5)

# Shortcut: the colon operator
1:10
10:1
```

### rep() — Repeat Values

```r
# Repeat a single value
rep(0, times = 5)

# Repeat a vector
rep(c(1, 2, 3), times = 3)

# Repeat each element
rep(c("A", "B", "C"), each = 2)

# Combine times and each
rep(c("X", "O"), times = 3, each = 2)
```

### Other Creation Methods

```r
# vector() — create an empty vector of a given type
v <- vector("numeric", length = 5)
v

# numeric(), character(), logical() — shorthand
numeric(3)
character(4)
logical(2)
```

## Naming Vectors

You can give each element a name. Named vectors are easier to read and can be indexed by name.

```r
# Name during creation
scores <- c(Alice = 92, Bob = 85, Carol = 91, Dave = 78)
scores

# Name after creation
temps <- c(72, 75, 68, 80)
names(temps) <- c("Mon", "Tue", "Wed", "Thu")
temps

# Get the names
names(scores)
```

## Indexing with []

Indexing lets you extract specific elements from a vector. R uses 1-based indexing — the first element is at position 1, not 0.

### Positive Indexing

```r
fruits <- c("apple", "banana", "cherry", "date", "elderberry")

# Single element
fruits[1]
fruits[3]

# Multiple elements
fruits[c(1, 3, 5)]

# Range of elements
fruits[2:4]
```

### Negative Indexing

Use negative numbers to exclude elements.

```r
fruits <- c("apple", "banana", "cherry", "date", "elderberry")

# Exclude the first element
fruits[-1]

# Exclude multiple elements
fruits[-c(2, 4)]

# Exclude a range
fruits[-(1:3)]
```

### Logical Indexing

Pass a logical vector of the same length. TRUE keeps the element, FALSE drops it.

```r
scores <- c(85, 92, 67, 91, 73, 88)

# Which scores are above 80?
above_80 <- scores > 80
above_80

# Use the logical vector to filter
scores[above_80]

# Do it in one step
scores[scores > 80]

# Combine conditions
scores[scores > 70 & scores < 90]
```

### Named Indexing

```r
temps <- c(Mon = 72, Tue = 75, Wed = 68, Thu = 80, Fri = 77)

# Access by name
temps["Wed"]

# Multiple names
temps[c("Mon", "Fri")]
```

### which() — Find Positions

```r
scores <- c(85, 92, 67, 91, 73, 88)

# Which positions have scores above 90?
which(scores > 90)

# Find the position of the max/min
which.max(scores)
which.min(scores)

# Get the actual value
scores[which.max(scores)]
```

## Modifying Vectors

```r
x <- c(10, 20, 30, 40, 50)
x

# Change one element
x[3] <- 99
x

# Change multiple elements
x[c(1, 5)] <- c(11, 55)
x

# Add elements
x <- c(x, 60, 70)
x

# Remove elements (create a new vector without them)
x <- x[-2]
x
```

## Vectorized Operations

R's superpower is vectorized operations. Instead of looping through elements one by one, you apply an operation to the entire vector at once.

```r
prices <- c(9.99, 14.50, 3.75, 22.00, 8.25)

# Math on every element at once
tax <- prices * 0.08
total <- prices + tax

cat("Prices:", prices, "\n")
cat("Tax:   ", round(tax, 2), "\n")
cat("Total: ", round(total, 2), "\n")
```

### Vector-to-Vector Operations

```r
hours <- c(8, 7.5, 9, 8, 6)
rate <- c(25, 30, 25, 35, 28)

# Element-wise multiplication
pay <- hours * rate
cat("Pay:", pay, "\n")
cat("Total:", sum(pay), "\n")
```

### Comparison Operations

```r
temps <- c(72, 85, 68, 91, 77, 83, 65)

# Compare each element
hot_days <- temps > 80
cat("Hot days:", hot_days, "\n")
cat("Number of hot days:", sum(hot_days), "\n")
cat("Proportion hot:", mean(hot_days), "\n")
```

## The Recycling Rule

When you operate on two vectors of different lengths, R recycles the shorter vector. This is useful but can cause silent bugs.

```r
# Useful recycling: scalar applied to vector
x <- c(10, 20, 30, 40)
x * 2   # 2 is recycled to c(2, 2, 2, 2)

# Useful recycling: alternating pattern
x + c(1, -1)  # c(1,-1) recycled to c(1,-1,1,-1)

# Dangerous recycling: mismatched lengths
a <- c(1, 2, 3, 4, 5)
b <- c(10, 20)
a + b  # R recycles b but warns (length 5 is not a multiple of length 2)
```

The rule: if the longer vector's length is a multiple of the shorter, R recycles silently. Otherwise, R recycles with a warning. Both can hide bugs — always check your vector lengths.

## Essential Vector Functions

```r
x <- c(15, 3, 22, 8, 17, 42, 5, 31)

cat("Length:", length(x), "\n")
cat("Sum:", sum(x), "\n")
cat("Mean:", mean(x), "\n")
cat("Median:", median(x), "\n")
cat("Min:", min(x), "\n")
cat("Max:", max(x), "\n")
cat("Range:", range(x), "\n")
cat("Std Dev:", round(sd(x), 2), "\n")
cat("Variance:", round(var(x), 2), "\n")
```

```r
x <- c(15, 3, 22, 8, 17, 42, 5, 31)

# Sorting
sort(x)
sort(x, decreasing = TRUE)

# Order (returns positions that would sort the vector)
order(x)
x[order(x)]

# Reverse
rev(x)

# Unique values
y <- c(1, 2, 2, 3, 3, 3)
unique(y)
table(y)

# Cumulative functions
cumsum(1:5)
cumprod(1:5)
```

## Handling Missing Values

```r
temps <- c(72, NA, 68, 80, NA, 77, 83)

# Most functions return NA if any value is NA
mean(temps)

# Use na.rm = TRUE to ignore NAs
mean(temps, na.rm = TRUE)
sum(temps, na.rm = TRUE)

# Find NAs
is.na(temps)
which(is.na(temps))

# Count NAs
sum(is.na(temps))

# Remove NAs
temps_clean <- temps[!is.na(temps)]
temps_clean
```

## Common Mistakes

### Mistake 1: Off-by-one with 1-based indexing

```r
x <- c("a", "b", "c", "d")

# In R, the first element is x[1], not x[0]
x[1]  # "a"
x[0]  # Returns empty — not an error, just confusing
```

### Mistake 2: Using == with NA

```r
x <- c(1, NA, 3)

# Wrong: this does not find NAs
x == NA  # Returns NA, not TRUE

# Right: use is.na()
is.na(x)
```

### Mistake 3: Forgetting that single values are vectors

```r
# In R, even a single number is a vector of length 1
x <- 42
is.vector(x)
length(x)

# This is why R prints [1] before single values
x
```

## Practice Exercises

### Exercise 1: Create and Filter

Create a vector of 10 temperatures. Find all temperatures above 75 and calculate their average.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
temps <- c(68, 72, 81, 77, 85, 69, 90, 74, 78, 83)
hot <- temps[temps > 75]
cat("Hot temperatures:", hot, "\n")
cat("Average:", mean(hot), "\n")
```

</details>

### Exercise 2: Named Vector Operations

Create a named vector of 5 students and their scores. Find who scored the highest and who scored below 80.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
scores <- c(Alice = 92, Bob = 67, Carol = 88, Dave = 73, Eve = 95)
cat("Highest:", names(scores)[which.max(scores)], "with", max(scores), "\n")
cat("Below 80:", names(scores[scores < 80]), "\n")
```

</details>

### Exercise 3: Vectorized Calculation

Given vectors of item prices and quantities, calculate the total cost per item and the grand total.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
prices <- c(4.99, 12.50, 2.25, 8.00, 15.75)
quantities <- c(3, 1, 5, 2, 1)
item_totals <- prices * quantities
cat("Item totals:", round(item_totals, 2), "\n")
cat("Grand total: $", sum(item_totals), "\n")
```

</details>

### Exercise 4: Handle Missing Data

This vector has missing values. Calculate the mean, count the NAs, and replace each NA with the mean of the non-missing values.

```r
data <- c(45, NA, 52, 48, NA, 55, 41, NA, 50)
# Your code here
```

<details><summary>Solution</summary>

```r
data <- c(45, NA, 52, 48, NA, 55, 41, NA, 50)
avg <- mean(data, na.rm = TRUE)
cat("Mean (ignoring NAs):", avg, "\n")
cat("Number of NAs:", sum(is.na(data)), "\n")

data[is.na(data)] <- avg
cat("After replacement:", round(data, 1), "\n")
```

</details>

## FAQ

### What is the difference between a vector and a list?

A vector holds elements of the same type. A list can hold elements of different types, including other lists and data frames. Vectors are simpler and faster. Use vectors when all your values are the same type.

### Can a vector hold mixed types?

No. If you mix types, R coerces them to a common type. For example, `c(1, "two")` becomes `c("1", "two")`. Use a list if you need to store mixed types.

### What does [1] mean in R output?

It is the index of the first element on that line. For long vectors, R prints `[1]` at the start of the first line, `[26]` at the start of the next line, and so on. It helps you track position in long output.

### Why does R use 1-based indexing?

R was designed for statisticians and mathematicians, where counting starts at 1. Most other scientific languages (MATLAB, Fortran, Julia) also use 1-based indexing. Python and C use 0-based indexing.

### How large can a vector be?

R vectors can hold up to about 2 billion elements (2^31 - 1) on most systems. The practical limit is your available RAM. A numeric vector of 100 million elements uses about 800 MB.

## Conclusion

Vectors are the building block of R. Once you can create them with `c()`, `seq()`, and `rep()`, index them with `[]`, and operate on them without loops, you have the foundation for everything else. Data frames are just collections of vectors. Matrix operations are vector operations in two dimensions. Even single numbers are vectors of length 1.

Next, learn about <a href="/R-Data-Frames-Tutorial.html">data frames</a> — R's structure for tabular data, built from vectors.
