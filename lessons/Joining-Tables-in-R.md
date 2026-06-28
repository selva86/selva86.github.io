---
title: "Joining Data Lesson 1: Joining Tables"
catalog_blurb: "Combine two tables on a shared key, any join type."
description: "Combine two keyed tables in R with dplyr joins: the mutating inner, left, right and full joins, the filtering semi and anti joins, and non-equi join_by."
keywords: "dplyr joins, inner_join, left_join, right_join, full_join, semi_join, anti_join, join_by, non-equi join, joining tables in R"
post_type: "LESSON"
curriculum_id: "2.2.1"
webr: true
lesson_access: "free"
course_id: "da-joins"
course_title: "Joining and Reshaping Data in R"
course_lesson: "1"
course_total: "3"
course_landing: "Join-Reshape-Course.html"
course_next: "Pivoting-Long-and-Wide-in-R.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## Joining Tables
You can already wrangle a single table: filter it, add columns, summarise it. But real data almost never arrives in one table. Maya's bakery keeps the week's **sales** in one place (what rang up at the till) and a **product catalogue** in another (each item's price and shelf). To answer something as simple as "how much revenue came from pastries?", she first has to stitch the two together.

That stitching is a **join**, and it is the whole of this lesson. Below are Maya's two tables. The key that links them is `item`, the column they share. Click through the join types and watch which rows survive.

By the end of this lesson you will be able to:

- Combine two tables with the mutating joins (`inner`, `left`, `right`, `full`) and predict what happens to unmatched rows
- Keep or drop rows by whether a match exists, with the filtering joins (`semi`, `anti`)
- Match on a range instead of an exact key with a non-equi join (`join_by()`)

**Prerequisites:** you can run R, and you know the dplyr verbs and the pipe from [The dplyr Verbs](The-dplyr-Verbs.html). A [tibble](Importing-and-Tidy-Data-in-R.html) and `NA` (a missing value) are all you need besides.

::widget join-diagram {"left":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"right":{"cols":["item","price"],"rows":[["Sourdough",4.5],["Bagel",1.5],["Croissant",4],["Muffin",3]]},"key":"item","op":"inner"}

=== step === concept
::eyebrow The key, and the first join
## inner_join keeps only the matches

Every join needs a **key**: a column whose values identify the same thing in both tables. Here the key is `item`. Wherever the same item appears in both tables, a join can line the two rows up side by side.

Let us build Maya's two tables. Each lesson runs in a fresh R session, so we make the data right here, then never touch the disk again:

```r
library(dplyr)    # the join verbs and the pipe
library(tibble)   # tibble()

# What Maya's till rang up this week, one row per sale:
sales <- tibble(
  item  = c("Sourdough", "Bagel", "Croissant", "Pretzel"),
  units = c(20, 38, 15, 12)
)

# Maya's standing catalogue: a price and a shelf for each item:
products <- tibble(
  item     = c("Sourdough", "Bagel", "Croissant", "Muffin"),
  price    = c(4.5, 1.5, 4.0, 3.0),
  category = c("Bread", "Bread", "Pastry", "Pastry")
)
```

Look closely and you will spot two odd ones out. **Pretzel** was a one-off special Maya tried, so it sold but is not in the catalogue. **Muffin** is in the catalogue but did not sell this week. Three items, Sourdough, Bagel and Croissant, appear in both. Those three are the **matches**.

The simplest join, `inner_join()`, keeps only the matches. It walks the left table (`sales`), and for every row whose key is also in the right table (`products`), it glues the two rows together; rows with no match on the other side are dropped.

```r
inner_join(sales, products, by = "item")
#> # A tibble: 3 x 4
#>   item      units price category
#>   <chr>     <dbl> <dbl> <chr>
#> 1 Sourdough    20   4.5 Bread
#> 2 Bagel        38   1.5 Bread
#> 3 Croissant    15   4   Pastry
```

Three rows, four columns: the two from `sales` plus the two new ones from `products`. Pretzel and Muffin both vanished, because neither had a partner on the other side. The `by = "item"` argument names the key; leave it out and dplyr guesses it from the column names the two tables share (and tells you which it picked).

::widget join-diagram {"left":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"right":{"cols":["item","price"],"rows":[["Sourdough",4.5],["Bagel",1.5],["Croissant",4],["Muffin",3]]},"key":"item","op":"inner"}

=== step === concept
::eyebrow Keep everything on one side
## left_join keeps every left row

`inner_join` silently dropped a real sale. That is usually not what you want: if you are building Maya's receipt report, losing the Pretzel sale would hide revenue. The fix is `left_join()`.

A `left_join()` keeps **every row of the left table**, matched or not. Where a left row finds a partner on the right, its new columns are filled in; where it finds none, those columns are filled with `NA`, R's marker for a missing value.

```r
left_join(sales, products, by = "item")
#> # A tibble: 4 x 4
#>   item      units price category
#>   <chr>     <dbl> <dbl> <chr>
#> 1 Sourdough    20   4.5 Bread
#> 2 Bagel        38   1.5 Bread
#> 3 Croissant    15   4   Pastry
#> 4 Pretzel      12  NA   NA
```

Now all four sales are present. Pretzel kept its `units` but has `NA` for `price` and `category`, because the catalogue had nothing to offer it. This is the everyday workhorse: "take my table, and look up some extra columns for it, keeping all my rows no matter what."

[KEY INSIGHT]
A `left_join` never loses a left row and never adds one (as long as each key matches at most one right row). It only ever widens the table with looked-up columns, leaving `NA` where the lookup came up empty.

::widget join-diagram {"left":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"right":{"cols":["item","price"],"rows":[["Sourdough",4.5],["Bagel",1.5],["Croissant",4],["Muffin",3]]},"key":"item","op":"left"}

=== step === quiz
::eyebrow Check yourself
## Which join keeps the special?

Maya's weekly receipt report must list **every sale**, including the Pretzel special that is not in her catalogue, with price and category filled in wherever she has them. Which call does that?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `left_join(sales, products, by = "item")` ::ok Right. `left_join` keeps every LEFT row, all four sales including Pretzel, and fills `price` and `category` with `NA` where there is no catalogue match.
- `inner_join(sales, products, by = "item")` ::no `inner_join` keeps only items in BOTH tables, so it silently DROPS the Pretzel sale. Maya's report would be missing a sale she actually made.
- `right_join(sales, products, by = "item")` ::no `right_join` keeps every CATALOGUE row, so it would ADD the unsold Muffin and still drop the Pretzel sale, wrong on both counts.

=== step === concept
::eyebrow The other two directions
## right_join, full_join, and how to choose

`left_join` keeps all of the left table. Its mirror image, `right_join()`, keeps all of the **right** table instead, dropping unmatched left rows. And `full_join()` keeps **everything from both** sides, padding with `NA` wherever a row had no partner.

```r
right_join(sales, products, by = "item")   # every CATALOGUE row; Muffin never sold
#> # A tibble: 4 x 4
#>   item      units price category
#> 1 Sourdough    20   4.5 Bread
#> 2 Bagel        38   1.5 Bread
#> 3 Croissant    15   4   Pastry
#> 4 Muffin       NA   3   Pastry

full_join(sales, products, by = "item")    # everything from BOTH sides
#> # A tibble: 5 x 4
#>   item      units price category
#> 1 Sourdough    20   4.5 Bread
#> 2 Bagel        38   1.5 Bread
#> 3 Croissant    15   4   Pastry
#> 4 Pretzel      12  NA   NA
#> 5 Muffin       NA   3   Pastry
```

These four, `inner`, `left`, `right` and `full`, are the **mutating joins**: they all combine columns from both tables, differing only in which unmatched rows they keep. Switch between them in the widget and watch the row count move: 3 (inner), 4 (left), 4 (right), 5 (full).

A simple way to choose:

- Only rows present in **both** tables? `inner_join`.
- Keep every row of **your** table, fill gaps with `NA`? `left_join`, the default reach.
- Keep every row of the **lookup** table? `right_join`, or just swap the arguments and use `left_join`.
- Keep **everything** from both? `full_join`.

[WARNING]
Joins multiply rows when a key is not unique. If the right table had two rows for `Bagel`, every `Bagel` sale would match both and the result would gain a row. Before a join, check your key is unique on at least one side, for example with `count(products, item)` and looking for any count above 1.

::widget join-diagram {"left":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"right":{"cols":["item","price"],"rows":[["Sourdough",4.5],["Bagel",1.5],["Croissant",4],["Muffin",3]]},"key":"item","op":"full"}

=== step === tryit
::eyebrow Your turn
## Attach the catalogue to every sale

Maya wants `price` and `category` next to **every** sale, Pretzel included, with `NA` where the catalogue has no entry. Fill in the join verb that keeps all the left (sales) rows, then check it.

```r
sales %>%
  ____(products, by = "item")
#> all 4 sales, Pretzel with NA price and category
```
::check {"regex":"left_join","gate":true,"difficulty":"beginner","ok":"Exactly: left_join keeps all four sales and looks up price and category, leaving NA for the uncatalogued Pretzel.","no":"You want every sale kept, so use the left table in full: left_join(products, by = \"item\")."}
::solution
```r
sales %>%
  left_join(products, by = "item")
```

=== step === concept
::eyebrow Filter, do not widen
## semi_join and anti_join keep rows, add no columns

The four mutating joins all add columns. Sometimes you do not want extra columns at all, you only want to **filter** one table by whether a match exists in another. That is what the two **filtering joins** do, and they return the left table's columns unchanged.

- `semi_join(x, y)` keeps the rows of `x` that **have** a match in `y`.
- `anti_join(x, y)` keeps the rows of `x` that have **no** match in `y`.

```r
# which sales are items we actually stock? (left columns only, no price added)
semi_join(sales, products, by = "item")
#> # A tibble: 3 x 2
#>   item      units
#> 1 Sourdough    20
#> 2 Bagel        38
#> 3 Croissant    15

# which sales are NOT in the catalogue? the odd ones out
anti_join(sales, products, by = "item")
#> # A tibble: 1 x 2
#>   item    units
#> 1 Pretzel    12
```

`semi_join` gave the three stocked sales; `anti_join` gave the single Pretzel. Notice neither added `price` or `category`: a filtering join answers "which rows?", never "with what extra data?". `anti_join` is the fastest way to find the mismatches in a dataset, the keys on one side that the other side has never heard of.

::widget join-diagram {"left":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"right":{"cols":["item","price"],"rows":[["Sourdough",4.5],["Bagel",1.5],["Croissant",4],["Muffin",3]]},"key":"item","op":"semi"}

=== step === quiz
::eyebrow Check yourself
## Find the unsold items

Maya wants the **catalogue items that did NOT sell at all** this week, so she can plan a promotion. Which one call returns exactly those?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `anti_join(products, sales, by = "item")` ::ok Right. `anti_join` keeps LEFT rows with no match. With `products` on the left, that is the catalogue items no sale touched, the unsold Muffin.
- `anti_join(sales, products, by = "item")` ::no Same verb, tables swapped: this returns SALES with no catalogue entry (the Pretzel), the opposite of what she asked. In a join, which table is on the left decides the answer.
- `semi_join(products, sales, by = "item")` ::no `semi_join` keeps the matches, so this gives the catalogue items that DID sell, not the unsold ones.

=== step === concept
::eyebrow When the key is a range
## Non-equi joins with join_by()

Every join so far matched a key to an **equal** key: `item == item`. But sometimes the thing that links two tables is not equality. Maya gives a volume discount by band: 1 to 9 loaves is "single", 10 to 23 is "dozen", 24 and up is "bulk". The band a sale falls into depends on whether its `units` lands **between** a band's low and high bounds, not on any equal key.

For that you reach for `join_by()`, which lets a join condition be an inequality. Match each sale to the one band whose `lo..hi` range contains its `units`:

```r
# a discount band keyed by a RANGE of units, not a single value:
tiers <- tibble(
  tier = c("single", "dozen", "bulk"),
  lo   = c(1, 10, 24),
  hi   = c(9, 23, 999)
)

# keep each sale; attach the band whose lo <= units <= hi:
left_join(sales, tiers, join_by(units >= lo, units <= hi))
#> # A tibble: 4 x 5
#>   item      units tier     lo    hi
#> 1 Sourdough    20 dozen    10    23
#> 2 Bagel        38 bulk     24   999
#> 3 Croissant    15 dozen    10    23
#> 4 Pretzel      12 dozen    10    23
```

Each sale picked up exactly the band it belongs to. The two conditions inside `join_by()` are read together with AND: a row matches a band only when `units >= lo` and `units <= hi` are both true. (The shorthand `join_by(between(units, lo, hi))` says the same thing.) The same idea powers a **rolling** join, matching to the nearest earlier value, which `join_by()` writes with `closest()`, handy for "the price in effect on the day of each sale".

::widget table-transform {"code":"left_join(sales, tiers, join_by(between(units, lo, hi)))","caption":"A non-equi join: each sale matched to the discount band whose lo..hi range contains its units. The new tier column is filled by a range test, not an equal key.","before":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"after":{"cols":["item","units","tier"],"rows":[["Sourdough",20,"dozen"],["Bagel",38,"bulk"],["Croissant",15,"dozen"],["Pretzel",12,"dozen"]]}}

=== step === tryit
::eyebrow Your turn
## Finish the range match

Put each sale in its discount band. The first condition, `units >= lo`, is written for you; add the second so a sale matches a band only when its `units` is also at or below the band's `hi`. Fill in the blank, then check it.

```r
sales %>%
  left_join(tiers, join_by(units >= lo, ____))
#> each sale gains its tier: dozen, bulk, dozen, dozen
```
::check {"regex":"units\\s*<=\\s*hi","gate":true,"difficulty":"intermediate","ok":"That is the upper bound: units <= hi. With both conditions ANDed, each sale lands in the one band whose range contains it.","no":"You need the high end of the band too: units <= hi (a sale matches only when units is at or below the band's hi)."}
::solution
```r
sales %>%
  left_join(tiers, join_by(units >= lo, units <= hi))
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Joins](https://r4ds.hadley.nz/joins) - the canonical, free chapter on keys, mutating joins and filtering joins.
- [dplyr: mutating joins (inner, left, right, full)](https://dplyr.tidyverse.org/reference/mutate-joins.html) - every argument, with the `NA` and duplicate-key behaviour spelled out.
- [dplyr: filtering joins (semi and anti)](https://dplyr.tidyverse.org/reference/filter-joins.html) - the keep-or-drop joins that add no columns.
- [dplyr: join_by()](https://dplyr.tidyverse.org/reference/join_by.html) - specifying keys, including non-equi and rolling (`closest`) matches.

=== step === complete
## Lesson 1 complete

You can now combine two tables in R. You learned the **key** that links them, the four **mutating joins** (`inner` keeps only matches, `left` and `right` keep one whole side with `NA` for the gaps, `full` keeps both), the two **filtering joins** (`semi` keeps matched rows, `anti` keeps unmatched ones, neither adding columns), and the **non-equi join** with `join_by()` for matching on a range. The guiding question is always the same: which rows do I want to keep, and do I need extra columns or just a filter?

Next, Lesson 2: Pivoting long and wide. A single table can still be the wrong **shape**, with a variable smeared across many columns or many rows. You will reshape it with `pivot_longer()` and `pivot_wider()`, the move that makes data ready for every dplyr verb, ggplot and model.
