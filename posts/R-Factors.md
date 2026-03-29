---
title: "R Factors: The Data Type That Trips Up Almost Every R Beginner"
slug: "R-Factors"
description: "R factors represent categorical data with fixed levels. Learn to create, reorder, relabel, and avoid the classic factor traps that catch every beginner."
keywords: "R factors, factor() in R, R categorical data, R levels, R ordered factor, R relevel, forcats"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-fund-6"
post_type: "FR"
auto_link_terms: "R factors|factor() in R|R categorical data|R levels"
auto_link_case_sensitive: false
fr_parent: "R-Data-Types.html"
---

# R Factors: The Data Type That Trips Up Almost Every R Beginner

<p class="lead">A factor is R's way of storing categorical data — variables with a fixed set of possible values like "Male"/"Female", "Low"/"Medium"/"High", or survey responses. Factors look like text but behave like integers, and that dual nature causes most of the confusion.</p>

Factors are one of R's most misunderstood features. They look like character vectors when you print them, but underneath they're integers with labels. This mismatch causes mysterious bugs: `as.numeric()` returns wrong numbers, sorting doesn't work as expected, and new values get silently turned into NA. This tutorial explains factors clearly and shows you when to use them — and when to avoid them.

## What Is a Factor?

A **factor** stores categorical data — data with a fixed, known set of possible values called **levels**. Think of a survey question with predefined answer choices:

```r
# Create a factor from a character vector
satisfaction <- factor(c("Happy", "Neutral", "Happy", "Unhappy", "Happy", "Neutral"))

cat("Factor:", satisfaction, "\n")
cat("Levels:", levels(satisfaction), "\n")
cat("Class:", class(satisfaction), "\n")

# Under the hood: integers!
cat("\nUnderlying integers:", unclass(satisfaction), "\n")
cat("Level 1 =", levels(satisfaction)[1], "\n")
cat("Level 2 =", levels(satisfaction)[2], "\n")
cat("Level 3 =", levels(satisfaction)[3], "\n")
```

R stores `"Happy"` as 1, `"Neutral"` as 2, `"Unhappy"` as 3 internally. The text labels are just a mapping from integers to names. This is more memory-efficient for large datasets with repeated categories.

## Creating Factors

### From a character vector

```r
# Basic factor — levels are alphabetical by default
colors <- factor(c("red", "blue", "green", "red", "blue"))
cat("Levels:", levels(colors), "\n")  # Alphabetical: blue, green, red

# Specify levels explicitly (controls the order)
sizes <- factor(
  c("Large", "Small", "Medium", "Large", "Small"),
  levels = c("Small", "Medium", "Large")  # Your order
)
cat("Levels:", levels(sizes), "\n")  # Your order: Small, Medium, Large
```

### Ordered factors

For ordinal data (where the order matters), use `ordered = TRUE`:

```r
# Ordered factor — levels have a natural order
education <- factor(
  c("PhD", "Bachelor", "Master", "Bachelor", "PhD"),
  levels = c("Bachelor", "Master", "PhD"),
  ordered = TRUE
)

cat("Education:", education, "\n")
cat("Levels:", levels(education), "\n")

# Ordered factors support comparisons
cat("\nPhD > Bachelor:", education[1] > education[2], "\n")
cat("Bachelor < Master:", education[2] < education[3], "\n")
```

Ordered factors let R know that "PhD" > "Master" > "Bachelor" — useful for ordinal regression and ordered plots.

### Controlling which levels exist

You can define levels that don't appear in the data yet:

```r
# All possible responses, even if not all are present
responses <- factor(
  c("Agree", "Agree", "Neutral"),
  levels = c("Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree")
)

cat("Data:", responses, "\n")
cat("All levels:", levels(responses), "\n")

# table() shows counts for ALL levels, including zeros
print(table(responses))
```

This is important for surveys, experiments, and any situation where you need counts for categories that might have zero observations.

## Factor Traps (and How to Avoid Them)

### Trap 1: as.numeric() on factors

This is the #1 factor trap — it returns level codes, not the values you see:

```r
# The classic trap
ratings <- factor(c("5", "3", "4", "5", "2"))
cat("Ratings:", ratings, "\n")

# WRONG: gives level codes (1, 2, 3...), not the actual numbers!
wrong <- as.numeric(ratings)
cat("WRONG (level codes):", wrong, "\n")

# RIGHT: convert to character first, then numeric
right <- as.numeric(as.character(ratings))
cat("RIGHT (actual values):", right, "\n")
cat("Mean rating:", mean(right), "\n")
```

