---
title: "Interactive Dashboards Lesson 2: Quarto dashboards and linked views"
description: "Build a Quarto dashboard for six shops: value boxes and chart tiles in a row-and-column grid, then link views with crosstalk so one selection filters them all."
keywords: "Quarto dashboard, format dashboard, value box, valuebox, crosstalk, linked views, SharedData, R dashboard layout, bslib, quarto valuebox"
post_type: "LESSON"
curriculum_id: "2.8.2"
webr: true
lesson_access: "free"
course_id: "da-dashboards"
course_title: "Interactive Dashboards in R"
course_lesson: "2"
course_total: "3"
course_landing: "Dashboards-Course.html"
course_next: "Your-First-Shiny-App.html"
course_prev: "Interactive-Charts-and-Maps-in-R.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## Six charts, one screen

In Lesson 1 you made single charts talk back: you wrapped Maya's bakery scatter in `ggplotly()` for hover, and pinned her six coffee-and-pastry shops onto a **leaflet** map. Useful, but each one lived in its own window. Maya kept five browser tabs open and a printout on her desk, flipping between them to answer one question.

A **dashboard** ends the tab-juggling. It takes those separate tiles, the headline numbers, the trend line, the by-shop bars, the map, and arranges them on a single page so the whole business is visible at a glance. Better still, it can **link** them: pick one shop and every tile narrows to that shop at once.

That is exactly the dashboard below. Move the **Area** filter and watch all three value boxes and both charts answer together. You will build this yourself, from a plain text file and with no web server.

By the end of this lesson you will be able to:

- Say what a Quarto dashboard is: one `.qmd` file with `format: dashboard` that renders to a laid-out page of tiles
- Lay out a dashboard as a grid of **rows** and **columns**, and drop a chart into a **card**
- Build **value boxes**, the big headline numbers, by computing them in R
- **Link** several views with **crosstalk** so selecting in one filters the others, with no server

**Prerequisites:** you can run R and load a package with `library()`, you have built a ggplot (data, then `aes()`, then a geom) in the [ggplot2 course](ggplot2-Course.html), and you made a single interactive chart and map in [Lesson 1](Interactive-Charts-and-Maps-in-R.html). Every new term is defined as it appears.

::widget dashboard-layout {"filterLabel":"Area","views":{"All":{"boxes":[["Revenue","$227K"],["Customers/day","1,015"],["Shops","6"]],"line":[{"x":1,"y":188},{"x":2,"y":201},{"x":3,"y":210},{"x":4,"y":219},{"x":5,"y":238},{"x":6,"y":255}],"bar":[{"x":"Riverside","y":42},{"x":"Old Town","y":53},{"x":"Market Sq","y":21},{"x":"University","y":47},{"x":"Harbour","y":28},{"x":"Garden Gate","y":36}]},"North":{"boxes":[["Revenue","$136K"],["Customers/day","610"],["Shops","3"]],"line":[{"x":1,"y":108},{"x":2,"y":116},{"x":3,"y":121},{"x":4,"y":128},{"x":5,"y":140},{"x":6,"y":151}],"bar":[{"x":"Old Town","y":53},{"x":"University","y":47},{"x":"Garden Gate","y":36}]},"South":{"boxes":[["Revenue","$91K"],["Customers/day","405"],["Shops","3"]],"line":[{"x":1,"y":80},{"x":2,"y":85},{"x":3,"y":89},{"x":4,"y":91},{"x":5,"y":98},{"x":6,"y":104}],"bar":[{"x":"Riverside","y":42},{"x":"Market Sq","y":21},{"x":"Harbour","y":28}]}}}

=== step === concept
::eyebrow What it is
## One file, one screen

A Quarto dashboard is not a new app you learn or a server you run. It is a single plain text file, a **`.qmd`** (Quarto markdown) document, that you **render** into a finished web page. The same file you would knit into a report, with one line changed.

That one line lives at the very top, in the **YAML header** (the small settings block fenced by `---` lines). Swap `format: html` for **`format: dashboard`** and Quarto stops stacking your content as a long report and starts arranging it as a tiled dashboard instead. Toggle the widget below between **Source (.qmd)** and **Rendered** to see the same file as text you write and as the page it produces.

::widget doc-structure {"blocks":[{"type":"yaml","text":"title: Bakery sales dashboard\nformat: dashboard"},{"type":"prose","text":"## Revenue by shop\n\nSix shops, one screen."},{"type":"code","text":"ggplot(shops, aes(name, revenue)) +\n  geom_col()","chart":[{"x":"Old Town","y":53},{"x":"University","y":47},{"x":"Riverside","y":42},{"x":"Garden Gate","y":36},{"x":"Harbour","y":28},{"x":"Market Sq","y":21}]}]}

