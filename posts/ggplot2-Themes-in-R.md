---
title: "ggplot2 Themes: From theme_classic to Your Own Custom House Style"
slug: "ggplot2-Themes-in-R"
description: "Themes control fonts, grid lines, backgrounds, and legend position in ggplot2. Master built-in themes, tweak every element, and build a reusable custom theme."
keywords: "ggplot2 themes, theme_minimal, theme_classic, theme_bw, custom ggplot2 theme, theme() function R, element_text, element_rect, element_line, ggplot2 theme customization"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.10"
post_type: "C"
auto_link_terms: "ggplot2 themes|ggplot2 theme|theme_minimal|theme_classic|custom ggplot2 theme|theme() in ggplot2|ggplot2 theme customization"
auto_link_case_sensitive: false
sidebar_section: "Visualization"
sidebar_title: "ggplot2 Themes"
sidebar_order: 6
difficulty: "Intermediate"
---


# ggplot2 Themes: From theme_classic to Your Own Custom House Style

<p class="lead">Themes control every non-data element of a ggplot2 chart, fonts, grid lines, backgrounds, and legend position, letting you go from the grey default to a polished, publication-ready style in one line of code.</p>

## Introduction

Every ggplot2 user eventually types `+ theme_minimal()` and watches their plot transform. The grey background vanishes, the grid lines soften, and the chart suddenly looks professional. Most people stop there, but themes can do far more.

A theme is ggplot2's styling layer. It controls everything you see that is NOT your data: title fonts, axis labels, grid line thickness, background colour, legend placement, and facet strip styling. The data layer (geoms, scales, coordinates) tells ggplot2 *what* to draw. The theme layer tells it *how everything around the data should look*.

Why does this matter? Because consistent, clean styling is the difference between a plot that communicates and one that distracts. If you build reports or dashboards, a reusable custom theme saves hours of repetitive formatting. If you publish research, a clean theme meets journal standards without manual tweaking.

In this tutorial, you will master all 8 built-in themes and the 4 element functions that control every visual property. You'll also learn the inheritance system and build your own reusable theme function. Every code block is live, click **Run** to execute directly in your browser.

![ggplot2 theme system overview](screenshots/ggplot2-Themes-in-R-overview-mindmap.webp)
*Figure 1: The four pillars of the ggplot2 theme system.*

## What are the built-in ggplot2 themes?

ggplot2 ships with 8 complete themes. Each one is a pre-built collection of `theme()` settings that override every visual element at once. Think of them as ready-made style sheets, you add one to any plot and the entire look changes.

Let's create a base plot first, then cycle through all 8 themes. We'll use `mtcars` so the data stays familiar.

```r
# Load ggplot2 and create a base scatter plot
library(ggplot2)

p_base <- ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl))) +
  geom_point(size = 3) +
  labs(
    title = "Fuel Efficiency vs Weight",
    subtitle = "By number of cylinders",
    x = "Weight (1000 lbs)",
    y = "Miles per Gallon",
    colour = "Cylinders"
  )

p_base
#> (scatter plot with grey background, default ggplot2 styling)
```

This is `theme_grey()`, the default. The grey background with white grid lines was Hadley Wickham's deliberate design choice: it puts the data in the foreground while the grid recedes. Now let's compare all 8 themes.

```r
# Apply each built-in theme
p_base + theme_grey()    # Default: grey background, white grid
#> (grey background, white grid lines)

p_base + theme_bw()      # Black-and-white: white background, grey grid
#> (white background, thin grey grid lines, black border)

p_base + theme_linedraw() # Like bw but with heavier black lines
#> (white background, black grid and border lines)

p_base + theme_light()   # Light grey grid on white — subtle
#> (white background, very light grey grid)

p_base + theme_dark()    # Dark grey background — good for presentations
#> (dark grey background, grey grid lines)

p_base + theme_minimal() # No background, no border, light grid only
#> (no background, no border, minimal light grid)

p_base + theme_classic() # Clean axes, no grid at all — journal style
#> (white background, axis lines only, no grid)

p_base + theme_void()    # Nothing — just the data and legend
#> (completely blank canvas, only data points and legend)
```

