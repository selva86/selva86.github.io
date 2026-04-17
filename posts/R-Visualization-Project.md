---
title: "R Visualization Project: Reproduce 5 Real-World Charts from Scratch, Solved Step-by-Step"
slug: "R-Visualization-Project"
description: "Reproduce 5 iconic chart styles in R with ggplot2, Economist, FiveThirtyEight, journal figures, and more. Step-by-step starter code, hints, and full solutions."
keywords: "R visualization project, reproduce charts in R, ggplot2 chart styles, Economist chart ggplot2, FiveThirtyEight style R, publication-quality figures R, real-world charts ggplot2"
auto_link_terms: "R visualization project|reproduce charts in R|real-world charts ggplot2|chart reproduction ggplot2|recreate professional charts R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "E3.6"
post_type: "EX"
sidebar_section: "Practice Exercises"
sidebar_title: "R Visualization Project (5 charts)"
sidebar_order: 26
fr_parent: "Publication-Quality-Figures-in-R.html"
difficulty: "Intermediate"
---

# R Visualization Project: Reproduce 5 Real-World Charts from Scratch, Solved Step-by-Step

<p class="lead">The fastest way to level up your ggplot2 skills is to reproduce charts you admire. This project gives you 5 real-world chart styles, from The Economist to scientific journals, and walks you through rebuilding each one from scratch using only ggplot2 and built-in R datasets.</p>

## How Do You Recreate The Economist's Signature Scatter Plot?

The Economist's data team produces some of the most recognizable charts in journalism, clean scatter plots with a light blue-gray background, minimal gridlines, and bold titles positioned above the plot area. In this first project, you'll reproduce that signature look using the `mpg` dataset.

```r title="Economist-style engine-vs-MPG scatter"
library(ggplot2)
library(dplyr)
library(scales)

ggplot(mpg, aes(x = displ, y = hwy, color = class)) +
  geom_point(size = 2.5, alpha = 0.8) +
  scale_color_manual(values = c(
    "2seater" = "#01a2d9", "compact" = "#014d64",
    "midsize" = "#7a0177", "minivan" = "#ee8f71",
    "pickup" = "#76c0c1", "subcompact" = "#6794a7",
    "suv" = "#c23b22"
  )) +
  labs(
    title = "Engine Size vs. Highway Fuel Economy",
    subtitle = "Larger engines generally mean worse mileage, but vehicle class matters",
    x = "Engine displacement (litres)",
    y = "Highway MPG",
    caption = "Source: EPA fuel economy data | r-statistics.co"
  ) +
  theme(
    text = element_text(family = "sans"),
    plot.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.grid.major.y = element_line(color = "white", linewidth = 0.5),
    panel.grid.major.x = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line.x = element_line(color = "#333333", linewidth = 0.4),
    axis.ticks.y = element_blank(),
    axis.ticks.x = element_line(color = "#333333"),
    plot.title = element_text(face = "bold", size = 14, hjust = 0),
    plot.subtitle = element_text(size = 10, color = "#555555", hjust = 0),
    plot.caption = element_text(size = 8, color = "#888888", hjust = 0),
    legend.background = element_rect(fill = "#d5e4eb", color = NA),
    legend.key = element_rect(fill = "#d5e4eb", color = NA),
    legend.position = "right",
    legend.title = element_blank()
  )
#> A scatter plot with Economist-style blue-gray background,
#> horizontal white gridlines, and a curated 7-color palette.
#> SUVs and pickups cluster at high displacement / low MPG;
#> compact and subcompact cars sit at low displacement / high MPG.
```

That one block transforms a default scatter plot into something you'd see in a magazine. The secret ingredients are the light blue-gray background (`#d5e4eb`), white horizontal gridlines that float above it, and a carefully chosen color palette.

Let's break down the three key theme elements that do the heavy lifting.

**The background and gridlines** create the Economist's signature look. Setting both `plot.background` and `panel.background` to the same blue-gray means the chart and its margins blend together seamlessly. Then `panel.grid.major.y = element_line(color = "white")` draws white horizontal lines that appear to float.

**The axis treatment** is deliberately asymmetric. A thin dark line runs along the bottom x-axis (`axis.line.x`), while the y-axis has no line at all, only the white gridlines guide the eye. This pulls attention toward the data points rather than the chart frame.

**The text hierarchy** uses size and weight to create a visual pecking order. The title is bold and large, the subtitle is smaller and gray, and the caption sits quietly at the bottom left.

[KEY INSIGHT]
**theme() is the single function that separates amateur from professional charts.** Every publication style, Economist, NYT, FiveThirtyEight, is just a different combination of background colors, gridline visibility, axis lines, and font weights inside theme(). Master theme() and you can reproduce any style.

**Try it:** Modify the scatter plot to show `cty` (city MPG) on the y-axis instead of `hwy`, and add a subtitle that describes the city driving pattern.

```r title="Exercise: switch to city MPG"
# Try it: switch to city MPG
# Hint: change aes(y = ...) and update the subtitle text
ggplot(mpg, aes(x = displ, y = cty, color = class)) +
  geom_point(size = 2.5, alpha = 0.8) +
  # your theme code here
  theme_minimal()

#> Expected: same Economist styling but with cty on y-axis
```

<details>
<summary>Click to reveal solution</summary>

