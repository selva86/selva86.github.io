---
title: "R Color Theory: Choose Palettes, Use ColorBrewer, and Design for Colorblind Readers"
slug: "R-Color-Theory-ggplot2"
description: "Learn R color theory for ggplot2: sequential, diverging, and qualitative palettes, RColorBrewer, viridis, and how to test your chart for colorblind accessibility."
keywords: "R color palettes, RColorBrewer ggplot2, viridis R, colorblind ggplot2, ggplot2 color scale, sequential palette R, diverging palette ggplot2, qualitative palette R"
auto_link_terms: "R color palettes|RColorBrewer|viridis palette|colorblind ggplot2|scale_color_brewer()|scale_fill_viridis_c()|color theory R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-ggpl-5"
post_type: "FR"
fr_parent: "ggplot2-Colours.html"
difficulty: "Intermediate"
---

# R Color Theory: Choose Palettes, Use ColorBrewer, and Design for Colorblind Readers

<p class="lead">Color in data visualization is not decoration, it encodes information. The right palette makes patterns visible instantly; the wrong one obscures them or misleads. In ggplot2, three palette families handle three fundamentally different data situations: sequential, diverging, and qualitative.</p>

## Introduction

Choosing colors for a chart feels like an aesthetic decision, but it is actually a data decision. When you color a heatmap by temperature, a continuous gradient from blue to red communicates direction and magnitude simultaneously. When you color countries on a choropleth by political party, you need distinct, unordered colors that don't imply any ranking between parties. When you mark values that deviate above and below a neutral midpoint (like growth vs. decline), you need two opposing colors that meet at a meaningful zero.

Each of those situations requires a different palette type. Using the wrong one, for example, a qualitative palette on continuous data, forces readers to mentally convert discrete color steps into a continuous quantity, adding cognitive load and risking misinterpretation.

In this tutorial you will learn:

- The three palette families and when each applies
- How to apply ColorBrewer palettes with `scale_color_brewer()` and `scale_fill_distiller()`
- How viridis palettes provide perceptually uniform, colorblind-safe color for continuous data
- How to specify custom colors with `scale_color_manual()`
- How to design charts that remain readable for colorblind readers

## What Are the Three Types of Color Palettes?

Every color scale used in data visualization falls into one of three categories. Understanding which type your data needs is the most important color decision you will make.

**Sequential palettes** encode magnitude with a gradient from light (low) to dark (high). Use them for continuous data with a natural ordering and no meaningful midpoint, population density, temperature, price.

**Diverging palettes** encode deviation from a midpoint. Two contrasting hue families (e.g., blue and red) meet at a neutral center (white or beige). Use them when values can be meaningfully positive or negative, or above/below some reference, correlation coefficients, budget surplus/deficit, political lean.

**Qualitative palettes** use distinct, unordered hues to encode categorical membership. No hue should appear "more" or "less" than another. Use them for nominal categories, country, species, product type.

```r
library(ggplot2)
library(RColorBrewer)

# Display all ColorBrewer palettes to see the three families
display.brewer.all()
```

The output groups palettes into three rows: sequential (top), qualitative (middle), and diverging (bottom). Refer to this when deciding which family fits your data.

| Palette Type | Data Type | Example Variable | ggplot2 Function |
|---|---|---|---|
| Sequential | Continuous, one direction | Price, density, count | `scale_fill_distiller(type="seq")` |
| Diverging | Continuous, two directions | Correlation, surplus/deficit | `scale_fill_distiller(type="div")` |
| Qualitative | Categorical, unordered | Species, region, category | `scale_color_brewer(type="qual")` |

> **KEY INSIGHT:** The most common palette mistake is using a qualitative palette (distinct colors) for continuous data, or a sequential palette for nominal categories. The first makes continuous variation look stepwise; the second implies ranking where none exists.

**Try it:** Run `brewer.pal(n = 5, name = "Blues")` to see the 5-color sequential blue palette. Then try `brewer.pal(n = 5, name = "RdYlGn")` for a 5-color diverging palette.

