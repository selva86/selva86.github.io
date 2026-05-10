---
title: "R for Data Science Exercises: 50 Practice Problems"
slug: "R-for-Data-Science-Exercises"
description: "50 practice problems mapped to R for Data Science topics: visualize, transform, tidy, import, model. Hidden solutions, runnable code in the browser."
keywords: "R for data science exercises, R4DS exercises, R for data science practice, R4DS practice problems, R data science exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R for Data Science Exercises"
sidebar_order: 109
fr_parent: "R-Tutorial.html"
auto_link_terms: "R for data science exercises|R4DS exercises|R4DS practice|R for data science practice"
auto_link_case_sensitive: false
target_keyword: "R for data science exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# R for Data Science Exercises: 50 Practice Problems

<p class="lead">Fifty practice problems mapped to R for Data Science topics: visualize, transform, tidy, import, strings, dates, iteration, models. Hidden solutions.</p>

| Section | R4DS topic | Problems |
|---|---|---|
| 1 | Visualize | 8 |
| 2 | Transform | 8 |
| 3 | Tidy | 8 |
| 4 | Import & wrangle | 6 |
| 5 | Strings & dates | 6 |
| 6 | Iteration & functions | 8 |
| 7 | Models | 6 |

```r title="Run this once before any exercise"
library(tidyverse)
```

## Section 1. Visualize (8 problems)

### Exercise 1.1: Scatter plot

**Difficulty:** Beginner. Scatter of mpg dataset displ vs hwy.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point()
```

</details>

### Exercise 1.2: Color by class

**Difficulty:** Beginner. Same scatter, colored by class.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy, color = class)) + geom_point()
```

</details>

### Exercise 1.3: Facet by drv

**Difficulty:** Intermediate. Same scatter, facet by drv.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point() + facet_wrap(~ drv)
```

</details>

### Exercise 1.4: Add smoother

**Difficulty:** Intermediate. Add a smoother (default) to the displ-vs-hwy scatter.

<details><summary>Show solution</summary>

```r
ggplot(mpg, aes(displ, hwy)) + geom_point() + geom_smooth()
```

</details>

### Exercise 1.5: Bar chart of cut

**Difficulty:** Beginner. Bar chart of diamonds$cut counts.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar()
```

</details>

### Exercise 1.6: Histogram with binwidth

**Difficulty:** Intermediate. Histogram of diamonds$carat with binwidth = 0.1.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(carat)) + geom_histogram(binwidth = 0.1)
```

</details>

### Exercise 1.7: Position dodge for grouped bars

**Difficulty:** Intermediate. Bar of diamonds cut with fill = clarity, dodged side by side.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut, fill = clarity)) +
  geom_bar(position = "dodge")
```

</details>

### Exercise 1.8: coord_flip for horizontal bars

**Difficulty:** Intermediate. Make the diamonds$cut bar chart horizontal.

<details><summary>Show solution</summary>

```r
ggplot(diamonds, aes(cut)) + geom_bar() + coord_flip()
```

</details>

## Section 2. Transform (8 problems)

### Exercise 2.1: Filter

**Difficulty:** Beginner. mtcars rows with mpg > 25.

<details><summary>Show solution</summary>

```r
mtcars |> filter(mpg > 25)
```

</details>

### Exercise 2.2: Arrange

**Difficulty:** Beginner. Sort mtcars by hp descending.

<details><summary>Show solution</summary>

```r
mtcars |> arrange(desc(hp))
```

</details>

### Exercise 2.3: Select with helpers

**Difficulty:** Intermediate. Select all iris columns starting with "Sepal".

<details><summary>Show solution</summary>

```r
iris |> select(starts_with("Sepal"))
```

</details>

### Exercise 2.4: Mutate

**Difficulty:** Beginner. Add `kpl` = mpg * 0.425 to mtcars.

<details><summary>Show solution</summary>

```r
mtcars |> mutate(kpl = mpg * 0.425)
```

</details>

### Exercise 2.5: Summarise per group

**Difficulty:** Intermediate. Mean and SD of mpg per cyl.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  summarise(mean = mean(mpg), sd = sd(mpg))
```

</details>

### Exercise 2.6: Count

**Difficulty:** Beginner. Count diamonds per cut.

<details><summary>Show solution</summary>

```r
diamonds |> count(cut)
```

</details>

### Exercise 2.7: case_when

**Difficulty:** Intermediate. Bin diamonds price into "budget", "mid", "premium".

<details><summary>Show solution</summary>

```r
diamonds |>
  mutate(tier = case_when(
    price < 1000 ~ "budget",
    price < 5000 ~ "mid",
    TRUE ~ "premium"
  ))
```

</details>

### Exercise 2.8: Pipeline

**Difficulty:** Intermediate. Filter ideal-cut, group by clarity, summarise mean price, sort desc.

<details><summary>Show solution</summary>

```r
diamonds |>
  filter(cut == "Ideal") |>
  group_by(clarity) |>
  summarise(mean_price = mean(price)) |>
  arrange(desc(mean_price))
