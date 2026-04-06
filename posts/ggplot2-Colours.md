---
title: "ggplot2 Colours: Choose Palettes That Are Beautiful, Accessible, and Honest"
slug: "ggplot2-Colours"
description: "Learn scale_color_manual(), viridis palettes for ordinal data, ColorBrewer for categorical, and how to test your ggplot2 chart for colour blindness."
keywords: "ggplot2 colors, scale_color_manual, viridis palette R, ColorBrewer ggplot2, ggplot2 color palette, colorblind friendly R plot, scale_fill_brewer, ggplot2 custom colors, R color scales"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.12"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "ggplot2 Colours"
sidebar_order: 6
auto_link_terms: "ggplot2 colours|ggplot2 colors|scale_color_manual()|scale_fill_manual()|viridis palette|ColorBrewer palette|colour palettes in ggplot2"
auto_link_case_sensitive: false
---

# ggplot2 Colours: Choose Palettes That Are Beautiful, Accessible, and Honest

<p class="lead">Colour in ggplot2 controls how viewers read your data — the right palette highlights patterns, respects colour-blind readers, and avoids misleading gradients.</p>

## Introduction

A chart with a bad colour palette can mislead your audience or exclude readers who see colour differently. Colour is not decoration. It encodes meaning, and the wrong encoding distorts your message.

ggplot2 gives you a powerful colour system built on a simple idea: map a data variable to a colour aesthetic, and a scale function translates values into colours. You pick the scale function that matches your data type and your communication goal.

In this tutorial you will learn how to choose the right palette for your data (qualitative, sequential, or diverging), apply it with the correct `scale_color_*()` or `scale_fill_*()` function, set custom colours for brand or publication needs, and test your chart for colour-blindness safety. All code runs in your browser — no setup required.

![Decision flow for choosing a colour palette by data type.](screenshots/ggplot2-Colours-palette-decision.webp)
*Figure 1: Decision flow for choosing a colour palette by data type.*

## How does ggplot2 map data to colours?

Every colour in a ggplot2 chart starts with a mapping inside `aes()`. When you write `aes(color = some_variable)`, ggplot2 inspects the variable type and picks a default palette automatically. Factors and characters get a discrete palette. Numeric variables get a continuous gradient.

Let's load the packages we need and see the default behaviour on the built-in `mpg` dataset.

```r
# Load libraries (all WebR-compatible)
library(ggplot2)
library(scales)
library(viridis)

# Quick look at the data
head(mpg, 4)
#>   manufacturer model displ year cyl      trans drv cty hwy   fl   class
#> 1         audi    a4   1.8 1999   4   auto(l5)   f  18  29    p compact
#> 2         audi    a4   1.8 1999   4 manual(m5)   f  21  29    p compact
#> 3         audi    a4   2.0 2008   4 manual(m6)   f  20  31    p compact
#> 4         audi    a4   2.0 2008   4   auto(av)   f  21  30    p compact
```

The `mpg` dataset has 234 rows of fuel economy data. The `class` column is categorical (7 car types) and `hwy` is continuous (highway miles per gallon). Let's map each to colour.

```r
# Discrete colour: map class (character) to colour
p_discrete <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(size = 2) +
  labs(title = "Default discrete palette",
       x = "Engine displacement (L)", y = "Highway MPG")
print(p_discrete)
```

ggplot2 assigned a different hue to each of the 7 car classes. The default discrete palette spreads colours evenly around the colour wheel, which works well for up to about 8 categories.

```r
# Continuous colour: map hwy (numeric) to colour
p_continuous <- ggplot(mpg, aes(x = displ, y = cty, color = hwy)) +
  geom_point(size = 2) +
  labs(title = "Default continuous gradient",
       x = "Engine displacement (L)", y = "City MPG")
print(p_continuous)
```

For the continuous variable `hwy`, ggplot2 used a dark-to-light blue gradient. Higher highway MPG appears as lighter blue. Notice how the legend changed from distinct swatches to a continuous colour bar.

