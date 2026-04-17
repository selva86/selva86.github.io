---
title: "ggplot2 Line Charts: Connect Points, Group by Variable, and Style Lines"
slug: "ggplot2-Line-Charts"
description: "Create ggplot2 line charts with geom_line(). Learn to group lines by variable, change line types and colors, add points, and handle time series data step by step."
keywords: "ggplot2 line chart, geom_line R, ggplot2 geom_line, line plot R, ggplot2 multiple lines, ggplot2 time series, geom_step R, ggplot2 group aesthetic"
auto_link_terms: "ggplot2 line charts|geom_line()|geom_step()|line chart in R|ggplot2 multiple lines|group aesthetic ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.6"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Line Charts"
sidebar_order: 15
difficulty: "Intermediate"
---

# ggplot2 Line Charts: Connect Points, Group by Variable, and Style Lines

<p class="lead">A line chart connects observations in sequence to show change over an ordered variable, most often time. In ggplot2, <code>geom_line()</code> draws the connecting lines, while the <code>group</code> aesthetic controls how many lines appear when your data has multiple categories.</p>

## Introduction

Line charts are the natural choice when change over time matters more than individual values. If you want to show how unemployment evolved over 40 years, how three tree species grew month by month, or how a stock price moved across a trading day, a line chart tells that story at a glance.

The ggplot2 implementation is clean: `geom_line()` connects your data points in order of the x variable. But there is one subtlety that trips up nearly every new ggplot2 user, the `group` aesthetic. Without it, a dataset with multiple categories produces a zigzag mess instead of separate smooth lines. Once you understand that, everything else falls into place.

In this tutorial, you will learn how to:

- Build a basic line chart with `geom_line()`
- Add point markers with `geom_point()`
- Draw multiple lines using the `group` and `color` aesthetics
- Style lines with color, linetype, and linewidth
- Plot dates on the x-axis for time series data
- Choose between `geom_line()`, `geom_step()`, and `geom_path()`

All code blocks share a single WebR session, variables from earlier blocks are available in later ones.

## How does geom_line() connect data points?

`geom_line()` connects observations sorted by the x-axis variable. That "sorted by x" part is critical: if you have data at x = 1, 5, 2, ggplot2 draws the line through 1 → 2 → 5 in x order, not in row order. This is almost always what you want for time series.

Let's start with R's built-in `economics` dataset, which tracks US economic indicators monthly from 1967 to 2015. We'll use a recent subset to keep the chart readable.

```r
library(ggplot2)

# Use a 20-year slice: 1995-2015
econ_sm <- subset(economics, date >= as.Date("1995-01-01"))

# Preview
head(econ_sm[, c("date", "unemploy", "uempmed")])
```

Now draw the simplest possible line chart, unemployment count over time:

```r
p_basic <- ggplot(econ_sm, aes(x = date, y = unemploy)) +
  geom_line(color = "steelblue", linewidth = 0.8) +
  labs(
    title = "US Unemployment Count (1995–2015)",
    x     = "Date",
    y     = "Number Unemployed (thousands)"
  )

p_basic
```

> **KEY INSIGHT:** In ggplot2 versions 3.4+, the parameter to control line thickness is `linewidth`, not `size`. Old tutorials using `size` inside `geom_line()` will still work (with a deprecation warning) but `linewidth` is the correct modern form. `size` still controls point size in `geom_point()`.

**Try it:** Change `unemploy` to `uempmed` (median weeks unemployed). Does that variable show a different pattern from the raw count?

```r
# Your code here — swap the y mapping and pick a new line colour
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_median <- ggplot(econ_sm, aes(x = date, y = uempmed)) +
  geom_line(color = "tomato", linewidth = 0.8) +
  labs(x = "Date", y = "Median Weeks Unemployed")

ex_median
```

`uempmed` is the *median duration* of unemployment, not the total count, so the line spikes much higher during the 2008-2010 recession and decays slowly afterwards, duration stays elevated even once the count starts falling. Only the `y` aesthetic needs to change; the rest of the chart is identical.
</details>

