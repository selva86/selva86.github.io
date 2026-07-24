---
title: "Error Bars in ggplot2: geom_errorbar, pointrange, crossbar"
slug: "ggplot2-Error-Bars-in-R"
description: "Add error bars in ggplot2 with geom_errorbar, geom_pointrange, and geom_crossbar. Compute SD, SE, and confidence intervals, then dodge grouped bars correctly."
keywords: "error bars ggplot2, geom_errorbar, geom_pointrange, geom_crossbar, geom_linerange, ggplot2 confidence interval, standard error bars R, grouped error bars, position_dodge error bars"
auto_link_terms: "error bars in ggplot2|ggplot2 error bars|geom_errorbar()|geom_pointrange()|geom_crossbar()|geom_linerange()|error bars in R|add error bars in ggplot2|confidence interval error bars|standard error bars|dodged error bars"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-24"
curriculum_id: "GG2-2.8"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Error Bars"
sidebar_order: 46
difficulty: "Intermediate"
---

<p class="lead">Error bars show the uncertainty around a summary value such as a group mean. In ggplot2 you draw them by computing the interval yourself, then mapping <code>ymin</code> and <code>ymax</code> to a geom like <code>geom_errorbar()</code>, <code>geom_pointrange()</code>, or <code>geom_crossbar()</code>.</p>

## How do you add error bars to a ggplot2 chart?

Here is the one thing that trips up nearly every beginner: ggplot2 never calculates the error interval for you. Unlike a bar height, which `geom_bar()` can count on its own, an error bar needs two numbers you supply, a lower bound and an upper bound. So every error bar chart starts the same way, by boiling raw data down to a small summary table of means and spreads.

Let's do exactly that with `ToothGrowth`, a built-in dataset that records the tooth length of 60 guinea pigs given vitamin C at three doses. We use `dplyr` to compute, for each dose, the sample size, the mean length, the standard deviation, and the standard error (more on that last one shortly). This tutorial uses base ggplot2 and dplyr throughout, both run directly in your browser.

```r title="Summarise before you plot"
library(ggplot2)
library(dplyr)

tg_summary <- ToothGrowth |>
  group_by(dose) |>
  summarise(
    n    = n(),
    mean = mean(len),
    sd   = sd(len),
    .groups = "drop"
  ) |>
  mutate(se = sd / sqrt(n))

tg_summary
#> # A tibble: 3 × 5
#>    dose     n  mean    sd    se
#>   <dbl> <int> <dbl> <dbl> <dbl>
#> 1   0.5    20  10.6  4.50 1.01 
#> 2   1      20  19.7  4.42 0.987
#> 3   2      20  26.1  3.77 0.844
```

Read the table one row at a time. At a dose of 0.5 mg/day, the 20 guinea pigs in that group had a mean tooth length of 10.6, and the values spread out with a standard deviation of 4.50. The `se` column, the standard error, is just `sd / sqrt(n)`. (The `.groups = "drop"` argument just returns a plain, ungrouped table, so later steps treat the result as ordinary data.) Those `mean` and `se` columns are the raw material for every chart in this tutorial. This is the recipe in miniature: summarise first, plot second.

![The two-step recipe: summarise your data, then map the interval to a geom.](screenshots/ggplot2-Error-Bars-in-R-recipe-flow.webp)

*Figure 1: The two-step recipe: summarise your data, then map the interval to a geom.*

Now we hand those numbers to ggplot2. We plot the mean at each dose and draw an error bar reaching one standard error above and below it. `geom_pointrange()` is the tidiest way to show this: it draws the point (the mean) and the interval (the bar) in a single layer.

```r title="Draw the payoff error bar chart"
ggplot(tg_summary, aes(x = dose, y = mean)) +
  geom_line(color = "grey60") +
  geom_pointrange(aes(ymin = mean - se, ymax = mean + se),
                  color = "steelblue", linewidth = 0.8) +
  labs(
    title    = "Tooth growth increases with vitamin C dose",
    subtitle = "Point = mean, bar = plus or minus one standard error",
    x = "Dose (mg/day)", y = "Tooth length"
  ) +
  theme_minimal()
```

