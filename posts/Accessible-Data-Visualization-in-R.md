---
title: "Accessible Data Visualization in R: Color Vision and Contrast"
slug: "Accessible-Data-Visualization-in-R"
description: "Make accessible data visualization in R: learn color vision deficiency, colorblind-safe palettes, WCAG contrast ratios, and redundant encoding in ggplot2."
keywords: "accessible data visualization, colorblind ggplot2, color vision deficiency, colorblind-safe palette, WCAG contrast ratio, relative luminance R, Okabe-Ito palette, viridis R, redundant encoding"
auto_link_terms: "accessible data visualization|colorblind-safe palette|colorblind-friendly palette|color vision deficiency|WCAG contrast ratio|relative luminance|Okabe-Ito palette|color contrast|colorblind accessibility|redundant encoding"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-25"
curriculum_id: "GG2-13.3"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Accessible Charts"
sidebar_order: 83
difficulty: "Intermediate"
---

<p class="lead">Accessible data visualization means every reader can decode your chart, including the roughly 1 in 12 men and 1 in 200 women who see color differently. Two levers do most of the work: choosing colors that survive color blindness and grayscale, and keeping enough brightness contrast between your marks and the background. This tutorial builds both from scratch in R and ggplot2, and you can run every example as you read.</p>

## Why do readers see the same chart differently?

A chart that looks perfectly clear to you can be unreadable to the person sitting next to you. The reason is that human color vision varies, and a surprisingly large slice of your audience does not see the red-versus-green distinction you might be relying on. If your chart's meaning lives entirely in color, part of your audience loses that meaning.

We will work in the tidyverse dialect throughout: `ggplot2` for the charts and a little `dplyr` for data. Let's start with an ordinary scatter plot and let ggplot2 pick the colors, the way most people write their first plot.

```r title="Load libraries and plot fuel economy by drive type"
library(ggplot2)
library(dplyr)

# The mpg data splits 234 cars into three drive types; colour will encode them
table(mpg$drv)
#>
#>   4   f   r
#> 103 106  25

# An everyday scatter: fuel economy by drive type, default ggplot2 colours
ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) +
  geom_point(size = 2) +
  labs(x = "Engine size (litres)", y = "Highway MPG", colour = "Drive")
```

Those are the three groups we color by: 103 four-wheel, 106 front, and 25 rear-drive cars. Run the plot and you get three colored point clouds, one per drive type. It looks fine. But which three colors did ggplot2 actually choose? We can ask directly. `scales::hue_pal()` is the function that builds ggplot2's default colors, and calling its result with `(3)` returns three of them, spaced evenly around a color wheel.

```r title="Reveal the default colour values"
# What three colours did ggplot2 assign to the three groups?
scales::hue_pal()(3)
#> [1] "#F8766D" "#00BA38" "#619CFF"
```

The three hex codes are a salmon red (`#F8766D`), a green (`#00BA38`), and a blue (`#619CFF`). That first pair, a red and a green at similar brightness, is exactly the combination that the most common form of color blindness cannot tell apart. The default palette produces exactly that risky pairing.

To understand why, you need a quick model of how color vision works. Your eye has three kinds of color-sensing cells called cones, tuned to long (reddish), medium (greenish), and short (bluish) wavelengths. Color vision deficiency, often shortened to CVD, happens when one cone type is missing or shifted. That produces four broad types, shown below in order of how common they are.

![The four types of color vision deficiency, arranged by how common they are.](screenshots/Accessible-Data-Visualization-in-R-cvd-types.webp)

*Figure 1: The four types of color vision deficiency, by how common they are.*

The two red-green types, deuteranopia (green-weak) and protanopia (red-weak), are by far the most frequent and together affect about 8% of men of Northern European descent. Tritanopia (blue-yellow) is rare, and complete monochromacy (no color at all) is rarer still. The practical takeaway is blunt: red versus green is the single riskiest color contrast you can build a chart around.

[WARNING]
**Never let red versus green carry meaning on its own.** This is the pairing that deuteranopia and protanopia, the two most common deficiencies, collapse into the same muddy tone, so any chart that separates groups only by red and green is unreadable for roughly 1 in 12 male viewers.