## How do you add point markers to a line chart?

Adding `geom_point()` on top of `geom_line()` marks each individual observation clearly, useful when your data is sparse or you want to emphasize every data point:

```r
# Subset to just 2010-2015 to make points visible
econ_2010 <- subset(economics, date >= as.Date("2010-01-01"))

p_points <- ggplot(econ_2010, aes(x = date, y = uempmed)) +
  geom_line(color = "steelblue", linewidth = 0.8) +
  geom_point(color = "steelblue", size = 2.5, shape = 21,
             fill = "white", stroke = 1.2) +
  labs(
    title = "Median Weeks Unemployed with Monthly Markers",
    x     = "Date",
    y     = "Median Weeks Unemployed"
  )

p_points
```

`shape = 21` gives a filled circle with a separate border. Setting `fill = "white"` and `stroke = 1.2` creates the clean "open circle with colored rim" look, easy to see against both light and dark backgrounds.

> **TIP:** For dense time series (monthly data over 20+ years), skip the point markers, they clutter the line. Use points only when you have fewer than ~50 observations per line.

**Try it:** Replace `shape = 21, fill = "white"` with `shape = 16` (solid filled circle). Which looks cleaner at this data density?

```r
# Your code here — use shape = 16 and drop fill/stroke
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_solid_pts <- ggplot(econ_2010, aes(x = date, y = uempmed)) +
  geom_line(color = "steelblue", linewidth = 0.8) +
  geom_point(color = "steelblue", size = 2.5, shape = 16)

ex_solid_pts
```

`shape = 16` is a solid, filled-through circle that doesn't need `fill` or `stroke`, so the call gets shorter. At this density (about 60 monthly points) both forms look fine, solid circles feel more compact, while the open rim from shape 21 pops more against a dark line when you want each point to really stand out.
</details>

## How do you draw multiple lines by group?

This is the most common stumbling block with `geom_line()`. Suppose your data has one column for the x variable, one for y, and one identifying which group each row belongs to. Without telling ggplot2 about the grouping, it tries to draw one single line through all rows, and since it jumps between groups, you get the dreaded zigzag.

![How the group aesthetic controls one-line-per-category behavior.](screenshots/ggplot2-Line-Charts-group-aesthetic.webp)

*Figure 2: How the group aesthetic controls one-line-per-category behavior.*

The `Orange` dataset tracks circumference of 5 orange trees over time. Each tree has multiple measurements. Let's use it:

```r
# Without group: ggplot tries to draw ONE line across all trees
p_no_group <- ggplot(Orange, aes(x = age, y = circumference)) +
  geom_line() +
  labs(title = "Without group= : one jagged line (wrong!)")

p_no_group
```

Now fix it by mapping `Tree` to both `group` and `color`:

```r
p_multi <- ggplot(Orange, aes(
    x     = age,
    y     = circumference,
    group = Tree,
    color = Tree
  )) +
  geom_line(linewidth = 0.9) +
  geom_point(size = 2.5) +
  scale_color_brewer(palette = "Set1") +
  labs(
    title = "Orange Tree Circumference by Age",
    x     = "Age (days)",
    y     = "Circumference (mm)",
    color = "Tree"
  )

p_multi
```

Now each tree gets its own line and color, with a legend generated automatically.

> **KEY INSIGHT:** When you map a variable to `color` in `aes()`, ggplot2 automatically groups by that variable, so `group = Tree` is technically redundant here. You need the explicit `group` aesthetic only when you want multiple lines with the *same* color. For example, `geom_line(aes(group = Tree), color = "grey50")` draws all 5 trees in grey without a legend.

**Try it:** Remove `color = Tree` from `aes()` and instead set `color = "grey50"` directly in `geom_line()`. How does the chart look without per-tree colors?

```r
# Your code here — keep group = Tree but set a single fixed colour
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_grey <- ggplot(Orange, aes(x = age, y = circumference, group = Tree)) +
  geom_line(color = "grey50", linewidth = 0.9)

ex_grey
```

