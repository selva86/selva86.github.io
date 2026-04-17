---
title: "ggplot2 Legends in R: Position, Remove, Rename & Customize Completely"
slug: "ggplot2-Legends-in-R"
description: "Master ggplot2 legends in R: move with theme(legend.position), remove with guides(fill=\"none\"), rename with labs(), and customize keys with guide_legend()."
keywords: "ggplot2 legend, ggplot2 legend position, remove legend ggplot2, ggplot2 legend title, guide_legend, ggplot2 customize legend, R ggplot legend, legend.position"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-ggpl-1"
post_type: "C"
auto_link_terms: "ggplot2 legend|ggplot2 legends|legend position ggplot2|remove legend ggplot2|guide_legend()|legend.position"
auto_link_case_sensitive: false
fr_parent: "ggplot2-Themes-in-R.html"
sidebar_section: "Visualization"
sidebar_title: "ggplot2 Legends"
difficulty: "Intermediate"
---

# ggplot2 Legends in R: Position, Remove, Rename & Customize Completely

<p class="lead">ggplot2 legends map visual aesthetics, colour, fill, shape, size, back to the data values they represent. You control them through three levers: <code>theme()</code> for position and appearance, <code>labs()</code> or <code>scale_*()</code> for titles and labels, and <code>guides()</code> for fine-grained guide behaviour.</p>

## Introduction

Every ggplot2 plot that maps a variable to a visual aesthetic generates a legend automatically. That automatic legend is functional, but it rarely matches what you need for a report, presentation, or publication. The title might be a column name like `cyl`, the labels might be cryptic factor levels, and the position might crowd the plot area.

This tutorial gives you full control over ggplot2 legends. You will learn how to move, remove, rename, reorder, and visually customize every part of a legend. Each technique builds on the previous one, so by the end you will be able to produce publication-ready legend layouts from scratch.

All code runs interactively in the browser. We use ggplot2 and the built-in `mpg` dataset throughout. Let's start by loading our library and creating a base plot that we will reuse across sections.

```r
# Load ggplot2 and create a reusable base plot
library(ggplot2)

p_base <- ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2.5)

p_base
#> A scatter plot of engine displacement vs highway mpg
#> with points coloured by vehicle class (7 classes).
#> A colour legend appears on the right by default.
```

This base plot maps `class` to `colour`, so ggplot2 shows a colour legend on the right. We will modify this legend step by step in every section below.

## How does ggplot2 decide which legends to show?

The rule is simple: any variable mapped inside `aes()` generates a legend. Any aesthetic set to a fixed value outside `aes()` does not.

Let's see this in action. Our `p_base` plot maps `colour = class` inside `aes()`, so a colour legend appears. Now compare that with setting `colour` to a fixed value outside `aes()`.

```r
# Fixed colour outside aes() — no legend generated
p_no_legend <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "steelblue", size = 2.5)

p_no_legend
#> Same scatter plot, but all points are steel blue.
#> No legend appears because colour is not mapped to data.
```

When you set `colour = "steelblue"` outside `aes()`, ggplot2 applies that colour to every point. There is no data-to-colour mapping, so no legend is needed.

[KEY INSIGHT]
**Aesthetics inside aes() generate legends, aesthetics outside do not.** If a legend is missing, the first thing to check is whether the variable is inside `aes()`. If it is not, ggplot2 has no mapping to display.

When you map the same variable to multiple aesthetics, say `colour = class` and `shape = class`, ggplot2 merges them into a single legend. If you map different variables, you get separate legends for each.

**Try it:** Create a scatter plot of `mpg` mapping `drv` to `shape`. Verify that a shape legend appears on the right.

```r
# Try it: map drv to shape
ex_shape <- ggplot(mpg, aes(x = displ, y = hwy, shape = drv)) +
  geom_point(size = 2.5)

# your code here — or just run the above

ex_shape
#> Expected: scatter plot with a shape legend showing f, r, 4
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_shape <- ggplot(mpg, aes(x = displ, y = hwy, shape = drv)) +
  geom_point(size = 2.5)
ex_shape
#> Scatter plot with three shapes (circle, triangle, square)
#> and a legend labelled "drv" showing f, r, 4.
```