```r
# Your code here — use brewer.pal() and show_col()
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_blues <- brewer.pal(n = 5, name = "Blues")
ex_rdylgn <- brewer.pal(n = 5, name = "RdYlGn")
ex_blues
#> [1] "#EFF3FF" "#BDD7E7" "#6BAED6" "#3182BD" "#08519C"
scales::show_col(ex_blues)
```

`brewer.pal()` returns hex codes, `"Blues"` is a sequential ramp from very pale blue at the low end to deep navy at the high end, while `"RdYlGn"` is a diverging palette (red → yellow → green) suitable for above/below-zero data. `scales::show_col()` lays them out as a swatch grid so you can preview the contrast before wiring them into a chart.
</details>

## How Do You Apply ColorBrewer Palettes in ggplot2?

ColorBrewer palettes are built into ggplot2 via two scale functions:

- `scale_color_brewer()` / `scale_fill_brewer()`, for **discrete** (categorical) variables
- `scale_color_distiller()` / `scale_fill_distiller()`, for **continuous** variables (interpolates between palette colors)

**Sequential palette on a heatmap:**

```r
# Heatmap of mtcars correlation matrix - needs a sequential palette
cor_mat <- cor(mtcars)
cor_df  <- as.data.frame(as.table(cor_mat))
names(cor_df) <- c("Var1", "Var2", "Corr")

p_seq <- ggplot(cor_df, aes(x = Var1, y = Var2, fill = Corr)) +
  geom_tile() +
  scale_fill_distiller(palette = "Blues", direction = 1) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  labs(title = "Sequential: Blues palette (low → high correlation)",
       x = NULL, y = NULL, fill = "Corr")

p_seq
```

**Diverging palette, correlations that go both positive and negative:**

```r
# Diverging palette centers at 0 - perfect for correlation
p_div <- ggplot(cor_df, aes(x = Var1, y = Var2, fill = Corr)) +
  geom_tile() +
  scale_fill_distiller(
    palette  = "RdBu",
    limits   = c(-1, 1),    # force symmetric scale around 0
    direction = 1
  ) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  labs(title = "Diverging: RdBu palette (blue=negative, red=positive)",
       x = NULL, y = NULL, fill = "Corr")

p_div
```

Notice how the diverging palette immediately shows that variables positively correlated (red) vs. negatively correlated (blue) with others, information the sequential palette obscures.

**Qualitative palette for categorical groups:**

```r
p_qual <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point(size = 2.5, alpha = 0.8) +
  scale_color_brewer(
    palette = "Set2",
    labels  = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  labs(
    title = "Qualitative: Set2 palette (unordered categories)",
    x     = "Displacement (L)",
    y     = "Highway MPG",
    color = "Drive Type"
  ) +
  theme_minimal()

p_qual
```

> **TIP:** ColorBrewer's most colorblind-friendly qualitative palette is `"Set2"`. `"Dark2"` is also good for print. Avoid `"Set1"` when a colorblind reader matters, its red-green combination is problematic for the most common form of color blindness.

**Try it:** Change `palette = "Set2"` to `palette = "Paired"` in `p_qual`. How does the chart's readability change?

```r
# Your code here — swap Set2 for Paired
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_paired <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point(size = 2.5, alpha = 0.8) +
  scale_color_brewer(palette = "Paired") +
  labs(color = "Drive Type")

ex_paired
```

`"Paired"` is a 12-colour qualitative palette designed for showing related pairs (light/dark blue, light/dark green, etc.). With only 3 drive categories you end up using the first three slots, light blue, dark blue, light green, which feel less visually balanced than `"Set2"`'s muted, evenly-spaced hues. Save `"Paired"` for cases where you genuinely have paired categories like "before/after" or "predicted/observed".
</details>

## How Does the Viridis Palette Family Work?

Viridis is a family of perceptually uniform color scales, meaning equal steps in data value correspond to equal perceived steps in color, across the full range. This is a property most palettes (including many ColorBrewer ones) don't have.

Viridis was also designed from the start to be:
- Readable in grayscale (for black-and-white printing)
- Distinguishable for the three main types of color blindness (deuteranopia, protanopia, tritanopia)
- Beautiful

The viridis family includes five palettes: `viridis` (purple-blue-yellow), `magma` (black-red-yellow), `plasma` (purple-orange-yellow), `inferno` (black-red-yellow, higher contrast), and `cividis` (optimized for deuteranopia).

