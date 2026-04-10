---
title: "pivot_longer() and pivot_wider(): Reshape Data in R Without Losing Your Mind"
slug: "pivot_longer-pivot_wider-Reshape-Data-in-R"
description: "Reshape wide-to-long and long-to-wide in R using tidyr pivot_longer() and pivot_wider(). Learn every key argument with five before-and-after examples."
keywords: "pivot_longer, pivot_wider, tidyr, reshape data R, wide to long R, long to wide R, names_to, values_to, names_from, values_from"
auto_link_terms: "pivot_longer()|pivot_wider()|pivot longer|pivot wider|reshape data in R|wide to long format|long to wide format"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.2.8"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "pivot_longer & pivot_wider"
sidebar_order: 9
---


# pivot_longer() and pivot_wider(): Reshape Data in R Without Losing Your Mind

<p class="lead"><code>pivot_longer()</code> stacks several columns into a single name-value pair, moving data from wide to long. <code>pivot_wider()</code> does the opposite, spreading one column's values across new columns. They are inverses of each other.</p>

Reshaping data is one of those R skills that feels hard until you see it once. Then it clicks forever. Most real datasets arrive in a shape that does not match what you need for plotting or modeling. This post teaches the two tidyr functions that handle every reshape job you will meet.

## Introduction

The core problem is simple. Humans like wide tables because they are compact and easy to read. Software likes long tables because each row is a single observation. You will spend a real fraction of your analysis time moving between the two shapes.

The tidyr package ships `pivot_longer()` and `pivot_wider()` as the modern tools for this job. They replaced the older `gather()` and `spread()` in 2019 with clearer argument names and better handling of edge cases. If you still see `gather()` in old tutorials, update the syntax; the tidyverse team has retired it.

You do not need to install anything to follow along. Every code block on this page runs directly in your browser. Click Run on the first block to load the libraries, then work through the rest top to bottom. Variables carry over between blocks, just like a notebook.

## What is the difference between wide and long format?

Wide and long are two shapes that can hold the exact same information. The shape you pick depends on what you want to do next. Here is the same student-test-score dataset shown both ways.

![Wide and long are two shapes for the same data.](screenshots/pivot_longer-pivot_wider-wide-vs-long.webp)
*Figure 1: Wide and long are two shapes for the same data.*

Wide format puts one row per subject, with measurements spread across columns. Long format puts one row per measurement, with a key column saying what was measured. Let's build a small wide table and see it live.

```r
library(tidyr)
library(dplyr)

wide_scores <- tibble(
  student = c("Ava", "Ben", "Cora"),
  math    = c(90, 78, 85),
  english = c(82, 88, 91),
  science = c(75, 92, 80)
)
wide_scores
#> # A tibble: 3 x 4
#>   student  math english science
#>   <chr>   <dbl>   <dbl>   <dbl>
#> 1 Ava        90      82      75
#> 2 Ben        78      88      80
#> 3 Cora       85      91      80
```

Three students, three subjects, nine numbers. The wide table has 3 rows and 4 columns. The same nine numbers in long format would need 9 rows and only 3 columns: `student`, `subject`, `score`. Same data, different shape.

[KEY INSIGHT]
**Long format is the language of ggplot2 and group_by().** Almost every tidyverse tool assumes one row equals one observation. If a plot or summary fights you, the answer is usually to go long first.

## How does pivot_longer() turn wide data into long?

`pivot_longer()` needs you to answer three questions: which columns should be stacked, what should the new name column be called, and what should the new value column be called. That is the whole function.

![pivot_longer() needs three answers: which columns, a name column, a value column.](screenshots/pivot_longer-pivot_wider-longer-anatomy.webp)
*Figure 2: pivot_longer() needs three answers: which columns, a name column, a value column.*

Let's stack the three subject columns into one `subject` column and one `score` column.

```r
long_scores <- wide_scores |>
  pivot_longer(
    cols = c(math, english, science),
    names_to  = "subject",
    values_to = "score"
  )
long_scores
#> # A tibble: 9 x 3
#>   student subject score
#>   <chr>   <chr>   <dbl>
#> 1 Ava     math       90
#> 2 Ava     english    82
#> 3 Ava     science    75
#> 4 Ben     math       78
#> 5 Ben     english    88
#> 6 Ben     science    92
#> 7 Cora    math       85
#> 8 Cora    english    91
#> 9 Cora    science    80
```

