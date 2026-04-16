---
title: "dplyr arrange(), slice(), and top_n(): Get Exactly the Rows You Want"
slug: "dplyr-arrange-slice"
description: "Sort rows with arrange(), pick positions with slice(), and get top-N per group with slice_max() — the modern successor to top_n() in dplyr 1.1+."
keywords: "dplyr arrange, dplyr slice, dplyr top_n, slice_max, slice_min, slice_sample, sort rows R, top n per group R, dplyr sort, R order rows"
auto_link_terms: "dplyr arrange|dplyr slice|arrange()|slice()|slice_max()|slice_min()|top_n()|sort rows in R|top n per group"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-11
curriculum_id: "1.2.6"
post_type: C
sidebar_section: "Data Wrangling"
sidebar_title: "dplyr arrange & slice"
sidebar_order: 6
difficulty: "Intermediate"
---

# dplyr arrange(), slice(), and top_n(): Get Exactly the Rows You Want

<p class="lead">In dplyr, <code>arrange()</code> sorts rows, <code>slice()</code> picks rows by position, and the <code>slice_*()</code> family grabs rows by value or at random. Together they answer one question analysts ask every day: "give me exactly these rows, in this order."</p>

## How does arrange() sort rows in dplyr?

When you need to rank, compare, or just eyeball the biggest and smallest values, sorting is the first move. `arrange()` reorders rows by one or more columns — ascending by default, wrap a column in `desc()` for descending. Here are the fastest cars in `mtcars`, ranked by quarter-mile time (smaller `qsec` = faster):

```r
library(dplyr)

fastest_cars <- mtcars |>
  arrange(qsec)

head(fastest_cars, 5)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Ford Pantera L 15.8   8 351.0 264 4.22 3.170 14.50  0  1    5    4
#> Maserati Bora  15.0   8 301.0 335 3.54 3.570 14.60  0  1    5    8
#> Camaro Z28     13.3   8 350.0 245 3.73 3.840 15.41  0  0    3    4
#> Duster 360     14.3   8 360.0 245 3.73 3.845 15.84  0  0    3    4
#> Ford Pantera L 15.8   8 351.0 264 4.22 3.170 14.50  0  1    5    4
```

The Ford Pantera L comes out on top with a 14.5-second quarter mile, followed closely by the Maserati Bora at 14.6. Notice the row names stay attached — `arrange()` moves whole rows, not just the sort column. That's a key property: every column in every row travels together, so your table remains consistent after sorting.

[KEY INSIGHT]
**arrange() is a verb about row order, not row selection.** Every row that went in comes out — just reshuffled. If you want to keep only the top few after sorting, you'll chain `slice()` or `head()` on the result.

**Try it:** Sort `iris` so the longest `Sepal.Length` comes first. Save to `ex_iris_sorted` and show the top 3 rows.

```r
# Try it: sort iris by Sepal.Length descending
ex_iris_sorted <- iris |>
  # your code here

head(ex_iris_sorted, 3)
#> Expected: three rows with Sepal.Length = 7.9, 7.7, 7.7
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris_sorted <- iris |>
  arrange(desc(Sepal.Length))

head(ex_iris_sorted, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width   Species
#> 1          7.9         3.8          6.4         2.0 virginica
#> 2          7.7         3.8          6.7         2.2 virginica
#> 3          7.7         2.6          6.9         2.3 virginica
```

**Explanation:** `desc()` flips the sort direction for that single column — cleaner than negating the values.

</details>

## How do you sort by multiple columns at once?

Single-column sorting is fine until you hit ties. What if you want all four-cylinder cars first, then six-cylinder, then eight — and within each cylinder group, the highest-mpg car on top? Pass multiple columns to `arrange()` and dplyr sorts by the first column, then uses the second as a tie-breaker, and so on. The order you list the columns matters.

```r
cyl_mpg_sort <- mtcars |>
  arrange(cyl, desc(mpg))

head(cyl_mpg_sort, 6)
#>                 mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Toyota Corolla 33.9   4  71.1  65 4.22 1.835 19.90  1  1    4    1
#> Fiat 128       32.4   4  78.7  66 4.08 2.200 19.47  1  1    4    1
#> Honda Civic    30.4   4  75.7  52 4.93 1.615 18.52  1  1    4    2
#> Lotus Europa   30.4   4  95.1 113 3.77 1.513 16.90  1  1    5    2
#> Fiat X1-9      27.3   4  79.0  66 4.08 1.935 18.90  1  1    4    1
#> Porsche 914-2  26.0   4  66.3  91 4.22 1.984 16.90  1  1    5    1
```

