---
title: "data.table Lesson 2: dplyr vs data.table"
description: "Do dplyr and data.table give the same result, and when does the choice matter? Write one task in both, benchmark it, and see real speed and memory trade-offs."
keywords: "dplyr vs data.table, data.table vs dplyr, data.table speed, modify by reference, group by data.table, R data wrangling benchmark, dplyr or data.table"
post_type: "LESSON"
curriculum_id: "2.6.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-datatable"
course_title: "Fast Data Wrangling with data.table"
course_lesson: "2"
course_total: "4"
course_landing: "data-table-Course.html"
course_next: "Bigger-than-Memory-Data-in-R.html"
course_prev: "data-table-Syntax-and-Keys.html"
---

=== step === cover
::eyebrow Lesson 2 of 4
## Same answer, different engine

In Lesson 1 Maya learned data.table on her bakery chain's sales: the `DT[i, j, by]` bracket and keys. But she already knew dplyr, and a fair question nags. If both tools can filter, group and summarise the same sales, why keep two? Do they even give the same answer, and when does the choice actually matter?

This lesson puts them side by side on Maya's till data. You will write the same task in both dialects, confirm they return the identical result, then measure exactly where data.table pulls ahead on speed and memory, and learn when each is the right call.

By the end of this lesson you will be able to:

- Write the same filter, mutate and grouped summary in both dplyr and data.table, and get the identical result
- Explain why data.table is faster and leaner: an optimized C engine and modify-by-reference (no copy)
- Choose dplyr, data.table, or the dtplyr bridge for a given job

**Prerequisites:** you can run R, and you know the [dplyr verbs and the pipe](The-dplyr-Verbs.html) and the [data.table `DT[i, j, by]` bracket](data-table-Syntax-and-Keys.html) from Lesson 1.

The bars below are the payoff in one picture: the same grouped sum on a million rows, timed both ways. You will run the real benchmark yourself in a moment.

::widget chart-plotter {"data":[{"x":"dplyr","y":0.22},{"x":"data.table","y":0.045}],"geoms":["bar"],"x":"approach","y":"seconds, 1M-row grouped sum","code":{"bar":"ggplot(timings, aes(approach, seconds)) +\n  geom_col()"}}

=== step === concept
::eyebrow The premise
## Two dialects, one result

Here is the idea that makes this whole lesson safe to learn: for everyday wrangling, dplyr and data.table do the **same job** and return the **same data**. They are two dialects for one language. dplyr spells the steps out as verbs joined by a pipe; data.table packs them into the `DT[i, j, by]` bracket. Pick the spelling you like; the answer is identical.

Each lesson runs in a fresh R session, so we build Maya's sales right here, once, in two shapes: a `sales` table for dplyr and the same data as a `salesDT` for data.table.

```r
library(dplyr)
library(tibble)
library(data.table)
setDTthreads(1)   # the in-browser R runs on one core

# Maya's bakery chain: a week of sales across three shops, one row per sale
sales <- tibble(
  shop    = c("Austin","Austin","Austin","Denver","Denver","Denver",
              "Seattle","Seattle","Seattle","Austin","Denver","Seattle"),
  item    = c("Sourdough","Bagel","Croissant","Sourdough","Bagel","Croissant",
              "Sourdough","Bagel","Croissant","Sourdough","Sourdough","Bagel"),
  units   = c(18, 40, 27, 22, 30, 15, 12, 33, 19, 20, 24, 28),
  revenue = c(81, 60, 108, 99, 45, 60, 54, 49, 76, 90, 108, 42)
)
salesDT <- as.data.table(sales)   # the same data, as a data.table
```

Now the simplest task: keep just the Austin sales. Write it both ways and compare.

```r
filter(sales, shop == "Austin")     # dplyr: the filter() verb
salesDT[shop == "Austin"]           # data.table: a condition in the i slot
#>      shop      item units revenue
#> 1: Austin Sourdough    18      81
#> 2: Austin     Bagel    40      60
#> 3: Austin Croissant    27     108
#> 4: Austin Sourdough    20      90
```

Same four Austin rows, same columns, same order. The widget shows that shared result: eight rows fall away, the four Austin sales remain, whichever dialect you used.

