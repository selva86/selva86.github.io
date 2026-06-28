---
title: "Exploratory Data Analysis Lesson 5: Categorical EDA"
catalog_blurb: "Explore categories and frequencies, often trickier than plain numbers."
description: "Explore categorical data in R: build frequency and proportion tables, cross-tabulate two variables, read row versus column proportions, and fix rare, missing and mislabeled levels."
keywords: "categorical EDA, frequency table in R, proportion table, table function, prop.table, two-way cross tab, contingency table, bar chart, factor levels, dplyr count, exploratory data analysis"
post_type: "LESSON"
curriculum_id: "2.3.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "5"
course_total: "8"
course_landing: "EDA-Course.html"
course_next: "Distribution-Shape-and-Transformations.html"
course_prev: "Detecting-Outliers-in-R.html"
---

=== step === cover
::eyebrow Lesson 5 of 8
## Categorical EDA
In Lesson 4 you hunted outliers in Maya's **numbers**: her daily revenue and customer counts. But numbers are only half of most datasets. The other half is **categories**, the labels that say *which* item sold, *which* way the order came in, *which* kind of weather it was. A category has no mean and no boxplot, so it needs its own toolkit, and that toolkit is what this lesson hands you.

Maya has started logging every individual **order** at her bakery, not just the daily totals. Each of her 48 March orders carries two category columns: the `item` sold (croissant, sourdough, muffin, and so on) and the `channel` it came through (walk-in, online or phone). The chart below is the very first question you ask of a category: how often does each value occur?

By the end of this lesson you will be able to:

- Build a **frequency table** and a **proportion table** for a category in R (`table`, `prop.table`, `count`)
- Read a category's distribution from an **ordered bar chart**
- **Cross-tabulate** two categories and read it by **row versus column proportions** to answer the right question
- Spot and fix the three category defects, **rare**, **missing** and **mislabeled** levels, before they break an analysis

**Prerequisites:** you can run R and load a package with `library()`, and you have met one-variable EDA on numeric columns, the histogram, mean versus median, the IQR and the boxplot, in [Lesson 1](An-EDA-Framework-and-One-Variable.html) through [Lesson 4](Detecting-Outliers-in-R.html). Every new categorical term is defined as it appears.

::widget chart-plotter {"data":[{"x":"croissant","y":16},{"x":"sourdough","y":12},{"x":"muffin","y":8},{"x":"baguette","y":6},{"x":"cookie","y":4},{"x":"scone","y":2}],"geoms":["bar"],"x":"item","y":"orders","code":{"bar":"ggplot(orders, aes(item)) +\n  geom_bar()"}}

=== step === concept
::eyebrow The first move
## Counting categories: the frequency table

A **categorical variable** is one whose values are labels from a fixed set, not measured numbers. Maya's `item` is **nominal**: its values (croissant, muffin, scone) have no natural order. Some categories are **ordinal**, ordered but not numeric, like a `size` of small, medium, large. Each distinct value a category can take is called a **level**. Maya's `item` has six levels.

You cannot average a label, so the first thing you do with a category is **count it**: how many orders fall into each level? That count, level by level, is a **frequency table**, the categorical cousin of the histogram.

Each lesson runs in a fresh R session, so let us build Maya's order log here (run this once). It is deterministic, so every count below is exact:

```r
library(dplyr)

# 48 March orders: the item sold and the channel it came through
item <- c(
  rep("croissant", 16), rep("sourdough", 12), rep("muffin", 8),
  rep("baguette", 6),   rep("cookie", 4),     rep("scone", 2)
)
channel <- c(
  rep("walk-in", 10), rep("online", 4), rep("phone", 2),   # croissant
  rep("walk-in", 4),  rep("online", 6), rep("phone", 2),   # sourdough
  rep("walk-in", 5),  rep("online", 2), rep("phone", 1),   # muffin
  rep("walk-in", 4),  rep("online", 1), rep("phone", 1),   # baguette
  rep("walk-in", 3),  rep("online", 1),                    # cookie
  rep("walk-in", 2)                                         # scone
)
orders <- data.frame(item, channel, stringsAsFactors = FALSE)
nrow(orders)
#> [1] 48
```

