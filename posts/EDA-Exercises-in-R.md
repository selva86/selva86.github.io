---
title: "EDA Exercises in R: 50 Real-World Practice Problems"
slug: "EDA-Exercises-in-R"
description: "50 hands-on EDA exercises in R covering data overview, univariate plots, missingness, outliers, correlations, and end-to-end profiling workflows."
keywords: "EDA in R, exploratory data analysis R, R EDA exercises, skimr, naniar, DataExplorer, dplyr exploration"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "EDA Exercises"
sidebar_order: 109
fr_parent: "Exploratory-Data-Analysis-in-R.html"
auto_link_terms: "exploratory data analysis|EDA in R|data exploration|skimr|naniar|DataExplorer"
auto_link_case_sensitive: false
target_keyword: "EDA in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# EDA Exercises in R: 50 Real-World Practice Problems

<p class="lead">Fifty practice problems covering the full exploratory data analysis workflow in R: structural inspection, univariate distributions, categorical tallies, missingness and outliers, bivariate relationships, transformations, and end-to-end profiling. Solutions are hidden until you click; try each one yourself first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(ggplot2)
library(tidyr)
library(tibble)
library(forcats)
library(skimr)
library(GGally)
library(naniar)
library(DataExplorer)
library(moments)
```

## Section 1. Get to know your data (8 problems)

### Exercise 1.1: Inspect the structure of mtcars with str

**Task:** Before doing anything else, you want a one-screen summary of a new dataset: how many rows and columns, what types each column holds, and a peek at the first few values. Use `str()` on the built-in `mtcars` dataset and save the captured output to `ex_1_1` using `capture.output()`.

**Expected result:**

```
#> 'data.frame':	32 obs. of  11 variables:
#>  $ mpg : num  21 21 22.8 21.4 18.7 18.1 14.3 24.4 ...
#>  $ cyl : num  6 6 4 6 8 6 8 4 ...
#>  $ disp: num  160 160 108 258 360 ...
#>  $ hp  : num  110 110 93 110 175 105 245 62 ...
#>  ...
```

**Difficulty:** Beginner

[HINTS]
Think about which single call answers "how big, what types, what do the values look like" for an unfamiliar data frame in one pass.
Wrap `str(mtcars)` in `capture.output()` so the printed report is stored as a character vector instead of returning NULL.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- capture.output(str(mtcars))
cat(ex_1_1, sep = "\n")
#> 'data.frame':	32 obs. of  11 variables:
#>  $ mpg : num  21 21 22.8 21.4 18.7 18.1 14.3 24.4 ...
```

**Explanation:** `str()` is almost always the first call against an unknown data frame because it answers "how big, what types, what do values look like" in one pass. Wrapping it in `capture.output()` lets you store the report as a character vector for further inspection or logging. Alternative: `tibble::glimpse()` produces a tidier, column-oriented view (Exercise 1.4). Common mistake: assigning `str(x)` directly returns `NULL` because `str` prints as a side effect.

</details>

### Exercise 1.2: Peek at the first and last rows of diamonds

**Task:** Open any new dataset by checking both ends: the head reveals the column layout and typical values, the tail catches any oddities like footer rows or sentinel values. Use `head()` and `tail()` on `diamonds` to grab the first 5 and last 5 rows, bind them into one frame, and save to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 10 x 10
#>    carat cut       color clarity depth table price     x     y     z
#>    <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#>  1  0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43
#>  2  0.21 Premium   E     SI1      59.8    61   326  3.89  3.84  2.31
#>  ...
#> 10  0.75 Ideal     D     SI2      62.2    55  2757  5.83  5.87  3.64
```

**Difficulty:** Beginner

[HINTS]
You want to inspect both ends of the table at once so trailing oddities like footer rows do not slip past.
Take `head(diamonds, 5)` and `tail(diamonds, 5)`, then combine the two frames with `bind_rows()`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- bind_rows(head(diamonds, 5), tail(diamonds, 5))
ex_1_2
#> # A tibble: 10 x 10
#>    carat cut       color clarity depth table price     x     y     z
#>    <dbl> <ord>     <ord> <ord>   <dbl> <dbl> <int> <dbl> <dbl> <dbl>
#>  1  0.23 Ideal     E     SI2      61.5    55   326  3.95  3.98  2.43
#>  ...
```

**Explanation:** Looking only at `head()` misses the symptom of a file that has trailing summary rows, footer text, or values that drift over time. Combining head and tail in one tibble keeps both eyes on the same printout. Common mistake: forgetting that `mtcars` has row names, so `head()` returns rows but the row-name column is not a real variable. Use `tibble::rownames_to_column()` to convert.

</details>

### Exercise 1.3: Summarise every column of mtcars with summary

**Task:** Get min, quartiles, mean, max for every numeric column and counts for any factors using `summary()` on `mtcars`. The output is a quick health check before you commit to a plot or model. Capture it with `capture.output()` and save to `ex_1_3`.

**Expected result:**

```
#>       mpg             cyl             disp             hp
#>  Min.   :10.40   Min.   :4.000   Min.   : 71.1   Min.   : 52.0
#>  1st Qu.:15.43   1st Qu.:4.000   1st Qu.:120.8   1st Qu.: 96.5
#>  Median :19.20   Median :6.000   Median :196.3   Median :123.0
#>  Mean   :20.09   Mean   :6.188   Mean   :230.7   Mean   :146.7
#>  3rd Qu.:22.80   3rd Qu.:8.000   3rd Qu.:326.0   3rd Qu.:180.0
#>  Max.   :33.90   Max.   :8.000   Max.   :472.0   Max.   :335.0
```

**Difficulty:** Beginner

[HINTS]
One call gives a per-column health check covering ranges, centre, and spread before you commit to a plot or model.
Run `summary(mtcars)` inside `capture.output()` to keep the multi-line report as a character vector.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- capture.output(summary(mtcars))
cat(ex_1_3, sep = "\n")
#>       mpg             cyl             disp             hp
#>  Min.   :10.40   Min.   :4.000   Min.   : 71.1   Min.   : 52.0
#>  ...
```

**Explanation:** `summary()` adapts to the column type: numeric columns get the five-number summary plus mean; factors get counts of each level; logicals get TRUE/FALSE counts. It's a one-stop "is this column sane" check. Common mistake: with character columns it gives only length and class, not value counts. Convert chars to factors first if you need category tallies, or use `skimr::skim()` (Exercise 7.1) for a richer report.

</details>

### Exercise 1.4: Scan a tibble with dplyr glimpse

**Task:** When a data frame has many columns, `str()` becomes hard to read because every column wraps. `glimpse()` from dplyr prints one row per column with the type and a snippet of values. Run `glimpse()` on `diamonds` and capture the output to `ex_1_4`.

**Expected result:**

```
#> Rows: 53,940
#> Columns: 10
#> $ carat   <dbl> 0.23, 0.21, 0.23, 0.29, 0.31, 0.24, 0.24, 0.26, ...
#> $ cut     <ord> Ideal, Premium, Good, Premium, Good, Very Good, ...
#> $ color   <ord> E, E, E, I, J, J, I, H, E, H, J, J, F, J, E, E, ...
#> $ clarity <ord> SI2, SI1, VS1, VS2, SI2, VVS2, VVS1, SI1, VS2, V...
#> ...
```

**Difficulty:** Beginner

[HINTS]
With many columns you want a view that prints one row per column rather than wrapping each one across the screen.
Pass `glimpse(diamonds)` to `capture.output()` to store the column-oriented printout.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- capture.output(glimpse(diamonds))
cat(ex_1_4, sep = "\n")
#> Rows: 53,940
#> Columns: 10
#> $ carat   <dbl> 0.23, 0.21, 0.23, 0.29, ...
```

**Explanation:** `glimpse()` rotates `str()` so each column becomes a row. With wide tables of 30+ columns it is much easier to scan than the default print. The type tag (`<dbl>`, `<ord>`, `<chr>`) tells you whether the column is numeric, ordered factor, character, etc. For a more visual scan with histograms and missingness, see `skimr::skim()` in Exercise 7.1.

</details>

### Exercise 1.5: Count column types in a data frame

**Task:** You inherit a 60-column dataset and want to know at a glance how many columns are numeric, character, logical, factor, or date. Use `sapply()` to get the class of every column of `diamonds`, then `table()` the result. Save the resulting type-count table to `ex_1_5`.

**Expected result:**

```
#>     numeric ordered    factor integer
#>           6       3         0       1
```

**Difficulty:** Intermediate

