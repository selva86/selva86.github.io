---
title: "Advanced Faceting in R: ggh4x, Nested and Per-Panel Axes"
slug: "Advanced-Faceting-in-R"
description: "Learn advanced faceting in R: control panel layout and free scales, restyle and move facet strips, then use ggh4x for nested facets and per-panel axes."
keywords: "advanced faceting in R, ggh4x, facet_nested, facetted_pos_scales, facet_grid2, nested facets, per-panel axes, free scales, ggplot2 facets, strip labels"
auto_link_terms: "advanced faceting|advanced faceting in R|nested facets|nested faceting|facet_nested|facetted_pos_scales|facet_grid2|per-panel axes|per-panel scales|free scales in facets|facet strip labels|ggh4x"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-27"
curriculum_id: "GG2-6.2"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Advanced Faceting"
sidebar_order: "86"
difficulty: "Advanced"
---

<p class="lead">Advanced faceting is the set of ggplot2 techniques for controlling a multi-panel plot beyond a plain <code>facet_wrap()</code>: free per-panel scales, panel sizing, strip placement and styling, panel order, and, with the ggh4x package, truly nested strips and a different axis on every panel.</p>

Faceting splits one plot into a grid of small panels, one per group, so you can compare groups side by side. If you have met `facet_wrap()` and `facet_grid()` before, you already know the basic move. This tutorial picks up right after that and gives you fine control over how those panels look and behave.

Everything here builds on ggplot2 and the built-in `mpg` dataset (fuel economy for 234 cars). The main sections run in your browser, so you can edit and re-run every example as you read. The final section uses an add-on package called ggh4x, which you run in your own R session; its output is shown as rendered images so you can still see exactly what it produces.

## How do you control panel layout and free scales in facet_wrap?

A plain `facet_wrap(~ class)` already splits `mpg` into one panel per vehicle class. The catch is that every panel is forced to share a single x and y scale at one fixed size. Advanced faceting begins the moment you want each panel to size itself to its own data rather than share one cramped scale, or to sit in an order you choose. Let us start from the payoff and add one control at a time.

Here is the baseline. We build a scatter of highway mileage (`hwy`) against engine size (`displ`), store it as an object called `p`, then split it by `class`.

```r title="Facet a scatter plot by vehicle class"
library(ggplot2)

# mpg has seven vehicle classes; faceting gives each its own panel
table(mpg$class)
#> 2seater    compact    midsize    minivan     pickup subcompact        suv
#>       5         47         41         11         33         35         62

p <- ggplot(mpg, aes(displ, hwy)) +
  geom_point(alpha = 0.6, colour = "#2c7fb8")

p + facet_wrap(vars(class))
```

The `table()` count confirms the seven groups we are about to split on, from just five 2-seaters up to sixty-two SUVs. We then saved the base plot once as `p`, so from now on we can bolt a facet layer onto it with a single `+`, where `vars(class)` names the column to split on (writing `~ class` does the same thing). The result is seven panels sharing identical axes, which makes cross-panel comparison honest: a point in the same spot means the same thing in every panel.

That shared axis is sometimes the problem. The 2-seater panel has only a few cars clustered in one corner, so most of its panel is empty. When each group lives in a different range, let each panel set its own limits with `scales`.

```r title="Give each panel its own axis range"
p + facet_wrap(vars(class), scales = "free")
```

`scales = "free"` frees both axes so every panel zooms to its own data. Use `"free_x"` or `"free_y"` to free just one axis. Notice how each panel now fills its space, but the axes no longer line up, so you can no longer eyeball differences between panels at a glance.

[WARNING]
**Free scales trade comparison for detail.** With free scales each panel has a different axis range, so a point that looks high in one panel may be lower in absolute terms than a point that looks low in another. Reach for free scales when the shape within each group matters more than comparing across groups.

You also control the grid shape. `ncol` and `nrow` set how many columns or rows of panels you get, and `dir` decides whether panels fill by row (`"h"`, the default) or by column (`"v"`).

```r title="Set the number of columns and fill direction"
p + facet_wrap(vars(class), ncol = 4, dir = "v")
```