The table went from 3 rows to 9, exactly one row per student-subject pair. The column headers `math`, `english`, and `science` became values inside the new `subject` column. The cell numbers became values inside the new `score` column. The `student` column was untouched because we did not list it in `cols`.

### Selecting cols with helpers

Listing every column by name gets tiresome fast. You can use tidyselect helpers inside `cols`, just like inside `select()`.

```r
# Everything except student
wide_scores |>
  pivot_longer(cols = -student, names_to = "subject", values_to = "score") |>
  head(4)
#> # A tibble: 4 x 3
#>   student subject score
#>   <chr>   <chr>   <dbl>
#> 1 Ava     math       90
#> 2 Ava     english    82
#> 3 Ava     science    75
#> 4 Ben     math       78
```

`-student` is the cleanest idiom for "stack everything except the id column". You can also use `starts_with("score_")`, `ends_with("_2024")`, `matches("^q\\d+$")`, or `where(is.numeric)` to pick columns by pattern or type.

[TIP]
**Use tidyselect helpers to avoid typing every column.** cols accepts anything select() accepts, including starts_with(), ends_with(), matches(), and where(is.numeric). This matters when your dataset has 50 measurement columns.

## How does pivot_wider() turn long data into wide?

`pivot_wider()` is the inverse. It takes one column full of names and spreads those names across new columns, filling each new column with values from a second column. Two arguments do the work.

![pivot_wider() needs to know the identifier, the name source, and the value source.](screenshots/pivot_longer-pivot_wider-wider-anatomy.webp)
*Figure 3: pivot_wider() needs to know the identifier, the name source, and the value source.*

Let's take the `long_scores` we just built and spread it back out.

```r
wide_again <- long_scores |>
  pivot_wider(
    names_from  = subject,
    values_from = score
  )
wide_again
#> # A tibble: 3 x 4
#>   student  math english science
#>   <chr>   <dbl>   <dbl>   <dbl>
#> 1 Ava        90      82      75
#> 2 Ben        78      88      92
#> 3 Cora       85      91      80
```

Same shape as the original `wide_scores`. `pivot_wider()` read the distinct values in `subject` ("math", "english", "science") and created one column per value. Then it read `score` and dropped each number into the correct cell.

You did not need to say which columns identify each row. `pivot_wider()` assumes any column not mentioned in `names_from` or `values_from` is an identifier. Here that means `student`. If you want to be explicit, pass `id_cols = student`.

[NOTE]
**gather() and spread() are retired.** If you see them in older code, translate to pivot_longer() and pivot_wider(). The tidyverse team no longer adds features to the old functions, and the new ones handle multi-column pivots the old ones could not.

## How do you pivot multiple value columns at once?

Real column names often pack two pieces of information together, like `avg_math_2023` or `billboard_wk1`. `pivot_longer()` can split those names into two columns in one step with `names_sep` or `names_pattern`.

Imagine a quarterly sales file. Each column name is `region_Q<n>`.

```r
sales_wide <- tibble(
  product = c("Widget", "Gadget"),
  north_Q1 = c(120, 85),
  north_Q2 = c(135, 90),
  south_Q1 = c(100, 70),
  south_Q2 = c(115, 78)
)

sales_long <- sales_wide |>
  pivot_longer(
    cols = -product,
    names_to  = c("region", "quarter"),
    names_sep = "_",
    values_to = "sales"
  )
sales_long
#> # A tibble: 8 x 4
#>   product region quarter sales
#>   <chr>   <chr>  <chr>   <dbl>
#> 1 Widget  north  Q1        120
#> 2 Widget  north  Q2        135
#> 3 Widget  south  Q1        100
#> 4 Widget  south  Q2        115
#> 5 Gadget  north  Q1         85
#> 6 Gadget  north  Q2         90
#> 7 Gadget  south  Q1         70
#> 8 Gadget  south  Q2         78
#> # ...
```

Passing a character vector to `names_to` tells `pivot_longer()` to split each old column name into that many parts. `names_sep = "_"` does the split. You went from 4 value columns to 2 tidy key columns (`region`, `quarter`) plus one value column (`sales`), all in a single call.

If the separator is not a fixed character, use `names_pattern` with a regex. For something like `sales2023q1`, you would write `names_pattern = "sales(\\d{4})q(\\d)"`.

## How do you control the pivot with names_prefix, names_sep, and values_fill?

