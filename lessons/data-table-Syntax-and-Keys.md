---
title: "data.table Lesson 1: The DT[i, j, by] syntax and keys"
description: "Learn data.table in R from scratch: the DT[i, j, by] syntax to filter rows, compute columns and group, plus keys for lightning-fast lookups and joins."
keywords: "data.table, data.table in R, DT i j by, setkey, data.table keys, group by, by reference, fast data wrangling in R"
post_type: "LESSON"
curriculum_id: "2.6.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-datatable"
course_title: "Fast Data Wrangling with data.table"
course_lesson: "1"
course_total: "3"
course_landing: "data-table-Course.html"
course_next: "dplyr-vs-data-table.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## One bracket, three jobs

Maya's single bakery has grown into a chain. Her till now logs hundreds of thousands of sales a week across every shop, and the tidy dplyr pipelines that felt instant on one shop's data have started to crawl. **data.table** is R's tool for exactly this moment: the same filter, compute and group you already know, written in one compact bracket and engineered to fly on millions of rows.

Below is a week of sales from two of her shops. Press Run to keep just the Austin rows, your first look at the bracket in action.

By the end of this lesson you will be able to:

- Read the `DT[i, j, by]` grammar and name what each of the three slots does
- Filter rows in `i`, compute and select columns in `j`, and aggregate per group with `by`
- Set a **key** with `setkey()` and use it for lightning-fast lookups and joins

**Prerequisites:** you can run R, and you know the dplyr verbs and the pipe from [The dplyr Verbs](The-dplyr-Verbs.html). We define every data.table idea by translating its dplyr equivalent, so no prior data.table experience is needed.

::widget table-transform {"code":"sales[shop == \"Austin\"]","caption":"The i slot filters rows: keep the Austin sales, the four Denver rows fall away.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Denver","Sourdough",22,99],["Denver","Croissant",15,60],["Austin","Croissant",27,108],["Denver","Bagel",30,45],["Austin","Sourdough",20,90],["Denver","Sourdough",12,54]]},"after":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Austin","Croissant",27,108],["Austin","Sourdough",20,90]]}}

=== step === concept
::eyebrow The whole grammar
## DT[i, j, by]: take rows, do something, by group

Almost everything in data.table happens inside one square bracket with three slots, read left to right like a sentence: **`DT[i, j, by]`** means "take the rows `i`, compute `j`, grouped by `by`."

- **`i`** = *which rows* (a condition, like dplyr's `filter()`).
- **`j`** = *what to compute* (select columns, build new ones, or summarise them, like `select()` plus `mutate()` plus `summarise()`).
- **`by`** = *grouped how* (split into groups and run `j` inside each, like `group_by()`).

Let us build Maya's sales as a data.table. Each lesson runs in a fresh R session, so we create the data right here. The one setup line that matters is `setDTthreads(1)`: it just tells data.table to use a single core, which is all the in-browser R has.

```r
library(data.table)
setDTthreads(1)   # the in-browser R runs on one core

# A week of sales from two shops, one row per sale:
sales <- data.table(
  shop    = c("Austin", "Austin", "Denver", "Denver",
              "Austin", "Denver", "Austin", "Denver"),
  item    = c("Sourdough", "Bagel", "Sourdough", "Croissant",
              "Croissant", "Bagel", "Sourdough", "Sourdough"),
  units   = c(18, 40, 22, 15, 27, 30, 20, 12),
  revenue = c(81, 60, 99, 60, 108, 45, 90, 54)
)
sales
#>      shop      item units revenue
#> 1: Austin Sourdough    18      81
#> 2: Austin     Bagel    40      60
#> 3: Denver Sourdough    22      99
#> 4: Denver Croissant    15      60
#> 5: Austin Croissant    27     108
#> 6: Denver     Bagel    30      45
#> 7: Austin Sourdough    20      90
#> 8: Denver Sourdough    12      54
```

A data.table is also a data frame, so anything that expects a data frame still works. The difference is everything you can now do inside that bracket. The flow below is the map we will follow for the rest of the lesson.

::widget process-flow {"steps":[{"title":"i   which rows","sub":"keep the rows where a condition is TRUE, like dplyr filter"},{"title":"j   what to compute","sub":"select or build columns, or summarise them, like select plus mutate plus summarise"},{"title":"by   grouped how","sub":"split into groups and run j inside each, like group_by"}]}

=== step === concept
::eyebrow The first slot
## i: keep the rows you want

The `i` slot is the row filter. Put a condition there and data.table keeps the rows where it is TRUE. For a pure row filter you do not even need the comma: `sales[shop == "Austin"]` is complete on its own.

```r
sales[shop == "Austin"]          # keep the Austin rows
#>      shop      item units revenue
#> 1: Austin Sourdough    18      81
#> 2: Austin     Bagel    40      60
#> 3: Austin Croissant    27     108
#> 4: Austin Sourdough    20      90

sales[units > 25]                # keep the busy sales
sales[shop == "Denver" & units > 20]   # combine conditions with &
```

It is the same idea as `filter(sales, shop == "Austin")` in dplyr, only shorter: the table name sits outside the bracket, the condition goes inside. Use `==` (two equals signs) to test a value, `&` for "and", `|` for "or", and `%in%` to test membership, for example `sales[shop %in% c("Austin", "Denver")]`.

Drag your eye down the widget: the rows that fail `units > 25` are struck out, the busy three remain.

::widget table-transform {"code":"sales[units > 25]","caption":"The i slot again, now with a number test: keep the busy sales where units is above 25; the quieter five fall away.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Denver","Sourdough",22,99],["Denver","Croissant",15,60],["Austin","Croissant",27,108],["Denver","Bagel",30,45],["Austin","Sourdough",20,90],["Denver","Sourdough",12,54]]},"after":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Bagel",40,60],["Austin","Croissant",27,108],["Denver","Bagel",30,45]]}}

