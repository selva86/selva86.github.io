---
title: "Chart Annotation in R: Arrows, Highlights, Direct Labels"
slug: "Chart-Annotation-Techniques-in-R"
description: "Learn chart annotation in R with ggplot2: add text, draw arrows to point at key moments, highlight regions and subsets, and label lines without a legend."
keywords: "chart annotation in R, ggplot2 annotate, add arrows ggplot2, highlight ggplot2, direct labels ggplot2, ggrepel, geom_text, reference lines ggplot2, annotate rect, ggplot2 curve arrow"
auto_link_terms: "chart annotation in R|annotate a chart|ggplot2 annotations|add arrows in ggplot2|highlight in ggplot2|direct labels in ggplot2|label lines directly|highlight a subset|reference lines in ggplot2|geom_text_repel"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-25"
curriculum_id: "GG2-7.5"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Chart Annotation"
sidebar_order: 61
difficulty: "Intermediate"
---

<p class="lead">Chart annotation means adding your own marks to a plot, text, arrows, shaded areas, and direct labels, so the reader sees the point instantly instead of decoding it. In R you do this by stacking annotation layers onto a ggplot2 chart. This guide covers the three that carry the most weight: arrows that point at a spot, shaded highlights that emphasise a whole region, and labels placed right on the lines.</p>

This tutorial uses ggplot2 (part of the tidyverse) with two datasets that ship with R: `economics`, a monthly record of the US economy, and `Orange`, the growth of five orange trees. Every code block runs directly in your browser, so edit any line and re-run it to watch the chart change.

## What does it mean to annotate a chart?

A plain chart shows the data but not the story. It is a faithful record of every number, yet it leaves the reader to hunt for the one moment that matters. Annotation is how you do that hunting for them: you add a mark, a word, or an arrow that says "look here." Before we add anything, we need a chart to annotate, so let us build one.

We will plot US unemployment over time. The `economics` dataset has one row per month, and the `unemploy` column counts the unemployed in thousands.

```r title="Load ggplot2 and build a base chart"
library(ggplot2)

head(economics, 3)
#> # A tibble: 3 × 6
#>   date         pce    pop psavert uempmed unemploy
#>   <date>     <dbl>  <dbl>   <dbl>   <dbl>    <dbl>
#> 1 1967-07-01  507. 198712    12.6     4.5     2944
#> 2 1967-08-01  510. 198911    12.6     4.7     2945
#> 3 1967-09-01  516. 199113    11.9     4.6     2958

p <- ggplot(economics, aes(date, unemploy)) +
  geom_line(colour = "grey30")

p
```

The `head()` call confirms the shape of the data: a `date` column and, on the far right, `unemploy`. We saved the chart to a variable called `p` so we can reuse it in every later block without retyping it. Printing `p` draws a single grey line that climbs and dips across five decades. It is honest, but it does not tell you where to look.

To fix that, you add annotation layers. Here is the idea that trips up almost every beginner, so let us settle it first. There are two ways to put a mark on a ggplot chart, and they behave very differently.

![annotate() draws one mark at coordinates you type; geom_text() draws one mark per data row.](screenshots/Chart-Annotation-Techniques-in-R-annotate-vs-geom.webp)

*Figure 1: annotate() draws one mark at coordinates you type; geom_text() draws one mark per data row.*

The right-hand path is `annotate()`. You hand it literal coordinates and it draws exactly one mark there, no data involved. That is what you want for a caption, an arrow, or a shaded box. Let us drop a single label onto the chart.

```r title="Add one label with annotate()"
p +
  annotate("text",
           x = as.Date("1985-01-01"), y = 14000,
           label = "One call, one label",
           colour = "firebrick", size = 4.5)
```

The first argument, `"text"`, tells `annotate()` which kind of mark to draw. The `x` and `y` set where it goes, in the same units as the axes, so `x` is a date and `y` is a count. Because you typed the coordinates yourself, you get precisely one label, sitting where you asked.

Now the left-hand path, and the trap. `geom_text()` reads a data column and draws one mark for every row it finds. That is perfect when you genuinely want to label many points, but our data has far more rows than you would ever want as text.

