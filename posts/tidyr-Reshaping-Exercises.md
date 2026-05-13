---
title: "tidyr Reshaping Exercises in R: 18 Real-World Practice Problems"
slug: "tidyr-Reshaping-Exercises"
description: "Practice tidyr reshaping with 18 scenario-based problems: pivot_longer, pivot_wider, names_sep, names_pattern, .value, separate, complete, fill. Hidden solutions."
keywords: "tidyr exercises, pivot_longer exercises, pivot_wider exercises, tidyr reshaping exercises, reshape data in R, wide to long R, long to wide R, tidyr practice"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "tidyr Reshaping Exercises"
sidebar_order: 150
fr_parent: "pivot_longer-pivot_wider-Reshape-Data-in-R.html"
auto_link_terms: "tidyr exercises|pivot_longer exercises|pivot_wider exercises|tidyr reshaping exercises|reshape data exercises in r"
auto_link_case_sensitive: false
target_keyword: "tidyr reshaping exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# tidyr Reshaping Exercises in R: 18 Real-World Practice Problems

<p class="lead">Eighteen scenario-based tidyr reshaping exercises grouped into five themed sections covering pivot_longer, pivot_wider, names_sep, names_pattern, the .value sentinel, separate, unite, complete, and fill. Every problem ships with an expected result, and solutions are hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(tidyr)
library(dplyr)
library(tibble)
```

## Section 1. pivot_longer basics (4 problems)

### Exercise 1.1: Reshape relig_income into long format with pivot_longer

**Task:** A demographic researcher needs to reshape the built-in tidyr dataset `relig_income`, which stores 18 US religions across 10 income-bracket columns, into a long-format tibble where each religion-bracket pair is its own row. Use `pivot_longer()` with `cols = -religion` to fold the 10 bracket columns into a key column called `bracket` and a value column called `count`. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 180 x 3
#>   religion bracket           count
#>   <chr>    <chr>             <dbl>
#> 1 Agnostic <$10k                27
#> 2 Agnostic $10-20k              34
#> 3 Agnostic $20-30k              60
#> 4 Agnostic $30-40k              81
#> 5 Agnostic $40-50k              76
#> 6 Agnostic $50-75k             137
#> # 174 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- pivot_longer(
  relig_income,
  cols      = -religion,
  names_to  = "bracket",
  values_to = "count"
)
ex_1_1
#> # A tibble: 180 x 3
#>   religion bracket  count
#>   <chr>    <chr>    <dbl>
#> 1 Agnostic <$10k       27
#> 2 Agnostic $10-20k     34
#> ...
```

**Explanation:** `cols = -religion` is the negative-selection idiom: pick every column EXCEPT `religion`. Eighteen rows times ten bracket columns produces 180 long rows. The `names_to` argument labels the new key column and `values_to` labels the value column. Cleaner than `gather()` (the deprecated predecessor), because the column-selection helpers are aligned with `dplyr::select()`.

</details>

### Exercise 1.2: Pivot only the first six weeks of billboard

**Task:** The chart historian working with the tidyr `billboard` dataset only cares about the first six weeks of each track's run, not all 76 weekly columns. Use `pivot_longer()` with `cols = wk1:wk6` so only those six columns are folded into a `week` key and `rank` value column, keeping `artist`, `track`, and `date.entered` as id columns, and drop NA ranks with `values_drop_na = TRUE`. Save to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 1,902 x 5
#>   artist  track                   date.entered week   rank
#>   <chr>   <chr>                   <date>       <chr> <dbl>
#> 1 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk1      87
#> 2 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk2      82
#> 3 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk3      72
#> ...
#> # 1,896 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- pivot_longer(
  billboard,
  cols             = wk1:wk6,
  names_to         = "week",
  values_to        = "rank",
  values_drop_na   = TRUE
)
ex_1_2
```

**Explanation:** `wk1:wk6` uses the column-range selector (positional, between named columns) so only six of the 76 weekly columns participate. `values_drop_na = TRUE` discards rows where the track had not yet entered or had already exited the chart in that week, which is the natural behavior for time-series-style ranks. Without it, the result would be 317 * 6 = 1902 rows minus drops; with NA rows kept you carry useless padding.

</details>

### Exercise 1.3: Strip the wk prefix and cast week to integer

**Task:** Continuing the billboard analysis, your downstream plotting code expects `week` to be a clean integer rather than strings like `wk3`. Redo the pivot from Exercise 1.2 using `cols = wk1:wk6` but add `names_prefix = "wk"` to strip the literal prefix and `names_transform = list(week = as.integer)` to coerce the resulting key column to integer in one pass. Save to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 1,902 x 5
#>   artist  track                   date.entered  week  rank
#>   <chr>   <chr>                   <date>       <int> <dbl>
#> 1 2 Pac   Baby Don't Cry (Keep...  2000-02-26      1    87
#> 2 2 Pac   Baby Don't Cry (Keep...  2000-02-26      2    82
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- pivot_longer(
  billboard,
  cols             = wk1:wk6,
  names_to         = "week",
  values_to        = "rank",
  names_prefix     = "wk",
  names_transform  = list(week = as.integer),
  values_drop_na   = TRUE
)
ex_1_3
```