::widget table-transform {"code":"salesDT[shop == \"Austin\"]   (same as filter(sales, shop == \"Austin\"))","caption":"The same job two ways. dplyr filter() and the data.table i slot both keep the four Austin rows and drop the other eight. Identical result, two spellings.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Austin","Croissant",27,108],["Denver","Sourdough",22,99],["Denver","Bagel",30,45],["Denver","Croissant",15,60],["Seattle","Sourdough",12,54],["Seattle","Bagel",33,49],["Seattle","Croissant",19,76],["Austin","Sourdough",20,90],["Denver","Sourdough",24,108],["Seattle","Bagel",28,42]]},"after":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Austin","Croissant",27,108],["Austin","Sourdough",20,90]]}}

=== step === concept
::eyebrow The first real difference
## Adding a column: copy vs in place

The results match, but *how* the two tools get there starts to diverge the moment you change the data. Take adding a `price` column (revenue per unit) to Maya's sales.

```r
# dplyr: returns a NEW table with price; the original `sales` is untouched
mutate(sales, price = revenue / units)

# data.table: writes price straight INTO salesDT, no copy made
salesDT[, price := revenue / units]
salesDT
#>      shop      item units revenue price
#> 1: Austin Sourdough    18      81  4.50
#> 2: Austin     Bagel    40      60  1.50
#> 3: Austin Croissant    27     108  4.00
#> 4: Denver Sourdough    22      99  4.50
#> ... (8 more rows)
```

Both give you a `price` column. The difference is the cost. `mutate()` builds a fresh copy of the table with the new column added, so the old version and the new version both sit in memory for a moment. The data.table `:=` operator (read "colon-equals") updates the table **in place**: it writes the new column into the existing table without copying it.

On Maya's twelve rows that costs nothing either way. On a fifty-million-row table it is the whole game. Copying allocates extra memory proportional to the table size, \(O(n)\) for \(n\) rows; writing in place with `:=` allocates no copy, \(O(1)\) extra. That single design choice is most of why data.table stays lean where dplyr can spike.

[KEY INSIGHT]
`mutate()` copies, `:=` modifies by reference. Same column out, very different memory cost: a full extra copy versus none. On big tables that is the difference between fitting in memory and not.

::widget table-transform {"code":"salesDT[, price := revenue / units]","caption":"Add a price column (revenue per unit). dplyr mutate() returns a copy with price added; data.table := writes the new column in place with no copy. Same column, very different memory cost on a large table.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Austin","Croissant",27,108],["Denver","Sourdough",22,99],["Denver","Bagel",30,45],["Denver","Croissant",15,60]]},"after":{"cols":["shop","item","units","revenue","price"],"rows":[["Austin","Sourdough",18,81,4.5],["Austin","Bagel",40,60,1.5],["Austin","Croissant",27,108,4.0],["Denver","Sourdough",22,99,4.5],["Denver","Bagel",30,45,1.5],["Denver","Croissant",15,60,4.0]]}}

=== step === quiz
::eyebrow Check yourself
## Which one avoids the copy?

Maya needs to add a `price` column to a fifty-million-row table where memory is already tight. She has two ways to write it: `salesDT[, price := revenue / units]` or `sales <- mutate(sales, price = revenue / units)`. Which one avoids copying the whole table?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `salesDT[, price := revenue / units]`, because `:=` writes the column in place ::ok Right. `:=` modifies the table by reference, adding the column with no copy, so the memory cost stays flat no matter how big the table is. That is data.table's signature memory saving.
- `mutate()`, because dplyr edits the table in place ::no The other way round. `mutate()` returns a fresh copy with the column added, so for a moment the old and new tables both sit in memory. `:=` is the one that writes in place.
- Neither, both always copy the whole table first ::no `:=` is exactly the operator that does NOT copy: it writes the new column straight into the existing table. `mutate()` copies; `:=` does not.

=== step === concept
::eyebrow The second real difference
## Grouped summaries, side by side

The most common analyst job is split-apply-combine: cut the data into groups, compute something per group, stack the answers. Maya wants total units, total revenue and the number of sales **per shop**. Both tools do it; watch the shapes.

```r
# dplyr: group_by() then summarise(), joined by the pipe
sales |>
  group_by(shop) |>
  summarise(units = sum(units), revenue = sum(revenue), n = n())

# data.table: the same split-apply-combine, folded into one bracket
salesDT[, .(units = sum(units), revenue = sum(revenue), n = .N), by = shop]
#>       shop units revenue n
#> 1:  Austin   105     339 4
#> 2:  Denver    91     312 4
#> 3: Seattle    92     221 4
```

