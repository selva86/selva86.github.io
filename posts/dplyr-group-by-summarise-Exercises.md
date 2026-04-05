---
title: "dplyr group_by() & summarise() Exercises: 10 Aggregation Problems — Solved Step-by-Step"
slug: "dplyr-group-by-summarise-Exercises"
description: "Practise dplyr group_by() & summarise() with 10 aggregation problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced."
keywords: "dplyr exercises, group_by exercises, summarise exercises, R aggregation practice, dplyr practice problems, tidyverse exercises, R data wrangling exercises, group by summarise R"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "E2.3"
post_type: "EX"
sidebar_title: "group_by & summarise (10 problems)"
auto_link_terms: "dplyr group_by exercises|dplyr summarise exercises|group_by practice problems|summarise practice problems|dplyr aggregation exercises"
auto_link_case_sensitive: false
fr_parent: "dplyr-group-by-summarise.html"
---

<nav class="breadcrumb-nav">Home &gt; Data Wrangling &gt; dplyr &gt; dplyr group_by() &amp; summarise() Exercises</nav>

# dplyr group_by() & summarise() Exercises: 10 Aggregation Problems

<p class="lead">Ten runnable exercises to master <code>dplyr::group_by()</code> and <code>summarise()</code> — from a single-column count to grouped percentages, <code>across()</code>, <code>NA</code> handling, and per-group ranking. Each problem has a worked solution you can run and tweak in your browser.</p>

## Introduction

Reading about `group_by()` and `summarise()` is quick. Using them fluently on messy data — with missing values, multiple grouping columns, and questions like "what share of the total does each group hold?" — takes practice. These ten exercises give you that practice.

The problems grow from simple to genuine. The first three ask for counts and means. The middle three bring in multi-column grouping, `across()`, and `NA` handling. The last four mix `summarise()` with filtering, percentages, the `.groups` argument, and per-group slicing. Every exercise states the task, hands you a starter block, and hides the worked solution behind a click-to-reveal.

Try writing your own answer first. Run it. Compare with the solution. Read the short explanation under the solution to check your reasoning. If you are new to these verbs, skim the parent tutorial on [dplyr group_by() + summarise()](dplyr-group-by-summarise.html) before starting.

All code on this page runs in one shared R session, so variables you create in one block are available in the next. Use distinct names like `my_result` in your exercise code so you do not overwrite tutorial variables from earlier blocks.

## Quick Reference

Skim this cheat sheet before you start. It lists the functions you will use in the ten exercises.

| Task | Function | Example |
|---|---|---|
| Split into groups | `group_by()` | `group_by(df, cyl)` |
| Count rows per group | `n()` | `summarise(n = n())` |
| Count shortcut | `count()` | `count(df, cyl)` |
| Mean with NA safe | `mean(x, na.rm = TRUE)` | `summarise(m = mean(x, na.rm = TRUE))` |
| Apply to many columns | `across()` | `summarise(across(where(is.numeric), mean))` |
| Drop grouping after summarise | `.groups = "drop"` | `summarise(..., .groups = "drop")` |
| Remove grouping explicitly | `ungroup()` | `ungroup(df)` |
| Keep top-k per group | `slice_max()` | `slice_max(df, mass, n = 2)` |
| Group share as percent | custom formula | `100 * x / sum(x)` |

[TIP]
**Load dplyr once. Every later block reuses it.** The first code block loads `dplyr` and previews the two datasets. Because all blocks share a single R session, later exercises can call `group_by()` and `summarise()` without reloading.

```r
# Load dplyr and preview the datasets we will use
library(dplyr)

# mtcars: 32 rows, 11 numeric columns, 1973-74 car models
head(mtcars, 3)
#>                    mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4         21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag     21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710        22.8   4  108  93 3.85 2.320 18.61  1  1    4    1

# starwars: 87 rows, several NA values (great for na.rm practice)
starwars |> select(name, height, mass, species, homeworld) |> head(3)
#> # A tibble: 3 × 5
#>   name           height  mass species homeworld
#>   <chr>           <int> <dbl> <chr>   <chr>
#> 1 Luke Skywalker    172    77 Human   Tatooine
#> 2 C-3PO             167    75 Droid   Tatooine
#> 3 R2-D2              96    32 Droid   Naboo
```

Both datasets are ready. `mtcars` has clean numeric columns, so aggregation is straightforward. `starwars` has `NA` values in `height`, `mass`, and `species` — that is the point. You will use it for `na.rm` practice.

