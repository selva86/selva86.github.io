---
title: "Area Charts and Ribbons in ggplot2: geom_area, geom_ribbon"
slug: "ggplot2-Area-Charts-and-Ribbons-in-R"
description: "Learn to build area charts and confidence bands in R with ggplot2. Use geom_area() for stacked areas and geom_ribbon() for filled intervals between two lines."
keywords: "geom_area in R, geom_ribbon in R, area chart ggplot2, stacked area chart R, confidence band ggplot2, ggplot2 area plot, filled area between lines, position fill ggplot2"
auto_link_terms: "geom_area|geom_ribbon|area chart|area charts|stacked area chart|confidence band|confidence bands|ribbon plot|filled area|area plot in ggplot2"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-24"
curriculum_id: "GG2-2.5"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Area Charts & Ribbons"
sidebar_order: "16"
difficulty: "Intermediate"
---

<p class="lead">An area chart fills the space between a line and a baseline so your eye reads volume, not just direction. In ggplot2 you draw one with <code>geom_area()</code>, and its close sibling <code>geom_ribbon()</code> fills the band between any two lines, an upper value and a lower value, which is exactly what a confidence interval needs.</p>

This tutorial builds both from the ground up. You will start with a single filled series, stack several groups on top of each other, switch to proportions, and finish by shading the uncertainty around a fitted model. Every plot uses the tidyverse (`ggplot2` plus a little `dplyr`), the code runs right here in your browser, and each output shown is the real result of running the block. If you can read a line chart, you already know enough to start.

## What is an area chart, and how do you build one with geom_area()?

An area chart is a line chart with the space underneath filled in. That fill turns a thin trend line into a solid shape, which makes the reader feel the magnitude of the value at every point along the x axis. It is the natural choice when the quantity itself matters (sales, headcount, unemployment) and not only its rise and fall.

We will use `economics`, a monthly US economic dataset that ships inside ggplot2, so there is nothing to download. Let's load the package and look at the first few rows so you know what the columns are.

```r title="Load ggplot2 and preview the economics data"
library(ggplot2)

# economics ships inside ggplot2: monthly US economic indicators, 1967 onward
head(economics)
#> # A tibble: 6 × 6
#>   date         pce    pop psavert uempmed unemploy
#>   <date>     <dbl>  <dbl>   <dbl>   <dbl>    <dbl>
#> 1 1967-07-01  507. 198712    12.6     4.5     2944
#> 2 1967-08-01  510. 198911    12.6     4.7     2945
#> 3 1967-09-01  516. 199113    11.9     4.6     2958
#> 4 1967-10-01  512. 199311    12.9     4.9     3143
#> 5 1967-11-01  517. 199498    12.8     4.7     3066
#> 6 1967-12-01  525. 199657    11.8     4.8     3018
```

Each row is one month. We will plot `date` on the x axis and `unemploy`, the number of unemployed people in thousands, on the y axis. That gives one value per month, a perfect fit for an area chart.

Now the payoff. We map `date` and `unemploy`, then add a single `geom_area()` layer. The `fill` argument sets the interior colour and `alpha` controls transparency, where 1 is solid and 0 is invisible.

```r title="Build a first area chart with geom_area"
ggplot(economics, aes(x = date, y = unemploy)) +
  geom_area(fill = "#2c7fb8", alpha = 0.85) +
  labs(title = "US unemployment over time",
       x = "Year", y = "Number unemployed (thousands)")
```

Run it and you get a filled blue shape that rises and falls with the economy, spiking in every recession. The top edge is exactly the line `geom_line()` would have drawn; `geom_area()` just floods everything below that line down to the baseline.

That baseline is the key to reading area charts correctly. By default `geom_area()` anchors the fill at zero, so the height of the shape at any month is the value itself. This is why the zero baseline matters: the filled quantity you see is the real number, measured from zero up.

[KEY INSIGHT]
**An area chart always counts up from zero by default.** The filled height encodes the value itself, so an area chart is only truthful when zero is a meaningful floor for your data. For something like stock price, where zero is far away and irrelevant, a plain line is usually the better choice.

Two arguments do most of the styling work. Use `fill` for the interior colour and `colour` for the outline of the top edge. A thin white outline (via `colour = "white"`) is a common touch that makes the shape crisp.

