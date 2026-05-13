---
title: "plotly Exercises in R: 20 Real-World Practice Problems"
slug: "plotly-Exercises-in-R"
description: "Practice plotly in R with 20 scenario-based exercises: scatter, bar, layout, subplots, hover, animation, ggplotly, 3D, heatmap, candlestick. Hidden solutions."
keywords: "plotly R exercises, plotly practice R, interactive plots R, ggplotly exercises, plotly subplot R, plotly animation R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "plotly Exercises"
sidebar_order: 150
fr_parent: "R-Tutorial.html"
auto_link_terms: "plotly r exercises|plotly practice r|interactive plots r|ggplotly exercises|plotly subplot|plotly animation"
auto_link_case_sensitive: false
target_keyword: "plotly R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# plotly Exercises in R: 20 Real-World Practice Problems

<p class="lead">Twenty scenario-based plotly exercises grouped into five themed sections covering first plots, layout and styling, multi-trace and subplots, interactivity (hover, animation, range slider, dropdown), and advanced chart types (ggplotly, 3D, heatmap, candlestick). Every problem ships with an expected result so you can verify, and solutions stay hidden behind reveal toggles so you actually try first.</p>

```r title="Run this once before any exercise"
library(plotly)
library(dplyr)
library(ggplot2)
library(tibble)
library(tidyr)
```

## Section 1. First plots with plot_ly (4 problems)

### Exercise 1.1: Draw a basic scatter of mpg vs horsepower

**Task:** Build a basic interactive scatter plot of `mpg` against `hp` from the built-in `mtcars` dataset using `plot_ly()` with `type = "scatter"` and `mode = "markers"`. No styling yet, just the core call. Save the figure object to `ex_1_1`.

**Expected result:**

```
# Interactive scatter plot: 32 markers
# x-axis: hp (52 to 335)
# y-axis: mpg (10.4 to 33.9)
# default blue circle markers, hover shows x and y values
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- plot_ly(
  data = mtcars,
  x = ~hp,
  y = ~mpg,
  type = "scatter",
  mode = "markers"
)
ex_1_1
```

**Explanation:** The `~` prefix is a one-sided formula that tells plotly to look up the column inside the `data` argument. Without it, you would need `x = mtcars$hp`. Setting `type` and `mode` explicitly avoids the warning plotly emits when it has to guess the chart type. Markers is the default mode for scatter, but being explicit pays off the moment you add `mode = "markers+lines"`.

</details>

### Exercise 1.2: Bar chart of car counts by cylinder

**Task:** A product manager wants a quick interactive bar chart showing how many cars in `mtcars` have each cylinder count (4, 6, or 8). First build a small counts tibble with `dplyr::count()`, then pass it to `plot_ly()` with `type = "bar"`. Save to `ex_1_2`.

**Expected result:**

```
# Interactive bar chart with 3 bars
# x-axis: cyl categories (4, 6, 8)
# y-axis: n (counts) showing 11, 7, 14
# default blue bars, hover shows category and count
```

**Difficulty:** Beginner

```r title="Your turn"
cyl_counts <- mtcars |> count(cyl)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cyl_counts <- mtcars |> count(cyl)

ex_1_2 <- plot_ly(
  data = cyl_counts,
  x = ~factor(cyl),
  y = ~n,
  type = "bar"
)
ex_1_2
```

**Explanation:** Wrapping `cyl` in `factor()` forces plotly to treat the axis as categorical; otherwise plotly sees the numeric 4, 6, 8 and draws gaps proportional to numeric distance, which looks odd for three discrete groups. For a bar chart you almost always want categorical x. `count()` is the tidy shortcut for `group_by() |> summarise(n = n())`.

</details>

### Exercise 1.3: Line plot of the AirPassengers time series

**Task:** Visualise the classic `AirPassengers` monthly time series as an interactive line. Convert the ts object to a tibble with a Date column, then call `plot_ly()` with `type = "scatter"` and `mode = "lines"`. The reader should see the upward trend and seasonal swings. Save to `ex_1_3`.

**Expected result:**

```
# Interactive line chart, 144 monthly points (1949-01 to 1960-12)
# x-axis: date
# y-axis: passengers (104 to 622)
# clear upward trend with annual seasonality, hover shows date and passenger count
```

