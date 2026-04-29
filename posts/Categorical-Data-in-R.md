---
title: "Categorical Data in R: Frequency Tables, Crosstabs & Mosaic Plots"
slug: Categorical-Data-in-R
description: "Master categorical data in R: build frequency tables with table(), crosstabs with xtabs() and tabyl(), and mosaic plots that reveal hidden associations."
keywords: "categorical data in R, frequency table R, crosstabs R, table() function, xtabs R, mosaic plot R, contingency table, prop.table, ftable, janitor tabyl"
auto_link_terms: "categorical data|frequency table|contingency table|crosstabs|cross-tabulation|mosaic plot|xtabs|tabyl"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-26
curriculum_id: "2.7.1"
post_type: C
sidebar_section: Statistics
sidebar_title: "Categorical Data (Tables & Mosaic)"
sidebar_order: 81
difficulty: Beginner
---

# Categorical Data in R: Frequency Tables, Crosstabs & Mosaic Plots

<p class="lead">Categorical data in R is summarised with three core tools: <code>table()</code> for one-way frequency counts, <code>xtabs()</code> or <code>janitor::tabyl()</code> for crosstabs of two variables, and <code>mosaicplot()</code> for visualising associations. Together they answer "how often?", "compared to what?", and "is there a pattern?" in a few lines of code.</p>

## How do you build a frequency table in R?

If you have a column of categories, like species, treatment groups, or survey responses, your first question is almost always the same: how many of each? The `table()` function answers that in a single line. The example below counts how many chickens received each diet in the built-in `chickwts` dataset, and the result is the simplest categorical summary in R: a named vector of counts ready to feed into proportions, plots, or tests.

```r title="Build your first frequency table"
table(chickwts$feed)
#> 
#>    casein horsebean   linseed  meatmeal   soybean sunflower 
#>        12        10        12        11        14        12
```

Six diet groups, with sunflower the most common (14 chickens) and horsebean the least (10). The output is a `table` object, a named integer vector under the hood, but R prints it with category labels above the counts so you can read it as a small report.

`table()` returns more than a printed summary. You can sort it, sum it, or pass it to other functions:

```r title="Inspect and sort the table"
tbl_feed <- table(chickwts$feed)
class(tbl_feed)
#> [1] "table"
sum(tbl_feed)
#> [1] 71
sort(tbl_feed, decreasing = TRUE)
#> 
#>   soybean    casein   linseed sunflower  meatmeal horsebean 
#>        14        12        12        12        11        10
```

The `sum()` confirms 71 chickens total, and `sort()` ranks the diets from most to least common, which is much easier to scan than the alphabetical default.

[TIP]
**Sort frequency tables before sharing them.** Alphabetical order rarely matches the story you want to tell. `sort(tbl, decreasing = TRUE)` puts the dominant categories on top, which is what most readers want to see first.

**Try it:** Use `table()` to count how many flowers of each species are in the built-in `iris` dataset. Save the result to `ex_iris_counts`.

```r title="Your turn: count iris species"
# Build a frequency table on iris$Species
ex_iris_counts <- # your code here

ex_iris_counts
#> Expected:
#>     setosa versicolor  virginica 
#>         50         50         50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Iris species count solution"
ex_iris_counts <- table(iris$Species)
ex_iris_counts
#>     setosa versicolor  virginica 
#>         50         50         50
```

**Explanation:** Pass the column directly to `table()`. Iris is balanced by design, so each species has exactly 50 rows.

</details>

## What counts as categorical data in R?

In R, categorical data lives in two storage types: **factors** and **character vectors**. Both work with `table()`, but they behave differently in plots, models, and ordering. A factor stores its categories as an internal set of `levels` (often with a meaningful order), while a character vector is just text and gets sorted alphabetically by default.

```r title="Factor vs character class()"
class(chickwts$feed)
#> [1] "factor"
levels(chickwts$feed)
#> [1] "casein"    "horsebean" "linseed"   "meatmeal"  "soybean"   "sunflower"
```

`chickwts$feed` is a factor, and its levels appear in alphabetical order, which is also the order `table()` uses when printing.

