---
title: "ggplot2 Distribution Charts: Histograms, Density, Boxplots, When to Use Each"
slug: "ggplot2-Distribution-Charts"
description: "Master ggplot2 distribution charts: histogram, density, boxplot, and violin, with guidance on bin widths, bandwidth tuning, and when each type misleads."
keywords: "ggplot2 histogram, ggplot2 density plot, ggplot2 boxplot, geom_histogram, geom_density, geom_boxplot, geom_violin, distribution plot R, ggplot2 distribution"
auto_link_terms: "ggplot2 distribution charts|geom_histogram()|geom_density()|geom_boxplot()|geom_violin()|histogram in R|density plot ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-07"
curriculum_id: "1.3.4"
post_type: C
sidebar_section: "Visualization"
sidebar_title: "Distribution Charts"
sidebar_order: 13
difficulty: "Intermediate"
---

# ggplot2 Distribution Charts: Histograms, Density, Boxplots, When to Use Each

<p class="lead">Distribution charts show how your data is spread, where values cluster, thin out, and whether outliers exist. ggplot2 provides four main types: <code>geom_histogram()</code>, <code>geom_density()</code>, <code>geom_boxplot()</code>, and <code>geom_violin()</code>.</p>

## Introduction

Before you run a single statistical test, you should look at your data's distribution. Is it symmetric or skewed? Does it have one peak or two? Are there outliers pulling the mean away from the median? These questions all have visual answers, and ggplot2 gives you four powerful tools to find them.

The tricky part is picking the right one. Each chart type reveals different aspects of a distribution, and each can mislead you if used carelessly. A histogram hides its shape behind arbitrary bin choices. A boxplot compresses everything into five numbers, missing bimodality entirely. A density plot smooths away sharp features. Understanding the trade-offs is what separates exploratory analysis done well from analysis done fast.

In this tutorial you'll work with a consistent dataset throughout, building each chart type progressively. All four charts share the same WebR session, so variables from earlier blocks are available in later ones. By the end you'll have a practical decision framework, know how to tune the key parameters, and understand exactly when each chart type can mislead you.

![Decision guide: which distribution chart fits your situation](screenshots/ggplot2-Distribution-Charts-chart-decision.webp)
*Figure 1: Decision guide, which distribution chart fits your situation.*

[NOTE]
**This post covers single-variable distribution charts.** For comparing distributions across many groups simultaneously, see ridgeline plots (`ggridges`) in the Further Reading section. For scatter plots that reveal bivariate distributions, see the ggplot2 Scatter Plots tutorial.

## What Does `geom_histogram()` Show, and How Do You Choose `binwidth`?

A histogram splits your variable into equal-width bins and counts how many observations fall into each. The height of each bar shows frequency (or density if you set `y = after_stat(density)`). It's the most direct way to see shape: unimodal vs bimodal, symmetric vs skewed, light vs heavy tails.

The catch is that the shape you see depends entirely on `binwidth`. Too wide and you lose structure; too narrow and noise dominates. There's no universally correct answer, you need to try a few values.

Let's start by loading ggplot2 and creating a focused subset of the built-in `diamonds` dataset. We'll use price for most examples, and cut for grouping.

```r
# Load ggplot2 and prepare data
library(ggplot2)

# Use a random 2000-row sample for speed
set.seed(101)
diamonds_sm <- diamonds[sample(nrow(diamonds), 2000), ]
cat("Rows:", nrow(diamonds_sm), "| Price range:", min(diamonds_sm$price), "to", max(diamonds_sm$price), "\n")
#> Rows: 2000 | Price range: 340 to 18795
```

Now let's build a histogram and experiment with `binwidth`. Pay attention to how the story changes.

```r
# Histogram with three different binwidths to show the effect
p_hist_narrow <- ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(binwidth = 200, fill = "#4B6FA5", colour = "white") +
  labs(title = "binwidth = 200 (too narrow?)", x = "Price (USD)", y = "Count")

p_hist_wide <- ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(binwidth = 1000, fill = "#4B6FA5", colour = "white") +
  labs(title = "binwidth = 1000 (just right?)", x = "Price (USD)", y = "Count")

# Print the wider binwidth version
print(p_hist_wide)
#> [Plot: right-skewed distribution peaking around $1000-2000, long tail to $18000]
```

