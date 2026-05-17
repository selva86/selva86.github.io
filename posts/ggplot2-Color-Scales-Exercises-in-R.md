---
title: "ggplot2 Color Scales Exercises in R: 20 Real-World Practice Problems"
slug: "ggplot2-Color-Scales-Exercises-in-R"
description: "Master ggplot2 color scales with 20 hands-on practice problems covering manual, brewer, viridis, gradient, diverging, and colorblind-safe palettes."
keywords: "ggplot color palette exercises, ggplot2 color scales exercises, scale_color_manual practice, viridis R exercises, diverging palette ggplot"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ggplot2 Color Scales Exercises"
sidebar_order: 145
fr_parent: "Complete-Ggplot2-Tutorial-Part2-Customizing-the-Look-and-Feel.html"
auto_link_terms: "ggplot color palette exercises|ggplot2 color scales exercises|scale_color_manual practice|viridis r exercises|diverging palette ggplot"
auto_link_case_sensitive: false
target_keyword: "ggplot color palette exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Color Scales Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty hands-on problems on ggplot2 color and fill scales: manual palettes, ColorBrewer, viridis, continuous gradients, diverging schemes, and colorblind-safe choices. Every task names a dataset and a save-to variable, and solutions are hidden so you can try first.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(tibble)
```

## Section 1. Manual scales (4 problems)

### Exercise 1.1: Map three cylinder groups to named hex colors

**Task:** Build a scatter of `wt` versus `mpg` on `mtcars` colored by the `factor(cyl)` variable, and use `scale_color_manual()` to assign "tomato" to 4 cylinders, "steelblue" to 6, and "forestgreen" to 8. Save the plot to `ex_1_1`.

**Expected result:**

```
#> ggplot scatter: x = wt, y = mpg, points colored by cyl
#> legend shows "4" (tomato), "6" (steelblue), "8" (forestgreen)
```

**Difficulty:** Beginner

[HINTS]
Think about tying each category to a specific color by name rather than by position, so the mapping survives any reordering of levels.
Reach for `scale_color_manual()` and pass a named character vector to its `values` argument, like `c("4" = "tomato", ...)`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_manual(
    name = "Cylinders",
    values = c("4" = "tomato", "6" = "steelblue", "8" = "forestgreen")
  )
ex_1_1
```

**Explanation:** A named character vector inside `values =` is the safest pattern because the names match factor levels directly, so the order of assignment is independent of the data order. Compare with an unnamed vector like `c("tomato","steelblue","forestgreen")`: that maps positionally and silently breaks if levels are reordered. Use named vectors whenever a level can move.

</details>

### Exercise 1.2: Override default bar colors for diamond cut with a named brand palette

**Task:** A jeweller building a marketing report wants the five `cut` levels of `diamonds` to use specific brand hex codes: Fair `#7f1d1d`, Good `#b91c1c`, Very Good `#dc2626`, Premium `#f59e0b`, Ideal `#10b981`. Build a `geom_bar()` chart of cut counts using `scale_fill_manual()` with a named vector, and save the plot to `ex_1_2`.

**Expected result:**

```
#> bar chart: x = cut (5 levels), y = count
#> bars filled with brand reds (Fair/Good/Very Good), amber (Premium), green (Ideal)
```

**Difficulty:** Intermediate

[HINTS]
Define the five brand colors once as a lookup keyed by cut level, then feed that lookup into the fill scale of a count bar chart.
Use `geom_bar()` with `scale_fill_manual(values = ...)` passing a named vector, and `guides(fill = "none")` to drop the redundant legend.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
brand_palette <- c(
  "Fair"      = "#7f1d1d",
  "Good"      = "#b91c1c",
  "Very Good" = "#dc2626",
  "Premium"   = "#f59e0b",
  "Ideal"     = "#10b981"
)

ex_1_2 <- ggplot(diamonds, aes(cut, fill = cut)) +
  geom_bar() +
  scale_fill_manual(values = brand_palette) +
  guides(fill = "none")
