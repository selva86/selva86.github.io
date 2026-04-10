---
title: "ggplot2 Bar Charts: geom_bar(), geom_col(), Stacked, Dodged and Ordered"
slug: "ggplot2-Bar-Charts"
description: "Master ggplot2 bar charts with geom_bar() and geom_col(). Learn to create stacked, dodged, and ordered bars, flip coordinates, and add labels with complete code examples."
keywords: "ggplot2 bar chart, geom_bar R, geom_col ggplot2, ggplot2 stacked bar, ggplot2 grouped bar, fct_reorder bar chart, ggplot2 horizontal bar, bar chart R"
auto_link_terms: "ggplot2 bar charts|geom_bar()|geom_col()|bar chart in R|stacked bar chart ggplot2|fct_reorder ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "1.3.7"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Bar Charts"
sidebar_order: 16
---

# ggplot2 Bar Charts: geom_bar(), geom_col(), Stacked, Dodged and Ordered

<p class="lead">Bar charts compare values across categories. In ggplot2, <code>geom_bar()</code> counts rows automatically while <code>geom_col()</code> uses a pre-computed height value — choosing the right one depends entirely on what your data looks like when it arrives.</p>

## Introduction

Bar charts are deceptively simple to create but full of small traps. The most common confusion is which function to use — `geom_bar()` or `geom_col()` — and why using the wrong one produces a chart that either errors or lies about your data. The second most common trap is leaving bars in alphabetical order when the reader needs them sorted by size to extract meaning instantly.

In this tutorial, you will learn how to:

- Choose between `geom_bar()` and `geom_col()` based on your data shape
- Create stacked, dodged, and percent-stacked bar charts
- Sort bars by value using `fct_reorder()`
- Add data labels directly on or above bars
- Flip to horizontal bars for long category names

All code blocks share a single WebR session — variables from earlier blocks carry forward.

## What is the difference between geom_bar() and geom_col()?

This is the question that trips up nearly every ggplot2 beginner. Both functions draw bar charts, but they expect different input data.

![Decision guide: geom_bar() for raw data, geom_col() for pre-computed values.](screenshots/ggplot2-Bar-Charts-geom-decision.webp)

*Figure 1: Decision guide: geom_bar() for raw data, geom_col() for pre-computed values.*

**`geom_bar()`** takes raw, unaggregated data and counts how many rows fall into each category. You only supply `x` — no `y` needed. It runs `stat_count()` internally.

**`geom_col()`** takes data where you've already computed the heights (counts, averages, totals). You supply both `x` and `y`. It uses `stat_identity()` — it leaves the data as-is.

Let's set up data for both scenarios:

```r
library(ggplot2)
library(forcats)

# Scenario 1: raw data (one row per car)
# mpg dataset - 234 rows, each row = one car model
head(mpg[, c("class", "manufacturer", "hwy")])

# Scenario 2: pre-computed averages
mpg_avg <- aggregate(hwy ~ class, data = mpg, FUN = mean)
mpg_avg$hwy <- round(mpg_avg$hwy, 1)
mpg_avg
```

Now use `geom_bar()` on the raw data — it counts how many cars fall in each class:

```r
# geom_bar: count rows per class automatically
p_bar <- ggplot(mpg, aes(x = class)) +
  geom_bar(fill = "steelblue") +
  labs(
    title = "Number of Car Models by Class (geom_bar)",
    x     = "Vehicle Class",
    y     = "Count"
  )

p_bar
```

Now use `geom_col()` on the pre-computed averages — the bar height is the actual `hwy` value:

```r
# geom_col: use pre-computed average highway mpg per class
p_col <- ggplot(mpg_avg, aes(x = class, y = hwy)) +
  geom_col(fill = "tomato") +
  labs(
    title = "Average Highway MPG by Class (geom_col)",
    x     = "Vehicle Class",
    y     = "Avg Highway MPG"
  )

p_col
```

> **KEY INSIGHT:** You can also use `geom_bar(stat = "identity")` as a substitute for `geom_col()`. They are equivalent. In modern ggplot2, `geom_col()` is the cleaner choice — it signals your intent clearly without the `stat = "identity"` override. But you will see both in the wild, so recognize them as the same thing.

