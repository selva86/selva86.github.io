---
title: "The ggplot2 stat System: What Every Geom Computes"
slug: "ggplot2-Stat-System-in-R"
description: "Every ggplot2 geom quietly runs a stat that reshapes your data before drawing. See what stats compute with layer_data(), and remap results using after_stat()."
keywords: "ggplot2 stat, ggplot2 statistical transformations, after_stat, computed variables ggplot2, stat_bin, stat_count, stat vs geom, stat_summary, layer_data, ggplot2 stats"
auto_link_terms: "ggplot2 stat system|statistical transformations|computed variables|after_stat()|stat_count()|stat_bin()|stat_summary()|stat_identity()|stat vs geom|layer_data()"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-24"
curriculum_id: "GG2-3.2"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "The stat System"
sidebar_order: 9
difficulty: "Intermediate"
---

<p class="lead">In ggplot2, every layer runs a hidden step called a <b>stat</b> that reshapes your data before a geom draws it. That stat is why <code>geom_bar()</code> can show bar heights you never calculated, and why a boxplot knows your quartiles. Once you can see what each stat computes, ggplot2 stops feeling like magic and starts feeling like a pipeline you control.</p>

## What does a ggplot2 geom actually do before it draws?

Here is a small mystery that trips up almost everyone. You hand `geom_bar()` a single categorical column, no y values at all, and it draws bars with different heights. Nobody typed those heights. So where did the numbers come from? The answer is a quiet computation step, run automatically inside the layer, called a statistical transformation, or "stat" for short.

Let's see the mystery and solve it in the same breath. We use `mpg`, a built-in dataset of 234 car models that ships with ggplot2, and look at how many cars fall into each drive train category (`drv` is `4` for four-wheel drive, `f` for front-wheel, `r` for rear-wheel). This tutorial uses base ggplot2 plus dplyr for the occasional cross-check, and everything runs directly in your browser. The tool that solves the mystery is `layer_data()`: it returns the exact table the geom received after the stat finished, so we can read what the stat computed.

```r title="Draw a bare bar chart, then read what the stat computed"
library(ggplot2)
library(dplyr)

p_bar <- ggplot(mpg, aes(x = drv)) +
  geom_bar()

p_bar

# layer_data() returns the table geom_bar() actually drew:
layer_data(p_bar)[, c("x", "count", "prop", "width")]
#>   x count prop width
#> 1 1   103    1   0.9
#> 2 2   106    1   0.9
#> 3 3    25    1   0.9
```

We gave the plot an x aesthetic and nothing else, yet three bars appear at different heights (the tallest is front-wheel drive), and `layer_data()` shows why. The stat created a `count` column (103, 106, 25) that was never in your raw data, and that column became each bar's height. It also created `prop` (the proportion within a group) and `width`. The x values show as 1, 2, 3 because ggplot2 places the three categories at those axis positions.

Every ggplot2 layer is built from four parts working in order: your **data**, a **stat** that transforms it, a **geom** that draws the transformed result, and a **position** adjustment that nudges overlapping shapes apart. The part beginners miss is the stat, because it usually runs silently. `geom_bar()` quietly attaches a counting stat, and that stat turns your 234 raw rows into a tiny three-row table of counts before a single rectangle is drawn.

![Inside a ggplot2 layer, the stat transforms your data before the geom draws it.](screenshots/ggplot2-Stat-System-in-R-layer-pipeline.webp)

*Figure 1: Inside every layer the stat transforms your data before the geom draws it.*

We can confirm those counts are real by computing them the plain dplyr way. If the numbers match, we have proven the stat is just doing a `count()` for us behind the scenes.

```r title="Cross-check the counts with dplyr"
count(mpg, drv)
#> # A tibble: 3 × 2
#>   drv       n
#>   <chr> <int>
#> 1 4       103
#> 2 f       106
#> 3 r        25
```

Identical: 103, 106, and 25. The bar chart's heights are exactly `count(mpg, drv)`, produced automatically by the stat attached to `geom_bar()`.

[KEY INSIGHT]
**The stat runs first, the geom only draws.** A geom never sees your raw data directly. It receives the table the stat produces, which is why a bar chart can show counts, a boxplot can show quartiles, and a histogram can show frequencies without you calculating any of them.

