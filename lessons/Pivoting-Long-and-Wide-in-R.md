---
title: "Joining Data Lesson 2: Pivoting: Long & Wide"
description: "Reshape data in R with tidyr: pivot_longer takes wide data to long (tidy), pivot_wider takes long back to wide for reports, and nest and unnest handle nested data."
keywords: "pivot_longer, pivot_wider, tidyr, reshape data in R, wide to long, long to wide, nest, unnest, tidy data, list columns"
post_type: "LESSON"
curriculum_id: "2.2.2"
webr: true
lesson_access: "free"
course_id: "da-joins"
course_title: "Joining and Reshaping Data in R"
course_lesson: "2"
course_total: "3"
course_landing: "Join-Reshape-Course.html"
course_next: "Splitting-Uniting-and-Fuzzy-Joins.html"
course_prev: "Joining-Tables-in-R.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## One table, the wrong shape

In Lesson 1 you stitched two tables together with joins. But even a single, complete table can be in the wrong **shape** for the job in front of you.

Maya, who runs a small bakery, keeps her week of loaf sales on a whiteboard the way any of us would: one row per item, one column per day.

| item | Mon | Tue | Wed |
|------|-----|-----|-----|
| Sourdough | 18 | 22 | 25 |
| Bagel | 40 | 38 | 44 |
| Croissant | 15 | 19 | 12 |

Lovely to read. But the moment she wants to plot sales over the week, or average them, this shape fights her: the variable *day* is hidden in the column **headers**, not in a column she can point at. Reshaping fixes that, and reshaping is this whole lesson.

By the end you will be able to:

- Tell **wide** shape from **long** (tidy) shape, and say which one a tool wants
- Reshape wide to long with `pivot_longer()`, and long back to wide with `pivot_wider()`
- Bundle a group's rows into one cell with `nest()`, and unpack them again with `unnest()`

**Prerequisites:** you can run R, and you know a [tibble](Importing-and-Tidy-Data-in-R.html), the pipe `%>%` and the dplyr verbs from [The dplyr Verbs](The-dplyr-Verbs.html). Drag the toggle below to see where we are heading.

::widget reshape-grid {"wide":{"cols":["item","Mon","Tue","Wed"],"rows":[["Sourdough",18,22,25],["Bagel",40,38,44],["Croissant",15,19,12]]},"idCols":["item"],"namesTo":"day","valuesTo":"units"}

=== step === concept
::eyebrow The idea
## The same numbers, two shapes

Maya's whiteboard holds exactly nine numbers (three items across three days). There are two natural ways to lay them out, and they hold the identical information.

**Wide** is her whiteboard: one row per item, and one column for each day. The day lives in the header.

| item | Mon | Tue | Wed |
|------|-----|-----|-----|
| Sourdough | 18 | 22 | 25 |
| Bagel | 40 | 38 | 44 |
| Croissant | 15 | 19 | 12 |

**Long** (the tidy shape) gives every one of those nine numbers its own row, and names the two things that describe it, the `day` and the `units`, as proper columns:

| item | day | units |
|------|-----|-------|
| Sourdough | Mon | 18 |
| Sourdough | Tue | 22 |
| Sourdough | Wed | 25 |
| Bagel | Mon | 40 |
| Bagel | Tue | 38 |
| Bagel | Wed | 44 |
| Croissant | Mon | 15 |
| Croissant | Tue | 19 |
| Croissant | Wed | 12 |

Same nine sales, retold. The long table is taller and looks more repetitive, but notice what it gained: `day` is now a real column, and so is `units`. That is the difference that matters, and the next move is how you get from the first shape to the second.

=== step === concept
::eyebrow Wide to long
## pivot_longer() folds columns into rows

The move from wide to long is `pivot_longer()`, from the **tidyr** package. It takes a set of columns and folds them down into two new columns: one holding the old **names**, one holding the old **values**.

Each lesson runs in a fresh R session, so we build Maya's whiteboard right here as a tibble, then reshape it:

```r
library(tidyr)    # pivot_longer(), pivot_wider(), nest(), unnest()
library(dplyr)    # the pipe and the verbs
library(tibble)   # tribble()

# Maya's whiteboard: one row per item, one column per weekday
wk <- tribble(
  ~item,        ~Mon, ~Tue, ~Wed,
  "Sourdough",   18,   22,   25,
  "Bagel",       40,   38,   44,
  "Croissant",   15,   19,   12
)

sales_long <- wk %>%
  pivot_longer(cols      = Mon:Wed,    # the columns to fold
               names_to  = "day",      # old headers land here
               values_to = "units")    # cell values land here
sales_long
#> # A tibble: 9 x 3
#>   item      day   units
#>   <chr>     <chr> <dbl>
#> 1 Sourdough Mon      18
#> 2 Sourdough Tue      22
#> 3 Sourdough Wed      25
#> 4 Bagel     Mon      40
#> 5 Bagel     Tue      38
#> 6 Bagel     Wed      44
#> 7 Croissant Mon      15
#> 8 Croissant Tue      19
#> 9 Croissant Wed      12
```

Read the three arguments as a sentence: fold the columns `Mon` through `Wed`; put their **names** into a new column called `day`; put their **values** into a new column called `units`. The `item` column was not named in `cols`, so it is left alone and simply repeats down each item's three rows.

[KEY INSIGHT]
`pivot_longer()` always makes the table **taller and narrower**: the folded columns disappear, replaced by one `names_to` column and one `values_to` column. Three day-columns became one `day` column plus one `units` column, and three rows became nine.

Toggle the widget between Wide and Long to watch those three day columns collapse into the tidy pair. The tinted cells show exactly where each number lands.

::widget reshape-grid {"wide":{"cols":["item","Mon","Tue","Wed"],"rows":[["Sourdough",18,22,25],["Bagel",40,38,44],["Croissant",15,19,12]]},"idCols":["item"],"namesTo":"day","valuesTo":"units"}

=== step === quiz
::eyebrow Check yourself
## Which table is tidy, and what did the pivot do?

Maya's whiteboard has `item`, `Mon`, `Tue`, `Wed`. After `pivot_longer()` she has `item`, `day`, `units`. Which statement is correct?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The wide whiteboard is tidy, because it is compact and one row per item ::no Compactness is about display, not tidiness. The wide sheet hides the variable `day` in its headers, so it is not tidy. Tidy means one variable per column, one observation per row.
- The long table is tidy: `day` and `units` are now real columns, one sale per row ::ok Right. `pivot_longer()` turned the hidden header variable into a `day` column and the values into a `units` column, giving one observation (an item on a day) per row, the tidy shape.
- pivot_longer added new information that was not on the whiteboard ::no It only re-laid-out the same nine numbers. No data was created or lost; the long table holds exactly what the wide one did.

=== step === concept
::eyebrow Why bother (1)
## Tidy long data answers questions in one verb

Why prefer the taller, repetitive shape? Because once every sale is its own row, the dplyr verbs you already know work directly on it. Want only Maya's busiest line? With `units` as a real column and one sale per row, that is a single `filter()`:

```r
sales_long %>% filter(item == "Bagel")
#> # A tibble: 3 x 3
#>   item  day   units
#>   <chr> <chr> <dbl>
#> 1 Bagel Mon      40
#> 2 Bagel Tue      38
#> 3 Bagel Wed      44
```

Press Run on the widget to see that filter pick out the rows it keeps and strike through the rest. Every dplyr verb (`filter`, `mutate`, `group_by` plus `summarise`) is built to act on one-observation-per-row data, so tidy long shape is the shape that keeps your analysis to one readable line each.

::widget table-transform {"code":"sales_long %>% filter(item == \"Bagel\")","caption":"filter() keeps only the rows that match. Because the long table has one sale per row, picking Bagels is a single verb.","before":{"cols":["item","day","units"],"rows":[["Sourdough","Mon",18],["Sourdough","Tue",22],["Sourdough","Wed",25],["Bagel","Mon",40],["Bagel","Tue",38],["Bagel","Wed",44],["Croissant","Mon",15],["Croissant","Tue",19],["Croissant","Wed",12]]},"after":{"cols":["item","day","units"],"rows":[["Bagel","Mon",40],["Bagel","Tue",38],["Bagel","Wed",44]]}}

