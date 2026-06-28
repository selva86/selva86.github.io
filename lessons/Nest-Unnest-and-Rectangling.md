---
title: "Joining Data Lesson 4: Nesting & Rectangling"
catalog_blurb: "Flatten the nested data you get from APIs and spreadsheets."
description: "List-columns in R: nest() bundles each group into a cell, map() runs a summary or model over each, then unnest() and unnest_wider flatten nested data into tidy rows."
keywords: "nest, unnest, list columns, rectangling, unnest_wider, unnest_longer, hoist, purrr map, many models, tidyr in R"
post_type: "LESSON"
curriculum_id: "2.2.4"
webr: true
lesson_access: "free"
course_id: "da-joins"
course_title: "Joining and Reshaping Data in R"
course_lesson: "4"
course_total: "4"
course_landing: "Join-Reshape-Course.html"
course_next: ""
course_prev: "Splitting-Uniting-and-Fuzzy-Joins.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## Nesting & Rectangling
In Lesson 3 you cleaned messy columns and keys. This is the last reshape in the course, and the most surprising one: a single cell can hold not a word or a number, but an **entire table**.

Maya, who runs a small bakery, has grown to three branches: Riverside, Hilltop and Station. She keeps one tidy row per branch per month, and now she wants one thing *per branch*: first an average, then a sales **trend** (is this branch growing or shrinking?). Doing that branch by branch, by hand, is exactly the tedium this lesson removes.

By the end you will be able to:

- Build a **list-column** (a column whose cells are whole tables) with `nest()`
- Run a summary, and even a whole **model**, over every group at once with `map()`, and flatten the result with `unnest()`
- **Rectangle** nested, JSON-like data into tidy rows and columns with `unnest_wider()`, `unnest_longer()` and `hoist()`

**Prerequisites:** you can run R, and you know a [tibble](Importing-and-Tidy-Data-in-R.html), the pipe `%>%` and the [dplyr verbs](The-dplyr-Verbs.html). You met `nest()` briefly in [Lesson 2](Pivoting-Long-and-Wide-in-R.html); here we build on it properly. Press Run to see where we are heading.

::widget table-transform {"code":"by_branch %>% mutate(avg_units = map_dbl(data, ~ mean(.x$units)))","caption":"Each data cell holds a whole month-by-units table for one branch. Press Run to compute a single average per branch straight from those bundled tables, with no loop.","before":{"cols":["branch","data"],"rows":[["Riverside","tibble 3x2",44.3],["Hilltop","tibble 3x2",30.3],["Station","tibble 3x2",55.7]]},"after":{"cols":["branch","data","avg_units"],"rows":[["Riverside","tibble 3x2",44.3],["Hilltop","tibble 3x2",30.3],["Station","tibble 3x2",55.7]]}}

=== step === concept
::eyebrow The new idea
## A cell can hold a table

Every table you have made so far holds simple values: a cell is one number, one word, one date. A **list-column** breaks that rule. Each of its cells holds a whole R object, and the object we care about here is a smaller **tibble**. Picture a column called `data` where the Riverside cell *is* Riverside's little month-and-units table, the Hilltop cell is Hilltop's, and so on.

Why would you want that? Because once each branch's rows are bundled into a single cell, you can do **one operation per branch** (compute a trend, fit a model, write one file) while still treating the whole thing as one tidy table of three rows.

Each lesson runs in a fresh R session, so we build Maya's three-branch sales right here as a tidy long table. `month` is stored as a number (month 1 is January) so we can model the trend later:

```r
library(dplyr)    # the pipe and the verbs
library(tidyr)    # nest(), unnest(), unnest_wider(), unnest_longer(), hoist()
library(purrr)    # map(), map_dbl()
library(tibble)   # tribble()

sales <- tribble(
  ~branch,     ~month, ~units,
  "Riverside",  1,     40,
  "Riverside",  2,     44,
  "Riverside",  3,     49,
  "Hilltop",    1,     33,
  "Hilltop",    2,     30,
  "Hilltop",    3,     28,
  "Station",    1,     52,
  "Station",    2,     55,
  "Station",    3,     60
)
sales
#> # A tibble: 9 x 3
#>   branch    month units
#>   <chr>     <dbl> <dbl>
#> 1 Riverside     1    40
#> 2 Riverside     2    44
#> 3 Riverside     3    49
#> # ... 6 more rows
```