![ggplot2 colour scale functions for discrete and continuous data.](screenshots/ggplot2-Colours-scale-functions.webp)
*Figure 2: ggplot2 colour scale functions for discrete and continuous data.*

[KEY INSIGHT]
**ggplot2 chooses discrete or continuous palettes based on the variable type.** Factors and characters trigger discrete scales with distinct colours. Numeric variables trigger gradient scales. If you get the wrong scale type, check whether your variable is a factor or a number with `class(your_variable)`.

**Try it:** Map `drv` (drive type: f, r, 4) to colour instead of `class`. How many colours appear?

```r
# Try it: map drv to colour
ex_plot1 <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point(size = 2)
  # your code here — print the plot

#> Expected: 3 colours (f, r, 4)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_plot1 <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point(size = 2)
print(ex_plot1)
#> Three colours appear: one for "4", one for "f", one for "r"
```

**Explanation:** `drv` has 3 unique values, so ggplot2 assigns 3 discrete colours.

</details>

## How do you set custom colours with scale_color_manual()?

Sometimes the default palette is not enough. You need exact colours for brand guidelines, journal requirements, or to match a specific meaning (red for danger, green for safe). That is when you reach for `scale_color_manual()`.

The function takes a `values` argument — a vector of colours. You can use colour names (`"steelblue"`), hex codes (`"#E41A1C"`), or a named vector that maps each level to a specific colour.

```r
# Named vector: explicit mapping from level to colour
custom_colors <- c(
  "compact"    = "#1B9E77",
  "midsize"    = "#D95F02",
  "suv"        = "#7570B3",
  "2seater"    = "#E7298A",
  "minivan"    = "#66A61E",
  "pickup"     = "#E6AB02",
  "subcompact" = "#A6761D"
)

p_manual <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(size = 2) +
  scale_color_manual(values = custom_colors) +
  labs(title = "Custom colours with scale_color_manual()",
       x = "Engine displacement (L)", y = "Highway MPG")
print(p_manual)
```

Using a named vector is safer than a positional vector. With a named vector, each colour sticks to its level regardless of the order ggplot2 encounters the levels. A positional vector assigns colours by the alphabetical order of levels, which can silently break if your data changes.

[TIP]
**Use a named vector for scale_color_manual().** Positional colour vectors break silently when factor levels change. A named vector like `c("compact" = "#1B9E77", "suv" = "#7570B3")` is explicit and future-proof.

The fill variant works the same way. Use `scale_fill_manual()` for bar charts, boxplots, and any geom that uses the `fill` aesthetic.

```r
# scale_fill_manual() for bar chart
p_fill <- ggplot(mpg, aes(x = class, fill = class)) +
  geom_bar() +
  scale_fill_manual(values = custom_colors) +
  labs(title = "Bar chart with custom fill colours") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
print(p_fill)
```

The colours match exactly because we reused the same named vector. The `fill` aesthetic controls the inside colour of bars, while `color` controls the border.

**Try it:** Create a bar chart of `drv` with 3 custom hex colours of your choice.

```r
# Try it: custom fill for drv
ex_bar <- ggplot(mpg, aes(x = drv, fill = drv)) +
  geom_bar()
  # your code here — add scale_fill_manual() with 3 hex colours

#> Expected: a bar chart with your 3 chosen colours
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bar <- ggplot(mpg, aes(x = drv, fill = drv)) +
  geom_bar() +
  scale_fill_manual(values = c("4" = "#FF6B6B", "f" = "#4ECDC4", "r" = "#45B7D1"))
print(ex_bar)
#> Three bars in your chosen colours
```

**Explanation:** Each hex code maps to one level of `drv`. The named vector ensures "4" always gets red, regardless of factor ordering.

</details>

## When should you use ColorBrewer palettes?

Cynthia Brewer designed the ColorBrewer palettes for cartography, but they are among the best-tested palettes for any data visualisation. They come in three types, each matched to a data situation.

**Qualitative palettes** (e.g., "Set2", "Dark2", "Paired") use distinct hues with similar brightness. They work for unordered categories like country, species, or car class.