When you start from a character vector, you almost always want to convert it to a factor with a meaningful level order. Otherwise R sorts categories alphabetically, which can be misleading for things like days of the week or low/medium/high.

```r title="Convert character to factor with level order"
days <- c("Mon", "Wed", "Fri", "Mon", "Tue", "Fri", "Wed", "Mon")
table(days)
#> days
#> Fri Mon Tue Wed 
#>   2   3   1   2

days_factor <- factor(days, levels = c("Mon", "Tue", "Wed", "Thu", "Fri"))
table(days_factor)
#> days_factor
#> Mon Tue Wed Thu Fri 
#>   3   1   2   0   2
```

Two things happen when you set explicit levels. First, the order changes from alphabetical (Fri, Mon, Tue, Wed) to weekday order (Mon, Tue, Wed, Thu, Fri). Second, the `Thu` level shows up with a count of `0`, even though there are no Thursdays in the data. Reporting "zero observations" is often more honest than silently dropping the category.

[KEY INSIGHT]
**Factor levels control downstream order in tables, plots, and models.** Set the levels you want once at conversion time, and every `table()`, `barplot()`, and `ggplot` axis afterwards will respect that order without further tweaking.

[WARNING]
**Character vectors hide missing categories.** `table()` only shows values it actually sees in the data. If your survey allows five response options but only four appear, a character column will silently omit the fifth. Convert to a factor with all five levels to surface the gap.

**Try it:** Convert the vector `sizes <- c("S", "L", "M", "M", "S", "XL", "L")` to a factor `ex_sizes` with levels in the natural order `S, M, L, XL`, then tabulate it.

```r title="Your turn: ordered size factor"
sizes <- c("S", "L", "M", "M", "S", "XL", "L")
# Create ex_sizes with levels in size order, then table() it
ex_sizes <- # your code here

table(ex_sizes)
#> Expected:
#> ex_sizes
#>  S  M  L XL 
#>  2  2  2  1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ordered size factor solution"
ex_sizes <- factor(sizes, levels = c("S", "M", "L", "XL"))
table(ex_sizes)
#> ex_sizes
#>  S  M  L XL 
#>  2  2  2  1
```

**Explanation:** Passing `levels` in the natural order overrides the alphabetical default, so the table reads from smallest to largest.

</details>

## How do you turn counts into proportions and percentages?

Raw counts are useful, but stakeholders usually ask for proportions or percentages. R's `prop.table()` divides each cell by the table's total, giving you proportions between 0 and 1. Multiply by 100 and round for a presentation-ready percentage.

```r title="Proportions and percentages"
tbl <- table(chickwts$feed)
prop <- prop.table(tbl)
prop
#> 
#>    casein horsebean   linseed  meatmeal   soybean sunflower 
#>    0.1690    0.1408    0.1690    0.1549    0.1972    0.1690

pct <- round(prop.table(tbl) * 100, 1)
pct
#> 
#>    casein horsebean   linseed  meatmeal   soybean sunflower 
#>      16.9      14.1      16.9      15.5      19.7      16.9
```

The proportions sum to 1 and the percentages to 100 (within rounding). Soybean leads at 19.7% and horsebean trails at 14.1%. Notice that we kept the original `tbl` and assigned both the proportions and percentages to new names. That's a habit worth keeping: each summary stays available for follow-up code without recomputing.

When you have a two-way table, totals at the row, column, or grand level become essential. `addmargins()` adds them in one step.

```r title="Add row, column, and grand totals"
addmargins(tbl)
#> 
#>    casein horsebean   linseed  meatmeal   soybean sunflower       Sum 
#>        12        10        12        11        14        12        71
```

For a one-way table, `addmargins()` simply appends the grand total. For two-way tables it's much more powerful, as we'll see in the next section.

[TIP]
**Use `prop.table(tbl, margin = 1)` for row percentages and `margin = 2` for column percentages.** The `margin` argument tells `prop.table()` what to divide by. With no margin, every cell is divided by the grand total. With `margin = 1`, each row sums to 1, which answers "given this row, what's the breakdown?".

**Try it:** Compute the percentage of each species in the `iris` dataset to one decimal place. Save the result to `ex_iris_pct`.