```r
# viridis for continuous fill (e.g., diamond carat density)
p_vir <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_bin2d(bins = 50) +
  scale_fill_viridis_c(
    option = "plasma",     # try "viridis", "magma", "inferno", "cividis"
    name   = "Count",
    trans  = "log10"       # log scale - handles skewed count distributions
  ) +
  labs(
    title = "Diamond Carat vs Price Density (viridis: plasma)",
    x     = "Carat",
    y     = "Price (USD)"
  ) +
  theme_dark()   # dark theme makes viridis pop

p_vir
```

For **discrete** variables, use `scale_color_viridis_d()` or `scale_fill_viridis_d()`:

```r
p_vir_d <- ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(size = 2.5, alpha = 0.8) +
  scale_color_viridis_d(option = "turbo") +
  labs(
    title = "viridis discrete: turbo palette for vehicle classes",
    x     = "Displacement (L)",
    y     = "Highway MPG",
    color = "Class"
  ) +
  theme_minimal()

p_vir_d
```

> **KEY INSIGHT:** `viridis` is the safest default for continuous color scales in published work. It looks good on screen, prints in grayscale without losing information, and is accessible to colorblind readers, properties that most visually appealing palettes (like rainbow) fail on all three counts.

**Try it:** Change `option = "plasma"` to `option = "magma"` in `p_vir`. Then try `option = "cividis"`. Which looks best for the diamond density data?

```r
# Your code here — swap the option argument and re-render
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_magma <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_bin2d(bins = 50) +
  scale_fill_viridis_c(option = "magma", trans = "log10") +
  theme_dark()

ex_magma
```

`magma` (black → red → cream) gives a warmer, more cinematic look than `plasma` and reads especially well on a dark background, high-density bins glow against the panel. `cividis` is the most colorblind-safe of the family but its blue-yellow range is narrower, so subtle density differences are harder to spot. For exploratory work `plasma`/`magma` win on contrast; for publication where deuteranopia matters, `cividis` is the safer pick.
</details>

## How Do You Specify Custom Colors?

When built-in palettes don't fit your brand or data story, you can specify exact colors with `scale_color_manual()` or `scale_fill_manual()`.

```r
# Custom brand-aligned colors for vehicle drive types
p_manual <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  scale_fill_manual(
    values = c(
      "4" = "#2166ac",   # blue for 4WD
      "f" = "#d6604d",   # orange-red for front
      "r" = "#1a9850"    # green for rear
    ),
    labels = c("4" = "4WD", "f" = "Front-wheel", "r" = "Rear-wheel")
  ) +
  labs(
    title = "Custom manual colors by drive type",
    x     = "Vehicle Class",
    y     = "Count",
    fill  = "Drive"
  ) +
  theme_minimal()

p_manual
```

R accepts colors as hex codes (`"#2166ac"`), named colors (`"steelblue"`, `"tomato"`), or RGB values via `rgb(0.1, 0.5, 0.8)`. To see all named colors available in R, run `colors()`, there are 657 of them.

> **TIP:** When picking custom colors, check them at https://colorbrewer2.org or use the `prismatic` package's `check_color_blindness()` function to simulate how your palette appears under different types of color vision deficiency.

**Try it:** Replace the three hex codes in `p_manual` with named R colors (`"navy"`, `"coral"`, `"forestgreen"`). Do the resulting colors look as distinct?

```r
# Your code here — use scale_fill_manual() with R named colours
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_named <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge") +
  scale_fill_manual(values = c("4" = "navy", "f" = "coral", "r" = "forestgreen"))

ex_named
```

R's named colours (`"navy"`, `"coral"`, `"forestgreen"`) are convenient shortcuts for hex codes, and these three remain visually distinct because they sit far apart in hue space, deep blue, warm orange-pink, and dark green. The trade-off is precision: you can't fine-tune the exact shade, so for brand work hex codes are better; for quick exploratory plots named colours are perfectly readable.
</details>

## How Do You Design Charts for Colorblind Readers?

