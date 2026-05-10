---
title: "EDA Exercises in R: 50 Real Practice Problems"
slug: "EDA-Exercises-in-R"
description: "Sharpen exploratory data analysis skills with 50 practice problems in R: distributions, missing data, outliers, relationships, real EDA workflows. Hidden solutions."
keywords: "EDA exercises in R, exploratory data analysis exercises R, R EDA practice, data exploration exercises R, R EDA problems, EDA practice problems"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "EDA Exercises"
sidebar_order: 108
fr_parent: "R-Tutorial.html"
auto_link_terms: "EDA exercises|exploratory data analysis exercises|EDA practice|R EDA exercises"
auto_link_case_sensitive: false
target_keyword: "EDA exercises in R"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# EDA Exercises in R: 50 Real Practice Problems

<p class="lead">Fifty exploratory data analysis exercises spanning inspection, distributions, missing values, outliers, relationships, and full EDA workflows. Hidden solutions, runnable code.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(ggplot2)
library(tibble)
```

## Section 1. Data inspection (8 problems)

### Exercise 1.1: Dimensions

**Difficulty:** Beginner. Get the row and column count of `airquality`.

<details><summary>Show solution</summary>

```r
dim(airquality)
```

</details>

### Exercise 1.2: Glimpse columns

**Difficulty:** Beginner. Inspect column types and sample values of `mtcars` with glimpse.

<details><summary>Show solution</summary>

```r
glimpse(mtcars)
```

</details>

### Exercise 1.3: Summary statistics

**Difficulty:** Beginner. Print summary of `airquality` and identify the column with the most NAs.

<details><summary>Show solution</summary>

```r
summary(airquality)
# Ozone has the most NAs (37)
```

</details>

### Exercise 1.4: First 10 rows

**Difficulty:** Beginner. Inspect the first 10 rows of diamonds.

<details><summary>Show solution</summary>

```r
head(diamonds, 10)
```

</details>

### Exercise 1.5: Class of each column

**Difficulty:** Intermediate. Get the class of each column of iris as a named vector.

<details><summary>Show solution</summary>

```r
sapply(iris, class)
```

</details>

### Exercise 1.6: Number of distinct values per column

**Difficulty:** Intermediate. For diamonds, count distinct values per column.

<details><summary>Show solution</summary>

```r
diamonds |>
  summarise(across(everything(), n_distinct)) |>
  pivot_longer(everything())
```

</details>

### Exercise 1.7: Range of each numeric column

**Difficulty:** Intermediate. Get min and max for each numeric column of iris.

<details><summary>Show solution</summary>

```r
iris |>
  summarise(across(where(is.numeric),
                   list(min = min, max = max),
                   .names = "{.col}_{.fn}"))
```

</details>

### Exercise 1.8: Build a one-shot data profile

**Difficulty:** Advanced. For airquality, return a tibble with column name, class, NA count, distinct count.

<details><summary>Show solution</summary>

```r
tibble(
  column     = names(airquality),
  class      = sapply(airquality, function(x) class(x)[1]),
  n_na       = sapply(airquality, function(x) sum(is.na(x))),
  n_distinct = sapply(airquality, n_distinct)
)
```

</details>

## Section 2. Distributions (10 problems)

### Exercise 2.1: Histogram of mpg

**Difficulty:** Beginner. Histogram of mtcars$mpg with 15 bins.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(mpg)) + geom_histogram(bins = 15)
```

</details>

### Exercise 2.2: Density curve

**Difficulty:** Beginner. Density curve of diamonds$price.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(price)) + geom_density()
```

</details>

### Exercise 2.3: Boxplot per group

**Difficulty:** Intermediate. Boxplot of Sepal.Length by Species.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Species, Sepal.Length)) + geom_boxplot()
```

</details>

### Exercise 2.4: Overlapping densities

**Difficulty:** Intermediate. Overlapping density plot of Sepal.Length, colored by Species, with alpha.

<details><summary>Show solution</summary>

```r
ggplot(iris, aes(Sepal.Length, fill = Species)) +
  geom_density(alpha = 0.5)
```

</details>

### Exercise 2.5: Quintiles