**Try it:** Redraw the unemployment area with a fill colour you like, then add `colour = "white"` to trace a clean outline along the top edge.

```r title="Your turn: recolour the area and add an outline"
# Change the fill to any colour, then add colour = "white" and run it.
ggplot(economics, aes(x = date, y = unemploy)) +
  geom_area(fill = "grey70")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Recoloured area with a white outline"
ggplot(economics, aes(x = date, y = unemploy)) +
  geom_area(fill = "#31a354", colour = "white", linewidth = 0.2)
```

**Explanation:** `fill` colours the inside, `colour` colours the top edge, and `linewidth` sets how thick that edge line is. Keeping the outline thin and pale stops it from competing with the fill.

</details>

## How do you compare several groups with a stacked area chart?

A single area chart shows one series. The moment you have several groups, say revenue split across product segments, you want to see each group and the combined total at once. That is what a stacked area chart does: it draws one area per group and stacks them, so the top edge traces the sum of everything.

To do this, ggplot2 needs your data in long (tidy) form: one row per group per time point, with a column that names the group. Let's build a small, readable dataset of yearly sales for three business segments so you can see the shape of the input.

```r title="Create grouped time-series data in long form"
revenue <- data.frame(
  year    = rep(2018:2023, times = 3),
  segment = rep(c("Cloud", "Devices", "Services"), each = 6),
  sales   = c(20, 24, 30, 38, 47, 58,
              14, 15, 15, 16, 17, 18,
               9, 11, 14, 18, 23, 29)
)
head(revenue)
#>   year segment sales
#> 1 2018   Cloud    20
#> 2 2019   Cloud    24
#> 3 2020   Cloud    30
#> 4 2021   Cloud    38
#> 5 2022   Cloud    47
#> 6 2023   Cloud    58
```

Every row carries a `year`, a `segment` name, and a `sales` number. That third column, the group name, is the piece a single-series chart never had.

Now map `segment` to `fill`. That one aesthetic tells ggplot2 to split the data into one area per segment and colour each differently. Because `geom_area()` uses `position = "stack"` by default, the areas pile up instead of overlapping.

```r title="Stack groups by mapping segment to fill"
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area()
```

You now see three bands stacked into one solid block. Read any single band's thickness to get that segment's sales, and read the height of the whole stack to get total company sales. You can read both from the same chart.

There is one catch worth knowing: the stacking order is decided by the factor levels of `segment`, and by default R orders them alphabetically. You can take control by turning `segment` into a factor with the order you want. A common convention is to put the largest or most important group at the bottom. While we are here, we will add white borders between bands and a colour palette.

```r title="Control the stacking order and style the bands"
revenue$segment <- factor(revenue$segment,
                          levels = c("Services", "Devices", "Cloud"))

ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(colour = "white", linewidth = 0.3) +
  scale_fill_brewer(palette = "Blues")
```

Setting the factor levels reorders the stack from the bottom up, so `Services` now sits at the base. The `colour = "white"` argument draws a clean seam between segments, and `scale_fill_brewer()` swaps the default colours for a coordinated blue palette.

![How the position argument places grouped areas](screenshots/ggplot2-Area-Charts-and-Ribbons-in-R-positions.webp)

*Figure 1: The position argument decides how grouped areas combine, from overlapping to stacked totals to a 100 percent fill.*

[TIP]
**Add thin white borders to separate stacked bands.** A hairline outline set with colour = "white" and a small linewidth makes each segment pop out from its neighbours, which matters most when two colours sit close together on the palette.

**Try it:** Redraw the stacked chart but swap the palette to `"Set2"` (a friendly qualitative palette) while keeping the white seams.

```r title="Your turn: swap the colour palette"
# Add scale_fill_brewer(palette = "Set2") to this plot and run it.
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(colour = "white", linewidth = 0.3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stacked area with the Set2 palette"
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(colour = "white", linewidth = 0.3) +
  scale_fill_brewer(palette = "Set2")
```

**Explanation:** `scale_fill_brewer()` picks a ColorBrewer palette by name. Qualitative palettes like `"Set2"` are built for categories with no natural order, which is what our segments are.

</details>

## How do you show proportions with position = "fill"?