The four-cylinder block leads, and within it the Toyota Corolla (33.9 mpg) sits at the top. Scroll further and you'd see six-cylinder cars start, then eight-cylinder — always sorted high-to-low by mpg inside each group. This is exactly how SQL's `ORDER BY col1, col2` works, and it's how you build leaderboards that respect natural categories.

[TIP]
**The order of columns in arrange() determines the sort hierarchy.** Put the "outer" category first and the "inner" tie-breaker second. Swapping `arrange(cyl, desc(mpg))` to `arrange(desc(mpg), cyl)` gives a completely different result — the overall highest-mpg cars first, regardless of cylinder.

**Try it:** Sort the `starwars` dataset by `species` alphabetically, then within each species by `mass` descending. Save to `ex_sw_sorted`.

```r
# Try it: species A-Z, then heaviest first
ex_sw_sorted <- starwars |>
  # your code here

head(ex_sw_sorted |> select(name, species, mass), 3)
#> Expected: 3 rows with species sorted alphabetically, mass descending
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_sw_sorted <- starwars |>
  arrange(species, desc(mass))

head(ex_sw_sorted |> select(name, species, mass), 3)
#> # A tibble: 3 × 3
#>   name              species  mass
#>   <chr>             <chr>   <dbl>
#> 1 Ratts Tyerell     Aleena     15
#> 2 Dexter Jettster   Besalisk  102
#> 3 Ki-Adi-Mundi      Cerean     82
```

**Explanation:** `NA` values go to the end by default. Use `arrange(species, desc(mass), .na.last = FALSE)` if you want them first.

</details>

## What's the difference between arrange() and base R's order()?

If you've used base R you already know `order()` — it returns the *indices* that would sort a vector, and you use those indices to subset the data frame. `arrange()` skips that indirection: it takes the whole data frame, sorts it, and hands it back. Same result, half the keystrokes and none of the bracket gymnastics.

```r
# Base R way
base_sorted <- mtcars[order(mtcars$cyl, -mtcars$mpg), ]

# dplyr way
dplyr_sorted <- mtcars |> arrange(cyl, desc(mpg))

# Identical contents:
identical(
  rownames(base_sorted),
  rownames(dplyr_sorted)
)
#> [1] TRUE
```

Both lines produce the same sorted table, confirmed by `identical()` on the row names. The dplyr version reads left-to-right like English — *take mtcars, arrange by cyl then descending mpg* — while the base R version needs you to parse nested bracket syntax and remember that `-mtcars$mpg` is the trick for descending. For interactive analysis, `arrange()` wins on readability every time.

**Try it:** Rewrite `iris[order(-iris$Petal.Length), ][1:3, ]` using `arrange()` + `slice()` or `head()`. Save to `ex_base_rewrite`.

```r
# Try it: top 3 longest petals, rewritten with dplyr
ex_base_rewrite <- iris |>
  # your code here

ex_base_rewrite
#> Expected: 3 rows with Petal.Length = 6.9, 6.7, 6.7
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_base_rewrite <- iris |>
  arrange(desc(Petal.Length)) |>
  head(3)

ex_base_rewrite
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width   Species
#> 1          7.7         2.6          6.9         2.3 virginica
#> 2          7.7         3.8          6.7         2.2 virginica
#> 3          7.7         2.8          6.7         2.0 virginica
```

**Explanation:** `head(3)` and `slice(1:3)` are interchangeable here — both grab the first three rows after sorting.

</details>

## How do you pick rows by position with slice()?

Sometimes you don't care about values — you just want "row 5" or "rows 10 through 15" or "everything except the first row." That's what `slice()` does: it subsets rows by their integer position in the table. It accepts a single index, a range with `:`, a vector with `c()`, or negative indices to *exclude* rows.

```r
first_five <- mtcars |>
  slice(1:5)

first_five
#>                    mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4         21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag     21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710        22.8   4  108  93 3.85 2.320 18.61  1  1    4    1
#> Hornet 4 Drive    21.4   6  258 110 3.08 3.215 15.44  0  1    3    3
#> Hornet Sportabout 18.7   8  360 175 3.30 3.215 16.46  0  0    3    2
```