Each theme is a complete replacement. When you add `theme_bw()`, it overrides every setting from `theme_grey()`. You then layer your own `theme()` tweaks on top.

[TIP]
**Start with theme_minimal() for most custom work.** It strips away the most visual clutter, giving you a clean slate. Add back only the elements you need.

**Try it:** Take `p_base` and apply `theme_classic()` instead of the default. Then add a subtitle "No grid lines, just clean axes" using `labs()`.

```r
# Try it: apply theme_classic with a custom subtitle
ex_classic <- p_base +
  # your code here
  NULL

ex_classic
#> Expected: scatter plot with clean axis lines, no grid, custom subtitle
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_classic <- p_base +
  theme_classic() +
  labs(subtitle = "No grid lines — just clean axes")

ex_classic
#> (scatter plot with classic theme, axis lines only, no grid)
```

**Explanation:** `theme_classic()` removes all grid lines and the background, leaving only the x and y axis lines. The `labs()` call updates the subtitle.

</details>

## How does theme() modify individual plot elements?

Complete themes are all-or-nothing. The `theme()` function gives you surgical control, you target one element at a time. Each argument in `theme()` maps to a specific visual piece of the plot, and you set its appearance using one of four `element_*()` functions.

![Theme element types](screenshots/ggplot2-Themes-in-R-element-types.webp)
*Figure 2: Each element function controls a different visual type.*

Let's start by customising the plot title. The argument is `plot.title`, and because titles are text, we use `element_text()`.

```r
# Customise the plot title
p_base +
  theme_minimal() +
  theme(
    plot.title = element_text(
      size = 18,
      face = "bold",
      colour = "navy"
    )
  )
#> (scatter plot with large, bold, navy title)
```

The title jumps out now, 18pt, bold, navy. Every other element stays exactly as `theme_minimal()` set it. That's the power of `theme()`: it layers on top of whatever complete theme you start from.

Now let's remove the grid lines entirely. The argument is `panel.grid`, and to remove any element, you use `element_blank()`.

```r
# Remove all grid lines
p_base +
  theme_minimal() +
  theme(
    panel.grid = element_blank()
  )
#> (scatter plot with no grid lines at all)
```

The plot area is now completely clean. Only the data points and axis labels remain. You can also target just the minor grid while keeping the major lines.

[KEY INSIGHT]
**Every theme() argument maps to exactly one of 4 element functions.** Text elements use `element_text()`, lines use `element_line()`, backgrounds use `element_rect()`, and `element_blank()` removes anything. Once you know which type an element is, you know which function to use.

**Try it:** Start from `theme_bw()` and change the axis title font size to 14pt using `element_text()`. The argument name is `axis.title`.

```r
# Try it: change axis title size
ex_axis <- p_base +
  theme_bw() +
  theme(
    # your code here
  )

ex_axis
#> Expected: axis titles ("Weight (1000 lbs)" and "Miles per Gallon") appear at 14pt
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_axis <- p_base +
  theme_bw() +
  theme(
    axis.title = element_text(size = 14)
  )

ex_axis
#> (plot with larger 14pt axis titles)
```

**Explanation:** `axis.title` controls both x and y axis titles. Setting `size = 14` in `element_text()` increases them from the default (~11pt).

</details>

## What are the four element functions?

Every visual property in a ggplot2 theme is set through one of four functions. Let's explore each one in detail.

### element_text()

`element_text()` controls any text on the plot: titles, axis labels, legend text, facet strip labels. Its most useful arguments are `family` (font), `face` ("plain", "bold", "italic", "bold.italic"), `size` (points), `colour`, `angle`, and `hjust`/`vjust` (alignment from 0 to 1).

```r
# element_text() — full demo
p_base +
  theme_minimal() +
  theme(
    plot.title = element_text(
      size = 20, face = "bold", colour = "#2c3e50"
    ),
    plot.subtitle = element_text(
      size = 12, colour = "grey40", margin = margin(b = 10)
    ),
    axis.text = element_text(size = 10, colour = "grey30"),
    axis.text.x = element_text(angle = 45, hjust = 1)
  )
#> (plot with styled title, subtle subtitle, angled x-axis labels)
```

The `margin()` function adds spacing around text. The `b = 10` pushes the subtitle 10 points away from the content below it. The `angle = 45` rotates x-axis tick labels, and `hjust = 1` right-aligns them so they don't overlap.