ex_1_2
```

**Explanation:** Defining the palette as a named vector before the call separates the design decision from the plot code, which makes it easy to reuse the same palette across multiple charts. `guides(fill = "none")` hides the redundant legend since the x-axis already labels each cut. If a future level is added to `cut`, `scale_fill_manual` will throw a missing-value warning unless that level is also added to `brand_palette`.

</details>

### Exercise 1.3: Reorder the legend with breaks while keeping the same colors

**Task:** Using the same `diamonds` bar chart from the previous exercise, keep the brand palette but force the legend (and plotting order) to be Ideal, Premium, Very Good, Good, Fair, by passing `breaks =` to `scale_fill_manual()`. Save the plot to `ex_1_3`.

**Expected result:**

```
#> bar chart of cut counts; bars colored by brand palette
#> legend order: Ideal, Premium, Very Good, Good, Fair (reversed from default)
```

**Difficulty:** Intermediate

[HINTS]
Legend order and the category-to-color mapping are separate concerns, so you only need to change what the legend displays.
Keep the same `values` vector but add a `breaks` argument listing the levels in your desired order.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
brand_palette <- c(
  "Fair"      = "#7f1d1d",
  "Good"      = "#b91c1c",
  "Very Good" = "#dc2626",
  "Premium"   = "#f59e0b",
  "Ideal"     = "#10b981"
)

ex_1_3 <- ggplot(diamonds, aes(cut, fill = cut)) +
  geom_bar() +
  scale_fill_manual(
    values = brand_palette,
    breaks = c("Ideal", "Premium", "Very Good", "Good", "Fair")
  )
ex_1_3
```

**Explanation:** `breaks` controls only what appears in the legend and in what order, not the actual category mapping. To also reorder bars on the x-axis you would need to relevel the factor (e.g., `mutate(cut = factor(cut, levels = c("Ideal","Premium",...)))`) before the call to ggplot. A common bug is to swap colors by reordering `values` instead of using `breaks`: that breaks the name-color contract.

</details>

### Exercise 1.4: Handle missing factor levels with na.value and drop = FALSE

**Task:** Take a copy of `mtcars`, set rows 3, 7, and 15 of `cyl` to `NA`, then convert `cyl` to a factor with all three levels (4, 6, 8). Build a `wt` versus `mpg` scatter colored by `cyl`, use `scale_color_manual()` with the tomato/steelblue/forestgreen palette plus `na.value = "grey50"` and `drop = FALSE`, and save the plot to `ex_1_4`.

**Expected result:**

```
#> scatter with 32 points; 3 grey points (NA cyl), the rest colored 4/6/8
#> legend keeps all three levels visible even if a level is empty in the data
```

**Difficulty:** Advanced

[HINTS]
Missing values need an explicit color of their own, and every declared category should stay in the legend even when it has no data.
Build the factor with `levels = c(4, 6, 8)` first, then in `scale_color_manual()` set `na.value = "grey50"` and `drop = FALSE`.

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
df <- mtcars
df$cyl[c(3, 7, 15)] <- NA
df$cyl <- factor(df$cyl, levels = c(4, 6, 8))

ex_1_4 <- ggplot(df, aes(wt, mpg, color = cyl)) +
  geom_point(size = 3) +
  scale_color_manual(
    values   = c("4" = "tomato", "6" = "steelblue", "8" = "forestgreen"),
    na.value = "grey50",
    drop     = FALSE
  )
ex_1_4
```

**Explanation:** `na.value` controls how `NA` data points render (otherwise they become invisible because the default is `NA` color, which is dropped). `drop = FALSE` keeps every declared factor level in the legend even when a level has zero observations in the current data slice, which is critical for dashboards that filter and re-render: without it, legends shrink and grow as filters change, confusing the reader.

</details>

## Section 2. Brewer palettes (4 problems)

### Exercise 2.1: Apply Set1 to a categorical scatter

**Task:** Use the built-in `mtcars` dataset to draw a scatter of `disp` versus `mpg` colored by `factor(cyl)`, then apply `scale_color_brewer(palette = "Set1")` to use a qualitative ColorBrewer palette. Save the plot to `ex_2_1`.

**Expected result:**

```
#> scatter; 32 points colored in red/blue/green from ColorBrewer Set1
#> legend labels: "4", "6", "8"
```

**Difficulty:** Beginner

[HINTS]
ColorBrewer ships ready-made qualitative palettes meant for distinct, unordered categories.
Apply `scale_color_brewer(palette = "Set1")` to the scatter colored by `factor(cyl)`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(mtcars, aes(disp, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_brewer(palette = "Set1", name = "Cylinders")
ex_2_1
```

