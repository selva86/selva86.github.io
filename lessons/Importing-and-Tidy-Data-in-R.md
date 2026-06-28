---
title: "Data Wrangling Lesson 1: Import & Tidy Data"
description: "Read a real CSV into R with readr, fix the column-type snag that bites beginners, and learn the three rules of tidy data that make every later step easy."
keywords: "read_csv, readr, import CSV in R, tidy data, tidyverse, pivot_longer, column types, data wrangling"
post_type: "LESSON"
curriculum_id: "2.1.1"
webr: true
lesson_access: "free"
course_id: "da-dplyr"
course_title: "Data Wrangling with dplyr"
course_lesson: "1"
course_total: "4"
course_landing: "Data-Wrangling-dplyr-Course.html"
course_next: "The-dplyr-Verbs.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## Getting data in, and into shape

Maya runs a small neighbourhood bakery. Every analysis she will ever do, counting her best-selling loaf, charting sales by week, forecasting next month, starts with two unglamorous steps: getting the numbers off her till and into R, and arranging them into a shape R can actually work with.

Those two steps are this lesson. Skip them and everything downstream fights you; get them right and the rest of the course flows.

By the end you will be able to:

- Read a real CSV into R with `read_csv()` and check the column types it picked
- Spot and fix the single most common import snag: a number column read as text
- State the three rules of tidy data and reshape a messy table to obey them

**Prerequisites:** you can run R and load a package with `library()`. We define every other term as it appears.

::widget process-flow {"steps":[{"title":"Import","sub":"read the raw file into a data frame"},{"title":"Tidy","sub":"one variable per column, one observation per row"},{"title":"Analyze","sub":"filter, summarise, plot and model with ease"}]}

=== step === concept
::eyebrow The idea
## A CSV is just text, read_csv brings it in

Maya exports her sales as `sales.csv`. Open it in any text editor and it is plain text: the first line names the columns, every line after is one sale, with commas between the values. Your R session starts empty, so we write Maya's exact export to a file here, then read it back the way you would read one of your own:

```r
library(readr)                 # read_csv()
library(dplyr)                 # tibble(), the pipe, group_by(), summarise()
library(tidyr)                 # pivot_longer()

# the raw lines Maya's till produced, one sale per line:
csv_text <- c(
  "date,item,units,revenue",
  "2024-03-01,Sourdough,18,81.0",
  "2024-03-01,Bagel,40,60.0",
  "2024-03-02,Sourdough,22,99.0",
  "2024-03-02,Croissant,n/a,57.0"
)
writeLines(csv_text, "sales.csv")   # save it as a real file to read back
```

The `read_csv()` function from the **readr** package turns that file into a **tibble**: a tidy table of data, the modern data frame. Each named column becomes a column, each line becomes a row.

```r
sales <- read_csv("sales.csv")
sales
#> # A tibble: 4 x 4
#>   date       item      units revenue
#>   <date>     <chr>     <chr>   <dbl>
#> 1 2024-03-01 Sourdough 18       81
#> 2 2024-03-01 Bagel     40       60
#> 3 2024-03-02 Sourdough 22       99
#> 4 2024-03-02 Croissant n/a      57
```

Look under each column name: `<date>`, `<chr>`, `<dbl>`. Those are the column **types** R inferred. They matter, and one of them is already wrong.

=== step === concept
::eyebrow How it works
## readr guesses each column's type

`read_csv()` reads a sample of values from each column and guesses one type for the whole column: `<dbl>` for numbers (a "double", any number with or without decimals), `<chr>` for text ("character"), `<date>` for ISO dates like `2024-03-01`. You can ask it exactly what it decided with `spec()`:

```r
spec(sales)            # the column types read_csv inferred
#> cols(
#>   date = col_date(format = ""),
#>   item = col_character(),
#>   units = col_character(),
#>   revenue = col_double()
#> )
```

See the problem? `units` is a count of loaves, it should be a number (`<dbl>`), but readr filed it under `col_character()`, text. The culprit is row 4: Maya typed `n/a` the day she forgot to count the croissants. Because `n/a` is not a number, readr decided the safest type for the whole column was text.

[KEY INSIGHT]
A column's type is inferred from its values, and it is all-or-nothing: a single non-numeric token like `n/a` drops the entire column to text. You cannot do arithmetic on text, so `sum(units)` would fail until you fix this.