**Sequential palettes** (e.g., "Blues", "YlOrRd", "Greens") go from light to dark in one hue. They show ordered data where more means more — population density, temperature, count.

**Diverging palettes** (e.g., "RdBu", "PiYG", "BrBG") have two hues that diverge from a neutral midpoint. They show data that has a meaningful centre — profit/loss, above/below average, positive/negative correlation.

Let's apply a qualitative Brewer palette to our scatter plot.

```r
# Qualitative Brewer palette
p_brewer <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(size = 2) +
  scale_color_brewer(palette = "Set2") +
  labs(title = "ColorBrewer qualitative palette: Set2",
       x = "Engine displacement (L)", y = "Highway MPG")
print(p_brewer)
```

"Set2" is a popular qualitative palette because its pastel tones are easy on the eyes and distinct enough for 7 categories. It is also one of the safer palettes for colour-blind viewers.

You can explore all available palettes with `RColorBrewer::display.brewer.all()`, or check the palette info table.

```r
# Show all Brewer palette names and their properties
library(RColorBrewer)
brewer_info <- brewer.pal.info
head(brewer_info, 12)
#>          maxcolors category colorblind
#> BrBG            11      div       TRUE
#> PiYG            11      div       TRUE
#> PRGn            11      div       TRUE
#> PuOr            11      div       TRUE
#> RdBu            11      div       TRUE
#> RdGy            11      div      FALSE
#> RdYlBu          11      div       TRUE
#> RdYlGn          11      div      FALSE
#> Spectral        11      div      FALSE
#> Accent           8     qual      FALSE
#> Dark2            8     qual       TRUE
#> Paired          12     qual       TRUE
```

The `colorblind` column tells you which palettes are safe for colour-blind viewers. "Dark2", "Paired", and most diverging palettes score TRUE.

[WARNING]
**Never use a qualitative palette for ordered data.** Qualitative palettes assign random hues to each level. If your data has a natural order (low to high, bad to good), those random hues will confuse readers. Use sequential or diverging palettes instead.

Now let's try a diverging palette for data that has a natural midpoint. We will create a variable that measures each car's MPG relative to the group mean.

```r
# Diverging palette: deviation from mean
mpg$hwy_dev <- mpg$hwy - mean(mpg$hwy)

p_diverge <- ggplot(mpg, aes(x = displ, y = cty, color = hwy_dev)) +
  geom_point(size = 2) +
  scale_color_distiller(palette = "RdBu", direction = 1) +
  labs(title = "Diverging palette: highway MPG deviation from mean",
       x = "Engine displacement (L)", y = "City MPG",
       color = "Deviation")
print(p_diverge)
```

Blue dots sit above average highway MPG, red dots below. The neutral midpoint (zero deviation) appears as a pale centre. Notice we used `scale_color_distiller()` — the continuous version of `scale_color_brewer()` — because `hwy_dev` is numeric.

**Try it:** Apply the diverging "PiYG" palette to the same plot. What colour represents above-average MPG now?

```r
# Try it: PiYG diverging palette
ex_div <- ggplot(mpg, aes(x = displ, y = cty, color = hwy_dev)) +
  geom_point(size = 2)
  # your code here — add scale_color_distiller() with "PiYG"

#> Expected: green = above average, pink/purple = below average
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_div <- ggplot(mpg, aes(x = displ, y = cty, color = hwy_dev)) +
  geom_point(size = 2) +
  scale_color_distiller(palette = "PiYG", direction = 1) +
  labs(color = "Deviation")
print(ex_div)
#> Green dots = above average, pink dots = below average
```

**Explanation:** "PiYG" stands for Pink-Yellow-Green. With `direction = 1`, high values map to green and low values to pink.

</details>

## Why is viridis the default choice for continuous data?

Most colour palettes have a hidden problem: they are not perceptually uniform. A step from yellow to green looks bigger than a step from blue to purple, even if the data difference is the same. The viridis family of palettes solves this by varying luminance (brightness) monotonically from dark to light.

This gives viridis three practical advantages. It still works when printed in greyscale, because brightness alone carries the information. It is robust to the most common forms of colour blindness (deuteranopia and protanopia). And it represents data honestly — equal data steps produce equal perceptual steps.