**Explanation:** Mapping `drv` inside `aes(shape = drv)` tells ggplot2 to assign a different shape to each drive type, which generates a shape legend automatically.

</details>

## How do you change the legend position?

The `theme(legend.position)` argument accepts `"top"`, `"bottom"`, `"left"`, `"right"`, or `"inside"`. The default is `"right"`.

Moving the legend to the top or bottom works well when you have a wide plot and the legend has many items. Let's move our base plot's legend to the bottom.

```r
# Move legend to the bottom
p_base +
  theme(legend.position = "bottom")
#> Same scatter plot, but the colour legend now sits
#> below the plot area in a horizontal row.
```

The legend switches to horizontal layout automatically when placed at the top or bottom. That keeps it compact and out of the way.

For more precise control, you can place the legend inside the plot area. In ggplot2 3.5+, use `legend.position = "inside"` combined with `legend.position.inside` to set the exact coordinates (values from 0 to 1, where `c(0, 0)` is bottom-left and `c(1, 1)` is top-right).

```r
# Place legend inside the plot at the top-right corner
p_base +
  theme(
    legend.position = "inside",
    legend.position.inside = c(0.85, 0.75),
    legend.background = element_rect(fill = "white", colour = "grey80"),
    legend.key.size = unit(0.4, "cm")
  )
#> Scatter plot with a compact legend box inside the plot
#> near the top-right corner, on a white background.
```

The white background with a subtle border prevents the legend from blending into the data points. Adjust the `c(x, y)` coordinates to find the spot with the least overlap.

[TIP]
**Always add a background when placing legends inside the plot.** Without `legend.background = element_rect(fill = "white")`, legend text overlaps data points and becomes unreadable.

**Try it:** Place the legend at the bottom-left inside the plot area. Use coordinates `c(0.15, 0.25)`.

```r
# Try it: legend inside at bottom-left
p_base +
  theme(
    legend.position = "inside",
    legend.position.inside = c(0.15, 0.25)
    # your code here — add a white background
  )
#> Expected: legend near bottom-left inside the plot
```

<details>
<summary>Click to reveal solution</summary>

```r
p_base +
  theme(
    legend.position = "inside",
    legend.position.inside = c(0.15, 0.25),
    legend.background = element_rect(fill = "white", colour = "grey80")
  )
#> Legend appears inside the plot near the bottom-left,
#> with a white background box.
```

**Explanation:** `legend.position.inside = c(0.15, 0.25)` places the legend 15% from the left edge and 25% from the bottom.

</details>

## How do you remove a legend entirely or selectively?

There are three ways to remove legends, and each serves a different purpose. Picking the wrong one is a common source of frustration.

**Method 1: Remove all legends at once.** Use `theme(legend.position = "none")`. This is the nuclear option, every legend disappears.

```r
# Remove all legends
p_base +
  theme(legend.position = "none")
#> Scatter plot with coloured points but no legend at all.
#> The reader cannot tell which colour maps to which class.
```

**Method 2: Remove one specific legend.** Use `guides()` to target a single aesthetic. This is what you want when your plot has multiple legends and you only need to drop one.

```r
# Plot with two legends: colour and size
p_two <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cty)) +
  geom_point(alpha = 0.7)

# Remove only the size legend, keep colour
p_two +
  guides(size = "none")
#> Scatter plot with colour legend (7 classes) visible
#> but no size legend. Points still vary in size.
```

**Method 3: Suppress a single layer's legend contribution.** Use `show.legend = FALSE` inside a geom. This is useful when you have overlapping layers and one layer adds unwanted entries.

```r
# Two layers: points + smooth. Suppress smooth's legend entry.
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2) +
  geom_smooth(method = "lm", se = FALSE, show.legend = FALSE)
#> Scatter plot with coloured points and regression lines.
#> The legend shows only the point colours, not the lines.
```

The `show.legend = FALSE` on `geom_smooth()` prevents the smooth lines from adding entries to the colour legend. Without it, you would see both point and line keys for each class.