## Easy (1-3): Counts and Simple Means

Start here if you have barely used `group_by()` before. Each exercise uses one or two verbs only.

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

**Explanation:** `group_by(cyl)` splits the data into three pieces — one per unique cylinder value. `n()` counts the rows inside each piece. `.groups = "drop"` drops the grouping after summarising, so `my_counts` is a plain tibble. Without it you would see a friendly message from dplyr explaining which groups remain.

</details>

### Exercise 2: Average mpg per cylinder

Compute the average `mpg` for each `cyl` group in `mtcars`. Round to one decimal. Save to `my_mpg`. The column should be named `avg_mpg`.

```r
# Exercise 2: mean mpg per cyl
# Hint: use summarise(avg_mpg = round(mean(mpg), 1))

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

**Explanation:** Four-cylinder cars average 26.7 mpg while eight-cylinder cars average 15.1 mpg. `mean(mpg)` runs once per group because `group_by(cyl)` already split the rows. `round(..., 1)` formats the output. No `na.rm` here — `mtcars` has no `NA` values.

</details>

### Exercise 3: Use count() as a shortcut

Repeat Exercise 1, but use `count()` instead of `group_by() + summarise(n = n())`. Count cars per `gear` value. Save to `my_gears`.

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

**Explanation:** `count()` is a shortcut. It does the exact same thing as `group_by(gear) |> summarise(n = n(), .groups = "drop")` — but shorter. Most dplyr users reach for `count()` when they only need a row count per group. Add `sort = TRUE` to order the result from largest to smallest.

[TIP]
**Prefer count() for plain frequencies, summarise() for everything else.** `count()` is read-at-a-glance for "how many per group". Once you add other summaries (means, sums), switch back to `group_by() + summarise()`.

</details>

## Medium (4-6): Multi-Column Groups, across(), and NA Handling

These three exercises mix two ideas at once. Take them slowly.

### Exercise 4: Group by two columns

Group `mtcars` by both `cyl` and `am` (automatic/manual). Compute the count and mean mpg per combination. Save to `my_combo`. Include a `.groups = "drop"` to keep the output ungrouped.

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

**Explanation:** `group_by(cyl, am)` creates six groups — every unique `(cyl, am)` combination with at least one row. Manual 4-cylinder cars average 28.1 mpg; automatic 8-cylinder cars average 15.0 mpg. The `.groups = "drop"` flag removes the grouping, so the result behaves like a flat tibble for any downstream work.

</details>

### Exercise 5: Summarise many columns with across()

Use the `iris` dataset. Group by `Species` and compute the mean of every numeric column in one call. Save to `my_iris`. The result should have four columns: `Species` plus the four numeric means.

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

**Explanation:** `across(where(is.numeric), mean)` says: for every column that is numeric, apply `mean()`. This is the modern replacement for the old `summarise_if()` and `summarise_at()` helpers. If you needed two summaries per column, use a named list: `across(where(is.numeric), list(mean = mean, sd = sd))`.

[KEY INSIGHT]
**across() scales with your data, not your typing.** Hand-writing `summarise(mean_a = mean(a), mean_b = mean(b), mean_c = mean(c), ...)` breaks once you have twenty columns. With `across()` the code is the same for four columns or four hundred.

</details>

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
#> 2 Kaminoan           221        88
#> 3 Wookiee            231       124
#> 4 Yoda's species      66        17
#> 5 Kaleesh            216       159
```

**Explanation:** `na.rm = TRUE` tells `mean()` to ignore missing values before averaging. Without it, any group containing one `NA` would return `NA` for that group. Notice the `NaN` in `mean_mass` for Quermian — that group had zero non-`NA` mass values, so the mean of an empty set is undefined. Real analysis almost always needs `na.rm = TRUE`.

[WARNING]
**Forgetting na.rm silently poisons every group with missing data.** The result still runs. It is just full of `NA` values you did not expect. Always check for `NA` first with `summary(df)` before summarising.

</details>

## Hard (7-10): Filtering Groups, Percentages, .groups, and Ranking

The final four exercises combine two or more dplyr ideas. Take your time.

### Exercise 7: Keep only groups with at least N rows