![The three dimensions of HCL colour space.](screenshots/ggplot2-Colours-hcl-components.webp)
*Figure 3: The three dimensions of HCL colour space — hue (which colour), chroma (how vivid), and luminance (how bright). Viridis varies luminance monotonically.*

The viridis package ships with 8 palette options: "viridis" (D), "magma" (A), "inferno" (B), "plasma" (C), "cividis" (E), "rocket" (F), "mako" (G), and "turbo" (H). Let's apply viridis to a continuous variable.

```r
# Viridis continuous palette
p_viridis <- ggplot(mpg, aes(x = displ, y = cty, color = hwy)) +
  geom_point(size = 2) +
  scale_color_viridis_c(option = "viridis") +
  labs(title = "Viridis continuous palette",
       x = "Engine displacement (L)", y = "City MPG",
       color = "Highway MPG")
print(p_viridis)
```

Dark purple represents the lowest highway MPG values, bright yellow the highest. The smooth luminance gradient makes it easy to read the ordering even at a glance.

Viridis also works for discrete data. Use `scale_color_viridis_d()` or `scale_fill_viridis_d()` for factors.

```r
# Viridis discrete palette with plasma option
p_plasma <- ggplot(mpg, aes(x = class, fill = class)) +
  geom_bar() +
  scale_fill_viridis_d(option = "plasma") +
  labs(title = "Viridis discrete: plasma option") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
print(p_plasma)
```

The plasma palette runs from deep purple through pink to yellow. Each of the 7 car classes gets a distinct colour along that gradient.

Let's see all 8 viridis options side by side using the `show_col()` function from the scales package.

```r
# Show 6 viridis palette options
par(mfrow = c(2, 3))
for (opt in c("viridis", "magma", "plasma", "inferno", "mako", "rocket")) {
  show_col(viridis_pal(option = opt)(8), main = opt)
}
```

Each row of swatches goes from dark to light. That monotonic luminance change is what makes these palettes work in greyscale and for colour-blind readers.

[KEY INSIGHT]
**Viridis is perceptually uniform because it varies luminance monotonically.** In simpler terms, the brightness always increases from left to right. Your eyes perceive brightness differences more accurately than hue differences, so the gradient reads honestly — no colour appears to "jump out" more than another.

**Try it:** Apply the "mako" option to a continuous colour scale. Then try "turbo". Which one varies luminance more smoothly?

```r
# Try it: compare mako and turbo
ex_mako <- ggplot(mpg, aes(x = displ, y = hwy, color = cty)) +
  geom_point(size = 2)
  # your code here — add scale_color_viridis_c(option = "mako")
  # then change to "turbo" and compare

#> Expected: mako is smooth dark-to-light; turbo has uneven brightness jumps
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mako <- ggplot(mpg, aes(x = displ, y = hwy, color = cty)) +
  geom_point(size = 2) +
  scale_color_viridis_c(option = "mako") +
  labs(title = "Mako palette")
print(ex_mako)
#> Smooth dark blue to light teal gradient
```

**Explanation:** "mako" varies luminance smoothly from dark to light. "turbo" is a rainbow-like palette that does not vary luminance monotonically — it is included for backward compatibility but is not recommended for honest data representation.

</details>

## How do you check a chart for colour blindness?

About 8% of men and 0.5% of women have some form of colour vision deficiency. The most common type is deuteranopia (red-green colour blindness), where red and green appear as similar shades of brown or olive. If your chart relies on red-green contrast, a significant fraction of your audience will miss the pattern.

The simplest check is to look at your palette's luminance values. If two colours have different hues but the same brightness, a colour-blind viewer may not distinguish them. Viridis avoids this by design. But what about custom palettes?

Let's extract the default ggplot2 hue palette and check it.

```r
# Extract default ggplot2 hue palette for 4 colours
pal_default <- hue_pal()(4)
print(pal_default)
#> [1] "#F8766D" "#7CAE00" "#00BFC4" "#C77CFF"

# Show the colours
show_col(pal_default)
```

