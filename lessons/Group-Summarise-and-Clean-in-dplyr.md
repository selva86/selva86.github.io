---
title: "Data Wrangling Lesson 3: Group, Summarise and Clean"
description: "Split-apply-combine with group_by and summarise, label rows with case_when, and handle missing values honestly with na.rm, drop or impute in R."
keywords: "group_by, summarise, case_when, na.rm, missing values, drop_na, dplyr, split-apply-combine, data wrangling in R"
post_type: "LESSON"
curriculum_id: "2.1.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-dplyr"
course_title: "Data Wrangling with dplyr"
course_lesson: "3"
course_total: "3"
course_landing: "Data-Wrangling-dplyr-Course.html"
course_next: ""
course_prev: "The-dplyr-Verbs.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## Group, summarise and clean

In Lesson 2 you learned the verbs that act on a table as a whole: `filter`, `select`, `mutate`, `arrange`. But Maya rarely wants the whole table. She wants answers about *parts* of it: how many of each loaf did I sell, what is the average revenue *per item*, which days were busy. That means splitting the table into groups, computing a number for each group, and stacking the results back together. This three-move pattern, plus labelling rows by a rule and dealing with the blanks real data always has, is the last set of skills that turns a tidy table into an answer.

By the end of this lesson you will be able to:

- Collapse a column to one number with `summarise()`, and a column *per group* with `group_by()`
- Tag every row with a category using `case_when()`
- Handle missing values honestly: `na.rm`, dropping, or filling them in

**Prerequisites:** Lesson 2, so you know the [dplyr verbs and the pipe](The-dplyr-Verbs.html). We define everything new as it appears.

::widget process-flow {"steps":[{"title":"Split","sub":"group_by() cuts the table into one pile per category"},{"title":"Apply","sub":"summarise() computes a number for each pile"},{"title":"Combine","sub":"the piles stack into one tidy row per group"}]}

=== step === concept
::eyebrow Collapse a column
## summarise() turns a whole column into one number

Here is Maya's week off the till: eight sales over four days. It is the same tidy table from Lesson 2, now with the last two days added. Look at the final row: the revenue is `NA`, because Maya forgot to log that Bagel sale. Hold that thought; we deal with it at the end of the lesson.

```r
library(tidyverse)   # dplyr (the verbs) + the pipe
sales
#> # A tibble: 8 x 4
#>   date       item      units revenue
#>   <date>     <chr>     <dbl>   <dbl>
#> 1 2024-03-01 Sourdough    18      81
#> 2 2024-03-01 Bagel        40      60
#> 3 2024-03-02 Sourdough    22      99
#> 4 2024-03-02 Croissant    15      60
#> 5 2024-03-03 Sourdough    20      90
#> 6 2024-03-03 Bagel        38      57
#> 7 2024-03-04 Croissant    12      48
#> 8 2024-03-04 Bagel        44      NA
```

Every verb so far returned a table with many rows. `summarise()` is the first verb that gives you back **one row**. You hand it a name and a function that reduces a whole column to a single value, and that value is all you get back:

```r
sales %>% summarise(total_units = sum(units),
                    mean_units  = mean(units))
#> # A tibble: 1 x 2
#>   total_units mean_units
#>         <dbl>      <dbl>
#> 1         209       26.1
```

`sum(units)` adds all eight counts into one total (209 loaves), and `mean(units)` averages them. The arithmetic mean is worth stating exactly, because it returns in a moment. For a column of values \(x_1, x_2, \dots, x_n\), where \(x_i\) is the units sold in sale \(i\) and \(n\) is the number of sales,

\[ \bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i \]

so \(\bar{x} = 209 / 8 = 26.1\). The whole point of `summarise()` is that *many rows go in, one row comes out*: the eight-row tibble above became a single summary row. In the next step you will see that collapse happen group by group.

=== step === concept
::eyebrow One number per group
## group_by() makes summarise() work per category

One grand total is rarely the answer. Maya does not want "26.1 loaves on average" across everything; she wants it *per item*, so she can see that Bagels move in big batches and Croissants trickle. That is where `group_by()` comes in. On its own it changes nothing you can see; it quietly tags the table so the **next** verb runs once per group instead of once for the whole table.