**Difficulty:** Intermediate. Compute the 20th, 40th, 60th, 80th percentiles of mtcars$mpg.

<details><summary>Show solution</summary>

```r
quantile(mtcars$mpg, c(0.2, 0.4, 0.6, 0.8))
```

</details>

### Exercise 2.6: Skewness and kurtosis

**Difficulty:** Advanced. Compute skewness and kurtosis of diamonds$price.

<details><summary>Show solution</summary>

```r
e1071::skewness(diamonds$price)
e1071::kurtosis(diamonds$price)
# Right-skewed (positive); heavy-tailed (kurt > 3)
```

</details>

### Exercise 2.7: Log-transform a skewed variable

**Difficulty:** Intermediate. Plot log(price) histogram and observe the difference.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(log(price))) + geom_histogram(bins = 30)
```

</details>

### Exercise 2.8: Histograms by facet

**Difficulty:** Intermediate. Histogram of price faceted by cut.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(price)) +
  geom_histogram(bins = 30) +
  facet_wrap(~ cut)
```

</details>

### Exercise 2.9: Empirical CDF

**Difficulty:** Advanced. Plot the empirical CDF of mtcars$mpg.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(mpg)) + stat_ecdf()
```

</details>

### Exercise 2.10: Compare distribution shape across groups

**Difficulty:** Advanced. Use ridgeline plots (ggridges) for diamond price by cut.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(x = price, y = cut, fill = cut)) +
  ggridges::geom_density_ridges(alpha = 0.6)
```

</details>

## Section 3. Missing data (6 problems)

### Exercise 3.1: Count NAs

**Difficulty:** Beginner. Total NA count in airquality.

<details><summary>Show solution</summary>

```r
sum(is.na(airquality))
```

</details>

### Exercise 3.2: NA per column

**Difficulty:** Intermediate. NAs per column, sorted desc.

<details><summary>Show solution</summary>

```r
airquality |>
  summarise(across(everything(), ~ sum(is.na(.x)))) |>
  pivot_longer(everything()) |>
  arrange(desc(value))
```

</details>

### Exercise 3.3: NA per row

**Difficulty:** Intermediate. Add a `n_na` column per row to airquality.

<details><summary>Show solution</summary>

```r
airquality |>
  mutate(n_na = rowSums(is.na(across(everything()))))
```

</details>

### Exercise 3.4: Drop incomplete rows

**Difficulty:** Beginner. Remove rows with any NA.

<details><summary>Show solution</summary>

```r
drop_na(airquality)
```

</details>

### Exercise 3.5: Visualize NA pattern

**Difficulty:** Advanced. Use naniar::vis_miss to visualize the missingness pattern.

<details><summary>Show solution</summary>

```r
naniar::vis_miss(airquality)
```

</details>

### Exercise 3.6: Mean impute and document

**Difficulty:** Intermediate. Impute Ozone NAs with the column mean and add a flag column.

<details><summary>Show solution</summary>

```r
airquality |>
  mutate(was_na    = is.na(Ozone),
         Ozone_imp = if_else(is.na(Ozone), mean(Ozone, na.rm = TRUE), Ozone))
```

</details>

## Section 4. Outliers (6 problems)

### Exercise 4.1: Tukey IQR rule

**Difficulty:** Intermediate. Flag mpg outliers using Q1 - 1.5*IQR / Q3 + 1.5*IQR.

<details><summary>Show solution</summary>

```r
mtcars |>
  mutate(out = {
    q <- quantile(mpg, c(0.25, 0.75))
    mpg < q[1] - 1.5*IQR(mpg) | mpg > q[2] + 1.5*IQR(mpg)
  })
```

</details>

### Exercise 4.2: Z-score rule

**Difficulty:** Intermediate. Flag rows where |z| > 3 for mpg.

<details><summary>Show solution</summary>

```r
mtcars |>
  mutate(z = (mpg - mean(mpg)) / sd(mpg),
         out = abs(z) > 3)
```

</details>

### Exercise 4.3: Per-group outliers