```

</details>

## Section 3. Tidy (8 problems)

### Exercise 3.1: pivot_longer

**Difficulty:** Beginner. Pivot a wide quarterly table to long.

<details><summary>Show solution</summary>

```r
wide <- tibble(region = c("US","EU"), Q1 = c(100,80), Q2 = c(120,90))
wide |> pivot_longer(Q1:Q2, names_to = "quarter", values_to = "sales")
```

</details>

### Exercise 3.2: pivot_wider

**Difficulty:** Beginner. Pivot a long table back to wide.

<details><summary>Show solution</summary>

```r
long <- tibble(region = c("US","US","EU","EU"),
               quarter = c("Q1","Q2","Q1","Q2"),
               sales = c(100,120,80,90))
long |> pivot_wider(names_from = quarter, values_from = sales)
```

</details>

### Exercise 3.3: separate

**Difficulty:** Intermediate. Split "Last, First" into two columns.

<details><summary>Show solution</summary>

```r
tibble(name = c("Smith, Alice","Jones, Bob")) |>
  separate_wider_delim(name, delim = ", ", names = c("last","first"))
```

</details>

### Exercise 3.4: unite

**Difficulty:** Intermediate. Combine year, month, day to ISO date string.

<details><summary>Show solution</summary>

```r
tibble(year = 2024, month = "01", day = "15") |>
  unite("date", year, month, day, sep = "-")
```

</details>

### Exercise 3.5: drop_na

**Difficulty:** Beginner. Drop airquality rows where Ozone is NA.

<details><summary>Show solution</summary>

```r
airquality |> drop_na(Ozone)
```

</details>

### Exercise 3.6: fill

**Difficulty:** Intermediate. Carry forward NA in a region column.

<details><summary>Show solution</summary>

```r
tibble(region = c("US",NA,NA,"EU"), value = 1:4) |>
  fill(region)
```

</details>

### Exercise 3.7: complete

**Difficulty:** Intermediate. Add missing month combinations with sales = 0.

<details><summary>Show solution</summary>

```r
df <- tibble(region = c("US","EU"), month = c(1,1), sales = c(100,80))
df |> complete(region, month = 1:3, fill = list(sales = 0))
```

</details>

### Exercise 3.8: nest

**Difficulty:** Advanced. Nest iris by Species.

<details><summary>Show solution</summary>

```r
iris |> group_by(Species) |> nest()
```

</details>

## Section 4. Import & wrangle (6 problems)

### Exercise 4.1: Read a CSV

**Difficulty:** Beginner. Read a small CSV with read_csv.

<details><summary>Show solution</summary>

```r
write_csv(mtcars, "demo.csv")
df <- read_csv("demo.csv")
head(df)
```

</details>

### Exercise 4.2: Custom NA values

**Difficulty:** Intermediate. Read CSV treating "N/A" and "" as NA.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", na = c("","NA","N/A"))
```

</details>

### Exercise 4.3: Force a column type

**Difficulty:** Intermediate. Read CSV forcing `id` to character.

<details><summary>Show solution</summary>

```r
read_csv("demo.csv", col_types = cols(id = col_character()))
```

</details>

### Exercise 4.4: Write CSV

**Difficulty:** Beginner. Write mtcars to CSV.

<details><summary>Show solution</summary>

```r
write_csv(mtcars, "out.csv")
```

</details>

### Exercise 4.5: parse_number

**Difficulty:** Intermediate. Convert "$1,234.50" to 1234.5.

<details><summary>Show solution</summary>

```r
parse_number("$1,234.50")
```

</details>

### Exercise 4.6: Read multiple files

**Difficulty:** Advanced. Read 3 CSVs into one tibble with map_dfr.

<details><summary>Show solution</summary>

```r
files <- c("a.csv","b.csv","c.csv")
combined <- map_dfr(files, read_csv, .id = "source")
```

</details>

## Section 5. Strings & dates (6 problems)

### Exercise 5.1: Detect substring

**Difficulty:** Beginner. Filter emails containing "gmail.com".

<details><summary>Show solution</summary>

```r
emails <- c("a@gmail.com","b@yahoo.com","c@gmail.com")
emails[str_detect(emails, "gmail.com")]
```

</details>

### Exercise 5.2: Replace by regex

**Difficulty:** Intermediate. Strip non-digits from "(415) 555-1234".

<details><summary>Show solution</summary>

```r
str_replace_all("(415) 555-1234", "\\D", "")
```

</details>

### Exercise 5.3: Pad with zeros

**Difficulty:** Beginner. Format ID 42 as "000042".

<details><summary>Show solution</summary>

```r
str_pad("42", width = 6, pad = "0")
```

</details>

### Exercise 5.4: Parse mixed dates

