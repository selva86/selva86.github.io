---
title: "ggplot2 Secondary Axis in R: Add a Second Y-Axis the Right Way"
slug: "ggplot2-Secondary-Axis"
description: "Add a second y-axis in ggplot2 using sec_axis() with a mathematical transformation. Learn when dual axes help, when they mislead, and how to align scales."
keywords: "ggplot2 secondary axis, sec_axis, second y-axis ggplot2, dual axis ggplot2, dup_axis, ggplot2 two y axes, scale_y_continuous sec.axis, secondary axis R, ggplot dual y axis"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-ggpl-2"
post_type: "C"
auto_link_terms: "sec_axis()|dup_axis()|secondary axis|second y-axis|dual axis|secondary y-axis|dual y-axis"
auto_link_case_sensitive: false
fr_parent: "ggplot2-Scales.html"
sidebar_section: "Visualization"
sidebar_title: "Secondary Axis"
difficulty: "Intermediate"
---

# ggplot2 Secondary Axis in R: Add a Second Y-Axis the Right Way

<p class="lead"><code>sec_axis()</code> adds a secondary y-axis (or x-axis) to a ggplot2 plot by applying a mathematical transformation to the primary axis — it does not create an independent axis.</p>

## Introduction

You have temperature in Celsius on one axis and rainfall in millimetres on the other. Both belong on the same time-series plot, but their scales are completely different. How do you show both without creating a mess?

ggplot2 solves this with `sec_axis()`, a function that creates a secondary axis by transforming the primary axis's scale. The key insight is that ggplot2 does not support two truly independent y-axes. Instead, you rescale one variable to fit the primary axis, then label the secondary axis with the inverse transformation so readers see the original units.

In this tutorial, you will learn how `sec_axis()` works under the hood and how to compute the transformation coefficient from your data. You will also learn how to style dual-axis plots for readability — and when to avoid dual axes altogether. All code runs directly in your browser.

## How does sec_axis() work?

The `sec_axis()` function lives inside `scale_y_continuous()` (or `scale_x_continuous()`). It takes a transformation formula and applies it to the primary axis tick values to produce the secondary axis labels.

The transformation must be strictly monotonic — every input maps to exactly one output with no reversals. Linear transformations like `~ . * 1.8 + 32` (Celsius to Fahrenheit) are the most common.

Let's start with the simplest case: a single variable plotted with a unit-conversion secondary axis.

```r
library(ggplot2)

# Sample temperature data in Celsius
temp_data <- data.frame(
  day = 1:10,
  temp_c = c(18, 20, 22, 25, 28, 30, 27, 24, 21, 19)
)

p_basic <- ggplot(temp_data, aes(x = day, y = temp_c)) +
  geom_line(linewidth = 1, color = "steelblue") +
  geom_point(size = 2, color = "steelblue") +
  scale_y_continuous(
    name = "Temperature (°C)",
    sec.axis = sec_axis(~ . * 1.8 + 32, name = "Temperature (°F)")
  ) +
  labs(x = "Day") +
  theme_minimal()

print(p_basic)
#> A line plot with Celsius on the left axis and Fahrenheit on the right axis
```

The left axis shows Celsius. The right axis shows the same data converted to Fahrenheit using the formula `F = C * 1.8 + 32`. Both axes represent the same variable in different units — this is the cleanest use case for `sec_axis()`.

[KEY INSIGHT]
**sec_axis() does not create an independent axis.** It relabels the primary axis using a formula. The right-side tick marks are computed from the left-side tick marks, not from a separate variable.

**Try it:** Create a plot of distances in kilometres (use `data.frame(trip = 1:5, km = c(10, 25, 42, 8, 55))`) with a secondary axis that shows miles. The conversion is `miles = km * 0.621`.

```r
# Try it: add a km-to-miles secondary axis
trip_data <- data.frame(trip = 1:5, km = c(10, 25, 42, 8, 55))

ex_p1 <- ggplot(trip_data, aes(x = trip, y = km)) +
  geom_col(fill = "coral") +
  scale_y_continuous(
    name = "Distance (km)",
    sec.axis = sec_axis(~ . * 0.621, name = "Distance (miles)")
  )
# your code here — modify the sec_axis formula if needed

print(ex_p1)
#> Expected: bar chart with km on left, miles on right
```