From `starwars`, compute the mean height per `species`, but keep only species with at least 2 characters in the dataset. Use `na.rm = TRUE`. Save to `my_big_species`.

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
#> 1 Human       35        177.
#> 2 Droid        6        140
#> 3 Gungan       3        209.
#> 4 Wookiee      2        231
#> ...
```

**Explanation:** The `summarise()` call produces one row per species with both `n` and `mean_height`. Then `filter(n >= 2)` keeps only rows where the group had at least two characters. This is the standard pattern for "ignore small or noisy groups" in analysis. Because `.groups = "drop"` was used, `filter()` works on a plain tibble.

</details>

### Exercise 8: Group share as a percentage

For `mtcars`, compute each `gear` group's share of total `mpg` as a percentage. The output should have three columns: `gear`, `sum_mpg`, and `pct_of_total`. Save to `my_share`. The `pct_of_total` column should sum to 100.

```r
# Exercise 8: group share as percent of total
# Hint: first summarise sum_mpg per gear, then mutate pct = 100 * sum_mpg / sum(sum_mpg)

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

**Explanation:** The trick is `.groups = "drop"`. After dropping, the `mutate()` call sees one row per gear and computes `sum(sum_mpg)` across all three rows — that is the grand total. Without dropping, `mutate()` would run inside each group and divide by itself, giving 100% for every row. Always ungroup before computing shares.

[KEY INSIGHT]
**Shares need a two-step pipeline: summarise first, then mutate with an ungrouped sum.** The first step aggregates rows to groups; the second step compares each group to the global total. Keeping the grouping active during `mutate()` is a top-3 source of wrong percentage results.

</details>

### Exercise 9: Compare .groups = "drop" vs .groups = "keep"

Run two near-identical pipelines on `mtcars`: group by `cyl` and `am`, then summarise `n = n()`. In the first, use `.groups = "drop"`. In the second, use `.groups = "keep"`. After each, call `group_vars()` to see which grouping remains. Save the results to `my_drop` and `my_keep`.

```r
# Exercise 9: contrast .groups values
# Hint: run the same pipeline twice with different .groups; then call group_vars(result)

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

**Explanation:** `group_vars()` shows the active grouping columns. `"drop"` removes all grouping after summarise, so `my_drop` is ungrouped (empty character vector). `"keep"` holds on to every grouping variable — both `cyl` and `am`. The other options are `"drop_last"` (removes only the rightmost grouping — this is dplyr's default when you do not specify) and `"rowwise"` (rarely needed). Use `"drop"` as a safe default unless you know you need the grouping later.

[NOTE]
**dplyr's default .groups behaviour prints a message; "drop" silences it.** When you leave `.groups` out, dplyr picks `"drop_last"` and prints a note: ``summarise() has grouped output by 'cyl'.`` That message is helpful once, annoying forever. Set `.groups` explicitly to silence it.

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
#> 1 Jabba Desilijic Tiure Nal Hutta       1358
#> 2 IG-88                 null           140
#> 3 Bossk                 Trandosha       113
#> 4 Dexter Jettster       Ojom            102
#> ...
```

**Explanation:** `slice_max(mass, n = 2)` keeps the top 2 rows per group based on `mass`. Because `group_by(homeworld)` is still active, "top 2" means top 2 per homeworld, not top 2 overall. `with_ties = FALSE` stops slice_max from keeping extra rows when two characters have the same mass. Always filter out `NA` values before slicing — `slice_max()` treats `NA` as infinity-like by default and you will get surprises.

[TIP]
**slice_max is the modern replacement for top_n().** The old `top_n()` still works but is superseded. Use `slice_max()` and `slice_min()` going forward — they have cleaner behaviour around ties and NAs.

</details>

## Common Mistakes and How to Fix Them

Five mistakes that trip up almost everyone learning these verbs.

### Mistake 1: Forgetting na.rm with missing data

Missing values poison the whole group summary.

The mean of a vector with even one `NA` is `NA`. Unless you tell R to ignore `NA`s, every group containing a missing value returns `NA`.

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
#> ...
```

```r
# Correct: na.rm = TRUE
starwars |>
  group_by(species) |>
  summarise(m = mean(height, na.rm = TRUE), .groups = "drop") |>
  head(3)
```

Always check `summary(your_data)` first. If any column has `NA`s, plan for `na.rm = TRUE` on every summariser that touches it.

### Mistake 2: Leaving groups attached after summarise

A grouped tibble behaves differently in downstream verbs. Percentages, joins, and filters all change.

```r
# Wrong: still grouped, so mutate computes per-group, not overall
bad <- mtcars |>
  group_by(cyl) |>
  summarise(total_hp = sum(hp))