**Try it:** Draw a bar chart of the `class` column from `mpg` (car type: compact, suv, and so on), then use `layer_data()` to read the count the stat computed for each class. There are seven classes.

```r title="Your turn: count cars by class"
# Goal: build a bar chart of class, then read its computed counts.
# Step 1: ggplot(mpg, aes(x = class)) + geom_bar()  -> save it to p_class
# Step 2: pass p_class to layer_data() and look at the count column
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count cars by class solution"
p_class <- ggplot(mpg, aes(x = class)) + geom_bar()
count(mpg, class)
#> # A tibble: 7 × 2
#>   class          n
#>   <chr>      <int>
#> 1 2seater        5
#> 2 compact       47
#> 3 midsize       41
#> 4 minivan       11
#> 5 pickup        33
#> 6 subcompact    35
#> 7 suv           62
```

**Explanation:** `geom_bar()` attaches the counting stat, which turns the seven class groups into the seven counts above. `count(mpg, class)` reproduces the same numbers, confirming the bar heights came from a stat.

</details>

## How can you see what a stat computed? (layer_data)

You just met `layer_data()`, and it is the single most useful tool for understanding stats. Think of it as an x-ray: it shows you the finished layer, meaning the data table exactly as the geom received it after the stat ran. Any time you are unsure what a geom is drawing, x-ray it.

A boxplot is the perfect example, because it looks simple but hides a lot of arithmetic. When you draw a boxplot, a stat computes a five-number summary for each group: the lower whisker, the lower hinge (25th percentile), the median, the upper hinge (75th percentile), and the upper whisker. Let's build one for highway mileage by drive train, then x-ray it.

```r title="Build a boxplot of mileage by drive train"
p_box <- ggplot(mpg, aes(x = drv, y = hwy)) +
  geom_boxplot()

p_box
```

The plot shows three boxes. Now let's see the numbers the stat calculated to draw them. We pick the columns that map to the visible parts of each box.

```r title="X-ray the boxplot statistics"
layer_data(p_box)[, c("x", "ymin", "lower", "middle", "upper", "ymax")]
#>   x ymin lower middle upper ymax
#> 1 1   12    17     18    22   28
#> 2 2   22    26     28    29   33
#> 3 3   15    17     21    24   26
```

Read the first row, drive train `4` (four-wheel drive). Its box stretches from a lower hinge of 17 to an upper hinge of 22, with a median line at 18, and whiskers reaching down to 12 and up to 28. Every one of those numbers was computed by the boxplot's stat from the raw `hwy` values. The geom just drew rectangles and lines at the positions the stat handed it.

[TIP]
**layer_data() takes a layer number as its second argument.** When a plot has several layers, call layer_data(plot, 1) for the first layer, layer_data(plot, 2) for the second, and so on. With one layer you can leave it off, as we did here.

**Try it:** Using the boxplot `p_box` you just built, read off which drive train has the highest median highway mileage. Print just the `x` and `middle` columns to make it easy.

```r title="Your turn: find the highest median"
# Goal: show only the x and middle columns from the boxplot's layer_data.
# Then read which drive train (x = 1 is '4', 2 is 'f', 3 is 'r') has the top median.
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Find the highest median solution"
layer_data(p_box)[, c("x", "middle")]
#>   x middle
#> 1 1     18
#> 2 2     28
#> 3 3     21
```

**Explanation:** The `middle` column is the computed median for each group. Row 2 (`x = 2`, which is front-wheel drive `f`) has the highest median at 28 mpg. The stat computed each median; you only read it back.

</details>

## Which stat does each geom use by default?

Every geom ships with a **default stat**, and every stat ships with a default geom. That pairing is what makes ggplot2 feel effortless: you call `geom_bar()` and the right computation just happens. Understanding these defaults is the key to predicting what any geom will draw.

Here are the most common pairings. Each geom in this table runs its default stat automatically unless you tell it otherwise.

