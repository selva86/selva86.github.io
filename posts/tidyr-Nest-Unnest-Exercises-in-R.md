---
title: "tidyr Nest Unnest Exercises in R: 18 List-Column Drills"
slug: "tidyr-Nest-Unnest-Exercises-in-R"
description: "Practice nest(), unnest(), list-columns, and the many-models pattern with 18 scenario-based tidyr exercises. Hidden solutions and worked explanations."
keywords: "nest unnest R, many models, tidyr nest exercises, list columns R, tidyr unnest_wider, tidyr unnest_longer, broom many models, tidyr practice"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "tidyr Nest/Unnest Exercises"
sidebar_order: 145
fr_parent: "Data-Wrangling-With-tidyr.html"
auto_link_terms: "nest unnest exercises|list column practice|many models pattern|tidyr nest exercises|tidyr unnest practice"
auto_link_case_sensitive: false
target_keyword: "nest unnest R, many models"
sibling_block_enabled: false
difficulty: "Mixed"
---

# tidyr Nest Unnest Exercises in R: 18 List-Column Drills

<p class="lead">Eighteen scenario-based exercises on tidyr's nest/unnest family and the many-models workflow that depends on it. Each problem ships with an expected result so you can verify, and full solutions plus explanations are hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(tidyr)
library(dplyr)
library(tibble)
library(purrr)
library(broom)
library(ggplot2)
```

## Section 1. Building list-columns with nest (3 problems)

### Exercise 1.1: Nest mtcars rows by cylinder count

**Task:** A bench engineer wants to keep each cylinder group's full data as a single bundle so it can be passed around as one object per group. Use `nest()` on `mtcars` (after `as_tibble()`) to collapse all non-`cyl` columns into a list-column named `data`, grouped by `cyl`. Save the result to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>     cyl data
#>   <dbl> <list>
#> 1     6 <tibble [7 x 10]>
#> 2     4 <tibble [11 x 10]>
#> 3     8 <tibble [14 x 10]>
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- as_tibble(mtcars) |>
  # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- as_tibble(mtcars) |>
  nest(data = -cyl)

ex_1_1
#> # A tibble: 3 x 2
#>     cyl data
#>   <dbl> <list>
#> 1     6 <tibble [7 x 10]>
#> 2     4 <tibble [11 x 10]>
#> 3     8 <tibble [14 x 10]>
```

**Explanation:** Modern `nest()` uses tidy-select inside `data = ...` to decide which columns get bundled. `data = -cyl` means "everything except cyl goes into the list-column called data," which is the cleanest grouping idiom. The older form `group_by(cyl) |> nest()` also works but leaves a grouped tibble that can surprise downstream verbs.

</details>

### Exercise 1.2: Nest mpg by manufacturer and class

**Task:** The fleet-pricing team wants one row per `manufacturer`-`class` combination in `ggplot2::mpg`, with all remaining columns rolled up so they can attach a metadata blob later. Nest `mpg` with `data = -c(manufacturer, class)` and add a column `n` containing each nest's row count. Save the result to `ex_1_2`.

**Expected result:**

```
#> # A tibble: 32 x 4
#>    manufacturer class      data                  n
#>    <chr>        <chr>      <list>            <int>
#> 1  audi         compact    <tibble [15 x 9]>    15
#> 2  audi         midsize    <tibble [3 x 9]>      3
#> 3  chevrolet    2seater    <tibble [5 x 9]>      5
#> 4  chevrolet    midsize    <tibble [5 x 9]>      5
#> 5  chevrolet    suv        <tibble [9 x 9]>      9
#> ...
#> # 27 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- mpg |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mpg |>
  nest(data = -c(manufacturer, class)) |>
  mutate(n = map_int(data, nrow))

ex_1_2
#> # A tibble: 32 x 4
#>    manufacturer class      data                  n
#>    <chr>        <chr>      <list>            <int>
#> 1  audi         compact    <tibble [15 x 9]>    15
#> 2  audi         midsize    <tibble [3 x 9]>      3
#> ...
```

**Explanation:** `map_int(data, nrow)` is type-stable: it forces an integer return per element, so you get a plain `<int>` column instead of a list. Computing row counts after nesting is a common debugging step, since a stray nesting key can leave you with one-row nests that hint at a join problem upstream. `count(manufacturer, class)` would give the same `n` but without the bundled data.

