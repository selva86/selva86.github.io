---
title: "R Foundations Lesson 4: Capstone: A Reproducible Analysis"
catalog_blurb: "Run a project end to end: import, tidy, analyze and report, reproducibly."
description: "Tie the workflow together: take a sales project from a raw CSV through tidy data, analysis and a Quarto report that anyone can re-render and reproduce."
keywords: "reproducible analysis in R, R project workflow, Quarto report, R Markdown, here package, renv, dplyr pipeline, end to end R analysis, reproducible report, data analysis pipeline"
post_type: "LESSON"
curriculum_id: "1.8.4"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-workflow"
course_title: "R Foundations: Reproducible Workflow"
course_lesson: "4"
course_total: "4"
course_landing: "R-Foundations-Workflow-Course.html"
course_next: ""
course_prev: "The-Modern-R-Toolchain-2026.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## Capstone: A Reproducible Analysis

Across this course Maria turned a fragile script into a solid project. Lesson 1 made her file paths portable with `here()`. Lesson 2 pinned her package versions with `renv` and tracked her history with `git`. Lesson 3 added the modern tools for bigger, web-connected, AI-assisted work. Each lesson fixed one piece.

Now you put every piece to work at once. This capstone walks Maria's `sales-analysis` project from a raw CSV all the way to a finished report, in one connected run, and then proves that a colleague on a different laptop gets exactly the same answer. No new theory. Just the whole thing, working, end to end.

By the end of this lesson you will be able to:

- Describe an analysis as an ordered **pipeline** of stages, where each stage's output feeds the next
- Import raw data and tidy it into an analysis-ready table
- Analyze that table to answer a real question, and chart the result
- Assemble the whole run into one report that re-renders from source, reproducibly on any machine

**Prerequisites:** the three earlier lessons of this course ([portable paths](RStudio-Projects-and-here.html), [renv and git](Reproducibility-with-renv-and-git.html), [the modern toolchain](The-Modern-R-Toolchain-2026.html)), plus you can [read a CSV](Reading-CSV-and-Delimited-Files.html) and use the [dplyr verbs](Group-Summarise-and-Clean-in-dplyr.html). The four stages below are the whole journey.

::widget process-flow {"steps":[{"title":"Import","sub":"read the raw sales export into R"},{"title":"Tidy","sub":"clean the rows and add the column the analysis needs"},{"title":"Analyze","sub":"answer the question: which region earns the most"},{"title":"Report","sub":"render one document anyone can reproduce"}]}

=== step === concept
::eyebrow The shape of the work
## An analysis is a pipeline of stages

It is tempting to think of an analysis as one big script. In practice every analysis, however large, is the same short chain of stages, and naming them is what keeps a project sane: **import** the raw data, **tidy** it into the shape your tools want, **analyze** it to answer your question, and **report** the answer so someone else can use it. The output of each stage is the input of the next.

Maria lays her project out exactly that way, one folder, with the work split into numbered stage scripts plus the report at the end:

```
sales-analysis/              <- the project root (holds sales-analysis.Rproj)
|-- sales-analysis.Rproj
|-- renv.lock                <- the pinned package versions (Lesson 2)
|-- data/
|   `-- sales.csv            <- the raw Q2 export
|-- R/
|   |-- 01-import.R
|   |-- 02-tidy.R
|   `-- 03-analyze.R
`-- report.qmd               <- ties it all together into one document
```

[NOTE]
This is the reproducible project from Lessons 1 and 2, now given a clear internal shape. The paths inside resolve with `here()` so the scripts run on any machine; `renv.lock` pins the versions; `git` tracks every change. The pipeline is the *content*; the portable, pinned, tracked project is the *foundation* it sits on.

=== step === concept
::eyebrow Stage 1
## Import: get the raw data in

Maria's quarter starts as a plain file, `data/sales.csv`: one row per order, with the region, the product, the units sold, and the price per unit. The first stage just reads it into R, faithfully, with no cleaning yet.

To make this page self-contained we write that little file right here, then read it back, exactly the technique from the CSV lesson (each lesson runs in a fresh R session, so we create the data inline rather than relying on a file from another page):

```r
library(readr)