| Geom | Default stat | What the stat computes |
|------|--------------|------------------------|
| `geom_point()` | `stat_identity` | Nothing, draws x and y as given |
| `geom_line()` | `stat_identity` | Nothing, connects x and y as given |
| `geom_col()` | `stat_identity` | Nothing, you supply the bar heights |
| `geom_bar()` | `stat_count` | Count of rows per x category |
| `geom_histogram()` | `stat_bin` | Count of rows per x bin |
| `geom_freqpoly()` | `stat_bin` | Same bins as a histogram, drawn as a line |
| `geom_boxplot()` | `stat_boxplot` | Five-number summary plus outliers |
| `geom_violin()` | `stat_ydensity` | Kernel density per group |
| `geom_density()` | `stat_density` | Smoothed density curve |
| `geom_smooth()` | `stat_smooth` | Fitted trend line and confidence band |
| `geom_count()` | `stat_sum` | Number of points at each location |

Notice that several geoms default to `stat_identity`. That is the "do nothing" stat: it passes your data straight through without changing it. When you use `geom_point()`, the x and y you mapped are the x and y that get drawn, untouched.

![Each geom ships with a default stat that runs unless you override it.](screenshots/ggplot2-Stat-System-in-R-default-stats.webp)

*Figure 2: Each geom ships with a default stat that runs unless you override it.*

You can override any geom's default stat with the `stat` argument. The most famous case is turning `geom_bar()` off its counting behavior. If you already have summarised heights, you set `stat = "identity"` so the geom draws them as-is instead of counting. Let's prove that `geom_bar(stat = "identity")` and `geom_col()` are two names for the same thing.

```r title="Draw pre-summarised heights two ways"
drv_counts <- count(mpg, drv)

# Two ways to draw the same bars:
plot_identity <- ggplot(drv_counts, aes(x = drv, y = n)) +
  geom_bar(stat = "identity")

plot_col <- ggplot(drv_counts, aes(x = drv, y = n)) +
  geom_col()

plot_col
```

Both charts are identical. `geom_col()` is simply a convenient shortcut for `geom_bar(stat = "identity")`. The moment you switch the stat to identity, the geom stops counting and just draws the `n` column you gave it.

[NOTE]
**geom_bar counts, geom_col draws heights you supply.** Reach for geom_bar when you want ggplot2 to count rows for you, and geom_col (or geom_bar with stat set to identity) when your data already holds the numbers you want as bar heights. Choosing the wrong one is the most common bar-chart mistake in ggplot2.

**Try it:** The `mpg` dataset has a `cyl` column (number of cylinders). Count how many cars have each cylinder value, then draw those counts as bars using an identity stat so ggplot2 does not count again.

```r title="Your turn: draw counts with an identity stat"
# Goal: summarise first, then draw with stat = "identity".
# Step 1: cyl_counts <- count(mpg, cyl)
# Step 2: ggplot(cyl_counts, aes(x = cyl, y = n)) + geom_bar(stat = "identity")
# Print cyl_counts so you can see the numbers.
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Draw counts with an identity stat solution"
cyl_counts <- count(mpg, cyl)
cyl_counts
#> # A tibble: 4 × 2
#>     cyl     n
#>   <int> <int>
#> 1     4    81
#> 2     5     4
#> 3     6    79
#> 4     8    70

ggplot(cyl_counts, aes(x = cyl, y = n)) +
  geom_bar(stat = "identity")
```

**Explanation:** Because `cyl_counts` already holds the heights in column `n`, we switch off counting with `stat = "identity"`. If we had used a plain `geom_bar()` here, it would have counted the four summary rows and drawn four bars of height 1.

</details>

## What does stat_bin compute for a histogram?

A histogram is the clearest case of a geom that is almost entirely stat. There is nothing to draw until the stat slices the x axis into equal-width bins and counts how many observations fall into each one. The geom then draws one rectangle per bin. That slicing-and-counting is the job of `stat_bin`.

Let's build a histogram of highway mileage. We set `binwidth = 5`, meaning each bar spans a 5-mpg range, so the bins are easy to read.

```r title="Build a histogram with fixed bin width"
p_h <- ggplot(mpg, aes(x = hwy)) +
  geom_histogram(binwidth = 5)

p_h
```

