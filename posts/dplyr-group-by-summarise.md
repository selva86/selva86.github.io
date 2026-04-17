---
title: "dplyr group_by() + summarise(): The Combination That Answers Most Business Questions"
slug: "dplyr-group-by-summarise"
description: "Master dplyr group_by() and summarise() to aggregate data by group in R. Learn n(), mean(), .by, multi-group rollups with 10 real-world examples."
keywords: "dplyr group_by, dplyr summarise, R aggregate by group, split-apply-combine R, dplyr summarize, group_by summarise, R data aggregation, tidyverse group summary"
auto_link_terms: "dplyr group_by|dplyr summarise|group_by()|summarise()|group by in R|aggregate by group in R|split-apply-combine"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.2.5"
post_type: C
sidebar_section: "Data Wrangling"
sidebar_title: "dplyr group_by & summarise"
sidebar_order: 5
difficulty: "Intermediate"
---

# dplyr group_by() + summarise(): The Combination That Answers Most Business Questions

<p class="lead">In dplyr, <code>group_by()</code> splits your data into groups and <code>summarise()</code> collapses each group into a single row of aggregated values. Together they answer almost every "what's the average X by Y?" question, the single most common pattern in day-to-day data analysis.</p>

## What does group_by() + summarise() actually do?

Most analytical questions sound the same: *what's the average by category?* *which segment spends the most?* *how many orders per month?* Every one of them follows one pattern, split rows into groups, apply a function, combine the results into a tidy table. `group_by()` marks the split and `summarise()` does the apply-and-combine in one step. Here's the payoff on the built-in `mtcars` dataset, answering "what's the average fuel economy by cylinder count?":

```r title="groupby with summarise basics"
library(dplyr)

mpg_by_cyl <- mtcars |>
  group_by(cyl) |>
  summarise(
    avg_mpg = mean(mpg),
    n_cars  = n()
  )

mpg_by_cyl
#> # A tibble: 3 × 3
#>     cyl avg_mpg n_cars
#>   <dbl>   <dbl>  <int>
#> 1     4    26.7     11
#> 2     6    19.7      7
#> 3     8    15.1     14
```

The 32-row `mtcars` table collapsed into 3 rows, one per unique value of `cyl`. For each group, `mean(mpg)` was computed over just the rows in that group, and `n()` counted them. Four-cylinder cars average 26.7 mpg while eight-cylinder cars manage only 15.1, exactly the kind of answer a business analyst needs in one line of code. That's the whole pattern: one verb to split, one verb to apply-and-combine.

![Split-apply-combine with group_by() + summarise()](screenshots/dplyr-group-by-summarise-split-apply-combine.webp)
*Figure 1: The split-apply-combine pattern that group_by() + summarise() implements.*

[KEY INSIGHT]
**Think of group_by() as placing invisible dividers between rows.** The rows themselves don't move, dplyr just marks which rows belong to which group. The real work happens in summarise(), which runs your functions once per marker boundary and stacks the results.

**Try it:** Use `group_by()` and `summarise()` on the built-in `iris` dataset to find the mean `Sepal.Length` for each species. Save the result to `ex_iris_stats`.

```r title="Exercise: Mean sepal by species"
# Try it: mean Sepal.Length by Species
ex_iris_stats <- iris |>
  group_by(Species) |>
  summarise(
    # your code here
  )

ex_iris_stats
#> Expected:
#> # A tibble: 3 × 2
#>   Species    avg_sepal
#>   <fct>          <dbl>
#> 1 setosa          5.01
#> 2 versicolor      5.94
#> 3 virginica       6.59
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sepal length solution"
ex_iris_stats <- iris |>
  group_by(Species) |>
  summarise(avg_sepal = mean(Sepal.Length))
ex_iris_stats
#> # A tibble: 3 × 2
#>   Species    avg_sepal
#>   <fct>          <dbl>
#> 1 setosa          5.01
#> 2 versicolor      5.94
#> 3 virginica       6.59
```