**Explanation:** Doing the strip-and-cast inline avoids a follow-up `mutate(week = as.integer(...))` and keeps the type clean from the moment the column is born. `names_prefix` accepts a regular expression, so `"wk"` would also drop a literal `"wks"` if it appeared. A common mistake is using `parse_number()` post-pivot, which works but loses the chain. For a column that already lacks a prefix, omit `names_prefix` and use only `names_transform`.

</details>

### Exercise 1.4: Find each track's peak chart position

**Task:** The chart historian now wants every track's all-time peak ranking across the full 76 weeks. Pivot every `wk*` column to long form using `cols = starts_with("wk")` with `values_drop_na = TRUE`, then group by `artist` and `track`, summarise to take `min(rank)` as `peak_rank`, and sort ascending so the strongest performers float to the top. Save the result to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 317 x 3
#>   artist                 track                       peak_rank
#>   <chr>                  <chr>                           <dbl>
#> 1 Destiny's Child        Independent Women Part I            1
#> 2 Santana                Maria, Maria                        1
#> 3 Savage Garden          I Knew I Loved You                  1
#> 4 Madonna                Music                               1
#> 5 Aguilera, Christina    Come On Over Baby (All I W...       1
#> # 312 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- billboard |>
  pivot_longer(
    cols           = starts_with("wk"),
    names_to       = "week",
    values_to      = "rank",
    values_drop_na = TRUE
  ) |>
  group_by(artist, track) |>
  summarise(peak_rank = min(rank), .groups = "drop") |>
  arrange(peak_rank)
ex_1_4
```

**Explanation:** `starts_with("wk")` is the tidyselect helper that grabs every column whose name begins with the prefix, future-proofing against more weekly columns being added. The pivot turns each track-week pair into a row, the group-and-summarise then collapses each track back to its best showing. Dropping NAs is essential here: without it, `min()` would return `NA` for any track that hit the chart even briefly before exiting.

</details>

## Section 2. pivot_wider basics (3 problems)

### Exercise 2.1: Reshape fish_encounters from long to wide

**Task:** The conservation team has the built-in tidyr `fish_encounters` dataset listing whether each of 19 fish was seen at each of 11 monitoring stations in long form (`fish`, `station`, `seen`). Reshape it so each row is one fish and each column is a station with the `seen` flag in the cells, using `pivot_wider(names_from = station, values_from = seen)`. Save the result to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 19 x 12
#>   fish  Release I80_1   Lisbon  Rstr  Base_TD   BCE   BCW   BCE2  BCW2   MAE   MAW
#>   <fct>   <int> <int>   <int>   <int>   <int> <int> <int> <int> <int> <int> <int>
#> 1 4842        1     1       1       1       1     1     1     1     1     1     1
#> 2 4843        1     1       1       1       1     1     1     1     1     1     1
#> 3 4844        1     1       1       1       1     1     1     1     1     1     1
#> 4 4845        1     1       1       1       1    NA    NA    NA    NA    NA    NA
#> # 15 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- pivot_wider(
  fish_encounters,
  names_from  = station,
  values_from = seen
)
ex_2_1
```