**Difficulty:** Beginner

```r title="Your turn"
ap <- tibble(
  date = seq(as.Date("1949-01-01"), as.Date("1960-12-01"), by = "month"),
  passengers = as.numeric(AirPassengers)
)

ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ap <- tibble(
  date = seq(as.Date("1949-01-01"), as.Date("1960-12-01"), by = "month"),
  passengers = as.numeric(AirPassengers)
)

ex_1_3 <- plot_ly(
  data = ap,
  x = ~date,
  y = ~passengers,
  type = "scatter",
  mode = "lines"
)
ex_1_3
```

**Explanation:** plotly does not accept ts objects directly, which is why we build a tibble first. Using a real Date column unlocks the smart range-zoom toolbar and pretty date ticks. The combo `type = "scatter"` plus `mode = "lines"` is the idiomatic recipe for a line chart; there is no separate `type = "line"`.

</details>

### Exercise 1.4: Colour scatter points by gear count

**Task:** An analyst exploring `mtcars` wants the same `mpg` vs `wt` scatter but with markers coloured by `gear` (3, 4, or 5) so the gear-vs-weight story pops. Use the `color` aesthetic and wrap `gear` in `factor()` so plotly draws a discrete legend. Save to `ex_1_4`.

**Expected result:**

```
# Interactive scatter, 32 markers
# x-axis: wt, y-axis: mpg
# 3 discrete colour groups in legend (3, 4, 5 gears)
# click a legend entry to toggle that group's visibility
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- plot_ly(
  data = mtcars,
  x = ~wt,
  y = ~mpg,
  color = ~factor(gear),
  type = "scatter",
  mode = "markers"
)
ex_1_4
```

**Explanation:** Without `factor()`, plotly sees `gear` as continuous and produces a single colour gradient legend, which is wrong for three discrete groups. The legend is also interactive: single-click hides a group, double-click isolates it. A common mistake is using `marker = list(color = ~gear)`, which colours markers but does not produce a legend.

</details>

## Section 2. Layout and styling (4 problems)

### Exercise 2.1: Set axis titles and a plot title via layout

**Task:** Take the `mpg` vs `hp` scatter from Exercise 1.1 and add a plot title "Fuel economy vs horsepower" plus axis titles "Horsepower (hp)" and "Miles per gallon" using `layout()`. The default axis labels just say "hp" and "mpg", which is too terse for a stakeholder deck. Save to `ex_2_1`.

**Expected result:**

```
# Same scatter as 1.1 but now with
# plot title at top: "Fuel economy vs horsepower"
# x-axis title: "Horsepower (hp)"
# y-axis title: "Miles per gallon"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- plot_ly(mtcars, x = ~hp, y = ~mpg, type = "scatter", mode = "markers") |>
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- plot_ly(mtcars, x = ~hp, y = ~mpg, type = "scatter", mode = "markers") |>
  layout(
    title = "Fuel economy vs horsepower",
    xaxis = list(title = "Horsepower (hp)"),
    yaxis = list(title = "Miles per gallon")
  )
ex_2_1
```

**Explanation:** `layout()` is the catch-all for non-trace styling: titles, axes, legend, margins, annotations, shapes. Each axis argument is a named list because plotly's JSON spec is deeply nested. A frequent slip is writing `xaxis = "Horsepower"` (a bare string), which plotly silently ignores; you must wrap it in `list(title = ...)`.

</details>

### Exercise 2.2: Tame overplotting with marker size and opacity

**Task:** The `diamonds` dataset has 53,940 rows so a raw scatter of `carat` vs `price` is a black blob. A merchandiser preparing a pricing memo wants the shape visible. Plot `carat` vs `price`, then in `marker = list(...)` set `size = 3` and `opacity = 0.3` to reveal the density gradient. Save to `ex_2_2`.

**Expected result:**

```
# Interactive scatter, 53,940 small semi-transparent markers
# x-axis: carat (0.2 to ~5.0)
# y-axis: price (~300 to ~19000)
# core curve from low-carat low-price to high-carat high-price is now visible
# darker bands where points overlap
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- plot_ly(
  data = diamonds,
  x = ~carat,
  y = ~price,
  type = "scatter",
  mode = "markers",
  # your code here
)
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- plot_ly(
  data = diamonds,
  x = ~carat,
  y = ~price,
  type = "scatter",
  mode = "markers",
  marker = list(size = 3, opacity = 0.3)
)
ex_2_2
```

