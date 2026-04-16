---
title: "ggplot2 Log Scale in R: When & How to Transform Axes (with Examples)"
slug: "ggplot2-Log-Scale"
description: "Log scales compress wide-range data and reveal multiplicative patterns. Learn scale_x_log10(), scale_y_log10(), coord_trans(), and how to label log axes."
keywords: "ggplot2 log scale, scale_x_log10, scale_y_log10, coord_trans log, ggplot2 axis transformation, log10 scale R, ggplot2 log axis labels, annotation_logticks, ggplot log transform"
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "FR-ggpl-3"
post_type: "C"
auto_link_terms: "ggplot2 log scale|log scale in ggplot2|scale_x_log10()|scale_y_log10()|coord_trans()|log axis|log transformation ggplot"
auto_link_case_sensitive: false
fr_parent: "ggplot2-Scales.html"
sidebar_section: "Visualization"
sidebar_title: "Log Scale"
difficulty: "Intermediate"
---

# ggplot2 Log Scale in R: When & How to Transform Axes (with Examples)

<p class="lead">A log scale compresses wide-range data so that multiplicative differences appear as equal visual steps. In ggplot2, <code>scale_x_log10()</code>, <code>scale_y_log10()</code>, and <code>coord_trans()</code> each apply log transformations differently.</p>

## Introduction

Real-world data often spans orders of magnitude. GDP ranges from millions to trillions. Diamond prices range from $300 to $19,000. Gene expression values can differ by a factor of 10,000. On a linear axis, small values get crushed into a thin band at the bottom while outliers stretch the axis.

A log scale fixes this by converting multiplicative relationships into additive ones. A tenfold increase always covers the same visual distance, whether you go from 10 to 100 or from 1,000 to 10,000. This makes patterns in skewed data visible.

In this tutorial, you will learn three ggplot2 approaches to log scales, when to pick each one, how to format labels so readers understand your axis, and how to handle the tricky case of zeros and negative values. All code runs directly in your browser.

```r
# Load libraries (used throughout this tutorial)
library(ggplot2)
library(scales)
```

## When Should You Use a Log Scale?

Not every skewed dataset needs a log scale. Log scales are the right choice when the data has a **multiplicative** structure, not just when it looks skewed. Here is how to diagnose it.

A histogram tells you immediately if your data spans orders of magnitude. Let's check diamond prices from the built-in `diamonds` dataset.

```r
# Histogram of diamond prices on a linear scale
ggplot(diamonds, aes(x = price)) +
  geom_histogram(bins = 50, fill = "steelblue", color = "white") +
  labs(title = "Diamond Prices (Linear Scale)",
       x = "Price ($)", y = "Count")
```

The histogram shows a strong right skew. Most diamonds cost under $5,000, but some reach $18,000+. The tail stretches the axis so far that the shape of the bulk is hard to read.

Now apply a log scale to the x-axis. The distribution's shape becomes much clearer.

```r
# Same histogram with log10 x-axis
ggplot(diamonds, aes(x = price)) +
  geom_histogram(bins = 50, fill = "steelblue", color = "white") +
  scale_x_log10() +
  labs(title = "Diamond Prices (Log10 Scale)",
       x = "Price ($, log10)", y = "Count")
```

On the log scale, you can see that diamond prices are roughly log-normal. The bulk sits between $1,000 and $5,000, and the distribution is nearly symmetric after the transformation.

[KEY INSIGHT]
**Log scales reveal multiplicative patterns, not just skewness.** Use a log scale when a doubling or tenfold change matters equally at any level. If the difference between $100 and $200 is as meaningful as $10,000 and $20,000, a log scale is appropriate.

Use a log scale when your data shows any of these signs:

- Values span 2+ orders of magnitude (e.g., 10 to 10,000)
- The relationship is multiplicative (percentages, growth rates, ratios)
- A histogram shows a long right tail that compresses most data points
- You are comparing quantities on fundamentally different scales (e.g., countries by GDP)