**Explanation:** Inside `summarise()`, any function that returns one value per group works. `mean(Sepal.Length)` runs once per species, producing three rows.

</details>

## How do you summarise multiple columns at once?

A real business question is rarely "just the average." You usually want the mean, the spread, the count, and the extremes, all in the same table so you can compare segments at a glance. `summarise()` happily takes as many `name = function(col)` expressions as you hand it, separated by commas, and each becomes a new column in the result.

```r title="Multiple summary columns at once"
mtcars_stats <- mtcars |>
  group_by(cyl) |>
  summarise(
    n_cars  = n(),
    avg_mpg = mean(mpg),
    sd_mpg  = sd(mpg),
    min_mpg = min(mpg),
    max_mpg = max(mpg)
  )

mtcars_stats
#> # A tibble: 3 × 6
#>     cyl n_cars avg_mpg sd_mpg min_mpg max_mpg
#>   <dbl>  <int>   <dbl>  <dbl>   <dbl>   <dbl>
#> 1     4     11    26.7   4.51    21.4    33.9
#> 2     6      7    19.7   1.45    17.8    21.4
#> 3     8     14    15.1   2.56    10.4    19.2
```

Five summary columns in one pass. Notice how `n()` is a special helper, it doesn't take a column name because it simply counts rows in the current group. The standard deviation column reveals something the mean alone hides: six-cylinder cars cluster tightly (sd = 1.45), while four-cylinder cars are all over the map (sd = 4.51). That's a story a mean-only table would completely bury.

[TIP]
**Name summary columns by what they contain, not by how you computed them.** Prefer `avg_mpg` to `mean_mpg_value` and `n_orders` to `count_of_orders`. Short, business-friendly names keep downstream filter() and arrange() calls readable.

**Try it:** Extend the mtcars summary above to also include `median_mpg` and `mpg_range` (max minus min). Save to `ex_mtcars_stats`.

```r title="Exercise: Add median and range"
# Try it: add median and range
ex_mtcars_stats <- mtcars |>
  group_by(cyl) |>
  summarise(
    avg_mpg    = mean(mpg),
    # your code here
  )

ex_mtcars_stats
#> Expected: 3 rows × 4 columns (cyl, avg_mpg, median_mpg, mpg_range)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Median and range solution"
ex_mtcars_stats <- mtcars |>
  group_by(cyl) |>
  summarise(
    avg_mpg    = mean(mpg),
    median_mpg = median(mpg),
    mpg_range  = max(mpg) - min(mpg)
  )
ex_mtcars_stats
#> # A tibble: 3 × 4
#>     cyl avg_mpg median_mpg mpg_range
#>   <dbl>   <dbl>      <dbl>     <dbl>
#> 1     4    26.7       26        12.5
#> 2     6    19.7       19.7       3.6
#> 3     8    15.1       15.2       8.8
```

**Explanation:** Any R expression returning length 1 per group works, including arithmetic on other summaries like `max(mpg) - min(mpg)`.

</details>

## How do you group by more than one variable?

Business questions often nest: *average mpg by cylinder count and transmission type*, *monthly revenue by region and product*. Pass multiple columns to `group_by()` and dplyr creates one group for every unique combination. The result table then has one row per combination.

```r title="Group by two variables"
cyl_gear_stats <- mtcars |>
  group_by(cyl, gear) |>
  summarise(
    n_cars  = n(),
    avg_mpg = mean(mpg),
    .groups = "drop"
  )

cyl_gear_stats
#> # A tibble: 8 × 4
#>     cyl  gear n_cars avg_mpg
#>   <dbl> <dbl>  <int>   <dbl>
#> 1     4     3      1    21.5
#> 2     4     4      8    26.9
#> 3     4     5      2    28.2
#> 4     6     3      2    19.8
#> 5     6     4      4    19.8
#> 6     6     5      1    19.7
#> 7     8     3     12    15.0
#> 8     8     5      2    15.4
```