Setting `ncol = 4` forces four panels per row, and `dir = "v"` fills them top to bottom before moving right. Layout control matters for reports: a wide 4-column grid fits a landscape page, while a tall 2-column grid suits a phone screen.

**Try it:** Put each drivetrain (`drv`) in its own panel, all on a single row. Start from the scaffold and change the faceting variable and the layout.

```r title="Your turn: facet by drivetrain in one row"
# Goal: one panel per drv, arranged in a single row.
# Change the variable inside vars() and add nrow = 1.
p + facet_wrap(vars(class))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Facet by drivetrain in one row"
p + facet_wrap(vars(drv), nrow = 1)
```

**Explanation:** `vars(drv)` splits on drivetrain (four-wheel, front, rear) and `nrow = 1` lines the three panels up in one row for an easy left-to-right read.

</details>

## When should you use facet_grid with free scales and space = "free"?

`facet_wrap()` lays panels out in a flowing grid. `facet_grid()` is different: it crosses one variable against another, so rows mean one thing and columns mean another. Use it when both splitting variables matter and you want a true matrix of panels.

The formula reads `rows ~ columns`. Here we cross drivetrain (rows) against cylinder count (columns).

```r title="Cross two variables in a panel grid"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl)
```

Every cell is one drivetrain-and-cylinder combination. Empty cells (like a rear-wheel 4-cylinder, which does not exist in the data) stay blank on purpose, which itself shows which drivetrain-and-cylinder combinations occur.

`facet_grid()` adds a second lever that `facet_wrap()` lacks: `space`. While `scales` frees each panel's axis range, `space` frees each panel's physical size so a panel with more categories gets more room. This pairing is especially useful for categorical summaries like boxplots.

```r title="Free both the scale and the panel size"
ggplot(mpg, aes(hwy, reorder(class, hwy))) +
  geom_boxplot() +
  facet_grid(drv ~ ., scales = "free_y", space = "free_y")
```

We put `class` on the y axis, ordered by its average `hwy` with `reorder()` so the boxes run low to high, and split into drivetrain rows with `drv ~ .` (the dot means "no column split"). `scales = "free_y"` lets each row show only the classes it actually contains, and `space = "free_y"` sizes each row to match how many classes it holds, so no box gets squashed. Without `space`, every row would be the same height and rows with few classes would waste space.

![Choosing between the scales and space arguments in facet_grid](screenshots/Advanced-Faceting-in-R-scales-space.webp)
*Figure 1: How the scales and space decisions differ in facet_grid.*

[KEY INSIGHT]
**scales frees the range, space frees the size.** Setting `scales = "free_y"` changes what numbers each panel's axis spans; setting `space = "free_y"` changes how tall the panel is drawn. They are independent, and for ragged categorical data you usually want both.

**Try it:** Take a boxplot of `hwy` by `class` split into drivetrain columns, and free the x axis range and width per column.

```r title="Your turn: free the x scale and space by column"
# Goal: add scales = "free_x" and space = "free_x".
ggplot(mpg, aes(hwy, class)) +
  geom_boxplot() +
  facet_grid(. ~ drv)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Free the x scale and space by column"
ggplot(mpg, aes(hwy, class)) +
  geom_boxplot() +
  facet_grid(. ~ drv, scales = "free_x", space = "free_x")
```

**Explanation:** `. ~ drv` splits into one column per drivetrain, and the two `free_x` settings let each column set its own x range and width instead of being stretched to a shared one.

</details>

## How do you build nested-looking strip labels in base ggplot2?

The strip is the little labelled bar on top of each panel. When two variables define your panels, you often want both names to show. Base ggplot2 can stack them, giving a nested look, without any extra package.

Pass two variables to `vars()` and use a labeller. `label_both` prints the variable name alongside its value, and by default it puts each variable on its own line.

```r title="Show both variables in stacked strip labels"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(drv, cyl), labeller = label_both)
```

Each strip now reads like `drv: 4` on one line and `cyl: 6` on the next. That two-line strip is what people mean by a "nested look": the outer grouping (drivetrain) sits above the inner grouping (cylinders). The panels themselves are still a flat wrap; only the labels are layered.