[WARNING]
**theme(legend.position = "none") removes ALL legends.** If you only want to drop one, use `guides(colour = "none")` or `guides(size = "none")` to target the specific aesthetic.

**Try it:** Create a plot with both `colour = class` and `size = displ` mapped. Then remove only the size legend using `guides()`.

```r
# Try it: remove only the size legend
ex_remove <- ggplot(mpg, aes(x = cty, y = hwy, colour = class, size = displ)) +
  geom_point(alpha = 0.6)

# your code here — add guides() to remove size

ex_remove
#> Expected: colour legend visible, size legend gone
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_remove <- ggplot(mpg, aes(x = cty, y = hwy, colour = class, size = displ)) +
  geom_point(alpha = 0.6) +
  guides(size = "none")
ex_remove
#> Scatter plot with colour legend for class.
#> Size varies by displ but no size legend is shown.
```

**Explanation:** `guides(size = "none")` targets the size aesthetic specifically, leaving the colour legend untouched.

</details>

## How do you rename the legend title and labels?

The legend title defaults to the variable name, `class`, `drv`, `cyl`. That is rarely what you want in a finished plot. There are two things to rename: the title (the heading above the legend) and the labels (the text next to each key).

**Rename the title** with `labs()`. This is the quickest approach and handles most cases.

```r
# Rename the colour legend title
p_base +
  labs(colour = "Vehicle Class")
#> Same scatter plot, but the legend heading now reads
#> "Vehicle Class" instead of "class".
```

The `labs()` function accepts the aesthetic name as the argument. Use `labs(fill = "...")` for fill legends, `labs(shape = "...")` for shape legends, and so on.

**Rename individual labels** with `scale_colour_discrete(labels = ...)`. This changes the text next to each key without affecting the underlying data.

```r
# Rename specific labels
p_base +
  labs(colour = "Vehicle Class") +
  scale_colour_discrete(
    labels = c("2seater" = "2-Seater", "compact" = "Compact",
               "midsize" = "Midsize", "minivan" = "Minivan",
               "pickup" = "Pickup", "subcompact" = "Subcompact",
               "suv" = "SUV")
  )
#> Legend now shows clean labels: "2-Seater", "Compact",
#> "Midsize", etc., instead of the raw factor levels.
```

**Reorder legend items** by changing the factor levels of the variable. The legend order follows the factor level order.

```r
# Reorder legend: put SUV first, then pickup, then the rest
mpg_reordered <- mpg
mpg_reordered$class <- factor(
  mpg$class,
  levels = c("suv", "pickup", "minivan", "midsize",
             "compact", "subcompact", "2seater")
)

ggplot(mpg_reordered, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2.5) +
  labs(colour = "Vehicle Class")
#> Legend items now appear in the order: suv, pickup,
#> minivan, midsize, compact, subcompact, 2seater.
```

Releveling the factor changes both the legend order and the colour assignment. If you want to keep the original colours but just reorder the legend, use `limits` inside `scale_colour_discrete()` instead.

[TIP]
**Use labs() for titles, scale_*_discrete(labels=) for label text.** Mixing them up is a frequent mistake. labs() only controls the title heading, not the individual key labels.

**Try it:** Rename the fill legend title to "Drive Type" using `labs()` on a bar chart of `mpg` counted by `drv`.

```r
# Try it: rename the fill legend title
ex_rename <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()

# your code here — add labs() to rename fill title

ex_rename
#> Expected: bar chart with legend titled "Drive Type"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rename <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar() +
  labs(fill = "Drive Type")
ex_rename
#> Stacked bar chart with the fill legend titled "Drive Type"
#> instead of the default "drv".
```

**Explanation:** `labs(fill = "Drive Type")` sets the title for the fill aesthetic legend. Use the aesthetic name as the argument.

</details>

## How do you customize legend appearance with theme()?

The `theme()` function controls every visual property of the legend: fonts, colours, backgrounds, key sizes, spacing, and direction. This is your primary tool for making legends look polished.

Let's start with styling the legend text. You can make the title bold and larger, and the labels italic or a different colour.

