---
title: "Advanced ggplot2 Lesson 1: Facets and Scales"
description: "Split one crowded chart into small multiples with facet_wrap and facet_grid, choose fixed vs free scales honestly, and bend axes, guides and legends to your will."
keywords: "facet_wrap, facet_grid, small multiples, ggplot2 scales, free scales, scale_y_log10, ggplot legend, guides, facets in R, ggplot2 tutorial"
post_type: "LESSON"
curriculum_id: "2.5.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-ggplot2-adv"
course_title: "Advanced ggplot2"
course_lesson: "1"
course_total: "3"
course_landing: "Advanced-ggplot2-Course.html"
course_next: "Themes-Color-and-Accessibility.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 3
## One chart per group

Maya the neighbourhood baker did well enough to open two more branches. She now runs three: **Downtown**, **Riverside**, and the new one inside the **Airport**. Each branch logs the same two numbers every day, the **foot traffic** (people who walked in) and the **revenue** (dollars taken). When she draws all three branches on one chart, it turns into a tangle: the Airport branch is so much bigger that the other two flatten into the floor.

The fix is one of the most useful moves in all of data visualization: stop forcing every group onto one panel, and give each group its **own little chart**. Below is exactly that, the same data as one chart, then split into small multiples. Flip the toggle.

By the end of this lesson you will be able to:

- Say when small multiples beat cramming every group into one panel, and what `facet_wrap(~ var)` does
- Split a plot into one panel per group with `facet_wrap()`, and one panel per combination with `facet_grid()`
- Choose fixed vs free panel scales without misleading your reader, and bend the axis, guides and legend to your will

**Prerequisites:** you can build a basic ggplot and map a column to colour, `ggplot(data, aes(...)) + geom_*()` (from [Data Visualization with ggplot2](ggplot2-Course.html), especially [the grammar of graphics](The-Grammar-of-Graphics.html)). Every new function is defined as it appears.

::widget facet-grid {"data":[{"x":150,"y":300,"facet":"Downtown"},{"x":165,"y":330,"facet":"Downtown"},{"x":180,"y":360,"facet":"Downtown"},{"x":210,"y":430,"facet":"Downtown"},{"x":95,"y":190,"facet":"Riverside"},{"x":110,"y":210,"facet":"Riverside"},{"x":120,"y":240,"facet":"Riverside"},{"x":140,"y":280,"facet":"Riverside"},{"x":520,"y":2100,"facet":"Airport"},{"x":560,"y":2300,"facet":"Airport"},{"x":610,"y":2520,"facet":"Airport"},{"x":700,"y":2950,"facet":"Airport"}],"geom":"point","x":"foot_traffic","y":"revenue","facetVar":"branch"}

=== step === concept
::eyebrow The problem
## When one panel has too many stories

Let us put Maya's three branches into this fresh R session. Each lesson starts clean, so the data lives right here on the page, run this block once and the rest of the lesson builds on it:

```r
library(ggplot2)

set.seed(1)
days <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
# One row per branch per day: 3 branches x 7 days = 21 rows.
# Airport is a much bigger shop, so its revenue dwarfs the other two.
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
head(sales)
#>     branch day foot_traffic revenue
#> 1 Downtown Mon          150     300
#> 2 Downtown Tue          165     330
#> 3 Downtown Wed          180     360
#> 4 Downtown Thu          205     430
#> 5 Downtown Fri          240     520
#> 6 Downtown Sat          300     690
```

The instinct is to map `branch` to colour and draw all 21 points on one panel. Try it and you hit a wall: Airport's revenue runs into the thousands while Riverside barely clears a few hundred, so the shared y-axis stretches to fit Airport and crushes the other two branches into a flat band at the bottom. Worse, the points pile on top of each other (that is **overplotting**), so even the colours cannot rescue it. The widget below is that crowded one-panel chart, three branches, one squashed scale.