```r title="City-MPG solution"
ggplot(mpg, aes(x = displ, y = cty, color = class)) +
  geom_point(size = 2.5, alpha = 0.8) +
  scale_color_manual(values = c(
    "2seater" = "#01a2d9", "compact" = "#014d64",
    "midsize" = "#7a0177", "minivan" = "#ee8f71",
    "pickup" = "#76c0c1", "subcompact" = "#6794a7",
    "suv" = "#c23b22"
  )) +
  labs(
    title = "Engine Size vs. City Fuel Economy",
    subtitle = "City driving amplifies the gap — big engines drop below 15 MPG",
    x = "Engine displacement (litres)",
    y = "City MPG",
    caption = "Source: EPA fuel economy data | r-statistics.co"
  ) +
  theme(
    plot.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.grid.major.y = element_line(color = "white", linewidth = 0.5),
    panel.grid.major.x = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line.x = element_line(color = "#333333", linewidth = 0.4),
    axis.ticks.y = element_blank(),
    axis.ticks.x = element_line(color = "#333333"),
    plot.title = element_text(face = "bold", size = 14, hjust = 0),
    plot.subtitle = element_text(size = 10, color = "#555555", hjust = 0),
    plot.caption = element_text(size = 8, color = "#888888", hjust = 0),
    legend.background = element_rect(fill = "#d5e4eb", color = NA),
    legend.key = element_rect(fill = "#d5e4eb", color = NA),
    legend.position = "right",
    legend.title = element_blank()
  )
#> City MPG values are lower overall (10-35 range vs 12-44 for highway).
#> The spread within each class is wider for city driving.
```

**Explanation:** Swapping `hwy` for `cty` shifts the y-axis range down. City fuel economy has more variation, making class differences even more visible.

</details>

## How Do You Build a FiveThirtyEight-Style Bar Chart From Scratch?

FiveThirtyEight's charts are the opposite of flashy, a light gray background, no axis lines, no borders, bold headlines, and muted single-color fills. The design philosophy is "get out of the way and let the data speak." Let's recreate that with a bar chart showing vehicle class counts.

```r title="FiveThirtyEight-style bar chart"
class_counts <- mpg |>
  count(class) |>
  mutate(class = reorder(class, n))

ggplot(class_counts, aes(x = class, y = n)) +
  geom_col(fill = "#008fd5", width = 0.7) +
  labs(
    title = "SUVs Dominate the EPA Dataset",
    subtitle = "Number of vehicle models by class in the mpg dataset",
    caption = "Source: EPA fuel economy data | r-statistics.co"
  ) +
  theme(
    text = element_text(family = "sans"),
    plot.background = element_rect(fill = "#f0f0f0", color = NA),
    panel.background = element_rect(fill = "#f0f0f0", color = NA),
    panel.grid.major.x = element_blank(),
    panel.grid.major.y = element_line(color = "#cbcbcb", linewidth = 0.3),
    panel.grid.minor = element_blank(),
    axis.line = element_blank(),
    axis.ticks = element_blank(),
    axis.title = element_blank(),
    axis.text = element_text(size = 10, color = "#555555"),
    plot.title = element_text(face = "bold", size = 15, hjust = 0),
    plot.subtitle = element_text(size = 11, color = "#555555", hjust = 0),
    plot.caption = element_text(size = 8, color = "#999999", hjust = 0),
    plot.margin = margin(20, 20, 10, 20)
  )
#> A bar chart with FiveThirtyEight's signature gray background.
#> SUV has the tallest bar (~62 models), followed by compact (~47)
#> and midsize (~41). 2seater is the shortest (~5).
```

Two things make this instantly recognizable as FiveThirtyEight. First, *everything* non-essential is removed, no axis lines, no tick marks, no axis titles. The bars and subtle gray gridlines carry all the information. Second, the headline does the work of an axis title, "SUVs Dominate" tells the story, so a y-axis label saying "Count" would be redundant.

[TIP]
**Always reorder bars by value, not alphabetically.** The line `mutate(class = reorder(class, n))` sorts bars from shortest to tallest, which makes the chart immediately scannable. Alphabetical ordering forces readers to hunt for the largest category.

The color choice is deliberate too. FiveThirtyEight typically uses a single strong accent color (`#008fd5` is their signature blue) rather than mapping colors to categories. When every bar is the same color, the reader compares heights, which is the whole point of a bar chart.

[NOTE]
**axis.title = element_blank() removes both x and y axis titles at once.** For selective removal, use `axis.title.x = element_blank()` or `axis.title.y = element_blank()` individually. FiveThirtyEight charts almost always remove both because the headline does that job.

**Try it:** Flip the bar chart to horizontal orientation and highlight the tallest bar ("suv") in a darker shade while keeping the rest in the standard blue.

```r title="Exercise: horizontal bars with highlight"
# Try it: horizontal bars with highlight
# Hint: use coord_flip() and ifelse() inside aes(fill = ...)
ggplot(class_counts, aes(x = class, y = n)) +
  geom_col(width = 0.7) +
  # your code here
  theme_minimal()

#> Expected: horizontal bars, "suv" bar in darker blue
```

<details>
<summary>Click to reveal solution</summary>

