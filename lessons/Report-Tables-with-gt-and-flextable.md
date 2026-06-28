---
title: "Report-Ready Tables Lesson 1: Report-Ready Tables"
catalog_blurb: "Turn a data frame into a polished report table."
description: "Turn a raw R data frame into a presentation-ready report table with gt: titles, human labels, currency and percent formatting, plus flextable and kableExtra."
keywords: "gt R package, flextable, kableExtra, report tables in R, format numbers in R, gt fmt_currency, gt fmt_percent, kable, presentation tables, scales package"
post_type: "LESSON"
curriculum_id: "2.7.1"
webr: true
lesson_access: "free"
course_id: "da-tables"
course_title: "Report-Ready Tables in R"
course_lesson: "1"
course_total: "2"
course_landing: "Report-Tables-Course.html"
course_next: "Summary-Tables-and-Number-Formatting.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 2
## Report-Ready Tables
Maya runs a neighbourhood bakery, and she is applying for a small-business loan. The bank wants her Q1 numbers, so she opens R, where her till export sits as a tidy data frame: five products, the units each one sold, the revenue, and the profit margin. She copies the raw printout straight into the application.

It comes out monospaced and unlabeled: `0.62` where she means 62%, `5520` with no dollar sign, column names like `margin` that only an analyst would love. The data is perfectly correct. It just does not *read* like something you hand to a bank. A **report table** fixes exactly that: a title, human column names, dollars and percentages, and a line saying where the numbers came from.

Toggle the table below between the raw print and the report version. Same five numbers, two very different first impressions.

By the end of this lesson you will be able to:

- Build a report-ready table from a data frame with **gt**: a title, human column labels, and a source note
- Format the numbers in a table: **currency**, **percentages**, and **thousands separators**
- Shape the data first, sorting it and adding a share column, so the table tells a story
- Pick the right tool for where the table will live: **gt**, **flextable**, or **kableExtra**

**Prerequisites:** you can run R and load a package with `library()`, and you have wrangled a data frame with dplyr (`filter`, `mutate`, `arrange`) in the [Data Wrangling with dplyr course](Data-Wrangling-dplyr-Course.html). Every new term is defined as it appears.

::widget styled-table {"cols":["product","units","revenue","margin"],"rows":[["Croissant",1840,5520,0.62],["Sourdough",1210,4840,0.55],["Blueberry Muffin",970,2910,0.48],["Baguette",1530,3825,0.51],["Cinnamon Roll",1100,4400,0.58]],"formats":{"units":"comma","revenue":"dollar","margin":"pct"},"title":"Bakery Q1 sales by product","note":"Source: point-of-sale export, Q1 2026."}

=== step === concept
::eyebrow The problem
## A raw print is for you. A report table is for them.

When you type a data frame's name in R, you get a printout built for *you*, mid-analysis: fixed-width, no styling, raw numbers. That is the right tool while you work. It is the wrong thing to put in front of a reader, who needs to glance at the table and understand it without you standing beside them.

Here is Maya's data. Each lesson runs in a fresh R session, so we build it right here (run this once), then look at the raw print:

```r
sales <- data.frame(
  product = c("Croissant", "Sourdough", "Blueberry Muffin", "Baguette", "Cinnamon Roll"),
  units   = c(1840, 1210, 970, 1530, 1100),   # how many sold in Q1
  revenue = c(5520, 4840, 2910, 3825, 4400),  # total dollars taken
  margin  = c(0.62, 0.55, 0.48, 0.51, 0.58)   # profit margin, as a proportion
)
sales
#>            product units revenue margin
#> 1        Croissant  1840    5520   0.62
#> 2        Sourdough  1210    4840   0.55
#> 3 Blueberry Muffin   970    2910   0.48
#> 4         Baguette  1530    3825   0.51
#> 5    Cinnamon Roll  1100    4400   0.58
```

The very fastest upgrade is `kable()` from the **knitr** package: one line, and you get a clean, aligned table instead of console output. It is great for a quick look or a plain document, though it stops short of titles and number formatting:

```r
library(knitr)
kable(sales)
#> |product          | units| revenue| margin|
#> |:----------------|-----:|-------:|------:|
#> |Croissant        |  1840|    5520|   0.62|
#> |Sourdough        |  1210|    4840|   0.55|
#> |Blueberry Muffin |   970|    2910|   0.48|
#> |Baguette         |  1530|    3825|   0.51|
#> |Cinnamon Roll    |  1100|    4400|   0.58|
```

