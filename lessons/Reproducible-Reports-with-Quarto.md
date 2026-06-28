---
title: "Communicate and Automate Lesson 1: Quarto Reports"
catalog_blurb: "Write reports that regenerate from the data, no manual rebuilds."
description: "Reproducible reporting with Quarto in R: the anatomy of a .qmd (YAML, prose, code chunks), what render knits to, inline code that kills copy-paste, and parameterized reports."
keywords: "Quarto, R Markdown, reproducible reports, qmd, YAML header, code chunks, inline code, quarto render, parameterized reports, params, knitr, R"
post_type: "LESSON"
curriculum_id: "2.9.1"
webr: true
lesson_access: "free"
course_id: "da-communicate"
course_title: "Communicate and Automate with R"
course_lesson: "1"
course_total: "3"
course_landing: "Communicate-Automate-Course.html"
course_next: "Telling-a-Story-with-Data.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## Quarto Reports
Every Monday, Priya, a data analyst at the Inkwell Books chain, ships the same thing: last week's sales report. For a long time she did it by hand. She ran her R code, copied the numbers into a Word document, pasted a chart, and wrote a summary sentence. Then one Monday the data changed at the last minute. She updated the chart but forgot the sentence, and the report went out with a headline that said one revenue and a chart that showed another.

That mistake has a name: **copy-paste drift**, and it is exactly what this lesson removes. With **Quarto** (and its older sibling **R Markdown**), the prose, the code, and the figures all live in **one file**. You render that file once and every number in the text is computed by R, never typed. Then you make it a *template* that re-runs for any store or any week, with no editing at all.

The widget below is Priya's report. Toggle between **Source (.qmd)**, the plain text she writes, and **Rendered**, the finished page R produces from it.

By the end of this lesson you will be able to:

- Name the three parts of a Quarto document (the YAML header, the prose, and the code chunks) and say what "render" does
- Write a code chunk and an inline expression so a figure, a table, or a number is produced by R, not pasted
- Explain why this makes a report reproducible: change the data once and every number re-flows
- Describe what render turns your file into, and get HTML, PDF or Word from the *same* source
- Parameterize a report with `params:` so one template re-runs for any input

**Prerequisites:** you can run R and load a package with `library()`, you have built a basic ggplot (data, then `aes()`, then a geom) in [The Grammar of Graphics](The-Grammar-of-Graphics.html), and you know the dplyr verbs `filter()` and `summarise()` from [The dplyr Verbs](The-dplyr-Verbs.html). Every new term is defined as it appears.

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Weekly sales report\nauthor: Priya\nformat: html"},{"type":"prose","text":"## Summary\n\nTotal revenue last week was **$31,000**, led by the Downtown store."},{"type":"code","text":"ggplot(sales, aes(store, revenue)) +\n  geom_col()","chart":[{"x":"Downtown","y":8400},{"x":"Airport","y":6200},{"x":"Uptown","y":5200},{"x":"Old Mill","y":4600},{"x":"Riverside","y":3600},{"x":"Lakeside","y":3000}]}]}

=== step === concept
::eyebrow What it is
## One file, three parts

A Quarto document is a single plain text file with the extension **`.qmd`** (Quarto markdown). It is not an app and not a server. You write it, then you **render** it: render means "run the file and produce a finished document," a web page, a PDF, or a Word file. R Markdown (`.Rmd`) works the same way and Quarto is its modern successor, so everything here applies to both.

Every `.qmd` is made of just three kinds of content. Toggle the widget above between Source and Rendered and you can see all three:

- **The YAML header**: a small settings block at the very top, fenced by `---` lines. It holds the title, the author, and the output `format:`. (YAML is just a simple `key: value` text format for settings.)
- **The prose**: ordinary markdown text, headings, sentences, lists, the words a reader actually reads.
- **The code chunks**: blocks of R fenced by ```` ```{r} ````. When you render, R runs each chunk and drops its result, a table or a chart, straight into the document.

Everything in this lesson is built from Priya's six Inkwell Books stores. Each lesson runs in a fresh R session, so we create that data right here (run this once, and every later block can use it):

```r
sales <- data.frame(
  store   = c("Downtown", "Airport", "Riverside", "Uptown", "Lakeside", "Old Mill"),
  units   = c(420, 310, 180, 260, 150, 230),     # books sold last week
  revenue = c(8400, 6200, 3600, 5200, 3000, 4600) # dollars
)
sales
#>      store units revenue
#> 1 Downtown   420    8400
#> 2  Airport   310    6200
#> 3 Riverside   180    3600
#> 4   Uptown   260    5200
#> 5 Lakeside   150    3000
#> 6 Old Mill   230    4600
```

[KEY INSIGHT]
A Quarto report is authored, not assembled. You describe the content in markdown and R, and render does the work of running the code and stitching the results into a finished document. You never copy a result by hand.

=== step === concept
::eyebrow The code does the work
## A code chunk runs, and its output appears

A code chunk is the engine of a reproducible report. You write the R once; at render time it executes and its output, a table or a figure, lands in the document in place. Nothing is screenshotted, nothing is pasted.

Here is the table chunk for Priya's report. The pipe `|>` feeds `sales` into `arrange(desc(revenue))`, which sorts the stores from highest revenue down, and `knitr::kable()` turns a data frame into a clean report table:

```r
library(dplyr)
library(knitr)