```r title="Highlighted-bars solution"
ggplot(class_counts, aes(x = class, y = n,
                         fill = ifelse(class == "suv", "highlight", "normal"))) +
  geom_col(width = 0.7) +
  coord_flip() +
  scale_fill_manual(values = c("highlight" = "#003d5c", "normal" = "#008fd5"),
                    guide = "none") +
  labs(
    title = "SUVs Dominate the EPA Dataset",
    subtitle = "Number of vehicle models by class",
    caption = "Source: EPA fuel economy data | r-statistics.co"
  ) +
  theme(
    plot.background = element_rect(fill = "#f0f0f0", color = NA),
    panel.background = element_rect(fill = "#f0f0f0", color = NA),
    panel.grid.major.y = element_blank(),
    panel.grid.major.x = element_line(color = "#cbcbcb", linewidth = 0.3),
    panel.grid.minor = element_blank(),
    axis.line = element_blank(),
    axis.ticks = element_blank(),
    axis.title = element_blank(),
    axis.text = element_text(size = 10, color = "#555555"),
    plot.title = element_text(face = "bold", size = 15, hjust = 0),
    plot.subtitle = element_text(size = 11, color = "#555555", hjust = 0),
    plot.caption = element_text(size = 8, color = "#999999", hjust = 0)
  )
#> Horizontal bars. The "suv" bar is dark navy (#003d5c),
#> all others are the standard FiveThirtyEight blue.
```

**Explanation:** `coord_flip()` rotates the chart. The `ifelse()` inside `aes(fill = ...)` creates two groups, and `scale_fill_manual()` maps them to different blues. `guide = "none"` hides the legend since the highlight is self-explanatory.

</details>

## How Do You Design a Journal-Ready Scientific Figure?

Scientific journals demand a specific aesthetic: white backgrounds, minimal decoration, black or gray color schemes, and properly labeled axes with units. Reviewers will reject figures with rainbow palettes or missing axis labels. Let's build one using the `iris` dataset.

```r title="Journal-ready iris scatter"
ggplot(iris, aes(x = Petal.Length, y = Petal.Width, color = Species, shape = Species)) +
  geom_point(size = 2, alpha = 0.7) +
  scale_color_manual(values = c(
    "setosa" = "#000000",
    "versicolor" = "#666666",
    "virginica" = "#aaaaaa"
  )) +
  scale_shape_manual(values = c(16, 17, 15)) +
  labs(
    x = "Petal length (cm)",
    y = "Petal width (cm)",
    color = "Species",
    shape = "Species"
  ) +
  theme_classic(base_size = 12) +
  theme(
    axis.title = element_text(size = 12, face = "bold"),
    axis.text = element_text(size = 10, color = "black"),
    axis.line = element_line(linewidth = 0.5, color = "black"),
    axis.ticks = element_line(linewidth = 0.4, color = "black"),
    legend.position = c(0.15, 0.85),
    legend.background = element_rect(fill = "white", color = "gray80", linewidth = 0.3),
    legend.key.size = unit(0.4, "cm"),
    legend.text = element_text(face = "italic", size = 10),
    legend.title = element_text(face = "bold", size = 10),
    plot.margin = margin(10, 15, 10, 10)
  )
#> A clean journal-style scatter plot on a white background.
#> Three species form distinct clusters along the diagonal.
#> Setosa (black circles) clusters at low values;
#> virginica (gray squares) occupies the upper-right.
```

Notice what's *different* from the Economist and FiveThirtyEight styles. There's no background color, no gridlines, and no headline, journal figures rely on figure captions below the chart, not titles inside it. The axis labels include units in parentheses because a reviewer will flag "Petal length" without "(cm)".

The grayscale palette isn't just an aesthetic choice, many journals still print in black and white. Using different shapes (`scale_shape_manual`) alongside color ensures the three species stay distinguishable even without color.

[WARNING]
**Most journals require 300 DPI minimum for figures.** When saving with ggsave(), always set `dpi = 300` (or 600 for line art). The default 72 DPI looks fine on screen but will appear blurry in print. Use `ggsave("fig1.pdf", width = 6, height = 4, dpi = 300)` for vector output.

`theme_classic()` gives you the perfect starting point, a white background with axis lines and no gridlines. From there, you only need to adjust font sizes, add bold axis labels, and position the legend inside the plot area to save space.

**Try it:** Add a linear regression line for each species using `geom_smooth()`, and move the legend from upper-left to bottom-right.

```r title="Exercise: regression lines and legend"
# Try it: add regression lines + move legend
# Hint: geom_smooth(method = "lm", se = FALSE) and legend.position = c(x, y)
ggplot(iris, aes(x = Petal.Length, y = Petal.Width, color = Species)) +
  geom_point(size = 2, alpha = 0.7) +
  # your code here
  theme_classic()

#> Expected: three regression lines, legend at bottom-right
```

<details>
<summary>Click to reveal solution</summary>

```r title="Regression-lines solution"
ggplot(iris, aes(x = Petal.Length, y = Petal.Width,
                 color = Species, shape = Species)) +
  geom_point(size = 2, alpha = 0.7) +
  geom_smooth(method = "lm", se = FALSE, linewidth = 0.8) +
  scale_color_manual(values = c(
    "setosa" = "#000000", "versicolor" = "#666666", "virginica" = "#aaaaaa"
  )) +
  scale_shape_manual(values = c(16, 17, 15)) +
  labs(x = "Petal length (cm)", y = "Petal width (cm)") +
  theme_classic(base_size = 12) +
  theme(
    axis.title = element_text(size = 12, face = "bold"),
    axis.text = element_text(size = 10, color = "black"),
    legend.position = c(0.85, 0.2),
    legend.background = element_rect(fill = "white", color = "gray80"),
    legend.text = element_text(face = "italic", size = 10)
  )
#> Three species each get their own regression line.
#> Setosa has the steepest slope; virginica the shallowest.
#> Legend now sits in the bottom-right corner.
```