The right-skewed distribution is clear: most diamonds are priced under $3,000, with a long tail of expensive stones. The spike near $5,000 is a real feature, it shows up with binwidth = 200 too. With binwidth = 5,000 it disappears into noise.

[TIP]
**Start with `bins = 30` (ggplot2's default) and adjust.** If the histogram looks jagged, double the binwidth. If it looks like a single blob, halve it. The goal is to reveal structure without manufacturing noise.

**Try it:** Change `binwidth` to `500` and then `2000` in the histogram above. At which value does the spike around $5,000 first disappear?

```r
# Try it: experiment with binwidth
ex_hist <- ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(binwidth = 500, fill = "#E07B54", colour = "white") +  # change me
  labs(x = "Price (USD)", y = "Count")
# your code here: print(ex_hist)
#> Expected: visible spike around 4000-5000 with binwidth=500, gone with binwidth=2000
```

<details>
<summary>Click to reveal solution</summary>

```r
# binwidth = 500: spike visible
ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(binwidth = 500, fill = "#E07B54", colour = "white") +
  labs(title = "binwidth = 500", x = "Price (USD)", y = "Count")

# binwidth = 2000: spike disappears
ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(binwidth = 2000, fill = "#E07B54", colour = "white") +
  labs(title = "binwidth = 2000 — spike gone", x = "Price (USD)", y = "Count")
```

**Explanation:** The spike around $5,000 is a real feature of diamond pricing. At binwidth = 500 it's still visible; at binwidth = 2000 the bar spans $4,000–$6,000 and merges it into the surrounding bars.

</details>

## What Does `geom_density()` Show, and What Does `adjust` Control?

A density plot is a smoothed version of a histogram. Instead of counting observations in bins, it estimates the underlying probability density function using a kernel (usually Gaussian). The result is a continuous curve that shows relative likelihood at each value.

The key parameter is `adjust`, which scales the automatic bandwidth. `adjust = 1` (default) is the standard Silverman bandwidth. `adjust = 0.5` gives a tighter fit; `adjust = 2` gives a smoother curve. Unlike `binwidth`, there's no "frequency" on the y-axis, values represent density, not count.

```r
# Density plot with different adjust values
p_density <- ggplot(diamonds_sm, aes(x = price)) +
  geom_density(adjust = 1, fill = "#4B6FA5", alpha = 0.4, colour = "#4B6FA5") +
  geom_density(adjust = 0.5, colour = "#E07B54", linewidth = 1, fill = NA) +
  labs(title = "Density: adjust = 1 (filled) vs 0.5 (orange outline)",
       x = "Price (USD)", y = "Density")
print(p_density)
#> [Plot: two curves — smoother filled one and more wiggly orange one, both right-skewed]
```

The default curve (adjust = 1) reveals the right skew and the slight shoulder around $5,000. The tighter curve (adjust = 0.5) shows that shoulder more clearly as a distinct bump. If your data is truly multimodal, a lower adjust can reveal the modes that a default density plot smooths away.

Now here's a powerful combination: overlay the density curve on a histogram to get both exact counts and the smoothed shape. The trick is to use `y = after_stat(density)` on the histogram so both layers share the same y-scale.

```r
# Overlay: histogram + density curve
p_overlay <- ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(aes(y = after_stat(density)), binwidth = 500,
                 fill = "#4B6FA5", alpha = 0.5, colour = "white") +
  geom_density(adjust = 1, colour = "#E07B54", linewidth = 1.2) +
  labs(title = "Histogram + density overlay",
       x = "Price (USD)", y = "Density")
print(p_overlay)
#> [Plot: grey histogram bars with orange density curve overlaid, same y-axis scale]
```

The overlay is ideal for reports: it gives readers the raw data feel of a histogram with the smooth shape of a density curve.

[KEY INSIGHT]
**Density plots can suggest precision that doesn't exist.** If your dataset has 50 rows, the smooth curve implies far more certainty about the distribution's shape than the data supports. For small samples (n < 200), histograms are more honest; density plots are better suited to larger datasets.

**Try it:** Change `adjust` to `0.25` in `geom_density()`. How many peaks appear in the price distribution?

```r
# Try it: very tight bandwidth — what structure is revealed?
ex_density <- ggplot(diamonds_sm, aes(x = price)) +
  geom_density(adjust = 0.25, fill = "#6BAE6E", alpha = 0.4) +  # your code here: change adjust
  labs(x = "Price (USD)", y = "Density")
print(ex_density)
#> Expected: multiple peaks visible — some real, some noise artefacts
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_density <- ggplot(diamonds_sm, aes(x = price)) +
  geom_density(adjust = 0.25, fill = "#6BAE6E", alpha = 0.4) +
  labs(title = "adjust = 0.25 — many peaks", x = "Price (USD)", y = "Density")
print(ex_density)
```

**Explanation:** At adjust = 0.25, you see 5–10+ peaks. Most are noise artefacts caused by oversmoothing in reverse (undersmoothing). The main lesson: very low adjust values pick up random variation as if it were structure.

</details>

## How Do Boxplots Summarise a Distribution, and When Do They Mislead?

A boxplot compresses your entire distribution into five numbers: minimum (or lower whisker), first quartile (Q1), median, third quartile (Q3), and maximum (or upper whisker). Points beyond the whiskers are plotted individually as outliers.

![Anatomy of a boxplot, each element and what it represents](screenshots/ggplot2-Distribution-Charts-chart-anatomy.webp)
*Figure 2: Anatomy of a boxplot, the five summary statistics and how outliers are identified.*

Boxplots excel at comparing multiple groups side by side. The box covers the interquartile range (IQR = Q3 − Q1), which contains the middle 50% of your data. The whiskers extend to 1.5× IQR. Any point beyond that is an outlier.

```r
# Grouped boxplot: price by cut quality
p_box <- ggplot(diamonds_sm, aes(x = cut, y = price, fill = cut)) +
  geom_boxplot(alpha = 0.7, outlier.alpha = 0.3, outlier.size = 1) +
  scale_fill_brewer(palette = "Blues") +
  labs(title = "Diamond price by cut quality",
       x = "Cut", y = "Price (USD)") +
  theme_minimal() +
  theme(legend.position = "none")
print(p_box)
#> [Plot: 5 boxplots side by side — Fair cut has highest median price, ideal has lower median]
```

Notice something counterintuitive: Fair cut diamonds appear to have a *higher* median price than Ideal cut. This is actually a real phenomenon driven by confounding, Fair cut diamonds tend to be larger (more carats), which drives price up. Boxplots surface this kind of puzzle quickly.

[WARNING]
**Boxplots hide multimodality completely.** A distribution with two peaks separated by a valley has the same boxplot as a unimodal distribution with the same quartiles. Always supplement boxplots with a histogram or violin plot when you suspect complex shapes.

**Try it:** Replace `cut` with `color` in the boxplot above. Which color grade has the highest median price?

```r
# Try it: boxplot by diamond color grade
ex_box <- ggplot(diamonds_sm, aes(x = color, y = price, fill = color)) +
  geom_boxplot(alpha = 0.7) +
  # your code here: add labs() with title and axis labels
  theme_minimal() +
  theme(legend.position = "none")
print(ex_box)
#> Expected: boxplots for colors D through J, J tends to have highest median
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_box <- ggplot(diamonds_sm, aes(x = color, y = price, fill = color)) +
  geom_boxplot(alpha = 0.7, outlier.alpha = 0.3) +
  scale_fill_brewer(palette = "Purples") +
  labs(title = "Diamond price by color grade", x = "Color", y = "Price (USD)") +
  theme_minimal() +
  theme(legend.position = "none")
print(ex_box)
```

**Explanation:** Color J (worst grade) tends to have the highest median price, again driven by carat size. This counterintuitive pattern illustrates why boxplots are great for surfacing anomalies that demand further investigation.

</details>

## When Should You Use `geom_violin()` Over a Boxplot?

A violin plot is a boxplot that grew a density plot on each side. Where a boxplot shows you five numbers, a violin shows you the full shape of the distribution. Thick parts of the violin have many observations; thin parts have few. You can embed a boxplot inside a violin to get both the shape detail and the summary statistics.

Violins are ideal when you have at least 100 observations per group and you suspect or want to reveal multimodality. They can be misleading with very small groups because the kernel density estimate implies a smooth shape that the data doesn't actually support.

```r
# Violin plot with embedded mini-boxplot
p_violin <- ggplot(diamonds_sm, aes(x = cut, y = price, fill = cut)) +
  geom_violin(alpha = 0.6, trim = FALSE) +
  geom_boxplot(width = 0.1, fill = "white", outlier.size = 1, alpha = 0.8) +
  scale_fill_brewer(palette = "Set2") +
  labs(title = "Diamond price distribution by cut",
       subtitle = "Violin shape + embedded boxplot",
       x = "Cut", y = "Price (USD)") +
  theme_minimal() +
  theme(legend.position = "none")
print(p_violin)
#> [Plot: 5 violins, each with embedded white boxplot — reveals bimodal shape in some groups]
```

The violin reveals something the boxplot hides: several cut categories have a bimodal distribution, a peak of low-priced small diamonds and a peak of higher-priced larger ones. The boxplot would show the same median and IQR for a bimodal and unimodal distribution. The violin doesn't let that slide.

[KEY INSIGHT]
**The violin is better than the boxplot almost every time you have enough data.** The only reason to prefer a boxplot is when you're comparing more than 8-10 groups (violins get cramped) or when your audience is unfamiliar with violin plots (boxplots are more widely understood in non-statistical audiences).

**Try it:** Add `scale_y_log10()` to the violin plot above to handle the extreme right skew. Does the bimodal shape become clearer or less clear on a log scale?

```r
# Try it: violin plot on log scale
ex_violin <- ggplot(diamonds_sm, aes(x = cut, y = price, fill = cut)) +
  geom_violin(alpha = 0.6, trim = FALSE) +
  geom_boxplot(width = 0.1, fill = "white", outlier.size = 0.8) +
  scale_fill_brewer(palette = "Set2") +
  # your code here: add scale_y_log10()
  labs(x = "Cut", y = "Price (log scale)") +
  theme_minimal() + theme(legend.position = "none")
print(ex_violin)
#> Expected: more symmetric violins, bimodal peaks more visible
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_violin <- ggplot(diamonds_sm, aes(x = cut, y = price, fill = cut)) +
  geom_violin(alpha = 0.6, trim = FALSE) +
  geom_boxplot(width = 0.1, fill = "white", outlier.size = 0.8) +
  scale_fill_brewer(palette = "Set2") +
  scale_y_log10(labels = scales::dollar) +
  labs(title = "Price by cut (log scale)", x = "Cut", y = "Price (log USD)") +
  theme_minimal() + theme(legend.position = "none")
print(ex_violin)
```

**Explanation:** Log scale compresses the right tail and stretches the left, making the bimodal structure even more visible. For right-skewed price/income data, log scale almost always reveals more structure than the raw scale.

</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting that `geom_histogram()` default bins may hide structure

❌ **Wrong:**
```r
ggplot(diamonds_sm, aes(x = price)) + geom_histogram()
#> `stat_bin()` using `bins = 30`. Pick better value with `binwidth`.
```

**Why it's wrong:** The default 30 bins may be too coarse for your data range. The warning is ggplot2's way of telling you to think about this, but many users ignore it.

✅ **Correct:**
```r
ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(binwidth = 500, colour = "white") +
  labs(x = "Price (USD)", y = "Count")
```

### Mistake 2: Using density plots on small samples

❌ **Wrong:** Using `geom_density()` on a dataset with n = 40, presenting the smooth curve as if it were reliable.

**Why it's wrong:** With small samples, the kernel density estimate is highly sensitive to individual data points. The curve implies smooth structure that isn't there.

✅ **Correct:** Use `geom_histogram()` for n < 200. If you must use density, add a rug plot (`geom_rug()`) to show where the actual data points are:
```r
ggplot(small_df, aes(x = value)) +
  geom_density(fill = "#4B6FA5", alpha = 0.4) +
  geom_rug(alpha = 0.5) +
  labs(x = "Value", y = "Density")
```

### Mistake 3: Comparing distributions across groups with separate histograms

❌ **Wrong:** Making four separate `geom_histogram()` plots, one per group, and eyeballing the comparison.

✅ **Correct:** Use `facet_wrap()` with free y-scales if counts differ, or use `geom_density()` with `fill = group, alpha = 0.3` for overlapping densities:
```r
ggplot(diamonds_sm, aes(x = price, fill = cut)) +
  geom_density(alpha = 0.3) +
  labs(x = "Price (USD)", y = "Density")
```

### Mistake 4: Using `colour` instead of `fill` for filled geoms

❌ **Wrong:**
```r
ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(colour = "#4B6FA5")   # This sets border, not fill!
```

**Why it's wrong:** `colour` controls the bar border; `fill` controls the interior. The result is a histogram with coloured outlines but grey fills.

✅ **Correct:**
```r
ggplot(diamonds_sm, aes(x = price)) +
  geom_histogram(fill = "#4B6FA5", colour = "white", binwidth = 500)
```

### Mistake 5: Forgetting `theme(legend.position = "none")` on grouped plots

When `fill = cut` is set, ggplot2 adds a legend by default. For grouped boxplots and violins where the x-axis already shows the group names, the legend duplicates information.

✅ **Always add** `theme(legend.position = "none")` when your x-axis already labels the groups.

## Practice Exercises

### Exercise 1: Distribution Audit

You're given the `airquality` dataset. Create three plots for the `Ozone` variable: a histogram (binwidth = 10), a density plot (adjust = 0.8), and a boxplot. Arrange them using `patchwork` or display them individually. Describe in a comment what shape the distribution has.

```r
# Exercise 1: Distribution audit of airquality$Ozone
library(patchwork)

# Remove NAs first
my_air <- na.omit(airquality[, c("Ozone", "Month")])

# Create histogram
my_hist <- ggplot(my_air, aes(x = Ozone)) +
  geom_histogram(binwidth = 10, fill = "#4B6FA5", colour = "white") +
  labs(title = "Histogram", x = "Ozone (ppb)", y = "Count")

# Create density plot — your code here

# Create boxplot — your code here

# Combine with patchwork: my_hist + my_density + my_box
```

<details>
<summary>Click to reveal solution</summary>

```r
library(patchwork)
my_air <- na.omit(airquality[, c("Ozone", "Month")])

my_hist <- ggplot(my_air, aes(x = Ozone)) +
  geom_histogram(binwidth = 10, fill = "#4B6FA5", colour = "white") +
  labs(title = "Histogram", x = "Ozone (ppb)", y = "Count")

my_density <- ggplot(my_air, aes(x = Ozone)) +
  geom_density(adjust = 0.8, fill = "#4B6FA5", alpha = 0.4) +
  labs(title = "Density", x = "Ozone (ppb)", y = "Density")

my_box <- ggplot(my_air, aes(y = Ozone)) +
  geom_boxplot(fill = "#4B6FA5", alpha = 0.6) +
  labs(title = "Boxplot", y = "Ozone (ppb)") +
  theme(axis.text.x = element_blank(), axis.ticks.x = element_blank())

my_hist + my_density + my_box
# Distribution is right-skewed with a peak around 20-30 ppb and a long tail to 168 ppb
```

**Explanation:** All three charts agree: Ozone is right-skewed. The density plot shows a single mode; the boxplot reveals many outliers above the upper whisker. The histogram is the most honest representation given the moderate sample size (n ≈ 111).

</details>

### Exercise 2: Violin vs Boxplot Comparison

Using `airquality`, compare the `Temp` variable across months (convert `Month` to a factor). Create a side-by-side comparison: a grouped boxplot on the left and a violin + boxplot on the right. Which months have the most symmetric distributions?

```r
# Exercise 2: Boxplot vs violin for temperature by month
my_air2 <- airquality
my_air2$Month <- factor(my_air2$Month, labels = c("May", "Jun", "Jul", "Aug", "Sep"))

# Grouped boxplot
my_bp <- ggplot(my_air2, aes(x = Month, y = Temp, fill = Month)) +
  geom_boxplot(alpha = 0.7) +
  labs(title = "Boxplot", x = NULL, y = "Temperature (F)") +
  theme_minimal() + theme(legend.position = "none")

# Violin + boxplot — your code here
# my_vp <- ggplot(...) + geom_violin(...) + geom_boxplot(width=0.1, ...) + ...

# Combine: my_bp + my_vp
```

<details>
<summary>Click to reveal solution</summary>

```r
my_air2 <- airquality
my_air2$Month <- factor(my_air2$Month, labels = c("May", "Jun", "Jul", "Aug", "Sep"))

my_bp <- ggplot(my_air2, aes(x = Month, y = Temp, fill = Month)) +
  geom_boxplot(alpha = 0.7) +
  labs(title = "Boxplot", x = NULL, y = "Temperature (F)") +
  scale_fill_brewer(palette = "Oranges") +
  theme_minimal() + theme(legend.position = "none")

my_vp <- ggplot(my_air2, aes(x = Month, y = Temp, fill = Month)) +
  geom_violin(alpha = 0.6, trim = FALSE) +
  geom_boxplot(width = 0.1, fill = "white", outlier.size = 1) +
  labs(title = "Violin + Boxplot", x = NULL, y = "Temperature (F)") +
  scale_fill_brewer(palette = "Oranges") +
  theme_minimal() + theme(legend.position = "none")

my_bp + my_vp
# July and August are most symmetric; May is slightly left-skewed
```

**Explanation:** The violin plot reveals what the boxplot can't: July has a relatively uniform distribution across its temperature range, while May shows a distinct concentration at lower temperatures. The shapes are invisible in the boxplot alone.

</details>

## Putting It All Together

Let's build a complete distribution analysis of the `mpg` dataset, working through all four chart types in a coherent narrative. We'll look at city fuel efficiency (`cty`) across vehicle classes.

```r
# Complete example: fuel efficiency distribution analysis
# All four chart types on the same data

# First, check the data
cat("Vehicle classes:", levels(factor(mpg$class)), "\n")
cat("cty range:", range(mpg$cty), "\n")
#> Vehicle classes: 2seater compact midsize minivan pickup subcompact suv
#> cty range: 9 33

# 1. Histogram: overall shape
full_hist <- ggplot(mpg, aes(x = cty)) +
  geom_histogram(binwidth = 2, fill = "#4B6FA5", colour = "white") +
  labs(title = "Overall: right-skewed with two modes", x = "City MPG", y = "Count")

# 2. Density: smooth shape
full_density <- ggplot(mpg, aes(x = cty)) +
  geom_density(fill = "#4B6FA5", alpha = 0.4, adjust = 1) +
  labs(title = "Density: bimodal structure", x = "City MPG", y = "Density")

# 3. Boxplot: compare vehicle classes
full_box <- ggplot(mpg, aes(x = reorder(class, cty, median), y = cty, fill = class)) +
  geom_boxplot(alpha = 0.7) +
  labs(title = "By class: compacts top, pickups/SUVs bottom",
       x = "Vehicle Class", y = "City MPG") +
  theme_minimal() + theme(legend.position = "none")

# 4. Violin: full shape by class  
full_violin <- ggplot(mpg, aes(x = reorder(class, cty, median), y = cty, fill = class)) +
  geom_violin(alpha = 0.6, trim = FALSE) +
  geom_boxplot(width = 0.1, fill = "white", outlier.size = 0.8) +
  labs(title = "Violin: compact has widest range",
       x = "Vehicle Class", y = "City MPG") +
  theme_minimal() + theme(legend.position = "none")

# Assemble with patchwork
library(patchwork)
combined <- (full_hist + full_density) / (full_box + full_violin)
print(combined)
#> [4-panel plot showing progression from global to group-level distribution analysis]
```

The two-panel progression tells a coherent story: the histogram reveals bimodality (a cluster of fuel-efficient small cars and a cluster of gas-heavy trucks/SUVs). The density confirms it. The grouped boxplot shows which classes drive each cluster. The violin adds shape detail, revealing that compacts have the widest spread of fuel efficiency within their class.

## Summary

| Chart Type | Best For | Key Parameter | Misleads When |
|---|---|---|---|
| `geom_histogram()` | Single variable, raw data feel | `binwidth` | Binwidth chosen poorly |
| `geom_density()` | Smooth shape, large samples | `adjust` | Small samples (n < 200) |
| `geom_boxplot()` | Comparing groups, quick summary | `width`, `outlier.*` | Data is bimodal |
| `geom_violin()` | Comparing groups + shape detail | `adjust`, `trim` | Very small groups |

**Quick decision guide:**
- One variable, see exact counts → histogram
- One variable, see smooth shape (n > 200) → density
- Compare 2+ groups, care about median/IQR → boxplot
- Compare 2+ groups, care about shape → violin (+ embedded boxplot)
- Combine all → overlay histogram + density, or use patchwork

## FAQ

**Which is better, histogram or density plot?**

For small samples (n < 200), histogram is more honest, it shows exactly where data points are. For large samples, density plots reveal smooth shape better. Overlay both for the best of both worlds using `y = after_stat(density)` on the histogram.

**How do I put multiple density curves on one plot?**

Map a grouping variable to `fill` or `colour` and set `alpha = 0.3` so overlapping areas are visible: `geom_density(aes(fill = group), alpha = 0.3)`. More than 4-5 groups gets cluttered, consider ridgeline plots instead.

**What does `trim = FALSE` do in `geom_violin()`?**

By default (`trim = TRUE`), violins are cut at the min and max of the data, giving flat ends. `trim = FALSE` extends the density estimate beyond the data range, giving rounded tails. Use `FALSE` when you want to emphasise the tail behaviour.

**Why does my boxplot have so many outlier dots?**

Outliers are points beyond 1.5× IQR from the quartiles. For skewed distributions (like price or income), the upper whisker is very short and almost everything in the tail shows as an outlier. This isn't wrong, it's telling you the distribution is heavy-tailed. Consider a log transform.

**Can I use `geom_boxplot()` for a single variable (no groups)?**

Yes: `ggplot(df, aes(y = variable)) + geom_boxplot()`. The x-axis is meaningless so add `theme(axis.text.x = element_blank(), axis.ticks.x = element_blank())` to clean it up.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2016). [Link](https://ggplot2-book.org/)
2. ggplot2 documentation, `geom_histogram()`. [Link](https://ggplot2.tidyverse.org/reference/geom_histogram.html)
3. ggplot2 documentation, `geom_density()`. [Link](https://ggplot2.tidyverse.org/reference/geom_density.html)
4. ggplot2 documentation, `geom_boxplot()`. [Link](https://ggplot2.tidyverse.org/reference/geom_boxplot.html)
5. ggplot2 documentation, `geom_violin()`. [Link](https://ggplot2.tidyverse.org/reference/geom_violin.html)
6. R Graph Gallery, "Violin and Boxplot" section. [Link](https://r-graph-gallery.com/violin_and_boxplot_ggplot2.html)
7. Wilke, C.O., *Fundamentals of Data Visualization*. O'Reilly (2019). Chapter 7: Visualizing Distributions. [Link](https://clauswilke.com/dataviz/histograms-density-plots.html)

## Continue Learning

- **[ggplot2 Scatter Plots](ggplot2-Scatter-Plots.html)**, Move from single-variable distributions to bivariate relationships with `geom_point()`.
- **[ggplot2 Violin Plot](ggplot2-Violin-Plot.html)**, Deep dive into `geom_violin()`: embedded jitter, quantile lines, and split violins for paired data.
- **[ggplot2 Ridgeline Plot](ggplot2-Ridgeline-Plot.html)**, Compare distributions across many groups at once with the `ggridges` package.