::widget chart-plotter {"data":[{"x":150,"y":300,"fill":"Downtown"},{"x":240,"y":520,"fill":"Downtown"},{"x":300,"y":690,"fill":"Downtown"},{"x":95,"y":190,"fill":"Riverside"},{"x":175,"y":360,"fill":"Riverside"},{"x":220,"y":470,"fill":"Riverside"},{"x":520,"y":2100,"fill":"Airport"},{"x":760,"y":3300,"fill":"Airport"},{"x":980,"y":4200,"fill":"Airport"}],"geoms":["point"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(sales, aes(foot_traffic, revenue, colour = branch)) +\n  geom_point()"}}

=== step === concept
::eyebrow The fix
## facet_wrap: one panel per group

Here is the move. Instead of one panel holding every branch, **facet** the plot: ggplot splits it into a grid of small panels, one per group, each drawn the same way. This is what people mean by **small multiples**, the same chart repeated for each slice of the data so your eye can scan across them.

You add it as one more layer with `+`, just like a geom. The argument is a **formula**: `facet_wrap(~ branch)`. The tilde `~` reads as "by", so `~ branch` means "make one panel for each value of `branch`". The leading tilde with nothing before it is just how `facet_wrap` wants a single faceting variable written:

```r
ggplot(sales, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 2) +
  facet_wrap(~ branch)
```

Now each branch gets its own little panel, side by side, and the within-branch pattern (more foot traffic, more revenue) is suddenly easy to read in all three. The toggle below makes the before and after concrete: one combined chart, then `facet_wrap(~ branch)`.

::widget facet-grid {"data":[{"x":150,"y":300,"facet":"Downtown"},{"x":165,"y":330,"facet":"Downtown"},{"x":180,"y":360,"facet":"Downtown"},{"x":210,"y":430,"facet":"Downtown"},{"x":95,"y":190,"facet":"Riverside"},{"x":110,"y":210,"facet":"Riverside"},{"x":120,"y":240,"facet":"Riverside"},{"x":140,"y":280,"facet":"Riverside"},{"x":520,"y":2100,"facet":"Airport"},{"x":560,"y":2300,"facet":"Airport"},{"x":610,"y":2520,"facet":"Airport"},{"x":700,"y":2950,"facet":"Airport"}],"geom":"point","x":"foot_traffic","y":"revenue","facetVar":"branch"}

[KEY INSIGHT]
`facet_wrap(~ var)` draws one panel per level of `var` and *wraps* the panels into a tidy grid. It is the natural answer to "show me this same chart, broken out by group."

The one limit to remember: facets shine for a handful of groups. Facet by a variable with 50 levels and you get 50 thumbnails too small to read. For that many groups, summarise first or facet by a coarser grouping.

=== step === quiz
::eyebrow Check yourself
## Facets or just colour?

Maya already tried colouring the three branches on one panel and it came out as an unreadable squashed tangle. A colleague says "faceting is just colouring by group with extra steps, it will look the same." Is that right?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Yes, `facet_wrap(~ branch)` and `colour = branch` produce the same picture ::no They are genuinely different. Colour keeps every point on one shared panel and one shared scale, so big groups still overplot and squash small ones. Facets give each group its own panel.
- No: facets put each group on its own panel (and by default its own copy of the axes), so the groups stop overlapping, whereas colour leaves them piled on one squashed scale ::ok Exactly. Separate panels are what cure the overplotting and the cramped layout. Colour distinguishes points within a panel; faceting splits them into panels.
- No, because colour can only ever show two groups at once ::no Colour can encode many groups; the real difference is that faceting separates groups into distinct panels, while colour keeps them together on one shared scale.

=== step === concept
::eyebrow Two variables at once
## facet_grid: cross two variables

`facet_wrap` splits by one variable. Sometimes you want to split by **two** at once, laid out as a true matrix: one variable down the rows, another across the columns. That is `facet_grid(rows ~ cols)`, with the row variable on the left of the `~` and the column variable on the right.

Suppose Maya wants to compare weekdays against weekends for each branch. First derive a `part` column on the same `sales` data, then facet branch (rows) by part (columns):

```r
sales$part <- ifelse(sales$day %in% c("Sat", "Sun"), "weekend", "weekday")

ggplot(sales, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 2) +
  facet_grid(branch ~ part)
```

That draws a 3-by-2 grid: three branches down, weekday and weekend across, six panels in all. Reading along a row compares one branch's weekdays to its weekends; reading down a column compares the branches within weekdays or within weekends. One formula, a whole table of little charts.

[NOTE]
`facet_grid(branch ~ part)` makes a panel for **every combination** of the two variables, even empty ones. With 3 branches and 2 parts that is 6 panels; with two big variables the grid can explode, so cross two variables only when you actually want every combination.

=== step === tryit
::eyebrow Your turn
## Split it into small multiples

Maya wants the foot-traffic-vs-revenue scatter broken into one panel per branch. The plot below has the data and the geom, but the faceting layer is missing. Add the layer that draws one panel per `branch`.

```r
ggplot(sales, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 2) +
  ____
```
::check {"regex":"facet_wrap\\s*\\(\\s*~\\s*branch","gate":true,"difficulty":"beginner","ok":"That is small multiples: facet_wrap(~ branch) gives each branch its own panel, so all three patterns read clearly.","no":"Add the wrapping facet layer: facet_wrap(~ branch). The tilde means one panel per value of branch."}
::solution
```r
ggplot(sales, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 2) +
  facet_wrap(~ branch)
```

=== step === concept
::eyebrow A subtle default
## Free the scales (when it is honest to)

Look closely at your faceted plot and you will notice every panel shares the **same** x and y axes. That is the default, and it is usually the right one: a shared scale means a point's height means the same thing in every panel, so you can compare branches at a glance. But it is also why Riverside still looks like a tiny smudge, its few hundred dollars are drawn on an axis stretched to fit Airport's thousands.

You can give each panel its own axis range with the `scales` argument: `"free_y"` frees the y-axis, `"free_x"` the x-axis, and `"free"` both:

```r
ggplot(sales, aes(x = foot_traffic, y = revenue)) +
  geom_point(size = 2) +
  facet_wrap(~ branch, scales = "free_y")
```

Now each panel zooms to its own data, so Riverside's day-to-day rise is finally visible instead of flat-lined. But you paid a price, and it matters.

[WARNING]
Free scales give every panel its own ruler. The shapes become readable, but you can **no longer compare magnitudes across panels**: Riverside's points may now sit as high on the page as Airport's even though Airport earns ten times more. Use free scales to reveal each panel's *pattern*, never to compare *sizes* between panels, and tell your reader you did it.

=== step === quiz
::eyebrow Check yourself
## What did free scales cost?

Maya sets `scales = "free_y"` and Riverside's panel now fills its own height, with the daily rise clearly visible. Her colleague glances at the three panels and says "great, now I can see Riverside is nearly as big as Airport." What is wrong?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing, free scales make the branches directly comparable ::no It is the opposite. Free scales give each panel its own y-axis, so two panels that look equally tall can represent very different dollar amounts.
- Free scales changed the underlying data, so the numbers are no longer trustworthy ::no The data is untouched; `scales = "free_y"` only changes the axis range each panel is drawn on, not a single value.
- Each panel now has its own y-axis, so equal *heights* no longer mean equal *dollars*; free scales reveal each panel's shape but destroy cross-panel magnitude comparison ::ok Exactly. Riverside fills its panel because its axis tops out low, not because it earns as much as Airport. For comparing sizes you need a shared scale (or a log scale, next).
- The colleague needs `scales = "free_x"` instead ::no Freeing the x-axis would not fix the misreading; the issue is that any freed axis removes the common ruler needed to compare magnitudes between panels.

=== step === concept
::eyebrow Take control
## Bend the axis, guides and legend

Faceting laid the panels out. The last piece of control is the **scales and guides**, the parts of the plot that translate data into position, ticks, labels and legends. There are two ways to keep Airport from squashing the small branches *without* lying with free scales.

First, you can keep the shared axis but make it readable. A **scale** controls how a variable maps to the page; `scale_y_continuous()` is the continuous y-axis, and its `labels` argument formats the tick text. With the `scales` package, `label_dollar()` turns `2100` into `$2,100`:

```r
library(scales)

ggplot(sales, aes(x = foot_traffic, y = revenue, colour = branch)) +
  geom_point(size = 2) +
  scale_y_continuous(labels = label_dollar())
```

Second, and better for data that spans this wide a range, switch the axis to a **logarithmic** scale with `scale_y_log10()`. A log axis places a value \(v\) at position \(\log_{10} v\), so each tenfold jump in dollars takes the same amount of space on the page. That pulls Airport's thousands and Riverside's hundreds onto one axis where you can read both at once:

```r
ggplot(sales, aes(x = foot_traffic, y = revenue, colour = branch)) +
  geom_point(size = 2) +
  scale_y_log10(labels = label_dollar())
```

[KEY INSIGHT]
On a log axis, equal **distances** mean equal **multiplications**, not equal additions: the gap from $100 to $1,000 is the same length as $1,000 to $10,000. It is perfect for data spanning orders of magnitude, but it cannot show zero or negative values (there is no \(\log_{10} 0\)), so reach for it only when every value is positive.

Mapping `colour = branch` made ggplot add a **legend** automatically; a legend is one kind of **guide**, the key that tells the reader what a colour or size means. You bend guides with three small tools:

```r
ggplot(sales, aes(x = foot_traffic, y = revenue, colour = branch)) +
  geom_point(size = 2) +
  scale_y_log10(labels = label_dollar()) +
  labs(colour = "Branch") +                 # rename the legend title
  theme(legend.position = "bottom")         # move it below the plot
```

And when a colour mapping is redundant (say you have *also* faceted by branch, so each panel is already labelled), drop the legend entirely with `guides(colour = "none")` so it stops wasting space:

```r
ggplot(sales, aes(x = foot_traffic, y = revenue, colour = branch)) +
  geom_point(size = 2) +
  facet_wrap(~ branch) +
  guides(colour = "none")                   # panels are labelled; legend is redundant
```

=== step === tryit
::eyebrow Your turn
## Un-squash the branches with a log axis

Here is the crowded one-panel chart of all three branches. The shared linear axis squashes Riverside and Downtown under Airport. Add the layer that switches the y-axis to a log scale so every branch becomes readable on one panel.

```r
ggplot(sales, aes(x = foot_traffic, y = revenue, colour = branch)) +
  geom_point(size = 2) +
  ____
```
::check {"regex":"scale_y_log10\\s*\\(","gate":true,"difficulty":"intermediate","ok":"That is it: scale_y_log10() gives each tenfold of revenue equal space, so Airport's thousands and Riverside's hundreds share one readable axis.","no":"Switch the y-axis to a log scale with scale_y_log10(). It places each value at log10(value), so wide ranges fit on one axis."}
::solution
```r
ggplot(sales, aes(x = foot_traffic, y = revenue, colour = branch)) +
  geom_point(size = 2) +
  scale_y_log10()
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [ggplot2 reference: facet_wrap()](https://ggplot2.tidyverse.org/reference/facet_wrap.html) - every argument, including `nrow`, `ncol` and the `scales` option you used.
- [ggplot2 reference: facet_grid()](https://ggplot2.tidyverse.org/reference/facet_grid.html) - the two-variable matrix layout, with `rows ~ cols` and margins explained.
- [ggplot2: Elegant Graphics for Data Analysis, Faceting chapter (free online)](https://ggplot2-book.org/facet.html) - the canonical treatment of small multiples by the package author.
- [ggplot2: position scales and their transformations](https://ggplot2.tidyverse.org/reference/scale_continuous.html) - `scale_y_continuous()`, log transforms and label formatting in one place.
- [R for Data Science (2e): Layers, the facets section](https://r4ds.hadley.nz/layers#facets) - a gentle, worked introduction to faceting with exercises.

=== step === complete
## Lesson 1 complete

You took one crowded, squashed chart and made it readable four ways: `facet_wrap(~ var)` for one panel per group, `facet_grid(rows ~ cols)` for one panel per combination, `scales = "free_y"` to reveal each panel's shape (knowing it costs you cross-panel comparison), and the scale-and-guide controls, `scale_y_log10()`, `label_dollar()`, `labs(colour=)`, `theme(legend.position=)` and `guides(colour = "none")`, to bend the axis and legend to your reader's needs.

Next, Lesson 2: Themes, Colour and Accessibility. You styled *what* the chart shows; now you will restyle *how* it looks without touching the data, with built-in and custom themes, deliberate colour scales, and palettes that stay readable for everyone, including colourblind readers.