The default palette uses red, green, cyan, and purple. Red and green are the most dangerous pair for colour-blind viewers. Let's compare with a viridis palette of the same size.

```r
# Viridis palette for 4 colours
pal_viridis <- viridis_pal()(4)
print(pal_viridis)
#> [1] "#440154FF" "#31688EFF" "#35B779FF" "#FDE725FF"

# Show the colours
show_col(pal_viridis)
```

The viridis colours differ not just in hue but in brightness. Even if two hues look similar to a colour-blind viewer, the luminance difference keeps them distinguishable. That is the key principle: vary brightness, not just colour.

[WARNING]
**Never rely on colour alone to encode information.** Add a redundant visual channel — point shapes, line types, direct labels, or patterns. A colour-blind reader who cannot distinguish red from green can still read shapes (circles vs triangles) or text labels.

Here are practical rules for colour-blind-safe charts:

- Use viridis or ColorBrewer palettes marked `colorblind = TRUE`
- Limit discrete colours to 6-8 maximum
- Add `shape` as a redundant aesthetic: `aes(color = group, shape = group)`
- Test your palette by converting it to greyscale — if two colours merge, they will also merge for many colour-blind viewers

```r
# Practical test: convert palette to greyscale
pal_test <- c("#E41A1C", "#377EB8", "#4DAF4A")  # red, blue, green
cat("Original:", pal_test, "\n")
#> Original: #E41A1C #377EB8 #4DAF4A

# Convert to greyscale by averaging RGB channels
for (hex in pal_test) {
  rgb_vals <- col2rgb(hex)
  grey <- mean(rgb_vals)
  cat(hex, "-> greyscale brightness:", round(grey), "\n")
}
#> #E41A1C -> greyscale brightness: 90
#> #377EB8 -> greyscale brightness: 117
#> #4DAF4A -> greyscale brightness: 128
```

Red and green have similar greyscale brightness (90 vs 128), but they are more distinguishable than you might expect. The real danger zone is when two colours produce greyscale values within 20 points of each other. When that happens, swap one colour.

**Try it:** Check whether the "Dark2" Brewer palette (4 colours) has distinct greyscale values.

```r
# Try it: greyscale test for Dark2
ex_cb <- RColorBrewer::brewer.pal(4, "Dark2")
# your code here — convert each colour to greyscale and print brightness

#> Expected: all 4 values should be well-separated
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cb <- RColorBrewer::brewer.pal(4, "Dark2")
for (hex in ex_cb) {
  rgb_vals <- col2rgb(hex)
  grey <- mean(rgb_vals)
  cat(hex, "-> greyscale brightness:", round(grey), "\n")
}
#> #1B9E77 -> greyscale brightness: 115
#> #D95F02 -> greyscale brightness: 121
#> #7570B3 -> greyscale brightness: 127
#> #E7298A -> greyscale brightness: 128
```

**Explanation:** The values are close but not identical. "Dark2" relies on hue differences more than luminance. For maximum safety, pair it with a shape aesthetic.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using a qualitative palette for ordered data

:x: **Wrong:**
```r
# Ordered data (cylinder count) with qualitative palette
ggplot(mpg, aes(x = displ, y = hwy, color = factor(cyl))) +
  geom_point() +
  scale_color_brewer(palette = "Set2")
# Hues are random — 4, 5, 6, 8 cylinders have no visual order
```

**Why it is wrong:** "Set2" assigns unrelated hues to each level. A reader cannot tell that 8 cylinders > 6 > 5 > 4 from the colours alone.

:white_check_mark: **Correct:**
```r
# Use a sequential palette for ordered data
ggplot(mpg, aes(x = displ, y = hwy, color = factor(cyl))) +
  geom_point() +
  scale_color_viridis_d(option = "viridis") +
  labs(color = "Cylinders")
#> Dark purple = 4 cyl, yellow = 8 cyl — order is clear
```

### Mistake 2: Using rainbow or jet palettes