Long strip labels are a common headache because they get clipped. `label_wrap_gen()` wraps them onto multiple lines at a width you choose.

```r title="Wrap long strip labels onto multiple lines"
mpg$class_long <- paste("Vehicle class:", mpg$class)

ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(class_long), labeller = label_wrap_gen(width = 16))
```

We made a deliberately long label by pasting a prefix onto each class name. `label_wrap_gen(width = 16)` then breaks any label longer than 16 characters across lines so nothing is cut off. This is the cleanest fix for descriptive labels that would otherwise overflow their strip.

Sometimes you want the two variables merged into a single strip rather than stacked. `interaction()` glues them into one factor you can facet on.

```r title="Merge two variables into one strip"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(~ interaction(drv, cyl, sep = " / "))
```

`interaction(drv, cyl, sep = " / ")` creates labels like `4 / 6` in one line per panel. This keeps strips compact when a two-line label would be too tall.

[NOTE]
**Base ggplot2 stacks strips but does not draw a nesting line.** The layered `label_both` strips look grouped, yet there is no line or bracket tying the panels of one drivetrain together. Drawing that true hierarchy is exactly what the ggh4x package adds later in this tutorial.

**Try it:** Facet by both `year` and `drv`, and label each strip with its variable name using `label_both`.

```r title="Your turn: label year and drv in the strips"
# Goal: add labeller = label_both so both names show.
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(year, drv))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Label year and drv in the strips"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(year, drv), labeller = label_both)
```

**Explanation:** `label_both` turns each strip into a two-line label such as `year: 1999` over `drv: f`, making the two grouping variables unmistakable.

</details>

## How do you move and restyle facet strips?

By default strips sit on the top and right of the grid. You can move them and restyle them so the plot reads the way you want. Moving comes first.

In `facet_grid()`, the `switch` argument flips strips to the opposite side. `switch = "both"` moves the row strips to the left and the column strips to the bottom.

```r title="Switch strips to the left and bottom"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl, switch = "both")
```

Now the cylinder labels run along the bottom and the drivetrain labels down the left, which some readers find more natural because the labels sit next to the axes they relate to.

In `facet_wrap()`, the equivalent control is `strip.position`, and you pair it with `theme(strip.placement = "outside")` so the strip sits beyond the axis rather than crowding the panel.

```r title="Place wrap strips at the bottom, outside the axis"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(drv), strip.position = "bottom") +
  theme(strip.placement = "outside")
```

`strip.position = "bottom"` drops the strips under each panel, and `strip.placement = "outside"` pushes them past the axis text so they act like a second, per-panel axis title.

Styling is pure theme work. `strip.background` controls the strip's fill and border, and `strip.text` controls the label font.

```r title="Style the strip background and text"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ cyl) +
  theme(
    strip.background = element_rect(fill = "#2c3e50"),
    strip.text = element_text(colour = "white", face = "bold")
  )
```

We filled the strips with a dark slate colour and set the text to white and bold. The strips now read as clear section headers, which helps a busy grid feel organised.

[TIP]
**A dark strip with white bold text reads as a section header.** Pairing `strip.background` fill with a contrasting `strip.text` colour turns the strip from a faint label into a strong visual divider, which is worth doing whenever a grid has many panels.

**Try it:** Move the `class` strips to the left of each panel and place them outside the axis.

```r title="Your turn: move class strips to the left"
# Goal: add strip.position = "left" and strip.placement = "outside".
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(class))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Move class strips to the left, outside the axis"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(class), strip.position = "left") +
  theme(strip.placement = "outside")
```

**Explanation:** `strip.position = "left"` rotates the strips to the left edge, and `strip.placement = "outside"` moves them beyond the y axis so they never overlap the panel.

</details>

## How do you reorder panels and add total panels?

Panels appear in the order of the faceting variable's factor levels. For a plain character column like `class`, that means alphabetical order, which is rarely the most useful. Let us confirm the default, then change it.

```r title="Check the default alphabetical panel order"
levels(factor(mpg$class))
#> [1] "2seater" "compact" "midsize" "minivan" "pickup" "subcompact" "suv"
```

The classes come out alphabetically, so `pickup` sits in the middle even though it has the worst mileage. To order panels by a meaningful number, use `reorder()`, which sets the factor levels by a summary statistic.