**Explanation:** `pivot_wider()` is the exact inverse of `pivot_longer()`: the column you point to with `names_from` supplies the new column names, and the column you point to with `values_from` supplies the cell values. Any combination of fish-and-station that did not appear in the long source becomes an `NA` in the wide result, which is why fish 4845 has NAs from station `BCE` onward. The default `values_fill = NA` produces this behavior; Exercise 2.2 swaps it out.

</details>

### Exercise 2.2: Replace NA cells with zero using values_fill

**Task:** The previous reshape left `NA` in every cell where a fish was never observed at a station, but the downstream report expects zeros there instead so absence is encoded numerically. Repeat the `pivot_wider()` call on `fish_encounters` and add `values_fill = 0` so absent observations are encoded as 0 rather than NA. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 19 x 12
#>   fish  Release I80_1 Lisbon  Rstr Base_TD   BCE   BCW   BCE2  BCW2   MAE   MAW
#>   <fct>   <int> <int>  <int> <int>   <int> <int> <int>  <int> <int> <int> <int>
#> 1 4842        1     1      1     1       1     1     1      1     1     1     1
#> 2 4845        1     1      1     1       1     0     0      0     0     0     0
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- pivot_wider(
  fish_encounters,
  names_from  = station,
  values_from = seen,
  values_fill = 0
)
ex_2_2
```

**Explanation:** `values_fill` accepts either a single scalar (applied to every value column) or a named list (per-value-column fills). For binary presence flags, zero is the right semantic default: it means observed-absent rather than unknown. Passing `values_fill = list(seen = 0L)` would be the most explicit form and is preferred when you have multiple value columns with different natural defaults.

</details>

### Exercise 2.3: Pivot a tidy summary back to a reporting matrix

**Task:** A finance analyst has a tidy three-column summary tibble (built inline below) with `region`, `quarter`, and `revenue`, and needs to hand it to leadership formatted as a region-by-quarter matrix where rows are regions and columns are the four quarters. Use `pivot_wider(names_from = quarter, values_from = revenue)` on the inline tibble and save to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   region    Q1    Q2    Q3    Q4
#>   <chr>  <dbl> <dbl> <dbl> <dbl>
#> 1 North    120   135   150   165
#> 2 South     90   100   110   125
#> 3 East     150   160   170   190
```

**Difficulty:** Intermediate

```r title="Your turn"
revenue_long <- tribble(
  ~region, ~quarter, ~revenue,
  "North", "Q1", 120, "North", "Q2", 135, "North", "Q3", 150, "North", "Q4", 165,
  "South", "Q1",  90, "South", "Q2", 100, "South", "Q3", 110, "South", "Q4", 125,
  "East",  "Q1", 150, "East",  "Q2", 160, "East",  "Q3", 170, "East",  "Q4", 190
)

ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- pivot_wider(
  revenue_long,
  names_from  = quarter,
  values_from = revenue
)
ex_2_3
```

**Explanation:** This is the most common reporting flip: analysts model and aggregate in long form (one row per region-quarter) because that is the shape every dplyr verb expects, then pivot wide only at the very end for human-readable display. Resist the temptation to keep data wide upstream: a tidy long table joins, filters, and groups cleanly, while a wide one fights every verb you throw at it.

</details>

## Section 3. Advanced pivot_longer (4 problems)

### Exercise 3.1: Split encoded column names with names_sep