This is the most common import snag there is. The good news: it is a one-line fix.

=== step === quiz
::eyebrow Check yourself
## Why did units come in as text?

`read_csv()` read Maya's `units` column as `<chr>` (text) instead of `<dbl>` (a number). What caused that?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Loaf counts are whole numbers, and readr stores whole numbers as text ::no No, whole numbers are still numbers (`<dbl>`); `revenue` has decimals and `units` does not, yet that is not why either was typed the way it was. The cause is a specific value in the column.
- One cell held "n/a", which is not a number, so readr typed the whole column as text ::ok Exactly. Type is inferred per column from its values, and it is all-or-nothing: one non-numeric token forces the entire column to `<chr>`.
- read_csv always reads the third column as text ::no Position has nothing to do with it. readr guesses each column independently from the values it contains, not from where the column sits.

=== step === tryit
::eyebrow Your turn
## Fix it in one argument

Tell `read_csv()` that `n/a` means "missing". The `na` argument lists every token that should be read as a missing value (`NA`). Add `n/a` to the usual set so the `units` column parses as a number. Fill in the blank.

```r
sales <- read_csv("sales.csv",
                  na = c("", "NA", ____))
sales$units            # now a number, with NA where "n/a" was
#> [1] 18 40 22 NA
```
::check {"regex":"na\\s*=\\s*c[^)]*n/a","gate":true,"difficulty":"beginner","ok":"That is the fix: n/a is now treated as missing, so units parses as <dbl> with a clean NA in row 4. For trickier files you can also set types directly with col_types.","no":"List n/a among the missing-value tokens: na = c(\"\", \"NA\", \"n/a\")."}
::solution
```r
sales <- read_csv("sales.csv",
                  na = c("", "NA", "n/a"))
```

=== step === concept
::eyebrow A new problem
## The data is in. Is it in the right shape?

Maya keeps a second little sheet: loaves sold per item, per week. She built it the natural human way, one column per week:

| item | week1 | week2 | week3 |
|------|-------|-------|-------|
| Sourdough | 18 | 22 | 25 |
| Bagel | 40 | 38 | 44 |
| Croissant | 15 | 19 | 12 |

In R that sheet is just a tibble we can build directly:

```r
weekly <- tibble(
  item  = c("Sourdough", "Bagel", "Croissant"),
  week1 = c(18, 40, 15),
  week2 = c(22, 38, 19),
  week3 = c(25, 44, 12)
)
weekly
#> # A tibble: 3 x 4
#>   item      week1 week2 week3
#>   <chr>     <dbl> <dbl> <dbl>
#> 1 Sourdough    18    22    25
#> 2 Bagel        40    38    44
#> 3 Croissant    15    19    12
```

Easy to read, but awkward for analysis: the variable *week* is hidden in the column **headers**, and the variable *units sold* is smeared across three columns. To plot units over time, or average them, you would be wrestling the table first.

In 2014 Hadley Wickham named the shape that avoids this. A table is **tidy** when it follows three rules:

1. **One variable per column** (here: `item`, `week`, and `units` should each be their own column)
2. **One observation per row** (one item-week sale per row)
3. **One value per cell** (never `12 loaves` or `2024-03-01/02` crammed into a single cell)

Maya's sheet breaks rule 1: `week1`, `week2`, `week3` are not three variables, they are three *values* of the one variable `week`.

=== step === widget
::eyebrow See it move
## Watch a messy table become tidy

Here is Maya's weekly sheet. Toggle between **Wide** (her layout) and **Long (tidy)** and watch what happens: the three week columns collapse into two tidy columns, a `week` column holding the old headers and a `units` column holding the values. The tinted cells show exactly where each number lands.

::widget reshape-grid {"wide":{"cols":["item","week1","week2","week3"],"rows":[["Sourdough",18,22,25],["Bagel",40,38,44],["Croissant",15,19,12]]},"idCols":["item"],"namesTo":"week","valuesTo":"units"}

Same numbers, new shape. The tidy table is taller (one row per item-week) and, as you will see, far easier to work with. The reshape itself is one `tidyr` function, `pivot_longer()`, which you will run in a moment.

=== step === quiz
::eyebrow Check yourself
## Which table is tidy?

