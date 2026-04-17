---
title: "dplyr group_by() & summarise() Exercises: 10 Aggregation Problems, Solved Step-by-Step"
slug: "dplyr-group-by-summarise-Exercises"
description: "Practise dplyr group_by() & summarise() with 10 worked aggregation problems, counts, means, across(), NA handling, group shares, and per-group ranking."
keywords: "dplyr exercises, group_by exercises, summarise exercises, R aggregation practice, dplyr practice problems, tidyverse exercises, R data wrangling exercises, group by summarise R"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "E2.3"
post_type: "EX"
sidebar_title: "group_by & summarise (10 problems)"
auto_link_terms: "dplyr group_by exercises|dplyr summarise exercises|group_by practice problems|summarise practice problems|dplyr aggregation exercises"
auto_link_case_sensitive: false
fr_parent: "dplyr-group-by-summarise.html"
difficulty: "Intermediate"
---


# dplyr group_by() & summarise() Exercises: 10 Aggregation Problems

<p class="lead">Ten runnable, increasingly tricky aggregation problems built around <code>dplyr::group_by()</code> and <code>summarise()</code>, counts, multi-column groups, <code>across()</code>, <code>NA</code> handling, group shares, and per-group ranking. Each problem hides a fully worked solution behind a click-to-reveal so you can try first and verify after.</p>

## How do you count rows and take averages per group?

Counts and means are where almost every group-wise analysis starts. Before you touch missing values or per-group percentages, you need to be fluent at "split this data into groups, then collapse each group to a single number." The first three exercises drill exactly that, and the payoff block right below shows the shape of answer you are aiming at.

```r
# Load dplyr and aggregate mtcars: average mpg + row count per cylinder
library(dplyr)

mtcars |>
  group_by(cyl) |>
  summarise(
    n       = n(),
    avg_mpg = round(mean(mpg), 1),
    .groups = "drop"
  )
#> # A tibble: 3 × 3
#>     cyl     n avg_mpg
#>   <dbl> <int>   <dbl>
#> 1     4    11    26.7
#> 2     6     7    19.7
#> 3     8    14    15.1
```

Three lines of dplyr produce a clean three-row answer. `group_by(cyl)` splits the 32 rows of `mtcars` into three pieces, `n()` counts the rows inside each piece, and `mean(mpg)` averages the `mpg` column inside each piece. `.groups = "drop"` returns a plain ungrouped tibble so the result behaves predictably in any later step. This is the shape every exercise below builds on.

[TIP]
**Reach for count() first when you only need frequencies.** If your summary is just "how many rows per group", `count(df, group_col)` is shorter than the full `group_by() + summarise(n = n())` pipeline. As soon as you also need a mean or a sum, switch back to the full form.

### Exercise 1: Count cars per cylinder

Count how many cars in `mtcars` have 4, 6, and 8 cylinders. Save the result to `my_counts`. The output should have two columns: `cyl` and `n`.

```r
# Exercise 1: count rows per cyl group
# Hint: group_by(cyl) then summarise(n = n())

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_counts <- mtcars |>
  group_by(cyl) |>
  summarise(n = n(), .groups = "drop")

print(my_counts)
#> # A tibble: 3 × 2
#>     cyl     n
#>   <dbl> <int>
#> 1     4    11
#> 2     6     7
#> 3     8    14
```

**Explanation:** `group_by(cyl)` splits the data into three pieces, one per unique cylinder value. `n()` counts the rows inside each piece. `.groups = "drop"` removes the grouping after summarising, so `my_counts` is a plain tibble. Without it you would see a friendly message from dplyr explaining which groups remain.

</details>

### Exercise 2: Average mpg per cylinder

Compute the average `mpg` for each `cyl` group in `mtcars`. Round to one decimal. Save to `my_mpg`. The mean column should be named `avg_mpg`.

