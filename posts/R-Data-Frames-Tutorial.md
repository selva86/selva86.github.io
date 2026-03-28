# R Data Frames: Every Operation You'll Need, With 10 Real Examples

A data frame is R's equivalent of a spreadsheet — a table where each column is a vector and each row is an observation. Most real-world R work involves data frames. If you can build, access, filter, and modify data frames, you can handle nearly any dataset.

This tutorial walks through every essential data frame operation with 10 real-world examples using built-in datasets like mtcars and iris.

## What Is a Data Frame?

A data frame is a list of vectors of equal length, arranged as columns. Each column can have a different type (numeric, character, logical), but all values within a column must be the same type.

```r
# Create a simple data frame
employees <- data.frame(
  name = c("Alice", "Bob", "Carol", "Dave", "Eve"),
  department = c("Sales", "Engineering", "Sales", "HR", "Engineering"),
  salary = c(55000, 72000, 58000, 48000, 75000),
  years = c(3, 7, 5, 2, 8)
)

employees
```

Think of it as a spreadsheet: columns are variables, rows are records.

## Example 1: Explore a Built-In Dataset

R ships with dozens of built-in datasets. The `mtcars` dataset has specs for 32 cars from 1974.

```r
# First 6 rows
head(mtcars)

# Last 3 rows
tail(mtcars, 3)

# Dimensions: rows x columns
dim(mtcars)

# Column names
names(mtcars)
```

```r
# Structure — the single most useful inspection function
str(mtcars)
```

```r
# Summary statistics for every column
summary(mtcars)
```

The `str()` function is your best friend. It shows every column's type, the first few values, and the dimensions — all in one call.

## Example 2: Access Columns

There are three ways to access a column.

```r
# Method 1: $ notation (most common)
mtcars$mpg

# Method 2: [[ ]] with column name
mtcars[["mpg"]]

# Method 3: [ , ] with column number
mtcars[, 1]
```

The `$` syntax is the most readable and common. Use `[[ ]]` when the column name is stored in a variable.

```r
# Useful when column name is in a variable
col_name <- "hp"
mtcars[[col_name]]
```

## Example 3: Access Rows and Subsets

Use `[row, column]` syntax. Leave a side blank to get all rows or all columns.

```r
# Single row
mtcars[1, ]

# Multiple rows
mtcars[1:3, ]

# Specific rows and columns
mtcars[1:5, c("mpg", "hp", "wt")]

# Single cell
mtcars[1, "mpg"]
```

## Example 4: Filter Rows by Condition

Filtering is the most common operation on data frames. Use logical conditions inside `[ ]`.

```r
# Cars with mpg > 25
efficient <- mtcars[mtcars$mpg > 25, ]
efficient[, c("mpg", "hp", "wt")]
```

```r
# Cars with 6 cylinders AND automatic transmission (am = 0)
subset_cars <- mtcars[mtcars$cyl == 6 & mtcars$am == 0, ]
subset_cars[, c("mpg", "cyl", "am")]
```

The `subset()` function is a cleaner alternative.

```r
# Same result, cleaner syntax
subset(mtcars, mpg > 25, select = c(mpg, hp, wt))
```

## Example 5: Add and Remove Columns

```r
# Start with a copy of the first 6 rows
cars <- head(mtcars)

# Add a new column
cars$kpl <- round(cars$mpg * 0.425, 1)  # km per liter
cars[, c("mpg", "kpl")]
```

```r
# Remove a column by setting it to NULL
cars <- head(mtcars)
cars$qsec <- NULL
names(cars)

# Remove multiple columns by selecting the ones you want
cars_small <- cars[, c("mpg", "cyl", "hp", "wt")]
cars_small
```

## Example 6: Add and Remove Rows

```r
# Create a data frame
team <- data.frame(
  name = c("Alice", "Bob"),
  score = c(92, 85),
  stringsAsFactors = FALSE
)
team

# Add a row with rbind()
new_member <- data.frame(name = "Carol", score = 88, stringsAsFactors = FALSE)
team <- rbind(team, new_member)
team

# Remove row 2
team <- team[-2, ]
team
```

