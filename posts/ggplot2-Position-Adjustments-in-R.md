---
title: "Position Adjustments in ggplot2: Stack, Dodge, Jitter, Fill"
slug: "ggplot2-Position-Adjustments-in-R"
description: "Learn position adjustments in ggplot2: stack, fill, dodge, and jitter. See how each fixes overlapping bars and points, with runnable R code and a decision map."
keywords: "position adjustments ggplot2, position_stack, position_dodge, position_fill, position_jitter, position_jitterdodge, stacked bar chart in R, grouped bar chart ggplot2, jitter overplotting"
auto_link_terms: "position adjustments in ggplot2|position adjustments|position adjustment|position_dodge|position_stack|position_fill|position_jitter|stacked bar chart|grouped bar chart|percent stacked bar chart|dodge bars|jitter points"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-24"
curriculum_id: "GG2-3.4"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Position Adjustments"
sidebar_order: "57"
difficulty: "Intermediate"
---

<p class="lead">Position adjustments are the ggplot2 setting that decides what happens when two geoms land on the same spot: whether bars stack up, sit side by side, or turn into proportions, and whether crowded points spread out so you can see them. This tutorial uses the tidyverse (ggplot2 with a little dplyr) and the built-in <code>mpg</code> dataset, so you can run every chart in the box as you read.</p>

## What are position adjustments in ggplot2?

Every mark ggplot2 draws needs a coordinate. A bar needs an x position and a height, a point needs an x and a y. Those coordinates come from your `aes()` mapping. The trouble starts when several marks want the *same* coordinate: two bars that both belong above `"compact"`, or twenty points that all sit at `(20, 30)`. Something has to give. The `position` argument is the rule that decides what gives.

Let's start with the raw material. The `mpg` dataset ships with ggplot2 and records fuel economy for 234 car models. We will group cars by body `class` and by drivetrain `drv` (four-wheel, front and rear). Here is the count of cars in each combination, which is exactly what a bar chart will draw.

```r title="Load libraries and count the data"
library(ggplot2)
library(dplyr)

# How many cars of each drivetrain (drv) sit inside each body class?
mpg |> count(class, drv)
#> # A tibble: 12 × 3
#>    class      drv       n
#>    <chr>      <chr> <int>
#>  1 2seater    r         5
#>  2 compact    4        12
#>  3 compact    f        35
#>  4 midsize    4         3
#>  5 midsize    f        38
#>  6 minivan    f        11
#>  7 pickup     4        33
#>  8 subcompact 4         4
#>  9 subcompact f        22
#> 10 subcompact r         9
#> 11 suv        4        51
#> 12 suv        r        11
```

Read one row: there are 12 compact cars with four-wheel drive and 35 with front-wheel drive. Notice that both compact rows share the same x position on a chart (the `"compact"` tick). That shared position is the collision `position` has to resolve.

Now map `class` to the x-axis and `drv` to `fill`, then let `geom_bar()` count the rows for you. Because two `drv` values share each `class`, ggplot2 must decide how to place them. Watch what it does by default.

```r title="A default bar chart stacks the groups"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()
```

You get one bar per class, and inside each bar the drivetrains are stacked into colored segments. You never asked for stacking. It happened because `geom_bar()` carries a default position, and that default is `"stack"`. That single hidden setting is the whole topic of this tutorial.

[KEY INSIGHT]
**Position is a real layer of the grammar, not a cosmetic afterthought.** The same data and the same mapping can become a stacked bar, a grouped bar, or a percentage bar purely by changing `position`. Learning the four main choices lets you reshape a chart without touching your data.

**Try it:** Rebuild the chart with the mapping flipped, so drivetrain sits on the x-axis and each bar is filled by body class. Change the `aes()` below and run it.

```r title="Your turn: flip the mapping"
# Goal: put drv on the x-axis and fill by class.
# Edit the aes() so x = drv and fill = class, then run.
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Flip the mapping solution"
ggplot(mpg, aes(x = drv, fill = class)) +
  geom_bar()
```