```r
# Style legend title and labels
p_base +
  labs(colour = "Vehicle Class") +
  theme(
    legend.title = element_text(face = "bold", size = 13),
    legend.text = element_text(colour = "grey30", size = 10)
  )
#> Legend title "Vehicle Class" appears bold and larger.
#> Legend labels appear in dark grey at a smaller size.
```

The `element_text()` function accepts `face` (bold, italic, bold.italic), `size`, `colour`, `family`, and `hjust`/`vjust` for alignment. Use it with any `legend.*` theme element that controls text.

Next, let's customize the legend keys, the small coloured squares or circles next to each label.

```r
# Change legend key background and size
p_base +
  labs(colour = "Vehicle Class") +
  theme(
    legend.key = element_rect(fill = "white", colour = NA),
    legend.key.size = unit(0.6, "cm")
  )
#> Legend keys now have a clean white background (no grey)
#> and are slightly larger at 0.6 cm.
```

The default grey key background (`legend.key = element_rect(fill = "grey95")`) can make subtle colours hard to see. Setting it to white cleans up the appearance.

You can also change the legend direction from vertical (the default for side placement) to horizontal. This is especially useful when the legend sits at the top or bottom.

```r
# Horizontal legend
p_base +
  labs(colour = "Vehicle Class") +
  theme(
    legend.position = "bottom",
    legend.direction = "horizontal"
  )
#> Legend at the bottom with all 7 class entries
#> displayed in a single horizontal row.
```

When you have many legend items, a single horizontal row can get cramped. Combine `legend.direction` with `guide_legend(nrow = ...)` (covered in the next section) to wrap items across multiple rows.

[NOTE]
**ggplot2 3.5+ moved many guide-level settings into theme().** Properties like `legend.frame`, `legend.axis.line`, and `legend.key.spacing` are now theme arguments rather than guide parameters. Check the ggplot2 3.5.0 changelog if you are updating old code.

**Try it:** Make the legend keys 1.5 cm wide and remove the grey key background.

```r
# Try it: wider keys, no background
p_base +
  theme(
    legend.key.width = unit(1.5, "cm")
    # your code here — set legend.key fill to white
  )
#> Expected: wider legend keys on a white background
```

<details>
<summary>Click to reveal solution</summary>

```r
p_base +
  theme(
    legend.key.width = unit(1.5, "cm"),
    legend.key = element_rect(fill = "white", colour = NA)
  )
#> Legend keys are now 1.5 cm wide with a clean white
#> background instead of the default grey.
```

**Explanation:** `legend.key.width` sets the horizontal size. `element_rect(fill = "white", colour = NA)` removes both the grey fill and the border.

</details>

## How do you use guides() and guide_legend() for advanced control?

The `guides()` function assigns a guide type to each aesthetic, and `guide_legend()` gives you fine-grained control over layout and key appearance. This is the power tool for complex legend customization.

**Control the legend layout** with `nrow` and `ncol` inside `guide_legend()`. This is essential when a horizontal legend has too many items for one row.

```r
# Wrap legend into 2 rows
p_base +
  labs(colour = "Vehicle Class") +
  guides(colour = guide_legend(nrow = 2)) +
  theme(legend.position = "bottom")
#> Legend at the bottom with vehicle classes
#> wrapped across 2 horizontal rows.
```

Two rows keep the legend compact without making the text too small. For 10+ items, use 3 rows.

**Override the appearance of legend keys** with `override.aes`. This is the solution when your plot uses tiny or transparent points that are hard to read in the legend.

```r
# Points are small and transparent in the plot,
# but large and opaque in the legend
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 1, alpha = 0.4) +
  guides(colour = guide_legend(override.aes = list(size = 4, alpha = 1))) +
  labs(colour = "Vehicle Class")
#> Scatter plot with tiny, semi-transparent points.
#> Legend keys show large, fully opaque points for readability.
```

Without `override.aes`, the legend keys would be just as tiny and faded as the plot points. The override lets you decouple the legend appearance from the plot aesthetics.

**Use guide_colorbar() for continuous scales.** When you map a continuous variable to colour, ggplot2 shows a colour bar instead of discrete keys. You can control its dimensions and appearance.