That's the first five rows of `mtcars` — position 1 through 5, in their original order. To grab specific non-contiguous rows, pass a vector: `slice(c(1, 3, 5))`. To drop the first row instead of keeping it, use a negative index: `slice(-1)`. And to drop several, `slice(-c(1, 2))`. The pattern mirrors base R indexing, but it returns a proper tibble and plays nicely with pipes.

[NOTE]
**slice() uses integer positions, not logical conditions.** For row selection by value ("rows where mpg > 20"), you want `filter()`, not `slice()`. Mixing these up is a common early-stage dplyr confusion.

**Try it:** Extract rows 10 through 15 from `iris`. Save to `ex_iris_slice`.

```r
# Try it: rows 10-15 of iris
ex_iris_slice <- iris |>
  # your code here

ex_iris_slice
#> Expected: 6 rows
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris_slice <- iris |>
  slice(10:15)

ex_iris_slice
#>    Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1           4.9         3.1          1.5         0.1  setosa
#> 2           5.4         3.7          1.5         0.2  setosa
#> 3           4.8         3.4          1.6         0.2  setosa
#> 4           4.8         3.0          1.4         0.1  setosa
#> 5           4.3         3.0          1.1         0.1  setosa
#> 6           5.8         4.0          1.2         0.2  setosa
```

**Explanation:** `10:15` generates the integer sequence `c(10,11,12,13,14,15)` and passes it to `slice()`.

</details>

## When should you use slice_head(), slice_tail(), slice_min(), slice_max()?

dplyr ships a whole family of `slice_*()` helpers — each one answering a different flavor of "give me rows." They spare you from writing `arrange() |> head()` every time and they handle ties and sampling gracefully. The right choice depends on *how* you want to pick:

![Which slice_*() variant should you use?](screenshots/dplyr-arrange-slice-family.webp)
*Figure 1: Choosing the right slice_*() variant based on how you want to pick rows.*

| Function | Picks rows by... | Typical use |
|---|---|---|
| `slice_head(n = 5)` | First N positions | First 5 rows of a table |
| `slice_tail(n = 5)` | Last N positions | Last 5 rows of a table |
| `slice_min(col, n = 5)` | N smallest values of `col` | Cheapest 5 products |
| `slice_max(col, n = 5)` | N largest values of `col` | Heaviest 5 characters |
| `slice_sample(n = 5)` | Random N rows | Bootstrap sample, data check |

Here's `slice_max()` in action — no `arrange()` needed:

```r
heaviest_sw <- starwars |>
  filter(!is.na(mass)) |>
  slice_max(mass, n = 5)

heaviest_sw |> select(name, species, mass)
#> # A tibble: 5 × 3
#>   name                  species  mass
#>   <chr>                 <chr>   <dbl>
#> 1 Jabba Desilijic Tiure Hutt     1358
#> 2 Grievous              Kaleesh  159
#> 3 IG-88                 Droid    140
#> 4 Bossk                 Trandos. 113
#> 5 Chewbacca             Wookiee  112
```

Five lines of output, ranked heaviest first, with `Jabba` unsurprisingly dominating at 1358 kg. Behind the scenes `slice_max()` sorts by `mass` descending and takes the top 5 — but the verb name reads directly as intent: *slice the max*. Prefer these helpers over `arrange(desc(mass)) |> head(5)` when you want self-documenting code.

[TIP]
**slice_sample() is perfect for quick data checks.** Running `slice_sample(n = 10)` on a 100,000-row dataset gives you a random preview — far more representative than the first 10 rows, which often share a common source or timestamp.

**Try it:** Get the 3 shortest Star Wars characters by `height`. Save to `ex_shortest_sw`.

```r
# Try it: 3 shortest characters
ex_shortest_sw <- starwars |>
  filter(!is.na(height)) |>
  # your code here

ex_shortest_sw |> select(name, height)
#> Expected: 3 rows with the smallest heights
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_shortest_sw <- starwars |>
  filter(!is.na(height)) |>
  slice_min(height, n = 3)

ex_shortest_sw |> select(name, height)
#> # A tibble: 3 × 2
#>   name                  height
#>   <chr>                  <int>
#> 1 Yoda                      66
#> 2 Ratts Tyerell             79
#> 3 Wicket Systri Warrick     88
```