**Explanation:** `geom_smooth(method = "lm", se = FALSE)` adds ordinary least squares lines without confidence bands. Moving `legend.position` to `c(0.85, 0.2)` places it in normalized plot coordinates (85% right, 20% up).

</details>

## How Do You Reproduce a New York Times Annotated Line Chart?

The New York Times data visualization team pioneered a style where annotations replace legends entirely. Instead of a color key off to the side, labels sit directly on or next to the data lines. The result is a chart that reads like a paragraph, your eye follows the line and picks up context as it goes. Let's recreate this with unemployment data.

```r title="NYT annotated unemployment chart"
recessions <- data.frame(
  start = as.Date(c("2001-03-01", "2007-12-01")),
  end = as.Date(c("2001-11-01", "2009-06-01")),
  label = c("Dot-com\nrecession", "Great\nRecession")
)

ggplot(economics, aes(x = date, y = unemploy / 1000)) +
  geom_rect(data = recessions,
            aes(xmin = start, xmax = end, ymin = -Inf, ymax = Inf),
            inherit.aes = FALSE, fill = "#f0e0e0", alpha = 0.6) +
  geom_line(color = "#e41a1c", linewidth = 0.8) +
  annotate("text", x = as.Date("2001-07-01"), y = 14,
           label = "Dot-com\nrecession", size = 3, color = "#888888",
           lineheight = 0.9) +
  annotate("text", x = as.Date("2008-09-01"), y = 14.5,
           label = "Great\nRecession", size = 3, color = "#888888",
           lineheight = 0.9) +
  annotate("text", x = as.Date("2010-06-01"), y = 15.5,
           label = "Peak: 15.4 million\nunemployed (Oct 2009)",
           size = 3.2, color = "#333333", fontface = "bold",
           lineheight = 0.9, hjust = 0) +
  scale_x_date(date_breaks = "5 years", date_labels = "%Y",
               limits = as.Date(c("1995-01-01", "2015-06-01"))) +
  scale_y_continuous(labels = label_comma(suffix = "M")) +
  labs(
    title = "U.S. Unemployment Surged After Two Recessions",
    subtitle = "Total unemployed persons, in millions (1995-2015)",
    caption = "Source: U.S. Bureau of Labor Statistics via ggplot2::economics | r-statistics.co"
  ) +
  theme(
    text = element_text(family = "sans"),
    plot.background = element_rect(fill = "white", color = NA),
    panel.background = element_rect(fill = "white", color = NA),
    panel.grid.major.y = element_line(color = "#e0e0e0", linewidth = 0.3),
    panel.grid.major.x = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line.x = element_line(color = "#333333", linewidth = 0.3),
    axis.ticks.x = element_line(color = "#333333"),
    axis.ticks.y = element_blank(),
    axis.title = element_blank(),
    axis.text = element_text(size = 10, color = "#555555"),
    plot.title = element_text(face = "bold", size = 14, hjust = 0),
    plot.subtitle = element_text(size = 10, color = "#666666", hjust = 0),
    plot.caption = element_text(size = 8, color = "#999999", hjust = 0),
    plot.margin = margin(15, 20, 10, 10)
  )
#> A line chart showing U.S. unemployment from 1995-2015.
#> Two shaded pink rectangles mark the recession periods.
#> The line rises sharply during 2008-2009, peaking at 15.4M.
#> Annotations label each recession and the peak directly on the chart.
```

Three techniques make this chart feel like the NYT. First, `geom_rect()` draws shaded bands behind the line to mark recession periods, the pink rectangles give instant context without requiring the reader to look up dates. Second, `annotate("text")` places labels directly on the chart instead of relying on a separate legend. Third, the bold peak label ("Peak: 15.4 million") tells the reader the most important number without making them trace the line to the exact point.

[KEY INSIGHT]
**Replace legends with direct labels whenever you have 1-3 data series.** Legends force readers to look away from the data, match a color, then look back. Direct annotations like "Great Recession" placed right next to the relevant area eliminate that back-and-forth entirely. This is the core NYT design principle.

[NOTE]
**The `economics` dataset comes bundled with ggplot2.** It contains monthly U.S. economic data from 1967-2015 with columns for date, personal consumption, population, personal savings rate, unemployment duration, and number of unemployed. It's perfect for time series practice.

**Try it:** Add an annotation with an arrow pointing to the lowest unemployment point in the 1995-2015 window. Use `annotate("segment")` to draw the arrow.

