---
title: "Strings & Dates Lesson 4: Factors with forcats"
catalog_blurb: "Put categories in a meaningful order so counts and charts read right."
description: "Turn text categories into ordered factors with forcats: set a meaningful level order, reorder by frequency or value, and relabel and lump rare categories."
keywords: "factors in R, forcats, factor levels, reorder factor, fct_relevel, fct_reorder, fct_infreq, fct_recode, fct_lump, ordered factor, categorical data in R"
post_type: "LESSON"
curriculum_id: "1.5.4"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-strings"
course_title: "Strings, Dates and Factors in R"
course_lesson: "4"
course_total: "4"
course_landing: "R-Foundations-Strings-Course.html"
course_next: ""
course_prev: "Dates-and-Times-in-R.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## Factors with forcats
Back at **Fern & Co.**, the plant shop from the last lesson, every order records a **size**: `"Small"`, `"Medium"` or `"Large"`. You ask R for a simple count of how many of each you sold, and it hands you the answer in this order: **Large, Medium, Small**. Backwards. A bar chart built from it reads backwards too.

R is not being difficult. It is doing the only thing it can with plain text: sorting the words alphabetically, where "Large" beats "Medium" beats "Small". To make a category keep its **real** order, you store it as a **factor**, and the **forcats** package gives you a tidy toolkit for building and rearranging them. By the end of this lesson you will be able to:

- Explain what a factor is and create one with the exact order you want
- Reorder a factor's levels by frequency, by another column, or by hand
- Rename categories and pool a long tail of rare ones into a single "Other"

**Prerequisites:** you can run a line of R and store a result with `<-` ([Your First R Session](R-Syntax-and-First-Objects.html)), and you know what a vector and the **character** type are ([Atomic Vectors and Data Types](Atomic-Vectors-and-Data-Types.html)). You just turned date text into a weekday; a weekday is a category with a natural order, so factors are the natural next step. Press Run to see the whole payoff at once; the rest of the lesson builds it up piece by piece.

::widget table-transform {"caption":"Stored as plain text the sizes sort alphabetically (Large first); stored as a factor with set levels, the same counts line up Small, Medium, Large.","code":"library(forcats)\ndf$size <- factor(df$size, levels = c(\"Small\", \"Medium\", \"Large\"))\nfct_count(df$size)","before":{"cols":["size"],"rows":[["Small"],["Large"],["Medium"],["Small"],["Medium"],["Large"],["Small"],["Medium"]]},"after":{"cols":["size","orders"],"rows":[["Small","3"],["Medium","3"],["Large","2"]]}}

=== step === concept
::eyebrow The problem
## Plain text falls in the wrong order

Let's make the problem concrete. Here are Fern & Co.'s 15 most recent orders. Each lesson runs in a fresh R session, so we build the little data frame right here (run this once and it stays available for the rest of the lesson):

```r
# Fern & Co.'s 15 most recent orders
orders <- data.frame(
  plant = c("Fern", "Cactus", "Fern", "Orchid", "Cactus", "Fern", "Aloe", "Fern",
            "Cactus", "Palm", "Fern", "Orchid", "Cactus", "Ivy", "Fern"),
  size  = c("Small", "Large", "Medium", "Small", "Medium", "Large", "Small", "Medium",
            "Large", "Medium", "Small", "Large", "Medium", "Small", "Medium"),
  price = c(8, 22, 14, 11, 15, 25, 9, 13, 24, 16, 8, 19, 15, 7, 14),
  stringsAsFactors = FALSE
)
```

Now ask for the count of each size. Because `size` is just text, R sorts the labels alphabetically:

```r
table(orders$size)
#>
#>  Large Medium  Small
#>      4      6      5
```

"Large" lands first only because L comes before M and S in the alphabet. The order that actually means something, smallest to largest, is nowhere in the result. Sort it, filter it, plot it: it will stay stubbornly alphabetical until you tell R what the real order is.

