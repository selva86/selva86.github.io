---
title: "ggplot2 Lesson 4: Publication-Ready Figures"
description: "Choose the right ggplot2 chart for any question, then polish one figure to publication quality: a finding-first title, clean labels, a tidy theme, safe colour and ggsave."
keywords: "ggplot2 publication figures, ggsave, theme_minimal, labs title, axis labels, caption, colorblind-safe palette, Okabe-Ito, choose a chart, ggplot2 tutorial, polish a ggplot"
post_type: "LESSON"
curriculum_id: "2.4.4"
webr: true
lesson_access: "free"
course_id: "da-ggplot"
course_title: "Data Visualization with ggplot2"
course_lesson: "4"
course_total: "4"
course_landing: "ggplot2-Course.html"
course_next: ""
course_prev: "Bar-and-Distribution-Charts-in-ggplot2.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## Publication-Ready Figures
Maya the bakery owner has found something worth sharing. Quiet little Sourdough, ordered only 3 times last Saturday, quietly out-earned Coffee, her busiest seller. She wants that surprise on the front of the bakery's monthly newsletter. So she draws the bar chart and... it comes out grey, the axis says `revenue` in tiny lowercase, there is no title, and the finding is buried. A chart on your own screen and a **figure** a stranger can read in three seconds are not the same thing.

Across this course you learned the grammar (Lesson 1), scatter and line charts (Lesson 2), and bars and distributions (Lesson 3). You can now draw almost anything. This final lesson is about the last mile: picking the *right* chart, then polishing one to publication quality. Drag the controls below to feel where we are headed.

By the end of this lesson you will be able to:

- **Pick** the chart that answers a given question, from a quick chooser
- Make a figure explain itself with `labs()`: a title that states the finding, plus a subtitle, axis labels and a source caption
- **Style** with intent: a clean theme, and colour used to encode meaning, not decorate, kept colorblind-safe
- **Assemble** the layers into one publication figure and export it with `ggsave()`

**Prerequisites:** [Lesson 1, the grammar of graphics](The-Grammar-of-Graphics.html), [Lesson 2, scatter and line charts](Scatter-and-Line-Charts-in-ggplot2.html), and [Lesson 3, bars and distributions](Bar-and-Distribution-Charts-in-ggplot2.html). Every new function is defined as it appears.

::widget theme-styler {"data":[{"x":"Coffee","y":72},{"x":"Croissant","y":64},{"x":"Muffin","y":56},{"x":"Sourdough","y":76}],"x":"pastry","y":"revenue"}

=== step === concept
::eyebrow Start here
## First, choose the right chart

Before you style anything, you have to pick the right chart, and a beautiful theme cannot rescue the wrong one. Choosing is not about taste; it is two quick questions: **what do you want the reader to see?** and **what shape is your data?** Answer those and the chart almost picks itself.

Let us rebuild Maya's week in this fresh R session (each lesson starts clean, so the data lives on this page, run this once):

```r
library(ggplot2)

# Maya's last week: one row per day
week <- data.frame(
  day          = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"),
  foot_traffic = c(110, 125, 130, 150, 185, 240, 205),   # people who walked in
  revenue      = c(340, 380, 400, 455, 560, 720, 610)    # dollars taken
)

# Saturday's 30 orders, already totalled to one row per pastry (from Lesson 3)
by_pastry <- data.frame(
  pastry  = c("Coffee", "Croissant", "Muffin", "Sourdough"),
  revenue = c(72, 64, 56, 76),
  orders  = c(14, 7, 6, 3)
)
by_pastry
```

The same two columns can become several different charts; your *question* decides which. The gallery below takes Maya's week (foot traffic against revenue) and draws it two ways: a scatter to ask *are these two numbers related?* and a line that traces revenue as foot traffic climbs. Flip between them and watch the same numbers answer different questions.

::widget chart-plotter {"data":[{"x":110,"y":340},{"x":125,"y":380},{"x":130,"y":400},{"x":150,"y":455},{"x":185,"y":560},{"x":240,"y":720},{"x":205,"y":610}],"geoms":["point","line"],"x":"foot_traffic","y":"revenue","code":{"point":"ggplot(week, aes(foot_traffic, revenue)) +\n  geom_point()","line":"ggplot(week, aes(foot_traffic, revenue)) +\n  geom_line()"}}