**Always convert factor → character → numeric.** Never go directly from factor to numeric.

### Trap 2: Adding new values

Factors have fixed levels. Adding a value that's not in the levels produces NA:

```r
colors <- factor(c("red", "blue", "green"))
cat("Levels:", levels(colors), "\n")

# Try to add a new value
colors[4] <- "yellow"
cat("After adding 'yellow':", colors, "\n")  # NA!

# Fix: add the level first
colors <- factor(c("red", "blue", "green"))
levels(colors) <- c(levels(colors), "yellow")
colors[4] <- "yellow"
cat("After adding level first:", colors, "\n")
```

### Trap 3: Sorting and ordering

Factors sort by **level order**, not alphabetically:

```r
# Default factor: levels are alphabetical
months <- factor(c("Mar", "Jan", "Feb", "Jan", "Mar"))
cat("Default sort:", sort(months), "\n")  # Alphabetical

# With custom levels: sorts by level order
months <- factor(
  c("Mar", "Jan", "Feb", "Jan", "Mar"),
  levels = c("Jan", "Feb", "Mar")
)
cat("Custom sort:", sort(months), "\n")  # Calendar order!
```

This is actually a feature — it's how you get months, weekdays, or any custom category to appear in the right order in plots and tables.

### Trap 4: Merging/combining factors

```r
f1 <- factor(c("a", "b"))
f2 <- factor(c("b", "c"))

# c() on factors gives unexpected results!
combined <- c(f1, f2)
cat("c() result:", combined, "\n")       # Numbers, not letters!
cat("Type:", class(combined), "\n")      # Integer!

# Fix: convert to character first
combined_right <- factor(c(as.character(f1), as.character(f2)))
cat("Correct:", combined_right, "\n")
cat("Levels:", levels(combined_right), "\n")
```

`c()` strips the factor class and returns the underlying integers. Always convert to character before combining factors.

## Modifying Factors

### Reorder levels

```r
# Change the display/sort order without changing the data
sizes <- factor(c("S", "M", "L", "XL", "M", "S"))
cat("Default order:", levels(sizes), "\n")  # Alphabetical: L, M, S, XL

# Reorder
sizes <- factor(sizes, levels = c("S", "M", "L", "XL"))
cat("Custom order:", levels(sizes), "\n")  # S, M, L, XL

# The data is unchanged
cat("Values:", sizes, "\n")
print(table(sizes))
```

### Relabel levels

```r
# Rename the categories
status <- factor(c("Y", "N", "Y", "Y", "N"))
cat("Before:", levels(status), "\n")

levels(status) <- c("No", "Yes")  # Maps N→No, Y→Yes (alphabetical order!)
cat("After:", status, "\n")
cat("Levels:", levels(status), "\n")
```

> **Warning:** When relabeling with `levels(x) <-`, the new names must be in the same order as the current levels (alphabetical by default). Check `levels(x)` first!

### Drop unused levels

```r
# After filtering, unused levels remain
colors <- factor(c("red", "blue", "green", "red", "blue"))
subset <- colors[colors != "green"]
cat("After filtering:", subset, "\n")
cat("Levels still include green:", levels(subset), "\n")

# Drop unused levels
clean <- droplevels(subset)
cat("After droplevels:", levels(clean), "\n")
```

## The forcats Package (Modern Factor Handling)

The `forcats` package (part of the tidyverse) provides cleaner functions for common factor operations:

```r
library(forcats)

# Create a factor
satisfaction <- factor(c("Happy", "Neutral", "Happy", "Unhappy",
                         "Happy", "Neutral", "Unhappy", "Happy"))

# fct_infreq: order by frequency (most common first)
by_freq <- fct_infreq(satisfaction)
cat("By frequency:", levels(by_freq), "\n")
print(table(by_freq))
```

```r
library(forcats)

responses <- factor(c("Agree", "Neutral", "Agree", "Disagree",
                      "Strongly Agree", "Agree", "Neutral"))

# fct_relevel: move specific levels to the front
reordered <- fct_relevel(responses, "Strongly Agree", "Agree")
cat("Reordered:", levels(reordered), "\n")

# fct_collapse: combine levels
collapsed <- fct_collapse(responses,
  Positive = c("Strongly Agree", "Agree"),
  Other = c("Neutral", "Disagree")
)
cat("\nCollapsed:", collapsed, "\n")
print(table(collapsed))
```