<details>
<summary>Click to reveal solution</summary>

```r
trip_data <- data.frame(trip = 1:5, km = c(10, 25, 42, 8, 55))

ex_p1 <- ggplot(trip_data, aes(x = trip, y = km)) +
  geom_col(fill = "coral") +
  scale_y_continuous(
    name = "Distance (km)",
    sec.axis = sec_axis(~ . * 0.621, name = "Distance (miles)")
  ) +
  theme_minimal()

print(ex_p1)
#> Bar chart with km on the left axis and miles on the right axis
```

**Explanation:** The formula `~ . * 0.621` converts each km tick value to miles for the right axis.

</details>

## How do you compute the transformation coefficient?

Unit conversions are straightforward because the formula is known. The harder case is plotting two different variables on the same chart — say, unemployment count and personal savings rate from R's built-in `economics` dataset.

The trick is a two-step process. First, rescale the second variable so it fits within the primary axis range. Second, use the inverse of that rescaling as the `sec_axis()` transformation so the right axis shows the original values.

Here is how to compute the linear transformation coefficients from the data.

```r
# Use the economics dataset (comes with ggplot2)
econ <- economics[economics$date >= as.Date("2005-01-01"), ]

# Primary variable: unemploy (thousands of people)
# Secondary variable: psavert (personal savings rate, %)

# Step 1: Compute the scaling coefficient and offset
coeff <- (max(econ$unemploy) - min(econ$unemploy)) /
         (max(econ$psavert) - min(econ$psavert))
offset <- min(econ$unemploy) - coeff * min(econ$psavert)

cat("Coefficient:", round(coeff, 1), "\n")
#> Coefficient: 978.3
cat("Offset:", round(offset, 1), "\n")
#> Offset: 3948.5
```

The coefficient tells you how many units of the primary variable correspond to one unit of the secondary variable. The offset aligns the minimums. Now plot both variables, scaling `psavert` into the `unemploy` range.

```r
p_dual <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "steelblue", linewidth = 0.8) +
  geom_line(aes(y = psavert * coeff + offset), color = "tomato", linewidth = 0.8) +
  scale_y_continuous(
    name = "Unemployed (thousands)",
    sec.axis = sec_axis(~ (. - offset) / coeff, name = "Savings Rate (%)")
  ) +
  labs(x = NULL) +
  theme_minimal()

print(p_dual)
#> Line chart: blue = unemployment (left axis), red = savings rate (right axis)
```

The blue line reads off the left axis (unemployment). The red line reads off the right axis (savings rate). The `sec_axis()` formula is the inverse of the scaling: `(. - offset) / coeff` undoes the `* coeff + offset` applied to the data.

[TIP]
**Always compute the scaling coefficient from your data's actual ranges.** Guessing a round number like 1000 leads to one variable being squashed at the top or bottom of the plot.

**Try it:** Compute the coefficient and offset to plot `mtcars$mpg` (primary, left axis) against `mtcars$hp` (secondary, right axis). Print both values.

```r
# Try it: compute coeff and offset for mpg vs hp
ex_coeff <- (max(mtcars$mpg) - min(mtcars$mpg)) /
            (max(mtcars$hp) - min(mtcars$hp))
ex_offset <- min(mtcars$mpg) - ex_coeff * min(mtcars$hp)

cat("Coefficient:", round(ex_coeff, 3), "\n")
#> Expected: Coefficient: ~0.075
cat("Offset:", round(ex_offset, 2), "\n")
#> Expected: Offset: ~6.11
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_coeff <- (max(mtcars$mpg) - min(mtcars$mpg)) /
            (max(mtcars$hp) - min(mtcars$hp))
ex_offset <- min(mtcars$mpg) - ex_coeff * min(mtcars$hp)

cat("Coefficient:", round(ex_coeff, 3), "\n")
#> [1] Coefficient: 0.075
cat("Offset:", round(ex_offset, 2), "\n")
#> [1] Offset: 6.11
```

**Explanation:** The coefficient maps the hp range (52-335) onto the mpg range (10.4-33.9). The offset shifts the minimum of hp to align with the minimum of mpg.

</details>

## How do you style a dual-axis plot so readers can tell which axis belongs to which line?