**Try it:** Print the five colors ggplot2 would use for a five-group chart, then pick out the pair most likely to be confused as red and green.

```r title="Your turn: inspect a five-colour default"
# Print the 5 default ggplot2 colours with scales::hue_pal()
# your code here

#> Expected: a character vector of 5 hex codes
```

<details>
<summary>Click to reveal solution</summary>

```r title="Five-colour default solution"
scales::hue_pal()(5)
#> [1] "#F8766D" "#A3A500" "#00BF7D" "#00B0F6" "#E76BF3"
```

**Explanation:** The red `#F8766D` and the green `#00BF7D` sit at similar lightness, so a red-green colorblind reader sees them as nearly the same color. The more groups you add with the default scale, the more likely two of them land in a confusable pair.

</details>

## What makes a color palette colorblind-safe?

A colorblind-safe palette is one whose colors stay distinct even after a cone type drops out. Two design ideas make that happen. The first is spreading colors apart in more than just hue, so they also differ in brightness. The second is perceptual uniformity, meaning equal steps in your data map to equal-looking steps in color across the whole range. Two families give you this for free in ggplot2.

The first is **viridis**, a set of continuous scales that ship with ggplot2. Viridis was engineered to stay readable under all common CVD types and even in grayscale. Use it for continuous quantities with `scale_colour_viridis_c()` (or `scale_fill_viridis_c()`).

The second is **Okabe-Ito**, a qualitative palette of eight colors designed by Masataka Okabe and Kei Ito specifically so that no two are confusable under color blindness. It is the go-to choice for categorical groups. ggplot2 does not carry it as a named scale, so we define it as a plain vector of hex codes.

```r title="Define the Okabe-Ito palette"
# The eight Okabe-Ito colours, safe across all CVD types
okabe_ito <- c("#E69F00", "#56B4E9", "#009E73", "#F0E442",
               "#0072B2", "#D55E00", "#CC79A7", "#000000")
okabe_ito
#> [1] "#E69F00" "#56B4E9" "#009E73" "#F0E442" "#0072B2" "#D55E00" "#CC79A7"
#> [8] "#000000"
```

That printed vector is just the eight hex codes: orange, sky blue, bluish green, yellow, blue, vermillion, reddish purple, and black. To use them, hand a named subset to `scale_colour_manual()`, matching each data value to a color. Here is the same scatter from before, now on a safe palette.

```r title="Recolour the scatter with Okabe-Ito"
ggplot(mpg, aes(x = displ, y = hwy, colour = drv)) +
  geom_point(size = 2) +
  scale_colour_manual(
    values = c("4" = "#0072B2", "f" = "#E69F00", "r" = "#009E73"),
    labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  labs(x = "Engine size (litres)", y = "Highway MPG", colour = "Drive")
```

The three groups now use blue, orange, and green from Okabe-Ito. These were chosen so they differ in both hue and brightness, which is what keeps them apart when a cone type is missing. For a continuous variable, reach for viridis instead. Below we color the same points by city mileage, a continuous number.

```r title="Colour a continuous variable with viridis"
ggplot(mpg, aes(x = displ, y = hwy, colour = cty)) +
  geom_point(size = 2) +
  scale_colour_viridis_c() +
  labs(x = "Engine size (litres)", y = "Highway MPG", colour = "City MPG")
```

The points run from dark purple (low city MPG) through green to bright yellow (high). Because viridis brightness increases steadily with the value, a reader can rank the points even if they cannot see the hues at all. That is the property a rainbow scale lacks.

[KEY INSIGHT]
**Viridis is the safe default for continuous color.** Its brightness rises steadily with the data, so it stays readable under every type of color blindness and even in black and white, which is why it beats rainbow-style scales for any quantity you want people to actually rank.

**Try it:** Color the scatter by `class` (a 7-level category) using the discrete viridis scale instead of a manual palette.

```r title="Your turn: viridis discrete by class"
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2) +
  # add the discrete viridis scale here
  labs(colour = "Class")

#> Expected: the same scatter with a purple-to-yellow viridis colour set
```

