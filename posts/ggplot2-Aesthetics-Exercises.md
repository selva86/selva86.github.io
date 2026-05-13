---
title: "ggplot2 Aesthetics Exercises: 18 aes() Practice Problems with Solutions"
slug: "ggplot2-Aesthetics-Exercises"
description: "Practice ggplot2 aesthetics: 18 color, fill, size, shape, alpha, and scale exercises with runnable starter code and step-by-step solutions in R."
keywords: "ggplot2 aesthetics exercises, aes() practice, ggplot2 color exercises, ggplot2 fill, ggplot2 size, ggplot2 shape, ggplot2 alpha, R visualization practice"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "ggplot2 Aesthetics (18 problems)"
sidebar_order: 305
fr_parent: "ggplot2-Aesthetics-aes-Map-Data.html"
auto_link_terms: "ggplot2 aesthetics exercises|aes exercises R|ggplot2 color fill exercises|ggplot2 aesthetic practice|aesthetics practice problems|ggplot2 aes exercises"
auto_link_case_sensitive: false
target_keyword: "ggplot2 aesthetics exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Aesthetics Exercises: 18 aes() Practice Problems with Solutions

<p class="lead">Eighteen exercises on mapping data to colour, fill, size, shape, alpha, and linetype with <code>aes()</code>. Each problem ships with a starter code box, an expected result, and a hidden solution that explains the reasoning. Solutions are collapsed so you can attempt every problem before peeking.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(scales)
```

## Section 1. Mapping colour and fill (3 problems)

### Exercise 1.1: Colour points by vehicle class on the mpg dataset

**Task:** A junior analyst learning ggplot2 wants to see how fuel efficiency relates to engine size, broken out by the type of vehicle. Build a scatter of `hwy` against `displ` from the `mpg` dataset and map `colour` to `class` inside `aes()`. Save the plot to `ex_1_1`.

**Expected result:**

```
#> Scatter plot of hwy vs displ
#> Points coloured by vehicle class (7 categories: 2seater, compact, midsize, minivan, pickup, subcompact, suv)
#> Legend titled "class" appears on the right
#> Compact and subcompact cars cluster in the upper-left (small displ, high hwy)
#> Pickups and SUVs sit in the lower-right (large displ, low hwy)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class)) +
  geom_point()
ex_1_1
#> Scatter with seven coloured groups; default discrete palette
```

**Explanation:** `colour = class` lives inside `aes()` because it is a data-driven mapping: ggplot2 assigns a different colour to each level of `class`. Putting `colour = "blue"` outside `aes()` would paint every point the same blue and silently break the grouping. The default discrete palette is hue-based; you can swap it later with `scale_colour_brewer()` or `scale_colour_viridis_d()`.

</details>

### Exercise 1.2: Fill bars of a count plot by transmission type

**Task:** A reporting analyst wants a bar chart counting cars in `mpg` by drivetrain (`drv`), with each bar internally split and coloured by transmission type (`trans`). Use `geom_bar()` and map `fill` to `trans`. Save the chart to `ex_1_2`.

**Expected result:**

```
#> Stacked bar chart, x = drv (3 levels: 4, f, r)
#> Each bar split into coloured segments, one per trans level (10 transmission variants)
#> Legend on the right titled "trans"
#> The "f" (front-wheel) bar is tallest; the "r" (rear-wheel) bar is shortest
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(mpg, aes(x = drv, fill = trans)) +
  geom_bar()
ex_1_2
#> Stacked bar chart with 10 transmission segments per drivetrain
```

**Explanation:** For bars, `fill` paints the interior while `colour` would only outline the bar edges, which is rarely what you want. `geom_bar()` defaults to `stat = "count"`, so you only supply the `x` variable; ggplot2 tallies rows. To switch from stacked to side-by-side, add `position = "dodge"`. To compare proportions across drivetrains rather than absolute counts, use `position = "fill"`.

</details>

### Exercise 1.3: Combine outline colour and fill on a histogram

**Task:** A data engineer profiling the `diamonds` dataset wants a histogram of `price` where each bar has a white outline (so adjacent bars are visually separated) and the interior fill is mapped to `cut`. Build that histogram and save it to `ex_1_3`.

**Expected result:**

```
#> Stacked histogram of price (30 bins by default)
#> Each bar split by cut (Fair, Good, Very Good, Premium, Ideal)
#> White outlines visually separate bars
#> Right-skewed distribution: tall bars on the left, long tail to the right
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(diamonds, aes(x = price, fill = cut)) +
  geom_histogram(colour = "white", bins = 30)