**Explanation:** `scale_color_brewer()` is designed for discrete data; pairing it with a numeric aesthetic raises a warning and falls back to grey. Set1 has only nine colors maximum, so if a factor has more levels you must switch to `Paired`, `Set3`, or interpolate with `colorRampPalette()`. For a continuous variable, use `scale_color_distiller()` instead, which uses the same Brewer palettes but interpolates over a range.

</details>

### Exercise 2.2: Compare monthly ozone with the Dark2 qualitative palette

**Task:** A climatologist wants to compare daily `Ozone` readings across months in `airquality`. Build a `geom_boxplot()` of `Ozone` by `factor(Month)` colored by `factor(Month)`, apply `scale_color_brewer(palette = "Dark2")`, and save the plot to `ex_2_2`. Drop missing Ozone values first.

**Expected result:**

```
#> boxplot of Ozone by month (5 through 9); box outlines colored by month
#> legend: 5, 6, 7, 8, 9 in Dark2 palette (5 distinct colors)
```

**Difficulty:** Intermediate

[HINTS]
Drop the rows that have no reading first, then color each month group with a qualitative palette.
Filter with `!is.na(Ozone)`, then combine `geom_boxplot()` with `scale_color_brewer(palette = "Dark2")`.

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- airquality |>
  filter(!is.na(Ozone)) |>
  ggplot(aes(factor(Month), Ozone, color = factor(Month))) +
  geom_boxplot() +
  scale_color_brewer(palette = "Dark2", name = "Month")
ex_2_2
```

**Explanation:** `Dark2` is qualitative, meaning every color is perceptually distinct and carries no ordinal meaning. That makes it correct for nominal variables like month-as-category. If the months were meant to read as an ordered progression (May to September), a sequential palette like `Blues` via `scale_color_brewer(palette = "Blues")` would carry that ordering information visually. Pick the palette family that matches the variable's role, not just what looks pretty.

</details>

### Exercise 2.3: Continuous fill with scale_fill_distiller and Spectral

**Task:** A retailer studying the relationship between `carat` and `price` in `diamonds` wants a hex-binned heatmap. Build `geom_hex()` of `carat` versus `price`, map `..count..` to fill, and apply `scale_fill_distiller(palette = "Spectral")` to interpolate the Brewer palette continuously. Save the plot to `ex_2_3`.

**Expected result:**

```
#> hex heatmap: x = carat, y = price; cell fill = bin count
#> color ramp follows Spectral (red-yellow-blue) interpolated as continuous
```

**Difficulty:** Intermediate

[HINTS]
A Brewer palette can be stretched smoothly over a continuous range instead of used as a fixed set of discrete swatches.
Use `geom_hex()` and apply `scale_fill_distiller(palette = "Spectral")` to the count fill.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(diamonds, aes(carat, price)) +
  geom_hex(bins = 30) +
  scale_fill_distiller(palette = "Spectral", name = "Count")
ex_2_3
```

**Explanation:** `scale_fill_brewer()` would error here because `..count..` is continuous; `scale_fill_distiller()` solves that by interpolating the discrete Brewer palette over a continuous range. Spectral is diverging, which can be a poor fit for count data that has no natural center. A sequential palette such as `YlOrRd` would more honestly encode "more density = darker." Use diverging palettes only when zero or a midpoint matters semantically.

</details>

### Exercise 2.4: Build a custom 7-step palette by interpolating two hex anchors

**Task:** Use `colorRampPalette()` to interpolate seven hex colors between "#440154" (deep purple) and "#FDE725" (yellow). Build a bar chart of `mpg` for each `rownames(mtcars)` row, ordered ascending, with `fill = factor(rank)` and apply the 7 colors from your ramp via `scale_fill_manual(values = pal_7)` on the seven quantile-binned ranks. Save the plot to `ex_2_4`.

**Expected result:**

```
#> bar chart: 32 cars ranked by mpg ascending; bars colored in 7 quantile bins
#> color ramp goes from deep purple (lowest mpg) to yellow (highest)
```

**Difficulty:** Advanced

[HINTS]
When you need more colors than a palette ships, interpolate brand-new ones evenly between two anchor shades.
Build the seven colors with `colorRampPalette(c("#440154", "#FDE725"))(7)` and feed them to `scale_fill_manual(values = ...)`.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pal_7 <- colorRampPalette(c("#440154", "#FDE725"))(7)