Now x-ray it. The bin stat produces a rich table: for each bin it reports the center (`x`), the edges (`xmin`, `xmax`), the `count` of observations, and the `density` (count rescaled so the bars would integrate to 1).

```r title="X-ray the histogram bins"
layer_data(p_h)[, c("x", "xmin", "xmax", "count", "density")]
#>    x xmin xmax count      density
#> 1 10  7.5 12.5     5 0.0042735043
#> 2 15 12.5 17.5    50 0.0427350427
#> 3 20 17.5 22.5    43 0.0367521368
#> 4 25 22.5 27.5    81 0.0692307692
#> 5 30 27.5 32.5    44 0.0376068376
#> 6 35 32.5 37.5     8 0.0068376068
#> 7 40 37.5 42.5     1 0.0008547009
#> 8 45 42.5 47.5     2 0.0017094017
```

Read the fourth row: the bin from 22.5 to 27.5 mpg is centered at 25 and holds 81 cars, the busiest range in the data. Every bar's height in the plot is one of these `count` values. The bin stat also computed a `density` column for each bin, which we will put to use in the next section.

The `stat_bin` transformation exposes several **computed variables** you can tap into: `count` (observations per bin), `density` (count scaled to a probability density), `ncount` (count scaled so the tallest bar is 1), and `ndensity` (density scaled the same way). By default the geom uses `count` for the bar heights, because raw counts are the most natural thing to read.

[WARNING]
**A histogram with no binwidth defaults to 30 bins and warns you.** If you write geom_histogram() with no binwidth or bins argument, ggplot2 uses 30 bins and prints a message asking you to pick a better value. Always set binwidth or bins so your bins match the scale of your data.

**Try it:** Rebuild the highway-mileage histogram with a wider `binwidth` of 10, then use `layer_data()` to see how many bins you end up with. Wider bins mean fewer bars.

```r title="Your turn: widen the bins"
# Goal: change binwidth to 10 and inspect the resulting bins.
# Step 1: p_wide <- ggplot(mpg, aes(x = hwy)) + geom_histogram(binwidth = 10)
# Step 2: layer_data(p_wide)[, c("x", "xmin", "xmax", "count")]
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Widen the bins solution"
p_wide <- ggplot(mpg, aes(x = hwy)) + geom_histogram(binwidth = 10)
layer_data(p_wide)[, c("x", "xmin", "xmax", "count")]
#>    x xmin xmax count
#> 1 10    5   15    17
#> 2 20   15   25   116
#> 3 30   25   35    95
#> 4 40   35   45     6
```

**Explanation:** Doubling the bin width from 5 to 10 collapses the data into just four bins instead of eight. The stat recomputed everything: the busiest bin now spans 15 to 25 mpg and holds 116 cars. Bin width is the single most important choice you make with a histogram, because it changes what the stat computes.

</details>

## How do you use a stat's other outputs? (after_stat)

So far we have let each geom use its stat's default output: `geom_bar()` used `count`, the histogram used `count`. But you saw that stats compute several variables, not just one. What if you want the geom to draw a different one, like proportions instead of raw counts? That is exactly what `after_stat()` is for.

Picture the layer as a two-stage pipeline. In the first stage, before the stat runs, your `aes()` mapping picks which raw columns to feed in. In the second stage, after the stat runs, its computed variables become available, and `after_stat()` reaches into that second stage to grab one. The name is literal: it means "map this aesthetic using a value computed after the stat has run".

![after_stat picks a variable the stat computed and hands it to the geom.](screenshots/ggplot2-Stat-System-in-R-after-stat-flow.webp)

*Figure 3: after_stat() reaches back for a variable the stat computed and hands it to the geom.*

Let's turn our count bar chart into a proportion bar chart. We map the y aesthetic to `after_stat(prop)`, telling the bar to use the computed proportion for its height instead of the count. We also set `group = 1`, and you will see in a moment why that matters.

```r title="Draw a proportion bar chart with after_stat"
p_prop <- ggplot(mpg, aes(x = drv, y = after_stat(prop), group = 1)) +
  geom_bar()

p_prop
```