<details>
<summary>Click to reveal solution</summary>

```r title="Viridis discrete solution"
ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point(size = 2) +
  scale_colour_viridis_d() +
  labs(colour = "Class")
```

**Explanation:** `scale_colour_viridis_d()` picks seven evenly spaced viridis colors, one per class. The `_d` suffix means discrete (one color per category); `_c` means continuous. Even with seven groups the brightness ordering keeps them legible.

</details>

## How can you simulate color blindness to test a chart?

Choosing a safe palette is step one. Step two is checking your specific chart, because a palette that is safe in theory can still fail once you subset it, tweak it, or add a risky custom color. The most reliable check is to transform your colors through a model of each deficiency and look at the result. The `colorspace` package does this with `deutan()`, `protan()`, and `tritan()`, one function per CVD type.

That package is not one of the ones that runs in your browser here, so run the next block in your own R session (for example in RStudio) after `install.packages("colorspace")`. It takes your palette and returns how those colors appear to someone with each deficiency.

```r-static title="Simulate the palette under color blindness"
library(colorspace)

# How the Okabe-Ito colours appear under two CVD types
deutan(okabe_ito)   # deuteranopia (green-weak): the most common type
#> [1] "#CAB411" "#87A4E8" "#8A8676" "#FCE34E" "#3B67B1" "#9E8C00" "#9498A5"
#> [8] "#000000"
tritan(okabe_ito)   # tritanopia (blue-yellow): rare
#> [1] "#FB8C87" "#00C2C6" "#009E92" "#FFD4C5" "#008289" "#EB4050" "#D6788A"
#> [8] "#000000"
```

Each call returns a new set of eight hex codes, the simulated appearance of the palette. The important test is whether the eight simulated colors are still distinct from one another. For Okabe-Ito they are, which is the whole point of the palette.

Reading hex codes is hard, so let's see them as swatches. The helper below draws any vector of colors as labeled tiles, and it even picks black or white text depending on how dark each tile is (a tiny preview of the contrast idea in the next section). We feed it the deuteranopia-simulated colors we just computed, pasted in as a vector so this block runs anywhere.

```r title="View the simulated palette as swatches"
# Draw a colour vector as labelled swatches, with legible text on each tile
show_swatches <- function(cols, labels = cols) {
  brightness <- colMeans(col2rgb(cols)) / 255
  df <- data.frame(x = seq_along(cols), fill = cols, lab = labels,
                   txt = ifelse(brightness < 0.5, "white", "black"))
  ggplot(df, aes(x = x, y = 1, fill = fill)) +
    geom_tile(width = 0.9, height = 0.9) +
    geom_text(aes(label = lab, colour = txt), size = 3) +
    scale_fill_identity() +
    scale_colour_identity() +
    theme_void()
}

# Deuteranopia-simulated Okabe-Ito, from the local colorspace run above
okabe_deutan <- c("#CAB411", "#87A4E8", "#8A8676", "#FCE34E",
                  "#3B67B1", "#9E8C00", "#9498A5", "#000000")

show_swatches(okabe_deutan)
```

You get eight tiles, and crucially they are still eight visibly different tiles. The orange has shifted toward gold and the greens have muted, but a reader with deuteranopia can still tell every group apart. That is what "safe" looks like when you test it rather than assume it.

[NOTE]
**Simulation is a test, not a fix.** Running `deutan()` on your palette tells you whether groups survive color blindness; it does not change your chart. If two simulated swatches look alike, that is your signal to pick different colors or add a second encoding, which we cover below.

**Try it:** You already defined `show_swatches()`. Render the tritanopia-simulated Okabe-Ito palette (its hex codes are printed above) to see how blue-yellow color blindness reshapes it.

```r title="Your turn: swatch the tritan palette"
okabe_tritan <- c("#FB8C87", "#00C2C6", "#009E92", "#FFD4C5",
                  "#008289", "#EB4050", "#D6788A", "#000000")
# render these with show_swatches()
# your code here

#> Expected: eight swatches in the tritan-simulated colours
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tritan swatch solution"
show_swatches(okabe_tritan)
```