df <- mtcars |>
  tibble::rownames_to_column("car") |>
  mutate(
    car  = reorder(car, mpg),
    rank = factor(cut(mpg, breaks = 7, labels = FALSE))
  )

ex_2_4 <- ggplot(df, aes(car, mpg, fill = rank)) +
  geom_col() +
  scale_fill_manual(values = pal_7, name = "Quantile") +
  coord_flip()
ex_2_4
```

**Explanation:** `colorRampPalette()` returns a function; calling that function with `(7)` produces seven evenly interpolated hex codes between the anchors. This pattern is essential when a categorical variable has more levels than a Brewer palette supports, or when you need a custom corporate gradient. The two anchors here approximate the endpoints of viridis, so you get a hand-rolled version of `viridis_d(n = 7)`.

</details>

## Section 3. Viridis scales (4 problems)

### Exercise 3.1: Color mpg continuously with viridis

**Task:** Build a scatter of `wt` versus `hp` on `mtcars`, map `mpg` to the `color` aesthetic as a continuous variable, apply `scale_color_viridis_c()` with default options, and save the plot to `ex_3_1`.

**Expected result:**

```
#> scatter: x = wt, y = hp; points colored by mpg
#> color bar legend uses viridis default (dark purple low, yellow high)
```

**Difficulty:** Beginner

[HINTS]
A continuous variable mapped to color needs a smooth, perceptually even ramp rather than discrete swatches.
Map `mpg` to the `color` aesthetic and add `scale_color_viridis_c()`.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(mtcars, aes(wt, hp, color = mpg)) +
  geom_point(size = 3) +
  scale_color_viridis_c(name = "MPG")
ex_3_1
```

**Explanation:** `scale_color_viridis_c()` is the continuous variant; `_d` is discrete. Viridis is perceptually uniform (equal data steps look like equal color steps to the eye) and remains distinguishable in greyscale and to viewers with red-green color vision deficiency. That makes it a safe default for any continuous color encoding, especially in scientific or accessibility-sensitive contexts.

</details>

### Exercise 3.2: Reverse direction and switch to the plasma option

**Task:** A geneticist plotting gene expression wants the same `mtcars` scatter as the previous exercise, but the color order should be reversed (so high `mpg` is dark and low `mpg` is bright) and the palette should be `plasma` instead of the default `viridis`. Use `scale_color_viridis_c(option = "plasma", direction = -1)` and save the plot to `ex_3_2`.

**Expected result:**

```
#> scatter: x = wt, y = hp; colored by mpg
#> color bar uses plasma reversed: bright orange low mpg, deep purple high mpg
```

**Difficulty:** Intermediate

[HINTS]
You can swap the palette variant and flip the direction of the ramp without touching a single hex code.
Pass `option = "plasma"` and `direction = -1` to `scale_color_viridis_c()`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(mtcars, aes(wt, hp, color = mpg)) +
  geom_point(size = 3) +
  scale_color_viridis_c(option = "plasma", direction = -1, name = "MPG")
ex_3_2
```

**Explanation:** `option =` selects the variant: "viridis" (default), "magma", "plasma", "inferno", "cividis", "mako", "rocket", "turbo". `direction = -1` flips the ramp without rewriting hex codes. A common style choice: use the dark end for the value the reader should worry about (low fuel economy here), since dark pulls the eye. Reversing keeps the palette properties (perceptual uniformity, colorblind safety) intact.

</details>

### Exercise 3.3: Discrete viridis for a categorical variable

**Task:** A finance analyst comparing four credit-rating buckets needs a discrete viridis palette. Construct an inline tibble of 40 fake daily volatility readings spread across four ratings (AAA, AA, A, BBB) and plot a boxplot of volatility by rating using `scale_color_viridis_d(option = "magma")`. Save the plot to `ex_3_3`.

**Expected result:**

```
#> boxplot: 4 rating buckets on x-axis, volatility on y-axis
#> outlines colored by rating with magma palette (4 distinct shades)
```

**Difficulty:** Intermediate

[HINTS]
A categorical variable needs the discrete form of the palette, with levels ordered so the colors read as a quality gradient.
Use `scale_color_viridis_d(option = "magma")`, and consider `end = 0.85` to trim the pale yellow for better contrast.

```r title="Your turn"
ratings_df <- tibble::tibble(
  rating     = rep(c("AAA","AA","A","BBB"), each = 10),
  volatility = c(rnorm(10, 0.08, 0.02), rnorm(10, 0.12, 0.03),
                 rnorm(10, 0.18, 0.04), rnorm(10, 0.28, 0.06))
)

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ratings_df <- tibble::tibble(
  rating     = factor(rep(c("AAA","AA","A","BBB"), each = 10),
                      levels = c("AAA","AA","A","BBB")),
  volatility = c(rnorm(10, 0.08, 0.02), rnorm(10, 0.12, 0.03),
                 rnorm(10, 0.18, 0.04), rnorm(10, 0.28, 0.06))
)