=== step === concept
::eyebrow Why bother (2)
## ggplot maps columns to the page

The same shape requirement shows up the instant Maya wants a chart. **ggplot2** draws by *mapping a column to a position on the page*: a column to the x-axis, a column to the y-axis, a column to colour. To put the day on the x-axis, there has to be a `day` column, which is exactly what the wide whiteboard lacked and the long table now has.

```r
library(ggplot2)

ggplot(sales_long, aes(x = day, y = units, fill = item)) +
  geom_col(position = "dodge") +
  labs(title = "Loaves sold by day", x = "Day", y = "Units")
```

That chart is impossible from the wide sheet: there is no single `day` column to hand to `x`, and no single `units` column for `y`. You would have to pivot to long first anyway.

[NOTE]
The rule of thumb: **store and analyse in long (tidy) shape, reshape to wide only at the very end for a human to read.** Most R models (and almost every tidyverse function) expect tidy long data going in.

=== step === concept
::eyebrow Long to wide
## pivot_wider() spreads rows back into columns

Sometimes wide is genuinely what you want: a compact grid to pin on the wall, or a table for a report. The move from long back to wide is `pivot_wider()`, the exact inverse of `pivot_longer()`. You tell it which column's values should become the new headers (`names_from`) and which column fills the cells (`values_from`):

```r
sales_wide <- sales_long %>%
  pivot_wider(names_from  = day,      # these values become column names
              values_from = units)    # these values fill the grid
sales_wide
#> # A tibble: 3 x 4
#>   item        Mon   Tue   Wed
#>   <chr>     <dbl> <dbl> <dbl>
#> 1 Sourdough    18    22    25
#> 2 Bagel        40    38    44
#> 3 Croissant    15    19    12
```

We are back to Maya's original whiteboard, exactly. Toggle the widget to **Wide** and it shows you the matching `pivot_wider()` call.

[KEY INSIGHT]
`pivot_longer()` and `pivot_wider()` are **inverses**: longer folds columns into rows, wider spreads rows back into columns. Pivot a table one way and then the other and you are home where you started.

[WARNING]
`pivot_wider()` assumes each cell of the new grid has exactly **one** value. If a key combination appears twice (say two tills both logged Bagel on Monday) it cannot pick one, so you must say how to combine them with `values_fn`:

```r
dupes <- tribble(
  ~item,   ~day,  ~units,
  "Bagel", "Mon", 40,
  "Bagel", "Mon", 12
)
dupes %>% pivot_wider(names_from  = day,
                      values_from = units,
                      values_fn   = sum)   # add the two Monday tills
#> # A tibble: 1 x 2
#>   item    Mon
#>   <chr> <dbl>
#> 1 Bagel    52
```

::widget reshape-grid {"wide":{"cols":["item","Mon","Tue","Wed"],"rows":[["Sourdough",18,22,25],["Bagel",40,38,44],["Croissant",15,19,12]]},"idCols":["item"],"namesTo":"day","valuesTo":"units"}

=== step === tryit
::eyebrow Your turn
## Spread a different variable into columns

You choose which variable becomes the columns. This time, make a grid with one row per **day** and one column per **item** (Sourdough, Bagel, Croissant), the transpose of Maya's whiteboard. The cells still come from `units`; fill in which column should supply the new headers.

```r
sales_long %>%
  pivot_wider(names_from = ____, values_from = units)
#> # A tibble: 3 x 4   (day, Sourdough, Bagel, Croissant)
```
::check {"regex":"names_from\\s*=\\s*\\S*\\bitem","gate":true,"difficulty":"intermediate","ok":"That is it: names_from = item makes each item a column, and the leftover column (day) becomes the one row per day. You decide which variable spreads into headers.","no":"You want each ITEM to become a column, so the new headers come from item: names_from = item."}
::solution
```r
sales_long %>%
  pivot_wider(names_from = item, values_from = units)
```