`color = "grey50"` lives outside `aes()`, so it applies to *every* line as a fixed setting, no legend, no colour mapping. You still need `group = Tree` inside `aes()` because without a grouping variable ggplot2 would fall back to one zigzag line across all trees. This style is useful as a background layer to highlight one or two trees on top in a brighter colour.
</details>

## How do you style lines with color, linetype, and linewidth?

Line styling gives a chart personality, and it's essential for accessibility when color alone can't distinguish groups (e.g., in print or for colorblind readers).

```r
p_style <- ggplot(Orange, aes(
    x        = age,
    y        = circumference,
    color    = Tree,
    linetype = Tree
  )) +
  geom_line(linewidth = 0.9) +
  scale_color_manual(values = c(
    "1" = "#1b7837", "2" = "#762a83", "3" = "#d6604d",
    "4" = "#4393c3", "5" = "#f4a582"
  )) +
  scale_linetype_manual(values = c(
    "1" = "solid", "2" = "dashed", "3" = "dotted",
    "4" = "dotdash", "5" = "longdash"
  )) +
  labs(
    title    = "Orange Tree Growth — Color + Linetype Encoding",
    subtitle = "Dual encoding helps colorblind readers and print",
    x        = "Age (days)",
    y        = "Circumference (mm)"
  ) +
  theme_minimal()

p_style
```

**Linetype reference:**

| Code | Name | Use when |
|---|---|---|
| `"solid"` |, , | Primary series, most important line |
| `"dashed"` | - - - | Secondary comparison line |
| `"dotted"` | ···· | Reference or baseline |
| `"dotdash"` | -·-· | Fourth category |
| `"longdash"` |, , - | Fifth category |
| `"twodash"` | ==- | Rarely needed; use sparingly |

> **TIP:** Map `linetype` alongside `color` for the same grouping variable. This "dual encoding" means readers can distinguish lines both by color and by line pattern, essential for print, photocopies, and colorblind readers. A chart that only uses color will fail for ~8% of male readers.

**Try it:** Remove `scale_linetype_manual()` and instead use ggplot2's default linetype scale. Does it still pick a sensible linetype for each tree?

```r
# Your code here — map color and linetype to Tree without a manual scale
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_auto_lt <- ggplot(Orange, aes(
    x = age, y = circumference,
    color = Tree, linetype = Tree
  )) +
  geom_line(linewidth = 0.9)

ex_auto_lt
```

When you map `linetype = Tree` without a manual scale, ggplot2 picks from its default discrete linetype palette (solid, dashed, dotted, dotdash, longdash) and merges it with the colour legend into one combined key. Note that `scale_linetype_brewer()` doesn't exist, ColorBrewer is colour-only, so the default scale is the right choice when you're happy with the automatic linetype order.
</details>

## How do you plot dates and time series on the x-axis?

When your x variable is a `Date` or `POSIXct` object, ggplot2 treats it as continuous time and positions points correctly. The `scale_x_date()` function gives you precise control over the axis breaks and labels.

```r
p_dates <- ggplot(econ_sm, aes(x = date, y = unemploy)) +
  geom_line(color = "steelblue", linewidth = 0.8) +
  geom_area(alpha = 0.15, fill = "steelblue") +
  scale_x_date(
    date_breaks = "3 years",
    date_labels = "%Y"
  ) +
  scale_y_continuous(labels = scales::comma) +
  labs(
    title    = "US Unemployment (1995–2015)",
    subtitle = "Shaded area shows volume below the trend",
    x        = NULL,
    y        = "Unemployed (thousands)"
  ) +
  theme_minimal()

p_dates
```

`geom_area()` adds the shaded fill below the line, a useful visual trick that emphasizes cumulative volume or magnitude. `date_breaks = "3 years"` and `date_labels = "%Y"` control the tick spacing and format.

**`date_labels` format codes:**

| Code | Output | Example |
|---|---|---|
| `"%Y"` | 4-digit year | 2010 |
| `"%b %Y"` | Abbreviated month + year | Jan 2010 |
| `"%m/%Y"` | Month/Year | 01/2010 |
| `"%b"` | Abbreviated month only | Jan |
| `"%d %b"` | Day + month | 15 Jan |