**Explanation:** Only the `aes()` mapping changed. The `position = "stack"` default is still doing the stacking, now with drivetrains on the x-axis and body classes as the colored segments.

</details>

## How does position = "stack" stack bars?

Stacking is the default for bars, histograms, and areas, so it is the behavior you will see unless you say otherwise. Stack takes the groups that share an x position and piles them on top of one another. The height of the whole bar equals the group total, and each colored segment is one subgroup's count.

Because stack is already the default, writing it out changes nothing. It is worth doing once so you can see the setting clearly.

```r title="Stack is the default for bars"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "stack")
```

This looks identical to the plain `geom_bar()` from the last section, which is the point: the default *is* stack. The full height of the `suv` bar reaches 62, because 51 four-wheel-drive SUVs plus 11 rear-wheel-drive SUVs stack to 62.

There is one habit worth forming early. ggplot2 stacks from the top down in the order the legend lists, which often feels upside down: the first legend item ends up at the top of the bar rather than the bottom. You can flip the stacking order with `reverse = TRUE` inside `position_stack()`.

```r title="Reverse the stacking order"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = position_stack(reverse = TRUE))
```

Writing `position_stack(reverse = TRUE)` instead of the plain string `"stack"` is how you reach a position's options. Every position has a string shortcut and a matching function. The string is fine when defaults are fine; the function is how you pass arguments.

[WARNING]
**Stack order and legend order can disagree, and it confuses readers.** By default the segment that sits at the top of the bar is the first one named in the legend, which is the opposite of what most people expect. If your bars and legend feel mismatched, add `position_stack(reverse = TRUE)` so the bottom-to-top segment order matches the legend top-to-bottom.

**Try it:** Take the class-by-drivetrain bar and reverse its stack so the segment order matches the legend.

```r title="Your turn: reverse the stack"
# Goal: reverse the stacking order to match the legend.
# Add position = position_stack(reverse = TRUE) to geom_bar().
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Reverse the stack solution"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = position_stack(reverse = TRUE))
```

**Explanation:** `position_stack(reverse = TRUE)` keeps the totals identical but flips which subgroup sits at the bottom, so the visual order lines up with the legend.

</details>

## How does position = "fill" show proportions?

Stacking shows totals, but sometimes the total is a distraction. If you want to compare *composition*, the question is "what share of each class is front-wheel drive?", not "how many cars are there?". That is what `position = "fill"` answers. Fill stacks the bars exactly like stack, then rescales every bar to the same full height, so each bar reads as 100 percent and the segments read as shares.

It helps to see the numbers fill is drawing. The share of each drivetrain within a class is its count divided by the class total. Here is that calculation done by hand with dplyr.

```r title="What fill computes under the hood"
mpg |>
  count(class, drv) |>
  group_by(class) |>
  mutate(share = round(n / sum(n), 2)) |>
  ungroup()
#> # A tibble: 12 × 4
#>    class      drv       n share
#>    <chr>      <chr> <int> <dbl>
#>  1 2seater    r         5  1   
#>  2 compact    4        12  0.26
#>  3 compact    f        35  0.74
#>  4 midsize    4         3  0.07
#>  5 midsize    f        38  0.93
#>  6 minivan    f        11  1   
#>  7 pickup     4        33  1   
#>  8 subcompact 4         4  0.11
#>  9 subcompact f        22  0.63
#> 10 subcompact r         9  0.26
#> 11 suv        4        51  0.82
#> 12 suv        r        11  0.18
```

Compact cars are 26 percent four-wheel drive and 74 percent front-wheel drive, and those two shares add to 1. `position = "fill"` does this division for you and turns each share into a segment height. You do not need the dplyr step to draw the chart; it is here so you can see that fill is just stack plus a rescale.

```r title="Fill scales every bar to 100 percent"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = scales::percent) +
  labs(y = "Proportion")
```

Every bar now reaches the top, and the y-axis reads as percentages thanks to `scale_y_continuous(labels = scales::percent)`. This chart makes composition easy to compare across classes, even when the classes have wildly different totals.