Three cylinder counts times up-to-three gear counts gives eight populated combinations (not nine, no eight-cylinder car in `mtcars` has four gears). The `.groups = "drop"` line at the end removes all grouping from the result, which you almost always want. The next section explains why.

**Try it:** In the built-in `starwars` dataset, count how many characters exist for each combination of `species` and `sex`. Save the result to `ex_sw_counts` with column name `n_chars`.

```r title="Exercise: Count species and sex"
# Try it: count by species × sex
ex_sw_counts <- starwars |>
  group_by(species, sex) |>
  summarise(
    # your code here
    .groups = "drop"
  )

head(ex_sw_counts, 4)
#> Expected: 4 rows with columns species, sex, n_chars
```

<details>
<summary>Click to reveal solution</summary>

```r title="Species and sex solution"
ex_sw_counts <- starwars |>
  group_by(species, sex) |>
  summarise(n_chars = n(), .groups = "drop")
head(ex_sw_counts, 4)
#> # A tibble: 4 × 3
#>   species  sex    n_chars
#>   <chr>    <chr>    <int>
#> 1 Aleena   male         1
#> 2 Besalisk male         1
#> 3 Cerean   male         1
#> 4 Chagrian male         1
```

**Explanation:** `n()` needs no arguments, it always counts rows in the current group, which after a two-variable `group_by()` means rows sharing both values.

</details>

## Which summary functions work inside summarise()?

`summarise()` accepts any R function, as long as that function returns a single value when given a vector. That rule is simple but important: `mean(x)` returns one number, so it works. `range(x)` returns two numbers, so it doesn't (you'd need `min(x)` and `max(x)` separately). Here are the functions you'll use 90% of the time:

| Function | What it returns | Example use |
|---|---|---|
| `mean(x)` | Arithmetic mean | Average order value |
| `median(x)` | Median | Typical salary, robust to outliers |
| `sd(x)`, `var(x)` | Spread | Volatility, consistency |
| `min(x)`, `max(x)` | Extremes | Fastest/slowest, cheapest/priciest |
| `n()` | Row count in current group | Number of orders per customer |
| `n_distinct(x)` | Unique value count | Distinct products bought per customer |
| `sum(x)` | Total | Total revenue per region |
| `first(x)`, `last(x)` | First/last value | Opening price, closing price |
| `quantile(x, 0.9)` | 90th percentile | SLA thresholds |

Here's `n_distinct()` in action, a question prose can barely ask concisely: *how many unique hair colors does each species in Star Wars have?*

```r title="Count distinct values per group"
sw_stats <- starwars |>
  filter(!is.na(hair_color)) |>
  group_by(species) |>
  summarise(
    n_chars       = n(),
    distinct_hair = n_distinct(hair_color)
  ) |>
  arrange(desc(distinct_hair))

head(sw_stats, 5)
#> # A tibble: 5 × 3
#>   species  n_chars distinct_hair
#>   <chr>      <int>         <int>
#> 1 Human         31             6
#> 2 Wookiee        2             2
#> 3 Droid          4             1
#> 4 Twi'lek        2             1
#> 5 Gungan         3             1
```

Humans come out on top with six distinct hair colors across 31 characters; most other species have just one. The `filter()` before `group_by()` drops rows where `hair_color` is missing so they don't inflate our distinct counts with `NA`. Chaining `arrange(desc())` at the end produces an immediately readable leaderboard.

**Try it:** Count the distinct `eye_color` values per `species` in `starwars`. Keep only species with 2 or more characters. Save to `ex_hair_counts`.

```r title="Exercise: Distinct eye colors"
# Try it: n_distinct eye_color by species
ex_hair_counts <- starwars |>
  filter(!is.na(eye_color)) |>
  group_by(species) |>
  summarise(
    n_chars  = n(),
    # your code here
  ) |>
  filter(n_chars >= 2) |>
  arrange(desc(distinct_eye))

head(ex_hair_counts, 3)
#> Expected: top 3 species by distinct eye colors
```