ex_1_3
#> Stacked histogram, white bar outlines, fill by cut
```

**Explanation:** This exercise mixes a data-driven mapping (`fill = cut` inside `aes()`) with a constant aesthetic (`colour = "white"` outside `aes()` inside `geom_histogram()`). That is the canonical way to apply a fixed visual style on top of a mapping. Putting `colour = "white"` inside `aes()` would attempt to treat the literal string "white" as a one-level factor and produce a single red line plus a misleading legend entry.

</details>

## Section 2. Mapping size, shape, and alpha (3 problems)

### Exercise 2.1: Scale point size by cylinder count on a bubble chart

**Task:** A car reviewer comparing fuel efficiency wants a bubble chart of `mpg` showing `hwy` versus `displ`, with the point size encoding `cyl` (number of cylinders). Build the plot using `geom_point()` with `size` mapped inside `aes()`. Save it to `ex_2_1`.

**Expected result:**

```
#> Scatter of hwy vs displ
#> Point sizes scale with cyl (4, 5, 6, 8 cylinders)
#> 4-cyl points are smallest, 8-cyl points largest
#> Legend titled "cyl" with four size keys on the right
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(mpg, aes(x = displ, y = hwy, size = cyl)) +
  geom_point()
ex_2_1
#> Bubble chart with point size proportional to cylinder count
```

**Explanation:** `size` inside `aes()` produces a continuous size scale when the variable is numeric; ggplot2 maps the range of `cyl` to a default radius range of 1 to 6 mm. The variable `cyl` is technically discrete (only 4 values), so you may prefer `as.factor(cyl)` if you want a discrete legend with one entry per cylinder count. To set every point to the same size, write `geom_point(size = 3)` outside `aes()`.

</details>

### Exercise 2.2: Encode drivetrain with point shape on a scatter plot

**Task:** A take-home interviewer wants to know whether candidates remember that `shape` accepts only discrete variables. Build a scatter of `hwy` versus `displ` from `mpg` and map `shape` to `drv` (three levels). Save the plot to `ex_2_2`.

**Expected result:**

```
#> Scatter of hwy vs displ
#> Three point shapes (circle, triangle, square) for 4WD, FWD, RWD
#> Legend titled "drv" with the three shapes
#> No colour mapping; all points are black
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(mpg, aes(x = displ, y = hwy, shape = drv)) +
  geom_point()