**Explanation:** When point counts exceed a few thousand, opacity is the cheap fix that converts overplot to a density gradient: ten overlapping markers at 0.3 opacity stack to roughly opaque, so denser regions read darker. For truly massive datasets, switch to `add_histogram2d()` (a 2D bin heatmap) or downsample first. Setting `marker = list(size = 3)` shrinks the dot so the gradient resolves at finer scales.

</details>

### Exercise 2.3: Use a logarithmic y-axis for skewed prices

**Task:** Diamond `price` is right-skewed (a few very expensive stones compress the rest at the bottom). A pricing analyst wants the same `carat` vs `price` scatter on a log y-axis so the spread is visible across the full range. Add `yaxis = list(type = "log")` inside `layout()`. Save to `ex_2_3`.

**Expected result:**

```
# Interactive scatter, log-scale y-axis
# y-axis ticks: 300, 1000, 3000, 10000 (log spacing)
# low-priced stones now spread visibly along the lower half
# upper tail of expensive diamonds compressed at top
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- plot_ly(diamonds, x = ~carat, y = ~price,
                  type = "scatter", mode = "markers",
                  marker = list(size = 3, opacity = 0.3)) |>
  # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- plot_ly(diamonds, x = ~carat, y = ~price,
                  type = "scatter", mode = "markers",
                  marker = list(size = 3, opacity = 0.3)) |>
  layout(yaxis = list(type = "log", title = "Price (USD, log scale)"))
ex_2_3
```

**Explanation:** A log axis is the right reach for any quantity that spans more than one order of magnitude, especially when you care about ratios rather than absolute differences. plotly's `type = "log"` rescales display only; the underlying data is untouched, so hover still shows real dollar amounts. If you need log10 with custom ticks, also set `tickvals` and `ticktext` inside the yaxis list.

</details>

### Exercise 2.4: Apply a custom diverging colour scale to a continuous variable

**Task:** A jeweller wants a `carat` vs `price` scatter coloured by `depth` (a continuous variable from ~43 to ~79), using a diverging blue-white-red colour scale via the `colors` argument. Pass a vector of three colour codes (or `colorRamp(...)`) so plotly builds the gradient. Save to `ex_2_4`.

**Expected result:**

```
# Interactive scatter with continuous colour bar on the right
# x-axis: carat, y-axis: price
# blue points at low depth, white near median, red at high depth
# colour bar legend shows depth range with numeric ticks
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- plot_ly(
  data = diamonds,
  x = ~carat,
  y = ~price,
  color = ~depth,
  colors = c("#3b4cc0", "#f7f7f7", "#b40426"),
  type = "scatter",
  mode = "markers",
  marker = list(size = 3, opacity = 0.4)
)
ex_2_4
```

**Explanation:** When `color` is mapped to a numeric column plotly produces a continuous colour bar; passing a vector to `colors` builds a gradient by interpolating between the supplied stops. A common pitfall is using ggplot2 palette names like `"viridis"` directly: plotly accepts those only for the discrete case, so for continuous mapping pass a hex vector or `colorRamp(c("blue","red"))`. Three-stop diverging scales like this one are ideal when the variable has a meaningful midpoint.

</details>

## Section 3. Multi-trace and subplots (4 problems)

### Exercise 3.1: Add a linear regression line on top of a scatter

**Task:** The trading desk wants the `mpg` vs `wt` scatter from `mtcars` overlaid with a least-squares fit. Fit `lm(mpg ~ wt, data = mtcars)`, build a tibble of predictions on a fine `wt` grid, then chain `add_trace()` (mode `"lines"`) onto the scatter. Save to `ex_3_1`.

**Expected result:**

```
# Interactive scatter with overlaid trend line
# 32 markers + 1 line trace (red, ~50 segments)
# legend shows two entries: "actual" and "lm fit"
# hover on the line reveals fitted mpg at each wt
```

**Difficulty:** Intermediate

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
grid <- tibble(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 50))
grid$mpg <- predict(fit, newdata = grid)