**Task:** A health-records inline tibble (built below) has columns `male_old`, `male_young`, `female_old`, `female_young`, where the column names encode TWO variables (sex and age group) joined by `_`. Pivot to long form using `pivot_longer()` with `names_to = c("sex", "age")` and `names_sep = "_"` so the joined column names split into two clean key columns plus one value column called `n`. Save to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 12 x 4
#>   country sex    age       n
#>   <chr>   <chr>  <chr> <dbl>
#> 1 US      male   old      42
#> 2 US      male   young    18
#> 3 US      female old      55
#> 4 US      female young    23
#> 5 UK      male   old      31
#> # 7 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
health <- tribble(
  ~country, ~male_old, ~male_young, ~female_old, ~female_young,
  "US",     42,        18,           55,          23,
  "UK",     31,        14,           40,          19,
  "DE",     27,        12,           36,          17
)

ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- pivot_longer(
  health,
  cols      = -country,
  names_to  = c("sex", "age"),
  names_sep = "_",
  values_to = "n"
)
ex_3_1
```

**Explanation:** When `names_to` is a character vector of length two and `names_sep` is given, each old column name is split into that many pieces and each piece becomes a value in the corresponding key column. Three countries times four columns produces 12 long rows. Without `names_sep`, you would get a single column called `"sex_age"` with values like `"male_old"`, forcing a follow-up `separate()` call.

</details>

### Exercise 3.2: Extract two key columns with a regex via names_pattern

**Task:** A macroeconomic inline tibble (built below) has columns like `gdp_2020`, `gdp_2021`, `pop_2020`, `pop_2021`. Use `pivot_longer()` with `names_to = c("metric", "year")` and `names_pattern = "(gdp|pop)_(\\d+)"` to capture both pieces, then add `names_transform = list(year = as.integer)` so year lands as integer. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 12 x 4
#>   country metric  year value
#>   <chr>   <chr>  <int> <dbl>
#> 1 US      gdp     2020 21000
#> 2 US      gdp     2021 23000
#> 3 US      pop     2020   331
#> 4 US      pop     2021   332
#> 5 UK      gdp     2020  2800
#> # 7 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
econ <- tribble(
  ~country, ~gdp_2020, ~gdp_2021, ~pop_2020, ~pop_2021,
  "US",     21000,     23000,     331,       332,
  "UK",      2800,      3100,      67,        67,
  "DE",      3800,      4200,      83,        84
)

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- pivot_longer(
  econ,
  cols             = -country,
  names_to         = c("metric", "year"),
  names_pattern    = "(gdp|pop)_(\\d+)",
  values_to        = "value",
  names_transform  = list(year = as.integer)
)
ex_3_2
```

**Explanation:** Use `names_pattern` (regex with one capture group per `names_to` entry) when the separator is ambiguous or when you need precise control over what each piece looks like. The pattern `(gdp|pop)_(\d+)` says: first capture is the literal `gdp` or `pop`, second capture is one or more digits. Compared to `names_sep = "_"` this is safer because it rejects malformed column names instead of silently splitting them in surprising ways.

</details>

### Exercise 3.3: Spread paired columns with the .value sentinel

**Task:** The built-in tidyr `household` dataset has columns `dob_child1`, `dob_child2`, `name_child1`, `name_child2`, where each child contributes two parallel columns. Use `pivot_longer()` with `names_to = c(".value", "child")` and `names_sep = "_"` so the `dob` and `name` prefixes become their own columns and `child` (containing `"child1"` or `"child2"`) becomes the long-form id. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 8 x 4
#>   family child  dob        name
#>    <int> <chr>  <date>     <chr>
#> 1      1 child1 1998-11-26 Susan
#> 2      1 child2 NA         NA
#> 3      2 child1 1996-06-22 Mark
#> 4      2 child2 NA         NA
#> 5      3 child1 2002-07-11 Sam
#> 6      3 child2 2004-04-05 Seth
#> # 2 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- pivot_longer(
  household,
  cols      = -family,
  names_to  = c(".value", "child"),
  names_sep = "_"
)
ex_3_3
```

**Explanation:** The `.value` sentinel is the killer feature for paired columns. When `names_to` contains `".value"`, the matching piece of each old column name becomes the NEW column name in the result rather than a value inside a key column. Four old columns collapse into two value columns (`dob`, `name`) plus one new key column (`child`). Without `.value` you would get a single value column smashing dates and strings together, type-coerced to character.

</details>

### Exercise 3.4: Convert numeric stems with names_transform

**Task:** A field-survey inline tibble (built below) stores depth readings in columns `depth_5`, `depth_10`, `depth_15`, `depth_20` (the suffix is meters). Pivot to long using `names_prefix = "depth_"` to strip the literal stem, then ensure the new `depth` key is numeric using `names_transform = list(depth = as.numeric)` so it can sit on a continuous axis. Save to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 12 x 3
#>   site  depth reading
#>   <chr> <dbl>   <dbl>
#> 1 A         5    18.2
#> 2 A        10    17.4
#> 3 A        15    16.1
#> 4 A        20    14.3
#> 5 B         5    19.0
#> # 7 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
survey <- tribble(
  ~site, ~depth_5, ~depth_10, ~depth_15, ~depth_20,
  "A",   18.2,     17.4,      16.1,      14.3,
  "B",   19.0,     18.1,      16.8,      15.0,
  "C",   17.5,     16.7,      15.4,      13.7
)

ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- pivot_longer(
  survey,
  cols             = -site,
  names_to         = "depth",
  values_to        = "reading",
  names_prefix     = "depth_",
  names_transform  = list(depth = as.numeric)
)
ex_3_4
```