```r
# Continuous colour scale with a customized colour bar
p_cont <- ggplot(mpg, aes(x = displ, y = hwy, colour = cty)) +
  geom_point(size = 2.5) +
  scale_colour_viridis_c() +
  labs(colour = "City MPG") +
  guides(colour = guide_colorbar(
    barwidth = unit(12, "cm"),
    barheight = unit(0.5, "cm"),
    title.position = "top"
  )) +
  theme(legend.position = "bottom")

p_cont
#> Scatter plot coloured by city mpg on a viridis scale.
#> A wide, thin colour bar sits at the bottom with
#> "City MPG" as the title above it.
```

The wide, thin bar works well at the bottom of a plot. Adjust `barwidth` and `barheight` to match your figure dimensions.

[KEY INSIGHT]
**override.aes is the tool when plot aesthetics make legend keys unreadable.** Tiny points, low alpha, or thin lines in the plot can all be overridden in the legend. This creates clear, readable keys without changing the plot itself.

**Try it:** Create a colour legend laid out in 3 columns using `guide_legend(ncol = 3)`.

```r
# Try it: 3-column legend layout
p_base +
  guides(colour = guide_legend(ncol = 3)) +
  theme(legend.position = "bottom")
  # your code here — or just run the above

#> Expected: legend at bottom with 3 columns of class entries
```

<details>
<summary>Click to reveal solution</summary>

```r
p_base +
  guides(colour = guide_legend(ncol = 3)) +
  theme(legend.position = "bottom")
#> Legend at the bottom arranged in 3 columns.
#> 7 items fill 3 columns across about 3 rows.
```

**Explanation:** `guide_legend(ncol = 3)` distributes the legend keys across 3 columns. ggplot2 calculates the number of rows automatically.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Setting colour outside aes() and expecting a legend

This is the most common legend problem. You set a colour directly, then wonder why no legend appears.

❌ **Wrong:**
```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "red", size = 2)
# No legend appears — colour is not mapped to data.
```

**Why it is wrong:** ggplot2 only creates legends for aesthetics mapped inside `aes()`. Setting `colour = "red"` applies a fixed colour to all points with no data mapping.

✅ **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2)
# Legend appears because colour is mapped to the class variable.
```

### Mistake 2: Using theme(legend.position = "none") to remove one legend

When your plot has both a colour and a size legend, `theme(legend.position = "none")` removes both.

❌ **Wrong:**
```r
ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cty)) +
  geom_point() +
  theme(legend.position = "none")
# Both colour AND size legends are gone.
```

**Why it is wrong:** `legend.position = "none"` is a blanket removal. It does not discriminate between aesthetics.

✅ **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cty)) +
  geom_point() +
  guides(size = "none")
# Only size legend is removed. Colour legend remains.
```

### Mistake 3: Trying to rename labels with labs()

`labs()` sets the legend title, not the individual labels. Using it and expecting label changes leads to confusion.

❌ **Wrong:**
```r
p_base +
  labs(colour = c("2-Seater", "Compact", "Midsize"))
# This does NOT rename individual labels.
# It may produce an error or unexpected title.
```

**Why it is wrong:** `labs()` expects a single string for the title. Pass a named vector to `scale_colour_discrete(labels = ...)` instead.

✅ **Correct:**
```r
p_base +
  labs(colour = "Vehicle Class") +
  scale_colour_discrete(
    labels = c("2seater" = "2-Seater", "compact" = "Compact",
               "midsize" = "Midsize")
  )
# Title is "Vehicle Class", and three labels are renamed.
```

### Mistake 4: Forgetting to relevel the factor when reordering legend items

Changing the order of `scale_colour_discrete(limits = ...)` reorders the legend but does not reassign colours. The safest approach is to relevel the factor in the data.

❌ **Wrong:**
```r
p_base +
  scale_colour_discrete(limits = c("suv", "pickup"))
# Only suv and pickup appear in the legend.
# All other classes are dropped from the legend AND the plot.
```

**Why it is wrong:** `limits` restricts the scale to the values you list. Any value not in `limits` is treated as `NA` and removed.