A stacked area answers "how big is each group and the total?" Sometimes you care about a different question: "what share of the whole did each group hold, year by year?" For that you want a proportional (100 percent stacked) area chart, where every column is rescaled so the segments always add up to the full height.

The change is tiny. Swap the default stacking for `position = "fill"`, which stretches each year to reach 1.0. Then format the y axis as a percentage with `scales::percent` so the axis reads 0 percent to 100 percent instead of 0 to 1. The `scales::` prefix borrows one function from the `scales` package (installed alongside ggplot2) without attaching the whole package, so there is no `library(scales)` call to add.

```r title="Show shares with position = fill"
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(position = "fill", colour = "white", linewidth = 0.3) +
  scale_y_continuous(labels = scales::percent) +
  labs(y = "Share of total sales")
```

Now the total is a flat 100 percent every year, and the bands show how the mix shifts over time. The absolute numbers are gone on purpose; this chart is about relative share, so a segment can shrink here even while its raw sales grow.

To see exactly what `position = "fill"` computes for you, we can reproduce it by hand. Grouping by `year` and dividing each segment's sales by the yearly total gives the same shares ggplot2 draws. This is a good moment to bring in `dplyr`.

```r title="Compute the same shares by hand with dplyr"
library(dplyr)

revenue |>
  group_by(year) |>
  mutate(share = sales / sum(sales)) |>
  head()
#> # A tibble: 6 × 4
#> # Groups:   year [6]
#>    year segment sales share
#>   <int> <fct>   <dbl> <dbl>
#> 1  2018 Cloud      20 0.465
#> 2  2019 Cloud      24 0.48
#> 3  2020 Cloud      30 0.508
#> 4  2021 Cloud      38 0.528
#> 5  2022 Cloud      47 0.540
#> 6  2023 Cloud      58 0.552
```

The `share` column is what the proportional chart plots. In 2018, Cloud was about 47 percent of sales; by 2023 it had climbed past 55 percent. That is the story the percentage axis tells at a glance.

[WARNING]
**Stacked totals and 100 percent shares answer different questions.** A regular stacked area shows absolute size and the growing total, while position = "fill" hides the total and shows only the mix. Pick the one that matches the question you are actually asking, because they can point in opposite directions.

**Try it:** Write a small function `ex_share()` that turns a vector of values into its proportions (each value divided by the sum). This is the same math `position = "fill"` runs internally.

```r title="Your turn: compute proportions"
# Finish ex_share() so it returns each value's fraction of the total.
ex_share <- function(values) {
  # your code here
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Proportions solution"
ex_share <- function(values) {
  values / sum(values)
}
ex_share(c(58, 18, 29))
#> [1] 0.5523810 0.1714286 0.2761905
```

**Explanation:** Dividing a vector by `sum(values)` uses R's vectorized arithmetic to scale every element at once, so the results always add up to 1. Here Cloud's 58 is about 55 percent of the three segments' total.

</details>

## What is geom_ribbon(), and how is it different from geom_area()?

So far the bottom of every filled shape has been zero. `geom_ribbon()` removes that restriction. It fills the band between two y values that you supply at each x: a lower edge called `ymin` and an upper edge called `ymax`. That freedom is what lets a ribbon represent a range rather than a total.

Here is the relationship in one line: an area chart is just a ribbon whose lower edge is pinned to zero. Once you see that, the whole family clicks into place.

![geom_area is geom_ribbon with the lower edge fixed at zero](screenshots/ggplot2-Area-Charts-and-Ribbons-in-R-geom-family.webp)

*Figure 2: geom_area is just geom_ribbon with the lower edge fixed at zero.*

Let's make a tiny dataset with an explicit low and high value at each x, then fill the gap. The ribbon needs `ymin` and `ymax` mapped inside `aes()`.

```r title="Draw a ribbon between two lines"
band <- data.frame(
  x  = 1:10,
  lo = c(2, 3, 3, 4, 5, 5, 6, 7, 7, 8),
  hi = c(5, 6, 7, 7, 8, 9, 9, 10, 11, 12)
)

ggplot(band, aes(x = x)) +
  geom_ribbon(aes(ymin = lo, ymax = hi), fill = "#9ecae1")
```

The result is a floating band. It never touches zero; it simply fills the vertical distance from `lo` up to `hi` at every x. That is the shape you cannot make with `geom_area()` alone.

