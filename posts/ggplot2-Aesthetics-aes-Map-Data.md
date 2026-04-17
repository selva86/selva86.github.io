---
title: "ggplot2 aes(): Map Any Variable to Any Visual Property, The Complete Reference"
slug: "ggplot2-Aesthetics-aes-Map-Data"
description: "aes() maps data columns to visual properties like colour, fill, size, shape, and alpha. Learn which aesthetics each geom supports and how to set vs map."
keywords: "ggplot2 aesthetics, aes() in ggplot2, ggplot2 colour mapping, ggplot2 fill, ggplot2 shape, ggplot2 size, ggplot2 alpha, ggplot2 linetype, set vs map aesthetics, ggplot2 scale override"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.3"
post_type: "C"
auto_link_terms: "ggplot2 aesthetics|aes() in ggplot2|ggplot2 aes|aesthetic mapping|colour mapping in ggplot2|fill aesthetic|shape aesthetic"
auto_link_case_sensitive: false
sidebar_section: "Visualization"
sidebar_title: "ggplot2 Aesthetics (aes)"
sidebar_order: 6
difficulty: "Intermediate"
---


# ggplot2 aes(): Map Any Variable to Any Visual Property, The Complete Reference

<p class="lead">The <code>aes()</code> function maps columns in your data to visual properties, colour, fill, size, shape, alpha, and linetype, so ggplot2 automatically varies those properties across data values and generates a matching legend.</p>

## Introduction

Every ggplot2 plot starts with `aes()`, but most tutorials stop at `aes(x, y)`. That barely scratches the surface. The `aes()` function can map *any* variable to *any* visual property, colour, fill, size, shape, transparency, line type, and more.

Think of `aes()` as a translator. Your data frame speaks in column names. The plot speaks in colours, sizes, and shapes. `aes()` sits between them, telling ggplot2: "use this column to control that visual channel." Without `aes()`, ggplot2 has no idea how to connect your data to what you see on screen.

In this tutorial, you will learn every major aesthetic ggplot2 supports, when to map an aesthetic to data versus set it to a fixed value, how layers inherit aesthetics from the global `ggplot()` call, and how to override default scales. Every code block runs directly in your browser, click **Run** to see results instantly.

![ggplot2 Aesthetics Overview](screenshots/ggplot2-Aesthetics-aes-Map-Data-overview.webp)

*Figure 1: The six families of aesthetics available in aes().*

## What does aes() actually do?

`aes()` creates a mapping object, a set of instructions that links column names to visual properties. It does not draw anything by itself. A geom reads those instructions and decides how to render each observation.

Let's start with the simplest scatter plot. We map `displ` (engine displacement) to the x-axis and `hwy` (highway miles per gallon) to the y-axis using the built-in `mpg` dataset.

```r
# Load ggplot2 and preview the data
library(ggplot2)
head(mpg, 4)
#>   manufacturer model displ year cyl      trans drv cty hwy fl   class
#> 1         audi    a4   1.8 1999   4   auto(l5)   f  18  29  p compact
#> 2         audi    a4   1.8 1999   4 manual(m5)   f  21  29  p compact
#> 3         audi    a4   2.0 2008   4 manual(m6)   f  20  31  p compact
#> 4         audi    a4   2.0 2008   4   auto(av)   f  21  30  p compact
```

So far we have two aesthetics: x and y. Now let's add a third, colour, to reveal which vehicle class each point belongs to.

```r
# Map colour to the class variable
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 3)
```

Each class gets a distinct colour, and ggplot2 automatically generates a legend. That is `aes()` at work, it mapped the `class` column to the `colour` visual channel.

[KEY INSIGHT]
**aes() describes intent, geoms execute it.** The aes() function never draws pixels. It creates a mapping blueprint that geoms read to decide how each observation should look.

**Try it:** Add `size = cyl` inside the existing `aes()` call so that point size reflects the number of cylinders. What happens to the legend?

```r
# Try it: add size = cyl
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point()
  # Modify the aes() above to also include size = cyl

#> Expected: points vary in both colour and size, two legends appear
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cyl)) +
  geom_point()
```

**Explanation:** Adding `size = cyl` inside `aes()` maps the `cyl` column to point size. ggplot2 creates a second legend for size alongside the colour legend.

</details>

## How do you map colour and fill to data?

`colour` and `fill` are the two most-used aesthetics after x and y, but they control different things. `colour` changes outlines and point colours. `fill` changes the interior of shapes, bars, boxplots, polygons, and area geoms.

Let's see `colour` on a scatter plot first. Each vehicle class gets a unique hue.