</details>

### Exercise 1.3: Nest ChickWeight twice for a hierarchical structure

**Task:** A growth-curve study tracks individual chicks within diets. Build a two-level nest from `ChickWeight`: first nest by `Diet` to get one row per diet with a list-column of all chicks, then add a second list-column called `by_chick` where each Diet's data is further nested by `Chick`. Save the result to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 4 x 3
#>   Diet  data               by_chick
#>   <fct> <list>             <list>
#> 1 1     <tibble [220 x 3]> <tibble [20 x 2]>
#> 2 2     <tibble [120 x 3]> <tibble [10 x 2]>
#> 3 3     <tibble [120 x 3]> <tibble [10 x 2]>
#> 4 4     <tibble [118 x 3]> <tibble [10 x 2]>
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- as_tibble(ChickWeight) |>
  # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- as_tibble(ChickWeight) |>
  nest(data = -Diet) |>
  mutate(by_chick = map(data, ~ nest(.x, chick_data = -Chick)))

ex_1_3
#> # A tibble: 4 x 3
#>   Diet  data               by_chick
#>   <fct> <list>             <list>
#> 1 1     <tibble [220 x 3]> <tibble [20 x 2]>
#> 2 2     <tibble [120 x 3]> <tibble [10 x 2]>
#> 3 3     <tibble [120 x 3]> <tibble [10 x 2]>
#> 4 4     <tibble [118 x 3]> <tibble [10 x 2]>
```

**Explanation:** Nesting inside a `map()` lets you build hierarchical structures cheaply: outer row per Diet, inner tibble per Chick. The lambda `~ nest(.x, chick_data = -Chick)` runs on each Diet's data subset. This pattern shows up whenever a downstream model wants the second-level groups available but not yet unrolled. Avoid `nest_by()` here because chaining a second `nest_by()` inside a rowwise frame is awkward.

</details>

## Section 2. Unnesting list-columns (3 problems)

### Exercise 2.1: Reverse a nested tibble back to flat

**Task:** A teammate handed you the nested mtcars tibble from Exercise 1.1, but the next step of the pipeline needs a flat frame. Take `ex_1_1` and call `unnest()` on the `data` column so every original row is restored, with `cyl` preserved as a leading column. Save the result to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 32 x 11
#>     cyl   mpg  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1     6  21    160    110  3.9   2.62  16.5     0     1     4     4
#> 2     6  21    160    110  3.9   2.88  17.0     0     1     4     4
#> 3     4  22.8  108     93  3.85  2.32  18.6     1     1     4     1
#> ...
#> # 29 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- ex_1_1 |>
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ex_1_1 |>
  unnest(data)

ex_2_1
#> # A tibble: 32 x 11
#>     cyl   mpg  disp    hp  drat    wt  qsec    vs    am  gear  carb
#>   <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1     6  21    160    110  3.9   2.62  16.5     0     1     4     4
#> ...
```

**Explanation:** `unnest()` is the inverse of `nest()` when applied to a list-column of tibbles or data frames: rows of the inner frames are stacked, and outer columns (here `cyl`) are recycled along the way. If the inner frames have inconsistent columns, `unnest()` fills with `NA`. Note that round-tripping `nest()` then `unnest()` does not preserve row order unless the input was already sorted by the nesting key.

</details>

### Exercise 2.2: Spread a list-column of vectors into rows

**Task:** Suppose the survey backend dumped each respondent's tag answers as an R list of character vectors. Given the tibble below with one list-column `tags`, use `unnest_longer()` to produce one row per tag, preserving the `respondent_id`. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 7 x 2
#>   respondent_id tags
#>           <int> <chr>
#> 1             1 r
#> 2             1 sql
#> 3             2 python
#> 4             2 r
#> 5             2 julia
#> 6             3 sql
#> 7             3 r
```

**Difficulty:** Intermediate

```r title="Your turn"
survey <- tibble(
  respondent_id = 1:3,
  tags = list(c("r", "sql"), c("python", "r", "julia"), c("sql", "r"))
)

ex_2_2 <- survey |>
  # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