✅ **Correct:**
```r
mpg_fixed <- mpg
mpg_fixed$class <- factor(mpg$class,
  levels = c("suv", "pickup", "minivan", "midsize",
             "compact", "subcompact", "2seater"))

ggplot(mpg_fixed, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2.5)
# All classes are present, but legend order starts with SUV.
```

## Practice Exercises

### Exercise 1: Multi-legend scatter with custom layout

Build a scatter plot of `mpg` with `colour = class` and `size = displ`. Apply all of these customizations:
- Move the legend inside the plot at position `c(0.85, 0.7)`
- Rename the colour title to "Vehicle Class"
- Rename the size title to "Engine Size (L)"
- Make the colour legend horizontal with 2 rows
- Add a white background with a grey border

```r
# Exercise 1: combine position, rename, and layout
# Hint: use theme() for position, labs() for titles,
# guides() with guide_legend(nrow=2) for layout

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_plot1 <- ggplot(mpg, aes(x = cty, y = hwy, colour = class, size = displ)) +
  geom_point(alpha = 0.7) +
  labs(colour = "Vehicle Class", size = "Engine Size (L)") +
  guides(colour = guide_legend(nrow = 2)) +
  theme(
    legend.position = "inside",
    legend.position.inside = c(0.85, 0.7),
    legend.background = element_rect(fill = "white", colour = "grey80"),
    legend.direction = "horizontal"
  )
my_plot1
#> Scatter plot with two legends inside the plot area.
#> Colour legend in 2 rows, size legend below it.
```

**Explanation:** `labs()` renames both titles. `guide_legend(nrow = 2)` wraps the 7-class colour legend into 2 rows. The `theme()` call positions the entire legend box inside the plot with a clean white background.

</details>

### Exercise 2: Publication-ready bar chart with styled legend

Create a stacked bar chart of `mpg` counting cars by `class`, filled by `drv`. Then apply:
- Remove the fill legend title (set it to blank)
- Relabel fill values: "4" becomes "4WD", "f" becomes "Front", "r" becomes "Rear"
- Make keys square at 1 cm by 1 cm
- Place the legend at the bottom
- Set the legend key background to white

```r
# Exercise 2: styled bar chart legend
# Hint: labs(fill = NULL) removes the title,
# scale_fill_discrete(labels=) renames labels

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_plot2 <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar() +
  labs(fill = NULL) +
  scale_fill_discrete(labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  theme(
    legend.position = "bottom",
    legend.key.size = unit(1, "cm"),
    legend.key = element_rect(fill = "white", colour = NA)
  )
my_plot2
#> Stacked bar chart with a clean bottom legend.
#> No title, labels read "4WD", "Front", "Rear".
#> Keys are 1 cm squares on white background.
```

**Explanation:** `labs(fill = NULL)` removes the title entirely. `scale_fill_discrete(labels = c(...))` uses a named vector to map original values to display labels. The `theme()` call controls key size and background.

</details>

## Putting It All Together

Let's build a publication-ready scatter plot from scratch with a fully customized legend. This combines every technique from the tutorial: positioning, renaming, label control, key styling, and layout.

```r
# Complete example: publication-ready legend
mpg_pub <- mpg
mpg_pub$class <- factor(mpg$class,
  levels = c("suv", "pickup", "minivan", "midsize",
             "compact", "subcompact", "2seater"))

p_final <- ggplot(mpg_pub, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2, alpha = 0.7) +

  # Rename title and labels
  labs(
    x = "Engine Displacement (L)",
    y = "Highway MPG",
    colour = "Vehicle Class"
  ) +
  scale_colour_discrete(
    labels = c("suv" = "SUV", "pickup" = "Pickup",
               "minivan" = "Minivan", "midsize" = "Midsize",
               "compact" = "Compact", "subcompact" = "Subcompact",
               "2seater" = "2-Seater")
  ) +

  # Layout: 2 rows, override key size for readability
  guides(colour = guide_legend(
    nrow = 2,
    override.aes = list(size = 4, alpha = 1)
  )) +

  # Position and style
  theme_minimal(base_size = 13) +
  theme(
    legend.position = "bottom",
    legend.title = element_text(face = "bold"),
    legend.text = element_text(size = 10),
    legend.key = element_rect(fill = "white", colour = NA),
    legend.key.size = unit(0.5, "cm"),
    legend.background = element_rect(fill = "white", colour = "grey90"),
    legend.margin = margin(6, 10, 6, 10)
  )

p_final
#> Clean scatter plot with a bottom legend.
#> Title "Vehicle Class" in bold, 7 items in 2 rows.
#> Keys are large and opaque despite the plot using
#> smaller, semi-transparent points.
```