ex_3_3 <- ggplot(ratings_df, aes(rating, volatility, color = rating)) +
  geom_boxplot() +
  scale_color_viridis_d(option = "magma", end = 0.85, name = "Rating")
ex_3_3
```

**Explanation:** Setting `end = 0.85` trims the lightest yellow off the magma ramp, which often improves contrast against a white background. Without this, the highest-value category nearly disappears. Setting the factor levels explicitly preserves the credit-quality order (AAA best, BBB worst) so the color ramp reads as a quality gradient.

</details>

### Exercise 3.4: Spread a skewed fill with a sqrt transformation

**Task:** When a fill variable is heavily right-skewed, most points cluster in one color band. Build a `geom_hex()` plot of `price` versus `carat` on `diamonds` (note axis flip) with `..count..` mapped to fill, then apply `scale_fill_viridis_c(trans = "sqrt")` to compress the high counts and reveal structure in low-density regions. Save the plot to `ex_3_4`.

**Expected result:**

```
#> hex heatmap: x = price, y = carat; fill = sqrt(count)
#> low-density hexes now visible in mid-viridis colors instead of dark purple
```

**Difficulty:** Advanced

[HINTS]
A heavily right-skewed fill hides structure in low-density regions unless you compress the high end of the color scale.
Add `trans = "sqrt"` to `scale_fill_viridis_c()` and label the legend with the transform applied.

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- ggplot(diamonds, aes(price, carat)) +
  geom_hex(bins = 40) +
  scale_fill_viridis_c(trans = "sqrt", name = "Count\n(sqrt)")
ex_3_4
```

**Explanation:** Color scales obey the same transformation rules as axis scales: `trans = "log10"`, `"sqrt"`, `"reverse"`, or any `scales::trans_new()`. The square-root transform pulls long-tailed distributions back toward the middle so visual variance reflects real variance instead of being eaten by one or two outlier cells. Always label the legend with the transform applied: a reader expects raw counts unless told otherwise.

</details>

## Section 4. Gradients and diverging scales (4 problems)

### Exercise 4.1: Two-color sequential gradient

**Task:** Build a scatter of `wt` versus `qsec` on `mtcars` with `mpg` mapped to color, then apply `scale_color_gradient(low = "white", high = "darkred")` to create a simple two-color sequential gradient. Save the plot to `ex_4_1`.

**Expected result:**

```
#> scatter: x = wt, y = qsec; points colored by mpg
#> color bar runs from white (low mpg) to darkred (high mpg)
```

**Difficulty:** Beginner

[HINTS]
The simplest continuous color scale just interpolates linearly between two endpoint colors.
Use `scale_color_gradient(low = "white", high = "darkred")`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ggplot(mtcars, aes(wt, qsec, color = mpg)) +
  geom_point(size = 3) +
  scale_color_gradient(low = "white", high = "darkred", name = "MPG")
ex_4_1
```

**Explanation:** `scale_color_gradient()` is the simplest continuous color scale: two endpoints, linear interpolation. White-to-red is fine on a printed page but loses its lowest band against a white panel; for screen plots a pale grey or pale yellow at the low end (`low = "#FFF7BC"`) usually reads better. Reach for `gradient2()` or `gradientn()` when one color stop is not enough.

</details>

### Exercise 4.2: Three-color diverging gradient centered at zero

**Task:** A risk team plotting daily profit-and-loss across 50 days wants positive and negative days colored differently with white at zero. Construct an inline tibble with 50 random `pnl` values centered near 0, plot a bar chart of `pnl` by day, fill by `pnl`, and apply `scale_fill_gradient2(low = "firebrick", mid = "white", high = "steelblue", midpoint = 0)`. Save the plot to `ex_4_2`.

**Expected result:**

```
#> 50 bars; negative days in red, positive in blue, near-zero white
#> color legend is a continuous bar with the diverging firebrick-white-steelblue ramp
```

**Difficulty:** Intermediate

[HINTS]
When a value can be positive or negative, the color scale should pivot around its natural center so the sign-flip stays visible.
Use `scale_fill_gradient2()` with `low`, `mid`, `high`, and `midpoint = 0`.

```r title="Your turn"
pnl_df <- tibble::tibble(
  day = 1:50,
  pnl = rnorm(50, mean = 0.1, sd = 1.2)
)

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pnl_df <- tibble::tibble(
  day = 1:50,
  pnl = rnorm(50, mean = 0.1, sd = 1.2)
)