```r
sales %>%
  group_by(item) %>%
  summarise(n = n(), total_units = sum(units))
#> # A tibble: 3 x 3
#>   item          n total_units
#>   <chr>     <int>       <dbl>
#> 1 Bagel         3         122
#> 2 Croissant     2          27
#> 3 Sourdough     3          60
```

Read it as three moves, the pattern statisticians call **split-apply-combine**: `group_by(item)` *splits* the eight rows into three piles (Bagel, Croissant, Sourdough); `summarise()` *applies* its functions to each pile; and the results *combine* into one tidy row per group. The new verb here is `n()`, which takes no arguments and just counts the rows in the current group, so Maya sees she rang up three Bagel sales and two Croissant sales.

[KEY INSIGHT]
`summarise()` always returns one row per group. With no `group_by()` that is one row for the whole table; with `group_by(item)` it is one row per item. Changing the grouping is the single lever that changes the shape of your answer.

In the widget, watch the eight detail rows collapse into three group rows, each carrying its own count and total.

::widget table-transform {"code":"sales %>% group_by(item) %>% summarise(n = n(), total_units = sum(units))","caption":"Split-apply-combine: the eight sales split into three piles by item, and each pile collapses to one row with its own count and total.","before":{"cols":["date","item","units","revenue"],"rows":[["2024-03-01","Sourdough",18,81],["2024-03-01","Bagel",40,60],["2024-03-02","Sourdough",22,99],["2024-03-02","Croissant",15,60],["2024-03-03","Sourdough",20,90],["2024-03-03","Bagel",38,57],["2024-03-04","Croissant",12,48],["2024-03-04","Bagel",44,null]]},"after":{"cols":["item","n","total_units"],"rows":[["Bagel",3,122],["Croissant",2,27],["Sourdough",3,60]]}}

=== step === quiz
::eyebrow Check yourself
## How many rows come back?

Maya has 8 sales across 3 items. She runs:

```r
sales %>% group_by(item) %>% summarise(n = n())
```

How many rows does the result have?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- 3, one row per item ::ok Right. `summarise()` returns one row per group, and `group_by(item)` made three groups (Bagel, Croissant, Sourdough). The 8 detail rows collapse into 3.
- 8, one row per sale ::no That is the input shape. `summarise()` collapses each group to a single row; only `mutate()` would keep all 8 rows. Grouping plus summarise always shrinks the table to one row per group.
- 1, a single grand total ::no That is what you get with NO `group_by()`. Once you group by `item`, summarise runs once per item, so you get one row for each of the three items, not one overall.

=== step === tryit
::eyebrow Your turn
## Average loaves per item

Maya wants the **average units per item**, not the total. The pipe already groups by item; finish the `summarise()` so `mean_units` holds the mean of `units` for each group. Fill in the blank.

```r
sales %>%
  group_by(item) %>%
  summarise(mean_units = ____)
#> Bagel 40.7, Croissant 13.5, Sourdough 20
```
::check {"regex":"mean[(]\\s*units\\s*[)]","gate":true,"difficulty":"beginner","ok":"Exactly: mean(units) runs once per group, so Maya sees 40.7 for Bagels, 13.5 for Croissants and 20 for Sourdough. Same pipe, different function inside summarise.","no":"Use the mean() function on the units column: mean_units = mean(units). summarise applies it to each group in turn."}
::solution
```r
sales %>%
  group_by(item) %>%
  summarise(mean_units = mean(units))
```

=== step === concept
::eyebrow Label every row
## case_when() sorts rows into categories

Summaries answer "how much per group". The other everyday job is the opposite: tag each individual row with a label you can group or filter by later. Maya wants to call each sale **quiet**, **steady** or **busy** by how many loaves it moved. You could nest `if` statements, but dplyr has a clean verb for it: `case_when()`, used inside `mutate()` to build a new column.

`case_when()` is a list of `condition ~ value` rules. It checks each row against the rules **top to bottom and stops at the first one that is TRUE**, handing that row the matching label. The final `TRUE ~ ...` is a catch-all that fires when nothing above matched.

