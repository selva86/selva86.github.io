---
title: "Sankey and Alluvial Charts in R with ggalluvial"
slug: "Sankey-Alluvial-Chart-in-R"
description: "Create alluvial and Sankey charts in R with ggalluvial. Learn geom_alluvium(), geom_stratum(), color flows, and when to use Sankey vs alluvial charts for categorical flow data."
keywords: "sankey chart R, alluvial chart R, ggalluvial R, R sankey diagram ggplot2, alluvial plot ggplot2, geom_alluvium R"
auto_link_terms: "Sankey chart in R|alluvial chart in R|ggalluvial|geom_alluvium()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-07
curriculum_id: FR-char-10
post_type: FR
fr_parent: ggplot2-Line-Charts.html
difficulty: "Intermediate"
---

# Sankey and Alluvial Charts in R with ggalluvial

<p class="lead">Alluvial and Sankey charts visualize how observations flow between categorical states, like customers moving between subscription tiers, patients through treatment stages, or votes shifting between parties. In R, <code>ggalluvial</code> builds them inside ggplot2 with <code>geom_alluvium()</code> and <code>geom_stratum()</code>.</p>

## Introduction

A bar chart shows you where things *are*. A Sankey or alluvial chart shows you where things *came from and went to*.

The classic use case: a customer journey analysis. At Month 1, you have 1,000 customers split among three tiers (Free, Basic, Pro). By Month 3, how many upgraded? How many churned? A bar chart per month shows counts, but it can't show the *movement*. An alluvial chart shows the flows, making conversions and churn immediately visible.

The two chart types are closely related:
- **Alluvial chart**, flows between multiple categorical axes (time points or variables). The data is long-format or frequency table.
- **Sankey diagram**, a generalized flow diagram where node widths and flow widths encode magnitude. Often used for energy/material flow systems.

The `ggalluvial` package handles both inside ggplot2's grammar, giving you full access to themes, scales, and annotations.

## How do you create a basic alluvial chart in R?

`ggalluvial` uses two main geoms: `geom_stratum()` draws the stacked rectangles at each axis (the "strata"), and `geom_alluvium()` draws the flowing ribbons between them.

```r
library(ggplot2)
library(ggalluvial)

# Customer subscription journey: Month 1 → Month 2 → Month 3
# alluvial format: each row is a combination of categories + frequency
sub_df <- data.frame(
  month1 = c("Free", "Free", "Free", "Basic", "Basic", "Basic", "Pro", "Pro"),
  month2 = c("Free", "Basic", "Churned", "Free", "Basic", "Pro", "Basic", "Pro"),
  month3 = c("Free", "Basic", "Churned", "Churned", "Basic", "Pro", "Pro", "Pro"),
  freq   = c(320, 180, 100, 50, 200, 120, 30, 170)
)

# Basic alluvial chart
p_basic <- ggplot(sub_df,
  aes(axis1 = month1, axis2 = month2, axis3 = month3, y = freq)) +
  geom_alluvium(fill = "steelblue", alpha = 0.6) +
  geom_stratum(width = 1/3, fill = "white", color = "grey60") +
  geom_label(stat = "stratum",
             aes(label = after_stat(stratum)),
             size = 3.5) +
  scale_x_discrete(
    limits = c("Month 1", "Month 2", "Month 3"),
    expand = c(0.1, 0.1)
  ) +
  labs(title = "Customer Subscription Flow", y = "Customers") +
  theme_minimal()

p_basic
```

The `axis1`, `axis2`, `axis3` aesthetics define the stages. `y = freq` sets the flow width proportional to the number of customers. `geom_label(stat = "stratum")` adds labels to each stratum automatically using the stratum values.

**Try it:** Change `geom_label()` to `geom_text(stat = "stratum", aes(label = after_stat(stratum)), size = 3)` for labels without boxes.

## How do you color flows by origin?

Coloring each ribbon by its origin stage (where the flow came from) makes it easy to trace cohorts through the chart.

