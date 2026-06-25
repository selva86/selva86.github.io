---
title: "Data Wrangling Lesson 2: The dplyr Verbs"
description: "Meet the dplyr verbs that do real analysis: filter rows, select columns, mutate new columns, arrange, distinct and count, all chained with the pipe into one readable line."
keywords: "dplyr, filter, select, mutate, arrange, distinct, count, pipe, tidyverse, data wrangling in R"
post_type: "LESSON"
curriculum_id: "2.1.2"
webr: true
lesson_access: "free"
course_id: "da-dplyr"
course_title: "Data Wrangling with dplyr"
course_lesson: "2"
course_total: "3"
course_landing: "Data-Wrangling-dplyr-Course.html"
course_next: "Group-Summarise-and-Clean-in-dplyr.html"
course_prev: "Importing-and-Tidy-Data-in-R.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## The verbs that do the work

In Lesson 1 you got Maya's bakery sales off her till, into R, and into tidy shape. The data is ready. So what do you actually DO with it? Almost every analysis is a handful of small, sharply named verbs, each doing one job to a table: keep some rows, keep some columns, add a column, sort, tally. Learn these and you can answer most questions you will ever put to a data frame.

By the end of this lesson you will be able to:

- Pick rows with `filter()` and columns with `select()`
- Derive new columns with `mutate()`, and order, dedupe and tally with `arrange()`, `distinct()` and `count()`
- Chain them with the pipe into one line that reads like a sentence

**Prerequisites:** Lesson 1, so your data is imported and [tidy](Importing-and-Tidy-Data-in-R.html). No dplyr experience needed; we define every verb as it appears.

::widget table-transform {"code":"sales %>% filter(units > 20)","caption":"filter() keeps only the rows where the condition is TRUE; the rest fall away.","before":{"cols":["date","item","units","revenue"],"rows":[["2024-03-01","Sourdough",18,81],["2024-03-01","Bagel",40,60],["2024-03-02","Sourdough",22,99],["2024-03-02","Croissant",15,60],["2024-03-03","Sourdough",20,90],["2024-03-03","Bagel",38,57]]},"after":{"cols":["date","item","units","revenue"],"rows":[["2024-03-01","Bagel",40,60],["2024-03-02","Sourdough",22,99],["2024-03-03","Bagel",38,57]]}}

=== step === concept
::eyebrow Keep rows
## One shape in, one shape out: filter()

Here is Maya's tidy sales table from Lesson 1, six sales over three days. We will use this one table for the whole lesson.

```r
library(tidyverse)   # loads dplyr (the verbs) and the pipe
sales
#> # A tibble: 6 x 4
#>   date       item      units revenue
#>   <date>     <chr>     <dbl>   <dbl>
#> 1 2024-03-01 Sourdough    18      81
#> 2 2024-03-01 Bagel        40      60
#> 3 2024-03-02 Sourdough    22      99
#> 4 2024-03-02 Croissant    15      60
#> 5 2024-03-03 Sourdough    20      90
#> 6 2024-03-03 Bagel        38      57
```

Every dplyr verb works the same way: it is a function whose first argument is a data frame, and whose result is a brand new data frame. **Table in, table out.** That single rule is why the verbs snap together later.

The first verb, `filter()`, keeps the **rows** that pass a test. "Keep the busy sales" means "keep the rows where `units` is above 20":

```r
filter(sales, units > 20)
```

The test `units > 20` is checked on every row; rows where it is TRUE stay, the rest are dropped. Use `==` (two equals signs, "is equal to") to test a value, never a single `=`. Give several conditions and a row must pass them all: `filter(sales, units > 20, item == "Bagel")` keeps only busy Bagel sales.

[KEY INSIGHT]
A verb never changes its input. `filter(sales, ...)` returns a new table and leaves `sales` exactly as it was. To keep a result, you must assign it: `busy <- filter(sales, units > 20)`.

Drag your eye down the widget: the three rows that fail `units > 20` are struck out, the three that pass remain.

::widget table-transform {"code":"sales %>% filter(item == \"Sourdough\")","caption":"Keep only the Sourdough sales. The == test is TRUE on three rows; the other three drop away.","before":{"cols":["date","item","units","revenue"],"rows":[["2024-03-01","Sourdough",18,81],["2024-03-01","Bagel",40,60],["2024-03-02","Sourdough",22,99],["2024-03-02","Croissant",15,60],["2024-03-03","Sourdough",20,90],["2024-03-03","Bagel",38,57]]},"after":{"cols":["date","item","units","revenue"],"rows":[["2024-03-01","Sourdough",18,81],["2024-03-02","Sourdough",22,99],["2024-03-03","Sourdough",20,90]]}}

=== step === concept
::eyebrow Keep columns
## select() picks columns by name

Where `filter()` chooses rows, `select()` chooses **columns**. You name the columns you want and they are the only ones kept, in the order you list them:

```r
select(sales, item, revenue)
```

That returns a two-column table, `item` and `revenue`, with every row intact. `select()` only ever touches columns; it never looks at the values inside them and never removes a row.