[WARNING]
**Mapping a label to a data column draws one mark per row, not one caption.** If a single annotation suddenly becomes hundreds of overlapping bits of text, you almost certainly used a geom with `aes(label = ...)` where you wanted `annotate()` with a literal string.

Just how many marks would that be on this chart? Count the rows.

```r title="Count the rows geom_text would label"
nrow(economics)
#> [1] 574
```

If you had written `geom_text(aes(label = unemploy))`, ggplot2 would have stamped all 574 values onto the line, one per month, in an unreadable smear. For a caption or a single call-out, `annotate()` is the tool. Reserve the geoms for when the labels really do come from the data, one per point.

[KEY INSIGHT]
**annotate() speaks in coordinates, geoms speak in data.** Reach for `annotate()` whenever the mark is something you are adding by hand at a fixed spot, and reach for a geom only when every row should get its own mark.

**Try it:** Add a single text label reading "Great Recession" near the tall spike on the right, around the year 2010. Pick an `x` date and a `y` height that sit just above the peak.

```r title="Your turn: add one text label"
# Goal: place ONE label near the 2010 spike. Adjust x and y to taste.
p +
  annotate("text",
           x = as.Date("2005-01-01"), y = 13000,
           label = "Great Recession",
           colour = "firebrick", size = 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Single text label solution"
p +
  annotate("text",
           x = as.Date("2010-06-01"), y = 15800,
           label = "Great Recession",
           colour = "firebrick", size = 4)
```

**Explanation:** `annotate("text", ...)` places the string once, at the date and height you name. Nudge `y` up or down until the label clears the line.

</details>

## How do you point at features with arrows and curves?

A floating label leaves a small doubt: which point does it describe? An arrow removes that doubt by physically connecting the words to the spot. In ggplot2 you draw an arrow by adding a line annotation (a segment or a curve) and giving it an arrowhead. First, let us find the exact point we want to aim at: the single highest unemployment month on record.

```r title="Find the peak month"
peak <- economics[which.max(economics$unemploy), ]
peak
#> # A tibble: 1 × 6
#>   date         pce    pop psavert uempmed unemploy
#>   <date>     <dbl>  <dbl>   <dbl>   <dbl>    <dbl>
#> 1 2009-10-01 9932. 308189     5.4    18.9    15352
```

`which.max()` returns the position of the largest value in `unemploy`, and we use it to pull out that whole row. The peak was October 2009, with 15,352 thousand people out of work. Now we have a target to point at. We draw a straight arrow from a caption to that point using `annotate("segment", ...)` with an `arrow()`.

```r title="Draw an arrow to the peak"
p +
  annotate("text",
           x = as.Date("1995-01-01"), y = 15200,
           label = "All-time peak", colour = "firebrick", size = 4.2) +
  annotate("segment",
           x = as.Date("1997-06-01"), y = 15000,
           xend = peak$date, yend = peak$unemploy + 200,
           arrow = arrow(length = unit(3, "mm"), type = "closed"),
           colour = "firebrick")
```

A segment needs four coordinates: `x` and `y` are where the line starts (near the caption), and `xend` and `yend` are where it ends (just above the peak, which is why we add 200 to `peak$unemploy` so the head does not cover the line). The `arrow = arrow(...)` part is what turns a plain segment into an arrow. That `arrow()` helper is worth understanding on its own, because its four arguments control exactly how the head looks.

![The four arguments of arrow() that shape an arrowhead.](screenshots/Chart-Annotation-Techniques-in-R-arrow-anatomy.webp)

*Figure 2: The four arguments of arrow() that shape an arrowhead.*

Read the diagram left to right. `length` sets how big the head is, given as a physical size with `unit()` (millimetres here) rather than data units, so it stays the same on any axis. `angle` sets how sharp the head is. `ends` chooses which tip gets a head, `"last"`, `"first"`, or `"both"`. And `type` is either `"open"` (two strokes) or `"closed"` (a filled triangle). A straight arrow is not always the cleanest option, though. When a caption sits off to the side, a gentle curve looks more deliberate. Swap `"segment"` for `"curve"` and add a `curvature`.