```r
# Color flows by their Month 1 origin
p_color <- ggplot(sub_df,
  aes(axis1 = month1, axis2 = month2, axis3 = month3,
      y = freq, fill = month1)) +   # fill by origin
  geom_alluvium(alpha = 0.75) +
  geom_stratum(width = 1/3, fill = "white", color = "grey50") +
  geom_label(stat = "stratum",
             aes(label = after_stat(stratum)),
             size = 3.2, fill = "white") +
  scale_fill_manual(
    values = c("Free" = "#90CAF9", "Basic" = "#FFB74D", "Pro" = "#A5D6A7"),
    name   = "Starting Tier"
  ) +
  scale_x_discrete(
    limits = c("Month 1", "Month 2", "Month 3"),
    expand = c(0.1, 0.1)
  ) +
  labs(
    title    = "Customer Flow by Starting Tier",
    subtitle = "Color = subscription tier at Month 1",
    y        = "Number of Customers"
  ) +
  theme_minimal()

p_color
```

Now you can follow the blue ribbon (Free tier customers) and see how many stayed Free, upgraded to Basic, or churned. The orange and green ribbons trace Basic and Pro customers respectively.

**Try it:** Change `fill = month1` to `fill = month3` to color by *destination* instead of origin. This shifts the story from "where did they start?" to "where did they end up?"

## How do you color flows by destination?

Coloring by the final stage (`month3`) gives you a retention/conversion view, all customers ending in "Pro" are green, all churned customers are red.

```r
# Color by final destination (Month 3 outcome)
p_dest <- ggplot(sub_df,
  aes(axis1 = month1, axis2 = month2, axis3 = month3,
      y = freq, fill = month3)) +
  geom_alluvium(alpha = 0.75) +
  geom_stratum(width = 1/3, fill = "white", color = "grey50") +
  geom_label(stat = "stratum",
             aes(label = after_stat(stratum)),
             size = 3.2, fill = "white") +
  scale_fill_manual(
    values = c(
      "Free"    = "#90CAF9",
      "Basic"   = "#FFB74D",
      "Pro"     = "#A5D6A7",
      "Churned" = "#EF9A9A"
    ),
    name = "Month 3 Outcome"
  ) +
  scale_x_discrete(
    limits = c("Month 1", "Month 2", "Month 3"),
    expand = c(0.1, 0.1)
  ) +
  labs(
    title    = "Customer Flow Colored by Final Outcome",
    subtitle = "Color = subscription status at Month 3",
    y        = "Number of Customers"
  ) +
  theme_minimal()

p_dest
```

The red ribbons (Churned) immediately stand out, you can see which starting tiers contributed most to churn.

**Try it:** Add `geom_flow(alpha = 0.3)` between `geom_alluvium()` and `geom_stratum()`, this draws short connecting ribbons between adjacent strata instead of full spanning ribbons. It's a subtly different visual style that's cleaner for many stages.

## How do you use wide-format data with ggalluvial?

If your data is already in wide format (one row per unique combination of variables, with a frequency column), pass it directly using `to_lodes_form()` to convert, or use the `axes` argument directly.

```r
# Wide format: summarized frequency table
wide_df <- data.frame(
  Gender     = c("M", "M", "M", "F", "F", "F"),
  Department = c("Eng", "Sales", "HR", "Eng", "Sales", "HR"),
  Level      = c("Senior", "Junior", "Senior", "Senior", "Senior", "Junior"),
  count      = c(45, 30, 15, 25, 40, 20)
)

p_wide <- ggplot(wide_df,
  aes(axis1 = Gender, axis2 = Department, axis3 = Level,
      y = count, fill = Gender)) +
  geom_alluvium(alpha = 0.7) +
  geom_stratum(width = 1/3, fill = "white", color = "grey60") +
  geom_label(stat = "stratum",
             aes(label = after_stat(stratum)),
             size = 3) +
  scale_fill_manual(values = c("M" = "#2196F3", "F" = "#E91E63")) +
  scale_x_discrete(
    limits = c("Gender", "Department", "Level"),
    expand = c(0.1, 0.1)
  ) +
  labs(
    title = "Employee Distribution: Gender → Department → Level",
    y     = "Headcount",
    fill  = "Gender"
  ) +
  theme_minimal()

p_wide
```