<details>
<summary>Click to reveal solution</summary>

```r title="Distinct eye colors solution"
ex_hair_counts <- starwars |>
  filter(!is.na(eye_color)) |>
  group_by(species) |>
  summarise(
    n_chars      = n(),
    distinct_eye = n_distinct(eye_color)
  ) |>
  filter(n_chars >= 2) |>
  arrange(desc(distinct_eye))

head(ex_hair_counts, 3)
#> # A tibble: 3 × 3
#>   species n_chars distinct_eye
#>   <chr>     <int>        <int>
#> 1 Human        35           10
#> 2 Droid         5            3
#> 3 Gungan        3            2
```

**Explanation:** `n_distinct()` counts unique non-NA values by default, which is almost always what you want for a distinct count.

</details>

## What does the .groups argument do after summarise()?

Run a multi-variable `group_by()` followed by `summarise()` without `.groups` and dplyr prints this message:

```
`summarise()` has grouped output by 'cyl'. You can override using the `.groups` argument.
```

That message confuses almost every new user. Here's what it means: when you group by `cyl, gear` and then summarise, dplyr assumes you might want to run *another* summary step on the remaining grouping (`cyl`), so it keeps the result grouped by all-but-the-last variable. Each call to `summarise()` peels off the innermost grouping layer.

![Each summarise() call peels one grouping layer](screenshots/dplyr-group-by-summarise-groups-peeling.webp)
*Figure 2: Each summarise() call peels off one grouping layer. Use .groups = "drop" to stop peeling and return an ungrouped tibble.*

The four options for `.groups`:

| Value | Behavior |
|---|---|
| `"drop_last"` | Peel the last grouping variable (the default, shows the warning) |
| `"drop"` | Drop all grouping, return a plain ungrouped tibble |
| `"keep"` | Keep the full original grouping |
| `"rowwise"` | Treat each resulting row as its own group |

```r title="Drop grouping after summarise"
cyl_gear_dropped <- mtcars |>
  group_by(cyl, gear) |>
  summarise(avg_mpg = mean(mpg), .groups = "drop")

# Confirm: no grouping on result
group_vars(cyl_gear_dropped)
#> character(0)
```

`group_vars()` returns an empty character vector, confirming the result is fully ungrouped. That's the state you want 95% of the time, any further `mutate()` or `filter()` calls will act on the whole table instead of being silently group-aware.

[WARNING]
**Lingering groups cause silent bugs.** A `mutate(rank = row_number())` after an unintentionally grouped summarise will restart ranks at 1 inside each leftover group rather than numbering the whole table. Always finish with `.groups = "drop"` or `ungroup()` unless you specifically want grouped behavior downstream.

**Try it:** Group `mtcars` by `am` and `cyl`, summarise mean `hp`, and explicitly drop all grouping from the result. Save to `ex_drop_stats`.

```r title="Exercise: Drop groups explicitly"
# Try it: drop grouping explicitly
ex_drop_stats <- mtcars |>
  group_by(am, cyl) |>
  summarise(
    # your code here
  )

group_vars(ex_drop_stats)
#> Expected: character(0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop groups solution"
ex_drop_stats <- mtcars |>
  group_by(am, cyl) |>
  summarise(
    avg_hp = mean(hp),
    .groups = "drop"
  )

group_vars(ex_drop_stats)
#> character(0)
```

**Explanation:** Adding `.groups = "drop"` inside `summarise()` is cleaner than a separate `ungroup()` call at the end of the pipeline.

</details>

## When should you use the new .by argument instead?

dplyr 1.1.0 (released January 2023) introduced a simpler alternative for one-shot aggregations: the `.by` argument, available directly on `summarise()`, `mutate()`, and `filter()`. It groups inline for that single call and always returns an ungrouped result, sidestepping the `.groups` confusion entirely.