A few everyday moves:

- **Drop** a column with a minus: `select(sales, -date)` keeps everything except `date`.
- **Reorder** by listing columns in the order you want: `select(sales, item, date, units, revenue)`.
- **Match by pattern** with helpers: `select(sales, starts_with("rev"))`, or `where(is.numeric)` for every number column.

In the widget below, `date` and `units` are tinted to show they are being dropped; `item` and `revenue` are what `select(item, revenue)` returns. Notice all six rows survive: choosing columns says nothing about which rows you keep.

::widget table-transform {"code":"sales %>% select(item, revenue)","caption":"select() keeps only the named columns. date and units are dropped; every row stays.","before":{"cols":["date","item","units","revenue"],"rows":[["2024-03-01","Sourdough",18,81],["2024-03-01","Bagel",40,60],["2024-03-02","Sourdough",22,99],["2024-03-02","Croissant",15,60],["2024-03-03","Sourdough",20,90],["2024-03-03","Bagel",38,57]]},"after":{"cols":["item","revenue"],"rows":[["2024-03-01","Sourdough",18,81],["2024-03-01","Bagel",40,60],["2024-03-02","Sourdough",22,99],["2024-03-02","Croissant",15,60],["2024-03-03","Sourdough",20,90],["2024-03-03","Bagel",38,57]]}}

=== step === quiz
::eyebrow Check yourself
## Rows or columns?

Maya wants only the Bagel sales, and she wants to keep every column. Which verb does that?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `filter(sales, item == "Bagel")` ::ok Right. `filter()` chooses ROWS by a condition on their values, and leaves every column in place. That is exactly "keep the Bagel rows, all columns".
- `select(sales, item == "Bagel")` ::no `select()` chooses COLUMNS by name; it cannot test a condition on the values. To pick rows by a value, you need `filter()`.
- `arrange(sales, item == "Bagel")` ::no `arrange()` only reorders rows, it never removes any. You would still have all six sales, just shuffled.

=== step === concept
::eyebrow Make columns
## mutate() adds a derived column

`filter()` and `select()` only ever keep what is already there. `mutate()` is different: it **creates a new column** from the columns you already have, and adds it to the right-hand side of the table.

Maya wants the price per loaf for each sale, which is simply revenue divided by units:

```r
mutate(sales, price = revenue / units)
#> # A tibble: 6 x 5
#>   date       item      units revenue price
#>   <date>     <chr>     <dbl>   <dbl> <dbl>
#> 1 2024-03-01 Sourdough    18      81   4.5
#> 2 2024-03-01 Bagel        40      60   1.5
#> 3 2024-03-02 Sourdough    22      99   4.5
#> 4 2024-03-02 Croissant    15      60   4  
#> 5 2024-03-03 Sourdough    20      90   4.5
#> 6 2024-03-03 Bagel        38      57   1.5
```

The expression on the right runs once per row (it is vectorised): row 1 gets `81 / 18 = 4.5`, row 2 gets `60 / 40 = 1.5`, and so on down the column. The five original columns are untouched; `price` joins them as a sixth. You can build several at once, and even use a column you just made: `mutate(sales, price = revenue / units, dear = price > 4)`.

[NOTE]
A sibling verb, `transmute()`, does the same arithmetic but keeps ONLY the columns you name: `transmute(sales, item, price = revenue / units)` returns just `item` and `price`. Reach for it when the originals are clutter you do not need.

=== step === tryit
::eyebrow Your turn
## Add a margin column

Maya's ingredients cost about **1 per loaf**, so the cost of a sale is `units` and her margin is revenue minus that cost. Add a `margin` column. Fill in the blank with the expression, then check it.

```r
sales %>%
  mutate(margin = ____)
#> # ... a new <dbl> column: 63, 20, 77, 45, 70, 19
```
::check {"regex":"revenue\\s*-\\s*(1\\s*\\*\\s*)?units","gate":true,"difficulty":"beginner","ok":"Exactly: margin = revenue - units runs once per row, giving Maya the profit on every sale as a new column.","no":"Cost is 1 per loaf, so the cost of a sale is units; subtract it from revenue: margin = revenue - units."}
::solution
```r
sales %>%
  mutate(margin = revenue - units)
```

=== step === concept
::eyebrow Chain them
## The pipe reads like a sentence

You just saw `mutate(sales, ...)` written two ways: with `sales` inside the parentheses, and with `sales %>%` in front. That arrow, `%>%`, is **the pipe**, and it is the idea that makes dplyr a joy to read.

The pipe takes the table on its left and feeds it in as the first argument of the verb on its right. So `sales %>% filter(units > 20)` means exactly `filter(sales, units > 20)`. The payoff comes when you stack verbs: each line takes the table from the line above, does one thing, and hands it on.

```r
sales %>%
  filter(units > 20) %>%          # keep the busy sales
  mutate(price = revenue / units) %>%   # add price per loaf
  select(item, units, price)      # show just these columns
#> # A tibble: 3 x 3
#>   item      units price
#>   <chr>     <dbl> <dbl>
#> 1 Bagel        40   1.5
#> 2 Sourdough    22   4.5
#> 3 Bagel        38   1.5
```