by_store <- sales |> arrange(desc(revenue))
kable(by_store, caption = "Sales by store, last week")
#> 
#> Table: Sales by store, last week
#> 
#> |store    | units| revenue|
#> |:--------|-----:|-------:|
#> |Downtown |   420|    8400|
#> |Airport  |   310|    6200|
#> |Uptown   |   260|    5200|
#> |Old Mill |   230|    4600|
#> |Riverside|   180|    3600|
#> |Lakeside |   150|    3000|
```

And here is the figure chunk, the same bar chart you saw on the cover. In the `.qmd` this is just another ```` ```{r} ```` block; render runs it and inserts the plot:

```r
library(ggplot2)

ggplot(sales, aes(reorder(store, revenue), revenue)) +
  geom_col(fill = "#1f7a55") +
  coord_flip() +
  labs(x = NULL, y = "revenue last week ($)")
```

The report you ship contains the *output* of these chunks, not the code (you can hide the code with a chunk option). Change a sales figure and re-render, and the table and the chart both redraw themselves.

=== step === concept
::eyebrow The trick that ends drift
## Inline code: numbers written by R

The table and the chart are computed. But what about a sentence like *"Total revenue last week was $31,000"*? If Priya types that number, she is back to copy-paste drift the moment the data changes. The fix is **inline code**: a tiny R expression embedded *inside the prose* that is replaced by its result when the report renders.

Run this to see exactly the value that would be slotted into the sentence:

```r
library(glue)

total_rev <- format(sum(sales$revenue), big.mark = ",")
top       <- sales$store[which.max(sales$revenue)]
glue("Total revenue last week was ${total_rev}, led by {top}.")
#> Total revenue last week was $31,000, led by Downtown.
```

In a real `.qmd`, the prose itself carries the expression. You write inline R between backticks (`` `r expr` ``) right in the sentence, and render swaps in the result:

```r-static
Total revenue last week was $`r sum(sales$revenue)`,
led by `r sales$store[which.max(sales$revenue)]`.
```

[KEY INSIGHT]
Inline code is what makes the *words* reproducible, not just the charts. Because the number is produced by the same data the chart uses, the headline and the figure can never disagree again.

=== step === quiz
::eyebrow Check yourself
## Change one number, then re-render

Priya discovers last week's Airport revenue was entered wrong. She fixes that single number in the `sales` data and re-renders the report. Which parts of the finished report change?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Every computed part: the headline sentence, the table, and the chart all update together, because each is recomputed from the data at render time ::ok Exactly. The table and chart come from code chunks and the headline number is inline code, so all three recompute from the same data on every render. That is reproducibility: one data change, one re-render, everything consistent.
- Only the chart updates; she still has to fix the summary sentence by hand ::no That is the copy-paste world Quarto removes. The headline is inline code, computed at render, so it re-flows automatically alongside the table and chart. Nothing is edited by hand.
- Nothing changes until she manually edits each number in the text ::no Manual edits are exactly the drift Quarto prevents. Chunks and inline code recompute from the data every render, so one fix updates the whole report at once.

=== step === tryit
::eyebrow Your turn
## Write the inline number

Priya's summary needs a sentence: *"We sold ___ books last week."* That blank should be filled by R, not typed, so it stays correct when the data changes. Write the expression that totals the `units` column across all six stores.

```r
# the value that fills "We sold ___ books last week"
books_sold <- ____
books_sold
```
::check {"regex":"sum\\s*[(]\\s*sales\\$units\\s*[)]","gate":true,"difficulty":"beginner","ok":"That is it. sum(sales$units) totals the column to 1,550. As inline code in the prose it recomputes every render, so the sentence is always right.","no":"You want to ADD the units column up, not count or average it. Use sum(): write sum(sales$units)."}
::solution
```r
books_sold <- sum(sales$units)
books_sold
#> [1] 1550
```

=== step === concept
::eyebrow Under the hood
## What render actually does

When you render a `.qmd`, three things happen in order, and knowing them demystifies the whole process. **Knit** (sometimes called "execute") runs every code chunk and captures its output. The document, now full of real results, becomes plain **markdown**. Then a tool called **Pandoc** converts that markdown into your chosen output format. The result is one self-contained file you can email or host anywhere.

::widget process-flow {"steps":[{"title":"Execute","sub":"run every code chunk, capture each table and figure"},{"title":"Knit to markdown","sub":"drop those results into a plain markdown document"},{"title":"Pandoc","sub":"convert that markdown to the final format"},{"title":"Output","sub":"one self-contained HTML, PDF or Word file"}]}