Base R's `table()` counts the levels for you, in alphabetical order:

```r
table(orders$item)               # how many orders of each item
#>
#>  baguette    cookie croissant    muffin     scone sourdough
#>         6         4        16         8         2        12
```

The tidyverse equivalent, `dplyr::count()`, returns a tidy data frame and can sort it so the most popular level comes first, which is usually how you want to read it:

```r
count(orders, item, sort = TRUE)  # same counts, most popular first
#> # A tibble: 6 x 2
#>   item          n
#>   <chr>     <int>
#> 1 croissant    16
#> 2 sourdough    12
#> 3 muffin        8
#> 4 baguette      6
#> 5 cookie        4
#> 6 scone         2
```

Same six numbers, two ways. Croissants are the runaway favourite at 16 orders; scones limp in at 2. That single table is the categorical first look.

::widget table-transform {"code":"orders %>%\n  count(item, sort = TRUE)","caption":"Forty-eight individual order rows collapse to one count per item: the frequency table.","before":{"cols":["order","item","channel"],"rows":[["1","croissant","walk-in"],["2","croissant","online"],["3","sourdough","online"],["4","muffin","walk-in"],["...","...","..."]]},"after":{"cols":["item","n"],"rows":[["croissant",16],["sourdough",12],["muffin",8],["baguette",6],["cookie",4],["scone",2]]}}

=== step === concept
::eyebrow Counts into shares
## Proportions: each level as a share of the whole

A raw count answers "how many?" but not "how big a slice?" Sixteen croissants sounds impressive until you ask: out of how many orders? To compare levels fairly, and to compare across datasets of different sizes, you convert counts into **proportions**.

Write \(n_i\) for the count of orders of item \(i\) (its frequency) and \(N\) for the total number of orders. The proportion of item \(i\) is

\[ \hat p_i = \frac{n_i}{N} \]

read "p-hat sub i", the share of all orders that are that item. For croissants, \(\hat p = 16/48 = 0.333\): exactly a third. Because every order belongs to exactly one item, the six proportions add up to 1, or 100%.

In R, `prop.table()` divides a frequency table by its total:

```r
round(prop.table(table(orders$item)), 3)   # each count divided by 48
#>
#>  baguette    cookie croissant    muffin     scone sourdough
#>     0.125     0.083     0.333     0.167     0.042     0.250
```

Croissants are 33.3% of orders, sourdough a quarter, and scones a mere 4.2%. A clean version of that same table, percentages and all, reads much better in a report:

::widget styled-table {"cols":["item","orders","share"],"rows":[["croissant",16,0.333],["sourdough",12,0.25],["muffin",8,0.167],["baguette",6,0.125],["cookie",4,0.083],["scone",2,0.042]],"formats":{"share":"pct"},"title":"Items by frequency, March order log","note":"share = each item count divided by the 48 total orders; the six shares sum to 1."}

[KEY INSIGHT]
Counts and proportions answer different questions, so keep both. A **proportion** tells you how a level compares (croissants are a third of orders); the **count** behind it tells you how much to trust that share. A level can be 4% of your data and still be only 2 observations, far too few to model or to act on.

=== step === quiz
::eyebrow Check yourself
## What a proportion hides

`prop.table()` says scones are 4.2% of orders and croissants 33%. A colleague glances at it and says, "scones are negligible, only 4%, drop them." Reading the **proportion alone**, what crucial fact has been hidden?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- The raw count behind the 4.2%: it is just 2 actual scone orders out of 48, and a proportion on its own never tells you how many observations sit beneath it ::ok Exactly. A proportion is a ratio that throws away its denominator. 4.2% could be 2 orders out of 48 or 2,000 out of 48,000, and they read identically. Always check the count behind a small share before acting on it.
- Nothing: a proportion already contains everything the raw count does ::no A proportion deliberately discards the totals. 4% of 48 (two orders) and 4% of 50,000 (two thousand orders) give the same proportion but mean very different things; only the count tells them apart.
- That the proportions do not add up to 100%, so they cannot be compared ::no They do sum to 1 across the six items (0.125 + 0.083 + 0.333 + 0.167 + 0.042 + 0.250 = 1). The hidden fact is the raw count, not a broken total.