### element_line()

`element_line()` controls axis lines, grid lines, and tick marks. Its key arguments are `colour`, `linewidth` (in mm), and `linetype` ("solid", "dashed", "dotted", "longdash").

```r
# element_line() — axes and grid
p_base +
  theme_minimal() +
  theme(
    axis.line = element_line(colour = "black", linewidth = 0.5),
    panel.grid.major = element_line(
      colour = "grey85", linewidth = 0.3, linetype = "dashed"
    ),
    panel.grid.minor = element_blank()
  )
#> (plot with solid black axes, dashed grey major grid, no minor grid)
```

This is a common pattern: add clear axis lines, soften the major grid to dashed lines, and remove minor grid lines entirely. The result is cleaner than the default without losing all spatial reference.

### element_rect()

`element_rect()` controls rectangular areas: the plot background, the panel background (the data area), and the legend background. Its arguments are `fill` (interior colour), `colour` (border colour), and `linewidth`.

```r
# element_rect() — backgrounds
p_base +
  theme_minimal() +
  theme(
    plot.background = element_rect(fill = "#f8f9fa", colour = NA),
    panel.background = element_rect(fill = "white", colour = "grey80"),
    legend.background = element_rect(
      fill = "white", colour = "grey80", linewidth = 0.3
    )
  )
#> (light grey outer background, white panel with border, boxed legend)
```

Setting `colour = NA` on `plot.background` removes the outer border while keeping the fill. The panel gets a subtle grey border to frame the data area.

[WARNING]
**element_blank() removes the element AND its space.** If you want a transparent background (element still takes up space), use `fill = NA` or `colour = NA` inside `element_rect()`. Using `element_blank()` on `panel.background` collapses the background entirely.

**Try it:** Use `element_rect()` to give `plot.background` a light yellow fill (`"#fffde7"`) while keeping the panel white.

```r
# Try it: yellow outer background, white panel
ex_bg <- p_base +
  theme_minimal() +
  theme(
    # your code here
  )

ex_bg
#> Expected: light yellow outer area, white data panel
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bg <- p_base +
  theme_minimal() +
  theme(
    plot.background = element_rect(fill = "#fffde7", colour = NA),
    panel.background = element_rect(fill = "white", colour = NA)
  )

ex_bg
#> (light yellow outer background, white panel)
```

**Explanation:** `plot.background` controls the entire plot area. `panel.background` controls just the data region. Setting both lets you create a two-tone effect.

</details>

## How does theme inheritance work?

Theme elements form a hierarchy. At the top sit three root elements: `text`, `line`, and `rect`. Every specific element inherits from one of these roots, possibly through intermediate parents.

![Theme inheritance hierarchy](screenshots/ggplot2-Themes-in-R-inheritance.webp)
*Figure 3: Theme elements inherit from parent elements, set once at the top, override where needed.*

This means you can set a global default at the top and only override the specifics that differ. For example, setting `text = element_text(family = "serif")` changes every piece of text on the plot in one line. That includes the title, subtitle, axis labels, legend text, and facet strip labels.

```r
# Inheritance: set global text, override specific elements
p_base +
  theme_minimal() +
  theme(
    text = element_text(size = 12, colour = "grey20"),
    plot.title = element_text(size = 20, face = "bold"),
    axis.title.x = element_text(colour = "steelblue")
  )
#> (all text is 12pt grey20, except title is 20pt bold, and x-axis title is steelblue)
```

Notice what happened. `plot.title` inherited the `colour = "grey20"` from `text` but overrode `size` and `face`. The x-axis title overrode `colour` but inherited `size = 12` from `text`. This is how inheritance keeps your code short, you set the base once and override only what differs.

[KEY INSIGHT]
**Inheritance means "set once, override where needed."** Instead of styling every text element individually, set the root `text` element and only customize the exceptions. This is the same principle as CSS inheritance on the web.

**Try it:** Set all text to size 12 using the root `text` element, then override `plot.title` to size 18 and bold. Keep everything else at the inherited default.

