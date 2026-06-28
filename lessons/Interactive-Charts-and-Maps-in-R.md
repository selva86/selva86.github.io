---
title: "Interactive Dashboards Lesson 1: Interactive Charts & Maps"
catalog_blurb: "Add interactive charts and maps your readers can explore."
description: "Make R charts interactive with ggplotly and plotly (hover, zoom) and put your data on a leaflet map with markers and popups, plus when to keep a chart static."
keywords: "plotly in R, ggplotly, interactive charts in R, leaflet R maps, addCircleMarkers, interactive ggplot, htmlwidgets, hover tooltip, interactive visualization R"
post_type: "LESSON"
curriculum_id: "2.8.1"
webr: true
lesson_access: "free"
course_id: "da-dashboards"
course_title: "Interactive Dashboards in R"
course_lesson: "1"
course_total: "3"
course_landing: "Dashboards-Course.html"
course_next: "Quarto-Dashboards-and-Linked-Views.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## Interactive Charts & Maps
Maya's one neighbourhood bakery, the shop whose Q1 numbers you turned into a report table earlier in this track, did so well that she opened five more. She now runs **six** coffee-and-pastry shops across the city, and a printed bar chart no longer keeps up with her questions. *Which shop is that tall bar again? What exactly did the quiet one take last month? Where are they on the map?*

A static chart is a photograph: it shows the shape and then stops answering. An **interactive** chart is a conversation. You hover a point and it tells you which shop and the exact dollars; you drag a box around a crowded corner and it zooms in; you pan a map and the streets move under your shops. Move the **Area** filter on the dashboard below and watch every number and chart answer at once. That responsiveness is what this lesson builds, one chart and one map at a time.

By the end of this lesson you will be able to:

- Say what interactivity actually adds to a chart, and when it helps versus when it hurts
- Turn an ordinary ggplot into an interactive **plotly** chart with one line, `ggplotly()`
- Put your data on a **leaflet** map: a street basemap with a marker and a popup for every row
- Choose between an interactive and a static chart by where it has to live

**Prerequisites:** you can run R and load a package with `library()`, and you have built a ggplot (data, then `aes()`, then a `geom`) in the [ggplot2 course](ggplot2-Course.html). Every new term is defined as it appears.

::widget dashboard-layout {"filterLabel":"Area","views":{"All":{"boxes":[["Revenue","$227K"],["Customers/day","1,015"],["Shops","6"]],"line":[{"x":1,"y":188},{"x":2,"y":201},{"x":3,"y":210},{"x":4,"y":219},{"x":5,"y":238},{"x":6,"y":255}],"bar":[{"x":"Riverside","y":42},{"x":"Old Town","y":53},{"x":"Market Sq","y":21},{"x":"University","y":47},{"x":"Harbour","y":28},{"x":"Garden Gate","y":36}]},"North":{"boxes":[["Revenue","$136K"],["Customers/day","610"],["Shops","3"]],"line":[{"x":1,"y":108},{"x":2,"y":116},{"x":3,"y":121},{"x":4,"y":128},{"x":5,"y":140},{"x":6,"y":151}],"bar":[{"x":"Old Town","y":53},{"x":"University","y":47},{"x":"Garden Gate","y":36}]},"South":{"boxes":[["Revenue","$91K"],["Customers/day","405"],["Shops","3"]],"line":[{"x":1,"y":80},{"x":2,"y":85},{"x":3,"y":89},{"x":4,"y":91},{"x":5,"y":98},{"x":6,"y":104}],"bar":[{"x":"Riverside","y":42},{"x":"Market Sq","y":21},{"x":"Harbour","y":28}]}}}

=== step === concept
::eyebrow Why bother
## What interactivity actually buys you

A good static chart answers the big-picture question well: *do busier shops make more money?* Maya can read that off a scatter in a second. But the moment she asks a **pointed** question, a static picture goes quiet. Three things interactivity adds, each fixing a real limit of a printed chart:

- **Hover** reveals the exact value and the identity behind a mark. Instead of "that dot is around forty-something thousand," she hovers and reads `Old Town: 240 customers/day, $53,000`. The label was always in the data; hover just surfaces it on demand instead of cluttering the page.
- **Zoom and pan** let her explore density. When ten shops pile into one corner of a scatter, she drags a box around them and the chart zooms in so she can tell them apart.
- **A live map** lets her drag and zoom the city itself, instead of squinting at a fixed image.

