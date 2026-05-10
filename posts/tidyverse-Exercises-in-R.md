---
title: "Tidyverse Exercises in R: 50 Real-World Practice Problems"
slug: "tidyverse-Exercises-in-R"
description: "Sharpen tidyverse skills with 50 cross-package practice problems combining dplyr, tidyr, stringr, lubridate, purrr on real workflows. Hidden solutions."
keywords: "tidyverse exercises, tidyverse practice, tidyverse exercises in R, learn tidyverse by example, tidyverse practice problems, dplyr tidyr exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Tidyverse Exercises"
sidebar_order: 103
fr_parent: "R-Tutorial.html"
auto_link_terms: "tidyverse exercises|tidyverse practice|tidyverse exercises in R|practice tidyverse|tidyverse problems"
auto_link_case_sensitive: false
target_keyword: "tidyverse exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Tidyverse Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty cross-package practice problems combining dplyr, tidyr, stringr, lubridate, and purrr on real-world workflows. The intermediate sweet spot where you have to pick the right verb from the right package and chain them. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(stringr)
library(lubridate)
library(purrr)
library(tibble)
```

## Section 1. Reshape and wrangle (8 problems)

### Exercise 1.1: Wide to long

**Scenario:** You receive quarterly sales as a wide table with columns Q1-Q4. Pivot to long format with columns `region`, `quarter`, `sales`.

**Difficulty:** Beginner

```r title="Your turn"
wide <- tibble(region = c("US","EU","ASIA"),
               Q1 = c(100,80,60), Q2 = c(120,90,70),
               Q3 = c(115,95,75), Q4 = c(130,100,90))

ex_1_1 <- wide |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- wide |>
  pivot_longer(cols = Q1:Q4, names_to = "quarter", values_to = "sales")

ex_1_1
```

**Explanation:** pivot_longer collapses wide columns into 2: a names column and a values column. cols accepts tidyselect (Q1:Q4, starts_with("Q"), where(is.numeric), etc.).

</details>

### Exercise 1.2: Long to wide

**Scenario:** Same data, opposite direction. Take a long table of (region, quarter, sales) and pivot to one column per quarter.

**Difficulty:** Beginner

```r title="Your turn"
long <- tibble(region = rep(c("US","EU","ASIA"), each = 4),
               quarter = rep(c("Q1","Q2","Q3","Q4"), 3),
               sales = c(100,120,115,130, 80,90,95,100, 60,70,75,90))

ex_1_2 <- long |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- long |>
  pivot_wider(names_from = quarter, values_from = sales)

ex_1_2
```

**Explanation:** pivot_wider goes the other way: each unique value of names_from becomes a new column, with the values_from values placed in.

</details>

### Exercise 1.3: Separate a combined column

**Scenario:** A column named `full_name` contains "Last, First" entries. Split into `last` and `first`.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(full_name = c("Smith, Alice","Jones, Bob","Lee, Carol"))

ex_1_3 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- df |>
  separate_wider_delim(full_name, delim = ", ", names = c("last","first"))

ex_1_3
```

**Explanation:** separate_wider_delim (tidyr 1.3+) splits by a fixed delimiter into the named columns. Older `separate()` still works but is superseded.

</details>

### Exercise 1.4: Fill down missing values

**Scenario:** A pivoted table has merged cells; only the first row of each group has the value, others are NA. Carry the value down through the group.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(region = c("US", NA, NA, "EU", NA, NA),
             quarter = c("Q1","Q2","Q3","Q1","Q2","Q3"),
             sales = c(100, 120, 115, 80, 90, 95))

ex_1_4 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- df |>
  fill(region, .direction = "down")

ex_1_4
```

**Explanation:** tidyr::fill carries the last non-NA value forward. .direction = "down" (default), "up", "downup", "updown". Common when reading exported reports.

</details>

### Exercise 1.5: Complete missing combinations

**Scenario:** A table of (region, quarter, sales) is missing some region/quarter combos. Add the missing combos with sales = 0.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(region = c("US","US","EU","ASIA","ASIA"),
             quarter = c("Q1","Q2","Q1","Q1","Q2"),
             sales   = c(100, 120, 80, 60, 70))

ex_1_5 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- df |>
  complete(region, quarter, fill = list(sales = 0))

ex_1_5
```