**Try it:** Check whether `airquality$Ozone` (with NAs removed) is a good candidate for a log scale. Create a histogram and look for right skew and multi-order-of-magnitude spread.

```r
# Try it: is Ozone data suited for a log scale?
ex_ozone <- na.omit(airquality$Ozone)

# Create a histogram of ex_ozone
# your code here

# Check the range
cat("Range:", range(ex_ozone), "\n")
#> Expected: Range spans roughly 1 to 168
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ozone <- na.omit(airquality$Ozone)
hist(ex_ozone, breaks = 20, main = "Ozone Distribution", col = "steelblue")
#> Shows right-skewed distribution
cat("Range:", range(ex_ozone), "\n")
#> [1]   1 168
cat("Ratio max/min:", max(ex_ozone) / min(ex_ozone), "\n")
#> [1] 168
```

**Explanation:** The range spans about 2 orders of magnitude and the histogram is right-skewed, so a log scale would help visualization.

</details>

## How Does scale_y_log10() Transform Your Plot?

The `scale_y_log10()` function transforms the data **before** any statistical calculations happen. This is the most common and usually the correct choice.

When you add `scale_y_log10()` to a plot, ggplot2 applies log10 to every y-value before computing statistics like `geom_smooth()`, `geom_boxplot()`, or `stat_summary()`. The statistical layers then operate in log-space.

Let's see this with a scatter plot of diamond price versus carat weight.

```r
# Scatter plot with scale_y_log10 + smooth line
ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  geom_smooth(method = "lm", color = "red", linewidth = 1.2) +
  scale_y_log10() +
  labs(title = "Price vs Carat (scale_y_log10)",
       x = "Carat", y = "Price ($, log10 scale)")
```

The smooth line fits a linear model in log-space. This means it captures the multiplicative relationship between carat and price. A straight line in log-space represents exponential growth in the original data.

[TIP]
**scale_x_log10() and scale_y_log10() are shortcuts.** They are equivalent to `scale_x_continuous(trans = "log10")` and `scale_y_continuous(trans = "log10")`. The longer form gives you more control over breaks and labels.

Notice that the y-axis labels still show the original dollar values (1000, 5000, 10000), not the log-transformed values (3, 3.7, 4). ggplot2 back-transforms the labels automatically, which keeps the axis readable.

**Try it:** Apply `scale_x_log10()` to plot `carat` on a log scale too. This double-log plot should make the relationship nearly linear.

```r
# Try it: log-scale both axes
ex_plot <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5)

# Add scale_x_log10() and scale_y_log10()
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_plot <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_x_log10() +
  scale_y_log10() +
  geom_smooth(method = "lm", color = "red") +
  labs(title = "Price vs Carat (both axes log10)")
ex_plot
#> Shows a nearly linear relationship on the log-log plot
```

**Explanation:** On a log-log scale, a power-law relationship (price ~ carat^n) appears as a straight line.

</details>

## How Does coord_trans() Differ from Scale Functions?

The `coord_trans()` function transforms the axes **after** statistical calculations. The statistics are computed on the original (untransformed) data, and only the visual positions are changed.

This distinction matters a lot when you use `geom_smooth()` or any stat layer. Let's compare the two approaches side by side.

```r
# Scale transformation: smooth fits in log-space
p_scale <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  geom_smooth(method = "lm", color = "red", linewidth = 1.2) +
  scale_y_log10() +
  labs(title = "scale_y_log10()",
       subtitle = "Smooth fits in log-space",
       x = "Carat", y = "Price ($)")
p_scale
```

The red line fits a linear model to log10(price) ~ carat. In log-space, this line is straight.

```r
# Coordinate transformation: smooth fits in linear space, then bends
p_coord <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  geom_smooth(method = "lm", color = "blue", linewidth = 1.2) +
  coord_trans(y = "log10") +
  labs(title = "coord_trans(y = 'log10')",
       subtitle = "Smooth fits in linear space, then curves",
       x = "Carat", y = "Price ($)")
p_coord
```