First, the data. Each lesson runs in a fresh R session, so we build Maya's six shops right here (run this once):

```r
shops <- data.frame(
  name      = c("Riverside", "Old Town", "Market Square", "University", "Harbour", "Garden Gate"),
  area      = c("South", "North", "South", "North", "South", "North"),
  lon       = c(-73.985, -73.972, -73.991, -73.962, -73.951, -73.978),  # longitude
  lat       = c(40.748, 40.761, 40.722, 40.735, 40.715, 40.770),        # latitude
  customers = c(180, 240, 95, 210, 130, 160),                           # average customers per day
  revenue   = c(42000, 53000, 21000, 47000, 28000, 36000)               # revenue last month, dollars
)
shops
#>            name  area     lon    lat customers revenue
#> 1     Riverside South -73.985 40.748       180   42000
#> 2      Old Town North -73.972 40.761       240   53000
#> 3 Market Square South -73.991 40.722        95   21000
#> 4    University North -73.962 40.735       210   47000
#> 5       Harbour South -73.951 40.715       130   28000
#> 6   Garden Gate North -73.978 40.770       160   36000
```

Everything we draw, the chart and the map, comes from this one frame. Start with the plain static chart Maya already knows how to make: customers across the bottom, revenue up the side, one point per shop. It answers the big question (busier shops do take more) but it cannot tell you *which* dot is which:

```r
library(ggplot2)
p <- ggplot(shops, aes(x = customers, y = revenue)) +
  geom_point(size = 3, colour = "steelblue") +
  labs(x = "customers per day", y = "revenue ($)")
p
```

That `p` is our starting point. In the next step we make it talk back.

=== step === concept
::eyebrow The one-line upgrade
## ggplotly(): wrap a ggplot, get hover for free

Here is the happy surprise: you do not rebuild your chart to make it interactive. You **wrap** the ggplot you already have. The **plotly** package gives you `ggplotly()`, which takes a finished ggplot and redraws it as an **htmlwidget**, a small self-contained interactive chart, built in JavaScript, that R writes into a web page. Same data, same `aes()` mappings, same geom; now it responds to the mouse.

`ggplotly()` reads the mappings you already declared. Because you mapped `customers` to x and `revenue` to y, those are exactly what shows up when you hover a point. The tooltip (the little label that appears under the cursor) is built straight from your `aes()`:

```r-static
library(plotly)

# p is the ggplot from the previous step
ggplotly(p)
```

That single line turns the static scatter into the interactive one pictured below. Hover any point to read the exact numbers; the in-browser R session here cannot draw a live plotly widget, so the chart-plotter below stands in for the experience, showing the same scatter, the Pearson correlation, and the ggplot code underneath:

::widget chart-plotter {"data":[{"x":180,"y":42},{"x":240,"y":53},{"x":95,"y":21},{"x":210,"y":47},{"x":130,"y":28},{"x":160,"y":36}],"geoms":["point"],"x":"customers","y":"revenue_k","code":{"point":"ggplot(shops, aes(customers, revenue)) +\n  geom_point()"}}

[KEY INSIGHT]
`ggplotly()` is the fast path: keep building charts the ggplot way you already know, then add one wrap to ship them interactive. You learn no new chart grammar.

There is also a from-scratch path, `plot_ly()`, which builds a plotly chart directly without a ggplot. It maps columns with a **formula**, the little `~column` syntax that means "use this column from the data," and gives finer control over the tooltip:

```r-static
library(plotly)

plot_ly(shops, x = ~customers, y = ~revenue, type = "scatter", mode = "markers",
        text = ~name, hoverinfo = "text+x+y")   # show the shop name on hover
```

Reach for `ggplotly()` when you already have a ggplot (almost always); reach for `plot_ly()` when you want hover behaviour ggplot cannot express.

=== step === quiz
::eyebrow Check yourself
## What does ggplotly() do?

You spent ten minutes perfecting a ggplot called `p`, its colours, labels and theme. Now you want it interactive, so you call `ggplotly(p)`. What happens to your work?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- It reuses your existing ggplot, the same data, aes mappings and geoms, and redraws it as an interactive htmlwidget ::ok Right. ggplotly() wraps the chart you already built. Your aes() mappings become the hover tooltips; you do not rewrite anything in a new system.
- It throws your ggplot away and you must rebuild the chart from scratch with new plotly functions ::no That is the plot_ly() path, the from-scratch alternative. ggplotly() exists precisely so you do NOT rebuild: it converts the ggplot you already have.
- It exports your ggplot as a smaller static PNG image ::no ggplotly() makes the chart interactive (an htmlwidget you can hover and zoom), not a static image. A PNG is the opposite of what it produces.

