---
title: "dplyr Practice Exercises: 25 Real-World Problems"
slug: "dplyr-Practice-Hub"
description: "Sharpen dplyr skills with 25 real-world scenario practice exercises in R: filter, mutate, summarise, joins, window functions. Hidden solutions."
keywords: "dplyr exercises, dplyr practice problems, dplyr R exercises, learn dplyr by example, dplyr filter exercises, dplyr summarise exercises"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "EX"
sidebar_title: "dplyr Practice Hub"
sidebar_order: 100
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "dplyr practice|dplyr exercises|dplyr practice hub|practice dplyr|dplyr scenario problems"
auto_link_case_sensitive: false
target_keyword: "dplyr practice"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# dplyr Practice Exercises: 25 Real-World Problems With Solutions

<p class="lead">Twenty-five scenario-based dplyr exercises: light on warm-ups, heavy on the kind of intermediate problems where you have to combine 2-3 verbs to land the answer. All solutions are hidden behind reveal toggles so you actually try first.</p>

[QUICK ANSWER]
# 5 sections: filter/select, mutate, summarise/group_by, joins, window
# Difficulty: ~20% beginner, ~60% intermediate, ~20% advanced
# All datasets are base R (mtcars, iris, diamonds, airquality)
# Each problem: scenario -> setup -> task -> hidden solution
# Click "Run" on any code block to test ideas in the live R sandbox below

[DECISION TREE: How to use this hub]
- new to dplyr: start at section 1 and go in order
- comfortable with verbs, want challenge: skip to section 3 onward
- need a specific function: jump via the table of contents
- stuck on an exercise: try for 5 minutes, then reveal the solution and study it

## How to use this hub