=== step === concept
::eyebrow Nesting
## nest() tucks a whole table into one cell

There is one more reshape worth knowing, and it bends the rules in a surprising way: a single cell can hold an **entire table**. `nest()` takes the rows belonging to each group and folds them into one cell, a so-called **list-column**.

```r
by_item <- sales_long %>%
  nest(.by = item)   # keep one row per item, bundle the rest into `data`
by_item
#> # A tibble: 3 x 2
#>   item      data
#>   <chr>     <list>
#> 1 Sourdough <tibble [3 x 2]>
#> 2 Bagel     <tibble [3 x 2]>
#> 3 Croissant <tibble [3 x 2]>
```

Now there is one row per item, and the `data` column is not a number or a word: each cell holds a small `day`/`units` tibble of that item's three sales. Picture it like this:

| item | data |
|------|------|
| Sourdough | a 3 x 2 tibble: Mon/18, Tue/22, Wed/25 |
| Bagel | a 3 x 2 tibble: Mon/40, Tue/38, Wed/44 |
| Croissant | a 3 x 2 tibble: Mon/15, Tue/19, Wed/12 |

This is how you keep each group's data bundled together so you can do one thing per group (fit a model per item, write one file per item) without breaking the rows apart. And `unnest()` is the exact undo, flattening the list-column straight back to the tidy long table:

```r
by_item %>% unnest(data)
#> # A tibble: 9 x 3   (item, day, units, just like sales_long)
```

[NOTE]
`nest()` does not summarise or throw anything away. It only re-files the same rows inside cells; `unnest()` recovers every one of them, so the round trip is lossless, just like longer and wider.

=== step === quiz
::eyebrow Check yourself
## What is inside the data column?

After `sales_long %>% nest(.by = item)`, what does the `data` cell hold for the **Bagel** row?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The single number 122, Bagel's total units for the week ::no `nest()` does not summarise or add up anything. It stores Bagel's rows untouched; you would need `summarise(sum(units))` to get a total.
- A small tibble of Bagel's day and units rows, a 3 x 2 table tucked inside one cell ::ok Right. A list-column cell holds a whole tibble, here Bagel's three day/units rows. `unnest(data)` would spill them back out as ordinary rows.
- The text "Mon, Tue, Wed" pasted into one cell ::no It is a real nested tibble, a live data frame you can pull back out with `unnest()`, not a string of pasted-together text.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Data tidying and pivoting](https://r4ds.hadley.nz/data-tidy) - the canonical, free chapter on tidy data with worked `pivot_longer()` and `pivot_wider()` examples.
- [tidyr: pivot_longer()](https://tidyr.tidyverse.org/reference/pivot_longer.html) - every argument of the wide-to-long move, including `names_pattern` for tricky headers.
- [tidyr: pivot_wider()](https://tidyr.tidyverse.org/reference/pivot_wider.html) - long-to-wide, with `values_fn` and `values_fill` for duplicate or missing keys.
- [tidyr: nest()](https://tidyr.tidyverse.org/reference/nest.html) - list-columns, nesting and rectangling nested data.
- [Wickham (2014), Tidy Data, Journal of Statistical Software 59(10)](https://doi.org/10.18637/jss.v059.i10) - the original paper on why long/tidy is the shape every tool expects.

=== step === complete
## Lesson 2 complete

You can now change a table's **shape** at will. You went wide to long with `pivot_longer()` (folding columns into a tidy `names`/`values` pair), saw why long shape is what dplyr verbs, ggplot and models all expect, went long back to wide with `pivot_wider()` (its inverse, with `values_fn` for duplicate keys), and tucked each group's rows into a list-column with `nest()`, recovering them with `unnest()`. The question is always the same: what shape does my next step want?

Next, Lesson 3: Splitting, uniting and fuzzy joins. A column can hold two things at once (`"2024-03-01"` is really a year, a month and a day), and join keys do not always match exactly. You will split and unite columns with `separate()` and `unite()`, and join tables whose keys only *nearly* agree.