```r title="Exercise: annotate the minimum"
# Try it: annotate the minimum unemployment point
# Hint: find the min, then use annotate("segment", ..., arrow = arrow())
# and annotate("text", ...) to label it

#> Expected: an arrow pointing to the lowest point with a label like "Low: 5.7M (Apr 2000)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Min-annotation solution"
econ_subset <- economics |>
  filter(date >= as.Date("1995-01-01") & date <= as.Date("2015-06-01"))
min_point <- econ_subset |> filter(unemploy == min(unemploy))

ggplot(econ_subset, aes(x = date, y = unemploy / 1000)) +
  geom_rect(data = recessions,
            aes(xmin = start, xmax = end, ymin = -Inf, ymax = Inf),
            inherit.aes = FALSE, fill = "#f0e0e0", alpha = 0.6) +
  geom_line(color = "#e41a1c", linewidth = 0.8) +
  annotate("segment",
           x = as.Date("2002-01-01"), xend = min_point$date,
           y = 5, yend = min_point$unemploy / 1000 + 0.2,
           arrow = arrow(length = unit(0.15, "cm")), color = "#333333") +
  annotate("text", x = as.Date("2002-06-01"), y = 4.7,
           label = paste0("Low: ", round(min_point$unemploy / 1000, 1),
                          "M (", format(min_point$date, "%b %Y"), ")"),
           size = 3.2, color = "#333333", fontface = "bold", hjust = 0) +
  scale_x_date(date_breaks = "5 years", date_labels = "%Y") +
  scale_y_continuous(labels = label_comma(suffix = "M")) +
  labs(title = "U.S. Unemployment: From Record Low to Crisis",
       subtitle = "Total unemployed persons, in millions") +
  theme(
    panel.background = element_rect(fill = "white", color = NA),
    panel.grid.major.y = element_line(color = "#e0e0e0", linewidth = 0.3),
    panel.grid.major.x = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line.x = element_line(color = "#333333", linewidth = 0.3),
    axis.ticks.y = element_blank(),
    axis.title = element_blank(),
    plot.title = element_text(face = "bold", size = 14),
    plot.subtitle = element_text(size = 10, color = "#666666")
  )
#> An arrow points to the minimum unemployment point (around April 2000).
#> The label reads "Low: 5.7M (Apr 2000)" next to the arrow.
```

**Explanation:** `annotate("segment", ..., arrow = arrow())` draws a line with an arrowhead. The `x`/`y` pair sets the label end, and `xend`/`yend` sets the arrow tip pointing at the data.

</details>

## How Do You Create a Modern Lollipop Chart for Data Journalism?

Lollipop charts are bar charts' sleeker cousin, a thin segment topped with a dot. They work especially well when you have many categories with similar values, because the dots are easier to compare than thick bar edges. Modern data journalism sites use them frequently for rankings. Let's build one with the top 15 most fuel-efficient cars in `mtcars`.

```r title="Lollipop chart for top MPG cars"
top_cars <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  arrange(desc(mpg)) |>
  head(15) |>
  mutate(
    car = reorder(car, mpg),
    highlight = ifelse(mpg == max(mpg), "best", "other")
  )

ggplot(top_cars, aes(x = car, y = mpg)) +
  geom_segment(aes(xend = car, y = 0, yend = mpg, color = highlight),
               linewidth = 0.8) +
  geom_point(aes(color = highlight), size = 3.5) +
  scale_color_manual(values = c("best" = "#e41a1c", "other" = "#4292c6"),
                     guide = "none") +
  coord_flip() +
  labs(
    title = "Most Fuel-Efficient Cars in mtcars",
    subtitle = "Miles per gallon — the Toyota Corolla leads the pack",
    caption = "Source: 1974 Motor Trend magazine | r-statistics.co"
  ) +
  theme(
    plot.background = element_rect(fill = "#fafafa", color = NA),
    panel.background = element_rect(fill = "#fafafa", color = NA),
    panel.grid.major.x = element_line(color = "#e8e8e8", linewidth = 0.3),
    panel.grid.major.y = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line = element_blank(),
    axis.ticks = element_blank(),
    axis.title = element_blank(),
    axis.text.y = element_text(size = 9, color = "#333333"),
    axis.text.x = element_text(size = 9, color = "#777777"),
    plot.title = element_text(face = "bold", size = 14, hjust = 0),
    plot.subtitle = element_text(size = 10, color = "#555555", hjust = 0),
    plot.caption = element_text(size = 8, color = "#999999", hjust = 0),
    plot.margin = margin(15, 20, 10, 10)
  )
#> A horizontal lollipop chart ranking 15 cars by MPG.
#> Toyota Corolla (33.9 mpg) is highlighted in red at the top.
#> All other cars appear in blue, creating a clear visual focal point.
#> The thin segments and dots make small differences easy to compare.
```

[NOTE]
**coord_flip() swaps x and y axes without changing your aes() mapping.** You still define `aes(x = car, y = mpg)` as if the chart were vertical, and coord_flip() rotates the entire thing. This makes it easy to switch between horizontal and vertical layouts without rewriting your aesthetics.

The lollipop chart solves a specific problem: when you have 10+ categories, thick bars create visual clutter. The thin segment + dot combination reduces ink and draws the eye to the endpoints, which is where the actual comparison happens.

The highlight strategy is key to data journalism. Instead of coloring all 15 cars differently (which would overwhelm the reader), we use just two colors: red for the leader and blue for everyone else. The subtitle reinforces this, "the Toyota Corolla leads the pack", so the visual and textual stories align.

[TIP]
**Use lollipop charts instead of bar charts when you have more than 8-10 categories or when values are close together.** Thin segments reduce visual clutter, and the dots make it easier to compare endpoints. For fewer categories or large value differences, stick with bars, they're more familiar.

**Try it:** Instead of highlighting just the top car, highlight the top 3 cars in red and keep the rest in blue.