**Try it:** Swap the axis order, change `axis1 = Department, axis2 = Gender, axis3 = Level`, to explore how the visual story changes when you reorder the stages.

## Complete Example: Polished Alluvial Chart

```r
# Polished version with custom theme and annotations
p_final <- ggplot(sub_df,
  aes(axis1 = month1, axis2 = month2, axis3 = month3,
      y = freq, fill = month3)) +
  geom_alluvium(alpha = 0.8, width = 1/4) +
  geom_stratum(width = 1/4, fill = "grey95", color = "grey70") +
  geom_text(
    stat  = "stratum",
    aes(label = after_stat(stratum)),
    size  = 3.5, fontface = "bold", color = "grey30"
  ) +
  scale_fill_manual(
    values = c(
      "Free"    = "#42A5F5",
      "Basic"   = "#FFA726",
      "Pro"     = "#66BB6A",
      "Churned" = "#EF5350"
    ),
    name = "Month 3 Status"
  ) +
  scale_x_discrete(
    limits = c("Month 1", "Month 2", "Month 3"),
    expand = c(0.15, 0.1)
  ) +
  scale_y_continuous(labels = scales::comma) +
  labs(
    title    = "SaaS Customer Journey: 3-Month Subscription Flow",
    subtitle = "Width proportional to customer count | Color = Month 3 outcome",
    y        = "Number of Customers",
    x        = NULL
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold", size = 15),
    plot.subtitle = element_text(color = "grey50", size = 11),
    panel.grid.major.x = element_blank(),
    panel.grid.minor   = element_blank(),
    legend.position    = "right"
  )

p_final
```

## Common Mistakes and How to Fix Them

### Mistake 1: Missing y aesthetic

`geom_alluvium()` requires `y` for the flow widths. Without it, ggplot2 will error.

```r
# Wrong: no y aesthetic
ggplot(df, aes(axis1 = A, axis2 = B)) + geom_alluvium()

# Correct
ggplot(df, aes(axis1 = A, axis2 = B, y = freq)) + geom_alluvium()
```

### Mistake 2: Not expanding the x-axis

Without `expand`, stratum labels get clipped at the plot edges.

```r
# Add expand to x axis
scale_x_discrete(limits = c("Stage1", "Stage2"), expand = c(0.15, 0.1))
```

### Mistake 3: Too many strata with similar sizes

When many categories have similar proportions, the strata look like equal-width stacks and the flows become indistinguishable. Consider merging small categories or using a different visualization for granular frequency tables.

### Mistake 4: Choosing Sankey for time series data

Sankey diagrams show static flows between nodes, not trends over time. For change over time, a line chart or bump chart is more appropriate.

### Mistake 5: Incorrect frequency format

Each row in your data must represent a unique combination of all axis variables, with `y` as the count for that combination. If rows represent individual observations, aggregate them first with `dplyr::count()`.

```r
# Aggregate first if needed
df_agg <- df |> count(var1, var2, var3, name = "freq")
```

## Practice Exercises

### Exercise 1: Hair and eye color flow

Using R's built-in `HairEyeColor` dataset, create an alluvial chart showing the flow from `Hair` color to `Eye` color, colored by `Eye` color. (Hint: `as.data.frame(HairEyeColor)` converts the table.)

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(ggalluvial)

df <- as.data.frame(HairEyeColor)

ggplot(df, aes(axis1 = Hair, axis2 = Eye, y = Freq, fill = Eye)) +
  geom_alluvium(alpha = 0.75) +
  geom_stratum(width = 1/3, fill = "white", color = "grey60") +
  geom_label(stat = "stratum",
             aes(label = after_stat(stratum)),
             size = 3.2, fill = "white") +
  scale_fill_manual(
    values = c(Brown = "#795548", Blue = "#2196F3",
               Hazel = "#8D6E63", Green = "#4CAF50")
  ) +
  scale_x_discrete(limits = c("Hair", "Eye"), expand = c(0.12, 0.1)) +
  labs(title = "Hair to Eye Color Distribution", y = "Frequency", fill = "Eye Color") +
  theme_minimal()