**Explanation:** Stripping the prefix turns `depth_15` into `"15"`, but it is still a character. `names_transform` lets you coerce in the same call so the column is born as numeric and behaves correctly on plot axes and joins. A common mistake is reaching for `as.integer` here: it would silently drop fractional depths if any appeared. `as.numeric` (double) is the safer default.

</details>

## Section 4. Advanced pivot_wider (3 problems)

### Exercise 4.1: Spread two value columns at once

**Task:** A student-scores inline tibble (built below) has one row per student-subject containing both a `score` and a `grade` letter. Use `pivot_wider(names_from = subject, values_from = c(score, grade))` so each student gets one row with paired score and grade columns per subject, producing names like `score_math` and `grade_math`. Save the result to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 3 x 5
#>   student  score_math  score_eng grade_math grade_eng
#>   <chr>        <dbl>      <dbl>  <chr>      <chr>
#> 1 Ada            92         88   A          B
#> 2 Bea            78         95   C          A
#> 3 Cy             85         80   B          B
```

**Difficulty:** Intermediate

```r title="Your turn"
scores <- tribble(
  ~student, ~subject, ~score, ~grade,
  "Ada",    "math",      92,  "A",
  "Ada",    "eng",       88,  "B",
  "Bea",    "math",      78,  "C",
  "Bea",    "eng",       95,  "A",
  "Cy",     "math",      85,  "B",
  "Cy",     "eng",       80,  "B"
)

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- pivot_wider(
  scores,
  names_from  = subject,
  values_from = c(score, grade)
)
ex_4_1
```

**Explanation:** Passing a vector to `values_from` produces one new column PER value-input PER name-input, with names auto-generated as `{value}_{name}`. Two subjects times two value columns gives four new columns. If you do not like the auto naming, swap in `names_glue` to take control: `names_glue = "{subject}.{.value}"` would produce `math.score`, `eng.score`, and so on.

</details>

### Exercise 4.2: Aggregate duplicate cells with values_fn = sum

**Task:** A retail manager has a transaction log inline tibble (built below) where each row is a sale with `store`, `product`, and `units_sold`, and a store may post multiple sales for the same product. Pivot to a store-by-product matrix that SUMS units, using `values_fn = sum` inside `pivot_wider()` to aggregate duplicate combinations rather than crashing with a list-column warning. Save the result to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 2 x 4
#>   store    Widget Gadget Gizmo
#>   <chr>     <dbl>  <dbl> <dbl>
#> 1 NorthSt      12      7     5
#> 2 SouthSt       8     11     3
```

**Difficulty:** Advanced

```r title="Your turn"
sales <- tribble(
  ~store,     ~product,  ~units_sold,
  "NorthSt",  "Widget",   5,
  "NorthSt",  "Widget",   7,
  "NorthSt",  "Gadget",   7,
  "NorthSt",  "Gizmo",    5,
  "SouthSt",  "Widget",   8,
  "SouthSt",  "Gadget",   6,
  "SouthSt",  "Gadget",   5,
  "SouthSt",  "Gizmo",    3
)

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- pivot_wider(
  sales,
  names_from  = product,
  values_from = units_sold,
  values_fn   = sum
)
ex_4_2
```

**Explanation:** When the `(name_id, value_id)` pairs are not unique, `pivot_wider()` cannot decide which value to drop into a cell, so by default it stuffs all values into a list-column and warns. `values_fn = sum` says aggregate-then-drop; you could pass `mean`, `max`, or any reducer that accepts a numeric vector. The alternative pattern is to `group_by()` and `summarise()` upstream so the input is already unique, then pivot without `values_fn`. Either works; `values_fn` is faster to type.