```r
# Exercise 2: mean mpg per cyl
# Hint: summarise(avg_mpg = round(mean(mpg), 1))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_mpg <- mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = round(mean(mpg), 1), .groups = "drop")

print(my_mpg)
#> # A tibble: 3 × 2
#>     cyl avg_mpg
#>   <dbl>   <dbl>
#> 1     4    26.7
#> 2     6    19.7
#> 3     8    15.1
```

**Explanation:** Four-cylinder cars average 26.7 mpg while eight-cylinder cars average 15.1 mpg, a 75 percent gap that mirrors what you would expect from engine size. `mean(mpg)` runs once per group because `group_by(cyl)` already split the rows. `round(..., 1)` formats the output. No `na.rm` needed here, `mtcars` has no missing values.

</details>

### Exercise 3: Use count() as a shortcut

Repeat the count idea from Exercise 1, but use `count()` instead of `group_by() + summarise(n = n())`. Count cars per `gear` value. Save to `my_gears`.

```r
# Exercise 3: use count() shortcut
# Hint: count(mtcars, gear) does the same thing in one call

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_gears <- mtcars |> count(gear)

print(my_gears)
#>   gear  n
#> 1    3 15
#> 2    4 12
#> 3    5  5
```

**Explanation:** `count()` is a one-line shortcut. It does the exact same thing as `group_by(gear) |> summarise(n = n(), .groups = "drop")`, but with less typing and no `.groups` argument to remember. Add `sort = TRUE` to order the result from largest group to smallest. Most dplyr users reach for `count()` whenever the question is purely "how many rows per group".

</details>

## How do you group by multiple columns and handle missing values?

The first three exercises stayed inside one grouping column and one clean dataset. Real data is messier than that. The next three add two complications at once: a second grouping column, and missing values that quietly poison every summary you write. Here is a quick look at the dataset that brings the missing values, the `starwars` tibble that ships with dplyr.

```r
# Preview the starwars dataset — note the NA values in height and mass
starwars |>
  select(name, height, mass, species, homeworld) |>
  head(5)
#> # A tibble: 5 × 5
#>   name           height  mass species homeworld
#>   <chr>           <int> <dbl> <chr>   <chr>
#> 1 Luke Skywalker    172    77 Human   Tatooine
#> 2 C-3PO             167    75 Droid   Tatooine
#> 3 R2-D2              96    32 Droid   Naboo
#> 4 Darth Vader       202   136 Human   Tatooine
#> 5 Leia Organa       150    49 Human   Alderaan
```

The first five rows look clean, but `starwars` has 87 rows and several columns contain `NA`. That is the point, you will use this dataset to practise the `na.rm = TRUE` argument in Exercise 6. Exercise 4 stays on `mtcars` and Exercise 5 jumps to `iris`.

### Exercise 4: Group by two columns

Group `mtcars` by both `cyl` and `am` (automatic = 0, manual = 1). Compute the count and mean mpg per combination. Save to `my_combo`. Use `.groups = "drop"` to return a plain tibble.

```r
# Exercise 4: group by two columns
# Hint: group_by(cyl, am) then summarise with n() and mean()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_combo <- mtcars |>
  group_by(cyl, am) |>
  summarise(
    n       = n(),
    avg_mpg = round(mean(mpg), 1),
    .groups = "drop"
  )

print(my_combo)
#> # A tibble: 6 × 4
#>     cyl    am     n avg_mpg
#>   <dbl> <dbl> <int>   <dbl>
#> 1     4     0     3    22.9
#> 2     4     1     8    28.1
#> 3     6     0     4    19.1
#> 4     6     1     3    20.6
#> 5     8     0    12    15.0
#> 6     8     1     2    15.4
```

**Explanation:** `group_by(cyl, am)` creates one group for every unique `(cyl, am)` combination present in the data, six groups in total. Manual four-cylinder cars average 28.1 mpg; automatic eight-cylinder cars average 15.0. The grouping order matters for the row order of the output, not for the values themselves.

</details>

### Exercise 5: Summarise many columns with across()

Use the `iris` dataset. Group by `Species` and compute the mean of every numeric column in one call. Save to `my_iris`. The result should have five columns: `Species` plus the four numeric means.