```r title="Draw a curved arrow"
p +
  annotate("text",
           x = as.Date("1972-01-01"), y = 13500,
           label = "1982 recession", colour = "steelblue", size = 4) +
  annotate("curve",
           x = as.Date("1976-06-01"), y = 13200,
           xend = as.Date("1982-11-01"), yend = 12000,
           curvature = -0.3,
           arrow = arrow(length = unit(2.5, "mm"), type = "closed"),
           colour = "steelblue")
```

The `curve` annotation takes the same start and end coordinates as a segment, plus `curvature` to bend it. A positive value bows the line one way, a negative value the other, and `0` gives you a straight segment again. Here `-0.3` arcs the arrow up and over toward the early-1980s bump, so the eye follows the curve straight to the point.

[TIP]
**Size arrowheads with unit(), and prefer closed heads when small.** Because `arrow(length = unit(3, "mm"))` is measured in millimetres, the head keeps its size no matter how you zoom the axes, and a filled `type = "closed"` head reads far more clearly than open strokes at small sizes.

**Try it:** Take the curved-arrow code and flip the bend. Change `curvature = -0.3` to a positive value and watch the arc swing the other way.

```r title="Your turn: flip the curve"
# Goal: change the sign of curvature and re-run.
p +
  annotate("curve",
           x = as.Date("1976-06-01"), y = 13200,
           xend = as.Date("1982-11-01"), yend = 12000,
           curvature = -0.3,   # try 0.4
           arrow = arrow(length = unit(2.5, "mm"), type = "closed"),
           colour = "steelblue")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Flip the curve solution"
p +
  annotate("curve",
           x = as.Date("1976-06-01"), y = 13200,
           xend = as.Date("1982-11-01"), yend = 12000,
           curvature = 0.4,
           arrow = arrow(length = unit(2.5, "mm"), type = "closed"),
           colour = "steelblue")
```

**Explanation:** The sign of `curvature` sets the direction of the bend; its size sets how deep the arc is. A positive value bows the arrow the opposite way from a negative one.

</details>

## How do you highlight a region or a data subset?

Arrows point at a single spot, but sometimes the thing worth noticing is a whole stretch of the chart: a period, a threshold, a group. Highlighting handles that. The trick behind every highlight is the same: make the important part stand out by letting everything else recede. There are three everyday ways to do it, and the diagram lays them out.