```r
# Try it: root text + title override
ex_inherit <- p_base +
  theme_minimal() +
  theme(
    # your code here
  )

ex_inherit
#> Expected: all text 12pt, title 18pt bold
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_inherit <- p_base +
  theme_minimal() +
  theme(
    text = element_text(size = 12),
    plot.title = element_text(size = 18, face = "bold")
  )

ex_inherit
#> (all text base 12pt, title stands out at 18pt bold)
```

**Explanation:** The `text` root element sets the default for everything. `plot.title` inherits from `text` but overrides `size` and `face`. All other text elements (axis labels, legend, etc.) stay at 12pt.

</details>

## How do you control legend position and appearance?

The legend is one of the most frequently customised theme elements. ggplot2 gives you control over where it sits, how it looks, and whether it appears at all.

The `legend.position` argument accepts five string values: `"right"` (default), `"left"`, `"top"`, `"bottom"`, and `"none"` (hides it). You can also pass a numeric vector `c(x, y)` to place the legend inside the plot area.

```r
# Move legend to bottom, clean up its appearance
p_base +
  theme_minimal() +
  theme(
    legend.position = "bottom",
    legend.background = element_rect(fill = NA, colour = NA),
    legend.key = element_rect(fill = NA),
    legend.title = element_text(face = "bold", size = 11),
    legend.text = element_text(size = 10)
  )
#> (scatter plot with legend at the bottom, no background box around legend)
```

Placing the legend at the bottom works well for wide plots and dashboards. Removing the legend background (`fill = NA`) and key fill makes it blend cleanly into the plot.

For more precise placement, you can position the legend inside the plot area. The coordinates are relative: `c(0, 0)` is bottom-left, `c(1, 1)` is top-right.

```r
# Place legend inside the plot area (top-right corner)
p_base +
  theme_minimal() +
  theme(
    legend.position = c(0.85, 0.85),
    legend.justification = c(1, 1),
    legend.background = element_rect(
      fill = "white", colour = "grey70", linewidth = 0.3
    ),
    legend.key.size = unit(0.8, "lines")
  )
#> (legend floating inside the plot, top-right, with white background box)
```

The `legend.justification` argument controls which corner of the legend box aligns to the position coordinates. Setting it to `c(1, 1)` means the top-right corner of the legend sits at the specified position.

[TIP]
**Use legend.position = "none" to hide all legends at once.** This is simpler than `guides(colour = "none", size = "none")` when you want every legend gone, useful for faceted plots where the facet labels carry the information.

**Try it:** Move the legend to the top of the plot using `legend.position`.

```r
# Try it: move legend to top
ex_legend <- p_base +
  theme_minimal() +
  theme(
    # your code here
  )

ex_legend
#> Expected: legend appears above the plot area
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_legend <- p_base +
  theme_minimal() +
  theme(
    legend.position = "top"
  )

ex_legend
#> (scatter plot with legend at the top)
```

**Explanation:** `legend.position = "top"` moves the legend above the plot. ggplot2 automatically arranges the keys horizontally when the legend is at the top or bottom.

</details>

## How do you build a reusable custom theme function?

Once you've settled on a look, maybe for your organisation, your thesis, or your blog, you don't want to copy-paste 15 lines of `theme()` every time. The solution is to wrap your settings in a function.

The pattern is simple: create a function that returns the result of a complete theme plus your `theme()` overrides. Accept a `base_size` argument so users can scale everything up or down.

```r
# Build a reusable custom theme
theme_corporate <- function(base_size = 12) {
  theme_minimal(base_size = base_size) +
    theme(
      # Title and subtitle
      plot.title = element_text(
        face = "bold", size = base_size * 1.5, colour = "#1a1a2e"
      ),
      plot.subtitle = element_text(
        colour = "grey40", margin = margin(b = 10)
      ),
      # Axes
      axis.title = element_text(face = "bold", colour = "#16213e"),
      axis.text = element_text(colour = "grey30"),
      axis.line = element_line(colour = "#16213e", linewidth = 0.4),
      # Grid — keep major only, subtle
      panel.grid.major = element_line(colour = "grey90", linewidth = 0.2),
      panel.grid.minor = element_blank(),
      # Legend
      legend.position = "bottom",
      legend.title = element_text(face = "bold"),
      legend.background = element_rect(fill = NA, colour = NA),
      # Background
      plot.background = element_rect(fill = "white", colour = NA),
      # Spacing
      plot.margin = margin(15, 15, 15, 15)
    )
}
```