[NOTE]
**Fill hides the totals, which is a strength and a trap.** A class with 5 cars and a class with 62 cars both become full-height bars, so a rare category can look as important as a common one. Use fill when share is the story, and keep a stacked or dodged view nearby when absolute counts matter.

**Try it:** Turn the stacked class-by-drivetrain bar into a proportional bar where every bar fills to 100 percent.

```r title="Your turn: percent bars"
# Goal: make each bar a full-height composition (shares, not counts).
# Set position = "fill" in geom_bar().
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Percent bars solution"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "fill")
```

**Explanation:** `position = "fill"` rescales each stacked bar to height 1, so the chart shows the share of each drivetrain within a class rather than raw counts.

</details>

## How does position = "dodge" place bars side by side?

Stacked bars are hard to compare below the bottom segment, because the middle and top segments do not start from a common baseline. When you want a clean magnitude comparison between subgroups, unstack them. `position = "dodge"` takes the bars that share an x position and sets them next to each other, each starting from zero.

```r title="Dodge places bars side by side"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge")
```

Now each class shows separate bars, one per drivetrain, all rising from the same baseline. Comparing the height of front-wheel drive across classes is now a straight eye-line along the bottom axis.

Dodge has one quirk worth knowing. When a class is missing a drivetrain, the remaining bars widen to fill the gap, so bars in different classes can end up different widths. That uneven look is usually not what you want. The fix is `preserve = "single"`, which keeps every bar the width of a single dodged bar.

```r title="Keep bar widths equal with preserve"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = position_dodge(preserve = "single"))
```

With `preserve = "single"`, a class with one drivetrain draws one normal-width bar instead of one fat bar, so widths stay consistent across the whole chart.

There is also a close cousin, `position_dodge2()`. It works out spacing from the data rather than from a grouping you supply, which makes it the better tool for boxplots and any geom whose elements can have different widths. For plain bars the two look similar; for boxplots, `dodge2` is the reliable choice.

```r title="position_dodge2 for varying widths"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = position_dodge2(preserve = "single"))
```

The figure below sums up the three bar positions you have now seen. It is the same `class` and `drv` mapping every time; only the position changes.

![The same mapping under stack, fill, and dodge positions](screenshots/ggplot2-Position-Adjustments-in-R-bar-positions.webp)

*Figure 1: The same class-by-drv mapping under three positions. Stack piles the segments; fill rescales each bar to 100 percent; dodge splits them side by side.*

[TIP]
**Reach for dodge2 when widths vary, and dodge when they do not.** Use `position_dodge()` for simple bars where every element is the same width. Use `position_dodge2()` for boxplots, violins, or any layer whose elements can differ in width, because it computes the side-by-side spacing straight from the data.

**Try it:** Un-stack the class-by-drivetrain bar so the drivetrains sit side by side within each class.

```r title="Your turn: dodge the bars"
# Goal: place the drv bars next to each other inside each class.
# Set position = "dodge".
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dodge the bars solution"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge")
```

**Explanation:** `position = "dodge"` moves the overlapping bars sideways so each drivetrain gets its own bar from a shared baseline, which makes direct height comparisons easy.

</details>

## How does position = "jitter" fix overplotting?

Bars are not the only marks that collide. Points do too, and the collision is sneakier because it hides how much data is there. When values are rounded or discrete, many points land on the exact same coordinate and pile into a single dot. Two hundred points can look like twenty. This is called overplotting.

The `mpg` dataset stores city and highway mileage as whole numbers, so a scatter of the two rounds many cars onto the same grid spot. Draw it plainly first.

```r title="Overplotted points hide density"
ggplot(mpg, aes(x = cty, y = hwy)) +
  geom_point()
```

The plot looks sparse, but it undercounts the data. Several cars share `cty = 20, hwy = 28`, yet you see one dot. `position = "jitter"` fixes this by adding a small random nudge to every point, so overlapping points fan out into a visible cluster. The convenience geom `geom_jitter()` is just `geom_point(position = "jitter")`.