=== step === concept
::eyebrow The core idea
## What a factor really is

A **factor** is R's type for a category: a value that can only be one of a fixed, named set of possibilities, called the **levels**. When you create one, you list the levels in the order you want, and that order sticks from then on.

```r
# list the levels in their real order
size_f <- factor(orders$size, levels = c("Small", "Medium", "Large"))
size_f
#>  [1] Small  Large  Medium Small  Medium Large  Small  Medium Large  Medium
#> [11] Small  Large  Medium Small  Medium
#> Levels: Small Medium Large
```

Notice the extra line: `Levels: Small Medium Large`. That is the factor remembering its allowed values, in the order you gave. Here is the part that explains everything else. Underneath, a factor does **not** store the words over and over. It stores a small **integer code** for each value, plus one lookup table of labels. `Small` is code 1, `Medium` is 2, `Large` is 3:

```r
levels(size_f)        # the fixed set of allowed values, in order
#> [1] "Small"  "Medium" "Large"
as.integer(size_f)    # what is really stored: a code pointing into levels
#>  [1] 1 3 2 1 2 3 1 2 3 2 1 3 2 1 2
```

[KEY INSIGHT]
A factor is two things: a vector of integer **codes**, and a **levels** lookup that maps each code to a label. Everything you do with forcats, ordering, renaming, lumping, is just rearranging or relabelling that small lookup, never touching the data row by row.

So there are really three jobs you will do with factors, and the rest of the lesson walks them in order:

::widget process-flow {"steps":[{"title":"Create","sub":"pin the real order with factor levels"},{"title":"Reorder","sub":"by frequency, by another column, or by hand"},{"title":"Relabel","sub":"rename levels and pool rare ones"}]}

=== step === concept
::eyebrow Job 1
## Create a factor with the order you want

You already saw the move: `factor(x, levels = ...)`. The trick is simply that **you** choose the order of `levels`, and R obeys it everywhere afterwards. Store the size column as a factor and the same count now comes out the way a human reads sizes:

```r
orders$size <- factor(orders$size, levels = c("Small", "Medium", "Large"))
table(orders$size)
#>
#>  Small Medium  Large
#>      5      6      4
```

Same numbers as before, finally in a sensible order, and any chart built from this column will follow suit. If the order is not just for display but genuinely meaningful (small really is *less than* large), add `ordered = TRUE`. That lets you compare levels with `<` and `>`:

```r
sz <- factor(c("Small", "Large", "Medium"),
             levels = c("Small", "Medium", "Large"), ordered = TRUE)
sz < "Large"        # which orders are smaller than a Large?
#> [1]  TRUE FALSE  TRUE
```

[NOTE]
Use a plain factor when you only care about display order (product categories, regions). Reach for `ordered = TRUE` only when the levels have a true ranking you want to compare, like Small < Medium < Large or Low < Medium < High.

=== step === quiz
::eyebrow Check yourself
## Where do the counts land?

A customer-satisfaction column holds the plain text values `"High"`, `"Low"` and `"Medium"`. You run `table()` on it **without** making it a factor first. In what order do the three counts appear?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- High, Low, Medium ::ok Right. Plain text sorts alphabetically, so "High" comes first even though it is the top rating, and "Medium" comes last. That backwards order is exactly why you pin the order yourself with factor(levels = ...).
- Low, Medium, High ::no That is the order you *want*, but R has no way to know it from the text alone. It just sees three strings and sorts them alphabetically until you declare the real order by making the column a factor.
- Medium, Low, High, the order they first appear in the data ::no table() does not keep first-seen order for plain text; it always sorts alphabetically. (There is a forcats verb, fct_inorder, that gives first-seen order, but only once the column is a factor.)

=== step === concept
::eyebrow Job 2
## Reorder the levels