```r
# colour on a scatter plot — controls point colour
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 3) +
  labs(title = "colour maps to point colour")
```

Now let's see `fill` on a bar chart. The `fill` aesthetic controls the interior colour of each bar.

```r
# fill on a bar chart — controls bar interior
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  labs(title = "fill maps to bar interior colour")
```

The bars are coloured by drivetrain (`drv`: front, rear, 4-wheel). Notice that `colour` would only change the bar outlines, `fill` is what you want for bars.

When you map `colour` to a continuous variable, ggplot2 switches from discrete hues to a gradient scale.

```r
# Continuous colour produces a gradient
ggplot(mpg, aes(x = displ, y = hwy, colour = cty)) +
  geom_point(size = 3) +
  labs(title = "Continuous variable produces gradient scale")
```

The legend changes from discrete swatches to a colour bar. City mileage (`cty`) controls where each point falls on the blue gradient.

[TIP]
**Use colour for points and lines, fill for bars, areas, and polygons.** If your geom has an interior, use fill. If it only has edges or dots, use colour.

**Try it:** Create a boxplot of `hwy` grouped by `class`, with the boxes filled by `drv`. Use `geom_boxplot()`.

```r
# Try it: boxplot with fill
ggplot(mpg, aes(x = class, y = hwy)) +
  geom_boxplot()
  # Add fill = drv to the aes() above

#> Expected: boxes coloured by drivetrain within each class
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = class, y = hwy, fill = drv)) +
  geom_boxplot()
```

**Explanation:** `fill = drv` inside `aes()` colours each box by the drivetrain variable. ggplot2 creates side-by-side boxes within each class group.

</details>

## How do shape, size, and alpha encode additional variables?

Beyond colour and fill, three more aesthetics let you encode data: `shape` for categorical distinctions, `size` for magnitude, and `alpha` for transparency.

`shape` works best with categorical variables that have few levels. ggplot2 provides 6 default shapes, if your variable has more than 6 levels, extra levels won't appear.

```r
# shape maps drivetrain to point symbols
ggplot(mpg, aes(x = displ, y = hwy, shape = drv)) +
  geom_point(size = 3) +
  labs(title = "shape distinguishes drivetrain")
```

Three drivetrain types, three shapes. Each point's symbol tells you whether the car is front-wheel, rear-wheel, or 4-wheel drive.

`size` works best with continuous variables. It makes points larger or smaller to reflect a numeric value.

```r
# size maps engine cylinders to point area
ggplot(mpg, aes(x = displ, y = hwy, size = cyl)) +
  geom_point(alpha = 0.6) +
  labs(title = "size reflects number of cylinders")
```

Larger dots mean more cylinders. Notice we set `alpha = 0.6` *outside* `aes()`, a fixed transparency for all points. That is a preview of the set-vs-map distinction coming in the next section.

`alpha` (transparency) is perfect for revealing density in overplotted scatter plots.

```r
# alpha reveals where points overlap
ggplot(mpg, aes(x = cty, y = hwy, alpha = displ)) +
  geom_point(size = 3, colour = "steelblue") +
  labs(title = "alpha reveals engine size")
```

Darker points have larger engines. Where many points overlap, the combined opacity makes clusters visible.

| Aesthetic | Best for | Data type | Practical limit |
|---|---|---|---|
| colour | Categories or gradients | Categorical or continuous | 8-10 categories max |
| fill | Bar/box interiors | Categorical or continuous | 8-10 categories max |
| shape | Small category count | Categorical only | 6 default shapes |
| size | Magnitudes | Continuous | Avoid with categorical |
| alpha | Density / overplotting | Continuous | 0 (invisible) to 1 (opaque) |
| linetype | Line distinctions | Categorical only | 6 types |

[WARNING]
**shape only supports 6 discrete values by default.** If you map a variable with 7+ levels to shape, ggplot2 drops the extra levels with a warning. Switch to colour for high-cardinality variables.

**Try it:** Create a scatter of `displ` vs `hwy` and map `alpha` to `cty` (city mileage). Set all points to `colour = "darkred"` and `size = 3`.

```r
# Try it: map alpha to cty
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point()
  # Map alpha to cty, set colour to "darkred", set size to 3

#> Expected: darker points have higher city mileage
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy, alpha = cty)) +
  geom_point(colour = "darkred", size = 3)
```

**Explanation:** `alpha = cty` inside `aes()` maps transparency to city mileage. `colour` and `size` are outside `aes()` so they apply uniformly to all points.

</details>

## What is the difference between setting and mapping an aesthetic?

This is the single most common source of ggplot2 confusion. The rule is simple: inside `aes()` means *mapped to data*; outside `aes()` means *fixed to a constant*.