The blue line was fit to the raw price values (linear space), then the coordinate system curved it. The line bends because a linear fit in dollar-space becomes curved when displayed on a log axis.

[WARNING]
**coord_trans can make smoothing lines misleading.** The smooth line was computed on untransformed data, so it represents a different model than what the visual suggests. Use `scale_y_log10()` when you want statistics computed in log-space.

When should you use `coord_trans()` instead? It is useful when you want log-spaced visual positions but need the statistical computations to remain in the original units. For example, `geom_bar()` stacking and `position_dodge()` work more predictably with `coord_trans()`.

Here is a quick decision rule:

| Scenario | Use |
|---|---|
| Scatter + smooth in log-space | `scale_y_log10()` |
| Bar chart with log-spaced axis | `coord_trans(y = "log10")` |
| Boxplot comparing groups on log scale | `scale_y_log10()` |
| Need original-unit axis labels | Both work (auto back-transform) |

**Try it:** Create a scatter of `carat` vs `price` with `coord_trans()` applied to both x and y axes. Compare how it looks to the scale version.

```r
# Try it: coord_trans on both axes
ex_coord <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5)

# Add coord_trans(x = "log10", y = "log10")
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_coord <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  coord_trans(x = "log10", y = "log10") +
  labs(title = "Both axes via coord_trans()")
ex_coord
#> Points look identical to scale version, but stats differ
```

**Explanation:** The point positions look the same because both methods apply log10 to the coordinates. The difference only shows when you add statistical layers.

</details>

## How Do You Label Log-Scaled Axes Clearly?

Default log-scale labels in ggplot2 show the original values (100, 1000, 10000), which is usually fine. But sometimes you need exponent notation, formatted numbers, or custom breaks to make the axis easier to read.

The `scales` package provides labeling functions that pair perfectly with log scales. Let's start with exponent notation using `label_log()`.

```r
# Exponent labels: 10^2, 10^3, 10^4
ggplot(diamonds, aes(x = price)) +
  geom_histogram(bins = 50, fill = "steelblue", color = "white") +
  scale_x_log10(
    breaks = c(100, 1000, 10000),
    labels = label_log()
  ) +
  labs(title = "Exponent Labels with label_log()",
       x = "Price", y = "Count")
```

The axis now shows 10^2, 10^3, and 10^4. This is standard for scientific publications where readers expect powers-of-ten notation.

For a general audience, comma-formatted labels are more readable. Use `label_comma()` or `label_dollar()` to keep the original units.

```r
# Dollar-formatted labels on a log scale
ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_log10(
    breaks = c(500, 1000, 2000, 5000, 10000),
    labels = label_dollar()
  ) +
  labs(title = "Dollar Labels on Log Scale",
       x = "Carat", y = "Price")
```

The y-axis shows $500, $1,000, $2,000, $5,000, $10,000. The spacing between labels reflects the log scale, but the numbers are in familiar dollar format.

For log scales, adding minor tick marks between the major gridlines helps readers estimate intermediate values. Use `guide_axis_logticks()` to add these.

```r
# Log tick marks on the y-axis
ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_log10(
    labels = label_dollar()
  ) +
  guides(y = guide_axis_logticks()) +
  labs(title = "Log Ticks with guide_axis_logticks()",
       x = "Carat", y = "Price")
```

The minor ticks show the characteristic log-scale pattern: tightly spaced near the top of each decade, wider near the bottom. This visual cue tells readers the axis is not linear.

[TIP]
**Use label_comma() when your audience is not math-savvy.** Exponent notation (10^3) is standard in scientific papers, but comma-formatted labels ($1,000) are better for business dashboards and general audiences.

**Try it:** Create a scatter plot of `diamonds` price vs carat with a log10 y-axis. Format the y-axis labels as dollars and set breaks at 300, 1000, 3000, and 10000.