A few extra arguments clean up messy real-world pivots. Here are the three you will reach for the most.

**`names_prefix`** strips a common prefix from column names during `pivot_longer()`. **`values_fill`** plugs holes during `pivot_wider()`. **`names_sep`** glues parts together during `pivot_wider()` when you have multiple name sources.

```r
# values_fill example: sparse sales with missing rows
sparse <- tibble(
  store = c("A", "A", "B"),
  month = c("Jan", "Feb", "Jan"),
  sales = c(100, 120, 80)
)

sparse |>
  pivot_wider(
    names_from  = month,
    values_from = sales,
    values_fill = 0
  )
#> # A tibble: 2 x 3
#>   store   Jan   Feb
#>   <chr> <dbl> <dbl>
#> 1 A       100   120
#> 2 B        80     0
```

Store B has no February row in the long input, so `pivot_wider()` would return `NA` by default. `values_fill = 0` replaces every missing cell with zero, which is what you want for count data. Use `values_fill = list(sales = 0, visits = 0)` when you have several value columns and want different fills per column.

[TIP]
**Use values_fill to close holes in panel data.** Sparse long data often becomes full of NAs when made wide. values_fill = 0 (or whatever makes sense) prevents downstream NA propagation bugs.

[WARNING]
**Duplicate key combinations become list-columns.** If two rows in your long data share the same names_from value AND the same id columns, pivot_wider() cannot decide which value to keep. It packs both into a list-column and prints a warning. Aggregate with group_by() and summarise() first, or set values_fn = sum.

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting to quote names_to and values_to

**Wrong:**
```r
wide_scores |> pivot_longer(cols = -student, names_to = subject, values_to = score)
# Error: object 'subject' not found
```

**Why it is wrong:** `names_to` and `values_to` create brand-new columns. The new names do not exist yet, so R cannot evaluate `subject` as a symbol. They must be passed as strings.

**Correct:**
```r
wide_scores |> pivot_longer(cols = -student, names_to = "subject", values_to = "score")
```

### Mistake 2: Duplicate keys silently create list-columns

**Wrong:**
```r
dupes <- tibble(id = c(1, 1, 2), key = c("a", "a", "b"), val = c(10, 20, 30))
dupes |> pivot_wider(names_from = key, values_from = val)
# Warning: Values from `val` are not uniquely identified; output will contain list-cols.
```

**Why it is wrong:** Two rows have `id = 1, key = "a"`, so `pivot_wider()` does not know whether cell `[1, "a"]` should be 10 or 20. It keeps both in a list.

**Correct:** Decide how to combine duplicates first.
```r
dupes |>
  group_by(id, key) |>
  summarise(val = sum(val), .groups = "drop") |>
  pivot_wider(names_from = key, values_from = val)
#> # A tibble: 2 x 3
#>      id     a     b
#>   <dbl> <dbl> <dbl>
#> 1     1    30    NA
#> 2     2    NA    30
```

### Mistake 3: Pivoting columns with mixed types

**Wrong:** Stacking numeric and character columns into one value column.
```r
mixed <- tibble(id = 1, name = "Ava", score = 90)
mixed |> pivot_longer(cols = c(name, score))
# value column becomes character; 90 is now "90"
```

**Why it is wrong:** A single column can hold only one type. `pivot_longer()` coerces everything to the broadest type, which is character if any column is text. You lose numeric operations on the score.

**Correct:** Pivot numeric columns and character columns separately, or keep the identifier columns out of the pivot.
```r
mixed |> pivot_longer(cols = score, names_to = "metric", values_to = "value")
```

### Mistake 4: Using cols = everything() and losing id columns

**Wrong:**
```r
wide_scores |> pivot_longer(cols = everything(), names_to = "k", values_to = "v")
# student gets stacked too, so you lose the link to the subject
```

**Why it is wrong:** `everything()` includes the identifier column. You cannot tell which score came from which student anymore.

**Correct:** Always exclude the id columns.
```r
wide_scores |> pivot_longer(cols = -student, names_to = "subject", values_to = "score")
```

## Practice Exercises

### Exercise 1: Stack year columns

The `billboard` dataset (built into tidyr) holds weekly chart ranks. Pivot the `wk1` through `wk76` columns into one `week` column and one `rank` column, then drop missing ranks.

```r
# Your turn: pivot billboard wide-to-long
# Hint: use starts_with("wk") and values_drop_na = TRUE

# Save the result to my_long
```