```r
library(forcats)
library(ggplot2)

# fct_rev: reverse level order (useful for horizontal bar charts)
data <- data.frame(
  fruit = factor(c("Apple","Banana","Cherry","Date","Apple","Banana","Apple")),
  count = 1
)

# Default: alphabetical (A at bottom of horizontal bars)
# fct_infreq + fct_rev: most frequent at top
ggplot(data, aes(y = fct_rev(fct_infreq(fruit)))) +
  geom_bar(fill = "steelblue") +
  labs(title = "Fruit Frequency (ordered)", x = "Count", y = NULL) +
  theme_minimal()
```

### forcats cheat sheet

| Function | What it does |
|----------|-------------|
| `fct_infreq()` | Order by frequency |
| `fct_rev()` | Reverse level order |
| `fct_relevel()` | Move levels to front |
| `fct_reorder()` | Reorder by another variable |
| `fct_collapse()` | Combine multiple levels |
| `fct_lump_n()` | Keep top n levels, lump rest into "Other" |
| `fct_recode()` | Rename specific levels |
| `fct_drop()` | Drop unused levels |

## When to Use Factors vs Characters

| Use factors when... | Use characters when... |
|--------------------|----------------------|
| You need a specific display order in plots | The text has no fixed categories |
| Statistical models need categorical variables | You're doing string manipulation |
| You want counts for all categories (including zero) | Categories aren't predefined |
| Data has ordinal categories (Low < Medium < High) | You're joining/merging data |
| Memory efficiency matters (millions of rows) | You're new to R (fewer surprises) |

> **Modern R advice:** Use character vectors by default. Convert to factors only when you need specific level ordering (for plots) or when a statistical model requires it. `readr::read_csv()` and R 4.0+ default to character, not factor.

## Practice Exercises

### Exercise 1: Survey Analysis

```r
# Exercise: A survey collected shirt size preferences:
sizes_raw <- c("M", "L", "S", "XL", "M", "S", "L", "M", "XS", "L",
               "M", "S", "L", "XL", "M", "S", "XXL", "M", "L", "S")
# 1. Convert to a factor with levels in size order (XS, S, M, L, XL, XXL)
# 2. Find the most popular size
# 3. Find how many people chose XS or XXL
# 4. Create a bar chart ordered by size (not frequency)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
library(ggplot2)

sizes_raw <- c("M", "L", "S", "XL", "M", "S", "L", "M", "XS", "L",
               "M", "S", "L", "XL", "M", "S", "XXL", "M", "L", "S")

# 1. Factor with size order
sizes <- factor(sizes_raw, levels = c("XS", "S", "M", "L", "XL", "XXL"))

# 2. Most popular
tab <- table(sizes)
cat("Most popular:", names(which.max(tab)), "with", max(tab), "votes\n")

# 3. XS or XXL count
extreme <- sum(sizes %in% c("XS", "XXL"))
cat("XS or XXL:", extreme, "of", length(sizes), "\n")

# 4. Bar chart in size order
ggplot(data.frame(size = sizes), aes(x = size)) +
  geom_bar(fill = "steelblue") +
  labs(title = "Shirt Size Distribution", x = "Size", y = "Count") +
  theme_minimal()
```

**Explanation:** The `levels` parameter in `factor()` controls both the sort order and the plot axis order. Without it, sizes would appear alphabetically (L, M, S, XL, XS, XXL), which makes no sense.

</details>

### Exercise 2: Fix the Factor Bugs

```r
# Exercise: This code has 3 factor-related bugs. Find and fix them.
# Goal: calculate the average numeric rating from survey data

ratings <- factor(c("5", "3", "4", "5", "2", "4", "3", "5"))

# Bug 1: Wrong numeric conversion
avg <- mean(as.numeric(ratings))
cat("Average rating:", avg, "\n")

# Bug 2: Can't add a new category
# ratings[9] <- "1"

# Bug 3: Combining two factor vectors
batch1 <- factor(c("A", "B"))
batch2 <- factor(c("C", "D"))
# all_batches <- c(batch1, batch2)

# Write your fixes below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
ratings <- factor(c("5", "3", "4", "5", "2", "4", "3", "5"))

# Bug 1 fix: factor → character → numeric
avg <- mean(as.numeric(as.character(ratings)))
cat("Average rating:", avg, "\n")

# Bug 2 fix: add level before adding value
levels(ratings) <- c(levels(ratings), "1")
ratings[9] <- "1"
cat("With new value:", ratings, "\n")

# Bug 3 fix: convert to character before combining
batch1 <- factor(c("A", "B"))
batch2 <- factor(c("C", "D"))
all_batches <- factor(c(as.character(batch1), as.character(batch2)))
cat("Combined:", all_batches, "\n")
cat("Levels:", levels(all_batches), "\n")
```