survey <- tibble(
  respondent_id = 1:3,
  tags = list(c("r", "sql"), c("python", "r", "julia"), c("sql", "r"))
)

ex_2_2 <- survey |>
  unnest_longer(tags)

ex_2_2
#> # A tibble: 7 x 2
#>   respondent_id tags
#>           <int> <chr>
#> 1             1 r
#> 2             1 sql
#> 3             2 python
#> 4             2 r
#> 5             2 julia
#> 6             3 sql
#> 7             3 r
```

**Explanation:** `unnest_longer()` puts each element of a list-column on its own row, recycling the outer columns. It is the right tool when the list elements are unnamed atomic vectors (here, tag strings). If you wanted the original positions, you would add `indices_include = TRUE` to materialize a `tags_id` integer column.

</details>

### Exercise 2.3: Flatten named lists into columns with unnest_wider

**Task:** An API response gives you one row per user, with each user's profile stored as a named R list (fields: `name`, `age`, `city`). Use `unnest_wider()` to lift those names into top-level columns alongside `user_id`. Save the result to `ex_2_3`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   user_id name    age city
#>     <int> <chr> <int> <chr>
#> 1       1 Anna     34 Berlin
#> 2       2 Bilal    29 Lahore
#> 3       3 Chen     41 Taipei
```

**Difficulty:** Intermediate

```r title="Your turn"
users <- tibble(
  user_id = 1:3,
  profile = list(
    list(name = "Anna",  age = 34, city = "Berlin"),
    list(name = "Bilal", age = 29, city = "Lahore"),
    list(name = "Chen",  age = 41, city = "Taipei")
  )
)

ex_2_3 <- users |>
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
users <- tibble(
  user_id = 1:3,
  profile = list(
    list(name = "Anna",  age = 34, city = "Berlin"),
    list(name = "Bilal", age = 29, city = "Lahore"),
    list(name = "Chen",  age = 41, city = "Taipei")
  )
)

ex_2_3 <- users |>
  unnest_wider(profile)

ex_2_3
#> # A tibble: 3 x 4
#>   user_id name    age city
#>     <int> <chr> <int> <chr>
#> 1       1 Anna     34 Berlin
#> 2       2 Bilal    29 Lahore
#> 3       3 Chen     41 Taipei
```

**Explanation:** `unnest_wider()` lifts the names of each list element into column names, producing one row per outer row and one column per unique inner name. It is the standard first move when ingesting JSON via `jsonlite::fromJSON(..., simplifyVector = FALSE)`. If some users were missing a field, `unnest_wider()` fills `NA` for that column and does not error.

</details>

## Section 3. Mapping over list-columns (4 problems)

### Exercise 3.1: Compute mean mpg per cyl group on a nested frame

**Task:** Working on the nested mtcars from `ex_1_1`, compute the mean `mpg` for each cyl group by mapping `mean()` over the `data` list-column inside a `mutate()`. Return a new column `mean_mpg` of type double. Save the result to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>     cyl data               mean_mpg
#>   <dbl> <list>                <dbl>
#> 1     6 <tibble [7 x 10]>      19.7
#> 2     4 <tibble [11 x 10]>     26.7
#> 3     8 <tibble [14 x 10]>     15.1
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- ex_1_1 |>
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ex_1_1 |>
  mutate(mean_mpg = map_dbl(data, ~ mean(.x$mpg)))

ex_3_1
#> # A tibble: 3 x 3
#>     cyl data               mean_mpg
#>   <dbl> <list>                <dbl>
#> 1     6 <tibble [7 x 10]>      19.7
#> 2     4 <tibble [11 x 10]>     26.7
#> 3     8 <tibble [14 x 10]>     15.1
```

**Explanation:** Inside `map_dbl()`, `.x` is the inner tibble for each cyl group, so `.x$mpg` is a numeric vector you can hand to `mean()`. Use `map_dbl()` rather than plain `map()` because you know each call returns a single double: the type-stable variant catches surprises like an inner tibble with no rows (which would yield `NaN` rather than a list element). A non-list scalar return keeps the column easy to filter and arrange.

</details>

### Exercise 3.2: Fit a linear model per cyl group

**Task:** Continue from `ex_1_1` and fit a simple linear regression of `mpg ~ wt` separately for each cyl group. Store each fitted `lm` object in a new list-column called `model`. Save the result to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>     cyl data               model
#>   <dbl> <list>             <list>
#> 1     6 <tibble [7 x 10]>  <lm>
#> 2     4 <tibble [11 x 10]> <lm>
#> 3     8 <tibble [14 x 10]> <lm>
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- ex_1_1 |>
  # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ex_1_1 |>
  mutate(model = map(data, ~ lm(mpg ~ wt, data = .x)))

ex_3_2
#> # A tibble: 3 x 3
#>     cyl data               model
#>   <dbl> <list>             <list>
#> 1     6 <tibble [7 x 10]>  <lm>
#> 2     4 <tibble [11 x 10]> <lm>
#> 3     8 <tibble [14 x 10]> <lm>
```