ex_3_1 <- plot_ly(mtcars, x = ~wt, y = ~mpg, type = "scatter",
                  mode = "markers", name = "actual") |>
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
grid <- tibble(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 50))
grid$mpg <- predict(fit, newdata = grid)

ex_3_1 <- plot_ly(mtcars, x = ~wt, y = ~mpg, type = "scatter",
                  mode = "markers", name = "actual") |>
  add_trace(data = grid, x = ~wt, y = ~mpg,
            type = "scatter", mode = "lines",
            line = list(color = "firebrick"), name = "lm fit")
ex_3_1
```

**Explanation:** `add_trace()` appends a new layer to the same figure and is the workhorse for combining geometries. Each trace needs its own `data` and aesthetics when the columns differ from the base figure. The `name` argument controls the legend label; without it, plotly auto-names traces `trace 0`, `trace 1`. For a quick smoother without manually fitting, you can use `add_lines(y = ~fitted(loess(mpg ~ wt)))`.

</details>

### Exercise 3.2: Grouped bars: car counts by cyl and transmission

**Task:** A sales lead wants a grouped bar chart of car counts in `mtcars` broken out by `cyl` (x-axis) and `am` (0 = automatic, 1 = manual) shown side-by-side. Build a counts tibble with `count(cyl, am)`, then pass `color = ~factor(am)` to plotly with `barmode = "group"` in `layout()`. Save to `ex_3_2`.

**Expected result:**

```
# Interactive grouped bar chart
# x-axis: cyl (4, 6, 8) with two bars each (am=0 and am=1)
# auto bars (am=0) and manual bars (am=1) sit side-by-side
# legend: "0" (auto), "1" (manual)
```

**Difficulty:** Intermediate

```r title="Your turn"
cyl_am <- mtcars |> count(cyl, am)

ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cyl_am <- mtcars |> count(cyl, am)

ex_3_2 <- plot_ly(
  data = cyl_am,
  x = ~factor(cyl),
  y = ~n,
  color = ~factor(am),
  type = "bar"
) |>
  layout(barmode = "group",
         xaxis = list(title = "Cylinders"),
         yaxis = list(title = "Count"))
ex_3_2
```

**Explanation:** plotly's default `barmode` is `"stack"`, so without the explicit `"group"` your bars would pile up rather than sit side-by-side. The trick of mapping `color` to a factor turns one trace into one trace per level, which is exactly what grouped bars need. To switch to a 100% stacked layout, use `barmode = "relative"` or compute proportions upstream.

</details>

### Exercise 3.3: Build a 2x2 subplot grid of mtcars diagnostics

**Task:** A diagnostics dashboard mock-up needs four panels from `mtcars` in a 2x2 grid: (1) mpg vs hp scatter, (2) mpg vs wt scatter, (3) histogram of mpg, (4) bar chart of cyl counts. Wrap each `plot_ly()` call in an object then combine with `subplot(..., nrows = 2)`. Save the combined figure to `ex_3_3`.

**Expected result:**

```
# 4-panel interactive figure in a 2x2 grid
# top row: scatter (mpg ~ hp) | scatter (mpg ~ wt)
# bottom row: histogram of mpg | bar chart of cyl counts
# each panel zoomable independently, shared toolbar at top
```

**Difficulty:** Advanced

```r title="Your turn"
p1 <- plot_ly(mtcars, x = ~hp, y = ~mpg, type = "scatter", mode = "markers")
p2 <- plot_ly(mtcars, x = ~wt, y = ~mpg, type = "scatter", mode = "markers")
p3 <- plot_ly(mtcars, x = ~mpg, type = "histogram")
p4_data <- mtcars |> count(cyl)
p4 <- plot_ly(p4_data, x = ~factor(cyl), y = ~n, type = "bar")

ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p1 <- plot_ly(mtcars, x = ~hp, y = ~mpg, type = "scatter", mode = "markers")
p2 <- plot_ly(mtcars, x = ~wt, y = ~mpg, type = "scatter", mode = "markers")
p3 <- plot_ly(mtcars, x = ~mpg, type = "histogram")
p4_data <- mtcars |> count(cyl)
p4 <- plot_ly(p4_data, x = ~factor(cyl), y = ~n, type = "bar")