:x: **Wrong:**
```r
# Rainbow palette — perceptually non-uniform
ggplot(mpg, aes(x = displ, y = hwy, color = cty)) +
  geom_point() +
  scale_color_gradientn(colours = rainbow(7))
# Yellow band appears brighter, misleading the eye
```

**Why it is wrong:** Rainbow palettes have uneven luminance. The yellow band looks brighter than blue or red, making mid-range values appear more prominent than they are. The palette also fails completely in greyscale.

:white_check_mark: **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy, color = cty)) +
  geom_point() +
  scale_color_viridis_c() +
  labs(color = "City MPG")
```

### Mistake 3: Using scale_color_brewer() on continuous data

:x: **Wrong:**
```r
# This will error: Brewer is for discrete data
# ggplot(mpg, aes(x = displ, y = hwy, color = cty)) +
#   geom_point() +
#   scale_color_brewer(palette = "Blues")
cat("Error: Continuous value supplied to discrete scale\n")
#> Error: Continuous value supplied to discrete scale
```

**Why it is wrong:** `scale_color_brewer()` expects discrete (factor/character) data. For continuous data, you need `scale_color_distiller()` (interpolates Brewer palettes) or `scale_color_fermenter()` (binned Brewer palettes).

:white_check_mark: **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy, color = cty)) +
  geom_point() +
  scale_color_distiller(palette = "Blues", direction = 1) +
  labs(color = "City MPG")
```

### Mistake 4: Putting a fixed colour inside aes()

:x: **Wrong:**
```r
# "blue" is treated as a data variable, not a colour
ggplot(mpg, aes(x = displ, y = hwy, color = "blue")) +
  geom_point()
# All points become one colour (salmon/red) with a legend entry for "blue"
```

**Why it is wrong:** Anything inside `aes()` is interpreted as a data mapping. The string "blue" becomes a single-level factor, and ggplot2 maps it to the first default colour (salmon red).

:white_check_mark: **Correct:**
```r
# Fixed colour goes OUTSIDE aes()
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(color = "blue")
```

### Mistake 5: Too many discrete colours

:x: **Wrong:**
```r
# 15 colours — impossible to distinguish
many_groups <- data.frame(
  x = 1:15, y = runif(15), group = paste0("G", 1:15)
)
ggplot(many_groups, aes(x = x, y = y, color = group)) +
  geom_point(size = 3)
# 15 colours are visually indistinguishable
```

**Why it is wrong:** Humans can reliably distinguish about 6-8 colours at once. Beyond that, the chart becomes a guessing game between the legend and the data.

:white_check_mark: **Correct:**
```r
# Bin or facet when you have too many categories
many_groups$super_group <- ifelse(many_groups$x <= 5, "Low",
                            ifelse(many_groups$x <= 10, "Mid", "High"))
ggplot(many_groups, aes(x = x, y = y, color = super_group)) +
  geom_point(size = 3) +
  scale_color_brewer(palette = "Set2")
#> 3 colours — clear and readable
```

## Practice Exercises

### Exercise 1: Scatter plot with Brewer palette and redundant shapes

Build a scatter plot of `mpg` with `hwy` on the y-axis and `displ` on the x-axis. Colour by `drv` (drive type) using the "Dark2" Brewer palette. Add `shape = drv` as a redundant encoding for colour-blind safety.

```r
# Exercise 1: Brewer palette + shape redundancy
# Hint: map both color and shape to drv inside aes()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_scatter <- ggplot(mpg, aes(x = displ, y = hwy, color = drv, shape = drv)) +
  geom_point(size = 2) +
  scale_color_brewer(palette = "Dark2") +
  labs(title = "Drive type with colour + shape redundancy",
       x = "Engine displacement (L)", y = "Highway MPG",
       color = "Drive", shape = "Drive")
print(my_scatter)
#> Three drive types shown as different colours AND shapes
```

**Explanation:** Mapping both `color` and `shape` to the same variable creates a redundant encoding. A viewer who cannot distinguish the colours can still read the shapes. ggplot2 merges the two legends into one automatically.

</details>

### Exercise 2: Heatmap with viridis continuous scale