csv_text <- c(
  "region,product,units,unit_price",
  "North,Keyboard,3,60",
  "South,Mouse,5,15",
  "East,Monitor,1,420",
  "West,Laptop,1,1300",
  "North,Mouse,4,15",
  "South,Monitor,2,420",
  "East,Keyboard,2,60",
  "West,Laptop,1,1300",
  "North,Monitor,1,420",
  "South,Keyboard,6,60",
  "East,Mouse,NA,15"        # one order came in with the unit count missing
)
writeLines(csv_text, "sales.csv")   # write the example file into this session

raw <- read_csv("sales.csv", show_col_types = FALSE)
raw
#> # A tibble: 11 x 4
#>    region product   units unit_price
#>    <chr>  <chr>     <dbl>      <dbl>
#>  1 North  Keyboard      3         60
#>  2 South  Mouse         5         15
#>  3 East   Monitor       1        420
#>  4 West   Laptop        1       1300
#>  5 North  Mouse         4         15
#>  6 South  Monitor       2        420
#>  7 East   Keyboard      2         60
#>  8 West   Laptop        1       1300
#>  9 North  Monitor       1        420
#> 10 South  Keyboard      6         60
#> 11 East   Mouse        NA         15
```

[NOTE]
In Maria's real project this single line does the import: `raw <- read_csv(here::here("data", "sales.csv"))`. The `here()` from Lesson 1 builds the path from the project root, so the same line works on her laptop, a teammate's, or a server, with nothing to edit. We drop it here only because the browser has no `data/` folder; everything else is identical.

=== step === concept
::eyebrow Stage 2
## Tidy: shape it for the analysis

Raw data is rarely ready to analyze. Two things are wrong with Maria's import. One order has a **missing unit count** (`NA`), which would poison any total it touches. And the number she actually cares about, **revenue**, is not in the file at all; it has to be computed from `units` and `unit_price`.

The tidy stage fixes both with two dplyr verbs: `filter()` to drop the broken row, and `mutate()` to add the revenue column. The result is the analysis-ready table, one clean row per order, with the column the question needs:

```r
library(dplyr)

sales <- raw |>
  filter(!is.na(units)) |>                 # drop the order with a missing unit count
  mutate(revenue = units * unit_price)     # the number the analysis is about

sales
#> # A tibble: 10 x 5
#>    region product   units unit_price revenue
#>    <chr>  <chr>     <dbl>      <dbl>   <dbl>
#>  1 North  Keyboard      3         60     180
#>  2 South  Mouse         5         15      75
#>  3 East   Monitor       1        420     420
#>  4 West   Laptop        1       1300    1300
#>  5 North  Mouse         4         15      60
#>  6 South  Monitor       2        420     840
#>  7 East   Keyboard      2         60     120
#>  8 West   Laptop        1       1300    1300
#>  9 North  Monitor       1        420     420
#> 10 South  Keyboard      6         60     360
```

[KEY INSIGHT]
Tidying is not busywork; it is what makes the analysis stage possible. The bad row is gone, so totals are trustworthy, and `revenue` now exists as a real column the next stage can sum. Import gets the data in; tidy makes it answerable.

=== step === quiz
::eyebrow Check yourself
## Why this order?

Maria's pipeline runs tidy *before* analyze. Suppose you tried to swap them, running the analyze stage (`group_by(region)` then `summarise(revenue = sum(revenue))`) first, on the `raw` table. Why does the order matter?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Analyze sums a `revenue` column that does not exist until tidy creates it, and tidy also drops the row whose missing units would corrupt the totals ::ok Right. The analyze stage depends on what tidy produces: the `revenue` column and clean rows. Run it on `raw` and `sum(revenue)` fails because `revenue` is not there yet, and even if it were, the `NA` row would wreck the totals. Stage order follows data dependencies.
- The order never matters; as long as every line of code runs, pipeline stages can go in any sequence ::no Order matters whenever a later stage uses something an earlier one produced. Here analyze needs the `revenue` column tidy creates, so analyze cannot come first.
- Tidy is the slower stage, so running it first finishes the heavy work sooner ::no Speed is not the reason. Tidy comes first because analyze *depends on its output* (the clean rows and the new column), not because of how long it takes.

=== step === concept
::eyebrow Stage 3
## Analyze: answer the question

Now the payoff. Maria's question is simple: **which region brought in the most revenue this quarter?** With the tidy table in hand, that is three dplyr verbs. `group_by()` splits the rows into one group per region, `summarise()` collapses each group to a single total, and `arrange()` sorts the answer with the biggest first:

```r
by_region <- sales |>
  group_by(region) |>
  summarise(revenue = sum(revenue)) |>
  arrange(desc(revenue))