**Explanation:** Under tritanopia the yellow drifts toward pink and the blues shift toward teal, yet the eight swatches stay distinct. A palette that survives all three simulations, as Okabe-Ito does, is what we mean by colorblind-safe.

</details>

## What is color contrast and why does it matter?

Color choice handles who can tell your groups apart. Contrast handles whether anyone can read your text and see your marks at all. Contrast is the brightness gap between two colors, most often between text and its background, or between a data mark and the panel behind it. Low contrast makes labels vanish for readers with low vision, on dim screens, and in bright sunlight.

The web accessibility standard, WCAG, turns this into a number you can compute. First it converts a color to a single brightness value called relative luminance, then it compares two luminances as a ratio. Both are short formulas, and both are just arithmetic you can run in base R.

The luminance step starts by undoing the gamma curve baked into screen colors, then takes a weighted average that reflects how sensitive the eye is to each channel (green counts most, blue least). If the math is not your thing, skip to the code below; the function does exactly what the formulas say.

For each channel value $c$ (red, green, or blue, scaled to the 0-to-1 range), linearize it:

$$ c_{lin} = \begin{cases} \dfrac{c}{12.92} & c \le 0.03928 \\[2mm] \left(\dfrac{c + 0.055}{1.055}\right)^{2.4} & c > 0.03928 \end{cases} $$

Then combine the three linearized channels into one luminance $L$:

$$ L = 0.2126\,R_{lin} + 0.7152\,G_{lin} + 0.0722\,B_{lin} $$

Here is that formula as an R function. It takes any hex color (or several) and returns luminance on a 0 (black) to 1 (white) scale.

```r title="Define the relative luminance function"
# WCAG relative luminance of a hex colour, from 0 (black) to 1 (white)
relative_luminance <- function(hex) {
  channels <- col2rgb(hex) / 255
  lin <- ifelse(channels <= 0.03928,
                channels / 12.92,
                ((channels + 0.055) / 1.055) ^ 2.4)
  as.numeric(0.2126 * lin[1, ] + 0.7152 * lin[2, ] + 0.0722 * lin[3, ])
}

round(relative_luminance(c("#FFFFFF", "#000000", "#0072B2", "#F0E442")), 4)
#> [1] 1.0000 0.0000 0.1525 0.7441
```

The output confirms the scale: white is 1, black is 0, the Okabe-Ito blue is a dark 0.15, and the Okabe-Ito yellow is a bright 0.74. Now the contrast ratio. WCAG defines it as the lighter luminance plus a small constant, divided by the darker luminance plus the same constant:

$$ \text{contrast} = \frac{L_{light} + 0.05}{L_{dark} + 0.05} $$

The ratio runs from 1:1 (two identical colors) up to 21:1 (black on white). WCAG asks for at least 4.5:1 for normal body text and 3:1 for large text or graphical objects like lines and points. Here is the function and three quick tests.

```r title="Define the contrast ratio function"
# WCAG contrast ratio between a foreground and background colour
contrast_ratio <- function(foreground, background) {
  l1 <- relative_luminance(foreground)
  l2 <- relative_luminance(background)
  (pmax(l1, l2) + 0.05) / (pmin(l1, l2) + 0.05)
}

round(contrast_ratio("#767676", "#FFFFFF"), 2)   # mid grey text on white
#> [1] 4.54
round(contrast_ratio("#E69F00", "#FFFFFF"), 2)   # Okabe orange on white
#> [1] 2.25
round(contrast_ratio("#0072B2", "#FFFFFF"), 2)   # Okabe blue on white
#> [1] 5.19
```

Read those three numbers against the 4.5:1 bar for text. The mid grey scores 4.54, so it just passes; in fact `#767676` is the lightest grey that clears 4.5:1 on white. The orange scores only 2.25 and fails badly, so orange text on white is too faint to read. The blue scores 5.19 and passes comfortably. Same palette, very different results depending on the background.