This function produces a clean, professional look with bold titles, subtle grid lines, and the legend at the bottom. The `base_size` argument scales the entire theme proportionally because `theme_minimal(base_size)` sets the root text size.

Now let's apply it.

```r
# Apply the custom theme
p_base + theme_corporate()
#> (clean scatter plot: bold navy title, subtle grid, legend at bottom)
```

One line changes the entire appearance. Anyone on your team can use `theme_corporate()` without knowing the underlying details.

To make it the default for every plot in your session, use `theme_set()`.

```r
# Set as the default for all plots in this session
theme_set(theme_corporate())

# Now every new plot uses theme_corporate automatically
ggplot(mtcars, aes(x = hp, y = qsec)) +
  geom_point() +
  labs(title = "Quarter Mile Time vs Horsepower")
#> (automatically uses theme_corporate styling)
```

Call `theme_set(theme_grey())` to reset to the default when you're done.

```r
# Reset to default
theme_set(theme_grey())
```

[TIP]
**Use %+replace% instead of + when building complete themes.** The `+` operator merges your settings with the base, keeping any properties you didn't specify. The `%+replace%` operator replaces the entire element, setting unspecified properties to NULL. Use `%+replace%` when you want total control and `+` when you want to inherit defaults.

**Try it:** Add a `base_size` argument to the following skeleton and make the title scale to 1.4 times the base size.

```r
# Try it: add scaling to a custom theme
ex_theme <- function(base_size = 11) {
  theme_minimal(base_size = base_size) +
    theme(
      plot.title = element_text(
        face = "bold"
        # your code here — make size scale with base_size
      )
    )
}

p_base + ex_theme(base_size = 16)
#> Expected: title appears at ~22pt (16 * 1.4)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_theme <- function(base_size = 11) {
  theme_minimal(base_size = base_size) +
    theme(
      plot.title = element_text(
        face = "bold",
        size = base_size * 1.4
      )
    )
}

p_base + ex_theme(base_size = 16)
#> (plot with bold title at ~22pt, all other text scaled to 16pt base)
```

**Explanation:** Multiplying `base_size * 1.4` makes the title proportionally larger regardless of the base. When `base_size = 16`, the title is 22.4pt. When `base_size = 12`, it's 16.8pt.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Putting theme() before the complete theme

❌ **Wrong:**
```r
p_base +
  theme(plot.title = element_text(size = 20)) +
  theme_minimal()
```

**Why it is wrong:** Complete themes like `theme_minimal()` replace ALL theme settings. Your `theme()` call gets wiped out because `theme_minimal()` runs after it.

✅ **Correct:**
```r
p_base +
  theme_minimal() +
  theme(plot.title = element_text(size = 20))
#> (title correctly appears at 20pt on top of theme_minimal)
```

### Mistake 2: Using element_blank() when you want transparent

❌ **Wrong:**
```r
p_base +
  theme(panel.background = element_blank())
# Panel background disappears AND loses its space allocation
```

**Why it is wrong:** `element_blank()` removes the element entirely, including the space it occupied. This can cause layout shifts.

✅ **Correct:**
```r
p_base +
  theme(panel.background = element_rect(fill = NA, colour = NA))
#> (background is transparent but the space is preserved)
```

### Mistake 3: Forgetting that later theme() calls override earlier ones

❌ **Wrong:**
```r
p_base +
  theme_minimal() +
  theme(axis.text = element_text(size = 14)) +
  theme(axis.text = element_text(colour = "red"))
# Size resets to default because the second theme() replaces axis.text entirely
```

**Why it is wrong:** Each `theme()` call replaces the element you name, it doesn't merge with the previous call. The second call sets `colour = "red"` but drops the `size = 14`.

✅ **Correct:**
```r
p_base +
  theme_minimal() +
  theme(axis.text = element_text(size = 14, colour = "red"))
#> (axis text is both 14pt AND red)
```

### Mistake 4: Placing legend inside the plot without setting justification

❌ **Wrong:**
```r
p_base +
  theme(legend.position = c(0.9, 0.9))
# Legend overflows the plot boundary because its default justification is centered
```

