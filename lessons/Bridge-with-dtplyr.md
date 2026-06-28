---
title: "data.table Lesson 4: dtplyr: dplyr at data.table Speed"
catalog_blurb: "Keep writing the code you know, and get big-data speed for free."
description: "Keep dplyr's readable syntax and get data.table's speed. dtplyr's lazy_dt() translates your pipes into data.table; see the translation with show_query()."
keywords: "dtplyr, lazy_dt, dplyr to data.table, show_query, dtplyr collect, fast dplyr in R, data.table backend, dplyr speed R"
post_type: "LESSON"
curriculum_id: "2.6.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-datatable"
course_title: "Fast Data Wrangling with data.table"
course_lesson: "4"
course_total: "4"
course_landing: "data-table-Course.html"
course_next: ""
course_prev: "Bigger-than-Memory-Data-in-R.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## dtplyr: dplyr at data.table Speed
Across this course Maya learned data.table on her bakery chain's sales: the `DT[i, j, by]` bracket and keys in Lesson 1, data.table beating dplyr on speed in Lesson 2, and querying data too big for memory in Lesson 3. One friction stuck around. data.table is fast, but its compact bracket is a second language to learn and to read, while the dplyr she already writes is slower on big tables.

**dtplyr** removes the trade-off. You keep writing ordinary dplyr, and dtplyr quietly translates it into data.table and lets data.table's engine do the work. Readable code on top, fast engine underneath.

By the end of this lesson you will be able to:

- Wrap a table with `lazy_dt()` and run the dplyr verbs you already know on it
- Reveal the data.table code dtplyr wrote with `show_query()`, and read it back as `DT[i, j, by]`
- Materialize a result with `collect()`, and judge when the bridge is worth it and where it leaks

**Prerequisites:** you can run R; you know the [dplyr verbs and the pipe](The-dplyr-Verbs.html) and the [data.table `DT[i, j, by]` bracket and `:=`](data-table-Syntax-and-Keys.html). We translate between the two, so both halves stay familiar.

::widget process-flow {"steps":[{"title":"Write dplyr","sub":"filter, group_by, summarise, the pipe, exactly as you already write it"},{"title":"lazy_dt records it","sub":"wrap the table once; the verbs are saved as a plan, not run yet"},{"title":"data.table runs it","sub":"the plan becomes fast data.table code and its engine executes it"},{"title":"collect the answer","sub":"pull the small result back into R as a tibble or data.table"}]}

=== step === concept
::eyebrow The wrapper
## lazy_dt(): wrap once, then write the dplyr you know

The whole bridge starts with one function. `lazy_dt()` takes a data frame (or a data.table) and wraps it into a **lazy data.table**: an object that looks like your table but, instead of running dplyr verbs the moment you type them, **records** them as a plan to hand to data.table later. "Lazy" just means "does not do the work yet."

Each lesson runs in a fresh R session, so we build Maya's sales right here, then wrap them once.

```r
library(dplyr)
library(data.table)
library(dtplyr)
setDTthreads(1)   # the in-browser R runs on one core

# Maya's bakery chain: a week of sales across three shops, one row per sale
sales <- data.table(
  shop    = c("Austin","Austin","Austin","Denver","Denver","Denver",
              "Seattle","Seattle","Seattle","Austin","Denver","Seattle"),
  item    = c("Sourdough","Bagel","Croissant","Sourdough","Bagel","Croissant",
              "Sourdough","Bagel","Croissant","Sourdough","Sourdough","Bagel"),
  units   = c(18, 40, 27, 22, 30, 15, 12, 33, 19, 20, 24, 28),
  revenue = c(81, 60, 108, 99, 45, 60, 54, 49, 76, 90, 108, 42)
)

sales_dt <- lazy_dt(sales)   # wrap once into a lazy data.table
sales_dt
#> Source: local data table [12 x 4]
#> Call:   `_DT1`
#>
#>   shop   item      units revenue
#>   <chr>  <chr>     <dbl>   <dbl>
#> 1 Austin Sourdough    18      81
#> 2 Austin Bagel        40      60
#> 3 Austin Croissant    27     108
#> # 9 more rows
#> # Use as.data.table()/as.data.frame()/as_tibble() to access results
```

Now write dplyr against `sales_dt` exactly as you always would. Nothing about the verbs changes:

```r
sales_dt |>
  filter(shop == "Austin")
#> Source: local data table [4 x 4]
#> Call:   `_DT1`[shop == "Austin"]
#>
#>   shop   item      units revenue
#>   <chr>  <chr>     <dbl>   <dbl>
#> 1 Austin Sourdough    18      81
#> 2 Austin Bagel        40      60
#> 3 Austin Croissant    27     108
#> 4 Austin Sourdough    20      90
```

Same `filter()` you already know, now carried out by data.table under the hood. The widget shows that step: keep the Austin rows, the others fall away.

