---
title: "Advanced ggplot2 Lesson 2: Themes & Accessibility"
description: "Restyle a ggplot without touching the data: built-in and custom themes, the right colour scale for each data type, and colourblind-safe, accessible palettes."
keywords: "ggplot2 themes, theme_minimal, colour scales, scale_fill_viridis, scale_fill_brewer, colorblind safe palette, Okabe-Ito, viridis, accessible data visualization, ggplot2 tutorial"
post_type: "LESSON"
curriculum_id: "2.5.2"
webr: true
mathjax: false
lesson_access: "free"
course_id: "da-ggplot2-adv"
course_title: "Advanced ggplot2"
course_lesson: "2"
course_total: "3"
course_landing: "Advanced-ggplot2-Course.html"
course_next: "Annotate-and-Compose-Plots.html"
course_prev: "Facets-and-Scales-in-ggplot2.html"
---

=== step === cover
::eyebrow Lesson 2 of 3
## Restyle it, without touching the data

In Lesson 1, Maya the baker had three branches, **Downtown**, **Riverside** and the big **Airport** shop, and you split her crowded chart into small multiples with facets, then bent the scales so every branch was readable. The numbers were finally clear.

Now she wants the chart to *look* the part: clean, on-brand, and, because one of her investors is colourblind, readable by everyone in the room. None of that means changing a single data point. It means changing the **theme** (the fonts, gridlines and background) and the **colours**. Below is exactly that, the same bar chart, restyled live. Flip the **Palette** and **Theme** controls and watch the look change while the bars keep their values.

By the end of this lesson you will be able to:

- Restyle a whole plot with a built-in `theme_*()` and explain that a theme changes appearance, never the data
- Pick the right colour scale for the data type: a discrete scale for categories, a continuous scale for a number
- Choose a colourblind-safe palette (viridis or Okabe-Ito) and never rely on hue alone

**Prerequisites:** you can build a basic ggplot and map a column to colour, `ggplot(data, aes(...)) + geom_*()` (from [Data Visualization with ggplot2](ggplot2-Course.html) and Lesson 1 of this course, [Facets and Scales](Facets-and-Scales-in-ggplot2.html)). Every new function is defined as it appears.

::widget theme-styler {"data":[{"x":"Downtown","y":3230},{"x":"Riverside","y":2160},{"x":"Airport","y":21020}],"x":"branch","y":"revenue"}

=== step === concept
::eyebrow First lever
## The data, and swapping the whole look with a theme

Each lesson starts in a fresh R session, so let us put Maya's three branches back on the page. Run this block once and the rest of the lesson builds on it:

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
head(sales)
#>     branch day foot_traffic revenue
#> 1 Downtown Mon          150     300
#> 2 Downtown Tue          165     330
#> 3 Downtown Wed          180     360
#> 4 Downtown Thu          205     430
#> 5 Downtown Fri          240     520
#> 6 Downtown Sat          300     690
```

Every ggplot is two separate things stacked together. There is the **data ink**, the bars, points and lines that encode your numbers, and there is everything else: the grey background, the gridlines, the tick labels, the legend box, the fonts. That second part, the non-data furniture, is what ggplot2 calls the **theme**. The whole point of this lesson is that you can completely change the theme and the colours and the data ink stays exactly where it was. Styling is reversible decoration; it never edits a value.

ggplot2's default look, the grey panel with white gridlines, is fine for exploring but rarely what you want in a report. You change the theme by adding a **theme function** as one more layer with `+`, exactly like you add a geom. Each one is a complete, pre-built look:

- `theme_minimal()` strips the panel border and background for a clean, modern feel
- `theme_bw()` keeps gridlines but on white, good for print
- `theme_classic()` gives you bare axis lines and no gridlines, a traditional look
- `theme_void()` removes nearly everything, for maps and standalone graphics

Here is Maya's daily revenue for one branch, drawn once with the default theme and once with `theme_minimal()`. Only the layer at the end changes:

```r
base <- ggplot(subset(sales, branch == "Downtown"), aes(day, revenue)) +
  geom_col(fill = "#1f7a55")