**Difficulty:** Intermediate. Parse "01/15/2024" and "2024-02-20" together.

<details><summary>Show solution</summary>

```r
parse_date_time(c("01/15/2024","2024-02-20"), orders = c("mdy","ymd"))
```

</details>

### Exercise 5.5: Extract month

**Difficulty:** Beginner. Get month name from a date.

<details><summary>Show solution</summary>

```r
month(as.Date("2024-04-15"), label = TRUE, abbr = FALSE)
```

</details>

### Exercise 5.6: Floor to month start

**Difficulty:** Intermediate. Snap dates to month-start.

<details><summary>Show solution</summary>

```r
floor_date(as.Date(c("2024-01-15","2024-02-20")), "month")
```

</details>

## Section 6. Iteration & functions (8 problems)

### Exercise 6.1: map_dbl

**Difficulty:** Beginner. Square each of 1:5.

<details><summary>Show solution</summary>

```r
map_dbl(1:5, ~ .x^2)
```

</details>

### Exercise 6.2: map_dfr

**Difficulty:** Intermediate. For each n in 1:3, return a tibble with n and squared.

<details><summary>Show solution</summary>

```r
map_dfr(1:3, ~ tibble(n = .x, sq = .x^2))
```

</details>

### Exercise 6.3: map2

**Difficulty:** Intermediate. Element-wise x^y for two vectors.

<details><summary>Show solution</summary>

```r
map2_dbl(c(2,3,4), c(1,2,3), ~ .x^.y)
```

</details>

### Exercise 6.4: keep

**Difficulty:** Intermediate. Keep list elements with mean > 5.

<details><summary>Show solution</summary>

```r
lst <- list(c(1,2,3), c(7,8,9), c(4,5))
keep(lst, ~ mean(.x) > 5)
```

</details>

### Exercise 6.5: Write a simple function

**Difficulty:** Beginner. Function returning x squared.

<details><summary>Show solution</summary>

```r
sq <- function(x) x^2
sq(5)
```

</details>

### Exercise 6.6: Default arguments

**Difficulty:** Intermediate. Function with default `n = 10`.

<details><summary>Show solution</summary>

```r
fn <- function(x, n = 10) x * n
fn(5)
```

</details>

### Exercise 6.7: Anonymous function

**Difficulty:** Intermediate. R 4.1+ shorthand for an anonymous function.

<details><summary>Show solution</summary>

```r
sapply(1:5, \(x) x^2)
```

</details>

### Exercise 6.8: safely

**Difficulty:** Advanced. Wrap a risky function so it never throws.

<details><summary>Show solution</summary>

```r
safe_log <- safely(log)
result <- safe_log(-1)
list(result$result, result$error)
```

</details>

## Section 7. Models (6 problems)

### Exercise 7.1: Simple linear model

**Difficulty:** Beginner. Fit mpg ~ wt.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
coef(fit)
```

</details>

### Exercise 7.2: Read model summary

**Difficulty:** Intermediate. R-squared and slope p-value from the model.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
s <- summary(fit)
list(r2 = s$r.squared, slope_p = s$coefficients["wt","Pr(>|t|)"])
```

</details>

### Exercise 7.3: Tidy with broom

**Difficulty:** Intermediate. Use broom::tidy to extract coefficients.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt + hp, data = mtcars)
broom::tidy(fit)
```

</details>

### Exercise 7.4: Many models per group

**Difficulty:** Advanced. Fit lm per cyl, return slopes.

<details><summary>Show solution</summary>

```r
mtcars |>
  group_by(cyl) |>
  group_modify(~ broom::tidy(lm(mpg ~ wt, data = .x))) |>
  filter(term == "wt")
```

</details>

### Exercise 7.5: Predict

**Difficulty:** Intermediate. Predict mpg for wt = 3.

<details><summary>Show solution</summary>

```r
fit <- lm(mpg ~ wt, data = mtcars)
predict(fit, newdata = data.frame(wt = 3))
```

</details>

### Exercise 7.6: Train/test split + RMSE

**Difficulty:** Advanced. 70/30 split, train lm, compute test RMSE.

<details><summary>Show solution</summary>

```r
set.seed(1)
n <- nrow(mtcars)
idx <- sample(seq_len(n), 0.7 * n)
tr <- mtcars[idx, ]; te <- mtcars[-idx, ]
fit <- lm(mpg ~ wt + hp, data = tr)
sqrt(mean((te$mpg - predict(fit, te))^2))
```

</details>

## What to do next

After 50 R4DS-aligned problems you have a solid working toolkit. Natural follow-ups:

- **dplyr-Exercises**, **ggplot2-Exercises**, **tidyverse-Exercises**, **Data-Wrangling-Exercises** (all shipped) — depth on each topic.
- **EDA-Exercises** (shipped) — applied data-exploration drills.
- **Linear-Regression-Exercises** (shipped) — modeling beyond R4DS basics.
