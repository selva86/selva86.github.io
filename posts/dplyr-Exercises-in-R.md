---
title: "dplyr Exercises in R: 50 Real-World Practice Problems"
slug: "dplyr-Exercises-in-R"
description: "Sharpen dplyr skills with 50 scenario-based practice exercises in R: filter, mutate, summarise, joins, window functions, multi-step. Hidden solutions."
keywords: "dplyr exercises, dplyr practice problems, dplyr exercises in R, learn dplyr by example, dplyr filter exercises, dplyr summarise exercises, dplyr joins exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "dplyr Exercises"
sidebar_order: 100
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr exercises|dplyr practice|dplyr exercises in R|practice dplyr|dplyr scenario problems"
auto_link_case_sensitive: false
target_keyword: "dplyr exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# dplyr Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty scenario-based dplyr exercises: light on warm-ups, heavy on intermediate problems where you have to combine 2-3 verbs to land the answer. Solutions are hidden behind reveal toggles so you actually try first.</p>

| Section | Topic | Problems | Difficulty mix |
|---|---|---|---|
| 1 | Filter & select | 10 | beginner to intermediate |
| 2 | Mutate & transform | 10 | mostly intermediate |
| 3 | Summarise & group_by | 11 | intermediate, some advanced |
| 4 | Joins | 9 | intermediate |
| 5 | Window functions | 7 | intermediate to advanced |
| 6 | Multi-step wrap-up | 3 | advanced |

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(tidyr)
```

## Section 1. Filter and select (10 problems)

### Exercise 1.1: Find the fuel-efficient four-cylinders

**Scenario:** You're vetting cars for a fuel-economy review. From `mtcars`, list the names and mpg of every 4-cylinder car with mpg above 25.

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mtcars |>
  tibble::rownames_to_column("car") |>
  filter(cyl == 4, mpg > 25) |>
  select(car, mpg)

ex_1_1
```

**Explanation:** filter combines two conditions with comma (= AND). select picks just the columns you need.

</details>

### Exercise 1.2: Filter by a list of names

**Scenario:** Marketing wants stats on three specific models. From `mtcars`, return rows where the car name is one of "Mazda RX4", "Honda Civic", or "Toyota Corolla".

**Difficulty:** Beginner

```r title="Your turn"
target <- c("Mazda RX4", "Honda Civic", "Toyota Corolla")

ex_1_2 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mtcars |>
  tibble::rownames_to_column("car") |>
  filter(car %in% target)
```

**Explanation:** `%in%` tests vector membership. Cleaner than three OR conditions for any list-based filter.

</details>

### Exercise 1.3: Drop columns with negative selection

**Scenario:** You're preparing a streamlined view. From `mtcars`, keep all columns EXCEPT `vs`, `am`, and `carb`.

**Difficulty:** Beginner

```r title="Your turn"
ex_1_3 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- mtcars |>
  select(-vs, -am, -carb)
```

**Explanation:** Prefixing column names with `-` excludes them. Cleaner than listing the 8 you want to keep.

</details>

### Exercise 1.4: Find iris flowers in the upper sepal range

**Scenario:** A botanist asks for flowers with sepal length above the species median. Return rows from `iris` where `Sepal.Length` exceeds the median for that species.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- iris |>
  group_by(Species) |>
  filter(Sepal.Length > median(Sepal.Length)) |>
  ungroup()

nrow(ex_1_4)
```

**Explanation:** group_by makes filter compute the median PER SPECIES, not globally. Without it, you'd pick the global median and get a biased species split.

</details>

### Exercise 1.5: Filter on multiple conditions with NA awareness

**Scenario:** Air quality team needs valid summer readings. From `airquality`, return rows where Month is 6, 7, or 8 AND Ozone is not NA.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- airquality |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- airquality |>
  filter(Month %in% 6:8, !is.na(Ozone))

nrow(ex_1_5)
```

**Explanation:** filter drops NAs in the tested column by default (the test returns NA, treated as FALSE). Adding `!is.na(Ozone)` is the explicit, robust way and makes intent obvious to reviewers.

</details>

### Exercise 1.6: Range filter with between()

**Scenario:** A climate analyst wants comfortable summer days. From `airquality`, return rows where Temp is between 70 and 85 (inclusive) using `between()`.

**Difficulty:** Beginner

```r title="Your turn"
ex_1_6 <- airquality |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- airquality |>
  filter(between(Temp, 70, 85))

nrow(ex_1_6)
```

**Explanation:** `between(x, lo, hi)` is shorthand for `x >= lo & x <= hi`. Cleaner and reads naturally for range checks.

</details>

### Exercise 1.7: Select columns by name pattern

**Scenario:** A botanist wants only the sepal measurements. From `iris`, select all columns whose names start with "Sepal".