> **WARNING:** If your date column is stored as a character string instead of a `Date`, `geom_line()` will either fail or produce a strange categorical x-axis. Always convert: `df$date <- as.Date(df$date_col, format = "%Y-%m-%d")` before plotting.

**Try it:** Change `date_breaks` to `"2 years"` and `date_labels` to `"%b %Y"`. How does the axis labeling change?

```r
# Your code here — tweak scale_x_date() arguments only
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_dates <- ggplot(econ_sm, aes(x = date, y = unemploy)) +
  geom_line(color = "steelblue") +
  scale_x_date(date_breaks = "2 years", date_labels = "%b %Y")

ex_dates
```

`date_breaks = "2 years"` puts a tick every two years instead of every three, so you get roughly 11 ticks across the 20-year window. `date_labels = "%b %Y"` formats each tick as "Jan 1995", "Jan 1997", etc., which is more precise than the bare year but also wider, on a narrow plot the labels may start to overlap and you'd need `theme(axis.text.x = element_text(angle = 45, hjust = 1))` to tilt them.
</details>

## When should you use geom_step() or geom_path() instead?

Most line charts use `geom_line()`, but ggplot2 offers two close relatives for specific situations.

![Decision guide: geom_line(), geom_path(), or geom_step()?](screenshots/ggplot2-Line-Charts-geom-choice.webp)

*Figure 1: Decision guide: geom_line(), geom_path(), or geom_step().*

**`geom_step()`** creates a staircase line, horizontal then vertical segments, instead of diagonal connections. Use it when the value is truly constant between observations (step functions): pricing tiers, stock bid/ask updates, inventory levels.

```r
# geom_step vs geom_line on the same data
p_step <- ggplot(
    subset(economics, date >= as.Date("2014-01-01")),
    aes(x = date, y = uempmed)
  ) +
  geom_line(color = "steelblue", linewidth = 0.8, linetype = "dashed",
            aes(linetype = "geom_line")) +
  geom_step(color = "firebrick", linewidth = 0.8,
            aes(linetype = "geom_step")) +
  scale_linetype_manual(
    name   = "Geom",
    values = c("geom_line" = "dashed", "geom_step" = "solid")
  ) +
  labs(
    title    = "geom_step vs geom_line",
    subtitle = "Step function holds the value until the next observation",
    x        = "Date",
    y        = "Median Weeks Unemployed"
  )

p_step
```

**`geom_path()`** connects points in *row order* instead of x-sorted order. It's used for trajectory plots where the sequence of observations matters but isn't tied to a sorted x-axis, for example, a scatterplot of longitude vs latitude traced over time.

> **TIP:** For 99% of time series charts, `geom_line()` is correct. Reach for `geom_step()` only when your value is a step function (holds constant until it jumps). Use `geom_path()` only for trajectory plots where row order is meaningful.

**Try it:** Replace `geom_step()` with `geom_path()` in the code above. Do you get the same staircase appearance, or something different?

```r
# Your code here — swap geom_step() for geom_path()
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_path <- ggplot(
    subset(economics, date >= as.Date("2014-01-01")),
    aes(x = date, y = uempmed)
  ) +
  geom_path(color = "purple", linewidth = 0.8)

ex_path
```

`geom_path()` connects observations in *row order* with diagonal segments, no staircase. Because `economics` is already sorted by date, the visual result here is identical to `geom_line()`. The difference would only show up if you shuffled the rows: `geom_line()` would re-sort by x, while `geom_path()` would draw in whatever order the rows happened to sit.
</details>

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting the group aesthetic with multi-category data

❌ This draws one zigzag line across all trees:

```r
# Wrong: no group, all 5 trees merged into one chaotic line
ggplot(Orange, aes(x = age, y = circumference)) +
  geom_line()
```

✅ Map a grouping variable to `group`, `color`, or `linetype`:

```r
ggplot(Orange, aes(x = age, y = circumference, color = Tree)) +
  geom_line()
```