[WARNING]
**A colorblind-safe color is not automatically a readable one.** Okabe orange survives color blindness but scores just 2.25 against white, far below the 4.5:1 text threshold. Palette safety and contrast are two separate checks, and you have to pass both.

[TIP]
**Put text where it has contrast, not where it looks tidy.** A light fill like orange or yellow needs dark text on top, and a dark fill needs light text; when in doubt, move labels onto the white panel, where black text scores a full 21:1.

**Try it:** Check whether the Okabe-Ito sky blue (`#56B4E9`) passes the 4.5:1 threshold for normal text on a white background.

```r title="Your turn: contrast of sky blue on white"
# use contrast_ratio() to test #56B4E9 against #FFFFFF
# your code here

#> Expected: a single number; is it above 4.5?
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sky-blue contrast solution"
round(contrast_ratio("#56B4E9", "#FFFFFF"), 2)
#> [1] 2.31
```

**Explanation:** 2.31 is well below 4.5:1, so sky blue makes poor body text on white. It is fine for large marks like points and bars (which only need 3:1, and even that is borderline here), but not for small labels.

</details>

## How do you make any ggplot chart accessible?

You now have the pieces: a safe palette, a way to test it, and a way to measure contrast. Putting them together into a routine turns "accessible" from a vague goal into four concrete steps you can apply to any chart.

![Four steps that make almost any chart accessible: pick a safe palette, add a second encoding, check contrast, and test in grayscale.](screenshots/Accessible-Data-Visualization-in-R-accessible-workflow.webp)

*Figure 2: Four steps that make almost any chart accessible.*

The step that does the most work is the second one: **redundant encoding**, meaning you map the same variable to a second aesthetic so color is never the only clue. For points, add `shape`. For lines, add `linetype`. Here is the scatter from the very start of the tutorial, now encoded twice: color and shape both track drive type.

```r title="Dual-encode with colour and shape"
ggplot(mpg, aes(x = displ, y = hwy, colour = drv, shape = drv)) +
  geom_point(size = 2.5, alpha = 0.9) +
  scale_colour_manual(
    values = c("4" = "#0072B2", "f" = "#E69F00", "r" = "#009E73"),
    labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  scale_shape_manual(
    values = c("4" = 16, "f" = 17, "r" = 15),
    labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  labs(x = "Engine size (litres)", y = "Highway MPG",
       colour = "Drive", shape = "Drive")
```

Because we gave `colour` and `shape` the same labels, ggplot2 merges them into one legend. Now a reader can separate the groups by circle, triangle, and square even if the colors are useless to them. The same trick works for line charts, where `linetype` (solid, dashed, dotted) plays the role of shape. Let's build a small trend dataset to show it.

```r title="Create a small trend dataset"
econ <- data.frame(
  year  = rep(2015:2020, times = 3),
  group = rep(c("A", "B", "C"), each = 6),
  value = c(1:6, 6:1, rep(3, 6)) + rep(c(0, 0.3, 0.6), each = 6)
)

ggplot(econ, aes(x = year, y = value, colour = group)) +
  geom_line(linewidth = 1) +
  scale_colour_manual(values = c("A" = "#0072B2", "B" = "#D55E00", "C" = "#009E73")) +
  labs(x = "Year", y = "Value", colour = "Group")
```

Three colored lines, but color alone is doing the work. The inline exercise below fixes that. First, the fourth step in the workflow: the grayscale test. Printing and photocopying strip color entirely, so a truly robust chart still reads in pure brightness. We can preview that by converting our palette to its luminance-equivalent grays.

```r title="Test the palette in grayscale"
okabe_lum <- relative_luminance(okabe_ito)
round(okabe_lum, 3)
#> [1] 0.416 0.405 0.257 0.744 0.152 0.222 0.293 0.000

show_swatches(grey(okabe_lum))
```

Look at the first two numbers: orange is 0.416 and sky blue is 0.405, almost identical brightness. In the gray swatches they collapse into the same shade. Okabe-Ito is colorblind-safe, but it is not fully grayscale-safe, because several of its colors share a luminance. This is the reason redundant encoding matters even with a good palette: shape and linetype survive the grayscale test that color cannot.