**Difficulty:** Beginner

```r title="Your turn"
ex_1_7 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- iris |>
  select(starts_with("Sepal"))

head(ex_1_7)
```

**Explanation:** `starts_with()` is a tidyselect helper. Same family: `ends_with()`, `contains()`, `matches()` (regex). Useful when columns share a naming convention.

</details>

### Exercise 1.8: Filter rows by a regex match in a string column

**Scenario:** A Mercedes recall list. From `mtcars`, return rows whose name starts with "Merc" (Mercedes models).

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_8 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- mtcars |>
  tibble::rownames_to_column("car") |>
  filter(grepl("^Merc", car))

ex_1_8 |> select(car, mpg, cyl)
```

**Explanation:** grepl returns TRUE/FALSE, perfect for filter. `^Merc` anchors to the start of the string. For complex string filters, this is the canonical pattern.

</details>

### Exercise 1.9: Reorder columns putting key fields first

**Scenario:** A reporting team wants the cyl column up front, then everything else in original order. Use select with `everything()`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_9 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_9 <- mtcars |>
  select(cyl, everything())

names(ex_1_9)
```

**Explanation:** `everything()` matches all remaining columns. select(cyl, everything()) puts cyl first without losing anything. Common pattern for foregrounding ID or grouping columns.

</details>

### Exercise 1.10: Filter rows where any numeric column is negative

**Scenario:** Data-quality audit. Build a tibble with some negative values, then return any row where ANY numeric column is negative using `if_any()`.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(
  a = c(1, -2, 3, 4),
  b = c(5, 6, -7, 8),
  c = c(9, 10, 11, 12)
)

ex_1_10 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_10 <- df |>
  filter(if_any(where(is.numeric), ~ .x < 0))

ex_1_10
```

**Explanation:** `if_any(cols, predicate)` returns TRUE if the predicate holds for ANY of the selected columns. Counterpart `if_all()` requires all. Tidyselect helpers like `where()` choose columns by predicate.

</details>

## Section 2. Mutate and transform (10 problems)

### Exercise 2.1: Compute fuel efficiency in km per litre

**Scenario:** You're publishing a non-US version of the mtcars data. Add a `kpl` column (kilometres per litre) using the conversion 1 mpg = 0.425 kpl.

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- mtcars |>
  mutate(kpl = mpg * 0.425)

head(ex_2_1[, c("mpg", "kpl")])
```

**Explanation:** mutate adds a new column derived from existing ones. Vectorized, no loop needed.

</details>

### Exercise 2.2: Bin diamonds into price tiers

**Scenario:** A jeweller wants to bucket inventory. Add a `tier` column to `diamonds` with values "budget" (price < 1000), "mid" (1000-5000), or "premium" (>5000).

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- diamonds |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- diamonds |>
  mutate(tier = case_when(
    price < 1000  ~ "budget",
    price < 5000  ~ "mid",
    TRUE          ~ "premium"
  ))

count(ex_2_2, tier)
```

**Explanation:** case_when reads top-to-bottom; the first matching condition wins. The trailing `TRUE ~ ...` is the catch-all default. Cleaner than nested if_else.

</details>

### Exercise 2.3: Compute and rank fuel efficiency per cylinder group

**Scenario:** Your boss wants the relative ranking within each cylinder count. Add `mpg_rank_within_cyl` showing each car's rank by mpg within its cyl group, with rank 1 being the most efficient.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- mtcars |>
  tibble::rownames_to_column("car") |>
  group_by(cyl) |>
  mutate(mpg_rank_within_cyl = min_rank(desc(mpg))) |>
  ungroup()

ex_2_3 |> select(car, cyl, mpg, mpg_rank_within_cyl) |> arrange(cyl, mpg_rank_within_cyl) |> head()
```

**Explanation:** group_by + min_rank ranks within each cylinder count. desc reverses so highest mpg gets rank 1. Always ungroup at the end to avoid surprising downstream code.

</details>

### Exercise 2.4: Rescale all numeric columns to 0-1

**Scenario:** A machine-learning model needs features in [0, 1]. Min-max-rescale every numeric column of `iris`, leaving `Species` untouched.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- iris |>
  mutate(across(where(is.numeric), ~ (.x - min(.x)) / (max(.x) - min(.x))))

summary(ex_2_4[, 1:4])
```

**Explanation:** `across(where(is.numeric), fn)` applies fn to every numeric column. The `~` defines a lambda; `.x` is the column.

</details>

### Exercise 2.5: Replace negative values with zero AND log-transform

**Scenario:** A skewed numeric column needs cleaning. Take a vector `x = c(-2, 0, 3, 10, NA)`. Convert it to a tibble and add a column `log_x` that floors negatives to 0 then takes log1p.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(x = c(-2, 0, 3, 10, NA))

ex_2_5 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- df |>
  mutate(log_x = log1p(pmax(x, 0)))

ex_2_5
```