**Explanation:** This is the kernel of the many-models pattern: one row per group, with a fitted model carried alongside its training data. Plain `map()` is the right choice because each call returns an `lm` object, not a scalar. Storing models in a list-column means you can extract coefficients, predict, or compute diagnostics later without re-fitting, and the table acts as a single auditable artifact instead of a scattered set of named objects.

</details>

### Exercise 3.3: Pull glance metrics from each model

**Task:** Use `broom::glance()` to extract a one-row summary (`r.squared`, `adj.r.squared`, `sigma`, etc.) for each model in `ex_3_2`, store as a list-column `glance`, then unnest those summaries to produce a flat per-cyl metrics table. Drop the `data` and `model` columns from the final output. Save the result to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 3 x 13
#>     cyl r.squared adj.r.squared sigma statistic p.value    df logLik   AIC
#>   <dbl>     <dbl>         <dbl> <dbl>     <dbl>   <dbl> <dbl>  <dbl> <dbl>
#> 1     6     0.465         0.357 1.17       4.34 0.0918      1  -9.83  25.7
#> 2     4     0.509         0.454 3.33       9.32 0.0137      1 -27.7   61.5
#> 3     8     0.423         0.375 2.02       8.80 0.0118      1 -28.7   63.4
#> # 4 more columns hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- ex_3_2 |>
  # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ex_3_2 |>
  mutate(glance = map(model, broom::glance)) |>
  select(cyl, glance) |>
  unnest(glance)

ex_3_3
#> # A tibble: 3 x 13
#>     cyl r.squared adj.r.squared sigma statistic p.value    df logLik   AIC
#>   <dbl>     <dbl>         <dbl> <dbl>     <dbl>   <dbl> <dbl>  <dbl> <dbl>
#> 1     6     0.465         0.357 1.17       4.34 0.0918      1  -9.83  25.7
#> 2     4     0.509         0.454 3.33       9.32 0.0137      1 -27.7   61.5
#> 3     8     0.423         0.375 2.02       8.80 0.0118      1 -28.7   63.4
```

**Explanation:** `broom::glance()` always returns a one-row tibble of model-level metrics, which makes it perfect to stash in a list-column and then unnest. Because every inner tibble has the same columns, the unnest produces a clean rectangular result. Compare this with `broom::tidy()`, which returns one row per coefficient (variable length), so unnesting widens the row count instead of just the column count.

</details>

### Exercise 3.4: Tidy coefficients into a long table

**Task:** Now use `broom::tidy()` on each `lm` in `ex_3_2` to recover its coefficient table (term, estimate, std.error, statistic, p.value), unnest it, and keep `cyl` alongside the coefficient rows so each row identifies its group. Save the result to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 6 x 6
#>     cyl term        estimate std.error statistic p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>   <dbl>
#> 1     6 (Intercept)    28.4     4.18        6.79  0.00105
#> 2     6 wt             -2.78    1.33       -2.08  0.0918
#> 3     4 (Intercept)    39.6     4.35        9.10  0.0000777
#> 4     4 wt             -5.65    1.85       -3.05  0.0137
#> 5     8 (Intercept)    23.9     3.01        7.94  0.00000405
#> 6     8 wt             -2.19    0.739      -2.97  0.0118
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- ex_3_2 |>
  # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- ex_3_2 |>
  mutate(coefs = map(model, broom::tidy)) |>
  select(cyl, coefs) |>
  unnest(coefs)

ex_3_4
#> # A tibble: 6 x 6
#>     cyl term        estimate std.error statistic p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>   <dbl>
#> 1     6 (Intercept)    28.4     4.18        6.79  0.00105
#> 2     6 wt             -2.78    1.33       -2.08  0.0918
#> ...
```