## Example 7: Sort Data

```r
# Sort by mpg (ascending)
sorted <- mtcars[order(mtcars$mpg), ]
head(sorted[, c("mpg", "hp")])
```

```r
# Sort by mpg (descending)
sorted_desc <- mtcars[order(-mtcars$mpg), ]
head(sorted_desc[, c("mpg", "hp")])

# Sort by two columns: cyl ascending, then mpg descending
sorted2 <- mtcars[order(mtcars$cyl, -mtcars$mpg), ]
head(sorted2[, c("cyl", "mpg", "hp")], 10)
```

The `order()` function returns the row positions in sorted order. The minus sign reverses the sort for numeric columns.

## Example 8: Create Summary Statistics

```r
# Basic stats for one column
cat("Mean MPG:", mean(mtcars$mpg), "\n")
cat("Median MPG:", median(mtcars$mpg), "\n")
cat("Std Dev:", round(sd(mtcars$mpg), 2), "\n")
cat("Range:", range(mtcars$mpg), "\n")
```

```r
# Apply a function to multiple columns
sapply(mtcars[, c("mpg", "hp", "wt")], mean)
```

```r
# Group-level statistics with aggregate()
aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
```

```r
# Multiple aggregations
aggregate(cbind(mpg, hp, wt) ~ cyl, data = mtcars, FUN = mean)
```

The `aggregate()` function splits the data by groups and applies a function to each group. The formula `mpg ~ cyl` means "mpg grouped by cyl."

## Example 9: Merge Two Data Frames

```r
# Customer info
customers <- data.frame(
  id = c(1, 2, 3, 4),
  name = c("Alice", "Bob", "Carol", "Dave"),
  stringsAsFactors = FALSE
)

# Order info
orders <- data.frame(
  id = c(2, 3, 3, 5),
  product = c("Widget", "Gadget", "Widget", "Gizmo"),
  amount = c(29.99, 49.99, 29.99, 19.99),
  stringsAsFactors = FALSE
)

# Inner join (only matching rows)
merge(customers, orders, by = "id")
```

```r
# Same data as above
customers <- data.frame(
  id = c(1, 2, 3, 4),
  name = c("Alice", "Bob", "Carol", "Dave"),
  stringsAsFactors = FALSE
)
orders <- data.frame(
  id = c(2, 3, 3, 5),
  product = c("Widget", "Gadget", "Widget", "Gizmo"),
  amount = c(29.99, 49.99, 29.99, 19.99),
  stringsAsFactors = FALSE
)

# Left join (keep all customers)
merge(customers, orders, by = "id", all.x = TRUE)

# Full join (keep everything)
merge(customers, orders, by = "id", all = TRUE)
```

Merge types at a glance:

| Argument | Join Type | Keeps |
|----------|-----------|-------|
| (default) | Inner | Only matching rows |
| `all.x = TRUE` | Left | All rows from first table |
| `all.y = TRUE` | Right | All rows from second table |
| `all = TRUE` | Full | All rows from both tables |

## Example 10: Work with the Iris Dataset

The `iris` dataset has measurements for 150 flowers across 3 species. Let's combine everything we've learned.

```r
# Explore the dataset
str(iris)
head(iris)
```

```r
# How many of each species?
table(iris$Species)

# Average measurements by species
aggregate(. ~ Species, data = iris, FUN = mean)
```

```r
# Which flower has the longest petal?
longest <- iris[which.max(iris$Petal.Length), ]
cat("Longest petal:\n")
print(longest)

# Filter: setosa flowers with sepal width > 3.5
wide_setosa <- subset(iris, Species == "setosa" & Sepal.Width > 3.5)
cat("\nWide setosa flowers:", nrow(wide_setosa), "\n")
head(wide_setosa)
```

```r
# Add a new column: petal area estimate
iris$Petal.Area <- round(iris$Petal.Length * iris$Petal.Width, 2)

# Average petal area by species
aggregate(Petal.Area ~ Species, data = iris, FUN = mean)
```