Approximately 8% of men and 0.5% of women have some form of color vision deficiency. The most common form is deuteranopia (red-green), where red and green are indistinguishable. This means any chart that encodes meaning with red vs. green alone is unreadable for ~1 in 12 male readers.

Three practical strategies:

**Strategy 1: Use colorblind-safe palettes.** Viridis, ColorBrewer's `"Set2"`, `"Dark2"`, and `"Okabe-Ito"` are safe by design.

**Strategy 2: Dual-encode with shape or linetype.** Map the same variable to both color and shape, even in grayscale or with color blindness, the shapes are distinguishable.

```r
# Dual encoding: color + shape for the same variable
p_cb <- ggplot(mpg, aes(x = displ, y = hwy,
                          color = drv, shape = drv)) +
  geom_point(size = 3, alpha = 0.8) +
  scale_color_manual(
    values = c("4" = "#0072B2", "f" = "#E69F00", "r" = "#009E73"),
    labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  scale_shape_manual(
    values = c("4" = 16, "f" = 17, "r" = 15),
    labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  labs(
    title    = "Dual encoding: color + shape for accessibility",
    subtitle = "Readers distinguish groups by shape even without color",
    x        = "Displacement (L)",
    y        = "Highway MPG",
    color    = "Drive Type",
    shape    = "Drive Type"
  ) +
  theme_minimal()

p_cb
```

The three hex colors above (`#0072B2`, `#E69F00`, `#009E73`) are from the Okabe-Ito palette, specifically designed for colorblind accessibility by statistician Masataka Okabe and color scientist Kei Ito.

**Strategy 3: Simulate colorblind vision.** The `colorspace` package includes `deutan()`, `protan()`, and `tritan()` functions to simulate how your color choices appear under different deficiencies.

> **WARNING:** Never rely on red vs. green as the only differentiator in a chart. This combination fails for deuteranopia (the most common form of color blindness) and also looks poor in grayscale printing. If you must use red and green, ensure they also differ in lightness or saturation.

**Try it:** Change the `scale_color_manual` colors in `p_cb` to use red (`"#CC0000"`) and green (`"#009900"`) for the `f` and `r` groups. Can you tell them apart if you squint, simulating a colorblind reader?

```r
# Your code here — try the red/green combo and inspect the result
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_redgreen <- ggplot(mpg, aes(x = displ, y = hwy, color = drv)) +
  geom_point(size = 3, alpha = 0.8) +
  scale_color_manual(values = c("4" = "#0072B2", "f" = "#CC0000", "r" = "#009900"))

ex_redgreen
```

For ~8% of male readers (deuteranopia/protanopia), the red and green points collapse into nearly identical muddy yellow-brown dots. Squinting roughly approximates the loss because both the red and the green sit at similar perceived brightness, and that's the trap. The fix is to either pick colours that differ in *lightness* as well as hue, or to dual-encode with `shape` so the chart still parses without colour at all.
</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using rainbow or jet palettes for continuous data

❌ The `rainbow()` palette has no perceptual uniformity, regions of similar data values appear very different in color, and some regions (yellow-green) look similar despite very different values.

✅ Use `scale_fill_viridis_c()` for continuous data. Viridis is perceptually uniform and colorblind-safe by design.

### Mistake 2: Wrong palette type for data type

❌ Applying a qualitative palette (`scale_fill_brewer(palette = "Set1")`) to a continuous variable. Each color implies a distinct category, not a smooth gradient.

✅ Match palette type to data: sequential/diverging for continuous, qualitative for categorical.

### Mistake 3: Applying a diverging palette without centering at zero

❌ Using `scale_fill_distiller(palette = "RdBu")` without setting `limits = c(-max, max)` causes the midpoint (white) to appear at the data mean, not at zero, misrepresenting the zero crossing.

✅ Always set symmetric limits around zero for diverging scales: `limits = c(-1, 1)` for correlations, `limits = c(-max_abs, max_abs)` for other data.

### Mistake 4: Using color as the only channel for critical information

❌ Differentiating two groups only by red vs. green, invisible to colorblind readers and lost in grayscale.

✅ Dual-encode: map the same variable to both `color` and `shape` (for scatter plots) or both `color` and `linetype` (for line charts).

### Mistake 5: Not specifying direction in scale_fill_distiller