**Why it is wrong:** Without `legend.justification`, the center of the legend aligns to `c(0.9, 0.9)`, pushing half the legend outside the visible area.

✅ **Correct:**
```r
p_base +
  theme_minimal() +
  theme(
    legend.position = c(0.9, 0.9),
    legend.justification = c(1, 1)
  )
#> (legend's top-right corner aligns to the position — fully visible)
```

## Practice Exercises

### Exercise 1: Style a complete plot with theme tweaks

Create a scatter plot of `mpg` vs `hp` from `mtcars`, coloured by `gear`. Start from `theme_bw()`. Customise: bold 16pt title, 12pt axis titles, legend at the bottom, no minor grid lines. Save to `my_styled`.

```r
# Exercise 1: combine theme_bw + multiple theme tweaks
# Hint: use theme_bw() first, then theme() with plot.title, axis.title,
#       legend.position, and panel.grid.minor

my_styled <- ggplot(mtcars, aes(x = hp, y = mpg, colour = factor(gear))) +
  geom_point(size = 3) +
  labs(title = "MPG vs Horsepower", x = "Horsepower", y = "MPG", colour = "Gears")

# Add your theme code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_styled <- ggplot(mtcars, aes(x = hp, y = mpg, colour = factor(gear))) +
  geom_point(size = 3) +
  labs(title = "MPG vs Horsepower", x = "Horsepower", y = "MPG", colour = "Gears") +
  theme_bw() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    axis.title = element_text(size = 12),
    legend.position = "bottom",
    panel.grid.minor = element_blank()
  )

my_styled
#> (clean scatter plot with bold title, bottom legend, no minor grid)
```

**Explanation:** `theme_bw()` provides the white background and border. The `theme()` call layers custom title sizing, axis title sizing, legend position, and removes minor grid lines.

</details>

### Exercise 2: Build a custom dashboard theme

Write a function `theme_dashboard()` that starts from `theme_light()` and accepts `base_size`. It should remove minor grid lines, use dashed grey90 major grid, scale the title to 1.5x base (bold), place the legend at bottom, and set a white background. Apply it to two plots.

```r
# Exercise 2: build theme_dashboard()
# Hint: follow the theme_corporate() pattern from the tutorial
# Start from theme_light(base_size = base_size)

theme_dashboard <- function(base_size = 11) {
  # your code here
}

# Test on two plots:
my_plot1 <- ggplot(mtcars, aes(x = wt, y = mpg)) + geom_point() +
  labs(title = "Weight vs MPG") + theme_dashboard(base_size = 14)

my_plot2 <- ggplot(mtcars, aes(x = factor(cyl), y = hp)) + geom_boxplot() +
  labs(title = "HP by Cylinders") + theme_dashboard(base_size = 14)

```

<details>
<summary>Click to reveal solution</summary>

```r
theme_dashboard <- function(base_size = 11) {
  theme_light(base_size = base_size) +
    theme(
      plot.title = element_text(face = "bold", size = base_size * 1.5),
      panel.grid.major = element_line(colour = "grey90", linetype = "dashed"),
      panel.grid.minor = element_blank(),
      legend.position = "bottom",
      plot.background = element_rect(fill = "white", colour = NA)
    )
}

my_plot1 <- ggplot(mtcars, aes(x = wt, y = mpg)) + geom_point() +
  labs(title = "Weight vs MPG") + theme_dashboard(base_size = 14)

my_plot2 <- ggplot(mtcars, aes(x = factor(cyl), y = hp)) + geom_boxplot() +
  labs(title = "HP by Cylinders") + theme_dashboard(base_size = 14)

my_plot1
#> (scatter plot with dashboard styling at 14pt base)

my_plot2
#> (boxplot with the same consistent dashboard styling)
```

**Explanation:** Both plots share the same visual identity because they use the same theme function. Changing `base_size` scales everything proportionally.

</details>

### Exercise 3: Recreate a plot style from scratch

Start from `theme_void()` (which strips everything). Add back only: x and y axis lines (black, 0.5mm), axis text (size 10), a bold 16pt title, and dashed horizontal grid lines (grey85). Apply to a bar chart of `cyl` counts from `mtcars`.