```r
# Exercise 5: summarise all numeric columns per species
# Hint: summarise(across(where(is.numeric), mean))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_iris <- iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric), mean), .groups = "drop")

print(my_iris)
#> # A tibble: 3 × 5
#>   Species    Sepal.Length Sepal.Width Petal.Length Petal.Width
#>   <fct>             <dbl>       <dbl>        <dbl>       <dbl>
#> 1 setosa             5.01        3.43         1.46       0.246
#> 2 versicolor         5.94        2.77         4.26       1.33
#> 3 virginica          6.59        2.97         5.55       2.03
```

**Explanation:** `across(where(is.numeric), mean)` says: for every column that is numeric, apply `mean()`. This is the modern replacement for the old `summarise_if()` and `summarise_at()` helpers. If you needed two summaries per column instead of one, pass a named list: `across(where(is.numeric), list(mean = mean, sd = sd))`.

</details>

[KEY INSIGHT]
**across() scales with your data, not your typing.** Hand-writing `summarise(mean_a = mean(a), mean_b = mean(b), mean_c = mean(c), ...)` breaks the moment you have twenty columns. With `across()` the same line of code works for four columns or four hundred, the data shape changes, the code does not.

### Exercise 6: Handle NA values with starwars

Use `starwars`. Group by `species` and compute mean `height` and mean `mass`. Drop any `NA` inputs from the means. Save to `my_species`. Sort the result by `mean_height` descending and keep only the top 5 rows.

```r
# Exercise 6: mean height and mass per species, NA-safe
# Hint: mean(x, na.rm = TRUE); then arrange(desc(mean_height)) and head(5)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_species <- starwars |>
  group_by(species) |>
  summarise(
    mean_height = mean(height, na.rm = TRUE),
    mean_mass   = mean(mass,   na.rm = TRUE),
    .groups     = "drop"
  ) |>
  arrange(desc(mean_height)) |>
  head(5)

print(my_species)
#> # A tibble: 5 × 3
#>   species    mean_height mean_mass
#>   <chr>            <dbl>     <dbl>
#> 1 Quermian           264       NaN
#> 2 Wookiee            231       124
#> 3 Kaminoan           221        88
#> 4 Kaleesh            216       159
#> 5 Yarael Poof         NA       NaN
```

**Explanation:** `na.rm = TRUE` tells `mean()` to ignore missing values before averaging. Without it, any group containing one `NA` would return `NA` for the whole group. Notice the `NaN` in `mean_mass` for Quermian, that group had zero non-`NA` mass values, so the mean of an empty set is undefined. Real-world analysis almost always needs `na.rm = TRUE`.

</details>

[WARNING]
**Forgetting na.rm silently poisons every group with missing data.** The pipeline still runs, the output still prints, and you still get a tibble, it is just full of `NA` values you did not expect. Always run `summary(your_data)` first to check which columns contain missing values, then plan `na.rm = TRUE` for every summariser that touches them.

## How do you filter groups, compute shares, and rank per group?

The last four exercises combine two or more dplyr ideas at once. You will filter groups by size, compute group shares as percentages, compare the `.groups` argument values side by side, and pull the top-k rows per group. These are the patterns that separate "I can call summarise()" from "I can write real analysis with it."

### Exercise 7: Keep only groups with at least N rows

From `starwars`, compute the mean height per `species`, but keep only species with at least 2 characters in the dataset. Use `na.rm = TRUE`. Save to `my_big_species` and sort it from biggest group to smallest.

```r
# Exercise 7: filter groups by size
# Hint: summarise n = n() AND mean_height together, then filter(n >= 2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_big_species <- starwars |>
  group_by(species) |>
  summarise(
    n           = n(),
    mean_height = mean(height, na.rm = TRUE),
    .groups     = "drop"
  ) |>
  filter(n >= 2) |>
  arrange(desc(n))

print(my_big_species)
#> # A tibble: 9 × 3
#>   species      n mean_height
#>   <chr>    <int>       <dbl>
#> 1 Human       35       177.
#> 2 Droid        6       140
#> 3 Gungan       3       209.
#> 4 Wookiee      2       231
#> ...
```