❌ `scale_fill_distiller(palette = "Blues")` uses the palette in the default direction, which puts the darkest color at the low end. For many heatmaps, you want dark = high.

✅ Add `direction = 1` to reverse to light-low, dark-high: `scale_fill_distiller(palette = "Blues", direction = 1)`.

## Practice Exercises

### Exercise 1: Match palette to data

The `airquality` dataset has daily temperature (`Temp`) and ozone (`Ozone`) measurements. Create three charts:

1. A scatter plot of `Wind` vs `Temp` colored by `Month` (categorical), choose an appropriate qualitative palette
2. A scatter plot of `Wind` vs `Temp` colored by `Ozone` (continuous, one direction), choose a sequential palette
3. Create a new column `Ozone_diff = Ozone - mean(Ozone, na.rm=TRUE)` and color by it, choose a diverging palette

```r
# Starter code
air <- na.omit(airquality)
air$Month_f  <- factor(air$Month)
air$Ozone_diff <- air$Ozone - mean(air$Ozone)

# Chart 1: Month (categorical)
# ggplot(air, aes(x = Wind, y = Temp, color = Month_f)) + geom_point() +
#   scale_color_brewer(palette = "Set2")

# Chart 2: Ozone (continuous)
# ggplot(air, aes(x = Wind, y = Temp, color = Ozone)) + geom_point() +
#   scale_color_distiller(palette = "YlOrRd", direction = 1)

# Chart 3: Ozone deviation (diverging)
# ggplot(air, aes(x = Wind, y = Temp, color = Ozone_diff)) + geom_point() +
#   scale_color_distiller(palette = "RdBu",
#                          limits = c(-max(abs(air$Ozone_diff)), max(abs(air$Ozone_diff))))
```

### Exercise 2: Make a chart colorblind-accessible

Take the following basic scatter plot and make it accessible:

```r
# Starting point - uses only color, red-green combination
ggplot(mpg, aes(x = cty, y = hwy, color = fl)) +
  geom_point(size = 2)
```

Improve it by: (1) switching to a colorblind-safe palette, (2) adding `shape = fl` as a second encoding, and (3) reducing to the 3 most common fuel types for clarity.

```r
# Improved version starter
# mpg_fuel <- subset(mpg, fl %in% c("r", "p", "d"))
# ggplot(mpg_fuel, aes(x = cty, y = hwy, color = fl, shape = fl)) +
#   geom_point(size = 2.5, alpha = 0.8) +
#   scale_color_manual(values = c("r" = "#0072B2", "p" = "#E69F00", "d" = "#009E73"),
#                       labels = c("r" = "Regular", "p" = "Premium", "d" = "Diesel")) +
#   scale_shape_manual(values = c("r" = 16, "p" = 17, "d" = 15),
#                       labels = c("r" = "Regular", "p" = "Premium", "d" = "Diesel"))
```

## Complete Example

This example builds a polished heatmap of monthly average temperature from the `airquality` dataset, using a perceptually uniform sequential palette:

```r
# Aggregate: mean temperature per month and temperature bin
air_complete <- na.omit(airquality)
air_complete$Month_name <- factor(
  air_complete$Month,
  labels = c("May", "Jun", "Jul", "Aug", "Sep")
)
air_complete$Temp_bin <- cut(air_complete$Temp,
  breaks = 6, dig.lab = 0)

heatmap_df <- as.data.frame(table(air_complete$Month_name,
                                   air_complete$Temp_bin))
names(heatmap_df) <- c("Month", "Temp_range", "Count")

p_final <- ggplot(heatmap_df, aes(x = Month, y = Temp_range, fill = Count)) +
  geom_tile(color = "white", linewidth = 0.5) +
  geom_text(aes(label = ifelse(Count > 0, Count, "")),
            color = "white", size = 3.5, fontface = "bold") +
  scale_fill_viridis_c(
    option    = "plasma",
    name      = "Days",
    na.value  = "grey90"
  ) +
  labs(
    title    = "Temperature Distribution by Month (1973 NYC)",
    subtitle = "viridis plasma palette — colorblind-safe, grayscale-readable",
    x        = "Month",
    y        = "Temperature Range (°F)",
    caption  = "Source: R datasets::airquality"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    panel.grid   = element_blank(),
    axis.text.y  = element_text(size = 9)
  )

p_final
```