Everything in this lesson is built from Maya's six shops. Each lesson runs in a fresh R session, so we build that data right here (run this once, then every later block can use it):

```r
shops <- data.frame(
  name      = c("Riverside", "Old Town", "Market Square", "University", "Harbour", "Garden Gate"),
  area      = c("South", "North", "South", "North", "South", "North"),
  customers = c(180, 240, 95, 210, 130, 160),   # average customers per day
  revenue   = c(42000, 53000, 21000, 47000, 28000, 36000)   # revenue last month, dollars
)
shops
#>            name  area customers revenue
#> 1     Riverside South       180   42000
#> 2      Old Town North       240   53000
#> 3 Market Square South        95   21000
#> 4    University North       210   47000
#> 5       Harbour South       130   28000
#> 6   Garden Gate North       160   36000
```

[KEY INSIGHT]
A Quarto dashboard is authored, not coded by hand. You describe the content in markdown and R; `format: dashboard` does the laying-out. You never write the HTML or CSS yourself.

=== step === concept
::eyebrow The skeleton
## The grid: rows, columns, and cards

A dashboard page is a **grid**. You carve it up with markdown headings, and Quarto turns them into the layout, no HTML, no CSS:

- A level-1 heading `# Row` (or `# Column`) starts a new **band** across the page.
- A level-2 heading `## Column` (or `## Row`) splits that band into side-by-side regions.
- Each region holds one or more **cards**: a card is simply a code chunk that produces something, a chart, a table, a value box.

You also size regions with a curly-brace attribute on the heading, `{width=60%}` or `{height=30%}`. Here is the skeleton of Maya's dashboard, two columns in one row, the wider one for the chart:

```r-static
---
title: "Bakery sales dashboard"
format: dashboard
---

# Row

## Column {width=65%}
(the revenue chart card goes here)

## Column {width=35%}
(the map card goes here)
```

The card itself is a chart you already know how to make. This is the revenue-by-shop bar chart from the end of Lesson 1; inside a dashboard it simply becomes the contents of one card. Build it now (it runs and draws here):

```r
library(ggplot2)
p <- ggplot(shops, aes(x = reorder(name, revenue), y = revenue)) +
  geom_col(fill = "steelblue") +
  coord_flip() +
  labs(x = NULL, y = "revenue last month ($)")
p
```

Drop that `p` into a `## Column` and you have a card. The grid arranges it; you just supply the chart.

=== step === quiz
::eyebrow Check yourself
## How do two charts sit side by side?

Maya wants her revenue chart and her map next to each other, not stacked. In a Quarto dashboard, how do you put two cards side by side?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Put each card under its own `## Column` heading inside the same row; Quarto builds the grid from those headings ::ok Exactly. You describe structure with `# Row` and `## Column` headings (plus optional `{width=...}`), and `format: dashboard` lays it out. No HTML or CSS from you.
- Write raw HTML `div` tags and CSS flexbox by hand in the .qmd ::no That is the whole thing a Quarto dashboard saves you from. You write headings; Quarto generates the HTML and CSS. Hand-rolling layout is exactly what you do not do.
- You cannot; a dashboard always stacks every card in one tall column ::no Rows and columns are the entire point of the grid. `## Column` headings place cards side by side; `# Row` stacks bands. Side-by-side is one heading away.

=== step === concept
::eyebrow The headline numbers
## Value boxes: one big number each

The three tiles across the top of the cover, **$227K**, **1,015**, **6**, are **value boxes**: a card stripped down to a single headline number, a label, and maybe an icon. They are the first thing a busy owner reads, so each one should answer a question in one glance: *how much did we make? how many customers? how many shops?*

A value box does not invent its number; you compute it in R, with the same functions you already use. The three on the cover are just three one-line summaries of `shops`:

```r
total_revenue <- sum(shops$revenue)   # add up all six shops
n_shops       <- nrow(shops)          # count the rows
total_revenue
#> [1] 227000
n_shops
#> [1] 6
```

The box shows a tidy *string*, not the raw number, so format it for reading. `paste0()` glues pieces of text together:

```r
paste0("$", round(total_revenue / 1000), "K")   # the text the Revenue box displays
#> [1] "$227K"
```

In the `.qmd`, a value box is a card whose chunk is flagged `#| content: valuebox` (those `#|` lines are **chunk options**, settings for that one code chunk). The chunk just returns the value:

```r-static
#| content: valuebox
#| title: "Revenue"
#| icon: currency-dollar
#| color: primary
list(value = paste0("$", round(sum(shops$revenue) / 1000), "K"))
```

And because every number comes from R, the *same* boxes recompute for any slice of the data. Split the shops by area and you get precisely the North and South numbers the cover filter shows:

```r
library(dplyr)
shops |>
  group_by(area) |>
  summarise(revenue = sum(revenue), customers = sum(customers), shops = n())
#> # A tibble: 2 x 4
#>   area  revenue customers shops
#>   <chr>   <dbl>     <dbl> <int>
#> 1 North  136000       610     3
#> 2 South   91000       405     3
```

=== step === tryit
::eyebrow Your turn
## Compute the third value box

The cover has three boxes: Revenue (`sum(shops$revenue)`), Shops (`nrow(shops)`), and **Customers/day**, which reads **1,015**. That third number is the total of the `customers` column across all six shops. Fill in the function that adds a column up.

```r
# shops is already loaded; one value box still needs its number
total_customers <- ____(shops$customers)
total_customers
```
::check {"regex":"sum","gate":true,"difficulty":"beginner","ok":"That is it. sum(shops$customers) totals the column to 1,015, the number the Customers/day box shows. A value box is always just a value you compute and hand to Quarto.","no":"You want to ADD the column up, not average or count it. The function is sum(): write sum(shops$customers)."}
::solution
```r
total_customers <- sum(shops$customers)
total_customers
#> [1] 1015
```

=== step === concept
::eyebrow The payoff
## Linked views: select once, filter everywhere

So far the tiles are arranged, but independent: each chart shows all six shops, all the time. The new idea on the cover is **linking**. Click Old Town in one view and the trend, the bars and the map all narrow to Old Town together. Move the **Area** filter in the dashboard below and watch the value boxes and both charts update at once. That is the linking you are about to wire.

::widget dashboard-layout {"filterLabel":"Area","views":{"All":{"boxes":[["Revenue","$227K"],["Customers/day","1,015"],["Shops","6"]],"line":[{"x":1,"y":188},{"x":2,"y":201},{"x":3,"y":210},{"x":4,"y":219},{"x":5,"y":238},{"x":6,"y":255}],"bar":[{"x":"Riverside","y":42},{"x":"Old Town","y":53},{"x":"Market Sq","y":21},{"x":"University","y":47},{"x":"Harbour","y":28},{"x":"Garden Gate","y":36}]},"North":{"boxes":[["Revenue","$136K"],["Customers/day","610"],["Shops","3"]],"line":[{"x":1,"y":108},{"x":2,"y":116},{"x":3,"y":121},{"x":4,"y":128},{"x":5,"y":140},{"x":6,"y":151}],"bar":[{"x":"Old Town","y":53},{"x":"University","y":47},{"x":"Garden Gate","y":36}]},"South":{"boxes":[["Revenue","$91K"],["Customers/day","405"],["Shops","3"]],"line":[{"x":1,"y":80},{"x":2,"y":85},{"x":3,"y":89},{"x":4,"y":91},{"x":5,"y":98},{"x":6,"y":104}],"bar":[{"x":"Riverside","y":42},{"x":"Market Sq","y":21},{"x":"Harbour","y":28}]}}}

The tool that does this is the **crosstalk** package, and the idea is a single shared object. You wrap your data frame *once* in `SharedData$new()`, then hand that **same** shared object to each interactive view instead of the raw data frame. Because they share one object, a selection in any view tells the others which rows are selected, and they redraw to match:

```r-static
library(crosstalk)
library(plotly)
library(DT)

# 1. wrap the data ONCE so every view shares it
shared <- SharedData$new(shops)

# 2. feed the SAME shared object to each widget (not the raw `shops`)
bscols(
  plot_ly(shared, x = ~customers, y = ~revenue, type = "scatter", mode = "markers"),
  datatable(shared)
)
```

`bscols()` just places the two views side by side. Now brush a box around some points on the scatter and the table filters to exactly those shops, instantly, with **no server running**. The whole thing is plain JavaScript that crosstalk generated, so it works in a static HTML file you can email or host anywhere.

[NOTE]
The one rule: every linked view must read from the **same** `SharedData` object. Pass `shared` to `plot_ly()`, `leaflet()` and `datatable()`; pass the raw `shops` and that view goes back to showing everything, unlinked.

=== step === tryit
::eyebrow Your turn
## Wrap the data so the views can link