```r title="geom_jitter spreads the points"
ggplot(mpg, aes(x = cty, y = hwy)) +
  geom_jitter()
```

Now the dense spots show as clumps of points instead of a single dot, and the real shape of the data appears. Jitter adds random noise, so the picture shifts a little every time you run it unless you fix the randomness. Set a seed first, and control how far points move with `width` and `height`.

```r title="Control the noise and set a seed"
set.seed(3)
ggplot(mpg, aes(x = cty, y = hwy)) +
  geom_point(position = position_jitter(width = 0.3, height = 0.3))
```

Here `width = 0.3` and `height = 0.3` keep the noise small, so points move just enough to separate without drifting far from their true values. `set.seed(3)` makes the exact scatter reproducible, so your chart looks the same each time and matches what a colleague sees.

[WARNING]
**Jitter moves your data, so use it with a light touch.** The points no longer sit at their true coordinates, which is fine for showing density but wrong for reading exact values. Keep `width` and `height` small, always call `set.seed()` before jittering so the result is reproducible, and never jitter a chart where precise position is the message.

**Try it:** Spread the overplotted city-versus-highway scatter so the crowded spots become visible.

```r title="Your turn: jitter the points"
# Goal: separate the overlapping points so density shows.
# Swap geom_point() for geom_jitter().
ggplot(mpg, aes(x = cty, y = hwy)) +
  geom_point()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Jitter the points solution"
set.seed(7)
ggplot(mpg, aes(x = cty, y = hwy)) +
  geom_jitter(width = 0.3, height = 0.3)
```

**Explanation:** `geom_jitter()` adds small random offsets so stacked points separate. Setting a seed and small width and height keeps the result reproducible and close to the true values.

</details>

## How do you jitter and dodge points together?

The most useful position is often a combination. A common request is to draw grouped boxplots and then scatter the raw points on top, so readers see the summary and the underlying data at once. That needs two things to happen together: the points must dodge into the right box, and they must jitter so they do not stack into a line. `position_jitterdodge()` does both.

Here we compare highway mileage across drivetrains, split by model year. The boxplots dodge by year, and the points dodge with them.

```r title="Jitter and dodge points at once"
set.seed(5)
ggplot(mpg, aes(x = drv, y = hwy, colour = factor(year))) +
  geom_boxplot(aes(fill = factor(year)), alpha = 0.4) +
  geom_point(position = position_jitterdodge(jitter.width = 0.15),
             size = 0.9) +
  labs(colour = "Year", fill = "Year")
```

Each drivetrain shows two boxes, one per year, and the raw points sit inside their own box with a little horizontal jitter so they do not overlap. Wrapping `year` in `factor()` is what creates those two boxes: `year` is stored as the numbers 1999 and 2008, so `factor()` turns them into two distinct groups to dodge instead of a continuous scale. `jitter.width = 0.15` keeps that spread narrow enough to stay inside the box.

There is one more small position that solves a different problem: nudging labels. When you add text to a chart, the label usually lands right on the mark and covers it. `position_nudge()` shifts the label by a fixed amount, which is perfect for floating a count just above each bar.

```r title="Nudge labels above bars"
nudge_df <- count(mpg, drv)

ggplot(nudge_df, aes(x = drv, y = n)) +
  geom_col() +
  geom_text(aes(label = n), position = position_nudge(y = 4))
```

The `position_nudge(y = 4)` lifts each count label four units up the y-axis, so the numbers float clear above the bars instead of sitting on the top edge.

[KEY INSIGHT]
**A position object is a reusable recipe you can hand to any layer.** Because `position_jitterdodge()` returns an object, the boxplots and the points can share the same dodging logic, which is why the points line up exactly over their boxes. Positions are not tied to one geom; they are portable rules you attach wherever a layer needs them.

**Try it:** Put raw points onto grouped boxplots of highway mileage by drivetrain, split by year.