```r title="Reorder classes by median highway mileage"
mpg$class_ord <- reorder(mpg$class, mpg$hwy, FUN = median)
levels(mpg$class_ord)
#> [1] "pickup" "suv" "minivan" "2seater" "subcompact" "compact" "midsize"
```

`reorder(mpg$class, mpg$hwy, FUN = median)` builds a factor whose levels run from the lowest median `hwy` to the highest. The printed levels confirm it: pickups and SUVs (thirsty) now come first and compacts and midsize cars (efficient) come last. Faceting on this new column arranges the panels as a ranking.

```r title="Facet in the reordered sequence"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(class_ord))
```

The panels now run from worst to best mileage, left to right, top to bottom. Reordering is one of the highest-value faceting tweaks because it lets the layout itself carry the message.

[TIP]
**Reorder panels by a statistic to turn a facet grid into a ranking.** Passing a numeric column and a summary function to `reorder()` sorts the panels so the reader sees the ordering you care about without reading a single number.

A different need is a totals panel that shows every group combined next to the split panels. `facet_grid()` does this with `margins = TRUE`.

```r title="Add an all-groups totals panel"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(drv ~ ., margins = TRUE)
```

`margins = TRUE` adds one extra panel labelled `(all)` that pools every drivetrain, so readers can compare each group against the overall pattern in the same view. This is handy for dashboards where the total matters as much as the parts.

**Try it:** Split by `drv` across columns and add a combined column that shows all drivetrains together.

```r title="Your turn: add a totals column"
# Goal: add margins = TRUE to the facet_grid call.
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(. ~ drv)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Add a totals column with margins"
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_grid(. ~ drv, margins = TRUE)
```

**Explanation:** `margins = TRUE` appends an `(all)` column pooling every drivetrain, so the combined view sits right beside the per-drivetrain panels.

</details>

## How do you highlight one panel against the full dataset?

A faceted plot answers "what does each group look like on its own", but it hides "how does each group compare to everyone else". The fix is a classic trick: draw the entire dataset in grey behind every panel, then draw each panel's own subset in colour on top.

The key move is a background layer whose data has the faceting variable removed. Because that layer has no `class` column, it cannot be split, so ggplot2 repeats it in every panel.

```r title="Show each class against a grey backdrop of all cars"
mpg_all <- transform(mpg, class = NULL)

ggplot(mpg, aes(displ, hwy)) +
  geom_point(data = mpg_all, colour = "grey80") +
  geom_point(colour = "#d95f0e") +
  facet_wrap(vars(class))
```

`transform(mpg, class = NULL)` copies the data and drops the `class` column, giving us `mpg_all`. The first `geom_point()` draws that full backdrop in light grey; the second draws the faceted subset in orange. Every panel now shows its own cars in context, so you can see instantly that 2-seaters sit in the high-power, low-mileage corner while compacts cluster the other way.

[KEY INSIGHT]
**A layer without the faceting variable is repeated in every panel.** Faceting only splits layers that contain the split column. Strip that column from a layer's data and ggplot2 has nothing to split on, so the whole layer shows up identically behind each panel, which is exactly what you want for a shared reference.

**Try it:** Build the same highlight effect for `drv` instead of `class`.

```r title="Your turn: highlight each drivetrain"
# Goal: make a grey backdrop with drv removed, then colour on top.
bg <- transform(mpg, drv = NULL)
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(drv))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Highlight each drivetrain against all cars"
bg <- transform(mpg, drv = NULL)

ggplot(mpg, aes(displ, hwy)) +
  geom_point(data = bg, colour = "grey80") +
  geom_point(colour = "#1b9e77") +
  facet_wrap(vars(drv))
```

**Explanation:** Dropping `drv` from `bg` makes the grey layer facet-free, so all cars appear behind each drivetrain panel while the coloured points mark the current group.

</details>

## When do you need ggh4x, and what does it add?

Base ggplot2 took us a long way: free scales, panel sizing, strip control, panel ordering and the highlight trick. Three things it genuinely cannot do are draw a true nesting line above grouped strips, put a different scale on individual panels, or free scales fully independently in a grid. The ggh4x package fills exactly those gaps.