Maya's weekly sheet has `item`, `week1`, `week2`, `week3`. The reshaped version has `item`, `week`, `units`. Which one is tidy, and why?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- The wide one, because it is more compact and easier for a person to read ::no Compactness is about display, not tidiness. Wide is fine for a human to glance at, but it hides a variable (`week`) in the column headers, which breaks rule 1.
- Neither, because tidy data also has to be sorted and free of typos ::no Tidy is purely about shape, one variable per column, one observation per row, one value per cell. Sorting and spelling are separate cleaning steps.
- The long one (item, week, units), because each variable has its own column ::ok Right. `week` and `units` are now proper columns, one observation (an item in a week) per row. That is the tidy shape every dplyr verb and ggplot expects.

=== step === concept
::eyebrow Why bother
## Tidy shape makes everything downstream easy

Tidiness is not tidiness for its own sake. The whole tidyverse, every dplyr verb, every ggplot, most models, is built to expect one-variable-per-column, one-observation-per-row. Once Maya's sheet is tidy (you reshape it on the very next screen), the analysis becomes one readable line each. (The `%>%` below is the **pipe**; read it as "and then": it hands the table on its left to the next function. Lesson 2 covers it properly.)

```r-static
# average loaves per item: trivial when week and units are columns
tidy_weekly %>%
  group_by(item) %>%
  summarise(avg_units = mean(units))
#> # A tibble: 3 x 2
#>   item      avg_units
#>   <chr>         <dbl>
#> 1 Bagel          40.7
#> 2 Croissant      15.3
#> 3 Sourdough      21.7

# units over time, one line per item, because week is now a column:
library(ggplot2)
ggplot(tidy_weekly, aes(week, units, colour = item)) +
  geom_line()
```

Try either of those on the wide sheet and you cannot: there is no single `week` column to group by or put on the x-axis. You would have to reshape first anyway.

[NOTE]
Wide is not "wrong". For a human-readable report or a printed summary, a wide table is often clearer. The rule of thumb: store and analyse in tidy (long) shape, then reshape to wide only at the very end for display. Lesson 2 onward assumes your data arrives tidy.

=== step === tryit
::eyebrow Your turn
## Reshape Maya's sheet to tidy

Use `pivot_longer()` to fold the three week columns into a tidy pair. `cols` says which columns to fold, `names_to` names the column that will hold the old headers (`week`), and `values_to` names the column that will hold the numbers. Fill in the last blank.

```r
tidy_weekly <- weekly %>%
  pivot_longer(cols = week1:week3,
               names_to  = "week",
               values_to = ____)
tidy_weekly
#> # A tibble: 9 x 3  (item, week, units)
```
::check {"regex":"values_to\\s*=\\s*\\S*units","gate":true,"difficulty":"beginner","ok":"That is it: the values land in a column named units, giving the tidy item/week/units table, nine rows, ready for dplyr and ggplot.","no":"The numbers should land in a column called units: values_to = \"units\"."}
::solution
```r
tidy_weekly <- weekly %>%
  pivot_longer(cols = week1:week3,
               names_to  = "week",
               values_to = "units")
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Data import](https://r4ds.hadley.nz/data-import) - readr, `read_csv()`, column types, and reading real files, free and canonical.
- [R for Data Science (2e), Data tidying](https://r4ds.hadley.nz/data-tidy) - the three rules of tidy data with worked `pivot_longer()` examples.
- [Wickham (2014), Tidy Data, Journal of Statistical Software 59(10)](https://doi.org/10.18637/jss.v059.i10) - the original paper that defined the tidy-data principles you just used.
- [readr documentation](https://readr.tidyverse.org/) - every argument of `read_csv()`, including `na` and `col_types` for taking control of the import.

=== step === complete
## Lesson 1 complete

You can now get data off the disk and into the right shape, the foundation everything else stands on. You read a CSV with `read_csv()`, diagnosed and fixed a column read as the wrong type, and reshaped a messy wide table into tidy form with `pivot_longer()`.

Next, Lesson 2: The dplyr Verbs. With Maya's data now tidy, you will meet the handful of verbs, `filter`, `select`, `mutate`, `arrange`, that do the actual analysis, and the pipe that chains them into a sentence you can read aloud.