**Try it:** Try adding a `y` aesthetic to `geom_bar()` without `stat = "identity"`. What error does ggplot2 produce?

```r
# This will produce an error — can you read what it says?
ex_error <- tryCatch(
  ggplot(mpg, aes(x = class, y = hwy)) + geom_bar(),
  error = function(e) message("Error: ", e$message)
)
```

## How do you create stacked and dodged bar charts?

When your data has a second categorical variable (like drive type within each vehicle class), the `position` argument controls how bars within each x-category are arranged.

![Position options for grouped bars: dodge, stack, and fill.](screenshots/ggplot2-Bar-Charts-position-guide.webp)

*Figure 2: Position options for grouped bars: dodge, stack, and fill.*

**Stacked bars** (default) place sub-categories on top of each other, showing totals and composition simultaneously:

```r
# Stacked bar: fill = drv adds drive type as a second categorical dimension
p_stack <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "stack") +
  scale_fill_brewer(
    palette = "Set2",
    labels  = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  labs(
    title = "Car Count by Class and Drive Type (Stacked)",
    x     = "Vehicle Class",
    y     = "Count",
    fill  = "Drive Type"
  )

p_stack
```

**Dodged bars** place sub-categories side-by-side, making it easier to compare values within each group:

```r
# Dodged bar: sub-categories placed side by side
p_dodge <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = position_dodge(preserve = "single")) +
  scale_fill_brewer(
    palette = "Set2",
    labels  = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  labs(
    title = "Car Count by Class and Drive Type (Dodged)",
    x     = "Vehicle Class",
    y     = "Count",
    fill  = "Drive Type"
  )

p_dodge
```

`preserve = "single"` keeps all bars the same width even when some groups have fewer sub-categories. Without it, bars in sparse groups stretch wider to fill space.

**Percent-stacked bars** normalize each stack to 100%, letting you compare proportions across groups regardless of total count:

```r
p_fill <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = scales::percent) +
  scale_fill_brewer(
    palette = "Set2",
    labels  = c("4" = "4WD", "f" = "Front", "r" = "Rear")
  ) +
  labs(
    title = "Drive Type Mix by Vehicle Class (Percent Stacked)",
    x     = "Vehicle Class",
    y     = "Proportion",
    fill  = "Drive Type"
  )

p_fill
```

> **TIP:** Use **stacked** when the total height matters (e.g., total sales volume by region). Use **dodged** when you need to compare sub-group values directly (e.g., sales per quarter by product). Use **percent-stacked** when the mix/proportion matters more than the absolute count (e.g., market share over time).

**Try it:** Change `position = "fill"` to `position = "stack"` in `p_fill`. How does the chart interpretation change?

```r
# Switch from fill (%) to stack (counts)
ex_stack_switch <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "stack") +
  scale_fill_brewer(palette = "Set2")

ex_stack_switch
```

## How do you reorder bars by value?

Bars in alphabetical order are almost never the right choice. A reader's eye moves from left to right — sorting by descending value puts the most important category first and makes comparisons effortless. The `fct_reorder()` function from the `forcats` package handles this.

```r
# Sort vehicle classes by average highway mpg (ascending for coord_flip)
mpg_avg$class_ordered <- fct_reorder(mpg_avg$class, mpg_avg$hwy)

p_ordered <- ggplot(mpg_avg, aes(x = class_ordered, y = hwy)) +
  geom_col(fill = "steelblue") +
  labs(
    title = "Average Highway MPG by Vehicle Class (sorted)",
    x     = "Vehicle Class",
    y     = "Avg Highway MPG"
  )

p_ordered
```

`fct_reorder(factor, numeric)` reorders the levels of `class` by the values in `hwy`. Since bar charts read left-to-right by default, the leftmost bar is the smallest and the rightmost is the largest. When you flip to horizontal (next section), this naturally becomes top-to-bottom descending.

> **TIP:** For frequency-sorted bars from raw data (using `geom_bar()`), use `fct_infreq()` instead: `aes(x = fct_infreq(class))`. It reorders the factor by count automatically — no pre-aggregation needed.

**Try it:** Change `fct_reorder(mpg_avg$class, mpg_avg$hwy)` to `fct_reorder(mpg_avg$class, -mpg_avg$hwy)` (note the minus sign). How does the bar order change?