```r title="Your turn: points on grouped boxplots"
# Goal: scatter the raw points onto the dodged boxplots.
# Add a geom_point layer that uses position_jitterdodge().
ggplot(mpg, aes(x = drv, y = hwy, fill = factor(year))) +
  geom_boxplot(alpha = 0.4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Points on grouped boxplots solution"
set.seed(11)
ggplot(mpg, aes(x = drv, y = hwy, fill = factor(year))) +
  geom_boxplot(alpha = 0.4) +
  geom_point(position = position_jitterdodge(jitter.width = 0.15), size = 0.8)
```

**Explanation:** `position_jitterdodge()` dodges each point into its year group and jitters it sideways, so the raw values land neatly inside their matching box.

</details>

## Which position adjustment should you use?

You now have every position in your toolkit. The choice always starts from one question: what is overlapping, and what do you want the reader to see? The table below turns that into a quick lookup.

| Your data | The question | Position |
|---|---|---|
| Bars sharing an x | What is each group's total? | stack (the default) |
| Bars sharing an x | What share does each part hold? | fill |
| Bars sharing an x | How do the subgroups compare? | dodge |
| Points piling up | Where is the data dense? | jitter |
| Points on grouped boxes | Show raw points per group? | jitterdodge |
| Text labels | Shift a label off its anchor? | nudge |

It also helps to know each geom's starting point, because the default is what you get before you type a single position.

| Geom | Default position |
|---|---|
| geom_bar and geom_histogram | stack |
| geom_col and geom_area | stack |
| geom_point | identity |
| geom_boxplot | dodge2 |
| geom_jitter | jitter |

The same logic reads well as a flow: name what overlaps, then pick from the branch that fits.

![Decision flow from overlap type to the right position adjustment](screenshots/ggplot2-Position-Adjustments-in-R-decision-flow.webp)

*Figure 2: Start from what overlaps. Stacked bars pick stack, fill, or dodge; piled points pick jitter or jitterdodge.*

[TIP]
**When nothing should move, name the do-nothing position explicitly.** `position = "identity"` leaves every mark exactly where its data puts it. It is the default for points and the right choice when you deliberately want overlapping bars to sit on top of one another, for example two semi-transparent distributions on one axis.

**Try it:** You want to compare the *share* of each drivetrain within each class, with every bar a full-height composition. Pick the right position.

```r title="Your turn: choose a position"
# Goal: each bar should be a 100% composition of drivetrain share.
# Change "stack" to the position that rescales bars to full height.
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "stack")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Choose a position solution"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "fill")
```

**Explanation:** Share within a group means proportions, and `position = "fill"` rescales each stacked bar to height 1, so every bar reads as 100 percent.

</details>

## A complete example: drivetrain mix by class

Let's put the pieces together into a chart you might actually ship: a labelled percentage bar showing the drivetrain mix inside each class. We will prepare the shares with dplyr, draw them with `position = "fill"`, and place a percentage label in the middle of each segment with `position_fill(vjust = 0.5)`.

First, compute the counts and the share of each drivetrain within each class.

```r title="Prepare the share of each drivetrain per class"
drv_share <- mpg |>
  count(class, drv) |>
  group_by(class) |>
  mutate(pct = n / sum(n)) |>
  ungroup()

head(drv_share)
#> # A tibble: 6 × 4
#>   class   drv       n    pct
#>   <chr>   <chr> <int>  <dbl>
#> 1 2seater r         5 1     
#> 2 compact 4        12 0.255 
#> 3 compact f        35 0.745 
#> 4 midsize 4         3 0.0732
#> 5 midsize f        38 0.927 
#> 6 minivan f        11 1     
```

The `pct` column holds each share as a decimal. Now draw the chart with `geom_col()`, which uses the `n` we already counted, and let `position = "fill"` turn those counts into a full-height composition. The trick for centered labels is to give `geom_text()` the same `position_fill()`, with `vjust = 0.5` so each label lands in the middle of its segment.

```r title="Labelled percent-stacked bar"
ggplot(drv_share, aes(x = class, y = n, fill = drv)) +
  geom_col(position = "fill") +
  geom_text(aes(label = scales::percent(pct, accuracy = 1)),
            position = position_fill(vjust = 0.5), size = 3) +
  scale_y_continuous(labels = scales::percent) +
  labs(y = "Share within class", x = "Class", fill = "Drive")
```