::widget table-transform {"code":"sales_dt |> filter(shop == \"Austin\")","caption":"The same filter() you already write, now translated to data.table and run by its engine: keep the Austin rows, the four others fall away.","before":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Croissant",27,108],["Denver","Sourdough",22,99],["Denver","Bagel",30,45],["Seattle","Croissant",19,76],["Seattle","Bagel",28,42]]},"after":{"cols":["shop","item","units","revenue"],"rows":[["Austin","Sourdough",18,81],["Austin","Croissant",27,108]]}}

=== step === concept
::eyebrow The reveal
## show_query(): see the data.table it wrote

Here is the part that makes dtplyr more than a black box. Pipe your dplyr through `show_query()` and dtplyr prints the **exact data.table code it generated**, instead of running it. This is how you confirm there is real data.table underneath, and a surprisingly good way to learn the bracket.

```r
sales_dt |>
  group_by(shop) |>
  summarise(revenue = sum(revenue)) |>
  show_query()
#> `_DT1`[, .(revenue = sum(revenue)), keyby = .(shop)]
```

Read that output back as the `DT[i, j, by]` grammar from Lesson 1. `` `_DT1` `` is your `sales` table. The bracket has an empty `i` (all rows), a `j` of `.(revenue = sum(revenue))` (compute the total), and `keyby = .(shop)` (group by shop and return the result sorted). Your three readable dplyr verbs became one data.table bracket. That is precisely the line you would have had to write, and remember, by hand.

[KEY INSIGHT]
`show_query()` does not run anything. It shows you the translation. Every dplyr pipe on a lazy data.table has a data.table bracket waiting behind it, and this is how you read it.

=== step === quiz
::eyebrow Check yourself
## What does the work?

You wrap `sales` with `lazy_dt()`, then run `sales_dt |> group_by(shop) |> summarise(revenue = sum(revenue))`. Under the hood, what actually carries out that grouped sum?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Plain dplyr runs it the usual way; `lazy_dt()` only changes how the object prints ::no Not quite. The verbs look identical, but `lazy_dt()` reroutes them: dtplyr translates the pipe into data.table code (you just saw it with `show_query()`) and data.table runs it. dplyr is not doing the grouped sum here.
- dtplyr translates your verbs into data.table code, and data.table's engine runs it ::ok Right. dtplyr is a translator, not an engine. It turns `group_by` plus `summarise` into `` `_DT1`[, .(revenue = sum(revenue)), keyby = .(shop)] `` and hands that to data.table, which does the actual work.
- A separate engine built into dtplyr, independent of data.table ::no dtplyr has no engine of its own. It only writes data.table code (confirm it with `show_query()`); data.table is what executes it. That is exactly why you must have data.table installed to use dtplyr.

=== step === concept
::eyebrow The catch, and the feature
## Nothing runs until you collect()

A lazy data.table is lazy on purpose: building a pipe only **records** the plan, it does not touch the data. (Earlier the Austin `filter()` still printed rows because *printing* a lazy table forces a quick preview; assign the pipe to a name, as below, and nothing runs until you ask for it.) To actually run it and pull the answer back into R, you call **`collect()`**. It executes the recorded data.table code once and returns a tibble. (Use `as.data.table()` instead if you want a data.table back, or `as_tibble()` for a tibble by another name.)

```r
result <- sales_dt |>
  group_by(shop) |>
  summarise(revenue = sum(revenue)) |>
  arrange(desc(revenue)) |>
  collect()             # NOW it runs; the small result comes back to R
result
#> # A tibble: 3 x 2
#>   shop    revenue
#>   <chr>     <dbl>
#> 1 Austin      339
#> 2 Denver      312
#> 3 Seattle     221

sales_dt |>
  summarise(total = sum(revenue)) |>
  as.data.table()       # same idea, returns a data.table instead of a tibble
#>    total
#> 1:   872
```

Why add a step at all? Because laziness lets dtplyr see your **whole** pipe before running it, so data.table can fuse the filter, the grouping and the summary into one efficient pass instead of building a throwaway table after every verb. The translating is a fixed, one-time cost: \(O(1)\), it does not grow with the data. The work that scales is the single pass over the \(n\) rows, \(O(n)\), and data.table does that pass with a smaller constant and no intermediate copies. So the bigger the table, the more the translation cost disappears and the more you are simply paying data.table speed.

=== step === tryit
::eyebrow Your turn
## Run the plan

The lazy table `sales_dt` is still wrapped. The pipe below filters to the Austin shop, groups by item, and sums revenue, but as written it only holds the **recipe**: nothing has run, and no result has come back to R. Add the one step that executes the plan and returns a tibble.

```r
sales_dt |>
  filter(shop == "Austin") |>
  group_by(item) |>
  summarise(revenue = sum(revenue)) |>
  ____
```
::check {"regex":"collect\\s*\\(\\s*\\)","gate":true,"difficulty":"intermediate","ok":"That is it. collect() runs the recorded data.table code once and returns the small tibble. Without it you only hold the plan, never the answer.","no":"Add collect() as the final step. A lazy data.table records the verbs but runs nothing until you collect() (or as.data.table() / as_tibble())."}
::solution
```r
sales_dt |>
  filter(shop == "Austin") |>
  group_by(item) |>
  summarise(revenue = sum(revenue)) |>
  collect()
#> # A tibble: 3 x 2
#>   item      revenue
#>   <chr>       <dbl>
#> 1 Bagel          60
#> 2 Croissant     108
#> 3 Sourdough     171
```

=== step === concept
::eyebrow When it pays off
## The right tool for the size of the job

dtplyr is not always the answer, and that is the honest way to teach it. The bridge earns its keep when a table is **large but still fits in memory** and you want data.table speed without rewriting your analysis in the bracket. For a small table, plain dplyr is already instant and the translation is just extra ceremony. And when the data is **bigger than memory**, no in-memory tool helps; that is the out-of-core job you met in Lesson 3 (DuckDB). Pick by how the data compares to your RAM.

::widget process-flow {"steps":[{"title":"Small, fits easily","sub":"plain dplyr is already instant; the bridge overhead is not worth it"},{"title":"Big, but fits in RAM","sub":"lazy_dt gives data.table speed with the dplyr you already write"},{"title":"Bigger than RAM","sub":"go out of core with DuckDB, as in Lesson 3, not an in-memory bridge"}]}

A second, quieter payoff: because `show_query()` prints the data.table behind any pipe, dtplyr is one of the best ways to **learn** data.table. Write the dplyr you know, read the bracket it produced, and the terse syntax slowly stops being a second language.

=== step === concept
::eyebrow Where it leaks
## Honest limits of the bridge

A bridge has seams. Four are worth knowing before you lean on dtplyr in real work:

- **It is lazy.** Nothing runs until `collect()`, `as.data.table()`, `as_tibble()`, or printing. Forgetting to materialize, and then wondering why you are holding a plan instead of data, is the single most common dtplyr surprise.
- **It copies by default.** `lazy_dt(x)` is *immutable*, so dtplyr makes a copy rather than editing in place. You do **not** automatically get data.table's `:=` no-copy memory saving from Lesson 1. `lazy_dt(x, immutable = FALSE)` opts into in-place updates, but then operations can change your original table, so use it deliberately.
- **Not every verb translates.** Some dplyr operations have no clean data.table equivalent; dtplyr runs those in ordinary dplyr (in memory) and tells you with a message. The translation is best effort, not total.
- **Tiny data is not worth it.** On a small table the translation overhead can cost more than it saves. The win shows up on large tables, exactly where data.table shines.

[WARNING]
The immutable default is the seam that bites hardest. People reach for dtplyr expecting data.table's in-place, no-copy memory behavior and quietly get copies instead. If the no-copy saving is the reason you came, set `immutable = FALSE` on purpose, or write that hot path in data.table directly.

=== step === quiz
::eyebrow Check yourself
## Do you get the no-copy saving for free?

Maya wraps a 50-million-row table with `lazy_dt()` and adds a column with `mutate()`. She remembers from Lesson 1 that data.table's `:=` updates in place with no copy. Does her dtplyr pipe get that same no-copy memory saving automatically?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No. `lazy_dt()` is immutable by default, so dtplyr copies; she must set `immutable = FALSE` to update in place ::ok Right. The safe default protects her original table by copying, which means the `:=` no-copy saving is opt-in, not automatic. `lazy_dt(x, immutable = FALSE)` turns it on, with the usual care that her original can now change.
- Yes. dtplyr always modifies in place, just like a bare data.table ::no That is the trap. A bare data.table with `:=` updates in place, but `lazy_dt()` defaults to *immutable*, so dtplyr copies to keep the original safe. You only get in-place behavior by asking for `immutable = FALSE`.
- Yes, because `:=` is automatic whenever you use `mutate()` on a lazy table ::no `mutate()` does translate toward `:=`, but the immutable default still makes a copy first. The translation choosing `:=` and the table being modified in place are two different things; the second needs `immutable = FALSE`.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [dtplyr (tidyverse)](https://dtplyr.tidyverse.org/) - the package homepage: `lazy_dt()`, `collect()`, and the immutable default in the authors' own words.
- [dtplyr translation vignette](https://dtplyr.tidyverse.org/articles/translation.html) - exactly what `show_query()` shows, which dplyr verbs translate cleanly, and which fall back.
- [Introduction to data.table (CRAN vignette)](https://cran.r-project.org/web/packages/data.table/vignettes/datatable-intro.html) - the `DT[i, j, by]` engine your dplyr is translated into.
- [dplyr (tidyverse)](https://dplyr.tidyverse.org/) - the verbs and the pipe you keep writing on the near side of the bridge.

=== step === complete
## Course complete

You can now write dplyr and get data.table speed underneath. Wrap a table once with `lazy_dt()`, write the verbs you already know, read the translation with `show_query()`, and run it with `collect()`, all while knowing when the bridge pays off (big, in-memory tables) and where it leaks (it is lazy, it copies by default, and not every verb translates).

That closes **Fast Data Wrangling with data.table**. Across the course you went from the `DT[i, j, by]` bracket and keys, to data.table versus dplyr head to head, to querying data far bigger than your laptop, and finally to the dtplyr bridge that lets you keep dplyr's readability with data.table's speed. This course is part of the Data Analyst track: pass the track assessment and it counts toward your verified certificate.