Read them against each other. dplyr's `group_by(shop)` is data.table's `by = shop`. dplyr's `summarise(...)` is data.table's `j` slot, the `.(...)` list. dplyr's `n()` (count the rows) is data.table's `.N`. Twelve sales collapse to one tidy row per shop, the same three numbers each way.

::widget table-transform {"code":"salesDT[, .(units = sum(units), revenue = sum(revenue), n = .N), by = shop]","caption":"Group by shop and sum within each group. dplyr writes group_by() plus summarise(); data.table folds the same split-apply-combine into one bracket with by = shop. Twelve sales collapse to one row per shop, identical totals.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Bagel",40,60],["Austin","Croissant",27,108],["Denver","Sourdough",22,99],["Denver","Bagel",30,45],["Denver","Croissant",15,60],["Seattle","Sourdough",12,54],["Seattle","Bagel",33,49],["Seattle","Croissant",19,76],["Austin","Sourdough",20,90],["Denver","Sourdough",24,108],["Seattle","Bagel",28,42]]},"after":{"cols":["shop","units","revenue","n"],"rows":[["Austin",105,339,4],["Denver",91,312,4],["Seattle",92,221,4]]}}

=== step === tryit
::eyebrow Your turn
## Translate a pipe into the bracket

Here is a dplyr pipe that gives Maya total revenue **per item**, across all shops:

`sales |> group_by(item) |> summarise(revenue = sum(revenue))`

Translate it into the data.table bracket. The `j` summary is written for you; fill in the grouping slot so the sum is computed once per item.

```r
salesDT[, .(revenue = sum(revenue)), ____]
#> one revenue total per item
```
::check {"regex":"by\\s*=\\s*item","gate":true,"difficulty":"intermediate","ok":"That is the by slot. by = item splits the rows by item and runs sum(revenue) inside each group, the exact translation of dplyr group_by(item). One bracket, same answer.","no":"You need the grouping slot. dplyr group_by(item) becomes data.table by = item."}
::solution
```r
salesDT[, .(revenue = sum(revenue)), by = item]
#>         item revenue
#> 1: Sourdough     432
#> 2:     Bagel     196
#> 3: Croissant     244
```

=== step === concept
::eyebrow Now measure it
## The benchmark, for real

Same results, so the choice is about cost. Let us actually measure it instead of trusting a claim. We build one million rows of fake sales, then time the **same grouped sum** both ways with `system.time()`, which reports how many seconds a piece of code took (look at the `elapsed` column, the real wall-clock time).

```r
set.seed(1)
n <- 1e6
big_df <- data.frame(
  shop    = sample(c("Austin","Denver","Seattle","Boston","Miami"), n, replace = TRUE),
  units   = sample(1:50, n, replace = TRUE),
  revenue = round(runif(n, 1, 200), 2)
)
big_dt <- as.data.table(big_df)

# dplyr: group_by + summarise
system.time( big_df |> group_by(shop) |> summarise(revenue = sum(revenue)) )
#>    user  system elapsed
#>   0.214   0.008   0.222

# data.table: the same grouped sum, in one bracket
system.time( big_dt[, .(revenue = sum(revenue)), by = shop] )
#>    user  system elapsed
#>   0.041   0.003   0.045
```

Both lines return the same five per-shop totals; data.table just gets there in roughly a fifth of the time. Those two `elapsed` numbers are exactly the bars you saw on the cover, now measured rather than promised.

[NOTE]
Your own numbers will differ from these, and from run to run: timing depends on the machine, the data size and the number of groups. The absolute seconds are not the lesson; the **ratio** is. As the table grows from thousands to millions of rows, that ratio widens in data.table's favour.

=== step === concept
::eyebrow Where the gap comes from
## Why data.table is faster and leaner

The gap is not magic, and it is not extra CPU cores (we pinned both to one core with `setDTthreads(1)`). It comes from three deliberate design choices, and the flow below names each one.

The first is an **optimized C engine**: data.table computes grouped sums, means and counts with hand-written C (its authors call it GForce) and groups rows with a fast radix sort, so `by` runs far quicker than the general-purpose path. The second is **modify by reference**, the `:=` you met earlier: updating in place means no copy, which is the memory side of the win. The third is the **single fused pass**: because `i`, `j` and `by` live in one bracket, data.table can do the filter, the grouping and the summary in one sweep over the rows, with no throwaway intermediate table built between steps.