![Setting vs Mapping Decision Flow](screenshots/ggplot2-Aesthetics-aes-Map-Data-set-vs-map.webp)

*Figure 2: Deciding whether to set or map an aesthetic.*

When you **map** colour, ggplot2 reads each row's value and picks a colour from a scale. A legend appears automatically.

```r
# MAPPED: colour varies by class, legend appears
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 3) +
  labs(title = "Mapped: colour = class inside aes()")
```

When you **set** colour, every point gets the same colour. No legend is needed.

```r
# SET: all points get the same fixed colour
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(size = 3, colour = "steelblue") +
  labs(title = "Set: colour = 'steelblue' outside aes()")
```

Now here is the classic mistake. What happens if you put a colour name *inside* `aes()`?

```r
# MISTAKE: constant inside aes() — creates a one-level category
ggplot(mpg, aes(x = displ, y = hwy, colour = "red")) +
  geom_point(size = 3) +
  labs(title = "Bug: 'red' inside aes() is NOT red")
```

The points are NOT red. ggplot2 treats `"red"` as a categorical variable with one level and assigns it the first colour in the default palette (usually salmon or coral). A useless legend saying "red" appears.

[WARNING]
**Putting a constant colour inside aes() creates a one-level factor.** ggplot2 does not interpret the string "red" as a colour, it treats it as a data category. Move colour constants outside aes().

**Try it:** The plot below has a bug, `colour = "blue"` is inside `aes()`. Move it to the correct location so all points are actually blue.

```r
# Try it: fix this broken plot
ggplot(mpg, aes(x = displ, y = hwy, colour = "blue")) +
  geom_point(size = 3)

#> Expected: all points should be blue with no legend
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(size = 3, colour = "blue")
```

**Explanation:** Moving `colour = "blue"` from inside `aes()` to inside `geom_point()` (but outside `aes()`) sets all points to blue. The misleading legend disappears.

</details>

## How do aesthetics inherit across layers?

When you place aesthetics in the `ggplot()` call, every layer inherits them. When you place aesthetics inside a specific geom, only that layer uses them. This inheritance system keeps your code clean.

![Aesthetic Inheritance in Layers](screenshots/ggplot2-Aesthetics-aes-Map-Data-layer-inheritance.webp)

*Figure 3: How layers inherit aesthetics from the global ggplot() call.*

Let's build a plot with two layers, points and a smoother, that both inherit x, y, and colour from the global `aes()`.

```r
# Both layers inherit colour = class from ggplot()
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2) +
  geom_smooth(method = "lm", se = FALSE) +
  labs(title = "Both layers inherit global aesthetics")
```

Both points and trend lines are coloured by class. That is inheritance at work, you wrote `colour = class` once, and both geoms use it.

Now let's override colour in just the smoother. We want the points coloured by class, but a single grey trend line across all data.

```r
# Override: smoother ignores the colour grouping
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2) +
  geom_smooth(method = "lm", se = FALSE, colour = "grey40", aes(group = 1)) +
  labs(title = "Points by class, one overall trend line")
```

The smoother now draws a single grey line because we set `colour = "grey40"` outside `aes()` in that specific layer. We also set `aes(group = 1)` to tell ggplot2 to treat all rows as one group for the smoother.

You can also add a layer-specific aesthetic that the other layers don't have. Here, only the points get `shape = drv`.

```r
# Layer-specific aesthetic: only points use shape
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(aes(shape = drv, colour = class), size = 2) +
  geom_smooth(method = "lm", se = FALSE, colour = "grey30") +
  labs(title = "shape and colour only in geom_point")
```

The smoother is unaffected by shape or colour because those mappings live only inside `geom_point()`.

[TIP]
**Put shared mappings in ggplot(), layer-specific ones in the geom.** This avoids repeating aes() in every layer and makes it clear which aesthetics are global versus local.

**Try it:** Start with the code below. Add a `geom_smooth()` that draws a single overall trend line (ignoring the colour grouping). Set the smoother's colour to `"black"`.

```r
# Try it: add a single overall smoother
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2)
  # Add geom_smooth() that ignores colour grouping

#> Expected: coloured points + one black trend line
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2) +
  geom_smooth(method = "lm", se = FALSE, colour = "black", aes(group = 1))
```

**Explanation:** Setting `colour = "black"` outside `aes()` in `geom_smooth()` fixes the line colour. Adding `aes(group = 1)` overrides the inherited `colour = class` grouping, producing one line for all data.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Putting a fixed colour inside aes()

❌ **Wrong:**
```r
ggplot(mpg, aes(x = displ, y = hwy, colour = "blue")) +
  geom_point()
```