[KEY INSIGHT]
**Redundant encoding is what makes a chart robust, not the palette alone.** A safe palette can still collapse in grayscale or under an unusual deficiency, but a group marked by both color and shape (or color and linetype) stays readable no matter what happens to the color channel.

**Try it:** Take the line chart and add `linetype = group` so the three lines stay separable in black and white.

```r title="Your turn: add linetype to the lines"
ggplot(econ, aes(x = year, y = value, colour = group)) +
  geom_line(linewidth = 1) +
  # map linetype to group as well
  scale_colour_manual(values = c("A" = "#0072B2", "B" = "#D55E00", "C" = "#009E73"))

#> Expected: three lines that differ in both colour and dash pattern
```

<details>
<summary>Click to reveal solution</summary>

```r title="Colour plus linetype solution"
ggplot(econ, aes(x = year, y = value, colour = group, linetype = group)) +
  geom_line(linewidth = 1) +
  scale_colour_manual(values = c("A" = "#0072B2", "B" = "#D55E00", "C" = "#009E73"))
```

**Explanation:** Mapping the same variable to `linetype` adds a second channel. Even printed in grayscale, solid versus dashed versus dotted tells the three lines apart when their colors would merge.

</details>

## Complete Example

Let's tie the palette, contrast, and grayscale ideas together in one polished chart: average city fuel economy for each vehicle class, split by drive type. We pick three Okabe-Ito fills that sit far apart in brightness, and we audit that spacing with `relative_luminance()` before drawing, so we are not just trusting the palette's reputation.

```r title="Build and audit an accessible bar chart"
# Mean city MPG for each class and drive type
mpg_summary <- mpg |>
  group_by(class, drv) |>
  summarise(mean_cty = mean(cty), .groups = "drop")

# Three Okabe-Ito fills, chosen to sit far apart in brightness
pal <- c("4" = "#0072B2", "f" = "#E69F00", "r" = "#009E73")

# Accessibility audit: how far apart are the fills in luminance?
round(relative_luminance(pal), 3)
#> [1] 0.152 0.416 0.257

ggplot(mpg_summary, aes(x = reorder(class, mean_cty), y = mean_cty, fill = drv)) +
  geom_col(position = position_dodge(0.9)) +
  scale_fill_manual(values = pal, labels = c("4" = "4WD", "f" = "Front", "r" = "Rear")) +
  coord_flip() +
  labs(x = NULL, y = "Mean city MPG", fill = "Drive") +
  theme_minimal(base_size = 13)
```

The audit prints three luminances, 0.152, 0.416, and 0.257, which are comfortably spread out. Because the fills differ in brightness as well as hue, the bars stay distinguishable under color blindness and in grayscale, and because they come from Okabe-Ito, no two collapse under a deficiency. That is a chart that works for every reader, built from the same three checks you learned above.

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution. They use fresh variable names so they will not clobber the objects from earlier examples.

### Exercise 1: Rescue a red-green line chart

The chart below encodes two teams with red and green only, the worst case for a colorblind reader. Rewrite it to be accessible: swap in Okabe-Ito colors that differ in brightness, add `linetype` as a second channel, and then use `contrast_ratio()` to confirm the two line colors differ in luminance.

```r title="Exercise 1 starter: fix a red-green line chart"
set.seed(1)
risky <- data.frame(
  month = rep(1:12, times = 2),
  sales = c(cumsum(rnorm(12, 5)), cumsum(rnorm(12, 5))),
  team  = rep(c("North", "South"), each = 12)
)

# Relies on red vs green only:
ggplot(risky, aes(month, sales, colour = team)) +
  geom_line(linewidth = 1) +
  scale_colour_manual(values = c("North" = "#CC0000", "South" = "#009900"))

# Rewrite below: Okabe-Ito colours + linetype, then a contrast check.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ggplot(risky, aes(month, sales, colour = team, linetype = team)) +
  geom_line(linewidth = 1) +
  scale_colour_manual(values = c("North" = "#0072B2", "South" = "#E69F00"))

# Do the two line colours also differ in brightness?
round(contrast_ratio("#0072B2", "#E69F00"), 2)
#> [1] 2.31
```