ex_2_2
#> Scatter with three shapes mapped to drivetrain
```

**Explanation:** Shape is a discrete-only aesthetic; ggplot2 will warn if you try to map a continuous variable. The default palette cycles through 6 shapes, after which extra levels are dropped with a warning. For more than 6 categories you must supply your own palette via `scale_shape_manual(values = c(...))`. Shape combined with colour is a common accessibility pattern (colour-blind users distinguish shapes even when colours blur).

</details>

### Exercise 2.3: Fade overplotted points with alpha on the diamonds dataset

**Task:** A code reviewer points out that a `diamonds` scatter of `price` versus `carat` is hopelessly overplotted because there are 53,940 points. Rebuild the scatter with `alpha = 0.1` set as a constant outside `aes()` so dense regions become visible. Save it to `ex_2_3`.

**Expected result:**

```
#> Scatter of price (y) vs carat (x), 53,940 points
#> Each point is 10% opaque; dense regions look dark, sparse regions almost invisible
#> A clear price-carat curve emerges that was hidden by overplotting before
#> No legend (alpha is a constant, not a mapping)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1)
ex_2_3
#> Scatter with translucent points; density structure visible
```

**Explanation:** Alpha is the transparency channel: 0 is invisible, 1 is fully opaque. Setting `alpha` outside `aes()` is the standard fix for overplotting, because 10 overlapping 10%-opacity points sum to a fully opaque pixel and progressively darker shades mark density. If you map `alpha` inside `aes()` to a variable instead, you get a transparency gradient with a legend, which is rarely as readable as `geom_hex()` or `geom_density_2d()` for raw density.

</details>

## Section 3. Mapping vs setting: a critical distinction (3 problems)

### Exercise 3.1: Set a constant colour outside aes() on a scatter plot

**Task:** A hackathon participant has accidentally written `aes(colour = "steelblue")` and is confused that every point became salmon-pink with a legend entry that says "steelblue". Fix the code so all points are actually steel blue, then save the corrected plot to `ex_3_1`.

**Expected result:**

```
#> Scatter of hwy vs displ from mpg
#> All points are steel blue (#4682B4)
#> NO legend (constant aesthetic, not a data mapping)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(colour = "steelblue")
ex_3_1
#> All points coloured steel blue, no legend
```

**Explanation:** The single most common ggplot2 mistake. When `colour = "steelblue"` sits inside `aes()`, ggplot2 treats the literal string "steelblue" as a single-level factor, maps it through the default hue scale (which starts at salmon), and creates a one-entry legend. To set a fixed visual property, the argument goes OUTSIDE `aes()`, as a literal argument to `geom_point()`. Mnemonic: inside `aes()` is data-driven, outside `aes()` is a constant.

</details>

### Exercise 3.2: Mix one mapping and two constants on a bar chart

**Task:** A growth team analyst wants a bar chart of `mpg` counts by `class`, where bars are filled by `class` (data-driven), have a black outline (constant), and use a constant bar width of 0.7. Build the plot and save it to `ex_3_2`.

**Expected result:**

```
#> Bar chart, x = class, height = count
#> Each bar filled by its class (7 colours)
#> Black outline on every bar
#> Bars slightly narrower than default (width = 0.7)
#> Legend titled "class" with 7 entries
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(mpg, aes(x = class, fill = class)) +
  geom_bar(colour = "black", width = 0.7)
ex_3_2
#> Bar chart with class-filled, black-outlined, narrower bars
```

**Explanation:** Three aesthetics, two of them constant. `fill = class` is the only data-driven mapping and is the only one inside `aes()`. `colour = "black"` and `width = 0.7` are both fixed values handed to `geom_bar()` directly. A common pitfall: writing `aes(colour = "black")` would draw red outlines and create a useless legend entry labelled "black". Mapping and setting always coexist in production charts; you must train the eye to spot which is which.

</details>

### Exercise 3.3: Conditional aesthetic with an inline ifelse mapping

**Task:** A statistician wants to highlight cars with 6 or more cylinders in red and the rest in grey, on a `mpg` scatter of `hwy` versus `displ`. Use an inline `ifelse()` inside `aes(colour = ...)` plus `scale_colour_identity()` to bypass the default palette. Save the plot to `ex_3_3`.

**Expected result:**

```
#> Scatter of hwy vs displ
#> Points with cyl >= 6 are coloured red
#> Points with cyl < 6 are coloured grey50
#> No legend (scale_colour_identity uses the literal colour names)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ggplot(mpg, aes(x = displ, y = hwy,
                         colour = ifelse(cyl >= 6, "red", "grey50"))) +
  geom_point() +
  scale_colour_identity()
ex_3_3
#> Red highlights for 6+ cyl, grey for the rest, no legend
```

**Explanation:** This is an advanced pattern called "identity scale": you compute the colour string per-row inside `aes()`, then `scale_colour_identity()` tells ggplot2 to interpret those strings as literal R colours rather than running them through a palette. Without `scale_colour_identity()`, the levels "red" and "grey50" would be mapped through the default hue palette to salmon and teal, which is the opposite of what you want. To add a legend back, use `scale_colour_identity(guide = "legend")` with `breaks` and `labels`.

</details>

## Section 4. Multi-aesthetic compositions (3 problems)

### Exercise 4.1: Encode four variables on a single mpg scatter

**Task:** A performance reviewer challenges you to encode four variables on one scatter plot: `displ` on x, `hwy` on y, `class` as colour, and `cyl` as size. Use `mpg` and `geom_point()` with `alpha = 0.7` set outside `aes()` for readability. Save the result to `ex_4_1`.

**Expected result:**

```
#> Four-variable scatter
#> x = displ, y = hwy, colour = class (7 levels), size = cyl
#> Points 70% opaque
#> Two legends: one for class (colour swatches), one for cyl (size circles)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(mpg, aes(x = displ, y = hwy, colour = class, size = cyl)) +
  geom_point(alpha = 0.7)