Nine rows, three branches. The next move folds each branch's three rows into a single cell.

=== step === concept
::eyebrow Pack the groups
## nest() folds each group into a list-column

`nest()` takes the rows belonging to each group and tucks them into one cell. You name the grouping column with `.by`, and everything else is bundled into a new list-column called `data`:

```r
by_branch <- sales %>%
  nest(.by = branch)   # one row per branch; the rest folds into `data`
by_branch
#> # A tibble: 3 x 2
#>   branch    data
#>   <chr>     <list>
#> 1 Riverside <tibble [3 x 2]>
#> 2 Hilltop   <tibble [3 x 2]>
#> 3 Station   <tibble [3 x 2]>
```

Three rows now, one per branch. The `data` column is not a number or a word: each cell holds a small `month`/`units` tibble, the three sales for that branch. Read the result as a picture:

| branch | data (a whole tibble in one cell) |
|--------|-----------------------------------|
| Riverside | month/units: (1, 40), (2, 44), (3, 49) |
| Hilltop | month/units: (1, 33), (2, 30), (3, 28) |
| Station | month/units: (1, 52), (2, 55), (3, 60) |

[KEY INSIGHT]
`nest()` does not summarise or throw anything away. It re-files the same nine rows inside three cells. `unnest(data)` is the exact undo and rebuilds the original table, so the round trip is lossless, just like `pivot_longer()` and `pivot_wider()` in Lesson 2.

=== step === quiz
::eyebrow Check yourself
## What did nest() actually do?

`sales` has 9 rows across 3 branches. After `by_branch <- sales %>% nest(.by = branch)`, how many rows does `by_branch` have, and can you get the original 9 back?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- 9 rows; `nest()` just adds a `data` column alongside the others ::no `nest()` COLLAPSES each group to a single row: 3 branches give 3 rows, each carrying that branch's rows folded into one `data` cell.
- 3 rows, and `unnest(data)` rebuilds all 9; nesting is lossless ::ok Right. One row per branch, and the rows are not gone, just re-filed inside the `data` cells. `unnest(data)` spills them straight back out, exactly like a pivot round trip.
- 3 rows, but the other 6 rows are summarised away ::no `nest()` never summarises or drops anything. All 9 rows are still there, tucked inside the three `data` cells; nothing is averaged or lost.

=== step === concept
::eyebrow The whole point
## map() runs a function on every cell at once

Now the payoff. Because each branch's table sits in one cell, you can hand the **whole** `data` column to `map()` and it applies your function to every cell, returning one result per branch. Use `map_dbl()` when each answer is a single number:

```r
by_branch %>%
  mutate(avg_units = map_dbl(data, ~ mean(.x$units)))
#> # A tibble: 3 x 3
#>   branch    data             avg_units
#>   <chr>     <list>               <dbl>
#> 1 Riverside <tibble [3 x 2]>      44.3
#> 2 Hilltop   <tibble [3 x 2]>      30.3
#> 3 Station   <tibble [3 x 2]>      55.7
```

