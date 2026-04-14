---
title: "dplyr across() in R: Apply the Same Function to Multiple Columns at Once"
slug: "dplyr-across"
description: "Learn dplyr across() with practical R examples: apply functions to multiple columns in mutate, summarise, filter with if_any/if_all, and custom naming."
keywords: "dplyr across, across function R, mutate across, summarise across, if_any if_all, where is.numeric, .names glue, dplyr column-wise"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "FR-dply-1"
post_type: "FR"
auto_link_terms: "dplyr across|across()|if_any()|if_all()|across mutate|across summarise|column-wise dplyr"
auto_link_case_sensitive: false
fr_parent: "dplyr-mutate-rename.html"
---

# dplyr across() in R: Apply the Same Function to Multiple Columns at Once

<p class="lead"><code>across()</code> lets you apply the same function — or several functions — to many columns at once inside <code>mutate()</code>, <code>summarise()</code>, and (via <code>if_any()</code>/<code>if_all()</code>) <code>filter()</code>. It replaces the old <code>_at</code>, <code>_if</code>, and <code>_all</code> scoped verbs with one unified, tidyselect-aware tool.</p>

## How does across() round or scale many columns in one line?

The fastest way to feel why `across()` exists is to round every numeric column of a data frame in one line — instead of typing each column name. The block below loads `dplyr`, then rounds the four numeric `iris` columns to one decimal in a single `mutate(across(...))` call. The first three rows print so you can see the result.

```r
library(dplyr)

iris |>
  mutate(across(where(is.numeric), \(x) round(x, 1))) |>
  head(3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
```

All four numeric columns were rounded in a single call. The `Species` column was left untouched because `where(is.numeric)` skipped it — it is a factor, not a number. That is the whole idea behind `across()`: pick the columns with one expression, apply the function with another.

The two arguments you care about are `.cols` (which columns) and `.fns` (what function). `.cols` accepts the same selectors `select()` understands — names, helpers like `starts_with()`, or predicates like `where(is.numeric)`. `.fns` accepts a function (`mean`), an anonymous function (`\(x) round(x, 1)`), or a named list of functions for multi-output summaries.

[KEY INSIGHT]
**One verb, one selector, one function — that is the whole mental model.** Once you internalise this trio, every `across()` example in the wild becomes a variation on the same shape, no matter how baroque it looks.

**Try it:** Use `across()` to double every numeric column of `mtcars`, then show the first three rows. Save the result to `ex_doubled`.

```r
# Try it: double all numeric columns of mtcars
ex_doubled <- mtcars |>
  mutate(across(where(is.numeric), # your code here
                ))

head(ex_doubled, 3)
#> Expected: every value is twice the original
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_doubled <- mtcars |>
  mutate(across(where(is.numeric), \(x) x * 2))

head(ex_doubled, 3)
#>                    mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4         42.0  12  320 220 7.82 5.240 32.92  0  2    8    8
#> Mazda RX4 Wag     42.0  12  320 220 7.82 5.750 34.04  0  2    8    8
#> Datsun 710        45.6   8  216 186 7.70 4.640 37.61  0  2    8    8
```

**Explanation:** `where(is.numeric)` matches all columns (every `mtcars` column happens to be numeric); the lambda `\(x) x * 2` runs against each in turn.

</details>

## How do you pick which columns across() touches?

Choosing columns is half the job. `across()` accepts every selector you already know from `select()`: bare names, prefix helpers, type predicates, and exclusions. Picking the right selector is what turns a brittle script into one that survives schema changes.

```r
# 1. By name
mtcars |> summarise(across(c(mpg, hp, wt), mean))
#>        mpg     hp      wt
#> 1 20.09062 146.6875 3.21725

# 2. By prefix — every column whose name starts with "d"
mtcars |> summarise(across(starts_with("d"), mean))
#>      disp    drat
#> 1 230.7219 3.596563

# 3. By type — every numeric column
iris |> summarise(across(where(is.numeric), mean))
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width
#> 1     5.843333    3.057333        3.758    1.199333

# 4. By exclusion — every column EXCEPT the discrete ones
mtcars |> summarise(across(-c(cyl, vs, am, gear, carb), mean))
#>        mpg     disp       hp     drat      wt     qsec
#> 1 20.09062 230.7219 146.6875 3.596563 3.21725 17.84875
```

Four selectors, four different column sets — same `summarise()` shell. `c(mpg, hp, wt)` is fine for an ad-hoc one-off. `where(is.numeric)` is the workhorse: it adapts when columns are added, removed, or renamed. Prefix helpers (`starts_with`, `ends_with`, `contains`, `matches`) are best when your columns share a naming convention. Exclusion (`-c(...)`) is the inverse.