Here is the whole course as a one-line chooser. Name your question, read across:

| Your question | The data you have | The chart | The geom |
|---|---|---|---|
| Are two numbers related? | two continuous columns | scatterplot | `geom_point()` |
| How did a value move over an order or time? | a value across an ordered sequence | line chart | `geom_line()` |
| How do categories compare on an amount? | one number per category | bar chart | `geom_col()` |
| How many rows fall in each group? | raw rows with a category | bar chart | `geom_bar()` |
| How is one number spread out? | one continuous column | histogram | `geom_histogram()` |
| How does a distribution differ across groups? | a number split by a category | boxplot | `geom_boxplot()` |

[KEY INSIGHT]
Choose the chart from the question, not the other way around. Pretty styling on the wrong chart still answers the wrong question.

=== step === quiz
::eyebrow Check yourself
## Pick the chart

Maya wants one chart for the newsletter showing how her daily revenue **climbed across the week**, Monday through Sunday. She has the `week` table: one revenue number per day, in day order. Which chart tells that story best?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A line chart, `geom_line()`, with day on x and revenue on y ::ok Right. The question is about movement across an ordered sequence of days, and a line connects the points so the upward trend is the first thing the eye follows.
- A bar chart, `geom_col()`, one bar per day ::no Defensible, but not best. Bars read as separate categories to compare, not as a connected trend; for "how it moved over time" a line draws the rise directly. Save bars for comparing categories that have no natural order.
- A histogram of `revenue` ::no A histogram bins one column to show its distribution and throws the day order away entirely, so it cannot show a trend across the week. There is also only one value per day, nothing to bin.

=== step === concept
::eyebrow The text layer
## A figure has to explain itself

You picked the chart. Now make it readable by someone who was not in the room. Maya's revenue-by-pastry bar chart, drawn bare, hides everything a reader needs to know:

```r
ggplot(by_pastry, aes(x = pastry, y = revenue)) +
  geom_col()
```

It works, but the axis just says `revenue` (revenue of what? in what units?), and nothing tells the reader the point. The fix is one layer: `labs()` (short for "labels"). It adds the text around the plot. Each argument is a piece of the figure's voice:

```r
ggplot(by_pastry, aes(x = pastry, y = revenue)) +
  geom_col() +
  labs(
    title    = "Sourdough quietly earns the most",
    subtitle = "Saturday revenue by pastry, neighbourhood bakery",
    x        = NULL,
    y        = "Revenue ($)",
    caption  = "Source: Maya's till, 30 Saturday orders"
  )
```

Walk through it. `title` is the headline, `subtitle` adds the context (when, where), `y = "Revenue ($)"` gives the axis a human name with units, `x = NULL` drops the redundant "pastry" label because the bars already name themselves, and `caption` credits the source so the figure can travel on its own.

[KEY INSIGHT]
The title should state the **finding**, not name the chart. "Sourdough quietly earns the most" does a reader's thinking for them; "Bar chart of revenue by pastry" makes them do it themselves. A good title is the one sentence you would say out loud about the chart.

=== step === tryit
::eyebrow Your turn
## Give it a finding-first title

Below is Maya's bar chart with the `labs()` layer started, but the title argument name is blank. Fill in the blank so the chart gets a title.

```r
ggplot(by_pastry, aes(x = pastry, y = revenue)) +
  geom_col() +
  labs(____ = "Sourdough quietly earns the most")
```
::check {"regex":"title\\s*=","gate":true,"difficulty":"beginner","ok":"That headline now sits above the plot and states the finding, so a reader gets the point before reading a single axis. The argument is title = inside labs().","no":"The argument that sets the headline is title. Write labs(title = \"Sourdough quietly earns the most\")."}
::solution
```r
ggplot(by_pastry, aes(x = pastry, y = revenue)) +
  geom_col() +
  labs(title = "Sourdough quietly earns the most")
```

=== step === concept
::eyebrow The non-data ink
## Themes set everything that is not the data

`labs()` added words. A **theme** controls the look of everything that is *not* the data: the panel background, the gridlines, the fonts, the spacing. It is a separate layer from your data, so you can completely restyle a figure without touching a single number.

