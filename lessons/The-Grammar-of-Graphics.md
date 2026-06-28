---
title: "ggplot2 Lesson 1: The Grammar of Graphics"
catalog_blurb: "Build any chart from data, aesthetics and layers."
description: "The grammar of graphics behind ggplot2: build a chart from data, aesthetic mappings and geoms, one layer at a time, and learn to read ggplot code as a language."
keywords: "ggplot2, grammar of graphics, aesthetic mapping, aes, geom, ggplot layers, data visualization in R, ggplot2 tutorial, build a plot in R"
post_type: "LESSON"
curriculum_id: "2.4.1"
webr: true
lesson_access: "free"
course_id: "da-ggplot"
course_title: "Data Visualization with ggplot2"
course_lesson: "1"
course_total: "4"
course_landing: "ggplot2-Course.html"
course_next: "Scatter-and-Line-Charts-in-ggplot2.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 4
## The Grammar of Graphics
Maya runs a small neighbourhood bakery, and by now she can wrangle her till data and summarise it: last week she pulled seven rows, one per day, each with the **foot traffic** (people who walked in) and the **revenue** (dollars taken). But a column of seven numbers does not show her what is going on. The moment she draws it, the story jumps out: busier days take more money, and Saturday towers over the rest.

That picture below is a `ggplot`. By the end of this lesson you will understand the small set of rules, the *grammar*, that builds it, and every other chart in this course.

By the end you will be able to:

- Name the three core parts of every ggplot: the **data**, the **aesthetic mappings**, and the **geoms**
- Build a plot in R by stacking `ggplot(data)` + `aes()` + a geom, one layer at a time with `+`
- Read ggplot code as a sentence, and swap one word to get a different chart

**Prerequisites:** you can run R and load a package with `library()`, and you have a data frame in hand (you built one in the [dplyr](Data-Wrangling-dplyr-Course.html) and [EDA](EDA-Course.html) sections). Every plotting term is defined as it appears.