A dual-axis plot without colour-coding is a puzzle. Readers stare at two lines and two y-axes with no way to match them. The fix is to colour the axis titles, labels, and tick marks to match the corresponding line.

Use `theme()` to target the left and right axis elements separately.

```r
p_styled <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "steelblue", linewidth = 0.8) +
  geom_line(aes(y = psavert * coeff + offset), color = "tomato", linewidth = 0.8) +
  scale_y_continuous(
    name = "Unemployed (thousands)",
    sec.axis = sec_axis(~ (. - offset) / coeff, name = "Savings Rate (%)")
  ) +
  labs(x = NULL, title = "US Unemployment vs Personal Savings Rate") +
  theme_minimal() +
  theme(
    axis.title.y.left  = element_text(color = "steelblue", size = 12),
    axis.text.y.left   = element_text(color = "steelblue"),
    axis.title.y.right = element_text(color = "tomato", size = 12),
    axis.text.y.right  = element_text(color = "tomato")
  )

print(p_styled)
#> Dual-axis plot with blue left axis (unemployment) and red right axis (savings)
```

Now each axis visually matches its line. The blue title "Unemployed (thousands)" pairs with the blue line; the red title "Savings Rate (%)" pairs with the red line. This is not optional decoration — it is a readability requirement.

[WARNING]
**Without colour-coding, readers cannot determine which line maps to which axis.** A dual-axis plot missing this step is worse than two separate plots because it actively confuses.

**Try it:** Modify the styled plot above so the right axis uses "darkgreen" instead of "tomato". Change the corresponding `geom_line()` colour to match.

```r
# Try it: change right axis to darkgreen
ex_styled <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "steelblue", linewidth = 0.8) +
  geom_line(aes(y = psavert * coeff + offset), color = "darkgreen", linewidth = 0.8) +
  scale_y_continuous(
    name = "Unemployed (thousands)",
    sec.axis = sec_axis(~ (. - offset) / coeff, name = "Savings Rate (%)")
  ) +
  theme_minimal() +
  theme(
    axis.title.y.left  = element_text(color = "steelblue"),
    axis.text.y.left   = element_text(color = "steelblue"),
    # your code here — style the right axis darkgreen
    axis.title.y.right = element_text(color = "darkgreen"),
    axis.text.y.right  = element_text(color = "darkgreen")
  )

print(ex_styled)
#> Expected: right axis and line both in dark green
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_styled <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "steelblue", linewidth = 0.8) +
  geom_line(aes(y = psavert * coeff + offset), color = "darkgreen", linewidth = 0.8) +
  scale_y_continuous(
    name = "Unemployed (thousands)",
    sec.axis = sec_axis(~ (. - offset) / coeff, name = "Savings Rate (%)")
  ) +
  theme_minimal() +
  theme(
    axis.title.y.left  = element_text(color = "steelblue"),
    axis.text.y.left   = element_text(color = "steelblue"),
    axis.title.y.right = element_text(color = "darkgreen"),
    axis.text.y.right  = element_text(color = "darkgreen")
  )

print(ex_styled)
#> Dual-axis plot with green right axis matching the green savings-rate line
```

**Explanation:** Both `axis.title.y.right` and `axis.text.y.right` must be set to the same colour as the `geom_line()` for the secondary variable.

</details>

## When should you use a secondary axis (and when should you avoid it)?

Dual-axis plots have a bad reputation in the data visualization community, and much of that reputation is earned. The problem is that the visual relationship between two lines depends entirely on the scaling factor you choose — and that choice is arbitrary.

Watch what happens when we change the coefficient. The exact same data tells a completely different story.

```r
# Misleading example: change the coefficient
# Tight scaling — lines appear to move together
coeff_tight <- 500
offset_tight <- min(econ$unemploy) - coeff_tight * min(econ$psavert)

p_mislead <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "steelblue", linewidth = 0.8) +
  geom_line(aes(y = psavert * coeff_tight + offset_tight),
            color = "tomato", linewidth = 0.8) +
  scale_y_continuous(
    name = "Unemployed (thousands)",
    sec.axis = sec_axis(~ (. - offset_tight) / coeff_tight,
                        name = "Savings Rate (%)")
  ) +
  labs(title = "Same data, different coefficient — looks like they move together") +
  theme_minimal()

print(p_mislead)
#> The savings-rate line appears flattened, visually "tracking" unemployment
```