**Explanation:** `slice_min()` is the mirror image of `slice_max()` — smallest values first.

</details>

## How do you get the top N rows per group?

Here's the pattern that makes `slice_max()` genuinely powerful: combine it with `group_by()` and you get top-N-per-group in one short pipeline. "Top 2 most fuel-efficient cars *within each cylinder class*" — that's a question analysts ask constantly, and it would take an ugly loop in base R.

![Top-N-per-group with group_by() + slice_max()](screenshots/dplyr-arrange-slice-top-n-per-group.webp)
*Figure 2: Getting the top rows within each group by combining group_by() and slice_max().*

```r
top_by_cyl <- mtcars |>
  group_by(cyl) |>
  slice_max(mpg, n = 2) |>
  ungroup()

top_by_cyl |> select(mpg, cyl, hp)
#> # A tibble: 6 × 3
#>     mpg   cyl    hp
#>   <dbl> <dbl> <dbl>
#> 1  33.9     4    65
#> 2  32.4     4    66
#> 3  21.4     6   110
#> 4  21.0     6   110
#> 5  19.2     8   175
#> 6  18.7     8   175
```

Six rows total — two per cylinder class, ranked highest mpg first within each group. The Toyota Corolla leads the 4-cylinder class, a Hornet tops the 6-cylinder, and a Pontiac leads the 8-cylinder. The `ungroup()` at the end is a good habit: it clears the grouping so downstream operations act on the whole table.

[WARNING]
**Ties may give you more rows than n.** If the 2nd and 3rd ranked cars have identical mpg, `slice_max(n = 2)` returns all of them by default. Set `with_ties = FALSE` to enforce an exact count and break ties arbitrarily. Use this when downstream code expects a fixed row count.

**Try it:** Get the 2 tallest characters per `species` from `starwars`, ignoring rows with missing `height`. Save to `ex_top_by_species`.

```r
# Try it: 2 tallest per species
ex_top_by_species <- starwars |>
  filter(!is.na(height), !is.na(species)) |>
  group_by(species) |>
  # your code here

head(ex_top_by_species |> select(name, species, height), 4)
#> Expected: 4 rows (2 species × 2 characters each, alphabetical by species)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_top_by_species <- starwars |>
  filter(!is.na(height), !is.na(species)) |>
  group_by(species) |>
  slice_max(height, n = 2) |>
  ungroup()

head(ex_top_by_species |> select(name, species, height), 4)
#> # A tibble: 4 × 3
#>   name          species  height
#>   <chr>         <chr>     <int>
#> 1 Ratts Tyerell Aleena       79
#> 2 Dexter Jett.  Besalisk    198
#> 3 Ki-Adi-Mundi  Cerean      198
#> 4 Mas Amedda    Chagrian    196
```

**Explanation:** The grouped `slice_max()` runs independently inside each species, returning up to 2 rows per group. Species with only one character (like Aleena) return just that one.

</details>

## Is top_n() still the right way to get the top rows?

If you've read older dplyr tutorials you've seen `top_n()` — a function that grabs the top N rows by some column. It still works, but as of dplyr 1.0.0 (May 2020) it's officially superseded by `slice_max()` and `slice_min()`. Superseded means "still supported forever, but not the recommended choice anymore" — new code should use the slice family.

```r
# Superseded (still works):
old_top_n <- mtcars |>
  top_n(3, mpg)

# Recommended:
new_top <- mtcars |>
  slice_max(mpg, n = 3)

# Same result:
identical(old_top_n, new_top)
#> [1] TRUE
```

Both lines return the three highest-mpg cars. Why was `top_n()` superseded? Two reasons: its argument order (`n` first, then the column) was inconsistent with the rest of the slice family, and `slice_max()` offers explicit `with_ties` and `prop` arguments for controlling ties and proportional sampling. The migration is a one-for-one replacement — no behavior changes to worry about.

[NOTE]
**Don't rewrite working top_n() code just for cosmetics.** Superseded functions remain in dplyr indefinitely. Update when you're touching the code anyway or when a colleague asks, but don't churn files just to modernize.

**Try it:** Rewrite `mtcars |> top_n(4, hp)` using `slice_max()` and confirm the results match. Save to `ex_top_hp`.