**Explanation:** pmax(x, 0) floors negatives at 0 vectorized. log1p handles 0 safely (log(1+0) = 0) where log() would give -Inf. NA propagates correctly.

</details>

### Exercise 2.6: Build a binary flag column with if_else

**Scenario:** A reporting view needs a "high efficiency" flag. From `mtcars`, add `is_efficient` = TRUE when mpg >= 25, FALSE otherwise.

**Difficulty:** Beginner

```r title="Your turn"
ex_2_6 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- mtcars |>
  mutate(is_efficient = if_else(mpg >= 25, TRUE, FALSE))

count(ex_2_6, is_efficient)
```

**Explanation:** `if_else()` is type-stable (unlike base ifelse) and returns the right type for both branches. The shorter `mutate(is_efficient = mpg >= 25)` works too; use if_else when you want different non-boolean values per branch.

</details>

### Exercise 2.7: Compute day-over-day price direction

**Scenario:** Trading desk wants up/down/flat indicators. From a small price tibble, add a `direction` column based on whether today's price is above, below, or equal to yesterday's.

**Difficulty:** Intermediate

```r title="Your turn"
prices <- tibble(
  date  = as.Date("2024-01-01") + 0:5,
  price = c(100, 102, 102, 99, 105, 105)
)

ex_2_7 <- prices |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- prices |>
  arrange(date) |>
  mutate(direction = case_when(
    price > lag(price)  ~ "up",
    price < lag(price)  ~ "down",
    price == lag(price) ~ "flat",
    TRUE                ~ NA_character_
  ))

ex_2_7
```

**Explanation:** lag() returns the previous row; comparing with case_when gives a 3-way label. First row has lag()=NA, so direction is NA there. Always arrange first.

</details>

### Exercise 2.8: Z-score multiple columns with custom names

**Scenario:** A stats team wants z-scored versions of selected columns kept ALONGSIDE originals. From `iris`, add z-score versions of `Sepal.Length` and `Petal.Length` with suffix `_z`.

**Difficulty:** Advanced

```r title="Your turn"
ex_2_8 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- iris |>
  mutate(across(c(Sepal.Length, Petal.Length),
                ~ (.x - mean(.x)) / sd(.x),
                .names = "{.col}_z"))

head(ex_2_8)
```

**Explanation:** The `.names = "{.col}_z"` argument keeps originals AND adds new columns with the suffix. Without it, across overwrites the originals. Crucial when you want to compare or audit.

</details>

### Exercise 2.9: Row-wise mean of selected columns

**Scenario:** Each iris flower's "average measurement". Add `avg_measurement` = mean of the 4 numeric columns per row.

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_9 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_9 <- iris |>
  rowwise() |>
  mutate(avg_measurement = mean(c_across(where(is.numeric)))) |>
  ungroup()

head(ex_2_9)
```

**Explanation:** rowwise() makes each row a "group of 1". c_across() inside row-wise context collects the values into a vector you can pass to mean. Always ungroup after rowwise().

</details>

### Exercise 2.10: Impute NAs with the group mean

**Scenario:** Air-quality cleanup. In `airquality`, replace NA values in `Ozone` with the mean Ozone for that month.

**Difficulty:** Advanced

```r title="Your turn"
ex_2_10 <- airquality |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_10 <- airquality |>
  group_by(Month) |>
  mutate(Ozone = if_else(is.na(Ozone), mean(Ozone, na.rm = TRUE), Ozone)) |>
  ungroup()

sum(is.na(ex_2_10$Ozone))
```

**Explanation:** group_by + mutate computes the mean per month, then if_else swaps it in for NAs only. `na.rm = TRUE` is critical, otherwise the mean itself would be NA. Cleaner than join-based imputation.

</details>

## Section 3. Summarise and group_by (11 problems)

### Exercise 3.1: Mean MPG per cylinder

**Scenario:** Standard summary table for a quick brief. Compute the mean mpg per cyl group.

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg))

ex_3_1
```

**Explanation:** group_by + summarise is the canonical aggregation pattern. mean() collapses each group to one number.

</details>

### Exercise 3.2: Multiple stats per group

**Scenario:** Build a per-cylinder summary table with row count, mean, SD, and number of unique gear values. Sort by mean descending.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- mtcars |>
  group_by(cyl) |>
  summarise(
    n          = n(),
    mean_mpg   = mean(mpg),
    sd_mpg     = sd(mpg),
    n_gear     = n_distinct(gear)
  ) |>
  arrange(desc(mean_mpg))