Notice how the interval is built inside `aes()`: `ymin = mean - se` and `ymax = mean + se`. You are doing the arithmetic, and ggplot2 is just drawing the lines you asked for. The mean climbs from about 10 to 26 as the dose rises, and the short bars tell you each mean is measured fairly precisely. That combination, a clear trend plus a sense of confidence in it, is exactly what an error bar is for.

[KEY INSIGHT]
**You always supply ymin and ymax yourself.** Every error bar geom needs a lower and upper bound as aesthetics. These geoms never compute a standard deviation or confidence interval on your behalf, so a summarise step comes first.

**Try it:** Build a summary table like `tg_summary`, but group by `supp` (the supplement type, OJ or VC) instead of `dose`. You should end up with two rows.

```r title="Your turn: summarise by supplement"
# Goal: one row per supp (OJ, VC), with columns mean and se.
# Start from ToothGrowth, group_by(supp), then summarise() + mutate().
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Summarise by supplement solution"
ex_summary <- ToothGrowth |>
  group_by(supp) |>
  summarise(
    n    = n(),
    mean = mean(len),
    sd   = sd(len),
    .groups = "drop"
  ) |>
  mutate(se = sd / sqrt(n))

ex_summary
#> # A tibble: 2 × 5
#>   supp      n  mean    sd    se
#>   <fct> <int> <dbl> <dbl> <dbl>
#> 1 OJ       30  20.7  6.61  1.21
#> 2 VC       30  17.0  8.27  1.51
```

**Explanation:** Swapping `dose` for `supp` in `group_by()` regroups the same 60 rows into two supplement groups of 30 each. The recipe does not change, only the grouping variable does.

</details>

## What is the geom_errorbar() function and how does it work?

`geom_errorbar()` draws the classic "I-beam", a vertical line with a small horizontal cap at each end. It is the most recognisable error bar style and the one people usually mean when they say "add error bars". It needs three aesthetics: an `x` position, a `ymin`, and a `ymax`.

The most common pattern is a bar chart with error bars on top. We map `dose` to the x axis (wrapped in `factor()` so it is treated as three distinct categories, not a continuous number), draw the bars with `geom_col()`, then overlay `geom_errorbar()`.

```r title="Add error bars to a bar chart"
ggplot(tg_summary, aes(x = factor(dose), y = mean)) +
  geom_col(fill = "grey80") +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se), width = 0.2) +
  labs(x = "Dose (mg/day)", y = "Mean tooth length") +
  theme_minimal()
```

The `width = 0.2` argument controls how wide the end caps are, as a fraction of the space between categories. Two arguments are easy to confuse here, so it is worth pinning them down. `width` sets the horizontal size of the caps, while `linewidth` sets how thick the drawn line is. Let's change both, and the colour, to see the difference.

```r title="Style the error bar width and thickness"
ggplot(tg_summary, aes(x = factor(dose), y = mean)) +
  geom_col(fill = "grey80") +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se),
                width = 0.15, linewidth = 0.9, color = "firebrick") +
  labs(x = "Dose (mg/day)", y = "Mean tooth length") +
  theme_minimal()
```

The caps are now narrower (`width = 0.15`) and the line is heavier and red. Adjust `width` for readability: very wide caps clutter a crowded chart, while very narrow caps can be hard to see.

[TIP]
**Keep width and linewidth straight.** The `width` argument changes the horizontal cap size, and `linewidth` changes the thickness of the line. If your caps look wrong, you are almost always reaching for the wrong one of these two.

**Try it:** Copy the bar chart above and shrink the caps to almost nothing with `width = 0.05`. Notice how the error bars start to look like plain vertical lines.

```r title="Your turn: narrower caps"
# Take the geom_col + geom_errorbar chart above.
# Change the geom_errorbar width to 0.05 and rerun.
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Narrower caps solution"
ggplot(tg_summary, aes(x = factor(dose), y = mean)) +
  geom_col(fill = "grey80") +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se), width = 0.05) +
  theme_minimal()
```