```r title="Your turn: iris percentages"
# Build the table, then turn it into rounded percentages
ex_iris_pct <- # your code here

ex_iris_pct
#> Expected:
#>     setosa versicolor  virginica 
#>       33.3       33.3       33.3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Iris percentages solution"
ex_iris_pct <- round(prop.table(table(iris$Species)) * 100, 1)
ex_iris_pct
#>     setosa versicolor  virginica 
#>       33.3       33.3       33.3
```

**Explanation:** Wrap `table()` in `prop.table()`, multiply by 100, and round. The chained calls read from the inside out.

</details>

## How do you create crosstabs of two categorical variables?

A crosstab (also called a contingency table or two-way table) shows the counts of every combination of two categorical variables. R gives you three good options: `table(x, y)` for quick base-R use, `xtabs()` for formula-style code that works inside data frames, and `janitor::tabyl()` for a tidyverse-friendly pipeline with built-in percentage formatting. The decision flow below summarises when to reach for each.

![Choosing the right tabulation function based on the number of variables.](screenshots/Categorical-Data-in-R-function-decision.webp)

*Figure 1: How to choose a tabulation function based on the number of variables.*

The simplest crosstab passes two vectors to `table()`:

```r title="Two-way crosstab with table(x, y)"
cyl_gear <- table(mtcars$cyl, mtcars$gear)
cyl_gear
#>    
#>      3  4  5
#>   4  1  8  2
#>   6  2  4  1
#>   8 12  0  2
```

Rows are cylinder counts, columns are gear counts. The largest cell is 8-cylinder cars with 3 gears (12 of them), and 8-cylinder cars never come with 4 gears in this dataset. The first variable becomes rows, the second becomes columns.

`xtabs()` is the formula-friendly cousin. It's especially handy when your data is already in a data frame and you want the code to read like a model formula:

```r title="xtabs() formula style with totals"
xt <- xtabs(~ cyl + gear, data = mtcars)
addmargins(xt)
#>      gear
#> cyl    3  4  5 Sum
#>   4    1  8  2  11
#>   6    2  4  1   7
#>   8   12  0  2  14
#>   Sum 15 12  5  32
```

Same numbers as `table(x, y)`, but now we have row and column labels (`cyl` and `gear`) and the margins. `addmargins()` adds row totals on the right, column totals at the bottom, and the grand total in the corner.

[TIP]
**Read `xtabs()` formulas like sentences.** `~ cyl + gear` reads as "cross-tabulate cyl with gear". For three variables write `~ cyl + gear + am`, and so on. The `data =` argument lets you skip `$` notation entirely.

For row percentages with formatted output, the janitor package is hard to beat. `tabyl()` returns a data frame, so the result plays well with `dplyr` and pipes.

```r title="janitor::tabyl with row percentages"
library(janitor)
mtcars |>
  tabyl(cyl, gear) |>
  adorn_percentages("row") |>
  adorn_pct_formatting(digits = 1) |>
  adorn_ns()
#>  cyl          3          4          5
#>    4   9.1% (1)  72.7% (8)  18.2% (2)
#>    6  28.6% (2)  57.1% (4)  14.3% (1)
#>    8  85.7% (12)  0.0% (0)  14.3% (2)
```

Each row now sums to 100% and shows the raw count in parentheses. You can immediately see that 85.7% of 8-cylinder cars have 3 gears, while 4-cylinder cars are dominated by 4-gear builds (72.7%). That kind of conditional view is where percentages shine.

[NOTE]
**`gmodels::CrossTable()` is another popular crosstab function.** It produces dense output with row, column, and total percentages plus a chi-squared test. It's worth knowing for local work, though it isn't pre-loaded in this browser environment. Install with `install.packages("gmodels")` in RStudio.

**Try it:** Build a crosstab of `mtcars$am` (transmission: 0 = automatic, 1 = manual) versus `mtcars$gear`, then compute row percentages with `prop.table()` and round to one decimal place. Save the result to `ex_am_gear_pct`.