**Why it is wrong:** ggplot2 treats `"blue"` as a one-level categorical variable and assigns it the default palette colour (not blue). A useless legend appears.

✅ **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "blue")
```

### Mistake 2: Using fill on shapes that don't support it

❌ **Wrong:**
```r
ggplot(mpg, aes(x = displ, y = hwy, fill = class)) +
  geom_point(size = 3)
```

**Why it is wrong:** Default point shape (19) has no interior to fill. The points ignore the fill aesthetic entirely, no colour change, no error, just silence.

✅ **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy, fill = class)) +
  geom_point(size = 3, shape = 21, stroke = 0.5)
```

Shapes 21-25 have both fill and colour (outline). Use one of these when you need `fill` on points.

### Mistake 3: Mapping a continuous variable to shape

❌ **Wrong:**
```r
ggplot(mpg, aes(x = displ, y = hwy, shape = cty)) +
  geom_point()
#> Error: A continuous variable cannot be mapped to shape
```

**Why it is wrong:** Shapes are discrete symbols, there is no meaningful way to order them along a continuous scale. ggplot2 throws an error.

✅ **Correct:**
```r
ggplot(mpg, aes(x = displ, y = hwy, size = cty)) +
  geom_point()
```

Use `size` or `colour` for continuous variables. Reserve `shape` for categorical data with fewer than 7 levels.

### Mistake 4: Overloading one plot with too many aesthetics

❌ **Wrong:**
```r
ggplot(mpg, aes(x = displ, y = hwy, colour = class, shape = drv,
                size = cyl, alpha = cty)) +
  geom_point()
```

**Why it is wrong:** Four simultaneous aesthetics (plus x and y) overwhelm the reader. The plot becomes unreadable, too many legends, too much visual noise.

✅ **Correct:**
```r
# Pick 1-2 non-positional aesthetics
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 3, alpha = 0.7)
```

Map at most 2 non-positional aesthetics to data. Set the rest to fixed values for clarity.

## Practice Exercises

### Exercise 1: Multi-aesthetic scatter plot

Build a scatter plot of `displ` (x) vs `hwy` (y) from the `mpg` dataset. Map `colour` to `class` and `size` to `cyl`. Set `alpha` to 0.7 (fixed). Add a title.

```r
# Exercise 1: multi-aesthetic scatter
# Hint: colour and size go inside aes(), alpha outside

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_plot1 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cyl)) +
  geom_point(alpha = 0.7) +
  labs(title = "Engine size vs fuel economy by vehicle class")
my_plot1
```

**Explanation:** `colour = class` and `size = cyl` are mapped aesthetics inside `aes()`. `alpha = 0.7` is a fixed setting outside `aes()`, applied to all points equally.

</details>

### Exercise 2: Layered plot with selective inheritance

Create a plot with `geom_point()` coloured by `class` and `geom_smooth()` that fits a single LOESS curve across all data. The smoother should be dark grey with a confidence band.

```r
# Exercise 2: layered plot with selective inheritance
# Hint: use aes(group = 1) in geom_smooth to ignore colour grouping

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_plot2 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2) +
  geom_smooth(aes(group = 1), colour = "grey30", fill = "grey80") +
  labs(title = "Coloured points with overall trend")
my_plot2
```

**Explanation:** `aes(group = 1)` inside `geom_smooth()` overrides the colour-based grouping inherited from `ggplot()`. Setting `colour = "grey30"` and `fill = "grey80"` outside `aes()` applies fixed colours to the smoother and its confidence band.

</details>

### Exercise 3: Customized bar chart with scale override

Build a stacked bar chart of `class` with `fill` mapped to `drv`. Override the default fill palette using `scale_fill_brewer(palette = "Set2")`. Rotate x-axis labels 45 degrees.

```r
# Exercise 3: bar chart with custom fill scale
# Hint: scale_fill_brewer() overrides the default palette
# Hint: theme(axis.text.x = element_text(angle = 45, hjust = 1))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_plot3 <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar() +
  scale_fill_brewer(palette = "Set2") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  labs(title = "Vehicle class by drivetrain", fill = "Drivetrain")
my_plot3
```

**Explanation:** `scale_fill_brewer(palette = "Set2")` replaces the default fill colours with the ColorBrewer "Set2" palette. The `theme()` call rotates x-axis labels for readability.

</details>

## Putting It All Together

Let's build a polished, publication-ready scatter plot that combines multiple aesthetics, custom scales, and clear labels.