## Quick Reference: Essential Data Frame Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `data.frame()` | Create a data frame | `data.frame(x = 1:3, y = c("a","b","c"))` |
| `head()` / `tail()` | First/last rows | `head(df, 10)` |
| `str()` | Structure overview | `str(df)` |
| `summary()` | Column statistics | `summary(df)` |
| `dim()` | Rows x columns | `dim(df)` |
| `nrow()` / `ncol()` | Row/column count | `nrow(df)` |
| `names()` | Column names | `names(df)` |
| `subset()` | Filter rows/columns | `subset(df, x > 5)` |
| `order()` | Sort rows | `df[order(df$x), ]` |
| `merge()` | Join two data frames | `merge(df1, df2, by = "id")` |
| `aggregate()` | Group summaries | `aggregate(y ~ x, data = df, FUN = mean)` |
| `rbind()` / `cbind()` | Add rows/columns | `rbind(df1, df2)` |
| `sapply()` | Apply function to columns | `sapply(df, mean)` |

## Practice Exercises

### Exercise 1: Build and Inspect

Create a data frame with 5 products (name, price, quantity). Print its structure and summary.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
products <- data.frame(
  name = c("Laptop", "Mouse", "Keyboard", "Monitor", "Headset"),
  price = c(999, 29, 79, 349, 89),
  quantity = c(10, 50, 30, 15, 25),
  stringsAsFactors = FALSE
)
str(products)
summary(products)
```

</details>

### Exercise 2: Filter and Aggregate

Using `mtcars`, find the average horsepower of cars with more than 20 mpg.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
efficient <- mtcars[mtcars$mpg > 20, ]
cat("Number of efficient cars:", nrow(efficient), "\n")
cat("Average horsepower:", round(mean(efficient$hp), 1), "\n")
```

</details>

### Exercise 3: Sort and Rank

Sort the iris dataset by Petal.Length in descending order and show the top 5 flowers.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
sorted_iris <- iris[order(-iris$Petal.Length), ]
head(sorted_iris[, c("Species", "Petal.Length", "Petal.Width")], 5)
```

</details>

### Exercise 4: Merge Challenge

Create two data frames — one with student names and majors, another with student names and GPAs. Merge them and find the highest GPA per major.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
students <- data.frame(
  name = c("Alice", "Bob", "Carol", "Dave", "Eve"),
  major = c("CS", "Math", "CS", "Math", "CS"),
  stringsAsFactors = FALSE
)
grades <- data.frame(
  name = c("Alice", "Bob", "Carol", "Dave", "Eve"),
  gpa = c(3.8, 3.5, 3.9, 3.7, 3.6),
  stringsAsFactors = FALSE
)

combined <- merge(students, grades, by = "name")
aggregate(gpa ~ major, data = combined, FUN = max)
```

</details>

## FAQ

### What is the difference between a data frame and a matrix?

A data frame can have columns of different types (numeric, character, logical). A matrix must have all values of the same type. Use data frames for real-world datasets. Use matrices for mathematical operations.

### How do I convert a matrix to a data frame?

Use `as.data.frame(my_matrix)`. Column names will be V1, V2, etc. unless the matrix had column names.

### What is a tibble?

A tibble is a modern version of the data frame from the tidyverse. It prints more neatly, never converts strings to factors, and never changes column names. Create one with `tibble::tibble()` or convert with `tibble::as_tibble()`.

### How do I handle large data frames that are slow?

For data frames with millions of rows, consider the `data.table` package, which is much faster for grouping, filtering, and joining. Alternatively, use `dplyr` from the tidyverse for a clean syntax with good performance.

### How do I save a data frame to a CSV file?

Use `write.csv(df, "filename.csv", row.names = FALSE)`. The `row.names = FALSE` prevents R from adding a row number column.

## Conclusion

Data frames are where most R work happens. You now know how to create them, inspect them with `str()` and `summary()`, access rows and columns, filter with conditions, add and remove columns, sort, aggregate by groups, and merge multiple tables. These ten operations cover 90% of everyday data manipulation.

For more powerful data wrangling, explore <a href="/Data-Wrangling-With-dplyr.html">dplyr</a> — it provides a cleaner syntax for the same operations you learned here, plus powerful tools like `group_by()` and `mutate()`.