```r title="Your turn: am × gear row percentages"
# Crosstab am vs gear, then row percentages
ex_am_gear <- # your code here
ex_am_gear_pct <- # your code here

ex_am_gear_pct
#> Expected:
#>     
#>          3    4    5
#>   0 78.9 21.1  0.0
#>   1  0.0 61.5 38.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="am gear row percentages solution"
ex_am_gear <- table(mtcars$am, mtcars$gear)
ex_am_gear_pct <- round(prop.table(ex_am_gear, margin = 1) * 100, 1)
ex_am_gear_pct
#>    
#>          3    4    5
#>   0  78.9 21.1  0.0
#>   1   0.0 61.5 38.5
```

**Explanation:** `margin = 1` tells `prop.table()` to make each row sum to 100%. Automatic cars (am=0) are mostly 3-gear; manual cars (am=1) lean to 4 gears with some 5-gear sports models.

</details>

## How do you handle three-way and multi-way tables?

Real datasets often have more than two categorical variables. R stores these as multi-dimensional arrays, and base R ships with the classic 4-D `Titanic` table: passengers cross-classified by Class, Sex, Age, and Survived. Printing it directly is messy because R has to flatten four dimensions into a 2-D screen.

```r title="Inspect the Titanic 4-way table"
dim(Titanic)
#> [1] 4 2 2 2
dimnames(Titanic)
#> $Class
#> [1] "1st"  "2nd"  "3rd"  "Crew"
#> 
#> $Sex
#> [1] "Male"   "Female"
#> 
#> $Age
#> [1] "Child" "Adult"
#> 
#> $Survived
#> [1] "No"  "Yes"
```

The shape `4 × 2 × 2 × 2` tells you there are 32 cells. To print this readably, use `ftable()` (flat table), which collapses the higher dimensions into nested headers:

```r title="ftable flattens multi-way tables"
ftable(Titanic, row.vars = c("Class", "Sex"), col.vars = c("Age", "Survived"))
#>              Age Child     Adult    
#>              Survived  No Yes   No Yes
#> Class Sex                            
#> 1st   Male              0   5  118  57
#>       Female            0   1    4 140
#> 2nd   Male              0  11  154  14
#>       Female            0  13   13  80
#> 3rd   Male             35  13  387  75
#>       Female           17  14   89  76
#> Crew  Male              0   0  670 192
#>       Female            0   0    3  20
```

Now we can read each combination on a single line. First-class adult women: 4 died, 140 survived. Crew adult men: 670 died, 192 survived. The "women and children first" pattern jumps off the page when you compare rows.

If you'd rather work from a data frame than an array, `as.data.frame()` gives you the long form, and `xtabs()` puts it back into a table:

```r title="From array to data frame and back"
tit_df <- as.data.frame(Titanic)
head(tit_df, 3)
#>   Class    Sex   Age Survived Freq
#> 1   1st   Male Child       No    0
#> 2   2nd   Male Child       No    0
#> 3   3rd   Male Child       No   35

xtabs(Freq ~ Class + Survived, data = tit_df)
#>       Survived
#> Class    No Yes
#>   1st   122 203
#>   2nd   167 118
#>   3rd   528 178
#>   Crew  673 212
```

The formula `Freq ~ Class + Survived` says "use Freq as the cell counts, cross by Class and Survived". This is the workflow when your raw data is already aggregated, like census or survey rollups.

To collapse a dimension on an existing table, use `apply()` with a `sum`:

```r title="apply() collapses an array dimension"
class_surv <- apply(Titanic, c("Class", "Survived"), sum)
class_surv
#>       Survived
#> Class    No Yes
#>   1st   122 203
#>   2nd   167 118
#>   3rd   528 178
#>   Crew  673 212
```

Same numbers as `xtabs()`. The `c("Class", "Survived")` says "keep these two dimensions, sum out everything else (Sex and Age)".

[KEY INSIGHT]
**High-dimensional tables are arrays, not data frames.** That means base R operations like `apply()`, indexing with `[ , ]`, and `dim()` all work, but `dplyr` verbs do not. Convert to a data frame with `as.data.frame()` if you need the tidyverse, then back with `xtabs()` if you need an array.