**Explanation:** With `width = 0.05` the horizontal caps almost disappear, leaving thin vertical strokes. This is effectively what `geom_linerange()` draws, which is the next geom we will meet.

</details>

## How do you use geom_pointrange, geom_linerange, and geom_crossbar?

`geom_errorbar()` is not your only option. ggplot2 ships four interval geoms, and they all read the same `ymin` and `ymax` aesthetics. They differ only in what they draw, so choosing between them is a matter of taste and emphasis, not new data.

![The four interval geoms and what each one draws.](screenshots/ggplot2-Error-Bars-in-R-geom-decision.webp)

*Figure 2: The four interval geoms and what each one draws.*

`geom_linerange()` is the simplest: a plain vertical line from `ymin` to `ymax`, with no cap and no centre marker. It is often paired with `geom_point()` so the mean is still visible.

```r title="Draw a plain interval with geom_linerange"
ggplot(tg_summary, aes(x = factor(dose), y = mean)) +
  geom_linerange(aes(ymin = mean - se, ymax = mean + se)) +
  geom_point(size = 2, color = "steelblue") +
  labs(x = "Dose (mg/day)", y = "Mean tooth length") +
  theme_minimal()
```

The line shows the interval and the blue dot marks the mean. `geom_pointrange()`, which we used at the very start, does both of these in one layer, so it is usually the cleaner choice when you want a point plus its interval.

`geom_crossbar()` takes a different approach. Instead of a thin line, it draws a hollow box spanning `ymin` to `ymax`, with a horizontal line marking the mean. It reads well when the interval itself is the focus, for example a range of plausible values rather than a precise estimate.

```r title="Show the mean as a crossbar"
ggplot(tg_summary, aes(x = factor(dose), y = mean)) +
  geom_crossbar(aes(ymin = mean - se, ymax = mean + se),
                width = 0.5, fill = "lightblue") +
  labs(x = "Dose (mg/day)", y = "Mean tooth length") +
  theme_minimal()
```

Each box now spans one standard error either side of the mean, and the horizontal line inside marks the mean itself. Here is a quick guide to picking the right geom.

| Geom | What it draws | Centre marker | Best for |
|------|---------------|---------------|----------|
| `geom_errorbar()` | Vertical line with end caps | No | Bars and points, the familiar I-beam |
| `geom_pointrange()` | Line plus a point | Yes, a point | A mean with its interval, one clean layer |
| `geom_linerange()` | Plain line only | No | Minimal look, or pairing with your own point |
| `geom_crossbar()` | Hollow box with a middle line | Yes, a line | Emphasising the range as a band |

[NOTE]
**Use middle.linewidth to thicken a crossbar's centre line.** Older tutorials use a `fatten` argument for this, but `fatten` was deprecated in ggplot2 4.0. The current argument is `middle.linewidth`, which sets the thickness of the horizontal line marking the mean.

**Try it:** Take the `geom_linerange()` chart above and replace `geom_linerange()` with `geom_pointrange()`. You can delete the separate `geom_point()` line, since pointrange draws the point for you.

```r title="Your turn: switch to pointrange"
# Start from the geom_linerange + geom_point chart.
# Replace both layers with a single geom_pointrange().
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Switch to pointrange solution"
ggplot(tg_summary, aes(x = factor(dose), y = mean)) +
  geom_pointrange(aes(ymin = mean - se, ymax = mean + se)) +
  theme_minimal()
```

**Explanation:** `geom_pointrange()` combines the line and the point into one layer, so it replaces the `geom_linerange()` and `geom_point()` pair with a single, tidier call.

</details>

## Should you use standard deviation, standard error, or a confidence interval?

This is the question that matters most, and the one most tutorials skip. The three most common error bars, standard deviation (SD), standard error (SE), and confidence interval (CI), are computed differently and answer different questions. Picking the wrong one can badly mislead your reader.

![SD, SE, and CI each answer a different question.](screenshots/ggplot2-Error-Bars-in-R-sd-se-ci.webp)

*Figure 3: SD, SE, and CI each answer a different question.*