```r
# Sort descending instead of ascending
ex_desc <- ggplot(mpg_avg,
    aes(x = fct_reorder(class, -hwy), y = hwy)) +
  geom_col(fill = "steelblue") +
  labs(x = "Vehicle Class", y = "Avg Highway MPG")

ex_desc
```

## How do you add labels to bar charts?

Labels on bars let readers read exact values without estimating from the axis. The positioning depends on whether you want labels inside, above, or at the end of each bar.

```r
# Add value labels above bars (vjust controls vertical position)
p_label <- ggplot(mpg_avg, aes(x = fct_reorder(class, hwy), y = hwy)) +
  geom_col(fill = "steelblue", width = 0.7) +
  geom_text(
    aes(label = hwy),
    vjust  = -0.4,   # above the bar
    size   = 3.5,
    color  = "grey20"
  ) +
  scale_y_continuous(expand = expansion(mult = c(0, 0.12))) +
  labs(
    title = "Avg Highway MPG by Vehicle Class",
    x     = "Vehicle Class",
    y     = "Avg Highway MPG"
  )

p_label
```

`expand = expansion(mult = c(0, 0.12))` adds 12% headroom above the tallest bar so the top labels don't get clipped. Without this, labels above the highest bar disappear.

For labels *inside* the bar (useful for long bars with enough room), change `vjust` and color:

```r
# Labels inside the bars (good when bars are tall enough)
p_label_in <- ggplot(mpg_avg, aes(x = fct_reorder(class, hwy), y = hwy)) +
  geom_col(fill = "steelblue", width = 0.7) +
  geom_text(
    aes(label = hwy),
    vjust  = 1.6,    # inside the bar, near top
    size   = 3.5,
    color  = "white",
    fontface = "bold"
  ) +
  labs(x = "Vehicle Class", y = "Avg Highway MPG")

p_label_in
```

> **WARNING:** Inside labels fail for short bars — the text overflows the bar boundary and becomes unreadable. Check your data range before committing to inside placement. A safe rule: use inside labels only when all bars are at least 30% of the max bar height.

**Try it:** Change `vjust = -0.4` to `vjust = 2` in `p_label`. Does the label move inside the bar? Does it still look readable?

```r
# Try moving labels inside with vjust = 2
ex_label_pos <- ggplot(mpg_avg, aes(x = fct_reorder(class, hwy), y = hwy)) +
  geom_col(fill = "steelblue") +
  geom_text(aes(label = hwy), vjust = 2, color = "white", size = 3.5)

ex_label_pos
```

## How do you make a horizontal bar chart?

Horizontal bars are easier to read when category names are long. `coord_flip()` rotates the entire chart 90 degrees — x becomes y and vice versa. Apply it to any of the charts built so far:

```r
# Flip p_ordered to horizontal - long names are now easy to read
p_horiz <- p_ordered +
  coord_flip() +
  labs(
    title = "Average Highway MPG by Class (horizontal)",
    x     = NULL,    # remove redundant y-axis label after flip
    y     = "Avg Highway MPG"
  )

p_horiz
```

Because `p_ordered` was already sorted ascending by `fct_reorder()`, after flipping, the chart reads top-to-bottom from highest to lowest — the most natural reading direction for a ranked list.

> **KEY INSIGHT:** In newer ggplot2 (3.3+), you can also achieve horizontal bars by swapping x and y in `aes()` directly — `aes(y = class, x = hwy)` — without `coord_flip()`. The advantage is that axis labels stay in their natural orientation without flipping. The disadvantage is that `fct_reorder()` with ascending order now produces top-to-bottom descending without needing to flip, which can be confusing. Both approaches work — `coord_flip()` is slightly more intuitive for beginners.

**Try it:** Apply `coord_flip()` to `p_fill` (the percent-stacked chart). Does the horizontal layout make the proportion comparison easier?

```r
# Flip the percent-stacked chart
ex_horiz_fill <- p_fill + coord_flip()
ex_horiz_fill
```

## Common Mistakes and How to Fix Them

### Mistake 1: Using geom_bar() with pre-computed data and a y aesthetic

❌ This produces an error because `geom_bar()` tries to count rows and conflicts with the supplied y variable:

```r
# Wrong: geom_bar can't handle a y aesthetic by default
ggplot(mpg_avg, aes(x = class, y = hwy)) + geom_bar()
```

✅ Use `geom_col()` for pre-computed values:

```r
ggplot(mpg_avg, aes(x = class, y = hwy)) + geom_col()
```

### Mistake 2: Leaving bars in alphabetical order

❌ Alphabetical order rarely communicates a meaningful ranking. Readers can't immediately spot the highest or lowest value.

✅ Sort by value with `fct_reorder()`: `aes(x = fct_reorder(class, hwy))` or use `fct_infreq()` for count data.

### Mistake 3: Using color= instead of fill= for bar color

❌ `geom_bar(color = "steelblue")` colors only the outline of the bars, not the interior:

```r
# Wrong: outlines only
ggplot(mpg, aes(x = class)) + geom_bar(color = "steelblue")
```

✅ Use `fill` to color the bar interior:

```r
ggplot(mpg, aes(x = class)) + geom_bar(fill = "steelblue")
```

### Mistake 4: Labels getting clipped at the top

❌ Adding `geom_text(vjust = -0.4)` without expanding the y-axis clips labels above the tallest bar.

✅ Add `scale_y_continuous(expand = expansion(mult = c(0, 0.12)))` to add headroom above the highest bar.

### Mistake 5: Dodged bars with unequal widths

❌ `position = "dodge"` by default makes narrow bars for sparse groups — categories with fewer sub-groups get wider bars.

✅ Use `position = position_dodge(preserve = "single")` to maintain consistent bar widths across all groups.

## Practice Exercises

### Exercise 1: Diamond cut bar chart

Using the `diamonds` dataset, create two bar charts side-by-side (use `gridExtra::grid.arrange()` or `patchwork`):

1. A bar chart of `cut` frequency using `geom_bar()` — bars sorted from highest to lowest count
2. A bar chart of average `price` per `cut` using `geom_col()` — bars sorted by price

Are the highest-frequency cuts also the most expensive?

```r
# Starter code
# library(patchwork) or library(gridExtra)

# Chart 1: Frequency by cut
# ggplot(diamonds, aes(x = fct_infreq(cut))) + geom_bar(fill = "steelblue")

# Chart 2: Average price by cut
# diamonds_avg <- aggregate(price ~ cut, diamonds, mean)
# ggplot(diamonds_avg, aes(x = fct_reorder(cut, price, .desc = TRUE), y = price)) +
#   geom_col(fill = "tomato")
```

### Exercise 2: Stacked vs percent-stacked comparison

Using the `mpg` dataset, create a stacked and a percent-stacked bar chart of `class` vs `drv` (drive type). Then answer: which vehicle classes are most dominated by front-wheel drive? Does the absolute count chart or the proportion chart make this clearer?

```r
# Starter: stacked counts
# p1 <- ggplot(mpg, aes(x = class, fill = drv)) +
#   geom_bar(position = "stack")

# Starter: percent stacked
# p2 <- ggplot(mpg, aes(x = class, fill = drv)) +
#   geom_bar(position = "fill") +
#   scale_y_continuous(labels = scales::percent)
```

## Complete Example

This final chart combines everything: pre-computed averages, sorted bars, data labels, a clean theme, and colorblind-friendly colors — ready for a report or presentation.

```r
# Pre-compute mean highway mpg per manufacturer (top 10 by mpg)
mfr_avg <- aggregate(hwy ~ manufacturer, data = mpg, FUN = mean)
mfr_avg$hwy <- round(mfr_avg$hwy, 1)
mfr_top10 <- head(mfr_avg[order(-mfr_avg$hwy), ], 10)

p_final <- ggplot(
    mfr_top10,
    aes(x = fct_reorder(manufacturer, hwy), y = hwy)
  ) +
  geom_col(fill = "#2166ac", width = 0.75) +
  geom_text(
    aes(label = hwy),
    hjust  = -0.2,
    size   = 3.5,
    color  = "grey20"
  ) +
  coord_flip() +
  scale_x_discrete(labels = tools::toTitleCase) +
  scale_y_continuous(
    limits = c(0, 35),
    expand = expansion(mult = c(0, 0))
  ) +
  labs(
    title    = "Top 10 Manufacturers by Avg Highway MPG",
    subtitle = "Based on EPA fuel economy data (mpg dataset)",
    x        = NULL,
    y        = "Average Highway MPG",
    caption  = "Source: ggplot2::mpg"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    panel.grid.major.y = element_blank(),
    axis.text.y        = element_text(face = "bold")
  )

p_final
```