ex_3_2
```

**Explanation:** Multiple stats inside one summarise. `n()` counts rows in the group; `n_distinct` counts unique values. arrange sorts the result.

</details>

### Exercise 3.3: Filter groups by size

**Scenario:** A statistical test needs at least 10 observations per group. From `mtcars`, keep only the cyl groups with >= 10 cars and report the mean mpg of each.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mtcars |>
  group_by(cyl) |>
  filter(n() >= 10) |>
  summarise(mean_mpg = mean(mpg), n = n())

ex_3_3
```

**Explanation:** filter inside group_by uses `n()` for the group size. Drops whole groups whose size is below the threshold before the summarise.

</details>

### Exercise 3.4: Most-recent record per group

**Scenario:** You have multi-row event logs and need each user's last action. Build a sample tibble of users with timestamps, then return the row with the latest timestamp per user.

**Difficulty:** Intermediate

```r title="Your turn"
events <- tibble(
  user = c("a","a","a","b","b","c"),
  ts   = as.Date(c("2024-01-05","2024-02-15","2024-03-10",
                    "2024-01-20","2024-04-01","2024-02-25")),
  action = c("login","purchase","login","login","purchase","login")
)

ex_3_4 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- events |>
  slice_max(ts, n = 1, by = user)

ex_3_4
```

**Explanation:** slice_max with `by =` picks the row(s) with the maximum timestamp per group in one verb. dplyr 1.1+ syntax; cleaner than group_by + arrange + slice(1).

</details>

### Exercise 3.5: Compute group-level proportion

**Scenario:** A merchandising team wants each diamond's clarity expressed as a share of the row's CUT total. Add a `clarity_share` column that is the proportion of rows of that clarity within each cut.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- diamonds |>
  count(cut, clarity) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- diamonds |>
  count(cut, clarity) |>
  group_by(cut) |>
  mutate(clarity_share = n / sum(n)) |>
  ungroup()

head(ex_3_5)
```

**Explanation:** count creates a per-(cut, clarity) frequency. group_by(cut) + mutate(n / sum(n)) divides each row by its cut's total. ungroup at the end to avoid leaking grouping.

</details>

### Exercise 3.6: Per-group quantile table

**Scenario:** A data scientist asks for the 25th, 50th, 75th percentiles of mpg per cyl group, in long format. Use reframe (dplyr 1.1+).

**Difficulty:** Advanced

```r title="Your turn"
ex_3_6 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- mtcars |>
  group_by(cyl) |>
  reframe(
    quartile = c("p25","p50","p75"),
    mpg      = quantile(mpg, c(0.25, 0.50, 0.75))
  )

ex_3_6
```

**Explanation:** summarise enforces 1 row per group; reframe allows multiple rows. Perfect for per-group quantile tables.

</details>

### Exercise 3.7: Top N rows per group

**Scenario:** Each cyl group's top 3 most fuel-efficient cars. Use slice_max with n = 3 and `by =`.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_7 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_7 <- mtcars |>
  tibble::rownames_to_column("car") |>
  slice_max(mpg, n = 3, by = cyl)

ex_3_7 |> select(car, cyl, mpg) |> arrange(cyl, desc(mpg))
```

**Explanation:** slice_max with `n = 3` and `by =` returns top 3 per group in one expression. Ties go above n. Use `with_ties = FALSE` to cap exactly at 3.

</details>

### Exercise 3.8: Pivot summary to wide format

**Scenario:** A dashboard needs mean mpg and mean hp per cyl as columns, not rows. Combine summarise across with pivot_longer/wider.

**Difficulty:** Advanced

```r title="Your turn"
ex_3_8 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- mtcars |>
  group_by(cyl) |>
  summarise(across(c(mpg, hp), mean, .names = "{.col}_mean"))

ex_3_8
```

**Explanation:** `across(c(mpg, hp), mean, .names = "{.col}_mean")` produces `mpg_mean` and `hp_mean` columns directly; no pivot needed. The `.names` template controls naming. For more complex stats (mean and sd of each), pass a list of functions.

</details>

### Exercise 3.9: Weighted mean per group

**Scenario:** Inventory team wants the weight-weighted mean price per diamond cut, where the weight is carat. Compute weighted mean price by cut.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_9 <- diamonds |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_9 <- diamonds |>
  group_by(cut) |>
  summarise(
    n              = n(),
    mean_price     = mean(price),
    weighted_price = weighted.mean(price, w = carat)
  )

ex_3_9
```

**Explanation:** weighted.mean(x, w) gives sum(x*w)/sum(w). Compare to plain mean: weighted version pulls toward heavier diamonds (which dominate inventory value).

</details>

### Exercise 3.10: Count and percentage in one pass

**Scenario:** A demographics view: count and percent of each species in iris. Use count + mutate.

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_10 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_10 <- iris |>
  count(Species) |>
  mutate(pct = round(n / sum(n) * 100, 1))

ex_3_10
```