![Three ways to draw the reader's eye: a shaded window, a recoloured subset, a reference line.](screenshots/Chart-Annotation-Techniques-in-R-highlight-ways.webp)

*Figure 3: Three ways to draw the reader's eye: a shaded window, a recoloured subset, a reference line.*

Start with the shaded window. To mark a time period, you draw a translucent rectangle behind the line with `annotate("rect", ...)`. The key is setting the rectangle's top and bottom to `-Inf` and `Inf`, which means "as low and as high as the panel goes," so the band spans the full height no matter what the y-axis does.

```r title="Shade a time window"
p +
  annotate("rect",
           xmin = as.Date("2007-12-01"), xmax = as.Date("2009-06-01"),
           ymin = -Inf, ymax = Inf,
           alpha = 0.15, fill = "firebrick") +
  annotate("text",
           x = as.Date("2008-09-01"), y = 4000,
           label = "Great\nRecession", size = 3.4, colour = "firebrick")
```

The rectangle spans the recession dates on the x-axis and the whole panel vertically. The `alpha = 0.15` keeps it faint, a wash of colour rather than a block, so the line still reads clearly through it. The `\n` inside the label breaks the text onto two lines. Next, a reference line. A horizontal line marks a threshold the reader can measure against, such as the long-run average, and `geom_hline()` draws one at a y-value you supply.

```r title="Add a reference line at the average"
avg <- mean(economics$unemploy)

p +
  geom_hline(yintercept = avg, linetype = "dashed", colour = "grey50") +
  annotate("text",
           x = as.Date("1970-01-01"), y = avg + 500,
           label = "long-run average", hjust = 0, size = 3.4, colour = "grey40")
```

We compute the mean into `avg`, pass it to `geom_hline()` as the `yintercept`, and dash the line so it reads as a guide rather than data. The label uses `hjust = 0` to left-align its text at the starting x-position. Now every peak and dip is instantly readable as "above or below normal." The third technique is the most useful and the most overlooked: emphasise a subset of the data itself. You draw the whole series in grey, then draw just the part you care about again, in a bold colour, on top.

```r title="Emphasise a subset of the line"
recession <- subset(economics,
                    date >= as.Date("2007-12-01") &
                    date <= as.Date("2009-06-01"))

p +
  geom_line(data = recession, colour = "firebrick", linewidth = 1.1)
```

The base plot `p` already draws the full line in grey. We then add a second `geom_line()` that reads only the `recession` rows and paints them thick and red. Because layers stack in order, the red segment lands on top of the grey line, and the eye goes straight to it. This "grey everything, recolour one" move works on any chart type, points, bars, or lines, and needs no extra package. If you use it often on grouped charts, the `gghighlight` package wraps the same idea into a single `gghighlight(condition)` line you can run in a local R session, but the manual version here always works.

[KEY INSIGHT]
**The universal highlight is grey-then-recolour: dim the whole chart, then redraw the part that matters on top.** Emphasis is really about de-emphasising everything else, and layering a bold copy of a subset over a muted base does exactly that with plain ggplot2.

**Try it:** Shade the early-1980s recession instead. Change the `annotate("rect")` dates to span roughly July 1981 to November 1982.

```r title="Your turn: shade a different window"
# Goal: move the shaded band to the 1981-1982 recession. Change the two dates.
p +
  annotate("rect",
           xmin = as.Date("2007-12-01"), xmax = as.Date("2009-06-01"),
           ymin = -Inf, ymax = Inf,
           alpha = 0.15, fill = "steelblue")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shade a different window solution"
p +
  annotate("rect",
           xmin = as.Date("1981-07-01"), xmax = as.Date("1982-11-01"),
           ymin = -Inf, ymax = Inf,
           alpha = 0.15, fill = "steelblue")
```

**Explanation:** Only `xmin` and `xmax` change to move the band along the timeline; `ymin = -Inf` and `ymax = Inf` keep it spanning the full panel height.

</details>

## How do you label lines directly instead of using a legend?

When a chart has several lines, the usual answer is a colour legend off to the side. But a legend forces the reader to bounce back and forth, matching colours to names. A direct label puts the name right on the line, so there is nothing to match. Let us see the problem first with a multi-line chart. The `Orange` dataset tracks the trunk size of five trees as they age.

```r title="Build a multi-line chart with a legend"
head(Orange, 3)
#>   Tree age circumference
#> 1    1 118            30
#> 2    1 484            58
#> 3    1 664            87

p_orange <- ggplot(Orange, aes(age, circumference, colour = Tree, group = Tree)) +
  geom_line(linewidth = 0.9)

p_orange
```

Mapping `colour = Tree` gives each tree its own coloured line and adds a legend on the right. The chart works, but to know which line is Tree 4 you must look away from the data and over to the key. We can do better by labelling each line at its end. First we need the position of each line's final point: the row with the largest `age` for every tree.

```r title="Find each line's end point"
library(dplyr)

ends <- Orange |>
  group_by(Tree) |>
  slice_max(age, n = 1) |>
  ungroup()

ends
#> # A tibble: 5 × 3
#>   Tree    age circumference
#>   <ord> <dbl>         <dbl>
#> 1 3      1582           140
#> 2 1      1582           145
#> 3 5      1582           177
#> 4 2      1582           203
#> 5 4      1582           214
```

We group the data by tree, keep only the row with the maximum age in each group with `slice_max()`, and land on one end point per tree. Now we place a label at each of those points with `geom_text()` and switch the legend off, since the labels replace it.

```r title="Label the line ends directly"
p_orange +
  geom_text(data = ends,
            aes(label = paste("Tree", Tree)),
            hjust = 0, nudge_x = 30, size = 3.5) +
  scale_x_continuous(limits = c(0, 1750)) +
  theme(legend.position = "none")
```

The `geom_text()` reads the five-row `ends` table, so it draws exactly five labels, one at each line's tip. `hjust = 0` left-aligns them and `nudge_x = 30` pushes them just past the line, while widening the x-axis to 1750 makes room. Look closely, though: the labels for Tree 3 and Tree 1 sit almost on top of each other, because their final circumferences (140 and 145) are nearly equal.

[WARNING]
**geom_text size is in millimetres, and labels past the panel edge get clipped.** A `size = 5` label is large, not tiny, because ggplot2 measures text in millimetres, not points; and if a label sits beyond the plotting area it silently disappears, which is why we widen the x-axis with `scale_x_continuous()` to make room.

That collision between the Tree 1 and Tree 3 labels is exactly what the ggrepel package solves. It nudges labels apart automatically and draws a tiny connector back to each point.

```r title="Repel labels so they never overlap"
library(ggrepel)

p_orange +
  geom_text_repel(data = ends,
                  aes(label = paste("Tree", Tree)),
                  hjust = 0, nudge_x = 60, direction = "y",
                  segment.colour = "grey70", size = 3.5) +
  scale_x_continuous(limits = c(0, 1900)) +
  theme(legend.position = "none")
```

`geom_text_repel()` is a drop-in replacement for `geom_text()` that adds one rule: no two labels may overlap. Setting `direction = "y"` lets it move labels only up and down, keeping them lined up at the right edge, and `segment.colour = "grey70"` draws the faint leader line back to each tree's endpoint. The Tree 1 and Tree 3 labels now separate cleanly, and the legend is gone for good. Two helper packages go further if you reach for them: directlabels drops a label at each line's end with `geom_dl(aes(label = Tree), method = "last.points")`, and geomtextpath runs the label along the line itself with `geom_textline()`, both in a local R session.

[KEY INSIGHT]
**Direct labels beat a legend whenever the lines have room at their ends.** Putting the name on the line removes the colour-matching step entirely, so the reader understands the chart in one pass instead of glancing back and forth.

**Try it:** Swap `geom_text_repel()` for `geom_label_repel()`, which draws each label inside a small filled box. Everything else stays the same.

```r title="Your turn: use boxed repel labels"
# Goal: change geom_text_repel to geom_label_repel.
p_orange +
  geom_text_repel(data = ends,
                  aes(label = paste("Tree", Tree)),
                  hjust = 0, nudge_x = 60, direction = "y",
                  size = 3.5) +
  scale_x_continuous(limits = c(0, 1900)) +
  theme(legend.position = "none")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Boxed repel labels solution"
p_orange +
  geom_label_repel(data = ends,
                   aes(label = paste("Tree", Tree)),
                   hjust = 0, nudge_x = 60, direction = "y",
                   size = 3.5) +
  scale_x_continuous(limits = c(0, 1900)) +
  theme(legend.position = "none")
```

**Explanation:** `geom_label_repel()` works exactly like `geom_text_repel()` but wraps each label in a rounded, filled rectangle, which helps the text stand out against busy lines.

</details>

## A complete annotated chart, start to finish

Each technique is useful alone, but the payoff comes from combining them into one chart that tells a full story. Let us return to the unemployment line and layer everything we have learned: shade the Great Recession, recolour that stretch of the line, mark the long-run average, and point an arrow at the all-time peak, all on a clean theme.

```r title="Compose the full annotated story chart"
avg <- mean(economics$unemploy)

ggplot(economics, aes(date, unemploy)) +
  geom_line(colour = "grey55") +
  annotate("rect",
           xmin = as.Date("2007-12-01"), xmax = as.Date("2009-06-01"),
           ymin = -Inf, ymax = Inf, alpha = 0.15, fill = "firebrick") +
  geom_hline(yintercept = avg, linetype = "dashed", colour = "grey50") +
  annotate("text", x = as.Date("1968-01-01"), y = avg + 700, hjust = 0,
           label = "48-year average", size = 3.3, colour = "grey40") +
  geom_line(data = subset(economics,
                          date >= as.Date("2007-12-01") &
                          date <= as.Date("2009-06-01")),
            colour = "firebrick", linewidth = 1.1) +
  annotate("segment",
           x = as.Date("1996-01-01"), y = 15200,
           xend = peak$date, yend = peak$unemploy + 150,
           arrow = arrow(length = unit(3, "mm"), type = "closed"),
           colour = "grey20") +
  annotate("label",
           x = as.Date("1990-06-01"), y = 15000, hjust = 0.5,
           label = "Great Recession peak:\n15.4M unemployed",
           size = 3.2, colour = "grey20") +
  labs(title = "US unemployment, 1967 to 2015",
       x = NULL, y = "Unemployed (thousands)") +
  theme_minimal()
```

Read the layers in order and you can see the story assemble: the grey line gives context, the shaded band and red overlay isolate the crisis, the dashed line sets a baseline, and the arrow with its boxed caption names the worst month. The reader gets the message before reading a single axis tick. Notice we reused `peak` and `avg` from earlier blocks, since the browser keeps every variable alive as you go.

[TIP]
**Annotation is subtraction: add only the marks that answer the reader's question.** One arrow, one shaded band, and one reference line carried this whole chart; piling on more would bury the message you worked to surface.

## Practice Exercises

These combine several techniques from the tutorial. Use fresh variable names (they start with `my_`) so your work does not overwrite the tutorial's variables.

### Exercise 1: Mark an event with a vertical reference line

On the unemployment chart, add a dashed vertical line at December 2008 with `geom_vline()`, then add an `annotate("text")` label naming it "Crisis deepens". A vertical line uses `xintercept`, and for a date axis that intercept must be a real date.

```r title="Exercise 1 starter"
# Add a vertical reference line + a text label at Dec 2008.
# Hint: geom_vline(xintercept = as.Date("2008-12-01"))

my_plot <- ggplot(economics, aes(date, unemploy)) +
  geom_line(colour = "grey30")

# Write your code below:
my_plot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_plot <- ggplot(economics, aes(date, unemploy)) +
  geom_line(colour = "grey30")

my_plot +
  geom_vline(xintercept = as.Date("2008-12-01"),
             linetype = "dashed", colour = "firebrick") +
  annotate("text",
           x = as.Date("2008-12-01"), y = 6000,
           label = "Crisis deepens", angle = 90,
           vjust = -0.4, size = 3.4, colour = "firebrick")
```

**Explanation:** `geom_vline()` draws the line at a date `xintercept`, and the text label is rotated with `angle = 90` so it reads neatly alongside the vertical line.

</details>

### Exercise 2: Spotlight a single tree

On the `Orange` chart, highlight only Tree 4 (the largest) using the grey-then-recolour pattern, then direct-label just that tree's endpoint with ggrepel. Draw all five trees in grey first, then Tree 4 in a bold colour, and turn the legend off.

```r title="Exercise 2 starter"
# Grey all trees, recolour Tree 4, then label only Tree 4's end.
# Hint: subset(Orange, Tree == 4) for the bold line and the label point.

my_orange <- ggplot(Orange, aes(age, circumference, group = Tree)) +
  geom_line(colour = "grey80")

# Write your code below:
my_orange
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_tree4     <- subset(Orange, Tree == 4)
my_tree4_end <- subset(my_tree4, age == max(age))

my_orange +
  geom_line(data = my_tree4, colour = "firebrick", linewidth = 1.2) +
  ggrepel::geom_text_repel(data = my_tree4_end,
                           aes(label = "Tree 4"),
                           nudge_x = 120, colour = "firebrick", size = 4) +
  scale_x_continuous(limits = c(0, 1900)) +
  theme(legend.position = "none")
```

**Explanation:** The base layer draws every tree grey; a second `geom_line()` repaints only Tree 4 in red; and a single repelled label names that endpoint. Emphasis comes from muting the other four lines, not from decorating Tree 4.

</details>

## Frequently asked questions

### When should I use annotate() instead of geom_text()?

Use `annotate()` when you are adding a fixed mark by hand: one caption, one arrow, or one shaded box at coordinates you type. Reach for a geom like `geom_text()` only when every row of a data frame should get its own mark, such as labelling each point in a small table. Mapping a label to a data column that has hundreds of rows stamps hundreds of overlapping labels, which is the single most common annotation mistake.

### How do I stop ggplot2 labels from overlapping?

Load the ggrepel package and swap `geom_text()` for `geom_text_repel()` (or `geom_label()` for `geom_label_repel()`). It nudges every label until none overlap and draws a thin connector line back to each point. Setting `direction = "y"` restricts the movement to up and down, which keeps end-of-line labels aligned at the right edge.

### Why do my text labels get cut off at the edge of the chart?

A label whose position falls outside the plotting area is clipped without any warning, so it simply disappears. Make room by widening the axis with `scale_x_continuous(limits = ...)` (or `scale_y_continuous()`), or pull the label inward with `nudge_x` and `hjust`. This is why the direct-label examples above extend the x-axis before placing labels past the line ends.

### Do I need an extra package to annotate a chart in R?

No. Text, arrows, curves, shaded rectangles, and reference lines all come from ggplot2 itself through `annotate()`, `geom_hline()`, and `geom_vline()`. You only reach for a helper package when you want automatic label placement (ggrepel) or a one-line highlight shortcut (gghighlight); everything else is plain ggplot2.

### How do I shade a date range on a time-series chart?

Add `annotate("rect", ...)` with `xmin` and `xmax` set to the start and end dates, and `ymin = -Inf, ymax = Inf` so the band fills the full panel height whatever the y-axis shows. Keep `alpha` low, around 0.15, so the shaded window sits behind the line as a faint wash rather than covering it.

## Summary

Chart annotation is the difference between a chart that stores data and one that delivers a message. The toolkit sorts into a few clear jobs, each with a go-to function.

![The chart-annotation toolkit at a glance.](screenshots/Chart-Annotation-Techniques-in-R-toolkit-mindmap.webp)

*Figure 4: The chart-annotation toolkit at a glance.*

| Job | Technique | Key function |
|---|---|---|
| Add one caption | Text at fixed coordinates | `annotate("text", ...)` |
| Point at a feature | Segment or curve with an arrowhead | `annotate("segment"/"curve", arrow = arrow())` |
| Shade a period | Full-height translucent rectangle | `annotate("rect", ymin = -Inf, ymax = Inf)` |
| Mark a threshold | Reference line | `geom_hline()`, `geom_vline()` |
| Emphasise a subset | Grey base, recolour on top | second `geom_line()` on a subset |
| Name lines directly | Labels at line ends, no overlaps | `ggrepel::geom_text_repel()` |

The through-line across all of them is the same: emphasis is de-emphasis. Every technique here works by making one thing louder and everything else quieter, whether through colour, weight, or a pointing arrow. Add marks sparingly, aim each one at a real question the reader has, and a plain chart becomes a clear argument.

## References

1. Wickham, H., Navarro, D., Pedersen, T. L. - *ggplot2: Elegant Graphics for Data Analysis (3e)*, Chapter 8: Annotations. [Link](https://ggplot2-book.org/annotations.html)
2. ggplot2 documentation - `annotate()` reference. [Link](https://ggplot2.tidyverse.org/reference/annotate.html)
3. ggplot2 documentation - `geom_segment()` and `arrow()`. [Link](https://ggplot2.tidyverse.org/reference/geom_segment.html)
4. ggrepel documentation - repelling text labels. [Link](https://ggrepel.slowkow.com/)
5. gghighlight documentation - highlight lines and points. [Link](https://yutannihilation.github.io/gghighlight/)
6. R Graph Gallery - How to annotate a plot in ggplot2. [Link](https://r-graph-gallery.com/233-add-annotations-on-ggplot2-chart.html)
7. Wickham, H., Cetinkaya-Rundel, M., Grolemund, G. - *R for Data Science (2e)*, Communication. [Link](https://r4ds.hadley.nz/communication)

## Continue Learning

- [ggplot2 Labels and Annotations, Done Cleanly](ggplot2-Labels-and-Annotations.html) - manage titles, axis labels, and captions with `labs()` so your chart's text stays uncluttered.
- [Build a Complete ggplot2 Theme from Scratch](Build-a-ggplot2-Theme-in-R.html) - style the non-data layer (fonts, grids, backgrounds) into a reusable house style.
- [ggplot2 annotate() in R: Add Text, Lines, and Shapes](ggplot2-annotate-in-R.html) - a focused reference on the `annotate()` function and its five common patterns.