bad |> mutate(pct = 100 * total_hp / sum(total_hp))
#> per-group sum divides by itself → every row 100%
```

```r
# Correct: drop groups, then mutate sees the whole tibble
good <- mtcars |>
  group_by(cyl) |>
  summarise(total_hp = sum(hp), .groups = "drop")

good |> mutate(pct = 100 * total_hp / sum(total_hp))
```

Use `.groups = "drop"` or call `ungroup()` explicitly when the grouped step is finished.

### Mistake 3: Using mean() on non-numeric columns

`across(everything(), mean)` crashes if any column is a character or factor.

```r
# Wrong: iris has a factor column
iris |>
  group_by(Species) |>
  summarise(across(everything(), mean))
#> Error: `across()` argument is not numeric
```

```r
# Correct: restrict to numeric columns
iris |>
  group_by(Species) |>
  summarise(across(where(is.numeric), mean), .groups = "drop")
```

Use `where(is.numeric)` inside `across()` whenever you are not 100% sure every column is numeric.

### Mistake 4: Not specifying .groups and being surprised by messages

dplyr prints a helpful message when you leave `.groups` off, but readers often mistake it for an error.

```r
# Noisy (prints message but works)
mtcars |> group_by(cyl, am) |> summarise(n = n())
#> `summarise()` has grouped output by 'cyl'. You can override using the `.groups` argument.
```

```r
# Quiet: state your intent
mtcars |> group_by(cyl, am) |> summarise(n = n(), .groups = "drop")
```

Always set `.groups` explicitly. It documents your intent and silences the message.

## Summary

Ten verbs and patterns to keep in mind.

| Pattern | Use when |
|---|---|
| `group_by() + summarise(n = n())` | Counting rows per group |
| `count()` | Shortcut when you only need counts |
| `summarise(across(where(is.numeric), mean))` | Many columns at once |
| `mean(x, na.rm = TRUE)` | Data has missing values |
| `summarise(..., .groups = "drop")` | Default to drop grouping |
| `filter(n >= k)` after summarise | Exclude tiny or noisy groups |
| Two-step share: summarise then mutate | Percentages of a total |
| `group_by() + slice_max(x, n = k)` | Top-k rows per group |
| `ungroup()` before join/mutate | Avoid silent per-group behaviour |

## FAQ

### Why does summarise() print a .groups message?

dplyr tells you which grouping it kept after summarising. By default it drops the last grouping variable. Set `.groups = "drop"`, `"keep"`, `"drop_last"`, or `"rowwise"` to make your choice explicit and silence the message.

### What is the difference between summarise() with group_by() and mutate() with group_by()?

`summarise()` collapses each group to one row. `mutate()` keeps every original row but runs the calculation per group. Use `summarise()` for group-level outputs (means, counts). Use `mutate()` to add a per-group value as a new column on the original data.

### Should I use count() or summarise(n = n())?

Use `count()` for plain frequencies — it is shorter. Use `summarise(n = n(), ...)` when you need counts alongside other summaries like means or sums. They produce the same count column either way.

### Can I group by an expression, not just a column?

Yes. `group_by(cyl, hp_class = hp > 150)` creates a new grouping variable on the fly from any expression. The computed variable appears as a column in the output and behaves like any other grouping variable.

## References

1. dplyr — `summarise()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/summarise.html)
2. dplyr — `group_by()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/group_by.html)
3. dplyr — Grouped data vignette. [tidyverse.org](https://dplyr.tidyverse.org/articles/grouping.html)
4. Wickham H. & Grolemund G. — *R for Data Science*, 2nd edition, Chapter 4 (Data transformation). [r4ds.hadley.nz](https://r4ds.hadley.nz/data-transform.html)
5. dplyr — `across()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/across.html)
6. dplyr — `slice_max()` reference. [tidyverse.org](https://dplyr.tidyverse.org/reference/slice.html)

## What's Next?

- [dplyr group_by() + summarise(): Aggregate Data by Group (10 Examples)](dplyr-group-by-summarise.html) — the parent tutorial behind these exercises.
- [dplyr filter() & select() Exercises: 12 Practice Problems](dplyr-filter-select-Exercises.html) — companion exercise set for row filtering and column picking.
- [dplyr Exercises](dplyr-Exercises.html) — broader dplyr practice spanning the full verb family.