</details>

### Exercise 4.3: Build custom column names with names_glue

**Task:** The portfolio team wants column names like `Q1_revenue`, `Q1_cost`, `Q2_revenue`, `Q2_cost` from a tidy quarter-by-metric inline tibble (built below). Use `pivot_wider()` with `names_from = c(quarter, metric)` and `names_glue = "{quarter}_{metric}"` to produce the custom naming layout instead of the default underscore-joined order. Save the result to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 2 x 5
#>   region   Q1_revenue Q1_cost Q2_revenue Q2_cost
#>   <chr>         <dbl>   <dbl>      <dbl>   <dbl>
#> 1 North           120      80        135      85
#> 2 South            90      60        100      62
```

**Difficulty:** Intermediate

```r title="Your turn"
finance <- tribble(
  ~region, ~quarter, ~metric,    ~value,
  "North", "Q1",     "revenue",  120,
  "North", "Q1",     "cost",      80,
  "North", "Q2",     "revenue",  135,
  "North", "Q2",     "cost",      85,
  "South", "Q1",     "revenue",   90,
  "South", "Q1",     "cost",      60,
  "South", "Q2",     "revenue",  100,
  "South", "Q2",     "cost",      62
)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- pivot_wider(
  finance,
  names_from  = c(quarter, metric),
  values_from = value,
  names_glue  = "{quarter}_{metric}"
)
ex_4_3
```

**Explanation:** `names_glue` accepts a glue template string where each placeholder refers to a column listed in `names_from`. The default join would also produce `Q1_revenue`-style names here, but `names_glue` becomes essential when you want to insert a constant, change separators per-column, or rearrange the order (`"{metric}-{quarter}"` would give `revenue-Q1`). Glue templates compose cleanly with `dplyr::rename_with()` if you want post-hoc adjustments.

</details>

## Section 5. Companion verbs: separate, unite, complete, fill (4 problems)

### Exercise 5.1: Split full_name into first and last with separate_wider_delim

**Task:** A data-entry sheet has a single `full_name` column with values like `"Ada Lovelace"` and `"Alan Turing"`, but downstream code expects `first` and `last` as separate columns. Use the modern `separate_wider_delim()` from tidyr 1.3+ with `delim = " "` and `names = c("first", "last")` to split on the space, applied to the inline tibble of five names below. Save the result to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   first    last
#>   <chr>    <chr>
#> 1 Ada      Lovelace
#> 2 Alan     Turing
#> 3 Grace    Hopper
#> 4 Donald   Knuth
#> 5 Margaret Hamilton
```

**Difficulty:** Intermediate

```r title="Your turn"
people <- tibble(full_name = c(
  "Ada Lovelace", "Alan Turing", "Grace Hopper",
  "Donald Knuth", "Margaret Hamilton"
))

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- separate_wider_delim(
  people,
  cols  = full_name,
  delim = " ",
  names = c("first", "last")
)
ex_5_1
```

**Explanation:** `separate_wider_delim()` is the tidyr 1.3+ replacement for the older `separate()`. It is stricter by default: if any row has the wrong number of pieces, it errors loudly rather than silently filling with NA. For names with middle parts, pass `too_many = "merge"` to glue extras into the last piece. The `_wider_` naming convention echoes the pivot family: `_wider_` adds columns, `_longer_` would add rows.

</details>

### Exercise 5.2: Reunite year/month/day into an ISO date string