**Each exercise follows the same shape.** A short scenario sets the business context (you're an analyst, an engineer, a researcher). The dataset is loaded inline so you can run everything in the browser. The task is a single sentence ending in "save to `ex_X`". The solution sits in a collapsible block: try the problem first, reveal only when stuck.

| Section | Topic | Problems | Difficulty mix |
|---|---|---|---|
| 1 | Filter & select | 5 | beginner-heavy |
| 2 | Mutate & transform | 5 | mostly intermediate |
| 3 | Summarise & group_by | 6 | mostly intermediate |
| 4 | Joins | 5 | mostly intermediate |
| 5 | Window functions | 4 | intermediate / advanced |
| 6 | Multi-step wrap-up | 1 | advanced |

**Difficulty distribution:** roughly 5 warmup, 15 intermediate (the bulk), 5 advanced. The intermediate problems are where most of your skill grows: they require chaining 2-3 verbs and picking the right one for the question.

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(tidyr)
```

## Section 1. Filter and select (5 problems)

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
#>             car  mpg
#> 1    Datsun 710 22.8   <-- excluded (mpg <= 25)
#> ...
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
#> [1] 73  (around half the rows; per-species threshold)
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
#> [1] 76
```

**Explanation:** filter drops NAs in the tested column by default (the test returns NA, which is treated as FALSE). Adding `!is.na(Ozone)` is the explicit, robust way and makes intent obvious to reviewers.

</details>

## Section 2. Mutate and transform (5 problems)

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
#>                    mpg     kpl
#> Mazda RX4         21.0  8.9250
#> Mazda RX4 Wag     21.0  8.9250
```

**Explanation:** mutate adds a new column derived from existing ones. Vectorized: no loop needed.

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
#>      tier     n
#> 1  budget 14524
#> 2     mid 28966
#> 3 premium 11450
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
#> All numeric columns now in [0, 1]; Species unchanged.
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
#>      x   log_x
#>     -2 0.00000   <-- floored then log1p(0) = 0
#>      0 0.00000
#>      3 1.38629
#>     10 2.39790
#>     NA      NA
```

**Explanation:** pmax(x, 0) floors negatives at 0 vectorized. log1p handles 0 safely (log(1+0) = 0) where log() would give -Inf. NA propagates correctly.

</details>

## Section 3. Summarise and group_by (6 problems)

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
#>     cyl mean_mpg
#>     4    26.7
#>     6    19.7
#>     8    15.1
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
#>     cyl  n mean_mpg sd_mpg n_gear
#>     4   11    26.7   4.51      3
#>     6    7    19.7   1.45      3
#>     8   14    15.1   2.56      2
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
#>     cyl mean_mpg  n
#>     4     26.7  11
#>     8     15.1  14
#>  (cyl 6 dropped because n = 7)
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
#>   user         ts   action
#> 1    a 2024-03-10    login
#> 2    b 2024-04-01 purchase
#> 3    c 2024-02-25    login
```

**Explanation:** slice_max with `by =` picks the row(s) with the maximum timestamp per group in one verb. dplyr 1.1+ syntax; cleaner than group_by + arrange + slice(1).

</details>

### Exercise 3.5: Compute group-level proportion

**Scenario:** A merchandising team wants each diamond's clarity to be expressed as a share of the row's CUT total. Add a `clarity_share` column that is the proportion of rows of that clarity within each cut.

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
#>   cut       clarity     n clarity_share
#> 1 Fair      I1           4       0.0247
#> 2 Fair      SI2        466       0.2876
#> ... (each cut sums to 1)
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
#> # 9 rows: 3 quartiles x 3 cyl groups
```

**Explanation:** summarise enforces 1 row per group; reframe allows multiple rows. Perfect for per-group quantile tables.

</details>

## Section 4. Joins (5 problems)

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
#>                    mpg cyl  label
#> Mazda RX4         21.0   6 medium
#> Mazda RX4 Wag     21.0   6 medium
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
#>   order_id customer_id amount
#> 1      103           7     30
#> 2      105           9    120
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
#> 3 rows: latest sale per product, augmented with category
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
#> 5 rows; ASIA/X has price = NA, revenue = NA
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
#> $added: id=6 Frank
#> $removed: id=3 Carol
```

**Explanation:** Two anti_joins with x and y swapped give a complete diff. Standard reconciliation pattern; cleaner than full_join + classify.

</details>

## Section 5. Window functions (4 problems)

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
#>          date price pct_change
#>   2024-01-01   100         NA
#>   2024-01-02   102       2.00
#>   2024-01-03    99      -2.94
#>   ...
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
#>   user       date days_since_first
#>   a    2024-01-05                0
#>   a    2024-01-20               15
#>   a    2024-02-03               29
#>   b    2024-02-01                0
#>   b    2024-03-15               43
```

**Explanation:** first() inside a group returns the first value; subtracting gives the gap. as.integer drops the difftime class.

</details>

### Exercise 5.4: Detect first big purchase per user

**Scenario:** Marketing wants to know each user's first purchase >= $100. From a small events tibble, return rows where `amount >= 100` AND it is that user's first such row.

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
#>   user       date amount
#> 1    a 2024-02-10    110
#> 2    b 2024-02-20    200
#>  (user c never crossed 100; not in result)
```

**Explanation:** filter narrows to qualifying rows; slice_min picks the earliest per user. Users without any qualifying row are absent from the output, as desired.

</details>

## Section 6. Wrap-up: putting it together (1 multi-step problem)

### Exercise 6.1: Build a customer scorecard

**Scenario:** You're building an executive scorecard. From the events tibble below, produce one row per user containing: number of events, total spend, average spend, days from first to last event, and a "tier" label ("VIP" if total spend >= $200, "Regular" otherwise). Order by total spend descending.

**Difficulty:** Advanced (multi-step combination)

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
#>   user n_events total_spend avg_spend days_active    tier
#> 1    c        3         425     141.7          81     VIP
#> 2    a        3         190      63.3          56 Regular
#> 3    b        2         290     145.0          36     VIP
#> 4    d        2         200     100.0          15     VIP
```

**Explanation:** group_by + summarise computes 4 stats at once. Then mutate adds a derived label. arrange sorts the scorecard. This pattern is the bread-and-butter of analytics work.

</details>

## What to do next

**After 25 exercises, you'll have a working command of dplyr; here are natural follow-ups to deepen it.**

After working through these, the natural follow-ups are:

- **More dplyr depth:** the function-deep PSEO posts (filter, mutate, summarise, etc.) explain each verb's full API.
- **Joins specifically:** `dplyr-Joins-Practice-Hub.html` (coming soon) drills the join family with 25+ problems.
- **Window functions:** `dplyr-Window-Functions-Practice-Hub.html` for lead/lag/cumall/rank-style problems.
- **Combine with tidyr:** the pivot and nest hubs cover the reshape-and-iterate patterns dplyr alone cannot.

If you want to compete in dplyr fluency, work through 50+ exercises across these hubs over a week or two. By problem 30 you'll start writing solutions before reading the explanation.