Here is the plain-language version. **Standard deviation** measures how spread out the individual data points are; it answers "how different are the guinea pigs from each other?". **Standard error** measures how precisely you have pinned down the mean; it answers "if I repeated this study, how much would the mean bounce around?". A **confidence interval** turns that precision into a range, typically 95%, that plausibly contains the true mean.

SE and CI are built from SD, so let's compute all three side by side. We already have `sd` and `se` in `tg_summary`. A 95% confidence interval extends the mean by a t-multiplier times the standard error, so we add that column with `qt()`. We pass `0.975` to `qt()` because a 95% interval leaves 2.5% in each tail of the distribution (2.5% + 95% + 2.5% = 100%).

```r title="Compute standard error and a confidence interval"
tg_ci <- tg_summary |>
  mutate(ci = qt(0.975, df = n - 1) * se)

tg_ci
#> # A tibble: 3 × 6
#>    dose     n  mean    sd    se    ci
#>   <dbl> <int> <dbl> <dbl> <dbl> <dbl>
#> 1   0.5    20  10.6  4.50 1.01   2.11
#> 2   1      20  19.7  4.42 0.987  2.07
#> 3   2      20  26.1  3.77 0.844  1.77
```

Look at the first row. The standard deviation is 4.50, the standard error is 1.01, and the 95% confidence margin is 2.11. Same data, three very different bar lengths. An SD bar would stretch about 4.5 units either side of the mean, an SE bar only about 1, and a CI bar about 2.1. If you drew SD bars but told the reader they were standard errors, you would overstate the uncertainty in the mean more than fourfold.

If you like the underlying formulas, here they are. The standard error scales the spread of the data by the square root of the sample size:

$$SE = \frac{s}{\sqrt{n}}$$

And the confidence interval widens the mean by a critical t-value times that standard error:

$$\bar{x} \pm t_{(1 - \alpha/2,\; n-1)} \times SE$$

Where:

- $s$ = the sample standard deviation
- $n$ = the number of observations in the group
- $\bar{x}$ = the group mean
- $t_{(1 - \alpha/2,\; n-1)}$ = the critical value from the t-distribution (about 2.09 for a 95% interval with 19 degrees of freedom)

If formulas are not your thing, skip them; the code above computes everything you need. Now let's plot the confidence interval so you can see it directly.

```r title="Plot the 95% confidence interval"
ggplot(tg_ci, aes(x = factor(dose), y = mean)) +
  geom_pointrange(aes(ymin = mean - ci, ymax = mean + ci),
                  color = "darkgreen") +
  labs(x = "Dose (mg/day)", y = "Mean tooth length (95% CI)") +
  theme_minimal()
```

Because none of the three intervals overlap between doses, you can be confident the doses really do differ. That is the practical payoff of a confidence interval: non-overlapping bars are a quick visual signal of a real difference.

[KEY INSIGHT]
**Standard error and confidence intervals shrink as your sample grows, but standard deviation does not.** SE divides by the square root of n, so more data means tighter SE and CI bars. SD describes the spread of the population itself, so collecting more guinea pigs does not make it smaller. Always label which one you are showing.

**Try it:** Confidence intervals do not have to be 95%. Add a `ci90` column to `tg_summary` for a 90% interval. Hint: a 90% interval uses `qt(0.95, ...)` instead of `qt(0.975, ...)`.

```r title="Your turn: a 90% confidence interval"
# Add a column ci90 to tg_summary using qt(0.95, df = n - 1) * se.
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="A 90% confidence interval solution"
ex_ci <- tg_summary |>
  mutate(ci90 = qt(0.95, df = n - 1) * se)

ex_ci
#> # A tibble: 3 × 6
#>    dose     n  mean    sd    se  ci90
#>   <dbl> <int> <dbl> <dbl> <dbl> <dbl>
#> 1   0.5    20  10.6  4.50 1.01   1.74
#> 2   1      20  19.7  4.42 0.987  1.71
#> 3   2      20  26.1  3.77 0.844  1.46
```

**Explanation:** A 90% interval leaves 5% in each tail, so you pass `0.95` to `qt()`. The margins (1.74, 1.71, 1.46) are smaller than the 95% margins because a lower confidence level needs a narrower interval to cover the middle.