```r title="Exercise: highlight top three"
# Try it: highlight top 3 cars
# Hint: change the ifelse() condition to use rank() or row_number()
top_cars <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  arrange(desc(mpg)) |>
  head(15) |>
  mutate(car = reorder(car, mpg))

# Modify highlight logic for top 3:
# your code here

#> Expected: top 3 cars in red, remaining 12 in blue
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top-three solution"
ex_top_cars <- mtcars |>
  mutate(car = rownames(mtcars)) |>
  arrange(desc(mpg)) |>
  head(15) |>
  mutate(
    car = reorder(car, mpg),
    highlight = ifelse(row_number() <= 3, "top3", "other")
  )

ggplot(ex_top_cars, aes(x = car, y = mpg)) +
  geom_segment(aes(xend = car, y = 0, yend = mpg, color = highlight),
               linewidth = 0.8) +
  geom_point(aes(color = highlight), size = 3.5) +
  scale_color_manual(values = c("top3" = "#e41a1c", "other" = "#4292c6"),
                     guide = "none") +
  coord_flip() +
  labs(
    title = "Top 15 Fuel-Efficient Cars",
    subtitle = "Top 3 highlighted — all exceed 30 MPG"
  ) +
  theme(
    plot.background = element_rect(fill = "#fafafa", color = NA),
    panel.background = element_rect(fill = "#fafafa", color = NA),
    panel.grid.major.x = element_line(color = "#e8e8e8", linewidth = 0.3),
    panel.grid.major.y = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line = element_blank(),
    axis.ticks = element_blank(),
    axis.title = element_blank(),
    plot.title = element_text(face = "bold", size = 14),
    plot.subtitle = element_text(size = 10, color = "#555555")
  )
#> Top 3 cars (Toyota Corolla, Fiat 128, Honda Civic) appear in red.
#> The remaining 12 cars are in blue.
```

**Explanation:** After `arrange(desc(mpg))`, `row_number() <= 3` correctly identifies the three highest-MPG cars. The reorder by mpg ensures they appear at the top of the horizontal chart.

</details>

## Practice Exercises

### Exercise 1: Economist-Style Box Plot

Create an Economist-style box plot showing highway MPG (`hwy`) by vehicle `class` from the `mpg` dataset. Requirements:

- Use the blue-gray background (`#d5e4eb`) with white horizontal gridlines
- Sort classes by median hwy (highest first) using `reorder()`
- Add a bold title: "Highway Fuel Economy Varies Widely by Vehicle Class"
- Add a subtitle and source caption
- Use a single fill color (`#01a2d9`) for all boxes

```r title="Exercise: Economist-style box plot"
# Exercise 1: Economist-style box plot
# Hint: reorder(class, hwy, FUN = median) sorts by median
# Hint: coord_flip() makes horizontal boxes easier to read

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Box-plot solution"
ggplot(mpg, aes(x = reorder(class, hwy, FUN = median), y = hwy)) +
  geom_boxplot(fill = "#01a2d9", color = "#014d64", alpha = 0.8,
               outlier.color = "#c23b22", outlier.size = 2) +
  coord_flip() +
  labs(
    title = "Highway Fuel Economy Varies Widely by Vehicle Class",
    subtitle = "Distribution of highway MPG — compact and subcompact lead",
    caption = "Source: EPA fuel economy data | r-statistics.co"
  ) +
  theme(
    plot.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.grid.major.x = element_line(color = "white", linewidth = 0.5),
    panel.grid.major.y = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line.y = element_blank(),
    axis.line.x = element_line(color = "#333333", linewidth = 0.4),
    axis.ticks.y = element_blank(),
    axis.ticks.x = element_line(color = "#333333"),
    axis.title = element_blank(),
    axis.text = element_text(size = 10, color = "#333333"),
    plot.title = element_text(face = "bold", size = 14, hjust = 0),
    plot.subtitle = element_text(size = 10, color = "#555555", hjust = 0),
    plot.caption = element_text(size = 8, color = "#666666", hjust = 0),
    plot.margin = margin(15, 20, 10, 10)
  )
#> Horizontal box plots sorted by median highway MPG.
#> Compact and subcompact sit at the top with medians around 28-29 MPG.
#> Pickups and SUVs cluster at the bottom, around 17-18 MPG.
#> Outliers appear as red dots.
```

**Explanation:** `reorder(class, hwy, FUN = median)` sorts classes by their median highway MPG. `coord_flip()` makes the box plots horizontal, which is easier to read with text labels. The Economist theme elements, blue-gray background, white gridlines, no y-axis line, carry over directly from the scatter plot project.

</details>

### Exercise 2: Side-by-Side Panel, Two Styles, One Dataset

Create a two-panel figure using `mpg` data. The left panel is a FiveThirtyEight-style bar chart of average highway MPG by class. The right panel is a journal-style scatter plot of `displ` vs `hwy`. Arrange them side by side using `gridExtra::grid.arrange()` or by saving each plot to a variable and printing them.

```r title="Exercise: two-panel figure"
# Exercise 2: Two-panel figure
# Hint: save each ggplot to a variable (p1, p2)
# Hint: print them separately since WebR renders one plot at a time
# Panel 1: FiveThirtyEight bar chart of mean hwy by class
# Panel 2: Journal-style scatter of displ vs hwy

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-panel solution part one"
# Panel 1: FiveThirtyEight-style bar chart
my_means <- mpg |>
  group_by(class) |>
  summarise(avg_hwy = mean(hwy)) |>
  mutate(class = reorder(class, avg_hwy))

my_p1 <- ggplot(my_means, aes(x = class, y = avg_hwy)) +
  geom_col(fill = "#008fd5", width = 0.7) +
  coord_flip() +
  labs(title = "Average Highway MPG by Class") +
  theme(
    plot.background = element_rect(fill = "#f0f0f0", color = NA),
    panel.background = element_rect(fill = "#f0f0f0", color = NA),
    panel.grid.major.x = element_line(color = "#cbcbcb", linewidth = 0.3),
    panel.grid.major.y = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line = element_blank(),
    axis.ticks = element_blank(),
    axis.title = element_blank(),
    plot.title = element_text(face = "bold", size = 12)
  )
print(my_p1)
#> FiveThirtyEight-style horizontal bar chart.
#> Compact class has the highest average (~28 MPG).
```