```r
# Try it: custom dollar labels on log scale
ex_labeled <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5)

# Add scale_y_log10 with breaks and label_dollar()
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_labeled <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_log10(
    breaks = c(300, 1000, 3000, 10000),
    labels = label_dollar()
  ) +
  labs(x = "Carat", y = "Price")
ex_labeled
#> Y-axis shows $300, $1,000, $3,000, $10,000 with log spacing
```

**Explanation:** `label_dollar()` adds the "$" prefix and comma separators. The `breaks` argument controls which values get labeled.

</details>

## How Do You Handle Zeros and Negative Values on a Log Scale?

Log transformations have a mathematical limitation: log(0) is negative infinity and log of a negative number is undefined. When your data contains zeros or negative values, `scale_y_log10()` silently removes those points and prints a warning.

This is a common problem with count data, where zero counts are meaningful. Let's see what happens.

```r
# Data with zeros
df_zeros <- data.frame(
  category = LETTERS[1:8],
  count = c(0, 3, 15, 120, 0, 800, 45, 5000)
)

# Bar chart with scale_y_log10 — zeros vanish
ggplot(df_zeros, aes(x = category, y = count)) +
  geom_col(fill = "steelblue") +
  scale_y_log10() +
  labs(title = "Zeros Disappear on Log Scale",
       x = "Category", y = "Count (log10)")
```

Categories A and E have zero counts, so they disappear entirely. The warning message "Transformation introduced infinite values" tells you what happened, but it is easy to miss.

The `pseudo_log_trans()` function from the `scales` package solves this. It behaves like a log scale for large values but transitions smoothly to a linear scale near zero.

```r
# pseudo_log_trans handles zeros gracefully
ggplot(df_zeros, aes(x = category, y = count)) +
  geom_col(fill = "steelblue") +
  scale_y_continuous(trans = pseudo_log_trans(base = 10)) +
  labs(title = "Pseudo-Log Scale Preserves Zeros",
       x = "Category", y = "Count (pseudo-log10)")
```

Now all eight categories are visible, including the zeros. The axis transitions smoothly from linear near zero to logarithmic for larger values.

[WARNING]
**Silently dropping zeros can bias your visualization.** Always check for zeros in your data before applying a log scale. Use `sum(data$value == 0)` to count them.

Another approach is to add a small constant before taking the log. This is called the "log plus one" or log1p transformation.

```r
# log1p approach: add 1 before log
ggplot(df_zeros, aes(x = category, y = count + 1)) +
  geom_col(fill = "coral") +
  scale_y_log10() +
  labs(title = "log(count + 1) Approach",
       subtitle = "Zeros become log10(1) = 0",
       x = "Category", y = "Count + 1 (log10)")
```

Adding 1 shifts all values up so that zeros become 1, and log10(1) = 0. This is simple but changes the interpretation: the axis no longer shows the true counts.

| Method | Handles zeros? | Handles negatives? | Axis interpretation |
|---|---|---|---|
| `scale_y_log10()` | No (drops them) | No | True log10 values |
| `pseudo_log_trans()` | Yes | Yes | Approximate log, linear near 0 |
| `log(value + 1)` | Yes | No | Shifted values |

**Try it:** Create a bar chart of `df_zeros` using `pseudo_log_trans(base = 10)` and add `label_comma()` to the y-axis so the labels show original counts.

```r
# Try it: pseudo-log with readable labels
ex_pseudo <- ggplot(df_zeros, aes(x = category, y = count)) +
  geom_col(fill = "steelblue")

# Add scale_y_continuous with pseudo_log_trans and label_comma
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_pseudo <- ggplot(df_zeros, aes(x = category, y = count)) +
  geom_col(fill = "steelblue") +
  scale_y_continuous(
    trans = pseudo_log_trans(base = 10),
    labels = label_comma()
  ) +
  labs(x = "Category", y = "Count")
ex_pseudo
#> All bars visible, y-axis shows 0, 3, 15, 120, 800, 5,000
```