=== step === concept
::eyebrow Show it
## The bar chart: a frequency table you can see

A frequency table is exact, but the eye reads a picture faster. The right picture for a category is a **bar chart**: one bar per level, its height the count (or proportion). Unlike a histogram, the bars sit apart, because the categories are separate buckets, not a continuous range.

One habit makes a bar chart far more readable: **order the bars by frequency**, tallest first, instead of leaving them in alphabetical order. The shape of the distribution, who dominates, who is rare, jumps straight out.

```r
library(ggplot2)

ggplot(orders, aes(item)) +
  geom_bar()                     # one bar per item, height = count
```

[NOTE]
`geom_bar()` counts the rows for you, so you hand it the raw `orders`, not a pre-made table. By default the bars come in alphabetical order; to sort them tallest-first, reorder the item levels by their frequency (the tidyverse helper `forcats::fct_infreq()` does exactly this: `aes(fct_infreq(item))`).

The widget below is that same bar chart, already ordered by frequency. Croissant towers over scone, the same story the table told, now at a glance:

::widget chart-plotter {"data":[{"x":"croissant","y":16},{"x":"sourdough","y":12},{"x":"muffin","y":8},{"x":"baguette","y":6},{"x":"cookie","y":4},{"x":"scone","y":2}],"geoms":["bar"],"x":"item","y":"orders","code":{"bar":"ggplot(orders, aes(fct_infreq(item))) +\n  geom_bar()"}}

=== step === tryit
::eyebrow Your turn
## Turn counts into a proportion table

You have the item counts. Now express each item as a **share** of all 48 orders. Fill in the function that converts a frequency table into proportions.

```r
# each item as a share of all 48 orders
round(____(table(orders$item)), 3)
```
::check {"regex":"prop\\.table\\s*\\(","gate":true,"difficulty":"beginner","ok":"That divides each count by 48, so the six shares sum to 1: croissant is a third of all orders (0.333), scone just 4% (0.042).","no":"Wrap the counts in prop.table(): round(prop.table(table(orders$item)), 3)."}
::solution
```r
round(prop.table(table(orders$item)), 3)
#>
#>  baguette    cookie croissant    muffin     scone sourdough
#>     0.125     0.083     0.333     0.167     0.042     0.250
```

=== step === concept
::eyebrow Two categories at once
## The two-way cross-tab

One category tells you what sells. Two categories together tell you a *story*: does **how** an order arrives depend on **what** is ordered? To answer that you count every combination of `item` and `channel` at once, a **two-way cross-tabulation** (also called a contingency table). Hand `table()` two columns and it builds the grid: items down the rows, channels across the columns, each cell the joint count.

```r
tab <- table(orders$item, orders$channel)   # rows = item, columns = channel
addmargins(tab)                              # add the row and column totals
#>
#>             online phone walk-in Sum
#>   baguette       1     1       4   6
#>   cookie         1     0       3   4
#>   croissant      4     2      10  16
#>   muffin         2     1       5   8
#>   scone          0     0       2   2
#>   sourdough      6     2       4  12
#>   Sum           14     6      28  48
```

The `Sum` row and column are the **margins**: the channel totals (28 walk-in, 14 online, 6 phone) and the item totals you already knew. Walk-in dominates overall. But the cell counts hide a twist, and to see it you need proportions again, this time *within* a row or a column.

Reading proportions across one **row** conditions on the item. Write \(n_{ij}\) for the count in row item \(i\), column channel \(j\), and \(n_{i\cdot} = \sum_j n_{ij}\) for that item's row total. The **row (conditional) proportion** is

\[ \hat p_{j \mid i} = \frac{n_{ij}}{n_{i\cdot}} \]