[HINTS]
You want a tally of how many columns share each storage type, not the type of each individual column.
Apply a class-extracting function over every column with `sapply()`, keep `class(x)[1]`, then feed the result to `table()`.

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- table(sapply(diamonds, function(x) class(x)[1]))
ex_1_5
#>
#>  integer numeric ordered
#>        1       6       3
```

**Explanation:** `class(x)[1]` keeps only the primary class for ordered factors (which return `c("ordered","factor")`). This is a robust one-liner for understanding the column-type mix before you decide which exploration tools fit best. Common mistake: skipping `[1]` returns a list and `table()` collapses ordered factors into multiple buckets. For wider audits, `purrr::map_chr(diamonds, ~ class(.x)[1])` is the tidyverse equivalent.

</details>

### Exercise 1.6: Report rows, columns, and memory footprint

**Task:** A code reviewer wants a one-line dataset summary for a PR description: rows, columns, and approximate memory size. Build a named character vector with these three facts for `diamonds` using `nrow()`, `ncol()`, and `format(object.size(...), units = "MB")` and save it to `ex_1_6`.

**Expected result:**

```
#>       rows    columns        size
#>    "53940"       "10"    "3.5 Mb"
```

**Difficulty:** Intermediate

[HINTS]
The goal is a tidy three-fact label, all of one type, that you can paste straight into a PR description.
Combine `nrow()`, `ncol()`, and `format(object.size(diamonds), units = "Mb")` into a named vector, coercing each value to character.

```r title="Your turn"
ex_1_6 <- # your code here
ex_1_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_6 <- c(
  rows    = as.character(nrow(diamonds)),
  columns = as.character(ncol(diamonds)),
  size    = format(object.size(diamonds), units = "Mb")
)
ex_1_6
#>       rows    columns        size
#>    "53940"       "10"    "3.5 Mb"
```

**Explanation:** `object.size()` gives an estimate of the in-memory size of the R object, useful when deciding whether to subsample before plotting. Coercing everything to character with names yields a tidy printout that you can paste into a Slack message or PR. For a richer profile, `pryr::object_size()` handles shared references (e.g., copy-on-modify) more accurately than the base function.

</details>

### Exercise 1.7: Separate numeric and categorical columns

**Task:** A data engineer pipelining a dataset to a feature store needs the column names split by type. Using dplyr `select()` with `where(is.numeric)` and `where(is.factor)`, build a named list with two elements (`numeric`, `categorical`) holding the column names for `diamonds` and save to `ex_1_7`.

**Expected result:**

```
#> $numeric
#> [1] "carat" "depth" "table" "price" "x"     "y"     "z"
#>
#> $categorical
#> [1] "cut"     "color"   "clarity"
```

**Difficulty:** Intermediate

[HINTS]
You need the column names split into two buckets according to whether each column is numeric or categorical.
Use `select()` with `where(is.numeric)` and `where(is.factor)`, take `names()` of each, and wrap them in a named `list()`.

```r title="Your turn"
ex_1_7 <- # your code here
ex_1_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_7 <- list(
  numeric     = names(select(diamonds, where(is.numeric))),
  categorical = names(select(diamonds, where(is.factor)))
)
ex_1_7
#> $numeric
#> [1] "carat" "depth" "table" "price" "x"     "y"     "z"
#> $categorical
#> [1] "cut"     "color"   "clarity"
```

**Explanation:** Tidy-select helpers `where(is.numeric)`, `where(is.factor)`, `where(is.character)` are the modern idiom. They avoid the trap of `sapply(df, is.numeric)` returning a logical vector you then need to subscript. Common mistake: `diamonds$cut` is an ordered factor, which is still `is.factor()` TRUE; ordered status doesn't matter for the type split unless you handle order semantics in modelling.

</details>

### Exercise 1.8: Build a one-row data dictionary

**Task:** A reporting analyst wants a tibble describing every column of `mtcars`: name, class, number of unique values, count of missing values, and one example. Use `purrr::map_dfr()` or a `tibble()` constructor with `vapply()` to build this dictionary and save to `ex_1_8`.

**Expected result:**

```
#> # A tibble: 11 x 5
#>    column class   n_unique n_missing example
#>    <chr>  <chr>      <int>     <int> <chr>
#>  1 mpg    numeric       25         0 21
#>  2 cyl    numeric        3         0 6
#>  3 disp   numeric       27         0 160
#>  ...
#> 11 carb   numeric        6         0 4
```

**Difficulty:** Advanced

[HINTS]
Build a one-row-per-column summary describing each column's name, type, distinctness, missingness, and a sample value.
Construct a `tibble()` whose columns come from `vapply()` calls over the data frame computing `class()`, `length(unique())`, `sum(is.na())`, and the first value.

```r title="Your turn"
ex_1_8 <- # your code here
ex_1_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_8 <- tibble(
  column    = names(mtcars),
  class     = vapply(mtcars, function(x) class(x)[1], character(1)),
  n_unique  = vapply(mtcars, function(x) length(unique(x)), integer(1)),
  n_missing = vapply(mtcars, function(x) sum(is.na(x)), integer(1)),
  example   = vapply(mtcars, function(x) as.character(x[1]), character(1))
)
ex_1_8
#> # A tibble: 11 x 5
#>    column class   n_unique n_missing example
#>    <chr>  <chr>      <int>     <int> <chr>
#>  1 mpg    numeric       25         0 21
#>  ...
```

**Explanation:** `vapply()` is preferred over `sapply()` here because it enforces the return type per column, so the resulting tibble is type-stable. A data dictionary like this is invaluable when handing off a dataset: reviewers see uniqueness (constant columns? hashy-looking IDs?) and missingness in seconds. For wider profiling, `DataExplorer::introduce()` returns a similar one-row summary.

</details>

## Section 2. Univariate numeric exploration (8 problems)

### Exercise 2.1: Histogram of diamond prices

**Task:** A jeweller preparing a quarterly sale wants to see how prices are distributed across the `diamonds` inventory. Build a ggplot2 histogram of `price` with 40 bins and a clean theme, then save the plot object to `ex_2_1`.

**Expected result:**

```
# Right-skewed histogram of diamond prices
# x: price (0 to ~19000), y: count, 40 bins, peak near $1000
```

**Difficulty:** Beginner

[HINTS]
You want to see how a continuous variable spreads across its range, controlling the resolution of the bins yourself.
Map `price` in `aes()` and add `geom_histogram(bins = 40)`, then layer `labs()` and `theme_minimal()`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(diamonds, aes(price)) +
  geom_histogram(bins = 40, fill = "steelblue", colour = "white") +
  labs(title = "Distribution of diamond prices", x = "Price ($)", y = "Count") +
  theme_minimal()
ex_2_1
# Right-skewed histogram with peak near $1000 and a long tail to $19000
```

**Explanation:** Histograms are the workhorse univariate plot for continuous variables. The bin count drives the impression: too few bins hide structure, too many create noise. 30 to 50 bins is a reasonable default for a five-figure dataset. Common mistake: using the default `geom_histogram()` (30 bins) silently leaves a warning visible to readers. Always set `bins` or `binwidth` explicitly so reviewers see your choice.

</details>

### Exercise 2.2: Overlay a density curve on the histogram

**Task:** Building on Exercise 2.1, the jeweller wants to see the smooth shape of the price distribution rather than the bin steps. Add a density curve to the histogram using `aes(y = after_stat(density))` and `geom_density()`. Save to `ex_2_2`.

**Expected result:**

```
# Histogram with density curve overlay
# y axis rescaled to density (0-1 range); curve peaks near $1000 with right skew
```

**Difficulty:** Intermediate

[HINTS]
You want the smooth shape of the distribution drawn on top of the binned bars, with both sharing the same vertical scale.
Rescale the bars with `aes(y = after_stat(density))` and layer a `geom_density()` on the same plot.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(diamonds, aes(price)) +
  geom_histogram(aes(y = after_stat(density)),
                 bins = 40, fill = "steelblue", colour = "white", alpha = 0.6) +
  geom_density(colour = "firebrick", linewidth = 1) +
  labs(title = "Diamond prices: histogram with density overlay",
       x = "Price ($)", y = "Density") +
  theme_minimal()
ex_2_2
# Histogram bars rescaled to density, with a red density curve on top
```

**Explanation:** Densities sum to area 1, while counts depend on bin width. To overlay them, rescale the histogram with `after_stat(density)` (formerly `..density..`). Common mistake: forgetting the rescale yields a flat density line against the much larger count bars. The density bandwidth is the smoothing parameter; if the curve looks too wiggly, set `geom_density(adjust = 1.5)` to smooth more.

</details>

### Exercise 2.3: Quartiles and IQR of ozone readings

**Task:** A climatologist exploring the `airquality` dataset wants the quartiles and interquartile range of the `Ozone` column to compare against a regulatory threshold. Compute the 25th, 50th, 75th percentiles plus IQR using `quantile()` and `IQR()`, dropping NAs, and save a named numeric vector to `ex_2_3`.

**Expected result:**

```
#>   Q1 (25%)   Q2 (50%)   Q3 (75%)      IQR
#>      18.00      31.50      63.25      45.25
```

**Difficulty:** Beginner

[HINTS]
You need the three quartiles and the spread between the outer two, while ignoring the missing readings.
Call `quantile()` at 0.25, 0.50, 0.75 and `IQR()`, all with `na.rm = TRUE`, and assemble a named numeric vector.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- c(
  "Q1 (25%)" = quantile(airquality$Ozone, 0.25, na.rm = TRUE),
  "Q2 (50%)" = quantile(airquality$Ozone, 0.50, na.rm = TRUE),
  "Q3 (75%)" = quantile(airquality$Ozone, 0.75, na.rm = TRUE),
  "IQR"      = IQR(airquality$Ozone, na.rm = TRUE)
)
ex_2_3
#> Q1 (25%).25% Q2 (50%).50% Q3 (75%).75%          IQR
#>        18.00        31.50        63.25        45.25
```

**Explanation:** The IQR equals Q3 minus Q1 and is the basis for Tukey's outlier rule (`1.5 * IQR` beyond the quartiles). Always pass `na.rm = TRUE` when working with `airquality` since `Ozone` has 37 missing values. The default `quantile()` uses type 7, which is fine for EDA; type 8 is preferred when you need to compare with continuous distributions.

</details>

### Exercise 2.4: Detect skew with mean vs median

**Task:** A quick way to flag a skewed numeric column is to compare its mean to its median: if they differ by more than 10 percent of the IQR, the column is meaningfully asymmetric. For `diamonds$price`, compute mean, median, and the skew ratio `(mean - median) / IQR`, then save a named vector to `ex_2_4`.

**Expected result:**

```
#>      mean    median       iqr skew_ratio
#>   3932.80   2401.00   4374.25       0.35
```

**Difficulty:** Intermediate