[TIP]
**Prefer `where(is.numeric)` over hard-coded names.** A pipeline that selects by type silently picks up new numeric columns the day they appear; one that lists names breaks loudly when a column gets renamed.

**Try it:** Compute the mean of every iris column whose name starts with `"Petal"`. Save the result to `ex_petal`.

```r
# Try it: mean of Petal* columns only
ex_petal <- iris |> summarise(across(  # your code here
                                    ))

ex_petal
#> Expected: two columns — Petal.Length and Petal.Width
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_petal <- iris |> summarise(across(starts_with("Petal"), mean))

ex_petal
#>   Petal.Length Petal.Width
#> 1        3.758    1.199333
```

**Explanation:** `starts_with("Petal")` matches `Petal.Length` and `Petal.Width` — the two iris columns whose names begin with that prefix.

</details>

## How do you apply several functions and name the output columns?

Often you want more than one summary per column — a mean *and* a standard deviation, or min, max, and median together. Pass a **named list** of functions to `.fns` and `across()` produces one output column per (input column, function) pair. Use `.names` to control how those output columns are named.

```r
mtcars |>
  group_by(cyl) |>
  summarise(
    across(c(mpg, hp),
           list(avg = mean, sd = sd),
           .names = "{.col}_{.fn}"),
    .groups = "drop"
  )
#> # A tibble: 3 × 5
#>     cyl mpg_avg mpg_sd hp_avg hp_sd
#>   <dbl>   <dbl>  <dbl>  <dbl> <dbl>
#> 1     4    26.7   4.51   82.6  20.9
#> 2     6    19.7   1.45  122.   24.3
#> 3     8    15.1   2.56  209.   51.0
```

Two input columns (`mpg`, `hp`) times two functions (`avg`, `sd`) yields four output columns: `mpg_avg`, `mpg_sd`, `hp_avg`, `hp_sd`. The glue spec `"{.col}_{.fn}"` joins each column name with each function name. Flip it to `"{.fn}_{.col}"` and you get `avg_mpg`, `sd_mpg`, etc. — the same numbers, different shape.

[NOTE]
**You only need `.names` when you want a different shape.** With a single function, the default name is just the column name. With many functions, the default is `"{.col}_{.fn}"`. Set `.names` only when those defaults do not match what you want.

**Try it:** Summarise mtcars with the `min` and `max` of `mpg` and `wt` together. Use `.names = "{.fn}_{.col}"` so the output columns are `min_mpg`, `max_mpg`, `min_wt`, `max_wt`. Save to `ex_minmax`.

```r
# Try it: min/max with custom .names glue
ex_minmax <- mtcars |>
  summarise(across(  # your code here
                  ))

ex_minmax
#> Expected: 4 columns — min_mpg, max_mpg, min_wt, max_wt
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_minmax <- mtcars |>
  summarise(across(c(mpg, wt),
                   list(min = min, max = max),
                   .names = "{.fn}_{.col}"))

ex_minmax
#>   min_mpg max_mpg min_wt max_wt
#> 1    10.4    33.9  1.513  5.424
```

**Explanation:** The glue `"{.fn}_{.col}"` puts the function name first, then the column name. Two columns × two functions = four outputs.

</details>

## How do you use across() inside mutate() to make new columns?

Inside `mutate()`, `across()` *replaces* the matched columns by default — the originals are gone. To keep both the original and the transformed values, pass a `.names` template that produces new column names. This is the standard feature-engineering pattern.

```r
mt_z <- mtcars |>
  mutate(across(c(mpg, hp, wt),
                \(x) round((x - mean(x)) / sd(x), 2),
                .names = "{.col}_z")) |>
  select(mpg, mpg_z, hp, hp_z, wt, wt_z)

head(mt_z, 4)
#>                    mpg mpg_z  hp  hp_z    wt  wt_z
#> Mazda RX4         21.0  0.15 110 -0.54 2.620 -0.61
#> Mazda RX4 Wag     21.0  0.15 110 -0.54 2.875 -0.35
#> Datsun 710        22.8  0.45  93 -0.78 2.320 -0.92
#> Hornet 4 Drive    21.4  0.22 110 -0.54 3.215 -0.00
```

The originals (`mpg`, `hp`, `wt`) sit next to their z-scored siblings (`mpg_z`, `hp_z`, `wt_z`). The lambda runs once per column — `mean(x)` and `sd(x)` use that column's own values, not a global mean. This is the most common shape you will reach for in real pipelines: take a few columns, transform them, keep both old and new.

[WARNING]
**Without `.names`, `across()` overwrites the originals.** If you write `mutate(across(c(mpg, hp, wt), scale))` the old `mpg`, `hp`, `wt` columns are *gone*. Set `.names = "{.col}_something"` whenever you want both versions side-by-side.

**Try it:** Add `mpg_log` and `hp_log` columns to mtcars using `log()`, keeping the originals. Save to `ex_log`.