</details>

## How do you add error bars to grouped and dodged charts?

Real comparisons usually have two grouping variables, not one. In `ToothGrowth` each dose was delivered by two supplements, orange juice (OJ) and ascorbic acid (VC). To compare them we summarise by both variables, then place the two supplement bars side by side within each dose. Side-by-side placement is called "dodging".

First, the summary. We group by `supp` and `dose` together, which gives six rows, one per supplement-and-dose combination.

```r title="Summarise by two grouping variables"
tg_grouped <- ToothGrowth |>
  group_by(supp, dose) |>
  summarise(
    n    = n(),
    mean = mean(len),
    sd   = sd(len),
    .groups = "drop"
  ) |>
  mutate(se = sd / sqrt(n))

tg_grouped
#> # A tibble: 6 × 6
#>   supp   dose     n  mean    sd    se
#>   <fct> <dbl> <int> <dbl> <dbl> <dbl>
#> 1 OJ      0.5    10 13.2   4.46 1.41 
#> 2 OJ      1      10 22.7   3.91 1.24 
#> 3 OJ      2      10 26.1   2.66 0.840
#> 4 VC      0.5    10  7.98  2.75 0.869
#> 5 VC      1      10 16.8   2.52 0.795
#> 6 VC      2      10 26.1   4.80 1.52 
```

Now the trap that catches everyone. When you dodge bars, the error bars must be dodged by the *same amount*, or they will float off to the side and sit over the wrong bar. The fix is to define one `position_dodge()` object and hand it to both `geom_col()` and `geom_errorbar()`.

```r title="Dodge grouped bars and their error bars together"
pd <- position_dodge(width = 0.9)

ggplot(tg_grouped, aes(x = factor(dose), y = mean, fill = supp)) +
  geom_col(position = pd, width = 0.9) +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se),
                position = pd, width = 0.2) +
  labs(x = "Dose (mg/day)", y = "Mean tooth length", fill = "Supplement") +
  theme_minimal()
```

Both layers share the same `pd`, so every error bar lands squarely on its own bar. Notice we also match the `width = 0.9` on `geom_col()` to the dodge width, which keeps the bars snug within each dose group.

[WARNING]
**Mismatched dodge widths misalign the bars.** If `geom_col()` and `geom_errorbar()` use different `position_dodge()` widths, the error bars drift away from the bars they belong to. Define one dodge object and pass it to every layer that needs to line up.

Bar charts with error bars are common, but they have a downside: the solid bar hides everything except its top, and the "dynamite plot" look is often criticised for that reason. A dodged `geom_pointrange()` shows the same comparison with less ink and no misleading bars.

```r title="A cleaner grouped view with pointrange"
ggplot(tg_grouped, aes(x = factor(dose), y = mean, color = supp)) +
  geom_pointrange(aes(ymin = mean - se, ymax = mean + se),
                  position = position_dodge(width = 0.4)) +
  labs(x = "Dose (mg/day)", y = "Mean tooth length", color = "Supplement") +
  theme_minimal()
```

Each dose now shows two points with their intervals, and the OJ-versus-VC gap is easy to read at a glance, especially at the lower doses where the supplements differ most.

**Try it:** Rebuild the dodged bar chart, but change the shared dodge width to `0.5` on both layers. Keep the two geoms in sync.

```r title="Your turn: a tighter dodge"
# Define pd5 <- position_dodge(width = 0.5).
# Pass pd5 to BOTH geom_col(position = ...) and geom_errorbar(position = ...).
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="A tighter dodge solution"
pd5 <- position_dodge(width = 0.5)

ggplot(tg_grouped, aes(x = factor(dose), y = mean, fill = supp)) +
  geom_col(position = pd5, width = 0.5) +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se),
                position = pd5, width = 0.2) +
  theme_minimal()
```

**Explanation:** As long as both layers reference the same `pd5`, the bars and their error bars move together. Matching the `geom_col()` `width` to the dodge width keeps the paired bars from overlapping.

</details>

## How do you make horizontal error bars?