![A decision path for choosing base ggplot2 versus ggh4x](screenshots/Advanced-Faceting-in-R-decision-flow.webp)
*Figure 2: Base ggplot2 first, ggh4x only when you need it.*

The examples below use ggh4x, which is not one of the packages available in the interactive runner on this page. Install it once with `install.packages("ggh4x")` and run these snippets in your own R session such as RStudio or the R console. Each block is followed by its real rendered output so you can see the effect without running anything.

The first gap is real nesting. `facet_nested()` reads a formula like `outer + inner` and draws a spanning strip for the outer group above the inner strips, with a connecting line. Here manufacturers are nested inside a region.

```r-static title="Draw truly nested strips with facet_nested"
library(ggh4x)

mpg_eu <- subset(mpg, manufacturer %in%
                   c("audi", "volkswagen", "toyota", "honda"))
mpg_eu$origin <- ifelse(mpg_eu$manufacturer %in% c("audi", "volkswagen"),
                        "Europe", "Asia")

ggplot(mpg_eu, aes(displ, hwy)) +
  geom_point(colour = "#2c7fb8") +
  facet_nested(~ origin + manufacturer)
```

![facet_nested draws a region strip spanning its manufacturers](screenshots/Advanced-Faceting-in-R-facet-nested.png)
*Figure 3: facet_nested() draws hierarchy lines above grouped strips.*

The `origin` strip now spans its manufacturers with a clear bar, so the two-level grouping is unmistakable. Base ggplot2 could stack these labels but never draw that spanning header.

The second gap is per-panel axes. `facetted_pos_scales()` lets you hand it a list of scales, one per panel, so each panel can use a different transformation or label format.

```r-static title="Give each panel its own x scale with facetted_pos_scales"
ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#2c7fb8") +
  facet_wrap(vars(drv), scales = "free_x") +
  facetted_pos_scales(x = list(
    scale_x_continuous(limits = c(1, 7)),
    scale_x_reverse(),
    scale_x_continuous(labels = scales::label_number(suffix = "L"))
  ))
```

![Each drivetrain panel uses a different x scale](screenshots/Advanced-Faceting-in-R-pos-scales.png)
*Figure 4: facetted_pos_scales() gives each panel its own x scale.*

The three panels now use three different x scales: a fixed 1-to-7 range, a reversed axis, and an axis whose labels carry an "L" suffix for litres. You must set `scales = "free_x"` first so ggplot2 allows per-panel scales, then `facetted_pos_scales()` assigns them in order.

The third gap is fully independent grid scales. Base `facet_grid()` shares scales along each row and column even when free; `facet_grid2()` with `independent = "all"` frees every panel completely.

```r-static title="Free every panel in a grid with facet_grid2"
ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#2c7fb8") +
  facet_grid2(vars(drv), vars(year),
              scales = "free", independent = "all")
```

![Every panel in the grid has its own independent axes](screenshots/Advanced-Faceting-in-R-facet-grid2.png)
*Figure 5: facet_grid2(independent = "all") frees every panel's axes.*

Every panel now has its own x and y range, even panels in the same row or column. That is impossible in base `facet_grid()`, where free scales are still shared down each column and across each row.

[NOTE]
**ggh4x swaps only the facet layer, so your plot code is unchanged.** Notice that the `ggplot()`, `aes()`, and `geom_point()` lines are identical to the base examples. You only replace `facet_wrap()` or `facet_grid()` with the ggh4x version, which makes ggh4x cheap to adopt when a plot truly needs it.

**Try it locally:** In your own R session, take the nested example and add `nest_line = element_line(colour = "grey40")` inside `facet_nested()` to draw a visible connector between the region strip and its manufacturers. Compare it to the default and decide which reads better for your data.

## Practice Exercises

These capstone exercises combine several techniques from the tutorial. They all use base ggplot2, so you can run and check them in your browser. Each starter block runs as-is; edit it toward the goal, then reveal the solution.

### Exercise 1: Rank panels and brand them

Reorder the `class` panels by their median `hwy`, free the y scale per panel, and give the strips a dark background with white bold text.