=== step === concept
::eyebrow The second slot
## j: select and compute columns

Where `i` picks rows, the `j` slot says what to do with the columns. Wrap your request in `.()`, data.table's shorthand for "make a table from these". Name bare columns to **select** them, or write an expression to **compute** a new one:

```r
sales[, .(item, revenue)]              # select two columns (note the leading comma)
sales[, .(price = revenue / units)]    # compute a new column, one value per row
#>    price
#> 1:   4.5
#> 2:   1.5
#> 3:   4.5
#> 4:   4.0
#> 5:   4.0
#> 6:   1.5
#> 7:   4.5
#> 8:   4.5
```

The leading comma matters: it leaves `i` empty (all rows) and moves your request into `j`. So `sales[, .(item, revenue)]` is "all rows, these two columns", the data.table way of writing `select(sales, item, revenue)`.

There is also a second, faster way to add a column. The `:=` operator (read "colon-equals") adds or updates a column **by reference**, meaning it writes straight into the existing table instead of building a fresh copy. On a million-row table that saved copy is a large chunk of the speed and memory you came to data.table for.

```r
dt <- copy(sales)               # an independent copy, so sales stays untouched
dt[, price := revenue / units]  # add price to dt in place, no copy made
dt[]                            # the trailing [] just prints the result
```

[NOTE]
Because `:=` changes the table in place, every name pointing at it sees the new column at once. That is the point, but it surprises people: if you want to keep the original intact, take an explicit `copy()` first, exactly as we did above. A plain `dt <- sales` does NOT copy; it is just a second name for the same table.

::widget table-transform {"code":"sales[, .(item, revenue)]","caption":"The j slot selecting columns: ask for item and revenue and only those come back; shop and units are dropped, and every row stays.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Denver","Sourdough",22,99],["Denver","Croissant",15,60],["Austin","Croissant",27,108],["Denver","Bagel",30,45],["Austin","Sourdough",20,90],["Denver","Sourdough",12,54]]},"after":{"cols":["item","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Denver","Sourdough",22,99],["Denver","Croissant",15,60],["Austin","Croissant",27,108],["Denver","Bagel",30,45],["Austin","Sourdough",20,90],["Denver","Sourdough",12,54]]}}

=== step === quiz
::eyebrow Check yourself
## Which slot does which job?