ex_4_2 <- ggplot(pnl_df, aes(day, pnl, fill = pnl)) +
  geom_col() +
  scale_fill_gradient2(
    low      = "firebrick",
    mid      = "white",
    high     = "steelblue",
    midpoint = 0,
    name     = "P&L"
  )
ex_4_2
```

**Explanation:** `gradient2()` is the right choice whenever zero (or any natural anchor) divides "good" from "bad." The `midpoint` argument anchors the mid color to a value; default is `0`. Without `gradient2`, a normal gradient would color the smallest negative value the same shade as the smallest positive value, hiding the sign-flip that risk teams care about most.

</details>

### Exercise 4.3: Five-anchor gradient with gradientn for a custom corporate ramp

**Task:** A marketing analyst wants a five-color corporate gradient for campaign lift values: low through high uses "#2c7fb8", "#7fcdbb", "#c7e9b4", "#fec44f", "#d95f0e". Build a tile plot of `economics$unemploy` over `economics$date` using `geom_path()` colored by `unemploy`, apply the five colors via `scale_color_gradientn(colors = ...)`, and save to `ex_4_3`.

**Expected result:**

```
#> path plot of unemployment over time; line colored by unemploy
#> color legend uses the 5-stop teal-yellow-orange custom ramp
```

**Difficulty:** Intermediate

[HINTS]
Two or three endpoint colors aren't enough when you must reproduce a custom multi-stop corporate ramp.
Pass all five hex codes as a single vector to `scale_color_gradientn(colors = ...)`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ramp_5 <- c("#2c7fb8", "#7fcdbb", "#c7e9b4", "#fec44f", "#d95f0e")

ex_4_3 <- ggplot(economics, aes(date, unemploy, color = unemploy)) +
  geom_path(linewidth = 1) +
  scale_color_gradientn(colors = ramp_5, name = "Unemploy")
ex_4_3
```

**Explanation:** `scale_color_gradientn()` is the most flexible continuous scale: pass any number of color stops and ggplot interpolates evenly between them. Use it when two endpoints (`gradient`) or three (`gradient2`) aren't enough, e.g., reproducing a brand palette or matching an existing chart in a brand book. For finer control over where each stop lands on the value axis, also pass a `values =` vector of breakpoints in `[0, 1]`.

</details>

### Exercise 4.4: Anchor a diverging scale at zero despite asymmetric data limits

**Task:** Compute the correlation matrix of `mtcars[, 1:5]`, melt it to long form with `as.data.frame(as.table(cor(...)))`, plot a `geom_tile()` heatmap with `fill = Freq`, and apply `scale_fill_gradient2(low = "#b2182b", mid = "white", high = "#2166ac", midpoint = 0, limits = c(-1, 1))` so the midpoint stays at zero even though no correlation reaches the extremes. Save the plot to `ex_4_4`.

**Expected result:**

```
#> 5x5 correlation heatmap; diagonal pure blue (rho = 1)
#> off-diagonals diverge red (negative) to blue (positive) with white anchored at 0
```

**Difficulty:** Advanced

[HINTS]
For the white band to truly sit at zero, the scale must span the variable's full theoretical range, not just the observed min and max.
Use `scale_fill_gradient2()` with `midpoint = 0` and lock `limits = c(-1, 1)`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cor_df <- as.data.frame(as.table(cor(mtcars[, 1:5])))
names(cor_df) <- c("Var1", "Var2", "rho")

ex_4_4 <- ggplot(cor_df, aes(Var1, Var2, fill = rho)) +
  geom_tile(color = "white") +
  scale_fill_gradient2(
    low      = "#b2182b",
    mid      = "white",
    high     = "#2166ac",
    midpoint = 0,
    limits   = c(-1, 1),
    name     = "rho"
  ) +
  coord_fixed()