base                    # default grey theme
base + theme_minimal()  # same bars, cleaner furniture
```

The bars are identical; the background, gridlines and spacing are what moved. The widget below makes that tangible across all three branches: switch the **Theme** control and watch the panel restyle while the bars hold steady. (Ignore the Palette control for one more step.)

::widget theme-styler {"data":[{"x":"Downtown","y":3230},{"x":"Riverside","y":2160},{"x":"Airport","y":21020}],"x":"branch","y":"revenue"}

[KEY INSIGHT]
A `theme_*()` layer restyles the non-data parts of a plot in one move. It changes how the chart *looks*, never what it *says*: the same data drawn under `theme_void()` and `theme_bw()` reports identical numbers.

=== step === concept
::eyebrow Second lever
## Colour: pick the scale that matches the data type

Colour is the other big lever, and the single most common mistake is using the wrong *kind* of colour scale. The rule is simple once you see it: **the scale you need depends on the type of the variable you are colouring by.**

First, a vocabulary point. In ggplot2, `colour` controls the outline of points and lines, while `fill` controls the inside of bars and areas. You map either one to a column inside `aes()`, and ggplot picks a default scale. To take control, you add a `scale_*` layer. Which one depends on the data:

- A **discrete** (categorical) variable like `branch` has a few distinct labels with no order. It needs a **qualitative** scale that gives each category a clearly different colour: `scale_fill_brewer()`, `scale_fill_viridis_d()` (the `d` is for discrete), or `scale_fill_manual()` to hand-pick colours.
- A **continuous** variable like `revenue` is a number on a range. It needs a **sequential** scale where colour varies smoothly from low to high: `scale_fill_viridis_c()` (the `c` is for continuous) or `scale_fill_gradient()`.

Maya's `branch` is categorical, so a discrete scale is right. The widget below shows the bar chart and, beside it, the exact ggplot code, so you can see the mapping from data to `aes` to geom. Picture a `scale_fill_*` line added to that code as you read on:

::widget chart-plotter {"data":[{"x":"Downtown","y":3230,"fill":"Downtown"},{"x":"Riverside","y":2160,"fill":"Riverside"},{"x":"Airport","y":21020,"fill":"Airport"}],"geoms":["bar"],"x":"branch","y":"revenue"}

Here are two good discrete choices on Maya's branches, run them and compare:

```r
# Add up the week's revenue within each branch: one row per branch.
totals <- aggregate(revenue ~ branch, data = sales, FUN = sum)

ggplot(totals, aes(branch, revenue, fill = branch)) +
  geom_col() +
  scale_fill_brewer(palette = "Set2") +   # a ColorBrewer qualitative palette
  theme_minimal()

ggplot(totals, aes(branch, revenue, fill = branch)) +
  geom_col() +
  scale_fill_viridis_d() +                # viridis, discrete version
  theme_minimal()
```

[NOTE]
Match the scale to the data type. Putting a sequential scale on categories implies an order that is not there; putting a qualitative scale on a number throws away the low-to-high meaning. `_d` scales are for discrete categories, `_c` scales are for continuous numbers.

=== step === quiz
::eyebrow Check yourself
## Did the theme change the data?

Maya draws her revenue bars, then adds `+ theme_dark()` to match her slide deck. A colleague glances at the darker chart and worries: "the styling changed, are the revenue numbers still right?" What is the correct answer?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- The numbers are untouched: a theme only restyles the non-data furniture (background, gridlines, fonts), so the bars encode exactly the same revenue as before ::ok Exactly. Theme layers change appearance, never values. The same data under `theme_dark()` and `theme_minimal()` reports identical numbers.
- The numbers changed, because `theme_dark()` rescales the plot to fit the dark background ::no A theme never rescales or alters data. It only changes how the non-data parts (panel, gridlines, text) are drawn.
- It depends: dark themes can compress the axis, which changes the values ::no The axis range and the values are set by the data and the scales, not by the theme. A theme cannot compress an axis or change a number.

=== step === tryit
::eyebrow Your turn
## Give the branches a deliberate colour scale

Below is Maya's branch-total bar chart with `fill = branch` mapped, but ggplot is using its dull default colours. Add the layer that applies the **discrete viridis** palette so the three categories get clearly distinct, deliberate colours.

```r
totals <- aggregate(revenue ~ branch, data = sales, FUN = sum)