```r
# Exercise 3: build up from theme_void()
# Hint: axis.line, axis.text, plot.title, panel.grid.major.y

my_rebuilt <- ggplot(mtcars, aes(x = factor(cyl))) +
  geom_bar(fill = "steelblue") +
  labs(title = "Car Count by Cylinders", x = "Cylinders", y = "Count")

# Add theme_void() + your theme() overrides below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_rebuilt <- ggplot(mtcars, aes(x = factor(cyl))) +
  geom_bar(fill = "steelblue") +
  labs(title = "Car Count by Cylinders", x = "Cylinders", y = "Count") +
  theme_void() +
  theme(
    axis.line = element_line(colour = "black", linewidth = 0.5),
    axis.text = element_text(size = 10),
    axis.title = element_text(size = 11),
    plot.title = element_text(size = 16, face = "bold"),
    panel.grid.major.y = element_line(colour = "grey85", linetype = "dashed")
  )

my_rebuilt
#> (bar chart with only axis lines, text, title, and horizontal dashed grid)
```

**Explanation:** Starting from `theme_void()` means nothing is drawn. You selectively add back only the elements you want. This gives you maximum control over which visual elements appear.

</details>

## Putting It All Together

Let's build a complete publication-quality plot from start to finish. We'll create a custom theme, apply it, and customise the data layer too.

```r
# Reset to default theme first
theme_set(theme_grey())

# Define a clean publication theme
theme_publication <- function(base_size = 12) {
  theme_minimal(base_size = base_size) +
    theme(
      # Typography
      text = element_text(colour = "#2d3436"),
      plot.title = element_text(
        size = base_size * 1.6, face = "bold",
        margin = margin(b = 8)
      ),
      plot.subtitle = element_text(
        size = base_size * 1.0, colour = "grey40",
        margin = margin(b = 12)
      ),
      plot.caption = element_text(
        size = base_size * 0.8, colour = "grey50", hjust = 0
      ),
      # Axes
      axis.title = element_text(face = "bold", size = base_size * 1.0),
      axis.text = element_text(size = base_size * 0.85),
      axis.line = element_line(colour = "grey40", linewidth = 0.3),
      # Grid
      panel.grid.major = element_line(colour = "grey92", linewidth = 0.2),
      panel.grid.minor = element_blank(),
      # Legend
      legend.position = "bottom",
      legend.title = element_text(face = "bold", size = base_size * 0.9),
      legend.text = element_text(size = base_size * 0.85),
      legend.background = element_rect(fill = NA, colour = NA),
      legend.key = element_rect(fill = NA),
      # Background and margins
      plot.background = element_rect(fill = "white", colour = NA),
      plot.margin = margin(20, 20, 20, 20)
    )
}

# Build the final plot
ggplot(mtcars, aes(x = wt, y = mpg, colour = factor(cyl), size = hp)) +
  geom_point(alpha = 0.8) +
  scale_colour_manual(
    values = c("4" = "#0984e3", "6" = "#fdcb6e", "8" = "#d63031")
  ) +
  scale_size_continuous(range = c(2, 7)) +
  labs(
    title = "Fuel Efficiency Drops as Weight Increases",
    subtitle = "Larger engines (8-cyl) cluster at the heavy, low-MPG end",
    x = "Weight (1000 lbs)",
    y = "Miles per Gallon",
    colour = "Cylinders",
    size = "Horsepower",
    caption = "Source: mtcars dataset | R 4.x"
  ) +
  theme_publication(base_size = 13)
#> (polished scatter plot with blue/yellow/red points, sized by HP,
#>  bold title, subtitle, clean grid, legend at bottom)
```

This plot is ready for a report, presentation, or journal submission. The custom theme handles all the styling. The data layer handles the visual encoding. Clean separation.

## Summary

Here is a reference table of the most useful `theme()` arguments grouped by area.