**Explanation:** `pseudo_log_trans()` keeps zeros visible, and `label_comma()` formats the axis labels as readable numbers.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Using coord_trans when you want log-space statistics

When you add a smooth line with `coord_trans()`, the model fits linear data, not log-transformed data. The curve you see is misleading.

Wrong:
```r
# coord_trans: smooth is fit on RAW data then visually bent
p_wrong <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  geom_smooth(method = "lm") +
  coord_trans(y = "log10")
p_wrong
```

**Why it is wrong:** The linear model was fit to raw prices (not log-prices). The line curves only because of the coordinate warp, not because the model learned a log relationship.

Correct:
```r
# scale_y_log10: smooth fits log(price) ~ carat
p_right <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  geom_smooth(method = "lm") +
  scale_y_log10()
p_right
```

### Mistake 2: Forgetting that zeros produce warnings and blank points

When data contains zeros and you use `scale_y_log10()`, ggplot2 silently removes those points.

Wrong:
```r
# Zeros are silently dropped
df_test <- data.frame(x = 1:5, y = c(10, 0, 100, 0, 1000))
ggplot(df_test, aes(x, y)) +
  geom_point(size = 3) +
  geom_line() +
  scale_y_log10() +
  labs(title = "Where did points 2 and 4 go?")
#> Warning: Transformation introduced infinite values
```

**Why it is wrong:** Two data points vanish without an obvious visual cue. Readers see three points instead of five.

Correct:
```r
# Use pseudo_log_trans to keep zeros visible
ggplot(df_test, aes(x, y)) +
  geom_point(size = 3) +
  geom_line() +
  scale_y_continuous(trans = pseudo_log_trans(base = 10)) +
  labs(title = "All 5 points visible with pseudo-log")
```

### Mistake 3: Using xlim() or ylim() to set limits on a log-scaled plot

The `xlim()` and `ylim()` functions replace the scale, which removes `scale_y_log10()`. Use `coord_cartesian()` or set `limits` inside the scale function.

Wrong:
```r
# ylim() replaces scale_y_log10 — log scale is lost!
p_broken <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_log10() +
  ylim(500, 15000)
# Warning: Scale for y is already present, replacing...
cat("ylim() removed your log scale!\n")
```

**Why it is wrong:** `ylim()` creates a new linear scale that replaces your `scale_y_log10()`. You lose the log transformation entirely.

Correct:
```r
# Set limits inside scale_y_log10
ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_log10(limits = c(500, 15000)) +
  labs(title = "Correct: limits inside scale_y_log10()")
```

### Mistake 4: Mixing log10 and natural log without realizing

`scale_y_log10()` uses base 10, but `log_trans()` defaults to natural log (base e). Mixing them leads to confusing axis labels.

Wrong:
```r
# This uses natural log, not log10
ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_continuous(trans = "log") +
  labs(title = "Natural log scale (not log10!)",
       y = "Price (log scale)")
cat("trans = 'log' uses base e (2.718...), not base 10\n")
```

**Why it is wrong:** The labels show values like 403, 1097, 2981 which are not round numbers in base 10. Readers expect 100, 1000, 10000 on a "log scale" axis.

Correct:
```r
# Explicitly use log10
ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.1, size = 0.5) +
  scale_y_log10() +
  labs(title = "Base-10 log scale (standard)",
       y = "Price (log10 scale)")
```

## Practice Exercises

### Exercise 1: Full scatter plot with log axes and professional labels

Create a scatter plot of `diamonds` using `carat` on the x-axis and `price` on the y-axis. Apply log10 scales to both axes. Add a linear smooth line. Format the y-axis with dollar labels and the x-axis with `label_number()`. Add log tick marks to the y-axis using `guide_axis_logticks()`.