To prove the family connection, keep everything the same but set `ymin = 0`. The floating band drops down and becomes an ordinary area chart of `hi`.

```r title="A ribbon with ymin = 0 is an area chart"
ggplot(band, aes(x = x)) +
  geom_ribbon(aes(ymin = 0, ymax = hi), fill = "#9ecae1")
```

Same geom, same data, one changed argument, and now it is indistinguishable from `geom_area(aes(y = hi))`. This is not a coincidence: internally `geom_area()` is defined as `geom_ribbon()` with `ymin` fixed at 0.

**Try it:** Widen the band by 2 units on each side, so `ymin = lo - 2` and `ymax = hi + 2`, and give it a warmer fill colour.

```r title="Your turn: widen the ribbon"
# Change ymin to lo - 2, ymax to hi + 2, and pick a new fill.
ggplot(band, aes(x = x)) +
  geom_ribbon(aes(ymin = lo, ymax = hi), fill = "#9ecae1")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Widened ribbon solution"
ggplot(band, aes(x = x)) +
  geom_ribbon(aes(ymin = lo - 2, ymax = hi + 2), fill = "#fdae6b")
```

**Explanation:** Because `ymin` and `ymax` are ordinary expressions, you can compute the edges on the fly. Subtracting from `lo` and adding to `hi` inflates the band symmetrically.

</details>

## How do you add a confidence band with geom_ribbon()?

The most common real use of `geom_ribbon()` is showing uncertainty. When you fit a model, the prediction is a single line, but there is a range of plausible values around it. Shading that range as a band, with the prediction line running through the middle, is the classic confidence-band picture.

Let's build one from a real model instead of made-up numbers. We will fit a straight line to the built-in `cars` dataset, which records how far a car needs to stop at a given speed. Then we ask `predict()` for a fitted value plus a lower and upper bound at each speed, using `interval = "confidence"`.

```r title="Fit a model and predict a confidence interval"
model <- lm(dist ~ speed, data = cars)

grid <- data.frame(speed = seq(min(cars$speed), max(cars$speed), length.out = 50))
pred <- predict(model, newdata = grid, interval = "confidence")

ci <- cbind(grid, as.data.frame(pred))
head(ci)
#>      speed        fit        lwr       upr
#> 1 4.000000 -1.8494599 -12.329543  8.630624
#> 2 4.428571 -0.1641418 -10.319939  9.991655
#> 3 4.857143  1.5211762  -8.312677 11.355029
#> 4 5.285714  3.2064943  -6.307996 12.720984
#> 5 5.714286  4.8918123  -4.306164 14.089788
#> 6 6.142857  6.5771303  -2.307486 15.461747
```

Each row now has four numbers: the `speed`, the model's best estimate `fit`, and the interval bounds `lwr` and `upr`. Those last two are the exact `ymin` and `ymax` a ribbon wants. A 95 percent confidence interval means that if we repeated this sampling many times, the true average stopping distance would land inside the band about 95 percent of the time. The band is wider where data is sparse and narrower where it is dense.

Now plot it in three layers: the ribbon for the band, then the fitted line on top of it, then the raw points so the reader sees the actual data. Order matters here, which we will come back to.

```r title="Draw the confidence band, fit line, and points"
ggplot(ci, aes(x = speed)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), fill = "#bdd7e7", alpha = 0.7) +
  geom_line(aes(y = fit), colour = "#2171b5", linewidth = 1) +
  geom_point(data = cars, aes(x = speed, y = dist), alpha = 0.5) +
  labs(title = "Stopping distance vs speed with a 95% confidence band",
       x = "Speed (mph)", y = "Stopping distance (ft)")
```

The pale band sits closest to the blue trend line in the middle of the speed range and widens at the ends, where fewer data points make the estimate less certain. The scattered points show how the real observations spread around that trend.

[TIP]
**Add the ribbon before the line so the line stays on top.** ggplot2 draws layers in the order you list them, so a ribbon added first sits underneath, and the fit line and points remain fully visible. Reverse the order and a semi-transparent band would wash over your line.

**Try it:** Recolour the band. Change its `fill` to `"grey80"` and set `alpha = 0.5` for a neutral, understated look.