[HINTS]
Comparing the centre measured two different ways tells you whether the column leans toward one tail.
Compute `mean()`, `median()`, and `IQR()` of the column, then form the ratio `(mean - median) / IQR` inside a named vector.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m  <- mean(diamonds$price)
md <- median(diamonds$price)
iq <- IQR(diamonds$price)
ex_2_4 <- c(mean = m, median = md, iqr = iq, skew_ratio = (m - md) / iq)
round(ex_2_4, 2)
#>       mean     median        iqr skew_ratio
#>    3932.80    2401.00    4374.25       0.35
```

**Explanation:** A skew ratio of 0.35 means the mean sits about a third of an IQR above the median, a clear sign of right skew. Compared to skewness coefficients (Exercise 6.3), this ratio is dimensionless and easy to read. A common follow-up is to log-transform the column (Exercise 2.7) and recompute; for log-price the ratio collapses to near zero.

</details>

### Exercise 2.5: Build a five-number summary table

**Task:** Construct a tibble with one row per numeric column of `mtcars` and columns `min`, `q1`, `median`, `q3`, `max`. Use `summarise(across())` from dplyr after a `pivot_longer` or directly compute per column. Save the result to `ex_2_5`.

**Expected result:**

```
#> # A tibble: 11 x 6
#>    column   min     q1 median     q3    max
#>    <chr>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>
#>  1 mpg     10.4  15.4   19.2   22.8   33.9
#>  2 cyl      4     4      6      8      8
#>  3 disp    71.1 120.   196.   326    472
#>  ...
```

**Difficulty:** Intermediate

[HINTS]
You want one row per numeric column holding its smallest value, quartiles, and largest value.
Reshape `mtcars` with `pivot_longer()`, then `group_by(column)` and `summarise()` using `min()`, `quantile()`, `median()`, and `max()`.

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- mtcars |>
  pivot_longer(everything(), names_to = "column", values_to = "value") |>
  group_by(column) |>
  summarise(
    min    = min(value),
    q1     = quantile(value, 0.25),
    median = median(value),
    q3     = quantile(value, 0.75),
    max    = max(value),
    .groups = "drop"
  )
ex_2_5
#> # A tibble: 11 x 6
#>    column   min     q1 median     q3    max
#>    <chr>  <dbl>  <dbl>  <dbl>  <dbl>  <dbl>
#>  ...
```

**Explanation:** Pivoting to long format first lets you write a single `summarise()` call rather than `across()` with named outputs (which often produces wide ugly column names like `mpg_q1`). The long-then-summarise pattern is also faster to read for a reviewer who already speaks dplyr. For a one-shot solution, `psych::describe(mtcars)` returns this and more in one call.

</details>

### Exercise 2.6: Percentile-rank cars by horsepower

**Task:** Rank each car in `mtcars` by horsepower expressed as a percentile (0 to 1) using `dplyr::percent_rank()`, then add a `hp_rank_pct` column. Sort descending and save the top-5 cars (model name + hp + rank) to `ex_2_6`.

**Expected result:**

```
#> # A tibble: 5 x 3
#>   model                  hp hp_rank_pct
#>   <chr>               <dbl>       <dbl>
#> 1 Maserati Bora         335       1
#> 2 Ford Pantera L        264       0.968
#> 3 Duster 360            245       0.935
#> 4 Camaro Z28            245       0.935
#> 5 Chrysler Imperial     230       0.871
```

**Difficulty:** Intermediate

[HINTS]
You want each car placed on a 0-to-1 scale by how its horsepower compares to every other car.
After `rownames_to_column("model")`, `mutate()` a `percent_rank(hp)` column, `arrange(desc(...))`, and take `head(5)`.

```r title="Your turn"
ex_2_6 <- # your code here
ex_2_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_6 <- mtcars |>
  tibble::rownames_to_column("model") |>
  mutate(hp_rank_pct = percent_rank(hp)) |>
  arrange(desc(hp_rank_pct)) |>
  select(model, hp, hp_rank_pct) |>
  head(5)
ex_2_6
#> # A tibble: 5 x 3
#>   model                  hp hp_rank_pct
#> 1 Maserati Bora         335       1
#> ...
```

**Explanation:** `percent_rank()` maps the smallest value to 0 and the largest to 1, with ties getting their shared rank. It is preferred over `rank() / n()` for ties handling. Common mistake: using `min_rank()` returns integer ranks where the biggest values get the smallest numbers if you forget `desc()`. For cumulative distribution rather than rank, see `dplyr::cume_dist()` which returns the proportion of values at or below each observation.

</details>

### Exercise 2.7: Log-transform a heavy-tailed column

**Task:** Diamond prices span three orders of magnitude, making linear-scale plots and statistics dominated by the high-end stones. Add a `log_price` column to `diamonds` using `log10()`, then plot the histogram of the log-transformed values with 40 bins. Save the ggplot object to `ex_2_7`.

**Expected result:**

```
# Approximately bell-shaped histogram on log10 scale
# x: log10(price), roughly 2.5 to 4.3; symmetric around 3.4 (~$2500)
```

**Difficulty:** Intermediate

[HINTS]
When a positive variable spans several orders of magnitude, rescaling it usually pulls the distribution closer to symmetric.
Add a `log10(price)` column with `mutate()`, then plot it with `geom_histogram(bins = 40)`.

```r title="Your turn"
ex_2_7 <- # your code here
ex_2_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_7 <- diamonds |>
  mutate(log_price = log10(price)) |>
  ggplot(aes(log_price)) +
  geom_histogram(bins = 40, fill = "steelblue", colour = "white") +
  labs(title = "log10(price) distribution of diamonds",
       x = "log10(price)", y = "Count") +
  theme_minimal()
ex_2_7
# Roughly symmetric distribution centred near 3.4
```

**Explanation:** When a positive variable spans multiple orders of magnitude, a log transform usually makes the distribution closer to symmetric, which helps both visual inspection and downstream linear models. `log10()` is preferred for read-back ($10^{3.4} \approx 2500$); use `log()` (natural log) when computing skewness or fitting linear models if you want coefficients that read as elasticities. Common mistake: applying `log()` to a column with zeros or negatives produces `-Inf` or `NaN`; add a small offset or use `log1p()` for counts.

</details>

### Exercise 2.8: Spot bimodality with the faithful dataset

**Task:** A biostatistician suspects the `faithful$eruptions` column is bimodal (Old Faithful geyser eruptions are short or long, rarely middling). Plot the density and visually identify the two peaks, then compute the count of values below 3 minutes versus at-or-above. Save a named integer vector to `ex_2_8`.

**Expected result:**

```
#> short_lt3  long_ge3
#>        90       182
```

**Difficulty:** Advanced

[HINTS]
You want to confirm the distribution has two separate peaks and count how many values fall on each side of the dip.
Use `sum()` on the logical conditions `eruptions < 3` and `eruptions >= 3` to build a named integer vector.

```r title="Your turn"
ex_2_8 <- # your code here
ex_2_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_8 <- c(
  short_lt3 = sum(faithful$eruptions <  3),
  long_ge3  = sum(faithful$eruptions >= 3)
)
ex_2_8
#> short_lt3  long_ge3
#>        97       175
ggplot(faithful, aes(eruptions)) +
  geom_density(fill = "steelblue", alpha = 0.5) +
  geom_vline(xintercept = 3, linetype = "dashed")
```

**Explanation:** Bimodal distributions are a strong signal that the data is a mixture of two underlying processes, and statistics like mean and standard deviation become misleading. For faithful, the two peaks correspond to two physical eruption regimes. Common mistake: applying a normality test or fitting a single Gaussian masks this structure. The clean follow-up is mixture modelling with `mclust::Mclust()` or just stratifying the analysis above and below the dip.

</details>

## Section 3. Univariate categorical exploration (7 problems)

### Exercise 3.1: Tabulate cut categories in diamonds

**Task:** Count how many diamonds fall into each `cut` category using `dplyr::count()` and arrange descending by count. The result is a tibble with two columns, `cut` and `n`. Save it to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   cut           n
#>   <ord>     <int>
#> 1 Ideal     21551
#> 2 Premium   13791
#> 3 Very Good 12082
#> 4 Good       4906
#> 5 Fair       1610
```

**Difficulty:** Beginner

[HINTS]
You want a frequency table of a categorical column with the busiest category listed first.
Call `count()` on `cut` with `sort = TRUE`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- diamonds |>
  count(cut, sort = TRUE)
ex_3_1
#> # A tibble: 5 x 2
#>   cut           n
#> 1 Ideal     21551
#> ...
```

**Explanation:** `count(sort = TRUE)` is shorthand for `group_by() |> summarise(n = n()) |> arrange(desc(n))` and is the cleanest idiom for a frequency table. For row proportions, add `mutate(pct = n / sum(n))`. Common mistake: using base `table()` returns an object that prints differently and is harder to pipe through downstream. For tibble output, prefer `count()`.

</details>

### Exercise 3.2: Convert Titanic counts to proportions

**Task:** A retailer studying historical survival patterns wants the proportion of passengers that survived each class on the Titanic. Convert the built-in `Titanic` table to a tibble, group by `Class`, compute the survived-proportion, and save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   Class survived_pct
#>   <chr>        <dbl>
#> 1 1st          0.625
#> 2 2nd          0.414
#> 3 3rd          0.252
#> 4 Crew         0.240
```

**Difficulty:** Intermediate

[HINTS]
First make the pre-aggregated contingency table tidy, then work out the survived share within each class.
Run `as.data.frame(Titanic)`, `group_by(Class)`, and `summarise()` the survived `Freq` divided by the class total.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- as.data.frame(Titanic) |>
  group_by(Class) |>
  summarise(
    total    = sum(Freq),
    survived = sum(Freq[Survived == "Yes"]),
    survived_pct = survived / total,
    .groups = "drop"
  ) |>
  select(Class, survived_pct)
ex_3_2
#> # A tibble: 4 x 2
#>   Class survived_pct
#> 1 1st          0.625
#> ...
```