The result is a clean composition chart: every class fills to 100 percent, the segments show drivetrain share, and each segment carries its own percentage label centered inside it. The same `position_fill()` recipe drives both the bars and the labels, which is why the numbers sit exactly where the segments do.

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution, and use the distinct variable names given so your code does not clash with the examples above.

### Exercise 1: Percent bars with a percentage axis

Build a percent-stacked bar of drivetrain within each class, and format the y-axis as percentages from 0 to 100. Add clear axis and legend labels.

```r title="Exercise 1 starter"
# Build a percent-stacked bar of drv within each class,
# with the y-axis shown as percentages.
# Hint: position = "fill" plus scale_y_continuous(labels = scales::percent)

# Write your code below:
ggplot(mpg, aes(x = class, fill = drv))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = scales::percent) +
  labs(y = "Share within class", x = "Class", fill = "Drive")
```

**Explanation:** `position = "fill"` makes each bar a full-height composition, and `scale_y_continuous(labels = scales::percent)` relabels the 0-to-1 axis as percentages.

</details>

### Exercise 2: Grouped bars of a summary statistic

Sometimes the bar height is a computed number, not a count. First use dplyr to compute the mean highway mileage for each class and drivetrain into `my_summary`, then draw a dodged bar chart of those means with `geom_col()`.

```r title="Exercise 2 starter"
# Step 1 (given): mean hwy for each class and drv.
# Step 2: draw a dodged bar chart of mean_hwy by class, filled by drv.
# Hint: geom_col(position = "dodge")

my_summary <- mpg |>
  group_by(class, drv) |>
  summarise(mean_hwy = round(mean(hwy), 1), .groups = "drop")

# Write your plotting code below:
my_summary
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_summary <- mpg |>
  group_by(class, drv) |>
  summarise(mean_hwy = round(mean(hwy), 1), .groups = "drop")

my_summary
#> # A tibble: 12 × 3
#>    class      drv   mean_hwy
#>    <chr>      <chr>    <dbl>
#>  1 2seater    r         24.8
#>  2 compact    4         25.8
#>  3 compact    f         29.1
#>  4 midsize    4         24  
#>  5 midsize    f         27.6
#>  6 minivan    f         22.4
#>  7 pickup     4         16.9
#>  8 subcompact 4         26  
#>  9 subcompact f         30.5
#> 10 subcompact r         23.2
#> 11 suv        4         18.3
#> 12 suv        r         17.5

ggplot(my_summary, aes(x = class, y = mean_hwy, fill = drv)) +
  geom_col(position = "dodge") +
  labs(y = "Mean highway mpg", x = "Class", fill = "Drive")
```

**Explanation:** `geom_col()` uses your precomputed `mean_hwy` as the bar height, and `position = "dodge"` places each drivetrain's mean in its own bar for a direct comparison.

</details>

### Exercise 3: Raw points on grouped boxplots

Combine two layers and a compound position. Draw boxplots of highway mileage by drivetrain, split by model year, then scatter the raw points on top so each point sits inside its own box.

```r title="Exercise 3 starter"
# Overlay raw points on boxplots of hwy by drv, split by year.
# Keep the jitter narrow so points stay inside their box.
# Hint: geom_boxplot() then geom_point(position = position_jitterdodge()).

# Write your code below:
ggplot(mpg, aes(x = drv, y = hwy, fill = factor(year)))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(20)
ggplot(mpg, aes(x = drv, y = hwy, fill = factor(year))) +
  geom_boxplot(alpha = 0.5, outlier.shape = NA) +
  geom_point(position = position_jitterdodge(jitter.width = 0.15),
             size = 0.9, alpha = 0.6) +
  labs(y = "Highway mpg", x = "Drive", fill = "Year")
```

**Explanation:** `position_jitterdodge()` dodges each point into its year group and jitters it sideways. Setting `outlier.shape = NA` hides the boxplot outliers so they are not drawn twice, since the raw points already show them.