Sometimes horizontal bars read better, especially with long category labels. The modern way to flip an error bar is the `orientation` argument. You map your value to `x` and your category to `y`, then supply `xmin` and `xmax` (instead of `ymin` and `ymax`) and set `orientation = "y"`.

```r title="Flip error bars to horizontal with orientation"
ggplot(tg_summary, aes(x = mean, y = factor(dose))) +
  geom_point(size = 2, color = "steelblue") +
  geom_errorbar(aes(xmin = mean - se, xmax = mean + se),
                orientation = "y", width = 0.2) +
  labs(x = "Mean tooth length", y = "Dose (mg/day)") +
  theme_minimal()
```

The error bars now run left to right, and the dose categories stack vertically. The `orientation = "y"` argument tells ggplot2 that the intervals live along the x axis for each y group.

[WARNING]
**geom_errorbarh() is deprecated, use orientation instead.** Older code drew horizontal error bars with a separate `geom_errorbarh()` function, but ggplot2 4.0 deprecated it. The current approach is `geom_errorbar()` with `xmin`, `xmax`, and `orientation = "y"`, which keeps everything in one consistent geom.

**Try it:** Redraw the horizontal chart using `geom_pointrange()` instead of the separate point and error bar. Pointrange also accepts `orientation = "y"`.

```r title="Your turn: horizontal pointrange"
# Map x = mean, y = factor(dose).
# Use geom_pointrange with xmin/xmax and orientation = "y".
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Horizontal pointrange solution"
ggplot(tg_summary, aes(x = mean, y = factor(dose))) +
  geom_pointrange(aes(xmin = mean - se, xmax = mean + se),
                  orientation = "y") +
  theme_minimal()
```

**Explanation:** `geom_pointrange()` understands `orientation = "y"` just like `geom_errorbar()` does, so one layer draws the horizontal interval and its centre point together.

</details>

## Putting it all together: a publication-ready error bar chart

Let's combine everything into one chart you would be happy to put in a report. We summarise `ToothGrowth` by supplement and dose, compute the standard error, then draw a dodged line-and-pointrange chart with a clear title, custom colours, and a clean theme. This single block runs the whole recipe from raw data to finished figure.

```r title="Assemble a publication-ready error bar chart"
tg_pub <- ToothGrowth |>
  group_by(supp, dose) |>
  summarise(
    mean = mean(len),
    se   = sd(len) / sqrt(n()),
    .groups = "drop"
  )

ggplot(tg_pub, aes(x = factor(dose), y = mean, color = supp, group = supp)) +
  geom_line(position = position_dodge(width = 0.3)) +
  geom_pointrange(aes(ymin = mean - se, ymax = mean + se),
                  position = position_dodge(width = 0.3)) +
  scale_color_manual(values = c(OJ = "#D55E00", VC = "#0072B2")) +
  labs(
    title    = "Vitamin C boosts tooth growth at every dose",
    subtitle = "Orange juice leads ascorbic acid at low doses",
    x = "Dose (mg/day)", y = "Mean tooth length",
    color = "Supplement"
  ) +
  theme_minimal()
```

Every technique from this tutorial is in that chart. We summarised first, mapped `ymin` and `ymax` from the mean and standard error, used `geom_pointrange()` for a clean interval, dodged both the line and the pointrange by a matching width, and finished with manual colours and a title. That is the full workflow, start to end.

[TIP]
**Colour-blind-safe palettes make error bar charts clearer.** The hex codes used above (`#D55E00` orange and `#0072B2` blue) come from a colour-blind-friendly palette. When two groups sit side by side, a high-contrast pair keeps the comparison readable for every reader.

## Practice Exercises

These exercises combine several ideas from the tutorial. Try each one before opening the solution. They use fresh variable names (prefixed `my_` or `iris_`) so they will not overwrite the tutorial's objects.

### Exercise 1: Error bars on the iris dataset

Summarise the `iris` dataset to get the mean and standard error of `Sepal.Length` for each `Species`, then draw a bar chart with error bars. Save the summary to `iris_summary`.