Now the bars sum to 1 instead of showing raw counts. Let's x-ray the layer to see the proportions the stat computed.

```r title="X-ray the computed proportions"
layer_data(p_prop)[, c("x", "count", "prop")]
#>   x count      prop
#> 1 1   103 0.4401709
#> 2 2   106 0.4529915
#> 3 3    25 0.1068376
```

The `prop` column now reads 0.44, 0.45, and 0.11: front-wheel drive makes up about 45 percent of the cars. Compare this to the very first x-ray in this tutorial, where `prop` was 1 for every bar. The difference is `group = 1`. Without it, ggplot2 treats each bar as its own group, so each bar is 100 percent of itself and every proportion is 1. Setting `group = 1` tells ggplot2 to treat all bars as one group, so the proportions are computed across the whole dataset.

[NOTE]
**The old dot-dot notation is deprecated in favor of after_stat().** You will see older tutorials write aes(y = ..prop..) or aes(y = ..count..) with two dots on each side. That syntax still works but is retired. Write after_stat(prop) and after_stat(count) instead, which read far more clearly.

**Try it:** Make a bar chart showing the proportion of cars in each `class`, using `after_stat(prop)`. Remember the `group = 1` trick so the proportions are computed across all classes.

```r title="Your turn: proportion by class"
# Goal: a bar chart of class where bar height is the proportion of all cars.
# Map y = after_stat(prop) and set group = 1 inside aes().
# Then x-ray with layer_data(...)[, c("x", "count", "prop")]
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Proportion by class solution"
p_class_prop <- ggplot(mpg, aes(x = class, y = after_stat(prop), group = 1)) +
  geom_bar()
layer_data(p_class_prop)[, c("x", "count", "prop")]
#>   x count       prop
#> 1 1     5 0.02136752
#> 2 2    47 0.20085470
#> 3 3    41 0.17521368
#> 4 4    11 0.04700855
#> 5 5    33 0.14102564
#> 6 6    35 0.14957265
#> 7 7    62 0.26495726
```

**Explanation:** The proportions now sum to 1 across the seven classes. SUV (`x = 7`) is the largest group at about 26 percent, while the 2-seater (`x = 1`) is just 2 percent. `after_stat(prop)` pulled the computed proportion out of the counting stat, and `group = 1` made those proportions relative to the whole dataset.

</details>

## Can you run your own function as a stat? (stat_summary)

The built-in stats cover counting, binning, and density, but sometimes you want a summary they do not offer, like the mean of each group. Rather than summarise your data by hand first, you can hand ggplot2 a function and let it run as the stat. That is what `stat_summary()` does: it is the bring-your-own-function escape hatch of the stat system.

Let's plot the mean highway mileage for each drive train. We pass `fun = mean` so the stat applies `mean()` to the `hwy` values in each group, and `geom = "point"` so it draws the result as a dot.

```r title="Plot group means with stat_summary"
p_sum <- ggplot(mpg, aes(x = drv, y = hwy)) +
  stat_summary(fun = mean, geom = "point")

p_sum
```

Three dots appear, one per drive train, each sitting at that group's mean mileage. Let's x-ray the layer and confirm those means with a plain dplyr calculation side by side.

```r title="X-ray the summary and cross-check with dplyr"
layer_data(p_sum)[, c("x", "y")]
#>   x        y
#> 1 1 19.17476
#> 2 2 28.16038
#> 3 3 21.00000

mpg |>
  group_by(drv) |>
  summarise(mean_hwy = mean(hwy), .groups = "drop")
#> # A tibble: 3 × 2
#>   drv   mean_hwy
#>   <chr>    <dbl>
#> 1 4         19.2
#> 2 f         28.2
#> 3 r         21
```

The stat's `y` values (19.17, 28.16, 21.00) match dplyr's group means exactly. `stat_summary()` ran `mean()` for us, grouped by `drv`, without a separate summarise step.

You are not limited to a single number per group. If your function returns three values (a center plus a lower and upper bound), the stat can draw an interval. The built-in helper `mean_se` does exactly this: it returns the mean and the mean plus or minus one standard error (a small number that says how precisely the group mean is estimated). Paired with a pointrange geom, it draws a dot with a whisker.