```r title="Inline grouping with .by"
# Old way — group_by() + .groups = "drop"
by_cyl_old <- mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = mean(mpg), .groups = "drop")

# New way — .by argument
by_cyl <- mtcars |>
  summarise(avg_mpg = mean(mpg), .by = cyl)

by_cyl
#> # A tibble: 3 × 2
#>     cyl avg_mpg
#>   <dbl>   <dbl>
#> 1     6    19.7
#> 2     4    26.7
#> 3     8    15.1
```

Same numbers, two fewer lines. For multiple grouping columns, wrap them in `c()`: `.by = c(cyl, gear)`. The `.by` form shines when grouping is a one-off and no downstream operations need the grouping to persist. When grouping *should* carry through several pipeline steps, keep using `group_by()`.

[NOTE]
**.by requires dplyr 1.1.0 or newer.** Check your version with `packageVersion("dplyr")`. On an older release, stick with `group_by()` + `.groups = "drop"`, it works identically.

**Try it:** Rewrite this `group_by()` call using `.by` instead. Save to `ex_by_rewrite`.

```r title="Exercise: Rewrite groupby with .by"
# Original:
# mtcars |> group_by(gear) |> summarise(avg_mpg = mean(mpg), .groups = "drop")

# Try it: rewrite with .by
ex_by_rewrite <- mtcars |>
  summarise(
    # your code here
  )

ex_by_rewrite
#> Expected: 3 rows, columns gear and avg_mpg
```

<details>
<summary>Click to reveal solution</summary>

```r title="by rewrite solution"
ex_by_rewrite <- mtcars |>
  summarise(avg_mpg = mean(mpg), .by = gear)

ex_by_rewrite
#> # A tibble: 3 × 2
#>    gear avg_mpg
#>   <dbl>   <dbl>
#> 1     4    24.5
#> 2     3    16.1
#> 3     5    21.4
```

**Explanation:** `.by = gear` replaces the whole `group_by() |> ... |> ungroup()` dance for a single summarise call.

</details>

## How do you filter groups after summarising?

A common workflow: compute a per-group summary, then keep only the groups meeting some criterion, "regions with revenue above target," "products with more than 100 orders," "customers who bought at least three distinct items." Because `summarise()` returns a fresh tibble with one row per group, you can pipe it straight into `filter()` and `arrange()`.

```r title="Filter groups after summarising"
top_cyl <- mtcars |>
  summarise(
    avg_mpg = mean(mpg),
    n_cars  = n(),
    .by = cyl
  ) |>
  filter(avg_mpg > 18) |>
  arrange(desc(avg_mpg))

top_cyl
#> # A tibble: 2 × 3
#>     cyl avg_mpg n_cars
#>   <dbl>   <dbl>  <int>
#> 1     4    26.7     11
#> 2     6    19.7      7
```

Two rows survive the `avg_mpg > 18` filter, and `arrange(desc(avg_mpg))` ranks them. This post-summarise filtering is how dplyr expresses SQL's `HAVING` clause, `filter()` before `group_by()` is `WHERE`, `filter()` after `summarise()` is `HAVING`. The mental model is the same in both worlds: filter rows, aggregate, then filter groups.

**Try it:** Find the top 2 `gear` groups in `mtcars` by mean `hp`. Use `.by`, then arrange and take the top 2. Save to `ex_top_gear`.

```r title="Exercise: Top 2 gears by hp"
# Try it: top 2 gears by mean hp
ex_top_gear <- mtcars |>
  summarise(
    # your code here
    .by = gear
  ) |>
  arrange(desc(avg_hp)) |>
  head(2)

ex_top_gear
#> Expected: 2 rows with gear and avg_hp columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top gears solution"
ex_top_gear <- mtcars |>
  summarise(avg_hp = mean(hp), .by = gear) |>
  arrange(desc(avg_hp)) |>
  head(2)

ex_top_gear
#> # A tibble: 2 × 2
#>    gear avg_hp
#>   <dbl>  <dbl>
#> 1     5  195.6
#> 2     3  176.1
```