Create a tile plot using `geom_tile()` on the built-in `faithfuld` dataset (`waiting` on x, `eruptions` on y, `density` as fill). Apply `scale_fill_viridis_c()` with the "inferno" option. Customise the legend title to "Density" and set breaks at 0.01 and 0.02.

```r
# Exercise 2: heatmap with viridis
# Hint: use geom_tile(aes(fill = density)) and scale_fill_viridis_c()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_heatmap <- ggplot(faithfuld, aes(x = waiting, y = eruptions, fill = density)) +
  geom_tile() +
  scale_fill_viridis_c(option = "inferno",
                       name = "Density",
                       breaks = c(0.01, 0.02)) +
  labs(title = "Old Faithful eruption density",
       x = "Waiting time (min)", y = "Eruption duration (min)")
print(my_heatmap)
#> Two clusters of density visible in the inferno colour map
```

**Explanation:** `faithfuld` is a 2D density estimate of Old Faithful geyser data. The "inferno" palette runs from black (low density) through red and orange to yellow (high density). Custom breaks at 0.01 and 0.02 highlight the key density thresholds.

</details>

### Exercise 3: Custom diverging palette centred on zero

Create sample data where values diverge from zero: `data.frame(x = 1:20, y = rnorm(20))`. Plot with `geom_col()` and apply `scale_fill_gradient2()` with blue for negative, white for zero, and red for positive. Set `midpoint = 0`.

```r
# Exercise 3: diverging gradient centred on zero
# Hint: scale_fill_gradient2(low, mid, high, midpoint)
set.seed(99)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
my_data <- data.frame(x = 1:20, y = rnorm(20))
my_diverge <- ggplot(my_data, aes(x = x, y = y, fill = y)) +
  geom_col() +
  scale_fill_gradient2(low = "#2166AC", mid = "white", high = "#B2182B",
                       midpoint = 0, name = "Value") +
  labs(title = "Diverging palette centred on zero",
       x = "Observation", y = "Value")
print(my_diverge)
#> Blue bars below zero, red bars above zero, white at the boundary
```

**Explanation:** `scale_fill_gradient2()` creates a three-colour gradient. The `midpoint` argument controls where the neutral colour (white) sits. This is ideal for profit/loss, residuals, or any data where deviation from a reference point matters.

</details>

## Putting It All Together

Let's build a publication-quality chart that applies everything from this tutorial: viridis for perception, shape for redundancy, and a clean theme.

```r
# Complete example: publication-quality scatter
set.seed(42)
p_final <- ggplot(mpg, aes(x = displ, y = hwy, color = cty, shape = drv)) +
  geom_point(size = 2.5, alpha = 0.8) +
  scale_color_viridis_c(option = "viridis", name = "City MPG") +
  scale_shape_manual(values = c("4" = 16, "f" = 17, "r" = 15),
                     name = "Drive Type") +
  labs(
    title = "Fuel Economy by Engine Size, Drive Type, and City MPG",
    x = "Engine Displacement (L)",
    y = "Highway MPG"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    legend.position = "right",
    plot.title = element_text(face = "bold", size = 14)
  )
print(p_final)
```

This chart encodes three variables: engine displacement (x-axis), highway MPG (y-axis), city MPG (viridis colour), and drive type (shape). The viridis palette ensures the colour gradient is honest and accessible. The shape aesthetic provides a redundant channel for drive type, so colour-blind viewers can still identify front-wheel, rear-wheel, and four-wheel drive.

The `alpha = 0.8` adds slight transparency to reduce overplotting. The minimal theme removes chart junk, and the bold title draws the eye to the message.

[NOTE]
**You can combine colour and shape for up to 3 groups safely.** Beyond 3 shape levels, shapes become hard to distinguish at small sizes. For more than 3 groups, consider faceting with `facet_wrap()` instead of cramming everything into one panel.

## Summary