**Explanation:** `broom::tidy()` produces a coefficient-per-row tibble, so unnesting multiplies the row count by the number of terms in each model. Once you have this long table, downstream verbs are trivial: `filter(term == "wt")` isolates the slope, and a join against a labels table can attach human-readable names. Keep the result long; only pivot to wide for presentation.

</details>

## Section 4. The many-models workflow (4 problems)

### Exercise 4.1: Compare three specifications per group

**Task:** For each cyl group in the nested mtcars, fit three competing specs side by side: `mpg ~ wt`, `mpg ~ wt + hp`, and `mpg ~ wt * hp`. Lay them out as three list-columns named `m1`, `m2`, `m3` and compute the AIC of each into matching columns `aic1`, `aic2`, `aic3`. Save the result to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 3 x 8
#>     cyl data               m1     m2     m3       aic1  aic2  aic3
#>   <dbl> <list>             <list> <list> <list>  <dbl> <dbl> <dbl>
#> 1     6 <tibble [7 x 10]>  <lm>   <lm>   <lm>     25.7  27.4  28.1
#> 2     4 <tibble [11 x 10]> <lm>   <lm>   <lm>     61.5  61.7  63.5
#> 3     8 <tibble [14 x 10]> <lm>   <lm>   <lm>     63.4  56.4  56.9
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_1 <- ex_1_1 |>
  # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ex_1_1 |>
  mutate(
    m1 = map(data, ~ lm(mpg ~ wt, data = .x)),
    m2 = map(data, ~ lm(mpg ~ wt + hp, data = .x)),
    m3 = map(data, ~ lm(mpg ~ wt * hp, data = .x)),
    aic1 = map_dbl(m1, AIC),
    aic2 = map_dbl(m2, AIC),
    aic3 = map_dbl(m3, AIC)
  )

ex_4_1
#> # A tibble: 3 x 8
#>     cyl data               m1     m2     m3       aic1  aic2  aic3
#>   <dbl> <list>             <list> <list> <list>  <dbl> <dbl> <dbl>
#> 1     6 <tibble [7 x 10]>  <lm>   <lm>   <lm>     25.7  27.4  28.1
#> 2     4 <tibble [11 x 10]> <lm>   <lm>   <lm>     61.5  61.7  63.5
#> 3     8 <tibble [14 x 10]> <lm>   <lm>   <lm>     63.4  56.4  56.9
```

**Explanation:** This is the model-bake-off skeleton: keep the candidate models adjacent so you can compare diagnostics row-wise. For more than three specs, pivot to a longer layout with one row per (group, spec) and a single `model` list-column. Notice the 8-cylinder group prefers `m2` or `m3`, while small samples in cyl=6 leave AIC nearly tied: the worst single penalty is AIC pretending precision the data does not have.

</details>

### Exercise 4.2: Extract residuals with augment, then unnest

**Task:** For diagnostic plotting you need a flat tibble of per-row residuals tagged by their cyl group. Apply `broom::augment()` to each model in `ex_3_2`, unnest the result, and keep `cyl`, `mpg`, `wt`, `.fitted`, and `.resid`. Save the result to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 32 x 5
#>     cyl   mpg    wt .fitted  .resid
#>   <dbl> <dbl> <dbl>   <dbl>   <dbl>
#> 1     6  21    2.62    21.1 -0.137
#> 2     6  21    2.88    20.4  0.633
#> 3     6  21.4  3.21    19.5  1.93
#> 4     4  22.8  2.32    26.5 -3.74
#> 5     4  24.4  3.19    21.6  2.84
#> ...
#> # 27 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- ex_3_2 |>
  # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ex_3_2 |>
  mutate(aug = map(model, broom::augment)) |>
  select(cyl, aug) |>
  unnest(aug) |>
  select(cyl, mpg, wt, .fitted, .resid)

ex_4_2
#> # A tibble: 32 x 5
#>     cyl   mpg    wt .fitted  .resid
#>   <dbl> <dbl> <dbl>   <dbl>   <dbl>
#> 1     6  21    2.62    21.1 -0.137
#> ...
```