```r title="Your turn: restyle the confidence band"
# Change the ribbon fill to "grey80" and alpha to 0.5, then run it.
ggplot(ci, aes(x = speed)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), fill = "#bdd7e7", alpha = 0.7) +
  geom_line(aes(y = fit), colour = "#2171b5", linewidth = 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Neutral grey confidence band"
ggplot(ci, aes(x = speed)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), fill = "grey80", alpha = 0.5) +
  geom_line(aes(y = fit), colour = "#2171b5", linewidth = 1)
```

**Explanation:** A grey, semi-transparent band reads as "background uncertainty" and keeps attention on the coloured fit line. This is a good default for reports where the trend is the headline.

</details>

## What are the most common area chart and ribbon pitfalls?

A few traps catch almost everyone the first time. Knowing them upfront saves you a confusing debugging session.

The first is overlapping instead of stacking. If you actually want several areas drawn on the same baseline (not piled up), you must set `position = "identity"`, and then you need transparency or the front area will completely hide the ones behind it.

```r title="Overlap areas with position = identity and alpha"
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(position = "identity", alpha = 0.4)
```

With `identity` the three areas all start at zero and overlap, and `alpha = 0.4` lets you see through them. Without the transparency, only the largest segment would be visible.

Here are the traps worth keeping on a checklist:

1. **Stacking is the default, not overlapping.** `geom_area()` uses `position = "stack"`. If your groups look suspiciously tall, you are probably stacking when you meant to overlap.
2. **Sort your x axis first.** An area or ribbon connects points in row order, so unsorted x values produce a jagged, back-and-forth mess. Order the data by x before plotting.
3. **Watch the zero baseline.** Because area implies "counted from zero", using it for data where zero is meaningless (like temperature or price) can mislead. A line chart is often safer there.
4. **Layer the ribbon under the line.** Add `geom_ribbon()` before `geom_line()` so the line is not covered by the band.
5. **Too many stacked groups become unreadable.** Beyond five or six bands the colours blur together. Group small categories into an "Other" bucket.

[NOTE]
**Recent ggplot2 uses linewidth, older versions use size.** For line thickness on areas, ribbons and lines, ggplot2 3.4 and later expect `linewidth`. If you are on an older install and see a warning, switch `linewidth` back to `size`. Check your version with `packageVersion("ggplot2")`.

**Try it:** The chart below stacks the segments so you cannot compare their individual shapes. Make all three visible on a shared baseline by adding `position = "identity"` and `alpha = 0.5`.

```r title="Your turn: reveal all three areas"
# Add position = "identity" and alpha = 0.5 so every segment shows through.
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Overlapping areas solution"
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(position = "identity", alpha = 0.5)
```

**Explanation:** `position = "identity"` stops the stacking so each area is drawn from zero, and the transparency lets overlapping shapes coexist without one hiding the rest.

</details>

## Putting It All Together: A Polished Stacked Area Chart

Let's combine the pieces into one publication-ready figure. We take the `revenue` data (already ordered as a factor from earlier), stack it, add white seams over a qualitative palette, then finish with a full set of labels on a clean theme. This is the kind of chart you could drop straight into a report.

```r title="A publication-ready stacked area chart"
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(colour = "white", linewidth = 0.3) +
  scale_fill_brewer(palette = "Set2") +
  labs(title = "Revenue by segment, 2018 to 2023",
       subtitle = "Annual sales stacked to show the growing total",
       x = NULL, y = "Sales (USD millions)", fill = "Segment",
       caption = "Source: sample data") +
  theme_minimal(base_size = 12)
```

Every element here earns its place. The stacked areas show both the segment detail and the rising total, while the white borders separate the bands. A minimal theme strips away chart clutter, and the labelled title, subtitle and caption tell the reader what they are looking at and where the data came from.

## Practice Exercises

These combine what you have learned. Try each one before opening the solution. Notice that the solutions use fresh variable names (prefixed with `my_`) so they will not clash with the tutorial's objects if you run everything in order.

### Exercise 1: Turn the revenue data into a share chart

Redraw the `revenue` data as a 100 percent stacked (proportional) area chart. Use `position = "fill"` and format the y axis as a percentage. Keep the white seams and add a title.