```r title="Draw means with error whiskers"
p_se <- ggplot(mpg, aes(x = drv, y = hwy)) +
  stat_summary(fun.data = mean_se, geom = "pointrange")

layer_data(p_se)[, c("x", "y", "ymin", "ymax")]
#>   x        y     ymin     ymax
#> 1 1 19.17476 18.77287 19.57664
#> 2 2 28.16038 27.75177 28.56899
#> 3 3 21.00000 20.26742 21.73258
```

Now each row carries a `y` (the mean) plus a `ymin` and `ymax` (the standard-error interval). The pointrange geom draws a dot at `y` with a line from `ymin` to `ymax`. The stat did the arithmetic; the geom drew the shape.

[TIP]
**Use fun for one value, fun.data for three.** Pass fun a function that returns a single number (like mean or median) when you only need a center. Pass fun.data a function that returns y, ymin, and ymax when you want an interval. Mixing them up is the usual reason a stat_summary call fails to draw what you expected.

**Try it:** Plot the **median** highway mileage per drive train as points, using `stat_summary()` with `fun = median`. It is the same pattern as the mean example, with one word changed.

```r title="Your turn: plot group medians"
# Goal: a point at the median hwy of each drv.
# Use stat_summary(fun = median, geom = "point").
# X-ray it with layer_data(...)[, c("x", "y")]
# Your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Plot group medians solution"
p_med <- ggplot(mpg, aes(x = drv, y = hwy)) +
  stat_summary(fun = median, geom = "point")
layer_data(p_med)[, c("x", "y")]
#>   x  y
#> 1 1 18
#> 2 2 28
#> 3 3 21
```

**Explanation:** Swapping `mean` for `median` is the only change. The stat now runs `median()` on each group's `hwy` values. Notice the medians (18, 28, 21) differ slightly from the means (19.17, 28.16, 21.00), which tells you the distributions are a little skewed.

</details>

## Putting It All Together: A Complete Example

Let's finish with a chart that uses three ideas from this tutorial at once: a counting stat for bar heights, `after_stat()` to convert those counts to proportions, and a second geom that reuses the same stat to add percentage labels. The goal is a clean, labelled proportion bar chart of drive trains.

The trick to the labels is that `geom_text()` can run the same counting stat as the bars. We set `stat = "count"` on the text layer and map its label to `after_stat(prop)`, formatted as a percentage. Both layers compute the same proportions independently, so the labels always sit at the right height.

```r title="Build a labelled proportion bar chart"
ggplot(mpg, aes(x = drv)) +
  geom_bar(aes(y = after_stat(prop), group = 1), fill = "steelblue") +
  geom_text(
    aes(y = after_stat(prop),
        label = paste0(round(after_stat(prop) * 100), "%"),
        group = 1),
    stat = "count",
    vjust = -0.5
  ) +
  labs(
    title = "Front and four-wheel drive dominate the mpg data",
    x = "Drive train",
    y = "Proportion of cars"
  ) +
  theme_minimal()
```

The result reads at a glance: front-wheel drive is 45 percent of the cars, four-wheel drive 44 percent, and rear-wheel drive just 11 percent. No summarise step, no manual math. Two geoms shared one counting stat, and `after_stat(prop)` turned raw counts into the proportions and the labels. That is the stat system doing the heavy lifting for you.

## Practice Exercises

These exercises combine several ideas from the tutorial. Try each one before opening the solution. To avoid overwriting the variables above, the solutions use fresh names.

### Exercise 1: Summarise, then draw with an identity stat

Compute the mean highway mileage for each `class` in `mpg` with dplyr, save it to `class_hwy`, then draw those means as a bar chart. Because you already have the heights, you must switch the bar geom off its default counting stat.