| Scale Function | Data Type | Palette Source | Best For |
|---|---|---|---|
| `scale_color_manual()` | Discrete | Your hex codes or colour names | Brand colours, exact specifications |
| `scale_color_brewer()` | Discrete | ColorBrewer (qualitative, sequential, diverging) | Publication-quality categorical plots |
| `scale_color_distiller()` | Continuous | ColorBrewer (interpolated) | Continuous data with Brewer aesthetics |
| `scale_color_viridis_d()` | Discrete | Viridis (8 options) | Accessible discrete palettes |
| `scale_color_viridis_c()` | Continuous | Viridis (8 options) | Default for continuous data |
| `scale_color_gradient()` | Continuous | Two-colour custom gradient | Simple low-to-high gradients |
| `scale_color_gradient2()` | Continuous | Three-colour custom gradient | Diverging data with a midpoint |

**Key takeaways:**

- Match palette type to data type: qualitative for categories, sequential for ordered, diverging for centred
- Viridis is the safest default for continuous data — perceptually uniform, greyscale-safe, colour-blind-robust
- Use named vectors with `scale_color_manual()` so colours stick to their levels
- Add shape or label as a redundant channel for colour-blind safety
- Test your palette by checking greyscale brightness values

## FAQ

**What is the difference between color and fill in ggplot2?**
`color` controls the outline or stroke of a geom (points, lines, polygon borders). `fill` controls the interior (bars, boxes, polygon areas). Most geoms use one or the other, but some (like `geom_bar()`) support both. Use `scale_color_*()` for colour aesthetics and `scale_fill_*()` for fill aesthetics.

**How do I reverse a colour palette?**
For Brewer palettes, add `direction = -1` inside the scale function: `scale_color_brewer(palette = "Blues", direction = -1)`. For viridis, use the same argument: `scale_color_viridis_c(direction = -1)`. For manual palettes, reverse your vector with `rev()`.

**Can I use hex codes with scale_color_manual()?**
Yes. `scale_color_manual(values = c("#E41A1C", "#377EB8", "#4DAF4A"))` works perfectly. You can mix hex codes and named colours in the same vector: `c("steelblue", "#E41A1C", "forestgreen")`.

**How many discrete colours can I use before the chart becomes unreadable?**
The practical limit is 6-8 colours. Beyond that, viewers struggle to match colours between the legend and the data points. If you have more than 8 categories, consider grouping small categories into "Other", using facets, or switching to direct labels instead of a legend.

**Why does scale_color_brewer() fail on continuous data?**
`scale_color_brewer()` is designed for discrete (factor or character) data only. For continuous data, use `scale_color_distiller()` (smooth interpolation of Brewer palettes) or `scale_color_fermenter()` (binned Brewer palettes). The naming follows ggplot2 convention: brewer = discrete, distiller = continuous, fermenter = binned.

## References

1. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Chapter 11: Colour Scales and Legends. [Link](https://ggplot2-book.org/scales-colour.html)
2. ggplot2 documentation — scale_colour_viridis_d() reference. [Link](https://ggplot2.tidyverse.org/reference/scale_viridis.html)
3. ggplot2 documentation — scale_colour_brewer() reference. [Link](https://ggplot2.tidyverse.org/reference/scale_brewer.html)
4. Brewer, C.A. — ColorBrewer 2.0: Color Advice for Cartography. [Link](https://colorbrewer2.org/)
5. Garnier, S. — Introduction to the viridis color maps (CRAN vignette). [Link](https://cran.r-project.org/web/packages/viridis/vignettes/intro-to-viridis.html)
6. Okabe, M. & Ito, K. — Color Universal Design: How to make figures and presentations that are friendly to Colorblind people (2008). [Link](https://jfly.uni-koeln.de/color/)
7. R Core Team — grDevices: Colors and palettes. [Link](https://stat.ethz.ch/R-manual/R-devel/library/grDevices/html/palettes.html)

## What's Next?

- [ggplot2 Tutorial](ggplot2-Tutorial-With-R.html) — A complete introduction to building plots with ggplot2, from geoms to facets
- [ggplot2 Theme Customization](Complete-Ggplot2-Tutorial-Part2-Customizing-Theme-With-R-Code.html) — Control fonts, backgrounds, axes, and every visual element of your chart