**Explanation:** After summarise the result is a regular tibble, `arrange()` + `head(2)` gives the top-n rows by any column.

</details>

## Practice Exercises

These capstones combine several patterns from above. Use `my_*` prefixed variable names so exercise code doesn't clobber variables used earlier in the tutorial.

### Exercise 1: Homeworld leaderboard

In the `starwars` dataset, compute the mean `height` and character count for each `homeworld`. Drop rows with missing `homeworld` or `height`. Keep only homeworlds with 2 or more characters. Save the result sorted by `avg_height` descending to `my_homeworld`.

```r title="Exercise: Homeworld leaderboard"
# Exercise 1: homeworld leaderboard
# Hint: filter NA, group_by homeworld, summarise, filter n>=2, arrange

my_homeworld <- starwars |>
  # write your code
  arrange(desc(avg_height))

head(my_homeworld, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Homeworld leaderboard solution"
my_homeworld <- starwars |>
  filter(!is.na(homeworld), !is.na(height)) |>
  group_by(homeworld) |>
  summarise(
    n_chars    = n(),
    avg_height = mean(height),
    .groups    = "drop"
  ) |>
  filter(n_chars >= 2) |>
  arrange(desc(avg_height))

head(my_homeworld, 5)
#> # A tibble: 5 × 3
#>   homeworld n_chars avg_height
#>   <chr>       <int>      <dbl>
#> 1 Kamino          3      208.
#> 2 Kashyyyk        2      231
#> 3 Corellia        2      175
#> 4 Tatooine       10      170.
#> 5 Naboo          11      175.
```