```r
# Try it: append log() columns
ex_log <- mtcars |>
  mutate(across(c(mpg, hp), # your code here
                ))

head(ex_log[, c("mpg", "mpg_log", "hp", "hp_log")], 3)
#> Expected: 4 columns, originals + their logs
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_log <- mtcars |>
  mutate(across(c(mpg, hp), log, .names = "{.col}_log"))

head(ex_log[, c("mpg", "mpg_log", "hp", "hp_log")], 3)
#>                mpg  mpg_log  hp   hp_log
#> Mazda RX4     21.0 3.044522 110 4.700480
#> Mazda RX4 Wag 21.0 3.044522 110 4.700480
#> Datsun 710    22.8 3.126761  93 4.532599
```

**Explanation:** Passing `log` (no parentheses) tells `across()` to apply the function as-is. The `.names` glue keeps both originals and the new `*_log` columns.

</details>

## How do you filter rows with across() — using if_any() and if_all()?

`across()` itself does **not** work directly inside `filter()` — `filter()` expects a single logical vector per row, but `across()` returns one per column. The companions `if_any()` and `if_all()` collapse those per-column logicals into one row-wise verdict.

```r
# Keep rows where ANY Petal column is greater than 6
iris |>
  filter(if_any(starts_with("Petal"), \(x) x > 6)) |>
  head(3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width   Species
#> 1          7.6         3.0          6.6         2.1 virginica
#> 2          7.3         2.9          6.3         1.8 virginica
#> 3          7.7         3.8          6.7         2.2 virginica

# Keep rows where ALL Sepal columns are greater than 5
iris |>
  filter(if_all(starts_with("Sepal"), \(x) x > 5)) |>
  head(3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.4         3.9          1.7         0.4  setosa
#> 2          5.4         3.7          1.5         0.2  setosa
#> 3          5.8         4.0          1.2         0.2  setosa
```

`if_any` keeps a row when the condition fires in *at least one* selected column — useful for "anything weird?" checks like `if_any(everything(), is.na)`. `if_all` is the strict cousin: every selected column must satisfy the predicate. Same selectors, same lambdas, opposite logic.

[KEY INSIGHT]
**`if_any` is OR across columns, `if_all` is AND across columns.** Once you read the names that way, every filter you write with them becomes self-documenting — no need to remember which is which.

**Try it:** Keep `mtcars` rows where **all three** of `disp`, `hp`, and `wt` are above their own column means. Save to `ex_strong` and show the first three rows.

```r
# Try it: if_all on three columns with one shared predicate
ex_strong <- mtcars |>
  filter(if_all(c(disp, hp, wt), # your code here
                ))

head(ex_strong[, c("disp", "hp", "wt")], 3)
#> Expected: only rows where disp, hp, AND wt are each above their column mean
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_strong <- mtcars |>
  filter(if_all(c(disp, hp, wt), \(x) x > mean(x)))

head(ex_strong[, c("disp", "hp", "wt")], 3)
#>                    disp  hp    wt
#> Hornet Sportabout 360.0 175 3.440
#> Duster 360        360.0 245 3.570
#> Merc 450SE        275.8 180 4.070
```

**Explanation:** The shared predicate `\(x) x > mean(x)` runs against each of the three columns. `if_all()` keeps a row only when every column's value beats its own mean — this is the kind of uniform predicate `if_all()` is built for.

</details>

## Practice Exercises

### Exercise 1: Mean and median of every numeric column

Summarise `airquality` with the **mean** and **median** of every numeric column, ignoring missing values. Use `.names = "{.fn}_{.col}"` so the output columns are `mean_Ozone`, `med_Ozone`, etc. (use `med` not `median` as the function-name alias). Save the result to `my_aq_summary`.

```r
# Exercise 1: mean + median of every numeric airquality column
# Hint: list(mean = ..., med = ...) with na.rm = TRUE in lambdas

my_aq_summary <- airquality |>
  summarise(  # your code here
            )

my_aq_summary
```

<details>
<summary>Click to reveal solution</summary>

```r
my_aq_summary <- airquality |>
  summarise(across(where(is.numeric),
                   list(mean = \(x) mean(x, na.rm = TRUE),
                        med  = \(x) median(x, na.rm = TRUE)),
                   .names = "{.fn}_{.col}"))

my_aq_summary
#>   mean_Ozone med_Ozone mean_Solar.R med_Solar.R mean_Wind med_Wind mean_Temp med_Temp mean_Month med_Month mean_Day med_Day
#> 1   42.12931      31.5     185.9315         205  9.957516      9.7  77.88235       79          7         7 15.80392      16
```

**Explanation:** The named list `list(mean = ..., med = ...)` produces two outputs per column. The `na.rm = TRUE` lives inside the lambda because `across()` cannot pass extra arguments through `...` anymore — the lambda is the modern way.