::widget process-flow {"steps":[{"title":"Optimized C engine","sub":"grouped sums and means use GForce, hand-written C, plus a fast radix sort to group rows, so by runs far quicker than the general path"},{"title":"Modify by reference","sub":"the := operator updates a column in place with no copy of the table, which is where the lower memory use comes from"},{"title":"One fused pass","sub":"i, j and by run together in a single bracket, so no throwaway intermediate table is built between the steps"}]}

=== step === quiz
::eyebrow Check yourself
## Why was it faster?

In the benchmark, data.table summed revenue by shop in about a fifth of the time dplyr took, with both pinned to a single core. What is the main reason it was faster here?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- data.table quietly spread the work across many CPU cores while dplyr used one ::no Not here: `setDTthreads(1)` pinned data.table to a single core too, so both ran on one core. The speed came from a faster engine, not from more cores.
- data.table runs grouped sums with a hand-written C engine and fuses the work into one pass, so the same job costs less ::ok Right. Optimized C grouping (GForce) plus a fast radix sort plus one fused pass over the rows is the speedup, and `:=` avoids copies on the memory side. No extra cores needed.
- data.table is a separate language that compiles your code to run faster ::no It is an ordinary R package you load with `library()`. The win is an optimized C implementation of grouping and aggregation, not a different compiled language.

=== step === quiz
::eyebrow Putting it together
## So which should you reach for?

Now the honest part: faster does not mean "always use data.table." Each tool has a sweet spot.

**dplyr** is readable, consistent across the tidyverse, and gentle to learn and to hand to a teammate; its piped verbs read like a sentence, and it is already instant up to a few million rows. **data.table** is terse, the fastest in-memory option, the most memory-frugal, has zero dependencies and a famously stable syntax; it shines on large tables, repeated grouped work and memory-tight machines.

And you do not actually have to choose. **dtplyr** (the bridge you will build in Lesson 4) lets you write ordinary dplyr and have data.table run it underneath: wrap a table with `lazy_dt()`, write the verbs you know, and the data.table engine does the work. Readable code on top, fast engine below. The flow sums up the call.

::widget process-flow {"steps":[{"title":"Small data, shared code","sub":"reach for dplyr: readable, consistent with the tidyverse, and already instant at this size"},{"title":"Large but fits in memory","sub":"reach for data.table: the speed and the lower memory matter, especially for repeated grouped work"},{"title":"Want both","sub":"write dplyr and let dtplyr translate it to data.table under the hood, the Lesson 4 bridge"}]}

Maya has a 200-million-row table that still fits in RAM, she runs the same grouped summary dozens of times a day, and her teammates only know dplyr. What is the soundest call?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Rewrite the whole analysis in data.table and ask the team to learn the bracket ::no Pure data.table is the fastest, but forcing a syntax the team cannot read trades collaboration for speed. There is a way to keep both.
- Use dtplyr: the team keeps writing dplyr, and data.table runs it underneath for the speed and the memory win ::ok Right. `lazy_dt()` lets them write the dplyr they know while data.table does the heavy lifting, the best of both for large in-memory data. Lesson 4 builds exactly this.
- Stay on plain dplyr; at 200 million rows the engine difference will not matter ::no At 200 million rows run dozens of times a day, the engine difference is precisely what matters. The trick is getting data.table speed without giving up dplyr syntax.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Introduction to data.table (CRAN vignette)](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-intro.html) - the canonical tour of the `DT[i, j, by]` grammar you compared against dplyr here.
- [Reference semantics (CRAN vignette)](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-reference-semantics.html) - what `:=` (modify by reference) really does, and exactly why it skips the copy.
- [dplyr (tidyverse)](https://dplyr.tidyverse.org/) - the verbs and the pipe on the dplyr side of the comparison, from the source.
- [dtplyr (tidyverse)](https://dtplyr.tidyverse.org/) - write dplyr, get data.table speed: the bridge this lesson teased and Lesson 4 builds.

=== step === complete
## Lesson 2 complete

You have now seen dplyr and data.table head to head. The headline: for the same wrangling they return the **same result**, so the choice is about cost, not correctness. You measured the cost with a real benchmark, traced data.table's edge to three design choices (an optimized C engine, modify-by-reference with `:=`, and one fused pass), and learned when to reach for each, including the dtplyr bridge that gives you both.

So far, though, every table has fit in memory. Next, Lesson 3: bigger-than-memory data, where the rows number in the hundreds of millions and the file is larger than your laptop's RAM, so no in-memory tool, dplyr or data.table, can load it at all. You will learn to stream it in chunks and query it on disk.