ex_4_4
```

**Explanation:** Without `limits = c(-1, 1)`, the legend would auto-fit to the observed min and max (e.g., -0.3 to 0.9), and "white at midpoint = 0" would slide off-center visually. Locking limits to the variable's theoretical range (correlation is bounded in [-1, 1]) keeps the white band anchored to zero regardless of which subset is plotted. Reuse this trick for any quantity with a known semantic center: log-fold-change at 0, lift at 1, residuals at 0.

</details>

## Section 5. Real-world plotting tasks (4 problems)

### Exercise 5.1: Branded bar chart with named manual fill mapping

**Task:** A retailer's quarterly slide deck needs a bar chart of `diamonds$cut` counts using exact brand colors: Fair `#0F4C81`, Good `#1F77B4`, Very Good `#4DA0D3`, Premium `#92C5DE`, Ideal `#D9E8F5` (a single-hue sequential blue ramp). Apply `scale_fill_manual(values = brand_blues)` with a named vector, hide the redundant fill legend, and save the plot to `ex_5_1`.

**Expected result:**

```
#> bar chart of 5 cuts; bars filled with 5 shades of blue (dark to pale)
#> no fill legend (redundant with x-axis)
```

**Difficulty:** Intermediate

[HINTS]
An ordinal category reads well with a single-hue ramp where each level is tied to its shade by name.
Pass the named blue vector to `scale_fill_manual(values = ...)` and drop the legend with `guides(fill = "none")`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
brand_blues <- c(
  "Fair"      = "#0F4C81",
  "Good"      = "#1F77B4",
  "Very Good" = "#4DA0D3",
  "Premium"   = "#92C5DE",
  "Ideal"     = "#D9E8F5"
)

ex_5_1 <- ggplot(diamonds, aes(cut, fill = cut)) +
  geom_bar() +
  scale_fill_manual(values = brand_blues) +
  guides(fill = "none") +
  labs(title = "Diamond inventory by cut", y = "Count")
ex_5_1
```

**Explanation:** A single-hue sequential palette is appropriate here because `cut` is ordinal (Fair worst, Ideal best): the value of being darker carries meaning. If you were comparing brands or unordered campaigns, switch to a qualitative palette like Set1 or Dark2. Named vectors also let the same palette feed `scale_color_manual` elsewhere in the deck without redefining the colors.

</details>

### Exercise 5.2: Colorblind-safe heatmap of ozone by day and month

**Task:** An epidemiologist preparing a paper figure needs a heatmap of `airquality$Ozone` by `Day` (x) and `Month` (y). Drop missing Ozone values, plot `geom_tile()` with `fill = Ozone`, apply `scale_fill_distiller(palette = "YlOrRd", direction = 1)` (a colorblind-safe sequential Brewer palette interpolated continuously), and save the plot to `ex_5_2`.

**Expected result:**

```
#> tile heatmap; x = Day (1-31), y = Month (5-9), fill intensity = Ozone
#> hot ozone days in deep red, cool ones in pale yellow
```

**Difficulty:** Advanced

[HINTS]
A colorblind-safe sequential palette can be interpolated continuously to fill a tile heatmap, with darker meaning more.
Use `geom_tile()` with `scale_fill_distiller(palette = "YlOrRd", direction = 1)`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- airquality |>
  filter(!is.na(Ozone)) |>
  ggplot(aes(Day, factor(Month), fill = Ozone)) +
  geom_tile(color = "white") +
  scale_fill_distiller(palette = "YlOrRd", direction = 1, name = "Ozone (ppb)") +
  labs(x = "Day of month", y = "Month")
ex_5_2
```

**Explanation:** `direction = 1` reverses the default Brewer interpolation so high ozone is dark and low is pale, which matches the reader's expectation that "darker = more." YlOrRd is sequential and colorblind-safe for the dominant red-green deficiency, unlike Rainbow or RdYlGn which collapse for those viewers. For exact contrast checks, pass your palette through `colorblindcheck::palette_check()` (separate package).

</details>

### Exercise 5.3: Colorblind-safe categorical scatter with cividis