**Explanation:** All three bugs stem from the same root cause: factors are integers wearing text masks. `as.numeric()` exposes the integers. Adding new values without new levels creates NA. `c()` on factors strips the factor class.

</details>

### Exercise 3: Ordered Analysis

```r
# Exercise: Create an ordered factor for education levels and use it:
# Levels: "High School" < "Bachelor" < "Master" < "PhD"
# Data: c("Bachelor", "PhD", "Master", "Bachelor", "High School",
#         "Master", "PhD", "Bachelor", "Master", "High School")
#
# 1. Create the ordered factor
# 2. Count people at each level
# 3. Find how many have at least a Master's degree
# 4. What percentage have more than a Bachelor's?

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Solution
edu_data <- c("Bachelor", "PhD", "Master", "Bachelor", "High School",
              "Master", "PhD", "Bachelor", "Master", "High School")

edu <- factor(edu_data,
  levels = c("High School", "Bachelor", "Master", "PhD"),
  ordered = TRUE)

# 1. Ordered factor
cat("Levels:", levels(edu), "\n")
cat("Is ordered:", is.ordered(edu), "\n")

# 2. Count at each level
cat("\nDistribution:\n")
print(table(edu))

# 3. At least Master's
at_least_master <- sum(edu >= "Master")
cat("\nAt least Master's:", at_least_master, "\n")

# 4. More than Bachelor's
above_bachelor <- sum(edu > "Bachelor")
pct <- round(above_bachelor / length(edu) * 100, 1)
cat("Above Bachelor's:", above_bachelor, "(", pct, "%)\n")
```

**Explanation:** Ordered factors support `>`, `<`, `>=`, `<=` comparisons. `edu >= "Master"` returns TRUE for Master and PhD. This is impossible with regular (unordered) factors or character vectors.

</details>

## Summary

| Operation | Code | Notes |
|-----------|------|-------|
| Create | `factor(x)` | Levels alphabetical by default |
| Custom levels | `factor(x, levels = c(...))` | Your order |
| Ordered | `factor(x, levels, ordered = TRUE)` | Enables `<`, `>` |
| Get levels | `levels(f)` | Character vector |
| Relabel | `levels(f) <- c("new1", "new2")` | Must match order |
| Reorder | `factor(f, levels = new_order)` | Doesn't change data |
| Drop unused | `droplevels(f)` | After filtering |
| To character | `as.character(f)` | Safe conversion |
| To numeric | `as.numeric(as.character(f))` | **Never** skip `as.character` |
| Combine | `factor(c(as.character(f1), as.character(f2)))` | Convert first |

**The golden rules:**
1. Use factors for **ordered categories** and **plot axes**
2. Use characters as the default for text data
3. **Never** convert factor → numeric directly
4. **Always** convert to character before combining factors

## FAQ

### Why do factors exist at all?

Historical and practical reasons. In early R, factors saved memory (storing integers instead of repeated strings). Today, they're still essential for: (1) controlling plot axis order, (2) ensuring all categories appear in tables and models, (3) ordinal data where the order matters, (4) statistical models that need categorical variables.

### Should I use factors or characters with ggplot2?

ggplot2 works with both. Use characters for quick plots. Convert to factor when you need a specific axis order: `factor(x, levels = c("Jan", "Feb", "Mar"))`.

### What changed in R 4.0 regarding factors?

Before R 4.0, `data.frame()` and `read.csv()` converted strings to factors by default (`stringsAsFactors = TRUE`). Since R 4.0, the default is `FALSE` — strings stay as characters. This eliminated the most common source of factor confusion.

### How do I reorder bars in a ggplot2 bar chart?

Use `forcats::fct_reorder()` to order by a numeric variable, or `forcats::fct_infreq()` to order by frequency. For manual order, set levels: `factor(x, levels = c("first", "second", "third"))`.

## What's Next?

Factors complete your understanding of R's type system. Related tutorials:

1. **R Project Structure** — organize your R work properly
2. **Data Wrangling with dplyr** — modern data manipulation
3. **ggplot2 Visualization** — where factors really shine for controlling plot elements