the share of item \(i\)'s orders that arrived through channel \(j\). In R, `prop.table(tab, margin = 1)` divides each cell by its row total:

```r
round(prop.table(tab, margin = 1)["sourdough", ], 2)   # how each SOURDOUGH order arrived
#>  online   phone walk-in
#>    0.50    0.17    0.33
```

Half of all sourdough orders are placed **online**, far more than the 29% online share overall. Sourdough is a pre-order loaf. Now swap the denominator: divide each cell by its **column** total instead (`margin = 2`) and you answer the opposite question, who placed the online orders?

```r
round(prop.table(tab, margin = 2)[, "online"], 2)      # of all ONLINE orders, which item?
#> baguette    cookie croissant    muffin     scone sourdough
#>     0.07      0.07      0.29      0.14      0.00      0.43
```

Sourdough is 43% of online orders, the biggest slice but not a majority. The 100%-stacked bar below is the picture of those **row** proportions: each item's bar is split into its channel mix, sourdough's online block reaching up to the halfway line:

```r
ggplot(orders, aes(item, fill = channel)) +
  geom_bar(position = "fill") +              # each bar normalised to 1: the channel mix
  labs(y = "share of orders")
```

[KEY INSIGHT]
Row proportions and column proportions answer **different** questions from the **same** cells. "Half of sourdough is online" (a row, denominator = sourdough orders) is not "half of online is sourdough" (a column, denominator = online orders). Before you compute a conditional proportion, decide which total belongs in the denominator: the one that matches your question.

=== step === quiz
::eyebrow Check yourself
## Row or column?

From the cross-tab, **6 of sourdough's 12 orders** were online, and those same 6 are **6 of the 14 online orders**. Which statement does the **row-proportion** table (each item's row summing to 1) support?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Half of sourdough orders were placed online (6 of 12, so 0.50) ::ok Right. A row proportion conditions on the item: inside sourdough's 12 orders, half went online. You read across one item's row, whose total is the denominator.
- Half of online orders were sourdough ::no That conditions on the channel, the column, and it is 6 of 14, which is 0.43, not 0.50. That is a column proportion, a different denominator and a different question.
- Sourdough and online are the same-sized category, since the cell is 6 either way ::no The 6 is the overlap, read two ways. The categories have different totals (12 sourdough orders versus 14 online), which is exactly why 6 out of 12 and 6 out of 14 give different proportions.

=== step === concept
::eyebrow Before you trust a category
## Rare, missing and mislabeled levels

Real category columns arrive messy, and the mess will quietly wreck an analysis if you skip this step. Three defects show up again and again, and a single frequency table catches all three. Here is Maya's `channel` column as three different staff members **actually typed it**, before anyone cleaned it:

```r
# the channel column as it was really logged across the 48 orders
channel_raw <- c(
  rep("online", 9),   rep("Online", 5),
  rep("walk-in", 22), rep("Walk-in", 3), rep("walk-in ", 2),
  rep("phone", 5),    "wholesale", NA
)
length(channel_raw)               # still 48 orders
#> [1] 48
length(unique(channel_raw))       # but how many DISTINCT labels?
#> [1] 8
sum(is.na(channel_raw))           # orders with no channel recorded
#> [1] 1
```

Forty-eight orders, but **eight** distinct labels where there should be three. Tabulate it and the defects name themselves:

- **Mislabeled levels.** `online` and `Online` are the same channel typed two ways; `walk-in`, `Walk-in` and `walk-in ` (with a trailing space) are *three* spellings of one. R treats every spelling as a separate level, so your counts are silently split.
- **A rare level.** `wholesale` appears exactly once. A level with one or two observations is too thin to model and is often a typo or a genuine one-off that needs a decision.
- **A missing level.** One order has `NA`, no channel recorded at all. Ignore it and counts and proportions drift.

The cure is three small, deliberate fixes: standardise the spelling, collapse the rare level, and give the missing value its own honest label.