ex_3_3 <- subplot(p1, p2, p3, p4, nrows = 2,
                  margin = 0.05, titleX = TRUE, titleY = TRUE) |>
  layout(showlegend = FALSE)
ex_3_3
```

**Explanation:** `subplot()` lays out figures left-to-right, then top-to-bottom; `nrows = 2` with four inputs gives a 2x2 grid. The `margin` argument controls inter-panel spacing; `titleX` and `titleY` carry per-panel axis titles into the grid. Hiding the legend in the outer `layout()` avoids four duplicate legend boxes. For uneven layouts use the `widths` and `heights` arguments.

</details>

### Exercise 3.4: Shared y-axis across two side-by-side panels

**Task:** A reporting analyst wants two panels side-by-side comparing `mpg` distributions: a histogram on the left and a box plot on the right, sharing the same y-axis range. Build both, then combine with `subplot(..., nrows = 1, shareY = TRUE)`. Save to `ex_3_4`.

**Expected result:**

```
# 2-panel figure, single row
# left: histogram of mpg (counts on x, mpg on y)
# right: vertical box plot of mpg
# both panels share the y-axis range so mpg values align horizontally
```

**Difficulty:** Advanced

```r title="Your turn"
h <- plot_ly(mtcars, y = ~mpg, type = "histogram", orientation = "h")
b <- plot_ly(mtcars, y = ~mpg, type = "box", name = "mpg")

ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
h <- plot_ly(mtcars, y = ~mpg, type = "histogram", orientation = "h")
b <- plot_ly(mtcars, y = ~mpg, type = "box", name = "mpg")

ex_3_4 <- subplot(h, b, nrows = 1, shareY = TRUE, margin = 0.04) |>
  layout(showlegend = FALSE,
         title = "Distribution of mpg")
ex_3_4
```

**Explanation:** `shareY = TRUE` links the y-axes of the two panels so a zoom or pan on one syncs the other, which is exactly what you want when comparing a histogram to a box plot of the same variable. Setting `orientation = "h"` on the histogram rotates bars to run horizontally so mpg sits on y, matching the box. For shared x instead, use `shareX = TRUE` with `nrows = 2`.

</details>

## Section 4. Interactivity: hover, animation, range slider, dropdown (4 problems)

### Exercise 4.1: Customise the hover template

**Task:** Stakeholders viewing the `mpg` vs `wt` scatter want the hover tooltip to display "Car: <name>" plus "Weight: <wt> tons" and "MPG: <mpg>" on three lines, not the default `(x, y)` pair. Lift rownames to a column, then set `text = ~car` and a `hovertemplate` string with `<br>` line breaks. Save to `ex_4_1`.

**Expected result:**

```
# Interactive scatter, 32 markers
# hover shows three lines per point:
#   Car: Mazda RX4
#   Weight: 2.62 tons
#   MPG: 21
# x and y axes unchanged
```

**Difficulty:** Intermediate

```r title="Your turn"
mt <- mtcars |> rownames_to_column("car")

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars |> rownames_to_column("car")

ex_4_1 <- plot_ly(
  data = mt,
  x = ~wt,
  y = ~mpg,
  type = "scatter",
  mode = "markers",
  text = ~car,
  hovertemplate = paste(
    "Car: %{text}",
    "Weight: %{x} tons",
    "MPG: %{y}",
    "<extra></extra>",
    sep = "<br>"
  )
)
ex_4_1
```

**Explanation:** `hovertemplate` uses plotly's string substitution syntax: `%{x}`, `%{y}`, `%{text}`, plus custom data via `customdata = ~col` and `%{customdata}`. The `<extra></extra>` tag suppresses the secondary box that otherwise shows the trace name. `<br>` is HTML for a line break, which is why we paste with that as the separator. Use `:.2f` after the variable to control numeric formatting, e.g. `%{x:.2f}`.

</details>

### Exercise 4.2: Animate population over time with a frame variable

**Task:** A demographics analyst wants an animated scatter of `pop` vs `unemploy` in the built-in `economics` tibble, with one frame per year. Add a `year` column from `date`, then call `plot_ly()` passing `frame = ~year`. plotly inserts a play button and slider. Save to `ex_4_2`.

**Expected result:**

```
# Interactive animated scatter
# play button + year slider at the bottom
# each frame shows one year's monthly observations (pop vs unemploy)
# clicking play advances ~48 frames from 1967 to 2015
```

**Difficulty:** Advanced

```r title="Your turn"
econ <- economics |>
  mutate(year = as.integer(format(date, "%Y")))

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
econ <- economics |>
  mutate(year = as.integer(format(date, "%Y")))