```r title="Exercise 1 starter"
# 1. group_by(Species), summarise mean and se of Sepal.Length
# 2. geom_col + geom_errorbar with width around 0.2
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
iris_summary <- iris |>
  group_by(Species) |>
  summarise(
    mean = mean(Sepal.Length),
    se   = sd(Sepal.Length) / sqrt(n()),
    .groups = "drop"
  )

ggplot(iris_summary, aes(x = Species, y = mean)) +
  geom_col(fill = "grey80") +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se), width = 0.2) +
  labs(x = "Species", y = "Mean sepal length") +
  theme_minimal()

iris_summary
#> # A tibble: 3 × 3
#>   Species     mean     se
#>   <fct>      <dbl>  <dbl>
#> 1 setosa      5.01 0.0498
#> 2 versicolor  5.94 0.0730
#> 3 virginica   6.59 0.0899
```

**Explanation:** The same recipe transfers straight to a new dataset: group, summarise mean and se, then map `ymin` and `ymax`. The three species have tight error bars because each has 50 observations.

</details>

### Exercise 2: Grouped confidence intervals with pointrange

Using `ToothGrowth`, build a grouped `geom_pointrange()` chart of mean tooth length by dose, coloured by supplement, with 95% confidence interval bars. Dodge the two supplements so they do not overlap. Save your summary to `my_tg`.

```r title="Exercise 2 starter"
# 1. group_by(supp, dose), summarise mean, se, and n
# 2. add a ci column with qt(0.975, df = n - 1) * se
# 3. geom_pointrange with position_dodge, color = supp
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_tg <- ToothGrowth |>
  group_by(supp, dose) |>
  summarise(
    mean = mean(len),
    se   = sd(len) / sqrt(n()),
    n    = n(),
    .groups = "drop"
  ) |>
  mutate(ci = qt(0.975, df = n - 1) * se)

ggplot(my_tg, aes(x = factor(dose), y = mean, color = supp)) +
  geom_pointrange(aes(ymin = mean - ci, ymax = mean + ci),
                  position = position_dodge(width = 0.5)) +
  labs(x = "Dose (mg/day)", y = "Mean tooth length (95% CI)",
       color = "Supplement") +
  theme_minimal()
```

**Explanation:** The confidence margin uses the group's own sample size through `df = n - 1`. Dodging by 0.5 separates the OJ and VC intervals at each dose so the comparison stays readable.

</details>

### Exercise 3: A line chart with error bars

Draw a line chart of mean tooth length across dose, with one line per supplement and an error bar at every point. Reuse the `tg_grouped` summary from earlier. Add points on top so each mean is marked, and dodge all three layers by the same small amount.

```r title="Exercise 3 starter"
# Reuse tg_grouped (supp, dose, mean, se).
# Layer geom_line + geom_errorbar + geom_point, all sharing one position_dodge.
# color = supp, group = supp
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
pd3 <- position_dodge(width = 0.2)

ggplot(tg_grouped, aes(x = factor(dose), y = mean, color = supp, group = supp)) +
  geom_line(position = pd3) +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se),
                position = pd3, width = 0.15) +
  geom_point(position = pd3, size = 2) +
  labs(x = "Dose (mg/day)", y = "Mean tooth length", color = "Supplement") +
  theme_minimal()
```

**Explanation:** All three layers share `pd3`, so the lines, error bars, and points stay locked together within each dose. The `group = supp` aesthetic tells `geom_line()` to connect points within a supplement rather than across supplements.

</details>

## Summary

Error bars in ggplot2 come down to one rule and one choice. The rule: compute your interval first, then map `ymin` and `ymax` to a geom. The choice: which geom and which interval fit your message.

![Overview of the error-bar workflow in ggplot2.](screenshots/ggplot2-Error-Bars-in-R-overview.webp)

*Figure 4: Overview of the error-bar workflow in ggplot2.*