**Difficulty:** Advanced. Flag mpg outliers within each cyl group.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  mutate(out = {
    q <- quantile(mpg, c(0.25, 0.75))
    mpg < q[1] - 1.5*IQR(mpg) | mpg > q[2] + 1.5*IQR(mpg)
  }) |>
  ungroup()
```

</details>

### Exercise 4.4: Visualize outliers in a boxplot

**Difficulty:** Beginner. Boxplot of diamonds$price.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(y = price)) + geom_boxplot()
```

</details>

### Exercise 4.5: Winsorize

**Difficulty:** Intermediate. Cap mpg at the 5th and 95th percentiles.

<details><summary>Show solution</summary>

```r
q <- quantile(mtcars$mpg, c(0.05, 0.95))
mtcars |>
  mutate(mpg_w = pmin(pmax(mpg, q[1]), q[2]))
```

</details>

### Exercise 4.6: Robust scale alternative

**Difficulty:** Advanced. Standardize using median + MAD instead of mean + sd.

<details><summary>Show solution</summary>

```r
mtcars |>
  mutate(mpg_robust = (mpg - median(mpg)) / mad(mpg))
```

</details>

## Section 5. Relationships (10 problems)

### Exercise 5.1: Pearson correlation

**Difficulty:** Beginner. Correlation between wt and mpg.

<details><summary>Show solution</summary>

```r
cor(mtcars$wt, mtcars$mpg)
```

</details>

### Exercise 5.2: Correlation matrix

**Difficulty:** Intermediate. Correlation matrix of mtcars (numeric).

<details><summary>Show solution</summary>

```r
cor(mtcars)
```

</details>

### Exercise 5.3: Visualize correlation matrix

**Difficulty:** Intermediate. Heatmap of the correlation matrix.

<details><summary>Show solution</summary>

```r
cor(mtcars) |>
  as.data.frame() |>
  rownames_to_column("var1") |>
  pivot_longer(-var1, names_to = "var2", values_to = "cor") |>
  ggplot(aes(var1, var2, fill = cor)) +
  geom_tile() +
  scale_fill_gradient2(low = "blue", high = "red", mid = "white", midpoint = 0)
```

</details>

### Exercise 5.4: Spearman vs Pearson

**Difficulty:** Intermediate. Compare Pearson and Spearman correlation between disp and mpg.

<details><summary>Show solution</summary>

```r
cor(mtcars$disp, mtcars$mpg, method = "pearson")
cor(mtcars$disp, mtcars$mpg, method = "spearman")
# Spearman captures monotonic non-linear; Pearson assumes linear
```

</details>

### Exercise 5.5: Scatter with smoother

**Difficulty:** Intermediate. Scatter wt vs mpg with linear smoother.

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  geom_smooth(method = "lm")
```

</details>

### Exercise 5.6: Pairs plot

**Difficulty:** Intermediate. Pairs plot of iris numeric columns colored by Species.

<details><summary>Show solution</summary>

```r
GGally::ggpairs(iris, columns = 1:4, aes(color = Species))
```

</details>

### Exercise 5.7: Categorical-categorical

**Difficulty:** Intermediate. Cross-tabulation of cut and clarity in diamonds.

<details><summary>Show solution</summary>

```r
table(diamonds$cut, diamonds$clarity)
```

</details>

### Exercise 5.8: Categorical-numeric

**Difficulty:** Intermediate. Mean price per cut (categorical-numeric exploration).

<details><summary>Show solution</summary>

```r
diamonds |>
  group_by(cut) |>
  summarise(mean_price = mean(price))
```

</details>

### Exercise 5.9: Conditional density

**Difficulty:** Advanced. Density of mpg conditional on factor(cyl).

<details><summary>Show solution</summary>

```r
ggplot(mtcars, aes(mpg, fill = factor(cyl))) +
  geom_density(alpha = 0.5)