**Try it:** Use `ftable()` on the built-in `UCBAdmissions` dataset (3-D table of UC Berkeley admissions by Department, Gender, and Admit status). Save the result to `ex_ucb_ftable`.

```r title="Your turn: ftable on UCBAdmissions"
# Flatten UCBAdmissions for readable printing
ex_ucb_ftable <- # your code here

ex_ucb_ftable
#> Expected: a flat 6-row table with Dept and Gender as row vars
```

<details>
<summary>Click to reveal solution</summary>

```r title="UCBAdmissions ftable solution"
ex_ucb_ftable <- ftable(UCBAdmissions, row.vars = c("Dept", "Gender"))
ex_ucb_ftable
#>             Admit Admitted Rejected
#> Dept Gender                        
#> A    Male              512      313
#>      Female             89       19
#> B    Male              353      207
#>      Female             17        8
#> C    Male              120      205
#>      Female            202      391
#> D    Male              138      279
#>      Female            131      244
#> E    Male               53      138
#>      Female             94      299
#> F    Male               22      351
#>      Female             24      317
```

**Explanation:** Putting `Dept` and `Gender` on rows leaves `Admit` on columns. Look at Department A: male admits (512) versus rejects (313) gives a ~62% admit rate, while Department F admits hover near 6% across both genders. This dataset is the textbook example of Simpson's paradox.

</details>

## How do you visualise associations with mosaic plots?

Tables are exact but slow to scan. A mosaic plot turns a crosstab into a tile-based picture: each tile's area is proportional to its cell count, so dominant combinations are visibly large and rare combinations are visibly small. Adding `shade = TRUE` colours the tiles by Pearson residuals, so you can spot which cells happen more or less often than independence would predict.

![Anatomy of a mosaic plot: tile size shows counts, shading shows residuals.](screenshots/Categorical-Data-in-R-mosaic-anatomy.webp)

*Figure 2: How a mosaic plot encodes counts: tile size and shading.*

We'll use the built-in `HairEyeColor` table (people cross-classified by hair colour, eye colour, and sex). Slicing with `[ , 1]` keeps only the male slab, leaving a 2-D table that's easy to plot.

```r title="Basic mosaic plot of HairEyeColor (male)"
mosaicplot(HairEyeColor[, 1],
           main  = "Hair vs Eye Color (Male)",
           color = TRUE)
```

The horizontal width of each column reflects how many people have that hair colour, and the vertical splits show eye-colour proportions within each hair colour. Black-haired men are mostly brown-eyed; blond-haired men have a much larger blue slice. The areas tell the story without you doing any arithmetic.

The default colours are decorative. Setting `shade = TRUE` swaps them for a meaningful colour scale: blue for "more frequent than expected under independence", red for "less frequent than expected", and white for "about as expected".

```r title="Shaded mosaic by Pearson residuals"
mosaicplot(HairEyeColor[, 1],
           shade = TRUE,
           main  = "Shaded mosaic: Hair vs Eye (Male)")
```

Now the eye jumps to the unusual cells: the blue tile in the Blond/Blue corner means "many more blond-blue combinations than independence predicts", and the red tile near Black/Blue means "almost no black-haired blue-eyed men, much fewer than expected". That's the signal a chi-squared test puts a p-value on, but the picture often communicates faster than the test statistic.

[KEY INSIGHT]
**Mosaic plots encode three things at once.** Tile *width* shows row totals, tile *height* shows the conditional distribution within a row, and tile *shading* shows departure from independence. Once you internalise this, you can read a mosaic plot in seconds.

[WARNING]
**Too many categories make mosaic tiles unreadable.** Past five or six rows, tiles become slivers and labels collide. Collapse rare categories into "Other" or pick a 2-D slice before plotting. A clean mosaic of a 4 x 4 table beats a busy mosaic of an 8 x 8 table every time.

**Try it:** Plot a shaded mosaic of `UCBAdmissions[ , 1]` (Department A only) and look at where the residuals are large.

```r title="Your turn: shaded mosaic of Department A"
# Plot Department A admissions with shaded residuals
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Department A shaded mosaic solution"
mosaicplot(UCBAdmissions[, 1],
           shade = TRUE,
           main  = "Department A admissions by gender")
```