**Explanation:** The `Titanic` object is a 4-D contingency table; `as.data.frame()` unrolls it into a tidy long form with a `Freq` column. Once it's tidy, group-and-summarise is the standard pattern. Common mistake: using `prop.table(Titanic, margin = 1)` works on the array but gives a 4-D proportions array that is hard to read. Pivot to long form first.

</details>

### Exercise 3.3: Reorder mpg manufacturer by frequency

**Task:** A marketing analyst comparing car manufacturers in the `mpg` dataset wants to plot them sorted by frequency. Use `forcats::fct_infreq()` on `manufacturer`, then count and arrange. Save the levels (in their new order) as a character vector to `ex_3_3`.

**Expected result:**

```
#>  [1] "dodge"      "toyota"     "volkswagen" "ford"       "chevrolet"
#>  [6] "audi"       "hyundai"    "subaru"     "nissan"     "honda"
#> [11] "jeep"       "pontiac"    "mercury"    "lincoln"    "land rover"
```

**Difficulty:** Intermediate

[HINTS]
You want the category labels reordered from most common to least common.
Apply `fct_infreq()` to `manufacturer`, then `pull()` the column and read its `levels()`.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mpg |>
  mutate(manufacturer = fct_infreq(manufacturer)) |>
  pull(manufacturer) |>
  levels()
ex_3_3
#>  [1] "dodge"      "toyota"     "volkswagen" "ford"       "chevrolet"
#>  ...
```

**Explanation:** `fct_infreq()` orders factor levels by descending frequency, which is the most common ordering for bar charts because it puts the most important bars on the left. Compare with `fct_inorder()` (order of appearance), `fct_rev()` (reverse), and `fct_reorder()` (order by another variable). Common mistake: reordering the column but plotting with `coord_flip()` flips the visual order, so combine `fct_infreq()` with `fct_rev()` for a top-to-bottom horizontal bar chart.

</details>

### Exercise 3.4: Lump rare manufacturer categories

**Task:** An audit team simplifying a manufacturer breakdown wants the top 5 manufacturers kept and everything else collapsed into an "Other" bucket. Use `forcats::fct_lump_n()` with `n = 5` on `mpg$manufacturer`, then count and arrange descending. Save the resulting tibble to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   manufacturer     n
#>   <fct>        <int>
#> 1 Other           94
#> 2 dodge           37
#> 3 toyota          34
#> 4 volkswagen      27
#> 5 ford            25
#> 6 chevrolet       19
```

**Difficulty:** Intermediate

[HINTS]
You want to keep only the busiest few categories and pool every other one into a single catch-all bucket.
Use `fct_lump_n(manufacturer, n = 5)` inside `mutate()`, then `count(sort = TRUE)`.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- mpg |>
  mutate(manufacturer = fct_lump_n(manufacturer, n = 5)) |>
  count(manufacturer, sort = TRUE)
ex_3_4
#> # A tibble: 6 x 2
#>   manufacturer     n
#> 1 Other           94
#> ...
```

**Explanation:** `fct_lump_n()` keeps the n most frequent levels and lumps the rest. Related: `fct_lump_prop()` lumps levels below a proportion threshold; `fct_lump_min()` lumps levels with fewer than k observations. Common mistake: choosing n too high defeats the simplification; pick n based on how many bars fit comfortably in your chart (usually 5 to 8). The "Other" level is placed last by default; use `fct_relevel()` if you want it first.

</details>

### Exercise 3.5: Cross-tabulate sex and survival on Titanic

**Task:** Build a 2x2 cross-tab of `Sex` against `Survived` for the Titanic dataset (collapsed across class and age) using `xtabs()`. The output should be a table you can pipe to `prop.table(margin = 1)` for row proportions. Save the row-proportion table to `ex_3_5`.

**Expected result:**

```
#>         Survived
#> Sex             No        Yes
#>   Male   0.78791    0.21209
#>   Female 0.26770    0.73230
```

**Difficulty:** Intermediate

[HINTS]
Build a two-way frequency table, then convert each row so its entries are conditional shares summing to one.
Use `xtabs(Freq ~ Sex + Survived, ...)` on the tidied Titanic frame and pipe it into `prop.table(margin = 1)`.

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- xtabs(Freq ~ Sex + Survived, data = as.data.frame(Titanic)) |>
  prop.table(margin = 1)
round(ex_3_5, 5)
#>         Survived
#> Sex            No     Yes
#>   Male   0.78791 0.21209
#>   Female 0.26770 0.73230
```

**Explanation:** `xtabs()` accepts a frequency-weighted formula, which is perfect for a pre-aggregated dataset like `Titanic`. `prop.table(margin = 1)` divides each row by its total, giving conditional probabilities of survival given sex. Use `margin = 2` for conditional given survived status. Common mistake: omitting the margin gives cell proportions (each entry divided by the grand total), which is rarely what you want for a 2x2 contingency analysis.

</details>

### Exercise 3.6: Sorted bar chart of mpg class

**Task:** A reporting analyst building a marketing one-pager needs a clean horizontal bar chart of vehicle `class` counts in `mpg`, sorted by frequency. Use `forcats::fct_infreq()` and `coord_flip()` (or `fct_rev`) to produce the plot. Save the ggplot object to `ex_3_6`.

**Expected result:**

```
# Horizontal bar chart with class on y-axis, count on x-axis
# Bars sorted longest-to-shortest top-to-bottom: suv, compact, midsize, ...
```

**Difficulty:** Intermediate

[HINTS]
You want a horizontal bar chart with the longest bar at the top, the conventional reading order.
Reorder `class` with `fct_rev(fct_infreq(...))`, draw `geom_bar()`, and add `coord_flip()`.

```r title="Your turn"
ex_3_6 <- # your code here
ex_3_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_6 <- mpg |>
  mutate(class = fct_rev(fct_infreq(class))) |>
  ggplot(aes(class)) +
  geom_bar(fill = "steelblue") +
  coord_flip() +
  labs(title = "Vehicle class frequency", x = NULL, y = "Count") +
  theme_minimal()
ex_3_6
# Top bar: suv; bottom: 2seater
```

**Explanation:** Combining `fct_infreq()` (descending by count) with `fct_rev()` (reverse) plus `coord_flip()` produces a horizontal chart with the longest bar at the top, which is the conventional reading order. Common mistake: forgetting `fct_rev()` produces a chart with the largest category at the bottom, which most readers find jarring. For multiple-panel comparison, swap `coord_flip()` for `geom_bar() + facet_wrap()`.

</details>

### Exercise 3.7: Mosaic plot of class and survival

**Task:** A mosaic plot shows two categorical variables simultaneously, with rectangle area proportional to cell frequency. Build a mosaic of `Class` by `Survived` on Titanic using base `mosaicplot()`, with surviving cells shaded green and dying cells red. After plotting, save a confirmation string to `ex_3_7` so the plot call has executed.

**Expected result:**

```
# Mosaic with 4 columns (1st, 2nd, 3rd, Crew), each split vertically by Survived
# Rectangle areas proportional to cell frequency; survivor proportion decreases left-to-right
```

**Difficulty:** Advanced

[HINTS]
You want a single chart where each rectangle's area encodes the count of a cell across two categorical variables.
Call `mosaicplot(~ Class + Survived, data = Titanic, color = ...)`, then assign a confirmation string to the variable.

```r title="Your turn"
ex_3_7 <- # your code here
ex_3_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mosaicplot(~ Class + Survived, data = Titanic,
           main = "Titanic: Class by Survival",
           color = c("firebrick", "forestgreen"))
ex_3_7 <- "mosaic plotted"
ex_3_7
#> [1] "mosaic plotted"
```

**Explanation:** Mosaic plots scale better than grouped bar charts when both axes have several levels because each cell area encodes a count directly. Reading rule: width of a column shows the marginal frequency of the column variable; height within a column shows the conditional distribution. For a ggplot2 equivalent, see `ggmosaic::geom_mosaic()`. Common mistake: treating `Titanic` as a data frame; here, `mosaicplot()` accepts the table directly through a formula.

</details>

## Section 4. Missing data and outliers (8 problems)

### Exercise 4.1: Count NA per column in airquality

**Task:** Before any analysis on `airquality`, you need to know which columns have missing values and how many. Use `colSums(is.na())` to count NAs per column, then sort descending and save the result as a named integer vector to `ex_4_1`.

**Expected result:**

```
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Difficulty:** Beginner

[HINTS]
Before analysis you need a per-column count of missing values, with the worst offenders listed first.
Apply `colSums(is.na(airquality))` and wrap the result in `sort(decreasing = TRUE)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- sort(colSums(is.na(airquality)), decreasing = TRUE)
ex_4_1
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
```

**Explanation:** `is.na()` returns a logical matrix; `colSums()` treats TRUE as 1 to give per-column counts. Sorting puts the worst offenders first, useful when deciding which columns to impute, drop, or model the missingness for. For percentages, divide by `nrow()`. For wider tables, the equivalent tidyverse call is `naniar::miss_var_summary()` which adds percentage and pct-of-total directly.

</details>

### Exercise 4.2: Visualize missingness with naniar

**Task:** A climatologist wants a single visual showing the percentage of missing values per variable across `airquality`. Use `naniar::gg_miss_var()` with `show_pct = TRUE`. Save the ggplot object to `ex_4_2`.

**Expected result:**

```
# Horizontal lollipop chart showing % missing per variable
# Ozone tops the chart (~24%), Solar.R next (~5%), other vars 0%
```

**Difficulty:** Intermediate

[HINTS]
You want one chart that ranks every variable by its share of missing values.
Call `gg_miss_var(airquality, show_pct = TRUE)` and layer `labs()` and `theme_minimal()` on top.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- gg_miss_var(airquality, show_pct = TRUE) +
  labs(title = "Missingness in airquality") +
  theme_minimal()
ex_4_2
# Lollipop chart sorted by missingness percentage
```