Read `~ mean(.x$units)` as a tiny throwaway function: for each cell, call that cell `.x` (a branch's tibble) and return the mean of its `units` column. `map_dbl` collects the three means into a new column.

[NOTE]
For a plain mean you did not strictly need nesting at all, `group_by(branch) %>% summarise(avg_units = mean(units))` gives the same numbers. List-columns earn their keep when the per-group answer is something a summary table cannot hold, like a whole model. That is the next step. Press Run to watch the average appear for each bundled table.

::widget table-transform {"code":"by_branch %>% mutate(avg_units = map_dbl(data, ~ mean(.x$units)))","caption":"map_dbl walks down the data column, runs mean on each bundled table, and returns one number per branch: 44.3, 30.3, 55.7.","before":{"cols":["branch","data"],"rows":[["Riverside","tibble 3x2",44.3],["Hilltop","tibble 3x2",30.3],["Station","tibble 3x2",55.7]]},"after":{"cols":["branch","data","avg_units"],"rows":[["Riverside","tibble 3x2",44.3],["Hilltop","tibble 3x2",30.3],["Station","tibble 3x2",55.7]]}}

=== step === concept
::eyebrow The killer app
## A whole model per group, then flatten it

Maya's real question is not the average, it is the **trend**: is each branch growing? Fit a straight line `units ~ month` to every branch and read its **slope** (units gained per month). `map()` stores a whole `lm` model in a list-column; a second `map_dbl()` pulls each model's slope out:

```r
fits <- by_branch %>%
  mutate(model = map(data, ~ lm(units ~ month, data = .)),
         slope = map_dbl(model, ~ coef(.)[["month"]]))

fits %>% select(branch, slope)
#> # A tibble: 3 x 2
#>   branch    slope
#>   <chr>     <dbl>
#> 1 Riverside   4.5
#> 2 Hilltop    -2.5
#> 3 Station     4
```

There it is: Riverside and Station are climbing (+4.5 and +4 units a month), but **Hilltop's slope is negative**, its sales are sliding. You just fit three separate regressions without a single loop. This nest then map pattern is how analysts fit "many models" at once.

A list-column of models is not a final answer, though; eventually you flatten back to a plain table. `unnest()` does that. Map a small **summary tibble** over each branch, then unnest it into ordinary columns:

```r
by_branch %>%
  mutate(stats = map(data, ~ tibble(total = sum(.x$units),
                                    peak  = max(.x$units)))) %>%
  select(branch, stats) %>%
  unnest(stats)
#> # A tibble: 3 x 3
#>   branch    total  peak
#>   <chr>     <dbl> <dbl>
#> 1 Riverside   133    49
#> 2 Hilltop      91    28
#> 3 Station     167    60
```

That is the full arc: **nest** to bundle, **map** to compute per group, **unnest** to flatten back to tidy rows.

=== step === tryit
::eyebrow Your turn
## Add a peak-sales column

Maya wants each branch's **peak**: the most `units` it ever sold in a single month, as a new column. The answer is one number per branch, so reach for the number-returning member of the map family. Fill in the verb, then check it.

```r
by_branch %>%
  mutate(peak = ____(data, ~ max(.x$units)))
#> a peak column: Riverside 49, Hilltop 33, Station 60
```
::check {"regex":"map_dbl","gate":true,"difficulty":"intermediate","ok":"Exactly. map_dbl runs max() on each branch's table and returns one number per branch (49, 33, 60). Use map_dbl when the per-group answer is a single number; plain map() would keep the results in a list-column instead.","no":"The per-group answer is a single NUMBER, so use the double-returning map: map_dbl(data, ~ max(.x$units))."}
::solution
```r
by_branch %>%
  mutate(peak = map_dbl(data, ~ max(.x$units)))
```

=== step === concept
::eyebrow The other direction
## Rectangling: nested data arriving from outside

So far you built list-columns yourself with `nest()`. But list-columns also arrive **uninvited**: data from an app, an API or a JSON file often lands with cells that are already nested records or lists. Turning that mess into a flat, tidy table is called **rectangling**, and the verb you reach for depends on the **shape** of the cell.

**A named record spreads sideways into columns** with `unnest_wider()`. Maya's loyalty export gives each customer a `profile` cell holding fields like city and age:

```r
people <- tibble(
  customer = c("Ana", "Ben", "Cy"),
  profile  = list(
    list(city = "Pune",   age = 30),
    list(city = "Delhi",  age = 41),
    list(city = "Mumbai", age = 25)
  )
)

people %>% unnest_wider(profile)
#> # A tibble: 3 x 3
#>   customer city     age
#>   <chr>    <chr>  <dbl>
#> 1 Ana      Pune      30
#> 2 Ben      Delhi     41
#> 3 Cy       Mumbai    25
```

**A vector of several values stacks downward into rows** with `unnest_longer()`. Each customer also has a list of order amounts, of different lengths:

```r
visits <- tibble(
  customer = c("Ana", "Ben"),
  orders   = list(c(12, 8, 15), c(20, 5))
)

visits %>% unnest_longer(orders)
#> # A tibble: 5 x 2
#>   customer orders
#>   <chr>     <dbl>
#> 1 Ana          12
#> 2 Ana           8
#> 3 Ana          15
#> 4 Ben          20
#> 5 Ben           5
```

And when you want just **one field** out of a deep record without unpacking the rest, `hoist()` plucks it and leaves the remainder nested:

```r
people %>% hoist(profile, city = "city")
#> # A tibble: 3 x 3
#>   customer city   profile
#>   <chr>    <chr>  <list>
#> 1 Ana      Pune   <named list [1]>
#> 2 Ben      Delhi  <named list [1]>
#> 3 Cy       Mumbai <named list [1]>
```

The three moves, matched to what the cell holds:

| The cell holds... | which goes... | verb |
|---|---|---|
| a record: named fields (city, age) | sideways, into new columns | `unnest_wider()` |
| a vector: several values (12, 8, 15) | downward, into new rows | `unnest_longer()` |
| a record, but you want one field | pull one out, keep the rest nested | `hoist()` |

[WARNING]
Real nested data is rarely uniform: some records miss a field, or use a different name. `unnest_wider()` fills the gaps with `NA` and will warn you if records disagree on their fields. Always look at the result, and reach for `hoist()` when you only need a known field or two out of a large, ragged record.

=== step === quiz
::eyebrow Check yourself
## Which rectangling verb?

Maya's import has a `profile` cell per customer holding a record like `{city: Pune, age: 30}`. She wants `city` and `age` as their own columns, one row per customer. Which verb does that?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- `unnest_longer(profile)` ::no That stacks a cell's contents DOWN into rows: she would get a `city` row and an `age` row per customer, not two columns. `unnest_longer()` is for a cell holding a vector of values, not a named record.
- `unnest_wider(profile)` ::ok Right. A named record spreads SIDEWAYS: each field (city, age) becomes its own column, one row per customer. `unnest_wider()` is the record-to-columns move.
- `pivot_wider(profile)` ::no `pivot_wider()` reshapes a flat long table around a key column; it cannot crack open a list-column. Prying apart a nested cell is the job of the `unnest_*()` / `hoist()` family.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [tidyr: nest()](https://tidyr.tidyverse.org/reference/nest.html) - the reference for nesting rows into a list-column of data frames, with every argument explained.
- [tidyr: Rectangling (vignette)](https://tidyr.tidyverse.org/articles/rectangle.html) - the canonical guide to turning deeply nested, JSON-like data into tidy tables.
- [tidyr: unnest_wider()](https://tidyr.tidyverse.org/reference/unnest_wider.html) - the record-to-columns move, plus links to `unnest_longer()` and `hoist()`.
- [purrr: map()](https://purrr.tidyverse.org/reference/map.html) - the full map family (`map`, `map_dbl`, `map_chr`, ...), the engine that runs a function over every cell.
- [R for Data Science, Many models](https://r4ds.had.co.nz/many-models.html) - the classic worked example of nest then map then a model per group, on the gapminder data.

=== step === complete
## Lesson 4 complete, and the course with it

You can now treat a column as a column of tables. You built a **list-column** with `nest()` (one row per group, lossless), ran a summary and a whole **model** over every group at once with `map()`/`map_dbl()`, flattened the results back with `unnest()`, and **rectangled** nested, JSON-like data by matching the verb to the cell's shape: `unnest_wider()` for records, `unnest_longer()` for value-lists, `hoist()` to pluck one field.

That closes **Joining and Reshaping Data in R**. Across four lessons you learned to combine two tables with joins, reshape one table between long and wide, clean the columns and keys real data throws at you, and now bundle, model and rectangle nested data. You have the full toolkit for getting scattered, messy data into one analysis-ready table, the step every project depends on. Next, point that clean data at exploratory data analysis and the first charts.