| Area | Argument | element_*() | Controls |
|------|----------|-------------|----------|
| Title | `plot.title` | `element_text()` | Main title font, size, colour |
| Title | `plot.subtitle` | `element_text()` | Subtitle styling |
| Title | `plot.caption` | `element_text()` | Caption (bottom annotation) |
| Axes | `axis.title` | `element_text()` | Both axis title labels |
| Axes | `axis.text` | `element_text()` | Tick label text |
| Axes | `axis.line` | `element_line()` | Axis lines |
| Axes | `axis.ticks` | `element_line()` | Tick marks |
| Grid | `panel.grid.major` | `element_line()` | Major grid lines |
| Grid | `panel.grid.minor` | `element_line()` | Minor grid lines |
| Panel | `panel.background` | `element_rect()` | Data area background |
| Panel | `panel.border` | `element_rect()` | Panel border |
| Legend | `legend.position` | string or c(x,y) | Where the legend sits |
| Legend | `legend.title` | `element_text()` | Legend title styling |
| Legend | `legend.background` | `element_rect()` | Legend box background |
| Plot | `plot.background` | `element_rect()` | Outer plot background |
| Plot | `plot.margin` | `margin()` | Space around the plot |

Key takeaways:

- **8 built-in themes** give you instant style, `theme_minimal()` and `theme_classic()` are the most popular starting points
- **theme()** layers surgical tweaks on top of any complete theme
- **4 element functions** control everything: `element_text()`, `element_line()`, `element_rect()`, `element_blank()`
- **Inheritance** lets you set global defaults at the root (`text`, `line`, `rect`) and override specifics
- **Custom theme functions** wrap your styling into reusable, shareable one-liners
- **theme_set()** applies your custom theme to every plot in a session

## FAQ

**What is the difference between theme_grey() and theme_gray()?**

Nothing. They are aliases. `theme_grey()` uses British spelling and `theme_gray()` uses American spelling. Both call the same function and produce identical output.

**Can I combine multiple complete themes?**

No. Each complete theme replaces all settings from the previous one. If you write `theme_bw() + theme_minimal()`, only `theme_minimal()` takes effect. Use one complete theme as your base and layer `theme()` tweaks on top.

**How do I save my custom theme for use across projects?**

Put your theme function in an R script (e.g., `theme_corporate.R`) and `source()` it at the top of each project. For team-wide use, wrap it in an R package with `usethis::create_package()`, then anyone can load it with `library(yourpackage)`.

**How do I change the font family in ggplot2?**

Set `family = "your font"` inside `element_text()`. Built-in families include `"sans"` (default), `"serif"`, and `"mono"`. For custom fonts like Google Fonts, load them with the `showtext` or `extrafont` package first. Note that custom fonts may not render in all output formats.

**What is the difference between theme() and theme_update()?**

`theme()` modifies the theme of a single plot. `theme_update()` modifies the current default theme globally, it affects all subsequent plots in the session. Use `theme_update()` when you want to set a session-wide default without writing a custom function. Use `theme_set()` to replace the default entirely.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Chapter 17: Themes. [Link](https://ggplot2-book.org/themes.html)
2. ggplot2 documentation, `theme()` reference. [Link](https://ggplot2.tidyverse.org/reference/theme.html)
3. ggplot2 documentation, Complete themes (ggtheme). [Link](https://ggplot2.tidyverse.org/reference/ggtheme.html)
4. ggplot2 documentation, Theme elements (element_text, element_line, element_rect). [Link](https://ggplot2.tidyverse.org/reference/element.html)
5. R for the Rest of Us, Create your own custom ggplot2 theme (2025). [Link](https://rfortherestofus.com/2025/04/ggplot2-theme)
6. Jumping Rivers, Getting started with theme() (2025). [Link](https://www.jumpingrivers.com/blog/intro-to-theme-ggplot2-r/)
7. Mock, T., Creating and using custom ggplot2 themes (2020). [Link](https://themockup.blog/posts/2020-12-26-creating-and-using-custom-ggplot2-themes/)
8. Peng, R., *Mastering Software Development in R*. Section 4.6: Building a New Theme. [Link](https://bookdown.org/rdpeng/RProgDA/building-a-new-theme.html)

## Continue Learning

- **[ggplot2 Tutorial 1 - Intro](Complete-Ggplot2-Tutorial-Part1-With-R-Code.html)**, covers the foundations of ggplot2 layers, geoms, and aesthetics
- **[ggplot2 Quickref](ggplot2-cheatsheet.html)**, a compact reference card for common ggplot2 operations and syntax