```r title="Exercise 1 starter: proportional area"
# Fill in the two blanks: position for a 100% stack, and the percent formatter.
# ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
#   geom_area(position = ____, colour = "white", linewidth = 0.3) +
#   scale_y_continuous(labels = ____)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ggplot(revenue, aes(x = year, y = sales, fill = segment)) +
  geom_area(position = "fill", colour = "white", linewidth = 0.3) +
  scale_y_continuous(labels = scales::percent) +
  labs(title = "Revenue mix by segment", y = "Share of sales", x = NULL)
```

**Explanation:** `position = "fill"` rescales each year to 100 percent, and `scales::percent` turns the 0-to-1 axis into readable percentages. The result shows how the segment mix shifts, not the raw totals.

</details>

### Exercise 2: Build a confidence band from your own model

Fit a linear model of `mpg` on `wt` using the built-in `mtcars` dataset, predict a confidence interval across a grid of weights, then draw the band with the fit line and raw points layered on top.

```r title="Exercise 2 starter: model-based confidence band"
# Steps:
# 1. my_model <- lm(mpg ~ wt, data = mtcars)
# 2. build a grid of wt values with seq(min, max, length.out = 50)
# 3. predict(my_model, newdata = grid, interval = "confidence")
# 4. plot geom_ribbon(ymin=lwr, ymax=upr) + geom_line(y=fit) + geom_point
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution: fit and predict"
my_model <- lm(mpg ~ wt, data = mtcars)

wt_grid <- data.frame(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 50))
my_ci   <- cbind(wt_grid, as.data.frame(
  predict(my_model, newdata = wt_grid, interval = "confidence")))
head(my_ci)
#>         wt      fit      lwr      upr
#> 1 1.513000 29.19894 26.96376 31.43412
#> 2 1.592816 28.77236 26.61606 30.92867
#> 3 1.672633 28.34579 26.26736 30.42421
#> 4 1.752449 27.91921 25.91754 29.92088
#> 5 1.832265 27.49264 25.56647 29.41880
#> 6 1.912082 27.06606 25.21399 28.91813
```

```r title="Exercise 2 solution: plot the band"
ggplot(my_ci, aes(x = wt)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), fill = "#fdae6b", alpha = 0.5) +
  geom_line(aes(y = fit), colour = "#e6550d", linewidth = 1) +
  geom_point(data = mtcars, aes(x = wt, y = mpg), alpha = 0.6) +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon")
```

**Explanation:** The heavier the car, the lower the mileage, and the band shows how confident the model is about that downward line. It stays tight through the bulk of the data and widens at the extremes where cars are rarer.

</details>

### Exercise 3: Shade a min-to-max range with an average line

Sometimes the band is not a confidence interval but a plain range: the lowest and highest observed values, with the mean drawn on top. Using the simulated monthly readings below, compute each month's minimum, mean and maximum, then plot a ribbon from min to max with the mean as a line.

```r title="Exercise 3 starter: simulated monthly data"
# The data is ready. Aggregate per month, then draw the range + mean line.
set.seed(2024)
sim <- data.frame(
  month = rep(1:12, each = 5),
  temp  = round(rnorm(60, mean = rep(seq(5, 27, length.out = 12), each = 5), sd = 3), 1)
)
head(sim)
#>   month temp
#> 1     1  7.9
#> 2     1  6.4
#> 3     1  4.7
#> 4     1  4.4
#> 5     1  8.5
#> 6     2 10.9
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution: aggregate the range"
band_df <- sim |>
  group_by(month) |>
  summarise(mean_t = mean(temp), lo = min(temp), hi = max(temp), .groups = "drop")
head(band_df)
#> # A tibble: 6 × 4
#>   month mean_t    lo    hi
#>   <int>  <dbl> <dbl> <dbl>
#> 1     1   6.38   4.4   8.5
#> 2     2   6.6    3.3  10.9
#> 3     3   7     -0.8  11.5
#> 4     4   8.48   5    12.4
#> 5     5  14.6   12.4  16.4
#> 6     6  13.1    8.8  17.1
```

```r title="Exercise 3 solution: plot range and mean"
ggplot(band_df, aes(x = month)) +
  geom_ribbon(aes(ymin = lo, ymax = hi), fill = "#c7e9c0") +
  geom_line(aes(y = mean_t), colour = "#31a354", linewidth = 1) +
  scale_x_continuous(breaks = 1:12)
```

