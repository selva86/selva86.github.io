---
title: "Advanced ggplot2 Lesson 3: Annotate and Compose Plots"
description: "Make a ggplot explain itself: reference lines and annotate() callouts, non-overlapping labels with ggrepel, and stitching several plots into one figure with patchwork."
keywords: "ggplot2 annotate, geom_hline, reference line, ggrepel, geom_text_repel, patchwork, compose plots, annotate plot in R, ggplot2 tutorial"
post_type: "LESSON"
curriculum_id: "2.5.3"
webr: true
mathjax: false
lesson_access: "free"
course_id: "da-ggplot2-adv"
course_title: "Advanced ggplot2"
course_lesson: "3"
course_total: "3"
course_landing: "Advanced-ggplot2-Course.html"
course_next: ""
course_prev: "Themes-Color-and-Accessibility.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## Make the chart explain itself

In Lessons 1 and 2, Maya the baker took her three branches, **Downtown**, **Riverside** and the big **Airport** shop, split the crowded chart into small multiples, and restyled it with a clean theme and colourblind-safe colours. The chart is readable and on-brand. Now she has to *present* it: on Friday she pitches two investors, and a chart that needs her standing beside it to explain it is a chart that fails the moment she sits down.

This lesson is about making a plot speak for itself, then stitching several plots into one figure. Three moves: **mark** the values that matter with reference lines and notes, **label** the points so each one is named, and **compose** several charts into a single slide. The scatter below is Maya's raw canvas, foot traffic against revenue for all three branches. By the end you will turn it, and its siblings, into a briefing.

By the end of this lesson you will be able to:

- Add reference lines and free-floating notes with `geom_hline()` and `annotate()`
- Label crowded points without them overlapping, using `ggrepel`
- Stitch several plots into one captioned figure with `patchwork`

**Prerequisites:** you can build a basic ggplot and map a column inside `aes()`, `ggplot(data, aes(...)) + geom_*()` (from [Data Visualization with ggplot2](ggplot2-Course.html), and Lessons 1 and 2 of this course, [Facets and Scales](Facets-and-Scales-in-ggplot2.html) and [Themes, Colour and Accessibility](Themes-Color-and-Accessibility.html)). Every new function is defined as it appears.