```r title="Exercise 1 starter"
# Step 1: class_hwy <- mpg |> group_by(class) |> summarise(mean_hwy = mean(hwy), .groups = "drop")
# Step 2: draw class_hwy as bars using an identity stat (or geom_col)
# Print class_hwy so you can see the numbers.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
class_hwy <- mpg |>
  group_by(class) |>
  summarise(mean_hwy = mean(hwy), .groups = "drop")

class_hwy
#> # A tibble: 7 × 2
#>   class      mean_hwy
#>   <chr>         <dbl>
#> 1 2seater        24.8
#> 2 compact        28.3
#> 3 midsize        27.3
#> 4 minivan        22.4
#> 5 pickup         16.9
#> 6 subcompact     28.1
#> 7 suv            18.1

ggplot(class_hwy, aes(x = class, y = mean_hwy)) +
  geom_bar(stat = "identity")
```

**Explanation:** The summarise step produces the seven mean values. Because `class_hwy` already holds heights in `mean_hwy`, we set `stat = "identity"` so the geom draws them directly. A plain `geom_bar()` would have counted the seven summary rows and drawn seven bars of height 1.

</details>

### Exercise 2: A percentage bar chart with after_stat

Draw a bar chart where each drive train's bar height is its share of all cars, expressed as a proportion. Do not summarise the data first. Instead, map the y aesthetic to a variable the counting stat computes, and remember the group trick so the proportions are relative to the whole dataset.

```r title="Exercise 2 starter"
# Goal: bar height = proportion of all cars in each drv.
# Hint: map y = after_stat(prop) and set group = 1.
# Verify with layer_data(...)[, c("x", "count", "prop")]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
p_share <- ggplot(mpg, aes(x = drv, y = after_stat(prop), group = 1)) +
  geom_bar()

layer_data(p_share)[, c("x", "count", "prop")]
#>   x count      prop
#> 1 1   103 0.4401709
#> 2 2   106 0.4529915
#> 3 3    25 0.1068376
```

**Explanation:** `after_stat(prop)` pulls the proportion out of the counting stat, and `group = 1` makes it relative to all 234 cars. The three proportions (0.44, 0.45, 0.11) sum to 1. This is the standard recipe for a relative-frequency bar chart in ggplot2.

</details>

### Exercise 3: Bring your own summary function

Write a function that takes a numeric vector and returns a one-row data frame with `y` (the mean), `ymin` (mean minus one standard deviation), and `ymax` (mean plus one standard deviation). Then feed it to `stat_summary()` with `fun.data` to draw a pointrange of highway mileage by drive train.

```r title="Exercise 3 starter"
# Step 1: write mean_sd(x) returning data.frame(y = mean, ymin = mean - sd, ymax = mean + sd)
# Step 2: stat_summary(fun.data = mean_sd, geom = "pointrange") on hwy by drv
# Verify with layer_data(...)[, c("x", "y", "ymin", "ymax")]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
mean_sd <- function(x) {
  m <- mean(x)
  s <- sd(x)
  data.frame(y = m, ymin = m - s, ymax = m + s)
}

p_sd <- ggplot(mpg, aes(x = drv, y = hwy)) +
  stat_summary(fun.data = mean_sd, geom = "pointrange")

layer_data(p_sd)[, c("x", "y", "ymin", "ymax")]
#>   x        y     ymin     ymax
#> 1 1 19.17476 15.09605 23.25346
#> 2 2 28.16038 23.95350 32.36726
#> 3 3 21.00000 17.33712 24.66288
```

**Explanation:** Your `mean_sd` function returns three numbers per group, which is exactly the shape `fun.data` expects. The stat runs it on each drive train's `hwy` values, and the pointrange geom draws a dot at `y` with a line spanning `ymin` to `ymax`. You just built a custom stat without writing any ggplot2 internals.

</details>

## Frequently Asked Questions

### What is the difference between a stat and a geom in ggplot2?

A geom is the shape that gets drawn: a bar, a point, a line. A stat is the computation that runs first and decides what numbers those shapes represent. `geom_bar()` draws rectangles, but its stat (`stat_count`) is what counts the rows to set each rectangle's height. Every layer has both: the stat transforms your data, then the geom draws the result.

### Why are all my proportion bars showing a height of 1 (100 percent)?

This is the most common `after_stat(prop)` surprise. By default ggplot2 treats each bar as its own group, and each bar is 100 percent of itself, so every proportion comes out as 1. Add `group = 1` inside `aes()` to tell ggplot2 to treat all the bars as a single group. The proportions are then computed across the whole dataset, so they sum to 1.