</details>

### Exercise 2: Express columns as a percentage of their max

In `mtcars`, create new columns `mpg_pct`, `hp_pct`, and `wt_pct` that express each value as a percentage of that column's maximum. Round to one decimal. Use one `mutate(across(...))` call with `.names`. Save to `my_pct` and show the first three rows side-by-side with the originals.

```r
# Exercise 2: each column as a percentage of its max
# Hint: 100 * x / max(x), .names = "{.col}_pct"

my_pct <- mtcars |>
  mutate(  # your code here
         )

head(my_pct[, c("mpg", "mpg_pct", "hp", "hp_pct", "wt", "wt_pct")], 3)
```

<details>
<summary>Click to reveal solution</summary>

```r
my_pct <- mtcars |>
  mutate(across(c(mpg, hp, wt),
                \(x) round(100 * x / max(x), 1),
                .names = "{.col}_pct"))

head(my_pct[, c("mpg", "mpg_pct", "hp", "hp_pct", "wt", "wt_pct")], 3)
#>                mpg mpg_pct  hp hp_pct    wt wt_pct
#> Mazda RX4     21.0    61.9 110   33.5 2.620   48.3
#> Mazda RX4 Wag 21.0    61.9 110   33.5 2.875   53.0
#> Datsun 710    22.8    67.3  93   28.3 2.320   42.8
```

**Explanation:** `max(x)` runs once per column inside the lambda, producing column-specific percentages. `.names = "{.col}_pct"` keeps the originals and appends the new columns.

</details>

## Complete Example

Here is a mini end-to-end pipeline that uses every idea from this tutorial: pick all numeric columns, group by a categorical, summarise the mean of each numeric column per group, and keep only groups where at least one summary is not missing.

```r
sw_summary <- starwars |>
  select(-films, -vehicles, -starships) |>
  group_by(species) |>
  summarise(across(where(is.numeric),
                   \(x) mean(x, na.rm = TRUE)),
            .groups = "drop") |>
  filter(if_any(where(is.numeric), \(x) !is.nan(x)))

head(sw_summary, 5)
#> # A tibble: 5 × 4
#>   species   height  mass birth_year
#>   <chr>      <dbl> <dbl>      <dbl>
#> 1 Aleena       79    15        NaN
#> 2 Besalisk    198   102        NaN
#> 3 Cerean      198    82         92
#> 4 Chagrian    196   NaN        NaN
#> 5 Clawdite    168    55        NaN
```

Three `across()`-family calls cooperate. `select(-films, ...)` strips the list-columns that would break numeric summaries. `summarise(across(where(is.numeric), ...))` aggregates every remaining numeric column with one shared lambda. `filter(if_any(where(is.numeric), \(x) !is.nan(x)))` drops species rows that are entirely `NaN` — using `if_any` to mean *"keep me if any column has a real value"*.

## Summary

| Pattern | Code |
|---|---|
| Same function on all numerics | `mutate(across(where(is.numeric), fn))` |
| By name | `across(c(a, b), fn)` |
| By prefix or suffix | `across(starts_with("x"), fn)` |
| Many functions, custom names | `across(cols, list(avg = mean, sd = sd), .names = "{.col}_{.fn}")` |
| New columns, keep originals | `mutate(across(cols, fn, .names = "{.col}_new"))` |
| Filter — match ANY column | `filter(if_any(cols, \(x) x > 0))` |
| Filter — match ALL columns | `filter(if_all(cols, \(x) x > 0))` |
| Replace deprecated scoped verbs | `mutate_if(is.numeric, fn)` → `mutate(across(where(is.numeric), fn))` |

Three things to remember: `across()` is a *selector + function* pair; `.names` controls whether you keep or replace the originals; `if_any` and `if_all` are the only way to use it inside `filter()`.

## References

1. dplyr — `across()` reference. <https://dplyr.tidyverse.org/reference/across.html>
2. dplyr — Column-wise operations vignette. <https://dplyr.tidyverse.org/articles/colwise.html>
3. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 28: Iteration. <https://r4ds.hadley.nz/iteration.html>
4. tidyverse blog — dplyr 1.0.0 release notes (introduces `across()`). <https://www.tidyverse.org/blog/2020/04/dplyr-1-0-0/>
5. tidyselect — selection language reference. <https://tidyselect.r-lib.org/reference/language.html>

## Continue Learning

- [dplyr mutate() and rename()](/dplyr-mutate-rename.html) — the parent tutorial where `across()` is most often used for feature engineering.
- [dplyr group_by() and summarise()](/dplyr-group-by-summarise.html) — how `across()` slots into grouped aggregation.
- [dplyr filter() and select()](/dplyr-filter-select.html) — where `if_any()` and `if_all()` shine for row filtering.