ex_4_1
#> Multi-aesthetic scatter with two legends and 70% opacity
```

**Explanation:** ggplot2 automatically generates one legend per data-driven aesthetic, so mapping both `colour` and `size` yields two legends. Beware of cognitive load: charts with more than 3 mapped aesthetics quickly become unreadable. A clean alternative is to facet on one variable and keep only colour or size as a mapping. The constant `alpha = 0.7` reduces overplotting without itself creating a legend.

</details>

### Exercise 4.2: Use linetype and colour together on a time-series plot

**Task:** A reporting analyst wants a line chart from `economics` of `unemploy` over `date`, with a horizontal reference line at the mean unemployment level. The data line should be solid blue, and the reference line should be dashed red. Save the plot to `ex_4_2`.

**Expected result:**

```
#> Time-series line of unemploy vs date (1967-2015)
#> Data line: solid, steelblue
#> Horizontal reference line: dashed, red, at y = mean(unemploy)
#> No legend (all aesthetics are constants)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_line(colour = "steelblue", linetype = "solid") +
  geom_hline(yintercept = mean(economics$unemploy),
             colour = "red", linetype = "dashed")
ex_4_2
#> Time-series with dashed red mean reference line
```

**Explanation:** Both aesthetic arguments are constants here (no `aes()` wrappers), so no legend appears. `linetype` accepts named strings ("solid", "dashed", "dotted", "dotdash", "longdash", "twodash") or integers 0 to 6. `geom_hline()` inherits the parent ggplot but only consumes `yintercept`; the x mapping is ignored. To make the reference legend-visible, you would map a constant string inside `aes()` and customise the scale, which is rarely worth it for a single reference line.

</details>

### Exercise 4.3: Group, colour, and linetype on a multi-series chart

**Task:** A finance team report needs three sales lines on one chart, one per region. Build the inline data shown below, then plot `sales` over `month` grouped by `region`, with both `colour` and `linetype` mapped to `region`. Save the plot to `ex_4_3`.

```r
sales_df <- data.frame(
  month  = rep(1:6, 3),
  sales  = c(100, 120, 130, 115, 140, 150,
              80,  95, 110, 105, 125, 140,
             150, 145, 160, 170, 180, 195),
  region = rep(c("North", "South", "East"), each = 6)
)
```

**Expected result:**

```
#> Three lines, one per region
#> Different colour AND different linetype per region (redundant encoding for clarity)
#> Single combined legend (titled "region") because both aesthetics map to the same variable
#> X axis: month 1-6, Y axis: sales 80-195
```

**Difficulty:** Advanced

```r title="Your turn"
sales_df <- data.frame(
  month  = rep(1:6, 3),
  sales  = c(100, 120, 130, 115, 140, 150,
              80,  95, 110, 105, 125, 140,
             150, 145, 160, 170, 180, 195),
  region = rep(c("North", "South", "East"), each = 6)
)

ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales_df <- data.frame(
  month  = rep(1:6, 3),
  sales  = c(100, 120, 130, 115, 140, 150,
              80,  95, 110, 105, 125, 140,
             150, 145, 160, 170, 180, 195),
  region = rep(c("North", "South", "East"), each = 6)
)

ex_4_3 <- ggplot(sales_df, aes(x = month, y = sales,
                              colour = region, linetype = region,
                              group = region)) +
  geom_line(size = 1)
ex_4_3
#> Three lines with redundant colour+linetype encoding, one legend
```

**Explanation:** When two aesthetics map to the same variable, ggplot2 merges their legends into a single combined guide. This is a useful accessibility pattern: a reader who cannot distinguish red from green can still tell the lines apart by dash pattern. The `group = region` is technically redundant when `colour` already groups, but it is good practice to make grouping explicit, especially when adding `geom_smooth()` or `geom_ribbon()` layers that do not auto-group.

</details>

## Section 5. Controlling scales for aesthetics (3 problems)

### Exercise 5.1: Apply a viridis colour scale to a continuous aesthetic

**Task:** A product manager wants a `diamonds` scatter of `price` versus `carat` with `colour` mapped to `depth` (a continuous variable) and the default rainbow palette replaced with viridis for colour-blind accessibility. Save the plot to `ex_5_1`.

**Expected result:**

```
#> Scatter of price vs carat
#> Points coloured on a viridis gradient (dark purple to yellow) by depth
#> Continuous colour bar legend titled "depth" on the right
#> Lower depth values are dark purple, higher values are yellow
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(diamonds, aes(x = carat, y = price, colour = depth)) +
  geom_point(alpha = 0.5) +
  scale_colour_viridis_c()