<details>
<summary>Click to reveal solution</summary>

```r
my_long <- billboard |>
  pivot_longer(
    cols = starts_with("wk"),
    names_to  = "week",
    values_to = "rank",
    values_drop_na = TRUE
  )
head(my_long, 3)
#> # A tibble: 3 x 5
#>   artist  track                   date.entered week   rank
#>   <chr>   <chr>                   <date>       <chr> <dbl>
#> 1 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk1      87
#> 2 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk2      82
#> 3 2 Pac   Baby Don't Cry (Keep... 2000-02-26   wk3      72
```

**Explanation:** `starts_with("wk")` picks all 76 week columns in one go. `values_drop_na = TRUE` strips rows where the song had dropped off the chart (most rows, actually).

</details>

### Exercise 2: Spread a summary table

Start from the `long_scores` you made earlier. Compute the average score per subject across all students, then pivot to one row per subject-with-average into a single-row wide table where each subject is a column.

```r
# Your turn: avg score per subject, then pivot to wide
# Hint: group_by + summarise, then pivot_wider

# Save to my_wide
```

<details>
<summary>Click to reveal solution</summary>

```r
my_wide <- long_scores |>
  group_by(subject) |>
  summarise(avg = mean(score)) |>
  pivot_wider(names_from = subject, values_from = avg)
my_wide
#> # A tibble: 1 x 3
#>   math english science
#>   <dbl>   <dbl>   <dbl>
#> 1  84.3    87      82.3
```

**Explanation:** Summarise first to collapse each subject to one row, then pivot to spread the subject names across columns. The result is a one-row tibble where each column is a subject's class average.

</details>

### Exercise 3: Split packed column names

Build this wide tibble and pivot it so that the `region` and `year` pieces of each column name become their own columns, alongside a `temp` value column.

```r
temps <- tibble(
  city = c("Delhi", "Mumbai"),
  north_2022 = c(32, 30),
  north_2023 = c(33, 31),
  south_2022 = c(29, 28),
  south_2023 = c(30, 29)
)

# Your turn: split names into region + year
# Hint: names_to takes a character vector with names_sep

# Save to my_clean
```

<details>
<summary>Click to reveal solution</summary>

```r
my_clean <- temps |>
  pivot_longer(
    cols = -city,
    names_to  = c("region", "year"),
    names_sep = "_",
    values_to = "temp"
  )
my_clean
#> # A tibble: 8 x 4
#>   city   region year   temp
#>   <chr>  <chr>  <chr> <dbl>
#> 1 Delhi  north  2022     32
#> 2 Delhi  north  2023     33
#> 3 Delhi  south  2022     29
#> 4 Delhi  south  2023     30
#> 5 Mumbai north  2022     30
#> # ...
```

**Explanation:** A two-element `names_to` plus `names_sep = "_"` tells pivot_longer() to split each old name into two parts at the underscore. One call turned four packed columns into three clean ones.

</details>

### Exercise 4: Round trip

Take `wide_scores`, pivot to long, round every score down to the nearest 10, pivot back to wide, and confirm you get the rounded version of the original.

```r
# Your turn: longer -> mutate -> wider

# Save to my_summary
```

<details>
<summary>Click to reveal solution</summary>

```r
my_summary <- wide_scores |>
  pivot_longer(-student, names_to = "subject", values_to = "score") |>
  mutate(score = floor(score / 10) * 10) |>
  pivot_wider(names_from = subject, values_from = score)
my_summary
#> # A tibble: 3 x 4
#>   student  math english science
#>   <chr>   <dbl>   <dbl>   <dbl>
#> 1 Ava        90      80      70
#> 2 Ben        70      80      90
#> 3 Cora       80      90      80
```

**Explanation:** The long shape makes the rounding operation trivial; one `mutate()` hits every score. Without the pivot, you would have to repeat the rounding for each of the three subject columns. This go-long-then-go-wide pattern is the most common reason you will reach for these functions.

</details>

## Complete Example

Here is a realistic end-to-end flow. A school has test scores in wide format, you want per-student averages and per-subject averages, and a wide-format report at the end.