By shrinking the coefficient, the savings-rate line looks nearly flat and appears to follow unemployment. A different coefficient could make them look inversely related. The data has not changed — only the visual framing has.

**When dual axes are appropriate:**

- **Unit conversions** on the same variable (Celsius/Fahrenheit, km/miles, kg/lbs). There is no ambiguity because both axes represent the same thing.
- **Pareto charts** combining counts with cumulative percentages. The two axes have a known mathematical relationship.

**When dual axes mislead:**

- Two unrelated variables (GDP and ice cream sales). The visual correlation is an artifact of scaling.
- Variables with different causal structures. Even if correlated, overlaying them implies a relationship that may not exist.

**Better alternatives:** Use `facet_wrap()` to give each variable its own panel, or use the `patchwork` package to stack separate plots.

[WARNING]
**Changing the scaling factor can make the same data look correlated, uncorrelated, or inversely related.** If the two variables are not unit conversions of each other, consider facets instead.

**Try it:** Create a faceted version of the unemployment/savings plot using `tidyr::pivot_longer()` and `facet_wrap()`. This avoids the dual-axis problem entirely.

```r
# Try it: faceted alternative
econ_long <- data.frame(
  date = rep(econ$date, 2),
  variable = rep(c("Unemployed (thousands)", "Savings Rate (%)"),
                 each = nrow(econ)),
  value = c(econ$unemploy, econ$psavert)
)

ex_facet <- ggplot(econ_long, aes(x = date, y = value)) +
  geom_line(color = "steelblue", linewidth = 0.7) +
  facet_wrap(~ variable, scales = "free_y", ncol = 1) +
  # your code here — add theme_minimal() and a title
  theme_minimal()

print(ex_facet)
#> Expected: two panels stacked vertically, each with its own y-axis
```

<details>
<summary>Click to reveal solution</summary>

```r
econ_long <- data.frame(
  date = rep(econ$date, 2),
  variable = rep(c("Unemployed (thousands)", "Savings Rate (%)"),
                 each = nrow(econ)),
  value = c(econ$unemploy, econ$psavert)
)

ex_facet <- ggplot(econ_long, aes(x = date, y = value)) +
  geom_line(color = "steelblue", linewidth = 0.7) +
  facet_wrap(~ variable, scales = "free_y", ncol = 1) +
  labs(title = "Faceted Alternative to Dual Axes", x = NULL) +
  theme_minimal()

print(ex_facet)
#> Two stacked panels: unemployment on top, savings rate on bottom
```

**Explanation:** `facet_wrap(scales = "free_y")` gives each variable its own y-axis without any arbitrary scaling.

</details>

## What are dup_axis() and secondary x-axes?

Beyond `sec_axis()`, ggplot2 provides `dup_axis()` — a shorthand that mirrors the primary axis on the opposite side without any transformation.

```r
# dup_axis: mirror the y-axis on the right
p_dup <- ggplot(temp_data, aes(x = day, y = temp_c)) +
  geom_line(linewidth = 1, color = "steelblue") +
  scale_y_continuous(
    name = "Temperature (°C)",
    sec.axis = dup_axis(name = "Temperature (°C)")
  ) +
  theme_minimal()

print(p_dup)
#> Line plot with identical y-axes on both left and right sides
```

This is useful for wide plots or presentations where the audience sits far from the screen. Having tick marks on both sides lets readers reference the nearest axis.

You can also add a secondary x-axis. The syntax is identical, but inside `scale_x_continuous()`.

```r
# Secondary x-axis: show row index on bottom, scaled value on top
p_secx <- ggplot(temp_data, aes(x = day, y = temp_c)) +
  geom_line(linewidth = 1, color = "steelblue") +
  scale_x_continuous(
    name = "Day Number",
    sec.axis = sec_axis(~ . + 10, name = "Day of Month (offset by 10)")
  ) +
  theme_minimal()

print(p_secx)
#> Line plot with "Day Number" on the bottom x-axis and offset labels on top
```

The top x-axis shows each day number plus 10. In practice, secondary x-axes are less common but handy for showing a date range alongside an index, or experiment day alongside a calendar date.