**Explanation:** count() gives the n column; mutate adds pct. sum(n) is the total since we're not grouped after count(). Standard frequency-table pattern.

</details>

### Exercise 3.11: Detect outliers per group with IQR

**Scenario:** A QC workflow flags outliers using the 1.5*IQR rule. Per cyl group, count how many rows have mpg outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR].

**Difficulty:** Advanced

```r title="Your turn"
ex_3_11 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_11 <- mtcars |>
  group_by(cyl) |>
  summarise(
    n          = n(),
    q1         = quantile(mpg, 0.25),
    q3         = quantile(mpg, 0.75),
    iqr        = q3 - q1,
    n_outliers = sum(mpg < q1 - 1.5*iqr | mpg > q3 + 1.5*iqr)
  )

ex_3_11
```

**Explanation:** summarise can use derived columns referenced later in the same call. sum() over a logical vector counts TRUEs. Standard non-parametric outlier detection per group.

</details>

## Section 4. Joins (9 problems)

### Exercise 4.1: Augment data with a lookup

**Scenario:** Engineering wants every mtcars row labelled with its cyl-group description. Build a 3-row lookup tibble (4 -> "small", 6 -> "medium", 8 -> "large") and join it to mtcars.

**Difficulty:** Beginner

```r title="Your turn"
labels <- tibble(cyl = c(4, 6, 8), label = c("small","medium","large"))

ex_4_1 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mtcars |>
  left_join(labels, by = "cyl")

head(ex_4_1[, c("mpg","cyl","label")])
```

**Explanation:** left_join keeps every row of mtcars and adds the label column. Standard "augment with lookup" pattern.

</details>

### Exercise 4.2: Find orphan records

**Scenario:** A data-quality check. Build two tibbles representing customers and orders. Identify orders whose customer_id does NOT appear in the customer master table.

**Difficulty:** Intermediate

```r title="Your turn"
customers <- tibble(id = 1:5, name = c("Alice","Bob","Carol","Dan","Eve"))
orders    <- tibble(order_id = 101:105,
                    customer_id = c(1, 2, 7, 3, 9),
                    amount = c(50, 80, 30, 65, 120))

ex_4_2 <- orders |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- orders |>
  anti_join(customers, by = c("customer_id" = "id"))

ex_4_2
```

**Explanation:** anti_join returns rows of x with NO match in y. Different key names handled via named vector.

</details>

### Exercise 4.3: Many-to-many lookup with filter

**Scenario:** A sales table has multiple rows per product; you want each product's most recent sale joined with that product's metadata. Combine slice_max + left_join.

**Difficulty:** Intermediate

```r title="Your turn"
sales <- tibble(
  product = rep(c("Widget","Gadget","Sprocket"), each = 3),
  date    = as.Date(rep(c("2024-01-15","2024-03-20","2024-05-10"), 3)),
  amount  = c(100, 120, 150, 80, 90, 95, 200, 220, 250)
)
products <- tibble(product = c("Widget","Gadget","Sprocket"),
                   category = c("hardware","tool","mechanical"))

ex_4_3 <- sales |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- sales |>
  slice_max(date, n = 1, by = product) |>
  left_join(products, by = "product")

ex_4_3
```

**Explanation:** Reduce to one row per product first, then enrich. Avoids the row-multiplication trap of joining first.

</details>

### Exercise 4.4: Multi-column key join

**Scenario:** A regional sales report. Join a sales table with a regional pricing table on BOTH region and product.

**Difficulty:** Intermediate

```r title="Your turn"
sales <- tibble(
  region  = c("US","US","EU","EU","ASIA"),
  product = c("X","Y","X","Y","X"),
  qty     = c(100, 80, 50, 40, 30)
)
prices <- tibble(
  region  = c("US","US","EU","EU"),
  product = c("X","Y","X","Y"),
  price   = c(10, 20, 12, 22)
)

ex_4_4 <- sales |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- sales |>
  left_join(prices, by = c("region","product")) |>
  mutate(revenue = qty * price)

ex_4_4
```

**Explanation:** Vector `by` does multi-column matching. ASIA/X has no price match; gets NA. Useful for data audits: NAs flag missing rows in the lookup.

</details>

### Exercise 4.5: Reconcile two snapshots

**Scenario:** Compliance asks: between two daily snapshots of a customer table, which customers were ADDED, which were REMOVED? Use anti_join twice.

**Difficulty:** Intermediate