**Explanation:** `augment()` is the third leg of the broom trio: while `tidy()` returns coefficients and `glance()` returns model-level metrics, `augment()` returns one row per observation with fitted and residual columns added. Once unnested, the result is a clean long frame you can pass straight to `ggplot(aes(x = wt, y = .resid))` faceted by cyl. Using `select()` to drop `data` and `model` keeps the final tibble compact.

</details>

### Exercise 4.3: Predict at new data points per group

**Task:** A planner wants predicted mpg at three reference weights (`wt = 2.5, 3.0, 3.5`) for each cyl group. For every model in `ex_3_2`, predict at those new weights and unnest the result so each row holds `cyl`, `wt`, and a `.pred` column. Save the result to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 9 x 3
#>     cyl    wt .pred
#>   <dbl> <dbl> <dbl>
#> 1     6   2.5  21.5
#> 2     6   3    20.1
#> 3     6   3.5  18.7
#> 4     4   2.5  25.5
#> 5     4   3    22.7
#> 6     4   3.5  19.9
#> 7     8   2.5  18.4
#> 8     8   3    17.3
#> 9     8   3.5  16.2
```

**Difficulty:** Advanced

```r title="Your turn"
ref_grid <- tibble(wt = c(2.5, 3.0, 3.5))

ex_4_3 <- ex_3_2 |>
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ref_grid <- tibble(wt = c(2.5, 3.0, 3.5))

ex_4_3 <- ex_3_2 |>
  mutate(pred = map(model, ~ tibble(wt = ref_grid$wt,
                                    .pred = predict(.x, newdata = ref_grid)))) |>
  select(cyl, pred) |>
  unnest(pred)

ex_4_3
#> # A tibble: 9 x 3
#>     cyl    wt .pred
#>   <dbl> <dbl> <dbl>
#> 1     6   2.5  21.5
#> 2     6   3    20.1
#> 3     6   3.5  18.7
#> ...
```

**Explanation:** Wrapping the prediction call in `tibble(wt = ..., .pred = predict(...))` is the trick that keeps the new x-values aligned with their predictions when you unnest. If you returned just the prediction vector and tried to recycle `ref_grid$wt` later, sorting or duplicate-handling in `unnest()` could silently misalign rows. Always carry your reference grid through the same map step that produces the prediction.

</details>

### Exercise 4.4: Build an AIC leaderboard

**Task:** Reshape `ex_4_1` into a long leaderboard with one row per (cyl, spec) combination, columns `cyl`, `spec` (values `"m1"`, `"m2"`, `"m3"`), and `aic`. Sort within each cyl by `aic` ascending. Save the result to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 9 x 3
#>     cyl spec    aic
#>   <dbl> <chr> <dbl>
#> 1     6 m1     25.7
#> 2     6 m2     27.4
#> 3     6 m3     28.1
#> 4     4 m1     61.5
#> 5     4 m2     61.7
#> 6     4 m3     63.5
#> 7     8 m2     56.4
#> 8     8 m3     56.9
#> 9     8 m1     63.4
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- ex_4_1 |>
  # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- ex_4_1 |>
  select(cyl, aic1, aic2, aic3) |>
  pivot_longer(starts_with("aic"),
               names_to = "spec", values_to = "aic",
               names_prefix = "aic") |>
  mutate(spec = paste0("m", spec)) |>
  group_by(cyl) |>
  arrange(aic, .by_group = TRUE) |>
  ungroup()

ex_4_4
#> # A tibble: 9 x 3
#>     cyl spec    aic
#>   <dbl> <chr> <dbl>
#> 1     6 m1     25.7
#> 2     6 m2     27.4
#> ...
```

**Explanation:** Even when models live in list-columns, summary metrics are scalars that benefit from being pivoted long. `names_prefix = "aic"` strips the prefix so the surviving values are `1`, `2`, `3`, which you then re-prefix with `"m"` for readability. `arrange(aic, .by_group = TRUE)` sorts within each cyl group so the leaderboard reads top-down by group.

</details>

## Section 5. JSON-shaped data and deep records (2 problems)

### Exercise 5.1: Lift API records into a flat tibble