::widget chart-plotter {"data":[{"x":110,"y":340},{"x":125,"y":380},{"x":130,"y":400},{"x":150,"y":455},{"x":185,"y":560},{"x":240,"y":720},{"x":205,"y":610}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

=== step === concept
::eyebrow The big idea
## Why "grammar"?

English has a handful of grammar rules, a subject, a verb, an object, and from them you build endless different sentences. The **grammar of graphics** is the same idea for charts: a small set of parts that combine to describe almost any plot you can imagine. ggplot2 is R's implementation of it, which is why a scatterplot, a line chart and a bar chart all read almost the same in code.

Three parts do most of the work, and you assemble them in **layers**, stacked one on top of the next with a `+`:

- **Data** - the data frame you want to picture (Maya's week).
- **Aesthetic mappings** - rules that connect a *column* to a *visual channel*: which column goes on the x axis, which on the y axis, which controls colour.
- **Geoms** - the geometric objects that actually draw the data: points, lines, bars.

Hold those three in mind; the rest of the lesson adds them one at a time.

::widget process-flow {"steps":[{"title":"Data","sub":"the data frame you want to picture (the bakery week)"},{"title":"Aesthetic mapping","sub":"connect a column to a visual channel: x, y, colour, size"},{"title":"Geom","sub":"the shape that draws it: points, lines, bars"}]}

=== step === concept
::eyebrow Layer 1
## Start with the data

Every plot is built on a data frame, so that is where the grammar starts. Each lesson runs in a fresh R session, so let us build Maya's trading week right here (run this once):

```r
library(ggplot2)
bakery <- data.frame(
  day          = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
  day_num      = 1:7,
  foot_traffic = c(110, 125, 130, 150, 185, 240, 205),  # people in the door
  revenue      = c(340, 380, 400, 455, 560, 720, 610),  # dollars taken
  day_type     = c("weekday", "weekday", "weekday", "weekday", "weekday",
                   "weekend", "weekend")
)
bakery
#>   day day_num foot_traffic revenue day_type
#> 1 Mon       1          110     340  weekday
#> 2 Tue       2          125     380  weekday
#> 3 Wed       3          130     400  weekday
#> 4 Thu       4          150     455  weekday
#> 5 Fri       5          185     560  weekday
#> 6 Sat       6          240     720  weekend
#> 7 Sun       7          205     610  weekend
```

The first layer is just the data. Hand it to `ggplot()` and you get a blank canvas: ggplot now knows your data, but you have not told it *what* to map or *how* to draw, so there is nothing on the panel yet.

```r
ggplot(bakery)   # a blank canvas: data is known, nothing is mapped or drawn
```

That empty grey panel is the foundation every later layer paints onto.

=== step === concept
::eyebrow Layer 2
## The aesthetic mapping

Here is the heart of the grammar. An **aesthetic mapping** is a rule that connects one **column** of your data to one **visual channel** of the plot: x position, y position, colour, size, or shape. You write it inside `aes()`.

Maya wants foot traffic along the bottom and revenue up the side, so she maps `foot_traffic` to `x` and `revenue` to `y`:

```r
ggplot(bakery, aes(x = foot_traffic, y = revenue))
```

Run it and something changes: the axes now read 110 to 240 across and 340 to 720 up, scaled to her actual numbers. But there are still **no dots**. That is the key idea to hold onto: the mapping says *what goes where*, not *how to draw it*. You have set the stage; nothing has stepped onto it yet.

[NOTE]
"Aesthetic" here does not mean "pretty." In the grammar of graphics it means a visual property the eye can read, a position, a colour, a size, that a data column can be mapped onto.

=== step === concept
::eyebrow Layer 3
## The geom draws it

To actually draw the marks you add a **geom**, short for *geometric object*: the shape that turns mapped data into something you can see. `geom_point()` draws one point per row, placed at that row's (x, y). You add it to the mapping with a `+`:

```r
ggplot(bakery, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 3, colour = "steelblue")
```

Now the seven days appear, climbing from lower-left to upper-right, exactly the scatter from the cover. Data, then a mapping, then a geom: that is a complete plot.

The `+` is not arithmetic, it **adds a layer**, and you can keep stacking. Add a straight-line trend as a second layer on the very same data and mapping:

```r
ggplot(bakery, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 3, colour = "steelblue") +
  geom_smooth(method = "lm", se = FALSE)   # second layer: a straight-line ("lm") trend, no shaded error band ("se = FALSE")
```

[KEY INSIGHT]
Every ggplot is `ggplot(data, aes(...))` with one or more geoms added by `+`. Reading it back: "take this data, map these columns to these channels, and draw them with these geoms." Master that one sentence and you can read any ggplot.

::widget chart-plotter {"data":[{"x":110,"y":340},{"x":125,"y":380},{"x":130,"y":400},{"x":150,"y":455},{"x":185,"y":560},{"x":240,"y":720},{"x":205,"y":610}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue)) +\n  geom_point()"}}

=== step === quiz
::eyebrow Check yourself
## Axes, but no dots

Maya runs `ggplot(bakery, aes(x = foot_traffic, y = revenue))` and sees a panel with correctly scaled axes, but not a single point on it. What did she forget?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- She has not added a geom yet: the mapping sets up the axes, but a geom like `geom_point()` is what draws the marks ::ok Exactly. Data plus a mapping builds the stage; the geom is the layer that actually draws. Add `+ geom_point()` and the dots appear.
- Her data frame is empty, so there is nothing to plot ::no The axes scaled to 110-240 and 340-720, which they could only do by reading real values from `bakery`. The data is there; the missing piece is the geom that draws it.
- The aesthetic mapping is wrong and needs `colour` as well as `x` and `y` ::no `aes(x, y)` is a perfectly complete mapping for a scatter. Colour is optional. What is missing is a geom, the layer that turns the mapping into marks.

=== step === widget
::eyebrow The grammar's payoff
## Same recipe, swap one part

Because a plot is just parts in layers, you can change **one** part and get a different chart from the very same data. Below is Maya's revenue across the seven days, with the same data and the same x/y mapping every time. Only the **geom** changes. Click between them and watch the ggplot code change by exactly one verb: `geom_line()`, `geom_col()`, `geom_point()`.

::widget chart-plotter {"data":[{"x":1,"y":340},{"x":2,"y":380},{"x":3,"y":400},{"x":4,"y":455},{"x":5,"y":560},{"x":6,"y":720},{"x":7,"y":610}],"geoms":["line","bar","point"],"x":"day","y":"revenue","code":{"line":"ggplot(bakery, aes(day_num, revenue)) +\n  geom_line()","bar":"ggplot(bakery, aes(day, revenue)) +\n  geom_col()","point":"ggplot(bakery, aes(day_num, revenue)) +\n  geom_point()"}}

A line traces the trend across the week, bars compare the days side by side, points mark each value. Same grammar, three answers to three different questions, one word apart.

=== step === concept
::eyebrow A common trap
## Mapping a column vs setting a constant

There is one distinction that trips up almost everyone, and it is worth getting straight now. Putting something **inside** `aes()` *maps* it to a column; putting it **outside** `aes()`, directly in the geom, *sets* it to one fixed value.

Map colour to a column and ggplot gives each group its own colour and a legend to match. Here Maya colours by `day_type`, and the two weekend days light up apart from the five weekdays:

```r
ggplot(bakery, aes(x = foot_traffic, y = revenue, colour = day_type)) +
  geom_point(size = 3)
```

Set colour as a constant instead, outside `aes()`, and every point is the same fixed colour with no legend, because nothing was mapped:

```r
ggplot(bakery, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 3, colour = "steelblue")
```

[KEY INSIGHT]
Inside `aes()` = mapped to data (varies by column, earns a legend). Outside `aes()` = a constant you set by hand (one fixed value for every mark). "Does this depend on the data?" decides which side of `aes()` it goes.

::widget chart-plotter {"data":[{"x":110,"y":340,"fill":"weekday"},{"x":125,"y":380,"fill":"weekday"},{"x":130,"y":400,"fill":"weekday"},{"x":150,"y":455,"fill":"weekday"},{"x":185,"y":560,"fill":"weekday"},{"x":240,"y":720,"fill":"weekend"},{"x":205,"y":610,"fill":"weekend"}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(bakery, aes(foot_traffic, revenue, colour = day_type)) +\n  geom_point()"}}

=== step === quiz
::eyebrow Check yourself
## Inside or outside aes()?

Maya wants **every** dot drawn in the same fixed blue, no grouping, no legend. Where should `colour = "steelblue"` go?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Inside `aes()`, as `aes(x = foot_traffic, y = revenue, colour = "steelblue")` ::no That *maps* colour to the literal text "steelblue" as if it were a category, so ggplot picks its own colour for that one group and adds a legend, not at all what she wanted. Anything inside `aes()` is treated as data to map.
- Outside `aes()`, in the geom: `geom_point(colour = "steelblue")` ::ok Right. A constant you want applied to every mark goes in the geom, outside `aes()`. It is set, not mapped, so there is no legend and all points share the one fixed colour.
- It does not matter; both put the points in steelblue ::no They give genuinely different results. Outside `aes()` sets one fixed colour for all points; inside `aes()` maps colour to data and triggers a legend with a colour ggplot chooses. The placement is the whole point.

=== step === tryit
::eyebrow Your turn
## Finish the plot

You have the mapping; add the layer that draws the marks. Complete this scatter of Maya's revenue against foot traffic with the geom that draws one point per row.

```r
ggplot(bakery, aes(x = foot_traffic, y = revenue)) +
  ____
```
::check {"regex":"geom_point","gate":true,"difficulty":"beginner","ok":"That is a complete ggplot: data, a mapping, and a geom to draw it. The seven days appear as points.","no":"Add the points geom: geom_point(). It draws one point per row at its (x, y)."}
::solution
```r
ggplot(bakery, aes(x = foot_traffic, y = revenue)) +
  geom_point()
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [ggplot2: Elegant Graphics for Data Analysis (3rd ed, free online)](https://ggplot2-book.org/) - the canonical book; its opening chapters lay out the grammar you just met, by the package's author.
- [Wickham (2010), A Layered Grammar of Graphics](https://vita.had.co.nz/papers/layered-grammar.html) - the paper that defines the layered grammar ggplot2 implements; short and very readable.
- [R for Data Science (2e): Data visualisation](https://r4ds.hadley.nz/data-visualize) - the gentlest hands-on tour of `ggplot()`, `aes()` and geoms, with exercises.
- [ggplot2 package documentation](https://ggplot2.tidyverse.org/) - the reference for every geom, aesthetic and scale, plus the one-page cheatsheet.

=== step === complete
## Lesson 1 complete

You can now read a ggplot as a sentence. Every chart in this course is the same three parts in layers: the **data**, the **aesthetic mappings** that connect columns to visual channels inside `aes()`, and the **geoms** added with `+` that draw the marks. You built one up layer by layer, watched the same data become a line, bars and points by swapping a single geom, and learned the trap that catches beginners, mapping inside `aes()` versus setting a constant outside it.

Next, Lesson 2: Scatter and line charts in ggplot2. You will take `geom_point()` and `geom_line()` further, map a third variable to colour and size, and add a trend line that summarises the whole cloud, the workhorses you will reach for most.