[TIP]
**Use dup_axis() when you want the same scale on both sides.** It saves the audience from tracking their eyes across a wide chart to read the axis.

**Try it:** Add a top x-axis that mirrors the bottom x-axis using `dup_axis()` inside `scale_x_continuous()`.

```r
# Try it: mirrored top x-axis
ex_dup_x <- ggplot(temp_data, aes(x = day, y = temp_c)) +
  geom_line(linewidth = 1, color = "steelblue") +
  scale_x_continuous(
    name = "Day",
    sec.axis = dup_axis(name = "Day")
  )
# your code here — add theme_minimal() and print

print(ex_dup_x)
#> Expected: line plot with day labels on both bottom and top x-axes
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_dup_x <- ggplot(temp_data, aes(x = day, y = temp_c)) +
  geom_line(linewidth = 1, color = "steelblue") +
  scale_x_continuous(
    name = "Day",
    sec.axis = dup_axis(name = "Day")
  ) +
  theme_minimal()

print(ex_dup_x)
#> Line plot with mirrored x-axes on bottom and top
```

**Explanation:** `dup_axis()` inside `scale_x_continuous()` mirrors the bottom axis to the top, using the same breaks and labels.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Plotting the second variable without rescaling it

This is the most common error. You add a second `geom_line()` with the raw secondary variable, but both lines share the primary axis scale. One variable dominates the plot or is invisible.

❌ **Wrong:**
```r
# psavert ranges 2-8, unemploy ranges 6000-15000
# psavert line is invisible at the bottom of the plot
p_wrong1 <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "steelblue") +
  geom_line(aes(y = psavert), color = "tomato") +
  scale_y_continuous(
    sec.axis = sec_axis(~ . , name = "Savings Rate (%)")
  ) +
  theme_minimal()

print(p_wrong1)
#> The red line (psavert) is squashed flat at y = 0
```

**Why it is wrong:** `psavert` values (2-8) are plotted on the same scale as `unemploy` (6000-15000). The red line hugs zero.

✅ **Correct:**
```r
# Rescale psavert into the unemploy range
p_fix1 <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "steelblue") +
  geom_line(aes(y = psavert * coeff + offset), color = "tomato") +
  scale_y_continuous(
    name = "Unemployed (thousands)",
    sec.axis = sec_axis(~ (. - offset) / coeff, name = "Savings Rate (%)")
  ) +
  theme_minimal()

print(p_fix1)
#> Both lines use the full vertical space of the plot
```

### Mistake 2: Using a non-monotonic transformation

`sec_axis()` requires a strictly monotonic function. A parabola (`~ .^2`) or sine wave is not monotonic across its full range and will produce incorrect or erroring output.

❌ **Wrong:**
```r
# This may produce warnings or incorrect axis labels
# sec_axis(~ sin(.), name = "Sine") — non-monotonic!
```

**Why it is wrong:** `sin()` is periodic — the same output maps to multiple inputs. ggplot2 cannot invert the transformation to produce correct labels.

✅ **Correct:** Stick to linear transformations (`~ . * a + b`) or strictly monotonic functions like `log()`, `sqrt()`, or `exp()`.

### Mistake 3: Mismatch between data scaling and axis transformation

The formula inside `sec_axis()` must be the exact inverse of the transformation applied to the data. If you scale the data by `* 1000` but set the axis to `~ . / 500`, the right-axis labels will be wrong.

❌ **Wrong:**
```r
# Data scaled by coeff + offset, but axis uses different values
p_mismatch <- ggplot(econ, aes(x = date)) +
  geom_line(aes(y = psavert * 1000 + 5000), color = "tomato") +
  scale_y_continuous(
    sec.axis = sec_axis(~ (. - 3000) / 800, name = "Savings Rate (%)")
  ) +
  theme_minimal()

print(p_mismatch)
#> Right axis labels do NOT match the actual psavert values
```

**Why it is wrong:** The data uses `* 1000 + 5000` but the axis inverse uses `- 3000 / 800`. The numbers on the right axis are meaningless.

✅ **Correct:** Always use the exact inverse. If data = `y * a + b`, then axis = `~ (. - b) / a`.

## Practice Exercises

### Exercise 1: Temperature conversion with airquality

Plot the daily temperature from R's `airquality` dataset (May through September) with Fahrenheit on the left axis and Celsius on the right axis. Colour-code both axes. Add a title.