```r title="Your turn"
prev <- tibble(id = 1:5, name = c("Alice","Bob","Carol","Dan","Eve"))
curr <- tibble(id = c(1, 2, 4, 5, 6), name = c("Alice","Bob","Dan","Eve","Frank"))

added   <- # your code here
removed <- # your code here

list(added = added, removed = removed)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
added   <- curr |> anti_join(prev, by = "id")
removed <- prev |> anti_join(curr, by = "id")

list(added = added, removed = removed)
```

**Explanation:** Two anti_joins with x and y swapped give a complete diff. Standard reconciliation pattern; cleaner than full_join + classify.

</details>

### Exercise 4.6: Inequality join with join_by()

**Scenario:** A range lookup. Match each transaction to the price tier whose threshold it falls under. Use join_by with `>=` (dplyr 1.1+).

**Difficulty:** Advanced

```r title="Your turn"
txns <- tibble(txn_id = 1:5, amount = c(50, 250, 1500, 9000, 40))
tiers <- tibble(min_amount = c(0, 100, 1000, 5000),
                tier       = c("micro","small","medium","large"))

ex_4_6 <- txns |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- txns |>
  left_join(tiers, by = join_by(closest(amount >= min_amount)))

ex_4_6
```

**Explanation:** join_by with `closest()` and `>=` finds the GREATEST min_amount that is still <= amount, i.e., the tier the value falls into. Critical for range-based lookups: rolling joins, time-window matches, price brackets.

</details>

### Exercise 4.7: Detect many-to-many duplication

**Scenario:** Two tables joined on a key that has duplicates on both sides will silently multiply rows. Reproduce and detect this with `relationship = "many-to-many"`.

**Difficulty:** Intermediate

```r title="Your turn"
a <- tibble(id = c(1, 1, 2), label_a = c("x","y","z"))
b <- tibble(id = c(1, 1, 2), label_b = c("p","q","r"))

ex_4_7 <- a |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_7 <- a |>
  left_join(b, by = "id", relationship = "many-to-many")

ex_4_7
```

**Explanation:** dplyr 1.1+ warns by default if the join is many-to-many (likely accidental). Setting `relationship = "many-to-many"` says you mean it. Result has 5 rows (id=1 yields 2x2=4, id=2 yields 1). Always check row counts after a join.

</details>

### Exercise 4.8: Merge two snapshots with coalesce

**Scenario:** Two dataframes with overlapping IDs but each has some columns the other lacks. Build a merged view that keeps all rows from both, with values from `curr` preferred over `prev`.

**Difficulty:** Intermediate

```r title="Your turn"
prev <- tibble(id = c(1, 2, 3), score = c(10, 20, 30))
curr <- tibble(id = c(2, 3, 4), score = c(25, NA, 40))

ex_4_8 <- prev |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- prev |>
  full_join(curr, by = "id", suffix = c("_prev","_curr")) |>
  mutate(score = coalesce(score_curr, score_prev)) |>
  select(id, score)

ex_4_8 |> arrange(id)
```

**Explanation:** full_join keeps all ids. coalesce(a, b) returns first non-NA. By passing `score_curr` first, we prefer current; if it's NA, fall back to prev. Standard "upsert" pattern.

</details>

### Exercise 4.9: Filter via semi_join

**Scenario:** Keep only orders whose customer is in a VIP list, but DO NOT add VIP columns. Use semi_join.

**Difficulty:** Intermediate

```r title="Your turn"
orders <- tibble(order_id = 1:6, customer = c("a","b","c","a","d","e"), amount = c(50,80,30,90,120,40))
vips   <- tibble(customer = c("a","c","d"), tier = c("gold","silver","gold"))

ex_4_9 <- orders |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_9 <- orders |>
  semi_join(vips, by = "customer")

ex_4_9
```

**Explanation:** semi_join keeps only x rows that have a match in y, but adds NO columns from y. Great as a filter when you only need the membership check. Counterpart to anti_join.

</details>

## Section 5. Window functions (7 problems)

### Exercise 5.1: Day-over-day percentage change

**Scenario:** Trading desk wants daily return. Build a tibble of dates and prices in chronological order, then compute the percent change vs. the previous day.

**Difficulty:** Intermediate

```r title="Your turn"
prices <- tibble(
  date  = as.Date("2024-01-01") + 0:9,
  price = c(100, 102, 99, 105, 110, 108, 112, 115, 113, 120)
)

ex_5_1 <- prices |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- prices |>
  arrange(date) |>
  mutate(pct_change = (price - lag(price)) / lag(price) * 100)

ex_5_1
```

**Explanation:** lag returns the previous row's value; the first row's pct_change is NA because there's no day before. arrange first to be safe.

</details>

### Exercise 5.2: Running total per group

**Scenario:** Each user's lifetime spend at any point. Build a small events tibble and add a column `cumulative_spend` that is the running total per user, ordered by date.

**Difficulty:** Intermediate