```r
clean <- tolower(trimws(channel_raw))    # mislabels: lowercase, then strip stray spaces
counts <- table(clean)                   # what survives the spelling fix?
rare   <- names(counts)[counts < 2]      # any level with fewer than 2 orders
clean[clean %in% rare] <- "other"        # collapse the rare one-off into "other"
clean[is.na(clean)]    <- "unknown"      # make the missing value its own level
table(clean)
#> clean
#>  online   other   phone unknown walk-in
#>      14       1       5       1      27
```

Eight messy labels become five honest ones: the three real channels (`online` 14, `walk-in` 27, `phone` 5), the rare order folded into `other`, and the blank made an explicit `unknown` instead of a silent gap.

[WARNING]
Never fix a rare or missing level by silently deleting the rows. Collapsing into `other` and labelling `NA` as `unknown` keeps every order in the count, and keeps your proportions honest. The tidyverse tool for the rare-level step is `forcats::fct_lump_min()`, which lumps any level below a count threshold into `other` in one call.

::widget table-transform {"code":"channel_raw |>\n  tolower() |>\n  trimws()  # then collapse rare, label NA","caption":"Eight raw labels collapse to five clean levels: three real channels, one other, one unknown. No order is dropped.","before":{"cols":["raw label","n"],"rows":[["walk-in",22],["online",9],["Online",5],["phone",5],["Walk-in",3],["walk-in (+ space)",2],["wholesale",1],["NA",1]]},"after":{"cols":["clean level","n"],"rows":[["walk-in",27],["online",14],["phone",5],["other",1],["unknown",1]]}}

=== step === tryit
::eyebrow Your turn
## Standardise the spelling

The single most common category defect is one value typed many ways. Fix it: lowercase every label so `Online` and `online` merge, after stripping stray spaces. Fill in the function that converts text to lowercase.

```r
# standardise case (after trimming spaces), then count the distinct labels
clean <- ____(trimws(channel_raw))
length(unique(clean))   # how many distinct labels now? (NA counts as one)
```
::check {"regex":"tolower\\s*\\(","gate":true,"difficulty":"intermediate","ok":"Right. tolower() merges Online into online and trimws() drops the trailing space on walk-in , so eight raw labels collapse to five: online, walk-in, phone, wholesale, and the missing NA.","no":"Lowercase the text with tolower(): clean <- tolower(trimws(channel_raw))."}
::solution
```r
clean <- tolower(trimws(channel_raw))
length(unique(clean))
#> [1] 5
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take categorical EDA further:

- [R for Data Science (2e), Exploratory Data Analysis](https://r4ds.hadley.nz/eda) - the "Categorical variation" and "covariation" sections cover bar charts and reading two categories together, exactly this lesson in a tidyverse workflow.
- [R for Data Science (2e), Factors](https://r4ds.hadley.nz/factors) - the forcats chapter: how to recode, reorder and lump levels, the cleaning you did by hand here, done idiomatically.
- [janitor: tabyl, a tidy table](https://sfirke.github.io/janitor/articles/tabyls.html) - one-call frequency and cross-tabulation with counts and percentages together, the convenient tool once you know what `table()` is doing underneath.
- [ggplot2 reference: geom_bar / geom_col](https://ggplot2.tidyverse.org/reference/geom_bar.html) - bar charts in full, including the stacked and `position = "fill"` proportion views you saw above.

=== step === complete
## Lesson 5 complete

You can now explore the categorical half of a dataset as carefully as the numeric half. You counted levels with a **frequency table** (`table`, `count`), turned counts into **proportions** (`prop.table`) and learned why a small share can still be too few observations to trust, read a category from an **ordered bar chart**, **cross-tabulated** two categories and answered the right question by choosing row versus column proportions, and cleaned the three defects, **mislabeled**, **rare** and **missing** levels, before they could corrupt a count.

Next, Lesson 6: Distribution shape and transformations. You will return to the numeric columns and read their *shape*, skew, heavy tails and multiple peaks, check it against a normal curve with a Q-Q plot, and tame a skewed variable with a log or Box-Cox transform so the methods in later courses behave.