Maya wants the total revenue of the **Austin shops only**, a single number. In `DT[i, j, by]`, where does the Austin filter go, and where does `sum(revenue)` go?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- The filter goes in `i`, the sum goes in `j`: `sales[shop == "Austin", sum(revenue)]` ::ok Right. `i` decides WHICH rows (the Austin filter); `j` decides WHAT to compute on them (the sum). Read the bracket as: take these rows, do this.
- Both the filter and the sum go in `j` ::no `j` is only for what to compute. A row filter belongs in `i`; putting `shop == "Austin"` in `j` would try to build a column, not select rows.
- The filter goes in `i` and the sum goes in `i` too ::no One job per slot. `i` selects rows; a calculation like `sum(revenue)` is a computation, so it must live in `j`, not `i`.

=== step === concept
::eyebrow The third slot
## by: one answer per group

So far `j` has worked on the whole table at once. Add the `by` slot and data.table runs your `j` **separately inside each group**, then stacks the answers. This is the classic split-apply-combine pattern, and it is dplyr's `group_by()` plus `summarise()` folded into the same bracket.

```r
sales[, .(units = sum(units),
          revenue = sum(revenue),
          n = .N), by = shop]
#>      shop units revenue n
#> 1: Austin   105     339 4
#> 2: Denver    79     258 4
```

Two shops in, two rows out: each is one shop's totals. The special symbol **`.N`** is the number of rows in the current group, the quickest way to count, so `n = .N` tells us each shop made four sales. You can group by several columns at once with `by = .(shop, item)`, and if you want the result sorted by the grouping column, use `keyby =` instead of `by =`.

::widget process-flow {"steps":[{"title":"Split","sub":"cut the rows into groups by the by column, here one group per shop"},{"title":"Apply","sub":"run the j expression inside each group, here sum(revenue) and .N"},{"title":"Combine","sub":"stack the per-group answers into one small result table"}]}

=== step === tryit
::eyebrow Your turn
## Put i, j and by together

Now combine all three slots in one bracket. Maya wants **total revenue per item, for the Austin shops only**. The `i` filter and the `j` summary are written for you; fill in the grouping slot so the sum is computed once per item.

```r
sales[shop == "Austin", .(revenue = sum(revenue)), ____]
#> revenue summed within each item, Austin only
```
::check {"regex":"by\\s*=\\s*item","gate":true,"difficulty":"intermediate","ok":"That is the by slot: by = item splits the Austin rows by item and runs sum(revenue) inside each. i filters, j computes, by groups, all in one bracket.","no":"You need the grouping slot. Group the Austin rows by item: by = item."}
::solution
```r
sales[shop == "Austin", .(revenue = sum(revenue)), by = item]
#>         item revenue
#> 1: Sourdough     171
#> 2:     Bagel      60
#> 3: Croissant     108
```

=== step === concept
::eyebrow Now make it fast
## Keys: sort once, then search

Everything so far works on any size of table. But Maya looks up one shop's sales over and over, and on a million-row table each `sales[shop == "Austin"]` has to **scan every row** to find the matches. A **key** removes that cost.

`setkey(DT, shop)` sorts the whole table by `shop`, one time. Once the rows are sorted, finding a shop is like finding a name in a phone book: you do not read every entry, you open to the middle, decide which half to keep, and repeat. That is a **binary search**.

Here is the difference made concrete. An unsorted scan checks all \(n\) rows, so its cost grows in step with the data: \(O(n)\). A binary search on the sorted key throws away half the remaining rows at every step, so it finds the block in about \(\log_2 n\) hops: \(O(\log n)\). For a million rows that is the difference between a million comparisons and about twenty.

```r
set.seed(1)
big <- data.table(
  shop    = sample(c("Austin", "Denver", "Seattle", "Boston", "Miami"),
                   1e6, replace = TRUE),
  revenue = round(runif(1e6, 1, 200), 2)
)

# No key yet: data.table must scan all 1,000,000 rows
system.time(big[shop == "Austin", sum(revenue)])
#>    user  system elapsed
#>   0.040   0.002   0.042

setkey(big, shop)   # sort by shop, once

# Keyed: a binary search jumps straight to the Austin block
system.time(big["Austin", sum(revenue)])
#>    user  system elapsed
#>   0.003   0.000   0.003
```

Your exact times will vary, but the shape holds: the keyed lookup stays fast as the table grows, while the plain scan slows in step with the row count. The sort is a one-time cost you pay with `setkey`; every lookup afterwards is cheap.