### How do I find out which computed variables a stat provides?

Two ways. Open the stat's help page (for example `?stat_bin`) and read its "Computed variables" section, which lists every column the stat makes. Or call `layer_data()` on a finished plot and look at the column names: every computed variable is a column in that table, so you can discover them by inspection.

### When should I use geom_bar() versus geom_col()?

Use `geom_bar()` when you want ggplot2 to count rows for you: one categorical column goes in, bar heights come out. Use `geom_col()` when your data already holds the heights you want, in a numeric column. `geom_col()` is exactly `geom_bar(stat = "identity")`, which switches off the counting stat so the geom draws the numbers you supply.

### What replaced the old ..count.. and ..prop.. notation?

Older ggplot2 code wrote `aes(y = ..count..)` or `aes(y = ..prop..)`, with two dots on each side, to reach a computed variable. That syntax still runs but is retired. Write `after_stat(count)` and `after_stat(prop)` instead, which say plainly that the value comes from after the stat has run.

## Summary

The stat system is the computation step that turns raw rows into the shapes you see. Once you know it is there, every geom becomes predictable: ask what its stat computes, and you know what it will draw.

| Concept | What to remember |
|---------|------------------|
| Stat | The computation step that runs inside every layer before the geom draws |
| Default stat | Each geom has one: `geom_bar` counts, `geom_histogram` bins, `geom_point` does nothing |
| `stat_identity` | The "do nothing" stat, used by `geom_point`, `geom_line`, and `geom_col` |
| `layer_data()` | X-rays a finished layer to reveal the exact table the geom received |
| Computed variables | Extra columns a stat makes, such as `count`, `prop`, `density` |
| `after_stat()` | Maps an aesthetic to a computed variable, like `y = after_stat(prop)` |
| `stat = "identity"` | Overrides a geom's default stat so it draws values you supply |
| `stat_summary()` | Runs your own function as a stat, using `fun` or `fun.data` |

![The ggplot2 stat system at a glance.](screenshots/ggplot2-Stat-System-in-R-overview-mindmap.webp)

*Figure 4: The ggplot2 stat system at a glance.*

The next time a geom surprises you, do not guess. Call `layer_data()` and read exactly what its stat computed. That single habit will make ggplot2 feel transparent instead of magical.

## References

1. Wickham, H., Navarro, D., & Pedersen, T. L., *ggplot2: Elegant Graphics for Data Analysis (3e)*, Chapter 13: Build a plot layer by layer. [Link](https://ggplot2-book.org/layers.html)
2. Wickham, H., Navarro, D., & Pedersen, T. L., *ggplot2: Elegant Graphics for Data Analysis (3e)*, Chapter 5: Statistical summaries. [Link](https://ggplot2-book.org/statistical-summaries.html)
3. ggplot2 documentation, Layer statistical transformations (stat reference index). [Link](https://ggplot2.tidyverse.org/reference/layer_stats.html)
4. ggplot2 documentation, `after_stat()`, `after_scale()`, and `stage()`. [Link](https://ggplot2.tidyverse.org/reference/aes_eval.html)
5. ggplot2 documentation, `stat_bin()` computed variables reference. [Link](https://ggplot2.tidyverse.org/reference/geom_histogram.html)
6. ggplot2 documentation, `stat_summary()` reference. [Link](https://ggplot2.tidyverse.org/reference/stat_summary.html)
7. R Core Team & ggplot2, `mpg` dataset documentation. [Link](https://ggplot2.tidyverse.org/reference/mpg.html)

## Continue Learning

- [The Grammar of Graphics](ggplot2-Grammar-of-Graphics.html), the layered theory behind ggplot2, and where the stat fits among data, aesthetics, geoms, and scales.
- [geom_smooth() in ggplot2](ggplot2-geom_smooth-in-R.html), a close look at one specific stat, `stat_smooth`, which fits a trend line and confidence band.
- [Distribution Charts in ggplot2](ggplot2-Distribution-Charts.html), histograms, density curves, and boxplots in practice, all powered by the stats you met here.