=== step === tryit
::eyebrow Your turn
## Build the chart you will make interactive

Before you can wrap a chart in `ggplotly()`, you need the chart. Maya wants revenue compared shop by shop, drawn as **horizontal bars** sorted from biggest to smallest. The `aes()` and `coord_flip()` are done; you just need the geom.

The trap: `geom_bar()` **counts rows** by default, but Maya's `revenue` is already a value she wants drawn as the bar's height. The geom that draws a bar from a value you supply is `geom_col()`. Fill in the blank.

```r
library(ggplot2)
ggplot(shops, aes(x = reorder(name, revenue), y = revenue)) +
  ____ +
  coord_flip() +
  labs(x = NULL, y = "revenue last month ($)")
```
::check {"regex":"geom_col","gate":true,"difficulty":"beginner","ok":"Exactly. geom_col() draws a bar whose height is the revenue value you mapped to y. (geom_bar() would instead count how many rows each shop has, which is just 1 apiece.) reorder() sorted the bars, and this is the chart you would hand to ggplotly() to let Maya hover each bar.","no":"You want each bar's height to be the revenue value, not a row count. That geom is geom_col(). Type geom_col() in the blank."}
::solution
```r
library(ggplot2)
ggplot(shops, aes(x = reorder(name, revenue), y = revenue)) +
  geom_col(fill = "steelblue") +
  coord_flip() +
  labs(x = NULL, y = "revenue last month ($)")
```

=== step === concept
::eyebrow Now the map
## A map is just points placed by longitude and latitude

Maya's other question is *where*. Strip the streets away and a map is nothing more than your rows placed on a grid: **longitude** (how far east or west, the `lon` column) across the bottom, **latitude** (how far north or south, the `lat` column) up the side. You can preview that arrangement with a plotting tool you already own, a plain ggplot scatter of `lon` against `lat`:

::widget chart-plotter {"data":[{"x":-73.985,"y":40.748},{"x":-73.972,"y":40.761},{"x":-73.991,"y":40.722},{"x":-73.962,"y":40.735},{"x":-73.951,"y":40.715},{"x":-73.978,"y":40.770}],"geoms":["point"],"x":"lon","y":"lat","code":{"point":"ggplot(shops, aes(lon, lat)) +\n  geom_point()"}}

That scatter already shows the real shape of Maya's chain, spread across town rather than strung along one road (the weak correlation just confirms the shops do not line up along a single street). What it lacks is the **streets**. That is the one thing a mapping package adds: it drapes these same points over a real city map you can pan and zoom.

The package for that is **leaflet**, and it builds a map as a short pipeline, joined by the pipe `|>` (which feeds the result on its left into the next function), one layer at a time, the same way ggplot stacks geoms with `+`:

```r-static
library(leaflet)

leaflet(shops) |>                                   # start a map from the data
  addTiles() |>                                     # lay down the street basemap
  addCircleMarkers(lng = ~lon, lat = ~lat,          # one circle per shop, by coordinate
                   popup = ~name)                    # click a circle to see its name
```

Three new pieces, each one layer of the pipeline:

- `leaflet(shops)` starts an empty map fed by the data frame.
- `addTiles()` lays down the **basemap**: the street map itself, drawn from free **map tiles** (small square images, here from OpenStreetMap) that load and stitch together as you pan and zoom.
- `addCircleMarkers()` drops one circle **marker** at each row's position. `lng = ~lon` and `lat = ~lat` use the `~column` formula from before to say "read longitude from the `lon` column, latitude from `lat`." `popup = ~name` makes each circle show its shop name when clicked.

Like plotly, a leaflet map is an htmlwidget, so it shows up in a browser or a knitted report, not in the plain console here. Run the snippet in your own R and Maya's six shops appear on a draggable city map.

=== step === tryit
::eyebrow Your turn
## Drop a marker for every shop

Here is Maya's map, missing one layer. The basemap is down; now add the layer that places **one circle per shop** at its coordinates, reading position from the `lon` and `lat` columns with the `~column` formula. Fill in the blank with the layer that adds those markers.