This example hits every lever: `labs()` for the title, `scale_colour_discrete()` for labels, `factor()` for order, `guide_legend()` for layout and override, and `theme()` for visual polish. Copy this pattern and swap in your own data and aesthetics.

## Summary

| Task | Function | Example |
|---|---|---|
| Move legend | `theme(legend.position)` | `"bottom"`, `"inside"` |
| Place inside plot | `theme(legend.position.inside)` | `c(0.85, 0.75)` |
| Remove all legends | `theme(legend.position = "none")` |, |
| Remove one legend | `guides(aes = "none")` | `guides(size = "none")` |
| Suppress a layer | `show.legend = FALSE` | `geom_smooth(show.legend = FALSE)` |
| Rename title | `labs(aes = "...")` | `labs(colour = "Class")` |
| Rename labels | `scale_*_discrete(labels)` | `labels = c("a" = "Alpha")` |
| Reorder items | `factor(levels = ...)` | Relevel the mapped variable |
| Style text | `theme(legend.title, legend.text)` | `element_text(face = "bold")` |
| Style keys | `theme(legend.key, legend.key.size)` | `element_rect(fill = "white")` |
| Layout rows/cols | `guide_legend(nrow, ncol)` | `guide_legend(nrow = 2)` |
| Override key look | `guide_legend(override.aes)` | `list(size = 4, alpha = 1)` |
| Continuous bar | `guide_colorbar()` | `barwidth`, `barheight` |

## FAQ

### How do I merge two legends into one?

Map the same variable to both aesthetics and give them the same title with `labs()`. For example, use `aes(colour = class, shape = class)` plus `labs(colour = "Class", shape = "Class")`. This merges the colour and shape legends into one combined legend.

### What is the difference between guide_legend() and guide_colorbar()?

`guide_legend()` creates a legend with discrete keys, one per level. `guide_colorbar()` creates a continuous colour gradient bar. ggplot2 picks the right one automatically based on the scale type, but you can override it inside `guides()`.

### How do I change just the legend key shape?

Use the `key_glyph` argument inside the geom. For example, `geom_line(aes(colour = group), key_glyph = draw_key_rect)` uses rectangles instead of lines as legend keys. Other options include `draw_key_point`, `draw_key_dotplot`, and `draw_key_path`.

### Why does my legend show the letter "a" inside the keys?

This happens when `geom_text()` or `geom_label()` is in your plot. The text geom adds its label character to the legend key. Fix it by setting `show.legend = FALSE` on the text layer, or use `guides(colour = guide_legend(override.aes = list(label = "")))` to blank out the text in the legend only.

## References

1. ggplot2 documentation, guides() reference. [Link](https://ggplot2.tidyverse.org/reference/guides.html)
2. ggplot2 documentation, guide_legend() reference. [Link](https://ggplot2.tidyverse.org/reference/guide_legend.html)
3. ggplot2 documentation, theme() reference. [Link](https://ggplot2.tidyverse.org/reference/theme.html)
4. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). Chapter 11: Scales and Guides. [Link](https://ggplot2-book.org/scales-guides.html)
5. Tidyverse Blog, ggplot2 3.5.0: Legends (February 2024). [Link](https://tidyverse.org/blog/2024/02/ggplot2-3-5-0-legends/)
6. R-Charts, Legends in ggplot2. [Link](https://r-charts.com/ggplot2/legend/)

## Continue Learning

- **ggplot2 Themes**, Master `theme_minimal()`, `theme_classic()`, and build your own reusable custom theme. [Read more](ggplot2-Themes-in-R.html)
- **ggplot2 Colour Scales**, Control colours with `scale_colour_manual()`, viridis, and ColorBrewer palettes for accessible, beautiful plots.