Linking starts with one line: turn the plain `shops` data frame into a **shared** object that every view can point at. The function is `SharedData$new()`. Fill in the blank.

```r
# crosstalk is loaded; shops is your data frame
shared <- ____(shops)
```
::check {"regex":"SharedData","gate":true,"difficulty":"intermediate","ok":"Yes. SharedData$new(shops) makes the one shared object. Hand `shared` to each widget (plot_ly, leaflet, datatable) and a selection in one filters them all.","no":"You need the shared wrapper around the data: SharedData$new(). Write SharedData$new(shops)."}
::solution
```r-static
library(crosstalk)
shared <- SharedData$new(shops)
# pass `shared` (not `shops`) to plot_ly(), leaflet() or datatable()
```

=== step === concept
::eyebrow Know the edge
## When linking is enough, and when you need Shiny

Crosstalk feels like magic, but it has a clear boundary, and knowing it saves you from reaching for the wrong tool. It links views entirely **in the browser**, by filtering rows that were already computed when the page was rendered. That makes it fast, server-free, and perfect for *select-and-filter*. It also means it cannot run any new R after the page loads.

| You want to... | Reach for | Why |
|---|---|---|
| Highlight/filter the same data across several charts | **crosstalk** | Pure browser-side row filtering; no server, ships in a static file |
| Re-run a model, recompute a summary, or load new data on a click | **Shiny** | Needs live R reacting to inputs, a running server, not just filtering |
| A simple at-a-glance layout with no interaction between tiles | **Quarto dashboard** alone | Value boxes and cards are enough; skip the linking machinery |

Two honest limits of crosstalk worth carrying:

- It links only **htmlwidgets** (interactive R charts and tables that render as live JavaScript in the page) that **support** it, chiefly **plotly**, **leaflet** and **DT**. A plain static ggplot cannot be linked; it has nothing to brush.
- It is **client-side**, so the whole dataset ships to the browser. Wonderful for Maya's six shops or a few thousand rows; the wrong choice for millions.

[WARNING]
"Reactivity" is not one thing. Crosstalk reacts by *filtering rows already in the page*. Shiny reacts by *running R again*. If your dashboard needs a number that does not exist yet until the user picks something, that is Shiny territory, the subject of Lesson 3.

=== step === quiz
::eyebrow Check yourself
## Crosstalk or Shiny?

Maya wants a dropdown of months. Picking a month should **re-run a forecast** in R and show the new predicted revenue, a number that did not exist on the page before. Which tool fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- crosstalk: it runs R live whenever she changes the dropdown ::no Crosstalk never runs R after the page loads. It only filters rows that were already computed at render time. A fresh forecast is brand-new computation, which it cannot do.
- Shiny: re-running a forecast is live computation in response to an input, which needs a running R server ::ok Right. The moment you need a value computed *after* a user acts, you have left crosstalk's filtering and entered Shiny's run-R-again reactivity. That is Lesson 3.
- Neither: she must edit the .qmd and re-render it by hand each month ::no Re-rendering by hand defeats the point of an interactive dashboard. Shiny automates exactly this: an input triggers live R and the output updates itself.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Quarto Dashboards: the official guide](https://quarto.org/docs/dashboards/) - the canonical reference for `format: dashboard`, rows, columns and cards, from the Quarto team.
- [Quarto dashboards: data display and value boxes](https://quarto.org/docs/dashboards/data-display.html) - the page behind value boxes, tables and cards, with every chunk option.
- [crosstalk for R](https://rstudio.github.io/crosstalk/) - SharedData, linked brushing, and an honest list of which widgets it supports and its client-side limits.
- [Interactive web-based data visualization with R, plotly, and shiny](https://plotly-r.com/) - Carson Sievert's free book; the linking chapter shows crosstalk with plotly, leaflet and DT end to end.

=== step === complete
## Lesson 2 complete

You turned six separate charts into one screen. You saw that a Quarto dashboard is a single `.qmd` with `format: dashboard`, laid out as a **grid** of rows and columns whose **cards** are just code chunks. You built **value boxes** by computing their numbers in R, and you **linked** views with **crosstalk**: wrap the data once in `SharedData$new()`, hand that shared object to each widget, and one selection filters them all, with no server. Just as important, you learned crosstalk's edge: it filters in the browser, it does not re-run R.

Next, Lesson 3: **Your first Shiny app**. When a dashboard needs to *recompute* on a click, not just filter, you need reactivity that runs R live. You will build the smallest possible Shiny app, one input driving one output, and watch the reactive graph re-run.