```r
# Try it: modernize top_n()
ex_top_hp <- mtcars |>
  # your code here

nrow(ex_top_hp)
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_top_hp <- mtcars |>
  slice_max(hp, n = 4)

nrow(ex_top_hp)
#> [1] 4

ex_top_hp |> select(hp)
#>                      hp
#> Maserati Bora       335
#> Ford Pantera L      264
#> Duster 360          245
#> Camaro Z28          245
```

**Explanation:** Same rows, cleaner syntax. Note the last two cars tie at 245 hp — `slice_max()` returns both by default (`with_ties = TRUE`).

</details>

## Practice Exercises

These capstones combine arrange, slice, and group_by patterns. Use `my_*` prefixed variables so exercise code doesn't clobber tutorial state.

### Exercise 1: Second-heaviest per species

In `starwars`, find the second-heaviest character of each species (not the heaviest — exactly the second). Ignore rows with missing `mass`. Save to `my_second_heaviest` with columns `name`, `species`, and `mass`.

```r
# Exercise 1: second-heaviest per species
# Hint: arrange inside the group, then slice position 2

my_second_heaviest <- starwars |>
  # write your code

head(my_second_heaviest, 5)
```

<details>
<summary>Click to reveal solution</summary>

```r
my_second_heaviest <- starwars |>
  filter(!is.na(mass)) |>
  group_by(species) |>
  arrange(desc(mass), .by_group = TRUE) |>
  slice(2) |>
  ungroup() |>
  select(name, species, mass)

head(my_second_heaviest, 5)
#> # A tibble: 5 × 3
#>   name           species    mass
#>   <chr>          <chr>     <dbl>
#> 1 R5-D4          Droid        32
#> 2 Taun We        Kaminoan     ...
#> 3 Yarael Poof    Quermian     ...
#> 4 Luminara U.    Mirialan     ...
#> 5 Greedo         Rodian       74
```

**Explanation:** After sorting within each group (`.by_group = TRUE`), `slice(2)` picks the row in position 2. Species with only one member are silently dropped — that's the correct behavior here since "second-heaviest" is undefined for a group of one.

</details>

### Exercise 2: Bottom 3 and top 3 in one table

From `mtcars`, build a single table containing the 3 worst-mpg and 3 best-mpg cars, with a `rank` column marking "bottom" or "top". Save to `my_extremes`.

```r
# Exercise 2: bottom 3 + top 3 combined
# Hint: bind_rows() two slice results

my_extremes <- bind_rows(
  # write your code
)

my_extremes
```

<details>
<summary>Click to reveal solution</summary>

```r
my_extremes <- bind_rows(
  mtcars |> slice_min(mpg, n = 3) |> mutate(rank = "bottom"),
  mtcars |> slice_max(mpg, n = 3) |> mutate(rank = "top")
)

my_extremes |> select(mpg, rank)
#>                      mpg   rank
#> Cadillac Fleetwood  10.4 bottom
#> Lincoln Continental 10.4 bottom
#> Camaro Z28          13.3 bottom
#> Toyota Corolla      33.9    top
#> Fiat 128            32.4    top
#> Honda Civic         30.4    top
```

**Explanation:** `bind_rows()` stacks two tables vertically. Adding a `rank` column with `mutate()` before binding keeps each slice's origin traceable. Note the tie at 10.4 mpg produces 3 rows in the bottom even though we asked for 3 — ties include extra rows by default.

</details>

### Exercise 3: Random sample stratified by group

Take a random sample of 2 cars from each cylinder group in `mtcars`, reproducible with a seed. Save to `my_stratified_sample`. Result should have 6 rows total (2 per cylinder class × 3 classes).

```r
# Exercise 3: stratified random sample
# Hint: set.seed + group_by + slice_sample

set.seed(123)

my_stratified_sample <- mtcars |>
  # write your code

nrow(my_stratified_sample)
#> Expected: 6
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(123)

my_stratified_sample <- mtcars |>
  group_by(cyl) |>
  slice_sample(n = 2) |>
  ungroup()

nrow(my_stratified_sample)
#> [1] 6

my_stratified_sample |> select(mpg, cyl)
#> # A tibble: 6 × 2
#>     mpg   cyl
#>   <dbl> <dbl>
#> 1  33.9     4
#> 2  24.4     4
#> 3  21.4     6
#> 4  19.7     6
#> 5  15.5     8
#> 6  19.2     8
```