```r
sales %>%
  mutate(volume = case_when(
    units >= 35 ~ "busy",
    units >= 20 ~ "steady",
    TRUE        ~ "quiet"
  ))
```

For the 44-unit Bagel sale: is `44 >= 35`? Yes, so it is labelled `"busy"` and the lower rules are never checked. For the 22-unit Sourdough sale: `22 >= 35` is FALSE, `22 >= 20` is TRUE, so `"steady"`. For the 12-unit Croissant: both fail, the `TRUE` catch-all gives `"quiet"`. The rule runs once per row (it is vectorised), so a whole `volume` column appears:

| item | units | volume |
|------|-------|--------|
| Sourdough | 18 | quiet |
| Bagel | 40 | busy |
| Sourdough | 22 | steady |
| Croissant | 15 | quiet |
| Sourdough | 20 | steady |
| Bagel | 38 | busy |
| Croissant | 12 | quiet |
| Bagel | 44 | busy |

[NOTE]
Every label on the right of `~` must be the same type (here all text). And `case_when()` pairs perfectly with what you just learned: tag rows with `case_when()`, then `group_by(volume)` and `summarise()` to count how many quiet, steady and busy sales there were.

=== step === quiz
::eyebrow Check yourself
## Order matters in case_when

Maya rewrites the rules with the broad one first:

```r
case_when(
  units >= 20 ~ "steady",
  units >= 35 ~ "busy",
  TRUE        ~ "quiet"
)
```

What happens to the 44-unit Bagel sale now?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It is labelled "steady", because units >= 20 is TRUE first and wins ::ok Right. `case_when()` takes the FIRST true rule top to bottom. 44 passes `units >= 20`, so it is tagged "steady" and the `units >= 35` line below never gets a chance. Put the most specific condition first.
- It gets both "steady" and "busy" ::no A row gets exactly one label, the first match. Conditions are not combined; once one is TRUE, `case_when()` stops checking that row.
- case_when throws an error about overlapping conditions ::no No error. Overlapping conditions are allowed and common; `case_when()` simply resolves them by taking the first TRUE rule, which is why their order is up to you to get right.

=== step === concept
::eyebrow The blanks in real data
## One missing value poisons a summary

Now back to that `NA`. Maya forgot to log the revenue on the 44-unit Bagel sale, so one cell of the `revenue` column is blank, which R writes as `NA` ("not available"). Watch what it does to a per-item average:

```r
sales %>%
  group_by(item) %>%
  summarise(mean_revenue = mean(revenue))
#> # A tibble: 3 x 2
#>   item      mean_revenue
#>   <chr>            <dbl>
#> 1 Bagel               NA      <- one missing value, whole average gone
#> 2 Croissant           54
#> 3 Sourdough           90
```

The Bagel average is `NA`. This is not a bug; it is R being careful. `NA` means "a value exists but I do not know it", so any arithmetic touching it is also unknown: `60 + 57 + NA` could be anything, so it is `NA`, and therefore the mean is `NA` too. In symbols, if any \(x_i\) is `NA` then \(\sum_i x_i\) is `NA`, so \(\bar{x}\) is `NA`. R refuses to silently guess.

The fix is to tell the summary function to skip the missing values with the argument **`na.rm = TRUE`** (read it as "NA remove"):

```r
sales %>%
  group_by(item) %>%
  summarise(mean_revenue = mean(revenue, na.rm = TRUE))
#> 1 Bagel             58.5   <- (60 + 57) / 2, the NA dropped
#> 2 Croissant         54
#> 3 Sourdough         90
```

Now the Bagel mean is `(60 + 57) / 2 = 58.5`: the `NA` row is dropped from *this one calculation* and the average is taken over the two values that remain. The widget shows the damage before the fix, the Bagel group going `NA`.