ggplot(totals, aes(branch, revenue, fill = branch)) +
  geom_col() +
  ____ +
  theme_minimal()
```
::check {"regex":"scale_fill_viridis_d\\s*[(]","gate":true,"difficulty":"beginner","ok":"That is it: scale_fill_viridis_d() gives each branch a distinct, deliberate colour from the discrete viridis palette.","no":"Add the discrete viridis fill scale: scale_fill_viridis_d(). The _d means discrete, which is right for the categorical branch variable."}
::solution
```r
totals <- aggregate(revenue ~ branch, data = sales, FUN = sum)

ggplot(totals, aes(branch, revenue, fill = branch)) +
  geom_col() +
  scale_fill_viridis_d() +
  theme_minimal()
```

=== step === concept
::eyebrow The reason it matters
## Why default colours can fail a real reader

Here is the part most tutorials skip. Around **1 in 12 men and 1 in 200 women** have some form of colour vision deficiency (colourblindness); the most common kind makes red and green hard to tell apart. That is not a rare edge case, it is likely someone in any room Maya presents to, including her investor.

When you encode groups with colour alone, and you pick colours that only differ in hue, those readers can lose the distinction entirely. A red line and a green line of similar brightness can collapse into the same muddy tone. The chart that looks crisp to you becomes unreadable to them.

The fix has two halves, and good design uses both:

1. **Choose a colourblind-safe palette** whose colours differ in lightness as well as hue, so they stay distinct even when hue is lost.
2. **Never rely on hue alone**: also encode the group with shape, linetype, direct labels, or facets, so the chart still works in greyscale or for a colourblind reader.

The widget below is the same chart under three palettes. Switch the **Palette** control to **colorblind-safe** to see the Okabe-Ito set, eight colours chosen by Masataka Okabe and Kei Ito specifically to stay distinguishable for colour vision deficiency:

::widget theme-styler {"data":[{"x":"Downtown","y":3230},{"x":"Riverside","y":2160},{"x":"Airport","y":21020}],"x":"branch","y":"revenue"}

[WARNING]
Colour is not just decoration, it carries meaning, so it has to reach every reader. A chart whose groups are told apart by hue alone can be unreadable to a colourblind viewer. Reach for a colourblind-safe palette by default, and back colour up with a second channel.

=== step === concept
::eyebrow A palette that does both jobs
## viridis: safe, and readable in greyscale

The viridis palettes (the ones behind `scale_*_viridis_c` and `scale_*_viridis_d`) are a particularly good default because they were engineered to be **perceptually uniform**: equal steps in the data look like equal steps in colour, so the scale does not exaggerate some ranges and flatten others. As a bonus, viridis varies strongly in lightness from dark to bright, which means it stays distinguishable for colourblind readers *and* survives being printed or photocopied in black and white.

Viridis shines for a continuous variable. Here Maya colours each day's point by its revenue, a number, so the **continuous** viridis scale (`_c`) is the right tool:

```r
ggplot(sales, aes(foot_traffic, revenue, colour = revenue)) +
  geom_point(size = 3) +
  scale_colour_viridis_c() +   # continuous viridis: low = dark, high = bright
  theme_minimal()
```

Darker points are low-revenue days, brighter ones are high-revenue days, and that reading holds even in greyscale because the scale changes lightness, not just hue.

[KEY INSIGHT]
viridis gives you two things at once: a perceptually uniform scale (equal data steps look equal) and colourblind-safe, greyscale-survivable colours. Use `scale_*_viridis_c()` for a continuous variable and `scale_*_viridis_d()` for categories.

=== step === quiz
::eyebrow Check yourself
## How should Maya colour her chart for everyone?

Maya needs her three-branch chart to be readable by her colourblind investor. Her colleague offers some advice. Which approach is actually correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Colour is just decoration here, so it does not matter which colours you use ::no Colour is carrying the group identity, that is meaning, not decoration. Picking colours a reader cannot distinguish makes the chart unreadable for them.
- Encode each branch by colour alone, but make the colours bright; readers will cope ::no Hue alone is exactly the trap. Bright similar-hue colours can still collapse for a colourblind reader. You need lightness differences and ideally a second, non-colour channel.
- Use a colourblind-safe palette (viridis or Okabe-Ito) and also distinguish the branches by a second channel like shape, so the chart never depends on hue alone ::ok Exactly. A safe palette plus a redundant non-colour channel means the chart survives for colourblind readers and even in greyscale.
- Red for one branch and green for another, since red versus green is the clearest contrast ::no Red versus green is the worst common choice: red-green deficiency is the most frequent kind, so those two can look identical. Prefer a colourblind-safe palette.

=== step === tryit
::eyebrow Your turn
## Make it survive without colour

Here is Maya's scatter coloured by branch with a colourblind-safe viridis palette already in place. To be safe even in pure greyscale, add a **second, non-colour channel**: map `shape` to `branch` as well, so each branch is both a colour *and* a marker shape. Fill in the missing `aes()` mapping.

```r
ggplot(sales, aes(foot_traffic, revenue, colour = branch, ____)) +
  geom_point(size = 3) +
  scale_colour_viridis_d() +
  theme_minimal()