ex_5_1
#> Scatter with viridis gradient and continuous colour bar
```

**Explanation:** `scale_colour_viridis_c()` is the continuous variant; the `_d()` suffix is for discrete data. Viridis is the standard accessible palette because it is perceptually uniform (equal data steps look like equal colour steps) and remains distinguishable for the most common forms of colour-blindness. The continuous mapping automatically produces a vertical colour bar guide rather than a discrete keyed legend.

</details>

### Exercise 5.2: Use scale_fill_manual to enforce brand colours on a bar chart

**Task:** An audit team wants a bar chart of `mpg` count by `class` with three classes explicitly recoloured: "suv" in firebrick, "compact" in steelblue, and "subcompact" in goldenrod. All other classes should keep their default colours via the `values` named vector trick. Save the plot to `ex_5_2`.

**Expected result:**

```
#> Bar chart, x = class, height = count
#> SUV bar is firebrick red
#> Compact bar is steel blue
#> Subcompact bar is goldenrod yellow
#> Other four bars use the default hue palette
#> Legend titled "class"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
default_pal <- scales::hue_pal()(7)
classes <- levels(factor(mpg$class))
brand <- c(suv = "firebrick", compact = "steelblue", subcompact = "goldenrod")
final_colours <- setNames(default_pal, classes)
final_colours[names(brand)] <- brand

ex_5_2 <- ggplot(mpg, aes(x = class, fill = class)) +
  geom_bar() +
  scale_fill_manual(values = final_colours)
ex_5_2
#> Bars with three custom colours, rest default
```

**Explanation:** `scale_fill_manual(values = ...)` takes a NAMED vector where names match factor levels. The trick here is to build that named vector by starting from `scales::hue_pal()` (ggplot2's default discrete palette) and overwriting three entries with brand colours. Without naming the vector, the order must match the factor levels exactly. This pattern is common in client reports where corporate brand colours are non-negotiable for a subset of categories.

</details>

### Exercise 5.3: Customise the size legend with scale_size_continuous

**Task:** A scout reviewing player stats wants a bubble chart with bubbles ranging from 2 to 12 mm (default is 1 to 6 mm) and only three legend breaks: 50, 100, and 200. Build a scatter from `mpg` using `displ`, `hwy`, and `cty` for the size mapping, then customise the size scale. Save it to `ex_5_3`.

**Expected result:**

```
#> Scatter of hwy vs displ
#> Bubble sizes range from 2 mm (small cty) to 12 mm (large cty)
#> Size legend shows exactly three keys at cty = 15, 25, 35
#> Larger bubble range than ggplot2 default
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(mpg, aes(x = displ, y = hwy, size = cty)) +
  geom_point(alpha = 0.6) +
  scale_size_continuous(range = c(2, 12), breaks = c(15, 25, 35))
ex_5_3
#> Bubble chart with custom size range and three legend keys
```

**Explanation:** `range = c(min_mm, max_mm)` controls the radius span in millimetres; the default 1 to 6 is often too subtle for presentations. `breaks` cherry-picks the values shown in the legend without changing the data mapping itself. For area-proportional bubbles (where data is mapped to area, not radius), use `scale_size_area()` instead, which is the better choice when bubble area is meant to represent a quantity (population, revenue).

</details>

## Section 6. Real-world aesthetics workflows (3 problems)

### Exercise 6.1: Highlight a single category by setting all others to grey

**Task:** A code reviewer asks you to draw attention to "suv" in a `mpg` scatter of `hwy` versus `displ`, with SUVs in red and every other class in grey. Use an inline `ifelse()` and `scale_colour_identity()` plus `alpha = 0.8`. Save the plot to `ex_6_1`.

**Expected result:**

```
#> Scatter of hwy vs displ
#> SUV points: red, 80% opaque
#> All other classes: grey70, 80% opaque
#> No legend
#> SUVs visually pop out from the muted background
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- ggplot(mpg, aes(x = displ, y = hwy,
                         colour = ifelse(class == "suv", "red", "grey70"))) +
  geom_point(alpha = 0.8, size = 2) +
  scale_colour_identity()