```r
# Exercise 1: professional log-log scatter
# Hint: combine scale_x_log10, scale_y_log10, label_dollar, guide_axis_logticks

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_scatter <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_point(alpha = 0.05, size = 0.5, color = "steelblue") +
  geom_smooth(method = "lm", color = "red", linewidth = 1) +
  scale_x_log10(labels = label_number(accuracy = 0.1)) +
  scale_y_log10(labels = label_dollar()) +
  guides(y = guide_axis_logticks()) +
  labs(
    title = "Diamond Price vs Carat (Log-Log Scale)",
    x = "Carat (log10)", y = "Price"
  ) +
  theme_minimal()
my_scatter
#> Linear relationship on log-log scale with dollar labels and log ticks
```

**Explanation:** `scale_x_log10()` and `scale_y_log10()` transform both axes. `label_dollar()` formats the y-axis as currency. `guide_axis_logticks()` adds minor tick marks showing the log spacing. The linear smooth in log-log space captures the power-law relationship.

</details>

### Exercise 2: Visualize data with zeros using pseudo-log and compare

Create a data frame with 10 categories and counts that include at least two zeros and values ranging from 0 to 50,000. Make two bar charts side by side: one with `scale_y_log10()` (showing the zero problem) and one with `pseudo_log_trans()` (showing the fix). Give each plot an informative title.

```r
# Exercise 2: compare log10 vs pseudo-log on data with zeros
# Hint: create df with zeros, use pseudo_log_trans(base = 10)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_data <- data.frame(
  item = LETTERS[1:10],
  sales = c(0, 50, 200, 0, 3000, 15000, 500, 50000, 80, 0)
)

my_log10 <- ggplot(my_data, aes(x = item, y = sales)) +
  geom_col(fill = "coral") +
  scale_y_log10() +
  labs(title = "scale_y_log10: zeros vanish", y = "Sales")

my_pseudo <- ggplot(my_data, aes(x = item, y = sales)) +
  geom_col(fill = "steelblue") +
  scale_y_continuous(
    trans = pseudo_log_trans(base = 10),
    labels = label_comma()
  ) +
  labs(title = "pseudo_log_trans: zeros preserved", y = "Sales")

my_log10
my_pseudo
#> First plot: 3 bars missing (zeros). Second plot: all 10 bars visible.
```

**Explanation:** `scale_y_log10()` drops the three zero-count bars because log10(0) is undefined. `pseudo_log_trans()` transitions smoothly near zero, keeping all bars visible.

</details>

## Putting It All Together

Here is a complete, polished example that starts with raw data, diagnoses whether a log scale is needed, applies it, and formats the output for publication.

```r
# Step 1: Load data and check the range
data(diamonds)
cat("Price range:", range(diamonds$price), "\n")
#> Price range: 326 18823
cat("Ratio max/min:", round(max(diamonds$price) / min(diamonds$price)), "\n")
#> Ratio max/min: 58
cat("Spans ~2 orders of magnitude — log scale is appropriate.\n")
```

The price range spans a factor of 58, nearly two orders of magnitude. A log scale will help.

```r
# Step 2: Build the plot with log scale, labels, and ticks
final_plot <- ggplot(diamonds, aes(x = carat, y = price, color = cut)) +
  geom_point(alpha = 0.15, size = 0.8) +
  geom_smooth(method = "lm", se = FALSE, linewidth = 0.8) +
  scale_y_log10(
    breaks = c(500, 1000, 2000, 5000, 10000),
    labels = label_dollar()
  ) +
  scale_x_log10(
    breaks = c(0.3, 0.5, 1, 2, 3, 5),
    labels = label_number(accuracy = 0.1)
  ) +
  guides(y = guide_axis_logticks()) +
  scale_color_brewer(palette = "Set2") +
  labs(
    title = "Diamond Price vs Carat by Cut Quality",
    subtitle = "Log-log scale reveals parallel power-law trends across cut grades",
    x = "Carat (log10 scale)",
    y = "Price",
    color = "Cut"
  ) +
  theme_minimal(base_size = 12) +
  theme(legend.position = "bottom")
final_plot
```