**Explanation:** Blue and orange are far apart in hue for color vision, and `linetype` keeps them apart in grayscale. The contrast ratio of 2.31 confirms they also differ in brightness (blue is darker), so the two lines never look identical, whatever the reader's vision.

</details>

### Exercise 2: Write a palette auditor

Not every color pair in a "safe" palette is safe in grayscale, as we saw with orange and sky blue. Write a function `flag_pairs()` that takes a palette and returns every pair of colors whose contrast ratio is below a threshold (default 1.15, meaning nearly identical brightness). Reuse `relative_luminance()` and `contrast_ratio()`, and `utils::combn()` to generate the pairs.

```r title="Exercise 2 starter: flag low-contrast palette pairs"
flag_pairs <- function(palette, min_contrast = 1.15) {
  # 1. make every 2-colour combination with combn()
  # 2. compute the contrast ratio of each pair
  # 3. return only the pairs below min_contrast
}

flag_pairs(okabe_ito)
#> Expected: a data frame of near-identical-brightness pairs
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
flag_pairs <- function(palette, min_contrast = 1.15) {
  combos <- utils::combn(palette, 2)
  ratio  <- round(contrast_ratio(combos[1, ], combos[2, ]), 2)
  out    <- data.frame(colour_1 = combos[1, ], colour_2 = combos[2, ],
                       contrast = ratio)
  out    <- out[out$contrast < min_contrast, ]
  rownames(out) <- NULL
  out
}

flag_pairs(okabe_ito)
#>   colour_1 colour_2 contrast
#> 1  #E69F00  #56B4E9     1.02
#> 2  #009E73  #D55E00     1.13
#> 3  #009E73  #CC79A7     1.12
```

**Explanation:** `combn()` builds all 28 pairs; we keep the three whose brightness is within about 15%. These are the pairs (orange and sky blue, green and vermillion, green and pink) that merge in grayscale, which is exactly why you add shape or linetype when any of them share a chart.

</details>

### Exercise 3: An accessible heatmap with legible labels

Build a tile heatmap of how many cars fall in each class-and-drive combination, filled with continuous viridis. Then add the count as a text label on each tile, choosing black text on the bright (high-count) tiles and white text on the dark ones, so every label stays readable.

```r title="Exercise 3 starter: accessible heatmap with labels"
counts <- as.data.frame(table(mpg$class, mpg$drv))
names(counts) <- c("class", "drv", "n")

# your code here: geom_tile + scale_fill_viridis_c + geom_text whose
# colour depends on whether the tile is in the bright half of the scale
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
counts <- as.data.frame(table(mpg$class, mpg$drv))
names(counts) <- c("class", "drv", "n")

ggplot(counts, aes(x = drv, y = class, fill = n)) +
  geom_tile() +
  geom_text(aes(label = n, colour = n > max(n) / 2), size = 4, show.legend = FALSE) +
  scale_fill_viridis_c() +
  scale_colour_manual(values = c("TRUE" = "black", "FALSE" = "white")) +
  labs(x = "Drive", y = "Class", fill = "Count")
```

**Explanation:** Viridis makes the counts readable as a continuous scale for every reader. The `n > max(n) / 2` test flips the label color: bright yellow tiles get black text, dark purple tiles get white text, so no label ever sits on a same-brightness background. That is the contrast rule applied automatically.

</details>

## Summary

Accessible visualization comes down to two questions asked of every chart: can everyone tell the groups apart, and can everyone read the marks and text? The table below maps each situation to the tool that answers it.

| Situation | Tool in R | What it does |
|---|---|---|
| Continuous quantity, any reader | `scale_colour_viridis_c()` / `scale_fill_viridis_c()` | Brightness rises with value; safe for CVD and grayscale |
| Categorical groups, any reader | Okabe-Ito via `scale_colour_manual()` | Eight colors no CVD type confuses |
| Test a chart for color blindness | `colorspace::deutan()` / `protan()` / `tritan()` | Simulates how colors appear under each deficiency |
| Check text or mark legibility | `contrast_ratio()` vs WCAG 4.5:1 / 3:1 | Measures brightness gap to the background |
| Survive grayscale and printing | `shape`, `linetype`, direct labels | Redundant channels that need no color |