To go all the way to a report table, you follow the same short recipe every time. Each step adds one kind of polish:

::widget process-flow {"steps":[{"title":"Raw frame","sub":"the data as R prints it: correct, but built for the analyst"},{"title":"Label","sub":"add a title, a subtitle, and human column names"},{"title":"Format","sub":"currency, percent and thousands separators; align the numbers"},{"title":"Annotate","sub":"sort, add a share or total, and a source note"},{"title":"Publish","sub":"render to HTML, PDF, Word or PowerPoint"}]}

=== step === concept
::eyebrow The main tool
## gt: building a table one layer at a time

The **gt** package builds report tables the way ggplot2 builds plots: you start with the data, then add one layer at a time with the pipe `|>`, which feeds the table on its left into the next function. The name stands for "grammar of tables," and each function adds exactly one kind of polish.

Read this top to bottom. `gt()` turns the data frame into a table object; `tab_header()` adds a **title** and **subtitle**; `cols_label()` renames the columns to something a human reads; `tab_source_note()` adds the small print at the bottom:

```r-static
library(gt)

sales |>
  gt() |>
  tab_header(
    title    = "Bakery Q1 sales by product",
    subtitle = "Five best-selling items, January to March 2026"
  ) |>
  cols_label(
    product = "Product",
    units   = "Units sold",
    revenue = "Revenue",
    margin  = "Margin"
  ) |>
  tab_source_note("Source: point-of-sale export, Q1 2026.")
```

gt renders rich HTML, the kind a browser or a PDF report shows, which is more than the in-browser R session here can draw. So the result is pictured for you in the widget below: the same five rows, now with a title, labeled columns, and a source line. That is the gt output you would see in a real report.

[KEY INSIGHT]
gt is a pipeline of layers, just like dplyr and ggplot2. You are never memorising one giant function; you add `tab_header()` when you want a title, `cols_label()` when you want better names, a `fmt_` verb when you want to format numbers. Each line does one job.

::widget styled-table {"cols":["product","units","revenue","margin"],"rows":[["Croissant",1840,5520,0.62],["Sourdough",1210,4840,0.55],["Blueberry Muffin",970,2910,0.48],["Baguette",1530,3825,0.51],["Cinnamon Roll",1100,4400,0.58]],"formats":{"units":"comma","revenue":"dollar","margin":"pct"},"title":"Bakery Q1 sales by product","note":"Five best-selling items, January to March 2026."}

=== step === tryit
::eyebrow Your turn
## Add the missing format

Maya's table now has a title and labels, but the money column is still raw: `revenue` reads `5520`, not `$5,520`. gt formats numbers with verbs that all start with `fmt_`, and the one for money is `fmt_currency()`. Fill in the blank with the right verb so the revenue column shows as dollars.

```r
library(gt)
sales |>
  gt() |>
  tab_header(title = "Bakery Q1 sales by product") |>
  ____(columns = revenue, currency = "USD", decimals = 0)
```
::check {"regex":"fmt_currency","gate":true,"difficulty":"beginner","ok":"Yes. fmt_currency() turns the revenue column into $5,520, $4,840 and so on. gt has a matching fmt_ verb for every kind of number: fmt_percent for proportions, fmt_number for plain counts, fmt_date for dates.","no":"You want gt to format money. Every gt formatter starts with fmt_, and the one for currency is fmt_currency(). Type fmt_currency in the blank."}
::solution
```r-static
sales |>
  gt() |>
  tab_header(title = "Bakery Q1 sales by product") |>
  fmt_currency(columns = revenue, currency = "USD", decimals = 0)
```

=== step === concept
::eyebrow Shape, then format
## Sort the rows, then format the numbers

A good report table does two jobs before any styling: it puts the rows in a **meaningful order**, and it shows numbers in a form a person reads at a glance. Both happen with tools you already know plus one new helper package.

First, **shape** the data with dplyr: sort so the best seller is on top, and add a `share` column, each product's slice of total revenue, so the reader sees who matters most:

```r
library(dplyr)

report <- sales |>
  arrange(desc(revenue)) |>                # best seller first
  mutate(share = revenue / sum(revenue))   # each item's fraction of total revenue
report
#>            product units revenue margin     share
#> 1        Croissant  1840    5520   0.62 0.2568039
#> 2        Sourdough  1210    4840   0.55 0.2251687
#> 3    Cinnamon Roll  1100    4400   0.58 0.2046988
#> 4         Baguette  1530    3825   0.51 0.1779484
#> 5 Blueberry Muffin   970    2910   0.48 0.1353803
```

Now **format**. The **scales** package turns bare numbers into the strings a reader expects. `dollar()` adds the currency symbol and a thousands separator, `percent()` turns a proportion into a percentage, and `comma()` adds separators to plain counts:

```r
library(scales)

dollar(report$revenue)                 # 5520 becomes "$5,520"
#> [1] "$5,520" "$4,840" "$4,400" "$3,825" "$2,910"
percent(report$share, accuracy = 1)    # 0.2568 becomes "26%"
#> [1] "26%" "23%" "20%" "18%" "14%"
comma(report$units)                    # 1840 becomes "1,840"
#> [1] "1,840" "1,210" "1,100" "1,530" "970"
```

Inside gt you do not call scales directly; you use the matching `fmt_` verbs, which apply the same formatting to whole columns at once:

```r-static
library(gt)

report |>
  gt() |>
  fmt_number(columns = units, decimals = 0) |>          # 1,840 with a separator
  fmt_currency(columns = revenue, currency = "USD", decimals = 0) |>
  fmt_percent(columns = c(margin, share), decimals = 0) # 0.62 becomes 62%
```

The widget shows the payoff: the sorted, formatted table a reader can act on.

::widget styled-table {"cols":["product","units","revenue","margin"],"rows":[["Croissant",1840,5520,0.62],["Sourdough",1210,4840,0.55],["Cinnamon Roll",1100,4400,0.58],["Baguette",1530,3825,0.51],["Blueberry Muffin",970,2910,0.48]],"formats":{"units":"comma","revenue":"dollar","margin":"pct"},"title":"Q1 sales, formatted","note":"Sorted by revenue. Units with separators, revenue as dollars, margin as percent."}

=== step === quiz
::eyebrow Check yourself
## What does fmt_percent expect?

Maya's `margin` column stores **proportions**: `0.62`, `0.55`, and so on. She wants the table to show `62%`, `55%`. She writes `fmt_percent(columns = margin)`. What appears in the table?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- 62%, 55%, 48%, ... ::ok Correct. fmt_percent (and scales::percent) expect a proportion between 0 and 1 and multiply by 100, so 0.62 becomes 62%. Store proportions and let the formatter do the conversion.
- 0.62%, 0.55%, 0.48%, ... ::no fmt_percent does more than tack on a % sign: it multiplies by 100 first. A stored 0.62 becomes 62%, not 0.62%.
- 6200%, 5500%, 4800%, ... ::no That is what you would get if the column already held 62 (a pre-multiplied percentage) and you applied fmt_percent: 62 times 100 is 6200%. The fix is to store proportions (0.62), not pre-multiplied percentages, and let fmt_percent do the times-100.

=== step === concept
::eyebrow Choose the tool
## Where will this table live?

gt makes beautiful HTML and PDF tables, but it is not the only option, and it cannot do everything. The right package depends on **where the table is going**. Pick by destination:

::widget process-flow {"steps":[{"title":"A quick look in R","sub":"kable(): one line, plain text, fine in the console or a simple doc"},{"title":"An HTML or PDF report","sub":"gt: the richest styling, built for Quarto and the web"},{"title":"A Word or PowerPoint file","sub":"flextable: the one that writes native, editable Office tables"},{"title":"R Markdown or LaTeX","sub":"kableExtra: styling layered on top of kable"}]}

| Package | Best for | The trade-off |
|---|---|---|
| `kable` | a fast console or Markdown table | almost no styling |
| `gt` | HTML and PDF reports, Quarto | no native Word output |
| `flextable` | Word and PowerPoint | a different function vocabulary to learn |
| `kableExtra` | R Markdown HTML and LaTeX | built around kable, not data-first |

When the table has to land in a **Word** document, **flextable** is the tool. It writes a true, editable Office table, something gt cannot do. Run this in your own R session (it produces a Word file, so it needs a desktop R install):