**Explanation:** complete() generates all combinations of the listed columns and fills missing rows. fill = list(...) sets defaults for added rows. Crucial for correct group-level summaries.

</details>

### Exercise 1.6: Drop rows with NA in specific columns only

**Scenario:** Drop rows where Ozone is NA, but tolerate NAs in other columns.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_6 <- airquality |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- airquality |>
  drop_na(Ozone)

nrow(ex_1_6)
```

**Explanation:** drop_na with no args drops rows with any NA; with column names, only those columns are checked. Cleaner than `filter(!is.na(Ozone))` for multi-column drops.

</details>

### Exercise 1.7: Nest a column for grouped operations

**Scenario:** Group iris by Species, then nest the remaining columns into a list-column.

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_7 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- iris |>
  group_by(Species) |>
  nest()

ex_1_7
```

**Explanation:** nest() bundles each group's data into a tibble inside a list-column. Each row of the result is one group. Foundation for the "many models" pattern (one model per group).

</details>

### Exercise 1.8: Unnest a list-column

**Scenario:** A list-column has variable-length numeric vectors. Expand to long format.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(id = 1:3,
             values = list(c(10, 20, 30), c(40), c(50, 60)))

ex_1_8 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- df |>
  unnest_longer(values)

ex_1_8
```

**Explanation:** unnest_longer expands each list element into its own row. Counterpart unnest_wider expands a list of named elements into columns. unnest() does both in older tidyr.

</details>

## Section 2. Strings and dates (8 problems)

### Exercise 2.1: Detect a substring

**Scenario:** From a vector of email addresses, return only those containing "gmail.com".

**Difficulty:** Beginner

```r title="Your turn"
emails <- c("a@gmail.com","b@yahoo.com","c@gmail.com","d@hotmail.com")

ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- emails[str_detect(emails, "gmail.com")]
ex_2_1
```

**Explanation:** str_detect returns TRUE/FALSE per element. Subset with `[`. For tibbles, use `filter(str_detect(col, "..."))`.

</details>

### Exercise 2.2: Extract a phone area code

**Scenario:** From phone numbers like "(415) 555-1234", extract just the 3-digit area code.

**Difficulty:** Intermediate

```r title="Your turn"
phones <- c("(415) 555-1234","(212) 867-5309","(800) 100-2000")

ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- str_extract(phones, "\\d{3}")
ex_2_2
```

**Explanation:** str_extract returns the FIRST regex match. `\\d{3}` matches 3 digits. The opening "(" is the first non-digit so the match starts at the area code.

</details>

### Exercise 2.3: Pad a numeric ID

**Scenario:** Format integer IDs as 6-character zero-padded strings: 42 -> "000042".

**Difficulty:** Beginner

```r title="Your turn"
ids <- c(42, 1234, 7, 99999)

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- str_pad(ids, width = 6, side = "left", pad = "0")
ex_2_3
```

**Explanation:** str_pad pads to a target width. side specifies left, right, or both. sprintf("%06d", ids) is the base R alternative.

</details>

### Exercise 2.4: Replace by regex

**Scenario:** Phone numbers come with various separators: "(415) 555-1234", "415.555.1234", "415 555 1234". Normalize all to just digits.

**Difficulty:** Intermediate

```r title="Your turn"
phones <- c("(415) 555-1234","415.555.1234","415 555 1234","415-555-1234")

ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- str_replace_all(phones, "\\D", "")
ex_2_4
```

**Explanation:** str_replace_all with `\\D` (any non-digit) replaces every non-digit with the empty string. Robust to any separator pattern.

</details>

### Exercise 2.5: Parse dates from various formats

**Scenario:** Mixed input formats: "2024-01-15", "01/15/2024", "Jan 15, 2024". Parse all to Date.

**Difficulty:** Intermediate

```r title="Your turn"
dates <- c("2024-01-15","01/15/2024","Jan 15, 2024")

ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- parse_date_time(dates, orders = c("ymd","mdy","mdY"))
ex_2_5
```

**Explanation:** lubridate::parse_date_time tries each `orders` pattern in turn and uses the first that fits. The y/Y, m/M, d/D codes match year/month/day in flexible separators.

</details>

### Exercise 2.6: Extract month from a Date column

**Scenario:** From a vector of dates, get the month name as an English string.

**Difficulty:** Beginner

```r title="Your turn"
dates <- as.Date(c("2024-01-15","2024-04-30","2024-12-25"))

ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- month(dates, label = TRUE, abbr = FALSE)
ex_2_6
```

**Explanation:** lubridate::month with label = TRUE returns an ordered factor of month names. abbr = FALSE for full names. Counterparts: year(), day(), wday().

</details>

### Exercise 2.7: Compute age from birth date

**Scenario:** Given birth dates and a reference date, compute age in years.

**Difficulty:** Intermediate

```r title="Your turn"
births <- as.Date(c("1990-05-20","1985-11-12","2001-03-15"))
ref    <- as.Date("2024-08-01")

ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- as.integer(interval(births, ref) / years(1))
ex_2_7
```

**Explanation:** lubridate::interval creates a date range; dividing by years(1) gives fractional years. as.integer truncates to whole years (matches typical "age" semantics).

</details>

### Exercise 2.8: Round dates to month start

**Scenario:** A daily-events table needs to be aggregated monthly. Add a `month_start` column with each date snapped to the 1st of its month.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(date = as.Date(c("2024-01-15","2024-01-30","2024-02-05","2024-03-10")))

ex_2_8 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- df |>
  mutate(month_start = floor_date(date, "month"))

ex_2_8
```

**Explanation:** floor_date snaps a date to the start of the unit (week, month, quarter, year). ceiling_date goes the other way; round_date snaps to the nearest. Standard for time-series resampling.

</details>

## Section 3. Iteration with purrr (8 problems)

### Exercise 3.1: Apply a function to each element

**Scenario:** Compute the square of each element in 1:10 using map_dbl.

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- map_dbl(1:10, ~ .x^2)
ex_3_1
```

**Explanation:** map_dbl returns a numeric vector. The `~ .x^2` is purrr's lambda syntax for `function(.x) .x^2`. Type-stable variants: map_chr, map_int, map_lgl, map_dfr.

</details>

### Exercise 3.2: Read multiple CSVs

**Scenario:** You have a vector of CSV file paths. Read all into a single combined data frame, with a `source` column tagging each row's file.

**Difficulty:** Intermediate

```r title="Your turn"
# Simulate paths
files <- c("a.csv","b.csv","c.csv")

# Pretend we have a reader function
read_one <- function(f) tibble(file = f, x = sample(1:10, 3))

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- map_dfr(files, read_one)
ex_3_2
```

**Explanation:** map_dfr binds the per-file data frames together rowwise. Pass `.id = "source"` if you want a column tracking which input each row came from. For real files: `map_dfr(files, readr::read_csv)`.

</details>

### Exercise 3.3: Two-input map

**Scenario:** Given two vectors of equal length, compute element-wise: x^y.

**Difficulty:** Intermediate

```r title="Your turn"
xs <- c(2, 3, 4, 5)
ys <- c(1, 2, 3, 2)

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- map2_dbl(xs, ys, ~ .x^.y)
ex_3_3
```

**Explanation:** map2 walks two vectors in parallel. .x and .y refer to the two inputs. For 3+ vectors, use pmap with a list of vectors.

</details>

### Exercise 3.4: Filter a list with keep

**Scenario:** From a list of numeric vectors, keep only those whose mean exceeds 5.

**Difficulty:** Intermediate

```r title="Your turn"
lst <- list(a = c(1, 2, 3), b = c(6, 7, 8), c = c(4, 5), d = c(10, 12))

ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- keep(lst, ~ mean(.x) > 5)
ex_3_4
```

**Explanation:** keep retains list elements satisfying the predicate; discard is the inverse. Like Filter from base R but more readable.

</details>

### Exercise 3.5: Find first element matching a condition

**Scenario:** Find the first list element whose length is greater than 2.

**Difficulty:** Intermediate

```r title="Your turn"
lst <- list(c(1), c(2, 3), c(4, 5, 6, 7), c(8, 9))

ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- detect(lst, ~ length(.x) > 2)
ex_3_5
```

**Explanation:** detect returns the first match (or NULL); detect_index returns its position; some/every test if any/all match. Like Find in base R.

</details>

### Exercise 3.6: Reduce: cumulative join

**Scenario:** A list of three data frames, each with an id column. Inner-join them all into one. Use reduce.

**Difficulty:** Advanced

```r title="Your turn"
dfs <- list(
  tibble(id = 1:3, a = c(10, 20, 30)),
  tibble(id = 2:4, b = c(40, 50, 60)),
  tibble(id = 2:3, c = c(70, 80))
)

ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- reduce(dfs, inner_join, by = "id")
ex_3_6
```

**Explanation:** reduce applies a binary function repeatedly: f(f(f(a, b), c), d). For joining many data frames or accumulating any cumulative operation, this is the idiomatic pattern.

</details>

### Exercise 3.7: Safely wrapper

**Scenario:** Apply log() to a list of values, where some are negative. Use safely to capture errors instead of throwing.

**Difficulty:** Advanced

```r title="Your turn"
xs <- list(10, -5, 3, -1, 7)

ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_log <- safely(log)
ex_3_7   <- map(xs, safe_log)

# Each element is a list with $result and $error
ex_3_7
```

**Explanation:** safely wraps a function so it never throws. map returns a list of `list(result, error)` pairs. log of negative is NaN with a warning, not an error, so for true demo try `safely(stop)`. Use possibly() to get a default value instead.

</details>

### Exercise 3.8: pmap with a tibble

**Scenario:** A tibble has columns x, y, z. Compute x*y + z per row using pmap.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(x = 1:4, y = 5:8, z = 9:12)

ex_3_8 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_8 <- df |>
  mutate(result = pmap_dbl(list(x, y, z), ~ ..1 * ..2 + ..3))

ex_3_8
```

**Explanation:** pmap takes a list of equal-length inputs; ..1, ..2, ..3 refer to them positionally. For 2 args use map2; pmap scales to N. For row-wise computation in a tibble, mutate(across(...)) or rowwise() are alternatives.

</details>

## Section 4. Group-and-iterate (8 problems)

### Exercise 4.1: Run a model per group

**Scenario:** Fit a linear model of `mpg ~ wt` separately for each cyl group on mtcars. Return a tibble with cyl and model.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(model = map(data, ~ lm(mpg ~ wt, data = .x)))

ex_4_1
```

**Explanation:** Nest each group's data into a list-column, then map a model function over it. Each row holds (cyl, data, model). Pattern of "many models" workflow.

</details>

### Exercise 4.2: Extract coefficients from per-group models

**Scenario:** Continuing from 4.1, extract the slope of wt for each cyl group as a tidy tibble.

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(model = map(data, ~ lm(mpg ~ wt, data = .x))) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(model = map(data, ~ lm(mpg ~ wt, data = .x)),
         tidy_results = map(model, broom::tidy)) |>
  unnest(tidy_results) |>
  filter(term == "wt") |>
  select(cyl, estimate, std.error, p.value)

ex_4_2
```

**Explanation:** broom::tidy turns a model into a tidy tibble of coefficients. Mapping it over the model column then unnesting flattens. Filter to the term of interest.

</details>

### Exercise 4.3: Per-group summary as a list-column

**Scenario:** For each Species in iris, compute summary() of Sepal.Length and store the result as a list-column.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- iris |>
  group_by(Species) |>
  summarise(summary_stats = list(summary(Sepal.Length)))

ex_4_3
```

**Explanation:** Wrapping in list() is the trick to put a non-scalar into a summarise cell. Result is a tibble where each summary_stats entry is the named numeric vector returned by summary().

</details>

### Exercise 4.4: Compute multiple stats with across

**Scenario:** Compute mean and sd for every numeric column of iris, per Species.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_4 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric),
                   list(mean = mean, sd = sd),
                   .names = "{.col}_{.fn}"))

ex_4_4
```

**Explanation:** across() with a named list of functions runs each function on each column. .names template controls the resulting column names. {.col} is the column name; {.fn} is the function name.

</details>

### Exercise 4.5: First and last row per group

**Scenario:** Per stock, return both the first and last price entries (chronologically) in one tibble.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(
  stock = rep(c("A","B"), each = 4),
  date = as.Date(rep(c("2024-01-01","2024-02-01","2024-03-01","2024-04-01"), 2)),
  price = c(100,110,120,130, 50,52,55,60)
)

ex_4_5 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- df |>
  arrange(stock, date) |>
  group_by(stock) |>
  slice(c(1, n())) |>
  ungroup()

ex_4_5
```

**Explanation:** slice with c(1, n()) picks position 1 and the last position per group. Tag rows with mutate(role = c("first","last")) if you need to distinguish them.

</details>

### Exercise 4.6: Apply a custom function per group

**Scenario:** For each Species, compute the correlation between Sepal.Length and Petal.Length.

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_6 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_6 <- iris |>
  group_by(Species) |>
  summarise(cor_sl_pl = cor(Sepal.Length, Petal.Length))

ex_4_6
```

**Explanation:** summarise can take any function returning a scalar. For multi-value returns (like cor.test), use reframe or wrap in list().

</details>

### Exercise 4.7: Group-wise resampling

**Scenario:** From iris, draw 5 random rows per Species.

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(1)
ex_4_7 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_4_7 <- iris |>
  slice_sample(n = 5, by = Species)

nrow(ex_4_7)
```

**Explanation:** slice_sample with `by = Species` samples per group. Use prop = 0.1 for proportional sampling. set.seed for reproducibility.

</details>

### Exercise 4.8: Efficient group iteration with group_modify

**Scenario:** Per Species, fit a quick polynomial regression and return the residuals.

**Difficulty:** Advanced

```r title="Your turn"
ex_4_8 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_8 <- iris |>
  group_by(Species) |>
  group_modify(~ {
    fit <- lm(Sepal.Length ~ poly(Petal.Length, 2), data = .x)
    .x |> mutate(residual = residuals(fit))
  })

head(ex_4_8)
```

**Explanation:** group_modify applies a function to each group's data frame and returns a combined tibble. .x is the group's data frame. Cleaner than nest+map+unnest for this pattern.

</details>

## Section 5. End-to-end pipelines (10 problems)

### Exercise 5.1: Filter, group, summarise

**Scenario:** From diamonds: keep only ideal-cut, group by clarity, compute mean price and count, sort by mean price descending.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- diamonds |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- diamonds |>
  filter(cut == "Ideal") |>
  group_by(clarity) |>
  summarise(n = n(), mean_price = mean(price)) |>
  arrange(desc(mean_price))

ex_5_1
```

**Explanation:** Standard 4-step pipeline: filter -> group -> summarise -> arrange. Read top to bottom; pipe chains the result of each into the next.

</details>

### Exercise 5.2: Build a customer activity summary

**Scenario:** From a transactions table, build per-customer: first purchase, last purchase, total spend, days active.

**Difficulty:** Intermediate

```r title="Your turn"
txns <- tibble(customer = rep(c("a","b","c"), c(3, 2, 4)),
               date = as.Date(c("2024-01-05","2024-02-15","2024-03-10",
                                "2024-01-20","2024-04-01",
                                "2024-01-10","2024-02-05","2024-03-01","2024-05-15")),
               amount = c(50, 80, 30, 100, 90, 65, 75, 40, 120))

ex_5_2 <- txns |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- txns |>
  group_by(customer) |>
  summarise(first_date = min(date),
            last_date  = max(date),
            total      = sum(amount),
            days_active = as.integer(max(date) - min(date)),
            .groups    = "drop")

ex_5_2
```

**Explanation:** Multiple stats in one summarise. .groups = "drop" prevents the result from staying grouped (the next operation might surprise you otherwise).

</details>

### Exercise 5.3: Clean text and aggregate

**Scenario:** A column has product names with inconsistent casing and trailing spaces. Standardize to lowercase trimmed, then count per name.

**Difficulty:** Intermediate

```r title="Your turn"
df <- tibble(product = c("Widget","widget ","WIDGET","Gadget","gadget","GADGET ","sprocket"))

ex_5_3 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- df |>
  mutate(product = str_to_lower(str_trim(product))) |>
  count(product, sort = TRUE)

ex_5_3
```

**Explanation:** Always normalize before aggregating; otherwise duplicates inflate the cardinality. `count(..., sort = TRUE)` is shorthand for count + arrange(desc(n)).

</details>

### Exercise 5.4: Extract date parts and aggregate monthly

**Scenario:** From economics dataset, compute mean unemployment per year.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- economics |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- economics |>
  mutate(year = year(date)) |>
  group_by(year) |>
  summarise(mean_unemploy = mean(unemploy))

ex_5_4
```

**Explanation:** lubridate::year extracts the year integer; group + summarise then aggregates. For monthly: floor_date(date, "month").

</details>

### Exercise 5.5: Pivot then summarise

**Scenario:** From quarterly sales (region x Q1-Q4), compute total annual sales per region.

**Difficulty:** Intermediate

```r title="Your turn"
wide <- tibble(region = c("US","EU","ASIA"),
               Q1 = c(100,80,60), Q2 = c(120,90,70),
               Q3 = c(115,95,75), Q4 = c(130,100,90))

ex_5_5 <- wide |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- wide |>
  pivot_longer(Q1:Q4, names_to = "quarter", values_to = "sales") |>
  group_by(region) |>
  summarise(annual = sum(sales))

ex_5_5
```

**Explanation:** Reshape to long, then aggregate. Could also compute as `mutate(annual = Q1+Q2+Q3+Q4)` directly; the long format is more flexible if quarters change.

</details>

### Exercise 5.6: Filter + mutate + arrange + slice

**Scenario:** From mtcars, find the 5 lightest cars among those with mpg > 20. Return name and weight.

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_6 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- mtcars |>
  tibble::rownames_to_column("car") |>
  filter(mpg > 20) |>
  arrange(wt) |>
  select(car, wt) |>
  slice_head(n = 5)

ex_5_6
```

**Explanation:** Five-step pipeline. slice_head is the dplyr verb for picking the top N rows; slice_tail for bottom N.

</details>

### Exercise 5.7: Join then aggregate

**Scenario:** Two tables: customers and orders. Compute total spend per customer, including customers with 0 orders.

**Difficulty:** Intermediate

```r title="Your turn"
customers <- tibble(id = 1:5, name = c("Alice","Bob","Carol","Dan","Eve"))
orders    <- tibble(customer_id = c(1,1,2,3,3,3), amount = c(50,80,30,65,120,90))

ex_5_7 <- customers |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- customers |>
  left_join(orders, by = c("id" = "customer_id")) |>
  group_by(id, name) |>
  summarise(total = sum(amount, na.rm = TRUE), .groups = "drop")

ex_5_7
```

**Explanation:** left_join keeps all customers; sum with na.rm gives 0 for those without orders. Including the name column in group_by prevents losing it after summarise.

</details>

### Exercise 5.8: Group-wise rate calculation

**Scenario:** A poll table has total respondents and yes responses per region. Compute the yes rate, sorted descending.

**Difficulty:** Intermediate

```r title="Your turn"
poll <- tibble(region = c("N","S","E","W"),
               total  = c(1000, 800, 1200, 600),
               yes    = c(540, 320, 720, 480))

ex_5_8 <- poll |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_8 <- poll |>
  mutate(yes_rate = yes / total) |>
  arrange(desc(yes_rate))

ex_5_8
```

**Explanation:** For grouped summaries that ALREADY have the components, just mutate + arrange. No group_by needed.

</details>

### Exercise 5.9: Detect and fix data quality issues

**Scenario:** A messy column has email addresses with various trailing whitespace, mixed case, and some entries that aren't valid emails. Clean to lowercase trimmed, then keep only entries containing "@".

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(raw = c("Alice@X.COM","  bob@y.com","CAROL@Z.com  ","invalid","dan@x.com "))

ex_5_9 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_9 <- df |>
  mutate(email = str_to_lower(str_trim(raw))) |>
  filter(str_detect(email, "@"))

ex_5_9
```

**Explanation:** Two-step cleanup then filter. str_trim removes leading/trailing whitespace; str_to_lower normalizes case. str_detect with "@" is a minimum sanity check.

</details>

### Exercise 5.10: Reproducible analysis chain

**Scenario:** Build a per-cylinder summary of mtcars: count, mean mpg, top car name. Save as a tibble suitable for a report.

**Difficulty:** Advanced

```r title="Your turn"
ex_5_10 <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_10 <- mtcars |>
  tibble::rownames_to_column("car") |>
  group_by(cyl) |>
  summarise(n            = n(),
            mean_mpg     = round(mean(mpg), 1),
            top_car      = car[which.max(mpg)],
            top_car_mpg  = max(mpg),
            .groups      = "drop") |>
  arrange(cyl)

ex_5_10
```

**Explanation:** Combining aggregations (n, mean) with row-extraction (which.max gives the position of max within the group; index back into car). Round for presentation. .groups = "drop" releases grouping.

</details>

## Section 6. Advanced multi-package (8 problems)

### Exercise 6.1: Many models per group

**Scenario:** Fit a linear regression of mpg ~ wt per cyl group, extract R-squared, slope, p-value into a tidy table.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_1 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(model    = map(data, ~ lm(mpg ~ wt, data = .x)),
         glance   = map(model, broom::glance),
         tidy     = map(model, broom::tidy)) |>
  unnest(glance) |>
  select(cyl, r.squared, p.value, model)

ex_6_1
```

**Explanation:** nest -> map model -> map broom::glance gets one-row-per-model summaries. unnest flattens. Foundation of comparative modeling across groups.

</details>

### Exercise 6.2: Time-window aggregation

**Scenario:** From daily events, compute the rolling 7-day count per user.

**Difficulty:** Advanced

```r title="Your turn"
events <- tibble(
  user = rep(c("a","b"), each = 14),
  date = rep(seq.Date(as.Date("2024-01-01"), by = "day", length.out = 14), 2),
  count = sample(1:5, 28, replace = TRUE)
)

ex_6_2 <- events |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- events |>
  arrange(user, date) |>
  group_by(user) |>
  mutate(roll7 = slider::slide_dbl(count, sum, .before = 6, .complete = TRUE)) |>
  ungroup()

ex_6_2
```

**Explanation:** slider::slide_dbl walks a vector with a window. .before = 6 plus current = 7-day window. .complete = TRUE returns NA for windows that aren't fully populated.

</details>

### Exercise 6.3: Detect changes between snapshots

**Scenario:** Two daily snapshots of a customer-status table. Find customers whose status changed.

**Difficulty:** Advanced

```r title="Your turn"
prev <- tibble(id = 1:5, status = c("active","active","trial","churned","trial"))
curr <- tibble(id = 1:5, status = c("active","trial","trial","churned","active"))

ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- prev |>
  inner_join(curr, by = "id", suffix = c("_prev","_curr")) |>
  filter(status_prev != status_curr)

ex_6_3
```

**Explanation:** inner_join with suffixes creates side-by-side columns; filter keeps changed rows. Standard "diff snapshots" pattern for daily reconciliations.

</details>

### Exercise 6.4: Extract structured data from text

**Scenario:** A column has free text like "Order #1234 placed by user_42 for $99.99". Extract order_id, user_id, and amount into separate columns.

**Difficulty:** Advanced

```r title="Your turn"
df <- tibble(raw = c("Order #1234 placed by user_42 for $99.99",
                     "Order #5678 placed by user_7 for $245.00",
                     "Order #999 placed by user_100 for $12.50"))

ex_6_4 <- df |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- df |>
  mutate(order_id = as.integer(str_extract(raw, "(?<=#)\\d+")),
         user_id  = as.integer(str_extract(raw, "(?<=user_)\\d+")),
         amount   = as.numeric(str_extract(raw, "(?<=\\$)[0-9.]+")))

ex_6_4
```

**Explanation:** Lookbehind `(?<=...)` matches a position preceded by but not consuming the pattern. str_extract grabs the first match. as.integer/as.numeric coerce. Useful for log parsing.

</details>

### Exercise 6.5: Compute per-group quantiles in long format

**Scenario:** Per cyl, compute the 25th/50th/75th percentile of mpg in long format (one row per quantile per group).

**Difficulty:** Advanced

```r title="Your turn"
ex_6_5 <- mtcars |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_5 <- mtcars |>
  group_by(cyl) |>
  reframe(quantile = c("p25","p50","p75"),
          value    = quantile(mpg, c(0.25, 0.5, 0.75)))

ex_6_5
```

**Explanation:** reframe (dplyr 1.1+) allows multiple rows per group. summarise enforces 1 row per group. Use for quantile tables, multi-statistic outputs.

</details>

### Exercise 6.6: Run an analysis safely on multiple datasets

**Scenario:** A list of tibbles. For each, fit lm(y ~ x). Some may have insufficient rows. Use safely + map.

**Difficulty:** Advanced

```r title="Your turn"
data_list <- list(
  ok      = tibble(x = 1:10, y = (1:10) * 2 + rnorm(10)),
  too_few = tibble(x = 1:2,  y = c(2, 4)),
  empty   = tibble(x = numeric(0), y = numeric(0))
)

ex_6_6 <- # your code here
ex_6_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
safe_lm <- safely(~ lm(y ~ x, data = .x))
ex_6_6 <- map(data_list, safe_lm)

# Inspect: each entry has $result and $error
map_lgl(ex_6_6, ~ is.null(.x$error))
```

**Explanation:** safely wraps the model fit so failures become $error entries instead of throwing. Inspect with map_lgl to filter or report. Standard pattern for batch processing.

</details>

### Exercise 6.7: Build a typed summary across many columns

**Scenario:** For every numeric column of iris, compute mean and sd, with results in a tidy two-column-per-stat layout.

**Difficulty:** Advanced

```r title="Your turn"
ex_6_7 <- iris |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_7 <- iris |>
  summarise(across(where(is.numeric),
                   list(mean = mean, sd = sd),
                   .names = "{.col}_{.fn}")) |>
  pivot_longer(everything(),
               names_to = c("variable","stat"),
               names_sep = "_(?=mean$|sd$)")

ex_6_7
```

**Explanation:** Compute multi-stat with across, then pivot_longer with a regex names_sep to split column names into variable and stat. Foundation for tidy multi-statistic tables.

</details>

### Exercise 6.8: End-to-end ETL slice

**Scenario:** Read messy raw data, clean strings, parse dates, join with a lookup, aggregate, and save a clean tibble. Build the whole pipeline.

**Difficulty:** Advanced

```r title="Your turn"
raw <- tibble(
  customer = c(" Alice ", "BOB", "carol", "alice"),
  date     = c("01/15/2024", "02/20/2024", "03/05/2024", "01/30/2024"),
  amount   = c("$50.00", "$80.00", "$30.00", "$120.00")
)
lookup <- tibble(customer_norm = c("alice","bob","carol"),
                 segment       = c("VIP","Reg","VIP"))

ex_6_8 <- raw |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_8 <- raw |>
  mutate(customer_norm = str_to_lower(str_trim(customer)),
         date          = mdy(date),
         amount        = as.numeric(str_remove(amount, "\\$"))) |>
  left_join(lookup, by = "customer_norm") |>
  group_by(customer_norm, segment) |>
  summarise(total = sum(amount), n = n(), .groups = "drop") |>
  arrange(desc(total))

ex_6_8
```

**Explanation:** Five tidyverse packages in one pipeline: stringr (case/trim/remove), lubridate (mdy), dplyr (mutate/join/summarise/arrange), tibble. This shape recurs in every real ETL job.

</details>

## What to do next

Master the multi-package idiom and the rest of R falls into place. Natural follow-ups:

- **Single-package hubs**: dplyr-Exercises, ggplot2-Exercises (shipped) for deeper drilling on each.
- **Topic hubs (coming)**: Joins, Window functions, Pivot, Regex, Date-Time.
- **Domain practice (coming)**: Data-Wrangling-Exercises, Data-Cleaning-Exercises, EDA-Exercises target take-home interview shapes.