</details>

## Frequently Asked Questions About Position Adjustments

**What is the difference between position_dodge and position_dodge2?** `position_dodge()` needs a grouping (usually your `fill` or `colour` mapping) and spaces bars evenly based on it. `position_dodge2()` works out the spacing directly from the data, which lets it handle elements of different widths like boxplots and violins. For plain equal-width bars either works; for anything with variable widths, prefer `position_dodge2()`.

**Why did my dodged bars change width between groups?** When a group is missing a subgroup, plain dodge widens the remaining bars to fill the space, so widths look uneven across the chart. Add `preserve = "single"` inside `position_dodge()` or `position_dodge2()` to keep every bar the width of a single dodged bar.

**Does jitter change my underlying data?** Only for drawing. Jitter adds random offsets to where points are *plotted*, but your data frame is untouched. Because the offset is random, set a seed with `set.seed()` before the plot so the chart is reproducible, and keep the noise small so points stay near their true values.

**When should I use fill instead of stack?** Use stack when absolute totals matter and fill when you care about composition. Fill rescales every bar to the same height, so it is ideal for comparing shares across groups of very different sizes, but it deliberately hides the totals.

**Can I stack boxplots the way I stack bars?** No. Stacking only makes sense for geoms anchored to a baseline, like bars, areas, and histograms, where heights can add up. A boxplot summarizes a spread and has no baseline to stack from, which is why its default position is `dodge2`, not `stack`.

## Summary

Position adjustments resolve the collisions that happen when marks share a coordinate. Pick one by asking what overlaps and what you want to show.

| Position | Use it when | What it does |
|---|---|---|
| stack | Bars share an x and totals matter | Piles subgroups into one bar (the default) |
| fill | You care about share, not totals | Stacks then rescales each bar to 100 percent |
| dodge | You want to compare subgroups | Sets bars side by side from a shared baseline |
| jitter | Points overplot on discrete values | Adds small random noise so density shows |
| jitterdodge | Raw points over grouped boxplots | Dodges points into groups and jitters them |
| nudge | A label sits on top of its mark | Shifts the label by a fixed offset |

The mind map below shows the whole family at a glance.

![Overview map of the ggplot2 position adjustment family](screenshots/ggplot2-Position-Adjustments-in-R-overview-mindmap.webp)

*Figure 3: The position-adjustment family at a glance: positions for bars, positions for points and a nudge for labels.*

The through-line is simple: the same data and mapping can tell different stories depending on the position, so choose the position that matches the question you are answering.

## References

1. ggplot2 reference: `position_stack()` and `position_fill()`. [tidyverse.org reference](https://ggplot2.tidyverse.org/reference/position_stack.html)
2. ggplot2 reference: `position_dodge()`. [tidyverse.org reference](https://ggplot2.tidyverse.org/reference/position_dodge.html)
3. ggplot2 reference: `position_jitter()`. [tidyverse.org reference](https://ggplot2.tidyverse.org/reference/position_jitter.html)
4. ggplot2 reference: `position_jitterdodge()`. [tidyverse.org reference](https://ggplot2.tidyverse.org/reference/position_jitterdodge.html)
5. ggplot2 reference: the `mpg` dataset. [tidyverse.org reference](https://ggplot2.tidyverse.org/reference/mpg.html)
6. R Graph Gallery: grouped, stacked and percent-stacked barplots. [r-graph-gallery.com](https://r-graph-gallery.com/48-grouped-barplot-with-ggplot2.html)

## Continue Learning

- [ggplot2 Bar Charts](ggplot2-Bar-Charts.html): the geom where stack, fill, and dodge do most of their work, with more on ordering and coloring bars.
- [ggplot2 Scatter Plots](ggplot2-Scatter-Plots.html): where jitter earns its keep, plus other ways to handle overplotting like transparency and binning.
- [The Grammar of Graphics](ggplot2-Grammar-of-Graphics.html): how position fits alongside data, aesthetics, geoms, and scales as one of the seven building blocks of every ggplot2 chart.