```r title="Two-panel solution part two"
# Panel 2: Journal-style scatter plot
my_p2 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(size = 1.8, alpha = 0.6, color = "black") +
  geom_smooth(method = "lm", se = TRUE, color = "black", linewidth = 0.7) +
  labs(x = "Engine displacement (L)", y = "Highway MPG (miles/gallon)") +
  theme_classic(base_size = 11) +
  theme(
    axis.title = element_text(face = "bold"),
    axis.text = element_text(color = "black"),
    plot.title = element_text(face = "bold", size = 12)
  ) +
  labs(title = "Displacement vs. Highway MPG")
print(my_p2)
#> Journal-style scatter with a linear regression line and
#> confidence band. Clear negative trend — larger engines,
#> lower MPG.
```

**Explanation:** Each panel is saved as a variable and printed separately. The FiveThirtyEight panel uses the gray-background, no-border style. The journal panel uses `theme_classic()` with bold axis labels and a regression line. In a local R session, you'd use `gridExtra::grid.arrange(my_p1, my_p2, ncol = 2)` to place them side by side.

</details>

### Exercise 3: Annotated Time Series with Two Metrics

Using the `economics` dataset, create an NYT-style chart that shows both unemployment count (`unemploy`) and personal savings rate (`psavert`) over the 2000-2015 period. Since these have different scales, normalize both to a 0-1 range so they can share the y-axis. Add recession shading and direct labels for each line (no legend).

```r title="Exercise: dual-metric time series"
# Exercise 3: Dual-metric annotated time series
# Hint: use scale() or rescale to a 0-1 range
# Hint: annotate() with text labels at the right end of each line
# Hint: use the recessions data frame from earlier

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Dual-metric solution"
my_econ <- economics |>
  filter(date >= as.Date("2000-01-01") & date <= as.Date("2015-01-01")) |>
  mutate(
    unemploy_norm = (unemploy - min(unemploy)) / (max(unemploy) - min(unemploy)),
    psavert_norm = (psavert - min(psavert)) / (max(psavert) - min(psavert))
  )

my_recessions <- data.frame(
  start = as.Date(c("2001-03-01", "2007-12-01")),
  end = as.Date(c("2001-11-01", "2009-06-01"))
)

ggplot(my_econ, aes(x = date)) +
  geom_rect(data = my_recessions,
            aes(xmin = start, xmax = end, ymin = -Inf, ymax = Inf),
            inherit.aes = FALSE, fill = "#f0e0e0", alpha = 0.6) +
  geom_line(aes(y = unemploy_norm), color = "#e41a1c", linewidth = 0.8) +
  geom_line(aes(y = psavert_norm), color = "#377eb8", linewidth = 0.8) +
  annotate("text", x = as.Date("2014-06-01"), y = 0.38,
           label = "Unemployment", color = "#e41a1c", fontface = "bold",
           size = 3.5, hjust = 0) +
  annotate("text", x = as.Date("2014-06-01"), y = 0.18,
           label = "Savings rate", color = "#377eb8", fontface = "bold",
           size = 3.5, hjust = 0) +
  scale_y_continuous(labels = scales::percent_format()) +
  scale_x_date(date_breaks = "3 years", date_labels = "%Y") +
  labs(
    title = "Unemployment and Savings Moved in Opposite Directions",
    subtitle = "Both metrics normalized to 0-1 scale (2000-2015)",
    caption = "Source: BLS via ggplot2::economics | r-statistics.co"
  ) +
  theme(
    plot.background = element_rect(fill = "white", color = NA),
    panel.background = element_rect(fill = "white", color = NA),
    panel.grid.major.y = element_line(color = "#e0e0e0", linewidth = 0.3),
    panel.grid.major.x = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line.x = element_line(color = "#333333", linewidth = 0.3),
    axis.ticks.y = element_blank(),
    axis.title = element_blank(),
    plot.title = element_text(face = "bold", size = 13),
    plot.subtitle = element_text(size = 10, color = "#666666"),
    plot.caption = element_text(size = 8, color = "#999999")
  )
#> Two lines on a shared normalized axis.
#> Red (unemployment) rises sharply during 2008-2010.
#> Blue (savings rate) also spikes during the Great Recession,
#> then gradually declines. Direct labels replace the legend.
```

**Explanation:** Min-max normalization `(x - min) / (max - min)` maps both metrics to a 0-1 range so they share the same y-axis. Direct `annotate("text")` labels at the right end of each line replace a traditional legend, following the NYT convention. The recession shading reuses the same `geom_rect()` technique from the earlier project.

</details>

## Complete Example

Let's build one more chart from a blank canvas to a polished final product, applying everything you've learned. We'll create an Economist-style grouped bar chart showing average highway MPG by vehicle class, comparing 1999 vs 2008 model years.