ggplot2 ships with complete themes you drop on with one line. The default, `theme_gray()`, puts your bars on a grey panel with white gridlines, fine on screen but heavy in print. `theme_minimal()` and `theme_bw()` strip that back to ink on white, which is what most journals and reports want. The `base_size` argument scales every piece of text at once, the easiest way to keep labels legible when a figure is shrunk onto a page:

```r
ggplot(by_pastry, aes(x = pastry, y = revenue)) +
  geom_col() +
  labs(title = "Sourdough quietly earns the most", x = NULL, y = "Revenue ($)") +
  theme_minimal(base_size = 13)
```

Use the controls below to switch the theme (and the palette, which is the next step) and watch only the *look* change while the bars stay put. The data is fixed; the theme is pure presentation.

::widget theme-styler {"data":[{"x":"Coffee","y":72},{"x":"Croissant","y":64},{"x":"Muffin","y":56},{"x":"Sourdough","y":76}],"x":"pastry","y":"revenue"}

[NOTE]
A theme is polish on top of the right chart, never a rescue for the wrong one. Reach for a theme last, after the chart type, the mapping and the labels are already correct.

=== step === concept
::eyebrow Colour with a job
## Colour should encode, not decorate

The most common way a figure goes wrong is colour added just to look lively. Colour is a powerful channel, so spend it on **meaning**: map it to a variable the reader should compare, or use it to spotlight the one thing you want them to notice. If colour is not carrying information, a single restrained colour reads cleaner.

There is a second reason to be deliberate: about 8% of men have some red-green colour-vision deficiency, and R's default categorical colours are not guaranteed to be distinguishable for them. The **Okabe-Ito** palette is a small set of colours chosen to stay distinct for almost everyone. You apply any custom palette with `scale_fill_manual()`:

```r
library(ggplot2)
okabe <- c("#E69F00", "#56B4E9", "#009E73", "#0072B2")  # colorblind-safe (Okabe-Ito)

ggplot(by_pastry, aes(x = pastry, y = revenue, fill = pastry)) +
  geom_col() +
  scale_fill_manual(values = okabe) +
  theme_minimal(base_size = 13)
```

[WARNING]
Look closely: here `fill = pastry` colours each bar by the very thing the x-axis already names, so the colour adds nothing but noise (and a redundant legend). That is decoration, not encoding. In the final figure we will instead colour with intent, painting just the winning bar to make the finding pop.

=== step === quiz
::eyebrow Check yourself
## A reviewer cannot read your chart

You hand in a bar chart where the four bars are coloured with R's default palette, purely because plain bars looked dull. A reviewer with red-green colour blindness says two bars look identical to them. What is actually wrong, and the right fix?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is really wrong; colour always makes a chart clearer, the reviewer just needs to look harder ::no Decorative colour adds visual noise rather than information, and a palette that is not colorblind-safe can be genuinely unreadable to a real share of your audience. "Look harder" is not an accessibility plan.
- The colour encodes nothing the x-axis does not already say, and the palette is not colorblind-safe; drop the decorative colour, or switch to a tested palette like Okabe-Ito when colour truly carries meaning ::ok Exactly. Two fixes for two problems: stop spending colour on decoration, and when colour does encode something, use a colorblind-safe palette so everyone can read it.
- Use even more colours so every reader can find at least one they can tell apart ::no More colours make it harder, not easier. Accessibility comes from a tested, limited palette and from using colour only to carry information.

=== step === concept
::eyebrow Putting it together
## Assemble the figure, then export it

Now stack the layers into one publication figure. We colour **with intent**: a small logical column marks the top earner, and `scale_fill_manual()` paints just that bar in the accent colour while the rest go quiet grey (and `guide = "none"` hides the now-pointless legend), so the eye lands on the finding. `scale_y_continuous(labels = label_dollar())` formats the axis as dollars, and a `theme()` tweak bolds the title and drops the vertical gridlines:

```r
library(ggplot2)
library(scales)

by_pastry$top <- by_pastry$pastry == "Sourdough"   # TRUE for the winner only

fig <- ggplot(by_pastry, aes(x = pastry, y = revenue, fill = top)) +
  geom_col(width = 0.7) +
  scale_fill_manual(values = c("FALSE" = "#c9d1d9", "TRUE" = "#1f7a55"), guide = "none") +
  scale_y_continuous(labels = label_dollar()) +
  labs(
    title    = "Sourdough quietly earns the most",
    subtitle = "Saturday revenue by pastry",
    x = NULL, y = "Revenue",
    caption  = "Source: Maya's till, 30 Saturday orders"
  ) +
  theme_minimal(base_size = 13) +
  theme(plot.title = element_text(face = "bold"),
        panel.grid.major.x = element_blank())
fig
```

That is a figure Maya can hand to the newsletter editor as is. The last step is getting it out of R at the right quality. `ggsave()` writes the last (or a named) plot to a file. Run this on your own machine:

```r-static
# Width and height are in INCHES; dpi is dots per inch (print wants 300)
ggsave("sourdough-revenue.png", fig, width = 6, height = 4, dpi = 300)  # raster, for web or slides
ggsave("sourdough-revenue.pdf", fig, width = 6, height = 4)             # vector, stays sharp in print
```

[KEY INSIGHT]
Set the size in `ggsave()`, not by stretching the image afterwards, because the size you save at is the size the text was designed for. Use `dpi = 300` for print-quality PNGs; prefer a vector format (PDF or SVG) when the figure goes into print, since it stays crisp at any size.

=== step === tryit
::eyebrow Your turn
## Finish the figure

Here is the assembled figure for Maya's newsletter, but the final styling layer, the clean theme, is missing. Add the layer that strips the grey panel back to ink on white.

```r
ggplot(by_pastry, aes(x = pastry, y = revenue, fill = top)) +
  geom_col(width = 0.7) +
  scale_fill_manual(values = c("FALSE" = "#c9d1d9", "TRUE" = "#1f7a55"), guide = "none") +
  labs(title = "Sourdough quietly earns the most", x = NULL, y = "Revenue") +
  ____
```
::check {"regex":"theme_minimal","gate":true,"difficulty":"intermediate","ok":"That finishes it: theme_minimal() clears the grey panel and heavy gridlines, leaving a clean, print-ready figure. Add base_size to scale the text for the page.","no":"Add a complete theme as the last layer. theme_minimal() gives the ink-on-white look most reports want."}
::solution
```r
ggplot(by_pastry, aes(x = pastry, y = revenue, fill = top)) +
  geom_col(width = 0.7) +
  scale_fill_manual(values = c("FALSE" = "#c9d1d9", "TRUE" = "#1f7a55"), guide = "none") +
  labs(title = "Sourdough quietly earns the most", x = NULL, y = "Revenue") +
  theme_minimal(base_size = 13)
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [ggplot2 reference: labs()](https://ggplot2.tidyverse.org/reference/labs.html) - every label you can set: title, subtitle, axis names, caption, tag.
- [ggplot2 reference: complete themes](https://ggplot2.tidyverse.org/reference/ggtheme.html) - `theme_minimal()`, `theme_bw()` and the rest, with `base_size` explained.
- [ggplot2 reference: scale_*_manual()](https://ggplot2.tidyverse.org/reference/scale_manual.html) - how to supply your own colours, the way to apply a colorblind-safe palette.
- [ggplot2 reference: ggsave()](https://ggplot2.tidyverse.org/reference/ggsave.html) - exporting at a set size, dpi and device (PNG, PDF, SVG).
- [R for Data Science (2e): Communication](https://r4ds.hadley.nz/communication) - a full chapter on polishing plots for an audience, with worked examples.

=== step === complete
## Course complete

You can now take a finding and turn it into a figure a stranger reads in seconds: choose the chart from the question, label it so it explains itself, style it with a clean theme, spend colour only where it means something (and keep it colorblind-safe), then export it at print quality with `ggsave()`.

That was the last lesson of **Data Visualization with ggplot2**. Across four lessons you went from the grammar of graphics, to scatter and line charts, to bars and distributions, to publication-ready figures, the full path from a column of numbers to something worth sharing.

Next in the Data Analyst track: **Advanced ggplot2**, where you will draw small multiples with facets, bend scales and legends to your will, annotate plots so they explain themselves, and compose several charts into one figure with patchwork.