**Explanation:** `summarise()` collapses the five readings per month into three numbers, and `geom_ribbon()` fills between the monthly min and max while the line traces the mean. This pattern works for any "typical value plus spread" chart.

</details>

## Frequently Asked Questions

#### When should I use geom_area() instead of geom_line()?

Reach for `geom_area()` when the quantity itself matters and zero is a meaningful floor, because the filled height makes magnitude easy to feel. Use `geom_line()` when you only care about the direction and shape of the trend, or when zero is far from your data and would make an area chart misleading.

#### What is the difference between geom_area() and geom_ribbon()?

`geom_area()` fills from a fixed baseline of zero up to your y value, so it is for totals and volumes. `geom_ribbon()` fills between a lower `ymin` and an upper `ymax` that you choose at each x, so it is for ranges like confidence intervals. Mechanically, `geom_area()` is `geom_ribbon()` with `ymin` locked to zero.

#### How do I make a 100 percent stacked (proportional) area chart?

Add `position = "fill"` to `geom_area()`. That rescales every column so the groups always sum to the full height, turning absolute values into shares. Pair it with `scale_y_continuous(labels = scales::percent)` so the axis reads as percentages.

#### Why do my stacked areas look jagged or wrong?

The two usual causes are unsorted x values and unexpected stacking. An area connects points in row order, so sort the data by the x variable first. Also remember `geom_area()` stacks by default; if you wanted overlapping areas, set `position = "identity"` and add an `alpha` for transparency.

#### How do I add a confidence interval band around a regression line?

Fit the model, then call `predict()` with `interval = "confidence"` on a grid of x values to get `fit`, `lwr` and `upr` columns. Draw `geom_ribbon(aes(ymin = lwr, ymax = upr))` first, then `geom_line(aes(y = fit))` on top. For a quick version without building the grid yourself, `geom_smooth(method = "lm")` draws the same band automatically.

## Summary

Area charts and ribbons are one family: both fill the space between two edges, and the only question is where those edges sit. Pick the geom and position that match the question you are answering.

| Goal | Geom and setting | Key arguments |
|---|---|---|
| One series over time | `geom_area()` | `fill`, `alpha` |
| Compare group totals | `geom_area()` with `position = "stack"` (default) | `fill = group` |
| Compare group shares | `geom_area(position = "fill")` | `scale_y_continuous(labels = scales::percent)` |
| Overlapping areas | `geom_area(position = "identity")` | `alpha` for transparency |
| A range or confidence band | `geom_ribbon()` | `aes(ymin, ymax)` |

![A quick guide to choosing the right area geom](screenshots/ggplot2-Area-Charts-and-Ribbons-in-R-decision.webp)

*Figure 3: A quick guide to picking the right area geom for the job.*

The three habits that keep these charts honest: anchor at zero only when zero means something, sort your x axis before plotting, and always draw the ribbon underneath the line it belongs to.

## References

1. ggplot2 documentation. Ribbons and area plots (`geom_ribbon`, `geom_area`). [Link](https://ggplot2.tidyverse.org/reference/geom_ribbon.html)
2. ggplot2 documentation. Stack overlapping objects (`position_stack`, `position_fill`). [Link](https://ggplot2.tidyverse.org/reference/position_stack.html)
3. ggplot2 documentation. ColorBrewer palettes (`scale_fill_brewer`). [Link](https://ggplot2.tidyverse.org/reference/scale_brewer.html)
4. Wickham, H., Navarro, D., Pedersen, T. L. *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. [Link](https://ggplot2-book.org/)
5. Wickham, H., Cetinkaya-Rundel, M., Grolemund, G. *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)
6. R Core Team. `predict.lm` documentation (confidence and prediction intervals). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html)
7. The R Graph Gallery. Stacked area chart with ggplot2. [Link](https://r-graph-gallery.com/stacked-area-graph.html)

## Continue Learning

- [ggplot2 Line Charts](ggplot2-Line-Charts.html) - the trend-line cousin of the area chart, and the natural next step after single-series areas.
- [geom_smooth() in R](geom_smooth-in-R.html) - draw a fitted trend with its confidence band in one layer, using the ribbon idea automatically.
- [ggplot2 Scales](ggplot2-Scales.html) - go deeper on percent axes, colour palettes, and the `scale_*` functions used throughout this tutorial.