**Explanation:** `gg_miss_var()` returns a ggplot object, so you can layer titles and themes on top. The percentage view is more useful than counts when comparing columns of different sample sizes. Related plots in naniar: `gg_miss_upset()` (combinations of co-missingness), `gg_miss_case()` (rows with most missing), and `vis_miss()` (full matrix heatmap). Common mistake: ignoring co-missingness; two columns can each have 5% NA but if they co-miss, listwise deletion still drops 5%, not 10%.

</details>

### Exercise 4.3: Compute the complete-case rate

**Task:** Listwise deletion (dropping rows with any NA) is a common pre-modeling step, but you want to know upfront how much data it removes. Compute the percentage of rows in `airquality` that are complete (no missing in any column) using `complete.cases()` and save the result as a single numeric to `ex_4_3`.

**Expected result:**

```
#> [1] 72.55
```

**Difficulty:** Intermediate

[HINTS]
You want the percentage of rows that carry no missing value in any column at all.
Take the `mean()` of `complete.cases(airquality)` and multiply by 100.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- round(100 * mean(complete.cases(airquality)), 2)
ex_4_3
#> [1] 72.55
```

**Explanation:** `complete.cases()` returns a logical vector with TRUE for rows that have no missing values. Taking the mean of the logical gives the proportion, which scales to a percentage by multiplying by 100. Common mistake: dropping the 27.45% of incomplete rows before checking which columns drive the loss; if a single column accounts for most missingness, imputing it or dropping the column itself preserves more rows than listwise deletion.

</details>

### Exercise 4.4: Flag IQR-rule outliers in ozone

**Task:** Apply Tukey's rule (values beyond 1.5 IQR from Q1 or Q3) to `airquality$Ozone` and count how many readings flag as outliers. Save a named integer vector with `lower_count`, `upper_count`, and `total_outliers` to `ex_4_4`.

**Expected result:**

```
#>    lower_count    upper_count total_outliers
#>              0              2              2
```

**Difficulty:** Intermediate

[HINTS]
Tukey's fences sit 1.5 spreads beyond each outer quartile; count how many readings fall past each fence.
Compute `quantile()` Q1 and Q3 plus `IQR()`, derive the lower and upper bounds, and `sum()` the values beyond each.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
oz <- na.omit(airquality$Ozone)
q1 <- quantile(oz, 0.25)
q3 <- quantile(oz, 0.75)
iq <- q3 - q1
lo <- q1 - 1.5 * iq
hi <- q3 + 1.5 * iq
ex_4_4 <- c(
  lower_count    = sum(oz < lo),
  upper_count    = sum(oz > hi),
  total_outliers = sum(oz < lo | oz > hi)
)
ex_4_4
#>    lower_count    upper_count total_outliers
#>              0              2              2
```

**Explanation:** The 1.5 IQR rule is a sensible default for symmetric data but flags more points than expected on skewed distributions like ozone. For heavy-tailed data, the 3 IQR rule (used by some boxplot variants) is less aggressive. Common mistake: applying the rule to log-transformed data and then back-transforming; the outliers identified on the log scale may not match the linear-scale outliers. Always document which scale the rule was applied on.

</details>

### Exercise 4.5: Z-score outliers in mtcars horsepower

**Task:** Compute the z-score of every car's horsepower in `mtcars` (subtract mean, divide by sd), then flag cars whose absolute z-score exceeds 2. Save a tibble of flagged cars with columns `model`, `hp`, and `z` to `ex_4_5`.

**Expected result:**

```
#> # A tibble: 1 x 3
#>   model            hp     z
#>   <chr>         <dbl> <dbl>
#> 1 Maserati Bora   335  2.75
```

**Difficulty:** Intermediate

[HINTS]
Restate each value as its distance from the centre measured in units of spread, then flag the extreme ones.
In a `mutate()`, build a z column as `(hp - mean(hp)) / sd(hp)` and `filter(abs(z) > 2)`.

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- mtcars |>
  tibble::rownames_to_column("model") |>
  mutate(z = (hp - mean(hp)) / sd(hp)) |>
  filter(abs(z) > 2) |>
  select(model, hp, z)
ex_4_5
#> # A tibble: 1 x 3
#>   model            hp     z
#> 1 Maserati Bora   335  2.75
```

**Explanation:** Z-score thresholds assume a roughly normal distribution; for heavy-tailed data, the threshold should be higher (often 3 or 3.5). The z-score rule and the IQR rule (Exercise 4.4) frequently flag different points because they use different measures of spread; use both as cross-checks. Common mistake: computing z within a grouped subset but using the global mean/sd. For grouped outliers, use `group_by()` before the mutate.

</details>

### Exercise 4.6: Winsorize at the 5th and 95th percentile

**Task:** A risk team wants to cap extreme values rather than drop them. Apply a 5/95 winsorization to `diamonds$price`: values below the 5th percentile are clamped up to it, values above the 95th are clamped down. Save the summary statistics of the winsorized column (min, mean, max) to `ex_4_6`.

**Expected result:**

```
#>      min     mean      max
#>   544.95  3611.34 13107.05
```

**Difficulty:** Advanced

[HINTS]
Rather than dropping the extremes, clamp each tail value to the percentile cutoff at that end.
Get the 5th and 95th `quantile()` cutoffs and clamp the column with `pmin()` and `pmax()`, then summarise min, mean, and max.

```r title="Your turn"
ex_4_6 <- # your code here
ex_4_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- quantile(diamonds$price, c(0.05, 0.95))
wins <- pmin(pmax(diamonds$price, p[1]), p[2])
ex_4_6 <- c(min = min(wins), mean = mean(wins), max = max(wins))
round(ex_4_6, 2)
#>      min     mean      max
#>   544.95  3611.34 13107.05
```

**Explanation:** Winsorization preserves sample size (no rows dropped) but blunts the influence of extremes on means, regressions, and correlations. It is widely used in finance and operations research. Tradeoff: aggressive winsorization (e.g., 1/99 or 5/95) distorts the tail and biases tail-aware estimators like value-at-risk. Common mistake: winsorizing the response variable but not predictors when fitting a regression. For symmetric models, applying it to both or neither is more consistent.

</details>

### Exercise 4.7: Compare distributions before and after outlier removal

**Task:** A fraud team wants to see how trimming the top 1% of transaction amounts changes the mean. Using `diamonds$price`, compute mean before trimming, mean after dropping the top 1%, and the absolute and percentage change. Save a named numeric vector to `ex_4_7`.

**Expected result:**

```
#>   mean_before    mean_after        abs_chg        pct_chg
#>       3932.80       3675.89        -256.91          -6.53
```

**Difficulty:** Advanced

[HINTS]
Measure how much the average shifts once the most extreme one percent of values is removed.
Compute `mean()` before, then `mean()` of values at or below the 0.99 `quantile()` cutoff, and report the absolute and percent change.

```r title="Your turn"
ex_4_7 <- # your code here
ex_4_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
m0 <- mean(diamonds$price)
cut99 <- quantile(diamonds$price, 0.99)
m1 <- mean(diamonds$price[diamonds$price <= cut99])
ex_4_7 <- c(
  mean_before = m0,
  mean_after  = m1,
  abs_chg     = m1 - m0,
  pct_chg     = 100 * (m1 - m0) / m0
)
round(ex_4_7, 2)
#> mean_before  mean_after     abs_chg     pct_chg
#>     3932.80     3675.89     -256.91       -6.53
```

**Explanation:** A 6.5% drop in mean from trimming the top 1% tells you that one in a hundred high-priced diamonds drives a meaningful chunk of the average. Whether that is "fraud-like" depends on context: for diamonds it is just the heavy-tail nature of the inventory; for credit card transactions, that same pattern would be a red flag. Use this delta-mean analysis to decide whether the tail is informative or noise.

</details>

### Exercise 4.8: Median-impute ozone NAs

**Task:** An epidemiologist preparing the airquality data for a downstream model wants to replace `Ozone` NAs with the column's median value. Use `dplyr::mutate()` with `ifelse()` (or `coalesce`) and save the imputed vector to `ex_4_8`. Verify by counting NAs after.

**Expected result:**

```
#> n_before n_after  median
#>       37       0    31.5
```

**Difficulty:** Intermediate

[HINTS]
Replace each missing reading with the column's typical central value, then confirm none remain.
Compute `median(..., na.rm = TRUE)` and substitute it wherever `is.na()` is TRUE using `ifelse()`.

```r title="Your turn"
ex_4_8 <- # your code here
ex_4_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
med <- median(airquality$Ozone, na.rm = TRUE)
imputed <- ifelse(is.na(airquality$Ozone), med, airquality$Ozone)
ex_4_8 <- c(
  n_before = sum(is.na(airquality$Ozone)),
  n_after  = sum(is.na(imputed)),
  median   = med
)
ex_4_8
#> n_before  n_after   median
#>       37        0     31.5
```

**Explanation:** Median imputation is the simplest possible imputation and biases variance estimates downward because it shrinks the spread of the imputed column. It is fine for quick EDA and bad for downstream inference. For better imputations, see `mice::mice()` (multiple imputation) or `missForest::missForest()` (model-based). Common mistake: imputing using the mean when the column is skewed; median is robust to skew and is the safer default.

</details>

## Section 5. Bivariate and multivariate exploration (10 problems)

### Exercise 5.1: Scatter plot weight against mpg

**Task:** Plot a scatter of car weight `wt` against fuel economy `mpg` in `mtcars`, with a loess smoother and points sized by horsepower. Add titles and a minimal theme, then save the ggplot to `ex_5_1`.

**Expected result:**

```
# Scatter plot with weight (x) vs mpg (y), points sized by hp
# Negative trend: heavier cars get worse mileage; loess curve overlays
```

**Difficulty:** Beginner

[HINTS]
Plot the two variables as points with a smooth trend line, encoding a third variable through point size.
Set `aes(wt, mpg, size = hp)`, then add `geom_point()` and `geom_smooth(method = "loess", se = FALSE)`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mtcars, aes(wt, mpg, size = hp)) +
  geom_point(alpha = 0.7) +
  geom_smooth(method = "loess", se = FALSE, colour = "firebrick", show.legend = FALSE) +
  labs(title = "Weight vs MPG (points sized by HP)",
       x = "Weight (1000 lbs)", y = "Miles per gallon") +
  theme_minimal()
ex_5_1
# Negative trend visible
```