**Task:** You receive three sales records from an API as a list of named lists, with fields `order_id`, `customer`, `amount`, and `currency`. Wrap them in a tibble column `record`, then use `unnest_wider()` to lift the fields out. Save the result to `ex_5_1`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   order_id customer amount currency
#>      <int> <chr>     <dbl> <chr>
#> 1     1001 Anna       42.5 EUR
#> 2     1002 Bilal     180.  PKR
#> 3     1003 Chen       95   TWD
```

**Difficulty:** Intermediate

```r title="Your turn"
api_rows <- tibble(
  record = list(
    list(order_id = 1001L, customer = "Anna",  amount = 42.5,  currency = "EUR"),
    list(order_id = 1002L, customer = "Bilal", amount = 180.0, currency = "PKR"),
    list(order_id = 1003L, customer = "Chen",  amount = 95.0,  currency = "TWD")
  )
)

ex_5_1 <- api_rows |>
  # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
api_rows <- tibble(
  record = list(
    list(order_id = 1001L, customer = "Anna",  amount = 42.5,  currency = "EUR"),
    list(order_id = 1002L, customer = "Bilal", amount = 180.0, currency = "PKR"),
    list(order_id = 1003L, customer = "Chen",  amount = 95.0,  currency = "TWD")
  )
)

ex_5_1 <- api_rows |>
  unnest_wider(record)

ex_5_1
#> # A tibble: 3 x 4
#>   order_id customer amount currency
#>      <int> <chr>     <dbl> <chr>
#> 1     1001 Anna       42.5 EUR
#> 2     1002 Bilal     180.  PKR
#> 3     1003 Chen       95   TWD
```

**Explanation:** This is the canonical first step after parsing JSON: one outer row per record, all fields lifted to named columns. `unnest_wider()` inspects the names inside each list to decide the output columns. If some records had extra fields the others did not, those columns would appear with `NA` for the missing rows. For deeply nested fields, chain a second `unnest_wider()` or use `hoist()` (next exercise).

</details>

### Exercise 5.2: Hoist deep fields out of a nested record

**Task:** The same API now returns a `meta` sub-list containing `region` and `vat_rate` inside each record. Use `hoist()` to extract just those two fields directly into top-level columns, leaving the rest of `record` intact in a residual list-column. Save the result to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   region vat_rate record
#>   <chr>     <dbl> <list>
#> 1 EU         0.19 <named list [3]>
#> 2 SA         0.17 <named list [3]>
#> 3 APAC       0.05 <named list [3]>
```

**Difficulty:** Advanced

```r title="Your turn"
api_rows2 <- tibble(
  record = list(
    list(order_id = 1001L, customer = "Anna",  meta = list(region = "EU",   vat_rate = 0.19)),
    list(order_id = 1002L, customer = "Bilal", meta = list(region = "SA",   vat_rate = 0.17)),
    list(order_id = 1003L, customer = "Chen",  meta = list(region = "APAC", vat_rate = 0.05))
  )
)

ex_5_2 <- api_rows2 |>
  # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
api_rows2 <- tibble(
  record = list(
    list(order_id = 1001L, customer = "Anna",  meta = list(region = "EU",   vat_rate = 0.19)),
    list(order_id = 1002L, customer = "Bilal", meta = list(region = "SA",   vat_rate = 0.17)),
    list(order_id = 1003L, customer = "Chen",  meta = list(region = "APAC", vat_rate = 0.05))
  )
)

ex_5_2 <- api_rows2 |>
  hoist(record,
        region   = c("meta", "region"),
        vat_rate = c("meta", "vat_rate"))

ex_5_2
#> # A tibble: 3 x 3
#>   region vat_rate record
#>   <chr>     <dbl> <list>
#> 1 EU         0.19 <named list [3]>
#> 2 SA         0.17 <named list [3]>
#> 3 APAC       0.05 <named list [3]>
```

**Explanation:** `hoist()` uses purrr-style index paths (here `c("meta", "region")`) to dive into a nested list and pluck specific fields into named columns. Unlike `unnest_wider()`, it does not flatten everything: untargeted fields remain inside the original list-column, which is ideal when records have dozens of fields and you only want two or three. The plucked elements are removed from the residual list, so subsequent hoists never see them twice.

</details>

## Section 6. Reshaping rows in nests (2 problems)