::widget chart-plotter {"data":[{"x":150,"y":300,"fill":"Downtown"},{"x":165,"y":330,"fill":"Downtown"},{"x":180,"y":360,"fill":"Downtown"},{"x":205,"y":430,"fill":"Downtown"},{"x":240,"y":520,"fill":"Downtown"},{"x":300,"y":690,"fill":"Downtown"},{"x":260,"y":600,"fill":"Downtown"},{"x":95,"y":190,"fill":"Riverside"},{"x":110,"y":210,"fill":"Riverside"},{"x":120,"y":240,"fill":"Riverside"},{"x":140,"y":280,"fill":"Riverside"},{"x":175,"y":360,"fill":"Riverside"},{"x":220,"y":470,"fill":"Riverside"},{"x":190,"y":410,"fill":"Riverside"},{"x":520,"y":2100,"fill":"Airport"},{"x":560,"y":2300,"fill":"Airport"},{"x":610,"y":2520,"fill":"Airport"},{"x":680,"y":2900,"fill":"Airport"},{"x":760,"y":3300,"fill":"Airport"},{"x":980,"y":4200,"fill":"Airport"},{"x":880,"y":3700,"fill":"Airport"}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(sales, aes(foot_traffic, revenue, colour = branch)) +\n  geom_point()"}}

=== step === concept
::eyebrow The idea
## Two kinds of layer: encode, and explain

Every ggplot you have built so far is made of **geoms**, layers that turn rows of data into ink: `geom_point()` puts a dot at each row, `geom_line()` connects them. An **annotation** is a different kind of layer. It does not read your data row by row; it draws a fixed mark at a position *you* name: a horizontal target line, a note, a circle around one point. Geoms answer "what does the data say"; annotations answer "what should the reader notice".

Each lesson starts in a fresh R session, so let us put Maya's week back on the page. Run this block once and the rest of the lesson builds on it:

```r
library(ggplot2)

days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
# One row per branch per day: 3 branches x 7 days = 21 rows.
sales <- data.frame(
  branch       = rep(c("Downtown", "Riverside", "Airport"), each = 7),
  day          = factor(rep(days, times = 3), levels = days),
  foot_traffic = c(150, 165, 180, 205, 240, 300, 260,    # Downtown
                   95, 110, 120, 140, 175, 220, 190,     # Riverside
                   520, 560, 610, 680, 760, 980, 880),   # Airport
  revenue      = c(300, 330, 360, 430, 520, 690, 600,    # Downtown
                   190, 210, 240, 280, 360, 470, 410,    # Riverside
                   2100, 2300, 2520, 2900, 3300, 4200, 3700)  # Airport
)

# Pull out one branch's week and draw it plainly, no explanation yet.
downtown <- subset(sales, branch == "Downtown")
# group = 1 tells geom_line to join all 7 days into one line; without it,
# a categorical x-axis (the day names) leaves the points unconnected.
ggplot(downtown, aes(day, revenue, group = 1)) +
  geom_line(colour = "#1f7a55", linewidth = 1) +
  geom_point(size = 2)
```

That is Downtown's daily revenue, a clean line. But it says nothing about what *matters*: what counts as a good day, where the break-even line sits, which day was best. Those are exactly the things an annotation layer adds.

=== step === concept
::eyebrow Move 1: mark
## Reference lines: draw a line where it matters

The simplest annotation is a straight line at a value you care about. Say Maya needs each branch to clear **$400 of revenue a day** just to cover rent and staff: that is her break-even. A reference line drawn straight across at 400 lets a reader see, instantly, which days cleared the bar.

ggplot gives you three reference-line layers:

- `geom_hline(yintercept = v)` draws a **h**orizontal line at height `v`
- `geom_vline(xintercept = v)` draws a **v**ertical line at position `v`
- `geom_abline(slope = m, intercept = b)` draws a sloped line, for a trend or a y = x reference

Notice the argument is a single number, not a column: `yintercept = 400`, not `aes(yintercept = something)`. That is the tell of an annotation, you hand it the literal position. Add the break-even line to Downtown's week:

```r
ggplot(downtown, aes(day, revenue, group = 1)) +
  geom_line(colour = "#1f7a55", linewidth = 1) +
  geom_point(size = 2) +
  geom_hline(yintercept = 400, linetype = "dashed", colour = "red")
```

Now the chart has a meaning it did not before: every point above the dashed red line is a day that paid for itself. Downtown crosses it on Thursday and stays above through the weekend.

[KEY INSIGHT]
A reference line is an annotation: you pass it a literal position (`yintercept = 400`), not a data column. It draws the same line no matter how many rows your data has, and it never appears in the legend.

=== step === tryit
::eyebrow Your turn
## Draw the break-even line

Here is Downtown's week again, without the target line. Add the layer that draws a horizontal reference line at Maya's break-even of **400**.

```r
ggplot(downtown, aes(day, revenue, group = 1)) +
  geom_line(colour = "#1f7a55", linewidth = 1) +
  geom_point(size = 2) +
  ____
```
::check {"regex":"geom_hline\\s*[(][^)]*400","gate":true,"difficulty":"beginner","ok":"That is it: geom_hline(yintercept = 400) draws one horizontal line at 400, a fixed-position annotation, not a data mapping.","no":"Add a horizontal reference line: geom_hline(yintercept = 400). The argument is a literal number, not an aes() mapping."}
::solution
```r
ggplot(downtown, aes(day, revenue, group = 1)) +
  geom_line(colour = "#1f7a55", linewidth = 1) +
  geom_point(size = 2) +
  geom_hline(yintercept = 400, linetype = "dashed", colour = "red")
```

=== step === concept
::eyebrow Move 1 continued
## annotate(): a note exactly where you want it

A line marks a value; sometimes you want **words**. `annotate()` drops text, a point, a segment or a box at coordinates you specify. Its first argument is the kind of mark, then the position, then the content:

- `annotate("text", x = , y = , label = )` writes text at the point `(x, y)`
- `annotate("point", x = , y = )` adds a single marker
- `annotate("rect", xmin = , xmax = , ymin = , ymax = )` shades a region

Because the x-axis here is the day (a category), its positions are numbered left to right: Mon is 1, Tue is 2, on up to Sun at 7. So `x = 6` lands on Saturday. Let us label the break-even line and circle the best day:

```r
ggplot(downtown, aes(day, revenue, group = 1)) +
  geom_line(colour = "#1f7a55", linewidth = 1) +
  geom_point(size = 2) +
  geom_hline(yintercept = 400, linetype = "dashed", colour = "red") +
  annotate("text", x = 2, y = 430, label = "Break-even target",
           colour = "red", hjust = 0, size = 3.5) +
  annotate("point", x = 6, y = 690, shape = 21, size = 6,
           colour = "black", fill = NA) +
  annotate("text", x = 6, y = 690, label = "Best day",
           fontface = "bold", vjust = -1.4)
```

The crucial thing: none of those marks came from a row of `sales`. You typed the positions yourself. That is what separates an annotation from a geom, and it has consequences.

[NOTE]
An annotation is drawn once, at literal coordinates, so it does **not** get a legend entry, and it repeats identically on every panel if you facet. A geom mapped through `aes()` draws one mark per row and earns a legend. Use `annotate()` for "say this, here"; use a geom for "show every row".

=== step === quiz
::eyebrow Check yourself
## One line, two ways

Maya wants a single horizontal target line at $400 on her chart. A colleague suggests: "add a new column to `sales` that is 400 in every row, then map it with `aes(yintercept = target)`." What is the better approach, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The colleague is right: every line must be mapped through aes() from a column ::no That works, but it is the wrong tool. A column of 400s is the same number 21 times; mapping it makes ggplot treat a fixed value as if it were data, and it can add a stray legend entry.
- Use `geom_hline(yintercept = 400)`: the target is one fixed value you are asserting, so it belongs in an annotation, not in the data or an aes() mapping ::ok Exactly. A break-even of 400 is a constant you chose, not a measurement in your rows. geom_hline takes the literal number, draws one line, and stays out of the legend.
- Neither: you cannot draw a horizontal line in ggplot without first adding it to the data ::no You can, and should. `geom_hline(yintercept = 400)` needs nothing added to the data; that is the whole point of an annotation layer.

=== step === concept
::eyebrow Move 2: label
## ggrepel: labels that do not pile up

Maya now wants to label points directly, so a reader does not have to trace each dot back to the legend. The obvious tool is `geom_text(aes(label = day))`, which writes each point's label right at the point. It works beautifully when points are spread out, and falls apart when they are not. Map the day onto all 21 points and the busy lower-left corner, where Downtown and Riverside crowd together, turns into an unreadable pile:

```r
library(ggrepel)

# Plain text labels: fine where points are sparse, a mess where they crowd.
ggplot(sales, aes(foot_traffic, revenue, colour = branch, label = day)) +
  geom_point(size = 2) +
  geom_text(size = 3)
```

The `ggrepel` package fixes exactly this. Swap `geom_text()` for `geom_text_repel()` (or `geom_label_repel()` for boxed labels) and it nudges every label away from its neighbours, drawing a thin connector segment back to the point it belongs to:

```r
ggplot(sales, aes(foot_traffic, revenue, colour = branch, label = day)) +
  geom_point(size = 2) +
  geom_text_repel(size = 3, seed = 1) +
  theme(legend.position = "bottom")
```

Every label is now legible and still tied to its point. The `seed = 1` argument fixes the random nudging so the layout comes out the same every time you run it.

[WARNING]
`ggrepel` places labels with a small random search, so without `seed = ` the positions shift a little on every redraw. Set a seed for a reproducible figure. And repel has limits: a few dozen labels are fine, but try to label hundreds of dense points and even repel runs out of room. Then, label only the few points that matter.

=== step === tryit
::eyebrow Your turn
## Un-pile the labels

Here is the crowded scatter with plain `geom_text()`, where the labels collide. Replace the missing layer with the `ggrepel` version that spreads them out with connector lines.

```r
ggplot(sales, aes(foot_traffic, revenue, colour = branch, label = day)) +
  geom_point(size = 2) +
  ____
```
::check {"regex":"geom_(?:text|label)_repel\\s*[(]","gate":true,"difficulty":"intermediate","ok":"That is it: geom_text_repel() nudges the labels apart and draws connectors, so the crowded corner becomes readable.","no":"Use the ggrepel layer: geom_text_repel(...) (or geom_label_repel(...)). It repels overlapping labels and links each back to its point."}
::solution
```r
ggplot(sales, aes(foot_traffic, revenue, colour = branch, label = day)) +
  geom_point(size = 2) +
  geom_text_repel(size = 3, seed = 1)
```

=== step === concept
::eyebrow Move 3: compose
## patchwork: many plots, one figure

Maya's slide needs two charts together: revenue by day, and foot traffic by day, side by side, so the investors can see that more visitors track with more money. Saving two images and pasting them into the slide by hand is fiddly and breaks the moment the data changes. The `patchwork` package lets you combine ggplots with simple arithmetic, as if the plots were numbers.

First build the two plots and store each in a variable:

```r
library(patchwork)

p_rev <- ggplot(sales, aes(day, revenue, colour = branch, group = branch)) +
  geom_line(linewidth = 1) +
  labs(title = "Revenue by day", x = NULL, y = "Revenue ($)")

p_traffic <- ggplot(sales, aes(day, foot_traffic, colour = branch, group = branch)) +
  geom_line(linewidth = 1) +
  labs(title = "Foot traffic by day", x = NULL, y = "People")

p_rev + p_traffic     # the + operator lays them side by side
```

Three operators do the layout, and the flow on the right summarises them:

- `p1 + p2` (or `p1 | p2`) places plots **beside** each other in a row
- `p1 / p2` **stacks** one above the other
- wrap a group in `()` to nest, for example `(p1 + p2) / p3`

Then two finishing functions polish the whole figure at once. `plot_layout(guides = "collect")` gathers the repeated legends into a single shared legend, and `plot_annotation()` adds an overall title and automatic panel tags (A, B, C):

```r
(p_rev / p_traffic) +
  plot_layout(guides = "collect") +
  plot_annotation(
    title = "Maya's week, three branches",
    tag_levels = "A"
  )
```

That single object is now one captioned figure: two stacked panels, one shared legend, an overall title, and an A and a B tag on the panels, ready to drop straight onto a slide.

::widget process-flow {"steps":[{"title":"Beside: p1 + p2","sub":"place plots in a row, left to right"},{"title":"Stack: p1 / p2","sub":"put one plot above another"},{"title":"Finish: plot_annotation()","sub":"one shared title plus auto A, B tags"}]}

=== step === quiz
::eyebrow Check yourself
## Stack them, do not line them up

For her slide, Maya wants the revenue chart **directly above** the foot-traffic chart, one on top of the other, so the days line up vertically. She has `p_rev` and `p_traffic`. Which patchwork expression does that?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- `p_rev + p_traffic` ::no The `+` operator places plots beside each other in a row, not stacked. That gives two panels left and right, not top and bottom.
- `p_rev | p_traffic` ::no The `|` operator also lays plots side by side, the same row layout as `+`. You want vertical stacking instead.
- `p_rev / p_traffic` ::ok Exactly. The `/` operator stacks plots vertically, `p_rev` on top and `p_traffic` below, so the day axes line up underneath each other.
- `p_rev * p_traffic` ::no There is no `*` compose operator. To stack, use `/`; to go side by side, use `+` or `|`.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [patchwork: the official site](https://patchwork.data-imaginist.com/) - every way to assemble, nest and annotate a multi-plot figure, by the package author.
- [ggrepel documentation and examples](https://ggrepel.slowkow.com/) - the full gallery of repelled-label options, including the seed and label-box controls.
- [ggplot2 reference: annotate()](https://ggplot2.tidyverse.org/reference/annotate.html) - the exact arguments for text, point, segment and rect annotations.
- [ggplot2 reference: geom_abline, geom_hline and geom_vline](https://ggplot2.tidyverse.org/reference/geom_abline.html) - the three reference-line layers in one place.
- [R Graphics Cookbook: Annotations chapter (free online)](https://r-graphics.org/chapter-annotate) - a recipe-style tour of annotating ggplots, with worked examples.

=== step === complete
## Lesson 3 complete, and the course

You took a plain chart and made it brief its reader, four moves and no new data: `geom_hline()` to mark a threshold, `annotate()` to drop a note or marker at coordinates you choose, `ggrepel` to label crowded points without the pile-up, and `patchwork` to compose several plots into one captioned figure with a shared legend.

That closes **Advanced ggplot2**. Across the three lessons you learned to break a crowded chart into small multiples and control its scales (Lesson 1), restyle it with deliberate, accessible colour and reusable themes (Lesson 2), and now make it explain itself and stand on a slide. Those are the moves that turn a correct chart into a convincing one. Take them back to your own data, and revisit the [course landing](Advanced-ggplot2-Course.html) any time for a refresher.