by_region
#> # A tibble: 4 x 2
#>   region revenue
#>   <chr>    <dbl>
#> 1 West      2600
#> 2 South     1275
#> 3 North      660
#> 4 East       540
```

West leads at 2,600 of the 5,075 total, on the strength of its two laptop orders. A table answers the question, but a chart makes it land. The same tidy data goes straight into ggplot2 for a quick bar of revenue by region:

```r
library(ggplot2)

ggplot(by_region, aes(x = reorder(region, -revenue), y = revenue)) +
  geom_col(fill = "#2c7fb8") +
  labs(x = "Region", y = "Revenue", title = "Q2 revenue by region")
```

Press Run to draw it. The one new piece is `reorder(region, -revenue)`, which sorts the bars by revenue so the biggest region sits on the left. Because the chart is built from `by_region`, which came from `sales`, which came from the import, the picture is never out of step with the numbers. Change the data and re-run, and the chart updates itself.

=== step === tryit
::eyebrow Your turn
## Analyze a different way

Maria's manager has a follow-up: forget regions, **which product earned the most?** The tidy `sales` table is still loaded, and the recipe is identical, you only change what you group by. Fill in the blank so the totals come out one row per product.

```r
by_product <- sales |>
  group_by(____) |>                  # one row per product
  summarise(revenue = sum(revenue)) |>
  arrange(desc(revenue))

by_product
```
::check {"regex":"group_by\\s*[(]\\s*product","gate":true,"difficulty":"beginner","ok":"That is the whole trick: same pipeline, group_by(product) instead of region. Laptops top the list at 2,600.","no":"You want one row per product, so group by the product column: group_by(product)."}
::solution
```r
by_product <- sales |>
  group_by(product) |>
  summarise(revenue = sum(revenue)) |>
  arrange(desc(revenue))