**Explanation:** In Department A, the Female-Admitted tile shades blue (more admissions than independence predicts), and the Male-Rejected tile shades red. Department A actually favoured women on the margin, even though the university overall admitted more men. This is the per-department view of Simpson's paradox.

</details>

## Practice Exercises

These capstone exercises combine concepts from across the tutorial. Use distinct variable names so they don't overwrite anything you defined earlier.

### Exercise 1: Crosstab with row percentages

From `mtcars`, build a 2-way crosstab of cylinders (`cyl`) versus transmission (`am`). Convert it to row percentages so each row sums to 100%, rounded to one decimal place. Save the percentage table to `cap_cyl_am_pct`.

```r title="Exercise 1 starter"
# Hint: table() then prop.table(margin = 1) then round(*100, 1)

cap_cyl_am <- # your code
cap_cyl_am_pct <- # your code

cap_cyl_am_pct
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
cap_cyl_am <- table(mtcars$cyl, mtcars$am)
cap_cyl_am_pct <- round(prop.table(cap_cyl_am, margin = 1) * 100, 1)
cap_cyl_am_pct
#>    
#>         0    1
#>   4  27.3 72.7
#>   6  57.1 42.9
#>   8  85.7 14.3
```

**Explanation:** Reading row by row, 72.7% of 4-cylinder cars are manual, while only 14.3% of 8-cylinder cars are. Bigger engines lean automatic in this dataset.

</details>

### Exercise 2: Survival rate by class on the Titanic

From the `Titanic` table, compute the survival rate (proportion who survived) for adult passengers in each class. Save a named vector `cap_class_rate` with one rate per class.

```r title="Exercise 2 starter"
# Hint: subset adults with Titanic[ , "Adult", ], collapse over Sex with apply(),
# then divide Yes by row totals.

cap_class_rate <- # your code

round(cap_class_rate, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
adult <- Titanic[, "Adult", ]
class_total <- apply(adult, "Class", sum)
class_yes   <- apply(adult, c("Class", "Survived"), sum)[, "Yes"]
cap_class_rate <- class_yes / class_total
round(cap_class_rate, 3)
#>   1st   2nd   3rd  Crew 
#> 0.625 0.414 0.252 0.240
```

**Explanation:** First-class adults survived at 62.5%, third-class at 25.2%. The class gap is exactly the kind of pattern a mosaic plot would also surface, but here we have it as a single ratio per class.

</details>

### Exercise 3: Mosaic of Titanic, collapsed over sex

Build a shaded mosaic plot of the Titanic data after collapsing over Sex. Use `apply()` to sum out Sex and keep `Class`, `Age`, and `Survived`. Then plot the resulting 3-D table.

```r title="Exercise 3 starter"
# Hint: cap_titanic <- apply(Titanic, c("Class","Age","Survived"), sum)
# Then mosaicplot(cap_titanic, shade = TRUE, ...)

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
cap_titanic <- apply(Titanic, c("Class", "Age", "Survived"), sum)
mosaicplot(cap_titanic,
           shade = TRUE,
           main  = "Titanic survival by Class and Age")
```

**Explanation:** The shading lights up two cells in particular: 1st-class children survived more than independence predicts (blue), and 3rd-class adults died more than expected (red). The plot summarises three variables and one association in a single picture.

</details>

## Complete Example: HairEyeColor end-to-end

Let's run the full categorical-data workflow on a single dataset to tie everything together. We'll start from the 3-D `HairEyeColor` table, collapse over sex, build a frequency table, compute proportions, and finish with a shaded mosaic.