```r
# leaflet is loaded; shops has lon and lat columns
leaflet(shops) |>
  addTiles() |>
  ____(lng = ~lon, lat = ~lat, popup = ~name)
```
::check {"regex":"add(Circle)?Markers","gate":true,"difficulty":"intermediate","ok":"Yes. addCircleMarkers() (or addMarkers() for the classic pin) places one marker per row at the lng/lat you point it to. The ~lon formula pulls the longitude column, and popup = ~name shows the shop name when the circle is clicked.","no":"You need the layer that adds a marker for each row. Use addCircleMarkers() (a circle per shop) or addMarkers() (a pin). Type addCircleMarkers in the blank."}
::solution
```r-static
library(leaflet)
leaflet(shops) |>
  addTiles() |>
  addCircleMarkers(lng = ~lon, lat = ~lat, popup = ~name)
```

=== step === quiz
::eyebrow Check yourself
## When NOT to make it interactive

Maya's accountant asks for the revenue chart inside a **printed PDF** report that goes to the bank, the kind that gets printed on paper. Maya is tempted to drop in her shiny new `ggplotly()` chart. What should she actually send?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The ggplotly() chart: interactive is always the better, more modern choice ::no Interactive is not automatically better; it is better only where someone can interact. Hover and zoom do nothing on paper, and the htmlwidget needs a browser to even render.
- A static ggplot saved as an image: an interactive htmlwidget needs a browser, so its hover and zoom are useless (and invisible) in a printed PDF ::ok Exactly. plotly and leaflet are htmlwidgets that live in a browser. For print, a clean static ggplot is the right tool; match the chart to where it will be read.
- Either one, since a PDF can show the hover tooltips when printed ::no A printed page is frozen, there is no cursor to hover and no browser running the widget. The interactivity is simply lost, so a static chart is the honest choice.

=== step === concept
::eyebrow Choosing well
## Interactive or static? Pick by destination

Interactivity is a tool, not an upgrade you always apply. The right question is never "can I make this interactive?" but "**where will this chart be read, and by whom?**" Match the chart to its home:

| Where it lives | Best choice | Why |
|---|---|---|
| A web page, an HTML report, a Quarto dashboard | Interactive (plotly / leaflet) | Hover and zoom work; the reader can explore |
| A printed PDF, a slide, a paper, a journal | Static ggplot | No cursor, no browser, so interactivity is lost |
| A dataset with thousands of points or markers | Static, or interactive with care | Thousands of markers can slow the browser; cluster them or summarise first |
| Anywhere accessibility matters | Never hide essential facts behind hover alone | Hover is invisible to keyboard, screen-reader and touch users |

Two more honest limits worth carrying:

- **File size.** An htmlwidget embeds its own JavaScript, so an interactive HTML file is heavier than a static PNG. Fine for one dashboard; think twice before putting fifty on one page.
- **Performance.** A leaflet map with thousands of markers, or a plotly chart with huge traces, can lag. The fix is to thin the data first: cluster nearby markers, or aggregate before you plot.

[NOTE]
The skill is not "always interactive" or "always static." It is reading the situation: an explorable web dashboard for Maya at her desk, a clean static chart for the bank's printed report. Same data, different destination, different tool.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Interactive web-based data visualization with R, plotly, and shiny (the plotly-R book)](https://plotly-r.com/) - Carson Sievert's free book, the definitive guide to `ggplotly()`, `plot_ly()` and tooltips.
- [plotly for R: the official getting-started reference](https://plotly.com/r/) - worked examples for every chart type, the canonical docs for the package you used here.
- [leaflet for R: the official documentation](https://rstudio.github.io/leaflet/) - tiles, markers, popups and `~` formulas, with a gallery, from the team that maintains the package.
- [htmlwidgets for R](https://www.htmlwidgets.org/) - the framework underneath both plotly and leaflet; read this to understand why they render to HTML, not the console.

=== step === complete
## Lesson 1 complete

You can now make a chart talk back. You saw exactly what interactivity adds (hover for the precise value and identity, zoom and pan to explore), turned a plain ggplot interactive with a single `ggplotly()` wrap, met the from-scratch `plot_ly()` and its `~column` formula, and put Maya's six shops on a **leaflet** map with `addTiles()` and `addCircleMarkers()`. Just as important, you learned to stop and ask *where will this be read?*, sending an explorable chart to the web and a clean static one to print.

Next, Lesson 2: **Quarto dashboards and linked views**. A single interactive chart is one tile; a dashboard arranges many of them into a layout, and **links** them so that selecting a shop in one view filters every other view at once, the responsiveness you felt on this lesson's cover, built for real.