```r-static
# Word and PowerPoint: flextable writes a real, editable Office table.
# install.packages("flextable") first, then in your own R session:
ft <- flextable::flextable(sales)
ft <- flextable::set_caption(ft, "Bakery Q1 sales by product")
ft <- flextable::colformat_double(ft, j = "revenue", prefix = "$", digits = 0)
flextable::save_as_docx(ft, path = "sales.docx")
```

And when you are writing an **R Markdown** report and want styled HTML or LaTeX, **kableExtra** adds polish on top of `kable`:

```r-static
# R Markdown HTML or LaTeX: kableExtra styles a kable.
# install.packages("kableExtra") first, then in your own R session:
kableExtra::kbl(sales, col.names = c("Product", "Units", "Revenue", "Margin")) |>
  kableExtra::kable_styling(bootstrap_options = c("striped", "hover"))
```

[NOTE]
You do not need all three. Most analysts learn gt for reports and reach for flextable only when a table must go into Word or PowerPoint. Choosing well is mostly about knowing which one writes the format your reader opens.

=== step === quiz
::eyebrow Check yourself
## Pick the package

Maya's loan officer asks her to email the sales table inside a **Word document** she can edit and paste into the bank's own report. Which package should Maya use to build that table?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- flextable ::ok Right. flextable is the one that writes a native, editable Word (and PowerPoint) table. gt and kableExtra target HTML, PDF and LaTeX, not Office files.
- gt ::no gt is the richest choice for an HTML or PDF report and for Quarto, but it does not write an editable Word table. For a Word file, reach for flextable.
- kableExtra ::no kableExtra styles HTML and LaTeX tables inside R Markdown; it does not produce a native, editable Word document. Use flextable for Word.

=== step === tryit
::eyebrow Put it together
## Build the finished report frame

Bring the pieces together. Starting from `sales`, build Maya's report-ready data in one pipe: sort by revenue (highest first), add a `share` column for each product's fraction of total revenue, then format that share as a rounded percentage. Fill in the function that turns a proportion like `0.26` into `"26%"`.

```r
library(dplyr)
library(scales)

sales |>
  arrange(desc(revenue)) |>
  mutate(
    share = revenue / sum(revenue),
    share = ____(share, accuracy = 1)
  )
```
::check {"regex":"percent","gate":true,"difficulty":"intermediate","ok":"Exactly. percent(share, accuracy = 1) turns 0.2568 into 26%, rounded to a whole number. arrange put the best seller on top, mutate added the share, and percent made it readable, all in one pipe.","no":"You want to turn a proportion (0.26) into a percentage string (26%). The scales helper is percent(): write percent(share, accuracy = 1)."}
::solution
```r
sales |>
  arrange(desc(revenue)) |>
  mutate(
    share = revenue / sum(revenue),
    share = percent(share, accuracy = 1)
  )
#>            product units revenue margin share
#> 1        Croissant  1840    5520   0.62   26%
#> 2        Sourdough  1210    4840   0.55   23%
#> 3    Cinnamon Roll  1100    4400   0.58   20%
#> 4         Baguette  1530    3825   0.51   18%
#> 5 Blueberry Muffin   970    2910   0.48   14%
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [gt: the official documentation](https://gt.rstudio.com/) - the package you used here, with a gallery and the full list of `fmt_` and `tab_` functions.
- [flextable user guide](https://davidgohel.github.io/flextable/) - building tables for Word and PowerPoint, the destinations gt cannot reach.
- [kableExtra documentation](https://haozhu233.github.io/kableExtra/) - styling HTML and LaTeX tables on top of `kable`, for R Markdown reports.
- [scales: formatting numbers and labels](https://scales.r-lib.org/) - `dollar()`, `percent()`, `comma()` and the rest of the number-formatting helpers used in this lesson.

=== step === complete
## Lesson 1 complete

You can now turn a raw data frame into a table a reader will actually read. You built one with **gt** (title, labels, source note), **formatted** the numbers as currency and percentages (and saw why a proportion, not a pre-multiplied percent, is what `fmt_percent` wants), **shaped** the data first with dplyr so the rows tell a story, and learned to **pick the package** by where the table is headed: gt for reports, flextable for Word, kableExtra for R Markdown.

Next, Lesson 2: **Summary tables and number formatting**. You will build one-line summary tables and regression tables with gtsummary, and go deeper on formatting numbers, percentages and units so a whole table reads cleanly, the finishing skills that make a report look effortless.