```r title="Economist-style grouped bar chart"
year_class <- mpg |>
  group_by(year, class) |>
  summarise(avg_hwy = mean(hwy), .groups = "drop") |>
  mutate(
    class = reorder(class, avg_hwy, FUN = max),
    year = factor(year)
  )

ggplot(year_class, aes(x = class, y = avg_hwy, fill = year)) +
  geom_col(position = position_dodge(width = 0.8), width = 0.7) +
  scale_fill_manual(values = c("1999" = "#6794a7", "2008" = "#014d64")) +
  labs(
    title = "Fuel Economy Improved Modestly Between 1999 and 2008",
    subtitle = "Average highway MPG by vehicle class and model year",
    fill = "Model year",
    caption = "Source: EPA fuel economy data | r-statistics.co"
  ) +
  theme(
    plot.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.background = element_rect(fill = "#d5e4eb", color = NA),
    panel.grid.major.y = element_line(color = "white", linewidth = 0.5),
    panel.grid.major.x = element_blank(),
    panel.grid.minor = element_blank(),
    axis.line.x = element_line(color = "#333333", linewidth = 0.4),
    axis.ticks.y = element_blank(),
    axis.ticks.x = element_line(color = "#333333"),
    axis.title = element_blank(),
    axis.text = element_text(size = 10, color = "#333333"),
    plot.title = element_text(face = "bold", size = 14, hjust = 0),
    plot.subtitle = element_text(size = 10, color = "#555555", hjust = 0),
    plot.caption = element_text(size = 8, color = "#666666", hjust = 0),
    legend.background = element_rect(fill = "#d5e4eb", color = NA),
    legend.key = element_rect(fill = "#d5e4eb", color = NA),
    legend.position = "top",
    legend.justification = "left",
    legend.title = element_text(face = "bold", size = 9),
    legend.text = element_text(size = 9),
    plot.margin = margin(20, 20, 10, 15)
  )
#> Grouped bar chart with Economist-style blue-gray background.
#> Light blue bars (1999) sit next to dark blue bars (2008) for each class.
#> Subcompact shows the biggest improvement (~2 MPG gain).
#> SUVs and pickups remain low (~17-18 MPG) in both years.
#> The legend sits top-left, labeling "1999" and "2008".
```

This chart combines several techniques from the project: the Economist blue-gray background, white gridlines, bold title hierarchy, and no axis titles (the subtitle does that job). The grouped bars use `position_dodge()` for side-by-side comparison, and the two-tone blue palette keeps the color scheme coherent with the background.

The title does something important, it tells the story ("Improved Modestly") rather than just describing the chart ("Highway MPG by Class and Year"). The reader knows the conclusion before they even look at the bars, and the bars serve as evidence.

[TIP]
**Storytelling titles outperform descriptive titles.** Compare "Fuel Economy by Class" (descriptive) vs. "Fuel Economy Improved Modestly Between 1999 and 2008" (storytelling). The second one tells readers what to look for, making the chart instantly more useful. Use this technique in every publication-style chart.

## Summary

| Chart Style | Key Theme Elements | Best For | Core Technique |
|---|---|---|---|
| The Economist | Blue-gray background, white gridlines, bold title | Scatter plots, line charts | Custom `theme()` with `#d5e4eb` fill |
| FiveThirtyEight | Gray background, no axis lines, single fill color | Bar charts, rankings | Remove all borders, let headline tell the story |
| Scientific Journal | White background, axis lines, grayscale palette | Any chart for publication | `theme_classic()` + bold axis labels with units |
| New York Times | White background, direct annotations, shaded regions | Time series, event data | `annotate()` + `geom_rect()` for context |
| Modern Lollipop | Minimal background, segment + dot, highlight strategy | Rankings, many categories | `geom_segment()` + `geom_point()` + `coord_flip()` |

[KEY INSIGHT]
**Every professional chart style is just a different answer to the same question: "What can I remove?"** The Economist removes vertical gridlines. FiveThirtyEight removes axis lines. Journals remove background color. The NYT removes legends. Start with a default ggplot and practice removing elements one at a time, you'll converge on a professional look faster than adding decorations.

The common thread across all five styles: **remove everything that doesn't help the reader understand the data faster.** Every gridline, axis tick, border, and color choice either earns its place by adding clarity, or it gets cut.

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). [Link](https://ggplot2-book.org/)
2. ggplot2 documentation, theme() reference. [Link](https://ggplot2.tidyverse.org/reference/theme.html)
3. Scherer, C., A ggplot2 Tutorial for Beautiful Plotting in R (2019). [Link](https://www.cedricscherer.com/2019/08/05/a-ggplot2-tutorial-for-beautiful-plotting-in-r/)
4. The R Graph Gallery, ggplot2 examples. [Link](https://r-graph-gallery.com/ggplot2-package.html)
5. Schwabish, J., *Better Data Visualizations*. Columbia University Press (2021).
6. Wilke, C., *Fundamentals of Data Visualization*. O'Reilly (2019). [Link](https://clauswilke.com/dataviz/)
7. R Core Team, *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

1. [Publication-Quality Figures in R](Publication-Quality-Figures-in-R.html), The complete checklist for making ggplot2 figures journal- and thesis-ready.
2. [ggplot2 Customization Exercises](ggplot2-Customization-Exercises.html), 10 theme and scale practice problems to sharpen your styling skills.
3. [ggplot2 Facet Exercises](ggplot2-Facet-Exercises.html), 8 facet_wrap() and facet_grid() problems for multi-panel layouts.