**Explanation:** The `summarise()` call produces one row per species with both `n` and `mean_height`. Then `filter(n >= 2)` keeps only species that appear at least twice. This is the standard pattern for "ignore small or noisy groups" in analysis. Because `.groups = "drop"` was used, `filter()` operates on a plain tibble with no surprises.

</details>

### Exercise 8: Group share as a percentage

For `mtcars`, compute each `gear` group's share of total `mpg` as a percentage. The output should have three columns: `gear`, `sum_mpg`, and `pct_of_total`. Save to `my_share`. The `pct_of_total` column should sum to 100.

```r
# Exercise 8: group share as percent of total
# Hint: summarise sum_mpg per gear first, then mutate pct = 100 * sum_mpg / sum(sum_mpg)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_share <- mtcars |>
  group_by(gear) |>
  summarise(sum_mpg = sum(mpg), .groups = "drop") |>
  mutate(pct_of_total = round(100 * sum_mpg / sum(sum_mpg), 1))

print(my_share)
#> # A tibble: 3 × 3
#>    gear sum_mpg pct_of_total
#>   <dbl>   <dbl>        <dbl>
#> 1     3   294.          45.9
#> 2     4   294.          45.9
#> 3     5    52.3          8.2
```

**Explanation:** The trick is `.groups = "drop"`. After dropping, the `mutate()` call sees a flat three-row tibble and computes `sum(sum_mpg)` across all three rows, the grand total. Without dropping, `mutate()` would run inside each group and divide each value by itself, giving 100 percent for every row. That bug is silent.

</details>

[KEY INSIGHT]
**Group shares need a two-step pipeline: summarise first, then mutate on an ungrouped tibble.** The first step aggregates rows to one value per group; the second step compares each group to the global total. Leaving the grouping active during `mutate()` is one of the top three sources of wrong percentage results in dplyr code.

### Exercise 9: Compare .groups = "drop" vs .groups = "keep"

Run two near-identical pipelines on `mtcars`: group by `cyl` and `am`, then summarise `n = n()`. In the first, use `.groups = "drop"`. In the second, use `.groups = "keep"`. After each, call `group_vars()` to see which grouping remains. Save the results to `my_drop` and `my_keep`.

```r
# Exercise 9: contrast .groups values
# Hint: same pipeline twice with different .groups; then group_vars(result)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_drop <- mtcars |>
  group_by(cyl, am) |>
  summarise(n = n(), .groups = "drop")

my_keep <- mtcars |>
  group_by(cyl, am) |>
  summarise(n = n(), .groups = "keep")

group_vars(my_drop)
#> character(0)

group_vars(my_keep)
#> [1] "cyl" "am"
```