**Explanation:** Encoding a third variable through `size` is fine for one or two extra dimensions but becomes hard to read past that. For more dimensions, prefer faceting (Exercise 5.2) or `GGally::ggpairs()` (Exercise 5.5). The loess smoother is non-parametric so it captures curvature better than `lm`, useful early in EDA before you commit to a functional form. Common mistake: setting `se = TRUE` on small data produces enormous confidence ribbons.

</details>

### Exercise 5.2: Faceted scatter of price by cut

**Task:** A jeweller wants to see how the carat-price relationship varies by cut quality. Build a scatter of `carat` vs `price` faceted by `cut` (5 panels) using ggplot2 and a sample of 5000 rows for speed. Save to `ex_5_2`.

**Expected result:**

```
# Five-panel scatter (Fair, Good, Very Good, Premium, Ideal)
# All show positive curvature; the Ideal panel has the densest cluster at low carat
```

**Difficulty:** Intermediate

[HINTS]
Split one scatter relationship into small panels, one per category, after thinning the data for speed.
Take a 5000-row sample, then `ggplot(aes(carat, price))` with `geom_point()` and `facet_wrap(~ cut)`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_5_2 <- diamonds |>
  slice_sample(n = 5000) |>
  ggplot(aes(carat, price)) +
  geom_point(alpha = 0.3, colour = "steelblue") +
  facet_wrap(~ cut) +
  labs(title = "Carat vs price, by cut") +
  theme_minimal()
ex_5_2
# Curvature consistent across panels
```

**Explanation:** Faceting decomposes a relationship by a categorical variable so you can spot interaction effects visually. Always sample large datasets (5k to 10k points) before plotting; ggplot2 can render 50k points but the output is opaque overplotting. For overplotting, set `alpha` low and add `geom_smooth()` to expose the trend. Common mistake: faceting without `scales = "free"` when panels have very different value ranges, which hides patterns in the smaller panels.

</details>

### Exercise 5.3: Correlation matrix of mtcars

**Task:** Compute the Pearson correlation matrix of all numeric columns in `mtcars` using `cor()`. Round to two decimals and save the resulting matrix to `ex_5_3`.

**Expected result:**

```
#>        mpg   cyl  disp    hp  drat    wt  qsec    vs    am  gear  carb
#> mpg   1.00 -0.85 -0.85 -0.78  0.68 -0.87  0.42  0.66  0.60  0.48 -0.55
#> cyl  -0.85  1.00  0.90  0.83 -0.70  0.78 -0.59 -0.81 -0.52 -0.49  0.53
#> ...
```

**Difficulty:** Intermediate

[HINTS]
You want the table of pairwise linear associations among all the numeric columns.
Call `cor(mtcars)` and wrap it in `round(, 2)`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- round(cor(mtcars), 2)
ex_5_3[1:4, 1:4]
#>        mpg   cyl  disp    hp
#> mpg   1.00 -0.85 -0.85 -0.78
#> cyl  -0.85  1.00  0.90  0.83
#> disp -0.85  0.90  1.00  0.79
#> hp   -0.78  0.83  0.79  1.00
```

**Explanation:** `cor()` defaults to Pearson, which assumes a linear relationship and is sensitive to outliers. For monotonic but non-linear relationships, use `method = "spearman"` (rank-based). For mixed numeric and ordinal columns, Spearman is also the safer default. Common mistake: using `cor()` on a data frame with NAs without `use = "pairwise.complete.obs"` returns NA across the board; set it explicitly when missingness is present.

</details>

### Exercise 5.4: Correlation heatmap

**Task:** Pivot the mtcars correlation matrix from Exercise 5.3 to long form and plot a heatmap with ggplot2's `geom_tile()`, using a diverging colour scale centred at zero. Save the ggplot to `ex_5_4`.

**Expected result:**

```
# 11x11 heatmap with cells coloured red (positive) and blue (negative)
# Diagonal is darkest red (correlation = 1)
```

**Difficulty:** Intermediate

[HINTS]
Reshape the square correlation table into long form so each pair becomes a row, then draw it as a coloured grid centred at zero.
Use `pivot_longer()` on the correlation matrix, then `geom_tile(aes(fill = corr))` with `scale_fill_gradient2(midpoint = 0)`.

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cor_long <- cor(mtcars) |>
  as.data.frame() |>
  tibble::rownames_to_column("var1") |>
  pivot_longer(-var1, names_to = "var2", values_to = "corr")

ex_5_4 <- ggplot(cor_long, aes(var1, var2, fill = corr)) +
  geom_tile() +
  scale_fill_gradient2(low = "steelblue", mid = "white", high = "firebrick",
                       midpoint = 0, limits = c(-1, 1)) +
  labs(title = "mtcars correlation heatmap", x = NULL, y = NULL) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ex_5_4
# Diverging palette centred at zero
```

**Explanation:** Diverging palettes (e.g., RdBu, PiYG) are the right choice when zero is a meaningful midpoint. The `scale_fill_gradient2()` centring and explicit `limits = c(-1, 1)` keep the colour mapping comparable across plots. Alternative ready-made package: `corrplot::corrplot()` returns a heat-mapped, hierarchically-clustered correlation plot in one call. Common mistake: leaving the diagonal in (it always equals 1) inflates the visual saturation; consider masking it with `geom_tile(data = filter(cor_long, var1 != var2))`.

</details>

### Exercise 5.5: GGally ggpairs on iris

**Task:** An ecologist studying `iris` wants a single overview chart showing all pairwise scatter plots, marginal densities, and per-cell correlations, coloured by `Species`. Use `GGally::ggpairs()` and save the result to `ex_5_5`.

**Expected result:**

```
# 5x5 pair plot of Sepal.Length, Sepal.Width, Petal.Length, Petal.Width, Species
# Lower triangle: scatter plots; diagonal: density; upper triangle: correlations
# Three colours, one per species
```

**Difficulty:** Intermediate

[HINTS]
You want a single overview chart showing every pairwise relationship at once, coloured by group.
Call `ggpairs(iris, columns = 1:4, aes(colour = Species))`.

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_5 <- ggpairs(iris, columns = 1:4, aes(colour = Species, alpha = 0.5),
                  title = "iris pairs plot")
ex_5_5
# Pair plot with species-coloured points and densities
```

**Explanation:** `ggpairs()` is the fastest way to scan all bivariate relationships in a dataset with under ~10 numeric columns; beyond that it becomes too dense to read. The default upper triangle shows Pearson correlations, the lower triangle shows scatter, and the diagonal shows densities. Common mistake: passing the whole data frame including non-numeric columns; specify `columns = 1:4` (or similar) to avoid noisy panels for factors.

</details>

### Exercise 5.6: Boxplot of mpg by cylinder count

**Task:** Build a boxplot of `mpg` grouped by `cyl` in the `mtcars` dataset. Convert `cyl` to a factor so the boxplot uses three distinct categories, and save the ggplot to `ex_5_6`.

**Expected result:**

```
# Three boxes: 4-cyl (highest mpg, ~26 median), 6-cyl (~20), 8-cyl (lowest, ~15)
# Whiskers extend to roughly 1.5 IQR; visible outlier in 4-cyl group
```

**Difficulty:** Beginner

[HINTS]
Compare the distribution of one numeric variable across a handful of discrete groups.
Convert `cyl` to a factor first, then `ggplot(aes(cyl, mpg))` with `geom_boxplot()`.

```r title="Your turn"
ex_5_6 <- # your code here
ex_5_6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_6 <- mtcars |>
  mutate(cyl = factor(cyl)) |>
  ggplot(aes(cyl, mpg, fill = cyl)) +
  geom_boxplot(show.legend = FALSE) +
  labs(title = "MPG by cylinder count", x = "Cylinders", y = "MPG") +
  theme_minimal()
ex_5_6
# Three boxes: 4-cyl highest, 8-cyl lowest
```

**Explanation:** Boxplots compress a distribution to five summary stats per group, making cross-group comparisons fast. The "notched" variant (`geom_boxplot(notch = TRUE)`) draws confidence intervals around the medians; if notches don't overlap, the medians differ at roughly 95% confidence. For small groups, prefer `geom_jitter()` over a boxplot because a boxplot with 5 points is essentially decorative.

</details>

### Exercise 5.7: Grouped mean mpg by cylinder

**Task:** Use dplyr to compute the mean `mpg`, standard deviation, and group size per `cyl` level in `mtcars`. Save the resulting tibble to `ex_5_7`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>     cyl mean_mpg sd_mpg     n
#>   <dbl>    <dbl>  <dbl> <int>
#> 1     4     26.7   4.51    11
#> 2     6     19.7   1.45     7
#> 3     8     15.1   2.56    14
```

**Difficulty:** Intermediate

[HINTS]
You want the centre, the spread, and the count for each group collected in one tibble.
Use `group_by(cyl)` then `summarise()` with `mean()`, `sd()`, and `n()`.

```r title="Your turn"
ex_5_7 <- # your code here
ex_5_7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_7 <- mtcars |>
  group_by(cyl) |>
  summarise(
    mean_mpg = mean(mpg),
    sd_mpg   = sd(mpg),
    n        = n(),
    .groups  = "drop"
  )