```r
# Complete example: polished multi-aesthetic scatter
ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cyl)) +
  geom_point(alpha = 0.7) +
  scale_colour_brewer(palette = "Dark2") +
  scale_size_continuous(range = c(2, 6)) +
  labs(
    title = "Engine Displacement vs Highway Fuel Economy",
    subtitle = "Point size reflects number of cylinders",
    x = "Engine Displacement (litres)",
    y = "Highway MPG",
    colour = "Vehicle Class",
    size = "Cylinders"
  ) +
  theme_minimal(base_size = 13)
#> (Scatter plot with 7 colour-coded classes, size-scaled points,
#>  Dark2 palette, minimal theme, descriptive labels)
```

This plot maps two aesthetics to data (colour for class, size for cylinders) and sets one (alpha at 0.7). The `scale_colour_brewer()` call overrides the default palette, and `scale_size_continuous(range = c(2, 6))` controls the minimum and maximum point sizes. Clear axis labels and a subtitle tell the reader exactly what they're seeing.

## Summary

| Aesthetic | Controls | Best for | Key rule |
|---|---|---|---|
| `colour` | Point/line colour | Categories or gradients | Use for outlines and dots |
| `fill` | Interior colour | Bars, boxes, areas | Only shapes 21-25 for points |
| `shape` | Point symbol | Categorical (max 6) | Cannot map continuous data |
| `size` | Point/text area | Continuous magnitudes | Avoid with categorical |
| `alpha` | Transparency | Overplotting / density | Range 0 (invisible) to 1 |
| `linetype` | Dash pattern | Categorical lines | 6 built-in types |
| Inside `aes()` | Mapped to data | When values should vary | Creates a legend |
| Outside `aes()` | Fixed constant | When all elements match | No legend |

## FAQ

**Why does `colour = "red"` inside aes() not produce red points?**

Because `aes()` interprets every value as a data mapping. The string "red" becomes a one-level factor, and ggplot2 assigns the first default palette colour. Move the colour constant outside `aes()` into the geom function directly.

**What is the difference between colour and color in ggplot2?**

Nothing. ggplot2 accepts both British (`colour`) and American (`color`) spellings. Internally, it converts `color` to `colour`. Use whichever you prefer, they produce identical results.

**Can I use computed expressions inside aes()?**

Yes. `aes()` supports any R expression that evaluates to a vector: `aes(x = log(displ))`, `aes(colour = cyl > 4)`, or `aes(label = paste(manufacturer, model))`. The expression runs within the data context.

**How many point shapes does ggplot2 support?**

There are 26 built-in shapes numbered 0 through 25. Shapes 0-20 have only `colour` (outline). Shapes 21-25 have both `colour` (outline) and `fill` (interior). You can also use any single character as a shape, like `"+"` or `"*"`.

**How do I change the colours ggplot2 assigns to mapped aesthetics?**

Use a scale function. For discrete colour: `scale_colour_manual(values = c(...))` or `scale_colour_brewer(palette = "Set1")`. For continuous colour: `scale_colour_gradient(low = "blue", high = "red")`. Every mapped aesthetic has a matching `scale_*` function.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd ed. Springer (2024). [Link](https://ggplot2-book.org/)
2. ggplot2 documentation, aes() reference. [Link](https://ggplot2.tidyverse.org/reference/aes.html)
3. ggplot2 documentation, Aesthetic specifications. [Link](https://ggplot2.tidyverse.org/articles/ggplot2-specs.html)
4. ggplot2 documentation, Colour, fill, and alpha aesthetics. [Link](https://ggplot2.tidyverse.org/reference/aes_colour_fill_alpha.html)
5. ggplot2 documentation, Linetype, size, and shape aesthetics. [Link](https://ggplot2.tidyverse.org/reference/aes_linetype_size_shape.html)
6. Wilkinson, L., *The Grammar of Graphics*, 2nd ed. Springer (2005).
7. Wickham, H., Cetinkaya-Rundel, M., Grolemund, G., *R for Data Science*, 2nd ed. O'Reilly (2023). Ch. 2: Data Visualization. [Link](https://r4ds.hadley.nz/data-visualize.html)

## Continue Learning
- **[Top 50 ggplot2 Visualizations](Top50-Ggplot2-Visualizations-MasterList-R-Code.html)**, a gallery of 50 chart types with code, organized by data relationship
- **[ggplot2 Tutorial Part 1, Introduction](Complete-Ggplot2-Tutorial-Part1-With-R-Code.html)**, the full ggplot2 foundation including geoms, stats, and coordinates
- **[ggplot2 Tutorial Part 2, Customizing Theme](Complete-Ggplot2-Tutorial-Part2-Customizing-Theme-With-R-Code.html)**, how to control fonts, colours, gridlines, and every non-data element