**Task:** A sports analyst's player-stat scatter needs to be colorblind-safe for both red-green and blue-yellow deficiencies. Plot `mpg` versus `hp` on `mtcars` colored by `factor(cyl)`, apply `scale_color_viridis_d(option = "cividis")` (the only viridis variant explicitly tuned for both deficiency types), and save the plot to `ex_5_3`.

**Expected result:**

```
#> scatter: x = mpg, y = hp; 3 cylinder groups in cividis (blue, olive, yellow)
#> readable for protanopia, deuteranopia, and tritanopia
```

**Difficulty:** Advanced

[HINTS]
Only one palette variant is tuned to stay readable under both red-green and blue-yellow color vision deficiencies.
Apply `scale_color_viridis_d(option = "cividis")` to the scatter colored by `factor(cyl)`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ggplot(mtcars, aes(mpg, hp, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_viridis_d(option = "cividis", name = "Cylinders") +
  labs(title = "mpg vs hp by cylinder count")
ex_5_3
```

**Explanation:** Cividis was published in 2018 specifically to remain perceptually uniform across both deuteranopia and tritanopia, which is rare. The other viridis options handle red-green issues well but can flatten under tritanopia. For accessibility-critical work (regulatory submissions, scientific publication), cividis is a safer default than even viridis. The tradeoff is a narrower color range (blue to yellow only), so it's less visually striking.

</details>

### Exercise 5.4: Match a corporate primary color in a faceted A/B test plot

**Task:** A growth team's faceted A/B test report uses Brewer Set2 by default, but the brand book mandates the company primary blue `#0066CC` for variant A, plus matched secondaries `#33CCFF` for B and `#66FFCC` for C. Build the line plot below faceted by `variant`, replace the Brewer scale with `scale_color_manual(values = brand_ab)` using the three branded shades, and save the plot to `ex_5_4`.

**Expected result:**

```
#> 3-panel facet: variant A, B, C; conversion over week
#> A in corporate blue, B in light cyan, C in light teal
```

**Difficulty:** Advanced

[HINTS]
Replace the default palette with the exact brand colors, each one keyed to a specific variant by name.
Define a named vector for A, B, and C and pass it to `scale_color_manual(values = ...)`.

```r title="Your turn"
ab_df <- tibble::tibble(
  week     = rep(1:8, 3),
  variant  = rep(c("A","B","C"), each = 8),
  convers  = c(0.10,0.11,0.12,0.13,0.13,0.14,0.15,0.15,
               0.10,0.12,0.13,0.14,0.15,0.16,0.17,0.18,
               0.10,0.11,0.13,0.14,0.16,0.18,0.20,0.22)
)

ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ab_df <- tibble::tibble(
  week     = rep(1:8, 3),
  variant  = rep(c("A","B","C"), each = 8),
  convers  = c(0.10,0.11,0.12,0.13,0.13,0.14,0.15,0.15,
               0.10,0.12,0.13,0.14,0.15,0.16,0.17,0.18,
               0.10,0.11,0.13,0.14,0.16,0.18,0.20,0.22)
)

brand_ab <- c("A" = "#0066CC", "B" = "#33CCFF", "C" = "#66FFCC")

ex_5_4 <- ggplot(ab_df, aes(week, convers, color = variant)) +
  geom_line(linewidth = 1.2) +
  geom_point(size = 2) +
  facet_wrap(~ variant) +
  scale_color_manual(values = brand_ab) +
  labs(y = "Conversion rate")
ex_5_4
```

**Explanation:** Hard-coding the brand primary on the control variant (A) is a common reporting pattern: the eye anchors on the brand color and reads the treatments as variations of it. The secondary shades (`#33CCFF`, `#66FFCC`) are tints of cyan and teal, both adjacent on the color wheel to the primary blue, so the panel reads as one family. For long-running brand systems, pin these in a separate file (`brand_colors.R`) and `source()` it.

</details>

## What to do next

- [ggplot2 Customizing the Look and Feel](Complete-Ggplot2-Tutorial-Part2-Customizing-the-Look-and-Feel.html) for the parent tutorial that introduces these scale functions.
- [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) for broader practice across geoms, aesthetics, and facets.
- [Top 50 ggplot2 Visualizations](Top50-Ggplot2-Visualizations-MasterList-R-Code.html) to see palette choices applied across 50 finished plots.
- [Data Wrangling Exercises in R](Data-Wrangling-Exercises-in-R.html) to practice the dplyr and tidyr verbs that feed these plots.