```r title="Exercise 1 starter: rank and brand panels"
# Reorder class by median hwy, free the y axis, and style the strips.
# Start from this plain version and add the three pieces.
ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#2c7fb8") +
  facet_wrap(vars(class))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution: ranked, branded panels"
mpg$cap_class <- reorder(mpg$class, mpg$hwy, FUN = median)

ggplot(mpg, aes(displ, hwy)) +
  geom_point(colour = "#2c7fb8") +
  facet_wrap(vars(cap_class), scales = "free_y") +
  theme(
    strip.background = element_rect(fill = "#2c3e50"),
    strip.text = element_text(colour = "white", face = "bold")
  )
```

**Explanation:** `reorder()` orders the panels worst-to-best mileage, `scales = "free_y"` lets each panel size its own y range, and the two theme lines turn the strips into dark headers. Three independent techniques combine cleanly on one plot.

</details>

### Exercise 2: Highlight with relocated strips

Draw every `class` against a grey backdrop of all cars (the highlight trick), and move the strips to the bottom, outside the axis.

```r title="Exercise 2 starter: highlight plus strip move"
# Make a grey backdrop with class removed, colour each panel on top,
# then move the strips to the bottom and outside the axis.
ggplot(mpg, aes(displ, hwy)) +
  geom_point() +
  facet_wrap(vars(class))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution: highlight with bottom strips"
cap_bg <- transform(mpg, class = NULL)

ggplot(mpg, aes(displ, hwy)) +
  geom_point(data = cap_bg, colour = "grey80") +
  geom_point(colour = "#d95f0e") +
  facet_wrap(vars(class), strip.position = "bottom") +
  theme(strip.placement = "outside")
```

**Explanation:** Removing `class` from `cap_bg` makes the grey layer repeat in every panel, the orange layer marks the current class, and the two strip settings drop the labels below each panel outside the axis.

</details>

### Exercise 3: A ragged categorical grid

Build a boxplot of `hwy` by `class`, split into drivetrain rows, and use free scales, free space, and a totals row so each row is sized to its classes and an `(all)` row pools everything.

```r title="Exercise 3 starter: ragged boxplot grid"
# Add scales = "free_y", space = "free_y", and margins = TRUE
# to the facet_grid call.
ggplot(mpg, aes(hwy, class)) +
  geom_boxplot() +
  facet_grid(drv ~ .)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution: ragged boxplot grid"
ggplot(mpg, aes(hwy, class)) +
  geom_boxplot() +
  facet_grid(drv ~ ., scales = "free_y", space = "free_y", margins = TRUE)
```

**Explanation:** `scales = "free_y"` shows only the classes present in each drivetrain, `space = "free_y"` sizes each row to its class count, and `margins = TRUE` adds an `(all)` row pooling every drivetrain for reference.

</details>

## Frequently Asked Questions

**When should I use free scales instead of fixed scales?**
Use fixed scales (the default) when comparing groups against each other is the point, because shared axes make positions directly comparable. Switch to free scales when the shape or trend within each group matters more and the groups live in very different ranges. Free scales make each panel readable but remove the ability to compare across panels at a glance.

**What is the difference between scales and space in facet_grid?**
`scales` controls the axis range shown in each panel, while `space` controls how much physical room each panel gets. Freeing `scales` lets a panel zoom to its data; freeing `space` lets a panel with more categories be drawn larger. For ragged categorical data such as boxplots with different numbers of categories per panel, you usually free both together.

**Can I get nested strip labels without ggh4x?**
Yes, up to a point. Passing two variables to `vars()` with `labeller = label_both` stacks both labels, giving a nested look. What base ggplot2 cannot do is draw the spanning bar and connecting line that visually group the inner panels under one outer label. For that true hierarchy you need `facet_nested()` from ggh4x.

**Does ggh4x replace ggplot2?**
No. ggh4x is a small extension that adds new `facet_*` functions and a few scale helpers on top of ggplot2. Your `ggplot()`, `aes()`, and `geom_*` code stays exactly the same; you only swap the faceting layer. You still load and use ggplot2 as usual.