```r
# Exercise 1: airquality temperature with F and C axes
# Hint: Celsius = (Fahrenheit - 32) / 1.8
# Use sec_axis() and theme() for axis colours

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
aq <- airquality
aq$day_index <- seq_len(nrow(aq))

ex1_p <- ggplot(aq, aes(x = day_index, y = Temp)) +
  geom_line(color = "#E74C3C", linewidth = 0.7) +
  scale_y_continuous(
    name = "Temperature (°F)",
    sec.axis = sec_axis(~ (. - 32) / 1.8, name = "Temperature (°C)")
  ) +
  labs(x = "Day (May-Sep)", title = "NYC Daily Temperature — Dual Unit Axes") +
  theme_minimal() +
  theme(
    axis.title.y.left  = element_text(color = "#E74C3C"),
    axis.text.y.left   = element_text(color = "#E74C3C"),
    axis.title.y.right = element_text(color = "#2E86C1"),
    axis.text.y.right  = element_text(color = "#2E86C1")
  )

print(ex1_p)
#> Line chart: red left axis (F), blue right axis (C)
```

**Explanation:** Since `airquality$Temp` is already in Fahrenheit, the `sec_axis()` transformation converts to Celsius using the standard formula.

</details>

### Exercise 2: Pareto chart from mtcars cylinders

Create a Pareto chart showing the count of cars by cylinder number (bar chart, left axis) and cumulative percentage (line, right axis). Sort bars from most to least frequent.

```r
# Exercise 2: Pareto chart
# Hint: compute cumulative percentage, scale it into the count range
# Use geom_col() for bars and geom_line() + geom_point() for cumulative %

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
library(dplyr)

cyl_data <- mtcars |>
  count(cyl, name = "n") |>
  arrange(desc(n)) |>
  mutate(
    cyl = factor(cyl, levels = cyl),
    cum_pct = cumsum(n) / sum(n) * 100
  )

# Scaling: map 0-100% onto 0-max(n)
ex2_max <- max(cyl_data$n)

ex2_p <- ggplot(cyl_data, aes(x = cyl)) +
  geom_col(aes(y = n), fill = "steelblue", width = 0.6) +
  geom_line(aes(y = cum_pct / 100 * ex2_max, group = 1),
            color = "tomato", linewidth = 1) +
  geom_point(aes(y = cum_pct / 100 * ex2_max),
             color = "tomato", size = 3) +
  scale_y_continuous(
    name = "Count",
    sec.axis = sec_axis(~ . / ex2_max * 100, name = "Cumulative %")
  ) +
  labs(x = "Cylinders", title = "Pareto Chart: Cars by Cylinder Count") +
  theme_minimal() +
  theme(
    axis.title.y.left  = element_text(color = "steelblue"),
    axis.title.y.right = element_text(color = "tomato")
  )

print(ex2_p)
#> Bar chart (blue, left axis) + cumulative line (red, right axis)
```

**Explanation:** The cumulative percentage is rescaled into the count range (`cum_pct / 100 * max_count`). The `sec_axis()` reverses this (`~ . / max_count * 100`) so the right axis shows 0-100%.

</details>

## Putting It All Together

Here is a complete, polished dual-axis plot that combines everything from this tutorial: computed coefficients, colour-coded axes, clear labels, and a professional theme.

```r
# Complete example: US unemployment (left) vs savings rate (right)
# Using economics dataset, post-2000

econ_full <- economics[economics$date >= as.Date("2000-01-01"), ]

# Compute scaling
full_coeff <- (max(econ_full$unemploy) - min(econ_full$unemploy)) /
              (max(econ_full$psavert) - min(econ_full$psavert))
full_offset <- min(econ_full$unemploy) - full_coeff * min(econ_full$psavert)

p_final <- ggplot(econ_full, aes(x = date)) +
  geom_line(aes(y = unemploy), color = "#2C3E50", linewidth = 0.9) +
  geom_line(aes(y = psavert * full_coeff + full_offset),
            color = "#E67E22", linewidth = 0.9) +
  scale_y_continuous(
    name = "Unemployed (thousands)",
    labels = scales::comma,
    sec.axis = sec_axis(
      ~ (. - full_offset) / full_coeff,
      name = "Personal Savings Rate (%)"
    )
  ) +
  scale_x_date(date_labels = "%Y", date_breaks = "2 years") +
  labs(
    title = "US Unemployment vs Personal Savings Rate (2000-2015)",
    x = NULL
  ) +
  theme_minimal(base_size = 13) +
  theme(
    axis.title.y.left  = element_text(color = "#2C3E50", face = "bold"),
    axis.text.y.left   = element_text(color = "#2C3E50"),
    axis.title.y.right = element_text(color = "#E67E22", face = "bold"),
    axis.text.y.right  = element_text(color = "#E67E22"),
    plot.title = element_text(face = "bold", size = 14)
  )

print(p_final)
#> Polished dual-axis chart: dark blue unemployment (left), orange savings (right)
```