You trigger all of that with one command. From the Terminal, or from R, you point Quarto at the file:

```r-static
# in the Terminal:
quarto render weekly-report.qmd

# or from R:
quarto::quarto_render("weekly-report.qmd")
```

Render runs R *once*, on your machine, and bakes the results into the output file. The person reading the finished HTML or PDF does not need R installed; they just open the document.

=== step === quiz
::eyebrow Check yourself
## One source, two outputs

Priya needs her report two ways: as a web page for the team wiki, and as a Word document her manager can mark up with comments. She has one `.qmd` already written. What does she change to get both?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Just the `format:` line in the YAML header (`format: html` versus `format: docx`); the prose and code stay exactly the same ::ok Right. One source, many outputs is the heart of Quarto. Only `format:` changes; Pandoc converts the same content to HTML, PDF, Word and more. You write the report once.
- She rewrites the report once for each format she needs ::no That defeats the whole point of one source. Only the `format:` line changes; the same prose and code render to any format Pandoc supports.
- She can only produce HTML from a .qmd; Word needs a different tool ::no A single `.qmd` renders to HTML, PDF, Word, slides and more, all by setting `format:`. The content is authored once.

=== step === concept
::eyebrow The automation payoff
## One template, any input

Priya does not want one report. She wants the *same* report for the Downtown store, then Airport, then Riverside, every week. Rewriting the file six times would reintroduce every error she just removed. The answer is a **parameter**: a value declared in the YAML header that the document reads, so one template produces many reports.

You add a `params:` block to the YAML, then refer to it anywhere in the document as `params$store`. Toggle the widget between Source and Rendered to see the parameter sitting in the header and being used in the body:

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Weekly sales report\nformat: html\nparams:\n  store: Downtown"},{"type":"prose","text":"## Report for **Downtown**\n\nThe store name comes from the header, so the same file builds a report for any store."},{"type":"code","text":"sales |>\n  filter(store == params$store)","chart":[{"x":"Downtown","y":8400}]}]}

Inside the document, `params$store` is just an ordinary value. Here we set it by hand to show the idea, then use it to compute that store's numbers (Quarto would set it from the header for you):

```r
library(dplyr)

# Quarto sets this from the YAML; here we set it by hand to see the idea
report_store <- "Airport"

sales |>
  filter(store == report_store) |>
  summarise(units = sum(units), revenue = sum(revenue))
#>   units revenue
#> 1   310    6200
```

Now one template can produce a finished report for every store, with no hand-edits, by rendering it once per parameter value:

```r-static
library(quarto)

# one template -> one finished report per store
for (s in unique(sales$store)) {
  quarto_render("weekly-report.qmd",
                execute_params = list(store = s),
                output_file    = paste0("report-", s, ".html"))
}
```

=== step === tryit
::eyebrow Your turn
## Make the report for another store

Run the template for the **Riverside** store. The parameter `report_store` is already set; complete the `filter()` so it keeps only the rows where the `store` column equals the chosen `report_store`.

```r
report_store <- "Riverside"

sales |>
  filter(____) |>
  summarise(units = sum(units), revenue = sum(revenue))
```
::check {"regex":"store\\s*==\\s*report_store","gate":true,"difficulty":"intermediate","ok":"Yes. filter(store == report_store) keeps just Riverside, so the summary returns 180 units and $3,600. Swap the parameter and the same template reports any store you like.","no":"Keep the rows whose store equals the parameter: filter(store == report_store)."}
::solution
```r
report_store <- "Riverside"

sales |>
  filter(store == report_store) |>
  summarise(units = sum(units), revenue = sum(revenue))
#>   units revenue
#> 1   180    3600
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Quarto: Get Started](https://quarto.org/docs/get-started/) - install Quarto and render your first document, straight from the Quarto team.
- [Quarto: Parameters](https://quarto.org/docs/computations/parameters.html) - the canonical guide to `params:` and rendering one template for many inputs.
- [R Markdown: The Definitive Guide](https://bookdown.org/yihui/rmarkdown/) - Xie, Allaire and Grolemund on the chunk-and-YAML model Quarto inherits.
- [R for Data Science (2e): Quarto](https://r4ds.hadley.nz/quarto.html) - Wickham, Cetinkaya-Rundel and Grolemund on the reproducible-report workflow.

=== step === complete
## Lesson 1 complete

You turned a fragile, hand-assembled report into one that updates itself. A Quarto document is a single `.qmd` with three parts: the **YAML header**, the **prose**, and the **code chunks**. You **render** it to run the code and produce a finished file. **Inline code** makes even the sentences reproducible, so the headline and the chart can never drift apart. The same source gives you HTML, PDF or Word by changing one `format:` line, and a `params:` block turns that one file into a template that re-runs for any store or any week.

Next, Lesson 2: **Telling a story with data**. A reproducible report is only useful if a busy reader acts on it. You will learn to lead with the answer, write the executive summary first, and structure a short data story that lands in thirty seconds.