### Exercise 6.1: Collapse rows into vector list-columns with chop

**Task:** A reporting tibble lists every order line individually, but the audit dashboard wants one row per `customer_id` with `order_amount` and `order_date` collapsed into list-columns of vectors (not nested tibbles). Use `chop()` to do that, preserving order. Save the result to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   customer_id order_amount order_date
#>   <chr>       <list>       <list>
#> 1 A           <dbl [3]>    <chr [3]>
#> 2 B           <dbl [2]>    <chr [2]>
#> 3 C           <dbl [1]>    <chr [1]>
```

**Difficulty:** Intermediate

```r title="Your turn"
orders <- tibble(
  customer_id  = c("A","A","A","B","B","C"),
  order_amount = c(20, 35, 50, 12, 8, 99),
  order_date   = c("2026-01-02","2026-01-15","2026-02-03",
                   "2026-01-08","2026-02-20","2026-03-12")
)

ex_6_1 <- orders |>
  # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
orders <- tibble(
  customer_id  = c("A","A","A","B","B","C"),
  order_amount = c(20, 35, 50, 12, 8, 99),
  order_date   = c("2026-01-02","2026-01-15","2026-02-03",
                   "2026-01-08","2026-02-20","2026-03-12")
)

ex_6_1 <- orders |>
  chop(c(order_amount, order_date))

ex_6_1
#> # A tibble: 3 x 3
#>   customer_id order_amount order_date
#>   <chr>       <list>       <list>
#> 1 A           <dbl [3]>    <chr [3]>
#> 2 B           <dbl [2]>    <chr [2]>
#> 3 C           <dbl [1]>    <chr [1]>
```

**Explanation:** `chop()` is the lightweight sibling of `nest()`: it produces list-columns of atomic vectors instead of list-columns of tibbles, which is cheaper in memory and faster to round-trip. `unchop()` reverses it. Prefer `chop()` when each "nest" only needs to hold a handful of parallel vectors and you do not need a tibble per group; prefer `nest()` when you want the inner blob to behave like a self-contained data frame (for example, passed to `lm()`).

</details>

### Exercise 6.2: Use nest_by to skip group_by plumbing

**Task:** Repeat the cyl-grouped lm fit from Exercise 3.2 using `nest_by()` instead of `nest()` plus `mutate(map(...))`. The result should be a rowwise tibble with columns `cyl`, `data` (nested tibble), and `model` (an `lm` fit). Save the result to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 3
#> # Rowwise:  cyl
#>     cyl data                model
#>   <dbl> <list>              <list>
#> 1     4 <tibble [11 x 10]>  <lm>
#> 2     6 <tibble [7 x 10]>   <lm>
#> 3     8 <tibble [14 x 10]>  <lm>
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_2 <- as_tibble(mtcars) |>
  # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- as_tibble(mtcars) |>
  nest_by(cyl) |>
  mutate(model = list(lm(mpg ~ wt, data = data)))

ex_6_2
#> # A tibble: 3 x 3
#> # Rowwise:  cyl
#>     cyl data                model
#>   <dbl> <list>              <list>
#> 1     4 <tibble [11 x 10]>  <lm>
#> 2     6 <tibble [7 x 10]>   <lm>
#> 3     8 <tibble [14 x 10]>  <lm>
```

**Explanation:** `nest_by()` returns a rowwise tibble in which the nested column is named `data` by default and each subsequent `mutate()` is evaluated one row at a time. That removes the explicit `map()` in the mutate (you just wrap the result in `list(...)` because each row produces one `lm`). It is a cleaner fit when every step you want to do downstream is per-row anyway. For more flexible workflows that mix scalar and rowwise steps, stick with `nest()` plus `map()`.

</details>

## What to do next

Now that nest/unnest and the many-models pattern are second nature, deepen your tidyr toolkit and apply it to wider modeling workflows:

- [tidyr Pivot Exercises in R](tidyr-Pivot-Exercises-in-R.html) for `pivot_longer` and `pivot_wider` drills.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) for `mutate`, `summarise`, and join practice that powers list-column workflows.
- [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html) for the base-R analogue of map across list-columns.
- [Linear Regression in R](Linear-Regression.html) for the modeling background behind the many-models examples.