ex_5_7
#> # A tibble: 3 x 4
#>     cyl mean_mpg sd_mpg     n
#>   <dbl>    <dbl>  <dbl> <int>
#> 1     4     26.7   4.51    11
#> ...
```

**Explanation:** Group-and-summarise is the workhorse of EDA. Always include `n` so a reader can spot under-powered groups (here, only 7 six-cylinder cars). Common mistake: omitting `.groups = "drop"` leaves the result grouped, which can cause surprises when piping into a subsequent `mutate()` or `filter()`. For dplyr 1.1+, you can write `summarise(.by = cyl, ...)` to express grouping inline without leaving the tibble grouped.

</details>

### Exercise 5.8: Scatter with multiple aesthetic encodings

**Task:** A trading desk visualising diamond inventory wants a single scatter encoding four variables: `carat` on x, `price` on y, `cut` as colour, `depth` as size. Use a 5000-row sample. Save the plot to `ex_5_8`.

**Expected result:**

```
# Multi-aesthetic scatter: carat (x), price (y), colour by cut, size by depth
# 5 colour categories and continuous size scale; positive curvature visible
```

**Difficulty:** Advanced

[HINTS]
Encode four variables in one scatter by mapping two of them to position and the other two to colour and size.
Set `aes(carat, price, colour = cut, size = depth)` on a 5000-row sample and add `geom_point()`.

```r title="Your turn"
ex_5_8 <- # your code here
ex_5_8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
ex_5_8 <- diamonds |>
  slice_sample(n = 5000) |>
  ggplot(aes(carat, price, colour = cut, size = depth)) +
  geom_point(alpha = 0.4) +
  scale_size(range = c(0.5, 3)) +
  labs(title = "Carat vs price, by cut and depth") +
  theme_minimal()
ex_5_8
# Four-variable scatter with colour and size legends
```

**Explanation:** Four-aesthetic plots are at the upper bound of what a human can decode in one glance. Use them deliberately and label every legend. For more than four variables, switch to faceting (one variable becomes panels) or `ggpairs()`. Tip: when encoding both colour and size, keep the size range tight (`range = c(0.5, 3)`) so the colour signal doesn't get drowned out.

</details>

### Exercise 5.9: Conditional means by multiple groups

**Task:** Compute the mean `mpg` and mean `hp` of `mtcars` cars grouped by both `cyl` and `am` (automatic vs manual). Save the resulting tibble to `ex_5_9`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>     cyl    am mean_mpg mean_hp
#>   <dbl> <dbl>    <dbl>   <dbl>
#> 1     4     0     22.9    84.7
#> 2     4     1     28.1    81.9
#> 3     6     0     19.1   115.
#> 4     6     1     20.6   131.7
#> 5     8     0     15.0   194.2
#> 6     8     1     15.4   299.5
```

**Difficulty:** Intermediate

[HINTS]
Average the metrics within every combination of two grouping columns at once.
Use `group_by(cyl, am)` then `summarise()` `mean(mpg)` and `mean(hp)`.

```r title="Your turn"
ex_5_9 <- # your code here
ex_5_9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_9 <- mtcars |>
  group_by(cyl, am) |>
  summarise(
    mean_mpg = mean(mpg),
    mean_hp  = mean(hp),
    .groups  = "drop"
  )
ex_5_9
#> # A tibble: 6 x 4
#>     cyl    am mean_mpg mean_hp
#> 1     4     0     22.9    84.7
#> ...
```

**Explanation:** Multi-key groupings reveal interactions: 8-cyl cars are similar in mpg regardless of transmission, but manual transmission packs 100 more horsepower on average. Always inspect group sizes alongside means; a group of size 1 or 2 produces a near-meaningless average. For wide-format display, pipe into `pivot_wider(names_from = am, values_from = c(mean_mpg, mean_hp))`.

</details>

### Exercise 5.10: Strongest correlate of mpg

**Task:** An ML engineer wants a quick "best linear predictor" baseline: find the column of `mtcars` (excluding `mpg`) with the highest absolute Pearson correlation against `mpg`. Save a one-row tibble with `column` and `corr` to `ex_5_10`.

**Expected result:**

```
#> # A tibble: 1 x 2
#>   column  corr
#>   <chr>  <dbl>
#> 1 wt     -0.868
```

**Difficulty:** Advanced

[HINTS]
Find which other column has the tightest linear association with the target, regardless of sign.
Take the `mpg` column of `cor(mtcars)`, drop the self-pair, and `arrange(desc(abs(corr)))` before `head(1)`.

```r title="Your turn"
ex_5_10 <- # your code here
ex_5_10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_10 <- cor(mtcars)[, "mpg"] |>
  as.data.frame() |>
  tibble::rownames_to_column("column") |>
  rename(corr = 2) |>
  filter(column != "mpg") |>
  arrange(desc(abs(corr))) |>
  head(1)
ex_5_10
#>   column       corr
#> 1     wt -0.8676594
```

**Explanation:** Highest-absolute-correlation gives you a sensible first feature to include in a linear model and a benchmark against which more sophisticated feature-selection methods (lasso, mutual information, tree importance) must justify themselves. Common mistake: confusing high marginal correlation with high partial correlation; `wt` and `disp` are themselves highly correlated, so once `wt` is in the model the marginal value of `disp` drops sharply.

</details>

## Section 6. Distributions and transformations (5 problems)

### Exercise 6.1: QQ plot of mpg

**Task:** Build a normal Q-Q plot of `mtcars$mpg` using `stat_qq()` and `stat_qq_line()` in ggplot2, with a clean theme and title. Save the plot to `ex_6_1`.

**Expected result:**

```
# Normal Q-Q plot: sample quantiles (y) vs theoretical (x)
# Points roughly follow the reference line with slight curvature at the high end
```

**Difficulty:** Intermediate

[HINTS]
You want to compare a sample's quantiles against a normal reference line visually.
Use `aes(sample = mpg)` together with `stat_qq()` and `stat_qq_line()`.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- ggplot(mtcars, aes(sample = mpg)) +
  stat_qq() +
  stat_qq_line(colour = "firebrick") +
  labs(title = "Q-Q plot of mtcars$mpg",
       x = "Theoretical quantiles", y = "Sample quantiles") +
  theme_minimal()
ex_6_1
# QQ plot close to the reference line
```

**Explanation:** A Q-Q plot compares the empirical quantiles of a sample to the theoretical quantiles of a target distribution (normal by default). Points lying on the reference line indicate the sample matches the target distribution. Departures: an S-curve indicates heavy tails; a U-curve indicates skew. For other distributions, swap `stat_qq()` for `stat_qq(distribution = qexp)` or use `qqPlot()` from the car package.

</details>

### Exercise 6.2: Shapiro-Wilk normality test on mpg

**Task:** Run a Shapiro-Wilk test on `mtcars$mpg` using `shapiro.test()` and extract the test statistic and p-value into a named numeric vector. Save to `ex_6_2`.

**Expected result:**

```
#>          W   p_value
#>  0.9476478 0.1228814
```

**Difficulty:** Intermediate

[HINTS]
Run a formal normality test and pull its two reported numbers into a named vector.
Call `shapiro.test(mtcars$mpg)` and extract the `$statistic` and `$p.value` elements.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sw <- shapiro.test(mtcars$mpg)
ex_6_2 <- c(W = unname(sw$statistic), p_value = sw$p.value)
ex_6_2
#>          W   p_value
#>  0.9476478 0.1228814
```

**Explanation:** Shapiro-Wilk is the most powerful normality test for small samples (n < 50) and remains useful up to about n = 5000. A p-value above 0.05 fails to reject normality, but with small n the test has low power, so "passing" Shapiro-Wilk does not prove the data are normal. Always combine with a Q-Q plot (Exercise 6.1). For large samples the test rejects on tiny departures; in that regime, judge normality visually instead.

</details>

### Exercise 6.3: Sample skewness with moments package

**Task:** Compute the sample skewness of `diamonds$price` and `log10(diamonds$price)` using `moments::skewness()` and save both to a named numeric vector `ex_6_3`. Compare to confirm the log transform reduces skew.

**Expected result:**

```
#>       raw       log
#>  1.618395 -0.029020
```

**Difficulty:** Intermediate

[HINTS]
Quantify the asymmetry on the raw column and again after a log rescale to show the tail shrinks.
Call `skewness()` on `diamonds$price` and on `log10(diamonds$price)`, collecting both in a named vector.

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- c(
  raw = skewness(diamonds$price),
  log = skewness(log10(diamonds$price))
)
round(ex_6_3, 6)
#>       raw       log
#>  1.618395 -0.029020
```

**Explanation:** Sample skewness near zero indicates symmetry; positive values indicate a right tail; negative values a left tail. Values beyond +/-1 are commonly called "highly skewed". The collapse from 1.62 to nearly 0 after log transformation confirms the heavy right tail in raw prices and motivates analysing log-price for models that assume symmetric residuals. Related: `moments::kurtosis()` measures tail heaviness (3 for a normal distribution; >3 means heavier tails).

</details>

### Exercise 6.4: Compare raw and log distributions side by side

**Task:** Build a two-panel ggplot using `patchwork` or `facet_wrap` showing the density of `diamonds$price` on the raw scale and on the log10 scale. Save the combined plot to `ex_6_4`.

**Expected result:**

```
# Two panels labelled "raw" (right-skewed) and "log10" (roughly symmetric)
# Same dataset, different scale; the log panel looks bell-shaped
```

**Difficulty:** Advanced

[HINTS]
Show the same variable's density on two scales side by side to make the case for transforming it.
Build a long frame with `raw` and `log10` columns via `pivot_longer()`, then `geom_density()` plus `facet_wrap(~ scale, scales = "free")`.

```r title="Your turn"
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
long <- diamonds |>
  transmute(raw = price, log10 = log10(price)) |>
  pivot_longer(everything(), names_to = "scale", values_to = "value")

ex_6_4 <- ggplot(long, aes(value, fill = scale)) +
  geom_density(alpha = 0.6, show.legend = FALSE) +
  facet_wrap(~ scale, scales = "free") +
  labs(title = "Price distribution: raw vs log10") +
  theme_minimal()