ex_4_2 <- plot_ly(
  data = econ,
  x = ~pop,
  y = ~unemploy,
  frame = ~year,
  type = "scatter",
  mode = "markers"
) |>
  animation_opts(frame = 600, transition = 300, redraw = FALSE) |>
  layout(xaxis = list(title = "Population"),
         yaxis = list(title = "Unemployed"))
ex_4_2
```

**Explanation:** Any column you pass to `frame` becomes the animation key; plotly groups rows that share a frame value and draws one chart per group. `animation_opts(frame = 600)` sets each frame to 600 ms and `transition = 300` smooths the morph between frames. Setting `redraw = FALSE` keeps the same trace types across frames, which is faster; flip to TRUE only when frames have different chart types. Add `ids = ~someStableKey` so plotly tracks individual points across frames.

</details>

### Exercise 4.3: Add a range slider to a time series

**Task:** A finance analyst presenting the `economics` `unemploy` series wants a range slider beneath the chart so reviewers can zoom into specific date windows without losing the full-range view above. Build a line chart of `unemploy` vs `date`, then add `rangeslider = list()` to the xaxis. Save to `ex_4_3`.

**Expected result:**

```
# Interactive line chart of unemploy vs date
# main chart on top showing 1967 to 2015
# narrow rangeslider strip below the x-axis with the same series
# drag the slider edges to zoom the main panel
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- plot_ly(economics, x = ~date, y = ~unemploy,
                  type = "scatter", mode = "lines") |>
  # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- plot_ly(economics, x = ~date, y = ~unemploy,
                  type = "scatter", mode = "lines") |>
  layout(
    title = "U.S. unemployment, 1967 to 2015",
    xaxis = list(title = "Date", rangeslider = list(type = "date")),
    yaxis = list(title = "Unemployed (thousands)")
  )
ex_4_3
```

**Explanation:** The range slider is a free interaction unlocked by adding one named list under `xaxis`. Setting `type = "date"` formats the slider ticks as dates rather than raw POSIX integers. For non-time x-axes drop the `type` argument. Combine with `rangeselector` (a row of preset buttons like "1m, 6m, YTD, 1y, All") for a TradingView-style time-series UI.

</details>

### Exercise 4.4: Build a dropdown menu to toggle visible traces

**Task:** A dashboard reviewer wants a single chart with three traces (`mpg`, `hp`, and `wt` each plotted against row index) but only one visible at a time, switched via a dropdown menu. Add all three traces with `add_trace()`, then attach an `updatemenus` list in `layout()` with three buttons. Save to `ex_4_4`.

**Expected result:**

```
# Interactive chart with dropdown labelled "Y axis"
# 3 dropdown choices: mpg, hp, wt
# changing selection shows that variable's line while hiding the other two
# default view shows mpg
```

**Difficulty:** Advanced

```r title="Your turn"
mt <- mtcars |> rownames_to_column("car") |> mutate(idx = row_number())

ex_4_4 <- plot_ly(mt, x = ~idx) |>
  add_trace(y = ~mpg, name = "mpg", type = "scatter", mode = "lines", visible = TRUE) |>
  add_trace(y = ~hp,  name = "hp",  type = "scatter", mode = "lines", visible = FALSE) |>
  add_trace(y = ~wt,  name = "wt",  type = "scatter", mode = "lines", visible = FALSE) |>
  # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mt <- mtcars |> rownames_to_column("car") |> mutate(idx = row_number())