**Explanation:** `group_vars()` reports the active grouping columns. `"drop"` removes all grouping after summarise, so `my_drop` is ungrouped (an empty character vector). `"keep"` retains every grouping variable, both `cyl` and `am`. The other options are `"drop_last"` (removes only the rightmost grouping, this is dplyr's default when you do not specify) and `"rowwise"` (rare). Use `"drop"` as a safe default unless you specifically need the grouping later.

</details>

### Exercise 10: Top-k per group using slice_max

From `starwars`, find the two heaviest characters per `homeworld`. Only consider rows where `mass` and `homeworld` are not `NA`. Save to `my_top2`. Sort the result by `homeworld`, then by `mass` descending within each homeworld.

```r
# Exercise 10: top-2 per group
# Hint: filter NA rows, group_by(homeworld), slice_max(mass, n = 2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_top2 <- starwars |>
  filter(!is.na(mass), !is.na(homeworld)) |>
  group_by(homeworld) |>
  slice_max(mass, n = 2, with_ties = FALSE) |>
  arrange(homeworld, desc(mass)) |>
  select(name, homeworld, mass)

print(my_top2, n = 8)
#> # A tibble: ... × 3
#> # Groups:   homeworld [...]
#>   name                  homeworld      mass
#>   <chr>                 <chr>         <dbl>
#> 1 Jabba Desilijic Tiure Nal Hutta      1358
#> 2 IG-88                 (none)          140
#> 3 Bossk                 Trandosha       113
#> 4 Dexter Jettster       Ojom            102
#> ...
```

**Explanation:** `slice_max(mass, n = 2)` keeps the top 2 rows per group based on `mass`. Because `group_by(homeworld)` is still active, "top 2" means top 2 per homeworld, not top 2 overall. `with_ties = FALSE` stops `slice_max()` from keeping extra rows when two characters share the same mass. Filtering out `NA` rows first is essential, `slice_max()` treats `NA` as larger than any finite value by default, which gives surprising results otherwise.

</details>

[TIP]
**slice_max() is the modern replacement for top_n().** The old `top_n()` still works but is superseded. Use `slice_max()` and `slice_min()` going forward, they have cleaner behaviour around ties, have an explicit `with_ties` argument, and accept a vector of any sortable type.

## What mistakes should you avoid with group_by() and summarise()?

Four mistakes trip up almost everyone who is new to these verbs. Each one runs without an error message, that is what makes them dangerous. Read the wrong-then-right pattern below and keep an eye out for the same shapes in your own code.

### Mistake 1: Forgetting na.rm with missing data

The mean of a vector that contains even one `NA` is `NA`. Unless you tell R to ignore missing values, every group that contains a missing value returns `NA` for that group's summary.

```r
# Wrong: silent NA pollution
starwars |>
  group_by(species) |>
  summarise(m = mean(height), .groups = "drop") |>
  head(3)
#> # A tibble: 3 × 2
#>   species      m
#>   <chr>    <dbl>
#> 1 Aleena      79
#> 2 Besalisk   198
#> 3 Cerean     198
```

```r
# Right: na.rm = TRUE
starwars |>
  group_by(species) |>
  summarise(m = mean(height, na.rm = TRUE), .groups = "drop") |>
  head(3)
```

The fix is one extra argument. The habit is to always check `summary(your_data)` first, if any column has `NA` values, plan for `na.rm = TRUE` on every summariser that touches it.

### Mistake 2: Leaving groups attached after summarise

A grouped tibble behaves differently in downstream verbs. Percentages, joins, and even `mutate()` all change their meaning when grouping is silently still active.

```r
# Wrong: still grouped, so mutate computes per-group, not overall
bad <- mtcars |>
  group_by(cyl) |>
  summarise(total_hp = sum(hp))

bad |> mutate(pct = 100 * total_hp / sum(total_hp))
#> per-group sum divides by itself → every row 100%
```

```r
# Right: drop groups, then mutate sees the whole tibble
good <- mtcars |>
  group_by(cyl) |>
  summarise(total_hp = sum(hp), .groups = "drop")

good |> mutate(pct = 100 * total_hp / sum(total_hp))
```

Use `.groups = "drop"` or call `ungroup()` explicitly the moment your grouped step is finished.

### Mistake 3: Using mean() on non-numeric columns

`across(everything(), mean)` errors out the instant any column is a character or factor. The fix is to scope `across()` to numeric columns only.

```r
# Wrong: iris has a factor column
iris |>
  group_by(Species) |>
  summarise(across(everything(), mean))
#> Error: `across()` argument is not numeric
```

```r
# Right: restrict to numeric columns
iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric), mean), .groups = "drop")
```

`where(is.numeric)` is a tidy-select helper that picks columns by type. Use it inside `across()` whenever you are not 100 percent sure every column is numeric.

### Mistake 4: Not specifying .groups and being surprised by the message

dplyr prints a helpful note when you leave `.groups` off, but new users often mistake the note for an error.

```r
# Noisy (prints message but still works)
mtcars |> group_by(cyl, am) |> summarise(n = n())
#> `summarise()` has grouped output by 'cyl'. You can override using the `.groups` argument.
```

```r
# Quiet: state your intent
mtcars |> group_by(cyl, am) |> summarise(n = n(), .groups = "drop")
```

Always set `.groups` explicitly. It documents your intent in the code and silences the message.

[NOTE]
**dplyr's default `.groups` behaviour is `"drop_last"`, which prints a message; `"drop"` silences it.** When you leave `.groups` out of a multi-column grouping, dplyr keeps every grouping column except the last and prints a friendly note. That message is helpful once and annoying forever, set `.groups` explicitly in every pipeline.

## Practice Exercises

The ten numbered problems above ARE your practice. Below are two bonus capstone challenges that combine three or more concepts at once. Each one is harder than any single exercise above, and each one is solvable using only verbs you have already met.

### Capstone 1: Top 3 homeworlds by average mass

Using `starwars`, find the three homeworlds with the highest average character mass, but only consider homeworlds that have at least two characters. Drop any rows with missing `mass` or `homeworld` values. Save the result to `cap1_top_homeworlds` with three columns: `homeworld`, `n`, and `mean_mass`.

```r
# Capstone 1: top 3 homeworlds by average mass
# Hint: filter NA, group_by(homeworld), summarise n + mean_mass,
#       filter(n >= 2), slice_max(mean_mass, n = 3)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
cap1_top_homeworlds <- starwars |>
  filter(!is.na(mass), !is.na(homeworld)) |>
  group_by(homeworld) |>
  summarise(
    n         = n(),
    mean_mass = mean(mass),
    .groups   = "drop"
  ) |>
  filter(n >= 2) |>
  slice_max(mean_mass, n = 3, with_ties = FALSE)

print(cap1_top_homeworlds)
#> # A tibble: 3 × 3
#>   homeworld     n mean_mass
#>   <chr>     <int>     <dbl>
#> 1 Kashyyyk      2     124
#> 2 Kamino        3      88
#> 3 Tatooine      8      85.4
```

**Explanation:** Four steps stacked into one pipeline. `filter()` drops the `NA` rows so `mean()` does not need `na.rm` and `slice_max()` does not get tricked by missing values. `group_by() |> summarise()` collapses to one row per homeworld with both the count and the mean. `filter(n >= 2)` excludes single-character homeworlds. `slice_max(mean_mass, n = 3)` returns the three biggest. This is the canonical pattern for "ranked groups, but only groups with enough support".

</details>

### Capstone 2: Per-cylinder/transmission share of total horsepower

Using `mtcars`, group by both `cyl` and `am`. For each combination compute the total horsepower (`total_hp`), the mean mpg (`mean_mpg`), and that combination's share of grand-total horsepower as a percentage (`pct_of_grand_total`). Save the result to `cap2_share`. The percentage column should sum to 100.

```r
# Capstone 2: per-cyl/am share of total horsepower
# Hint: group_by(cyl, am), summarise total_hp + mean_mpg with .groups = "drop",
#       then mutate pct_of_grand_total = 100 * total_hp / sum(total_hp)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
cap2_share <- mtcars |>
  group_by(cyl, am) |>
  summarise(
    total_hp = sum(hp),
    mean_mpg = round(mean(mpg), 1),
    .groups  = "drop"
  ) |>
  mutate(pct_of_grand_total = round(100 * total_hp / sum(total_hp), 1)) |>
  arrange(desc(pct_of_grand_total))

print(cap2_share)
#> # A tibble: 6 × 5
#>     cyl    am total_hp mean_mpg pct_of_grand_total
#>   <dbl> <dbl>    <dbl>    <dbl>              <dbl>
#> 1     8     0     2330     15                 50.4
#> 2     8     1      599     15.4               13.0
#> 3     6     0      491     19.1               10.6
#> 4     6     1      361     20.6                7.8
#> 5     4     0      281     22.9                6.1
#> 6     4     1      546     28.1               11.8
```

**Explanation:** `group_by(cyl, am)` makes six groups. `summarise()` collapses each group to one row containing total horsepower and mean mpg, then `.groups = "drop"` removes the grouping. The `mutate()` runs on a flat tibble, so `sum(total_hp)` is the grand total across all six rows, exactly what you want for the percentage. Automatic eight-cylinder cars alone account for 50 percent of the total horsepower in `mtcars`. Sorting by `pct_of_grand_total` makes the dominance obvious.

</details>

## Complete Example

The exercises above each isolated one idea. Real analysis combines them. Here is a small, end-to-end fuel-economy report using `mtcars` that uses every core technique from this page in a single pipeline: multi-column grouping, multi-summary `summarise()`, `.groups = "drop"`, post-summarise `mutate()` with a global denominator, and a final sort.

```r
# Complete example: fuel-economy report by cylinder + transmission
report <- mtcars |>
  group_by(cyl, am) |>
  summarise(
    n            = n(),
    mean_mpg     = round(mean(mpg), 1),
    mean_hp      = round(mean(hp), 0),
    .groups      = "drop"
  ) |>
  mutate(
    pct_of_cars  = round(100 * n / sum(n), 1),
    mpg_per_hp   = round(mean_mpg / mean_hp, 3)
  ) |>
  arrange(desc(mean_mpg))

print(report)
#> # A tibble: 6 × 7
#>     cyl    am     n mean_mpg mean_hp pct_of_cars mpg_per_hp
#>   <dbl> <dbl> <int>    <dbl>   <dbl>       <dbl>      <dbl>
#> 1     4     1     8     28.1      81        25         0.347
#> 2     4     0     3     22.9      84.7       9.4       0.27
#> 3     6     1     3     20.6     132         9.4       0.156
#> 4     6     0     4     19.1     115.       12.5       0.166
#> 5     8     1     2     15.4     299.        6.2       0.052
#> 6     8     0    12     15        194.      37.5       0.077
```

The report answers four questions in one tibble. *Counting* (Exercise 1, 4) gives `n` and the share `pct_of_cars`. *Multi-column grouping* (Exercise 4) splits the rows by cylinder and transmission. *Multiple summaries in one summarise()* (Exercise 5 in spirit) builds `mean_mpg` and `mean_hp` together. *Post-summarise mutate on an ungrouped tibble* (Exercise 8) computes the share of total cars and a derived `mpg_per_hp` efficiency metric. The sort then surfaces the headline finding: manual four-cylinder cars are the most fuel-efficient combination by both mean mpg and mpg-per-horsepower.

## Summary

Nine patterns to keep at your fingertips when reaching for `group_by()` and `summarise()`.

| Pattern | Use when |
|---|---|
| `group_by() + summarise(n = n())` | Counting rows per group |
| `count(df, group_col)` | Shortcut when you only need counts |
| `summarise(across(where(is.numeric), mean))` | Many numeric columns at once |
| `mean(x, na.rm = TRUE)` | Data has missing values |
| `summarise(..., .groups = "drop")` | Default to drop grouping after summarising |
| `filter(n >= k)` after summarise | Exclude tiny or noisy groups |
| Two-step share: `summarise() |> mutate()` | Group share as percent of total |
| `group_by() + slice_max(x, n = k)` | Top-k rows per group |
| `ungroup()` before any join or mutate | Avoid silent per-group behaviour |

## References

1. dplyr, `summarise()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/summarise.html)
2. dplyr, `group_by()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/group_by.html)
3. dplyr, Grouped data vignette. [tidyverse.org](https://dplyr.tidyverse.org/articles/grouping.html)
4. dplyr, `across()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/across.html)
5. dplyr, `slice_max()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/slice.html)
6. Wickham H. & Grolemund G., *R for Data Science*, 2nd edition, Chapter 4 (Data transformation). [r4ds.hadley.nz](https://r4ds.hadley.nz/data-transform.html)

## Continue Learning

- [dplyr group_by() + summarise(): Aggregate Data by Group (10 Examples)](dplyr-group-by-summarise.html), the parent tutorial behind these exercises.
- [dplyr filter() & select() Exercises: 12 Practice Problems](dplyr-filter-select-Exercises.html), companion exercise set for row filtering and column picking.
- [dplyr Exercises](dplyr-Exercises.html), broader dplyr practice spanning the full verb family.