ex_6_1
#> SUVs in red, all other classes muted in grey
```

**Explanation:** The grey-out pattern is a standard storytelling device: it suppresses irrelevant detail and lets one category dominate visually. The `ifelse()` inside `aes()` computes a per-row colour string, and `scale_colour_identity()` interprets those literal strings as R colours. For multi-category highlights, swap `ifelse()` for `dplyr::case_when()` or pre-compute a `highlight` column before plotting.

</details>

### Exercise 6.2: Order factor levels to control legend and stacking order

**Task:** A compliance officer wants the `diamonds` cut legend (Fair, Good, Very Good, Premium, Ideal) reversed so "Ideal" appears at the top of a stacked bar chart and the legend. Use `forcats::fct_rev()` or `factor()` with explicit `levels` to reorder, then build a stacked bar of count by `color` filled by `cut`. Save it to `ex_6_2`.

**Expected result:**

```
#> Stacked bar chart, x = color (D-J), fill = cut (reordered)
#> "Ideal" segment is at the BOTTOM of each bar (drawn last, on top)
#> Legend lists cut levels in order: Ideal, Premium, Very Good, Good, Fair
#> Color D has the most diamonds, J has the fewest
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diamonds_reord <- diamonds |>
  mutate(cut = factor(cut, levels = c("Ideal", "Premium", "Very Good", "Good", "Fair")))

ex_6_2 <- ggplot(diamonds_reord, aes(x = color, fill = cut)) +
  geom_bar()
ex_6_2
#> Stacked bar with cut reordered, Ideal segment at bottom
```

**Explanation:** Factor level order controls three things at once: legend order (top to bottom), stack order (bottom to top of the bar), and dodge order (left to right). Reordering with `factor(x, levels = ...)` or `forcats::fct_relevel()` is therefore the lever for visual hierarchy. A common gotcha: ggplot2 stacks the FIRST factor level at the BOTTOM of the bar; reversing the legend pushes "Ideal" to the bottom of each bar, which is usually the position the eye scans to first.

</details>

### Exercise 6.3: Build a publication-ready chart with mapped and constant aesthetics combined

**Task:** A take-home interviewer asks for a polished `diamonds` scatter of `price` versus `carat`, with `colour` mapped to `cut` using viridis, `alpha = 0.3` constant for overplotting, `size = 0.7` constant for density, and a black-and-white theme override. Save it to `ex_6_3`.

**Expected result:**

```
#> Scatter of price vs carat, 53,940 points
#> Colour mapped to cut (5 levels) using viridis discrete palette
#> All points at 30% alpha, fixed small size
#> theme_bw() background (white panel, grey gridlines)
#> Legend titled "cut" with 5 viridis swatches
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- ggplot(diamonds, aes(x = carat, y = price, colour = cut)) +
  geom_point(alpha = 0.3, size = 0.7) +
  scale_colour_viridis_d() +
  theme_bw()
ex_6_3
#> Polished scatter, viridis discrete colours, theme_bw, small translucent points
```

**Explanation:** This problem ties every concept in the hub together: one data-driven mapping (`colour = cut`), two constants outside `aes()` (`alpha`, `size`), a custom scale (`scale_colour_viridis_d()` for an accessible discrete palette), and a theme override. The order of layers matters for legibility, but the order of scale and theme additions does not. To override the legend dot opacity (so legend swatches look solid even though points are 30% alpha), append `guides(colour = guide_legend(override.aes = list(alpha = 1, size = 3)))`.

</details>

## What to do next

- [ggplot2 aesthetics tutorial: aes() and mapping data](ggplot2-Aesthetics-aes-Map-Data.html) for the conceptual reference behind every problem above.
- [ggplot2 exercises: 50 real-world practice problems](ggplot2-Exercises-in-R.html) for a broader workout covering geoms, facets, scales, and themes.
- [Data wrangling exercises in R](Data-Wrangling-Exercises-in-R.html) to practise the dplyr verbs you used in Section 5 and 6 before plotting.