### Mistake 2: Using size= for line thickness (deprecated)

❌ This works but produces a deprecation warning in ggplot2 3.4+:

```r
geom_line(size = 1.5)   # deprecated
```

✅ Use `linewidth` for lines and `size` for points:

```r
geom_line(linewidth = 1.5)   # correct
geom_point(size = 2)          # size still correct for points
```

### Mistake 3: Plotting a character date column as-is

❌ If `date` is stored as a character, the x-axis shows categories instead of a continuous timeline:

```r
# Wrong: date stored as "2020-01", treated as categorical
ggplot(df, aes(x = date_char, y = value)) + geom_line()
```

✅ Convert to `Date` first:

```r
df$date <- as.Date(df$date_char, format = "%Y-%m")
ggplot(df, aes(x = date, y = value)) + geom_line()
```

### Mistake 4: Connecting lines across missing values (NAs)

❌ If your time series has missing months, `geom_line()` silently skips them, the line jumps over the gap without any visual indication.

✅ Insert an explicit `NA` row for the missing period. When ggplot2 encounters `NA` in y, it breaks the line at that point, creating a visible gap:

```r
df[nrow(df) + 1, ] <- list(as.Date("2020-06-01"), NA)
```

### Mistake 5: Using too many lines without a strategy

❌ Plotting 10+ lines on the same chart creates spaghetti, no one line is distinguishable.

✅ Use `facet_wrap()` to give each group its own panel, or highlight just 1-2 key lines and grey out the rest. Less is more.

## Practice Exercises

### Exercise 1: Multi-line time series

The built-in `co2` dataset contains monthly CO2 readings from 1959 to 1997. Convert it to a data frame, add a `year` and `month` column, then plot CO2 concentration over time as a line chart. Color by decade (create a `decade` column with `floor(year / 10) * 10`). Add appropriate axis labels and a title.

```r
# Starter code
co2_df <- data.frame(
  date  = seq(as.Date("1959-01-01"), by = "month", length.out = length(co2)),
  co2   = as.numeric(co2)
)
co2_df$year   <- as.integer(format(co2_df$date, "%Y"))
co2_df$decade <- as.factor(floor(co2_df$year / 10) * 10)

# Your ggplot code here:
# ggplot(co2_df, aes(x = date, y = co2, color = decade, group = 1)) + ...
# Hint: group = 1 forces ONE line since color alone would try to split by decade
```

### Exercise 2: Compare geom_line vs geom_step

Use the `economics` dataset. Plot `psavert` (personal savings rate) from 2005 to 2015 using both `geom_line()` and `geom_step()` on the same chart (use different colors and a legend). Which representation better reflects that savings rate is reported monthly and stays constant within each month?

```r
# Starter code
econ_05 <- subset(economics, date >= as.Date("2005-01-01"))

# Layer geom_line and geom_step with different colors
# ggplot(econ_05, aes(x = date, y = psavert)) +
#   geom_line(aes(color = "geom_line"), linewidth = 0.8) +
#   geom_step(aes(color = "geom_step"), linewidth = 0.8) +
#   scale_color_manual(values = c(...))
```

## Complete Example

This final chart uses faceting to show four economic indicators side-by-side, with individual trend lines per facet, a clean way to compare multiple time series without overloading a single panel.

```r
library(tidyr)

# Reshape economics to long format for faceting
econ_long <- tidyr::pivot_longer(
  econ_sm,
  cols      = c(unemploy, uempmed, psavert, pce),
  names_to  = "metric",
  values_to = "value"
)

# Clean labels for facet panels
metric_labels <- c(
  unemploy = "Unemployed (thousands)",
  uempmed  = "Median Weeks Unemployed",
  psavert  = "Personal Savings Rate (%)",
  pce      = "Personal Consumption ($B)"
)

p_final <- ggplot(econ_long, aes(x = date, y = value)) +
  geom_line(color = "steelblue", linewidth = 0.7) +
  geom_smooth(method = "loess", color = "firebrick",
              linewidth = 0.5, se = FALSE) +
  facet_wrap(
    ~ metric,
    scales  = "free_y",
    labeller = labeller(metric = metric_labels)
  ) +
  scale_x_date(date_breaks = "5 years", date_labels = "%Y") +
  labs(
    title    = "US Economic Indicators (1995–2015)",
    subtitle = "Blue = actual values; red = loess trend",
    x        = NULL,
    y        = NULL
  ) +
  theme_minimal(base_size = 12) +
  theme(strip.text = element_text(face = "bold"))

p_final
```