Read it top to bottom as plain English: "take `sales`, then keep the busy rows, then add a price, then show item, units and price." No nested parentheses, no naming a half-dozen throwaway tables. Each verb stays simple because the pipe handles the plumbing.

[NOTE]
Recent R also ships a built-in pipe, `|>`, that works almost identically: `sales |> filter(units > 20)`. Use whichever your project prefers; this course uses `%>%`. And note the whole chain still leaves `sales` itself untouched, since every verb returns a new table.

=== step === concept
::eyebrow Order and tally
## arrange(), distinct() and count()

Three short verbs round out the everyday toolkit. None of them changes the values in your table; they reorder it or summarise its shape.

**arrange()** sorts the rows. By default it sorts smallest first (ascending); wrap a column in `desc()` to sort largest first:

```r
sales %>% arrange(desc(revenue))
#> # A tibble: 6 x 4   (highest revenue on top)
#>   date       item      units revenue
#> 1 2024-03-02 Sourdough    22      99
#> 2 2024-03-03 Sourdough    20      90
#> 3 2024-03-01 Sourdough    18      81
#> 4 2024-03-01 Bagel        40      60
#> 5 2024-03-02 Croissant    15      60
#> 6 2024-03-03 Bagel        38      57
```

**distinct()** keeps the unique values, dropping repeats. Maya's six sales cover only three products:

```r
sales %>% distinct(item)
#> # A tibble: 3 x 1
#>   item
#>   <chr>
#> 1 Sourdough
#> 2 Bagel
#> 3 Croissant
```

**count()** goes one step further and tallies how many rows fall in each group, a quick way to ask "how many of each?":

```r
sales %>% count(item)
#> # A tibble: 3 x 2
#>   item          n
#>   <chr>     <int>
#> 1 Bagel         2
#> 2 Croissant     1
#> 3 Sourdough     3
```

So Maya sold Sourdough three times, Bagels twice and a single Croissant. `count()` is often the very first thing to run on a new column, to see what is in it.

=== step === quiz
::eyebrow Check yourself
## Did the verb change my data?

You run `sales %>% filter(units > 20)`, see the three busy rows print, and then type `sales` on its own again. What does `sales` contain now?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Only the rows where `units > 20`; `filter()` changed it in place ::no dplyr verbs never modify the original. They RETURN a new table and leave the input alone, unless you reassign it yourself.
- All six original rows, unchanged ::ok Right. `filter()` built a new table and printed it, but it never touched `sales`. To keep the result you must assign it: `busy <- sales %>% filter(units > 20)`.
- An error, because you never saved the result ::no No error. The new table simply printed to the console and was discarded. `sales` itself is never altered by running a verb on it.

=== step === tryit
::eyebrow Put it together
## Build a pipe of your own

Maya wants the **cheapest loaves on top**. The pipe below keeps the busy sales and adds a price per loaf; finish it by ordering the rows so the lowest `price` comes first. (Watch the direction: she wants low to high.)

```r
sales %>%
  filter(units > 20) %>%
  mutate(price = revenue / units) %>%
  ____
#> ... rows ordered with the smallest price first
```
::check {"regex":"arrange[(]\\s*price","gate":true,"difficulty":"intermediate","ok":"Right. arrange() sorts ascending by default, so plain arrange(price) puts the cheapest loaf on top. Wrapping it in desc() would flip it to dearest first.","no":"arrange() already sorts low to high, which is what she asked for, so no desc() needed: arrange(price)."}
::solution
```r
sales %>%
  filter(units > 20) %>%
  mutate(price = revenue / units) %>%
  arrange(price)
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Data transformation](https://r4ds.hadley.nz/data-transform) - the canonical, free chapter on `filter`, `select`, `mutate`, `arrange` and the pipe.
- [dplyr: Introduction vignette](https://dplyr.tidyverse.org/articles/dplyr.html) - the package authors' own tour of the one-table verbs.
- [dplyr function reference](https://dplyr.tidyverse.org/reference/index.html) - every argument of every verb, with runnable examples.
- [R for Data Science (2e), Workflow: code style](https://r4ds.hadley.nz/workflow-style) - how to format pipes so a chain reads cleanly, including the base `|>` pipe.

=== step === complete
## Lesson 2 complete

You can now do real work on a data frame. You learned the five everyday verbs, `filter()` to keep rows, `select()` to keep columns, `mutate()` to derive new ones, and `arrange()`, `distinct()` and `count()` to order, dedupe and tally, and the pipe that chains them into a single readable line. Each verb does one job, takes a table and returns a new one, and never alters the original.

Next, Lesson 3: Group, Summarise and Clean. So far every verb has worked on the table as a whole. Now you will split it into groups with `group_by()`, collapse each group to a summary with `summarise()` (counts, means, several at once), derive categories with `case_when()`, and handle missing values honestly, the skills that turn a tidy table into an answer.