```r title="HairEyeColor end-to-end pipeline"
# 1. Collapse over Sex to get a 2-way Hair x Eye table
hec <- apply(HairEyeColor, c("Hair", "Eye"), sum)
hec
#>        Eye
#> Hair    Brown Blue Hazel Green
#>   Black    68   20    15     5
#>   Brown   119   84    54    29
#>   Red      26   17    14    14
#>   Blond     7   94    10    16

# 2. Add margins for context
addmargins(hec)
#>        Eye
#> Hair    Brown Blue Hazel Green Sum
#>   Black    68   20    15     5 108
#>   Brown   119   84    54    29 286
#>   Red      26   17    14    14  71
#>   Blond     7   94    10    16 127
#>   Sum     220  215    93    64 592

# 3. Row percentages: given a hair colour, what's the eye breakdown?
hec_pct <- round(prop.table(hec, margin = 1) * 100, 1)
hec_pct
#>        Eye
#> Hair    Brown Blue Hazel Green
#>   Black  63.0 18.5  13.9   4.6
#>   Brown  41.6 29.4  18.9  10.1
#>   Red    36.6 23.9  19.7  19.7
#>   Blond   5.5 74.0   7.9  12.6

# 4. Visualise with a shaded mosaic
mosaicplot(hec,
           shade = TRUE,
           main  = "Hair colour vs eye colour (all)")
```

Walking through what the pipeline tells us: collapsing over sex leaves 592 people. Black hair pairs with brown eyes 63% of the time, while blond hair pairs with blue eyes 74% of the time. The mosaic plot's shading confirms this is not a small effect: the Blond/Blue cell is dramatically blue, the Black/Blue cell dramatically red, and the brown-haired rows look closest to "independence" (mostly white tiles). One workflow, four steps, and you have both numbers and a picture.

## Summary

The categorical data toolkit in R is small but complete. Pick the function that matches your variable count and your output needs, layer on proportions when stakeholders want percentages, and bring out a mosaic plot when a story needs to be seen, not just read.

![The categorical data toolkit at a glance.](screenshots/Categorical-Data-in-R-toolkit-mindmap.webp)

*Figure 3: The categorical data toolkit at a glance.*

| Task | Function | Notes |
|---|---|---|
| One-way counts | `table()`, `tabyl()` | `tabyl()` returns a tidy data frame |
| Two-way crosstab | `table(x, y)`, `xtabs(~ x + y)` | Use `xtabs()` for formula syntax |
| Multi-way table | `ftable()`, array slicing | Flat printing for >2 dims |
| Proportions | `prop.table()` | `margin = 1` for row %, `2` for column % |
| Margins | `addmargins()` | Adds row, column, grand totals |
| Visualise | `mosaicplot(..., shade = TRUE)` | Shading shows departure from independence |
| Tidy formatting | `janitor::adorn_*` | Combine percentages, counts, rounding |

Three habits will save you time. First, convert character columns to factors with explicit `levels` so order is meaningful and missing categories show as zero. Second, always pair counts with proportions, since stakeholders almost always want both. Third, when a table has three or more dimensions, decide whether to flatten with `ftable()` for printing or collapse with `apply()` for analysis.

## References

1. R Core Team. *An Introduction to R*, Section 7.4: Cross-classifying factors. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. & Grolemund, G. *R for Data Science*, 2nd edition, Chapter on factors (forcats). [Link](https://r4ds.hadley.nz/factors.html)
3. Friendly, M. & Meyer, D. *Discrete Data Analysis with R: Visualization and Modeling Techniques for Categorical and Count Data*. CRC Press (2016). [Link](https://www.datavis.ca/courses/VCD/)
4. janitor package documentation. `tabyl()`, `adorn_percentages()`, `adorn_pct_formatting()`. [Link](https://sfirke.github.io/janitor/articles/tabyls.html)
5. R documentation: `?table`, `?xtabs`, `?ftable`, `?mosaicplot`, `?prop.table`, `?addmargins`.
6. CRAN Task View: Categorical Data Analysis. [Link](https://cran.r-project.org/web/views/Psychometrics.html)

## Continue Learning

- **[Chi-Square Tests in R](Chi-Square-Tests-in-R.html)**: once you have a crosstab, the chi-squared test of independence asks whether the association is statistically significant.
- **[R Factors](R-Factors.html)**: go deeper on factor levels, ordered factors, and why level order drives every downstream summary.
- **[ggplot2 Tutorial](ggplot2-Tutorial-With-R.html)**: bar charts, stacked bars, and faceted plots are the natural ggplot complement to mosaic plots.