```
::check {"regex":"shape\\s*=\\s*branch","gate":true,"difficulty":"intermediate","ok":"That is the redundancy that makes a chart robust: shape = branch adds a non-colour channel, so the branches stay distinct even if colour is lost.","no":"Map shape to branch inside aes(): shape = branch. Now each branch has its own marker shape as well as its own colour."}
::solution
```r
ggplot(sales, aes(foot_traffic, revenue, colour = branch, shape = branch)) +
  geom_point(size = 3) +
  scale_colour_viridis_d() +
  theme_minimal()
```

=== step === concept
::eyebrow Make it reusable
## Bake your style into one custom theme

Once Maya settles on a look, she does not want to retype the same theme tweaks on every chart. The trick is that a theme is just an R object, so you can **build your own and reuse it**. Start from a built-in theme, add a `theme()` layer to adjust individual elements, and save the result:

```r
# A reusable house style: start minimal, then tweak specific elements.
house_style <- theme_minimal() +
  theme(
    legend.position = "bottom",                              # legend under the plot
    plot.title      = element_text(face = "bold", size = 14) # bold, larger title
  )

ggplot(sales, aes(foot_traffic, revenue, colour = branch, shape = branch)) +
  geom_point(size = 3) +
  scale_colour_viridis_d() +
  labs(title = "Maya's branches: foot traffic vs revenue") +
  house_style                                                # apply it with one +
```

`theme()` is the fine-grained control panel: it sets individual pieces like `legend.position`, `plot.title`, axis text and gridlines, using helpers such as `element_text()` for text and `element_blank()` to remove an element entirely. Bundle the pieces you like into one object once, and every future chart gets the same look with a single `+ house_style`.

[NOTE]
`theme_*()` picks a complete preset; `theme()` overrides individual elements on top of it. Saving `preset + theme(...)` to an object gives you a consistent house style you can apply to any plot, the styling equivalent of writing a function once and reusing it.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [ggplot2 reference: complete themes](https://ggplot2.tidyverse.org/reference/ggtheme.html) - every built-in `theme_*()` with a preview of each look.
- [ggplot2 reference: scale_viridis_*](https://ggplot2.tidyverse.org/reference/scale_viridis.html) - the discrete and continuous viridis scales you used, with all their options.
- [Okabe and Ito, Color Universal Design (the colourblind-safe palette)](https://jfly.uni-koeln.de/color/) - the original source for the eight CVD-safe colours and the reasoning behind them.
- [ggplot2: Elegant Graphics for Data Analysis, the Themes chapter (free online)](https://ggplot2-book.org/themes) - the canonical treatment of theming and building your own, by the package author.

=== step === complete
## Lesson 2 complete

You restyled Maya's chart four ways, none of which touched a data point: a built-in `theme_*()` to swap the whole look, the right colour scale for the data type (`_d` for categories, `_c` for numbers), a colourblind-safe palette (viridis or Okabe-Ito) so every reader can see the groups, the habit of never relying on hue alone (adding `shape = branch` as a second channel), and a reusable `house_style` object so your look stays consistent across charts.

Next, Lesson 3: Annotate and Compose Plots. You have controlled *what* the chart shows and *how* it looks; now you will make it *explain itself* with annotations and reference lines, place non-overlapping labels with `ggrepel`, and stitch several plots into one figure with `patchwork`.