ex_4_4 <- plot_ly(mt, x = ~idx) |>
  add_trace(y = ~mpg, name = "mpg", type = "scatter", mode = "lines", visible = TRUE) |>
  add_trace(y = ~hp,  name = "hp",  type = "scatter", mode = "lines", visible = FALSE) |>
  add_trace(y = ~wt,  name = "wt",  type = "scatter", mode = "lines", visible = FALSE) |>
  layout(
    updatemenus = list(
      list(type = "dropdown", x = 1.15, y = 1,
           buttons = list(
             list(label = "mpg", method = "update", args = list(list(visible = list(TRUE, FALSE, FALSE)))),
             list(label = "hp",  method = "update", args = list(list(visible = list(FALSE, TRUE, FALSE)))),
             list(label = "wt",  method = "update", args = list(list(visible = list(FALSE, FALSE, TRUE))))
           ))
    )
  )
ex_4_4
```

**Explanation:** Each dropdown button uses the `update` method, which can patch any property by passing a list keyed the same way as the figure JSON. The `visible` vector has one entry per trace in trace-add order, so the lists here mask all but one. For a "show all" entry, add a fourth button with `visible = list(TRUE, TRUE, TRUE)`. Use `type = "buttons"` instead of `"dropdown"` to render the choices as a row of pills.

</details>

## Section 5. ggplotly conversion and advanced chart types (4 problems)

### Exercise 5.1: Convert a ggplot2 boxplot to an interactive figure

**Task:** A reviewer prefers ggplot2 syntax but needs hover tooltips on the final figure. Build a ggplot2 boxplot of `mpg` by `factor(cyl)` (with jittered points overlaid), then wrap the whole thing in `ggplotly()` to get an interactive version. Save to `ex_5_1`.

**Expected result:**

```
# Interactive 3-box plot, x-axis: cyl (4, 6, 8), y-axis: mpg
# overlaid jittered points showing all 32 observations
# hover on box shows median/quartile summary
# hover on jittered points shows individual mpg values
```

**Difficulty:** Intermediate

```r title="Your turn"
g <- ggplot(mtcars, aes(factor(cyl), mpg)) +
  geom_boxplot(outlier.shape = NA) +
  geom_jitter(width = 0.15, alpha = 0.6) +
  labs(x = "Cylinders", y = "Miles per gallon")

ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
g <- ggplot(mtcars, aes(factor(cyl), mpg)) +
  geom_boxplot(outlier.shape = NA) +
  geom_jitter(width = 0.15, alpha = 0.6) +
  labs(x = "Cylinders", y = "Miles per gallon")

ex_5_1 <- ggplotly(g)
ex_5_1
```

**Explanation:** `ggplotly()` translates almost every ggplot2 geom and scale into plotly traces and lays out the result with the same layered semantics. The conversion preserves the ggplot title, axis labels, and facet structure; what gets lost is custom theming on legend titles in some edge cases. For richer tooltips, pass `tooltip = c("x", "y", "colour")` to limit what shows; or attach `aes(text = ...)` plus `ggplotly(g, tooltip = "text")` for full control.

</details>

### Exercise 5.2: Render a 3D scatter of mpg, hp, and wt

**Task:** An auto journalist wants to visualise the joint relationship of `mpg`, `hp`, and `wt` from `mtcars` in 3D so readers can rotate it. Use `plot_ly()` with `type = "scatter3d"` and `mode = "markers"`, passing all three numeric columns. Add a colour map by `factor(cyl)`. Save to `ex_5_2`.

**Expected result:**

```
# 3D interactive scatter, 32 markers
# x-axis: wt, y-axis: hp, z-axis: mpg
# 3 colour groups (cyl 4, 6, 8) with discrete legend
# drag to rotate, scroll to zoom, double-click to reset view
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- plot_ly(
  data = mtcars,
  x = ~wt, y = ~hp, z = ~mpg,
  color = ~factor(cyl),
  type = "scatter3d",
  mode = "markers",
  marker = list(size = 4)
) |>
  layout(scene = list(
    xaxis = list(title = "Weight"),
    yaxis = list(title = "Horsepower"),
    zaxis = list(title = "MPG")
  ))