Setting the order by hand at creation time is the start. Often you want to *re*order an existing factor, and forcats has one small verb for each way you might want to. Each returns a new factor with the same data but a rearranged levels lookup. To see what each does, print the `levels()` afterwards. Below I use R's pipe, `|>`, which just feeds the result on its left into the function on its right, so `x |> levels()` means the same as `levels(x)`, read left to right:

```r
library(forcats)

fct_infreq(orders$size)  |> levels()   # most common level first
#> [1] "Medium" "Small"  "Large"

fct_relevel(orders$size, "Large") |> levels()  # bring one level to the front
#> [1] "Large"  "Small"  "Medium"

fct_rev(orders$size) |> levels()       # reverse the current order
#> [1] "Large"  "Medium" "Small"
```

The most useful one in practice is `fct_reorder()`, which orders a category **by another column**. This is what makes a bar chart sort itself by value instead of by name. Order the plant varieties by their average price, cheapest first:

```r
plant_f  <- factor(orders$plant)
by_price <- fct_reorder(plant_f, orders$price, .fun = mean)
levels(by_price)
#> [1] "Ivy"    "Aloe"   "Fern"   "Orchid" "Palm"   "Cactus"
```

[KEY INSIGHT]
`fct_infreq` orders by how often each level occurs; `fct_reorder` orders by a summary (the mean here) of a second column. Both are the everyday fix for "my chart's bars are in alphabetical order and I want them sorted by size."

=== step === tryit
::eyebrow Your turn
## Put the busiest size first

For a bar chart of sales, Fern & Co. wants the **most common size first**, then the next, and so on. The `orders$size` factor is ready below. Fill in the blank with the forcats verb that orders a factor's levels from most frequent to least frequent.

```r
library(forcats)
orders$size <- factor(orders$size, levels = c("Small", "Medium", "Large"))
levels(____)   # size levels, most common first
```
::check {"regex":"fct_infreq\\s*[(]\\s*orders\\$size","gate":true,"difficulty":"intermediate","ok":"Exactly. fct_infreq(orders$size) reorders the levels by count, so the size you sell most leads the chart. Here that puts Medium (6 orders) first, then Small (5), then Large (4).","no":"Reach for fct_infreq, the verb that orders levels by frequency: fct_infreq(orders$size)."}
::solution
```r
library(forcats)
orders$size <- factor(orders$size, levels = c("Small", "Medium", "Large"))
levels(fct_infreq(orders$size))
#> [1] "Medium" "Small"  "Large"
```

=== step === concept
::eyebrow Job 3
## Relabel and lump

Two more everyday jobs. First, **renaming** levels with `fct_recode()`. The rule to memorise is the direction: the **new** name goes on the left, the **existing** level it replaces (quoted) on the right.

```r
size_short <- fct_recode(orders$size,
  "S" = "Small", "M" = "Medium", "L" = "Large")
levels(size_short)
#> [1] "S" "M" "L"
```

Second, **lumping**. Fern & Co. sells a few popular varieties and a long tail of one-offs. For a clean summary you want the top sellers named and everything else pooled into a single "Other". `fct_lump_n()` keeps the *n* most common levels and lumps the rest:

```r
plant_lumped <- fct_lump_n(factor(orders$plant), n = 3)
fct_count(plant_lumped, sort = TRUE)   # sort = TRUE: most common first
#> # A tibble: 4 x 2
#>   f          n
#>   <fct>  <int>
#> 1 Fern       6
#> 2 Cactus     4
#> 3 Other      3
#> 4 Orchid     2
```

Here `fct_count()` is just forcats' tidy version of `table()`: it returns each level with its count as a small data frame, biggest first when you pass `sort = TRUE`. The three one-off varieties (Aloe, Palm, Ivy) collapse into a single "Other" worth 3 orders, so the summary stays readable instead of trailing off into a list of singletons. The widget shows the same move on the variety counts:

::widget table-transform {"caption":"fct_lump_n keeps the three most common varieties and pools the rare ones (Aloe, Palm, Ivy) into a single Other category.","code":"library(forcats)\norders$plant <- fct_lump_n(factor(orders$plant), n = 3)\nfct_count(orders$plant, sort = TRUE)","before":{"cols":["variety","orders"],"rows":[["Fern","6"],["Cactus","4"],["Orchid","2"],["Aloe","1"],["Palm","1"],["Ivy","1"]]},"after":{"cols":["variety","orders"],"rows":[["Fern","6"],["Cactus","4"],["Orchid","2"],["Other","3"]]}}

=== step === quiz
::eyebrow Check yourself
## Which way does fct_recode go?

You want to rename the level `"Small"` to `"S"`. Which call does it correctly?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `fct_recode(size, "S" = "Small")` ::ok Right. fct_recode reads new = "old": the new label on the left, the existing level it replaces (quoted) on the right.
- `fct_recode(size, "Small" = "S")` ::no Backwards. This tells forcats to find an existing level called "S" and rename it to "Small". There is no "S" level, so nothing changes and forcats warns about an unknown level.
- `fct_recode(size, Small = S)` ::no Two problems: the value on the right must be a quoted existing level ("Small"), and it is still new = old, so the names are reversed as well.

=== step === concept
::eyebrow Watch out
## Where factors bite

Factors are friendly until two traps catch you. Trap one: a column of **numbers that imported as a factor**. Calling `as.numeric()` on it gives you the integer **codes**, not the numbers you see:

```r
years <- factor(c("2019", "2020", "2019", "2021"))
as.numeric(years)               # WRONG: these are level codes 1, 2, 1, 3
#> [1] 1 2 1 3
as.numeric(as.character(years)) # right: go through character first
#> [1] 2019 2020 2019 2021
```

Trap two: filtering a factor **keeps the unused levels around**. Take only the small orders and the count still lists Medium and Large at zero, because the levels lookup is unchanged:

```r
small_only <- orders$size[orders$size == "Small"]
table(small_only)               # Medium and Large linger at 0
#> small_only
#>  Small Medium  Large
#>      5      0      0
table(droplevels(small_only))   # drop the levels with no data
#> small_only
#> Small
#>     5
```

[WARNING]
Two rules to keep: to recover numbers from a factor, always go `as.numeric(as.character(x))`, never `as.numeric(x)`. And after subsetting, call `droplevels()` (or `fct_drop()`) if you do not want empty categories haunting your tables and charts.

=== step === concept
::eyebrow Go deeper
## References

Four trustworthy, free places to take factors further:

- [forcats (tidyverse) - official site](https://forcats.tidyverse.org/) - the home page and full reference for every fct_ verb you used here.
- [R for Data Science (2e): Factors](https://r4ds.hadley.nz/factors) - the canonical, example-led chapter, including reordering factors in plots.
- [Posit forcats cheatsheet](https://rstudio.github.io/cheatsheets/html/factors.html) - a one-page visual map of creating, reordering, relabelling and combining factors.
- [forcats function reference](https://forcats.tidyverse.org/reference/index.html) - the complete index, grouped by job (change order, change value, add or drop levels).

=== step === complete
## Lesson 4 complete

You took a column of plain-text categories that insisted on sorting alphabetically and made it behave. The key idea was the first one: a factor stores its categories as integer **codes** plus an ordered **levels** lookup, so once you set the levels, the order sticks everywhere. From there it was three jobs: **create** with `factor(levels = ...)`, **reorder** with `fct_infreq`, `fct_relevel`, `fct_rev` and `fct_reorder`, and **relabel** with `fct_recode` and `fct_lump_n`, plus the two traps to sidestep (`as.numeric(as.character())` and `droplevels()`).

That also closes the **Strings, Dates and Factors** course: you can now detect and reshape text with stringr, build patterns with regular expressions, turn date text into real dates with lubridate, and put categories in the order you mean with forcats. Together they are the everyday toolkit for cleaning the messy, human side of a dataset, the part that arrives as words rather than numbers, and getting it ready for the analysis and charts that come next.