`scales = "free_y"` lets each panel use its own y-axis range, critical when your metrics have very different magnitudes (thousands vs percentages vs billions).

## Summary

| Task | Code |
|---|---|
| Basic line chart | `geom_line()` |
| Add point markers | `+ geom_point()` |
| Shade area below | `+ geom_area(alpha = 0.15)` |
| Multiple lines by group | `aes(color = var)` or `aes(group = var)` |
| Line thickness | `geom_line(linewidth = 1.2)` |
| Line style | `geom_line(linetype = "dashed")` |
| Date x-axis | `scale_x_date(date_breaks = "1 year", date_labels = "%Y")` |
| Staircase line | `geom_step()` |
| Row-order path | `geom_path()` |
| Compare metrics | `facet_wrap(~ metric, scales = "free_y")` |

Key rules:
- Map grouping variable to `color`, `linetype`, or `group`, without grouping, multi-category data produces a zigzag
- Use `linewidth` (not `size`) to control line thickness in ggplot2 3.4+
- Convert date columns to `Date` class before plotting for correct time axis behavior
- Dual-encode with both `color` and `linetype` for colorblind accessibility

## FAQ

**Why is my line chart one zigzag instead of multiple smooth lines?**

You have a multi-category dataset but haven't told ggplot2 about the grouping. Add `aes(color = your_group_var)` or `aes(group = your_group_var)` to split the data into one line per category.

**What is the difference between geom_line() and geom_path()?**

`geom_line()` connects points sorted by x-axis value. `geom_path()` connects points in their original row order, regardless of x value. For most time series, `geom_line()` is correct. Use `geom_path()` for trajectory plots where row sequence (not x order) defines the path.

**How do I control the order lines appear in the legend?**

Convert your grouping variable to a factor with levels in the desired order before plotting: `df$group <- factor(df$group, levels = c("A", "B", "C"))`. The legend order follows the factor level order.

**How do I add a horizontal reference line (e.g., at y = 0)?**

Use `geom_hline(yintercept = 0, linetype = "dashed", color = "grey50")`. For a vertical reference line, use `geom_vline(xintercept = as.Date("2008-09-01"))`.

**My line disappears at certain x values, what is happening?**

Your data likely has `NA` values in the y column at those positions. `geom_line()` breaks the line at `NA` points and restarts on the other side, which creates visible gaps. If you want the line to connect through missing values (not recommended, as it's misleading), use `na.rm = TRUE`, but inserting explicit `NA` rows to mark the gap is the honest approach.

## References

1. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer. https://ggplot2-book.org/
2. ggplot2 reference, `geom_line()`. https://ggplot2.tidyverse.org/reference/geom_path.html
3. ggplot2 reference, `scale_x_date()`. https://ggplot2.tidyverse.org/reference/scale_date.html
4. Wilke, C. O. (2019). *Fundamentals of Data Visualization*, Chapter 13: Visualizing Time Series. https://clauswilke.com/dataviz/
5. R Graph Gallery, Line Charts. https://r-graph-gallery.com/line-chart-ggplot2.html
6. Healy, K. (2018). *Data Visualization: A Practical Introduction*. Princeton University Press. https://socviz.co/

## Continue Learning

- **ggplot2 Bar Charts**, compare counts and values across categories with `geom_bar()` and `geom_col()`, including stacked and dodged variants.
- **ggplot2 Distribution Charts**, understand data spread with histograms, density plots, boxplots, and violin plots.
- **ggplot2 Scatter Plots**, explore relationships between two continuous variables with `geom_point()`, color mapping, and trend lines.