**Explanation:** Two `filter()` calls play different roles, the first drops bad rows before grouping, the second drops small groups after summarising (SQL's `WHERE` vs `HAVING`).

</details>

### Exercise 2: Cylinder efficiency ranking

For each `cyl` value in `mtcars`, compute mean `mpg`, then add a `rank` column (1 = best mpg). Save to `my_mpg_rank`. The final result should have columns `cyl`, `avg_mpg`, and `rank`, sorted by rank.

```r title="Exercise: Rank cylinders by mpg"
# Exercise 2: rank cyl groups by mpg
# Hint: summarise with .by, then arrange and mutate a rank column

my_mpg_rank <- mtcars |>
  # write your code

my_mpg_rank
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cylinder rank solution"
my_mpg_rank <- mtcars |>
  summarise(avg_mpg = mean(mpg), .by = cyl) |>
  arrange(desc(avg_mpg)) |>
  mutate(rank = row_number())

my_mpg_rank
#> # A tibble: 3 × 3
#>     cyl avg_mpg  rank
#>   <dbl>   <dbl> <int>
#> 1     4    26.7     1
#> 2     6    19.7     2
#> 3     8    15.1     3
```

**Explanation:** Using `.by` keeps the result ungrouped, so `row_number()` numbers the whole table instead of restarting inside groups.

</details>

### Exercise 3: Diamond cut efficiency

In the `ggplot2::diamonds` dataset, for each `cut` level compute the median `price` and the median `price / carat` (a crude "price efficiency" metric). Sort the result so the cut with the highest median price-per-carat is at the top. Save to `my_cut_eff`.

```r title="Exercise: Diamonds price per carat"
# Exercise 3: diamonds price efficiency by cut
library(ggplot2)  # for diamonds

my_cut_eff <- diamonds |>
  # write your code

my_cut_eff
```

<details>
<summary>Click to reveal solution</summary>

```r title="Diamonds price solution"
library(ggplot2)

my_cut_eff <- diamonds |>
  summarise(
    median_price     = median(price),
    median_price_car = median(price / carat),
    .by = cut
  ) |>
  arrange(desc(median_price_car))

my_cut_eff
#> # A tibble: 5 × 3
#>   cut       median_price median_price_car
#>   <ord>            <dbl>            <dbl>
#> 1 Premium           3185            4453.
#> 2 Fair              3282            3823.
#> 3 Very Good         2648            3805.
#> 4 Good              3050            3757.
#> 5 Ideal             1810            3715.
#> # Premium cut has the highest median price-per-carat.
```

**Explanation:** Derived quantities (`price / carat`) can be computed directly inside `summarise()`, no need to `mutate()` first. Premium beats Ideal here because Premium diamonds tend to be larger on average.

</details>

## Complete Example

Here's a full end-to-end workflow on `starwars` that stitches every verb from this tutorial together: filter bad rows, group, compute several summaries, filter groups, sort. This is what 80% of real-world dplyr code looks like.

```r title="End-to-end species summary"
species_summary <- starwars |>
  filter(!is.na(mass), !is.na(height)) |>
  summarise(
    n_chars    = n(),
    avg_height = mean(height),
    avg_mass   = mean(mass),
    max_mass   = max(mass),
    .by = species
  ) |>
  filter(n_chars >= 2) |>
  arrange(desc(avg_mass))

head(species_summary, 5)
#> # A tibble: 5 × 5
#>   species  n_chars avg_height avg_mass max_mass
#>   <chr>      <int>      <dbl>    <dbl>    <dbl>
#> 1 Wookiee        2       231     124       124
#> 2 Gungan         2       235.     74        74
#> 3 Zabrak         2       173      80        80
#> 4 Twi'lek        2       179      55        55
#> 5 Human         22       177.     82.8     120
```

Every line corresponds to one question: *drop missing mass or height*, *for each species*, *count and summarise*, *keep species with at least 2 characters*, *sort by average mass*. That readability is the whole reason dplyr exists.

## Summary

| Concept | What to remember |
|---|---|
| `group_by(var)` | Marks invisible dividers between rows, no physical sorting or movement |
| `summarise(name = f(x))` | Collapses each group into one row; any length-1 function works |
| `n()` | Counts rows in the current group, no arguments needed |
| `n_distinct(x)` | Counts unique non-NA values per group |
| Multiple groupings | `group_by(a, b)` creates one group per unique combination |
| `.groups = "drop"` | Return an ungrouped tibble, almost always what you want |
| `.by` (dplyr 1.1+) | Inline grouping for one call; always returns ungrouped |
| Filter → Summarise → Filter | SQL's `WHERE` → `GROUP BY` → `HAVING` translated to dplyr |

## References

1. dplyr reference, `group_by()`. [Link](https://dplyr.tidyverse.org/reference/group_by.html)
2. dplyr reference, `summarise()`. [Link](https://dplyr.tidyverse.org/reference/summarise.html)
3. dplyr 1.1.0 release notes, introducing `.by`. [Link](https://www.tidyverse.org/blog/2023/02/dplyr-1-1-0-per-operation-grouping/)
4. Wickham, H., & Grolemund, G., *R for Data Science*, Chapter 4: Data Transformation. [Link](https://r4ds.hadley.nz/data-transform.html)
5. dplyr grouping vignette. [Link](https://dplyr.tidyverse.org/articles/grouping.html)
6. Wickham, H., "The Split-Apply-Combine Strategy for Data Analysis." *Journal of Statistical Software* 40(1), 2011. [Link](https://www.jstatsoft.org/article/view/v040i01)
7. Posit tidyverse blog, dplyr 1.0.0 summarise changes. [Link](https://www.tidyverse.org/blog/2020/03/dplyr-1-0-0-summarise/)

## Continue Learning

1. **[dplyr filter() and select()](dplyr-filter-select.html)**, Row and column subsetting, the verbs you reach for before group_by.
2. **[dplyr mutate() and rename()](dplyr-mutate-rename.html)**, Add computed columns; pairs naturally with summarise for feature engineering.
3. **[R Pipe Operator](R-Pipe-Operator.html)**, The `|>` and `%>%` operators that glue these pipelines together.