`element_blank()` removes the horizontal grid lines — they're redundant when exact values appear as labels. The bold manufacturer names draw attention to the categories, not the bars themselves.

## Summary

| Task | Code |
|---|---|
| Count rows per category | `geom_bar()` |
| Use pre-computed heights | `geom_col()` |
| Stack sub-categories | `geom_bar(position = "stack")` |
| Side-by-side sub-categories | `geom_bar(position = position_dodge(preserve = "single"))` |
| Proportion (percent) stacked | `geom_bar(position = "fill")` |
| Sort by value | `aes(x = fct_reorder(var, value))` |
| Sort by frequency | `aes(x = fct_infreq(var))` |
| Labels above bars | `geom_text(aes(label = val), vjust = -0.4)` |
| Labels inside bars | `geom_text(aes(label = val), vjust = 1.6, color = "white")` |
| Horizontal bars | `+ coord_flip()` |
| Fill vs outline color | `fill = "color"` (interior) vs `color = "color"` (border) |

Key rules:
- Use `geom_bar()` for raw data (counts automatically), `geom_col()` for pre-aggregated data
- Sort by value with `fct_reorder()` — alphabetical order is almost never informative
- Add headroom for above-bar labels: `scale_y_continuous(expand = expansion(mult = c(0, 0.12)))`
- Use `fill` (not `color`) to change bar fill color

## FAQ

**Can I use geom_bar() with stat = "identity" instead of geom_col()?**

Yes, they are equivalent. `geom_bar(stat = "identity")` and `geom_col()` produce identical output. `geom_col()` was added to ggplot2 to make the intent clearer — use it when you have pre-computed values.

**How do I change bar width?**

Use the `width` argument: `geom_col(width = 0.5)`. The default is 0.9 (90% of the space between x positions). Lower values create narrower bars with more white space between them.

**How do I sort a stacked bar chart by one sub-group's size?**

This requires reordering the factor before plotting. Compute the values for the sub-group you want to sort by, then use `fct_reorder()` on that subset's values. Alternatively, use `fct_reorder2()` for sorting by a two-variable function.

**How do I add a reference line to a bar chart?**

Use `geom_hline(yintercept = value)` for horizontal reference lines (or `geom_vline()` after `coord_flip()`). For example: `+ geom_hline(yintercept = mean(mpg_avg$hwy), linetype = "dashed", color = "grey50")`.

**Why do my bars have gaps at the x-axis baseline?**

By default, ggplot2 adds padding below the x-axis. To remove it: `scale_y_continuous(expand = expansion(mult = c(0, 0.05)))` — the first value (0) removes padding at the bottom, the second (0.05) adds 5% headroom at the top.

## References

1. Wickham, H. (2016). *ggplot2: Elegant Graphics for Data Analysis*. Springer. https://ggplot2-book.org/
2. ggplot2 reference — `geom_bar()` and `geom_col()`. https://ggplot2.tidyverse.org/reference/geom_bar.html
3. forcats reference — `fct_reorder()`. https://forcats.tidyverse.org/reference/fct_reorder.html
4. Wilke, C. O. (2019). *Fundamentals of Data Visualization*, Chapter 6: Visualizing Amounts. https://clauswilke.com/dataviz/
5. R Graph Gallery — Bar Charts. https://r-graph-gallery.com/barplot.html
6. Healy, K. (2018). *Data Visualization: A Practical Introduction*, Chapter 4. https://socviz.co/

## Continue Learning

- **ggplot2 Scatter Plots** — explore relationships between two continuous variables with `geom_point()`, color mapping, and trend lines.
- **ggplot2 Distribution Charts** — compare distributions with histograms, boxplots, and violin plots — a natural complement to bar charts when you need more than a single summary value per group.
- **ggplot2 Line Charts** — track change over time with `geom_line()`, grouped by category and styled with linetypes.