ex_5_2
```

**Explanation:** 3D plots live inside the `scene` namespace in `layout()`, which is why axis titles go under `layout(scene = list(xaxis = ...))` rather than `layout(xaxis = ...)`. Marker sizes default smaller in 3D space, so bumping `size` to 4 keeps points visible after camera zoom. 3D scatter is best for 3 to 6 columns; beyond that, consider parallel coordinates (`type = "parcoords"`) instead.

</details>

### Exercise 5.3: Heatmap of the mtcars correlation matrix

**Task:** A data engineer producing a quick QA artefact wants a heatmap of the correlation matrix of all 11 `mtcars` columns. Compute `cor(mtcars)` then pass the matrix to `plot_ly()` with `type = "heatmap"`. Use a diverging blue-white-red colour scale via `colorscale`. Save to `ex_5_3`.

**Expected result:**

```
# 11x11 interactive heatmap
# x and y axes: column names (mpg, cyl, disp, ..., carb)
# colour scale -1 (blue) -> 0 (white) -> 1 (red), centred at 0
# diagonal is 1.0 (deep red), cor(mpg, wt) is strongly negative (deep blue)
# hover shows cell coordinates and correlation value
```

**Difficulty:** Advanced

```r title="Your turn"
cm <- cor(mtcars)

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cm <- cor(mtcars)

ex_5_3 <- plot_ly(
  x = colnames(cm),
  y = rownames(cm),
  z = cm,
  type = "heatmap",
  colorscale = list(
    c(0,   "#3b4cc0"),
    c(0.5, "#f7f7f7"),
    c(1,   "#b40426")
  ),
  zmin = -1, zmax = 1
) |>
  layout(title = "mtcars correlation matrix")
ex_5_3
```

**Explanation:** Pinning `zmin = -1` and `zmax = 1` forces the colour scale to be symmetric around zero, so the midpoint white actually means zero correlation. Without these, plotly auto-scales to the observed range, which can wash out a matrix that has no negatives. The `colorscale` argument here uses anchor points: each pair `c(position, colour)` puts a colour at a normalised position between 0 and 1. Built-in named scales (`"Viridis"`, `"RdBu"`) also work.

</details>

### Exercise 5.4: Candlestick chart of one stock from EuStockMarkets

**Task:** The risk team wants a candlestick chart for one trading week (40 observations) of the `DAX` index from `EuStockMarkets`. Since the dataset is a single close-only series, simulate OHLC by adding tiny offsets (open = close lag, high = close + small noise, low = close - small noise). Then call `plot_ly()` with `type = "candlestick"`. Save to `ex_5_4`.

**Expected result:**

```
# Interactive candlestick chart, 40 daily bars
# green wick when close > open, red when close < open
# x-axis: trading day index 1 to 40
# y-axis: DAX price
# hover shows open, high, low, close per day
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(1)
dax <- as.numeric(EuStockMarkets[1:41, "DAX"])
df <- tibble(
  day   = seq_len(40),
  open  = dax[-length(dax)],
  close = dax[-1],
  high  = pmax(open, close) + runif(40, 5, 25),
  low   = pmin(open, close) - runif(40, 5, 25)
)

ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
dax <- as.numeric(EuStockMarkets[1:41, "DAX"])
df <- tibble(
  day   = seq_len(40),
  open  = dax[-length(dax)],
  close = dax[-1],
  high  = pmax(open, close) + runif(40, 5, 25),
  low   = pmin(open, close) - runif(40, 5, 25)
)

ex_5_4 <- plot_ly(
  data = df,
  x = ~day,
  open = ~open, close = ~close,
  high = ~high, low = ~low,
  type = "candlestick"
) |>
  layout(title = "DAX simulated OHLC, 40 trading days",
         xaxis = list(title = "Day", rangeslider = list(visible = FALSE)),
         yaxis = list(title = "Price"))
ex_5_4
```

**Explanation:** Candlestick traces require all four OHLC columns named exactly `open`, `high`, `low`, `close` (or passed via the matching plotly arguments). plotly auto-colours green when close exceeds open and red otherwise; override with `increasing = list(line = list(color = "..."))`. Real datasets come from yfinance or tidyquant; the row-shift trick here is just enough scaffolding to demo the trace type without an external download.

</details>

## What to do next

- [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) for the underlying grammar that ggplotly translates from.
- [Data Visualization Exercises in R](Data-Visualization-Exercises-in-R.html) for cross-package drills covering base, lattice, and ggplot2.
- [Interactive Maps with leaflet Exercises](leaflet-Exercises-in-R.html) for the geospatial sibling of plotly.
- [Time Series Visualization Exercises](Time-Series-Exercises-in-R.html) for range sliders and rolling windows applied to financial and demographic series.