by_product
#> # A tibble: 4 x 2
#>   product  revenue
#>   <chr>      <dbl>
#> 1 Laptop      2600
#> 2 Monitor     1680
#> 3 Keyboard     660
#> 4 Mouse        135
```

=== step === widget
::eyebrow Stage 4
## Report: one document, rendered from source

The analysis is done, but it lives in your R session. The final stage turns it into something you can hand to someone else: a **report**. The modern way to write one is an **R Markdown** or **Quarto** document, a single file (`report.qmd`) that interleaves three kinds of content: a **YAML** header (the title and output format), ordinary **prose** (your commentary), and **code chunks** (the actual R from your pipeline). When you render it, Quarto runs every chunk top to bottom in a fresh session and weaves the results, tables, charts and all, into one finished HTML page.

Toggle between the source and the rendered report below. The chart and the numbers in the rendered view are not pasted in; they are produced by running the code chunk, every time:

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Q2 Sales Report\nauthor: Maria\nformat: html"},{"type":"prose","text":"## Summary\n\nQ2 revenue was **5,075**. The **West** region led, on the strength of its laptop orders."},{"type":"code","text":"sales |>\n  group_by(region) |>\n  summarise(revenue = sum(revenue)) |>\n  ggplot(aes(region, revenue)) +\n  geom_col()","chart":[{"x":"North","y":660},{"x":"South","y":1275},{"x":"East","y":540},{"x":"West","y":2600}]}]}

A real render is a single command, run from the project root. It needs the Quarto engine installed, so here is the shape of it rather than a live run:

```r-static
# From the project root, one command turns report.qmd into a shareable file.
# Quarto runs every code chunk in a fresh session, so the report you ship is
# built from the data, never copy-pasted, and never silently out of date.
quarto::quarto_render("report.qmd")   # -> report.html, ready to send
```

[KEY INSIGHT]
A rendered report is the opposite of pasting a chart into a slide. Because the document *contains the code that makes the chart*, the figures can never drift away from the data. Re-run the report next quarter on new numbers and the whole thing updates itself.

=== step === concept
::eyebrow The payoff
## Why the whole thing reproduces

Here is where the course closes the loop. Maria commits the project, scripts, `report.qmd`, and `renv.lock`, to git and sends a colleague the repository. On a different laptop, with different package versions already installed, the colleague runs three steps and gets **Maria's exact report**, down to the last number:

::widget process-flow {"steps":[{"title":"Clone the project","sub":"one folder: data, scripts, report and renv.lock, all under git"},{"title":"renv::restore()","sub":"rebuild the exact package versions from renv.lock"},{"title":"Re-render report.qmd","sub":"here() finds every file from the project root, on any machine"},{"title":"Identical result","sub":"same data, same versions, same paths, the same report"}]}

[KEY INSIGHT]
Each lesson of this course supplied one leg of that guarantee. `here()` makes the **paths** portable, so the import finds the data anywhere. `renv` makes the **packages** match, so the computation does not drift. `git` makes the **history** recoverable, so the exact code travels with the lockfile. The reproducible report is not one trick; it is all three holding up the same document.

=== step === quiz
::eyebrow Check yourself
## The bug report

A colleague clones Maria's project, renders `report.qmd`, and the revenue chart comes out looking slightly different from hers, the bars in a different proportion. They confirm they have the identical code and the identical `data/sales.csv`. What is the most likely cause?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- They skipped `renv::restore()`, so a newer version of a package computed something differently than Maria's pinned version did ::ok Right. Same code and same data, but a different *environment*: this is the version-drift problem from Lesson 2. `renv::restore()` rebuilds Maria's exact package versions from `renv.lock`, removing the drift.
- The `here()` package is broken, so the report cannot find the data file ::no If `here()` could not find the data, the report would error out entirely, not produce a slightly different chart. And `here()` resolves the path from the project root on any machine.
- Some git commits did not transfer, so part of the history is missing ::no git tracks the history of your *files*. A missing commit would change which code or data they have, but they confirmed those are identical. It would not silently shift a chart built from the same files.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [R for Data Science (2e): the whole game](https://r4ds.hadley.nz/whole-game) - the import, tidy, transform, visualize, communicate pipeline, from the authors of the tidyverse.
- [What They Forgot to Teach You About R (rstats.wtf)](https://rstats.wtf/) - Jenny Bryan and Jim Hester on project-oriented, reproducible workflow: the habits behind this whole course.
- [Quarto: authoring guide](https://quarto.org/docs/guide/) - the official guide to writing reproducible reports that mix prose, code and output.
- [Introduction to renv](https://rstudio.github.io/renv/articles/renv.html) - the init / snapshot / restore loop that makes the colleague's report match Maria's.

=== step === complete
## Course complete

You ran a real analysis from end to end, and, more importantly, you can see the pipeline underneath any analysis: **import** the raw data, **tidy** it into the right shape, **analyze** it to answer a question, **report** it so others can use the answer. Each stage feeds the next.

And you can make that whole pipeline reproducible, the thing that separates a one-off script from professional work. `here()` keeps the paths portable, `renv` pins the package versions, `git` records the history, and a Quarto report ties code, prose and output into one document that re-renders to the same result on any machine, next quarter or next year.

That is the R Foundations reproducible workflow, complete. Carry these four habits into every project you build from here, and your analyses will hold up, for your collaborators, for your future self, and for anyone who needs to trust the result.