ex_6_4
# Two panels side by side
```

**Explanation:** Side-by-side density comparison makes the case for transformation more compelling than reporting a skewness number. The `scales = "free"` is essential here because the two scales differ by three orders of magnitude. For more than two transforms, pivot longer with the transformed values and facet by the transform name. Common mistake: comparing two density plots with the same x-axis when only one has been transformed; the plot becomes useless.

</details>

### Exercise 6.5: Standardize numeric columns of mtcars

**Task:** Centre and scale all numeric columns of `mtcars` to mean 0 and standard deviation 1 using `scale()`. Convert the result back to a data frame and save to `ex_6_5`. Verify by checking that column means are ~0 and sd ~1.

**Expected result:**

```
#> # A tibble: 11 x 3
#>    column  mean    sd
#>    <chr>  <dbl> <dbl>
#>  1 mpg        0     1
#>  2 cyl        0     1
#>  3 disp       0     1
#>  ...
```

**Difficulty:** Intermediate

[HINTS]
Recentre and rescale every numeric column so each ends up with mean zero and unit spread.
Apply `scale()` to `mtcars`, convert the result back with `as.data.frame()`, then check each column's `mean` and `sd`.

```r title="Your turn"
ex_6_5 <- # your code here
ex_6_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
scaled <- as.data.frame(scale(mtcars))
ex_6_5 <- tibble(
  column = names(scaled),
  mean   = round(sapply(scaled, mean), 6),
  sd     = round(sapply(scaled, sd), 6)
)
ex_6_5
#> # A tibble: 11 x 3
#>    column  mean    sd
#>  1 mpg        0     1
#>  ...
```

**Explanation:** Standardization is a prerequisite for distance-based methods (k-means, kNN, PCA) because columns with larger raw scales would otherwise dominate. After scaling, the mean is exactly 0 and the sd is exactly 1 by construction, but the rounding shows floating-point noise around 1e-16 for the mean. Common mistake: scaling categorical columns with one-hot encodings; scale only the continuous columns or use `recipes::step_normalize()` to handle the selection automatically.

</details>

## Section 7. End-to-end EDA workflows (4 problems)

### Exercise 7.1: One-line dataset profile with skimr

**Task:** A hackathon participant grabs a new CSV and wants the fastest possible profile: types, completeness, summary stats, and inline histograms for numeric columns. Call `skimr::skim()` on `mtcars` and capture the printed result to `ex_7_1`.

**Expected result:**

```
#> -- Data Summary ------------------------
#>                            Values
#> Name                       mtcars
#> Number of rows             32
#> Number of columns          11
#> -- Variable type: numeric --
#>    skim_variable n_missing complete_rate    mean ...
#> 1  mpg                   0             1   20.09 ...
#> ...
```

**Difficulty:** Beginner

[HINTS]
You want the fastest possible first-pass profile, grouped by column type with completeness and inline histograms.
Wrap `skim(mtcars)` in `capture.output()` to store the printed report as a character vector.

```r title="Your turn"
ex_7_1 <- # your code here
ex_7_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- capture.output(skim(mtcars))
cat(head(ex_7_1, 20), sep = "\n")
#> -- Data Summary ------------------------
#>                            Values
#> Name                       mtcars
#> Number of rows             32
#> Number of columns          11
#> ...
```

**Explanation:** `skim()` is the single most useful one-liner for first-pass EDA: it groups by column type, reports completeness, summary stats, and tiny in-text histograms for numeric columns. It returns a tibble subclass so you can index it like a normal data frame after the fact. Compare to `summary()` (Exercise 1.3) which is plainer and doesn't separate by type. For larger reports, see `DataExplorer::create_report()` (Exercise 7.2).

</details>

### Exercise 7.2: Generate a DataExplorer report

**Task:** A junior analyst onboarding to a new dataset wants a single HTML report covering distributions, missingness, correlations, and PCA. Use `DataExplorer::create_report()` on a 5000-row sample of `diamonds` and save the output file path to `ex_7_2`. Set `output_file` and `output_dir` explicitly.

**Expected result:**

```
#> [1] "/tmp/diamonds-eda.html"
```

**Difficulty:** Intermediate

[HINTS]
Generate a full HTML profiling report from a single call and keep the file path it writes to.
Call `create_report()` on a 5000-row sample with explicit `output_file` and `output_dir`, then save the resulting path.

```r title="Your turn"
ex_7_2 <- # your code here
ex_7_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
sample_d <- slice_sample(diamonds, n = 5000)
out_path <- tempfile(fileext = ".html")
create_report(sample_d, output_file = basename(out_path),
              output_dir = dirname(out_path))
ex_7_2 <- out_path
ex_7_2
#> [1] "/tmp/RtmpXYZ/fileabc.html"
```

**Explanation:** `create_report()` calls rmarkdown to knit a template HTML page in one shot. It is great for a fast handoff to a stakeholder but bad as a polished deliverable: the plots are stock and the prose is auto-generated. Use it as your first pass, then cherry-pick the most informative plots into a hand-written report. Related: `summarytools::dfSummary()` and `ExPanDaR::ExPanD()` offer interactive alternatives.

</details>

### Exercise 7.3: Full EDA pipeline on iris

**Task:** As a take-home interview exercise, write a pipeline that on `iris`: (a) prints the structure, (b) prints group means by species, (c) saves a ggpairs plot to a variable. Bundle these into a list named `ex_7_3` with elements `structure`, `group_means`, `pair_plot`.

**Expected result:**

```
#> $structure: character vector of str() output
#> $group_means: tibble with 5 columns (Species + 4 numeric means)
#> $pair_plot: ggmatrix object
```

**Difficulty:** Advanced

[HINTS]
Bundle three named EDA artefacts - a structure dump, group means, and a pair plot - into one container.
Build a `list()` holding `capture.output(str(iris))`, a `group_by(Species)` summary, and a `ggpairs()` call.

```r title="Your turn"
ex_7_3 <- # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_3 <- list(
  structure   = capture.output(str(iris)),
  group_means = iris |>
    group_by(Species) |>
    summarise(across(where(is.numeric), mean), .groups = "drop"),
  pair_plot   = ggpairs(iris, columns = 1:4, aes(colour = Species))
)
str(ex_7_3, max.level = 1)
#> List of 3
#>  $ structure  : chr [1:6] "'data.frame': ..."
#>  $ group_means: tibble [3 x 5]
#>  $ pair_plot  : List of 17
```

**Explanation:** Bundling EDA artefacts into a list (or an R6/S4 object) keeps a reusable pipeline clean: each artefact has a name, the function returns a single thing, and downstream code (report generators, dashboards) can index by name. Common mistake: returning unnamed elements via `c(a, b, c)` flattens components together. Always use `list()` for heterogeneous return values.

</details>

### Exercise 7.4: Reusable EDA function returning a tibble

**Task:** Write a function `eda_profile(df)` that takes any data frame and returns a tibble with one row per column and columns `name`, `class`, `n_missing`, `n_unique`, `mean_if_num`, `min_if_num`, `max_if_num`. For non-numeric columns, the numeric fields are NA. Apply it to `mtcars` and save the resulting tibble to `ex_7_4`.

**Expected result:**

```
#> # A tibble: 11 x 7
#>    name  class   n_missing n_unique mean_if_num min_if_num max_if_num
#>    <chr> <chr>       <int>    <int>       <dbl>      <dbl>      <dbl>
#>  1 mpg   numeric         0       25       20.1       10.4       33.9
#>  2 cyl   numeric         0        3        6.19       4          8
#>  ...
```

**Difficulty:** Advanced

[HINTS]
Write one reusable function that returns a per-column profile tibble for any data frame you hand it.
Inside the function build a `tibble()` from `vapply()` calls computing class, missing count, unique count, and numeric-only mean, min, and max.

```r title="Your turn"
ex_7_4 <- # your code here
ex_7_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
eda_profile <- function(df) {
  num_or_na <- function(x, f) if (is.numeric(x)) f(x, na.rm = TRUE) else NA_real_
  tibble(
    name        = names(df),
    class       = vapply(df, function(x) class(x)[1], character(1)),
    n_missing   = vapply(df, function(x) sum(is.na(x)), integer(1)),
    n_unique    = vapply(df, function(x) length(unique(x)), integer(1)),
    mean_if_num = vapply(df, num_or_na, numeric(1), f = mean),
    min_if_num  = vapply(df, num_or_na, numeric(1), f = min),
    max_if_num  = vapply(df, num_or_na, numeric(1), f = max)
  )
}
ex_7_4 <- eda_profile(mtcars)
ex_7_4
#> # A tibble: 11 x 7
#>    name  class   n_missing n_unique mean_if_num min_if_num max_if_num
#>  1 mpg   numeric         0       25       20.1       10.4       33.9
#>  ...
```

**Explanation:** A small, well-typed function like this becomes the building block of a personal EDA toolkit. The `vapply()` calls enforce the return shape per column so the resulting tibble is type-stable; the `num_or_na` helper makes the numeric-only logic readable. For richer profiles, layer the function with quantiles, mode for factors, and a text snippet of values. Common mistake: using `sapply()` instead of `vapply()`, which silently produces a list when types vary across columns.

</details>

## What to do next

You've practiced the full EDA stack: inspection, univariate plots, categorical tallies, missingness, outliers, bivariate exploration, transformations, and reusable workflows. Continue with these companion resources:

- [Exploratory Data Analysis in R](Exploratory-Data-Analysis-in-R.html): the main tutorial this hub accompanies, with worked examples and the conceptual framework.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html): drill the grouped-summary patterns you used in Sections 5 and 7.
- [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html): extend the visualisation work in Sections 2, 3, 5, and 6.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html): clean and reshape data before exploration.