::widget table-transform {"code":"sales %>% group_by(item) %>% summarise(mean_revenue = mean(revenue))","caption":"Without na.rm, the one missing Bagel revenue makes the entire Bagel average NA. mean() will not guess at a value it was never given.","before":{"cols":["date","item","units","revenue"],"rows":[["2024-03-01","Sourdough",18,81],["2024-03-01","Bagel",40,60],["2024-03-02","Sourdough",22,99],["2024-03-02","Croissant",15,60],["2024-03-03","Sourdough",20,90],["2024-03-03","Bagel",38,57],["2024-03-04","Croissant",12,48],["2024-03-04","Bagel",44,null]]},"after":{"cols":["item","mean_revenue"],"rows":[["Bagel",null],["Croissant",54],["Sourdough",90]]}}

=== step === concept
::eyebrow Drop or fill, honestly
## na.rm is not the only choice

`na.rm = TRUE` is a local fix: it ignores the blank for *one* calculation and changes nothing in the data. Often that is exactly right. But sometimes you want to deal with the missing rows once, up front, and there are two honest ways to do it.

**Drop the rows** when a missing value means the observation is unusable. `drop_na()` removes any row with an `NA` in the named columns; plain `filter()` does the same with a condition:

```r
sales %>% drop_na(revenue)            # tidyr: drop rows missing a revenue
sales %>% filter(!is.na(revenue))     # same idea: keep rows where revenue is NOT NA
```

**Fill the gap (impute)** when you have a defensible value to use, such as 0, or a typical value. `replace_na()` and `coalesce()` both do this:

```r
sales %>% mutate(revenue = replace_na(revenue, 0))           # treat the blank as 0
sales %>% mutate(revenue = coalesce(revenue, mean(revenue, na.rm = TRUE)))  # or a stand-in
```

[KEY INSIGHT]
There is no universally correct option, only an honest one. Dropping a row throws away real information; filling a blank invents a number. Choose by asking *why* the value is missing: a sale that genuinely happened but went unlogged is not the same as a sale of zero. Whatever you choose, say so in your write-up, because it changes the answer.

=== step === tryit
::eyebrow Put it together
## Rescue the Bagel average

This grouped summary returns `NA` for Bagels because of the one unlogged sale. Add the argument that tells `mean()` to skip missing values, so Maya gets a real number for every item. Fill in the blank.

```r
sales %>%
  group_by(item) %>%
  summarise(mean_revenue = mean(revenue, ____))
#> Bagel 58.5 (not NA), Croissant 54, Sourdough 90
```
::check {"regex":"na\\.rm\\s*=\\s*T","gate":true,"difficulty":"intermediate","ok":"That is the fix: na.rm = TRUE drops the missing value from the Bagel group, so its mean is (60 + 57) / 2 = 58.5. The data is untouched; only this calculation skips the blank.","no":"Tell mean() to remove missing values with na.rm = TRUE: mean(revenue, na.rm = TRUE)."}
::solution
```r
sales %>%
  group_by(item) %>%
  summarise(mean_revenue = mean(revenue, na.rm = TRUE))
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Data transformation](https://r4ds.hadley.nz/data-transform) - the canonical, free chapter, including the groups section on `group_by()` and `summarise()`.
- [dplyr: summarise() reference](https://dplyr.tidyverse.org/reference/summarise.html) - every detail of the verb you built this lesson on, with runnable examples.
- [dplyr: case_when() reference](https://dplyr.tidyverse.org/reference/case_when.html) - the full rules for the condition ladder, including `.default` and common pitfalls.
- [R for Data Science (2e), Missing values](https://r4ds.hadley.nz/missing-values) - a clear-eyed chapter on explicit and implicit `NA`s and how to handle them.

=== step === complete
## Lesson 3 complete, and the course with it

You can now turn a tidy table into an answer. You collapsed columns with `summarise()`, made it work per category with `group_by()` (the split-apply-combine pattern), labelled rows with `case_when()`, and handled missing values honestly with `na.rm`, dropping or imputing, always saying which.

That closes **Data Wrangling with dplyr**. Across three lessons you went from a raw CSV to tidy data, learned the one-table verbs and the pipe, and now grouping, summarising and cleaning. From here, two natural next courses: **Joining and reshaping** (combining several tables and pivoting between long and wide), and **Exploratory Data Analysis** (using exactly these skills to interrogate a new dataset). Maya is ready to actually run her bakery on her numbers, and so are you.