**Task:** An export pipeline split a timestamp into separate `year`, `month`, and `day` integer columns, but the downstream API expects a single ISO-style `date` string like `"2024-03-15"`. Use `unite()` on the inline tibble below with `col = "date"`, the three columns in order, and `sep = "-"` to merge the three components back into one column. Save the result to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 5 x 1
#>   date
#>   <chr>
#> 1 2024-01-12
#> 2 2024-02-04
#> 3 2024-03-15
#> 4 2024-04-22
#> 5 2024-05-30
```

**Difficulty:** Intermediate

```r title="Your turn"
parts <- tribble(
  ~year, ~month, ~day,
  2024,    "01",   "12",
  2024,    "02",   "04",
  2024,    "03",   "15",
  2024,    "04",   "22",
  2024,    "05",   "30"
)

ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- unite(parts, col = "date", year, month, day, sep = "-")
ex_5_2
```

**Explanation:** `unite()` is the natural inverse of `separate()` and the same logic as base R `paste(..., sep = "-")` but column-aware. By default the source columns are dropped; pass `remove = FALSE` to keep them alongside the new combined column. To get a real `Date` object instead of a string, follow up with `mutate(date = as.Date(date))` or skip `unite` entirely and use `lubridate::make_date(year, month, day)`.

</details>

### Exercise 5.3: Complete missing date-by-category combinations

**Task:** A sensor log inline tibble (built below) has readings only on days where a sensor reported, so days with no signal are silently absent. Use `complete(date, sensor_id, fill = list(reading = 0))` to materialize every date-by-sensor combination explicitly, filling the previously absent `reading` cells with 0 instead of NA. Save the result to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   date       sensor_id reading
#>   <date>     <chr>       <dbl>
#> 1 2024-06-01 S1            12
#> 2 2024-06-01 S2             0
#> 3 2024-06-02 S1            14
#> 4 2024-06-02 S2             9
#> 5 2024-06-03 S1             0
#> 6 2024-06-03 S2            11
```

**Difficulty:** Intermediate

```r title="Your turn"
sensors <- tribble(
  ~date,                ~sensor_id, ~reading,
  as.Date("2024-06-01"), "S1",       12,
  as.Date("2024-06-02"), "S1",       14,
  as.Date("2024-06-02"), "S2",        9,
  as.Date("2024-06-03"), "S2",       11
)

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- complete(
  sensors,
  date, sensor_id,
  fill = list(reading = 0)
)
ex_5_3
```

**Explanation:** `complete()` builds the Cartesian product of the values seen in the columns you pass, joins it against the original data, and keeps the union. Missing rows are added with NA in unspecified columns, but `fill = list(reading = 0)` lets you replace those NAs at birth. This is the canonical move before plotting time series so gaps look like genuine zeros instead of disappearing lines. For dense full-range completion, pair with `tidyr::full_seq()` to enumerate every date.

</details>

### Exercise 5.4: Carry forward report dates with fill

**Task:** A daily-report inline tibble (built below) lists the report date only on the first row of each batch and leaves it NA on subsequent rows so the printed report looks tidier. Use `fill(date, .direction = "down")` to carry the date forward into the NA rows so every observation knows its report date, then save the result to `ex_5_4`.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   date       item   value
#>   <date>     <chr>  <dbl>
#> 1 2024-07-01 alpha     10
#> 2 2024-07-01 beta      12
#> 3 2024-07-01 gamma     14
#> 4 2024-07-02 alpha     11
#> 5 2024-07-02 beta      13
#> 6 2024-07-02 gamma     15
```

**Difficulty:** Intermediate

```r title="Your turn"
report <- tribble(
  ~date,                  ~item,   ~value,
  as.Date("2024-07-01"),  "alpha",  10,
  NA,                     "beta",   12,
  NA,                     "gamma",  14,
  as.Date("2024-07-02"),  "alpha",  11,
  NA,                     "beta",   13,
  NA,                     "gamma",  15
)

ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- fill(report, date, .direction = "down")
ex_5_4
```

**Explanation:** `fill()` replaces NAs in the columns you name with the nearest non-NA value, defaulting to downward direction. This is the classic move when spreadsheets repeat a header value only at the top of each block. Pass `.direction = "up"` to back-fill from below, or `"downup"` to fill in both directions when an NA might sit between two known values. Always pair with `group_by()` if NAs should only fill within partitions, never across them.

</details>

## What to do next

- [pivot_longer and pivot_wider: Reshape Data in R](pivot_longer-pivot_wider-Reshape-Data-in-R.html) is the parent tutorial covering every option in depth.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) practices the verbs you chain BEFORE and AFTER a reshape.
- [tidyverse Exercises in R](tidyverse-Exercises-in-R.html) puts reshaping in cross-package pipelines.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html) covers the broader cleaning workflow these reshapes plug into.