Each cut quality follows a roughly parallel trend on the log-log scale. This means the price-carat power-law relationship holds across all cut grades, with better cuts sitting at a higher intercept.

[NOTE]
**The log-log relationship here reveals a power law.** If log(price) ~ a * log(carat) + b, then price ~ carat^a. The slopes of these lines estimate the exponent of the power law for each cut grade.

## Summary

| Method | When to use | Effect on stats | Handles zeros? |
|---|---|---|---|
| `scale_y_log10()` | Most common choice. Scatter, boxplot, histogram with log-space stats | Transforms before stat layers | No |
| `scale_y_continuous(trans = "log10")` | Same as above, with more control over breaks/labels | Same as scale_y_log10 | No |
| `coord_trans(y = "log10")` | Bar charts, stacked geoms, when stats must stay in original units | Visual only, stats unchanged | No |
| `pseudo_log_trans()` | Data with zeros or negative values | Linear near 0, log for large values | Yes |
| `log(value + 1)` | Quick fix for zeros (shifts interpretation) | Manual pre-transformation | Zeros only |

Key takeaways:

- Use a log scale when data spans 2+ orders of magnitude or has multiplicative structure
- `scale_y_log10()` is the default choice. It transforms data before statistics are calculated.
- `coord_trans()` only changes the visual coordinates. Statistics are computed on raw data.
- Always check for zeros before applying a log scale. Use `pseudo_log_trans()` if zeros matter.
- Format labels with `label_dollar()`, `label_comma()`, or `label_log()` depending on your audience
- Add `guide_axis_logticks()` for minor tick marks that signal "this is a log axis"

## FAQ

### Can I use log2 or natural log instead of log10?

Yes. Use `scale_y_continuous(trans = "log2")` for base-2 or `scale_y_continuous(trans = "log")` for natural log (base e). You can also use `log_trans(base = 2)` from the `scales` package. Base-10 is the most common because readers intuit powers of 10 easily.

### What happens to zero values with scale_y_log10()?

ggplot2 removes them and prints the warning "Transformation introduced infinite values in continuous y transformation." The points vanish from the plot. Use `pseudo_log_trans()` or add a small constant to keep them visible.

### Should I log-transform the data column or the axis?

Transform the axis with `scale_y_log10()`, not the data. Axis transformation keeps the original values in your data frame and shows readable back-transformed labels. If you use `mutate(log_price = log10(price))`, the axis labels show log values (2, 3, 4) instead of dollars.

### How do I add minor grid lines on a log scale?

Add `guide_axis_logticks()` via the `guides()` function: `guides(y = guide_axis_logticks())`. For minor grid lines specifically, set `minor_breaks` in the scale function: `scale_y_log10(minor_breaks = c(200, 500, 2000, 5000))`.

## References

1. Wickham, H. — *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). Chapter 15: Scales. [Link](https://ggplot2-book.org/scales-other.html)
2. ggplot2 documentation — `scale_continuous()` reference. [Link](https://ggplot2.tidyverse.org/reference/scale_continuous.html)
3. ggplot2 documentation — `coord_trans()` reference. [Link](https://ggplot2.tidyverse.org/reference/coord_trans.html)
4. ggplot2 documentation — `guide_axis_logticks()` reference. [Link](https://ggplot2.tidyverse.org/reference/guide_axis_logticks.html)
5. scales package documentation — transformation functions. [Link](https://scales.r-lib.org/reference/index.html)
6. Heiss, A. — "How to use natural and base 10 log scales in ggplot2" (2022). [Link](https://www.andrewheiss.com/blog/2022/12/08/log10-natural-log-scales-ggplot/)

## Continue Learning

- **[ggplot2 Scales](ggplot2-Scales.html)** — The full reference on controlling axes, colors, sizes, and all scale types in ggplot2
- **[ggplot2 Themes](ggplot2-Themes.html)** — Customize fonts, colors, grid lines, and overall plot appearance after setting up your scales