**How do I show axis labels on inner panels of a grid?**
Base ggplot2 draws axes only on the outer edges of a facet grid. The `facet_grid2()` and `facet_wrap2()` functions in ggh4x accept an `axes = "all"` argument that draws ticks and labels on inner panels too, with a `remove_labels` option to keep the ticks but drop repeated labels. This helps when a large grid makes readers scan far to find the nearest axis.

**My plot has too many panels to read. What should I do?**
First cut the number of groups, for example by collapsing rare categories into an "Other" bucket before faceting. If every group must stay, use `ncol` and `nrow` to shape the grid to your page, free scales so small panels stay legible, and consider the grey-backdrop highlight so each panel still carries context. A grid of 30 tiny panels rarely communicates better than a well-chosen six.

## Summary

Advanced faceting is mostly about control: which panels appear, in what order, at what size, carrying which labels. Base ggplot2 handles the large majority of that, and ggh4x covers the few things it cannot.

| Technique | Function or argument |
|---|---|
| Panel layout | `facet_wrap(ncol=, nrow=, dir=)` |
| Free per-panel scales | `scales = "free"`, `"free_x"`, `"free_y"` |
| Free per-panel size | `facet_grid(space = "free_y")` |
| Stacked nested-look labels | `facet_wrap(vars(a, b), labeller = label_both)` |
| Wrap long labels | `label_wrap_gen(width = )` |
| Move strips | `switch=` (grid), `strip.position=` (wrap) |
| Style strips | `theme(strip.background, strip.text)` |
| Reorder panels | `reorder()` or `forcats::fct_reorder()` |
| Totals panel | `facet_grid(margins = TRUE)` |
| Highlight against all data | grey layer with the facet variable removed |
| True nested strips | `ggh4x::facet_nested()` |
| Per-panel axes | `ggh4x::facetted_pos_scales()` |
| Fully independent grid scales | `ggh4x::facet_grid2(independent = "all")` |

![The advanced faceting toolkit as a mind map](screenshots/Advanced-Faceting-in-R-overview-mindmap.webp)
*Figure 6: The advanced-faceting toolkit at a glance.*

The workflow is reliable: reach for base ggplot2 first, and add ggh4x only when you hit true nesting, per-panel axes, or fully independent scales. Because ggh4x changes only the facet layer, you can start in base ggplot2 and upgrade a single line when the plot demands it.

## References

1. ggplot2 documentation. *Wrap a 1d ribbon of panels into 2d: facet_wrap()*. [Link](https://ggplot2.tidyverse.org/reference/facet_wrap.html)
2. ggplot2 documentation. *Lay out panels in a grid: facet_grid()*. [Link](https://ggplot2.tidyverse.org/reference/facet_grid.html)
3. ggplot2 documentation. *Labeller functions, including label_both and label_wrap_gen*. [Link](https://ggplot2.tidyverse.org/reference/labeller.html)
4. Wickham, H., Navarro, D., Pedersen, T. L. *ggplot2: Elegant Graphics for Data Analysis*, Faceting chapter. [Link](https://ggplot2-book.org/facet)
5. Brand, T. van den. *ggh4x: Facets vignette*. [Link](https://teunbrand.github.io/ggh4x/articles/Facets.html)
6. Brand, T. van den. *ggh4x reference: facet_nested()*. [Link](https://teunbrand.github.io/ggh4x/reference/facet_nested.html)
7. Brand, T. van den. *ggh4x reference: facetted_pos_scales()*. [Link](https://teunbrand.github.io/ggh4x/reference/facetted_pos_scales.html)
8. Brand, T. van den. *ggh4x reference: facet_grid2()*. [Link](https://teunbrand.github.io/ggh4x/reference/facet_grid2.html)

## Continue Learning

- [ggplot2 Facets](ggplot2-Facets.html): the foundations of `facet_wrap()` and `facet_grid()` that this tutorial builds on.
- [Small Multiples in R](Small-Multiples-in-R.html): design principles for reading a grid of related panels well.
- [Multi-Panel Figures in R](Multi-Panel-Figures-in-R.html): combine several different plots into one figure with patchwork.
- [ggplot2 Themes](ggplot2-Themes-in-R.html): go deeper on theming, including the strip elements you styled here.