## Summary

| Situation | Palette Type | ggplot2 Function | Recommended Palette |
|---|---|---|---|
| Continuous, one direction | Sequential | `scale_fill_distiller(type="seq")` or `scale_fill_viridis_c()` | `"Blues"`, `"YlOrRd"`, `"viridis"`, `"plasma"` |
| Continuous, above/below zero | Diverging | `scale_fill_distiller(type="div")` | `"RdBu"`, `"RdYlGn"`, `"BrBG"` |
| Categorical, unordered | Qualitative | `scale_color_brewer(type="qual")` | `"Set2"`, `"Dark2"`, `"Okabe-Ito"` |
| Any, colorblind-safe | Any | `scale_*_viridis_*()` | `"viridis"`, `"cividis"`, `"plasma"` |
| Custom colors | Any | `scale_*_manual(values = ...)` | Hex codes or R named colors |

Key rules:
- Match palette type to data type, this is the most important decision
- Use viridis as your default for continuous scales, it's safe for colorblind, grayscale, and screen
- For diverging scales, always center the midpoint at zero with symmetric limits
- Dual-encode critical information with shape or linetype, never rely on color alone

## FAQ

**What is the difference between scale_color_brewer() and scale_fill_brewer()?**

`scale_color_brewer()` applies to the `color` aesthetic (point and line outlines). `scale_fill_brewer()` applies to the `fill` aesthetic (bar and polygon interiors). For `geom_point()` with solid shapes, use `color`. For `geom_col()`, `geom_histogram()`, or `geom_tile()`, use `fill`.

**Can I see all ColorBrewer palettes in one view?**

Yes: `RColorBrewer::display.brewer.all()` shows all palettes grouped by type. Add `colorblindFriendly = TRUE` to filter to the 8 palettes that are safe for all colorblind types.

**How many colors can I get from a ColorBrewer palette?**

It depends on the palette. Most qualitative palettes support 3–8 or 3–12 colors. Check `brewer.pal.info` for each palette's maximum. If you need more colors, switch to viridis or use `scales::hue_pal()` which generates arbitrary numbers of distinct hues.

**What is the Okabe-Ito palette and how do I use it in ggplot2?**

Okabe-Ito is a colorblind-safe 8-color qualitative palette. In ggplot2 3.5+, it's available as `scale_color_okabeito()` (via the `ggokabeito` package). Manually: `c("#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#000000")`.

**Is the rainbow/jet palette ever appropriate?**

Almost never in scientific or analytical contexts. Rainbow has no perceptual uniformity, fails colorblind readers, and looks wrong in grayscale. The only case where it might be acceptable is decorative visualization where accurate data reading isn't the goal. For all analytical work, use viridis, ColorBrewer, or another principled alternative.

## References

1. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*, Chapter 11: Colour Scales. Springer. https://ggplot2-book.org/scale-colour
2. ColorBrewer, Cynthia Brewer, Mark Harrower. https://colorbrewer2.org/
3. Smith, N. & van der Walt, S. (2015). A Better Default Colormap for Matplotlib (viridis). SciPy 2015.
4. Okabe, M. & Ito, K. (2008). Color Universal Design. https://jfly.uni-koeln.de/color/
5. Wilke, C. O. (2019). *Fundamentals of Data Visualization*, Chapter 4: Color Scales. https://clauswilke.com/dataviz/color-basics.html
6. ggplot2 reference, `scale_color_brewer()`. https://ggplot2.tidyverse.org/reference/scale_brewer.html
7. ggplot2 reference, `scale_color_viridis_*()`. https://ggplot2.tidyverse.org/reference/scale_viridis.html

## Continue Learning

- **ggplot2 Scales**, control axis formatting, breaks, labels, and color scales with the full `scale_*()` system.
- **ggplot2 Distribution Charts**, choose histograms, density plots, boxplots, and violin plots with colorblind-safe palettes applied throughout.
- **ggplot2 Scatter Plots**, apply the color mapping strategies from this tutorial to real exploratory analysis.