| Concept | Key takeaway |
|---------|--------------|
| The recipe | Summarise to means and spreads first; ggplot2 never computes the interval for you |
| `geom_errorbar()` | The classic I-beam; `width` sets cap size, `linewidth` sets line thickness |
| `geom_pointrange()` | Point plus interval in one layer, the tidiest default |
| `geom_linerange()` / `geom_crossbar()` | Plain line, or a box with a centre line for range emphasis |
| SD vs SE vs CI | SD is data spread, SE is mean precision, CI is a plausible range for the true mean |
| Grouped charts | Give one `position_dodge()` to every layer so bars and error bars stay aligned |
| Horizontal bars | Use `xmin`, `xmax`, and `orientation = "y"`; `geom_errorbarh()` is deprecated |

With the summarise-then-map recipe in hand, you can add honest, well-labelled uncertainty to any ggplot2 chart.

## FAQ

**Why don't my error bars line up with my bars?**

Almost always a dodge mismatch. When you place grouped bars side by side, `geom_col()` and `geom_errorbar()` must use the same `position_dodge()` width. Define one dodge object, such as `pd <- position_dodge(width = 0.9)`, and pass it to both layers so each error bar sits on its own bar.

**Should I use standard deviation or standard error for my error bars?**

It depends on your message. Use standard deviation to show how spread out the raw data is, and standard error (or a confidence interval) to show how precisely you have estimated the mean. Whichever you pick, label it clearly, because the three produce very different bar lengths from the same data.

**How do I add error bars to a plot without bars?**

Use `geom_pointrange()` or `geom_linerange()` on a point plot. They read the same `ymin` and `ymax` aesthetics as `geom_errorbar()`, so you get an interval around each mean without drawing any bars. Many people prefer this because solid bars can hide the underlying data.

**Why doesn't ggplot2 calculate error bars for me automatically?**

Because there is no single correct interval. Standard deviation, standard error, and confidence intervals all answer different questions, so ggplot2 leaves the choice to you. You compute the interval in a summarise step, then map `ymin` and `ymax` to a geom. There is one shortcut: `stat_summary(fun.data = mean_se)` will add mean plus or minus one standard error straight from the raw data, but it offers only a few built-in intervals and less control, so precomputing stays the clearer default.

**How do I make horizontal error bars in ggplot2?**

Map your value to `x` and your category to `y`, then use `xmin` and `xmax` with `orientation = "y"`. The old `geom_errorbarh()` function still exists but is deprecated, so `geom_errorbar(orientation = "y")` is the current approach.

## References

1. ggplot2 reference. *Vertical intervals: lines, crossbars and errorbars.* The canonical argument list for all four interval geoms used here. [Link](https://ggplot2.tidyverse.org/reference/geom_linerange.html)
2. ggplot2 reference. *position_dodge: Dodge overlapping objects side-to-side.* Explains the dodge argument behind the grouped-chart alignment fix. [Link](https://ggplot2.tidyverse.org/reference/position_dodge.html)
3. Wickham, H., Navarro, D., and Pedersen, T. L. *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. The book-length treatment of layers, aesthetics, and positions. [Link](https://ggplot2-book.org/)
4. Wickham, H., Cetinkaya-Rundel, M., and Grolemund, G. *R for Data Science*, 2nd Edition. Background on the dplyr group-and-summarise step every chart starts from. [Link](https://r4ds.hadley.nz/)
5. Cumming, G., Fidler, F., and Vaux, D. L. *Error bars in experimental biology.* Journal of Cell Biology (2007). Why SD, SE, and CI bars mean different things and how they are misread. [Link](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2064100/)
6. R documentation. *The ToothGrowth dataset.* Details of the built-in dataset used throughout this tutorial. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/ToothGrowth.html)

## Continue Learning

- [ggplot2 Bar Charts: geom_bar() and geom_col()](ggplot2-Bar-Charts.html) - the foundation for the bar-plus-error-bar charts in this tutorial.
- [ggplot2 Line Charts](ggplot2-Line-Charts.html) - build the line layer that error bars sit on top of in time-series and dose-response plots.
- [Error Bars in R: SD, SE, or CI, Done Right](Error-Bars-in-R.html) - a deeper look at choosing and computing the right uncertainty measure.
- [ggplot2 Area Charts and Ribbons](ggplot2-Area-Charts-and-Ribbons-in-R.html) - use geom_ribbon() to show a continuous uncertainty band instead of discrete bars.