```r
class_scores <- tibble(
  student = c("Ava", "Ben", "Cora", "Dev"),
  math    = c(90, 78, 85, 92),
  english = c(82, 88, 91, 79),
  science = c(75, 92, 80, 88)
)

# Step 1: go long for any math we need
long <- class_scores |>
  pivot_longer(-student, names_to = "subject", values_to = "score")

# Step 2: per-student average
student_avg <- long |>
  group_by(student) |>
  summarise(avg = mean(score))
student_avg
#> # A tibble: 4 x 2
#>   student   avg
#>   <chr>   <dbl>
#> 1 Ava      82.3
#> 2 Ben      86
#> 3 Cora     85.3
#> 4 Dev      86.3

# Step 3: pivot back to wide, attach the averages
summary_tbl <- class_scores |>
  left_join(student_avg, by = "student")
summary_tbl
#> # A tibble: 4 x 5
#>   student  math english science   avg
#>   <chr>   <dbl>   <dbl>   <dbl> <dbl>
#> 1 Ava        90      82      75  82.3
#> 2 Ben        78      88      92  86
#> 3 Cora       85      91      80  85.3
#> 4 Dev        92      79      88  86.3
```

The pivot_longer step did the real work. Once the data was long, `group_by() |> summarise()` became a one-liner. A `left_join()` glued the averages back onto the original wide table, giving a report-ready output with one row per student.

## Summary

| Function | Direction | Key arguments | Result |
|---|---|---|---|
| pivot_longer() | Wide to long | cols, names_to, values_to | More rows, fewer columns |
| pivot_wider() | Long to wide | names_from, values_from, id_cols | Fewer rows, more columns |
| names_sep | Split old names | character or regex | Multiple new name columns |
| values_fill | Plug holes | value or named list | No NA cells after widening |
| values_drop_na | Prune empties | TRUE/FALSE | Drop NA rows after longer |

- Long format is what ggplot2 and group_by() expect; go long first when in doubt.
- `names_to` and `values_to` must be quoted strings because they name new columns.
- `cols` accepts every tidyselect helper you know from `select()`.
- Duplicate keys during `pivot_wider()` create list-columns; aggregate first.

## FAQ

**When should I use pivot_longer() instead of pivot_wider()?**
Use `pivot_longer()` before any group-wise calculation, plot, or model fit. Most tidyverse tools need one-row-per-observation. Use `pivot_wider()` only at the end, when you need a human-readable report or a matrix for linear algebra.

**What replaced gather() and spread()?**
`pivot_longer()` replaced `gather()` and `pivot_wider()` replaced `spread()` in tidyr 1.0 (2019). The new functions have clearer argument names and handle multi-column names that the old functions could not.

**Can I pivot multiple value columns at once?**
Yes. Pass `values_from = c(col1, col2)` to `pivot_wider()` to create paired output columns like `col1_X`, `col2_X`, and so on. For `pivot_longer()`, use a `.value` placeholder in `names_to` together with `names_sep` to split column names into a stub and a suffix.

**Why did my values column turn into a list-column?**
Your long data had duplicate keys: two or more rows share the same `names_from` value and the same id columns. `pivot_wider()` packs all candidates into a list for you to inspect. Aggregate with `group_by() |> summarise()` or pass `values_fn = sum` to `pivot_wider()` to collapse them first.

## References

1. tidyr documentation - pivot_longer() reference. [Link](https://tidyr.tidyverse.org/reference/pivot_longer.html)
2. tidyr documentation - pivot_wider() reference. [Link](https://tidyr.tidyverse.org/reference/pivot_wider.html)
3. tidyr Pivoting vignette. [Link](https://tidyr.tidyverse.org/articles/pivot.html)
4. Wickham, H., Cetinkaya-Rundel, M., Grolemund, G. - *R for Data Science*, 2nd Edition. Chapter 6: Data Tidying. [Link](https://r4ds.hadley.nz/data-tidy.html)
5. Wickham, H. - "Tidy Data" - Journal of Statistical Software (2014). [Link](https://www.jstatsoft.org/article/view/v059i10)
6. tidyr 1.0.0 release notes. [Link](https://www.tidyverse.org/blog/2019/09/tidyr-1-0-0/)

## Continue Learning

- **[Tidy Data in R](Tidy-Data-in-R.html)** - understand the three rules of tidy data that make reshaping meaningful.
- **[dplyr group_by() and summarise()](dplyr-group-by-summarise.html)** - the next step after going long: collapse long data into summaries.
- **[R Joins with dplyr](R-Joins.html)** - join the reshaped output back onto lookup tables with inner_join() and left_join().