```r title="Your turn"
events <- tibble(
  user   = c("a","a","a","b","b"),
  date   = as.Date(c("2024-01-05","2024-02-10","2024-03-01",
                      "2024-01-15","2024-02-20")),
  amount = c(50, 80, 30, 100, 90)
)

ex_5_2 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- events |>
  arrange(user, date) |>
  group_by(user) |>
  mutate(cumulative_spend = cumsum(amount)) |>
  ungroup()

ex_5_2
```

**Explanation:** cumsum within group gives running totals. arrange first by (user, date) ensures the cumulative order is chronological per user.

</details>

### Exercise 5.3: Days since first event per user

**Scenario:** Cohort analysis. Add a column `days_since_first` showing how many days since the user's first event for each row.

**Difficulty:** Intermediate

```r title="Your turn"
events <- tibble(
  user = c("a","a","a","b","b"),
  date = as.Date(c("2024-01-05","2024-01-20","2024-02-03",
                    "2024-02-01","2024-03-15"))
)

ex_5_3 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- events |>
  arrange(user, date) |>
  group_by(user) |>
  mutate(days_since_first = as.integer(date - first(date))) |>
  ungroup()

ex_5_3
```

**Explanation:** first() inside a group returns the first value; subtracting gives the gap. as.integer drops the difftime class.

</details>

### Exercise 5.4: Detect first big purchase per user

**Scenario:** Marketing wants each user's first purchase >= $100. From a small events tibble, return rows where `amount >= 100` AND it is that user's first such row.

**Difficulty:** Advanced

```r title="Your turn"
events <- tibble(
  user   = c("a","a","a","b","b","b","c","c"),
  date   = as.Date(c("2024-01-05","2024-02-10","2024-03-01",
                      "2024-01-15","2024-02-20","2024-04-10",
                      "2024-01-20","2024-02-15")),
  amount = c(50, 110, 130, 90, 200, 250, 80, 95)
)

ex_5_4 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- events |>
  filter(amount >= 100) |>
  slice_min(date, n = 1, by = user)

ex_5_4
```

**Explanation:** filter narrows to qualifying rows; slice_min picks the earliest per user. Users without any qualifying row are absent from the output, as desired.

</details>

### Exercise 5.5: 3-day rolling mean

**Scenario:** Smooth a noisy daily price series with a 3-day moving average. Use a manual window via lag.

**Difficulty:** Advanced

```r title="Your turn"
prices <- tibble(
  date  = as.Date("2024-01-01") + 0:6,
  price = c(100, 102, 99, 105, 110, 108, 112)
)

ex_5_5 <- prices |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- prices |>
  arrange(date) |>
  mutate(ma3 = (price + lag(price) + lag(price, 2)) / 3)

ex_5_5
```

**Explanation:** Sum the current value with two lags then divide. First two rows are NA (insufficient history). For longer windows, switch to slider::slide_dbl or zoo::rollmean, but lag-based works for small N and stays inside dplyr.

</details>

### Exercise 5.6: Detect gaps in date sequence per group

**Scenario:** A daily-events table should have one row per date per user. Identify any user/date combos where the gap to the next date exceeds 7 days.

**Difficulty:** Advanced

```r title="Your turn"
events <- tibble(
  user = c("a","a","a","b","b","b"),
  date = as.Date(c("2024-01-05","2024-01-08","2024-01-25",
                    "2024-02-01","2024-02-03","2024-03-15"))
)

ex_5_6 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- events |>
  arrange(user, date) |>
  group_by(user) |>
  mutate(gap = as.integer(lead(date) - date)) |>
  ungroup() |>
  filter(gap > 7)

ex_5_6
```