![The pieces of accessible visualization covered in this tutorial: color vision, safe palettes, contrast, and redundant encoding.](screenshots/Accessible-Data-Visualization-in-R-overview.webp)

*Figure 3: The pieces of accessible visualization covered in this tutorial.*

The habits that make it automatic:

- Start from a safe palette: viridis for continuous data, Okabe-Ito for categories.
- Never let color be the only channel. Add shape to points and linetype to lines.
- Measure contrast instead of guessing. Aim for 4.5:1 on text, 3:1 on marks.
- Test, do not assume. Simulate CVD and preview in grayscale before you ship.

## FAQ

**Should I use viridis or Okabe-Ito?**

Match the palette to the data. Viridis is a continuous scale, so use it for numbers you want readers to rank (counts, prices, temperatures). Okabe-Ito is a discrete, qualitative palette, so use it for unordered categories (species, region, team). Reaching for the wrong one, like a qualitative palette on a continuous variable, makes smooth data look stepwise.

**Are ggplot2's default colors colorblind-safe?**

No. The default `scale_colour_hue()` spaces colors evenly around a color wheel at similar brightness, which regularly produces confusable red-green pairs, as `scales::hue_pal()(3)` showed. For anything you share, replace the default with viridis or Okabe-Ito.

**What contrast ratio do I actually need?**

WCAG asks for at least 4.5:1 between normal text and its background, and 3:1 for large text (roughly 18pt or 14pt bold) and for graphical objects like lines, points, and icons. Chart titles and axis labels are text, so hold them to 4.5:1.

**How many distinct colors can a palette carry?**

Fewer than you think. Okabe-Ito tops out at eight, and beyond about seven categories any color scheme gets hard to distinguish, especially under color blindness. If you need more groups, rethink the chart: facet into small multiples, use direct labels, or aggregate the long tail into an "other" category.

**Does an accessible chart still need alt text?**

Yes. Color and contrast serve readers who see the chart; a text description serves screen-reader users who do not. When you save a plot for the web with `ggsave()`, add a concise `alt` attribute in the HTML `<img>` tag that states the chart type, the variables, and the main takeaway.

## References

1. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*, Chapter 11: Colour scales and legends. Springer. [Link](https://ggplot2-book.org/scales-colour.html)
2. Okabe, M. & Ito, K. (2008). *Color Universal Design (CUD): How to make figures and presentations that are friendly to colorblind people*. [Link](https://jfly.uni-koeln.de/color/)
3. Smith, N. J. & van der Walt, S. (2015). *A Better Default Colormap for Matplotlib* (the viridis design talk). SciPy 2015. [Link](https://bids.github.io/colormap/)
4. W3C (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*, Success Criterion 1.4.3 Contrast (Minimum) and the contrast-ratio definition. [Link](https://www.w3.org/TR/WCAG21/#contrast-minimum)
5. Zeileis, A., Fisher, J. C., Hornik, K., et al. (2020). *colorspace: A Toolbox for Manipulating and Assessing Colors and Palettes*. Journal of Statistical Software, 96(1). [Link](https://doi.org/10.18637/jss.v096.i01)
6. Wilke, C. O. (2019). *Fundamentals of Data Visualization*, Chapter 19: Common pitfalls of color use. [Link](https://clauswilke.com/dataviz/color-pitfalls.html)
7. ggplot2 reference. *The viridis scales*, `scale_colour_viridis_c()`. [Link](https://ggplot2.tidyverse.org/reference/scale_viridis.html)

## Continue Learning

- **ggplot2 Colours**, the foundations of mapping color aesthetics in ggplot2, the parent topic this tutorial builds on.
- **R Color Theory: Palettes and ColorBrewer**, a deeper tour of sequential, diverging, and qualitative palette families and when each applies.
- **ggplot2 Themes**, control panel background, gridlines, and text so your contrast choices survive into the final styled figure.