::widget process-flow {"steps":[{"title":"Sort once","sub":"setkey(DT, shop) orders every row by shop, a one-time cost"},{"title":"Jump to the middle","sub":"is the target shop above or below the middle row?"},{"title":"Halve the range","sub":"discard the half that cannot contain it, then repeat"},{"title":"Land on the block","sub":"after about log2(n) hops the matching rows are found"}]}

=== step === concept
::eyebrow What a key buys you
## Instant lookups and fast joins

With a key set, two everyday jobs get much faster. The first is **lookup**: pass the key value straight into `i` and data.table binary-searches for it. `sales["Austin"]` means "the rows whose key is Austin", and `sales["Austin", sum(revenue)]` filters and sums in one fast step.

```r
setkey(sales, shop)          # sort our small table by shop, once
sales["Austin"]              # binary-search straight to the Austin rows
sales["Austin", sum(revenue)]
#> [1] 339
```

The second is **joins**. A keyed join, written `X[Y]`, looks each row of `Y` up in the keyed table `X` by binary search. Give every sale its shop's region by keying a small lookup table and joining:

```r
regions <- data.table(
  shop   = c("Austin", "Denver"),
  region = c("South", "West")
)
setkey(regions, shop)        # key both tables on the join column
sales[regions]               # attach each shop's region to every sale
#>      shop      item units revenue region
#> 1: Austin Sourdough    18      81  South
#> 2: Austin     Bagel    40      60  South
#> 3: Austin Croissant    27     108  South
#> 4: Austin Sourdough    20      90  South
#> 5: Denver Sourdough    22      99   West
#> 6: Denver Croissant    15      60   West
#> 7: Denver     Bagel    30      45   West
#> 8: Denver Sourdough    12      54   West
```

Because the key is sorted, that join never scans; it binary-searches, which is what makes data.table joins scale to tables far too large for a plain merge.

::widget table-transform {"code":"sales[\"Austin\"]","caption":"A keyed lookup. With shop as the key, sales of [Austin] jump straight to the Austin rows by binary search; the Denver rows are never scanned.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Denver","Sourdough",22,99],["Denver","Croissant",15,60],["Austin","Croissant",27,108],["Denver","Bagel",30,45],["Austin","Sourdough",20,90],["Denver","Sourdough",12,54]]},"after":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Austin","Croissant",27,108],["Austin","Sourdough",20,90]]}}

=== step === quiz
::eyebrow Check yourself
## What happens on each lookup?

You run `setkey(sales, shop)` once, then look up `sales["Austin"]` many times over the course of your analysis. What does data.table do on each of those lookups?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It re-sorts the whole table every time you look up a value ::no No. `setkey` sorts ONCE. After that the table stays sorted, so each lookup is just a fast search, with no re-sorting.
- It binary-searches the already-sorted table, so each lookup is fast ::ok Right. The sorting cost was paid once by `setkey`; every keyed lookup after that is an \(O(\log n)\) binary search on the sorted rows.
- It scans all the rows, exactly like an unkeyed filter ::no That is the unkeyed case. With a key set, data.table binary-searches instead of scanning, which is why a keyed lookup stays fast as the table grows.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Introduction to data.table (CRAN vignette)](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-intro.html) - the canonical first tour of the `DT[i, j, by]` grammar, by the package authors.
- [Keys and fast binary-search subset (CRAN vignette)](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-keys-fast-subset.html) - exactly the keys topic from this lesson, with the binary-search story in full.
- [Reference semantics (CRAN vignette)](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-reference-semantics.html) - what `:=` (modify by reference) really does, and why it saves the copy.
- [data.table official documentation](https://rdatatable.gitlab.io/data.table/) - the complete function reference, news and cheat sheet.

=== step === complete
## Lesson 1 complete

You can now read and write the data.table bracket. You learned the `DT[i, j, by]` grammar, `i` to filter rows, `j` to select and compute columns (and `:=` to add one by reference, no copy), and `by` to summarise per group, plus **keys**: `setkey()` sorts a table once so lookups and joins become a fast binary search instead of a full scan.

Next, Lesson 2: dplyr vs data.table, head to head. You will write the same task in both, see exactly where data.table's speed and memory savings come from, and learn how to keep dplyr's readable syntax while getting data.table's speed underneath with dtplyr.