```

</details>

### Exercise 2: Three-way flow with gender

Extend Exercise 1 to add `Sex` as a third axis (`axis3`). Color by `Sex`. Do hair/eye patterns differ between males and females?

<details>
<summary>Show solution</summary>

```r
library(ggplot2)
library(ggalluvial)

df <- as.data.frame(HairEyeColor)

ggplot(df, aes(axis1 = Hair, axis2 = Eye, axis3 = Sex,
               y = Freq, fill = Sex)) +
  geom_alluvium(alpha = 0.7) +
  geom_stratum(width = 1/3, fill = "white", color = "grey60") +
  geom_label(stat = "stratum",
             aes(label = after_stat(stratum)),
             size = 3, fill = "white") +
  scale_fill_manual(values = c(Male = "#1565C0", Female = "#C62828")) +
  scale_x_discrete(limits = c("Hair", "Eye", "Sex"), expand = c(0.12, 0.1)) +
  labs(title = "Hair → Eye → Sex Distribution", y = "Frequency", fill = "Sex") +
  theme_minimal()
```

</details>

## Summary

| Geom | Purpose |
|---|---|
| `geom_alluvium()` | Full-width ribbons spanning all axes |
| `geom_flow()` | Short ribbons between adjacent axes only |
| `geom_stratum()` | Stacked rectangles at each axis |
| `geom_label(stat = "stratum")` | Auto-positioned stratum labels |
| `geom_text(stat = "stratum")` | Labels without boxes |

| Key aesthetic | Maps to |
|---|---|
| `axis1`, `axis2`, `axis3` | Categorical stages (left to right) |
| `y` | Flow width (required, usually a count/frequency) |
| `fill` | Color of ribbons (by origin, destination, or another variable) |

**Sankey vs alluvial:**
- **Alluvial**, multiple ordinal or time-ordered axes; data is a frequency table
- **Sankey**, arbitrary flow networks (energy, materials, processes); data is a directed edge list
- In R, `ggalluvial` handles alluvial charts; `networkD3::sankeyNetwork()` handles true Sankey networks

## FAQ

**What is the difference between geom_alluvium() and geom_flow()?**
`geom_alluvium()` draws ribbons spanning the entire chart from the first to the last axis. `geom_flow()` draws only the ribbons between adjacent axes. For many stages, `geom_flow()` is less tangled.

**Can I make an interactive Sankey diagram in R?**
Yes, the `networkD3` package creates interactive Sankey diagrams using D3.js. The `sankeyNetwork()` function takes a node and link data frame.

**How do I handle data that's already long format (one row per individual)?**
Aggregate first: `df |> count(stage1, stage2, stage3, name = "freq")`. Then use `freq` as the `y` aesthetic.

**Can I control the vertical order of strata?**
Yes, factor level order controls stratum order. Use `factor(var, levels = c("A", "B", "C"))` to set the order before plotting.

**Why do my labels overlap the stratum boxes?**
Increase the `expand` parameter in `scale_x_discrete()` to give more horizontal space at the chart edges: `expand = c(0.2, 0.15)`.

## References

- ggalluvial CRAN vignette: cran.r-project.org/web/packages/ggalluvial
- R Graph Gallery, Sankey diagram: r-graph-gallery.com/sankey-diagram.html
- Rosvall M. & Bergstrom C.T. (2010). Mapping Change in Large Networks. *PLoS ONE*.
- Wilke C. (2019). *Fundamentals of Data Visualization*, Chapter 12: Visualizing associations

## Continue Learning

- **ggplot2 Line Charts**, the go-to for trends over continuous time
- **R UpSet Plot**, visualize intersections across many sets
- **Treemap in R**, show proportions hierarchically in a single compact chart