**Explanation:** `slice_sample()` inside a grouped pipeline samples independently within each group — the same stratification trick used in train/test splits. `set.seed()` makes the result reproducible across runs.

</details>

## Complete Example

Here's a realistic end-to-end pipeline that threads every verb from this tutorial together. Question: *what are the 3 tallest Star Wars characters in each homeworld that has at least 2 characters, sorted by homeworld and height?*

```r
sw_top_mass <- starwars |>
  filter(!is.na(height), !is.na(homeworld)) |>
  group_by(homeworld) |>
  filter(n() >= 2) |>
  slice_max(height, n = 3) |>
  arrange(homeworld, desc(height)) |>
  ungroup() |>
  select(name, homeworld, height)

head(sw_top_mass, 8)
#> # A tibble: 8 × 3
#>   name              homeworld  height
#>   <chr>             <chr>       <int>
#> 1 Bail Prestor Or.  Alderaan      191
#> 2 Leia Organa       Alderaan      150
#> 3 Chewbacca         Kashyyyk      228
#> 4 Tarfful           Kashyyyk      234
#> 5 Biggs Darklighter Corellia      183
#> 6 Han Solo          Corellia      180
#> 7 Dormé             Naboo         165
#> 8 Padmé Amidala     Naboo         185
```

Every line corresponds to one intent: *drop rows with missing height or homeworld*, *for each homeworld*, *keep only homeworlds with 2+ characters*, *take the 3 tallest*, *sort nicely*, *clean up grouping*, *show just the columns we care about*. That's the tidyverse in its natural habitat — each verb small and focused, the pipeline reading top to bottom like a recipe.

## Summary

| Verb | What it does | Typical use |
|---|---|---|
| `arrange(col)` | Sorts rows ascending by `col` | Alphabetize a list |
| `arrange(desc(col))` | Sorts rows descending | Leaderboard, highest first |
| `arrange(a, desc(b))` | Multi-column sort with tie-break | Category then metric |
| `slice(1:5)` | First 5 rows by position | Preview head of data |
| `slice(c(1, 3, 5))` | Specific positions | Pick odd-indexed rows |
| `slice(-1)` | Drop rows by position | Remove header row |
| `slice_head(n = 5)` | First N (same as head) | Self-documenting version of head |
| `slice_max(col, n = 5)` | Top N by value | "Top 5 by revenue" |
| `slice_min(col, n = 5)` | Bottom N by value | "Cheapest 5 items" |
| `slice_sample(n = 5)` | Random N rows | Quick data check, bootstrap |
| `group_by() \|> slice_max()` | Top N per group | Leaderboard within each category |
| `top_n()` | Superseded — prefer `slice_max()` | Legacy code only |

## References

1. dplyr reference — `arrange()`. [Link](https://dplyr.tidyverse.org/reference/arrange.html)
2. dplyr reference — `slice()` and the `slice_*()` family. [Link](https://dplyr.tidyverse.org/reference/slice.html)
3. dplyr reference — `top_n()` (superseded). [Link](https://dplyr.tidyverse.org/reference/top_n.html)
4. Posit tidyverse blog — dplyr 1.0.0 release notes introducing `slice_*()`. [Link](https://www.tidyverse.org/blog/2020/03/dplyr-1-0-0-select-rename-relocate/)
5. Wickham, H., & Grolemund, G. — *R for Data Science*, Chapter 4: Data Transformation. [Link](https://r4ds.hadley.nz/data-transform.html)
6. R documentation — `order()` base function. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/order.html)
7. dplyr grouping vignette — grouped operations. [Link](https://dplyr.tidyverse.org/articles/grouping.html)

## Continue Learning

1. **[dplyr filter() and select()](dplyr-filter-select.html)** — Row and column subsetting, the verbs you reach for alongside arrange and slice.
2. **[dplyr group_by() and summarise()](dplyr-group-by-summarise.html)** — Aggregate data by group, pairs naturally with grouped slice_max for top-N-per-group.
3. **[dplyr mutate() and rename()](dplyr-mutate-rename.html)** — Add computed columns, useful for creating the columns you'll sort or slice by.