This plot uses `scales::comma` for readable left-axis labels, date breaks for a clean x-axis, and bold colour-coded titles. A reader can immediately tell which line belongs to which axis.

## Summary

| Function | Purpose | Best use case |
|---|---|---|
| `sec_axis(~ formula)` | Transform primary axis to create a secondary axis | Unit conversions (C/F, km/mi), Pareto charts |
| `dup_axis()` | Mirror primary axis on the opposite side | Wide plots, presentations |
| Coefficient formula | `a = range(y1) / range(y2)`, `b = min(y1) - a * min(y2)` | Aligning two variables with different scales |
| Axis styling | `theme(axis.title.y.right = element_text(...))` | Colour-coding axes to match lines |
| Avoid dual axes | Use `facet_wrap(scales = "free_y")` instead | Unrelated variables on different scales |

**Key takeaways:**

- `sec_axis()` transforms the primary axis — it does not create an independent second axis
- The transformation must be strictly monotonic
- Always compute the coefficient from your data ranges, never guess
- Colour-code axes to match their lines — this is not optional
- Dual axes are best for unit conversions; for unrelated variables, prefer facets

## FAQ

**Can sec_axis() create a truly independent second y-axis?**

No. ggplot2's design philosophy is that one axis, one scale, one mapping. The secondary axis must be a mathematical function of the primary axis. If you need two completely independent y-axes, use `facet_wrap(scales = "free_y")` or the `patchwork` package to combine two separate plots.

**Does sec_axis() work with date or datetime axes?**

It does, but with restrictions. Datetime axis transformations are limited to addition and subtraction (e.g., shifting time zones with `~ . + 3600`). Nonlinear transformations like `log()` or multiplication will produce errors because they violate the POSIX structure.

**How do I add a secondary axis to a bar chart?**

The same way as with lines. Use `geom_col()` for the primary variable and overlay a `geom_line()` or `geom_point()` for the secondary variable (rescaled). The `sec_axis()` call stays inside `scale_y_continuous()`.

**Can I have both a secondary x-axis and a secondary y-axis on the same plot?**

Yes. Use `sec.axis` inside both `scale_x_continuous()` and `scale_y_continuous()`. Each axis gets its own transformation formula.

## References

1. ggplot2 documentation — sec_axis() reference. [Link](https://ggplot2.tidyverse.org/reference/sec_axis.html)
2. R Graph Gallery — Dual Y axis with R and ggplot2. [Link](https://r-graph-gallery.com/line-chart-dual-Y-axis-ggplot2.html)
3. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). Chapter 10: Scales. [Link](https://ggplot2-book.org/scales-position)
4. Healy, K. — *Data Visualization: A Practical Introduction*. Princeton University Press (2018). Section on dual axes. [Link](https://socviz.co/)
5. Few, S. — "Dual-Scaled Axes in Graphs: Are They Ever the Best Solution?" Visual Business Intelligence Newsletter (2008). [Link](https://www.perceptualedge.com/articles/visual_business_intelligence/dual-scaled_axes.pdf)
6. ggplot2 source code — axis-secondary.R. [Link](https://github.com/tidyverse/ggplot2/blob/main/R/axis-secondary.R)

## Continue Learning

- **[ggplot2 Scales](ggplot2-Scales.html)** — The full guide to controlling axes, colours, sizes, and all scale functions in ggplot2.
- **[ggplot2 Themes](ggplot2-Themes.html)** — Customise fonts, grid lines, backgrounds, and build a reusable house style.