```

</details>

### Exercise 5.10: Mosaic plot

**Difficulty:** Advanced. Mosaic plot of cut x clarity proportions.

<details><summary>Show solution</summary>

```r
table(diamonds$cut, diamonds$clarity) |> mosaicplot()
```

</details>

## Section 6. End-to-end EDA (10 problems)

### Exercise 6.1: Initial profile

**Difficulty:** Intermediate. Run a 3-step opening EDA on diamonds: dim, glimpse, summary.

<details><summary>Show solution</summary>

```r
dim(diamonds); glimpse(diamonds); summary(diamonds)
```

</details>

### Exercise 6.2: Find a categorical with imbalanced frequencies

**Difficulty:** Intermediate. Identify any column where the most frequent value is > 50% of rows.

<details><summary>Show solution</summary>

```r
diamonds |>
  summarise(across(c(cut, color, clarity),
                   ~ max(prop.table(table(.x))) > 0.5)) |>
  pivot_longer(everything())
```

</details>

### Exercise 6.3: Detect a heavily-skewed numeric

**Difficulty:** Advanced. Find numeric columns with skewness > 1.

<details><summary>Show solution</summary>

```r
diamonds |>
  summarise(across(where(is.numeric), e1071::skewness)) |>
  pivot_longer(everything()) |>
  filter(value > 1)
```

</details>

### Exercise 6.4: Numeric summary by group

**Difficulty:** Intermediate. Per Species, give n, mean, sd, min, max of Sepal.Length.

<details><summary>Show solution</summary>

```r
iris |>
  group_by(Species) |>
  summarise(n = n(), mean = mean(Sepal.Length), sd = sd(Sepal.Length),
            min = min(Sepal.Length), max = max(Sepal.Length))
```

</details>

### Exercise 6.5: Top correlations

**Difficulty:** Advanced. Find the top 3 most-correlated pairs in mtcars (excluding self).

<details><summary>Show solution</summary>

```r
cor(mtcars) |>
  as.data.frame() |>
  rownames_to_column("var1") |>
  pivot_longer(-var1, names_to = "var2", values_to = "cor") |>
  filter(var1 < var2) |>
  arrange(desc(abs(cor))) |>
  head(3)
```

</details>

### Exercise 6.6: Detect duplicates

**Difficulty:** Intermediate. Count fully-duplicate rows in diamonds.

<details><summary>Show solution</summary>

```r
sum(duplicated(diamonds))
```

</details>

### Exercise 6.7: One-way summary

**Difficulty:** Intermediate. Mean and N per cyl group with arrange.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  summarise(n = n(), mean_mpg = mean(mpg)) |>
  arrange(desc(mean_mpg))
```

</details>

### Exercise 6.8: Two-way summary

**Difficulty:** Intermediate. Mean price per (cut, color) in diamonds.

<details><summary>Show solution</summary>

```r
diamonds |>
  group_by(cut, color) |>
  summarise(mean_price = mean(price), .groups = "drop")
```

</details>

### Exercise 6.9: Audit sparse columns

**Difficulty:** Advanced. List columns where >25% of rows are NA in airquality.

<details><summary>Show solution</summary>

```r
airquality |>
  summarise(across(everything(), ~ mean(is.na(.x)))) |>
  pivot_longer(everything()) |>
  filter(value > 0.25)
```

</details>

### Exercise 6.10: Decision-quality EDA report

**Difficulty:** Advanced. Build a one-page EDA: profile + 3 plots (univariate hist, group boxplot, correlation heatmap).

<details><summary>Show solution</summary>

```r
# Profile
print(summary(mtcars))

# Plot 1: distribution
print(ggplot(mtcars, aes(mpg)) + geom_histogram(bins = 15))

# Plot 2: group comparison
print(ggplot(mtcars, aes(factor(cyl), mpg)) + geom_boxplot())

# Plot 3: relationship
print(cor(mtcars) |> as.data.frame() |>
        rownames_to_column("v1") |>
        pivot_longer(-v1, names_to = "v2") |>
        ggplot(aes(v1, v2, fill = value)) + geom_tile() +
        scale_fill_gradient2(low = "blue", high = "red"))
```

</details>

## What to do next

After 50 EDA problems you should walk into a new dataset and have a profile in 5 minutes. Natural follow-ups:

- **Data-Wrangling-Exercises** (shipped) — the cleaning that EDA reveals.
- **Linear-Regression-Exercises** (shipped) — the modeling that EDA precedes.
- **Data-Visualization-Exercises** (coming) — viz beyond the EDA basics.