**Explanation:** lead() reaches FORWARD (next row's value). Subtract to get the gap. Filter on gap > 7 yields rows whose next event is more than a week away. Useful for retention or telemetry monitoring.

</details>

### Exercise 5.7: Rank with ties

**Scenario:** A leaderboard with three students tied at the top. Compare min_rank (1, 1, 1, 4) vs dense_rank (1, 1, 1, 2) vs row_number (1, 2, 3, 4).

**Difficulty:** Intermediate

```r title="Your turn"
scores <- tibble(student = c("A","B","C","D"), score = c(95, 95, 95, 88))

ex_5_7 <- scores |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- scores |>
  mutate(
    r_min   = min_rank(desc(score)),
    r_dense = dense_rank(desc(score)),
    r_row   = row_number(desc(score))
  )

ex_5_7
```

**Explanation:** Ties: min_rank skips positions ("Olympic" ranking), dense_rank doesn't, row_number breaks ties arbitrarily. Pick based on how a tie should be reported in your output.

</details>

## Section 6. Multi-step wrap-up (3 problems)

### Exercise 6.1: Build a customer scorecard

**Scenario:** You're building an executive scorecard. From the events tibble below, produce one row per user containing: number of events, total spend, average spend, days from first to last event, and a "tier" label ("VIP" if total spend >= $200, "Regular" otherwise). Order by total spend descending.

**Difficulty:** Advanced

```r title="Your turn"
events <- tibble(
  user   = c("a","a","a","b","b","c","c","c","d","d"),
  date   = as.Date(c("2024-01-05","2024-02-10","2024-03-01",
                      "2024-01-15","2024-02-20","2024-01-20",
                      "2024-02-15","2024-04-10","2024-03-05","2024-03-20")),
  amount = c(50, 110, 30, 90, 200, 80, 95, 250, 120, 80)
)

ex_6_1 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- events |>
  group_by(user) |>
  summarise(
    n_events     = n(),
    total_spend  = sum(amount),
    avg_spend    = mean(amount),
    days_active  = as.integer(max(date) - min(date)),
    .groups      = "drop"
  ) |>
  mutate(tier = if_else(total_spend >= 200, "VIP", "Regular")) |>
  arrange(desc(total_spend))

ex_6_1
```

**Explanation:** group_by + summarise computes 4 stats at once. Then mutate adds a derived label. arrange sorts the scorecard. This pattern is the bread-and-butter of analytics work.

</details>

### Exercise 6.2: Cohort retention table

**Scenario:** Marketing wants a retention view: users who first transacted in a given month, and how many of them came back in the following month. Compute a 2-column table: cohort (first-transaction month) and retained_next_month (count).

**Difficulty:** Advanced

```r title="Your turn"
events <- tibble(
  user   = c("a","a","b","b","c","c","d","e","e","f"),
  month  = c(1, 2, 1, 3, 2, 3, 1, 2, 3, 3)
)

ex_6_2 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
first_month <- events |>
  group_by(user) |>
  summarise(cohort = min(month), .groups = "drop")

next_month <- events |>
  inner_join(first_month, by = "user") |>
  filter(month == cohort + 1) |>
  distinct(user, cohort)

ex_6_2 <- first_month |>
  count(cohort, name = "n_cohort") |>
  left_join(
    next_month |> count(cohort, name = "retained_next_month"),
    by = "cohort"
  ) |>
  mutate(retained_next_month = coalesce(retained_next_month, 0L))

ex_6_2
```

**Explanation:** Step 1: each user's first month (cohort). Step 2: who had an event in cohort+1. Step 3: count cohorts and retentions and join. coalesce(., 0) fills cohorts with no retained users. Foundational analytics pattern.

</details>

### Exercise 6.3: RFM segmentation

**Scenario:** A classic marketing segmentation. Compute R (days since last purchase), F (purchase count), M (total spend) per user, then assign each metric to a 1-3 quantile bucket (3 = best). Concatenate into an RFM score string.

**Difficulty:** Advanced

```r title="Your turn"
purchases <- tibble(
  user    = c("a","a","a","b","b","c","c","c","c","d","d","e"),
  date    = as.Date(c("2024-01-05","2024-03-10","2024-04-25",
                       "2024-02-20","2024-04-15","2024-01-15",
                       "2024-02-20","2024-03-25","2024-04-30",
                       "2024-04-01","2024-04-20","2024-02-10")),
  amount  = c(50, 80, 120, 90, 100, 30, 40, 50, 60, 200, 220, 70)
)
ref_date <- as.Date("2024-05-01")

ex_6_3 <- purchases |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- purchases |>
  group_by(user) |>
  summarise(
    R = as.integer(ref_date - max(date)),
    F = n(),
    M = sum(amount),
    .groups = "drop"
  ) |>
  mutate(
    R_score = ntile(-R, 3),
    F_score = ntile(F, 3),
    M_score = ntile(M, 3),
    RFM     = paste0(R_score, F_score, M_score)
  ) |>
  arrange(desc(RFM))

ex_6_3
```

**Explanation:** ntile splits a vector into n buckets by quantile. Negate R because LOWER recency is better. paste0 concatenates the three scores into a 3-char segment label. RFM "333" is the top tier; "111" is at-risk. Real campaigns use 5 buckets, but the pattern scales.

</details>

## What to do next

After 50 exercises, you should be writing solutions before reading explanations. Natural follow-ups:

- **dplyr function-deep posts** in this site cover each verb's full API: filter, mutate, summarise, group_by, joins, slice_*, across, case_when, ntile, lead/lag, and the rest.
- **Topic sub-hubs** (coming): joins-only, window-functions-only, and grouped-operations-only practice sets for targeted drilling.
- **Combine with tidyr**: pivot and nest hubs cover the reshape-and-iterate patterns dplyr alone cannot.
